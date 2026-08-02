---
phase: 02-otp-auth-festival-backend-api
plan: 05
subsystem: testing
tags: [vitest, supertest, better-auth, security-testing, sec-01, sec-02]

# Dependency graph
requires:
  - phase: 02-otp-auth-festival-backend-api (plan 02)
    provides: live better-auth email-OTP runtime, global AuthGuard, test/setup.ts createTestApp/createTestDatabase helpers, dev-transport OTP capture-file sign-in pattern
  - phase: 02-otp-auth-festival-backend-api (plan 03)
    provides: MeController/MeService full surface (getMe, completeProfile, usernameAvailability, listMyFestivals)
  - phase: 02-otp-auth-festival-backend-api (plan 04)
    provides: FestivalController/FestivalService full surface (getFestival, listTags, listFestivals, saveFestival)
provides:
  - "SEC-01 comprehensive proof: auth-guard.spec.ts asserts 401-without-session on all eight protected /api/v1 endpoints (the six named in the plan plus getFestival/listTags for the whole endpoint set) and success-without-session on the two anonymous baselines (health, OTP request)"
  - "02-AUTH-ANNOTATIONS.md — the reviewed endpoint x auth-annotation table (10 rows: 9 app endpoints + the /api/auth/* group), matching the actual @Controller/@TsRestHandler/@AllowAnonymous decorators with none omitted and none double-tagged"
  - "SEC-02 proof: festival-isolation.spec.ts provisions its own throwaway festivals A/B and two visitors (D-03) — visitor 1 (saved A only) sees exactly [A], visitor 2 sees [], and GET /api/v1/festivals (browse) stays unscoped, confirming isolation is a GET /me/festivals scoping property, not data invisibility"
  - "SC-4 proof: bodyparser-smoke.spec.ts covers both POST halves (the /api/auth OTP request+verify pair and the ts-rest POST /me/complete-profile + POST /festivals/:id/save), plus a one-time live round-trip run against a real `pnpm --filter @festipal/api dev` server per RESEARCH's Sampling Rate requirement"
  - "vitest.config.ts fileParallelism:false fix — the now-larger OTP-heavy integration suite is reliably green across repeated full-suite runs instead of intermittently racing better-auth's rate limiter / the shared dev-transport capture file"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Integration specs that drive a real OTP sign-in (send-verification-otp -> capture-file read -> sign-in/email-otp) and touch a real Neon connection must not run as parallel vitest files — fileParallelism:false in apps/api/vitest.config.ts serializes file execution against the shared external state (rate limiter, capture file, connection pool)"
    - "A phase-closing security-gate plan writes proof artifacts (spec files asserting the negative case — 401/[] — as well as the positive case) rather than re-asserting behavior already covered incidentally by earlier feature specs"

key-files:
  created:
    - apps/api/test/auth-guard.spec.ts
    - apps/api/test/festival-isolation.spec.ts
    - apps/api/test/bodyparser-smoke.spec.ts
    - .planning/phases/02-otp-auth-festival-backend-api/02-AUTH-ANNOTATIONS.md
  modified:
    - apps/api/vitest.config.ts

key-decisions:
  - "auth-guard.spec.ts covers all eight protected /api/v1 endpoints (the six named in the plan's action text plus getFestival/listTags), matching the objective's 'comprehensive... over the whole endpoint set' language rather than the narrower six-endpoint list — both FestivalController methods are neither @AllowAnonymous() nor named in the six, so proving them closes a gap the annotation table's 'no endpoint untagged' prohibition would otherwise leave unverified by a running test."
  - "The anonymous-baseline /api/auth POST is POST /api/auth/email-otp/send-verification-otp (the OTP-request endpoint, matching every other spec/script in this codebase), not the literal '/api/auth/sign-in/email-otp' string in the plan's action prose — that path is the OTP-*verify* endpoint and requires a real 6-digit code to succeed, so it cannot serve as an anonymous-succeeds-without-a-session baseline check by itself. Interpreted the plan's parenthetical '(request)' as the controlling intent."
  - "Disabled vitest fileParallelism (apps/api/vitest.config.ts) after discovering the full apps/api suite was flaky (2/5 full-suite runs failed with timeouts / an opaque postgres.js UNDEFINED_VALUE error) once this plan's three new OTP-heavy spec files pushed concurrent parallel-file OTP sign-ins past better-auth's default rate limiter and the shared dev-transport capture file's write/read race. Verified 3/3 consecutive full-suite runs green after the fix; each spec file already passed reliably in isolation, confirming the root cause was cross-file parallelism, not a per-file logic bug."

requirements-completed: [SEC-01, SEC-02]

coverage:
  - id: D1
    description: "auth-guard.spec.ts asserts 401 without a session on all eight protected /api/v1 endpoints and success without a session on the two anonymous baselines (health, OTP request); 02-AUTH-ANNOTATIONS.md documents every endpoint's annotation exactly once, matching source decorators"
    requirement: SEC-01
    verification:
      - kind: integration
        ref: "apps/api/test/auth-guard.spec.ts (10 tests, all pass)"
        status: pass
    human_judgment: false
  - id: D2
    description: "festival-isolation.spec.ts proves cross-tenant denial: visitor 1 (saved festival A only) sees exactly [A] never [A,B]; visitor 2 (no saves) sees []; both fixtures are self-provisioned throwaway festivals (D-03), never the frequency-2026 dev seed"
    requirement: SEC-02
    verification:
      - kind: integration
        ref: "apps/api/test/festival-isolation.spec.ts (3 tests, all pass)"
        status: pass
    human_judgment: false
  - id: D3
    description: "bodyparser-smoke.spec.ts proves both POST halves parse a request body: the /api/auth OTP request+verify pair and the ts-rest POST /me/complete-profile + POST /festivals/:id/save; the ts-rest half was additionally run once as a live round-trip against pnpm --filter @festipal/api dev per RESEARCH's Sampling Rate note (7/7 checks passed against the live server)"
    verification:
      - kind: integration
        ref: "apps/api/test/bodyparser-smoke.spec.ts (2 tests, all pass)"
        status: pass
      - kind: e2e
        ref: "manual live round-trip against `pnpm --filter @festipal/api dev` (throwaway script, not committed — transcript in this SUMMARY's Decisions Made)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full apps/api suite (7 files, 30 tests) is reliably green across repeated runs, and the live otp-me-smoke.mjs end-to-end proof still passes against a fresh dev server — the phase gate is green"
    verification:
      - kind: integration
        ref: "pnpm --filter @festipal/api exec vitest run (3 consecutive full runs, all 30/30 pass after the fileParallelism fix)"
        status: pass
      - kind: e2e
        ref: "apps/api/test/smoke/otp-me-smoke.mjs (9/9 checks pass against a live pnpm --filter @festipal/api dev server)"
        status: pass
    human_judgment: false

# Metrics
duration: 30min
completed: 2026-08-02
status: complete
---

# Phase 2 Plan 5: SEC-01/SEC-02 Proof Suite + Body-Parser Wiring Verification Summary

**Closed the phase's two security requirements with falsifiable proof: a comprehensive 401-without-session guard spec over the whole endpoint set plus the reviewed endpoint x auth-annotation table (SEC-01), a self-provisioned cross-tenant denial spec (SEC-02), and a two-POST body-parser proof run both in-process and once live against a real dev server (SC-4) — and fixed a real vitest file-parallelism flake the larger OTP-heavy suite exposed.**

## Performance

- **Duration:** 30 min
- **Started:** 2026-08-02T11:40:00Z
- **Completed:** 2026-08-02T12:05:00Z
- **Tasks:** 2
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- `apps/api/test/auth-guard.spec.ts` — 10 tests: 401-without-session on all eight protected `/api/v1` endpoints (`GET /me`, `POST /me/complete-profile`, `GET /me/username-availability`, `GET /me/festivals`, `GET /festivals`, `POST /festivals/:id/save`, and the two extra `FestivalController` methods `GET /festivals/:slug` + `GET /festivals/:festivalId/tags` for full endpoint-set coverage) and success-without-session on the anonymous baseline (`GET /health` -> 200, `POST /api/auth/email-otp/send-verification-otp` -> `{success:true}`)
- `.planning/phases/02-otp-auth-festival-backend-api/02-AUTH-ANNOTATIONS.md` — the reviewed endpoint x auth-annotation table: 10 rows (9 app endpoints + the `/api/auth/*` group), each listed exactly once, matching the actual source decorators (verified via `grep -rn "@Controller|@TsRestHandler|@AllowAnonymous"`)
- `apps/api/test/festival-isolation.spec.ts` — 3 tests: self-provisions throwaway festivals A/B and two visitors (D-03, never the `frequency-2026` dev seed); visitor 1 (saved A only) sees exactly `[A]`; visitor 2 (no saves) sees `[]`; `GET /api/v1/festivals` (browse) still returns both A and B, confirming the isolation is a `GET /me/festivals` scoping property, not festival B being globally invisible (Pitfall 4)
- `apps/api/test/bodyparser-smoke.spec.ts` — 2 tests: the `/api/auth` half (OTP request + verify POST bodies parse) and the ts-rest half (`POST /me/complete-profile` + `POST /festivals/:id/save` bodies parse, row written); additionally run once as a live round-trip against `pnpm --filter @festipal/api dev` (7/7 checks passed) per RESEARCH's Sampling Rate requirement, since in-process Supertest may not reproduce Express body-parser stream edges identically
- Discovered and fixed a real flake: running the now 7-file, 30-test OTP-heavy suite in vitest's default parallel-file mode intermittently failed (2 of 5 full-suite runs) with timeouts or an opaque `postgres.js` `UNDEFINED_VALUE` error — traced to concurrent OTP sign-ins across parallel files racing better-auth's default rate limiter and the shared dev-transport capture file. Set `fileParallelism: false` in `apps/api/vitest.config.ts`; verified 3/3 consecutive full-suite runs green afterward.
- Re-ran `apps/api/test/smoke/otp-me-smoke.mjs` against a fresh live dev server — all 9 checks still pass, confirming the phase-gate live proof holds after this plan's additions.

## Task Commits

Each task was committed atomically:

1. **Task 1: SEC-01 comprehensive auth-guard spec + endpoint x auth-annotation table** - `32a08e2` (test)
2. **Task 2: SEC-02 cross-tenant denial spec + two-POST body-parser proof** - `8376d9c` (test) — includes the `vitest.config.ts` `fileParallelism:false` fix Task 2's full-suite verification surfaced as blocking

**Plan metadata:** _pending_ (docs commit, see below)

## Files Created/Modified
- `apps/api/test/auth-guard.spec.ts` - SEC-01 comprehensive: 401 on all eight protected endpoints, success on the anonymous baseline
- `apps/api/test/festival-isolation.spec.ts` - SEC-02 cross-tenant denial with self-provisioned A/B fixtures
- `apps/api/test/bodyparser-smoke.spec.ts` - two-POST body-parser proof (in-process + documented live round-trip command in the file header)
- `.planning/phases/02-otp-auth-festival-backend-api/02-AUTH-ANNOTATIONS.md` - the reviewed endpoint x auth-annotation table
- `apps/api/vitest.config.ts` - `fileParallelism: false` to serialize integration-spec execution against shared external state (real Neon connections, better-auth's rate limiter, the OTP capture file)

## Decisions Made
- `auth-guard.spec.ts` covers all eight protected endpoints (the plan's named six plus `getFestival`/`listTags`) rather than exactly six, matching the objective's "comprehensive... whole endpoint set" language and closing the annotation table's "no endpoint untagged" prohibition with an actual passing assertion, not just a manual table review.
- The anonymous-baseline `/api/auth` POST test uses `POST /api/auth/email-otp/send-verification-otp` (the OTP-request endpoint, consistent with every other spec/script in the codebase) rather than the literal `/api/auth/sign-in/email-otp` path string in the plan's action prose, which is the OTP-*verify* endpoint and requires a real code to succeed — read the plan's "(request)" parenthetical as the controlling intent over the literal path.
- Disabled vitest `fileParallelism` after confirming (3 consecutive full-suite runs) that this was the actual root cause of the suite's new flakiness, not a bug in any individual new spec (each new file passed reliably when run in isolation). Documented as a deviation below.
- The live body-parser round-trip proof (throwaway Node script, not committed) signed in a real throwaway visitor via the live dev server, completed their profile, and saved the seeded `frequency-2026` festival; the resulting `visitor_profile`/`my_festival`/`session`/`user` rows were cleaned up immediately after via a temporary `packages/db/scripts/_tmp-cleanup-live-proof.mjs` script (deleted after running, never committed) — the `frequency-2026` festival row itself was untouched.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Full apps/api suite was flaky under vitest's default parallel-file execution**
- **Found during:** Task 2 (running the full `pnpm --filter @festipal/api exec vitest run` suite per the plan-level `<verification>` requirement, after adding this plan's three new OTP-heavy spec files)
- **Issue:** With 7 spec files (up from 4) now driving concurrent OTP sign-ins, running them as parallel vitest files intermittently failed: 2 of 5 full-suite runs saw a `bodyparser-smoke.spec.ts` test time out waiting on the shared dev-transport OTP capture file, or a `festival-isolation.spec.ts`/other spec fail with an opaque `postgres.js` `Serialized Error: UNDEFINED_VALUE` mid-query — consistent with concurrent files racing better-auth's default OTP rate limiter (3 requests/60s per source) and/or the single shared capture-file write/read cycle, plus a burst of simultaneous short-lived Neon connections. Every individual spec file passed reliably when run alone.
- **Fix:** Set `fileParallelism: false` in `apps/api/vitest.config.ts`, serializing spec-file execution so integration tests no longer race the shared external state (rate limiter, capture file, connection pool) against each other.
- **Files modified:** `apps/api/vitest.config.ts`
- **Verification:** 3 consecutive full-suite runs (`pnpm --filter @festipal/api exec vitest run`) all green — 7 files, 30 tests, 0 failures each time (versus 2 failures in 5 runs before the fix).
- **Committed in:** `8376d9c` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The fix is scoped entirely to test-runner configuration (`vitest.config.ts`) — no production request-path code was touched. Without it, the plan's own phase-gate verification requirement ("full apps/api suite green") would have been non-deterministic; the plan's `<verification>` step is exactly what surfaced this, matching the pattern from 02-04's seed-script deviations (manual verification steps catching real issues before they ship).

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no new external service configuration required this plan.

## Next Phase Readiness
- SEC-01 (login-first over the whole endpoint set + reviewed annotation table) and SEC-02 (cross-tenant denial with self-provisioned fixtures) are both proven falsifiably, not just asserted — the phase's two security requirements are closed.
- The two-POST body-parser wiring (SC-4) is proven both in-process and via a live dev-server round-trip.
- `apps/api`'s vitest suite (7 files, 30 tests) is reliably green; `apps/api/test/smoke/otp-me-smoke.mjs` still passes against a live dev server.
- This is the phase's final plan (wave 4 of 4 waves) — Phase 2 (otp-auth-festival-backend-api) is complete. No blockers for the next phase.

---
*Phase: 02-otp-auth-festival-backend-api*
*Completed: 2026-08-02*

## Self-Check: PASSED

- FOUND: apps/api/test/auth-guard.spec.ts
- FOUND: apps/api/test/festival-isolation.spec.ts
- FOUND: apps/api/test/bodyparser-smoke.spec.ts
- FOUND: .planning/phases/02-otp-auth-festival-backend-api/02-AUTH-ANNOTATIONS.md
- FOUND: apps/api/vitest.config.ts
- FOUND: 32a08e2 (Task 1 commit)
- FOUND: 8376d9c (Task 2 commit)
