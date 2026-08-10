---
phase: 05-festival-selection-home
plan: 06
subsystem: ui
tags: [react-native, expo-router, tanstack-query, optimistic-update, lingui, ts-rest]

requires:
  - phase: 05-03
    provides: festivalKeys/unwrapOk shared query helpers, active-festival-storage, formatDateRange
  - phase: 05-04
    provides: FestivalCard + SegmentedControl owned primitives
  - phase: 05-05
    provides: (tabs) group shell with the moved Festivals screen
provides:
  - Meine/Alle segmented festival browse/save screen (D-05) replacing the flat single-list festivals.tsx
  - Cross-tab segment=all search-param contract for 05-07's Home CTA/rail navigation target
  - Optimistic, server-backed one-tap save with in-flight guard, rollback, and error surface (FEST-03)
affects: [05-07-home-tab]

actuals:
  tokens: 8500
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Per-segment SegmentViewState discriminated union (loading/error/empty/data) computed from two independent useQuery results, replacing ad-hoc status checks"
    - "Synchronous useRef in-flight Set as the double-tap guard, mirrored into render state for the FestivalCard `saving` prop"
    - "unwrapOk-wrapped mutationFn so a non-200 ts-rest response becomes a real mutation rejection (onError actually fires)"

key-files:
  created: []
  modified:
    - apps/mobile/app/(tabs)/festivals.tsx
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "Task 1/Task 2 split as two sequential commits on the same file: Task 1 ships the segmented list with a simple non-optimistic save (typecheck+lint verified), Task 2 replaces it with the full optimistic onMutate/onError/onSettled dance — keeps each commit atomic and independently buildable per the plan's own two-task structure."
  - "handleSave/onSave takes the full Festival row (not just an id) — FestivalCard's onSave fires from a render loop that already holds the row from the correct cache (festivalKeys.all in the Alle segment), so the 'all-list row must exist before mutate' plan requirement is satisfied structurally rather than via a second cache lookup inside onMutate."
  - "onError restores the exact prior snapshot via context.previous; when that snapshot was undefined (mine cache never fetched yet), removeQueries resets it instead of setQueryData(key, undefined), avoiding relying on react-query's undefined-write semantics."
  - "New save-error copy ('Couldn't save festival — try again.') authored fresh (not in UI-SPEC Copywriting Contract) matching the existing sentence-case/no-emoji error voice; DE: 'Konnte nicht gespeichert werden — versuch's nochmal.'"
  - "Segment re-sync effect only fires when the normalized segment=all param value itself changes (not on every render), so manual SegmentedControl taps are never overridden by a stale param."

patterns-established:
  - "SegmentViewState discriminated union for multi-query per-segment loading/error/empty/data derivation (reusable if a third segment/screen needs the same dependent-query pattern)"

requirements-completed: [FEST-01, FEST-02, FEST-03]

coverage:
  - id: D1
    description: "Festivals tab renders a Meine/Alle SegmentedControl (default Meine, driven by a typed segment search param) over listFestivals/listMyFestivals, with saved festivals visually distinguished via a client-derived savedIds Set and per-segment empty/loading/error states"
    requirement: "FEST-01"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint"
        status: pass
    human_judgment: true
    rationale: "Visual/interaction correctness (segment default, badge rendering, empty-state CTA) requires on-device verification; apps/mobile's Vitest scope is pure lib/ functions only, no RN component test harness exists in this project. Logged as WINDOWS.md unrun-verify entries."
  - id: D2
    description: "Tapping Save on an unsaved FestivalCard saves it optimistically via a server-backed useMutation (unwrapOk-throwing mutationFn, dedupe-by-id insert into an initialized mine cache, synchronous per-id in-flight guard, exact-snapshot rollback + localized error on failure, onSettled invalidation)"
    requirement: "FEST-03"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint"
        status: pass
      - kind: integration
        ref: "apps/api/test/save-idempotency.spec.ts (via pnpm --filter @festipal/api test, 45/45 passing)"
        status: pass
    human_judgment: true
    rationale: "The optimistic/rollback/restart-survival behavior (badge flips immediately, force-quit persistence, double-tap yields one save, simulated-failure rollback+error) is a client React Query state machine with no automated RN test harness in this project; the API-side idempotency contract it depends on is proven, but the client dance itself needs on-device verification. Logged as a WINDOWS.md unrun-verify entry."

duration: ~15min
completed: 2026-08-06
status: complete
---

# Phase 5 Plan 6: Meine/Alle Segmented Festival List + Optimistic Save Summary

**Rewrote the flat Festivals screen into a Meine/Alle segmented list over `listFestivals`/`listMyFestivals` with client-derived saved-state, and upgraded Save from a session-local Set to a full optimistic, server-backed `useMutation` that survives app restart (FEST-03).**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-06T14:25:43+02:00 (after 05-05's completion commit)
- **Completed:** 2026-08-06T14:40:06+02:00
- **Tasks:** 2
- **Files modified:** 3 (`app/(tabs)/festivals.tsx` + both locale catalogs)

## Accomplishments

- `(tabs)/festivals.tsx` now renders a `SegmentedControl` (Meine/Alle, default Meine) as the top
  anchor, initialized from a typed `segment=all` search param that 05-07's Home CTA/rail will
  target, and stays locally authoritative afterward.
- `savedIds` is a client-derived `Set` from `listMyFestivals` (Pattern 3, no server-side saved
  flag); Alle only renders once both `listFestivals` and `listMyFestivals` succeed, avoiding a
  frame where saved rows briefly show as unsaved.
- Save is a `useMutation` whose `mutationFn` unwraps the ts-rest response with `unwrapOk` (throws
  on non-200), `onMutate` optimistically inserts into an initialized-if-absent, deduped mine
  cache, `onError` restores the exact prior snapshot and surfaces a localized error, and
  `onSettled` always invalidates `['me','festivals']` so the idempotent server reconciles.
- A synchronous `useRef` in-flight guard prevents a same-festival double-tap from enqueuing two
  saves while still allowing two different festivals to save concurrently; mirrored into
  `FestivalCard`'s `saving` prop.
- Per-segment empty states (Meine: "Zu Alle wechseln" CTA switches the segment locally, no
  navigation; Alle: new copy) and the existing loading/error text patterns are reused verbatim.
- `apps/api` test suite (45/45, incl. `save-idempotency.spec.ts`) stays green — the server side of
  the save contract this client mutation depends on is unchanged and proven.

## Task Commits

Each task was committed atomically:

1. **Task 1: Meine/Alle segmented list with client-derived saved distinction** - `3bbcd59` (feat)
2. **Task 2: One-tap optimistic server-backed save (FEST-03)** - `60df06d` (feat)

**Interstitial docs commit:** `c9204a0` (docs — deviation tracking, see below)

**Plan metadata:** _(this commit, following this summary)_

## Files Created/Modified

- `apps/mobile/app/(tabs)/festivals.tsx` - Meine/Alle segmented festival list + optimistic
  server-backed save, composed over `FestivalCard` + `SegmentedControl`
- `apps/mobile/locales/de/messages.po` - translated this plan's 7 new msgids (Mine/All labels,
  both empty-state title/body/CTA rows, save-error copy)
- `apps/mobile/locales/en/messages.po` - extracted the same 7 new source msgids

## Decisions Made

- Split the file rewrite into two atomic commits matching the plan's two tasks: Task 1 ships the
  segmented list with a simple non-optimistic save (own typecheck/lint pass), Task 2 replaces the
  save mutation with the full optimistic dance — each commit independently typechecks/lints.
- `onSave`/`handleSave` takes the full `Festival` row (not just an id), since the render loop
  already holds it from the correct cache — satisfies the plan's "all-list row must exist before
  mutate" requirement structurally instead of via a second cache lookup.
- `onError`'s "restore the exact prior snapshot, including when it was previously absent" is
  implemented as `removeQueries` (not `setQueryData(key, undefined)`) for the absent case, to
  avoid depending on react-query's undefined-write semantics.
- Authored a new save-error string ("Couldn't save festival — try again." / DE: "Konnte nicht
  gespeichert werden — versuch's nochmal.") since the UI-SPEC Copywriting Contract has no row for
  this case; matches the existing sentence-case/no-emoji error voice.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written for both tasks.

### Scope-boundary discoveries (logged, not fixed)

**1. Pre-existing untranslated DE msgids from 05-05's `FloatingNav.tsx`**
- **Found during:** Task 1's `pnpm --filter @festipal/mobile extract` run (catalog stats showed 10
  missing before translating this task's own 6 new msgids; 4 remained after).
- **Issue:** `"Home"`, `"Friends"`, `"Profile"`, `"coming soon"` all have an empty `msgstr ""` in
  `apps/mobile/locales/de/messages.po` — a real I18N-01 gap (renders English on a German-locale
  device) but not caused by this task's changes.
- **Action:** Left untranslated (out of scope, Rule "only auto-fix issues directly caused by the
  current task's changes"); logged to `.planning/phases/05-festival-selection-home/deferred-items.md`
  and `.planning/WINDOWS.md` (id 17, `todo`, open) for a follow-up DE translation pass over
  `components/FloatingNav.tsx`.
- **Committed in:** `c9204a0` (docs commit, tracking only — no code change)

---

**Total deviations:** 0 auto-fixed; 1 out-of-scope discovery logged to the broken-windows ledger.
**Impact on plan:** None — both tasks executed exactly per plan; the discovery is pre-existing and tracked separately.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - both segments are fully wired to their respective endpoints with no placeholder data paths.

## Next Phase Readiness

- 05-07 (Home tab) can rely on the `/festivals?segment=all` search-param contract this plan
  establishes: unknown/missing values fail closed to Meine, and the SegmentedControl reads it via
  `useLocalSearchParams` on mount, re-syncing only when the param itself changes.
- `festivalKeys.mine`/`festivalKeys.all` cache shapes (`{ status: 200, body: Festival[] }`) are now
  exercised by both a query subscriber (this screen) and an optimistic-write path (the save
  mutation) — any future screen reading these caches directly should follow the same
  `status === 200 && Array.isArray(body)` narrowing idiom used here and in 05-03's
  `findCachedFestivalBySlug`.
- Two on-device manual UATs from this plan's `<verify>` blocks were not run headless (no Android
  device available in this session) — logged as WINDOWS.md unrun-verify entries (ids 18-19):
  segment default/saved-badge rendering, and the full optimistic-save/restart-survival/
  double-tap/rollback flow. Must be cleared before this phase ships.

---
*Phase: 05-festival-selection-home*
*Completed: 2026-08-06*

## Self-Check: PASSED

- FOUND: `apps/mobile/app/(tabs)/festivals.tsx`
- FOUND: `.planning/phases/05-festival-selection-home/05-06-SUMMARY.md`
- FOUND: `.planning/phases/05-festival-selection-home/deferred-items.md`
- FOUND: commit `3bbcd59` (Task 1)
- FOUND: commit `c9204a0` (docs — deviation tracking)
- FOUND: commit `60df06d` (Task 2)
