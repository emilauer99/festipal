---
phase: 02-otp-auth-festival-backend-api
plan: 06
subsystem: api
tags: [ts-rest, drizzle, postgres, error-handling, nestjs]

# Dependency graph
requires:
  - phase: 02-otp-auth-festival-backend-api
    provides: gate-less festival save (02-04), me/completeProfile 23505-catch idiom (02-03)
provides:
  - Contract-documented 409 response for POST /festivals/:festivalId/save when the caller has not completed their visitor profile
  - FestivalService.save() catches Postgres 23503 FK violation instead of letting it propagate as a raw 500
  - Regression test proving the profile-null save path returns 409 and writes zero rows
affects: [gsd-verify-work, future save/festival-membership work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service returns a discriminated status signal ({ status: 'ok' | 'not-found' | 'profile-required' }) instead of throwing; controller maps each branch to its HTTP status — same shape as me.service.completeProfile's 23505 idiom"

key-files:
  created:
    - apps/api/test/save-profile-required.spec.ts
  modified:
    - packages/contracts/src/router.ts
    - apps/api/src/festival/festival.service.ts
    - apps/api/src/festival/festival.controller.ts

key-decisions:
  - "Fixed at the service/contract/controller level only — did not touch packages/db/src/schema (the my_festival.visitorId NOT NULL FK is correct and intentional per the plan's prohibition)"
  - "Reused the router.ts errorSchema for the new 409 instead of declaring a bespoke Zod shape"

patterns-established: []

requirements-completed: [SEC-01, SEC-02]

coverage:
  - id: D1
    description: "POST /api/v1/festivals/:festivalId/save returns a clean, contract-documented 409 (not a 500) for an authenticated visitor with no completed profile, and writes zero my_festival rows"
    requirement: "SEC-02"
    verification:
      - kind: integration
        ref: "apps/api/test/save-profile-required.spec.ts#returns a clean 409 (never 500) and writes no my_festival row when the caller has no completed profile"
        status: pass
    human_judgment: false
  - id: D2
    description: "contract.saveFestival declares the 409 profile-required response; festival.service.save() catches Postgres 23503 and returns { status: 'profile-required' }; festival.controller.ts maps it to 409"
    requirement: "SEC-01"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/contracts build (exit 0)"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/api exec tsc --noEmit -p tsconfig.json (exit 0)"
        status: pass
    human_judgment: false

# Metrics
duration: ~15min
completed: 2026-08-02
status: complete
---

# Phase 02 Plan 06: Save Profile-Required Gap Closure Summary

**FestivalService.save() catches Postgres 23503 FK violations and returns a contract-documented 409 instead of an unhandled 500 when a visitor without a completed profile tries to save a festival (CR-01).**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-08-02T13:48:21Z
- **Tasks:** 2 completed
- **Files modified:** 4 (3 modified, 1 created)

## Accomplishments
- `contract.saveFestival` now declares `409: errorSchema` alongside `200`/`404`, reusing the shared `errorSchema` (no bespoke shape)
- `FestivalService.save()` widened to a three-way discriminated result (`ok` | `not-found` | `profile-required`), wrapping the `my_festival` insert in a try/catch that mirrors `me.service.completeProfile`'s `23505`-catch idiom for `23503`
- `festival.controller.ts` maps `profile-required` to a `409 { message }` response, leaving the `200`/`404` branches untouched
- New regression spec `save-profile-required.spec.ts` signs in via OTP, deliberately skips `visitor_profile` completion, and asserts the save attempt returns `409` (explicitly `not.toBe(500)`) with zero `my_festival` rows written

## Task Commits

Each task was committed atomically:

1. **Task 1: profile-required branch through contract + service + controller** - `0151654` (feat)
2. **Task 2: regression test — save without a completed profile returns 409, writes no row** - `7f311bf` (test)

**Plan metadata:** (this commit, following)

## Files Created/Modified
- `packages/contracts/src/router.ts` - `saveFestival.responses` gains `409: errorSchema`; summary updated to note the profile-required 409
- `apps/api/src/festival/festival.service.ts` - `save()` return type widened; try/catch around the `myFestival` insert catches Postgres `23503` and returns `{ status: 'profile-required' }`
- `apps/api/src/festival/festival.controller.ts` - new branch mapping `{ status: 'profile-required' }` to `{ status: 409, body: { message: '...' } }`
- `apps/api/test/save-profile-required.spec.ts` - new integration spec: OTP sign-in without profile completion → save → 409 + zero `my_festival` rows

## Decisions Made
- Followed the plan's prescribed idiom exactly: `const cause = (err as { cause?: unknown }).cause; if (cause instanceof PostgresError && cause.code === '23503') { ... }` — matching `me.service.completeProfile`'s `23505` handling verbatim for consistency
- Duplicated the OTP sign-in helper trio (`readCapturedOtp`, `cookieHeaderFromSetCookie`, `signInWithOtp`) verbatim from `save-idempotency.spec.ts` rather than extracting a shared test helper, per the plan's explicit instruction (WR-06 dedup out of scope for this gap fix)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CR-01 verification blocker closed: `POST /festivals/:festivalId/save` now returns a clean 409 (never a 500) for the reachable profile-null state, and the regression test covers it
- Full `apps/api` test suite verified green: 8 files, 31 tests (matches the plan's expected count, no regression to `save-idempotency` / `festival-isolation` happy paths)
- `pnpm --filter @festipal/api lint` clean
- No blockers for closing out Phase 02

---
*Phase: 02-otp-auth-festival-backend-api*
*Completed: 2026-08-02*

## Self-Check: PASSED

All created/modified files exist on disk and both task commit hashes (0151654, 7f311bf) are present in git history.
