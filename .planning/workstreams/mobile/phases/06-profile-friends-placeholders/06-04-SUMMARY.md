---
phase: 06-profile-friends-placeholders
plan: 04
subsystem: ui
tags: [react-native, components, design-tokens, accessibility, context-provider, lingui]

# Dependency graph
requires:
  - phase: 06-profile-friends-placeholders
    plan: 01
    provides: "app/_layout.tsx mit dem authentifizierten Stack.Protected-Block und der profil-Registrierung; die Screen-Shells für Mehr und Friends"
  - phase: 05.1-quiks-rename-ci-v1-0-rollout
    provides: "createStyles(colors)/useTheme() hell-first, fontFamilyForRole, typeRoles inkl. Tracking-Gate, ComingSoonTile als Pattern-A-Präzedenzfall"
provides:
  - "ListRow — geteilte Einstellungs-/Kontozeile mit Icon, Label, optionalem Wert, Chevron, Gefahr- und Deaktiviert-Variante"
  - "SettingsSwitch — Schalterzeile mit Label, optionaler Beschreibung und echter Deaktiviert-Variante"
  - "SoonToast — ToastProvider, useSoonToast() und die Hinweis-Pille: der EINE kommt-bald-Mechanismus der App (D-13)"
  - "ToastProvider app-weit montiert, innerhalb des ThemeProvider in app/_layout.tsx"
affects: [06-05, 06-06, 06-07, 06-09]

# Actuals (#2632) — estimateTokens-Skala (chars/4 über die tatsächlich geänderten
# Dateien), KEIN Harness-Tokenzähler. Der Planwert (55000) lag um rund das
# Elffache darüber; drei Komponentendateien sind schlicht wenig Text.
actuals:
  tokens: 4905
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Context-Provider mit No-op-Default statt Throw für rein dekorative UI-Signale (Idiom aus theme-context.tsx übernommen)"
    - "Einzel-Slot-Overlay: ein State, ein Timer, aufgeräumt beim Ersetzen UND beim Unmount"
    - "Overlay-Breite über links/rechts-Inset des Wrappers begrenzt statt über einen Dimensions-Read — rotations- und splitscreen-fest"

key-files:
  created:
    - apps/mobile/components/ListRow.tsx
    - apps/mobile/components/SettingsSwitch.tsx
    - apps/mobile/components/SoonToast.tsx
  modified:
    - apps/mobile/app/_layout.tsx

key-decisions:
  - "Der weiße Schalterdaumen nutzt das bestehende Token colors.primaryForeground statt einer benannten Konstante — damit enthält KEINE der drei Dateien einen rohen Farbwert"
  - "disabled ist bei ListRow visuell + assistiv, kein Press-Gate: eine gedämpfte Zeile feuert weiter onPress und kann so mit dem Toast antworten; bei SettingsSwitch ist der Schalter dagegen echt disabled"
  - "badge und accessibilityLabel sind Props — die drei Komponenten enthalten keinerlei Copy, alle Sätze bildet der Aufrufer über Lingui"
  - "Die Pill-Breite wird über left/right: layout.screenPad des Wrappers begrenzt statt über useWindowDimensions — erfüllt UI-SPEC #37 ohne Dimensions-Read"
  - "Der Offene Punkt der UI-SPEC (Mindest-Tapgröße für eine Toast-Dismiss-Fläche) ist wie im Plan aufgelöst: die Pille bekommt keine Schließfläche, hitMin gilt für ListRow und SettingsSwitch"

patterns-established:
  - "Ein Overlay-Provider hängt innerhalb von ThemeProvider (Farben) und SafeAreaProvider (Inset) und rendert seine Pille als Geschwister der Navigation"
  - "Jede neue Komponente reicht accessibilityLabel als Pflicht-Prop nach außen, weil die no-literal-string-Regel dieses Attribut ausschließt"

requirements-completed: []

coverage:
  - id: D1
    description: "Es gibt genau EINEN kommt-bald-Mechanismus für die ganze App: ToastProvider/useSoonToast/SoonToast, app-weit montiert, Einzel-Slot mit Auto-Schließen (D-13)"
    requirement: PROF-01
    verification:
      - kind: other
        ref: "Akzeptanz-Greps: <ToastProvider in app/_layout.tsx (Z. 151, zwischen <ThemeProvider> Z. 149 und </ThemeProvider> Z. 154); ein einziger useState-Slot + ein einziger timerRef in SoonToast.tsx; kein zweiter Toast-/Sheet-Baustein im Repo"
        status: pass
    human_judgment: false
    rationale: "Struktureller Nachweis: Montageort und Einzel-Slot sind textuell prüfbar."
  - id: D2
    description: "Der Hinweis verdeckt die FloatingNav nie und fängt keine Taps ab (T-06-15)"
    requirement: PROF-01
    verification:
      - kind: other
        ref: "grep navHeight/navInset in SoonToast.tsx (je 1 Treffer, beide in der bottom-Berechnung zusammen mit insets.bottom + sp-4); pointerEvents: 'none' im wrapper-Style"
        status: pass
      - kind: manual_procedural
        ref: "Optische Freiraum-Prüfung am Gerät — NICHT in diesem Plan durchgeführt; gehört in den Geräte-Checkpoint der Folgepläne, sobald ein Screen den Toast tatsächlich auslöst"
        status: pending
    human_judgment: true
    rationale: "Die Rechnung ist statisch prüfbar, der tatsächliche optische Abstand über einer geblurrten Glasleiste nicht — der node-env-Vitest-Runner rendert keine RN-Komponenten."
  - id: D3
    description: "Der laufende Auto-Schließ-Timer wird beim Ersetzen und beim Unmount aufgeräumt (T-06-16)"
    requirement: PROF-01
    verification:
      - kind: other
        ref: "zwei clearTimeout-Stellen in SoonToast.tsx: Z. 59 im show-Callback (Ersetzen), Z. 72 in der Aufräumfunktion des useEffect (Unmount)"
        status: pass
    human_judgment: false
    rationale: "Reine Codestruktur, textuell nachweisbar."
  - id: D4
    description: "ListRow und SettingsSwitch tragen beide Platzhaltermuster (Pattern A gedämpft+Badge, Pattern B volle Deckkraft mit Chevron) und enthalten keinen Farbwert auf Modulebene, kein numerisches Schriftgewicht und kein hartcodiertes Barrierefreiheits-Label"
    requirement: FRND-01
    verification:
      - kind: other
        ref: "grep -nE '#[0-9a-fA-F]{3,8}|rgba?\\(' → 0 Treffer in allen drei Dateien; grep 'fontWeight: *[0-9]' → 0; grep 'accessibilityLabel=\"' → 0; useMemo(() => createStyles(colors), [colors]) in beiden Zeilenbausteinen; pnpm --filter @quiks/mobile lint/typecheck/test grün (17 Dateien, 188 Tests)"
        status: pass
      - kind: manual_procedural
        ref: "Optische Abnahme der Dämpfung, der Badge-Position in der Zeile und des eingeschalteten Dark-Mode-Schalters — NICHT in diesem Plan durchgeführt, kein Screen bindet die Komponenten bislang ein"
        status: pending
    human_judgment: true
    rationale: "Die Token-/Lint-Regeln sind maschinell beweisbar, die Wirkung der Dämpfung und die Lesbarkeit des Badges in einer Zeile sind Ermessensfragen am gerenderten Screen."

# Metrics
duration: ~25min
completed: 2026-08-11
status: complete
---

# Phase 6 Plan 04: Geteilte Bausteine — ListRow, SettingsSwitch, SoonToast Summary

**Drei wiederverwendbare RN-Primitiven-Bausteine auf geteilten Tokens plus der EINE app-weit montierte kommt-bald-Hinweis (D-13), auf dem die Screens der Wellen 3 und 4 aufsetzen — ohne dass jeder Screen sein eigenes Platzhalter-Feedback erfindet.**

## Performance

- **Duration:** ~25min (Kontextlesen, Umsetzung, Verifikation)
- **Completed:** 2026-08-11
- **Tasks:** 2 von 2
- **Files modified:** 4 (3 neu, 1 geändert)

## Accomplishments

- **`ListRow` trägt beide Platzhaltermuster der Phase in einer Komponente.** Icon, Pflicht-Label, optionaler rechtsbündiger Wert, Chevron ausschließlich bei gesetztem Press-Handler, Gefahr-Variante über `dangerText` (nie die bare Gefahr-Hue als Text) und Deaktiviert-Variante mit Deckkraft 0,45 plus dem Bald-Badge, das `ComingSoonTile` bereits rendert — hier nur inline statt in einer Ecke, weil eine horizontale Zeile keine freie Ecke hat. Mindesthöhe ist `layout.hitMin`.
- **`SettingsSwitch` schützt die Schalterzeile gegen beide Layoutfallen der UI-SPEC.** Die Textspalte schrumpft, der native RN-`Switch` behält seine Eigenbreite (#33); das Label ist einzeilig, die Beschreibung höchstens zweizeilig, die Zeile wächst mindestens auf die Mindest-Tapgröße (#34). Die Schiene ist im Aus-Zustand `fillQuiet`, im Ein-Zustand `primary` — der eingeschaltete Dark-Mode-Schalter ist damit das einzige funktional lebendige akzentfarbene Bedienelement dieser Phase.
- **Der eine kommt-bald-Mechanismus steht und ist montiert.** `SoonToast.tsx` folgt strukturell exakt `theme-context.tsx`: Context, Provider, Hook — inklusive der never-throw-Semantik, hier als dokumentierte No-op-Funktion außerhalb eines Providers. Ein einziger State-Slot und ein einziger Timer; ein neuer Aufruf ersetzt die sichtbare Nachricht sofort und startet den 2400-ms-Timer neu, es stapeln sich nie zwei Hinweise.
- **Der Hinweis kann die einzige globale Navigation der App nicht blockieren (T-06-15).** Die vertikale Position ist die Summe aus `layout.navHeight`, `layout.navInset`, dem unteren Safe-Area-Inset und `sp-4`; die Pille ist nicht interaktiv und lässt jeden Touch durch (`pointerEvents: 'none'`). Sie ist als höfliche Live-Region ausgezeichnet, damit Screenreader den Hinweis von selbst ansagen (T-06-18).
- **Keine der drei Dateien enthält Copy.** `badge`, `accessibilityLabel` und die Toast-Nachricht sind ausnahmslos Props; die Sätze nach dem Muster „{Feature} kommt bald." bildet jeder Aufrufer über Lingui. Damit bleiben die Bausteine frei von Copy-Entscheidungen und die Kataloge sammeln die Sätze dort, wo sie inhaltlich hingehören.
- **06-01s Arbeit an `app/_layout.tsx` ist unangetastet.** `<Stack.Screen name="profil" />` steht weiterhin im authentifizierten `Stack.Protected`-Block (Z. 473); der `ToastProvider` legt sich lediglich innerhalb des `ThemeProvider` um `RootNavigation`, die Provider-Reihenfolge und die Statusleisten-Konfiguration sind unverändert.

## Task Commits

1. **Task 1: ListRow und SettingsSwitch — die zwei Zeilenbausteine für Mehr und Profil** — `c09846c` (feat)
2. **Task 2: SoonToast — der eine gemeinsame kommt-bald-Hinweis samt Provider** — `a00ae76` (feat)

**Plan-Metadaten:** siehe der abschließende `docs(06-04)`-Commit dieses Summarys.

## Files Created/Modified

- `apps/mobile/components/ListRow.tsx` **neu** (192 Zeilen) — Zeilenbaustein mit Gefahr-, Wert- und Deaktiviert-Variante. Rendert ohne Press-Handler ein reines `View` ohne Button-Rolle und ohne Chevron, mit Handler ein `Pressable`.
- `apps/mobile/components/SettingsSwitch.tsx` **neu** (153 Zeilen) — Schalterzeile; im Deaktiviert-Fall ist der Schalter tatsächlich `disabled`, nicht nur gedämpft.
- `apps/mobile/components/SoonToast.tsx` **neu** (170 Zeilen) — `ToastProvider`, `useSoonToast()`, `SoonToast`-Pille; Einzel-Slot, Auto-Schließen, Timer-Aufräumung, Live-Region.
- `apps/mobile/app/_layout.tsx` — `ToastProvider` innerhalb des `ThemeProvider` um `RootNavigation` gelegt (+12 Zeilen, davon 8 Kommentar); keine bestehende Zeile entfernt oder umsortiert.

## Decisions Made

- **Weißer Schalterdaumen über `colors.primaryForeground` statt über eine benannte Konstante.** Das Akzeptanzkriterium erlaubte beides („als Token oder als benannte Konstante"). Das Token existiert bereits (CI §3 „Text darauf weiß"), ist modus-invariant und ergibt das strengere Ergebnis: **keine** der drei neuen Dateien enthält einen rohen Farbwert, nicht einmal den erlaubten.
- **`disabled` ist bei `ListRow` kein Press-Gate.** Eine gedämpfte Zeile feuert weiter `onPress`, weil genau das der Weg ist, wie eine tote Zeile wie „Zahlungsmittel" mit dem Toast antwortet; `accessibilityState` spiegelt das Flag trotzdem. Bei `SettingsSwitch` ist es umgekehrt — dort verlangt der Plan ausdrücklich einen echt `disabled`-Schalter, damit niemand einen Zustand einschalten kann, den nichts trägt.
- **Pill-Breite über den Wrapper statt über `useWindowDimensions`.** Der Wrapper sitzt links und rechts je eine `layout.screenPad` vom Rand; damit ist die Pille per Konstruktion auf Bildschirmbreite minus zwei Bildschirmränder begrenzt (UI-SPEC #37), ohne einen Dimensions-Read, der bei Rotation oder im Splitscreen nachziehen müsste.
- **Offener Punkt der UI-SPEC wie im Plan aufgelöst.** Die Spacing-Tabelle nennt die Mindest-Tapgröße auch für eine „Toast-Dismiss-Fläche", die Komponenten-Tabelle schließt eine Schließfläche aus. Umgesetzt ist die Komponenten-Tabelle: keine Schließfläche, `hitMin` gilt für `ListRow` und `SettingsSwitch`.
- **`zIndex: 10` auf dem Wrapper.** Die Pille ist ein Geschwister der Navigation im selben Elternknoten; die Deklarationsreihenfolge allein reicht auf Android nicht zuverlässig für die Überlagerung. `elevation` wurde bewusst nicht genutzt — es zöge einen Schatten nach sich, den das Design nicht vorsieht.

## Deviations from Plan

Keine. Beide Tasks wurden wie geschrieben ausgeführt; alle Akzeptanzkriterien sind ohne Anpassung erfüllt.

## Threat Flags

Keine neue sicherheitsrelevante Fläche. Die vier Einträge des Threat-Registers (T-06-15 bis T-06-18) sind umgesetzt: Positionsberechnung aus beiden Layout-Token plus Inset und `pointerEvents: 'none'` (T-06-15), Timer-Aufräumung an beiden Stellen plus Einzel-Slot (T-06-16), die Nachricht wird als reiner Text-Knoten gerendert und der Baustein enthält selbst keinen Text (T-06-17), höfliche Live-Region (T-06-18).

## Issues Encountered

- **Kein Dokumentations-Lookup möglich, ehrlich benannt.** Weder Context7-MCP-Tools noch die `ctx7`-CLI standen in diesem Agentenkontext zur Verfügung (`command -v ctx7` → nicht gefunden). Die genutzten APIs sind stabile RN-Kernflächen (`Switch` mit `trackColor`/`thumbColor`/`ios_backgroundColor`, `accessibilityLiveRegion`, `useSafeAreaInsets`); `useSafeAreaInsets` wurde stattdessen direkt gegen die installierte Typdeklaration geprüft (`react-native-safe-area-context/lib/typescript/src/SafeAreaContext.d.ts:22`), der Rest gegen den Typecheck. **Research-Annahme A5** (`accessibilityLiveRegion="polite"`) bleibt damit eine allgemein-RN-begründete, nicht dokumentationsverifizierte Setzung — sie ist im schlimmsten Fall wirkungslos, nie schädlich.
- **Verifikationsgrenze.** Der `apps/mobile`-Vitest-Runner ist node-env und rendert keine RN-Komponenten: die 188 grünen Tests beweisen für diesen Plan **nichts über das Aussehen oder Verhalten der drei Bausteine**. Bewiesen sind Typkorrektheit, Lint-Konformität (inkl. `no-literal-string`) und die textuellen Struktur-Greps. Dämpfung, Badge-Lesbarkeit, Freiraum der Pille über der Glasleiste und das Auto-Schließen sind ungeprüft und gehören in den Geräte-Checkpoint der Folgepläne, sobald ein Screen die Bausteine tatsächlich einbindet.
- **Bis 06-09 englisch.** Diese Datei enthält keine Copy, aber die Aufrufer bilden ihre Sätze als englische msgids (`lingui.config.ts` `sourceLocale: 'en'`); die deutschen Katalogwerte landen erst in 06-09.

## Known Stubs

Keine. Die drei Komponenten sind vollständig implementiert; sie haben lediglich in diesem Plan noch keinen Aufrufer — das ist der beabsichtigte Zuschnitt (Wave 2 baut die Bausteine, Wave 3/4 verdrahtet sie), kein Platzhalter im Code.

## User Setup Required

Keine — keine neue Abhängigkeit, kein natives Modul, keine Umgebungsvariable. Kein APK-Neubau nötig.

## Next Phase Readiness

**Freigegeben.** Die drei Bausteine stehen und der Provider ist montiert:

- `06-05` (restliche Mehr-Sektionen, Logout-Umzug) kann `ListRow` für Konto-/App-Zeilen und die rote Abmelden-Zeile nutzen, `SettingsSwitch` für Darstellung/Benachrichtigungen/Standort und `useSoonToast()` für jede tote Zeile.
- `06-06` (Friends-Blöcke) und `06-07` (Profil-Ausblick-Blöcke) nutzen denselben Hook — es gibt keinen zweiten Mechanismus, den sie erfinden könnten.
- **Mitzunehmen:** die in 06-01 inline gebauten Zeilen in `(tabs)/mehr.tsx` und `app/profil.tsx` sind noch NICHT auf `ListRow` umgestellt. Das ist der Auftrag von 06-05 bzw. 06-07 — bis dahin existieren zwei Zeilendarstellungen nebeneinander.

## Self-Check: PASSED

- `apps/mobile/components/ListRow.tsx` — vorhanden (192 Zeilen, min_lines 60)
- `apps/mobile/components/SettingsSwitch.tsx` — vorhanden (153 Zeilen, min_lines 50)
- `apps/mobile/components/SoonToast.tsx` — vorhanden (170 Zeilen, min_lines 70)
- `apps/mobile/app/_layout.tsx` — enthält `ToastProvider`
- Commit `c09846c` — in der Historie vorhanden
- Commit `a00ae76` — in der Historie vorhanden
- Alle Akzeptanz-Greps beider Tasks erfüllt; `lint` / `typecheck` / `test` (17 Dateien, 188 Tests) grün
- Keine Datei durch die beiden Commits gelöscht (`git diff --diff-filter=D HEAD~2 HEAD` leer)

---
*Phase: 06-profile-friends-placeholders*
*Completed: 2026-08-11*
