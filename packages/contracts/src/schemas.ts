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
