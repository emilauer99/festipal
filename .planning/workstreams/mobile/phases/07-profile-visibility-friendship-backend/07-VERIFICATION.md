---
phase: 07-profile-visibility-friendship-backend
verified: 2026-08-12T17:35:00Z
status: human_needed
score: 7/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
requirements_judgment:
  VIS-01: satisfied # eigenes Urteil des Verifiers; Checkbox in REQUIREMENTS.md unangehakt wegen Tooling-Defekt (requirements.mark-complete not_found im Workstream-Layout)
  VIS-02: satisfied # dito
re_verification:
  previous_status: gaps_found
  previous_score: 6/7
  gaps_closed:
    - "Kein Text behauptet mehr, der T-06-06-Split stehe aus — geschlossen durch Commit 988f73b (docs(07): discharge T-06-06 in the planning record); alle drei Fundstellen am Dateisystem gegengeprüft"
  gaps_remaining: []
  regressions: []
gaps: []
deferred: []
prohibitions:
  - requirement_id: VIS-01
    statement: "MUST NOT let any response field, status value or error code allow a requester to distinguish 'my request was declined' from 'I never sent one'"
    verification: judgment
    disposition: "unverified-prohibition — human review recommended"
    llm_judge: "PASS (non-authoritative): decline/withdraw antworten immer 200 {result:'removed'} ohne 404-Zweig (friendship.controller.ts); accept kollabiert 'kein Request' und 'eigener Request' auf dieselbe 404-Message; relation nach Decline = 'none' — identisch zu 'nie gesendet'."
  - requirement_id: VIS-02
    statement: "MUST NOT let a friendship imply, enable or grow into a 1:1 message channel (ADR-020)"
    verification: judgment
    disposition: "unverified-prohibition — human review recommended"
    llm_judge: "PASS (non-authoritative): kein Message-/Chat-Endpunkt im Contract; zusätzlich mechanisch gestützt durch das DM-Segment-Inventar in projection-uniqueness.spec.ts (13 verbotene Pfadsegmente, alle Routen)."
  - requirement_id: VIS-01
    statement: "MUST NOT present or imply any protective control over who may find or contact a visitor (FRND-09 deferred)"
    verification: judgment
    disposition: "unverified-prohibition — human review recommended"
    llm_judge: "PASS (non-authoritative): grep 'searchable' über contracts/db/api-Quellen = 0 Treffer; visitorSearchQuerySchema trägt exakt {q}; keine Cooldown-/Block-/Report-Felder, -Flags oder -Fehlermeldungen; D-05/D-11/D-13 konsistent umgesetzt."
human_verification:
  - test: "Die drei judgment-tier Prohibitions (siehe prohibitions-Block) am Ende der Phase bewusst freigeben"
    expected: "Ein Mensch bestätigt die drei nicht-mechanisierbaren Muss-nicht-Aussagen (Decline-Ununterscheidbarkeit, kein DM-Kanal, keine vorgetäuschte Schutzkontrolle)"
    why_human: "Per Plan 07-05 bewusst ohne check_*-Deskriptor geführt, damit sie als flagged-unverified disponieren und nie stillschweigend grün werden; die LLM-Judge-Einschätzungen oben sind NON-AUTHORITATIVE."
---

# Phase 7: Profile Visibility & Friendship Backend — Verification Report

**Phase Goal:** The API can express who may see what about whom, and friendships exist as a real,
user-global model with a request lifecycle — before any screen can leak anything
**Verified:** 2026-08-12T17:35Z (Update nach Gap-Schließung; Erstverifikation 17:15Z)
**Status:** human_needed — alle 7 Must-haves verifiziert; offen sind ausschließlich die drei
judgment-tier Prohibitions, die per Plan 07-05 eine menschliche Freigabe verlangen. `passed` wäre
erst nach dieser Freigabe zulässig (ein `passed` mit offenen flagged-Prohibitions wäre genau das
stille Grün, das der Plan verbietet).
**Re-verification:** Ja — Gap aus der Erstverifikation (17:15Z, Status gaps_found, Score 6/7)
geschlossen durch Commit `988f73b` „docs(07): discharge T-06-06 in the planning record".
**Post-Review-Fixes:** gegen den GEFIXTEN Stand geprüft (9b50640, 5382f54, 1da4438, b59a832, a73c360), nicht gegen die SUMMARY-Snapshots

## Gap-Schließung (Re-Verifikation, am Dateisystem gegengeprüft)

Der einzige Gap der Erstverifikation — zwei Planungstexte führten T-06-06 präsent-tensisch als
offene Pflicht — ist durch **Commit `988f73b`** geschlossen. Alle drei Änderungen wurden am
Dateisystem verifiziert, nicht aus der Commit-Message übernommen:

1. **`.planning/PROJECT.md` §Active** — die Checkbox ist `[x]` und der Text ist faktisch korrekt:
   „discharged in Phase 7 (2026-08-12)", `visitorProfilePublicSchema` existiert nicht mehr, Split
   in `visitorProfileForeignSchema` + `visitorProfileOwnerSchema`, 07-05 pinnt ihn per
   VIS-02-Invariantentest, IDN-02 bleibt ausdrücklich offen. ✓
2. **`.planning/WINDOWS.md` Eintrag 32** — `open` → `resolved` in **beiden** Repräsentationen
   (Markdown-Tabellenzeile 49 UND JSON-Block, Einträge inhaltsgleich), jeweils mit `reason`
   (Discharge durch 07-01, Invariantentest 07-05, IDN-02 separat offen) und `resolved_at`. Die
   beiden Repräsentationen sind konsistent: je 26 open / 9 fixed / 1 resolved / 3 waived
   (39 Einträge), nachgezählt. ✓
3. **`.planning/codebase/CONVENTIONS.md` §Drift Detection** — das Beispiel referenziert jetzt die
   beiden neuen Schemata statt des entfernten Symbols. ✓ (Dritte Fundstelle, in der
   Erstverifikation nicht entdeckt — der Grep dort war auf Pending-Formulierungen gerichtet,
   nicht auf das Symbol in Konventionsbeispielen.)

**Rest-Grep:** `visitorProfilePublicSchema` und Pending-Split-Formulierungen treffen außerhalb der
drei gefixten Stellen nur noch (a) die `description`-Felder des jetzt **resolved** WINDOWS-Eintrags
(historische Beschreibung dessen, was akzeptiert worden war — mit Resolution daneben korrekt),
(b) `MILESTONES.md:67` und die archivierten v1.0-Phasenartefakte unter
`milestones/v1.0-phases/` — eingefrorene Closeout-Historie, bewusst nicht angefasst; **Einschätzung
geteilt**: Historie umzuschreiben wäre falscher als sie stehen zu lassen, und die Tabelle ist als
v1.0-Schlussstand („carried forward" zum damaligen Zeitpunkt) lesbar, (c) `STATE.md:96`, das den
Split korrekt als getilgt führt. Kein verbleibender Text behauptet, der Split stehe aus.

**Drei Restbefunde aus der Gegenprüfung, alle Info-Level (kein Gap):**

- **WINDOWS.md hat eine dritte Ableitung, und sie ist jetzt stale:** Frontmatter
  `open_count: 27` (Zeile 3) wurde beim open→resolved-Flip von Eintrag 32 **nicht** auf **26**
  dekrementiert — tatsächlich offen sind 26 (in beiden Repräsentationen nachgezählt).
  Enforcement ist aus (`windows_enforce: false`), es blockiert also nichts; ein Ein-Zeilen-Fix
  beim nächsten Ledger-Touch.
- `resolved_at` von Eintrag 32 ist der Mitternachts-Platzhalter `2026-08-12T00:00:00.000Z`
  (vor dem tatsächlichen Discharge-Zeitpunkt am selben Tag); in beiden Repräsentationen
  identisch — kosmetisch.
- Der PROJECT.md-Abschnittsheader „Mobile — next milestone (Activities + Friends), requirements
  not yet written" ist weiterhin stale (die v1.1-Requirements SIND geschrieben) — betrifft aber
  nicht T-06-06 und behauptet keinen ausstehenden Split; gehört in die nächste
  PROJECT.md-Pflegerunde.

## Goal Achievement

### Observable Truths (merged: ROADMAP Success Criteria + Auftrag + Backstop)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | SC1: Fremdprofil liefert nur die Friend-View-Projektion — kein `birthDate`, keine E-Mail, bewiesen als Feld-**Abwesenheit** | ✓ VERIFIED | `friendship-isolation.spec.ts` prüft auf allen vier D-04-Pfaden am **serialisierten** HTTP-Body `not.toContain('birthDate'/'birth_date'/E-Mail/konkreter Geburtsdatumswert)` (11 Abwesenheits-Zusicherungen) plus Owner-Gegenprobe (Testfall 6: `GET /me` trägt das Geburtsdatum sehr wohl). Eigener Lauf: 6 Spec-Dateien, **77/77 grün** (2026-08-12, gegen lebende Docker-Postgres). |
| 2 | SC2: Suche und Anfragevorschauen laufen über **dieselbe** Projektionsfunktion; ein Test beweist, dass es keinen zweiten Codepfad gibt | ✓ VERIFIED | `foreignProfileColumns` ist die einzige Select-Map (visitor-projection.ts:23-30); alle vier Pfade in `friendship.service.ts` selektieren sie (Z. 200, 250, 542, 574) und formen über `pickForeignProfile`. `projection-uniqueness.spec.ts` (15 Tests, grün) beweist die **Einzigkeit**: Contract-Walk über ALLE Routen mit Ausnahmeliste (nie Positivliste), Owner-only-Keys **abgeleitet** aus `visitorProfileSelectSchema`, Sechs-Schlüssel-**Gleichheit** für jede Route mit eingebettetem `profile`, rekursiver Quellcode-Scan über ganz `apps/api/src`. |
| 3 | SC3: Freundschaft ist user-global — kein `festivalId`, Festival-Wechsel lässt sie unverändert | ✓ VERIFIED | Lebende DB geprüft: `information_schema.columns` für beide Tabellen = exakt `lower_id, higher_id, (requester_id,) created_at` — keine Festival-Spalte (eigene psql-Abfrage). Behavioral: Testfälle 7–9 in `friendship-isolation.spec.ts` (Freundschaft ohne gespeichertes Festival; Freundesliste **byte-identisch** vor/nach Speichern von Festival B; Live-Schema-Nachweis im Test selbst). D-14/D-15 gelockt — kein Multi-Tenancy-Verstoß. |
| 4 | SC4: Lifecycle vollständig & idempotent (send/accept/decline/withdraw/unfriend) mit Gegenseitigkeits-Invariante, die keine einseitige Freundschaft ausdrücken kann | ✓ VERIFIED | Fünf Route-Keys im Contract (router.ts), fünf Service-Methoden, diskriminierte Unions statt Exceptions. `friend-request-race.spec.ts` (16 Fälle, grün): Idempotenz (2, 7, 9), Auto-Accept D-10 (3), paralleles Rennen via `Promise.all` (5), WR-01-Fixes (14, 15), WR-02 (16), Invariante „nie Request- UND Friendship-Zeile" (12). Einseitige Freundschaft ist schema-seitig unausdrückbar: Composite-PK `friendship_pair_pk` auf dem kanonischen Paar + Ordnungs-CHECK — keine Spiegelzeile möglich. `friend-lists.spec.ts` (11 Fälle, grün): Symmetrie, idempotentes Unfriend beidseitig. |
| 5 | ROADMAP-Auflage: Das Duplicate-/Reverse-Direction-Rennen ist **im Schema** gelöst (kanonisches Paar + Unique-Constraint), nicht in App-Logik | ✓ VERIFIED | Live-DB: `friendship_pair_pk`/`friend_request_pair_pk` als PRIMARY KEY auf `(lower_id, higher_id)`, CHECKs `lower_id COLLATE "C" < higher_id COLLATE "C"` (eigene pg_constraint-Abfrage). **CR-01-Fix behavioral bestätigt**: eigener psql-Probe-Insert `('a','B')` → SQLSTATE 23514 (unter `en_US.utf8` wäre `'a'<'B'` wahr — der CHECK vergleicht also nachweislich unter COLLATE "C"); `('B','a')` passiert den CHECK und scheitert erst am FK. Migration 0006 angewendet, Drizzle-Schema synchron gepinnt, Regressions-Paar I/J (`B…`/`a…`) fährt in Testfall 13 den kompletten Lifecycle. Der 23505 auf dem Paar-PK ist im Code der Auslöser des Auto-Accept — die zweite Zeile ist physisch unmöglich. |
| 6 | T-06-06 ist getilgt; **kein Text behauptet mehr, der Split stehe aus** | ✓ VERIFIED (nach 988f73b) | Im **Code** seit 07-01 vollständig: `visitorProfilePublicSchema`/`VisitorProfilePublic` existieren nicht mehr, beide Vorbehaltskommentare ersetzt (schemas.ts:57 „T-06-06 is SETTLED here", visitor-profile.ts:44 „T-06-06 is SETTLED"), STATE.md führt es als ERLEDIGT. Die in der Erstverifikation gefundenen Pending-Texte (PROJECT.md:48, WINDOWS.md Eintrag 32) plus eine dritte Fundstelle (CONVENTIONS.md `.pick()`-Beispiel) sind durch **Commit 988f73b** korrigiert — alle drei am Dateisystem gegengeprüft, Rest-Grep sauber (Details oben unter „Gap-Schließung"). |
| 7 | Backstop (07-05): Ein Abbruch mitten im Auto-Accept hinterlässt keinen Zwischenzustand — Löschen der Request-Zeile und Einfügen der Freundschaft laufen in **einer** `db.transaction` | ✓ VERIFIED (expliziter Beleg) | `sealFriendship` (friendship.service.ts:462-473): bedingtes `tx.delete(friendRequest)…returning()` und `tx.insert(friendship)` laufen beide über dasselbe `tx` innerhalb eines einzigen `this.db.transaction`-Callbacks — der geteilte Pfad für expliziten Accept UND Auto-Accept. Atomarität unter Prozessabbruch ist damit Postgres-Transaktionsgarantie, keine App-Logik. Kein Schreibpfad existiert, der die beiden Wirkungen außerhalb dieser Transaktion koppelt (der Cleanup-Delete in openRequest:375 ist ein anderer Übergang: Entfernen einer redundanten Request-Zeile neben bereits bestehender Freundschaft). |

**Score:** 7/7 truths verified (0 present-but-behavior-unverified)

Alle verhaltensabhängigen Truths (Lifecycle-Übergänge, Race, Idempotenz, Festival-Invarianz) sind
durch **selbst ausgeführte** Tests belegt, nicht durch Symbol-Präsenz.

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `packages/db/src/schema/friendship.ts` | Tabelle + kanonisches Paar + CHECK + drizzle-zod-Basen | ✓ VERIFIED | PK, COLLATE-"C"-CHECK (CR-01-Kommentar), FKs auf `visitor_profile.accountId` cascade, kein `festivalId`; Exports vorhanden |
| `packages/db/src/schema/friend-request.ts` | Paar + `requesterId`, **kein** `status` (D-12) | ✓ VERIFIED | Drei CHECKs inkl. `requester_chk`; kein Status-Feld, keine Historie |
| `packages/db/drizzle/0005_*.sql` + `0006_*.sql` | Migration inkl. CR-01-Fix, angewendet | ✓ VERIFIED | Beide in `_journal.json` und in der Live-DB (`__drizzle_migrations`); Live-Constraints = Migrationsstand |
| `packages/contracts/src/schemas.ts` | Foreign-Basis + Owner-Erweiterung, per `.pick()` komponiert | ✓ VERIFIED | `visitorProfileForeignSchema` (6 Felder) Basis, `visitorProfileOwnerSchema` = Basis + `birthDate` via merge/pick; keine handgespiegelten Formen; alter Name getilgt |
| `packages/contracts/src/router.ts` | 8 neue Route-Keys (Lookup, Suche, 4× Lifecycle, 2 Listen + unfriend) | ✓ VERIFIED | Alle vorhanden; `:accountId` benennt stets das Gegenüber, nie den Akteur |
| `apps/api/src/friendship/visitor-projection.ts` | DIE eine Projektion + `canonicalPair` + `pickForeignProfile` | ✓ VERIFIED | Genau ein `export const foreignProfileColumns` (mechanisch im Spec geprüft) |
| `apps/api/src/friendship/friendship.service.ts` | Alle Methoden inkl. WR-01/WR-02-Fixes | ✓ VERIFIED | Delete-ist-der-Check in `sealFriendship`; 23503 dreifach diskriminiert (`foreignKeyOutcome`) |
| `apps/api/src/friendship/friendship.controller.ts` + `.module.ts` + `app.module.ts` | Session-Scoping, Modul registriert | ✓ VERIFIED | Kein `@AllowAnonymous`, überall `session.user.id`; `FriendshipModule` im imports-Array |
| `apps/api/src/me/me.service.ts` | Rename-Fallout auf `VisitorProfileOwner` | ✓ VERIFIED | Typimport, `getProfile`-Rückgabe, `CompleteProfileResult` umgestellt; Owner-Pfad-Regression grün (me-endpoints + username-race: 32/32) |
| 6 Test-Specs (foreign-projection, username-search, friend-request-race, friend-lists, projection-uniqueness, friendship-isolation) | Substanzielle Beweise | ✓ VERIFIED | 7+13+16+11+15+13 Fälle; selbst ausgeführt: **77/77 grün** |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| friendship.service.ts | visitor-projection.ts | `foreignProfileColumns` als einzige Select-Map | ✓ WIRED | 4 Verwendungen (Lookup, Suche, listFriends, listRequests); keine eigene Spaltenliste (Spec-invariantengeprüft) |
| friendship.service.ts | friend-request.ts | 23505 auf `friend_request_pair_pk` IST der Auto-Accept-Auslöser | ✓ WIRED | Konstante Z. 53, Catch Z. 335; Race-Test 5 beweist die Wirkung |
| friendship.service.ts | visitor-projection.ts | `canonicalPair` vor jedem Insert/Select/Delete | ✓ WIRED | Alle Paar-Pfade; Selbst-Adjazenz vor `canonicalPair` beantwortet |
| controller → service | Diskriminierte Union → 200/404/409, nie Exception | ✓ WIRED | Alle 9 Handler; Race-Test 11/16 beweisen kein-500 |
| schemas.ts | visitor-profile.ts | `visitorProfileSelectSchema.pick()` — Drift-Erkennung | ✓ WIRED | Beide Projektionen komponiert; Workspace-Typecheck 10/10 grün |
| projection-uniqueness.spec | router.ts + apps/api/src | Contract-Walk + rekursiver Quelltext-Scan | ✓ WIRED | Non-Vacuum-Guards vorhanden (Walker findet `birthDate` auf getMe; Scan ≥15 Dateien) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Alle 6 Phase-7-Specs gegen lebende Postgres | `pnpm exec vitest run test/{6 specs}` | 6 Dateien, 77/77 Tests | ✓ PASS |
| Owner-Pfad-Regression (me.service.ts geändert) | `pnpm exec vitest run test/me-endpoints.spec.ts test/username-race.spec.ts` | 2 Dateien, 32/32 | ✓ PASS |
| Workspace-Typecheck (Rename vollständig?) | `pnpm typecheck` | 10/10 successful | ✓ PASS |
| CHECK vergleicht unter COLLATE "C" (CR-01) | psql-Insert `('a','B')` bzw. `('B','a')` | 23514 bzw. CHECK-Pass→FK-Fehler — exakt die C-Ordnung | ✓ PASS |
| Live-Schema = Migrationsstand | pg_constraint + information_schema via psql | 17 Constraints, COLLATE "C" gepinnt, keine Festival-Spalte | ✓ PASS |
| Kein Auffindbarkeits-Schalter (D-05) | `grep -r searchable` über contracts/db/api-Quellen | 0 Treffer | ✓ PASS |
| Gap-Schließung 988f73b (Re-Verifikation) | Dateisystem-Prüfung PROJECT.md/WINDOWS.md/CONVENTIONS.md + Rest-Grep + Statuszählung beider WINDOWS-Repräsentationen | Alle drei Stellen korrigiert; MD-Tabelle und JSON-Block konsistent (26/9/1/3) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| VIS-01 | 07-01, 07-02, 07-04, 07-05 | Fremdprofil nur Friend-View — kein `birthDate`, keine E-Mail | ✓ SATISFIED (eigenes Urteil) | Truth 1; Abwesenheitsbeweis auf allen vier Pfaden am serialisierten Body, Owner-Gegenprobe, Null-Felder-Serialisierung |
| VIS-02 | 07-01…07-05 | Suche & Vorschauen über dieselbe Projektion, kein zweiter Codepfad | ✓ SATISFIED (eigenes Urteil) | Truth 2; Einzigkeits-Invariante (Contract-Walk + Quellcode-Singularität), WR-03-Nachschärfung geprüft (s. u.) |

**Hinweis Tooling-Defekt:** `gsd-tools query requirements.mark-complete VIS-01 VIS-02` liefert im
Workstream-Layout `not_found` und schreibt nichts — die Checkboxen in
`.planning/workstreams/mobile/REQUIREMENTS.md:18-19` sind deshalb noch unangehakt. Das ist ein
dokumentierter Tooling-Defekt, **kein** Indiz gegen die Erfüllung. Unabhängiges Verifier-Urteil:
**beide Requirements sind durch den Code erfüllt.** Die Checkboxen sollten manuell (oder beim
Phase-Complete) nachgezogen werden. Keine ORPHANED-Requirements: die Traceability-Tabelle mappt
genau VIS-01/VIS-02 auf Phase 7.

### Urteil zur WR-03-Nachschärfung (Auftrag: Ausnahme `me/me.service.ts` — sound oder Loch?)

**Urteil: sound.** Begründung in drei Schichten:

1. **Die Ausnahme ist eng und selbstüberwachend.** Sie gilt für genau eine benannte Datei (die
   Owner-Projektion, das legitime zweite Sichtbarkeits-Tier aus D-01) und trägt einen
   Non-Vacuum-Guard: `me.service.ts` muss weiterhin ≥2 Identitätsspalten führen, sonst schlägt der
   Test fehl und die Ausnahme muss gelöscht werden — sie kann nicht still zu einem Deckmantel für
   eine künftige zweite Projektion verkommen (projection-uniqueness.spec.ts:559-564).
2. **Zwei unabhängige Prüfnetze decken das Restrisiko.** Ein Leak, der INNERHALB von
   `me.service.ts` entstünde, müsste über eine Route nach draußen: (a) der Contract-Walk pinnt
   Owner-only-Keys pro Route über ALLE Routen, mit aus dem Tabellenschema **abgeleiteter**
   Key-Menge (nicht nur birthDate/email — auch socials, socialsVisibility, createdAt, updatedAt)
   und Sechs-Schlüssel-Gleichheit für jede `profile`-tragende Route außer `getMe`; (b) die
   HTTP-Ebene (`friendship-isolation.spec.ts`) prüft die vier Fremd-Pfade zur Laufzeit am
   serialisierten Body — ein Runtime-Leak durch eine bestehende Fremd-Route würde dort rot,
   unabhängig davon, in welcher Quelldatei er wohnt.
3. **Verbleibender Restsplitter (Info, kein Loch):** Ein Runtime-only-Leak eines *nicht* von den
   HTTP-Abwesenheitsprüfungen genannten Owner-Felds (z. B. `socials`) durch eine **bestehende**
   Fremd-Route, implementiert als bewusster Umbau in `me.service.ts` und ohne Contract-Änderung,
   würde von Heuristik (a) und (b) nicht erfasst. Das erfordert aber einen absichtlichen
   Querschluss (FriendshipController ruft MeService), der im Review sofort sichtbar wäre — als
   theoretisches Restrisiko akzeptabel, nicht als Gap gewertet.

Die frühere Identitäts-Spalten-Schwelle (Loch 3 aus dem Review: `{accountId, username,
displayName, socials}` mit nur einer gezählten Identitätsspalte) ist durch die abgeleitete
Owner-only-Key-Prüfung im Contract-Walk geschlossen: `socials` auf irgendeiner nicht erlaubten
Route macht `exposes the owner-only key \`socials\` on no route…` rot, egal wie das Select aussah.

### Locked Decisions — respektiert, nicht als Gaps gewertet

- **D-02**: `gender` ist in der Fremd-View (6 Felder) — bestätigt in Schema, Projektion und Specs.
- **D-12**: kein `status` auf `friend_request` — Live-DB-Spaltenliste bestätigt; Lifecycle löscht.
- **D-05**: kein Auffindbarkeits-Schalter — 0 `searchable`-Treffer, Suchvertrag exakt `{q}`; nichts
  im Code täuscht eine Schutzkontrolle vor (siehe Prohibition 3).
- **D-14/D-15**: kein `festivalId` — das IST Erfolgskriterium 3, live bestätigt.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| — | — | Keine TBD/FIXME/XXX/TODO/HACK/Placeholder-Marker in den Phase-Dateien | — | grep über alle 13 modifizierten Quell-/Testdateien: 0 Treffer |
| lokale Dev-DB | — | Verwaiste Zeile in `drizzle.__drizzle_migrations` (8 Zeilen vs. 7 Journal-Einträge; Timestamp vor 0005) | ℹ️ Info | Vorbestehend, in `deferred-items.md` D-1 sauber dokumentiert; Live-Schema stimmt mit Quellcode überein, `db:migrate` idempotent — kein Handlungsbedarf, verschwindet beim nächsten DB-Reset |
| `.planning/WINDOWS.md` | 3 | Frontmatter `open_count: 27` stale — tatsächlich 26 offen, nachdem 988f73b Eintrag 32 auf resolved gesetzt hat (dritte Ableitung neben MD-Tabelle und JSON-Block, beim Fix nicht dekrementiert) | ℹ️ Info | Enforcement aus (`windows_enforce: false`), blockiert nichts; Ein-Zeilen-Fix beim nächsten Ledger-Touch |
| `.planning/PROJECT.md` | 46 | Abschnittsheader „requirements not yet written" stale (v1.1-Requirements existieren) | ℹ️ Info | Kein T-06-06-Bezug; nächste PROJECT.md-Pflegerunde |
| `.planning/workstreams/mobile/MILESTONES.md` | 67 | „Known gaps carried forward"-Tabelle nennt T-06-06 als Accepted risk | ℹ️ Info | Eingefrorenes v1.0-Closeout-Archiv — als Historie gewertet (Einschätzung mit Orchestrator geteilt: Historie wird nicht umgeschrieben) |

### Human Verification Required

#### 1. Freigabe der drei judgment-tier Prohibitions (Plan 07-05)

**Test:** Die drei Muss-nicht-Aussagen im `prohibitions`-Frontmatter-Block lesen und bewusst
freigeben (oder beanstanden): (1) Decline ist für den Anfragenden nicht von „nie gesendet"
unterscheidbar, (2) keine Freundschaft impliziert einen 1:1-Nachrichtenkanal, (3) nichts täuscht
eine Schutzkontrolle vor, die v1.1 nicht hat.
**Expected:** Alle drei bestätigt — die NON-AUTHORITATIVE LLM-Judge-Einschätzung ist jeweils PASS
(Belege im Frontmatter).
**Why human:** Plan 07-05 führt sie bewusst deskriptorlos, damit sie als flagged-unverified
disponieren und **nie stillschweigend grün** werden. Ein Verifier darf sie nicht selbst schließen.

### Gaps Summary

**Keine offenen Gaps mehr.** Der doc-only Gap der Erstverifikation (T-06-06-Pending-Texte in
PROJECT.md und WINDOWS.md) ist durch Commit `988f73b` geschlossen und wurde am Dateisystem
gegengeprüft — inklusive der dritten, in der Erstverifikation nicht entdeckten Fundstelle in
CONVENTIONS.md. Das Code-Ziel der Phase war bereits in der Erstverifikation vollständig belegt:
alle vier ROADMAP-Erfolgskriterien als selbst ausgeführte Beobachtungen (77/77 Phase-Tests +
32/32 Owner-Regression + Typecheck 10/10 + Live-DB-Proben), die Rennbedingung nachweislich im
Schema gelöst (COLLATE-"C"-CHECK behavioral per psql bestätigt), alle fünf Post-Review-Fixes
(CR-01, WR-01…WR-04) real im Code und je mit Regressionstest verankert, die WR-03-Ausnahme sound.

Offen bleibt ausschließlich die **menschliche Freigabe der drei judgment-tier Prohibitions**
(daher `human_needed`, nicht `passed`) sowie drei Info-Level-Restbefunde ohne Gap-Charakter
(staler `open_count: 27` in WINDOWS.md, staler PROJECT.md-Abschnittsheader, Platzhalter-
`resolved_at`) und das manuelle Nachziehen der VIS-01/VIS-02-Checkboxen (Tooling-Defekt).

---

_Verified: 2026-08-12T17:35Z (Update nach Gap-Schließung; Erstverifikation 17:15Z)_
_Verifier: Claude (gsd-verifier)_
