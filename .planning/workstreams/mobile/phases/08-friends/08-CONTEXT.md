# Phase 8: Friends - Context

**Gathered:** 2026-08-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Der Phase-6-Platzhalter `apps/mobile/app/(tabs)/friends.tsx` wird **echt**: ein Visitor findet
Menschen auf drei Wegen, verwaltet Anfragen in beide Richtungen, sieht eine echte Freundesliste
und kann eine Freundschaft beenden. Das gesamte Backend dafür ist in **Phase 7 fertig geworden** —
diese Phase schreibt **keinen** neuen Endpunkt und **keine** Migration.

**In dieser Phase (Mobile-UI, UI hint: yes):**

- Suchfeld wird echt: Prefix-Suche über `GET /visitors?q=`, Treffer mit `relation`-abhängiger Aktion
  (FRND-02 + FRND-03 über **einen** Eingabeweg)
- Neuer QR-Screen mit Umschalter „Mein Code | Scannen": eigener Handle als scannbarer Code,
  Kamera-Scan fremder Codes → Handle-Lookup → Bestätigungskarte (FRND-04)
- Anfragen-Sektion mit beiden Richtungen: annehmen, ablehnen, zurückziehen (FRND-05)
- Echte Freundesliste („Deine Crew") aus `GET /me/friends` (FRND-06)
- Freundeszeile antippbar → Detailkarte mit „Freundschaft beenden" (FRND-08)
- Die einzige native Neuerung: **Kamera-Berechtigung** für den Barcode-Scan, inkl. Rationale-String
  und Verweigerungspfad
- Alle neuen Strings in beiden Lingui-Katalogen; `username`/`displayName` werden nie übersetzt

**Nicht in dieser Phase:**

- Jede Backend-Änderung — Contract, Schema und Migration sind mit Phase 7 abgeschlossen
- Freunde-im-Festival-Schnittmenge (FRND-07) und die Fünf-Tab-Festivalnavigation (NAV-01/02/03,
  inkl. `home` → `start`) — **Phase 9**
- Chat jeglicher Art — Phase 12, und **nur pro Aktivität** (ADR-020: nie 1:1)
- Blockieren/Melden (FRND-09) — bewusst nach v1.1, siehe REQUIREMENTS.md § Future Requirements
- Profil bearbeiten (PROF-02), per-Feld-Sichtbarkeit/Altersgrenze/Flinta-Filter (IDN-02)
- Ein Fremdprofil-**Detail**-Endpunkt oder -Screen — Phase 7 D-04 hat ihn bewusst nicht gebaut

</domain>

<decisions>
## Implementation Decisions

> Alle Entscheidungen wurden am 2026-08-12 vom User im interaktiven Discuss gewählt und sind
> **user-locked**. Pixel-, Abstands- und Icon-Details kommen aus
> `docs/concept/designs/quiks-v2/quiks-screens.template.html` (`03 Friends`, Z. 1435–1491) und
> werden von `/gsd-ui-phase 8 --ws mobile` in `08-UI-SPEC.md` transkribiert.

### Die drei Add-Wege

- **D-01 — Suche bleibt inline, der Scanner bekommt einen eigenen Screen.** Das heute inerte
  Suchfeld oben auf dem Friends-Screen wird echt; ein Bottom-Sheet oder ein vorgelagerter
  „Hinzufügen"-Screen wurde verworfen. Begründung: eine Kamera-Vorschau kann ohnehin nicht in einer
  `ScrollView` leben, also braucht der Scan so oder so einen eigenen Screen — und der Friends-Screen
  behält sein prominentestes Element, statt es hinter einen Tap zu schieben.

- **D-02 — EIN Eingabefeld für Handle und Suche.** FRND-02 (quiks-Code/Handle) und FRND-03
  (Username-Suche) laufen über dasselbe Feld: die Prefix-Suche enthält den exakten Handle per
  Konstruktion als ersten (meist einzigen) Treffer. Der exakte Handle-Lookup-Endpunkt
  (`GET /visitors/:username`) bleibt damit dem **QR-Scan** vorbehalten — er ist nicht ungenutzt,
  er hat nur genau einen Aufrufer.
  *Konsequenz für die Copy:* der Design-Placeholder „Name oder @handle" ist nach Phase-7-D-09
  **unwahr** (`displayName` wird nicht durchsucht). Er muss ehrlich neu formuliert werden — der
  Ton bleibt (Phase-6-D-14: Design-Copy ist Richtung, nicht Wortlaut).

- **D-03 — Suchtreffer ersetzen die Blöcke darunter.** Sobald etwas im Feld steht, zeigt der Screen
  nur die Trefferliste; das Feld zu leeren stellt Anfragen und Crew wieder her. Ein klarer Modus
  statt einer Liste, die sich zwischen den anderen Sektionen aufbläht und den Rest des Screens
  unerreichbar weit nach unten schiebt.

- **D-04 — Volle `relation`-Abbildung in der Trefferzeile.** Phase-7-D-07 liefert pro Treffer den
  Beziehungsstatus; die Zeile bildet ihn vollständig ab:
  `none` → „Hinzufügen" (aktiv) · `requestIncoming` → „Annehmen" (aktiv) ·
  `requestOutgoing` → „Angefragt" (inaktives Label) · `friends` → „Freunde" (inaktives Label) ·
  `self` → **kein Button**. Kein Tap, der garantiert scheitert.
  *Bewusst in Kauf genommen:* „Annehmen" existiert damit an zwei Stellen (Trefferzeile und
  Anfragen-Sektion). Beide müssen dieselbe Mutation und dieselbe Cache-Invalidierung benutzen —
  zwei Codepfade für dasselbe Annehmen wären ein Defekt, keine Variante.

### Screen-Aufbau: was bleibt, was geht

- **D-05 — Der Chats-Block verschwindet ersatzlos.** Die Phase-6-Copy („Chats unlock once you've
  added someone and can message them — coming soon") verspricht 1:1-Messaging zwischen Freunden.
  **ADR-020 schließt das dauerhaft aus**, und Phase 07-05 hat den Ausschluss mechanisch verriegelt
  (`projection-uniqueness.spec.ts` prüft 13 DM-Segmente gegen jede Contract-Route). Chat kommt in
  Phase 12 **pro Aktivität** und wird nie auf diesem Screen landen. Ein Ausblick auf ein Feature,
  das es nie geben wird, ist die schlimmste Form des unehrlichen Leerzustands.
  — **Reversibility:** reversible — reiner UI-Rückbau, kein Contract, kein Schema.

- **D-06 — „Vielleicht kennst du" verschwindet ebenfalls.** Freund-von-Freund-Vorschläge haben in
  v1.1 weder Endpunkt noch Requirement. Ein Screen mit drei echten Blöcken braucht keinen vierten,
  der nur ankündigt — gerade jetzt, wo endlich echte Daten drinstehen. Als Deferred Idea vermerkt.

- **D-07 — Anfragen: EINE Sektion, ZWEI beschriftete Untergruppen.** „An dich" (Annehmen/Ablehnen)
  und „Von dir" (Zurückziehen). `GET /me/friend-requests` liefert beide Listen in **einer** Antwort
  (Phase-7-Kommentar: „Phase 8 shows incoming and outgoing on the same screen") — ein
  SegmentedControl würde die andere Richtung verstecken, sodass eine zurückgezogene Anfrage nie
  auffällt.

- **D-08 — Feste Reihenfolge, Dringlichkeit über das Badge.** Suchfeld · quiks-Code-Karte ·
  Anfragen · Deine Crew — immer gleich. Offene **eingehende** Anfragen zeigen sich über das
  Zähler-Badge an der Überschrift „Anfragen" (das Design sieht es vor). Kein Umsortieren zur
  Laufzeit: der Screen soll vorhersagbar sein, und die eigene Code-Karte, die man jemandem
  hinhält, darf nicht mal hier und mal da liegen.

### Freundesliste & Entfreunden

- **D-09 — Tap auf die Freundeszeile öffnet eine Detailkarte, Entfreunden steht unten darin.**
  Die Karte zeigt **ausschließlich**, was die Liste ohnehin trägt (Avatar, `displayName`,
  `@username`, Pronomen/Geschlecht, „Freunde seit …") — Phase-7-D-04 hat bewusst keinen
  Fremdprofil-Detail-Endpunkt gebaut, und diese Phase fordert keinen an. Ganz unten
  „Freundschaft beenden" in Rot. Damit bekommt der `f.open`-Tap aus dem Design ein ehrliches Ziel
  und FRND-08 einen auffindbaren Einstieg — statt einer unsichtbaren Long-Press-Geste oder eines
  Swipes, für den es in dieser App kein Muster und keine Gestenbibliothek gibt.

- **D-10 — Entfreunden fragt nach, mit `Alert.alert`.** Dasselbe Muster, das Phase 6 für „Abmelden"
  eingeführt hat (abbrechbar, destruktive Aktion rot) — ein Muster für alle unumkehrbaren Aktionen,
  kein neuer Baustein. Ein „Rückgängig"-Hinweis wurde verworfen, weil es keins gibt: der Server
  löscht die Zeile, und Wiederherstellen hängt an einer neuen Anfrage, die die andere Seite
  annehmen muss.

- **D-11 — Zeilenaufbau: Avatar · `displayName` groß · `@username` gedämpft darunter.** Derselbe
  Zeilenbaustein trägt Suchtreffer, Anfragezeile und Freundeszeile — die drei Listen embedden per
  Phase-7-VIS-02 exakt dieselbe `profile`-Shape, ein Baustein ist also nicht Sparsamkeit, sondern
  die naheliegende Konsequenz.
  **Der `presence`-Punkt der Design-`FriendRow` entfällt ersatzlos** — ADR-014 schließt jedes
  Anwesenheitssignal aus. Kein grüner Punkt, kein „gerade am Gelände", kein „zuletzt online".

- **D-12 — Die Freundesliste wird clientseitig nach `displayName` sortiert.**
  *Der Einwand wurde benannt und vom User überstimmt:* der Server liefert nach `username`
  aufsteigend, und clientseitiges Umsortieren legt einen zweiten Sortierbegriff neben den ersten.
  Gewählt wurde trotzdem `displayName`, weil er in der Zeile groß dasteht und die Liste sonst
  zufällig geordnet wirkt.
  ⚠️ **Konkretes Risiko für den Planner, kein Stilhinweis:** `Intl.Collator` ist in Hermes **nicht
  garantiert vorhanden**. Die App polyfillt bisher nur `Intl.PluralRules`
  (`apps/mobile/lib/intl-polyfill.ts`, Capability-Capture in `lib/intl-capability.ts`) — ein
  ungeprüftes `localeCompare` sortiert auf betroffenen Geräten nach Code-Points, was Umlaute und
  Groß-/Kleinschreibung falsch einordnet. Die Sortierung braucht einen definierten, getesteten
  Fallback und gehört als **reine Logik nach `lib/`**, wo der node-env-Vitest-Runner sie erreicht.

### QR-Flow & Kamera

- **D-13 — EIN QR-Screen mit Umschalter „Mein Code | Scannen".** Genau das, was die Design-Copy
  beschreibt („Zeigen, scannen, fertig"): zwei Menschen halten ihre Telefone aneinander, einer
  schaltet um. Einstieg über den bestehenden „QR zeigen"-Button auf der quiks-Code-Karte; der
  Screen öffnet auf „Mein Code". Die Kamera läuft **nur** im Scan-Zustand.
  Der Inhalt des Codes ist bereits gesetzt (Phase-7-D-17): `quiks:u/<username>` als namespaced
  Klartext, **kein** Deep-Link — ein fremder QR wird sauber als „nicht von quiks" abgewiesen.

- **D-14 — Nach dem Scan kommt eine Bestätigungskarte, nicht sofort die Anfrage.** Der gescannte
  Handle wird über `GET /visitors/:username` aufgelöst und als Karte gezeigt (Avatar, Name,
  `@handle`) mit dem zu `relation` passenden Button — also demselben Aktionssatz wie D-04. Erst
  der Tap sendet. Begründung: ein Kamerabild ist leicht auf den falschen Code gerichtet, und ohne
  diesen Schritt schickt man einer fremden Person eine Anfrage, ohne sie je gesehen zu haben.

- **D-15 — Kamera-Erlaubnis wird erst beim Umschalten auf „Scannen" abgefragt.** Der System-Dialog
  erscheint im Moment mit dem klarsten Kontext; wer nie scannt, wird nie gefragt. Ein eigener
  Erklärungs-Bildschirm davor wurde verworfen (zusätzlicher Schritt vor einer Aktion, die der
  Nutzer gerade selbst ausgelöst hat) — die Begründung gehört stattdessen in den
  Permission-Rationale-String.

- **D-16 — Verweigerte Erlaubnis ist ein eigener, vollständiger Zustand.** Der Scan-Bereich sagt
  dann (a) wozu quiks die Kamera braucht, (b) bietet den Sprung in die System-Einstellungen und
  (c) nennt den Weg ohne Kamera: den Handle eintippen. Niemand steckt fest — und eine in Android
  dauerhaft abgelehnte Berechtigung lässt sich nicht erneut erfragen, ein bloßer Hinweis wäre
  also eine Sackgasse. Das ist die D-11-Regel aus Phase 6 („nenne die Voraussetzung"), angewandt
  auf eine Berechtigung.

### Claude's Discretion

Der User hat keine Frage explizit delegiert. Folgendes ist bewusst **nicht** gefragt worden, weil
es technische Umsetzung ist und beim Planer liegt:

- **Bibliothekswahl** für Barcode-Scan (`expo-camera` ist der Kandidat und **noch nicht in
  `apps/mobile/package.json`**) und für die QR-**Erzeugung** (`react-native-svg` ist bereits da,
  ein QR-Renderer darauf ist noch keiner). Beide Ergänzungen brauchen ein
  `npx expo run:android` aus `apps/mobile` vor jedem Gerätetest — mit `mmkv@4`/NitroModules gab es
  in Phase 5 genau dafür schon einen Präzedenzfall.
- Routen-Struktur und -Benennung des QR-Screens (Stack-Screen auf Wurzelebene analog `app/profil.tsx`
  vs. Gruppe unter `(tabs)`).
- Debounce-Fenster der Suche, Verhalten unter der 2-Zeichen-Grenze (Service-Invariante, **nicht**
  Contract — `q` ist unbeschränktes `z.string()`), Leerzustand „keine Treffer".
- Query-Keys und Invalidierungsstrategie nach jeder Mutation (optimistisch vs. invalidieren) —
  Erfolgskriterium 2 verlangt nur, dass die Liste **ohne manuellen Refresh** stimmt.
- Aufbau der Detailkarte aus D-09 (Modal vs. Sheet-Baustein) und wohin sie nach dem Entfreunden
  schließt.
- Genaue Icon-Auswahl (`lucide-react-native`), Abstände, Reihenfolge innerhalb der Sektionen —
  gegen das Design abzugleichen, nicht frei zu erfinden.
- Ob die Anfrage-/Trefferzeilen ebenfalls tappbar sind (D-09 fordert es nur für Freunde).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bindende Architekturentscheidungen
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-020 (Z. 471–486) — **kein 1:1-DM, niemals.** Die Quelle für
  D-05; Phase 07-05 hat den Ausschluss als Contract-Test verriegelt.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-014 (Z. 241–300) — Freundschaft ist user-global, „wer ist
  hier" = Freunde ∩ gespeichertes Festival, **niemals GPS/Präsenz**. Die Quelle für den entfallenen
  `presence`-Punkt in D-11.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-012 (Z. 183–232) — Locale-Achsen; user-generierter Inhalt
  (`username`/`displayName`) wird **nie** übersetzt.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-022 (Z. 516–544) — keine Fremd-UI-Kits; eigene
  RN-Primitives auf Tokens. Gilt für jeden neuen Baustein dieser Phase.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-023 (Z. 545–592) — CI v1.0, hell-first, Sunset nur für
  Marken-/Hero-/Identitätsflächen (Erweiterung aus Phase-6-D-07).

### Der Vertrag, gegen den diese Phase baut (Phase 7, FERTIG)
- `packages/contracts/src/router.ts` (Z. 65–147) — `searchVisitors`, `lookupVisitor`,
  `sendFriendRequest`, `acceptFriendRequest`, `declineFriendRequest`, `withdrawFriendRequest`,
  `listFriends`, `listFriendRequests`, `unfriend`. **Diese Datei ändert sich in Phase 8 nicht.**
- `packages/contracts/src/schemas.ts` (Z. 85–220) — `visitorProfileForeignSchema`,
  `relationSchema`, `visitorSummarySchema`, `friendSchema` (`profile` + `friendsSince`),
  `friendRequestItemSchema`, `friendRequestListsSchema`, `friendRequestResultSchema`,
  `mutationResultSchema`. Die Doc-Kommentare dort erklären, **warum** `relation` in der Freundes-
  und Anfrageliste fehlt — nicht als Lücke lesen.
- `.planning/workstreams/mobile/phases/07-profile-visibility-friendship-backend/07-CONTEXT.md` —
  D-04 (vier Zugriffspfade, kein Detail-Endpunkt), D-06/D-08/D-09 (Suchsemantik), D-07 (`relation`),
  D-10/D-11/D-12 (Lifecycle, kein Cooldown, keine Historie), D-16/D-17 (Handle = `@username`,
  QR-Inhalt).

### Design-Vertrag
- `docs/concept/designs/quiks-v2/README.md` — Screen-Index. **Einstiegspunkt.**
- `docs/concept/designs/quiks-v2/quiks-screens.template.html` §`03 Friends` (Z. 1435–1491) —
  Suchfeld, quiks-Code-Karte, Anfragen (mit Badge), Chats (**entfällt, D-05**), Deine Crew
  (`FriendRow` mit `status`/`presence` — **`presence` entfällt, D-11**), Vielleicht kennst du
  (**entfällt, D-06**).
- `docs/concept/designs/festival/festipal-ds.js` — abgelöste Komponentensammlung, aber weiterhin
  gültige Referenz für `FriendRow`, `Avatar`, `Badge`, `Input`, `Sheet`.
- `docs/brand/quiks-ci-v1.md` — CI v1.0, bindend.

### Phasen-Scope & Requirements
- `.planning/workstreams/mobile/ROADMAP.md` §„Phase 8: Friends" (Z. 99–126) — Ziel, die fünf
  Erfolgskriterien, die Kamera-Notiz und der explizite Hinweis, dass FRND-09 **nicht** in dieser
  Phase liegt.
- `.planning/workstreams/mobile/REQUIREMENTS.md` §Friends (Z. 21–29) — FRND-02/03/04/05/06/08 im
  Wortlaut; §Future Requirements (Z. 56–65) — FRND-09 als bewusst Zurückgestelltes.
- `.planning/workstreams/mobile/STATE.md` §Blockers/Concerns — kein RN-Component-Test-Harness
  (jede Screen-Wahrheit hängt an On-Device-UAT), `requirements.mark-complete` funktioniert im
  Workstream-Layout nicht (beim Phasenabschluss von Hand nachziehen), Testkommando-Fallstrick.

### Vorherige Phase, deren Screen ersetzt wird
- `.planning/workstreams/mobile/milestones/v1.0-phases/06-profile-friends-placeholders/06-CONTEXT.md`
  — D-11 (jeder Block nennt seine Voraussetzung), D-13 (`SoonToast` ist der EINE Coming-soon-
  Mechanismus), D-14 (Design-Copy ist Richtung, nicht Wortlaut).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`apps/mobile/lib/api-client.ts`** — der eine ts-rest-Client ist voll aus `@quiks/contracts`
  typisiert; **alle neun Friend-Endpunkte sind ohne eine Zeile Client-Code bereits aufrufbar.**
  Keine handgeschriebene Request-/Response-Shape daneben (Pitfall 6).
- **`apps/mobile/lib/festival-queries.ts`** — `festivalKeys` (Z. 9) als Query-Key-Factory-Muster und
  `unwrapOk` (Z. 39) als der bestehende Weg, eine ts-rest-Antwort auf den 200-Body zu reduzieren.
  Für die Friend-Queries dasselbe Muster wiederverwenden, nicht neu erfinden.
- **`apps/mobile/app/(tabs)/friends.tsx`** — der Screen, der ersetzt wird. Seine Kommentare tragen
  die UI-SPEC-Nummern der Phase 6 und die Begründungen der Leerzustände; die Lade-/Fehler-Zustände
  (`computeQuiksCodeState`, Z. 115–131) sind das etablierte Muster für „ts-rest non-200 ist ein
  ERFOLGREICHES React-Query-Ergebnis" und dürfen nicht wegfallen.
- **`AvatarTile` + `deriveInitials`** (Phase 4) — Foto/Initialen inkl. Unicode-Kantenfällen; trägt
  jede Zeile und die Detailkarte aus D-09. `AvatarSunsetRing` (Phase 6) für Identitätsflächen.
- **`ListRow.tsx`, `SegmentedControl.tsx`, `SoonToast.tsx`** — Zeile mit Chevron/Badge, der
  Umschalter aus Phase 5 (Kandidat für „Mein Code | Scannen" in D-13), und der EINE
  Coming-soon-Mechanismus (nach dieser Phase auf dem Friends-Screen nur noch dort nötig, wo wirklich
  nichts kommt — D-05/D-06 entfernen zwei seiner Aufrufer).
- **`handleLogout` in `app/(tabs)/mehr.tsx`** — der bestehende `Alert.alert`-Bestätigungsdialog für
  eine destruktive Aktion; D-10 kopiert dieses Muster, schreibt es nicht neu.
- **`['me']`-Query** — Profil- und Friends-Screen teilen sich Key und Cache-Eintrag. Der eigene
  Handle für die QR-Anzeige kommt von dort. **Erweitern, nicht duplizieren.**

### Established Patterns

- Farben lösen **pro Render** über `useTheme()` auf, Styles über `createStyles(colors)` in einem
  `useMemo` — kein Farbtoken auf Modulebene (05.1 D-01). Hell ist der Default-Fall.
- Schriftrollen über `fontFamilyForRole(role, fontsReady)`; ein numerisches `fontWeight` auf einer
  echten Gewichtsdatei erzeugt Faux-Bold (05.1 D-10). Eine Rolle mit CI-Tracking muss ihr
  `letterSpacing` mitsetzen, sonst schlägt die Suite fehl.
- `no-literal-string`-Lint gilt auch für `components/`; `accessibilityLabel` ist ausgenommen und
  muss explizit durch Lingui geführt werden (Pitfall 4 aus Phase 4).
- Der `apps/mobile`-Vitest-Runner ist **node-env und deckt nur `lib/` ab** — reine Logik (die
  D-12-Sortierung, die QR-Payload-Erkennung `quiks:u/<handle>`, jede Ableitung) gehört dorthin.
  Screen-Wahrheit hängt an On-Device-UAT; das ist die strukturelle Verifikationsgrenze, keine
  Nachlässigkeit.
- Die Lingui-Kataloge (`apps/mobile/locales/{de,en}/messages.po`) sind geteilter Zustand — Pläne,
  die Copy anfassen, müssen serialisiert werden (Muster aus Phase 4/5/6).

### Integration Points

- `apps/mobile/app/(tabs)/friends.tsx` — wird weitgehend neu geschrieben; vier Blöcke statt sechs.
- **Neu:** ein QR-Screen (Route noch zu benennen) + ein geteilter Zeilenbaustein für die drei
  Listen + die Detailkarte aus D-09.
- `apps/mobile/app.json` / `app.config` + `package.json` — Kamera-Plugin, Permission-Rationale und
  ein **nativer Rebuild** (`npx expo run:android` **aus `apps/mobile`**, nie aus dem Repo-Root).
- `apps/mobile/lib/` — neue reine Logik (Sortierung, QR-Payload-Parsing) mit Tests daneben.
- **Keine Kollisionszone mit `admin`:** diese Phase fasst `packages/contracts`, `packages/db` und
  `packages/ui` **nicht** an. Das ist der bequemste Moment, in dem der Admin-Stream diese Pakete
  frei bewegen kann.

</code_context>

<specifics>
## Specific Ideas

- **Diese Phase schreibt kein Backend.** Wenn beim Planen der Wunsch nach einem Endpunkt aufkommt
  (Fremdprofil-Detail, Vorschläge, Blockieren), ist das ein Signal, dass eine Entscheidung oben
  übersehen wurde — D-04/D-05/D-06 haben genau diese drei bereits abgewählt.
- Die Erfolgskriterien in ROADMAP.md sind als **Zusagen** formuliert. Insbesondere Kriterium 2
  („ohne manuellen Refresh") und Kriterium 4 („jeder Leerzustand nennt seine Voraussetzung, auch
  nach Kontakt mit echten Daten") sind bei der UAT am Gerät zu prüfen, nicht im node-env-Runner.
- Der Screen hört auf, ein Platzhalter zu sein — die Phase-6-Haltung „sichtbar tot statt
  weggelassen" gilt hier **nicht mehr**. D-05 und D-06 sind die bewusste Umkehrung: was kein
  Backing hat und keins bekommt, wird entfernt statt gedämpft gerendert.
- `research` bleibt **aus** (erst Phase 12 braucht es). `code_review_depth` muss nicht `deep` sein:
  keine Auth-Fläche, keine Migration, kein Tenant-Scoping — die Kamera-Berechtigung ist die einzige
  neue Angriffsfläche und die ist lokal.
- Die Kamera ist die einzige native Ergänzung der Phase. Der Rebuild-Zwang ist aus Phase 5 bekannt
  (mmkv/NitroModules fehlten im APK) — **vor** dem ersten Gerätetest einplanen, nicht danach
  entdecken.

</specifics>

<deferred>
## Deferred Ideas

- **Chats-Block auf dem Friends-Screen** — entfällt **dauerhaft** (D-05/ADR-020). Chat existiert ab
  Phase 12 ausschließlich pro Aktivität. Nicht als „später wieder einbauen" lesen.
- **„Vielleicht kennst du" / Freund-von-Freund-Vorschläge** — abgewählt in D-06; braucht einen
  eigenen Endpunkt und ein eigenes Requirement, beides gibt es in v1.1 nicht.
- **Präsenz / „gerade am Gelände" in der Freundeszeile** — durch ADR-014 ausgeschlossen; die spätere
  Opt-in-Stufe ist FRND-03b und braucht eigene Standort-, Sichtbarkeits- und Aufbewahrungsregeln.
- **Blockieren/Melden (FRND-09)** — bewusst nach v1.1. v1.1 ist die erste Version, in der Fremde
  dich anfragen und per Username finden können, ohne dass du das unterbinden kannst. **Vor der
  ersten echten Nutzerkohorte einplanen.**
- **Freunde-im-Festival-Schnittmenge (FRND-07)** und der `home` → `start`-Rename (NAV-03) —
  **Phase 9**, ausdrücklich nicht hier: NAV-03 fasst den Deep-Link-Capture-Pfad an, der in Phase 5
  den Unmatched-Route-Bug produziert hat. Der QR-Code trägt deshalb Klartext statt eines
  Deep-Links (Phase-7-D-17), damit diese Phase den Pfad gar nicht berührt.
- **„Handle teilen" (System-Share-Sheet) auf der quiks-Code-Karte** — im Design als Idee angelegt,
  in dieser Phase nicht gefordert; billiger Nachzug, sobald jemand ihn will.
- **Anfragen-Badge in der `FloatingNav`** — angesprochen, nicht entschieden; braucht eine
  Hintergrundabfrage oder Push (NOTF-01) und gehört daher nicht in diese Phase.
- **Profil bearbeiten (PROF-02)** — inkl. der Frage, was eine Username-Umbenennung mit alten
  QR-Codes macht (in Phase-7-D-16 festgehalten, damit es dort nicht neu entdeckt wird).

</deferred>

---

*Phase: 8-Friends*
*Context gathered: 2026-08-12*
