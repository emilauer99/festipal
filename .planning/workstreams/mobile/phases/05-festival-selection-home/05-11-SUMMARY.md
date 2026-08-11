---
phase: 05-festival-selection-home
plan: 11
subsystem: mobile
tags: [react-native, expo, mmkv, vitest, tdd, cold-start, active-festival]

# Dependency graph
requires:
  - phase: 05-festival-selection-home
    provides: "05-09's active-festival-storage.ts (saveActiveFestivalSlug/getActiveFestivalSlug/clearActiveFestivalSlug), festivals.tsx handleEnter, home.tsx handleEnter, _layout.tsx cold-start read"
provides:
  - "nextActiveFestivalSlug — pure persist/clear reducer for on-enter festival sync"
  - "syncActiveFestivalOnEnter — single effectful persist/clear authority, replacing per-call-site saveActiveFestivalSlug calls"
  - "active-festival-entry.test.ts reproducing the G-05-5b-r2 stale-saved-slug regression"
affects: [cold-start-restore, festival-entry, active-festival-storage]

# Actuals (#2632)
actuals:
  tokens: 2165
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single persist/clear authority (syncActiveFestivalOnEnter) shared by every festival-home entry point instead of each call site independently deciding whether to persist"

key-files:
  created:
    - apps/mobile/lib/__tests__/active-festival-entry.test.ts
  modified:
    - apps/mobile/lib/active-festival-storage.ts
    - "apps/mobile/app/(tabs)/festivals.tsx"
    - "apps/mobile/app/(tabs)/home.tsx"

key-decisions:
  - "nextActiveFestivalSlug's return depends only on entered.saved (not prior) — an unsaved entry ALWAYS clears, reversing 05-09's 'only persist when saved' semantics that made the persisted slug a sticky 'last SAVED festival ever entered' value"
  - "syncActiveFestivalOnEnter is now the single persist/clear authority for both (tabs) entry points; home.tsx passes saved=true (behavior-preserving, since its cards are always listMyFestivals-sourced) purely so no future entry path can bypass the shared invariant by calling saveActiveFestivalSlug directly"
  - "_layout.tsx cold-start read left untouched — stays synchronous and offline-safe, per plan scope"

patterns-established:
  - "Persist/clear-on-enter decisions route through one pure+effectful helper pair (mirrors select-next-festival.ts's pure-fn-plus-caller idiom), not per-call-site persistence logic"

requirements-completed: [HOME-01, FEST-04]

coverage:
  - id: D1
    description: "nextActiveFestivalSlug pure reducer clears the persisted slug on an unsaved entry, including the exact stale-saved-slug regression scenario (prior='frequency-2026' + unsaved entry of a different festival -> undefined)"
    requirement: FEST-04
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/active-festival-entry.test.ts (5 tests, all describe rows from the plan's <behavior> table)"
        status: pass
    human_judgment: false
  - id: D2
    description: "festivals.tsx and home.tsx handleEnter both route through syncActiveFestivalOnEnter as the single persist/clear authority; no app/ production code calls saveActiveFestivalSlug directly on enter"
    requirement: HOME-01
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck && lint && test (69/69 passing, full suite)"
        status: pass
    human_judgment: false
  - id: D3
    description: "End-to-end cold-start behavior: entering a DIFFERENT unsaved festival after a previously-saved one clears the restore target (lands on Home), while entering a saved festival still restores it, on a real device across force-quit/relaunch"
    verification: []
    human_judgment: true
    rationale: "Requires an on-device force-quit + relaunch cycle (MMKV persistence across process kill) which cannot be exercised by the node-env Vitest runner; plan's own <verification> section defers this to /gsd-verify-work as UAT round 3."

duration: ~15min
completed: 2026-08-09
status: complete
---

# Phase 05 Plan 11: Gap Closure G-05-5b-r2 (stale-saved-slug cold-start regression) Summary

**Single persist/clear authority (`syncActiveFestivalOnEnter`) now clears the persisted active-festival slug on every unsaved festival entry, closing the regression where a previously-saved festival stayed stuck as the cold-start restore target forever.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-09T18:32:00Z (local)
- **Completed:** 2026-08-09T18:35:22Z (local)
- **Tasks:** 2 completed
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- Added `nextActiveFestivalSlug` — a pure reducer whose return depends only on `entered.saved`, so an unsaved entry unconditionally clears any prior slug instead of leaving it in place.
- Added `syncActiveFestivalOnEnter` — the single effectful persist/clear authority, routing through the existing error-swallowing `saveActiveFestivalSlug`/`clearActiveFestivalSlug` (offline-safe, gate-less, fully synchronous — `_layout.tsx`'s cold-start read is untouched).
- Reproduced the EXACT G-05-5b-r2 regression in a new unit test (`active-festival-entry.test.ts`) and followed the RED/GREEN TDD cycle: confirmed the naive "keep prior on unsaved" reducer (05-09's actual bug shape) fails the stale-slug case, then implemented the real fix and confirmed all 5 cases pass.
- Wired `festivals.tsx` `handleEnter` (Alle segment, mixed saved/unsaved rows) and `home.tsx` `handleEnter` (always-saved hero/rail) through the shared helper — `festivals.tsx` gets new behavior (clear-on-unsaved), `home.tsx` stays behavior-preserving (always persists, since its cards are always saved) but now shares the one invariant-owning code path.
- Confirmed via grep that no `app/` production code calls `saveActiveFestivalSlug` directly on enter anymore — only the helper module itself references it.

## Task Commits

Each task was committed atomically (Task 1 followed RED/GREEN TDD):

1. **Task 1 (RED): reproduce the regression** - `211ecd2` (test) — naive "keep prior on unsaved" reducer confirmed failing on the stale-slug case
2. **Task 1 (GREEN): fix the reducer + wire festivals.tsx** - `9cddf4f` (feat) — `nextActiveFestivalSlug` clears on unsaved; `syncActiveFestivalOnEnter` added; `festivals.tsx` handleEnter wired
3. **Task 2: route Home entry through the same helper** - `9828672` (feat) — `home.tsx` handleEnter now calls `syncActiveFestivalOnEnter(slug, true)`

_Note: Task 1 is `tdd="true"` — RED commit (`211ecd2`) precedes the GREEN commit (`9cddf4f`) in git log, satisfying the TDD gate sequence._

## Files Created/Modified
- `apps/mobile/lib/active-festival-storage.ts` - adds `nextActiveFestivalSlug` (pure reducer) and `syncActiveFestivalOnEnter` (effectful single persist/clear authority)
- `apps/mobile/lib/__tests__/active-festival-entry.test.ts` - new unit test reproducing the G-05-5b-r2 regression (5 cases covering the plan's full `<behavior>` table)
- `apps/mobile/app/(tabs)/festivals.tsx` - `handleEnter` now calls `syncActiveFestivalOnEnter(slug, saved)` instead of the old "only persist when saved" logic
- `apps/mobile/app/(tabs)/home.tsx` - `handleEnter` now calls `syncActiveFestivalOnEnter(slug, true)` instead of a direct `saveActiveFestivalSlug(slug)` call

## Decisions Made
- `nextActiveFestivalSlug` takes `prior` as a parameter purely for test narration; the return value depends only on `entered.saved` per the plan's `<behavior>` spec.
- `home.tsx` passes `saved: true` (not a computed value) since its hero/rail cards are exclusively sourced from `listMyFestivals` — this is explicitly behavior-preserving, done solely to make `syncActiveFestivalOnEnter` the single owner of the persist/clear invariant across every entry point (plan Task 2 rationale).
- Treated Task 1 (`type="tracer" tdd="true"`) as autonomous end-to-end verification (re-ran and confirmed the automated `<verify>` command passed) before proceeding to Task 2, per this plan's `autonomous: true` frontmatter and the absence of any `checkpoint:*` task — no interactive gate was warranted for a pure-function unit-test verify step.

## Deviations from Plan

None - plan executed exactly as written, including the TDD RED/GREEN sequence specified for Task 1.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- G-05-5b-r2 code fix complete and unit-tested; full mobile `typecheck`/`lint`/`test` suite green (69/69).
- Remaining work per this plan's own `<verification>` section: on-device UAT round 3 (force-quit + relaunch cycles for both the unsaved-entry-clears and saved-entry-restores scenarios) — deferred to `/gsd-verify-work`, consistent with this phase's established device-UAT convention (05-08, 05-09, 05-10).
- No blockers for the next `/gsd-verify-work` → `/gsd-secure-phase` → `/gsd-ship` sequence.

---
*Phase: 05-festival-selection-home*
*Completed: 2026-08-09*
