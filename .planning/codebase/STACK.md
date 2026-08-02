# Technology Stack

**Analysis Date:** 2026-08-02

## Languages

**Primary:**
- TypeScript 6.0.3 (strict mode everywhere, workspace-wide via `packages/config/tsconfig.base.json`) - All application code (backend, utilities, contracts, i18n)
- JavaScript (.mjs) - Configuration files (ESLint, Prettier) for better tooling compatibility

## Runtime

**Environment:**
- Node.js ≥22 (configured in root `package.json` engines field)

**Package Manager:**
- pnpm 11.17.0
- Lockfile: `pnpm-lock.yaml` (present and committed, v9.0 format)

## Frameworks

**Core:**
- NestJS 11.1.28 (`apps/api`) - REST API server with dependency injection, modules, guards, interceptors
- Turbo 2.10.7 - Monorepo orchestration via `turbo.json`, runs build/dev/lint/typecheck/test across packages
- Better-auth 1.6.25 - Self-hosted TypeScript authentication (email OTP, session management, organizations for staff/admin)

**UI/Frontend (Planned):**
- React Native (New Architecture) + Expo (`apps/mobile` scaffolding planned) - Mobile app per ADR-001
- Next.js 15 + React 19 (`apps/admin` scaffolding planned) - Admin web per ADR-003

**API Contracts:**
- ts-rest 3.52.1 (`packages/contracts`) - Single source of truth for REST endpoints and types via Zod schemas
- ts-rest/nest 3.52.1 (`apps/api`) - NestJS adapter for ts-rest handlers

**Testing:**
- Vitest 4.1.10 (`apps/api`) - Unit and integration test runner (node environment, globals enabled)
- Supertest 7.2.2 (`apps/api`) - HTTP assertion library for API testing
- @nestjs/testing 11.1.28 - NestJS testing utilities

**Build/Dev:**
- tsup 8.5.1 - TypeScript bundler for packages (ESM + CJS dual output with type declarations)
- @nestjs/cli 11.0.24 - NestJS development CLI with watch mode
- @nestjs/schematics 11.1.0 - Code generators for NestJS modules/controllers/services

**Code Quality:**
- ESLint 10.8.0 (flat config v9+ via `@eslint/js` + `typescript-eslint`) - Linting across all packages
- Prettier 3.9.6 - Code formatting (semi: true, singleQuote: true, trailing commas, 100 char width)
- TypeScript (strict mode) - Type checking via `typecheck` task

## Key Dependencies

**Critical Infrastructure:**
- Drizzle ORM 0.45.2 (`packages/db`) - Type-safe SQL query builder for Postgres (schema in TypeScript)
- postgres 3.4.9 - Raw Postgres connection client (replaces node-postgres, used with Drizzle, supports connection pooling)
- drizzle-kit 0.31.10 (devDep, `packages/db`) - Drizzle schema generator and migration CLI

**Validation & Type Safety:**
- Zod 3.25.76 (workspace-wide, v3 pinned per ts-rest constraint via ADR-006) - Runtime schema validation with type inference
- drizzle-zod 0.7.1 - Automatic Zod schema generation from Drizzle tables

**Internationalization:**
- @lingui/core 6.6.0 (`packages/i18n`) - Lightweight i18n with ICU-style message formatting (no hardcoded user-facing strings)

**Email/Transports:**
- Resend 6.18.1 (`apps/api`) - Email API client (env-gated, optional, used for OTP email delivery; falls back to console in dev)

**Runtime/Utilities:**
- dotenv 17.4.2 (`apps/api`, `packages/db`) - Environment variable loading from .env files
- reflect-metadata 0.2.2 (`apps/api`) - Metadata reflection for NestJS decorators
- rxjs 7.8.2 - Reactive Extensions (NestJS dependency)

**Development Utilities:**
- tsx 4.23.1 (`packages/db` devDep) - TypeScript execution (used for DB seed scripts)
- @types/node 26.1.2 - Node.js type definitions
- @types/supertest 7.2.1 - Supertest type definitions

## Configuration

**Environment Variables:**
- Backend (`apps/api/src/config/env.ts`):
  - `PORT` (number, default: 8081) - API listen port
  - `DATABASE_URL` (URL, required) - Neon serverless Postgres pooled connection string
  - `BETTER_AUTH_SECRET` (string, required) - Signing secret for email OTP tokens
  - `BETTER_AUTH_URL` (URL, optional) - Callback base URL for auth routes (defaults to http://localhost:8081)
  - `DATABASE_URL_UNPOOLED` (URL, optional) - Direct Neon connection for migrations/integration tests (avoids pgBouncer pooler)
  - `RESEND_API_KEY` (string, optional) - Resend API key (if unset and `OTP_EMAIL_TRANSPORT=resend`, email delivery disabled)
  - `OTP_EMAIL_TRANSPORT` (enum: 'dev' | 'resend', default: 'dev') - OTP email delivery transport (dev = console output, resend = Resend API)
- Database (`packages/db`):
  - Uses same `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for Drizzle schema generation
  - `drizzle.config.ts` - Drizzle configuration with Postgres dialect, snake_case schema casing, unpooled URL for migrations

**Build Configuration:**
- Root `turbo.json` - Task definitions for build/dev/lint/typecheck/test, cache config, persistent dev mode
- `packages/config/tsconfig.base.json` - Shared TypeScript configuration (strict: true, noUncheckedIndexedAccess, noImplicitOverride)
- `packages/config/eslint.config.base.mjs` - Flat ESLint config base (ignores dist, build, .next, .expo, node_modules)
- `packages/config/prettier.config.mjs` - Shared Prettier formatting config

**Per-Package Configs:**
- `apps/api/tsconfig.json` - NestJS-specific overrides
- `apps/api/vitest.config.ts` - Test runner config (fileParallelism: false due to shared Neon connections, integration test state)

## Platform Requirements

**Development:**
- Node.js ≥22
- pnpm ≥11.17.0
- Git (Conventional Commits per `docs/GIT_CONVENTIONS.md`)
- Docker (optional, for local PostgreSQL if not using Neon remote)

**Deployment:**
- Backend: Railway (NestJS container, EU region for co-location with Neon Frankfurt)
- Database: Neon serverless PostgreSQL (eu-central-1 / Frankfurt, Postgres 18, connection pooling enabled)
- Mobile: EAS Build (Expo cloud build) + EAS Submit (app store submission) + EAS Update (OTA)
- Admin Web: TBD (planned Next.js 15, likely Vercel or Railway)

**CI/CD Pipeline:**
- GitHub Actions (workflows not yet created; planned for lint, typecheck, test on PR)
- Turbo runs build/dev/lint/typecheck/test with task orchestration

## Workspace Structure

**Root Package:** `festipal` (private monorepo, pnpm workspaces)

**Apps:**
- `apps/api` - NestJS backend API server (only scaffolded, running)
- `apps/mobile` - React Native + Expo mobile app (planned, scaffolding pending)
- `apps/admin` - Next.js 15 admin web (planned, scaffolding pending)

**Shared Packages:**
- `packages/contracts` - ts-rest router + Zod schemas (single source of truth for API shape)
- `packages/db` - Drizzle schema, migrations, pooled Postgres client factory
- `packages/i18n` - Lingui locale constants and i18n utilities (no hardcoded strings)
- `packages/config` - Shared TypeScript, ESLint, Prettier configs
- `packages/ui` - Design tokens and UI primitives (planned, currently placeholder)

**Documentation:**
- `docs/DEVELOPMENT_DECISIONS.md` - Architecture Decision Records (ADR-001 through ADR-020+)
- `docs/GIT_CONVENTIONS.md` - Conventional Commits, trunk-based workflow, squash-merge via PR

---

*Stack analysis: 2026-08-02*
