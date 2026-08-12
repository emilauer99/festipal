---
phase: 07-profile-visibility-friendship-backend
plan: 01
subsystem: api
tags: [drizzle, postgres, ts-rest, zod, nestjs, better-auth, vitest, supertest]

# Dependency graph
requires:
  - phase: 06-profile-friends-placeholders
    provides: "visitor_profile mit pronoun/birthDate/gender und die blockierende Schuld T-06-06 (ungeteilte Profil-Projektion)"
  - phase: 04-visitor-auth-profile
    provides: "visitor_profile, MeService/MeController, das @Session()-Scoping-Muster und der functional unique index visitor_profile_username_lower_unq"
provides:
  - "Tabellen friendship und friend_request (user-global, kanonisch geordnetes Paar, drei CHECK-Constraints), Migration 0005_equal_molly_hayes"
  - "visitorProfileForeignSchema (Basis, sechs Felder) und visitorProfileOwnerSchema (einzige Erweiterung) in packages/contracts"
  - "relationSchema und visitorSummarySchema — die eine Antwortform für alle vier D-04-Zugriffspfade"
  - "ts-rest-Route lookupVisitor -> GET /api/v1/visitors/:username"
  - "NestJS-Modul apps/api/src/friendship mit foreignProfileColumns als EINZIGER Fremd-Select-Map, canonicalPair, toIsoString"
  - "apps/api/test/foreign-projection.spec.ts — Feld-Abwesenheitsbeweis am serialisierten Body"
affects: [07-02-username-search, 07-03-request-lifecycle, 07-04-friend-lists, 07-05-projection-uniqueness, 08-friends-ui-qr, 09-friends-at-festival]

actuals:
  tokens: 12306
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Postgres CHECK-Constraints via drizzle-orm check() — erster Präzedenzfall im Repo"
    - "Kanonisch geordnetes Paar als Schema-Invariante statt App-Logik"
    - "Fremd-View als Basis, Owner-View als benannte Erweiterung (default-closed by construction)"
    - "Eine einzige Drizzle-Select-Map als Fremd-Projektion pro Feature-Modul"

key-files:
  created:
    - packages/db/src/schema/friendship.ts
    - packages/db/src/schema/friend-request.ts
    - packages/db/drizzle/0005_equal_molly_hayes.sql
    - apps/api/src/friendship/visitor-projection.ts
    - apps/api/src/friendship/friendship.service.ts
    - apps/api/src/friendship/friendship.controller.ts
    - apps/api/src/friendship/friendship.module.ts
    - apps/api/test/foreign-projection.spec.ts
  modified:
    - packages/contracts/src/schemas.ts
    - packages/contracts/src/router.ts
    - packages/db/src/schema/index.ts
    - packages/db/src/schema/visitor-profile.ts
    - apps/api/src/app.module.ts
    - apps/api/src/me/me.service.ts

key-decisions:
  - "D-02 und D-12 vom User als confirm-both bestätigt: gender ist Teil der veröffentlichten Fremd-View, friend_request bekommt keine status-Spalte"
  - "Fremd-View ist die BASIS, Owner-View die einzige benannte Erweiterung (promote statt add-alongside) — eine neue Spalte erscheint per Konstruktion in keiner der beiden Sichten"
  - "Der alte Name visitorProfilePublicSchema verschwindet ersatzlos statt umbenannt zu werden — er suggerierte Fremd-Sicherheit und trug trotzdem das Geburtsdatum"
  - "drizzle-kit 0.31 emittiert alle drei CHECK-Constraints korrekt aus der Tabellenkonfiguration — der im Plan vorgesehene Hand-Nachtrag an 0005_*.sql war nicht nötig"
  - "friendship/friend-request bekommen .extend()-Overrides auf ihren text()-Spalten, weil drizzle-zods statische Inferenz sie sonst zu unknown kollabieren lässt (dokumentierter Bug in visitor-profile.ts)"

patterns-established:
  - "CHECK-Constraints: check('name', sql`${t.a} < ${t.b}`) im Array-Argument von pgTable — drizzle-kit emittiert sie zuverlässig, kein Hand-Nachtrag nötig"
  - "Fremd-Projektion: genau eine exportierte Drizzle-Select-Map pro Feature-Modul; kein Service formuliert eine eigene Spaltenliste über visitor_profile"
  - "Feld-Abwesenheit wird am serialisierten Body geprüft (JSON.stringify + not.toContain), nie am geparsten Objekt"
  - "Selbst-Adjazenz wird VOR canonicalPair beantwortet — zwei gleiche IDs würden den Ordnungs-CHECK verletzen"

requirements-completed: [VIS-01, VIS-02]

coverage:
  - id: D1
    description: "GET /api/v1/visitors/:username liefert für ein fremdes Handle 200 mit genau den sechs Fremd-View-Feldern accountId, username, displayName, avatar, pronoun, gender (D-02)"
    requirement: VIS-01
    verification:
      - kind: integration
        ref: "apps/api/test/foreign-projection.spec.ts#A resolving B’s handle gets the six-field foreign view with relation \"none\""
        status: pass
    human_judgment: false
  - id: D2
    description: "Die serialisierte Fremd-Antwort enthält weder den Schlüssel birthDate noch dessen Wert noch die E-Mail-Adresse des Ziels (D-03, Feld-Abwesenheit als Testzusicherung)"
    requirement: VIS-01
    verification:
      - kind: integration
        ref: "apps/api/test/foreign-projection.spec.ts#the SERIALIZED foreign response carries neither B’s birth date nor B’s e-mail (D-03)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Selbst-Adjazenz liefert relation 'self' mit derselben Feldmenge — sie promotet die Antwort nicht zur Owner-View"
    requirement: VIS-01
    verification:
      - kind: integration
        ref: "apps/api/test/foreign-projection.spec.ts#A resolving their OWN handle gets relation \"self\" and the same field set — no owner view"
        status: pass
    human_judgment: false
  - id: D4
    description: "Ein nicht vergebenes Handle liefert 404 mit errorSchema-Form, nicht 200 mit null"
    requirement: VIS-01
    verification:
      - kind: integration
        ref: "apps/api/test/foreign-projection.spec.ts#an unclaimed handle is 404 with the shared error shape, not 200 with null"
        status: pass
    human_judgment: false
  - id: D5
    description: "GET /api/v1/me liefert weiterhin die Owner-View inklusive birthDate — der Split trennt, statt pauschal zu entfernen (T-06-06 getilgt)"
    requirement: VIS-02
    verification:
      - kind: integration
        ref: "apps/api/test/foreign-projection.spec.ts#GET /me still serves A the OWNER view — the split separates, it does not strip"
        status: pass
    human_judgment: false
  - id: D6
    description: "friendship und friend_request stehen in der lokalen Docker-Postgres, tragen keine festivalId und erzwingen lower_id < higher_id per CHECK (D-14, D-15)"
    verification:
      - kind: integration
        ref: "psql information_schema.table_constraints (friendship_pair_order_chk, friend_request_pair_order_chk, friend_request_requester_chk vorhanden); Insert mit lower_id > higher_id -> SQLSTATE 23514"
        status: pass
      - kind: integration
        ref: "psql: count(*) information_schema.columns where column_name='festival_id' -> 0"
        status: pass
    human_judgment: false
  - id: D7
    description: "packages/contracts exportiert genau zwei Profil-Projektionen, beide aus visitorProfileSelectSchema komponiert; der alte Name visitorProfilePublicSchema existiert im Repo nicht mehr"
    requirement: VIS-02
    verification:
      - kind: integration
        ref: "pnpm typecheck (workspace-weit, 10/10 tasks) — ein Restimport des alten Symbols würde den Build brechen"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-08-12
status: complete
---

# Phase 7 Plan 01: Tracer — Handle-Lookup & Fremd-Projektion Summary

**Der Handle-Lookup `GET /api/v1/visitors/:username` läuft end-to-end durch jede Schicht der Phase: zwei neue user-globale Tabellen mit kanonisch geordnetem Paar, angewendete Migration 0005, der Owner/Fremd-Split in `packages/contracts` und ein NestJS-Modul, dessen Fremd-Projektion an genau einer Stelle definiert ist — bewiesen durch einen Test, der Geburtsdatum und E-Mail am serialisierten Body als abwesend nachweist.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-08-12T14:58:00Z
- **Completed:** 2026-08-12T15:23:06Z
- **Tasks:** 2 ausgeführt (Task 1 war ein Checkpoint, vom User vorab beantwortet)
- **Files modified:** 14 (8 neu, 6 geändert; zzgl. generiertes `drizzle/meta/`)

## Accomplishments

- **T-06-06 ist getilgt.** Die blockierende Schuld aus Milestone v1.0 — eine einzige, irreführend `visitorProfilePublicSchema` genannte Projektion, die das Geburtsdatum trug — ist durch `visitorProfileForeignSchema` (Basis, sechs Felder) und `visitorProfileOwnerSchema` (Basis + `birthDate`) ersetzt. Beide Vorbehaltskommentare (in `schemas.ts` und `visitor-profile.ts`) sind auf den erledigten Stand gebracht; der alte Symbolname existiert nirgends mehr.
- **Zwei user-globale Beziehungstabellen** mit der Invariante im Schema statt in App-Logik: Composite-PK auf dem kanonisch geordneten Paar plus `friendship_pair_order_chk`, `friend_request_pair_order_chk` und `friend_request_requester_chk`. Eine einseitige Freundschaft ist damit nicht ausdrückbar, und `friend_request` hat per D-12 keine `status`-Spalte — höchstens eine Zeile pro Personenpaar.
- **Kein `festivalId` auf beiden Tabellen** (ADR-014, D-15), verifiziert gegen die lebende DB.
- **Die Fremd-Projektion existiert genau einmal:** `foreignProfileColumns` in `apps/api/src/friendship/visitor-projection.ts` ist die einzige Select-Map über `visitor_profile` im ganzen Modul. Die drei Erweiterungspläne 07-02 bis 07-04 bauen daran entlang, statt eigene Spaltenlisten zu formulieren.
- **Fünf grüne End-to-end-Testfälle** gegen die lebende lokale Docker-Postgres, darunter der D-03-Abwesenheitsbeweis (`JSON.stringify(res.body)` enthält weder `birthDate` noch `birth_date` noch den Wert noch `email` noch die E-Mail-Adresse des Ziels).

## Task Commits

1. **Task 1: Einbahn-Türen bestätigen (D-02, D-12)** — Checkpoint, kein Commit. Vom Orchestrator vorgelegt, vom User mit **`confirm-both`** beantwortet: `gender` bleibt Teil der veröffentlichten Fremd-View, `friend_request` bekommt keine `status`-Spalte.
2. **Task 2: friendship-/friend_request-Schema + Migration 0005** — `92bddb7` (feat)
3. **Task 3: Tracer — Handle-Lookup liefert die Fremd-View end-to-end** — `2e7f63d` (feat)

## Files Created/Modified

**Neu:**
- `packages/db/src/schema/friendship.ts` — eine Zeile pro Personenpaar, `lowerId`/`higherId` lexikografisch geordnet, Composite-PK + Ordnungs-CHECK, cascade-FKs auf `visitor_profile.accountId`
- `packages/db/src/schema/friend-request.ts` — dasselbe Paar plus `requesterId` als einzigen Richtungsmarker, drei Constraints, kein `status`
- `packages/db/drizzle/0005_equal_molly_hayes.sql` — beide Tabellen, alle drei CHECKs von drizzle-kit generiert
- `apps/api/src/friendship/visitor-projection.ts` — `foreignProfileColumns`, `canonicalPair`, `toIsoString`
- `apps/api/src/friendship/friendship.service.ts` — `lookupByUsername` (case-insensitiv über den vorhandenen Functional Index), `resolveRelation`
- `apps/api/src/friendship/friendship.controller.ts` — ein `@TsRestHandler`, Aufrufer ausschließlich aus `session.user.id`
- `apps/api/src/friendship/friendship.module.ts`
- `apps/api/test/foreign-projection.spec.ts` — fünf Fälle inkl. Abwesenheitsbeweis

**Geändert:**
- `packages/contracts/src/schemas.ts` — Split der Projektion, `relationSchema`, `visitorSummarySchema`, `meSchema.profile` auf die Owner-View
- `packages/contracts/src/router.ts` — `lookupVisitor`-Eintrag; `completeProfile` liefert die Owner-View
- `packages/db/src/schema/index.ts` — Barrel-Exporte der beiden neuen Tabellen
- `packages/db/src/schema/visitor-profile.ts` — T-06-06-Kommentar auf den erledigten Stand
- `apps/api/src/app.module.ts` — `FriendshipModule` registriert
- `apps/api/src/me/me.service.ts` — Rename-Fallout auf `VisitorProfileOwner`

## Decisions Made

- **Checkpoint Task 1: `confirm-both`** (User). Beide Einbahntüren wie in 07-CONTEXT.md entschieden umgesetzt. `gender` ist ab jetzt Teil des veröffentlichten Fremd-Response-Contracts — Entfernen wäre ein Breaking Change plus Client-Release; IDN-02 ist die Stelle, an der eine Policy dafür später greift. `friend_request` trägt keine Historie: Annehmen/Ablehnen/Zurückziehen löschen die Zeile.
- **Hand-Nachtrag an der Migration war nicht nötig.** Der Plan hielt fest, drizzle-kit emittiere CHECKs je nach Version unzuverlässig, und sah einen Hand-Nachtrag vor. drizzle-kit 0.31.10 hat alle drei Constraints korrekt aus der Tabellenkonfiguration generiert — `0005_equal_molly_hayes.sql` ist unverändert generiert und wurde nicht angefasst.
- **`.extend()`-Overrides auf den `text()`-Spalten der beiden neuen Tabellen.** Vom Plan nicht verlangt, aber die in `visitor-profile.ts` ausführlich dokumentierte drizzle-zod-Inferenzlücke gilt für jede `text()`-Spalte: ohne Override kollabiert der statische Typ zu `unknown` und macht `friendshipSelectSchema`/`friendRequestSelectSchema` für die `.pick()`/`.extend()`-Komposition unbrauchbar, die Plan 07-04 dafür vorsieht. Runtime-neutral, verhindert eine Landmine in Welle 4.
- **Relation-Typ kommt aus `@quiks/contracts`, nicht aus `visitor-projection.ts`.** Der Plan nennt „der Relation-Typ" bei der Projektionsdatei, listet ihn aber nicht unter deren Exporten. Contract-first (ADR-006): `relationSchema`/`Relation` leben in `packages/contracts`, der Service importiert den Typ von dort. Keine zweite Deklaration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Veralteter Typname in einem Doc-Kommentar**
- **Found during:** Task 3 (Verifikation der Rename-Vollständigkeit)
- **Issue:** `packages/db/src/schema/visitor-profile.ts:83` erklärte die drizzle-zod-Inferenzlücke anhand des Typnamens `VisitorProfilePublic`, den dieser Plan ersatzlos entfernt. Der Kommentar verwies damit auf ein Symbol, das es nicht mehr gibt — der Typecheck fängt das nicht, weil Kommentare nicht typgeprüft werden.
- **Fix:** Auf `VisitorProfileForeign`/`VisitorProfileOwner`/`CompleteProfileBody` umgestellt, mit dem Hinweis, dass diese Typen aus den darunterstehenden Schemata picken.
- **Files modified:** `packages/db/src/schema/visitor-profile.ts`
- **Verification:** Repo-weiter grep auf den alten Namen liefert außerhalb von `dist/` nur noch die eine Stelle in `schemas.ts`, die den Rename absichtlich beschreibt.
- **Committed in:** `2e7f63d` (Task-3-Commit)

**2. [Rule 2 - Missing Critical] `.extend()`-Overrides auf den neuen drizzle-zod-Basisschemata**
- **Found during:** Task 2
- **Issue:** `createSelectSchema` über eine Tabelle mit `text()`-Spalten liefert statisch `unknown` (dokumentierter drizzle-zod-Bug, siehe `visitor-profile.ts:66-107`). `friendshipSelectSchema`/`friendRequestSelectSchema` wären damit für die Contract-Komposition unbrauchbar gewesen, die Plan 07-04 auf ihnen vorsieht.
- **Fix:** `.extend({ lowerId: z.string(), higherId: z.string() })` bzw. zusätzlich `requesterId`, mit Verweis auf die bestehende Erklärung.
- **Files modified:** `packages/db/src/schema/friendship.ts`, `packages/db/src/schema/friend-request.ts`
- **Verification:** `pnpm --filter @quiks/db typecheck` grün; die Exporte sind für `.pick()` verwendbar.
- **Committed in:** `92bddb7` (Task-2-Commit)

**3. [Rule 1 - Bug] Kommentar-Formulierung im Controller erzeugte einen Falsch-Treffer**
- **Found during:** Task 3 (Prüfung des Akzeptanzkriteriums „Controller enthält kein `@AllowAnonymous`")
- **Issue:** Der aus `me.controller.ts` übernommene Kommentar „No `@AllowAnonymous()` — inherits the global AuthGuard" enthält den Token wörtlich. Ein grep-basierter Sicherheitscheck — genau die Art Prüfung, die Plan 07-05 für VIS-02 aufsetzt — kann Erwähnung und Anwendung nicht unterscheiden und hätte hier einen Falsch-Positiv gemeldet.
- **Fix:** Umformuliert zu „Carries no anonymous-access decorator, so it inherits the global AuthGuard (SEC-01)". Der erklärende Inhalt bleibt vollständig, der Token-Treffer entfällt.
- **Files modified:** `apps/api/src/friendship/friendship.controller.ts`
- **Verification:** `grep -c "AllowAnonymous" apps/api/src/friendship/friendship.controller.ts` -> 0; `session.user.id` weiterhin vorhanden; Suite grün.
- **Committed in:** `2e7f63d` (Task-3-Commit)

---

**Total deviations:** 3 auto-fixed (2× Rule 1, 1× Rule 2)
**Impact on plan:** Alle drei sind Korrektheits- bzw. Wartbarkeitsfixes am eigenen Diff, kein Scope Creep. Der einzige inhaltliche Zusatz (die `.extend()`-Overrides) ist runtime-neutral.

## Issues Encountered

**Verwaiste Zeile in `drizzle.__drizzle_migrations` (vorbestehend, NICHT behoben).** Die lokale Docker-Postgres führt 7 angewendete Migrationen, das Journal kennt 6 (`0000`–`0005`). Die überzählige Zeile (`created_at = 1786543153847`) wurde rund 75 Minuten **vor** dieser Ausführung angewendet und lässt sich keinem Journal-Eintrag zuordnen. Sie ist nicht von diesem Plan verursacht: `0005` ist als separate, letzte Zeile eingetragen, `packages/db/drizzle/` ist konsistent (6 SQL-Dateien, 6 Journal-Einträge), ein zweiter `db:migrate`-Lauf ist idempotent grün, und das Schema der lebenden DB stimmt mit dem Quellcode überein. Per Scope-Boundary nicht angefasst, sondern in `deferred-items.md` protokolliert — ein Eingriff in die Migrations-Buchführung wäre destruktiv ohne belegten Nutzen. Bei jedem lokalen DB-Reset verschwindet die Zeile von selbst.

**VIS-01/VIS-02 bleiben in `REQUIREMENTS.md` bewusst ungehakt.** `gsd-tools query requirements.mark-complete VIS-01 VIS-02` meldet `not_found` und hat nichts geschrieben, obwohl beide IDs in `.planning/workstreams/mobile/REQUIREMENTS.md` (Zeilen 18/19, 87/88) im erwarteten Format stehen — vermutlich löst der Verb den Workstream-Pfad nicht auf oder erwartet eine andere Abschnittsüberschrift als `## v1.1 Requirements`. **Das Ergebnis ist hier trotzdem das richtige:** VIS-01 verlangt die Fremd-View auf **allen vier** D-04-Zugriffspfaden, dieser Plan liefert den ersten; VIS-02s Einzigkeitsbeweis ist ausdrücklich Plan 07-05. Ein Haken nach Plan 1 von 5 wäre eine Falschaussage gewesen. Beide IDs stehen in der `requirements-completed`-Frontmatter dieses Plans (wie vom Plan vorgegeben) und gehören abgehakt, wenn 07-05 durch ist — der Tooling-Defekt ist bis dahin zu prüfen, sonst hakt sie auch dann niemand ab.

**Der Testlauf-Filter greift anders als im Plan angenommen.** `pnpm --filter @quiks/api test -- foreign-projection` reicht das Argument nicht als vitest-Filter durch, sondern führt die gesamte Suite aus (10 Dateien, 60 Tests — alle grün). Für die gezielte Prüfung der fünf neuen Fälle wurde zusätzlich `npx vitest run test/foreign-projection.spec.ts --reporter=verbose` aus `apps/api` gefahren: 5/5 grün. Kein Defekt, nur eine Notiz für die Folgepläne, deren Akzeptanzkriterien dieselbe Kommandoform nennen.

## Verification Results

Alle fünf Punkte aus `<verification>` des Plans, ehrlich berichtet:

| # | Prüfung | Ergebnis |
|---|---|---|
| 1 | `pnpm --filter @quiks/db db:migrate` idempotent, `0005` in `drizzle.__drizzle_migrations` | **grün** (zweiter Lauf ohne neue Statements; `0005` als letzter Eintrag verbucht) |
| 2 | `pnpm typecheck` workspace-weit | **grün** (10/10 Tasks) — beweist, dass kein Restimport des alten Projektionsnamens existiert |
| 3 | `pnpm lint` | **grün** (10/10 Tasks) |
| 4 | `pnpm --filter @quiks/api test` (gesamte Integrationssuite) | **grün** — 10 Dateien, 60 Tests, inkl. `me-endpoints.spec.ts` und `username-race.spec.ts` |
| 5 | Die neue Tracer-Strecke `foreign-projection.spec.ts` | **grün** — 5/5 Fälle |

Zusätzlich gegen die lebende DB geprüft: beide Tabellen vorhanden · alle drei CHECK-Namen in `information_schema.table_constraints` · `festival_id`-Spaltenzahl 0 · Insert mit `lower_id > higher_id` wird mit `23514` abgewiesen · Spaltensatz von `visitor_profile` unverändert bei 11 Spalten (D-05: keine `searchable`-Spalte, `grep -c searchable 0005_*.sql` = 0) · genau 6 Migrationsdateien.

## Known Stubs

Keine. `toIsoString` in `visitor-projection.ts` ist exportiert, aber in diesem Plan noch nicht aufgerufen — das ist kein Stub, sondern die vom Plan ausdrücklich verlangte Konvention für die Zeitstempel der Listen-Endpunkte in 07-04 (`friendship.createdAt`/`friendRequest.createdAt` reisen als ISO-String). Die Funktion ist vollständig implementiert.

## User Setup Required

None — keine externe Service-Konfiguration nötig, kein neues Paket installiert (T-07-SC: Supply-Chain-Fläche unverändert).

## Next Phase Readiness

**Bereit für die Erweiterungspläne 07-02 bis 07-05.** Alle Symbole, gegen die die späteren Wellen bauen, stehen unter den in `<artifacts_produced>` festgelegten Namen:

- `friendship` / `friendRequest` samt drizzle-zod-Basisschemata (typkorrekt, `.pick()`-fähig)
- `visitorProfileForeignSchema`, `visitorProfileOwnerSchema`, `relationSchema`, `visitorSummarySchema`
- `foreignProfileColumns`, `canonicalPair`, `toIsoString`
- `FriendshipService`, `FriendshipController`, `FriendshipModule` (registriert)

**Hinweise für die Folgepläne:**

- **07-03 (Request-Lifecycle)** braucht als einziger genuin neues Terrain: `this.db.transaction(...)` für den Auto-Accept-Pfad (D-10). Dafür gibt es im Repo weiterhin keinen Präzedenzfall — das Fehler-Mapping-Muster (`cause instanceof PostgresError`, `cause.constraint_name`) ist dagegen 1:1 aus `me.service.ts` übertragbar, und die Constraint-Namen stehen jetzt fest: `friend_request_pair_pk`, `friendship_pair_pk`.
- **07-05 (VIS-02-Einzigkeitstest)** kann sich auf `foreignProfileColumns` als einzigen Anker stützen; im `friendship`-Modul gibt es genau einen `.from(visitorProfile)`-Aufruf, und dessen `.select()` übergibt diese Konstante.
- **Beim OTP-Rate-Limiter aufpassen:** better-auth erlaubt drei Anfragen pro 60 s pro Quelle, jeder `createVisitor` verbraucht eine. Dieser Spec legt bewusst genau zwei Besucher an. Specs, die drei oder mehr brauchen, müssen sich das mit `fileParallelism: false` und den 30-s-Timeouts einteilen.
- **Offen, unverändert:** IDN-02 (per-Feld-Sichtbarkeit, Altersgrenze, Flinta-Filter) — die Fremd-View ist die Stelle, an der sie greifen wird. FRND-09 (Blockieren/Melden) und damit die in T-07-03 bewusst akzeptierte Existenzorakel-Exposition bleiben nach v1.1.

## Self-Check: PASSED

Alle 8 im Plan zugesagten neuen Dateien existieren auf der Platte, die SUMMARY liegt am erwarteten Pfad, und beide Task-Commits (`92bddb7`, `2e7f63d`) sind in `git log --all` auffindbar.
