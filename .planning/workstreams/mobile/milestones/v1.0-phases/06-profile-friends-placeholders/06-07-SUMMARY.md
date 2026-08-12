---
phase: 06-profile-friends-placeholders
plan: 07
subsystem: ui
tags: [react-native, react-native-svg, gradient, lingui, plural, tanstack-query, brand, adr]

# Dependency graph
requires:
  - phase: 06-profile-friends-placeholders
    plan: 01
    provides: "app/profil.tsx als Root-Push-Screen mit /me-Abfrage, Lade-, Fehler- und Retry-Zweig"
  - phase: 06-profile-friends-placeholders
    plan: 02
    provides: "meSchema.createdAt sowie pronoun/birthDate/gender als nullable Felder in visitorProfilePublicSchema"
  - phase: 06-profile-friends-placeholders
    plan: 03
    provides: "deriveAge(), buildIdentityLine(), buildProfileMetaLine(), createdAtYear() als reine lib-Bausteine"
  - phase: 06-profile-friends-placeholders
    plan: 04
    provides: "ListRow (Muster A/B), useSoonToast() als einziger kommt-bald-Mechanismus"
  - phase: 05.1-quiks-rename-ci-v1-0-rollout
    provides: "createStyles(colors)/useTheme() hell-first, fontFamilyForRole, typeRoles inkl. Tracking-Gate, gradientSunset-Token"
  - phase: 05-festival-selection-home
    provides: "FestivalCard SunsetLayer als Gradient-Konstruktion, ComingSoonTile als Platzhalter-Kachel, festivalKeys.mine"
provides:
  - "AvatarSunsetRing — kreisförmiger Sunset-Ring um beliebige Avatar-Kinder, rein dekorativ"
  - "ADR-023 mit erweiterter Sunset-Flächenliste (Avatar-/Identitätsflächen), app-weit gültig"
  - "Vollständiger Profil-Screen: Kopfbereich, Konto-Sektion und vier gedämpfte Ausblick-Blöcke"
  - "ComingSoonTile mit optionaler columns-Prop (2 oder 3 Spalten)"
  - "AVATAR_SIZE als Export aus AvatarTile"
affects: [06-09]

tech-stack:
  added: []
  patterns:
    - "Gradient-Ring: react-native-svg Circle mit Defs/LinearGradient/Stop aus dem gradientSunset-Token, Instanz-eigene Gradient-ID über useId()"
    - "Zählangaben über das Lingui-Pluralmakro aus @lingui/core/macro, auch bei konstanten Werten"
    - "Cache-Lesen statt Zweitabruf: queryClient.getQueryData(festivalKeys.mine) mit Status- und Shape-Prüfung"

key-files:
  created:
    - apps/mobile/components/AvatarSunsetRing.tsx
  modified:
    - apps/mobile/app/profil.tsx
    - apps/mobile/components/AvatarTile.tsx
    - apps/mobile/components/ComingSoonTile.tsx
    - CLAUDE.md
    - docs/DEVELOPMENT_DECISIONS.md
    - docs/brand/quiks-ci-v1.md

decisions:
  - "D-07 als Regeländerung umgesetzt: die Sunset-Flächenliste wurde in ADR-023, im Markendokument (3 Fundstellen) und in der Wurzel-CLAUDE.md generell um Avatar-/Identitätsflächen erweitert — keine Einzelfallausnahme"
  - "Ringgeometrie nach CSS-Semantik des Designs: der -4px-Versatz misst gegen die BERANDETE Avatarbox, also Ring = 88 + 2×3 (Spalt) + 2×4 (Versatz) = 102px; die wörtliche Lesart (88+8) hätte einen 1px-Haarstrich ergeben"
  - "Reihenfolge im Kopfbereich folgt dem Design (Name, Handle, Identitätszeile, Meta-Zeile) statt der Aufzählung im Plan"
  - "Vibe-Block ohne Künstler-Chips: ein einzelner Chip nennt den Verbindungszustand; die Design-Zusage „du entscheidest, was Freunde sehen\" wurde bewusst NICHT übernommen"
  - "Stat-Kacheln ohne Zahlen: ComingSoonTile trägt Icon, Label und Badge — ein gerenderter Zahlenwert hätte wie ein Messwert gelesen"

metrics:
  duration: ~35min
  completed: 2026-08-12

actuals:
  tokens: 27000
  tasks: 2
  commits: 2

status: complete
---

# Phase 6 Plan 07: Profil-Screen & Sunset-Ring Summary

Der Profil-Screen steht im vollen Design-Aufbau — mit einem Sunset-geringten Avatar, dessen
Markenregel vorher app-weit nachgezogen wurde, statt sie still zu umgehen.

## Was gebaut wurde

**Task 1 — Regel zuerst, dann Ring** (`79e55b9`)

Die Reihenfolge war Auftrag: erst die Regel, dann die Fläche, die sie braucht.

- `docs/DEVELOPMENT_DECISIONS.md` — ADR-023 Punkt 3 nennt jetzt „Zeichen, Hero-Flächen sowie
  Avatar- und Identitätsflächen"; darunter steht ein eigener Absatz **„Änderung (2026-08-12,
  Phase 6 / D-07)"** mit Grund, Umfang und den nachgezogenen Fundstellen. Unangetastet bleibt,
  dass Sunset der EINZIGE erlaubte Verlauf ist.
- `docs/brand/quiks-ci-v1.md` — **alle drei** Stellen, die die Regel formulieren, wurden erweitert
  (Erhebung siehe unten), plus ein Nachtrag-Kasten unter den Regeln in §3.
- `CLAUDE.md` (Wurzel) — die Kurzfassung in §„Brand & Design" nennt jetzt ebenfalls
  Avatar-/Identitätsflächen und widerspricht der geänderten ADR-023 damit nicht mehr.
  `.claude/CLAUDE.md` blieb wie vorgesehen unangetastet: es behauptet nur die Einzigkeit des
  Verlaufs, keine Flächenbeschränkung, und ist weiterhin zutreffend.
- `apps/mobile/components/AvatarSunsetRing.tsx` — neu. Die Gradient-Konstruktion ist strukturell
  aus der Sunset-Schicht der Festival-Karte übernommen (gleiche Token-Quelle, gleiche
  `Defs`/`LinearGradient`/`Stop`-Elemente, gleiche Vektor- und Stop-Werte); ersetzt wurde allein
  das Rechteck durch einen Kreis. Rein dekorativ: `pointerEvents="none"` auf der SVG-Schicht, keine
  Barrierefreiheits-Rolle, keine eigenen Farbwerte.

**Fundstellen-Erhebung im Markendokument (vorher → nachher):**

| Zeile | Formuliert die Regel | nennt Avatar-/Identitätsflächen vorher | nachher |
|---|---|---|---|
| Farbtabelle §3 | ja | nein | ja |
| Regel-Aufzählung §3 | ja | nein | ja |
| „So ja"-Liste §7 | ja | nein | ja |

3 von 3 regelformulierenden Zeilen erweitert — es bleibt keine Fundstelle übrig, die Sunset noch
auf Zeichen und Hero begrenzt.

**Task 2 — der Screen** (`f3b24d7`)

- **Kopfbereich:** Avatar (gerätelokales Foto, sonst Initialen) im Sunset-Ring; Anzeigename in
  `title2` inklusive Tracking derselben Rolle; Handle mit Klammeraffen in der Mono-Rolle
  `countdown` in Markenfarbe; beide einzeilig mit Abschneiden am Ende. Darunter die Identitätszeile
  aus `buildIdentityLine` und die Meta-Zeile aus `buildProfileMetaLine`.
- **Meta-Zeile:** Die Festivals-Zahl kommt über `queryClient.getQueryData(festivalKeys.mine)` aus
  dem bestehenden Cache — Status **und** Array-Form werden geprüft, ein veralteter Eintrag ist ein
  Fehlschlag und kein Absturz. Es gibt in dieser Datei keinen zweiten Abruf der eigenen Festivals.
  Beide Zählangaben laufen durch `plural()` aus `@lingui/core/macro`, das Jahr über `createdAtYear`.
- **Konto-Sektion (Muster B):** Name, Handle und E-Mail mit voller Deckkraft, echten Werten und
  Chevron; ein Tap öffnet den gemeinsamen Hinweis. Fehlt ein Wert, entfällt der Wert-Slot (kein
  Platzhalterstrich); die drei Zeilen rendern unabhängig voneinander.
- **Vier Ausblick-Blöcke (Muster A):** Adden-Code-Karte mit Platzhalter-Marke und
  Handle-teilen-Knopf · Socials (Instagram/TikTok/Spotify, **ohne** Werte) · Vibe · drei
  Stat-Kacheln. Jeder Block ist auf Deckkraft 0,45 gedämpft und trägt ein statisches Bald-Badge.

## Bewusste Abweichungen vom Plan

### 1. Reihenfolge im Kopfbereich — Design statt Plan-Aufzählung

**Gefunden bei:** Task 2. Der Plan listet die Reihenfolge „Avatar, Identitätszeile, Anzeigename,
Handle, Meta-Zeile" (übernommen aus der Aufzählung im §Meta Line Contract der UI-SPEC). Das
bindende Design — sowohl `quiks-screens.template.html` Z. 1778–1781 als auch die gerenderte
`11-profil.png` — ordnet die Textspalte anders: **Anzeigename, Handle, Identitätszeile,
Meta-Zeile**.

**Umgesetzt:** die Design-Reihenfolge. Grund: Design-Treue ist ein nicht verhandelbares
Architekturprinzip der Wurzel-`CLAUDE.md` (Prinzip 5), und die must-have-Wahrheit zu UI-SPEC #12
bindet den Kopfbereich ausdrücklich „an das Design". Die Prosa der UI-SPEC-Aufzählung ist an dieser
Stelle in sich unstimmig („renders, in order, on a single line" über einen vierzeiligen Block), das
Design ist eindeutig. Eine Identitätszeile ÜBER dem Namen hätte zudem gelesen, als beschreibe sie
jemand anderen.

**Datei:** `apps/mobile/app/profil.tsx` · **Commit:** `f3b24d7`

### 2. Ringgeometrie — 102px statt 96px

**Gefunden bei:** Task 1. Plan und UI-SPEC nennen zwei Maße, die sich wörtlich gelesen
widersprechen: „Ringdurchmesser = Avatargröße + 8px" **und** „3px Spalt zwischen Ring und Avatar".
Bei 88 + 8 = 96 und 3px Spalt bliebe genau 1px sichtbarer Verlauf — ein Haarstrich, während der
Plan im selben Absatz betont, der Spalt sei „der Punkt", der die Fläche als RING lesbar macht.

**Umgesetzt:** die CSS-Semantik des Designs. Dort misst `inset:-4px` gegen die **berandete** Box
(`border:3px` liegt bei content-box-Sizing außerhalb des Avatars), also
`88 + 2×3 + 2×4 = 102px`. Beide Aussagen des Plans gelten damit gleichzeitig: 3px Spalt, 4px
Versatz je Seite. Die Herleitung steht als Konstanten `RING_GAP`/`RING_INSET` samt Kommentar in
der Datei, damit ein Reviewer die Rechnung nicht rekonstruieren muss.

**Datei:** `apps/mobile/components/AvatarSunsetRing.tsx` · **Commit:** `79e55b9`

### 3. [Rule 3 — blockierend] `AVATAR_SIZE` aus `AvatarTile` exportiert

Der Ring muss seine Geometrie aus der Avatargröße ableiten. Die Konstante war modul-privat; eine
`88` im Ring wäre eine zweite Quelle, die beim nächsten Größenwechsel stehen bliebe und den Ring
außermittig setzt. Additiver Export, keine Verhaltensänderung.

**Datei:** `apps/mobile/components/AvatarTile.tsx` · **Commit:** `79e55b9`

### 4. [Rule 3 — blockierend] `ComingSoonTile` bekommt eine `columns`-Prop

Der Plan verlangt, „die Spaltenbreite von zwei auf drei Spalten" anzupassen. Die Kachel hatte
`flexBasis: '48%'` fest verdrahtet und wird vom Festival-Screen mit **vier** Kacheln in zwei
Spalten genutzt — ein globaler Wechsel auf 31% hätte dieses bestehende Raster zerlegt. Statt der
Datei-weiten Änderung eine optionale `columns`-Prop (`2` als Default, `3` für die Stat-Reihe);
sonst ist die Kachel unverändert. Die Datei stand nicht in der `files`-Liste des Plans.

**Datei:** `apps/mobile/components/ComingSoonTile.tsx` · **Commit:** `f3b24d7`

### 5. Icons: `Camera` statt `Instagram`, `Mail` statt `message-circle`

`lucide-react-native` 0.470 führt **keine** Marken-Glyphen mehr — `instagram` existiert im Paket
nicht (geprüft im `dist/esm/icons`-Verzeichnis). Für die Socials-Zeile steht daher `Camera`, das
neutral bleibt und keine fremde Wortbildmarke ausliefert. Für die E-Mail-Zeile zeichnet das Design
`message-circle`; umgesetzt ist `Mail`, weil eine Sprechblase neben „E-Mail" die Zeile als Chat
auszeichnet. Icon-Auswahl je Zeile ist in 06-CONTEXT ausdrücklich Claude's Discretion.

**Datei:** `apps/mobile/app/profil.tsx` · **Commit:** `f3b24d7`

### 6. Vibe-Copy: die Sichtbarkeits-Zusage des Designs wurde nicht übernommen

Der Designtext lautet „Pronomen, Alter, Identität und Vibe sind optional — du entscheidest, was
Freunde sehen." Der zweite Halbsatz verspricht eine Sichtbarkeits-Policy, die es nicht gibt
(IDN-02 ist an Birgits Konzept vertagt, und `06-02` verzeichnet die fehlende Policy als bewusst
getragenes Restrisiko T-06-06). Übernommen wurde der optional-Teil, ersetzt der Versprechensteil:
„…— your favourite artists show up here once Spotify is connected." D-14 erlaubt genau das: der
Ton ist Richtung, nicht Wortlaut.

**Datei:** `apps/mobile/app/profil.tsx` · **Commit:** `f3b24d7`

## Befund zu den Gradient-Guard-Tests (ausdrücklicher Auftrag)

**Es wurde kein Test gelockert, weil es keinen zu lockern gab.** Der einzige gradientbezogene
Testblock (`apps/mobile/lib/__tests__/theme.test.ts`) prüft die **Werte** des Sunset-Tokens —
Winkel, Vektor, Stops, Modus-Invarianz — nicht seine Verwendungsorte. Er ist im Diff dieses Plans
unverändert und läuft grün. Einen Test, der Sunset auf Zeichen und Hero **einschränkt**, gibt es im
Repo nicht; D-07 hatte deshalb keinen automatisierten Blocker, und genau darum war die
Doku-Änderung hier ein eigener Auftrag. Ein späterer Reviewer sucht also vergeblich nach einem
geänderten Gate.

Der Tracking-Guard (`type-tracking.test.ts`) bleibt erfüllt: `profil.tsx` setzt die Größe der
getrackten Rolle `title2` genau einmal und an derselben Stelle deren `letterSpacing`.

## Was NICHT gerendert wird (ausdrücklich geprüft)

- **Keine erfundenen Künstlernamen.** Der Vibe-Block enthält kein Artist-Array. Die Chip-Reihe
  trägt einen einzigen Chip, der den Verbindungszustand nennt („Not connected"), damit die Reihe
  ihren Umbruch-Vertrag behält, ohne eine Musik-Verknüpfung zu suggerieren.
- **Keine Beispiel-Social-Konten.** Die drei Socials-Zeilen rendern Label, Icon und Badge — der
  Wert-Slot fehlt ganz. Sie haben keinen Press-Handler, also weder Chevron noch Button-Rolle.
- **Keine Zahlenwerte auf den Stat-Kacheln.** Das Design zeigt 3 / 12 / 6; umgesetzt sind
  wertlose `ComingSoonTile`s. „Acts gemerkt" hat kein Feature dahinter, und eine gerenderte Zahl
  hätte wie ein Messwert gelesen.
- **Kein Platzhalterpersonen-Array**, keine Beispielhandles, kein Upload- oder Sicherungshinweis
  beim Avatar (D-05): nach einer Neuinstallation stehen dort Initialen, und die Oberfläche
  behauptet nichts anderes.

## Verifikation

| Prüfung | Ergebnis |
|---|---|
| `pnpm --filter @quiks/mobile lint` | grün |
| `pnpm --filter @quiks/mobile typecheck` | grün |
| `pnpm --filter @quiks/mobile test` | 17 Dateien / 188 Tests grün (inkl. Tracking-Guard und Sunset-Token-Block) |
| `grep -q 'gradientSunset' AvatarSunsetRing.tsx` | 0 |
| `grep -nE '#[0-9a-fA-F]{3,8}' AvatarSunsetRing.tsx` | kein Treffer |
| `grep -q 'pointerEvents="none"' AvatarSunsetRing.tsx` | 0 |
| Kreis-Primitiv statt Rechteck | `<Circle>` aus `react-native-svg` |
| `grep -i 'sunset' CLAUDE.md \| grep -vi 'avatar'` | leer — jede Sunset-Zeile nennt die Avatarflächen |
| `grep -niq 'avatar' docs/brand/quiks-ci-v1.md` | 0 |
| `grep -q 'AvatarSunsetRing\|festivalKeys\|plural(\|buildIdentityLine\|deriveAge' profil.tsx` | alle 0 |
| `grep -c 'numberOfLines={1}' profil.tsx` | 2 |
| `grep -nE '#[0-9a-fA-F]{3,8}\|fontWeight: *[0-9]' profil.tsx` | kein Treffer |
| zweiter Abruf der eigenen Festivals | keiner — `listMyFestivals` kommt in der Datei nicht vor |
| Lingui-Pluralmakro löst unter diesem Build auf | über `babel-preset-expo` + `@lingui/babel-plugin-lingui-macro` transformiert; Ausgabe enthält `{festivalCount, plural, one {# Festival} other {# Festivals}}` und `{friendCount, plural, …}`, der Makro-Import ist wegkompiliert |

**Was diese Verifikation NICHT beweist:** Der Vitest-Runner läuft in einer Node-Umgebung und
rendert keine React-Native-Komponenten. Über das Aussehen des Rings, die tatsächliche Dämpfung der
Ausblick-Blöcke, die Lesbarkeit der Meta-Zeile auf kleinen Geräten und das Verhalten im Dunkelmodus
sagt er nichts. Das gehört in die Geräte-Abnahme am Phasenende.

## Known Stubs

Alles hier ist eine **bewusste, in D-02/D-06 beschlossene** Platzhalterfläche, keine vergessene
Verkabelung — deshalb gedämpft und badge-markiert statt weggelassen:

| Fläche | Datei | Aufgelöst durch |
|---|---|---|
| Adden-Code-Karte: Marke ist ein festes 3×3-Muster, „Handle teilen" öffnet nur den Hinweis | `apps/mobile/app/profil.tsx` | FRND-02 |
| Socials-Zeilen ohne Werte und ohne Ziel | `apps/mobile/app/profil.tsx` | PROF-02 |
| Vibe-Block ohne Spotify-Anbindung | `apps/mobile/app/profil.tsx` | eigener Milestone |
| Drei Stat-Kacheln ohne Werte | `apps/mobile/app/profil.tsx` | Artists-Feature (Acts) bzw. FRND-02 (Friends) |
| Konto-Zeilen ohne Bearbeitungspfad | `apps/mobile/app/profil.tsx` | PROF-02 |

## Offene Punkte für den nächsten Plan

- **06-09** muss die neuen Katalogeinträge extrahieren und übersetzen. Neu hinzugekommen sind unter
  anderem die beiden Plural-Nachrichten (`{festivalCount, plural, …}`, `{friendCount, plural, …}`),
  `member since {year}`, `Your code for adding`, `Scanning is enough — no searching, no typing.`,
  `Share handle`, `Sharing your handle is coming soon.`, `Editing is coming soon.`, `Socials`,
  `Vibe · synced from Spotify`, `Not connected`, `Saved acts` und die zugehörigen
  Screenreader-Sätze. **„Friends" bleibt in beiden Katalogen unübersetzt** (Markenwort des
  Designs) — das betrifft sowohl die Stat-Kachel als auch die Plural-Form der Meta-Zeile.
- Die Plattformnamen Instagram / TikTok / Spotify stehen als unübersetzte Eigennamen im Code,
  analog zur Wortmarke; sie gehören NICHT in den Katalog.

## Self-Check: PASSED

- `apps/mobile/components/AvatarSunsetRing.tsx` — vorhanden
- `apps/mobile/app/profil.tsx` — vorhanden
- `.planning/workstreams/mobile/phases/06-profile-friends-placeholders/06-07-SUMMARY.md` — vorhanden
- Commit `79e55b9` — vorhanden
- Commit `f3b24d7` — vorhanden
