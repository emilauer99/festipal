import { date, pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { idColumn, timestamps } from './_shared';
import { localeEnum } from './locale';

/**
 * Tenant root. Every tenant-scoped table references festival.id.
 * `defaultLocale` is the mandatory fallback for content translations (ADR-012).
 * `cashlessUrl` is the optional embedded cashless page (ADR-011).
 * `startDate`/`endDate`/`place` (D-08) are all NULLABLE (DATE-NULLABILITY
 * decision, 05-01-PLAN.md): a partially-configured festival is valid
 * (RESEARCH.md Assumption A1) and this keeps the migration a single additive
 * ADD COLUMN with no backfill/NOT-NULL dance. Clients render a localized
 * fallback when a date is absent.
 */
export const festival = pgTable('festival', {
  id: idColumn(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  defaultLocale: localeEnum().notNull().default('de'),
  cashlessUrl: text(),
  startDate: date({ mode: 'string' }),
  endDate: date({ mode: 'string' }),
  place: text(),
  ...timestamps,
});

/**
 * `.extend(...)` overrides for every free-text column (`slug`, `name`,
 * `cashlessUrl`, `place`). Without these, drizzle-zod's TS-level type
 * inference collapses every `text()` column to `unknown` here: calling
 * `text()` with no `{ enum: [...] }` config makes drizzle-orm infer
 * `enumValues: [string, ...string[]]` (a generic non-`undefined` tuple)
 * instead of `enumValues: undefined`, which trips drizzle-zod's
 * enum-detection heuristic at the type level (see `drizzle-zod`'s
 * `GetZodType`/`GetEnumValuesFromColumn`). This is purely a static-type bug —
 * the RUNTIME schema (and therefore all request/response validation) was
 * always correct — but it makes the exported `Festival` type in
 * `@festipal/contracts` unusable for anything beyond return-position
 * assignment (Pitfall 1/6). `startDate`/`endDate` ALSO need an override:
 * verified against the generated `.d.ts` that `date({ mode: 'string' })`
 * infers as `z.ZodType<Buffer, ZodTypeDef, Buffer>` with an `unknown` input
 * type here (a separate drizzle-zod inference gap, not the text()-enum bug
 * above) — so they are overridden alongside the free-text columns. Keep this
 * list in sync with any new column added to this table.
 */
export const festivalSelectSchema = createSelectSchema(festival).extend({
  slug: z.string(),
  name: z.string(),
  cashlessUrl: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  place: z.string().nullable(),
});
export const festivalInsertSchema = createInsertSchema(festival).extend({
  slug: z.string(),
  name: z.string(),
  cashlessUrl: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  place: z.string().nullable().optional(),
});

/** Locales a festival offers to app users (subset of SUPPORTED_LOCALES). */
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
