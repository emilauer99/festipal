---
phase: 07-profile-visibility-friendship-backend
plan: 03
subsystem: api
tags: [drizzle, postgres, transactions, ts-rest, zod, nestjs, vitest, concurrency]

# Dependency graph
requires:
  - phase: 07-01
    provides: "friendship + friend_request in der lebenden DB samt friendship_pair_pk / friend_request_pair_pk und den drei CHECKs, canonicalPair, FriendshipService/-Controller/-Module"
  - phase: 07-02
    provides: "resolveRelations als EINZIGE Relationsauflösung; das Fixture-Muster (direkte user+visitorProfile-Inserts, new FriendshipService(db)) für service-level Specs ohne OTP"
  - phase: 04-visitor-auth-profile
    provides: "das @Session()-Scoping-Muster und das 23505/23503-Fehler-Mapping aus me.service.ts / festival.service.ts"
provides:
  - "Vier ts-rest-Route-Keys, einer pro Lifecycle-Übergang: sendFriendRequest, acceptFriendRequest, declineFriendRequest, withdrawFriendRequest"
  - "friendRequestTargetBodySchema, friendRequestResultSchema, mutationResultSchema in packages/contracts"
  - "FriendshipService.sendRequest / acceptRequest / declineRequest / withdrawRequest samt der privaten Schreibpfade openRequest und sealFriendship"
  - "postgresErrorOf — Cause-Chain-Walker als Obermenge des me.service.ts-Idioms, transaktionsfest"
  - "apps/api/test/friend-request-race.spec.ts — 12 Fälle, das Reverse-Direction-Rennen sequenziell UND parallel"
affects: [07-04-friend-lists, 07-05-projection-uniqueness, 08-friends-ui-qr, 09-friends-at-festival]

actuals:
  tokens: 8337
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "db.transaction als Schreibpfad-Klammer — erster Präzedenzfall im Repo"
    - "Unique-Verletzung als Zustandsübergang statt als Fehler: 23505 auf dem Paar-PK IST der Auto-Accept-Auslöser"
    - "Cause-Chain-Walker statt Ein-Ebenen-.cause, weil Transaktionsfehler durch den postgres.js-begin()-Wrapper reisen"
    - "Informationsfreie Antwort als Typ: RemoveRequestResult hat genau einen Zweig, damit kein späterer Mapper einen zweiten Statuscode erfinden kann"

key-files:
  created:
    - apps/api/test/friend-request-race.spec.ts
  modified:
    - packages/contracts/src/schemas.ts
    - packages/contracts/src/router.ts
    - apps/api/src/friendship/friendship.service.ts
    - apps/api/src/friendship/friendship.controller.ts

key-decisions:
  - "sealFriendship wird von acceptRequest UND vom Auto-Accept-Zweig geteilt: D-10 macht die Gegenanfrage zur exakt selben Transition wie ein explizites Annehmen. Damit sind es zwei db.transaction-Stellen für drei Übergänge — das Akzeptanzkriterium >= 3 wird bewusst nicht durch Code-Duplikat erkauft"
  - "postgresErrorOf läuft die cause-Kette bis Tiefe 5 ab statt nur err.cause zu lesen — ein Statement, das INNERHALB einer Transaktion scheitert, reist durch den begin()-Wrapper von postgres.js zurück"
  - "openRequest hat einen auf zwei Versuche begrenzten Retry für das Fenster, in dem die blockierende Anfragezeile zwischen 23505 und dem Nachlesen wieder verschwindet"
  - "Die Rückgabewerte des parallelen Rennens werden nicht festgeschrieben; die Invariante liegt auf dem Datenbankzustand. Die 25-Runden-Gegenprobe zeigt, warum: der Gewinner antwortet reproduzierbar 'requested', der Verlierer 'friends'"
  - "Der Testlauf-Filter aus den <verify>-Blöcken (pnpm --filter @quiks/api test -- <name>) filtert nach wie vor nicht; die funktionierende Form ist cd apps/api && pnpm exec vitest run test/<spec>.spec.ts"

patterns-established:
  - "Erwartete Konflikte sind diskriminierte Unions, nie Exceptions — der Controller bildet jeden Zweig auf einen Statuscode ab (Fortsetzung von me/festival, jetzt auch für Schreibpfade mit Transaktion)"
  - "Berechtigungsbedingungen gehören in die SQL-Bedingung, nicht in eine vorgelagerte Prüfung: decline/withdraw tragen requesterId <> / = callerId im DELETE"
  - "Ein nebenläufiger Spec beweist seine Nicht-Vakuum-Grünheit mit einer Wiederholungs-Gegenprobe, nicht mit einem einzelnen Durchlauf"

requirements-completed: []

coverage:
  - id: D1
    description: "Eine Anfrage A→B erzeugt genau eine friend_request-Zeile mit requesterId = A und keine friendship-Zeile"
    requirement: VIS-02
    verification:
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#1. A→B opens exactly one request row, owned by A, and no friendship"
        status: pass
    human_judgment: false
  - id: D2
    description: "Dieselbe Anfrage ein zweites Mal ist idempotent — sie wirft nicht, liefert dasselbe Ergebnis, die Zeilenzahl bleibt eins (D-11/D-13)"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#2. A→B again is idempotent — no throw, same answer, still one row (D-11/D-13)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Ist A→B offen und B fragt A an, entsteht sofort die Freundschaft: genau eine friendship-Zeile und NULL friend_request-Zeilen (D-10)"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#3. the counter-request B→A becomes the friendship at once and DISSOLVES the request (D-10)"
        status: pass
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#4. asking an existing friend answers friends without a new request or a second friendship"
        status: pass
    human_judgment: false
  - id: D4
    description: "Zwei echt parallele Anfragen desselben Paares in beiden Richtungen hinterlassen genau eine friendship-Zeile, null friend_request-Zeilen, und keiner der beiden Aufrufe wirft"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#5. C→D and D→C truly in parallel: one friendship, no request, neither call rejects"
        status: pass
      - kind: integration
        ref: "Wegwerf-Gegenprobe über 25 frische Paare (Promise.all je Runde): 25× {friendships:1, requests:0}, Tally requested 25 / friends 25 — der Auto-Accept-Zweig wurde in JEDER Runde betreten, der Fall ist nicht vakuum-grün"
        status: pass
    human_judgment: false
  - id: D5
    description: "Annehmen, Ablehnen und Zurückziehen löschen die friend_request-Zeile; danach ist die Zeilenzahl null, es existiert keine Statuszeile und keine Historie (D-12)"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#6. E cannot accept their OWN outgoing request; F can, and that clears it"
        status: pass
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#7. H declines G’s request; a second decline answers the same, not a 404 (D-12)"
        status: pass
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#8. asking again right after a decline works (D-11); only the requester can withdraw"
        status: pass
    human_judgment: false
  - id: D6
    description: "Nach einem Ablehnen ist eine erneute Anfrage derselben Richtung sofort erlaubt — kein Cooldown, keine Sperre (D-11)"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#8. asking again right after a decline works (D-11); only the requester can withdraw"
        status: pass
    human_judgment: false
  - id: D7
    description: "Anfrage an sich selbst -> 409, an ein nicht existierendes Profil -> 404, Aufrufer ohne eigenes Profil -> 409; in keinem Fall entsteht eine Zeile und in keinem schlägt eine Exception als 500 durch"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#9./10./11. (self, not-found, profile-required) — je expect(result.status).toBe(...), kein expect(...).rejects im Spec"
        status: pass
      - kind: integration
        ref: "Quelltextprüfung: friendship.controller.ts enthält 0 Vorkommen von throw new HttpException/BadRequestException/ConflictException/NotFoundException"
        status: pass
    human_judgment: false
  - id: D8
    description: "Ablehnen und Zurückziehen antworten immer 200 mit derselben Nutzlast, unabhängig davon, ob eine Anfrage existierte (T-07-15)"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#7 (zweites decline ohne Zeile -> 'removed') und #8 (withdraw des Nicht-Anfragenden -> 'removed', Zeile bleibt)"
        status: pass
      - kind: integration
        ref: "Contract-Prüfung: declineFriendRequest/withdrawFriendRequest deklarieren ausschliesslich responses.200 = mutationResultSchema (z.literal('removed')) — es gibt keinen 404-Zweig, der etwas verraten könnte"
        status: pass
    human_judgment: false
  - id: D9
    description: "Kein Aufrufer kann eine Anfrage annehmen, deren requesterId er selbst ist, und kein Aufrufer kann eine fremde ausgehende Anfrage zurückziehen (T-07-13)"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#6 (eigenes accept -> not-found, Zeile bleibt bestehen) und #8 (fremdes withdraw -> Nulldurchgang, Zeile bleibt bestehen)"
        status: pass
      - kind: integration
        ref: "Quelltextprüfung: die Bedingung steht in der DELETE-WHERE-Klausel (ne/eq auf requesterId), nicht in einer vorgelagerten Prüfung"
        status: pass
    human_judgment: false
  - id: D10
    description: "Nach allen Übergängen existiert keine friend_request-Zeile für ein Paar, für das auch eine friendship-Zeile existiert"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-request-race.spec.ts#12. after every transition, no pair holds a request row AND a friendship row (INNER JOIN über beide Tabellen)"
        status: pass
    human_judgment: false

duration: 11min
completed: 2026-08-12
status: complete
---

# Phase 7 Plan 03: Request-Lifecycle & Reverse-Direction-Rennen Summary

**Die vier Lifecycle-Übergänge stehen als je eigener Endpunkt, und das Rennen, das die ROADMAP für diese Phase markiert, ist aufgelöst — nicht durch eine Sperre, sondern durch das Schema: der Composite-PK auf dem kanonisch geordneten Paar macht die zweite Zeile physisch unmöglich, und die `23505`, die er wirft, ist kein Fehlerfall, sondern der Auslöser des Auto-Accept-Pfads aus D-10. Belegt durch 12 Testfälle gegen die lebende Postgres und eine 25-Runden-Gegenprobe, in der der Auto-Accept-Zweig in jeder einzelnen Runde betreten wurde.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-08-12T17:42:00Z
- **Completed:** 2026-08-12T17:53:00Z
- **Tasks:** 2 ausgeführt (beide `auto`, kein Checkpoint)
- **Files modified:** 5 (1 neu, 4 geändert)

## Accomplishments

- **Ein Rennen, das man nicht verlieren kann.** `sendRequest` fängt die `23505` auf `friend_request_pair_pk` ab, liest die blockierende Zeile und verzweigt: gehört sie dem Aufrufer selbst, ist die Anfrage schon offen (idempotent, D-11/D-13); gehört sie dem Gegenüber, ist es die Gegenanfrage und damit der Auto-Accept aus D-10. Beide parallelen Abläufe münden in dieselbe korrekte Wirkung.
- **Die Gegenprobe zeigt, dass das kein Zufall ist.** Ein Wegwerf-Spec hat das parallele `Promise.all`-Rennen über **25 frische Paare** gefahren: jede Runde endete mit genau einer `friendship`-Zeile und null `friend_request`-Zeilen, und die Rückgabe-Bilanz war 25× `requested` / 25× `friends` — der Auto-Accept-Zweig wurde in **jeder** Runde betreten. Testfall 5 im Spec ist damit nachweislich kein Durchmarsch, der die Kollision verfehlt.
- **Alle drei Schreibübergänge sind transaktional geklammert.** Das Anlegen prüft Freundschaft und schreibt die Anfrage in einer Transaktion; `sealFriendship` löscht die Anfragezeile und schreibt die Freundschaft in einer zweiten. Kein Leser kann das Paar je in dem Zustand sehen, in dem weder Anfrage noch Freundschaft existiert.
- **Die Rennfenster-Nachprüfung räumt hinter READ COMMITTED auf.** Wurde eine Anfrage eingefügt und hat sich inzwischen eine Freundschaft dazwischengeschoben, wird die überflüssige Anfragezeile wieder gelöscht und `friends` geantwortet. Testfall 12 prüft die daraus folgende Invariante per `INNER JOIN` über beide Tabellen: kein Paar trägt beides.
- **Die Privatsphäre-Zusage steht im Typ, nicht in einem Kommentar.** `RemoveRequestResult` hat genau einen Zweig, und die Contract-Einträge für `decline`/`withdraw` deklarieren ausschliesslich `200`. Es gibt keinen 404-Ast, den ein späterer Mapper versehentlich einführen könnte — die Antwort kann nicht verraten, ob es etwas zu löschen gab (T-07-15).
- **Suite von 11 Dateien / 71 Tests auf 12 Dateien / 83 Tests gewachsen**, alles grün; `pnpm typecheck` und `pnpm lint` je 10/10 Tasks.

## Task Commits

1. **Task 1: Vier Lifecycle-Endpunkte mit Auto-Accept-Transaktion** — `2ff9116` (feat)
2. **Task 2: Rennbedingungs- und Idempotenz-Spec gegen echte Postgres** — `d37cd95` (test)

## Files Created/Modified

**Neu:**
- `apps/api/test/friend-request-race.spec.ts` — 12 service-level Fälle, neun Wegwerf-Konten (acht mit Profil, eines bewusst ohne), Fixture-Muster 1:1 aus 07-02 übernommen, kein HTTP und kein OTP

**Geändert:**
- `packages/contracts/src/schemas.ts` — `friendRequestTargetBodySchema`, `friendRequestResultSchema`, `mutationResultSchema`
- `packages/contracts/src/router.ts` — vier Route-Keys: `POST /me/friend-requests` sowie `/me/friend-requests/:accountId/{accept,decline,withdraw}`
- `apps/api/src/friendship/friendship.service.ts` — `sendRequest`, `acceptRequest`, `declineRequest`, `withdrawRequest`; privat `openRequest`, `sealFriendship`, `areFriends`; `postgresErrorOf` und die beiden Constraint-Namenskonstanten
- `apps/api/src/friendship/friendship.controller.ts` — vier weitere `@TsRestHandler`, jeder mit `@Session()`, keiner mit einem `throw`

## Decisions Made

- **`sealFriendship` ist geteilt, nicht dupliziert.** D-10 macht die Gegenanfrage zur *exakt selben* Transition wie ein explizites Annehmen: Anfragezeile löschen, Freundschaft einfügen. Beides doppelt zu schreiben wäre genau der zweite Schreibpfad, den diese Phase vermeiden will. Konsequenz für die Zählung siehe „Deviations".
- **`postgresErrorOf` statt `err.cause`.** `me.service.ts` liest die Ursache eine Ebene tief, was für ein blankes Statement richtig ist. Ein Statement, das **innerhalb** einer Transaktion scheitert, reist aber durch den `begin()`-Wrapper von postgres.js zurück, und die Tiefe ist damit nicht garantiert 1. Der Walker ist eine Obermenge des bestehenden Idioms: er findet den Treiberfehler weiterhin auf Ebene 1 und degradiert einen bekannten Konflikt nicht still zu einem 500, wenn ein ORM- oder Treiber-Update eine Schicht ergänzt. Dass die Diskriminierung wirklich greift, belegen die Testfälle 2, 3 und 11 — ohne einen Treffer auf `constraint_name` bzw. `23503` würden sie werfen statt zu antworten.
- **Begrenzter Retry im `openRequest`.** Verschwindet die blockierende Anfragezeile zwischen der `23505` und dem Nachlesen (das Gegenüber zieht in genau diesem Moment zurück), wäre jede Antwort eine Behauptung über einen Zustand, der nicht mehr gilt. Statt zu raten, wird **einmal** neu versucht; die Obergrenze von zwei Versuchen schliesst aus, dass nebenläufiges Geschrei daraus eine Schleife macht.
- **Die Rückgabewerte des parallelen Rennens bleiben offen.** Die Gegenprobe zeigt, dass der Gewinner in der Praxis reproduzierbar `requested` antwortet (seine Nachprüfung läuft, bevor der Verlierer die Freundschaft committet) und der Verlierer `friends`. Reproduzierbar ist aber nicht garantiert — die Invariante gehört auf den Datenbankzustand, und genau dort steht sie.
- **Selbst-Adjazenz wird in allen vier Methoden vor `canonicalPair` beantwortet.** Fortsetzung des 07-01-Musters; zwei gleiche IDs ergäben ein Paar, das der Ordnungs-CHECK ablehnt.

## Deviations from Plan

### Bewusst abweichend, weil das Kriterium ein Code-Duplikat erzwungen hätte

**1. `grep -c "db.transaction"` ergibt 2, das Akzeptanzkriterium verlangt mindestens 3**

- Das Kriterium begründet die 3 mit „Senden, Auto-Accept, Annehmen". Der **Aktionstext** desselben Tasks beschreibt Auto-Accept und Annehmen jedoch als dieselbe Operation — beide löschen die Anfragezeile des Paares und fügen `friendship` mit `onConflictDoNothing()` ein. Sie zu zwei getrennten Transaktionsblöcken auszuschreiben, hiesse denselben Schreibpfad zweimal zu pflegen.
- **Entschieden:** `sealFriendship(pair)` implementiert die Transition einmal; `acceptRequest` und der Auto-Accept-Zweig von `openRequest` rufen sie auf. Es bleiben **zwei** `this.db.transaction`-Stellen für **drei** Übergänge. Die *Absicht* des Kriteriums — „jeder dieser Übergänge ist atomar" — ist vollständig erfüllt und durch die Testfälle 3, 5 und 6 belegt.
- Dies ist dieselbe Kriteriums-Klasse, die 07-02 bei `inArray(friendship.` protokolliert hat: eine Zählung von Aufrufstellen, die dem eigenen Aktionstext widerspricht. Für 07-05 gilt entsprechend: die tragfähige Metrik ist „Anzahl der Methoden, die `friendship`/`friend_request` **schreiben**" (= 3: `openRequest`, `sealFriendship`, die beiden Löschpfade), nicht die Anzahl der `db.transaction`-Vorkommen.

### Auto-fixed Issues

**2. [Rule 1 - Bug] Ein Doc-Kommentar hätte das `db.transaction`-Kriterium auf 3 gehoben — ohne dass es stimmt**

- **Found during:** Task 1 (Abarbeiten der Akzeptanzkriterien)
- **Issue:** Der erklärende Kommentar zu `postgresErrorOf` nannte den Token `db.transaction` wörtlich. `grep -c` zählte damit 3 und das Kriterium wäre „erfüllt" gewesen — auf einem Kommentar, nicht auf einer Transaktion. Das ist exakt die Falsch-Positiv-Klasse, die 07-01 (Deviation 3) und 07-02 (Deviation 1) schon dokumentiert haben, hier nur mit umgekehrtem Vorzeichen: nicht ein fälschlich gerissener Check, sondern ein fälschlich bestandener.
- **Fix:** Umformuliert zu „a statement that fails INSIDE a transaction". Der erklärende Inhalt bleibt vollständig, der Token-Treffer entfällt, und die Zählung berichtet jetzt die Wahrheit (2).
- **Files modified:** `apps/api/src/friendship/friendship.service.ts`
- **Verification:** `grep -n "db.transaction"` liefert nur noch die beiden echten Aufrufstellen (Zeilen 282, 375).
- **Committed in:** `2ff9116` (Task-1-Commit)

**3. [Rule 2 - Missing Critical] Fehler-Diskriminierung war nicht transaktionsfest**

- **Found during:** Task 1 (Implementierung des Auto-Accept-Pfads)
- **Issue:** Das vom Plan zitierte Muster `(err as { cause?: unknown }).cause instanceof PostgresError` prüft genau eine Ebene. Alle Konflikte dieses Plans entstehen jedoch **innerhalb** von `db.transaction`, und der Fehler wird von postgres.js' `begin()` zurückgereicht — verlässt sich der Code auf Tiefe 1 und die Tiefe ändert sich, fällt jeder erwartete Konflikt in den `throw`-Zweig und wird zum 500. Genau das, was `must_haves` ausschliesst.
- **Fix:** `postgresErrorOf(err)` läuft die `cause`-Kette bis Tiefe 5 ab und gibt den ersten `PostgresError` zurück; alle vier Fehlerprüfungen gehen darüber.
- **Files modified:** `apps/api/src/friendship/friendship.service.ts`
- **Verification:** Testfälle 2 (23505 `friend_request_pair_pk`, eigene Anfrage), 3 (23505 → Auto-Accept) und 11 (23503 → `profile-required`) sind grün; ohne greifende Diskriminierung würden alle drei werfen.
- **Committed in:** `2ff9116` (Task-1-Commit)

**4. [Rule 2 - Missing Critical] Das Verschwinden der blockierenden Zeile war unbeantwortet**

- **Found during:** Task 1
- **Issue:** Nach der `23505` liest der Code die vorhandene Anfragezeile nach. Zieht das Gegenüber in genau diesem Fenster zurück, ist die Zeile weg — der Plan sagt für diesen Fall nichts, und jede feste Antwort wäre eine Aussage über einen Zustand, der nicht mehr gilt.
- **Fix:** Ein auf zwei Versuche begrenzter Retry von `openRequest`; ist auch der zweite ergebnislos, entscheidet ein Blick auf `friendship`, ob `friends` oder `requested` geantwortet wird.
- **Files modified:** `apps/api/src/friendship/friendship.service.ts`
- **Verification:** Suite grün; das Fenster ist zu schmal, um es deterministisch zu treffen — der Zweig ist Absicherung, kein getesteter Pfad (siehe „Known Stubs").
- **Committed in:** `2ff9116` (Task-1-Commit)

---

**Total deviations:** 3 auto-fixed (1× Rule 1, 2× Rule 2), 1 bewusst abweichend erfülltes Zählkriterium
**Impact on plan:** Kein Scope Creep. Alle drei Auto-Fixes betreffen die Korrektheit des eigenen Diffs; der Lifecycle entspricht dem Plan zeichengenau.

## Issues Encountered

**Der Testlauf-Filter des Plans greift weiterhin nicht.** `pnpm --filter @quiks/api test -- friend-request-race` reicht das Argument nicht als vitest-Filter durch, sondern führt die gesamte Suite aus — dieselbe Beobachtung wie in 07-01 und 07-02, und die Kommandoform steht unverändert in den `<verify>`-Blöcken und Akzeptanzkriterien von 07-04 und 07-05. Die funktionierende Form ist:

```
cd apps/api && pnpm exec vitest run test/friend-request-race.spec.ts --reporter=verbose
```

**`requirements.mark-complete` bleibt defekt** (07-01/07-02 dokumentiert, Orchestrator-Anweisung: nicht bekämpfen). `requirements-completed` dieses Plans ist bewusst leer — VIS-01 verlangt die Fremd-View auf allen vier D-04-Pfaden, VIS-02s Einzigkeitsbeweis ist Plan 07-05. Der Abschluss gehört ans Phasenende.

**Nicht behoben (vorbestehend, Scope-Boundary):** die verwaiste Zeile in `drizzle.__drizzle_migrations` aus 07-01. Dieser Plan legt keine Migration an.

## Verification Results

Alle drei Punkte aus `<verification>` des Plans, ehrlich berichtet:

| # | Prüfung | Ergebnis |
|---|---|---|
| 1 | `pnpm typecheck` und `pnpm lint` workspace-weit | **grün** (je 10/10 Tasks) |
| 2 | `pnpm --filter @quiks/api test` — Gesamtsuite; insbesondere darf `username-race.spec.ts` nicht durch die neuen Fixtures gestört werden | **grün** — 12 Dateien, **83 Tests** (vorher 11/71); keine Fixture-Kollision |
| 3 | Die neue Rennstrecke `friend-request-race.spec.ts` (korrigierte Kommandoform) | **grün** — 12/12 |

Zusätzlich mechanisch geprüft:

| Prüfung | Ergebnis | Kriterium |
|---|---|---|
| Route-Keys `sendFriendRequest`/`acceptFriendRequest`/`declineFriendRequest`/`withdrawFriendRequest` in `router.ts` | je 1 | vorhanden ✓ |
| `grep -c "db.transaction"` im Service | **2** | Plan: ≥ 3 — siehe Deviation 1 |
| `grep -c "friend_request_pair_pk"` / `"friendship_pair_pk"` | 2 / 1 | ≥ 1 / ≥ 1 ✓ |
| `grep -c "23503"` | 2 | ≥ 1 ✓ |
| `grep -c "canonicalPair"` | 7 | ≥ 5 ✓ |
| `grep -c "@Session()"` im Controller | 6 | ≥ 6 ✓ |
| `throw new HttpException\|BadRequest\|Conflict\|NotFoundException` im Controller | 0 | 0 ✓ |
| `it(`-Blöcke im Spec | 12 | ≥ 12 ✓ |
| `Promise.all` im Spec | 1 (Testfall 5, beide Richtungen) | vorhanden ✓ |
| `OtpDevTransport\|signInWithOtp\|createVisitor` im Spec | 0 | 0 ✓ |
| `expect(...).rejects` im Spec | 0 | 0 ✓ |
| `afterAll` räumt `friendship`, `friend_request`, `visitor_profile`, `user` ab | 4 Tabellen | ✓ |
| Fixture-Rückstände nach dem Lauf (psql) | `friend_request` 0 · `friendship` 0 · verwaiste Profile 0 · verwaiste user 0 | ✓ |
| **Gegenprobe:** 25 parallele Runden auf frischen Paaren | 25× `{friendships: 1, requests: 0}`, Tally `requested 25 / friends 25` | Auto-Accept in jeder Runde betreten |

## Known Stubs

Keine Stubs. Zwei Codezweige sind bewusst **nicht** durch einen Testfall abgedeckt, weil ihr Zeitfenster nicht deterministisch getroffen werden kann — beide sind vollständig implementiert und dokumentiert, keiner ist ein Platzhalter:

- Der Retry-Zweig in `openRequest` (blockierende Anfragezeile verschwindet zwischen `23505` und dem Nachlesen).
- Der `friendship_pair_pk`-Fangzweig in `sealFriendship`. Durch `onConflictDoNothing()` ist er im aktuellen Zuschnitt praktisch unerreichbar; er steht dort, damit ein späteres Entfernen dieser Klausel zu `friends` degradiert statt zu einem 500.

`toIsoString` aus 07-01 bleibt exportiert und ungenutzt — vom Plan für die Listen-Endpunkte in 07-04 vorgesehen, vollständig implementiert, kein Stub.

## Threat Flags

Keine neue Sicherheitsfläche ausserhalb des `<threat_model>` dieses Plans: vier Endpunkte wie geplant, kein neuer Auth-Pfad, keine Schemaänderung, kein neues Paket (T-07-SC unverändert).

Der Stand der fünf `mitigate`-Einträge:

| Threat | Stand |
|---|---|
| T-07-12 (Spoofing `requesterId`) | umgesetzt — kein Endpunkt nimmt einen Absender-Parameter, `requesterId` kommt ausschliesslich aus `session.user.id`; der CHECK `friend_request_requester_chk` sichert es zusätzlich im Schema |
| T-07-13 (EoP accept/withdraw) | umgesetzt — beide Bedingungen stehen in der SQL-Bedingung, nicht in einer vorgelagerten Prüfung; Testfälle 6 und 8 |
| T-07-14 (Duplikat-/Reverse-Rennen) | umgesetzt und belegt — Testfälle 3 und 5 plus die 25-Runden-Gegenprobe |
| T-07-15 (Information Disclosure) | umgesetzt — `decline`/`withdraw` haben contract-seitig nur einen 200-Zweig; `accept` gibt für „eigene ausgehende Anfrage" dasselbe 404 wie für „gibt es nicht"; keine Lifecycle-Antwort trägt Profildaten (die Existenzprüfung selektiert nur `accountId`) |
| T-07-16 / T-07-17 | bewusst `accept` (D-13 / D-12), unverändert; als Ehrlichkeitsauflage in 07-05 geführt |

## User Setup Required

None — keine externe Konfiguration, kein neues Paket, keine Migration.

## Next Phase Readiness

**Bereit für Welle 4 (Plan 07-04, Freundes- und Anfragelisten).** Direkt benutzbar:

- `friendship`- und `friend_request`-Zeilen entstehen ab jetzt über die Lifecycle-Methoden statt über direkte Inserts — `friend-lists.spec.ts` kann seine Fixtures über `sendRequest`/`acceptRequest` aufbauen, statt Paare von Hand zu setzen.
- `canonicalPair` ist im Service etabliert; jeder Schreib- und Lesepfad ordnet das Paar.
- `toIsoString` wartet auf seinen ersten Aufrufer (`createdAt` der beiden Listen).
- `postgresErrorOf` steht als transaktionsfestes Fehler-Mapping bereit, falls `unfriend` es braucht.
- **Kommandoform in den `<verify>`-Blöcken von 07-04/07-05 korrigieren** — siehe „Issues Encountered".

Offen, unverändert: IDN-02 (per-Feld-Sichtbarkeit, Altersgrenze, Flinta-Filter), FRND-09 (Blockieren/Melden) samt der damit akzeptierten Enumerations- und DoS-Exposition (T-07-08, T-07-16).

## Self-Check: PASSED

- `apps/api/test/friend-request-race.spec.ts` existiert auf der Platte; alle vier geänderten Dateien sind im Arbeitsbaum vorhanden.
- Beide Task-Commits sind in `git log --all` auffindbar: `2ff9116` (feat), `d37cd95` (test).
- Diese SUMMARY liegt unter `.planning/workstreams/mobile/phases/07-profile-visibility-friendship-backend/07-03-SUMMARY.md`.
