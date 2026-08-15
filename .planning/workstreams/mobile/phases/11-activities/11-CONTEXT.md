# Phase 11: Activities - Context

**Gathered:** 2026-08-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Der Aktivitäten-Tab (Phase-9-Platzhalter `activities.tsx`) wird real: Ein Besucher kann
Aktivitäten **erstellen** (Tag ODER Titel, Ort, Startzeit, Kapazität), die Aktivitäten seines
Festivals **entdecken**, **beitreten/verlassen**, **klonen** und bei hinterlegtem Geo-Punkt eine
**Route in einer externen Karten-App öffnen** (ACT-01…ACT-06). Reine Mobile-UI-Phase gegen den
fertigen Phase-10-Contract — mit genau einer nativen Ergänzung: der einmaligen
Standort-Erfassung via `expo-location` (D-13).

**In dieser Phase:**

- Aktivitäten-Tab mit „Aktivität starten"-Button + zwei Sektionen: „Deine Aktivitäten"
  (`listMyActivities`) und „Wer kommt mit?" (`listActivities`) (D-01)
- Create-Push-Screen nach Design `12 Aktivität erstellen`, reduziert auf die Contract-Felder
  (D-05…D-08)
- Aktivitäts-Detail als Push-Screen (KEIN Design vorhanden — Hausstil): Felder,
  Teilnehmerliste (Fremd-View), Join/Leave, creator-only „Auflösen", Klonen (D-09…D-12)
- Geo-Punkt-Erfassung („Standort anheften", einmalig) + „Route öffnen"-Handoff (D-13…D-16)
- Alle Strings in beiden Lingui-Katalogen; user-generierter Inhalt (Titel, Untertitel,
  Beschreibung, Ort) wird nie übersetzt (ADR-012/020)

**Nicht in dieser Phase:** Chat (Phase 12 — aber der Detail-Push-Screen ist die Fläche, an die
er kommt), jede Backend-/Contract-Änderung (Phase 10 ist geshippt; die vier Design-Blöcke ohne
Contract-Feld entfallen, siehe D-06 + Deferred), Aktivität bearbeiten (kein v1.1-Requirement,
Klonen deckt „gleiche Idee, andere Zeit"), Offizielle Events, jede Form von Präsenz/GPS-Watcher
(ADR-014/017 §2 — der Geo-Punkt ist einmalige Opt-in-Erfassung), Pagination.

</domain>

<decisions>
## Implementation Decisions

> Alle Entscheidungen am 2026-08-15 vom User im interaktiven Discuss gewählt. Eine davon
> (D-15) bewusst gegen die Empfehlung — als solche markiert. Die Phase-10-Semantik
> (10-CONTEXT.md D-01…D-12) gilt wörtlich weiter und wird hier nicht wiederholt.

### Tab-Aufbau & Meine Aktivitäten

- **D-01 — Zwei Sektionen, kein Segment:** „Deine Aktivitäten" oben (aus `listMyActivities` —
  nur hier bleiben gestartete Aktivitäten sichtbar, Phase-10-D-11), darunter „Wer kommt mit?"
  mit der öffentlichen Liste (`listActivities`); eigene Einträge dort per „Dabei"-Badge
  markiert wie im Design. Entspricht dem gestapelten Design-Layout, kein Umschalten nötig.
- **D-02 — „Offizielle Events" entfällt ersatzlos.** Der Design-Block (`promoRows`) hat keine
  Datenquelle und kein Requirement — Phase-9-D-07-Muster: Blöcke ohne Datenquelle fehlen
  schlicht, statt als Attrappe dazustehen. Kommt ggf. mit dem admin-Stream wieder.
- **D-03 — Listenzeile: Zahl + Plätze statt Avatar-Chips.** Die Design-`goingChips` haben in
  der Liste keine Datenquelle (Phase-10-D-12: Liste trägt nur `participantCount` + `joined`,
  Namen erst im Detail — VIS-02 verbietet einen zweiten Projektionspfad mechanisch). Die Zeile
  zeigt „N sind dabei" links und den Plätze-Hinweis rechts (nichts bei `capacity` null); Rest
  wie im Design (Titel, Meta, Tag-Chip, Dabei-Badge).
- **D-04 — Gestartete eigene Aktivitäten: „Gestartet"-Kennung + ans Sektionsende.** In „Deine
  Aktivitäten" sortieren kommende zuerst; Einträge mit `startTime` in der Vergangenheit
  bekommen eine dezente „Gestartet"-Kennzeichnung — ein Fakt, kein „Läuft"-Punkt (der würde
  Daten behaupten, die es nicht gibt: es existiert kein `endTime` — dieselbe Lehre wie beim
  Live-Tab-Punkt in Phase 9).

### Create-Formular

- **D-05 — Ein Formular mit Live-Regel für Tag-oder-Titel (ACT-01/ADR-017):** Titel-Feld
  („Was habt ihr vor?") und Single-Tag-Auswahl stehen beide im Formular. Ist ein Tag gewählt,
  wird der Titel optional (der Platzhalter zeigt das Tag-Label als künftigen Auto-Titel) und
  das optionale Untertitel-Feld erscheint. Ohne Tag ist der Titel Pflicht — Inline-Validierung
  am Submit-Button, nicht erst die Server-Antwort. (Der Server löst den Auto-Titel ohnehin
  auf; `activitySchema.title` ist immer gefüllt.)
- **D-06 — Die vier Design-Blöcke ohne Contract-Feld entfallen:** Tag-Chips werden
  Single-Select (Contract: ein `tagId`), Mindest-Teilnehmer-Stepper, „Sichtbar für"-Segment
  und Foto-Upload fehlen schlicht (D-02-Muster). Der User wollte Mindest-Teilnehmer zunächst
  („ja"), hat es nach Aufzeigen der Konsequenz (Contract + Migration in einer UI-Phase,
  admin-Kollisionszone, keinerlei Enforcement-Semantik dahinter) bewusst ins Backlog gelegt —
  siehe Deferred.
- **D-07 — Startzeit über Tages-Chips + Uhrzeit-Picker:** Chips aus dem Festival-Datumsbereich
  (wie im Design), daneben ein Uhrzeit-Picker; die Auswahl ist damit auf die Festivaltage
  begrenzt. Kein Kalender-Modal, kein freies Datum.
- **D-08 — Kapazität: Default „Ohne Limit", Stepper opt-in (Phase-10-D-08):** Ausgangszustand
  ist unbegrenzt (`capacity` null); ein Tap auf den Kapazitäts-Block aktiviert den
  Max-Stepper (Minimum 1), Deaktivieren setzt auf unbegrenzt zurück. Offene Treffen — der
  häufigste Fall — kosten null Eingaben.

### Detail-Screen: Beitreten / Voll / Auflösen / Klonen

- **D-09 — Detail ist ein Push-Screen** mit `arrow-left`-AppHeader (wie Profil/Cashless),
  nicht eine Modal-Karte: Platz für Beschreibung, Teilnehmerliste und Aktionen — und der
  Phase-12-Lobby-Chat kommt an genau diese Fläche; ein Modal müsste dafür umgebaut werden.
  — **Reversibility:** costly — Phase 12 baut auf dieser Navigationsform auf.
- **D-10 — Nicht-beitretbar sagt es VOR dem Submit (Erfolgskriterium 3):** Der
  Beitreten-Button ist echt disabled und nennt den Grund („Voll — 8/8 Plätze" / „Bereits
  gestartet") — das D-11/D-13-Muster aus Phase 6. Die 409-Antwort bleibt als Fallback für das
  Rennen um den letzten Platz (Toast + Refresh der Listen).
- **D-11 — Creator sieht „Auflösen" statt „Verlassen":** Nie ein Leave-Button für den Creator
  (der Server antwortet ihm ohnehin 409, Phase-10-D-09), sondern eine destruktiv gestylte
  „Auflösen"-Aktion mit nativem Bestätigungsdialog (Phase-6-Logout-Muster); der Dialog nennt,
  dass alle Teilnehmer mit entfernt werden.
- **D-12 — Klonen an jeder sichtbaren Aktivität, Zeit geleert (ACT-04):** „Klonen"-Aktion im
  Detail JEDER Aktivität — auch fremde sind Vorlagen (ADR-017: reine UI-Aktion, kein
  Endpunkt). Öffnet das Create-Formular mit Tag/Titel/Untertitel/Beschreibung/Ort/Kapazität
  vorbefüllt; nur die Zeit ist geleert, damit ein Doppel-Tap kein identisches Duplikat zur
  selben Zeit erzeugt. Geo-Punkt siehe D-15.

### Geo-Punkt & Route öffnen (ACT-05)

- **D-13 — Erfassung: „Standort anheften", ein Tap, einmalig:** Button im Treffpunkt-Block des
  Create-Formulars; EINE `getCurrentPosition`-Abfrage via `expo-location`, danach als
  entfernbarer Chip sichtbar (wie der Foto-Toggle im Design). Kein Karten-Picker (MapLibre
  kommt erst mit dem Karten-Milestone), kein Watcher (ADR-017 §2). ⚠️ Neue native Permission:
  Paket-Legitimitäts-Gate vor der Installation, Rationale-String, drei Berechtigungszustände
  nach dem Phase-8-Kamera-Muster (`CameraScanPanel`), nativer Rebuild
  (`npx expo run:android` aus `apps/mobile`) vor dem Gerätetest.
  — **Reversibility:** costly — ein natives Paket wieder auszubauen kostet erneut einen
  Rebuild-Zyklus (dasselbe Argument wie `react-native-webview` in 09-06).
- **D-14 — Route-Handoff über den Plattform-Standard:** `Linking.openURL` mit `geo:`-URI auf
  Android (Standard-Karten-App bzw. System-Chooser) und Apple-Maps-URL auf iOS. Kein neues
  Paket, kein Legitimitäts-Gate — das OS entscheidet, welche Karten-App dem Nutzer gehört.
- **D-15 — Klonen übernimmt den Geo-Punkt NICHT.** *Bewusst gegen die Empfehlung gewählt:*
  Nur der Freitext-Ort wird vorbefüllt, der Geo-Punkt bleibt leer und muss neu angeheftet
  werden — verhindert veraltete Punkte. Der genannte Preis (der Kloner steht beim Klonen
  meist nicht am Treffpunkt) wurde gesehen und akzeptiert.
- **D-16 — „Route öffnen" nur im Detail:** Beim Treffpunkt-Block, nur wenn ein Geo-Punkt
  existiert; ohne Geo-Punkt steht dort nur der Freitext (Erfolgskriterium 5). Kein
  Routen-Icon in der Listenzeile.

### Claude's Discretion

Der User hat keine Frage explizit delegiert. Folgendes ist bewusst nicht gefragt worden, weil
es technische Umsetzung ist und beim Planner/der UI-SPEC liegt:

- **Query-Key-Design und Invalidierung** (`activityKeys` nach dem Muster
  `festivalKeys`/`friendKeys`; Join/Leave invalidieren beide Listen + Detail; Sitzzahl muss
  sofort und nach App-Restart stimmen — Erfolgskriterium 2).
- **Leerzustände und Fehlerbilder** nach dem D-11/D-13-Hausmuster (jede leere Sektion nennt
  ihre Voraussetzung; „noch keine Aktivitäten" mit dem Weg dorthin = Create-CTA).
- **Sortierung der öffentlichen Liste** (naheliegend: `startTime` aufsteigend).
- **Verhalten nach Erstellen/Beitreten/Auflösen** (Navigation zurück/zum Detail, Toasts).
- **Berechtigungs-Verweigerung bei Standort** — Muster aus Phase 8 (drei Zustände, Hinweis
  mit Settings-Weg, graceful denial; Aktivität ist ohne Geo-Punkt voll funktionsfähig).
- **Exakte Formular-Komponenten** (Uhrzeit-Picker-Wahl, Chip-Bausteine) — eigene
  RN-Primitives auf Tokens, kein Fremd-UI-Kit (ADR-022); Details in der UI-SPEC
  (`/gsd-ui-phase 11 --ws mobile` ist angeraten, UI hint: yes).
- **Routen-/Dateizuschnitt** der neuen Screens unter `app/` (Detail + Create als
  Push-Screens außerhalb des Tab-Navigators, Registrierung in `app/_layout.tsx` mit
  `headerShown`-Regel aus 09-07: Navigator-Default, nie per Screen).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bindende Architekturentscheidungen

- `docs/DEVELOPMENT_DECISIONS.md` §ADR-017 — **die Quelle dieser Phase:** Activity-Felder,
  Auto-Titel-Regel, Klonen als reine UI-Aktion, Geo-Punkt als einmalige Opt-in-Erfassung
  (§2: ausdrücklich KEIN Presence-Tracking), ActInterest als getrenntes Konzept.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-014 — kein Präsenz-/GPS-Signal, je; Eintritt gate-less.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-012 + §ADR-020 — user-generierter Inhalt (Titel,
  Untertitel, Beschreibung, Ort) wird nie übersetzt; Tag-Labels kommen server-seitig
  lokalisiert; kein 1:1-DM.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-022 — eigene RN-Primitives auf Tokens, kein Fremd-UI-Kit.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-023 + `docs/brand/quiks-ci-v1.md` — CI v1.0, hell-first.

### Design-Vertrag

- `docs/concept/designs/quiks-v2/README.md` — Screen-Index. **Es existiert KEIN
  Aktivitäts-Detail-Screen** in den 13 Designs — das Detail (D-09) entsteht nach Hausstil.
- `docs/concept/designs/quiks-v2/quiks-screens.template.html` §`06 Aktivitäten` (Z. 1589–1639)
  — der Tab: „Aktivität starten"-Button, Kartenzeilen (Titel, Mono-Meta, Tag-Chips,
  Dabei-Badge, spotsLabel). `promoRows`/„Offizielle Events" ist tot (D-02), `goingChips`
  sind tot (D-03).
- …§`12 Aktivität erstellen` (Z. 1821–1845) — das Create-Formular. Vier Blöcke sind tot
  (D-06): Multi-Tag-Chips (→ Single-Select), Min/Max-Stepper (→ nur Max, D-08),
  „Sichtbar für", Foto.

### Phasen-Scope & Requirements

- `.planning/workstreams/mobile/ROADMAP.md` §„Phase 11: Activities" (Z. 266–292) — Ziel, die
  sechs Erfolgskriterien (Testzusagen), die Geo-Punkt-Warnung („emphatically not presence
  tracking — do not introduce a location watcher").
- `.planning/workstreams/mobile/REQUIREMENTS.md` §ACT (Z. 31–39) — ACT-01…ACT-06 im Wortlaut;
  §Out of Scope — Offline-Create ausgeschlossen (online-only), Admin-Tag-Verwaltung beim
  admin-Stream.
- `.planning/workstreams/mobile/STATE.md` §Blockers/Concerns — kein RN-Component-Test-Harness
  (Screen-Wahrheit = On-Device-UAT), `requirements.mark-complete` funktioniert im
  Workstream-Layout nicht (beim Abschluss von Hand nachziehen), Testkommando-Fallstrick,
  Akzeptanzkriterien nicht als grep-Zählung.

### Der Contract, gegen den gebaut wird (Phase 10, geshippt)

- `packages/contracts/src/router.ts` (Z. 192–290) — die acht Activity-Endpunkte:
  `listActivityTags`, `createActivity`, `joinActivity` (409 voll/gestartet/profillos),
  `leaveActivity` (evidence-free 200, Creator → 409), `deleteActivity` (creator-only, 404/409
  bewusst NICHT evidence-free), `listActivities` (öffentlich, startTime-Cutoff),
  `listMyActivities` (ohne Cutoff), `getActivity` (Detail mit Teilnehmern).
- `packages/contracts/src/schemas.ts` (Z. 40–140 + 362–401) — `activityTagSchema`,
  `activityGeoSchema`, `activitySchema` (`title` ist server-seitig aufgelöst!),
  `createActivityBodySchema` (`.refine`: tagId ODER nicht-leerer title),
  `activitySummarySchema` (`participantCount` + `joined`), `activityDetailSchema`
  (`participants` = Fremd-View + `joinedAt`).
- `.planning/workstreams/mobile/phases/10-activities-backend/10-CONTEXT.md` — die
  D-01…D-12-Semantik, die diese Phase wörtlich übernimmt (Creator zählt zur Kapazität,
  null = unbegrenzt, Creator-Leave 409, startTime-Ausblendung nur öffentlich, Liste
  Zahl / Detail Namen).

### Vorherige Phasen, deren Fläche berührt wird

- `.planning/workstreams/mobile/phases/09-festival-navigation-shell/09-CONTEXT.md` — der
  Festival-Navigator + Layout-Gate (D-10: Kinder lesen `useFestivalContext()`, nie
  re-queryen), `AppHeader`-Push-Zustand, `PlaceholderScreen` (wird in `activities.tsx`
  ersetzt), 09-07-Regel: Navigator-Chrome-Defaults in `screenOptions`.
- `.planning/workstreams/mobile/phases/08-friends/08-CONTEXT.md` — das native-Capability-
  Muster (Permission-Gate, Mount-Disziplin), `PersonRow` für die Teilnehmerliste,
  Paket-Legitimitäts-Gate als manueller Blocking-Checkpoint solange `research: false`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx`** — der Phase-9-Platzhalter,
  der ersetzt wird; `useFestivalContext()` liefert das aufgelöste Festival (inkl.
  Datumsbereich für die Tages-Chips, D-07) ohne Re-Query.
- **`apps/mobile/components/PersonRow.tsx`** — trägt bereits die Fremd-View-`profile`-Shape;
  direkt für die Teilnehmerliste im Detail (`participants` hat exakt diese sechs Keys +
  `joinedAt`).
- **`apps/mobile/lib/api-client.ts`** — alle acht Activity-Endpunkte sind nach dem
  Contract-Eintrag ohne eine Zeile Client-Code aufrufbar; `unwrapOk`-Muster aus
  `lib/festival-queries.ts`.
- **`lib/festival-queries.ts` / `lib/friend-queries.ts`** — Query-Key-Factory-Muster
  (`festivalKeys`/`friendKeys`) als Vorlage für `activityKeys`; ts-rest-Non-200 ist ein
  ERFOLGREICHES React-Query-Ergebnis, nie `status === 'error'`.
- **`AvatarTile` + `deriveInitials`** — für Teilnehmer-Avatare im Detail.
- **Phase-8-Kamera-Muster** (`CameraScanPanel`, `friends-qr`) — die Vorlage für die
  Standort-Permission (D-13): Ask genau einmal pro Mount per `useRef`-Guard, drei
  Berechtigungszustände, graceful denial.
- **Nativer Confirm** (Phase-6-Logout) — Vorlage für den „Auflösen"-Dialog (D-11).
- **`SoonToast`/`PlaceholderScreen`** — bleiben unangetastet; diese Phase entfernt einen
  Platzhalter, statt neue zu schaffen.

### Established Patterns

- Farben pro Render über `useTheme()`, Styles über `createStyles(colors)` im `useMemo`;
  hell-first, nur exakter Gerätewert `dark` ergibt Dunkel.
- `fontFamilyForRole(role, fontsReady)`; Rollen mit CI-Tracking müssen `letterSpacing`
  mitsetzen (Suite schlägt sonst fehl).
- `no-literal-string`-Lint; `t` ist Babel-Makro, textuell an jeder Aufrufstelle. Beide
  Lingui-Kataloge sind geteilter Zustand — Pläne, die Copy anfassen, serialisieren.
- Kein RN-Component-Test-Harness: reine Logik (z. B. „beitretbar?"-Ableitung,
  Geo-URI-Bau, Klon-Prefill-Mapping) gehört als pure Funktion nach `lib/` mit
  node-env-Vitest; Screen-Wahrheit ist On-Device-UAT.
- Der native Rebuild ist ein Human-Checkpoint, kein Executor-Schritt (`npx expo run:android`
  aus `apps/mobile`, nie aus dem Repo-Root; Metro vor `pnpm install` stoppen).
- Die SEC-03-Standing-Gates aus 10-05 (Contract-Walk gegen client-gesetzten Actor/Scope,
  `information_schema`-Walk) laufen automatisch gegen alles Neue — diese Phase fügt aber
  weder Routen noch Tabellen hinzu.

### Integration Points

- `apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx` — Platzhalter → echter Tab.
- `apps/mobile/app/` — zwei neue Push-Screens (Create, Detail) außerhalb des Tab-Navigators;
  Registrierung in `app/_layout.tsx` (Header-Default-Regel aus 09-07 beachten).
- `apps/mobile/package.json` + `app.json` — `expo-location` (Legitimitäts-Gate!) +
  Permission-Rationale + nativer Rebuild.
- Beide Lingui-Kataloge (`apps/mobile/locales/{de,en}/messages.po`).
- **KEINE Änderung an `packages/contracts`, `packages/db` oder `apps/api`** — der Contract
  ist vollständig; die Kollisionszone mit dem admin-Stream bleibt in dieser Phase unberührt.

</code_context>

<specifics>
## Specific Ideas

- **Das Design ist Richtung, nicht Wortlaut** (Phase-6-D-14): `06 Aktivitäten` liefert
  Kartenzeile und Grundlayout, `12 Aktivität erstellen` das Formular-Gerüst — aber vier
  Formular-Blöcke und zwei Listen-Elemente sind bewusst tot (D-02/D-03/D-06). Der
  Detail-Screen hat KEIN Design und entsteht nach Hausstil.
- **Der Server hat die Auto-Titel-Regel schon gelöst:** `activitySchema.title` ist immer der
  aufgelöste Anzeigetitel. Die UI baut die Regel nur im Create-Formular nach (D-05,
  Platzhalter-Vorschau), nie beim Anzeigen.
- **Erfolgskriterium 2 („überlebt App-Restart") heißt:** Sitzzahl/Joined-Status kommen nach
  Kaltstart aus einem frischen Fetch — kein Persistenz-Feature, aber die Invalidierung nach
  Join/Leave muss beide Listen UND das Detail treffen.
- **`expo-location` durchläuft das manuelle Paket-Legitimitäts-Gate** (Publisher, Repo,
  exakter Name, Dependency-Tree) wie `expo-camera`/`react-native-webview` — Evidenz als
  `T-11-SC`-Eintrag ins Security-Register, BEVOR der Install-Befehl läuft.
- `research` bleibt aus (erst Phase 12). `code_review_depth: deep` ist nicht nötig — keine
  Migration, keine Auth-Fläche; die eine sicherheitsrelevante Stelle ist die
  Standort-Permission (einmalig, opt-in, kein Watcher) und der `geo:`/Maps-URL-Bau
  (nur eigene, validierte Koordinaten aus dem Contract — nie User-Text in eine URL).
- **On-Device-UAT-Kandidaten** (kein RN-Harness): Live-Regel im Formular, disabled-Gründe am
  Beitreten-Button, Klon-Prefill mit leerer Zeit + leerem Geo, Standort-Permission-Flow
  (gewähren/verweigern), Route-Handoff in die echte Karten-App, Sitzzahl nach Restart.
- Beim Phasenabschluss: ACT-01…ACT-06-Checkboxen und Traceability in REQUIREMENTS.md
  **von Hand** setzen (`requirements.mark-complete` funktioniert im Workstream-Layout nicht).

</specifics>

<deferred>
## Deferred Ideas

- **Mindest-Teilnehmer (`minParticipants`)** — vom User gewünscht („Mindest Teilnehmer ja"),
  nach Aufzeigen der Konsequenz bewusst ins Backlog: braucht Contract-Feld + additive
  Migration UND eine echte Semantik („kommt zustande ab N", Absage-Logik, ggf.
  Notification) — als reines Anzeige-Feld wäre es ein leeres Versprechen. Wenn es kommt,
  dann als eigenes Feature mit dem admin-Stream abgestimmt.
- **Multi-Tags pro Aktivität** — Design zeigt „mehrere möglich", Contract hat ein `tagId`;
  „fürs Erste egal" (User). Wäre Contract- + Junction-Table-Änderung.
- **„Sichtbar für" (Aktivitäts-Sichtbarkeit)** — Design-Block ohne Contract-Feld; „fürs
  Erste egal" (User). Berührt später ggf. IDN-02/Sichtbarkeits-Policy.
- **Foto an Aktivität** — Design-Block ohne Contract-Feld; bräuchte Upload-Infrastruktur
  (erste File-Upload-Fläche des Projekts). „Fürs Erste egal" (User).
- **Offizielle Events-Sektion** — braucht eine Admin-Stream-Datenquelle; kommt ggf. mit
  ADR-018-Katalog-/Event-Pflege.
- **Karten-Picker für den Geo-Punkt** — sinnvoll erst, wenn MapLibre mit dem
  Karten-Milestone da ist (D-13 wählte den Ein-Tap-Standort).
- **Routen-Icon in der Listenzeile** — abgewählt in D-16; nachrüstbar, falls das Detail als
  Umweg nervt.
- **Blockieren/Melden (FRND-09)** — unverändert vor der ersten echten Nutzerkohorte
  einplanen; Aktivitäten sind eine neue Fläche, auf der Fremde einander begegnen (Creator-
  Name und Teilnehmerliste sind sichtbar, der Chat kommt in Phase 12 dazu).

</deferred>

---

*Phase: 11-Activities*
*Context gathered: 2026-08-15*
