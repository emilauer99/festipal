# 01 — Design-Analyse (Extraktion aus Claude Design)

> **Zweck:** Präzise, wertneutrale Bestandsaufnahme des ersten Designentwurfs. Hier stehen
> **Fakten aus dem Entwurf**, keine Architekturentscheidungen. Entscheidungen und offene
> Punkte → [`02-open-questions.md`](./02-open-questions.md).
> Quelle: `Festipal App Screens.dc.html` + importierte Bundles. Stand: 2026-07-28.

---

## 1. Das zentrale Strukturprinzip: zwei Navigationskontexte

Die App hat **zwei getrennte Modi**, zwischen denen umgeschaltet wird — das ist die
wichtigste Erkenntnis für die ganze Architektur:

| Kontext | Wann | Bottom-Nav (5 Tabs) |
|---|---|---|
| **Global Shell** (`festival = null`) | User-Ebene, festivalübergreifend | Home · Festivals · Artists · Friends · Mehr |
| **Im Festival** (`festival` gesetzt) | innerhalb *eines* Festivals | Dashboard · Tausch · Crew · Timetable · Lageplan |

- **Eintritt** in den Festival-Kontext: `openFestival(fest)` → setzt `festival` + Tab `dashboard`.
- **Rückkehr**: `goHome()` → `festival = null` + Tab `overview`.
- Die **Top-Bar** trägt Titel/Untertitel je Screen, ein Profil-Avatar (rechts) und bei
  „Push-Screens" einen Zurück-Pfeil.
- **Push-Screens** (liegen *über* der Nav, mit Zurück-Pfeil statt Tab): `news`, `profile`, `wallet`.
- **Full-bleed** (randlos, ohne Scroll-Container): `map`.
- Ein **Glocken-Icon** (News) erscheint oben rechts auf `dashboard` und `overview`.

> **Ableitung (vorgemerkt für Konzept):** Dieser Kontextwechsel Global ↔ Festival ist faktisch
> die **Mandantengrenze** aus unserer Multi-Tenancy-Architektur. Siehe `02-open-questions.md`.

---

## 2. Screen-Inventar (13 Screens)

### Global Shell

| # | Screen | Zweck | State / Interaktion |
|---|---|---|---|
| 01 | **Home** (`overview`) | Nächstes Festival, eigene + empfohlene Festivals, Artists, globale News | Rails (horizontal), Buttons „Festival öffnen"/„Ticket", `SocialRow` |
| 02 | **Meine Festivals** (`festivals`) | Liste kommend/vergangen, Ticket-Hinweis | `SegmentedControl` (Kommend/Vergangen), Suche, `EmptyState`, „Ticket/Code hinzufügen" |
| 03 | **Meine Artists** (`artists`) | Gefolgte Acts + Vorschläge, Genre-Filter, Artist-Detail | Suche, Genre-`Tag`s, Follow-Toggle, **Detail-`Sheet`** mit Terminen + „Termine abonnieren" |
| 04 | **Friends** (`friends`) | Crew, Freundschaftsanfragen, Einladen | Anfragen annehmen/ablehnen (`handled`-State), **Einladen-`Sheet`** („Link teilen") |
| 05 | **Einstellungen** (`settings`) | Standort, SafeNow, Konto, Cashless-Einstieg | `Switch`es (Standort teilen, Push, Auto-Aufladung, Artist-Push), `ListRow`s, `SafeNowCard` |
| 06 | **Profil** (`profile`) | Push-Screen mit Zurück-Pfeil, Konto-Einstellungen | `Switch`es (teilen/Push/Auto), „Abmelden" |

### Im Festival

| # | Screen | Zweck | State / Interaktion |
|---|---|---|---|
| 07 | **Dashboard** (`dashboard`) | Jetzt live, alle Stages, „als Nächstes", Cashless-Kachel, News, Featured, Social | Rails, Save-Toggle auf Acts, Sprung zu Timetable/Wallet/News |
| 08 | **Timetable** (`timetable`) | Running Order pro Tag, Filter Bühne/„Meine"/„Friends", Konflikte | 2× `SegmentedControl` (Tag; alle/meine/friends), Bühnen-`Tag`s, Save-Toggle, `FriendStack` |
| 09 | **Lageplan** (`map`) | Full-bleed Schema-Karte, Areale, Pins, Layer, SafeNow | Layer-Umschalter, Areal/Pin-Auswahl, **Sheets**: Vendors, Pin-Detail, **SafeNow-Notruf** |
| 10 | **Tauschbörse** (`swap`) | Camping-/Ticket-Tausch, Suche, Verschenkt | `SegmentedControl` (alle/nah), Art-`Tag`s (Tausch/Suche/Verschenkt), Detail-`Sheet`, **„Angebot erstellen"-`Sheet`** |
| 11 | **Crew** (`social`) | Aktivitäten + Freunde vor Ort | `SegmentedControl` (Aktivitäten/Freunde), Join-Toggle, **„Aktivität starten"-`Sheet`** |
| 12 | **Cashless** (`wallet`) | Guthaben, Aufladen, Bezahlen, Buchungen | `BalanceCard`, **Sheets**: „An Kassa zeigen" (QR), „Guthaben aufladen" (Betrag) |
| 13 | **News** (`news`) | Wichtig/Lineup/Info, festival- oder global-scoped | Art-`Tag`-Filter, `NewsCard`s |

### Vom Entwurf explizit als **fehlend** benannt (Footer)

Onboarding, Ticket-Einlösung, Artist-Detail (eigener Screen), Suche (global), Offline-Zustand.

---

## 3. Domänenmodell (aus den Daten extrahiert)

Alle Entitäten stammen aus `data.jsx`. Sie sind **noch keine DB-Schemata**, sondern die im
Design implizierten Felder — die Basis für das spätere Drizzle-Schema in `packages/db`.

### Festivalübergreifend (User-Ebene)

- **User/Me** — `name`, `chip` (Cashless-Chip-ID), `balance`
- **Festival** — `id`, `name`, `dates`, `place`, `status` (`angemeldet` | `empfohlen` | `vorbei`),
  `ticket`, `friends` (Anzahl), `countdown[]` (value/label)
- **Artist** — `name`, `genre`, `nextFestival`, `nextAt`, `upcoming` (Anzahl Termine), `following`
- **Friend** — `name`, `at` (Ort) *oder* `status` (Freitext), `distance`, `presence` (`online`|`away`|`none`)
- **FriendRequest** — `name`, `status` (Kontext, z. B. gemeinsame Freunde)
- **News (global)** — `id`, `kind` (`warning`|`lineup`|`info`), `time`, `unread`, `title`, `body`

### Festival-scoped (nur im Festival-Kontext)

- **Act / Slot** — `time`, `endTime`, `artist`, `stage`, `day` (Fr/Sa/So), `genre`,
  `saved`, `live`, `conflict`, `friends[]` (Namen, die den Act gemerkt haben)
- **Stage** — `stage`, `now`, `nowUntil`, `progress` (%), `next`, `nextAt`
- **News (festival)** — gleiche Form wie global, aber festivalbezogen
- **Activity** — `id`, `title`, `time`, `place`, `host`, `going[]`, `spots` (freie Plätze)
- **Listing (Tauschbörse)** — `id`, `kind` (`tausch`|`suche`|`verschenkt`), `title`,
  `offers`, `wants`, `owner`, `area`, `distance`
- **Transaction** — `label`, `detail`, `amount` (Vorzeichen als String), `time`, `positive`
- **Vendor** — `name`, `kind` (`Foodtruck`|`Bar`|`Merch`), `rating`, `ratingCount`,
  `distance`, `wait` (Wartezeit), `tags[]` (z. B. vegan)
- **Map Area** — `id`, `label`, `x/y/w/h` (%), `tone` (Farbe)
- **Map Pin** — `id`, `label`, `x/y` (%), `icon`, Flags `me` | `vendor`(Index) | `help`

> **Beobachtung:** Die Felder sind heute reine Anzeigewerte (Strings wie `'−9,00'`, `'Sa'`,
> `'120 m'`). Für die echte App brauchen sie Typen (Geldbeträge, Zeitstempel, Geokoordinaten,
> Tage) — das ist Teil des Domänenmodell-Konzepts, nicht des Designs.

---

## 4. Design-System

### 4.1 Tokens (`festipal-tokens.css`) — vollständig und produktionsreif

- **Farb-Ramps:** Ink (kühle Neutraltöne, 12 Stufen), **Limette/Grün** `#74CC1F` (Primär),
  **Violett** `#5A4DFF` (Sekundär), Beere (Tertiär, nur Data-Viz), Status (amber/red/blue).
- **Semantische Aliases:** `--brand-primary`, `--surface-1..3`, `--text-primary/secondary/muted`,
  `--border-*`, `--fill-*`, `--status-*`. Dark-first; **Light-Scope** via `[data-theme="light"]`.
- **Festival-CI-Hooks:** Ein Festival überschreibt **nur vier Variablen** —
  `--ci-primary`, `--ci-secondary`, `--ci-tint`, `--ci-on-primary` (via `[data-festival="…"]`).
  → **Das ist der Whitelabel-/Multi-Tenant-Theminghebel im Design.**
- **Typografie:** Outfit (Display), Plus Jakarta Sans (Body), JetBrains Mono (Zahlen/Zeiten).
  Fertige Text-Rollen (`--text-display-1`, `--text-title-1..3`, `--text-body`, `--text-mono`, …).
- **Layout-Konstanten:** `--content-max: 430px`, `--screen-pad: 18px`, `--topbar-h: 56px`,
  `--nav-h: 64px`, `--hit-min: 44px`, Scroll-Bottom-Pad für die Floating-Nav.
- **Radii, Schatten, Motion** (Dauern + Easings, `prefers-reduced-motion`-Fallback).
- **Signatur „Liquid Glass"** (`.fp-glass`): Blur+Saturate-Backdrop, nur für **schwebende**
  Ebenen (Nav, Top-Bar, Sheet-Griffe, Karten-Overlays) — **nie** für statische Listen-Karten.

### 4.2 Komponenten-Inventar (`festipal-ds.js`) — 31 Komponenten

- **Core (13):** Avatar, Badge, Button, Card, EmptyState, Icon, IconButton, ListRow, Photo,
  Rating, Sheet, StatTile, Tag
- **Festival (13):** ActCard, ActivityCard, ArtistRow, BalanceCard, FestivalCard, FriendRow,
  NewsCard, SafeNowCard, SocialRow, StageStatusCard, SwapListingCard, TimetableSlot, VendorCard
- **Forms (4):** Checkbox, Input, SegmentedControl, Switch
- **Navigation (2):** FloatingNav, TopBar

**Bekannte Varianten (aus Nutzung):**
- `Button` — `variant`: primary | secondary | quiet | ghost | danger; `size`: sm | md;
  `icon`/`iconRight`, `fullWidth`, `disabled`
- `Card` — `tone`: default | brand | secondary; `padding`, `interactive`, `onClick`
- `Sheet` — Bottom-Sheet: `open`, `title`, `onClose`, `footer` (Aktionsleiste)
- `SegmentedControl`, `Tag` (selektierbar), `Switch`, `Input` (mit Icon) — die Filter-/Formbausteine

### 4.3 Icons

Lucide (`vendor/lucide.js`), on-demand gerendert. Genutzte Glyphen u. a.: home, tent, music-4,
users, settings, layout-dashboard, repeat-2, calendar-clock, map-pin, wallet, qr-code, bell,
bell-ring, shield-alert, ticket, search, plus, arrow-left/right, chevron-right, utensils.

---

## 5. Wiederkehrende Interaktionsmuster

Diese Muster tauchen quer über die Screens auf — sie definieren das „Gefühl" der App und
sollten als **gemeinsame Bausteine** (in `packages/ui` bzw. App-Komponenten) umgesetzt werden:

1. **Bottom-Sheet für Details & Aktionen** — Artist-Detail, Pin-Detail, Vendors, SafeNow-Notruf,
   Cashless (QR/Aufladen), Tausch-Detail + „Angebot erstellen", „Aktivität starten", „Einladen".
   Durchgängiges Muster: `Sheet` mit `title`, Body, `footer`-Aktion.
2. **Filterleisten** — `SegmentedControl` (harte Umschaltung) + horizontale `Tag`-Reihen
   (Mehrfach-Facetten wie Bühne, Genre, Angebotsart).
3. **Save/Follow/Join-Toggles** — optimistisch, lokal im State (Acts merken, Artists folgen,
   Aktivitäten beitreten, Anfragen annehmen).
4. **Horizontale Rails** — randbündige Scroll-Reihen (`Rail`) für Festival-/Act-/Featured-Karten.
5. **Social Proof über Freunde** — `FriendStack` (gestapelte Avatare) zeigt, welche Freunde
   einen Act gemerkt / eine Aktivität geplant haben. Zieht sich als Motiv durch Timetable, Dashboard, Crew.
6. **Leerzustände** — `EmptyState` mit Icon, Text und Reset-/CTA-Aktion überall konsequent.

---

## 6. Signatur-Features (über Standard-Festival-Apps hinaus)

Diese Punkte sind das Besondere am Entwurf und decken sich teils/teils nicht mit den bisherigen ADRs:

- **Tauschbörse** (Screen 10) — Camping-Plätze, Tickets, Verschenkt; „In der Nähe", Angebot
  erstellen. → deckt das ADR-Alleinstellungsmerkmal „Tauschbörse" ab.
- **Crew / Aktivitäten** (Screen 11) — Freunde vor Ort (Präsenz, Distanz), gemeinsame
  Aktivitäten mit Plätzen. → deckt „Aktivitäten / Freunde connecten" ab.
- **Cashless-Wallet** (Screen 12) — **natives** Guthaben, Aufladen (Apple Pay), Bezahl-QR,
  Buchungsliste. ⚠️ **Widerspruch zu ADR-011** (Cashless = eingebettete URL, nie Zahlungsdaten).
  → offener Punkt in `02-open-questions.md`.
- **SafeNow** (Sicherheit/Notruf) — Standort ans SafeNow-Team, nächster Sanitäter, Notfallkontakt.
  Im Code als **Design-Platzhalter** markiert. → **neues Domänenfeld**, in keiner ADR erfasst.
- **Festival-CI-Theming** — pro Event andere Marke über 4 CSS-Variablen. → stützt Multi-Tenancy/Whitelabel.
- **Artists festivalübergreifend folgen** + „Cashless auf 12 Festivals" (globale News) →
  impliziert **festivalübergreifende User-Daten** (Wallet? Artists?) — Spannung zur strikten
  Festival-Scope-Regel, siehe `02-open-questions.md`.

---

## 7. Was der Entwurf technisch *nicht* ist

Damit klar bleibt, was noch offen ist:

- **Keine echte Karte** — der Lageplan ist ein Schema aus farbigen Blöcken (Platzhalter für
  ein Vektor-Tileset; unsere ADR sagt MapLibre).
- **Kein echtes Cashless** — Guthaben/Transaktionen sind statische Beispieldaten.
- **Kein Backend, keine Typen, kein Offline** — alles ist In-Memory-`useState` auf Beispieldaten;
  Beträge/Zeiten/Distanzen sind vorformatierte Strings.
- **Kein Auth/Onboarding/Ticket-Flow** — der Einstieg in die App fehlt komplett.
- **Ein einziges Beispiel-Festival** („Nova Rise") — Mehr-Festival-/Mandanten-Realität ist nur angedeutet.

Diese Lücken sind **erwartbar** für einen ersten UI-Entwurf und definieren die Themen, die wir
im Konzept schließen — siehe `02-open-questions.md`.
