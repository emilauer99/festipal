# Phase 5: Festival Selection & Home - Pattern Map

**Mapped:** 2026-08-05
**Files analyzed:** 15
**Analogs found:** 15 / 15

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `packages/db/src/schema/festival.ts` (extend) | model | CRUD | `packages/db/src/schema/visitor-profile.ts` | exact (same drizzle-zod `.extend()` idiom) |
| `packages/db/scripts/seed.ts` (extend) | utility (script) | batch/upsert | itself (existing idempotent upsert) | exact |
| `packages/contracts/src/schemas.ts` `festivalSchema` (rework) | model/contract | request-response | `visitorProfilePublicSchema` composition in same file | exact |
| `apps/mobile/lib/active-festival-storage.ts` (new) | utility (storage) | file-I/O (device-local persistence) | `apps/mobile/lib/avatar-storage.ts` | exact |
| `apps/mobile/app/(tabs)/_layout.tsx` (new) | route (layout) | request-response (nav) | `apps/mobile/app/(festival)/_layout.tsx` (Stack) + `apps/mobile/app/_layout.tsx` (Stack.Protected structure) | role-match (no existing Tabs layout to copy 1:1) |
| `apps/mobile/app/(tabs)/home.tsx` (new) | component (screen) | CRUD (read + client composition) | `apps/mobile/app/festivals/index.tsx` | role-match |
| `apps/mobile/app/(tabs)/festivals.tsx` (moved+rewritten) | component (screen) | CRUD | `apps/mobile/app/festivals/index.tsx` (itself, evolved) | exact |
| `apps/mobile/app/(festival)/f/[festivalSlug].tsx` (new, replaces `(festival)/index.tsx`) | component (screen) | CRUD (single-resource read) | `apps/mobile/app/(festival)/index.tsx` | role-match (adds param + query) |
| `apps/mobile/app/_layout.tsx` (extend) | route (root guard) | event-driven (bootstrap effect) | itself (existing `resolveAuthState`/pending-destination effects) | exact |
| `apps/mobile/components/FloatingNav.tsx` (new) | component (owned primitive) | request-response (nav render) | `docs/concept/designs/festival/festipal-ds.js` `FloatingNav`/`GLOBAL_NAV` (reference only, not RN) | partial (no existing RN nav primitive to mirror; mirror the design system component's props) |
| `apps/mobile/components/FestivalCard.tsx` (new) | component (owned primitive) | request-response | `apps/mobile/app/festivals/index.tsx`'s inline `renderRow` (row markup to extract) + `festipal-ds.js` `FestivalCard` (visual reference) | role-match |
| `apps/mobile/components/SegmentedControl.tsx` (new) | component (owned primitive) | request-response | `festipal-ds.js` `SegmentedControl` (visual reference); no existing RN analog | partial |
| `apps/mobile/components/ComingSoonTile.tsx` (new) | component (owned primitive) | request-response (static) | none (new pattern, UI-SPEC explicit) | none — build per UI-SPEC Component Contract |
| `apps/mobile/lib/date-range.ts` (new, `formatDateRange`) | utility (pure fn) | transform | `apps/mobile/lib/otp-error.ts`-style pure helper (see `lib/__tests__/otp-error.test.ts` pattern) | role-match |
| `apps/api/test/festival-isolation.spec.ts` (extend) | test | request-response (integration) | itself | exact |
| `apps/api/test/save-idempotency.spec.ts` (extend) | test | request-response (integration) | itself | exact (not read this session — same suite conventions as `festival-isolation.spec.ts`, reuse `createTestApp`/`createTestDatabase` from `./setup`) |

## Pattern Assignments

### `packages/db/src/schema/festival.ts` (model, CRUD)

**Analog:** `packages/db/src/schema/visitor-profile.ts`

**Current festival.ts** (lines 1-18) — the target to extend:
```typescript
import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './_shared';
import { localeEnum } from './locale';

export const festival = pgTable('festival', {
  id: idColumn(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  defaultLocale: localeEnum().notNull().default('de'),
  cashlessUrl: text(),
  ...timestamps,
});
```
Add `startDate: date({ mode: 'string' })`, `endDate: date({ mode: 'string' })`, `place: text()` columns (import `date` from `drizzle-orm/pg-core` alongside the existing `pgTable, primaryKey, text, uuid`).

**drizzle-zod `.extend()` idiom to copy** (visitor-profile.ts lines 1-4, 64-87):
```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
// ...
export const festivalSelectSchema = createSelectSchema(festival).extend({
  place: z.string().nullable(),
  // startDate/endDate: date({mode:'string'}) generally infers fine as z.string(),
  // but verify against the text()-column bug comment below before omitting an override.
});
export const festivalInsertSchema = createInsertSchema(festival).extend({
  place: z.string().nullable().optional(),
});
```

**Why the `.extend()` is mandatory** (verbatim comment to reuse/adapt, visitor-profile.ts lines 45-63):
```typescript
/**
 * `.extend(...)` overrides for the free-text columns. Without these,
 * drizzle-zod's TS-level type inference collapses every `text()` column to
 * `unknown` here: calling `text()` with no `{ enum: [...] }` config makes
 * drizzle-orm infer `enumValues: [string, ...string[]]` instead of
 * `enumValues: undefined`, which trips drizzle-zod's enum-detection
 * heuristic at the type level. This is purely a static-type bug — the
 * RUNTIME schema was always correct — but it makes the exported type
 * unusable beyond return-position assignment. Keep this list in sync with
 * any new `text()` column added to this table.
 */
```

**Export barrel:** `packages/db/src/schema/index.ts` is already `export *` — no change needed once `festivalSelectSchema`/`festivalInsertSchema` are exported from `festival.ts`.

---

### `packages/contracts/src/schemas.ts` `festivalSchema` (model/contract, request-response)

**Analog:** `visitorProfilePublicSchema` composition, same file (lines 1-14, 24-37).

**Current hand-rolled shape to replace** (lines 6-14):
```typescript
export const festivalSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  defaultLocale: localeSchema,
  supportedLocales: z.array(localeSchema),
  cashlessUrl: z.string().url().nullable(),
});
export type Festival = z.infer<typeof festivalSchema>;
```

**Target pattern to copy** (mirrors lines 24-37's `visitorProfilePublicSchema` drift-detection composition):
```typescript
import { festivalSelectSchema, visitorProfileInsertSchema, visitorProfileSelectSchema } from '@festipal/db/schema';

/**
 * Drift-detection proof (Pitfall 6/1) — composed on the `@festipal/db`
 * drizzle-zod base, NOT a hand-mirrored `z.object`. `supportedLocales` is
 * NOT a column on `festival` (aggregated server-side from `festival_locale`)
 * so it stays a manual `.extend()`.
 */
export const festivalSchema = festivalSelectSchema
  .pick({
    id: true, slug: true, name: true, defaultLocale: true, cashlessUrl: true,
    startDate: true, endDate: true, place: true,
  })
  .extend({ supportedLocales: z.array(localeSchema) });
export type Festival = z.infer<typeof festivalSchema>;
```

**Import barrel note:** `visitorProfileInsertSchema`/`visitorProfileSelectSchema` are already imported from `@festipal/db/schema` at the top of this file (line 1) — add `festivalSelectSchema` to that same import line, do not add a second import statement.

---

### `packages/db/scripts/seed.ts` (utility/script, batch)

**Analog:** itself — existing idempotent `onConflictDoUpdate` shape (lines 22-33).

**Pattern to extend:**
```typescript
const [fest] = await db
  .insert(festival)
  .values({
    slug: 'frequency-2026',
    name: 'Frequency 2026',
    defaultLocale: 'de',
    startDate: '2026-08-13', // date({mode:'string'}) — raw ISO string, no Date object
    endDate: '2026-08-16',
    place: 'Wiesen, Burgenland',
  })
  .onConflictDoUpdate({
    target: festival.slug,
    set: {
      name: 'Frequency 2026', defaultLocale: 'de',
      startDate: '2026-08-13', endDate: '2026-08-16', place: 'Wiesen, Burgenland',
    },
  })
  .returning();
```
Keep the surrounding `try/finally { await db.$client.end(); }` shape (lines 21, 47-52) unchanged.

---

### `apps/mobile/lib/active-festival-storage.ts` (utility, file-I/O)

**Analog:** `apps/mobile/lib/avatar-storage.ts` (full file, 49 lines) — mirror EXACTLY, new storage id only.

```typescript
import type { createMMKV as CreateMMKVFn, MMKV } from 'react-native-mmkv';

const ACTIVE_FESTIVAL_STORAGE_ID = 'festipal-active-festival';
declare const require: (moduleId: string) => unknown;
let cachedStorage: MMKV | undefined;

function getStorage(): MMKV {
  if (!cachedStorage) {
    const { createMMKV } = require('react-native-mmkv') as { createMMKV: typeof CreateMMKVFn };
    cachedStorage = createMMKV({ id: ACTIVE_FESTIVAL_STORAGE_ID });
  }
  return cachedStorage;
}

export function saveActiveFestivalSlug(slug: string): void {
  getStorage().set('active-festival-slug', slug);
}
export function getActiveFestivalSlug(): string | undefined {
  return getStorage().getString('active-festival-slug');
}
export function clearActiveFestivalSlug(): void {
  getStorage().remove('active-festival-slug');
}
```

**Why lazy-require (comment to keep, avatar-storage.ts lines 3-16):** MMKV requires a native prebuild and cannot run under Vitest's node environment — `require('react-native-mmkv')` must stay inside `getStorage()`, never a top-level import, so this module stays importable in a non-native/test context.

---

### `apps/mobile/app/_layout.tsx` (route/root guard, event-driven, EXTEND not replace)

**Analog:** itself — existing bootstrap-effect + Stack.Protected structure (full file read, 269 lines).

**Key excerpt — current protected-route registration** (lines 213-223):
```typescript
<Stack>
  <Stack.Protected guard={authState.status === 'unauthenticated'}>
    <Stack.Screen name="(auth)" />
  </Stack.Protected>
  <Stack.Protected guard={authState.status === 'authenticated-no-profile'}>
    <Stack.Screen name="(profile-setup)" />
  </Stack.Protected>
  <Stack.Protected guard={authState.status === 'authenticated'}>
    <Stack.Screen name="festivals" />
    <Stack.Screen name="(festival)" />
  </Stack.Protected>
</Stack>
```
Change to register `(tabs)` instead of `festivals`, keep `(festival)` (now containing `f/[festivalSlug]`).

**One-shot effect idiom to mirror for the active-festival redirect** (same pattern as `consumePendingDestination`, lines 179-190):
```typescript
useEffect(() => {
  if (authState.status !== 'authenticated') return;
  const href = consumePendingDestination();
  if (href) { router.replace(href); return; }
  const activeSlug = getActiveFestivalSlug(); // NEW — MMKV read, synchronous
  if (activeSlug) router.replace(`/f/${activeSlug}`);
}, [authState.status, router]);
```
Guard with a ref so it fires exactly once per cold start — same idiom `splashHiddenRef` already uses (line 87, 194-199). Do NOT add a new async gate before `SplashScreen.hideAsync()` — MMKV reads are synchronous, `bootstrapped` (line 192) stays the sole splash gate.

---

### `apps/mobile/app/(tabs)/festivals.tsx` (component/screen, CRUD — evolves `app/festivals/index.tsx`)

**Analog:** `apps/mobile/app/festivals/index.tsx` (full file, 231 lines) — this IS the file being moved+rewritten, not a separate analog.

**Imports pattern to keep** (lines 1-17):
```typescript
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@festipal/ui';
import type { Festival } from '@festipal/contracts';
import { apiClient } from '../../lib/api-client';
```
(Note path depth changes: `(tabs)/festivals.tsx` is one level shallower than `festivals/index.tsx` — adjust `../../lib/...` to `../../lib/...` still 2 levels up from `app/(tabs)/`, verify actual depth at implementation time.)

**Existing query pattern to keep, extend with `listMyFestivals`** (lines 61-64):
```typescript
const festivalsQuery = useQuery({
  queryKey: ['festivals'],
  queryFn: () => apiClient.listFestivals(),
});
// ADD:
const myFestivalsQuery = useQuery({
  queryKey: ['me', 'festivals'],
  queryFn: () => apiClient.listMyFestivals(),
});
```

**Loading/error/empty JSX pattern to keep verbatim per segment** (lines 131-172) — UI-SPEC explicitly says "reuse existing `festivals/index.tsx` loading-text/error pattern" for both Meine and Alle segments (backstop rows in UI-SPEC `## UI Considerations`).

**Logout header (AUTH-04) stays as-is, unchanged position** (lines 43-59, 116-130) — UI-SPEC Scope note #8 explicitly keeps this on the Festivals screen.

**Optimistic save + invalidation — the NEW pattern to replace the current local-`Set` save** (current lines 38, 66-79 use local `useState<Set>`; RESEARCH.md's server-backed replacement):
```typescript
const queryClient = useQueryClient();
const saveMutation = useMutation({
  mutationFn: (festivalId: string) => apiClient.saveFestival({ params: { festivalId }, body: {} }),
  onMutate: async (festivalId) => {
    await queryClient.cancelQueries({ queryKey: ['me', 'festivals'] });
    const previous = queryClient.getQueryData(['me', 'festivals']);
    const optimisticFestival = queryClient
      .getQueryData<{ status: 200; body: Festival[] }>(['festivals'])
      ?.body.find((f) => f.id === festivalId);
    if (optimisticFestival) {
      queryClient.setQueryData<{ status: 200; body: Festival[] }>(['me', 'festivals'], (old) =>
        old ? { ...old, body: [...old.body, optimisticFestival] } : old,
      );
    }
    return { previous };
  },
  onError: (_err, _festivalId, context) => {
    if (context?.previous) queryClient.setQueryData(['me', 'festivals'], context.previous);
  },
  onSettled: () => {
    void queryClient.invalidateQueries({ queryKey: ['me', 'festivals'] });
  },
});
```

**Saved-state as client-derived Set (Pattern 3, RESEARCH.md):**
```typescript
const savedIds = new Set(
  myFestivalsQuery.data?.status === 200 ? myFestivalsQuery.data.body.map((f) => f.id) : [],
);
// FestivalCard receives saved={savedIds.has(festival.id)}
```

**Row markup to extract into `components/FestivalCard.tsx`** (current inline `renderRow`, lines 88-113) — becomes the owned primitive; header row (name + save/badge) + caption row (dates · place via `formatDateRange`).

**Style tokens already destructured this way — keep the pattern** (line 17):
```typescript
const { colors, typeRoles, layout, radii, spacingScale } = tokens;
```
Extend with `radiiScale` once added to `packages/ui/src/tokens.ts` (UI-SPEC "New additions needed" — `radiiScale['r-card']`/`r-md`/`r-pill`).

---

### `apps/mobile/app/(tabs)/home.tsx` (component/screen, CRUD, NEW)

**Analog:** `apps/mobile/app/festivals/index.tsx`'s query/loading/error scaffolding (same excerpts as above) — Home is a NEW screen composing the SAME two existing queries (`listFestivals` unused here; only `listMyFestivals` needed for the hero+rail), no new endpoint.

**Composition shape (RESEARCH.md D-04 + UI-SPEC):**
```typescript
const myFestivalsQuery = useQuery({ queryKey: ['me', 'festivals'], queryFn: () => apiClient.listMyFestivals() });
// hero = earliest upcoming by startDate else first-saved; rest -> horizontal rail
// empty (0 saved) -> shared empty-state block with "Browse festivals" CTA -> router.push to (tabs)/festivals with Alle segment
```
Reuse the same loading/error text pattern as `festivals/index.tsx` (lines 131-153) — UI-SPEC explicitly requires this, not a new skeleton.

---

### `apps/mobile/app/(festival)/f/[festivalSlug].tsx` (component/screen, CRUD, replaces `(festival)/index.tsx`)

**Analog:** `apps/mobile/app/(festival)/index.tsx` (full file, 49 lines) for the "Back" pattern; RESEARCH.md's Pattern 2 code example for the slug-keyed query.

**Existing back-navigation pattern to keep the SPIRIT of (but fix the target path)** (lines 26-30):
```typescript
<Pressable style={styles.button} onPress={() => router.push('/festivals')}>
  <Text style={styles.buttonText}><Trans>Back to festivals</Trans></Text>
</Pressable>
```
Target path changes from `/festivals` to `/(tabs)/festivals` (Pitfall 6 — grep every `'/festivals'`/`'/(festival)'` literal before considering the restructure done).

**New slug-keyed query pattern (RESEARCH.md Pattern 2, verbatim reference):**
```typescript
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Festival } from '@festipal/contracts';

export default function FestivalHomeScreen() {
  const { festivalSlug } = useLocalSearchParams<{ festivalSlug: string }>();
  const queryClient = useQueryClient();
  const initialData = findCachedFestivalBySlug(queryClient, festivalSlug);
  const festivalQuery = useQuery({
    queryKey: ['festival', festivalSlug],
    queryFn: () => apiClient.getFestival({ params: { slug: festivalSlug } }),
    initialData,
  });
  // identity (display2 name) + key facts (formatDateRange, place) + 4 ComingSoonTile
}

function findCachedFestivalBySlug(queryClient: ReturnType<typeof useQueryClient>, slug: string) {
  for (const key of [['festivals'], ['me', 'festivals']]) {
    const cached = queryClient.getQueryData<{ status: 200; body: Festival[] }>(key);
    const hit = cached?.body.find((f) => f.slug === slug);
    if (hit) return hit;
  }
  return undefined;
}
```
On save-affordance reuse inside this screen (UI-SPEC: hero variant's save badge also appears here) — call the SAME `saveMutation` shape as `(tabs)/festivals.tsx`, invalidate `['me', 'festivals']` identically.

---

### `apps/mobile/components/FloatingNav.tsx` / `(tabs)/_layout.tsx` (component + layout, request-response nav)

**Analog:** No existing RN Tabs layout in the codebase — closest structural analog is `apps/mobile/app/(festival)/_layout.tsx` (plain `<Stack />`, not read in full this session but confirmed by RESEARCH.md to be a bare Stack) and `app/_layout.tsx`'s `<Stack>`/`Stack.Protected` composition style (see excerpt above). Visual/prop reference: `docs/concept/designs/festival/festipal-ds.js`'s `FloatingNav`/`GLOBAL_NAV` (web/JSX, not RN — mirror prop SHAPE, not implementation).

**Pattern to implement (RESEARCH.md Pattern 1, verbatim code example):**
```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { FloatingNav } from '../../components/FloatingNav';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="festivals" options={{ headerShown: true, title: t`Festivals` }} />
    </Tabs>
  );
}
```
`FloatingNav` renders 2 real tabs from `state.routes` PLUS 2 decorative, non-navigable Friends/Profil buttons NOT part of `state.routes` (no backing `Tabs.Screen`, Phase 6 adds them) — `onPress` no-op, `accessibilityState={{ disabled: true }}`, `accessibilityLabel` appends "— coming soon" via `t()` (Pitfall 4 — do not hardcode this string, the lint exclusion for `accessibilityLabel` will not catch it).

**Style/token pattern to follow (same destructuring convention as festivals/index.tsx line 17):**
```typescript
const { colors, typeRoles, layout, radiiScale, spacingScale } = tokens;
```
Use `expo-blur`'s `BlurView` for the `glassFill`/`glassBorder` backdrop (new dependency, `pnpm --filter @festipal/mobile add expo-blur`).

---

### `apps/mobile/lib/date-range.ts` (utility, transform, NEW)

**Analog:** `apps/mobile/lib/otp-error.ts` (pure-function shape) + its test `lib/__tests__/otp-error.test.ts` (not read this session, but RESEARCH.md confirms this is the ONLY test pattern `apps/mobile`'s Vitest config supports — `lib/**/__tests__/**/*.test.ts`, node environment, no component rendering).

**Pattern (RESEARCH.md Pitfall 3, avoid `formatRange` entirely):**
```typescript
export function formatDateRange(start: string, end: string, locale: string): string {
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}
```
Write `apps/mobile/lib/__tests__/date-range.test.ts` mirroring `otp-error.test.ts`'s structure (pure input/output assertions, no RN imports).

---

### `apps/api/test/festival-isolation.spec.ts` (test, request-response integration, EXTEND)

**Analog:** itself (full file, 176 lines) — extend, do not replace.

**Fixture-creation pattern to extend for D-08 fields** (lines 102-118):
```typescript
const [festA] = await db
  .insert(festival)
  .values({
    slug: `isolation-test-a-${randomUUID()}`,
    name: 'Isolation Test Festival A',
    defaultLocale: 'de',
    startDate: '2026-08-13',   // NEW — assert round-trip
    endDate: '2026-08-16',
    place: 'Wiesen, Burgenland',
  })
  .returning();
```

**New assertion to add to the existing `it('visitor 1 (saved A only) sees exactly [A]...')` test (lines 145-154) or a new `it`:**
```typescript
expect(res.body[0].startDate).toBe('2026-08-13');
expect(res.body[0].place).toBe('Wiesen, Burgenland');
// cross-tenant: festival B's place/dates never leak into visitor1's me/festivals response
```

**Cleanup pattern to keep unchanged** (lines 133-143) — `afterAll` deletes fixtures in FK-safe order (`myFestival` → `visitorProfile` → `festival`), never touches `user`/`session` (better-auth owns those).

---

## Shared Patterns

### Zod schema composition on drizzle-zod bases (Pitfall 1/6 — the single most important shared pattern this phase)
**Source:** `packages/db/src/schema/visitor-profile.ts` lines 64-87, applied to `packages/contracts/src/schemas.ts` lines 24-37
**Apply to:** `festival.ts` schema + `schemas.ts` `festivalSchema` — never hand-redeclare a shape that has a backing table.

### Lazy-require MMKV storage module
**Source:** `apps/mobile/lib/avatar-storage.ts` (full file)
**Apply to:** `active-festival-storage.ts` — verbatim structural copy, new storage id (`festipal-active-festival`), new key namespace.

### TanStack Query key conventions
**Source:** `apps/mobile/app/festivals/index.tsx` lines 61-64 (`['festivals']`), extended per RESEARCH.md to `['me', 'festivals']` and `['festival', festivalSlug]`
**Apply to:** every new screen — `(tabs)/home.tsx`, `(tabs)/festivals.tsx`, `(festival)/f/[festivalSlug].tsx`. Query keys are arrays, never string-concatenated.

### Design-token destructuring at top of component
**Source:** `apps/mobile/app/festivals/index.tsx` line 17: `const { colors, typeRoles, layout, radii, spacingScale } = tokens;`
**Apply to:** all new components/screens — add `radiiScale` once landed in `packages/ui/src/tokens.ts` per UI-SPEC's "New additions needed" tables (Spacing Scale + Color sections).

### i18n via Lingui `t()`/`<Trans>`, no literal strings
**Source:** `apps/mobile/app/festivals/index.tsx` throughout (e.g. lines 102-103, 119, 124, 133-134, 138-141)
**Apply to:** all new user-facing copy, INCLUDING `accessibilityLabel` on the disabled tab items (Pitfall 4 — the lint exclusion does not catch this).

### Supertest integration test scaffolding
**Source:** `apps/api/test/festival-isolation.spec.ts` full file (`createTestApp`/`createTestDatabase` from `./setup`, `randomUUID()`-suffixed throwaway fixtures, FK-safe `afterAll` cleanup)
**Apply to:** the D-08 field round-trip assertions in `festival-isolation.spec.ts` and `save-idempotency.spec.ts`.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/mobile/components/ComingSoonTile.tsx` | component (owned primitive) | static | UI-SPEC explicitly calls this "a new pattern, no mockup precedent" — build directly from UI-SPEC's Component Contract section (2×2 grid, `View` not `Pressable`, muted styling), no codebase or mockup analog to copy from. |
| `apps/mobile/components/SegmentedControl.tsx` | component (owned primitive) | request-response | No existing RN segmented-control primitive in `apps/mobile/components/` (directory itself may not exist yet — this phase's first shared-component extraction). Visual reference only: `festipal-ds.js`'s web `SegmentedControl` (prop shape to mirror: `options`, `value`, `onChange` per UI-SPEC's "do not invent divergent prop names" instruction). |
| `apps/mobile/components/FloatingNav.tsx` | component (owned primitive) | request-response (nav) | No existing custom `Tabs`-driven nav bar in this RN codebase; closest is the web-only `festipal-ds.js` reference and RESEARCH.md's Context7-derived `Tabs`+`tabBar` prop-shape example (Assumption A4 — MEDIUM confidence, verify actual `expo-router` `Tabs` prop types in `node_modules` before implementation). |

## Metadata

**Analog search scope:** `apps/mobile/app/`, `apps/mobile/lib/`, `apps/mobile/components/` (does not yet exist), `packages/db/src/schema/`, `packages/db/scripts/`, `packages/contracts/src/`, `apps/api/test/`, `packages/ui/src/tokens.ts`, `docs/concept/designs/festival/` (reference-only, not RN code)
**Files scanned:** 11 read in full this session (festival.ts, visitor-profile.ts, avatar-storage.ts, festivals/index.tsx, (festival)/index.tsx, app/_layout.tsx, schemas.ts, api-client.ts, seed.ts, tokens.ts, festival-isolation.spec.ts) + all content already verified/quoted in 05-RESEARCH.md
**Pattern extraction date:** 2026-08-05
