---
phase: 05
slug: festival-selection-home
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-09
---

# Phase 05 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register authored at plan time across 05-01…05-11 (`register_authored_at_plan_time: true`); verified
> against implementation by gsd-security-auditor on 2026-08-09 (ASVS L1, block_on: high).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| client → API (`/api/v1`) | Authenticated visitor reads festival-scoped browse + caller-scoped `listMyFestivals` | Public festival identity (name/dates/place); caller's saved-festival set |
| API → Neon Postgres | Scoped queries (`festivalId`/`visitorId`) read D-08 master-data columns | Tenant-scoped festival rows |
| device-local MMKV → cold-start / deep-link navigation | Persisted active-festival slug drives the launch/redirect target | Non-secret festival slug |
| external deep link → app navigation | OS-delivered URL captured pre-auth, replayed post-auth | Route path (custom scheme only) |
| route guard (`Stack.Protected`) | Authenticated four-state guard gates which route groups mount | Auth/profile session state |
| npm registry → apps/mobile build | New dependency `expo-blur` enters the bundle | Third-party package code |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-05-01 | Information Disclosure | `/me/festivals` + `listMyFestivals` + Home/Meine rendering D-08 fields | high | mitigate | `festival-isolation.spec.ts:153-177` cross-tenant assertion (SEC-02); `me.service.ts:77-82` visitorId scope | closed |
| T-05-SC | Tampering (supply-chain) | `expo-blur` npm install | high | mitigate | `package.json:31` pin `~57.0.2`, `pnpm-lock.yaml:150` → 57.0.2; RESEARCH legitimacy audit (official Expo pkg) | closed |
| T-05-09 | Elevation of Privilege | `(tabs)` route-guard swap | high | mitigate | `_layout.tsx:305-313` group registered only inside `authenticated` `Stack.Protected` (four-state guard) | closed |
| T-05-14 | Information Disclosure | full-phase acceptance run | high | mitigate | Constituent mitigations verified (T-05-09 + T-05-01); global AuthGuard `festival.controller.ts:31-33` (SEC-01) | closed |
| T-05-10-E | Elevation of Privilege / content leak | deep-link capture→replay | high | mitigate | `_layout.tsx:263-266` replay gated on `authenticated`; capture drops `AUTH_FLOW_PATHS` at `:152` | closed |
| T-05-04 | Tampering (input validation, ASVS V5) | new `startDate`/`endDate`/`place` fields | medium | mitigate | `schemas.ts:19-29` composed on drizzle-zod `createSelectSchema().extend()` base (`db/schema/festival.ts:49`) | closed |
| T-05-10-T | Tampering | crafted deep-link path | medium | mitigate | `deep-link.ts:44-51` hostname rejoined only for own scheme; unknown route → Unmatched Route; tests `:24-29`/`:53-58` | closed |
| T-05-11 | Information Disclosure | saved-state composition | medium | mitigate | Client-side `listMyFestivals` ∩ browse; no server-side saved flag (`festival.service.ts:95-123`) | closed |
| T-05-06 | Denial of Service | `getFestival` 404 / hung request | low | mitigate | `festival.controller.ts:16-17` 404 pattern + `_layout.tsx:215-222` 8s resolve backstop | closed |
| T-05-08 | Tampering | Save affordance press bubbling into enter | low | mitigate | Non-overlapping sibling `Pressable`s; `saving` disables repeat Save | closed |
| T-05-10 | Spoofing | disabled Friends/Profil tabs | low | mitigate | Disabled tabs have no nav target, no-op press, a11y disabled | closed |
| T-05-12 | Tampering | optimistic save cache | low | mitigate | `onSettled` invalidates `['me','festivals']`; idempotent `save()` `onConflictDoNothing()` (`festival.service.ts:143`) | closed |
| T-05-09-I | Information Disclosure | cold-start active-festival restore | low | mitigate | `active-festival-storage.ts:104-112` persists slug only for SAVED festivals | closed |
| T-05-02 | Information Disclosure / Tampering | `GET /festivals/:slug` public read + persisted MMKV slug | low | accept | Public-per-authenticated-visitor (ADR-014); slug only builds `getFestival(slug)`, no privilege gain | closed |
| T-05-05 | Information Disclosure | new visual tokens | low | accept | Static presentation values; no data/secrets encoded | closed |
| T-05-03 | Information Disclosure | Cashless coming-soon tile | low | accept | Static/disabled this phase; no `cashlessUrl` render (ADR-011 forward constraint) | closed |
| T-05-07 | Information Disclosure | FestivalCard rendering festival fields | low | accept | Renders only already-scoped public identity passed as props | closed |
| T-05-13 | Tampering | hero selection by `startDate` | low | accept | Pure client-side presentation over already-scoped data | closed |
| T-05-15 | Elevation of Privilege | integrated route tree (05-08) | low | accept | Verification-only plan; adds no routes/code | closed |
| T-05-09-R | Repudiation / consistency | segment-request singleton | low | accept | In-memory, consume-once, non-persisted; cannot survive cold restart | closed |
| T-05-10-S | Spoofing | https deep-link hostname | low | accept | https hostname treated as domain, never prepended; no https App Links this phase | closed |
| T-05-11-I | Information Disclosure | persisted active-festival slug (MMKV) | low | accept | Non-secret; fix reduces retention (unsaved no longer persisted); cross-account cleared on logout | closed |
| T-05-11-E | Elevation of Privilege | festival entry | low | accept | Gate-less by design (ADR-014); persist/clear never gates navigation | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-05-01 | T-05-02 | Persisted MMKV slug + public single-festival read grant no privilege beyond the gate-less browse endpoint (ADR-014) | gsd-security-auditor / Emil Auer | 2026-08-09 |
| R-05-02 | T-05-05 | Visual tokens are static presentation values; no data/secrets | gsd-security-auditor / Emil Auer | 2026-08-09 |
| R-05-03 | T-05-03 | Cashless tile fully static/disabled this phase; hide-when-unset (ADR-011) is a forward constraint | gsd-security-auditor / Emil Auer | 2026-08-09 |
| R-05-04 | T-05-07 | FestivalCard renders only already-scoped public props | gsd-security-auditor / Emil Auer | 2026-08-09 |
| R-05-05 | T-05-13 | Hero ordering is pure client-side presentation over scoped data | gsd-security-auditor / Emil Auer | 2026-08-09 |
| R-05-06 | T-05-15 | 05-08 is verification-only; no new routes/code | gsd-security-auditor / Emil Auer | 2026-08-09 |
| R-05-07 | T-05-09-R | Segment-request singleton is in-memory, consume-once, non-persisted | gsd-security-auditor / Emil Auer | 2026-08-09 |
| R-05-08 | T-05-10-S | https deep-link hostname never prepended; no https App Links configured this phase | gsd-security-auditor / Emil Auer | 2026-08-09 |
| R-05-09 | T-05-11-I | Persisted slug is non-secret; retention reduced; cross-account cleared on logout | gsd-security-auditor / Emil Auer | 2026-08-09 |
| R-05-10 | T-05-11-E | Festival entry gate-less by design (ADR-014); persist/clear never gates navigation | gsd-security-auditor / Emil Auer | 2026-08-09 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-09 | 23 | 23 | 0 | gsd-security-auditor (opus, ASVS L1, block_on: high) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-09
