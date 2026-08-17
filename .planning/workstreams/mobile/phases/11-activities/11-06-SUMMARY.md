---
phase: 11-activities
plan: 06
subsystem: ui
tags: [react-native, expo, lingui, vitest, activity-form, i18n]

# Dependency graph
requires:
  - phase: 11-activities (11-03, 11-04, 11-05)
    provides: activity-form.ts's three existing pure rules, activity-create.tsx's create/clone screen, activity-detail.tsx's header wiring
provides:
  - resolveTitleOnTagChange and resolveSubmittedTitle pure rules (lib/activity-form.ts)
  - activity-create.tsx tag-select writes a real, editable title value instead of a placeholder-only preview
  - Placeholder-annotation msgid removed from both Lingui catalogs (moved to obsolete block via lingui extract)
  - 11-UI-SPEC.md, 11-CONTEXT.md and 11-UAT.md reconciled with the built G-11-3 behavior
affects: [phase-12-lobby-chat]

# Actuals (#2632)
actuals:
  tokens: 5834
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure tag-change/submit rules in lib/activity-form.ts (node-env Vitest testable, no RN harness needed) instead of screen-local branching"

key-files:
  created: []
  modified:
    - apps/mobile/lib/activity-form.ts
    - apps/mobile/lib/__tests__/activity-form.test.ts
    - apps/mobile/app/activity-create.tsx
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po
    - .planning/workstreams/mobile/phases/11-activities/11-UI-SPEC.md
    - .planning/workstreams/mobile/phases/11-activities/11-CONTEXT.md
    - .planning/workstreams/mobile/phases/11-activities/11-UAT.md

key-decisions:
  - "resolveTitleOnTagChange matches only on strict equality against the previous tag's raw label (no trim/case-fold/substring) so typed text can never be silently overwritten"
  - "resolveSubmittedTitle nulls the title at submit time when it still exactly equals the selected tag's label, preserving the server's per-locale auto-title resolution (10-04/ADR-012) instead of freezing the creator's locale into the record"
  - "G-11-2 (header) closed via diagnosis-confirmed-by-elimination, not a code change: the localization chain (Lingui macro + DE catalog entry) was already correct pre-UAT; only the UAT/spec wording cited the English msgid as the DE expectation, which is now fixed in 11-UAT.md"

patterns-established:
  - "Tag→title coupling as two pure rules in lib/activity-form.ts, wired by the screen's tag-chip handler computing the next tag exactly once and feeding it into both the tag-state write and the functional title-state updater"

requirements-completed: [ACT-01, ACT-02]

coverage:
  - id: D1
    description: "resolveTitleOnTagChange writes the selected tag's label into the title field as real, editable text on empty-field or exact-match-with-previous-label, and never touches a user-typed title otherwise (including the clone-mount case)"
    requirement: "ACT-01"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/activity-form.test.ts#resolveTitleOnTagChange (G-11-3 — tag selection writes the title, typed text always survives)"
        status: pass
    human_judgment: false
  - id: D2
    description: "resolveSubmittedTitle nulls the submitted title when it still exactly equals the selected tag's label (trimmed comparison), so the server's per-locale auto-title resolution is preserved; otherwise it returns the trimmed explicit title"
    requirement: "ACT-01"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/activity-form.test.ts#resolveSubmittedTitle (G-11-3 — what rides as `title` in the request body)"
        status: pass
    human_judgment: false
  - id: D3
    description: "activity-create.tsx's tag-chip handler computes the next tag once and writes it into both the tag state and, via resolveTitleOnTagChange, the title state; the placeholder is unconditional again; submit sends the title exclusively via resolveSubmittedTitle; no active msgid remains for the removed placeholder annotation in either Lingui catalog"
    requirement: "ACT-01"
    verification:
      - kind: unit
        ref: "cd apps/mobile && pnpm typecheck && pnpm lint && pnpm exec vitest run — exit 0 (384 tests)"
        status: pass
      - kind: manual_procedural
        ref: "Task 2 <human-check>: six on-device prefill cases (placeholder, tag-select writes label, typed text survives tag switch, deselect clears unchanged label, deselect keeps edited text, submit with unchanged label lands with the expected title) — WINDOWS.md unrun-verify entry recorded"
        status: unknown
    human_judgment: true
    rationale: "No RN component test harness exists in this project (STATE.md structural limitation) — the actual on-screen behavior can only be confirmed on a physical/emulated device, which this executor did not have access to."
  - id: D4
    description: "G-11-2 device falsification: on a DE-locale device with a cold Metro cache, the activity-detail header shows 'Aktivität', not 'Activity'"
    requirement: "ACT-02"
    verification:
      - kind: manual_procedural
        ref: "Task 3 <human-check>: expo start -c, DE device, open /activity-detail, expect 'Aktivität'; EN gegenprobe expects 'Activity' — WINDOWS.md unrun-verify entry recorded"
        status: unknown
    human_judgment: true
    rationale: "Diagnosis (.planning/debug/activity-detail-header-title.md) confirmed the localization chain is already correct by elimination, but the plan explicitly treats the human-check as the falsification test of that diagnosis, not a formality — only a physical DE-locale device can close it, which this executor did not have."
  - id: D5
    description: "11-UI-SPEC.md, 11-CONTEXT.md and 11-UAT.md describe the built G-11-3 behavior instead of the old placeholder-only design; 11-UAT.md's byte-identical constraint (only the two expected: lines changed) holds"
    requirement: "ACT-01"
    verification:
      - kind: other
        ref: "grep/awk verify command from 11-06-PLAN.md Task 3 <automated> — exit 0 (all four checks passed)"
        status: pass
    human_judgment: false

# Metrics
duration: ~20min
completed: 2026-08-16
status: complete
---

# Phase 11 Plan 06: Gap Closure (G-11-2, G-11-3) Summary

**Tag selection now writes its label into the create-form's title field as real, editable text via two new pure rules (`resolveTitleOnTagChange`/`resolveSubmittedTitle`), and the DE header-title gap closed as a spec/UAT wording fix — no code defect was found in the localization chain.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 3/3
- **Files modified:** 8

## Accomplishments

- `lib/activity-form.ts` gained two framework-free pure rules: `resolveTitleOnTagChange` (tag selection writes an editable title value, never clobbering typed text) and `resolveSubmittedTitle` (nulls the submitted title on an unchanged tag-label match so the server's per-locale auto-title survives) — 17 new test cases, including the clone-mount tolerance case, all green (39/39 in the file, 384/384 project-wide).
- `activity-create.tsx`'s tag-chip handler now computes the next tag exactly once and feeds it into both the tag-state write and a functional title-state update; the placeholder is unconditional again (`e.g. beer pong by the pavilion`), and submit sends the title exclusively through `resolveSubmittedTitle`.
- `lingui extract` moved the now-unused placeholder-annotation msgid (`{tagLabel} (used as the title automatically)` / German counterpart) into the obsolete block in both catalogs — no active entry left, no new msgid introduced.
- `11-UI-SPEC.md`, `11-CONTEXT.md` (dated change note under D-05, original wording preserved) and `11-UAT.md` (only the two `expected:` lines of Tests 2 and 3, byte-identical elsewhere) now describe the shipped behavior.
- G-11-2 investigated to a diagnosis-confirmed-by-elimination conclusion: the header's localization chain (`AppHeader.tsx`'s Lingui macro + the DE catalog's `Aktivität` translation) was already correct before UAT began — the English text the user saw traces to the UAT script's own wording, which is now fixed. No code or catalog change was made for G-11-2, per the plan's explicit prohibition.

## Task Commits

1. **Task 1: Two pure rules — tag change writes the title, submit frees it again** - `d6a47f6` (feat)
2. **Task 2: Create screen writes the title value — placeholder special-case and parenthetical entail** - `f011382` (feat)
3. **Task 3: Spec/context/UAT reconciliation + DE device falsification test** - `7d52ba3` (docs)

**Plan metadata:** (this commit)

## Files Created/Modified

- `apps/mobile/lib/activity-form.ts` - Adds `resolveTitleOnTagChange` and `resolveSubmittedTitle`
- `apps/mobile/lib/__tests__/activity-form.test.ts` - 17 new test cases across two new `describe` blocks
- `apps/mobile/app/activity-create.tsx` - Tag-chip handler writes title state; unconditional placeholder; submit uses `resolveSubmittedTitle`
- `apps/mobile/locales/de/messages.po`, `apps/mobile/locales/en/messages.po` - Placeholder-annotation msgid moved to the obsolete block via `lingui extract`
- `.planning/workstreams/mobile/phases/11-activities/11-UI-SPEC.md` - Collapsed placeholder copy row, rewritten D-05 live-rule paragraph, updated `lib/activity-form.ts` inventory entry
- `.planning/workstreams/mobile/phases/11-activities/11-CONTEXT.md` - Dated change note under D-05
- `.planning/workstreams/mobile/phases/11-activities/11-UAT.md` - Tests 2 and 3 `expected:` lines updated

## Decisions Made

- The match in `resolveTitleOnTagChange` is strict equality on the raw (untrimmed, uncased) previous-tag label — any softened comparison (trim/case-fold/substring) is a path where user-typed text is silently lost, which is exactly what G-11-3 asked to eliminate.
- `resolveSubmittedTitle`'s null-on-exact-match branch is this plan's own technical default (documented as such in the code comment and in `11-UI-SPEC.md`): sending the prefilled label unchanged as an explicit title would freeze the activity's title in the creator's locale for every viewer, defeating the server's per-locale auto-title resolution (10-04/ADR-012).
- G-11-2 is closed by wording correction, not code, per the diagnosis's confirmed-by-elimination conclusion. Human on-device confirmation is still the falsification test the plan calls for and is recorded as an open item (see below), not assumed passing.

## Deviations from Plan

None - plan executed exactly as written. Both catalog and doc diffs were verified with `git diff` to confirm they contain exactly the scoped changes (no incidental reordering, no removed lines beyond the intended obsolete-block move, no byte outside the two `expected:` lines in `11-UAT.md`).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Two on-device human-checks from this plan are still open** and recorded as `unrun-verify` entries in `.planning/WINDOWS.md`:
  1. Task 2's six-case tag/title prefill behavior (placeholder, tag-select writes label, typed text survives, deselect semantics, submit result).
  2. Task 3's DE-locale cold-Metro-cache falsification test for G-11-2 (`expo start -c`, expect "Aktivität") plus the EN gegenprobe.
  These are the structural on-device-UAT gap this project always carries (no RN component test harness) — not defects, but they should be run before Phase 11 is considered fully closed.
- `REQUIREMENTS.md`'s ACT-01…ACT-06 checkboxes and traceability rows are still `[ ]`/"Planned" — per `STATE.md`'s recorded blocker, `requirements.mark-complete` does not resolve the workstream path and these must be set by hand at phase completion/transition, not by this individual gap-closure plan.
- `packages/contracts`, `packages/db` and `apps/api` are unchanged (`git status` confirms), keeping the admin-workstream collision zone untouched.
- No new msgid was introduced; both Lingui catalogs stay in sync (287/287, 0 missing).

---
*Phase: 11-activities*
*Completed: 2026-08-16*

## Self-Check: PASSED

- FOUND: apps/mobile/lib/activity-form.ts
- FOUND: apps/mobile/lib/__tests__/activity-form.test.ts
- FOUND: apps/mobile/app/activity-create.tsx
- FOUND: .planning/workstreams/mobile/phases/11-activities/11-06-SUMMARY.md
- FOUND: d6a47f6, f011382, 7d52ba3, 679ba50
