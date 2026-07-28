import { pgTable, primaryKey, text, unique, uuid } from 'drizzle-orm/pg-core';

import { idColumn, timestamps } from './_shared';
import { festival } from './festival';
import { localeEnum } from './locale';

/**
 * Example translatable, tenant-scoped entity (tags / chips).
 * The translation-table pattern (ADR-012): the base row holds tenant + slug;
 * `tag_translation` holds one localized title per locale. Only the festival's
 * default locale is mandatory at the app layer; others fall back to it.
 */
export const tag = pgTable(
  'tag',
  {
    id: idColumn(),
    festivalId: uuid()
      .notNull()
      .references(() => festival.id, { onDelete: 'cascade' }),
    slug: text().notNull(),
    ...timestamps,
  },
  (t) => [unique('tag_festival_slug_unq').on(t.festivalId, t.slug)],
);

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
