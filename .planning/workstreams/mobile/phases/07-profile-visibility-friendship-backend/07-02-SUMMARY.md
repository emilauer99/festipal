---
phase: 07-profile-visibility-friendship-backend
plan: 02
subsystem: api
tags: [drizzle, postgres, ts-rest, zod, nestjs, vitest, supertest, search]

# Dependency graph
requires:
  - phase: 07-01
    provides: "foreignProfileColumns (die EINE Fremd-Projektion), canonicalPair, visitorSummarySchema/relationSchema, FriendshipService/-Controller/-Module, friendship + friend_request in der lebenden DB"
  - phase: 04-visitor-auth-profile
    provides: "visitor_profile, der Functional Index visitor_profile_username_lower_unq, das @Session()-Scoping-Muster, die OTP-Test-Fixture"
provides:
  - "visitorSearchQuerySchema — genau ein Schlüssel q, der Vertragsbeweis für D-05"
  - "ts-rest-Route searchVisitors -> GET /api/v1/visitors?q="
  - "FriendshipService.searchByUsername — der zweite D-04-Zugriffspfad, über dieselbe foreignProfileColumns-Konstante"
  - "FriendshipService.resolveRelations — die EINE, batchfähige Relationsauflösung; resolveRelation ist nur noch Delegator"
  - "apps/api/test/username-search.spec.ts — 11 Fälle für Präfix-Semantik, Ordnung, Untergrenze, Deckel, Escaping, alle fünf relation-Werte"
affects: [07-03-request-lifecycle, 07-04-friend-lists, 07-05-projection-uniqueness, 08-friends-ui-qr, 09-friends-at-festival]

actuals:
  tokens: 6785
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "LIKE-Präfixsuche mit JS-seitig maskierten Musterzeichen plus expliziter ESCAPE-Klausel im Drizzle-sql-Template — erster Präzedenzfall im Repo"
    - "Batch-Relationsauflösung: eine Map über zwei or(and(eq, inArray))-Abfragen, Einzahl-Variante als dünner Delegator"
    - "Service-level-Spec mit 31 direkt eingefügten Fixture-Profilen und genau einem OTP-Sign-in für den HTTP-Fall"

key-files:
  created:
    - apps/api/test/username-search.spec.ts
  modified:
    - packages/contracts/src/schemas.ts
    - packages/contracts/src/router.ts
    - apps/api/src/friendship/friendship.service.ts
    - apps/api/src/friendship/friendship.controller.ts

key-decisions:
  - "q bleibt am Vertrag ein unbeschränktes z.string() — die 2-Zeichen-Untergrenze ist Service-Invariante, kein Client-Vertrag; ein .min(2) im Schema hätte sie zu einem 400 gemacht und einen contract-umgehenden Client mit 1 Zeichen an die DB gelassen"
  - "Freundschaft schlägt offene Anfrage in resolveRelations — die Präzedenz aus 07-01 bleibt explizit erhalten, obwohl D-10 beides nie koexistieren lassen sollte"
  - "canonicalPair verschwindet aus friendship.service.ts: die Batch-Form braucht die kanonische Paarordnung nicht, weil das or(and(...)) beide Hälften abdeckt. Der Export bleibt (07-03/07-04 schreiben damit)"
  - "Zwei Akzeptanzkriterien des Plans sind grep-Formulierungen, die dem eigenen Aktionstext widersprechen bzw. auf Kommentartext anschlagen — siehe Deviations; beide Absichten sind erfüllt"

patterns-established:
  - "LIKE-Escaping: term.replace(/[\\\\%_]/g, ch => `\\\\${ch}`) vor dem Anhängen von '%', dazu escape '\\' in der SQL-Bedingung; die Wirksamkeit ist per psql-Gegenprobe belegt, nicht angenommen"
  - "Relationsauflösung immer batchweise aufrufen — die Einzahl-Signatur existiert nur als Bequemlichkeit über der Mehrzahl-Implementierung"
  - "Testfixtures über einen pro Lauf zufälligen, charset-gültigen Stamm; jede Fixture-Gruppe bekommt einen eigenen Anfangsbuchstaben, damit die Suchbegriffe der Testfälle sich nicht gegenseitig treffen"
  - "Doc-Kommentare dürfen die Token nicht wörtlich nennen, gegen die ein Sicherheits-grep prüft (Fortsetzung der 07-01-Lehre)"

requirements-completed: []

coverage:
  - id: D1
    description: "GET /api/v1/visitors?q= liefert Treffer, deren profile-Objekt exakt die sechs Fremd-View-Felder trägt, gebaut aus derselben foreignProfileColumns-Konstante wie der Handle-Lookup (VIS-02)"
    requirement: VIS-02
    verification:
      - kind: integration
        ref: "apps/api/test/username-search.spec.ts#10. every hit carries exactly the six foreign-view keys, and no birth date (VIS-01/D-03)"
        status: pass
      - kind: integration
        ref: "grep: genau ein .from(visitorProfile)-Select mit Spaltenliste im Modul — searchByUsername übergibt foreignProfileColumns, formuliert keine eigene"
        status: pass
    human_judgment: false
  - id: D2
    description: "Die Suche ist ein case-insensitiver Präfix-Match; ein Suchbegriff mitten im username liefert diesen nicht"
    requirement: VIS-01
    verification:
      - kind: integration
        ref: "apps/api/test/username-search.spec.ts#5. a term occurring mid-username does not match it — prefix, not substring (D-06)"
        status: pass
      - kind: integration
        ref: "apps/api/test/username-search.spec.ts#6. an uppercase term returns the same hits as the lowercase one (D-06)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Die Suche durchsucht ausschliesslich username; ein Begriff, der nur im displayName steht, liefert null Treffer (D-09)"
    requirement: VIS-01
    verification:
      - kind: integration
        ref: "apps/api/test/username-search.spec.ts#8. a term that only occurs in a displayName returns no hits (D-09)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Ein Suchbegriff unter 2 Zeichen (nach trim) liefert eine leere Liste ohne Datenbankzugriff (D-08)"
    verification:
      - kind: integration
        ref: "apps/api/test/username-search.spec.ts#1. a one-character term returns [], a two-character term returns hits (D-08 floor)"
        status: pass
      - kind: integration
        ref: "apps/api/test/username-search.spec.ts#2. a whitespace-only term and a term that trims below two chars return []"
        status: pass
      - kind: integration
        ref: "Quelltextprüfung: das return [] steht textuell vor dem ersten this.db in searchByUsername"
        status: pass
    human_judgment: false
  - id: D5
    description: "Treffer sind aufsteigend nach username sortiert, über wiederholte Aufrufe stabil, und nie mehr als 20 (D-08)"
    verification:
      - kind: integration
        ref: "apps/api/test/username-search.spec.ts#3. 22 matching profiles yield exactly 20 hits (D-08 hard cap)"
        status: pass
      - kind: integration
        ref: "apps/api/test/username-search.spec.ts#4. hits are ascending by username and stable across repeated identical calls"
        status: pass
    human_judgment: false
  - id: D6
    description: "LIKE-Sonderzeichen _ und % werden escaped — eine Suche nach einem username mit Unterstrich liefert nicht zusätzlich das Profil mit einem anderen Zeichen an dieser Stelle"
    verification:
      - kind: integration
        ref: "apps/api/test/username-search.spec.ts#7. an underscore in the term is escaped — the sibling with another char there does not match"
        status: pass
      - kind: integration
        ref: "psql-Gegenprobe: 'eabc12yx' like 'eabc12_x%' -> t, mit escape-Maskierung -> f, Zielprofil weiterhin -> t (der Test ist nicht vakuum-grün)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Jeder Treffer trägt relation aus none/requestOutgoing/requestIncoming/friends/self; die eigene Zeile trägt self (D-07)"
    verification:
      - kind: integration
        ref: "apps/api/test/username-search.spec.ts#9. one result set carries all five relation values (D-07)"
        status: pass
    human_judgment: false
  - id: D8
    description: "Der Beziehungsstatus für bis zu 20 Treffer wird in konstant zwei Datenbankabfragen aufgelöst, nicht pro Treffer"
    verification:
      - kind: integration
        ref: "Quelltextprüfung: resolveRelations führt genau zwei await this.db.select(...) aus, unabhängig von targetAccountIds.length; searchByUsername ruft sie genau einmal mit dem gesamten Trefferblock"
        status: pass
    human_judgment: false
  - id: D9
    description: "Die Suche kennt keinen Auffindbarkeits-Schalter (D-05): visitorSearchQuerySchema trägt genau den Schlüssel q, visitor_profile bekommt keine Zusatzspalte, und ein schlicht angelegtes Profil erscheint ohne Opt-in im Treffersatz"
    verification:
      - kind: integration
        ref: "node: Object.keys(visitorSearchQuerySchema.shape) -> [\"q\"]"
        status: pass
      - kind: integration
        ref: "grep -c 'searchable' in packages/contracts/src/schemas.ts und apps/api/src/friendship/friendship.service.ts -> jeweils 0"
        status: pass
      - kind: integration
        ref: "apps/api/test/username-search.spec.ts — alle 31 Fixture-Profile entstehen per schlichtem visitorProfile-Insert und erscheinen in den Treffersätzen der Fälle 1, 3, 4, 6, 7, 9, 10, 11"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-08-12
status: complete
---

# Phase 7 Plan 02: Username-Suche mit Beziehungsstatus Summary

**`GET /api/v1/visitors?q=` liefert bis zu 20 nach `username` aufsteigend sortierte Präfixtreffer, jeder mit der Fremd-View und dem Beziehungsstatus — selektiert über dieselbe `foreignProfileColumns`-Konstante wie der Handle-Lookup, mit JS-seitig maskierten LIKE-Musterzeichen und einer Relationsauflösung, die für den ganzen Trefferblock zwei Abfragen kostet statt zwei pro Treffer.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-12T15:28:10Z
- **Completed:** 2026-08-12T15:40:00Z
- **Tasks:** 2 ausgeführt (beide `auto`, kein Checkpoint)
- **Files modified:** 5 (1 neu, 4 geändert)

## Accomplishments

- **Der zweite D-04-Zugriffspfad steht — und er beweist VIS-02 zum ersten Mal wirklich.** `searchByUsername` übergibt `foreignProfileColumns` an `.select()`; es gibt im `friendship`-Modul weiterhin genau einen `.from(visitorProfile)`-Aufruf mit Spaltenliste. Genau hier hätte sich eine zweite Spaltenliste einschleichen können, ohne dass ein Endpunkt kaputt aussieht.
- **Die Relationsauflösung existiert im Modul jetzt genau einmal.** `resolveRelations(callerId, ids)` löst `self` lokal auf, fährt dann zwei Abfragen (`friendship`, `friend_request`) mit `or(and(eq, inArray))` und gibt eine `Map` zurück; ein leeres `ids`-Array löst keine Abfrage aus. `resolveRelation` (Einzahl) ist auf einen dreizeiligen Delegator geschrumpft — es gibt keine zweite Stelle mehr, die Freundschafts- oder Anfragezeilen interpretiert.
- **Das LIKE-Escaping ist belegt, nicht behauptet.** Backslash, `%` und `_` werden in JavaScript maskiert, die Bedingung trägt `escape '\'`, und der Wert reist als Parameter durch Drizzles `sql`-Template. Die Gegenprobe direkt in psql zeigt: `'eabc12yx' like 'eabc12_x%'` ist **wahr**, mit Maskierung **falsch**, das Zielprofil trifft weiterhin. Testfall 7 wäre ohne die Maskierung rot.
- **D-05 ist verhaltensseitig geschlossen.** `visitorSearchQuerySchema` hat exakt einen Schlüssel (`node`-geprüft: `["q"]`), keine der beiden Dateien nennt ein Auffindbarkeits-Merkmal, und alle 31 Fixture-Profile entstehen durch einen schlichten Insert ohne jeden Freischaltschritt — und erscheinen trotzdem in den Treffersätzen. Es gibt keinen Opt-in, den ein Test setzen könnte.
- **11 grüne Testfälle gegen die lebende lokale Docker-Postgres**, davon 10 service-level mit 31 direkt eingefügten Profilen und genau **einem** OTP-Sign-in für den HTTP-Fall — der Rate-Limiter (3 Anfragen/60 s) wird nicht angefasst. Gesamtsuite: 11 Dateien, 71 Tests, alle grün (vorher 60).

## Task Commits

1. **Task 1: Username-Suche mit Beziehungsstatus (Contract, Service, Controller)** — `bc5cf49` (feat)
2. **Task 2: Spec für Suchsemantik, Ordnung, Untergrenze, Deckel und Escaping** — `c78f3d2` (test)

## Files Created/Modified

**Neu:**
- `apps/api/test/username-search.spec.ts` — 11 Fälle; pro Lauf zufälliger Stamm, je Fixture-Gruppe ein eigener Anfangsbuchstabe (`b`/`e`/`zz`/`p`/`r`/`h`), damit die Suchbegriffe der Testfälle sich nicht gegenseitig treffen

**Geändert:**
- `packages/contracts/src/schemas.ts` — `visitorSearchQuerySchema` (ein Schlüssel), mit der Begründung, warum die 2-Zeichen-Grenze *nicht* hier steht
- `packages/contracts/src/router.ts` — Route-Key `searchVisitors` -> `GET /api/v1/visitors`, 200 = `z.array(visitorSummarySchema)`, kein 404-Fall
- `apps/api/src/friendship/friendship.service.ts` — `resolveRelations` (neu, batchfähig), `resolveRelation` (jetzt Delegator), `searchByUsername`
- `apps/api/src/friendship/friendship.controller.ts` — zweiter `@TsRestHandler`, Aufrufer ausschliesslich aus `session.user.id`

## Decisions Made

- **`q` bleibt am Vertrag ein unbeschränktes `z.string()`.** Ein `.min(2)` im Zod-Schema wäre naheliegend gewesen, hätte aber die Untergrenze aus D-08 zu einer *Transportregel* gemacht: zu kurze Suchen wären 400 statt leerer Liste, und jeder Aufrufer, der den Service direkt benutzt (jeder Testfall dieses Specs, jeder künftige interne Aufruf), käme mit einem Zeichen an die Datenbank. Die Grenze steht deshalb im Service, vor dem ersten `this.db`, und ist dort auch geprüft.
- **Freundschaft schlägt offene Anfrage.** In der Batch-Auflösung wird ein `friend_request`-Treffer übersprungen, wenn für dasselbe Gegenüber bereits `friends` gesetzt ist. D-10 (Gegenanfrage = Auto-Accept) sollte diese Koexistenz nie entstehen lassen — die Präzedenz wird trotzdem explizit gehalten, weil die frühe Rückgabe in `resolveRelation` (07-01) sie hatte und ein stiller Verhaltenswechsel beim Umbau nichts zu suchen hat.
- **`canonicalPair` verschwindet aus `friendship.service.ts`.** Die Batch-Bedingung `or(and(eq(lowerId, caller), inArray(higherId, ids)), and(eq(higherId, caller), inArray(lowerId, ids)))` deckt beide Hälften des Paares ab und braucht die kanonische Ordnung nicht. Der Export bleibt bestehen und wird in 07-03/07-04 gebraucht, wo *geschrieben* wird — dort erzwingt der CHECK ihn. Der Spec dieses Plans benutzt ihn bereits für seine Fixture-Inserts.
- **Der Deckel ist als Literal `.limit(20)` geschrieben, nicht als benannte Konstante.** Das Akzeptanzkriterium prüft die Stelle textuell; ein `USERNAME_SEARCH_LIMIT` hätte den Zweck der Prüfung verfehlt. Der Wert steht mit D-08-Verweis im Doc-Kommentar.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Doc-Kommentar erzeugte einen Falsch-Treffer im D-05-Sicherheits-grep**
- **Found during:** Task 1 (Abarbeiten der Akzeptanzkriterien)
- **Issue:** Der Plan verlangt `grep -c "searchable" apps/api/src/friendship/friendship.service.ts` = 0. Mein erklärender Kommentar zu D-05 nannte den Token wörtlich („there is no `searchable` column") und ergab 1. Das ist exakt die Falsch-Positiv-Klasse, die 07-01 als Deviation 3 dokumentiert hat: ein grep-basierter Check kann Erwähnung und Anwendung nicht unterscheiden, und Plan 07-05 setzt genau solche Checks auf.
- **Fix:** Umformuliert zu „`visitor_profile` carries no such column and there is no opt-in step … The `where` below filters on nothing but the username prefix." Der erklärende Inhalt bleibt vollständig, der Token-Treffer entfällt.
- **Files modified:** `apps/api/src/friendship/friendship.service.ts`
- **Verification:** `grep -c` in beiden geforderten Dateien -> 0.
- **Committed in:** `bc5cf49` (Task-1-Commit)

### Nicht behoben, weil das Kriterium sich selbst widerspricht

**2. `inArray(friendship.` kommt zweimal vor, das Akzeptanzkriterium verlangt einmal**
- Das Kriterium lautet: „`friendship.service.ts` enthält genau ein Vorkommen von `inArray(friendship.` und genau ein Vorkommen von `inArray(friendRequest.`". Der **Aktionstext desselben Tasks** schreibt jedoch die Bedingung wörtlich als
  `or(and(eq(friendship.lowerId, callerId), inArray(friendship.higherId, ids)), and(eq(friendship.higherId, callerId), inArray(friendship.lowerId, ids)))`
  vor — das sind zwangsläufig **zwei** `inArray(friendship.`-Vorkommen, eines je Paarhälfte. Die beiden Kriterien sind nicht gleichzeitig erfüllbar.
- **Entschieden:** dem Aktionstext gefolgt (er ist die normative Anweisung), das grep-Kriterium als Zählfehler behandelt. Die **Absicht** des Kriteriums — „die Relationsauflösung existiert einmal, nicht pro Aufrufpfad" — ist erfüllt und schärfer belegt: beide Vorkommen stehen in **einer** Methode (`resolveRelations`), und `resolveRelation` ist ein Delegator ohne eigene Abfrage. Im ganzen Modul gibt es genau zwei Stellen, die `friendship`/`friend_request` lesen, und beide stehen in dieser einen Methode.
- **Hinweis für 07-05:** Falls dort ein automatisierter Einzigkeits-Check gebaut wird, ist die tragfähige Metrik „Anzahl der Methoden, die `friendship`/`friendRequest` selektieren" (= 1), nicht die Anzahl der `inArray`-Aufrufe.

---

**Total deviations:** 1 auto-fixed (Rule 1), 1 bewusst nicht behobenes, widersprüchliches Akzeptanzkriterium
**Impact on plan:** Kein Scope Creep. Die Suchsemantik entspricht dem Plan zeichengenau.

## Issues Encountered

**Der Testlauf-Filter des Plans greift nach wie vor nicht.** `pnpm --filter @quiks/api test -- username-search` reicht das Argument **nicht** als vitest-Filter durch, sondern führt die gesamte Suite aus — dieselbe Beobachtung, die 07-01 protokolliert hat, und die Kommandoform steht unverändert in den Akzeptanzkriterien und `<verify>`-Blöcken der Pläne 07-02 bis 07-05. Die funktionierende Form ist:

```
cd apps/api && pnpm exec vitest run test/username-search.spec.ts --reporter=verbose
```

Für 07-03/07-04/07-05 ist das vorab zu korrigieren, sonst misst jede „gezielte" Prüfung in Wahrheit die Gesamtsuite.

**`requirements.mark-complete` bleibt defekt.** Nicht erneut versucht — 07-01 hat `not_found` für VIS-01/VIS-02 unter dem Workstream-Layout dokumentiert, und der Orchestrator hat angewiesen, das nicht zu bekämpfen. Requirement-Abschluss gehört ohnehin ans Phasenende nach 07-05: VIS-01 verlangt die Fremd-View auf **allen vier** D-04-Pfaden (dieser Plan liefert den zweiten), VIS-02s Einzigkeitsbeweis ist ausdrücklich Plan 07-05. Die `requirements-completed`-Frontmatter dieses Plans ist deshalb bewusst **leer** — ein Haken nach Plan 2 von 5 wäre eine Falschaussage.

**Nicht behoben (vorbestehend, Scope-Boundary):** die verwaiste Zeile in `drizzle.__drizzle_migrations` aus 07-01. Unverändert, dieser Plan legt keine Migration an.

## Verification Results

Alle drei Punkte aus `<verification>` des Plans, ehrlich berichtet:

| # | Prüfung | Ergebnis |
|---|---|---|
| 1 | `pnpm typecheck` und `pnpm lint` workspace-weit | **grün** (je 10/10 Tasks) |
| 2 | `pnpm --filter @quiks/api test` — Gesamtsuite, damit die umgebaute Relationsauflösung den Tracer-Spec aus 07-01 nicht bricht | **grün** — 11 Dateien, **71 Tests** (vorher 60/10); `foreign-projection.spec.ts` unverändert 5/5 |
| 3 | Die neue Suchstrecke `username-search.spec.ts` | **grün** — 11/11 |

Zusätzlich mechanisch geprüft:

| Prüfung | Ergebnis |
|---|---|
| `Object.keys(visitorSearchQuerySchema.shape)` | `["q"]` |
| `contract.searchVisitors` | `GET /api/v1/visitors` |
| `grep -c "searchable"` in `schemas.ts` / `friendship.service.ts` | 0 / 0 |
| `displayName` innerhalb einer `where`-Bedingung | keins — das einzige Vorkommen im Service ist der D-09-Kommentar |
| `grep -c "escape"` in `friendship.service.ts` | 4 (≥ 1 gefordert) |
| `grep -c "createVisitor("` im Spec | 2 (Definition + ein Aufruf, ≤ 2 gefordert) |
| `grep -c "toBe(20)"` im Spec | 2 |
| psql-Gegenprobe zum Escaping | `like 'eabc12_x%'` -> `t`, maskiert -> `f`, Ziel -> `t` |
| Fixture-Rückstände nach dem Lauf (`visitor_profile`, `friendship`, `friend_request`) | 0 / 0 / 0 |

## Known Stubs

Keine. `toIsoString` aus 07-01 bleibt exportiert und ungenutzt — vom Plan so vorgesehen für die Listen-Endpunkte in 07-04, vollständig implementiert, kein Stub.

## Threat Flags

Keine neue Sicherheitsfläche ausserhalb des `<threat_model>` dieses Plans: kein neuer Endpunkt jenseits von `searchVisitors`, kein neuer Auth-Pfad, keine Schemaänderung, kein neues Paket (T-07-SC unverändert). T-07-08 (Nutzer-Enumeration über die Präfixsuche) bleibt wie geplant **akzeptiert** und ist in `REQUIREMENTS.md` § Future Requirements (FRND-09) offen dokumentiert — Plan 07-05 führt sie als Ehrlichkeitsauflage.

## User Setup Required

None — keine externe Konfiguration, kein neues Paket, keine Migration.

## Next Phase Readiness

**Bereit für Welle 3 (Plan 07-03, Request-Lifecycle).** Was dort direkt benutzbar ist:

- `resolveRelations` ist die einzige Relationsauflösung — die Lifecycle-Endpunkte sollen sie *aufrufen*, nicht neben ihr eine eigene Interpretation von `friend_request`-Zeilen aufbauen.
- `canonicalPair` ist im Service nicht mehr importiert; 07-03 importiert es aus `visitor-projection.ts` frisch für seine **Schreib**pfade. Der Spec dieses Plans zeigt die Insert-Form (`{ ...canonicalPair(a, b), requesterId }`), die den `friend_request_pair_order_chk` und den `friend_request_requester_chk` passiert.
- Das Fixture-Muster dieses Specs (direkte `user`+`visitorProfile`-Inserts, `new FriendshipService(db)`, ein zufälliger Stamm pro Lauf, `inArray`-Cleanup in Abhängigkeitsreihenfolge) ist für `friend-request-race.spec.ts` 1:1 übernehmbar und umgeht den OTP-Rate-Limiter vollständig.
- **Die Kommandoform in den `<verify>`-Blöcken von 07-03 bis 07-05 korrigieren**, siehe „Issues Encountered".

Offen, unverändert: IDN-02 (per-Feld-Sichtbarkeit, Altersgrenze, Flinta-Filter) — die Fremd-View ist die Stelle, an der sie greift. FRND-09 (Blockieren/Melden) und die damit akzeptierte Enumerations-Exposition bleiben nach v1.1.

## Self-Check: PASSED

- `apps/api/test/username-search.spec.ts` existiert auf der Platte; alle vier geänderten Dateien sind im Arbeitsbaum vorhanden.
- Beide Task-Commits sind in `git log --all` auffindbar: `bc5cf49` (feat), `c78f3d2` (test).
- Diese SUMMARY liegt unter `.planning/workstreams/mobile/phases/07-profile-visibility-friendship-backend/07-02-SUMMARY.md`.
