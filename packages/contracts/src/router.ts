import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { localeSchema } from './locale';
import {
  activityTagSchema,
  completeProfileBodySchema,
  festivalSchema,
  friendRequestListsSchema,
  friendRequestResultSchema,
  friendRequestTargetBodySchema,
  friendSchema,
  meSchema,
  mutationResultSchema,
  usernameAvailabilitySchema,
  visitorProfileOwnerSchema,
  visitorSearchQuerySchema,
  visitorSummarySchema,
} from './schemas';

const c = initContract();

const errorSchema = z.object({ message: z.string() });

/**
 * The single source of truth for the REST API. NestJS implements this contract
 * (@quiks/api) and admin/mobile derive fully typed clients from it (ADR-006).
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
      responses: { 200: visitorProfileOwnerSchema, 409: errorSchema },
      summary: 'First-login profile completion (unique username + displayName, optional avatar)',
    },
    searchVisitors: {
      method: 'GET',
      path: '/visitors',
      query: visitorSearchQuerySchema,
      responses: { 200: z.array(visitorSummarySchema) },
      summary:
        'Case-insensitive PREFIX search over `username` only (D-06/D-09), max 20 hits ordered by username ascending (D-08); every hit embeds the FOREIGN view plus the caller’s relation. No 404 — a search without hits is an empty list, not an error. Sits beside `/visitors/:username`: distinct route keys, distinct segment counts, no collision',
    },
    lookupVisitor: {
      method: 'GET',
      path: '/visitors/:username',
      pathParams: z.object({ username: z.string() }),
      responses: { 200: visitorSummarySchema, 404: errorSchema },
      summary:
        'Resolve a quiks handle (@username, D-16) to the FOREIGN profile view plus the caller’s relation — the caller’s scope comes from the session only, never from the path; 404 for an unclaimed handle',
    },
    // The four friend-request lifecycle transitions, ONE route key each (D-12:
    // accept, decline and withdraw all DELETE the row, so there is no status to
    // PATCH and nothing a generic "update the request" endpoint could express).
    // In every path below `:accountId` names the COUNTERPART, never the actor —
    // the actor comes from the session in all four handlers (T-07-12).
    sendFriendRequest: {
      method: 'POST',
      path: '/me/friend-requests',
      body: friendRequestTargetBodySchema,
      responses: { 200: friendRequestResultSchema, 404: errorSchema, 409: errorSchema },
      summary:
        'Send a friend request. Idempotent (D-11/D-13: repeating costs nothing, there is no limit and no cooldown) and self-resolving — meeting an open counter-request returns `friends` instead of opening a second one (D-10). 404 for an unknown account, 409 for yourself or for a caller without a completed profile',
    },
    acceptFriendRequest: {
      method: 'POST',
      path: '/me/friend-requests/:accountId/accept',
      pathParams: z.object({ accountId: z.string() }),
      body: z.object({}),
      responses: { 200: z.object({ result: z.literal('friends') }), 404: errorSchema },
      summary:
        'Accept the INCOMING request from that visitor. 404 both when no request exists and when the only request is the caller’s own outgoing one — the answer deliberately does not distinguish the two (T-07-13/T-07-15)',
    },
    declineFriendRequest: {
      method: 'POST',
      path: '/me/friend-requests/:accountId/decline',
      pathParams: z.object({ accountId: z.string() }),
      body: z.object({}),
      responses: { 200: mutationResultSchema },
      summary:
        'Decline the incoming request from that visitor. Always 200 with the same payload, whether or not a request existed — the response carries no evidence that there was something to delete (T-07-15). No cooldown follows (D-11)',
    },
    withdrawFriendRequest: {
      method: 'POST',
      path: '/me/friend-requests/:accountId/withdraw',
      pathParams: z.object({ accountId: z.string() }),
      body: z.object({}),
      responses: { 200: mutationResultSchema },
      summary:
        'Withdraw the caller’s own outgoing request to that visitor. Mirror image of decline, with the same always-200, evidence-free answer',
    },
    // The two READ paths onto the caller's own relationship set, plus the one
    // way out of a friendship. Like every `/me/*` route they take NO caller
    // identity from path, query or body — the scope comes from the session and
    // nowhere else (T-07-19). `GET /me/friend-requests` and the POST above are
    // different methods on the same resource and therefore separate route keys.
    listFriends: {
      method: 'GET',
      path: '/me/friends',
      responses: { 200: z.array(friendSchema) },
      summary:
        'List the caller’s friends, each as the FOREIGN view plus `friendsSince`, ascending by username. Symmetric by construction: ONE `friendship` row shows up for both parties, there is no mirror row (D-14). No friends is `[]`, never null and never an error',
    },
    listFriendRequests: {
      method: 'GET',
      path: '/me/friend-requests',
      responses: { 200: friendRequestListsSchema },
      summary:
        'Both pending directions in one response — `incoming` and `outgoing`, partitioned solely by `requesterId` (D-12: there is no status column). Phase 8 renders them together, so a second round-trip would buy nothing. No requests is two empty arrays',
    },
    unfriend: {
      method: 'DELETE',
      path: '/me/friends/:accountId',
      pathParams: z.object({ accountId: z.string() }),
      responses: { 200: mutationResultSchema },
      summary:
        'End the friendship with that visitor. One deleted row ends it for BOTH sides (D-14). Idempotent and evidence-free: always 200 with the same payload, whether or not a friendship existed (T-07-21)',
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
      responses: { 200: z.object({ saved: z.literal(true) }), 404: errorSchema, 409: errorSchema },
      summary:
        'Gate-less festival save (ADR-014) — idempotent, no membership/role; 409 if the caller has not completed their visitor profile yet',
    },
    listMyFestivals: {
      method: 'GET',
      path: '/me/festivals',
      responses: { 200: z.array(festivalSchema) },
      summary: 'List the caller’s saved festivals (SEC-02: festivalId/visitorId-scoped, never client-filtered)',
    },
    // FRND-07 (D-18, published — path/response are now a one-way door). The
    // caller comes ONLY from the session, `festivalId` ONLY from the path —
    // there is no third parameter a client could use to ask for somebody
    // else's intersection (SEC-02, same "client-supplied scope" pattern as
    // `listFriends`/`unfriend`). The response is the SAME `friendSchema` shape
    // `listFriends` already uses, not a new schema. No `my_festival` value
    // (timestamp, festivalId, visitorId) ever appears on the wire — the table
    // is a join-only filter (ADR-014: no presence signal). `[]` for an unknown
    // or unsaved festivalId, never 404 — this endpoint is not a festival
    // existence oracle.
    friendsInFestival: {
      method: 'GET',
      path: '/festivals/:festivalId/friends',
      pathParams: z.object({ festivalId: z.string().uuid() }),
      responses: { 200: z.array(friendSchema) },
      summary:
        'List the caller’s own friends who ALSO saved this festival — the intersection of `listFriends` and `listMyFestivals(festivalId)`. Caller from session only, festivalId from path only (SEC-02); carries no `my_festival` value (ADR-014, no presence signal). No friends or unsaved festival is `[]`, never 404',
    },
    // Replaces the removed `listTags` (D-01). Effective = enabled global
    // (activity_tag.festivalId IS NULL, minus any festival_activity_tag
    // enabled=false row) UNION this festival's own tags — titles resolved
    // server-side to the requested (or festival default) locale (D-02). No
    // 404 for an unknown festivalId — same "not an existence oracle" stance
    // as `friendsInFestival`, `[]` instead.
    listActivityTags: {
      method: 'GET',
      path: '/festivals/:festivalId/activity-tags',
      pathParams: z.object({ festivalId: z.string().uuid() }),
      query: z.object({ locale: localeSchema.optional() }),
      responses: { 200: z.array(activityTagSchema) },
      summary:
        'The effective activity-tag catalog for a festival — activated global tags union the festival’s own, titles resolved to the requested locale (SEC-03: activity_tag.festivalId is the one deliberate nullable-tenant exception)',
    },
  },
  { pathPrefix: '/api/v1' },
);

export type Contract = typeof contract;
