# Phase 11: Activities - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-15
**Phase:** 11-Activities
**Areas discussed:** Tab-Aufbau & Meine Aktivitäten, Create-Formular, Detail: Beitreten/Voll/Auflösen/Klonen, Geo-Punkt & Route öffnen

---

## Tab-Aufbau & Meine Aktivitäten

| Option | Description | Selected |
|--------|-------------|----------|
| Zwei Sektionen (Empfohlen) | „Deine Aktivitäten" oben (listMyActivities), darunter „Wer kommt mit?" mit der öffentlichen Liste, eigene per Dabei-Badge | ✓ |
| Segment Meine/Alle | Segmented Control wie auf dem Festivals-Screen | |
| Eine Liste, Meine inline | Nur öffentliche Liste mit Dabei-Badge; gestartete eigene wären nirgends sichtbar | |

**User's choice:** Zwei Sektionen (Empfohlen)

| Option | Description | Selected |
|--------|-------------|----------|
| Weglassen (Empfohlen) | „Offizielle Events" fehlt schlicht — Phase-9-D-07-Muster | ✓ |
| Ehrlicher Platzhalter | Sektion mit D-11-Leerzustand zeigen | |

**User's choice:** Weglassen (Empfohlen)

| Option | Description | Selected |
|--------|-------------|----------|
| Zahl + Plätze (Empfohlen) | „5 sind dabei" links, Plätze-Hinweis rechts; Avatare erst im Detail (D-12/VIS-02) | ✓ |
| Generische Platzhalter-Avatare | Anonyme Kreise in Teilnehmerzahl | |

**User's choice:** Zahl + Plätze (Empfohlen)

| Option | Description | Selected |
|--------|-------------|----------|
| Gestartet-Kennung (Empfohlen) | Dezente „Gestartet"-Kennzeichnung + Sortierung ans Sektionsende, kommende zuerst | ✓ |
| Keine Kennzeichnung | Gleichförmig nach startTime sortiert | |
| Einklappen nach Start | Aufklappbarer „Vergangene"-Bereich | |

**User's choice:** Gestartet-Kennung (Empfohlen)

---

## Create-Formular

| Option | Description | Selected |
|--------|-------------|----------|
| Ein Formular, Live-Regel (Empfohlen) | Titel + Single-Tag; mit Tag wird Titel optional (Platzhalter = Auto-Titel), Untertitel-Feld erscheint; Inline-Validierung | ✓ |
| Zwei Modi (Toggle) | Umschalter „Mit Tag" / „Eigener Titel" | |
| Titel immer Pflicht | Tag nur Kategorisierung | |

**User's choice:** Ein Formular, Live-Regel (Empfohlen)

| Option | Description | Selected |
|--------|-------------|----------|
| Alle vier entfallen (Empfohlen) | Multi-Tags → Single-Select; Mindest-Stepper, Sichtbar-für, Foto fehlen schlicht | (✓ nach Follow-up) |
| Einzeln entscheiden | Die vier Blöcke einzeln durchgehen | |

**User's choice:** Freitext: „Mindest Teilnehmer ja, rest egal fürs erste"
**Notes:** Follow-up-Frage nach Aufzeigen der Konsequenz (Contract + Migration in UI-Phase, admin-Kollisionszone, keine Enforcement-Semantik):

| Option | Description | Selected |
|--------|-------------|----------|
| Backlog (Empfohlen) | Weglassen, als Deferred Idea mit echter Semantik-Anforderung notieren | ✓ |
| Additiv in Phase 11 | nullable minParticipants + Contract-Feld + reine Anzeige | |

**User's choice:** Backlog (Empfohlen) — damit entfallen alle vier Blöcke in Phase 11.

| Option | Description | Selected |
|--------|-------------|----------|
| Tages-Chips + Uhrzeit (Empfohlen) | Chips aus dem Festival-Datumsbereich + Uhrzeit-Picker, auf Festivaltage begrenzt | ✓ |
| Nativer Datum+Zeit-Picker | Plattform-Picker, keine Chips | |
| Chips + freie Wahl | Chips plus „anderes Datum"-Fallback | |

**User's choice:** Tages-Chips + Uhrzeit (Empfohlen)

| Option | Description | Selected |
|--------|-------------|----------|
| Default unbegrenzt + Stepper (Empfohlen) | Ausgangszustand „Ohne Limit"; Tap aktiviert Max-Stepper | ✓ |
| Stepper mit ∞-Stufe | Oberste/unterste Stufe ist ∞ | |
| Default begrenzt | Stepper startet mit konkretem Wert | |

**User's choice:** Default unbegrenzt + Stepper (Empfohlen)

---

## Detail: Beitreten/Voll/Auflösen/Klonen

| Option | Description | Selected |
|--------|-------------|----------|
| Push-Screen (Empfohlen) | Voller Screen mit arrow-left-AppHeader; Platz für Teilnehmerliste, Aktionen, Phase-12-Chat | ✓ |
| Modal-Karte | friend-detail-Stil | |

**User's choice:** Push-Screen (Empfohlen)

| Option | Description | Selected |
|--------|-------------|----------|
| Deaktivierter Button + Grund (Empfohlen) | Echt disabled, nennt den Grund („Voll — 8/8" / „Bereits gestartet"); 409 als Rennen-Fallback | ✓ |
| Button ausblenden | Nur Hinweistext statt Button | |

**User's choice:** Deaktivierter Button + Grund (Empfohlen)

| Option | Description | Selected |
|--------|-------------|----------|
| Auflösen statt Verlassen (Empfohlen) | Creator sieht nie Leave; destruktives „Auflösen" mit nativem Confirm | ✓ |
| Beide zeigen | Verlassen disabled mit Grund + Auflösen daneben | |

**User's choice:** Auflösen statt Verlassen (Empfohlen)

| Option | Description | Selected |
|--------|-------------|----------|
| Jeder klont, Zeit leer (Empfohlen) | Klonen an jeder sichtbaren Aktivität; alles vorbefüllt außer Zeit | ✓ |
| Jeder klont, alles 1:1 | Auch die Zeit vorbefüllt | |
| Nur eigene klonbar | Klonen nur bei eigenen/beigetretenen | |

**User's choice:** Jeder klont, Zeit leer (Empfohlen)

---

## Geo-Punkt & Route öffnen

| Option | Description | Selected |
|--------|-------------|----------|
| Aktueller Standort, ein Tap (Empfohlen) | „Standort anheften" via expo-location getCurrentPosition, entfernbarer Chip; neue native Permission nach Phase-8-Muster | ✓ |
| Karten-Picker | Bräuchte MapLibre (späterer Milestone) | |
| Beides | Standort jetzt, Picker später | |

**User's choice:** Aktueller Standort, ein Tap (Empfohlen)

| Option | Description | Selected |
|--------|-------------|----------|
| Plattform-Standard (Empfohlen) | Linking.openURL mit geo:-URI (Android) / Apple-Maps-URL (iOS), kein neues Paket | ✓ |
| Google-Maps-Link | Universeller Google-Link auf beiden Plattformen | |
| App-Auswahl im Sheet | Eigenes Sheet via react-native-map-link (neues Paket) | |

**User's choice:** Plattform-Standard (Empfohlen)

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, Geo-Punkt mitklonen (Empfohlen) | Punkt gehört zum Ort, wandert als entfernbarer Chip mit | |
| Nein, Geo leer | Nur Freitext-Ort vorbefüllt, Punkt neu anheften | ✓ |

**User's choice:** Nein, Geo leer — **gegen die Empfehlung**; verhindert veraltete Punkte, der Preis (Kloner steht meist nicht am Treffpunkt) wurde genannt und akzeptiert.

| Option | Description | Selected |
|--------|-------------|----------|
| Nur im Detail (Empfohlen) | Beim Treffpunkt-Block, nur mit Geo-Punkt (sonst nur Freitext, SC 5) | ✓ |
| Detail + Listenzeile | Zusätzliches Routen-Icon in der Zeile | |

**User's choice:** Nur im Detail (Empfohlen)

---

## Claude's Discretion

Keine Frage explizit delegiert; technische Umsetzung beim Planner/der UI-SPEC:
Query-Key-Design + Invalidierung, Leerzustände/Fehlerbilder (D-11-Hausmuster),
Listensortierung, Navigation/Toasts nach Mutationen, Standort-Permission-Verweigerung
(Phase-8-Muster), Formular-Komponenten (ADR-022), Routen-/Dateizuschnitt der Push-Screens.

## Deferred Ideas

- Mindest-Teilnehmer (`minParticipants`) — Backlog, nur mit echter „kommt zustande"-Semantik
- Multi-Tags pro Aktivität — „fürs Erste egal" (User)
- „Sichtbar für" (Aktivitäts-Sichtbarkeit) — „fürs Erste egal" (User)
- Foto an Aktivität — „fürs Erste egal" (User); erste Upload-Infrastruktur des Projekts
- Offizielle Events-Sektion — braucht Admin-Stream-Datenquelle
- Karten-Picker für den Geo-Punkt — wenn MapLibre da ist
- Routen-Icon in der Listenzeile — nachrüstbar
