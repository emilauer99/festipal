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
 * possible without another migration.
 *
 * T-06-06 is SETTLED (phase 07): the projection split landed in
 * `packages/contracts/src/schemas.ts` as `visitorProfileForeignSchema` (the
 * base, six fields) and `visitorProfileOwnerSchema` (the single named
 * extension, base + `birthDate`). `birthDate` is therefore owner-only by
 * construction — a column added to this table appears in NEITHER view until
 * someone explicitly picks it. `gender` IS in the foreign view, deliberately
 * (07-CONTEXT.md D-02). Still pending: IDN-02 (per-field visibility policy,
 * age limit, disclaimer) — the foreign view is the place where it will apply.
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
 * `z.string()` alongside the free-text columns.
 *
 * WR-02 (06-REVIEW.md) — that override used to carry NO format refinement, on
 * the assumption that "Postgres' own `date` type parses and validates" (T-06-09).
 * It does, but it is the wrong gate on both sides: a value Postgres REJECTS
 * (`2020-02-30`, `kein-datum`, `''`) throws a driver error with no `23505` code,
 * which `MeService.completeProfile` re-throws as a **500** — the mobile client
 * then shows its misleading "can't reach the server" copy instead of a
 * validation error. And a value Postgres ACCEPTS but that is not `YYYY-MM-DD`
 * is stored silently: `'infinity'`, `'epoch'`, `'today'`, `'08/12/2026'` are all
 * legal `date` input and `'infinity'` round-trips as the literal string
 * `"infinity"` through `GET /me`. So the canonical transport form is pinned
 * HERE instead, the same way `pronoun`/`gender` are capped here rather than
 * left to the client (T-06-07): shape first (regex), then real-calendar-date
 * (the refine) — together they make every rejected value a clean 400 and leave
 * Postgres nothing to reject. Read-side (`visitorProfileSelectSchema`) stays
 * deliberately loose: rows written before this constraint existed must still be
 * serializable, otherwise a legacy value would turn a GET into a 500.
 */

/**
 * True only for a real calendar date — the regex alone still lets `2020-02-30`
 * or `2026-13-01` through to Postgres (and therefore to a 500). Compared
 * component-wise in UTC so no local timezone can shift the day.
 */
function isCalendarDate(value: string): boolean {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
  );
}
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
  // WR-02: `YYYY-MM-DD` is the contract's only date transport form (see the
  // note above and me.service.ts:23-25). `.nullable()` sits AFTER the refine on
  // purpose — omitting the field entirely stays valid, only a PRESENT value is
  // constrained.
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
    .refine(isCalendarDate, 'not a real calendar date')
    .nullable()
    .optional(),
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
