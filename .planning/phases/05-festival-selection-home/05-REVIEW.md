---
phase: 05-festival-selection-home
reviewed: 2026-08-06T13:36:05Z
depth: deep
files_reviewed: 29
files_reviewed_list:
  - apps/api/src/festival/festival.service.ts
  - apps/api/src/me/me.service.ts
  - apps/api/test/festival-isolation.spec.ts
  - apps/mobile/app.json
  - apps/mobile/app/(festival)/f/[festivalSlug].tsx
  - apps/mobile/app/(tabs)/_layout.tsx
  - apps/mobile/app/(tabs)/festivals.tsx
  - apps/mobile/app/(tabs)/home.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/components/ComingSoonTile.tsx
  - apps/mobile/components/FestivalCard.tsx
  - apps/mobile/components/FloatingNav.tsx
  - apps/mobile/components/SegmentedControl.tsx
  - apps/mobile/lib/__tests__/date-range.test.ts
  - apps/mobile/lib/__tests__/select-next-festival.test.ts
  - apps/mobile/lib/active-festival-storage.ts
  - apps/mobile/lib/date-range.ts
  - apps/mobile/lib/festival-navigation.ts
  - apps/mobile/lib/festival-queries.ts
  - apps/mobile/lib/select-next-festival.ts
  - apps/mobile/locales/de/messages.po
  - apps/mobile/locales/en/messages.po
  - apps/mobile/package.json
  - packages/contracts/src/schemas.ts
  - packages/db/drizzle/0003_omniscient_meteorite.sql
  - packages/db/drizzle/meta/0003_snapshot.json
  - packages/db/drizzle/meta/_journal.json
  - packages/db/scripts/seed.ts
  - packages/db/src/schema/festival.ts
  - packages/ui/src/tokens.ts
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-08-06T13:36:05Z
**Depth:** deep
**Files Reviewed:** 29
**Status:** issues_found

## Summary

Reviewed the festival-selection-home phase: the API-side `startDate`/`endDate`/`place` field
propagation (`festival.service.ts`, `me.service.ts`), the `packages/contracts`/`packages/db`
schema + migration for those fields, the SEC-02 tenant-isolation spec, and the full mobile
surface (Home tab, Festivals tab with Meine/Alle segments, festival-home screen, FloatingNav,
FestivalCard, SegmentedControl, active-festival persistence, date-range/hero-ordering pure libs
and their unit tests) plus the two Lingui catalogs.

The backend/contracts/db slice is clean — the new date/place fields are threaded through
`getBySlug`/`listAll`/`listMyFestivals` consistently, the drift-detection Zod composition on
`festivalSelectSchema` is sound, the migration is a safe additive `ADD COLUMN` (nullable, no
backfill), and the SEC-02 isolation spec's assertions are solid (byte-level `JSON.stringify`
non-leak checks, not just array-length checks). `tsc --noEmit` and the mobile Vitest suite
(52 tests) both pass clean.

The mobile UI surface has one confirmed, provable regression: two of the four newly-added
strings for the app's always-visible tab bar (`FloatingNav`) were left untranslated in the
German catalog and — verified by actually running `lingui compile` — silently fall back to
their English source text rather than failing the build, so German-locale users see
`Home`/`Friends`/`Profile`/`coming soon` in English inside an otherwise fully German shell, and
this ships silently unless `lingui compile --strict` is added to the pipeline. Two further
robustness issues were found by tracing the Save-mutation/optimistic-cache and MMKV
persistence call chains across `festivals.tsx`, `home.tsx`, `[festivalSlug].tsx`, and
`_layout.tsx`.

## Critical Issues

### CR-01: Four newly-added strings ship untranslated (English) in the German catalog, exposed on every screen via the tab bar

**File:** `apps/mobile/locales/de/messages.po:88-90,158-160,170-172,235-237`
**Issue:**
This phase adds four new msgids to both catalogs (`coming soon`, `Home`, `Friends`, `Profile`,
all sourced from `components/FloatingNav.tsx`). In `locales/de/messages.po` all four have an
**empty** `msgstr`:

```po
#: components/FloatingNav.tsx
msgid "coming soon"
msgstr ""
...
#: components/FloatingNav.tsx
msgid "Home"
msgstr ""
...
#: components/FloatingNav.tsx
msgid "Friends"
msgstr ""
...
#: components/FloatingNav.tsx
msgid "Profile"
msgstr ""
```

This is not a hypothetical — I ran the actual build step (`npx lingui compile`) and confirmed
the compiled `locales/de/messages.js` catalog embeds the English source strings verbatim for
these four ids (`"i0qMbr":["Home"]`, `"tBmnPU":["Friends"]`, `"vERlcd":["Profile"]`,
`"KMnlsQ":["coming soon"]`), i.e. Lingui's default (non-strict) compile silently falls back to
the English source rather than erroring. Running `npx lingui compile --strict` fails with
`Missing 4 translation(s)`, confirming these are genuinely untranslated and that the project's
current `"compile": "lingui compile"` script (no `--strict`) will not catch this in CI.

`Home`/`Friends`/`Profile` are the labels under 3 of the 4 always-visible `FloatingNav` tab-bar
items (`components/FloatingNav.tsx:77,107-116`, rendered on every authenticated screen), and
`coming soon` feeds the a11y label for the two decorative items
(`components/FloatingNav.tsx:51,148`: `` `${label} — ${comingSoonSuffix}` ``). This directly
violates the project's non-negotiable "i18n from day 1 — no hardcoded user-facing strings" rule
(CLAUDE.md) for the one navigation surface that is visible on literally every authenticated
screen, for the app's primary target locale (an Austrian festival app, German-default festival
seed data).

**Fix:**
Translate the four strings in `apps/mobile/locales/de/messages.po` (e.g. `Home` → `Start` or
keep `Home` as an intentional loanword *only if that's a deliberate product decision*, `Friends`
→ `Freunde`, `Profile` → `Profil`, `coming soon` → `bald verfügbar`), then add a `--strict` (or
equivalent CI) gate so an incomplete catalog fails the build instead of silently falling back to
English:

```jsonc
// package.json
"compile": "lingui compile --strict"
```
```po
msgid "Home"
msgstr "Start"

msgid "Friends"
msgstr "Freunde"

msgid "Profile"
msgstr "Profil"

msgid "coming soon"
msgstr "bald verfügbar"
```

## Warnings

### WR-01: Concurrent Save mutations can roll back a *different* festival's in-flight optimistic cache entry

**File:** `apps/mobile/app/(tabs)/festivals.tsx:134-185`
**Issue:**
`festivals.tsx` uses a single shared `saveMutation` (`useMutation(...)`) for every `FestivalCard`
Save tap. Per-mutation-call state (`onMutate`/`onError`) closes over the `festivalKeys.mine`
cache, but `onError`'s rollback restores the *exact* `previous` snapshot captured at the start of
*that specific call* (line 152: `queryClient.getQueryData<CachedResponse>(festivalKeys.mine)`),
not a merge against the current cache state.

Trace: user taps Save on festival A (`onMutate` captures `previous = [X]`, optimistically writes
`[X, A]`); before A's request settles, the user taps Save on festival B (`onMutate` captures
`previous = [X, A]`, optimistically writes `[X, A, B]`). If A's save then fails (e.g. a
409 `profile-required` race, or a transient network error), A's `onError` runs
`queryClient.setQueryData(festivalKeys.mine, context.previous)` — restoring `[X]`, which wipes
out B's still-in-flight (or already-succeeded) optimistic entry until B's own `onSettled`
eventually re-invalidates and refetches. Between A's rollback and B's refetch resolving, the UI
will show festival B as unsaved even though the save may already have (or will) succeed
server-side — a visible, avoidable flicker/inconsistency caused by one mutation's failure
clobbering another's independent optimistic state.

**Fix:** Rather than restoring a raw snapshot, reconcile against the *current* cache by removing
only the entry this specific mutation added (when it was the one that added it), e.g. key the
rollback off `festival.id` instead of a full-array snapshot:

```ts
onError: (_error, festival) => {
  queryClient.setQueryData<CachedResponse>(festivalKeys.mine, (current) => {
    if (current?.status !== 200 || !Array.isArray(current.body)) return current;
    return { status: 200, body: current.body.filter((f) => f.id !== festival.id) };
  });
  setSaveError(t`Couldn't save festival — try again.`);
},
```

### WR-02: Inconsistent guarding around synchronous MMKV storage calls — only one of four call sites protects the "entry must never dead-end" guarantee

**File:** `apps/mobile/app/(tabs)/festivals.tsx:194-200,82-102`, `apps/mobile/app/(festival)/f/[festivalSlug].tsx:93-98`, `apps/mobile/app/_layout.tsx:206-227`
**Issue:**
`apps/mobile/app/(tabs)/home.tsx:75-85` explicitly wraps `saveActiveFestivalSlug(slug)` in a
`try { … } catch { /* Persistence is a nicety … entry itself never depends on it succeeding. */ }`
specifically because entry into a festival must be gate-less and non-dead-ending even if the
MMKV write throws. That guarantee is **not** applied consistently to the other call sites added
in this same phase:

- `festivals.tsx:194-200` `handleEnter` calls `saveActiveFestivalSlug(slug)` unguarded before
  `router.push` — an MMKV write failure here throws uncaught in the press handler and can block
  the very "gate-less entry" navigation the code is trying to guarantee.
- `festivals.tsx:82-102` `handleLogout`'s `clearActiveFestivalSlug()` (line 99) is unguarded.
- `[festivalSlug].tsx:93-98`'s `useEffect` calls `getActiveFestivalSlug()` /
  `clearActiveFestivalSlug()` unguarded.
- `_layout.tsx:206-227`'s cold-start redirect effect calls `getActiveFestivalSlug()` (line 220)
  unguarded — this is the one place a throw would be most damaging, since it sits between the
  auth-guard resolving to `'authenticated'` and the app's first real navigation.

**Fix:** Apply the same `try { … } catch { … }` (or a small shared `safeMmkvRead`/`safeMmkvWrite`
helper in `active-festival-storage.ts` itself, so every caller gets the guarantee for free
instead of relying on each call site remembering to wrap it) consistently at all four sites.

## Info

### IN-01: Two parallel, overlapping radius token systems used inconsistently within this phase's own new files

**File:** `packages/ui/src/tokens.ts:54-70`, `apps/mobile/app/(tabs)/festivals.tsx:379`, `apps/mobile/app/(tabs)/home.tsx:247`, `apps/mobile/app/(festival)/f/[festivalSlug].tsx:221`
**Issue:** `tokens.ts` exports both a legacy `radii` map (`radii.pill = 999`) and a newer
`radiiScale` ramp (`radiiScale['r-pill'] = 999`) with the same numeric value under different
keys. This phase's new files pick different ones for the identical pill shape:
`festivals.tsx:379` uses `radii.pill`, while `home.tsx:247` and `[festivalSlug].tsx:221` use
`radiiScale['r-pill']`. Functionally identical today, but two competing token systems for the
same value is a maintenance trap — a future change to one ramp but not the other silently
desyncs previously-identical UI.
**Fix:** Standardize new code on `radiiScale` (the documented "real brand radii ramp") and treat
`radii` as legacy/deprecated, or explicitly document why both are still needed.

### IN-02: `FloatingNav`'s unknown-route fallback silently mislabels rather than failing loudly

**File:** `apps/mobile/components/FloatingNav.tsx:28-30,75-77`
**Issue:** `isLiveRouteName` narrows `route.name` to `'home' | 'festivals'`; any route name
outside that set silently falls back to `'home'` (`const routeName = isLiveRouteName(route.name) ? route.name : 'home';`), reusing the Home icon/label for it. This is currently unreachable
(only `home`/`festivals` are registered `Tabs.Screen`s in `(tabs)/_layout.tsx`), but if a future
phase adds a third live tab without updating `LIVE_TAB_ICON`/`isLiveRouteName`, it will render as
a second, mislabeled "Home" tab rather than surfacing a visible error during development.
**Fix:** Consider a dev-time `console.error`/assertion in the `else` branch (or throwing in
`__DEV__`) so a missed update is caught immediately instead of shipping a silently-wrong tab.

---

_Reviewed: 2026-08-06T13:36:05Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
