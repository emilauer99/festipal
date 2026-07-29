# Architecture Research: Visitor-Shell Slice

**Domain:** Auth + tenant-selection shell for a multi-tenant festival app (NestJS + ts-rest + Drizzle + Expo Router)
**Researched:** 2026-07-29
**Confidence:** HIGH (better-auth Drizzle schema, NestJS integration pattern, and Expo Router `Stack.Protected` pattern are all sourced from current official docs; the schema/tenant-boundary design is derived directly from this repo's own ADR-014 and existing code, not invented)

This is **not** generic ecosystem research — it answers one specific question: how the visitor-shell
slice (auth, session, festival list/select, home shell) attaches to the ~1/3-scaffolded festipal
monorepo. It takes the existing `apps/api` festival module, `packages/contracts`, and `packages/db`
as given and describes the delta.

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ apps/mobile (Expo Router) — NEW                                              │
│                                                                                │
│  app/(auth)/sign-in, sign-up          app/(app)/festivals  app/(app)/(festival)/home,profile,friends │
│  lib/auth-client.ts (better-auth expo client, SecureStore) │
│  lib/api-client.ts (ts-rest client, Cookie header from authClient)           │
│  providers: SessionProvider · SelectedFestivalProvider · QueryClientProvider │
└───────────────────────────────┬───────────────────────┬──────────────────────┘
                                 │ /api/auth/*  (better-auth's own routes)
                                 │ /api/v1/*    (ts-rest contract routes)
                                 ▼                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ apps/api (NestJS) — SCAFFOLDED, extend                                       │
│                                                                                │
│  AuthModule (better-auth instance + catch-all handler, global AuthGuard)  NEW │
│  UserModule (me controller/service — global, user-scoped)                 NEW │
│  FestivalModule (existing: getFestival, listTags)  + listFestivals, join  EXT │
│  DbModule (existing, unchanged) · ConfigModule (existing, unchanged)          │
└───────────────────────────────┬────────────────────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ packages/db (Drizzle / Postgres) — SCAFFOLDED, extend                        │
│                                                                                │
│  schema/auth.ts        user, session, account, verification   GLOBAL      NEW │
│  schema/user-festival.ts  bridge: userId × festivalId          GLOBAL     NEW │
│  schema/festival.ts    festival, festival_locale                TENANT ROOT   │
│  schema/tag.ts         tag, tag_translation                     TENANT-SCOPED │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| `packages/db/schema/auth.ts` | Global identity: user, session, account (credential), verification (email tokens) | better-auth CLI-generated Drizzle schema, hand-adapted to repo conventions |
| `packages/db/schema/user-festival.ts` | The *only* bridge between global and tenant data classes — "this user has joined this festival" | New table, `userId` FK → `user.id`, `festivalId` FK → `festival.id`, no tenant guard needed (always queried by `userId`) |
| `apps/api` AuthModule | Owns the better-auth instance, mounts its native handler, provides the global `AuthGuard` + `@Session()`/`@AllowAnonymous()` decorators | `AuthModule.forRoot({ auth })` (community NestJS wrapper) or a hand-rolled catch-all controller forwarding `Request`→`auth.handler`→`Response` |
| `apps/api` UserModule (new) | User-scoped, non-tenant endpoints: current profile (`me`), festival list/join | Controller + service, reads `req.user` from the auth guard, no `festivalId` guard |
| `apps/api` FestivalModule (extended) | Tenant-scoped festival data; gains `listFestivals` (browse) | Existing pattern extended — `getFestival`/`listTags` already require `festivalId`/`slug` path params |
| `packages/contracts` | Defines **our** endpoint surface only — not better-auth's internal routes | ts-rest router + Zod schemas, unchanged pattern |
| `apps/mobile` `lib/auth-client.ts` | Talks to `/api/auth/*` directly (better-auth's own typed client) | `createAuthClient` + `expoClient` plugin + `expo-secure-store` |
| `apps/mobile` `lib/api-client.ts` | Talks to `/api/v1/*` (ts-rest contract client), attaches the session cookie from `authClient.getCookie()` | ts-rest client bound to `Contract`, custom `fetch` wrapper injecting the `Cookie` header |
| `apps/mobile` `SessionProvider` | Wraps `authClient.useSession()`, exposes `{ session, isPending }` to the root navigator's guards | React context / small provider component |
| `apps/mobile` `SelectedFestivalProvider` | Persists which festival the visitor is currently "in" across app restarts (separate from *joined* festivals) | Small store (Zustand or context) backed by `expo-secure-store`/MMKV |

## 1. Where the global user/session schema lives, and how it relates to festival-scoped tables

**Answer: a new `packages/db/src/schema/auth.ts` (global) plus one new bridge table — never a
`festivalId` column added directly to `user`.**

- **Generate, then adapt, don't hand-write.** Run `npx @better-auth/cli generate` against a `betterAuth()`
  config pointed at the Drizzle Postgres adapter; it emits a `pgTable`-based schema for `user`, `session`,
  `account`, `verification` with the exact columns better-auth's runtime expects (session token/expiry,
  account provider/tokens for future OAuth, email verification tokens). Drop the generated file in as
  `packages/db/src/schema/auth.ts`, then hand-adjust naming/casing to match this repo's conventions
  (the project already uses Drizzle's `casing: 'snake_case'`, so column names stay camelCase in TS).

- **ID format decision (flag explicitly, don't silently diverge):** the repo's existing convention is
  `idColumn() = uuid().primaryKey().defaultRandom()` (Postgres-generated UUIDs). better-auth's default
  generated schema uses `text('id').primaryKey()` with IDs generated in application code (its own ID
  generator). **Recommendation: keep better-auth's own text-id convention for the four auth tables**
  rather than forcing `idColumn()` onto them. Reasons: (a) better-auth's session/verification token
  logic and its NestJS/Expo client libraries assume it owns ID generation; fighting that only buys
  cosmetic consistency; (b) the CLI can regenerate this file when better-auth adds fields (new plugin,
  new column) — a hand-forced `uuid()` primary key would have to be re-patched on every regen. Treat
  `schema/auth.ts` as **vendored, CLI-owned schema** (like `drizzle/` migrations), not hand-authored
  domain schema — note this distinction in a code comment so future contributors don't "fix" it to match
  `idColumn()`.

- **No FK from `user` to `festival`, ever.** Per ADR-014, a user does not belong to a festival — they
  *enter* one. The relation is captured in a **new global bridge table**,
  `packages/db/src/schema/user-festival.ts`:

  ```typescript
  export const userFestival = pgTable(
    'user_festival',
    {
      userId: text().notNull().references(() => user.id, { onDelete: 'cascade' }),
      festivalId: uuid().notNull().references(() => festival.id, { onDelete: 'cascade' }),
      status: text({ enum: ['joined', 'saved'] }).notNull().default('joined'),
      joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [primaryKey({ columns: [t.userId, t.festivalId] })],
  );
  ```

  This table lives in the **global** data class (ADR-014 explicitly names "Festival-Liste
  (angemeldet/empfohlen/vorbei)" as user-global data), even though one of its columns is a
  tenant FK. It is always queried by `userId` (never needs a tenant guard) and is what makes
  "land logged-in *and* still in the right festival" possible across app restarts — the mobile
  app's `SelectedFestivalProvider` should be treated as a client-side cache of a row in this table,
  not the source of truth.

- **Do not reach for better-auth's `organization` plugin for this.** better-auth ships an
  `organization` plugin (orgs, memberships, roles, invitations) that looks like an obvious fit for
  "multi-tenant," but it models *staff membership with roles* — the right shape for `apps/admin`
  (festival organizers, later milestone), not for "a visitor briefly enters a festival." Using it here
  would import invitation/role machinery the visitor app doesn't need and would blur ADR-014's
  explicit "user enters, doesn't belong" model. Keep the visitor-facing relation as the plain
  `user_festival` table above.

- **Directory placement stays consistent with existing structure:** `packages/db/src/schema/index.ts`
  gains two new exports (`./auth`, `./user-festival`) alongside the existing `festival`/`tag`/`locale`
  exports — no new top-level package needed.

## 2. Contract-first auth + festival-list endpoints

**Key decision, stated up front: better-auth's own routes (`/sign-up/email`, `/sign-in/email`,
`/sign-out`, `/get-session`, …) are *not* modeled in `packages/contracts`.** This is a deliberate,
scoped exception to ADR-006 ("contracts are the single source of truth"), not an oversight:

- better-auth generates and owns a fairly large, plugin-extensible route surface. Re-declaring it in
  ts-rest would mean hand-tracking every better-auth internal route and going stale the moment a
  plugin (passkeys, 2FA, magic links) is added later — the opposite of "single source of truth."
- better-auth already ships its own end-to-end-typed client (`createAuthClient`) for exactly this
  purpose. Mounting it as a second, parallel typed surface is the documented, supported integration
  pattern (see Expo/Next.js/Nest integration docs) — not a workaround.
- **Mount it outside the contract's path prefix** to avoid any collision: `packages/contracts`'s router
  uses `pathPrefix: '/api/v1'`; better-auth mounts at `/api/auth/*` (its default `basePath`, kept as-is).
  Nothing in `/api/v1` needs to know better-auth exists beyond reading the resolved session.

**What *does* go through `packages/contracts` (contract-first, as usual):**

| Endpoint | Method/Path | Scope | Notes |
|---|---|---|---|
| `getCurrentUser` | `GET /api/v1/me` | Global | Our own response shape (id, name, email, locale) — not better-auth's internal user row |
| `listFestivals` | `GET /api/v1/festivals` | Global (returns tenant summaries) | Add to existing `festivalSchema`-based array response; add a `joined: boolean` flag per item via a LEFT JOIN against `user_festival` |
| `joinFestival` | `POST /api/v1/festivals/:festivalId/join` | Writes to the global bridge table | `festivalId` path param validated same as `listTags` today |

Add these to `packages/contracts/src/router.ts` next to the existing `getFestival`/`listTags` entries —
same pattern, same file, no new package.

**API-side wiring (`apps/api`):**

1. **AuthModule (new):** instantiate `betterAuth({ database: drizzleAdapter(db, { provider: 'pg', schema }), ...})`
   once, export it for both the catch-all handler and for services that need `auth.api.getSession()`.
   Register a NestJS wrapper (e.g. `@thallesp/nestjs-better-auth`'s `AuthModule.forRoot({ auth })`) which:
   - disables Nest's body parser (`bodyParser: false` in `NestFactory.create`) so better-auth can read
     the raw request — a required, easy-to-miss step;
   - registers a **global** `AuthGuard`; every route needs authentication unless explicitly opted out
     with `@AllowAnonymous()`/`@OptionalAuth()` — apply `@AllowAnonymous()` to `health` and (if a
     public "browse before signup" flow is ever wanted) `getFestival`;
   - exposes `@Session()` to read the resolved global user in any controller.
   - **Fallback if the wrapper misbehaves:** a hand-rolled controller (`@All('auth/*path')`) that
     converts the Nest `Request`/`Response` to the Fetch API `Request`/`Response` better-auth's
     `auth.handler` expects — a few lines, fully auditable, consistent with ADR-009's "auth is our
     security responsibility" stance.

2. **Where tenant context attaches:** unchanged from the existing pattern in `festival.controller.ts` —
   `festivalId`/`slug` comes from the **path**, not from session state. The only new wiring is that
   *user*-scoped endpoints (`me`, `listFestivals`, `joinFestival`) pull identity from `req.user` (set
   by the global `AuthGuard`), while *festival*-scoped endpoints keep resolving tenant context from the
   path param exactly as `getFestival`/`listTags` already do. There is no single new "TenantGuard" to
   build — the two guards compose (`AuthGuard` always runs; tenant-scoped controllers additionally
   validate `festivalId` in the service layer, same as today).

3. **UserModule (new):** `me.controller.ts` (`getCurrentUser`), and extend `FestivalModule`'s service
   with `listFestivals(userId)` (LEFT JOIN `user_festival`) and `joinFestival(userId, festivalId)`
   (upsert into `user_festival`).

## 3. `apps/mobile` structure (Expo Router)

**Auth-gated navigation — use Expo Router's built-in `Stack.Protected`, not a hand-rolled redirect
effect.** This is the current official pattern (Expo SDK's documented "Session-Driven Root Navigator"):

```tsx
// app/_layout.tsx
function RootNavigator() {
  const { session, isPending } = useSession();          // wraps authClient.useSession()
  const { selectedFestivalId } = useSelectedFestival();  // persisted, see below

  if (isPending) return <SplashScreen />;

  return (
    <Stack>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Protected guard={!!session && !selectedFestivalId}>
        <Stack.Screen name="festivals" />           {/* browse/select/join */}
      </Stack.Protected>

      <Stack.Protected guard={!!session && !!selectedFestivalId}>
        <Stack.Screen name="(festival)" />           {/* home, profile, friends */}
      </Stack.Protected>
    </Stack>
  );
}
```

- **Route groups:**
  - `app/(auth)/sign-in.tsx`, `app/(auth)/sign-up.tsx` — unguarded.
  - `app/festivals/index.tsx` — festival list/select/join; guarded on "authenticated, no festival
    selected yet."
  - `app/(festival)/home.tsx`, `.../overview.tsx`, `.../profile.tsx`, `.../friends.tsx` — guarded on
    "authenticated *and* festival selected."
- **API/query layer:** two clients, both configured in `apps/mobile/lib/`:
  - `auth-client.ts` — `createAuthClient({ baseURL, plugins: [expoClient({ scheme, storagePrefix,
    storage: SecureStore })] })`. This is a **required** plugin, not optional glue — React Native has
    no native cookie jar, so `expoClient` persists the session cookie in `SecureStore` and the app must
    manually forward it on other requests (`authClient.getCookie()`).
  - `api-client.ts` — the generated ts-rest client for `Contract`, wrapped so every request injects
    `Cookie: authClient.getCookie()` and `credentials: 'omit'` (per better-auth's Expo integration
    guidance — `include` conflicts with manually-set cookie headers).
  - Both wrapped in a single `QueryClientProvider` (TanStack Query) at the root; set it up now even
    though ADR-007's persistence layer (Expo SQLite/MMKV) is deferred for this online-assumed slice —
    stand up the provider without persistence today, add the persister when the first cacheable content
    feature lands, to avoid re-plumbing the provider tree later.
- **Session bootstrap on launch:** `SessionProvider` calls `authClient.useSession()` on mount (backed by
  `SecureStore`, resolves without a network round-trip if a valid session is cached, matching the "lands
  logged-in on reopen" requirement); `SelectedFestivalProvider` reads a persisted `festivalId` from
  `SecureStore`/MMKV in parallel. Both must resolve (or explicitly settle to "none") before
  `RootNavigator` picks a guard branch — render a splash/loading screen, not a flash of the wrong route.
- **Festival-selection state:** persisted client-side (`SecureStore` or MMKV) *and* mirrored server-side
  in `user_festival` (§1). Client-side persistence answers "which festival was I last in" fast, offline,
  and without a request; the server table is the source of truth for "which festivals has this user
  joined" (needed once the list needs to distinguish joined/saved/discoverable). On `joinFestival`,
  write both: call the contract mutation, then persist `festivalId` locally on success.

## 4. Build order

**schema → contracts → API → mobile**, in that literal order, for a concrete reason at each step —
not just "convention":

1. **`packages/db` (schema first).** Generate `auth.ts` via the better-auth CLI and hand-add
   `user-festival.ts`. This must come first because it's the only step that tells you the *actual*
   column names/types available for user identity (better-auth's generator, not a spec you write) —
   the contract's `me`/`listFestivals` Zod schemas need to mirror real columns, not guessed ones.
   Generate + push the migration (`pnpm --filter db db:generate && db:push`) before touching contracts.

2. **`packages/contracts`.** Add `getCurrentUser`, `listFestivals`, `joinFestival` to the router; add
   response schemas that reflect the schema from step 1 (e.g. don't expose fields the user table
   doesn't have). Explicitly *exclude* better-auth's own routes (§2) — this step is smaller than it
   looks, it's three endpoints, not a full auth API.

3. **`apps/api`.** Wire the better-auth instance against the schema from step 1, mount its handler,
   add the global `AuthGuard`, implement the three new contract endpoints against `packages/db`. This
   is the step that turns on the actual `/api/auth/*` surface the mobile app's `authClient` will call —
   mobile work is blocked until this exists and is reachable (even against a local/dev API instance).

4. **`apps/mobile`.** Scaffold the Expo app, wire both clients against the now-real API, build the
   `Stack.Protected` navigation shell and the four screens (sign-in/up, festival list, home,
   profile/friends placeholders). This step has a hard dependency on step 3 being live (auth cookie
   round-trip, `me`, `listFestivals` all need a real backend to develop against — mocking better-auth's
   session handshake is not worth it for a first slice).

**Cross-cutting dependency to flag for the roadmap:** steps 1–3 are backend-only and could in principle
be one phase; step 4 is a large, separately-testable phase (first mobile app screens, navigation,
first native builds). Splitting at the schema/contracts/API boundary vs. the mobile boundary is the
natural phase seam — not further subdividing 1–3, since a contract endpoint is nearly useless to review
in isolation from the schema it reflects and the guard it runs behind.

## Anti-Patterns

### Anti-Pattern 1: Adding `festivalId` directly to the `user` table

**What people do:** "simplify" by giving `user` a nullable `currentFestivalId` column instead of a
bridge table.
**Why it's wrong:** collapses global and tenant data classes into one row, contradicts ADR-014's
explicit split, and can't represent "joined multiple festivals" (list requirement) or "saved vs.
joined vs. past" states.
**Do this instead:** the `user_festival` bridge table (§1); keep `user` festival-agnostic.

### Anti-Pattern 2: Modeling better-auth's internal routes in `packages/contracts`

**What people do:** treat ADR-006 ("contracts are the single source of truth") as absolute and hand-write
Zod schemas for `/sign-up/email`, `/sign-in/email`, `/get-session`, etc.
**Why it's wrong:** duplicates a surface you don't own and that changes when better-auth plugins are
added; the moment it drifts, the "single source of truth" contract is the one that's wrong.
**Do this instead:** mount better-auth's handler outside `/api/v1`, use its own generated client on
the mobile side, and only contract-define the app-specific endpoints that read the resolved session.

### Anti-Pattern 3: Using better-auth's `organization` plugin for visitor↔festival membership

**What people do:** reach for the built-in multi-tenancy plugin because it's the "official" answer to
"multi-tenant better-auth."
**Why it's wrong:** it models staff membership with roles/invitations — the wrong shape for "a visitor
briefly enters a festival," and conflicts with ADR-014's explicit "enters, doesn't belong" model.
**Do this instead:** plain `user_festival` bridge table; save the `organization` plugin as a candidate
for `apps/admin` (festival organizer staff accounts) in a later milestone.

### Anti-Pattern 4: Hand-editing better-auth's generated schema to force `idColumn()`/uuid consistency

**What people do:** rewrite `auth.ts`'s primary keys to `uuid().defaultRandom()` to match the rest of
`packages/db`.
**Why it's wrong:** better-auth's runtime and its ID-generation logic assume it controls ID format; the
CLI will regenerate this file when plugins are added later, silently reverting the hand-edit.
**Do this instead:** accept the CLI-owned `text('id')` convention for the four auth tables, document
it as vendored/generated (like `drizzle/` migrations), and don't hand-tune it.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| better-auth (library, not a hosted service) | Drizzle Postgres adapter against `packages/db`'s existing client; NestJS catch-all handler; Expo client plugin with `SecureStore` | Self-hosted per ADR-009; no per-MAU cost; security ownership is on us |
| Neon Postgres | Same pooled connection used by `DbModule` today | Auth tables live in the same database/connection, no new infra |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `apps/mobile` ↔ `apps/api` (`/api/auth/*`) | better-auth's own typed client + cookie in `SecureStore` | Separate surface from the contract client; both hit the same NestJS process |
| `apps/mobile` ↔ `apps/api` (`/api/v1/*`) | ts-rest contract client, `Cookie` header forwarded manually | Standard contract-first flow, unchanged from existing festival endpoints |
| `UserModule` ↔ `FestivalModule` (API-internal) | `UserModule`'s `listFestivals`/`joinFestival` read/write `user_festival`, which references `festival.id` | No cross-module HTTP calls — same process, shared `DbModule` |
| Global schema (`auth.ts`, `user-festival.ts`) ↔ Tenant schema (`festival.ts`, `tag.ts`) | One FK direction only: `user_festival.festivalId → festival.id` | Never the reverse; `festival`/`tag` tables must never reference `user` |

## Sources

- better-auth Drizzle Postgres/MySQL/SQLite generated schema examples — official repo docs (Context7 `/better-auth/better-auth`), HIGH confidence
- better-auth `additionalFields` / organization plugin schema extension — official repo docs (Context7 `/better-auth/better-auth`), HIGH confidence
- better-auth NestJS integration guide (module setup, global `AuthGuard`, `@Session()`, `@AllowAnonymous()`, body-parser requirement) — https://better-auth.com/docs/integrations/nestjs, HIGH confidence
- better-auth Expo integration guide (`expoClient` plugin, `SecureStore`, manual cookie forwarding, `credentials: 'omit'`) — official docs via Context7, HIGH confidence
- Expo Router "Session-Driven Root Navigator" / `Stack.Protected` pattern — official Expo docs, `docs/pages/router/advanced/authentication.mdx` (Context7 `/expo/expo`), HIGH confidence
- Community NestJS wrappers for better-auth (`@thallesp/nestjs-better-auth` and alternatives) — web search survey, MEDIUM confidence (multiple competing community packages exist; recommendation is to prefer one but keep the hand-rolled fallback documented)
- This repo: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`, `docs/DEVELOPMENT_DECISIONS.md` (ADR-006, ADR-009, ADR-014), `packages/db/src/schema/{_shared,festival}.ts`, `packages/contracts/src/router.ts` — read directly, treated as ground truth for existing conventions

---
*Architecture research for: festipal visitor-shell slice (auth + tenant selection)*
*Researched: 2026-07-29*
