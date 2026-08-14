import {
  activitySelectSchema,
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

/**
 * An activity tag/chip with its title already resolved to the requested
 * locale server-side (D-02) — `title` is a plain resolved `string`, never a
 * `LocalizedText` map, because the client never needs to pick a locale
 * itself. Field scope ends at three columns (D-03): `id`/`slug`/`title`. This
 * schema is deliberately unaware of `festivalId` (global vs. festival-own) —
 * that distinction only matters server-side (SEC-03's nullable-tenant
 * exception) and is never exposed on the wire.
 */
export const activityTagSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
});
export type ActivityTag = z.infer<typeof activityTagSchema>;

/** An activity's optional one-off geo point (ADR-017 §2) — both fields or neither. */
export const activityGeoSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type ActivityGeo = z.infer<typeof activityGeoSchema>;

/**
 * Drift-detection proof (D-07/D-08/D-04, ADR-017 auto-title rule): composed on
 * `activitySelectSchema.pick(...)`, not a hand-mirrored `z.object` — a column
 * rename on `activity` breaks this typecheck instead of drifting silently.
 *
 * Four deliberate deviations from the raw columns, each commented:
 * - `title` is the RESOLVED display title (explicit title if set, otherwise
 *   the localized tag title) — the ADR-017 auto-title rule is resolved
 *   server-side so Phase 11 never has to rebuild it client-side.
 * - `tag` is the joined tag object, not a bare column.
 * - `geo` collapses the two nullable columns into one nullable object.
 * - `startTime` travels as an ISO string, never a `Date` — the same wire
 *   convention `friendsSince`/`festivalSchema.startDate` already use.
 *
 * `createdAt`/`updatedAt` are deliberately NOT picked: `projection-uniqueness
 * .spec.ts` derives its owner-only key set from `visitorProfileSelectSchema`
 * and both names appear there, so a route exposing either would turn that
 * existing spec red. There is also deliberately NO embedded creator profile
 * here — the creator is a participant, and the foreign-view profile only ever
 * appears once, in the participant list of the detail response (plan 10-04).
 */
export const activitySchema = activitySelectSchema
  .pick({
    id: true,
    festivalId: true,
    creatorId: true,
    subtitle: true,
    description: true,
    location: true,
  })
  .extend({
    tag: activityTagSchema.nullable(),
    title: z.string(),
    geo: activityGeoSchema.nullable(),
    startTime: z.string(),
    capacity: z.number().int().nullable(),
  });
export type Activity = z.infer<typeof activitySchema>;

/**
 * `POST /festivals/:festivalId/activities` request body. Neither `creatorId`
 * nor `festivalId` is a key here — the creator comes from `session.user.id`
 * and the festival from the path, never from the body (ARCHITECTURE.md
 * §Anti-Patterns "Client-Supplied Scope").
 *
 * The `.refine` is the client-side pre-emption of the `activity_title_or_tag
 * _chk` DB CHECK (ADR-017 auto-title rule): without it, a request with
 * neither `tagId` nor `title` would round-trip all the way to a 23514 driver
 * error and come back as a 500 instead of a validation response — the same
 * lesson `birthDate` in `visitor-profile.ts` already teaches.
 */
export const createActivityBodySchema = z
  .object({
    tagId: z.string().uuid().nullable().optional(),
    title: z.string().max(80).nullable().optional(),
    subtitle: z.string().max(120).nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    location: z.string().max(200).nullable().optional(),
    geo: activityGeoSchema.nullable().optional(),
    startTime: z.string().datetime(),
    capacity: z.number().int().min(1).nullable().optional(),
  })
  .refine((body) => Boolean(body.tagId) || Boolean(body.title && body.title.trim().length > 0), {
    message: 'either tagId or a non-empty title is required',
    path: ['title'],
  });
export type CreateActivityBody = z.infer<typeof createActivityBodySchema>;

/**
 * `POST .../join` success (D-09, plan 10-03). Leave and delete reuse the
 * existing `mutationResultSchema` (`{ result: 'removed' }`) — join is the
 * only new answer, because "you are now a participant" is a distinct fact
 * from "removed", not a second name for the same thing.
 */
export const activityJoinResultSchema = z.object({ result: z.literal('joined') });
export type ActivityJoinResult = z.infer<typeof activityJoinResultSchema>;

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
 * `GET /visitors?q=` query (D-06/D-08/D-09). Exactly ONE key, and that is the
 * whole point: D-05 rules out a discoverability opt-out for v1.1, so this
 * contract deliberately carries no visibility, opt-in or exclusion parameter —
 * there is no flag a client could set and none the server could read. Anyone
 * with a completed profile is findable, and the exposure is documented openly
 * in REQUIREMENTS.md § Future Requirements (FRND-09) rather than papered over
 * with a half measure that has no UI behind it.
 *
 * `q` is intentionally an unconstrained string at the contract layer: the
 * 2-character floor (D-08) is a SERVICE invariant, not a client convention. A
 * `.min(2)` here would turn a too-short search into a 400 and let a client that
 * skips the contract reach the database with a 1-character prefix.
 */
export const visitorSearchQuerySchema = z.object({ q: z.string() });
export type VisitorSearchQuery = z.infer<typeof visitorSearchQuerySchema>;

/**
 * `POST /me/friend-requests` body. The target is named by its `accountId` — the
 * value every foreign view already carries — so a client that just resolved a
 * handle or tapped a search hit sends back exactly what it was handed, with no
 * second identifier and no detour through `username` (which PROF-02 may one day
 * make mutable, D-16).
 *
 * There is deliberately NO sender field: who is asking comes from the session
 * and nowhere else (T-07-12). The schema-level CHECK `friend_request_requester_chk`
 * backs that up in the database, so no code path can file a request on a third
 * party's behalf even if this contract were bypassed.
 */
export const friendRequestTargetBodySchema = z.object({ targetAccountId: z.string() });
export type FriendRequestTargetBody = z.infer<typeof friendRequestTargetBodySchema>;

/**
 * The answer to "send a friend request" — two values, because D-10 makes a
 * request that MEETS an open counter-request resolve into a friendship on the
 * spot. `requested` means a request is now open, `friends` means it never needed
 * to be (or already was). Both are terminal successes; neither is an error, and
 * the client renders the right state without a follow-up read.
 */
export const friendRequestResultSchema = z.object({ result: z.enum(['requested', 'friends']) });
export type FriendRequestResult = z.infer<typeof friendRequestResultSchema>;

/**
 * The single, information-free answer for decline and withdraw. It is the SAME
 * payload whether a request existed or not, so the response cannot be used to
 * learn that there was something to delete (T-07-15). D-12 leaves neither a
 * status column nor a history behind, so there is nothing to read afterwards
 * either — and D-11 means a fresh request may follow immediately.
 */
export const mutationResultSchema = z.object({ result: z.literal('removed') });
export type MutationResult = z.infer<typeof mutationResultSchema>;

/**
 * One entry of `GET /me/friends` (D-04d, the fourth and last access path onto
 * the foreign view). It embeds `profile` in exactly the shape the other three
 * paths use — that sameness is what VIS-02 asserts, and it is why a client can
 * render a friend row, a search hit and a request row with one component.
 *
 * Deliberately carries NO `relation`: in this list it would be the constant
 * `friends` for every entry, i.e. a second source for a fact the list membership
 * already states. `friendsSince` is a STRING (ISO 8601), never a `Date` — the
 * same wire convention `meSchema.createdAt` and `festivalSchema.startDate`
 * follow, and `toIsoString` in the API makes the conversion explicit so the
 * TypeScript type cannot disagree with what the client receives.
 */
export const friendSchema = z.object({
  profile: visitorProfileForeignSchema,
  friendsSince: z.string(),
});
export type Friend = z.infer<typeof friendSchema>;

/**
 * One entry of either request list. Same embedded `profile`, same string
 * timestamp, and again no `relation`: the direction of a pending request is
 * already stated by WHICH list the entry sits in, and D-12 leaves no status
 * column that could disagree with it.
 */
export const friendRequestItemSchema = z.object({
  profile: visitorProfileForeignSchema,
  requestedAt: z.string(),
});
export type FriendRequestItem = z.infer<typeof friendRequestItemSchema>;

/**
 * `GET /me/friend-requests` — both directions in ONE response. Phase 8 shows
 * incoming and outgoing on the same screen, so splitting them across two route
 * keys would only buy a second round-trip.
 *
 * Both keys are required arrays. A visitor with no requests gets two empty
 * lists, never `null` and never a 404: "nothing pending" is a normal state of
 * the resource, not the absence of it.
 */
export const friendRequestListsSchema = z.object({
  incoming: z.array(friendRequestItemSchema),
  outgoing: z.array(friendRequestItemSchema),
});
export type FriendRequestLists = z.infer<typeof friendRequestListsSchema>;

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
