---
phase: 01-identity-schema-auth-foundation
plan: 03
subsystem: database
tags: [drizzle, drizzle-zod, drizzle-kit, postgres, neon, migration, identity, my-festival, composite-pk, multi-tenant, functional-index]

# Dependency graph
requires:
  - phase: 01-02 (visitor_profile tracer)
    provides: "visitor_profile table (text accountId PK -> user.id) + its lower(username) functional unique index; the proven table -> migration -> drizzle-zod -> Neon pipeline; the drizzle-zod 0.7.1 classic-zod pin"
provides:
  - "my_festival table: composite PK (visitorId, festivalId); text visitorId FK -> visitor_profile.accountId ON DELETE CASCADE; uuid festivalId FK -> festival.id ON DELETE CASCADE; savedAt notNull timestamptz defaultNow; camp nullable text (reserved)"
  - "my_festival as the ONLY global<->tenant link (keyed by visitorId; global Account carries no festivalId) — the gate-less save edge encoding 'completed profile before you can save' at the schema layer (D-04, ADR-014/016)"
  - "drizzle-zod insert+select bases for my_festival (myFestivalInsertSchema / myFestivalSelectSchema), exported from the @festipal/db barrel"
  - "The final migration 0002_skinny_susan_delgado.sql applied to the Neon dev branch — the full identity/membership schema (auth + visitor_profile + my_festival) now exists live in Neon"
  - "Live proof that the lower(username) unique index is enforced in the applied DB (case-variant duplicate insert -> Postgres 23505)"
affects: [phase-02-auth-runtime (TenantGuard queries my_festival by visitorId), packages-contracts (festival save/browse shapes), PLAT-01 completion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Composite-PK two-FK join table with MIXED id types (text visitorId + uuid festivalId) across the global<->tenant boundary — mirrors tagTranslation/festivalLocale shape but bridges auth-text-ids to tenant-uuid-ids"
    - "Single savedAt timestamp (not the full ...timestamps createdAt/updatedAt pair) — intentional per D-04 for a save edge"
    - "Phase-gate verification for a schema-only slice: scripted live duplicate-insert against the applied Neon DB (no Vitest framework project-wide) with mandatory row cleanup"

key-files:
  created:
    - packages/db/src/schema/my-festival.ts
    - packages/db/drizzle/0002_skinny_susan_delgado.sql
    - packages/db/drizzle/meta/0002_snapshot.json
  modified:
    - packages/db/src/schema/index.ts
    - packages/db/drizzle/meta/_journal.json

key-decisions:
  - "my_festival.visitorId FKs to visitor_profile.accountId (NOT user.id) — encodes the profile-before-save invariant at the schema layer (D-04, prohibition honored)."
  - "my_festival is a gate-less save edge, NOT an org/membership/role table: no invite/role/active-festival columns (PITFALL 1, ADR-014)."
  - "Mixed id types are intentional: text visitorId (better-auth/visitor_profile convention) + uuid festivalId (tenant-table convention) — D-04 explicitly calls this out."
  - "camp column reserved now (nullable text, no UI this cycle) so a future camp feature is additive, not a breaking migration (D-04)."

patterns-established:
  - "Composite-PK join-table pattern from tagTranslation/festivalLocale, extended to bridge the global (text-id) <-> tenant (uuid-id) boundary — the single sanctioned global<->tenant link."

requirements-completed: [PLAT-01]

coverage:
  - id: D1
    description: "my_festival table defined: composite PK (visitorId, festivalId); text visitorId FK -> visitor_profile.accountId ON DELETE CASCADE; uuid festivalId FK -> festival.id ON DELETE CASCADE; savedAt notNull timestamptz defaultNow; camp nullable text; no invite/role/active-festival columns; visitorId NOT pointed at user.id."
    requirement: "PLAT-01"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/db typecheck (tsc --noEmit) — exit 0"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/db build (tsup ESM+CJS+DTS) — exit 0; myFestival/myFestivalInsertSchema/myFestivalSelectSchema present in dist/schema/index.d.ts"
        status: pass
      - kind: manual_procedural
        ref: "packages/db/drizzle/0002_skinny_susan_delgado.sql — CREATE TABLE my_festival with composite PK + both cascade FKs (text visitorId -> visitor_profile.account_id, uuid festivalId -> festival.id)"
        status: pass
    human_judgment: false
  - id: D2
    description: "drizzle-zod insert+select bases exported for my_festival and reachable from the @festipal/db/schema barrel."
    requirement: "PLAT-01"
    verification:
      - kind: unit
        ref: "dist/schema/index.d.ts re-exports myFestivalInsertSchema (g) and myFestivalSelectSchema (h)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The full identity/membership schema (auth + visitor_profile + my_festival) migrates cleanly against the Neon dev branch (SC-1)."
    requirement: "PLAT-01"
    verification:
      - kind: integration
        ref: "pnpm --filter @festipal/db db:migrate — applied 0002_skinny_susan_delgado.sql to the Neon dev branch, exit 0 ('migrations applied successfully!')"
        status: pass
    human_judgment: false
  - id: D4
    description: "The lower(username) unique index is proven LIVE in the applied database: a case-variant duplicate username insert is rejected with Postgres 23505 from visitor_profile_username_lower_unq (SC-2)."
    requirement: "PLAT-01"
    verification:
      - kind: integration
        ref: "Throwaway script against Neon (DATABASE_URL_UNPOOLED): first visitor_profile insert (username 'GsdProofUser...') OK; second insert (lowercase variant) rejected with code 23505, constraint visitor_profile_username_lower_unq, detail 'Key (lower(username))=(...) already exists.'; all throwaway rows cleaned up (0 residue)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Re-running db:generate on the unchanged schema produces no new migration (idempotency edge, flagged in COVERAGE)."
    requirement: "PLAT-01"
    verification:
      - kind: integration
        ref: "pnpm --filter @festipal/db db:generate (2nd run) — 'No schema changes, nothing to migrate'; git status shows no new drizzle file"
        status: pass
    human_judgment: false

# Metrics
duration: ~15min (active execution; excludes the blocking human go-ahead round-trip before the Neon apply)
completed: 2026-07-30
status: complete
---

# Phase 1 Plan 03: my_festival Save-Membership Join (Expansion) Summary

**Added the `my_festival` gate-less save-membership join — the single sanctioned bridge between global identity and tenant data — as a composite-PK (visitorId, festivalId) table that FKs text visitorId -> visitor_profile.accountId and uuid festivalId -> festival.id, derived its drizzle-zod bases, generated + applied the final migration (0002) to the Neon dev branch, and proved the case-insensitive username unique index is live with a real case-variant duplicate insert that Postgres rejected with 23505.**

## Performance

- **Duration:** ~15 min active execution (the blocking human go-ahead before the outward-facing Neon apply was relayed by the coordinator and is excluded from this figure)
- **Started:** 2026-07-30
- **Completed:** 2026-07-30
- **Tasks:** 2 (Task 1 my_festival + drizzle-zod base; Task 2 migration generate + Neon apply + live uniqueness proof, split into a safe Step A and a gated Step B)
- **Files modified:** 5 (3 created, 2 modified)

## Accomplishments
- Defined `myFestival` (`packages/db/src/schema/my-festival.ts`) mirroring the `tagTranslation`/`festivalLocale` composite-PK join shape: `visitorId` text notNull referencing `visitor_profile.accountId` (onDelete cascade); `festivalId` uuid notNull referencing `festival.id` (onDelete cascade); `savedAt` notNull `timestamp({ withTimezone: true }).defaultNow()`; `camp` nullable text (reserved); third-argument `(t) => [primaryKey({ columns: [t.visitorId, t.festivalId] })]`. JSDoc cites ADR-014/016 + D-04 and flags the intentional mixed text/uuid id types.
- Colocated the drizzle-zod `myFestivalInsertSchema`/`myFestivalSelectSchema` bases in the same file and extended the `@festipal/db` barrel with `export * from './my-festival'`.
- Generated the final migration `0002_skinny_susan_delgado.sql` (my_festival CREATE TABLE + composite PK + both cascade FKs) and **applied it to the Neon dev branch** (`db:migrate`, exit 0) — completing the full identity/membership schema (auth + visitor_profile + my_festival) live in Neon.
- **Proved SC-2 live in the applied database:** a throwaway script inserted a user + visitor_profile with a mixed-case username, then a second visitor_profile (own user) with the lowercase variant; Postgres rejected the second insert with **23505** from `visitor_profile_username_lower_unq`. All throwaway rows were deleted afterward (verified 0 residue).
- Confirmed **idempotency**: a second `db:generate` on the unchanged schema reported "No schema changes, nothing to migrate" and produced no new migration file.

## Reviewed Migration

**File:** `packages/db/drizzle/0002_skinny_susan_delgado.sql` (the final migration after `0001_groovy_skin`). Reviewed before applying; the three required schema-level guarantees are all present:

```sql
CREATE TABLE "my_festival" (
	"visitor_id" text NOT NULL,
	"festival_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"camp" text,
	CONSTRAINT "my_festival_visitor_id_festival_id_pk" PRIMARY KEY("visitor_id","festival_id")
);
--> statement-breakpoint
ALTER TABLE "my_festival" ADD CONSTRAINT "my_festival_visitor_id_visitor_profile_account_id_fk"
  FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor_profile"("account_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "my_festival" ADD CONSTRAINT "my_festival_festival_id_festival_id_fk"
  FOREIGN KEY ("festival_id") REFERENCES "public"."festival"("id") ON DELETE cascade ON UPDATE no action;
```

**Neon apply:** `pnpm --filter @festipal/db db:migrate` exited 0 — "migrations applied successfully!". The two `NOTICE` lines (`schema "drizzle" already exists`, `relation "__drizzle_migrations" already exists`) are benign drizzle bookkeeping artifacts from the baseline migration, not errors. Precondition was verified read-only beforehand: `DATABASE_URL_UNPOOLED` is set in `packages/db/.env` and the branch answered a `SELECT 1` probe (no writes).

## Live Uniqueness Proof (SC-2)

Observed error from the second (case-variant) insert against the applied Neon schema:

```json
{
  "code": "23505",
  "constraint": "visitor_profile_username_lower_unq",
  "detail": "Key (lower(username))=(gsdproofuser<ts>) already exists.",
  "severity": "ERROR",
  "message": "duplicate key value violates unique constraint \"visitor_profile_username_lower_unq\""
}
```

Sequence: first insert of `GsdProofUser<ts>` succeeded; second insert of the lowercase variant `gsdproofuser<ts>` (with its own throwaway user) was rejected by the functional index — proving `lower(username)` uniqueness is enforced in the live DB, not just declared in the migration. The throwaway `user` + `visitor_profile` rows were deleted in a `finally` block and a follow-up `SELECT` confirmed `remaining_user_rows=0`. No test residue left in the dev DB. The throwaway script itself (`gsd-tmp-uniqueness-proof.mjs`) was deleted after the run and never committed.

## Task Commits

1. **Task 1: define my_festival gate-less save join + drizzle-zod base** - `2461033` (feat)
2. **Task 2: apply final Neon migration — my_festival save-membership join** - `b97ede2` (feat)

Task 2 was split per the plan's non-autonomous checkpoint: Step A (generate + review the SQL, verify the read-only precondition) ran immediately; Step B (the outward-facing `db:migrate` + the live duplicate-insert proof) paused for an explicit human "apply + prove" go-ahead relayed by the coordinator, then completed.

## Files Created/Modified
- `packages/db/src/schema/my-festival.ts` (created) — the `my_festival` composite-PK join table + the two drizzle-zod bases.
- `packages/db/drizzle/0002_skinny_susan_delgado.sql` (created) — the final Neon-applied migration (my_festival CREATE TABLE + composite PK + two cascade FKs).
- `packages/db/drizzle/meta/0002_snapshot.json` (created) — drizzle-kit snapshot for migration 0002.
- `packages/db/src/schema/index.ts` (modified) — barrel extended with `export * from './my-festival'`.
- `packages/db/drizzle/meta/_journal.json` (modified) — journal entry for the `0002_skinny_susan_delgado` migration.

## Decisions Made
- **visitorId FKs to visitor_profile.accountId, never user.id:** encodes the "completed profile before you can save a festival" invariant at the schema layer (D-04); a direct user.id FK would bypass it (prohibition honored, T-01-INV mitigated).
- **Gate-less save, not org membership:** no invite/role/active-festival columns — saving is open to any profile (ADR-014, PITFALL 1). my_festival is the ONLY global<->tenant link and is always keyed by visitorId; the global Account carries no festivalId (T-01-XT mitigated).
- **Single savedAt, not the full timestamps pair:** a save edge only needs when-saved, per D-04 — intentional deviation from the `...timestamps` convention used by content tables.
- **camp reserved now:** nullable text with no UI this cycle, kept so a future camp feature is additive.

## Deviations from Plan

None — plan executed exactly as written. The carry-forward constraint (drizzle-zod pinned at 0.7.1) was honored; no dependency changes were made this plan. Task 2's non-autonomous split (safe Step A, gated Step B) followed the checkpoint protocol.

## Issues Encountered
- The live-proof script initially failed passing JS `Date` objects as bound params to `db.execute(sql\`...\`)` (postgres.js raw execute does not serialize `Date`). Resolved by omitting the `created_at`/`updated_at` columns and letting their `defaultNow()` fill them — a throwaway-script fix, no schema impact.
- Drizzle wraps the underlying Postgres error; the `23505` code/constraint surface on `error.cause`, not the top-level error. Read `e.cause` to observe the real pg error. (Relevant for the Phase-2 request-layer 23505 catch.)
- The Neon `db:migrate` run emitted two benign `NOTICE` lines about the pre-existing `drizzle` schema and `__drizzle_migrations` table — expected idempotent bookkeeping from the baseline migration, not errors; the migration applied successfully (exit 0).

## User Setup Required
None — no new external service configuration this plan. The Neon dev branch and `DATABASE_URL_UNPOOLED` were already provisioned (ADR-005); the migration was applied against them with an explicit human go-ahead.

## Next Phase Readiness
- **PLAT-01 is now fully satisfied at the schema layer:** global Account (user) -> visitor_profile -> my_festival, with the single global<->tenant bridge in place and the case-insensitive username uniqueness proven live. Phase 1's schema surface is closed.
- **Phase 2 (auth runtime)** can now build the NestJS better-auth handler, AuthGuard, and TenantGuard against a live schema; the TenantGuard queries `my_festival` by `visitorId` for saved-festival scoping (isolation is data-scoping, not a 403 — entry stays gate-less per ADR-014).
- **Contracts** can compose festival save/browse shapes on the drizzle-zod bases (`myFestivalInsertSchema`/`myFestivalSelectSchema`) the same drift-safe way visitor_profile did.
- **Carry-forward constraint (unchanged):** keep `drizzle-zod` at `0.7.1` while the workspace stays on Zod v3 (ADR-006); bumping into the 0.8.x/`zod/v4` line re-breaks `packages/contracts` typecheck.

## Self-Check: PASSED

- `packages/db/src/schema/my-festival.ts` — FOUND
- `packages/db/drizzle/0002_skinny_susan_delgado.sql` — FOUND (composite PK + both cascade FKs)
- `packages/db/drizzle/meta/0002_snapshot.json` — FOUND
- Commits `2461033`, `b97ede2` — both present in `git log`

---
*Phase: 01-identity-schema-auth-foundation*
*Completed: 2026-07-30*
