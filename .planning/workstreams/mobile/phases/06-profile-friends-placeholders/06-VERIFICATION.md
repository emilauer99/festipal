---
phase: 06-profile-friends-placeholders
verified: 2026-08-12T10:10:00Z
status: human_needed
score: 14/17 must-haves verified
behavior_unverified: 2
overrides_applied: 0
behavior_unverified_items:
  - truth: "SoonToast wird von Screenreadern angesagt (Live-Region auf Android, imperative Ansage auf iOS — WR-04)"
    test: "iOS-Build mit eingeschaltetem VoiceOver: eine Platzhalter-Zeile antippen (Payment methods, Language, Share handle, Show QR oder die Friends-Suche)"
    expected: "VoiceOver spricht den Hinweistext des Toasts"
    why_human: "AccessibilityInfo.announceForAccessibility ist im Code verdrahtet (SoonToast.tsx Z. 71), aber ob VoiceOver tatsächlich spricht, ist natives Plattformverhalten — der node-env-Runner kann keine RN-Komponenten rendern; der Fix landete NACH der 18-Punkte-Abnahme"
  - truth: "Der React-Query-Cache stirbt beim Logout — Account B sieht nach Login auf demselben Gerät nichts von Account A (CR-01)"
    test: "Als Account A einloggen, Profil/Friends öffnen, abmelden, als Account B einloggen — am besten mit abgeschaltetem Netz direkt nach dem zweiten Login"
    expected: "Profil, Friends und Home zeigen ausschließlich Daten von Account B; keine E-Mail, kein Handle, keine Festivals von Account A"
    why_human: "cancelQueries()+clear() im unauthenticated-Effekt sind im Code verifiziert (_layout.tsx Z. 416–423), aber die Cleanup-Invariante selbst (kein Altdatum überlebt, auch bei fehlschlagendem Refetch) exerziert kein Test — braucht zwei echte Sessions auf einem Gerät; der Fix landete NACH der 18-Punkte-Abnahme"
human_verification:
  - test: "WR-01 — Dark-Mode-Schalter auf einem System-Dark-Gerät: Gerät auf dunkles Systemschema stellen, App öffnen (dunkel), Schalter in Mehr → Darstellung AUSschalten, App force-quitten und neu starten"
    expected: "Die App wird hell und BLEIBT nach dem Relaunch hell (Override 'light' persistiert); der Schalter springt nicht mehr auf AN zurück"
    why_human: "Der Resolver-Übergang resolveEffectiveThemeMode('light','dark')==='light' ist unit-getestet und das Schreiben von 'light' im Handler verifiziert — aber genau diese Gerätekonstellation war der tote Schalter, und der Fix landete NACH der pauschalen 18-Punkte-Abnahme"
  - test: "WR-04 — SoonToast mit iOS-VoiceOver (siehe behavior_unverified_items)"
    expected: "VoiceOver spricht die Toast-Nachricht"
    why_human: "Natives Verhalten, off-device nicht prüfbar; Fix nach der Abnahme"
  - test: "CR-01 — Logout→Login-Cache-Probe (siehe behavior_unverified_items)"
    expected: "Keine Daten des vorherigen Accounts sichtbar"
    why_human: "Zwei echte Sessions nötig; Fix nach der Abnahme"
  - test: "Backstop-Truths aus 06-07/06-08: Identitätszeile, Vibe-Chips und Stat-Kacheln mit maximal langen Werten (pronoun 20 / gender 30 Zeichen, langer Katalogwert) ansehen"
    expected: "Zeilen bleiben lesbar, das dreispaltige Kachelraster bricht nicht, Chips umbrechen statt zu überlaufen"
    why_human: "verification: backstop — nicht aus dem Code ableitbar; von der Pauschalabnahme nicht itemisiert abgedeckt (die Abnahme lief vermutlich mit normal langen Werten)"
  - test: "Prohibition-Review (judgment-tier, NON-AUTHORITATIVE vom Verifier als eingehalten beurteilt): (a) SafeNow-Karte liest sich nicht als Partnerschaft, Distanzierungssatz in DE+EN vollständig; (b) kein Friends-Block suggeriert eine funktionierende Fläche, keine erfundenen Personen, keine Scham-/Dringlichkeits-Copy; (c) Profil-Ausblick-Blöcke zeigen keine erfundenen Messwerte; (d) nichts suggeriert, der gerätelokale Avatar sei kontogesichert"
    expected: "Menschliche Bestätigung der vier Urteile (alle vier wurden vom Verifier gegen die tatsächliche Copy im Code und in beiden Katalogen geprüft und als eingehalten beurteilt)"
    why_human: "Judgment-tier-Prohibitions dürfen nie stillschweigend grün werden (unverified-prohibition-Flag); die Beurteilung des Verifiers ist nicht autoritativ"
---

# Phase 6: Profile & Friends Placeholders — Verification Report

**Phase Goal:** The festival home links out to a view-only Profile and a well-formed Friends placeholder — **per user-locked Reconciliation (ROADMAP, 2026-08-11) verifiziert gegen D-01 (globale Tab-Leiste statt Festival-Home) und D-10 (Friends global statt festival-bezogen)**
**Verified:** 2026-08-12
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

Das Phasenziel ist im Code erreicht. Alle drei Screens existieren, sind substanziell (384–667 Zeilen), vollständig verdrahtet und hängen an echten Daten aus `GET /api/v1/me`. Kein Muss-Kriterium ist FAILED. Der Status ist `human_needed`, weil **drei der fünf Review-Fixes NACH der pauschalen 18-Punkte-Geräteabnahme landeten** und deren Wirkung nur am Gerät beweisbar ist, plus zwei backstop-Truths und das Prohibition-Flag.

**Evidenzlage ehrlich benannt:** Die Geräteabnahme der Phase (18 Punkte) wurde vom User **pauschal mit „approved" freigegeben, ohne Einzelbefunde**; der Executor hat den Test nicht selbst gefahren. Wo unten „Geräteabnahme (pauschal)" steht, ist das menschliches Sign-off genau dieser Stärke — real, aber keine punktweise Evidenz. Es wird hier weder zu Einzelbeweisen aufgewertet noch verworfen. WINDOWS 33/34/35 sind entsprechend `waived`, nicht `fixed` — korrekt im Ledger geführt.

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Globale Tab-Leiste `Start · Festivals · Friends · Mehr`, vier echte Routen, nichts dekorativ (D-01/SC-1/HOME-03) | ✓ VERIFIED | `(tabs)/_layout.tsx`: vier `Tabs.Screen` (home/festivals/friends/mehr); `FloatingNav.tsx` rendert alle vier aus `state.routes`, kein `DisabledNavItem` mehr; `flex: 1` + `numberOfLines={1}` (UI-SPEC #41/#42). Laufzeit-Navigation: Geräteabnahme (pauschal) |
| 2 | Mehr → Konto → Profil pusht `app/profil.tsx`; im authentifizierten `Stack.Protected`-Block registriert; FloatingNav auf dem Push-Screen weg (Pitfall 1) | ✓ VERIFIED | `mehr.tsx` Z. 164 `router.push('/profil')`; `_layout.tsx` Z. 493 `<Stack.Screen name="profil" />` INNERHALB `guard={authState.status === 'authenticated'}`; `profil.tsx` ist Root-Geschwister von `(tabs)` wie `(festival)`. Kein-Unmatched-Route am Gerät: Geräteabnahme (pauschal, Punkt der 18er-Liste) |
| 3 | Profil view-only aus `GET /me`: displayName, @username, E-Mail, Avatar/Initialen; keine Eingabe, kein Speichern (SC-2/PROF-01) | ✓ VERIFIED | `profil.tsx`: `useQuery(['me'])` → `apiClient.getMe()` (Z. 125), kein Input/keine Mutation im ganzen File; `AvatarTile` mit MMKV-`localUri`-Fallback auf Initialen (D-05); Konto-Zeilen Pattern B mit `showSoonToast(editSoon)` (D-03) |
| 4 | Meta-Zeile `{n} Festivals · {n} Friends · seit {Jahr} dabei` + Identitätszeile aus reinen `lib/`-Bausteinen; Alter aus `birthDate` abgeleitet, nie persistiert (D-04/D-12a) | ✓ VERIFIED | `buildProfileMetaLine`/`buildIdentityLine`/`createdAtYear`/`deriveAge` verdrahtet (`profil.tsx` Z. 187–208); Festivals-Zahl aus gecachtem `festivalKeys.mine` ohne Zweitabruf; Friends konstant 0; benannter Testlauf: 4 Testfiles, **64/64 passed** (inkl. 29. Februar + Geburtstag-noch-nicht-erreicht) |
| 5 | Sunset-Ring am Profil-Avatar; ADR-023-Regel in ALLEN maßgeblichen Dokumenten nachgezogen, nirgends mehr die alte engere Fassung (D-07) | ✓ VERIFIED | `AvatarSunsetRing.tsx` (138 Z., `gradientSunset`-Token, SVG-Ring); `docs/brand/quiks-ci-v1.md` Z. 53/63/67/133, `docs/DEVELOPMENT_DECISIONS.md` Z. 556/569–572 (Änderungsvermerk 2026-08-12), Wurzel-`CLAUDE.md` §Brand & Design — alle drei tragen die Avatar-/Identitätsflächen-Erweiterung |
| 6 | Friends global, liest KEINEN Festival-State; sechs Blöcke, jeder mit eigenem Leerzustand; echter Handle aus `/me` (D-10/D-11/SC-3/FRND-01) | ✓ VERIFIED | `friends.tsx`: keinerlei Festival-Import (kein `active-festival`, kein Slug); Suche (inert, `editable={false}`) · quiks-Code-Karte (echter `@username`, Z. 210–218) · Requests · Chats (benennt die Voraussetzung, T-06-27) · Your crew · People you may know — je eigene Copy, keine erfundene Person, keine Dämpfung der Blöcke (Friends-Ausnahme). „Liest als absichtsvoll": Geräteabnahme (pauschal) |
| 7 | Mehr-Screen: alle fünf Sektionen; genau vier Dinge funktional (Konto→Profil, Sprache-Anzeige, Dark-Switch, Abmelden); SafeNow-Karte mit fester HTTPS-Adresse und intaktem Distanzierungssatz (D-08) | ✓ VERIFIED | `mehr.tsx`: Account/Appearance/Notifications/Location & Safety/App; tote Switches echt `disabled` + Badge (T-06-22); `SAFENOW_URL`-Modulkonstante (T-06-20); Distanzierungssatz im Code (Z. 278–283) und in BEIDEN Katalogen (grep `SafeNow`: 2/2) |
| 8 | Abmelden auf Mehr mit nativer, abbrechbarer Rückfrage; gehärtete Logik unverändert mitgezogen; aus dem Festivals-Header verschwunden (D-09) | ✓ VERIFIED | `mehr.tsx`: `Alert.alert` mit Cancel + destructive (Z. 143–148); `handleLogout` mit Doppeltipp-Guard, `forceUnauthenticated()`-Backstop, `clearActiveFestivalSlug()` (Z. 109–132); `festivals.tsx`: grep `LogOut|signOut|handleLogout` → **0 Treffer** |
| 9 | Dark-Mode-Override: drei Zustände, MMKV-persistiert, STRIKT über der Geräteauflösung; 05.1-Invariante byte-genau erhalten; Schalter schreibt explizite Werte (D-08a, modifiziert durch WR-01) | ✓ VERIFIED (mit dokumentierter Abweichung, s. u.) | `theme.ts`: `resolveEffectiveThemeMode` delegiert im system-Zweig `return resolveThemeMode(scheme)` (Z. 107); `theme-override-storage.ts`: geschluckte Fehler → `system`-Fallback; `theme.test.ts` referenziert `resolveThemeMode` weiter 11×, Testlauf grün. **WR-01**: `handleDarkModeChange` schreibt `'light'` statt `'system'` beim Ausschalten (`mehr.tsx` Z. 97–99) — Gerätebeweis auf System-Dark OFFEN (Human-Item) |
| 10 | SoonToast: GENAU EIN Mechanismus, von allen drei Screens genutzt, über der FloatingNav, ersetzt statt stapelt, von Screenreadern angesagt (D-13, WR-04) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Code vollständig: `ToastProvider` in `_layout.tsx` innerhalb `ThemeProvider` (Z. 151); `useSoonToast` in `profil.tsx`, `mehr.tsx`, `friends.tsx`; `accessibilityLiveRegion="polite"` (Z. 138) + `AccessibilityInfo.announceForAccessibility` (Z. 71, WR-04). Ob VoiceOver tatsächlich spricht, exerziert kein Test — Fix landete NACH der Abnahme → Human-Item |
| 11 | Shared-Package-Schnitt rein additiv: drei nullable Spalten, committete Migration, `meSchema.createdAt` als ISO-String, `.pick()` von der drizzle-zod-Basis, Info-Token (D-04/D-12/D-12a) | ✓ VERIFIED | `visitor-profile.ts`: `pronoun`/`birthDate`(`date mode:'string'`)/`gender` nullable; Migration `0004_new_wong.sql` = exakt drei `ADD COLUMN`, nichts geändert; `schemas.ts`: `visitorProfilePublicSchema.pick(...)` + `completeProfileBodySchema` aus `visitorProfileInsertSchema.pick(...)`, `createdAt: z.string()`; `me.controller.ts`: `session.user.createdAt.toISOString()`; `me.service.ts` projiziert alle drei Felder in select+returning; `tokens.ts`: `fillInfoQuiet`/`borderInfo` |
| 12 | `birthDate` serverseitig auf ein ECHTES YYYY-MM-DD-Kalenderdatum eingeschränkt; Select-Schema bewusst lose für Altwerte (WR-02) | ✓ VERIFIED | `visitor-profile.ts` Z. 145–150: regex + `.refine(isCalendarDate)` + `.nullable().optional()` im `.extend()`-Block; `it.each` mit 6 Fällen (`2020-02-30`, `2026-13-01`, `infinity`, `today`, `08/12/2026`, `''`) in `me-endpoints.spec.ts` Z. 264ff.; api-Suite 55/55 im uncached Gate |
| 13 | Wiederholter `complete-profile` desselben Accounts wird idempotent (200, bestehendes Profil unverändert) beantwortet statt 409; echter Username-Konflikt bleibt 409 (WR-03) | ✓ VERIFIED | `me.service.ts`: Diskriminierung positiv auf `USERNAME_UNIQUE_CONSTRAINT` (Z. 17/88); Test Z. 160–175 prüft 200 UND dass weder neuer Username noch DisplayName durchsickern; `username-race.spec.ts` (zwei verschiedene Accounts) beweist den 409-Pfad weiter. **Urteil zum Test-Flip: richtig** — die alte 409-Assertion zementierte exakt die Ambiguität des Findings (accountId-PK-Konflikt ≠ Username-Konflikt) und ließ den Timeout-Retry im Client dauerhaft stranden; der neue Test schließt zusätzlich ein verstecktes Update aus. Blemish: stale Kommentar Z. 78 („a repeat call is the 409 proven below") widerspricht dem neuen Verhalten — Info |
| 14 | `complete-profile`: drei OPTIONALE Felder; nativer Date-Picker; YYYY-MM-DD aus LOKALEN Datumskomponenten, nie über UTC (D-12/D-12a) | ✓ VERIFIED | `complete-profile.tsx`: `DateTimePicker`/`DateTimePickerAndroid` aus `@react-native-community/datetimepicker` (in `package.json`, Paket-Legitimität per blocking Human-Checkpoint in 06-08 bestätigt); `toLocalDateOnly` nutzt `getFullYear/getMonth/getDate` (Z. 62–67); leere Felder → `null` (Z. 291–293); keine Altersgrenze/Policy/Disclaimer — bewusster D-12-Umfang. Native Picker-Optik: Geräteabnahme (pauschal, WINDOWS 34/35 waived) |
| 15 | i18n vollständig: alle neuen Strings in beiden Katalogen, strikt kompiliert, kein user-generierter Inhalt übersetzbar, „Friends" als Markenwort (SC-4/I18N-01/D-14) | ✓ VERIFIED | Kataloge: genau 1 `msgstr ""` pro Datei = PO-Header; SafeNow-Satz in DE+EN; grep user-content (`feli`, Handles) → 0/0; `msgid "Friends"` → `msgstr "Friends"` (DE-Markenwort); uncached Gate `pnpm lint --force` 10/10 grün (no-literal-string-Regel aktiv) — vom Orchestrator auf dem Post-Fix-Baum selbst gefahren |
| 16 | React-Query-Cache stirbt auf dem `unauthenticated`-Übergang: `cancelQueries()` VOR `clear()`, deckt beide Logout-Pfade (CR-01) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Code verifiziert: `_layout.tsx` Z. 416–423, Reihenfolge korrekt (Cancel vor Clear, damit ein fliegendes `GET /me` der alten Session nicht in den geleerten Cache fällt), im selben Effekt wie die bestehenden CR-01-(05)-Resets. Die Cleanup-Invariante selbst (Account B sieht nichts von A, auch offline) exerziert kein Test und der Fix landete NACH der Abnahme → Human-Item |
| 17 | Backstop-Truths (06-07/06-08): Identitätszeile/Chips/Stat-Kacheln bleiben bei maximal langen Werten lesbar | ? UNCERTAIN | `verification: backstop` — nicht aus Code ableitbar; Layout-Vorkehrungen vorhanden (`flexWrap` Chip-Reihe, `numberOfLines` an Name/Handle), aber der Extremwert-Fall war in der 18-Punkte-Abnahme nicht itemisiert → Human-Item |

**Score:** 14/17 truths verified (2 present, behavior-unverified · 1 uncertain/backstop)

### WR-01 vs. D-08a — Urteil (ausdrücklich verlangt)

**Die Auflösung ist vertretbar, und zwar klar.** D-08a hatte den `'light'`-Zustand writer-los gelassen („aus = Gerät folgt"). Auf einem System-Dark-Gerät machte genau das den Schalter faktisch tot: aus schrieb `'system'`, `'system'` löste wieder `dark` auf, der Schalter sprang zurück auf AN — ein Verstoß gegen den Kern von D-08 („Dunkler Modus **echt**"), der schwerer wiegt als der Buchstabe von D-08a. Der Fix erhält die Substanz von D-08a vollständig: persistierter Override ÜBER der Geräteauflösung, drei Zustände im Typ, `'system'` als Default, `system`-Zweig delegiert unverändert an `resolveThemeMode` (05.1-Invariante intakt, Guard-Test steht wortgleich). Die Review-Alternative (Schalter spiegelt das Override) hätte auf einem Dark-Gerät AUS angezeigt, während die App dunkel bleibt — eine Anzeige, die der Realität widerspricht. Der reale Preis (wer den Schalter einmal anfasst, verlässt „folgt dem Gerät" endgültig, bis eine Dreier-Auswahl kommt) steht ehrlich als Kommentar im Code. Einziger offener Punkt: der Gerätebeweis auf einem System-Dark-Gerät (Human-Item oben).

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/mobile/app/profil.tsx` | Push-Screen view-only, min 220 Z. | ✓ VERIFIED | 667 Zeilen, voll verdrahtet |
| `apps/mobile/app/(tabs)/mehr.tsx` | Voller Mehr-Screen, min 200 Z. | ✓ VERIFIED | 384 Zeilen |
| `apps/mobile/app/(tabs)/friends.tsx` | Sechs Blöcke, min 180 Z. | ✓ VERIFIED | 459 Zeilen |
| `apps/mobile/app/_layout.tsx` | `name="profil"` + `ToastProvider` | ✓ VERIFIED | Beides vorhanden, korrekt platziert |
| `apps/mobile/app/(tabs)/_layout.tsx` | `name="mehr"` + `name="friends"` | ✓ VERIFIED | Vier `Tabs.Screen` |
| `apps/mobile/components/{ListRow,SettingsSwitch,SoonToast,AvatarSunsetRing}.tsx` | min 60/50/70/40 Z. | ✓ VERIFIED | 192/153/181/138 Zeilen |
| `apps/mobile/lib/{theme,theme-override-storage,theme-context,profile-age,profile-meta-line}` + 4 Testfiles | Symbole lt. Plan | ✓ VERIFIED | Alle Symbole vorhanden; 64/64 Tests grün (benannter Lauf) |
| `packages/db/src/schema/visitor-profile.ts` | `birthDate` + `.extend()`-Caps | ✓ VERIFIED | inkl. WR-02-Constraint |
| `packages/db/drizzle/0004_new_wong.sql` | Additive Migration, committet | ✓ VERIFIED | Drei `ADD COLUMN`, nichts geändert |
| `packages/contracts/src/schemas.ts` | `createdAt` + Identitätsfelder | ✓ VERIFIED | `.pick()` von drizzle-zod-Basis, nie handgebaut |
| `packages/ui/src/tokens.ts` | `fillInfoQuiet`/`borderInfo` | ✓ VERIFIED | Z. 277–278 |
| `apps/api/src/me/{me.controller,me.service}.ts` | `toISOString` / Feld-Projektionen | ✓ VERIFIED | inkl. WR-03-Diskriminierung |
| `apps/mobile/app/(profile-setup)/complete-profile.tsx` | Drei optionale Felder + Picker | ✓ VERIFIED | inkl. `toLocalDateOnly` lokal |
| `docs/DEVELOPMENT_DECISIONS.md` + `docs/brand/quiks-ci-v1.md` + `CLAUDE.md` | ADR-023-Erweiterung | ✓ VERIFIED | Alle drei nachgezogen, Änderungsvermerk datiert |
| `apps/mobile/locales/{de,en}/messages.po` | Vollständige Kataloge | ✓ VERIFIED | 1 leeres msgstr = Header; SafeNow 2/2 |

### Key Link Verification

| From | To | Via | Status |
| --- | --- | --- | --- |
| `mehr.tsx` | `profil.tsx` | `router.push('/profil')` | ✓ WIRED |
| `_layout.tsx` | `profil.tsx` | `Stack.Screen name="profil"` im authenticated-Guard | ✓ WIRED |
| `profil.tsx` / `friends.tsx` | `api-client.ts` | `useQuery(['me'])` → `getMe()` — geteilter Cache-Key | ✓ WIRED |
| `FloatingNav.tsx` | `(tabs)/_layout.tsx` | `state.routes` liefert vier Live-Routen | ✓ WIRED |
| `_layout.tsx` | `SoonToast.tsx` | `<ToastProvider>` innerhalb ThemeProvider | ✓ WIRED |
| `mehr.tsx` | `theme-context.tsx` | `useThemeOverride` / `setThemeOverride` | ✓ WIRED |
| `theme-context.tsx` | `theme.ts` + `theme-override-storage.ts` | `resolveEffectiveThemeMode` + `(get\|save)ThemeOverride` | ✓ WIRED |
| `theme.ts` (system-Zweig) | `resolveThemeMode` | `return resolveThemeMode(scheme)` — 05.1-Invariante | ✓ WIRED |
| `profil.tsx` | `AvatarSunsetRing` / `profile-meta-line` / `festival-queries` | Ring, Builder, Cache-Read | ✓ WIRED |
| `AvatarSunsetRing.tsx` | `tokens` | `gradientSunset` | ✓ WIRED |
| `me.controller.ts` | contracts | `contract.getMe` via `TsRestHandler` | ✓ WIRED |
| `me.service.ts` | db-Schema | `visitorProfile.(pronoun\|birthDate\|gender)` in select+returning | ✓ WIRED |
| `complete-profile.tsx` | contracts | `pronoun`/`birthDate`/`gender` im Request-Body | ✓ WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Status |
| --- | --- | --- | --- |
| Profil-Kopf + Konto-Zeilen | displayName/@username/email/createdAt/Identitätsfelder | `useQuery(['me'])` → NestJS → Drizzle-Select | ✓ FLOWING |
| Friends quiks-Code-Karte | `@username` | derselbe `['me']`-Cache-Eintrag | ✓ FLOWING |
| Meta-Zeile Festivals-Zahl | `festivalKeys.mine`-Cache | nicht-reaktiver `getQueryData`-Read, 0 bei kaltem Cache | ⚠️ bewusst (IN-05, akzeptiert) |
| Friends-Blöcke / Profil-Ausblick-Blöcke | keine | absichtsvolle Platzhalter (D-11/D-02) | — by design (WINDOWS 36/37, open) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Theme-Override + 05.1-Invariante, Altersableitung (29. Feb, Geburtstag offen), Meta-/Identitätszeile, Storage-Fehler-Fallback | `npx vitest run lib/__tests__/{theme,profile-age,profile-meta-line,theme-override-storage}.test.ts` | 4 files, **64/64 passed** | ✓ PASS |
| Monorepo-Gate (Post-Fix-Baum) | `pnpm test --force` / `lint` / `typecheck` | 7/7 (0 cached; api 55/55, mobile 188/188) / 10/10 / 10/10 | ✓ PASS (vom Orchestrator selbst gefahren, nicht aus SUMMARY übernommen) |
| WR-02-Negativfälle | `it.each` 6 Fälle in `me-endpoints.spec.ts` | Teil der api 55/55 | ✓ PASS |
| Fix-Commits existieren | `git log` `6707cf9`/`8790e1c`/`53c09dc`/`8db31c9`/`4f14feb` | alle fünf in der Historie | ✓ PASS |

### Probe Execution

SKIPPED — keine `scripts/*/tests/probe-*.sh` im Repo (find → 0), keine Probe in PLAN/SUMMARY deklariert.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| HOME-03 | 06-01, 06-05, 06-06, 06-09 | Navigation zu Profile und Friends | ✓ SATISFIED (per D-01 über die globale Tab-Leiste, user-locked) | Truths 1–2 |
| PROF-01 | 06-01, 06-02, 06-03, 06-07, 06-08, 06-09 | View-only Profil-Screen | ✓ SATISFIED | Truths 3–5, 11–14 |
| FRND-01 | 06-01, 06-04, 06-06, 06-09 | Friends-Leerzustand, klar und nicht kaputt | ✓ SATISFIED (per D-10 global, user-locked) | Truth 6 |
| — | — | Orphaned requirements | keine | REQUIREMENTS.md mappt für Phase 6 exakt diese drei IDs; IDN-02 wurde durch D-12 nur TEILWEISE vorgezogen und bleibt als eigenes Requirement offen (Birgits Konzept) — korrekt nicht als Phase-6-ID geführt |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| — | — | `TBD`/`FIXME`/`XXX` in Phase-Dateien | — | **0 Treffer** |
| `apps/api/test/me-endpoints.spec.ts` | 78 | Stale Kommentar „a repeat call is the 409 proven below" widerspricht dem WR-03-Verhalten (jetzt idempotent 200) | ℹ️ Info | Nur Doku im Test; die Assertions selbst sind konsistent |
| bekannte IN-01…IN-05 (06-REVIEW) | div. | u. a. unhandled `Linking.openURL`, QR-Duplikat, nicht-reaktiver Cache-Read | ℹ️ Info | Vom User explizit außerhalb des Fix-Scopes gelassen — nicht neu, Lage unverändert wie beschrieben |
| WINDOWS 32 (T-06-06) | `schemas.ts` | `visitorProfilePublicSchema` trägt `birthDate`/`gender` ohne Sichtbarkeits-Policy | ⚠️ getragen | Bestätigt: heute ausschließlich owner-bound serviert (`/me` session-gebunden, kein Fremdprofil-Pfad in dieser Phase — `friends.tsx`/`profil.tsx` geprüft). Lage exakt wie im Ledger beschrieben, NICHT schlimmer. MUSS vor dem ersten Fremdprofil-Endpoint (FRND-02/PROF-02) gesplittet werden |

### Human Verification Required

Siehe Frontmatter (`human_verification`). Kern: **drei Post-Fix-Gerätechecks** (WR-01 System-Dark-Switch, WR-04 VoiceOver, CR-01 Logout-Cache), die von der pauschalen 18-Punkte-Abnahme zeitlich NICHT abgedeckt sind, plus die zwei backstop-Layout-Truths und das (non-authoritative positiv beurteilte) Prohibition-Review.

### Gaps Summary

Keine Gaps. Kein Muss-Kriterium ist FAILED, kein Artefakt fehlt oder ist Stub (die Platzhalter in Friends/Profil sind der GEGENSTAND der Phase und als WINDOWS 36/37 geführt), keine Key-Link ist unverdrahtet. Der Weg zu `passed` führt über die fünf Human-Items oben — davon sind nur die drei Post-Fix-Gerätechecks substanziell; backstop und Prohibition-Review sind Bestätigungen.

**Offene, bereits getragene Punkte (nicht Phase-6-Gaps):** WINDOWS 32 (Profilprojektion vor FRND-02/PROF-02 splitten), WINDOWS 33/34/35 (`waived` auf Basis der Pauschalabnahme — ehrlich so geführt), Tab-Umbenennung „Home"→„Start" (ausdrücklich nicht beauftragt, als offene Frage im STATE), WINDOWS 36/37 (absichtsvolle Platzhalter bis FRND-02/PROF-02).

---

_Verified: 2026-08-12T10:10:00Z_
_Verifier: Claude (gsd-verifier)_
