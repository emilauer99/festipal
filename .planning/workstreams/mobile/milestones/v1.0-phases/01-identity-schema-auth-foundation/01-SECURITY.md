---
phase: 01
slug: identity-schema-auth-foundation
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-01
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
>
> Register origin: authored at plan time (all three PLANs carried a `<threat_model>` block).
> ASVS L1 · block_on: high. Every mitigation below was independently re-proven in
> `01-VERIFICATION.md` against the live Neon dev branch (live `pg_indexes`/`pg_constraint`/
> `information_schema` queries, a real `23505` duplicate-insert, re-run typecheck/build), and
> grep-confirmed in source during this audit.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| npm registry → repo | Third-party packages (better-auth, auth CLI, drizzle-zod) enter the build; a hijacked/typosquatted publish crosses here | Build-time dependency code |
| CLI codegen → vendored `schema/auth.ts` | Generated auth-table shape is trusted as authoritative and consumed by every downstream layer | Auth table definitions |
| global identity (`user`/Account) → tenant (festival) data | The schema-level boundary that must stay unbridged except via `my_festival` | Identity ↔ tenant linkage |
| concurrent writers → `visitor_profile.username` | Two requests may race to claim the same (case-variant) username | Username claims |
| `packages/db` → `packages/contracts` | drizzle-zod base schemas cross the package edge; a hand-mirror here would silently drift | API-shape type contracts |
| profile-completion invariant | `my_festival.visitorId` → `visitor_profile.accountId` encodes "must have a profile before saving" at the schema level | Save-membership edge |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-SC | Tampering (supply chain) | npm installs (better-auth, auth, drizzle-zod) | high | mitigate | Blocking-human npm-legitimacy checkpoint before install (01-01); exact versions pinned no-caret — `better-auth 1.6.25`, `auth 1.6.25` (`packages/db/package.json`); `@better-auth/cli` absent | closed |
| T-01-AV | Tampering | Vendored `schema/auth.ts` trusted as auth truth | medium | mitigate | `// GENERATED FILE — DO NOT HAND-EDIT` provenance header + exact regenerate command; better-auth pinned so regen is reproducible | closed |
| T-01-UN | Spoofing | username case-variant duplicate / race | high | mitigate | DB-level `CREATE UNIQUE INDEX ... (lower(username))` (`visitor_profile_username_lower_unq`) — race-proof at the schema layer; **proven live**: case-variant duplicate insert rejected with Postgres `23505` against applied Neon schema (VERIFICATION SC-2 / #12 / #17) | closed |
| T-01-XT | Information Disclosure / Elevation of Privilege | Global Account gaining a festival scope; cross-tenant leakage via an incorrect global↔tenant link | high | mitigate | `user` table carries no `festivalId` (live `information_schema.columns` = 7 cols, none `festival_id`); `my_festival` is the ONLY global↔tenant bridge, always keyed by `visitorId`; recorded as a prohibition (P1) | closed |
| T-01-DR | Tampering | Contract/DB schema drift reopening a validation gap | high | mitigate | `packages/contracts` composes on the drizzle-zod select base via `.pick()` (no hand-mirror); drift proof: a column rename breaks `db build` and cascades to `contracts typecheck` (VERIFICATION SC-3 / #9) | closed |
| T-01-PII | Information Disclosure | `socials`/`socialsVisibility` exposed before a visibility policy exists | medium | mitigate | `visitorProfilePublicSchema.pick({ accountId, username, displayName, avatar })` — reserved fields omitted from the read shape (prohibition P5) | closed |
| T-01-INV | Tampering | `visitorId` re-pointed at `user.id`, bypassing the profile-before-save invariant | medium | mitigate | `my_festival.visitorId` FKs to `visitor_profile.accountId` (NOT `user.id`), `ON DELETE CASCADE`; confirmed in code + live `pg_constraint`; recorded as a prohibition (P6) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

**threats_open: 0** — no OPEN threats at or above the `high` block threshold (all 7 closed with live-verified mitigations).

Note on T-01-XT disposition: 01-02-PLAN listed T-01-XT as *accept* for the `visitor_profile` slice specifically because that slice introduced **no** global↔tenant bridge (the bridge is `my_festival`, added and mitigated in 01-03). The net phase-level disposition is therefore **mitigate/closed** — there is no residual accepted risk, so it is not carried in the Accepted Risks Log.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-01 | 7 | 7 | 0 | Claude (gsd-secure-phase, ASVS L1 short-circuit — plan-time register, threats_open 0) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log (none)
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-01
