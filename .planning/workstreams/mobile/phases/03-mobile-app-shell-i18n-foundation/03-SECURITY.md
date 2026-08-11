---
phase: 03
slug: mobile-app-shell-i18n-foundation
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-04
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time (all 6 PLANs carried a `<threat_model>` block);
> mitigations verified against the implementation at ASVS L1 (grep-depth), block-on: high.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Expo client → better-auth (`/api/auth/*`) | The app scheme (`festipal://` / `exp://`) is the Origin better-auth's CSRF/origin check validates. | OTP codes, session cookie |
| Expo client → `/api/v1/*` | Every authenticated request carries the SecureStore session cookie; the API's own AuthGuard (Phase 2) is the real boundary. | Session cookie, festival data |
| SecureStore session jar | Encrypted OS-keychain storage of the session cookie map; the only acceptable client store. | Session token |
| Client-side route guard | Root-layout four-state `Stack.Protected` guard — UX/defense-in-depth against deep-link access, not a substitute for server scoping. | Navigation intent |
| Build-time i18n catalog compilation | Lingui catalogs compile into the JS bundle; no runtime fetch, so UI chrome stays offline-capable. | UI strings (non-sensitive) |
| Metro workspace resolution | Metro pulls `@festipal/*` from the pnpm store; a mis-resolution could bundle a stale/duplicate contract. | Typed contract shapes |
| Dev device → local API over LAN (cleartext HTTP) | OTP + session traffic crosses shared Wi-Fi — **dev builds only**. | OTP codes, session cookie |
| Mailpit web UI (:8025) | OTP codes readable by anyone on the LAN during dev testing only. | OTP codes (dev) |
| Release / EAS build config | Must never inherit the dev cleartext allowance. | Build configuration |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Spoofing | `trustedOrigins` | high | mitigate | `apps/api/src/auth/auth.instance.ts:27` — exact `festipal://` + `exp://` / `exp://**` dev schemes whitelisted; no bare `*` wildcard on the prod scheme. | closed |
| T-03-02 | Information Disclosure | Mailpit inbox / cleartext LAN | low | accept | Dev-only infra (D-10); production uses Resend over HTTPS. See Accepted Risks. | closed |
| T-03-03 | Information Disclosure | `.env.example` | high | mitigate | `.env.example:18` placeholder `BETTER_AUTH_SECRET`; secret stays server-side, never in any `EXPO_PUBLIC_*` var; `apps/mobile/.env` is gitignored. | closed |
| T-03-04 | Tampering | Metro pnpm resolution | medium | mitigate | `apps/mobile/metro.config` — explicit `watchFolders` + `resolver.nodeModulesPaths` so `@festipal/*` resolves without a stale/duplicate copy. | closed |
| T-03-05 | Information Disclosure | `EXPO_PUBLIC_API_URL` | low | accept | `EXPO_PUBLIC_*` vars are bundled by design; the LAN URL is non-secret. See Accepted Risks. | closed |
| T-03-06 | Information Disclosure | Session storage | high | mitigate | `apps/mobile/lib/auth-client.ts:30` — `expoClient({ storage: SecureStore })` only; no AsyncStorage/MMKV anywhere in `apps/mobile`. | closed |
| T-03-07 | Elevation of Privilege | Deep-link into protected route | medium | mitigate | `apps/mobile/app/_layout.tsx` — four-state `Stack.Protected` root guard re-evaluates on every navigation incl. deep links; server AuthGuard remains the real boundary. | closed |
| T-03-08 | Spoofing | Cookie forwarding | high | mitigate | `apps/mobile/lib/api-client.ts` — `Cookie: () => authClient.getCookie()` (server-issued only) + `credentials: 'omit'` prevents RN fetch from garbling it. | closed |
| T-03-09 | Spoofing | OTP sign-in | high | mitigate | `apps/mobile/app/(auth)/verify.tsx:50` — real `authClient.signIn.emailOtp` round-trip; `(auth)/index.tsx:9` "no dev bypass"; no mock/skip-auth path found. | closed |
| T-03-10 | Denial of Service | OTP resend / rate-limit | low | mitigate | `apps/mobile/app/(auth)/verify.tsx:36` — `mapOtpError` surfaces localized 429 / `TOO_MANY_ATTEMPTS` state instead of silently retrying; server rate-limits (Phase 2). | closed |
| T-03-11 | Input Validation | email / code fields | low | mitigate | `(auth)/index.tsx:58` + `verify.tsx:84` — `keyboardType`/`autoComplete` UX hints only; authoritative validation stays server-side (Zod contracts). | closed |
| T-03-12 | Elevation of Privilege | Gate-less entry | low | accept | Entry intentionally gate-less (ADR-014); server scopes reads by `festivalId` (SEC-02, Phase 2). See Accepted Risks. | closed |
| T-03-13 | Information Disclosure | `listFestivals` body | low | mitigate | `apps/mobile/app/festivals/index.tsx` — renders only the typed `@festipal/contracts` body via `apiClient.listFestivals()`; discriminated-union status handling, no client reshape/over-fetch. | closed |
| T-03-14 | Information Disclosure | Cleartext LAN HTTP | low | accept | Dev-build-only (D-10); production uses HTTPS; guarded by a dev-only annotation. See Accepted Risks. | closed |
| T-03-15 | Tampering | Release config inheritance | medium | mitigate | `apps/mobile/app.json:43` — `_devOnlyCleartextComment` annotates `usesCleartextTraffic`/`NSAllowsLocalNetworking` as DEV-BUILD-ONLY (Pitfall G); no EAS/release profile configured this phase. | closed |
| T-03-SC (03-01) | Tampering (supply-chain) | npm install `nodemailer` | medium | mitigate | Established high-traffic package; `nodemailer@^9.0.3` pinned in `apps/api/package.json`; version confirmed at install. | closed |
| T-03-SC (03-02) | Tampering (supply-chain) | npm installs (Expo / Lingui / TanStack) | medium | mitigate | All in RESEARCH Package Legitimacy Audit (Approved, official repos); versions confirmed at install. | closed |
| T-03-SC (03-06) | Tampering (supply-chain) | npm install `expo-build-properties` | low | mitigate | Official Expo package; `expo-build-properties@~57.0.8` pinned in `apps/mobile/package.json`; version confirmed at install. | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-02 | Mailpit inbox + cleartext LAN are dev-only infrastructure (D-10); production OTP delivery uses Resend over HTTPS, unchanged. | Emil Auer | 2026-08-04 |
| AR-03-02 | T-03-05 | `EXPO_PUBLIC_API_URL` is bundled into the client by design and holds only a non-secret LAN URL; no secret is placed in any `EXPO_PUBLIC_*` var. | Emil Auer | 2026-08-04 |
| AR-03-03 | T-03-12 | Festival entry is intentionally gate-less (ADR-014); the server still scopes all festival-data reads by `festivalId` (SEC-02, Phase 2). No client access gate, no client-supplied visitorId. | Emil Auer | 2026-08-04 |
| AR-03-04 | T-03-14 | Cleartext LAN HTTP is dev-build-only (D-10); production uses HTTPS. The Android/iOS cleartext allowance is annotated dev-only and no release/EAS profile inherits it this phase. | Emil Auer | 2026-08-04 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-04 | 18 | 18 | 0 | gsd-secure-phase (ASVS L1, grep-depth) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-04
