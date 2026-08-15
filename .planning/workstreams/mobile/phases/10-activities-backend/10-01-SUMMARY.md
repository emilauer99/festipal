---
phase: 10-activities-backend
plan: 01
subsystem: api
tags: [drizzle, postgres, ts-rest, nestjs, i18n, tenancy, migration]

requires:
  - phase: 07-profile-visibility-friendship-backend
    provides: resolveLocalized locale-fallback helper (packages/contracts/src/locale.ts), the LEFT JOIN + Map accumulation pattern
  - phase: 09-festival-navigation-shell
    provides: apps/api module/controller/service scaffolding conventions (festival.module.ts as the copied template)
provides:
  - "The ADR-017 §3 tag model (activity_tag/activity_tag_translation/festival_activity_tag) replacing the scaffold tag/tag_translation"
  - "The nullable-festivalId SEC-03 exception, proven by its own dedicated cross-tenant test"
  - "GET /api/v1/festivals/:festivalId/activity-tags — the effective tag list (activated global union festival-own)"
  - "The idempotent global start catalog (10 tags, DE+EN) in packages/db/scripts/seed.ts"
affects: [10-02-activity-crud, 10-03-participants-capacity, 10-04-discovery, 10-05, 11-activities-ui]

actuals:
  tokens: 24305
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Partial unique indexes (WHERE festival_id IS NULL / IS NOT NULL) to scope uniqueness separately across a nullable-tenant boundary"
    - "Two-migration split (pure DROP, then pure CREATE) to avoid drizzle-kit's interactive rename prompt when a diff both drops and creates a similarly-shaped table"
    - "onConflictDoUpdate with an explicit targetWhere to upsert against a partial unique index in a seed script"

key-files:
  created:
    - packages/db/src/schema/activity-tag.ts
    - packages/db/drizzle/0007_milky_exiles.sql
    - packages/db/drizzle/0008_smooth_mantis.sql
    - apps/api/src/activity/activity.module.ts
    - apps/api/src/activity/activity.controller.ts
    - apps/api/src/activity/activity.service.ts
    - apps/api/test/activity-tags.spec.ts
  modified:
    - packages/db/src/schema/index.ts
    - packages/db/scripts/seed.ts
    - packages/contracts/src/schemas.ts
    - packages/contracts/src/router.ts
    - apps/api/src/festival/festival.service.ts
    - apps/api/src/festival/festival.controller.ts
    - apps/api/src/app.module.ts
    - apps/api/test/auth-guard.spec.ts

key-decisions:
  - "D-01 executed as ersetzen, nicht migrieren: packages/db/src/schema/tag.ts deleted outright, drop migration generated in a SEPARATE pass from the create migration to sidestep drizzle-kit's interactive rename prompt (tag -> activity_tag looks like a rename to the differ)"
  - "activity_tag.festivalId is genuinely nullable with TWO partial unique indexes (activity_tag_global_slug_unq WHERE festival_id IS NULL, activity_tag_festival_slug_unq WHERE festival_id IS NOT NULL) instead of one constraint — a plain unique index would let two NULL rows collide-free but also let two global tags share a slug"
  - "festival_activity_tag keeps an explicit enabled boolean (default true) rather than 'row presence = disabled' — matches D-05's opt-out semantics and leaves room for the admin workstream to re-enable a tag without a delete+reinsert"
  - "Seed upserts against the partial index via onConflictDoUpdate's targetWhere, not onConflictDoNothing + re-select — kept idempotency verification to a single pass (ran db:seed twice, same 10 ids both times)"

requirements-completed: [SEC-03]

coverage:
  - id: D1
    description: "Effective tag list resolves activated global union festival-own tags, titles locale-resolved with fallback to festival default"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/activity-tags.spec.ts#1. festival A gets all 10 global tags plus its own"
        status: pass
      - kind: integration
        ref: "apps/api/test/activity-tags.spec.ts#2. ?locale=en resolves English titles; a DE-only tag falls back"
        status: pass
    human_judgment: false
  - id: D2
    description: "Nullable activity_tag.festivalId is the one deliberate SEC-03 exception — a global tag is effective for every festival, a festival-own tag never leaks cross-tenant"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/activity-tags.spec.ts#4. SEC-03 nullable-festivalId isolation: B sees every global tag but NEVER A's own tag"
        status: pass
    human_judgment: false
  - id: D3
    description: "A festival-own tag and a same-slug global tag coexist as two distinct entries (partial unique indexes, no merge/collision)"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-tags.spec.ts#3. adjacency: A's own \"workshop\" tag and the global \"workshop\" tag are TWO distinct entries"
        status: pass
    human_judgment: false
  - id: D4
    description: "Disabling a global tag for one festival (festival_activity_tag enabled=false) affects only that festival's list, reversibly"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-tags.spec.ts#5. disabling a global tag affects only the disabling festival"
        status: pass
    human_judgment: false
  - id: D5
    description: "Empty-catalog and unknown-festival cases are HTTP 200, never 404; a festival with no own rows still gets the full global catalog"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-tags.spec.ts#6. empty cases: a festival with no own rows gets exactly the globals; an unknown festivalId is 200 []"
        status: pass
    human_judgment: false
  - id: D6
    description: "Effective list carries a total, run-stable order (slug ascending, id tie-break)"
    verification:
      - kind: integration
        ref: "apps/api/test/activity-tags.spec.ts#7. ordering: repeated calls return identical id order, ascending by slug"
        status: pass
    human_judgment: false
  - id: D7
    description: "Scaffold tag/tag_translation/tagSchema/listTags fully removed from schema, contracts and API; workspace typechecks without it"
    verification:
      - kind: unit
        ref: "pnpm --filter @quiks/db build && pnpm --filter @quiks/contracts typecheck && pnpm --filter @quiks/api typecheck"
        status: pass
    human_judgment: false
  - id: D8
    description: "Idempotent global seed catalog (10 tags, DE+EN) plants cleanly and re-runs without duplicating rows"
    verification:
      - kind: integration
        ref: "pnpm --filter @quiks/db db:seed (run twice, identical 10 ids both times; activity_tag=10, activity_tag_translation=20)"
        status: pass
    human_judgment: false
  - id: D9
    description: "Live dev-server proof: GET /api/v1/festivals/{seedId}/activity-tags returns 200 with 10 entries against the real running NestJS process, not just the test harness"
    verification:
      - kind: manual_procedural
        ref: "Real Mailpit OTP round-trip against http://localhost:8081, curl-equivalent GET returned 200 with 10 entries carrying id/slug/title"
        status: pass
    human_judgment: false

duration: ~20min
completed: 2026-08-15
status: complete
---

# Phase 10 Plan 01: Activities Backend Tracer — Tag Substance Summary

**Replaced the scaffold `tag`/`tag_translation`/`listTags` with the ADR-017 tag model (nullable-`festivalId` global catalog + per-festival activation) and shipped the effective tag list end to end — schema → migration → contract → NestJS module → HTTP → integration spec.**

## Performance

- **Duration:** ~20 min (three tasks, one interactive tracer-gate checkpoint between Task 1 and Task 2/3)
- **Started:** 2026-08-15T01:05Z (approx.)
- **Completed:** 2026-08-15T01:25Z
- **Tasks:** 3
- **Files modified:** 19 (11 modified, 8 created)

## Accomplishments

- Removed the scaffold `tag`/`tag_translation` tables, `tagSchema`, and the `listTags` route/service/controller method entirely — a pure-DROP migration (`0007_milky_exiles.sql`) with no interactive rename prompt
- Added `activity_tag` (nullable `festivalId` — the one deliberate SEC-03 exception), `activity_tag_translation`, and `festival_activity_tag`, guarded by two partial unique indexes that scope slug uniqueness separately for the global and per-festival namespaces
- Applied both migrations to the local Docker Postgres and planted 10 global start tags (DE+EN) via an idempotent seed upsert
- Shipped `GET /api/v1/festivals/:festivalId/activity-tags` — activated global tags union the festival's own, both scope conditions inside one SQL WHERE clause, titles resolved via the existing `resolveLocalized` locale-fallback helper
- New `apps/api/test/activity-tags.spec.ts` proves all 7 must-have truths, including the SEC-03 nullable-`festivalId` cross-tenant case via a serialized-body check
- Live-verified against the actual running dev server (not just the test harness) through a real Mailpit OTP round-trip

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold-Tag-Substanz stilllegen und die Drop-Migration erzeugen (D-01)** — `6171cba` (feat, tracer)
2. **Task 2: ActivityTag-Schema, Create-Migration, Anwendung auf die lokale DB und Startkatalog (D-02/D-03/D-05/D-06)** — `23153a2` (feat)
3. **Task 3: Effektive Tag-Liste end-to-end — Contract, ActivityModule und Integrationsspec (D-02/D-04/D-05, SEC-03)** — `de95fbe` (feat)

_Note: an interactive tracer feedback gate (checkpoint:human-verify) ran between Task 1 and Task 2, per the plan's `type="tracer"` protocol — Task 1's fully-automated `<verify>` (build+typecheck) was re-confirmed green and the coordinator approved continuation before Task 2 touched the local database._

## Files Created/Modified

- `packages/db/src/schema/activity-tag.ts` - `activityTag`/`activityTagTranslation`/`festivalActivityTag` tables + drizzle-zod insert/select schemas
- `packages/db/src/schema/index.ts` - drops `./tag` export, adds `./activity-tag`
- `packages/db/drizzle/0007_milky_exiles.sql` - pure `DROP TABLE` for `tag`/`tag_translation`
- `packages/db/drizzle/0008_smooth_mantis.sql` - pure `CREATE TABLE` for the three new tables + both partial unique indexes
- `packages/db/scripts/seed.ts` - idempotent planting loop for the 10 global activity tags (DE+EN)
- `packages/contracts/src/schemas.ts` - removes `tagSchema`/`Tag`, adds `activityTagSchema`/`ActivityTag`
- `packages/contracts/src/router.ts` - removes `listTags`, adds `listActivityTags`
- `apps/api/src/activity/activity.module.ts` - new module, mirrors `FestivalModule`
- `apps/api/src/activity/activity.controller.ts` - `@TsRestHandler(contract.listActivityTags)`, `festivalId` from params only
- `apps/api/src/activity/activity.service.ts` - `listEffectiveTags`: LEFT JOIN `festivalActivityTag` + `activityTagTranslation`, both scope conditions in the WHERE clause, `resolveLocalized` for titles
- `apps/api/src/festival/festival.service.ts` / `festival.controller.ts` - `listTags` method/handler removed
- `apps/api/src/app.module.ts` - registers `ActivityModule`
- `apps/api/test/activity-tags.spec.ts` - new integration spec, 7 test cases
- `apps/api/test/auth-guard.spec.ts` - Rule 1 fix: stale reference to the removed `/tags` route updated to `/activity-tags`

## Decisions Made

- D-01 executed as replace-not-migrate: `tag.ts` deleted outright, and the drop/create migrations were generated as two SEPARATE `drizzle-kit generate` passes (not one combined diff) specifically to avoid `drizzle-kit`'s interactive rename-detection prompt, which would hang an autonomous executor. Confirmed clean: neither generation run produced a prompt.
- The nullable-tenant exception is enforced with TWO partial unique indexes rather than one plain constraint — a plain `unique()` on `(festivalId, slug)` would let two `NULL`-festivalId rows collide-free (Postgres NULLs are never equal to each other), so a second global tag could silently reuse an existing slug. The two partial indexes close that gap explicitly.
- `festival_activity_tag.enabled` is an explicit boolean column (default `true`), not "row presence = disabled" — this matches D-05's opt-out default (no admin UI exists yet to intentionally activate rows) and leaves a clean toggle path for the `admin` workstream to re-enable a tag later without a delete+reinsert.
- Seed upsert targets the partial unique index directly via `onConflictDoUpdate({ target, targetWhere })` rather than `onConflictDoNothing` + a follow-up re-select — verified idempotent by running `db:seed` twice and confirming identical row ids both times.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale test reference to the removed `/festivals/:festivalId/tags` route**
- **Found during:** Task 3 (running the full `apps/api` suite after wiring the new endpoint)
- **Issue:** `apps/api/test/auth-guard.spec.ts` still asserted a 401 for the OLD `GET /api/v1/festivals/:festivalId/tags` path removed in Task 1 — the route now 404s (unmatched) instead of 401, since a nonexistent route never reaches the AuthGuard.
- **Fix:** Updated the test's path to the new `/festivals/:festivalId/activity-tags` route, preserving the same SEC-01 comprehensive-coverage intent (every non-`@AllowAnonymous` endpoint gets an anonymous-401 assertion).
- **Files modified:** `apps/api/test/auth-guard.spec.ts`
- **Verification:** Full `apps/api` suite green afterward (147/147 tests, 17/17 files)
- **Committed in:** `de95fbe` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug fix)
**Impact on plan:** Direct, unavoidable fallout of Task 1's own scope (removing `listTags`) — no scope creep, fixed within the same commit that introduced the replacement route.

## Issues Encountered

- `pnpm --filter @quiks/api typecheck` initially failed after adding `activityTagSchema`/`listActivityTags` because `@quiks/contracts`'s `dist/` output was stale (the package's `typecheck` script runs `tsc --noEmit` against source, but `@quiks/api` resolves `@quiks/contracts` through its built `dist/`). Resolved by running `pnpm --filter @quiks/contracts build` before the API typecheck — not a code bug, just a build-order note for anyone re-running these commands standalone instead of through Turbo's dependency graph.
- The plan's live-verification step assumed a straightforward curl; the local dev environment sends OTP codes via SMTP to Mailpit (`OTP_EMAIL_TRANSPORT=mailpit`), not the dev capture-file transport the integration test suite forces. Performed a real OTP round-trip against Mailpit's REST API (`localhost:8025`) to obtain a session cookie for the live GET request, matching STATE.md's documented "OTP-Testcodes aus Mailpit :8025" convention.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The tag substrate (`activity_tag`/`activity_tag_translation`/`festival_activity_tag`) and the effective-list pattern (LEFT JOIN + WHERE-scoped union + `resolveLocalized`) are ready for plan 10-02 (Activity CRUD), which references activity tags via `tagId` on the new `activity` table.
- The nullable-`festivalId` SEC-03 exception is proven and documented — future plans touching `activity_tag` don't need to re-derive this test, only extend it if the field scope changes.
- No blockers. The local Docker Postgres carries both migrations (0007 drop, 0008 create) applied; `activity_tag` has exactly 10 rows, `activity_tag_translation` exactly 20, `festival_activity_tag` 0 (clean — all test fixtures self-cleaned in `afterAll`).
- Reminder carried from `STATE.md`: `gsd-tools requirements.mark-complete` does not resolve requirement IDs in the workstream layout — SEC-03's REQUIREMENTS.md checkbox/traceability row needs a manual update at phase close (not blocking for this plan, since SEC-03 continues to be exercised by later plans in this phase too).

## Self-Check: PASSED

- `packages/db/src/schema/activity-tag.ts` exists — FOUND
- `apps/api/src/activity/activity.module.ts`, `activity.controller.ts`, `activity.service.ts` exist — FOUND
- `apps/api/test/activity-tags.spec.ts` exists — FOUND
- `packages/db/drizzle/0007_milky_exiles.sql`, `0008_smooth_mantis.sql` exist — FOUND
- Commits `6171cba`, `23153a2`, `de95fbe` all present in `git log --oneline` — FOUND
- `pnpm --filter @quiks/api typecheck` — PASS
- `apps/api` full suite — 147/147 PASS
- Local Docker Postgres: `activity_tag`=10, `activity_tag_translation`=20 — CONFIRMED
- Live dev-server GET returned 200 with 10 entries — CONFIRMED

---
*Plan: 10-01*
*Completed: 2026-08-15*
