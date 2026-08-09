---
status: diagnosed
phase: 05-festival-selection-home
source: [05-VERIFICATION.md]
started: 2026-08-09T14:59:20Z
updated: 2026-08-09T15:30:00Z
round: 2
previous_round: "Round 1 (05-08-PLAN.md source, 5 pass / 3 issue, closed 2026-08-09) is preserved in git history at commit f77bc94; its 5 gaps G-05-2/5a/5b/7/7b were fixed by gap-closure plans 05-09 and 05-10."
---

## Current Test

[testing complete]

## Tests

### 1. G-05-2 — Empty-state/see-all CTA opens Festivals on Alle (every navigation)
expected: The Alle segment opens on EVERY CTA navigation, including after a manual switch to Meine and returning via the Start tab. A plain tab switch back into Festivals never overrides a manual SegmentedControl tap. (Re-run of round-1 test 2.)
result: pass

### 2. G-05-5b — Cold-start restores only a SAVED festival (WINDOWS.md id 21)
expected: Enter an UNSAVED festival from Alle, force-quit, relaunch → app lands on Start/Home, NOT the festival. Then save a festival, enter it, force-quit, relaunch → that festival's home IS restored. (Re-run of round-1 test 5, part 1.)
result: issue
reported: "Enter an UNSAVED festival from Alle, force-quit, relaunch → app lands on Start/Home, NOT the festival. Das funktioniert nicht. Immer wenn ich die app quitte und dann relaunche lande ich am Frequency Festival Home Screen"
severity: major

### 3. WR-01 race probe — Save-then-Enter on the same row with failing save
expected: Tap Save and immediately tap Enter on the SAME unsaved row before the save settles, force the save to fail (e.g. airplane mode mid-tap), force-quit, relaunch → cold-start must NOT restore that festival (it was never actually saved). If it IS restored, WR-01 from 05-REVIEW.md is a confirmed regression needing a follow-up fix (gate the persist on the settled save result, not the optimistic cache).
result: pass

### 4. G-05-5a — Cold-start Back lands on Start/Home; in-tab Back returns through history (WINDOWS.md id 22)
expected: Cold-start into a restored (saved) festival home, tap Back → lands on the Start/Home tab. Enter a festival normally from the Festivals tab, tap Back → returns to the Festivals tab. (Re-run of round-1 test 5, part 2.)
result: pass

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
result: pass

## Summary

total: 5
passed: 4
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-05-5b-r2
  truth: "Cold-start after entering an UNSAVED festival must land on Start/Home, not restore the festival."
  status: failed
  reason: "User reported: Immer wenn ich die app quitte und dann relaunche lande ich am Frequency Festival Home Screen (auch bei nicht gespeichertem Festival)."
  severity: major
  test: 2
  regression_of: G-05-5b
  root_cause: "The 05-09 fix implemented 'restore only a SAVED festival' as 'only PERSIST when saved', making the persisted active-festival-slug a sticky 'last saved festival ever entered'. Entering an UNSAVED festival neither writes a new slug nor CLEARS the existing one (festivals.tsx:220-222 documents this as intentional), so a previously-entered saved festival (frequency-2026, the Home hero) stays stuck in MMKV and _layout.tsx:246-249 restores it unconditionally on every cold-start. Requires both a pre-existing saved slug AND the missing clear-on-unsaved-entry."
  artifacts:
    - path: "apps/mobile/app/(tabs)/festivals.tsx"
      issue: "handleEnter (214-225) gates persist on `saved` but never clears the persisted slug when entering an unsaved festival; comment 220-222 documents the wrong 'never clears' decision"
    - path: "apps/mobile/app/_layout.tsx"
      issue: "cold-start restore (246-249) replays any persisted slug unconditionally, without confirming it is still the last-entered / still-saved festival"
    - path: "apps/mobile/lib/active-festival-storage.ts"
      issue: "clearActiveFestivalSlug exists but is only invoked on logout and 404, not on unsaved entry"
  missing:
    - "In festivals.tsx handleEnter, clear the persisted slug (else clearActiveFestivalSlug()) when entering an UNSAVED festival, reversing the 'never clears' decision at 220-222"
    - "Keep _layout.tsx restore read synchronous (offline-safe); no async re-validation against listMyFestivals required"
  debug_session: .planning/debug/cold-start-restores-unsaved-festival.md
