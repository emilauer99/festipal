---
phase: 06-profile-friends-placeholders
plan: 03
subsystem: ui
tags: [react-native, mmkv, theme, dark-mode, vitest, pure-logic, i18n-free]

# Dependency graph
requires:
  - phase: 05.1-quiks-rename-ci-v1-0-rollout
    provides: "hell-first resolveThemeMode/resolveThemeColors/resolveTheme in lib/theme.ts plus der ThemeProvider und der Testblock, der die Invariante gate-hält"
  - phase: 05-festival-selection-home
    provides: "active-festival-storage.ts als MMKV-Persistenzvorbild (lazy require, eigene Storage-Id, Fehlerschlucken, reine Entscheidungsfunktion getrennt von I/O) und date-range.ts als Muster für reine Datumslogik"
  - phase: 06-profile-friends-placeholders (Plan 02)
    provides: "meSchema.createdAt als ISO-String sowie die nullable Felder pronoun/birthDate/gender aus GET /me"
provides:
  - "ThemeOverride ('system' | 'light' | 'dark') und resolveEffectiveThemeMode als dünne Schicht über resolveThemeMode — die 05.1-Invariante bleibt unangetastet"
  - "lib/theme-override-storage.ts: MMKV-Persistenz mit eigener Storage-Id quiks-theme-override, reiner Validierung parseThemeOverride und geschluckten Lese-/Schreibfehlern"
  - "ThemeProvider liest den Override synchron beim ersten Render; useThemeOverride() liefert Wert + Setter für den Dark-Mode-Schalter"
  - "lib/profile-age.ts: deriveAge — Alter aus YYYY-MM-DD, kalenderbasiert, null bei leer/unparsbar/ungültig/zukünftig"
  - "lib/profile-meta-line.ts: buildIdentityLine, buildProfileMetaLine, createdAtYear — Lingui-freie Bausteine des Profilkopfs"
affects: [06-05, 06-07]

# Actuals (#2632) — estimateTokens-Skala (chars/4 über den realisierten Diff),
# gemessen als `git diff 053e5fe HEAD | grep '^+'` = 30.448 Zeichen.
# Der Plan schätzte 55.000 Tokens bei confidence: low — die tatsächliche
# Zahl liegt bei rund einem Siebtel davon. Nicht geschönt: der Plan war
# eine reine Logik-/Persistenzscheibe ohne Screen-Code, und genau solche
# Scheiben werden von der Schätzheuristik systematisch überschätzt.
actuals:
  tokens: 7600
  tasks: 2
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ein persistierter Override ist eine SCHICHT über der bestehenden Auflösung, nie ein Ersatz: der Default-Zweig delegiert wörtlich an die alte Funktion, damit deren Bestandstest die Invariante weiter gate-hält"
    - "MMKV-Speichermodule spalten sich in eine reine Validierungsfunktion (node-testbar) und einen dünnen I/O-Wrapper (Fehler geschluckt) — Fortführung des active-festival-storage.ts-Splits"
    - "Ein gespeicherter Wert ist untrusted input: er wird gegen die erlaubte Menge geprüft, bevor er einen Farbzustand erzeugt"
    - "Reine Ableitungen nehmen den Bezugszeitpunkt als Parameter entgegen und erzeugen ihn nie selbst — sonst sind Datumsgrenzfälle nicht testbar"
    - "Testreferenzdaten werden lokal konstruiert (new Date(2026, 7, 11)), nie aus einem Datums-String geparst — der String ist UTC-Mitternacht und verschiebt in negativen Zeitzonen den Kalendertag"

key-files:
  created:
    - apps/mobile/lib/theme-override-storage.ts
    - apps/mobile/lib/profile-age.ts
    - apps/mobile/lib/profile-meta-line.ts
    - apps/mobile/lib/__tests__/theme-override-storage.test.ts
    - apps/mobile/lib/__tests__/profile-age.test.ts
    - apps/mobile/lib/__tests__/profile-meta-line.test.ts
  modified:
    - apps/mobile/lib/theme.ts
    - apps/mobile/lib/theme-context.tsx
    - apps/mobile/lib/__tests__/theme.test.ts

key-decisions:
  - "vi.mock('react-native-mmkv') wurde durch einen Split aus reiner Validierung plus echtem Fehlerpfad ersetzt — der lazy CJS-require umgeht Vitests ESM-Mocking nachweislich (Probe dokumentiert)"
  - "Der Provider exponiert den Override über einen ZWEITEN Hook (useThemeOverride) statt useTheme zu erweitern; jeder bestehende Aufrufer bleibt unangetastet"
  - "Der Setter außerhalb eines Providers ist ein No-op und schreibt bewusst NICHT in den Speicher — ein Write ohne Re-Render ließe UI und Speicher auseinanderlaufen"
  - "createdAtYear liefert das LOKALE Jahr (getFullYear), nicht das UTC-Jahr — „seit 2025 dabei\" meint das Jahr, das der Visitor erlebt hat"
  - "buildIdentityLine prüft age explizit gegen null/undefined statt auf Truthiness — ein Alter von 0 ist ein gültiger Wert"
  - "Die Testreferenzdaten weichen von den Literalen des Plans ab (lokale Konstruktion statt new Date('2026-08-11')); die geprüften Alterswerte sind identisch"

patterns-established:
  - "Neue Zustände an lib/theme.ts werden additiv angehängt; resolveThemeMode/resolveThemeColors/resolveTheme bleiben unverändert und behalten ihren Testblock"
  - "Jedes neue MMKV-Modul bekommt eine eigene Storage-Id im Schema quiks-<domäne> und deklariert seinen MMKV-Ausschnitt lokal, statt einen (auch nur type-only) Import auf react-native-mmkv zu setzen"
  - "Reine lib/-Module tragen ihren Grund für die Reinheit im Modulkommentar: der node-env-Runner deckt nur lib/ ab, Logik in Screen-Code ist ungetestet"

# Bewusst LEER, wie schon in 06-01 und 06-02: PROF-01 steht in der
# Plan-Frontmatter, wird aber von 06-05 bis 06-09 weitergebaut. Dieser Plan
# liefert nur die reine Logik dahinter — ein Abhaken jetzt waere ein falsches
# Fertig-Signal an den Audit-Scanner. Die coverage-Eintraege verlinken PROF-01
# weiterhin zur Nachverfolgung.
requirements-completed: []

coverage:
  - id: D1
    description: "Der Theme-Override kennt drei Zustände und liegt strikt über der Geräteauflösung (D-08a)"
    requirement: PROF-01
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/theme.test.ts#resolveEffectiveThemeMode (persisted override above the device scheme, D-08a) — 9 Fälle inkl. aller sieben Auflösungskombinationen"
        status: pass
    human_judgment: false
  - id: D2
    description: "Die 05.1-Invariante bleibt byte-genau erhalten: der bestehende hell-first-Testblock läuft unverändert grün"
    requirement: PROF-01
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/theme.test.ts#resolveThemeMode (hell-first default, D-01) — unverändert, 6 Tests grün"
        status: pass
      - kind: other
        ref: "git diff 46793bc -- apps/mobile/lib/__tests__/theme.test.ts | grep '^-' — einzige entfernte Zeile ist die Import-Zeile; keine Zeile aus dem Invarianten-Block. Zusätzlich: grep -c \"scheme === 'dark'\" apps/mobile/lib/theme.ts = 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Ein Lese- oder Schreibfehler im Override-Speicher wird geschluckt und fällt auf 'system' zurück (UI-SPEC #32, T-06-12)"
    requirement: PROF-01
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/theme-override-storage.test.ts#theme override storage I/O (UI-SPEC #31/#32 — synchronous, never a gate) — MMKV ist unter node echt nicht ladbar, der Fehlerpfad läuft real"
        status: pass
    human_judgment: false
  - id: D4
    description: "Ein manipulierter oder unbekannter gespeicherter Wert erzeugt keinen undefinierten Farbzustand (T-06-11)"
    requirement: PROF-01
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/theme-override-storage.test.ts#parseThemeOverride (T-06-11 — a stored value is untrusted input)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Der Override überlebt einen App-Neustart und der Schalter reagiert sofort statt erst nach einem Neustart"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/theme-override-storage.test.ts (Persistenz-Schnittstelle) + apps/mobile/lib/theme-context.tsx (useState-Seed + Setter)"
        status: unknown
    human_judgment: true
    rationale: "Der node-env-Runner kann weder MMKV noch React rendern. Ob der Wert einen echten Neustart überlebt und ob der Schalter sofort umschaltet, ist erst am Gerät prüfbar — und erst, wenn 06-05 den Schalter im Mehr-Screen gebaut hat. Gehört in die UAT dieser Phase."
  - id: D6
    description: "Das Alter wird aus birth_date abgeleitet und nirgends persistiert; Geburtstag-noch-nicht-erreicht und 29. Februar sind korrekt (D-12a, T-06-13)"
    requirement: PROF-01
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/profile-age.test.ts#deriveAge (D-12a — derived, never stored) — 9 Gruppen inkl. 2004-02-29 gegen den 28.02. und den 01.03., Zukunftsdatum, Kalender-Rollover"
        status: pass
    human_judgment: false
  - id: D7
    description: "Identitäts- und Meta-Zeile fügen nur nicht-leere Teile zusammen; alle drei leer ergibt null, nie einen hängenden Trenner (D-04, D-12)"
    requirement: PROF-01
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/profile-meta-line.test.ts#buildIdentityLine (D-12 — omit-if-empty, fixed order) und #buildProfileMetaLine (D-04) und #createdAtYear"
        status: pass
    human_judgment: false

# Metrics
duration: ~20min
completed: 2026-08-11
status: complete
---

# Phase 6 Plan 03: Reine Logik und Persistenz — Theme-Override und Profilkopf-Ableitungen Summary

**Ein dreistufiger, persistierter Theme-Override als Schicht über der unangetasteten 05.1-Auflösung, plus drei reine Ableitungen für den Profilkopf (Alter, Identitätszeile, Meta-Zeile) — 24 neue Tests im node-env-Runner, 188 von 188 grün.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2 von 2
- **Files modified:** 9 (6 neu, 3 geändert)
- **Commits:** 4 (je Task ein RED- und ein GREEN-Commit)

## Accomplishments

- **Der Override ist eine Schicht, kein Ersatz.** `resolveEffectiveThemeMode(override, scheme)` beantwortet `'dark'` und `'light'` direkt und gibt den `'system'`-Zweig wörtlich an `resolveThemeMode(scheme)` weiter. `resolveThemeMode`, `resolveThemeColors` und `resolveTheme` sind unverändert; der bestehende hell-first-Testblock läuft ohne eine einzige geänderte Zeile weiter grün und hält die 05.1-Invariante damit weiterhin als Gate. Ein zusätzlicher Test prüft den `'system'`-Zweig Wert für Wert **gegen `resolveThemeMode` selbst** — eine spätere „Vereinfachung", die die Schema-Prüfung in den Override-Pfad kopiert, fällt dort durch.
- **Der gespeicherte Wert ist untrusted input.** `parseThemeOverride` akzeptiert ausschließlich `'system'`, `'light'`, `'dark'`; alles andere — fehlend, leer, `'DARK'`, ein JSON-Fragment — ergibt `'system'`. Damit kann ein manipulierter MMKV-Eintrag keinen undefinierten Farbzustand erzeugen (T-06-11).
- **Ein Speicherfehler ist nie ein Gate.** `getThemeOverride()` und `saveThemeOverride()` schlucken jeden Fehler nach dem Vorbild von `active-festival-storage.ts`. Der Nachweis ist hier **kein Mock**: unter dem node-Runner ist MMKV tatsächlich nicht ladbar, der `require` wirft echt, und die Assertions messen den realen Rückfall auf `'system'` (UI-SPEC #32, T-06-12).
- **Der erste Frame ist nie ungestylt.** Der Provider seedet seinen State über `useState(getThemeOverride)` — ein synchroner MMKV-Lesevorgang während des ersten Renders, kein Effect, kein Ladezustand, kein unbestimmter Schalter (UI-SPEC #31).
- **Der Schalter wird sofort sichtbar.** `useThemeOverride()` liefert den rohen Override plus einen Setter, der schreibt **und** den lokalen State aktualisiert. `useTheme()` behält Signatur und never-throw-Semantik; kein bestehender Aufrufer wurde angefasst.
- **Das Alter existiert nur als Ableitung (D-12a).** `deriveAge` rechnet auf Kalenderkomponenten, nicht auf Millisekunden: der 29.-Februar-Geborene wird im Nicht-Schaltjahr erst am 1. März ein Jahr älter, und ein Geburtstag später im Jahr zählt nicht mit. Leere, unparsbare, kalenderungültige (`2000-02-30`, `2005-02-29`) und zukünftige Werte ergeben `null` statt einer negativen Zahl (T-06-13).
- **Die Zeilen des Profilkopfs sind Lingui-frei und trennerfest.** `buildIdentityLine` verbindet nur die nicht-leeren der drei Felder in fester Reihenfolge und liefert `null` — nicht `''` — wenn alle drei fehlen, damit der Aufrufer die Zeile ganz weglassen kann. Ein Alter von `0` bleibt erhalten (explizite null-Prüfung statt Truthiness). `buildProfileMetaLine` fügt die bereits lokalisierten Teilstücke zusammen; `createdAtYear` liest das Jahr aus dem ISO-`createdAt`.

## Task Commits

1. **Task 1: Persistierter Theme-Override als Schicht über der bestehenden Modusauflösung** — `c5569ce` (test, RED) → `69c2df5` (feat, GREEN)
2. **Task 2: Reine Ableitungen für den Profilkopf — Alter, Meta-Zeile, Identitätszeile** — `9c94f43` (test, RED) → `1cb5eaf` (feat, GREEN)

Beide Tasks trugen `tdd="true"`; der RED-Lauf war jeweils echt (Task 1: 9 neue Tests rot, 24 bestehende grün; Task 2: beide Dateien konnten das Modul nicht importieren). Ein REFACTOR-Commit war in keinem Fall nötig.

## Files Created/Modified

- `apps/mobile/lib/theme.ts` — **geändert**, rein additiv: neuer Typ `ThemeOverride` und die reine Funktion `resolveEffectiveThemeMode`. Der Doc-Kommentar hält fest, warum die Scheme-Prüfung nicht dupliziert werden darf.
- `apps/mobile/lib/theme-override-storage.ts` — **neu**: Storage-Id `quiks-theme-override`, Schlüssel `theme-override`, lazy `require('react-native-mmkv')` innerhalb des Accessors, lokal deklarierter MMKV-Ausschnitt (bewusst **kein** type-only Import), `parseThemeOverride` + zwei fehlerschluckende I/O-Funktionen.
- `apps/mobile/lib/theme-context.tsx` — **geändert**: zweiter Context `ThemeOverrideContext` mit sicherem Default, `useState(getThemeOverride)`-Seed, `useMemo` über `resolveEffectiveThemeMode` + `resolveThemeColors`, `useCallback`-Setter, neuer Hook `useThemeOverride()`.
- `apps/mobile/lib/profile-age.ts` — **neu**: `deriveAge(birthDate, now)` plus interner `parseDateOnly` mit Rollover-Guard.
- `apps/mobile/lib/profile-meta-line.ts` — **neu**: `buildIdentityLine`, `buildProfileMetaLine`, `createdAtYear`, gemeinsamer `joinFragments`-Helfer mit dem Trenner ` · `.
- `apps/mobile/lib/__tests__/theme.test.ts` — **geändert**: nur die Import-Zeile erweitert und ein neuer describe-Block angehängt; kein bestehender Block berührt.
- `apps/mobile/lib/__tests__/theme-override-storage.test.ts`, `profile-age.test.ts`, `profile-meta-line.test.ts` — **neu**, 24 Tests.

## Decisions Made

- **`vi.mock` ersetzt durch einen echten Fehlerpfad plus reine Validierung.** Siehe „Deviations" — die Entscheidung ist begründet und mit einer Probe belegt.
- **Zweiter Hook statt erweitertem `useTheme()`.** Ein Konsument, der nur Farben malt, soll nicht neu rendern, wenn sich die rohe Präferenz ändert, und der Setter soll aus genau einer Stelle erreichbar sein. `useTheme()` bleibt dadurch byte-identisch in Signatur und Semantik — für alle heutigen Aufrufer ein No-op.
- **Der Setter außerhalb eines Providers schreibt nicht.** Der Default-Context liefert einen No-op-Setter statt zu werfen (dasselbe „safe default"-Idiom wie `useTheme`). Er schreibt bewusst nicht in den Speicher: ein Write ohne Provider, der neu rendert, ließe UI und persistierten Wert auseinanderlaufen.
- **`createdAtYear` nimmt das lokale Jahr.** `getFullYear()` statt `getUTCFullYear()` — wie in der UI-SPEC notiert. „seit 2025 dabei" bezeichnet das Jahr, in dem der Visitor sich angemeldet hat, nicht das UTC-Jahr des Zeitstempels.
- **`age: 0` ist ein Wert, kein leeres Feld.** `buildIdentityLine` prüft explizit gegen `null`/`undefined`; eine Truthiness-Prüfung hätte den Neugeborenen-Fall stillschweigend verschluckt. Beide Fälle sind getestet.
- **Lokale Testreferenzdaten.** `new Date(2026, 7, 11)` statt `new Date('2026-08-11')` — siehe „Deviations".

## Deviations from Plan

Zwei Abweichungen, beide begründet, keine mit Auswirkung auf ein `must_haves`-Kriterium.

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `vi.mock('react-native-mmkv')` kann den lazy `require` nicht abfangen — Teststrategie umgestellt**

- **Found during:** Task 1, vor dem Schreiben der Speichertests
- **Issue:** Der Plan (Task 1, Schritt 4) schreibt vor, das lazy geladene MMKV-Modul über `vi.mock` zu ersetzen. Vitests Modul-Mocking hängt sich in den ESM-Graph (`__vite_ssr_import__`); ein von vite-node bereitgestelltes `require()` geht daran vorbei direkt an Nodes Resolver. Eine Probe hat das hart belegt: mit registriertem `vi.mock('react-native-mmkv', …)` löste der `require` weiterhin das **echte** Paket auf und warf `Cannot find module …/react-native-mmkv/lib/createMMKV/…` (der Paket-Entry ist ein RN-/Native-Build ohne Node-Artefakt). Ein Mock an dieser Stelle wäre Dekoration ohne Wirkung gewesen — und hätte einen Test erzeugt, der etwas anderes prüft, als er behauptet.
- **Fix:** Das Speichermodul wurde nach dem Vorbild von `active-festival-storage.ts` gespalten: die **reine** Entscheidungsfunktion `parseThemeOverride` trägt jede Validierung und ist erschöpfend getestet; die I/O-Funktionen werden **real** ausgeführt, weil MMKV unter node tatsächlich nicht lädt — der Fehlerpfad ist damit echt statt simuliert. Alle vier vom Plan geforderten Speicher-Verhalten sind abgedeckt (Vorgabewert, unbekannter Wert, werfender Lesezugriff, werfender Schreibzugriff); keines davon verlangt das Lesen eines real gespeicherten Werts. Die Begründung inklusive Probe-Ergebnis steht als Kommentar in der Testdatei.
- **Files modified:** `apps/mobile/lib/__tests__/theme-override-storage.test.ts`, `apps/mobile/lib/theme-override-storage.ts` (exportiert `parseThemeOverride`)
- **Verification:** `npx vitest run lib/__tests__/theme-override-storage.test.ts` — 7 Tests grün; die Probe-Datei wurde nach der Messung gelöscht und nie committet.
- **Committed in:** `c5569ce` (RED) / `69c2df5` (GREEN)
- **Restrisiko, ehrlich benannt:** Der Pfad „ein gültiger Wert liegt im Speicher und kommt unverändert zurück" ist unter diesem Runner **nicht** ausführbar. Bewiesen ist die Entscheidungslogik (`parseThemeOverride('dark') === 'dark'`) und der Fehlerpfad; die Verdrahtung zwischen `getString()` und `parseThemeOverride` ist eine einzeilige Delegation und bleibt bis zur Geräte-UAT ungetestet (siehe Coverage D5).

**2. [Rule 1 - Bug (präventiv)] Testreferenzdaten lokal konstruiert statt aus einem Datums-String geparst**

- **Found during:** Task 2, beim Schreiben der Altersfälle
- **Issue:** Der Plan listet die Fälle wörtlich als `deriveAge('2000-08-11', new Date('2026-08-11'))`. `new Date('2026-08-11')` ist UTC-Mitternacht; in jeder negativen Zeitzone liest `getDate()` daraus den **10.** August. Der Fall „am Geburtstag selbst" hätte dann 25 statt 26 ergeben — die Suite wäre in Wien grün und in einer US-CI rot. Genau diese Verschiebung dokumentiert `lib/date-range.ts` bereits als REVIEW-05-03-Befund.
- **Fix:** Die Referenzzeitpunkte werden lokal konstruiert (`new Date(2026, 7, 11)`, `new Date(2026, 1, 28)`, `new Date(2026, 2, 1)`). Die **geprüften Alterswerte sind unverändert** die des Plans; nur die Konstruktion ist zeitzonenfest. Der Grund steht als Kommentar über den Konstanten.
- **Files modified:** `apps/mobile/lib/__tests__/profile-age.test.ts`
- **Verification:** Alle 9 Assertionsgruppen grün; die Werte 26/25/26/25/21/22 entsprechen exakt der `<behavior>`-Liste des Plans.
- **Committed in:** `9c94f43`

---

**Total deviations:** 2 auto-fixed (1 blockierend, 1 präventiver Bugfix)
**Impact on plan:** Keine `must_haves`-Zeile, kein Akzeptanzkriterium und kein geprüfter Wert wurde verändert. Abweichung 1 tauscht ein wirkungsloses Mocking gegen einen echten Fehlerpfad plus reine Validierung — mit dem oben benannten Restrisiko. Abweichung 2 hält identische Assertionen, macht sie nur zeitzonenfest.

## Threat-Model-Stand

- **T-06-11 (Tampering, mitigate) — erfüllt.** `parseThemeOverride` prüft gegen die drei erlaubten Member; `'purple'`, `'DARK'` und ein JSON-Fragment ergeben nachweislich `'system'`.
- **T-06-12 (DoS, mitigate) — erfüllt, und zwar gegen einen echten Fehler.** Unter dem node-Runner wirft der MMKV-Zugriff tatsächlich; `getThemeOverride()` liefert trotzdem `'system'` und `saveThemeOverride()` wirft nicht.
- **T-06-13 (Tampering, mitigate) — erfüllt.** `deriveAge` liefert `null` für unparsbare, kalenderungültige und zukünftige Geburtsdaten; ein negativer Wert ist ausgeschlossen (`age < 0 ? null : age`), getestet für `2030-01-01` und `2026-12-24`.
- **T-06-14 (Information Disclosure, accept) — unverändert getragen.** Kein Alter und kein Geburtsdatum wird gerätelokal persistiert; der einzige neue MMKV-Eintrag ist der Theme-Override.

## Issues Encountered

- **Die vom Plan vorgeschriebene Mocking-Strategie funktioniert unter diesem Runner nicht.** Vollständig unter „Deviations" beschrieben, inklusive der Probe, mit der das gemessen wurde.
- **`pnpm --filter @quiks/mobile test -- theme` filtert nicht.** Dasselbe Verhalten, das schon 06-02 für `apps/api` notiert hat: das Argument nach `--` erreicht Vitest nicht als Namensfilter. Für die gezielten Läufe wurde `npx vitest run <pfad>` aus `apps/mobile` verwendet; der Gesamtlauf (`npx vitest run`) ist mit 17 Dateien / 188 Tests grün.
- **Kein Metro-Watcher gestartet, kein `pnpm install` gelaufen.** Die Windows-ENOENT-Race konnte nicht auftreten; es bleibt kein Prozess zurück.

## User Setup Required

Keine. Keine neue Abhängigkeit, keine Umgebungsvariable, keine Migration. Der neue MMKV-Speicher legt sich beim ersten Schreibzugriff selbst an.

## Next Phase Readiness

- **06-05 (Mehr-Screen)** findet alles vor, was der Dark-Mode-Schalter braucht: `useThemeOverride()` liefert `override` und `setThemeOverride`. Laut UI-SPEC spiegelt der Schalter den **effektiven Modus** (`useTheme().mode === 'dark'`), schreibt beim Umschalten aber ausdrücklich `'dark'` oder `'system'` — nie `'light'`.
- **06-07 (Profilkopf)** kann `deriveAge`, `buildIdentityLine`, `buildProfileMetaLine` und `createdAtYear` direkt konsumieren. Die Lokalisierung bleibt beim Screen: die Pluralformen für Festivals und Friends und die Formulierung „seit {Jahr} dabei" entstehen dort über Lingui-Makros, weil diese Module bewusst Lingui-frei sind. Die Festivals-Zahl kommt aus der bereits gecachten `festivalKeys.mine`-Query, nicht aus einer zweiten Abfrage.
- **Offener Punkt für die UAT dieser Phase (Coverage D5):** dass der Override einen echten App-Neustart überlebt und der Schalter sofort umschaltet, ist erst am Gerät prüfbar — der node-env-Runner kann weder MMKV noch React rendern. Nach der Lehre aus Phase 5 gilt: am Gerät verifizieren, nicht aus grünen node-Tests schließen.

## Self-Check: PASSED

- `apps/mobile/lib/theme-override-storage.ts`, `profile-age.ts`, `profile-meta-line.ts` — vorhanden und getrackt
- `apps/mobile/lib/__tests__/theme-override-storage.test.ts`, `profile-age.test.ts`, `profile-meta-line.test.ts` — vorhanden und getrackt
- Commits `c5569ce`, `69c2df5`, `9c94f43`, `1cb5eaf` — alle vier in der Historie vorhanden
- Alle Akzeptanz-Greps beider Tasks erfüllt: `resolveEffectiveThemeMode` exportiert · `grep -c "scheme === 'dark'"` = 1 · kein react/react-native-Import in `theme.ts` · kein `react-native-mmkv`-Import in `theme-override-storage.ts` · kein `react`/`react-native`/`@lingui`-Import in den beiden Profil-Modulen · kein `new Date()` in `profile-age.ts` · keine entfernte Zeile aus dem hell-first-Block
- `npx vitest run` (apps/mobile): 17 Dateien, 188 Tests grün · `pnpm --filter @quiks/mobile typecheck` grün · `pnpm --filter @quiks/mobile lint` grün
- Keine gelöschte Datei im Diff gegen die Ausgangsbasis; keine unbeabsichtigt untracked gelassene Datei

---
*Phase: 06-profile-friends-placeholders*
*Completed: 2026-08-11*
