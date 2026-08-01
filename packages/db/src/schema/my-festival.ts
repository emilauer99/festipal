import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { festival } from './festival';
import { visitorProfile } from './visitor-profile';

/**
 * The gate-less save-membership edge (D-04, ADR-014/016) — the ONLY link between
 * global identity and tenant (festival) data. `visitorId` FKs to
 * `visitor_profile.accountId` (NOT `user.id`), encoding the "you must have a
 * completed profile before you can save a festival" invariant at the schema
 * level. `festivalId` FKs to `festival.id`, the tenant root. Always queried by
 * `visitorId` — the global `user`/`Account` table carries no `festivalId` FK.
 *
 * This is intentionally NOT an org/membership/role table: no invite, no role,
 * no active-festival column. Saving is gate-less (ADR-014) — anyone with a
 * profile can save any festival. `camp` is reserved (no UI this cycle).
 *
 * Mixed id types across the global<->tenant boundary are expected: `visitorId`
 * is `text` (better-auth/visitor_profile convention), `festivalId` is `uuid`
 * (tenant-table convention).
 */
export const myFestival = pgTable(
  'my_festival',
  {
    visitorId: text()
      .notNull()
      .references(() => visitorProfile.accountId, { onDelete: 'cascade' }),
    festivalId: uuid()
      .notNull()
      .references(() => festival.id, { onDelete: 'cascade' }),
    savedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    camp: text(),
  },
  (t) => [primaryKey({ columns: [t.visitorId, t.festivalId] })],
);

export const myFestivalInsertSchema = createInsertSchema(myFestival);
export const myFestivalSelectSchema = createSelectSchema(myFestival);
