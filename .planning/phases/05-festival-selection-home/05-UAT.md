---
status: testing
phase: 05-festival-selection-home
source: [05-VERIFICATION.md]
started: 2026-08-09T16:48:31Z
updated: 2026-08-09T16:48:31Z
round: 3
previous_round: "Round 2 (05-VERIFICATION.md re-verify after 05-09/05-10, 4 pass / 1 issue, closed 2026-08-09) is preserved in git history at commit 38a57a5; its single failure G-05-5b-r2 (cold-start restored a stale saved festival after an intervening unsaved entry) was root-caused in .planning/debug/cold-start-restores-unsaved-festival.md and fixed at the code level by gap-closure plan 05-11 (commits 211ecd2/9cddf4f/9828672). Round 1 (05-08-PLAN.md source, 5 pass / 3 issue) is at commit f77bc94."
---

## Current Test

number: 1
name: G-05-5b-r2 — Cold-start restores only the last-entered SAVED festival, never a stale saved slug after an unsaved entry
expected: |
  Two-part force-quit/relaunch cycle:
  (a) Enter a SAVED festival (persists) → force-quit → relaunch → that festival's home IS restored.
  (b) Then enter a DIFFERENT UNSAVED festival from Alle → force-quit → relaunch → app lands on Start/Home, NOT the previously-saved festival.
  A stale previously-saved slug must no longer survive an intervening unsaved entry. This is the exact scenario that failed in round 2 ("Immer wenn ich die app quitte und dann relaunche lande ich am Frequency Festival Home Screen").
awaiting: user response

## Tests

### 1. G-05-5b-r2 — Cold-start restores only the last-entered SAVED festival (fix re-confirmation)
expected: |
  (a) Enter a SAVED festival, force-quit, relaunch → that festival's home IS restored.
  (b) Then enter a DIFFERENT UNSAVED festival from Alle, force-quit, relaunch → app lands on Start/Home, NOT the previously-saved festival.
  Cold-start restores only the LAST-entered festival, and only when it was saved. A stale previously-saved slug must no longer survive an intervening unsaved entry.
why_human: "Requires a real force-quit/relaunch device cycle to observe MMKV persistence across process kill and the _layout.tsx cold-start read; not exercisable from the node-env Vitest runner. The fix's pure reducer and wiring are unit-tested (5/5) and code-reviewed as correct, but only a device run settles the actual regression."
result: pending

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
