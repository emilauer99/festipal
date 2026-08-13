# Phase 8: Friends - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-12
**Phase:** 8-Friends
**Areas discussed:** Aufbau der drei Add-Wege · Chats- & Vorschlags-Block · Freund antippen &
Entfreunden · QR-Flow & Kamera

---

## Aufbau der drei Add-Wege

### Frage 1 — Wo leben Suche und Handle-Eingabe?

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Suche inline, Scanner eigener Screen | Suchfeld auf dem Friends-Screen wird echt; die Kamera-Vorschau kann ohnehin nicht in einer ScrollView leben | ✓ |
| Eigener „Hinzufügen"-Screen für alles | Feld wird Auslöser, pusht auf einen Screen mit Suche + Handle + Scanner | |
| Bottom-Sheet mit Segmenten | Sheet „Freund hinzufügen" mit SegmentedControl (Suchen \| QR) | |

**Notiz:** Kleinster Eingriff, Design bleibt 1:1, ein neuer Screen statt zwei.

### Frage 2 — Ein Feld oder zwei für Handle und Suche?

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Ein Feld, Prefix-Suche | Der volle Handle ist per Konstruktion der erste Treffer; Handle-Lookup bleibt dem QR-Scan | ✓ |
| Zwei Eingaben: Suchfeld + Code-Feld | FRND-02 als eigener sichtbarer Weg auf der quiks-Code-Karte | |
| Ein Feld, exakt bei führendem @ | Umschaltendes Eingabeverhalten je nach `@` | |

**Notiz:** Folgekonsequenz — der Design-Placeholder „Name oder @handle" ist nach Phase-7-D-09
unwahr (`displayName` wird nicht durchsucht) und muss ehrlich neu formuliert werden.

### Frage 3 — Wohin gehen die Suchtreffer?

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Treffer ersetzen die Blöcke darunter | Klarer Suchmodus; Feld leeren stellt den Screen wieder her | ✓ |
| Eigene Sektion über den Blöcken | Nichts verschwindet, aber 20 Treffer schieben den Rest weit nach unten | |
| Fokus pusht auf einen Such-Screen | Widerspricht der eben getroffenen Inline-Entscheidung | |

### Frage 4 — Wie viel darf die Trefferzeile?

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Voller Aktionssatz pro `relation` | none→Hinzufügen · requestIncoming→Annehmen · requestOutgoing/friends→inaktives Label · self→kein Button | ✓ |
| Nur Hinzufügen aktiv | Annehmen ausschließlich in der Anfragen-Sektion — genau eine Stelle pro Aktion | |
| Zeile ist nur Information | Tap öffnet Detailkarte; ein Tap mehr für den häufigsten Vorgang | |

**Notiz:** Bewusst in Kauf genommen — „Annehmen" existiert damit an zwei Stellen; beide müssen
dieselbe Mutation und Cache-Invalidierung benutzen.

---

## Chats- & Vorschlags-Block

### Frage 1 — Was passiert mit dem Chats-Block?

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Ersatzlos raus | ADR-020 schließt 1:1-Chat dauerhaft aus; Chat kommt Phase 12 pro Aktivität | ✓ |
| Bleibt, ehrlich umformuliert | Hält die Design-Optik, kündigt aber ein Feature an, das nie hier landet | |
| Bleibt unverändert | Verspricht weiterhin Messaging, das es nie geben wird | |

**Notiz:** Die Phase-6-Copy war ein Versprechen gegen ADR-020 — das war der Auslöser der Frage.

### Frage 2 — Und „Vielleicht kennst du"?

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Raus, als Idee vermerkt | Weder Endpunkt noch Requirement in v1.1 | ✓ |
| Bleibt als Platzhalter | Konsistent mit Phase-6-Haltung „sichtbar tot statt weggelassen" | |

### Frage 3 — Eingehende und ausgehende Anfragen

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Eine Sektion, zwei Untergruppen | „An dich" (Annehmen/Ablehnen) und „Von dir" (Zurückziehen) | ✓ |
| SegmentedControl in der Sektion | Ruhiger, aber die andere Richtung bleibt unsichtbar | |
| Eine Liste, Richtung pro Zeile | Kompakt, aber unterschiedliche Aktionen ohne Gruppierung | |

### Frage 4 — Reihenfolge der vier Elemente

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Fix, mit Zähler-Badge | Vorhersagbarer Screen; Dringlichkeit über das Badge an „Anfragen" | ✓ |
| Anfragen nach oben, wenn offen | Dringendes oben, aber der Screen sieht bei jedem Besuch anders aus | |
| Anfragen auf eigenen Push-Screen | Ruhigster Hauptscreen, aber ein Screen für etwas meist Leeres | |

---

## Freund antippen & Entfreunden

### Frage 1 — Wo lebt „Freundschaft beenden"?

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Tap → Detailkarte, Entfreunden unten | Zeigt nur, was die Liste ohnehin trägt; gibt dem Design-Tap ein ehrliches Ziel | ✓ |
| Long-Press → natives Menü | Wenigster Code, aber unsichtbare Geste und ein toter Tap | |
| Swipe auf der Zeile | Kein Swipe-Muster in der App, Gestenbibliothek nötig, Kollision mit Scroll | |

### Frage 2 — Rückfrage vor dem Entfreunden?

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Nativer `Alert.alert` wie beim Abmelden | Ein Muster für alle destruktiven Aktionen | ✓ |
| Ohne Rückfrage, mit Rückgängig-Hinweis | Es gibt kein echtes Rückgängig — wäre ein leeres Versprechen | |
| Ohne Rückfrage | Die einzige unumkehrbare Aktion des Screens hätte weniger Reibung als Abmelden | |

### Frage 3 — Was steht in einer Freundeszeile?

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Avatar + Name + @handle | Ein Zeilenbaustein für alle drei Listen; der Handle ist der Identifikator | ✓ |
| Avatar + Name + „Freunde seit …" | Wärmer, aber der Handle verschwindet und die Listen driften auseinander | |
| Nur Avatar + Name | Ruhigste Liste, aber gleiche displayNames sind nicht unterscheidbar | |

**Notiz:** Der `presence`-Punkt der Design-`FriendRow` entfällt in jedem Fall — ADR-014.

### Frage 4 — Sortierung der Freundesliste

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Server-Reihenfolge übernehmen (`username`) | Eine Sortierung, ein Begriff, testbar und stabil | |
| Clientseitig nach `displayName` sortieren | Optisch stimmiger; zweiter Sortierbegriff im Client | ✓ |
| Neueste Freundschaft zuerst | Schönes Feedback nach dem Adden, unbrauchbar zum Nachschlagen | |

**Notiz:** Einwand benannt und vom User überstimmt. Zusätzlich flagged: `Intl.Collator` ist in
Hermes nicht garantiert vorhanden (die App polyfillt bisher nur `PluralRules`) — die Sortierung
braucht einen definierten Fallback und gehört als reine Logik nach `lib/`.

---

## QR-Flow & Kamera

### Frage 1 — Zeigen und Scannen: ein Screen oder zwei?

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Ein Screen mit Umschalter „Mein Code \| Scannen" | Entspricht „Zeigen, scannen, fertig"; Kamera läuft nur im Scan-Zustand | ✓ |
| Zwei getrennte Screens | Klarere Trennung, aber ein zweiter Einstiegspunkt auf einem vollen Screen | |
| QR inline in der Karte | Wenigste Navigation, aber in Kartengröße schlecht scannbar | |

### Frage 2 — Was passiert nach einem erfolgreichen Scan?

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Profilkarte zur Bestätigung | Handle-Lookup, Karte mit `relation`-Button; erst der Tap sendet | ✓ |
| Sofort senden, dann Bestätigung | Schnellster Weg, aber kein Zurück und bei bestehender Freundschaft sinnlos | |
| Zurück mit vorbelegter Suche | Umweg über die Prefix-Suche, obwohl der exakte Lookup existiert | |

### Frage 3 — Verweigerte Kamera-Erlaubnis

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Erklärung + Einstellungen + Handle tippen | Niemand steckt fest; der Weg ohne Kamera existiert bereits | ✓ |
| Erklärung + Einstellungen | Kürzer, nennt aber den zweiten Weg nicht | |
| Nur ein Hinweis | Dauerhaft abgelehnte Berechtigung → toter Screen ohne Ausweg | |

### Frage 4 — Wann wird die Erlaubnis abgefragt?

| Option | Beschreibung | Gewählt |
|--------|--------------|---------|
| Erst beim Umschalten auf „Scannen" | Klarster Kontext; wer nie scannt, wird nie gefragt | ✓ |
| Beim Öffnen des QR-Screens | Kamera sofort bereit, aber Dialog ohne Kontext → dauerhafte Ablehnungen | |
| Eigener Erklärungsschritt davor | Höchste Zustimmungsrate, aber ein Schritt zu viel | |

---

## Claude's Discretion

Der User hat keine Frage explizit an Claude delegiert („You decide" kam nicht vor). Bewusst nicht
gefragt, weil technische Umsetzung: Bibliothekswahl für Barcode-Scan und QR-Erzeugung,
Routen-Struktur/-Benennung des QR-Screens, Debounce-Fenster und Verhalten unter 2 Zeichen,
Query-Keys und Invalidierungsstrategie, Aufbau der Detailkarte (Modal vs. Sheet),
Icon-Auswahl/Abstände, ob Anfrage- und Trefferzeilen ebenfalls tappbar sind.

## Deferred Ideas

- Chats-Block auf dem Friends-Screen — entfällt **dauerhaft** (ADR-020), nicht „später wieder"
- „Vielleicht kennst du" / Freund-von-Freund-Vorschläge — kein Endpunkt, kein Requirement in v1.1
- Präsenz / „gerade am Gelände" in der Freundeszeile — ADR-014; spätere Opt-in-Stufe ist FRND-03b
- Blockieren/Melden (FRND-09) — vor der ersten echten Nutzerkohorte einplanen
- FRND-07 und der `home` → `start`-Rename (NAV-03) — Phase 9
- „Handle teilen" (System-Share-Sheet) auf der quiks-Code-Karte
- Anfragen-Badge in der `FloatingNav` — braucht Hintergrundabfrage oder Push (NOTF-01)
- Username-Umbenennung und alte QR-Codes — PROF-02
