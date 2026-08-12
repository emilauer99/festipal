---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Activities & Friends
current_phase: 8
current_phase_name: Friends
status: planning
stopped_at: Phase 07 abgeschlossen (UAT 3/3, Verifikation passed) — Phase 8 bereit zur Planung
last_updated: "2026-08-12T19:10:00.000Z"
last_activity: 2026-08-12
last_activity_desc: Phase 07 verifiziert und abgeschlossen (VIS-01/VIS-02 validiert, T-06-06 getilgt)
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 5
  completed_plans: 5
  percent: 17
---

# Project State — Workstream `mobile`

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-12 — nach Phase 7)

**Core value:** A festival visitor can get into the app, connect to their festival, and reach
everything about their festival experience from one home screen.

**Current focus:** Phase 8 — Friends (UI auf dem Phase-7-Backend)
6 Phasen (7–12), Nummerierung laeuft aus v1.0 weiter. Phase 7 ist durch.

> Die beiden Workstreams laufen **unabhaengig**. `admin` wird in einer eigenen, parallelen Session
> geplant und hat einen eigenen Milestone-Track — `mobile` wartet nicht auf `admin` und umgekehrt.
> Geteilte Kollisionszone bleibt `packages/{contracts,db,ui}`: nur ein Stream aendert sie zur Zeit.

## Current Position

Phase: 8 — Friends
Plan: Not started
Status: Ready to plan
Last activity: 2026-08-12 — Phase 07 complete, transitioned to Phase 8

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

- **Die Fremd-View ist die Basis, die Owner-View ihre einzige benannte Erweiterung** (07-01).
  Beide aus `visitorProfileSelectSchema` gepickt — eine neue `visitor_profile`-Spalte erscheint
  per Konstruktion in KEINER Sicht, bis jemand sie explizit pickt. **T-06-06 ist damit getilgt**;
  `visitorProfilePublicSchema` existiert nicht mehr.

- **Die Fremd-View hat ZWEI Orte, und das ist Absicht** (07-01/07-04): `foreignProfileColumns`
  liest sie, `pickForeignProfile` formt sie. Eine Abfrage, die zu viel liest, leckt durch jeden
  durchreichenden Handler; ein Handler, der die Feldnamen erneut aufzählt, driftet ab, ohne dass
  ein Endpunkt kaputt aussieht. Alle vier D-04-Zugriffspfade laufen darüber.

- **Die Relationsauflösung existiert genau einmal** (07-02). `resolveRelations(callerId, ids)`
  löst einen Trefferblock in zwei Abfragen auf; `resolveRelation` ist nur Delegator. Neue
  Zugriffspfade rufen sie auf, statt `friend_request`-Zeilen selbst zu interpretieren.
  Die 2-Zeichen-Untergrenze der Suche ist Service-Invariante, **nicht** Vertrag — `q` bleibt
  unbeschränktes `z.string()`.

- **Die `23505` auf `friend_request_pair_pk` IST der Auto-Accept-Auslöser** (07-03), kein
  Fehlerfall: das Reverse-Direction-Rennen ist im Schema aufgelöst statt in App-Logik (D-10),
  belegt durch eine 25-Runden-Gegenprobe. `sealFriendship` ist der EINE Schreibpfad
  „Anfrage → Freundschaft". Fehler-Diskriminierung läuft über `postgresErrorOf` (Cause-Chain-
  Walker), nicht `err.cause` — Transaktionsfehler reisen durch den postgres.js-`begin()`-Wrapper.

- **Freundschafts-Symmetrie ist Join-Konstruktion, nicht Applikationslogik** (07-04): dieselbe
  Zeile erscheint bei beiden Beteiligten, ein einzelnes DELETE entfreundet beide Seiten. Anfragen
  partitionieren allein über `requesterId` — dieselbe Zeile ist einmal `outgoing`, einmal `incoming`.

- **VIS-02 ist als Invariante kodiert, nicht als Roh-Zählung von Aufrufstellen** (07-05): genau ein
  `foreignProfileColumns`, genau ein `pickForeignProfile`, die vier Identitätsspalten in genau
  einer Datei. Beide Beweis-Specs sind per eingebautem echten Verstoss als **nicht-vakuum** belegt
  (zweite Projektion, Owner-Feld-Leak, DM-Route). SEC-02 ist für Phase 7 durch den umgekehrten
  Nachweis erfüllt — keine tenant-gescopete Tabelle, dafür `information_schema`-Beleg plus
  Festival-Unabhängigkeit der Freundschaft.

- **VIS-01 ist zusätzlich am laufenden System belegt** (UAT 2026-08-12): drei echte Accounts,
  A fragt B an, B lehnt ab — danach ist A's Sicht auf B feldgleich mit A's Sicht auf einem nie
  kontaktierten C (200/200, `relation` beidseitig `none`, gleiche Feldnamen, leere Anfragelisten).
  `decline`/`withdraw`/`unfriend` antworten immer `200 {"result":"removed"}`, auch ohne existierende
  Anfrage. Skript-Muster für Wiederholung: OTP-Codes aus **Mailpit** (`localhost:8025`) lesen, nicht
  aus `.otp-dev-transport.local.json` — der Dev-Transport ist lokal nicht aktiv.

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

- **`gsd-tools requirements.mark-complete` funktioniert im Workstream-Layout nicht** (07-01, weiterhin
  offen): findet VIS-01/VIS-02 in `.planning/workstreams/mobile/REQUIREMENTS.md` nicht (`not_found`,
  kein Write), und `phase.complete` meldet entsprechend `requirements_updated: false`. Beim
  Phase-7-Abschluss wurden Checkbox und Traceability-Zeile **von Hand** gesetzt. Bei jedem weiteren
  Phasenabschluss dieses Workstreams selbst nachziehen, bis das Tool den Pfad aufloest.
- **Testkommando:** `pnpm --filter @quiks/api test -- <name>` filtert NICHT (fuehrt die Gesamtsuite
  aus), steht aber unveraendert in den verify-Bloecken von 07-03 bis 07-05. Korrekt ist
  `cd apps/api && pnpm exec vitest run test/<spec>.spec.ts`.
- **Akzeptanzkriterien nicht als rohe grep-Zaehlung formulieren** — vier Faelle in Folge in Phase 7
  (07-02 `inArray`, 07-03 `db.transaction`, 07-04 `from(visitorProfile)`, 07-05 Aufrufstellen), in
  denen die Zaehlung dem eigenen Aktionstext widersprach. Invariante formulieren, nicht zaehlen.
- **`visitor_profile.socialsVisibility`** (Enum `everyone|friends`, Default `friends`) ist das einzige
  Sichtbarkeits-Vokabular im Code, das keine echte Kontrolle ist: Reserved Field aus D-03, kein
  Endpunkt liest oder schreibt es, in keiner der beiden Projektionen. Im Phase-7-UAT dem User
  vorgelegt und als unschaedlich abgenommen (betrifft Social-Links, nicht Auffindbarkeit).
  Wird IDN-02 mitentscheiden.

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

Last session: 2026-08-12T19:10:00.000Z
Stopped at: Phase 07 abgeschlossen (UAT 3/3, Verifikation `passed`, Security 0 offene Threats) — bereit fuer Phase 8
Resume file: None

## Operator Next Steps

- `/gsd-discuss-phase 8 --ws mobile` — Kontext fuer die Friends-UI auf dem Phase-7-Backend
- Alternativ direkt: `/gsd-plan-phase 8 --ws mobile`
- Offen aus v1.0: `/gsd-ui-review 06 --ws mobile`, Tab-Rename `home` → `start` (vor neuen Routen)

## Performance Metrics

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 07 P01 | 25min | 2 tasks | 14 files |
| Phase 07 P02 | 12min | 2 tasks | 5 files |
| Phase 07 P03 | 11min | 2 tasks | 5 files |
| Phase 07 P04 | 16min | 2 tasks | 6 files |
| Phase 07 P05 | 16min | 2 tasks | 2 files |
