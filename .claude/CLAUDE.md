<!-- GSD:project-start source:PROJECT.md -->

## Project

**quiks**

quiks is a **multi-tenant festival app** (one festival = one tenant, reused across every
partnering festival). For visitors it brings the whole festival into one place: overview, site
map, timetable, news/updates, and cashless — plus two differentiators, a **camping-spot / ticket
swap marketplace** and **activities + connecting with friends**. It ships as an Expo mobile app
for visitors, a Next.js admin web for festival organizers, and a NestJS backend, all in one
Turborepo. This build cycle focuses on the **visitor mobile app**.

The ADR-024 rename has landed (phase 05.1): workspace packages are `@quiks/*`, the bundle ID is
`at.quiks.app` and the app URL scheme is `quiks`. Historical design assets under
`docs/concept/designs/` deliberately keep their original filenames as history.

**Core Value:** A festival visitor can get into the app, connect to their festival, and reach everything about
their festival experience from one home screen. If everything else fails, that entry-and-home
path must work.

### Constraints

- **Tech stack**: Turborepo/pnpm · Expo + Expo Router (RN New Arch) mobile · Next.js 15 admin · NestJS API · ts-rest+Zod contracts · Drizzle/Neon Postgres · better-auth · Redis realtime · MapLibre · Lingui i18n — Decided across ADRs 001–015; don't re-litigate without an ADR.
- **TypeScript**: strict mode everywhere, pinned to TS 6.0.x (TS 7 pending typescript-eslint support — ADR-013). No untyped `any` at API boundaries.
- **Architecture (non-negotiable)**: multi-tenancy from day 1 (every domain model/query festival-scoped) · offline-first by design (don't assume network) · end-to-end type safety via `packages/contracts` · i18n from day 1 (no hardcoded user-facing strings) · tenant-aware auth · no secrets in repo.
- **Git**: trunk-based, short-lived feature branches, Conventional Commits, squash-merge via PR — never commit to `main` (`docs/GIT_CONVENTIONS.md`).
- **Validation**: Zod schemas in `packages/contracts` are the source of truth; reuse, don't re-declare.
- **Brand/Design**: ADR-023 + `docs/brand/quiks-ci-v1.md` — Beere/Amber; Sunset is the only allowed gradient; hell-first (light-first); Limette/Violett are now CI-token fallback only, not brand colors. The ADR-024 rename has landed in phase 05.1 — `@quiks/*` / `at.quiks.app` / scheme `quiks` are the current names.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- TypeScript 6.0.3 (pinned workspace-wide per ADR-013; all packages, apps, and backend use TS strict mode)
- JavaScript (configuration files: `.mjs` for ESLint/Prettier configs)

## Runtime

- Node.js ≥22 (required per `package.json` engines)
- pnpm 11.17.0 (workspace manager, configured in root `package.json`)
- Lockfile: pnpm-lock.yaml (present and committed)

## Frameworks

- **NestJS 11.1.28** (`apps/api`)
- **Turbo 2.10.7** (monorepo orchestration, root workspace)
- **React Native (New Architecture) + Expo** (`apps/mobile`) — ADR-001
- **Next.js 15 + React 19** (`apps/admin`) — ADR-003
- **Better-auth** (self-hosted TypeScript auth) — ADR-009, not yet scaffolded
- **tsup 8.5.1** (TypeScript bundler for packages)
- **nest CLI** (NestJS build tool for `apps/api`)
- **esbuild 0.28.1** (via @nestjs/cli, backend compilation)

## Key Dependencies

- **@ts-rest/core 3.52.1** (`packages/contracts`)
- **@ts-rest/nest 3.52.1** (`apps/api`)
- **Zod 3.25.76** (workspace-wide, pinned to v3 per ts-rest constraint in ADR-006)
- **drizzle-orm 0.45.2** (`packages/db`)
- **drizzle-kit 0.31.10** (`packages/db` devDependencies)
- **postgres 3.4.9** (`packages/db`)
- **@lingui/core 6.6.0** (`packages/i18n`)
- **reflect-metadata 0.2.2** (`apps/api`)
- **rxjs 7.8.2** (NestJS dependency)
- **dotenv 17.4.2** (`apps/api`)

## Configuration

- Root `.env` and `.env.*` files (git-ignored, not in repo)
- Backend requires: `PORT` (default 8081), `DATABASE_URL` (Neon pooled URL), optional `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
- Config loading via Zod schema: `apps/api/src/config/env.ts`
- Drizzle migrations use `DATABASE_URL_UNPOOLED` if available, else `DATABASE_URL` (see `packages/db/drizzle.config.ts`)
- **Root `turbo.json`** — task definitions for `build`, `dev`, `lint`, `typecheck`, `test`
- **`packages/config/tsconfig.base.json`** — shared TypeScript configuration
- **`packages/config/eslint.config.base.mjs`** — flat ESLint config (ESLint v9+)
- **`packages/config/prettier.config.mjs`** — re-exports shared Prettier config
- **Individual `tsconfig.json` overrides:**
- **ESLint 10.8.0** (root + per-app configs in `eslint.config.mjs`)
- **Prettier 3.9.6**

## Platform Requirements

- Node.js ≥22
- pnpm 11.17.0+
- Git (Conventional Commits per `docs/GIT_CONVENTIONS.md`)
- Docker (optional, for local PostgreSQL; most development targets Neon)
- Xcode + iOS Simulator (optional, for React Native iOS development)
- Android Studio + Android Emulator (optional, for React Native Android development)
- **Backend:** Railway (EU region for co-location with Neon DB in Frankfurt)
- **Database:** Neon serverless PostgreSQL (eu-central-1 / Frankfurt)
- **Mobile:** EAS Build (Expo cloud build) + EAS Submit (app store submission) + EAS Update (OTA updates)
- **Admin Web:** Vercel or Railway (TBD)

## Deployment & CI/CD

- **Database:** Neon (PostgreSQL 18, serverless, eu-central-1)
- **Backend:** Railway (NestJS container, EU region)
- **Admin Web:** TBD (planned Next.js 15 app)
- **Mobile App:** iOS App Store + Google Play Store (via EAS)
- GitHub Actions (configured in `.github/workflows/`, TBD)
- Lint, typecheck, test tasks via Turbo on PR
- Build & deploy tasks (mobile EAS, backend Railway, admin web — TBD)

## Workspace Structure

## Workspace Scripts

- `pnpm --filter @quiks/api dev` — NestJS dev server with watch
- `pnpm --filter @quiks/api build` — NestJS build
- `pnpm --filter @quiks/db db:generate` — Generate Drizzle types
- `pnpm --filter @quiks/db db:push` — Push schema to Neon
- `pnpm --filter @quiks/db db:migrate` — Run migrations
- Similar for other packages once scaffolded

## Key Constraints & Decisions

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Naming Patterns

- Lowercase with hyphens for directories: `festival`, `db`, `config`
- TypeScript files: `.ts` (Node/backend) or `.tsx` (React components)
- Suffix patterns for NestJS: `.module.ts`, `.service.ts`, `.controller.ts`
- Example: `festival.controller.ts`, `festival.service.ts`, `festival.module.ts`
- camelCase, descriptive, no abbreviations: `loadEnv()`, `resolveLocalized()`, `getBySlug()`
- Async functions return `Promise<T>`: `async getBySlug(): Promise<Festival | null>`
- Prefix conventions: `get*` for queries, `list*` for collections, `load*` for initialization
- camelCase throughout: `festivalId`, `defaultLocale`, `supportedLocales`
- Use const by default; let rarely needed
- Destructuring preferred: `const { id, slug, name } = festival`
- PascalCase for types, interfaces, classes: `Festival`, `Locale`, `LocalizedText`, `Tag`
- Schema types inferred from Zod: `export type Festival = z.infer<typeof festivalSchema>`
- Type imports explicit: `import type { Festival } from '@quiks/contracts'`
- Enum members SCREAMING_SNAKE_CASE: `SUPPORTED_LOCALES = ['de', 'en']`, `DEFAULT_LOCALE = 'en'`

## Code Style

- Tool: Prettier 3.9.6
- Semi: true
- Single quotes: true
- Trailing comma: 'all'
- Print width: 100
- Tab width: 2
- Config location: `prettier.config.mjs` (root) → re-exports from `packages/config/prettier.config.mjs`
- Tool: ESLint 10.8.0 + typescript-eslint
- Flat config format: `eslint.config.mjs`
- Shared base: `packages/config/eslint.config.base.mjs`
- Key rules enforced:

## Import Organization

- No path aliases configured currently in monorepo
- Use workspace package names: `@quiks/contracts`, `@quiks/db`, `@quiks/config`
- Within a package, use relative paths: `./locale`, `../db/db.module`

## Error Handling

- Zod schema validation with safeParse:
- Nullable returns for "not found" cases: `Promise<Festival | null>`
- ts-rest handler returns tuple: `{ status: 404, body: { message: 'Festival not found' } }`
- NestJS Guard/Interceptor pattern for cross-cutting concerns (planned, not yet in scaffold)

## Logging

- Use `console.error()` for errors: `console.error('Invalid environment:', ...)`
- Use `console.log()` for startup info: `console.log('quiks api listening on...')`
- Avoid logging in libraries; let callers decide
- Structured logging (e.g., bunyan, pino) planned for production API, not yet enforced

## Comments

- Non-obvious business logic (e.g., locale resolution fallback chain)
- Cross-cutting concerns (e.g., tenant scoping, ADR references)
- External contract/API expectations
- Avoid stating the obvious; let code be self-documenting
- Use for public API functions and types:
- Mandatory for exported functions in `packages/contracts`
- Not required for private/internal functions unless complex
- When code encodes an architectural decision, cite it: `// ADR-011: Cashless via embedded URL`
- Links to `docs/DEVELOPMENT_DECISIONS.md` in comments where appropriate

## Function Design

- Example: `loadEnv()` is 8 lines; `resolveLocalized()` is 1 line
- Example: `getBySlug()` is 6 lines (database + response transform)
- Prefer typed objects over multiple scalars: `params: { slug: string }` not `slug: string, other: string`
- Required before optional; use destructuring
- Max 3-4 parameters before considering an object
- Explicit return types: `Promise<Festival | null>`, not `Promise<any>`
- Nullable for "not found": return `null` not empty object
- Never return undefined from functions; use null or throw
- Use discriminated unions for status/body patterns (ts-rest style)

## Module Design

- Explicit: use named exports, not default exports
- Barrel files (index.ts) re-export from sibling modules:
- Private/internal: use file-scoped (not exported) for internal helpers
- Controllers handle HTTP routing (decorators: `@TsRestHandler`)
- Services handle business logic (decorated with `@Injectable()`)
- Modules manage dependencies and cross-cutting concerns
- Constructor injection via decorators
- Token name in `@Inject()` matches provider registration in module

## TypeScript-Specific

- Enforced project-wide via `tsconfig.base.json`
- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`
- No `any` at public API boundaries; use `unknown` and narrow if needed
- Leverage Zod's `z.infer<typeof schema>` for runtime validation + types:
- Let TypeScript infer where obvious; annotate public signatures
- Use sparingly; prefer concrete types when possible
- Example: `Promise<Festival | null>` not `Promise<T | null>` with `T = Festival`

## Monorepo (Turborepo + pnpm)

- Located in `apps/*` and `packages/*`
- Prefixed with `@quiks/`: `@quiks/api`, `@quiks/contracts`, `@quiks/db`
- Internal dependencies via `workspace:*` protocol in package.json
- ESLint base: `packages/config/eslint.config.base.mjs`
- TypeScript base: `packages/config/tsconfig.base.json`
- Prettier: `packages/config/prettier.config.mjs` (re-exported from root)
- Extend, don't override; lint/typecheck must pass on all packages
- Compiled JS in `dist/` (gitignored)
- Type declarations (`.d.ts`) generated if `declaration: true` in tsconfig
- tsup for library builds (packages)
- nest build for NestJS (apps/api)

## Validation & Schemas

- Single source of truth in `packages/contracts`
- Used for:
- Never re-declare shapes; import and infer types from schemas

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

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

- **End-to-end type safety:** `packages/contracts` is the single source of truth. API shape changes flow through contracts; clients (admin, mobile) generate typed clients from it (ADR-006).
- **Multi-tenant by design:** Every tenant-scoped table has `festivalId` (FK to `festival.id`). Services receive `festivalId` and enforce tenant scope (ADR-014).
- **Locale resolution at the server:** Two axes (ADR-012): (1) UI locale (app/device language) and (2) content locale (festival language). Services resolve content before sending to clients.
- **Translation-table pattern:** Translatable entities (e.g., `tag`) have a companion `*_translation` table indexed by `(entityId, locale)`. Only the festival's `defaultLocale` is mandatory; others are optional with server-side fallback.
- **Monorepo with shared packages:** `packages/*` is the contract layer between apps. No cross-app code duplication; shared logic lives in packages.

## Layers

- Purpose: Define REST endpoints, request/response schemas, and shared types (Festival, Tag, etc.)
- Location: `packages/contracts/src/`
- Contains: ts-rest router definition, Zod schemas, locale enum, LocalizedText type
- Depends on: `zod`, `@ts-rest/core`
- Used by: API (implements contract), admin/mobile (generates typed clients)
- Output: ESM + CJS bundle via tsup
- Purpose: Drizzle ORM schema, migrations, and pooled Postgres client factory
- Location: `packages/db/src/`
- Contains: Postgres schema files, ID/timestamp column builders, locale enum
- Depends on: `drizzle-orm`, `postgres` (pooled client)
- Used by: API services for data access
- Migrations: `drizzle/` directory (auto-generated by `pnpm --filter db db:generate`)
- Purpose: REST API server using NestJS + ts-rest
- Location: `apps/api/src/`
- Contains:
- Depends on: `@quiks/contracts`, `@quiks/db`, NestJS
- Output: Node.js runtime (port 8081 by default)
- Purpose: Shared TypeScript config, design tokens, and i18n setup
- Used by: All apps in the monorepo
- Not yet implemented: UI tokens/components (placeholder only)

## Data Flow

### Primary Request Path: Fetch Festival by Slug

### Secondary Flow: List Tags with Locale Resolution

- Request-scoped: Locale resolution happens fresh per request (no caching at API level)
- Database-scoped: Multitenant guard (every query includes `festivalId` filter)
- No in-memory global state; services are stateless

## Key Abstractions

- Purpose: Represents the festival/tenant entity (ADR-014)
- Examples: `packages/db/src/schema/festival.ts`, `packages/contracts/src/schemas.ts`
- Pattern: Every tenant-scoped table has `festivalId: uuid FK → festival.id`
- Data: `id`, `slug` (unique), `name`, `defaultLocale`, `supportedLocales`, optional `cashlessUrl`
- Purpose: Represent translatable content as `Partial<Record<Locale, string>>`
- Examples: Tag titles, Event descriptions, Vendor names (future)
- Pattern: Base entity (e.g., `tag`) + companion translation table (`tag_translation`)
- Type: `packages/contracts/src/locale.ts` (source of truth for all layers)
- **Axis 1 (UI):** App UI language (app setting → system locale → default)
- **Axis 2 (Content):** Festival data language (requested → festival default → any)
- Independent: English UI + German content is valid (fallback to German if no English content)
- Purpose: Single shared Drizzle client across all API services
- Pattern: NestJS Global Module (`DbModule`) provides `DB` symbol
- Location: `apps/api/src/db/db.module.ts`
- Usage: Inject `@Inject(DB)` in any service to get typed `Database` instance
- Client created from: `packages/db/src/client.ts` (`createDatabase(connectionString)`)

## Entry Points

- Location: `apps/api/src/health/health.controller.ts`
- Triggers: GET `/api/v1/health`
- Responsibilities: Liveness probe for orchestrators
- Response: `{ status: 'ok' }`
- Location: `apps/api/src/festival/festival.controller.ts`
- Triggers: GET `/api/v1/festivals/:slug`
- Responsibilities: Load festival metadata (name, supported locales, cashless URL)
- Returns: `Festival` type or 404
- Location: `apps/api/src/festival/festival.controller.ts`
- Triggers: GET `/api/v1/festivals/:festivalId/tags?locale=de`
- Responsibilities: Return festival's tags with titles in requested locale
- Returns: Array of `Tag` (locale-resolved)
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

### Skipping Locale Resolution

### Duplicating Contract Definitions

### Importing from Other Apps

## Error Handling

- **Request Validation:** Zod schemas in `packages/contracts/src/` validate request bodies/params before controller logic. Invalid input → 400 Bad Request.
- **Not Found:** Service returns `null` if resource not found. Controller maps to 404 error response. See `apps/api/src/festival/festival.controller.ts` line 14-16.
- **Database Errors:** Drizzle throws on connection/query errors. NestJS catches and returns 500. No unhandled promise rejections.
- **Env Load Failure:** `apps/api/src/config/env.ts` uses Zod to parse `process.env`. Missing required vars → throw during bootstrap (fail fast).

## Cross-Cutting Concerns

- Every tenant-scoped query that returns user-facing text must resolve to the requested locale server-side.
- Pattern: Service accepts optional `locale` param, queries translation table, falls back to festival's `defaultLocale`.
- Example: `apps/api/src/festival/festival.service.ts` (`listTags` method).
- Every tenant-scoped table has `festivalId` FK. Every query filters by `festivalId` in WHERE clause.
- Example: `tag` table (line 19-20 in `packages/db/src/schema/tag.ts`) → `festivalId: uuid().notNull().references(() => festival.id)`.
- Service must extract `festivalId` from the request and pass to all data operations.
- Zod schemas in contracts are the source of truth. No separate TypeScript interfaces (use `z.infer`).
- Backend implements contracts exactly (via `@TsRestHandler`). No deviations.
- Mobile/admin derive their types from the contract, ensuring alignment.

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| nestjs-best-practices | NestJS best practices and architecture patterns for building production-ready applications. This skill should be used when writing, reviewing, or refactoring NestJS code to ensure proper patterns for modules, dependency injection, security, and performance. | `.claude/skills/nestjs-best-practices/SKILL.md` |
| nextjs-app-router-patterns | Master Next.js 14+ App Router with Server Components, streaming, parallel routes, and advanced data fetching. Use when building Next.js applications, implementing SSR/SSG, or optimizing React Server Components. | `.claude/skills/nextjs-app-router-patterns/SKILL.md` |
| nextjs-turbopack | Next.js 16+ and Turbopack — incremental bundling, FS caching, dev speed, and when to use Turbopack vs webpack. | `.claude/skills/nextjs-turbopack/SKILL.md` |
| react-native-architecture | Build production React Native apps with Expo, navigation, native modules, offline sync, and cross-platform patterns. Use when developing mobile apps, implementing native integrations, or architecting React Native projects. | `.claude/skills/react-native-architecture/SKILL.md` |
| react-native-design | Master React Native styling, navigation, and Reanimated animations for cross-platform mobile development. Use when building React Native apps, implementing navigation patterns, or creating performant animations. | `.claude/skills/react-native-design/SKILL.md` |
| ui-ux-pro-max | "UI/UX design intelligence for web and mobile. Searchable local database with 84 styles, 192 color palettes, 74 font pairings, 192 product types, 98 UX guidelines, 104 icon entries, 16 GSAP motion presets, and 25 chart types across 22 stacks (React, Next.js, Vue, Nuxt, Svelte, Astro, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, Jetpack Compose, Angular, Laravel, JavaFX, WPF, WinUI, Avalonia, Uno Platform, UWP, Three.js, and HTML/CSS). Use when designing, building, or reviewing UI: pages, components, color schemes, typography, layout, accessibility, animation, or data visualization." | `.claude/skills/ui-ux-pro-max/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

## Parallel Workstreams (GSD)

> Hand-written section, deliberately placed after the last GSD marker block so a regeneration
> cannot overwrite it.

`.planning/` runs in **workstream mode**: two streams are planned concurrently by two Claude
sessions against the same monorepo.

| Workstream | Scope | Code |
|---|---|---|
| `mobile` | Visitor Expo app — v1.0 Rollout, Phase 6 next | `apps/mobile` |
| `admin` | Admin/staff web UI — own milestone, not started | `apps/admin` (not scaffolded yet) |

`ROADMAP.md`, `STATE.md`, `REQUIREMENTS.md` and `phases/` are per-stream under
`.planning/workstreams/<name>/`. `PROJECT.md`, `config.json`, `codebase/`, `research/`, `quick/`,
`debug/`, `scripts/`, `WINDOWS.md` and `ui-reviews/` stay shared at `.planning/` — both streams
read the same ADRs and project decisions.

**Scope every GSD command to a stream.** Pass `--ws mobile` / `--ws admin`, or set
`GSD_WORKSTREAM` in the terminal before launching the session. Unscoped, GSD can resolve the other
stream's `STATE.md`.

**Serialize shared-package changes.** `packages/contracts` and `packages/db` are where the two
streams genuinely collide: `drizzle-zod` propagates a schema change into every app, so concurrent
edits break the other stream's typecheck. Only one stream touches them at a time. Admin's
identity/staff-role work must be **additive** — new tables, no changes to `visitor_profile` or
`my_festival` (ADR-014/016/021). `packages/ui` is shared as well: mobile consumes the RN tokens,
admin consumes Tailwind/shadcn (ADR-022) — how CI v1.0 tokens bridge into Tailwind needs an ADR
before admin styling starts.

**Local infrastructure is shared.** Only one session runs the API on 8081 (Metro defaults to 8081
too); admin's Next.js takes 3000. Both streams use the one local Docker Postgres — `docker-compose.yml`
carries an explicit `name: quiks`, so the stack is controllable from either worktree and does not
depend on the directory name.
