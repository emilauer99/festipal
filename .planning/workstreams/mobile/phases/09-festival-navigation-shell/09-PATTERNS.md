# Phase 9: Festival Navigation Shell — Pattern Map

**Mapped:** 2026-08-13
**Files analyzed:** 20
**Analogs found:** 20 / 20

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/mobile/app/(tabs)/start.tsx` (renamed from `home.tsx`) | route/component | request-response | `apps/mobile/app/(tabs)/home.tsx` (itself, being renamed) | exact |
| `apps/mobile/components/AppHeader.tsx` **NEW** | component | request-response | `apps/mobile/components/FloatingNav.tsx` | role-match (structural: BlurView glass bar, per-render `useTheme()`) |
| `apps/mobile/components/FloatingNav.tsx` **MODIFIED** (parametrize for 5-tab festival context) | component | request-response | itself (extend, don't fork) | exact |
| `apps/mobile/app/(festival)/_layout.tsx` **MODIFIED** (bare `Stack` → gated 5-tab `Tabs` navigator) | provider/layout | request-response | `apps/mobile/app/(tabs)/_layout.tsx` (tab registration) + `apps/mobile/app/(festival)/f/[festivalSlug].tsx` (gate query/404 pattern, D-10) | role-match |
| `apps/mobile/app/(festival)/f/[festivalSlug]/dashboard.tsx` (or equivalent, Claude's Discretion) | route/component | request-response | `apps/mobile/app/(festival)/f/[festivalSlug].tsx` (current content, split) | exact (direct split) |
| `apps/mobile/components/StatTile.tsx` **NEW** | component | request-response | `apps/mobile/components/ComingSoonTile.tsx` (card shape, tokens) | role-match |
| Placeholder-screen component **NEW** (e.g. `PlaceholderScreen.tsx`) | component | request-response | `apps/mobile/app/(festival)/f/[festivalSlug].tsx` `centered` state blocks + `apps/mobile/app/(tabs)/home.tsx` empty-state block | role-match |
| Aktivitäten / Timetable / Lageplan tab screens **NEW** | route/component | request-response | `apps/mobile/app/(tabs)/home.tsx` (screen shell around a shared state component) | role-match |
| Festival Friends tab screen **NEW** | route/component | CRUD (read list) | `apps/mobile/app/(tabs)/friends.tsx` (not read in full, but is the direct sibling; `PersonRow`/`sortFriendsByDisplayName` usage there is the template) + `apps/mobile/app/(festival)/f/[festivalSlug].tsx` (query/loading/error/empty-state shape) | exact |
| `apps/mobile/app/cashless.tsx` **NEW** | route/component | streaming (WebView) | `apps/mobile/app/(festival)/f/[festivalSlug].tsx` (loading/error/retry shape) — no existing WebView analog in-repo | partial (no data-flow analog; copy chrome pattern only) |
| `apps/mobile/lib/festival-navigation.ts` **MODIFIED** (`/home` → `/start`) | utility | transform | itself | exact |
| `apps/mobile/lib/cold-start-redirect.ts` **MODIFIED** (`'home'` kind / `/home` href → `/start`) | utility | transform | itself | exact |
| `apps/mobile/lib/festival-queries.ts` **MODIFIED** (extend `festivalKeys`, no restructure) | utility | CRUD | itself + `apps/mobile/lib/friend-queries.ts` (`friendKeys` factory pattern) | exact |
| `apps/mobile/lib/friend-queries.ts` **MODIFIED** (new `friendKeys` entry for FRND-07 endpoint) | utility | CRUD | itself | exact |
| `apps/mobile/lib/friend-sort.ts` (reused unchanged) | utility | transform | n/a — reuse only | exact |
| `apps/mobile/components/AvatarTile.tsx` **MODIFIED** (widen size union to include 32) | component | request-response | itself | exact |
| `apps/mobile/app/_layout.tsx` **MODIFIED** (mount `AppHeader`, `headerShown:false` on push screens) | provider | event-driven | itself | exact |
| `apps/mobile/app/profil.tsx`, `friend-detail.tsx`, `friends-qr.tsx` **MODIFIED** (drop own header, use `AppHeader` push state) | route/component | request-response | not read this pass — header-options removal only; see `f/[festivalSlug].tsx`'s existing `Stack.Screen options` block as the pattern being removed | role-match |
| `apps/api/src/festival/festival.controller.ts` + `.service.ts` **MODIFIED** (or new `friends-in-festival` handler) | controller/service | CRUD | `apps/api/src/friendship/friendship.controller.ts` + `.service.ts` (`listFriends`) | exact |
| `packages/contracts/src/router.ts` + `schemas.ts` **MODIFIED** (new `GET /festivals/:festivalId/friends` endpoint) | config/contract | CRUD | `router.ts`'s existing `listFriends` (schema/response) + `listTags`/`saveFestival` (path shape `/festivals/:festivalId/...`) | exact |
| `apps/mobile/locales/{de,en}/messages.po` **MODIFIED** | config | transform | existing catalog entries (`Home`→`Start` msgid) | exact |

## Pattern Assignments

### `apps/mobile/app/(tabs)/start.tsx` (route, request-response) — NAV-03 rename

**Analog:** `apps/mobile/app/(tabs)/home.tsx` (the file itself, git-moved)

This is a rename, not a rewrite. Content is unchanged (`HomeScreen` function, `styles`, all query
logic in `home.tsx` lines 1–298 stay verbatim). The rename touches four other files, each with its
own load-bearing literal:

**`apps/mobile/components/FloatingNav.tsx`** (lines 28, 37–46, 92–97, 125):
```typescript
type LiveRouteName = 'home' | 'festivals' | 'friends' | 'mehr'; // -> 'start'
const LIVE_TAB_ICON: Record<LiveRouteName, LucideIcon> = { home: Home, ... }; // key -> start, glyph UNCHANGED
function isLiveRouteName(name: string): name is LiveRouteName {
  return name === 'home' || ...  // -> 'start'
}
const liveTabLabel: Record<LiveRouteName, string> = {
  home: t`Home`, // -> start: t`Start`
  ...
};
const routeName = isLiveRouteName(route.name) ? route.name : 'home'; // -> 'start' fallback
```

**`apps/mobile/app/(tabs)/_layout.tsx`** (lines 25–41): `initialRouteName="home"` and
`<Tabs.Screen name="home" />` both become `"start"`.

**`apps/mobile/lib/festival-navigation.ts`** (line 28): `router.replace('/home')` → `router.replace('/start')`.

**`apps/mobile/lib/cold-start-redirect.ts`** (lines 23–26, 68–69): the `{ kind: 'home' }` union
member (Claude's Discretion whether the discriminant itself is renamed to `'start'`, per D-19/D-21
CONTEXT.md) and `case 'home': return '/home';` → `'/start'`.

**Test files that assert these literals** (must be updated in the same plan, not follow-up):
`apps/mobile/lib/__tests__/cold-start-redirect.test.ts`, `apps/mobile/lib/__tests__/root-redirect.test.ts`.

**Lingui catalog** — EN msgstr for `msgid "Home"`/`"Start"` moves per D-20 (source string itself
changes from `t\`Home\`` to `t\`Start\`` in `FloatingNav.tsx`, so this is a NEW msgid, not a
translation edit — Lingui extraction picks it up automatically once the source call site changes).

**Device verification is mandatory** (row 58, `## UI Considerations` in 09-UI-SPEC.md) — run
`expo start -c` from `apps/mobile` and confirm a deep link at the old first-tab segment still
resolves, per the `first-login-unmatched-route` debug precedent
(`.planning/debug/resolved/first-login-unmatched-route`). Do not trust the node-env vitest runner
for this.

---

### `apps/mobile/components/AppHeader.tsx` (component, request-response) — D-02/D-03/D-04/D-06/D-08

**Analog:** `apps/mobile/components/FloatingNav.tsx` (structural pattern: BlurView glass bar, colour
roles resolved per-render, not module-level)

**Imports pattern** (FloatingNav.tsx lines 1–12):
```typescript
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, ArrowLeft, type LucideIcon } from 'lucide-react-native';
import { useLingui } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

const { typeRoles, layout, radiiScale, spacingScale } = tokens; // mode-invariant scales ONLY at module scope
```

**Glass/blur pattern to reuse verbatim, not reinvent** (FloatingNav.tsx lines 26, 117–121):
```typescript
const BLUR_INTENSITY = 60;
// ...
<BlurView intensity={BLUR_INTENSITY} tint={mode === 'light' ? 'light' : 'dark'} style={styles.blur} />
```

**Per-render colour resolution** (FloatingNav.tsx line 74, comment at lines 14–16): colours are
NEVER destructured at module scope — `const { mode, colors } = useTheme();` inside the component,
`useMemo(() => createStyles(colors), [colors])` for styles.

**Home/leave-festival action to wire into the left slot** — `apps/mobile/lib/festival-navigation.ts`
lines 24–30 (`leaveFestival(router)`, unchanged mechanism, only its internal `/home` literal moves
to `/start`); D-02 also needs a new "go to Start tab" branch (global context) and a "close push
screen" branch (`router.back()` equivalent) — neither exists yet, build them alongside
`leaveFestival`, not inside it (it stays the FESTIVAL-context-only mechanism).

**Avatar slot** — `apps/mobile/components/AvatarTile.tsx` lines 63–102: `<AvatarTile size={32} .../>`
sourced from the shared `['me']` query (see `apps/mobile/app/profil.tsx`, not read this pass, for
the existing `['me']` query call site — reuse the SAME query, do not add a second fetch).

**Lingui accessibility-label pattern** (FloatingNav.tsx lines 81–97, comment): `accessibilityLabel`
is exempt from `no-literal-string` lint and must be explicitly localized; build a fresh
`Record<...>` of `t\`...\`` calls per render, never a module-level pre-resolved map (the macro must
appear textually at each call site).

---

### `apps/mobile/components/StatTile.tsx` (component, request-response) — D-07 Dashboard tile row

**Analog:** `apps/mobile/components/ComingSoonTile.tsx` (card shape, token usage, disabled vs.
tappable variant)

**Full structural template** (ComingSoonTile.tsx lines 1–13, 46–69, 71–104) — copy the file
structure (imports, `useTheme`/`useFontsReady`/`useMemo(createStyles)` skeleton, `StyleSheet.create`
card with `surfaceCard`/`borderSubtle`/`r-md`/`sp-6` padding) but:
- `StatTile` is `Pressable` when it has an `onPress` (Cashless tile, Crew tile switches active tab)
  — `ComingSoonTile` is deliberately a non-interactive `View` (`accessibilityState={{disabled:true}}`,
  line 58) which is explicitly the WRONG shape to reuse verbatim; follow `PersonRow.tsx`'s
  conditional-Pressable pattern instead (lines 93–110: `onPress === undefined ? <View> : <Pressable>`).
- Two-row internal layout (eyebrow icon+label row, then value row) — port from
  `docs/concept/designs/festival/festipal-ds.js`'s `StatTile` per 09-UI-SPEC.md § Component
  Inventory, not from `ComingSoonTile`'s single centered icon+label+badge layout.

**Tone-to-color mapping precedent** (ComingSoonTile.tsx line 63, `colors.textMuted` for icon) — for
`tone="brand"` vs `tone="default"`, follow `PersonRow.tsx` line 141's precedent of a SINGLE role
(`colors.primary`) reserved for exactly one designated element, never "every icon."

---

### Placeholder-screen component **NEW** (D-12/D-13/D-14)

**Analog:** `apps/mobile/app/(festival)/f/[festivalSlug].tsx` `centered`/`heading`/`helper` styles
(lines 221–246) — the exact icon-less version of this pattern already exists for the not-found/error
state; `apps/mobile/app/(tabs)/home.tsx` `stateBlock`/`heading`/`helper` (lines 162–176, 241–283) —
the "empty state with heading + body" precedent, including the `title2` heading role and `body`role
for the paragraph.

**Core pattern to copy** (`f/[festivalSlug].tsx` lines 161–170, adapted):
```tsx
<View style={styles.centered}>
  <Text style={[styles.heading, { fontFamily: headingFont }]}>
    <Trans>Festival not found</Trans>
  </Text>
  <Text style={[styles.helper, { fontFamily: bodyFont }]}>
    <Trans>This festival may have been removed or the link is out of date.</Trans>
  </Text>
</View>
```

**Deviation required by 09-UI-SPEC.md** (§ Placeholder Screen Contract, row 39): wrap this in a
`ScrollView` with `contentContainerStyle={{ flexGrow: 1, ...centering }}`, NOT a bare `flex: 1` View
— neither analog does this today; it is this component's own new behavior, scoped only to it.

**Props contract:** `{ icon: LucideIcon, heading: string, body: string }` — caller-supplied copy only
(same "component owns no copy" rule `ComingSoonTile.tsx` and `SoonToast.tsx` both already follow,
see `ComingSoonTile.tsx` lines 27–29 and `SoonToast.tsx` lines 98–103).

**`SoonToast` is explicitly NOT the mechanism here** — see `apps/mobile/components/SoonToast.tsx`
lines 30–40, 105–107 (`useSoonToast()`/`ShowSoonToast`) for what it IS for (dead interactive
controls only); do not call it from any of these three screens.

---

### Aktivitäten / Timetable / Lageplan tab screens **NEW** (route, request-response)

**Analog:** `apps/mobile/app/(tabs)/home.tsx` overall screen shell shape (`SafeAreaView` →
`ScrollView` wrapping state components) — but drastically simplified since there is no query here at
all (fully static per 09-UI-SPEC.md row 36). Each screen is essentially:
```tsx
<SafeAreaView style={styles.screen} edges={['bottom']}>
  <PlaceholderScreen icon={Sparkles} heading={t`Activities are on the way`} body={t`...`} />
</SafeAreaView>
```
No data fetching, no loading/error branches — that's the whole file.

---

### Festival Friends tab screen **NEW** (route, CRUD read) — D-15/D-16/D-17/D-18/FRND-07

**Analog:** `apps/mobile/app/(festival)/f/[festivalSlug].tsx` for the query/loading/transport-error
shape (lines 91–119, 138–159) — copy the `useQuery` + `showLoading`/`showTransportError` branching
pattern verbatim, adapted to the new endpoint and its THREE empty states (D-17) instead of the
existing two.

**List rendering — reuse unchanged:**
- `apps/mobile/components/PersonRow.tsx` lines 49–111 (`profile`/`trailing`/`onPress`/`accessibilityLabel`
  props, `VisitorProfileForeign` shape) — one row per friend, `onPress` opens `friend-detail.tsx`.
- `apps/mobile/lib/friend-sort.ts` (`sortFriendsByDisplayName`) — not read this pass, referenced by
  CONTEXT.md D-15 as reuse-unchanged with the Hermes-`Intl.Collator` fallback.

**Query-key factory pattern to extend, not restructure** (`apps/mobile/lib/friend-queries.ts` lines
23–29):
```typescript
export const friendKeys = {
  all: ['friends'] as const,
  search: (q: string) => ['friends', 'search', q] as const,
  requests: ['friends', 'requests'] as const,
  list: ['friends', 'list'] as const,
  handle: (username: string) => ['friends', 'handle', username] as const,
  // NEW for D-18: festivalFriends: (festivalId: string) => ['friends', 'festival', festivalId] as const,
};
```
Same pattern as `apps/mobile/lib/festival-queries.ts` lines 8–13 (`festivalKeys`).

**`unwrapOk`/`ApiResponseError` re-export idiom** (`friend-queries.ts` line 10): `export {
ApiResponseError, unwrapOk } from './festival-queries';` — the new FRND-07 query does not need this
(it's a plain list, not a mutation-style unwrap), but any Dashboard-tile derived-count logic reading
the SAME cache entry (D-18) should follow this file's "import from festival-queries, don't
redeclare" convention if it needs the helper.

**"Find friends" CTA push pattern** — analog is the existing root-level push registration in
`apps/mobile/app/_layout.tsx` lines 493–511 (`<Stack.Screen name="profil" />`,
`<Stack.Screen name="friend-detail" />`, `<Stack.Screen name="friends-qr" />` — all root-level
siblings of `(tabs)`). The push target is the EXISTING `(tabs)/friends.tsx` (not a new file) — no
new `Stack.Screen` registration needed since it is already registered inside `(tabs)`; the push-over
is a `router.push('/friends')`-style call from a root-level trigger, matching how `f/[festivalSlug].tsx`
itself is entered (`router.push('/f/${slug}')`, `home.tsx` line 118).

---

### `apps/mobile/app/cashless.tsx` **NEW** (route, streaming/WebView) — D-09

**No existing WebView analog in this codebase** — this is the phase's one genuinely new integration
surface (flagged `no analog` below for the WebView mechanics themselves). Screen chrome (loading
text, error + retry) copies verbatim from `f/[festivalSlug].tsx`'s existing pattern:

```tsx
// loading (adapt from f/[festivalSlug].tsx lines 138-144)
<View style={styles.centered}>
  <Text style={[styles.helper, { fontFamily: bodyFont }]}><Trans>Loading Cashless…</Trans></Text>
</View>

// error + retry (adapt from f/[festivalSlug].tsx lines 146-159)
<View style={styles.centered}>
  <Text style={[styles.error, { fontFamily: bodySmFont }]}><Trans>Can't load Cashless right now.</Trans></Text>
  <Pressable style={styles.retryButton} onPress={() => webviewRef.current?.reload()}>
    <Text style={[styles.retryButtonText, { fontFamily: buttonFont }]}><Trans>Retry</Trans></Text>
  </Pressable>
</View>
```
Retry reloads the WebView via ref, not `query.refetch()` — the one deviation from the analog.

**Package legitimacy gate + native rebuild precedent**: Phase 8's `qrcode-generator`/`expo-camera`
additions (per 09-CONTEXT.md code_context, not re-read this pass) are the precedent to repeat for
`react-native-webview` — manual package-legitimacy check, then `npx expo run:android` **from
`apps/mobile`** before device testing.

---

### API: `GET /festivals/:festivalId/friends` (controller + service, CRUD) — D-18

**Analog:** `apps/api/src/friendship/friendship.controller.ts` lines 104–110 (`listFriends`) for the
controller shape, and `.service.ts` lines 540–557 (`listFriends` method) for the service shape —
this is the closest existing "friends list scoped to the caller" read.

**Controller pattern to copy** (friendship.controller.ts lines 99–110):
```typescript
// The two list endpoints take NO parameter at all — there is no path, query or
// body value a client could set to ask for somebody else's friends...
@TsRestHandler(contract.listFriends)
listFriends(@Session() session: UserSession) {
  return tsRestHandler(contract.listFriends, async () => {
    const friends = await this.friendship.listFriends(session.user.id);
    return { status: 200, body: friends };
  });
}
```
The NEW endpoint differs in taking a path param — combine with `festival.controller.ts`'s
`:festivalId` param handling (lines 23–29, `listTags`):
```typescript
@TsRestHandler(contract.listTags)
listTags() {
  return tsRestHandler(contract.listTags, async ({ params, query }) => {
    const tags = await this.festivals.listTags(params.festivalId, query.locale);
    return { status: 200, body: tags };
  });
}
```

**Service query pattern** (friendship.service.ts lines 519–557, `listFriends`) — the join-based
"caller's friend, resolved through EITHER pair column" pattern is exactly what the new query needs,
extended with an additional join onto `my_festival` filtered by `festivalId`:
```typescript
async listFriends(callerId: string): Promise<Friend[]> {
  const rows = await this.db
    .select({ ...foreignProfileColumns, friendsSince: friendship.createdAt })
    .from(visitorProfile)
    .innerJoin(
      friendship,
      or(
        and(eq(friendship.lowerId, callerId), eq(visitorProfile.accountId, friendship.higherId)),
        and(eq(friendship.higherId, callerId), eq(visitorProfile.accountId, friendship.lowerId)),
      ),
    )
    .orderBy(asc(visitorProfile.username));
  return rows.map((row) => ({ profile: pickForeignProfile(row), friendsSince: toIsoString(row.friendsSince) }));
}
```
**MUST reuse `foreignProfileColumns`/`pickForeignProfile`** from `./visitor-projection` — CONTEXT.md
integration-points section is explicit that these are "the only zugelassenen Leser/Former der
Fremd-View" (VIS-02 invariant, enforced by `projection-uniqueness.spec.ts`).

**SEC-02 cross-tenant test** — no existing test file for this exact join was located this pass; the
service scopes by `festivalId` inside the join condition the same way `listFriends` scopes by
`callerId` (never a client-supplied filter) — follow that same "scope inside the WHERE/JOIN, never
trust a query param" shape from `sendRequest`/`unfriend` (service.ts lines 286–305, 620–629, "Answered
before any database access... the caller supplies one of the two halves").

---

### `packages/contracts/src/router.ts` + `schemas.ts` **MODIFIED** — D-18

**Path-param pattern to copy** (router.ts lines 46–47, `listTags`):
```typescript
path: '/festivals/:festivalId/tags',
pathParams: z.object({ festivalId: z.string().uuid() }),
```
Apply identically for `path: '/festivals/:festivalId/friends'`.

**Response schema — reuse `friendSchema` verbatim** (router.ts line 129, `listFriends`):
```typescript
responses: { 200: z.array(friendSchema) },
```
Do NOT invent a new schema — 09-UI-SPEC.md § Festival Friends Tab Contract is explicit that the
response reuses `friendSchema` (`{ profile: VisitorProfileForeign, friendsSince: string }[]`,
`packages/contracts/src/schemas.ts` line 186) exactly as `PersonRow`/`sortFriendsByDisplayName`
already consume it.

**Summary-comment convention** (router.ts line 174, `listFestivals`'s neighbor `saveFestival`):
```typescript
summary: 'List the caller's saved festivals (SEC-02: festivalId/visitorId-scoped, never client-filtered)',
```
Add an equivalent `SEC-02` summary comment on the new endpoint definition — this is a repo-wide
convention for tenant-scoped endpoints, not optional decoration.

---

## Shared Patterns

### Colour-role resolution (app-wide, mode-dependent)
**Source:** every screen/component read this pass (`FloatingNav.tsx` lines 14–16, 74–75;
`f/[festivalSlug].tsx` lines 72–73; `home.tsx` lines 47–48; `AvatarTile.tsx`/`PersonRow.tsx`/
`ComingSoonTile.tsx`/`SoonToast.tsx` — identical pattern in all)
**Apply to:** every new component/screen this phase (`AppHeader`, `StatTile`, placeholder component,
Festival Friends tab, Cashless screen, festival tab bar)
```typescript
const { colors } = useTheme();               // per-render, NEVER module-level
const styles = useMemo(() => createStyles(colors), [colors]);
// module scope only holds mode-invariant scales:
const { typeRoles, layout, radiiScale, spacingScale } = tokens;
```

### Font-family resolution (05.1 D-10 — no numeric fontWeight on a role-resolved family)
**Source:** every file read this pass, e.g. `f/[festivalSlug].tsx` lines 74–81
**Apply to:** every new Text style
```typescript
const fontsReady = useFontsReady();
const bodyFont = fontFamilyForRole('body', fontsReady);
// ... style: { fontFamily: bodyFont }  — no fontWeight alongside it
```

### ts-rest response handling — 200 vs. non-200 is never `query.status === 'error'`
**Source:** `f/[festivalSlug].tsx` lines 97–99, 111–112; `home.tsx` lines 74–79;
`festival-queries.ts` `unwrapOk`/`ApiResponseError` (lines 31–44)
**Apply to:** every new `useQuery` call this phase (festival gate query, FRND-07 friends query)
```typescript
const notFound = query.status === 'success' && query.data.status === 404;
const value = query.status === 'success' && query.data.status === 200 ? query.data.body : undefined;
```

### Query-key factory — framework-free module, extend don't restructure
**Source:** `festival-queries.ts` (whole file), `friend-queries.ts` (whole file)
**Apply to:** any new query key needed for FRND-07 / the festival gate query — add an entry to the
existing `festivalKeys`/`friendKeys` object, never a parallel factory.

### Error/loading/retry copy block (verbatim project pattern)
**Source:** `f/[festivalSlug].tsx` lines 146–159; `home.tsx` lines 142–160
**Apply to:** festival gate (D-10), Festival Friends tab error state, Cashless WebView error state
```tsx
<Text style={[styles.error, { fontFamily: bodySmFont }]}>
  <Trans>Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.</Trans>
</Text>
<Pressable style={styles.retryButton} onPress={() => query.refetch()}>
  <Text style={[styles.retryButtonText, { fontFamily: buttonFont }]}><Trans>Retry</Trans></Text>
</Pressable>
```

### SEC-02 tenant scoping (API)
**Source:** `festival.controller.ts`/`.service.ts` `saveFestival`; `friendship.service.ts`
`sendRequest`/`unfriend` ("the caller supplies one of the two halves", never a client-filtered scope)
**Apply to:** the new `GET /festivals/:festivalId/friends` service method — scope by `callerId`
(session) AND `festivalId` (path param) inside the JOIN/WHERE, never accept a visitor id from the
client.

### Foreign-profile projection (VIS-02 invariant)
**Source:** `friendship.service.ts` imports from `./visitor-projection`
(`foreignProfileColumns`/`pickForeignProfile`), used identically in `lookupByUsername`,
`searchByUsername`, `listFriends`, `listRequests`.
**Apply to:** the new FRND-07 service method — MUST read through the same two functions, never
re-declare a column list (enforced by `projection-uniqueness.spec.ts`).

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `apps/mobile/app/cashless.tsx` (the `WebView` element itself, not the screen chrome) | component | streaming | No `react-native-webview` usage exists anywhere in the codebase yet — this is a genuinely new dependency and integration point (D-09). Screen chrome (loading/error/retry) has a strong analog (see above); the WebView mounting/`originWhitelist`/`onError`/`onHttpError` wiring does not. Consult `react-native-webview`'s own docs (Context7) at plan/implementation time. |
| SEC-02 cross-tenant Vitest spec for the new FRND-07 join | test | request-response | No existing spec file covering a `my_festival` × `friendship` join was located in this pass's search scope (`apps/api/src/friendship`, `apps/api/src/festival`). The nearest structural analog is `projection-uniqueness.spec.ts` (referenced but not read) for the projection half; the tenant-scope half should follow the same house pattern as `sendRequest`'s/`unfriend`'s scoping tests if they exist under `apps/api/test/`. |

## Metadata

**Analog search scope:** `apps/mobile/app/`, `apps/mobile/components/`, `apps/mobile/lib/`,
`apps/api/src/friendship/`, `apps/api/src/festival/`, `packages/contracts/src/`.
**Files scanned (read in full or targeted):** `FloatingNav.tsx`, `festival-navigation.ts`,
`f/[festivalSlug].tsx`, `(festival)/_layout.tsx`, `AvatarTile.tsx`, `PersonRow.tsx`,
`ComingSoonTile.tsx`, `SoonToast.tsx`, `friend-queries.ts`, `festival-queries.ts`,
`(tabs)/_layout.tsx`, `(tabs)/home.tsx`, `app/_layout.tsx`, `lib/deep-link.ts`,
`lib/cold-start-redirect.ts`, `lib/api-client.ts`, `friendship.controller.ts`,
`friendship.service.ts`, `festival.controller.ts`, `packages/contracts/src/router.ts` (targeted
grep), `packages/contracts/src/schemas.ts` (targeted grep).
**Pattern extraction date:** 2026-08-13
