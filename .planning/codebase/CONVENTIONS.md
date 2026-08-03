---
last_mapped_commit: 8f64c0de99ee77e01a818edd005386ede4310b30
last_mapped_at: 2026-08-02T17:17:40Z
---
# Coding Conventions

**Analysis Date:** 2026-08-02

## Naming Patterns

**Files:**

- TypeScript source: `.ts` (Node/backend) or `.tsx` (React components)
- NestJS suffix convention: `.module.ts`, `.service.ts`, `.controller.ts`
- Example: `festival.service.ts`, `festival.controller.ts`, `festival.module.ts`
- Configuration files: `.mjs` for ESLint/Prettier configs (ES modules)

**Functions:**

- camelCase, descriptive names without abbreviations
- Pattern: `get*` for single item queries, `list*` for collections, `load*` for initialization
- Examples: `resolveLocalized()`, `loadEnv()`, `createDatabase()`, `signInWithOtp()`
- Async functions return `Promise<T>`: `async getBySlug(): Promise<Festival | null>`

**Variables:**

- camelCase throughout
- Descriptive, no single letters except loop counters
- Examples: `festivalId`, `accountId`, `visitorId`, `accountId`, `displayName`
- Prefix conventions: `is*` for booleans, `*Id` for IDs, `*Url` for URLs

**Types and Interfaces:**

- PascalCase for all types, interfaces, classes
- Examples: `Festival`, `Database`, `Locale`, `VisitorProfilePublic`, `CompleteProfileBody`
- Type inference from Zod: `export type Festival = z.infer<typeof festivalSchema>`
- Always use `type` imports: `import type { Festival } from '@festipal/contracts'`

**Database Columns:**

- snake_case in Postgres, enforced via Drizzle's `casing: 'snake_case'` option
- Examples: `festival_id`, `created_at`, `display_name`, `visitor_profile`
- Foreign keys: `{entity}Id` in JavaScript, `{entity}_id` in SQL

**Constants:**

- SCREAMING_SNAKE_CASE for module-level constants
- Examples: `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `CAPTURE_FILE`, `ORIGIN`

**Enum Values:**

- SCREAMING_SNAKE_CASE: `EVERYONE`, `FRIENDS` (for `socials_visibility`)

**Discriminated Unions:**

- Use `status` field for different result shapes in service returns
- Pattern: `{ status: 'ok' | 'conflict' | 'not-found' | 'profile-required', ... }`
- Controllers map these to HTTP status codes (200, 409, 404)

## Code Style

**Formatting:**

- Tool: Prettier 3.9.6
- Semi: `true` (require semicolons)
- Single Quotes: `true`
- Trailing Comma: `'all'` (trailing commas in multiline constructs)
- Print Width: `100` (line length limit)
- Tab Width: `2` (indentation)
- Config location: `packages/config/prettier.config.mjs` (re-exported from root)

**Linting:**

- Tool: ESLint 10.8.0 + typescript-eslint
- Config Format: Flat config (ESLint v9+)
- Base config: `packages/config/eslint.config.base.mjs`
- Per-app overrides: `apps/api/eslint.config.mjs`, etc.

**Key Rules Enforced:**

- `@typescript-eslint/consistent-type-imports: error` — Type imports must use `import type`
- `@typescript-eslint/no-explicit-any: warn` — Discourage `any`, warn instead of error
- `@typescript-eslint/no-unused-vars: error` — With `argsIgnorePattern: '^_'` (allow unused `_` params)
- Ignores: `dist/`, `build/`, `.next/`, `.expo/`, `node_modules/`, `*.config.*`

## Import Organization

**Order:**

1. Standard library imports (e.g., `node:crypto`, `node:fs/promises`)
2. Third-party packages (e.g., `@nestjs/common`, `drizzle-orm`)
3. Workspace packages (e.g., `@festipal/db`, `@festipal/contracts`)
4. Relative imports (e.g., `./service`, `../db/db.module`)

**Path Aliases:**

- No path aliases configured in TypeScript
- Workspace packages prefixed with `@festipal/`: `@festipal/api`, `@festipal/db`, `@festipal/contracts`, `@festipal/config`, `@festipal/i18n`
- Use workspace names in all cross-package imports
- Relative paths only for files within the same package

**Type Imports:**

- Always use `import type` for types, interfaces, and type-only unions
- Example: `import type { Festival, Locale } from '@festipal/contracts'`
- Exception: NestJS DI requires runtime class references (see `apps/api/eslint.config.mjs`)

## Error Handling

**Validation:**

- Zod schemas in `packages/contracts/src/` are the source of truth
- Use `safeParse()` for runtime validation: `const parsed = schema.safeParse(data)`
- Invalid input → return typed result with `{ success: false, error }`
- Controllers receive already-validated data via `tsRestHandler`

**Database Errors:**

- PostgresError checking via the `.cause` pattern (drizzle-orm wraps driver errors)
- Pattern: `const cause = (err as { cause?: unknown }).cause; if (cause instanceof PostgresError && cause.code === '23505') { ... }`
- Postgres error codes referenced in comments (e.g., 23505 = unique constraint, 23503 = foreign key)
- Services catch specific errors and return discriminated union results; unknown errors re-thrown

**Not Found:**

- Services return `null` for "resource not found" cases (not empty object or undefined)
- Example: `async getBySlug(slug: string): Promise<Festival | null>`
- Controllers map `null` to 404 responses

**Cross-Tenant Errors:**

- Multi-tenant queries filter by `festivalId` at the WHERE clause layer
- Never expose cross-tenant data; fail with 404 if caller lacks access
- Session-derived IDs (`visitorId`, `accountId`) are the source of truth; never accept from request params

## Logging

**Framework:** `console` methods (console.log, console.error)

**Patterns:**

- Startup info: `console.log('festipal api listening on http://localhost:${env.PORT}')`
- Errors: `console.error('Invalid environment:', parsed.error.flatten().fieldErrors)`
- No structured logging enforced yet; plain console output acceptable
- Avoid logging in libraries; let callers decide

## Comments

**When to Comment:**

- Non-obvious business logic and architectural decisions
- References to ADRs (Architecture Decision Records): `// ADR-014: Gate-less save...`
- Cross-cutting concerns and security implications: `// SEC-01: ...`
- Complex locale resolution and tenant scoping logic
- Known pitfalls and why a certain pattern was chosen: `// Pitfall 11: ...`

**JSDoc/TSDoc:**

- Mandatory for exported functions in shared packages (`packages/contracts`)
- Recommended for public NestJS services and controllers
- Include purpose, parameters (via JSDoc `@param`), return type, and any side effects
- Example:
  ```typescript
  /**

   * Resolve localized content to one string: requested → festival default → any present.
   * Falls back through priorities if exact match not found.
   */
  export function resolveLocalized(
    text: LocalizedText,
    requested: Locale,
    festivalDefault: Locale,
  ): string {
    ...
  }
  ```

**Avoid:**

- Stating the obvious (e.g., "increments counter" for `counter++`)
- Repeating code; let code be self-documenting
- Outdated comments that drift from implementation

## Function Design

**Size:**

- Prefer small, focused functions (examples: 1–8 lines common)
- Functions over 30 lines should be refactored into smaller units
- Readability over one-liners

**Parameters:**

- Max 3–4 parameters before converting to an object
- Required before optional; use destructuring for objects
- Prefer typed objects over multiple scalars: `params: { slug: string }` not `slug: string, other: string`

**Return Values:**

- Explicit return types on all public functions: `Promise<Festival | null>`, not `Promise<any>`
- Nullable for "not found": return `null` not empty object
- Never return `undefined` from functions; use `null` for nullable returns or throw for errors
- Discriminated unions for multiple possible outcomes: `{ status: 'ok' | 'conflict' } & { ... }`

**Async:**

- Always annotate async functions: `async function name(): Promise<T>`
- Use `void` for fire-and-forget fire-and-forget: `void someAsyncWork()`

## Module Design

**Exports:**

- Named exports only (no default exports except for ESLint/Prettier configs)
- Barrel files (`index.ts`) re-export from sibling modules for cleaner imports
- Example:
  ```typescript
  // packages/contracts/src/index.ts
  export { contract } from './router';
  export type { Festival, Tag, Locale } from './schemas';
  ```

**NestJS Modules:**

- `@Module({ imports: [...], controllers: [...], providers: [...] })`
- Controllers handle HTTP routing (decorators: `@Controller()`, `@TsRestHandler()`)
- Services handle business logic (decorated with `@Injectable()`)
- Modules manage dependencies and import other modules
- Constructor injection via decorators: `constructor(@Inject(TOKEN) private readonly dep: Type) {}`
- Global modules: `@Module({ global: true })` for singletons like `DbModule`

**Dependency Injection:**

- Always use constructor injection with `@Inject(token)`
- Token name in decorator matches provider registration name in module
- Example: `DbModule` provides token `DB`, services inject via `@Inject(DB)`

**Drizzle:**

- Schema files define tables and relations
- Shared schema builders: `idColumn()`, `timestamps` from `_shared.ts`
- Zod schema generation: `createInsertSchema()`, `createSelectSchema()` for DB-to-validation consistency
- Type inference: `export type Festival = z.infer<typeof festivalSchema>`

## TypeScript-Specific

**Strictness:**

- `strict: true` enforced project-wide via `packages/config/tsconfig.base.json`
- `noUncheckedIndexedAccess: true` — prevents undefined access on arrays
- `noImplicitOverride: true` — requires explicit `override` on inherited methods
- No `any` at public API boundaries; use `unknown` and narrow if needed

**Type Safety:**

- Zod schemas in `packages/contracts` are the runtime source of truth
- Leverage `z.infer<typeof schema>` for compile-time types
- Explicit type annotations on public function signatures
- Discriminated unions for multi-branch logic

**Generics:**

- Use sparingly; prefer concrete types when possible
- Generic constraint example: `T extends { id: string }`

## Monorepo (Turborepo + pnpm)

**Package Structure:**

- Workspace packages in `packages/*`, prefixed `@festipal/`
- Apps in `apps/*` (api, mobile, admin)
- Internal dependencies via `workspace:*` protocol in `package.json`

**Config Inheritance:**

- Base ESLint: `packages/config/eslint.config.base.mjs` (all packages extend)
- Base TypeScript: `packages/config/tsconfig.base.json` (all packages extend)
- Base Prettier: `packages/config/prettier.config.mjs` (root re-exports)
- Per-app overrides allowed; lint/typecheck must pass on all packages

**Build Outputs:**

- Compiled JS in `dist/` (gitignored)
- Type declarations (`.d.ts`) generated if `declaration: true` in tsconfig
- Tsup for library builds (packages); NestJS CLI for `apps/api`

## Validation & Schemas

**Single Source of Truth:**

- `packages/contracts/src/` owns all REST endpoint definitions + Zod schemas
- Used for:
  1. Request/response validation (runtime)
  2. Type generation for backend and clients (compile-time)
  3. API documentation (ts-rest introspection)

**Never Re-declare:**

- Don't hand-write TypeScript interfaces for data that has a Zod schema
- Infer types from schemas: `export type Festival = z.infer<typeof festivalSchema>`
- Compose schemas from drizzle-zod base to prevent schema/DB drift

**Drift Detection:**

- Schemas composed on drizzle-zod base (not hand-mirrored)
- Example: `visitorProfilePublicSchema` uses `.pick()` on drizzle-zod's generated schema
- Renaming a DB column breaks the schema typecheck (good!)

---

*Convention analysis: 2026-08-02*
