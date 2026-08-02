---
phase: 02-otp-auth-festival-backend-api
reviewed: 2026-08-02T00:00:00Z
depth: standard
files_reviewed: 32
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
  critical: 1
  warning: 6
  info: 4
  total: 11
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-08-02T00:00:00Z
**Depth:** standard
**Files Reviewed:** 32
**Status:** issues_found

## Summary

Reviewed the Phase 2 OTP-auth + festival API slice (NestJS + better-auth email-OTP,
ts-rest/Zod contracts, Drizzle/Neon). The multi-tenant guard rails (SEC-01 global
`AuthGuard`, SEC-02 `visitorId`-scoped `GET /me/festivals`) are well-tested and correctly
implemented — `festival-isolation.spec.ts` and `auth-guard.spec.ts` genuinely exercise
the properties they claim to. TOCTOU-safe username uniqueness (Pitfall 11) is also
correctly implemented and tested.

However, one BLOCKER was found: `POST /festivals/:festivalId/save` has no defense
against being called by an authenticated user who has not yet completed their visitor
profile — a state the API itself exposes via `GET /me`'s `profile: null` and therefore
must be assumed reachable. This throws an unhandled Postgres FK-violation (uncaught by
any test) instead of a clean error response. Several further warnings cover a
schema-validation gap on user-supplied profile fields, a misleading conflict-error
message, duplicate DB connection pools, a dev-only OTP capture-file race, and
significant test-helper duplication.

`apps/api/.env.example` could not be read — the sandbox denies access to `.env*` files
even for tracked example/template files. Its contents were not reviewed; verify manually
that it contains only placeholder values (per the project's "no secrets in repo" rule).

## Critical Issues

### CR-01: `POST /festivals/:festivalId/save` crashes with an unhandled 500 for any authenticated user who hasn't completed their profile yet

**File:** `apps/api/src/festival/festival.service.ts:124-134`

**Issue:** `my_festival.visitorId` is a `NOT NULL` foreign key into `visitor_profile.accountId`
(see `packages/db/src/schema/my-festival.ts:26-28`, whose own comment states this
"encod[es] the 'you must have a completed profile before you can save a festival'
invariant at the schema level"). But `FestivalService.save()` never checks for an
existing `visitor_profile` row before inserting:

```ts
async save(visitorId: string, festivalId: string): Promise<{ status: 'ok' } | { status: 'not-found' }> {
  const [fest] = await this.db.select({ id: festival.id }).from(festival)
    .where(eq(festival.id, festivalId)).limit(1);
  if (!fest) return { status: 'not-found' };

  await this.db.insert(myFestival).values({ visitorId, festivalId }).onConflictDoNothing();
  return { status: 'ok' };
}
```

`visitorId` here is `session.user.id` (`festival.controller.ts:47`), i.e. the global
account id — NOT necessarily a `visitor_profile.accountId`. The app's own `GET /me`
contract (`schemas.ts` `meSchema`) documents `profile: null` as a normal, reachable state
("first login, needs complete-profile"). A freshly signed-in user who calls
`POST /festivals/:festivalId/save` before `POST /me/complete-profile` — which is entirely
plausible given both are independently reachable authenticated endpoints, and the server
enforces nothing that orders them — will trigger a Postgres foreign-key violation
(`23503`) that is not caught anywhere, surfacing as an unhandled `500` instead of a
documented error.

No existing test exercises this path: `save-idempotency.spec.ts` and
`bodyparser-smoke.spec.ts` both explicitly insert/complete a `visitor_profile` before
ever calling `save`, so the gap is untested as well as unhandled. The `saveFestival`
ts-rest contract (`router.ts:71-78`) also has no response status for this case (only
`200`/`404`), so even a server-side fix needs a contract change.

**Fix:** Check for (or require) a completed profile before inserting, and map the
failure to a clean, contract-documented response — either a pre-check or catching the
FK violation the same way `me.service.ts`'s `completeProfile` already catches `23505`:

```ts
async save(visitorId: string, festivalId: string): Promise<
  { status: 'ok' } | { status: 'not-found' } | { status: 'profile-required' }
> {
  const [fest] = await this.db.select({ id: festival.id }).from(festival)
    .where(eq(festival.id, festivalId)).limit(1);
  if (!fest) return { status: 'not-found' };

  try {
    await this.db.insert(myFestival).values({ visitorId, festivalId }).onConflictDoNothing();
  } catch (err) {
    const cause = (err as { cause?: unknown }).cause;
    if (cause instanceof PostgresError && cause.code === '23503') {
      return { status: 'profile-required' };
    }
    throw err;
  }
  return { status: 'ok' };
}
```
and add a corresponding `409`/`400` response to `contract.saveFestival` plus a
controller branch, then add a test that calls `save` for a session with no
`visitor_profile` row.

## Warnings

### WR-01: No length/format validation on user-supplied profile fields (`username`, `displayName`, `avatar`)

**File:** `packages/contracts/src/schemas.ts:59-64`, `packages/db/src/schema/visitor-profile.ts:64-75`

**Issue:** `completeProfileBodySchema` is built from `visitorProfileInsertSchema`, whose
`.extend()` override (required to work around the drizzle-zod inference bug documented
in `visitor-profile.ts:46-63`) replaces `username`/`displayName`/`avatar` with bare
`z.string()` — no `.min()`, `.max()`, `.trim()`, or pattern. Consequences:
- `username: ''` (empty string) and `username: '   '` (whitespace-only) both pass
  validation and satisfy the DB's `NOT NULL` constraint (empty string isn't `NULL`), so
  they get persisted, defeating the intent of a chosen, meaningful username.
- No max length — a client can store arbitrarily long strings.
- `avatar` has no `.url()` check (contrast with `festivalSchema.cashlessUrl`, which does
  use `.url()` in the same file), so it can hold any string, including
  `javascript:`-scheme values — a stored-XSS/SSRF risk once a client renders this value
  as an image source without server-side validation.
- `usernameAvailability`'s query schema (`router.ts:58-64`) has the same unbounded
  `username: z.string()`, so an empty-string check will (correctly, but uselessly)
  report `available: true`.

**Fix:** Tighten the schemas, e.g.:
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
`lower(username)`. `completeProfile`'s catch block treats any `23505` the same way:

```ts
if (cause instanceof PostgresError && cause.code === '23505') {
  return { status: 'conflict' };
}
```
which the controller unconditionally reports as `409 { message: 'Username already taken' }`.
If an account that already has a profile calls `complete-profile` again (double-submit,
client retry, or a user attempting to edit their profile via this endpoint) with a
brand-new, genuinely available username, the request fails on the `accountId` PK, not
the username index — yet the client is told the *username* is taken, which is false and
misleading.

**Fix:** Disambiguate via the Postgres error's constraint name (available as
`cause.constraint_name` on `postgres`'s `PostgresError`), e.g.:
```ts
if (cause instanceof PostgresError && cause.code === '23505') {
  if (cause.constraint_name === 'visitor_profile_username_lower_unq') {
    return { status: 'conflict' };
  }
  return { status: 'already-completed' }; // map to a distinct, accurate response
}
```

### WR-03: Two independent Postgres connection pools are created for the same database

**File:** `apps/api/src/auth/auth.instance.ts:9`, `apps/api/src/db/db.module.ts:14`

**Issue:** `auth.instance.ts` calls `createDatabase(env.DATABASE_URL)` at module-import
time to build the drizzle adapter for better-auth. `DbModule` independently calls
`createDatabase(env.DATABASE_URL)` again via its `useFactory`. `createDatabase`
(`packages/db/src/client.ts`) constructs a brand-new `postgres.js` client (its own
connection pool) each time it's called, so the app opens two separate pools against the
same pooled Neon endpoint instead of sharing one `Database`/`postgres.js` client. This
works but doubles the app's baseline connection footprint against Neon's pgBouncer
limits, and diverges from the single-shared-client pattern the rest of the codebase uses
(`DB` DI token).

**Fix:** Have `auth.instance.ts` accept/reuse the same `Database`/`postgres.js` client
that `DbModule` creates (e.g. construct the client once in a shared module-level helper,
or move `auth` construction into a factory that receives the already-created `DB`
instance) rather than creating a second pool independently.

### WR-04: Dev OTP capture file is a single shared file — concurrent OTP requests can overwrite each other's code

**File:** `apps/api/src/auth/email/dev-otp-email-provider.ts:15-33`

**Issue:** `CAPTURE_FILE` is one fixed path (`apps/api/.otp-dev-transport.local.json`),
and every OTP `send()` call unconditionally overwrites it with `writeFile` (no append,
no per-email keying). If two OTP requests are in flight close together (e.g. two people
testing concurrently against a shared dev server, or two test files not fully
serialized), the second `send()` silently clobbers the first request's captured code
before it's read. Callers cope with this defensively (`readCapturedOtp`'s
match-on-`email` + retry loop across the test suite), and `vitest.config.ts` explicitly
disables `fileParallelism` to work around exactly this fragility — but the underlying
provider is still a race condition, and any real concurrent dev usage outside the test
suite (two developers on a shared dev deployment) can silently lose one user's OTP.

**Fix:** Key the capture file per-email (e.g. write to a `Map`/JSON keyed by email, or a
directory of `<email-hash>.json` files) instead of a single overwritten file, or append
an array of recent entries.

### WR-05: Integration tests perform destructive writes/deletes against whichever `DATABASE_URL`/`DATABASE_URL_UNPOOLED` is configured, with no environment guard

**File:** `apps/api/test/setup.ts:17-25`, `apps/api/vitest.config.ts`

**Issue:** `createTestDatabase()` connects to `process.env.DATABASE_URL_UNPOOLED ??
process.env.DATABASE_URL` with no check that this points at a disposable/test database
(no `NODE_ENV` guard, no dedicated `TEST_DATABASE_URL`, no hostname/db-name allowlist).
Every spec file performs real `db.insert(...)`/`db.delete(...)` calls against that
connection. If a developer or CI job has `DATABASE_URL` pointed at a shared dev/staging
database (easy to do by accident — same env var name used by the running dev server),
`pnpm test` will insert and delete real rows there.

**Fix:** Add a safety check in `test/setup.ts` (e.g. require a `TEST_DATABASE_URL` env
var distinct from the app's `DATABASE_URL`, or assert the resolved connection string
contains an expected test-db marker) before allowing any test to run.

### WR-06: Near-identical OTP sign-in/cookie helper functions duplicated across four spec files

**File:** `apps/api/test/bodyparser-smoke.spec.ts:39-59`, `apps/api/test/festival-isolation.spec.ts:15-38`, `apps/api/test/me-endpoints.spec.ts:15-42`, `apps/api/test/save-idempotency.spec.ts:15-40`

**Issue:** `readCapturedOtp`, `cookieHeaderFromSetCookie`, `signInWithOtp` (plus the
`CAPTURE_FILE`/`ORIGIN` constants) are copy-pasted verbatim (or near-verbatim) into each
of these four spec files. Any future change to the OTP capture-file protocol, cookie
parsing, or sign-in flow has to be made in four places in lockstep, and any that drifts
silently breaks only some specs. `test/setup.ts` already exists as the natural shared
location for test infrastructure.

**Fix:** Move `readCapturedOtp`, `cookieHeaderFromSetCookie`, and `signInWithOtp` into
`test/setup.ts` (or a new `test/helpers.ts`) and import them from all four spec files.

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
var as unused, or miss that `BETTER_AUTH_URL` needs to be set for CSRF checks to trust
the right origin in production.

**Fix:** Either pass it explicitly (`baseURL: env.BETTER_AUTH_URL`) or add a comment
next to the `betterAuth()` call noting that `BETTER_AUTH_URL` is consumed implicitly via
better-auth's own env-var convention.

### IN-02: Resend "from" address is hardcoded and not environment-configurable

**File:** `apps/api/src/auth/email/resend-otp-email-provider.ts:20`

**Issue:** `from: 'festipal <onboarding@resend.dev>'` is a Resend sandbox address,
hardcoded inline. This provider is currently dormant (D-01), but when it's switched on
via `OTP_EMAIL_TRANSPORT=resend` there's no way to change the sender without a code
change/redeploy, and the sandbox domain has Resend-side sending restrictions.

**Fix:** Source the `from` address from an env var (with the current value as the dev
default) when this transport is activated.

### IN-03: OTP email content doesn't vary by `type`

**File:** `apps/api/src/auth/email/resend-otp-email-provider.ts:19-24`, `apps/api/src/auth/email/dev-otp-email-provider.ts:20`

**Issue:** `sendVerificationOTP`'s `type` can be `'sign-in' | 'email-verification' |
'forget-password' | 'change-email'`, but both providers send an identical subject
("Your festipal sign-in code") regardless of `type`, only appending `(type: ${type})` to
the Resend body text. Only `sign-in` is used this phase, so this is low-impact now, but
will read oddly to end users once other flows are wired up.

**Fix:** Branch subject/copy on `type` when the other flows are implemented.

### IN-04: `apps/api/.env.example` could not be reviewed

**File:** `apps/api/.env.example`

**Issue:** The review sandbox denies read access to `.env*` files, including this
tracked example/template file, so its contents were not inspected as part of this
review.

**Fix:** No code change implied — flagging so a human reviewer manually confirms
`.env.example` contains only placeholder values (no real secrets), per the project's
"no secrets in repo" rule.

---

_Reviewed: 2026-08-02T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
