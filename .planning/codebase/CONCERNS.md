---
last_mapped_commit: 8f64c0de99ee77e01a818edd005386ede4310b30
last_mapped_at: 2026-08-02T17:17:40Z
---
# Codebase Concerns

**Analysis Date:** 2026-08-02

## Tech Debt

**Drizzle-Zod Version Pinning:**

- Issue: `drizzle-zod` pinned to 0.7.1 (last classic-zod release); 0.8.x imports zod/v4 and breaks workspace Zod v3 pin (ADR-006)
- Files: `packages/contracts/package.json`, `packages/db/package.json`
- Impact: Upgrading drizzle-zod to 0.8.x would break the entire contracts layer until Zod ecosystem upgrades to v4 unified
- Fix approach: Monitor drizzle-zod releases; when ts-rest and other dependencies support Zod v4, upgrade workspace-wide (coordinate with ADR-006 review)

**TypeScript Version Pinning:**

- Issue: TypeScript pinned to 6.0.x; TS 7 requires typescript-eslint v8 support before ecosystem adoption
- Files: `package.json`, `packages/config/tsconfig.base.json`
- Impact: Delayed access to TS 7 features and fixes; typescript-eslint compatibility lag
- Fix approach: Monitor typescript-eslint releases; upgrade to TS 7 when typescript-eslint v8 lands (no action required this milestone)

**Logging Infrastructure Missing:**

- Issue: No structured logging; all output is `console.log()`/`console.error()` scattered through source
- Files: `apps/api/src/main.ts`, `apps/api/src/config/env.ts`, `apps/api/src/auth/email/dev-otp-email-provider.ts`, `apps/api/src/auth/email/resend-otp-email-provider.ts`
- Impact: In production, logs are unstructured; no correlation IDs, request tracking, or log aggregation possible; debugging cross-service issues (mobile ↔ API ↔ DB) difficult
- Fix approach: Introduce pino or bunyan for structured logging before Phase 3 mobile work; add request-ID middleware; centralize log configuration in `apps/api/src/config/`

**Manual Drizzle-Zod Derivation:**

- Issue: Service/contract types manually re-inferred from schemas rather than imported and extended
- Files: `packages/contracts/src/schemas.ts`, `apps/api/src/**/*.service.ts`
- Impact: Schema changes (adding/removing columns, changing nullability) require manual updates to both; drift risk grows as feature tables (timetable, news, marketplace) are added
- Fix approach: Already mitigated by drizzle-zod 0.7.1 adoption (Phase 1); maintain discipline of always using `z.infer<typeof schema>` and `.pick()/.omit()/.extend()` pattern, never hand-written Zod shapes

## Known Bugs

**OTP Rate-Limiting May Fail at Festival Scale (Pitfall 8):**

- Symptoms: At festival gate opening (thousands of visitors on shared Wi-Fi), legitimate sign-in attempts rejected with "too many requests" despite each individual being under the limit
- Files: `apps/api/src/auth/auth.instance.ts` (line 32-38: `emailOTP` plugin config)
- Trigger: 3+ OTP requests from different visitors behind the same IP/NAT gateway within 60-second window
- Workaround: None (rate limiter is a hard block); users must wait 60 seconds to retry
- Root cause: better-auth's default rate limit (3 requests/60s per IP) tuned for generic web apps, not festival-scale concurrent sign-in
- Fix approach (post-MVP): Load-test with simulated shared-IP burst; consider supplementary per-email rate limit or IP-range exceptions for festival venues

**Username Availability Check Is Advisory, Not a Lock (Pitfall 11):**

- Symptoms: Two users typing the same username can both see "available" and both attempt profile completion; one succeeds, one gets 409
- Files: `apps/api/src/me/me.service.ts` (line 80+: `completeProfile` catches 23505 FK violation)
- Trigger: User A checks availability, backgrounds app for >1 second, another user B claims same username, user A foregrounds and submits
- Current state: MITIGATED by Postgres `UNIQUE INDEX ON lower(username)` (migration 0001, line 67) and 23505→409 mapping
- Risk: App must reliably surface the 409 error to user and route back to username field; if error handling is weak, UX confuses user
- Fix approach: Write explicit "concurrent completeProfile with same username" integration test to verify 23505 catch + 409 return; document UX behavior

## Security Considerations

**OTP Delivery Fire-and-Forget Pattern (D-01):**

- Risk: OTP send endpoint never awaits email delivery; user doesn't know if code was sent or if email failed
- Files: `apps/api/src/auth/auth.instance.ts` (line 44: `void otpEmailProvider.send(...)`)
- Current state: Intentional (prevents timing-attack account-existence disclosure per OTP best practices)
- Mitigation: Documented in comment; OTP request endpoint always returns 200 to both existing and new emails
- Recommendation: Phase 3+ must surface auth errors clearly to user (expired code, wrong code, delivery failed) without changing the 200 response; mobile UI handles retry/resend affordances

**BETTER_AUTH_SECRET Must Be Random and Strong:**

- Risk: Secret rotation not documented; compromise of the secret invalidates all sessions
- Files: `apps/api/src/config/env.ts` (line 8: required Zod schema)
- Current state: Required at bootstrap (fail-fast if missing); no rotation policy documented
- Mitigation: Secret is environment-only (never in code or .env)
- Recommendation: Before production, document secret rotation procedure (Railway redeploy, no zero-downtime option for secret changes)

**Cashless URL Not Validated (Concept open item):**

- Risk: `festival.cashlessUrl` stored as-is without validation; malicious/typo'd URL could expose user to phishing or MitM
- Files: `packages/db/src/schema/festival.ts` (line: `cashlessUrl` field)
- Current state: Documented in STATE.md as pending Birgit's concept review
- Impact: Low for MVP (feature not yet used); must be addressed before cashless sandbox launch
- Recommendation: Add Zod `.url()` validation in contract; whitelist domain pattern per festival (e.g. only `https://*.festipal-cashless.de` or festival-specific domain)

**Better-Auth CSRF Check Requires Origin Header:**

- Risk: State-changing `/api/auth/*` POSTs fail silently if client doesn't send Origin header
- Files: `apps/api/src/auth/auth.instance.ts` (better-auth's built-in CSRF guard via Origin header)
- Current state: Real clients (browser, Expo) send Origin naturally; tested in Phase 2 smoke tests
- Mitigation: Smoke test explicitly verifies Origin header presence (apps/api/test/bodyparser-smoke.spec.ts)
- Recommendation: Document CORS/Origin expectations in a deployment guide (currently missing)

## Performance Bottlenecks

**Festival List Endpoint Has No Pagination:**

- Problem: `FestivalService.listAll()` returns all seeded festivals in one response with no limit
- Files: `apps/api/src/festival/festival.service.ts` (line 92-117: `listAll()`)
- Cause: MVP scope (Phase 2 seed data is ~10 festivals); scaling not yet addressed
- Scaling limit: Once festivals > 100-1000, response size and latency degrade
- Improvement path: Add `page`/`size` query params to `GET /api/v1/festivals`; implement cursor pagination if needed; profile response time under production load before exceeding 50 festivals

**N+1 Query Pattern in Festival Locale Resolution:**

- Problem: `listAll()` queries `festival` table, then queries `festival_locale` for every festival separately (loop at line 97-100)
- Files: `apps/api/src/festival/festival.service.ts` (line 92-117)
- Cause: Drizzle doesn't support bulk-load subqueries in the same way; locales are queried in a second fetch
- Scaling impact: 10 festivals = 2 queries; 100 festivals = 2 queries (batch load mitigates), but every additional locale lookup doubles round-trips
- Improvement path: Use Drizzle's `.leftJoin()` pattern (as done in `listTags`, line 65-66) to fetch festival+locales in one query; profile under production load

**Translation Lookup Locality:**

- Problem: `listTags()` resolves translations per-request by loading all tag rows + translations, then filtering in-app
- Files: `apps/api/src/festival/festival.service.ts` (line 49-84: `listTags()`)
- Cause: No caching; every request re-queries translation tables
- Scaling impact: Acceptable for MVP; becomes latency bottleneck once festivals have 100+ tags or high request frequency
- Improvement path: Cache resolved tags per-festival per-locale in Redis or in-app memory (consider TTL for content-update latency)

## Fragile Areas

**OTP Email Provider Abstraction (MEDIUM):**

- Files: `apps/api/src/auth/email/` (3 provider implementations: dev, resend, potentially more)
- Why fragile: OTP send/resend logic is scattered; new provider requires copying the fire-and-forget pattern + error handling
- Safe modification: Create a `BaseOtpEmailProvider` abstract class with send signature; implement per-provider; use dependency injection in auth.instance.ts
- Test coverage: Existing tests cover dev provider (capture file) + resend (mocked); no tests for error scenarios (network timeout, rate limit from Resend)
- Risk: If Resend API changes or rate-limits, sends fail silently (by design — fire-and-forget) but no monitoring to detect

**Auth Module Initialization Timing (MEDIUM):**

- Files: `apps/api/src/auth/auth.instance.ts`, `apps/api/src/config/env.ts`
- Why fragile: Both `env` and `auth` are module-level singletons created synchronously at import time; if either fails, bootstrap crashes with no graceful fallback
- Safe modification: Keep as-is (fail-fast is appropriate); document the boot sequence in ARCHITECTURE.md; ensure error messages are clear
- Test coverage: Config tests exist (vitest harness loads env.ts); auth.instance.ts is not unit-tested (created at module level), only e2e via integration tests
- Risk: If DATABASE_URL is invalid but code tries to create the DB client, error is caught late

**Visitor Profile Completeness Gate (MEDIUM):**

- Files: `apps/api/src/me/me.service.ts` (line: `completeProfile` + Postgres 23503 catch)
- Why fragile: Profile-required state (accountId exists, visitorProfile doesn't) is a narrow window; improper gate in `save()` or `listTags()` could leak data
- Safe modification: Every festival-scoped endpoint must check `(visitorId, festivalId)` in `my_festival`, not just `visitorId` in `visitor_profile`
- Test coverage: Cross-tenant isolation test exists (festival-isolation.spec.ts); no test for "save gate-lessly without completing profile" regression
- Risk: Future feature (e.g. profile-optional save) could accidentally skip the 23503 catch

**Global Auth Guard with Per-Route Overrides (MEDIUM):**

- Files: `apps/api/src/app.module.ts` (AuthModule registers `APP_GUARD`), every controller (`@AllowAnonymous()` or protected-by-default)
- Why fragile: No compile-time check that new routes are tagged; easy to accidentally leave a route untagged and default-protected, or leave `@AllowAnonymous()` on a route that should be protected
- Safe modification: Maintain an explicit endpoint×auth table in PLAN.md (Phase 2 did this); review at phase end; add ESLint rule to flag `@AllowAnonymous()` for review
- Test coverage: auth-guard.spec.ts covers all 8 endpoints; new endpoints in Phase 3+ must be added to this test
- Risk: Phase 3+ mobile screens land first, OTP/profile endpoints may exist, accidental exposure of profile data for unauthed request

## Scaling Limits

**Neon Connection Pool Saturation:**

- Current capacity: Neon default pgBouncer pool ~25 connections; integration tests use unpooled (DATABASE_URL_UNPOOLED)
- Limit: If production traffic grows to 100+ concurrent requests before connection pooling is optimized, queries may queue
- Scaling path: Monitor Neon connection usage; increase pgBouncer pool size or implement connection pooling middleware in NestJS (e.g., node-postgres pool); profile under 1000 concurrent requests before scaling to production

**better-auth Session Token Storage (Expo):**

- Current capacity: SecureStore on-device encryption + sliding 90-day session
- Limit: If user returns after >90 days, session expires; no offline-first pattern for expired sessions documented
- Scaling path (offline-first, ADR-002): Mobile must implement local session state with auto-login fallback; clarify re-auth flow when offline (can't verify OTP code without API)

**OTP Code Collision Risk:**

- Current capacity: 6-digit OTP (1 million possible codes); 3/60s rate limit per IP
- Limit: If many concurrent sign-in flows exist, probability of code collision grows
- Scaling path: Monitor collision rates in production; if >1 collision event observed, increase OTP length to 7+ digits or add timestamp entropy

## Dependencies at Risk

**@thallesp/nestjs-better-auth (^2.7.0):**

- Risk: Single-maintainer wrapper around better-auth; if maintainer abandons it, security updates lag
- Impact: NestJS integration breaks if better-auth has a security fix but the wrapper isn't updated; no workaround without forking
- Migration plan: Hand-rolled `@All('auth/*path')` catch-all controller exists as Plan C fallback (PITFALLS.md, Pitfall 3 update); consider adopting if wrapper stalls

**better-auth (1.6.25):**

- Risk: v2.0.0 likely has breaking changes; v1.x will eventually stop receiving updates
- Impact: Security fixes in v2 won't backport to v1
- Migration plan: Pin v1 until v2 is stable (>6 months post-release); when migrating, test entire auth flow (OTP, session, profile) manually before production

**Resend (^6.18.1):**

- Risk: OTP delivery depends on Resend API availability; no fallback (dev mode only has console output)
- Impact: If Resend is down, users can't sign in; no alerting for delivery failures
- Migration plan: Implement fallback email provider (e.g., AWS SES) in Phase 3+; add monitoring/alerting for OTP send failures; document incident response

**postgres (^3.4.9):**

- Risk: Direct postgres.js dependency for error code mapping (23505, 23503); if postgres.js changes error shape, catches will fail silently
- Impact: Postgres constraint violations (duplicate username, missing profile) won't be caught; surface as 500 errors instead of 409
- Migration plan: Write integration tests that explicitly trigger 23505/23503 (already exists for 23505 in username-race.spec.ts); monitor for error shape drift

## Missing Critical Features

**Monitoring & Observability:**

- Problem: No structured logging, error tracking, APM, or metrics
- Blocks: Debugging production issues; knowing if OTP delivery is failing; detecting DoS/rate-limit abuse
- Recommendation: Add Sentry (error tracking) + pino (structured logs) + eventual APM (e.g., Datadog or New Relic) before production launch

**Admin Web App (`apps/admin`):**

- Problem: Marked as TBD; no scaffolding exists
- Blocks: Festival organizer workflows (manage timetable, news, tags); cashless integration
- Timeline: Planned for Phase 4+, but no detailed plan yet; likely requires separate better-auth identity model (FestivalStaff + PlatformAdmin roles, ADR-016)

**Mobile App UI/Navigation (`apps/mobile`):**

- Problem: Planned for Phase 3; no code exists yet
- Blocks: All visitor-facing screens (auth, profile, festival list, home, marketplace, friends)
- Risk: Expo Router auth guard (Pitfall 5) and i18n linting (Pitfall 7) are complex; easy to introduce flashes/hardcoded strings early
- Mitigation: PITFALLS.md documents 6 mobile-specific pitfalls; Phase 3 plan must address each

**Load Testing:**

- Problem: No load tests for concurrent OTP requests, concurrent festival saves, or cross-tenant isolation under load
- Blocks: Confidence in rate-limiting behavior at festival scale (Pitfall 8); detecting N+1 query regressions early
- Recommendation: Add Playwright + k6/Locust load tests before Phase 2 completion; simulate 1000 concurrent sign-in attempts behind shared IP

**CI/CD Pipeline:**

- Problem: GitHub Actions workflows not yet scaffolded (mentioned as TBD in CLAUDE.md)
- Blocks: Automated lint/typecheck/test on PR; deployment to staging/production
- Recommendation: Add `.github/workflows/` with lint → typecheck → test gate before Phase 2 production deployment

## Test Coverage Gaps

**Mobile App (All Phases 3-6):**

- What's not tested: Expo Router navigation, auth persistence across app restart, i18n extraction linting, deep-link handling
- Files: None yet (apps/mobile doesn't exist)
- Risk: High (first UI code written during Phase 3; easy to introduce Pitfall 5/7 regressions)
- Priority: HIGH — add E2E tests (Maestro/Detox) for login → profile → festival-select flow before Phase 4 completion

**OTP Email Provider Error Scenarios:**

- What's not tested: Resend API timeout, network error during send, malformed email
- Files: `apps/api/src/auth/email/resend-otp-email-provider.ts`
- Risk: Errors are caught silently (fire-and-forget); no visibility into delivery failures
- Priority: MEDIUM — add integration test that simulates Resend timeout; verify error is logged (once logging infrastructure exists)

**Cross-Tenant Denial Under Load:**

- What's not tested: Many concurrent `listTags` requests for different festivals; verify isolation at high throughput
- Files: `apps/api/src/festival/festival.service.ts`, `apps/api/src/festival/festival.controller.ts`
- Risk: Under load, query optimization or connection saturation could cause queries to bleed across tenants
- Priority: MEDIUM — add load test with k6 simulating 100 concurrent requests to different festivals; verify no data leakage

**Admin App Auth (Phase 4+):**

- What's not tested: FestivalStaff + PlatformAdmin role gating; no test fixtures for different user types
- Files: None yet (apps/admin doesn't exist)
- Risk: Role-based access control is easy to get wrong; incomplete coverage here leads to undetected privilege escalation
- Priority: HIGH — must have comprehensive role-based test suite before admin app goes live

**Drizzle-Zod Type Inference:**

- What's not tested: Schema changes (adding/removing columns) surface as compile errors in contracts
- Files: `packages/contracts/src/schemas.ts`, `packages/db/src/schema/`
- Risk: Manual schema drift undetected until runtime
- Priority: LOW — already mitigated by drizzle-zod adoption; maintain discipline

---

*Concerns audit: 2026-08-02*
