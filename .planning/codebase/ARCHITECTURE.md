<!-- refreshed: 2026-07-29 -->
# Architecture

**Analysis Date:** 2026-07-29

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  apps/mobile (Expo React Native)    apps/admin (Next.js 15)   apps/api      │
│         [PLANNED]                        [PLANNED]          [SCAFFOLDED]    │
│                                                                               │
├────────────────────────────────────┬────────────────────────────────────────┤
│ Shared Packages (Monorepo Contracts)                                        │
│                                                                               │
│  packages/contracts (ts-rest + Zod)     – Single source of truth for API   │
│  `packages/contracts/src/router.ts`     – Endpoint definitions              │
│  `packages/contracts/src/schemas.ts`    – Zod validation & types            │
│                                                                               │
│  packages/db (Drizzle ORM)              – Database schema & client          │
│  `packages/db/src/client.ts`            – Database factory & types          │
│  `packages/db/src/schema/`              – Drizzle schema definitions        │
│                                                                               │
│  packages/i18n (Lingui catalogs)        – Locale resolution & i18n config   │
│  packages/ui (Design tokens/components) – Shared visual language            │
│  packages/config (ESLint/TypeScript)    – Monorepo build configuration      │
│                                                                               │
└────────────────────────────────────┴────────────────────────────────────────┘
         │                                              │
         ▼                                              ▼
┌─────────────────────────────────────┐    ┌─────────────────────────────────┐
│  NestJS Backend (apps/api)          │    │  PostgreSQL + Drizzle (Neon)    │
│  `apps/api/src/`                    │    │  `packages/db/src/schema/`      │
│                                     │    │                                 │
│  • Festival Module (tenant root)    │    │  Tables:                        │
│  • Controllers (ts-rest handlers)   │◄──►│  • festival (tenant root)       │
│  • Services (business logic)        │    │  • festival_locale              │
│  • DB Module (Drizzle client)       │    │  • tag (translatable)           │
│  • Config Module (environment)      │    │  • tag_translation              │
│                                     │    │  • [future: acts, vendors, etc]│
└─────────────────────────────────────┘    └─────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **Contracts Package** | REST endpoint definitions + Zod validation schemas (single source of truth for API shape) | `packages/contracts/src/router.ts` |
| **DB Package** | Drizzle schema, migrations, pooled Postgres client | `packages/db/src/schema/`, `packages/db/src/client.ts` |
| **I18n Package** | Locale constants (SUPPORTED_LOCALES, DEFAULT_LOCALE), UI locale resolution, LocalizedText helpers | `packages/i18n/src/` |
| **API: Festival Module** | Festival entity queries (getBySlug, listTags), locale-resolved content | `apps/api/src/festival/` |
| **API: Controllers** | HTTP entry points; ts-rest handlers bridge Contract ↔ Service | `apps/api/src/festival/festival.controller.ts` |
| **API: Services** | Business logic, data fetching, locale/tenant resolution | `apps/api/src/festival/festival.service.ts` |
| **API: DB Module** | Drizzle client factory, global module for DI | `apps/api/src/db/db.module.ts` |
| **API: Config Module** | Environment loading via Zod | `apps/api/src/config/` |

## Pattern Overview

**Overall:** NestJS modular DI-based architecture with a clean contract → controller → service → ORM stack.

**Key Characteristics:**
- **End-to-end type safety:** `packages/contracts` is the single source of truth. API shape changes flow through contracts; clients (admin, mobile) generate typed clients from it (ADR-006).
- **Multi-tenant by design:** Every tenant-scoped table has `festivalId` (FK to `festival.id`). Services receive `festivalId` and enforce tenant scope (ADR-014).
- **Locale resolution at the server:** Two axes (ADR-012): (1) UI locale (app/device language) and (2) content locale (festival language). Services resolve content before sending to clients.
- **Translation-table pattern:** Translatable entities (e.g., `tag`) have a companion `*_translation` table indexed by `(entityId, locale)`. Only the festival's `defaultLocale` is mandatory; others are optional with server-side fallback.
- **Monorepo with shared packages:** `packages/*` is the contract layer between apps. No cross-app code duplication; shared logic lives in packages.

## Layers

**Contracts Layer (`packages/contracts`):**
- Purpose: Define REST endpoints, request/response schemas, and shared types (Festival, Tag, etc.)
- Location: `packages/contracts/src/`
- Contains: ts-rest router definition, Zod schemas, locale enum, LocalizedText type
- Depends on: `zod`, `@ts-rest/core`
- Used by: API (implements contract), admin/mobile (generates typed clients)
- Output: ESM + CJS bundle via tsup

**Database Layer (`packages/db`):**
- Purpose: Drizzle ORM schema, migrations, and pooled Postgres client factory
- Location: `packages/db/src/`
- Contains: Postgres schema files, ID/timestamp column builders, locale enum
- Depends on: `drizzle-orm`, `postgres` (pooled client)
- Used by: API services for data access
- Migrations: `drizzle/` directory (auto-generated by `pnpm --filter db db:generate`)

**API Layer (`apps/api`):**
- Purpose: REST API server using NestJS + ts-rest
- Location: `apps/api/src/`
- Contains:
  - **Modules:** Organizational units (ConfigModule, DbModule, FestivalModule, HealthModule)
  - **Controllers:** HTTP handlers bound to contracts via `@TsRestHandler` decorator
  - **Services:** Business logic (queries, filtering, data transforms)
  - **main.ts:** Bootstrap entry point
- Depends on: `@festipal/contracts`, `@festipal/db`, NestJS
- Output: Node.js runtime (port 8081 by default)

**Config/Build Layer (`packages/config`, `packages/ui`, `packages/i18n`):**
- Purpose: Shared TypeScript config, design tokens, and i18n setup
- Used by: All apps in the monorepo
- Not yet implemented: UI tokens/components (placeholder only)

## Data Flow

### Primary Request Path: Fetch Festival by Slug

1. **Client Request** → `GET /api/v1/festivals/roskilde-2026` (HTTP)
2. **Router Matching** → `contract.getFestival` (ts-rest contract definition in `packages/contracts/src/router.ts`)
3. **Controller Handler** → `FestivalController.getFestival()` in `apps/api/src/festival/festival.controller.ts`
   - ts-rest decorator `@TsRestHandler` bridges HTTP ↔ contract
   - Extracts path params (`slug`)
4. **Service Call** → `FestivalService.getBySlug(slug)` in `apps/api/src/festival/festival.service.ts`
   - Queries Drizzle for festival row by slug
   - Fetches associated `festival_locale` records
   - Builds response object (Festival type from contract schema)
5. **Database Query** → Drizzle-orm executes SQL against Neon Postgres
   - `SELECT * FROM festival WHERE slug = $1`
   - `SELECT locale FROM festival_locale WHERE festival_id = $1`
6. **Response** → Serialized Festival JSON (200) or error (404)

### Secondary Flow: List Tags with Locale Resolution

1. **Client Request** → `GET /api/v1/festivals/{festivalId}/tags?locale=de` (HTTP)
2. **Contract** → `contract.listTags` defines optional `locale` query param (ADR-012)
3. **Controller** → `FestivalController.listTags()` passes `festivalId` + `locale` to service
4. **Service** → `FestivalService.listTags(festivalId, requested?)`
   - Fetches festival's `defaultLocale` (required for fallback)
   - LEFT JOIN `tag` ↔ `tag_translation` for all locales
   - For each tag, builds `LocalizedText` map (`{ de: "...", en: "..." }`)
   - Resolves to single title: `resolveLocalized(titles, requested, defaultLocale)`
   - Returns array of `Tag` with resolved title
5. **Fallback Logic** (ADR-012):
   - If `locale=de` but no German translation exists → use festival's `defaultLocale`
   - If neither exists → use any present locale
6. **Response** → Array of tags with titles in requested language

**State Management:**
- Request-scoped: Locale resolution happens fresh per request (no caching at API level)
- Database-scoped: Multitenant guard (every query includes `festivalId` filter)
- No in-memory global state; services are stateless

## Key Abstractions

**Festival (Tenant Root):**
- Purpose: Represents the festival/tenant entity (ADR-014)
- Examples: `packages/db/src/schema/festival.ts`, `packages/contracts/src/schemas.ts`
- Pattern: Every tenant-scoped table has `festivalId: uuid FK → festival.id`
- Data: `id`, `slug` (unique), `name`, `defaultLocale`, `supportedLocales`, optional `cashlessUrl`

**LocalizedText:**
- Purpose: Represent translatable content as `Partial<Record<Locale, string>>`
- Examples: Tag titles, Event descriptions, Vendor names (future)
- Pattern: Base entity (e.g., `tag`) + companion translation table (`tag_translation`)
  - Admin can edit all locales via the translation table
  - App receives only the resolved locale (server-side fallback in service)
- Type: `packages/contracts/src/locale.ts` (source of truth for all layers)

**Locale Resolution (Two Axes, ADR-012):**
- **Axis 1 (UI):** App UI language (app setting → system locale → default)
  - Handled by: `packages/i18n/src/resolve.ts` (`resolveUiLocale`)
  - Affects: Which language strings the UI displays (Lingui catalogs)
- **Axis 2 (Content):** Festival data language (requested → festival default → any)
  - Handled by: `packages/contracts/src/locale.ts` (`resolveLocalized`)
  - Affects: Which locale the API returns for tag titles, news, etc.
- Independent: English UI + German content is valid (fallback to German if no English content)

**Database Client Factory:**
- Purpose: Single shared Drizzle client across all API services
- Pattern: NestJS Global Module (`DbModule`) provides `DB` symbol
- Location: `apps/api/src/db/db.module.ts`
- Usage: Inject `@Inject(DB)` in any service to get typed `Database` instance
- Client created from: `packages/db/src/client.ts` (`createDatabase(connectionString)`)

## Entry Points

**Health Check Endpoint:**
- Location: `apps/api/src/health/health.controller.ts`
- Triggers: GET `/api/v1/health`
- Responsibilities: Liveness probe for orchestrators
- Response: `{ status: 'ok' }`

**Festival Fetch:**
- Location: `apps/api/src/festival/festival.controller.ts`
- Triggers: GET `/api/v1/festivals/:slug`
- Responsibilities: Load festival metadata (name, supported locales, cashless URL)
- Returns: `Festival` type or 404

**Tag List (Tenant-Scoped):**
- Location: `apps/api/src/festival/festival.controller.ts`
- Triggers: GET `/api/v1/festivals/:festivalId/tags?locale=de`
- Responsibilities: Return festival's tags with titles in requested locale
- Returns: Array of `Tag` (locale-resolved)

**Main Entry Point (Bootstrap):**
- Location: `apps/api/src/main.ts`
- Triggers: `node dist/main.js` or `npm run dev` (watch mode via NestJS CLI)
- Responsibilities: Load env, create NestJS app, listen on port (default 8081)

## Architectural Constraints

- **Multi-tenancy:** Every data operation must include a tenant (festival) context. No cross-tenant queries without an explicit guard. Services never assume a default festival; tenantId flows from the HTTP request.

- **Locale Scope:** Locales are scoped to the festival's `supportedLocales`. Requesting a locale outside this set falls back to `defaultLocale` then any available. This is enforced at the schema level (enum).

- **Type Safety at Boundaries:** No untyped API boundaries. All request/response shapes are validated via Zod schemas in `packages/contracts`. Changes to endpoints flow through contracts first; clients regenerate types automatically.

- **Shared Package Isolation:** Code in `packages/*` must not import from `apps/*` (no app-specific code in shared). Apps can import from packages.

- **Database Pooling:** Neon is configured with connection pooling enabled (pgBouncer). The Drizzle client uses `prepare: false` to work safely behind a pooler (ADR-005).

- **Monorepo Task Dependencies:** Turbo enforces build order (build ↔ typecheck). Packages must build before apps that depend on them. Enforced in `turbo.json`.

## Anti-Patterns

### Hardcoded Tenant ID

**What happens:** Service receives a query without a `festivalId` and assumes a default festival or queries across all festivals.

**Why it's wrong:** Violates multi-tenancy (ADR-014). Cross-tenant data leaks, unpredictable behavior in multi-festival scenarios.

**Do this instead:** Every query must be scoped to a `festivalId`. Extract it from the HTTP request path or context. Example in `apps/api/src/festival/festival.service.ts`: `where(eq(tag.festivalId, festivalId))` is mandatory.

### Skipping Locale Resolution

**What happens:** Returning all translations from the database without resolving to the requested locale. Client must pick the language itself.

**Why it's wrong:** Bloats response size, shifts locale logic to multiple clients (inconsistent), makes i18n fragile.

**Do this instead:** Resolve in the service before responding. Use `resolveLocalized(titles, requested, festivalDefault)` from `packages/contracts/src/locale.ts` to pick one string. Clients get pre-resolved content.

### Duplicating Contract Definitions

**What happens:** Writing endpoint types/schemas in multiple places (contracts, API code, client code).

**Why it's wrong:** Single source of truth is broken. Schema changes don't propagate. Type mismatches between layers.

**Do this instead:** Define once in `packages/contracts/src/router.ts` (endpoint + Zod schema). API implements via `@TsRestHandler`, clients generate types from contract. See `apps/api/src/festival/festival.controller.ts` for example.

### Importing from Other Apps

**What happens:** `apps/admin` imports from `apps/api` or vice versa.

**Why it's wrong:** Creates hidden dependencies, breaks monorepo layering, makes apps unmaintainable independently.

**Do this instead:** Use `packages/*` as the shared layer. Types, validation, contracts belong in packages; app-specific code stays in `apps/*`.

## Error Handling

**Strategy:** Zod validation at boundaries, graceful HTTP responses per contract.

**Patterns:**

- **Request Validation:** Zod schemas in `packages/contracts/src/` validate request bodies/params before controller logic. Invalid input → 400 Bad Request.

- **Not Found:** Service returns `null` if resource not found. Controller maps to 404 error response. See `apps/api/src/festival/festival.controller.ts` line 14-16.

- **Database Errors:** Drizzle throws on connection/query errors. NestJS catches and returns 500. No unhandled promise rejections.

- **Env Load Failure:** `apps/api/src/config/env.ts` uses Zod to parse `process.env`. Missing required vars → throw during bootstrap (fail fast).

## Cross-Cutting Concerns

**Locale Resolution:**
- Every tenant-scoped query that returns user-facing text must resolve to the requested locale server-side.
- Pattern: Service accepts optional `locale` param, queries translation table, falls back to festival's `defaultLocale`.
- Example: `apps/api/src/festival/festival.service.ts` (`listTags` method).

**Multi-Tenancy Guards:**
- Every tenant-scoped table has `festivalId` FK. Every query filters by `festivalId` in WHERE clause.
- Example: `tag` table (line 19-20 in `packages/db/src/schema/tag.ts`) → `festivalId: uuid().notNull().references(() => festival.id)`.
- Service must extract `festivalId` from the request and pass to all data operations.

**Type Safety:**
- Zod schemas in contracts are the source of truth. No separate TypeScript interfaces (use `z.infer`).
- Backend implements contracts exactly (via `@TsRestHandler`). No deviations.
- Mobile/admin derive their types from the contract, ensuring alignment.

---

*Architecture analysis: 2026-07-29*
