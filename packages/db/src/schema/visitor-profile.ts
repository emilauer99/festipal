import { sql, type SQL } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type AnyPgColumn, jsonb, pgEnum, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';

import { timestamps } from './_shared';
import { user } from './auth';

/**
 * Visibility policy for `visitor_profile.socials` (D-03). Reserved field — no
 * endpoint reads/writes it yet; default is the more private option.
 */
export const socialsVisibilityEnum = pgEnum('socials_visibility', ['everyone', 'friends']);

/** Case-insensitive uniqueness helper (RESEARCH.md Pattern 2). */
function lower(col: AnyPgColumn): SQL {
  return sql`lower(${col})`;
}

/**
 * Visitor identity, 1:1 with the global `user` (Account) table via `accountId`
 * (ADR-016, ADR-021). Kept as a separate table — NOT columns on `user` — so
 * `FestivalStaff`/`PlatformAdmin` accounts never carry visitor-only fields
 * (CONTEXT.md D-04). `username` is enforced case-insensitively unique via a
 * functional index, not an app-level check (CONTEXT.md D-04, PITFALLS.md
 * Pitfall 11 — TOCTOU-proof at the DB layer). `socials`/`socialsVisibility`
 * are reserved fields (CONTEXT.md D-03) with no visibility policy wired yet.
 */
export const visitorProfile = pgTable(
  'visitor_profile',
  {
    accountId: text()
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    username: text().notNull(),
    displayName: text().notNull(),
    avatar: text(),
    socials: jsonb().notNull().default([]),
    socialsVisibility: socialsVisibilityEnum().notNull().default('friends'),
    ...timestamps,
  },
  (t) => [uniqueIndex('visitor_profile_username_lower_unq').on(lower(t.username))],
);

export const visitorProfileInsertSchema = createInsertSchema(visitorProfile);
export const visitorProfileSelectSchema = createSelectSchema(visitorProfile);
