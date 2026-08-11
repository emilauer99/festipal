# quiks — Corporate Identity v1.0

> **Zweck:** Verbindliche Rendition der quiks Corporate Identity Version 1.0 (Logo, Farbe,
> Typografie, Ikonografie, Modi, Anwendung) plus das Token-Mapping in `packages/ui/src/tokens.ts`.
> **Quelle:** `docs/quiks_CI.html` (Claude-Design-Bundle) — Text hier ist die wörtliche, verbindliche
> Übernahme. **Stand:** 2026-08-10. **Verbindlichkeit:** Prinzip 5 (Design-Treue).
> **Entscheidung:** ADR-023.

---

## 1. Haltung, Sprache, Look

| Feld | Inhalt |
|---|---|
| Haltung | Ein Freund mit Plan — nicht der Veranstalter. |
| Sprache | Deutsch, immer Du-Form, Satzcase. |
| Look | Hell zuerst, viel Ruhe, ein warmer Akzent. |
| Basis | Bestehendes Design-System plus Sunset-Akzent. |

---

## 2. Logo — Zeichen, Wortmarke, Lockup

Das Zeichen ist ein randbündiges kleines `q` im Sunset-Verlauf; der Punkt sitzt rechts daneben auf
der x-Höhe und ist der eigentliche Marker der Marke.

- **Primärzeichen** — App-Icon, Avatar, Favicon. Verlauf immer 150°, Amber oben links.
- **Wortmarke** — Standard für Header, Splash, Print. Nie in Versalien setzen.
- **Horizontales Lockup** — Abstand Zeichen↔Wort = halbe Zeichenbreite.
- **Gestapeltes Lockup** — Splash, Poster, quadratische Flächen.
- **Formvarianten** — Rund für Avatare und Social, eckig für Print und Merch.
- **Dunkel** — Auf Ink bleibt der Verlauf, das Wort wird hell.
- **Einfarbig** — Stick, Prägung, Ein-Farb-Druck: alles Weiß auf Vollton.
- **Mindestgrößen** — gezeigt bei 1024 / 180 / 40. Unter 24 px nur das Zeichen, nie das Lockup.

**Wortmarken-Spezifikation:** `quiks.` — Outfit 800, komplett klein, −4 % Tracking, Punkt in Beere,
nie in Versalien.

**Freiraum-Regel:** Mindestens die Höhe des Punktes ×3 rund um das Logo.

---

## 3. Farbe

Beere ist die Primärfarbe und trägt Marke, Punkt und Hauptaktionen. Amber ist die Sekundärfarbe und
existiert vor allem als oberes Ende des Sunset-Verlaufs sowie für Hinweise. Limette und Violett
bleiben als Festival-CI-Hooks erhalten.

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

**Regeln:**
- Sunset ist der einzige erlaubte Verlauf (nur Zeichen + Hero).
- Maximal zwei Flächentöne pro Screen.

---

## 4. Typografie

Outfit, Plus Jakarta Sans, JetBrains Mono.

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
- **JetBrains Mono** — Zeiten, Beträge, Distanzen, IDs — nie für ganze Sätze.

---

## 5. Ikonografie & Bausteine

Outline-Icons mit 2 px Kontur auf 24er Raster, Farbe immer geerbt. Alles Tippbare ist eine volle
Pille, alles Schwebende ist Glas. Kartenradius 22 px, Innenblöcke 12–16 px.

- **Icon-Set** — Lucide 0.470, Strichstärke 2. Größen: 12–14 inline, 15–18 in Zeilen, 21 in der
  Navigation. Keine Emoji, keine gefüllten Glyphen.
- **Bausteine** — Pille, Chip, Glas, Marker.
- Glas nur für schwebende Ebenen — nie für eine Karte in der Liste.

---

## 6. Modi — hell ist Standard

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

---

## 7. Anwendung — So ja / So nicht

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

## 8. Token-Mapping

Ziel-Token-Spalte nennt die REALEN Rollennamen aus `packages/ui/src/tokens.ts` (`colors` /
`lightColors`). Jeder abgeleitete Wert (nicht wörtlich im CI-Dokument belegt) trägt den Hinweis
„abgeleitet — im Token-Phase zu bestätigen".

| CI-Rolle | Wert | Ziel-Token in `packages/ui/src/tokens.ts` | Modus | Status |
|---|---|---|---|---|
| Beere | `#E8559F` | `primary` | beide | direkt aus CI §3 |
| Beere-Press | `#B02D74` | `primaryPress` | beide | abgeleitet aus der Dusk-Rampe (`--dusk-700`) — im Token-Phase zu bestätigen |
| Text auf Beere | `#FFFFFF` | `primaryForeground` / `textOnPrimary` | beide | direkt aus CI („Text darauf weiß") |
| Amber | `#FFC53D` | `secondary` | beide | direkt aus CI §3 |
| Amber-Press | `#A97400` | `secondaryPress` | beide | abgeleitet (`--amber-700`) — im Token-Phase zu bestätigen |
| Text auf Amber | `#0C0E13` (Ink) | *(kein eigenes Token heute — neu zu benennen)* | beide | direkt aus CI („Text darauf Ink") |
| Papier | `#F7F5F2` | `bgApp` | hell | direkt aus CI §6 |
| Ink | `#0C0E13` | `bgApp` | dunkel | direkt aus CI §6 |
| Karte hell | `#FFFFFF` | `surfaceCard` | hell | direkt aus CI §6 |
| Karte dunkel | Weiß 6 % | `surfaceCard` | dunkel | abgeleitet als `rgba(255,255,255,.06)` — im Token-Phase zu bestätigen |
| Text hell | `#0C0E13` | `textPrimary` | hell | direkt aus CI §6 |
| Text dunkel | `#E9ECF2` | `textPrimary` | dunkel | direkt aus CI §6 |
| Glas hell | Papier 78 % | `glassFill` | hell | abgeleitet als `rgba(247,245,242,.78)` — im Token-Phase zu bestätigen |
| Glas dunkel | Ink 62 % | `glassFill` | dunkel | abgeleitet als `rgba(12,14,19,.62)` — im Token-Phase zu bestätigen |
| Live / Gefahr | `#FF4D5E` | `danger` | beide | unverändert (bereits identisch in `tokens.ts`) |
| Info | `#5FB4FF` | `info` | beide | unverändert (bereits identisch in `tokens.ts`) |
| Limette CI | `#74CC1F` | Default-Fallback der Festival-CI-Tokens (`--ci-primary` o. ä., ADR-015 §3) | beide | reiner Default-Fallback, keine Markenfarbe mehr |
| Violett CI | `#5A4DFF` | Default-Fallback der Festival-CI-Tokens (`--ci-secondary` o. ä., ADR-015 §3) | beide | reiner Default-Fallback, keine Markenfarbe mehr |
| Sunset-Verlauf | 150° `#FFC53D` → `#E8559F` | *(kein Token vorhanden)* | beide | **neues Token nötig** — heute gibt es in `tokens.ts` keinen Gradient-Wert |

---

## 9. Offene Punkte für die Umsetzung

Alle vier Punkte sind Arbeit einer eigenen Folgephase, **nicht** Teil dieser Dokumentationsaufgabe:

a. **Light-Mode ist heute NICHT verdrahtet.** `lightColors` wird aus `packages/ui/src/tokens.ts`
   exportiert, aber in `apps/mobile` nirgends verwendet (0 Treffer für `lightColors`/
   `useColorScheme`). Hell-first ist echte Neuarbeit, kein Umfärben.
b. Für den Sunset-Verlauf fehlen Token und RN-Umsetzungsweg. Die Entscheidung, wie er in React
   Native realisiert wird (z. B. `expo-linear-gradient`), gehört in die Folgephase — hier nicht
   entschieden.
c. Press-/Tint-Werte für Beere und Amber sind nicht im CI belegt (siehe „abgeleitet"-Markierungen
   oben).
d. Die Typo-Rollen weichen vom CI ab — u. a. `label` (heute 12/600 in `tokens.ts` vs. 13,5/700 im
   CI) und die Titel-Skala (heute `title2` 21/600, `display2` 34/700 vs. CI Display 44/800, Titel
   26/700).

---

## 10. Was hier NICHT geändert wird

Diese Dokumentationsaufgabe (D-02) ändert **keine** Token-, App-Config- oder Quellcode-Datei —
weder `packages/ui/src/tokens.ts` noch `apps/mobile/app.json` noch irgendeine `package.json` oder
`docker-compose.yml`. Die Umsetzung (Token-Swap, Light-Mode, Sunset-Gradient, Rename) erfolgt in
einer eigenen, späteren Phase.
