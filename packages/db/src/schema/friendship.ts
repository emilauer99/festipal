import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { check, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

import { visitorProfile } from './visitor-profile';

/**
 * A friendship, stored as ONE row per person pair with a canonically ordered
 * pair (07-CONTEXT.md D-14): the lexicographically smaller accountId goes into
 * `lowerId`, the larger into `higherId`. The composite PK plus the ordering
 * CHECK make a one-sided friendship literally inexpressible — there is no
 * mirror row to forget, and unfriending is trivially symmetric.
 *
 * Deliberately carries NO `festivalId` (ADR-014, 07-CONTEXT.md D-15):
 * friendships are USER-GLOBAL. A friendship made while festival A was selected
 * is unchanged after switching to festival B. "Who is here" is later derived as
 * friends ∩ saved festival — never stored on this table, and never GPS/presence.
 *
 * Both FKs point at `visitor_profile.accountId` (NOT `user.id`) — the same
 * pattern `my_festival` uses to encode "you must have a completed profile" at
 * the schema level. `onDelete: 'cascade'` so deleting a profile takes its
 * friendships with it.
 *
 * Only `createdAt` — no `updatedAt` from `_shared.timestamps`: a friendship row
 * is created and deleted, never mutated.
 */
export const friendship = pgTable(
  'friendship',
  {
    lowerId: text()
      .notNull()
      .references(() => visitorProfile.accountId, { onDelete: 'cascade' }),
    higherId: text()
      .notNull()
      .references(() => visitorProfile.accountId, { onDelete: 'cascade' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.lowerId, t.higherId], name: 'friendship_pair_pk' }),
    // D-14: the canonical ordering lives in the SCHEMA, not in app logic — a
    // service that forgets to sort the pair gets SQLSTATE 23514, not a silent
    // mirror row.
    check('friendship_pair_order_chk', sql`${t.lowerId} < ${t.higherId}`),
  ],
);

/**
 * `.extend()` overrides for the two `text()` columns — same drizzle-zod
 * static-type gap documented at length on `visitorProfileInsertSchema`
 * (`visitor-profile.ts`): without them the inferred TS type of every `text()`
 * column collapses to `unknown`, which makes these bases unusable for the
 * `.pick()`/`.extend()` composition the contracts layer does (Pitfall 6).
 */
export const friendshipInsertSchema = createInsertSchema(friendship).extend({
  lowerId: z.string(),
  higherId: z.string(),
});
export const friendshipSelectSchema = createSelectSchema(friendship).extend({
  lowerId: z.string(),
  higherId: z.string(),
});
