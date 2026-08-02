<!-- refreshed: 2026-08-02 -->
# Architecture

**Analysis Date:** 2026-08-02

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│              REST API Entry (HTTP Handlers)                 │
│   Controllers via @ts-rest/nest (@TsRestHandler)            │
│  HealthController · FestivalController · MeController       │
│  `apps/api/src/{health,festival,me}/`                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│        Business Logic Layer (Services)                       │
│   FestivalService · MeService                                │
│   Locale resolution, data fetching, tenant scoping           │
│   `apps/api/src/{festival,me}/`                              │
└────────────────────┬────────────────────────────────────────┘
                     │
       ┌─────────────┼─────────────┐
       │             │             │
       ▼             ▼             ▼
┌────────────┐ ┌────────────┐ ┌─────────────┐
│ Contracts  │ │ DB Module  │ │ Auth Module │
│  (ts-rest) │ │ (Drizzle)  │ │(better-auth)│
│ & Schemas  │ │ & Client   │ │  & OTP      │
│ (Zod)      │ │            │ │             │
│`packages/` │ │ `apps/api` │ │ `apps/api`  │
└────────────┘ └────────────┘ └─────────────┘
       │             │             │
       └─────────────┼─────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│   Data Layer & External Services                             │
│  PostgreSQL (Neon) · better-auth · Resend (Email)            │
│  `packages/db/` (Drizzle schema + migrations)                │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **HTTP Entry** | Parse requests, invoke ts-rest handlers, return JSON responses | `apps/api/src/{health,festival,me}/*.controller.ts` |
| **Festival Service** | Query/list festivals, tags (with locale resolution), save festival | `apps/api/src/festival/festival.service.ts` |
| **Me Service** | Manage visitor profile, check username availability, list saved festivals | `apps/api/src/me/me.service.ts` |
| **DB Module** | Provide Drizzle client via DI to all services | `apps/api/src/db/db.module.ts` |
| **Auth Module** | Integrate better-auth, manage OTP flow, global AuthGuard | `apps/api/src/auth/auth.module.ts` |
| **Contracts** | Single source of truth: ts-rest router, Zod schemas, types | `packages/contracts/src/router.ts` · `packages/contracts/src/schemas.ts` |
| **Database Schema** | Drizzle ORM table definitions, migrations, locale/tenant patterns | `packages/db/src/schema/` |
| **i18n** | Locale resolution helpers, supported locales, locale enum | `packages/i18n/src/` |

## Pattern Overview

**Overall:** Layered NestJS backend with end-to-end type safety via ts-rest contracts, multi-tenant by design (festival-scoped), locale-aware content resolution at the service layer, and passwordless authentication via better-auth (OTP over email).

**Key Characteristics:**
- **End-to-end type safety:** `packages/contracts` is the single source of truth. API shape changes flow through contracts; NestJS implements them via `@TsRestHandler` decorators; admin/mobile derive fully typed clients.
- **Multi-tenant by design:** Every tenant-scoped table has `festivalId` FK to `festival.id`. Services receive `festivalId` in parameters and enforce tenant scope in WHERE clauses.
- **Locale resolution at service level:** Two independent axes (ADR-012): (1) UI locale (app language) and (2) content locale (festival data language). Services resolve content before returning to clients via `resolveLocalized()`.
- **Global identity vs. tenant data:** `user` (Account from better-auth) is GLOBAL and carries NO `festivalId`. `visitor_profile` extends it with user-facing display fields (username, displayName). `my_festival` links visitor to festivals (gate-less save).
- **Dependency injection:** NestJS modules and services; DB client injected globally via symbol token `DB`; services are stateless.

## Layers

**HTTP/Controller Layer:**
- Purpose: Route HTTP requests to handlers, extract params/query/body, invoke service methods, return status/body tuples (ts-rest style).
- Location: `apps/api/src/{health,festival,me,config,db,auth}/` (one per module)
- Contains: Decorators (@Controller, @TsRestHandler), handler functions, session extraction (@Session)
- Depends on: Services, contracts, better-auth session guards
- Used by: Express (via NestJS)

**Service/Business Logic Layer:**
- Purpose: Query databases, enforce multi-tenancy, resolve locales, invoke auth/email flows.
- Location: `apps/api/src/{festival,me}/` (services and modules)
- Contains: Injectable service classes with methods like `getBySlug()`, `listTags()`, `completeProfile()`, `save()`
- Depends on: Drizzle client (injected), locale/contract types, better-auth entities
- Used by: Controllers, other services

**Data Access Layer:**
- Purpose: Drizzle ORM schema definitions, SQL query builders, migrations.
- Location: `packages/db/src/` (client factory) and `packages/db/src/schema/` (table definitions)
- Contains: `festival`, `tag`, `tagTranslation`, `user`, `visitorProfile`, `myFestival`, auth tables (generated by better-auth)
- Depends on: Drizzle ORM, postgres.js client
- Used by: Services via injected Database instance

**Contract & Validation Layer:**
- Purpose: Define REST endpoint shapes, request/response validation, shared types, locale enum.
- Location: `packages/contracts/src/` (router, schemas, locale)
- Contains: ts-rest contract definition (`contract.ts` with methods: health, getFestival, listTags, getMe, completeProfile, usernameAvailability, listFestivals, saveFestival, listMyFestivals)
- Depends on: Zod, ts-rest
- Used by: API (implements), admin/mobile (derives types)

**Auth & Identity Layer:**
- Purpose: Handle passwordless OTP, session management, global AuthGuard.
- Location: `apps/api/src/auth/` (better-auth integration, email providers)
- Contains: `auth.instance.ts` (better-auth config), `auth.module.ts` (NestJS wrapper), email provider implementations (dev/Resend)
- Depends on: better-auth, better-auth Drizzle adapter, visitor_profile FK enforcement
- Used by: Main app, controllers (via @Session decorator, AuthGuard)

**Configuration Layer:**
- Purpose: Load and validate environment variables at startup.
- Location: `apps/api/src/config/` (env.ts, config.module.ts)
- Contains: Zod schema for env vars, `loadEnv()` singleton
- Depends on: Zod, process.env
- Used by: DbModule (DATABASE_URL), AuthModule (BETTER_AUTH_SECRET), main bootstrap

**i18n/Localization:**
- Purpose: Manage supported locales, resolve UI/content locales, provide translation helpers.
- Location: `packages/i18n/src/` (locales, resolve.ts)
- Contains: SUPPORTED_LOCALES, DEFAULT_LOCALE, `resolveUiLocale()` (device → system → default)
- Depends on: None
- Used by: Services (ADR-012 content resolution), contracts (locale enum validation)

## Data Flow

### Primary Request Path: Fetch Festival by Slug

1. **HTTP Request** (`GET /api/v1/festivals/:slug`)
   - Express receives request, matches to NestJS route
   - Entry: `apps/api/src/festival/festival.controller.ts:12-21` (getFestival handler)
   
2. **Controller → ts-rest Handler** (`apps/api/src/festival/festival.controller.ts:14-19`)
   - ts-rest extracts params: `{ slug: string }`
   - Invokes `FestivalService.getBySlug(slug)`
   - Handles null → 404 response
   
3. **Service Layer** (`apps/api/src/festival/festival.service.ts:26-47`)
   - Query `festival` table by slug (line 27-31)
   - Query `festival_locale` join to get supported locales (line 34-37)
   - Transform to `Festival` response type (line 39-46)
   - Return `Festival | null`
   
4. **Database Query** (Drizzle)
   - `select().from(festival).where(eq(festival.slug, slug))`
   - Postgres executes, returns rows
   
5. **Response** → Controller returns `{ status: 200, body: Festival }`
   - ts-rest serializes response, sends JSON to client

**State Management:**
- Stateless: Services compute state fresh per request
- DB client (Drizzle instance) is singleton (injected globally)
- Session state comes from better-auth (in DB)

### Secondary Flow: List Tags with Locale Resolution

1. **HTTP Request** (`GET /api/v1/festivals/:festivalId/tags?locale=de`)
   - Entry: `apps/api/src/festival/festival.controller.ts:23-29` (listTags handler)
   - Extract params: `{ festivalId: uuid }`, query: `{ locale?: Locale }`

2. **Service Layer** (`apps/api/src/festival/festival.service.ts:50-84`)
   - Fetch festival's `defaultLocale` (line 51-56)
   - Query tags + translations as LEFT JOIN (line 58-67)
   - Rebuild map: `tag.id` → `{ slug, titles: { de: '...', en: '...' } }` (line 69-76)
   - Resolve each tag's title to requested locale (line 78-82) via `resolveLocalized(titles, requested, defaultLocale)`
   - `resolveLocalized()` tries: requested → festival default → any present → empty string (fallback chain in `packages/contracts/src/locale.ts:24-30`)
   - Return array of `Tag` with resolved titles

3. **Response** → Controller returns `{ status: 200, body: Tag[] }`

**Locale Resolution Pattern:**
- Request specifies locale (or omitted)
- Service queries festival's `defaultLocale` first
- Falls back chain: `requested ?? festivalDefault ?? any ?? ''`
- Enforced at type level: `localeSchema.optional()` in contract, validated by Zod

### Tertiary Flow: Save Festival (Gate-less)

1. **HTTP Request** (`POST /api/v1/festivals/:festivalId/save`, authenticated)
   - AuthGuard verifies session before controller runs (SEC-01)
   - Entry: `apps/api/src/festival/festival.controller.ts:44-56` (saveFestival handler)
   - Extract session: `UserSession` via `@Session()` decorator

2. **Controller → Service** (line 46-56)
   - Pass `session.user.id` (visitor ID, NOT client-supplied) to service
   - Service checks festival exists, then attempts insert to `my_festival`

3. **Service Layer** (`apps/api/src/festival/festival.service.ts:125-151`)
   - Check festival exists (line 129-134)
   - Insert `{ visitorId, festivalId }` with `onConflictDoNothing()` (idempotent, line 137)
   - If FK constraint 23503 fires (visitor has no profile), return `{ status: 'profile-required' }` (line 146-147)
   - Otherwise return `{ status: 'ok' }`

4. **Response**
   - 200 + `{ saved: true }` on success
   - 409 + error message if profile incomplete
   - 404 + error message if festival not found

**Multi-tenancy Enforcement:**
- Scope comes from `session.user.id` (extracted by better-auth), never from client
- FK on `my_festival.visitorId → visitor_profile.accountId` ensures profile exists (schema-level invariant)
- No cross-tenant data leakage: service queries only the one festival by ID

## Key Abstractions

**Festival (Tenant Root):**
- Purpose: Represent a festival/tenant entity
- Examples: `packages/db/src/schema/festival.ts` (table definition), `packages/contracts/src/schemas.ts` (Zod schema + TypeScript type)
- Pattern: Every tenant-scoped table FK references `festival.id`; all queries filter by `festivalId`
- Data: `id` (uuid), `slug` (unique), `name`, `defaultLocale` (mandatory), `supportedLocales` (array), `cashlessUrl` (optional)

**LocalizedText (Translatable Content):**
- Purpose: Represent content in multiple languages as `Partial<Record<Locale, string>>`
- Examples: `tag_translation` table (locale-specific titles), festival event descriptions (future)
- Pattern: Base entity (e.g., `tag`) + companion `*_translation` table (one row per locale)
- Fallback chain: `resolveLocalized(titles, requested, festivalDefault)`

**Locale (Content Language):**
- Purpose: Enumerate supported languages and default fallback
- Examples: `SUPPORTED_LOCALES = ['de', 'en']`, `DEFAULT_LOCALE = 'en'`
- Pattern: Defined once in `packages/contracts/src/locale.ts`, mirrored in Postgres enum + i18n catalogs
- Two independent axes (ADR-012): UI locale (app setting) vs. content locale (festival data)

**Database (Drizzle Client):**
- Purpose: Single shared ORM client across all services
- Examples: Injected via `@Inject(DB)` in FestivalService, MeService
- Pattern: NestJS Global Module (DbModule) provides `DB` symbol token; created from `packages/db/src/client.ts`
- Usage: `this.db.select().from(festival).where(eq(festival.id, id))`

**Contract (ts-rest Router):**
- Purpose: Single source of truth for API shape and validation
- Examples: `packages/contracts/src/router.ts` (18 endpoints defined)
- Pattern: Each endpoint is a method (health, getFestival, listTags, etc.) with path, method, params/body/query schemas, response shapes
- Validation: Zod schemas enforce request/response shape at runtime

**UserSession (better-auth):**
- Purpose: Represent an authenticated visitor's identity
- Provided by: `@thallesp/nestjs-better-auth` via `@Session()` decorator
- Data: `{ user: { id, email, name, emailVerified, image }, session: { ... } }`
- Usage: Extract `session.user.id` to scope queries to that visitor

## Entry Points

**Health Probe:**
- Location: `apps/api/src/health/health.controller.ts`
- Triggers: `GET /api/v1/health`
- Responsibilities: Liveness check for orchestrators (no DB query, no auth required)
- Response: `{ status: 'ok' }`
- Security: @AllowAnonymous() (SEC-01 only bypass)

**Fetch Festival:**
- Location: `apps/api/src/festival/festival.controller.ts:getFestival()`
- Triggers: `GET /api/v1/festivals/:slug`
- Responsibilities: Load festival metadata (name, locales, cashless URL) by slug
- Returns: `Festival` type or 404
- Security: Session-required (AuthGuard, SEC-01)

**List Tags:**
- Location: `apps/api/src/festival/festival.controller.ts:listTags()`
- Triggers: `GET /api/v1/festivals/:festivalId/tags?locale=de`
- Responsibilities: Return festival's tags with titles resolved to requested locale
- Returns: Array of `Tag` (each with id, slug, locale-resolved title)
- Security: Session-required

**Get Current User + Profile:**
- Location: `apps/api/src/me/me.controller.ts:getMe()`
- Triggers: `GET /api/v1/me`
- Responsibilities: Return account info (email, ID) + visitor profile (username, displayName, avatar) or null if incomplete
- Returns: `{ accountId, email, profile: VisitorProfile | null }`
- Security: Session-required (AuthGuard, SEC-01)

**Complete Profile:**
- Location: `apps/api/src/me/me.controller.ts:completeProfile()`
- Triggers: `POST /api/v1/me/complete-profile` (authenticated, first-login only)
- Responsibilities: Create visitor profile (username + displayName + optional avatar), check uniqueness
- Returns: `VisitorProfile` on success, 409 if username taken
- Security: Session-required; 409 also enforces DB uniqueness index (TOCTOU-safe, Pitfall 11)

**Application Bootstrap:**
- Location: `apps/api/src/main.ts`
- Triggers: `node dist/main.js` or `npm run dev` (NestJS watch mode)
- Responsibilities: Load env vars (Zod validation), create NestJS app, listen on port, log startup message
- Special: `bodyParser: false` in NestJS config (required for better-auth's own request streams)

## Architectural Constraints

- **Multi-tenancy (ADR-014):** Every data operation must include a tenant (festival) context. Services never assume a default festival; `festivalId` flows from HTTP params or extracted scope. No cross-tenant queries without explicit guard.
- **Type Safety at Boundaries:** No untyped API endpoints. All request/response shapes validated via Zod schemas in `packages/contracts`. Changes to endpoints flow through contracts first; ts-rest handlers implement exactly; clients regenerate types.
- **Shared Package Isolation:** Code in `packages/*` must NOT import from `apps/*` (no app-specific logic in shared). Apps can import from packages.
- **Database Pooling (ADR-005):** Neon is configured with pgBouncer connection pooling. Drizzle client uses `prepare: false` to avoid prepared statements (incompatible with poolers). Migrations use `DATABASE_URL_UNPOOLED` if available.
- **Locale Scope (ADR-012):** Locales are scoped to the festival's `supportedLocales` (enum subset in DB). Requesting a locale outside this set falls back to `defaultLocale` then any available. Enforced at schema level.
- **Authentication as Session:** better-auth stores session in DB (table: `session`). Every request with valid session token extracts user ID from `user` table. No JWT or in-memory auth state.
- **Monorepo Task Dependencies:** Turbo enforces build order in `turbo.json`. Packages must build before apps that depend on them. `build` task depends on `^build` (dependencies first).
- **Global AuthGuard (SEC-01):** All endpoints protected by default (global `APP_GUARD` from `@thallesp/nestjs-better-auth`). Only endpoints tagged `@AllowAnonymous()` (health, better-auth's own `/api/auth/*`) bypass this.

## Anti-Patterns

### Hardcoded Tenant ID

**What happens:** A service assumes a single festival ID (e.g., `const FESTIVAL_ID = 'abc123'`) and uses it for all queries.

**Why it's wrong:** Multi-tenancy breaks. One festival's data leaks into queries for other festivals. Operator mistakes or future third-party festival additions silently return wrong data.

**Do this instead:** Pass `festivalId` as a parameter to every service method. In controllers, extract it from the HTTP request (path param, not client-supplied query). Example: `apps/api/src/festival/festival.service.ts:50` (`async listTags(festivalId: string, ...)`).

### Skipping Locale Resolution

**What happens:** Service returns raw database text without checking the requested locale. Example: `SELECT title FROM tag_translation` without resolving to a locale-aware fallback.

**Why it's wrong:** Clients get inconsistent content. If a title only exists in German but the user requested English, they see empty string or error instead of the German fallback. Content is unpredictably incomplete.

**Do this instead:** Query the base entity + all translations, rebuild a map, invoke `resolveLocalized(titles, requested, festivalDefault)` before returning. See `apps/api/src/festival/festival.service.ts:50-84`.

### Duplicating Contract Definitions

**What happens:** Same endpoint shape defined twice: once in `packages/contracts/src/router.ts` and again as a TypeScript interface in the API or client code.

**Why it's wrong:** Maintenance nightmare. A schema change in one place is forgotten in another. Client and server diverge. Type safety collapses at the boundary.

**Do this instead:** Define the endpoint ONCE in `packages/contracts/src/router.ts`. NestJS implements it via `@TsRestHandler(contract.methodName)`. Admin/mobile generates typed clients from the contract. Never re-declare shapes. Example: `apps/api/src/festival/festival.controller.ts:12` uses `@TsRestHandler(contract.getFestival)`.

### Importing from Other Apps

**What happens:** `apps/api/src/foo.ts` imports from `apps/admin/src/bar.ts` (or vice versa).

**Why it's wrong:** Tight coupling. Sharing code between apps via direct imports makes them interdependent—one app's refactor breaks the other. Monorepo task ordering breaks; one app can't be built independently.

**Do this instead:** Shared logic belongs in `packages/*`. All apps can safely import from packages. Example: `@festipal/contracts`, `@festipal/db` are imported by both `@festipal/api` (implements) and admin/mobile clients (consumes).

### Storing Secrets in Env Without Validation

**What happens:** Code reads `process.env.SECRET` directly without checking if it's present, allowing unvalidated strings to flow into crypto/auth code.

**Why it's wrong:** Missing secrets cause cryptic failures at runtime (e.g., auth module fails silently because BETTER_AUTH_SECRET is undefined).

**Do this instead:** Use Zod schema for ALL env vars in `apps/api/src/config/env.ts`. Fail fast at bootstrap if any required var is missing. Example: `BETTER_AUTH_SECRET: z.string().min(1)` (line 8, env.ts).

### Client-Supplied Scope (Session Hijacking)

**What happens:** A controller accepts `?visitorId=xyz` from the client and uses it to query `my_festivals` without checking if it matches the session user.

**Why it's wrong:** A logged-in user can request another user's festivals by changing the query parameter (SEC-02 violation). Cross-user data leak.

**Do this instead:** Extract scope ONLY from the session, never from the request. Example: `apps/api/src/me/me.controller.ts:50-51` (`listMyFestivals(@Session() session: UserSession) { ... this.me.listMyFestivals(session.user.id) }`). The `visitorId` comes from the session, never from a query param.

## Error Handling

**Strategy:** Zod schemas validate requests (400 on failure). Services return nullable/union types (not exceptions) for expected failures (not found, conflict). NestJS catches unhandled exceptions (500). Postgres errors (FK violations, unique index) caught explicitly and mapped to semantic status codes (409, 404).

**Patterns:**

1. **Request Validation (Zod):**
   - ts-rest intercepts request and validates against contract schemas
   - If invalid: 400 Bad Request (automatic, no code needed)
   - If valid: params/body/query extracted as typed objects

2. **Not Found (Nullable Return):**
   - Service returns `T | null` for "resource not found"
   - Controller checks: if `null` → 404
   - Example: `apps/api/src/festival/festival.controller.ts:15-17` (getFestival)

3. **Conflict (Union/Discriminated Return):**
   - Service returns `{ status: 'ok' | 'conflict' | 'not-found' }`
   - Controller maps status to HTTP response code
   - Example: `apps/api/src/me/me.controller.ts:28-36` (completeProfile)

4. **Database Errors (Explicit Catch):**
   - FK violations (Postgres 23503) → semantic status (409 profile-required)
   - Unique index violations (Postgres 23505) → 409 conflict
   - Connection errors → throw, NestJS returns 500
   - Example: `apps/api/src/festival/festival.service.ts:139-150` (catch PostgresError)

5. **Environment Load Failure:**
   - `apps/api/src/config/env.ts:loadEnv()` uses Zod
   - If required var missing: throw Error at bootstrap
   - Fail fast, no silent degradation

## Cross-Cutting Concerns

**Locale Resolution (Every Tenant-Scoped Query):**
- Every service method that returns user-facing content accepts optional `locale` param
- Falls back chain: requested → festival default → any present → empty
- Example: `apps/api/src/festival/festival.service.ts:50` (listTags receives optional `locale` param)
- Implemented via `resolveLocalized()` from `packages/contracts/src/locale.ts:24-30`

**Multi-Tenancy Enforcement (Every Query):**
- Every tenant-scoped table has `festivalId: uuid FK → festival.id`
- Every query includes `WHERE festivalId = :id` or `WHERE tagId IN (SELECT id FROM tag WHERE festivalId = :id)`
- Services extract `festivalId` from HTTP request, never assume a default
- Example: `apps/api/src/festival/festival.service.ts:54` (WHERE clause filters by festivalId)

**Type Safety (All Boundaries):**
- Zod schemas in `packages/contracts/src/` are authoritative
- ts-rest `@TsRestHandler` validates requests/responses against schemas
- No TypeScript interfaces or manual validation; always use Zod inferred types
- Example: `apps/api/src/festival/festival.controller.ts:12` (@TsRestHandler enforces contract shape)

**Session-Based Scope (User Identity):**
- better-auth provides `@Session()` decorator
- Controllers extract `session.user.id` (visitor ID from global `user` table)
- All user-scoped queries filter by this ID, never client-supplied parameters
- Example: `apps/api/src/me/me.controller.ts:15` (@Session() ensures authenticated, ID trusted)

**Global Dependency Injection:**
- DbModule is Global; provides `DB` symbol token
- Services inject `@Inject(DB) private readonly db: Database`
- Avoids passing DB through module imports; cleaner DI graph
- Example: `apps/api/src/festival/festival.service.ts:24` (@Inject(DB) constructor parameter)

---

*Architecture analysis: 2026-08-02*
