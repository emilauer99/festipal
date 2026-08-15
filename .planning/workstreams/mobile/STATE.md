---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Activities & Friends
current_phase: 11
current_phase_name: Activities
status: "Phase 10 shipped — PR #17"
stopped_at: Phase 10 verified + secured (UAT 3/3, threats_open 0) — ready to ship
last_updated: "2026-08-15T09:44:34.337Z"
last_activity: 2026-08-15
progress:
  total_phases: 6
  completed_phases: 4
  total_plans: 22
  completed_plans: 22
  percent: 67
last_activity_desc: Phase 10 complete (UAT 3/3, SECURITY 32/32 closed), transitioned to Phase 11
---

# Project State — Workstream `mobile`

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-15 — nach Phase 10)

**Core value:** A festival visitor can get into the app, connect to their festival, and reach
everything about their festival experience from one home screen.

**Current focus:** Phase 11 — Activities (UI)
6 Phasen (7–12), Nummerierung laeuft aus v1.0 weiter. Phasen 7–9 sind durch.

> Die beiden Workstreams laufen **unabhaengig**. `admin` wird in einer eigenen, parallelen Session
> geplant und hat einen eigenen Milestone-Track — `mobile` wartet nicht auf `admin` und umgekehrt.
> Geteilte Kollisionszone bleibt `packages/{contracts,db,ui}`: nur ein Stream aendert sie zur Zeit.

## Current Position

Phase: 11 — Activities
Plan: Not started
Status: Phase 10 shipped — PR #17
Last activity: 2026-08-15

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

**Phase 9 (Festival Navigation Shell) — abgeschlossen 2026-08-15, UAT R1 6/8 + R2 3/3 am Geraet,
`threats_open: 0` (32/32, `09-SECURITY.md`), alle acht Phase-9-`WINDOWS.md`-Eintraege (#40, #42–#48)
gegen die beiden UAT-Runden geschlossen.** Die dauerhaft bindenden Entscheidungen stehen in der
Key-Decisions-Tabelle von `.planning/PROJECT.md`; die Plan-Details darunter bleiben, weil die
Phasen 10–12 direkt auf ihnen aufbauen:

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
  (icon/heading/body per placeholder, max font scale, EN locale) was later covered by Phase-UAT
  Runde 1 Test 1 — `WINDOWS.md` #40 ist geschlossen. `friends.tsx` stub was replaced in 09-05
  (`WINDOWS.md` #41 fixed).

- **Phase 09-04 (AppHeader):** AppHeader mounts once at the authenticated-tree root and decides its
  own visibility per route via `resolveHeaderContext` (pure, fail-closed default) — T-09-13's
  mitigation lives in the derivation function, not a mount-site condition. `headerShown:false` was
  added explicitly on the profil/friends-qr root `Stack.Screen` registrations (`app/_layout.tsx`)
  to prevent a blank native header reappearing above AppHeader; friend-detail is deliberately
  excluded (keeps its own modal header).

- **Phase 09-05 (Festival Friends tab, FRND-07):** `friendKeys.inFestival(festivalId)` is one shared
  query key read by both the Dashboard Crew StatTile and the Friends-tab list — one cache entry, one
  invalidation, so the two numbers can never disagree. Which of the two empty states shows is
  decided by the GLOBAL friend list's length (`friendKeys.list`), never the intersection's own
  length (D-17). `friend-detail.tsx`'s cache read now also searches `friendKeys.inFestival(*)`
  entries, scope-filtered against `friendKeys.requests`/`search` to avoid false structural matches.
  `app/friends-find.tsx` re-exports the global Friends screen at a second push-over position (D-16)
  — one implementation, two navigation positions.

- **Phase 09-06 (Cashless):** ships as ADR-011 allows — hard-omitted tile unless
  `festival.cashlessUrl` resolves via `resolveCashlessTarget` (HTTPS-only, non-empty host),
  full-bleed WebView locked to its own origin via `originWhitelist` + `onShouldStartLoadWithRequest`
  (two independent locks), no `injectedJavaScript`/`onMessage`. `react-native-webview@13.16.1`
  cleared through the manual package-legitimacy gate (T-09-SC) with registry.npmjs.org evidence
  verified by the orchestrator before install.

- **Phase 09-07 (Gap Closure G-09-2/G-09-7):** Header default moved to the navigator
  (`screenOptions`), not per-`Stack.Screen` — the same forgotten-option bug had recurred three times
  in phase 09. Crew is a NEW msgid at `FloatingNav.tsx`'s festival variant, never a msgstr rewrite
  of the shared Friends entry (profil.tsx/AppHeader.tsx/global tab keep Friends). The ADR-014
  Crew-as-UI-label prohibition was amended via a dated 2026-08-14 change note (not rewritten) — the
  underlying data class/friend-graph rule stays explicitly in force. Kein statischer Live-Punkt am
  Live-Tab; er kommt erst mit einem echten Live-Signal (Deferred Follow-Up in `09-UAT.md`).

**Phase 10 (Activities Backend) — abgeschlossen 2026-08-15, UAT 3/3 (drei Prohibitions),
`threats_open: 0` (32/32, `10-SECURITY.md`, L1-Short-Circuit).** Die dauerhaft bindenden
Entscheidungen (DB-entschiedene Kapazität, zusammengesetzter Tenant-FK, SEC-03 als stehende Gates)
stehen in der Key-Decisions-Tabelle von `.planning/PROJECT.md`; hier bleibt, was die Phasen 11–12
direkt bindet:

- **10-01:** Nullable `activity_tag.festivalId` wird von ZWEI partiellen Unique-Indexen bewacht
  (globaler vs. per-Festival-Slug-Scope) — ein einfaches `unique(festivalId, slug)` ließe zwei
  NULL-Zeilen kollisionfrei durch. Drop- und Create-Migrationen in zwei getrennten
  drizzle-kit-Läufen generieren, sonst hängt der interaktive Rename-Prompt einen autonomen Executor.

- **10-02:** `activity.tagId` ist `onDelete: restrict`, nicht `set null` — eine titellose Aktivität
  hängt am Tag für den Auto-Titel; Löschen eines benutzten Tags schlägt laut fehl statt
  `activity_title_or_tag_chk` still zu verletzen. Constraint-Namen kollisionsfrei benannt
  (`activity_capacity_positive_chk` ≠ `activity_capacity_full_chk`).

- **10-03:** Kapazitätsrennen im `BEFORE INSERT`-Trigger mit `SELECT … FOR UPDATE` gelöst; der
  „already a participant"-Zweig ist nötig, damit `onConflictDoNothing`-Rejoin-Idempotenz den Guard
  überlebt. `leave` bleibt evidence-free (immer gleiche 200); `delete` bewusst NICHT — Existenz der
  Aktivität ist im eigenen Festival ohnehin öffentlich, eine stille 200 würde nur den Client desyncen.

- **10-04:** Tag an einer List-/Detail-Zeile wird DIREKT per id gejoint, nie über
  `effectiveTagWhere` — ein deaktivierter Tag lässt den Titel bestehender Aktivitäten unverändert
  (D-04). `summarySelect()`/`shapeSummaries()` ist DAS eine Select+Shape-Paar für
  `listForFestival`/`listMine`/`getDetail`; `participantCount`/`joined` als korrelierte
  SQL-Subqueries, nie drei parallele Query-Implementierungen.

- **10-05:** Zwei echte OTP-Sign-ins genügen für den vollen Cross-Tenant-Beweis (Discovery/Detail
  sind gate-less, ADR-014). FKs werden per Spalten-/Fremdtabellen-Name über `information_schema`
  asserted, nie über drizzles auto-generierten Constraint-Namen. **Der Verbotslisten-Contract-Walk
  (kein client-gesetzter Actor/Scope) und der `information_schema`-Mandantenspalten-Walk sind
  stehende Gates: Phase 11/12-Routen und -Tabellen laufen automatisch dagegen.**

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
  neuen tenant-scoped Tabelle neu zu ziehen. **Seit Phase 10 mechanisch gestützt:**
  `activity-tenant-structure.spec.ts` läuft als stehendes Gate über `information_schema` (jede neue
  Tabelle braucht Mandantenspalte oder benannte Ausnahme) und über den Contract-Walk (keine neue
  Route mit client-gesetztem Actor/Scope) — der Verhaltensbeweis pro Tabelle bleibt trotzdem Pflicht.

- **Kein RN-Component-Test-Harness in `apps/mobile`.** Der Vitest-Runner ist node-env und deckt nur
  reine `lib/`-Logik. Jede Screen-Wahrheit haengt an On-Device-UAT — das ist die strukturelle
  Verifikationsgrenze dieses Projekts, keine Nachlaessigkeit.

- **iOS ist seit Phase 3 unverifiziert** (kein Mac/Xcode). Android ist durchgaengig abgenommen.
- **`/gsd-ui-review 06` ist nie gelaufen** — der visuelle 6-Saeulen-Audit der drei Phase-6-Screens.
- **`.planning/WINDOWS.md` hat 26 offene Eintraege**, ueberwiegend veraltete `unrun-verify`-Punkte
  aus Phase 4/5, die die Phase-5/6-UATs faktisch abgedeckt haben. Der Ledger ueberzeichnet die
  Schuld; Gate ist aus (`windows_enforce: false`). Braucht einen Abgleich. **Alle acht
  Phase-9-Eintraege (#40, #42–#48) sind seit 2026-08-15 mit Evidenz aus den UAT-Runden 1+2
  geschlossen** — offen bleiben aus juengerer Zeit nur #30/#31 (05.1 Themed Icons / Outfit-Tracking
  am Geraet) und #39 (07-03 Deviation-Notiz).

- **LOW (aus 06-10-REVIEW):** `lib/__tests__/intl-polyfill.test.ts` matcht Quelltext als String
  inklusive Kommentaren und zaehlt die Imports in `index.js` nicht — faengt weder einen
  auskommentierten noch einen zusaetzlich eingeschleusten Import. Der Fix selbst ist
  geraeteverifiziert und davon unberuehrt. Haerten, wenn der Entry das naechste Mal angefasst wird.

- **`gsd-tools requirements.mark-complete` funktioniert im Workstream-Layout nicht** (07-01, in Phase
  8 erneut bestaetigt): findet die Requirements in `.planning/workstreams/mobile/REQUIREMENTS.md`
  nicht (`not_found`, kein Write), und `phase.complete` meldet entsprechend
  `requirements_updated: false`. Beim Abschluss von Phase 7, 8 **und** 9 wurden Checkbox und
  Traceability-Zeile von Hand gesetzt (Phase 9: Checkboxen waren schon gesetzt, nur die
  Traceability-Vermerke „device UAT pending" mussten nachgezogen werden). Bei jedem weiteren
  Phasenabschluss dieses Workstreams selbst nachziehen, bis das Tool den Pfad aufloest.

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

Last session: 2026-08-15T10:15:00Z
Stopped at: Phase 10 complete (UAT 3/3, threats_open 0, VERIFICATION passed), ready to ship / plan Phase 11
Resume file: None

## Operator Next Steps

- **Phase 10 ist KOMPLETT (2026-08-15):** UAT 3/3 (drei Prohibitions bestaetigt),
  `10-SECURITY.md` mit `threats_open: 0` (32/32), VERIFICATION `passed`, Transition gelaufen
  (ROADMAP/STATE/PROJECT nachgezogen; SEC-03 war schon in 10-05 in REQUIREMENTS.md abgehakt).
  Naechster Schritt: **`/gsd-ship 10 --ws mobile`** — PR gegen `main` (Review laeuft im Ship-Flow).

- Danach: **`/gsd-discuss-phase 11 --ws mobile`** — Activities-UI (ACT-01…ACT-06 werden dort
  user-observable); kein CONTEXT.md vorhanden, also erst diskutieren, dann planen.

- Fuer Phase 12 (WS-Gateway + Redis): `research` einschalten — steht so in den
  Milestone-Entscheidungen.

- Offene UI-Reviews (optional): `/gsd-ui-review 9 --ws mobile` (Navigation/Cashless),
  `/gsd-ui-review 8 --ws mobile` (Friends), `/gsd-ui-review 06 --ws mobile` (aus v1.0).

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
| Phase 09 P06 | ~55min | 2 tasks | 12 files |
| Phase 09 P07 | 25min | 3 tasks | 10 files |
| Phase 10 P01 | ~20min | 3 tasks | 19 files |
| Phase 10 P02 | ~25min | 3 tasks | 15 files |
| Phase 10 P03 | 9min | 3 tasks | 9 files |
| Phase 10 P04 | ~10min | 3 tasks | 5 files |
| Phase 10 P05 | ~18min | 3 tasks | 3 files |
