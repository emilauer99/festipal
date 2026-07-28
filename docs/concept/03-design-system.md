# 03 — Design-System-Fundament (A3)

> **Zweck:** Das aus dem **festipal Brand Guide** (Juli 2026) + der Token-Datei abgeleitete,
> verbindliche Design- und Voice-Fundament. Basis für `packages/ui` und für die Content-Sprache.
> Verbindlichkeit: Prinzip 5 (Design-Treue). Entscheidungen als **ADR-015**. Stand: 2026-07-28.

---

## 1. Zwei Ebenen — und wie sie sich zu unseren Beschlüssen verhalten

Der Brand Guide ist unser **visuelles + sprachliches Fundament** und wird **vollständig übernommen**.
Er zeigt aber noch den ursprünglichen Design-Stand und kennt unsere Scope-Beschlüsse nicht. Wo es
sich reibt, gelten **unsere ADRs** — das ist kein Widerspruch, sondern zwei Ebenen (Optik/Sprache
vs. Feature-Scope):

| Brand Guide zeigt | Unser Beschluss (gilt) |
|---|---|
| Navigation mit „Meine Artists" | Artists raus im MVP (ADR-014) |
| `BalanceCard` (Cashless mit Bezahlen/Aufladen) | Kein natives Wallet, nur eingebetteter Link (ADR-011) |
| `SafeNowCard`, SafeNow in Settings | SafeNow zurückgestellt (B2) |

→ Übernommen wird das **ganze** Token-/Voice-/Layout-System; **nicht** gebaut werden im MVP die
Screens/Komponenten, die wir bewusst weggelassen haben (Wallet, Artists, SafeNow).

---

## 2. Farben & Tokens

- **Marke:** Limette `#74CC1F` (primär) · Violett `#5A4DFF` (sekundär). „Ink"-Neutraltöne sind
  **kühl/leicht blau** (nicht grau), damit beide Markentöne darin sitzen.
- **Volle Ramps** (100–900 je Marke, Ink 050–1000), Statusfarben (Erfolg/Warnung/Gefahr-Live/Info),
  Beere `#E8559F` nur für Data-Viz.
- **Nur semantische Aliase in Komponenten** (`--surface-card`, `--text-secondary`, `--border-subtle`).
  Rohe Rampenwerte (`--green-500`) stehen nur in Tokens/Specimen.
- **Dark-first.** Light-Mode existiert als Scope `[data-theme="light"]` (Tag/Print/Marketing) — die
  App ist dunkel.
- **Regeln:** Statusfarben immer als 16%-Tint hinter farbigem Text, nie als Vollfläche. Max. zwei
  Hintergrundtöne pro Screen (`--bg-app` + `--surface-card`).

## 3. Typografie

- **Outfit** (Display) · **Plus Jakarta Sans** (Body) · **JetBrains Mono** (Zahlen/Zeiten/IDs).
- Skala 44 / 34 / 26 / 21 / 17 / 15 / 13,5 / 12 / 10,5. Zeilenhöhe Fließtext 1.45, Display 1.06.
- Kleinste Größe 10,5px nur für Micro-Labels in Großbuchstaben (Eyebrow).
- **Alles Numerische in Mono** (Zeiten, Beträge, Entfernungen, Band-/Chip-IDs).

## 4. Layout, Flächen, Motion (Kurzregeln)

- 4er-Abstands-Skala (2·4·6·8·12·16·20·24·32·40·56·72). Feste Layout-Konstanten (`--content-max 430`,
  `--screen-pad 18`, `--topbar-h 56`, `--nav-h 64`, `--hit-min 44`, `--scroll-bottom-pad 104`).
- Radien: Bedienelemente/Chips = Pille, Karten 22, Innenblöcke 12–16, Sheets 28 oben.
  **Nichts ist eckig** außer den schematischen Lageplan-Blöcken.
- **Karten:** kein farbiger linker Rand, kein Gradient-Fill, kein Glas. Zustände ändern die
  **Randfarbe**, nicht die Füllung (Live-Act = rot getönter Rand).
- **Liquid Glass** nur für **schwebende** Ebenen über bewegtem Inhalt (Nav, Kopfzeile,
  Lageplan-Overlays, Countdown-Kapsel). **Nie** für Listen-Karten oder statische Panels.
- **Motion:** schnell/physisch; Standard-Ease `(.2,.8,.2,1)`, Feder `(.34,1.4,.5,1)` für Sheets/
  Segmented-Thumb/Switch. `prefers-reduced-motion` → alle Dauern 1ms. Press-Scale .965 (Karten .985).
- **Hintergründe** flach; wo Atmosphäre nötig (Live-Hero, Lageplan hinter Glas): zwei sehr weiche
  radiale Farbfelder (grün oben links, violett unten rechts, 10–18%) — der **einzige** erlaubte
  Gradient. Keine Mesh/Muster/Texturen/Grain.
- **Bottom-Sheet ist das einzige Modal-Muster** (kein Dialog/Toast/Tooltip/Tabs).

## 5. Voice & Tone — bindender Content-Style-Guide

Der Sprach-Teil des Brand Guides ist **verbindlich** und zugleich die Quelle unserer i18n-Basis-Strings
(koppelt an **ADR-012**):

- **Deutsch, immer Du-Form.** Nie „Sie". Festival-Lehnwörter erlaubt (Timetable, Cashless, Lineup,
  Crew, Stage, Camping) — das ist Festivalvokabular, keine zweite Sprache.
- **Ton:** „eine Freundin mit Plan, kein Betreiber" — kurze Sätze, Präsens, konkrete Zahlen; sag,
  was als Nächstes passiert, nicht was das System getan hat.
- Die App spricht **„du"** an und nennt sich **„wir"**, wenn sie etwas für dich tut. Nie „die App"/„das System".
- **Satz-Schreibweise überall.** GROSSBUCHSTABEN nur für den 10,5px-Eyebrow + das Wort LIVE.
- **Keine Emoji. Nie.** Max. ein „!" pro Screen.
- Zahlen/Formate: deutsches Komma (48,50 €), 24h-Zeiten (21:30), m/km, Gehzeiten in Min, relative
  Zeiten für News (vor 20 Min).
- Längen: Kartentitel ≤ 34 Zeichen, Fließtext ≤ 2 Zeilen (Karte) / ≤ 3 (Sheet), Buttons 1–3 Wörter,
  Empty States = eine Zeile „was fehlt" + eine Zeile „was tun".
- Navigations-Labels sind **stabil** (sie sind die Navigation).

> **Konsequenz:** i18n-Quellsprache = Deutsch (Du-Form) mit dieser Voice; Englisch/weitere Sprachen
> müssen Ton und Regeln übertragen. Numerische/Datums-Formate laufen über `Intl` (ADR-012), nicht
> hardcoded.

## 6. Ikonografie & Wortmarke

- **Icons:** Lucide (24er Raster, Strichstärke 2; 2,4 aktives Nav-Glyph; 1,75 dekorativ ≥28px).
  Alles über `<Icon name="…" />` — kein Inline-SVG, keine PNG-Icons, keine Unicode-als-Icon, keine
  Emoji. Icons erben `currentColor`. TikTok/Spotify → `music-2`/`audio-lines` (Platzhalter); echte
  Plattform-Marken in `assets/`.
- **Wortmarke:** `festipal.` als reine Schrift (Outfit 800, klein, −4% Laufweite, Punkt in
  `--brand-primary`). Auf Dunkel: weiße Schrift + grüner Punkt; auf Markenfarbe: dunkles Ink, Punkt
  50%. Nie andere Schrift, nie Großbuchstaben, nie Effekte.

## 7. Festival-Theming-Vertrag (ENTSCHIEDEN → ADR-015)

**Ein Festival darf anpassen:**
1. **Die 4 CI-Farbtokens:** `--ci-primary`, `--ci-secondary`, `--ci-tint`, `--ci-on-primary`.
   Jede Komponente liest diese → ein Festival-Theme ist im Kern ein kurzer Token-Scope.
2. **Ein optionales Festival-Logo** — erscheint in der Kopfzeile (statt/neben dem Namen), ggf. auf
   dem Dashboard. Fällt auf den Festival-**Namen als Text** zurück, wenn kein Logo hinterlegt ist.
3. **Den Festival-Namen** (Kopfzeile im Festival-Kontext).

**Ein Festival darf NICHT ändern:** Schrift, Layout/Abstände, Radien, Motion, Komponenten, die
festipal-Wortmarke-Systematik. → Wiedererkennbarkeit + Konsistenz + Barrierefreiheit bleiben garantiert.

**Folgen für Daten/Admin:**
- Festival-(Tenant-)Datensatz speichert: `ciPrimary`, `ciSecondary`, `ciTint`, `ciOnPrimary`,
  `logoAsset?`, `name`.
- **Kontrast-Validierung:** `--ci-on-primary` gegen `--ci-primary` muss WCAG-Kontrast erfüllen; der
  Admin prüft/erzwingt das beim Anlegen (kein unlesbares Theme).
- Fehlt ein CI-Wert → Fallback auf festipal-Basis (grün/violett). Fehlt das Logo → Name als Text.

## 8. Platzhalter & offene Punkte (aus Brand Guide S. 14)

Bewusst als **Ersetzungen** markiert — produktionsreife Defaults, sofort austauschbar:
1. **Schriften:** Outfit / Plus Jakarta Sans / JetBrains Mono (Google Fonts, **OFL** — frei
   ausliefer­bar, via `expo-font` gebündelt). Echte Markenschriften ersetzen sie 1:1.
2. **Icons:** Lucide. Eigenes Set = Ein-Datei-Tausch in `Icon`.
3. **Logo / Fotos:** keine geliefert. Wortmarke als Schrift; `Photo` fällt auf getönte
   Initialen-Kachel zurück; echtes Artwork füllt die Flächen ohne Codeänderung.
4. **Lageplan** = schematischer Block-Ersatz für ein **Vektor-Tileset** (unser Ziel: MapLibre, ADR-008).
5. **Bezahl-QR** ist dekoratives Raster (ohnehin obsolet — kein natives Cashless, ADR-011).

## 9. Portierung nach `packages/ui` (Ausblick, Detail in C8)

Der Brand Guide ist Web (CSS-Variablen + JSX). Für die App brauchen wir:
- **Tokens als TypeScript** (eine Quelle → Web *und* React Native), CI-Tokens als Theme-Context,
  der pro Festival gesetzt wird.
- **RN-Komponenten**, die den Specs folgen (Pille/Glas/Press/Ränder), Web-CSS als Referenz.
- **32 Komponenten** aus dem Inventar; im MVP ohne `BalanceCard` (entfällt), `SafeNowCard`,
  `ArtistRow`/Artist-bezogene (zurückgestellt).
- Gemeinsame Nutzung mit dem Next.js-Admin (dort kann das Web-CSS direkter greifen).

→ Die genaue Portierungs-Strategie (RN-Styling-Ansatz, Theme-Provider, Font-Loading) ist **C8** und
wird beim Scaffolding entschieden.
