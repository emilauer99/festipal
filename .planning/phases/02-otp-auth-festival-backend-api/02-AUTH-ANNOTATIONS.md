# Phase 2 — Endpoint x Auth-Annotation Table (SEC-01)

Produced by 02-05-PLAN.md Task 1 — "one deliberate public-vs-protected pass ... reviewed
at phase end". Enumerates every `@TsRestHandler`/`@Controller` method that exists in
`apps/api/src` at the end of Phase 2, plus the better-auth `/api/auth/*` route group,
verified against the actual decorators in source (no drift). Proven by
`apps/api/test/auth-guard.spec.ts`.

**Global default:** every controller inherits the global `AuthGuard`
(`AuthModule.forRoot()`, `apps/api/src/auth/auth.module.ts`) — protected-by-default. A
method is anonymous ONLY if explicitly tagged `@AllowAnonymous()`, or if it belongs to
better-auth's self-managed `/api/auth/*` group (mounted by the wrapper, never routed
through the app's `AuthGuard` at all).

| Method | Path | Controller#method | Annotation | Rationale |
|--------|------|--------------------|------------|-----------|
| GET | `/api/v1/health` | `HealthController#health` | `@AllowAnonymous()` | Liveness probe for orchestrators — must respond with no session (SC-1) |
| * | `/api/auth/*` (e.g. `email-otp/send-verification-otp`, `sign-in/email-otp`) | better-auth self-managed (mounted by `AuthModule.forRoot()`, `@thallesp/nestjs-better-auth`) | anonymous (self-managed, not app `AuthGuard`) | The OTP request/verify flow is how a session is *obtained* — it cannot itself require one; better-auth owns these routes' auth state machine end-to-end and they never hit the app's global `AuthGuard` (SC-2) |
| GET | `/api/v1/me` | `MeController#getMe` | protected-by-default | Returns the caller's own identity (`accountId`/`email`/`profile`) — requires a valid session |
| POST | `/api/v1/me/complete-profile` | `MeController#completeProfile` | protected-by-default | First-login profile completion is tied to `session.user.id` |
| GET | `/api/v1/me/username-availability` | `MeController#usernameAvailability` | protected-by-default | Part of the authenticated profile-completion flow |
| GET | `/api/v1/me/festivals` | `MeController#listMyFestivals` | protected-by-default | SEC-02 caller-scoped read — scope derives from the session, must be authenticated to have a scope at all |
| GET | `/api/v1/festivals/:slug` | `FestivalController#getFestival` | protected-by-default | Festival detail read — no `@AllowAnonymous()` tag in source |
| GET | `/api/v1/festivals/:festivalId/tags` | `FestivalController#listTags` | protected-by-default | Tenant-scoped tag list — no `@AllowAnonymous()` tag in source |
| GET | `/api/v1/festivals` | `FestivalController#listFestivals` | protected-by-default | Browse: session-required but unscoped (SEC-01) — distinct contract from `GET /me/festivals` (Pitfall 4) |
| POST | `/api/v1/festivals/:festivalId/save` | `FestivalController#saveFestival` | protected-by-default | Gate-less save (ADR-014) — the only gate is being logged in; scope (`visitorId`) comes from `@Session()`, never a client-supplied param |

## Verification

- Every row above corresponds 1:1 to a `@TsRestHandler(...)` method found via
  `grep -rn "@Controller|@TsRestHandler|@AllowAnonymous" apps/api/src` — no method is
  omitted, none is listed as both anonymous and protected (checked 2026-08-02).
- `apps/api/test/auth-guard.spec.ts` exercises 401-without-session for all eight
  protected `/api/v1` rows and 200-without-session for both anonymous rows.
- The only `@AllowAnonymous()` decorator in the codebase is on
  `HealthController#health` (`apps/api/src/health/health.controller.ts`); the
  `/api/auth/*` group is anonymous by construction (mounted outside the app's guard
  chain), not by a decorator on an app controller.
