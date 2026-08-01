---
phase: 01-identity-schema-auth-foundation
plan: 02
subsystem: database
tags: [drizzle, drizzle-zod, drizzle-kit, postgres, neon, zod, ts-rest, contracts, migration, identity, visitor-profile, functional-index]

# Dependency graph
requires:
  - phase: 01-01 (auth foundation)
    provides: "Vendored better-auth core tables (user/session/account/verification, text ids) as schema/auth.ts; drizzle-zod base-schema pattern; the user.id FK target for visitor_profile.accountId"
provides:
  - "visitor_profile table (text accountId PK -> user.id ON DELETE CASCADE) with username/displayName notNull, avatar nullable, reserved socials jsonb + socialsVisibility enum"
  - "Case-insensitive lower(username) functional UNIQUE INDEX (visitor_profile_username_lower_unq) — race-proof username uniqueness at the DB layer"
  - "drizzle-zod insert+select bases for visitor_profile, exported from the @festipal/db barrel"
  - "The proven packages/contracts -> @festipal/db drift-detection edge: visitorProfilePublicSchema composed on the drizzle-zod select base (a column rename breaks contracts typecheck)"
  - "The first Neon-applied migration (0001_groovy_skin.sql) bundling the four auth tables + visitor_profile; the schema now exists in the Neon dev branch"
  - "The drizzle-zod version constraint discovery: 0.8.x emits Zod-v4 schemas; 0.7.1 is the last Zod-v3-classic-compatible release (workspace-relevant per ADR-006)"
affects: [01-03 (my_festival expansion + PLAT-01 completion), phase-02-auth-runtime, packages-contracts]

# Tech tracking
tech-stack:
  added: ["drizzle-zod@0.7.1 (pinned exact — downgraded from ^0.8.3, see deviation)", "zod as a direct @festipal/db dependency (^3.25.76)", "@festipal/db as a workspace:* dependency of packages/contracts"]
  patterns:
    - "Functional/expression UNIQUE INDEX via a reusable lower(col: AnyPgColumn): SQL helper (NEW idiom this phase; slots into the existing (t) => [...] third-argument convention)"
    - "Reserved-field modeling: jsonb default '[]' + a pgEnum default-closed visibility flag, present in the schema but omitted from the contracts read shape until a policy exists"
    - "Contracts compose on the drizzle-zod base via .pick() (no hand-mirrored z.object) — the drift-detection edge"

key-files:
  created:
    - packages/db/src/schema/visitor-profile.ts
    - packages/db/drizzle/0001_groovy_skin.sql
    - packages/db/drizzle/meta/0001_snapshot.json
  modified:
    - packages/db/src/schema/index.ts
    - packages/db/package.json
    - packages/contracts/package.json
    - packages/contracts/src/schemas.ts
    - packages/db/drizzle/meta/_journal.json
    - pnpm-lock.yaml

key-decisions:
  - "D-03/D-04 implemented: visitor_profile PK = text accountId FK -> user.id cascade; username enforced case-insensitively unique via a Postgres functional index, not an app check."
  - "Contracts read schema (visitorProfilePublicSchema) picks ONLY accountId/username/displayName/avatar — socials/socialsVisibility are reserved (default closed) and deliberately omitted (T-01-PII mitigation)."
  - "drizzle-zod pinned to 0.7.1 exact: 0.8.x internally imports its classic API from zod/v4, producing Zod-v4-shaped objects that break the workspace's Zod v3 pin (ADR-006) in contracts, independent of which zod major resolves in node_modules."
  - "zod added as a direct @festipal/db dependency so drizzle-zod's peer resolves deterministically to 3.25.76 rather than the zod v4 pulled in transitively by better-auth."

patterns-established:
  - "Pattern 2 (RESEARCH): case-insensitive uniqueness via a lower(col) SQL helper + uniqueIndex — first functional index in the codebase."
  - "Pattern 3 (RESEARCH): drizzle-zod base colocated in the table file; contracts composes on it via .pick() — the drift-safe package edge, now proven end-to-end."

requirements-completed: [PLAT-01]

coverage:
  - id: D1
    description: "visitor_profile table defined: accountId text PK FK -> user.id ON DELETE CASCADE (no idColumn()), username/displayName notNull, avatar nullable, socials jsonb default '[]', socialsVisibility enum (everyone|friends) default 'friends', + timestamps."
    requirement: "PLAT-01"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/db typecheck (tsc --noEmit)"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/db build (tsup ESM+CJS+DTS)"
        status: pass
      - kind: manual_procedural
        ref: "packages/db/drizzle/0001_groovy_skin.sql lines 50-59 — CREATE TABLE visitor_profile with the exact columns"
        status: pass
    human_judgment: false
  - id: D2
    description: "Case-insensitive username uniqueness enforced by a Postgres functional UNIQUE INDEX ON lower(username) emitted in the migration SQL."
    requirement: "PLAT-01"
    verification:
      - kind: manual_procedural
        ref: "packages/db/drizzle/0001_groovy_skin.sql line 67 — CREATE UNIQUE INDEX \"visitor_profile_username_lower_unq\" ON \"visitor_profile\" USING btree (lower(\"username\"))"
        status: pass
    human_judgment: false
  - id: D3
    description: "drizzle-zod insert+select bases exported for visitor_profile and reachable from the @festipal/db/schema barrel."
    requirement: "PLAT-01"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/db build — dist/schema/index.d.ts re-exports visitorProfileInsertSchema/visitorProfileSelectSchema"
        status: pass
    human_judgment: false
  - id: D4
    description: "packages/contracts composes visitorProfilePublicSchema on the drizzle-zod select base (picking accountId/username/displayName/avatar only), so a visitor_profile column rename breaks contracts typecheck rather than drifting silently."
    requirement: "PLAT-01"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/contracts typecheck (tsc --noEmit) — exits 0 with the composed schema"
        status: pass
      - kind: manual_procedural
        ref: "DRIFT PROOF: renaming visitor_profile.username -> usernameRenamedForDriftProof broke pnpm --filter @festipal/db build (TS2339 at the lower() call) and cascaded to contracts typecheck failure; revert restored both to exit 0"
        status: pass
    human_judgment: false
  - id: D5
    description: "The auth + visitor_profile schema migrates cleanly against the Neon dev branch (SC-1, partial — my_festival lands in Plan 03)."
    requirement: "PLAT-01"
    verification:
      - kind: integration
        ref: "pnpm --filter @festipal/db db:migrate — applied 0001_groovy_skin.sql to the Neon dev branch, exit 0"
        status: pass
    human_judgment: false

# Metrics
duration: ~18min (active execution; excludes the blocking human go-ahead round-trip before the Neon apply)
completed: 2026-07-30
status: complete
---

# Phase 1 Plan 02: Identity Schema & Auth Foundation (Tracer Slice) Summary

**Proved the full drift-safe schema pipeline end-to-end on visitor_profile — Drizzle table with a case-insensitive lower(username) functional unique index -> drizzle-zod base -> a packages/contracts composition that provably breaks on a column rename -> a reviewed migration applied to the Neon dev branch — and discovered/fixed the drizzle-zod 0.8.x Zod-v4 incompatibility along the way.**

## Performance

- **Duration:** ~18 min active execution (the blocking human go-ahead before the outward-facing Neon apply was relayed by the coordinator and is excluded from this figure)
- **Started:** 2026-07-30
- **Completed:** 2026-07-30
- **Tasks:** 2 (Task 1 tracer + drift proof; Task 2 migration generate + Neon apply, split into a safe Step A and a gated Step B)
- **Files modified:** 9 (3 created, 6 modified)

## Accomplishments
- Defined `visitor_profile` (`packages/db/src/schema/visitor-profile.ts`) following the terse project column style: text `accountId` primary key referencing `user.id` with `onDelete: 'cascade'` (NOT `idColumn()`), `username`/`displayName` notNull, `avatar` nullable, reserved `socials` jsonb default `'[]'` and a `socials_visibility` pgEnum (`everyone`|`friends`) default `'friends'`, plus `...timestamps`.
- Introduced the codebase's first **functional unique index** — a reusable `lower(col: AnyPgColumn): SQL` helper feeding `uniqueIndex('visitor_profile_username_lower_unq').on(lower(t.username))` — making username uniqueness case-insensitive and race-proof at the DB layer (T-01-UN mitigation).
- Colocated the drizzle-zod `visitorProfileInsertSchema`/`visitorProfileSelectSchema` bases in the same file and extended the `@festipal/db` barrel.
- Wired the drift-detection far end: added `@festipal/db: workspace:*` to `packages/contracts`, imported the select base from the `@festipal/db/schema` subpath, and composed `visitorProfilePublicSchema` via `.pick({ accountId, username, displayName, avatar })` — deliberately omitting `socials`/`socialsVisibility` (T-01-PII: reserved, default closed).
- **Performed and reverted the drift proof** (see below) — a column rename provably breaks the pipeline.
- Generated the first post-baseline migration `0001_groovy_skin.sql` (four vendored auth tables + `visitor_profile` + the enum + the cascade FK + the `lower(username)` unique index) and **applied it to the Neon dev branch** (`db:migrate`, exit 0).

## Drift Proof (SC-3 / acceptance criterion)

Temporarily renaming the `username` column in `visitor-profile.ts` to `usernameRenamedForDriftProof`:
- Broke `pnpm --filter @festipal/db build` with `TS2339: Property 'username' does not exist` at the `lower(t.username)` call site — the build produced no `.d.ts`.
- Cascaded to `pnpm --filter @festipal/contracts typecheck` failing (`TS7016: Could not find a declaration file for module '@festipal/db/schema'`), because the far-end contract depends on the db package's emitted types.

After reverting the rename, `pnpm --filter @festipal/db build`, `pnpm --filter @festipal/db typecheck`, and `pnpm --filter @festipal/contracts typecheck` **all exit 0**. The revert was byte-verified identical to a pre-rename backup. The drift-detection edge works — arguably more strongly than planned, since the break surfaces at the db build boundary before contracts even typechecks.

## Reviewed Migration

**File:** `packages/db/drizzle/0001_groovy_skin.sql` (the first migration after the `0000_short_odin` baseline). Contains `CREATE TABLE` for `account`, `session`, `user`, `verification`, and `visitor_profile`, plus the `socials_visibility` enum. Both required schema-level guarantees are present and were reviewed before applying:

```sql
-- line 67 (case-insensitive functional unique index)
CREATE UNIQUE INDEX "visitor_profile_username_lower_unq" ON "visitor_profile" USING btree (lower("username"));

-- line 63 (1:1 Account <-> Profile cascade FK)
ALTER TABLE "visitor_profile" ADD CONSTRAINT "visitor_profile_account_id_user_id_fk"
  FOREIGN KEY ("account_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
```

**Neon apply:** `pnpm --filter @festipal/db db:migrate` exited 0 — "migrations applied successfully!". The two `NOTICE` lines (`schema "drizzle" already exists`, `relation "__drizzle_migrations" already exists`) are benign drizzle bookkeeping artifacts from the baseline `0000` migration, not errors. Precondition was verified read-only beforehand: `DATABASE_URL_UNPOOLED` is set in `packages/db/.env` and the branch answered a `SELECT 1` probe (no writes).

## Task Commits

1. **Task 1: visitor_profile + drizzle-zod base + contracts drift proof** - `a363612` (feat)
2. **Task 2: apply first Neon migration (auth + visitor_profile)** - `8076688` (feat)

Task 2 was split per the plan's non-autonomous checkpoint: Step A (generate + review the SQL, verify the precondition) ran immediately; Step B (the outward-facing `db:migrate`) paused for an explicit human "apply to Neon" go-ahead relayed by the coordinator, then completed.

## Files Created/Modified
- `packages/db/src/schema/visitor-profile.ts` (created) — the `visitor_profile` table, `socialsVisibilityEnum`, the `lower()` helper + functional unique index, and the two drizzle-zod bases.
- `packages/db/drizzle/0001_groovy_skin.sql` (created) — the first Neon-applied migration (auth tables + visitor_profile + enum + FK + functional index).
- `packages/db/drizzle/meta/0001_snapshot.json` (created) — drizzle-kit snapshot for migration 0001.
- `packages/db/src/schema/index.ts` (modified) — barrel extended with `export * from './visitor-profile'`.
- `packages/db/package.json` (modified) — `drizzle-zod` pinned to `0.7.1` (from `^0.8.3`); `zod: ^3.25.76` added as a direct dependency.
- `packages/contracts/package.json` (modified) — added `@festipal/db: workspace:*`.
- `packages/contracts/src/schemas.ts` (modified) — imports the drizzle-zod select base and exports `visitorProfilePublicSchema` + `VisitorProfilePublic` type.
- `packages/db/drizzle/meta/_journal.json` (modified) — journal entry for the `0001_groovy_skin` migration.
- `pnpm-lock.yaml` (modified) — lockfile for the drizzle-zod downgrade + new deps.

## Decisions Made
- **Reserved fields default-closed and hidden from the contract:** `socials`/`socialsVisibility` exist in the table (D-03) but are omitted from `visitorProfilePublicSchema` — there is no visibility policy yet, so the read shape exposes only the four non-reserved columns (T-01-PII).
- **Functional index over an app-layer check:** username uniqueness is enforced by `CREATE UNIQUE INDEX ON lower(username)`, not a pre-insert `SELECT` — the only TOCTOU-race-proof option (PITFALLS.md Pitfall 11 / T-01-UN). The Phase-2 request-layer `23505` catch is out of scope here.
- **Contracts composes, never re-declares:** `visitorProfilePublicSchema` is `.pick()`ed off the drizzle-zod base (D-02, T-01-DR) — no hand-mirrored `z.object`, which is what the drift proof exercises.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] drizzle-zod 0.8.x is incompatible with the workspace's Zod v3 pin**
- **Found during:** Task 1 (wiring the contracts composition — `pnpm --filter @festipal/contracts typecheck`)
- **Issue:** RESEARCH.md specified `drizzle-zod@^0.8.3`. With it installed, `contracts` typecheck failed with `TS2344 … ZodObject<…> does not satisfy the constraint 'ZodType<any, any, any>' … missing _type, _parse, _getType …`. Root cause: `drizzle-zod@0.8.x` internally imports its classic API from **`zod/v4`** (confirmed in the packed `index.mjs`: `import { z } from 'zod/v4'`), so its `createInsertSchema`/`createSelectSchema` return **Zod-v4-shaped** schema objects. These are structurally incompatible with the classic Zod v3 `ZodType` that `@ts-rest/core` and the rest of `packages/contracts` are pinned to (ADR-006) — and the incompatibility is independent of which physical `zod` major resolves in `node_modules`. A first (insufficient) fix of pinning `zod@3.25.76` in `packages/db` did not help, because 0.8.x reaches for the `zod/v4` sub-path regardless. RESEARCH.md's Finding 2 ("drizzle-zod@0.8.3 emits Zod v3-compatible schemas") was therefore incorrect for the *classic* v3 API this workspace uses.
- **Fix:** (a) Pinned `drizzle-zod` to `0.7.1` exact — the last release that imports classic `'zod'` (verified by diffing packed source of 0.7.1 vs 0.8.0). (b) Added `zod: ^3.25.76` as a direct `@festipal/db` dependency so drizzle-zod's peer resolves deterministically to the workspace v3 rather than the `zod@4.4.3` pulled in transitively via `better-auth`.
- **Files modified:** `packages/db/package.json`, `pnpm-lock.yaml`
- **Verification:** `pnpm --filter @festipal/db build` + `typecheck` and `pnpm --filter @festipal/contracts typecheck` all exit 0; `pnpm why zod -r` shows `@festipal/db` resolving `zod@3.25.76` and drizzle-zod deduped onto it.
- **Committed in:** `a363612` (Task 1 commit)

This is exactly the "drizzle-zod not Zod-v3-compatible" dead-end the plan's own `<objective>` named as a tracer risk — caught here on one committed slice and resolved without any architectural change, which is the tracer's whole purpose.

---

**Total deviations:** 1 auto-fixed (1 blocking dependency-compatibility issue).
**Impact on plan:** The fix is a version pin + a peer-determinism dependency; no schema, contract shape, or architecture changed. It validated the tracer's premise (find pipeline dead-ends after one slice, not three). No scope creep. A follow-up ADR recording the `drizzle-zod` ≤0.7.1 constraint may be worth adding in Plan 03 or Phase 2 so a future `pnpm up` doesn't silently re-break contracts.

## Issues Encountered
- The Neon `db:migrate` run emitted two `NOTICE` lines about the pre-existing `drizzle` schema and `__drizzle_migrations` table — expected idempotent bookkeeping from the baseline migration, not errors; the migration applied successfully (exit 0).

## User Setup Required
None — no new external service configuration this plan. The Neon dev branch and `DATABASE_URL_UNPOOLED` were already provisioned (ADR-005); the migration was applied against them with an explicit human go-ahead.

## Next Phase Readiness
- Plan 03 can now expand on this proven skeleton: hand-write `my_festival` (composite PK `(visitorId, festivalId)`, text `visitorId` FK -> `visitor_profile.accountId`, uuid `festivalId` FK -> `festival.id`), add its drizzle-zod base, and generate + apply the next migration — completing PLAT-01.
- The `contracts -> db` drift-detection edge is proven and live; future contract shapes should compose on drizzle-zod bases the same way.
- **Carry-forward constraint:** keep `drizzle-zod` at `0.7.1` (or any future release that returns to classic-`zod` imports) while the workspace stays on Zod v3 (ADR-006). Bumping into the 0.8.x/`zod/v4` line will re-break `packages/contracts` typecheck.

## Self-Check: PASSED

- `packages/db/src/schema/visitor-profile.ts` — FOUND
- `packages/db/drizzle/0001_groovy_skin.sql` — FOUND (CREATE UNIQUE INDEX lower(username) at line 67; cascade FK at line 63)
- `packages/db/drizzle/meta/0001_snapshot.json` — FOUND
- Commits `a363612`, `8076688` — both present in `git log`

---
*Phase: 01-identity-schema-auth-foundation*
*Completed: 2026-07-30*
