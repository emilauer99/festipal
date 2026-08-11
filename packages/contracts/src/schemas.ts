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
 */
export const visitorProfilePublicSchema = visitorProfileSelectSchema.pick({
  accountId: true,
  username: true,
  displayName: true,
  avatar: true,
});
export type VisitorProfilePublic = z.infer<typeof visitorProfilePublicSchema>;

/**
 * `GET /me` response (RESEARCH.md A4 default, locked here per Open Question 1):
 * `profile: null` discriminates "first login, needs complete-profile" from a
 * returning visitor. Chosen over a separate `status` enum because it's the
 * simpler shape and the client only ever needs the binary branch (has a
 * profile vs. doesn't) — a `status` field would just restate this null-check
 * as a string literal with no extra information.
 */
export const meSchema = z.object({
  accountId: z.string(),
  email: z.string().email(),
  profile: visitorProfilePublicSchema.nullable(),
});
export type Me = z.infer<typeof meSchema>;

/**
 * `POST /me/complete-profile` request body — composed on the drizzle-zod
 * insert base (Pitfall 6), never hand-redeclared. `username`/`displayName`
 * are required by the table; `avatar` stays optional/nullable as on the base.
 */
export const completeProfileBodySchema = visitorProfileInsertSchema.pick({
  username: true,
  displayName: true,
  avatar: true,
});
export type CompleteProfileBody = z.infer<typeof completeProfileBodySchema>;

export const usernameAvailabilitySchema = z.object({ available: z.boolean() });
export type UsernameAvailability = z.infer<typeof usernameAvailabilitySchema>;
