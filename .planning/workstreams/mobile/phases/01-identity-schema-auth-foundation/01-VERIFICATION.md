---
phase: 01-identity-schema-auth-foundation
verified: 2026-07-30T00:00:00Z
status: passed
score: 17/17 must-haves verified (plus all 4 ROADMAP success criteria and 7/7 prohibitions confirmed honored)
behavior_unverified: 0
overrides_applied: 0
---

# Phase 1: Identity Schema & Auth Foundation Verification Report

**Phase Goal:** The database and shared packages model global Account/VisitorProfile identity,
festival save-membership, and better-auth's OTP tables, ready for auth wiring, with no risk of
contract/schema drift.

**Verified:** 2026-07-30
**Status:** PASSED
**Re-verification:** No — initial verification

## Methodology Note

This verification did not rely on SUMMARY.md claims as evidence. Every structural claim was
re-derived from the actual source files, and every runtime/database claim was re-proven with a
**live query or a live behavioral test against the real Neon dev branch** (using
`packages/db/.env` `DATABASE_URL_UNPOOLED`), independent of and in addition to what the
01-01/01-02/01-03 SUMMARY.md files reported. This includes re-running `pnpm --filter @festipal/db
typecheck/build` and `pnpm --filter @festipal/contracts typecheck` myself, querying Neon's
`information_schema`/`pg_constraint`/`pg_indexes` directly, re-running `db:generate` to confirm
idempotency, and performing a real case-variant duplicate-username insert against Neon to observe
the `23505` rejection first-hand (with verified cleanup, 0 residual rows).

## Goal Achievement

### ROADMAP Success Criteria (the contract)

| # | Success Criterion | Status | Evidence |
|---|---|---|---|
| SC-1 | better-auth core tables + separate `visitor_profile` + `my_festival(visitorId, festivalId, savedAt, camp?)` exist and migrate cleanly against Neon | VERIFIED | Live query against Neon: `information_schema.tables` returns `account, session, user, verification, visitor_profile, my_festival` (plus pre-existing `festival`/`tag`/etc.). `drizzle.__drizzle_migrations` has 3 rows matching `packages/db/drizzle/meta/_journal.json` (0000, 0001_groovy_skin, 0002_skinny_susan_delgado). |
| SC-2 | `username` case-insensitively unique via `UNIQUE INDEX ON lower(username)`; global `Account` carries no `festivalId`; `my_festival` (keyed by `visitorId`) is the only global↔tenant link | VERIFIED | Live `pg_indexes` query: `visitor_profile_username_lower_unq` = `CREATE UNIQUE INDEX ... USING btree (lower(username))`. Live behavioral test (self-performed): inserted `user`+`visitor_profile` with username `Verify_<hex>`, then a second `visitor_profile` with case-variant `verify_<hex>` — **rejected with Postgres `23505`, constraint `visitor_profile_username_lower_unq`**; rows cleaned up, `remaining=0` confirmed. Live `information_schema.columns` on `user`: exactly `id, name, email, email_verified, image, created_at, updated_at` — no `festival_id`. Live `pg_constraint`: `my_festival`'s only FKs are to `visitor_profile.account_id` and `festival.id`. |
| SC-3 | `drizzle-zod` derives base Zod schemas so a DB column rename is a compile error, not silent drift | VERIFIED | `packages/db/src/schema/auth-schemas.ts`, `visitor-profile.ts`, `my-festival.ts` all export insert+select drizzle-zod bases; `packages/contracts/src/schemas.ts` imports `visitorProfileSelectSchema` from `@festipal/db/schema` and composes `.pick()` (not a hand-mirrored `z.object`). 01-02-SUMMARY documents the drift proof (rename broke `db build`, cascaded to `contracts typecheck`); the composition code itself (`.pick({accountId,username,displayName,avatar})` keyed by real column names) independently confirms the mechanism is real, not just claimed. |
| SC-4 | Identity/membership model decided in writing (Account→VisitorProfile separate table; gate-less `my_festival`; NOT `organization` plugin, NOT `username` plugin) recorded as a plan/ADR note | VERIFIED | `docs/DEVELOPMENT_DECISIONS.md` §ADR-021 (lines 484-511) explicitly states all 4 points, citing ADR-009/014/016. `packages/db/auth.config.ts` declares only `emailOTP`; no `organization`/`username` plugin import or declaration anywhere in the file. |

**Score:** 4/4 ROADMAP success criteria verified.

### Plan-Level Must-Haves (granular truths from 01-01/01-02/01-03 PLAN.md frontmatter)

| # | Truth (source plan) | Status | Evidence |
|---|---|---|---|
| 1 | better-auth's 4 core tables exist as CLI-generated, vendored `schema/auth.ts` with text ids (01-01) | VERIFIED | `packages/db/src/schema/auth.ts` — `user/session/account/verification`, all `text("id").primaryKey()`. |
| 2 | `auth.ts` documented as vendored/CLI-owned, in-file regenerate command, not hand-authored (01-01) | VERIFIED | Lines 1-19 of `auth.ts`: "GENERATED FILE — DO NOT HAND-EDIT" header + exact `auth generate` command. |
| 3 | drizzle-zod insert+select bases exported for every vendored auth table via sibling `auth-schemas.ts` (01-01) | VERIFIED | `auth-schemas.ts` — 8 named exports (`user/session/account/verification` × insert/select); separate file from `auth.ts`; confirmed present in built `dist/schema/index.d.ts`. |
| 4 | Identity/membership model recorded as ADR note (01-01) | VERIFIED | ADR-021, see SC-4 above. |
| 5 | better-auth version pinned in `packages/db/package.json` (01-01) | VERIFIED | `"better-auth": "1.6.25"` exact (no caret); `"auth": "1.6.25"` exact in devDependencies. `@better-auth/cli` absent. |
| 6 | `visitor_profile` exists keyed by `accountId` (text PK FK→`user.id` cascade) with `username`/`displayName` notNull, `avatar` nullable, `socials` jsonb, `socialsVisibility` enum default `friends` (01-02) | VERIFIED | `visitor-profile.ts` lines 28-42 — exact shape. Live `pg_constraint`: `visitor_profile_account_id_user_id_fk` → `user(id)` `ON DELETE CASCADE`. |
| 7 | `username` case-insensitively unique via `UNIQUE INDEX ON lower(username)` emitted in migration SQL (01-02) | VERIFIED | `0001_groovy_skin.sql` line: `CREATE UNIQUE INDEX "visitor_profile_username_lower_unq" ... (lower("username"))`. Confirmed live in Neon (see SC-2). |
| 8 | drizzle-zod insert+select bases exported for `visitor_profile` from barrel (01-02) | VERIFIED | `visitorProfileInsertSchema`/`visitorProfileSelectSchema` exported, present in `dist/schema/index.d.ts`. |
| 9 | `packages/contracts` composes on a `visitor_profile` drizzle-zod base referencing named columns (drift-detection path) (01-02) | VERIFIED | `schemas.ts` — `visitorProfileSelectSchema.pick({accountId, username, displayName, avatar})`; `pnpm --filter @festipal/contracts typecheck` exits 0 (self-run). |
| 10 | auth + `visitor_profile` schema migrates cleanly against Neon (01-02, partial) | VERIFIED | Live: `visitor_profile` and the 4 auth tables exist in Neon; migration 0001 hash present in `__drizzle_migrations`. |
| 11 | (backstop) Re-running `db:generate` on an unchanged schema is a no-op | VERIFIED | Self-run `pnpm --filter @festipal/db db:generate` → `"No schema changes, nothing to migrate"`; `git status --porcelain packages/db/drizzle/` empty before and after. |
| 12 | (backstop) Case-variant username race is prevented at the DB layer, not app-level | VERIFIED | Self-performed live duplicate-insert test (see SC-2) — real `23505` from Postgres, not a simulated/claimed result. |
| 13 | `my_festival` exists with composite PK `(visitorId, festivalId)`; `visitorId` text FK→`visitor_profile.accountId` cascade; `festivalId` uuid FK→`festival.id` cascade; `savedAt` notNull; `camp` nullable (01-03) | VERIFIED | `my-festival.ts` lines 23-36; live `pg_constraint` confirms both FKs target `visitor_profile(account_id)` and `festival(id)`, both `ON DELETE CASCADE`. |
| 14 | `my_festival` is the ONLY link between global identity and tenant data, always keyed by `visitorId`; global `Account` carries no `festivalId` FK (01-03) | VERIFIED | Live `pg_constraint` query scoped to `visitor_profile/my_festival/account/session` shows no `festivalId`-typed FK on `user`/`account`/`session`; `my_festival` is the sole bridge. |
| 15 | drizzle-zod insert+select bases exported for `my_festival` from barrel (01-03) | VERIFIED | `myFestivalInsertSchema`/`myFestivalSelectSchema` exported, confirmed present in `dist/schema/index.d.ts`. |
| 16 | Full schema (auth + `visitor_profile` + `my_festival`) migrates cleanly against Neon (01-03) | VERIFIED | Live: all 10 tables present in `information_schema.tables`; 3/3 migrations recorded in `__drizzle_migrations`. |
| 17 | Duplicate case-variant username insert rejected with Postgres 23505 in the live DB (01-03) | VERIFIED | Same self-performed test as #12 — directly reproduced, not merely re-read from SUMMARY. |

**Score:** 17/17 plan-level must-haves verified.

### Prohibitions (must-NOT checks — verification: judgment/manual_procedural)

| # | Prohibition (source plan) | Status | Evidence |
|---|---|---|---|
| P1 | Vendored `user` table must NEVER carry a `festivalId` FK (01-01) | RESOLVED — honored | Live `information_schema.columns` on `user`: 7 columns, no `festival_id`. |
| P2 | `username` plugin must NOT be declared in `auth.config.ts` (01-01) | RESOLVED — honored | `auth.config.ts` imports only `emailOTP` from `better-auth/plugins`; no `username` plugin import. `user` table has no `username`/`displayUsername` columns (confirmed live). |
| P3 | `organization` plugin must NOT be declared in `auth.config.ts` (01-01) | RESOLVED — honored | Same file — no `organization` plugin import or declaration. |
| P4 | `packages/contracts` must NOT re-declare `visitor_profile` as a hand-written `z.object` (01-02) | RESOLVED — honored | `schemas.ts` — `visitorProfilePublicSchema` is `.pick()`-composed on the imported drizzle-zod base, not a hand-authored object. |
| P5 | Contracts composition must NOT expose `socials`/`socialsVisibility` (01-02) | RESOLVED — honored | `.pick({accountId, username, displayName, avatar})` — only these 4 keys; `socials`/`socialsVisibility` absent. |
| P6 | `my_festival.visitorId` must FK to `visitor_profile.accountId`, NOT `user.id` directly (01-03) | RESOLVED — honored | Live `pg_constraint`: `my_festival_visitor_id_visitor_profile_account_id_fk` → `visitor_profile(account_id)`. No FK from `my_festival` to `user`. |
| P7 | `my_festival` must NOT gain invite/role/active-festival columns (01-03) | RESOLVED — honored | `my-festival.ts` columns: `visitorId, festivalId, savedAt, camp` only; live `information_schema` confirms same 4 columns in Neon. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `packages/db/src/schema/auth.ts` | vendored auth tables, provenance header | VERIFIED | Present, substantive, wired via barrel, live in Neon. |
| `packages/db/src/schema/auth-schemas.ts` | drizzle-zod bases for auth tables | VERIFIED | Present, 8 exports, wired via barrel. |
| `packages/db/auth.config.ts` | minimal betterAuth instance, emailOTP only | VERIFIED | Present, no org/username plugins. |
| `packages/db/src/schema/visitor-profile.ts` | table + enum + functional index + zod bases | VERIFIED | Present, substantive, wired, live in Neon. |
| `packages/db/src/schema/my-festival.ts` | composite-PK join table + zod bases | VERIFIED | Present, substantive, wired, live in Neon. |
| `packages/db/src/schema/index.ts` | barrel re-exporting all 4 new modules | VERIFIED | `./auth`, `./auth-schemas`, `./visitor-profile`, `./my-festival` all present. |
| `packages/contracts/src/schemas.ts` | `visitorProfilePublicSchema` composed on drizzle-zod base | VERIFIED | Present, composed correctly, typechecks. |
| `packages/db/drizzle/0001_groovy_skin.sql`, `0002_skinny_susan_delgado.sql` | migrations for auth+visitor_profile, my_festival | VERIFIED | Present, reviewed SQL matches schema, applied to Neon (confirmed live). |
| `docs/DEVELOPMENT_DECISIONS.md` ADR-021 | identity-model ADR | VERIFIED | Present, comprehensive, cites ADR-009/014/016. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `auth.config.ts` | `schema/auth.ts` | `auth generate` CLI pipeline | WIRED | Provenance header documents the exact command; generated shape matches better-auth's documented core schema. |
| `schema/auth.ts` tables | `auth-schemas.ts` drizzle-zod bases | direct import (`from './auth'`) | WIRED | Confirmed by reading imports. |
| `visitor-profile.ts` `accountId` | `auth.ts` `user.id` | `.references(() => user.id, { onDelete: 'cascade' })` | WIRED | Confirmed in code and live Neon FK (`visitor_profile_account_id_user_id_fk`). |
| `my-festival.ts` `visitorId` | `visitor-profile.ts` `accountId` | `.references(() => visitorProfile.accountId, { onDelete: 'cascade' })` | WIRED | Confirmed in code and live Neon FK. |
| `my-festival.ts` `festivalId` | `festival.ts` `id` | `.references(() => festival.id, { onDelete: 'cascade' })` | WIRED | Confirmed in code and live Neon FK. |
| `packages/db/schema` barrel | `packages/contracts/src/schemas.ts` | `import { visitorProfileSelectSchema } from '@festipal/db/schema'` | WIRED | `@festipal/db: workspace:*` in `contracts/package.json`; import resolves; `contracts typecheck` exits 0 (self-run). |

### Behavioral Spot-Checks / Live Verification

| Behavior | Command | Result | Status |
|---|---|---|---|
| `packages/db` typechecks | `pnpm --filter @festipal/db typecheck` (self-run) | exit 0 | PASS |
| `packages/db` builds | `pnpm --filter @festipal/db build` (self-run) | exit 0, dist emits all expected exports | PASS |
| `packages/contracts` typechecks | `pnpm --filter @festipal/contracts typecheck` (self-run) | exit 0 | PASS |
| All 10 expected tables exist in Neon | live `information_schema.tables` query | `account, session, user, verification, visitor_profile, my_festival, festival, festival_locale, tag, tag_translation` | PASS |
| `visitor_profile` functional unique index live | live `pg_indexes` query | `visitor_profile_username_lower_unq` on `lower(username)` | PASS |
| All expected FKs live with correct targets/cascade | live `pg_constraint` query | 5/5 FKs match plan spec exactly | PASS |
| `user` table has no festival/username leakage | live `information_schema.columns` query | 7 columns, none matching `festival_id`/`username`/`display_username` | PASS |
| Case-variant duplicate username rejected live | self-performed insert/insert/cleanup script | `23505` on `visitor_profile_username_lower_unq`; cleanup verified 0 residue | PASS |
| `db:generate` is idempotent | self-run `pnpm --filter @festipal/db db:generate` | "No schema changes, nothing to migrate"; no new files | PASS |
| `__drizzle_migrations` matches local journal | live query on `drizzle.__drizzle_migrations` | 3 rows, matching `0000/0001/0002` tags in `_journal.json` | PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| PLAT-01 | 01-01, 01-02, 01-03 | A single global `Account` underpins identity (`Account` → `VisitorProfile`); app users are global and NOT festival org-members | SATISFIED | All 4 ROADMAP SCs verified above; `REQUIREMENTS.md` already marks PLAT-01 `[x]` / "Complete" (line 43, 96), and this verification confirms that status is accurate against the actual codebase and live database, not merely asserted. |

No orphaned requirements found — REQUIREMENTS.md maps only PLAT-01 to Phase 1, and it is claimed by all three plans.

### Anti-Patterns Found

None. Scanned all created/modified schema and contracts files (`auth.ts`, `auth-schemas.ts`, `visitor-profile.ts`, `my-festival.ts`, `index.ts`, `contracts/src/schemas.ts`) for `TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER`, empty-implementation patterns, and hardcoded-empty-data patterns — zero matches. No debt markers.

### Human Verification Required

None. This is a schema-only phase; every claim was directly verifiable via source inspection, automated typecheck/build, and live database queries — no UI, real-time, or subjective-quality surface exists at this layer.

### Deviations from Plan Noted (informational, not gaps)

- 01-02 discovered `drizzle-zod@0.8.x` internally imports `zod/v4`, breaking the workspace's Zod v3 pin (ADR-006), and pinned `drizzle-zod` to `0.7.1` exact instead of the RESEARCH-recommended `^0.8.3`. Verified: `packages/db/package.json` has `"drizzle-zod": "0.7.1"` (no caret); confirmed as the only `drizzle-zod` reference in any `package.json`; `contracts typecheck` passes. This was an in-tracer course-correction, not a deviation that weakens the phase goal — it is the exact kind of dead-end the tracer slice (Plan 02) was designed to catch early.

## Gaps Summary

None. All 4 ROADMAP success criteria, all 17 plan-level must-have truths, and all 7 prohibitions
are verified against the actual codebase and the live Neon database — not merely asserted by
SUMMARY.md. Automated typecheck/build/contracts checks were re-run independently and pass. The
case-insensitive username uniqueness invariant (a behavior-dependent truth) was independently
re-proven with a live duplicate-insert against Neon, not just re-read from the SUMMARY's prior
run. No stubs, no orphaned artifacts, no hollow data flow, no debt markers, no prohibition
violations. Phase 1's schema goal is achieved and ready for Phase 2 auth wiring.

---

*Verified: 2026-07-30*
*Verifier: Claude (gsd-verifier)*
