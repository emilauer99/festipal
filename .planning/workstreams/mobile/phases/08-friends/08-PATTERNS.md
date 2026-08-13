# Phase 8: Friends – Pattern Map

**Erstellt:** 2026-08-13
**Analysierte Dateien:** 10 (neu/geändert)
**Analoga gefunden:** 9 / 10

## File Classification

| Neue/geänderte Datei | Rolle | Data Flow | Nächstliegendes Analogon | Match-Qualität |
|---|---|---|---|---|
| `apps/mobile/app/(tabs)/friends.tsx` | screen (component) | request-response (mehrere Queries) | eigene Vorgängerversion (dieselbe Datei, Phase 6) | exakt (wird umgeschrieben, kein fremdes Analogon nötig) |
| `apps/mobile/app/friends-qr.tsx` **NEU** | screen (component), root-level Stack | request-response + device-I/O (Kamera) | `apps/mobile/app/profil.tsx` (root-level `Stack.Screen`-Muster) | rollen-match |
| `apps/mobile/app/friend-detail.tsx` **NEU** | screen (component), modal | request-response (kein eigener Fetch, Cache-Read) | `apps/mobile/app/profil.tsx` (Identity-Card-Aufbau) | rollen-match |
| `apps/mobile/components/PersonRow.tsx` **NEU** | component | CRUD-Zeile (drei Listen) | `apps/mobile/components/ListRow.tsx` | rollen-match (Zeilen-Primitive, kein Icon-Slot nötig) |
| `apps/mobile/components/QRMark.tsx` **NEU** | component | transform (Payload → Grafik) | `apps/mobile/app/(tabs)/friends.tsx`'s bestehender QR-Placeholder-Block (Z. 27–43, 226–242) | rollen-match (Geometrie-Konstanten-Muster, kein Rendering-Analogon) |
| `apps/mobile/components/CameraScanPanel.tsx` **NEU** | component, native permission | event-driven (Kamera-Callback) + permission-request | `apps/mobile/app/(tabs)/mehr.tsx`'s Info-Callout-Block (Z. 258–296) für den Denied-Zustand | teil-match (kein Kamera-Analogon existiert) |
| `apps/mobile/lib/friend-queries.ts` **NEU** | service (Query-Key-Factory + unwrap) | request-response | `apps/mobile/lib/festival-queries.ts` | exakt |
| `apps/mobile/lib/friend-sort.ts` **NEU** | utility (pure logic) | transform | `apps/mobile/lib/profile-meta-line.ts` (Lingui-freie, getestete `lib/`-Logik) + `apps/mobile/lib/intl-capability.ts` (Capability-Capture-Pattern) | rollen-match |
| `apps/mobile/lib/qr-payload.ts` **NEU** | utility (pure logic) | transform | `apps/mobile/lib/profile-meta-line.ts` (gleiche Bauform: reine, node-env-testbare Funktion) | rollen-match |
| `apps/mobile/components/AvatarTile.tsx` **GEÄNDERT** | component | — | ist bereits die Datei selbst | exakt |
| `apps/mobile/app.json` **GEÄNDERT** (Kamera-Permission-Plugin) | config | — | eigener `expo-image-picker`-Plugin-Eintrag (Z. 39–45) | exakt |

## Pattern Assignments

### `apps/mobile/app/(tabs)/friends.tsx` (screen, wird umgeschrieben)

**Analogon:** die Datei selbst (Phase-6-Version, komplett gelesen).

**Imports-Muster** (Z. 1–14):
```typescript
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { Search } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { useSoonToast } from '../../components/SoonToast';
import { apiClient } from '../../lib/api-client';
import { fontFamilyForRole } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import type { ThemeColors } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';

const { typeRoles, layout, radiiScale, spacingScale } = tokens;
```
Für Phase 8 zusätzlich: `useMutation`, `useQueryClient` aus `@tanstack/react-query`; `friendKeys`/`unwrapOk` aus `lib/friend-queries.ts`; `sortFriendsByDisplayName` aus `lib/friend-sort.ts`; `PersonRow` aus `components/PersonRow.tsx`; `useRouter` aus `expo-router` (Navigation zum QR-Screen/Friend-Detail). `useSoonToast` entfällt für die drei jetzt echten Blöcke, bleibt aber importierbar für andere Screens (Component Inventory: „Mechanismus bleibt verfügbar").

**Der zentrale State-Ableitungs-Pattern, unbedingt beibehalten** (Z. 56–59, 115–131):
```typescript
type QuiksCodeViewState =
  | { kind: 'loading' }
  | { kind: 'error'; variant: 'transport' | 'response'; retry: () => void }
  | { kind: 'data'; username: string | undefined };

function computeQuiksCodeState(): QuiksCodeViewState {
  if (meQuery.status === 'pending') return { kind: 'loading' };
  if (meQuery.status === 'error') {
    return { kind: 'error', variant: 'transport', retry: () => void meQuery.refetch() };
  }
  // A non-200 ts-rest result is a SUCCESSFUL React Query result, never
  // `status === 'error'` — branching it explicitly is what stops the card from
  // rendering an empty identity on a real API failure.
  if (meQuery.data.status !== 200) {
    return { kind: 'error', variant: 'response', retry: () => void meQuery.refetch() };
  }
  return { kind: 'data', username: meQuery.data.body.profile?.username };
}
```
Dieses Drei-Zustands-Muster (loading/error/data, mit `variant: 'transport' | 'response'`) ist die vorgeschriebene Schablone für **jeden** der neuen Query-States dieser Phase: Suchergebnisse, Requests-Liste, Crew-Liste. Nicht neu erfinden — pro Query eine analoge `...ViewState`-Union plus `compute...State()`-Funktion.

**`['me']`-Query, exakt wiederverwenden statt duplizieren** (Z. 113):
```typescript
const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiClient.getMe() });
```

**Struktur-/Style-Muster** (Screen-Container, Section-Gaps, Fehler-/Retry-Styles) — komplett aus `createStyles(colors)` (Z. 313–459) übernehmbar: `screen`, `content` (mit `layout.sectionGap`/`layout.scrollBottomPad`), `stateBlock`/`error`/`retryButton`/`retryButtonText`, `section`/`sectionHead`/`emptyBody`. Der `searchField`-Container (Z. 325–336) ist die Basis für das jetzt echte, `editable={true}` Suchfeld — nur `editable`, `value`, `onChangeText` und die Badge-Entfernung ändern sich.

**Was NICHT übernommen wird (D-05/D-06):** der `Chats`-Block (Z. 271–285) und der `People you may know`-Block (Z. 298–307) fallen komplett weg, inkl. ihrer `section`-Wrapper.

---

### `apps/mobile/lib/friend-queries.ts` (service, request-response) — NEU

**Analogon:** `apps/mobile/lib/festival-queries.ts` (komplett gelesen, 45 Zeilen).

**Zu kopierendes Muster — Query-Key-Factory + Unwrap-Helper, Framework-frei:**
```typescript
/** Query-key factory — the single source for these keys across screens. */
export const festivalKeys = {
  all: ['festivals'] as const,
  mine: ['me', 'festivals'] as const,
  detail: (slug: string) => ['festival', slug] as const,
};

export class ApiResponseError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`Unexpected API response status: ${status}`);
    this.name = 'ApiResponseError';
    this.status = status;
  }
}

export function unwrapOk<T>(response: { status: number; body: unknown }): T {
  if (response.status !== 200) {
    throw new ApiResponseError(response.status);
  }
  return response.body as T;
}
```
Für Phase 8 analog: `friendKeys = { search: (q: string) => ['friends', 'search', q] as const, requests: ['friends', 'requests'] as const, list: ['friends', 'list'] as const }` (Namen/Struktur Claude's Discretion, Context-Datei nennt explizit „Query-Keys und Invalidierungsstrategie" als offen). `unwrapOk` direkt wiederverwenden, nicht neu schreiben — er ist generisch und importierbar.

**Kein React-Import in dieser Datei** — bleibt node-env-testbar, gleiches Muster.

---

### `apps/mobile/lib/api-client.ts` (unverändert, aber zentrales Integrationsmuster)

**Analogon:** die Datei selbst.

Alle neun Friend-Endpunkte sind bereits typisiert erreichbar über denselben `apiClient`:
```typescript
export const apiClient = initClient(contract, {
  baseUrl: process.env.EXPO_PUBLIC_API_URL!,
  baseHeaders: { Cookie: () => authClient.getCookie() },
  credentials: 'omit',
});
```
Aufrufmuster (aus `contract`-Namen in `packages/contracts/src/router.ts` Z. 65–147): `apiClient.searchVisitors({ query: { q } })`, `apiClient.lookupVisitor({ params: { username } })`, `apiClient.sendFriendRequest(...)`, `apiClient.acceptFriendRequest(...)`, `apiClient.declineFriendRequest(...)`, `apiClient.withdrawFriendRequest(...)`, `apiClient.listFriends()`, `apiClient.listFriendRequests()`, `apiClient.unfriend(...)`. Kein Client-Code neu schreiben — nur aufrufen.

---

### `apps/mobile/components/PersonRow.tsx` (component, CRUD-Zeile) — NEU

**Analogon:** `apps/mobile/components/ListRow.tsx` (komplett gelesen, 193 Zeilen).

**Struktur-Muster zu übernehmen** (Props-Form, `useMemo(() => createStyles(colors), [colors])`, bedingtes `Pressable` vs. `View`, `accessibilityLabel`-Pflichtprop vom Caller):
```typescript
export type ListRowProps = {
  icon: LucideIcon;
  label: string;
  value?: string;
  danger?: boolean;
  disabled?: boolean;
  badge?: string;
  onPress?: () => void;
  accessibilityLabel: string;
};

export function ListRow({ icon: Icon, label, value, danger = false, disabled = false, badge, onPress, accessibilityLabel }: ListRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  ...
  if (onPress === undefined) {
    return <View style={rowStyle} accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }}>{content}</View>;
  }
  return (
    <Pressable style={rowStyle} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }}>
      {content}
    </Pressable>
  );
}
```
**Wichtige Abweichung laut UI-SPEC:** `PersonRow` braucht **kein** Icon-Slot (nutzt `AvatarTile` size=40 statt `LucideIcon`), aber **einen freien `trailing: ReactNode`-Slot** statt der festen `value`/`badge`/Chevron-Kombination von `ListRow` — UI-SPEC Component Inventory beschreibt `trailing` explizit als Composition-Slot für Button/Chip/Zwei-Button-Gruppe. `onPress` bleibt optional exakt nach demselben Muster (nur Crew-Zeilen sind tappbar, D-09).

**Styling-Konstanten direkt aus `ListRow`/UI-SPEC übernehmen:** `r-card` (22px) statt `ListRow`s `r-md`, `sp-6` Padding, `layout.hitMin`. Für Avatar-Text bei `size={40}` gilt laut UI-SPEC die `label`-Rolle statt `title2`.

---

### `apps/mobile/components/AvatarTile.tsx` (component, GEÄNDERT — `size`-Prop)

**Analogon:** die Datei selbst (komplett gelesen, 109 Zeilen).

**Zu erweiterndes Muster:**
```typescript
export const AVATAR_SIZE = 88;

export type AvatarTileProps = {
  displayName: string;
  username: string;
  localUri?: string;
};

export function deriveInitials(displayName: string, username: string): string {
  const source = displayName.trim() || username.trim();
  if (!source) return '';
  return Array.from(source).slice(0, 2).join('').toUpperCase();
}
```
Neue optionale `size?: 40 | 88` Prop (Default `88`, unverändertes Verhalten für Profil/Friend-Detail). `styles.photo`/`styles.initialsTile` müssen `width`/`height`/`borderRadius` von der Prop statt der Modul-Konstante ableiten; `initialsText`-Fontsize/-Rolle wechselt bei `size={40}` auf `label` statt `title2` (UI-SPEC § Avatar Size Contract). `deriveInitials()` bleibt unverändert und wird an beiden Größen wiederverwendet.

---

### `apps/mobile/lib/friend-sort.ts` (utility, pure logic) — NEU

**Analoga:** `apps/mobile/lib/profile-meta-line.ts` (Lingui-freie, `lib/`-testbare reine Funktionen) + `apps/mobile/lib/intl-capability.ts` (Capability-Capture-Vorbild für den Hermes-`Intl.Collator`-Fallback aus D-12).

**Muster: dokumentierter, deterministischer Pure-Function-Export ohne React/Lingui-Import:**
```typescript
// profile-meta-line.ts
export function buildIdentityLine({ pronoun, age, gender }: IdentityLineInput): string | null {
  const ageFragment = age === null || age === undefined ? null : String(age);
  const line = joinFragments([pronoun, ageFragment, gender]);
  return line.length > 0 ? line : null;
}
```
```typescript
// intl-capability.ts — Capability-Capture VOR jedem Polyfill-Import, zero imports
export const nativePluralRulesCapability: string = typeof Intl.PluralRules;
```
Für `friend-sort.ts`: eine Funktion `sortFriendsByDisplayName(friends: Friend[]): Friend[]`, die `Intl.Collator` versucht und bei Nichtverfügbarkeit/Codepoint-Verhalten auf einen definierten Fallback-Comparator zurückfällt (D-12 warnt explizit, dass `apps/mobile/lib/intl-polyfill.ts` bisher nur `Intl.PluralRules` polyfillt — `Intl.Collator` ist NICHT abgedeckt). Test-Pendant erwartet unter `apps/mobile/lib/__tests__/friend-sort.test.ts`, analog zu `__tests__/profile-meta-line.test.ts` und `__tests__/intl-polyfill.test.ts`.

---

### `apps/mobile/lib/qr-payload.ts` (utility, pure logic, transform) — NEU

**Analogon:** `apps/mobile/lib/profile-meta-line.ts` (gleiche Bauform).

Eine reine Funktion `parseQuiksCodePayload(raw: string): { username: string } | null`, die `quiks:u/<username>` erkennt (Phase-7-D-17-Format) und alles andere als `null` (→ „Das ist kein quiks-Code."-Zustand) zurückgibt, plus die Gegenrichtung `encodeQuiksCodePayload(username: string): string`. Muss vor jedem Netzwerkaufruf laufen (UI-SPEC § QR & Camera Contract, D-14) und ist damit reine, node-env-testbare Logik — wie `profile-meta-line.ts` ohne Lingui-/React-Import.

---

### `apps/mobile/app/friends-qr.tsx` (screen, NEU — Route + Kamera)

**Analogon (Routen-Muster):** `apps/mobile/app/profil.tsx` (Kopfzeilen 1–37 gelesen) als Präzedenzfall für „root-level `Stack.Screen`, versteckt `FloatingNav` automatisch" — UI-SPEC schreibt das explizit fest: „Mirrors the existing `app/profil.tsx` precedent for 'a full-screen destination that hides the tab bar' — root level, not a group under `(tabs)`."

**Imports-Muster von `profil.tsx` (Z. 1–37) übernehmen:**
```typescript
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';
import type { Me } from '@quiks/contracts';

import { apiClient } from '../lib/api-client';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
```
`<Stack.Screen options={{ title: t\`QR-Code\` }} />` ist das Muster für den nativen Header mit Zurück-Chevron (aus `profil.tsx`s Verwendung von `Stack` — im gelesenen Ausschnitt importiert, Options-Objekt nach demselben Vorbild wie andere Root-Screens dieses Repos).

**SegmentedControl-Wiederverwendung** (`components/SegmentedControl.tsx`, komplett gelesen, 118 Zeilen) — Props exakt `{ options, value, onChange }`:
```typescript
<SegmentedControl
  options={[{ value: 'mine', label: t`Mein Code` }, { value: 'scan', label: t`Scannen` }]}
  value={mode}
  onChange={setMode}
/>
```
Kein neuer Umschalter — Component Inventory nennt ihn ausdrücklich als „reused unchanged".

**QR-Placeholder-Geometrie als Ausgangspunkt für `QRMark`** (aus `friends.tsx` Z. 27–43, gleiche Konstanten-Herleitung in `profil.tsx` Z. 48–63) — das Muster „feste Zellgröße × 3 + Gaps, generöses Padding" ist die Vorlage für die reale Mark-Geometrie (jetzt mit echter QR-Bibliothek statt Fake-Pattern):
```typescript
const QR_CELL_SIZE = 16;
const QR_GRID_SIZE = QR_CELL_SIZE * 3 + spacingScale['sp-2'] * 2;
const QR_PLACEHOLDER_SIZE = QR_GRID_SIZE + spacingScale['sp-6'] * 2;
```

---

### `apps/mobile/components/CameraScanPanel.tsx` (component, NEU — kein Kamera-Analogon)

**Analogon (nur für den Denied-Zustand, Info-Callout):** `apps/mobile/app/(tabs)/mehr.tsx`, SafeNow-Callout (Z. 258–296).

**Zu kopierendes Info-Callout-Muster:**
```typescript
<View style={styles.callout}>
  <ShieldAlert size={CALLOUT_ICON_SIZE} color={colors.infoText} strokeWidth={2} style={styles.calloutIcon} />
  <View style={styles.calloutBody}>
    <Text style={[styles.calloutTitle, { fontFamily: calloutTitleFont }]}>
      <Trans>Stay safe</Trans>
    </Text>
    <Text style={[styles.calloutText, { fontFamily: calloutBodyFont }]}>
      <Trans>...</Trans>
    </Text>
    <Pressable onPress={() => void Linking.openURL(SAFENOW_URL)} accessibilityRole="link" accessibilityLabel={t`Open safenow.app`} style={styles.calloutLink}>
      <Text style={[styles.calloutLinkText, { fontFamily: calloutLinkFont }]}>
        <Trans>Open safenow.app</Trans>
      </Text>
    </Pressable>
  </View>
</View>
```
```typescript
callout: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: spacingScale['sp-5'],
  paddingHorizontal: spacingScale['sp-6'],
  paddingVertical: spacingScale['sp-5'],
  backgroundColor: colors.fillInfoQuiet,
  borderRadius: radiiScale['r-md'],
  borderWidth: 1,
  borderColor: colors.borderInfo,
},
```
Für D-16 (Denied-Zustand) direkt übernehmbar, nur Icon (`CameraOff`), Copy und die zweite Aktion (`Linking.openSettings()` statt `Linking.openURL`) tauschen; laut UI-SPEC Radius wird hier `r-card` statt `r-md` verwendet (abweichend vom SafeNow-Vorbild — UI-SPEC ist bindend).

**Kein Analogon existiert für:** die eigentliche Kamera-Vorschau, den Permission-Request-Flow oder Barcode-Decoding — `expo-camera` ist nicht in `apps/mobile/package.json` (verifiziert: nur `react-native-svg` und `@resvg/resvg-js` vorhanden, kein `expo-camera`, kein `expo-barcode-scanner`). Das ist eine echte Erstintegration, kein Umbau eines bestehenden Musters.

**Config-Plugin-Präzedenzfall für die native Permission** (`apps/mobile/app.json`, Z. 39–45) — Vorlage für den `expo-camera`-Plugin-Eintrag:
```json
[
  "expo-image-picker",
  {
    "photosPermission": "quiks needs access to your photos so you can pick an avatar for your profile.",
    "cameraPermission": "quiks needs access to your camera so you can take an avatar photo for your profile."
  }
],
```
`expo-camera` braucht einen eigenen, zusätzlichen Plugin-Eintrag mit eigenem Rationale-String (Copywriting Contract nennt den Wortlaut explizit) — nicht denselben Eintrag wiederverwenden, da `expo-image-picker`s Permission für „Avatar-Foto" begründet ist, nicht für „Freund scannen". Nach dem `app.json`-Edit ist laut Phase-5-Präzedenz (mmkv/NitroModules) ein `npx expo run:android` aus `apps/mobile` **vor** dem ersten Gerätetest zwingend.

---

### `apps/mobile/app/friend-detail.tsx` (screen, NEU — Modal, kein Fetch)

**Analogon:** `apps/mobile/app/profil.tsx` (Identity-Card-Aufbau, Avatar + Name + Meta-Zeilen, Z. 1–80 gelesen) für den strukturellen Aufbau „Avatar-Ring → Name → Identitätszeile(n)"; kombiniert mit `apps/mobile/lib/profile-meta-line.ts`s `buildIdentityLine()` (direkt wiederverwendbar, unverändert — Alterfeld wird `undefined` übergeben):
```typescript
export function buildIdentityLine({ pronoun, age, gender }: IdentityLineInput): string | null {
  const ageFragment = age === null || age === undefined ? null : String(age);
  const line = joinFragments([pronoun, ageFragment, gender]);
  return line.length > 0 ? line : null;
}
```
**Alert.alert-Bestätigungsmuster für „Freundschaft beenden"** (D-10), 1:1 aus `mehr.tsx`s Logout-Bestätigung (Z. 143–148):
```typescript
function confirmLogout() {
  Alert.alert(t`Log out?`, t`You can always sign back in with an email code.`, [
    { text: t`Cancel`, style: 'cancel' },
    { text: t`Log out`, style: 'destructive', onPress: () => void handleLogout() },
  ]);
}
```
Für `friend-detail.tsx`: `Alert.alert(t\`Freundschaft beenden?\`, t\`Ihr müsst euch danach erneut anfragen...\`, [{ text: t\`Abbrechen\`, style: 'cancel' }, { text: t\`Beenden\`, style: 'destructive', onPress: () => void handleUnfriend() }])` — gleiche Struktur, gleiche Cancel-ist-passiv/Confirm-ist-destruktiv-Reihenfolge.

**`ListRow`-Danger-Variante** (Z. 89–90 aus `ListRow.tsx`) als Vorbild für die „Freundschaft beenden"-Zeile:
```typescript
const accentColor = danger ? colors.dangerText : colors.textMuted;
const labelColor = danger ? colors.dangerText : colors.textPrimary;
```

**Kein neuer Fetch** — Daten kommen laut UI-SPEC per Navigations-Params oder Cache-Read aus der bereits geladenen `listFriends`-Query; kein Analogon nötig, da es strukturell kein Query-Loading-States-Problem gibt (E5 empty/loading/error sind laut UI-Consideration-Tabelle Zeilen 30–32 bewusst „dismissed – unreachable").

---

## Shared Patterns

### Farb-/Font-Resolution (05.1 D-01/D-10)
**Quelle:** jede gelesene Datei (`friends.tsx`, `ListRow.tsx`, `SegmentedControl.tsx`, `AvatarTile.tsx`, `mehr.tsx`)
**Gilt für:** alle neuen/geänderten Dateien dieser Phase
```typescript
const { colors } = useTheme();
const styles = useMemo(() => createStyles(colors), [colors]);
const fontsReady = useFontsReady();
const someFont = fontFamilyForRole('bodyStrong', fontsReady);
// im JSX: style={[styles.x, { fontFamily: someFont }]}
```
Niemals ein Farbtoken auf Modulebene destrukturieren — nur `tokens.typeRoles`/`layout`/`radiiScale`/`spacingScale` (mode-invariant) dürfen auf Modulebene stehen.

### ts-rest Non-200-als-Erfolg-Pattern
**Quelle:** `apps/mobile/app/(tabs)/friends.tsx` Z. 120–125, `apps/mobile/lib/festival-queries.ts` `unwrapOk`
**Gilt für:** jede neue Query/Mutation dieser Phase (Suche, Requests, Crew, Send/Accept/Decline/Withdraw/Unfriend, Handle-Lookup)
```typescript
if (meQuery.data.status !== 200) {
  return { kind: 'error', variant: 'response', retry: () => void meQuery.refetch() };
}
```
Ein non-200-ts-rest-Result ist ein ERFOLGREICHES React-Query-Ergebnis — nie `query.status === 'error'`. Für Mutationen steht stattdessen `unwrapOk()` bereit, das einen non-200 in eine echte Promise-Rejection verwandelt, wo das gewünscht ist (z. B. „Send-request failure — target gone (404)").

### `Alert.alert`-Bestätigungsmuster für destruktive Aktionen
**Quelle:** `apps/mobile/app/(tabs)/mehr.tsx` Z. 143–148 (`confirmLogout`)
**Gilt für:** `friend-detail.tsx` „Freundschaft beenden" (D-10) — explizit NICHT für Ablehnen/Zurückziehen (UI-SPEC: „no confirmation dialog for decline/withdraw")

### Info-Callout (fillInfoQuiet/borderInfo/infoText)
**Quelle:** `apps/mobile/app/(tabs)/mehr.tsx` Z. 258–296 (SafeNow-Block)
**Gilt für:** `CameraScanPanel`s Denied-Zustand (D-16) — gleiche Token-Trias, laut UI-SPEC mit `r-card` statt `r-md`

### Reine, node-env-testbare `lib/`-Logik
**Quelle:** `apps/mobile/lib/profile-meta-line.ts`, `apps/mobile/lib/intl-capability.ts`
**Gilt für:** `lib/friend-sort.ts` (D-12-Sortierung), `lib/qr-payload.ts` (Payload-Parsing/-Encoding)
Kein `@lingui/macro`-, kein React-Import — sonst im node-env-Vitest-Runner (`apps/mobile`) nicht importierbar. Tests liegen daneben unter `lib/__tests__/`.

### Query-Key-Factory + `unwrapOk`
**Quelle:** `apps/mobile/lib/festival-queries.ts`
**Gilt für:** `lib/friend-queries.ts` (neue Query-Keys für Suche/Requests/Crew, `unwrapOk` direkt importiert statt dupliziert)

## No Analog Found

| Datei | Rolle | Data Flow | Grund |
|---|---|---|---|
| `apps/mobile/components/CameraScanPanel.tsx` (Kamera-Vorschau + Permission-Request-Kern, ohne Denied-Zustand) | component | event-driven (native Kamera-Callback) | Keine bestehende Kamera-Vorschau/-Berechtigungslogik im Repo — `expo-camera` fehlt in `package.json` (verifiziert), einziges verwandtes Muster ist `expo-image-picker`s Foto-Auswahl (kein Live-Preview, kein Barcode-Decoding). Planner muss laut RESEARCH-Ersatz (Context-Datei, „Claude's Discretion") die Bibliothekswahl selbst treffen; UI-SPEC legt nur das Verhalten der drei Sub-Zustände fest, nicht die Implementierung. |
| `apps/mobile/components/QRMark.tsx` (echte QR-Code-Erzeugung) | component | transform | Kein Renderer für einen echten scannbaren QR-Code existiert; `react-native-svg` ist vorhanden, aber unbenutzt für diesen Zweck. Nur die Geometrie-Konstanten-Herleitung (Zellgröße × 3 + Gaps) ist aus dem Platzhalter-Pattern übertragbar, nicht das eigentliche Encoding. |

## Metadata

**Analog-Suchbereich:** `apps/mobile/app/`, `apps/mobile/components/`, `apps/mobile/lib/`, `apps/mobile/app.json`, `packages/contracts/src/router.ts`
**Gescannte Dateien:** ~15 (gezielt gelesen, keine Vollscans über 2000 Zeilen nötig)
**Datum:** 2026-08-13
