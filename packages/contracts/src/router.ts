import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { localeSchema } from './locale';
import { festivalSchema, tagSchema } from './schemas';

const c = initContract();

const errorSchema = z.object({ message: z.string() });

/**
 * The single source of truth for the REST API. NestJS implements this contract
 * (@festipal/api) and admin/mobile derive fully typed clients from it (ADR-006).
 */
export const contract = c.router(
  {
    health: {
      method: 'GET',
      path: '/health',
      responses: { 200: z.object({ status: z.literal('ok') }) },
      summary: 'Liveness probe',
    },
    getFestival: {
      method: 'GET',
      path: '/festivals/:slug',
      pathParams: z.object({ slug: z.string() }),
      responses: { 200: festivalSchema, 404: errorSchema },
      summary: 'Fetch a festival (tenant) by slug',
    },
    listTags: {
      method: 'GET',
      path: '/festivals/:festivalId/tags',
      pathParams: z.object({ festivalId: z.string().uuid() }),
      query: z.object({ locale: localeSchema.optional() }),
      responses: { 200: z.array(tagSchema) },
      summary: 'List a festival’s tags, titles resolved to the requested locale',
    },
  },
  { pathPrefix: '/api/v1' },
);

export type Contract = typeof contract;
