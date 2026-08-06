---
phase: 05-festival-selection-home
plan: 08
subsystem: testing
tags: [turborepo, vitest, expo-router, ci-gate, uat]

# Dependency graph
requires:
  - phase: 05-festival-selection-home
    provides: "all Wave 1-4 plans (05-01..05-07) -- schema/contracts, tokens, festival-home screen, FestivalCard, tabs shell, Meine/Alle segmented list + optimistic save, Home hero/rail"
provides:
  - "A single green monorepo quality gate (typecheck/lint/test/frozen-install/mobile build+export) proving all Phase 5 plans integrate without drift"
  - ".planning/phases/05-festival-selection-home/05-UAT.md -- the persisted 8-step on-device acceptance flow for /gsd-verify-work 5"
affects: [ship-phase-5, phase-06-friends-profile]

# Actuals (#2632)
actuals:
  tokens: 3200
  tasks: 2
  commits: 0

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Phase-wide integration gate as its own final plan (verification-only, no feature code) -- closes the cross-plan reviewer finding that no single plan owned the full-suite + full-acceptance run"

key-files:
  created:
    - .planning/phases/05-festival-selection-home/05-UAT.md
  modified: []

key-decisions:
  - "Task 2 (on-device 8-step acceptance flow) deferred to UAT by explicit user decision at the orchestrator checkpoint (2026-08-06), consistent with the Phase 3/4 convention of deferring real-device verification out of headless execution"
  - "The 8 acceptance steps from the plan's Task 2 <action> block were persisted verbatim as individual UAT tests (status: testing, all pending) rather than run headlessly, so /gsd-verify-work 5 can walk through them with a real Android device"
  - "WINDOWS.md ledger entry 20 (unrun-verify) added for the deferred flow, matching the convention of entries 16/18/19 for prior Phase 5 on-device UATs"

patterns-established: []

requirements-completed: [FEST-01, FEST-02, FEST-03, FEST-04, HOME-01, HOME-02]

coverage:
  - id: D1
    description: "Whole-monorepo quality gate: pnpm typecheck, pnpm lint, pnpm test all green across every workspace package/app; frozen install shows no lockfile drift; apps/mobile typecheck is fresh against a regenerated Expo Router route-type declaration; apps/mobile build (expo export, both platforms) succeeds"
    verification:
      - kind: other
        ref: "pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile build && git diff --exit-code -- pnpm-lock.yaml (all green: typecheck 10/10, lint 10/10, test 7/7 -- api 45/45, i18n 6/6, mobile 52/52; android export 7.3MB, ios export 7.1MB)"
        status: pass
    human_judgment: false
  - id: D2
    description: "On-device 8-step acceptance flow covering all six requirements (FEST-01..04, HOME-01/02) and the cross-plan edges: login->Home, Alle-segment CTA, save exactly-once/persist/rollback, enter/back, cold-start-back-to-shell, cross-account logout hygiene, deep-link precedence over persisted slug, DE/EN date+null-fallback+TalkBack a11y"
    requirement: "FEST-01"
    verification: []
    human_judgment: true
    rationale: "Requires a real Android device (TalkBack, force-quit/relaunch, airplane-mode-style network toggling, DE/EN device-language switch); explicitly deferred by user decision at the orchestrator checkpoint rather than run headlessly. Persisted as .planning/phases/05-festival-selection-home/05-UAT.md (8 pending tests) for /gsd-verify-work 5; also tracked as WINDOWS.md ledger entry 20."

duration: ~5min
completed: 2026-08-06
status: complete
---

# Phase 5 Plan 8: Full Integration Gate + On-Device Acceptance Flow Summary

**Whole-monorepo quality gate (typecheck/lint/test/frozen-install/mobile export) confirmed green; the 8-step on-device acceptance flow deferred to a persisted UAT file per user decision, matching the Phase 3/4 convention.**

## Performance

- **Duration:** ~5 min
- **Tasks:** 2 (1 executed, 1 deferred)
- **Files modified:** 1 created (05-UAT.md)

## Accomplishments
- Task 1: full monorepo gate ran clean end-to-end -- `pnpm install --frozen-lockfile` (no lockfile drift), `pnpm typecheck` (10/10 workspaces), `pnpm lint` (10/10), `pnpm test` (7/7: apps/api 45/45, packages/i18n 6/6, apps/mobile 52/52), `.expo/types/router.d.ts` regenerated via a real dev-server start/stop and confirmed fresher than server start, `pnpm --filter @festipal/mobile typecheck` green against that fresh declaration, `pnpm --filter @festipal/mobile build` (expo export) succeeded for both platforms (android 7.3MB, ios 7.1MB), and `git diff --exit-code -- pnpm-lock.yaml` confirmed no drift. `dist/`/`.expo` generated output stayed gitignored, not committed.
- Task 2's full 8-step on-device acceptance script (from the plan's Task 2 `<action>` block) was persisted verbatim as `.planning/phases/05-festival-selection-home/05-UAT.md` -- one pending test per step, `status: testing`, Summary `total: 8 / pending: 8`, empty Gaps section -- so `/gsd-verify-work 5` can walk a human through it on a real Android device.
- WINDOWS.md broken-windows ledger gained entry 20 (`unrun-verify`, phase 05) documenting the deferral, consistent with entries 16/18/19 already recorded for prior Phase 5 on-device UATs.

## Task Commits

Task 1 was pure verification -- no files changed, so no task commit exists for it (matches the plan's own `files_modified: []` / verification-only framing). Task 2 produced only the new UAT file, committed together with this summary and state updates below (no separate per-task commit, since the deferral itself is the "work" and is fully captured by the plan-metadata commit).

**Plan metadata:** _(this commit, following this summary)_

## Files Created/Modified
- `.planning/phases/05-festival-selection-home/05-UAT.md` - persisted 8-step on-device acceptance flow (all 8 tests pending), ready for `/gsd-verify-work 5`

## Decisions Made
- Task 2 (on-device 8-step acceptance flow) deferred to UAT by explicit user decision at the orchestrator checkpoint (2026-08-06), consistent with how Phase 3/4 handled real-device-only verification: persist the flow as pending UAT tests rather than skip it silently or attempt it headlessly (which the plan's own prohibition already rules out: "Do NOT skip the on-device acceptance flow because the automated gates pass").
- Each of the plan's 8 numbered acceptance-flow steps became its own UAT test entry (not merged into fewer/more tests), preserving the plan author's step boundaries and expected-behavior wording so `/gsd-verify-work 5` can walk them 1:1 against the plan.

## Deviations from Plan

**1. [Rule 4-adjacent, explicit user decision] Task 2 not executed on-device; deferred to persisted UAT**
- **Found during:** Task 2 (On-device end-to-end acceptance flow), presented as a `checkpoint:human-verify` (`gate="blocking-human"` per the plan's on-device-only nature)
- **Issue:** No physical Android device with TalkBack, controllable network conditions, and two provisioned test accounts was available in this execution context; the plan explicitly requires real hardware ("On a real Android device... these paths have no automated coverage").
- **Resolution:** The user, at the orchestrator checkpoint, explicitly chose to defer the flow using the same convention already established for Phase 3 (iOS device UAT) and Phase 4 (12 unrun-verify device UATs, WINDOWS ids 3-14): persist the full flow as a UAT file with all steps pending, add a WINDOWS.md ledger entry, and complete the plan's bookkeeping (SUMMARY, STATE, ROADMAP) without marking the flow as passed.
- **Files created:** `.planning/phases/05-festival-selection-home/05-UAT.md`
- **Verification:** N/A (deliberately deferred, not verified) -- tracked as `human_judgment: true` in this SUMMARY's `coverage:` block (D2) and as WINDOWS.md entry 20.
- **Not committed as a task-level fix**: this is a scope deferral, not a bug fix; no feature code was touched (matches the plan's own "verification-only, do not modify feature code" prohibition).

---

**Total deviations:** 1 (explicit user-approved deferral, not an auto-fix under Rules 1-3)
**Impact on plan:** No feature code changed. The phase's automated gate (Task 1) is fully green and committed to memory via this summary; the on-device flow (Task 2) remains open work tracked in two places (05-UAT.md, WINDOWS.md #20) until a real device session runs it.

## Issues Encountered
None during Task 1. Task 2 was not attempted (see Deviations above) rather than encountering a failure.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 8 plans of Phase 5 (festival-selection-home) are now recorded complete: schema/contracts through Home tab, plus this integration gate.
- The automated monorepo gate (typecheck/lint/test/build) is green and reproducible; there is no known lockfile or route-type drift blocking a future `/gsd-ship`.
- Before `/gsd-ship 5`, the pending on-device UAT (`.planning/phases/05-festival-selection-home/05-UAT.md`, 8/8 pending) should be run via `/gsd-verify-work 5` on a real Android device -- it is the last unverified surface for FEST-01..04/HOME-01/02 and is explicitly named in `.planning/WINDOWS.md` entry 20 as an open item.
- Phase 5 also carries forward the still-open device UATs from entries 16, 18, 19 (05-03, 05-06 Task 1/2) -- all four Phase 5 device UATs can reasonably be run together in one device session before shipping.

## Self-Check: PASSED

- FOUND: .planning/phases/05-festival-selection-home/05-UAT.md
- N/A: no task commits to verify (verification-only Task 1 produced no diff; Task 2 deferred)

---
*Phase: 05-festival-selection-home*
*Completed: 2026-08-06*
