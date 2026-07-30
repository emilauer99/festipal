import { visitorProfileSelectSchema } from '@festipal/db/schema';
import { z } from 'zod';

import { localeSchema } from './locale';

export const festivalSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  defaultLocale: localeSchema,
  supportedLocales: z.array(localeSchema),
  cashlessUrl: z.string().url().nullable(),
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
 * Drift-detection proof (D-02, D-03): composed on the `@festipal/db` drizzle-zod
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
