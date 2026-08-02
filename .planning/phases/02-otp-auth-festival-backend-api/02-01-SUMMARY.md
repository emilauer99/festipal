---
phase: 02-otp-auth-festival-backend-api
plan: 01
subsystem: api
tags: [contracts, ts-rest, zod, drizzle-zod, vitest, better-auth, env-config]

# Dependency graph
requires:
  - phase: 01-identity-schema-auth-foundation
    provides: vendored better-auth OTP schema, visitor_profile/my_festival tables, drizzle-zod bases (visitorProfileInsertSchema/visitorProfileSelectSchema/myFestivalSelectSchema)
provides:
  - Installed auth/email/test dependencies (better-auth, @thallesp/nestjs-better-auth, resend, vitest, supertest, @nestjs/testing) in apps/api
  - apps/api vitest integration harness (vitest.config.ts + test/setup.ts with createTestDatabase/createTestApp helpers) every later plan's <automated> verify depends on
  - Memoized `env` singleton in apps/api/src/config/env.ts with required BETTER_AUTH_SECRET and new RESEND_API_KEY/DATABASE_URL_UNPOOLED/OTP_EMAIL_TRANSPORT vars
  - Full drizzle-zod-derived /api/v1 contract surface (getMe, completeProfile, usernameAvailability, listFestivals, saveFestival, listMyFestivals) frozen for Wave 2/3 handler implementation
affects: [02-02, 02-03, 02-04, 02-05]

# Tech tracking
tech-stack:
  added: [better-auth@1.6.25 (apps/api), "@thallesp/nestjs-better-auth@^2.7.0", resend@^6.18.1, vitest@^4.1.10, supertest, "@nestjs/testing", tsx (packages/db)]
  patterns:
    - "Contract schemas compose on drizzle-zod bases via .pick()/.omit() — never hand-redeclared z.object mirrors of DB columns (Pitfall 6)"
    - "env.ts exports a memoized `export const env = loadEnv()` singleton so new modules import env instead of adding raw loadEnv() call sites"
    - "vitest test/setup.ts doubles as the vitest setupFile AND an importable helper module (createTestDatabase, createTestApp) for later integration specs"

key-files:
  created:
    - apps/api/vitest.config.ts
    - apps/api/test/setup.ts
  modified:
    - apps/api/package.json
    - apps/api/.env.example
    - apps/api/src/config/env.ts
    - packages/db/package.json
    - packages/contracts/src/schemas.ts
    - packages/contracts/src/router.ts

key-decisions:
  - "GET /me response shape locked as { accountId, email, profile: VisitorProfilePublic | null } — profile:null discriminates first-login-needs-profile vs returning visitor (RESEARCH.md A4 default, Open Question 1 resolved)"
  - "listFestivals/listMyFestivals both return z.array(festivalSchema) — reused the existing schema rather than deriving a new shape from myFestivalSelectSchema, since the response is festival data, not the join row itself"
  - "saveFestival needed an empty z.object({}) request body — ts-rest's AppRouteMutation type requires `body` on every POST/PUT/PATCH/DELETE route even when there's no payload"

requirements-completed: [SEC-01, SEC-02]

coverage:
  - id: D1
    description: "auth/email/test dependencies installed in apps/api; packages/db gets tsx + db:seed script"
    requirement: SEC-01
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/api exec vitest run --passWithNoTests"
        status: pass
    human_judgment: false
  - id: D2
    description: "apps/api vitest integration harness (vitest.config.ts + test/setup.ts) boots green with zero specs"
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/api exec vitest run --passWithNoTests"
        status: pass
    human_judgment: false
  - id: D3
    description: "env.ts hardened into a memoized singleton; BETTER_AUTH_SECRET required, RESEND_API_KEY/DATABASE_URL_UNPOOLED/OTP_EMAIL_TRANSPORT added"
    requirement: SEC-01
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/api exec tsc --noEmit -p tsconfig.json"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full /api/v1 contract surface (getMe, completeProfile, usernameAvailability, listFestivals, saveFestival, listMyFestivals) published, drizzle-zod-derived, better-auth routes excluded"
    requirement: SEC-02
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/contracts exec tsc --noEmit && pnpm --filter @festipal/contracts build"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-08-02
status: complete
---

# Phase 2 Plan 1: Wave 0 Foundation Summary

**Installed the auth/email/test dependency set, hardened env.ts into a memoized singleton, stood up the apps/api vitest harness, and published the complete drizzle-zod-derived /api/v1 contract surface (getMe/completeProfile/usernameAvailability/listFestivals/saveFestival/listMyFestivals) with zero runtime behavior yet.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-02T10:57:00Z
- **Completed:** 2026-08-02T11:22:00Z
- **Tasks:** 3
- **Files modified:** 8 (2 created, 6 modified)

## Accomplishments
- `better-auth`, `@thallesp/nestjs-better-auth`, `resend` installed as apps/api runtime deps; `vitest`, `supertest`, `@types/supertest`, `@nestjs/testing` as devDeps + a `test` script; `tsx` + `db:seed` added to packages/db
- `apps/api/vitest.config.ts` + `apps/api/test/setup.ts` (createTestDatabase, createTestApp helpers) — the integration harness every later Phase 2 plan's `<automated>` verify depends on; `vitest run --passWithNoTests` exits 0
- `apps/api/src/config/env.ts` now exports a memoized `env` singleton; `BETTER_AUTH_SECRET` is required (was optional); `RESEND_API_KEY`, `DATABASE_URL_UNPOOLED`, `OTP_EMAIL_TRANSPORT` added; `.env.example` placeholders extended, no real secret values
- Full `/api/v1` contract surface published in `packages/contracts` — six new endpoints under the single existing `c.router({...})` call, all new schemas composed on `drizzle-zod` bases, better-auth's own OTP routes intentionally absent from the contract

## Task Commits

Each task was committed atomically:

1. **Task 1: Install auth/email/test deps + stand up the vitest integration harness** - `f89d523` (feat)
2. **Task 2: Harden env.ts into a memoized singleton with the auth/email vars** - `e100b85` (feat)
3. **Task 3: Publish the full /api/v1 contract surface (interface-first, drizzle-zod-derived)** - `c868212` (feat)

**Plan metadata:** _pending_ (docs commit, see below)

## Files Created/Modified
- `apps/api/vitest.config.ts` - Node-env vitest config, globals, setupFiles: ['./test/setup.ts']
- `apps/api/test/setup.ts` - `createTestDatabase()` (prefers DATABASE_URL_UNPOOLED) + `createTestApp()` (NestJS TestingModule against AppModule) helpers for later integration specs
- `apps/api/package.json` - added better-auth/nestjs-better-auth/resend deps, vitest/supertest/@nestjs/testing devDeps, `test` script
- `apps/api/.env.example` - extended with RESEND_API_KEY, DATABASE_URL_UNPOOLED, OTP_EMAIL_TRANSPORT placeholders; BETTER_AUTH_SECRET now an empty placeholder (was a non-empty placeholder string)
- `apps/api/src/config/env.ts` - BETTER_AUTH_SECRET required; new optional/defaulted vars; memoized `export const env = loadEnv()`
- `packages/db/package.json` - added `tsx` devDependency + `db:seed` script (script file itself lands in Plan 04)
- `packages/contracts/src/schemas.ts` - added `meSchema`, `completeProfileBodySchema` (derived from `visitorProfileInsertSchema.pick`), `usernameAvailabilitySchema`
- `packages/contracts/src/router.ts` - added `getMe`, `completeProfile`, `usernameAvailability`, `listFestivals`, `saveFestival`, `listMyFestivals` to the existing `c.router` call

## Decisions Made
- `GET /me` response locked to `{ accountId, email, profile: VisitorProfilePublic | null }` per RESEARCH.md's A4 default — resolves Open Question 1 with the simpler null-discriminator shape over a separate `status` enum.
- `listFestivals`/`listMyFestivals` both reuse the existing `festivalSchema` rather than deriving from `myFestivalSelectSchema`. The plan's `key_links` mentions importing `myFestivalSelectSchema`, but the task's own `<action>` explicitly directs reusing `festivalSchema` for both browse and my-festivals responses (the client needs festival data, not the raw join row) — followed the more specific instruction. `myFestivalSelectSchema` remains available in `@festipal/db/schema` for whichever later plan implements the `listMyFestivals`/`saveFestival` service layer against the `my_festival` table directly.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added an empty request body schema to saveFestival**
- **Found during:** Task 3 (contract surface — `pnpm --filter @festipal/contracts exec tsc --noEmit`)
- **Issue:** ts-rest's `AppRouteMutation` type requires a `body` field on every `POST`/`PUT`/`PATCH`/`DELETE` route; `saveFestival` had none, causing a compile error ("Property 'body' is missing").
- **Fix:** Added `body: z.object({})` — the save action carries no payload (all state comes from the path param + session), but ts-rest's type system requires an explicit (even empty) schema.
- **Files modified:** `packages/contracts/src/router.ts`
- **Verification:** `pnpm --filter @festipal/contracts exec tsc --noEmit` now exits 0
- **Committed in:** c868212 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Compile-blocking fix required for the contract to typecheck at all; no scope creep, no behavior change beyond satisfying ts-rest's type contract.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required this plan. (Plan 02 will need `BETTER_AUTH_SECRET`/`DATABASE_URL_UNPOOLED`/etc. per the phase-level `user_setup` block already recorded in `02-01-PLAN.md` frontmatter — surfaced when the auth runtime itself is wired.)

## Next Phase Readiness
- Wave 0 foundation complete: deps installed, vitest harness boots, env is a single required-secret source, and the full contract surface is frozen and compiles/builds.
- Ready for Plan 02 (better-auth runtime wiring: `auth.instance.ts`, `AuthModule.forRoot`, OTP email provider abstraction) and the Wave 2/3 handler-implementation plans that consume this contract.
- No blockers.

---
*Phase: 02-otp-auth-festival-backend-api*
*Completed: 2026-08-02*

## Self-Check: PASSED

- FOUND: apps/api/vitest.config.ts
- FOUND: apps/api/test/setup.ts
- FOUND: f89d523 (Task 1 commit)
- FOUND: e100b85 (Task 2 commit)
- FOUND: c868212 (Task 3 commit)
