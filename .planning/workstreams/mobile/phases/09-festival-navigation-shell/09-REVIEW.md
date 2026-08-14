---
phase: 09-festival-navigation-shell
reviewed: 2026-08-14T20:45:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - apps/mobile/app/(auth)/_layout.tsx
  - apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx
  - apps/mobile/app/(profile-setup)/_layout.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/app/friend-detail.tsx
  - apps/mobile/components/FloatingNav.tsx
  - apps/mobile/lib/__tests__/festival-tab-naming.test.ts
  - apps/mobile/lib/__tests__/native-header-default.test.ts
  - apps/mobile/lib/__tests__/support/source-text.ts
  - apps/mobile/locales/de/messages.po
  - apps/mobile/locales/en/messages.po
  - docs/DEVELOPMENT_DECISIONS.md
findings:
  critical: 0
  warning: 2
  info: 5
  total: 7
status: issues_found
---

# Phase 9: Code Review Report — Incremental Gap-Closure Pass (09-07)

**Reviewed:** 2026-08-14
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found (no blockers)

> **Scope note:** This is the INCREMENTAL review of the phase-09 gap-closure plan 09-07
> (gaps G-09-2 native-header default and G-09-7 festival tab rename), covering commits
> `6c5d9a7..7c236a3` on top of diff base `8fd5bee`. The prior full-phase review pass
> (46 files) ran earlier today and is preserved in git history (superseded revision of
> this file). Changes were judged in the context of the whole files.

## Summary

The two gap closures are correct and well-guarded:

- **G-09-2 (native header default):** `screenOptions={{ headerShown: false }}` moved to the
  navigator level in the root `Stack` and added to the `(auth)`/`(profile-setup)` group Stacks;
  the four former per-screen options (`profil`/`friends-qr`/`friends-find`/`cashless`) are
  removed; `friend-detail` correctly turns its header back ON in its in-screen
  `<Stack.Screen options>` (its close button lives there — without `headerShown: true` the
  modal would have no way out, and the fix adds exactly that). I verified the `(auth)` screens
  keep their own back buttons and per-screen `headerShown: false`, so hiding the group's native
  headers removes no back affordance. All six `app/**/_layout.tsx` files satisfy the new guard.
- **G-09-7 (tab rename Live · quiks · Crew · Timetable · Karte):** route names/order unchanged
  (no deep-link or typed-route impact); each renamed msgid (`Live`/`Crew`/`Timetable`/`Map`)
  has exactly one call site (`FloatingNav.tsx`), so `Map → Karte` cannot leak to another
  surface; old `Dashboard`/`Activities` msgids are correctly obsoleted (`#~`) in both catalogs;
  the hardcoded `'quiks'` label complies with the documented brand-noun Lingui exception and
  carries the correct "no dot, no colour" tab form; the shared `Friends` msgid and the
  "Friends here" eyebrow are untouched, as pinned by tests. The ADR-014 amendment in
  `docs/DEVELOPMENT_DECISIONS.md` records the "Crew" reversal with its exact scope.

Verification performed: full mobile vitest suite 320/320 passing (incl. the 33 new tests),
ESLint clean on all changed files, `tsc --noEmit` clean, compiled Lingui catalogs confirmed
gitignored (`apps/mobile/.gitignore:46`) so no stale checked-in compile can ship the old labels.

The findings below are all in the new test infrastructure (guard robustness) and formatting —
nothing in the shipped app code is incorrect.

## Warnings

### WR-01: `NAVIGATOR_DEFAULT_PATTERN` is simultaneously over- and under-constrained

**File:** `apps/mobile/lib/__tests__/native-header-default.test.ts:45` (used at 77–86, 89–99)
**Issue:** The guard regex `/screenOptions=\{\{\s*headerShown:\s*false\s*\}\}/` requires
`headerShown: false` to be the ONLY key in `screenOptions`.

- *Over-strict (false failure):* the moment any layout legitimately adds a second navigator
  option — e.g. `screenOptions={{ headerShown: false, animation: 'fade' }}`, or the festival
  `Tabs` ever needing `tabBarStyle`/`lazy` — the test fails with the misleading message
  "renders a navigator with the header default off" even though the default IS off. The likely
  reflex fix at that point (per-navigator regex tweaks or deleting the assertion) erodes the
  guard this plan just built.
- *Under-strict (false pass):* the pattern matches ANYWHERE in the stripped source, not on the
  `<Stack|Tabs>` element the file-level non-vacuum check found. A layout containing two
  navigator elements where only one sets the default passes both assertions.

**Fix:** Loosen the key match and anchor it to a navigator element, e.g.:

```ts
const NAVIGATOR_DEFAULT_PATTERN =
  /<(Stack|Tabs)\b[^>]*screenOptions=\{\{[^}]*headerShown:\s*false/;
```

and for the root-layout "exactly one place" describe, keep a separate
`/headerShown:\s*(true|false)/` scan of the remainder (the current line-98 approach still works
with the loosened pattern).

### WR-02: `stripComments`/`stripLineComments` silently corrupt string literals containing `//` or `/*`, which can flip the negative guard assertions into vacuous passes

**File:** `apps/mobile/lib/__tests__/support/source-text.ts:38-57`
**Issue:** Two latent truncation paths in the helper that the guards' *negative* assertions
(`expect(...).not.toMatch(/headerShown/)` at native-header-default.test.ts:98,
`expect(source).not.toContain('LayoutDashboard')` at festival-tab-naming.test.ts:161-163)
depend on for meaning:

1. `stripLineComments` treats any `//` not immediately preceded by `:` as a comment start —
   a string literal like `replace('//', '/')`, a protocol-relative `'//cdn.example.com'`, or a
   glob `'app/**/friends'` truncates the rest of that line out of the guard input.
2. The block-comment regex `/\/\*[\s\S]*?\*\//g` fires on `/*` inside a string literal — e.g. a
   glob `'src/**/*.ts'` is mangled to `'src*.ts'` — and can eat everything from there to the
   next `*/` anywhere in the file, potentially swallowing the very code a positive assertion
   looks for (turning a "should contain" into a hard-to-diagnose failure) or the code a
   negative assertion should have seen (turning a "must not contain" into a silent false pass).

None of the currently guarded files trigger either path today (verified), but the helper is
positioned as the shared substrate for all future source-text guards, so the failure mode is
"a later edit silently disarms a guard" — the exact class of decay these tests exist to prevent.

**Fix:** Either document the two known limitations at the top of `stripComments` with a
"guarded files must not contain `//`/`/*` inside string literals" contract and add a defensive
assertion, or make the stripper string-aware (a small state machine tracking `'`/`"`/`` ` ``
context is ~20 lines and removes both traps):

```ts
// minimal contract check, cheap alternative to a full tokenizer:
if (/['"`][^'"`\n]*\/[*/]/.test(source)) {
  throw new Error('source-text stripper: string literal containing // or /* — extend stripComments first');
}
```

## Info

### IN-01: New test file fails the repo Prettier check

**File:** `apps/mobile/lib/__tests__/native-header-default.test.ts:49,54`
**Issue:** Two double-quoted string literals where the Prettier config (single quotes) demands
`'…'`; the root `pnpm format:check` fails on this brand-new file. (Note: `app/_layout.tsx`,
`(festival)/f/[festivalSlug]/_layout.tsx` and `friend-detail.tsx` also fail `format:check`, but
I verified all three were already Prettier-dirty at diff base `8fd5bee` — pre-existing debt,
not introduced by this diff.)
**Fix:** `npx prettier --write apps/mobile/lib/__tests__/native-header-default.test.ts`
(single-quote the two literals; escape the inner apostrophe-free strings as needed).

### IN-02: `parsePoCatalog` cannot parse multi-line msgstr — and the "old labels are gone" assertions would false-PASS on a parse miss

**File:** `apps/mobile/lib/__tests__/festival-tab-naming.test.ts:24-54` (consumed at 138-148)
**Issue:** The parser only matches single-line `msgstr "…"`. gettext/Lingui may reflow a long
entry across continuation lines; such an entry becomes invisible to the parser. For the
positive assertions that failure is loud (`toBe` mismatch), but the
`expect(deCatalog['Dashboard']).toBeUndefined()` style assertions (lines 138-148) convert a
parse miss into a false pass — "not parsed" is indistinguishable from "obsoleted". The
non-vacuum self-tests (lines 63-72) catch wholesale parser breakage but not a single reflowed
entry.
**Fix:** Add continuation-line support (append subsequent bare `"…"` lines to the last
msgid/msgstr), or assert absence against the raw source instead:
`expect(raw).not.toMatch(/^msgid "Dashboard"$/m)` (obsolete lines start `#~ msgid`, so the
anchored match distinguishes them).

### IN-03: Order-sensitive assertion on semantically unordered object keys

**File:** `apps/mobile/lib/__tests__/native-header-default.test.ts:103-110`
**Issue:** The T-09-25 guard requires `headerShown: true` to appear textually BEFORE
`presentation:` in `friend-detail.tsx`'s options object. Object key order is semantically
irrelevant here; a harmless reorder (or a Prettier/refactor pass) fails the test for no
behavioral reason.
**Fix:** Assert both keys exist within the same `options={{ … }}` block instead of asserting
relative order, e.g. match `/<Stack\.Screen\s+options=\{\{[\s\S]*?headerShown:\s*true[\s\S]*?\}\}/`
plus a separate `presentation: 'modal'` containment check.

### IN-04: EN activities-placeholder copy now diverges from the renamed tab

**File:** `apps/mobile/locales/en/messages.po` (msgids "Activities are on the way" /
"We're building this at quiks — for every festival, not just this one.")
**Issue:** The tab reads "quiks" in BOTH locales, but only the DE placeholder copy was renamed
(heading "quiks kommen noch", brand dropped from body). The EN heading still says
"Activities are on the way" — naming a tab label ("Activities") that no longer exists in either
locale. This is a recorded product decision (UAT-Entscheid 3, "DE only", Flagged Assumption 3;
pinned as such by festival-tab-naming.test.ts:102-124), so it is not a defect — but it is user-
visible drift that will read as a bug to an English-locale visitor.
**Fix:** When the EN copy pass happens, update the EN msgstr pair to mirror the DE decision
(e.g. heading "quiks are on the way", body without the brand mention) and extend the DE-only
test describes to both catalogs.

### IN-05: Per-screen `headerShown: false` in the (auth) screens is now doubly redundant

**File:** `apps/mobile/app/(auth)/welcome.tsx:40`, `email.tsx:83`, `verify.tsx:134` (context of
the reviewed `(auth)/_layout.tsx` change)
**Issue:** With the group navigator now defaulting `headerShown: false`, each auth screen's own
`options={{ headerShown: false, title: … }}` repeats the header flag (the `title` is still
load-bearing for iOS back-swipe/screen-reader labels and must stay). Harmless, but it recreates
in miniature the scattered-per-screen pattern G-09-2 just removed, and the new
native-header-default test does not cover per-screen options outside `_layout.tsx`/friend-detail,
so the redundancy will not decay loudly.
**Fix:** Optional cleanup outside this plan's scope: drop `headerShown: false` from the three
per-screen options blocks, keeping `title`.

---

_Reviewed: 2026-08-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard (incremental pass over diff 8fd5bee..7c236a3)_
