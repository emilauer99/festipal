import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';

import { idColumn, timestamps } from './_shared';
import { localeEnum } from './locale';

/**
 * Tenant root. Every tenant-scoped table references festival.id.
 * `defaultLocale` is the mandatory fallback for content translations (ADR-012).
 * `cashlessUrl` is the optional embedded cashless page (ADR-011).
 */
export const festival = pgTable('festival', {
  id: idColumn(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  defaultLocale: localeEnum().notNull().default('de'),
  cashlessUrl: text(),
  ...timestamps,
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
