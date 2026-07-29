# Technology Stack

**Analysis Date:** 2026-07-29

## Languages

**Primary:**
- TypeScript 6.0.3 (pinned workspace-wide per ADR-013; all packages, apps, and backend use TS strict mode)
  - Monorepo packages: `packages/contracts`, `packages/db`, `packages/ui`, `packages/i18n`, `packages/config`
  - Backend: `apps/api` (NestJS)
  - Frontend: `apps/mobile` (React Native) and `apps/admin` (Next.js) — **PLANNED, not yet scaffolded**

**Secondary:**
- JavaScript (configuration files: `.mjs` for ESLint/Prettier configs)

## Runtime

**Environment:**
- Node.js ≥22 (required per `package.json` engines)

**Package Manager:**
- pnpm 11.17.0 (workspace manager, configured in root `package.json`)
- Lockfile: pnpm-lock.yaml (present and committed)

## Frameworks

**Core - Currently Implemented:**
- **NestJS 11.1.28** (`apps/api`)
  - Platform: @nestjs/platform-express 11.1.28
  - CLI: @nestjs/cli 11.0.24
  - Schematics: @nestjs/schematics 11.1.0
- **Turbo 2.10.7** (monorepo orchestration, root workspace)

**Core - Planned per ADRs:**
- **React Native (New Architecture) + Expo** (`apps/mobile`) — ADR-001
- **Next.js 15 + React 19** (`apps/admin`) — ADR-003
- **Better-auth** (self-hosted TypeScript auth) — ADR-009, not yet scaffolded

**Build/Development:**
- **tsup 8.5.1** (TypeScript bundler for packages)
  - Used in: `packages/contracts`, `packages/db`, `packages/ui`, `packages/i18n`
  - Produces both ESM and CJS builds
- **nest CLI** (NestJS build tool for `apps/api`)
- **esbuild 0.28.1** (via @nestjs/cli, backend compilation)

## Key Dependencies

**Critical - API Contracts & Validation:**
- **@ts-rest/core 3.52.1** (`packages/contracts`)
  - Single source of truth for REST API shape (ADR-006)
- **@ts-rest/nest 3.52.1** (`apps/api`)
  - NestJS handler decorators for contract-based routing
- **Zod 3.25.76** (workspace-wide, pinned to v3 per ts-rest constraint in ADR-006)
  - Schema validation in contracts and config
  - Config parsing in `apps/api/src/config/env.ts`

**Database & ORM:**
- **drizzle-orm 0.45.2** (`packages/db`)
  - PostgreSQL dialect, snake_case casing convention
  - Multi-tenant schema with festival-scoped tables (ADR-014)
- **drizzle-kit 0.31.10** (`packages/db` devDependencies)
  - Migrations and schema generation
  - Config: `packages/db/drizzle.config.ts` (points to Neon direct URL for migrations, pooled URL for runtime)
- **postgres 3.4.9** (`packages/db`)
  - postgres.js driver for PostgreSQL connections
  - Configured with `prepare: false` for Neon pgBouncer pooling

**Internationalization:**
- **@lingui/core 6.6.0** (`packages/i18n`)
  - ICU MessageFormat, compile-time extraction, type-safe translation keys
  - Shares catalogs across mobile (React Native) and admin (Next.js)
  - Per-festival locales stored in DB with translation tables (ADR-012)

**Dependency Injection & Reflection:**
- **reflect-metadata 0.2.2** (`apps/api`)
  - NestJS decorator runtime support

**Reactive Programming:**
- **rxjs 7.8.2** (NestJS dependency)
  - Observables, reactive patterns in NestJS

**Environment Configuration:**
- **dotenv 17.4.2** (`apps/api`)
  - `.env` file loading at startup

## Configuration

**Environment:**
- Root `.env` and `.env.*` files (git-ignored, not in repo)
- Backend requires: `PORT` (default 8081), `DATABASE_URL` (Neon pooled URL), optional `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
- Config loading via Zod schema: `apps/api/src/config/env.ts`
- Drizzle migrations use `DATABASE_URL_UNPOOLED` if available, else `DATABASE_URL` (see `packages/db/drizzle.config.ts`)

**Build:**
- **Root `turbo.json`** — task definitions for `build`, `dev`, `lint`, `typecheck`, `test`
  - UI: TUI (terminal UI) for task output
  - Global dependencies: `.env`, `tsconfig.base.json`
  - Build outputs cached: `dist/**`, `.next/**`, `.expo/**`
- **`packages/config/tsconfig.base.json`** — shared TypeScript configuration
  - Target: ES2023, Module: ESNext, Strict mode enabled
  - Path resolution: Bundler strategy
  - Declaration maps and source maps enabled
- **`packages/config/eslint.config.base.mjs`** — flat ESLint config (ESLint v9+)
  - Extends: @eslint/js, typescript-eslint recommended
  - Rules: `@typescript-eslint/consistent-type-imports`, `@typescript-eslint/no-explicit-any` (warn), `@typescript-eslint/no-unused-vars`
  - Ignores: `dist/`, `build/`, `.next/`, `.expo/`, `node_modules/`, `*.config.*`
- **`packages/config/prettier.config.mjs`** — re-exports shared Prettier config
  - Root `prettier.config.mjs` imports from `packages/config`
- **Individual `tsconfig.json` overrides:**
  - `apps/api/tsconfig.json`: CommonJS module, Node10 resolution, `experimentalDecorators` enabled (NestJS requirement)
  - Packages inherit from `tsconfig.base.json`, override for specific needs

**Linting & Formatting:**
- **ESLint 10.8.0** (root + per-app configs in `eslint.config.mjs`)
  - Shared base from `@festipal/config`
  - Individual apps extend with framework rules (NestJS, React, React Native, Next.js — TBD during scaffold)
- **Prettier 3.9.6**
  - Single shared config via `packages/config/prettier.config.mjs`

## Platform Requirements

**Development:**
- Node.js ≥22
- pnpm 11.17.0+
- Git (Conventional Commits per `docs/GIT_CONVENTIONS.md`)
- Docker (optional, for local PostgreSQL; most development targets Neon)
- Xcode + iOS Simulator (optional, for React Native iOS development)
- Android Studio + Android Emulator (optional, for React Native Android development)

**Production:**
- **Backend:** Railway (EU region for co-location with Neon DB in Frankfurt)
  - Runs NestJS app as Docker container
  - Redis instance for WebSocket adapter (ADR-010)
- **Database:** Neon serverless PostgreSQL (eu-central-1 / Frankfurt)
  - Pooled connection URL for app runtime
  - Direct (unpooled) URL for Drizzle migrations
  - Branching for Preview/CI environments
- **Mobile:** EAS Build (Expo cloud build) + EAS Submit (app store submission) + EAS Update (OTA updates)
- **Admin Web:** Vercel or Railway (TBD)

## Deployment & CI/CD

**Hosting Platform:**
- **Database:** Neon (PostgreSQL 18, serverless, eu-central-1)
- **Backend:** Railway (NestJS container, EU region)
- **Admin Web:** TBD (planned Next.js 15 app)
- **Mobile App:** iOS App Store + Google Play Store (via EAS)

**CI/CD Pipeline:**
- GitHub Actions (configured in `.github/workflows/`, TBD)
- Lint, typecheck, test tasks via Turbo on PR
- Build & deploy tasks (mobile EAS, backend Railway, admin web — TBD)

## Workspace Structure

```
festipal/ (pnpm monorepo)
├── package.json              # Root workspace, shared scripts
├── pnpm-workspace.yaml       # pnpm workspace definition
├── turbo.json                # Turborepo config
├── tsconfig.base.json        # (symlink/re-export from packages/config)
├── prettier.config.mjs       # Prettier config (re-exports from packages/config)
├── .gitignore
│
├── apps/
│   ├── api/                  # NestJS backend (implemented, production-ready scaffolding)
│   │   ├── package.json      # Depends: @festipal/contracts, @festipal/db, @festipal/config, NestJS
│   │   ├── tsconfig.json     # Backend-specific (CommonJS, decorators)
│   │   ├── eslint.config.mjs # Extends base, adds NestJS rules
│   │   ├── src/
│   │   │   ├── main.ts       # Entry point
│   │   │   ├── app.module.ts # Root NestJS module
│   │   │   ├── config/       # ENV schema, config module
│   │   │   ├── db/           # DB module, Drizzle client setup
│   │   │   ├── festival/     # Festival service/controller (ADR-014)
│   │   │   └── health/       # Health check endpoint
│   │   └── dist/             # Build output (gitignored)
│   │
│   ├── mobile/               # React Native + Expo app (planned, not scaffolded)
│   │   └── (to be scaffolded per ADR-001)
│   │
│   └── admin/                # Next.js 15 admin web (planned, not scaffolded)
│       └── (to be scaffolded per ADR-003)
│
├── packages/
│   ├── contracts/            # ts-rest API contracts (single source of truth)
│   │   ├── package.json      # Depends: @ts-rest/core, zod
│   │   ├── src/router.ts     # REST route definitions
│   │   ├── src/schemas.ts    # Zod schemas (Festival, Tag, etc.)
│   │   └── dist/             # Build output (gitignored)
│   │
│   ├── db/                   # Drizzle schema + client
│   │   ├── package.json      # Depends: drizzle-orm, postgres
│   │   ├── drizzle.config.ts # Migration config (uses DATABASE_URL_UNPOOLED)
│   │   ├── src/
│   │   │   ├── client.ts     # Creates Drizzle client
│   │   │   ├── schema/
│   │   │   │   ├── _shared.ts   # Shared columns (id, timestamps)
│   │   │   │   ├── festival.ts  # Festival + festival_locale tables
│   │   │   │   ├── tag.ts       # Tag + tag_translation (i18n pattern)
│   │   │   │   ├── locale.ts    # Locale enum, supported locales
│   │   │   │   └── index.ts     # Schema export
│   │   │   └── index.ts      # Public API
│   │   ├── drizzle/          # Migrations (SQL) and metadata
│   │   └── dist/             # Build output (gitignored)
│   │
│   ├── ui/                   # Design tokens + React Native/Web primitives (planned)
│   │   ├── package.json      # (No dependencies yet, shell)
│   │   ├── src/              # To be populated with token defs, components
│   │   └── dist/             # Build output (gitignored)
│   │
│   ├── i18n/                 # Lingui catalogs + locale utilities
│   │   ├── package.json      # Depends: @lingui/core, @festipal/contracts
│   │   ├── src/              # Locale config, LocalizedText helpers
│   │   └── dist/             # Build output (gitignored)
│   │
│   └── config/               # Shared ESLint, Prettier, TypeScript config
│       ├── package.json      # Exports ./eslint, ./prettier, ./tsconfig.base.json
│       ├── tsconfig.base.json
│       ├── eslint.config.base.mjs
│       └── prettier.config.mjs
│
└── docs/
    ├── DEVELOPMENT_DECISIONS.md  # All ADRs (ADR-001 through ADR-015)
    ├── GIT_CONVENTIONS.md        # Trunk-based, Conventional Commits
    └── concept/                  # Design analysis, open questions, design system spec
```

## Workspace Scripts

**Root `package.json` Turborepo tasks:**

```bash
pnpm install                  # Install all dependencies
pnpm build                    # Build all apps/packages (turbo run build)
pnpm dev                      # Dev watch mode (turbo run dev, persistent)
pnpm lint                     # Lint all workspaces
pnpm typecheck                # Run tsc --noEmit across all workspaces
pnpm test                     # Run tests (vitest, playwright, maestro — TBD)
pnpm format                   # Format all files with Prettier
pnpm format:check             # Check formatting without write
```

**App/package-specific scripts** (via per-package `package.json`):
- `pnpm --filter @festipal/api dev` — NestJS dev server with watch
- `pnpm --filter @festipal/api build` — NestJS build
- `pnpm --filter @festipal/db db:generate` — Generate Drizzle types
- `pnpm --filter @festipal/db db:push` — Push schema to Neon
- `pnpm --filter @festipal/db db:migrate` — Run migrations
- Similar for other packages once scaffolded

## Key Constraints & Decisions

1. **TypeScript 6.0.3 pinned** (ADR-013) — ecosystem (typescript-eslint) waiting for TS 7 native support; no untyped `any` at API boundaries
2. **Zod v3 pinned** (ADR-006) — ts-rest 3.52 requires Zod v3; upgrade path when ts-rest v4 arrives
3. **Drizzle + postgres.js** (ADR-005) — `prepare: false` required for Neon pgBouncer pooling; migrations use unpooled URL
4. **Neon PostgreSQL 18** (ADR-010) — eu-central-1 (Frankfurt) for co-location with Railway backend and DSGVO compliance
5. **Multi-tenant from day 1** (ADR-014) — every schema table is `festival`-scoped; auth carries active festival context
6. **Offline-first for mobile** (ADR-007) — TanStack Query + Expo SQLite/MMKV for read-mostly data; small mutation queue for offline writes
7. **OTA updates enabled** (ADR-001) — EAS Update for JS/content changes without store review

---

*Stack analysis: 2026-07-29*
