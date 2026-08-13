---
phase: 02-otp-auth-festival-backend-api
plan: 03
subsystem: api
tags: [ts-rest, drizzle-orm, drizzle-zod, postgres, zod, vitest, nestjs, better-auth]

# Dependency graph
requires:
  - phase: 02-otp-auth-festival-backend-api (plan 01)
    provides: completeProfile/usernameAvailability/listMyFestivals contract entries (packages/contracts), visitorProfileInsertSchema/visitorProfileSelectSchema drizzle-zod bases
  - phase: 02-otp-auth-festival-backend-api (plan 02)
    provides: live better-auth email-OTP runtime, global AuthGuard, GET /me tracer (me.controller.ts/me.service.ts/me.module.ts), test/setup.ts createTestApp/createTestDatabase helpers, test/smoke/otp-me-smoke.mjs OTP round-trip pattern
provides:
  - "MeService.completeProfile(accountId, input) — inserts visitor_profile, catches Postgres 23505 via err.cause instanceof PostgresError and maps a duplicate (case-insensitive) username to a clean { status: 'conflict' } result instead of a thrown 500 (Pitfall 11)"
  - "MeService.checkUsernameAvailability(username) — advisory-only lower(username) SELECT"
  - "MeService.listMyFestivals(visitorId) — WHERE eq(myFestival.visitorId, visitorId) join to festival + batched festivalLocale fetch for supportedLocales (SEC-02, never a request param)"
  - "POST /api/v1/me/complete-profile, GET /api/v1/me/username-availability, GET /api/v1/me/festivals wired on MeController as @TsRestHandler methods ({status, body} tuples, no thrown exceptions for the 409 case)"
  - "A drizzle-orm/drizzle-zod TS-level type-inference bug fix in packages/db/src/schema/visitor-profile.ts (text() columns without an explicit enum config were collapsing VisitorProfilePublic/CompleteProfileBody to all-unknown fields) — the exported contract types are now genuinely concrete"
affects: [02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Postgres 23505 -> conflict mapping: catch (err as { cause?: unknown }).cause, check cause instanceof PostgresError && cause.code === '23505', never check err directly (drizzle-orm/postgres.js wraps the driver error)"
    - "SEC-02 caller-scoped read: WHERE eq(<table>.visitorId, visitorId) where visitorId is always session.user.id, passed as a service-method argument, never read from a query/path param"
    - "Zod schema field brokenness workaround: when a drizzle-zod-derived schema's TS type collapses to unknown for a text() column (no explicit {enum:[...]} config), fix with .extend({ col: z.string() ... }) on the drizzle-zod base rather than the schema's own refine parameter (refine re-triggers the same broken column-type computation internally)"

key-files:
  created:
    - apps/api/test/username-race.spec.ts
    - apps/api/test/me-endpoints.spec.ts
  modified:
    - apps/api/src/me/me.service.ts
    - apps/api/src/me/me.controller.ts
    - packages/db/src/schema/visitor-profile.ts
    - packages/contracts/package.json
    - apps/api/package.json

key-decisions:
  - "Fixed the drizzle-zod text()-column type-inference bug at its source (packages/db/src/schema/visitor-profile.ts, via .extend() on the drizzle-zod base) rather than working around it locally in me.service.ts — the broken VisitorProfilePublic/CompleteProfileBody types are PUBLISHED contract types every future consumer (admin, mobile) will import, so fixing it once at the source benefits every caller instead of just this plan's usage."
  - "postgres added as a direct apps/api dependency (previously only reachable transitively via @festipal/db) — needed for the PostgresError import per RESEARCH.md Pattern 3; pinned to the same ^3.4.9 range already used in packages/db."
  - "drizzle-zod added as a direct packages/contracts dependency, pinned to the exact 0.7.1 already used in packages/db — required so packages/contracts's own tsup dts build can resolve the drizzle-zod-derived types it re-exports (was an implicit/undeclared dependency before)."
  - "username-race.spec.ts uses randomized usernames (not the literal 'foo'/'FOO' from RESEARCH.md's illustrative example) so the test is safely re-runnable against the real Neon dev DB without cross-run collisions from a prior partial cleanup."
  - "Added HTTP-level coverage for GET /me/username-availability beyond what Task 2's action strictly required (only completeProfile/listMyFestivals were named) — the endpoint is part of Task 2's shipped surface and was otherwise only exercised at the service layer."

requirements-completed: [SEC-01, SEC-02]

coverage:
  - id: D1
    description: "POST /api/v1/me/complete-profile inserts the visitor_profile row and returns 200 with the public profile"
    requirement: SEC-01
    verification:
      - kind: integration
        ref: "apps/api/test/me-endpoints.spec.ts#POST /me/complete-profile returns 200 with the public profile"
        status: pass
    human_judgment: false
  - id: D2
    description: "completeProfile is the TOCTOU-safe source of truth: a duplicate (case-variant) username is caught as Postgres 23505 and mapped to 409, never a thrown 500 — usernameAvailability is advisory only"
    requirement: SEC-01
    verification:
      - kind: unit
        ref: "apps/api/test/username-race.spec.ts#second completeProfile with a case-variant username returns conflict, not a thrown 500"
        status: pass
      - kind: integration
        ref: "apps/api/test/me-endpoints.spec.ts#a duplicate (case-variant) username on complete-profile returns 409"
        status: pass
    human_judgment: false
  - id: D3
    description: "GET /api/v1/me/festivals returns only the caller's saved festivals, scoped by session.user.id — never a request parameter"
    requirement: SEC-02
    verification:
      - kind: integration
        ref: "apps/api/test/me-endpoints.spec.ts#GET /me/festivals returns exactly the caller-saved festival"
        status: pass
    human_judgment: false
  - id: D4
    description: "GET /api/v1/me/username-availability reflects live case-insensitive username availability"
    verification:
      - kind: integration
        ref: "apps/api/test/me-endpoints.spec.ts#GET /me/username-availability reflects the taken username as unavailable"
        status: pass
      - kind: integration
        ref: "apps/api/test/me-endpoints.spec.ts#GET /me/username-availability reports an unused username as available"
        status: pass
    human_judgment: false
  - id: D5
    description: "Concurrent duplicate-username complete-profile calls: exactly one succeeds, the loser gets 409, deterministically enforced by the DB unique index (not application logic)"
    requirement: SEC-01
    verification: []
    human_judgment: true
    rationale: "The plan marks this truth as 'backstop' verification — it's proven structurally by the lower(username) unique index + the 23505->409 catch (both directly tested sequentially in D2), but a genuinely concurrent (parallel, not sequential) race test was out of this plan's task scope and wasn't written; the sequential proof is the closest automated evidence."

# Metrics
duration: 40min
completed: 2026-08-02
status: complete
---

# Phase 2 Plan 3: Me Module — Profile Completion, Username Availability, My Festivals Summary

**MeService/MeController expanded from the GET /me tracer into complete-profile (TOCTOU-safe 23505->409), advisory username-availability, and SEC-02-scoped listMyFestivals — plus a source-level fix for a drizzle-zod type-inference bug that had silently made the contract's VisitorProfilePublic/CompleteProfileBody types unusable.**

## Performance

- **Duration:** 40 min
- **Started:** 2026-08-02T13:00:00Z
- **Completed:** 2026-08-02T13:39:07Z
- **Tasks:** 2
- **Files modified:** 7 (2 created, 5 modified)

## Accomplishments
- `MeService.completeProfile` inserts `visitor_profile` and independently catches Postgres `23505` (via `err.cause instanceof PostgresError`) to return a clean `{ status: 'conflict' }` — never trusts the prior advisory `checkUsernameAvailability` call (Pitfall 11)
- `MeService.checkUsernameAvailability` is a plain `lower(username)` advisory `SELECT`
- `MeService.listMyFestivals` is scoped exclusively by the caller's `visitorId` (`session.user.id`) via `WHERE eq(myFestival.visitorId, visitorId)` — never a request parameter (SEC-02) — with a batched `festivalLocale` fetch to build each festival's `supportedLocales`
- `MeController` gained three `@TsRestHandler` methods (`completeProfile`, `usernameAvailability`, `listMyFestivals`), all using `{status, body}` tuples with no thrown exceptions for the expected 409 case
- Found and fixed a drizzle-orm/drizzle-zod TS-level type-inference bug at its source (`packages/db/src/schema/visitor-profile.ts`): `text()` columns without an explicit `{enum:[...]}` config make drizzle-orm infer `enumValues: [string, ...string[]]` instead of `undefined`, which trips drizzle-zod's enum-detection heuristic and collapsed `VisitorProfilePublic`/`CompleteProfileBody`/`Me` to all-`unknown` fields at the type level (runtime Zod validation was always correct — confirmed empirically before fixing). Fixed via `.extend({...})` on the drizzle-zod base for the 4 affected text columns.
- `apps/api/test/username-race.spec.ts` (service-level) and `apps/api/test/me-endpoints.spec.ts` (in-process HTTP, real OTP sign-in via the dev-transport capture file) both green — 9 tests total, plus 2 more added for `GET /me/username-availability` HTTP coverage (11 new tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: me.service — completeProfile (23505->409), usernameAvailability, listMyFestivals** - `341cbc9` (feat) — includes the drizzle-zod/postgres dependency fixes this task's typecheck surfaced as blocking
2. **Task 2: me.controller handlers + username-race + me-endpoints specs** - `490e884` (test)
3. **Follow-up: HTTP-level coverage for GET /me/username-availability** - `fdebeb4` (test)

**Plan metadata:** _pending_ (docs commit, see below)

## Files Created/Modified
- `apps/api/src/me/me.service.ts` - `completeProfile`, `checkUsernameAvailability`, `listMyFestivals` added alongside the existing `getProfile`
- `apps/api/src/me/me.controller.ts` - `completeProfile`, `usernameAvailability`, `listMyFestivals` `@TsRestHandler` methods added alongside `getMe`
- `apps/api/test/username-race.spec.ts` - service-level Pitfall-11 race proof (advisory check -> insert A ok -> case-variant insert B conflict)
- `apps/api/test/me-endpoints.spec.ts` - in-process HTTP suite: OTP sign-in helper (mirrors `test/smoke/otp-me-smoke.mjs`), profile-null -> complete -> populated, duplicate-username 409, username-availability (taken/unused), directly-seeded `my_festival` row -> `GET /me/festivals` returns exactly that festival
- `packages/db/src/schema/visitor-profile.ts` - `.extend()` overrides on `visitorProfileInsertSchema`/`visitorProfileSelectSchema` for `accountId`/`username`/`displayName`/`avatar` to fix the drizzle-zod type-inference bug
- `packages/contracts/package.json` - added `drizzle-zod` (`0.7.1`, exact pin matching `packages/db`) as a direct dependency, required for `packages/contracts`'s own `tsup` dts build to resolve the drizzle-zod-derived types it re-exports
- `apps/api/package.json` - added `postgres` (`^3.4.9`, matching `packages/db`'s pin) as a direct dependency, needed for the `PostgresError` import

## Decisions Made
- Fixed the drizzle-zod type bug at its source (`visitor-profile.ts`) rather than casting/working around it locally in `me.service.ts` — `VisitorProfilePublic`/`CompleteProfileBody` are published contract types future consumers (admin, mobile) will import directly; a source fix benefits every caller, not just this plan.
- `username-race.spec.ts` uses randomized (not literal `'foo'`/`'FOO'`) usernames so the test stays safely re-runnable against the real Neon dev DB without stale-data collisions from a prior interrupted run.
- Added `GET /me/username-availability` HTTP coverage beyond Task 2's literal scope (only `completeProfile`/`listMyFestivals` were named) since the endpoint is part of the same shipped controller surface and was otherwise untested at the HTTP layer.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `postgres` as a direct `apps/api` dependency**
- **Found during:** Task 1 (`pnpm --filter @festipal/api exec tsc --noEmit`, first pass on `me.service.ts`)
- **Issue:** RESEARCH.md Pattern 3 requires `import { PostgresError } from 'postgres'`, but `postgres` was only a transitive dependency (via `@festipal/db`) — not resolvable from `apps/api`'s own module resolution under pnpm's strict workspace linking.
- **Fix:** Added `"postgres": "^3.4.9"` to `apps/api/package.json` dependencies (same range already used in `packages/db`), ran `pnpm install --filter @festipal/api`.
- **Files modified:** `apps/api/package.json`, `pnpm-lock.yaml`
- **Verification:** `import { PostgresError } from 'postgres'` resolves; `tsc --noEmit` no longer errors on that import.
- **Committed in:** `341cbc9` (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed a drizzle-orm/drizzle-zod TS-level type-inference bug collapsing `VisitorProfilePublic`/`CompleteProfileBody` to all-`unknown` fields**
- **Found during:** Task 1 (`pnpm --filter @festipal/api exec tsc --noEmit` on `me.service.ts`'s `completeProfile`, spreading `...input` into `.values(...)`)
- **Issue:** `visitor_profile`'s `username`/`displayName`/`avatar`/`accountId` columns are plain `text()` (no explicit `{enum:[...]}` config). Under drizzle-orm's `text()` no-arg overload, this infers `enumValues: [string, ...string[]]` (a generic non-`undefined` tuple) rather than `enumValues: undefined`. drizzle-zod's `GetZodType`/`GetEnumValuesFromColumn` type-level logic treats any non-`undefined` `enumValues` as a real enum, misrouting the type computation and collapsing the field to `unknown` (with an `[x: string]: any` index signature papering over it in RETURN-position usage — which is why the existing `getProfile`/tracer code from Plan 02 never hit this). Confirmed via an isolated `tsc` scratch check that the RUNTIME Zod schema was always correct (`z.ZodString`, validates/rejects correctly) — this was a static-type-only defect. Passing a refine map to `createInsertSchema`/`createSelectSchema` does NOT fix it (the refine's own allowed-value type is computed via the same broken logic); the working fix is `.extend({...})` directly on the zod object, which fully replaces the affected keys' shape.
- **Fix:** `packages/db/src/schema/visitor-profile.ts` — `visitorProfileInsertSchema`/`visitorProfileSelectSchema` now `.extend({ accountId: z.string(), username: z.string(), displayName: z.string(), avatar: z.string().nullable()[.optional()] })` on top of the drizzle-zod base. Also required adding `drizzle-zod` as a direct `packages/contracts` dependency (was previously resolvable only because `packages/db`'s own build happened to embed a working reference — confirmed necessary for `packages/contracts`'s own `tsup` dts build to type-check cleanly against the corrected base).
- **Files modified:** `packages/db/src/schema/visitor-profile.ts`, `packages/contracts/package.json`, `pnpm-lock.yaml`
- **Verification:** Isolated `tsc` scratch checks (temporary files, removed) before/after confirmed `z.infer<typeof visitorProfileInsertSchema>`/`visitorProfileSelectSchema` are now fully concrete (`{accountId: string; username: string; displayName: string; avatar: string | null}`-shaped, no `unknown`); `packages/contracts`'s built `.d.ts` now shows `CompleteProfileBody`/`VisitorProfilePublic`/`Me` as fully concrete types; `pnpm --filter @festipal/db exec tsc --noEmit`, `pnpm --filter @festipal/contracts exec tsc --noEmit`, and `pnpm --filter @festipal/api exec tsc --noEmit -p tsconfig.json` all pass with zero errors.
- **Committed in:** `341cbc9` (Task 1 commit)

**3. [Rule 1 - Bug] Guarded against an `undefined` row after `visitorProfile` insert / handled `Locale[]` typing for `listMyFestivals`**
- **Found during:** Task 1 (`tsc --noEmit`, after the above fixes)
- **Issue:** `.returning({...})`'s destructured `[row]` is typed possibly `undefined` by drizzle-orm (empty-array edge case); the `localesByFestival` Map was typed `Map<string, string[]>` when `Festival.supportedLocales` requires `("de"|"en")[]`.
- **Fix:** Added an explicit `if (!row) throw new Error(...)` guard after the insert (an empty return from a successful insert would be a genuine bug, not a valid runtime state); retyped the Map as `Map<string, Locale[]>` (imported `Locale` from `@festipal/contracts`).
- **Files modified:** `apps/api/src/me/me.service.ts`
- **Verification:** `tsc --noEmit` clean.
- **Committed in:** `341cbc9` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All three were necessary to make Task 1's code compile and type-check correctly; deviation #2 (the drizzle-zod fix) has a codebase-wide benefit beyond this plan — every future consumer of `VisitorProfilePublic`/`CompleteProfileBody`/`Me` now gets a genuinely typed contract instead of a silently-broken one. No scope creep beyond what was required to complete the plan's stated tasks; the `.extend()` fix is scoped to exactly the 4 affected columns on `visitor_profile` and does not touch `my-festival.ts`/`auth.ts`'s drizzle-zod schemas (unused by this plan, left as-is).

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no new external service configuration required this plan.

## Next Phase Readiness
- The `me` module's full identity/membership surface (`GET /me`, `POST /me/complete-profile`, `GET /me/username-availability`, `GET /me/festivals`) is implemented, race-safe, and caller-scoped.
- `packages/contracts`'s `VisitorProfilePublic`/`CompleteProfileBody`/`Me` types are now genuinely usable — Plan 04/05 (and any future admin/mobile consumers) inherit correctly typed contracts instead of the previously broken `unknown`-field shapes.
- Ready for Plan 04 (per `02-PLAN.md`'s wave map: festival browse/save/`listMyFestivals`-adjacent work, `packages/db/scripts/seed.ts`) — no blockers. Plan 04 touches `apps/api/src/festival/*` and `packages/db/scripts/seed.ts`, disjoint from this plan's files.

---
*Phase: 02-otp-auth-festival-backend-api*
*Completed: 2026-08-02*

## Self-Check: PASSED

- FOUND: apps/api/src/me/me.service.ts
- FOUND: apps/api/src/me/me.controller.ts
- FOUND: apps/api/test/username-race.spec.ts
- FOUND: apps/api/test/me-endpoints.spec.ts
- FOUND: packages/db/src/schema/visitor-profile.ts
- FOUND: 341cbc9 (Task 1 commit)
- FOUND: 490e884 (Task 2 commit)
- FOUND: fdebeb4 (follow-up commit)
