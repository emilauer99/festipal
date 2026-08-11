# Phase 2: OTP Auth & Festival Backend API - Research

**Researched:** 2026-08-01
**Domain:** NestJS backend auth wiring (better-auth email-OTP via `@thallesp/nestjs-better-auth`), ts-rest contract composition, Postgres tenant isolation
**Confidence:** HIGH (all four load-bearing claims — bodyParser re-application, global-prefix auto-exclusion, guard coverage of ts-rest handlers, and version pin — confirmed against official `@thallesp/nestjs-better-auth` README/docs via Context7, cross-checked against npm registry)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Email/OTP delivery for this phase — Dev transport now, Resend wired-but-deferred**
The OTP email send goes through a **provider abstraction** with a **dev transport**
(console log and/or Mailpit) as the active path this phase. The `RESEND_API_KEY` /
Resend adapter code path is **implemented but env-optional** — it stays dormant until a
key is configured. **No Resend account or domain verification is required for Phase 2.**
Follow better-auth guidance: fire-and-forget the send inside `sendVerificationOTP` (do not
`await` the provider before responding), always return success from the OTP-request
endpoint regardless of delivery outcome (Pitfall 9). No secrets committed — provider key
is env-only; add a placeholder to `.env.example`. Reversible.

**D-02: Session lifetime — 90 days, sliding**
Configure better-auth's session as a **sliding** session: `expiresIn ≈ 90 days`,
`updateAge ≈ 1 day`. No refresh-token grant — one sliding session token (Pitfall 10). Do
NOT build a custom `/auth/refresh` endpoint or token-rotation logic. "Session expired →
route back to OTP sign-in" is the only expiry behavior. Reversible (config values only).

**D-03: Festival test/seed data — reusable seed with ONE user-defined festival**
Idempotent seed script (e.g. `pnpm --filter db db:seed`) inserting a **single** real
festival (`frequency-2026`, see below). The SEC-02 cross-tenant isolation test creates its
own two throwaway festivals as test fixtures (test DB / transaction-scoped) — does NOT
rely on or pollute the dev seed.

**D-04: `GET /festivals` shape — minimal now, no pagination, date/place deferred**
`GET /api/v1/festivals` returns **all** currently-seeded festivals (no pagination) using
only fields that exist on `festival` today (`id`/`slug`/`name`/`defaultLocale`/
`supportedLocales`; `cashlessUrl` optional). FEST-01 date/place fields are NOT modeled
this phase (Phase 5). Two distinct contracts (Pitfall 4): `GET /festivals` (browse,
session-only, no save-gated fields) vs `GET /me/festivals` (returns only the caller's
saved `my_festival` rows) — never one endpoint + client-side `.filter()`. Contract shape
kept additive (costly to reverse — response Zod schema is published to future clients).

**Seed festival (user-provided, D-03):**
| Field | Value |
|---|---|
| `slug` | `frequency-2026` |
| `name` | `Frequency 2026` |
| `defaultLocale` | `de` |
| `supportedLocales` | `de`, `en` |
| `cashlessUrl` | *(none — leave null)* |
| tags | *(none this seed)* |

### Claude's Discretion (technical, not user-facing)
- **Login-first tagging (SEC-01):** health + OTP send/verify are anonymous; every other
  endpoint protected-by-default. Produce the endpoint × auth-annotation table.
- **Body-parser wiring (SC-4):** `NestFactory.create(AppModule, { bodyParser: false })` +
  `AuthModule.forRoot({ auth, bodyParser: {...} })`; ts-rest controllers consume the
  re-applied `req.body`. Hand-rolled `@All('auth/*path')` catch-all is **Plan C** only.
- **Global-prefix collision:** align `/api/v1` (ts-rest) vs `/api/auth` (better-auth) —
  confirmed during this research to be a non-issue in this codebase (see Confirmed
  Finding 4 below); no code change needed beyond default wiring.
- **username-availability vs complete-profile (Pitfall 11):** availability is advisory
  (debounced `SELECT`); `complete-profile` is source of truth — catch Postgres `23505`
  from `visitor_profile_username_lower_unq` and map to `409`, don't trust the prior check.
- **SEC-02 isolation-test fixtures:** the test provisions its own 2 festivals (per D-03).
- Module/file layout under `apps/api/src/` (e.g. `auth/`, `me/`, `festival/` extensions),
  the seed script's home in `packages/db`, and the OTP provider-abstraction shape.

### Deferred Ideas (OUT OF SCOPE)
- Real Resend delivery (account, domain verification, DNS) — flip on by env when the
  mobile client needs real inboxes (Phase 3+). Adapter is built this phase; delivery is not.
- OTP rate-limit tuning for festival-scale shared-IP traffic (Pitfall 8) — keep
  better-auth defaults (3/60s per IP) for dev/staging; revisit before first live festival.
- Festival `date`/`place` master-data fields → Phase 5 (FEST-01); `GET /festivals`
  contract kept additive.
- Pagination on `GET /festivals` → whenever festival count justifies it (post-shell).
- `FestivalStaff`/`PlatformAdmin`/better-auth organization plugin → admin milestone.
- Expo auth client, SecureStore persistence, `trustedOrigins`, deep-link guard, splash
  gating (Pitfalls 2 & 5) → Phase 3/4 (mobile). CORS/`trustedOrigins` for the deployed
  Railway URL is a mobile-phase concern, not dev-only localhost this phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | Login-first — all app functionality requires authentication (no anonymous browsing) | `@thallesp/nestjs-better-auth`'s `AuthModule.forRoot({ auth })` registers a **global** `AuthGuard` by default (no `disableGlobalAuthGuard`), confirmed to cover `@TsRestHandler`-decorated methods since they are plain NestJS controller methods (guards/interceptors/pipes apply normally — see Confirmed Finding 3). `@AllowAnonymous()` tags health + OTP request/verify; every other endpoint inherits protected-by-default. |
| SEC-02 | Festival-scoped data is isolated by `festivalId`; saving/entering is gate-less, not an access gate | Mirror `festival.service.ts`'s `eq(festival.id, festivalId)`-scoped query pattern for `my_festival`; `GET /me/festivals` must `WHERE eq(myFestival.visitorId, session.user.id)` — never client-side filtered. Cross-tenant denial test pattern documented in Validation Architecture below. |
</phase_requirements>

## Summary

The intended wiring from ROADMAP/CONTEXT (`NestFactory.create(AppModule, { bodyParser: false })` +
`AuthModule.forRoot({ auth, bodyParser: {...} })` from `@thallesp/nestjs-better-auth`) is
**confirmed correct against the official docs**, with one simplification: the feared
`/api/v1` (ts-rest) vs `/api/auth` (better-auth) global-prefix collision **does not exist**
in this codebase. `apps/api/src/main.ts` never calls `app.setGlobalPrefix()` — ts-rest's
`pathPrefix: '/api/v1'` is baked directly into every contract route path at the `c.router()`
call, and better-auth's default `basePath` is `/api/auth`, a fully distinct top-level path.
Even if `setGlobalPrefix` were introduced later (e.g. for non-ts-rest routes), the wrapper
auto-excludes its own routes from it — no manual `exclude: [...]` array is needed. This
removes an entire "Claude's Discretion" decision point from the plan: default wiring is
correct, zero extra config required for the prefix question.

`@thallesp/nestjs-better-auth` v2.7.0 (npm, verified 2026-08-01) requires better-auth
`1.5.0–1.99.99`, NestJS `≥11.1.6`, Node `≥22.22.1`, TypeScript `5.9.2 or 6.0.0` — the
project's `better-auth@1.6.25` (already pinned in `packages/db/package.json`), NestJS
`11.1.28`, and TypeScript `6.0.3` all satisfy these ranges. `bodyParser: false` on
`NestFactory.create` combined with `AuthModule.forRoot({ auth, bodyParser: {...} })` is
confirmed by the library's own README: *"The library will re-add the default body parsers
for non-auth routes."* — the exact behavior the spike needs to confirm, not design.

The `emailOTP` plugin's defaults (`otpLength: 6`, `expiresIn: 300s`, `allowedAttempts: 3`,
`rateLimit: { window: 60, max: 3 }`) match PITFALLS.md's documented values, with one new
confirmed detail: **better-auth exposes no distinct error code for "wrong" vs "expired"
OTP** — both surface as the generic `INVALID_OTP` (`invalid_code`, "occurs when the
authentication code is invalid, expired, or cannot be verified"). This upgrades Pitfall 9's
MEDIUM-confidence claim to HIGH confidence: the client-side UX **cannot** distinguish these
cases from the API response and must default to "code didn't work, request a new one"
copy. `resendStrategy: "reuse"` is a one-line config confirmed via official docs snippet.
`sendVerificationOTP` must be fire-and-forget (`void sendEmail(...)`, never `await`) per
better-auth's own guidance — this is *how* "always return success" is achieved (there's no
separate flag; the endpoint's response is structurally independent of the send outcome
because the send is never awaited on the response path).

For Postgres `23505` handling: with `drizzle-orm` (postgres.js driver, this project's
setup), the thrown error is a `DrizzleQueryError` wrapping the driver's `PostgresError` in
`error.cause` — code must check `error.cause instanceof PostgresError && error.cause.code
=== '23505'`, not `error instanceof PostgresError` directly.

**Primary recommendation:** Wire `AuthModule.forRoot({ auth, bodyParser: { json: { limit:
'2mb' }, urlencoded: { limit: '2mb', extended: true } } })` with a real `betterAuth()`
runtime instance (`drizzleAdapter(db, { provider: 'pg', schema })` + `emailOTP({ ... })` +
`session: { expiresIn, updateAge }`) built in a new `apps/api/src/auth/` module — no
`setGlobalPrefix` changes needed, no hand-rolled catch-all needed (Plan C stays unused).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| OTP send/verify, session issuance | API / Backend (`better-auth` mounted in NestJS) | Database (session/verification tables) | Auth is entirely server-side; no client SDK exists yet (Phase 3+) |
| Login-first guard (SEC-01) | API / Backend (global `AuthGuard`) | — | Enforced once at the framework boundary, not per-controller |
| First-login profile completion | API / Backend (`me` module) | Database (`visitor_profile` unique index) | Advisory check server-side, authoritative constraint at DB layer (Pitfall 11) |
| Festival browse (`GET /festivals`) | API / Backend | Database (`festival` table, unscoped read) | Public-ish discoverable list, session-required per SEC-01 but not `festivalId`-scoped |
| Festival save / my-festivals (SEC-02) | API / Backend (`my_festival`-scoped queries) | Database (`my_festival` composite PK) | Tenant boundary enforced via WHERE clause, not a guard/403 (gate-less, ADR-014) |
| Email delivery (OTP) | API / Backend (provider abstraction) | External (Resend, dormant) | Fire-and-forget from the API; no client-tier involvement |
| Seed data | Database / Storage (`packages/db` script) | — | One-off idempotent script, not part of request-serving runtime |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `better-auth` | `1.6.25` (already pinned in `packages/db/package.json`; add to `apps/api`) | Passwordless auth core (session, emailOTP plugin, Drizzle adapter) | ADR-009; self-hosted, TS-native, Drizzle-integrated |
| `@thallesp/nestjs-better-auth` | `^2.7.0` [VERIFIED: npm registry] | NestJS wrapper: `AuthModule`, global `AuthGuard`, `@Session`/`@AllowAnonymous`/`@OptionalAuth` decorators, body-parser re-application | Official NestJS integration surface for better-auth; requires better-auth `>=1.5.0` (satisfied), NestJS `>=11.1.6` (satisfied), TS `5.9.2 \| 6.0.0` (satisfied by `6.0.3`) — pin confirmed via Context7 MANIFEST + npm |
| `resend` | `^6.18.1` [VERIFIED: npm registry] | Env-gated, wired-but-dormant email delivery adapter (D-01) | Official Node SDK for the chosen production email path |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `nodemailer` (or plain `console.log`) | n/a — dev-only, no package needed for console transport; add `nodemailer` only if routing through Mailpit's SMTP port | Dev transport for the OTP provider abstraction (D-01) | Keep minimal: `console.log` is sufficient to unblock curl-based OTP testing; add `nodemailer` only if the team wants a real inbox via local Mailpit |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@thallesp/nestjs-better-auth` wrapper | Hand-rolled `@All('auth/*path')` catch-all forwarding to `auth.handler` | Plan C only — more manual body-stream handling, loses `@Session()`/`@AllowAnonymous()` decorators, no auto body-parser re-application. Only fall back if the wrapper demonstrably breaks with this NestJS×ts-rest×global-prefix combo (research found it does not). |
| `resendStrategy: "reuse"` | Default (mint new OTP on resend) | Rejected — invalidates the first email's code, confusing UX (Pitfall 9). One-line config, no reason to skip. |
| Fire-and-forget `sendVerificationOTP` | `await`-ing the email send before responding | Rejected — timing-attack surface + blocks the response on a third-party API latency; better-auth's own docs recommend `void sendEmail(...)` |

**Installation:**
```bash
pnpm --filter @festipal/api add better-auth @thallesp/nestjs-better-auth resend
```

**Version verification (2026-08-01):**
- `better-auth`: npm registry latest `1.6.25`, published `2026-07-23` — matches `packages/db`'s existing pin exactly. No version bump needed.
- `@thallesp/nestjs-better-auth`: npm registry latest `2.7.0`, published `2026-07-04`. Context7-curated MANIFEST (v2.6.1 snapshot) confirms peer range `better-auth >=1.5.0 <=1.99.99`; `2.7.0` is a minor bump on the same major, range unaffected.
- `resend`: npm registry latest `6.18.1`, published `2026-07-28`.

## Package Legitimacy Audit

| Package | Registry | Weekly Downloads | Source Repo | Verdict (seam) | Disposition |
|---------|----------|-------------------|--------------|---------|-------------|
| `better-auth` | npm | 6,546,561/wk | `github.com/better-auth/better-auth` | `SUS` ("too-new" — false positive, see note) | **Approved** — already in use in `packages/db`, high download count, official repo, Context7 HIGH-reputation source |
| `@thallesp/nestjs-better-auth` | npm | 69,477/wk | `github.com/ThallesP/nestjs-better-auth` | `SUS` ("too-new" — false positive) | **Approved** — official NestJS integration for better-auth, Context7 HIGH-reputation source, active maintenance (2.7.0 released 2026-07-04) |
| `resend` | npm | 8,942,938/wk | `github.com/resend/resend-node` | `SUS` ("too-new" — false positive) | **Approved** — well-known transactional email provider's own SDK, extremely high download count |

**Note on "too-new" verdicts:** The `package-legitimacy check` seam flags all three packages
`SUS` with reason `too-new`, but its `publishedAt` signal reflects the **latest version's**
release date, not the package's first-ever publish — all three are established, actively
maintained libraries with multi-million weekly downloads and official GitHub repos. This is
a heuristic false positive on frequently-released packages, not a legitimacy concern.
Cross-checked against `npm view <pkg> version`/`time.modified` directly (all three resolve
cleanly on the npm registry) and Context7's "High" source-reputation rating for both
better-auth and nestjs-better-auth. No `postinstall` scripts found on any of the three.

**Packages removed due to `[SLOP]` verdict:** none.
**Packages flagged as suspicious `[SUS]`:** none requiring a `checkpoint:human-verify` — the
"too-new" signal is addressed above with corroborating evidence (downloads, repo, Context7
reputation); planner may proceed without an extra human-verify gate, but should note this
reasoning in the plan for auditability.

## Architecture Patterns

### System Overview (Confirmed Wiring)

```
                     ┌─────────────────────────────────────────────┐
                     │  NestFactory.create(AppModule,               │
                     │    { bodyParser: false })                    │
                     └───────────────────┬───────────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────────┐
                    │            AppModule                           │
                    │  imports: [ConfigModule, DbModule,              │
                    │    AuthModule.forRoot({ auth, bodyParser }),    │
                    │    FestivalModule, MeModule]                    │
                    └─────────────────────┬─────────────────────────┘
                                          │
        ┌─────────────────────────────────┼─────────────────────────────┐
        │                                 │                             │
  ┌─────▼──────┐                 ┌────────▼─────────┐          ┌────────▼────────┐
  │ better-auth │                 │  Global AuthGuard │          │  Re-applied      │
  │  handler     │                 │  (APP_GUARD-style,│          │  express.json()  │
  │  /api/auth/* │                 │  covers ALL routes│          │  for non-auth    │
  │  (own auth,  │                 │  incl. TsRestHan- │          │  routes          │
  │  no guard)   │                 │  dler methods)    │          │                  │
  └──────────────┘                 └────────┬──────────┘          └────────┬─────────┘
                                             │                              │
                            ┌────────────────┴──────────────┐              │
                            │                                │              │
                    ┌───────▼────────┐              ┌────────▼───────┐     │
                    │ @AllowAnonymous │              │ Protected by    │◄────┘
                    │ health, (auth   │              │ default: GET/me,│
                    │ routes exempt   │              │ POST /me/*,      │
                    │ by wrapper      │              │ GET/POST         │
                    │ itself)         │              │ /festivals*      │
                    └─────────────────┘              └────────┬─────────┘
                                                                │
                                                       ┌────────▼─────────┐
                                                       │ @Session()        │
                                                       │ session.user.id   │
                                                       │ → festivalId-     │
                                                       │   scoped query    │
                                                       │   (SEC-02)        │
                                                       └────────┬─────────┘
                                                                │
                                                       ┌────────▼─────────┐
                                                       │ Drizzle → Postgres│
                                                       │ visitor_profile / │
                                                       │ my_festival /     │
                                                       │ festival           │
                                                       └───────────────────┘
```

A request to `POST /api/auth/sign-in/email-otp` never touches the global `AuthGuard` (the
wrapper's own controllers self-manage auth) and gets its body parsed by better-auth's own
body-parsing path. A request to `POST /api/v1/festivals/:id/save` passes through the global
`AuthGuard` (protected by default, no `@AllowAnonymous`), gets its body parsed by the
re-applied `express.json()` middleware, and its `@TsRestHandler` method receives both the
ts-rest-validated `body` and (via a co-located `@Session()` parameter) the current user.

### Recommended Project Structure
```
apps/api/src/
├── auth/
│   ├── auth.instance.ts     # betterAuth() runtime instance: drizzleAdapter + emailOTP + session config
│   ├── auth.module.ts       # AuthModule.forRoot({ auth, bodyParser }) wrapper
│   └── email/
│       ├── otp-email-provider.ts       # interface: send({ email, otp, type }): Promise<void>
│       ├── dev-otp-email-provider.ts   # console.log (D-01 active path)
│       └── resend-otp-email-provider.ts # env-gated, dormant (D-01)
├── me/
│   ├── me.controller.ts     # GET /me, POST /me/complete-profile, GET /me/username-availability, GET /me/festivals
│   ├── me.service.ts
│   └── me.module.ts
├── festival/                # EXTEND existing module
│   ├── festival.controller.ts  # + listFestivals, saveFestival handlers
│   └── festival.service.ts     # + festivalId-scoped my_festival queries
```
*(Module boundaries are Claude's Discretion per CONTEXT.md — this is a proposed default, not locked.)*

### Pattern 1: `betterAuth()` runtime instance, built outside NestJS DI

better-auth's `AuthModule.forRoot({ auth })` needs an already-constructed `Auth` instance at
*module-registration* time, which happens synchronously during `AppModule`'s import
evaluation — before NestJS's async DI container is available. Build it as a plain module
export, mirroring how `config/env.ts`'s `loadEnv()` is already called synchronously in
`main.ts`.

```typescript
// apps/api/src/auth/auth.instance.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
import { createDatabase, account, session, user, verification } from '@festipal/db';

import { loadEnv } from '../config/env';
import { createOtpEmailProvider } from './email/otp-email-provider';

const env = loadEnv(); // Source: better-auth NestJS docs — synchronous, mirrors main.ts
const db = createDatabase(env.DATABASE_URL);
const otpEmailProvider = createOtpEmailProvider(env);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema: { user, session, account, verification } }),
  secret: env.BETTER_AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 90, // 90 days (D-02)
    updateAge: 60 * 60 * 24, // 1 day sliding window (D-02)
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 5,
      resendStrategy: 'reuse', // Pitfall 9 — never leave at default
      async sendVerificationOTP({ email, otp, type }) {
        void otpEmailProvider.send({ email, otp, type }); // fire-and-forget, NEVER await (timing-attack surface)
      },
    }),
  ],
});
```
```typescript
// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';

import { auth } from './auth.instance';

@Module({
  imports: [
    BetterAuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
      },
    }),
  ],
})
export class AuthModule {}
```
```typescript
// apps/api/src/main.ts
const app = await NestFactory.create(AppModule, { bodyParser: false }); // Source: @thallesp/nestjs-better-auth README
```
**Caveat (env-loaded-twice risk, extends CONCERNS.md):** this introduces a *third* call site
for `loadEnv()` (`main.ts`, `config/config.module.ts`, now `auth/auth.instance.ts`). Since
`loadEnv()` is pure/synchronous, calling it multiple times is not incorrect, but it is
wasteful and risks divergent error messages if `process.env` mutates between calls (it
won't in this app, but it's a footgun). **Recommendation for the planner:** export `env` as
a memoized singleton from `config/env.ts` (`export const env = loadEnv();` evaluated once at
module load, imported everywhere) rather than calling the function repeatedly — closes the
CONCERNS.md gap instead of deepening it.

### Pattern 2: `@Session()` + `@TsRestHandler` on the same method

`@Session()` is a standard NestJS parameter decorator; `@TsRestHandler` is a method
decorator. Both apply independently — the outer method receives the session via the
parameter decorator, and closes over it inside the `tsRestHandler(...)` callback (which only
receives ts-rest-validated `{ params, query, body }`, not the session).

```typescript
// apps/api/src/me/me.controller.ts
import { Controller } from '@nestjs/common';
import { contract } from '@festipal/contracts';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { MeService } from './me.service';

@Controller()
export class MeController {
  constructor(private readonly me: MeService) {}

  @TsRestHandler(contract.getMe)
  getMe(@Session() session: UserSession) {
    return tsRestHandler(contract.getMe, async () => {
      const profile = await this.me.getProfile(session.user.id);
      return { status: 200, body: { accountId: session.user.id, email: session.user.email, profile } };
    });
  }
}
```
*Confidence: MEDIUM — this exact combination (decorator + `@TsRestHandler` on one method) is
not shown together in either library's docs, but both mechanisms are independently confirmed
to compose with arbitrary NestJS decorators/guards. Verify in the spike with a live curl
call against `GET /api/v1/me` with a valid session cookie/bearer token.*

### Pattern 3: Postgres `23505` → `409` (Pitfall 11)

```typescript
// apps/api/src/me/me.service.ts
import { PostgresError } from 'postgres';

async completeProfile(accountId: string, input: { username: string; displayName: string; avatar?: string }) {
  try {
    const [row] = await this.db.insert(visitorProfile).values({ accountId, ...input }).returning();
    return { status: 'ok' as const, profile: row };
  } catch (err) {
    // drizzle-orm (postgres.js driver) wraps the driver error: check `error.cause`, not `error` itself.
    const cause = (err as { cause?: unknown }).cause;
    if (cause instanceof PostgresError && cause.code === '23505') {
      return { status: 'conflict' as const };
    }
    throw err;
  }
}
```
*Source: [drizzle-team/drizzle-orm Discussion #916](https://github.com/drizzle-team/drizzle-orm/discussions/916) — MEDIUM confidence (community discussion, not official docs); verify empirically against the project's exact `drizzle-orm@0.45.2` + `postgres@3.4.9` pin during implementation, since error-wrapping behavior has changed across drizzle-orm minor versions historically.*

### Anti-Patterns to Avoid
- **Manual `setGlobalPrefix` exclude array for `/api/auth`:** Not needed. The wrapper
  auto-excludes its own routes; this codebase doesn't even call `setGlobalPrefix` (ts-rest's
  `pathPrefix` already does the job for `/api/v1/*`). Adding a manual exclude is redundant
  complexity that duplicates behavior the library already provides.
- **`disableGlobalAuthGuard: true` "to keep things simple":** Defeats SEC-01 entirely —
  would require manually applying `@UseGuards(AuthGuard)` to every controller, exactly the
  "forgot to protect a route" failure mode Pitfall 3 warns about. Leave the default (global
  guard on) and use `@AllowAnonymous()` for the few exceptions.
- **Awaiting `sendVerificationOTP`'s email send:** Timing-attack surface + Resend-outage
  becomes sign-in-outage. Always `void`.
- **Trusting `GET /me/username-availability`'s `SELECT` as authoritative:** TOCTOU race
  (Pitfall 11) — `POST /me/complete-profile` must independently catch `23505`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OTP generation, storage, rate-limiting, resend semantics | Custom OTP table + cron cleanup + rate-limit middleware | `better-auth`'s `emailOTP` plugin (`otpLength`, `expiresIn`, `allowedAttempts`, `rateLimit`, `resendStrategy`) | Handles atomic verify-then-consume (prevents replay), attempt budgeting, and rate-limit middleware out of the box — re-implementing this correctly (especially the atomic consume) is a well-known source of auth bugs |
| Body-parser re-application after `bodyParser: false` | Manual `app.use(express.json())` with a path-exclusion regex for `/api/auth/*` | `AuthModule.forRoot({ auth, bodyParser: {...} })`'s built-in re-application | The wrapper already does exactly this, tested against its own auth routes; a hand-rolled version risks getting the exclusion regex wrong against future route additions |
| Session refresh / token rotation | Custom `/auth/refresh` endpoint | better-auth's sliding session (`expiresIn`/`updateAge`) | Pitfall 10 — "Refresh-Token" in the concept doc is a misnomer; better-auth has no distinct refresh-token grant to replicate |
| Global-prefix exclusion for auth routes | Custom middleware checking `req.path.startsWith('/api/auth')` | `AuthModule.forRoot`'s automatic exclusion (confirmed, Context7-sourced) | Already built in; redundant to duplicate |

**Key insight:** every "Don't Hand-Roll" item above maps to a documented `@thallesp/nestjs-better-auth` or `better-auth` capability confirmed during this research — the phase's job is wiring, not building auth primitives.

## Common Pitfalls

*(Full domain pitfall catalogue lives in `.planning/research/PITFALLS.md` — Pitfalls 3, 4, 8, 9, 10, 11, 12 are the authoritative risk list for this phase and are assumed read. This section adds Phase-2-specific confirmations/refinements found during this research pass.)*

### Refinement to Pitfall 9: wrong vs. expired OTP is NOT distinguishable by error code
**What goes wrong:** The client cannot show "your code expired, request a new one" vs.
"wrong code, check your typing" based on the API response — both cases throw the same
`INVALID_OTP` (`invalid_code`) error.
**Why it happens:** better-auth's `atomicVerifyOTP` consumes-then-checks in one step; an
expired record and a mismatched code both fail the same `verifyStoredOTP` check and hit the
same `APIError.from("BAD_REQUEST", ERROR_CODES.INVALID_OTP)` throw site.
**How to avoid:** Default all "invalid code" UI copy to the more actionable framing
("that code didn't work — request a new one") rather than a bare "wrong code, try again"
that invites useless retries of a code that's actually expired. This is a Phase 4 (mobile
UI) concern to note now so the phase's error-response contract doesn't over-promise a
distinction the backend can't provide.
**Warning signs:** A future PR adds client-side logic branching on an `expired` vs `wrong`
error code that the API never sends.
**Phase to address:** Documented here (Phase 2, since the API contract's error shape is
decided here); the UX consequence lands in Phase 4.

### New: `allowedAttempts` exhaustion permanently deletes the OTP record
**What goes wrong:** After 3 (default) wrong verify attempts, the verification record is
deleted outright — the *original, correct* code (if the user finally gets it right on a 4th
try) no longer works either. The user must request an entirely new code.
**Why it happens:** `atomicVerifyOTP` throws `FORBIDDEN`/`TOO_MANY_ATTEMPTS` once
`usedAttempts >= allowedAttempts` and never re-creates the record.
**How to avoid:** Surface a distinct "too many attempts, request a new code" message
(different from the generic invalid-code copy above) — the API *does* distinguish this case
(`TOO_MANY_ATTEMPTS` is a separate error code from `INVALID_OTP`), so the client-side
handling for *this* case can be more specific.
**Phase to address:** Documented here; consumed by Phase 4's OTP-entry UAT script.

### New: `loadEnv()` gains a third call site this phase
**What goes wrong:** `config/env.ts`'s `loadEnv()` is already called twice
(`main.ts`, `config/config.module.ts` — flagged in CONCERNS.md). Building the `betterAuth()`
instance outside NestJS DI (Pattern 1 above) needs `env` too, at a third call site.
**How to avoid:** Export `env` as a memoized module-level constant from `config/env.ts`
(`export const env = loadEnv();`) instead of re-invoking the function; import the constant
everywhere, including `auth/auth.instance.ts`. Closes the existing CONCERNS.md gap instead
of deepening it.
**Phase to address:** This phase — it's the first time a non-NestJS-DI consumer of `env`
is introduced.

## Code Examples

### Idempotent seed script (D-03)
```typescript
// packages/db/scripts/seed.ts
import { createDatabase } from '../src/client';
import { festival, festivalLocale } from '../src/schema';

async function seed() {
  const db = createDatabase(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!);

  const [fest] = await db
    .insert(festival)
    .values({
      slug: 'frequency-2026',
      name: 'Frequency 2026',
      defaultLocale: 'de',
    })
    .onConflictDoUpdate({
      target: festival.slug,
      set: { name: 'Frequency 2026', defaultLocale: 'de' },
    })
    .returning();

  await db
    .insert(festivalLocale)
    .values([
      { festivalId: fest.id, locale: 'de' },
      { festivalId: fest.id, locale: 'en' },
    ])
    .onConflictDoNothing();

  console.log(`Seeded festival: ${fest.slug} (${fest.id})`);
}

void seed();
```
*Uses `onConflictDoUpdate`/`onConflictDoNothing` keyed on `festival.slug`'s existing
`unique()` constraint — re-running the script is a no-op/refresh, satisfying "idempotent"
without a separate existence check. `DATABASE_URL_UNPOOLED` preferred per ADR-005 (matches
`drizzle.config.ts`'s existing convention for out-of-request-cycle scripts), falling back to
the pooled URL if unset (dev-friendliness).*
**Add to `packages/db/package.json` scripts:** `"db:seed": "tsx scripts/seed.ts"` (or
equivalent runner — `tsx`/`ts-node` not yet a dependency; add as needed).

### Cross-tenant denial query shape (SEC-02)
```typescript
// apps/api/src/me/me.service.ts — GET /me/festivals
async listMyFestivals(visitorId: string): Promise<Festival[]> {
  const rows = await this.db
    .select({ festival })
    .from(myFestival)
    .innerJoin(festival, eq(festival.id, myFestival.festivalId))
    .where(eq(myFestival.visitorId, visitorId)); // SEC-02: scoped by the CALLER's id, never a param
  return rows.map(({ festival: f }) => toFestivalDto(f));
}
```
The test (per D-03) provisions festival A and festival B, saves only festival A for
visitor 1, then asserts `listMyFestivals(visitor1.id)` returns exactly `[A]` — never `[A, B]`
and never influenced by a `festivalId` request parameter (there is none in this endpoint's
contract; scope comes entirely from the session).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Manual `express.json()` re-application with path-exclusion regex after `bodyParser: false` | `AuthModule.forRoot({ bodyParser: {...} })` auto re-applies for all non-auth routes | Confirmed current as of `@thallesp/nestjs-better-auth` v2.x (2026) | Removes an entire manual-wiring failure mode from the plan |
| Manually excluding `/api/auth/*` from `setGlobalPrefix` | Wrapper auto-excludes its own routes from `setGlobalPrefix` | Confirmed current | No plan task needed for this — was previously flagged as a "Claude's Discretion" decision point in CONTEXT.md; research resolves it definitively |

**Deprecated/outdated:** None specific to this phase's stack — all libraries are on their
latest stable minor/patch.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@Session()` parameter decorator composes cleanly with `@TsRestHandler` method decorator on the same method | Architecture Patterns, Pattern 2 | LOW — if it doesn't compose, fallback is `@Req() req: ExpressRequest` and read `req.user`/`req.session` directly (confirmed alternative pattern in the same official README) |
| A2 | `drizzle-orm@0.45.2` + `postgres@3.4.9` wraps unique-violation errors as `DrizzleQueryError` with `.cause` = `PostgresError` (not a bare `PostgresError` thrown directly) | Architecture Patterns, Pattern 3 | LOW-MEDIUM — if wrong, the `23505` catch silently falls through to the generic 500 path; verify with one deliberate duplicate-insert test early in implementation, not just in the SEC-02/Pitfall-11 verification test |
| A3 | Dev OTP transport can be `console.log` alone (no `nodemailer`/Mailpit needed) to satisfy "dev-first email... code readable" from CONTEXT.md Specifics | Standard Stack, Supporting | LOW — reversible; if the team wants a real inbox UX during dev, swap in `nodemailer` pointed at a local Mailpit SMTP port, no schema/contract impact |
| A4 | `GET /me` should return `{ accountId, email, profile: VisitorProfilePublic | null }` (profile `null` signals "needs complete-profile") | Architecture Patterns / contract shape | MEDIUM — this specific response shape is a Claude-proposed default, not user-locked; the planner should confirm/adjust since it affects the D-04-style "additive, hard to reverse" contract risk |

**If this table is empty:** N/A — assumptions above need no user confirmation to *start*
Phase 2, but A4 in particular should be called out explicitly in PLAN.md for user sign-off
given the contract-shape reversibility cost D-04 established for this milestone's other
Zod-published shapes.

## Open Questions

1. **Exact `GET /me` response shape for a not-yet-completed profile**
   - What we know: The endpoint must serve both "returning visitor, profile complete" and
     "first login, no profile yet" cases (per `docs/concept/09-onboarding-auth.md` §2 —
     "Bestandskonto... Schritt 4 entfällt, direkt rein").
   - What's unclear: Whether `profile: null` is the right discriminator, or whether a
     `status: 'complete' | 'needs-profile'` field is clearer for a Phase-3/4 mobile client
     that hasn't been built yet.
   - Recommendation: Lock this in PLAN.md (not here) — it's a contract-shape decision with
     real reversibility cost (D-04 precedent) that should get explicit user sign-off, not
     just a research default.

2. **Where does `packages/db`'s seed script get its runner (`tsx`, `ts-node`, or a compiled `dist/` entry)?**
   - What we know: `packages/db` currently has no script-runner devDependency; `tsup` builds
     the library output but a standalone seed script needs a way to execute TypeScript
     directly (or import from `dist/` after a build step).
   - What's unclear: Whether to add `tsx` as a devDependency (fast, common choice) or reuse
     the built `dist/` output (`node dist/...`, avoids a new dependency but requires `pnpm
     --filter db build` before seeding).
   - Recommendation: Add `tsx` as a devDependency for `packages/db` — it's the lower-friction
     choice for a script that's run manually/rarely, not part of the hot build path.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Neon Postgres (`DATABASE_URL`) | All DB access, seed script, better-auth's `drizzleAdapter` | ✓ (per Phase 1 STATE.md — "migrated cleanly", "proven LIVE in Neon") | Postgres 18 | — |
| `DATABASE_URL_UNPOOLED` | Seed script, migrations (ADR-005) | Assumed ✓ (same Neon project as `DATABASE_URL`) | — | Falls back to `DATABASE_URL` if unset (seed script pattern above) |
| Node.js | Runtime | ✓ per CLAUDE.md (`≥22`) | Need `≥22.22.1` specifically for `@thallesp/nestjs-better-auth` — **verify the exact installed patch version**, since CLAUDE.md only states the major | If `<22.22.1`, upgrade Node before installing the wrapper (peer dependency floor, not just "should work") |
| Mailpit (optional, dev email UX) | D-01 dev transport, only if the team wants a real inbox instead of console logs | Not verified — not currently required | — | `console.log` transport requires nothing (A3 above) |
| `RESEND_API_KEY` | Resend adapter (dormant this phase) | ✗ (intentionally — D-01) | — | Adapter stays dormant; no fallback needed, this is the designed state |

**Missing dependencies with no fallback:** None blocking — `DATABASE_URL_UNPOOLED` and Node
patch version should be spot-checked at plan/spike time but have low risk of being wrong
given Phase 1 already ran migrations successfully against the same environment.

**Missing dependencies with fallback:** Mailpit (falls back to console.log), Resend (by
design, stays dormant).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — `apps/api`, `packages/db`, `packages/contracts` have zero test files/config (confirmed via CONCERNS.md "No Test Framework Configuration" and a fresh glob in this research pass) |
| Config file | none — Wave 0 |
| Quick run command | n/a — Wave 0 must add `vitest` |
| Full suite command | n/a — Wave 0 must add `vitest` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | Every non-`@AllowAnonymous()` endpoint returns 401 without a session | integration (NestJS TestingModule + Supertest against a real app instance) | `vitest run apps/api/test/auth-guard.spec.ts` | ❌ Wave 0 |
| SEC-01 | `@AllowAnonymous()`-tagged endpoints (`/health`, `/api/auth/*`) work without a session | integration | same file as above | ❌ Wave 0 |
| SEC-02 | Cross-tenant denial: visitor 1 saves festival A only; `GET /me/festivals` for visitor 1 returns exactly `[A]`, never `[A, B]` | integration (own 2-festival fixture per D-03, transaction-scoped) | `vitest run apps/api/test/festival-isolation.spec.ts` | ❌ Wave 0 |
| SEC-02 | `POST /festivals/:festivalId/save` is idempotent (gate-less resave doesn't error) | integration | same file | ❌ Wave 0 |
| — (SC-4) | Two-POST body-parser proof: OTP-verify POST to `/api/auth/sign-in/email-otp` AND a ts-rest `POST /api/v1/festivals/:id/save` both receive a parsed body | smoke (live dev server + `curl`/Supertest, not unit) | manual curl script or `vitest run apps/api/test/bodyparser-smoke.spec.ts` | ❌ Wave 0 |
| — (Pitfall 11) | Concurrent duplicate-username `completeProfile` calls: second call returns `409`, not `500` | integration | `vitest run apps/api/test/username-race.spec.ts` | ❌ Wave 0 |
| — (SEC-01) | Endpoint × auth-annotation table matches actual controller decorators (no drift) | manual review + a lint/grep check listing every `@TsRestHandler`/`@Controller` method and its `@AllowAnonymous`/`@OptionalAuth` status | manual, documented in PLAN.md's verification section | n/a |

### Sampling Rate
- **Per task commit:** `vitest run <changed-file>.spec.ts` (once Wave 0 lands the framework)
- **Per wave merge:** `vitest run` (full `apps/api` suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`; live-dev-API curl proof for the
  two-POST body-parser test is additionally required since Supertest against an in-process
  Nest app may not reproduce Express body-parser stream-consumption edge cases identically
  to a real HTTP round-trip — run at least once against `pnpm --filter api dev`.

### Wave 0 Gaps
- [ ] Add `vitest` + `@nestjs/testing` + `supertest` to `apps/api` devDependencies
- [ ] `apps/api/vitest.config.ts` — Node environment, no DOM
- [ ] `apps/api/test/setup.ts` — test-DB connection helper (own Neon branch or transaction-rollback pattern per test)
- [ ] `apps/api/test/auth-guard.spec.ts`, `festival-isolation.spec.ts`, `username-race.spec.ts`, `bodyparser-smoke.spec.ts` — all new, per table above
- [ ] `packages/db` — add `tsx` devDependency for the seed script runner (Open Question 2)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | yes | better-auth `emailOTP` plugin — 6-digit OTP, `expiresIn: 300s`, `allowedAttempts: 3`, atomic consume-then-verify (prevents replay) |
| V3 Session Management | yes | better-auth sliding session (`expiresIn: 90d`, `updateAge: 1d`), signed/httpOnly session cookie (better-auth default), no JWT/refresh-token grant to misconfigure (D-02) |
| V4 Access Control | yes | Global `AuthGuard` (SEC-01) + `festivalId`-scoped WHERE clauses, never a session-existence-only check (SEC-02, Pitfall 4) |
| V5 Input Validation | yes | Zod schemas in `packages/contracts`, composed on `drizzle-zod` bases (`visitorProfileSelectSchema`, `myFestivalSelectSchema`) — never hand-redeclared (Pitfall 6) |
| V6 Cryptography | yes (indirect) | No custom crypto — OTP generation/hashing, session token generation, and secret handling are entirely inside better-auth; `BETTER_AUTH_SECRET` must be a strong random value, env-only, never committed |
| V7 Error Handling / Logging | yes | `23505` → `409` mapped explicitly (Pitfall 11), not a generic 500; OTP send failures logged out-of-band, never surfaced to the client response (fire-and-forget, D-01) |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| OTP request spam / inbox flooding a real user | Denial of Service | better-auth's built-in `rateLimit: { window: 60, max: 3 }` per path (send-verification-otp, sign-in/email-otp, etc.) — accepted default per Deferred section, tune before first live festival (Pitfall 8) |
| Timing-attack on OTP-send response latency revealing account existence | Information Disclosure | Fire-and-forget `sendVerificationOTP` (never await), always-success response by construction |
| Username-availability TOCTOU allowing duplicate usernames | Tampering | DB-level `uniqueIndex('visitor_profile_username_lower_unq')` is authoritative; `23505` caught and mapped to `409` (Pitfall 11) |
| Cross-tenant festival data leak via missing/weak scope check | Elevation of Privilege | `festivalId`/`visitorId`-scoped WHERE clauses on every `my_festival`-touching query, verified by an explicit cross-tenant denial test (SEC-02) — "gate-less" (no ticket) must never be conflated with "scope-less" (Pitfall 4) |
| Stray `@AllowAnonymous()` left on a sensitive route during debugging | Elevation of Privilege | Endpoint × auth-annotation table reviewed at phase end (SEC-01 deliverable); PR-review checklist item for any new `@AllowAnonymous()` usage |
| OTP brute-force guessing | Tampering | `allowedAttempts: 3` — atomic budget consumed per verify attempt, record permanently deleted after exhaustion (confirmed via source in this research) |

## Sources

### Primary (HIGH confidence)
- `/thallesp/nestjs-better-auth` (Context7) — `AuthModule.forRoot()` API reference, body-parser re-application, global-prefix auto-exclusion, `@Session()`/`@AllowAnonymous()`/`@OptionalAuth()` decorators, version/peer-dependency MANIFEST — fetched 2026-08-01
- `/better-auth/better-auth/v1.6.23` (Context7, version-pinned to match `packages/db`'s `1.6.25`) — `emailOTP` plugin options/defaults, `resendStrategy`, session `expiresIn`/`updateAge`, `sendVerificationOTP` fire-and-forget guidance, `atomicVerifyOTP`/`allowedAttempts` source excerpt, `invalid_code` error reference, `drizzleAdapter` setup — fetched 2026-08-01
- `npm view better-auth / @thallesp/nestjs-better-auth / resend version` — registry version/publish-date verification, 2026-08-01

### Secondary (MEDIUM confidence)
- [drizzle-team/drizzle-orm Discussion #916](https://github.com/drizzle-team/drizzle-orm/discussions/916) — `DrizzleQueryError`/`.cause` wrapping pattern for postgres.js unique-violation errors; not official docs, verify empirically during implementation
- [GitHub — laakal/nestjs-better-auth-template](https://github.com/laakal/nestjs-better-auth-template) — `setGlobalPrefix({ exclude: [...] })` pattern (superseded in this project by the finding that no `setGlobalPrefix` call exists at all, and the wrapper auto-excludes regardless)
- ts-rest official docs / WebSearch — `@TsRestHandler` compatibility with NestJS guards/interceptors/pipes (confirms SEC-01's global-guard coverage of ts-rest routes)

### Tertiary (LOW confidence)
- None used as load-bearing claims in this document — all critical wiring claims were corroborated via Context7-curated official docs or npm registry.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry, peer-dependency ranges confirmed via official MANIFEST
- Architecture (bodyParser, global-prefix, guard coverage): HIGH — all three confirmed via official README/docs text, not inference
- `23505` error-wrapping specifics: MEDIUM — community-sourced pattern, recommend an early empirical spike test rather than trusting blind
- Pitfalls (OTP error-code non-differentiation, `allowedAttempts` exhaustion): HIGH — confirmed against plugin source excerpts via Context7

**Research date:** 2026-08-01
**Valid until:** ~30 days (2026-08-31) — better-auth and its NestJS wrapper are both actively released (multiple releases/month observed); re-verify version pins if planning is delayed past that window
