---
phase: 10-activities-backend
plan: 03
subsystem: api
tags: [drizzle, postgres, plpgsql-trigger, ts-rest, nestjs, concurrency, tenancy]

requires:
  - phase: 10-activities-backend
    provides: "activity/activity_participant tables (plan 10-02, migration 0009) — the composite tenant FK and the transactional create path the membership slice sits on top of"
provides:
  - "activity_capacity_guard()/activity_participant_capacity_trg (migration 0010) — capacity enforced by a BEFORE INSERT trigger that locks the parent activity row (SELECT ... FOR UPDATE) before counting, not a check-then-insert in the service"
  - "POST .../activities/:activityId/join, POST .../leave, DELETE /activities/:activityId — the full membership lifecycle (D-08/D-09/D-10)"
  - "ActivityService.join/leave/remove — all three scope on id AND festivalId in one WHERE (SEC-03)"
affects: [10-04-discovery, 10-05, 11-activities-ui, 12-lobby-chat]

actuals:
  tokens: 10060
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A BEFORE INSERT trigger with SELECT ... FOR UPDATE on the parent row serializes a check-then-insert race entirely inside Postgres — two concurrent transactions block on the row lock instead of both reading the same pre-insert count under READ COMMITTED"
    - "drizzle-kit's --custom generation for DDL the differ can't express (plpgsql functions/triggers) — a journal entry without touching the schema snapshot"

key-files:
  created:
    - packages/db/drizzle/0010_activity_capacity_guard.sql
    - apps/api/test/activity-capacity-db.spec.ts
    - apps/api/test/activity-join-leave.spec.ts
  modified:
    - packages/db/drizzle/meta/_journal.json
    - packages/db/drizzle/meta/0010_snapshot.json
    - packages/contracts/src/schemas.ts
    - packages/contracts/src/router.ts
    - apps/api/src/activity/activity.service.ts
    - apps/api/src/activity/activity.controller.ts

key-decisions:
  - "The capacity race is closed entirely at the database layer (SELECT ... FOR UPDATE inside a BEFORE INSERT trigger), not by a check-then-insert in ActivityService — a service-level check cannot be made race-free under READ COMMITTED without exactly this kind of row lock, which is why the trigger locks the PARENT activity row rather than counting first"
  - "The trigger's 'already a participant' branch is necessary, not cosmetic: BEFORE INSERT fires before ON CONFLICT DO NOTHING resolves its conflict, so without this branch a visitor who is already seated would be refused 'full' every time they repeat their own join once the activity fills — the capacity guard would eat join's idempotency"
  - "leave is evidence-free (same 200 body whether a participation existed, matching decline/withdraw/unfriend); delete ('Auflösen') deliberately is NOT — an activity's existence is already public within its own festival (Discovery), so a silent 200 for a non-creator would desync their client from a still-live activity instead of protecting a secret"
  - "join's 'already started' check runs entirely server-side via a SQL now() comparison inside the SELECT (`now() >= start_time`), never trusting a client-supplied timestamp (D-10)"

requirements-completed: [SEC-03]

coverage:
  - id: D1
    description: "Capacity is enforced inside the database by activity_capacity_guard()'s BEFORE INSERT trigger (SELECT ... FOR UPDATE on the parent row), not a check-then-insert in ActivityService"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-capacity-db.spec.ts#1. capacity 2 (creator seated): a second join succeeds, a third fails with 23514/activity_capacity_full_chk"
        status: pass
    human_judgment: false
  - id: D2
    description: "When exactly one seat is left and two joins arrive concurrently, exactly one succeeds and the other is refused — proven over repeated rounds at both the DB level and the HTTP level (Erfolgskriterium 2)"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-capacity-db.spec.ts#3. concurrent race for the last seat (10 rounds, two separate connections)"
        status: pass
      - kind: integration
        ref: "apps/api/test/activity-join-leave.spec.ts#2. parallel race for the last seat over HTTP (5 rounds)"
        status: pass
    human_judgment: false
  - id: D3
    description: "capacity IS NULL means unlimited: an activity without a capacity accepts an unbounded number of joins and never answers 'full' (D-08)"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-capacity-db.spec.ts#2. capacity: null is unbegrenzt — ten joins in a row all succeed"
        status: pass
      - kind: integration
        ref: "apps/api/test/activity-join-leave.spec.ts#3. unbegrenzt: both joiners come through, no 409"
        status: pass
    human_judgment: false
  - id: D4
    description: "A visitor who is already a participant can re-join a FULL activity without being refused — the trigger recognises an existing participant and idempotency survives the capacity guard"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-capacity-db.spec.ts#4. a repeated join by an already-seated visitor at a FULL activity is a silent no-op"
        status: pass
      - kind: integration
        ref: "apps/api/test/activity-join-leave.spec.ts#1. joining succeeds and is idempotent"
        status: pass
    human_judgment: false
  - id: D5
    description: "The creator cannot leave: POST .../leave answers 409 for the creator and the participant row survives (D-09, Erfolgskriterium 4)"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-join-leave.spec.ts#7. the creator cannot leave their own activity — proven at the participant row, not the response body"
        status: pass
    human_judgment: false
  - id: D6
    description: "Leaving is evidence-free — the same 200 body whether a participation existed, a repeat leave, or an activity that does not exist in this festival"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-join-leave.spec.ts#8. leaving is evidence-free: identical body for a real leave, a repeat, and a nonexistent activity"
        status: pass
    human_judgment: false
  - id: D7
    description: "Deleting ('Auflösen') is creator-only: the creator gets 200 and the activity plus all participant rows are gone via the composite-FK cascade; a non-creator gets 409, an unknown activity gets 404 (D-09)"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-join-leave.spec.ts#9. dissolving is creator-only, and cascades every participant row"
        status: pass
    human_judgment: false
  - id: D8
    description: "An activity whose startTime has passed can no longer be joined — POST .../join answers 409 (D-10), decided server-side against DB time"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-join-leave.spec.ts#4. an already-started activity refuses joining"
        status: pass
    human_judgment: false
  - id: D9
    description: "None of the three membership operations crosses the festival boundary — join and delete both answer 404 for an activityId that belongs to a different festival than the path"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/activity-join-leave.spec.ts#6. joining across a festival boundary is refused"
        status: pass
      - kind: integration
        ref: "apps/api/test/activity-join-leave.spec.ts#10. dissolving respects the tenant boundary"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-08-15
status: complete
---

# Phase 10 Plan 03: Activity Membership — Join/Leave/Delete Summary

**Shipped the DB-enforced capacity guard (`activity_capacity_guard()` BEFORE INSERT trigger, migration 0010) plus `join`/`leave`/`delete` on `POST/DELETE /api/v1/festivals/:festivalId/activities/:activityId[/join|/leave]` — the last-seat race is decided inside Postgres, not the service, and the creator can never be removed from their own activity except by explicitly dissolving it.**

## Performance

- **Duration:** 9 min (three tasks, fully autonomous, no checkpoints)
- **Started:** 2026-08-14T23:42:13Z (approx.)
- **Completed:** 2026-08-14T23:51:18Z
- **Tasks:** 3
- **Files modified:** 9 (6 modified, 3 created)

## Accomplishments

- Custom migration `0010_activity_capacity_guard.sql` adds `activity_capacity_guard()` and `activity_participant_capacity_trg`: a `BEFORE INSERT` trigger that `SELECT ... FOR UPDATE`-locks the parent `activity` row before counting participants — two concurrent joins on the last seat serialize on that row lock instead of both reading the same pre-insert count under READ COMMITTED
- `apps/api/test/activity-capacity-db.spec.ts` proves the trigger holds with NO HTTP and NO `ActivityService` in the loop: capacity-2 exhaustion (SQLSTATE 23514 / `activity_capacity_full_chk`), unbounded `capacity: null` (D-08), a 10-round concurrent last-seat race on two independent Postgres connections, and idempotent re-join by an already-seated visitor at a full activity
- `packages/contracts` gained `activityJoinResultSchema` and the `joinActivity`/`leaveActivity`/`deleteActivity` routes; `leaveActivity` deliberately carries no 404 (evidence-free like `decline`/`withdraw`/`unfriend`), `deleteActivity` deliberately does NOT (a visible state change, creator-only)
- `ActivityService.join`/`leave`/`remove`: every query scopes on `id` AND `festivalId` in one WHERE (SEC-03); `join`'s "already started" check runs entirely server-side via a SQL `now() >= start_time` comparison (D-10); capacity/profile conflicts are discriminated via the shared `postgresErrorOf`, never thrown as exceptions for an expected outcome
- `apps/api/test/activity-join-leave.spec.ts` proves the membership lifecycle over real HTTP requests and real OTP sessions: idempotent join, a 5-round parallel last-seat race over live requests, unbounded capacity, already-started refusal, missing-profile refusal, the cross-festival join/delete refusal (SEC-03), the creator-cannot-leave invariant proven at the participant row (not the response body), evidence-free leave, and creator-only "Auflösen" with the participant cascade proven at the database
- Full `apps/api` suite stays green at 170/170 across 20 files

## Task Commits

Each task was committed atomically:

1. **Task 1: Kapazitäts-Trigger als Custom-Migration 0010 und sein DB-seitiger Rennen-Beweis (D-07/D-08, Erfolgskriterium 2)** — `dd509af` (feat)
2. **Task 2: join / leave / delete im Contract, Service und Controller (D-08/D-09/D-10)** — `50548ae` (feat)
3. **Task 3: HTTP-Spec für Beitreten, Verlassen und Auflösen (D-08/D-09/D-10, Erfolgskriterium 2 und 4)** — `7164ca9` (test)

**Plan metadata:** commit follows this SUMMARY.

## Files Created/Modified

- `packages/db/drizzle/0010_activity_capacity_guard.sql` - `activity_capacity_guard()` plpgsql function + `activity_participant_capacity_trg` BEFORE INSERT trigger, generated via `--custom` and applied to the local Docker Postgres
- `packages/db/drizzle/meta/_journal.json` / `0010_snapshot.json` - custom-migration journal entry; snapshot content unchanged vs. 0009 (key-order diff only, a known drizzle-kit `--custom` artifact)
- `packages/contracts/src/schemas.ts` - `activityJoinResultSchema`/`ActivityJoinResult`
- `packages/contracts/src/router.ts` - `joinActivity`/`leaveActivity`/`deleteActivity` routes
- `apps/api/src/activity/activity.service.ts` - `join`/`leave`/`remove` methods + their discriminated result types
- `apps/api/src/activity/activity.controller.ts` - three new handlers, session-derived actor id throughout
- `apps/api/test/activity-capacity-db.spec.ts` - new DB-level integration spec, 4 test cases
- `apps/api/test/activity-join-leave.spec.ts` - new HTTP-level integration spec, 10 test cases

## Decisions Made

- The capacity race is closed entirely at the database layer via `SELECT ... FOR UPDATE` inside a `BEFORE INSERT` trigger, not a check-then-insert in `ActivityService` — a service-level check cannot be made race-free under READ COMMITTED without exactly this row lock, which is why the trigger locks the PARENT `activity` row rather than counting first and checking after.
- The trigger's "already a participant" branch is load-bearing, not cosmetic: `BEFORE INSERT` fires before `ON CONFLICT DO NOTHING` resolves its conflict, so without this branch a visitor who is already seated would be refused "full" on every repeat of their own join once the activity fills — the capacity guard would otherwise eat join's idempotency.
- `leave` stays evidence-free (matching `decline`/`withdraw`/`unfriend`: the same 200 body regardless of whether a participation existed); `delete` ("Auflösen") deliberately is NOT — an activity's existence is already public within its own festival (Discovery), so there is no secret a 404 would leak, and a silent 200 for a non-creator would desync their client from a still-live activity instead of protecting anything.
- `join`'s "already started" check is computed by the database (`now() >= start_time` inside the same SELECT that loads the activity), never by comparing against a client-supplied timestamp — the same server-time posture the capacity trigger itself takes.

## Deviations from Plan

None - plan executed exactly as written. All three tasks' acceptance criteria were verified directly (SQLSTATE/constraint-name assertions on rejected promises, DB-row assertions after HTTP calls, and the two new integration specs plus the full existing suite) with no auto-fixes required.

## Issues Encountered

None. The plan's own note on `reversibility="one-way"` for Task 2 (the creator-only delete endpoint entering `packages/contracts`) was honored as written — no checkpoint was raised, per the plan's explicit rationale that the decision was already made in the phase discuss.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All four ROADMAP success criteria for the membership slice are proven: the last-seat race cannot both succeed (DB level ≥10 rounds, HTTP level ≥5 rounds), `capacity IS NULL` never answers "full", the creator is unremovable by leaving, and "Auflösen" is creator-only with a cascading delete — only the Discovery and cross-tenant browse surface (plan 10-04) remain.
- `activity_capacity_full_chk` (trigger-raised, SQLSTATE 23514) stays distinguishable by `constraint_name` from `activity_capacity_positive_chk` (the plain CHECK from 10-02) — both names were kept non-colliding from the start, so any future caller reading `postgresErrorOf(err)?.constraint_name` can tell them apart without ambiguity.
- No blockers. The local Docker Postgres carries migration 0010 applied; the trigger fires correctly under both the DB-level and HTTP-level test suites, all fixture rows self-cleaned in `afterAll`.
- Reminder carried from `STATE.md`: `gsd-tools requirements.mark-complete` does not resolve requirement IDs in the workstream layout — SEC-03 continues to be exercised by 10-04 too, so the manual REQUIREMENTS.md update stays deferred to phase close as in 10-01/10-02.

## Self-Check: PASSED

- `packages/db/drizzle/0010_activity_capacity_guard.sql` exists — FOUND
- `apps/api/test/activity-capacity-db.spec.ts` exists — FOUND
- `apps/api/test/activity-join-leave.spec.ts` exists — FOUND
- Commits `dd509af`, `50548ae`, `7164ca9` all present in `git log --oneline` — FOUND
- `pnpm --filter @quiks/api typecheck` — PASS
- `apps/api` full suite — 170/170 PASS (20 files)
- `pg_trigger` carries `activity_participant_capacity_trg` — CONFIRMED (proven indirectly: every capacity-rejection assertion in both new specs matches SQLSTATE 23514 / `activity_capacity_full_chk`, which only the trigger raises)

---
*Plan: 10-03*
*Completed: 2026-08-15*
