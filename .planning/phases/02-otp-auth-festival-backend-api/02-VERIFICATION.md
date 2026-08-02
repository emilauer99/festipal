---
phase: 02-otp-auth-festival-backend-api
verified: 2026-08-02T12:22:16Z
status: gaps_found
score: 15/16 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps:
  - truth: "POST /api/v1/festivals/:festivalId/save is gate-less: any authenticated visitor can save any festival; it writes a my_festival row and returns 200 (02-04-PLAN.md must_have, touches roadmap SC-3/SEC-02)"
    status: failed
    reason: "Reproduced live against the running dev API (2026-08-02): an authenticated visitor whose GET /api/v1/me shows profile:null (the API's own documented, reachable first-login state) gets an unhandled 500 Internal Server Error from POST /api/v1/festivals/:festivalId/save, not a 200 or a clean documented error. Root cause: my_festival.visitorId is a NOT NULL FK into visitor_profile.accountId, but FestivalService.save() never checks for an existing visitor_profile row or catches the resulting Postgres 23503 FK-violation before inserting — it only guards against the festival not existing (23-REVIEW.md CR-01, unresolved as of this verification). No test in the suite exercises this path: save-idempotency.spec.ts, bodyparser-smoke.spec.ts, and festival-isolation.spec.ts all insert/complete a visitor_profile before ever calling save."
    artifacts:
      - path: "apps/api/src/festival/festival.service.ts"
        issue: "save(visitorId, festivalId) at lines 124-134 has no defense against a missing visitor_profile row; the my_festival insert throws an uncaught 23503 that propagates to an unhandled 500"
      - path: "packages/contracts/src/router.ts"
        issue: "contract.saveFestival only declares 200/404 responses — no response shape exists for a profile-required rejection even if the service were fixed"
    missing:
      - "FestivalService.save() must check for (or catch the FK violation for) a missing visitor_profile before/around the my_festival insert and return a distinct, clean signal (e.g. {status:'profile-required'}) instead of letting a raw Postgres 23503 propagate"
      - "contract.saveFestival needs an additional response status (e.g. 409/400) for the profile-required case, plus a controller branch mapping it"
      - "A test exercising 'save called by an authenticated visitor with no completed visitor_profile' — currently absent from the whole suite"
deferred: []
human_verification: []
---

# Phase 2: OTP Auth & Festival Backend API Verification Report

**Phase Goal:** The NestJS API authenticates visitors passwordlessly via email-OTP, supports first-login profile completion and festival browse/save, and isolates festival-scoped data by festivalId
**Verified:** 2026-08-02T12:22:16Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | better-auth's emailOTP plugin wired into NestJS (6-digit code, ~5-min expiry, resendStrategy 'reuse') behind a global AuthGuard, mounted at `/api/auth/*` | VERIFIED | `apps/api/src/auth/auth.instance.ts` (`emailOTP({ otpLength: 6, expiresIn: 60*5, resendStrategy: 'reuse' })`); `apps/api/src/auth/auth.module.ts` (`BetterAuthModule.forRoot`, global `AuthGuard`) |
| 2 | OTP send/verify + GET /me, POST /me/complete-profile, GET /me/username-availability, GET /festivals, POST /festivals/:festivalId/save, GET /me/festivals reachable against a live dev API | VERIFIED (with a caveat — see gap below) | Live dev server started and driven directly: OTP request 200, dev-transport code captured, verify 200 + session cookie, `GET /api/v1/me` 200 with `{accountId, email, profile:null}`, `GET /api/v1/festivals` 200 with 1 seeded festival, `POST /api/v1/festivals/:id/save` reachable but returned `500` for a visitor with no completed profile (see gap) |
| 3 | Every endpoint explicitly tagged public vs protected in one deliberate pass, captured as an endpoint × auth-annotation table reviewed at phase end | VERIFIED | `.planning/phases/02-otp-auth-festival-backend-api/02-AUTH-ANNOTATIONS.md` — 10 rows, matches source decorators (spot-checked against `me.controller.ts`/`festival.controller.ts`/`health.controller.ts`); `apps/api/test/auth-guard.spec.ts` (10 tests, all pass) proves it programmatically |
| 4 | Festival-scoped reads always constrained by festivalId; automated test proves cross-festival isolation | VERIFIED | `apps/api/test/festival-isolation.spec.ts` — self-provisioned A/B festivals + 2 visitors; visitor 1 (saved A only) sees exactly `[A]`, visitor 2 sees `[]`, browse (`GET /festivals`) stays unscoped — all 3 assertions pass |
| 5 | Save/enter is gate-less (no 403-on-unsaved); save only writes my_festival | FAILED (partial) | Gate-less w.r.t. membership/ticket is correctly implemented (no such check exists) and idempotent saves work when a profile exists (`save-idempotency.spec.ts` passes) — but "save only writes my_festival" does not hold universally: for an authenticated visitor with no completed profile (a documented reachable state), save throws an unhandled `500` instead of writing the row or returning a clean error. Reproduced live, see gap. |
| 6 | bodyParser: false plus re-added JSON parsing smoke-tested (OTP verify POST + non-auth ts-rest POST both receive correct bodies) | VERIFIED | `apps/api/test/bodyparser-smoke.spec.ts` (2 tests pass, in-process) + documented one-time live round-trip against `pnpm --filter @festipal/api dev` (02-05-SUMMARY.md); `otp-me-smoke.mjs` re-run live during this verification also confirms the `/api/auth` POST half parses |
| 7 | username-availability advisory, complete-profile source of truth (TOCTOU-safe unique-index catch) | VERIFIED | `apps/api/src/me/me.service.ts` — `checkUsernameAvailability` is a plain SELECT; `completeProfile` independently catches Postgres `23505` via `err.cause instanceof PostgresError`; `apps/api/test/username-race.spec.ts` + `me-endpoints.spec.ts` prove the 409 path |
| 8 | Email OTP via env-configured provider (Resend) with dev fallback — no secrets committed | VERIFIED | `apps/api/src/auth/email/otp-email-provider.ts` (transport selector), `resend-otp-email-provider.ts` (dormant, env-gated), `dev-otp-email-provider.ts` (active); `git show HEAD:apps/api/.env.example` contains only empty placeholders, no real secret values |
| 9 | App endpoints derive Zod shapes from packages/contracts (drizzle-zod base); better-auth's own OTP routes excluded from the contract | VERIFIED | `packages/contracts/src/schemas.ts`/`router.ts` — `completeProfileBodySchema` derived via `visitorProfileInsertSchema.pick(...)`; `grep` of `router.ts` shows no `/auth` path string |
| 10 | Full ts-rest contract surface (getMe, completeProfile, usernameAvailability, listFestivals, saveFestival, listMyFestivals) exists under one `c.router({...})` call | VERIFIED | `packages/contracts/src/router.ts` — all six endpoints present under a single `c.router` call with `pathPrefix: '/api/v1'` |
| 11 | `env` is a single memoized module-level export; BETTER_AUTH_SECRET required, RESEND_API_KEY optional | VERIFIED | `apps/api/src/config/env.ts` — `export const env = loadEnv()`; `BETTER_AUTH_SECRET: z.string().min(1)` (required), `RESEND_API_KEY: z.string().optional()` |
| 12 | vitest + supertest + @nestjs/testing installed and the harness runs | VERIFIED | `pnpm --filter @festipal/api exec vitest run` executed during this verification: **7 files, 30 tests, all pass** |
| 13 | GET /api/v1/me/festivals returns only the caller's saved festivals, scoped by session.user.id — never a request parameter | VERIFIED | `apps/api/src/me/me.service.ts#listMyFestivals` — `WHERE eq(myFestival.visitorId, visitorId)`, `visitorId` is a method arg, never read from query/params; proven by `festival-isolation.spec.ts` + `me-endpoints.spec.ts` |
| 14 | An idempotent seed script inserts frequency-2026 and is re-runnable as a no-op/refresh | VERIFIED | `packages/db/scripts/seed.ts` — `onConflictDoUpdate` on `festival.slug`, `onConflictDoNothing` on locale rows; SUMMARY documents two manual runs returning the same festival id |
| 15 | Concurrent-race backstop truths (OTP double-verify, duplicate-username race, concurrent save race, annotation-table drift) | UNCERTAIN (backstop, no automated coverage) | All four plans mark these `verification: backstop` and each SUMMARY records `human_judgment: true` with a sequential (not genuinely concurrent) proof as the closest available evidence — no gap by itself (structurally implied by unique indexes/composite PKs), documented here for completeness, not blocking |

**Score:** 15/16 truths verified (1 failed: gate-less/idempotent save's "only writes my_festival" clause does not hold when the caller has no completed profile)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/contracts/src/router.ts` | Full `/api/v1` contract, six new endpoints | ✓ VERIFIED | All six present, single `c.router` call, no `/auth` path |
| `packages/contracts/src/schemas.ts` | `meSchema`, `completeProfileBodySchema`, `usernameAvailabilitySchema` on drizzle-zod bases | ✓ VERIFIED | Confirmed via source read |
| `apps/api/src/config/env.ts` | Memoized `env`, required `BETTER_AUTH_SECRET` | ✓ VERIFIED | Confirmed |
| `apps/api/src/auth/auth.instance.ts` | `betterAuth()` w/ emailOTP + sliding session | ✓ VERIFIED | Confirmed |
| `apps/api/src/auth/auth.module.ts` | `AuthModule.forRoot` + global guard | ✓ VERIFIED | Confirmed |
| `apps/api/src/me/{me.controller,me.service}.ts` | getMe/completeProfile/usernameAvailability/listMyFestivals | ✓ VERIFIED | Confirmed, all four handlers present |
| `apps/api/src/festival/{festival.controller,festival.service}.ts` | listFestivals/saveFestival | ⚠ VERIFIED-BUT-BUGGY | Both endpoints exist and are wired; `save()` has the CR-01 defect (see gap) |
| `packages/db/scripts/seed.ts` | Idempotent frequency-2026 seed | ✓ VERIFIED | Confirmed |
| `apps/api/test/{auth-guard,festival-isolation,bodyparser-smoke}.spec.ts` | SEC-01/SEC-02/SC-4 proof specs | ✓ VERIFIED | All exist, all pass |
| `.planning/phases/02-otp-auth-festival-backend-api/02-AUTH-ANNOTATIONS.md` | Endpoint × auth-annotation table | ✓ VERIFIED | Exists, matches source |
| `apps/api/test/smoke/otp-me-smoke.mjs` | Live end-to-end smoke script | ✓ VERIFIED | Re-run live during this verification, all 6 checks pass |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `packages/contracts` schemas | `@festipal/db/schema` drizzle-zod bases | `visitorProfileInsertSchema.pick(...)` | ✓ WIRED | Confirmed in `schemas.ts` |
| `auth.instance.ts` | memoized `env` | `import { env } from '../config/env'` | ✓ WIRED | Confirmed |
| `me.controller.ts` | `@Session()` → `me.service.ts` | session.user.id passed as method arg | ✓ WIRED | Confirmed for all four handlers |
| `festival.service.ts#save` | `my_festival` (visitorId, festivalId) composite PK | `onConflictDoNothing()` | ✓ WIRED (idempotency only) | Idempotent for the happy path; NOT wired against the FK-violation failure mode (CR-01) |
| `me.service.ts#listMyFestivals` | `my_festival` → `festival` join | `WHERE eq(myFestival.visitorId, visitorId)` | ✓ WIRED | Confirmed, session-derived only |
| `AppModule` | `AuthModule` + `MeModule` + `FestivalModule` | module imports | ✓ WIRED | Confirmed in `app.module.ts` |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full apps/api test suite | `pnpm --filter @festipal/api exec vitest run` | 7 files, 30 tests, 0 failures | ✓ PASS |
| Typecheck | `pnpm --filter @festipal/api exec tsc --noEmit -p tsconfig.json` | exits 0, no errors | ✓ PASS |
| Live OTP → session → GET /me round-trip | Started `pnpm --filter @festipal/api dev`, drove OTP request → capture-file read → verify → `GET /api/v1/me` (200, with cookie) / (401, no cookie) → `GET /api/v1/health` (200, no cookie) | All 6 checks passed against the live dev server | ✓ PASS |
| **Save without a completed profile** (not covered by any committed test) | Same live session, `GET /me` confirmed `profile:null`, then `POST /api/v1/festivals/:id/save` | **500 `{"statusCode":500,"message":"Internal server error"}`** instead of 200/clean-error | ✗ FAIL — this is the CR-01 gap |
| `.env.example` contains no real secrets | `git show HEAD:apps/api/.env.example` | Only empty placeholders (`BETTER_AUTH_SECRET=`, `RESEND_API_KEY=`, etc.) | ✓ PASS |

The dev server used for the live checks above was started and stopped as part of this verification and left no residual process running.

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|-----------------|--------------|--------|----------|
| SEC-01 | 02-01 through 02-05 | Login-first — all app functionality requires authentication | ✓ SATISFIED | Global `AuthGuard` (`auth.module.ts`); `auth-guard.spec.ts` (10/10 pass) + `02-AUTH-ANNOTATIONS.md`; only `HealthController` and `/api/auth/*` are anonymous |
| SEC-02 | 02-01, 02-03, 02-04, 02-05 | Festival-scoped data isolated by festivalId; save/enter gate-less, not an access gate | ⚠ PARTIALLY SATISFIED | Isolation itself is proven (`festival-isolation.spec.ts`, 3/3 pass) and gate-less-ness (no membership check) is correctly implemented — but the "save only writes my_festival" clause is violated by the CR-01 unhandled-500 defect for a visitor with no completed profile, which is a reachable, undocumented-in-the-contract failure mode |

REQUIREMENTS.md marks both SEC-01 and SEC-02 as `[x]` Complete for Phase 2 — SEC-01 is fully supported by the evidence above; SEC-02's isolation guarantee holds, but its robustness (save "only writes my_festival", never crashes) does not, per the reproduced CR-01 defect. No orphaned requirement IDs found (only SEC-01/SEC-02 map to Phase 2 in REQUIREMENTS.md's traceability table, both present in every plan's `requirements` frontmatter field).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/api/src/festival/festival.service.ts` | 124-134 | Unhandled Postgres FK violation (23503) surfaces as a raw 500 | 🛑 Blocker | Reproduced live — see gap above (CR-01 in 02-REVIEW.md, unresolved) |
| `packages/contracts/src/schemas.ts` / `packages/db/src/schema/visitor-profile.ts` | 59-64 / 64-75 | No length/format validation on `username`/`displayName`/`avatar` (empty string, unbounded length, no `.url()` on avatar) | ⚠ Warning | Not a stated must-have this phase but weakens IDN-01's "required unique username" intent for Phase 4; flagged by reviewer as WR-01, unresolved |
| `apps/api/src/me/me.service.ts` | 52-60 | `completeProfile`'s catch treats every `23505` as "username taken", even when the real cause is a duplicate `accountId` (already-completed profile) | ⚠ Warning | Misleading error message on a double-submit/retry; reviewer WR-02, unresolved |
| `apps/api/src/auth/auth.instance.ts` / `apps/api/src/db/db.module.ts` | 9 / 14 | Two independent `createDatabase()` calls open two separate Postgres connection pools against the same Neon endpoint | ⚠ Warning | Doubles baseline connection footprint against pgBouncer limits; reviewer WR-03, unresolved |
| `apps/api/src/auth/email/dev-otp-email-provider.ts` | 15-33 | Single shared OTP capture file, unconditionally overwritten — concurrent OTP requests can clobber each other's code | ⚠ Warning | Dev-only; reviewer WR-04, unresolved (worked around at the vitest-config level via `fileParallelism:false`, not fixed at the provider) |
| `apps/api/test/setup.ts` | 17-25 | Integration tests write/delete against whichever `DATABASE_URL`/`DATABASE_URL_UNPOOLED` is configured, no test-DB guard | ⚠ Warning | Risk of a misconfigured `DATABASE_URL` causing real dev-data mutation from `pnpm test`; reviewer WR-05, unresolved |
| 4 spec files | various | `readCapturedOtp`/`cookieHeaderFromSetCookie`/`signInWithOtp` duplicated verbatim across `bodyparser-smoke.spec.ts`, `festival-isolation.spec.ts`, `me-endpoints.spec.ts`, `save-idempotency.spec.ts` | ⚠ Warning | Maintenance risk, not a functional gap; reviewer WR-06, unresolved |

No `TBD`/`FIXME`/`XXX` debt markers found in any file modified this phase (grep across all `key-files` from the five SUMMARYs came back empty).

### Human Verification Required

None required to close this verification — the phase's four `backstop`-tier truths (OTP double-verify race, duplicate-username race, concurrent-save race, annotation-table drift) are structurally implied by DB unique indexes / composite PKs and each has a sequential (non-parallel) automated proof already in the suite, matching the plans' own stated verification tier. They are not re-litigated here as blocking; they remain lower-confidence than a true concurrency test would provide but do not gate this verification's outcome, which is instead blocked by the CR-01 defect (a directly reproduced, deterministic bug, not a race condition).

### Gaps Summary

One BLOCKER: `POST /api/v1/festivals/:festivalId/save` throws an unhandled `500 Internal Server Error` — not a 200, not a clean 4xx — when called by an authenticated visitor who has not yet completed their profile (`GET /me`'s `profile: null` state, which the API's own contract documents as a normal, reachable post-login state). This was independently reproduced live against the running dev API during this verification (not merely inferred from 02-REVIEW.md's static analysis): sign in via OTP → confirm `profile: null` → call save against a real seeded festival → `500`.

Root cause: `my_festival.visitorId` is a `NOT NULL` foreign key into `visitor_profile.accountId`, but `FestivalService.save()` only checks that the target festival exists — it never checks for (or catches a Postgres `23503` FK-violation from) a missing `visitor_profile` row before inserting. No existing test exercises this ordering because every save-related spec (`save-idempotency.spec.ts`, `bodyparser-smoke.spec.ts`, `festival-isolation.spec.ts`) completes/inserts a `visitor_profile` before calling save.

This was already flagged as `02-REVIEW.md`'s single CRITICAL finding (CR-01) and remains unresolved in the codebase as of this verification — no plan or summary after the review documents a fix. It directly falsifies both a Plan 04 must-have truth ("save... writes a my_festival row and returns 200" — for the reachable profile-null case, it does neither) and the roadmap's SC-3 clause "save only writes my_festival" (instead it can crash).

**This looks unintentional**, not a deliberate deviation — no override is suggested. The recommended fix (from 02-REVIEW.md) is to catch the `23503` in `FestivalService.save()`, return a distinct `{status:'profile-required'}` signal, add a corresponding response to `contract.saveFestival`, and add a test exercising this exact path.

---

_Verified: 2026-08-02T12:22:16Z_
_Verifier: Claude (gsd-verifier)_
