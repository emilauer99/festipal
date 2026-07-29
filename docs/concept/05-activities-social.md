# 05 — Aktivitäten, Tags, Timetable-Social & Dashboard (Cluster 2)

> **Zweck:** Das Kern-Differenzierungsfeature (**Aktivitäten / Freunde connecten**), die
> **Social-Schicht im Timetable** und der **Dashboard-Aufbau**. Ergebnis von **Cluster 2** nach
> dem Team-Meeting. Verbindlich als **ADR-017**. Stand: 2026-07-29. Noch kein Code — Grundlage
> für `packages/contracts` + `packages/db`.

---

## 1. Aktivitäten

Selbst angelegte Campingplatz-Aktivitäten („Lust auf Flunky Ball?"). Festival-scoped.

**`Activity`**
| Feld | Pflicht | Typ | Anmerkung |
|---|---|---|---|
| `id` / `festivalId` | ✅ | — | Tenant-scoped |
| `creatorId` | ✅ | → VisitorProfile | Ersteller, automatisch Teilnehmer |
| `tagId?` | – | → ActivityTag | wenn gesetzt → Titel automatisch |
| `title` | ✅ **nur ohne Tag** | string | mit Tag optional/leer |
| `subtitle?` | – | string | Zusatz (auch bei Tag), z. B. „in der Dreisen" |
| `location` | ✅ | `{ text, geo? }` | Freitext + optional Geo-Punkt (siehe §2) |
| `startTime` | ✅ | timestamp | Zeitpunkt |
| `capacity` | ✅ | int | Anzahl Plätze |
| `description?` | – | string | frei |
| `attendees[]` | – | → VisitorProfile | Beitreten/Verlassen bis `capacity` |

**Auto-Titel-Logik**
- **Tag gesetzt:** Anzeige = `tag.label` (+ `subtitle`, wenn vorhanden); `title` nicht nötig.
- **Kein Tag:** `title` ist Pflicht (Freitext).
- Ziel: Events heißen nicht alle generisch „Flunky Ball" — mit Tag geht's schnell, ohne Tag
  entsteht ein eigener Titel.

**Klonen** („Dieses Event kopieren"): reine UI-Aktion → neue `Activity` mit übernommenem
Tag/Titel/Beschreibung/Kapazität; der Nutzer ändert nur **Zeit + Ort**. Kein eigenes Entity.

**Beitreten:** Teilnehmer treten bei bis `capacity` erreicht ist; darüber kein Beitritt (kein
Waitlist im MVP). Creator ist automatisch dabei.

**Lobby-Chat (pro Aktivität):** beigetretene `attendees` erhalten einen **Gruppen-Chat** —
`ActivityMessage` = `{ activityId, senderId, body, ts }`, sichtbar nur für Teilnehmer, über das
WebSocket-Gateway (ADR-010). **Kein** 1:1-/DM-Chat zwischen Usern (ADR-020) — Kontakt außerhalb
einer Aktivität läuft über Profil-Socials (ADR-016).

---

## 2. Standort einer Aktivität

- `location.text` = **Freitext** (z. B. „beim blauen Zelt, Reihe C") — immer.
- `location.geo?` = optionaler **Geo-Punkt**, erfasst über den **„aktueller Standort"-Button**
  (einmalige, opt-in Erfassung beim Anlegen).
- **Nutzung:** der Geo-Punkt dient **nur** „Route öffnen" → **externe Maps** (Google/Apple Maps).
  Kein eigener interaktiver Plan im MVP.
- **Abgrenzung zu ADR-014:** Das ist eine **einmalige Punkt-Erfassung** für den *Ort eines Events*
  — **kein** kontinuierliches Präsenz-/„wer ist hier"-Tracking (das bleibt GPS-frei). Der spätere
  interaktive Lageplan (Freunde auf der Karte) ist eine eigene Ausbaustufe.

---

## 3. Tag-Modell (global + pro Festival)

Ein **einziger** Tag-Store mit Doppelrolle über nullable `festivalId`:

**`ActivityTag`**
| Feld | Anmerkung |
|---|---|
| `id` | — |
| `festivalId?` | **`null` = globaler Katalog** (Platform-Admin) · gesetzt = **festival-eigener Custom-Tag** |
| `label` | = der Auto-Titel, z. B. „Flunky Ball" |
| `category?` | optional (sportlich / kreativ / …) |
| `guide?` | optional: Text + Link/YouTube (Regeln, „so spielt man das") |

**Pro-Festival-Aktivierung globaler Tags:**

**`FestivalActivityTag`** = `{ festivalId, tagId, enabled }`
- Ein Festival **wählt globale Tags aus/ab** (`enabled`) und **legt eigene an** (Custom-Tags mit
  gesetztem `festivalId`).
- **Effektive Tag-Liste eines Festivals** = *aktivierte globale Tags* ∪ *festival-eigene Tags*.
- Verwaltung im **Festival-Admin** (ADR-016; Detail-Scope in Cluster 3). Globaler Katalog =
  Platform-Admin.

---

## 4. Timetable-Social

Getrennt von Aktivitäten — hier geht es um die **kuratierten Acts** des Festivals (Timetable).

**`ActInterest`** = `{ visitorId, actId }`  *(festival-scoped, **keine** Kapazität)*
- Markiert Interesse/Like an einem Act.
- **Freundes-Likes inline:** am Act erscheinen Freundes-Avatare / ein Icon, wenn Freunde den Act
  geliked haben — **ohne** separaten „Connect"-Schritt.
- **„Wer geht hin":** Act antippen → Freunde, die Interesse markiert haben (`ActInterest` ∩
  Freundes-Graph). Kein GPS.
- **Layout:** Stages **nebeneinander** (Zeit-Raster über Stages) statt durchklicken.

**Bewusste Trennung:**
| | Kapazität | Beitreten | Quelle |
|---|---|---|---|
| **Activity** (Camp) | ✅ | ✅ | user-erstellt |
| **Act** (Timetable) | – | Interesse (Like) | festival-kuratiert |

---

## 5. Dashboard-Aufbau

Reihenfolge oben → unten (kein Act-Sidescroll mehr):

1. **Hero / Ankündigung** — **ein** großes, vom Festival-Admin gesetztes Element (`FestivalAnnouncement`:
   Bild + kurzer Text + optional Link/CTA), zeitlich planbar (`activeFrom/until`). Z. B. „Merch
   offen", „1+1 im Supermarkt". Fehlt eins → „Jetzt live"-Highlight oder nichts.
2. **Cashless-Einstieg** — prominenter „Cashless öffnen"-Button (kein Guthaben, ADR-011), nur wenn
   `cashlessUrl` hinterlegt.
3. **Jetzt auf den Stages** — Now-Playing kompakt, Stages nebeneinander.
4. **News** — neueste Festival-News (wenige).
5. **Aktivitäten** — ein paar kommende/relevante (z. B. von Freunden).

**`FestivalAnnouncement`** = `{ festivalId, title, body?, image?, link?, activeFrom?, activeUntil? }`
— vom Festival-Admin gepflegt (Cluster 3).

---

## 6. Offene Punkte / später

- **Guide je Tag** ist fürs Erste optionaler Text + Link — Ausbau (mehrere Videos, strukturierte
  Regeln) später.
- **Waitlist / Warteliste** bei vollen Aktivitäten: bewusst nicht im MVP.
- **Empfehlungslogik** fürs Dashboard („relevante Aktivitäten") — zunächst simpel (kommende von
  Freunden / neueste); Ranking später.
- **Globaler Tag-Katalog**: Startbestückung (welche Default-Tags) → beim Admin-Aufbau (Cluster 3).
