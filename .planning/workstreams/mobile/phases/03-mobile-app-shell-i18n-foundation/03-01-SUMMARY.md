---
phase: 03-mobile-app-shell-i18n-foundation
plan: 01
subsystem: infra
tags: [docker-compose, postgres, mailpit, better-auth, nodemailer, trustedOrigins, otp]

# Dependency graph
requires:
  - phase: 02-otp-auth-festival-backend-api
    provides: better-auth email-OTP instance, OtpEmailProvider abstraction (dev/resend transports), frequency-2026 seed script
provides:
  - Root docker-compose.yml (Postgres 18 + Mailpit) for fully local, offline-of-Neon device testing
  - Mailpit SMTP OTP email transport (createMailpitOtpEmailProvider)
  - better-auth trustedOrigins whitelisting the festipal:// app scheme + exp:// dev-client schemes
  - Root .env.example documenting local dev env values
affects: [03-02 (apps/mobile scaffold — consumes EXPO_PUBLIC_API_URL + trustedOrigins), 03-mobile-app-shell (device testing over LAN)]

# Tech tracking
tech-stack:
  added: [nodemailer@9, "@types/nodemailer@8 (dev)"]
  patterns: ["OtpEmailProvider transport selection switch extended with a third branch (mailpit)"]

key-files:
  created:
    - docker-compose.yml
    - .env.example
    - apps/api/src/auth/email/mailpit-otp-email-provider.ts
  modified:
    - apps/api/src/config/env.ts
    - apps/api/src/auth/auth.instance.ts
    - apps/api/src/auth/email/otp-email-provider.ts
    - apps/api/package.json

key-decisions:
  - "Postgres 18 named volume must mount at /var/lib/postgresql (not /var/lib/postgresql/data) — the 18+ image's pg_ctlcluster-style layout crash-loops otherwise (docker-library/postgres#1259)."
  - "trustedOrigins whitelists exact schemes only (festipal://, exp://, exp://**) — no bare '*' wildcard, per T-03-01."
  - "nodemailer verified as an established package (npm view nodemailer version) before installing, per T-03-SC."

requirements-completed: [PLAT-02]

coverage:
  - id: D1
    description: "docker-compose Postgres 18 + Mailpit stack; db:push + db:seed against it produce the real frequency-2026 festival"
    requirement: "PLAT-02"
    verification:
      - kind: other
        ref: "docker compose config -q"
        status: pass
      - kind: other
        ref: "docker compose up -d && pnpm --filter @festipal/db db:push && pnpm --filter @festipal/db db:seed (manual run, this session)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Mailpit SMTP OTP transport wired into createOtpEmailProvider; better-auth trustedOrigins accepts festipal:// and exp:// schemes; backend suite stays green"
    requirement: "PLAT-02"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/api typecheck"
        status: pass
      - kind: integration
        ref: "pnpm --filter @festipal/api test (31/31 passing on clean re-run)"
        status: pass
      - kind: other
        ref: "manual SMTP smoke test: nodemailer send to Mailpit :1025, confirmed via GET http://localhost:8025/api/v1/messages"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-08-03
status: complete
---

# Phase 3 Plan 1: Local Dev Infra & Mailpit OTP Transport Summary

**docker-compose Postgres 18 + Mailpit local stack, a Mailpit SMTP OTP email transport via nodemailer, and better-auth `trustedOrigins` for the Expo app scheme — proven end-to-end with a real `db:push`/`db:seed` run and a manual SMTP delivery check.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-03T15:39:43Z
- **Completed:** 2026-08-03T15:49:06Z
- **Tasks:** 2
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments
- Root `docker-compose.yml` brings up Postgres 18 (5432) + Mailpit (1025 SMTP / 8025 web UI), both with healthchecks; the API stays native (`pnpm dev`), never containerized.
- Fixed a Postgres 18 volume-mount incompatibility discovered during verification (crash-loop) before it could block any developer's first `docker compose up -d`.
- Verified the full local-DB bootstrap sequence for real: `docker compose up -d` → `db:push` → `db:seed` produced the real `frequency-2026` festival against the local compose Postgres.
- Added `createMailpitOtpEmailProvider` (nodemailer SMTP, fire-and-forget, never throws) and wired it into `createOtpEmailProvider`'s selection switch behind `OTP_EMAIL_TRANSPORT=mailpit`.
- Added `trustedOrigins` to the `betterAuth()` instance whitelisting `festipal://` (D-05 working title) plus `exp://` / `exp://**` Expo dev-client schemes — no bare wildcard.
- Manually confirmed Mailpit delivery: sent a test message via the SMTP transport, confirmed it landed in Mailpit's web-readable inbox via its REST API.

## Task Commits

Each task was committed atomically:

1. **Task 1: docker-compose (Postgres 18 + Mailpit) + local env + migrate/seed** - `3f31298` (feat)
2. **Task 2: Mailpit SMTP OTP transport + trustedOrigins + env additions** - `1304abe` (feat)

## Files Created/Modified
- `docker-compose.yml` - Postgres 18 + Mailpit services with healthchecks, local-dev-only header comment
- `.env.example` - local DATABASE_URL/DATABASE_URL_UNPOOLED, OTP_EMAIL_TRANSPORT=mailpit, MAILPIT_SMTP_*, placeholder BETTER_AUTH_SECRET, documented EXPO_PUBLIC_API_URL note
- `apps/api/src/auth/email/mailpit-otp-email-provider.ts` - `createMailpitOtpEmailProvider(env)`, nodemailer SMTP transport to Mailpit
- `apps/api/src/auth/email/otp-email-provider.ts` - factory switch gains a mailpit branch (dev stays final fallback)
- `apps/api/src/config/env.ts` - `OTP_EMAIL_TRANSPORT` enum gains `'mailpit'`; adds `MAILPIT_SMTP_HOST`/`MAILPIT_SMTP_PORT`
- `apps/api/src/auth/auth.instance.ts` - `trustedOrigins` array (`festipal://`, `exp://`, `exp://**`)
- `apps/api/package.json` - `nodemailer` dependency + `@types/nodemailer` devDependency

## Decisions Made
- Postgres 18's docker image changed its on-disk data layout to be `pg_ctlcluster`-compatible; a volume mounted at `/var/lib/postgresql/data` (the pre-18 convention) crash-loops. Fixed by mounting at `/var/lib/postgresql` instead, matching the image's documented 18+ guidance.
- `trustedOrigins` lists exact schemes only (`festipal://`, `exp://`, `exp://**`) — the `exp://**` wildcard is scoped to the dev-client Metro pattern only, never the production scheme, satisfying the plan's no-bare-wildcard prohibition (T-03-01).
- Verified `nodemailer`'s legitimacy via `npm view nodemailer version` (9.0.3, an established high-traffic package) before adding it as a dependency, per the plan's supply-chain mitigation (T-03-SC).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Postgres 18 volume-mount path causing a crash-loop**
- **Found during:** Task 1 (verifying `docker compose up -d` actually boots the stack)
- **Issue:** The plan specified a named volume for Postgres persistence but didn't anticipate that Postgres 18's image changed its expected mount point; mounting at `/var/lib/postgresql/data` (the historical convention, still correct for Postgres <18) causes the container to detect an "unused mount/volume" and refuse to start, crash-looping indefinitely.
- **Fix:** Changed the volume mount target to `/var/lib/postgresql` (the image's documented 18+ layout) and added an explanatory comment citing docker-library/postgres#1259.
- **Files modified:** `docker-compose.yml`
- **Verification:** Tore down the crash-looping stack (`docker compose down -v`), recreated with the fixed mount, both containers report `healthy` within seconds; `db:push` + `db:seed` subsequently succeeded against it.
- **Committed in:** `3f31298` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary correctness fix — without it, `docker compose up -d` (the plan's own stated "done" criteria) would fail for every developer running Postgres 18 on Windows/Docker Desktop. No scope creep; the plan's compose shape and env values are otherwise implemented exactly as specified.

## Issues Encountered
- The full `pnpm --filter @festipal/api test` run failed once with a `beforeAll` hook timeout in `test/festival-isolation.spec.ts` (a pre-existing integration test hitting the real Neon test database, unrelated to this plan's files). Immediately re-ran the full suite and it passed 8/8 files, 31/31 tests — consistent with a transient network/resource-contention flake (Docker Desktop had just finished a fresh image pull) rather than a regression introduced by this plan's changes. No fix needed; documenting per the deviation-tracking discipline.

## User Setup Required

None - no external service configuration required. Developers wanting to run the local stack should `docker compose up -d`, then `pnpm --filter @festipal/db db:push`, then `pnpm --filter @festipal/db db:seed`, copying `.env.example` to `.env` first.

## Next Phase Readiness
- The local Postgres+Mailpit stack, Mailpit OTP transport, and `trustedOrigins` are all live and verified — plan 02 (scaffolding `apps/mobile`) can now wire its auth client against a local API that accepts the `festipal://`/`exp://` origins and delivers OTP codes to a device-readable inbox.
- No blockers. The docker stack was left running (healthy) at the end of this session for immediate use by follow-up plans; developers should note it in their own environment via the documented `docker compose up -d` sequence.

## Self-Check: PASSED

- FOUND: docker-compose.yml
- FOUND: .env.example
- FOUND: apps/api/src/auth/email/mailpit-otp-email-provider.ts
- FOUND commit: 3f31298
- FOUND commit: 1304abe

---
*Phase: 03-mobile-app-shell-i18n-foundation*
*Completed: 2026-08-03*
