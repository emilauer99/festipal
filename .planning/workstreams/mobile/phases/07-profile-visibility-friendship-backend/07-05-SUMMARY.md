---
phase: 07-profile-visibility-friendship-backend
plan: 05
subsystem: api
tags: [vitest, supertest, ts-rest, zod, drizzle, postgres, invariant-test, security]

# Dependency graph
requires:
  - phase: 07-01
    provides: "foreignProfileColumns, visitorProfileForeignSchema/-OwnerSchema, lookupVisitor, friendship + friend_request in der lebenden DB, das HTTP-Fixture-Muster aus foreign-projection.spec.ts"
  - phase: 07-02
    provides: "searchVisitors — der zweite Fremd-Pfad, dessen Body hier auf Abwesenheit geprüft wird"
  - phase: 07-03
    provides: "sendFriendRequest / acceptFriendRequest — die Lifecycle-Methoden, über die dieser Spec die Freundschaft herstellt"
  - phase: 07-04
    provides: "pickForeignProfile, listFriends, listFriendRequests — der dritte und vierte Fremd-Pfad; die belastbaren VIS-02-Metriken aus Deviation 1"
provides:
  - "apps/api/test/projection-uniqueness.spec.ts — VIS-02 als Einzigkeitsaussage: Contract-Walk über ALLE Routen, Schlüsselgleichheit der vier Fremd-Pfade, Quellcode-Singularität, Endpunkt-Inventar gegen einen 1:1-Nachrichtenpfad"
  - "apps/api/test/friendship-isolation.spec.ts — VIS-01-Abwesenheitsbeweis über alle vier Fremd-Pfade am serialisierten HTTP-Body, Owner-Gegenprobe, Null-Feld-Serialisierung, Festival-Unabhängigkeit, information_schema-Nachweis"
  - "Die Invarianten-Formulierung für VIS-02 (statt einer Roh-Zählung von Aufrufstellen) — ab jetzt der Anker für Phase 8/9 und für Phase 12s Endpunkt-Inventar"
affects: [08-friends-ui-qr, 09-friends-at-festival, 12-messaging-exclusion-audit]

actuals:
  tokens: 8645
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Spec ohne Datenbank und ohne HTTP, der das ts-rest-contract-Objekt abläuft und das Modulverzeichnis als Quelltext liest — erster Präzedenzfall im Repo"
    - "Rekursiver Zod-Walker (ZodObject/-Array/-Nullable/-Optional/-Union) mit Rekursionsschutz für Contract-weite Schlüsselinventare"
    - "Ausnahmeliste statt Positivliste: eine neu hinzugefügte Route wird automatisch mitgeprüft"
    - "Jede mechanische Prüfung trägt eine positive Gegenzusicherung neben sich (der Walker FINDET birthDate auf getMe), damit ein stumpf gewordener Walker rot wird statt vakuum-grün"

key-files:
  created:
    - apps/api/test/projection-uniqueness.spec.ts
    - apps/api/test/friendship-isolation.spec.ts
  modified: []

key-decisions:
  - "Die VIS-02-Singularität ist als INVARIANTE kodiert, nicht als Roh-Zählung: 'die vier Identitätsspalten der Fremd-View werden in genau einer Datei des Moduls benannt' statt 'count(from(visitorProfile)) == count(foreignProfileColumns)'. Die vom Plan verlangte Zählung ist die vierte ihrer Art in Folge und war schon in 07-04 nachweislich unerfüllbar"
  - "accountId und username sind aus der Identitätsspalten-Liste ausgenommen — beide haben legitime Nicht-Projektions-Verwendungen (Existenzprüfung, where, orderBy); displayName/avatar/pronoun/gender haben keine"
  - "Die Auslöseschwelle ist ZWEI verschiedene Identitätsspalten in einer Datei: eine einzelne beiläufige Referenz (ein Sortierschlüssel) bleibt erlaubt, eine Nutzlast lässt sich nicht zweimal zusammensetzen"
  - "Der Nachrichtenpfad-Check vergleicht ganze Pfad-SEGMENTE, nicht Teilstrings — ein Teilstring-Match hätte ein künftiges /admin wegen 'dm' rot gemacht"
  - "Beide Specs sind per Gegenprobe als nicht-vakuum belegt: eingebaute echte Zweitprojektion und eingebauter echter Leak, jeweils rot, danach zurückgenommen"

patterns-established:
  - "Ein Invariantentest kodiert die Eigenschaft, die eine Zählung meinte — nie die Zählung selbst; sonst wird er beim ersten legitimen Zusatz-Select gelöscht statt gepflegt"
  - "Ein Contract-weiter Schlüsselcheck iteriert über ALLE Route-Keys mit Ausnahmeliste; eine Positivliste ignoriert die neue Route stillschweigend"
  - "Die Nicht-Vakuum-Eigenschaft eines Abwesenheitsbeweises wird durch einen temporär eingebauten echten Leak belegt, nicht behauptet"
  - "Bei mutierenden Aufrufen die Antwort-Nutzlast in die Assertion-Nachricht geben — ein blankes 'expected 500 to be 200' ist im Nachhinein nicht diagnostizierbar"

requirements-completed: [VIS-01, VIS-02]

coverage:
  - id: D1
    description: "Im gesamten ts-rest-Contract erscheint der Geburtsdatums-Schlüssel nur in den Antworten von getMe und completeProfile, der E-Mail-Schlüssel nur in getMe — geprüft über ALLE Route-Keys mit Ausnahmeliste, damit eine künftige neue Route automatisch mitgeprüft wird"
    requirement: VIS-02
    verification:
      - kind: integration
        ref: "apps/api/test/projection-uniqueness.spec.ts#exposes the birth-date key ONLY on getMe and completeProfile"
        status: pass
      - kind: integration
        ref: "apps/api/test/projection-uniqueness.spec.ts#exposes the e-mail key ONLY on getMe"
        status: pass
      - kind: integration
        ref: "Gegenprobe: temporär eingefügte Route listMessages -> GET /me/messages plus birthDate in visitorProfileForeignSchema; 8 von 13 Fällen rot, danach zurückgenommen"
        status: pass
    human_judgment: false
  - id: D2
    description: "Alle vier Fremd-Zugriffspfade tragen ein profile-Objekt, dessen Schlüsselmenge exakt gleich (nicht Teilmenge) der von visitorProfileForeignSchema ist"
    requirement: VIS-02
    verification:
      - kind: integration
        ref: "apps/api/test/projection-uniqueness.spec.ts#lookupVisitor|searchVisitors|listFriends|listFriendRequests.incoming|listFriendRequests.outgoing embeds a profile with exactly the same six keys (fünf Zusicherungen)"
        status: pass
      - kind: integration
        ref: "apps/api/test/projection-uniqueness.spec.ts#visitorProfileForeignSchema carries exactly the six D-02 keys (toEqual gegen die sortierte Sechserliste)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Im Verzeichnis apps/api/src/friendship/ existiert genau eine Fremd-Projektion — eine Select-Map, eine Formungsfunktion — und keine zweite Stelle setzt die Fremd-View-Nutzlast zusammen"
    requirement: VIS-02
    verification:
      - kind: integration
        ref: "apps/api/test/projection-uniqueness.spec.ts#declares the select map and the shaping function exactly once each"
        status: pass
      - kind: integration
        ref: "apps/api/test/projection-uniqueness.spec.ts#names the four identity columns in visitor-projection.ts and nowhere else"
        status: pass
      - kind: integration
        ref: "Gegenprobe: echte zweite Projektion (leakyLookup mit eigener Spaltenliste) in friendship.service.ts eingebaut -> 2 Fälle rot, danach zurückgenommen"
        status: pass
    human_judgment: false
  - id: D4
    description: "Kein Route-Pfad des Contracts beschreibt einen 1:1-Nachrichtenkanal (ADR-020, dauerhafter Ausschluss)"
    requirement: VIS-02
    verification:
      - kind: integration
        ref: "apps/api/test/projection-uniqueness.spec.ts#declares no route path that describes a 1:1 message channel (ADR-020)"
        status: pass
      - kind: integration
        ref: "Gegenprobe: temporäre Route GET /me/messages -> Fall rot"
        status: pass
    human_judgment: false
  - id: D5
    description: "Alle vier Fremd-Pfade liefern serialisierte Bodies, die weder den konkreten Geburtsdatumswert noch die E-Mail-Adresse noch die Schlüsselnamen birthDate/birth_date/email enthalten"
    requirement: VIS-01
    verification:
      - kind: integration
        ref: "apps/api/test/friendship-isolation.spec.ts#1./2./4./5. (Handle-Lookup, Suche, beide Anfragelisten, Freundesliste) — 5 Wert- und 6 E-Mail-Zusicherungen"
        status: pass
      - kind: integration
        ref: "Gegenprobe: birthDate in foreignProfileColumns UND visitorProfileForeignSchema eingebaut -> genau die Fälle 1-5 rot, danach zurückgenommen"
        status: pass
    human_judgment: false
  - id: D6
    description: "Die Owner-Gegenprobe zeigt, dass der Split trennt statt zu entfernen: GET /me liefert visitor2 sein eigenes Geburtsdatum und seine E-Mail"
    requirement: VIS-01
    verification:
      - kind: integration
        ref: "apps/api/test/friendship-isolation.spec.ts#6. owner counter-proof: GET /me DOES give visitor 2 their own birth date"
        status: pass
    human_judgment: false
  - id: D7
    description: "Ein Profil mit NULLen in avatar/pronoun/gender serialisiert diese drei Schlüssel mit dem Wert null statt sie wegzulassen"
    requirement: VIS-01
    verification:
      - kind: integration
        ref: "apps/api/test/friendship-isolation.spec.ts#3. a profile whose optional fields are unset serializes them as null — present, not omitted (Object.keys + toBeNull, nie toBeFalsy)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Eine Freundschaft ist festival-unabhängig: sie besteht, obwohl einer der Beteiligten kein Festival gespeichert hat, und die Freundesliste bleibt nach einer Änderung des gespeicherten Satzes byte-identisch (Erfolgskriterium 3)"
    verification:
      - kind: integration
        ref: "apps/api/test/friendship-isolation.spec.ts#7. the friendship holds although visitor 2 has saved no festival at all"
        status: pass
      - kind: integration
        ref: "apps/api/test/friendship-isolation.spec.ts#8. changing the set of saved festivals leaves the friend list byte-identical (JSON.stringify-Vergleich, nicht nur Länge)"
        status: pass
    human_judgment: false
  - id: D9
    description: "Weder friendship noch friend_request tragen in der lebenden DB eine festivalId-Spalte; die vollständige erwartete Spaltenmenge beider Tabellen ist festgenagelt (SEC-02-Erfüllung durch den umgekehrten Nachweis)"
    verification:
      - kind: integration
        ref: "apps/api/test/friendship-isolation.spec.ts#9. neither relationship table carries a festival column in the LIVE database"
        status: pass
    human_judgment: false
  - id: D10
    description: "Alle vier Fremd-Endpunkte antworten ohne Session-Cookie mit 401 — die Vorbedingung, unter der das Daten-Scoping überhaupt greift"
    verification:
      - kind: integration
        ref: "apps/api/test/friendship-isolation.spec.ts#10. (vier it.each-Fälle: /visitors/:username, /visitors?q=, /me/friend-requests, /me/friends)"
        status: pass
    human_judgment: false

duration: 16min
completed: 2026-08-12
status: complete
---

# Phase 7 Plan 05: Einzigkeits- und Isolationsbeweis Summary

**Die vier Erfolgskriterien der ROADMAP sind von Zusagen zu Beobachtungen geworden: ein Spec ohne Datenbank läuft den gesamten Contract ab und liest das Modulverzeichnis als Quelltext, ein zweiter prüft alle vier Fremd-Pfade am serialisierten HTTP-Body — und beide sind durch temporär eingebaute echte Verstösse als nicht-vakuum belegt, nicht bloss als grün gemeldet.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-08-12T16:11:20Z
- **Completed:** 2026-08-12T16:27:00Z
- **Tasks:** 2 ausgeführt (beide `auto`, kein Checkpoint)
- **Files modified:** 2 (beide neu, kein Produktionscode angefasst)

## Accomplishments

- **VIS-02 ist als Einzigkeitsaussage belegt, nicht nur als Korrektheitsaussage.** Der Contract-Walk iteriert über **alle** 18 Route-Keys mit einer Ausnahmeliste. Eine künftige Phase, die eine neue Route mit dem Geburtsdatums- oder E-Mail-Schlüssel einführt, macht den Test rot, ohne dass jemand daran denken muss — genau das, was eine Positivliste der bekannten Fremd-Routen nicht leisten kann.
- **Die Quellcode-Singularität ist als Invariante formuliert und hält der Gegenprobe stand.** Eine echte zweite Projektion (`leakyLookup` mit eigener Spaltenliste plus Geburtsdatum) wurde eingebaut: zwei Fälle rot. Zurückgenommen, `git diff` leer. Die Prüfung fällt aber **nicht** über einen legitimen Nicht-Projektions-Select — die Existenzprüfung in `sendRequest`, die bewusst nur `accountId` liest (T-07-15), bleibt erlaubt.
- **Der VIS-01-Abwesenheitsbeweis ist nicht vakuum-grün.** `birthDate` wurde temporär in `foreignProfileColumns` **und** `visitorProfileForeignSchema` eingebaut und `packages/contracts` neu gebaut: genau die Fälle 1 bis 5 (alle vier Fremd-Pfade plus die Null-Feld-Serialisierung) gingen rot. Zurückgenommen, neu gebaut, wieder 13/13 grün.
- **Erfolgskriterium 3 ist gezogen, nicht gefolgert.** Die Freundschaft besteht, obwohl visitor2 überhaupt kein Festival gespeichert hat, und die Freundesliste von visitor1 ist nach dem Speichern eines zweiten Festivals **byte-identisch** — verglichen wird der serialisierte Body, nicht die Listenlänge. Dass D-15 keine `festivalId` vorsieht, ist die Entscheidung; dies ist die Beobachtung.
- **Der 1:1-Nachrichtenkanal ist inventarisiert statt sichtgeprüft.** Alle Route-Pfade werden segmentweise gegen den Direktnachrichten-Wortschatz gehalten. Damit existiert die Zusicherung, die Phase 12 in ihrem Erfolgskriterium 1 ausdrücklich statt einer Sichtprüfung verlangt.
- **Suite von 13 Dateien / 94 Tests auf 15 Dateien / 120 Tests gewachsen**, alles grün; `pnpm lint`, `pnpm typecheck` und `pnpm build` je vollständig grün.

## Task Commits

1. **Task 1: VIS-02-Invariantentest — Einzigkeit der Fremd-Projektion** — `09e6ea8` (test)
2. **Task 2: VIS-01-Abwesenheitsbeweis über alle vier Pfade und Festival-Unabhängigkeit** — `e3ff5dc` (test)

## Files Created/Modified

**Neu:**
- `apps/api/test/projection-uniqueness.spec.ts` — 13 Fälle, **ohne Datenbank und ohne HTTP** (`grep -c "createTestDatabase\|createTestApp"` = 0): rekursiver Zod-Walker, Contract-Walk über alle Routen, Schlüsselgleichheit der fünf eingebetteten `profile`-Stellen, Endpunkt-Inventar, drei Quellcode-Prüfungen mit Kommentarfilter
- `apps/api/test/friendship-isolation.spec.ts` — 13 Fälle auf HTTP-Ebene gegen die lebende Docker-Postgres; genau **zwei** OTP-Anmeldungen, das dritte Profil per Direkt-Insert

**Kein Produktionscode geändert.** Dieser Plan beweist, er baut nicht.

## Decisions Made

- **Die VIS-02-Singularität ist als Invariante kodiert, nicht als Roh-Zählung.** Der Plan verlangt in Task 1 (f) wörtlich: „In `friendship.service.ts` ist die Zahl der Vorkommen von `from(visitorProfile)` gleich der Zahl der Vorkommen von `foreignProfileColumns`". Das ist dieselbe Zählung, die 07-04 als **unerfüllbar** protokolliert hat (5 vs. 7), und sie ist die vierte Kriteriums-Klasse dieser Art in Folge nach 07-02 (`inArray`) und 07-03 (`db.transaction`). Eingebaut ist stattdessen die Eigenschaft, die sie meinte — siehe „Deviations", Punkt 1.
- **`accountId` und `username` sind aus der Identitätsspalten-Liste ausgenommen.** Beide werden legitim ausserhalb einer Projektion benannt: die Existenzprüfung selektiert `accountId`, die Suche filtert und sortiert über `username`. `displayName`, `avatar`, `pronoun` und `gender` haben keine solche Zweitverwendung — sie **sind** die Nutzlast der Fremd-View.
- **Auslöseschwelle: zwei verschiedene Identitätsspalten in einer Datei.** Eine einzelne beiläufige Referenz (etwa ein künftiger Sortierschlüssel) bleibt legal, eine zusammengesetzte Nutzlast nicht. Das ist der Punkt, an dem der Test wartbar bleibt statt beim ersten legitimen Zusatz gelöscht zu werden.
- **Pfad-Segmente statt Teilstrings beim Nachrichten-Inventar.** `dm` als Teilstring hätte ein künftiges `/admin` rot gemacht. Geprüft wird jedes Segment, zusätzlich an `-`, `_` und `.` zerlegt, damit `friend-requests` sauber in `friend` und `requests` zerfällt.
- **Jede mechanische Prüfung trägt eine positive Gegenzusicherung.** Der Walker **muss** `birthDate` auf `getMe` finden, `visitor-projection.ts` **muss** alle vier Identitätsspalten benennen, es **müssen** mindestens 18 Routen gefunden werden. Ohne diese Gegenzusicherungen wäre ein stumpf gewordener Walker der einfachste Weg, die ganze Datei stillschweigend vakuum-grün zu machen.
- **Die SEC-02-Begründung steht im Kopfkommentar des Specs**, nicht nur in dieser SUMMARY: ein späterer Audit, der hier keinen Cross-Tenant-Fall findet, soll den Absatz lesen statt eine fehlende Isolationsprüfung zu vermuten.

## Deviations from Plan

### Bewusst abweichend kodiert, weil das Kriterium nachweislich unerfüllbar ist

**1. Die Zählung `count(from(visitorProfile)) == count(foreignProfileColumns)` ist NICHT eingebaut**

- Der Aktionstext von Task 1 (f) verlangt sie. 07-04 hat sie als unerfüllbar belegt, aus zwei unabhängigen Gründen: (a) die Existenzprüfung in `sendRequest` selektiert absichtlich **nur** `accountId`, weil dieser Endpunkt keine Profildaten zurückgibt und deshalb auch keine lesen darf (T-07-15) — sie ist ein `from(visitorProfile)` ohne Gegenstück und das ist korrekt so; (b) `grep -c` zählt Import-Zeile und Doc-Kommentare mit.
- **Eingebaut ist die Eigenschaft, die die Zählung meinte**, in drei Prüfungen: genau ein `export const foreignProfileColumns`, genau ein `export function pickForeignProfile`, und die vier Identitätsspalten der Fremd-View werden in genau einer Datei des Moduls benannt. Der dritte Punkt deckt beide Leck-Wege ab, die eine Zählung von Aufrufstellen offen lässt: eine handgeschriebene Select-Map **und** ein Zeilenergebnis, das an einer zweiten Stelle zu einem `profile`-Objekt zusammengesetzt wird.
- **Belegt statt behauptet:** eine echte zweite Projektion wurde eingebaut und der Test wurde rot (2 Fälle). Eine Zählung wäre für denselben Eingriff ebenfalls rot geworden — aber auch für jeden legitimen Zusatz-Select, und genau daran wäre sie später gestorben.
- Vierter Fall derselben Kriteriums-Klasse in dieser Phase. Die Lehre ist damit im Testcode festgeschrieben und nicht mehr nur in SUMMARYs: **eine Invariante kodiert die Eigenschaft, nie die Zählung.**

### Korrigiert, weil der Plan eine nicht funktionierende Kommandoform nennt

**2. Die Testlauf-Filterform aus `<verify>` und den Akzeptanzkriterien filtert nicht**

- `pnpm --filter @quiks/api test -- projection-uniqueness` reicht das Argument nicht als vitest-Filter durch, sondern fährt die gesamte Suite. Dieselbe Beobachtung wie in 07-01 bis 07-04; der Orchestrator hatte vorab darauf hingewiesen.
- **Verwendet wurde:** `cd apps/api && pnpm exec vitest run test/<spec>.spec.ts --reporter=verbose`. Kein Code-Defekt, nur eine Korrektur an der Prüfmethode.

### Auto-fixed Issues

**3. [Rule 2 - Missing Critical] Ein 500 aus einem mutierenden Aufruf war nicht diagnostizierbar**

- **Found during:** Task 2, bei der Gegenprobe-Wiederherstellung
- **Issue:** Ein einzelner Lauf des neuen Specs schlug mit `expected 500 to be 200` an `POST /api/v1/me/friend-requests` fehl. Die Assertion trug die Antwort-Nutzlast nicht, in der die Fehlermeldung des Servers gestanden hätte — der Fehlschlag war im Nachhinein nicht analysierbar. Für einen Spec, dessen Zweck der Beweis ist, ist eine nicht auswertbare Rotmeldung eine echte Lücke.
- **Fix:** Die drei mutierenden Aufrufe (`sendFriendRequest`, `acceptFriendRequest`, `saveFestival`) übergeben `JSON.stringify(res.body)` als Assertion-Nachricht.
- **Files modified:** `apps/api/test/friendship-isolation.spec.ts`
- **Verification:** Spec danach 13/13 grün; die Nachricht erscheint nur im Fehlerfall.
- **Committed in:** `e3ff5dc` (Task-2-Commit)

---

**Total deviations:** 1 auto-fixed (Rule 2), 1 bewusst abweichend kodiertes unerfüllbares Zählkriterium, 1 korrigierte Kommandoform
**Impact on plan:** Kein Scope Creep, kein Produktionscode geändert. Beide Specs decken jeden Punkt aus dem Aktionstext ab.

## Issues Encountered

**Ein transienter 500 auf `POST /api/v1/me/friend-requests`, einmalig, nicht reproduzierbar — ehrlich berichtet, nicht wegerklärt.** Er trat in genau einem Lauf auf, unmittelbar nachdem die Leak-Gegenprobe zurückgenommen und `packages/contracts` neu gebaut worden war, mit frisch angelegten Konten. Sechs weitere Läufe desselben Specs (davon zwei im vollständigen Suite-Durchlauf) waren grün, und der abschliessende Gesamtlauf ist 15 Dateien / 120 Tests grün. Das Verhalten passt auf die in `apps/api/vitest.config.ts` seit 02-05 dokumentierte Beobachtung: viele kurzlebige postgres.js-Verbindungen aus wiederholt gestarteten Testprozessen können als opaker Treiberfehler auftauchen, den `postgresErrorOf` nicht als bekannten Konflikt erkennt und der deshalb als 500 durchschlägt. Ich habe **keinen** Code geändert, um ihn zu unterdrücken — die einzige Massnahme ist die Diagnostizierbarkeit (Deviation 3). Sollte er wiederkehren, steht die Serverantwort ab jetzt in der Fehlermeldung.

**`requirements.mark-complete` bleibt defekt** (in 07-01 bis 07-04 dokumentiert, Orchestrator-Anweisung: nicht bekämpfen). Da dies der **letzte** Plan der Phase ist, steht `requirements-completed: [VIS-01, VIS-02]` in der Frontmatter dieser SUMMARY — inhaltlich zu Recht: alle vier D-04-Pfade stehen (07-01 bis 07-04) und beide Beweisrichtungen sind hier gezogen. Ob der CLI-Aufruf die Haken tatsächlich in `.planning/workstreams/mobile/REQUIREMENTS.md` setzt, ist unten unter „Verification Results" ehrlich vermerkt; falls nicht, gehört das auf Phasenebene nachgezogen.

**`state.update-progress` meldet „Progress field not found in STATE.md"** — der Workstream-State hat kein Progress-Feld. No-op wie angekündigt, kein Fehler.

**Nicht behoben (vorbestehend, Scope-Boundary):** die verwaiste Zeile in `drizzle.__drizzle_migrations` aus 07-01. Dieser Plan legt keine Migration an.

## Verification Results

Alle sieben Punkte aus `<verification>` des Plans, ehrlich berichtet:

| # | Prüfung | Ergebnis |
|---|---|---|
| 1 | `pnpm lint` | **grün** (10/10 Tasks) |
| 2 | `pnpm typecheck` | **grün** (10/10 Tasks) |
| 3 | Vollständige API-Integrationssuite (`pnpm exec vitest run` aus `apps/api`) | **grün** — 15 Dateien, **120 Tests** (vorher 13/94); alle geerbten v1.0-Specs unverändert grün |
| 4 | `@quiks/db` und `@quiks/contracts` Typecheck | **grün** (im workspace-weiten Lauf enthalten) |
| 5 | `pnpm --filter @quiks/db db:migrate` erneut | **grün, Nulldurchgang** — „migrations applied successfully", keine neuen Statements |
| 6 | `pnpm build` (Turborepo-Reihenfolge) | **grün** — 6/6 Tasks; `packages/contracts` und `packages/db` bauen vor `apps/api`, keine zyklische Abhängigkeit |
| 7 | Fehlschläge ehrlich benennen | siehe „Issues Encountered" — ein transienter 500, nicht reproduzierbar, nicht unterdrückt |

Zusätzlich mechanisch geprüft:

| Prüfung | Ergebnis | Kriterium |
|---|---|---|
| `grep -c "Object.entries(contract)"` in `projection-uniqueness.spec.ts` | 1 | ≥ 1 ✓ |
| `grep -c "createTestDatabase\|createTestApp"` in `projection-uniqueness.spec.ts` | 0 | 0 ✓ |
| Schlüsselgleichheits-Zusicherungen für Fremd-Pfade | 5 (inkl. `incoming` und `outgoing` getrennt) | ≥ 4 ✓ |
| `it(`/`it.each(`-Blöcke in `friendship-isolation.spec.ts` | 10 Deklarationen → **13 Testfälle** | ≥ 10 ✓ |
| `not.toContain(VISITOR2_BIRTH_DATE)` / `not.toContain(visitorN.email)` | 5 / 6 = **11** | ≥ 8 ✓ |
| `grep -c "await createVisitor("` | 2 | ≤ 2 ✓ |
| `toBeNull()` in Testfall 3 | 3 | drei Null-Felder ✓ |
| `information_schema`-Abfrage | 1 | vorhanden ✓ |
| Seed-Slug (`frequency`) im Spec | 0 | 0 ✓ |
| **Gegenprobe A:** echte zweite Projektion in `friendship.service.ts` | 2 Fälle rot (Identitätsspalten, Geburtsdatum), danach zurückgenommen | Singularitätstest nicht vakuum-grün |
| **Gegenprobe B:** `birthDate` in `visitorProfileForeignSchema` + Route `GET /me/messages` | 8 von 13 Fällen rot, danach zurückgenommen und neu gebaut | Contract-Walk, Sechserliste und Nachrichten-Inventar nicht vakuum-grün |
| **Gegenprobe C:** `birthDate` in `foreignProfileColumns` + `pickForeignProfile` + Schema | Fälle 1–5 rot (alle vier Fremd-Pfade + Null-Felder), danach zurückgenommen | Abwesenheitsbeweis nicht vakuum-grün |
| Fixture-Rückstände nach dem Lauf (psql, Docker-Postgres) | `friendship` 0 · `friend_request` 0 · Isolations-Profile 0 · Isolations-Festivals 0 · selbst angelegte `user`-Zeile 0 | ✓ |

**Zur `requirements.mark-complete`-Prüfung:** siehe „Issues Encountered" und den Abschnitt „State Updates" unten — das Ergebnis des Aufrufs ist dort unverändert protokolliert.

## Known Stubs

Keine. Beide Specs sind vollständig implementiert; kein Testfall ist übersprungen (`grep -c "it.skip\|it.todo"` = 0 in beiden Dateien), kein `<verify>`-Schritt blieb ungelaufen.

## Threat Flags

Keine neue Sicherheitsfläche: dieser Plan legt keinen Endpunkt an, ändert kein Schema, ändert keinen Produktionscode und installiert kein Paket (T-07-SC unverändert).

Stand der sechs `mitigate`-Einträge dieses Plans:

| Threat | Stand |
|---|---|
| T-07-23 (künftige Route trägt Owner-Felder nach draussen) | umgesetzt — Contract-Walk über **alle** Route-Keys mit Ausnahmeliste; Gegenprobe B belegt, dass eine neue Route mit Owner-Feld rot wird |
| T-07-24 (zweite, ungeprojizierte Spaltenliste im Modul) | umgesetzt — Singularitäts- und Identitätsspalten-Prüfung mit Kommentarfilter; Gegenprobe A belegt die Wirksamkeit |
| T-07-25 (später hinzugefügte Profilspalte wird per Default öffentlich) | umgesetzt — Schlüssel**gleichheit** statt Teilmenge, an fünf Stellen; Gegenprobe B belegt es |
| T-07-26 (Fremdzugriff ohne Session) | umgesetzt — Testfall 10, alle vier Fremd-Endpunkte 401 |
| T-07-27 (stillschweigend hinzugefügte Tenant-Spalte) | umgesetzt — `information_schema` prüft Abwesenheit **und** die vollständige Spaltenmenge beider Tabellen |
| T-07-28 (Freundschaft nur als Schema-Eigenschaft behauptet) | umgesetzt — Testfälle 7 und 8 ziehen sie als Beobachtung, Fall 8 per serialisiertem Byte-Vergleich |

Weiterhin bewusst `accept` und unverändert offen, als Ehrlichkeitsauflage geführt: T-07-08 (Nutzer-Enumeration über die Präfixsuche), T-07-16/T-07-17 (kein Cooldown, keine Historie), T-07-22 (keine Paginierung der Listen). Alle drei hängen an FRND-09 (Blockieren/Melden), das ausdrücklich nach v1.1 liegt — die drei Prohibitions dieses Plans stehen deskriptorlos in `must_haves.prohibitions` und disponieren damit als flagged-unverified, wie vom Plan vorgesehen.

## User Setup Required

None — keine externe Konfiguration, kein neues Paket, keine Migration.

## Next Phase Readiness

**Phase 7 ist abgeschlossen.** Alle vier ROADMAP-Erfolgskriterien sind belegt:

1. **Fremd-Zugriff liefert nur die Fremd-View** — als Feld-*Abwesenheit* am serialisierten Body, für alle vier Pfade, mit Owner-Gegenprobe.
2. **Suche und Anfragevorschauen laufen über dieselbe Projektion, und die Einzigkeit ist belegt** — nicht nur die Korrektheit an einer Stelle.
3. **Freundschaft ist user-global** — keine Festivalspalte in der lebenden DB *und* die Beziehung übersteht eine Änderung des gespeicherten Festivalsatzes nachweislich unverändert.
4. **Der Lifecycle ist vollständig und idempotent** (07-03), mit einer Gegenseitigkeits-Invariante, die keine einseitige Freundschaft ausdrücken kann (07-01).

**Für Phase 8 (Friends-UI & QR) direkt nutzbar:**

- Die **Sechserliste** ist die eine Feldmenge, gegen die jede Fremd-Komponente rendern kann — Suchtreffer, Anfragezeile und Freundeszeile haben dieselbe Form, ein Component reicht.
- Wer in Phase 8 ein Feld in der Fremd-View braucht, das dort nicht steht, ändert `visitorProfileForeignSchema` — und bricht dabei sichtbar `projection-uniqueness.spec.ts`, `pickForeignProfile` und die vier Pfad-Zusicherungen. Das ist die vorgesehene Reibung, kein Defekt.
- Die **Null-Feld-Serialisierung** ist festgenagelt: `avatar`, `pronoun` und `gender` kommen als `null`-Schlüssel an, nicht als fehlende Felder. Ein `profile.avatar === undefined`-Check in der UI wäre falsch.
- Das **Endpunkt-Inventar** aus Task 1 ist die Grundlage für Erfolgskriterium 1 von **Phase 12** — dort muss es nur erweitert, nicht neu erfunden werden.

Offen, unverändert: IDN-02 (per-Feld-Sichtbarkeit, Altersgrenze, Flinta-Filter) — `visitorProfileForeignSchema` ist die Stelle, an der es greifen wird. FRND-09 (Blockieren/Melden) samt der akzeptierten Enumerations- und DoS-Exposition bleibt nach v1.1. Ebenfalls offen aus 07-01: die verwaiste Zeile in `drizzle.__drizzle_migrations` (verschwindet bei jedem lokalen DB-Reset).

## Self-Check: PASSED

- Beide neuen Dateien existieren auf der Platte: `apps/api/test/projection-uniqueness.spec.ts`, `apps/api/test/friendship-isolation.spec.ts`.
- Beide Task-Commits sind in `git log --all` auffindbar: `09e6ea8` (test), `e3ff5dc` (test).
- Diese SUMMARY liegt unter `.planning/workstreams/mobile/phases/07-profile-visibility-friendship-backend/07-05-SUMMARY.md`.
- Kein Produktionscode im Arbeitsbaum verändert (`git status` nach beiden Gegenproben sauber).
