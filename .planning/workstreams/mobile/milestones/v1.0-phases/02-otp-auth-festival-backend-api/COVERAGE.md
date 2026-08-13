# API Coverage — better-auth (+ emailOTP plugin) / OTP email provider / Resend

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Phase 2 integrates: `better-auth` core + `emailOTP` plugin via
> `@thallesp/nestjs-better-auth`, an OTP email-provider abstraction (dev transport
> active, Resend adapter wired-but-dormant per D-01).

| capability | decision | reason |
|---|---|---|
| emailOTP `send-verification-otp` (request code) | INTEGRATE | Core sign-in entry; wired in `auth.instance.ts`, exercised by the tracer smoke script |
| emailOTP `sign-in/email-otp` (verify code → session) | INTEGRATE | Core verify path; issues the sliding session |
| Sliding session (`expiresIn` 90d / `updateAge` 1d) | INTEGRATE | D-02; better-auth session config, no refresh grant (Pitfall 10) |
| `drizzleAdapter(db, { provider: 'pg' })` | INTEGRATE | Binds better-auth to Phase 1's vendored `user/session/account/verification` tables |
| Global `AuthGuard` (login-first, SEC-01) | INTEGRATE | `AuthModule.forRoot({ auth })` default global guard |
| `@AllowAnonymous()` / `@Session()` decorators | INTEGRATE | Public tagging (health, auth routes) + session extraction on protected handlers |
| `bodyParser: false` + `AuthModule` body re-application | INTEGRATE | SC-4; re-applies JSON parsing for non-auth ts-rest routes |
| `resendStrategy: "reuse"` | INTEGRATE | Pitfall 9; resend extends the existing code rather than minting a new one |
| OTP email provider abstraction (interface + dev console transport) | INTEGRATE | D-01 active path; makes the code readable for curl/test verification |
| Resend adapter (`resend` SDK) | OPT-OUT | Wired-but-dormant per D-01 — env-gated on `RESEND_API_KEY`; no account/domain/DNS this phase (Phase 3+) |
| emailOTP rate-limit tuning (window/max) | OPT-OUT | Keep better-auth defaults (3/60s per IP) for dev/staging; festival-scale tuning deferred to pre-launch (Pitfall 8, CONTEXT Deferred) |
| better-auth `organization` plugin | OPT-OUT | Visitor membership is gate-less `my_festival`, NOT org/roles/invites (Pitfall 1, ADR-014); org plugin reserved for the admin milestone |
| better-auth `username` plugin | OPT-OUT | Would put `username`/`displayUsername` on the shared `user` table and add an unwanted credential path — breaks the Account/VisitorProfile split (Pitfall 12, ADR-016) |
| Password / credential sign-in | OPT-OUT | Visitors are OTP-only per ADR-009; password is staff/admin-only (out of scope) |
| Social / OAuth providers | OPT-OUT | v2 (AUTH-07); schema kept account-linking-ready but not wired this phase |
| `@better-auth/expo` client plugin / SecureStore | OPT-OUT | Mobile client is Phase 3+; no app consumer exists this phase |
| CORS / `trustedOrigins` for deployed origins | OPT-OUT | Mobile-phase concern (deployed Railway URL); dev-only localhost this phase (CONTEXT Deferred) |

**Net:** every capability the visitor backend needs this phase is INTEGRATE. Every
OPT-OUT is a deliberate deferral or an anti-pattern the pitfalls research forbids —
none is a silent gap.
