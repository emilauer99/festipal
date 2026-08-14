---
phase: 10-activities-backend
plan: 02
subsystem: api
tags: [drizzle, postgres, ts-rest, nestjs, transactions, tenancy]

requires:
  - phase: 10-activities-backend
    provides: "activity_tag/activity_tag_translation/festival_activity_tag (plan 10-01) — the tag catalog createActivity validates tagId against"
provides:
  - "activity/activity_participant tables (migration 0009) — creatorId, optional tagId, auto-title fields, capacity (nullable=unbegrenzt), one-off geo point, all enforced by DB CHECKs"
  - "activity_participant's composite FK on (activityId, festivalId) -> activity(id, festivalId) — a participant row naming a foreign festival is unwritable at the schema level"
  - "POST /api/v1/festivals/:festivalId/activities — creator becomes a participant in the same transaction as the activity insert"
  - "apps/api/src/db/postgres-error.ts (postgresErrorOf) — the shared Postgres cause-chain walker, now used by both friendship.service.ts and activity.service.ts"
affects: [10-03-participants-capacity, 10-04-discovery, 10-05, 11-activities-ui]

actuals:
  tokens: 22813
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Composite foreign key onto a sibling UNIQUE(id, tenantId) constraint to make a cross-tenant join-table row structurally inexpressible, instead of relying on a service-level check"
    - "A single db.transaction writing a parent row plus its own first membership row, so the two commit together or not at all"
    - "Effective-tag predicate extracted into one private method (effectiveTagWhere) shared between the read path (listEffectiveTags) and the write-time validation gate (create), so the two can never diverge on what 'selectable' means"

key-files:
  created:
    - packages/db/src/schema/activity.ts
    - packages/db/src/schema/activity-participant.ts
    - packages/db/drizzle/0009_nostalgic_stick.sql
    - apps/api/src/db/postgres-error.ts
    - apps/api/test/activity-create.spec.ts
  modified:
    - packages/db/src/schema/index.ts
    - packages/contracts/src/schemas.ts
    - packages/contracts/src/router.ts
    - apps/api/src/friendship/friendship.service.ts
    - apps/api/src/activity/activity.service.ts
    - apps/api/src/activity/activity.controller.ts

key-decisions:
  - "activity.tagId uses onDelete: 'restrict', not 'set null' — a NULLed tagId on a title-less activity would violate activity_title_or_tag_chk, so deleting a used tag now fails loudly instead of silently producing a rule-breaking row"
  - "The capacity CHECK is named activity_capacity_positive_chk, deliberately distinct from the activity_capacity_full_chk plan 10-03 will add — kept the two constraint names non-colliding from the start per the plan's explicit instruction"
  - "createActivityBodySchema is a plain z.object (not composed on the drizzle-zod insert base) — unlike activitySchema, the plan does not require drift-detection composition for the write body, and the four fields plus geo/capacity are simple enough that a hand-written schema with the server-side caps is clearer"
  - "The tag view in the create response is loaded by loadActivityView() joining activity_tag DIRECTLY by id, never through the effective-tag predicate — so a tag disabled after an activity was created keeps its title unchanged (D-04), proven in test 5"

requirements-completed: [SEC-03]

coverage:
  - id: D1
    description: "Creator becomes a participant in the same transaction as the activity insert — no instant exists where the activity has no creator on the attendee list"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/activity-create.spec.ts#1. creator is a participant from the moment of creation (D-07, Erfolgskriterium 4)"
        status: pass
    human_judgment: false
  - id: D2
    description: "ADR-017 auto-title rule: with a tag and no title, the response title resolves to the tag's localized title; a title is required without a tag, at both the contract refine and the DB CHECK"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-create.spec.ts#2. auto-title with a tag: no explicit title resolves the localized tag title"
        status: pass
      - kind: integration
        ref: "apps/api/test/activity-create.spec.ts#3. title is required without a tag — 400 at the contract, 23514 at the DB"
        status: pass
    human_judgment: false
  - id: D3
    description: "A foreign tag and a disabled tag both return an identical 404 body — no existence oracle over another tenant's tag catalog (SEC-03); disabling a tag does not retroactively change an existing activity's tag/title (D-04)"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/activity-create.spec.ts#4. a foreign tag (SEC-03) is rejected 404, same body as a disabled one"
        status: pass
      - kind: integration
        ref: "apps/api/test/activity-create.spec.ts#5. a disabled tag is rejected on create, but an EXISTING activity keeps its tag unchanged (D-04)"
        status: pass
    human_judgment: false
  - id: D4
    description: "A caller without a completed visitor_profile gets a clean 409, never a 500"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-create.spec.ts#6. a caller without a completed profile gets 409"
        status: pass
    human_judgment: false
  - id: D5
    description: "capacity accepts null (unbegrenzt, D-08) and any integer >= 1; 0 and negatives are rejected at both the contract and the activity_capacity_positive_chk DB CHECK"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-create.spec.ts#7. capacity: null is unbegrenzt, 1 is valid, 0 is rejected (D-08)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The optional geo point is all-or-nothing — both lat/lng present or both absent, enforced by activity_geo_pair_chk"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-create.spec.ts#8. geo is all-or-nothing (ADR-017 §2)"
        status: pass
    human_judgment: false
  - id: D7
    description: "creatorId comes from session.user.id and festivalId from the path — a client-supplied creatorId/festivalId/visitorId in the body changes nothing"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-create.spec.ts#9. client-supplied creatorId/festivalId/visitorId in the body change nothing"
        status: pass
    human_judgment: false
  - id: D8
    description: "activity_participant carries festivalId bound by a composite foreign key onto (activity.id, activity.festivalId) — a participant row naming a foreign festival is unwritable at the schema level"
    requirement: SEC-03
    verification:
      - kind: manual_procedural
        ref: "Direct psql insert against the local Docker Postgres: mismatched festival_id on activity_participant raised SQLSTATE 23503 on constraint activity_participant_activity_fk"
        status: pass
    human_judgment: false
  - id: D9
    description: "postgresErrorOf moved to a shared module; friendship.service.ts's existing behavior (all specs) is unchanged by the move"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-lists.spec.ts, friend-request-race.spec.ts, projection-uniqueness.spec.ts — 48/48 pass unchanged"
        status: pass
    human_judgment: false

duration: ~25min
completed: 2026-08-15
status: complete
---

# Phase 10 Plan 02: Activity Create — Creator-as-Participant Transaction Summary

**Shipped `POST /api/v1/festivals/:festivalId/activities`: the `activity`/`activity_participant` tables with a composite tenant foreign key, and a transactional create path where the creator becomes a participant in the same write as the activity itself.**

## Performance

- **Duration:** ~25 min (three tasks, fully autonomous, no checkpoints)
- **Started:** 2026-08-14T23:12Z (approx.)
- **Completed:** 2026-08-14T23:38Z
- **Tasks:** 3
- **Files modified:** 15 (9 modified, 6 created — including migration + snapshot artifacts)

## Accomplishments

- Added `activity` (creatorId, optional tagId, auto-title fields, capacity nullable=unbegrenzt D-08, one-off geo point) and `activity_participant` (composite PK on `(activityId, visitorId)`), both guarded by DB CHECKs and applied to the local Docker Postgres as migration `0009_nostalgic_stick.sql`
- `activity_participant`'s composite foreign key onto `activity`'s own `(id, festivalId)` UNIQUE constraint makes a cross-tenant participant row schema-inexpressible — verified directly against the running Postgres (SQLSTATE 23503, `activity_participant_activity_fk`)
- Moved `postgresErrorOf` out of `friendship.service.ts` into `apps/api/src/db/postgres-error.ts` so `activity.service.ts` can share it — friendship specs re-verified unchanged
- Extended `packages/contracts` with `activityGeoSchema`, `activitySchema` (composed on `activitySelectSchema.pick(...)`), `createActivityBodySchema` (with the client-side pre-emption `.refine` for the title-or-tag rule), and the `createActivity` route
- `ActivityService.create` writes the activity row and the creator's `activity_participant` row in ONE `db.transaction` — the creator-is-participant invariant has no window in which it doesn't hold
- The effective-tag predicate that gates `create`'s `tagId` is the exact same `effectiveTagWhere()` fragment `listEffectiveTags` already used — a foreign tag and a disabled tag both come back as the identical `tag-not-found` → 404, so the API is never an existence oracle over another tenant's catalog
- New `apps/api/test/activity-create.spec.ts` proves all nine must-have cases against real Postgres; full `apps/api` suite stays green at 156/156 across 18 files

## Task Commits

Each task was committed atomically:

1. **Task 1: activity- und activity_participant-Schema mit Tenant-Fremdschlüssel, Migration 0009 anwenden** — `ef1fd28` (feat)
2. **Task 2: createActivity im Contract, transaktionaler Schreibpfad mit Creator-als-Teilnehmer, geteilter postgresErrorOf** — `17ad0d4` (feat)
3. **Task 3: Integrationsspec für den Create-Pfad** — `f02016d` (test)

**Plan metadata:** commit follows this SUMMARY.

## Files Created/Modified

- `packages/db/src/schema/activity.ts` - `activity` table (4 CHECKs, UNIQUE(id, festivalId), festival+startTime index) + drizzle-zod schemas
- `packages/db/src/schema/activity-participant.ts` - `activity_participant` join table with the composite tenant FK
- `packages/db/drizzle/0009_nostalgic_stick.sql` - pure CREATE migration for both tables, applied to local Docker Postgres
- `packages/db/src/schema/index.ts` - barrel exports for the two new schema files
- `apps/api/src/db/postgres-error.ts` - shared `postgresErrorOf` cause-chain walker
- `apps/api/src/friendship/friendship.service.ts` - imports `postgresErrorOf` instead of defining it locally
- `packages/contracts/src/schemas.ts` - `activityGeoSchema`, `activitySchema`, `createActivityBodySchema`
- `packages/contracts/src/router.ts` - `createActivity` route (`POST /festivals/:festivalId/activities`)
- `apps/api/src/activity/activity.service.ts` - `effectiveTagWhere`/`isTagEffective`/`loadActivityView`/`create`
- `apps/api/src/activity/activity.controller.ts` - `createActivity` handler, session-scoped creatorId
- `apps/api/test/activity-create.spec.ts` - new integration spec, 9 test cases

## Decisions Made

- `activity.tagId` uses `onDelete: 'restrict'` rather than `'set null'` — a title-less activity relies entirely on its tag for the auto-title, so a `set null` on tag deletion would silently leave a row that violates `activity_title_or_tag_chk`. Deleting a used tag now fails loudly instead.
- The capacity CHECK is named `activity_capacity_positive_chk`, deliberately distinct from the `activity_capacity_full_chk` plan 10-03 will add for the join-time capacity race — the plan called this out explicitly and the naming was kept non-colliding from the start.
- `createActivityBodySchema` is a plain `z.object`, not composed on the drizzle-zod insert base — unlike `activitySchema` (which the plan explicitly required to compose on `activitySelectSchema` for drift detection), the write body has no such requirement and a hand-written schema with the server-side caps stayed clearer than picking-then-re-extending the same four fields.
- The response's tag view (`loadActivityView`) joins `activity_tag` directly by id, never through `effectiveTagWhere` — so an activity keeps its resolved tag/title unchanged even after that tag is later disabled for the festival (D-04), proven in test 5 by re-reading the earlier activity from test 2 after disabling its tag.

## Deviations from Plan

None - plan executed exactly as written. All three tasks' acceptance criteria were verified directly (DB-level CHECK/FK violations via direct psql inserts, contract-level `safeParse` calls, and the full integration spec) with no auto-fixes required.

## Issues Encountered

- `apps/api/src/activity/activity.controller.ts` initially imported `Session`/`UserSession` from a guessed `@quiks/auth` path; the actual import (matching `festival.controller.ts`) is `@thallesp/nestjs-better-auth`. Caught by `pnpm --filter @quiks/api typecheck` before any commit — corrected inline, not tracked as a deviation since it never reached a committed state.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `activity`/`activity_participant` and the transactional create path are ready for plan 10-03 (participants + capacity: join/leave, the concurrent-join capacity race, and the creator-cannot-leave invariant).
- `activity_capacity_positive_chk` name is reserved distinctly from the planned `activity_capacity_full_chk` — 10-03 can add the latter without a naming collision.
- `postgresErrorOf` now lives at `apps/api/src/db/postgres-error.ts` — any future module needing the same Postgres cause-chain walk should import from there, not redefine it.
- No blockers. The local Docker Postgres carries migration 0009 applied; `activity`/`activity_participant` are clean post-test (all fixture rows self-cleaned in `afterAll`).
- Reminder carried from `STATE.md`: `gsd-tools requirements.mark-complete` does not resolve requirement IDs in the workstream layout — SEC-03 continues to be exercised by 10-03/10-04 too, so the manual REQUIREMENTS.md update is deferred to phase close as before.

## Self-Check: PASSED

- `packages/db/src/schema/activity.ts`, `activity-participant.ts` exist — FOUND
- `packages/db/drizzle/0009_nostalgic_stick.sql` exists — FOUND
- `apps/api/src/db/postgres-error.ts` exists — FOUND
- `apps/api/test/activity-create.spec.ts` exists — FOUND
- Commits `ef1fd28`, `17ad0d4`, `f02016d` all present in `git log --oneline` — FOUND
- `pnpm --filter @quiks/api typecheck` — PASS
- `apps/api` full suite — 156/156 PASS (18 files)
- Local Docker Postgres: migration 0009 applied, all four CHECKs + composite FK verified via direct psql inserts — CONFIRMED

---
*Plan: 10-02*
*Completed: 2026-08-15*
