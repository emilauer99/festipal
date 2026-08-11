import { sql, type SQL } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import {
  type AnyPgColumn,
  date,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { z } from 'zod';

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
 *
 * `pronoun`/`birthDate`/`gender` (06-CONTEXT.md D-12, D-12a) are OPTIONAL
 * identity fields, all three nullable with no default: a visitor who completes
 * their profile without them stays valid. D-12a stores the BIRTH DATE, never a
 * derived age — the stored value does not go stale (editing is PROF-02, i.e.
 * later) and a future age gate / youth-protection policy from IDN-02 becomes
 * possible without another migration. NOTE (T-06-06, knowingly accepted): there
 * is NO per-field visibility policy in this phase; before any endpoint serves a
 * FOREIGN profile, the public projection must be split into an owner view and a
 * friend view. IDN-02 (visibility, age limit, disclaimer) remains pending.
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
    pronoun: text(),
    birthDate: date({ mode: 'string' }),
    gender: text(),
    socials: jsonb().notNull().default([]),
    socialsVisibility: socialsVisibilityEnum().notNull().default('friends'),
    ...timestamps,
  },
  (t) => [uniqueIndex('visitor_profile_username_lower_unq').on(lower(t.username))],
);

/**
 * `.extend(...)` overrides for the 6 free-text columns (`accountId`,
 * `username`, `displayName`, `avatar`, `pronoun`, `gender`) PLUS the
 * `date({ mode: 'string' })` column `birthDate`. Without these, drizzle-zod's TS-level
 * type inference collapses every `text()` column to `unknown` here: calling
 * `text()` with no `{ enum: [...] }` config makes drizzle-orm infer
 * `enumValues: [string, ...string[]]` (a generic non-`undefined` tuple)
 * instead of `enumValues: undefined`, which trips drizzle-zod's
 * enum-detection heuristic at the type level (see `drizzle-zod`'s
 * `GetZodType`/`GetEnumValuesFromColumn`). This is purely a static-type bug —
 * the RUNTIME schema (and therefore all request/response validation) was
 * always correct — but it made the exported `VisitorProfilePublic`/
 * `CompleteProfileBody` types in `@quiks/contracts` unusable for anything
 * beyond return-position assignment. `createInsertSchema`'s own `refine`
 * parameter re-triggers the same broken inference internally (it recomputes
 * the allowed-refinement type from the same `GetZodType`), so the fix has to
 * happen one level up via plain Zod `.extend()`, which replaces these keys'
 * shape entirely at the type level. Keep this list in sync with any new
 * `text()` column added to this table.
 *
 * `birthDate` needs an override for a SEPARATE drizzle-zod inference gap (the
 * same one documented on `festival.startDate`/`endDate`): `date({ mode:
 * 'string' })` infers as a Buffer-typed schema here, so it is overridden to
 * `z.string()` alongside the free-text columns. No format refinement is applied
 * — Postgres' own `date` type parses and validates the `YYYY-MM-DD` value on
 * insert (T-06-09), so a bad format is rejected by the database rather than
 * silently stored.
 */
export const visitorProfileInsertSchema = createInsertSchema(visitorProfile).extend({
  accountId: z.string(),
  // D-03: server-side name caps — the authoritative half (client soft-caps in
  // the mobile screens are UX sugar only). Added to these EXISTING `.extend()`
  // z.string() values, NOT via createInsertSchema's refinement callback,
  // which re-triggers the text()->unknown inference bug documented above.
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_.]+$/, 'lowercase letters, numbers, _ and . only'),
  displayName: z.string().min(1).max(40),
  avatar: z.string().nullable().optional(),
  // D-12 + T-06-07: the server-side caps on the two free-text identity fields.
  // The client-side caps in the mobile complete-profile screen are UX only —
  // THIS is the gate. All three stay `.nullable().optional()`, so a
  // complete-profile request that omits them entirely remains valid.
  pronoun: z.string().max(20).nullable().optional(),
  birthDate: z.string().nullable().optional(),
  gender: z.string().max(30).nullable().optional(),
});
export const visitorProfileSelectSchema = createSelectSchema(visitorProfile).extend({
  accountId: z.string(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9_.]+$/, 'lowercase letters, numbers, _ and . only'),
  displayName: z.string().min(1).max(40),
  avatar: z.string().nullable(),
  pronoun: z.string().max(20).nullable(),
  birthDate: z.string().nullable(),
  gender: z.string().max(30).nullable(),
});
