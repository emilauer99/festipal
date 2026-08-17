---
phase: 11-activities
plan: 01
subsystem: ui
tags: [expo-router, react-query, lingui, typed-routes, activities]

requires:
  - phase: 10-activities-backend
    provides: "listActivities/listMyActivities/getActivity endpoints, activitySummarySchema/activityDetailSchema, SEC-03 tenant isolation"
provides:
  - "activityKeys query-key factory (all/tags/list/mine/detail) mirroring friendKeys/festivalKeys"
  - "ActivityCard — the one shared list-row card for both activity sections"
  - "the real Activities tab: two independently-resolving sections (Deine Aktivitaeten / Wer kommt mit?)"
  - "the registered /activity-detail push screen — closes the tracer's riskiest step (Unmatched Route class)"
affects: [11-02, 11-03, 11-04, 11-05]

actuals:
  tokens: 13333
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Named local variables before a plural()/t() macro call so Lingui derives readable ICU placeholder names instead of positional {0}/{1}"
    - "unwrapOk run INSIDE queryFn (not just mutationFn) so a non-200 response and a transport failure collapse into the same React Query 'error' status"
    - "'now' for D-04-style time-relative grouping drawn exactly once per render and threaded into both the sort and the badge condition, never re-read per row"

key-files:
  created:
    - apps/mobile/lib/activity-queries.ts
    - apps/mobile/lib/__tests__/activity-queries.test.ts
    - apps/mobile/components/ActivityCard.tsx
    - apps/mobile/app/activity-detail.tsx
  modified:
    - apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx
    - apps/mobile/lib/app-chrome.ts
    - apps/mobile/lib/__tests__/app-chrome.test.ts
    - apps/mobile/components/AppHeader.tsx
    - apps/mobile/app/_layout.tsx
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "sortByStartTimeStable pinned to ActivitySummary (not a generic <T extends {id,startTime}>) — the generic version produced a confusing TS2322 (ActivitySummary.id read as optional through the inferred constraint), and the only real caller in this plan is ActivitySummary anyway"
  - "ActivityCard's 'Dabei' badge sits in the title row (mirroring FestivalCard's Saved-badge/title-row layout) rather than after the participants line — UI-SPEC states the badge's color treatment and existence, not a rigid vertical position, and no acceptance criterion pins one"
  - "Meeting-point block gated on `location` presence only (not `location || geo`) — this task explicitly excludes the geo/'Route oeffnen' affordance (11-05), so a geo-only activity renders nothing here by construction; 11-05 will widen the gate when it adds the route button"
  - "Participants/spots-hint copy implemented as ICU plural (not fixed strings) per UI-SPEC E2's explicit 'plural-safe' requirement, even though the Copywriting Contract table shows only the representative 'other' form"

patterns-established:
  - "Query-scoped ordering helpers (sortByStartTimeStable, groupMineActivities) live next to the query keys / screen that use them, not as speculative shared lib exports before a second real caller exists"

requirements-completed: [ACT-02]

coverage:
  - id: D1
    description: "The Activities tab renders the real 'Wer kommt mit?' public list from listActivities, sorted ascending by startTime with an id tie-break, replacing the Phase-9 PlaceholderScreen"
    requirement: ACT-02
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/activity-queries.test.ts#sortByStartTimeStable (11-01 Task 1 acceptance)"
        status: pass
      - kind: unit
        ref: "apps/mobile/lib/__tests__/type-tracking.test.ts (title2 letterSpacing coupling)"
        status: pass
    human_judgment: true
    rationale: "No RN component test harness in this project (STATE.md structural limitation) — the visual card layout, capacity-null omission, and Dabei badge must be confirmed on-device."
  - id: D2
    description: "'Deine Aktivitaeten' section stacks above 'Wer kommt mit?', each with independent loading/error/empty/data state; own activities keep the Gestartet chip and sort upcoming-first"
    requirement: ACT-02
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/activity-queries.test.ts (activityKeys prefix invariant, shared by both sections' cache keys)"
        status: pass
    human_judgment: true
    rationale: "The D-01 stacked layout, D-04 upcoming/started grouping, and UI-SPEC E1 'partial' independence between the two sections are screen-level truths only on-device UAT can confirm."
  - id: D3
    description: "Tapping a card opens the registered /activity-detail push screen (static 'Aktivitaet' header, real getActivity fetch, back returns to the tab) in every state, never Expo Router's Unmatched Route screen"
    requirement: ACT-02
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/app-chrome.test.ts#shows the push state with route \"activity-detail\" for the Activity detail screen (11-01)"
        status: pass
      - kind: unit
        ref: "apps/mobile/lib/__tests__/app-chrome.test.ts#hides on an unknown first segment (never falls back to visible)"
        status: pass
    human_judgment: true
    rationale: "The Unmatched-Route regression class this task exists to prevent (first-login-unmatched-route lineage, forgotten three times in Phase 9) is only provable by an actual device navigation + app-kill/relaunch check, not a node-env unit test."

duration: ~35min
completed: 2026-08-15
status: complete
---

# Phase 11 Plan 01: Activities Tracer Summary

**Real two-section Activities tab (own + public activities) backed by listActivities/listMyActivities, plus a registered `/activity-detail` push screen wired end-to-end through `getActivity` — closing the phase's riskiest cross-layer risk (chrome registration) in the first plan.**

## Performance

- **Duration:** ~35min
- **Started:** 2026-08-15T13:47:00Z (approx.)
- **Completed:** 2026-08-15T14:13:14+02:00
- **Tasks:** 3
- **Files modified:** 12 (11 planned + 1 Rule-1 fix)

## Accomplishments

- `lib/activity-queries.ts`: `activityKeys` factory (`all`/`tags`/`list`/`mine`/`detail`), `unwrapCreated` for the 201 `createActivity` response, `sortByStartTimeStable` — all re-exporting `unwrapOk`/`ApiResponseError` from `festival-queries.ts` rather than redefining them
- `ActivityCard`: the one shared list-row card for both sections — title, day·time meta line (one `Intl.DateTimeFormat` instance), tag chip, "Gestartet" fact-chip (own section only), ICU-plural participants line, capacity-null-omits-the-hint spots line, "Dabei" badge in the exact `FestivalCard` "Saved"-badge treatment
- `app/(festival)/f/[festivalSlug]/activities.tsx`: replaces the Phase-9 `PlaceholderScreen` with two independently-resolving sections — "Deine Aktivitäten" (`listMyActivities`, D-04 upcoming-first/started-last ordering, no `startTime` cutoff) stacked above "Wer kommt mit?" (`listActivities`, server-side started-activity cutoff)
- `app/activity-detail.tsx`: the registered detail push screen — real `useQuery` against `activityKeys.detail(...)` via `getActivity` (not a list-cache scavenge), read-only content with every optional field (subtitle, description, location) omitted rather than dashed when absent
- Chrome registration closed the tracer's architecturally riskiest step: `activity-detail` added to `PUSH_SCREEN_ROUTES`/`PushScreenRoute`, `AppHeader`'s static push title, and the root `Stack.Protected` `Stack.Screen` — all three in the same task, proven by an extended `app-chrome.test.ts`
- 12 new/changed msgids across both locale catalogs, all filled (0 missing per `lingui extract`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Durchstich — activityKeys, ActivityCard und die öffentliche Liste im Tab** - `3372c71` (feat)
2. **Task 2: Sektion "Deine Aktivitäten" ergänzen** - `3e945fd` (feat)
3. **Task 3: Detail-Push-Screen im Lesepfad plus die beiden Chrome-Registrierungen** - `5e5c74c` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit below).

## Files Created/Modified

- `apps/mobile/lib/activity-queries.ts` - `activityKeys` factory, `unwrapCreated`, `sortByStartTimeStable`
- `apps/mobile/lib/__tests__/activity-queries.test.ts` - prefix/uniqueness invariant + sort acceptance tests
- `apps/mobile/components/ActivityCard.tsx` - shared list-row card
- `apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx` - real two-section tab, replaces placeholder
- `apps/mobile/app/activity-detail.tsx` - detail push screen (read path)
- `apps/mobile/lib/app-chrome.ts` - `activity-detail` added to the push-route registry
- `apps/mobile/lib/__tests__/app-chrome.test.ts` - push-state proof for `activity-detail`
- `apps/mobile/components/AppHeader.tsx` - static `activity-detail` push title
- `apps/mobile/app/_layout.tsx` - `Stack.Screen name="activity-detail"` registration
- `apps/mobile/locales/{de,en}/messages.po` - 12 new msgids
- `apps/mobile/lib/__tests__/festival-tab-naming.test.ts` - removed assertions on the now-obsolete Activities-placeholder catalog strings (Rule 1 fix, see Deviations)

## Decisions Made

- `sortByStartTimeStable` is typed directly against `ActivitySummary`, not a generic `<T extends {id, startTime}>` — the generic version produced a TS2322 where `ActivitySummary.id` read as optional through the inferred structural constraint; the only real caller in this plan is `ActivitySummary` anyway, so pinning the type is simpler and correct.
- The "Dabei" badge renders in the card's title row (title left, badge right — mirroring `FestivalCard`'s name/Saved-badge row) rather than after the participants line. UI-SPEC names the badge's exact color treatment and existence, not a rigid vertical position, and no acceptance criterion pins one.
- The meeting-point block on the detail screen is gated on `location` presence only (not `location || geo`) — this task explicitly excludes the geo/"Route öffnen" affordance (deferred to 11-05), so a geo-only activity currently renders nothing there by construction. 11-05 widens the gate when it adds the route button.
- Participants line and spots hint are implemented as ICU plural patterns (via Lingui's `plural()` macro), not fixed strings, per UI-SPEC E2's explicit "plural-safe" requirement — the Copywriting Contract table only shows the representative "other" form.
- Detail-screen seat-line and participants-line interpolations use named local variables (`const participantCount = activity.participantCount`) before the `t`/`plural` macro call so Lingui derives readable named ICU placeholders (`{participantCount}`) instead of positional ones (`{0}`) — caught mid-task when a member-expression interpolation produced `{0} are in · no limit`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed obsolete Activities-placeholder assertions from `festival-tab-naming.test.ts`**
- **Found during:** Task 1 (`pnpm exec vitest run`)
- **Issue:** A pre-existing Phase-9 test (`lib/__tests__/festival-tab-naming.test.ts`) asserted on the exact catalog copy of the `PlaceholderScreen` that Task 1's own action explicitly replaces ("Activities are on the way" / "We're building this at quiks…"). Removing the placeholder correctly makes `lingui extract` mark those two msgids obsolete (`#~`), and the test's own `parsePoCatalog` helper deliberately skips obsolete entries — so the test failed as a direct, in-scope consequence of the task, not a regression.
- **Fix:** Removed the now-obsolete `describe('activities placeholder copy follows the quiks rename …')` block, replaced with an explanatory comment. Left every other describe block (map placeholder, tab labels, FloatingNav wiring) untouched.
- **Files modified:** `apps/mobile/lib/__tests__/festival-tab-naming.test.ts`
- **Verification:** `pnpm exec vitest run` — 323/323 (then 324/324 after Task 2) passed.
- **Committed in:** `3372c71` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 — bug/stale test)
**Impact on plan:** Necessary consequence of Task 1's own explicit action (removing the placeholder); no scope creep.

## Issues Encountered

- `sortByStartTimeStable`'s first draft was generic over `<T extends { id: string; startTime: string }>` to ease unit testing with minimal fixtures. `pnpm typecheck` failed with a confusing TS2322/TS2345 pair claiming `ActivitySummary.id` was optional — resolved by pinning the function to `ActivitySummary` directly and building full `ActivitySummary`-shaped fixtures in the test instead of minimal ones. Not investigated further since the concrete typing is simpler and correct either way.
- Expo Router's `typedRoutes: true` means `router.push({ pathname: '/activity-detail', ... })` cannot compile before the route file exists and is registered — Task 1's card `onPress` was left as a documented no-op (`() => {}`) until Task 3 wired the real navigation, exactly matching the plan's own task boundary ("Task 3 … Gib der ActivityCard im Tab ein onPress …").

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The tracer's riskiest step (root-level push-screen chrome registration) is proven end-to-end and unit-tested; 11-02 through 11-05 can now build the create/join/leave/dissolve/clone/route surfaces on top of this without re-deriving the registration pattern.
- `activityKeys.all(festivalId)` is the standing invalidation prefix every future mutation (`createActivity`, `joinActivity`, `leaveActivity`, `deleteActivity`) will invalidate against — proven as a prefix invariant in `activity-queries.test.ts`.
- **Deferred to on-device UAT** (per this project's structural test-harness limitation — no RN component harness exists): the actual visual card layout, the D-01 stacked-sections layout, the D-04 upcoming/started grouping, EN locale switch behavior, and the Unmatched-Route regression check (tap → push → back, plus app-kill/relaunch from the detail screen) all still need the device pass this phase's `<human-check>` blocks describe. None of this plan's own automated verification (`pnpm typecheck`, `pnpm lint`, `pnpm exec vitest run`, all green) can substitute for it.
- No blockers for 11-02.

---
*Phase: 11-activities*
*Completed: 2026-08-15*

## Self-Check: PASSED

All 11 plan-produced files (activity-queries.ts, activity-queries.test.ts, ActivityCard.tsx,
activity-detail.tsx, activities.tsx, app-chrome.ts, app-chrome.test.ts, AppHeader.tsx, _layout.tsx,
locales/de/messages.po, locales/en/messages.po) confirmed on disk. All three task commits
(3372c71, 3e945fd, 5e5c74c) confirmed present in `git log`.
