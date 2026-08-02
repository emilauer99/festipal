import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { localeSchema } from './locale';
import {
  completeProfileBodySchema,
  festivalSchema,
  meSchema,
  tagSchema,
  usernameAvailabilitySchema,
  visitorProfilePublicSchema,
} from './schemas';

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
    getMe: {
      method: 'GET',
      path: '/me',
      responses: { 200: meSchema },
      summary: 'Fetch the current session’s account + visitor profile (profile is null pre-first-login-completion)',
    },
    completeProfile: {
      method: 'POST',
      path: '/me/complete-profile',
      body: completeProfileBodySchema,
      responses: { 200: visitorProfilePublicSchema, 409: errorSchema },
      summary: 'First-login profile completion (unique username + displayName, optional avatar)',
    },
    usernameAvailability: {
      method: 'GET',
      path: '/me/username-availability',
      query: z.object({ username: z.string() }),
      responses: { 200: usernameAvailabilitySchema },
      summary: 'Live case-insensitive username availability check',
    },
    listFestivals: {
      method: 'GET',
      path: '/festivals',
      responses: { 200: z.array(festivalSchema) },
      summary: 'Browse all festivals (D-04 minimal fields, no pagination)',
    },
    saveFestival: {
      method: 'POST',
      path: '/festivals/:festivalId/save',
      pathParams: z.object({ festivalId: z.string().uuid() }),
      body: z.object({}),
      responses: { 200: z.object({ saved: z.literal(true) }), 404: errorSchema },
      summary: 'Gate-less festival save (ADR-014) — idempotent, no membership/role',
    },
    listMyFestivals: {
      method: 'GET',
      path: '/me/festivals',
      responses: { 200: z.array(festivalSchema) },
      summary: 'List the caller’s saved festivals (SEC-02: festivalId/visitorId-scoped, never client-filtered)',
    },
  },
  { pathPrefix: '/api/v1' },
);

export type Contract = typeof contract;
