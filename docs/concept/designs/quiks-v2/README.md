# quiks Screen Designs v2 (Claude Design, 2026-08-11)

Überarbeitete Screen-Designs des Designers, in CI v1.0 (ADR-023). Sie lösen
`docs/concept/designs/festival/` als **North-Star für die App-Screens** ab —
das ältere `festival/`-Set bleibt als Historie und als Token-/Komponenten-Referenz
liegen (`festipal-ds.js`, `festipal-tokens.css`).

## Dateien

| Datei | Was |
|---|---|
| `../../../quiks_screen_designs.html` | **Original-Lieferung** (gebündelter Claude-Design-Export, 763 KB, eine einzige JSON-escapte Zeile — im Browser öffnen, nicht lesen) |
| `quiks-screens.template.html` | **Lesbare Extraktion** der Template-Ebene aus dem Bundle (Markup + Copy + Token-Verwendung aller 13 Screens). Für Agenten und Reviews die maßgebliche Textquelle. |
| `11-profil.png` | Screenshot des Profil-Screens, wie vom User geliefert (war `img.png` im Repo-Root) |

Die Extraktion enthält **nicht**: die eingebetteten Font-/Bild-Assets (Base64) und
die Datenbindungen (`{{ … }}`-Ausdrücke werden im Design-Runtime aufgelöst, die
Mock-Daten liegen nicht im Bundle).

## Screen-Index

Screens sind im Template über `data-screen-label` und einen `sc-if`-Block je Screen
markiert. Zeilennummern beziehen sich auf `quiks-screens.template.html`.

| Label | `sc-if` | Zeilen | Rolle |
|---|---|---|---|
| `01 Start` | `scHome` | 1385–1414 | Globaler Tab 1 |
| `02 Festivals` | `scFest` | 1416–1433 | Globaler Tab 2 |
| `03 Friends` | `scFriends` | 1435–1491 | Globaler Tab 3 |
| `04 Mehr` | `scMehr` | 1493–1528 | Globaler Tab 4 |
| `05 Live` | `scLive` | 1530–1587 | In-Festival |
| `06 Aktivitäten` | `scAkt` | 1589–1639 | In-Festival |
| `06b Crew` | `scCrew` | 1641–1668 | In-Festival |
| `07 Timetable` | `scTime` | 1670–1702 | In-Festival |
| `08 Karte` | `scMap` | 1704–1735 | In-Festival |
| `09 Cashless` | `scCash` | 1737–1758 | In-Festival |
| `10 News` | `scNews` | 1760–1771 | In-Festival |
| `11 Profil` | `scProfil` | 1773–1819 | Push-Screen (aus `04 Mehr` → Konto → Profil) |
| `12 Aktivität erstellen` | `scCreate` | 1821–1845 | Push-Screen |

**Globale Tab-Leiste:** `Start · Festivals · Friends · Mehr` (`FloatingNav`, Zeile 1849).
Profil ist **kein** Tab, sondern ein Push-Screen hinter „Mehr".

## Umsetzungsstand

Nur ein Teil davon ist beauftragt. Was in **Phase 6** (mobile) gebaut wird und in
welchem Zustand, steht in
`.planning/workstreams/mobile/phases/06-profile-friends-placeholders/06-CONTEXT.md`.
Alles Übrige ist North-Star für spätere Phasen — insbesondere Live, Aktivitäten,
Crew, Timetable, Karte, Cashless und News.
