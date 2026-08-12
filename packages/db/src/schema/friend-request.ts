import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { check, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

import { visitorProfile } from './visitor-profile';

/**
 * A pending friend request. Same canonically ordered pair as `friendship`
 * (07-CONTEXT.md D-14) — the pair is UNORDERED-unique, the direction lives
 * solely in `requesterId`.
 *
 * D-12: there is deliberately NO `status` column and no history. Accept,
 * decline and withdraw all DELETE the row. The consequence is the invariant
 * this table is built around — AT MOST ONE request row per person pair — and
 * the composite PK enforces it in the schema instead of leaving it to a status
 * check that some future query can forget. It also resolves the A→B / B→A race
 * for free: the second insert hits the PK, and the service's `23505` catch
 * takes the auto-accept path (D-10).
 *
 * Like `friendship`, this table carries NO `festivalId` (ADR-014, D-15) and FKs
 * onto `visitor_profile.accountId` with `onDelete: 'cascade'`.
 */
export const friendRequest = pgTable(
  'friend_request',
  {
    lowerId: text()
      .notNull()
      .references(() => visitorProfile.accountId, { onDelete: 'cascade' }),
    higherId: text()
      .notNull()
      .references(() => visitorProfile.accountId, { onDelete: 'cascade' }),
    /** Direction: which of the two sent it. D-12 — this is the ONLY direction marker. */
    requesterId: text()
      .notNull()
      .references(() => visitorProfile.accountId, { onDelete: 'cascade' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.lowerId, t.higherId], name: 'friend_request_pair_pk' }),
    check('friend_request_pair_order_chk', sql`${t.lowerId} < ${t.higherId}`),
    // "The requester is one of the two" — encoded in the schema rather than in
    // the service, so no code path can create a request on behalf of a third party.
    check(
      'friend_request_requester_chk',
      sql`${t.requesterId} = ${t.lowerId} or ${t.requesterId} = ${t.higherId}`,
    ),
  ],
);

/** See `friendshipInsertSchema` for why the `text()` columns need `.extend()`. */
export const friendRequestInsertSchema = createInsertSchema(friendRequest).extend({
  lowerId: z.string(),
  higherId: z.string(),
  requesterId: z.string(),
});
export const friendRequestSelectSchema = createSelectSchema(friendRequest).extend({
  lowerId: z.string(),
  higherId: z.string(),
  requesterId: z.string(),
});
