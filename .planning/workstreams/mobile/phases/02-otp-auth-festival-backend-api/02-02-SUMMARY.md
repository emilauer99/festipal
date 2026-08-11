---
phase: 02-otp-auth-festival-backend-api
plan: 02
subsystem: auth
tags: [better-auth, email-otp, thallesp-nestjs-better-auth, nestjs, ts-rest, session]

# Dependency graph
requires:
  - phase: 02-otp-auth-festival-backend-api (plan 01)
    provides: apps/api auth/email/test dependencies, memoized env singleton (BETTER_AUTH_SECRET required), vitest integration harness, getMe contract entry
provides:
  - Live better-auth email-OTP runtime (auth.instance.ts) — drizzleAdapter over the vendored user/session/account/verification tables, emailOTP plugin (6-digit, 5-min expiry, resendStrategy "reuse", fire-and-forget send), 90-day sliding session (D-02)
  - Global AuthGuard registered app-wide (SEC-01) via AuthModule.forRoot() — every controller protected-by-default except @AllowAnonymous()-tagged health
  - OTP email provider abstraction with a working dev transport (console + local capture file) and a dormant, env-gated Resend adapter (D-01)
  - GET /api/v1/me implemented end-to-end (MeModule/MeController/MeService), returning { accountId, email, profile } with profile:null pre-first-login
  - Live smoke proof (test/smoke/otp-me-smoke.mjs) + in-process guard spec (test/auth-guard-tracer.spec.ts) proving the whole OTP -> session -> /me path and the 401/200 guard baseline
affects: [02-03, 02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "betterAuth() runtime instance built as a plain module export (auth.instance.ts) outside NestJS DI — AuthModule.forRoot({ auth }) needs an already-constructed instance at synchronous module-registration time"
    - "OTP email delivery goes through a provider abstraction (OtpEmailProvider interface) selected by createOtpEmailProvider(env); dev transport writes a gitignored local capture file so smoke tests/curl can read the code without a real inbox"
    - "sendVerificationOTP is always fire-and-forget (`void otpEmailProvider.send(...)`) — never awaited before the OTP-request endpoint responds"
    - "New controllers inherit the global AuthGuard by default; only health is explicitly @AllowAnonymous() — no manual @UseGuards() needed anywhere"
    - "@Session() parameter decorator composes cleanly with @TsRestHandler on the same controller method — session is closed over inside the tsRestHandler callback"

key-files:
  created:
    - apps/api/src/auth/auth.instance.ts
    - apps/api/src/auth/auth.module.ts
    - apps/api/src/auth/email/otp-email-provider.ts
    - apps/api/src/auth/email/dev-otp-email-provider.ts
    - apps/api/src/auth/email/resend-otp-email-provider.ts
    - apps/api/src/me/me.controller.ts
    - apps/api/src/me/me.service.ts
    - apps/api/src/me/me.module.ts
    - apps/api/test/smoke/otp-me-smoke.mjs
    - apps/api/test/auth-guard-tracer.spec.ts
  modified:
    - apps/api/src/main.ts
    - apps/api/src/app.module.ts
    - apps/api/src/health/health.controller.ts
    - apps/api/eslint.config.mjs
    - .gitignore

key-decisions:
  - "main.ts now imports the memoized `env` singleton instead of calling loadEnv() a second time — closes the '3rd call site' gap RESEARCH.md flagged, rather than deepening it with a 4th"
  - "Dev OTP transport captures the code to a gitignored local JSON file (apps/api/.otp-dev-transport.local.json) in addition to console.log, computed via __dirname so it resolves correctly whether running from src/ (nest watch) or dist/ (built) — this is what test/smoke/otp-me-smoke.mjs reads to complete the OTP round-trip without a real inbox"
  - "eslint.config.mjs gained a scoped **/*.mjs override adding Node globals (process/console/fetch) — the smoke script is the first plain-Node script in apps/api and isn't covered by the TS-parsed source files' implicit globals"

requirements-completed: [SEC-01]

coverage:
  - id: D1
    description: "betterAuth() runtime instance wired with emailOTP plugin (6-digit OTP, 5-min expiry, resendStrategy reuse) and 90-day sliding session (D-02), mounted at /api/auth/* via AuthModule.forRoot()"
    requirement: SEC-01
    verification:
      - kind: e2e
        ref: "apps/api/test/smoke/otp-me-smoke.mjs"
        status: pass
    human_judgment: false
  - id: D2
    description: "Global AuthGuard protects every endpoint by default; GET /api/v1/me returns 401 with no session, GET /api/v1/health returns 200 with no session (@AllowAnonymous baseline)"
    requirement: SEC-01
    verification:
      - kind: integration
        ref: "apps/api/test/auth-guard-tracer.spec.ts#GET /api/v1/me without a session returns 401"
        status: pass
      - kind: integration
        ref: "apps/api/test/auth-guard-tracer.spec.ts#GET /api/v1/health without a session returns 200 (@AllowAnonymous baseline)"
        status: pass
      - kind: e2e
        ref: "apps/api/test/smoke/otp-me-smoke.mjs"
        status: pass
    human_judgment: false
  - id: D3
    description: "GET /api/v1/me returns { accountId, email, profile } end-to-end after a real OTP request -> verify -> session round-trip against the live dev API"
    requirement: SEC-01
    verification:
      - kind: e2e
        ref: "apps/api/test/smoke/otp-me-smoke.mjs"
        status: pass
    human_judgment: false
  - id: D4
    description: "OTP request/verify is fire-and-forget on the send path (source-verified: no await otpEmailProvider.send anywhere) and no /auth/refresh route or username()/organization() plugin usage exists"
    verification:
      - kind: other
        ref: "grep -rn 'await otpEmailProvider.send|auth/refresh|username(|organization(' apps/api/src (all empty)"
        status: pass
    human_judgment: false

# Metrics
duration: 16min
completed: 2026-08-02
status: complete
---

# Phase 2 Plan 2: Better-Auth Email-OTP Tracer + GET /me Summary

**Wired better-auth's emailOTP plugin into NestJS behind a global AuthGuard via `@thallesp/nestjs-better-auth`, proved the whole OTP -> session -> `GET /api/v1/me` path end-to-end against the live dev API, and left health as the sole anonymous endpoint.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-08-02T11:01:00Z
- **Completed:** 2026-08-02T11:17:14Z
- **Tasks:** 2
- **Files modified:** 15 (10 created, 5 modified)

## Accomplishments
- `betterAuth()` runtime instance (`auth.instance.ts`) wired with `drizzleAdapter` over the vendored `user`/`session`/`account`/`verification` tables, `emailOTP` plugin (6-digit code, 5-min expiry, `resendStrategy: 'reuse'`, fire-and-forget send), and a 90-day sliding session (D-02, no refresh endpoint) — mounted at `/api/auth/*` via `AuthModule.forRoot()`
- OTP email provider abstraction: a working dev transport (console + gitignored local capture file, active this phase per D-01) and a dormant, env-gated Resend adapter that activates only when `OTP_EMAIL_TRANSPORT=resend` + `RESEND_API_KEY` are both set
- Global `AuthGuard` registered app-wide (SEC-01) — every controller (including the pre-existing festival endpoints) is now protected-by-default; only `HealthController` is explicitly `@AllowAnonymous()`
- `GET /api/v1/me` implemented end-to-end (`MeModule`/`MeController`/`MeService`), returning `{ accountId, email, profile }` with `profile: null` pre-first-login-completion
- Live end-to-end smoke proof (`test/smoke/otp-me-smoke.mjs`) and an in-process guard spec (`test/auth-guard-tracer.spec.ts`) both green — the smoke script drives a real OTP request, reads the code from the dev-transport capture file, verifies it into a session cookie, and asserts `GET /api/v1/me` returns 200 with cookie / 401 without, and `GET /api/v1/health` returns 200 without a cookie

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end "sign in with email-OTP and reach GET /me" — one path only** - `a2e64ad` (feat)
2. **Task 2: Author the live smoke script + in-process guard spec** - `1780d95` (test)

**Plan metadata:** _pending_ (docs commit, see below)

## Files Created/Modified
- `apps/api/src/auth/auth.instance.ts` - `betterAuth()` runtime instance: drizzleAdapter + emailOTP + sliding session
- `apps/api/src/auth/auth.module.ts` - Wraps `BetterAuthModule.forRoot({ auth, bodyParser })`, registers the global `AuthGuard`
- `apps/api/src/auth/email/otp-email-provider.ts` - `OtpEmailProvider` interface + `createOtpEmailProvider(env)` transport selector
- `apps/api/src/auth/email/dev-otp-email-provider.ts` - Console + local-capture-file dev transport (D-01 active path)
- `apps/api/src/auth/email/resend-otp-email-provider.ts` - Env-gated, dormant Resend adapter
- `apps/api/src/me/me.controller.ts` - `GET /api/v1/me` via `@Session()` + `@TsRestHandler`
- `apps/api/src/me/me.service.ts` - `getProfile(accountId)` — selects the `visitor_profile` row or `null`
- `apps/api/src/me/me.module.ts` - `MeController` + `MeService` module wiring
- `apps/api/src/main.ts` - `NestFactory.create(AppModule, { bodyParser: false })`; imports the memoized `env` singleton instead of re-calling `loadEnv()`
- `apps/api/src/app.module.ts` - Imports `AuthModule` + `MeModule`
- `apps/api/src/health/health.controller.ts` - Tagged `@AllowAnonymous()` so the anonymous baseline holds under the new global guard
- `apps/api/test/smoke/otp-me-smoke.mjs` - Live fetch-based end-to-end smoke script (OTP request -> capture-file read -> verify -> session cookie -> `GET /me` with/without cookie -> `GET /health`)
- `apps/api/test/auth-guard-tracer.spec.ts` - In-process 401/200 guard proof via `createTestApp()`
- `apps/api/eslint.config.mjs` - Scoped Node globals (`process`/`console`/`fetch`) to `**/*.mjs` files
- `.gitignore` - Ignore the dev-only OTP capture file (`.otp-dev-transport.local.json`)

## Decisions Made
- `main.ts` now imports the memoized `env` singleton (`import { env } from './config/env'`) instead of calling `loadEnv()` a second time — closes the "3rd `loadEnv()` call site" gap RESEARCH.md flagged (Wave 0 already added `auth.instance.ts` as a 3rd consumer; re-calling `loadEnv()` in `main.ts` too would have made it a 4th raw call site instead of importing the shared singleton).
- The dev OTP transport writes a gitignored local capture file (`apps/api/.otp-dev-transport.local.json`) in addition to `console.log`, computed via `__dirname` so the path resolves identically whether the module runs from `src/` (nest watch) or `dist/` (built) — three directories above either location lands at `apps/api`. This is what `test/smoke/otp-me-smoke.mjs` polls to read the code without a real inbox, satisfying CONTEXT.md's "dev-first email... code readable" requirement without adding `nodemailer`/Mailpit (RESEARCH.md Assumption A3).
- The smoke script sends an explicit `Origin` header on its two `POST`s to `/api/auth/*` — better-auth's CSRF check rejects state-changing requests with no `Origin` header by default (a real browser always sends one; a bare Node `fetch()` does not). This was discovered empirically running the live smoke test and is documented inline in the script; no production code change was needed since real clients (Phase 3+ mobile app) will send `Origin`/`Referer` naturally.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added an `Origin` header to the smoke script's `POST` requests**
- **Found during:** Task 1 acceptance-criteria verification (running `node apps/api/test/smoke/otp-me-smoke.mjs` for the first time)
- **Issue:** `POST /api/auth/email-otp/send-verification-otp` returned `403 MISSING_OR_NULL_ORIGIN` — better-auth's built-in CSRF protection rejects state-changing requests lacking an `Origin` header, which Node's `fetch()` doesn't send by default (unlike a browser).
- **Fix:** Added `origin: BASE_URL` to both `POST` requests' headers in the smoke script, mimicking same-origin browser traffic.
- **Files modified:** `apps/api/test/smoke/otp-me-smoke.mjs`
- **Verification:** Smoke script now passes all 9 checks against the live dev server.
- **Committed in:** `1780d95` (Task 2 commit)

**2. [Rule 3 - Blocking] Scoped Node globals to `**/*.mjs` in `eslint.config.mjs`**
- **Found during:** Task 2 (running `pnpm --filter @festipal/api exec eslint .` after adding the smoke script)
- **Issue:** `otp-me-smoke.mjs` is the first plain-Node script in `apps/api` — ESLint's flat config had no `languageOptions.globals` for `process`/`console`/`fetch`, which the TS-parsed source files get implicitly but plain `.mjs` files under `eslint:recommended`'s `no-undef` do not. 16 `no-undef` errors blocked a clean lint pass.
- **Fix:** Added a scoped override (`files: ['**/*.mjs']`) declaring `process`/`console`/`fetch` as readonly globals, rather than pulling in the `globals` npm package for three identifiers.
- **Files modified:** `apps/api/eslint.config.mjs`
- **Verification:** `pnpm --filter @festipal/api exec eslint .` exits 0.
- **Committed in:** `1780d95` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes are test-tooling-only (smoke script + lint config) — no production auth/session/guard code was touched by either fix. No scope creep.

## Issues Encountered
None.

## User Setup Required
None - `DATABASE_URL` and `BETTER_AUTH_SECRET` were already present in `apps/api/.env` (set during Plan 01's user setup); no new external service configuration required this plan. `RESEND_API_KEY` remains intentionally unset (D-01 — the Resend adapter stays dormant until a later phase needs real delivery).

## Next Phase Readiness
- The tracer slice is proven end-to-end: OTP request -> dev-transport code -> verify -> session cookie -> `GET /api/v1/me` (200 with cookie, 401 without) -> `GET /api/v1/health` (200 always). This is the load-bearing architecture (betterAuth instance + emailOTP + global AuthGuard + `bodyParser:false` re-application + `/api/v1` vs `/api/auth` prefix coexistence + `@Session()` on a ts-rest handler) every remaining Phase 2 plan builds on.
- Ready for Plan 03/04/05 (profile completion, username availability, festival browse/save/my-festivals) — all can now assume a working session + `@Session()` pattern and the global-guard-by-default baseline without re-deriving it.
- No blockers.

---
*Phase: 02-otp-auth-festival-backend-api*
*Completed: 2026-08-02*

## Self-Check: PASSED

- FOUND: apps/api/src/auth/auth.instance.ts
- FOUND: apps/api/src/auth/auth.module.ts
- FOUND: apps/api/src/auth/email/otp-email-provider.ts
- FOUND: apps/api/src/auth/email/dev-otp-email-provider.ts
- FOUND: apps/api/src/auth/email/resend-otp-email-provider.ts
- FOUND: apps/api/src/me/me.controller.ts
- FOUND: apps/api/src/me/me.service.ts
- FOUND: apps/api/src/me/me.module.ts
- FOUND: apps/api/test/smoke/otp-me-smoke.mjs
- FOUND: apps/api/test/auth-guard-tracer.spec.ts
- FOUND: a2e64ad (Task 1 commit)
- FOUND: 1780d95 (Task 2 commit)
