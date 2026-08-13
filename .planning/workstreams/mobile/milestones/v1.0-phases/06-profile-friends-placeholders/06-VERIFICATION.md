---
phase: 06-profile-friends-placeholders
verified: 2026-08-12T14:45:00Z
status: passed
score: 18/18 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 14/17
  gaps_closed:
    - "G-06-5 — Profil-Screen-Crash auf Hermes (Intl.PluralRules fehlt) — geschlossen durch Plan 06-10, neue Truth #18"
    - "WR-01 Gerätebeweis System-Dark-Switch — UAT Test 1 pass (menschliches Sign-off)"
    - "CR-01 Logout→Login-Cache-Probe — UAT Test 2 pass (menschliches Sign-off)"
    - "WR-04 VoiceOver-Ansage des SoonToast — UAT Test 3 pass (menschliches Sign-off)"
    - "Backstop-Truths Extremwerte (06-07/06-08) — UAT Test 4 pass (menschliches Sign-off)"
    - "Prohibition-Review (judgment-tier, 4 Urteile) — UAT Test 5 pass; (c)/(d) nach dem 06-10-Fix vom User re-beurteilt"
  gaps_remaining: []
  regressions: []
---

# Phase 6: Profile & Friends Placeholders — Verification Report

**Phase Goal:** The festival home links out to a view-only Profile and a well-formed Friends placeholder — **per user-locked Reconciliation (ROADMAP, 2026-08-11) verifiziert gegen D-01 (globale Tab-Leiste statt Festival-Home) und D-10 (Friends global statt festival-bezogen)**
**Verified:** 2026-08-12 (Re-Verifikation, 14:45Z; Erstverifikation 10:10Z)
**Status:** passed
**Re-verification:** Yes — nach Plan 06-10 (Gap-Closure G-06-5) und abgeschlossener UAT (5/5 pass, 0 Issues)

## Goal Achievement

Das Phasenziel ist erreicht und jetzt vollständig belegt. Die Erstverifikation (10:10Z) ließ mit `human_needed` genau die Punkte offen, die diese Umgebung strukturell nicht erbringen kann: drei Post-Fix-Gerätechecks, die backstop-Layout-Truths und das judgment-tier-Prohibition-Review. Seitdem ist zweierlei passiert:

1. **Plan 06-10 landete** (Commits `3c7c120`/`568a9db`, beide in der Historie verifiziert) und schloss G-06-5 — den während der UAT entdeckten harten Crash beim Öffnen des Profil-Screens auf Hermes (`TypeError: undefined cannot be used as a constructor.`). Dieser Plan war von keiner Verifikation abgedeckt; er ist unten als **Truth #18** goal-backward verifiziert.
2. **Die UAT wurde abgeschlossen** (`06-UAT.md`, status `complete`, 5/5 pass, 0 Issues) und liefert das menschliche Sign-off, auf das die offenen Items gewartet haben — diesmal **itemisiert**, nicht pauschal.

**Evidenzlage ehrlich benannt (unverändert im Maßstab):** Die ursprüngliche 18-Punkte-Geräteabnahme bleibt, was sie war — ein pauschales „approved" ohne Einzelbefunde; WINDOWS 33/34/35 bleiben korrekt `waived`, nicht `fixed`. Die NEUEN Nachweise dieser Re-Verifikation sind demgegenüber itemisiert: fünf einzeln formulierte UAT-Tests mit je eigenem `pass`, und für 06-10 ein Geräte-Checkpoint mit verbatim gemeldeter Log-Zeile. Wo unten „UAT Test N (menschliches Sign-off)" steht, ist das menschliche Evidenz genau dieser Stärke — real und itemisiert, aber kein automatisierter Beweis, und es wird hier zu keinem aufgewertet.

### Carry-Forward aus der Erstverifikation

**Die Truths #1–#8 und #11–#15 werden wörtlich aus der Erstverifikation (10:10Z) übernommen und wurden NICHT neu hergeleitet.** Das ist zulässig und belegt: `git diff --stat ee283f0 HEAD -- apps packages docs CLAUDE.md` zeigt exakt fünf geänderte Dateien — `apps/mobile/index.js`, `lib/intl-capability.ts`, `lib/intl-polyfill.ts`, `lib/__tests__/intl-polyfill.test.ts`, `apps/mobile/package.json` — alle aus Plan 06-10. Kein Screen, kein `lib/`-Baustein der Pläne 06-01…06-09, kein API-, Schema- oder Katalog-File hat sich seit der Erstverifikation geändert; deren Evidenz gilt unverändert. Für die übernommenen Zeilen gilt ein schneller Regressionscheck (Existenz + `git diff` leer), keine erneute 3-Level-Prüfung.

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Globale Tab-Leiste `Start · Festivals · Friends · Mehr`, vier echte Routen, nichts dekorativ (D-01/SC-1/HOME-03) | ✓ VERIFIED (carry-forward) | `(tabs)/_layout.tsx`: vier `Tabs.Screen` (home/festivals/friends/mehr); `FloatingNav.tsx` rendert alle vier aus `state.routes`, kein `DisabledNavItem` mehr; `flex: 1` + `numberOfLines={1}` (UI-SPEC #41/#42). Laufzeit-Navigation: Geräteabnahme (pauschal) |
| 2 | Mehr → Konto → Profil pusht `app/profil.tsx`; im authentifizierten `Stack.Protected`-Block registriert; FloatingNav auf dem Push-Screen weg (Pitfall 1) | ✓ VERIFIED (carry-forward) | `mehr.tsx` Z. 164 `router.push('/profil')`; `_layout.tsx` Z. 493 `<Stack.Screen name="profil" />` INNERHALB `guard={authState.status === 'authenticated'}`; `profil.tsx` ist Root-Geschwister von `(tabs)` wie `(festival)`. Kein-Unmatched-Route am Gerät: Geräteabnahme (pauschal, Punkt der 18er-Liste) |
| 3 | Profil view-only aus `GET /me`: displayName, @username, E-Mail, Avatar/Initialen; keine Eingabe, kein Speichern (SC-2/PROF-01) | ✓ VERIFIED (carry-forward) | `profil.tsx`: `useQuery(['me'])` → `apiClient.getMe()` (Z. 125), kein Input/keine Mutation im ganzen File; `AvatarTile` mit MMKV-`localUri`-Fallback auf Initialen (D-05); Konto-Zeilen Pattern B mit `showSoonToast(editSoon)` (D-03). **Erreichbarkeit am Gerät jetzt durch Truth #18 gedeckt** (vorher crashte der Screen vor jedem Markup) |
| 4 | Meta-Zeile `{n} Festivals · {n} Friends · seit {Jahr} dabei` + Identitätszeile aus reinen `lib/`-Bausteinen; Alter aus `birthDate` abgeleitet, nie persistiert (D-04/D-12a) | ✓ VERIFIED (carry-forward) | `buildProfileMetaLine`/`buildIdentityLine`/`createdAtYear`/`deriveAge` verdrahtet (`profil.tsx` Z. 187–208); Festivals-Zahl aus gecachtem `festivalKeys.mine` ohne Zweitabruf; Friends konstant 0; benannter Testlauf: 4 Testfiles, **64/64 passed** (inkl. 29. Februar + Geburtstag-noch-nicht-erreicht) |
| 5 | Sunset-Ring am Profil-Avatar; ADR-023-Regel in ALLEN maßgeblichen Dokumenten nachgezogen, nirgends mehr die alte engere Fassung (D-07) | ✓ VERIFIED (carry-forward) | `AvatarSunsetRing.tsx` (138 Z., `gradientSunset`-Token, SVG-Ring); `docs/brand/quiks-ci-v1.md` Z. 53/63/67/133, `docs/DEVELOPMENT_DECISIONS.md` Z. 556/569–572 (Änderungsvermerk 2026-08-12), Wurzel-`CLAUDE.md` §Brand & Design — alle drei tragen die Avatar-/Identitätsflächen-Erweiterung |
| 6 | Friends global, liest KEINEN Festival-State; sechs Blöcke, jeder mit eigenem Leerzustand; echter Handle aus `/me` (D-10/D-11/SC-3/FRND-01) | ✓ VERIFIED (carry-forward) | `friends.tsx`: keinerlei Festival-Import (kein `active-festival`, kein Slug); Suche (inert, `editable={false}`) · quiks-Code-Karte (echter `@username`, Z. 210–218) · Requests · Chats (benennt die Voraussetzung, T-06-27) · Your crew · People you may know — je eigene Copy, keine erfundene Person, keine Dämpfung der Blöcke (Friends-Ausnahme). „Liest als absichtsvoll": Geräteabnahme (pauschal) + UAT Test 5 (b) pass (itemisiert) |
| 7 | Mehr-Screen: alle fünf Sektionen; genau vier Dinge funktional (Konto→Profil, Sprache-Anzeige, Dark-Switch, Abmelden); SafeNow-Karte mit fester HTTPS-Adresse und intaktem Distanzierungssatz (D-08) | ✓ VERIFIED (carry-forward) | `mehr.tsx`: Account/Appearance/Notifications/Location & Safety/App; tote Switches echt `disabled` + Badge (T-06-22); `SAFENOW_URL`-Modulkonstante (T-06-20); Distanzierungssatz im Code (Z. 278–283) und in BEIDEN Katalogen (grep `SafeNow`: 2/2) |
| 8 | Abmelden auf Mehr mit nativer, abbrechbarer Rückfrage; gehärtete Logik unverändert mitgezogen; aus dem Festivals-Header verschwunden (D-09) | ✓ VERIFIED (carry-forward) | `mehr.tsx`: `Alert.alert` mit Cancel + destructive (Z. 143–148); `handleLogout` mit Doppeltipp-Guard, `forceUnauthenticated()`-Backstop, `clearActiveFestivalSlug()` (Z. 109–132); `festivals.tsx`: grep `LogOut|signOut|handleLogout` → **0 Treffer** |
| 9 | Dark-Mode-Override: drei Zustände, MMKV-persistiert, STRIKT über der Geräteauflösung; 05.1-Invariante byte-genau erhalten; Schalter schreibt explizite Werte (D-08a, modifiziert durch WR-01) | ✓ VERIFIED | Code (carry-forward): `theme.ts` Z. 107 delegiert im system-Zweig an `resolveThemeMode`; `theme-override-storage.ts` Fehler → `system`-Fallback; `theme.test.ts` 11× grün; `mehr.tsx` Z. 97–99 schreibt `'light'` beim Ausschalten. **NEU: Der offene Gerätebeweis auf System-Dark ist erbracht — UAT Test 1 pass (menschliches Sign-off, itemisiert): App wird hell und BLEIBT nach force-quit + Relaunch hell, Schalter springt nicht zurück** |
| 10 | SoonToast: GENAU EIN Mechanismus, von allen drei Screens genutzt, über der FloatingNav, ersetzt statt stapelt, von Screenreadern angesagt (D-13, WR-04) | ✓ VERIFIED | Code (carry-forward): `ToastProvider` in `_layout.tsx` Z. 151; `useSoonToast` in allen drei Screens; `accessibilityLiveRegion="polite"` (SoonToast.tsx Z. 138) + `AccessibilityInfo.announceForAccessibility` (Z. 71). **NEU: das Verhalten ist exerziert — UAT Test 3 pass (menschliches Sign-off, itemisiert): iOS-VoiceOver spricht den Hinweistext des Toasts.** Vorher ⚠️ PRESENT_BEHAVIOR_UNVERIFIED |
| 11 | Shared-Package-Schnitt rein additiv: drei nullable Spalten, committete Migration, `meSchema.createdAt` als ISO-String, `.pick()` von der drizzle-zod-Basis, Info-Token (D-04/D-12/D-12a) | ✓ VERIFIED (carry-forward) | `visitor-profile.ts`: `pronoun`/`birthDate`(`date mode:'string'`)/`gender` nullable; Migration `0004_new_wong.sql` = exakt drei `ADD COLUMN`, nichts geändert; `schemas.ts`: `visitorProfilePublicSchema.pick(...)` + `completeProfileBodySchema` aus `visitorProfileInsertSchema.pick(...)`, `createdAt: z.string()`; `me.controller.ts`: `session.user.createdAt.toISOString()`; `me.service.ts` projiziert alle drei Felder in select+returning; `tokens.ts`: `fillInfoQuiet`/`borderInfo` |
| 12 | `birthDate` serverseitig auf ein ECHTES YYYY-MM-DD-Kalenderdatum eingeschränkt; Select-Schema bewusst lose für Altwerte (WR-02) | ✓ VERIFIED (carry-forward) | `visitor-profile.ts` Z. 145–150: regex + `.refine(isCalendarDate)` + `.nullable().optional()` im `.extend()`-Block; `it.each` mit 6 Fällen in `me-endpoints.spec.ts` Z. 264ff.; api-Suite 55/55 im uncached Gate |
| 13 | Wiederholter `complete-profile` desselben Accounts wird idempotent (200, bestehendes Profil unverändert) beantwortet statt 409; echter Username-Konflikt bleibt 409 (WR-03) | ✓ VERIFIED (carry-forward) | `me.service.ts`: Diskriminierung positiv auf `USERNAME_UNIQUE_CONSTRAINT` (Z. 17/88); Test Z. 160–175 prüft 200 UND dass weder neuer Username noch DisplayName durchsickern; `username-race.spec.ts` beweist den 409-Pfad weiter. Urteil zum Test-Flip (richtig) unverändert; Blemish stale Kommentar Z. 78 bleibt Info |
| 14 | `complete-profile`: drei OPTIONALE Felder; nativer Date-Picker; YYYY-MM-DD aus LOKALEN Datumskomponenten, nie über UTC (D-12/D-12a) | ✓ VERIFIED (carry-forward) | `complete-profile.tsx`: `DateTimePicker`/`DateTimePickerAndroid` (Paket-Legitimität per blocking Human-Checkpoint in 06-08 bestätigt); `toLocalDateOnly` nutzt `getFullYear/getMonth/getDate` (Z. 62–67); leere Felder → `null` (Z. 291–293). Native Picker-Optik: Geräteabnahme (pauschal, WINDOWS 34/35 waived) |
| 15 | i18n vollständig: alle neuen Strings in beiden Katalogen, strikt kompiliert, kein user-generierter Inhalt übersetzbar, „Friends" als Markenwort (SC-4/I18N-01/D-14) | ✓ VERIFIED (carry-forward) | Kataloge: genau 1 `msgstr ""` pro Datei = PO-Header; SafeNow-Satz in DE+EN; grep user-content → 0/0; `msgid "Friends"` → `msgstr "Friends"`; uncached Gate `pnpm lint --force` 10/10 grün — vom Orchestrator auf dem Post-Fix-Baum selbst gefahren |
| 16 | React-Query-Cache stirbt auf dem `unauthenticated`-Übergang: `cancelQueries()` VOR `clear()`, deckt beide Logout-Pfade (CR-01) | ✓ VERIFIED | Code (carry-forward): `_layout.tsx` Z. 416–423, Reihenfolge korrekt (Cancel vor Clear), im selben Effekt wie die CR-01-(05)-Resets. **NEU: die Cleanup-Invariante ist exerziert — UAT Test 2 pass (menschliches Sign-off, itemisiert): Zwei-Konten-Probe auf einem Gerät, Konto B sieht ausschließlich eigene Daten, empfohlen offline direkt nach dem zweiten Login.** Vorher ⚠️ PRESENT_BEHAVIOR_UNVERIFIED |
| 17 | Backstop-Truths (06-07/06-08): Identitätszeile/Chips/Stat-Kacheln bleiben bei maximal langen Werten lesbar | ✓ VERIFIED | Layout-Vorkehrungen im Code (carry-forward: `flexWrap` Chip-Reihe, `numberOfLines` an Name/Handle). **NEU: UAT Test 4 pass (menschliches Sign-off, itemisiert): Extremwerte (pronoun 20 / gender 30 Zeichen, langer Katalogwert) angesehen — Zeilen lesbar, dreispaltiges Kachelraster bricht nicht, Chips umbrechen.** Vorher ? UNCERTAIN (backstop) |
| 18 | **G-06-5 geschlossen (Plan 06-10):** Der Profil-Screen öffnet sich auf einem Hermes-Gerät statt mit dem Constructor-TypeError zu crashen; `Intl.PluralRules` ist ab App-Start eine Funktion, geliefert von einem am App-Entry registrierten Polyfill VOR jedem Route-Modul; die `plural()`-Aufrufstellen sind unverändert (PROF-01) | ✓ VERIFIED | Detailnachweis im Abschnitt „Plan 06-10" unten: Code-Verdrahtung file:line-verifiziert, Rückfall-Guard **selbst gefahren (5/5 passed)**, Commits `3c7c120`/`568a9db` in der Historie, `git diff ee283f0 HEAD -- apps/mobile/app/profil.tsx` **leer (selbst gefahren)**. Geräteverhalten: menschliches Sign-off am Task-4-Checkpoint mit verbatim gemeldeter Log-Zeile — als Geräte-Evidenz geführt, nicht als automatisierter Beweis |

**Score:** 18/18 truths verified (0 behavior-unverified · 0 uncertain)

### Plan 06-10 — Goal-Backward-Verifikation (neu in dieser Re-Verifikation)

Plan 06-10 war von keiner Verifikation abgedeckt (die Erstverifikation lag zeitlich davor). Die fünf `must_haves.truths` des Plans, einzeln geprüft:

| 06-10-Truth | Status | Evidence |
| --- | --- | --- |
| Profil-Tap auf einem Hermes-Gerät öffnet den Screen statt TypeError | ✓ VERIFIED (Geräte-Sign-off) | Task-4-Checkpoint: User „approved, funktioniert jetzt" (06-10-SUMMARY, D1). **Menschliche Evidenz, kein automatisierter Beweis** — der Verifier kann kein Android-Build fahren. Korroboriert durch die UAT: Test 5 (c)/(d) wurden im Wiederholungslauf beurteilt, was ein gerendertes Profil voraussetzt (06-UAT.md Test 5 `note`) |
| `Intl.PluralRules` ist ab App-Start eine Funktion, Polyfill am Entry VOR jedem Route-Modul registriert | ✓ VERIFIED | Verdrahtung selbst geprüft: `apps/mobile/package.json` Z. 5 `"main": "index.js"`, Z. 23 `@formatjs/intl-pluralrules ^6.3.13`; `index.js` Z. 12–13: exakt zwei Side-Effect-Imports, `./lib/intl-polyfill` VOR `expo-router/entry` (Expo-dokumentiertes Custom-Entry-Pattern); `intl-polyfill.ts` Z. 42–45: Capability-Probe zuerst, dann `polyfill-force.js`, dann `locale-data/de.js`/`en.js`; Z. 60–65 fail-fast-`throw` falls die API nach dem Polyfill fehlt. **Laufzeitwert am Gerät: verbatim gemeldete Log-Zeile `[intl-polyfill] native Intl.PluralRules: undefined, after polyfill: function` (Geräte-Sign-off, Task 4)** — bestätigt zugleich erstmals die Hermes-Diagnose am Gerät statt nur aus Upstream-Doku |
| Die zwei `plural()`-Aufrufstellen in `app/profil.tsx` sind byte-für-byte unverändert | ✓ VERIFIED (selbst gefahren) | `git diff --stat ee283f0 HEAD -- apps/mobile/app/profil.tsx` → leer; Aufrufstellen in situ gelesen: `profil.tsx` Z. 199–200, `plural(festivalCount, …)`/`plural(friendCount, …)` mit `one`/`other`-Kategorien intakt |
| Locale ohne Locale-Data in `SUPPORTED_LOCALES` lässt `pnpm --filter @quiks/mobile test` fehlschlagen | ✓ VERIFIED (Guard selbst gefahren) | `lib/__tests__/intl-polyfill.test.ts` Z. 94–96: Assertion iteriert das ECHTE `SUPPORTED_LOCALES` aus `@quiks/i18n` und verlangt den vollen single-quoted Import-Spezifizierer je Locale; benannter Testlauf durch den Verifier: `npx vitest run lib/__tests__/intl-polyfill.test.ts` → **5/5 passed**. Die Rot-Läufe der drei Falsifikationsmutationen sind SUMMARY-protokolliert (Executor-Evidenz) — bemerkenswert ehrlich: Mutation 3 deckte anfangs einen False Negative im eigenen Test auf, der VOR dem Commit gehärtet wurde (06-10-SUMMARY, Deviations Punkt 2) |
| Revert von `package.json` `main` auf den Stock-Entry lässt die Suite fehlschlagen | ✓ VERIFIED (Guard selbst gefahren) | Assertion 1 (`intl-polyfill.test.ts` Z. 44–50) prüft `pkg.main === 'index.js'`; Rot-Lauf der Mutation SUMMARY-protokolliert (sofort rot, sauberer Revert) |

**Zur Capability-Probe:** `lib/intl-capability.ts` hat null Imports (Z. 1–21 vollständig gelesen) und fängt `typeof Intl.PluralRules` am Modulwertungszeitpunkt — die Hoisting-Begründung im Header ist korrekt und von 06-10-REVIEW (deep) fachlich bestätigt. Die forced-Variante ist bewusst (Detection auf Android sekundenlangsam, formatjs/formatjs#4463), die `.js`-Endungen sind gegen die reale `exports`-Map verifiziert (06-10-REVIEW, Kernbehauptung 3).

**Urteil zu den 06-10-REVIEW-Warnings (0 Critical, 2 Warnings, 1 Info):** Beide Warnings betreffen ausschließlich die Robustheit des Rückfall-Guards, nicht den Fix: (W1) die String-Matcher sind blind gegen AUSKOMMENTIERTE Imports — die dokumentierten Mutationen decken Löschung/Revert ab, nicht Auskommentierung; (W2) der Guard zählt die Imports in `index.js` nicht, ein DRITTER Import bliebe unbemerkt, obwohl das Threat-Register (T-06-10-01) „any added import" als abgedeckt deklariert. **Sie unterminieren Truth #18 nicht:** der Fix selbst ist korrekt verdrahtet und geräteverifiziert, der Guard existiert, ist substanziell (5 Assertionen, dreifach falsifiziert, ein eigener False Negative dabei gefunden und gefixt) und deckt die realistischsten Regressionspfade (Revert, Löschung, Suffix-Drop, drittes Locale). Die zwei Blind Spots sind Härtungs-Follow-ups und werden unten als getragene Findings geführt — kein Blocker, kein FAILED.

**Ehrlich offen bleibende Beobachtung (kein Muss-Kriterium):** Die exakte gerenderte Meta-Zeile (Task 4 Schritt 4, erwartete „0 Festivals · 0 Friends"-Form) wurde vom User NICHT transkribiert — belegt ist der Bildschirmerfolg, nicht der genaue Text. Dass der Plural-Pfad ohne Wurf durchläuft, folgt daraus, dass der Screen überhaupt rendert (die `plural()`-Aufrufe laufen unbedingt vor jedem Markup); dass die Locale-Daten gebündelt sind, aus dem `__addLocaleData`-Marker im Export-Bundle (Executor-Evidenz, D4). Die byte-exakte Zeichenkette bleibt unprotokolliert — 06-10-SUMMARY führt das selbst korrekt als nicht beobachtet und keine der `must_haves.truths` verlangt sie.

### WR-01 vs. D-08a — Urteil (unverändert, jetzt gerätebestätigt)

**Die Auflösung ist vertretbar, und zwar klar.** D-08a hatte den `'light'`-Zustand writer-los gelassen („aus = Gerät folgt"). Auf einem System-Dark-Gerät machte genau das den Schalter faktisch tot: aus schrieb `'system'`, `'system'` löste wieder `dark` auf, der Schalter sprang zurück auf AN — ein Verstoß gegen den Kern von D-08 („Dunkler Modus **echt**"), der schwerer wiegt als der Buchstabe von D-08a. Der Fix erhält die Substanz von D-08a vollständig: persistierter Override ÜBER der Geräteauflösung, drei Zustände im Typ, `'system'` als Default, `system`-Zweig delegiert unverändert an `resolveThemeMode` (05.1-Invariante intakt, Guard-Test steht wortgleich). Die Review-Alternative (Schalter spiegelt das Override) hätte auf einem Dark-Gerät AUS angezeigt, während die App dunkel bleibt — eine Anzeige, die der Realität widerspricht. Der reale Preis (wer den Schalter einmal anfasst, verlässt „folgt dem Gerät" endgültig, bis eine Dreier-Auswahl kommt) steht ehrlich als Kommentar im Code. **Der zuvor einzige offene Punkt — der Gerätebeweis auf einem System-Dark-Gerät — ist jetzt erbracht: UAT Test 1 pass.**

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/mobile/app/profil.tsx` | Push-Screen view-only, min 220 Z. | ✓ VERIFIED | 667 Zeilen, voll verdrahtet; seit ee283f0 unverändert (git-verifiziert) |
| `apps/mobile/app/(tabs)/mehr.tsx` | Voller Mehr-Screen, min 200 Z. | ✓ VERIFIED | 384 Zeilen (carry-forward) |
| `apps/mobile/app/(tabs)/friends.tsx` | Sechs Blöcke, min 180 Z. | ✓ VERIFIED | 459 Zeilen (carry-forward) |
| `apps/mobile/app/_layout.tsx` | `name="profil"` + `ToastProvider` | ✓ VERIFIED | Beides vorhanden, korrekt platziert (carry-forward) |
| `apps/mobile/app/(tabs)/_layout.tsx` | `name="mehr"` + `name="friends"` | ✓ VERIFIED | Vier `Tabs.Screen` (carry-forward) |
| `apps/mobile/components/{ListRow,SettingsSwitch,SoonToast,AvatarSunsetRing}.tsx` | min 60/50/70/40 Z. | ✓ VERIFIED | 192/153/181/138 Zeilen (carry-forward) |
| `apps/mobile/lib/{theme,theme-override-storage,theme-context,profile-age,profile-meta-line}` + 4 Testfiles | Symbole lt. Plan | ✓ VERIFIED | Alle Symbole vorhanden; 64/64 Tests grün (benannter Lauf, carry-forward) |
| `packages/db/src/schema/visitor-profile.ts` | `birthDate` + `.extend()`-Caps | ✓ VERIFIED | inkl. WR-02-Constraint (carry-forward) |
| `packages/db/drizzle/0004_new_wong.sql` | Additive Migration, committet | ✓ VERIFIED | Drei `ADD COLUMN`, nichts geändert (carry-forward) |
| `packages/contracts/src/schemas.ts` | `createdAt` + Identitätsfelder | ✓ VERIFIED | `.pick()` von drizzle-zod-Basis (carry-forward) |
| `packages/ui/src/tokens.ts` | `fillInfoQuiet`/`borderInfo` | ✓ VERIFIED | Z. 277–278 (carry-forward) |
| `apps/api/src/me/{me.controller,me.service}.ts` | `toISOString` / Feld-Projektionen | ✓ VERIFIED | inkl. WR-03-Diskriminierung (carry-forward) |
| `apps/mobile/app/(profile-setup)/complete-profile.tsx` | Drei optionale Felder + Picker | ✓ VERIFIED | inkl. `toLocalDateOnly` lokal (carry-forward) |
| `docs/DEVELOPMENT_DECISIONS.md` + `docs/brand/quiks-ci-v1.md` + `CLAUDE.md` | ADR-023-Erweiterung | ✓ VERIFIED | Alle drei nachgezogen (carry-forward) |
| `apps/mobile/locales/{de,en}/messages.po` | Vollständige Kataloge | ✓ VERIFIED | 1 leeres msgstr = Header; SafeNow 2/2 (carry-forward) |
| **`apps/mobile/index.js`** (06-10) | Custom Entry, exakt 2 Side-Effect-Imports | ✓ VERIFIED | 13 Zeilen; `./lib/intl-polyfill` Z. 12 VOR `expo-router/entry` Z. 13; T-06-10-01-Warnung im Header |
| **`apps/mobile/lib/intl-capability.ts`** (06-10) | Zero-Import-Probe des nativen Engine-Werts | ✓ VERIFIED | 21 Zeilen, null Imports, Capture Z. 21; Hoisting-Begründung im Header korrekt |
| **`apps/mobile/lib/intl-polyfill.ts`** (06-10) | forced variant + de/en Locale-Daten, Log, fail-fast | ✓ VERIFIED | 65 Zeilen; Importreihenfolge Z. 42–45 lastbedingt dokumentiert; Log Z. 52–55; `throw` Z. 60–65 |
| **`apps/mobile/lib/__tests__/intl-polyfill.test.ts`** (06-10) | 5-Assertionen-Rückfall-Guard | ✓ VERIFIED | 98 Zeilen; vom Verifier selbst gefahren: 5/5 passed; zwei getragene Robustheits-Warnings (s. o.) |

### Key Link Verification

| From | To | Via | Status |
| --- | --- | --- | --- |
| `mehr.tsx` | `profil.tsx` | `router.push('/profil')` | ✓ WIRED (carry-forward) |
| `_layout.tsx` | `profil.tsx` | `Stack.Screen name="profil"` im authenticated-Guard | ✓ WIRED (carry-forward) |
| `profil.tsx` / `friends.tsx` | `api-client.ts` | `useQuery(['me'])` → `getMe()` — geteilter Cache-Key | ✓ WIRED (carry-forward) |
| `FloatingNav.tsx` | `(tabs)/_layout.tsx` | `state.routes` liefert vier Live-Routen | ✓ WIRED (carry-forward) |
| `_layout.tsx` | `SoonToast.tsx` | `<ToastProvider>` innerhalb ThemeProvider | ✓ WIRED (carry-forward) |
| `mehr.tsx` | `theme-context.tsx` | `useThemeOverride` / `setThemeOverride` | ✓ WIRED (carry-forward) |
| `theme-context.tsx` | `theme.ts` + `theme-override-storage.ts` | `resolveEffectiveThemeMode` + `(get\|save)ThemeOverride` | ✓ WIRED (carry-forward) |
| `theme.ts` (system-Zweig) | `resolveThemeMode` | `return resolveThemeMode(scheme)` — 05.1-Invariante | ✓ WIRED (carry-forward) |
| `profil.tsx` | `AvatarSunsetRing` / `profile-meta-line` / `festival-queries` | Ring, Builder, Cache-Read | ✓ WIRED (carry-forward) |
| `AvatarSunsetRing.tsx` | `tokens` | `gradientSunset` | ✓ WIRED (carry-forward) |
| `me.controller.ts` | contracts | `contract.getMe` via `TsRestHandler` | ✓ WIRED (carry-forward) |
| `me.service.ts` | db-Schema | `visitorProfile.(pronoun\|birthDate\|gender)` in select+returning | ✓ WIRED (carry-forward) |
| `complete-profile.tsx` | contracts | `pronoun`/`birthDate`/`gender` im Request-Body | ✓ WIRED (carry-forward) |
| **`package.json` `main`** (06-10) | **`index.js`** | `"main": "index.js"` (Z. 5) — der Expo-dokumentierte Custom-Entry-Mechanismus | ✓ WIRED |
| **`index.js`** (06-10) | **`lib/intl-polyfill.ts` → `expo-router/entry`** | Side-Effect-Imports in lastbedingter Reihenfolge (Z. 12–13); Guard-Assertion 3 sichert die Ordnung | ✓ WIRED |
| **`lib/intl-polyfill.ts`** (06-10) | **`lib/intl-capability.ts`** | Import an Position 1 (Z. 42) — Probe beobachtet die rohe Engine VOR dem Polyfill | ✓ WIRED |
| **`SUPPORTED_LOCALES` (@quiks/i18n)** (06-10) | **Locale-Data-Imports in `intl-polyfill.ts`** | gekoppelt durch Guard-Assertion 5 (iteriert das echte Array) — drittes Locale ohne Daten macht die Suite rot | ✓ WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Status |
| --- | --- | --- | --- |
| Profil-Kopf + Konto-Zeilen | displayName/@username/email/createdAt/Identitätsfelder | `useQuery(['me'])` → NestJS → Drizzle-Select | ✓ FLOWING (carry-forward) |
| Friends quiks-Code-Karte | `@username` | derselbe `['me']`-Cache-Eintrag | ✓ FLOWING (carry-forward) |
| Meta-Zeile Festivals-Zahl | `festivalKeys.mine`-Cache | nicht-reaktiver `getQueryData`-Read, 0 bei kaltem Cache | ⚠️ bewusst (IN-05, akzeptiert) |
| Meta-Zeile Plural-Formen (06-10) | ICU-Plural-Kategorien | `plural()` → Lingui → `Intl.PluralRules` (jetzt polyfilled ab Entry) | ✓ FLOWING — Kette am Gerät belegt (Log-Zeile + Screen rendert); byte-exakte Zeichenkette nicht transkribiert (s. o.) |
| Friends-Blöcke / Profil-Ausblick-Blöcke | keine | absichtsvolle Platzhalter (D-11/D-02) | — by design (WINDOWS 36/37, open) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Theme-Override + 05.1-Invariante, Altersableitung, Meta-/Identitätszeile, Storage-Fehler-Fallback | `npx vitest run lib/__tests__/{theme,profile-age,profile-meta-line,theme-override-storage}.test.ts` | 4 files, **64/64 passed** (Erstverifikation) | ✓ PASS (carry-forward) |
| Monorepo-Gate (Post-Fix-Baum, Stand Erstverifikation) | `pnpm test --force` / `lint` / `typecheck` | 7/7 / 10/10 / 10/10 | ✓ PASS (carry-forward) |
| WR-02-Negativfälle | `it.each` 6 Fälle in `me-endpoints.spec.ts` | Teil der api 55/55 | ✓ PASS (carry-forward) |
| Fix-Commits (Erstverifikation) | `git log` `6707cf9`/`8790e1c`/`53c09dc`/`8db31c9`/`4f14feb` | alle fünf in der Historie | ✓ PASS (carry-forward) |
| **06-10 Rückfall-Guard** | `npx vitest run lib/__tests__/intl-polyfill.test.ts` | 1 file, **5/5 passed** (637ms) | ✓ PASS (**vom Verifier in DIESER Re-Verifikation selbst gefahren, nicht aus SUMMARY übernommen**) |
| **06-10 Commits existieren** | `git log --oneline -1 3c7c120` / `568a9db` | beide in der Historie | ✓ PASS (selbst gefahren) |
| **`profil.tsx` unverändert durch 06-10** | `git diff --stat ee283f0 HEAD -- apps/mobile/app/profil.tsx` | leer | ✓ PASS (selbst gefahren) |
| **Änderungsumfang seit Erstverifikation** | `git diff --stat ee283f0 HEAD -- apps packages docs CLAUDE.md` | exakt die 5 06-10-Dateien, +199/−1 | ✓ PASS (selbst gefahren — begründet den Carry-Forward) |

### Probe Execution

SKIPPED — keine `scripts/*/tests/probe-*.sh` im Repo, keine Probe in PLAN/SUMMARY deklariert (unverändert zur Erstverifikation).

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| HOME-03 | 06-01, 06-05, 06-06, 06-09 | Navigation zu Profile und Friends | ✓ SATISFIED (per D-01 über die globale Tab-Leiste, user-locked) | Truths 1–2 |
| PROF-01 | 06-01, 06-02, 06-03, 06-07, 06-08, 06-09, **06-10** | View-only Profil-Screen | ✓ SATISFIED | Truths 3–5, 11–14, **18** — der Screen ist seit 06-10 am Gerät überhaupt erst erreichbar; vorher blockierte der Crash jeden Zugriff |
| FRND-01 | 06-01, 06-04, 06-06, 06-09 | Friends-Leerzustand, klar und nicht kaputt | ✓ SATISFIED (per D-10 global, user-locked) | Truth 6 |
| — | — | Orphaned requirements | keine | REQUIREMENTS.md mappt für Phase 6 exakt diese drei IDs; IDN-02 bleibt korrekt als eigenes Requirement offen (carry-forward) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| — | — | `TBD`/`FIXME`/`XXX` in Phase-Dateien | — | **0 Treffer** (carry-forward; die fünf 06-10-Dateien wurden gelesen und tragen ebenfalls keine) |
| `apps/api/test/me-endpoints.spec.ts` | 78 | Stale Kommentar „a repeat call is the 409 proven below" widerspricht WR-03 | ℹ️ Info | carry-forward, unverändert |
| bekannte IN-01…IN-05 (06-REVIEW) | div. | u. a. unhandled `Linking.openURL`, QR-Duplikat, nicht-reaktiver Cache-Read | ℹ️ Info | Vom User außerhalb des Fix-Scopes gelassen — unverändert |
| WINDOWS 32 (T-06-06) | `schemas.ts` | `visitorProfilePublicSchema` trägt `birthDate`/`gender` ohne Sichtbarkeits-Policy | ⚠️ getragen | Unverändert: heute ausschließlich owner-bound serviert; MUSS vor dem ersten Fremdprofil-Endpoint (FRND-02/PROF-02) gesplittet werden |
| `lib/__tests__/intl-polyfill.test.ts` (06-10-REVIEW W1) | 63–96 | Guard-Matcher blind gegen AUSKOMMENTIERTE Imports (Comment-out-Bypass bliebe grün) | ⚠️ getragen | Härtungs-Follow-up (zeilenverankerte Regexes vorgeschlagen); die dokumentierten Regressionspfade Revert/Löschung/Suffix-Drop/fehlendes Locale sind gedeckt und falsifiziert |
| `lib/__tests__/intl-polyfill.test.ts` (06-10-REVIEW W2) | 59–73 | Kein Import-Count in `index.js` — ein DRITTER Import (Supply-Chain-Position) entginge dem Guard, obwohl T-06-10-01 „any added import" deklariert | ⚠️ getragen | Threat-Register-Mitigation für den „added"-Fall existiert nur in der Review-Spur; Fix-Vorschlag (Array-`toEqual` auf alle Import-Statements) liegt vor |
| `lib/intl-polyfill.ts` (06-10-REVIEW IN-01) | 43 | `polyfill-force` überschreibt auch native Implementierungen (Web-Target, künftiges Hermes) | ℹ️ Info | Ausdrücklich theoretisch; kein konstruierbares Failure-Szenario im aktuellen Code; Force-Entscheidung fürs Geräte-Target korrekt begründet |

### Security

`06-SECURITY.md` (2026-08-12, status `verified`): **threats_open 0, 44/44 closed** — der Register umfasst die `<threat_model>`-Blöcke aller ZEHN Pläne inklusive 06-10 (npm-Registry→Bundle, App-Entry→Route-Module als Trust Boundaries geführt). Das 06-10-Package-Legitimacy-Gate (Task 1, nie auto-approvable) wurde vom User vor dem Install mit „approved" freigegeben (npmjs.com geprüft: FormatJS-Org, Millionen Downloads, kein Typosquat); der `pnpm-lock.yaml`-Diff ist laut 06-10-REVIEW (Kernbehauptung 4) auf `@formatjs/intl-pluralrules` + drei FormatJS-Transitives beschränkt.

### Human Verification — RESOLVED

Alle fünf Human-Items der Erstverifikation sind durch die abgeschlossene UAT (`06-UAT.md`, status `complete`, 5/5 pass, 0 Issues, updated 14:35Z) geschlossen. Zuordnung, mit Evidenzquelle und -stärke:

| Offenes Item (Erstverifikation) | UAT-Test | Ergebnis | Wirkung |
| --- | --- | --- | --- |
| WR-01 — Dark-Switch auf System-Dark-Gerät (force-quit + Relaunch) | Test 1 | pass | Truth #9: letzter offener Gerätebeweis erbracht |
| CR-01 — Logout→Login-Cache-Probe, zwei Konten | Test 2 | pass | Truth #16: ⚠️ PRESENT_BEHAVIOR_UNVERIFIED → ✓ VERIFIED |
| WR-04 — SoonToast mit iOS-VoiceOver | Test 3 | pass | Truth #10: ⚠️ PRESENT_BEHAVIOR_UNVERIFIED → ✓ VERIFIED |
| Backstop — maximal lange Identitätswerte | Test 4 | pass | Truth #17: ? UNCERTAIN → ✓ VERIFIED |
| Prohibition-Review (judgment-tier, 4 Urteile a–d) | Test 5 | pass | `unverified-prohibition`-Flag aufgelöst: explizite menschliche Bestätigung aller vier Urteile. Laut `note`: (a)/(b) im ersten Durchlauf bestätigt; (c)/(d) waren vom G-06-5-Crash blockiert und wurden nach dem 06-10-Fix am 2026-08-12 vom User **re-beurteilt** — nicht aus der Geräteabnahme des Fixes übernommen, genau wie 06-10-PLAN/SUMMARY es verlangten |

**Evidenzstärke:** Alle fünf sind menschliches Sign-off am echten Gerät — itemisierte UAT-Ergebnisse, keine automatisierten Beweise. Sie werden hier als das geführt, was sie sind; kein Item wurde zu automatisierter Evidenz aufgewertet. Es verbleiben **keine** offenen Human-Verification-Items — die Voraussetzung für `passed`.

### Gaps Summary

Keine Gaps. Alle 18 Truths sind verifiziert (14 automatisiert/code-basiert aus der Erstverifikation carry-forward, 1 neu code- + geräteverifiziert für Plan 06-10, 3 durch itemisiertes menschliches UAT-Sign-off geschlossen, Truth #9s Restbeweis ebenso). Kein Artefakt fehlt oder ist Stub, keine Key-Link ist unverdrahtet, `threats_open: 0`. Der einzige während der UAT gefundene Blocker (G-06-5) ist durch Plan 06-10 geschlossen, geräteverifiziert und in `06-UAT.md` als `resolved` geführt.

**Offene, bereits getragene Punkte (keine Phase-6-Gaps):** WINDOWS 32 (Profilprojektion vor FRND-02/PROF-02 splitten), WINDOWS 33/34/35 (`waived` auf Basis der Pauschalabnahme — ehrlich so geführt), WINDOWS 36/37 (absichtsvolle Platzhalter bis FRND-02/PROF-02), Tab-Umbenennung „Home"→„Start" (nicht beauftragt, offene Frage im STATE), die zwei 06-10-Guard-Härtungen (Comment-out-Bypass, Import-Count — 06-10-REVIEW W1/W2), und die nie transkribierte Meta-Zeile aus 06-10 Task 4 Schritt 4.

---

_Verified: 2026-08-12T14:45:00Z (Re-Verifikation; Erstverifikation 2026-08-12T10:10:00Z)_
_Verifier: Claude (gsd-verifier)_
