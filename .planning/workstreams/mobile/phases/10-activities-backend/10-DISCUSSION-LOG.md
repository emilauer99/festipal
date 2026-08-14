# Phase 10: Activities Backend - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-14
**Phase:** 10-Activities Backend
**Areas discussed:** Tag-Schema & Altlast `tag`, Global-Katalog-Bootstrap, Kapazität & Creator-Semantik, Discovery-Zuschnitt

---

## Tag-Schema & Altlast `tag`

### Frage 1: Was passiert mit `tag`/`tag_translation` und dem ungenutzten `listTags`-Endpunkt?

| Option | Description | Selected |
|--------|-------------|----------|
| Ersetzen: Altlast raus (Empfohlen) | Neue Tabellen `activity_tag` + `festival_activity_tag` nach ADR-017; `tag`/`tag_translation` und `listTags` entfernt (0 Daten, 0 Clients, ADR-017 nennt ActivityTag den einzigen Tag-Store) | ✓ |
| Migrieren: `tag` umbauen | Bestehende Tabelle per Migration zum ADR-017-Modell erweitern | |
| Daneben bauen, Altlast bleibt | `activity_tag` neu, `tag` bleibt stehen (zwei Tag-Stores) | |

**User's choice:** Ersetzen: Altlast raus

### Frage 2: Tag-Labels übersetzt oder ein einzelnes Label?

| Option | Description | Selected |
|--------|-------------|----------|
| Übersetzungstabelle (Empfohlen) | `activity_tag_translation` nach ADR-012 (Fallback-Kette, resolveLocalized existiert); globaler Katalog bedient Festivals mit verschiedenen Default-Locales | ✓ |
| Ein `label`-Feld | Genau ein Text pro Tag wie ADR-017 wörtlich; spätere Mehrsprachigkeit hieße Migration + Contract-Änderung | |

**User's choice:** Übersetzungstabelle

### Frage 3: Was von `category`/`guide` (ADR-017) baut Phase 10 ins Schema?

| Option | Description | Selected |
|--------|-------------|----------|
| Nur Label (Empfohlen) | id, festivalId (nullable), slug + Übersetzungen; category/guide später additiv vom admin-Stream | ✓ |
| Label + category | Zusätzlich optionale Kategorie-Spalte für Picker-Gruppierung | |
| Volles ADR-017-Modell | Auch `guide` (Text + Link) jetzt | |

**User's choice:** Nur Label

### Frage 4: Festival deaktiviert einen globalen Tag mit bestehenden Aktivitäten — was passiert?

| Option | Description | Selected |
|--------|-------------|----------|
| Bestehende behalten ihn (Empfohlen) | Deaktivieren wirkt nur auf die Auswahl-Liste | (final ✓, via Follow-up) |
| Auch rückwirkend ausblenden | Deaktivierte Tags auch an bestehenden Aktivitäten unterdrückt | (zunächst ✓) |

**Follow-up** (Konflikt mit Auto-Titel-Regel aufgezeigt: Titel = `tag.label` ⇒ Aktivität ohne Tag und ohne Titel):

| Option | Description | Selected |
|--------|-------------|----------|
| Aktivität verschwindet mit | Aktivitäten mit deaktiviertem Tag verschwinden aus der Discovery | |
| Label-Schnappschuss bei Erstellung | Aufgelöster Tag-Titel wird in die Aktivität kopiert (friert eine Sprache ein) | |
| Doch nur Auswahl-Liste | Zurück zur ersten Variante: nur Auswahl für neue Aktivitäten betroffen | ✓ |

**User's choice (final):** Deaktivieren wirkt nur auf die Auswahl-Liste; bestehende Aktivitäten unverändert.
**Notes:** Revidierte Entscheidung nach Claude-Einspruch (Auto-Titel-Konflikt).

---

## Global-Katalog-Bootstrap

### Frage 1: Globaler Tag pro Festival default-AN oder default-AUS?

| Option | Description | Selected |
|--------|-------------|----------|
| Default AN — opt-out (Empfohlen) | Ohne Aktivierungszeile aktiviert; `enabled=false`-Zeile ist das Abschalten; ohne Admin-UI wäre opt-in eine leere effektive Liste | ✓ |
| Default AUS — opt-in | Festival muss jeden globalen Tag explizit aktivieren | |

**User's choice:** Default AN — opt-out

### Frage 2: Woher kommt der initiale globale Tag-Katalog?

| Option | Description | Selected |
|--------|-------------|----------|
| Claude schlägt ~10 vor (Empfohlen) | Planner definiert festival-typischen Startkatalog mit DE+EN im idempotenten Seed; User passt im Plan an | ✓ |
| Ich liefere die Liste | User gibt die Start-Tags vor | |
| Nur Test-Fixtures | Kein produktiver Startkatalog | |

**User's choice:** Claude schlägt ~10 vor

---

## Kapazität & Creator-Semantik

### Frage 1: Zählt der Creator zur Kapazität?

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, zählt mit (Empfohlen) | capacity = Gesamtplatzzahl inkl. Creator (ADR-017 wörtlich) | ✓ |
| Nein, zählt extra | capacity = zusätzliche freie Plätze neben dem Creator | |

**User's choice:** Ja, zählt mit

### Frage 2: Kapazität Pflicht oder „unbegrenzt" möglich?

| Option | Description | Selected |
|--------|-------------|----------|
| Pflicht, immer eine Zahl (Empfohlen) | Feste Platzzahl, kein Sonderfall im Constraint | |
| Optional — null = unbegrenzt | capacity nullable; Sonderfall in Constraint/Contract/voll?-Check; Phase 11 muss „unbegrenzt" darstellen | ✓ |

**User's choice:** Optional — null = unbegrenzt (gegen die Empfehlung, bewusst).

### Frage 3: Darf der Creator verlassen — und was ist der Ausweg für Fehl-Erstellungen?

| Option | Description | Selected |
|--------|-------------|----------|
| Leave 409 + eigener Delete (Empfohlen) | Leave verweigert dem Creator; expliziter creator-only Delete-Endpunkt („Auflösen") | ✓ |
| Creator-Leave = Auflösen | Verlassen des Creators löst die Aktivität auf (versteckte Nebenwirkung) | |
| Kein Ausweg in v1.1 | Weder Verlassen noch Löschen | |

**User's choice:** Leave 409 + eigener Delete-Endpunkt

---

## Discovery-Zuschnitt

### Frage 1: Gestartete/vergangene Aktivitäten in der Discovery-Liste sichtbar?

| Option | Description | Selected |
|--------|-------------|----------|
| Alles zeigen, nichts weg (Empfohlen) | Alle Aktivitäten, sortiert nach startTime; Beitreten auch nach Start | |
| Ab startTime ausblenden | Gestartete verschwinden aus der Liste, nicht mehr beitretbar | ✓ |
| Cutoff mit Puffer | Ausblenden erst Stunden nach startTime / Tagesende | |

**User's choice:** Ab startTime ausblenden

### Frage 2 (Follow-up nach Einspruch: Teilnehmer verlören Ort/Chat exakt zum Start): Gilt das auch für Teilnehmer?

| Option | Description | Selected |
|--------|-------------|----------|
| Teilnehmer sehen sie weiter (Empfohlen) | Ausblenden gilt nur für die öffentliche Discovery; Teilnehmer inkl. Creator behalten Zugriff | ✓ |
| Weg ist weg, für alle | Ab startTime für niemanden mehr abrufbar | |

**User's choice:** Teilnehmer sehen sie weiter

### Frage 3: Wie exponiert die API die Teilnehmer?

| Option | Description | Selected |
|--------|-------------|----------|
| Liste: Zahl · Detail: Namen (Empfohlen) | Liste nur Teilnehmerzahl + eigener Status; Detail volle Teilnehmerliste als Fremd-View-Profile (pickForeignProfile, VIS-02) | ✓ |
| Namen überall | Auch die Liste trägt alle Teilnehmerprofile | |
| Nur Zahlen, nie Namen | Kein Endpunkt nennt Teilnehmer namentlich | |

**User's choice:** Liste: Zahl · Detail: Namen

---

## Claude's Discretion

Endpunkt-Zuschnitt/Pfade im ts-rest-Contract; Mechanik der DB-seitigen Kapazitätserzwingung;
Geo-Punkt-Repräsentation; Schema-Verankerung der Creator-Invariante; Join/Leave-Idempotenz;
keine Pagination (Claude-Default); Migrationsnummer (`0007_*`), Indizes, Fehler-Mapping.

## Deferred Ideas

`category`/`guide` am Tag (admin additiv) · Tag-Verwaltungs-Endpunkte (admin-Workstream) ·
rückwirkendes Tag-Ausblenden inkl. Schnappschuss-Variante (verworfen) · Cutoff-Puffer /
`endTime`-Feld · Aktivität bearbeiten · ActInterest · Pagination · FRND-09 (Blockieren/Melden,
vor der ersten echten Nutzerkohorte).
