---
phase: 10-activities-backend
plan: 05
subsystem: api
tags: [vitest, information_schema, ts-rest, tenancy, security]

requires:
  - phase: 10-activities-backend
    provides: "activity/activity_participant/activity_tag/activity_tag_translation/festival_activity_tag tables + tag-list/create/join/leave/delete/discovery/detail endpoints (plans 10-01–10-04) — the entire surface this plan proves is festivalId-isolated"
provides:
  - "apps/api/test/activity-tenant-isolation.spec.ts — the HTTP-level, serialized-body cross-tenant proof for every table this phase created, including the nullable-activity_tag exception as its own three-case block and the three write paths (join/leave/delete)"
  - "apps/api/test/activity-tenant-structure.spec.ts — the information_schema + contract-walk structural proof: festival_id NOT NULL per table (two named exceptions), activity_participant_activity_fk bound to exactly (activity_id, festival_id), and zero client-supplied-scope keys across every activity-shaped route"
  - "SEC-03 marked complete in REQUIREMENTS.md with a traceability row naming both specs"
affects: [11-activities-ui, 12-lobby-chat]

actuals:
  tokens: 8000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "One describe block per festival-scoped table (not per endpoint), each pairing an absence assertion against the SERIALIZED body with a non-vacuum gegenprobe under the correct festival's own path — the same table-per-block shape as the plan's must_haves, so a missing table cannot hide behind a passing endpoint-shaped test"
    - "Structural exception lists instead of positive lists (projection-uniqueness.spec.ts's doctrine, reused here): TENANT_TABLES/NULLABLE_FESTIVAL_ID_TABLES/FORBIDDEN_SCOPE_KEYS are all named, justified deviations or prohibitions, never a list of routes already known to be safe — so a later phase's new table or route is caught by construction, not by someone remembering to extend a list"
    - "A manually injected, manually reverted violation (a temporary visitorId added to listActivities' query schema, rebuilt, spec re-run red, then reverted and rebuilt again) as the authoring-time proof that the contract-walk check is not vacuous — the same non-vacuum discipline the acceptance criteria demanded, performed and then removed rather than left as a permanent mutation test"

key-files:
  created:
    - apps/api/test/activity-tenant-isolation.spec.ts
    - apps/api/test/activity-tenant-structure.spec.ts
  modified:
    - .planning/workstreams/mobile/REQUIREMENTS.md

key-decisions:
  - "Only two real OTP sign-ins (visitorA, visitorB) suffice for the entire behavioral spec — Discovery/detail carry no membership gate (ADR-014), so either visitor's session can query BOTH festivals' paths for absence and gegenprobe checks; a third caller was unnecessary and would have pushed against better-auth's 3-requests/60s rate limiter for no added coverage"
  - "The creator-is-participant transaction (D-07, 10-02) does double duty as the fixture's 'one participation of the associated visitor' — no separate join call or direct activity_participant insert was needed beyond the creator's own automatic row"
  - "activity_tag_translation's FK to activity_tag is asserted by column name + foreign table/column, not by drizzle's auto-generated constraint name (activity_tag_translation_tag_id_activity_tag_id_fk) — asserting the generated name would make the spec brittle to a column rename that drizzle-kit would happily re-derive a new constraint name for"
  - "Part 2's forbidden-key walk checks only TOP-LEVEL body/query keys, not a recursive descent like projection-uniqueness.spec.ts's collectKeys — every activity route's body/query is a flat object (createActivityBodySchema's geo sub-object is the only nesting, and geo carries no identity key), so a shallow check is the correct scope, not a missed generalization"

requirements-completed: [SEC-03]

coverage:
  - id: D1
    description: "Every table this phase created has a non-vacuum cross-tenant HTTP proof, including the nullable-activity_tag exception (three sub-cases: global-effective-in-both, own-tag-leaks-in-neither-direction, foreign-tag-id-refused-404) and the three write paths (join/leave/delete) leaving the foreign festival's rows untouched"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/activity-tenant-isolation.spec.ts (12 cases across activity, activity_participant, activity_tag, festival_activity_tag, activity_tag_translation, write-paths)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Structural invariants proven against the LIVE database and the published contract: festival_id NOT NULL per table with two named exceptions (activity_tag nullable, activity_tag_translation column-less-but-FK-bound), activity_participant_activity_fk bound to exactly (activity_id, festival_id), and zero client-supplied-scope keys across >=7 activity-shaped routes — non-vacuum gegenprobe (injected visitorId) run and reverted during authoring"
    requirement: SEC-03
    verification:
      - kind: integration
        ref: "apps/api/test/activity-tenant-structure.spec.ts (6 cases across Part 1 information_schema and Part 2 contract walk)"
        status: pass
    human_judgment: false
  - id: D3
    description: "SEC-03 is marked complete in REQUIREMENTS.md with a traceability row naming the two proof specs"
    requirement: SEC-03
    verification:
      - kind: other
        ref: "git diff --stat .planning/workstreams/mobile/REQUIREMENTS.md — 2 lines changed (checkbox + traceability row), no other line touched"
        status: pass
    human_judgment: false

duration: ~18min
completed: 2026-08-15
status: complete
---

# Phase 10 Plan 05: Cross-Tenant Proof Pass — SEC-03 Summary

**Two proof specs — activity-tenant-isolation.spec.ts (HTTP behavior over the serialized body) and activity-tenant-structure.spec.ts (information_schema + contract walk) — close out SEC-03 for every table Phase 10 created, with the nullable-activity_tag exception carrying its own three-case block and a genuinely non-vacuum contract-walk check proven by a temporary, reverted injected violation.**

## Performance

- **Duration:** ~18 min (three tasks, fully autonomous, no checkpoints)
- **Started:** 2026-08-15T00:04:00Z (approx., following 10-04's completion)
- **Completed:** 2026-08-15T00:21:55Z
- **Tasks:** 3
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- `apps/api/test/activity-tenant-isolation.spec.ts`: one `describe` block per table (`activity`, `activity_participant`, `activity_tag`, `festival_activity_tag`, `activity_tag_translation`) plus a write-paths block, each proving a festival-B value never appears in a festival-A response — checked against `JSON.stringify(res.body)`, not the parsed array, with a non-vacuum gegenprobe under the correct festival's own path alongside every absence assertion. The `activity_tag` block carries all three required sub-cases (global tag effective in both festivals; a festival-own tag leaks in neither direction, checked bidirectionally by id AND title; a foreign tag id on create is refused 404). Only two real OTP sign-ins for the whole file. 12/12 tests pass.
- `apps/api/test/activity-tenant-structure.spec.ts`: Part 1 proves against the LIVE database that every Phase-10 table but `activity_tag` carries a NOT NULL `festival_id`, with `activity_tag` asserted explicitly nullable and `activity_tag_translation` asserted explicitly column-less-but-FK-bound to `activity_tag`; `activity_participant_activity_fk` is proven to bind exactly `(activity_id, festival_id)`. Part 2 walks the published contract for every route whose path names `activities`/`my-activities`/`activity-tags` (8 routes found, exceeding the 7-route non-vacuum floor) and asserts none of them accepts a caller/tenant identity key in `body` or `query`, via a forbidden-key set rather than a positive route list. 6/6 tests pass.
- The Part 2 non-vacuum gegenprobe required by the acceptance criteria was actually run: a temporary `visitorId` was added to `listActivities`' query schema, `@quiks/contracts` rebuilt, the structure spec re-run (confirmed RED with the exact expected offender), then the change was reverted and the package rebuilt again — `git diff` on `router.ts` and the built `dist/` output confirmed zero residual change before continuing.
- `.planning/workstreams/mobile/REQUIREMENTS.md`: SEC-03 checkbox checked and its traceability row now names both proof specs instead of "Planned" — a targeted 2-line diff, no other requirement or ACT checkbox touched. The known `gsd-tools requirements.mark-complete` workstream-layout gap (carried in STATE.md since Phase 7) applied again, so this was done by hand as the plan anticipated.
- Full `apps/api` suite: 197/197 across 23 files (179 baseline + 18 new). `pnpm --filter @quiks/api typecheck`, workspace `pnpm lint`, and workspace `pnpm typecheck` all green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Cross-Tenant-Verhaltensnachweis über jede neue Fläche (SEC-03, Erfolgskriterium 1)** - `11d5b92` (test)
2. **Task 2: Strukturelle Mandanten-Invarianten — Mandantenspalte, zusammengesetzter Fremdschlüssel, kein client-gesetzter Scope** - `7f1ea19` (test)
3. **Task 3: SEC-03 in REQUIREMENTS.md abhaken und die Traceability von Hand nachziehen** - `5298a8a` (docs)

**Plan metadata:** commit follows this SUMMARY.

## Files Created/Modified

- `apps/api/test/activity-tenant-isolation.spec.ts` - HTTP-level, serialized-body cross-tenant proof, one describe block per table plus write-paths (12 test cases)
- `apps/api/test/activity-tenant-structure.spec.ts` - information_schema + contract-walk structural proof, two parts (6 test cases)
- `.planning/workstreams/mobile/REQUIREMENTS.md` - SEC-03 checkbox + traceability row

## Decisions Made

- Only two real OTP sign-ins (`visitorA`, `visitorB`) suffice for the entire behavioral spec — Discovery/detail carry no membership gate (ADR-014), so either visitor's session can query BOTH festivals' paths; a third caller was unnecessary and would have pushed against better-auth's 3-requests/60s rate limiter for no added coverage.
- The creator-is-participant transaction (D-07, 10-02) does double duty as the fixture's "one participation of the associated visitor" — no separate join call or direct `activity_participant` insert was needed beyond the creator's own automatic row.
- `activity_tag_translation`'s FK to `activity_tag` is asserted by column name + foreign table/column via `information_schema`, not by drizzle's auto-generated constraint name — asserting the generated name would make the spec brittle to a column rename drizzle-kit would happily re-derive a new name for.
- Part 2's forbidden-key walk checks only TOP-LEVEL `body`/`query` keys, not a recursive descent like `projection-uniqueness.spec.ts`'s `collectKeys` — every activity route's body/query is a flat object (the one nested `geo` sub-object carries no identity key), so a shallow check is the correct scope for this contract, not a missed generalization.

## Deviations from Plan

None - plan executed exactly as written. All three tasks' acceptance criteria were verified directly (12+6 new test cases, the manually-run-and-reverted non-vacuum gegenprobe on Part 2, full suite/typecheck/lint runs, and a `git diff --stat` confirming the REQUIREMENTS.md edit's line count) with no auto-fixes required.

## Issues Encountered

- The first run of the Part 2 non-vacuum gegenprobe (injected `visitorId` into `listActivities`' query schema) passed green instead of failing — `apps/api` resolves `@quiks/contracts` through its built `dist/` output, so editing `router.ts` alone had no effect until `pnpm --filter @quiks/contracts build` was run. Rebuilding, then re-running the spec, produced the expected RED result; the same rebuild step was repeated after reverting the change, confirmed by a clean `git diff` on `router.ts`. Same build-order note already carried from 10-01's summary, now also relevant for hand-run mutation checks, not just typechecks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SEC-03 is the last requirement this phase carries; with it complete, Phase 10 (activities-backend) has delivered its entire planned surface — tags, create, join/leave/delete, discovery/detail, and now the dedicated tenant-isolation proof pass — with a fully green 197/197 `apps/api` suite.
- No blockers. The local Docker Postgres is unchanged (no new migration in this plan); every fixture row in both new specs self-cleans in `afterAll`, and the one manual contract mutation performed during authoring was fully reverted and rebuilt before the final commit.
- Phase 11 (activities UI) can now build against a substrate whose tenant isolation is proven both behaviorally and structurally, not merely assumed from the individual plans' own per-endpoint tests.

## Self-Check: PASSED

- `apps/api/test/activity-tenant-isolation.spec.ts` exists — FOUND
- `apps/api/test/activity-tenant-structure.spec.ts` exists — FOUND
- Commits `11d5b92`, `7f1ea19`, `5298a8a` all present in `git log --oneline` — FOUND
- `pnpm --filter @quiks/api typecheck` — PASS
- `apps/api` full suite — 197/197 PASS (23 files)
- `pnpm lint` (workspace) — PASS
- `pnpm typecheck` (workspace) — PASS
- `.planning/workstreams/mobile/REQUIREMENTS.md` shows SEC-03 as `[x]` with traceability naming both specs — CONFIRMED
- `git diff --stat .planning/workstreams/mobile/REQUIREMENTS.md` — 2 lines changed, no other requirement touched — CONFIRMED
- `git status --short` — clean working tree after all verification builds — CONFIRMED

---
*Plan: 10-05*
*Completed: 2026-08-15*
