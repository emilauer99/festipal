# Phase 5: Festival Selection & Home - Research

**Researched:** 2026-08-05
**Domain:** Expo Router navigation shell (custom bottom tab bar), Drizzle/ts-rest contract extension, TanStack Query client composition (React Native/Expo)
**Confidence:** HIGH (codebase-verified for all structural/contract claims) / MEDIUM (Expo Router tab-bar pattern, Hermes `Intl` behavior)

## Summary

Phase 5 is primarily an **integration and composition** phase, not a new-endpoint phase: all
required reads already exist (`listFestivals`, `listMyFestivals`, `saveFestival`, `getFestival`).
The two genuinely new pieces of engineering are (1) standing up a **global tab-bar navigation
frame** as the new root shell around the existing `(auth)`/`(profile-setup)`/`festivals`/`(festival)`
route groups, and (2) a **coordinated schema→contract→seed→client edit** adding `startDate`,
`endDate`, `place` to the `festival` table (D-08).

The single most important correction this research makes to `05-CONTEXT.md`'s own framing: **the
`festivalSchema` in `packages/contracts/src/schemas.ts` is currently a hand-rolled `z.object`, NOT
derived from a drizzle-zod base** — unlike `visitorProfilePublicSchema`, which *is* drizzle-zod
composed. D-08's language ("extend the drizzle-zod base") describes the *target* state, not the
*current* one: there is no festival drizzle-zod base to extend yet. The plan must **create** one
(`createSelectSchema(festival)` in `packages/db/src/schema/festival.ts`, mirroring
`visitor-profile.ts`'s `.extend()` idiom for the `place` text column) and then swap `festivalSchema`
in contracts over to it. This is a bigger edit than "add three fields" — it's "introduce the pattern
Phase 1 established for `visitor_profile`, for `festival`, for the first time."

The second load-bearing finding: **`getFestival` is slug-keyed** (`GET /festivals/:slug`), not
id-keyed, and there is no existing "active-festival focus" persistence anywhere in the codebase —
`05-CONTEXT.md`'s reference to "Phase 3's splash 'selected-festival state'" is aspirational language
carried in the CONTEXT doc, not an already-built hook. Phase 5 must build the persistence AND the
guard-level redirect from scratch, keyed by **slug** (matching the only single-festival read the
contract offers), using the same lazy-`require('react-native-mmkv')` idiom `lib/avatar-storage.ts`
already established.

**Primary recommendation:** Do the D-08 schema/contract/seed edit FIRST (Wave 1, foundation — every
other screen depends on `Festival.startDate/endDate/place` existing in the type), then the tab-shell
restructure (Wave 2, since it moves existing route files), then the three screens as a tracer +
polish sequence (Wave 3+), mirroring the wave shape Phases 3/4 already used successfully.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Global tab bar (Home/Festivals/Friends/Profil) | Browser/Client (Expo Router root layout) | — | Pure client navigation chrome; no server state |
| Festival list (Meine/Alle) | Browser/Client (screen composition) | API/Backend (existing `listFestivals`/`listMyFestivals`) | Client composes two existing reads; no new query logic server-side |
| One-tap save | Browser/Client (optimistic mutation) | API/Backend (existing `saveFestival`, idempotent) | Client owns optimistic UI + cache invalidation; server owns idempotency/409 |
| Festival master-data (dates/place) | Database/Storage (Drizzle schema) | API/Backend (contract composition) | New columns are the source of truth; API just passes them through unchanged |
| Active-festival focus (persistence) | Browser/Client (MMKV) | — | Purely a client nav-state concern; no server session field for it (confirmed: no `activeFestivalId`-shaped column anywhere in `packages/db`) |
| Festival home (identity + coming-soon menu) | Browser/Client (screen) | API/Backend (`getFestival` by slug) | Read-only composition of one existing (soon-extended) endpoint |
| `festivalId` data isolation (SEC-02) | API/Backend (query scoping) | Database/Storage (FK constraints) | Already enforced server-side (`festival-isolation.spec.ts`); Phase 5 adds no new isolation surface, only new *fields* on an already-scoped read |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEST-01 | Browse all festivals, name/dates/place | D-08 schema+contract extension; `listFestivals` already exists — Component Contract §FestivalCard |
| FEST-02 | Meine/Alle segment, default Meine | `SegmentedControl` client composition over `listFestivals`/`listMyFestivals` — Architecture Patterns §Festivals screen |
| FEST-03 | One-tap save to Meine | Existing idempotent `saveFestival` mutation + TanStack optimistic-update pattern — Code Examples §Optimistic save |
| FEST-04 | Gate-less enter + non-dead-end back | `(festival)` stacked sibling route + header back / explicit back CTA — Architecture Patterns §Tab shell |
| HOME-01 | Land on festival home after entering | Active-festival persistence + `(festival)/[festivalSlug]` route — Architecture Patterns §Active-festival focus |
| HOME-02 | Home shows identity + key facts, openable | `getFestival(slug)` + UI-SPEC Component Contract (already approved) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo-router` | ~57.0.9 (already installed) [VERIFIED: apps/mobile/package.json:39] | File-based navigation, `Tabs` navigator | Already the project's router; no alternative considered |
| `expo-blur` | 57.0.2 latest on npm [VERIFIED: npm registry] | `BlurView` backdrop for the floating glass nav pill | Official first-party Expo package (`github.com/expo/expo`), same publisher/version-train as `expo-image`/`expo-font` already installed; UI-SPEC's only new dependency this phase |
| `react-native-mmkv` | ^4.3.2 (already installed) [VERIFIED: apps/mobile/package.json:46] | Active-festival slug persistence | Already used for avatar URI storage (`lib/avatar-storage.ts`) — reuse the same lazy-require idiom, don't add SecureStore/AsyncStorage as a second storage mechanism |
| `drizzle-zod` | 0.7.1 (already installed, pinned) [VERIFIED: packages/db/package.json:35] | Derive `festivalSelectSchema`/`festivalInsertSchema` from the `festival` Drizzle table | Pinned to 0.7.1 per STATE.md (0.8.x imports zod/v4, breaks the workspace's zod v3 pin, ADR-006) — do not bump |
| `@tanstack/react-query` | ^5.101.4 (already installed) [VERIFIED: apps/mobile/package.json:27] | Query/mutation + optimistic save + cache invalidation | Already the project's single QueryClientProvider (`lib/query-client.ts`) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react-native` | ^1.28.0 (already installed) | Tab bar icons (`home`, `tent`, `users`, `user-round`), key-fact icons (`calendar-clock`, `map-pin`), coming-soon tile icons | Already the project's icon library (Phase 4 dep) — matches UI-SPEC exactly |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Tabs` (react-navigation bottom-tabs, via `expo-router`) + custom `tabBar` render prop | `expo-router/ui` headless `Tabs`/`TabList`/`TabTrigger`/`TabSlot` | The headless API is explicitly documented as **experimental** [CITED: docs.expo.dev "Custom tab layouts"] — higher API-churn risk for a production app; `Tabs` + custom `tabBar` is stable and already gives 100% visual control (the tab bar is fully custom-rendered either way) |
| MMKV for active-festival slug | `expo-secure-store` (already used for the session cookie) | SecureStore has a documented ~2KB size limit (RESEARCH flag from Phase 3) and is semantically for secrets; a festival slug is not a secret — MMKV matches the existing avatar-URI precedent exactly |

**Installation:**
```bash
pnpm --filter @festipal/mobile add expo-blur
```

**Version verification:** `expo-blur@57.0.2` confirmed via `npm view expo-blur version` [VERIFIED: npm registry] — matches the SDK-57 version train of every other `expo-*` package already pinned in `apps/mobile/package.json` (`expo-image@~57.0.2`, `expo-font@~57.0.1`, etc.), so `~57.0.2` is the correct range to pin, consistent with the rest of the file.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `expo-blur` | npm | Official Expo monorepo package (same publisher/repo as 6 already-installed `expo-*` deps) [VERIFIED: npm registry — `repository.url: git+https://github.com/expo/expo.git`] | High (bundled with every Expo SDK install) | `github.com/expo/expo` | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*No `checkpoint:human-verify` needed for `expo-blur` — it is a first-party Expo package verified against the official registry+repo, not a WebSearch-discovered/unverified name.*

## Architecture Patterns

### System Architecture Diagram

```
Cold start
   │
   ▼
app/_layout.tsx (root guard — EXISTING, extended)
   │  resolves: locale + 4-state auth (unchanged from Phase 4)
   │
   ├─ status='authenticated' ──► NEW: read MMKV active-festival slug
   │                                │
   │                    ┌───────────┴────────────┐
   │                    │                         │
   │              slug present              no slug (default)
   │                    │                         │
   │                    ▼                         ▼
   │        router.replace('/f/{slug}')   lands on (tabs)/home (default init. route)
   │                    │                         │
   │                    ▼                         ▼
   │           (festival)/f/[slug]           (tabs) group
   │           - getFestival(slug) query          │
   │           - identity + key facts        ┌────┴────┬─────────┬─────────┐
   │           - 4 disabled tiles           Home    Festivals  Friends*  Profil*
   │           - back → (tabs)               │          │      (disabled) (disabled)
   │           - Save affordance         hero card   Meine/Alle
   │             (same as list row)      + rail      SegmentedControl
   │                    │                    │          │
   │                    │              listMyFestivals  listFestivals
   │                    │              listFestivals    listMyFestivals (saved-state)
   │                    │                    │          │
   │                    └────────────────────┴──────────┘
   │                         tap any FestivalCard
   │                                │
   │                                ▼
   │                    router.push('/f/{tappedSlug}')
   │                    + MMKV.set(active-festival, tappedSlug)
   │                                │
   │                                └──► back to (festival)/f/[slug] above
   │
   └─ status≠'authenticated' ──► (auth) / (profile-setup) (UNCHANGED from Phase 4)

*Friends/Profil: rendered by the custom tab bar as visually-present, disabled buttons —
 NOT real Tabs.Screen routes this phase (no navigation target exists yet, Phase 6).
```

### Recommended Project Structure
```
apps/mobile/app/
├── (auth)/                       # UNCHANGED (Phase 4)
├── (profile-setup)/              # UNCHANGED (Phase 4)
├── (tabs)/                       # NEW — replaces the old top-level "festivals" group
│   ├── _layout.tsx               #   <Tabs tabBar={props => <FloatingNav {...props} />}>
│   ├── home.tsx                  #   Home tab (D-04 lean overview) — no nested Stack needed
│   └── festivals.tsx             #   Festivals tab (Meine/Alle) — moved from app/festivals/index.tsx
├── (festival)/                   # UNCHANGED group name, NEW dynamic route inside it
│   ├── _layout.tsx               #   UNCHANGED — still a plain <Stack />
│   └── f/
│       └── [festivalSlug].tsx    #   NEW — replaces the old static index.tsx placeholder
└── _layout.tsx                   # EXTENDED — active-festival MMKV read + redirect
apps/mobile/components/
├── FloatingNav.tsx                # NEW — owned primitive (ADR-022), consumes Tabs' state/descriptors/navigation
├── FestivalCard.tsx                # NEW — owned primitive, flat non-photo variant (UI-SPEC Component Contract)
├── SegmentedControl.tsx            # NEW — owned primitive
└── ComingSoonTile.tsx              # NEW — owned primitive
apps/mobile/lib/
└── active-festival-storage.ts      # NEW — mirrors lib/avatar-storage.ts exactly (lazy MMKV require)
packages/db/src/schema/
└── festival.ts                     # EXTENDED — startDate/endDate/place columns + drizzle-zod bases
packages/contracts/src/
└── schemas.ts                      # EXTENDED — festivalSchema now composed on the new drizzle-zod base
```

### Pattern 1: Tab shell via `Tabs` + fully custom `tabBar` render prop

**What:** Use `expo-router`'s stable `Tabs` component (built on React Navigation's bottom-tabs) purely
for routing/focus-state bookkeeping; pass a `tabBar` render prop that renders the project's own
`FloatingNav` component instead of React Navigation's default tab bar UI.

**When to use:** Whenever a custom-styled tab bar is required in Expo Router without adopting the
**experimental** headless `expo-router/ui` API [CITED: docs.expo.dev "Custom tab layouts" — "Expo
Router provides an experimental set of unstyled, flexible headless tab components via the
expo-router/ui submodule"].

**Example:**
```typescript
// Source: Context7 /websites/expo_dev ("Tabs Navigation", "Screen Options: Tab Bar Customization")
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { FloatingNav } from '../../components/FloatingNav';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingNav {...props} />}
      screenOptions={{ headerShown: false }} // header handled per-screen; Home has none, Festivals keeps its plain title
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="festivals" options={{ headerShown: true, title: 'Festivals' /* via t`` */ }} />
    </Tabs>
  );
}
```

`FloatingNav` receives React Navigation's standard bottom-tabs props (`state`, `descriptors`,
`navigation`, `insets`) — it renders the 2 real tabs from `state.routes` PLUS 2 decorative,
non-navigable Friends/Profil buttons that are not part of `state.routes` at all (they have no
backing `Tabs.Screen` this phase — Phase 6 adds them). This avoids needing placeholder screen files
for Friends/Profil and matches UI-SPEC's "no navigation on tap" requirement exactly, since a button
with no `onPress` wiring cannot navigate by construction (belt-and-suspenders beyond
`accessibilityState={{ disabled: true }}`).

### Pattern 2: Festival home as a namespaced dynamic route, keyed by slug

**What:** `app/(festival)/f/[festivalSlug].tsx`, read via `useLocalSearchParams<{ festivalSlug: string }>()`.

**When to use:** Any screen that needs to fetch a single festival — this is the ONLY id shape the
contract supports for a single-festival read: `getFestival: { method: 'GET', path:
'/festivals/:slug', pathParams: z.object({ slug: z.string() }) }` [VERIFIED:
packages/contracts/src/router.ts:30-36 — `path: '/festivals/:slug'`, `pathParams: z.object({ slug:
z.string() })`]. Do NOT invent a second `getFestivalById` endpoint or pass the UUID `id` through
navigation — the existing `Festival` type already carries `slug` on every list row, so there is
zero reason to add a new contract surface.

**Why namespaced under `f/` and not `(festival)/[festivalSlug].tsx` directly:** because `(festival)`
is a parenthesized route GROUP, it is transparent to the resolved URL — a bare
`(festival)/[festivalSlug].tsx` would resolve to the top-level path `/:festivalSlug`, a broad
wildcard sitting at the same path level as `/home`/`/festivals` and any future top-level route. The
`f/` segment (`(festival)/f/[festivalSlug].tsx` → path `/f/:festivalSlug`) avoids that collision risk
for near-zero cost — the same convention many Expo Router apps use for entity-detail dynamic routes.

**Example:**
```typescript
// Source: RESEARCH-derived pattern, composed from apps/mobile/lib/api-client.ts's existing client
// app/(festival)/f/[festivalSlug].tsx
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../lib/api-client';
import type { Festival } from '@festipal/contracts';

export default function FestivalHomeScreen() {
  const { festivalSlug } = useLocalSearchParams<{ festivalSlug: string }>();
  const queryClient = useQueryClient();

  // Instant paint from an already-fetched list (Home/Festivals tab), background-refetches
  // for freshness — never skips the scoped read (SEC-02 stays enforced server-side regardless).
  const initialData = findCachedFestivalBySlug(queryClient, festivalSlug);

  const festivalQuery = useQuery({
    queryKey: ['festival', festivalSlug],
    queryFn: () => apiClient.getFestival({ params: { slug: festivalSlug } }),
    initialData,
  });
  // ... identity + key-facts + coming-soon tiles render from festivalQuery.data.body
}

function findCachedFestivalBySlug(
  queryClient: ReturnType<typeof useQueryClient>,
  slug: string,
): Festival | undefined {
  for (const key of [['festivals'], ['me', 'festivals']]) {
    const cached = queryClient.getQueryData<{ status: 200; body: Festival[] }>(key);
    const hit = cached?.body.find((f) => f.slug === slug);
    if (hit) return hit;
  }
  return undefined;
}
```

### Pattern 3: Client-derived saved-state (no `saved` field on `Festival`)

**What:** `festivalSchema` has no `saved: boolean` field — [VERIFIED: packages/contracts/src/schemas.ts:6-13]
```typescript
export const festivalSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  defaultLocale: localeSchema,
  supportedLocales: z.array(localeSchema),
  cashlessUrl: z.string().url().nullable(),
});
```
Saved-state must be computed client-side as **set membership**: a festival is "saved" iff its `id`
appears in the `listMyFestivals` result. Do not add a server-side `saved` flag to `listFestivals` —
that would require passing the caller's identity into an otherwise-unscoped browse endpoint,
duplicating `listMyFestivals`'s job (the codebase's own comment already prohibits this pattern —
"Distinct from `MeService.listMyFestivals` (caller-scoped) — never one endpoint + client-side
`.filter()`" governs the INVERSE case, but the same "keep browse and mine separate" principle means
the *client* is exactly where saved-state composition belongs).

**Example:**
```typescript
// Source: RESEARCH-derived, extends the existing festivals/index.tsx query shape
const myFestivalsQuery = useQuery({ queryKey: ['me', 'festivals'], queryFn: () => apiClient.listMyFestivals() });
const savedIds = new Set(
  myFestivalsQuery.data?.status === 200 ? myFestivalsQuery.data.body.map((f) => f.id) : [],
);
// FestivalCard receives `saved={savedIds.has(festival.id)}`
```

### Pattern 4: Active-festival persistence — mirror `avatar-storage.ts` exactly

**What:** `lib/active-festival-storage.ts`, same lazy-`require` idiom as the existing
`lib/avatar-storage.ts` [VERIFIED: apps/mobile/lib/avatar-storage.ts:1-49 — full file quoted below],
using its own MMKV instance id (not reusing `'festipal-avatar'`).

```typescript
// Source: apps/mobile/lib/avatar-storage.ts (verbatim pattern to mirror, new storage id)
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

Wire the read into `app/_layout.tsx`'s existing bootstrap effect — NOT a new gate (the splash must
not be held any longer than today; MMKV reads are synchronous), simply an additional
`router.replace()` call once `authState.status === 'authenticated'` resolves, guarded by a ref so it
fires exactly once per cold start (same one-shot idiom the file already uses for
`consumePendingDestination`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Tab bar routing/focus bookkeeping | A manual `useState` tab-index + conditionally-rendered screens | `Tabs` from `expo-router` with a custom `tabBar` prop | React Navigation's bottom-tabs already solves screen lifecycle, back-button behavior, and accessibility focus order correctly; reinventing it loses those for zero visual benefit since the tab bar is custom either way |
| Backdrop blur | A manual `Animated`/opacity-layered "blur" approximation | `expo-blur`'s `BlurView` | Real native blur (iOS `UIVisualEffectView` / Android RenderEffect) — an opacity hack looks visibly different and doesn't match `--glass-blur: 22px` / `--glass-saturate: 180%` |
| Saved-state tracking | A new server-side `saved` boolean on the browse endpoint | Client-side `Set` derived from `listMyFestivals` (Pattern 3 above) | Avoids a second scoped-vs-unscoped contract ambiguity; the codebase already treats browse/mine as strictly separate reads |
| Date-range formatting | A hand-written German date-range formatter string | `Intl.DateTimeFormat` (two `format()` calls joined with an en-dash — see Pitfall 3) | Locale-correctness (month names, ordering) is exactly what `Intl` exists for; D-08 explicitly requires it, "no hardcoded German string" |

**Key insight:** Every "Don't Hand-Roll" item above already has a project-standard tool one
`pnpm add` (or zero-install, since 3 of 4 are already dependencies) away — the temptation in this
phase is specifically to reach for a manual approximation of the glass-nav visual, which will look
subtly wrong next to the reference mockup.

## Common Pitfalls

### Pitfall 1: Treating D-08 as "add three columns" instead of "introduce drizzle-zod for festival"
**What goes wrong:** A plan that just does `ALTER TABLE festival ADD COLUMN ...` and then manually
adds three fields to the existing hand-rolled `festivalSchema` in `packages/contracts/src/schemas.ts`
"succeeds" in the narrow sense but leaves the drift-detection gap CONTEXT.md explicitly calls out
(Pitfall 6 in the project's own PITFALLS numbering) — a future column rename still won't break the
contract's typecheck, because `festivalSchema` still isn't derived from the table.
**Why it happens:** The existing `festivalSchema` LOOKS like it could be drizzle-zod-derived (it has
the right shape), so it's easy to assume the base already exists and just extend it.
**How to avoid:** Follow `visitor-profile.ts`'s exact pattern: add
`export const festivalSelectSchema = createSelectSchema(festival).extend({ place: z.string().nullable() })`
(and an insert-schema base if the seed script should also go through Zod validation) to
`packages/db/src/schema/festival.ts`, export it from `packages/db/src/schema/index.ts` (already a
barrel `export *`, no change needed there), then in `packages/contracts/src/schemas.ts` change
`festivalSchema` to `festivalSelectSchema.pick({ id: true, slug: true, name: true, defaultLocale:
true, cashlessUrl: true, startDate: true, endDate: true, place: true }).extend({ supportedLocales:
z.array(localeSchema) })` — `supportedLocales` stays a manual `.extend()` because it is NOT a column
on `festival` (it's aggregated server-side from the `festival_locale` join table, confirmed in both
`FestivalService.getBySlug`/`listAll` and `MeService.listMyFestivals`), so it cannot come from
`createSelectSchema(festival)` no matter how the base is built.
**Warning signs:** A PR that touches `packages/db/src/schema/festival.ts` but does NOT touch
`packages/db/src/schema/festival.ts`'s import line to add `createSelectSchema`/`createInsertSchema`
from `drizzle-zod`.

### Pitfall 2: `text()` column type-inference bug — `place` needs the same `.extend()` workaround as `username`/`displayName`
**What goes wrong:** Without an explicit `.extend({ place: z.string()... })` override,
`createSelectSchema(festival)`'s inferred TS type for `place` collapses to `unknown` — the exact bug
already documented and fixed for `visitor_profile`'s four `text()` columns [VERIFIED:
packages/db/src/schema/visitor-profile.ts:45-63 — full comment block: "Without these, drizzle-zod's
TS-level type inference collapses every `text()` column to `unknown` here... This is purely a
static-type bug — the RUNTIME schema... was always correct — but it made the exported... types...
unusable for anything beyond return-position assignment."]. This is a **drizzle-zod 0.7.1 +
drizzle-orm 0.45.2 combination bug**, not a `place`-specific issue — it will hit `place` identically.
**Why it happens:** `text()` with no `{ enum: [...] }` config makes drizzle-orm infer
`enumValues: [string, ...string[]]` instead of `enumValues: undefined`, which trips drizzle-zod's
enum-detection heuristic at the type level — already root-caused in this exact codebase.
**How to avoid:** In the new `festivalSelectSchema`/`festivalInsertSchema`, explicitly `.extend({
place: z.string().nullable() })` (nullable since `place` is likely optional at insert time for a
partially-configured festival — confirm against the actual column's `.notNull()`/no-`.notNull()`
choice made during planning) exactly like `visitor-profile.ts` does for its four `text()` columns.
**Warning signs:** `Festival['place']` resolving to `unknown` in an IDE/`tsc --noEmit` run — the
exact symptom STATE.md records as already having bitten this codebase once (Phase 2, 02-03).

### Pitfall 3: `Intl.DateTimeFormat.prototype.formatRange` is unreliable on Hermes/iOS
**What goes wrong:** `formatRange()` (the single-call API that would naturally produce "31. Juli –
2. Aug 2026" in one line) has a documented history of intermittent failures/removals on Hermes iOS —
`facebook/hermes#1172` ("Intl.DateTimeFormat returns incorrect values on real iOS devices") and
`reactwg/react-native-releases#623` ("[0.77][iOS][Hermes] Intl.DateTimeFormat.formatToParts() is
undefined (again)") [CITED: github.com/facebook/hermes/issues/1172,
github.com/reactwg/react-native-releases/issues/623 — WebSearch, not verified against this project's
specific RN 0.86.2/SDK-57 Hermes build].
**Why it happens:** Hermes's ICU/`Intl` support has shipped incrementally and inconsistently across
RN versions and platforms; `formatRange`/`formatToParts` are documented as the most fragile corner of
it, more recently than the general `Intl.DateTimeFormat` constructor.
**How to avoid:** Skip `formatRange()` entirely — do not attempt it and fall back only on failure.
Use two separate `Intl.DateTimeFormat(locale, {...}).format()` calls (start, end) joined with an
en-dash, which only depends on the well-supported basic `format()` path:
```typescript
// Source: RESEARCH-derived defensive pattern (avoids formatRange entirely, not just as a fallback)
function formatDateRange(start: string, end: string, locale: string): string {
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}
```
**Warning signs:** A date range rendering as `Invalid Date` or throwing on a real iOS device build
specifically (this is not reproducible in the Expo Go/simulator dev loop as reliably as on-device).

### Pitfall 4: eslint `no-literal-string`'s `accessibilityLabel` exclusion is a lint gap, not a copy exemption
**What goes wrong:** `apps/mobile/eslint.config.mjs`'s `i18next/no-literal-string` rule explicitly
excludes `accessibilityLabel` from its `jsx-attributes` check [VERIFIED: apps/mobile/eslint.config.mjs:39-54
— `'jsx-attributes': { exclude: [... 'testID', 'accessibilityLabel', 'accessibilityHint'] }`]. UI-SPEC's
disabled-tab requirement ("`accessibilityLabel` appends '— coming soon' / '— bald verfügbar' so
screen readers announce intent") is user-facing copy that the LINTER WILL NOT CATCH if hardcoded —
it is easy to accidentally ship `accessibilityLabel="Friends — coming soon"` as a literal and have
CI stay green.
**Why it happens:** The exclusion exists because `accessibilityLabel`/`testID` are often
non-visual/test-only strings elsewhere in the codebase; it's a blanket rule, not scoped to this one
disabled-tab case.
**How to avoid:** Manually route the accessibility label through `t()`
(`` t`${label} — coming soon` `` composed at render time, or a `t`Coming soon`` suffix string
appended after the base label), same as any other user-facing string — do not rely on the linter as
the sole enforcement mechanism for I18N-01 here.
**Warning signs:** A code-review pass that only checks "did the lint pass" will miss this — needs an
explicit manual check on the two disabled tab items.

### Pitfall 5: No component-level test coverage exists in `apps/mobile` — plan verification accordingly
**What goes wrong:** Assuming `apps/mobile`'s Vitest runner can validate any of this phase's actual
UI (tab bar rendering, screen composition, navigation flow) the way `apps/api`'s Vitest+supertest
suite validates backend behavior.
**Why it happens:** The existing `apps/api/test/*.spec.ts` suite (8 files) creates a false
impression of "this project has integration tests" — but `apps/mobile/vitest.config.ts` is
explicitly scoped to `environment: 'node'`, `include: ['lib/**/__tests__/**/*.test.ts']` only
[VERIFIED: apps/mobile/vitest.config.ts:1-19 — "this runner is scoped to PURE `lib/` function
tests... It intentionally does NOT render React Native components"]. No `@testing-library/react-native`,
no component rendering, no navigation-flow testing exists anywhere in `apps/mobile`.
**How to avoid:** Automated coverage for this phase is limited to: (a) pure functions extracted to
`lib/` (e.g. `formatDateRange`, `findCachedFestivalBySlug`, the active-festival storage module's pure
helpers) get real Vitest unit tests, mirroring `lib/__tests__/otp-error.test.ts`'s pattern; (b) the
`packages/db`/`packages/contracts`/`apps/api` side of D-08 gets real supertest coverage extending
`festival-isolation.spec.ts`'s pattern (assert `startDate`/`endDate`/`place` round-trip through
`listFestivals`/`listMyFestivals`/`getFestival`). Everything else (tab-bar visual/interaction
behavior, screen-to-screen navigation, cold-start redirect) is **manual on-device UAT**, matching how
Phase 3/4 signed off their core-value paths (STATE.md: "full core-value path... signed off on REAL
ANDROID").
**Warning signs:** A plan that lists `apps/mobile` component tests as an automated verification step
without first adding `@testing-library/react-native` + jest-expo (a Wave-0-sized infrastructure
change this phase's scope does not include, per CONTEXT.md's scope anchor).

### Pitfall 6: Restructuring `app/festivals/` breaks a route Phase 3/4 code already references
**What goes wrong:** `app/festivals/index.tsx`'s `handleEnter` currently does
`router.push('/(festival)')` [VERIFIED: apps/mobile/app/festivals/index.tsx:85 — `router.push('/(festival)');`],
and `app/(festival)/index.tsx`'s back button does `router.push('/festivals')` [VERIFIED:
apps/mobile/app/(festival)/index.tsx:26 — `onPress={() => router.push('/festivals')}`]. Both paths
change shape this phase (`/festivals` → inside `(tabs)`, `(festival)` → `(festival)/f/[slug]`) — a
naive move-the-files refactor without updating every `router.push`/`router.replace` call site leaves
dead navigation.
**Why it happens:** Expo Router paths are string literals scattered across files, not a single
central route table Ctrl+F can catch in one place if the string is constructed dynamically.
**How to avoid:** Grep the whole `apps/mobile/app/` + `apps/mobile/lib/` tree for `'/festivals'` and
`'/(festival)'` literal path strings before considering the route restructure complete; both existing
call sites above are affected, and this phase's Home hero CTA + rail rows add several more.
**Warning signs:** `expo-router`'s dev-mode "no route found" warning at runtime; TypeScript's typed
routes feature (if enabled) would catch this at compile time — verify whether
`experiments.typedRoutes` is on in `app.json`/`app.config.ts` (not confirmed in this research pass)
and enable it if not, since it would turn this whole pitfall into a compile error.

## Code Examples

### Optimistic save + query invalidation (extends the existing session-only save pattern)
```typescript
// Source: RESEARCH-derived, extends apps/mobile/app/festivals/index.tsx's existing useMutation shape
// to the D-05 server-backed requirement (survive restart via GET /me/festivals, not local Set)
const queryClient = useQueryClient();

const saveMutation = useMutation({
  mutationFn: (festivalId: string) => apiClient.saveFestival({ params: { festivalId }, body: {} }),
  onMutate: async (festivalId) => {
    await queryClient.cancelQueries({ queryKey: ['me', 'festivals'] });
    const previous = queryClient.getQueryData(['me', 'festivals']);
    // optimistic insert into the me/festivals cache using the row already known from `festivals`
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
    // Always reconcile with the server, optimistic or not (409/profile-required case
    // included — the server is the source of truth for the idempotent save).
    void queryClient.invalidateQueries({ queryKey: ['me', 'festivals'] });
  },
});
```

### D-08 seed extension (extends the existing idempotent `onConflictDoUpdate` pattern)
```typescript
// Source: RESEARCH-derived, extends packages/db/scripts/seed.ts's existing shape
// (verbatim existing shape: .values({ slug: 'frequency-2026', name: 'Frequency 2026', defaultLocale: 'de' })
//  .onConflictDoUpdate({ target: festival.slug, set: { name: ..., defaultLocale: ... } })
//  — VERIFIED: packages/db/scripts/seed.ts:22-33)
.values({
  slug: 'frequency-2026',
  name: 'Frequency 2026',
  defaultLocale: 'de',
  startDate: '2026-08-13', // date({mode:'string'}) — raw ISO date string, no Date object
  endDate: '2026-08-16',
  place: 'Wiesen, Burgenland',
})
.onConflictDoUpdate({
  target: festival.slug,
  set: { name: 'Frequency 2026', defaultLocale: 'de', startDate: '2026-08-13', endDate: '2026-08-16', place: 'Wiesen, Burgenland' },
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|---------------|--------|
| Session-only local `Set<festivalId>` for saved-state (Phase 3) | Server-backed via `GET /me/festivals` set-membership (Phase 5, D-05) | This phase | Save survives app restart (fixes the exact gap 03-05's own decision log flagged: "Save-state tracked client-side per session... not via a second listMyFestivals query -- saveFestival's own idempotency makes this a UX nicety, not a correctness need" — Phase 5 upgrades this from a nicety to a requirement) |
| Static, non-parameterized `(festival)/index.tsx` placeholder | Slug-keyed dynamic route `(festival)/f/[festivalSlug].tsx` | This phase | First real per-festival content; every future content phase (Timetable/Lageplan/Cashless/News tiles) will nest under this same dynamic segment |

**Deprecated/outdated:**
- `app/festivals/_layout.tsx` and the top-level `festivals` route group are superseded by
  `app/(tabs)/_layout.tsx` + `app/(tabs)/festivals.tsx` — delete the old files, don't leave both.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `place` should be `.notNull()` at the DB level vs. nullable — CONTEXT.md D-08 doesn't specify NOT NULL explicitly; this research assumed nullable (matching the flat-card long-text backstop in UI-SPEC, which defensively handles a potentially-empty caption) | Pitfall 2, Code Examples | If the planner locks `place` as `NOT NULL`, the `.extend()` override must drop `.nullable()` and every seed/migration must supply a non-null value — low risk, one-line fix, but should be an explicit planning decision, not inherited from this research's default |
| A2 | `startDate`/`endDate` use `date({ mode: 'string' })`, not `timestamp` or `date({ mode: 'date' })` | Architecture Patterns, Pitfall 1/2 | If a future phase needs time-of-day precision (e.g., gate-opening time), a `date`-only column would need a follow-up migration to `timestamp`; low risk since D-08 explicitly scopes this to date-only "key facts", not schedule precision |
| A3 | `expo-blur`'s `BlurView` `intensity` value that visually approximates `--glass-blur: 22px` / `--glass-saturate: 180%` is not pre-verified — UI-SPEC itself defers this ("`intensity` tuned to approximate") | Standard Stack, Don't Hand-Roll | Low risk — a visual-tuning task at implementation time, not a structural risk; flagged so the plan includes an explicit "tune on-device against both color schemes" verification step rather than picking one number and moving on |
| A4 | The `Tabs` + custom `tabBar` prop pattern (Pattern 1) receives `state`/`descriptors`/`navigation` props with the same shape as vanilla React Navigation bottom-tabs — this was NOT verified against `expo-router`'s exact re-export/wrapper types for SDK 57 specifically (context7 results describe the general React Navigation-backed `Tabs` API, not a version-pinned signature check) | Architecture Patterns Pattern 1 | Medium risk if the SDK-57 `Tabs` wrapper's prop shape has drifted from bare React Navigation — the executor should read `node_modules/expo-router`'s actual `Tabs`/`tabBar` type definitions before writing `FloatingNav`'s prop types, rather than trusting this research's assumed shape verbatim |

**If this table is empty:** N/A — see rows above.

## Open Questions

1. **Is `experiments.typedRoutes` enabled in `apps/mobile`'s Expo config?**
   - What we know: Enabling it would turn Pitfall 6's stringly-typed route risk into a compile-time
     check, which is valuable given this phase renames/moves 2 existing routes and adds 2 new ones.
   - What's unclear: This research did not locate/read `app.json`/`app.config.ts` to confirm its
     current value.
   - Recommendation: The planner should check this file directly; if off, enabling it is a
     low-cost, high-value addition to this phase's Wave 2 (route restructure) task, not a separate
     phase.

2. **Should `place` be free text or a small fixed vocabulary?**
   - What we know: D-08 explicitly says `place` is "user-generated content → NOT translated
     (ADR-020)" and UI-SPEC's long-text backstop treats it as unbounded free text with
     `numberOfLines={1}` truncation.
   - What's unclear: Whether "user-generated" here means organizer-entered-via-admin (this
     milestone has no admin UI yet — `apps/admin` is out of scope per REQUIREMENTS.md) or purely
     seed-script-entered for now.
   - Recommendation: Treat as plain `text()`, seed-script-entered only this phase (matches how
     `name`/`slug` are already seeded) — no new validation beyond nullability; this is consistent
     with D-08's own scope note that the admin-editing path doesn't exist yet.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Neon Postgres (dev branch) | D-08 migration + seed | Assumed available (Phases 1-4 already ran migrations against it) — not re-verified this session | 18 [CITED: docs/DEVELOPMENT_DECISIONS.md ADR-005] | — |
| `expo-blur` on npm registry | Floating nav backdrop | ✓ | 57.0.2 [VERIFIED: npm registry] | — |
| Android device/emulator for manual UAT | FEST-01..04/HOME-01/02 sign-off | Established convention from Phase 3/4 (STATE.md: "signed off on REAL ANDROID") — assumed available, not re-verified this session | — | iOS on-device verification remains deferred per STATE.md's existing deferred-items table (unrelated to this phase, carried forward) |

**Missing dependencies with no fallback:** none identified this session.
**Missing dependencies with fallback:** none — `expo-blur` is a standard `pnpm add`, no fallback needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.10 (both `apps/mobile` and `apps/api`, separate configs) [VERIFIED: apps/mobile/package.json:63, apps/mobile/vitest.config.ts:1-19] |
| Config file | `apps/mobile/vitest.config.ts` (node-env, `lib/**/__tests__` only) + `apps/api/vitest.config.ts` (supertest-based, not read this session but referenced by 8 existing spec files) |
| Quick run command | `pnpm --filter @festipal/mobile test` / `pnpm --filter @festipal/api test` |
| Full suite command | `pnpm test` (root Turborepo task, all packages) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|---------------------|-------------|
| FEST-01 | `listFestivals` returns name/dates/place | integration (apps/api) | `pnpm --filter @festipal/api test -- festival-fields` | ❌ Wave 0 — new spec |
| FEST-02 | Meine/Alle segment default state | manual-only | — (no RN component test harness exists — Pitfall 5) | n/a |
| FEST-03 | Save persists server-side, survives restart | integration (apps/api, reuses `save-idempotency.spec.ts` pattern) + manual on-device restart check | `pnpm --filter @festipal/api test -- save-idempotency` | ✅ (existing) for the API half; manual for the restart half |
| FEST-04 | Enter gate-less + non-dead-end back | manual-only | — | n/a |
| HOME-01 | Land on festival home after entering | manual-only (cold-start redirect is a device-level UX flow) | — | n/a |
| HOME-02 | Home shows identity + key facts | integration (apps/api, `getFestival` returns new fields) + manual visual check | `pnpm --filter @festipal/api test -- get-festival-fields` | ❌ Wave 0 — new spec |

### Sampling Rate
- **Per task commit:** `pnpm --filter @festipal/api test` (fast, existing supertest suite + new D-08 specs)
- **Per wave merge:** `pnpm test` (full Turborepo suite) + manual on-device pass for any wave touching navigation/screens
- **Phase gate:** Full suite green + full core-value path re-verified on real Android device before `/gsd-verify-work` (matches Phase 3/4's own established gate)

### Wave 0 Gaps
- [ ] `apps/api/test/festival-fields.spec.ts` (or extend `festival-isolation.spec.ts`) — covers FEST-01/HOME-02: assert `startDate`/`endDate`/`place` round-trip through `listFestivals`/`listMyFestivals`/`getFestival`
- [ ] `apps/mobile/lib/__tests__/date-range.test.ts` — covers the `formatDateRange` pure function (Pitfall 3's fallback implementation), mirroring `lib/__tests__/otp-error.test.ts`'s pattern
- [ ] No new test framework install needed — `pnpm test` already wired at the Turborepo root

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | no (unchanged from Phase 4 — this phase adds no auth surface) | — |
| V3 Session Management | no (unchanged) | — |
| V4 Access Control | yes | Existing global `AuthGuard` (SEC-01, all endpoints protected) + `festivalId`/`visitorId`-scoped queries (SEC-02) — Phase 5 adds NEW FIELDS to already-scoped reads, not a new access-control surface |
| V5 Input Validation | yes | Zod schemas via `packages/contracts` (unchanged pattern) — the new `startDate`/`endDate`/`place` fields flow through the same `createSelectSchema`/`.extend()` validation as every other field once D-08 lands (Pitfall 1) |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|------------------------|
| Cross-tenant data leak via a new field forgetting to go through the scoped query | Information Disclosure | `festival-isolation.spec.ts`'s existing test pattern already proves `GET /me/festivals` is visitorId-scoped; the D-08 Wave-0 gap test (above) should assert the NEW fields also respect this scoping (i.e., festival B's `place`/dates never leak into visitor 1's `me/festivals` response when visitor 1 only saved festival A) — cheap to add to the existing spec, high value given this is exactly the kind of "new field, old vuln class" regression ASVS V4 targets |
| Active-festival MMKV slug used to bypass `festivalId` scoping | Tampering | Not a real risk: the persisted slug is only ever used to construct a `getFestival(slug)` request, which is itself unscoped/public browse data (any authenticated visitor can already read any festival by slug via `GET /festivals/:slug`) — no privilege is granted by persisting the slug locally that the visitor didn't already have via the browse endpoint |
| Coming-soon tile Cashless leak | Information Disclosure | Not applicable this phase — the coming-soon tiles are fully static/disabled (no data fetch per UI-SPEC), so `cashlessUrl` is never rendered or embedded this phase; the ADR-011 hide-when-unset rule only becomes load-bearing when a later phase makes the Cashless tile live |

## Sources

### Primary (HIGH confidence)
- `apps/mobile/app/_layout.tsx`, `apps/mobile/app/festivals/index.tsx`, `apps/mobile/app/(festival)/index.tsx`, `apps/mobile/app/(festival)/_layout.tsx`, `apps/mobile/app/festivals/_layout.tsx` — read in full this session
- `apps/mobile/lib/api-client.ts`, `apps/mobile/lib/query-client.ts`, `apps/mobile/lib/avatar-storage.ts`, `apps/mobile/lib/i18n.ts`, `apps/mobile/lib/pending-destination.ts` — read in full this session
- `packages/contracts/src/schemas.ts`, `packages/contracts/src/router.ts`, `packages/contracts/src/locale.ts` — read in full this session
- `packages/db/src/schema/festival.ts`, `packages/db/src/schema/visitor-profile.ts`, `packages/db/src/schema/_shared.ts`, `packages/db/src/schema/index.ts` — read in full this session
- `packages/db/scripts/seed.ts` — read in full this session
- `packages/ui/src/tokens.ts` — read in full this session
- `apps/api/src/festival/festival.service.ts`, `apps/api/src/festival/festival.controller.ts`, `apps/api/src/me/me.service.ts` — read in full this session
- `apps/api/test/festival-isolation.spec.ts` — read in full this session
- `apps/mobile/eslint.config.mjs`, `apps/mobile/lingui.config.ts`, `apps/mobile/vitest.config.ts` — read in full this session
- `docs/concept/designs/festival/festipal-ds.js` (FloatingNav, SegmentedControl components), `docs/concept/designs/festival/festipal-screens.jsx` (GLOBAL_NAV, FESTIVALS mock, App shell), `docs/concept/designs/festival/festipal-tokens.css` (glass/radii tokens), `docs/concept/designs/festival/README.md` — read this session
- `docs/DEVELOPMENT_DECISIONS.md` (ADR-005, ADR-011, ADR-006) — read this session
- `.planning/phases/05-festival-selection-home/05-CONTEXT.md`, `05-UI-SPEC.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md` — read this session

### Secondary (MEDIUM confidence)
- Context7 `/websites/expo_dev` — "Custom tab layouts" (headless `expo-router/ui` experimental status), "Tabs Navigation" / "Screen Options: Tab Bar Customization" (stable `Tabs` + `tabBar` prop)
- Context7 `/drizzle-team/drizzle-orm-docs` — `date({ mode: 'string' })` → Zod `z.string()` mapping, `createSelectSchema`/`.extend()` refinement pattern
- `npm view expo-blur version` / `repository.url` — direct registry query this session

### Tertiary (LOW confidence)
- WebSearch: Hermes `Intl.DateTimeFormat.formatRange`/`formatToParts` reliability (`facebook/hermes#1172`, `reactwg/react-native-releases#623`) — not verified against this project's specific RN 0.86.2/SDK-57 build; treated as sufficient justification to avoid `formatRange` defensively rather than as a confirmed bug report against this exact version

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every library is either already installed (verified via `package.json`) or a single first-party `npm view`-confirmed package
- Architecture: HIGH for contract/schema/route facts (all directly read from source); MEDIUM for the exact `Tabs`/`tabBar` prop shape (Assumption A4 — not version-pinned-verified)
- Pitfalls: HIGH — 5 of 6 pitfalls are grounded in code actually read this session (existing bug comments, existing lint config, existing route strings); Pitfall 3 (Hermes `Intl`) is MEDIUM (WebSearch-sourced, not project-specific)

**Research date:** 2026-08-05
**Valid until:** 2026-09-04 (30 days — stack is stable/pinned; re-verify if `expo-router`/`expo-blur`/`drizzle-zod` versions change before planning executes)
