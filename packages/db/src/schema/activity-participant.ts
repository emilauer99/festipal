import { foreignKey, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { activity } from './activity';
import { visitorProfile } from './visitor-profile';

/**
 * The join between a visitor and an activity they've joined (D-07/D-09/D-10).
 * `visitorId` FKs to `visitor_profile.accountId` (NOT `user.id`) — same
 * "profile required" encoding as `my_festival`. Two joins by the same visitor
 * to the same activity are the same state, not two rows, hence the composite
 * PK on `(activityId, visitorId)` rather than a surrogate id.
 *
 * `festivalId` is carried REDUNDANTLY, but not unbound: the composite foreign
 * key below pins `(activityId, festivalId)` to `activity`'s own
 * `activity_id_festival_unq`, so a participant row naming a festival its
 * activity does not belong to is unwritable at the schema level — the load-
 * bearing decision of this table. It also satisfies the "every festival-
 * scoped table carries `festivalId`" rule literally, and lets every
 * participant query filter on `festivalId` without a join.
 */
export const activityParticipant = pgTable(
  'activity_participant',
  {
    activityId: uuid().notNull(),
    festivalId: uuid().notNull(),
    visitorId: text()
      .notNull()
      .references(() => visitorProfile.accountId, { onDelete: 'cascade' }),
    joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.activityId, t.visitorId], name: 'activity_participant_pk' }),
    foreignKey({
      columns: [t.activityId, t.festivalId],
      foreignColumns: [activity.id, activity.festivalId],
      name: 'activity_participant_activity_fk',
    }).onDelete('cascade'),
  ],
);

/** `.extend()` override for the one free-text column (`visitorId`). */
export const activityParticipantInsertSchema = createInsertSchema(activityParticipant).extend({
  visitorId: z.string(),
});
export const activityParticipantSelectSchema = createSelectSchema(activityParticipant).extend({
  visitorId: z.string(),
});
