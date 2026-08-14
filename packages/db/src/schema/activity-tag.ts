import { sql } from 'drizzle-orm';
import {
  boolean,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { idColumn, timestamps } from './_shared';
import { festival } from './festival';
import { localeEnum } from './locale';

/**
 * The tag catalog entry (ADR-017 §3). Replaces the scaffold `tag`/`tag_translation`
 * pair (D-01) — this is now the ONLY tag store.
 *
 * `festivalId` is DELIBERATELY nullable — the one exception to "every
 * tenant-scoped table has a NOT NULL `festivalId`" (SEC-03). `NULL` means a
 * GLOBAL catalog entry curated by the platform admin (ADR-018), visible to
 * every festival; a set value means a festival-own custom tag, visible only
 * inside that festival. Because two ordinary unique-index rows with the same
 * NULL never collide, uniqueness needs TWO partial indexes instead of one
 * plain unique constraint: `activity_tag_global_slug_unq` guards the global
 * slug namespace, `activity_tag_festival_slug_unq` guards each festival's own
 * namespace. Without the `WHERE festival_id IS NULL` clause on the first, two
 * global tags could silently share a slug.
 *
 * Field scope ends here (D-03): only `slug` + translated `title`. `category`/
 * `guide` (ADR-017, optional) are deferred — they land additively from the
 * `admin` workstream when its catalog UI needs them.
 */
export const activityTag = pgTable(
  'activity_tag',
  {
    id: idColumn(),
    festivalId: uuid().references(() => festival.id, { onDelete: 'cascade' }),
    slug: text().notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('activity_tag_global_slug_unq')
      .on(t.slug)
      .where(sql`${t.festivalId} is null`),
    uniqueIndex('activity_tag_festival_slug_unq')
      .on(t.festivalId, t.slug)
      .where(sql`${t.festivalId} is not null`),
  ],
);

/**
 * `.extend()` override for the one free-text column (`slug`) — without it,
 * drizzle-zod's TS-level inference collapses `text()` columns to `unknown`
 * (see `visitor-profile.ts:72-159` for the full explanation of this
 * drizzle-zod pitfall). `festivalId` stays the plain nullable uuid inference;
 * no override needed there.
 */
export const activityTagInsertSchema = createInsertSchema(activityTag).extend({
  slug: z.string(),
});
export const activityTagSelectSchema = createSelectSchema(activityTag).extend({
  slug: z.string(),
});

/**
 * One localized title per (tag, locale) — the exact ADR-012 translation-table
 * shape the removed `tag_translation` already used (D-02). The global catalog
 * serves festivals with different default locales, so a tag's fallback is
 * resolved in the context of the REQUESTING festival's `defaultLocale`, not a
 * fixed one.
 */
export const activityTagTranslation = pgTable(
  'activity_tag_translation',
  {
    tagId: uuid()
      .notNull()
      .references(() => activityTag.id, { onDelete: 'cascade' }),
    locale: localeEnum().notNull(),
    title: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.tagId, t.locale] })],
);

export const activityTagTranslationInsertSchema = createInsertSchema(
  activityTagTranslation,
).extend({
  title: z.string(),
});
export const activityTagTranslationSelectSchema = createSelectSchema(
  activityTagTranslation,
).extend({
  title: z.string(),
});

/**
 * Per-festival tag activation (D-04/D-05). A global tag is EFFECTIVE for every
 * festival by default — absence of a row here means enabled (opt-out, not
 * opt-in), because v1.1 ships with no admin UI: opt-in would leave every
 * festival's effective tag list empty and the Phase-11 tag picker dead. The
 * `enabled` column (rather than "row exists = disabled") lets the `admin`
 * workstream re-enable a tag later without deleting/re-inserting a row.
 * Disabling only affects the SELECTION list (D-04) — existing activities keep
 * their tag/title unchanged, because an activity's auto-title rule
 * (`title = tag.label` when no explicit title) would otherwise leave orphaned
 * activities without a title.
 */
export const festivalActivityTag = pgTable(
  'festival_activity_tag',
  {
    festivalId: uuid()
      .notNull()
      .references(() => festival.id, { onDelete: 'cascade' }),
    tagId: uuid()
      .notNull()
      .references(() => activityTag.id, { onDelete: 'cascade' }),
    enabled: boolean().notNull().default(true),
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.festivalId, t.tagId], name: 'festival_activity_tag_pk' }),
  ],
);

export const festivalActivityTagInsertSchema = createInsertSchema(festivalActivityTag);
export const festivalActivityTagSelectSchema = createSelectSchema(festivalActivityTag);
