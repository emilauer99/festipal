---
phase: 06-profile-friends-placeholders
reviewed: 2026-08-12T09:41:34Z
depth: deep
files_reviewed: 40
files_reviewed_list:
  - CLAUDE.md
  - apps/api/src/me/me.controller.ts
  - apps/api/src/me/me.service.ts
  - apps/api/test/me-endpoints.spec.ts
  - apps/mobile/app.json
  - apps/mobile/app/(profile-setup)/complete-profile.tsx
  - apps/mobile/app/(tabs)/_layout.tsx
  - apps/mobile/app/(tabs)/festivals.tsx
  - apps/mobile/app/(tabs)/friends.tsx
  - apps/mobile/app/(tabs)/mehr.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/app/profil.tsx
  - apps/mobile/components/AvatarSunsetRing.tsx
  - apps/mobile/components/AvatarTile.tsx
  - apps/mobile/components/ComingSoonTile.tsx
  - apps/mobile/components/FloatingNav.tsx
  - apps/mobile/components/ListRow.tsx
  - apps/mobile/components/SettingsSwitch.tsx
  - apps/mobile/components/SoonToast.tsx
  - apps/mobile/lib/__tests__/profile-age.test.ts
  - apps/mobile/lib/__tests__/profile-meta-line.test.ts
  - apps/mobile/lib/__tests__/theme-override-storage.test.ts
  - apps/mobile/lib/__tests__/theme.test.ts
  - apps/mobile/lib/profile-age.ts
  - apps/mobile/lib/profile-meta-line.ts
  - apps/mobile/lib/theme-context.tsx
  - apps/mobile/lib/theme-override-storage.ts
  - apps/mobile/lib/theme.ts
  - apps/mobile/locales/de/messages.po
  - apps/mobile/locales/en/messages.po
  - apps/mobile/package.json
  - docs/DEVELOPMENT_DECISIONS.md
  - docs/brand/quiks-ci-v1.md
  - packages/contracts/src/schemas.ts
  - packages/db/drizzle/0004_new_wong.sql
  - packages/db/drizzle/meta/0004_snapshot.json
  - packages/db/drizzle/meta/_journal.json
  - packages/db/src/schema/visitor-profile.ts
  - packages/ui/src/tokens.ts
  - pnpm-lock.yaml
findings:
  critical: 1
  warning: 4
  info: 5
  total: 10
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-08-12T09:41:34Z
**Depth:** deep
**Files Reviewed:** 40
**Status:** issues_found

## Summary

Deep Review der Phase-6-Implementierung (Profil-Screen, Mehr-Screen, Friends-Placeholder, Vier-Tab-Shell, drei optionale Identitätsfelder, Theme-Override) inkl. Cross-File-Analyse der Aufrufketten (`profil.tsx`/`friends.tsx` → `api-client` → `contracts` → `me.controller`/`me.service` → `visitor-profile`-Schema → Migration 0004) sowie der Logout- und Theme-Pfade.

Der handwerkliche Zustand ist hoch: Die reinen Helfer (`deriveAge`, `buildIdentityLine`, `parseThemeOverride`, Theme-Auflösung) sind korrekt, an den echten Grenzfällen getestet (29. Februar, Alter 0, Zukunftsdatum, manipulierter Storage-Wert) und die Hell-first-Invariante ist byte-genau erhalten. Die Migration 0004 stimmt mit Snapshot und Journal überein, die Lingui-Kataloge sind vollständig (170/170 msgids, DE ohne leere `msgstr`, ICU-Placeholder-Namen stimmen mit den Render-Bindings überein), und die `@react-native-community/datetimepicker@9.1.0`-Props (`onValueChange`/`onDismiss`/`startOnYearSelection`) existieren im installierten Paket. Die T-06-06-Prüfung bestätigt: `visitorProfilePublicSchema` wird in diesem Scope ausschließlich owner-gebunden serviert (`MeService.getProfile(session.user.id)`, kein Fremdprofil-Pfad) — kein neuer Befund über die bekannte Akzeptanz hinaus.

Gefunden wurden dennoch ein kritischer Befund (Cross-Account-Datenrest im React-Query-Cache über den Logout hinweg — eine Lücke, die genau die in dieser Phase neu gebauten `/me`-rendernden Screens zur Exposition bringt) sowie vier Warnings: ein auf Dark-Geräten toter Dark-Mode-Switch, eine Server-Validierungslücke bei `birthDate`, eine 409-Ambiguität mit Festfahr-Potenzial im First-Login-Flow und eine iOS-Accessibility-Lücke des SoonToast.

## Critical Issues

### CR-01: React-Query-Cache überlebt den Logout — Fremd-Account kann `/me`-Daten (E-Mail, Geburtsdatum, Gender) des Vorgängers sehen

**File:** `apps/mobile/app/(tabs)/mehr.tsx:98-121` (Fix-Site), `apps/mobile/app/_layout.tsx:398-403`, `apps/mobile/lib/query-client.ts:11`
**Issue:** `handleLogout` härtet den Sign-out in drei Punkten (Re-Entrancy-Guard, `forceUnauthenticated()`, `clearActiveFestivalSlug()`), aber der modul-globale `queryClient` wird nirgends geleert — es gibt im gesamten `apps/mobile` keinen `queryClient.clear()`/`removeQueries()`-Aufruf. Der `['me']`-Cache-Eintrag (angelegt von Profil, Friends oder Complete-Profile) enthält `email`, `birthDate`, `pronoun`, `gender` und `displayName` des Accounts A. Meldet sich auf demselben Gerät innerhalb des gc-Fensters (React-Query-Default `gcTime` 5 min nach Unmount des letzten Observers) Account B an und öffnet Profil oder Friends, liefert `useQuery({ queryKey: ['me'] })` sofort As Daten als `status: 'success'` und rendert sie, während der Refetch läuft. Schlägt der Refetch fehl (Festival-Szenario: Netz weg direkt nach Login), bleibt der Query im Success-Zustand mit As Daten — Account B sieht dann **dauerhaft** As vollständige Identität inkl. E-Mail-Adresse und Geburtsdatum. Gleiches gilt für `festivalKeys.mine` (`['me','festivals']`): Bs Home/Festivals-Tab zeigt As gespeicherte Festivals als optimistischen Startzustand. Phase 5 hat exakt dieses Szenario für den Cold-Start-Redirect (CR-01 05-REVIEW) und den Active-Festival-Slug (05-05 LOW) gefixt — der Query-Cache ist der verbliebene dritte Kanal, und Phase 6 hat mit Profil/Friends erstmals Screens gebaut, die ihn mit personenbezogenen Daten füllen und rendern.
**Fix:** Cache beim Übergang nach `unauthenticated` leeren — am robustesten im bereits existierenden Reset-Effekt in `app/_layout.tsx`, der beide Logout-Pfade (natürlich + `forceUnauthenticated()`) abdeckt:
```tsx
// app/_layout.tsx — im CR-01-(05)-Reset-Effekt
useEffect(() => {
  if (authState.status === 'unauthenticated') {
    coldStartRedirectRef.current = false;
    setColdStartTarget(null);
    // Kein Account-Datum überlebt den Logout im Query-Cache —
    // ['me'] trägt E-Mail/birthDate/gender des Vorgänger-Accounts.
    queryClient.clear();
  }
}, [authState.status]);
```
(Alternativ in `handleLogout` selbst; der Effekt-Ort deckt zusätzlich den Fall „Server verwirft Session → unauthenticated" ab. Achtung: `queryClient.clear()` beim initialen `unauthenticated`-Cold-Start ist ein No-op und unschädlich.)

## Warnings

### WR-01: Dark-Mode-Switch ist auf Geräten mit System-Dark-Scheme ein toter Schalter — Ausschalten bewirkt nichts

**File:** `apps/mobile/app/(tabs)/mehr.tsx:84-88`, `apps/mobile/lib/theme.ts:98-105`
**Issue:** Der Switch spiegelt den **effektiven** Modus (`isDarkMode = mode === 'dark'`), schreibt beim Ausschalten aber `'system'`. Auf einem Gerät, dessen System-Scheme `dark` ist, gilt: Override `'system'` → `resolveEffectiveThemeMode('system', 'dark')` → `'dark'` → `isDarkMode` bleibt `true` → der Switch springt sofort (bzw. ohne jede sichtbare Reaktion) auf AN zurück. Dark Mode lässt sich in der App auf solchen Geräten **nicht deaktivieren**. Das D-08a-Kommentar dokumentiert zwar, dass der dritte Zustand `'light'` „diese Phase keinen Writer hat" — die Konsequenz ist aber genau der von T-06-22 verbotene Zustand: ein Control, das eine Interaktion annimmt und nichts davon einlöst, auf dem betroffenen Gerätetyp dauerhaft. Anders als die `disabled`+Badge-Placeholder ist dieser Switch als voll funktionsfähig ausgewiesen.
**Fix:** Beim Ausschalten `'light'` statt `'system'` schreiben (der Typ und die Persistenz existieren bereits; `resolveEffectiveThemeMode` behandelt `'light'` korrekt):
```tsx
function handleDarkModeChange(next: boolean) {
  setThemeOverride(next ? 'dark' : 'light');
}
```
Falls „off = Gerät folgt" als Produktentscheidung bleiben soll, muss der Switch stattdessen das **Override** spiegeln (`override === 'dark'`) — dann ist er auf einem Dark-Gerät ehrlich AUS und das Gerät liefert Dark weiterhin. Eine der beiden Varianten; der Ist-Zustand ist die einzige Kombination, die einen toten Schalter erzeugt.

### WR-02: `birthDate` im Contract ist ein unbeschränkter `z.string()` — fehlerhafte Werte werden zum 500, Postgres-Sonderformate werden still gespeichert

**File:** `packages/db/src/schema/visitor-profile.ts:112`, `apps/api/src/me/me.service.ts:44-69`
**Issue:** `birthDate: z.string().nullable().optional()` trägt weder Format-Regex noch Längen-Cap. Der Schema-Kommentar (T-06-09) verlässt sich darauf, dass „Postgres' own `date` type parses and validates" — das hat zwei Löcher: (1) Ein von PG **abgelehnter** Wert (`"2020-02-30"`, `"kein-datum"`, `""`) wirft im `completeProfile`-Insert einen Treiberfehler, der nicht Code `23505` trägt, im `catch` re-thrown wird und als **500** beim Client ankommt statt als 400-Validierungsfehler — der Mobile-Client zeigt dann die irreführende „Can't reach the server"-Copy. (2) Ein von PG **akzeptierter** Nicht-`YYYY-MM-DD`-Wert wird still gespeichert: PG parst u. a. `'infinity'`, `'epoch'`, `'today'`, `'08/12/2026'` und `'5000-01-01'` als gültige `date`-Werte; `'infinity'` round-trippt als String `"infinity"` in `GET /me`. Der Client verkraftet das (`deriveAge` liefert `null`), aber der Server verletzt seine eigene Doktrin, die für `pronoun`/`gender` explizit gilt („der Server ist das echte Gate", T-06-07): Für `birthDate` ist das Client-`maximumDate` die einzige Zukunfts-/Formatgrenze, und jeder andere Client kann beliebige PG-Datumsdialekte oder Zukunftsdaten persistieren.
**Fix:** Format serverseitig festnageln (kanonische Transportform, konsistent mit dem Kommentar in `me.service.ts:23-25`):
```ts
birthDate: z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
  .nullable()
  .optional(),
```
Optional zusätzlich ein `.refine` gegen kalendarisch ungültige/zukünftige Daten — mindestens das Regex schließt aber 500er und Sonderformate; kalendarisch Ungültiges wird dann von PG mit einem klar attribuierbaren Fehler abgelehnt, den man in `completeProfile` sauber mappen kann.

### WR-03: Jede 23505-Verletzung wird zu „Username already taken" — nach Timeout-mit-Server-Erfolg sitzt der Visitor in einer 409-Schleife fest

**File:** `apps/api/src/me/me.service.ts:61-69`, `apps/api/src/me/me.controller.ts:43-45`, `apps/mobile/app/(profile-setup)/complete-profile.tsx:298-304`
**Issue:** Der Catch in `completeProfile` mappt **jeden** `23505` auf `conflict` — sowohl den Unique-Index `visitor_profile_username_lower_unq` (echter Username-Konflikt) als auch den Primary-Key `visitor_profile_pkey` auf `accountId` („Profil existiert bereits"). Der Controller antwortet in beiden Fällen `409 „Username already taken"`, und der Mobile-Client interpretiert jeden 409 als Username-taken (setzt `conflict`, generiert eine Ausweich-Suggestion). Konkreter Fehlpfad: `handleDone` läuft mit `withTimeout` — timed der Request aus, obwohl der Server den Insert durchgezogen hat (langsames Festival-WLAN), sieht der Visitor den Netzwerkfehler, bleibt auf dem Screen (der Guard steht weiter auf `authenticated-no-profile`, weil `refreshAuthState()` nie lief) und **jeder** weitere Submit — auch mit der angebotenen freien Suggestion — trifft den `accountId`-PK → 409 → „@x is already taken". Der Visitor kann diesen Screen bis zum App-Neustart nicht mehr verlassen und bekommt dabei eine faktisch falsche Fehlermeldung. Der Test `me-endpoints.spec.ts:146-159` beweist genau dieses Mapping (Repeat-Call → 409) und zementiert damit die Ambiguität, statt sie aufzudecken.
**Fix:** Die beiden Konfliktquellen am `constraint_name` trennen und den „Profil existiert schon"-Fall idempotent auflösen:
```ts
if (cause instanceof PostgresError && cause.code === '23505') {
  if (cause.constraint_name === 'visitor_profile_username_lower_unq') {
    return { status: 'conflict' };
  }
  // accountId-PK: Profil existiert bereits (z. B. Timeout-Retry) —
  // idempotent das vorhandene Profil zurückgeben.
  const existing = await this.getProfile(accountId);
  if (existing) return { status: 'ok', profile: existing };
  return { status: 'conflict' };
}
```
Damit landet der Retry im 200-Pfad, der Client ruft `refreshAuthState()` und der Guard löst regulär nach `authenticated` auf — ohne Client-Änderung.

### WR-04: SoonToast ist für iOS-VoiceOver stumm — `accessibilityLiveRegion` ist ein Android-only-Prop

**File:** `apps/mobile/components/SoonToast.tsx:127`
**Issue:** Das einzige app-weite „kommt bald"-Feedback (D-13) verkündet sich per `accessibilityLiveRegion="polite"` — dieses Prop existiert nur auf Android. Auf iOS ist das Toast rein visuell: Ein VoiceOver-Nutzer, der eine der vielen Placeholder-Zeilen antippt (Payment methods, Language, Share handle, Show QR, Suche …), bekommt **keinerlei** Rückmeldung — genau die „tote Interaktion", die T-06-18 verhindern soll, für die halbe Gerätebasis. Die per-Element-`accessibilityLabel`s („…, coming soon") mildern das, ersetzen aber die Reaktions-Ansage auf den Tap nicht.
**Fix:** In `show()` zusätzlich imperativ ansagen — deckt beide Plattformen ab (`announceForAccessibility` funktioniert auch auf Android und ist dort mit der Live-Region redundant, nicht schädlich):
```tsx
import { AccessibilityInfo } from 'react-native';

const show = useCallback<ShowSoonToast>((next) => {
  if (timerRef.current !== null) clearTimeout(timerRef.current);
  setMessage(next);
  AccessibilityInfo.announceForAccessibility(next);
  timerRef.current = setTimeout(() => { /* … */ }, TOAST_DURATION_MS);
}, []);
```

## Info

### IN-01: `Linking.openURL` ohne Rejection-Handling

**File:** `apps/mobile/app/(tabs)/mehr.tsx:274`
**Issue:** `void Linking.openURL(SAFENOW_URL)` verwirft das Promise; schlägt das Öffnen fehl (kein Browser/eingeschränktes Profil), entsteht eine Unhandled Rejection und der Tap bleibt kommentarlos wirkungslos.
**Fix:** `.catch((error) => console.error('openURL failed:', error))` anhängen (Projekt-Konvention „console.error() für Fehler"); optional das SoonToast-Pattern als Nutzer-Feedback.

### IN-02: QR-Placeholder-Konstrukt in zwei Screens dupliziert

**File:** `apps/mobile/app/profil.tsx:48-63,577-592`, `apps/mobile/app/(tabs)/friends.tsx:27-43,419-432`
**Issue:** `QR_CELL_SIZE`/`QR_GRID_SIZE`/`QR_PLACEHOLDER_SIZE`/`QR_PATTERN` plus die Styles `qrPlaceholder`/`qrCell`/`qrCellFilled` existieren zweimal, mit bereits divergierender Zellgröße (14 vs. 16). Der ausführliche „encodes nothing"-Begründungskommentar ist ebenfalls doppelt gepflegt.
**Fix:** Als eigene Komponente (`components/QrPlaceholderMark.tsx` mit `cellSize`-Prop) extrahieren — ein Ort für Muster, Begründung und Accessibility-Label.

### IN-03: Badge-Style und Pattern-A-Opacity vierfach dupliziert

**File:** `apps/mobile/components/ComingSoonTile.tsx`, `components/ListRow.tsx:21`, `components/SettingsSwitch.tsx:15`, `app/profil.tsx:43,634-643`, `app/(tabs)/friends.tsx:25,350-359`
**Issue:** Die „Soon"-Badge-Styles sind laut eigenem Kommentar „verbatim gespiegelt" in fünf Dateien, und `0.45` (Pattern-A-Dämpfung) ist als lokale Konstante in vier Dateien wiederholt. Eine Design-Anpassung muss heute fünf Stellen synchron treffen.
**Fix:** Badge als kleines Primitive (oder die Werte als Token, z. B. `opacityDisabled` in `packages/ui/src/tokens.ts`) zentralisieren.

### IN-04: Contract akzeptiert weiterhin ein unbegrenztes `avatar`-Feld, das per D-01 nie den Server erreichen darf

**File:** `packages/contracts/src/schemas.ts:111-118`, `packages/db/src/schema/visitor-profile.ts:106`
**Issue:** `completeProfileBodySchema` pickt `avatar` (`z.string().nullable().optional()`, ohne Längen-Cap), obwohl D-01 das Avatar ausdrücklich device-lokal hält und der Mobile-Client es nie sendet. Ein beliebiger Client kann damit einen unbegrenzt langen String in `visitor_profile.avatar` persistieren, der über `GET /me` zurückgespielt wird.
**Fix:** `avatar` aus dem Body-Pick entfernen (die Spalte bleibt für später) oder mindestens `.max(...)` setzen.

### IN-05: Profil-Festival-Zähler liest den Cache nicht reaktiv

**File:** `apps/mobile/app/profil.tsx:139-146`
**Issue:** `queryClient.getQueryData(festivalKeys.mine)` ist ein einmaliger Read pro Render ohne Subscription: Ändert sich der Cache-Eintrag, während Profil gemountet ist (Save auf einem anderen Screen, Hintergrund-Refetch), aktualisiert sich die Zahl erst beim nächsten zufälligen Re-Render. Der Cold-Cache-Fall („0 Festivals") ist per D-04 dokumentiert akzeptiert und wird hier nicht erneut moniert — die fehlende Reaktivität geht über diese Akzeptanz hinaus, ist aber für einen Push-Screen mit kurzer Verweildauer praktisch geringfügig.
**Fix:** Bei nächster Gelegenheit auf `useQuery({ queryKey: festivalKeys.mine, enabled: false })` (Cache-Subscription ohne Fetch) oder `useQueryClient()` + `useSyncExternalStore`-Idiom umstellen.

---

_Reviewed: 2026-08-12T09:41:34Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
