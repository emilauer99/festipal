# Phase 1: Identity Schema & Auth Foundation - Research

**Researched:** 2026-07-30
**Domain:** Drizzle ORM schema design (Postgres/Neon), better-auth core schema provenance, drizzle-zod contract-derivation, multi-tenant identity modeling
**Confidence:** MEDIUM-HIGH (better-auth/drizzle mechanics verified against Context7-curated official docs + live npm registry checks; identity-model rationale corroborated by the project's own PITFALLS.md/ADR log, which is HIGH confidence internal source)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None locked yet — per explicit user directive ("Keine davon jetzt festlegen — nimm für alle vier vernünftige Standards und zeig mir das im Plan"), all four decision areas below are **recommended defaults** the planner MUST surface in PLAN.md for accept/change, not pre-locked choices.

**D-01: Auth-table provenance (`schema/auth.ts`) — `DEFAULT — confirm at plan review`**
Install `better-auth` in Phase 1 and create a minimal `auth.ts` config — Drizzle adapter + `emailOTP` plugin *declared*, only as much as the CLI schema generator needs — then run `@better-auth/cli generate` (see Sources correction below: use the `auth` CLI package, not the stale `@better-auth/cli`) to emit `schema/auth.ts` (`user`/Account, `session`, `account`, `verification`). Commit it as vendored/CLI-owned, keep better-auth's `text` id convention, and document the regenerate command in-file. No runtime auth wiring in Phase 1.
- Research flag: confirm `generate` works with only a minimal config (no live DB / no HTTP handler) and pin the better-auth version. **RESOLVED — see Finding 1.**
- Reversibility: costly — `schema/auth.ts` shape is consumed by Phase 2 auth wiring and the drizzle-zod base.

**D-02: drizzle-zod boundary — `DEFAULT — confirm at plan review`**
`packages/db` exports drizzle-zod-derived base schemas (insert/select) next to each table. `packages/contracts` imports those base schemas and composes API-facing shapes on top. `contracts` takes a dependency on `db` (package→package, allowed).
- Research flag: verify `drizzle-zod` emits Zod v3 schemas (workspace pinned to `zod@3.25.76`); confirm `contracts → db` build ordering in `turbo.json`. **RESOLVED — see Finding 2 and Finding 6.**

**D-03: Reserved-field modeling on `visitor_profile` — `DEFAULT — confirm at plan review`**
`avatar` → nullable `text()`. `socialsVisibility` → pg enum, `notNull().default('friends')` (`everyone`|`friends`). `socials` → `jsonb('socials')` of `{platform,handle}[]`, `default('[]')`. `username`/`displayName` → `notNull()` (app-layer enforces completion at first login, not a later migration).

**D-04: Identity linkage & username uniqueness mechanics — `DEFAULT — confirm at plan review`**
`visitor_profile` PK = `accountId` (text, FK → `user.id`, `onDelete: 'cascade'`). `my_festival.visitorId` → FK to `visitor_profile.accountId`; composite PK `(visitorId, festivalId)`; `savedAt` timestamp; `camp` nullable text. `festivalId` → uuid FK → `festival.id`. Mixed id types (text visitorId + uuid festivalId) expected. `lower(username)` uniqueness via Drizzle functional `uniqueIndex`. `Account` carries no `festivalId`.
- Research flag: confirm Drizzle emits the functional index in generated migration SQL; confirm FK from a uuid-PK-less profile (PK is text accountId) generates cleanly. **RESOLVED — see Finding 4.**

### Claude's Discretion
File/module layout within `packages/db/src/schema/` (following existing `festival.ts`/`tag.ts`/`_shared.ts` conventions); the `schema/index.ts` barrel wiring; the migration/verification workflow against a Neon dev branch.

### Deferred Ideas (OUT OF SCOPE)
better-auth runtime wiring (NestJS handler, `AuthGuard`, OTP send/verify, email provider) → Phase 2. Contract endpoints/ts-rest routes → Phase 2. `FestivalStaff`/`PlatformAdmin`/better-auth `organization` plugin → admin milestone (post-shell). Friend-graph tables → post-shell. `FestivalTicket` and `MyFestival.camp` UI → v2. `birthDate`/`gender`/Flinta/safety fields → pending Birgit's concept, kept migration-safe open. `socials` normalization to a `visitor_social` table → future.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAT-01 | A single global `Account` underpins identity (`Account` → `VisitorProfile`); app users are global and NOT festival org-members | Findings 1, 3, 5, 7 confirm the exact better-auth core schema shape to vendor, why the `organization`/`username` plugins are the wrong fit, and the FK/index mechanics for `visitor_profile`/`my_festival` that implement PLAT-01 at the schema level |

</phase_requirements>

## Project Constraints (from CLAUDE.md)

- TypeScript strict mode, pinned **TS 6.0.x** — no untyped `any` at API boundaries (`.claude/CLAUDE.md`).
- **Zod pinned to v3** (`3.25.76`) — ts-rest/ADR-006 constraint. Any drizzle-zod version must emit v3-compatible schemas. **Confirmed compatible (Finding 2).**
- `packages/*` may not import from `apps/*`; `packages/contracts` importing `packages/db` (package→package) is explicitly allowed by this phase's decisions (D-02) and does not violate the constraint.
- Multi-tenancy from day 1 — every tenant-scoped table/query is festival-scoped; global `Account` carries no `festivalId` (ADR-014).
- Drizzle ORM 0.45.2 + `postgres` 3.4.9 pooled client, `casing: 'snake_case'` set globally in `drizzle.config.ts` and `client.ts` — new tables must follow camelCase-in-TS / snake_case-in-DB automatically (already handled by the `casing` option, no manual snake_case column names needed).
- Neon behind pgBouncer: app runtime uses pooled URL with `prepare: false`; migrations use `DATABASE_URL_UNPOOLED` (already wired in `drizzle.config.ts`).
- No secrets in repo — better-auth requires a `BETTER_AUTH_SECRET`; even though no runtime wiring happens this phase, if the minimal `auth.ts` config needs a secret value to run `generate`, it must come from `.env`/`.env.example`, never hardcoded.
- Git: trunk-based, Conventional Commits, no direct commits to `main`.

## Summary

This phase is pure schema/shared-package work: no runtime auth, no endpoints, no UI. Three concrete artifacts land in `packages/db`: (1) better-auth's four core tables (`user`, `session`, `account`, `verification`) generated by the official CLI and vendored as-is, (2) a hand-written `visitor_profile` table 1:1 with `user` via a text `accountId` FK, and (3) a hand-written `my_festival` join table. All three get drizzle-zod base schemas that `packages/contracts` will later compose on (Phase 2), closing the exact drift risk PITFALLS.md Pitfall 6 describes.

Every one of the four user-facing "research flags" the CONTEXT.md decisions call out resolved cleanly during research: the better-auth CLI's `generate --adapter drizzle --dialect postgresql` command is documented to work "without requiring a full Better Auth configuration file" (official 1.5 release notes + CLI source), so a minimal, DB-less `auth.ts` is sufficient to produce `schema/auth.ts`; `drizzle-zod@0.8.3`'s peer dependencies (`zod: "^3.25.0 || ^4.0.0"`, `drizzle-orm: ">=0.36.0"`) are directly compatible with the workspace's pinned `zod@3.25.76` and existing `drizzle-orm@0.45.2`; Drizzle's official docs show the exact `uniqueIndex(...).on(sql\`lower(${col})\`)` pattern generating a real `CREATE UNIQUE INDEX ... USING btree (lower(...))` migration statement; and a text-PK table (`visitor_profile`, PK = `accountId`) referencing another text-PK table (`user.id`) is a standard Drizzle FK — no special casing needed, since neither table uses a uuid PK.

One genuine version-hygiene finding: the CLI package actually shipped by the better-auth team today is published to npm as **`auth`** (bin: `better-auth`, `auth`; same repo, `packages/cli`), tracking the core `better-auth` package version in lockstep (both at `1.6.25` at research time). The older `@better-auth/cli` package name still exists on the registry but is stuck at `1.4.21` and should **not** be installed — CONTEXT.md's own wording ("run `@better-auth/cli generate`") should be read as the *concept*, not the literal package name; the plan should install/`npx` the `auth` package.

**Primary recommendation:** Vendor better-auth's core Postgres schema via `npx auth generate --adapter drizzle --dialect postgresql` against a minimal `auth.ts` (no live DB, no HTTP handler); hand-write `visitor_profile` (PK = text `accountId`, FK → `user.id` cascade) and `my_festival` (composite PK, FK → `visitor_profile.accountId` and → `festival.id`) following the existing `tag.ts`/`festival.ts` conventions; derive `drizzle-zod` base schemas for every new table (including the vendored auth ones, selectively) and export them from the `packages/db` barrel for `packages/contracts` to compose on in Phase 2; do not adopt better-auth's `organization` or `username` plugins.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Global identity storage (`user`/Account, `session`, `account`, `verification`) | Database/Storage (`packages/db`) | — | Schema-only phase; better-auth's own tables are pure Postgres tables, no server-side logic wired yet (Phase 2 owns the API tier) |
| VisitorProfile modeling (`username`, `displayName`, `avatar`, `socials`) | Database/Storage (`packages/db`) | API/Backend (Phase 2, read/write) | Schema lives in `packages/db`; the NestJS service layer that reads/writes it is explicitly out of scope this phase |
| Festival save-membership (`my_festival`) | Database/Storage (`packages/db`) | API/Backend (Phase 2 guard) | The join table + its FK/index constraints are the schema-level half of tenant-boundary enforcement; the runtime `TenantGuard` query is Phase 2 |
| Contract/DB drift prevention (`drizzle-zod` base schemas) | Database/Storage (`packages/db`, schema owner) | API/Backend (`packages/contracts`, composition point) | D-02 makes `db` the base-type source of truth; `contracts` composes but does not re-declare |
| Identity-model decision record (ADR/plan note) | Documentation (not a runtime tier) | — | A written deliverable (SC-4), not code — tracked here only for completeness of the phase's scope |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `better-auth` | `1.6.25` [VERIFIED: npm registry] | Self-hosted TS auth; source of the core `user`/`session`/`account`/`verification` schema (ADR-009) | Already the project's chosen auth library; version confirmed current via `npm view better-auth version` |
| `auth` (better-auth's CLI, npm package name `auth`) | `1.6.25` [VERIFIED: npm registry] | `npx auth generate --adapter drizzle --dialect postgresql` emits `schema/auth.ts` | Official CLI, tracks `better-auth` core version in lockstep; confirmed via `npm view auth` (repository field = `better-auth/better-auth`, `packages/cli`) — **use this, not `@better-auth/cli`** |
| `drizzle-zod` | `0.8.3` [VERIFIED: npm registry] | `createInsertSchema`/`createSelectSchema` — derives Zod base schemas from Drizzle tables (D-02, SC-3) | Official Drizzle-team package; peer deps (`zod: "^3.25.0 \|\| ^4.0.0"`, `drizzle-orm: ">=0.36.0"`) confirmed compatible with the pinned workspace versions |
| `drizzle-orm` | `0.45.2` (existing, unchanged) [VERIFIED: npm registry] | Table definitions, `uniqueIndex`, `sql` template for the functional index | Already in `packages/db`; no upgrade needed for this phase's requirements |
| `drizzle-kit` | `0.31.10` (existing, unchanged) [VERIFIED: npm registry] | `generate`/`push`/`migrate` against Neon | Already configured with `casing: 'snake_case'` and `DATABASE_URL_UNPOOLED` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | `3.25.76` (existing, pinned) | Peer dependency for both `@ts-rest/core` and `drizzle-zod` | Already pinned per ADR-006; do not bump to v4 this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `my_festival` join table | better-auth `organization` plugin mapping festivals→orgs | Rejected — plugin brings invite/role/active-org semantics the visitor product doesn't need; reserved for `FestivalStaff`/`PlatformAdmin` in the admin milestone (ADR-018). Corroborated by the project's own PITFALLS.md Pitfall 1/12 (internal, HIGH confidence) |
| Separate `visitor_profile` table | better-auth `username` plugin (adds `username`/`displayUsername` directly to `user`) | Rejected — the plugin's own docs confirm it adds exactly those 2 fields to the *shared* `user` table (Finding 3), which every `FestivalStaff`/`PlatformAdmin` account would also carry (permanently null), violating ADR-016's Account/VisitorProfile split |
| `drizzle-zod` (this phase) | Hand-written Zod schemas kept manually in sync + a type-level `expectTypeOf` assertion test | Viable fallback per CONTEXT.md D-02, but `drizzle-zod` is a small effort now vs. a larger retrofit once more tables land (PITFALLS.md Pitfall 6) — no reason to defer given peer-dep compatibility is confirmed |
| `jsonb('socials')` column | Separate `visitor_social` table | Rejected for now per D-03 (no query needs in MVP); noted as a future-additive migration, not a blocker |

**Installation:**
```bash
# In packages/db
pnpm add better-auth drizzle-zod
pnpm add -D auth   # better-auth's CLI, npm package name "auth" — NOT @better-auth/cli
```

**Version verification:** Confirmed live via `npm view <pkg> version` / `npm view <pkg> peerDependencies` on 2026-07-30 (see Sources). `better-auth@1.6.25`, `auth@1.6.25` (CLI, lockstep with core), `drizzle-zod@0.8.3`, `drizzle-orm@0.45.2` (existing), `drizzle-kit@0.31.10` (existing), `zod@3.25.76` (existing, pinned).

## Package Legitimacy Audit

| Package | Registry | Age (latest publish) | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|----------------------|-----------|--------------|---------|-------------|
| `better-auth` | npm | latest version published 2026-07-23 (7 days before research) | 6,477,312/wk | `github.com/better-auth/better-auth` | **[SUS]** (reason: `too-new`) | Approved — see note below |
| `auth` (better-auth CLI) | npm | latest version published 2026-07-23 | 95,828/wk | `github.com/better-auth/better-auth` (`packages/cli`) | **[SUS]** (reason: `too-new`) | Approved — see note below |
| `drizzle-zod` | npm | published 2025-08-06 | 2,127,913/wk | `github.com/drizzle-team/drizzle-orm` | [OK] | Approved |
| `@better-auth/cli` (legacy name) | npm | published 2026-03-01 | 237,936/wk | `github.com/better-auth/better-auth` | [OK] | **Not recommended** — version-lagging (`1.4.21` vs. core `1.6.25`); use `auth` instead |

**Note on the two `[SUS]` verdicts:** both `better-auth` and `auth` were flagged `too-new` by the legitimacy checker because their *latest published version* landed a few days before this research session — this is an artifact of the package's fast release cadence (better-auth ships frequent patch releases), not evidence of an actually-new or suspicious package. Corroborating signals rule out slopsquatting/hijack risk: (1) both packages resolve to the same long-established `better-auth/better-auth` GitHub repo, (2) `better-auth` has 6.4M weekly downloads and a version history stretching back through 1.x/0.x releases to `0.0.1`, (3) `auth`'s own registry metadata explicitly self-describes as "The CLI for Better Auth" with `bin: better-auth, auth`, matching the documented CLI usage pattern (`npx auth generate`) found in better-auth's own official docs. Per protocol these are kept in the plan but flagged: **the planner must add a `checkpoint:human-verify` task before the `pnpm add better-auth` / `npx auth generate` step**, so a human confirms the installed version against `https://www.npmjs.com/package/better-auth` at execution time (the phase spans real calendar time; a newer or different-provenance release could theoretically land between this research and execution).

**Packages removed due to `[SLOP]` verdict:** none.
**Packages flagged as suspicious `[SUS]`:** `better-auth`, `auth` (both — false-positive "too-new" on an actively maintained, high-download, single-repo-verified package; checkpoint required per protocol, not a real legitimacy concern).

## Architecture Patterns

### System Architecture Diagram

```
                         ┌─────────────────────────────────────┐
                         │      packages/db/src/schema/         │
                         │                                       │
  CLI-generated ─────────▶  auth.ts (vendored, CLI-owned)        │
  (npx auth generate)    │    user ──┬──▶ session                │
                         │           ├──▶ account                │
                         │           └──▶ verification            │
                         │           │                            │
                         │           │ accountId (text FK, 1:1)   │
                         │           ▼                            │
  hand-written ──────────▶  visitor-profile.ts                   │
                         │    visitor_profile                     │
                         │      (username [UNIQUE lower(...)],   │
                         │       displayName, avatar,             │
                         │       socials, socialsVisibility)      │
                         │           │                            │
                         │           │ accountId (text FK, as     │
                         │           │  visitorId)                │
                         │           ▼                            │
  hand-written ──────────▶  my-festival.ts                       │
                         │    my_festival                         │
                         │      (visitorId, festivalId [uuid FK   │
                         │       → festival.id], savedAt, camp)   │
                         │                                        │
                         │  each table ──▶ drizzle-zod base       │
                         │                  (insert/select schema)│
                         └───────────────────┬───────────────────┘
                                             │ exported from
                                             │ packages/db barrel
                                             ▼
                         ┌─────────────────────────────────────┐
                         │   packages/contracts (Phase 2)       │
                         │   imports base schemas, composes     │
                         │   .pick()/.omit()/.extend() shapes   │
                         └─────────────────────────────────────┘
```

A reader can trace: better-auth CLI generates the auth tables → hand-written `visitor_profile` hangs off `user.id` via a text FK → `my_festival` hangs off `visitor_profile.accountId` (as `visitorId`) and off `festival.id` (uuid) → every table gets a drizzle-zod base export → Phase 2's contracts package will later import those bases. No runtime/API path exists yet in this phase (see Deferred Ideas) — the diagram stops at the package boundary.

### Recommended Project Structure
```
packages/db/src/schema/
├── _shared.ts            # existing: idColumn() (uuid), timestamps
├── locale.ts              # existing: localeEnum
├── festival.ts             # existing: festival (uuid PK), festivalLocale
├── tag.ts                  # existing: tag + tag_translation (style/pattern template)
├── auth.ts                 # NEW — CLI-generated + vendored: user, session, account, verification
│                            #   header comment: "GENERATED by `npx auth generate --adapter drizzle
│                            #   --dialect postgresql` — do not hand-edit; regenerate via <command>"
├── visitor-profile.ts       # NEW — hand-written: visitor_profile (+ socialsVisibility enum)
├── my-festival.ts           # NEW — hand-written: my_festival
└── index.ts                 # barrel — extend with the 3 new files' exports
```

### Pattern 1: Vendored/CLI-owned schema file with a regenerate contract
**What:** `schema/auth.ts` is generated output, not authored. A file-header comment documents the exact command to regenerate it and states "do not hand-edit."
**When to use:** Any time an external tool is the source of truth for a schema shape (here: better-auth's own table definitions), to prevent silent hand-drift from the library's actual behavior.
**Example:**
```typescript
// Source: better-auth CLI (`npx auth generate --adapter drizzle --dialect postgresql`)
// This file is GENERATED — do not hand-edit. To regenerate after upgrading better-auth
// or changing plugins in auth.config.ts, run:
//   pnpm --filter @festipal/db exec auth generate --adapter drizzle --dialect postgresql \
//     --config ./auth.config.ts --output ./src/schema/auth.ts
// [CITED: better-auth CLI generate command docs, packages/cli/src/commands/generate.ts]
import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});
// ...session, account, verification follow the same shape (see Finding 1)
```

### Pattern 2: Case-insensitive unique index via a reusable `lower()` SQL helper
**What:** A tiny helper function wraps `sql\`lower(${col})\`` so `uniqueIndex(...).on(lower(table.col))` reads naturally and is reusable across tables.
**When to use:** Any column needing case-insensitive uniqueness (here: `username`; potentially `email` on `user` later, though that's better-auth's own vendored table and out of scope to modify this phase).
**Example:**
```typescript
// Source: Drizzle ORM official docs guide "unique-case-insensitive-email"
// [CITED: drizzle-team/drizzle-orm-docs unique-case-insensitive-email.mdx]
import { sql, type SQL } from 'drizzle-orm';
import { type AnyPgColumn, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

function lower(col: AnyPgColumn): SQL {
  return sql`lower(${col})`;
}

export const visitorProfile = pgTable(
  'visitor_profile',
  {
    accountId: text('account_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    username: text('username').notNull(),
    displayName: text('display_name').notNull(),
    // ...avatar, socials, socialsVisibility per D-03
  },
  (t) => [uniqueIndex('visitor_profile_username_lower_unq').on(lower(t.username))],
);
```
This generates `CREATE UNIQUE INDEX ... ON visitor_profile USING btree (lower(username));` in the drizzle-kit migration — verified against the official docs' shown migration output (Finding 4).

### Pattern 3: `drizzle-zod` base schema colocated with each table, exported from the barrel
**What:** Every table file also exports `createInsertSchema(table)` / `createSelectSchema(table)` results (or a curated subset) so `packages/contracts` never redeclares the shape.
**When to use:** For every new table this phase (`visitor_profile`, `my_festival`, and selectively the vendored `auth.ts` tables where contracts will need them, e.g. `user` for a future `/me` response).
**Example:**
```typescript
// Source: drizzle-zod official README pattern (createInsertSchema/createSelectSchema)
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { visitorProfile } from './visitor-profile';

export const visitorProfileInsertSchema = createInsertSchema(visitorProfile);
export const visitorProfileSelectSchema = createSelectSchema(visitorProfile);
```

### Anti-Patterns to Avoid
- **Hand-editing `schema/auth.ts`:** Breaks the "regenerate on upgrade" contract; any drift here is invisible until the next `auth generate` run silently overwrites it.
- **Adopting the `organization` or `username` better-auth plugins for the visitor side:** See Standard Stack "Alternatives Considered" and PITFALLS.md Pitfalls 1/12 — both are schema-shape mistakes that are costly to unwind later (data migration required, per D-01/D-04 reversibility notes).
- **Skipping the `drizzle-zod` base for a "just one more table, I'll add it later" table:** This is exactly how PITFALLS.md Pitfall 6 predicts the drift problem compounds — adopt it for every table added this phase, not selectively.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth core schema shape (`user`/`session`/`account`/`verification`) | A hand-typed guess at better-auth's table shape | `npx auth generate --adapter drizzle --dialect postgresql` (Finding 1) | Hand-typing risks drift from the library's actual runtime expectations (missing indexes, wrong nullability) that only surfaces when Phase 2 wires the real auth module |
| Zod schemas mirroring Drizzle tables | Manually written `z.object({...})` per table in `packages/contracts` | `drizzle-zod`'s `createInsertSchema`/`createSelectSchema` (Finding 2) | Exactly the problem PITFALLS.md Pitfall 6 names — manual mirroring silently drifts on any column rename |
| Case-insensitive uniqueness | An application-layer `SELECT lower(username) = lower($1)` check before insert | A Postgres functional `UNIQUE INDEX ON lower(username)` (Finding 4) | Only a DB-level constraint is race-proof (PITFALLS.md Pitfall 11 — TOCTOU between an availability check and the insert); enforced here at the schema level even though the availability-check endpoint itself is Phase 2 |
| Membership modeling for gate-less "saved festivals" | better-auth `organization`/`member` tables repurposed as "my festivals" | A plain `my_festival(visitorId, festivalId, savedAt, camp?)` table (D-04) | The plugin's invite/role semantics don't map onto a gate-less save-relation; reserved for genuine Staff/Admin membership later (ADR-018) |

**Key insight:** every "don't hand-roll" item in this phase maps directly to one of the four `DEFAULT — confirm at plan review` decisions in CONTEXT.md — the research consistently confirms the user's Claude-proposed defaults are the standard, non-custom path, not just a convenient shortcut.

## Runtime State Inventory

**Trigger check:** This phase is additive (new tables in an existing, still-empty schema) rather than a rename/refactor/migration of existing data — but the "vendored/CLI-owned" nature of `schema/auth.ts` and the fresh Neon project warrant an explicit inventory rather than skipping this section.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — the Neon database has no `user`/`session`/`account`/`verification`/`visitor_profile`/`my_festival` rows yet (schema-only phase, no seed data, no prior auth system). Verified by reading the existing migration (`packages/db/drizzle/0000_short_odin.sql`) which only contains `festival`/`festival_locale`/`tag`/`tag_translation`. | None — pure `CREATE TABLE` migrations, no backfill needed |
| Live service config | None — no external service (Resend, etc.) references these table/column names yet; email-OTP delivery config is explicitly Phase 2 | None |
| OS-registered state | None — no CLI/cron/task-scheduler registrations reference this schema | None |
| Secrets/env vars | `packages/db/.env` / `.env.example` do not yet define `BETTER_AUTH_SECRET`. If the minimal `auth.ts` needed to run `npx auth generate` requires a non-empty secret value (to be confirmed at execution time — better-auth's schema generator may accept a placeholder), add it to `.env.example` as a documented dev placeholder, never a real committed secret | Add `.env.example` entry if generate requires it; verify at execution time whether a placeholder value is sufficient for schema generation (no live auth flow runs this phase) |
| Build artifacts | `packages/db/dist/` — none of the new schema files exist yet in the built output; a normal `pnpm --filter @festipal/db build` after adding files will regenerate `dist/schema/*` including the new tables' type declarations | Run the package build once new schema files land, before `packages/contracts` (Phase 2) tries to import from `@festipal/db` |

**Nothing found in category:** Confirmed empty for "Stored data," "Live service config," and "OS-registered state" — this is a genuinely greenfield addition to an as-yet-unused auth surface.

## Common Pitfalls

### Pitfall 1: Reaching for better-auth's `organization` plugin for festival membership
**What goes wrong:** ADR-009's phrasing ("mandantenfähig, Organizations = Festivals") reads like a recommendation to use the plugin for the visitor↔festival relationship, but the plugin's actual shape (roles, invites, `activeOrganization`) doesn't match a gate-less save/browse relation.
**Why it happens:** The plugin is the "official" multi-tenant primitive better-auth ships, so it's the path of least resistance even where it over-fits.
**How to avoid:** Use the plain `my_festival` join table (D-04); reserve the `organization` plugin for the later `FestivalStaff`/`PlatformAdmin` admin milestone (ADR-018), where real invite/role semantics exist.
**Warning signs:** Any code referencing `authClient.organization.setActive()` for "current festival" without invitation/role screens ever being built. [CITED: internal PITFALLS.md Pitfall 1, HIGH confidence — project's own prior research]

### Pitfall 2: Reaching for better-auth's `username` plugin for the profile-completion username field
**What goes wrong:** The plugin adds `username`/`displayUsername` directly to the shared `user` table (Finding 3) — the same table every `FestivalStaff`/`PlatformAdmin` account uses. Adopting it either leaves those columns permanently `NULL` for non-visitor accounts (schema noise misrepresenting the domain) or tempts enabling the plugin's own username+password sign-in surface, which the product explicitly doesn't want for visitors (OTP-only).
**Why it happens:** It's the first search result for "better-auth username" and looks like the obvious, low-effort answer.
**How to avoid:** Model `username`/`displayName`/`avatar`/`socials` on the separate `visitor_profile` table (D-03/D-04) with its own case-insensitive unique index — a few dozen extra lines, keeps the Account/VisitorProfile boundary intact at the schema level.
**Warning signs:** The CLI-generated `schema/auth.ts` containing `username`/`displayUsername` columns on `user` would mean the plugin was accidentally declared in `auth.ts`'s config — check the minimal config never imports `username()` from `better-auth/plugins`. [CITED: better-auth username plugin docs — Finding 3; internal PITFALLS.md Pitfall 12]

### Pitfall 3: Treating the availability of a schema-level unique index as optional/deferred
**What goes wrong:** Skipping the `lower(username)` functional unique index "for now" (planning to add app-layer checks first, DB constraint later) leaves a TOCTOU race between any future availability-check endpoint and the actual insert (Phase 2's `completeProfile` handler) — but by the time that's discovered, real duplicate data may already exist, requiring manual conflict resolution.
**Why it happens:** The unique index feels like a Phase-2-adjacent concern since the endpoint that exercises it doesn't exist yet.
**How to avoid:** Create the index in this phase's migration, not deferred — it's a schema-only concern regardless of when the endpoint lands (SC-2 explicitly requires it now).
**Warning signs:** A migration for `visitor_profile` with no `uniqueIndex` in its `(t) => [...]` third argument. [CITED: internal PITFALLS.md Pitfall 11]

### Pitfall 4: Using `@better-auth/cli` (the stale package name) instead of `auth`
**What goes wrong:** `@better-auth/cli` still resolves on the npm registry and even has substantial weekly downloads (237,936/wk), so `npm view @better-auth/cli` "succeeding" gives false confidence — but it's pinned at `1.4.21` while the CLI actually documented and shipped in better-auth's official docs/blog is published under the plain package name `auth` (tracking core version `1.6.25` in lockstep).
**Why it happens:** `@better-auth/cli` is the more "obviously named" package and CONTEXT.md's own wording references it by that name.
**How to avoid:** Install/`npx` the `auth` package (bin: `better-auth`/`auth`), confirmed via its registry metadata (`repository.directory: "packages/cli"` in the same `better-auth/better-auth` repo) and matching the documented `npx auth generate` command.
**Warning signs:** A CLI schema generation run using a `better-auth` core version that mismatches the CLI's declared `better-auth` dependency version (visible as odd schema differences vs. current docs). [VERIFIED: npm registry — `npm view auth`/`npm view @better-auth/cli`, this research session]

## Code Examples

### Vendored better-auth core schema (Postgres, default `text` ids, camelCase: false / default)
```typescript
// Source: better-auth CLI-generated snapshot, official test fixture
// [CITED: github.com/better-auth/better-auth/blob/main/packages/cli/test/__snapshots__/auth-schema-pg-enum.txt]
import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
}, (table) => [index('session_userId_idx').on(table.userId)]);

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()).notNull(),
}, (table) => [index('account_userId_idx').on(table.userId)]);

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [index('verification_identifier_idx').on(table.identifier)]);
```
Note: this is the CLI's *default* output shape (no `usePlural`, no `camelCase: true` adapter option — matching the existing `packages/db` convention of `casing: 'snake_case'`). The actual generated file for this project's minimal `auth.ts` (Drizzle adapter + `emailOTP` plugin declared) should match this shape closely; `emailOTP` does not add new tables (Finding on the `verification` table already covering OTP storage).

### Minimal `auth.ts` sufficient for CLI schema generation (no live DB, no HTTP handler)
```typescript
// Source: pattern derived from better-auth installation docs + CLI generate flag docs
// [CITED: better-auth docs/content/docs/installation.mdx; docs/content/blogs/1-5.mdx]
import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
// NOTE: drizzleAdapter(db, ...) normally needs a live `db` client — but the CLI's
// `--adapter drizzle --dialect postgresql` flags let `generate` produce schema
// output without a fully configured instance running against a real database.
// Confirm at execution time whether a lazily-constructed `db` (e.g. from
// createDatabase(process.env.DATABASE_URL_UNPOOLED!)) is required even for
// schema generation, or whether --adapter/--dialect alone suffice.
export const auth = betterAuth({
  plugins: [emailOTP({ /* minimal OTP config to shape the verification table's usage */ })],
});
```

### drizzle-zod base schema export pattern
```typescript
// Source: drizzle-zod official README
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { myFestival } from './my-festival';

export const myFestivalInsertSchema = createInsertSchema(myFestival);
export const myFestivalSelectSchema = createSelectSchema(myFestival);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `@better-auth/cli` as the canonical CLI package name | Plain `auth` npm package (bin: `better-auth`, `auth`), version-locked to core `better-auth` | Ongoing — `@better-auth/cli` last published 2026-03-01 at `1.4.21`, while `auth`/`better-auth` core are both at `1.6.25` as of 2026-07-23 | Installing `@better-auth/cli` risks generating schema against a 3+ minor-version-old CLI codegen path; use `auth` |
| Drizzle-zod versions targeting only Zod v3 | `drizzle-zod@0.8.3` supports both Zod v3 and v4 via a peer-dep range | Current release (2025-08-06 per registry `publishedAt` for this version) | No forced-upgrade pressure — the workspace's Zod v3 pin (ADR-006) is fully supported, not a legacy constraint on the drizzle-zod side |

**Deprecated/outdated:** None specific to this phase's scope beyond the `@better-auth/cli` naming confusion noted above.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A minimal `auth.ts` (no live `db` client passed to `drizzleAdapter`, or a lazily-constructed one) is sufficient for `npx auth generate` to succeed — the official docs confirm the `--adapter`/`--dialect` flags avoid needing "a full Better Auth configuration file," but no example in the fetched docs shows the *exact* minimal shape (e.g., whether `drizzleAdapter` still needs *some* `db` object, even an unconnected one) | Code Examples ("Minimal auth.ts…") | LOW-MEDIUM — if a live `db` handle turns out to be required, the plan needs a fallback: construct `createDatabase(process.env.DATABASE_URL_UNPOOLED!)` (already available in `packages/db/src/client.ts`) purely to satisfy the adapter constructor, without ever calling `.listen()`/serving requests. This is a config-shape risk, not an architecture risk — flagged for a `checkpoint:human-verify` or a first-task spike in the plan |
| A2 | The `emailOTP` plugin, when merely *declared* in the minimal `auth.ts` (not actually wired to send real emails), does not require additional schema beyond the core 4 tables — based on Context7-curated docs showing OTP state stored in the existing `verification` table, not a dedicated OTP table | Finding on emailOTP schema; Code Examples | LOW — if wrong, the CLI-generated `schema/auth.ts` would simply show an extra table/columns, which is self-correcting (the CLI output is authoritative either way — this assumption only affects what the plan *expects* to see, not what actually gets vendored) |
| A3 | Better-auth's default `casing: false` (snake_case DB / camelCase TS) CLI output aligns with the existing `packages/db` global `casing: 'snake_case'` Drizzle client config without extra adapter options — based on the `camelCase` adapter option defaulting to `false` per the adapter's own TypeScript interface doc comment | Code Examples; Project Constraints | LOW — if the two casing conventions ever mismatched, symptoms would be immediate and loud (migration SQL using wrong column names) at first `db:generate` run, easily caught before merge |

**If this table is empty:** N/A — see entries above. All three assumptions are LOW-to-MEDIUM risk, self-correcting, or verifiable at the first execution step (running the CLI / first migration generate) rather than being silent long-term risks.

## Open Questions

1. **Does `npx auth generate` require *any* real database connection string in `auth.ts`, even for schema-only output?**
   - What we know: Official docs/blog explicitly state the `--adapter`/`--dialect` flags let `generate` work "without requiring a full Better Auth configuration file" (Finding 1).
   - What's unclear: Whether "full configuration" specifically means the CLI can run with zero `database` option at all, or whether a `drizzleAdapter(db, { provider: 'pg' })` call still needs a constructible (if unconnected) `db` object.
   - Recommendation: Treat as a first-task spike in the plan (5-minute check): run the command locally against the project's `packages/db` and observe whether it errors without a `DATABASE_URL`. If it does, fall back to constructing `db` via the existing `createDatabase()` helper pointed at the (already-provisioned, per ADR-005) Neon dev database — no new provisioning needed either way.

2. **Should the vendored `auth.ts`'s `user` table get a drizzle-zod base export in this phase, or is that premature since no contract needs it until Phase 2's `GET /me`?**
   - What we know: D-02 says "packages/db exports drizzle-zod-derived base schemas next to each table" — read literally, this includes the vendored auth tables.
   - What's unclear: Whether exporting a base schema for `user` (which includes better-auth-internal fields like `emailVerified` that a `/me` response may want to `.omit()`) is expected now, or only for the hand-written `visitor_profile`/`my_festival` tables where the phase's own success criteria (SC-3) explicitly focus.
   - Recommendation: Export drizzle-zod bases for all three new schema surfaces (`auth.ts`'s 4 tables, `visitor_profile`, `my_festival`) for consistency — it's near-zero marginal cost (one line per table) and avoids a Phase 2 "wait, why doesn't `user` have a base schema" surprise.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All tooling | ✓ | v22.18.0 | — |
| npm | Registry checks (this research) | ✓ | 11.8.0 | — |
| pnpm | Package install/build (per `packageManager` pin) | Not directly probed this session — pinned in root `package.json` to `pnpm@11.17.0` | — | If missing locally, `corepack enable` per standard pnpm workspace bootstrap; not a phase-specific concern |
| Neon Postgres (dev branch) | "Migrates cleanly against Neon" (SC-1) | Not directly probed this session — `packages/db/.env`/`.env.example` exist, implying prior provisioning per ADR-005 | Existing (per ADR-005, provisioned 2026-07-28) | If the dev branch's `DATABASE_URL_UNPOOLED` is stale/expired, the plan's first task should include a "confirm Neon dev branch connectivity" checkpoint before running `db:generate`/`db:migrate` |

**Missing dependencies with no fallback:** None identified.
**Missing dependencies with fallback:** None beyond the Neon connectivity check noted above (not "missing," just unverified this session since research doesn't execute live migrations).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured yet in `packages/db` — CONCERNS.md confirms "No Test Framework Configuration" project-wide (Vitest planned per ADR/CLAUDE.md but not yet set up) |
| Config file | none — see Wave 0 |
| Quick run command | N/A until Wave 0 lands a `vitest.config.ts` |
| Full suite command | N/A until Wave 0 lands a `vitest.config.ts` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAT-01 (SC-1, schema exists + migrates cleanly) | Running `drizzle-kit generate` then applying the migration against the Neon dev branch succeeds with no errors | manual/smoke (schema-only phase; no app code exercises these tables yet) | `pnpm --filter @festipal/db db:generate && pnpm --filter @festipal/db db:migrate` | ❌ Wave 0 (no automated assertion beyond migration exit code — appropriate for a schema-only phase with no data yet) |
| PLAT-01 (SC-2, case-insensitive unique username) | Inserting two `visitor_profile` rows with usernames differing only in case fails the second insert with a unique-violation | unit (requires a test DB connection) | `pnpm --filter @festipal/db test -- visitor-profile.unique.test.ts` (path illustrative) | ❌ Wave 0 |
| PLAT-01 (SC-3, drizzle-zod compile-time drift check) | Renaming a column on a Drizzle table causes a TypeScript compile error in any file importing that table's drizzle-zod base schema with a `.pick()` referencing the renamed field | typecheck (no runtime test needed — this is inherently a `tsc --noEmit` check) | `pnpm --filter @festipal/db typecheck` (existing script) | ✅ script exists; the *test case* itself (a deliberate rename-and-observe-compile-error smoke test) does not exist as an automated fixture — recommend a one-time manual verification captured in the plan's UAT rather than a permanent test file |

### Sampling Rate
- **Per task commit:** `pnpm --filter @festipal/db typecheck && pnpm --filter @festipal/db lint`
- **Per wave merge:** `pnpm --filter @festipal/db db:generate` (dry-run/review the emitted SQL diff) + `pnpm --filter @festipal/db build`
- **Phase gate:** A real `db:migrate` run against the Neon dev branch succeeds; the unique-index constraint is verified with a manual duplicate-insert attempt (via `db:studio` or a throwaway script) since no test framework exists yet.

### Wave 0 Gaps
- [ ] `packages/db/vitest.config.ts` — no test framework configured project-wide (CONCERNS.md); if the plan wants an automated unique-constraint test, Vitest + a disposable test-DB connection strategy must be stood up first
- [ ] `packages/db/test/fixtures.ts` (or similar) — no DB test-fixture helper exists yet (`createTestDatabase()`, seed helpers) per CONCERNS.md's own "No Integration Tests" gap
- [ ] Framework install: `pnpm add -D vitest -w` (root) or per-package — only if the plan chooses to add an automated unique-index test rather than a manual UAT check this phase

*(If the plan opts for manual UAT verification of the unique-index constraint instead of standing up Vitest mid-schema-phase, these gaps can be deferred to a later phase's test-infrastructure task — flagging here per protocol, not mandating Vitest adoption in Phase 1.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Partial — schema only, no runtime auth flow this phase | better-auth's vendored schema itself (session/account/verification shape) is the foundation; actual credential handling is Phase 2 |
| V3 Session Management | Partial — schema only | `session` table (expiresAt, token, ipAddress, userAgent) is better-auth's own vendored shape; no session-issuing code exists yet |
| V4 Access Control | Yes | The `my_festival` FK to `visitor_profile.accountId` (not directly to `user.id`) encodes "must have a completed profile before saving a festival" at the schema level — a data-integrity control, not yet a runtime authorization check (that's Phase 2's `TenantGuard`) |
| V5 Input Validation | Yes | `drizzle-zod` base schemas are the foundation for all future request validation in `packages/contracts`; this phase's job is producing correct base types, not wiring validation pipes |
| V6 Cryptography | No | No cryptographic material is introduced this phase — `session.token`/`verification.value` are better-auth-internal and generated by the library itself in Phase 2, not hand-rolled here |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Username enumeration via case-variant duplicate attempts | Information Disclosure (minor) | The `lower(username)` unique index itself is the mitigation — a duplicate-case insert fails cleanly at the DB layer rather than silently creating a near-duplicate account, which is the schema-level half of PITFALLS.md Pitfall 11's TOCTOU concern (Phase 2 owns the request-layer `23505`-catching half) |
| Cross-tenant data leakage via a missing `festivalId` scope | Elevation of Privilege / Information Disclosure | Not directly this phase's concern (no queries exist yet) but the `my_festival(visitorId, festivalId)` composite-PK schema shape is the structural prerequisite Phase 2's `TenantGuard` will query against (PITFALLS.md Pitfall 4) — get the FK/composite-PK shape right now so Phase 2 has a correct relation to guard on |
| Accidental schema drift silently reopening a validation gap | Tampering (indirect) | `drizzle-zod` base schemas turning column renames into compile errors (SC-3) is itself a security-adjacent control — it prevents a renamed/removed column from silently becoming an unvalidated or mis-typed field in a future contract |

## Sources

### Primary (HIGH confidence)
- `npm view better-auth version` / `npm view auth version` / `npm view @better-auth/cli version` / `npm view drizzle-zod version` / `npm view drizzle-zod peerDependencies` / `npm view drizzle-orm version` / `npm view zod version` — live registry checks, 2026-07-30 [VERIFIED: npm registry]
- `.planning/research/PITFALLS.md` (internal project research, Context7-curated for better-auth-specific claims) — used to corroborate the organization/username-plugin rejection rationale
- `docs/DEVELOPMENT_DECISIONS.md` ADR-005, ADR-009, ADR-014, ADR-016 — internal, authoritative project decisions

### Secondary (MEDIUM confidence)
- [better-auth CLI generate command + drizzle adapter docs](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/adapters/drizzle.mdx) — Context7-curated
- [better-auth CLI test snapshot: Postgres auth schema](https://github.com/better-auth/better-auth/blob/main/packages/cli/test/__snapshots__/auth-schema-pg-enum.txt) — Context7-curated (official test fixture, high-fidelity source for exact column shapes)
- [better-auth 1.5 release notes — CLI `--adapter` flag](https://github.com/better-auth/better-auth/blob/main/docs/content/blogs/1-5.mdx) — Context7-curated
- [better-auth username plugin schema docs](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/plugins/username.mdx) — Context7-curated
- [Drizzle ORM: case-insensitive unique index guide](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/guides/unique-case-insensitive-email.mdx) — Context7-curated
- [Drizzle ORM: indexes-constraints docs](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/pg/indexes-constraints.mdx) — Context7-curated
- [Drizzle ORM: migration generate/push/migrate tutorial](https://github.com/drizzle-team/drizzle-orm-docs/blob/main/src/content/docs/tutorials/node-railway-pg.mdx) — Context7-curated
- [drizzle-zod docs (orm.drizzle.team/docs/zod)](https://orm.drizzle.team/docs/zod) — WebFetch, official site but did not state exact version-compat numbers (cross-verified against live npm registry peerDependencies instead)

### Tertiary (LOW confidence)
- General web-search corroboration of "organization plugin is invite/role-shaped, not fit for gate-less save" reasoning — directional only; the actual authoritative source for this project is the internal PITFALLS.md/ADR-014/016 (HIGH confidence)

## Metadata

**Confidence breakdown:**
- Standard stack (versions, peer-dep compatibility): HIGH — every version claim cross-verified live against the npm registry, not just training data or a single doc source
- better-auth schema shape / CLI behavior: MEDIUM — Context7-curated official docs and test fixtures, not independently executed in this session (Open Question 1 flags the one unverified mechanic)
- drizzle-zod / functional-index Drizzle patterns: MEDIUM-HIGH — official docs pattern matched exactly to the project's existing Drizzle version and casing convention
- Identity-model rationale (reject organization/username plugins): HIGH — corroborated by both official plugin docs (what the plugins actually do) and the project's own prior internal research (PITFALLS.md, ADR-014/016)
- Pitfalls: HIGH — largely inherited from and cross-checked against the project's own `.planning/research/PITFALLS.md`, which was itself Context7-sourced and dated 2026-07-30

**Research date:** 2026-07-30
**Valid until:** ~30 days (2026-08-29) for the Drizzle/drizzle-zod findings (stable ecosystem); ~7-14 days for the better-auth version pin specifically, given its fast release cadence (flagged `[SUS]`/too-new by the legitimacy checker) — **re-verify `better-auth`/`auth` CLI versions at execution time if this phase is planned/executed more than ~2 weeks after this research date.**
