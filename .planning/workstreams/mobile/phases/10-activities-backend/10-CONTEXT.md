# Phase 10: Activities Backend - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Die API modelliert **Aktivitäten, ihre Tags und ihre Teilnehmer** — festival-scoped,
kapazitäts-erzwungen auf DB-Ebene und beweisbar tenant-isoliert (SEC-03). Backend-only,
kein Screen (UI hint: no — die Screens sind Phase 11).

**In dieser Phase (das „Also lands"-Substrat für Phase 11):**

- `activity`-Tabelle nach ADR-017: `creatorId`, optional `tagId`, `title` (Pflicht nur ohne Tag),
  optional `subtitle`, `description`, `location` (Freitext), optionaler einmaliger Geo-Punkt,
  `startTime`, `capacity` (nullable = unbegrenzt, D-08), `festivalId` NOT NULL
- Tag-Modell: `activity_tag` (nullable `festivalId`, null = globaler Katalog) +
  `activity_tag_translation` (ADR-012-Muster) + `festival_activity_tag` (Deaktivierung) —
  **ersetzt** die Scaffold-Altlast `tag`/`tag_translation`/`listTags` (D-01)
- Effektive Tag-Liste = aktivierte globale ∪ festival-eigene, mit Default-AN-Semantik (D-05)
- Teilnehmer-Modell + Join/Leave-Endpunkte mit DB-erzwungener Kapazität; Creator ist ab
  Erstellung Teilnehmer und kann nicht per Leave raus (D-09)
- Expliziter creator-only Delete-Endpunkt („Auflösen", D-09)
- Discovery-Endpunkt(e): öffentliche Liste blendet ab `startTime` aus, Teilnehmer sehen ihre
  Aktivitäten weiter (D-10/D-11); Teilnehmerzahl in der Liste, Namen nur im Detail (D-12)
- Seed: ~10 globale Start-Tags DE+EN (D-06)
- SEC-03-Cross-Tenant-Tests für jede neue Tabelle; der nullable-`festivalId`-Sonderfall von
  `activity_tag` bekommt seinen eigenen Test

**Nicht in dieser Phase:** jede UI (Phase 11), Klonen (reine UI-Aktion, Phase 11),
`activity_message`/Chat (Phase 12; sein SEC-03-Anteil fällt dort an), Aktivität bearbeiten
(kein v1.1-Requirement), Tag-Verwaltungs-Endpunkte (aktivieren/deaktivieren, Custom-Tags
anlegen — admin-Workstream, ADR-018), `category`/`guide` am Tag (admin additiv später),
ActInterest (braucht Timetable), jede Form von Präsenz/GPS (ADR-014).

</domain>

<decisions>
## Implementation Decisions

> Alle Entscheidungen am 2026-08-14 vom User im interaktiven Discuss gewählt (zwei davon nach
> Aufzeigen eines Konflikts revidiert — als solche markiert). D-07 bis D-12 sind produktsichtbare
> Semantik, die Phase 11 wörtlich übernimmt.

### Tag-Schema & Altlast `tag`

- **D-01 — Ersetzen, nicht migrieren:** Neue Tabellen `activity_tag` + `festival_activity_tag`
  nach ADR-017; die Scaffold-Tabellen `tag`/`tag_translation` und der `listTags`-Endpunkt werden
  **entfernt**. Begründung: 0 Zeilen Daten, 0 Clients (kein App-Code konsumiert `listTags`),
  und ADR-017 nennt ActivityTag ausdrücklich den **einzigen** Tag-Store. Der Contract-Breaking-
  Change ist folgenlos. — **Reversibility:** costly — nicht wegen der Altlast (die ist leer),
  sondern weil der admin-Stream gegen das neue Schema baut; es nach dem Landen umzuschneiden
  kollidiert mit dessen Katalog-UI (ADR-018).
- **D-02 — Tag-Labels sind übersetzt:** `activity_tag_translation` nach dem ADR-012-Muster
  (eine Zeile pro Locale, Fallback-Kette requested → Festival-Default → any, via bestehendem
  `resolveLocalized`). Grund: der **globale** Katalog bedient Festivals mit verschiedenen
  Default-Locales — ein einsprachiges Label bräche z. B. ein englisches Festival. Für globale
  Tags wird der Fallback im Kontext des **anfragenden** Festivals aufgelöst (dessen
  `defaultLocale`).
- **D-03 — Feldumfang v1.1: nur Label.** `activity_tag` trägt id, `festivalId` (nullable), slug,
  Timestamps + Übersetzungen (title). `category` und `guide` (ADR-017 optional) kommen **später
  additiv vom admin-Stream**, wenn dessen Katalog-UI sie braucht — genau die vereinbarte
  Arbeitsteilung (admin nur additiv).
- **D-04 — Deaktivieren wirkt nur auf die Auswahl-Liste.** Ein deaktivierter globaler Tag
  verschwindet aus der effektiven Liste (neue/geklonte Aktivitäten können ihn nicht mehr wählen;
  Create mit deaktiviertem oder fremdem Tag wird abgewiesen), **bestehende Aktivitäten zeigen Tag
  und Titel unverändert weiter**. ⚠️ *Revidierte Entscheidung:* der User wählte zunächst
  „auch rückwirkend ausblenden"; nach Aufzeigen des Konflikts mit der Auto-Titel-Regel
  (Titel = `tag.label` ⇒ Aktivität ohne Tag UND ohne Titel wäre regelwidrig) fiel die Wahl
  bewusst auf „nur Auswahl-Liste". Die Alternativen (Aktivität verschwindet mit /
  Label-Schnappschuss) wurden explizit verworfen.

### Global-Katalog-Bootstrap

- **D-05 — Globale Tags sind default-AN (opt-out).** Ohne `festival_activity_tag`-Zeile gilt ein
  globaler Tag als aktiviert; die Zeile mit `enabled=false` ist das Abschalten. Grund: in v1.1
  existiert kein Admin-UI — bei opt-in wäre die effektive Liste jedes Festivals leer und der
  Phase-11-Tag-Picker tot. Bewusster Preis: neue globale Tags erscheinen sofort bei allen
  Festivals. Erfolgskriterium 3 (Deaktivieren wirkt nur auf dieses eine Festival) ist gegen
  diese Semantik zu testen.
- **D-06 — Startkatalog: ~10 festival-typische Tags, vom Planner vorgeschlagen.** DE+EN-
  Übersetzungen, gepflanzt im bestehenden idempotenten Seed (`packages/db/scripts/seed.ts`).
  Der User sieht die konkrete Liste im Plan und passt sie dort an — sie ist Planinhalt,
  keine stillschweigende Fixture.

### Kapazität & Creator-Semantik

- **D-07 — Der Creator zählt zur Kapazität.** `capacity` = Gesamtplatzzahl inklusive Creator
  („8 Plätze" = 8 Personen, eine davon der Creator). Deckt sich wörtlich mit ADR-017.
- **D-08 — `capacity` ist optional: null = unbegrenzt.** *Gegen die Empfehlung bewusst gewählt.*
  Offene Treffen ohne Platzgrenze sind erlaubt. Konsequenz: der DB-Constraint und jeder
  „voll?"-Check tragen den null-Sonderfall, und Phase 11 muss „unbegrenzt" darstellen (kein
  Sitzzähler „x/y" ohne y). — **Reversibility:** one-way — `capacity` ist danach als nullable
  Feld im veröffentlichten Contract; es später Pflicht zu machen ist ein Breaking Change an
  `packages/contracts` plus Client-Release und eine Datenfrage für bestehende null-Zeilen.
- **D-09 — Creator-Leave → 409; Auflösen ist ein eigener Endpunkt.** Der Leave-Endpunkt
  verweigert dem Creator (Erfolgskriterium 4: die Invariante „Creator ist Teilnehmer" ist durch
  Verlassen **nicht** verletzbar). Der Ausweg für falsch erstellte Aktivitäten ist ein
  **expliziter creator-only Delete-Endpunkt** („Auflösen"), der die Aktivität samt Teilnehmern
  entfernt (Phase 12 hängt Chat-Historie an dieselbe Kaskade). Keine versteckte Nebenwirkung
  im Leave. — **Reversibility:** one-way — ein veröffentlichter Endpunkt in `packages/contracts`
  (dasselbe Argument wie `gender` in 07-01 und FRND-07 in 09-02).

### Discovery-Zuschnitt

- **D-10 — Öffentliche Discovery blendet ab `startTime` aus, Beitreten schließt mit.** Eine
  gestartete Aktivität erscheint Nicht-Teilnehmern nicht mehr in der Liste und ist nicht mehr
  beitretbar. (Es gibt bewusst **kein** `endTime`-Feld — „vorbei" ist nicht exakt bestimmbar;
  der Cutoff ist `startTime`, ohne Puffer-Heuristik.)
- **D-11 — Teilnehmer sehen ihre Aktivitäten weiter.** Das Ausblenden aus D-10 gilt **nur** für
  die öffentliche Discovery. Wer teilnimmt — inkl. Creator — behält Lesezugriff auf seine
  Aktivität auch nach `startTime` (Treffpunkt/Zeit, später der Phase-12-Chat). *Follow-up-
  Entscheidung nach Hinweis, dass sonst Ort und Chat exakt zum Start sterben.* Die API-Form
  (eigene „meine Aktivitäten"-Sicht vs. Flag im Listen-Endpunkt) liegt beim Planner; die
  Semantik ist gesetzt.
- **D-12 — Liste trägt Zahl, Detail trägt Namen.** Die Discovery-Liste liefert pro Aktivität nur
  Teilnehmerzahl + eigenen `joined`-Status; der Detail-Abruf liefert die volle Teilnehmerliste
  als **Fremd-View-Profile** — über `foreignProfileColumns`/`pickForeignProfile`, sonst bricht
  `projection-uniqueness.spec.ts` (VIS-02 ist Invariante). Damit exponiert kein Listen-Scroll
  alle Gäste, aber „wer kommt?" ist im Detail beantwortet.

### Claude's Discretion

Der User hat keine Frage explizit delegiert. Folgendes ist bewusst **nicht** gefragt worden,
weil es technische Umsetzung ist und beim Planner liegt:

- **Endpunkt-Zuschnitt und Pfade** im ts-rest-Contract (Liste/Detail/Create/Join/Leave/Delete/
  effektive Tag-Liste; ob „meine Aktivitäten" ein Query-Flag, eine Sektion oder ein eigener
  Endpunkt ist). `:festivalId` als UUID-Pfadparameter ist Hausstil (09-02).
- **Mechanik der DB-seitigen Kapazitätserzwingung** (Erfolgskriterium 2: konkurrierende Joins
  auf den letzten Platz dürfen nicht beide durchgehen) — Transaktion + Constraint statt
  App-Logik, Muster: Phase-7-`23505`-Idiom, `username-race.spec.ts` als Testpräzedenz,
  `postgresErrorOf`-Cause-Chain-Walker. Der null-Sonderfall aus D-08 gehört mitgetestet.
- **Geo-Punkt-Repräsentation** (zwei numerische Spalten reichen; kein PostGIS) — ADR-017 §2:
  einmalige Opt-in-Erfassung, dient nur „Route öffnen".
- **Schema-Verankerung der Creator-ist-Teilnehmer-Invariante** (Transaktion beim Create;
  ob zusätzlich schema-seitig erzwingbar, entscheidet der Planner).
- Join/Leave-**Idempotenz-Semantik** nach Hausregel (Phase-7-Vorbild: evidence-free 200).
- **Keine Pagination** in v1.1-Listen (Präzedenz `listFestivals`/`listFriends`), sofern der
  Planner nichts Gegenteiliges sieht.
- Migrationsnummer/-name (nächste ist `0007_*`), Index-Auswahl, Query-Formulierung,
  Fehler-Mapping (409/404 nach Hausregeln), Query-Key-Design ist Phase-11-Sache.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bindende Architekturentscheidungen

- `docs/DEVELOPMENT_DECISIONS.md` §ADR-017 (Z. 368–404) — **die Quelle dieser Phase.**
  Activity-Felder, Auto-Titel-Regel (mit Tag = `tag.label` + optional subtitle; ohne Tag ist
  `title` Pflicht), Klonen als reine UI-Aktion, Tag-Modell (nullable `festivalId`,
  Aktivierungstabelle, effektive Liste), Geo-Punkt als einmalige Opt-in-Erfassung,
  ActInterest als **getrenntes** Konzept (nicht in v1.1).
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-018 (Z. 406–438) — Tag-Katalogpflege und Aktivierung
  sind **Admin-Fläche** (Platform-Admin: globaler Katalog; Festival-Admin: aus-/abwählen +
  eigene). Mobile *konsumiert* nur — deshalb keine Tag-Verwaltungs-Endpunkte in dieser Phase.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-014 (Z. 241–300) — Mandantengrenze; Eintritt ist
  gate-less, Isolation ist Daten-Scoping (kein 403-Gate); kein Präsenz-/GPS-Signal.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-020 (Z. 471–486) — kein 1:1-DM, niemals; Chat existiert
  ab Phase 12 nur pro Aktivität. `projection-uniqueness.spec.ts` verriegelt das mechanisch.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-012 — Locale-Achsen. Tag-Titel sind **kuratierter,
  übersetzter** Inhalt (D-02); Activity-`title`/`subtitle`/`description`/`location` sind
  **user-generiert und werden nie übersetzt** (keine Translation-Tabellen dafür).
- `docs/concept/05-activities-social.md` — Detail-Entwurf zu ADR-017 (vom ADR referenziert).

### Phasen-Scope & Requirements

- `.planning/workstreams/mobile/ROADMAP.md` §„Phase 10: Activities Backend" (Z. 206–236) —
  Ziel, die vier Erfolgskriterien (als **Testzusagen** formuliert), das „Also lands"-Substrat,
  die Kollisionswarnung zu `packages/db`/`packages/contracts` und der Hinweis, dass der
  nullable-`festivalId`-Sonderfall von `activity_tag` einen **eigenen Test** braucht.
- `.planning/workstreams/mobile/REQUIREMENTS.md` §ACT (Z. 31–39) + §SEC (Z. 52–54) — SEC-03 ist
  das einzige Requirement dieser Phase; die ACT-Requirements werden erst mit Phase 11
  *beobachtbar*, ihr Substrat entsteht hier. §Out of Scope (Z. 67–79) — Offline-Create ist
  ausgeschlossen (online-only), Admin-Tag-Verwaltung gehört zum admin-Stream.
- `.planning/workstreams/mobile/STATE.md` §Blockers/Concerns — SEC-02/03 als vererbte
  Cross-Tenant-Testpflicht; `requirements.mark-complete` funktioniert im Workstream-Layout
  nicht (beim Phasenabschluss von Hand nachziehen); Testkommando-Fallstrick
  (`cd apps/api && pnpm exec vitest run test/<spec>.spec.ts`); Akzeptanzkriterien nicht als
  rohe grep-Zählung formulieren.

### Vorherige Phasen, deren Fläche berührt wird

- `.planning/workstreams/mobile/phases/07-profile-visibility-friendship-backend/07-CONTEXT.md` —
  die Muster, die diese Phase kopiert: Fremd-View **nur** über `foreignProfileColumns` +
  `pickForeignProfile` (D-12), Schema-Constraints statt App-Logik für Rennen, Feld-Abwesenheits-
  Tests, evidence-free 200.

### Die Altlast, die diese Phase entfernt

- `packages/db/src/schema/tag.ts` — die Scaffold-Tabellen `tag`/`tag_translation` (im Code
  selbst als „Example translatable, tenant-scoped entity" markiert). **Das ist die Datei, die
  ersetzt wird.** Zugehörig: `tagSchema`/`listTags` in `packages/contracts/src/schemas.ts:37-42`
  und `router.ts:44-50`, Handler in `apps/api/src/festival/festival.controller.ts:23-29` und
  `festival.service.ts:53-84`.

### Muster, die kopiert werden

- `packages/db/src/schema/my-festival.ts` — Vorbild für die Teilnehmer-Tabelle: Composite-PK,
  `text`-FK auf `visitor_profile.accountId` (kodiert „nur mit abgeschlossenem Profil" im
  Schema), `onDelete: 'cascade'`, drizzle-zod-Basisschemata.
- `apps/api/src/festival/festival.service.ts:50-84` — das Locale-Resolution-Muster
  (LEFT JOIN auf Translation-Tabelle + `resolveLocalized`), wiederverwendbar für die
  effektive Tag-Liste.
- `apps/api/test/username-race.spec.ts` — nebenläufiger Insert-Test gegen echtes Postgres;
  Präzedenz für den Kapazitäts-Rennen-Test (Erfolgskriterium 2).
- `apps/api/test/festival-isolation.spec.ts` — Baseline des SEC-02/03-Cross-Tenant-Tests.
- `apps/api/test/projection-uniqueness.spec.ts` — die VIS-02-Invariante, die der neue
  Teilnehmer-Detail-Pfad **erweitern statt umgehen** muss.
- `.planning/codebase/ARCHITECTURE.md` §Anti-Patterns — „Client-Supplied Scope": Scope kommt
  immer aus `session.user.id`; „Hardcoded Tenant ID": `festivalId` fließt als Parameter.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`foreignProfileColumns` / `pickForeignProfile`** (Phase 07) — die einzigen zugelassenen
  Leser/Former der Fremd-View; der Teilnehmer-Detail-Pfad (D-12) läuft darüber.
- **`postgresErrorOf`** (Phase 07-03, `friendship.service.ts`) — Cause-Chain-Walker für
  Postgres-Fehlercodes durch den postgres.js-`begin()`-Wrapper; für die Kapazitäts-Transaktion
  direkt wiederverwendbar.
- **`resolveLocalized`** (`packages/contracts/src/locale.ts`) + das listTags-Join-Muster —
  trägt die Tag-Titel-Auflösung aus D-02 ohne neue Maschinerie.
- **`packages/db/scripts/seed.ts`** — idempotenter Dev/Staging-Seed; bekommt die ~10 globalen
  Start-Tags (D-06).
- **Fehler-Mapping-Muster** — `23505` → 409/Übergang, `23503` → 409 profile-required,
  `onConflictDoNothing()` für Idempotenz (`festival.service.ts:137-150`, `me.service.ts`).

### Established Patterns

- **Contract-first (ADR-006):** jede Formänderung startet in `packages/contracts`; NestJS
  implementiert via `@TsRestHandler`; der Mobile-Client ist danach ohne Client-Code aufrufbar.
- **drizzle-zod als Basis, nie handgespiegelt:** Schemata aus `createSelectSchema` via `.pick()`;
  Achtung: `.extend()`-Overrides für `text()`-Spalten sind ein drizzle-zod-Workaround — jede
  neue `text()`-Spalte (title, subtitle, description, location) muss dort nachgezogen werden
  (Vorbild `visitor-profile.ts:123-165`).
- **Scope aus der Session** (`session.user.id`), `festivalId` aus dem Pfad — nie aus Query-Params.
- **Nullable für „nicht gefunden"**, Controller mappt auf 404; diskriminierte Unions für
  Konflikte, keine Exceptions.
- **Constraint statt App-Logik für Rennen** (Phase-7-Lehre D-10): das Kapazitäts-Rennen gehört
  in die Transaktion/den Constraint, nicht in einen check-then-insert.
- **Testposture:** `apps/api`-Integrationssuite gegen echtes lokales Docker-Postgres (nicht
  Neon); für diese Backend-Phase sind alle Wahrheiten automatisiert prüfbar — kein
  On-Device-Anteil.

### Integration Points

- `packages/contracts/src/schemas.ts` + `router.ts` — `tagSchema`/`listTags` raus, Activity-/
  Tag-/Teilnehmer-Schemata und -Endpunkte rein.
- `packages/db/src/schema/` — `tag.ts` raus; neu: `activity-tag.ts`, `activity.ts`,
  Teilnehmer-Tabelle; Export in `index.ts`; Migration `0007_*` (Drop + Create).
- `apps/api/src/festival/` — `listTags` entfällt; neues Aktivitäten-Modul + Registrierung in
  `app.module.ts`.
- ⚠️ **Kollisionszone `admin`:** `packages/db` und `packages/contracts` werden beide angefasst
  (Migration + Contract). Das Tag-Schema ist die mit admin geteilte Fläche — **aus diesem
  Stream landen**, admin bleibt additiv (`category`/`guide`, Verwaltungs-Endpunkte). Vor dem
  Ausführen der Migration gegenprüfen, ob der admin-Stream gerade `packages/db` bewegt.

</code_context>

<specifics>
## Specific Ideas

- **Die vier Erfolgskriterien in ROADMAP.md sind Testzusagen**, nicht Beschreibung: (1) Cross-
  Tenant-Test pro neuer Tabelle inkl. des nullable-`festivalId`-Sonderfalls als eigenem Test,
  (2) Kapazität DB-seitig mit nebenläufigem Beweis (letzter Platz), (3) effektive Liste =
  aktivierte globale ∪ festival-eigene mit Deaktivierung, die **nur dieses eine Festival**
  betrifft, (4) Creator-ist-Teilnehmer als durch Leave unverletzbare Invariante (D-09).
- **Zwei Einsprüche im Discuss haben Entscheidungen gedreht** — beide Endzustände sind bewusst:
  Tag-Deaktivierung wirkt nur auf die Auswahl (D-04, wegen der Auto-Titel-Regel), und das
  startTime-Ausblenden gilt nicht für Teilnehmer (D-11, weil sonst Ort und Chat exakt zum
  Start sterben).
- **User-generierter Activity-Inhalt wird nie übersetzt** (ADR-012/020) — `title`, `subtitle`,
  `description`, `location` sind Klartext ohne Translation-Tabellen; nur Tag-Titel sind
  übersetzt (D-02).
- `code_review_depth: deep` (Migration + Tenant-Scoping, per ROADMAP), `research` bleibt aus
  (erst Phase 12).
- Beim Phasenabschluss: REQUIREMENTS-Checkbox und Traceability für SEC-03 **von Hand** setzen
  (`requirements.mark-complete` funktioniert im Workstream-Layout nicht).

</specifics>

<deferred>
## Deferred Ideas

- **`category`/`guide` am Tag** — abgewählt in D-03; landet additiv beim admin-Stream, wenn
  dessen Katalog-UI sie braucht (ADR-017/018).
- **Tag-Verwaltungs-Endpunkte** (globalen Katalog pflegen, aktivieren/deaktivieren, Custom-Tags
  anlegen) — admin-Workstream (ADR-018); mobile konsumiert nur die effektive Liste.
- **Rückwirkendes Ausblenden deaktivierter Tags** (inkl. der Varianten „Aktivität verschwindet
  mit" und „Label-Schnappschuss") — explizit verworfen in D-04 wegen der Auto-Titel-Regel.
- **Cutoff mit Puffer / `endTime`-Feld** — verworfen in D-10; sollte je ein Aktivitäts-Ende
  gebraucht werden (z. B. für „läuft gerade"), ist das eine eigene Schema-Entscheidung.
- **Aktivität bearbeiten** (Felder/Kapazität ändern) — kein v1.1-Requirement; Klonen (Phase 11)
  deckt „gleiche Aktivität, andere Zeit/Ort". Falls Bearbeiten je kommt: die Kapazitäts-
  Absenkung unter die aktuelle Teilnehmerzahl ist die harte Frage.
- **ActInterest / „Freunde gehen hin"** (ADR-017 §4) — hängt am Timetable, eigener Milestone.
- **Pagination der Aktivitäten-Liste** — bewusst nicht in v1.1 (Claude-Default); wird ein
  Festival-Katalog real groß, ist das ein additiver Nachzug.
- **Blockieren/Melden (FRND-09)** — unverändert vor der ersten echten Nutzerkohorte einplanen;
  Aktivitäten sind eine neue Fläche, auf der Fremde einander begegnen.

</deferred>

---

*Phase: 10-Activities Backend*
*Context gathered: 2026-08-14*
