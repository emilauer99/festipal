# CI-Quellextrakt — `docs/quiks_CI.html`

> **Zweck:** `docs/quiks_CI.html` ist ein Claude-Design-Bundle (695 KB, selbst-entpackend:
> gzip-Payload + JSON-Template). Agenten können es nicht direkt lesen. Diese Datei enthält den
> **wörtlich extrahierten Fließtext** des CI-Dokuments plus die aus dem eingebetteten Stylesheet
> gelesenen Rohwerte. Sie ist Arbeitsquelle für den Quick-Task 260810-q31, **nicht** das
> verbindliche Dokument — verbindlich wird `docs/brand/…` + ADR-023.
>
> Extraktion: `JSON.parse` des `<script type="__bundler/template">` (Zeile 394), danach
> Tag-Strip. Reproduzierbar, keine Interpretation.

---

## ⚠️ Wichtigste Fallstricke bei der Portierung

1. **Das im Bundle eingebettete Stylesheet ist das ALTE festipal-Design-System**, nicht das neue CI.
   Nachweis: es definiert weiterhin `--brand-primary: var(--green-500)` (Limette `#74CC1F`) und im
   Light-Scope `--bg-app: var(--ink-000)` = `#FFFFFF`. Das CI-Dokument fordert dagegen Beere
   `#E8559F` als Primärfarbe und Papier `#F7F5F2` als helle Fläche.
   → **Verbindlich ist der Dokumenttext unten, nicht das eingebettete CSS.** Ein 1:1-Port der
   CSS-Datei würde die alten Werte zementieren.
2. Aus dem eingebetteten CSS sind trotzdem zwei Rampen brauchbar, weil sie im alten DS bereits als
   „nur Data-Viz"-Serie existierten und jetzt zur Markenfarbe aufsteigen:
   `--dusk-300 #F79ACB` · `--dusk-500 #E8559F` · `--dusk-700 #B02D74` sowie
   `--amber-500 #FFC53D` · `--amber-700 #A97400`.
3. Ein **neues Token-File wurde nicht mitgeliefert.** Die Sollwerte für Flächen/Karten/Text/Glas
   stehen ausschließlich in der Modus-Tabelle des Dokuments (§05 unten).
4. Der aktuelle Code (`packages/ui/src/tokens.ts`) ist **dark-first ohne Light-Mode-Verdrahtung**:
   `lightColors` wird exportiert, aber in `apps/mobile` **nirgends** verwendet (0 Treffer für
   `lightColors`/`useColorScheme`). Das neue CI ist hell-first — der Modus-Umschalter existiert
   also noch gar nicht und ist echte Neuarbeit, kein Umfärben.
5. Positiv: In `apps/mobile` gibt es **keine hartcodierten Marken-Hex-Werte** (0 Treffer für
   `#74CC1F`/`#5A4DFF`/`#0C0E13`/`#E9ECF2` in `.ts`/`.tsx`); alle 123 Farbzugriffe laufen über
   `colors.*`. Der Farbwechsel hat damit genau eine Angriffsfläche: `packages/ui/src/tokens.ts`.

---

## Wörtlicher Dokumenttext

### Kopf

Corporate Identity · Version 1.0

**quiks.**

Die Festival-Buddy-App. Übersicht, Lageplan, Cashless, Timetable, Tauschbörse und Crew — schnell im
Namen, ruhig im Auftritt. Dieses Dokument hält Logo, Farben, Schrift, Ikonografie und Anwendung fest.

| Feld | Inhalt |
|---|---|
| Haltung | Ein Freund mit Plan — nicht der Veranstalter. |
| Sprache | Deutsch, immer Du-Form, Satzcase. |
| Look | Hell zuerst, viel Ruhe, ein warmer Akzent. |
| Basis | Festipal Design System, Sunset-Akzent. |

### 01 · Logo — Zeichen, Wortmarke, Lockup

Das Zeichen ist ein randbündiges kleines `q` im Sunset-Verlauf; der Punkt sitzt rechts daneben auf
der x-Höhe und ist der eigentliche Marker der Marke. Die Wortmarke ist Outfit 800, komplett klein,
−4 % Tracking, Punkt in Beere.

- **Primärzeichen** — App-Icon, Avatar, Favicon. Verlauf immer 150°, Amber oben links.
- **Wortmarke** — Standard für Header, Splash, Print. Nie in Versalien setzen.
- **Horizontales Lockup** — Abstand Zeichen↔Wort = halbe Zeichenbreite.
- **Gestapeltes Lockup** — Splash, Poster, quadratische Flächen.
- **Formvarianten** — Rund für Avatare und Social, eckig für Print und Merch.
- **Dunkel** — Auf Ink bleibt der Verlauf, das Wort wird hell.
- **Einfarbig** — Stick, Prägung, Ein-Farb-Druck: alles Weiß auf Vollton.
- **Mindestgrößen** — gezeigt bei 1024 / 180 / 40. Unter 24 px nur das Zeichen, nie das Lockup.

### 02 · Farbe — Sunset auf Ink

Beere ist die Primärfarbe und trägt Marke, Punkt und Hauptaktionen. Amber ist die Sekundärfarbe und
existiert vor allem als oberes Ende des Sunset-Verlaufs sowie für Hinweise. Limette und Violett
bleiben als Festival-CI-Hooks erhalten. Maximal zwei Flächentöne pro Screen.

| Rolle | Wert | Verwendung |
|---|---|---|
| Beere | `#E8559F` · `--brand-primary` | Marke, Punkt, Primäraktion. Text darauf weiß. |
| Amber | `#FFC53D` · `--brand-secondary` | Verlaufsstart, Hinweise, Live-Wärme. Text darauf Ink. |
| Sunset | 150° · `#FFC53D` → `#E8559F` | Der einzige erlaubte Verlauf. Nur Zeichen und Hero. |
| Ink | `#0C0E13` · `--ink-900` | Text im Hellmodus, Fläche im Dunkelmodus. |
| Papier · Standard | `#F7F5F2` | |
| Text hell | `#E9ECF2` | |
| Limette CI | `#74CC1F` | |
| Violett CI | `#5A4DFF` | |
| Live / Gefahr | `#FF4D5E` | |
| Info | `#5FB4FF` | |

### 03 · Typografie — Outfit, Plus Jakarta Sans, JetBrains Mono

| Rolle | Spezifikation | Musterzeile |
|---|---|---|
| Display | 44/800 | Heute drei Bühnen |
| Titel | 26/700 | Deine Crew ist am Zelt |
| Body | 15/400 | Nova Rise startet in zehn Minuten — sechs Minuten Fußweg. |
| Label | 13,5/700 | Guthaben aufladen |
| Mono | 15/500 | 21:30 · 48,50 € · 120 m |
| Micro | 10,5 caps | Guthaben · Nova Rise |

- **Outfit** — 800 für Marke und Display, 700 für Titel. Tracking −4 % bis −2 %.
- **Plus Jakarta Sans** — Alles Lesbare: 15 px Fließtext, Zeilenhöhe 1,45.
- **JetBrains Mono** — Zeiten, Beträge, Distanzen, IDs — nie ganze Sätze.

### 04 · Ikonografie & Bausteine — Lucide, Pillen, Glas

Outline-Icons mit 2 px Kontur auf 24er Raster, Farbe immer geerbt. Alles Tippbare ist eine volle
Pille, alles Schwebende ist Glas. Kartenradius 22 px, Innenblöcke 12–16 px.

- **Icon-Set** — Lucide 0.470, Strichstärke 2. Größen: 12–14 inline, 15–18 in Zeilen, 21 in der
  Navigation. Keine Emoji, keine gefüllten Glyphen.
- **Bausteine** — gezeigte Muster: Pillen („Los, fragen", „Später"), Chips („Gleich dran", „Live"),
  Glas-Leisten, Marker („Lena ist 120 m entfernt.").
- Glas nur für schwebende Ebenen: Top-Bar, Bottom-Nav, Kartenoverlays, Push.
  **Nie für eine Karte in der Liste.**

### 05 · Modi — Hell ist Standard, Dunkel ist die Nachtschicht

Die App startet hell: Papier `#F7F5F2` als Fläche, Ink als Text, Beere als einziger Akzent. Ab
Sonnenuntergang — oder per Systemeinstellung — kippt alles auf Ink. Marke, Verlauf und Beere bleiben
in beiden Modi identisch; nur Flächen, Text und Glas tauschen.

- **Hell · Standard** — `#F7F5F2` · `#0C0E13` · `#E8559F`. Karten sind Weiß auf Papier, Schatten
  sehr weich. Glas wird milchig statt dunkel.
- **Dunkel · Nacht** — `#0C0E13` · `#E9ECF2` · `#E8559F`. Nachts trägt Ink die Fläche, Karten sind
  6 % Weiß. Lageplan und Medien sind immer dunkel.

| Rolle | hell | dunkel |
|---|---|---|
| Fläche | `#F7F5F2` | `#0C0E13` |
| Karte | `#FFFFFF` | Weiß 6 % |
| Text | `#0C0E13` | `#E9ECF2` |
| Glas | Papier 78 % | Ink 62 % |

### 06 · Anwendung — Die Marke im Einsatz

Gezeigte Anwendungen: Splash · App-Header · Bändchen & Becher · Kampagne („Open Air · Fr–So",
„3 Bühnen · 1 Crew").

**So ja**

- Wortmarke immer klein, mit Punkt in Beere.
- Sunset-Verlauf nur im Zeichen und in Hero-Flächen.
- Maximal zwei Flächentöne pro Screen — Ink plus eine Karte.
- Zahlen, Zeiten und Distanzen in Mono.
- Freiraum um das Logo: mindestens die Höhe des Punktes ×3.

**So nicht**

- Kein QUIKS in Versalien, kein anderer Font.
- Kein zweiter Verlauf, kein Mesh, keine Textur.
- Den Punkt nicht weglassen und nicht einfärben wie das Wort.
- Kein Glas für statische Karten, kein Schlagschatten am Logo.
- Kein Dunkelmodus, der nur invertiert — Karten und Glas folgen der Tabelle.
- Keine Emoji, kein Ausrufezeichen-Stapel, kein „Sie".

---

## Reibungspunkte mit dem bestehenden Stand (für ADR-023)

| Thema | Bisher (ADR-015 / `03-design-system.md` / `tokens.ts`) | Neu laut CI v1.0 |
|---|---|---|
| Primärfarbe | Limette `#74CC1F` | Beere `#E8559F` |
| Sekundärfarbe | Violett `#5A4DFF` | Amber `#FFC53D` |
| Beere | „nur für Data-Viz" | Markenfarbe |
| Standardmodus | dark-first (`colors` = dunkel, `lightColors` ungenutzt) | hell-first, Dunkel = Nachtschicht |
| Helle Fläche | `#FFFFFF` | Papier `#F7F5F2` |
| Dunkle Karte | `#14161D` | Weiß 6 % auf Ink |
| Verlauf | „zwei weiche radiale Felder, grün/violett" als einziger erlaubter Gradient | Sunset 150° Amber→Beere als **einziger** Verlauf, nur Zeichen + Hero |
| Wortmarke | `festipal.` | `quiks.` (Punkt in Beere) |
| Limette/Violett | Markenfarben | nur noch Default-Fallback der 4 Festival-CI-Tokens |
| Titel-Größe | 21 (`title2`) / 34 (`display2`) | Display 44/800, Titel 26/700 |
| Label | 12/600 | 13,5/700 |
