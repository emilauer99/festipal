---
phase: 04-visitor-auth-profile-completion
plan: 02
subsystem: design-system, database
tags: [zod, drizzle-zod, design-tokens, react-native, expo, festipal-brand]

# Dependency graph
requires:
  - phase: 04-01
    provides: Vitest runner + font module (mobile) that later screens build on
provides:
  - "packages/ui/src/tokens.ts real festipal brand token set (dark + light) — single source of truth for Phases 4/5/6 screens"
  - "D-03 server-side username/displayName caps on the visitor_profile drizzle-zod schema, proven by tests"
affects: [04-03, 04-04, 04-05, 04-06]

# Actuals (#2632)
actuals:
  tokens: 3340
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "packages/ui/src/tokens.ts extended (not replaced) with dark-first semantic role aliases + light variant map"
    - "D-03 name caps added to the EXISTING drizzle-zod .extend() z.string() values, not via createInsertSchema's refinement callback (Pitfall 4)"

key-files:
  created: []
  modified:
    - packages/ui/src/tokens.ts
    - packages/db/src/schema/visitor-profile.ts
    - apps/api/test/username-race.spec.ts
    - apps/api/test/me-endpoints.spec.ts
    - apps/api/test/bodyparser-smoke.spec.ts

key-decisions:
  - "Real festipal brand tokens ported into the EXISTING tokens.ts export shape (spacing/radii/fontSizes/fontWeights/colors/tokens), extended with spacingScale, layout, fontFamilies, typeRoles, and dark+light colors/lightColors — one token set, not a competing third"
  - "D-03 caps (.min/.max/.regex) added to the pre-existing .extend() z.string() block on both visitorProfileInsertSchema and visitorProfileSelectSchema — NOT createInsertSchema's refinement callback (Pitfall 4: that re-triggers the documented text()->unknown inference bug)"
  - "No db:push required for D-03 — validation-only Zod refinement; avatar text() column and username_lower unique index already exist from Phase 1"
  - "completeProfileBodySchema/visitorProfilePublicSchema in packages/contracts left untouched — caps flow up automatically via .pick() composition (Pitfall 6)"
  - "Fixed 3 pre-existing HTTP-integration test fixtures (me-endpoints.spec.ts x2, bodyparser-smoke.spec.ts x1) that generated usernames with a dash or relied on uppercase — those are no longer valid input through the now-capped complete-profile endpoint; switched to underscore-separated lowercase fixtures, and changed the case-variant-duplicate assertion to a same-account resubmit (still proves the 409 PK-conflict path); the true case-insensitive TOCTOU path remains proven directly at the DB layer in username-race.spec.ts, which calls MeService.completeProfile() directly and bypasses the Zod boundary"

requirements-completed: [IDN-01]

coverage:
  - id: D1
    description: "packages/ui/src/tokens.ts holds the real festipal brand values (no #4f46e5 placeholder), with dark + light semantic role maps"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/ui build && pnpm --filter @festipal/ui typecheck"
        status: pass
    human_judgment: true
    rationale: "Plan's own <verify> includes a human-check (Festivals list cold-start render on the new palette) — no mobile screen currently imports @festipal/ui yet (verified via grep), so there is nothing to visually regress this plan; the human-check becomes meaningful once 04-03+ wires screens to these tokens."
  - id: D2
    description: "D-03 username (3-20 chars, lowercase a-z0-9_. charset) and displayName (1-40 chars) caps rejected at the Zod parse layer, boundary values accepted, contract types stay concrete"
    requirement: IDN-01
    verification:
      - kind: unit
        ref: "apps/api/test/username-race.spec.ts#D-03 server-side name caps (username/displayName) — 9 tests"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/db typecheck && pnpm --filter @festipal/contracts typecheck"
        status: pass
      - kind: integration
        ref: "pnpm --filter @festipal/api test (full 42-test suite, includes me-endpoints.spec.ts + bodyparser-smoke.spec.ts fixture fixes)"
        status: pass
    human_judgment: false

duration: 45min
completed: 2026-08-05
status: complete
---

# Phase 04 Plan 02: Real Brand Tokens + D-03 Name Caps Summary

**Ported the real festipal dark-first brand token set into `packages/ui` and closed the D-03 server-side username/displayName validation gap on the existing drizzle-zod `.extend()` schema, proven by 9 new Zod-parse-layer tests plus a full green 42-test API suite.**

## Performance

- **Duration:** ~45 min
- **Tasks:** 2
- **Files modified:** 5 (2 primary plan files + 3 pre-existing test fixtures fixed as a direct consequence of Task 2)

## Accomplishments

- `packages/ui/src/tokens.ts` now exports the real festipal palette (`primary #74CC1F`, `bgApp #0C0E13`, full status/text role set) plus a `lightColors` variant, the locked 11-role typography scale, the full `sp-*` spacing ramp, and named layout constants — replacing every placeholder value while keeping the existing export shape intact.
- `visitor_profile`'s drizzle-zod schema now enforces D-03 at the correct layer: `username` `.min(3).max(20).regex(/^[a-z0-9_.]+$/)`, `displayName` `.min(1).max(40)`, added to the existing `.extend()` block (not a second refinement mechanism), on both the insert and select schemas.
- `completeProfileBodySchema`/`visitorProfilePublicSchema` in `@festipal/contracts` stayed untouched and still typecheck to concrete types — no `unknown` regression from the drizzle-zod inference bug the file's own comment warns about.
- `apps/api/test/username-race.spec.ts` gained a new `D-03 server-side name caps` describe block (9 tests) proving the length/regex boundaries at the Zod parse layer via `completeProfileBodySchema.safeParse`, run through the full RED -> GREEN TDD cycle.
- Discovered and fixed 3 pre-existing HTTP-integration test assertions that generated non-compliant usernames (dash, uppercase) — a direct, in-scope consequence of tightening the shared schema; the whole `apps/api` suite (42 tests, 8 files) is green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Port real festipal brand tokens into packages/ui/src/tokens.ts** - `a1ad5df` (feat)
2. **Task 2: D-03 server-side name caps + rejection tests** - RED `0e1c5d1` (test) -> GREEN `ee5db99` (feat)

**Plan metadata:** pending (this commit)

_TDD: Task 2 followed the full RED (7 intentionally-failing new tests against the unmodified schema) -> GREEN (schema caps applied, dist rebuilt, full suite green) cycle. No REFACTOR commit was needed — the GREEN implementation matched the target shape from Pitfall 4's guidance with no follow-up cleanup._

## Files Created/Modified

- `packages/ui/src/tokens.ts` - real brand colors/spacing/radii/fonts/typeRoles, dark + light role maps
- `packages/db/src/schema/visitor-profile.ts` - D-03 `.min/.max/.regex` on the existing `.extend()` username/displayName values (insert + select)
- `apps/api/test/username-race.spec.ts` - new `D-03 server-side name caps` describe block (9 rejection/boundary tests against `completeProfileBodySchema.safeParse`)
- `apps/api/test/me-endpoints.spec.ts` - username fixture switched to underscore (was dash, now charset-invalid); duplicate-username-409 test switched from `.toUpperCase()` case-variant to a same-account resubmit (PK conflict), since true case-variant input can no longer reach this endpoint post-cap
- `apps/api/test/bodyparser-smoke.spec.ts` - username fixture switched to underscore (was dash)

## Decisions Made

- Real festipal brand tokens ported into the EXISTING `tokens.ts` shape — extended, not replaced, so nothing importing `tokens`/`colors`/`spacing`/`radii`/`fontSizes`/`fontWeights` today breaks; new `spacingScale`, `layout`, `fontFamilies`, `typeRoles`, and `lightColors` exports added alongside.
- D-03 caps added to the pre-existing `.extend()` `z.string()` block per Pitfall 4 (RESEARCH.md) — NOT via `createInsertSchema`'s refinement callback, which would re-trigger the documented `text()`-column `unknown` type-inference collapse.
- No `db:push` run or needed — this is a validation-only Zod refinement; the `avatar` `text()` column and `username_lower` unique index were already migrated in Phase 1.
- `packages/contracts/src/schemas.ts` left untouched — `completeProfileBodySchema`/`visitorProfilePublicSchema` are `.pick()`-composed on the drizzle-zod base, so the new caps propagate automatically (Pitfall 6, confirmed by `pnpm --filter @festipal/contracts typecheck` staying green).
- Since D-03 makes usernames lowercase-only at the API boundary, a true case-variant duplicate can never reach `POST /me/complete-profile` through the real HTTP contract anymore. `me-endpoints.spec.ts`'s HTTP-level 409 test was re-purposed to prove the accountId-PK-conflict path (same account, different but still-valid username) instead of a case-variant one; the case-insensitive DB-level TOCTOU proof (`username-race.spec.ts`) is unaffected because it calls `MeService.completeProfile()` directly and bypasses the Zod/ts-rest boundary entirely — by design, since it's testing the DB unique index, not the HTTP validation layer.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug, direct consequence of Task 2] Pre-existing HTTP-integration test fixtures broke under the new D-03 charset/length caps**
- **Found during:** Task 2, after rebuilding `@festipal/db`/`@festipal/contracts` dist and running the full `apps/api` suite (not just the target `username-race.spec.ts` file — the `pnpm --filter @festipal/api test -- username-race` invocation runs the whole suite regardless of the trailing arg, since the script is a bare `vitest run`)
- **Issue:** `me-endpoints.spec.ts` and `bodyparser-smoke.spec.ts` generated usernames like `visitor-${uuid8}` / `bodyparser-${uuid8}` (dash — invalid charset) and one test relied on submitting `username.toUpperCase()` through the live `POST /me/complete-profile` endpoint to simulate a case-variant duplicate — both now correctly rejected with 400 by the new Zod cap, breaking 6 previously-passing tests
- **Fix:** switched the two dash-based username fixtures to underscore-separated lowercase strings (`visitor_${uuid8}`, `bodyparser_${uuid8}`); re-scoped the case-variant-duplicate HTTP test to resubmit a different-but-valid username for the same already-profiled account, which still proves the 409 path via the accountId PK conflict (added a comment explaining the case-insensitive path is proven at the DB layer directly instead, since the API can no longer even accept mixed-case input)
- **Files modified:** `apps/api/test/me-endpoints.spec.ts`, `apps/api/test/bodyparser-smoke.spec.ts`
- **Verification:** `pnpm --filter @festipal/api test` — full suite, 8 files, 42/42 tests green
- **Committed in:** `ee5db99` (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (Rule 1, scoped strictly to fixtures broken by this task's own schema change)
**Impact on plan:** Necessary for correctness — without this fix the plan's own D-03 change would leave the suite red. No scope creep: only the 3 files whose assertions directly depended on the now-invalid input shape were touched; `festival-isolation.spec.ts` and `save-idempotency.spec.ts` also generate dash-containing usernames but insert directly via `db.insert(visitorProfile).values(...)`, bypassing the Zod boundary entirely, so they were correctly left untouched (confirmed still green in the full-suite run).

## Issues Encountered

- `pnpm --filter @festipal/api test -- username-race` does not filter to a single spec file (the underlying `test` script is a bare `vitest run`, so the trailing args are effectively ignored) — the full 8-file suite ran both times, which is how the pre-existing fixture breakage above was caught before it could reach a later plan.
- `@festipal/db`/`@festipal/contracts` are consumed by `apps/api` via their built `dist/` output (package.json `exports` point at `dist/*`), not their TypeScript source — after editing `visitor-profile.ts`, both packages had to be rebuilt (`pnpm --filter @festipal/db build && pnpm --filter @festipal/contracts build`) before the API test suite would see the new caps at runtime. Source-level `tsc --noEmit` typechecks stayed green throughout regardless, since those don't depend on `dist/`.

## Next Phase Readiness

- `packages/ui/src/tokens.ts` is ready for 04-03+ screens to import real brand values from — no mobile screen imports `@festipal/ui` yet (confirmed via grep across `apps/mobile`), so the plan's "Festivals list inherits the new palette" framing applies once a later plan wires the import; there is no current regression to that screen since it still uses its own hardcoded placeholder hex values pending restyle.
- D-03 is closed end-to-end at the server: any client (mobile complete-profile screen in 04-05) submitting an out-of-range username/displayName now gets a clean 400 from the API before ever reaching the DB.
- `apps/api`'s full test suite (42 tests, 8 files), `@festipal/ui`/`@festipal/db`/`@festipal/contracts`/`@festipal/api` typecheck, and lint for all four packages are green.

---
*Phase: 04-visitor-auth-profile-completion*
*Completed: 2026-08-05*

## Self-Check: PASSED

All created/modified files verified present on disk; all 3 task commits (`a1ad5df`, `0e1c5d1`, `ee5db99`) verified present in git log.
