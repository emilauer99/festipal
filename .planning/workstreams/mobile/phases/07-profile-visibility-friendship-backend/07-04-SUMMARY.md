---
phase: 07-profile-visibility-friendship-backend
plan: 04
subsystem: api
tags: [drizzle, postgres, joins, ts-rest, zod, nestjs, vitest]

# Dependency graph
requires:
  - phase: 07-01
    provides: "foreignProfileColumns (die EINE Fremd-Select-Map), canonicalPair, toIsoString, visitorProfileForeignSchema, FriendshipService/-Controller/-Module, friendship + friend_request in der lebenden DB"
  - phase: 07-02
    provides: "resolveRelations als einzige Relationsauflösung, das asc(visitorProfile.username)-Sortiermuster, das service-level Fixture-Muster ohne OTP"
  - phase: 07-03
    provides: "sendRequest / acceptRequest / declineRequest / withdrawRequest — die Lifecycle-Methoden, über die dieser Plan seine Fixtures herstellt statt Zeilen von Hand zu setzen"
provides:
  - "friendSchema / Friend, friendRequestItemSchema / FriendRequestItem, friendRequestListsSchema / FriendRequestLists in packages/contracts"
  - "ts-rest-Routen listFriends (GET /me/friends), listFriendRequests (GET /me/friend-requests), unfriend (DELETE /me/friends/:accountId)"
  - "pickForeignProfile — die EINZIGE Stelle, an der ein Zeilenergebnis zu einem profile-Objekt geformt wird"
  - "FriendshipService.listFriends / listRequests / unfriend — der dritte und vierte D-04-Zugriffspfad plus das Entfreunden"
  - "apps/api/test/friend-lists.spec.ts — 11 Fälle für Symmetrie, Richtungspartition, Sortierung, Leerzustände und Idempotenz"
affects: [07-05-projection-uniqueness, 08-friends-ui-qr, 09-friends-at-festival]

actuals:
  tokens: 6742
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Gegenpart-auflösender Join: die Join-Bedingung sucht den Aufrufer in einer der beiden Paarspalten und wählt die andere als Gegenüber — filtert und selektiert in einem, ohne where-Klausel"
    - "Zwei-Orte-Regel für eine Projektion: eine Select-Map fürs Lesen (foreignProfileColumns), eine Formungsfunktion fürs Zusammensetzen (pickForeignProfile)"
    - "Nicht-Vakuum-Beleg für einen Sortiertest per temporärem Entfernen des orderBy statt per Behauptung"

key-files:
  created:
    - apps/api/test/friend-lists.spec.ts
  modified:
    - packages/contracts/src/schemas.ts
    - packages/contracts/src/router.ts
    - apps/api/src/friendship/visitor-projection.ts
    - apps/api/src/friendship/friendship.service.ts
    - apps/api/src/friendship/friendship.controller.ts

key-decisions:
  - "Beide Listen selektieren from(visitorProfile) und joinen die Beziehungstabelle, nicht umgekehrt — semantisch identisch beim INNER JOIN, aber es hält die Zahl der Profiltabellen-Selects und die Zahl der foreignProfileColumns-Nutzungen im Gleichschritt"
  - "Kein Listenelement trägt eine relation: in der Freundesliste wäre sie konstant friends, in den Anfragelisten steckt die Richtung in der Listenzugehörigkeit — eine zweite Quelle für denselben Fakt"
  - "pickForeignProfile nimmt den Contract-Typ als Parameter, damit ein neues Feld in visitorProfileForeignSchema zuerst DORT den Typecheck bricht — an der Stelle, an der jemand entscheiden muss, ob es wirklich in die Fremd-View gehört"
  - "unfriend beantwortet Selbst-Adjazenz vor canonicalPair — Fortsetzung des 07-01/07-03-Musters, obwohl ein Paar aus zwei gleichen IDs hier nur ein wirkungsloses DELETE wäre"
  - "Das Akzeptanzkriterium 'Zahl der from(visitorProfile) gleich Zahl der foreignProfileColumns' ist nicht erfüllbar, ohne T-07-15 aus 07-03 zu brechen — siehe Deviations; die Absicht ist erfüllt und schärfer belegt"

patterns-established:
  - "Eine Zeile pro Paar wird aus beiden Perspektiven über die Join-Bedingung aufgelöst; die Gegenperspektive ist der Symmetriebeweis und darf NICHT durch einen zweiten Insert vorbereitet werden"
  - "Richtungspartition ist perspektivabhängig und folgt allein aus requesterId — dieselbe Zeile ist für die eine Seite outgoing, für die andere incoming"
  - "Ein Sortiertest vergleicht gegen eine sortierte Kopie UND belegt per Gegenprobe, dass er ohne das orderBy rot wird"
  - "Fixtures entstehen über die echten Lifecycle-Methoden, nicht über direkte Inserts in die Beziehungstabellen"

requirements-completed: []

coverage:
  - id: D1
    description: "GET /api/v1/me/friends liefert die Freunde des Aufrufers, jeder als profile-Objekt mit den sechs Fremd-View-Feldern plus friendsSince als ISO-String"
    requirement: VIS-01
    verification:
      - kind: integration
        ref: "apps/api/test/friend-lists.spec.ts#1. A’s friend list holds exactly B and C — and never A themself"
        status: pass
      - kind: integration
        ref: "apps/api/test/friend-lists.spec.ts#3. every entry carries exactly the six foreign-view fields and a string friendsSince"
        status: pass
    human_judgment: false
  - id: D2
    description: "Die Freundesliste ist symmetrisch: eine einzige friendship-Zeile erscheint bei beiden Beteiligten, ohne dass eine Spiegelzeile existiert"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-lists.spec.ts#2. B’s friend list holds A — the same single row, read from the other side"
        status: pass
      - kind: integration
        ref: "Derselbe Fall prüft zusätzlich per direkter Abfrage, dass für das Paar A/B genau EINE friendship-Zeile existiert — die Liste löst also nachweislich eine Zeile aus zwei Perspektiven auf"
        status: pass
    human_judgment: false
  - id: D3
    description: "GET /api/v1/me/friend-requests liefert zwei getrennte Listen; die Zuordnung folgt allein aus requesterId, nicht aus einem Statusfeld"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-lists.spec.ts#5. A’s requests split by direction: D outgoing, E incoming, neither in both"
        status: pass
      - kind: integration
        ref: "apps/api/test/friend-lists.spec.ts#6. the same request row is INCOMING for D — the partition is per-caller (D-12)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Beide Listenendpunkte und die Freundesliste bauen ihre profile-Objekte aus derselben foreignProfileColumns-Konstante wie Handle-Lookup und Suche — es gibt keine vierte Spaltenliste (VIS-02)"
    requirement: VIS-02
    verification:
      - kind: integration
        ref: "Quelltextprüfung: visitor-projection.ts trägt genau ein 'export const foreignProfileColumns' und genau ein 'export function pickForeignProfile'; alle vier Fremd-View-Selects im Service übergeben die Konstante, die beiden Listen formen ausschliesslich über pickForeignProfile"
        status: pass
      - kind: integration
        ref: "apps/api/test/friend-lists.spec.ts#3 und #5 — Object.keys(entry.profile) ist in beiden Listen 6, also weder ein Feld zu viel noch zu wenig"
        status: pass
    human_judgment: false
  - id: D5
    description: "DELETE /api/v1/me/friends/:accountId entfernt die Freundschaft für beide Seiten mit einer einzigen gelöschten Zeile und antwortet auch beim zweiten Aufruf mit 200 (idempotent)"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-lists.spec.ts#8. unfriending A/B takes effect on BOTH sides with one deleted row"
        status: pass
      - kind: integration
        ref: "apps/api/test/friend-lists.spec.ts#9./10. — zweiter Aufruf und nie bestandene Freundschaft antworten beide 'removed', ohne expect(...).rejects"
        status: pass
      - kind: integration
        ref: "apps/api/test/friend-lists.spec.ts#11. unfriending leaves no friendship row and creates no pending request"
        status: pass
    human_judgment: false
  - id: D6
    description: "Ein Aufrufer ohne Freunde erhält [], ein Aufrufer ohne Anfragen erhält zwei leere Listen — nie null und nie ein Fehler"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-lists.spec.ts#7. no friends is [], no requests is two empty arrays — never null, never an error (toEqual([]) / toEqual({ incoming: [], outgoing: [] }))"
        status: pass
    human_judgment: false
  - id: D7
    description: "Beide Listen sind aufsteigend nach username sortiert, damit die Reihenfolge in Phase 8 nachvollziehbar und testbar ist"
    verification:
      - kind: integration
        ref: "apps/api/test/friend-lists.spec.ts#4. the friend list is ascending by username — Vergleich gegen die sortierte Kopie, Fixtures bewusst in falscher Reihenfolge eingefügt"
        status: pass
      - kind: integration
        ref: "Gegenprobe: orderBy in listFriends temporär entfernt -> genau Fall 4 wird rot (1 failed | 10 passed), danach wiederhergestellt und git diff --stat leer"
        status: pass
    human_judgment: false
  - id: D8
    description: "Kein Listenendpunkt akzeptiert eine Aufrufer-Identität aus Pfad, Query oder Body; der Scope stammt ausschliesslich aus session.user.id"
    verification:
      - kind: integration
        ref: "Contract-Prüfung: listFriends und listFriendRequests deklarieren weder pathParams noch query noch body; unfriend hat als einzigen Parameter :accountId, und das ist das Gegenüber"
        status: pass
      - kind: integration
        ref: "Quelltextprüfung: alle neun Handler in friendship.controller.ts tragen @Session(); in den drei neuen ist session.user.id der einzige Aufrufer-Ausdruck"
        status: pass
    human_judgment: false

duration: 16min
completed: 2026-08-12
status: complete
---

# Phase 7 Plan 04: Freundes- und Anfragelisten & Entfreunden Summary

**Die beiden verbleibenden D-04-Zugriffspfade stehen, und damit hat VIS-02 sein volles Prüffeld: vier Aufrufstellen, eine Select-Map, eine Formungsfunktion. Die Symmetrie ist kein Nebeneffekt, sondern die Konstruktion — die Join-Bedingung sucht den Aufrufer in einer der beiden Paarspalten und löst die andere als Gegenüber auf, weshalb dieselbe eine `friendship`-Zeile bei beiden Beteiligten erscheint und ein einzelnes DELETE die Freundschaft für beide beendet.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-08-12T15:50:00Z
- **Completed:** 2026-08-12T16:06:00Z
- **Tasks:** 2 ausgeführt (beide `auto`, kein Checkpoint)
- **Files modified:** 6 (1 neu, 5 geändert)

## Accomplishments

- **Alle vier D-04-Pfade existieren.** Handle-Lookup (07-01), Suche (07-02), Anfragelisten und Freundesliste (hier) selektieren dieselbe `foreignProfileColumns`-Konstante. Neu ist die zweite Hälfte der Regel: `pickForeignProfile` ist ab jetzt die einzige Stelle, an der ein Zeilenergebnis zu einem `profile`-Objekt **geformt** wird. Beides braucht es getrennt — eine Abfrage, die zu viel liest, leckt durch jeden Handler, der die Zeile durchreicht; ein Handler, der die Feldnamen erneut aufzählt, driftet ab, sobald ein Feld dazukommt, ohne dass ein Endpunkt kaputt aussieht.
- **Die Symmetrie ist bewiesen, nicht behauptet.** Testfall 2 liest genau die Zeile, die Testfall 1 gelesen hat, aus der Gegenperspektive — und er wird ausdrücklich **nicht** durch einen zweiten Insert vorbereitet. Derselbe Fall prüft direkt in der Datenbank nach, dass für das Paar genau eine Zeile existiert. Testfall 8 zieht die Konsequenz: nach einem `unfriend` durch A ist B's Liste leer, obwohl B nichts aufgerufen hat.
- **Die Richtungspartition ist perspektivabhängig.** Testfall 5 sieht die A→D-Anfrage in A's `outgoing`, Testfall 6 sieht **dieselbe Zeile** in D's `incoming`. Es gibt kein Statusfeld, das hier befragt würde — die Zuordnung ist ein einziger Vergleich gegen `requesterId` (D-12).
- **Der Sortiertest ist nachweislich nicht vakuum-grün.** Die Fixtures werden absichtlich in der falschen Reihenfolge eingefügt (B vor C, alphabetisch aber C vor B), und die Gegenprobe belegt es: mit temporär entferntem `orderBy` fällt **genau** Fall 4 (1 failed | 10 passed), alle anderen bleiben grün. Danach wiederhergestellt, `git diff --stat` leer.
- **Suite von 12 Dateien / 83 Tests auf 13 Dateien / 94 Tests gewachsen**, alles grün; `pnpm typecheck` und `pnpm lint` je 10/10 Tasks. Keine Fixture-Rückstände in der lebenden DB.

## Task Commits

1. **Task 1: Freundesliste, Anfragelisten und Entfreunden** — `eba0315` (feat)
2. **Task 2: Spec für Symmetrie, Richtungspartition, Sortierung und Leerzustände** — `aac0d79` (test)

## Files Created/Modified

**Neu:**
- `apps/api/test/friend-lists.spec.ts` — 11 service-level Fälle, fünf Wegwerf-Konten, Fixtures ausschliesslich über die 07-03-Lifecycle-Methoden, kein HTTP und kein OTP

**Geändert:**
- `packages/contracts/src/schemas.ts` — `friendSchema`, `friendRequestItemSchema`, `friendRequestListsSchema` samt Typen; alle mit dem eingebetteten `profile` in der Form der anderen drei Pfade
- `packages/contracts/src/router.ts` — drei Route-Keys: `GET /me/friends`, `GET /me/friend-requests`, `DELETE /me/friends/:accountId`
- `apps/api/src/friendship/visitor-projection.ts` — `pickForeignProfile`
- `apps/api/src/friendship/friendship.service.ts` — `listFriends`, `listRequests`, `unfriend`; `RemoveFriendshipResult`
- `apps/api/src/friendship/friendship.controller.ts` — drei weitere `@TsRestHandler`, jeder mit `@Session()`

## Decisions Made

- **Die Listen selektieren `from(visitorProfile)` und joinen die Beziehungstabelle**, nicht umgekehrt. Beim INNER JOIN ist das semantisch identisch, aber es hat einen konkreten Nutzen: die Zahl der Selects über die Profiltabelle und die Zahl der `foreignProfileColumns`-Nutzungen bewegen sich damit im Gleichschritt, was genau die Invariante ist, die das (so nicht erfüllbare) Zählkriterium des Plans messen wollte — siehe Deviations.
- **Kein Listenelement trägt eine `relation`.** In der Freundesliste wäre sie konstant `friends`, in den Anfragelisten steckt die Richtung schon in der Listenzugehörigkeit. Beides wäre eine zweite Quelle für einen Fakt, den die Struktur bereits ausdrückt — und damit eine Stelle, an der ein späterer Fehler zwei widersprechende Aussagen erzeugen könnte.
- **`pickForeignProfile` nimmt den Contract-Typ als Parameter** (`VisitorProfileForeign`), nicht eine strukturelle Hilfsform. Folge: ein Feld, das jemand `visitorProfileForeignSchema` hinzufügt, bricht zuerst den Typecheck **dieser Funktion** — also an genau der Stelle, an der die Frage „gehört das wirklich in die Fremd-View?" gestellt werden muss.
- **`unfriend` beantwortet Selbst-Adjazenz vor `canonicalPair`.** Streng nötig wäre es hier nicht: ein Paar aus zwei gleichen IDs verletzt den Ordnungs-CHECK, träfe aber beim DELETE einfach keine Zeile. Das Muster aus 07-01/07-03 wird trotzdem fortgeführt, weil eine Ausnahme davon beim nächsten Schreibpfad kopiert würde.
- **`RemoveFriendshipResult` ist ein eigener Typ neben `RemoveRequestResult`**, mit derselben Ein-Zweig-Begründung. Der Plan schrieb `Promise<{ status: 'removed' }>`; ein benannter Typ trägt die Begründung (T-07-21) dorthin, wo ein späterer Mapper sie liest, bevor er einen zweiten Statuscode erfindet.

## Deviations from Plan

### Nicht erfüllbar, weil das Kriterium einer Zusage aus 07-03 widerspricht

**1. `from(visitorProfile)` kommt 5×, `foreignProfileColumns` 7× vor — das Akzeptanzkriterium verlangt Gleichstand**

- Das Kriterium lautet: „die Zahl der Vorkommen von `from(visitorProfile)` ist gleich der Zahl der Vorkommen von `foreignProfileColumns`". Es kann nicht aufgehen, und zwar aus zwei unabhängigen Gründen:
  1. **Ein Select über `visitor_profile` darf die Fremd-View bewusst NICHT lesen.** Die Existenzprüfung in `sendRequest` (07-03) selektiert ausdrücklich nur `accountId`, weil dieser Endpunkt keine Profildaten zurückgibt und deshalb auch keine lesen soll (T-07-15). Sie ist der fünfte `from(visitorProfile)`, dem kein `foreignProfileColumns` gegenübersteht — und das ist korrekt so.
  2. **`grep -c` zählt Import-Zeile und Doc-Kommentare mit.** Von den 7 Treffern sind 4 echte Select-Nutzungen, 1 der Import und 2 erklärende Kommentare.
- **Entschieden:** dem Aktionstext und der Absicht gefolgt. Die tragfähige Formulierung ist „**jeder Select, der eine Fremd-View produziert, übergibt `foreignProfileColumns`**" — und die ist erfüllt: 4 Fremd-View-Selects, 4× die Konstante, 0 handgeschriebene Spaltenlisten. Die Zählung **nicht** durch einen zusätzlichen Doc-Kommentar auf Gleichstand gebracht; das wäre exakt das Padding, das 07-03 (Deviation 2) als „fälschlich bestandener Check" protokolliert hat.
- Dritter Fall derselben Klasse nach 07-02 (`inArray`) und 07-03 (`db.transaction`). **Hinweis für 07-05:** eine grep-Zählung roher Aufrufstellen ist als VIS-02-Invariante untauglich. Die belastbaren Metriken sind: genau ein `export const foreignProfileColumns`, genau ein `export function pickForeignProfile`, und kein Vorkommen der sechs Feldnamen als Objektliteral ausserhalb von `visitor-projection.ts`.

### Korrigiert, weil der Plan eine nicht funktionierende Kommandoform nennt

**2. Die Testlauf-Filterform aus den `<verify>`-Blöcken filtert nicht**

- `pnpm --filter @quiks/api test -- friend-lists` reicht das Argument nicht als vitest-Filter durch, sondern führt die gesamte Suite aus. Dieselbe Beobachtung wie in 07-01, 07-02 und 07-03; die Form steht unverändert auch im Akzeptanzkriterium und `<verify>` von 07-05.
- **Verwendet wurde:** `cd apps/api && pnpm exec vitest run test/friend-lists.spec.ts --reporter=verbose`. Kein Code-Defekt, nur eine Korrektur an der Prüfmethode.

---

**Total deviations:** 0 auto-fixed (Rule 1–3), 1 bewusst nicht erfülltes widersprüchliches Zählkriterium, 1 korrigierte Kommandoform
**Impact on plan:** Kein Scope Creep. Beide Listen, das Entfreunden und der Spec entsprechen dem Aktionstext des Plans zeichengenau.

## Issues Encountered

**`requirements.mark-complete` bleibt defekt** (07-01/07-02/07-03 dokumentiert, Orchestrator-Anweisung: nicht bekämpfen). `requirements-completed` dieses Plans ist deshalb bewusst **leer**. Inhaltlich passt das: VIS-01 verlangt die Fremd-View auf allen vier D-04-Pfaden — die stehen ab jetzt zwar alle, aber VIS-02s Einzigkeitsbeweis und der VIS-01-Abwesenheitsbeweis über alle vier Pfade sind ausdrücklich Plan 07-05. Der Haken gehört ans Phasenende, und der Tooling-Defekt ist bis dahin zu prüfen — sonst hakt sie auch dann niemand ab.

**`state.update-progress` meldet „Progress field not found in STATE.md"** — der Workstream-State hat kein Progress-Feld. No-op wie vom Orchestrator angekündigt, kein Fehler.

**Nicht behoben (vorbestehend, Scope-Boundary):** die verwaiste Zeile in `drizzle.__drizzle_migrations` aus 07-01. Dieser Plan legt keine Migration an und braucht keine — Migration `0005` deckt beide Tabellen bereits ab.

## Verification Results

Alle drei Punkte aus `<verification>` des Plans, ehrlich berichtet:

| # | Prüfung | Ergebnis |
|---|---|---|
| 1 | `pnpm typecheck` und `pnpm lint` workspace-weit | **grün** (je 10/10 Tasks) |
| 2 | `pnpm --filter @quiks/api test` — Gesamtsuite | **grün** — 13 Dateien, **94 Tests** (vorher 12/83) |
| 3 | Die neue Listenstrecke `friend-lists.spec.ts` (korrigierte Kommandoform) | **grün** — 11/11 |

Zusätzlich mechanisch geprüft:

| Prüfung | Ergebnis | Kriterium |
|---|---|---|
| Route-Keys `listFriends` / `listFriendRequests` / `unfriend` in `router.ts` | 3 | vorhanden ✓ |
| `export const foreignProfileColumns` in `visitor-projection.ts` | 1 | genau 1 ✓ |
| `export function pickForeignProfile` in `visitor-projection.ts` | 1 | vorhanden ✓ |
| `grep -c "pickForeignProfile"` im Service | 4 | ≥ 2 ✓ |
| `grep -c "asc(visitorProfile.username)"` im Service | 3 | ≥ 3 ✓ |
| `grep -c "@Session()"` im Controller | 9 | ≥ 9 ✓ |
| `grep -c "canonicalPair"` im Service | 9 | ≥ 6 ✓ |
| `grep -c "from(visitorProfile)"` / `"foreignProfileColumns"` im Service | 5 / 7 | Plan: Gleichstand — siehe Deviation 1 |
| `it(`-Blöcke im Spec | 11 | ≥ 11 ✓ |
| `signInWithOtp\|createVisitor\|createTestApp` im Spec | 0 | 0 ✓ |
| `insert(friendship)` im Spec | 0 | 0 ✓ |
| `toEqual([])` im Spec | 3 | vorhanden ✓ |
| `expect(...).rejects` im Spec | 0 | 0 ✓ |
| **Gegenprobe:** `orderBy` in `listFriends` temporär entfernt | genau Fall 4 rot (1 failed / 10 passed), danach wiederhergestellt, `git diff --stat` leer | Sortiertest nicht vakuum-grün |
| Fixture-Rückstände nach dem Lauf (psql, Docker-Postgres) | `friendship` 0 · `friend_request` 0 · verwaiste Profile 0 · verwaiste `user` 0 | ✓ |

## Known Stubs

Keine. `toIsoString` aus 07-01 — in 07-02 und 07-03 noch ohne Aufrufer und dort jeweils als „kein Stub" protokolliert — hat mit `listFriends` und `listRequests` jetzt seine beiden vorgesehenen Aufrufstellen.

## Threat Flags

Keine neue Sicherheitsfläche ausserhalb des `<threat_model>` dieses Plans: drei Endpunkte wie geplant, kein neuer Auth-Pfad, keine Schemaänderung, kein neues Paket (T-07-SC unverändert).

Stand der fünf `mitigate`-Einträge:

| Threat | Stand |
|---|---|
| T-07-18 (Information Disclosure über eingebettete Profile) | umgesetzt — beide Listen tragen `visitorProfileForeignSchema` als eingebettetes `profile`, selektiert über `foreignProfileColumns`, geformt über `pickForeignProfile`; Testfälle 3 und 5 prüfen die Schlüsselzahl 6. Der Beweis am serialisierten HTTP-Body folgt in 07-05 |
| T-07-19 (EoP: fremde Liste lesen) | umgesetzt — beide Listenrouten deklarieren weder `pathParams` noch `query` noch `body`; `session.user.id` steht in der Join-Bedingung selbst |
| T-07-20 (Tampering: fremde Freundschaft auflösen) | umgesetzt — `unfriend` bildet das Paar aus Aufrufer und Ziel; ein Paar ohne den Aufrufer ist nicht adressierbar, weil er immer eine der beiden Hälften stellt |
| T-07-21 (Auskunft über nie bestandene Freundschaft) | umgesetzt — ein einziger 200-Zweig contract- und typseitig; Testfälle 9 und 10 belegen die identische Antwort |
| T-07-22 (unbegrenzte Listenlänge) | bewusst `accept`, unverändert — keine Paginierung in v1.1; als Ehrlichkeitsauflage in 07-05 zu führen |

## User Setup Required

None — keine externe Konfiguration, kein neues Paket, keine Migration.

## Next Phase Readiness

**Bereit für Welle 5 (Plan 07-05, Einzigkeits- und Isolationsbeweis).** Direkt benutzbar:

- **Vier D-04-Zugriffspfade stehen** — Handle-Lookup, Suche, Anfragelisten, Freundesliste. Der VIS-01-Abwesenheitsbeweis kann jetzt über alle vier am serialisierten Body geführt werden statt nur über einen.
- **Die belastbaren VIS-02-Metriken** sind genau ein `export const foreignProfileColumns`, genau ein `export function pickForeignProfile` und kein Objektliteral der sechs Feldnamen ausserhalb von `visitor-projection.ts` — **nicht** eine Zählung von `from(visitorProfile)`-Aufrufstellen (siehe Deviation 1, dritter Fall dieser Kriteriums-Klasse in Folge).
- **Das Fixture-Muster dieses Specs** (fünf Konten, Fixtures über die Lifecycle-Methoden, Usernames mit absichtlich falscher Einfügereihenfolge, `inArray`-Cleanup in Abhängigkeitsreihenfolge) ist für die beiden 07-05-Specs 1:1 übernehmbar und umgeht den OTP-Rate-Limiter vollständig — was zählt, weil `friendship-isolation.spec.ts` HTTP-Fälle braucht und jeder OTP-Sign-in vom Kontingent von drei Anfragen pro 60 s abgeht.
- **Kommandoform korrigieren:** `cd apps/api && pnpm exec vitest run test/<spec>.spec.ts` statt der Filterform aus den `<verify>`-Blöcken.

Offen, unverändert: IDN-02 (per-Feld-Sichtbarkeit, Altersgrenze, Flinta-Filter) — die Fremd-View ist die Stelle, an der sie greift. FRND-09 (Blockieren/Melden) samt der akzeptierten Enumerations- und DoS-Exposition (T-07-08, T-07-16, T-07-22) bleibt nach v1.1.

## Self-Check: PASSED

- `apps/api/test/friend-lists.spec.ts` existiert auf der Platte; alle fünf geänderten Dateien sind im Arbeitsbaum vorhanden.
- Beide Task-Commits sind in `git log --all` auffindbar: `eba0315` (feat), `aac0d79` (test).
- Diese SUMMARY liegt unter `.planning/workstreams/mobile/phases/07-profile-visibility-friendship-backend/07-04-SUMMARY.md`.
