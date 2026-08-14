# Phase 9: Festival Navigation Shell - Context

**Gathered:** 2026-08-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Der Festival-Bereich bekommt eine echte **Fünf-Tab-Navigation** (Dashboard · Aktivitäten · Friends ·
Timetable · Lageplan, ADR-014), der **globale App-Header aus dem Design entsteht app-weit** und trägt
den Ausstieg aus dem Festival, der Festival-Friends-Tab zeigt die **Schnittmenge** „meine Freunde ∩
hat dieses Festival gespeichert" (FRND-07), und der globale erste Tab heißt überall **`start`**
(NAV-03).

**In dieser Phase:**

- Festival-Kontext wird ein eigener Tab-Navigator mit fünf registrierten Routen; er **ersetzt** die
  globale Leiste, statt neben ihr zu existieren (D-01)
- **Neu: `AppHeader`** — ein Baustein mit drei Zuständen (global / im Festival / Push-Screen),
  ersetzt app-weit den React-Navigation-Header auf allen Tab- und Push-Screens (D-03)
- Dashboard-Tab: Key-Facts + Cashless-Einstieg + Crew-Zähler (D-07/D-08/D-11)
- **Neu: Cashless-Push-Screen** als reine WebView nach ADR-011, inkl. `react-native-webview`
  und nativem Rebuild (D-09)
- Festival-Fehlfall (404 / nicht erreichbar) rückt auf die Layout-Ebene vor die Tabs (D-10)
- Aktivitäten / Timetable / Lageplan: ehrliche Platzhalter über einen **neuen ganzflächigen
  Leerzustand-Baustein** (D-12/D-13/D-14)
- Festival-Friends-Tab auf einem **neuen Endpunkt** `GET /festivals/:festivalId/friends` (D-15…D-18)
- `home` → `start` in Route, msgid und UI, ohne Alias, als erster Plan (D-19/D-20/D-21)

**Nicht in dieser Phase:**

- **Jeder Inhalt** von Timetable, Lageplan, Aktivitäten — Aktivitäten kommt in Phase 11, die
  anderen beiden in einem eigenen Milestone
- Live-Act-Chip im Header, „Auf den Bühnen", „Auf deiner Merkliste", „Offizielle Events", News,
  `SocialRow` — sämtlich Design-Blöcke ohne Datenquelle (siehe Deferred)
- Jede Form von Präsenz, Standort, Distanz oder „gerade am Gelände" — ADR-014, dauerhaft
- Chats im Festival-Friends-Tab — ADR-020, dauerhaft (Chat ab Phase 12 nur pro Aktivität)
- Blockieren/Melden (FRND-09), Profil bearbeiten (PROF-02), per-Feld-Sichtbarkeit (IDN-02)
- Tab-adressierende Deep Links (`quiks://f/slug/timetable`) — bewusst abgewählt (D-05)

</domain>

<decisions>
## Implementation Decisions

> Alle Entscheidungen wurden am 2026-08-13 vom User im interaktiven Discuss gewählt und sind
> **user-locked**. Pixel-, Abstands- und Icon-Details kommen aus dem Design (siehe
> `<canonical_refs>`) und werden von `/gsd-ui-phase 9 --ws mobile` in `09-UI-SPEC.md` transkribiert.

### Navigationsmodell

- **D-01 — Die Festival-Leiste ersetzt die globale.** Im Festival ist nur die Fünf-Tab-Leiste
  sichtbar; es ist dieselbe `FloatingNav`-Komponente mit anderen Items, kein zweiter Baustein und
  keine zwei gestapelten Leisten. Der Festival-Kontext ist ein **eigener Navigator**, kein Kind der
  globalen `(tabs)`. Entspricht dem Design (ein `showNav`, tauschbare `navItems`/`navValue`) und
  ADR-014s Mandantenbegriff („ein Festival *betreten*").

- **D-02 — Der Ausstieg aus dem Festival ist der linke Home-Button im App-Header.**
  *Diese Entscheidung korrigiert eine im Gespräch zunächst gewählte Variante* (Zurück-Pfeil im
  Screen-Header jedes Tabs), nachdem der User auf den fehlenden globalen App-Header hingewiesen hat.
  Das Design hat dafür **ein** Steuerelement mit zwei Icons:
  `tbIcon: tb.b ? 'arrow-left' : 'home'` und
  `topHome: () => pushed ? closePush() : ctx==='festival' ? {ctx:'global', tab:'home'} : {tab:'home'}`.
  Die bestehende `leaveFestival(router)`-Logik (canGoBack → back, sonst `replace`) bleibt der
  Mechanismus dahinter — sie wandert nur vom Screen-Header in den `AppHeader`.

- **D-03 — Der `AppHeader` entsteht app-weit, jetzt.** Ein Baustein mit drei Zuständen ersetzt
  überall den React-Navigation-Header: global (Wordmark „quiks." + Home-Button), im Festival
  (Festivalname + Home-Button), auf Push-Screens (Push-Titel + `arrow-left`). Betrifft die vier
  globalen Tabs, die fünf Festival-Tabs und die drei Push-Screens (`profil`, `friend-detail`,
  `friends-qr`). Begründung: ein zweiter Header-Stil daneben würde sonst monatelang stehenbleiben.
  — **Reversibility:** costly — der Rückbau berührt jeden Screen der App; der Header ist nach dieser
  Phase die einzige Stelle, an der Titel, Ausstieg und Profil-Einstieg leben.

- **D-04 — Der Avatar rechts im Header öffnet `app/profil.tsx`.** 32 px `AvatarTile` mit Foto, aus
  der bereits geteilten `['me']`-Query. Der bestehende Weg Mehr → Konto → Profil **bleibt daneben
  bestehen** — zwei Einstiege zum selben Push-Screen, kein zweiter Codepfad.

- **D-05 — Jeder Eintritt ins Festival landet auf dem Dashboard.** Tap auf eine Festivalkarte, Deep
  Link und Cold Start (persistierter Slug → `/f/:slug`, `lib/cold-start-redirect.ts`) verhalten sich
  gleich. Kein pro-Festival persistierter Tab-Zustand und **keine tab-adressierenden Deep Links** —
  letztere hätten die Deep-Link-Fläche für Ziele erweitert, die diese Phase als Platzhalter
  ausliefert.

- **D-06 — Der Home-Button ist auf dem Start-Tab sichtbar und wirkungslos.** Wie im Design
  (`topHome` setzt dort nur `tab:'home'`). Ein Steuerelement, das seine Position wechselt oder
  verschwindet, ist schwerer zu lernen als eins, das gelegentlich nichts tut. Das ist **kein**
  D-11/`SoonToast`-Fall — es fehlt nichts, das Ziel ist bereits erreicht.

### Dashboard-Tab

- **D-07 — Das Dashboard trägt Identität + Cashless + Crew-Zähler, sonst nichts.** Alles Gezeigte hat
  echte Daten. Die Design-Blöcke „Auf den Bühnen", „Auf deiner Merkliste", „Offizielle Events",
  „News" und `SocialRow` **fehlen schlicht**, statt als Attrappe dazustehen — genau das, was NAV-02
  für die anderen Tabs verlangt, hier auf Tab 1 angewandt.

- **D-08 — Der Festivalname steht im Header, nicht mehr im Dashboard.** Der heutige `display2`-Name
  in `f/[festivalSlug].tsx` entfällt; das Dashboard beginnt mit den beiden Key-Fact-Zeilen
  (`CalendarClock`/`MapPin` in `colors.primary`, unverändert aus 05-03). Der Name steht ab jetzt
  genau einmal — im Header, wo er auf allen fünf Tabs sagt, in welchem Festival man ist.

- **D-09 — Cashless wird voll gebaut: WebView-Push-Screen nach ADR-011.** `react-native-webview`
  kommt dazu, der Screen lädt `festival.cashlessUrl` — nur HTTPS, auf die konfigurierte Domain
  beschränkt, sandboxed. Kein natives Guthaben-Element, keine Buchungsliste, kein Bezahl-QR
  (ADR-011 Konkretisierung 2026-07-28). **Ist `cashlessUrl` null, entfällt der Einstieg hart** —
  ADR-011 blendet den Bereich aus, ein inerter Cashless-Platzhalter ist nicht zulässig.
  ⚠️ Nativer Rebuild (`npx expo run:android` **aus `apps/mobile`**) vor jedem Gerätetest, und das
  Paket-Legitimitäts-Gate wie bei `expo-camera` in 08-04/08-05.
  — **Reversibility:** costly — ein natives Paket wieder auszubauen kostet erneut einen Rebuild-Zyklus.

- **D-10 — „Festival nicht gefunden / nicht erreichbar" lebt auf Layout-Ebene, vor den Tabs.** Der
  Festival-Navigator fragt `getFestival(slug)` **einmal** ab; 404 oder Transportfehler ersetzen den
  ganzen Bereich — keine Tableiste, kein Dashboard, nur die Meldung plus den Header-Home-Button
  hinaus. Der `clearActiveFestivalSlug()`-Effekt (nur wenn genau der persistierte Slug 404't) zieht
  mit um. Sonst könnte man durch fünf Tabs eines Festivals blättern, das es nicht gibt.

- **D-11 — Die Crew-Kachel bleibt stehen und zeigt 0.** Anders als der Cashless-Einstieg verschwindet
  sie nie. Bei 0 nennt sie die Voraussetzung im D-11-Muster aus Phase 6 („noch niemand aus deiner
  Crew hat dieses Festival gespeichert"), statt nur eine Null zu zeigen. Ein Zähler auf 0 ist eine
  Aussage, kein Leerzustand — und ohne sie schrumpft ein frisch angelegtes Festival ohne
  `cashlessUrl` auf zwei Fakten-Zeilen zusammen und wirkt kaputt.

### Platzhalter-Tabs (Aktivitäten · Timetable · Lageplan)

- **D-12 — Ein neuer, ganzflächiger Leerzustand-Baustein, geteilt von allen drei Tabs.** Icon,
  Überschrift, Voraussetzungssatz; Text pro Tab. **`SoonToast` bleibt unangetastet** der Mechanismus
  für *getappte tote Steuerelemente* — ein Screen ohne Inhalt ist ein Leerzustand, kein Toast.
  Damit ist ROADMAP-SC-2 („der einzelne geteilte `SoonToast` bleibt der einzige
  Coming-soon-Mechanismus") so ausgelegt: **kein zweiter Toast/Sheet**, aber ein Leerzustand ist
  keine Coming-soon-*Mechanik*. `ComingSoonTile` wurde verworfen — sie ist auf Rasterbreite
  (`flexBasis` 48 %/31 %) und ein reines Label ausgelegt und trägt keinen Voraussetzungssatz.

- **D-13 — Die Copy folgt der echten Voraussetzung, und die ist nicht dieselbe.** Timetable und
  Lageplan warten auf **das Festival**, das seine Daten über das Admin-UI pflegen muss; Aktivitäten
  wartet auf **quiks**. Also nennen die ersten beiden die Voraussetzung beim Festival, der dritte
  die bei uns. **Kein Datumsversprechen** — insbesondere nennt der Aktivitäten-Tab Phase 11 nicht.
  Das ist D-11 aus Phase 6 wörtlich genommen und zugleich die Wahrheit: Timetable und Lageplan
  bleiben auch nach ihrem Bau leer, wenn das Festival nichts pflegt.

- **D-14 — Die Leiste verrät nichts.** Alle fünf Tabs folgen demselben aktiv/inaktiv-Muster wie die
  globale `FloatingNav` (`colors.primary` vs. `colors.textMuted`, Strichstärke 2.4/2.0). Keine
  Dämpfung, kein „Soon"-Badge. ROADMAP-SC-1 verlangt fünf echte Routen, keine dekorativen — und
  Phase 11 muss nichts zurückbauen.

### Festival-Friends-Tab (FRND-07)

- **D-15 — Der Tab zeigt die Schnittmenge als Liste, Zeilen tappbar.** `PersonRow` pro Freund, der
  dieses Festival gespeichert hat, sortiert über das bestehende `sortFriendsByDisplayName`
  (Phase-8-D-12, inkl. Hermes-Fallback); Tap öffnet die Phase-8-Detailkarte `friend-detail`.
  **Kein Ort, kein Status, keine Distanz, kein Präsenzpunkt** — ADR-014.

- **D-16 — Unter der Liste ein Einstieg in den globalen Friends-Screen, der sich über das Festival legt.**
  Er wird als **Push-Screen** über den Festival-Kontext gelegt, sein Header trägt den
  `arrow-left`-Zustand, und Zurück landet wieder im Festival-Friends-Tab. Begründung: wer jemanden
  hinzufügt, während er auf dem Gelände steht, will danach zurück ins Festival.
  ⚠️ **Konkrete Folge für den Planner, kein Stilhinweis:** der Friends-Screen muss dann an **zwei**
  Navigationspositionen funktionieren (globaler Tab und Push über dem Festival). Sein Zustand, seine
  Query-Keys und sein Zurück-Verhalten dürfen nicht von der Tab-Position abhängen.

- **D-17 — Alle drei leeren Zustände sind eigenständig.** „Du hast noch keine Freunde" (mit dem Weg
  dorthin), „Deine Freunde haben dieses Festival noch nicht gespeichert" und der Ladefehler bekommen
  je eigenen Text. Die ersten beiden fühlen sich für den Nutzer völlig unterschiedlich an, und D-11
  verlangt, die Voraussetzung zu nennen — die hier tatsächlich eine andere ist.

- **D-18 — EIN Endpunkt liefert die Liste, der Zähler zählt sie aus.**
  `GET /festivals/:festivalId/friends` gibt die **Fremd-View**-Profile der eigenen Freunde zurück,
  die dieses Festival gespeichert haben; die Dashboard-Kachel aus D-11 liest die Länge aus demselben
  Query-Cache. Eine Wahrheit, eine Invalidierung — ein separater Zähl-Endpunkt könnte eine andere
  Zahl nennen als die Liste darunter (dasselbe Argument wie Phase-7-VIS-02).
  — **Reversibility:** one-way — ein veröffentlichter Endpunkt in `packages/contracts`; ihn später zu
  ändern ist ein Breaking Change am Contract plus Client-Release, wie bei `gender` in Phase 07-01.

### `home` → `start` (NAV-03)

- **D-19 — Harte Umbenennung, keine Alias-Route.** Es gibt nichts, was noch auf `/home` zeigen
  könnte: `lib/pending-destination.ts` ist ein **In-Memory-Singleton** (ausdrücklich nicht MMKV),
  persistiert wird nur der Festival-**Slug**, und die App erzeugt selbst nie einen
  `quiks://home`-Link. Eine Alias-Route wäre ein **zweiter Besitzer für denselben Screen** — genau
  die Konstellation, aus der in Phase 5 der Unmatched-Route-Bug entstand.

- **D-20 — Die msgid wird `Start`, auch auf Englisch.** Wörtliche Erfüllung von NAV-03 (Route, msgid
  **und** UI). Englische Nutzer sehen „Start" statt „Home" — der Tab heißt im Design in beiden
  Sprachen so, und ein Katalogeintrag `msgid "Start"` → `msgstr "Home"` würde beim nächsten Lesen
  wie ein Fehler aussehen. Die DE-Übersetzung lautet unverändert „Start".

- **D-21 — Der Rename läuft vor den neuen Routen.** Bereits in STATE.md festgehalten (User,
  2026-08-12): „Vor neuen Routen erledigen — der Deep-Link-Capture-Pfad hängt mit dran." Als erster
  Plan der Phase, damit der Fünf-Tab-Navigator gegen die bereits umbenannte Fläche gebaut wird.

### Claude's Discretion

Der User hat keine Frage explizit delegiert. Folgendes ist bewusst **nicht** gefragt worden, weil es
technische Umsetzung ist und beim Planer liegt:

- **Verschachtelungsform** des Festival-Navigators in Expo Router (eigene Gruppe mit `[festivalSlug]`
  als Segment-Parameter vs. Stack-Screen mit eigenem Tabs-Layout darunter) und wie `FloatingNav`
  seine Items pro Kontext bekommt (zweite `Tabs`-Instanz vs. Props).
- **Ob `festivalId` oder `slug`** im FRND-07-Pfad steht — die App navigiert per Slug, `saveFestival`
  nimmt `:festivalId`. Konsistenz mit dem bestehenden Router entscheidet.
- Layout der Dashboard-Kacheln (Design zeigt drei `StatTile` nebeneinander, es gibt nur zwei bzw. bei
  fehlender `cashlessUrl` eine) — gegen das Design abzugleichen, gehört in die UI-SPEC.
- Ob `ColdStartRedirect`s Diskriminante `kind: 'home'` zu `'start'` mit umbenannt wird.
- Query-Keys, Invalidierungsstrategie und Caching des neuen Endpunkts; Pull-to-refresh.
- Genaue Glyph-Auswahl für die fünf Festival-Tabs (`lucide-react-native`), Abstände, Header-Höhe und
  wie die Glasfläche des Headers technisch entsteht (`expo-blur` ist über `FloatingNav` bereits da).
- Ob `friend-detail` beim Aufruf aus dem Festival-Tab denselben Cache-Lesepfad nutzen kann
  (Phase-8-Notiz: es liest `friendKeys.list` aus dem Query-Cache statt neu zu holen — steht der
  Eintrag nicht drin, findet es nichts).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bindende Architekturentscheidungen

- `docs/DEVELOPMENT_DECISIONS.md` §ADR-014 (Z. 241–300) — **die Quelle dieser Phase.** Mandantengrenze
  Global ↔ Festival, die **Fünf-Tab-Festival-Leiste namentlich** (Konkretisierung 2026-07-29:
  „Dashboard · Aktivitäten · Friends · Timetable · Lageplan", **Cashless ist kein Tab**, News leben im
  Dashboard), „wer ist hier" = Freunde ∩ gespeichertes Festival **ohne GPS/Präsenz**, „Crew" ist nur
  der interne Begriff — **als UI-Label entfällt es, der Tab heißt Friends**.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-011 (Z. 156–180) — Cashless: **strikt eingebettete URL**,
  `react-native-webview`, nur HTTPS, domain-beschränkt, sandboxed; **fehlt die URL, wird der Bereich
  ausgeblendet**; kein natives Guthaben, keine Buchungsliste, kein Bezahl-QR.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-020 — **kein 1:1-DM, niemals.** Der Chats-Block des
  Design-Screens `06b Crew` ist dauerhaft tot; Phase 07-05 hat den Ausschluss als Contract-Test
  verriegelt.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-012 — Locale-Achsen; user-generierter Inhalt
  (`username`/`displayName`, Festivalname) wird **nie** übersetzt.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-022 — keine Fremd-UI-Kits; eigene RN-Primitives auf Tokens.
  Gilt für `AppHeader` und den neuen Leerzustand-Baustein.
- `docs/DEVELOPMENT_DECISIONS.md` §ADR-023 + `docs/brand/quiks-ci-v1.md` — CI v1.0, hell-first,
  Sunset nur für Marken-/Hero-/Identitätsflächen.

### Design-Vertrag

- `docs/concept/designs/quiks-v2/README.md` — Screen-Index. **Einstiegspunkt.**
- `docs/concept/designs/quiks-v2/quiks-screens.template.html` **Z. 1355–1370** — das **App-Header-
  Markup** (Glasleiste, 36 px runder Button links, Wordmark/Titel, Spacer, Live-Chip, Avatar 32 px;
  Inhalt beginnt bei `top:94px`). Diese Zeilen sind die Vorlage für D-03.
- `docs/quiks_screen_designs.html` — **Original-Bundle**, 763 KB in einer Zeile, im Browser öffnen.
  Es ist die **einzige** Quelle der Header-Bindungen, die in der Extraktion fehlen:
  `tbIcon: tb.b ? 'arrow-left' : 'home'` ·
  `topHome: () => pushed ? closePush() : ctx==='festival' ? {ctx:'global',tab:'home'} : {tab:'home'}` ·
  `showWordmark: !pushed && ctx==='global'` · `showTitleText: pushed || ctx==='festival'` ·
  `tb = pushed ? {t:pushedTitle,b:'arrow-left'} : ctx==='festival' ? {t:festivalName} : {t:'quiks'}`.
- `docs/concept/designs/quiks-v2/quiks-screens.template.html` §`05 Live` (Z. 1530–1587) — der
  Dashboard-Screen. **Fast vollständig ohne Datenquelle** in dieser Phase (siehe D-07).
- …§`06b Crew` (Z. 1641–1668) — der Festival-Friends-Screen. **Chats-Block (ADR-020), FriendRow mit
  `presence`/`distance`, „Gerade am Gelände" und die Fußzeile „Standort ist geteilt" sind sämtlich
  tot** — übrig bleibt genau eine Liste.
- …§`07 Timetable` (Z. 1670–1702) und §`08 Karte` (Z. 1704–1735) — North-Star für spätere Phasen;
  in dieser Phase liefern beide Tabs nur den Leerzustand aus D-12/D-13. Der SafeNow-Hinweis auf
  `08 Karte` ist per ADR-014 („SafeNow ist nicht im MVP") nicht zu bauen.
- `docs/concept/designs/festival/festipal-ds.js` — abgelöste Komponentensammlung, weiterhin gültige
  Referenz für `FriendRow`, `Avatar`, `StatTile`, `Badge`.

### Phasen-Scope & Requirements

- `.planning/workstreams/mobile/ROADMAP.md` §„Phase 9: Festival Navigation Shell" (Z. 151–178) —
  Ziel, die vier Erfolgskriterien und die Warnung, dass NAV-03 den Deep-Link-Capture-Pfad berührt
  („Verify on device with `expo start -c`, not in the node-env runner").
- `.planning/workstreams/mobile/REQUIREMENTS.md` §Festival Navigation (Z. 46–51) — NAV-01/02/03 im
  Wortlaut; §Friends Z. 28 — FRND-07; §Out of Scope Z. 71–79 — Timetable-/Lageplan-**Inhalt**,
  Präsenz via GPS, Cashless-Einordnung.
- `.planning/workstreams/mobile/STATE.md` §Accumulated Context / Blockers — Rename „vor neuen Routen",
  kein RN-Component-Test-Harness (jede Screen-Wahrheit hängt an On-Device-UAT), SEC-02 als vererbte
  Pflicht, `requirements.mark-complete` funktioniert im Workstream-Layout nicht (beim Phasenabschluss
  von Hand nachziehen), Testkommando-Fallstrick
  (`cd apps/api && pnpm exec vitest run test/<spec>.spec.ts`).

### Vorherige Phasen, deren Fläche berührt wird

- `.planning/workstreams/mobile/phases/08-friends/08-CONTEXT.md` — D-11 (Zeilenbaustein `PersonRow`,
  **`presence` entfällt**), D-12 (Sortierung + Hermes-`Intl.Collator`-Falle), D-09 (`friend-detail`),
  D-05 (Chats-Block dauerhaft entfernt).
- `.planning/workstreams/mobile/phases/07-profile-visibility-friendship-backend/07-CONTEXT.md` —
  D-04 (vier Zugriffspfade, kein Fremdprofil-Detail-Endpunkt), die **Fremd-View-Projektion**, gegen
  die der neue FRND-07-Endpunkt bauen muss (`foreignProfileColumns` liest, `pickForeignProfile`
  formt — **beide wiederverwenden, nicht neu aufzählen**).
- `.planning/workstreams/mobile/milestones/v1.0-phases/06-profile-friends-placeholders/06-CONTEXT.md`
  — D-11 (jeder Block nennt seine Voraussetzung), D-13 (`SoonToast` ist der EINE
  Coming-soon-Mechanismus — Auslegung für Screens siehe D-12 oben), D-14 (Design-Copy ist Richtung,
  nicht Wortlaut).

### Debug-Historie, die diese Phase direkt betrifft

- `.planning/debug/resolved/` §`first-login-unmatched-route` — der Phase-5-Bug. Root Cause war die
  Expo-**Dev-Client-Launch-URL**, gefiltert in `isIgnorableDeepLinkRoute()`; der Single-`/`-Owner
  `app/index.tsx` **bleibt**. Lehre, die für D-19 und D-21 gilt: RN-Routing am **Gerät** verifizieren
  (`expo start -c` + Device-Log), der node-env-Vitest-Runner trügt hier.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **`apps/mobile/components/FloatingNav.tsx`** — trägt bereits Glasfläche (`expo-blur`,
  `BLUR_INTENSITY 60`, `tint` folgt dem Modus), Pill, aktiv/inaktiv-Farben, einzeilige
  tail-truncated Labels und `flex: 1`-Gleichverteilung. Für D-01 wird sie **parametrisiert**, nicht
  kopiert. `LiveRouteName`/`isLiveRouteName`/`LIVE_TAB_ICON`/`liveTabLabel` sind die vier Stellen,
  die der Rename (D-19) und die Festival-Items anfassen.
- **`apps/mobile/lib/festival-navigation.ts`** — `leaveFestival(router)` ist die fertige
  Nicht-Sackgassen-Logik für D-02; sie wandert in den `AppHeader` und ihr `/home`-Literal in D-19.
- **`apps/mobile/app/(festival)/f/[festivalSlug].tsx`** — der Screen, der sich in den
  Navigator + Dashboard-Tab aufteilt. `findCachedFestivalBySlug` (Instant-Paint aus dem
  `['festivals']`-Cache, prüft `status === 200` **und** `Array.isArray(body)`), der
  404-`clearActiveFestivalSlug`-Effekt und die vier Zustände sind die Vorlage für D-10.
- **`apps/mobile/components/AvatarTile.tsx` + `deriveInitials`** — Foto/Initialen inkl.
  Unicode-Kantenfällen, für D-04 und die Zeilen im Friends-Tab.
- **`apps/mobile/components/PersonRow.tsx`** (Phase 8) — der Zeilenbaustein für D-15, trägt bereits
  die Fremd-View-`profile`-Shape.
- **`apps/mobile/lib/friend-sort.ts`** — `sortFriendsByDisplayName` mit geprüftem
  Hermes-`Intl.Collator`-Fallback; für D-15 unverändert wiederverwenden.
- **`apps/mobile/lib/festival-queries.ts`** — `festivalKeys` als Query-Key-Factory und `unwrapOk` als
  der Weg, eine ts-rest-Antwort auf den 200-Body zu reduzieren. Für den FRND-07-Query dasselbe
  Muster; `friendKeys` in `lib/friend-queries.ts` ist das Friends-Pendant.
- **`apps/mobile/lib/api-client.ts`** — der eine ts-rest-Client ist voll aus `@quiks/contracts`
  typisiert; der neue Endpunkt ist nach dem Contract-Eintrag **ohne eine Zeile Client-Code**
  aufrufbar.
- **API-seitig:** `foreignProfileColumns` / `pickForeignProfile` (Phase 07-01/07-04) sind die
  **einzigen** zugelassenen Leser bzw. Former der Fremd-View — der neue Endpunkt läuft darüber,
  sonst bricht `projection-uniqueness.spec.ts` (VIS-02 ist als Invariante kodiert, nicht als
  Zählung).

### Established Patterns

- Farben lösen **pro Render** über `useTheme()` auf, Styles über `createStyles(colors)` in einem
  `useMemo` — kein Farbtoken auf Modulebene (05.1 D-01). **Hell ist der Default-Fall**, und nur der
  exakte Gerätewert `dark` ergibt Dunkel.
- Schriftrollen über `fontFamilyForRole(role, fontsReady)`; ein numerisches `fontWeight` auf einer
  echten Gewichtsdatei erzeugt Faux-Bold (05.1 D-10). Eine Rolle mit CI-Tracking **muss** ihr
  `letterSpacing` mitsetzen, sonst schlägt die Suite fehl — betrifft den `display`-Titel im
  `AppHeader`.
- `no-literal-string`-Lint gilt auch für `components/`; `accessibilityLabel` ist ausgenommen und muss
  explizit durch Lingui geführt werden. `t` ist ein **Babel-Makro** und muss textuell an jeder
  Aufrufstelle stehen — eine modulweite Map voraufgelöster Labels friert die Sprache beim Import ein
  (siehe `FloatingNav`s Kommentar).
- Der `apps/mobile`-Vitest-Runner ist **node-env und deckt nur `lib/` ab** — reine Logik gehört
  dorthin. Screen-Wahrheit hängt an On-Device-UAT; das ist die strukturelle Verifikationsgrenze.
- Die Lingui-Kataloge (`apps/mobile/locales/{de,en}/messages.po`) sind **geteilter Zustand** — Pläne,
  die Copy anfassen, müssen serialisiert werden (Muster aus Phase 4/5/6/8).
- ts-rest-Non-200 ist ein **erfolgreiches** React-Query-Ergebnis, nie `status === 'error'`.

### Integration Points

- `apps/mobile/app/(festival)/` — bekommt den Fünf-Tab-Navigator; `_layout.tsx` ist heute ein nackter
  `Stack` und wird die Ebene aus D-10.
- `apps/mobile/app/(tabs)/home.tsx` → `start.tsx`, plus `_layout.tsx`, `FloatingNav.tsx`,
  `lib/cold-start-redirect.ts`, `lib/festival-navigation.ts`, `lib/__tests__/cold-start-redirect.test.ts`,
  `lib/__tests__/root-redirect.test.ts`, beide `.po`-Kataloge (D-19/D-20).
- `apps/mobile/app/_layout.tsx` — registriert die Push-Screens; der `AppHeader` löst dort und in
  `(tabs)/_layout.tsx` die `headerShown`/`title`-Optionen ab (D-03).
- `apps/mobile/package.json` + `app.json` — `react-native-webview` und ein **nativer Rebuild**
  (`npx expo run:android` **aus `apps/mobile`**, nie aus dem Repo-Root).
- ⚠️ **`packages/contracts` ist diesmal Kollisionszone.** Anders als Phase 8 fasst diese Phase den
  Contract an (D-18). Mit dem `admin`-Stream serialisieren, bevor der Endpunkt landet — und
  `packages/db` bleibt unangetastet (`my_festival` und `friendship` existieren beide bereits, es
  entsteht **keine neue Tabelle und keine Migration**).
- `apps/api` — neuer festival-scoped Read. **SEC-02 ist vererbte Pflicht:** der Cross-Tenant-Test ist
  auch hier zu ziehen, obwohl keine neue Tabelle entsteht — die Abfrage joint zwei bestehende.

</code_context>

<specifics>
## Specific Ideas

- **Der App-Header ist die eigentliche Überraschung dieser Phase.** Er stand in keinem Requirement,
  wurde aber vom User beim Durchsprechen des Ausstiegs eingebracht („der globale app header fehlt
  generell noch, siehe screen designs, da ist er überall vorhanden"). Er ist die Voraussetzung für
  NAV-01s Ausstieg und wird bewusst gleich app-weit gebaut.
- **Diese Phase schreibt genau einen Endpunkt.** Kommt beim Planen der Wunsch nach einem zweiten auf
  (Fremdprofil-Detail, Aktivitäten-Zähler fürs Dashboard, News), ist das ein Signal, dass D-07, D-18
  oder Phase-7-D-04 übersehen wurde.
- **Drei der fünf Tabs sind Platzhalter — das ist der Preis der Entscheidung, die volle Shell jetzt
  zu bauen** (STATE.md, User 2026-08-12: bei allen drei Scope-Fragen wurde die maximale Variante
  gewählt, Größenbedenken wurden genannt und verworfen — nicht neu aufmachen). NAV-02 und D-13 sind
  das, was diese drei ehrlich statt hohl macht.
- Die Erfolgskriterien in ROADMAP.md sind als **Zusagen** formuliert. Kriterium 3 („die Schnittmenge,
  niemals ein Präsenz- oder Standortsignal") ist am Gerät **und** am Contract zu prüfen: es darf im
  Response kein Feld geben, aus dem sich ein Aufenthaltsort ableiten ließe.
- `research` bleibt **aus** (erst Phase 12 braucht es). `code_review_depth` sollte **nicht** auf
  `deep` stehen bleiben müssen: es gibt keine Migration und keine Auth-Fläche — aber der neue
  festival-scoped Read und die WebView-Domain-Beschränkung sind die zwei Stellen, die eine
  Sicherheitsbetrachtung verdienen.
- Der Rename ist der erste Plan (D-21) und wird **am Gerät** verifiziert (`expo start -c`), nicht im
  node-env-Runner — die Lehre aus dem Phase-5-Bug.

</specifics>

<deferred>
## Deferred Ideas

- **Live-Act-Chip im App-Header** (`artistChipShow`, roter Punkt + Artist-Name, führt *ins* Festival)
  — braucht Timetable-Daten. Kommt frühestens mit dem Timetable-Milestone.
- **Header-Subtitle** (`tb.s`: „Vanta läuft · Ufer Bühne" bzw. ein Untertitel pro globalem Tab) — im
  Design berechnet, im Markup **nicht gerendert**. Nicht bauen, bis das Design es zeigt.
- **Dashboard-Blöcke ohne Datenquelle:** „Auf den Bühnen", „Auf deiner Merkliste" (Timetable),
  „Offizielle Events" + `Aktiv`-Zähler (Phase 10/11), `NewsCard`/News-Sektion (kein Backend),
  `SocialRow` (kein Schemafeld am Festival).
- **Tab-adressierende Deep Links** (`quiks://f/:slug/timetable`) — abgewählt in D-05; sinnvoll erst,
  wenn die Zieltabs Inhalt haben.
- **Pro-Festival gemerkter Tab-Zustand** — abgewählt in D-05; braucht neuen persistierten Zustand
  und eine Regel für leere Tabs.
- **Präsenz / „Gerade am Gelände" / Distanz im Festival-Friends-Tab** — durch ADR-014 ausgeschlossen;
  die spätere Opt-in-Stufe ist FRND-03b mit eigenen Standort-, Sichtbarkeits- und
  Aufbewahrungsregeln.
- **Chats im Festival-Friends-Tab** — dauerhaft ausgeschlossen (ADR-020). Chat existiert ab Phase 12
  ausschließlich pro Aktivität.
- **SafeNow-Hinweis auf dem Lageplan** — im Design vorhanden, per ADR-014 („SafeNow ist nicht im
  MVP") zurückgestellt.
- **„Freunde ins Festival einladen"** — die Zwei-Sektionen-Variante des Friends-Tabs hätte sofort
  danach verlangt; es gibt weder Endpunkt noch Requirement.
- **Anfragen-Badge in der `FloatingNav`** — aus Phase 8 übernommen; braucht eine Hintergrundabfrage
  oder Push (NOTF-01).
- **Blockieren/Melden (FRND-09)** — bewusst nach v1.1. **Vor der ersten echten Nutzerkohorte
  einplanen.**
- **`/gsd-ui-review 06`** — der nie gelaufene 6-Säulen-Audit der Phase-6-Screens. Der app-weite
  `AppHeader` (D-03) fasst genau diese Screens an; ein guter Moment, ihn nachzuholen.

</deferred>

---

*Phase: 9-Festival Navigation Shell*
*Context gathered: 2026-08-13*
