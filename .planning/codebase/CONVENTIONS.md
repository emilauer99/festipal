# Coding Conventions

**Analysis Date:** 2026-07-29

## Naming Patterns

**Files:**
- Lowercase with hyphens for directories: `festival`, `db`, `config`
- TypeScript files: `.ts` (Node/backend) or `.tsx` (React components)
- Suffix patterns for NestJS: `.module.ts`, `.service.ts`, `.controller.ts`
- Example: `festival.controller.ts`, `festival.service.ts`, `festival.module.ts`

**Functions:**
- camelCase, descriptive, no abbreviations: `loadEnv()`, `resolveLocalized()`, `getBySlug()`
- Async functions return `Promise<T>`: `async getBySlug(): Promise<Festival | null>`
- Prefix conventions: `get*` for queries, `list*` for collections, `load*` for initialization

**Variables:**
- camelCase throughout: `festivalId`, `defaultLocale`, `supportedLocales`
- Use const by default; let rarely needed
- Destructuring preferred: `const { id, slug, name } = festival`

**Types:**
- PascalCase for types, interfaces, classes: `Festival`, `Locale`, `LocalizedText`, `Tag`
- Schema types inferred from Zod: `export type Festival = z.infer<typeof festivalSchema>`
- Type imports explicit: `import type { Festival } from '@festipal/contracts'`
- Enum members SCREAMING_SNAKE_CASE: `SUPPORTED_LOCALES = ['de', 'en']`, `DEFAULT_LOCALE = 'en'`

## Code Style

**Formatting:**
- Tool: Prettier 3.9.6
- Semi: true
- Single quotes: true
- Trailing comma: 'all'
- Print width: 100
- Tab width: 2
- Config location: `prettier.config.mjs` (root) → re-exports from `packages/config/prettier.config.mjs`

**Linting:**
- Tool: ESLint 10.8.0 + typescript-eslint
- Flat config format: `eslint.config.mjs`
- Shared base: `packages/config/eslint.config.base.mjs`
- Key rules enforced:
  - `@typescript-eslint/consistent-type-imports: error` — types must use `import type`
  - `@typescript-eslint/no-explicit-any: warn` — discouraged at boundaries
  - `@typescript-eslint/no-unused-vars: error` with `argsIgnorePattern: ^_` (unused params prefixed with `_`)
  - `@typescript-eslint/noUncheckedIndexedAccess: true` (tsconfig)
  - `@typescript-eslint/noImplicitOverride: true` (tsconfig)
  - `@typescript-eslint/noFallthroughCasesInSwitch: true` (tsconfig)

**Example lint configuration location:** `apps/api/eslint.config.mjs`, `packages/contracts/eslint.config.mjs`

## Import Organization

**Order:**
1. Side effects: `import 'reflect-metadata'`, `import 'dotenv/config'`
2. Node.js built-ins (rare in app code)
3. Third-party packages: `import { Module } from '@nestjs/common'`, `import { eq } from 'drizzle-orm'`
4. Workspace packages: `import { festival } from '@festipal/db'`, `import { contract } from '@festipal/contracts'`
5. Type imports from same: `import type { Database } from '@festipal/db'`
6. Local relative imports: `import { DB } from '../db/db.module'`

**Path aliases:**
- No path aliases configured currently in monorepo
- Use workspace package names: `@festipal/contracts`, `@festipal/db`, `@festipal/config`
- Within a package, use relative paths: `./locale`, `../db/db.module`

## Error Handling

**Patterns:**
- Zod schema validation with safeParse:
  ```typescript
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
  ```
- Nullable returns for "not found" cases: `Promise<Festival | null>`
- ts-rest handler returns tuple: `{ status: 404, body: { message: 'Festival not found' } }`
- NestJS Guard/Interceptor pattern for cross-cutting concerns (planned, not yet in scaffold)

## Logging

**Framework:** console (no dedicated logger in initial scaffold)

**Patterns:**
- Use `console.error()` for errors: `console.error('Invalid environment:', ...)`
- Use `console.log()` for startup info: `console.log('festipal api listening on...')`
- Avoid logging in libraries; let callers decide
- Structured logging (e.g., bunyan, pino) planned for production API, not yet enforced

## Comments

**When to Comment:**
- Non-obvious business logic (e.g., locale resolution fallback chain)
- Cross-cutting concerns (e.g., tenant scoping, ADR references)
- External contract/API expectations
- Avoid stating the obvious; let code be self-documenting

**JSDoc/TSDoc:**
- Use for public API functions and types:
  ```typescript
  /**
   * Resolve localized content to one string: requested → festival default → any present.
   */
  export function resolveLocalized(
    text: LocalizedText,
    requested: Locale,
    festivalDefault: Locale,
  ): string
  ```
- Mandatory for exported functions in `packages/contracts`
- Not required for private/internal functions unless complex

**ADR References:**
- When code encodes an architectural decision, cite it: `// ADR-011: Cashless via embedded URL`
- Links to `docs/DEVELOPMENT_DECISIONS.md` in comments where appropriate

## Function Design

**Size:** Aim for <40 lines; break multi-step logic into separate functions
- Example: `loadEnv()` is 8 lines; `resolveLocalized()` is 1 line
- Example: `getBySlug()` is 6 lines (database + response transform)

**Parameters:**
- Prefer typed objects over multiple scalars: `params: { slug: string }` not `slug: string, other: string`
- Required before optional; use destructuring
- Max 3-4 parameters before considering an object

**Return Values:**
- Explicit return types: `Promise<Festival | null>`, not `Promise<any>`
- Nullable for "not found": return `null` not empty object
- Never return undefined from functions; use null or throw
- Use discriminated unions for status/body patterns (ts-rest style)

## Module Design

**Exports:**
- Explicit: use named exports, not default exports
- Barrel files (index.ts) re-export from sibling modules:
  ```typescript
  // packages/contracts/src/index.ts
  export * from './locale';
  export * from './schemas';
  export * from './router';
  ```
- Private/internal: use file-scoped (not exported) for internal helpers

**NestJS Module Structure:**
```typescript
@Module({
  imports: [ConfigModule, DbModule],
  controllers: [HealthController],
})
export class AppModule {}
```
- Controllers handle HTTP routing (decorators: `@TsRestHandler`)
- Services handle business logic (decorated with `@Injectable()`)
- Modules manage dependencies and cross-cutting concerns

**Dependency Injection (NestJS):**
```typescript
@Injectable()
export class FestivalService {
  constructor(@Inject(DB) private readonly db: Database) {}
}
```
- Constructor injection via decorators
- Token name in `@Inject()` matches provider registration in module

## TypeScript-Specific

**Strict Mode:**
- Enforced project-wide via `tsconfig.base.json`
- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`
- No `any` at public API boundaries; use `unknown` and narrow if needed

**Type Inference:**
- Leverage Zod's `z.infer<typeof schema>` for runtime validation + types:
  ```typescript
  export const festivalSchema = z.object({ ... });
  export type Festival = z.infer<typeof festivalSchema>;
  ```
- Let TypeScript infer where obvious; annotate public signatures

**Generics:**
- Use sparingly; prefer concrete types when possible
- Example: `Promise<Festival | null>` not `Promise<T | null>` with `T = Festival`

## Monorepo (Turborepo + pnpm)

**Workspace packages:**
- Located in `apps/*` and `packages/*`
- Prefixed with `@festipal/`: `@festipal/api`, `@festipal/contracts`, `@festipal/db`
- Internal dependencies via `workspace:*` protocol in package.json

**Shared configuration:**
- ESLint base: `packages/config/eslint.config.base.mjs`
- TypeScript base: `packages/config/tsconfig.base.json`
- Prettier: `packages/config/prettier.config.mjs` (re-exported from root)
- Extend, don't override; lint/typecheck must pass on all packages

**Build outputs:**
- Compiled JS in `dist/` (gitignored)
- Type declarations (`.d.ts`) generated if `declaration: true` in tsconfig
- tsup for library builds (packages)
- nest build for NestJS (apps/api)

## Validation & Schemas

**Zod schema pattern:**
- Single source of truth in `packages/contracts`
- Used for:
  - API request/response types (rest router definitions)
  - Environment variable validation (config/env.ts)
  - Runtime validation + type extraction
- Never re-declare shapes; import and infer types from schemas

**Example pattern:**
```typescript
// packages/contracts/src/schemas.ts
export const festivalSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  ...
});
export type Festival = z.infer<typeof festivalSchema>;

// apps/api/src/festival/festival.service.ts
import type { Festival } from '@festipal/contracts';
async getBySlug(slug: string): Promise<Festival | null> { ... }
```

---

*Conventions audit: 2026-07-29*
