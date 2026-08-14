---
status: diagnosed
phase: 09-festival-navigation-shell
source: [09-VERIFICATION.md]
started: 2026-08-14T10:40:00Z
updated: 2026-08-14T15:04:14Z
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
  root_cause: "Root-Stack in apps/mobile/app/_layout.tsx registriert index/(auth)/(profile-setup)/(tabs)/(festival) OHNE headerShown:false — native-stack rendert einen default-sichtbaren ~80dp Native-Header (Titel = Routenname), react-native-screens layoutet den Navigator-Content DARUNTER; das 09-04-Glas-Overlay verdeckt die Leiste nur, und jeder Screen paddet zusaetzlich useHeaderClearance() → ~80dp toter Papier-Streifen (Ruhe-Abstand 99dp statt 18dp; am Emulator verifiziert: TextView '(tabs)' [0,0][1080,210] hinter dem Glas)"
  artifacts:
    - path: "apps/mobile/app/_layout.tsx"
      issue: "Root-<Stack>-Registrierungen fuer index, (auth), (profile-setup), (tabs), (festival) ohne headerShown:false (~Zeilen 484–493); profil/friends-qr/friends-find/cashless haben es bereits"
    - path: "apps/mobile/app/friend-detail.tsx"
      issue: "Constraint fuer die Fix-Variante screenOptions: eigener Modal-Header setzt headerShown nicht explizit (Zeilen 173–189) — braeuchte dann headerShown:true"
  missing:
    - "headerShown:false auf den fuenf ungeschuetzten Root-Registrierungen (Muster profil/friends-qr) ODER screenOptions={{headerShown:false}} am Root-Stack + explizites headerShown:true in friend-detail"
    - "Device-Nachpruefung: Ruhe-Abstand ~18–20px auf Start/Dashboard; Welcome ohne (auth)-Leiste"
  debug_session: ".planning/debug/header-content-whitespace.md"

- gap_id: G-09-7
  truth: "Die fuenf Tab-Labels heissen Live, Quiks, Crew, Timetable, Karte und tragen die Icons aus den Screen-Designs"
  status: failed
  reason: "User reported: pass, aber ich will die tab labels umbenennen, so: Live, Quiks, Crew, Timetable, Karte. Siehe screen designs für die richtigen icons"
  severity: minor
  test: 7
  root_cause: "Kein Defekt — bewusste Phase-09-Design-Abweichung, die der User zuruecknimmt: 09-UI-SPEC.md liess 'Crew'/'Live' aus den Designs bewusst weg (ADR-014: 'als UI-Label entfaellt Crew') und ersetzte audio-lines durch LayoutDashboard. Aenderort ist genau eine Komponente: apps/mobile/components/FloatingNav.tsx (FESTIVAL_TAB_ICON :75–81, festivalTabLabel :157–163, Icon-Set lucide-react-native) + Lingui-Kataloge apps/mobile/locales/{de,en}/messages.po. Mapping positional 1:1: Dashboard→Live (Icon LayoutDashboard→AudioLines), Aktivitäten→Quiks, Friends→Crew (NEUE msgid — msgid 'Friends' teilen 3 Call-Sites), Timetable bleibt, Lageplan→Karte (nur DE-msgstr der msgid 'Map'). Designs liegen im Repo: docs/concept/designs/quiks-v2/quiks-screens.template.html:2035. Keine Tests/Snapshots betroffen."
  artifacts:
    - path: "apps/mobile/components/FloatingNav.tsx"
      issue: "FESTIVAL_TAB_ICON.index LayoutDashboard→AudioLines (AudioLines bereits in profil.tsx importiert); festivalTabLabel Dashboard→Live, Activities→Quiks, Friends→Crew (neue msgid, nie msgstr-Edit); obsoleter Kommentar :66–74"
    - path: "apps/mobile/locales/de/messages.po"
      issue: "msgstrs Live/Crew neu; msgid 'Map': DE 'Lageplan'→'Karte' (:460); Regeneration via pnpm extract + compile --strict (auch en/messages.po + kompilierte messages.js)"
    - path: ".planning/workstreams/mobile/REQUIREMENTS.md"
      issue: "NAV-01 (:48) zaehlt die alten fuenf Tab-Namen auf"
    - path: "docs/DEVELOPMENT_DECISIONS.md"
      issue: "ADR-014-Amendment noetig: Crew-als-UI-Label-Verbot per User-Entscheid 2026-08-14 (UAT Phase 09) aufgehoben"
  missing:
    - "Label/Icon-Swap in FloatingNav (beide Varianten) + Katalog-Regeneration"
    - "Entschieden (User, 2026-08-14): Tab-Label lowercase 'quiks' (Markenregel); Crew-Kachel-Eyebrow 'Freunde hier' bleibt; Placeholder-Texte an neue Namen angleichen (Karte statt Lageplan, Aktivitaeten-Placeholder folgt quiks-Wording); navLiveDot NICHT in Scope (Deferred Follow-Up)"
    - "ADR-014-Amendment-Notiz"
  debug_session: ".planning/debug/tab-labels-icons-redesign.md"

## Deferred Follow-Ups

- test: 7
  idea: "navLiveDot aus den Screen-Designs (roter Punkt am Live-Tab, quiks-screens.template.html:1938/:2055) — erst mit echtem Live-Signal einbauen (NAV-02-Ehrlichkeit), nicht statisch simulieren"
  deferred_at: 2026-08-14
