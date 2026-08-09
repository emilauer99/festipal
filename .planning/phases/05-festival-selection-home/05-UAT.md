---
status: testing
phase: 05-festival-selection-home
source: [05-VERIFICATION.md]
started: 2026-08-09T14:59:20Z
updated: 2026-08-09T14:59:20Z
round: 2
previous_round: "Round 1 (05-08-PLAN.md source, 5 pass / 3 issue, closed 2026-08-09) is preserved in git history at commit f77bc94; its 5 gaps G-05-2/5a/5b/7/7b were fixed by gap-closure plans 05-09 and 05-10."
---

## Current Test

number: 1
name: G-05-2 — Empty-state/see-all CTA opens Festivals on Alle (every navigation)
expected: |
  From the Home empty-state CTA (or the rail's "Alle" see-all) the Festivals tab opens
  on the Alle segment. Then: switch Festivals to Meine manually, go back to the Start
  tab, tap "Alle Festivals ansehen" again — Festivals MUST open on Alle again (the
  previously-broken second-navigation-after-manual-switch case). A plain bottom-tab
  switch back into Festivals must NOT override a manual segment choice.
awaiting: user response

## Tests

### 1. G-05-2 — Empty-state/see-all CTA opens Festivals on Alle (every navigation)
expected: The Alle segment opens on EVERY CTA navigation, including after a manual switch to Meine and returning via the Start tab. A plain tab switch back into Festivals never overrides a manual SegmentedControl tap. (Re-run of round-1 test 2.)
result: [pending]

### 2. G-05-5b — Cold-start restores only a SAVED festival (WINDOWS.md id 21)
expected: Enter an UNSAVED festival from Alle, force-quit, relaunch → app lands on Start/Home, NOT the festival. Then save a festival, enter it, force-quit, relaunch → that festival's home IS restored. (Re-run of round-1 test 5, part 1.)
result: [pending]

### 3. WR-01 race probe — Save-then-Enter on the same row with failing save
expected: Tap Save and immediately tap Enter on the SAME unsaved row before the save settles, force the save to fail (e.g. airplane mode mid-tap), force-quit, relaunch → cold-start must NOT restore that festival (it was never actually saved). If it IS restored, WR-01 from 05-REVIEW.md is a confirmed regression needing a follow-up fix (gate the persist on the settled save result, not the optimistic cache).
result: [pending]

### 4. G-05-5a — Cold-start Back lands on Start/Home; in-tab Back returns through history (WINDOWS.md id 22)
expected: Cold-start into a restored (saved) festival home, tap Back → lands on the Start/Home tab. Enter a festival normally from the Festivals tab, tap Back → returns to the Festivals tab. (Re-run of round-1 test 5, part 2.)
result: [pending]

### 5. G-05-7 / G-05-7b — Deep-link forms and authenticated precedence (WINDOWS.md id 23)
expected: |
  Against the seeded second festival nova-sound-2026:
  (a) Logged out, session revoked, slug frequency-2026 persisted, open
  festipal://f/nova-sound-2026 (double-slash) → auth gate, then nova-sound-2026 opens.
  (b) Already authenticated, app closed, fire festipal:///f/nova-sound-2026 →
  nova-sound-2026 opens, NOT the persisted frequency-2026.
  The previously-confirmed logged-out triple-slash precedence must not regress.
  Note (WR-04): this verifies the cold-start capture/replay path; a warm deep-link tap
  while the app is already running is a separate follow-up check.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
