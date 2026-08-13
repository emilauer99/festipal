---
phase: 07-profile-visibility-friendship-backend
reviewed: 2026-08-12T16:36:25Z
depth: deep
files_reviewed: 19
files_reviewed_list:
  - apps/api/src/app.module.ts
  - apps/api/src/friendship/friendship.controller.ts
  - apps/api/src/friendship/friendship.module.ts
  - apps/api/src/friendship/friendship.service.ts
  - apps/api/src/friendship/visitor-projection.ts
  - apps/api/src/me/me.service.ts
  - apps/api/test/foreign-projection.spec.ts
  - apps/api/test/friend-lists.spec.ts
  - apps/api/test/friend-request-race.spec.ts
  - apps/api/test/friendship-isolation.spec.ts
  - apps/api/test/projection-uniqueness.spec.ts
  - apps/api/test/username-search.spec.ts
  - packages/contracts/src/router.ts
  - packages/contracts/src/schemas.ts
  - packages/db/drizzle/0005_equal_molly_hayes.sql
  - packages/db/src/schema/friend-request.ts
  - packages/db/src/schema/friendship.ts
  - packages/db/src/schema/index.ts
  - packages/db/src/schema/visitor-profile.ts
findings:
  critical: 1
  warning: 4
  info: 5
  total: 10
status: issues_found
---

# Phase 7: Code Review Report

**Reviewed:** 2026-08-12T16:36:25Z
**Depth:** deep
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Die Phase liefert sauber geschichteten Code: Die VIS-01/VIS-02-Kernaussage hält im Review stand —
`foreignProfileColumns` / `pickForeignProfile` sind tatsächlich der einzige Weg, auf dem
Fremdprofil-Daten den Server verlassen; `birthDate` und E-Mail sind auf keinem der vier D-04-Pfade
erreichbar, weder über den Contract noch über die Selects. Die Autorisierung ist konsequent: Jeder
Handler leitet den Akteur ausschließlich aus `session.user.id` ab, Decline/Withdraw/Unfriend
antworten evidenzfrei, Accept kollabiert "kein Request" und "eigener Request" auf dieselbe 404.

Trotzdem ist die Phase **nicht shipbar wie sie ist**: Die kanonische Paar-Ordnung wird in
JavaScript (UTF-16-Code-Units) berechnet, aber vom `lower_id < higher_id`-CHECK unter der
**Datenbank-Collation** geprüft. Auf der lokalen Dev-Datenbank (`en_US.utf8`) widersprechen sich
die beiden Ordnungen für einen erheblichen Anteil echter (mixed-case) better-auth-Account-IDs —
empirisch am Live-System nachgewiesen. Das produziert 23514-Check-Violations, die als 500 auf
`POST /me/friend-requests` durchschlagen. Der in `07-05-SUMMARY.md` als "transienter, nicht
reproduzierbarer 500" protokollierte und als Treiber-Rauschen wegerklärte Fehler ist mit sehr
hoher Wahrscheinlichkeit genau dieser Bug. Details in CR-01.

Daneben: eine echte TOCTOU-Lücke im Accept-Pfad, ein zu grob gefangener 23503, und mehrere
gezielt geprüfte Löcher in der Invarianten-Heuristik von `projection-uniqueness.spec.ts`.

Die gesperrten Entscheidungen (D-02 `gender` in der Fremd-View, D-05 keine Discoverability-Opt-outs,
D-12 kein Status, D-14/D-15 kein `festivalId`) wurden respektiert und sind **nicht** Gegenstand
von Findings.

## Critical Issues

### CR-01: `canonicalPair`-Ordnung (JS-Code-Units) widerspricht dem `lower_id < higher_id`-CHECK (DB-Collation) — 500 auf dem Send-Request-Pfad für echte User-Paare

**File:** `apps/api/src/friendship/visitor-projection.ts:70-72` · `packages/db/src/schema/friendship.ts:44` · `packages/db/src/schema/friend-request.ts:41` · `packages/db/drizzle/0005_equal_molly_hayes.sql:6,15`

**Issue:** `canonicalPair` sortiert mit JavaScripts `a < b`, also byteweise nach UTF-16-Code-Units
(`'B' < 'a'` → **true**, weil `0x42 < 0x61`). Die CHECK-Constraints `friendship_pair_order_chk`
und `friend_request_pair_order_chk` vergleichen dagegen unter der **Default-Collation der
Datenbank**. Die lokale Docker-Postgres (Image `postgres:18`, keine `POSTGRES_INITDB_ARGS`) läuft
nachweislich mit `datcollate = en_US.utf8`, und dort gilt `'B' < 'a'` → **false**.

Das ist kein theoretisches Risiko — am Live-Dev-System verifiziert:

```
quiks=# select datcollate from pg_database where datname='quiks';
en_US.utf8
quiks=# select 'SM3ARlsikEW1O7MPbNIhzSQH4n0XDjSp' < 'aWahEqD22YkABtnuW0ajtLXOoxsJCTqr';
f      -- Postgres (en_US.utf8): NICHT kleiner
quiks=# select ('SM3ARlsi…' < 'aWahEqD2…' collate "C");
t      -- Byte-Ordnung (= JS): kleiner
```

Beide IDs sind **echte better-auth-User-IDs aus der Dev-DB** (alle 272 vorhandenen User-IDs sind
mixed-case, 32 Zeichen). Für dieses Paar liefert `canonicalPair` `lowerId = 'SM3A…'`, der INSERT
in `friend_request` verletzt den CHECK (`SQLSTATE 23514`), `openRequest` fängt nur `23503`/`23505`
und wirft alles andere weiter → **500** auf `POST /me/friend-requests`. Dasselbe gilt für
`sealFriendship` (Accept-Pfad) über `friendship_pair_order_chk`. Grob geschätzt widersprechen
sich die Ordnungen bei ~15–20 % zufälliger mixed-case-ID-Paare (immer wenn an der ersten
Differenzposition ein Großbuchstabe gegen einen alphabetisch früheren Kleinbuchstaben steht).

**Zwei Korollare:**
1. Der in `07-05-SUMMARY.md` ("Issues Encountered") berichtete **einmalige, nicht reproduzierbare
   500 auf `POST /api/v1/me/friend-requests` mit frisch angelegten Konten** passt exakt auf dieses
   Fehlerbild (frische Konten = frische zufällige mixed-case-IDs, ~1 Fehlversuch auf ~6–7 Läufe).
   Die dortige Erklärung "kurzlebige postgres.js-Verbindungen / opaker Treiberfehler" ist mit
   hoher Wahrscheinlichkeit falsch — `friendship-isolation.spec.ts` ist durch diesen Bug ein
   Münzwurf und wird wiederkehrend rot werden.
2. Die gesamte Testsuite ist blind dafür, weil **alle Service-Level-Fixtures ausschließlich
   lowercase-IDs** verwenden (`test-friend-request-race-…-${randomUUID()}` — UUIDs sind lowercase
   hex). Nur die HTTP-Specs benutzen echte better-auth-IDs, und dort entscheidet der Zufall
   (siehe WR-04).

Auf Neon (Default `C.UTF-8`) stimmen Byte- und Collation-Ordnung für ASCII überein — der Bug ist
dort latent statt akut. Aber eine Schema-Invariante, deren Gültigkeit von `datcollate` der
jeweiligen Umgebung abhängt, ist keine Invariante.

**Fix:** Die Vergleichs-Collation im CHECK explizit auf `"C"` pinnen (byteweise, identisch mit
JS-Code-Unit-Ordnung für die ASCII-IDs), per neuer Migration `0006_*`:

```sql
ALTER TABLE "friendship" DROP CONSTRAINT "friendship_pair_order_chk";
ALTER TABLE "friendship" ADD CONSTRAINT "friendship_pair_order_chk"
  CHECK ("lower_id" < "higher_id" COLLATE "C");
ALTER TABLE "friend_request" DROP CONSTRAINT "friend_request_pair_order_chk";
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_pair_order_chk"
  CHECK ("lower_id" < "higher_id" COLLATE "C");
```

Dazu die Drizzle-Schemata synchron halten (`sql`-Template der beiden `check(...)`-Definitionen um
`collate "C"` erweitern), und einen Regressionstest ergänzen, der `sendRequest`/`acceptRequest`
mit einem gezielt konstruierten Konflikt-Paar fährt (z. B. Account-IDs `'B' + …` und `'a' + …`).
Alternativ (gleichwertig): beide Spalten mit `COLLATE "C"` definieren — dann ordnet auch
`ORDER BY`/Index auf diesen Spalten byteweise.

## Warnings

### WR-01: TOCTOU in `acceptRequest` — ein nebenläufig zurückgezogener Request kann trotzdem zur Freundschaft werden

**File:** `apps/api/src/friendship/friendship.service.ts:365-377` (Pre-Flight-Read), `:390-407` (`sealFriendship`)

**Issue:** `acceptRequest` liest die Request-Zeile **außerhalb** der Transaktion (Z. 369–374) und
ruft dann `sealFriendship`, dessen Transaktion die Zeile bedingungslos löscht
(`delete … where friendRequestPair(pair)`, 0 Zeilen sind kein Fehler) und die Freundschaft
einfügt. Fenster: B ruft Accept auf, der Select sieht A→B; A zieht den Request **zwischen** Select
und Transaktion zurück (`withdrawRequest` committet); `sealFriendship` löscht 0 Zeilen und legt
die Freundschaft trotzdem an. As Withdraw-Intention geht verloren — A ist mit B befreundet,
obwohl A den Request nachweislich vor dem Zustandekommen zurückgezogen hat. Das Modul begründet
seine Transaktionen ausdrücklich damit, dass "no reader can observe the pair with neither of the
two" — dieser Pfad verletzt die stärkere Invariante "kein Accept ohne existierenden fremden
Request" aber im Schreibpfad selbst.

**Fix:** Prüfung und Löschung atomar machen — den Pre-Flight-Select streichen und in der
Transaktion bedingt löschen:

```ts
const deleted = await tx
  .delete(friendRequest)
  .where(and(friendRequestPair(pair), ne(friendRequest.requesterId, callerId)))
  .returning({ requesterId: friendRequest.requesterId });
if (deleted.length === 0) return { status: 'not-found' };
await tx.insert(friendship).values(pair).onConflictDoNothing();
```

(Der D-10-Auto-Accept-Pfad in `openRequest` hat dasselbe Fenster zwischen dem `existing`-Read
Z. 321–325 und `sealFriendship`; dort ist es vertretbarer, weil beide Seiten in dem Moment
nachweislich gleichzeitig Interesse signalisiert haben — dokumentieren oder mit derselben
bedingten Delete-Form schließen.)

### WR-02: 23503 in `openRequest` wird nicht nach Constraint diskriminiert — verschwundenes Ziel-Profil wird als "Complete your visitor profile" (409) fehletikettiert

**File:** `apps/api/src/friendship/friendship.service.ts:315-318`

**Issue:** Der Catch mappt **jede** FK-Verletzung (`23503`) auf `profile-required`, obwohl drei
FKs feuern können: `lower_id`, `higher_id`, `requester_id`. Wird das **Ziel**-Profil zwischen dem
Existenz-Check (Z. 275–280) und dem INSERT gelöscht (Account-Löschung kaskadiert auf
`visitor_profile`), feuert der FK der Ziel-Spalte — der Aufrufer, der sehr wohl ein Profil hat,
bekommt 409 "Complete your visitor profile before sending friend requests" statt 404. Das
widerspricht der im selben File dokumentierten Lehre (Konstanten-Kommentar Z. 47–52 /
WR-03 aus 06-REVIEW): zwei Verletzungen mit gegensätzlicher Bedeutung dürfen keine Antwort teilen,
und `me.service.ts` diskriminiert 23505 deshalb bereits per `constraint_name`.

**Fix:** `cause.constraint_name` auswerten: Ist es der FK der Spalte, die die **Caller**-ID trägt
(`pair.lowerId === callerId` → `friend_request_lower_id_…_fk`, sonst `…_higher_id_…_fk`) oder
`friend_request_requester_id_…_fk` → `profile-required`; ist es der FK der Ziel-Spalte →
`{ status: 'not-found' }`.

### WR-03: Die Invarianten-Heuristik in `projection-uniqueness.spec.ts` hat drei nachweisbare Löcher

**File:** `apps/api/test/projection-uniqueness.spec.ts:78-85, 257-264, 285-297, 321-329`

**Issue:** Der Spec ersetzt die (zu Recht verworfenen) grep-Zählungen durch eine
Identitäts-Spalten-Heuristik plus Contract-Walk — beides gut gedacht, aber die Linie hält an drei
Stellen nicht:

1. **Nicht-rekursives `readdir`** (Z. 257–264): Der Quelltext-Scan liest nur Dateien direkt in
   `apps/api/src/friendship/`. Eine zweite Projektion in `friendship/queries/foo.ts` (oder in
   jedem anderen Modul, z. B. einem künftigen `activity/`) ist für den Scan unsichtbar.
2. **Der Contract-Walk schützt nur `birthDate` und `email`** (Z. 80–85, 285–297). D-02 schließt
   aus der Fremd-View aber auch `createdAt`, `socials` und `socialsVisibility` aus. Eine NEUE
   Route, deren `profile` z. B. `socials` (jsonb, potenziell sensible Social-Links) trägt, passiert
   alle Absence-Checks — denn die Exakt-sechs-Schlüssel-Prüfung (Z. 321–329) ist entgegen der
   eigenen Doktrin ("never a positive list") eine **Positivliste von fünf bekannten Routen** und
   greift für neue Routen nicht.
3. Die Zwei-Spalten-Schwelle der Identitäts-Heuristik lässt eine Select-Map wie
   `{ accountId, username, displayName, socials }` durch (nur **eine** der vier gezählten
   Identitätsspalten).

**Fix:** (a) `readdir` rekursiv machen (`{ recursive: true }` bzw. Verzeichnisse abwandern und den
Scan-Wurzelpunkt auf `apps/api/src/` heben); (b) den Exception-Walk generalisieren: statt nur
`birthDate`/`email` alle Keys aus
`Object.keys(visitorProfileSelectSchema.shape)` minus `FOREIGN_VIEW_KEYS` (plus `email`) gegen
alle Routen prüfen; (c) die Sechs-Schlüssel-Gleichheit auf **jede** Route ausdehnen, deren
Response irgendwo einen `profile`-Key trägt (per `collectKeys`-Abstieg auffindbar), statt auf die
fünf aufgezählten.

### WR-04: Service-Level-Fixtures modellieren die produktive Account-ID-Form nicht — lowercase-only IDs haben CR-01 unsichtbar gemacht

**File:** `apps/api/test/friend-request-race.spec.ts:22-29` · `apps/api/test/friend-lists.spec.ts:22-28` · `apps/api/test/username-search.spec.ts:48-57`

**Issue:** Alle drei Service-Level-Suiten erzeugen Account-IDs der Form
`test-…-${randomUUID()}` — vollständig lowercase. Echte better-auth-IDs sind 32-stellig
**mixed-case** (alle 272 IDs der Dev-DB enthalten Großbuchstaben). Damit läuft `canonicalPair`
in den Tests nie in den Bereich, in dem JS- und Collation-Ordnung divergieren, und der
Race-/Lifecycle-Spec, der explizit "the schema resolves the race" beweist, beweist das nur für
eine ID-Form, die es in Produktion nicht gibt. Genau deshalb blieb CR-01 grün — und der eine
HTTP-Spec, der echte IDs benutzt (`friendship-isolation.spec.ts`), wurde beim einmaligen Rotlauf
als Infrastruktur-Rauschen abgetan.

**Fix:** Mindestens ein Fixture-Paar pro Lifecycle-Suite mit gezielt konfligierender Ordnung
aufnehmen (z. B. IDs `B${RUN}…` und `a${RUN}…`), plus einen Kommentar, warum diese Form
load-bearing ist. Nach dem CR-01-Fix wird dieses Paar zum Regressionstest.

## Info

### IN-01: `foreignProfileColumns` ist nicht typ-verriegelt — eine hinzugefügte Spalte kompiliert stillschweigend

**File:** `apps/api/src/friendship/visitor-projection.ts:23-30`

**Issue:** Die Doku behauptet, das Typ-Gegenstück sei `visitorProfileForeignSchema` und ein Drift
breche den Typecheck. Für `pickForeignProfile` stimmt das; für die Select-Map **nicht**: Fügt
jemand `birthDate: visitorProfile.birthDate` hinzu, kompilieren `lookupByUsername` und
`searchByUsername` weiter — das breitere Row-Objekt ist keine frische Literal-Zuweisung mehr,
also greift kein Excess-Property-Check auf `{ profile, relation }`. Der Schutz ist dann rein
runtime (Specs). **Fix:** Key-Set typseitig festnageln, z. B.
`satisfies Record<keyof VisitorProfileForeign, AnyPgColumn>` plus einem
`Exclude<keyof typeof foreignProfileColumns, keyof VisitorProfileForeign>`-Never-Assert (oder
äquivalentem exact-key-Helper).

### IN-02: Anonymous-401-Abdeckung fehlt für die fünf mutierenden Endpunkte

**File:** `apps/api/test/friendship-isolation.spec.ts:436-447`

**Issue:** Der 401-Parametertest deckt nur die vier GET-Routen ab. `sendFriendRequest`,
`accept`, `decline`, `withdraw` und `unfriend` verlassen sich ungetestet auf den globalen
AuthGuard. Der Guard ist global registriert (`auth.module.ts`), das Risiko ist also gering — aber
das Spec-Muster existiert bereits und fünf weitere `it.each`-Zeilen (mit leerem Body) wären
billig. **Fix:** die POST/DELETE-Routen in die `it.each`-Tabelle aufnehmen.

### IN-03: Erschöpfter Retry-Fallback in `openRequest` kann `requested` melden, obwohl keine Request-Zeile existiert

**File:** `apps/api/src/friendship/friendship.service.ts:338-339`

**Issue:** Nach zwei 23505-Zyklen mit jeweils wieder verschwundener Zeile antwortet der Fallback
`areFriends ? friends : requested` — im `requested`-Zweig existiert dann nachweislich **keine**
offene Anfrage; der Client rendert "Angefragt", der Gegenseite liegt nichts vor. Das Fenster ist
pathologisch klein (zwei aufeinanderfolgende Appear/Vanish-Zyklen), und D-11/D-13 machen ein
erneutes Senden kostenlos. **Fix (optional):** im Fallback statt zu raten ein letztes Mal die
Request-Zeile lesen, oder den Zweig als bewusste Eventual-Consistency-Lüge im Kommentar benennen.

### IN-04: `friendshipInsertSchema`/`friendRequestInsertSchema` (+ Select-Varianten) werden nirgends konsumiert

**File:** `packages/db/src/schema/friendship.ts:55-62` · `packages/db/src/schema/friend-request.ts:52-61`

**Issue:** Die vier drizzle-zod-Basen werden exportiert (Plan 07-01/07-04 sah die
Contract-Komposition auf ihnen vor), aber `packages/contracts` deklariert `friendSchema` /
`friendRequestItemSchema` als handgeschriebene `z.object` — inhaltlich vertretbar, weil die
Wire-Form (`friendsSince`/`requestedAt` als ISO-String) von der Spaltenform (`Date`) abweicht,
aber die Exporte sind damit tote Fläche und die Abweichung vom "compose, never hand-mirror"-
Konventionstext ist nirgends begründet. **Fix:** entweder die Timestamps via
`.pick({ createdAt: true })` + `.extend({ createdAt: z.string() })`-Umbenennung doch auf der Basis
komponieren, oder die ungenutzten Exporte entfernen bzw. einen Satz Begründung an die Schemas
schreiben.

### IN-05: `instanceof PostgresError` ist bei doppelt aufgelöstem `postgres`-Paket ein stiller Totalausfall der Fehlerdiskriminierung

**File:** `apps/api/src/friendship/friendship.service.ts:65-72` · `apps/api/src/me/me.service.ts:87`

**Issue:** Beide Services erkennen Treiberfehler per `instanceof`. Löst pnpm je zwei Instanzen
des `postgres`-Pakets auf (Hoisting-/Version-Skew zwischen `@quiks/db` und `apps/api`), schlägt
`instanceof` für alle Fehler fehl und **jeder** 23505/23503 degradiert zum 500 — genau die
Fehlerklasse, die 07-05 als "opaker Treiberfehler" beobachtet haben will. Bestehendes Idiom, kein
neuer Defekt dieser Phase. **Fix (optional):** zusätzlich strukturell prüfen
(`typeof cause.code === 'string'` + `'constraint_name' in cause`) statt nur nominal.

---

_Reviewed: 2026-08-12T16:36:25Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
