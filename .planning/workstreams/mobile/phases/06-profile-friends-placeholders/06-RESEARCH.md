# Phase 6: Profile & Friends Placeholders - Research

**Researched:** 2026-08-11
**Domain:** Expo Router navigation restructuring, persisted theme override, additive Drizzle/ts-rest contract schema evolution, React Native date input, shared toast primitive, i18n/lint compliance
**Confidence:** HIGH (alle zentralen Claims sind an konkreten, in dieser Session gelesenen Dateien verifiziert; die wenigen Lücken — Paketname `@react-native-community/datetimepicker`, Lingui-`plural`-Makro-API, `session.user.createdAt`-Laufzeitverhalten — sind explizit als `[ASSUMED]`/`[CITED]` markiert und im Assumptions Log gesammelt)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (verbatim-nah, 06-CONTEXT.md, 2026-08-11, user-locked)

**Navigation / App-Shell**
- **D-01** — Vierter Tab wird „Mehr", Profil wird Push-Screen. Tab-Leiste künftig `Start · Festivals · Friends · Mehr`; Profil erreichbar über `Mehr → Konto → Profil`. Revidiert Phase-5 D-02/D-03 (`Home · Festivals · Friends · Profil`). Reversibility: costly (Wurzelnavigation).

**Profil-Screen (`11 Profil`)**
- **D-02** — Umfang: Identitätskarte + sichtbar deaktivierte Ausblick-Blöcke (Kopf + KONTO echt aus `GET /me`; Adden-Code, Socials, Vibe, Stat-Kacheln gerendert-aber-gedämpft, „kommt bald").
- **D-03** — KONTO-Zeilen (Name/Handle/E-Mail) bleiben tappbar mit Rückmeldung („Bearbeiten kommt bald"); echtes Bearbeiten ist PROF-02 (out of scope).
- **D-04** — Meta-Zeile vollständig: „{n} Festivals · {n} Friends · seit {Jahr} dabei". Festivals aus `GET /me/festivals` (bereits gecacht), Friends konstant 0, `Account.createdAt` additiv über `meSchema`. Reversibility: costly (Contract ist Kollisionszone mit Admin-Stream, muss serialisiert werden).
- **D-05** — Avatar bleibt gerätelokal (MMKV, Phase 4), kommentarlos; kein Upload-Hinweis.
- **D-06** — Vibe-Block tot, gedämpft wie andere tote Blöcke.
- **D-07** — ADR-023 wird erweitert statt umgangen: Sunset-Ring am Profil-Avatar macht die Sunset-Regel generell auf Avatar-/Identitätsflächen zulässig (bisher nur Marke + Hero). Ändert `docs/DEVELOPMENT_DECISIONS.md` (ADR-023) UND `docs/brand/quiks-ci-v1.md`; bestehende Gradient-Guard-Tests prüfen. Reversibility: costly (veröffentlichte Brand-Regel).

**Mehr-Screen (`04 Mehr`) & Logout**
- **D-08** — Voller Design-Aufbau (Konto · Darstellung · Benachrichtigungen · Standort & Sicherheit · App), tote Zeilen gedämpft. Funktionsfähig: Konto→Profil, Sprache (Anzeige), Abmelden, Dunkler Modus. SafeNow-Karte ist echter Text + externer Link, Distanzierungssatz MUSS erhalten bleiben.
- **D-08a** — Dark-Mode-Override ist echte neue Funktionalität: persistierter Override über der Geräteeinstellung, dritter Zustand (system/hell/dunkel), OHNE die 05.1-Invariante (nur exakt `'dark'` ergibt Nacht) zu brechen. Reversibility: costly (`useTheme()` wird überall konsumiert).
- **D-09** — Logout zieht von Festivals-Header nach Mehr (rote `ListRow`), mit nativer `Alert.alert`-Rückfrage. Bestehende `handleLogout`-Logik (inkl. `forceUnauthenticated()`-Backstop, `clearActiveFestivalSlug()`) wandert unverändert mit.

**Friends-Screen (`03 Friends`)**
- **D-10** — Global, kein Festival-Bezug. Überholt die ROADMAP-Formulierung von FRND-01 („friends who saved this festival") — wie zuvor bereits HOME-03 durch D-01 überholt wurde.
- **D-11** — Alle Design-Blöcke (Suche · quiks-Code/QR · Anfragen · Chats · Deine Crew · Vielleicht kennst du) werden gerendert, jeder mit eigenem, sektionsspezifischem Leerzustand — bewusst NICHT gedämpft (Risiko: sechs leere Sektionen könnten als kaputt statt absichtsvoll gelesen werden; Chats-Copy muss die Precondition „sobald ihr euch addet" benennen, nicht nur „keine Nachrichten").

**Identitätsfelder (IDN-02, in diese Phase gezogen)**
- **D-12** — Pronomen, Alter, Geschlecht werden optionale Profilfelder, OHNE Sichtbarkeits-Policy/Altersgrenze/Disclaimer. Umfang: `packages/db` → `packages/contracts` (`visitorProfilePublicSchema`, `completeProfileBodySchema`) → `apps/api` complete-profile → `complete-profile.tsx` → Profilanzeige. Reversibility: one-way (personenbezogene Daten).
- **D-12a** — Speicherform (User, plan-phase-Checkpoint 2026-08-11): **Geburtsdatum speichern, Alter ableiten.** `visitor_profile` bekommt eine nullable `birth_date`-Spalte (date); Alter wird im Profilkopf berechnet, nie eigenständig persistiert. Konsequenz: `complete-profile.tsx` braucht eine Geburtsdatums-Eingabe (Date-Picker) statt Zahlenfeld; die Altersableitung gehört als reine Logik nach `lib/` (node-env Vitest deckt nur `lib/` ab).

**Platzhalter-Ton & Copy**
- **D-13** — „Kommt bald" ist EIN Toast/Snackbar-Mechanismus (nicht das Info-Sheet des Designs, nicht sechs Lösungen). Eigener kleiner Baustein auf RN-Primitiven (ADR-022), von Profil, Mehr und Friends gemeinsam genutzt.
- **D-14** — Design-Copy ist Richtung, nicht Wortlaut; genaue Formulierung darf beim Umsetzen abweichen (Zeilenumbruch etc.). EN ist sinngemäß, nicht wörtlich.
- **D-15** — Design-Ablage (bereits ausgeführt, Claude's Discretion): `docs/concept/designs/quiks-v2/` ist die lesbare Extraktion, North-Star für diese und alle folgenden Phasen.

### Claude's Discretion (technische Defaults — sichtbar in PLAN.md)
- Route-Struktur für Mehr + Profil (eigene Gruppe vs. Stack-Screen auf Wurzelebene), Routen-Benennung, `Tabs.Screen`-Registrierung — **in dieser Research aufgelöst, siehe Pattern 1 unten** (UI-SPEC hat dies bereits entschieden: `app/profil.tsx` auf Wurzelebene).
- Aufbau des Toast-Bausteins (Context-Provider vs. lokaler State) und Platz relativ zur `FloatingNav` — **von UI-SPEC bereits fixiert** (`ToastProvider` in `app/_layout.tsx`, `bottom: layout.navHeight + layout.navInset + insets.bottom + sp-4`).
- Persistenzweg des Theme-Overrides (MMKV analog `active-festival-storage.ts`) — **in dieser Research konkretisiert, siehe Pattern 2**.
- Festivals-Zahl der Meta-Zeile: bestehende `festivalKeys.mine`-Query wiederverwenden, keine zweite Abfrage — **verifiziert, `lib/festival-queries.ts` ist framework-frei und bereits gecacht**.
- Icon-Auswahl (`lucide-react-native`), Blockreihenfolge, Abstände — gegen Design abzugleichen (UI-SPEC hat dies bereits größtenteils fixiert).
- Ob Friends/Mehr einen Header/Titel tragen — **UI-SPEC hat entschieden: ja, native Header wie `festivals.tsx`** (Titel "Friends"/"Mehr").

### Deferred Ideas (OUT OF SCOPE)
- **FRND-02** — echte Freundes-Funktion (Suche, QR-Adden, Anfragen, „Vielleicht kennst du"-Vorschläge, Präsenz).
- **Chats/Messaging** — braucht Realtime-Gateway (NestJS WebSocket + Redis), eigener Milestone.
- **PROF-02** — Profil bearbeiten (Name/Handle/E-Mail ändern, Avatar-Upload/Server-Storage, `socials[]` + `socialsVisibility`).
- **Vibe/Spotify-Sync**, **Stat-Kacheln mit echten Werten** (Artists-Feature bzw. FRND-02 vorausgesetzt).
- **IDN-02 Rest** — Sichtbarkeits-Policy, Altersgrenze, Flinta-Filter, Signup-Disclaimer (Birgits Konzept). D-12 zieht nur die reine Erfassung vor.
- Zahlungsmittel, Push-Benachrichtigungen, Crew-Standortfreigabe, In-App-Sprachumschalter, übrige Design-Screens (Live/Aktivitäten/Crew/Timetable/Karte/Cashless/News), Umbau `01 Start`/Umbenennung „Home" → „Start".
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-03 | The home provides navigation to Profile and Friends | **Reconciled durch D-01**: Erfüllt NICHT über das Festival-Home, sondern über die globale Tab-Leiste (`FloatingNav`, Pattern 1). Der ROADMAP-Wortlaut „from the festival home" ist überholt — die Navigation lebt in `(tabs)/_layout.tsx` + `FloatingNav.tsx`, unabhängig vom aktiven Festival. |
| PROF-01 | Profile screen shows username, displayName, avatar/initials, email view-only, from `GET /api/v1/me` | `GET /me` liefert bereits `accountId`, `email`, `profile.{username,displayName,avatar}` vollständig (verifiziert `apps/api/src/me/me.service.ts:16-28`) — **keine neue Endpoint-Arbeit**, nur additive Shape-Erweiterung (`createdAt`, D-12-Felder). `AvatarTile`/`deriveInitials` (Phase 4) decken Avatar/Initialen ab. Route/Registrierung: Pattern 1. |
| FRND-01 | Friends screen with clear, non-broken empty state | **Reconciled durch D-10**: global, kein Festival-Bezug, kein Backing-Query — sechs strukturell leere Sektionen mit eigener Copy (UI-SPEC § Copywriting Contract), kein Loading-/Error-Zustand pro Sektion nötig. |
</phase_requirements>

## Summary

Phase 6 ist größer als der ROADMAP-Titel suggeriert: Sie liefert drei neue Screens
(`friends.tsx`, `mehr.tsx`, `profil.tsx`), baut die globale Tab-Leiste von 2 auf 4 echte Routen
um, führt eine persistierte Theme-Override-Funktion ein, erweitert Contract+Schema additiv um
`Account.createdAt` und drei optionale Identitätsfelder (Pronomen/Alter-via-Geburtsdatum/
Geschlecht), baut einen neuen Date-Picker in den bestehenden `complete-profile.tsx`-Screen ein,
führt einen neuen geteilten Toast-Baustein ein und erweitert ADR-023 (Sunset-Regel) in zwei
Dokumenten. Der Code, den diese Phase anfasst, ist zu großen Teilen bereits gut vorbereitet: die
FloatingNav rendert die vierte/dritte Position heute nur als dekoratives `DisabledNavItem`-Paar
ohne Backing-Route, `GET /me` liefert bereits die volle View-only-Shape, `ComingSoonTile` ist der
etablierte Präzedenzfall für „sichtbar tot", und der drizzle-zod-`.extend()`-Workaround für neue
Spalten ist an zwei Stellen (`visitor-profile.ts`, `festival.ts`) bereits vorexerziert — inklusive
des Nullable-Date-Sonderfalls, der für `birth_date` (D-12a) exakt gebraucht wird.

Das mit Abstand größte technische Risiko liegt NICHT im Screen-Bau, sondern in drei Stellen, die
in der UI-SPEC nur angerissen sind: (1) `app/profil.tsx` muss als root-level `Stack.Screen`
EXPLIZIT im bereits vorhandenen `Stack.Protected`-Block in `app/_layout.tsx` registriert werden —
dieser Block listet seine Screens heute explizit (`index`, `(auth)`, `(profile-setup)`, `(tabs)`,
`(festival)`) und hat keinen impliziten Auto-Discovery-Fallback, den die UI-SPEC unterstellt; (2)
`Account.createdAt` kommt aus better-auths Session-Objekt (`session.user.createdAt`), nicht aus
einer neuen DB-Query — der Wert ist zur Laufzeit ein `Date`, muss aber im Contract als String
(ISO) modelliert und explizit serialisiert werden, sonst bricht die etablierte Konvention „Contract
transportiert Daten immer als String, nie als `z.date()`" (siehe `festivalSchema`); (3) der
persistierte Theme-Override MUSS strikt ÜBER `resolveThemeMode` liegen, nicht ihn ersetzen, sonst
kippt die 05.1-Invariante, die ein eigener, bereits bestehender Test (`lib/__tests__/theme.test.ts`)
gate-hält.

**Primary recommendation:** Screens/Navigation/Theme-Override/Toast bauen ausschließlich auf den in
dieser Research zitierten, bereits etablierten Patterns auf (kein neues Architekturmuster
einführen); die einzige neue externe Abhängigkeit ist ein nativer Date-Picker für D-12a
(`@react-native-community/datetimepicker`, `[ASSUMED]` Paketname, `[OK]` laut
package-legitimacy-Check — siehe Package Legitimacy Audit); die Contract-/Schema-Änderungen (D-04,
D-12) müssen laut `.claude/CLAUDE.md` §Parallel Workstreams mit dem Admin-Stream sequenziert
werden, bevor sie landen.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tab-Navigation (Friends/Mehr Tabs, Profil-Push) | Mobile Client (Expo Router) | — | Reine Client-Routing-Entscheidung, kein Server-State involviert |
| Profil-Anzeige (username/displayName/avatar/email/createdAt) | API / Backend (`GET /me`) | Mobile Client (Rendering) | Daten kommen server-seitig aus Account+VisitorProfile; Client ist reiner Konsument, view-only |
| Identitätsfelder (Pronomen/Geburtsdatum/Geschlecht) | Database/Storage (`visitor_profile`) | API (Contract-Validierung), Mobile Client (Eingabe + Ableitung) | Persistenz in Postgres, Validierung im Contract-Layer, Alters-Ableitung ist reine Client-Logik (kein Server-Roundtrip nötig, da `birth_date` bereits im `GET /me`-Payload steht) |
| Theme-Override (system/hell/dunkel) | Mobile Client (`lib/theme.ts` + MMKV) | — | Rein gerätelokale UI-Präferenz, kein Server-State, kein Sync über Geräte hinweg (Scope-Entscheidung, nicht in CONTEXT.md abgedeckt — siehe Open Questions) |
| „Kommt bald"-Feedback (Toast) | Mobile Client (Component) | — | Rein clientseitiges UI-Feedback, keine Server-Interaktion |
| Friends-Leerzustände | Mobile Client (statische Copy) | — | D-10: kein Backing-Query, keine Server-Rolle in Phase 6 |
| ADR-023-Erweiterung (Sunset auf Avatar-Flächen) | Docs (`docs/DEVELOPMENT_DECISIONS.md`, `docs/brand/quiks-ci-v1.md`) | Mobile Client (`AvatarSunsetRing`-Komponente, `packages/ui` Tokens) | Doku-Änderung + Umsetzung als eigene Komponente auf bestehenden Tokens |
| Logout-Umzug | Mobile Client (UI-Verschiebung) | API (unverändert — `authClient.signOut()` bleibt gleich) | Reine Verschiebung bestehender, bereits gehärteter Client-Logik; kein Backend-Vertrag ändert sich |

## Standard Stack

### Core
Keine neuen Kernbibliotheken. Diese Phase erweitert ausschließlich bereits installierte Pakete
(`@lingui/react`, `@lingui/core`, `react-native-mmkv`, `lucide-react-native`, `expo-router`,
`react-native-svg`, `@ts-rest/core`, `drizzle-zod`, `zod`) um neue Nutzungsmuster, keine neuen
Major-Dependencies.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@react-native-community/datetimepicker` | `9.1.0` (verifiziert per `npm view`, published 2026-06-16) `[ASSUMED]` Paketname — siehe Assumptions Log A1 | Nativer Datums-Picker für das neue Geburtsdatumsfeld in `complete-profile.tsx` (D-12a) | Einzige fehlende native Eingabe-Primitive für ein Datum unter ADR-022 (kein Fremd-UI-Kit) — dieses Paket ist KEIN UI-Kit, sondern ein dünner Wrapper um die native iOS/Android-Picker-Komponente, im selben Sinn wie das bereits installierte `expo-image-picker` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@react-native-community/datetimepicker` | Freitext-`TextInput` mit Format-Validierung (`YYYY-MM-DD`) | Kein neuer Dependency, aber schlechtere UX (Tippfehler, kein Kalender) und mehr eigener Validierungscode — UI-SPEC verlangt explizit „Date-Picker" (D-12a), nicht Freitext |
| `@react-native-community/datetimepicker` | Eigene RN-Primitive (3 `Picker`-Räder Tag/Monat/Jahr) | Passt zu ADR-022s „keine Fremd-UI-Kits", ist aber deutlich mehr Aufwand für ein Feld mit geringer Nutzungsfrequenz (einmalig bei Profilerstellung) — nicht gerechtfertigt |

**Installation:**
```bash
cd apps/mobile
npx expo install @react-native-community/datetimepicker
```
`expo install` (nicht `npm install`) ist hier korrekt, da das Paket ein natives Modul mit einer
von der Expo-SDK-Version abhängigen kompatiblen Version ist — ADR-024/05.1 lief bereits mit Expo
SDK 57 (`expo-*`-Pakete alle `~57.x`), `expo install` wählt automatisch die zu SDK 57 passende
`datetimepicker`-Version statt der npm-`latest` (9.1.0 ist die npm-`latest`, muss aber nicht
zwingend die SDK-57-kompatible Version sein — **zur Ausführungszeit mit `npx expo install` prüfen,
nicht die hier zitierte Registry-Version hart pinnen**).

**Version verification:** `npm view @react-native-community/datetimepicker version` → `9.1.0`
(`[VERIFIED: npm registry]`, Abruf in dieser Session). Kompatibilität mit Expo SDK 57 wurde NICHT
verifiziert (kein Expo-Kompatibilitätsindex in dieser Session abgefragt) — Executor muss `npx expo
install` nutzen, das die SDK-kompatible Version selbst auflöst.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@react-native-community/datetimepicker` | npm | Paket etabliert, letzte Version publiziert 2026-06-16 | 2.205.433/Woche | `github.com/react-native-datetimepicker/datetimepicker` | `[OK]` (via `package-legitimacy check`) | Approved — Paketname stammt aus Trainingswissen dieser Session (nicht aus einer offiziellen Doku-Abfrage), daher trotz `[OK]`-Verdict `[ASSUMED]` getaggt; Planner sollte einen `checkpoint:human-verify` vor der Installation einplanen |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none — das einzige neue Paket ist `[OK]`, aber mit
`[ASSUMED]`-Namensherkunft entsprechend der Package-Name-Provenance-Regel getaggt.

## Architecture Patterns

### System Architecture Diagram

```
Visitor tippt Tab „Friends“/„Mehr“ in FloatingNav (state.routes-basiert)
        │
        ▼
Expo Router `Tabs` (app/(tabs)/_layout.tsx) navigiert zu app/(tabs)/friends.tsx
        │                                          bzw. app/(tabs)/mehr.tsx
        ▼
friends.tsx: rendert 6 statische Blöcke, KEIN Netzwerk-Call (D-10, kein Festival-State)
        │
mehr.tsx:  liest useTheme()-Override-State (lib/theme-context.tsx) + useLingui()
        │  Tap auf „Profil“-Zeile → router.push('/profil')
        ▼
Expo Router löst /profil AUSSERHALB der (tabs)-Gruppe auf
  → Stack.Protected(authenticated)-Block in app/_layout.tsx MUSS `<Stack.Screen name="profil" />`
    explizit registrieren (kein impliziter Auto-Mount für unregistrierte Root-Dateien in diesem
    bereits vollständig deklarierten Stack — siehe Pattern 1)
        │
        ▼
app/profil.tsx: useQuery(['me']) → apiClient.getMe()
        │
        ▼
GET /api/v1/me (apps/api/src/me/me.controller.ts)
        │
        ▼
MeService.getProfile(accountId) liest visitor_profile
   + session.user.createdAt (better-auth Session, KEINE neue Query)
        │
        ▼
meSchema-validierte Response { accountId, email, profile: { username, displayName, avatar,
  pronoun?, birthDate?, gender? }, createdAt }
        │
        ▼
profil.tsx rendert Kopf (Sunset-Ring-Avatar, Name, Handle, Identitätszeile, Meta-Zeile) +
  KONTO-Sektion (Pattern B: live, tap→SoonToast) + gedämpfte Ausblick-Blöcke (Pattern A)
```

### Recommended Project Structure
```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx        # EDIT: Tabs.Screen für friends + mehr registrieren
│   │   ├── friends.tsx        # NEW
│   │   ├── mehr.tsx           # NEW
│   │   ├── home.tsx           # unverändert
│   │   └── festivals.tsx      # EDIT: LogOut-Header-Button entfernen (D-09)
│   ├── profil.tsx             # NEW — root-level, AUSSERHALB (tabs)
│   ├── (profile-setup)/
│   │   └── complete-profile.tsx  # EDIT: 3 neue optionale Felder (D-12)
│   └── _layout.tsx            # EDIT: Stack.Screen name="profil" im authenticated-Block,
│                               #       ToastProvider mounten
├── components/
│   ├── FloatingNav.tsx        # EDIT: DisabledNavItem-Paar → echte Tabs.Screen-Items
│   ├── ListRow.tsx            # NEW
│   ├── SettingsSwitch.tsx     # NEW
│   ├── SoonToast.tsx          # NEW (+ ToastProvider/useSoonToast)
│   └── AvatarSunsetRing.tsx   # NEW (oder Prop auf AvatarTile)
└── lib/
    ├── theme.ts                # EDIT: dritter Zustand (ThemeOverride)
    ├── theme-context.tsx       # EDIT: liest/schreibt den Override
    ├── theme-override-storage.ts  # NEW — MMKV, Pattern analog active-festival-storage.ts
    ├── profile-meta-line.ts    # NEW — pure Helfer für „{n} Festivals · {n} Friends · seit {Jahr}“
    ├── profile-age.ts          # NEW — pure Ableitung Alter aus birth_date
    └── __tests__/
        ├── theme.test.ts               # EXISTIERT — muss grün bleiben nach D-08a-Erweiterung
        ├── theme-override-storage.test.ts  # NEW (falls Logik über reines Pass-through hinausgeht)
        ├── profile-meta-line.test.ts   # NEW
        └── profile-age.test.ts         # NEW
```

### Pattern 1: Vierter Tab + Push-Screen — konkrete Registrierungspunkte (Focus Question 1)

**Status quo, verifiziert:**
- `apps/mobile/app/(tabs)/_layout.tsx:25-26` registriert HEUTE nur `<Tabs.Screen name="home" />`
  und `<Tabs.Screen name="festivals" options={{ headerShown: true, title: t\`Festivals\` }} />`.
- `apps/mobile/components/FloatingNav.tsx:28-37` definiert `type LiveRouteName = 'home' |
  'festivals'` und eine `LIVE_TAB_ICON`-Map nur für diese zwei; die beiden Friends/Profil-Items
  werden über eine separate `DisabledNavItem`-Komponente gerendert (Zeilen 129-144), die KEIN
  `state.routes`-Element ist, `disabled` gesetzt hat und `onPress={() => {}}` — sie kann per
  Konstruktion nicht navigieren, unabhängig vom `accessibilityState`-Flag.
- `apps/mobile/app/_layout.tsx:428-449` — der `Stack.Protected guard={authState.status ===
  'authenticated'}`-Block registriert EXPLIZIT genau zwei Screens: `<Stack.Screen name="(tabs)"
  />` und `<Stack.Screen name="(festival)" />`. Es gibt HIER keinen Catch-all/Auto-Discovery für
  weitere Root-Dateien — jeder zusätzliche Screen muss genauso explizit hinzugefügt werden wie
  `index`, `(auth)`, `(profile-setup)` es bereits sind.
- `apps/mobile/app/(festival)/_layout.tsx` ist ein reiner `<Stack />` außerhalb der `(tabs)`-Gruppe
  — genau das Muster, das UI-SPEC für `app/profil.tsx` als Präzedenzfall zitiert („mirrors the
  existing `(festival)/f/[festivalSlug]` precedent for a full-screen destination that hides the
  tab bar"). Der Mechanismus, WARUM das die `FloatingNav` versteckt: `FloatingNav` ist die
  `tabBar`-Render-Prop von `(tabs)/_layout.tsx`s `<Tabs>`-Navigator (`tabBar={(props) =>
  <FloatingNav {...props} />}`, Zeile 22) — sie existiert nur, solange eine Route INNERHALB von
  `(tabs)` aktiv/gemounted ist. Ein `router.push('/f/...')` bzw. künftig `router.push('/profil')`
  navigiert zu einem GESCHWISTER-Screen des `(tabs)`-Stack.Screen-Eintrags im Root-`<Stack>`, nicht
  zu einer Route innerhalb der `Tabs`-Instanz — die `Tabs`-Navigator-Instanz (und damit
  `FloatingNav`) verschwindet aus dem sichtbaren Navigationsbaum, OHNE dass irgendein Code die
  Sichtbarkeit explizit gate-n muss. Das ist bereits exakt das Verhalten, das `(festival)/f/
  [festivalSlug].tsx` heute hat (verifiziert: `festivals.tsx:258` navigiert per
  `router.push(\`/f/${festival.slug}\`)`, und dieser Screen zeigt sichtbar keine `FloatingNav`).

**Was der Planner konkret bauen muss:**
1. `(tabs)/_layout.tsx`: zwei neue `<Tabs.Screen name="friends" options={{ headerShown: true,
   title: t\`Friends\` }} />` und `<Tabs.Screen name="mehr" options={{ headerShown: true, title:
   t\`Mehr\` }} />` Einträge (UI-SPEC hat Header/Titel bereits fixiert, matching
   `festivals.tsx`-Präzedenz).
2. `components/FloatingNav.tsx`: `LiveRouteName` auf `'home' | 'festivals' | 'friends' | 'mehr'`
   erweitern, `LIVE_TAB_ICON` um `friends: Users, mehr: <gewähltes Icon, NICHT UserRound wenn
   Profil dasselbe Icon nutzt>` ergänzen, `isLiveRouteName` entsprechend erweitern, BEIDE
   `DisabledNavItem`-Aufrufe (Zeilen 129-144) entfernen — die vier Tabs rendern dann alle über
   denselben `state.routes.map(...)`-Zweig (Zeilen 97-127), der bereits alles Nötige tut (aktive
   Pille, Label, accessibilityLabel via `t`). Kein neuer visueller Zweig nötig.
3. `app/profil.tsx` NEU anlegen, UND `app/_layout.tsx`s authentifizierten `Stack.Protected`-Block
   um `<Stack.Screen name="profil" options={{ headerShown: true, title: t\`Profil\` }} />`
   ergänzen — **dieser Schritt fehlt in der UI-SPEC-Formulierung „lives OUTSIDE (tabs) at root
   level“ und muss vom Planner als eigener Task/Schritt geführt werden**, sonst bleibt die Datei
   ein für Expo Router unerreichbarer toter Screen (der Root-Stack listet seine Kinder in diesem
   Projekt konsequent explizit, siehe oben).
4. `mehr.tsx`s „Profil“-`ListRow` navigiert per `router.push('/profil')` (kein Parameter nötig, die
   Route hat keine Segmente).

### Pattern 2: Persistierter Theme-Override (Focus Question 2)

**Status quo, verifiziert:**
- `apps/mobile/lib/theme.ts:68-70`: `resolveThemeMode(scheme: DeviceColorScheme): ThemeMode` gibt
  `'dark'` NUR für den exakten Wert `'dark'` zurück, sonst `'light'` — das ist die 05.1-Invariante,
  gate-gehalten durch `lib/__tests__/theme.test.ts:38-64` (`describe('resolveThemeMode (hell-first
  default, D-01)'`).
- `apps/mobile/lib/theme-context.tsx:20-25`: `ThemeProvider` ruft `useColorScheme()` (RN) und
  `resolveTheme(scheme)` in einem `useMemo`, ohne jede Persistenz.
- `apps/mobile/lib/active-festival-storage.ts` ist das exakte Vorbild für den Persistenzweg: lazy
  `require('react-native-mmkv')` NUR innerhalb der Storage-Zugriffsfunktion (nie als
  Top-Level-Import, damit das Modul unter dem node-env-Vitest-Runner importierbar bleibt, Zeilen
  9-11, 28-34), eigene `MMKV`-Storage-`id`, Error-Swallowing in jeder exportierten Funktion
  (Zeilen 41-66), plus eine PURE, storage-freie Entscheidungsfunktion
  (`nextActiveFestivalSlug`, Zeilen 87-92) getrennt von der I/O-Funktion
  (`syncActiveFestivalOnEnter`, Zeilen 110-118) — genau dieser Split macht die reine Logik
  node-env-testbar.

**Konkreter Bauplan (UI-SPEC § Theme Override Contract bereits fixiert, hier die Umsetzung
gegen den echten Code):**
1. NEU `lib/theme-override-storage.ts`: `ThemeOverride = 'system' | 'light' | 'dark'`, eigene MMKV
   `id` (z. B. `quiks-theme-override`), `getThemeOverride(): ThemeOverride` (Default `'system'`
   bei fehlendem/kaputtem Read), `saveThemeOverride(v: ThemeOverride): void` — identisches
   Error-Swallowing-Muster wie `active-festival-storage.ts`.
2. `lib/theme.ts` erweitern um eine PURE Funktion `resolveEffectiveThemeMode(override:
   ThemeOverride, scheme: DeviceColorScheme): ThemeMode`, die exakt die in der UI-SPEC fixierte
   Logik implementiert: `override === 'dark' ? 'dark' : override === 'light' ? 'light' :
   resolveThemeMode(scheme)`. **Wichtig:** `resolveThemeMode` bleibt UNVERÄNDERT und wird nur
   INTERN von der neuen Funktion aufgerufen — der bestehende Test in `theme.test.ts`, der
   `resolveThemeMode` direkt prüft, bleibt dadurch unverändert grün, ohne dass der Planner ihn
   anfassen muss. Eine neue Testdatei (oder ein neuer `describe`-Block in `theme.test.ts`) deckt
   `resolveEffectiveThemeMode` zusätzlich ab.
3. `lib/theme-context.tsx`: `ThemeProvider` liest beim Mount `getThemeOverride()` (synchron,
   MMKV ist synchron) und hält ihn in `useState`; `useMemo` für `resolveTheme` wird durch
   `resolveEffectiveThemeMode(override, scheme)` + `resolveThemeColors(...)` ersetzt. `useTheme()`
   muss zusätzlich eine `setOverride`-Funktion exponieren (oder ein zweiter Hook
   `useThemeOverride()`), die `saveThemeOverride()` aufruft UND den lokalen State aktualisiert, so
   dass der Mehr-Screen-Switch sofort re-rendert, ohne auf einen App-Neustart zu warten.
4. `SettingsSwitch` in Mehr → Darstellung zeigt den EFFEKTIVEN Modus (checked = dunkel, egal ob
   durch expliziten Override oder System), schreibt aber beim Toggle immer einen EXPLIZITEN Wert
   (`'dark'` oder `'system'`, nie `'light'`) — exakt wie UI-SPEC § Theme Override Contract
   spezifiziert.

### Pattern 3: Additive Contract + Schema-Erweiterung (Focus Question 3)

**Aktuelle Shapes, verbatim verifiziert:**

`packages/db/src/schema/visitor-profile.ts:29-43` (`visitorProfile`-Tabelle):
```ts
export const visitorProfile = pgTable(
  'visitor_profile',
  {
    accountId: text().primaryKey().references(() => user.id, { onDelete: 'cascade' }),
    username: text().notNull(),
    displayName: text().notNull(),
    avatar: text(),
    socials: jsonb().notNull().default([]),
    socialsVisibility: socialsVisibilityEnum().notNull().default('friends'),
    ...timestamps,
  },
  (t) => [uniqueIndex('visitor_profile_username_lower_unq').on(lower(t.username))],
);
```
`packages/db/src/schema/festival.ts:24-25` zeigt das EXAKTE Muster für eine nullable Date-Spalte
(D-12a braucht identisch dasselbe für `birth_date`):
```ts
startDate: date({ mode: 'string' }),
endDate: date({ mode: 'string' }),
```
…und die zugehörige `.extend()`-Override-Pflicht (`festival.ts:49-64`, Kommentar zitiert
wörtlich): „`startDate`/`endDate` ALSO need an override: verified against the generated `.d.ts`
that `date({ mode: 'string' })` infers as `z.ZodType<Buffer, ZodTypeDef, Buffer>` with an
`unknown` input type here (a separate drizzle-zod inference gap, not the text()-enum bug
above)". D. h. jede neue `date({mode:'string'})`-Spalte braucht BEIDE `.extend()`-Overrides
(Select: `z.string().nullable()`, Insert: `z.string().nullable().optional()`) — dasselbe Muster,
das `visitor-profile.ts:64-87` bereits für seine `text()`-Spalten anwendet.

`packages/contracts/src/schemas.ts:51-57` (aktuelle öffentliche Profil-Shape):
```ts
export const visitorProfilePublicSchema = visitorProfileSelectSchema.pick({
  accountId: true,
  username: true,
  displayName: true,
  avatar: true,
});
```
`packages/contracts/src/schemas.ts:67-72` (`GET /me`-Response):
```ts
export const meSchema = z.object({
  accountId: z.string(),
  email: z.string().email(),
  profile: visitorProfilePublicSchema.nullable(),
});
```
`packages/contracts/src/schemas.ts:79-84` (`completeProfile`-Request-Body):
```ts
export const completeProfileBodySchema = visitorProfileInsertSchema.pick({
  username: true,
  displayName: true,
  avatar: true,
});
```

**Konkreter Bauplan:**
1. `visitor-profile.ts`: drei neue nullable Spalten `pronoun: text()`, `birthDate: date({ mode:
   'string' })`, `gender: text()`. Alle drei bekommen `.extend()`-Overrides auf
   `visitorProfileSelectSchema`/`visitorProfileInsertSchema` (Select: `z.string().nullable()`,
   Insert: `z.string().nullable().optional()`), exakt nach dem oben zitierten Muster.
2. `schemas.ts`: `visitorProfilePublicSchema.pick({...})` um `pronoun: true, birthDate: true,
   gender: true` erweitern; `completeProfileBodySchema.pick({...})` ebenso (die drei Felder sind
   optional in der Tabelle, also automatisch optional im `.pick()`-Ergebnis, solange die
   `.extend()`-Overrides `.nullable().optional()` tragen).
3. `meSchema` um `createdAt: z.string()` erweitern (NICHT `z.date()` — siehe Pitfall unten). Die
   `visitorProfilePublicSchema`-Erweiterung deckt NICHT `createdAt` ab, weil `createdAt` von
   `Account`/`user` kommt, nicht von `visitor_profile` — es ist ein eigenes Top-Level-Feld auf
   `meSchema`, analog zu `accountId`/`email`.
4. `apps/api/src/me/me.controller.ts:14-23` (`getMe`): `session.user.createdAt` steht bereits über
   `UserSession` (`@thallesp/nestjs-better-auth`) zur Verfügung — die `user`-Tabelle
   (`packages/db/src/schema/auth.ts:29`) hat `createdAt: timestamp("created_at").defaultNow()
   .notNull()`, better-auths Session-Objekt spiegelt die volle `user`-Row. Der Controller muss den
   Response-Body um `createdAt: session.user.createdAt.toISOString()` ergänzen — KEINE neue
   DB-Query, aber explizite String-Serialisierung (siehe Pitfall).
5. `apps/api/src/me/me.service.ts:16-28` (`getProfile`): `.select({...})` um `pronoun:
   visitorProfile.pronoun, birthDate: visitorProfile.birthDate, gender: visitorProfile.gender`
   erweitern (analog dem bestehenden 4-Feld-Select).
6. `apps/api/src/me/me.service.ts:37-51` (`completeProfile`): der `.insert(visitorProfile).values({
   accountId, ...input })`-Aufruf braucht KEINE Code-Änderung — `input` ist bereits
   `CompleteProfileBody`, und sobald der Contract-Typ die drei neuen optionalen Felder trägt,
   fließen sie automatisch durch, solange `.returning({...})` ebenfalls die drei neuen Spalten
   aufnimmt.

**Migrationsweg (verifiziert `packages/db/package.json:26-28`, `drizzle.config.ts`,
`docker-compose.yml`):** Dev-DB ist lokales Docker-Postgres (`docker compose up -d`, Container
`quiks`, Port 5432, User/DB `quiks`/`quiks`), NICHT Neon — `drizzle.config.ts` liest
`DATABASE_URL_UNPOOLED ?? DATABASE_URL` aus der Umgebung, die für lokale Entwicklung auf
`localhost:5432` zeigt (`apps/api/.env` + `packages/db/.env`, beide Dateien gitignored). Korrekter
Workflow für additive Schema-Änderungen: `pnpm --filter @quiks/db db:generate` (erzeugt eine neue
SQL-Migrationsdatei unter `packages/db/drizzle/`, aktuell existieren `0000`–`0003`) gefolgt von
`pnpm --filter @quiks/db db:migrate` (wendet sie auf die laufende lokale Docker-Instanz an). **NICHT
`db:push` verwenden** — das Projekt nutzt durchgängig den generate+migrate-Workflow (vier
committete Migrationsdateien belegen das), `db:push` würde Drift zwischen Migrationshistorie und
Live-Schema erzeugen.

### Pattern 4: Geburtsdatum-Eingabe in `complete-profile.tsx` (Focus Question 4)

`complete-profile.tsx` (voll gelesen, 361 Zeilen) hat aktuell zwei Felder (`username`,
`displayName`) plus einen Avatar-Block, alle innerhalb eines `<KeyboardScreen>`
(`components/KeyboardScreen.tsx` — ScrollView mit Keyboard-Height-Padding, kein natives
`KeyboardAvoidingView`, siehe dessen Kommentar zu Expo-SDK-54-Edge-to-Edge). UI-SPEC hat den
Umfang bereits fixiert (Freitext für Pronomen/Geschlecht, `keyboardType="number-pad"` für Alter —
ABER D-12a überschreibt „Alter" durch „Geburtsdatum via Date-Picker"; die UI-SPEC-Tabelle „Age |
numeric TextInput" ist durch D-12a's spätere plan-phase-Entscheidung überholt und muss vom Planner
korrigiert werden).

**Konkreter Bauplan:**
1. Drittes Feld nach `displayName`, vor dem Submit-CTA: ein Pressable, der
   `DateTimePickerAndroid.open(...)` (Android, imperative API) bzw. ein eingebettetes
   `<DateTimePicker mode="date" display="spinner"/inline" .../>` (iOS, deklarativ) öffnet — die
   beiden Plattformen unterscheiden sich in der API-Form, das ist dokumentiertes
   `@react-native-community/datetimepicker`-Verhalten (`[ASSUMED]`, nicht in dieser Session gegen
   die offizielle Doku verifiziert, siehe Assumptions Log A2).
2. Serialisierung: Der Picker liefert ein natives `Date`-Objekt; für den Contract MUSS es vor dem
   Request in `YYYY-MM-DD` konvertiert werden (`date.toISOString().slice(0, 10)` ist eine gängige,
   aber timezone-naive Kurzform — sauberer: lokale Jahr/Monat/Tag-Komponenten manuell
   zusammensetzen, da `toISOString()` in UTC konvertiert und bei Zeitzonen westlich von UTC den
   Tag verschieben kann). Das Zielfeld ist `birthDate: string | null` (Contract), passend zum
   `date({mode:'string'})`-DB-Spaltentyp (Pattern 3).
3. Validierung: server-seitig reicht `z.string().nullable().optional()` (kein Format-Constraint im
   Schema nötig, da `date({mode:'string'})` bereits beim INSERT durch Postgres selbst als `date`
   geparst/validiert wird — ein ungültiges Format wirft einen DB-Fehler). Client-seitig entfällt
   das Format-Validierungsproblem komplett, weil der native Picker gar keine Freitext-Eingabe
   erlaubt, die ein falsches Format produzieren könnte — das ist ein zusätzlicher Vorteil des
   Date-Pickers gegenüber dem in der UI-SPEC noch vorgesehenen `TextInput`.

### Pattern 5: „Kommt bald"-Toast (Focus Question 5)

`ComingSoonTile` (`components/ComingSoonTile.tsx`, voll gelesen) ist NICHT wiederverwendbar für
D-13 — es ist ein statisches, nicht-interaktives `View` (Kachel-Form, kein Auto-Dismiss, kein
Slot-System), kein Toast/Snackbar. Es bleibt als Vorbild für Pattern-A-Dämpfung (Opacity 0.45 +
Badge) bestehen, ist aber ein anderer Baustein als der neue `SoonToast`.

Kein bestehender Toast-/Snackbar-Mechanismus existiert im Repo (verifiziert: keine `Toast`-,
`Snackbar`- oder `Alert`-Wrapper-Komponente in `apps/mobile/components/` außer der nativen
`Alert.alert`-Nutzung, die für D-09 Logout genutzt wird, nicht für D-13). UI-SPEC hat den
Component-Contract bereits fixiert (`ToastProvider` in `app/_layout.tsx`, `useSoonToast()`-Hook,
Single-Slot, Position `bottom: layout.navHeight + layout.navInset + insets.bottom +
spacingScale['sp-4']` — alle vier Tokens existieren bereits in `packages/ui/src/tokens.ts:61-71`:
`navHeight: 64, navInset: 14, hitMin: 44`). Accessibility: `accessibilityLiveRegion="polite"`
(RN-Standard für sich selbst ändernde/erscheinende Hinweistexte) ist NICHT in UI-SPEC erwähnt,
sollte aber vom Planner ergänzt werden, da ein reiner visueller Toast ohne Live-Region für
Screenreader-Nutzer unsichtbar bleibt — dies ist eine `[ASSUMED]`-Empfehlung aus allgemeinem
RN-Accessibility-Wissen, nicht aus einer projektinternen Quelle.

### Pattern 6: Meta-Zeile mit Lingui `plural`-Makro

Die Meta-Zeile („{n} Festivals · {n} Friends · seit {Jahr} dabei") braucht Pluralisierung für
„Friends" (0 ist eine echte Plural-Kategorie). Im Repo wird bisher AUSSCHLIESSLICH `t`/`Trans` aus
`@lingui/react/macro` verwendet (verifiziert: kein `plural(...)`-Aufruf existiert irgendwo in
`apps/mobile`). Laut Lingui-Dokumentation (`[CITED: lingui.dev/ref/macro]`, per WebSearch dieser
Session, NICHT durch Context7 verifiziert — kein Context7-MCP-Tool in dieser Session verfügbar)
liegt das `plural`-Makro für Nicht-JSX-Kontexte in Lingui v5+/v6 unter `@lingui/core/macro`
(getrennt von den JSX-Komponenten-Makros in `@lingui/react/macro`), Syntax:
```ts
import { plural } from '@lingui/core/macro';
plural(count, { one: '# Festival', other: '# Festivals' })
```
Das `#`-Platzhalter-Token wird durch den Zahlenwert ersetzt. Da `apps/mobile/package.json`
`@lingui/core@^6.6.0` bereits als Dependency führt, ist das Makro grundsätzlich verfügbar — der
Planner sollte dies dennoch am realen Build verifizieren (Babel-Makro-Plugin ist bereits über
`lingui.config.ts` + `@lingui/babel-plugin-lingui-macro` konfiguriert, siehe `apps/mobile/
lingui.config.ts`), bevor er es als gesicherten Baustein in eine Aufgabe schreibt.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Geburtsdatum-Eingabe | Eigenes 3-Rad-Picker (Tag/Monat/Jahr) auf RN-Primitiven | `@react-native-community/datetimepicker` | Native Plattform-Picker, korrekte Locale-Formatierung, Barrierefreiheit „for free"; ADR-022 zielt auf UI-KITS (Komponenten-Bibliotheken mit eigenem Design-System), nicht auf dünne native-API-Wrapper wie dieses Paket oder das bereits genutzte `expo-image-picker` |
| Theme-Mode-Auflösung | Eine zweite, parallele Auflösungsfunktion neben `resolveThemeMode` | `resolveEffectiveThemeMode` als dünner Wrapper UM `resolveThemeMode` (Pattern 2) | Verhindert, dass zwei Quellen der Wahrheit für „was ist der aktuelle Modus" existieren und die 05.1-Invariante an zwei Stellen gepflegt werden muss |
| Contract-Shapes für Profil-Felder | Handgeschriebene `z.object({...})`-Duplikate | `.extend()` auf der drizzle-zod-Basis (Pattern 3) | Genau der Pitfall, den `visitor-profile.ts`s eigener Kommentarblock (Zeilen 45-63) bereits ausführlich dokumentiert — eine Umgehung würde Drift zwischen DB-Spalte und Contract-Typ unsichtbar machen |
| Alters-Berechnung | Inline in der Profil-Screen-Komponente | Pure Funktion in `lib/profile-age.ts`, node-env-Vitest-getestet | Der `apps/mobile`-Vitest-Runner deckt NUR `lib/**/__tests__/**` ab (`vitest.config.ts:15`) — Logik in Screen-Code ist für diesen Runner unsichtbar und bleibt ungetestet |

**Key insight:** Jedes der drei größeren „neuen" Probleme dieser Phase (Datum-Eingabe,
Theme-Persistenz, Schema-Erweiterung) hat bereits ein wörtliches Vorbild im Repo — die Aufgabe ist
strukturelles Kopieren etablierter Muster, nicht Neuerfindung.

## Common Pitfalls

### Pitfall 1: `app/profil.tsx` bleibt unerreichbar ohne explizite Stack.Screen-Registrierung
**What goes wrong:** Der Screen existiert als Datei, aber `router.push('/profil')` landet auf
Expo Routers Unmatched-Route-Screen (dasselbe Fehlerbild wie die bereits gelöste
`first-login-unmatched-route`-Historie in diesem Projekt).
**Why it happens:** `app/_layout.tsx`s authentifizierter `Stack.Protected`-Block listet seine
Kinder-Screens vollständig explizit (`index`, `(auth)`, `(profile-setup)`, `(tabs)`, `(festival)`)
— es gibt in DIESEM Stack keinen impliziten „jede Datei wird automatisch gemountet"-Fallback
für unregistrierte Geschwister.
**How to avoid:** `<Stack.Screen name="profil" .../>` explizit im selben `Stack.Protected`-Block
ergänzen (siehe Pattern 1, Schritt 3).
**Warning signs:** Tap auf „Profil" in Mehr navigiert visuell (URL ändert sich), aber der Screen
zeigt Expo Routers Standard-„Unmatched Route"-UI statt `profil.tsx`s Inhalt.

### Pitfall 2: `Account.createdAt` als `z.date()` statt `z.string()` modelliert
**What goes wrong:** better-auths `session.user.createdAt` ist zur Laufzeit ein JS-`Date`-Objekt;
über HTTP/JSON gibt es aber keinen `Date`-Typ — ein `Date` wird bei `JSON.stringify` automatisch
zu einem ISO-String. Modelliert man `meSchema.createdAt` als `z.date()`, lügt der TypeScript-Typ
(„Date") über die tatsächliche Laufzeit-Form nach der Netzwerk-Übertragung.
**Why it happens:** Naives 1:1-Übernehmen des DB-Spaltentyps (`timestamp`) in den Contract, ohne
den Serialisierungs-Bruch an der HTTP-Grenze zu bedenken.
**How to avoid:** `meSchema.createdAt: z.string()` (ISO-String), Controller ruft explizit
`session.user.createdAt.toISOString()` auf, bevor der Response-Body zusammengesetzt wird — folgt
demselben Muster, das `festivalSchema` bereits für `startDate`/`endDate` etabliert (dort
`z.string().nullable()`, niemals `z.date()`).
**Warning signs:** TypeScript kompiliert anstandslos, aber `new Date(response.body.createdAt)`
auf Client-Seite erhält an sich schon eine ISO-Zeichenkette — der Bug zeigt sich erst, wenn
jemand versucht, `.getFullYear()` o. Ä. DIREKT auf dem (fälschlich als `Date` typisierten)
Response-Feld aufzurufen, ohne selbst zu parsen.

### Pitfall 3: Theme-Override kippt die 05.1-Hell-first-Invariante
**What goes wrong:** Ein neuer, dritter Auflösungspfad ersetzt `resolveThemeMode` statt ihn zu
umschließen, und verliert dabei die Garantie „nur der exakte Wert `'dark'` ergibt Nacht".
**Why it happens:** Der neue Override-Zustand (`'system' | 'light' | 'dark'`) sieht auf den
ersten Blick wie ein Ersatz für die zweiwertige `ThemeMode` aus, ist aber eine ZUSÄTZLICHE Schicht
darüber.
**How to avoid:** `resolveEffectiveThemeMode` ruft `resolveThemeMode` intern auf und verändert
dessen Verhalten NICHT (siehe Pattern 2, Schritt 2). Der bestehende Test-Block
`describe('resolveThemeMode (hell-first default, D-01)')` in `lib/__tests__/theme.test.ts:38-64`
bleibt unverändert grün — läuft er nach der Änderung rot, wurde die Invariante verletzt.
**Warning signs:** `lib/__tests__/theme.test.ts` schlägt fehl, oder ein Gerät mit
Systemeinstellung „hell" + Override `'system'` zeigt unerwartet dunkle Farben.

### Pitfall 4: `no-literal-string`-Lint übersieht `accessibilityLabel` NICHT — aber der Entwickler tut es
**What goes wrong:** Ein neuer `Pressable`/`ListRow`/`SettingsSwitch` bekommt ein hartcodiertes
`accessibilityLabel="Profil"`, das der Lint-Rule NICHT auffällt (der Wert ist explizit in der
`jsx-attributes.exclude`-Liste, `apps/mobile/eslint.config.mjs:42-54`), aber dennoug niemals ins
Lingui-Katalog gelangt und damit für DE/EN-Nutzer inkonsistent bleibt.
**Why it happens:** Die Exclude-Liste existiert bewusst, weil `accessibilityLabel` oft ein
JSX-Ausdruck (`{t\`...\`}`) statt eines JSX-Text-Kindes ist und die Regel im Modus
`jsx-text-only` läuft — das ist eine Lücke im automatisierten Gate, kein Bug in der Regel.
**How to avoid:** Jedes `accessibilityLabel` explizit über `t\`...\`` führen — `FloatingNav.tsx`
tut dies bereits vorbildlich (`const comingSoonSuffix = t\`coming soon\`` und
`accessibilityLabel={label}` mit `label` aus `t\`Home\`` etc., Zeilen 60-71, 101, 109). Dieses
Muster für JEDE neue interaktive Komponente in Phase 6 wiederholen — verifizierbar nur durch
Code-Review, nicht durch den Linter.
**Warning signs:** Ein Screenreader liest in beiden Sprachen denselben (englischen oder
deutschen) Text vor, unabhängig von der App-Sprache.

### Pitfall 5: Lingui-Katalog-Kollision zwischen parallelen Plänen
**What goes wrong:** Zwei gleichzeitig laufende Pläne (z. B. Friends-Screen und Mehr-Screen)
schreiben beide in `apps/mobile/locales/{de,en}/messages.po` und erzeugen einen Merge-Konflikt
oder — schlimmer — einer überschreibt stillschweigend die Übersetzungen des anderen beim
`extract`-Lauf.
**Why it happens:** Die `.po`-Dateien sind geteilter, nicht partitionierbarer Zustand — das ist
bereits als etabliertes Muster aus Phase 4/5 bekannt (`06-CONTEXT.md` §Canonical References
zitiert dies explizit als Serialisierungspflicht).
**How to avoid:** Pläne, die Copy anfassen (Friends, Mehr, Profil, complete-profile,
SoonToast/ListRow/SettingsSwitch), serialisieren statt parallelisieren — oder ein einziger Plan
sammelt alle neuen Strings in einem Wave-Schritt.
**Warning signs:** `git status` zeigt einen Merge-Konflikt in `messages.po`, oder eine zuvor
übersetzte Zeile erscheint nach einem zweiten `lingui extract`-Lauf wieder als `msgstr ""`.

### Pitfall 6: ADR-023-Erweiterung ohne Anpassung der Gradient-Guard-Tests
**What goes wrong:** D-07 erweitert die Sunset-Regel textlich in zwei Dokumenten, aber der neue
`AvatarSunsetRing`-Baustein wird nie gegen einen automatisierten Test geprüft, der die Erweiterung
tatsächlich absichert.
**Why it happens:** Der einzige bestehende Gradient-bezogene Test
(`lib/__tests__/theme.test.ts:146-159`, `describe('defines Sunset as exactly two stops...')`)
prüft die TOKEN-DEFINITION (`colors.gradientSunset`), nicht WO im UI sie verwendet werden darf —
es gibt aktuell keinen „nur Marke + Hero"-Enforcement-Test, den man brechen könnte, aber auch
keinen neuen Test, der die jetzt erlaubte dritte Verwendungsstelle (Avatar) verifiziert.
**How to avoid:** Kein bestehender Test muss geändert werden (verifiziert — der Token-Test prüft
nur Werte, keine Verwendungsorte), ABER der Planner sollte dokumentieren, dass D-07 KEINEN
automatisierten Blocker hat und die Doku-Änderung (ADR-023 + `quiks-ci-v1.md`) als eigener,
expliziter Task geführt werden muss, damit sie nicht implizit „nebenbei" beim Komponenten-Bau
vergessen wird.
**Warning signs:** `AvatarSunsetRing` wird gebaut, aber `docs/DEVELOPMENT_DECISIONS.md`/`docs/
brand/quiks-ci-v1.md` bleiben unverändert — ein späterer Reviewer findet eine Diskrepanz zwischen
Code und Doku.

### Pitfall 7: `db:push` statt `db:generate`+`db:migrate` für die additive Schema-Änderung
**What goes wrong:** Ein Entwickler nutzt `pnpm --filter @quiks/db db:push` für die schnelle
lokale Iteration und vergisst, eine echte Migrationsdatei zu erzeugen — das Schema in der
Datenbank läuft der Migrationshistorie unter `packages/db/drizzle/` davon.
**Why it happens:** `db:push` ist bequemer für schnelle lokale Experimente und im
`package.json` als gleichwertige Option gelistet.
**How to avoid:** `db:generate` (erzeugt SQL unter `packages/db/drizzle/000X_*.sql`) gefolgt von
`db:migrate` (wendet sie an) — das Projekt hat bereits vier committete Migrationsdateien, dieses
Muster fortsetzen.
**Warning signs:** `packages/db/drizzle/` enthält keine neue Datei, obwohl das Schema geändert
wurde; ein `db:generate`-Lauf auf einer frischen Checkout-Kopie erzeugt unerwartet eine
Migrationsdatei, weil die lokale DB bereits (unmigriert) den neuen Stand hatte.

## Code Examples

### `resolveEffectiveThemeMode` (Pattern 2, Skizze — Executor verifiziert exakte Signatur gegen `theme.ts`)
```ts
// Source: eigenes Muster, abgeleitet aus apps/mobile/lib/theme.ts:68-70 (resolveThemeMode)
export type ThemeOverride = 'system' | 'light' | 'dark';

export function resolveEffectiveThemeMode(
  override: ThemeOverride,
  scheme: DeviceColorScheme,
): ThemeMode {
  if (override === 'dark') return 'dark';
  if (override === 'light') return 'light';
  return resolveThemeMode(scheme); // unverändert — 05.1-Invariante bleibt intakt
}
```

### `birth_date`-Spalte (Pattern 3, exaktes Muster aus `packages/db/src/schema/festival.ts:24-25,53,61`)
```ts
// Source: packages/db/src/schema/visitor-profile.ts (Basis) + festival.ts (Date-Pattern)
export const visitorProfile = pgTable('visitor_profile', {
  // ...bestehende Spalten...
  pronoun: text(),
  birthDate: date({ mode: 'string' }),
  gender: text(),
  // ...
});

export const visitorProfileSelectSchema = createSelectSchema(visitorProfile).extend({
  // ...bestehende Overrides...
  pronoun: z.string().nullable(),
  birthDate: z.string().nullable(),
  gender: z.string().nullable(),
});
export const visitorProfileInsertSchema = createInsertSchema(visitorProfile).extend({
  // ...bestehende Overrides...
  pronoun: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
});
```

### `Stack.Screen`-Registrierung für `profil.tsx` (Pattern 1, Schritt 3)
```tsx
// Source: apps/mobile/app/_layout.tsx:445-448 (bestehender Block, EDIT)
<Stack.Protected guard={authState.status === 'authenticated'}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="(festival)" />
  <Stack.Screen name="profil" options={{ headerShown: true, title: t`Profil` }} />
</Stack.Protected>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `FloatingNav` rendert Friends/Profil als dekorative `DisabledNavItem`s ohne Backing-Route | Beide werden echte `Tabs.Screen`/`Stack.Screen`-Routen | Phase 6 (diese Phase) | `LiveRouteName`-Union und `LIVE_TAB_ICON`-Map müssen erweitert, der Disabled-Zweig entfernt werden |
| Theme folgt AUSSCHLIESSLICH dem Geräteschema (05.1) | Theme folgt einem persistierten User-Override, der das Geräteschema nur im `'system'`-Fall konsultiert | Phase 6 (diese Phase) | Neue Persistenzschicht, aber die 05.1-Kern-Auflösungsfunktion bleibt unverändert (Pattern 2) |
| Logout-Button sitzt im Festivals-Header | Logout sitzt als rote `ListRow` in Mehr → App, mit `Alert.alert`-Rückfrage | Phase 6 (diese Phase, D-09) | Bestehende `handleLogout`-Logik wandert unverändert, nur der Aufrufort ändert sich |

**Deprecated/outdated:**
- `docs/concept/designs/festival/` (älteres Design-Set) ist für Screen-Aufbau/Navigation abgelöst
  durch `docs/concept/designs/quiks-v2/` — bleibt nur noch als Token-/Komponentenreferenz
  (`festipal-ds.js`) gültig.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Paketname `@react-native-community/datetimepicker` ist das korrekte, offizielle Paket für einen nativen Datums-Picker in Expo/RN | Standard Stack, Pattern 4 | Falscher/gesloppter Paketname würde beim `npx expo install` fehlschlagen — package-legitimacy-Check ergab `[OK]` (2,2 Mio Downloads/Woche, offizielles GitHub-Repo `react-native-datetimepicker/datetimepicker`), aber die Namensherkunft ist Trainingswissen, nicht eine offizielle Doku-Quelle dieser Session — Executor sollte vor Einsatz `npx expo install @react-native-community/datetimepicker` gegen die installierte Expo-SDK-Version laufen lassen |
| A2 | `@react-native-community/datetimepicker` bietet auf Android eine imperative API (`DateTimePickerAndroid.open`) und auf iOS eine deklarative Komponenten-API mit unterschiedlichem Verhalten je Plattform | Pattern 4 | Wenn die API-Form abweicht, muss der Executor die offizielle Doku des Pakets (README auf GitHub) vor der Implementierung konsultieren — kein Context7-MCP-Tool war in dieser Session verfügbar, um dies zu verifizieren |
| A3 | Lingui `plural`-Makro liegt in v6 unter `@lingui/core/macro` (getrennt von `@lingui/react/macro`) | Pattern 6 | Falscher Import-Pfad bricht den Babel-Makro-Transform beim Build; per WebSearch (`[CITED: lingui.dev/ref/macro]`) recherchiert, nicht am realen Projekt-Build verifiziert |
| A4 | `session.user.createdAt` (better-auth `UserSession`) ist zur Laufzeit ein voll besetztes Feld, das die `user`-Tabellen-Spalte `createdAt` widerspiegelt, ohne eine zusätzliche DB-Query zu benötigen | Pattern 3 | Falls `UserSession` dieses Feld tatsächlich nicht mitführt (z. B. weil better-auth es aus dem Session-Payload trimmt), bräuchte `getMe` doch eine zusätzliche `db.select` auf die `user`-Tabelle — die `.d.ts`-Typdefinition von `@thallesp/nestjs-better-auth` legt es nahe (`UserSession` basiert auf better-auths eigenem `getSession()`-Rückgabetyp, der die volle `user`-Row spiegelt), wurde aber nicht am laufenden Dev-Server verifiziert |
| A5 | Für `SoonToast` sollte `accessibilityLiveRegion="polite"` gesetzt werden, damit Screenreader den Hinweistext automatisch vorlesen | Pattern 5 | Allgemeines RN-Accessibility-Wissen, nicht aus einer projektinternen Quelle oder Doku-Abfrage dieser Session — UI-SPEC erwähnt es nicht; falls falsch/unnötig, ist der Schaden gering (zusätzliches, aber unschädliches Prop) |

**Wenn diese Tabelle leer wäre:** Ist hier nicht der Fall — fünf Annahmen erfordern Bestätigung
während Planning/Execution, primär rund um das neue externe Paket und die Lingui-Plural-API.

## Open Questions

1. **Gerätequellen-übergreifende Theme-Override-Synchronisation**
   - What we know: D-08a verlangt einen persistierten, geräte-lokalen Override (MMKV).
   - What's unclear: Ob der Override rein geräte-lokal bleiben soll (kein Server-Sync über
     mehrere Geräte desselben Accounts) — CONTEXT.md äußert sich dazu nicht explizit, impliziert
     aber „persistiert" nur im Sinne von „überlebt App-Neustart", nicht „Cross-Device".
   - Recommendation: Rein geräte-lokal behandeln (MMKV, kein Server-Feld) — das ist der
     günstigste, mit dem UI-SPEC-Contract konsistente Default und lässt sich später additiv um
     einen Server-Sync erweitern, ohne die Client-Logik umzubauen.

2. **Icon-Wahl für den „Mehr"-Tab vs. das Profil-Push-Screen-Icon**
   - What we know: UI-SPEC verlangt explizit unterschiedliche Icons für den Mehr-Tab und den
     Profil-Screen-Header, um Verwechslung zu vermeiden (`UserRound`/`Menu` zur Auswahl gestellt).
   - What's unclear: Ob der Profil-Screen selbst überhaupt ein sichtbares Icon im Header braucht
     (native `Stack.Screen`-Header zeigen typischerweise nur den Titel-Text, kein Icon) — die
     UI-SPEC-Formulierung „do not reuse the same icon for both" könnte sich allein auf FloatingNav
     vs. eine zukünftige visuelle Referenz im Profilkopf beziehen.
   - Recommendation: `Menu` für den Mehr-Tab wählen (klar von `UserRound`, das für den
     Profil-Avatar/-Kontext reserviert bleibt, unterscheidbar) — Executor soll dies gegen das
     gerenderte Icon-Set von `lucide-react-native` 0.470 final abgleichen.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Monorepo-Build/Tests | ✓ (≥22 per `.claude/CLAUDE.md`) | nicht in dieser Session geprüft | — |
| pnpm | Workspace-Manager | ✓ | 11.17.0 (laut `.claude/CLAUDE.md`) | — |
| Docker (lokales Postgres) | `packages/db` Migrationen gegen Dev-DB | ✓ (laut `docker-compose.yml`, Container `quiks`) | Postgres 18 Image | — |
| `@react-native-community/datetimepicker` | `complete-profile.tsx` Geburtsdatum-Eingabe (D-12a) | ✗ (noch nicht installiert) | `9.1.0` npm-`latest`, SDK-57-kompatible Version via `expo install` zu ermitteln | Freitext-`TextInput` mit `YYYY-MM-DD`-Format-Validierung (siehe Standard Stack § Alternatives Considered) |

**Missing dependencies with no fallback:** keine.

**Missing dependencies with fallback:**
- `@react-native-community/datetimepicker` — Fallback ist ein Freitext-Datumsfeld, falls das
  Paket aus irgendeinem Grund nicht installierbar ist (Registry-Ausfall, SDK-Inkompatibilität).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (`apps/mobile/vitest.config.ts`) — Node-Environment, KEIN `jest-expo`, deckt ausschließlich `lib/**/__tests__/**/*.test.ts` ab |
| Config file | `apps/mobile/vitest.config.ts` |
| Quick run command | `pnpm --filter @quiks/mobile test -- <pfad-zur-datei>` (einzelne Datei) |
| Full suite command | `pnpm --filter @quiks/mobile test` (entspricht `vitest run`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-03 | Vier Tabs sind über `FloatingNav` navigierbar | manual-only (Device-UAT — `FloatingNav` ist ein RN-Component-Render, node-env-Vitest rendert keine RN-Komponenten) | — | — |
| PROF-01 | `GET /me` liefert username/displayName/avatar/email view-only | unit (`apps/api` Vitest, bestehende Suite) | `pnpm --filter @quiks/api test -- me` | ✅ (bestehende `me`-Tests, um `createdAt`+3 Felder erweitern) |
| PROF-01 | Meta-Zeile berechnet „{n} Festivals · {n} Friends · seit {Jahr} dabei" korrekt (inkl. 0-Werte, fehlende Felder) | unit | `pnpm --filter @quiks/mobile test -- profile-meta-line` | ❌ Wave 0 — `lib/profile-meta-line.ts` + Test existieren noch nicht |
| PROF-01 (D-12a) | Alters-Ableitung aus `birthDate` (inkl. Geburtstag-noch-nicht-erreicht-dieses-Jahr, Schaltjahr-Edge-Case 29. Februar) | unit | `pnpm --filter @quiks/mobile test -- profile-age` | ❌ Wave 0 — `lib/profile-age.ts` + Test existieren noch nicht |
| FRND-01 | Friends-Screen zeigt sechs eigenständige, nicht-leere Leerzustände | manual-only (statischer JSX-Render, kein testbare pure Logik — Copy-Kontrolle per Code-Review + Device-UAT/UI-Review) | — | — |
| D-08a | `resolveEffectiveThemeMode` respektiert Override UND bewahrt die 05.1-Invariante | unit | `pnpm --filter @quiks/mobile test -- theme` | ✅ bestehende Datei erweitern (`lib/__tests__/theme.test.ts`) |
| D-04 | `Account.createdAt` wird als ISO-String, nicht als `Date`, im Contract transportiert | unit (Contract-/API-Typtest, z. B. `expectTypeOf` oder Response-Shape-Test) | `pnpm --filter @quiks/api test -- me` | ❌ Wave 0 — neuer Assertion-Case in der bestehenden `me`-Testdatei |

### Sampling Rate
- **Per task commit:** die jeweils betroffene Testdatei gezielt (`vitest run <pfad>`), nicht die
  volle Suite — Screens/Navigation selbst sind ohnehin nicht node-env-testbar (siehe unten).
- **Per wave merge:** `pnpm --filter @quiks/mobile test` + `pnpm --filter @quiks/api test` +
  `pnpm --filter @quiks/mobile typecheck` + `pnpm --filter @quiks/mobile lint`.
- **Phase gate:** volle Monorepo-Suite (`pnpm lint && pnpm typecheck && pnpm test`) grün, PLUS
  Device-UAT für die vier navigationsbezogenen und rein-visuellen Anteile (siehe unten) — analog
  zum in Phase 3/4/5/05.1 etablierten Muster ("RN-Routing/Native-Bugs IMMER am Gerät verifizieren").

### Wave 0 Gaps
- [ ] `lib/profile-meta-line.ts` + `lib/__tests__/profile-meta-line.test.ts` — deckt PROF-01
      Meta-Zeile
- [ ] `lib/profile-age.ts` + `lib/__tests__/profile-age.test.ts` — deckt D-12a Alters-Ableitung
- [ ] `lib/theme-override-storage.ts` (+ optionaler Test, falls Logik über reines Pass-through
      hinausgeht) — deckt D-08a Persistenz
- [ ] Erweiterung von `lib/__tests__/theme.test.ts` um `resolveEffectiveThemeMode` — deckt D-08a
      Auflösung
- [ ] Erweiterung der bestehenden `apps/api`-`me`-Testsuite um `createdAt`+3 neue Felder — deckt
      D-04/D-12

**Lehre aus dem Projektgedächtnis, hier bestätigt relevant:** Navigation (`FloatingNav`,
`Stack.Screen`-Registrierung, Tab-Wechsel) und rein-visuelle Zustände (Friends-Leerzustände,
Sunset-Ring, Dämpfung) sind für den node-env-Vitest-Runner strukturell unsichtbar — sie MÜSSEN
über Device-UAT verifiziert werden, nicht durch eine (nicht existente) RN-Component-Test-Suite.
Dieses Projekt hat KEIN `jest-expo`/`@testing-library/react-native`-Setup (`vitest.config.ts`
sagt das explizit: „does NOT render React Native components").

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (unverändert — `getMe`/`completeProfile` bleiben hinter dem globalen `AuthGuard`, keine neue Auth-Fläche) | — |
| V3 Session Management | no (Logout-UI zieht um, die zugrunde liegende `authClient.signOut()`/`forceUnauthenticated()`-Logik bleibt unverändert) | — |
| V4 Access Control | no (Friends ist global ohne Festival-Bezug, D-10 — kein neuer Tenant-Scoping-Bedarf; `GET /me`/`complete-profile` sind bereits session-scoped, keine Änderung an der Scoping-Logik) | — |
| V5 Input Validation | yes | Zod-Schemas in `packages/contracts` (bereits etabliertes Muster) — die drei neuen optionalen Freitextfelder (`pronoun`, `gender`) brauchen serverseitige Längenbegrenzung (analog `username`/`displayName`s `.max()`-Constraints in `visitor-profile.ts:70-76`), `birthDate` wird durch Postgres' `date`-Typ selbst validiert |
| V6 Cryptography | no | Keine neue kryptographische Fläche in dieser Phase |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Übermäßig lange Freitexteingabe (`pronoun`/`gender`) als DoS-/Storage-Abuse-Vektor | Denial of Service | Server-seitiges `.max()`-Constraint im drizzle-zod `.extend()` (analog `username.max(20)`, `displayName.max(40)`) — Client-Caps aus UI-SPEC (~20/~30 Zeichen) sind nur UX-Sugar, nicht die eigentliche Grenze (dasselbe „Server ist der echte Gate"-Muster wie bei `username`/`displayName`, `complete-profile.tsx`-Kommentar Zeile 26-29) |
| Personenbezogenes Datum (`birthDate`) ohne Zugriffskontrolle über die view-only-Fläche hinaus exponiert | Information Disclosure | Außerhalb des Scopes dieser Phase (D-12 explizit: „ohne Sichtbarkeits-Policy") — `visitorProfilePublicSchema` gibt das Feld aktuell nur an den EIGENEN Account zurück (`getMe` ist session-scoped, kein Endpunkt liest fremde Profile); ein künftiger „Freunde sehen mein Profil"-Endpunkt (FRND-02/PROF-02) braucht eine EIGENE Sichtbarkeits-Policy, die IDN-02s Rest explizit offen lässt — Planner sollte dies NICHT in Phase 6 vorwegnehmen |

## Sources

### Primary (HIGH confidence) — in dieser Session gelesene Repo-Dateien
- `apps/mobile/components/FloatingNav.tsx`, `apps/mobile/app/(tabs)/_layout.tsx`,
  `apps/mobile/app/_layout.tsx`, `apps/mobile/app/(festival)/_layout.tsx` — Navigations-/Stack-Struktur
- `apps/mobile/lib/theme.ts`, `apps/mobile/lib/theme-context.tsx`,
  `apps/mobile/lib/__tests__/theme.test.ts`, `apps/mobile/lib/active-festival-storage.ts` —
  Theme-/Persistenz-Muster
- `packages/db/src/schema/visitor-profile.ts`, `packages/db/src/schema/festival.ts`,
  `packages/db/src/schema/auth.ts`, `packages/db/drizzle.config.ts`, `packages/db/package.json`,
  `docker-compose.yml` — Schema/Migrations-Workflow
- `packages/contracts/src/schemas.ts`, `packages/contracts/src/router.ts` — Contract-Shapes
- `apps/api/src/me/me.controller.ts`, `apps/api/src/me/me.service.ts` — `GET /me`-Implementierung
- `apps/mobile/app/(profile-setup)/complete-profile.tsx`, `apps/mobile/components/AvatarTile.tsx`,
  `apps/mobile/components/ComingSoonTile.tsx`, `apps/mobile/components/FestivalCard.tsx`,
  `apps/mobile/components/KeyboardScreen.tsx` — bestehende Screen-/Komponenten-Muster
- `apps/mobile/eslint.config.mjs`, `apps/mobile/lingui.config.ts` — i18n-/Lint-Konfiguration
- `packages/ui/src/tokens.ts` — Design-Tokens
- `docs/DEVELOPMENT_DECISIONS.md` (ADR-023/024), `docs/concept/designs/quiks-v2/README.md`,
  `docs/concept/designs/quiks-v2/quiks-screens.template.html` (Zeilen 1435-1528, 1773-1819,
  1849) — Design-/ADR-Quellen
- `.planning/workstreams/mobile/phases/06-profile-friends-placeholders/06-CONTEXT.md`,
  `06-UI-SPEC.md`, `.planning/workstreams/mobile/REQUIREMENTS.md`,
  `.planning/workstreams/mobile/STATE.md`, `.planning/workstreams/mobile/ROADMAP.md` —
  Phasen-Kontext

### Secondary (MEDIUM confidence)
- `npm view @react-native-community/datetimepicker version` (Registry-Abfrage dieser Session,
  ergab `9.1.0`, published 2026-06-16)
- `gsd_run query package-legitimacy check` für `@react-native-community/datetimepicker` →
  `[OK]`, 2.205.433 wöchentliche Downloads, `github.com/react-native-datetimepicker/datetimepicker`

### Tertiary (LOW confidence) — WebSearch, nicht am Projekt verifiziert
- [Lingui Macros Reference](https://lingui.dev/ref/macro) — `plural`-Makro-Importpfad
  `@lingui/core/macro` (v5+/v6)

## Metadata

**Confidence breakdown:**
- Standard Stack: MEDIUM — nur ein neues Paket, dessen Registry-Existenz/Downloads verifiziert
  sind, dessen exakte SDK-57-Kompatibilität aber nicht geprüft wurde
- Architecture (Navigation/Theme/Contract-Patterns): HIGH — jedes zitierte Pattern basiert auf in
  dieser Session vollständig gelesenem, verbatim zitiertem Quellcode
- Pitfalls: HIGH — alle sieben Pitfalls sind aus konkret gelesenen Dateien und bestehenden
  Test-/Kommentar-Artefakten abgeleitet, nicht spekulativ
- Lingui-`plural`-API: LOW — nur per WebSearch recherchiert, nicht gegen den echten Projekt-Build
  verifiziert (Assumptions Log A3)

**Research date:** 2026-08-11
**Valid until:** 30 Tage (stabiler interner Monorepo-Stand; kein schnelllebiges externes
Ökosystem außer dem einen neuen npm-Paket)
