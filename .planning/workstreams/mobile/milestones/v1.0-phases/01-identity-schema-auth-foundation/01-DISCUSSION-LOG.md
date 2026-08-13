# Phase 1: Identity Schema & Auth Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-30
**Phase:** 1-identity-schema-auth-foundation
**Areas discussed:** Auth-table provenance, drizzle-zod boundary, Reserved-field modeling, Identity linkage mechanics (all deferred to plan review by user directive)

---

## Gray-area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Auth-table provenance | CLI-generate `schema/auth.ts` now vs hand-vendor + reconcile in Phase 2 | |
| drizzle-zod boundary | Where derived base Zod schemas live; how contracts compose on them (SC-3) | |
| Reserved-field modeling | socials/socialsVisibility/avatar shape for zero-migration-later | |
| Identity linkage mechanics | VisitorProfile PK, my_festival FK target, lower(username) unique index | |

**User's choice (free text):** _"Keine davon jetzt festlegen — nimm für alle vier
vernünftige Standards und zeig mir das im Plan."_ ("Don't lock any of these now —
take reasonable defaults for all four and show me in the plan.")

**Notes:** User opted out of the per-area question loops. Claude captured a
recommended default for each of the four areas in CONTEXT.md, each marked
`DEFAULT — confirm at plan review`, so the planner surfaces them in PLAN.md for
user acceptance rather than treating them as user-locked.

---

## Defaults recorded (see CONTEXT.md for full rationale + alternatives)

- **D-01 Auth-table provenance:** install better-auth in Phase 1, minimal `auth.ts`
  config, `@better-auth/cli generate` emits vendored `schema/auth.ts`; runtime
  wiring stays Phase 2. Fallback: hand-vendor + reconcile via CLI in Phase 2.
- **D-02 drizzle-zod boundary:** `packages/db` exports drizzle-zod base schemas;
  `packages/contracts` composes on them (rename → compile error). Verify Zod v3
  compatibility. Alternative: decoupled + `expectTypeOf` assertion test.
- **D-03 Reserved fields:** `avatar` nullable text; `socialsVisibility` enum
  default `friends`; `socials` jsonb default `[]`. Alternative: separate
  `visitor_social` table. `birthDate`/`gender` explicitly not added.
- **D-04 Identity linkage:** `visitor_profile` PK = text `accountId` (FK→user.id);
  `my_festival.visitorId` → `visitor_profile.accountId`; functional
  `uniqueIndex` on `lower(username)`; Account carries no `festivalId`.

## Claude's Discretion

- Module/file layout within `packages/db/src/schema/`, barrel wiring, and the
  Neon migration/verification workflow — all delegated to the planner following
  existing `festival.ts`/`tag.ts` conventions.

## Deferred Ideas

- better-auth runtime wiring, contract endpoints, `FestivalStaff`/`PlatformAdmin`,
  friend-graph tables, `FestivalTicket`, `MyFestival.camp` UI,
  `birthDate`/`gender`/safety fields, `socials` normalization to a table — all
  captured in CONTEXT.md `<deferred>`.
