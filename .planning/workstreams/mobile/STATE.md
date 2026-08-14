---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Activities & Friends
current_phase: 09
current_phase_name: festival-navigation-shell
status: executing
stopped_at: "Completed 09-05-PLAN.md (Festival Friends tab real content, FRND-07; Task 2/3 human-checks deferred as WINDOWS.md unrun-verify entries #44/#45)"
last_updated: "2026-08-14T09:40:12.058Z"
last_activity: 2026-08-14
last_activity_desc: Phase 09 Plan 03 (five-tab festival navigator, layout D-10 gate, PlaceholderScreen) completed, incl. mid-plan device-bug fix
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 16
  completed_plans: 15
  percent: 33
---

# Project State — Workstream `mobile`

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-13 — nach Phase 8)

**Core value:** A festival visitor can get into the app, connect to their festival, and reach
everything about their festival experience from one home screen.

**Current focus:** Phase 09 — festival-navigation-shell
6 Phasen (7–12), Nummerierung laeuft aus v1.0 weiter. Phasen 7 und 8 sind durch.

> Die beiden Workstreams laufen **unabhaengig**. `admin` wird in einer eigenen, parallelen Session
> geplant und hat einen eigenen Milestone-Track — `mobile` wartet nicht auf `admin` und umgekehrt.
> Geteilte Kollisionszone bleibt `packages/{contracts,db,ui}`: nur ein Stream aendert sie zur Zeit.

## Current Position

Phase: 09 (festival-navigation-shell) — EXECUTING
Plan: 6 of 6
Status: Ready to execute (09-04 blocked on 09-03, unblocked; 09-03 done, device-verified after a mid-plan bugfix)
Last activity: 2026-08-14 — 09-03 completed (five-tab festival navigator, layout D-10 gate, PlaceholderScreen; Task 2 human-check still outstanding, WINDOWS #40)

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

**Phase 8 (Friends) — abgeschlossen 2026-08-13, UAT 8/8, `threats_open: 0`.** Die dauerhaft
bindenden Entscheidungen stehen in der Key-Decisions-Tabelle von `.planning/PROJECT.md`; hier bleibt,
was die naechsten Phasen konkret betrifft:

- **Der Scan-Screen ist die Vorlage fuer jede weitere native Faehigkeit:** Panel nur gemountet,
  solange sein Segment aktiv ist (Unmount statt Verstecken), Permission-Ask genau einmal pro Mount
  per `useRef`-Guard, und der Callback wird per **Prop-Identitaet** entwaffnet
  (`onBarcodeScanned={idle ? handler : undefined}`), nicht per Guard im Handler. Ein
  `useIsFocused`-Guard existiert bewusst nicht — es gibt derzeit keinen Pfad, der einen Screen ueber
  `/friends-qr` pusht. **Wer das aendert, muss den Teardown neu beweisen.**

- **`friend-detail` liest den Query-Cache, nicht das Netz** (Phase-7 D-04): es gibt keinen
  Fremdprofil-Detail-Endpunkt, und der Routen-Parameter ist ausschliesslich lokaler Lookup-Key.
  Gleiches Idiom wie `findCachedFestivalBySlug`.

- **`friend-sort.ts` nutzt das Capability-Probe-with-Cache-Muster** von `intl-capability.ts`; die
  Fallback-Diakritika-Tabelle ist direkt bewiesen, nicht nur ueber `sortFriendsByDisplayName`.

- **`qr-matrix.ts` bringt seinen eigenen UTF-8-Byte-Encoder mit** — der `stringToBytesFuncs['UTF-8']`-
  Hook von `qrcode-generator` fehlt im aufgeloesten ESM-Build. Bei einem Paket-Update pruefen.

- **D-03-Block-Swap** schaltet exakt drei Bloecke (quiks-Code-Karte, Requests, Crew); `isSearching`
  haengt am unmittelbaren Eingabetext, nicht am debounced Wert, damit der Moduswechsel dem Tippen
  folgt statt ihm nachzulaufen.

- **Paket-Legitimitaet ist ein manuelles Gate, solange `research: false` ist.** `qrcode-generator`
  und `expo-camera` wurden vor der Installation von Hand geprueft (Publisher, Repo, exakter Name,
  Abhaengigkeitsbaum); die Belege liegen als zwei `T-08-SC`-Eintraege in `08-SECURITY.md`. Jedes
  weitere neue Paket laeuft genauso.

- **Der native Rebuild ist ein Human-Checkpoint, kein Executor-Schritt** (Windows-Session):
  `npx expo run:android` aus `apps/mobile`, nie aus dem Repo-Root. FRND-04 wurde erst nach der
  Geraeteabnahme abgehakt.

- **Phase 09-01 (`home` -> `start` rename, NAV-03):** `ColdStartRedirect`'s discriminant was
  renamed `'home'` -> `'start'` alongside its href (D-19 hard rename, no second name for the same
  route). EN Lingui msgstr for the renamed msgid is "Start", not "Home" (D-20). No alias route was
  left behind (`grep -rn "'/home'" apps/mobile/app apps/mobile/lib` — zero matches). Device-verified
  by the user (2026-08-13): tab label, cold start with/without saved festival, deep link, repeated
  dev-client launches, non-dead-end back — all six checks passed, no Unmatched-Route regression.

- **Phase 09-02 (`GET /festivals/:festivalId/friends`, FRND-07, D-18):** the checkpoint (Einbahntür)
  was resolved by the user as `publish-as-specified` — `:festivalId` stays a UUID path param
  (consistent with `saveFestival`/`listTags`), the response is the wortgleiche `z.array(friendSchema)`
  `listFriends` already uses (no second schema), and the contract entry is now published: path and
  response shape are a breaking change plus client release from here on. `packages/contracts` is
  free again for the `admin` stream. `FriendshipService.listFriendsInFestival` extends the
  `listFriends` counterpart-join with exactly one more `innerJoin` on `myFestival`; both scopes
  (`callerId`, `festivalId`) sit INSIDE the join condition, and `myFestival` contributes zero
  columns to the select (ADR-014, no presence signal). No 404 branch for an unknown `festivalId`
  (T-09-07, accepted). SEC-02 proven at HTTP level in
  `apps/api/test/festival-friends-isolation.spec.ts` — the load-bearing case is the cross-tenant one
  (same two friends, different `festivalId`, different result). Full suite: 16 files / 140 tests
  green.

- **Phase 09-03 (Five-Tab Festival Navigator, NAV-01/NAV-02, D-01/D-10/D-12…D-14):** the festival
  navigator is a dedicated `Tabs` with a layout-level D-10 gate (`app/(festival)/f/[festivalSlug]/_layout.tsx`)
  that replaces the WHOLE area (no tab bar, no tab content) on 404/transport-error;
  `FloatingNav` is parametrized (`variant: 'global' | 'festival'`) instead of forked (D-01);
  `PlaceholderScreen` is the one shared honest empty state for Aktivitaeten/Timetable/Lageplan
  (D-12/D-13). **Mid-plan device bug (Rule 1 fix, `c16369f`):** the Dashboard tab went blank on
  tab re-entry because it re-queried the SAME `festivalKeys.detail(slug)` key the layout gate
  already subscribed to — two independent React Query observers of one key can transiently
  disagree on tab re-focus. Fixed by extracting the gate branching into a pure, unit-tested
  `lib/festival-gate.ts` (`resolveFestivalGateState`) and having tab screens read the layout's
  already-resolved festival via `lib/festival-context.ts` (`useFestivalContext()`) instead of
  re-querying it — the layout never unmounts across tab switches, so the context value can never
  desync. **Pattern for any future nested Tabs/Stack gated on an async resolution:** the gating
  layout owns the data and provides it via Context; children never re-derive it. Device-verified
  by the user (2026-08-14) across two rounds — round 1 found the bug, round 2 confirmed all 8
  checklist points including repeated tab-switch-and-return. Task 2's own `<human-check>`
  (icon/heading/body per placeholder, max font scale, EN locale) was deferred and NOT yet
  device-verified — tracked as `WINDOWS.md` #40. `friends.tsx` is a registered-route stub
  ("This tab isn't built yet.") until 09-05 (`WINDOWS.md` #41).

- [Phase ?]: AppHeader mounts once at the authenticated-tree root and decides its own visibility per route via resolveHeaderContext (pure, fail-closed default) — T-09-13's mitigation lives in the derivation function, not a mount-site condition.
- [Phase ?]: headerShown:false added explicitly on the profil/friends-qr root Stack.Screen registrations (app/_layout.tsx) ahead of Task 3's removal of their own header-options blocks, to prevent a blank native header reappearing above AppHeader; friend-detail is deliberately excluded (keeps its own modal header).
- [Phase ?]: Phase 09-05 (Festival Friends tab, FRND-07): friendKeys.inFestival(festivalId) is one shared query key read by both the Dashboard Crew StatTile and the Friends-tab list — one cache entry, one invalidation, so the two numbers can never disagree. Which of the two empty states shows is decided by the GLOBAL friend list's length (friendKeys.list), never the intersection's own length (D-17). friend-detail.tsx's cache read now also searches friendKeys.inFestival(*) entries, scope-filtered against friendKeys.requests/search to avoid false structural matches. app/friends-find.tsx re-exports the global Friends screen at a second push-over position (D-16) — one implementation, two navigation positions.

### Blockers/Concerns

- ~~**T-06-06 (BLOCKIEREND fuer das naechste Milestone)**~~ — **ERLEDIGT in Phase 07-01.** Die
  Projektion ist in `visitorProfileForeignSchema` (Basis, sechs Felder) und
  `visitorProfileOwnerSchema` (Basis + `birthDate`) getrennt, der erste Fremdprofil-Endpunkt
  (`GET /api/v1/visitors/:username`) liefert nachweislich nur die Fremd-View, und
  `apps/api/test/foreign-projection.spec.ts` belegt die Abwesenheit von Geburtsdatum und E-Mail am
  serialisierten Body.

- **FRND-09 ist ab jetzt eine echte Luecke, keine geplante mehr.** Mit Phase 8 ist die Faehigkeit
  live, dass Fremde dich per Username finden und anfragen — ohne Blockieren, Melden, Cooldown,
  Opt-out oder Rate-Limit. Das war eine bewusste Entscheidung (D-05/D-11/D-13), aber sie war bis
  gestern theoretisch. **Vor der ersten echten Nutzerkohorte einplanen.**

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

- **`gsd-tools requirements.mark-complete` funktioniert im Workstream-Layout nicht** (07-01, in Phase
  8 erneut bestaetigt): findet die Requirements in `.planning/workstreams/mobile/REQUIREMENTS.md`
  nicht (`not_found`, kein Write), und `phase.complete` meldet entsprechend
  `requirements_updated: false`. Beim Abschluss von Phase 7 **und** Phase 8 wurden Checkbox und
  Traceability-Zeile von Hand gesetzt (Phase 8: FRND-04, nach der Geraeteabnahme). Bei jedem
  weiteren Phasenabschluss dieses Workstreams selbst nachziehen, bis das Tool den Pfad aufloest.

- **`phase.complete` meldet SUMMARY-Dateipfade als „not on disk", die sehr wohl existieren** (Phase
  8, 21 Falschmeldungen): die SUMMARYs notieren Pfade relativ zu `apps/mobile`, der Checker loest
  sie gegen das Repo-Root auf. Ebenso zaehlt er ADR-Nummern als fehlende REQ-IDs in der
  Traceability-Tabelle. Beides ist Rauschen — nicht jedes Mal neu nachrecherchieren.

- **Kosmetisch, aus dem Phase-8-Security-Audit:** `app/friend-detail.tsx:134` uebergibt an `unfriend`
  den Routen-Parameter statt `friend.profile.accountId`. Hinter dem Exact-Match-Gate (`:126`)
  beweisbar identisch, aber der direkte Feldzugriff wuerde den Beweis ueberfluessig machen. Beim
  naechsten Anfassen der Datei mitnehmen.

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
| 260813-o08 | Friends-Tab UX-Feinschliff (Inline-Suche, kompakte Anfragen-Zeilen, QR-Label, Auto-Return) | 2026-08-13 | c0ca870 |

Verzeichnisse unter `.planning/quick/`.

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Phase 03 UAT | iOS-Geraeteverifikation der sechs Kernwert-Checks (echtes iPhone via `npx expo run:ios`, Mac + Apple-ID-Provisioning) — Android verifiziert, iOS-Toolchain nicht aufgesetzt | Deferred (user-approved) | 2026-08-04 |

## Session Continuity

Last session: 2026-08-14T09:40:12.036Z
Stopped at: Completed 09-05-PLAN.md (Festival Friends tab real content, FRND-07; Task 2/3 human-checks deferred as WINDOWS.md unrun-verify entries #44/#45)
Resume file: None

## Operator Next Steps

- `/gsd-execute-phase 9 --ws mobile` — weiter mit 09-04 (app-weiter `AppHeader`, blockiert auf 09-03, jetzt frei)
- Vor 09-04 optional: Task 2's ausstehenden Geraete-Human-Check aus 09-03 nachholen
  (`WINDOWS.md` #40 — Icon/Ueberschrift/Fliesstext je Platzhalter, maximale Systemschrift,
  EN-Locale) — nicht blockierend, aber offen.

- Fuer Phase 8 noch moeglich: `/gsd-ui-review 8 --ws mobile` (6-Saeulen-Audit der Friends-Screens)
- Offen aus v1.0: `/gsd-ui-review 06 --ws mobile`.

## Performance Metrics

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 07 P01 | 25min | 2 tasks | 14 files |
| Phase 07 P02 | 12min | 2 tasks | 5 files |
| Phase 07 P03 | 11min | 2 tasks | 5 files |
| Phase 07 P04 | 16min | 2 tasks | 6 files |
| Phase 07 P05 | 16min | 2 tasks | 2 files |
| Phase 08 P01 | 51min | 2 tasks | 8 files |
| Phase 08 P02 | 13min | 2 tasks | 3 files |
| Phase 08 P03 | 27min | 3 tasks | 7 files |
| Phase 08 P04 | 15min | 2 tasks | 12 files |
| Phase 08 P05 | ~14min | 2 tasks | 8 files |
| Phase 09 P01 | 29min | 2 tasks | 10 files |
| Phase 09 P02 | ~12min | 2 tasks | 4 files |
| Phase 09 P03 | ~55min (2 checkpoints) | 2 tasks | 16 files |
| Phase 09 P04 | ~50min | 3 tasks | 24 files |
| Phase 09 P05 | ~45min | 3 tasks | 12 files |
