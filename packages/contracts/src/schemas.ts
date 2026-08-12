import {
  festivalSelectSchema,
  visitorProfileInsertSchema,
  visitorProfileSelectSchema,
} from '@quiks/db/schema';
import { z } from 'zod';

import { localeSchema } from './locale';

/**
 * Drift-detection proof (D-08, Pitfall 1/6): composed on the `@quiks/db`
 * drizzle-zod `festivalSelectSchema` base, NOT a hand-mirrored `z.object` —
 * renaming a `festival` column now breaks this typecheck instead of
 * drifting silently. `supportedLocales` is NOT a column on `festival`
 * (aggregated server-side from `festival_locale`) so it stays a manual
 * `.extend()`. `.url()` is reapplied on `cashlessUrl` so the existing public
 * response contract does not regress to an arbitrary string.
 */
export const festivalSchema = festivalSelectSchema
  .pick({
    id: true,
    slug: true,
    name: true,
    defaultLocale: true,
    cashlessUrl: true,
    startDate: true,
    endDate: true,
    place: true,
  })
  .extend({
    cashlessUrl: z.string().url().nullable(),
    supportedLocales: z.array(localeSchema),
  });
export type Festival = z.infer<typeof festivalSchema>;

/** A tag/chip with its title already resolved to the requested locale server-side. */
export const tagSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
});
export type Tag = z.infer<typeof tagSchema>;

/**
 * Drift-detection proof (D-02, D-03): composed on the `@quiks/db` drizzle-zod
 * base — NOT a hand-mirrored `z.object` (PITFALLS.md Pitfall 6) — so renaming a
 * `visitor_profile` column breaks this typecheck instead of silently drifting.
 * Deliberately picks only the non-reserved columns: `socials`/`socialsVisibility`
 * have no visibility policy yet and are omitted (default closed).
 *
 * D-12 adds the three optional identity fields (`pronoun`, `birthDate`,
 * `gender`). `birthDate` travels as a `YYYY-MM-DD` STRING, never a `Date` —
 * same convention `festivalSchema` already sets for `startDate`/`endDate`. The
 * age shown in the profile header is DERIVED client-side from this value and is
 * never persisted (D-12a).
 *
 * T-06-06 is SETTLED here (phase 07): what used to be ONE owner-bound
 * projection misleadingly named `visitorProfilePublicSchema` is now the two
 * schemas below. There are EXACTLY TWO visibility tiers (07-CONTEXT.md D-01) —
 * strangers and friends see the same thing; friendship unlocks no extra field,
 * so there is no place where a forgotten friendship check can leak one.
 *
 * The FOREIGN view is the BASE and the owner view is its single named
 * extension, not the other way round. That ordering buys default-closed by
 * construction: a new column on `visitor_profile` shows up in NEITHER view
 * until someone explicitly picks it, and the difference between "everyone sees
 * it" and "only I see it" is one line of diff in one place.
 *
 * `gender` IS in the foreign view — a deliberate product decision taken after
 * the conflict was named (D-02), not an oversight. IDN-02 (per-field
 * visibility, age limit, Flinta filter, disclaimer) is still pending, and this
 * schema is exactly where it will apply when it lands.
 */
export const visitorProfileForeignSchema = visitorProfileSelectSchema.pick({
  accountId: true,
  username: true,
  displayName: true,
  avatar: true,
  pronoun: true,
  gender: true,
});
export type VisitorProfileForeign = z.infer<typeof visitorProfileForeignSchema>;

/**
 * The owner view: the foreign base plus `birthDate` — the one field the visitor
 * sees about themselves and nobody else sees about them (D-02). Its only
 * producer is `MeService`, and its only caller passes `session.user.id`.
 */
export const visitorProfileOwnerSchema = visitorProfileForeignSchema.merge(
  visitorProfileSelectSchema.pick({ birthDate: true }),
);
export type VisitorProfileOwner = z.infer<typeof visitorProfileOwnerSchema>;

/**
 * The caller's relationship to the visitor being shown (D-07). Every foreign
 * view is served WITH this, so a screen can render the right action instead of
 * sending a request the server would reject as a duplicate. `self` exists
 * because a visitor can resolve their own handle — self-adjacency is a
 * relation, not an error, and it does NOT promote the response to the owner view.
 */
export const relationSchema = z.enum([
  'none',
  'requestOutgoing',
  'requestIncoming',
  'friends',
  'self',
]);
export type Relation = z.infer<typeof relationSchema>;

/**
 * The single response shape for a foreign visitor. All four D-04 access paths
 * (handle lookup, search hits, request lists, friend list) embed `profile`
 * using THIS shape — the uniqueness of the projection is what VIS-02 asserts.
 */
export const visitorSummarySchema = z.object({
  profile: visitorProfileForeignSchema,
  relation: relationSchema,
});
export type VisitorSummary = z.infer<typeof visitorSummarySchema>;

/**
 * `GET /me` response (RESEARCH.md A4 default, locked here per Open Question 1):
 * `profile: null` discriminates "first login, needs complete-profile" from a
 * returning visitor. Chosen over a separate `status` enum because it's the
 * simpler shape and the client only ever needs the binary branch (has a
 * profile vs. doesn't) — a `status` field would just restate this null-check
 * as a string literal with no extra information.
 *
 * `createdAt` (D-04) is the Account's creation timestamp, surfaced for the
 * profile meta line's "member since {year}". It sits at the TOP level, NOT
 * inside `profile`, because it comes from the `user` (Account) table and not
 * from `visitor_profile` — and it is a `z.string()` (ISO 8601), never a Zod
 * date schema: JSON carries no Date, so declaring it as a date here would make
 * the TypeScript type lie about the shape the client actually receives over the
 * wire. Same string-transport convention `festivalSchema` uses for
 * `startDate`/`endDate` (and the reason no Zod date schema appears anywhere in
 * this file — the contract transports dates as strings, always). It is
 * server-derived from the session and never accepted from a request body
 * (T-06-10).
 */
export const meSchema = z.object({
  accountId: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
  profile: visitorProfileOwnerSchema.nullable(),
});
export type Me = z.infer<typeof meSchema>;

/**
 * `POST /me/complete-profile` request body — composed on the drizzle-zod
 * insert base (Pitfall 6), never hand-redeclared. `username`/`displayName`
 * are required by the table; `avatar` stays optional/nullable as on the base.
 * The three D-12 identity fields are picked from the same base and inherit its
 * `.nullable().optional()` shape plus the server-side length caps (pronoun 20,
 * gender 30 — T-06-07), so a request that omits all three stays valid.
 */
export const completeProfileBodySchema = visitorProfileInsertSchema.pick({
  username: true,
  displayName: true,
  avatar: true,
  pronoun: true,
  birthDate: true,
  gender: true,
});
export type CompleteProfileBody = z.infer<typeof completeProfileBodySchema>;

export const usernameAvailabilitySchema = z.object({ available: z.boolean() });
export type UsernameAvailability = z.infer<typeof usernameAvailabilitySchema>;
