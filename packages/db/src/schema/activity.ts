import { sql } from 'drizzle-orm';
import {
  check,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { idColumn, timestamps } from './_shared';
import { activityTag } from './activity-tag';
import { festival } from './festival';
import { visitorProfile } from './visitor-profile';

/**
 * A festival-scoped activity (ADR-017 §1, 10-CONTEXT.md). `creatorId` FKs to
 * `visitor_profile.accountId` (NOT `user.id`) — the same "profile required"
 * encoding `my_festival`/`friendship` already use. `tagId` is nullable and
 * `onDelete: 'restrict'` rather than `'set null'`: an activity without its own
 * `title` relies entirely on the tag for its auto-title (ADR-017 auto-title
 * rule), so `set null` on tag deletion would silently produce a row that
 * violates `activity_title_or_tag_chk` — deleting a used tag must fail
 * instead of leaving a rule-breaking row behind.
 *
 * `title`/`subtitle`/`description`/`location` are user-generated free text and
 * are NEVER translated (ADR-012/020 — no translation table exists for them;
 * only the curated `activity_tag` catalog is localized). `geoLat`/`geoLng` are
 * a one-off OPT-IN point capture (ADR-017 §2) for "open route" only — no
 * PostGIS, no time series, no presence signal (ADR-014).
 *
 * `capacity` is nullable = unbegrenzt (D-08, a deliberate one-way door: making
 * it required later is a breaking contract change plus a data question for
 * existing null rows). The creator counts toward capacity (D-07).
 */
export const activity = pgTable(
  'activity',
  {
    id: idColumn(),
    festivalId: uuid()
      .notNull()
      .references(() => festival.id, { onDelete: 'cascade' }),
    creatorId: text()
      .notNull()
      .references(() => visitorProfile.accountId, { onDelete: 'cascade' }),
    tagId: uuid().references(() => activityTag.id, { onDelete: 'restrict' }),
    title: text(),
    subtitle: text(),
    description: text(),
    location: text(),
    geoLat: doublePrecision(),
    geoLng: doublePrecision(),
    startTime: timestamp({ withTimezone: true }).notNull(),
    capacity: integer(),
    ...timestamps,
  },
  (t) => [
    // ADR-017 auto-title rule, enforced in the schema — a row with neither a
    // tag nor an explicit title is inexpressible, not merely discouraged.
    check(
      'activity_title_or_tag_chk',
      sql`${t.tagId} is not null or ${t.title} is not null`,
    ),
    // Deliberately NOT named `activity_capacity_chk` — plan 10-03 names its
    // trigger-driven "activity is full" check `activity_capacity_full_chk`,
    // and the two must stay distinguishable by `constraint_name` alone.
    check(
      'activity_capacity_positive_chk',
      sql`${t.capacity} is null or ${t.capacity} >= 1`,
    ),
    // A half geo point is impossible — both columns null, or both set.
    check(
      'activity_geo_pair_chk',
      sql`(${t.geoLat} is null) = (${t.geoLng} is null)`,
    ),
    check(
      'activity_geo_range_chk',
      sql`(${t.geoLat} is null or (${t.geoLat} >= -90 and ${t.geoLat} <= 90)) and (${t.geoLng} is null or (${t.geoLng} >= -180 and ${t.geoLng} <= 180))`,
    ),
    // The FK target for `activity_participant`'s composite foreign key below —
    // not redundant with the primary key: a composite FK needs a matching
    // UNIQUE constraint on the referenced side.
    unique('activity_id_festival_unq').on(t.id, t.festivalId),
    // The Discovery query (plan 10-04) filters and sorts on exactly this pair.
    index('activity_festival_start_idx').on(t.festivalId, t.startTime),
  ],
);

/**
 * `.extend()` overrides for every `text()` column (`creatorId`, `title`,
 * `subtitle`, `description`, `location`) — without them, drizzle-zod's TS-level
 * inference collapses each to `unknown` (see `visitor-profile.ts:72-159` for
 * the full explanation). Insert side carries the server-side length caps;
 * select side stays loose so legacy rows remain serializable, the same split
 * `visitor-profile.ts` uses.
 */
export const activityInsertSchema = createInsertSchema(activity).extend({
  creatorId: z.string(),
  title: z.string().max(80).nullable().optional(),
  subtitle: z.string().max(120).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
});
export const activitySelectSchema = createSelectSchema(activity).extend({
  creatorId: z.string(),
  title: z.string().nullable(),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  location: z.string().nullable(),
});
