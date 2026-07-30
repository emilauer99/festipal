---
phase: 01-identity-schema-auth-foundation
plan: 01
subsystem: database
tags: [better-auth, drizzle, drizzle-zod, drizzle-orm, postgres, auth, identity, zod, multi-tenant]

# Dependency graph
requires:
  - phase: 00-scaffold (existing packages/db)
    provides: "Drizzle schema conventions (_shared.ts idColumn/timestamps, festival/tag tables, snake_case casing, barrel index.ts), createDatabase() client, drizzle.config.ts"
provides:
  - "Vendored better-auth core tables (user/Account, session, account, verification) as CLI-owned schema/auth.ts with a regenerate contract"
  - "drizzle-zod insert+select base schemas for all four auth tables (auth-schemas.ts) for packages/contracts to compose on"
  - "Minimal auth.config.ts that shapes the CLI schema output (emailOTP only; no org/username plugins; no runtime wiring)"
  - "ADR-021 recording the Account->VisitorProfile separate-table identity model and the deliberate rejection of the organization + username plugins"
  - "Confirmed spike outcome: `auth generate` needs no live DB and no BETTER_AUTH_SECRET"
affects: [01-02 (visitor_profile/my_festival tracer + first migration), 01-03, phase-02-auth-runtime, packages-contracts]

# Tech tracking
tech-stack:
  added: ["better-auth@1.6.25 (pinned)", "auth@1.6.25 (dev CLI, pinned)", "drizzle-zod@^0.8.3"]
  patterns:
    - "Vendored/CLI-owned schema file with an in-file provenance header + regenerate command (schema/auth.ts)"
    - "Hand-written drizzle-zod base schemas colocated in a sibling file so regeneration never clobbers them (auth-schemas.ts)"
    - "auth.config.ts as a schema-shaping-only config (no runtime wiring); plugins declared here decide which tables the CLI emits"

key-files:
  created:
    - packages/db/auth.config.ts
    - packages/db/src/schema/auth.ts
    - packages/db/src/schema/auth-schemas.ts
  modified:
    - packages/db/package.json
    - packages/db/src/schema/index.ts
    - docs/DEVELOPMENT_DECISIONS.md
    - pnpm-lock.yaml

key-decisions:
  - "D-01 accepted: vendor better-auth's four core tables via the `auth` CLI (not the stale @better-auth/cli); keep text ids; document regenerate command in-file."
  - "D-02 accepted: packages/db exports drizzle-zod base schemas; drizzle-zod@0.8.3 emits Zod v3-compatible schemas (workspace pinned zod@3.25.76)."
  - "D-03 accepted (governs Plan 02 visitor_profile — restated at the plan's decision checkpoint, not implemented here)."
  - "D-04 accepted (governs Plan 02/03 identity linkage — restated at the plan's decision checkpoint, not implemented here)."
  - "better-auth@1.6.25 and auth@1.6.25 pinned EXACTLY (no caret) as the supply-chain mitigation for their [SUS] too-new flag; drizzle-zod uses the normal ^ range."
  - "organization and username plugins deliberately NOT declared in auth.config.ts (asserted absent from the generated user table)."

patterns-established:
  - "Pattern 1: Vendored/CLI-owned schema file with a regenerate contract (provenance header names the exact `auth generate` command; do-not-hand-edit)."
  - "Pattern 3: drizzle-zod base schema per table, colocated (here in a sibling file for the generated auth tables), exported from the barrel."

requirements-completed: [PLAT-01]

coverage:
  - id: D1
    description: "better-auth + drizzle-zod (runtime) and auth CLI (dev) installed into packages/db, with better-auth/auth pinned exactly as a supply-chain mitigation; @better-auth/cli absent."
    requirement: "PLAT-01"
    verification:
      - kind: manual_procedural
        ref: "packages/db/package.json — better-auth 1.6.25 + drizzle-zod ^0.8.3 under dependencies; auth 1.6.25 under devDependencies; @better-auth/cli absent"
        status: pass
    human_judgment: false
  - id: D2
    description: "schema/auth.ts vendored from better-auth CLI with the four core tables (text ids), a GENERATED/do-not-hand-edit provenance header + regenerate command; user table has NO festivalId and NO username/displayUsername columns."
    requirement: "PLAT-01"
    verification:
      - kind: manual_procedural
        ref: "packages/db/src/schema/auth.ts — header present; user/session/account/verification exported; user cols = id,name,email,emailVerified,image,createdAt,updatedAt (no festivalId, no username/displayUsername)"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/db typecheck (tsc --noEmit)"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/db build (tsup ESM+CJS+DTS)"
        status: pass
    human_judgment: false
  - id: D3
    description: "auth-schemas.ts exports drizzle-zod insert+select bases for all four auth tables, in a separate file from auth.ts so regeneration never clobbers them; barrel re-exports ./auth and ./auth-schemas."
    requirement: "PLAT-01"
    verification:
      - kind: manual_procedural
        ref: "packages/db/src/schema/auth-schemas.ts — 8 named exports (user/session/account/verification × insert/select); packages/db/src/schema/index.ts re-exports both"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/db typecheck + build"
        status: pass
    human_judgment: false
  - id: D4
    description: "ADR-021 records the Account->VisitorProfile separate-table model, gate-less my_festival, and the explicit rejection of the organization + username plugins, citing ADR-009/014/016 (SC-4)."
    requirement: "PLAT-01"
    verification:
      - kind: manual_procedural
        ref: "docs/DEVELOPMENT_DECISIONS.md — ADR-021 section"
        status: pass
    human_judgment: false

# Metrics
duration: ~12min (active execution; excludes the two blocking checkpoint round-trips)
completed: 2026-07-30
status: complete
---

# Phase 1 Plan 01: Identity Schema & Auth Foundation Summary

**Vendored better-auth's four core identity tables (user/session/account/verification, text ids) into packages/db via the `auth` CLI with a regenerate contract, added colocated drizzle-zod base schemas, and recorded the Account->VisitorProfile identity model as ADR-021 — package typechecks + builds clean.**

## Performance

- **Duration:** ~12 min active execution (two blocking checkpoints — a decision gate and a blocking-human supply-chain gate — were relayed to the user between tasks and are excluded from this figure)
- **Started:** 2026-07-30 (Task 3 execution after both checkpoints cleared)
- **Completed:** 2026-07-30
- **Tasks:** 3 (Task 1 decision + Task 2 human-verify checkpoints resolved; Task 3 auto executed)
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments
- Installed and pinned `better-auth@1.6.25` + `auth@1.6.25` (exact, as the supply-chain mitigation) and `drizzle-zod@^0.8.3`; confirmed the stale `@better-auth/cli` is NOT used.
- Vendored the four better-auth core tables into `schema/auth.ts` via `auth generate`, with a provenance header naming the exact regenerate command; verified the `user` (Account) table carries NO `festivalId` and NO `username`/`displayUsername` columns.
- Added a sibling `auth-schemas.ts` with hand-written drizzle-zod insert+select bases for all four tables (regeneration-safe) and wired both files into the schema barrel.
- Recorded the identity model (Account -> separate VisitorProfile table; gate-less `my_festival`; org/username plugins rejected) as ADR-021, citing ADR-009/014/016.
- `pnpm --filter @festipal/db typecheck`, `build`, and `lint` all exit 0.

## `auth generate` Spike Outcome (Open Question 1)

**Result: the CLI needed NO live database connection and NO `BETTER_AUTH_SECRET`.**

Command run (from `packages/db`):
```
pnpm exec auth generate --adapter drizzle --dialect postgresql \
  --config ./auth.config.ts --output ./src/schema/auth.ts --yes
```
`auth.config.ts` declares a `betterAuth({ plugins: [emailOTP({...})] })` instance with **no `database` adapter at all**. Generation succeeded ("Schema was generated successfully!"), emitting the exact four-table shape predicted by RESEARCH.md's CLI test-fixture. The only output was a harmless `WARN: Base URL is not set` (irrelevant to schema generation). The planned fallbacks (constructing a `db` via `createDatabase(DATABASE_URL_UNPOOLED)` purely to satisfy the adapter, or adding a `BETTER_AUTH_SECRET` placeholder to `.env.example`) were therefore **NOT needed** — `.env.example` was left untouched. `emailOTP` added no extra table (OTP state reuses the core `verification` table), confirming research assumption A2.

## Task Commits

Task 3 was committed in three atomic logical units:

1. **Deps: better-auth + drizzle-zod + auth CLI** - `f108b80` (chore)
2. **Vendor auth schema + drizzle-zod bases** - `4c617d3` (feat)
3. **Record identity-model ADR-021** - `ea291cc` (docs)

Tasks 1 and 2 were checkpoints (a `decision` gate and a `blocking-human` supply-chain gate) — resolved by the user, no code artifact, no commit.

## Files Created/Modified
- `packages/db/auth.config.ts` (created) - Minimal betterAuth instance (emailOTP only) that shapes the CLI schema output; no runtime wiring, no org/username plugins.
- `packages/db/src/schema/auth.ts` (created) - Generated/vendored better-auth core tables (user/session/account/verification, text ids) with a do-not-hand-edit provenance header + regenerate command.
- `packages/db/src/schema/auth-schemas.ts` (created) - Hand-written drizzle-zod insert+select bases for all four auth tables (separate from auth.ts so regeneration never clobbers them).
- `packages/db/src/schema/index.ts` (modified) - Barrel extended with `./auth` and `./auth-schemas`.
- `packages/db/package.json` (modified) - better-auth 1.6.25 + drizzle-zod ^0.8.3 (deps); auth 1.6.25 (devDeps).
- `docs/DEVELOPMENT_DECISIONS.md` (modified) - Added ADR-021 (identity-schema implementation decision).
- `pnpm-lock.yaml` (modified) - Lockfile for the new deps.

## Decisions Made
- **All four defaults (D-01..D-04) accepted as researched** — user answered the Task 1 decision checkpoint with "accept all". D-01/D-02 are implemented in this plan; D-03/D-04 govern Plan 02/03 and were restated at the checkpoint per the plan.
- **Exact pinning for better-auth/auth** — used `add better-auth@1.6.25` / `add -D auth@1.6.25` (pnpm records these without a caret) so the supply-chain mitigation actually pins; drizzle-zod uses the normal `^` range (it was `[OK]`, not `[SUS]`).
- **Selectively-not-selective drizzle-zod bases** — followed Open Question 2's recommendation and exported bases for ALL four vendored auth tables (near-zero cost, avoids a Phase 2 "why no `user` base?" surprise).

## Deviations from Plan

None - plan executed exactly as written. The `auth generate` spike's uncertain branches (needs-a-DB / needs-a-secret) both resolved to "not needed", so the planned fallbacks were correctly skipped rather than deviated around.

## Issues Encountered
None. Typecheck, build, and lint all passed on the first run; the CLI-generated schema (double-quote style) did not trip eslint.

## User Setup Required
None - no external service configuration required this plan. No `BETTER_AUTH_SECRET` was needed for schema generation (runtime auth env/wiring is Phase 2).

## Next Phase Readiness
- Plan 02 (tracer) can now hand-write `visitor_profile` (PK = text `accountId` FK -> `user.id` cascade) and `my_festival` against these vendored tables, then run the first Drizzle migration + Neon apply (bundling the auth tables) as the tracer slice.
- `packages/contracts` (Phase 2) can import the drizzle-zod bases from `@festipal/db` to compose API shapes; the `contracts -> db` build edge is not yet exercised (first use is Phase 2).
- No Neon migration was run in this plan by design (tracer-first: Plan 02 owns the first migration).

## Self-Check: PASSED

- `packages/db/auth.config.ts` — FOUND
- `packages/db/src/schema/auth.ts` — FOUND (header + 4 tables, user has no festivalId/username)
- `packages/db/src/schema/auth-schemas.ts` — FOUND (8 drizzle-zod exports)
- `packages/db/src/schema/index.ts` — FOUND (re-exports ./auth + ./auth-schemas)
- `docs/DEVELOPMENT_DECISIONS.md` — FOUND (ADR-021)
- Commits `f108b80`, `4c617d3`, `ea291cc` — all present in `git log`

---
*Phase: 01-identity-schema-auth-foundation*
*Completed: 2026-07-30*
