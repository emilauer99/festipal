---
phase: 02-otp-auth-festival-backend-api
reviewed: 2026-08-02T00:00:00Z
depth: standard
files_reviewed: 34
files_reviewed_list:
  - apps/api/.env.example
  - apps/api/eslint.config.mjs
  - apps/api/package.json
  - apps/api/src/app.module.ts
  - apps/api/src/auth/auth.instance.ts
  - apps/api/src/auth/auth.module.ts
  - apps/api/src/auth/email/dev-otp-email-provider.ts
  - apps/api/src/auth/email/otp-email-provider.ts
  - apps/api/src/auth/email/resend-otp-email-provider.ts
  - apps/api/src/config/env.ts
  - apps/api/src/festival/festival.controller.ts
  - apps/api/src/festival/festival.service.ts
  - apps/api/src/health/health.controller.ts
  - apps/api/src/main.ts
  - apps/api/src/me/me.controller.ts
  - apps/api/src/me/me.module.ts
  - apps/api/src/me/me.service.ts
  - apps/api/test/auth-guard-tracer.spec.ts
  - apps/api/test/auth-guard.spec.ts
  - apps/api/test/bodyparser-smoke.spec.ts
  - apps/api/test/festival-isolation.spec.ts
  - apps/api/test/me-endpoints.spec.ts
  - apps/api/test/save-idempotency.spec.ts
  - apps/api/test/save-profile-required.spec.ts
  - apps/api/test/setup.ts
  - apps/api/test/smoke/otp-me-smoke.mjs
  - apps/api/test/username-race.spec.ts
  - apps/api/vitest.config.ts
  - packages/contracts/package.json
  - packages/contracts/src/router.ts
  - packages/contracts/src/schemas.ts
  - packages/db/package.json
  - packages/db/scripts/seed.ts
  - packages/db/src/schema/visitor-profile.ts
findings:
  critical: 0
  warning: 6
  info: 5
  total: 11
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-08-02T00:00:00Z
**Depth:** standard
**Files Reviewed:** 34
**Status:** issues_found

## Summary

Fresh full-scope re-review of the Phase 2 OTP-auth + festival API slice (NestJS +
better-auth email-OTP, ts-rest/Zod contracts, Drizzle/Neon), following gap-closure plan
02-06 for the previously-reported CR-01 blocker.

**CR-01 verification: the fix is sound.** `FestivalService.save()`
(`apps/api/src/festival/festival.service.ts:125-151`) now wraps the `my_festival` insert
in a try/catch, checks `cause instanceof PostgresError && cause.code === '23503'`
(mirroring `MeService.completeProfile`'s existing `23505` idiom), and returns a
`'profile-required'` result. `FestivalController.saveFestival`
(`apps/api/src/festival/festival.controller.ts:44-56`) maps that to a clean `409` with a
message body. `contract.saveFestival` (`packages/contracts/src/router.ts:71-78`) now
declares `409: errorSchema` alongside `404`. The new regression test
`apps/api/test/save-profile-required.spec.ts` signs in a visitor, deliberately skips
inserting a `visitor_profile` row, calls save, and asserts `res.status` is `409` (`not
500`) and that no `my_festival` row was written. This test would fail against the
pre-fix code and passes against the current code — the fix, contract change, and
regression test are internally consistent and close the gap as claimed.

Beyond that, the SEC-01 global-guard and SEC-02 tenant-isolation properties remain
correctly implemented and well-tested (`auth-guard.spec.ts`, `festival-isolation.spec.ts`),
and TOCTOU-safe username uniqueness (`username-race.spec.ts`) still holds. The warnings
and info items from the prior review largely persist unchanged in this pass (validation
gaps on profile fields, an ambiguous conflict-error message, duplicate DB connection
pools, a dev-only OTP capture-file race, no environment guard on destructive integration
tests, and test-helper duplication — now spread across a fifth spec file). One new minor
gap was found in `PORT` environment validation.

`apps/api/.env.example` again could not be read by this review sandbox — same limitation
as the prior pass; its contents were not inspected.

## Warnings

### WR-01: No length/format validation on user-supplied profile fields (`username`, `displayName`, `avatar`)

**File:** `packages/contracts/src/schemas.ts:59-64`, `packages/db/src/schema/visitor-profile.ts:64-75`, `packages/contracts/src/router.ts:61`

**Issue:** `completeProfileBodySchema` is built from `visitorProfileInsertSchema`, whose
`.extend()` override (required to work around the drizzle-zod inference bug documented in
`visitor-profile.ts:46-63`) replaces `username`/`displayName`/`avatar` with bare
`z.string()` — no `.min()`, `.max()`, `.trim()`, or pattern.
- `username: ''` and `username: '   '` both pass validation and satisfy the DB's
  `NOT NULL` constraint, so they persist, defeating the intent of a meaningful username.
- No max length — a client can store arbitrarily long strings (bounded only by the 2mb
  body-parser limit in `auth.module.ts`).
- `avatar` has no `.url()` check (contrast with `festivalSchema.cashlessUrl`, which does
  use `.url()` in the same file), so it can hold any string including `javascript:`-scheme
  values — a stored-XSS risk once a client renders it as an image/link source without its
  own validation.
- `usernameAvailability`'s query schema (`router.ts:61`) has the same unbounded
  `username: z.string()`.

**Fix:**
```ts
export const completeProfileBodySchema = visitorProfileInsertSchema.pick({
  username: true,
  displayName: true,
  avatar: true,
}).extend({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
  displayName: z.string().trim().min(1).max(64),
  avatar: z.string().url().nullable().optional(),
});
```

### WR-02: `completeProfile` maps every unique-violation to "Username already taken", even when the real cause is "you already have a profile"

**File:** `apps/api/src/me/me.service.ts:52-60`, `apps/api/src/me/me.controller.ts:32-34`

**Issue:** `visitor_profile` has two independent unique constraints: the primary key on
`accountId` and the functional index `visitor_profile_username_lower_unq` on
`lower(username)`. `completeProfile`'s catch block treats any `23505` the same way and the
controller unconditionally reports `409 { message: 'Username already taken' }`. If an
account that already has a profile calls `complete-profile` again (double-submit, client
retry, or an attempt to edit via this endpoint) with a brand-new, genuinely available
username, the request fails on the `accountId` PK, not the username index — the client is
told the *username* is taken, which is false.

**Fix:** Disambiguate via the Postgres error's constraint name:
```ts
if (cause instanceof PostgresError && cause.code === '23505') {
  if (cause.constraint_name === 'visitor_profile_username_lower_unq') {
    return { status: 'conflict' };
  }
  return { status: 'already-completed' }; // map to a distinct, accurate response
}
```

### WR-03: Two independent Postgres connection pools are created for the same database

**File:** `apps/api/src/auth/auth.instance.ts:9`

**Issue:** `auth.instance.ts` calls `createDatabase(env.DATABASE_URL)` at module-import
time to build the drizzle adapter for better-auth — a second, independent
`postgres.js` client/connection pool from the one `DbModule` provides via the shared `DB`
DI token (per this codebase's documented "single shared Drizzle client" pattern). This
works but doubles the app's baseline connection footprint against Neon's pgBouncer
limits and diverges from the rest of the codebase's single-shared-client convention.

**Fix:** Have `auth.instance.ts` accept/reuse the same `Database`/`postgres.js` client
`DbModule` creates (construct the client once in a shared module-level helper, or move
`auth` construction into a factory that receives the already-created `DB` instance)
rather than creating a second pool independently.

### WR-04: Dev OTP capture file is a single shared file — concurrent OTP requests can overwrite each other's code

**File:** `apps/api/src/auth/email/dev-otp-email-provider.ts:15-33`

**Issue:** `CAPTURE_FILE` is one fixed path (`apps/api/.otp-dev-transport.local.json`),
and every `send()` call unconditionally overwrites it with `writeFile` (no append, no
per-email keying). If two OTP requests are in flight close together (two people testing
concurrently, or test files not fully serialized), the second `send()` silently clobbers
the first request's captured code before it's read. Callers cope defensively
(`readCapturedOtp`'s match-on-`email` + retry loop), and `vitest.config.ts` explicitly
disables `fileParallelism` to work around exactly this — but the underlying provider is
still a race condition, and real concurrent dev usage outside the test suite (two
developers on a shared dev deployment) can silently lose one user's OTP.

**Fix:** Key the capture file per-email (a `Map`/JSON keyed by email, or a directory of
`<email-hash>.json` files) instead of a single overwritten file.

### WR-05: Integration tests perform destructive writes/deletes against whichever `DATABASE_URL`/`DATABASE_URL_UNPOOLED` is configured, with no environment guard

**File:** `apps/api/test/setup.ts:17-25`, `apps/api/vitest.config.ts`

**Issue:** `createTestDatabase()` connects to `process.env.DATABASE_URL_UNPOOLED ??
process.env.DATABASE_URL` with no check that this points at a disposable/test database
(no `NODE_ENV` guard, no dedicated `TEST_DATABASE_URL`, no hostname/db-name allowlist).
Every spec file performs real `db.insert(...)`/`db.delete(...)` calls against that
connection. If a developer or CI job has `DATABASE_URL` pointed at a shared dev/staging
database (easy to do by accident — same env var name used by the running dev server),
`pnpm test` will insert and delete real rows there.

**Fix:** Add a safety check in `test/setup.ts` (require a `TEST_DATABASE_URL` distinct
from the app's `DATABASE_URL`, or assert the resolved connection string contains an
expected test-db marker) before allowing any test to run.

### WR-06: Near-identical OTP sign-in/cookie helper functions duplicated across five spec files

**File:** `apps/api/test/bodyparser-smoke.spec.ts:43-60`, `apps/api/test/festival-isolation.spec.ts:20-63`, `apps/api/test/me-endpoints.spec.ts:25-63`, `apps/api/test/save-idempotency.spec.ts:22-60`, `apps/api/test/save-profile-required.spec.ts:22-60`

**Issue:** `readCapturedOtp`, `cookieHeaderFromSetCookie`, and (in four of the five)
`signInWithOtp` — plus the `CAPTURE_FILE`/`ORIGIN` constants — are copy-pasted verbatim
into each of these spec files. The new `save-profile-required.spec.ts` added by the CR-01
gap-closure plan repeats the exact same block again (now a fifth copy) instead of
importing shared test infrastructure. Any future change to the OTP capture-file protocol,
cookie parsing, or sign-in flow has to be made in five places in lockstep, and any that
drifts silently breaks only some specs. `test/setup.ts` already exists as the natural
shared location.

**Fix:** Move `readCapturedOtp`, `cookieHeaderFromSetCookie`, and `signInWithOtp` into
`test/setup.ts` (or a new `test/helpers.ts`) and import them from all five spec files.

## Info

### IN-01: `BETTER_AUTH_URL` is declared and documented but never passed into `betterAuth()`'s config

**File:** `apps/api/src/auth/auth.instance.ts:19-48`, `apps/api/src/config/env.ts:9`

**Issue:** `env.ts` defines `BETTER_AUTH_URL` with a comment implying it configures
trusted-origin/CSRF behavior, and every test file falls back to it for the `Origin`
header. But `auth.instance.ts`'s `betterAuth({...})` call never references
`env.BETTER_AUTH_URL` — no `baseURL` or `trustedOrigins` option is set. better-auth is
documented to auto-pick up a `BETTER_AUTH_URL` process env var when `baseURL` isn't
passed explicitly, so this likely works as intended — but nothing in the code makes that
implicit contract visible, so a future reader/refactor could easily "clean up" the env
var as unused, or miss that it needs to be set for CSRF checks to trust the right origin
in production.

**Fix:** Either pass it explicitly (`baseURL: env.BETTER_AUTH_URL`) or add a comment next
to the `betterAuth()` call noting it's consumed implicitly via better-auth's own env-var
convention.

### IN-02: Resend "from" address is hardcoded and not environment-configurable

**File:** `apps/api/src/auth/email/resend-otp-email-provider.ts:20`

**Issue:** `from: 'festipal <onboarding@resend.dev>'` is a Resend sandbox address,
hardcoded inline. This provider is currently dormant (D-01), but when switched on via
`OTP_EMAIL_TRANSPORT=resend` there's no way to change the sender without a code
change/redeploy, and the sandbox domain has Resend-side sending restrictions.

**Fix:** Source the `from` address from an env var (current value as dev default) when
this transport is activated.

### IN-03: OTP email content doesn't vary by `type`

**File:** `apps/api/src/auth/email/resend-otp-email-provider.ts:19-24`, `apps/api/src/auth/email/dev-otp-email-provider.ts:20`

**Issue:** `sendVerificationOTP`'s `type` can be `'sign-in' | 'email-verification' |
'forget-password' | 'change-email'`, but both providers send an identical subject ("Your
festipal sign-in code") regardless of `type`, only appending `(type: ${type})` to the
Resend body text. Only `sign-in` is used this phase, low-impact now, but will read oddly
once other flows are wired up.

**Fix:** Branch subject/copy on `type` when the other flows are implemented.

### IN-04: `apps/api/.env.example` could not be reviewed

**File:** `apps/api/.env.example`

**Issue:** The review sandbox denies read access to `.env*` files, including this tracked
example/template file, so its contents were not inspected as part of this review (this
recurs from the prior review pass — the sandbox restriction is unchanged).

**Fix:** No code change implied — flagging so a human reviewer manually confirms
`.env.example` contains only placeholder values (no real secrets), per the project's "no
secrets in repo" rule.

### IN-05: `PORT` env validation silently accepts non-numeric values via `z.coerce.number()`

**File:** `apps/api/src/config/env.ts:4`

**Issue:** `PORT: z.coerce.number().default(8081)` coerces the raw env string with
`Number(...)`. Zod's plain `z.number()` check only verifies `typeof value === 'number'`,
which `NaN` satisfies — so a misconfigured `PORT` (e.g. `PORT=abc` or a stray trailing
character) coerces to `NaN` and passes `envSchema.safeParse` without triggering the
intended fail-fast `throw new Error('Invalid environment configuration')` path in
`loadEnv()`. The failure instead surfaces later and more confusingly, at
`app.listen(env.PORT)` in `main.ts`, as a raw Node/Express runtime error rather than the
clean, purpose-built config error.

**Fix:** Add `.int().positive()` (or `.finite()`) to the schema so an unparseable `PORT`
is rejected at the `loadEnv()` boundary with the existing clean error message:
```ts
PORT: z.coerce.number().int().positive().default(8081),
```

---

_Reviewed: 2026-08-02T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
