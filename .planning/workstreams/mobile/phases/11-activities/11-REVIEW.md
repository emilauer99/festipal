---
phase: 11-activities
reviewed: 2026-08-16T17:45:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - apps/mobile/lib/activity-form.ts
  - apps/mobile/lib/__tests__/activity-form.test.ts
  - apps/mobile/app/activity-create.tsx
  - apps/mobile/locales/de/messages.po
  - apps/mobile/locales/en/messages.po
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 11: Code Review Report (Gap Closure 11-06 — G-11-2/G-11-3)

**Reviewed:** 2026-08-16T17:45:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

> Scope: commits `d6a47f6`, `f011382`, `7d52ba3` on `feat/mobile-phase-11-activities`
> (diff base `1939c2a`). This REPLACES the prior full-phase 11-REVIEW.md (preserved in
> git history); the prior review's findings were already fixed. This review covers the
> NEW gap-closure changes: `resolveTitleOnTagChange` / `resolveSubmittedTitle`, their
> wiring into `activity-create.tsx`, and the locale catalog obsoletion.

## Narrative Findings (AI reviewer)

## Summary

The two new pure functions are logically sound, and their wiring into the create screen
is correct against the interaction contract "tag select writes an editable title, typed
text always survives":

- `resolveTitleOnTagChange` only touches the title when it is trimmed-empty or an exact
  raw-string match of the previous tag's label; every other value passes through. All
  branches — select, deselect, switch, whitespace-only, clone-mount, near-miss (` sport `)
  — are unit-tested. Verified: `npx vitest run lib/__tests__/activity-form.test.ts`
  → 39/39 pass.
- The chip handler computes `nextTag` exactly once, feeds it into a functional
  `setTitle((current) => …)` updater (so the latest title is read, not a stale closure),
  then writes `setSelectedTag(nextTag)` — tag and title state cannot diverge, and both
  writes batch in one event.
- `resolveSubmittedTitle` correctly mirrors `createActivityBodySchema.refine`
  (`packages/contracts/src/schemas.ts:111-125`): an untouched prefilled label submits
  `title: null` so the server's per-locale auto-title (ADR-012) is preserved; a trimmed
  non-label title ships explicit. Every reachable combination still satisfies the server
  refine, since the tag-carried null-title path always ships a `tagId`.
- The trim asymmetry between the two functions (strict raw match on tag change, trimmed
  match on submit) is deliberate, documented, and fails in the safe direction (typed text
  preserved on tag change; cosmetic-whitespace "edits" of the label do not freeze the
  locale on submit).
- Locale catalogs: the removed `{tagLabel} (used as the title automatically)` msgid is
  obsoleted with `#~` in BOTH `de` and `en` (standard `lingui extract` output, no
  hand-drift); the retained placeholder `e.g. beer pong by the pavilion` still exists
  and is translated in both catalogs; compiled `messages.js` files are gitignored, so
  no stale compiled artifact can ship. No new msgids were needed — all screen strings
  pre-existed. No hardcoded user-facing strings were introduced (G-11-2/i18n rule holds).

Two issues found, one of them introduced by this diff.

## Warnings

### WR-01: `activity-form.ts` fails the pinned Prettier check (new violation introduced by this diff)

**File:** `apps/mobile/lib/activity-form.ts:218`
**Issue:** The new `resolveSubmittedTitle` signature line is 102 characters, exceeding the
repo's Prettier `printWidth: 100`. `npx prettier --check lib/activity-form.ts` (Prettier
3.9.6, the exact version pinned in the root `package.json`) fails on this file, while
`activity-create.tsx` and the test file pass. CLAUDE.md declares the Prettier config
authoritative and requires lint to run before finishing a change — this line was
hand-formatted past the width and the check was evidently not run on this file.
**Fix:** Run `npx prettier --write lib/activity-form.ts`, which produces:
```ts
export function resolveSubmittedTitle(
  title: string,
  selectedTag: ActivityTag | null,
): string | null {
```
(Note: this will also reflow the pre-existing `CanSubmitActivityResult` union — see IN-02.)

### WR-02: Hidden subtitle state is silently submitted after tag deselect (pre-existing, adjacent to the new deselect path)

**File:** `apps/mobile/app/activity-create.tsx:270-272` (render) and `:214` (submit)
**Issue:** The Subtitle input only renders while a tag is selected (`{selectedTag ? <Input …/> : null}`),
but the `subtitle` state is neither cleared on deselect nor excluded from submit. Sequence:
select a tag → type a subtitle → deselect the tag (the new G-11-3 handler clears the
title, the subtitle field unmounts) → type a fresh title → submit. The activity is created
with a subtitle the user could not see, edit, or remove at submit time. This wiring
pre-dates the diff under review (the conditional render and the `trimmedSubtitle` submit
are unchanged), but the new deselect behavior is part of the same interaction path, so it
is recorded here rather than silently dropped.
**Fix:** Either clear the orphaned state when the tag row deselects, in the same handler
that resolves the title:
```ts
if (nextTag === null) setSubtitle('');
```
or exclude it at submit: `subtitle: selectedTag && trimmedSubtitle.length > 0 ? trimmedSubtitle : null`.
(Keeping the state across a select→deselect→re-select round trip is defensible; submitting
it invisibly is not — the submit-side guard preserves the round-trip behavior.)

## Info

### IN-01: Cloning an activity whose explicit title equals its tag label silently demotes it to tag-carried

**File:** `apps/mobile/lib/activity-form.ts:218-227` (with `buildClonePrefill`, `:144-155`)
**Issue:** A source activity that was created with an *explicit* title happening to equal
its tag's localized label (e.g. explicit title "Sport" + tag Sport) clones into a prefill
that is indistinguishable from a tag-carried one. On unchanged submit,
`resolveSubmittedTitle` returns `null`, so the clone becomes tag-carried and its title
turns locale-dynamic — a semantics change versus the source and versus the pre-diff
submit path (which shipped the trimmed title verbatim). The docstring documents the
null-on-exact-match branch as this plan's deliberate decision, and the demotion is
arguably an improvement (viewers regain translation), so this is informational — but it
is a real behavior change that on-device UAT for G-11-3 should be aware of.
**Fix:** None required; keep the documented trade-off. If exact fidelity ever matters,
the clone prefill would need to carry an `explicitTitle` marker from `ActivityDetail`.

### IN-02: Pre-existing Prettier drift in `CanSubmitActivityResult` (base commit also fails the check)

**File:** `apps/mobile/lib/activity-form.ts:38-40`
**Issue:** The two-line union formatting of `CanSubmitActivityResult` is also not what the
pinned Prettier 3.9.6 emits (it joins the union onto one line). Verified: the file at diff
base `1939c2a` already fails `prettier --check`, so this hunk is NOT introduced by the
commits under review — likely formatted under an earlier Prettier version. Recorded so
that the WR-01 `--write` run's second hunk is understood as drift repair, not noise.
**Fix:** Fixed automatically by the WR-01 `prettier --write` run.

### IN-03: No client-side `maxLength` mirrors of the contract's field caps (pre-existing)

**File:** `apps/mobile/app/activity-create.tsx:226-234, 271, 274-280`
**Issue:** `createActivityBodySchema` caps `title` at 80, `subtitle` at 120, `description`
at 2000 and `location` at 200 (`packages/contracts/src/schemas.ts:113-117`), but none of
the corresponding `Input`s pass the `maxLength` prop the shared `Input` component already
supports. Over-long input is only rejected server-side as a 400 — a status the contract's
`createActivity` responses do not even enumerate (201/404/409) — and surfaces to the user
only as the generic "Couldn't save — try again." Pre-existing (the submit path shipped the
same unbounded strings before this diff); the new tag-label prefill does not create a new
overflow path since tag labels are short.
**Fix:** Pass `maxLength={80}` / `{120}` / `{2000}` / `{200}` on the respective `Input`s.

---

_Reviewed: 2026-08-16T17:45:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
