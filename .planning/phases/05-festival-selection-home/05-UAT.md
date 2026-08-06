---
status: testing
phase: 05-festival-selection-home
source: [05-08-PLAN.md]
started: 2026-08-06T13:05:32.673Z
updated: 2026-08-06T13:05:32.673Z
---

## Current Test

number: 1
name: Login lands on Home (hero + rail or empty state)
expected: |
  After login the app lands on the Home tab (initialRouteName=home) showing the
  "Dein nächstes Festival" hero + "Meine Festivals" rail (or, with zero saved
  festivals, the shared empty-state block).
awaiting: user response

## Tests

### 1. Login lands on Home (hero + rail or empty state)
expected: After login the app lands on the Home tab (initialRouteName=home) showing the "Dein nächstes Festival" hero + "Meine Festivals" rail (or, with zero saved festivals, the shared empty-state block).
result: [pending]

### 2. Empty-state/see-all CTA opens Festivals on Alle
expected: From the empty-state CTA (or the rail's "Alle" see-all) the Festivals tab OPENS on the Alle segment (segment=all param), not Meine.
result: [pending]

### 3. Save exactly-once, persists, rolls back on forced failure, recovers
expected: In Alle, rapid-double-tap Save on an unsaved festival results in only one request, it flips to 'Gespeichert', and appears exactly once under Meine. Force-quit + relaunch with the API reachable -> it remains under Meine (server persistence, FEST-03). A different unsaved festival, saved while the API is made unreachable for that attempt, has its optimistic insert roll back from Meine with a visible localized error. Restoring the API and retrying/refetching recovers the screen before continuing.
result: [pending]

### 4. Enter a festival, Back returns to shell
expected: Entering a festival shows its name (H1) + locale-formatted "{dates} · {place}" + the four disabled coming-soon tiles; Back returns to the Festivals tab (never a dead-end).
result: [pending]

### 5. Cold-start into a festival, Back lands on Festivals tab
expected: Entering a festival, force-quitting, and relaunching opens the festival home directly; Back from it lands on the Festivals tab (leaveFestival shell fallback), never exits the app.
result: [pending]

### 6. Cross-account hygiene after logout
expected: Logging out and logging in as a DIFFERENT account on the same device starts on Home, NOT the prior account's festival (active-festival slug cleared on logout).
result: [pending]

### 7. Deep-link precedence over persisted active-festival slug
expected: With account B's active slug A persisted (via prior enter, not cleared by normal logout), invalidating/revoking its session externally, then cold-launching a logged-out deep link to a DIFFERENT known /f/:slugB and completing auth, results in slugB opening -- proving the captured deep link is replayed after auth and wins over the persisted slug A. No festival screen is accessible before authentication completes.
result: [pending]

### 8. DE/EN date re-formatting + null-date fallback + disabled-tab a11y
expected: After relaunching following a device-language change DE<->EN, the normal-date and null-date fixtures re-format their date range via Intl (null shows the localized fallback). With TalkBack enabled, the disabled Friends and Profil items are focusable, cannot navigate, and announce a localized "coming soon"/"bald verfügbar" accessibility label.
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
