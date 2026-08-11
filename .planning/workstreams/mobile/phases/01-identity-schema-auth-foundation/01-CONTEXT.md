# Phase 1: Identity Schema & Auth Foundation - Context

**Gathered:** 2026-07-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend `packages/db` and the shared-package layer so the schema models global
`Account` → `VisitorProfile` identity, `my_festival` save-membership, and
better-auth's OTP tables — plus drizzle-zod base schemas so any DB↔contract
drift becomes a compile error. The identity/membership model is recorded in
writing (plan note / ADR).

**In scope:** Drizzle schema for `visitor_profile` and `my_festival`;
better-auth's core tables (`user`/Account, `session`, `account`, `verification`)
as a CLI-owned/vendored `schema/auth.ts`; `lower(username)` unique index;
drizzle-zod base schemas exported for contracts to compose on; clean migration
against Neon; the identity-model decision written down.

**Out of scope (later phases):** better-auth runtime wiring — the NestJS
handler, `AuthGuard`, OTP send/verify, email delivery provider (Phase 2); any
contract endpoints or ts-rest routes (Phase 2); any mobile/admin UI (Phase 3+);
`birthDate`/`gender`/safety fields (pending Birgit's concept); `FestivalTicket`,
`FestivalStaff`, `PlatformAdmin`, friend-graph tables (post-shell milestones).

</domain>

<decisions>
## Implementation Decisions

> **User directive (2026-07-30):** _"Keine davon jetzt festlegen — nimm für alle
> vier vernünftige Standards und zeig mir das im Plan."_ The four gray areas
> below are captured as **recommended defaults**, each marked
> **`DEFAULT — confirm at plan review`**. The planner MUST surface each in
> PLAN.md for the user to accept or change; they are not user-locked yet.

### D-01: Auth-table provenance (`schema/auth.ts`) — `DEFAULT — confirm at plan review`
Install `better-auth` in Phase 1 and create a **minimal** `auth.ts` config —
Drizzle adapter + `emailOTP` plugin *declared*, only as much as the CLI schema
generator needs — then run `@better-auth/cli generate` to emit `schema/auth.ts`
(`user`/Account, `session`, `account`, `verification`). Commit it as
vendored/CLI-owned, keep better-auth's `text` id convention, and document the
regenerate command in-file. **No runtime auth wiring in Phase 1** (handler,
guards, OTP send/verify, email provider all stay Phase 2).
- **Rationale:** Makes the auth tables authoritative from better-auth (no
  hand-drift vs. the library's real schema) while keeping Phase 1 = schema only,
  honoring the ROADMAP note "schema/auth.ts as CLI-owned/vendored."
- **Fallback (Plan B):** If the CLI needs more runtime than we want to stand up
  in Phase 1, hand-vendor the four tables to better-auth's documented shape and
  reconcile via the CLI in Phase 2.
- **Research flag:** confirm `@better-auth/cli generate` works with only a
  minimal config (no live DB / no HTTP handler) and pin the better-auth version.
- **Reversibility:** costly — `schema/auth.ts` shape is consumed by Phase 2 auth
  wiring and the drizzle-zod base; changing provenance later means regenerating
  and re-reconciling composed contracts.

### D-02: drizzle-zod boundary — `DEFAULT — confirm at plan review`
`packages/db` exports drizzle-zod-derived **base** schemas (insert/select)
next to each table. `packages/contracts` **imports** those base schemas and
composes the API-facing shapes on top (`.pick` / `.omit` / `.extend` / refine).
A DB column rename changes the drizzle-zod base type → the contract composition
fails to typecheck (Success Criterion 3). `contracts` takes a dependency on `db`
(package→package, allowed; only `apps/*` imports into `packages/*` are banned).
- **Rationale:** Keeps `packages/contracts` the API source of truth while making
  the DB the *base* source of truth, so drift is a compile error rather than a
  runtime surprise — the exact intent of SC-3.
- **Research flag:** verify `drizzle-zod` version emits **Zod v3** schemas
  (workspace is pinned to `zod@3.25.76` per ts-rest/ADR-006); a v4-only
  drizzle-zod would break composition. Confirm `contracts → db` build ordering in
  `turbo.json`.
- **Alternative:** keep packages fully decoupled and add a type-level assertion
  test (`expectTypeOf`) that each contract matches the drizzle-inferred row type.
- **Reversibility:** costly — flipping the direction later touches every composed
  contract schema and the package dependency graph.

### D-03: Reserved-field modeling on `visitor_profile` — `DEFAULT — confirm at plan review`
- `avatar` → nullable `text()` (stores URL / storage key; hosting deferred).
- `socialsVisibility` → pg enum column, `notNull().default('friends')`
  (values `everyone` | `friends`, per concept doc 04 §3).
- `socials` → `jsonb('socials')` of `{ platform, handle }[]`, `default('[]')`
  ("beliebig erweiterbar", no query needs in MVP).
- `username` → `notNull()`, `displayName` → `notNull()` (set at first-login
  profile completion in Phase 4; the DB column is NOT NULL, completion is enforced
  at the app layer, not via a nullable→notnull migration later).
- **Rationale:** Satisfies SC-1 literally ("holds reserved socials/
  socialsVisibility") with the cheapest migration-safe shape; jsonb `socials` is
  trivially promotable to a normalized table later.
- **Alternative:** model `socials` as a separate `visitor_social` table (fully
  additive later) and omit the jsonb column now.
- **Explicitly deferred, kept migration-safe open:** `birthDate` / `gender` /
  Flinta fields — NOT added this phase (pending Birgit's safety concept, concept
  doc 04 §9).
- **Reversibility:** reversible — adding a `visitor_social` table or new columns
  later is additive; jsonb→table is a data backfill, not a breaking change.

### D-04: Identity linkage & username uniqueness mechanics — `DEFAULT — confirm at plan review`
- `visitor_profile` PK = `accountId` (`text`, FK → better-auth `user.id`,
  `onDelete: 'cascade'`) — a hard 1:1 with Account (SC-1 "keyed by accountId").
- `my_festival.visitorId` → FK to `visitor_profile.accountId` (encodes the
  invariant "you have a completed profile before you can save a festival").
  Composite PK `(visitorId, festivalId)`; `savedAt` timestamp; `camp text` nullable
  (reserved, no UI this cycle). `festivalId` → `uuid` FK → existing `festival.id`.
- Mixed id types across the global↔tenant boundary are expected: auth/profile ids
  are `text` (better-auth convention); tenant tables (`festival`, `tag`) stay
  `uuid`. `my_festival` therefore mixes `text` visitorId + `uuid` festivalId.
- `lower(username)` case-insensitive uniqueness → Drizzle functional
  `uniqueIndex('visitor_profile_username_lower_unq').on(sql\`lower(username)\`)`.
- `Account` carries **no** `festivalId`; `my_festival` (always queried by
  `visitorId`) is the only global↔tenant link (ADR-014/016).
- **Rationale:** Enforces the Account→VisitorProfile split and the "profile before
  save" gate at the schema level; the functional unique index is the idiomatic
  Drizzle way to emit the raw `UNIQUE INDEX ON lower(username)`.
- **Research flag:** confirm Drizzle emits the functional index in the generated
  migration SQL (some versions need `sql` in the index expression); confirm FK
  from a `uuid`-PK-less profile (PK is the `text` accountId) generates cleanly.
- **Reversibility:** one-way — PK choice and FK targets are baked into the
  migration; changing `my_festival`'s FK target or the profile PK after data
  exists requires a data migration.

### Claude's Discretion
Per the user directive, all four areas above are Claude-proposed defaults for the
planner to present. Beyond them, the planner has discretion on: file/module
layout within `packages/db/src/schema/` (following the existing
`festival.ts`/`tag.ts`/`_shared.ts` conventions), the `schema/index.ts` barrel
wiring, and the migration/verification workflow against a Neon dev branch.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Identity / membership model (authoritative)
- `docs/concept/04-domain-identity.md` — Account→VisitorProfile/FestivalStaff/
  PlatformAdmin model, `VisitorProfile` fields (§3), `MyFestival` gate-less
  join (§5), global-vs-festival scoping table (§8), deliberately-open fields (§9)
- `docs/DEVELOPMENT_DECISIONS.md` — ADR-009 (passwordless email-OTP auth,
  visitors are NOT org-members), ADR-014 (tenant boundary / `festivalId`
  scoping / join = save), ADR-016 (identity model), ADR-012 (locale/translation
  pattern the existing schema follows), ADR-005 (Neon pooling / `prepare:false`)

### Roadmap / requirements
- `.planning/ROADMAP.md` §"Phase 1" — goal, 4 success criteria, Pitfalls 1/6/12
- `.planning/REQUIREMENTS.md` — PLAT-01 (single global Account), and the
  downstream AUTH/IDN/SEC requirements this schema must support
- `.planning/codebase/CONCERNS.md` §"Missing Database Schema for Authentication
  & Global Data" — the exact gap this phase closes

### Existing code this phase extends
- `packages/db/src/schema/_shared.ts` — `idColumn()` (uuid) + `timestamps`
- `packages/db/src/schema/festival.ts` — tenant-root `festival` (uuid PK, target
  of `my_festival.festivalId`)
- `packages/db/src/schema/tag.ts` — the `festivalId` FK + `unique(...)` /
  translation-table pattern to mirror for style/casing
- `packages/db/src/schema/index.ts` — barrel to extend
- `packages/db/drizzle.config.ts` — `snake_case` casing, unpooled URL for
  migrations
- `packages/contracts/src/schemas.ts` — where composed API schemas live today
  (drizzle-zod bases get composed here per D-02)

### External docs to consult during research
- better-auth core schema + `@better-auth/cli generate` docs (for D-01)
- `drizzle-zod` docs + Zod-version compatibility (for D-02)
- Drizzle `uniqueIndex` + functional/`sql` index docs (for D-04)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `_shared.ts` `timestamps` — reuse on `visitor_profile` and `my_festival`
  (`createdAt`/`updatedAt`). Note: `idColumn()` is uuid — NOT used for
  `visitor_profile` (PK is the `text` accountId per D-04) but usable elsewhere.
- `tag.ts` `unique(...)` / `festivalId` FK pattern — the template for
  `my_festival`'s composite key and festival FK with `onDelete: 'cascade'`.
- `localeEnum` in `schema/locale.ts` — the existing pgEnum precedent for the new
  `socialsVisibility` enum (D-03).

### Established Patterns
- `snake_case` DB casing set globally in `drizzle.config.ts`; TS identifiers stay
  camelCase, Drizzle maps them. New columns follow this automatically.
- Named exports + `schema/index.ts` barrel; per-table file (`auth.ts`,
  `visitor-profile.ts`, `my-festival.ts` — match existing `festival.ts`/`tag.ts`).
- Contracts currently hand-write Zod (`schemas.ts`); D-02 introduces
  drizzle-zod-derived bases they compose on — a new but additive pattern.

### Integration Points
- `packages/db` is consumed by `apps/api` via the DI'd `DB` client; new tables
  are visible to services once exported from the barrel (Phase 2 uses them).
- `packages/contracts` will newly `import` from `packages/db` (D-02) — first
  time this edge exists; check `turbo.json` build ordering.
- Neon migration: `drizzle-kit` uses `DATABASE_URL_UNPOOLED`; verifying "migrates
  cleanly against Neon" needs a dev branch / unpooled URL available at plan time.

</code_context>

<specifics>
## Specific Ideas

- The identity-model decision (Account→VisitorProfile as a **separate** table;
  visitors as gate-less `my_festival` saves; explicitly NOT better-auth's
  `organization` plugin and NOT its `username` plugin) must be **written down**
  as a plan note / ADR (Success Criterion 4). This is a required deliverable of
  the phase, not just an implementation choice.
- Treat `schema/auth.ts` as vendored/generated — document that it is CLI-owned
  and how to regenerate it, so no one hand-edits it and drifts from better-auth.

</specifics>

<deferred>
## Deferred Ideas

- **better-auth runtime wiring** (NestJS instance, `/api/auth/*` handler,
  `AuthGuard`, OTP send/verify, email provider, `bodyParser:false`) → Phase 2.
- **Contract endpoints / ts-rest routes** (me, complete-profile,
  username-availability, festivals browse/save) → Phase 2.
- **`FestivalStaff` / `PlatformAdmin` / better-auth organization plugin** →
  admin milestone (post-shell).
- **Friend-graph tables** ("who's here" = friends ∩ saved festival) → post-shell;
  keep the model additive so it can be added without migrating identity tables.
- **`FestivalTicket`** (display-only QR) and **`MyFestival.camp` UI** → v2;
  `camp` column may be reserved now (D-04) but no UI this cycle.
- **`birthDate` / `gender` / Flinta / safety disclaimer** → pending Birgit's
  concept; kept migration-safe open, not added now.
- **`socials` normalization** to a `visitor_social` table → future (jsonb now per
  D-03 is trivially promotable).

</deferred>

---

*Phase: 1-identity-schema-auth-foundation*
*Context gathered: 2026-07-30*
