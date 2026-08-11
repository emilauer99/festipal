# Phase 1: Identity Schema & Auth Foundation - Pattern Map

**Mapped:** 2026-07-30
**Files analyzed:** 7 (3 new schema files, 1 barrel edit, 1 config edit, 1 contracts file edit, 1 package.json edit)
**Analogs found:** 5 / 7 (2 are config/manifest edits with no code "analog" per se, documented as edit-patterns instead)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `packages/db/src/schema/auth.ts` | model (vendored/generated) | CRUD | `packages/db/src/schema/festival.ts` (for internal style baseline only — real shape comes from CLI, not hand-authored) | partial (provenance is external, but file must still match project conventions where the CLI leaves room, e.g. comment header, export style) |
| `packages/db/src/schema/visitor-profile.ts` | model | CRUD | `packages/db/src/schema/tag.ts` (composite-key/FK/unique pattern) + `packages/db/src/schema/festival.ts` (single-table-with-enum pattern) | role-match (tag.ts is the best FK+unique template; festival.ts is the best "one table, several typed columns + timestamps" template) |
| `packages/db/src/schema/my-festival.ts` | model | CRUD | `packages/db/src/schema/tag.ts` (specifically `tagTranslation`, a composite-PK join table keyed by two FKs) | exact — `tagTranslation`'s `primaryKey({ columns: [...] })` composite-key shape is structurally identical to `my_festival`'s `(visitorId, festivalId)` |
| `packages/db/src/schema/index.ts` (barrel edit) | config | request-response (barrel export, not really a flow) | itself, `packages/db/src/schema/index.ts` (current 3-line barrel) | exact — literally the same file, just append 3 `export *` lines |
| `packages/db/drizzle.config.ts` | config | batch (migration generation) | itself (no change expected — verify only) | exact — no analog needed, already correct for new tables (schema path is `./src/schema/index.ts`, casing already `snake_case`) |
| `packages/contracts/src/schemas.ts` (later, Phase 2 — noted for awareness only) | service/utility (Zod schema module) | transform | itself, `packages/contracts/src/schemas.ts` (current hand-written `festivalSchema`/`tagSchema`) | exact — same file, D-02 changes *how* shapes are declared (import + compose from `@festipal/db` bases) not the file's role |
| `packages/db/package.json` (dependency edit) | config | — | `packages/contracts/package.json` (for the "add a workspace/npm dependency" edit shape) | role-match |

## Pattern Assignments

### `packages/db/src/schema/visitor-profile.ts` (model, CRUD)

**Analogs:** `packages/db/src/schema/tag.ts` (FK + unique-index template), `packages/db/src/schema/festival.ts` (enum + timestamps template), `packages/db/src/schema/locale.ts` (pgEnum precedent)

**Imports pattern** (from `tag.ts` lines 1-5):
```typescript
import { pgTable, primaryKey, text, unique, uuid } from 'drizzle-orm/pg-core';

import { idColumn, timestamps } from './_shared';
import { festival } from './festival';
import { localeEnum } from './locale';
```
For `visitor-profile.ts`, adapt to: import `pgTable`, `text`, `uniqueIndex`, `jsonb`, `pgEnum` from `drizzle-orm/pg-core`; `sql`/`SQL`/`AnyPgColumn` type from `drizzle-orm` for the `lower()` helper (per RESEARCH.md Pattern 2); `timestamps` from `./_shared` (do NOT use `idColumn()` — PK here is the FK-typed `accountId`, not a fresh uuid); import `user` from `./auth` for the FK target.

**Enum precedent** (from `locale.ts` lines 1,13):
```typescript
import { pgEnum } from 'drizzle-orm/pg-core';
...
export const localeEnum = pgEnum('locale', SUPPORTED_LOCALES);
```
Mirror this exact shape for the new `socialsVisibility` enum: `export const socialsVisibilityEnum = pgEnum('socials_visibility', ['everyone', 'friends'] as const);` — same file-scoped-const, single-purpose-file convention as `locale.ts`.

**Core table pattern — single table, notNull columns + timestamps** (from `festival.ts` lines 11-18):
```typescript
export const festival = pgTable('festival', {
  id: idColumn(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  defaultLocale: localeEnum().notNull().default('de'),
  cashlessUrl: text(),
  ...timestamps,
});
```
Note the terse Drizzle v0.45 column syntax used project-wide: `text()` not `text('slug')` (relying on `casing: 'snake_case'` global config to map `slug` → `slug`, `defaultLocale` → `default_locale`, etc. automatically — confirmed by `drizzle.config.ts` line 11). **Apply the same terse style to `visitor-profile.ts`** — do not hand-specify snake_case column-name strings; the project's casing convention derives them automatically.

**Doc-comment convention** (from `festival.ts` lines 6-10, `tag.ts` lines 7-11):
```typescript
/**
 * Tenant root. Every tenant-scoped table references festival.id.
 * `defaultLocale` is the mandatory fallback for content translations (ADR-012).
 * `cashlessUrl` is the optional embedded cashless page (ADR-011).
 */
```
Every table in this codebase gets a JSDoc block above it citing the relevant ADR/decision. For `visitor_profile`, cite ADR-016 (identity model) and D-03/D-04 (CONTEXT.md) for the reserved-field rationale.

**FK-with-cascade pattern** (from `tag.ts` lines 17-19):
```typescript
festivalId: uuid()
  .notNull()
  .references(() => festival.id, { onDelete: 'cascade' }),
```
Adapt for the profile's PK-as-FK: `accountId: text().primaryKey().references(() => user.id, { onDelete: 'cascade' })` — same `.references(() => table.col, { onDelete: 'cascade' })` call shape, just chained onto `.primaryKey()` instead of `.notNull()` since this column *is* the PK (per D-04).

**Functional unique index** (RESEARCH.md Pattern 2 — no existing analog in this codebase; net-new pattern, but the third-argument-callback shape matches `tag.ts`'s `(t) => [unique(...).on(...)]` exactly):
```typescript
// tag.ts's existing style for the third `pgTable` argument:
(t) => [unique('tag_festival_slug_unq').on(t.festivalId, t.slug)],

// New pattern to introduce (RESEARCH.md, Drizzle official docs):
function lower(col: AnyPgColumn): SQL {
  return sql`lower(${col})`;
}
...
(t) => [uniqueIndex('visitor_profile_username_lower_unq').on(lower(t.username))],
```
This is the one genuinely new idiom this phase introduces — flag it in PATTERNS.md as **no direct in-repo analog**, but structurally it slots into the exact same `(t) => [...]` third-argument array convention already used by both `tag.ts` and `festivalLocale`.

---

### `packages/db/src/schema/my-festival.ts` (model, CRUD)

**Analog:** `packages/db/src/schema/tag.ts` — specifically `tagTranslation` (lines 26-36), the closest existing composite-PK join table.

**Composite-PK join-table pattern** (from `tag.ts` lines 26-36):
```typescript
export const tagTranslation = pgTable(
  'tag_translation',
  {
    tagId: uuid()
      .notNull()
      .references(() => tag.id, { onDelete: 'cascade' }),
    locale: localeEnum().notNull(),
    title: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.tagId, t.locale] })],
);
```
`my_festival` mirrors this exactly: two FK columns (one `text` → `visitorProfile.accountId` as `visitorId`, one `uuid` → `festival.id` as `festivalId`), a composite `primaryKey({ columns: [t.visitorId, t.festivalId] })`, plus `savedAt` (timestamp) and `camp` (nullable text, reserved per D-04). Same `festivalLocale` table (`festival.ts` lines 21-30) is a secondary analog for the "two-FK composite-PK, no surrogate id" shape:
```typescript
export const festivalLocale = pgTable(
  'festival_locale',
  {
    festivalId: uuid()
      .notNull()
      .references(() => festival.id, { onDelete: 'cascade' }),
    locale: localeEnum().notNull(),
  },
  (t) => [primaryKey({ columns: [t.festivalId, t.locale] })],
);
```
Note: unlike `tagTranslation`/`festivalLocale` (both uuid+enum), `my_festival` mixes a `text` FK (`visitorId`) with a `uuid` FK (`festivalId`) — CONTEXT.md D-04 explicitly calls this out as expected ("mixed id types across the global↔tenant boundary").

---

### `packages/db/src/schema/auth.ts` (model, vendored/generated)

**No in-repo analog** — this file's content is authoritative from `npx auth generate --adapter drizzle --dialect postgresql`, not hand-derived from existing patterns. Apply only the project's *wrapper* conventions on top of the CLI output:
- Header comment documenting provenance + regenerate command (RESEARCH.md Pattern 1 code example).
- Still gets re-exported from `schema/index.ts` like every other table file (see barrel pattern below).
- Still gets a `drizzle-zod` base export (RESEARCH.md Pattern 3) even though it's vendored — colocate the `createInsertSchema`/`createSelectSchema` calls either in `auth.ts` itself (if the CLI output is appended to, which risks drift on regenerate) or in a small sibling file (e.g. `auth-schemas.ts`, hand-written, importing `user`/`session`/`account`/`verification` from the generated `auth.ts`) so regenerating `auth.ts` never clobbers the drizzle-zod exports. **Recommend the sibling-file approach** to keep the "do not hand-edit" contract on `auth.ts` absolute.

---

### `packages/db/src/schema/index.ts` (barrel, config)

**Analog:** itself — current state:
```typescript
export * from './locale';
export * from './festival';
export * from './tag';
```
**Edit pattern:** append one `export *` line per new file, same flat re-export style, no namespacing:
```typescript
export * from './locale';
export * from './festival';
export * from './tag';
export * from './auth';
export * from './visitor-profile';
export * from './my-festival';
```
If the sibling drizzle-zod file approach is used for `auth.ts` (see above), also add `export * from './auth-schemas';`.

---

### `packages/db/drizzle.config.ts` (config, batch/migration)

**Analog:** itself — no changes anticipated. `schema: './src/schema/index.ts'` already globs the whole barrel, `casing: 'snake_case'` already applies project-wide, `dbCredentials.url` already prefers `DATABASE_URL_UNPOOLED`. Confirm-only, not an edit target unless a new env var (`BETTER_AUTH_SECRET`) needs wiring elsewhere (that's `.env.example`, not this file).

---

### `packages/db/package.json` (config, dependency edit)

**Analog:** `packages/contracts/package.json` current `dependencies`/`devDependencies` shape (lines 22-30) — shows the project's convention of pinning with `^` semver ranges and separating runtime vs. dev deps. Add to `packages/db/package.json`:
```json
"dependencies": {
  "drizzle-orm": "^0.45.2",
  "postgres": "^3.4.9",
  "better-auth": "^1.6.25",
  "drizzle-zod": "^0.8.3"
},
"devDependencies": {
  "@festipal/config": "workspace:*",
  "drizzle-kit": "^0.31.10",
  "tsup": "^8.5.1",
  "typescript": "6.0.3",
  "auth": "^1.6.25"
}
```
(`auth` is the CLI, dev-only per RESEARCH.md; `better-auth`/`drizzle-zod` are runtime deps of the schema module itself.)

---

### `packages/contracts/src/schemas.ts` (Phase 2 awareness — not edited this phase, but shape matters for D-02's forward compatibility)

**Current hand-written pattern** (full file, lines 1-21):
```typescript
import { z } from 'zod';

import { localeSchema } from './locale';

export const festivalSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  defaultLocale: localeSchema,
  supportedLocales: z.array(localeSchema),
  cashlessUrl: z.string().url().nullable(),
});
export type Festival = z.infer<typeof festivalSchema>;
```
This phase does **not** touch this file (Phase 2 owns composing on top of the new drizzle-zod bases per D-02), but the planner should note: this is the exact shape Phase 2 will refactor into `festivalSchema = createSelectSchema(festival).extend({ supportedLocales: z.array(localeSchema) })`-style composition. No action needed in Phase 1 beyond ensuring `packages/db`'s new drizzle-zod exports are shaped so this future composition is straightforward (plain named exports from the barrel, no default exports, matching the module-design convention in `.claude/CLAUDE.md`).

---

## Shared Patterns

### Table doc-comment + ADR citation
**Source:** `packages/db/src/schema/festival.ts` lines 6-10, `tag.ts` lines 7-11
**Apply to:** All three new schema files (`auth.ts` header differs — see vendored-file pattern; `visitor-profile.ts` and `my-festival.ts` get a standard JSDoc block citing ADR-016/D-03/D-04).

### Terse Drizzle column syntax (no explicit snake_case strings)
**Source:** `packages/db/src/schema/festival.ts`, `tag.ts` — every column call is `text()`, `uuid()`, `text().notNull()` etc., never `text('column_name')`
**Apply to:** `visitor-profile.ts`, `my-festival.ts`. (`auth.ts` is CLI-generated and may use explicit string names — leave as CLI emits it, per the "do not hand-edit" rule; do not manually strip explicit names even if they look redundant.)

### Composite-PK join table via third-argument callback
**Source:** `packages/db/src/schema/tag.ts` (`tagTranslation`), `packages/db/src/schema/festival.ts` (`festivalLocale`)
**Apply to:** `my-festival.ts` — `(t) => [primaryKey({ columns: [t.visitorId, t.festivalId] })]`

### `timestamps` / `idColumn()` shared column builders
**Source:** `packages/db/src/schema/_shared.ts` (full file, lines 1-15)
```typescript
export const idColumn = () => uuid().primaryKey().defaultRandom();

export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
};
```
**Apply to:** `visitor-profile.ts` and `my-festival.ts` should spread `...timestamps` for `createdAt`/`updatedAt` where applicable (`my_festival` uses a single `savedAt` timestamp per D-04, not the full `timestamps` pair — note this as an intentional deviation, not an oversight). **Do not use `idColumn()`** for `visitor_profile`'s PK (it's the FK-typed `accountId`, not a fresh uuid) — this is the one place the standard `idColumn()` helper is correctly *not* reused.

### Barrel re-export, no namespacing
**Source:** `packages/db/src/schema/index.ts` (full file, 3 lines)
**Apply to:** Append `auth`, `visitor-profile`, `my-festival` (and optionally `auth-schemas`) as flat `export *` lines, preserving existing order/style.

### Functional/expression unique index (NEW pattern this phase)
**Source:** No in-repo analog — introduced from Drizzle's official docs per RESEARCH.md Pattern 2, but slots into the existing `(t) => [...]` third-argument convention already established by `tag.ts`/`festivalLocale`.
**Apply to:** `visitor-profile.ts` only, this phase.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `packages/db/src/schema/auth.ts` | model (vendored) | CRUD | Content is CLI-generated from better-auth, not derived from existing project schema patterns — planner should treat RESEARCH.md's "Vendored better-auth core schema" code example as the authoritative shape reference instead of an in-repo analog, and apply only the wrapper conventions (header comment, barrel export, drizzle-zod sibling file) documented above |
| `lower(username)` functional unique index | index/constraint | CRUD (constraint enforcement) | No existing table in this codebase uses an expression/functional index; `tag.ts`'s plain `unique(...).on(t.col1, t.col2)` is a column-list unique constraint, not a functional one. RESEARCH.md Pattern 2 is the reference implementation to follow instead |

## Metadata

**Analog search scope:** `packages/db/src/schema/` (all 4 existing files read in full), `packages/db/drizzle.config.ts`, `packages/db/package.json`, `packages/contracts/src/schemas.ts`, `packages/contracts/package.json`, root `turbo.json`
**Files scanned:** 7 (all read in full single-pass; none exceeded 2,000 lines)
**Pattern extraction date:** 2026-07-30
