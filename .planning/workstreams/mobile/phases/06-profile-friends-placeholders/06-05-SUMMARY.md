---
phase: 06-profile-friends-placeholders
plan: 05
subsystem: ui
tags: [react-native, settings-screen, dark-mode, theme-override, logout, accessibility, lingui, external-link]

# Dependency graph
requires:
  - phase: 06-profile-friends-placeholders
    plan: 01
    provides: "(tabs)/mehr.tsx als Screen-Shell mit der Konto-Sektion und der Profil-Zeile; die profil-Registrierung im authentifizierten Stack"
  - phase: 06-profile-friends-placeholders
    plan: 03
    provides: "useThemeOverride() (roher Override + persistierender Setter) und resolveEffectiveThemeMode als Schicht über der 05.1-Auflösung"
  - phase: 06-profile-friends-placeholders
    plan: 04
    provides: "ListRow, SettingsSwitch, useSoonToast() samt app-weit montiertem ToastProvider"
  - phase: 05-festival-selection-home
    provides: "die gehärtete handleLogout-Logik in (tabs)/festivals.tsx, forceUnauthenticated() aus app/_layout.tsx und clearActiveFestivalSlug()"
provides:
  - "Mehr-Screen im vollen Design-Aufbau: fünf Sektionen, vier funktionsfähige Zeilen, alle übrigen sichtbar tot"
  - "Die erste Bedienfläche des persistierten Theme-Overrides — der Dunkle-Modus-Schalter (D-08a)"
  - "Abmelden als rote Zeile am Ende der App-Sektion hinter einem nativen, abbrechbaren Alert (D-09)"
  - "Festivals-Screen ohne jede Abmelde-Affordanz im Header"
affects: [06-06, 06-07, 06-09]

# Actuals (#2632) — estimateTokens-Skala (chars/4 über den realisierten Diff),
# gemessen als `git diff HEAD~2 HEAD | grep '^+' | wc -c` = 13.858 Zeichen.
# Der Plan schätzte 70.000 Tokens bei confidence: low — die tatsächliche Zahl
# liegt bei rund einem Zwanzigstel. Nicht geschönt: der Screen ist zwar der
# größte dieser Phase, aber er besteht fast vollständig aus Aufrufen bereits
# gebauter Bausteine; die Schätzheuristik überschätzt genau solche Scheiben.
actuals:
  tokens: 3464
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Eine externe Zieladresse steht als Modul-Konstante und wird an JEDER Aufrufstelle unverändert durchgereicht — nie zur Laufzeit gebildet (T-06-20)"
    - "Eine gehärtete Handler-Logik wandert beim Umzug wörtlich mit; die Rückfrage wickelt die AUFRUFSTELLE ein, nie den Handler-Körper"
    - "Der sichtbare Zustand eines Schalters ist der EFFEKTIVE Zustand, der geschriebene Wert dagegen immer explizit — Lesen und Schreiben sind bewusst asymmetrisch"

key-files:
  created: []
  modified:
    - apps/mobile/app/(tabs)/mehr.tsx
    - apps/mobile/app/(tabs)/festivals.tsx

key-decisions:
  - "Der Wert der Sprache-Zeile läuft über Lingui (t`German` / t`English`) statt über eine Endonym-Konstante — msgid und Anzeigewert stimmen per Konstruktion überein, weil die angezeigte Sprache immer die gerade gerenderte ist"
  - "Der Wert für erzwungenes Hell kommt im Screen als Literal NICHT vor: der Setter bekommt `next ? 'dark' : 'system'`, der dritte Zustand bleibt schreiberlos"
  - "Die drei Benachrichtigungs-Zeilen bekamen erfundene, aber domänen-echte Copy (Timetable/News/Friend requests) — das Design zeigt an dieser Stelle nur drei Platzhalterzeilen ohne Wortlaut"
  - "Die Sprache-Zeile sitzt laut Plan in Darstellung, nicht wie im Design in App — der Plan ist hier die Autorität, und die Gruppierung ist die inhaltlich richtige"
  - "In festivals.tsx bleibt <Stack.Screen options={{ title }} /> stehen statt ersatzlos zu entfallen: das ist der kleinstmögliche Diff und kann den Header nicht regressieren, obwohl (tabs)/_layout.tsx denselben Titel ohnehin setzt"

patterns-established:
  - "Ein Screen mit toten Zeilen dokumentiert am Kommentar, dass `disabled` bei Schaltern echt ist und nicht nur Deckkraft — die Unterscheidung ist der Kern von T-06-22"
  - "Beim Verschieben gehärteter Logik wird die Identität des Handler-Körpers maschinell nachgewiesen (kommentarfreier diff gegen die Vorfassung), nicht nur behauptet"

requirements-completed: []

coverage:
  - id: D1
    description: "Der Mehr-Screen zeigt alle fünf Sektionen des Designs im vollen Aufbau (D-08, UI-SPEC #26)"
    requirement: HOME-03
    verification:
      - kind: other
        ref: "grep -c 'eyebrow' (tabs)/mehr.tsx = 8 (fünf Sektionsköpfe + Font-Auflösung + Style); Sektionsreihenfolge Konto · Darstellung · Benachrichtigungen · Standort & Sicherheit · App entspricht docs/concept/designs/quiks-v2/quiks-screens.template.html Z. 1493–1528"
        status: pass
      - kind: manual_procedural
        ref: "Optische Abnahme des Aufbaus, der Abstände und der Dämpfung am Gerät — in diesem Plan NICHT durchgeführt (node-env-Runner rendert keine RN-Komponenten); gehört in die Geräte-UAT der Phase"
        status: pending
    human_judgment: true
    rationale: "Sektionsbestand und -reihenfolge sind textuell prüfbar, die Wirkung des Aufbaus nicht."
  - id: D2
    description: "Der Dunkle-Modus-Schalter spiegelt den EFFEKTIVEN Modus und schreibt beim Umschalten immer einen expliziten Wert — an ergibt dunkel, aus ergibt system, niemals hell (D-08a)"
    requirement: HOME-03
    verification:
      - kind: other
        ref: "value={isDarkMode} mit `const isDarkMode = mode === 'dark'` aus useTheme(); setThemeOverride(next ? 'dark' : 'system'); grep -n \"'light'\" (tabs)/mehr.tsx = 0 Treffer (auch nicht im Kommentar)"
        status: pass
      - kind: manual_procedural
        ref: "Sofortige Wirkung im laufenden Screen und Überleben eines App-Neustarts — NICHT geprüft; das ist der in 06-03 (Coverage D5) offen gelassene Punkt und nur am Gerät entscheidbar"
        status: pending
    human_judgment: true
    rationale: "Die Verdrahtung ist statisch beweisbar, das Laufzeitverhalten von MMKV und React nicht — 06-03 hat denselben Punkt bereits als geräteabhängig markiert."
  - id: D3
    description: "Die SafeNow-Karte trägt einen echten externen Link auf eine feste, weder nutzer- noch serverbestimmte Adresse (T-06-20)"
    requirement: HOME-03
    verification:
      - kind: other
        ref: "SAFENOW_URL als Modul-Konstante 'https://safenow.app'; `[ -z \"$(grep -n 'openURL(' … | grep -v 'SAFENOW_URL')\" ]` exits 0 — es bleibt keine openURL-Zeile ohne die Konstante übrig"
        status: pass
      - kind: manual_procedural
        ref: "Dass der Link am Gerät wirklich den Systembrowser öffnet — nicht geprüft; UI-SPEC #25 stuft ein Fehlschlagen ausdrücklich als OS-Sache ein, nicht als Screen-Zustand"
        status: pending
    human_judgment: true
    rationale: "Die Unveränderlichkeit des Ziels ist beweisbar, der Sprung in den Browser nur am Gerät."
  - id: D4
    description: "Der Distanzierungssatz der SafeNow-Karte ist vorhanden und nie abgeschnitten (D-14, UI-SPEC #30, Prohibition)"
    requirement: HOME-03
    verification:
      - kind: other
        ref: "Der Satz „We have no connection to SafeNow — we just think the app is genuinely good. Use it on-site.\" steht als <Trans>-Kind; grep -n 'numberOfLines' (tabs)/mehr.tsx = 0 Treffer, im SafeNow-Block also keine Zeilenbegrenzung"
        status: pass
      - kind: manual_procedural
        ref: "Vollständige Sichtbarkeit in BEIDEN Sprachen — die deutsche Katalogfassung entsteht erst in 06-09; bis dahin ist nur die englische Quelle prüfbar"
        status: pending
    human_judgment: true
    rationale: "Das Fehlen einer Zeilenbegrenzung ist maschinell prüfbar; dass der Satz im deutschen Umbruch vollständig sichtbar bleibt, erst nach 06-09 am Gerät."
  - id: D5
    description: "Die vier nicht funktionsfähigen Schalter sind wirklich deaktiviert, nicht nur gedämpft (T-06-22)"
    requirement: HOME-03
    verification:
      - kind: other
        ref: "vier <SettingsSwitch … disabled badge={soonBadge}> ohne onValueChange (3× Benachrichtigungen, 1× Standort); SettingsSwitch reicht `disabled` an den RN-Switch durch (components/SettingsSwitch.tsx Z. 103) — grep -c 'disabled' (tabs)/mehr.tsx = 8"
        status: pass
    human_judgment: false
    rationale: "Reine Codestruktur über einer Komponente, deren Deaktivierungssemantik 06-04 bereits festgelegt hat."
  - id: D6
    description: "Abmelden sitzt als rote Zeile am Ende der App-Sektion und ist im Festivals-Header nicht mehr vorhanden (D-09)"
    requirement: HOME-03
    verification:
      - kind: other
        ref: "grep -c auf (tabs)/festivals.tsx: 'headerRight' = 0, 'LogOut' = 0, 'logoutButton' = 0, 'signOut|authClient|forceUnauthenticated|clearActiveFestivalSlug' = 0; in mehr.tsx <ListRow icon={LogOut} danger …> als letztes Kind der App-Gruppe"
        status: pass
    human_judgment: false
    rationale: "Vorhandensein und Abwesenheit sind beide textuell erschöpfend prüfbar."
  - id: D7
    description: "Die bestehende Abmelde-Logik wandert unverändert mit: Doppeltipp-Sperre, Backstop-Erzwingung des unauthentifizierten Zustands, Löschen des gemerkten Festivals (T-06-19)"
    requirement: HOME-03
    verification:
      - kind: other
        ref: "Maschineller Identitätsnachweis: `git show HEAD~1:(tabs)/festivals.tsx | sed -n '107,131p'` gegen den handleLogout-Block in mehr.tsx, beide kommentarfrei und eingerückt normalisiert → diff LEER"
        status: pass
    human_judgment: false
    rationale: "Der Plan verlangt Unverändertheit; genau das wurde gemessen statt behauptet."
  - id: D8
    description: "Vor dem Abmelden erscheint eine native, abbrechbare Rückfrage; erst die Bestätigung ruft den Handler (T-06-21)"
    requirement: HOME-03
    verification:
      - kind: other
        ref: "confirmLogout() ruft Alert.alert(titel, text, [{ style: 'cancel' }, { style: 'destructive', onPress: () => void handleLogout() }]); der Handler wird ausschließlich im Bestätigungs-Callback erreicht — die ListRow ruft confirmLogout, nie handleLogout"
        status: pass
      - kind: manual_procedural
        ref: "Dass der native Dialog erscheint und Abbrechen die Session bestehen lässt — NICHT geprüft; Alert.alert ist eine native Fläche, die der node-Runner nicht auslösen kann"
        status: pending
    human_judgment: true
    rationale: "Die Aufrufreihenfolge ist statisch beweisbar, das native Dialogverhalten nur am Gerät."
  - id: D9
    description: "UI-SPEC #24 — der aufgelöste UI-Locale steht synchron zur Verfügung, ein Ladezustand rendert nie"
    requirement: HOME-03
    verification:
      - kind: other
        ref: "`const languageValue = i18n.locale === 'de' ? t`German` : t`English`` — ein synchroner Lesezugriff auf das i18n-Modul im Render, kein useQuery, kein useEffect, kein Ladezweig im Screen"
        status: pass
    human_judgment: false
    rationale: "Die Abwesenheit eines asynchronen Pfads ist textuell erschöpfend prüfbar."

# Metrics
duration: ~30min
completed: 2026-08-12
status: complete
---

# Phase 6 Plan 05: Mehr-Screen im vollen Aufbau und der Umzug des Abmeldens Summary

**Der Einstellungs-Screen in seinem vollen Design-Aufbau — fünf Sektionen, genau vier funktionsfähige Zeilen, alles andere sichtbar tot statt weggelassen — plus der Umzug des Abmeldens aus dem Festivals-Header hierher, mit unverändert mitgewanderter Härtung und einer nativen Rückfrage davor.**

## Performance

- **Duration:** ~30 min (Kontextlesen, Umsetzung, Verifikation)
- **Completed:** 2026-08-12
- **Tasks:** 2 von 2
- **Files modified:** 2 (beide geändert, keine neue Datei)

## Accomplishments

- **Fünf Sektionen im Aufbau des Designs.** Konto · Darstellung · Benachrichtigungen · Standort & Sicherheit · App, jede mit einem Eyebrow in der `micro`-Rolle in Großbuchstaben und einer Zeilengruppe im mittleren Radius, dazwischen `layout.sectionGap`. Reihenfolge und Zeilenbestand stammen aus `quiks-screens.template.html` Z. 1493–1528, nicht aus freier Erfindung.
- **Der Screen erfindet keinen einzigen eigenen Baustein.** Jede Zeile ist eine `ListRow` oder ein `SettingsSwitch` aus `06-04`, jedes „kommt bald" läuft über `useSoonToast()` (D-13). Die in `06-01` inline gebaute Profil-Zeile ist damit abgelöst — es gibt auf diesem Screen nur noch EINE Zeilendarstellung.
- **Der Dunkle-Modus-Schalter ist die erste echte Bedienfläche des Overrides aus `06-03`.** Er liest den EFFEKTIVEN Modus (`useTheme().mode === 'dark'`) — an ist er also auch dann, wenn das Gerät die Dunkelheit vorgibt — und schreibt beim Umschalten immer explizit: einschalten `'dark'`, ausschalten `'system'`. Der dritte Zustand (Hell gegen ein dunkles Gerät erzwingen) bleibt schreiberlos; **das Literal kommt im Screen an keiner Stelle vor**, auch nicht im Kommentar.
- **Die vier toten Schalter sind wirklich tot (T-06-22).** Sie tragen `disabled` und kein `onValueChange`; `SettingsSwitch` reicht das an den nativen RN-`Switch` durch, sie sind also nicht bloß auf Deckkraft 0,45 gedämpft, sondern nicht umschaltbar. Ein toter Schalter kann so keinen gespeicherten Zustand vortäuschen.
- **Die SafeNow-Karte ist der eine vollständig echte Block des Screens.** Fläche über `fillInfoQuiet`, ein Pixel Rand über `borderInfo`, Icon und Überschrift über `infoText` — nie über die bare Info-Hue, die auf Papier bei 2,04:1 an AA scheitert. Der Distanzierungssatz trägt **keine** Zeilenbegrenzung und ist damit strukturell gegen Abschneiden gesichert. Die Zieladresse ist eine Modul-Konstante; jede Aufrufstelle reicht genau sie durch (T-06-20).
- **Die Sprache-Zeile ist Muster B, nicht Muster A.** Volle Deckkraft, echter aufgelöster UI-Locale als rechtsbündiger Wert, Chevron vorhanden — ein Tap antwortet mit dem gemeinsamen Hinweis statt mit einem Umschalter, den es noch nicht gibt. Der Wert steht synchron zur Verfügung, ein Ladezustand kann nie rendern (UI-SPEC #24).
- **Das Abmelden ist umgezogen, nicht neu geschrieben.** Der Handler-Körper in `mehr.tsx` ist gegenüber der Vorfassung in `festivals.tsx` **byte-identisch** (maschinell nachgewiesen, siehe Coverage D7): Ref-Sperre gegen den zweiten gleichzeitigen Aufruf, `try` um den Abmeldeaufruf mit protokolliertem Fehler, und ein `finally`, das in jedem Fall `forceUnauthenticated()` erzwingt, den gemerkten Festival-Slug löscht und die Sperre zurücksetzt. Genau dieser Backstop ist der Grund, warum ein fehlgeschlagenes Abmelden auf einem geteilten Gerät nicht in einer scheinbar noch angemeldeten App endet (T-06-19).
- **Die Rückfrage wickelt die Aufrufstelle ein, nicht den Handler.** `confirmLogout()` öffnet einen nativen `Alert.alert` mit Titel, erklärendem Satz und zwei Knöpfen; nur der destruktiv ausgezeichnete zweite erreicht `handleLogout()`. Die Zeile ruft ausschließlich `confirmLogout` — es gibt keinen Pfad, der den Handler ohne Rückfrage erreicht (T-06-21).
- **Der Festivals-Screen trägt keine Abmelde-Affordanz mehr.** `headerRight`, der `LogOut`-Import, der `logoutButton`-Style, die Ref, der Handler und die drei nur dafür gehaltenen Importe (`authClient`, `forceUnauthenticated`, `clearActiveFestivalSlug`) sind entfernt; `syncActiveFestivalOnEnter` bleibt, weil `handleEnter` es weiter braucht. Alle vier Greps des Plans ergeben 0.

## Task Commits

1. **Task 1: Mehr-Screen im vollen Design-Aufbau mit echtem Dark-Mode-Schalter und SafeNow-Karte** — `81001c1` (feat)
2. **Task 2: Abmelden zieht mit nativer Rückfrage in die App-Sektion, der Festivals-Header verliert seinen Knopf** — `5278ec7` (feat)

**Plan-Metadaten:** siehe der abschließende `docs(06-05)`-Commit dieses Summarys.

## Files Created/Modified

- `apps/mobile/app/(tabs)/mehr.tsx` — **geändert** (40 → 373 Zeilen). Fünf Sektionen, elf Zeilen (2 Konto · 2 Darstellung · 3 Benachrichtigungen · 1 Standort + SafeNow-Karte · 2 App), der Dark-Mode-Handler, der verschobene Abmelde-Handler und `confirmLogout`. Enthält keinen rohen Farbwert, kein numerisches `fontWeight` und kein hartcodiertes Barrierefreiheits-Label.
- `apps/mobile/app/(tabs)/festivals.tsx` — **geändert** (−69/+~10). Entfernt: `headerRight`-Block, `logoutButton`-Style, `signingOutRef`, `handleLogout`, vier Importe. Geändert: `<Stack.Screen>` trägt nur noch den Titel, der Modul-Kommentar hält den Umzug fest. Die Query-, Mutations- und Segment-Logik ist unangetastet.

## Decisions Made

- **Der Sprachwert läuft über Lingui statt über eine Endonym-Konstante.** Naheliegend wäre `'Deutsch' | 'English'` als Konstante gewesen. Über `t\`German\`` / `t\`English\`` stimmen msgid und Anzeige aber per Konstruktion überein: die angezeigte Sprache IST die gerade gerenderte, der deutsche Katalog übersetzt „German" nach „Deutsch". Damit erfüllt die Zeile die UI-SPEC-Formulierung „Deutsch/German" ohne eine zweite Quelle für Sprachnamen.
- **Das Hell-Literal kommt im Screen gar nicht vor.** Das Akzeptanzkriterium verlangt nur, dass es nicht an den Setter zugewiesen wird; die schärfere Fassung (es steht nirgends, auch nicht im erklärenden Kommentar) ist billiger zu halten und immun gegen die in dieser Phase bereits zweimal aufgetretene Kommentar-Fehlmeldung bei Akzeptanz-Greps.
- **Die drei Benachrichtigungs-Zeilen bekamen erfundene Copy.** Das Design rendert an dieser Stelle eine `sc-for`-Schleife über drei Platzhalter ohne Wortlaut. Gewählt wurden domänen-echte Sätze (Timetable-Erinnerungen, Festival-News, Freundschaftsanfragen), die zu den Features dieser Roadmap passen — kein Lorem, aber auch nichts, was ein nicht geplantes Feature verspricht.
- **Die Sprache-Zeile sitzt in Darstellung, nicht in App.** Das Design hat sie in der App-Sektion; der Plan verlangt sie ausdrücklich in Darstellung. Der Plan ist die Autorität und die Gruppierung ist inhaltlich die richtige — Sprache ist eine Darstellungsfrage, nicht eine App-Meta-Frage. Als Abweichung vom DESIGN (nicht vom Plan) hier festgehalten.
- **`<Stack.Screen options={{ title }} />` bleibt in `festivals.tsx` stehen.** `(tabs)/_layout.tsx` setzt denselben Titel ohnehin, die Zeile ist also streng genommen redundant. Sie ersatzlos zu streichen wäre eine Verhaltensänderung am Header in einem Task, dessen Auftrag „Knopf entfernen" ist — der kleinste Diff gewinnt, die Redundanz ist notiert.
- **Der SafeNow-Link ist ein `Pressable` mit `accessibilityRole="link"` und `minHeight: layout.hitMin`.** RN kennt keinen Anker; die Mindest-Tapgröße muss der Aufrufer setzen, weil der Link kein `ListRow` ist.

## Deviations from Plan

Keine. Beide Tasks wurden wie geschrieben ausgeführt; alle Akzeptanzkriterien sind ohne Anpassung erfüllt. Die eine bewusste Abweichung vom **Design** (Sprache-Zeile in Darstellung statt in App) ist genau das, was der Plan vorschreibt, und daher keine Abweichung vom Plan.

## Threat-Model-Stand

- **T-06-19 (Spoofing, mitigate) — erfüllt und gemessen.** Der Handler-Körper ist gegenüber der Vorfassung identisch; der maschinelle Nachweis steht in Coverage D7. Alle drei Härtungen sind einzeln gegriffen (`signingOutRef`, `try/catch`, `finally` mit `forceUnauthenticated()` + `clearActiveFestivalSlug()`).
- **T-06-20 (Tampering, mitigate) — erfüllt.** `SAFENOW_URL` ist eine Modul-Konstante über HTTPS; der zweistufige Grep beweist, dass keine `openURL`-Zeile ohne diese Konstante existiert. Kein Serverwert, keine Nutzereingabe, keine Laufzeitbildung.
- **T-06-21 (Repudiation, mitigate) — erfüllt.** Die Rückfrage steht vor dem Handler, der Abbruch ist die passive Wahl (`style: 'cancel'`), die Bestätigung ist destruktiv ausgezeichnet.
- **T-06-22 (Tampering, mitigate) — erfüllt.** Die vier Schalter tragen `disabled` und kein `onValueChange`; `SettingsSwitch` gibt `disabled` an den nativen Switch weiter.
- **T-06-23 (Information Disclosure, accept) — unverändert getragen.** Die Sprache-Zeile zeigt die app-weit ohnehin sichtbare UI-Sprache; keine neue Offenlegung.

## Issues Encountered

- **Verifikationsgrenze, ehrlich benannt.** Der `apps/mobile`-Vitest-Runner ist node-env und rendert keine RN-Komponenten: die 188 grünen Tests beweisen für diesen Plan **nichts über Aussehen oder Verhalten**. Bewiesen sind Typkorrektheit, Lint-Konformität (inkl. `no-literal-string`) und die textuellen Struktur-Greps. **Ungeprüft und geräteabhängig:** ob der Dunkle-Modus-Schalter sofort umschaltet und den Neustart überlebt, ob der native Alert erscheint und Abbrechen die Session bestehen lässt, ob der SafeNow-Link den Systembrowser öffnet, und wie der Aufbau tatsächlich aussieht. Nach der Lehre aus Phase 5 gilt: am Gerät verifizieren, nicht aus grünen node-Tests schließen.
- **Kein Dokumentations-Lookup möglich.** Weder Context7-MCP-Tools noch die `ctx7`-CLI standen in diesem Agentenkontext zur Verfügung. Die genutzten APIs sind stabile RN-Kernflächen (`Alert.alert` mit `style: 'cancel'|'destructive'`, `Linking.openURL`) und wurden gegen den Typecheck geprüft, nicht gegen die offizielle Dokumentation.
- **Bis 06-09 englisch.** Alle neuen Sätze sind englische msgids (`lingui.config.ts` `sourceLocale: 'en'`); die deutschen Katalogwerte — inklusive der wörtlichen Design-Vorgaben „Die Nachtschicht für deine Augen" und des SafeNow-Distanzierungssatzes — landen in Plan `06-09`. `messages.po` wurde in diesem Plan nicht angefasst.
- **Kein Metro-Watcher gestartet, kein `pnpm install` gelaufen.** Die Windows-ENOENT-Race konnte nicht auftreten; es bleibt kein Prozess zurück.

## Known Stubs

Keine im Sinne von unfertigem Code. Die toten Zeilen dieses Screens (Zahlungsmittel, drei Benachrichtigungs-Schalter, Crew-Standort, „quiks empfehlen", der Sprach-Umschalter) sind **beabsichtigte, vollständig implementierte Platzhalter** nach D-08: gedämpft, badge-markiert, deaktiviert bzw. mit Hinweis-Antwort. Das ist die erklärte Haltung der Phase („sichtbar tot statt weggelassen"), kein aufgeschobener Code. Sie sind in `06-CONTEXT.md` Z. 329 bereits als Nicht-Ziele dieser Phase geführt.

## User Setup Required

Keine — keine neue Abhängigkeit, kein natives Modul, keine Umgebungsvariable. Kein APK-Neubau nötig (`lucide-react-native`, `Alert` und `Linking` sind bereits im Bundle).

## Next Phase Readiness

- **06-06 (Friends-Blöcke)** und **06-07 (Profil)** finden das Muster vor, wie eine Mischung aus lebendigen und toten Zeilen aussieht; `useSoonToast()` hat jetzt seinen ersten echten Aufrufer.
- **06-09 (Kataloge)** muss die neuen msgids dieses Screens aufnehmen: fünf Sektionsköpfe, elf Zeilenlabels und -beschreibungen, die SafeNow-Karte samt Distanzierungssatz, vier Alert-Textbausteine, sechs `accessibilityLabel` und drei Toast-Sätze. **Der Distanzierungssatz darf beim Übersetzen weder entfallen noch abgeschwächt werden** — er ist die einzige Prohibition dieses Plans.
- **Für die Geräte-UAT dieser Phase** stehen jetzt vier prüfbare Dinge bereit, die vorher nur Logik waren: der Dunkle-Modus-Schalter (inkl. Neustart — der in `06-03` Coverage D5 offen gelassene Punkt), der native Abmelde-Dialog samt Abbruch, der SafeNow-Link und die optische Wirkung der Dämpfung.

## Self-Check: PASSED

- `apps/mobile/app/(tabs)/mehr.tsx` — vorhanden (373 Zeilen, `min_lines` 200)
- `apps/mobile/app/(tabs)/festivals.tsx` — vorhanden, ohne Abmelde-Affordanz
- Commit `81001c1` — in der Historie vorhanden
- Commit `5278ec7` — in der Historie vorhanden
- Alle Akzeptanzkriterien beider Tasks geprüft: `eyebrow` = 8 (≥5) · `'light'` = 0 · `useTheme()` vorhanden · `https://safenow.app` vorhanden · keine `openURL`-Zeile ohne `SAFENOW_URL` · `disabled` = 8 (≥4) · kein `numberOfLines` · kein Farbliteral · kein numerisches `fontWeight` · `headerRight`/`LogOut`/`logoutButton` in `festivals.tsx` je 0 · `signOut`/`forceUnauthenticated`/`clearActiveFestivalSlug`/Ref-Sperre in `mehr.tsx` vorhanden · `style: 'destructive'` vorhanden · Handler-Körper identisch (diff leer)
- `pnpm --filter @quiks/mobile lint` grün · `typecheck` grün · `test` 17 Dateien / 188 Tests grün
- Keine Datei durch die beiden Commits gelöscht (`git diff --diff-filter=D HEAD~2 HEAD` leer); keine unbeabsichtigt untracked gelassene Datei

---
*Phase: 06-profile-friends-placeholders*
*Completed: 2026-08-12*
