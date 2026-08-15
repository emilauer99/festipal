---
phase: 10-activities-backend
plan: 04
subsystem: api
tags: [drizzle, postgres, ts-rest, nestjs, i18n, tenancy]

requires:
  - phase: 10-activities-backend
    provides: "activity/activity_participant tables + join/leave/delete (plans 10-02/10-03) — the discovery/detail slice reads what those plans wrote"
  - phase: 07-profile-visibility-friendship-backend
    provides: "foreignProfileColumns/pickForeignProfile (visitor-projection.ts) — the ONE allowed foreign-view select map and shaping function, reused verbatim rather than re-declared"
provides:
  - "GET /api/v1/festivals/:festivalId/activities — public discovery, startTime cutoff (D-10)"
  - "GET /api/v1/festivals/:festivalId/my-activities — the caller's own activities, no time cutoff (D-11)"
  - "GET /api/v1/festivals/:festivalId/activities/:activityId — detail with the full participant list as the foreign view (D-12/VIS-02)"
  - "activitySummarySchema/activityParticipantSchema/activityDetailSchema in packages/contracts"
affects: [10-05, 11-activities-ui]

actuals:
  tokens: 9835
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A single summarySelect()/shapeSummaries() pair shared by listForFestival/listMine/getDetail — participantCount/joined as correlated SQL subqueries in the select, tag resolution as a second inArray query, never three copies of the same shaping logic"
    - "A read-only foreign-view embedding (activityParticipantSchema) composed the same way friendSchema/friendRequestItemSchema already are — {profile: visitorProfileForeignSchema, ...}, so projection-uniqueness.spec.ts's profile-key walk covers it automatically without a new exception"

key-files:
  created:
    - apps/api/test/activity-discovery.spec.ts
  modified:
    - packages/contracts/src/schemas.ts
    - packages/contracts/src/router.ts
    - apps/api/src/activity/activity.service.ts
    - apps/api/src/activity/activity.controller.ts

key-decisions:
  - "The tag on a list/detail row is joined DIRECTLY by id (leftJoin(activityTag, eq(activityTag.id, activity.tagId))), never through effectiveTagWhere — the exact same discipline loadActivityView (10-01/10-02) already used, so a tag disabled after an activity was created keeps its resolved title unchanged (D-04) without a second code path to drift"
  - "listMine's own participant scope AND the shared joined-subquery both reference activity_participant, redundantly for listMine's own rows (joined is always true there) — kept anyway rather than special-cased, because a single summarySelect() shared by all three callers is worth more than trimming one always-true column for one caller"
  - "getDetail fetches the festival row first (for defaultLocale) even though a not-found activity would return null either way — mirrors create/listForFestival/listMine's existing shape rather than special-casing the one caller that could technically skip it"

requirements-completed: [SEC-03]

coverage:
  - id: D1
    description: "Public discovery excludes an activity whose startTime has passed; a participant's own view (my-activities) does not"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/activity-discovery.spec.ts#1. startTime cutoff (D-10): the public list includes the future activity, not the past one"
        status: pass
      - kind: integration
        ref: "apps/api/test/activity-discovery.spec.ts#2. participants keep access after startTime (D-11): my-activities has both, non-participants get neither"
        status: pass
    human_judgment: false
  - id: D2
    description: "The discovery list carries participantCount + the caller's own joined flag, never participant names; the detail carries names via the one allowed six-field foreign view"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-discovery.spec.ts#3. count instead of names (D-12): participantCount/joined are correct, no participant names on the list"
        status: pass
      - kind: integration
        ref: "apps/api/test/activity-discovery.spec.ts#4. names in the detail (D-12/VIS-02): exactly the expected people, exactly the six-field foreign view"
        status: pass
      - kind: integration
        ref: "apps/api/test/projection-uniqueness.spec.ts (full suite, re-run after this plan's schema changes)"
        status: pass
    human_judgment: false
  - id: D3
    description: "A tag disabled for a festival after an activity was created leaves that activity's tag/title unchanged in both list and detail"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-discovery.spec.ts#5. a disabled tag leaves an existing activity unchanged (D-04)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A festival with no activities, and an unknown-but-well-formed festivalId, both answer 200 []; an unknown activityId answers 404"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-discovery.spec.ts#6. empty cases: no activities, unknown festivalId, unknown activityId"
        status: pass
    human_judgment: false
  - id: D5
    description: "Two activities sharing the exact same startTime resolve to a total, run-stable order (id ascending), reproduced across repeated calls"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-discovery.spec.ts#7. a startTime tie resolves to a total, run-stable order (id ascending)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Both discovery lists and the detail read respect the festival boundary — a foreign festival's activity never appears in another festival's list or is readable through its path"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/activity-discovery.spec.ts#8. cross-tenant (SEC-03): A never lists B's activity, and B's detail 404s under A's path"
        status: pass
    human_judgment: false
  - id: D7
    description: "The requested locale (or the festival default as fallback) resolves the tag title consistently across list and detail"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-discovery.spec.ts#9. localization: ?locale=en resolves the English tag title, no locale resolves A's defaultLocale"
        status: pass
    human_judgment: false
  - id: D8
    description: "Exactly one foreign-view select map and shaping function exists in apps/api/src — the new participant-detail read path imports rather than re-declares it"
    verification:
      - kind: integration
        ref: "apps/api/test/projection-uniqueness.spec.ts#declares the select map and the shaping function exactly once in the whole api source"
        status: pass
      - kind: unit
        ref: "no apps/api/src/activity/activity-projection.ts file exists (confirmed by directory listing)"
        status: pass
    human_judgment: false

duration: ~10min
completed: 2026-08-15
status: complete
---

# Phase 10 Plan 04: Activity Discovery & Detail Summary

**Shipped the read slice — `GET .../activities` (startTime cutoff, D-10), `GET .../my-activities` (no cutoff, D-11), and `GET .../activities/:activityId` (full participant list via the one allowed foreign view, D-12/VIS-02) — all three sharing one select/shape pair instead of three parallel query implementations.**

## Performance

- **Duration:** ~10 min (three tasks, fully autonomous, no checkpoints)
- **Started:** 2026-08-15T00:03:37Z (approx., following 10-03's completion)
- **Completed:** 2026-08-15T00:03:26Z
- **Tasks:** 3
- **Files modified:** 5 (4 modified, 1 created)

## Accomplishments

- `packages/contracts` gained `activitySummarySchema` (`activitySchema` + `participantCount`/`joined`, no names), `activityParticipantSchema` (`{ profile: visitorProfileForeignSchema, joinedAt }`), and `activityDetailSchema` (summary + `participants`), plus the `listActivities`/`listMyActivities`/`getActivity` routes
- `ActivityService.summarySelect()`/`shapeSummaries()`: one select map with `participantCount`/`joined` as correlated SQL subqueries (bound-parameter `callerId`, never string-concatenated), and one shaping pass that resolves the ADR-017 auto-title, the tag (joined directly by id — D-04), and the geo-pair collapse — shared by all three new methods
- `listForFestival` filters `startTime > now()` in SQL (D-10); `listMine` inner-joins the caller's own `activity_participant` row and carries no time cutoff (D-11); both order by `startTime` then `id` for a total, run-stable sequence
- `getDetail` loads one activity row through the same select/shape pair, then a second query (`foreignProfileColumns` + `activityParticipant.joinedAt`, `innerJoin(visitorProfile)`, ordered by `username`) for the participant list — importing `foreignProfileColumns`/`pickForeignProfile`/`toIsoString` from `../friendship/visitor-projection` rather than declaring a second projection module
- New `apps/api/test/activity-discovery.spec.ts` proves all nine must-have cases against real Postgres; full `apps/api` suite stays green at 179/179 across 21 files, including `projection-uniqueness.spec.ts` re-confirming exactly one foreign-view select map/shaping function in the whole source tree

## Task Commits

Each task was committed atomically:

1. **Task 1: Discovery- und Detail-Schemata plus die drei Lese-Routen im Contract (D-10/D-11/D-12)** — `0332b36` (feat)
2. **Task 2: listForFestival, listMine und getDetail im Service samt Controller-Anbindung (D-04/D-10/D-11/D-12)** — `a7c4b9a` (feat)
3. **Task 3: Integrationsspec für Discovery und Detail (D-04/D-10/D-11/D-12, VIS-02)** — `e447f3d` (test)

**Plan metadata:** commit follows this SUMMARY.

## Files Created/Modified

- `packages/contracts/src/schemas.ts` - `activityParticipantSchema`/`activitySummarySchema`/`activityDetailSchema`
- `packages/contracts/src/router.ts` - `listActivities`/`listMyActivities`/`getActivity` routes
- `apps/api/src/activity/activity.service.ts` - `summarySelect`/`shapeSummaries` (private) + `listForFestival`/`listMine`/`getDetail`
- `apps/api/src/activity/activity.controller.ts` - three new handlers, session-derived `callerId` throughout
- `apps/api/test/activity-discovery.spec.ts` - new integration spec, 9 test cases

## Decisions Made

- The tag on every list/detail row is joined DIRECTLY by `id` (`leftJoin(activityTag, eq(activityTag.id, activity.tagId))`), never through `effectiveTagWhere` — the same discipline `loadActivityView` (10-01/10-02) already established, so a tag disabled after an activity was created keeps its resolved title unchanged (D-04) without a second, potentially drifting code path.
- `listMine`'s `innerJoin` on the caller's own participant row and the shared `joined` correlated subquery both reference `activity_participant`, which makes `joined` trivially `true` for every `listMine` row. Kept anyway rather than special-cased: one `summarySelect()` shared by all three callers is worth more than trimming one always-true column for one of them.
- `getDetail` fetches the festival row first (for `defaultLocale`) even though a not-found activity would independently return `null` — mirrors the existing shape of `create`/`listForFestival`/`listMine` rather than special-casing the one caller that could technically skip that lookup.

## Deviations from Plan

None - plan executed exactly as written. All three tasks' acceptance criteria were verified directly (contract build, `projection-uniqueness.spec.ts`/`foreign-projection.spec.ts` re-runs, typecheck, and the new nine-case integration spec) with no auto-fixes required.

## Issues Encountered

None. The precondition (local Docker Postgres running, migrations through 0010 applied) was verified read-only (`docker ps`) before Task 3 and held throughout.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The three read routes complete the Phase-11 substrate together with 10-01/10-02/10-03: tags, create, join/leave/delete, and now discovery/detail are all live and tenant-proven.
- Only plan 10-05 (the phase's dedicated cross-tenant proof pass) remains before Phase 10 closes.
- No blockers. The local Docker Postgres is unchanged (no new migration in this plan); all fixture rows in `activity-discovery.spec.ts` self-clean in `afterAll`.
- Reminder carried from `STATE.md`: `gsd-tools requirements.mark-complete` does not resolve requirement IDs in the workstream layout — SEC-03 continues to be exercised by 10-05 too, so the manual `REQUIREMENTS.md` update stays deferred to phase close as in 10-01/10-02/10-03.

## Self-Check: PASSED

- `apps/api/test/activity-discovery.spec.ts` exists — FOUND
- Commits `0332b36`, `a7c4b9a`, `e447f3d` all present in `git log --oneline` — FOUND
- `pnpm --filter @quiks/contracts build` — PASS (exit 0)
- `pnpm --filter @quiks/api typecheck` — PASS
- `apps/api` full suite — 179/179 PASS (21 files), including `projection-uniqueness.spec.ts` and `foreign-projection.spec.ts`
- No `apps/api/src/activity/activity-projection.ts` file exists — CONFIRMED (directory listing)

---
*Plan: 10-04*
*Completed: 2026-08-15*
