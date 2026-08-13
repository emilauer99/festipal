# Phase 7: Profile Visibility & Friendship Backend - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-12
**Phase:** 7-Profile Visibility & Friendship Backend
**Areas discussed:** Fremdprofil-Projektion, Username-Suche, Request-Lifecycle, Handle / quiks-Code

---

## Fremdprofil-Projektion

### Frage 1 — Wie viele Sichtbarkeitsstufen?

| Option | Description | Selected |
|--------|-------------|----------|
| Zwei Stufen | Owner-View + EINE Fremd-View; Fremde und Freunde sehen dasselbe. Genau eine Projektionsfunktion → VIS-02 trivial beweisbar | ✓ |
| Drei Stufen | Owner / Fremd (minimal) / Freund (mehr). Fachlich reicher, aber jede Fremd-Abfrage muss den Freundschaftsstatus laden | |

**User's choice:** Zwei Stufen
**Notes:** Empfehlung gefolgt. Der ausschlaggebende Punkt war die Beweisbarkeit von VIS-02 („kein zweiter Codepfad").

### Frage 2 — Welche Felder trägt die Fremd-View?

| Option | Description | Selected |
|--------|-------------|----------|
| + pronoun (empfohlen) | accountId, username, displayName, avatar, pronoun. gender wartet auf IDN-02 | |
| Nur Minimal (4 Felder) | accountId, username, displayName, avatar — streng default-closed | |
| + pronoun + gender | Alles außer birthDate und E-Mail | ✓ |

**User's choice:** + pronoun + gender
**Notes:** **Gegen die Empfehlung gewählt, mit benanntem Konflikt.** Die Option trug explizit den Hinweis, dass `gender` das Feld ist, an dem IDN-02 (Flinta-Filter, Birgits Sicherheitskonzept) noch hängt, und dass eine Auslieferung an Fremde diese Entscheidung vorwegnimmt. Der User hat das gelesen und so entschieden. In CONTEXT.md D-02 als bewusste Vorwegnahme mit `one-way`-Reversibilität festgehalten, damit es später nicht als Versehen gelesen wird.

### Frage 3 — Braucht Phase 7 einen eigenen Fremdprofil-Endpunkt?

| Option | Description | Selected |
|--------|-------------|----------|
| Lookup + Listen | Handle-Lookup (für QR/Handle-Vorschau) + Fremd-View eingebettet in Suche/Requests/Freundesliste | ✓ |
| + Detail-Endpunkt | Zusätzlich echter Fremdprofil-Endpunkt für einen späteren Detail-Screen | |
| Nur Listen, kein Lookup | Handle-Eingabe geht ohne Vorschau direkt ins Senden | |

**User's choice:** Lookup + Listen
**Notes:** Kein v1.1-Requirement fordert einen Detail-Screen; blindes Bestätigen eines QR-Scans wurde verworfen.

### Frage 4 — Auffindbarkeits-Opt-out?

| Option | Description | Selected |
|--------|-------------|----------|
| Nein, wie geplant | Jeder mit Profil bleibt findbar; FRND-09 löst es später vollständig | ✓ |
| Ja, ein Schalter jetzt | `searchable`-Spalte, filtert die Suche; Handle-Lookup bliebe offen | |

**User's choice:** Nein, wie geplant
**Notes:** Konsistent mit der Milestone-Entscheidung, FRND-09 bewusst zurückzustellen statt halb vorzuziehen.

---

## Username-Suche

### Frage 1 — Matching-Regel

| Option | Description | Selected |
|--------|-------------|----------|
| Prefix, case-insensitive | `lower(username) LIKE 'x%'`, nutzt den vorhandenen Functional-Index | ✓ |
| Teilstring | `LIKE '%x%'`, nutzerfreundlicher, braucht aber pg_trgm oder wird zum Full-Scan | |
| Nur exakter Treffer | Maximal privatsphärefreundlich, macht FRND-03 aber zur Dublette von FRND-02 | |

**User's choice:** Prefix, case-insensitive
**Notes:** —

### Frage 2 — Beziehungsstatus pro Treffer?

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, Status pro Treffer | `relation`: none / requestOutgoing / requestIncoming / friends / self | ✓ |
| Nein, nur Profile | Schlankere Antwort, aber Phase 8 muss selbst gegenrechnen | |

**User's choice:** Ja, Status pro Treffer
**Notes:** Spart Phase 8 eine ganze Klasse von Fehlerdialogen.

### Frage 3 — Mindestlänge und Trefferzahl

| Option | Description | Selected |
|--------|-------------|----------|
| Ab 2 Zeichen, max. 20 | Stabil nach username sortiert, keine Relevanz-Heuristik | ✓ |
| Ab 3 Zeichen, max. 20 | Konservativer, aber bei kurzen Usernames muss man alles tippen | |
| Ab 2 Zeichen, max. 50 | Längere Liste, mehr Preisgabe pro Anfrage | |

**User's choice:** Ab 2 Zeichen, max. 20
**Notes:** —

### Frage 4 — Wird displayName mitdurchsucht?

| Option | Description | Selected |
|--------|-------------|----------|
| Nur username | Einziges eindeutiges, indiziertes, normalisiertes Feld | ✓ |
| Beides | Findet Leute über den Anzeigenamen, macht displayName aber zum öffentlichen Suchschlüssel | |

**User's choice:** Nur username
**Notes:** —

---

## Request-Lifecycle

### Frage 1 — Gegenanfrage bei offener Anfrage in der Gegenrichtung

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-Accept | Gegenanfrage gilt als Zustimmung → sofort befreundet; zugleich Auflösungspfad für das Rennen | ✓ |
| Fehler „schon offen" | Explizit, aber zwei Schritte für etwas, das beide wollen | |

**User's choice:** Auto-Accept
**Notes:** Deckt sich mit der Roadmap-Vorgabe, das Rennen im Schema zu lösen (kanonisch geordnetes Paar + Unique-Constraint) — der Verlierer des Inserts läuft in denselben Pfad.

### Frage 2 — Erneutes Anfragen nach Decline

| Option | Description | Selected |
|--------|-------------|----------|
| Ja, sofort wieder | Ablehnung betrifft die Anfrage, nicht die Person; kein Pseudo-Blocking vor FRND-09 | ✓ |
| Nein, bis B aktiv wird | De-facto leises Blockieren, nimmt FRND-09 halb vorweg | |
| Ja, aber mit Cooldown | Bremst Spam, kostet Zeitregel + Tests + Katalog-Strings | |

**User's choice:** Ja, sofort wieder
**Notes:** —

### Frage 3 — Verbleib abgelehnter/zurückgezogener Anfragen

| Option | Description | Selected |
|--------|-------------|----------|
| Zeile löschen | Höchstens eine Zeile pro Paar; der Unique-Constraint ist die Invariante | ✓ |
| Status behalten | Auswertbar und FRND-09-Ansatzpunkt, aber Recycling-Logik und personenbezogene Altdaten | |

**User's choice:** Zeile löschen
**Notes:** —

### Frage 4 — Obergrenze für offene ausgehende Anfragen

| Option | Description | Selected |
|--------|-------------|----------|
| Nein, kein Limit | Konsistent mit den vorigen Entscheidungen; Exposition ist dokumentiert | ✓ |
| Ja, Obergrenze | z.B. max. 50 offen, schützt die DB, kostet einen Fehlerfall in Phase 8 | |

**User's choice:** Nein, kein Limit
**Notes:** —

---

## Handle / quiks-Code

### Frage 1 — Was ist der quiks-Code?

| Option | Description | Selected |
|--------|-------------|----------|
| Der Username selbst | `@username`; eine Identität, vorlesbar und tippbar. Username ist in v1.1 unveränderlich | ✓ |
| Eigener stabiler Code | Überlebt späteres Umbenennen, kostet zwei Identifikatoren und einen zweiten Lookup-Pfad | |
| accountId als Code | Kein neues Schema, aber interne ID wird öffentlich und ist nicht vorlesbar | |

**User's choice:** Der Username selbst
**Notes:** Die Folgefrage „was passiert mit alten QR-Codes, wenn PROF-02 Umbenennen erlaubt" ist in CONTEXT.md D-16 an PROF-02 adressiert.

### Frage 2 — QR-Inhalt (Vorentscheidung für Phase 8)

| Option | Description | Selected |
|--------|-------------|----------|
| Namespaced Klartext | `quiks:u/<username>`; nur der In-App-Scanner interpretiert es, kein Anfassen des Deep-Link-Capture-Pfads | ✓ |
| Echter Deep-Link | Schöner und teilbar, aber genau der Pfad des Phase-5-Bugs und kollidiert mit NAV-03 in Phase 9 | |
| Blanker Username | Einfachst, aber jeder Text-QR sieht aus wie ein Handle | |

**User's choice:** Namespaced Klartext
**Notes:** Backend bleibt unberührt; die Entscheidung ist für Phase 8 notiert.

---

## Claude's Discretion

Der User hat **keine** Frage an Claude delegiert — „You decide" kam nicht vor. Bewusst *nicht*
gefragt (technische Umsetzung, gehört zum Planer): Endpunkt-Zuschnitt und Pfadnamen im ts-rest-
Contract, getrennte vs. kombinierte Listen-Endpunkte, Migrationsname und Index-Auswahl,
404-vs-null-Mapping, Idempotenz-Umsetzung. Zwei technische Defaults sind in CONTEXT.md als D-14
und D-15 festgehalten (kanonisch geordnetes Paar als Einzelzeile; FK auf
`visitor_profile.accountId`, kein `festivalId`).

## Deferred Ideas

- Auffindbarkeits-Schalter (`searchable`) → FRND-09
- Cooldown / Wiederholungssperre nach Decline → FRND-09
- Limit auf offene ausgehende Anfragen → billiger Nachzug bei realem Missbrauch
- Dritte Sichtbarkeitsstufe (Fremder vs. Freund) → IDN-02
- Fremdprofil-Detail-Endpunkt und -Screen → Phase 8/9, sobald ein Requirement ihn fordert
- `gender` hinter eine IDN-02-Policy stellen → wenn Birgits Konzept landet
- QR-Deep-Link `quiks://u/…` → nach NAV-03 (Phase 9)
- Username-Umbenennung und alte QR-Codes → PROF-02
