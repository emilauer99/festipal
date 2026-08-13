# Phase 9: Festival Navigation Shell - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-13
**Phase:** 9-festival-navigation-shell
**Areas discussed:** Navigationsleisten & App-Header, Dashboard-Inhalt, Platzhalter-Ehrlichkeit,
Festival-Friends-Tab (FRND-07), `home` → `start` Rename

---

## Navigationsleisten & App-Header

### Verhältnis der beiden Leisten

| Option | Beschreibung | Gewählt |
|---|---|---|
| Festival ersetzt global | Nur die Fünf-Tab-Leiste im Festival, dieselbe Komponente mit anderen Items; eigener Navigator, kein Kind der globalen Tabs | ✓ |
| Festival-Tabs innerhalb des globalen Tabs | Beide Leisten existieren, zwei gestapelt oder eine versteckt sich | |
| Festival ersetzt, Ausstieg als Tab-Eintrag | Wie 1, aber ein Leisten-Eintrag führt hinaus — kostet einen der fünf Plätze | |

**Notes:** ADR-014 nennt genau fünf Tabs; das Design hat einen `showNav`-Schalter mit tauschbaren
`navItems`.

### Wo lebt der Ausstieg

| Option | Beschreibung | Gewählt |
|---|---|---|
| Zurück-Pfeil im Header auf jedem Tab | Heutiges Verhalten fünfmal statt einmal | (zunächst) |
| Nur im Dashboard | Aus vier Tabs kein sichtbarer Weg hinaus | |
| Festivalname als Ausstieg | Unbeschriftete Geste | |

**User's choice:** zunächst „Zurück-Pfeil auf jedem Tab" — **danach vom User revidiert**.

**Notes:** Der User warf ein: *„der globale app header fehlt generell noch. siehe screen designs, da
ist er überall vorhanden. und links im app header ist ein home icon button. wenn man den klickt soll
man wieder raus aus den festival-bereich kommen."* Die Header-Bindungen wurden daraufhin aus dem
Original-Bundle `docs/quiks_screen_designs.html` gezogen (`tbIcon`, `topHome`, `showWordmark`,
`showTitleText`, `tb`) und bestätigten die Aussage: **ein** Steuerelement, `home` bzw. `arrow-left`,
und im Festival-Kontext bedeutet `home` genau „raus". Die Frage wurde damit hinfällig und durch die
Header-Scope-Frage ersetzt.

### Scope des App-Headers

| Option | Beschreibung | Gewählt |
|---|---|---|
| App-weit, jetzt | Eine `AppHeader`-Komponente mit drei Zuständen ersetzt überall den React-Navigation-Header | ✓ |
| Nur im Festival-Bereich | Kleinere Phase, aber zwei Header-Stile nebeneinander | |
| App-weit, Push-Screens später | Neun Tab-Screens jetzt, `arrow-left`-Zustand ungebaut | |

### Avatar im Header

| Option | Beschreibung | Gewählt |
|---|---|---|
| Ja, Avatar mit Foto | 32 px `AvatarTile` rechts → `app/profil.tsx`; Mehr → Konto bleibt daneben | ✓ |
| Nein | Header bleibt minimal, Avatar erst mit PROF-02 | |
| Ja, aber ohne Foto | Nur Initialen, spart Bildauflösung auf jedem Screen | |

### Eintrittspunkt

| Option | Beschreibung | Gewählt |
|---|---|---|
| Immer Dashboard | Jeder Eintrittsweg gleich, kein persistierter Tab-Zustand | ✓ |
| Letzter Tab dieses Festivals | Neuer MMKV-Zustand + Regel für leere Tabs | |
| Dashboard, außer Deep Link nennt Tab | Erweitert die Deep-Link-Fläche für Platzhalter-Ziele | |

---

## Dashboard-Inhalt

### Zusammensetzung

| Option | Beschreibung | Gewählt |
|---|---|---|
| Identität + Cashless + Crew-Zähler | Alles Gezeigte hat echte Daten; Bühnen/Merkliste/Events/News fehlen schlicht | ✓ |
| Nur Identität + Cashless | Kein Zähler; Dashboard sehr dünn | |
| Design-Layout mit gedämpften Blöcken | Vier Blöcke, deren Voraussetzung ein Milestone entfernt ist | |

### Cashless

| Option | Beschreibung | Gewählt |
|---|---|---|
| Voll bauen: WebView-Push-Screen | `react-native-webview`, HTTPS + Domain-Beschränkung + sandboxed nach ADR-011 | ✓ |
| Systembrowser statt WebView | Kein natives Paket, aber ADR-011-Abweichung mit ADR-Ergänzungsbedarf | |
| Cashless raus aus dieser Phase | Phase trägt schon Nav-Shell, Header, Backend-Schnitt und Rename | |

**Notes:** ADR-011 lässt keinen inerten Platzhalter zu — fehlt `cashlessUrl`, wird der Bereich
ausgeblendet. Die Entscheidung war deshalb echt binär: bauen oder weglassen.

### Name im Header vs. im Dashboard

| Option | Beschreibung | Gewählt |
|---|---|---|
| Header trägt den Namen, Dashboard die Fakten | `display2`-Name entfällt, Dashboard beginnt mit den Key-Fact-Zeilen | ✓ |
| Beides behalten | Name zweimal untereinander auf Tab 1 | |
| Header im Festival ohne Namen | Weicht vom Design ab, vier Tabs sagen dann nicht, wo man ist | |

### Fehlfall (404 / nicht erreichbar)

| Option | Beschreibung | Gewählt |
|---|---|---|
| Vor den Tabs, auf Layout-Ebene | Eine Abfrage, ersetzt den ganzen Bereich; `clearActiveFestivalSlug()` zieht mit um | ✓ |
| Im Dashboard-Tab wie heute | Vier Tabs eines nicht existierenden Festivals blieben erreichbar | |
| Pro Tab eigene Auflösung | Vier bis fünf Codepfade für denselben Fehler | |

### Minimalfall (keine `cashlessUrl`, keine Freunde hier)

| Option | Beschreibung | Gewählt |
|---|---|---|
| Crew-Kachel bleibt immer, zeigt 0 mit Voraussetzungssatz | Ein Zähler auf 0 ist eine Aussage, kein Leerzustand | ✓ |
| Beides weg, Dashboard darf dünn sein | Trifft jedes frisch angelegte Festival, wirkt kaputt | |
| Hinweis auf die anderen Tabs | Drei davon sind selbst Platzhalter — führt ins Leere | |

---

## Platzhalter-Ehrlichkeit

### Mechanismus

| Option | Beschreibung | Gewählt |
|---|---|---|
| Neuer ganzflächiger Leerzustand-Baustein | Geteilt von allen drei Tabs; `SoonToast` bleibt für getappte tote Steuerelemente | ✓ |
| `ComingSoonTile` mittig wiederverwenden | Auf Rasterbreite ausgelegt, trägt keinen Voraussetzungssatz | |
| Nur ein Satz, kein Baustein | Dreimal dasselbe Layout, Phase 11 baut es ein viertes Mal | |

**Notes:** Klärt zugleich die Zweideutigkeit in ROADMAP-SC-2 („der einzelne geteilte `SoonToast`
bleibt der einzige Coming-soon-Mechanismus"): kein zweiter Toast/Sheet, aber ein Leerzustand ist
keine Coming-soon-Mechanik.

### Copy-Differenzierung

| Option | Beschreibung | Gewählt |
|---|---|---|
| Ja, entlang der echten Voraussetzung | Timetable/Lageplan warten auf das Festival, Aktivitäten auf quiks — kein Datumsversprechen | ✓ |
| Alle drei gleich formuliert | Suggeriert bei Timetable/Lageplan „wir bauen das noch" | |
| Aktivitäten nennt Phase 11 konkret | Terminversprechen im UI | |

### Darstellung in der Leiste

| Option | Beschreibung | Gewählt |
|---|---|---|
| Nein, alle fünf gleich | Wie die globale `FloatingNav`; Phase 11 muss nichts zurückbauen | ✓ |
| Gedämpft dargestellt | Leiste sieht halb kaputt aus, Rückbau nötig | |
| „Soon"-Badge am Tab | Doppelt die Aussage des Screens, belegt die Badge-Fläche | |

---

## Festival-Friends-Tab (FRND-07)

### Inhalt

| Option | Beschreibung | Gewählt |
|---|---|---|
| Nur die Liste, Zeilen tappbar | `PersonRow` + `friend-detail`, sonst nichts | |
| Liste plus Einstieg zum globalen Friends-Tab | Verweis auf Suche/QR/Anfragen unter der Liste | ✓ |
| Zwei Sektionen: hier dabei / übrige Freunde | Drängt zur Einladefunktion, die es nicht gibt | |

### Leere Zustände

| Option | Beschreibung | Gewählt |
|---|---|---|
| Alle drei eigenständig | Keine Freunde / keiner hier / Ladefehler je eigener Text | ✓ |
| Ein gemeinsamer leerer Zustand | Sagt jemandem ohne Freunde dasselbe wie jemandem mit dreißig | |
| Zwei: leer vs. Fehler | Verliert die Unterscheidung, an der der Nutzer hängt | |

### Rückweg des „Freunde hinzufügen"-Einstiegs

| Option | Beschreibung | Gewählt |
|---|---|---|
| Darüber legen, Zurück führt ins Festival | Push-Screen über dem Festival-Kontext, `arrow-left`-Header | ✓ |
| Verlässt das Festival wie der Home-Button | Ein Navigationsmodell, aber Rückweg von Hand | |
| Doch nur die Liste | Revidiert die vorige Entscheidung | |

**Notes:** Folge für den Planner: der Friends-Screen muss an **zwei** Navigationspositionen
funktionieren.

### Endpunkt-Schnitt

| Option | Beschreibung | Gewählt |
|---|---|---|
| Einer, der die Liste liefert | Dashboard zählt die Länge aus demselben Query-Cache | ✓ |
| Zwei: ein Zähler, eine Liste | Zwei Codepfade für dieselbe Schnittmenge | |

---

## `home` → `start` Rename (NAV-03)

### Umfang

| Option | Beschreibung | Gewählt |
|---|---|---|
| Erst besprechen | Alias-Frage und persistierter Zustand offen | ✓ |
| Harte Umbenennung ohne Diskussion | Rest ist Planer-Sache | |

### Alias-Route

| Option | Beschreibung | Gewählt |
|---|---|---|
| Nein, harte Umbenennung | `pending-destination` ist In-Memory, persistiert wird nur ein Slug | ✓ |
| Ja, `/home` leitet auf `/start` | Zweite dauerhaft zu pflegende Route im Deep-Link-Capture | |

**Notes:** Vor der Frage geprüft: `lib/pending-destination.ts` ist ein Modul-Singleton,
ausdrücklich **nicht** MMKV. Damit kann kein `/home` aus einer älteren Installation wieder
abgespielt werden — die ursprüngliche Sorge war gegenstandslos, und die Empfehlung kippte
entsprechend.

### msgid

| Option | Beschreibung | Gewählt |
|---|---|---|
| msgid wird `Start`, EN zeigt „Start" | Wörtliche Erfüllung von NAV-03 in Route, msgid und UI | ✓ |
| msgid `Start`, EN bleibt „Home" | Katalogeintrag sähe beim nächsten Lesen wie ein Fehler aus | |
| Nur Route und UI, msgid bleibt `Home` | NAV-03 nennt die msgid ausdrücklich — Kriterium unerfüllt | |

### Doppeltes Home-Icon auf dem Start-Tab

| Option | Beschreibung | Gewählt |
|---|---|---|
| Sichtbar, aber wirkungslos wie im Design | Ein Steuerelement an fester Position, das gelegentlich nichts tut | ✓ |
| Auf dem Start-Tab ausgeblendet | Header hätte zwei Layouts | |
| Anderes Icon für den Header-Button | Weicht vom Design ab | |

---

## Claude's Discretion

Der User hat keine Frage explizit delegiert. Bewusst **nicht** gefragt, weil technische Umsetzung:
Verschachtelungsform des Festival-Navigators in Expo Router · `festivalId` vs. `slug` im
FRND-07-Pfad · Kachel-Layout auf dem Dashboard · Umbenennung der `ColdStartRedirect`-Diskriminante ·
Query-Keys und Invalidierung · Glyph-Auswahl, Header-Höhe, technische Umsetzung der Glasfläche ·
Cache-Lesepfad von `friend-detail` beim Aufruf aus dem Festival.

## Deferred Ideas

Live-Act-Chip im Header · Header-Subtitle (`tb.s`) · die vier Design-Dashboard-Blöcke ohne
Datenquelle · tab-adressierende Deep Links · pro-Festival gemerkter Tab-Zustand · Präsenz/„Gerade am
Gelände"/Distanz (ADR-014) · Chats im Festival-Friends-Tab (ADR-020) · SafeNow-Hinweis auf dem
Lageplan · „Freunde ins Festival einladen" · Anfragen-Badge in der `FloatingNav` · FRND-09
Blockieren/Melden · `/gsd-ui-review 06`.
