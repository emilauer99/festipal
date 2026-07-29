# Codebase Structure

**Analysis Date:** 2026-07-29

## Directory Layout

```
festipal/
├── apps/                          # Applications (currently API only; mobile and admin planned)
│   ├── api/                       # NestJS REST backend server
│   │   ├── src/
│   │   │   ├── main.ts            # Bootstrap entry point
│   │   │   ├── app.module.ts      # Root NestJS module
│   │   │   ├── config/            # Environment and configuration
│   │   │   │   ├── config.module.ts
│   │   │   │   └── env.ts         # Zod env loader
│   │   │   ├── db/                # Database module (Drizzle DI setup)
│   │   │   │   └── db.module.ts
│   │   │   ├── festival/          # Festival module (tenant root)
│   │   │   │   ├── festival.module.ts
│   │   │   │   ├── festival.controller.ts
│   │   │   │   └── festival.service.ts
│   │   │   └── health/            # Health check (liveness probe)
│   │   │       └── health.controller.ts
│   │   ├── dist/                  # Compiled output (NestJS build)
│   │   ├── tsconfig.json          # App TypeScript config (extends base)
│   │   ├── tsconfig.build.json    # Build-only config
│   │   ├── nest-cli.json          # NestJS CLI config
│   │   ├── package.json           # App dependencies
│   │   └── node_modules/          # Local deps (pnpm)
│   │
│   ├── mobile/                    # React Native + Expo [PLANNED]
│   └── admin/                     # Next.js 15 admin web [PLANNED]
│
├── packages/                      # Shared monorepo packages
│   ├── contracts/                 # REST API contracts (ts-rest + Zod)
│   │   ├── src/
│   │   │   ├── index.ts           # Main export
│   │   │   ├── router.ts          # API endpoint definitions (single source of truth)
│   │   │   ├── schemas.ts         # Zod validation schemas (Festival, Tag, etc.)
│   │   │   └── locale.ts          # Locale types, DEFAULT_LOCALE, LocalizedText
│   │   ├── dist/                  # Compiled output (ESM + CJS)
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts         # Bundler config
│   │   ├── package.json
│   │   └── node_modules/
│   │
│   ├── db/                        # Database schema + Drizzle ORM client
│   │   ├── src/
│   │   │   ├── index.ts           # Main export (client factory, types)
│   │   │   ├── client.ts          # Drizzle client factory (createDatabase)
│   │   │   └── schema/            # Drizzle schema definitions
│   │   │       ├── index.ts       # Schema exports
│   │   │       ├── _shared.ts     # Shared column builders (idColumn, timestamps)
│   │   │       ├── locale.ts      # Locale enum (SUPPORTED_LOCALES)
│   │   │       ├── festival.ts    # Festival table (tenant root) + festival_locale
│   │   │       └── tag.ts         # Tag entity + tag_translation table
│   │   ├── drizzle/               # Database migrations (auto-generated)
│   │   │   └── meta/              # Migration metadata
│   │   ├── dist/                  # Compiled output
│   │   ├── drizzle.config.ts      # Drizzle Kit configuration
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── package.json           # DB scripts: db:generate, db:migrate, db:push, db:studio
│   │   └── node_modules/
│   │
│   ├── i18n/                      # i18n configuration + locale resolution
│   │   ├── src/
│   │   │   ├── index.ts           # Main export
│   │   │   ├── locales.ts         # Locale labels, isSupportedLocale helper
│   │   │   ├── resolve.ts         # resolveUiLocale function
│   │   │   └── i18n.ts            # Lingui integration [future: catalogs]
│   │   ├── dist/
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── package.json
│   │   └── node_modules/
│   │
│   ├── ui/                        # Design tokens + component primitives
│   │   ├── src/
│   │   │   └── index.ts           # Placeholder (future: token exports)
│   │   ├── dist/
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── package.json
│   │   └── node_modules/
│   │
│   └── config/                    # Shared build config (ESLint, TypeScript)
│       ├── tsconfig.base.json     # Base TypeScript config (strict mode)
│       ├── package.json           # Config-only package
│       └── node_modules/
│
├── docs/                          # Documentation
│   ├── DEVELOPMENT_DECISIONS.md   # ADRs (architectural decisions log)
│   └── concept/                   # Design docs, UX flows [future]
│
├── .planning/
│   └── codebase/                  # Generated codebase analysis docs
│       ├── ARCHITECTURE.md
│       └── STRUCTURE.md           # ← You are here
│
├── .claude/                       # Claude Code settings + skills
│   └── settings.json
│
├── .git/                          # Git repo
├── .gitignore
├── .mcp.json                      # MCP server configuration
├── .npmrc                         # pnpm config
├── CLAUDE.md                      # Project guidance for Claude Code
├── README.md                      # Project overview
├── package.json                   # Root workspace manifest
├── pnpm-workspace.yaml            # Workspace config (apps/*, packages/*)
├── pnpm-lock.yaml                 # Lock file (commit to repo)
├── turbo.json                     # Turborepo task configuration
├── prettier.config.mjs            # Code formatter config
└── node_modules/                  # Root node_modules (pnpm)
```

## Directory Purposes

**apps/api:**
- Purpose: NestJS REST backend server (ADR-002)
- Contains: Controllers, services, modules, bootstrap logic
- Key files: `src/main.ts` (entry), `src/app.module.ts` (root module), `src/festival/` (first domain module)
- Output: Runs on port 8081 (or PORT env var)
- Dev mode: `pnpm --filter api dev` (NestJS watch via CLI)

**packages/contracts:**
- Purpose: Defines API shape once (ADR-006); single source of truth for endpoint definitions and Zod validation schemas
- Contains: ts-rest router definition, request/response schemas, type exports
- Key files: `src/router.ts` (endpoints), `src/schemas.ts` (Zod types), `src/locale.ts` (locale enum + LocalizedText)
- Output: Bundled ESM + CJS for consumption by API (implements), mobile/admin (derive clients)
- Consumed by: `@festipal/api`, `@festipal/admin`, `@festipal/mobile` via workspace:*
- No implementation here; pure specification

**packages/db:**
- Purpose: Database schema, migrations, and Drizzle client factory (ADR-005, ADR-012)
- Contains: Drizzle schema files, migration metadata, client setup
- Key files: `src/client.ts` (createDatabase factory), `src/schema/*.ts` (table definitions)
- Pattern: Every tenant-scoped table includes `festivalId: uuid FK → festival.id`
- Migrations: Auto-generated by `pnpm --filter db db:generate`; apply with `db:migrate` or `db:push` (Neon)
- Version Constraint: Uses zod@3 (ts-rest 3.52 peer requirement; upgrade when ts-rest v4 ships)

**packages/i18n:**
- Purpose: Locale constants, locale detection, LocalizedText resolution helpers (ADR-012)
- Contains: SUPPORTED_LOCALES, DEFAULT_LOCALE, resolveUiLocale, LOCALE_LABELS
- Key files: `src/locales.ts`, `src/resolve.ts`
- Future: Lingui catalogs (when design phase provides UI strings)
- Version constraint: Must stay synchronized with `packages/contracts/src/locale.ts` (same SUPPORTED_LOCALES)

**packages/ui:**
- Purpose: Design tokens and component primitives (ADR-015)
- Status: Placeholder only (no tokens/components yet)
- Future: Token exports + React Native components, shared by mobile + admin

**packages/config:**
- Purpose: Shared ESLint + TypeScript configuration for all apps/packages
- Contains: `tsconfig.base.json` (strict mode, ES2023, path aliases)
- Used by: Every package extends `tsconfig.base.json` in its own `tsconfig.json`

**docs/:**
- Purpose: Decision logs, design documents, architecture rationale
- Key file: `DEVELOPMENT_DECISIONS.md` (ADRs 001–015 with decision rationale and consequences)
- Read before: Making architectural changes

## Key File Locations

**Entry Points:**
- `apps/api/src/main.ts` — Bootstrap NestJS app, start server on port 8081

**Configuration:**
- `turbo.json` — Monorepo task graph (build, dev, lint, typecheck, test)
- `pnpm-workspace.yaml` — Workspace definition (apps/*, packages/*)
- `tsconfig.base.json` — Shared TypeScript config (strict: true, ES2023)
- `prettier.config.mjs` — Code formatter rules
- `.npmrc` — pnpm-specific options
- `CLAUDE.md` — Claude Code project instructions

**Core Logic:**
- `packages/contracts/src/router.ts` — API endpoint definitions (single source of truth)
- `apps/api/src/festival/festival.service.ts` — Festival queries + locale resolution
- `packages/db/src/schema/festival.ts` — Festival table (tenant root)

**Testing/Linting:**
- Tests not yet scaffolded; will be added per framework
- ESLint config via `packages/config`

## Naming Conventions

**Files:**
- `.ts` — TypeScript source
- `.module.ts` — NestJS modules (e.g., `festival.module.ts`)
- `.controller.ts` — NestJS HTTP handlers
- `.service.ts` — NestJS business logic
- `*.schema.ts` — Data validation schemas (e.g., `packages/contracts/src/schemas.ts`)
- `tsconfig*.json` — TypeScript config files

**Directories:**
- `src/` — Source code (all packages and apps)
- `dist/` — Compiled output (built via tsup or NestJS CLI)
- `drizzle/` — Database migrations (generated, do not edit manually)
- `[domain]/` — NestJS modules grouped by domain (e.g., `festival/`, future: `vendor/`, `act/`)

**Identifiers:**
- Package names: `@festipal/{package}` (e.g., `@festipal/api`, `@festipal/db`)
- App names: `apps/{name}` (e.g., `apps/api`, `apps/mobile`, `apps/admin`)
- Exports: `export const contract`, `export type Festival`, `export function resolveLocalized`

**Table Names (Drizzle schema):**
- Snake_case in database (`festival`, `festival_locale`, `tag_translation`)
- `casing: 'snake_case'` in Drizzle config (`packages/db/src/client.ts`), so Drizzle auto-converts camelCase field names

## Where to Add New Code

### New API Endpoint

1. **Define contract** in `packages/contracts/src/router.ts`:
   ```typescript
   newEndpoint: {
     method: 'GET',
     path: '/festivals/:festivalId/endpoint',
     pathParams: z.object({ festivalId: z.string().uuid() }),
     responses: { 200: newSchema, /* 400, 404, etc */ },
   }
   ```

2. **Add Zod schema** in `packages/contracts/src/schemas.ts`:
   ```typescript
   export const newSchema = z.object({ /* fields */ });
   export type New = z.infer<typeof newSchema>;
   ```

3. **Implement in API controller** in `apps/api/src/[domain]/[domain].controller.ts`:
   ```typescript
   @TsRestHandler(contract.newEndpoint)
   newEndpoint() {
     return tsRestHandler(contract.newEndpoint, async ({ params, query }) => {
       const result = await this.service.newMethod(params.festivalId);
       return { status: 200, body: result };
     });
   }
   ```

4. **Implement in API service** in `apps/api/src/[domain]/[domain].service.ts`:
   ```typescript
   async newMethod(festivalId: string): Promise<New> {
     const rows = await this.db
       .select()
       .from(newTable)
       .where(eq(newTable.festivalId, festivalId));
     return rows.map(r => ({ /* transform */ }));
   }
   ```

5. **Add database schema** (if needed) in `packages/db/src/schema/[entity].ts`:
   ```typescript
   export const newTable = pgTable('new_table', {
     id: idColumn(),
     festivalId: uuid().notNull().references(() => festival.id),
     // ... fields
     ...timestamps,
   });
   ```

6. **Generate migration** (after schema change):
   ```bash
   pnpm --filter db db:generate
   pnpm --filter db db:migrate  # or pnpm --filter db db:push (Neon)
   ```

### New NestJS Module

1. **Create module directory** under `apps/api/src/[domain]/`:
   ```bash
   mkdir apps/api/src/newdomain
   ```

2. **Create `.module.ts`**:
   ```typescript
   import { Module } from '@nestjs/common';
   import { NewController } from './new.controller';
   import { NewService } from './new.service';

   @Module({
     controllers: [NewController],
     providers: [NewService],
   })
   export class NewModule {}
   ```

3. **Register in AppModule** (`apps/api/src/app.module.ts`):
   ```typescript
   @Module({
     imports: [ConfigModule, DbModule, FestivalModule, NewModule],
   })
   ```

### New Shared Type/Utility

1. **Create in appropriate package** (e.g., `packages/i18n`, `packages/contracts`):
   - If it's a type used by both API and clients → `packages/contracts`
   - If it's locale-specific → `packages/i18n`
   - If it's a design token → `packages/ui`

2. **Export from package's `src/index.ts`**:
   ```typescript
   export { myFunction } from './myFunction';
   export type { MyType } from './types';
   ```

3. **Build and depend on it** via workspace:* in consuming app's package.json:
   ```json
   "dependencies": { "@festipal/contracts": "workspace:*" }
   ```

### New Database Table

1. **Create schema file** in `packages/db/src/schema/[entity].ts`:
   ```typescript
   import { pgTable, uuid, text } from 'drizzle-orm/pg-core';
   import { idColumn, timestamps } from './_shared';
   import { festival } from './festival';

   export const myEntity = pgTable('my_entity', {
     id: idColumn(),
     festivalId: uuid().notNull().references(() => festival.id, { onDelete: 'cascade' }),
     name: text().notNull(),
     ...timestamps,
   });
   ```

2. **Export from schema index** in `packages/db/src/schema/index.ts`:
   ```typescript
   export * from './my-entity';
   ```

3. **Generate migration**:
   ```bash
   pnpm --filter db db:generate
   ```

4. **Review and apply**:
   ```bash
   pnpm --filter db db:push  # Neon
   # or
   pnpm --filter db db:migrate  # Local Postgres
   ```

5. **Use in service** (e.g., `apps/api/src/myfeature/myfeature.service.ts`):
   ```typescript
   import { myEntity } from '@festipal/db';

   async getEntity(festivalId: string) {
     return this.db
       .select()
       .from(myEntity)
       .where(eq(myEntity.festivalId, festivalId));
   }
   ```

## Special Directories

**dist/ (Compiled Output):**
- Generated: Yes
- Committed: No (in .gitignore)
- Purpose: Compiled TypeScript output from tsup or NestJS CLI
- Per-package: Each app/package builds to its own `dist/` directory
- Cleanup: `pnpm clean` or `rm -rf dist/` in each package

**drizzle/ (Database Migrations):**
- Generated: Yes (by `pnpm --filter db db:generate`)
- Committed: Yes (migrations are part of schema history)
- Purpose: SQL migration files (auto-generated from schema changes)
- Manual editing: Never edit migration files; always regenerate from schema
- Application: Via `db:migrate` (local) or `db:push` (Neon)

**node_modules/ (Dependencies):**
- Generated: Yes (by pnpm install)
- Committed: No (in .gitignore)
- Purpose: Installed packages for each workspace member
- Pnpm specific: Uses hardlinks from `.pnpm` cache for disk efficiency

**.turbo/ (Build Cache):**
- Generated: Yes (by Turbo during build/dev)
- Committed: No (in .gitignore)
- Purpose: Incremental build cache (speeds up rebuilds)
- Invalidation: Turbo auto-invalidates on file changes

---

*Structure analysis: 2026-07-29*
