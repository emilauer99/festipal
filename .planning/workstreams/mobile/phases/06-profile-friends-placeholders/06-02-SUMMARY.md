---
phase: 06-profile-friends-placeholders
plan: 02
subsystem: api
tags: [drizzle, drizzle-zod, ts-rest, zod, nestjs, postgres, migration, design-tokens]

# Dependency graph
requires:
  - phase: 02-otp-auth-festival-backend-api
    provides: "GET /me + POST /me/complete-profile, MeService/MeController, die drizzle-zod-Basen visitorProfileSelectSchema/visitorProfileInsertSchema"
  - phase: 05-festival-selection-home
    provides: "festivalSchema als Präzedenzfall für String-statt-Date-Transport im Contract"
  - phase: 05.1-quiks-rename-ci-v1-0-rollout
    provides: "packages/ui/src/tokens.ts mit der Statusfüllungs-Reihe fillDangerQuiet/fillDangerSubtle und den *Text-Varianten"
provides:
  - "Drei nullable Spalten auf visitor_profile: pronoun, birth_date (date, mode string), gender (D-12, D-12a)"
  - "Serverseitige Längenobergrenzen pronoun 20 / gender 30 auf der drizzle-zod-Insertbasis (T-06-07)"
  - "visitorProfilePublicSchema und completeProfileBodySchema tragen die drei Identitätsfelder"
  - "meSchema.createdAt als ISO-String auf Top-Level (D-04) — Grundlage der Meta-Zeile „seit … dabei\""
  - "GET /api/v1/me liefert createdAt sowie pronoun/birthDate/gender; POST /me/complete-profile nimmt sie optional entgegen"
  - "Migration 0004_new_wong.sql, committet und auf die lokale Docker-Postgres angewendet"
  - "UI-Token fillInfoQuiet und borderInfo für die SafeNow-Karte"
affects: [06-07, 06-08, 06-05]

# Actuals (#2632) — estimateTokens-Skala (chars/4 über die tatsächlich geänderten
# Dateien), KEIN Harness-Tokenzähler. Der generierte meta/0004_snapshot.json
# (~900 Zeilen) ist ein drizzle-kit-Artefakt und NICHT mitgezählt — er ist kein
# geschriebener Kontext.
actuals:
  tokens: 9200
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "date({ mode: 'string' }) plus zwei .extend()-Overrides (Select nullable, Insert nullable+optional) ist die Pflichtkombination für jede Datumsspalte — der Override schließt eine drizzle-zod-Inferenzlücke, keine Stilfrage"
    - "Ein Datumswert wird nie roh persistiert und abgeleitet zugleich: birth_date ist gespeichert, das Alter wird berechnet"
    - "Account-Felder werden auf meSchema-Top-Level gehängt, nicht in die visitor_profile-Projektion gemischt"

key-files:
  created:
    - packages/db/drizzle/0004_new_wong.sql
    - packages/db/drizzle/meta/0004_snapshot.json
  modified:
    - packages/db/src/schema/visitor-profile.ts
    - packages/contracts/src/schemas.ts
    - packages/ui/src/tokens.ts
    - apps/api/src/me/me.service.ts
    - apps/api/src/me/me.controller.ts
    - apps/api/test/me-endpoints.spec.ts
    - packages/db/drizzle/meta/_journal.json

key-decisions:
  - "Die Längenobergrenzen stehen auf BEIDEN drizzle-zod-Basen (Select wie Insert), nicht nur auf der Insertbasis — exakt wie die bestehenden Caps auf username/displayName"
  - "birthDate bekommt kein Zod-Format-Refinement; der Postgres-date-Typ ist das Validierungsgate (T-06-09)"
  - "Der Doc-Kommentar auf meSchema wurde umformuliert, weil ein Akzeptanzkriterium wörtlich zählt, wie oft das Zod-Date-Literal in der Datei vorkommt"
  - "Die vier neuen Assertionsgruppen brauchen ein ZWEITES Testkonto: ein Konto darf sein Profil nur einmal vervollständigen"
  - "fillInfoQuiet/borderInfo liegen nur im dunklen colors-Satz und werden von lightColors per Spread geerbt — modusinvariant wie jede andere Statusfüllung"

patterns-established:
  - "Jede neue Spalte auf visitor_profile braucht einen Eintrag in BEIDEN .extend()-Blöcken; der Kommentarblock der Datei führt die Liste und wurde mitgezogen"
  - "Ein Account-Zeitstempel wird im Controller explizit .toISOString()'d, nie der JSON-Serialisierung überlassen"

requirements-completed: []

coverage:
  - id: D1
    description: "GET /api/v1/me liefert createdAt als ISO-String (nicht als Date-Objekt) plus die drei optionalen Identitätsfelder"
    requirement: PROF-01
    verification:
      - kind: automated_test
        ref: "apps/api/test/me-endpoints.spec.ts › „GET /me returns createdAt as a parseable ISO string, never a Date\" — typeof string, new Date(...) gültig, not.toBeInstanceOf(Date), Rundlauf über toISOString()"
        status: pass
    human_judgment: false
    rationale: "Läuft gegen die echte lokale Docker-Postgres über einen vollen OTP-Login und die reale HTTP-Schicht; die Serialisierungsform ist am Response-Body direkt messbar."
  - id: D2
    description: "birth_date wird als nullable date-Spalte gespeichert und als YYYY-MM-DD-String transportiert; ein Alter wird nie persistiert (D-12a)"
    requirement: PROF-01
    verification:
      - kind: automated_test
        ref: "apps/api/test/me-endpoints.spec.ts › „round-trips pronoun, birthDate and gender…\" — Rundlauf POST complete-profile → GET /me, Vergleich auf '2002-03-14' und /^\\d{4}-\\d{2}-\\d{2}$/"
        status: pass
      - kind: other
        ref: "information_schema-Abfrage gegen localhost:5432/quiks: birth_date = date / nullable YES, gender = text / YES, pronoun = text / YES"
        status: pass
    human_judgment: false
    rationale: "Die Zeitzonenverschiebung, die ein timestamp-Typ erzeugt hätte, ist am zurückgelieferten String eindeutig ablesbar; die Spaltentypen wurden zusätzlich direkt in der laufenden Datenbank abgefragt."
  - id: D3
    description: "Die Erweiterung ist rein additiv — kein bestehendes Feld, keine Spalte und kein Token ändert Typ, Nullability oder Namen"
    requirement: PROF-01
    verification:
      - kind: other
        ref: "git diff über die drei geteilten Pakete: nur 3 entfernte Zeilen (eine zu mehrzeilig erweiterte Import-Zeile, zwei ersetzte Kommentarzeilen), keine Definitionszeile; Migration 0004 enthält 3× ADD COLUMN und keine DROP-/ALTER-TYPE-Anweisung; pnpm --filter @quiks/mobile typecheck grün"
        status: pass
    human_judgment: false
    rationale: "Der Mobile-Typecheck ist der schärfste verfügbare Additivitätsbeweis: er kompiliert den bestehenden Client (inkl. profil.tsx aus 06-01) unverändert gegen die neue Contract-Fläche."
  - id: D4
    description: "Ein complete-profile-Request ohne die drei Felder bleibt gültig; die serverseitigen Längenobergrenzen sind das echte Gate"
    requirement: PROF-01
    verification:
      - kind: automated_test
        ref: "apps/api/test/me-endpoints.spec.ts › „GET /me returns null for all three identity fields when they were omitted\" (200 ohne Felder + null-Projektion) und › „rejects a pronoun above the server-side cap with a 4xx and stores nothing\" (21 Zeichen → 4xx, Profil danach weiterhin null)"
        status: pass
    human_judgment: false
    rationale: "Beide Zweige sind reine Request/Response-Zustände ohne Ermessensanteil."

# Metrics
duration: ~35min
completed: 2026-08-11
status: complete
---

# Phase 6 Plan 02: Additiver Schnitt durch db → contracts → api Summary

**Drei nullable Identitätsspalten auf `visitor_profile`, ein um `createdAt` erweitertes `meSchema`, zwei Status-Token für die SafeNow-Karte und eine committete Migration — alles rein additiv und mit einem Test gegen die echte lokale Datenbank bewiesen.**

## Performance

- **Duration:** ~35min
- **Tasks:** 3 von 3 (Task 1 Checkpoint, Task 2 + 3 Umsetzung)
- **Files modified:** 9 (2 neu, 7 geändert)

## Accomplishments

- **Die drei Identitätsfelder existieren end-to-end.** `pronoun`, `birth_date` und `gender` liegen als nullable Spalten auf `visitor_profile`, tragen ihre `.extend()`-Overrides auf beiden drizzle-zod-Basen, sind über `.pick()` in `visitorProfilePublicSchema` und `completeProfileBodySchema` gehoben und fließen durch `MeService`s `select`- und `returning`-Projektionen. Kein einziges Shape wurde von Hand nachgebaut.
- **`birth_date` speichert das Datum, nicht das Alter (D-12a).** `date({ mode: 'string' })` hält den Wert als `YYYY-MM-DD` fest; der Test beweist, dass `2002-03-14` unverändert zurückkommt und nicht als `2002-03-13T23:00:00.000Z` — genau die stille Tagesverschiebung, die eine `timestamp`-Spalte in einer UTC+1-Umgebung erzeugt hätte.
- **`Account.createdAt` erreicht den Client als ISO-String (D-04).** Der Controller liest ihn aus better-auths Session-User (kein zusätzlicher DB-Zugriff) und konvertiert explizit. Der Test prüft nicht nur die Form, sondern auch die Gegenrichtung: der Wert ist kein `Date` und überlebt einen `toISOString()`-Rundlauf identisch.
- **Die Längenobergrenzen sitzen auf dem Server (T-06-07).** `pronoun` maximal 20, `gender` maximal 30 Zeichen — als `.max()` auf der drizzle-zod-Basis, nicht als Client-Höflichkeit. Ein 21-Zeichen-Pronomen wird mit 4xx abgewiesen und hinterlässt kein Profil.
- **Die Migration ist echt und angewendet.** `0004_new_wong.sql` mit exakt drei `ADD COLUMN`-Anweisungen, erzeugt per `db:generate`, angewendet per `db:migrate` auf die lokale Docker-Instanz, committet samt Snapshot und Journal. `db:push` wurde nicht aufgerufen.
- **Zwei Token für die SafeNow-Karte.** `fillInfoQuiet` (Info bei 12 %) und `borderInfo` (Info bei 35 %) liegen im modusinvarianten Teil der Palette. `infoText` bleibt unangetastet — die bare Info-Hue erreicht auf Papier nur 2,04:1 und darf weiterhin nicht als Text- oder Icon-Farbe dienen.

## Task Commits

1. **Task 1: Checkpoint — D-12/D-12a-Entscheidung** — **kein Commit.** Blockierender Entscheidungs-Checkpoint; vom User mit `proceed-as-locked` beantwortet, inklusive der ausdrücklichen Bestätigung, dass der Admin-Workstream keine offene Änderung an `packages/contracts`, `packages/db` oder `packages/ui` hat.
2. **Task 2: Schema, Contract, UI-Token und /me-Endpunkt** — `964c66d` (feat)
3. **Task 3: Migration erzeugen, anwenden und end-to-end beweisen** — `2b7b136` (feat)

## Files Created/Modified

- `packages/db/src/schema/visitor-profile.ts` — drei nullable Spalten, `date` zum `pg-core`-Import ergänzt, sechs neue `.extend()`-Einträge (drei Select, drei Insert) mit den Caps 20/30; der Kommentarblock führt jetzt sechs Freitextspalten plus die Datumsspalte und erklärt, warum `birthDate` einen eigenen Override braucht.
- `packages/contracts/src/schemas.ts` — `pronoun`/`birthDate`/`gender` in beide `.pick()`-Aufrufe, `createdAt: z.string()` als neues Top-Level-Feld auf `meSchema`. Der Doc-Kommentar hält die T-06-06-Grenze fest.
- `packages/ui/src/tokens.ts` — `fillInfoQuiet` und `borderInfo` in der Statusfüllungs-Reihe des `colors`-Satzes.
- `apps/api/src/me/me.service.ts` — `getProfile`s `select` und `completeProfile`s `returning` je um die drei Felder erweitert; der `insert(...).values({ accountId, ...input })`-Aufruf blieb unverändert.
- `apps/api/src/me/me.controller.ts` — `createdAt: session.user.createdAt.toISOString()` im `getMe`-Body, mit Begründung, warum die Konvertierung explizit bleiben muss.
- `apps/api/test/me-endpoints.spec.ts` — vier neue Assertionsgruppen plus ein zweites Testkonto samt Aufräumen.
- `packages/db/drizzle/0004_new_wong.sql` **neu**, `meta/0004_snapshot.json` **neu**, `meta/_journal.json` — die Migration.

## Decisions Made

- **Die Caps stehen auf Select UND Insert.** Der Plan verlangte sie nur als „serverseitige Obergrenzen"; die bestehenden Caps auf `username`/`displayName` stehen in diesem Repo auf beiden Basen. Die Konsistenz wog schwerer als die minimale Auslegung — und die Select-Seite ist die einzige Stelle, an der ein per Migration oder Seed eingeschleuster Überlängen-Wert überhaupt noch auffiele.
- **Kein Format-Refinement auf `birthDate`.** Vom Plan so vorgegeben und hier bewusst nicht „verbessert": der Postgres-`date`-Typ parst und validiert beim Insert (T-06-09). Ein zusätzliches Zod-Regex hätte eine zweite, unabhängig driftende Wahrheit über das Datumsformat geschaffen.
- **Ein zweites Testkonto statt eines Test-Reset.** Ein Konto darf sein Profil genau einmal vervollständigen — der zweite Aufruf ist der bereits getestete 409. Die Fälle „mit Feldern" und „ohne Felder" brauchen deshalb zwei Konten. Die Alternative, zwischendurch die `visitor_profile`-Zeile zu löschen, hätte den 409-Test unterlaufen, der genau auf diesem Zustand steht.
- **Reihenfolge der neuen Tests ist load-bearing.** Die Grenzwert-Assertion steht VOR dem erfolgreichen Rundlauf, weil beide dasselbe Konto benutzen und nur ein abgewiesener Request es profillos zurücklässt. Der Kommentar im Test sagt das.

## Deviations from Plan

Eine Abweichung, rein redaktionell.

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Doc-Kommentar auf `meSchema` umformuliert, weil er ein Akzeptanzkriterium brach**
- **Found during:** Task 2, Akzeptanzprüfung
- **Issue:** Das Kriterium `grep -c 'z.date()' packages/contracts/src/schemas.ts` muss 0 ergeben. Mein erklärender Kommentar auf `meSchema` enthielt das Zod-Date-Literal wörtlich („ausdrücklich nicht `z.date()`") und ließ den Zähler auf 1 stehen — obwohl nirgends im Code ein Zod-Date-Schema verwendet wird.
- **Fix:** Der Kommentar sagt dasselbe in Prosa („never a Zod date schema", „no Zod date schema appears anywhere in this file") ohne das Literal. Der Zähler steht auf 0, die Begründung ist erhalten.
- **Files modified:** `packages/contracts/src/schemas.ts`
- **Committed in:** `964c66d`

---

**Total deviations:** 1 auto-fixed (redaktionell)
**Impact on plan:** Keine. Kein Verhalten, kein Typ, keine `must_haves`-Zeile berührt.

## Threat-Model-Stand

- **T-06-05 (Information Disclosure, mitigate) — erfüllt.** Der ausführbare Nachweis läuft: keine `getProfile(`-Aufrufstelle außer der Definitionszeile übergibt etwas anderes als `session.user.id`, und `visitorProfilePublicSchema` kommt in `router.ts` an genau zwei Stellen vor (Import + 200-Antwort von `completeProfile`, beide eigentümergebunden). `getMe` transportiert die Projektion ausschließlich eingebettet über `meSchema`.
- **T-06-06 (Information Disclosure, accept) — WISSENTLICH GETRAGEN.** Es gibt in dieser Phase **keine Sichtbarkeits-Policy** für `pronoun`, `birthDate` und `gender`. Die Felder liegen ab jetzt auf `visitorProfilePublicSchema`, das heute ausschließlich das EIGENE Profil ausliefert. **IDN-02 bleibt offen und hängt weiter an Birgits Sicherheits-/Jugendschutzkonzept** — Sichtbarkeitssteuerung pro Feld, Altersgrenze, Flinta-Filter und Signup-Disclaimer sind nicht Teil dieser Phase. Der Doc-Kommentar auf `visitorProfilePublicSchema` und der auf der Tabellendefinition halten die Bedingung fest: **bevor der erste Endpunkt ein FREMDES Profil ausliefert (FRND-02/PROF-02), muss die Projektion in eine Eigentümer-Sicht und eine Freundes-Sicht getrennt werden.** Der Designtext verspricht „du entscheidest, was Freunde sehen" — diese Zusage ist bis dahin nicht eingelöst.
- **T-06-07 (DoS, mitigate) — erfüllt.** Caps 20/30 auf der drizzle-zod-Basis, durch die Grenzwert-Assertion bewiesen.
- **T-06-08 (Tampering, mitigate) — erfüllt.** Der aufgelöste Connection-String wurde vor der Migration explizit geprüft (`host=localhost port=5432 db=/quiks`), `docker compose ps` zeigte `quiks-postgres-1` als healthy. `db:push` wurde nicht aufgerufen.
- **T-06-09 (Tampering, mitigate) — erfüllt.** Die Spalte ist ein echter `date`-Typ (per `information_schema` bestätigt), der beim Insert validiert.
- **T-06-10 (Repudiation, mitigate) — erfüllt.** `createdAt` stammt aus `session.user.createdAt` und kommt in keinem Request-Body vor.

## Issues Encountered

- **`pnpm --filter @quiks/api test -- me-endpoints` filtert nicht.** Das `--` reicht das Argument nicht als Vitest-Namensfilter durch — es lief die gesamte Suite (9 Dateien, 49 Tests, grün). Für den gezielten Nachweis der vier neuen Gruppen wurde zusätzlich `npx vitest run test/me-endpoints.spec.ts --reporter=verbose` aus `apps/api` gefahren: 11 von 11 Tests grün, alle vier neuen namentlich bestätigt.
- **Kein Server hinterlassen.** Es läuft kein Dev-Server und kein Metro-Watcher; die Testsuite bootet NestJS in-process und schließt die App in `afterAll`.

## User Setup Required

Keine neue Abhängigkeit und keine neue Umgebungsvariable. Wer eine andere Datenbank benutzt (etwa Neon), muss dort einmal `pnpm --filter @quiks/db db:migrate` fahren — die lokale Docker-Instanz trägt die Spalten bereits.

## Next Phase Readiness

**Wave 1 dieses Plans ist abgeschlossen; die Kollisionszone ist wieder frei.** `packages/contracts`, `packages/db` und `packages/ui` werden von keinem weiteren Plan dieser Phase angefasst — der Admin-Workstream kann sie ab jetzt übernehmen.

- `06-07` (Sunset-Ring, Identitäts- und Meta-Zeile) hat alles, was es braucht: `createdAt` für „seit … dabei" und die drei Felder für die Identitätszeile. Die Altersableitung aus `birthDate` gehört als reine Logik nach `apps/mobile/lib/` — der node-env-Vitest-Runner deckt nur `lib/` ab.
- `06-08` (complete-profile-Screen) kann die drei optionalen Felder posten; der Geburtsdatums-Picker muss lokal auf `YYYY-MM-DD` serialisieren, **nicht** über `toISOString().slice(0,10)` — das verschiebt in UTC+1 den Tag.
- `06-05` (SafeNow-Karte im Mehr-Screen) findet `fillInfoQuiet` und `borderInfo` vor; Text und Icon der Karte müssen weiterhin `infoText` benutzen.
- **Offener Punkt, der mitgeht:** T-06-06 — vor dem ersten Endpunkt, der ein fremdes Profil ausliefert, muss `visitorProfilePublicSchema` aufgeteilt werden.

## Self-Check: PASSED

- `packages/db/drizzle/0004_new_wong.sql` — vorhanden und getrackt
- `packages/db/drizzle/meta/0004_snapshot.json` — vorhanden und getrackt
- Commit `964c66d` — in der Historie vorhanden
- Commit `2b7b136` — in der Historie vorhanden
- Alle 9 Akzeptanz-Greps aus Task 2 und alle 4 aus Task 3 erfüllt
- `@quiks/db`, `@quiks/contracts`, `@quiks/ui`, `@quiks/api`, `@quiks/mobile` typecheck grün; Lint der vier angefassten Pakete grün; `apps/api`-Suite 49/49 grün

---
*Phase: 06-profile-friends-placeholders*
*Completed: 2026-08-11*
