---
status: complete
phase: 09-festival-navigation-shell
source: [09-VERIFICATION.md]
started: 2026-08-14T10:40:00Z
updated: 2026-08-14T14:13:17Z
---

## Current Test

[testing complete]

## Tests

### 1. Placeholder tabs on device (WINDOWS #40 — 09-03 Task 2)
expected: Per-tab icon + heading + one sentence; three DIFFERENT precondition sentences (Timetable/Lageplan name the festival, Aktivitaeten names quiks); no spinner/badge/date promise; body scrolls instead of clipping at max font scale; EN strings render (no raw msgids)
result: pass

### 2. AppHeader three states + auth boundary (WINDOWS #42 — 09-04 Task 2)
expected: Wordmark (dot in Beere) / festival name / push title + back arrow; home button leaves a cold-start-opened festival without exiting the app; Start-tab home tap is a visible no-op (no toast); avatar tap opens Profil (repeated taps do NOT stack copies — WR-02); NO header on welcome/email/code screens; after re-login the new account's avatar shows
result: issue
reported: "pass. Aber das screen layout passt jetzt nicht mehr. es ist jetzt sehr viel whitespace zwischen AppHeader und dem start vom page content"
severity: major
note: Header-Zustaende/Auth-Grenze selbst bestanden — Issue ist eine Layout-Regression (Abstand Header→Content)

### 3. No double header / clearance (WINDOWS #43 — 09-04 Task 3)
expected: No native title bar above the glass anywhere (every screen, notch + non-notch, max font scale, both color modes); content starts under the glass and scrolls behind it; festival name appears ONCE (header only, not on the Dashboard); header stays single-line with ellipsis
result: pass

### 4. Festival-Friends-Tab with real accounts (WINDOWS #44 — 09-05 Task 2)
expected: Three distinct empty states, intersection-only list, no presence/chat surface, tap-through to friend-detail with content, error + retry, Crew tile parity with list length, dark mode
result: pass

### 5. friends-find push-over (WINDOWS #45 — 09-05 Task 3)
expected: Pill present in every tab state; global Friends screen opens OVER the festival (no FloatingNav, back arrow + 'Friends' title); identical behavior at both positions; Back lands in the festival Friends tab; pill grows in height at max font scale, label never ellipsized
result: pass

### 6. Cashless on device (WINDOWS #46 — 09-06 Task 2) — NATIVE REBUILD FIRST
expected: |
  VORAB: `npx expo run:android` aus `apps/mobile` (nie Repo-Root) — react-native-webview fehlt im
  installierten APK. Dann: Festival MIT Adresse: zwei Tiles (Cashless brand-toned, Pfeil, KEINE Zahl);
  OHNE Adresse: genau ein Tile, kein inerter Ersatz; full-bleed WebView unter Push-Header;
  Cross-Origin-Navigation in-page geblockt UND nicht extern geoeffnet (CR-01-Fix); Offline-Fehler +
  In-Place-Retry; keines der vier ADR-011-ausgeschlossenen Elemente.
result: pass

### 7. Backstop truths (plan-declared)
expected: (a) five DE tab labels hold on the narrowest supported device width (flex-1, numberOfLines={1} ellipsize); (b) gate copy at max font scale fully readable; (c) blank-but-successful cashless page distinguishable from a hung load (empty frame with reachable Back, loading hint ends); (d) no page-title chrome anywhere
result: issue
reported: "pass, aber ich will die tab labels umbenennen, so: Live, Quiks, Crew, Timetable, Karte. Siehe screen designs für die richtigen icons"
severity: minor
note: Alle vier Backstop-Punkte bestanden — Issue ist ein Change-Request (Tab-Labels + Icons an Screen-Designs angleichen)

### 8. Judgment-tier prohibitions (verification: manual)
expected: NAV-02 honesty (no simulated surface), NAV-01 header privacy (no account data outside auth), FRND-07 privacy/safety (no presence signal, no chat entry), NAV-01 cashless safety (no payment element, no inert placeholder) — each upheld on device as in code
result: pass

## Summary

total: 8
passed: 6
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-09-2
  truth: "Content beginnt direkt unter dem AppHeader-Glas — kein uebermaessiger Leerraum zwischen Header und Beginn des Seiteninhalts"
  status: failed
  reason: "User reported: pass. Aber das screen layout passt jetzt nicht mehr. es ist jetzt sehr viel whitespace zwischen AppHeader und dem start vom page content"
  severity: major
  test: 2
  artifacts: []
  missing: []

- gap_id: G-09-7
  truth: "Die fuenf Tab-Labels heissen Live, Quiks, Crew, Timetable, Karte und tragen die Icons aus den Screen-Designs"
  status: failed
  reason: "User reported: pass, aber ich will die tab labels umbenennen, so: Live, Quiks, Crew, Timetable, Karte. Siehe screen designs für die richtigen icons"
  severity: minor
  test: 7
  artifacts: []
  missing: []
