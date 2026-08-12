---
phase: 06-profile-friends-placeholders
plan: 10
subsystem: i18n
tags: [expo-router, hermes, formatjs, intl-pluralrules, lingui, gap-closure]

# Dependency graph
requires:
  - phase: 06-profile-friends-placeholders
    provides: "06-07 fuehrte den Lingui plural()-Aufruf in app/profil.tsx ein; 06-09 lieferte die vollstaendigen DE/EN-Kataloge, die den Plural-Token tragen"
  - phase: (debug session)
    provides: ".planning/debug/profile-screen-undefined-constructor.md — die statische AND-Gate-Diagnose (Code + fehlende Hermes-Faehigkeit), die diesen Fix begruendet"
provides:
  - "Intl.PluralRules-Polyfill (@formatjs/intl-pluralrules, forced variant + de/en Locale-Daten) registriert an einem neuen Custom-Entry-Point, VOR jedem Route-Modul"
  - "Zero-Import-Capability-Probe (lib/intl-capability.ts), die den nativen Engine-Wert beobachtet, bevor der Polyfill ihn ueberschreibt"
  - "Rueckfall-Guard (lib/__tests__/intl-polyfill.test.ts), der im node-env-Runner greift und dreifach falsifiziert wurde"
  - "Geraeteverifikation: natives Intl.PluralRules bestaetigt undefined, Profil-Screen oeffnet sich fehlerfrei"
affects: [07-content-screens, verify-work, ship]

actuals:
  tokens: 3428
  tasks: 4
  commits: 3

tech-stack:
  added: ["@formatjs/intl-pluralrules@6.3.13"]
  patterns:
    - "Custom Expo Router Entry Point (apps/mobile/index.js): Side-Effect-Imports vor 'expo-router/entry', fuer App-weite Initialisierung, die vor jedem Route-Modul laufen muss"
    - "Zero-Import-Capability-Probe-Modul: ein Modul ohne jeden Import faengt den rohen Engine-Zustand ab, bevor ein Import im selben Ausfuehrungsstrang (Imports werden ueber den Modulkoerper hinaus gehoisted) ihn ueberschreiben kann"

key-files:
  created:
    - apps/mobile/index.js
    - apps/mobile/lib/intl-capability.ts
    - apps/mobile/lib/intl-polyfill.ts
    - apps/mobile/lib/__tests__/intl-polyfill.test.ts
  modified:
    - apps/mobile/package.json
    - pnpm-lock.yaml
    - .planning/workstreams/mobile/STATE.md
    - .planning/workstreams/mobile/ROADMAP.md

key-decisions:
  - "Alle vier FormatJS-Spezifizierer tragen die .js-Endung, auch die Locale-Daten-Imports — Abweichung vom Plan-Text, der Extensionslosigkeit fuer locale-data/* erwartete (siehe Deviations)"
  - "Task 1 (Package-Legitimacy-Gate) vom User vor Dispatch mit 'approved' freigegeben — npmjs.com geprueft: FormatJS-Org, github.com/formatjs/formatjs, Millionen woechentliche Downloads, kein Typosquat"
  - "Task 4 (Geraeteverifikation) vom User mit 'approved, funktioniert jetzt' freigegeben; die exakte Meta-Zeile wurde NICHT transkribiert und wird daher nicht als beobachtet protokolliert (siehe Accomplishments)"

patterns-established:
  - "Falsifizierung von Rueckfall-Guards VOR dem Vertrauen: jede Kern-Assertion wird durch eine gezielte Mutation rot gefahren, dann zurueckgesetzt und wieder gruen bestaetigt — deckte hier sogar einen Fehler im eigenen Test auf (siehe Deviations, Punkt 2)"

requirements-completed: [PROF-01]

coverage:
  - id: D1
    description: "Der Profil-Screen oeffnet sich auf einem Hermes-Geraet, statt einen Constructor-TypeError zu werfen; das native Intl.PluralRules ist per Startup-Log bestaetigt undefined, nach dem Polyfill function"
    requirement: "PROF-01"
    verification:
      - kind: manual_procedural
        ref: "Task 4 Geraete-Checkpoint — User-Antwort 'approved, funktioniert jetzt'; Log-Zeile verbatim: '[intl-polyfill] native Intl.PluralRules: undefined, after polyfill: function'"
        status: pass
    human_judgment: true
    rationale: "Geraeteverifikation kann von diesem Executor nicht selbst gefahren werden (kein Android-Build im Sandbox-Kontext); die Bestaetigung stammt vom User am echten Geraet. Die exakte gerenderte Meta-Zeile aus Schritt 4 wurde vom User NICHT transkribiert — nur der Bildschirmerfolg ('funktioniert jetzt') ist belegt, nicht der genaue Text."
  - id: D2
    description: "UAT Test 5 (c) Profil-Ausblick-Bloecke zeigen keine erfundenen Messwerte; (d) nichts suggeriert, der geraetelokale Avatar sei kontogesichert"
    verification: []
    human_judgment: true
    rationale: "Judgment-tier-Verbote, ausdruecklich NICHT von diesem Plan geschlossen. Erstmals ueberhaupt beobachtbar, seit der Screen sich oeffnet, aber noch nicht beurteilt — gehen formal zurueck an /gsd-verify-work 06 --ws mobile, duerfen nie stillschweigend gruen werden."
  - id: D3
    description: "Rueckfall-Guard (5 Assertionen) sitzt im node-env-Vitest-Runner und ist gegen 3 Mutationen falsifiziert: main zurueckgesetzt, .js-Endung entfernt, de-Locale-Data-Import geloescht — jede Mutation produzierte einen roten Lauf auf genau der betroffenen Assertion, jeder Revert stellte Gruen mit sauberem git diff wieder her"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/intl-polyfill.test.ts (5 tests) — pnpm --filter @quiks/mobile test: 193/193 (18 Dateien)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Typecheck, Lint und Android-Bundle-Export sind gruen; das Export-Bundle enthaelt den FormatJS-Locale-Data-Registrierungsmarker __addLocaleData"
    verification:
      - kind: integration
        ref: "pnpm --filter @quiks/mobile typecheck && pnpm --filter @quiks/mobile lint (beide 0 Fehler) && npx expo export --platform android --clear (apps/mobile/index.js gebuendelt, 3902 Module) && grep -rl __addLocaleData dist -> Treffer im .hbc-Bundle"
        status: pass
    human_judgment: false

duration: ~25min (Ausfuehrung) + Geraete-Wartezeit am Checkpoint
completed: 2026-08-12
status: complete
---

# Phase 06 Plan 10: Intl.PluralRules Polyfill (G-06-5 Gap Closure) Summary

**Custom Expo Router Entry Point registriert @formatjs/intl-pluralrules (forced variant + de/en Locale-Daten) VOR jedem Route-Modul — behebt den Hermes-Constructor-TypeError beim Oeffnen des Profil-Screens, geraeteverifiziert.**

## Performance

- **Duration:** ~25min Ausfuehrung (Task 2 + Task 3) + Wartezeit auf die Geraeteabnahme bei Task 4
- **Started:** 2026-08-12T13:37Z (erster Commit dieses Plans folgte auf ee283f0)
- **Completed:** 2026-08-12 (Task 4 Checkpoint freigegeben, dieser Abschlusscommit folgt)
- **Tasks:** 4 (Package-Legitimacy-Gate, Tracer-Fix, Rueckfall-Guard, Geraeteverifikation)
- **Files modified:** 6 im Code (index.js, package.json, pnpm-lock.yaml, intl-capability.ts, intl-polyfill.ts, intl-polyfill.test.ts) + STATE.md/ROADMAP.md in diesem Abschlusscommit

## Accomplishments

- `@formatjs/intl-pluralrules@6.3.13` installiert (Package-Legitimacy-Gate vom User vor dem Install freigegeben); `pnpm-lock.yaml`-Diff sauber auf `@formatjs/intl-pluralrules` + seine drei transitiven FormatJS-Deps (`@formatjs/bigdecimal`, `@formatjs/fast-memoize`, `@formatjs/intl-localematcher`) beschraenkt — keine fremde Package-Verlinkung
- `apps/mobile/index.js` neu als Custom-Entry-Point (`package.json` `main` von `expo-router/entry` auf `index.js` umgestellt): laedt `./lib/intl-polyfill` zuerst, `expo-router/entry` zuletzt
- `apps/mobile/lib/intl-capability.ts` neu: ein Modul OHNE jeden Import, das `typeof Intl.PluralRules` am Modulwertungszeitpunkt festhaelt — dadurch beobachtet es die ROHE Engine, bevor der Polyfill sie ueberschreibt (Imports werden ueber den Modulkoerper hinaus gehoisted; ein Capture in derselben Datei wie der Polyfill-Import haette immer den bereits gepatchten Wert gesehen)
- `apps/mobile/lib/intl-polyfill.ts` neu: laedt die forced-Variante des Polyfills plus `de`- und `en`-Locale-Daten, loggt eine Startup-Zeile mit nativem und aktuellem `typeof Intl.PluralRules`, wirft bei fehlgeschlagenem Polyfill sofort einen benannten Fehler statt den kryptischen Hermes-Constructor-TypeError tief im Screen-Rendering
- `apps/mobile/app/profil.tsx` UNVERAENDERT — `git diff` leer, zweifach verifiziert (vor und nach Task 3)
- Rueckfall-Guard `apps/mobile/lib/__tests__/intl-polyfill.test.ts` (5 Assertionen) im node-env-Vitest-Runner, DREIFACH falsifiziert (siehe unten)
- Android-Export-Bundle (`npx expo export --platform android --clear`) buendelt `apps/mobile/index.js` (3902 Module) und enthaelt den FormatJS-Registrierungsmarker `__addLocaleData` im kompilierten `.hbc`-Bundle
- Untracked Debug-Dump `apps/mobile/profil.out.js` entfernt
- **Geraeteverifikation (Task 4) bestaetigt die Diagnose:** Startup-Log-Zeile verbatim vom User gemeldet: `[intl-polyfill] native Intl.PluralRules: undefined, after polyfill: function` — die Hermes-Engine-Luecke ist damit device-verifiziert bestaetigt (nicht mehr nur aus Upstream-Dokumentation abgeleitet), und der Polyfill hebt sie tatsaechlich auf. Der Profil-Screen oeffnet sich (User: "funktioniert jetzt").

## Task Commits

1. **Task 1: Package-Legitimacy-Gate fuer @formatjs/intl-pluralrules** — kein Code-Commit; User-Freigabe "approved" vor Dispatch (npmjs.com geprueft)
2. **Task 2: End-to-End-Tracer — Intl.PluralRules existiert vor dem ersten Route-Rendering** - `3c7c120` (feat)
3. **Task 3: Rueckfall-Guard — ein Test, der im node-Runner greift** - `568a9db` (test)
4. **Task 4: Geraeteverifikation** — kein eigener Code-Commit; User-Freigabe "approved, funktioniert jetzt" mit Log-Beleg (siehe oben)

**Plan metadata:** dieser Commit (docs: complete plan)

## Files Created/Modified

- `apps/mobile/index.js` - Custom Expo Router Entry Point: `./lib/intl-polyfill` vor `expo-router/entry`
- `apps/mobile/lib/intl-capability.ts` - Zero-Import-Probe fuer das native `typeof Intl.PluralRules`
- `apps/mobile/lib/intl-polyfill.ts` - Registriert die forced-Polyfill-Variante + de/en-Locale-Daten, loggt und faellt fail-fast
- `apps/mobile/lib/__tests__/intl-polyfill.test.ts` - 5-Assertionen-Rueckfall-Guard, dreifach falsifiziert
- `apps/mobile/package.json` - `main`: `expo-router/entry` -> `index.js`; `@formatjs/intl-pluralrules` als Dependency
- `pnpm-lock.yaml` - `@formatjs/intl-pluralrules` + 3 transitive FormatJS-Deps

## Decisions Made

- **.js-Endung auf ALLEN vier Spezifizierern**, nicht nur auf `polyfill-force.js` wie der Plan-Text erwartete (siehe Deviations Punkt 1) — verifiziert gegen die offizielle FormatJS-Doku (Context7: `formatjs.github.io/docs/polyfills/intl-pluralrules` zeigt `locale-data/en.js` mit Endung) und gegen echte Node-ESM-Aufloesung vor Ort (`import '@formatjs/intl-pluralrules/locale-data/de'` ohne Endung wirft `Cannot find module`, mit `.js` loest es auf)
- **Package-Legitimacy-Gate NICHT erneut praesentiert** — laut Koordinator-Anweisung bereits vor Dispatch vom User freigegeben; als abgeschlossen mit der User-Antwort dokumentiert
- **Meta-Zeile (Task 4 Schritt 4) NICHT als beobachtet protokolliert** — der User hat sie nicht transkribiert, nur "funktioniert jetzt" bestaetigt; eine erfundene Zeile waere hier falsche Evidenz gewesen (siehe D1-Coverage-Rationale)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug/Faktenfehler im Plan-Text] Locale-Data-Spezifizierer brauchen die .js-Endung, entgegen der planungszeitlichen Annahme**
- **Found during:** Task 2, beim ersten `pnpm --filter @quiks/mobile typecheck`
- **Issue:** Der Plan-Text (Step 3) behauptete explizit, die Locale-Data-Spezifizierer blieben extensionslos, weil sie "gegen den Pattern-Key `./locale-data/*` matchen". `tsc` warf `TS2882: Cannot find module or type declarations for side-effect import of '@formatjs/intl-pluralrules/locale-data/de'` fuer beide extensionslosen Imports.
- **Fix:** Gegenprobe am realen Package: `node_modules/@formatjs/intl-pluralrules/package.json`s `exports`-Map ersetzt `*` in `"./locale-data/*": "./locale-data/*"` rein LITERAL — die angefragte Subpath muss die `.js`-Endung selbst mitbringen, um die tatsaechliche Datei `locale-data/de.js` zu treffen. Bestaetigt per `node -e "import('@formatjs/intl-pluralrules/locale-data/de')"` (wirft `Cannot find module`) vs. mit `.js` (loest auf), UND per Context7-Doku-Abfrage der offiziellen FormatJS-Polyfill-Seite, deren eigenes Beispiel `import '@formatjs/intl-pluralrules/locale-data/en.js'` mit Endung zeigt. Beide Locale-Data-Imports in `lib/intl-polyfill.ts` auf `.js` umgestellt; der Header-Kommentar dokumentiert die Abweichung inline mit der Begruendung, statt die falsche Planannahme stillschweigend zu uebernehmen.
- **Files modified:** apps/mobile/lib/intl-polyfill.ts
- **Verification:** `pnpm --filter @quiks/mobile typecheck` gruen; `npx expo export --platform android --clear` buendelt erfolgreich und enthaelt `__addLocaleData`
- **Committed in:** `3c7c120` (Task 2 commit)

**2. [Rule 1 - Bug im eigenen Test, aufgedeckt durch die geforderte Falsifizierung] Zwei Guard-Assertionen matchten anfangs auf die eigene Kommentarprosa statt auf den echten Code**
- **Found during:** Task 3, waehrend der vom Plan geforderten Falsifizierungslaeufe (Mutation "expo-router/entry vor dem Polyfill-Import" und Mutation "de-Locale-Data-Import geloescht")
- **Issue:** Assertion 3 (`indexOf('./lib/intl-polyfill')` vs. `indexOf('expo-router/entry')`) und Assertion 5 (`toContain('locale-data/${locale}')`) suchten per loser Substring-Suche im Dateitext. Beide Dateien tragen ausfuehrliche Header-Kommentare, die dieselben Modulnamen in Prosa erwaehnen (`index.js`s Kommentar nennt woertlich "expo-router/entry"; `intl-polyfill.ts`s Kommentar diskutiert "locale-data/de" als Beispiel fuer die Endungs-Abweichung oben). Beim ersten Falsifizierungslauf fand Assertion 3 die Kommentar-Erwaehnung von `expo-router/entry` VOR dem echten Import und meldete faelschlich Erfolg trotz falscher Reihenfolge; beim `de`-Loesch-Mutationslauf blieb Assertion 5 GRUEN, obwohl der echte Import bereits entfernt war — ein reiner False Negative, weil der Kommentar den String noch enthielt.
- **Fix:** Beide Assertionen auf das VOLLE, einfach-gequotete Import-Spezifizierer-Literal umgestellt (`'./lib/intl-polyfill'` / `'expo-router/entry'` bzw. `'@formatjs/intl-pluralrules/locale-data/${locale}.js'`) statt auf lose Substrings — das trifft nur echte `import`-Anweisungen, nicht Backtick-zitierte Erwaehnungen in Kommentaren. Beide Mutationen danach erneut gefahren: beide produzierten jetzt den erwarteten roten Lauf auf genau der betroffenen Assertion.
- **Files modified:** apps/mobile/lib/__tests__/intl-polyfill.test.ts
- **Verification:** Alle 3 Mutationen (main zurueckgesetzt, .js-Endung entfernt, de-Import geloescht) produzieren nach dem Fix jeweils einen roten Lauf auf der erwarteten Assertion; alle 3 Reverts stellen Gruen mit sauberem `git diff` wieder her; volle Suite 193/193 gruen
- **Committed in:** `568a9db` (Task 3 commit, der geharteten Test bereits enthaltend — die anfaengliche schwache Version wurde vor dem Commit korrigiert, kein separater Fix-Commit noetig)

---

**Total deviations:** 2 auto-fixed (2x Rule 1 — ein Faktenfehler im Plan-Text, ein Fehler im eigenen Test, beide durch tatsaechliches Ausfuehren der Tools bzw. durch die vom Plan geforderte Falsifizierung aufgedeckt)
**Impact on plan:** Beide Fixes waren fuer die Korrektheit des Fixes bzw. des Guards notwendig. Kein Scope Creep — `app/profil.tsx` blieb in beiden Faellen unangetastet.

## Falsifizierungs-Protokoll (Task 3, Plan-Pflicht)

Fuer die Assertionen 1, 4 und 5 wurde je eine gezielte Mutation angewandt, der spezifische rote Lauf bestaetigt, dann zurueckgesetzt und Gruen erneut bestaetigt (mit sauberem `git diff` nach jedem Revert):

| # | Mutation | Betroffene Assertion | Ergebnis vor Fix | Ergebnis nach Fix (falls Punkt 2 oben zutraf) | Revert |
|---|----------|----------------------|-------------------|-----------------------------------------------|--------|
| 1 | `package.json` `main` zurueck auf `expo-router/entry` | "sets package.json main to the custom entry file" | Sofort ROT (`expected 'expo-router/entry' to be 'index.js'`) | — (kein Fix noetig) | Gruen, `git diff --stat` leer |
| 2 | `.js`-Endung von `polyfill-force.js` auf `polyfill-force` entfernt | "imports the FORCED polyfill variant with its required .js suffix" | Sofort ROT (`expected ... to contain '...polyfill-force.js'`) | — (kein Fix noetig) | Gruen, `git diff --stat` leer |
| 3 | `de`-Locale-Data-Import aus `intl-polyfill.ts` geloescht | "carries a locale-data import for every member of SUPPORTED_LOCALES" | FALSCH GRUEN (False Negative — Kommentarprosa matchte, siehe Deviations Punkt 2) | Nach Haertung: ROT (`expected ... to contain '...locale-data/de.js'`) | Gruen, `git diff --stat` leer |

Vollstaendige Suite nach jedem Revert: 193/193 Tests, 18 Dateien.

## Geraeteverifikation (Task 4)

- **Native `typeof Intl.PluralRules` vor dem Polyfill:** `undefined` — die Hermes-Engine-Luecke aus der Diagnose ist damit erstmals GERAETE-verifiziert bestaetigt, nicht nur aus Upstream-Dokumentation (facebook/hermes#1462) und FormatJS-Doku abgeleitet.
- **Wert nach dem Polyfill:** `function`
- **Vollstaendige Log-Zeile (verbatim vom User gemeldet):** `[intl-polyfill] native Intl.PluralRules: undefined, after polyfill: function`
- **Profil-Screen:** oeffnet sich fehlerfrei (User: "approved, funktioniert jetzt")
- **Meta-Zeile (Schritt 4, "0 Festivals · 0 Friends"-Form):** NICHT transkribiert vom User. Nur der Bildschirmerfolg ist belegt — die exakte gerenderte Zeichenkette geht erst ueber `/gsd-verify-work 06 --ws mobile` formal zu Protokoll. Keine geratene Zeile wird hier als Beobachtung gefuehrt.
- **UAT Test 5 (c) und (d):** AUSDRUECKLICH OFFEN. Beide judgment-tier-Verbote wurden bei diesem Checkpoint nur "angesehen, nicht beurteilt" (Plan-Vorgabe) und muessen formal ueber `/gsd-verify-work 06 --ws mobile` re-praesentiert werden — sie duerfen nie stillschweigend gruen werden.

## Issues Encountered

None ueber die in Deviations dokumentierten zwei Rule-1-Fixes hinaus.

## User Setup Required

None - keine externe Service-Konfiguration noetig.

## Next Phase Readiness

- G-06-5 (Profil-Screen-Crash) ist geschlossen und geraeteverifiziert; PROF-01 ist damit end-to-end erreichbar (vorher blockiert der Crash jeden Zugriff auf den Screen).
- **Nicht von diesem Plan geschlossen, formal offen fuer `/gsd-verify-work 06 --ws mobile`:** UAT Test 5 (c) und (d) — die beiden judgment-tier-Verbote zu erfundenen Messwerten bzw. Account-Bindung des Avatars. Diese muessen dort explizit re-praesentiert und beurteilt werden, nicht aus dieser Geraeteabnahme uebernommen.
- Die exakte gerenderte Meta-Zeile aus Task 4 Schritt 4 ist ebenfalls kein Teil dieser Freigabe und sollte bei der naechsten Gelegenheit (z. B. im UAT-Lauf) tatsaechlich transkribiert werden.
- Phase 6 als Ganzes bleibt bei `/gsd-verify-work 06 --ws mobile` — dieser Plan schliesst nur den G-06-5-Gap, nicht die Phase.

## Self-Check

- `apps/mobile/index.js` — FOUND
- `apps/mobile/lib/intl-capability.ts` — FOUND
- `apps/mobile/lib/intl-polyfill.ts` — FOUND
- `apps/mobile/lib/__tests__/intl-polyfill.test.ts` — FOUND
- Commit `3c7c120` — FOUND in `git log --oneline --all`
- Commit `568a9db` — FOUND in `git log --oneline --all`
- `pnpm --filter @quiks/mobile test` — 193/193 passed, 18 Dateien (orchestrator-verifiziert unabhaengig)
- `git diff ee283f0 HEAD -- apps/mobile/app/profil.tsx` — leer (orchestrator-verifiziert unabhaengig)
- `pnpm-lock.yaml`-Diff — beschraenkt auf `@formatjs/*` (orchestrator-verifiziert unabhaengig)

## Self-Check: PASSED

---
*Phase: 06-profile-friends-placeholders*
*Completed: 2026-08-12*
