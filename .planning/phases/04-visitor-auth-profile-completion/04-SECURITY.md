---
phase: 04
slug: visitor-auth-profile-completion
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-05
---

# Phase 04 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time across 04-01…04-07 PLAN.md; verified against shipped
> code by gsd-security-auditor (ASVS L1, block_on: high).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → build pipeline | Six new third-party packages enter the mobile/api build (5 in 04-01, `@better-auth/expo` in 04-07) | Package code / build integrity |
| client → auth (OTP send/verify/resend) | Anonymous email + untrusted OTP cross to better-auth | Email, OTP code, session establishment |
| client → API (`/me`, `/me/complete-profile`, `/me/username-availability`) | Session-scoped identity reads/writes | Username, displayName (untrusted strings) |
| SecureStore ↔ app | Session token at rest (Phase 3, unchanged) | Session token (sensitive) |
| device gallery/camera → app | User-selected media `file://` URI enters the app | Local avatar URI (non-sensitive, device-local) |
| MMKV (local) → app | Non-sensitive avatar URI at rest, keyed by accountId | Avatar URI string only — never the session token |
| deep link (OS) → app router | Untrusted external href targeting a protected route | Navigation intent (in-memory only) |
| mobile client → better-auth (sign-out) | Cookie-bearing, state-changing session-revocation (`expo-origin`) | Session cookie, origin trust decision |
| external origin → origin-check middleware | CSRF/origin trust decision on every cookie-bearing call | Origin header (CSRF boundary) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-4-01-SC | Tampering | 5 new npm installs | high | mitigate | Blocking-human legitimacy checkpoint before install; each publisher/repo verified on npmjs.com (`04-01-SUMMARY.md:98`) | closed |
| T-4-01-I | Info Disclosure | react-native-mmkv | low | accept | MMKV stores only `avatar-uri:${accountId}` string, never the session token (`avatar-storage.ts:34-44`) | closed |
| T-4-02-T | Tampering | username/displayName input | medium | mitigate | Server-side Zod `.min(3).max(20).regex(/^[a-z0-9_.]+$/)` + `displayName.min(1).max(40)` (`packages/db/src/schema/visitor-profile.ts:70-77`); proven `username-race.spec.ts:78-138` | closed |
| T-4-02-I | Info Disclosure | username charset | low | accept | Charset restricted to `a-z0-9_.` via regex (`visitor-profile.ts:74`); homograph surface bounded | closed |
| T-4-03-S | Spoofing | OTP send/verify | high | mitigate | Session issued only via better-auth `emailOTP` round-trip; server owns validity/expiry (`auth.instance.ts:52-67`) | closed |
| T-4-03-T | Tampering | username uniqueness (TOCTOU) | high | mitigate | DB `uniqueIndex` on `lower(username)` (`visitor-profile.ts:42`) → PG 23505 → 409 (`me.service.ts:56-57`); advisory availability non-authoritative | closed |
| T-4-03-I | Info Disclosure | session token storage | medium | mitigate | `storage: SecureStore` only (`auth-client.ts:30`); no token in MMKV/AsyncStorage | closed |
| T-4-03-D | DoS | OTP endpoint | medium | accept | better-auth built-in rate limiter (Phase 2); client surfaces 429, no new send surface | closed |
| T-4-04-S | Spoofing | OTP brute force | high | mitigate | Server-side attempt counter + rate limiter authoritative; client surfaces `TOO_MANY_ATTEMPTS`/429 without bypass (`otp-error.ts:39-44`) | closed |
| T-4-04-D | DoS | resend spam | medium | mitigate | 60s cooldown + re-entrancy guard (`ResendCountdown.tsx:41-68,83`); server limiter authoritative | closed |
| T-4-04-I | Info Disclosure | error copy | low | accept | `OTP_EXPIRED`/`INVALID_OTP` converge to unified `'wrong-or-expired'` copy; distinct internal branches kept (`otp-error.ts:33-38`) | closed |
| T-4-05-I | Info Disclosure | MMKV avatar URI | low | mitigate | Keyed strictly by `avatar-uri:${accountId}` — a second account cannot read the first's photo (`avatar-storage.ts:34-44`) | closed |
| T-4-05-T | Tampering | image-picker input | low | accept | Sandboxed `file://` URI stored locally only; `completeProfile` sends `{username, displayName}` — avatar never uploaded (`complete-profile.tsx:184-186`) | closed |
| T-4-05-S | Spoofing | username suggestion | low | mitigate | Suggestion charset-sanitized + length-capped + availability-verified before display with bounded retry (`username-suggestion.ts:21-63`); DB unique index authority | closed |
| T-4-06-I | Info Disclosure | deep-link content leak while logged out | high | mitigate | Guard mounts groups via `Stack.Protected` at group-layout level (`_layout.tsx:214-223`); capture only while `unauthenticated`, never for auth-flow paths | closed |
| T-4-06-E | Elevation of Privilege | deep-link replay bypass | high | mitigate | Consume+replay fires strictly on into-`authenticated` transition (`_layout.tsx:186-190`); unauth/no-profile never replays, cannot bypass guard | closed |
| T-4-06-T | Tampering | pending-destination durability | low | mitigate | `pendingDestination` is a module-level in-memory `let` (`pending-destination.ts:17`); not MMKV/SecureStore, cannot survive cold restart | closed |
| T-4-06-D | DoS | splash deadlock on hung resolve | medium | mitigate | `AUTH_RESOLVE_TIMEOUT_MS = 8000` fallback forces `unauthenticated` → Welcome if guard stuck (`_layout.tsx:34,170-177`) | closed |
| T-4-07-S | Spoofing | origin translation via expo() plugin | medium | mitigate | `expo()` only maps `expo-origin`→`origin`; unchanged `trustedOrigins` allowlist still validates (`auth.instance.ts:28-32,68-76`) | closed |
| T-4-07-E | Elevation of Privilege | session not revoked server-side (defect) | high | mitigate | Server `expo()` plugin routes sign-out to revoke path; headless test asserts subsequent `GET /me` → 401 (`signout-origin.spec.ts:92-104`) | closed |
| T-4-07-I | Info Disclosure | origin-check disabled/loosened | high | accept-with-guard | `advanced.disableOriginCheck: false` explicitly set (`auth.instance.ts:49-51`); negative-control test asserts no-origin sign-out still 403s (`signout-origin.spec.ts:108-125`) | closed |
| T-4-07-SC | Tampering | new npm install (@better-auth/expo) | high | mitigate | Official `@better-auth/expo` pinned `1.6.25`, identical to `better-auth` `1.6.25` (`apps/api/package.json`, `apps/mobile/package.json`); no new/unaudited dep | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-4-01 | T-4-01-I | MMKV holds only the non-sensitive avatar URI string, never the session token (SecureStore remains sole token store). Verified bounded in code. | gsd-security-auditor | 2026-08-05 |
| AR-4-02 | T-4-02-I | Username charset `a-z0-9_.` reduces homograph/impersonation surface; full anti-impersonation is out of scope this phase. | gsd-security-auditor | 2026-08-05 |
| AR-4-03 | T-4-03-D | OTP endpoint DoS is bounded by better-auth's built-in rate limiter (Phase 2); no new send surface added client-side. | gsd-security-auditor | 2026-08-05 |
| AR-4-04 | T-4-04-I | Unified wrong/expired error copy avoids leaking code-wrong-vs-expired to the surface; `mapOtpError` still logs the distinct internal path. | gsd-security-auditor | 2026-08-05 |
| AR-4-05 | T-4-05-T | expo-image-picker returns a sandboxed `file://` URI; device-local display only, no upload/execution surface. | gsd-security-auditor | 2026-08-05 |
| AR-4-06 | T-4-07-I | Origin-check retained (`disableOriginCheck: false`, no wildcard beyond dev `exp://**`); accidental loosening fails the CI negative-control test. | gsd-security-auditor | 2026-08-05 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-05 | 22 | 22 | 0 | gsd-security-auditor (opus, ASVS L1) |

**Auditor note (informational, non-blocking):** `completeProfileBodySchema` also `.pick`s an optional/nullable `avatar` field (`packages/contracts/src/schemas.ts:59-63`), but the mobile client never populates it (`complete-profile.tsx:184-186`), so no `file://` URI ever leaves the device. Defensive-but-unused server surface — not an open threat; may be pruned in a future contracts cleanup.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-05
