---
phase: 02-otp-auth-festival-backend-api
plan: 04
subsystem: api
tags: [ts-rest, drizzle-orm, drizzle-zod, postgres, zod, vitest, nestjs, better-auth, seed-script]

# Dependency graph
requires:
  - phase: 02-otp-auth-festival-backend-api (plan 01)
    provides: listFestivals/saveFestival contract entries (packages/contracts), festivalSchema
  - phase: 02-otp-auth-festival-backend-api (plan 02)
    provides: live better-auth email-OTP runtime, global AuthGuard, test/setup.ts createTestApp/createTestDatabase helpers, OTP dev-transport capture-file sign-in pattern
provides:
  - "FestivalService.listAll() — D-04 minimal shape (id/slug/name/defaultLocale/supportedLocales/cashlessUrl), unpaginated, batch-resolved supportedLocales"
  - "FestivalService.save(visitorId, festivalId) — gate-less (ADR-014), idempotent via onConflictDoNothing on my_festival's (visitorId, festivalId) composite PK, returns a not-found signal (never throws) when the festival is unknown"
  - "GET /api/v1/festivals and POST /api/v1/festivals/:festivalId/save wired on FestivalController as @TsRestHandler methods; save uses @Session() to scope writes to the caller, never a client-supplied visitorId"
  - "packages/db/scripts/seed.ts — idempotent frequency-2026 dev seed, runnable via pnpm --filter @festipal/db db:seed"
affects: [02-05]

# Tech tracking
tech-stack:
  added: ["dotenv (packages/db devDependency, for the seed script's env loading)"]
  patterns:
    - "One-shot DB scripts (packages/db/scripts/*.ts) must explicitly close the postgres.js connection (db.$client.end()) in a finally block — postgres.js otherwise keeps the event loop open and the process hangs forever after the last query resolves, even though console.log already ran (output is buffered until the process actually exits)"
    - "packages/db/scripts/*.ts scripts load env via `import 'dotenv/config'` (cwd-relative packages/db/.env) since tsx does not auto-load .env the way drizzle-kit's CLI does internally"

key-files:
  created:
    - packages/db/scripts/seed.ts
    - apps/api/test/save-idempotency.spec.ts
  modified:
    - apps/api/src/festival/festival.service.ts
    - apps/api/src/festival/festival.controller.ts
    - packages/db/package.json

key-decisions:
  - "save() returns a discriminated {status:'ok'}|{status:'not-found'} result instead of throwing — mirrors the existing getBySlug()/completeProfile() pattern in this codebase (service returns a signal, controller maps to HTTP status), keeping the 404 path a normal branch rather than an exception handler"
  - "listAll() reuses the exact locale-batching shape from MeService.listMyFestivals (SEC-02 sibling) rather than inventing a new join pattern, since both need the same festival -> festivalLocale[] resolution, just with a different WHERE scope (none vs visitorId-scoped)"

requirements-completed: [SEC-01, SEC-02]

coverage:
  - id: D1
    description: "GET /api/v1/festivals returns ALL currently-seeded festivals (no pagination), D-04 minimal shape"
    requirement: SEC-01
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/api exec tsc --noEmit -p tsconfig.json (source assertion: listAll has no .limit()/.offset())"
        status: pass
    human_judgment: false
  - id: D2
    description: "POST /api/v1/festivals/:festivalId/save is gate-less (any authenticated visitor can save any festival) and idempotent (two saves leave exactly one my_festival row)"
    requirement: SEC-02
    verification:
      - kind: integration
        ref: "apps/api/test/save-idempotency.spec.ts#saving the same festival twice both return 200 and leave exactly one my_festival row"
        status: pass
    human_judgment: false
  - id: D3
    description: "save of an unknown festivalId returns a clean 404, never a thrown 500 or orphan my_festival row"
    verification:
      - kind: integration
        ref: "apps/api/test/save-idempotency.spec.ts#saving an unknown festival id returns 404"
        status: pass
    human_judgment: false
  - id: D4
    description: "Concurrent saves of the same (visitorId, festivalId) do not create duplicate rows (composite PK guarantee)"
    verification: []
    human_judgment: true
    rationale: "Plan marks this truth as 'backstop' verification — proven structurally by the composite PK + onConflictDoNothing() (directly exercised sequentially in D2), but a genuinely concurrent (parallel, not sequential) race test was out of this plan's task scope."
  - id: D5
    description: "packages/db/scripts/seed.ts idempotently inserts frequency-2026 (de default, de+en locales, no cashlessUrl) and is re-runnable as a no-op/refresh"
    requirement: SEC-01
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/db db:seed run twice manually against the live dev DB — both runs return the same festival id (21f3ec59-7e3c-4867-9a15-b97392b1a7c5), second run refreshes without erroring"
        status: pass
    human_judgment: false

# Metrics
duration: 24min
completed: 2026-08-02
status: complete
---

# Phase 2 Plan 4: Festival Browse + Gate-less Save + Dev Seed Summary

**Extended `FestivalService`/`FestivalController` with `listAll` (D-04 unpaginated browse) and a gate-less, idempotent `save` (composite-PK `onConflictDoNothing`, 404 on unknown festival), and added the reusable `frequency-2026` seed script — fixing two blocking bugs the seed script's own manual verification surfaced (missing env loading, and a process that silently hung forever after seeding because the DB connection was never closed).**

## Performance

- **Duration:** 24 min
- **Started:** 2026-08-02T11:26:00Z
- **Completed:** 2026-08-02T11:50:00Z
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- `FestivalService.listAll()` — selects every `festival` row, batch-resolves each one's `supportedLocales` from `festivalLocale` (same locale-batching pattern as `MeService.listMyFestivals`), maps to the frozen D-04 shape (`id`/`slug`/`name`/`defaultLocale`/`supportedLocales`/`cashlessUrl`), no pagination
- `FestivalService.save(visitorId, festivalId)` — existence check first (returns `{status:'not-found'}` if the festival doesn't exist, enabling a clean 404), then `insert(myFestival).values({...}).onConflictDoNothing()` on the `(visitorId, festivalId)` composite PK — gate-less (ADR-014, no membership/ticket check), idempotent, scoped only by `session.user.id`
- `FestivalController` gained `listFestivals` (session-required, unscoped browse — inherits the global `AuthGuard`, no `@AllowAnonymous`) and `saveFestival` (`@Session()`-scoped, maps `{status:'ok'}` -> 200 `{saved:true}` and `{status:'not-found'}` -> 404) `@TsRestHandler` methods
- `packages/db/scripts/seed.ts` — idempotent `frequency-2026` seed (`onConflictDoUpdate` keyed on `festival.slug`'s unique constraint, `onConflictDoNothing` on the `festivalLocale` composite PK), verified end-to-end by running `pnpm --filter @festipal/db db:seed` twice against the live dev DB — both runs returned the same festival id, second run refreshed with no error
- `apps/api/test/save-idempotency.spec.ts` — real OTP sign-in (mirrors `me-endpoints.spec.ts`'s pattern) + a directly-seeded `visitor_profile`/`festival` fixture, then two `POST /festivals/:id/save` calls both 200 and exactly one `my_festival` row afterward, plus a 404 case for an unknown uuid — both tests green; full `apps/api` suite (4 files, 15 tests) still green afterward

## Task Commits

Each task was committed atomically:

1. **Task 1: festival.service — listAll (D-04 shape) + gate-less idempotent save** - `946ae72` (feat)
2. **Task 2: festival.controller handlers + idempotent seed + idempotency spec** - `76b1431` (feat)

**Plan metadata:** _pending_ (docs commit, see below)

## Files Created/Modified
- `apps/api/src/festival/festival.service.ts` - added `listAll()` and `save()` alongside the existing `getBySlug()`/`listTags()`
- `apps/api/src/festival/festival.controller.ts` - added `listFestivals`/`saveFestival` `@TsRestHandler` methods
- `packages/db/scripts/seed.ts` - new idempotent `frequency-2026` seed script
- `packages/db/package.json` - added `dotenv` devDependency (seed script env loading)
- `apps/api/test/save-idempotency.spec.ts` - new integration spec

## Decisions Made
- `save()` returns a discriminated `{status:'ok'}|{status:'not-found'}` result rather than throwing on an unknown festival — consistent with this codebase's established service-returns-signal/controller-maps-to-status pattern (`getBySlug`, `completeProfile`).
- `listAll()`'s locale-batching logic intentionally mirrors `MeService.listMyFestivals`'s shape (same festival -> `festivalLocale[]` resolution) rather than inventing a new join style — the two endpoints differ only in `WHERE` scope (none vs. `visitorId`-scoped), keeping the pattern recognizable across both browse and my-festivals reads.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] seed.ts hung indefinitely after seeding instead of exiting**
- **Found during:** Task 2 manual verification (`pnpm --filter @festipal/db db:seed`, per the plan's `<verification>` step)
- **Issue:** The script's `void seed()` top-level call never closed the `postgres.js` connection `createDatabase()` opened. `postgres.js` keeps the Node event loop alive indefinitely until `.end()` is called, so the process never exited — worse, `console.log`'s output was buffered and never flushed to the redirected background-task output either, making the hang look like a silent freeze with zero output rather than a clean success. Confirmed the insert itself *had* succeeded by querying the DB directly with a throwaway self-terminating script before fixing the root cause.
- **Fix:** Wrapped the seed logic in a `try/finally` and added `await db.$client.end()` in the `finally` block — `drizzle-orm`'s postgres-js driver exposes the underlying `postgres.js` client via `db.$client`. The script now logs and exits cleanly on both success and failure paths.
- **Files modified:** `packages/db/scripts/seed.ts`
- **Verification:** Ran `pnpm --filter @festipal/db db:seed` twice in a row — both runs completed within seconds, logged `Seeded festival: frequency-2026 (21f3ec59-7e3c-4867-9a15-b97392b1a7c5)`, and returned to the shell prompt (no hang). Same festival id both runs confirms the upsert is idempotent.
- **Committed in:** `76b1431` (Task 2 commit)

**2. [Rule 3 - Blocking] seed.ts had no source for `DATABASE_URL_UNPOOLED`/`DATABASE_URL` when run standalone**
- **Found during:** Task 2 manual verification (first `pnpm --filter @festipal/db db:seed` attempt)
- **Issue:** `tsx scripts/seed.ts` does not auto-load `.env` the way `drizzle-kit`'s CLI does internally for `db:generate`/`db:migrate`/`db:push`. The script threw its own "DATABASE_URL_UNPOOLED or DATABASE_URL must be set" guard error immediately, even though `packages/db/.env` exists on disk with valid values.
- **Fix:** Added `dotenv` as a `packages/db` devDependency and `import 'dotenv/config'` as the script's first import — mirrors the exact pattern `apps/api/test/setup.ts` already uses for the same problem (loading `.env` for a non-NestJS-DI entry point). `dotenv` loads from the current working directory's `.env` by default, which is `packages/db/.env` when the script runs via `pnpm --filter @festipal/db db:seed`.
- **Files modified:** `packages/db/package.json`, `packages/db/scripts/seed.ts`, `pnpm-lock.yaml`
- **Verification:** `pnpm --filter @festipal/db db:seed` now resolves `DATABASE_URL_UNPOOLED`/`DATABASE_URL` correctly and connects on the first attempt.
- **Committed in:** `76b1431` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes are scoped entirely to the new `seed.ts` script and its `packages/db` env-loading — no production request-path code (service/controller) was touched by either fix. The plan's own `<verification>` step ("Manual: `pnpm --filter @festipal/db db:seed` twice → second run is a no-op/refresh") is exactly what surfaced both issues; without running that manual step, the seed script would have shipped silently broken (hangs forever, and fails outright without a `.env`-adjacent `DATABASE_URL` already exported in the parent shell).

## Issues Encountered
A background `pnpm --filter @festipal/db db:seed` invocation from before the connection-close fix was left running (hung, per deviation #1) and had to be terminated manually via `taskkill` on its process tree before re-running the fixed script. No data corruption resulted — the hung process had already completed its (idempotent) insert before hanging on exit.

## User Setup Required
None - `DATABASE_URL_UNPOOLED`/`DATABASE_URL` were already present in `packages/db/.env` (set during earlier phase setup); no new external service configuration required this plan.

## Next Phase Readiness
- Browse (`GET /api/v1/festivals`) and gate-less save (`POST /api/v1/festivals/:festivalId/save`) are implemented, session-scoped, and idempotent; the dev DB now has one seeded, browsable festival (`frequency-2026`) for any later manual/live verification.
- `packages/db/scripts/seed.ts` is a safe, re-runnable dev/staging utility any future plan (or CI smoke step) can invoke without side effects beyond a no-op refresh.
- Ready for Plan 05 per the phase's wave map — no blockers.

---
*Phase: 02-otp-auth-festival-backend-api*
*Completed: 2026-08-02*

## Self-Check: PASSED

- FOUND: apps/api/src/festival/festival.service.ts
- FOUND: apps/api/src/festival/festival.controller.ts
- FOUND: packages/db/scripts/seed.ts
- FOUND: apps/api/test/save-idempotency.spec.ts
- FOUND: 946ae72 (Task 1 commit)
- FOUND: 76b1431 (Task 2 commit)
