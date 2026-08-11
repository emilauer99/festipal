# Phase 6: Profile & Friends Placeholders - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-11
**Phase:** 6-profile-friends-placeholders
**Areas discussed:** Profil-Umfang, Logout-Platzierung, Friends-Framing, Platzhalter-Ton
(+ ungeplanter Block: Reaktion auf die neu gelieferten Screen-Designs)

---

## Bereichsauswahl

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Profil-Umfang | Was steht auf dem Profil außer den vier PROF-01-Pflichtfeldern | ✓ |
| Logout-Platzierung | Festivals-Header vs. Profil vs. beides | ✓ |
| Friends-Framing | Global vs. festival-bezogener Leerzustand | ✓ |
| Platzhalter-Ton | Wie ehrlich signalisieren die Screens „noch nicht fertig" | ✓ |

**User's choice:** alle vier.

---

## Profil-Umfang

### Frage 1 — Umfang über PROF-01 hinaus

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Nur Identitätskarte | Avatar, displayName, @username, E-Mail — sonst nichts | |
| + Konto-Sektion | Zusätzlich echte Konto-Liste (E-Mail, Sprache, Version) | |
| + kommt-bald-Zeilen | Zusätzlich sichtbar deaktivierte Ausblick-Zeilen | ✓ |

**Notes:** Direkt danach lieferte der User `img.png` — einen gerenderten Profil-Screen im neuen CI.
Die Wahl passte dazu: das Mockup ist deutlich reicher als PROF-01, das meiste davon ohne Backing.

### Frage 2 — Welche Blöcke aus dem Mockup, in welchem Zustand

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Kopf+Konto echt, Rest tot | Volle Optik, Socials/QR/Stats sichtbar deaktiviert | ✓ |
| Kopf+Konto echt, Rest weg | Kurzer, vollständiger Screen; Blöcke wachsen später nach | |
| Kopf+Konto+Stats echt | Wie A, aber Stat-Kacheln mit echten Werten | |

### Frage 3 — Chevrons auf den KONTO-Zeilen (versprechen Bearbeiten = PROF-02)

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Chevron weglassen | Rein view-only, kein falsches Versprechen | |
| Chevron sichtbar, gedämpft | Optik bleibt, Zeile nicht tappbar | |
| Chevron + kommt-bald-Feedback | Tappbar, Tap zeigt Hinweis | ✓ |

**Notes:** Deckte sich später mit dem neuen Design, das genau dafür ein Info-Sheet (`infoEdit`) vorsieht.

### Frage 4 — Meta-Zeile „3 Festivals · 6 Friends · seit 2025 dabei"

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Nur Festivals-Zahl | Echte Zahl, kein Contract-Eingriff | |
| Festivals + Friends | Beide echt, Friends = 0 | |
| Volle Zeile | Inkl. additiver Contract-Erweiterung `Account.createdAt` | ✓ |
| Meta-Zeile weglassen | Nur Avatar, Name, Handle | |

**Notes:** Die Kollisionszone `packages/contracts` mit dem parallelen Admin-Stream wurde vor der
Wahl benannt; der User hat die Erweiterung bewusst genommen.

### Frage 5 — Gerätelokaler Avatar (MMKV)

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| So lassen, kommentarlos | Foto wenn lokal vorhanden, sonst Initialen | ✓ |
| So lassen, mit Hinweis | Zusätzlich dezente Zeile zur Gerätebindung | |
| Serverseitig ziehen | `profile.avatar` als Quelle — echter Upload-Aufwand (PROF-02) | |

### Frage 6 — Sunset-Verlauf am Avatar vs. ADR-023

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Ausnahme: Initialen-Tile | Eng gefasste Einzelausnahme von der Sunset-Regel | |
| Kein Sunset, Beere-Fläche | ADR-023 unangetastet, sichtbare Abweichung vom Mockup | |
| ADR-023 nachziehen | Regel generell um Avatar-/Identitätsflächen erweitern | ✓ |

---

## Neue Screen-Designs (ungeplanter Block)

Der User verwies auf ein Claude-Artifact mit überarbeiteten Screens. **Der Abruf schlug fehl**
(„served to you as a public (non-member) reader" — Lesepfad nicht freigeschaltet), zweiter Versuch
identisch. Daraufhin legte der User die Datei unter `docs/quiks_screen_designs.html` ab; sie wurde
entpackt und ausgewertet: 13 Screens, globale Tab-Leiste `Start · Festivals · Friends · Mehr`,
Profil als Push-Screen hinter „Mehr".

Vier Konflikte mit dem bis dahin Beschlossenen wurden vorgelegt: Tab-Struktur, Logout-Ort,
Friends-Globalität und die Identitäts-/Vibe-Blöcke im Profil.

### Frage 7 — Tab-Struktur

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Design folgen: Mehr-Tab | 4. Tab wird „Mehr", Profil wird Push-Screen; drei Screens statt zwei | ✓ |
| Profil-Tab beibehalten | Phase-5-Verdrahtung bleibt, „Mehr" kommt später | |
| Mehr-Tab, Profil später | Navigation stimmt sofort, PROF-01 verschiebt sich | |

**Notes:** Revidiert Phase-5 D-02/D-03 ausdrücklich.

### Frage 8 — Umfang des `04 Mehr`-Screens

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Voller Aufbau, Totes gedämpft | Alle Sektionen; echt sind Konto→Profil, Sprache, Abmelden | |
| Nur was echt ist | Kurzer Screen ohne totes Inventar | |
| Voller Aufbau + Dark-Switch echt | Wie A, plus persistierter manueller Theme-Override | ✓ |

**Notes:** Dass der Dark-Switch neue Funktionalität ist (heute rein gerätegesteuert, hell-first,
`lib/theme.ts` + Provider müssten einen Override lernen), war Teil der Optionsbeschreibung.

### Frage 9 — Aufbau des Friends-Screens

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Gerüst + ein Leerzustand | Suche/QR oben deaktiviert, darunter ein guter Crew-Leerzustand | |
| Alle Blöcke, je leer | Volle Design-Struktur, jede Sektion mit eigenem Leerzustand | ✓ |
| Nur Leerzustand | Einzelner ganzseitiger Leerzustand ohne Gerüst | |

**Notes:** Einwand vorgebracht und überstimmt — sechs leere Sektionen können als kaputt statt
absichtsvoll gelesen werden, und die Chats-Sektion deutet Messaging an (Realtime, eigener
Milestone). Als bewusste Setzung protokolliert; Hauptrisiko für den späteren UI-Review.

### Frage 10 — „sie/ihr · 23 · weiblich" und „Vibe · von Spotify gesynct"

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Beides weglassen | Bis Birgits Konzept steht | |
| Vibe tot, Identität weg | Vibe gedämpft, Identitätszeile entfällt | |
| Beides sichtbar deaktiviert | Beide Blöcke gedämpft gerendert | |
| *(Freitext)* | „vibe tot, geschlecht, pronomen, alter, ergänzen optional bei profil erstellung" | ✓ |

**Notes:** Der Freitext geht über alle angebotenen Optionen hinaus — die Identitätsfelder werden
echte optionale Felder statt nur Anzeige.

### Frage 11 — Wo landet IDN-02

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| In Phase 6, ohne Policy | Schema + Contract + Erstellungsfelder + Anzeige, keine Sichtbarkeit/Altersgrenze/Disclaimer | ✓ |
| Eigene Phase davor/danach | Sicherheitsfragen an einem Stück entscheiden | |
| In Phase 6, mit Policy | Inkl. Geburtsdatum, Sichtbarkeit pro Feld, Disclaimer | |

**Notes:** Vor der Wahl wurde vorgetragen, dass PROJECT.md IDN-02 als „pending Birgit's concept —
out of this milestone" führt, dass ein Geburtsdatum Minderjährige identifizierbar macht (DSGVO),
dass es noch keine Visibility-Policy gibt und dass zwei Kollisionszonen-Pakete betroffen sind.
Der User hat die Einordnung bestätigt und A gewählt. **Offen geblieben:** Geburtsdatum speichern
und Alter ableiten, oder Alter direkt speichern — vom Planner explizit vorzulegen.

---

## Platzhalter-Ton

### Frage 12 — Einheitliches „kommt bald"-Signal

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Ein geteiltes Info-Sheet | Wie im Design, ein Baustein für alle Stellen | |
| Toast/Snackbar | Kurzer, selbst verschwindender Hinweis unten | ✓ |
| Inline, nicht tappbar | Gedämpfte Zeile mit „bald"-Label, keine Interaktion | |

### Frage 13 — Verbindlichkeit der Design-Copy

| Option | Beschreibung | Gewählt |
|--------|-------------|---------|
| Wörtlich übernehmen | DE-Strings 1:1 bindend im Lingui-Katalog | |
| Als Richtung, nicht bindend | Ton übernehmen, Formulierung darf abweichen | ✓ |

---

## Claude's Discretion

- Route-Struktur für Mehr + Profil, Benennung, `Tabs.Screen`-Registrierung
- Aufbau des Toast-Bausteins und seine Position relativ zur `FloatingNav`
- Persistenzweg des Theme-Overrides (MMKV liegt nahe)
- Laden der Festivals-Zahl in der Meta-Zeile (bestehende Query wiederverwenden)
- Icon-Auswahl je Zeile, Blockreihenfolge, Abstände (gegen das Design abzugleichen)
- Ob Friends und Mehr einen Header/Titel tragen
- Ablage der Designs: lesbare Extraktion + Screen-Index nach `docs/concept/designs/quiks-v2/`,
  `img.png` dorthin verschoben als `11-profil.png` (ausgeführt, nicht gefragt)

## Deferred Ideas

- FRND-02: Suche, quiks-Code/QR-Adden, Anfragen, Vorschläge, Präsenz
- Chats/Messaging (Realtime-Gateway, eigener Milestone)
- PROF-02: Profil bearbeiten, Avatar-Upload/Storage, `socials[]` + `socialsVisibility`
- Vibe / Spotify-Sync; Stat-Kacheln mit echten Werten (setzt Artists + Friends voraus)
- IDN-02 Rest: Sichtbarkeits-Policy, Altersgrenze, Flinta-Filter, Signup-Disclaimer
- Zahlungsmittel, Push-Benachrichtigungen, Crew-Standortfreigabe
- In-App-Sprachumschalter
- Übrige Screens des neuen Designs (Live, Aktivitäten, Crew, Timetable, Karte, Cashless, News,
  Aktivität erstellen); Umbau und Umbenennung von „Home" → „Start"
