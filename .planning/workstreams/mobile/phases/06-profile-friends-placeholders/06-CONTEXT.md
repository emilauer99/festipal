# Phase 6: Profile & Friends Placeholders - Context

**Gathered:** 2026-08-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Die beiden letzten, heute **rein dekorativen** Einträge der globalen `FloatingNav` werden
echte Routen mit echten Screens — und die Tab-Struktur wird dabei auf das neue Design
(`docs/concept/designs/quiks-v2/`) reconciled.

Konkret liefert Phase 6 **drei** Screens im globalen App-Shell:

1. **Friends** (Tab 3) — globaler Freunde-Screen im Aufbau des Designs `03 Friends`,
   vollständig ohne Backing-Daten: jede Sektion mit eigenem Leerzustand (FRND-01).
2. **Mehr** (Tab 4, ersetzt den bisher geplanten „Profil"-Tab) — Screen `04 Mehr` im vollen
   Aufbau; funktionsfähig sind Konto→Profil, Sprache (Anzeige), **Dunkler Modus** (echt) und
   **Abmelden** (zieht aus dem Festivals-Header hierher, mit Rückfrage). Der Rest sichtbar
   deaktiviert.
3. **Profil** (Push-Screen hinter Mehr → Konto → Profil) — Screen `11 Profil`, view-only aus
   `GET /api/v1/me` (PROF-01), mit sichtbar deaktivierten Ausblick-Blöcken.

Zusätzlich — vom User bewusst in diese Phase gezogen, siehe D-10:
**Pronomen, Alter und Geschlecht** werden echte **optionale** Profilfelder (Schema →
Contract → `complete-profile`-Screen aus Phase 4 → Anzeige im Profil), **ohne**
Sichtbarkeits-Policy, Altersgrenze oder Signup-Disclaimer.

**In scope:**
- Tab-Bar-Umbau: 4. Tab `Profil` → `Mehr`; Profil wird Push-Screen (revidiert Phase-5 D-02/D-03).
- Friends-Screen mit allen Design-Blöcken, je mit Leerzustand.
- Mehr-Screen im vollen Design-Aufbau; tote Zeilen gedämpft + „kommt bald"-Feedback.
- Profil-Screen: Kopf (Avatar mit Sunset-Ring, displayName, @handle, Meta-Zeile) + KONTO-Sektion
  echt; Adden-Code-Karte, Socials, Vibe, Stat-Kacheln sichtbar deaktiviert.
- Additive Contract-Erweiterung: `Account.createdAt` → `meSchema` (für „seit … dabei").
- Additive Schema-/Contract-Erweiterung für die optionalen Identitätsfelder (D-10).
- Manueller Dark-Mode-Override (persistiert) über der Geräteeinstellung.
- Logout-Umzug: Festivals-Header → Mehr, mit `Alert.alert`-Rückfrage.
- ADR-023-Erweiterung: Sunset auch für Avatar-/Identitätsflächen (D-07).
- Alle Strings über Lingui (I18N-01); `username`/`displayName` werden nie übersetzt.

**Out of scope (Deferred, siehe unten):**
- Jede echte Freundes-Funktion: Suche, QR-Adden, Anfragen annehmen, **Chats**, Vorschläge (FRND-02).
- Profil **bearbeiten**, Avatar-Upload/Server-Storage, `socials[]` + `socialsVisibility` (PROF-02).
- Sichtbarkeits-Policy, Altersgrenze, Jugendschutz-Disclaimer (bleibt Birgits Konzept, IDN-02).
- Spotify-Anbindung („Vibe"), Zahlungsmittel, Push-Benachrichtigungen, Crew-Standort.
- Alle übrigen Screens des neuen Designs (Live, Aktivitäten, Crew, Timetable, Karte, Cashless,
  News, Aktivität erstellen) und der Umbau von `01 Start` gegenüber der heutigen Home.

</domain>

<decisions>
## Implementation Decisions

> Alle Entscheidungen wurden am 2026-08-11 vom User im interaktiven Discuss gewählt und sind
> **user-locked**. Pixel-, Abstands- und Icon-Details sind hier NICHT fixiert — die kommen aus
> `docs/concept/designs/quiks-v2/quiks-screens.template.html` und werden von `/gsd-ui-phase 6`
> in `06-UI-SPEC.md` transkribiert.

### Navigation / App-Shell

- **D-01 — Vierter Tab wird „Mehr", Profil wird Push-Screen.** Die globale Tab-Leiste heißt
  künftig `Start · Festivals · Friends · Mehr`; das Profil ist über `Mehr → Konto → Profil`
  erreichbar. Das **revidiert Phase-5 D-02/D-03** (dort: `Home · Festivals · Friends · Profil`)
  und damit den heute in `FloatingNav.tsx` gerenderten vierten Eintrag „Profile".
  Phase 6 liefert dadurch drei statt zwei Screens.
  — **Reversibility:** costly — der vierte Tab ist Wurzelnavigation; `FloatingNav` (dekorative
  Items → echte `Tabs.Screen`s), `(tabs)/_layout.tsx` und jede spätere Route unterhalb von Mehr
  hängen daran. HOME-03 ist damit über die Tab-Leiste erfüllt, nicht über das Festival-Home.

### Profil-Screen (`11 Profil`)

- **D-02 — Umfang: Identitätskarte + sichtbar deaktivierte Ausblick-Blöcke.** Kopfbereich und
  KONTO-Sektion tragen echte Werte aus `GET /me` (view-only). Adden-Code-Karte (QR +
  „Handle teilen"), Socials-Sektion, Vibe-Block und die drei Stat-Kacheln werden **gerendert,
  aber gedämpft und als „kommt bald" markiert** — die volle Optik des Designs steht, die toten
  Teile sind ehrlich als solche gekennzeichnet.
- **D-03 — KONTO-Zeilen bleiben tappbar mit Rückmeldung.** Name / Handle / E-Mail behalten das
  Chevron des Designs; ein Tap zeigt einen „Bearbeiten kommt bald"-Hinweis (siehe D-09).
  Bearbeiten selbst ist PROF-02.
- **D-04 — Meta-Zeile vollständig.** „{n} Festivals · {n} Friends · seit {Jahr} dabei". Festivals
  aus `GET /me/festivals`, Friends konstant 0, und **`Account.createdAt` wird additiv über
  `meSchema` nach vorn gereicht**. Der User hat die Contract-Erweiterung bewusst akzeptiert,
  nachdem die Kollisionszone mit dem Admin-Stream benannt war.
  — **Reversibility:** costly — `packages/contracts` ist veröffentlichte API-Fläche und wird
  parallel vom Admin-Stream gelesen; die Änderung muss serialisiert werden (siehe Coordination).
- **D-05 — Avatar bleibt gerätelokal, kommentarlos.** Lokales Foto aus MMKV
  (`avatar-uri:${accountId}`) wenn vorhanden, sonst Initialen — wie in Phase 4. Kein Hinweis, kein
  Upload; nach Neuinstallation sieht der Visitor nur Initialen. Server-Avatar bleibt PROF-02.
- **D-06 — Vibe-Block tot.** „Vibe · von Spotify gesynct" wird wie die übrigen toten Blöcke
  gedämpft gerendert; keine Spotify-Anbindung.
- **D-07 — ADR-023 wird nachgezogen statt umgangen.** Das Design gibt dem Profil-Avatar einen
  Sunset-Ring (`--q-hero`). ADR-023 erlaubt Sunset bisher nur für Marken- und Hero-Flächen. Statt
  einer Einzelfall-Ausnahme wird die Regel **generell um Avatar-/Identitätsflächen erweitert** —
  gilt damit app-weit, auch für spätere Friends-Avatare. Zu ändern: `docs/DEVELOPMENT_DECISIONS.md`
  (ADR-023) **und** `docs/brand/quiks-ci-v1.md`; bestehende Token-/Gradient-Guard-Tests prüfen.
  — **Reversibility:** costly — eine veröffentlichte Brand-Regel; ein Rückzieher betrifft jede
  Fläche, die die Erweiterung inzwischen genutzt hat.

### Mehr-Screen (`04 Mehr`) & Logout

- **D-08 — Voller Design-Aufbau, tote Zeilen gedämpft, Dark-Switch echt.** Alle Sektionen wie
  gezeichnet (Konto · Darstellung · Benachrichtigungen · Standort & Sicherheit · App).
  Funktionsfähig: Konto→Profil, Sprache (nur Anzeige), Abmelden und **„Dunkler Modus"**.
  Sichtbar deaktiviert: Zahlungsmittel, die drei Push-Switches, Crew-Standort. Die SafeNow-Karte
  ist reiner Text + externer Link und darf echt sein (Wortlaut im Design betont ausdrücklich, dass
  keine Verbindung zu SafeNow besteht — diese Distanzierung muss erhalten bleiben).
- **D-08a — Dark-Mode-Override ist echte neue Funktionalität.** Heute löst `lib/theme.ts` das
  Geräteschema pro Render auf (hell-first, nur exakt `dark` ergibt Nacht). Der Switch braucht einen
  **persistierten Override** über der Geräteeinstellung; Provider und `theme.ts` müssen einen
  dritten Zustand (system / hell / dunkel) lernen, ohne die 05.1-Invariante zu brechen.
  — **Reversibility:** costly — `useTheme()` wird von jeder Komponente und jedem Screen konsumiert.
- **D-09 — Logout zieht auf Mehr, mit Rückfrage.** Der `LogOut`-Icon-Button verschwindet aus dem
  Festivals-Header; „Abmelden" wird die rote `ListRow` am Ende der App-Sektion. Vor dem Abmelden
  kommt ein nativer, abbrechbarer `Alert.alert` — die Session ist nur per E-Mail-OTP
  zurückzuholen. Die bestehende `handleLogout`-Logik (inkl. `forceUnauthenticated()`-Backstop und
  `clearActiveFestivalSlug()`) wandert unverändert mit.
  *Hinweis: Das Design lässt auch Logout ein Info-Sheet öffnen (`infoLogout`) — das ist
  Prototyp-Verhalten, kein Produktentscheid; hier gilt die echte Rückfrage.*

### Friends-Screen (`03 Friends`)

- **D-10 — Global, kein Festival-Bezug.** Das Design zeigt Friends durchgängig global. Damit ist
  die ROADMAP-Formulierung von FRND-01 („friends who saved this festival") überholt — genau wie
  zuvor HOME-03. Der Screen liest **keinen** Festival-State.
- **D-11 — Alle Design-Blöcke, jeder mit eigenem Leerzustand.** Suche · quiks-Code/QR · Anfragen ·
  Chats · Deine Crew · Vielleicht kennst du werden alle gerendert, jeweils leer bzw. deaktiviert.
  *Vom User bewusst gewählt, nachdem der Einwand benannt war: sechs leere Sektionen untereinander
  können als kaputt statt absichtsvoll gelesen werden, und die Chats-Sektion deutet Messaging an,
  das (Realtime, Redis-Gateway) noch weit außerhalb liegt. Die Leerzustände müssen diese Last
  tragen — hier liegt das Hauptrisiko der Phase für den `/gsd-ui-review`.*

### Identitätsfelder (IDN-02, in diese Phase gezogen)

- **D-12 — Pronomen, Alter und Geschlecht werden optionale Profilfelder, ohne Policy.** Erfasst
  bei der Profil-Erstellung (Phase-4-Screen `(profile-setup)/complete-profile.tsx`), angezeigt im
  Profilkopf („sie/ihr · 23 · weiblich"). Umfang: `packages/db` (Schema) → `packages/contracts`
  (`visitorProfilePublicSchema`, `completeProfileBodySchema`) → `apps/api` complete-profile →
  Erstellungsscreen → Profilanzeige. **Keine** Sichtbarkeitssteuerung, **keine** Altersgrenze,
  **kein** Signup-Disclaimer.
  *Der Einwand wurde benannt und vom User überstimmt: PROJECT.md führt IDN-02 als „pending
  Birgit's concept — out of this milestone", weil daran Jugendschutz, Flinta-Filter und der
  Sicherheits-Disclaimer hängen. Der Designtext verspricht zudem „du entscheidest, was Freunde
  sehen", wofür es noch keine Visibility-Policy gibt.*
  — **Reversibility:** one-way — Schemaerweiterung auf `visitor_profile` plus eine Änderung an
  `packages/contracts`, die der Admin-Stream mitliest; ein Rückzieher braucht eine Migration und
  betrifft bereits erfasste personenbezogene Daten (Geburtsdatum/Geschlecht).
  **D-12a — Speicherform entschieden (User, 2026-08-11, plan-phase):** **Geburtsdatum speichern,
  Alter ableiten.** `visitor_profile` bekommt eine nullable `birth_date`-Spalte (date); das im
  Profilkopf angezeigte Alter wird daraus berechnet und nie als eigener Wert persistiert.
  Begründung: der Wert veraltet nicht (Profil-Bearbeiten ist PROF-02, also erst später), und eine
  spätere Altersgrenze / Jugendschutz-Policy aus Birgits Konzept (IDN-02) ist ohne Migration
  möglich. Konsequenz für den Planner: der `complete-profile`-Screen braucht eine
  Geburtsdatums-Eingabe (Date-Picker) statt eines Zahlenfelds, und die Ableitung des Alters gehört
  als reine Logik nach `lib/` (node-env-Vitest deckt nur `lib/` ab).

### Platzhalter-Ton & Copy

- **D-13 — „Kommt bald" ist ein Toast/Snackbar, ein einziger Mechanismus.** Ein Tap auf eine tote
  Zeile zeigt einen kurzen, selbst verschwindenden Hinweis am unteren Rand — nicht das Info-Sheet
  des Designs und nicht sechs verschiedene Lösungen. Ein eigener, kleiner Baustein auf RN-Primitiven
  (ADR-022), von Profil, Mehr und Friends gemeinsam genutzt.
- **D-14 — Design-Copy ist Richtung, nicht Wortlaut.** Der Ton der DE-Strings wird übernommen
  („Zeigen, scannen, fertig — so addet ihr euch", „Freunde deiner Freunde — mehr schlägt quiks
  nicht vor", „Die Nachtschicht für deine Augen"); die genaue Formulierung darf beim Umsetzen
  abweichen, etwa wenn ein Satz auf kleinen Geräten umbricht. EN wird sinngemäß übersetzt.
- **D-15 — Design-Ablage (Claude's Discretion, bereits ausgeführt).** Die Lieferung liegt als
  gebündelter Export unter `docs/quiks_screen_designs.html` (763 KB, eine JSON-escapte Zeile —
  für Agenten nicht lesbar). Daraus wurde eine lesbare Template-Extraktion plus Screen-Index nach
  `docs/concept/designs/quiks-v2/` geschrieben; `img.png` aus dem Repo-Root wurde als
  `11-profil.png` dorthin verschoben.

### Claude's Discretion (technische Defaults — in PLAN.md sichtbar machen)

- Route-Struktur für Mehr + Profil (eigene Gruppe unter `(tabs)` mit gestapeltem Profil vs.
  Stack-Screen auf Wurzelebene), Benennung der Routen, `Tabs.Screen`-Registrierung.
- Aufbau des Toast-Bausteins (Kontext-Provider vs. lokaler State) und sein Platz relativ zur
  `FloatingNav` (darf sie nicht verdecken).
- Persistenzweg des Theme-Overrides (MMKV analog zu `active-festival-storage.ts` liegt nahe).
- Wie die Festivals-Zahl in der Meta-Zeile geladen wird (bestehende `festivalKeys.mine`-Query
  wiederverwenden statt einer zweiten Abfrage).
- Genaue Icon-Auswahl (`lucide-react-native`) je Zeile, Reihenfolge der Blöcke, Abstände —
  gegen das Design abzugleichen, nicht frei zu erfinden.
- Ob Friends und Mehr jeweils einen Header/Titel tragen (Festivals hat heute einen).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Bindender Design-Vertrag (DIESE PHASE — zuerst lesen)
- `docs/concept/designs/quiks-v2/README.md` — Screen-Index, Zeilennummern je Screen, was die
  Extraktion enthält und was nicht. **Einstiegspunkt.**
- `docs/concept/designs/quiks-v2/quiks-screens.template.html` — lesbare Extraktion aller 13 Screens
  (Markup, Copy, Token-Verwendung). Phase-6-relevant: `03 Friends` (Z. 1435–1491),
  `04 Mehr` (Z. 1493–1528), `11 Profil` (Z. 1773–1819), `FloatingNav` (Z. 1849).
- `docs/concept/designs/quiks-v2/11-profil.png` — gerenderter Profil-Screen (Farbe, Gewichtung,
  Abstände), ergänzend zum Markup.
- `docs/quiks_screen_designs.html` — Original-Bundle des Designers (im Browser öffnen; **nicht**
  als Text lesen).
- `docs/concept/designs/festival/` — **abgelöstes** älteres Design-Set. Bleibt gültige Referenz für
  Tokens und die Komponentensammlung (`festipal-ds.js`: `ListRow`, `Switch`, `StatTile`, `Avatar`,
  `Badge`, `Sheet`, `FriendRow`, `Input`), **nicht** mehr für Screen-Aufbau und Navigation.

### Brand / CI
- `docs/brand/quiks-ci-v1.md` — CI v1.0, bindend (ADR-023). **Wird in dieser Phase geändert**
  (D-07: Sunset zusätzlich für Avatar-/Identitätsflächen).
- `docs/DEVELOPMENT_DECISIONS.md` — **ADR-023** (CI v1.0 / Sunset-Regel — Änderung durch D-07),
  **ADR-022** (keine Fremd-UI-Kits; eigene RN-Primitives auf Tokens), **ADR-024** (quiks-Rename),
  **ADR-012 / ADR-020** (zwei Locale-Achsen; user-generated content wird nie übersetzt),
  **ADR-014 / ADR-016** (Tenant-Grenze, Account→VisitorProfile), **ADR-009** (E-Mail-OTP — relevant
  für die Logout-Rückfrage), **ADR-011** (Cashless als eingebettete URL — betrifft den späteren
  Cashless-Screen, nicht Phase 6).

### Roadmap / Requirements (diese Phase)
- `.planning/workstreams/mobile/ROADMAP.md` §„Phase 6: Profile & Friends Placeholders" — Ziel +
  4 Success Criteria. **Achtung:** SC-1 („from the festival home") und SC-3 („friends who saved
  this festival") sind durch D-01 bzw. D-10 überholt und beim Phasenübergang zu reconcilen.
- `.planning/workstreams/mobile/REQUIREMENTS.md` — **HOME-03**, **PROF-01**, **FRND-01** (diese
  Phase); **IDN-02** wird durch D-12 teilweise vorgezogen; **I18N-01**, **SEC-01** binden weiter.
- `.planning/PROJECT.md` — „Out of Scope" dieses Milestones; D-12 weicht bewusst davon ab.

### Vorherige Phasen, auf denen diese aufsetzt
- `.planning/workstreams/mobile/phases/05-festival-selection-home/05-CONTEXT.md` — D-02/D-03
  (globale Tab-Leiste, Friends/Profil als „coming soon") — **durch D-01 revidiert**.
- `.planning/workstreams/mobile/phases/05.1-quiks-rename-ci-v1-0-rollout/05.1-CONTEXT.md` —
  hell-first Modusauflösung, `createStyles(colors)`, `fontFamilyForRole`, Token-Guards.
- `.planning/workstreams/mobile/phases/04-visitor-auth-profile-completion/04-CONTEXT.md` —
  `AvatarTile`/`deriveInitials`, MMKV-Avatar, Logout + `forceUnauthenticated()`, der
  `complete-profile`-Screen, den D-12 erweitert.
- `.planning/workstreams/mobile/phases/02-otp-auth-festival-backend-api/02-CONTEXT.md` —
  `GET /me`-Shape, `complete-profile` inkl. 23505→409-Guard.

### Bestehender Code, den diese Phase anfasst
- `apps/mobile/components/FloatingNav.tsx` — `DisabledNavItem`-Paar wird zu einem echten
  vierten Tab („Mehr"); Friends wird echte Route.
- `apps/mobile/app/(tabs)/_layout.tsx` — bisher nur `home` + `festivals` registriert.
- `apps/mobile/app/(tabs)/festivals.tsx` — `handleLogout` + `LogOut`-Header-Button ziehen weg.
- `apps/mobile/app/(profile-setup)/complete-profile.tsx` — bekommt die optionalen Felder (D-12).
- `apps/mobile/lib/theme.ts` + `lib/theme-context.tsx` — brauchen den persistierten Override (D-08a).
- `apps/mobile/lib/api-client.ts`, `lib/festival-queries.ts` — `getMe`/`listMyFestivals` liegen vor.
- `apps/mobile/components/AvatarTile.tsx` — Initialen/Foto-Kachel, wird im Profilkopf wiederverwendet.
- `packages/contracts/src/schemas.ts` — `meSchema`, `visitorProfilePublicSchema`,
  `completeProfileBodySchema` (D-04 + D-12).
- `packages/db/src/schema/visitor-profile.ts` + drizzle-zod-Basis (D-12).
- `apps/mobile/locales/{de,en}/messages.po` — geteilte Lingui-Kataloge; Pläne, die sie anfassen,
  müssen serialisiert werden (Muster aus Phase 4/5).

### Koordination (Workstreams)
- `.claude/CLAUDE.md` §„Parallel Workstreams" — `packages/contracts`, `packages/db` und
  `packages/ui` sind die Kollisionszone mit dem Admin-Stream: **nur ein Stream ändert sie
  gleichzeitig**. D-04 und D-12 fassen beide an — vor Ausführung mit dem Admin-Stream abstimmen.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AvatarTile` + `deriveInitials` (Phase 4) decken Foto/Initialen inkl. Unicode-Kantenfällen ab —
  der Profilkopf braucht nur den Sunset-Ring darum herum (D-07).
- `GET /me` liefert `accountId`, `email` und `profile` bereits vollständig — für PROF-01 ist
  **keine** neue Endpoint-Arbeit nötig; nur `createdAt` (D-04) und die Identitätsfelder (D-12)
  erweitern die Shape.
- `festivalKeys` + `unwrapOk` (`lib/festival-queries.ts`) sind framework-frei und liefern die
  Festivals-Zahl der Meta-Zeile ohne zweite Abfrage.
- `handleLogout` in `festivals.tsx` ist vollständig gehärtet (Doppelklick-Guard,
  `forceUnauthenticated()`-Backstop bei fehlgeschlagenem `signOut()`, `clearActiveFestivalSlug()`)
  — umziehen, nicht neu schreiben.
- `ComingSoonTile` (Phase 5) ist der bestehende Präzedenzfall für „sichtbar tot" und der
  Bezugspunkt für die vielen gedämpften Zeilen dieser Phase.

### Established Patterns
- Farben lösen **pro Render** über `useTheme()` auf, Styles über `createStyles(colors)` in einem
  `useMemo` — kein Farbtoken auf Modulebene (05.1 D-01). Hell ist der Default-Fall.
- Schriftrollen über `fontFamilyForRole(role, fontsReady)`; ein numerisches `fontWeight` auf einer
  echten Gewichtsdatei erzeugt Faux-Bold (05.1 D-10). Tracking-Guard-Test läuft mit.
- `no-literal-string`-Lint gilt auch für `components/`; `accessibilityLabel` ist ausgenommen und
  muss explizit durch Lingui geführt werden (Pitfall 4 aus Phase 4).
- Zod-Schemas in `packages/contracts` sind die einzige Quelle — auf der drizzle-zod-Basis
  erweitern (`.extend()`), niemals von Hand nachbauen (Pitfall 6).
- Eigene RN-Primitives auf Tokens (ADR-022); Icons über `lucide-react-native`.
- Der `apps/mobile`-Vitest-Runner ist node-env und deckt nur `lib/` ab — reine Logik (Theme-Override,
  Ableitungen der Meta-Zeile) gehört dorthin, nicht in Screen-Code.

### Integration Points
- Der vierte Tab ist Wurzelnavigation: `FloatingNav` rendert die beiden toten Items heute selbst,
  ohne `Tabs.Screen`; D-01 macht daraus eine echte Route plus einen gestapelten Profil-Screen.
- Der Theme-Override greift in `lib/theme.ts` ein, das **jede** Komponente konsumiert — die
  05.1-Invariante (nur exakt `dark` ergibt Nacht, alles andere hell) darf dabei nicht kippen.
- D-04 und D-12 spannen `packages/db` → `packages/contracts` → `apps/api` → zwei Mobile-Screens in
  einem koordinierten Schnitt — und liegen in der Admin-Kollisionszone.
- Die Lingui-Kataloge sind geteilter Zustand; Pläne, die Copy anfassen, müssen serialisiert werden.

</code_context>

<specifics>
## Specific Ideas

- Die neuen Designs (`docs/concept/designs/quiks-v2/`) sind ab jetzt der **North-Star für die
  gesamte weitere Planung und Umsetzung** — ausdrücklicher Auftrag des Users, nicht nur für Phase 6.
  Das ältere `docs/concept/designs/festival/`-Set ist für Screen-Aufbau und Navigation abgelöst.
- „Sichtbar tot statt weggelassen" ist die durchgehende Haltung dieser Phase: die volle Optik der
  Designs steht, alles ohne Backing ist gedämpft und als „kommt bald" markiert.
- Die Distanzierung in der SafeNow-Karte („Wir stehen in keiner Verbindung zu SafeNow — finden die
  App aber richtig gut") ist inhaltlich wichtig und darf beim Kürzen nicht verloren gehen.
- „Start" ist der Name des ersten Tabs im neuen Design; die App nennt ihn heute „Home". Umbenennen
  ist nicht beauftragt — beim Phasenübergang aufgreifen.

</specifics>

<deferred>
## Deferred Ideas

- **FRND-02 — echte Freunde-Funktion:** Suche über „Name oder @handle", Adden per quiks-Code/QR
  („Zeigen, scannen, fertig"), Anfragen annehmen/ablehnen, „Vielleicht kennst du"-Vorschläge
  („Freunde deiner Freunde — mehr schlägt quiks nicht vor"), Präsenz/„Gerade am Gelände".
- **Chats / Messaging:** die Chats-Sektion des Friends-Screens inkl. Unread-Punkten und
  Chat-Sheet — braucht das Realtime-Gateway (NestJS WebSocket + Redis), eigener Milestone.
- **PROF-02 — Profil bearbeiten:** Name/Handle/E-Mail ändern, Avatar-Upload mit Server-Storage,
  `socials[]` (Instagram/TikTok/Spotify) + `socialsVisibility`.
- **Vibe / Spotify-Sync:** Lieblings-Artist-Chips „von Spotify gesynct".
- **Stat-Kacheln mit echten Werten:** „Acts gemerkt" setzt das Artists-Feature voraus (eigener
  Milestone); „Friends" setzt FRND-02 voraus.
- **IDN-02 Rest — Sicherheits-/Jugendschutzkonzept (Birgit):** Sichtbarkeits-Policy pro Feld,
  Altersgrenze, Flinta-Filter, Signup-Disclaimer. D-12 zieht nur die reine Erfassung vor.
- **Zahlungsmittel, Push-Benachrichtigungen, Crew-Standortfreigabe** aus dem Mehr-Screen.
- **In-App-Sprachumschalter:** „Sprache" ist in Phase 6 nur Anzeige; Umschalten kommt später.
- **Übrige Screens des neuen Designs:** `05 Live`, `06 Aktivitäten`, `06b Crew`, `07 Timetable`,
  `08 Karte`, `09 Cashless`, `10 News`, `12 Aktivität erstellen` — spätere Content-Phasen.
- **Umbau von `01 Start`** gegenüber der heutigen Home und die Umbenennung „Home" → „Start".

### Reviewed Todos (not folded)
Keine — `todo.match-phase` lieferte 0 Treffer.

</deferred>

---

*Phase: 6-profile-friends-placeholders*
*Context gathered: 2026-08-11*
