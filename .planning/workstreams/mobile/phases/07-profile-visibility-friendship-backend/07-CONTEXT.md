# Phase 7: Profile Visibility & Friendship Backend - Context

**Gathered:** 2026-08-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Die API kann ausdrücken, **wer was über wen sehen darf**, und Freundschaften existieren als
echtes, **user-globales** Modell mit vollständigem Request-Lifecycle — bevor irgendein Screen
etwas leaken kann.

**In dieser Phase (Backend-only, kein Screen — UI hint: no):**

- Split der Profil-Projektion in **Owner-View** und **Fremd-View** (VIS-01, VIS-02) — tilgt T-06-06
- `friendship` + `friend_request` Schema (user-global, **kein** `festivalId`) + Migration
- Request-Lifecycle-Endpunkte: senden, annehmen, ablehnen, zurückziehen, entfreunden
- Username-Suche und Handle-Lookup, beide über **dieselbe** Projektionsfunktion
- Freundesliste und Anfragelisten (eingehend/ausgehend)

**Nicht in dieser Phase:** jede UI (Phase 8), QR-Scanner/Kamera (Phase 8), Freunde-im-Festival-
Schnittmenge FRND-07 (Phase 9), Blockieren/Melden FRND-09 (nach v1.1), Profil-Bearbeiten PROF-02,
per-Feld-Sichtbarkeit/Altersgrenze/Flinta-Filter IDN-02 (wartet auf Birgits Konzept).

</domain>

<decisions>
## Implementation Decisions

### Fremdprofil-Projektion (VIS-01, VIS-02)

- **D-01:** **Genau zwei Sichtbarkeitsstufen** — Owner-View und **eine** Fremd-View. Fremde und
  Freunde sehen dasselbe; Freundschaft schaltet **keine** zusätzlichen Felder frei. Begründung:
  VIS-02 verlangt beweisbar „keinen zweiten Codepfad" — mit genau einer Fremd-Projektionsfunktion
  ist das trivial testbar, und es existiert keine Stelle, an der ein vergessener Freundschafts-
  Check Felder durchlässt. — **Reversibility:** costly — eine dritte Stufe später nachzurüsten
  heißt, jeden Aufrufer der Fremd-Projektion um einen Freundschaftskontext zu erweitern.
- **D-02:** Die **Fremd-View trägt**: `accountId`, `username`, `displayName`, `avatar`, `pronoun`,
  `gender`. Sie trägt **NICHT**: `birthDate`, E-Mail, `createdAt`, `socials`, `socialsVisibility`.
  Die Owner-View bleibt unverändert das, was `GET /me` heute liefert.
  ⚠️ **Bewusst getroffene Vorwegnahme:** Der User hat `gender` explizit in die Fremd-View gewählt,
  nachdem der Konflikt benannt wurde. `gender` ist genau das Feld, an dem **IDN-02** (Flinta-Filter,
  Sicherheits-/Jugendschutzkonzept von Birgit) noch hängt. Das ist eine getroffene Produkt-
  entscheidung, **kein Versehen** — wenn IDN-02 landet, ist dies der Ort, an dem sie greift.
  — **Reversibility:** one-way — `gender` ist danach ein veröffentlichtes Feld des Fremd-
  Response-Contracts; es wieder zu entfernen ist ein Breaking Change an `packages/contracts`
  plus ein Client-Release.
- **D-03:** **Feld-Abwesenheit ist die Testzusicherung.** Der Test für VIS-01 prüft, dass
  `birthDate` und E-Mail in der Fremd-Antwort **nicht vorkommen** — nicht bloß, dass die erlaubten
  Felder da sind. Ein Test, der nur Anwesenheit prüft, übersieht genau den Leak, den diese Phase
  verhindern soll.
- **D-04:** **Zugriffspfade auf die Fremd-View:** (a) Handle-Lookup (ein Handle → ein Profil,
  nötig damit Phase 8 nach QR-Scan bzw. Handle-Eingabe zeigen kann, *wen* man anfragt),
  (b) eingebettet in Suchtreffer, (c) eingebettet in Anfragelisten, (d) eingebettet in die
  Freundesliste. **Kein** darüber hinausgehender Fremdprofil-Detail-Endpunkt — kein Requirement
  in v1.1 fordert einen Detail-Screen.
- **D-05:** **Kein Auffindbarkeits-Opt-out in v1.1.** Jeder mit abgeschlossenem Profil bleibt per
  Handle und per Username-Suche findbar. Kein `searchable`-Flag. Begründung: ein halber Schutz
  ohne UI wäre tot und könnte den echten (FRND-09, mit Report-Pfad) verzögern. Die Exposition ist
  in `REQUIREMENTS.md` § Future Requirements bereits offen dokumentiert.

### Username-Suche (FRND-03-Substrat)

- **D-06:** **Prefix-Match, case-insensitive** — `lower(username) LIKE 'eingabe%'`. Nutzt exakt den
  vorhandenen Functional-Index `visitor_profile_username_lower_unq`; kein neues Index-Design,
  insbesondere **kein** `pg_trgm`. Teilstring-Suche ist bewusst verworfen.
- **D-07:** **Jeder Suchtreffer trägt den Beziehungsstatus** `relation`:
  `none | requestOutgoing | requestIncoming | friends | self`. Damit zeigt Phase 8 pro Zeile den
  richtigen Button, statt eine Anfrage zu senden, die der Server als Duplikat abweist.
- **D-08:** **Ab 2 Zeichen, maximal 20 Treffer**, stabil sortiert nach `username` aufsteigend.
  Keine Relevanz-Heuristik — die Reihenfolge muss nachvollziehbar und testbar sein.
- **D-09:** **Nur `username` wird durchsucht, nicht `displayName`.** `displayName` ist frei
  wählbar und nicht eindeutig; ihn durchsuchbar zu machen würde ihn zum öffentlichen Suchschlüssel
  erheben, ohne dass das je entschieden wurde.

### Request-Lifecycle & Freundschaftsmodell

- **D-10:** **Gegenanfrage = Auto-Accept.** Ist A→B offen und B fragt A an, entsteht **sofort die
  Freundschaft** und die offene Anfrage wird aufgelöst. Das ist zugleich der Auflösungspfad für das
  Reverse-Direction-Rennen: bei gleichzeitigem A→B und B→A gewinnt ein Insert, der andere läuft in
  denselben Auto-Accept-Pfad. Kein Fehler, keine zweite Zeile, keine zwei Freundschaften.
- **D-11:** **Erneutes Anfragen nach Decline ist sofort erlaubt** — kein Cooldown, keine Sperre.
  Ablehnen ist eine Aussage über die *Anfrage*, nicht über die Person. Eine Sperre hier wäre ein
  verstecktes Pseudo-Blocking und würde vortäuschen, es gäbe einen Schutz, den v1.1 nicht hat.
- **D-12:** **Decline, Withdraw und Accept löschen die Request-Zeile.** Kein `status`-Feld, keine
  Historie abgelehnter Anfragen. Damit gilt: **höchstens EINE Request-Zeile pro Personenpaar**, und
  der Unique-Constraint auf dem kanonisch geordneten Paar ist die Invariante, die das Duplikat-
  Rennen schon im Schema erschlägt — statt eines Status, den ein Query zu prüfen vergessen kann.
  — **Reversibility:** one-way — eine Historie später nachzurüsten braucht eine Migration und
  ändert die Bedeutung des Unique-Constraints.
- **D-13:** **Kein Limit auf offene ausgehende Anfragen** in v1.1. Konsistent mit D-05 und D-11:
  kein halber Schutz vor FRND-09.
- **D-14 (Claude-Default, technisch):** Freundschaft wird als **eine** Zeile mit **kanonisch
  geordnetem Paar** gespeichert (`lowerId`, `higherId` — lexikografisch sortiert), Composite-PK
  bzw. Unique-Constraint darauf, plus CHECK `lowerId < higherId`. Damit ist eine einseitige
  Freundschaft **nicht ausdrückbar** (Roadmap-Erfolgskriterium 4) und Entfreunden ist trivial
  symmetrisch. Kein Spiegelzeilen-Paar. Dasselbe kanonische Paar plus eine separate
  `requesterId`-Spalte trägt `friend_request` (das Paar ist ungeordnet-eindeutig, die Richtung
  steckt in `requesterId`).
- **D-15 (Claude-Default, technisch):** Beide Tabellen FKen auf `visitor_profile.accountId`
  (`text`), **nicht** auf `user.id` — dasselbe Muster wie `my_festival`, das die Invariante
  „nur mit abgeschlossenem Profil" auf Schema-Ebene kodiert. `onDelete: 'cascade'`. **Kein
  `festivalId` auf beiden Tabellen** (ADR-014, Erfolgskriterium 3).

### Handle / quiks-Code

- **D-16:** **Der quiks-Code IST `@username`** — kein zweiter Identifikator. Vorlesbar, tippbar,
  teilbar; genau eine Identität. `username` ist heute unveränderlich (Bearbeiten ist PROF-02 und
  nicht in v1.1), in diesem Milestone bricht also nichts. Wenn PROF-02 später Umbenennen erlaubt,
  ist **das** die Phase, die auch „alte QR-Codes" beantworten muss — hier explizit vermerkt, damit
  es dort nicht neu entdeckt wird.
- **D-17 (Vorentscheidung für Phase 8, Backend unberührt):** Der QR-Code trägt **namespaced
  Klartext**, z.B. `quiks:u/max.mustermann`. Nur der In-App-Scanner interpretiert das; ein fremder
  QR wird sauber als „nicht von quiks" abgewiesen. **Kein neuer Deep-Link** — der Capture-Pfad hat
  in Phase 5 den Unmatched-Route-Bug produziert und wird in Phase 9 durch NAV-03
  (`home`→`start`) ohnehin schon angefasst; beides gleichzeitig zu bewegen ist unnötiges Risiko.

### Claude's Discretion

Der User hat **keine** Frage an Claude delegiert („You decide" kam nicht vor). Folgendes ist
bewusst **nicht** gefragt worden, weil es technische Umsetzung ist und beim Planer liegt:

- Endpunkt-Zuschnitt und Pfad-Namensgebung im ts-rest-Contract (`/me/friends`, `/friend-requests`,
  `/visitors/:username` o.ä.) — Contract-first, ein Endpunkt pro Lifecycle-Übergang.
- Ob Freundesliste und Anfragelisten getrennte Endpunkte sind oder ein kombinierter.
- Migrationsnummer/-name (nächste ist `0005_*`), Index-Auswahl, Query-Formulierung.
- Verhalten bei „Handle nicht gefunden" (404 vs. `null`) — folgt der bestehenden Hausregel
  „Nullable für nicht gefunden, Controller mappt auf 404".
- Idempotenz-Umsetzung (`onConflictDoNothing` / Postgres `23505`-Catch) — Muster existiert bereits
  in `festival.service.ts` und `me.service.ts`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bindende Architekturentscheidungen
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-014 (Z. 241–300) — Mandantengrenze & Datenklassen.
  **Freundschaften sind user-global** (Punkt 3), „wer ist hier" = Freunde ∩ gespeichertes Festival,
  **niemals GPS/Präsenz**. Das ist die Quelle für „kein `festivalId` auf `friendship`".
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-016 (Z. 338–367) — Identitätsmodell Account → VisitorProfile.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-021 (Z. 487–515) — Umsetzung des Identitätsschemas:
  getrennte Tabelle, keine org-/username-Plugins.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-020 (Z. 471–486) — **kein 1:1-DM, niemals.** Relevant hier,
  weil eine Freundschaft *keinen* Nachrichtenkanal impliziert.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-012 — Locale-Achsen; user-generierter Inhalt
  (`username`/`displayName`) wird **nie** übersetzt.

### Phasen-Scope & Requirements
- `.planning/workstreams/mobile/ROADMAP.md` §„Phase 7" (Z. 46–71) — Ziel, die vier Erfolgs-
  kriterien, das „Also lands"-Substrat und die Rennbedingungs-Warnung.
- `.planning/workstreams/mobile/REQUIREMENTS.md` §VIS (Z. 13–20) — VIS-01/VIS-02 im Wortlaut;
  §Future Requirements (Z. 56–65) — FRND-09/IDN-02 als bewusst Zurückgestelltes.
- `.planning/workstreams/mobile/STATE.md` §Blockers/Concerns — T-06-06 als blockierende Schuld,
  SEC-02 als vererbte Cross-Tenant-Testpflicht.

### Die Schuld, die diese Phase tilgt (T-06-06)
- `packages/contracts/src/schemas.ts:44-73` — `visitorProfilePublicSchema` **mit** dem
  T-06-06-Kommentar, der den Split hier wörtlich vorschreibt. **Das ist die Datei, die sich ändert.**
- `packages/db/src/schema/visitor-profile.ts:28-64` — Tabellendefinition und derselbe Vorbehalt im
  Doc-Kommentar; beide Kommentare sind beim Landen des Splits zu aktualisieren, nicht stehen zu lassen.

### Muster, die kopiert werden
- `packages/db/src/schema/my-festival.ts` — das Vorbild für beide neuen Tabellen: Composite-PK,
  `text`-FK auf `visitor_profile.accountId`, `onDelete: 'cascade'`, drizzle-zod-Basisschemata.
- `apps/api/test/username-race.spec.ts` — **fertiger Präzedenzfall** für den nebenläufigen
  Duplikat-Test, den Erfolgskriterium 4 verlangt.
- `apps/api/test/festival-isolation.spec.ts` — Baseline des SEC-02-Cross-Tenant-Tests.
- `.planning/codebase/ARCHITECTURE.md` §Anti-Patterns — „Client-Supplied Scope": der Scope kommt
  **immer** aus `session.user.id`, nie aus einem Query-Parameter.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`lower()`-Helper + `uniqueIndex`** (`packages/db/src/schema/visitor-profile.ts:23-26,63`) —
  derselbe Functional-Index trägt die case-insensitive Prefix-Suche aus D-06. Kein neuer Index nötig.
- **`myFestival`-Tabellenmuster** (`packages/db/src/schema/my-festival.ts:23-39`) — Composite-PK
  über zwei IDs, `text`-FK auf `visitor_profile.accountId`, `timestamp({withTimezone:true})
  .defaultNow()`, dazu `createInsertSchema`/`createSelectSchema`-Export. 1:1 übertragbar.
- **`MeService.getProfile(accountId)`** (`apps/api/src/me/me.service.ts:24`) — heute der **einzige**
  Producer der Profilprojektion. Nach dem Split ist er der Owner-Pfad; die Fremd-Projektion kommt
  als zweite, klar benannte Funktion daneben — und **nur** diese eine.
- **Fehler-Mapping-Muster** — Postgres `23505` → 409 (`me.service.ts`), `23503` → 409
  profile-required und `onConflictDoNothing()` für Idempotenz (`festival.service.ts:137-150`).
  Der idempotente Lifecycle aus Erfolgskriterium 4 braucht dafür nichts Neues.
- **`apps/api/test/username-race.spec.ts`** — nebenläufiger Insert-Test gegen echtes Postgres,
  direkt adaptierbar auf das A→B/B→A-Rennen.

### Established Patterns

- **Contract-first (ADR-006):** Jede Formänderung startet in `packages/contracts/src/router.ts`
  und `schemas.ts`; NestJS implementiert via `@TsRestHandler(contract.x)`, der Mobile-Client leitet
  seine Typen ab. Kein handgeschriebenes Interface daneben.
- **drizzle-zod als Basis, nie handgespiegelt (Pitfall 6):** Beide Projektionen werden aus
  `visitorProfileSelectSchema` via `.pick()` komponiert — dann bricht ein Spaltenrename den
  Typecheck, statt still zu driften. Achtung: die `.extend()`-Overrides in
  `visitor-profile.ts:123-165` sind kein Stilmittel, sondern umgehen einen drizzle-zod-
  Inferenz-Bug; jede neue `text()`-Spalte muss dort nachgetragen werden.
- **Scope aus der Session, nie vom Client** — `@Session() session: UserSession` →
  `session.user.id`. Gilt für jeden neuen Endpunkt dieser Phase.
- **Nullable für „nicht gefunden"**, Controller mappt auf 404; Service gibt bei Konflikten
  diskriminierte Unions zurück, keine Exceptions.
- **Testposture:** `apps/api` hat eine Integrationssuite gegen echtes lokales Postgres
  (Docker, **nicht** Neon). `apps/mobile` hat keinen RN-Component-Harness — für diese Backend-Phase
  irrelevant, alle Wahrheiten sind hier automatisiert prüfbar.

### Integration Points

- `packages/contracts/src/schemas.ts` — Split der Projektion; `meSchema` behält die Owner-View.
- `packages/contracts/src/router.ts` — neue Endpunkte (Suche, Handle-Lookup, Lifecycle, Listen).
- `packages/db/src/schema/` — zwei neue Tabellen + Export in `index.ts`; Migration `0005_*`
  (bisher `0000`–`0004` in `packages/db/drizzle/`).
- `apps/api/src/me/` bzw. ein neues Modul — Services/Controller; Modul-Registrierung in
  `app.module.ts`.
- **Kollisionszone `admin`:** `packages/db` und `packages/contracts` werden vom parallelen
  admin-Stream mitbenutzt. Diese Phase ändert **nur additiv** (zwei neue Tabellen) und fasst
  `visitor_profile` **nicht** an — aber die Migration muss aus **einem** Stream landen. Vor dem
  Ausführen der Migration kurz gegenprüfen, ob `admin` gerade `packages/db` bewegt.

</code_context>

<specifics>
## Specific Ideas

- Die vier Erfolgskriterien in `ROADMAP.md` sind bewusst als **Testzusagen** formuliert, nicht als
  Beschreibung. Insbesondere: „proven by a test that asserts field *absence*" (D-03) und „a test
  proves there is no second code path" — VIS-02 ist erst erfüllt, wenn ein Test die *Einzigkeit*
  der Fremd-Projektionsfunktion zeigt, nicht bloß ihre Korrektheit an einer Stelle.
- Erfolgskriterium 3 („eine in Festival A geschlossene Freundschaft ist nach dem Wechsel zu
  Festival B unverändert") ist als **Test** gemeint, nicht nur als Schema-Eigenschaft — trotz
  D-15 (kein `festivalId`) explizit ziehen.
- `code_review_depth: deep` für diese Phase (auth-adjazent + Migration), `research` bleibt **aus**
  (erst Phase 12 braucht es).

</specifics>

<deferred>
## Deferred Ideas

- **Auffindbarkeits-Schalter (`searchable`)** — abgewählt in D-05; gehört fachlich zu FRND-09
  (Blockieren/Melden), nicht als halbe Maßnahme davor.
- **Cooldown / Wiederholungssperre nach Decline** — abgewählt in D-11; ebenfalls FRND-09-Territorium.
- **Limit auf offene ausgehende Anfragen** — abgewählt in D-13; falls Missbrauch real wird, ist es
  ein billiger Nachzug (nur eine Zählabfrage plus ein Fehlerfall).
- **Dritte Sichtbarkeitsstufe (Fremder vs. Freund)** — abgewählt in D-01; wenn IDN-02 per-Feld-
  Sichtbarkeit bringt, ist das der natürliche Ort, es *dann* einzuführen.
- **Fremdprofil-Detail-Endpunkt und -Screen** — abgewählt in D-04; kandidiert für Phase 8/9, sobald
  ein Requirement einen Detail-Screen fordert.
- **`gender` hinter IDN-02-Policy stellen** — bewusst *nicht* jetzt (D-02); wenn Birgits Konzept
  landet, ist die Fremd-View die Stelle, an der es greift.
- **QR-Deep-Link (`quiks://u/…`)** — abgewählt in D-17 zugunsten von namespaced Klartext; sinnvoll
  erst, nachdem NAV-03 den Capture-Pfad in Phase 9 stabilisiert hat.
- **Username-Umbenennung und was sie mit alten QR-Codes macht** — gehört zu PROF-02; hier in D-16
  festgehalten, damit es dort nicht neu entdeckt wird.

</deferred>

---

*Phase: 7-Profile Visibility & Friendship Backend*
*Context gathered: 2026-08-12*
