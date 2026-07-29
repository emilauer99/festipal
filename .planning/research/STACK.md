# Stack Research

**Domain:** Auth + data-fetching + routing integration for a multi-tenant Expo/NestJS festival app (visitor shell slice)
**Researched:** 2026-07-29
**Confidence:** MEDIUM-HIGH (library versions verified against npm registry = HIGH; integration patterns verified against Context7-indexed official docs = MEDIUM, cross-checked with peer-dependency ranges)

> Scope note: this file does NOT re-litigate the stack — Turborepo/pnpm, Expo+Expo Router, NestJS,
> ts-rest+Zod, Drizzle+Neon, better-auth, Lingui, MapLibre, TypeScript 6.0.x are locked (ADRs
> 001–015, `docs/DEVELOPMENT_DECISIONS.md`). This is the concrete library/version/integration layer
> needed to build the visitor-shell slice on top of that locked stack.

## Recommended Stack

### Core Technologies (net-new for this slice)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `better-auth` | 1.6.25 | Auth core (server) — already the ADR-009 choice, not yet wired | Latest stable; peer-declares `drizzle-orm: ^0.45.2`, matching `packages/db`'s pinned version exactly — no drizzle bump needed. |
| `@better-auth/expo` | 1.6.25 | Official Expo integration — server plugin (`expo()`) + client plugin (`expoClient()`) | Ships **in lockstep with `better-auth` core** (same version number, peer-pinned `better-auth: ^1.6.25`) — this is the maintained, first-party path for RN/Expo, not a community shim. Handles deep-link OAuth redirects, cookie caching via a pluggable storage adapter, and CSRF/origin checks for native apps (which don't send `Origin` headers like browsers do). |
| `@thallesp/nestjs-better-auth` | 2.7.0 | NestJS wiring — mounts the auth handler, registers a global `AuthGuard`, provides `@Session()`/`@AllowAnonymous()`/`@OptionalAuth()` decorators | better-auth core has **no official NestJS adapter**; this is the de-facto community package (actively maintained, referenced directly from better-auth's own docs at `docs/content/docs/integrations/nestjs.mdx`). Peer-requires `@nestjs/common@^11.1.6` and `express@^5.1.0` — both already satisfied (`@nestjs/platform-express@11.1.28` bundles `express@5.2.1`). Confidence: MEDIUM (community package, not official) — worth a smoke test in Phase 1 before depending on it long-term. |
| `expo-secure-store` | 57.0.1 | Encrypted on-device storage for the auth session/cookie | First-party Expo module, SDK-versioned to match `expo@57.0.8`. Wraps iOS Keychain (`kSecClassGenericPassword`) and Android Keystore-backed `SharedPreferences` — this is what `@better-auth/expo`'s `expoClient({ storage })` option expects. |
| `@ts-rest/react-query` | 3.52.1 | Generates typed TanStack Query hooks from the existing `packages/contracts` ts-rest router | **Must exactly match** `@ts-rest/core@3.52.1` already pinned in `packages/contracts` (peer: `@ts-rest/core: ~3.52.0`) and the workspace's zod 3.x pin (peer: `zod: ^3.22.3`). Peer-supports `@tanstack/react-query: ^4.0.0 \|\| ^5.0.0`. |
| `@tanstack/react-query` | 5.101.4 | Data-fetching/caching layer in the Expo app — already the ADR-007 choice for offline-first caching, now also the vehicle for online API calls in this slice | Use the **v5** ts-rest entrypoint (`@ts-rest/react-query/v5`, not the legacy `/v4` API) — matches this version. Same library that will later carry the persisted-cache offline story (ADR-007), so no second data-fetching library is introduced for this slice. |

### Supporting Libraries (Expo peer deps pulled in by `@better-auth/expo`)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `expo-constants` | 57.0.7 | Reads app config (scheme, extra) at runtime | Required peer of `@better-auth/expo` (`>=17.0.0`, SDK 57 ships 57.0.7) |
| `expo-linking` | 57.0.4 | Deep-link URL construction/parsing | Required peer (`>=7.0.0`); used for OAuth/email-verification redirect callbacks even though v1 is email/password-only — better-auth's expo plugin wires this unconditionally |
| `expo-network` | 57.0.1 | Network state used internally by the expo plugin's fetch layer | Required peer (`>=8.0.7`) |
| `expo-web-browser` | 57.0.2 | Opens the system browser for OAuth flows | Required peer (`>=14.0.0`) — installed even though OAuth is deferred (ADR: email/password only for v1), since it's a hard peer of `@better-auth/expo`; near-zero cost (no native OAuth screens are actually shown) |
| `expo-router` | 57.0.8 | App/auth navigation split via `<Stack.Protected>` | Already the ADR-001 choice; version pinned to match `expo@57.0.8` (Expo SDK 57) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `npx auth@latest generate --adapter drizzle --dialect postgresql` (better-auth CLI) | Generates the Drizzle `user`/`session`/`account`/`verification` tables from your `betterAuth()` config + plugins | Run from `packages/db` (or point `--output` there) so the generated schema lands next to the existing `festival`/`tag` schema files, then run the **existing** `db:generate`/`db:migrate` Drizzle-kit flow on top — better-auth's CLI only emits schema, Drizzle Kit still owns the actual migration files (keeps ADR-005's migration flow as sole source of truth). |
| `npx expo install <pkg>` | Installs Expo/RN packages pinned to the SDK-compatible version | Use this (not raw `pnpm add`) for every `expo-*`/RN-native package in `apps/mobile` — it resolves against the SDK 57 compatibility table so peer versions above (57.0.x) stay in lockstep automatically. Works fine inside a pnpm workspace. |

## Installation

```bash
# --- apps/api (auth server) ---
pnpm --filter @festipal/api add better-auth @thallesp/nestjs-better-auth

# --- packages/db (auth schema — generated once, then owned by Drizzle Kit) ---
cd packages/db
npx auth@latest generate --adapter drizzle --dialect postgresql --output ./src/schema/auth.ts
pnpm --filter @festipal/db db:generate   # existing drizzle-kit flow picks up the new tables
pnpm --filter @festipal/db db:migrate

# --- apps/mobile (scaffold first, per PROJECT.md — not yet created) ---
cd apps/mobile
npx expo install better-auth @better-auth/expo expo-secure-store
npx expo install expo-constants expo-linking expo-network expo-web-browser   # peers, usually already present from `npx create-expo-app`
pnpm add @ts-rest/react-query @tanstack/react-query
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| `@thallesp/nestjs-better-auth` for the NestJS mount | Hand-rolled `all('/api/auth/*', toNodeHandler(auth))` route + manual guard (better-auth's generic Node/Express pattern) | If the community package stalls/breaks on a future NestJS major, or a security review flags concerns about depending on a third-party auth-guard implementation — the hand-rolled version is ~20 lines and documented directly in better-auth's own `integrations/express.mdx`, usable as a fallback with no new dependency. |
| `expo-secure-store` for session storage | `react-native-mmkv` (already a candidate per ADR-007 for offline cache) | MMKV is **not encrypted at rest by default on iOS Keychain-grade guarantees** the way SecureStore is, and isn't what `@better-auth/expo`'s `storage` option is documented/tested against. Keep MMKV for the *offline content cache* (timetable, map tiles) per ADR-007; keep SecureStore for the *auth session* specifically — different data-sensitivity tiers, different tool. |
| `@ts-rest/react-query` (typed hooks) | Plain `@ts-rest/core` client + manual `useQuery(['key'], () => client.foo())` | If a single one-off call doesn't warrant a typed hook; not recommended as the default pattern since it throws away the contract-driven query-key generation `@ts-rest/react-query` gives for free. |
| `<Stack.Protected guard={...}>` (Expo Router built-in, SDK 53+) | Manual `<Redirect>` in each protected layout's `_layout.tsx` | Use the manual `<Redirect>` pattern only for a *single* nested layout that needs custom loading-state UI while the session is being read from SecureStore (e.g. a splash/spinner state) — `Stack.Protected` alone doesn't have a built-in "loading" branch, so the root layout typically combines both: a loading guard clause + `Stack.Protected` for the authenticated/unauthenticated split. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| `@better-auth/expo` client without an explicit `storage: SecureStore` option | Defaults to `AsyncStorage`/in-memory in some configurations depending on version — session would not survive app restarts, breaking the "land logged-in on reopen" requirement from PROJECT.md | Always pass `storage: SecureStore` explicitly in `expoClient({...})`. |
| Zod v4 anywhere in `apps/mobile` or shared packages that touch auth | `better-auth`'s own `emailAndPassword` schemas and `@ts-rest/react-query` both peer-pin `zod: ^3.x`; project already fixed this workspace-wide (ADR-006). A stray v4 install (e.g. via a fresh `npx expo install` pulling latest) would create dual zod versions and silent `instanceof ZodSchema` failures. | Keep zod pinned to the existing 3.25.76 in the root workspace; do not let any new package hoist a v4 copy — check `pnpm why zod` after adding new deps. |
| Global `credentials: 'include'` fetch default plus manual `Cookie` header on the same request | better-auth's client sets `credentials: 'include'` by default; when manually attaching `Cookie` headers to a *separate* `fetch`/ts-rest call (as required to authenticate ts-rest requests), the docs explicitly warn `credentials: 'include'` can conflict with a manually-set cookie header. | Set `credentials: 'omit'` on the raw `fetch` calls where you manually attach `authClient.getCookie()` as a header (see Integration Notes below). |
| Legacy `@ts-rest/react-query` v4 API (`client.posts.get.useQuery([...])`) | Project is on TanStack Query v5 (`@tanstack/react-query@5.101.4`); the v4-style ts-rest API targets React Query v4's calling convention and is a different import path/shape. | Import from `@ts-rest/react-query/v5` and use `initTsrReactQuery` + `tsr.ReactQueryProvider`. |
| Bare `AsyncStorage` for the session token | Unencrypted, plaintext on-device storage — inappropriate for a session credential even though it's not a payment credential (ADR-011 already bars payment data from the app; session tokens are still a security-sensitive secret). | `expo-secure-store`, as recommended above. |

## Integration Notes (concrete wiring)

### 1. better-auth server in NestJS

```ts
// apps/api/src/auth/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { db } from "@festipal/db"; // existing Drizzle client

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  baseURL: process.env.BETTER_AUTH_URL, // already a config placeholder in apps/api/src/config/env.ts
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: { enabled: true },
  plugins: [expo()],
  trustedOrigins: ["festipal://"], // app.json `scheme` — must match apps/mobile's Expo scheme
});
```

```ts
// apps/api/src/app.module.ts
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./auth/auth";

@Module({ imports: [AuthModule.forRoot({ auth }), /* existing FestivalModule etc */] })
export class AppModule {}
```

```ts
// apps/api/src/main.ts — REQUIRED, or better-auth's raw-body handling breaks
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  // Re-add JSON body parsing for every OTHER (ts-rest) route.
  app.use(json()); // from 'express' — apply globally is fine; better-auth's routes read the raw
                    // stream before this runs because AuthModule registers its middleware first.
  await app.listen(process.env.PORT ?? 8081);
}
```

Pitfall flagged by better-auth's own docs (Express integration page): disabling Nest's default
body parser is mandatory for the auth handler to read the raw body, but this **also disables JSON
parsing for every ts-rest controller** unless `express.json()` is re-added manually after the auth
module is registered. Verify this combination (bodyParser:false + manual express.json() +
`@ts-rest/nest`'s own body handling) with an integration test in Phase 1 — this is the single
highest-risk wiring point in this slice; the community NestJS adapter (MEDIUM confidence) hasn't
been verified against `@ts-rest/nest` specifically.

Route protection: `AuthModule.forRoot()` registers a **global** `AuthGuard` — every controller is
auth-required by default; use `@AllowAnonymous()` on the festival-list-before-login endpoints (if
any are meant to be public) and `@Session()` to read the current user.

### 2. better-auth client in Expo

```ts
// apps/mobile/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL, // e.g. https://api.festipal.app or localhost:8081 in dev
  plugins: [
    expoClient({
      scheme: "festipal",       // must match app.json `expo.scheme` AND server trustedOrigins
      storagePrefix: "festipal",
      storage: SecureStore,     // <-- the load-bearing option; do not omit
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

`app.json` needs `"expo": { "scheme": "festipal" }` for the deep-link redirect plumbing to work
(even for email/password-only v1 — the plugin wires it unconditionally).

### 3. ts-rest client wired to TanStack Query, authenticated via the better-auth cookie

```ts
// apps/mobile/lib/api-client.ts
import { initTsrReactQuery } from "@ts-rest/react-query/v5";
import { contract } from "@festipal/contracts"; // existing single source of truth
import { authClient } from "./auth-client";

export const tsr = initTsrReactQuery(contract, {
  baseUrl: process.env.EXPO_PUBLIC_API_URL!,
  baseHeaders: {
    Cookie: () => authClient.getCookie(), // dynamic — re-read on every request, not captured once
  },
  // better-auth's own client sets credentials:'include'; ts-rest's underlying fetch does not by
  // default, so no 'omit' workaround is needed here (only needed for hand-rolled fetch() calls).
});
```

```tsx
// apps/mobile/app/_layout.tsx (root)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { tsr } from "../lib/api-client";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>{/* <RootNavigator/> below */}</tsr.ReactQueryProvider>
    </QueryClientProvider>
  );
}
```

Usage in a screen — fully typed against `packages/contracts`, no manual response typing:

```ts
const { data, isLoading } = tsr.festivals.list.useQuery({ queryKey: ["festivals"] });
```

### 4. Expo Router auth-gated structure

```
apps/mobile/app/
├─ _layout.tsx          # root: reads session, renders RootNavigator (below)
├─ sign-in.tsx
├─ sign-up.tsx
└─ (app)/                # authenticated group
   ├─ _layout.tsx        # <Tabs> or <Stack> for Festivals / Friends / Profile
   ├─ index.tsx           # festival list + select
   ├─ home.tsx            # post-join home (overview entry point)
   ├─ profile.tsx         # placeholder
   └─ friends.tsx         # placeholder
```

```tsx
// apps/mobile/app/_layout.tsx
function RootNavigator() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <SplashScreen />; // Stack.Protected has no built-in loading branch

  return (
    <Stack>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
    </Stack>
  );
}
```

`<Stack.Protected guard={...}>` is the current (Expo SDK 53+, still current in SDK 57) idiomatic
pattern — it declaratively hides/redirects screens based on a boolean guard and is preferred over
manually sprinkling `<Redirect>` in every nested layout. Combine it with a loading-state early
return (as above) since the guard itself has no concept of "session still loading from
SecureStore."

### 5. Secure storage — device specifics

- `expo-secure-store` wraps iOS Keychain (`kSecClassGenericPassword`) and Android Keystore-backed
  `SharedPreferences` — this is what `@better-auth/expo` expects via its `storage` option.
- **Known limit: 2048-byte value size** on both platforms (historically enforced harder on iOS).
  better-auth session cookies/tokens are normally well under this, but if custom session data or
  JWTs with many claims are added later, watch for silent failures — Expo currently only warns,
  future SDKs may throw.
- Do **not** reach for `react-native-mmkv` for the session — MMKV is the right tool for the
  *offline content cache* (ADR-007) but isn't the documented/tested backing store for
  `@better-auth/expo`'s `storage` option, and doesn't offer the same OS-level encryption guarantee
  as Keychain/Keystore for a security-sensitive session credential.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `better-auth@1.6.25` | `drizzle-orm@^0.45.2` | Exact match to `packages/db`'s already-pinned version — no bump needed |
| `@better-auth/expo@1.6.25` | `better-auth@^1.6.25` | Ship in lockstep; always install matching versions |
| `@thallesp/nestjs-better-auth@2.7.0` | `@nestjs/common@^11.1.6`, `express@^5.1.0`, `better-auth@>=1.5.0 <2.0.0` | All satisfied by current `apps/api` deps (`@nestjs/*@11.1.28` bundles `express@5.2.1`) |
| `@ts-rest/react-query@3.52.1` | `@ts-rest/core@~3.52.0`, `zod@^3.22.3`, `@tanstack/react-query@^4.0.0 \|\| ^5.0.0` | Matches the workspace's existing `@ts-rest/core@3.52.1` and zod 3.25.76 pins exactly |
| `expo-router@57.0.8` | `expo@57.0.8` (same SDK line), `react-native-screens@^4.26.0`, `react-native-safe-area-context@>=5.4.0` | All current-latest peers already line up (screens 4.26.2, safe-area-context 5.8.0) |
| `expo-secure-store@57.0.1` | `expo@57.0.8` | SDK-versioned; install via `npx expo install` to avoid drift |

## Sources

- `/better-auth/better-auth` (Context7, High source reputation, benchmark 83.27) — Expo client/server integration (`docs/content/docs/integrations/expo.mdx`), NestJS integration (`docs/content/docs/integrations/nestjs.mdx`), Drizzle adapter (`docs/content/docs/adapters/drizzle.mdx`), CLI schema generation. Confidence: MEDIUM (community-adjacent docs page for NestJS specifically; core Expo/Drizzle docs are official).
- `/expo/expo` (Context7, High source reputation, benchmark 78.42) — Expo Router protected-routes pattern (`docs/pages/router/advanced/authentication.mdx`), SecureStore size limits (SDK 51–56 docs snapshots). Confidence: HIGH (official Expo docs).
- `/ts-rest/ts-rest` (Context7, Medium source reputation, benchmark 86.28) — React Query v5 client setup (`docs/content/docs/client/react-query-v5.mdx`). Confidence: MEDIUM.
- npm registry (`npm view <pkg> version/peerDependencies/dependencies`, direct query, 2026-07-29) — all version numbers and peer-dependency ranges cross-checked live against the registry. Confidence: HIGH (authoritative for versions).
- Existing project docs: `.planning/codebase/STACK.md`, `.planning/codebase/INTEGRATIONS.md`, `docs/DEVELOPMENT_DECISIONS.md` (ADR-005, 006, 009, 013) — for locked baseline versions (drizzle-orm 0.45.2, zod 3.25.76, TypeScript 6.0.3, ts-rest 3.52.1).

---
*Stack research for: multi-tenant festival app — visitor shell (auth + festival-list + home)*
*Researched: 2026-07-29*
