# Phase 11: Activities - Pattern Map

**Mapped:** 2026-08-15
**Files analyzed:** ~16 new/modified files (screens, components, lib modules, chrome registration)
**Analogs found:** 14 / 16 (2 have no direct analog — reported honestly below)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx` | screen (tab, replaces placeholder) | CRUD (list, two sources) | itself (current placeholder) + `apps/mobile/app/(tabs)/friends.tsx`-style list screens | role-match |
| `apps/mobile/app/activity-create.tsx` | screen (push, form) | request-response (POST) | `apps/mobile/app/friends-qr.tsx` (push form-ish screen) — but closer to a fresh build; see below | partial |
| `apps/mobile/app/activity-detail.tsx` | screen (push, detail + actions) | CRUD (read + join/leave/dissolve) | `apps/mobile/app/friend-detail.tsx` | exact (structure), partial (chrome — friend-detail is a modal, this is a push) |
| `apps/mobile/lib/activity-queries.ts` | utility (query-key factory) | CRUD | `apps/mobile/lib/friend-queries.ts` | exact |
| `apps/mobile/lib/use-activity-mutations.ts` | hook (mutations) | CRUD, request-response | `apps/mobile/lib/use-friend-mutations.ts` | exact |
| `apps/mobile/lib/activity-form.ts` | utility (pure validation/derivation) | transform | no direct analog — closest is `apps/mobile/lib/cashless-url.ts` / `apps/mobile/lib/qr-payload.ts` (pure fn + node-vitest pattern) | role-match (pattern only, not domain) |
| `apps/mobile/lib/geo-link.ts` | utility (pure URI builder) | transform | `apps/mobile/lib/cashless-url.ts` (pure URL-validating/-building function) | role-match |
| `apps/mobile/components/ActivityCard.tsx` | component (list row) | static-content | `apps/mobile/components/PersonRow.tsx` + `apps/mobile/components/FestivalCard.tsx` (card shell) | role-match |
| `apps/mobile/components/Chip.tsx` | component (pill primitive) | static-content, interactive | `apps/mobile/components/SegmentedControl.tsx` (selected-state visual language) | role-match |
| `apps/mobile/components/CapacityField.tsx` | component (stepper form field) | interactive, local state | no close analog — see "No Analog Found" | none |
| `apps/mobile/components/LocationCaptureBlock.tsx` | component (native-permission capture block) | event-driven (one-shot permission + geolocation call) | `apps/mobile/components/CameraScanPanel.tsx` | exact (permission sub-state modeling), partial (domain — camera stream vs. one-shot geo call) |
| `apps/mobile/components/DayTimeField.tsx` | component (chip row + native time picker) | interactive, local state | `Chip`/`SegmentedControl` (chip row) + no analog for the datetimepicker composition | role-match |
| `apps/mobile/components/Input.tsx` | component (generic text field) | static-content, interactive | no existing generic text `Input` component found — see "No Analog Found" | none |
| `apps/mobile/lib/app-chrome.ts` (modified) | config (route registry) | — | itself (existing file, additive edit) | exact |
| `apps/mobile/app/_layout.tsx` (modified) | route/config (Stack registration) | — | itself — `cashless`/`friend-detail` registration blocks | exact |
| `apps/mobile/app.json` (modified) + `package.json` | config (native plugin/rationale) | — | existing `expo-camera` plugin entry | exact |

## Pattern Assignments

### `apps/mobile/lib/activity-queries.ts` (utility, query-key factory)

**Analog:** `apps/mobile/lib/friend-queries.ts` (full file already quoted in UI-SPEC as the literal template — `activityKeys` mirrors `friendKeys` exactly).

**Full pattern to copy** (`apps/mobile/lib/friend-queries.ts` lines 1–40):
```typescript
export { ApiResponseError, unwrapOk } from './festival-queries';

export const friendKeys = {
  all: ['friends'] as const,
  search: (q: string) => ['friends', 'search', q] as const,
  requests: ['friends', 'requests'] as const,
  list: ['friends', 'list'] as const,
  handle: (username: string) => ['friends', 'handle', username] as const,
  inFestival: (festivalId: string) => ['friends', 'inFestival', festivalId] as const,
};
```
`activityKeys` (already specified verbatim in `11-UI-SPEC.md` § Query Key & Cache Contract) follows the identical shape: `all(festivalId)` as the shared invalidation prefix, with `tags`/`list`/`mine`/`detail` sub-keys. Re-export `unwrapOk`/`ApiResponseError` from `./festival-queries` exactly as `friend-queries.ts` does — do not redefine them.

**`unwrapOk`/`ApiResponseError` source** (`apps/mobile/lib/festival-queries.ts` lines 45–73):
```typescript
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
Note: activity mutations have mixed success codes (`createActivity` → 201, `joinActivity`/`leaveActivity`/`deleteActivity` → 200) — `unwrapOk` as written only accepts `200`. Either add a status parameter/overload or write a local `unwrapCreated` for the 201 case; do not silently widen `unwrapOk` itself since other call sites depend on its 200-only contract.

---

### `apps/mobile/lib/use-activity-mutations.ts` (hook, CRUD mutations)

**Analog:** `apps/mobile/lib/use-friend-mutations.ts` (full file, 125 lines) — UI-SPEC explicitly says "mirrors `useFriendMutations` exactly."

**Core pattern to copy** (lines 77–125, shared mutation config + return shape):
```typescript
export function useFriendMutations(options: UseFriendMutationsOptions = {}): UseFriendMutationsResult {
  const { onSuccess } = options;
  const queryClient = useQueryClient();
  const [pendingTargetId, setPendingTargetId] = useState<string | undefined>(undefined);
  const [failedTargetId, setFailedTargetId] = useState<string | undefined>(undefined);
  const [failedTargetStatus, setFailedTargetStatus] = useState<number | undefined>(undefined);

  const shared = {
    onMutate: (accountId: string) => {
      setFailedTargetId(undefined);
      setFailedTargetStatus(undefined);
      setPendingTargetId(accountId);
    },
    onError: (error: unknown, accountId: string) => {
      setFailedTargetId(accountId);
      setFailedTargetStatus(error instanceof ApiResponseError ? error.status : undefined);
    },
    onSuccess: (_data: unknown, accountId: string) => { onSuccess?.(accountId); },
    onSettled: () => {
      setPendingTargetId(undefined);
      void queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  };

  const sendRequestMutation = useMutation({ mutationFn: sendFriendRequestFn, ...shared });
  // ...repeat per mutation, sharing `shared`
  return { sendRequest: (id) => sendRequestMutation.mutate(id), pendingTargetId, failedTargetId, failedTargetStatus };
}
```
For activities, the mutation-target key is `activityId` (not `accountId`), the shared `onSettled` invalidates `activityKeys.all(festivalId)` (per UI-SPEC), and there are 4 mutation fns instead of 5: `createActivity`, `joinActivity`, `leaveActivity`, `deleteActivity`. The `onMutate`/`onError`/`onSettled` shape and the `pendingTargetId`/`failedTargetId`/`failedTargetStatus` return contract transfer verbatim — this is the exact "feels immediate without an optimistic cache write" mechanism UI-SPEC's Query Key & Cache Contract calls for (pending-opacity + real invalidation, no `setQueryData`).

**Mutation fn wiring pattern** (lines 8–31, per-endpoint async fn + `unwrapOk`):
```typescript
async function sendFriendRequestFn(accountId: string): Promise<FriendRequestResult> {
  const response = await apiClient.sendFriendRequest({ body: { targetAccountId: accountId } });
  return unwrapOk<FriendRequestResult>(response);
}
```
Activity equivalents take `{ festivalId, activityId }` path params, e.g.:
```typescript
async function joinActivityFn(params: { festivalId: string; activityId: string }) {
  const response = await apiClient.joinActivity({
    params: { festivalId: params.festivalId, activityId: params.activityId },
    body: {},
  });
  return unwrapOk<ActivityJoinResult>(response);
}
```

---

### `apps/mobile/app/activity-detail.tsx` (screen, push, CRUD + actions)

**Analog:** `apps/mobile/app/friend-detail.tsx` (full file, 320 lines).

**Cache-read-not-fetch idiom is NOT applicable here** — unlike `friend-detail.tsx` (no detail endpoint exists for friends, Phase 7 D-04), Activities DOES have a real `getActivity` endpoint (`packages/contracts/src/router.ts` lines 276–284). `activity-detail.tsx` must run a real `useQuery` against `activityKeys.detail(festivalId, activityId)`, not read a list cache. Do NOT copy `findCachedFriend`'s cache-scavenging pattern for the primary content fetch — it is only relevant for the **clone** flow (see below).

**What DOES transfer from `friend-detail.tsx`:**

1. **Destructive-action confirm pattern** (lines 148–157, "Auflösen"/D-11 maps directly onto "End friendship"):
```typescript
function confirmUnfriend() {
  Alert.alert(
    t`End this friendship?`,
    t`You'll need to send a new request to become friends again.`,
    [
      { text: t`Cancel`, style: 'cancel' },
      { text: t`End`, style: 'destructive', onPress: () => unfriend(accountId) },
    ],
  );
}
```

2. **Pending→settled-without-failure navigation pattern** (lines 134–144, exactly what D-11's "Auflösen success → back or replace" needs):
```typescript
const wasUnfriendPendingRef = useRef(false);
useEffect(() => {
  if (wasUnfriendPendingRef.current && !isUnfriendPending && !unfriendFailed) {
    if (router.canGoBack()) { router.back(); } else { router.replace('/friends'); }
  }
  wasUnfriendPendingRef.current = isUnfriendPending;
}, [isUnfriendPending, unfriendFailed, router]);
```

3. **Danger-row styling** (lines 236–255 + `createStyles` `dangerBlock`/`dangerRow`/`dangerLabel`/`dangerError`) — matches UI-SPEC's explicit "matches `friend-detail.tsx`'s `dangerRow`/`dangerLabel` verbatim" instruction for the "Auflösen" action.

**For the push-screen chrome** (header, `SafeAreaView`, `useHeaderClearance`), use `apps/mobile/app/cashless.tsx` instead — `friend-detail.tsx` is a **modal** with its own `Stack.Screen` header override (lines 171–196), which UI-SPEC explicitly says NOT to copy for this phase's two screens (both are root-level push siblings like `cashless.tsx`, not modals).

**Push-screen chrome pattern to copy** (`apps/mobile/app/cashless.tsx` lines 45–56):
```typescript
export default function CashlessScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerClearance = useHeaderClearance();
  // ...
  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={[styles.webviewContainer, { paddingTop: headerClearance }]}>
        {/* content */}
      </View>
    </SafeAreaView>
  );
}
```
Both `activity-create.tsx` and `activity-detail.tsx` should use this exact `SafeAreaView edges={['bottom']}` + `useHeaderClearance()` shape (per UI-SPEC § Screens & Navigation Contract), NOT `friend-detail.tsx`'s modal header override.

**Clone-flow cache-read pattern** (only relevant to `activity-create.tsx`, D-12) — copy `findCachedFriend`'s scavenging idiom (`friend-detail.tsx` lines 53–68):
```typescript
function findCachedFriend(queryClient: ReturnType<typeof useQueryClient>, accountId: string): Friend | undefined {
  const entries = queryClient.getQueriesData<{ status: number; body: unknown }>({ queryKey: friendKeys.all });
  for (const [key, cached] of entries) {
    const scope = key[1];
    if (scope !== 'list' && scope !== 'inFestival') continue;
    if (cached?.status !== 200 || !Array.isArray(cached.body)) continue;
    const hit = (cached.body as Friend[]).find((entry) => entry.profile.accountId === accountId);
    if (hit) return hit;
  }
  return undefined;
}
```
Adapt to read a single `activityKeys.detail(festivalId, cloneFromId)` cache entry directly via `queryClient.getQueryData` (simpler than the multi-key scan here, since clone always targets one specific detail key, not "any list containing it"). Missing cache entry → empty form, never a crash (per UI-SPEC's explicit "cache miss closes gracefully" note referencing this exact precedent).

---

### `apps/mobile/components/LocationCaptureBlock.tsx` (component, native permission + one-shot geo capture)

**Analog:** `apps/mobile/components/CameraScanPanel.tsx` (full file, 495 lines) — UI-SPEC explicitly names this as the model (not import) for the three permission sub-states.

**Permission sub-state type + one-shot request-on-mount pattern** (lines 45, 93–116):
```typescript
type PermissionSubState = 'pending' | 'granted' | 'denied';

const [permission, requestPermission] = useCameraPermissions();
const hasRequestedRef = useRef(false);
const [isRequesting, setIsRequesting] = useState(true);

useEffect(() => {
  if (hasRequestedRef.current) return;
  if (permission === null) return;
  if (permission.granted) { setIsRequesting(false); return; }
  hasRequestedRef.current = true;
  void requestPermission().finally(() => setIsRequesting(false));
}, [permission, requestPermission]);

function computePermissionSubState(): PermissionSubState {
  if (permission === null || isRequesting) return 'pending';
  return permission.granted ? 'granted' : 'denied';
}
```
For `expo-location`, swap `useCameraPermissions` for `Location.useForegroundPermissions()` (or an equivalent `useRef`-guarded manual call to `Location.requestForegroundPermissionsAsync()` if no hook variant is used) — same `pending`/`granted`/`denied` three-state shape, same "request exactly once per mount" `useRef` guard.

**Denied-permission callout structure** (lines 174–214, `fillInfoQuiet`/`borderInfo`/`infoText`, `r-card` radius, icon+title+body+"Open Settings" button):
```tsx
{permissionSubState === 'denied' ? (
  <View style={styles.callout}>
    <CameraOff size={CALLOUT_ICON_SIZE} color={colors.infoText} strokeWidth={2} style={styles.calloutIcon} />
    <View style={styles.calloutBody}>
      <Text style={[styles.calloutTitle, { fontFamily: bodyStrongFont }]}><Trans>Camera unavailable</Trans></Text>
      <Text style={[styles.calloutText, { fontFamily: bodySmFont }]}>
        <Trans>quiks uses the camera to scan a person's QR code... Allow access in Settings to scan.</Trans>
      </Text>
      <Pressable style={styles.calloutPrimaryButton} onPress={() => void Linking.openSettings()} accessibilityRole="button" accessibilityLabel={t`Open Settings`}>
        <Text style={[styles.calloutPrimaryButtonText, { fontFamily: buttonFont }]}><Trans>Open Settings</Trans></Text>
      </Pressable>
    </View>
  </View>
) : null}
```
Swap the icon (a location-appropriate Lucide icon, e.g. `MapPinOff`), copy per UI-SPEC's Copywriting Contract rows ("Standort nicht verfügbar" / the no-tracking reassurance body), and drop the "Enter handle instead" secondary link (no activities equivalent — free-text location input stays usable inline, it doesn't need a navigation escape hatch).

**Corresponding style block to copy** (`createStyles`, lines 409–424):
```typescript
callout: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: spacingScale['sp-5'],
  paddingHorizontal: spacingScale['sp-6'],
  paddingVertical: spacingScale['sp-6'],
  backgroundColor: colors.fillInfoQuiet,
  borderRadius: radiiScale['r-card'],
  borderWidth: 1,
  borderColor: colors.borderInfo,
},
```

**Domain difference — one-shot call, not a stream:** `CameraScanPanel` mounts a live `CameraView` and listens for repeated `onBarcodeScanned` events (arm/disarm `ScanState`). `LocationCaptureBlock` instead fires exactly one `Location.getCurrentPositionAsync()` per "Standort anheften" tap (not per mount) and has no live preview — do not copy `CameraScanPanel`'s `ScanState`/arm-disarm machinery, only its three-state permission modeling and denied-callout structure. The "Standort angeheftet" removable chip after a successful capture should use the new `Chip` component's `onRemove` prop, not a bespoke element.

---

### `apps/mobile/components/ActivityCard.tsx` (component, list row)

**Analogs:** `apps/mobile/components/PersonRow.tsx` (card shell/truncation idiom) + `apps/mobile/components/FestivalCard.tsx` (referenced in UI-SPEC for the "Dabei"/"Saved" badge treatment — not read in full this pass, but its badge color role, `colors.fillBrandQuiet` + `colors.primary` text, is already fully specified in UI-SPEC § Color item 2 and should be copied from there directly).

**Card shell + truncation pattern to copy** (`PersonRow.tsx` lines 63–111 shape, `createStyles` lines 113–145):
```typescript
row: {
  minHeight: layout.hitMin,
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacingScale['sp-4'],
  padding: spacingScale['sp-6'],
  backgroundColor: colors.surfaceCard,
  borderRadius: radiiScale['r-card'],
  borderWidth: 1,
  borderColor: colors.borderSubtle,
},
textColumn: { flexGrow: 1, flexShrink: 1, minWidth: 0, gap: spacingScale['sp-1'] },
```
```tsx
<Text numberOfLines={1} ellipsizeMode="tail" style={[styles.displayName, { fontFamily: nameFont }]}>
  {profile.displayName}
</Text>
```
`ActivityCard` is NOT a `Pressable`-optional row like `PersonRow` — per UI-SPEC every card in both sections is presumably tappable to open the detail screen (implied by "Detail as Push-Screen" navigation contract), so wrap it in `Pressable` unconditionally rather than copying `PersonRow`'s `onPress === undefined` branch.

**"Absent field renders nothing" idiom** — copy the same rule `friend-detail.tsx`'s `identityLine` uses (lines 219–223 there): an optional subtitle/tag/capacity renders as `condition ? <Text>...</Text> : null`, never a dash or placeholder. This applies directly to D-03's `capacity: null` → spots-hint omission and D-04's "Gestartet" fact-chip (own-section only).

---

### `apps/mobile/components/Chip.tsx` (component, pill primitive)

**Analog:** `apps/mobile/components/SegmentedControl.tsx` — not read in full this pass (UI-SPEC names it explicitly as the model for `Chip`'s selected-state visual language: "mirrors `SegmentedControl.itemSelected`"). The planner/executor should read `SegmentedControl.tsx`'s `itemSelected` style block directly when implementing — it is the one authoritative source for the selected-fill/border/text treatment (`colors.fillBrandQuiet` fill + `colors.primary` border/text, per UI-SPEC § Color item 3).

**Unselected-state color source** — copy from `ListRow`'s badge / `PersonRow`'s neutral-chip treatment per UI-SPEC's explicit instruction ("Unselected/neutral chips use `colors.fillQuiet` background + `colors.textSecondary` text"); `ListRow.tsx` was not read this pass — locate and read it during planning if its badge styling isn't already obvious from the tokens.

---

### `apps/mobile/lib/geo-link.ts` (pure utility, URI builder)

**Analog:** `apps/mobile/lib/cashless-url.ts` (not read in full — referenced via `resolveCashlessTarget` import in `cashless.tsx`) — same shape: a pure, framework-free function that validates/builds a URL from typed input and returns a discriminated result, node-env-Vitest-testable. `geo-link.ts`'s `buildRouteUri(geo, platform)` should follow the same "pure function, no React, testable in isolation" convention `activity-form.ts` and every other `lib/*.ts` pure module in this codebase already follows (see `qr-payload.ts`, `deep-link.ts`, `festival-gate.ts` for the same idiom, referenced repeatedly across CONTEXT/UI-SPEC).

**Security-relevant note carried over from CONTEXT/UI-SPEC:** only the two validated numeric fields (`geo.lat`, `geo.lng`) from `activityDetailSchema.geo` are ever interpolated into the URI — never free-text `location`. No existing analog demonstrates a security boundary this explicit; treat this as a hard constraint from the UI-SPEC text itself, not from a copied pattern.

---

### `apps/mobile/lib/app-chrome.ts` (modified, route registry)

**Analog:** itself — additive edit to an existing file.

**Exact pattern to extend** (lines 38–45):
```typescript
export const PUSH_SCREEN_ROUTES = new Set([
  'profil',
  'friends-qr',
  'friends-find',
  'cashless',
] as const);

export type PushScreenRoute = 'profil' | 'friends-qr' | 'friends-find' | 'cashless';
```
Add `'activity-create'` and `'activity-detail'` to both the `Set` literal and the `PushScreenRoute` union type — per UI-SPEC's explicit instruction and `resolveHeaderContext`'s existing fallback-to-invisible-on-omission behavior (`lib/app-chrome.ts` lines 71–82), an unregistered route falls back to `{ visible: false }` rather than erroring, so this addition is easy to silently forget — flag it as a required diff in the plan.

`AppHeader`'s `pushScreenTitle` map (not read this pass — locate at plan time, likely co-located with `AppHeader.tsx`/`useHeaderClearance`) needs two new static DE/EN entries per UI-SPEC's Copywriting Contract ("Aktivität erstellen"/"Create activity" and "Aktivität"/"Activity").

---

### `apps/mobile/app/_layout.tsx` (modified, Stack registration)

**Analog:** itself — the existing `cashless`/`friend-detail` `Stack.Screen` registrations inside the authenticated `Stack.Protected` block (lines 501–586 region, exact registration lines 534, 542, 556, 569, 585).

**Pattern to copy** (structure, not exact lines — both `activity-create` and `activity-detail` are root-level siblings, like `cashless`, NOT like `friend-detail` which carries its own header override):
```tsx
<Stack.Screen name="cashless" />
```
Add two equivalent lines, `<Stack.Screen name="activity-create" />` and `<Stack.Screen name="activity-detail" />`, inside the same `Stack.Protected guard={authState.status === 'authenticated'}` block, alongside the other push-screen registrations — omission here is the exact `first-login-unmatched-route`-class defect UI-SPEC calls out explicitly (E9 coverage row).

---

## Shared Patterns

### Query-key factory + shared invalidation prefix
**Source:** `apps/mobile/lib/friend-queries.ts` (`friendKeys`), `apps/mobile/lib/festival-queries.ts` (`festivalKeys`, `unwrapOk`, `ApiResponseError`)
**Apply to:** `lib/activity-queries.ts` — already fully specified verbatim in `11-UI-SPEC.md` § Query Key & Cache Contract; treat that code block as authoritative, this pattern map only supplies the provenance.

### Mutation hook: pending/failed local state + `onSettled` invalidation (no optimistic cache write)
**Source:** `apps/mobile/lib/use-friend-mutations.ts` (full file)
**Apply to:** `lib/use-activity-mutations.ts` — every mutation (create/join/leave/dissolve) shares one `onMutate`/`onError`/`onSettled` object; `pendingTargetId`/`failedTargetId`/`failedTargetStatus` returned for callers to compare against their own row's id.

### Push-screen chrome (`SafeAreaView edges={['bottom']}` + `useHeaderClearance()`)
**Source:** `apps/mobile/app/cashless.tsx`
**Apply to:** `activity-create.tsx`, `activity-detail.tsx` — both are root-level Stack siblings of `(tabs)`, not modals; do not copy `friend-detail.tsx`'s modal header override for these two.

### Destructive-action confirm + danger-row styling
**Source:** `apps/mobile/app/friend-detail.tsx` (`confirmUnfriend`, `dangerRow`/`dangerLabel`/`dangerError` styles)
**Apply to:** `activity-detail.tsx`'s "Auflösen" action (D-11) — UI-SPEC names this analog verbatim.

### Three-state native-permission modeling (`pending`/`granted`/`denied`, request-once-per-mount via `useRef`)
**Source:** `apps/mobile/components/CameraScanPanel.tsx`
**Apply to:** `LocationCaptureBlock.tsx` — permission sub-state machine and denied-callout structure transfer; the live-stream/arm-disarm scan machinery does not (one-shot geo call instead).

### "Absent field renders nothing" (no dash, no placeholder)
**Source:** `apps/mobile/app/friend-detail.tsx` (`identityLine`)
**Apply to:** `ActivityCard.tsx` (capacity null, missing tag/subtitle), `activity-detail.tsx` (missing description/subtitle/location/geo) — same idiom throughout, explicitly re-affirmed by UI-SPEC's E2/E3 coverage tables.

### Pure `lib/*.ts` modules, framework-free, node-env-Vitest-testable
**Source:** codebase-wide convention (`lib/festival-queries.ts`, `lib/friend-queries.ts`, `lib/app-chrome.ts`, referenced `lib/qr-payload.ts`/`lib/deep-link.ts`/`lib/festival-gate.ts`)
**Apply to:** `lib/activity-form.ts`, `lib/geo-link.ts` — no React import, pure functions, exported for direct unit testing (this project has no RN component test harness — see CONTEXT.md, screen truth is on-device UAT only).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `apps/mobile/components/CapacityField.tsx` | component (stepper form field) | interactive, local state | No existing stepper component was found in this codebase pass. The 36px increment/decrement circle is explicitly noted in UI-SPEC as reusing `AppHeader`'s `LEFT_BUTTON_CIRCLE_SIZE` constant as a sizing precedent only — not a component to copy structure from. Build fresh on tokens; no `lib/`/`components/` stepper precedent exists to point to. |
| `apps/mobile/components/Input.tsx` | component (generic labeled text field) | static-content, interactive | No existing generic `Input`/text-field primitive was located in `apps/mobile/components/` during this pass. UI-SPEC itself flags this file as "(new, if not already generalized elsewhere)" — the planner should grep `apps/mobile/components/` for any existing bare text-input wrapper (e.g. used by the profile-setup form, not read this pass) before building this from scratch; if one exists it was missed here and should be substituted as the analog. |
| `apps/mobile/lib/activity-form.ts` (the tag-or-title `canSubmitActivity` rule specifically) | utility (pure validation) | transform | No existing "conditional-required-field" validation function was found to copy the exact branching logic from — only the *pattern* of "pure function, framework-free, node-env-testable" transfers (see Shared Patterns), the specific tag-or-title branching logic is new domain logic mirroring (not duplicating) `createActivityBodySchema.refine` server-side. |

## Metadata

**Analog search scope:** `apps/mobile/app/`, `apps/mobile/components/`, `apps/mobile/lib/`, `packages/contracts/src/router.ts`, phase 10 SUMMARY files (01, 05 read in full/detail; 02–04 not opened this pass — endpoint/schema shape was already sufficiently covered by router.ts + 10-01/10-05 summaries)
**Files scanned:** 12 read in full or targeted sections (friend-queries.ts, use-friend-mutations.ts, friend-detail.tsx, CameraScanPanel.tsx, cashless.tsx, app-chrome.ts, activities.tsx placeholder, PersonRow.tsx, festival-queries.ts, router.ts activity section, 10-01-SUMMARY.md, 10-05-SUMMARY.md), plus 4 referenced-but-not-opened files noted explicitly above (`FestivalCard.tsx`, `SegmentedControl.tsx`, `cashless-url.ts`, `AppHeader.tsx`'s `pushScreenTitle` map) that the planner/executor should read directly when implementing the components that depend on them.
**Pattern extraction date:** 2026-08-15
