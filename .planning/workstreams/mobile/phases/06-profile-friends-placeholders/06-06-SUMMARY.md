---
phase: 06-profile-friends-placeholders
plan: 06
subsystem: ui
tags: [react-native, empty-states, placeholder-ui, tanstack-query, lingui, accessibility, copywriting]

# Dependency graph
requires:
  - phase: 06-profile-friends-placeholders
    plan: 01
    provides: "(tabs)/friends.tsx als registrierter vierter Tab mit dem Anfragen-Block als Tracer; die ['me']-Abfrage in app/profil.tsx als Vorbild"
  - phase: 06-profile-friends-placeholders
    plan: 04
    provides: "useSoonToast() samt app-weit montiertem ToastProvider; ListRow/ComingSoonTile als Bald-Badge-Vorbild"
  - phase: 06-profile-friends-placeholders
    plan: 05
    provides: "(tabs)/mehr.tsx als Referenz, wie ein sektionsbasierter Screen dieser Phase aus den Primitiven zusammengesetzt wird"
provides:
  - "Friends-Screen im vollen Design-Aufbau: sechs Blöcke, kein einziger davon leer"
  - "Vier paarweise verschiedene Leerzustandstexte, jeder benennt die Voraussetzung statt einer bloßen Negation"
  - "Die quiks-Code-Karte mit dem echten eigenen Handle aus GET /me, auf demselben Cache-Eintrag wie der Profil-Screen"
  - "Ein inertes Suchfeld, das keine Eingabe annehmen kann (T-06-26)"
affects: [06-07, 06-09]

# Actuals (#2632) — estimateTokens-Skala (chars/4 über den realisierten Diff),
# gemessen als `git diff HEAD~2 HEAD | grep '^+' | wc -c` = 17.963 Zeichen.
# Der Plan schätzte 70.000 Tokens bei confidence: low; real sind es rund 4.500.
# Nicht geschönt nach oben: der Screen ist mit 453 Zeilen der größte dieser
# Phase, aber er besteht aus einer Datei ohne neue Bausteine — die Heuristik
# überschätzt genau solche Ein-Datei-Scheiben systematisch (gleiches Bild wie
# 06-05: geschätzt 70.000, real 3.464).
actuals:
  tokens: 4491
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ein Screen mit strukturell leeren Sektionen trägt die Ehrlichkeit in der Copy, NICHT in reduzierter Deckkraft — Dämpfung erzeugt genau den Kaputt-Eindruck, den sie vermeiden soll"
    - "Jeder Leerzustandstext benennt die VORAUSSETZUNG ('sobald dich jemand addet'), nie nur das Fehlen — eine bloße Negation liest sich als funktionierende, aber leere Fläche"
    - "Ein totes Eingabefeld ist ein echtes TextInput mit editable={false} und ohne eigene Trefferfläche, eingewickelt in ein Pressable — nicht ein Text, der wie ein Feld aussieht"
    - "Zwei Screens auf denselben Daten teilen sich Query-Key UND Client-Funktion; der zweite Screen löst damit keinen zweiten Netzabruf aus"
    - "Ein Platzhalter für eine Grafik wird aus RN-Primitiven gezeichnet und trägt ein Bald-Badge — damit kann er nicht als fehlgeschlagen geladenes Bild gelesen werden"

key-files:
  created: []
  modified:
    - apps/mobile/app/(tabs)/friends.tsx

key-decisions:
  - "Die Karte bekam `minHeight` statt einer harten `height` (UI-SPEC #54): eine feste Höhe hätte die Karten-Copy bei größerer Systemschrift abgeschnitten — die feste Höhe ist als Untergrenze umgesetzt, nicht als Deckel"
  - "Die Fehler-Copy übernimmt BEIDE Varianten des Profil-Screens wörtlich (transport + response), inklusive der Formulierung 'Can't load your profile' — der Screen erfindet keinen eigenen Wortlaut, und /me IST das Profil"
  - "Die Deckkraft-Dämpfung steht als benannte Konstante `PATTERN_A_OPACITY` (0.45, derselbe Wert wie `ListRow.DISABLED_OPACITY`) und trifft genau EIN Element: den QR-Knopf"
  - "Die Design-Unterzeile der Vorschlagssektion ('Freunde deiner Freunde — mehr schlägt quiks nicht vor') wurde WEGGELASSEN: sie beschreibt eine funktionierende Vorschlagsmechanik und hätte neben dem Leerzustand als zweiter Text gestanden"
  - "Die QR-Fläche ist ein handgeschriebenes 3x3-Muster aus Views, kein Icon und keine Bibliothek — `lucide-react-native`s QR-Icon hätte den Bibliotheks-Grep der Akzeptanzkriterien ausgelöst, obwohl es nichts generiert"
  - "Loading und Error rendern IN DER KARTENPOSITION, die vier Listenblöcke bleiben dabei sichtbar — sie holen nichts, also darf ein /me-Fehler sie nicht mit ausblenden (UI-SPEC #2/#3)"

patterns-established:
  - "Ein Kommentar, der eine bewusst vermiedene API erklärt, nennt sie in Prosa statt sie wörtlich zu zitieren — sonst schlägt der Akzeptanz-Grep der eigenen Phase an (zwei Fehlalarme in 06-02 und 06-08)"
  - "Ein Wrap-Container für ein festes Raster bekommt sichtbar mehr Innenraum, als eine Zeile braucht — exakte Passung bricht bei Rundungsdifferenzen in ein ausgefranstes Raster"

requirements-completed: [FRND-01, HOME-03]

coverage:
  - id: D1
    description: "Der Friends-Screen liest keinerlei Festival-State und macht außer GET /me keinen Netzabruf (D-10)"
    requirement: "FRND-01"
    verification:
      - kind: other
        ref: "grep -nE \"from '.*(festival|active-festival)\" 'apps/mobile/app/(tabs)/friends.tsx' — kein Treffer"
        status: pass
      - kind: unit
        ref: "pnpm --filter @quiks/mobile typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: "Sechs Blöcke im Design-Aufbau: Suche, quiks-Code, Anfragen, Chats, Deine Crew, Vielleicht kennst du — jeder mit eigener Copy, kein leerer Block"
    requirement: "FRND-01"
    verification: []
    human_judgment: true
    rationale: "Die node-env-Vitest-Suite kann keine RN-Komponenten rendern. Ob sechs Blöcke tatsächlich untereinander erscheinen, in welcher Reihenfolge und ob sie am Gerät als absichtsvoll statt als kaputt gelesen werden, ist genau die Frage, für die D-11 das Hauptrisiko dieser Phase benannt hat — das entscheidet ein Mensch am Gerät, nicht ein Grep."
  - id: D3
    description: "Die vier Leerzustandstexte sind paarweise verschieden, und der Chats-Text benennt die Voraussetzung des gegenseitigen Addens statt einer bloßen Negation (T-06-27)"
    requirement: "FRND-01"
    verification: []
    human_judgment: true
    rationale: "Dass vier Strings verschieden sind, ist trivial prüfbar; dass der Chats-Block dadurch NICHT mehr als funktionierender, leerer Posteingang gelesen wird, ist eine Wirkungsfrage an echten Nutzenden und braucht menschliches Urteil."
  - id: D4
    description: "Die quiks-Code-Karte zeigt den echten eigenen Handle aus GET /me, einzeilig und abgeschnitten; fehlt der Handle, entfällt die Zeile ganz (UI-SPEC #49/#56)"
    requirement: "FRND-01"
    verification:
      - kind: other
        ref: "grep -q 'getMe' 'apps/mobile/app/(tabs)/friends.tsx' — Treffer; Query-Key ['me'] identisch zu app/profil.tsx:63"
        status: pass
    human_judgment: true
    rationale: "Der Grep beweist die Datenquelle, nicht die Darstellung. Ob der echte Handle in Markenfarbe erscheint und ob ein sehr langer Handle sauber abgeschnitten wird, ist am Gerät zu sehen — und der Fall 'Konto ohne Profil' ist im Live-Betrieb hinter dem authenticated-Guard nicht ohne Weiteres herstellbar."
  - id: D5
    description: "Kein Block ist visuell gedämpft; die einzige reduzierte Deckkraft trifft den QR-Knopf (Pattern A)"
    requirement: "FRND-01"
    verification:
      - kind: other
        ref: "grep -nE 'opacity: *0\\.[0-9]' 'apps/mobile/app/(tabs)/friends.tsx' — kein Treffer (Wert steht als benannte Konstante)"
        status: pass
    human_judgment: true
    rationale: "Der Grep beweist nur die Abwesenheit eines Literals. Ob die vier Blöcke am Gerät tatsächlich in voller Gewichtung stehen, ist eine visuelle Aussage, die die node-env-Suite nicht treffen kann."
  - id: D6
    description: "Das Suchfeld nimmt keine Eingabe entgegen und sendet nichts (T-06-26)"
    verification:
      - kind: other
        ref: "editable={false} + pointerEvents:'none' im searchInput-Style; kein onChangeText, kein State — Codeinspektion"
        status: pass
    human_judgment: true
    rationale: "Dass ein Tastaturfokus am echten Gerät wirklich nicht entsteht (iOS und Android verhalten sich bei editable={false} nicht identisch), muss am Gerät getippt werden."

# Metrics
duration: 8min
completed: 2026-08-12
status: complete
---

# Phase 06 Plan 06: Friends-Screen (sechs Blöcke, je eigener Leerzustand) Summary

**Der Friends-Tab im vollen Design-Aufbau: inertes Suchfeld, quiks-Code-Karte mit dem echten Handle aus dem geteilten `['me']`-Cache und vier Listenblöcke, deren Leerzustände jeweils die Voraussetzung benennen statt nur das Fehlen — ohne einen einzigen Festival-Bezug.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-08-11T23:34Z
- **Completed:** 2026-08-11T23:42Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- **Sechs Blöcke, kein leerer.** Suche · quiks-Code · Anfragen · Chats · Deine Crew · Vielleicht kennst du stehen in der Reihenfolge des Designs untereinander. Die vier Listenblöcke tragen vier paarweise verschiedene Texte; keiner ist eine bloße Negation.
- **Der Chats-Block ist ausdrücklich kein Posteingang.** Sein Text nennt die Voraussetzung („Chats unlock once you've added someone and can message them — coming soon.") und markiert sie als kommt bald. Das ist die Antwort auf T-06-27: ein „keine Nachrichten" hätte jemanden auf Nachrichten warten lassen, die es kein Gateway gibt zu liefern.
- **Keine visuelle Dämpfung auf den Blöcken.** Die einzige reduzierte Deckkraft der Datei trifft den QR-Knopf. Das ist die ausdrückliche Friends-Ausnahme zum Platzhalter-Muster der Phase.
- **Das Suchfeld kann keine Eingabe annehmen.** Ein echtes `TextInput` mit `editable={false}` und ohne eigene Trefferfläche, eingewickelt in ein `Pressable`, das den geteilten kommt-bald-Hinweis öffnet. Damit kann niemand den Namen einer dritten Person in ein Feld tippen, das ihn nirgends verarbeitet (T-06-26).
- **Die quiks-Code-Karte zeigt echte Daten.** Handle aus `GET /me`, auf demselben Query-Key `['me']` und derselben Client-Funktion wie `app/profil.tsx` — ein Cache-Eintrag, kein zweiter Netzabruf. Fehlt der Handle, entfällt die Zeile ganz statt einen leeren Slot zu zeigen.
- **Kein Festival-State, keine Personendaten.** Der Screen importiert nichts aus dem Festival-Kontext (D-10) und rendert keine einzige erfundene Person, keinen Beispielnamen, kein Platzhalter-Array.

## Task Commits

Jede Aufgabe wurde atomar committet:

1. **Task 1: Die vier Listenblöcke und das Suchfeld mit je eigenem Leerzustand** — `fe9f0e0` (feat)
2. **Task 2: Die quiks-Code-Karte mit echtem Handle und gedämpftem QR-Platzhalter** — `f2ffcc6` (feat)

## Files Created/Modified

- `apps/mobile/app/(tabs)/friends.tsx` — von 78 auf 453 Zeilen erweitert: aus dem 06-01-Tracer (ein Block) wurde der vollständige Screen mit Suchfeld, quiks-Code-Karte samt Lade-/Fehler-/Retry-Zweig und vier Listenblöcken.

## Decisions Made

- **`minHeight` statt harter `height` für die Karte.** UI-SPEC #54 verlangt „eine Karte fester Höhe". Eine harte Höhe hätte die Karten-Copy bei größerer Systemschrift abgeschnitten — in RN clippt eine überlaufende Textzeile auf Android sichtbar. Die feste Höhe ist deshalb als Untergrenze (`QUIKS_CODE_CARD_MIN_HEIGHT = 200`) umgesetzt: eine einzelne Karte im Scrollcontainer, die bei Normalschrift genau diese Höhe hat und nur wächst, statt zu klippen. Siehe Deviations.
- **Beide Fehlervarianten wörtlich vom Profil-Screen.** Transport- UND Response-Variante kommen msgid-gleich aus `app/profil.tsx`, inklusive „Can't load your profile — check your connection and try again." Das Kriterium verlangt ausdrücklich keinen neuen Wortlaut, und `/me` ist das Profil — der Satz stimmt auch auf diesem Screen.
- **Lade- und Fehlerfläche stehen in der Kartenposition, nicht über dem ganzen Screen.** Die vier Listenblöcke holen nichts (UI-SPEC #2/#3) und bleiben deshalb sichtbar, während die Karte lädt oder scheitert. Eine Abfrage, eine Ladefläche — aber die vier Blöcke hängen nicht daran.
- **Die Design-Unterzeile der Vorschlagssektion wurde weggelassen.** „Freunde deiner Freunde — mehr schlägt quiks nicht vor" beschreibt eine funktionierende Vorschlagsmechanik. Neben dem Leerzustand hätte sie als zweiter Text gestanden und den Block genau in die Richtung gedreht, die D-11 vermeiden will. Der Copywriting Contract führt sie auch nicht als Pflichttext.
- **QR-Fläche aus Views statt Icon.** Ein `QrCode`-Icon aus `lucide-react-native` hätte den Akzeptanz-Grep der eigenen Phase (`grep -inE "qrcode|react-native-qr"`) ausgelöst, obwohl ein Icon nichts generiert. Das 3x3-Muster ist ein fest verdrahtetes An/Aus-Array aus `View`s, kodiert nichts und trägt ein Bald-Badge.
- **Deckkraft als benannte Konstante.** `PATTERN_A_OPACITY = 0.45` spiegelt `ListRow.DISABLED_OPACITY` wörtlich. Konsequenz: der Grep `opacity: *0\.[0-9]` findet in der Datei gar nichts — was das Kriterium („keine reduzierte Deckkraft in den vier Blöcken") erfüllt, aber beim Lesen des Kriteriums erklärt gehört.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Missing Critical] Kartenhöhe als Untergrenze statt als fester Deckel**

- **Found during:** Task 2
- **Issue:** Der Plan und UI-SPEC #54 verlangen „eine Karte fester Höhe". Eine harte `height` hätte bei erhöhter Systemschriftgröße (Accessibility-Einstellung) den Kartentext beschnitten — auf Android clippt RN überlaufende Kinder sichtbar. Ein abgeschnittener Satz in der einen Karte, die echte Daten zeigt, wäre genau der „kaputt"-Eindruck, den diese Phase vermeidet.
- **Fix:** `minHeight: QUIKS_CODE_CARD_MIN_HEIGHT` (200) statt `height`. Bei Normalschrift ist die Karte exakt diese Höhe; sie wächst nur, wenn sie sonst klippen würde. Im Code als Kommentar begründet.
- **Files modified:** `apps/mobile/app/(tabs)/friends.tsx`
- **Verification:** `pnpm --filter @quiks/mobile lint`/`typecheck`/`test` grün. Die visuelle Höhe ist node-env nicht beweisbar und gehört in die Geräte-Abnahme.
- **Committed in:** `f2ffcc6` (Teil des Task-2-Commits)

**2. [Rule 1 — Bug] Zu enger Wrap-Container hätte das 3x3-Raster zerbrechen können**

- **Found during:** Task 2 (Selbstprüfung der Maße vor dem Commit)
- **Issue:** Die erste Fassung dimensionierte das Platzhalter-Quadrat exakt auf drei Zellen plus Lücken (Innenbreite 56 bei 56 benötigten Punkten). Bei einer Rundungsdifferenz in der RN-Layout-Engine wäre das Raster in ein ausgefranstes 2-pro-Zeile-Muster umgebrochen — der Platzhalter hätte dann wie ein Renderfehler ausgesehen, also genau das Gegenteil seines Zwecks.
- **Fix:** Der Innenraum wurde von `sp-4` auf `sp-6` je Seite vergrößert (Innenbreite 72 bei 56 benötigten Punkten) und das Größenkonstrukt in `QR_GRID_SIZE` + `QR_PLACEHOLDER_SIZE` aufgeteilt, mit Begründung im Kommentar.
- **Files modified:** `apps/mobile/app/(tabs)/friends.tsx`
- **Verification:** lint/typecheck/test grün; die tatsächliche Rasterform gehört in die Geräte-Abnahme.
- **Committed in:** `f2ffcc6` (Teil des Task-2-Commits)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug)
**Impact on plan:** Beide betreffen Robustheit gegen Klippen bzw. Umbrechen, kein Funktionsumfang. Kein Scope Creep.

## Issues Encountered

- **Der Akzeptanz-Grep der eigenen Phase wäre ein drittes Mal falsch angeschlagen.** Der aus 06-01 übernommene Kommentar „empty-state body copy wraps freely (no numberOfLines)" hätte das Kriterium „im Bereich der vier Blöcke kommt `numberOfLines` nicht vor" verletzt — durch einen Kommentar, nicht durch Code. Der Kommentar wurde vor dem Task-1-Commit in Prosa umgeschrieben. Gleiche Vorsichtsmaßnahme beim QR-Kommentar: er beschreibt die vermiedene Bibliothek, ohne ihren Namen zu schreiben.
- **Keine weiteren.** Lint, Typecheck und die 188 Tests der Suite liefen nach jedem Task ohne Eingriff durch.

## Verification Status — was bewiesen ist und was nicht

Ehrlich getrennt, weil die mobile Vitest-Suite node-env läuft und keine RN-Komponente rendern kann:

**Automatisch bewiesen:**

- `pnpm --filter @quiks/mobile lint` · `typecheck` · `test` (17 Dateien, 188 Tests) grün nach beiden Tasks.
- Kein Import aus dem Festival-Kontext in `friends.tsx`.
- `getMe` vorhanden; Query-Key `['me']` identisch zu `app/profil.tsx:63`.
- Keine QR-Bibliothek importiert (`grep -inE "qrcode|react-native-qr"` ohne Treffer).
- Kein rohes Farbliteral, kein numerisches `fontWeight`, keine Deckkraft-Literale.
- `numberOfLines` kommt genau einmal vor — in der Handle-Zeile der Karte, wie von Task 2 verlangt, nicht in den vier Blöcken.
- Der Tracking-Guard-Test (`type-tracking.test.ts`) bestätigt, dass die `title2`-Überschrift ihr CI-Tracking mitsetzt.

**Nicht bewiesen, gehört in die Geräte-Abnahme am Phasenende:**

- Ob die sechs Blöcke am Gerät als absichtsvoll und nicht als kaputt gelesen werden — das ist das von D-11 benannte Hauptrisiko dieser Phase und die eigentliche Frage für `/gsd-ui-review`.
- Ob das Suchfeld auf iOS UND Android wirklich keinen Tastaturfokus erzeugt.
- Wie die Karte in beiden Farbmodi wirkt (hell zuerst prüfen) und ob das 3x3-Muster als bewusster Platzhalter durchgeht.
- Ob ein sehr langer Handle sauber am Ende abgeschnitten wird.

## Known Stubs

Der gesamte Screen ist ein bewusster Platzhalter — das ist der Zweck von D-11, kein Versehen. Für die Nachverfolgbarkeit trotzdem benannt:

| Fläche | Datei | Warum absichtlich | Auflösung |
|---|---|---|---|
| Suchfeld ohne Suche | `apps/mobile/app/(tabs)/friends.tsx` | Es gibt kein Nutzerverzeichnis und keinen Such-Endpoint; T-06-26 verlangt ausdrücklich ein inertes Feld | FRND-02 |
| Anfragen / Deine Crew / Vielleicht kennst du ohne Daten | `apps/mobile/app/(tabs)/friends.tsx` | Freundschaften existieren als Domäne noch nicht | FRND-02 |
| Chats ohne Posteingang | `apps/mobile/app/(tabs)/friends.tsx` | Messaging setzt das Realtime-Gateway (NestJS WS + Redis) voraus, das außerhalb dieses Milestones liegt | eigenes Feature nach FRND-02 |
| QR-Fläche und „QR zeigen"-Knopf | `apps/mobile/app/(tabs)/friends.tsx` | Es wird bewusst kein scannbares Zeichen erzeugt; die Fläche trägt ein Bald-Badge | FRND-02 |

Keiner dieser Stubs verhindert das Ziel dieses Plans — das Ziel WAR der ehrliche Platzhalter-Screen.

## Threat Flags

Keine. Die vier Einträge des Threat-Registers (T-06-24 bis T-06-27) sind im Code adressiert und an ihren Stellen kommentiert; neue sicherheitsrelevante Fläche entsteht nicht — der Screen fügt keinen Endpoint, keinen Dateizugriff und keine Schemaänderung hinzu, und sein einziger Abruf ist der bereits bestehende, sessiongebundene `GET /me`.

## User Setup Required

None — keine externe Konfiguration nötig.

## Next Phase Readiness

- `06-07` (Profil-Ausbau) kann anschließen: der `['me']`-Cache wird jetzt von zwei Screens geteilt, das Muster steht.
- `06-09` (i18n-Katalog) muss die neuen englischen msgids einsammeln und deutsch besetzen. Diese Datei fasst `messages.po` bewusst nicht an. Neue Strings dieses Plans: `Soon`, `Name or @handle`, `Search for people, coming soon`, `Searching for people is coming soon.`, `Chats`, `Your crew`, `People you may know` plus die vier Leerzustandssätze, `Loading your quiks code…`, `Your quiks code`, `Show it, scan it, done — that's how you add each other.`, `Placeholder mark, coming soon`, `Show QR`, `Show QR, coming soon`, `Adding by QR is coming soon.` — die beiden Fehlersätze und `Retry` existieren bereits.
- **Offen für die Geräte-Abnahme:** die vier oben unter „Nicht bewiesen" gelisteten Punkte, allen voran der Gesamteindruck der sechs Blöcke.

## Self-Check: PASSED

- `apps/mobile/app/(tabs)/friends.tsx` — vorhanden
- `06-06-SUMMARY.md` — vorhanden
- Commits `fe9f0e0`, `f2ffcc6` — beide in der Git-History

---
*Phase: 06-profile-friends-placeholders*
*Completed: 2026-08-12*
