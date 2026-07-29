# 07 — Lageplan (MVP) (Cluster 4)

> **Zweck:** Der **bild-basierte Lageplan** fürs MVP (statt MapLibre) mit DB-gestützten
> Marker-Typen. Ergebnis von **Cluster 4** nach dem Team-Meeting. Verbindlich als **ADR-019**
> (reframed ADR-008). Stand: 2026-07-29. Noch kein Code.

---

## 1. MVP-Ansatz: Bild + Marker

- Der **Festival-Admin lädt ein Kartenbild** hoch (offizielles Lageplan-Artwork/Foto).
- Er setzt **Marker** darauf — positioniert über **Bild-Koordinaten** (normiert 0–1), **kein GPS**.
- Nutzer: Bild **zoomen/schieben**, Marker antippen → Info (Label + optional Beschreibung).
- **Kein GPS-Overlay** auf dem Bild im MVP (im Meeting als „unmöglich" eingestuft) → spätere Stufe.
- **Offline-fähig** (ADR-007): Bild + Marker-Daten werden gecached und funktionieren am Einlass/
  Gelände ohne Netz.

---

## 2. Marker-Typen — in der DB, nicht hardcoded

`MarkerType` ist ein **globaler, seed-barer Katalog** (fester Startsatz, später erweiterbar /
festival-anpassbar). Jeder Typ trägt ein **`icon` (String, Lucide-Name)** — gerendert über
`<Icon name=… />` (ADR-015) — und ein **lokalisierbares `label`** (zentral übersetzt, ADR-012).

| `key` | `label` (de) | `icon` (Lucide, Vorschlag) |
|---|---|---|
| `stage` | Bühne | `music` |
| `water` | Wasser | `droplet` |
| `food` | Essen/Stand | `utensils` |
| `merch` | Merch | `shopping-bag` |
| `entrance` | Eingang | `door-open` |
| `emergency_exit` | Notausgang | `triangle-alert` |
| `toilet` | WC | `toilet` |
| `medic` | Sanitäter | `heart-pulse` |
| `info` | Info | `info` |
| `landmark` | Landmark | `landmark` |
| `camping` | Camping | `tent` |
| `cashless_topup` | Cashless-Aufladung | `credit-card` |

> Icons sind Vorschläge — final beim Bau (Lucide-Verfügbarkeit prüfen). Der Katalog ist ein
> **Datensatz**, kein Enum → pflegbar ohne Code-Änderung.

---

## 3. Datenmodell

**`FestivalMap`** (festival-scoped)
| Feld | Anmerkung |
|---|---|
| `festivalId` | Tenant |
| `image` | hochgeladenes Kartenbild |
| `width` / `height` | für Koordinaten-Mapping |
| — | **eine Karte pro Festival im MVP** (mehrere Bereiche wie Camping/Gelände später) |

**`MapMarker`** (festival-scoped)
| Feld | Anmerkung |
|---|---|
| `festivalId` / `mapId` | Tenant + Karte |
| `typeId` | → `MarkerType` (Icon + Label) |
| `label` | konkrete Beschriftung (z. B. „Mainstage") |
| `description?` | optional |
| `x` / `y` | Bild-Koordinaten, normiert 0–1 |
| `geo?` | optionaler echter Geo-Punkt (für „Route öffnen") |

**`MarkerType`** (global, seed-bar): `key`, `label` (i18n), `icon` (String).

---

## 4. „Route öffnen"

- Läuft **nicht** über das Bild (nicht geo-referenziert), sondern über **echte Geo-Punkte**:
  - **Aktivitäten** haben optional `location.geo` (ADR-017) → „Route öffnen" → **externe Maps**.
  - **Marker** können optional einen `geo`-Punkt tragen (z. B. Haupteingang) → gleiche Route-Funktion.

---

## 5. Sichtbarkeit / Rechte

- **Marker im MVP nur vom Admin** setzbar (offizielle Karte, ADR-018).
- **Persönliche Pins** („mein Zelt") und **Freunde auf der Karte** = spätere **GPS/MapLibre-Stufe**
  (ADR-008 / ADR-014). Das Modell ist so gebaut, dass das ohne Migration dazukommt.

---

## 6. Verhältnis zu ADR-008 (MapLibre)

- **MapLibre bleibt das Ziel:** Vektor-Tileset, GPS, Freunde auf der Karte, ggf. Areas/Polygone.
- **MVP = Bild + Marker.** Der Umstieg ist eine spätere, eigene Stufe — die `MapMarker`-Daten
  (Typ, Label, optional Geo) lassen sich übernehmen.

---

## 7. Offen / später

- **Mehrere Karten pro Festival** (Gelände vs. Camping) — post-MVP.
- **Festival-eigene Marker-Typen** (analog Aktivitäts-Tags) — bei Bedarf.
- **Areas/Polygone** (Zonen einzeichnen) — erst mit MapLibre.
- **Startbestückung** des `MarkerType`-Katalogs beim Aufbau finalisieren (inkl. finaler Icons).
