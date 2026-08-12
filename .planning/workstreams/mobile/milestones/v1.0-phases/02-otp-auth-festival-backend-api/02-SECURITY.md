---
phase: 2
slug: otp-auth-festival-backend-api
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-02
---

# Phase 2 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| repo → environment | Secrets (BETTER_AUTH_SECRET, RESEND_API_KEY) live only in env, never in committed files | Auth/API secrets (high) |
| contract → clients | Published Zod response shapes are a hard-to-reverse contract for Phase 3+ clients | API shapes (low) |
| client → /api/auth/* | Untrusted OTP request/verify input; better-auth self-manages rate-limits and atomic consume | Email, OTP codes (high) |
| client → /api/v1/* | Protected-by-default: every endpoint rejects unauthenticated access (401) unless tagged | Session cookie (high) |
| API → email provider | Fire-and-forget send; provider outcome never gates the HTTP response | Email + OTP (high) |
| client → POST /me/complete-profile | Untrusted username; DB unique index is the authority, not the advisory check | Username (medium) |
| session → my-festivals read/write | Scope derived only from session.user.id, never client input | Per-visitor saves (medium) |
| session (profile:null) → POST /festivals/:id/save | Pre-profile-completion caller crosses into a my_festival write whose FK target does not exist | Save intent (low) |
| seed script → DB | Out-of-request-cycle write using the unpooled URL; idempotent, no secrets | Seed data (low) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Information Disclosure | .env.example / committed config | high | mitigate | `apps/api/.env.example` contains only empty placeholders (`BETTER_AUTH_SECRET=`, `RESEND_API_KEY=`) and a dummy DB URL; `apps/api/src/config/env.ts:8` requires `BETTER_AUTH_SECRET` via Zod `z.string().min(1)` | closed |
| T-02-02 | Tampering | contract shape drift | medium | mitigate | Schemas composed on drizzle-zod bases (`packages/contracts/src/schemas.ts`); a DB column rename is a compile error, not silent drift | closed |
| T-02-SC | Tampering | npm installs (better-auth, wrapper, resend) | high | mitigate | Package Legitimacy Audit documented in `02-RESEARCH.md` ("Package Legitimacy Audit" table): all three approved, no postinstall, official repos | closed |
| T-02-03 | Elevation of Privilege | global AuthGuard tagging | high | mitigate | Only `health.controller.ts:10` carries `@AllowAnonymous()`; `/me` and festival routes inherit the global guard; `test/auth-guard-tracer.spec.ts` asserts 401 unauthenticated | closed |
| T-02-04 | Information Disclosure | OTP-send response timing | high | mitigate | `auth.instance.ts:44` — `void otpEmailProvider.send(...)` fire-and-forget; always-success response by construction | closed |
| T-02-05 | Spoofing / Denial of Service | bodyParser:false wiring | medium | mitigate | `main.ts` sets `bodyParser: false`; `auth/auth.module.ts:19` re-applies JSON/urlencoded for non-auth routes; `test/bodyparser-smoke.spec.ts` proves both POST halves parse | closed |
| T-02-06 | Elevation of Privilege | session model | high | mitigate | `auth.instance.ts:28-29` — better-auth sliding session (`expiresIn: 90d`, `updateAge: 24h`), httpOnly signed cookie default, no custom refresh grant | closed |
| T-02-07 | Tampering | username-availability TOCTOU | high | mitigate | `visitor-profile.ts:42` — `lower(username)` unique index is authoritative; `me.service.ts:56` catches Postgres 23505 → 409; `test/username-race.spec.ts` proves it | closed |
| T-02-08 | Elevation of Privilege / Information Disclosure | listMyFestivals scope | high | mitigate | `me.service.ts:82` — `WHERE eq(myFestival.visitorId, visitorId)` with session-derived id only (SEC-02); `test/me-endpoints.spec.ts` asserts caller-only rows | closed |
| T-02-09 | Information Disclosure | completeProfile error surface | low | mitigate | 23505 conflict returns a clean 409 message (`me.service.ts:56`), never a raw DB error / stack | closed |
| T-02-10 | Elevation of Privilege | gate-less save mis-scoped | high | mitigate | `festival.controller.ts:47` — save keyed by `session.user.id`, no client-supplied visitorId; browse and my-festivals are two distinct contracts | closed |
| T-02-11 | Tampering | duplicate save rows | medium | mitigate | `festival.service.ts:137` — `onConflictDoNothing()` on (visitorId, festivalId) composite PK; `test/save-idempotency.spec.ts` proves one row after repeat saves | closed |
| T-02-12 | Denial of Service | save of unknown festival | low | mitigate | `festival.service.ts:129-134` — existence check returns clean 404 (`festival.controller.ts:49`), no orphan my_festival row | closed |
| T-02-13a | Elevation of Privilege | stray @AllowAnonymous / untagged route (Plan 05) | high | mitigate | `test/auth-guard.spec.ts` asserts 401 on all six protected endpoints; annotation table reviewed at phase end (SEC-01) | closed |
| T-02-14a | Information Disclosure | cross-tenant my_festival leak (Plan 05) | high | mitigate | `test/festival-isolation.spec.ts` proves caller-scoped reads with self-provisioned A/B fixtures (SEC-02) | closed |
| T-02-15a | Spoofing | unparsed POST bodies after bodyParser:false (Plan 05) | medium | mitigate | `test/bodyparser-smoke.spec.ts` proves both the /api/auth and ts-rest POST halves parse; ts-rest half additionally proven via live dev round-trip (SC-4) | closed |
| T-02-13b | Information Disclosure | raw 500 from POST /festivals/:id/save on FK violation (Plan 06) | high | mitigate | `festival.service.ts:146` catches Postgres 23503 → clean, contract-documented 409 (`festival.controller.ts:51-53`); `test/save-profile-required.spec.ts` asserts 409, not 500 | closed |
| T-02-14b | Denial of Service | repeated saves in profile:null state hitting uncaught error path (Plan 06) | low | mitigate | Catch branch converts the throw into a deterministic 409 with no row written; no unhandled rejection, no partial state | closed |
| T-02-15b | Tampering | orphan/partial my_festival row on profile:null save (Plan 06) | low | accept | NOT NULL FK rejects the insert atomically (no row written); test asserts zero rows — see Accepted Risks Log AR-02-01 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

*Note: Plans 05 and 06 both assigned IDs T-02-13…15; disambiguated here as `a` (Plan 05) / `b` (Plan 06).*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-15b | A save attempt in the profile:null state cannot leave an orphan/partial my_festival row: the NOT NULL FK rejects the insert atomically before any row is written, and `test/save-profile-required.spec.ts` asserts zero rows. No schema change needed — the constraint is correct as-is. | Plan 02-06 threat model (plan-time disposition) | 2026-08-02 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-02 | 18 | 18 | 0 | /gsd-secure-phase (L1 grep-depth, plan-time register, short-circuit — no auditor spawn required) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-02
