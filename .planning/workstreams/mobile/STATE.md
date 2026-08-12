---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Activities & Friends
current_phase: 07
current_phase_name: profile-visibility-friendship-backend
status: executing
stopped_at: Completed 07-01-PLAN.md
last_updated: "2026-08-12T15:27:07.412Z"
last_activity: 2026-08-12
last_activity_desc: Milestone v1.1 aufgesetzt (Requirements + Roadmap)
progress:
  total_phases: 6
  completed_phases: 0
  total_plans: 5
  completed_plans: 1
  percent: 0
---

# Project State — Workstream `mobile`

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-12 — v1.0 milestone close)

**Core value:** A festival visitor can get into the app, connect to their festival, and reach
everything about their festival experience from one home screen.

**Current focus:** Phase 07 — profile-visibility-friendship-backend
6 Phasen (7–12), Nummerierung laeuft aus v1.0 weiter. Naechster Schritt: Phase 7.

> Die beiden Workstreams laufen **unabhaengig**. `admin` wird in einer eigenen, parallelen Session
> geplant und hat einen eigenen Milestone-Track — `mobile` wartet nicht auf `admin` und umgekehrt.
> Geteilte Kollisionszone bleibt `packages/{contracts,db,ui}`: nur ein Stream aendert sie zur Zeit.

## Current Position

Phase: 07 (profile-visibility-friendship-backend) — EXECUTING
Plan: 2 of 5
Status: Ready to execute
Last activity: 2026-08-12 — Phase 07 execution started

## Shipped

| Milestone | Phasen | Plaene | Stand |
|---|---|---|---|
| v1.0 Rollout — Visitor Shell | 7 | 50 | ✅ geshippt 2026-08-12 (PRs #4–#13, `main` = `44e7914`) |
| v1.1 Activities & Friends | 6 geplant | — | 🚧 Phasen 7–12, 20 Requirements |

Details: [`MILESTONES.md`](./MILESTONES.md) · Archiv: `milestones/v1.0-*` ·
Per-Plan-Metriken: [`milestones/v1.0-METRICS.md`](./milestones/v1.0-METRICS.md)

## Accumulated Context

### Decisions

Die 50 Plan-Entscheidungen der v1.0 sind in den jeweiligen `*-SUMMARY.md` unter
`milestones/v1.0-phases/` archiviert; die architektonisch dauerhaften stehen in der
Key-Decisions-Tabelle von `.planning/PROJECT.md`. Hier bleibt ab jetzt nur, was das **naechste**
Milestone bindet:

- **v1.1 = Activities + Friends** (User, 2026-08-12). Die Content-Trias (Timetable/Lageplan/News)
  wurde bewusst dahinter gestellt. Der User hat bei allen drei Scope-Fragen die **maximale**
  Variante gewaehlt: Lobby-Chat IST drin (WS+Redis), Freunde-Finden ueber Handle **und**
  Username-Suche **und** QR, und die **volle** 5-Tab-Festival-Navigation statt nur eines
  Aktivitaeten-Screens. Die Groessenbedenken wurden genannt und verworfen — nicht neu aufmachen.

- **Blockieren/Melden (FRND-09) ist bewusst NICHT in v1.1.** v1.1 ist die erste Version, in der
  Fremde dich anfragen und per Username finden koennen — ohne jede Moeglichkeit, das zu
  unterbinden. Vor der ersten echten Nutzerkohorte einplanen.

- **Research bleibt aus**, ausser fuer **Phase 12** (WS-Gateway + Redis) — dort einschalten.
- **Kollisionszone mit `admin`:** Admin baut den globalen Activity-Tag-Katalog und die
  Tag-Aktivierung (ADR-018) gegen dieselben Tabellen wie Phase 10. Schema einmal abstimmen, aus
  EINEM Stream landen, der andere bleibt additiv.

- **Tab-Route wird `home` → `start` umbenannt** (User, 2026-08-12). Vor neuen Routen erledigen —
  der Deep-Link-Capture-Pfad haengt mit dran.

- **Hell-first bleibt invariant:** nur der exakte Geraetewert `dark` ergibt Dunkel. Der
  Theme-Override aus 06-03 liegt als Schicht *darueber*, der 05.1-Invariantentest bleibt das Gate.

- **Eintritt ist gate-less (ADR-014).** Isolation ist Daten-Scoping, kein 403 — bei jeder neuen
  tenant-scoped Tabelle neu zu beweisen, nicht als Zugriffsgate zu bauen.

- **Die beiden Einbahntüren der Phase 7 sind zu (Phase 07-01, User: `confirm-both`).** `gender` ist
  Teil der veröffentlichten Fremd-View — Entfernen wäre ab jetzt ein Breaking Change am Contract
  plus Client-Release, und IDN-02 ist die Stelle, an der eine Policy dafür greift. `friend_request`
  bekommt keine `status`-Spalte: Annehmen/Ablehnen/Zurückziehen löschen die Zeile, es gibt keine
  Historie und höchstens eine Request-Zeile pro Personenpaar.

- **Die Fremd-View ist die Basis, die Owner-View ihre einzige benannte Erweiterung** (Phase 07-01).
  Beide sind aus `visitorProfileSelectSchema` gepickt. Folge: eine neue `visitor_profile`-Spalte
  erscheint per Konstruktion in KEINER der beiden Sichten, bis jemand sie explizit pickt.

- **T-06-06 ist getilgt** (Phase 07-01). `visitorProfilePublicSchema` existiert nicht mehr — der Name
  suggerierte Fremd-Sicherheit und trug trotzdem das Geburtsdatum. Beide Vorbehaltskommentare
  (`packages/contracts/src/schemas.ts`, `packages/db/src/schema/visitor-profile.ts`) sind auf den
  erledigten Stand gebracht.

### Blockers/Concerns

- ~~**T-06-06 (BLOCKIEREND fuer das naechste Milestone)**~~ — **ERLEDIGT in Phase 07-01.** Die
  Projektion ist in `visitorProfileForeignSchema` (Basis, sechs Felder) und
  `visitorProfileOwnerSchema` (Basis + `birthDate`) getrennt, der erste Fremdprofil-Endpunkt
  (`GET /api/v1/visitors/:username`) liefert nachweislich nur die Fremd-View, und
  `apps/api/test/foreign-projection.spec.ts` belegt die Abwesenheit von Geburtsdatum und E-Mail am
  serialisierten Body.

- **IDN-02 haengt an Birgits Konzept** (Sichtbarkeit pro Feld, Altersgrenze, Flinta-Filter,
  Signup-Disclaimer). Betrifft dieselbe Flaeche wie das erledigte T-06-06 — der Split loest die
  *Projektions*frage, nicht die *Policy*frage. Mit D-02 ist `gender` bewusst vorab veroeffentlicht;
  die Fremd-View ist die Stelle, an der IDN-02 spaeter greift.

- **SEC-02 ist eine vererbte Pflicht:** festival-scoped Reads sind `festivalId`-isoliert
  (Baseline: `apps/api/test/festival-isolation.spec.ts`). Der Cross-Tenant-Test ist bei **jeder**
  neuen tenant-scoped Tabelle neu zu ziehen.

- **Kein RN-Component-Test-Harness in `apps/mobile`.** Der Vitest-Runner ist node-env und deckt nur
  reine `lib/`-Logik. Jede Screen-Wahrheit haengt an On-Device-UAT — das ist die strukturelle
  Verifikationsgrenze dieses Projekts, keine Nachlaessigkeit.

- **iOS ist seit Phase 3 unverifiziert** (kein Mac/Xcode). Android ist durchgaengig abgenommen.
- **`/gsd-ui-review 06` ist nie gelaufen** — der visuelle 6-Saeulen-Audit der drei Phase-6-Screens.
- **`.planning/WINDOWS.md` hat 26 offene Eintraege**, ueberwiegend veraltete `unrun-verify`-Punkte
  aus Phase 5, die die Phase-5/6-UATs faktisch abgedeckt haben. Der Ledger ueberzeichnet die
  Schuld; Gate ist aus (`windows_enforce: false`). Braucht einen Abgleich.

- **LOW (aus 06-10-REVIEW):** `lib/__tests__/intl-polyfill.test.ts` matcht Quelltext als String
  inklusive Kommentaren und zaehlt die Imports in `index.js` nicht — faengt weder einen
  auskommentierten noch einen zusaetzlich eingeschleusten Import. Der Fix selbst ist
  geraeteverifiziert und davon unberuehrt. Haerten, wenn der Entry das naechste Mal angefasst wird.

- 07-01: gsd-tools requirements.mark-complete findet VIS-01/VIS-02 in .planning/workstreams/mobile/REQUIREMENTS.md nicht (not_found, kein Write) — Workstream-Pfadaufloesung oder Abschnittsheading pruefen, bevor Phase 7 abgeschlossen wird

### Pending Todos

None.

### Quick Tasks Completed

| # | Description | Date | Commit |
|---|-------------|------|--------|
| 260803-mz6 | ADR-022 UI-Komponentenstrategie in docs verankert | 2026-08-03 | 56456a5 |
| 260805-lkr | Keyboard-Scroll-Fix auf den Phase-4-Eingabescreens | 2026-08-05 | 8935d34 |
| 260810-q31 | Rebrand festipal → quiks + CI v1.0 in docs/ (ADR-023/024) | 2026-08-10 | b898985 |
| 260811-jz6 | Phase-05.1-Verifikationsluecken geschlossen (Outfit-Tracking) | 2026-08-11 | e28d150 |
| 260812-ctx | GSD-Overhead gesenkt (.claude/CLAUDE.md 25.3→8.7 KB, Gates auf Opt-in) | 2026-08-12 | c6366ac |

Verzeichnisse unter `.planning/quick/`.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Phase 03 UAT | iOS-Geraeteverifikation der sechs Kernwert-Checks (echtes iPhone via `npx expo run:ios`, Mac + Apple-ID-Provisioning) — Android verifiziert, iOS-Toolchain nicht aufgesetzt | Deferred (user-approved) | 2026-08-04 |

## Session Continuity

Last session: 2026-08-12T15:25:26.094Z
Stopped at: Completed 07-01-PLAN.md
Resume file: None

## Operator Next Steps

- `/gsd-discuss-phase 7 --ws mobile` — Kontext fuer die Sichtbarkeits-/Freundschafts-Backendphase
- Alternativ direkt: `/gsd-plan-phase 7 --ws mobile`

## Performance Metrics

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 07 P01 | 25min | 2 tasks | 14 files |
