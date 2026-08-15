import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, ne, or, sql, type SQL } from 'drizzle-orm';
import type { PostgresError } from 'postgres';
import { friendRequest, friendship, myFestival, visitorProfile, type Database } from '@quiks/db';
import type {
  Friend,
  FriendRequestItem,
  FriendRequestLists,
  Relation,
  VisitorSummary,
} from '@quiks/contracts';

import { DB } from '../db/db.module';
import { postgresErrorOf } from '../db/postgres-error';
import {
  canonicalPair,
  foreignProfileColumns,
  pickForeignProfile,
  toIsoString,
} from './visitor-projection';

/** A canonically ordered pair (D-14) — the shape `canonicalPair` returns. */
type Pair = { lowerId: string; higherId: string };

export type SendRequestResult =
  | { status: 'requested' }
  | { status: 'friends' }
  | { status: 'self' }
  | { status: 'not-found' }
  | { status: 'profile-required' };

export type AcceptRequestResult = { status: 'friends' } | { status: 'not-found' };

/**
 * Decline and withdraw have exactly ONE outcome. That is the point: a union with
 * a "nothing there" branch would eventually be mapped to a different status code
 * and would then tell the caller whether a request existed (T-07-15).
 */
export type RemoveRequestResult = { status: 'removed' };

/**
 * Unfriending has the same single branch and for the same reason: the answer
 * must not tell the caller whether a friendship existed to end (T-07-21).
 */
export type RemoveFriendshipResult = { status: 'removed' };

/**
 * The two unique constraints the lifecycle can trip. They mean OPPOSITE things —
 * the first says "there is already a request for this pair" and leads into
 * D-10's auto-accept, the second says "somebody else just made you friends" and
 * is a success. Discriminating by name follows `me.service.ts`, where collapsing
 * two unique violations into one answer produced WR-03.
 */
const FRIEND_REQUEST_PAIR_PK = 'friend_request_pair_pk';
const FRIENDSHIP_PAIR_PK = 'friendship_pair_pk';

/**
 * The three foreign keys a `friend_request` insert can trip. They also mean
 * opposite things, and for the same reason as the two unique constraints above
 * they must not share an answer (WR-02):
 *
 * - the FK of the column holding the CALLER, or `requester_id`, means the
 *   caller has no `visitor_profile` yet — an unfinished first login, i.e.
 *   `profile-required` (409);
 * - the FK of the column holding the TARGET means the target's profile was
 *   deleted between the existence check and the insert — `not-found` (404).
 *
 * WHICH column holds the caller is not fixed: it depends on the canonical
 * ordering, so it is resolved per call from the pair.
 */
const FRIEND_REQUEST_LOWER_FK = 'friend_request_lower_id_visitor_profile_account_id_fk';
const FRIEND_REQUEST_HIGHER_FK = 'friend_request_higher_id_visitor_profile_account_id_fk';
const FRIEND_REQUEST_REQUESTER_FK = 'friend_request_requester_id_visitor_profile_account_id_fk';

/** The whole-key match for one pair — both tables are keyed by exactly these two columns. */
function friendRequestPair(pair: Pair): SQL | undefined {
  return and(eq(friendRequest.lowerId, pair.lowerId), eq(friendRequest.higherId, pair.higherId));
}

function friendshipPair(pair: Pair): SQL | undefined {
  return and(eq(friendship.lowerId, pair.lowerId), eq(friendship.higherId, pair.higherId));
}

@Injectable()
export class FriendshipService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /**
   * THE relation resolver (D-07) — the only place in this module that reads a
   * `friendship`/`friend_request` row and turns it into a relation value. Every
   * access path goes through here in BATCH form, so the cost of answering a
   * result set is two queries regardless of how many hits it holds (T-07-10);
   * a per-hit resolver would have made a 20-row search 41 round-trips.
   *
   * No mirror rows exist (D-14, canonical pair), so a single `or(...)` covers
   * both directions: the caller is either the pair's lower or its higher half.
   * Direction of a PENDING request comes solely from `friend_request.requesterId`,
   * since D-12 gives that table no status column.
   *
   * Friendship outranks a pending request. D-10 (counter-request = auto-accept)
   * means the two should never coexist for one pair, but the precedence is kept
   * explicit rather than assumed — it is also the precedence the single-target
   * resolver had before it became a delegator.
   */
  async resolveRelations(
    callerId: string,
    targetAccountIds: string[],
  ): Promise<Map<string, Relation>> {
    const relations = new Map<string, Relation>();
    const others: string[] = [];
    for (const id of targetAccountIds) {
      if (id === callerId) {
        // Self-adjacency is a relation, not an error. Answering it here also
        // keeps the caller out of `others`, whose ids end up in a canonical
        // pair that the `lower < higher` CHECK would reject for two equal ids.
        relations.set(id, 'self');
      } else {
        relations.set(id, 'none');
        others.push(id);
      }
    }
    if (others.length === 0) return relations;

    const friends = await this.db
      .select({ lowerId: friendship.lowerId, higherId: friendship.higherId })
      .from(friendship)
      .where(
        or(
          and(eq(friendship.lowerId, callerId), inArray(friendship.higherId, others)),
          and(eq(friendship.higherId, callerId), inArray(friendship.lowerId, others)),
        ),
      );
    for (const row of friends) {
      relations.set(row.lowerId === callerId ? row.higherId : row.lowerId, 'friends');
    }

    const pending = await this.db
      .select({
        lowerId: friendRequest.lowerId,
        higherId: friendRequest.higherId,
        requesterId: friendRequest.requesterId,
      })
      .from(friendRequest)
      .where(
        or(
          and(eq(friendRequest.lowerId, callerId), inArray(friendRequest.higherId, others)),
          and(eq(friendRequest.higherId, callerId), inArray(friendRequest.lowerId, others)),
        ),
      );
    for (const row of pending) {
      const other = row.lowerId === callerId ? row.higherId : row.lowerId;
      if (relations.get(other) === 'friends') continue;
      relations.set(other, row.requesterId === callerId ? 'requestOutgoing' : 'requestIncoming');
    }

    return relations;
  }

  /**
   * Single-target convenience over {@link resolveRelations}. Deliberately a thin
   * delegator and nothing more: there must be exactly ONE place that interprets
   * friendship/request rows, or the four D-04 access paths can drift apart on
   * what `requestIncoming` means.
   */
  async resolveRelation(callerId: string, targetAccountId: string): Promise<Relation> {
    const relations = await this.resolveRelations(callerId, [targetAccountId]);
    return relations.get(targetAccountId) ?? 'none';
  }

  /**
   * Handle lookup (D-04a, D-16: the quiks code IS `@username`). Case-insensitive
   * exact match via `lower()`, the same idiom `MeService.checkUsernameAvailability`
   * uses — it rides the existing functional unique index
   * `visitor_profile_username_lower_unq`, so this is an index lookup and not a
   * scan (T-07-05: exact equality, no pattern match, parameterized by Drizzle's
   * `sql` template rather than string concatenation).
   *
   * Returns `null` for an unclaimed handle (house rule: nullable for not-found);
   * the controller maps that to 404. D-05 is deliberate — there is no
   * discoverability opt-out in v1.1, so any completed profile resolves.
   */
  async lookupByUsername(callerId: string, username: string): Promise<VisitorSummary | null> {
    const [profile] = await this.db
      .select(foreignProfileColumns)
      .from(visitorProfile)
      .where(sql`lower(${visitorProfile.username}) = lower(${username})`)
      .limit(1);
    if (!profile) return null;

    const relation = await this.resolveRelation(callerId, profile.accountId);
    return { profile, relation };
  }

  /**
   * Username search (D-04b, the second access path onto the foreign view).
   * Selects through `foreignProfileColumns` — the SAME constant the handle
   * lookup uses — because a second column list here would breach VIS-02 without
   * any endpoint looking broken (T-07-07).
   *
   * Semantics, all fixed by 07-CONTEXT.md and each pinned by a case in
   * `username-search.spec.ts`:
   * - PREFIX match, case-insensitive (D-06) — a term occurring mid-username does
   *   NOT match. Substring search was deliberately rejected.
   * - `username` ONLY (D-09). `displayName` is freely chosen and not unique;
   *   searching it would promote it to a public search key, which was never
   *   decided. It appears nowhere in the `where` below.
   * - 2-character floor (D-08), enforced HERE and not in the contract, so a
   *   1-character prefix cannot reach the database by any route.
   * - Ascending by `username`, hard cap of 20 (D-08). No relevance heuristic:
   *   the order has to be reproducible and testable, and the cap keeps the cost
   *   of a search independent of how many profiles match (T-07-10).
   * - No discoverability filter (D-05): `visitor_profile` carries no such
   *   column and there is no opt-in step, so a profile is findable the moment
   *   it exists. The `where` below filters on nothing but the username prefix.
   *
   * KNOWN PROPERTY, deliberately not fixed: a B-Tree index under the default
   * collation only supports `LIKE 'prefix%'` with `text_pattern_ops`, which the
   * existing functional index `visitor_profile_username_lower_unq` does not
   * carry — Postgres falls back to a sequential scan for this query. D-06 rules
   * out any new index design (`pg_trgm` in particular), and at v1.1 data volumes
   * the difference is meaningless.
   */
  async searchByUsername(callerId: string, q: string): Promise<VisitorSummary[]> {
    const term = q.trim();
    if (term.length < 2) return [];

    // `_` and `%` are LIKE metacharacters AND `_` is inside the allowed username
    // charset `[a-z0-9_.]` — unescaped, a search for `max_muster` would also
    // return `maxXmuster` (T-07-09). Escape the escape character first, then the
    // two wildcards, and only then append the prefix placeholder.
    const pattern = `${term.toLowerCase().replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;

    const profiles = await this.db
      .select(foreignProfileColumns)
      .from(visitorProfile)
      // The value is bound as a parameter by Drizzle's `sql` template, never
      // concatenated into the statement; `escape '\'` names the escape
      // character explicitly instead of relying on the server default.
      .where(sql`lower(${visitorProfile.username}) like ${pattern} escape '\\'`)
      .orderBy(asc(visitorProfile.username))
      .limit(20);

    const relations = await this.resolveRelations(
      callerId,
      profiles.map((p) => p.accountId),
    );

    return profiles.map((profile) => ({
      profile,
      relation: relations.get(profile.accountId) ?? 'none',
    }));
  }

  /**
   * Send a friend request. Every expected conflict comes back as a branch of the
   * discriminated union and never as a thrown exception — the controller maps
   * the branches onto status codes, the same house idiom `me.service.ts` and
   * `festival.service.ts` already use.
   *
   * The interesting case is not the happy path but the collision: if A→B is open
   * and B asks A, D-10 says the friendship exists immediately. That is also the
   * resolution of the reverse-direction race, and the resolution lives in the
   * SCHEMA rather than in a lock: `friend_request_pair_pk` sits on the
   * canonically ordered pair, so a second row for the same pair is physically
   * impossible. The `23505` that fact produces is therefore not a failure — it
   * is the trigger of the auto-accept path. Both racers end up in the same
   * correct effect, which is why neither of them can lose.
   */
  async sendRequest(callerId: string, targetAccountId: string): Promise<SendRequestResult> {
    // Answered before any database access and before `canonicalPair`: two equal
    // ids would form a pair the `lower < higher` CHECK rejects.
    if (callerId === targetAccountId) return { status: 'self' };

    // Existence check only — `accountId` and nothing else. This endpoint returns
    // no profile data, so it must not READ any either (T-07-15).
    const [target] = await this.db
      .select({ accountId: visitorProfile.accountId })
      .from(visitorProfile)
      .where(eq(visitorProfile.accountId, targetAccountId))
      .limit(1);
    if (!target) return { status: 'not-found' };

    const pair = canonicalPair(callerId, targetAccountId);
    // At most two attempts. The second exists solely for the vanishing-row
    // window described in `openRequest`; bounding it means concurrent churn can
    // never spin this into a loop.
    return this.openRequest(callerId, pair, 2);
  }

  /**
   * One attempt at opening a request for an already-ordered pair, plus the
   * conflict resolution that attempt can run into.
   */
  private async openRequest(
    callerId: string,
    pair: Pair,
    attemptsLeft: number,
  ): Promise<SendRequestResult> {
    try {
      const opened = await this.db.transaction(async (tx) => {
        const [alreadyFriends] = await tx
          .select({ lowerId: friendship.lowerId })
          .from(friendship)
          .where(friendshipPair(pair))
          .limit(1);
        // Already friends: repeating is a no-op, not a penalty (D-13).
        if (alreadyFriends) return false;

        await tx.insert(friendRequest).values({ ...pair, requesterId: callerId });
        return true;
      });
      if (!opened) return { status: 'friends' };
    } catch (err) {
      const cause = postgresErrorOf(err);

      if (cause?.code === '23503') return this.foreignKeyOutcome(callerId, pair, cause);

      if (cause?.code === '23505' && cause.constraint_name === FRIEND_REQUEST_PAIR_PK) {
        const [existing] = await this.db
          .select({ requesterId: friendRequest.requesterId })
          .from(friendRequest)
          .where(friendRequestPair(pair))
          .limit(1);

        // The caller's own request is already open: idempotent, no error, no
        // second row, no cost for repeating (D-11/D-13).
        if (existing?.requesterId === callerId) return { status: 'requested' };

        if (existing) {
          // The COUNTER-request — D-10's auto-accept. `sealFriendship` deletes
          // CONDITIONALLY on the request still being the other side's, so the
          // window between the read above and the transaction is closed the
          // same way `acceptRequest`'s is (WR-01): a withdraw that commits in
          // between leaves nothing to delete, and no friendship is invented for
          // an intent that was provably revoked.
          const sealed = await this.sealFriendship(pair, callerId);
          if (sealed.status === 'friends') return sealed;
          // Fell through because the counter-request vanished in that window —
          // which is exactly the situation the branch below handles.
        }

        // The row that blocked the insert is gone again: between the violation
        // and this read the other side withdrew, declined, or an accept resolved
        // the pair. Retry rather than report a state that no longer holds.
        if (attemptsLeft > 1) return this.openRequest(callerId, pair, attemptsLeft - 1);
        return (await this.areFriends(pair)) ? { status: 'friends' } : { status: 'requested' };
      }

      throw err;
    }

    // Race-window re-check. Postgres runs READ COMMITTED here, so a concurrent
    // `accept` (or a counter-request's auto-accept) can commit between the
    // friendship check above and this insert. Without this, a redundant request
    // row would be left lying next to an existing friendship — the one state
    // both tables must never be in at the same time.
    if (await this.areFriends(pair)) {
      await this.db.delete(friendRequest).where(friendRequestPair(pair));
      return { status: 'friends' };
    }

    return { status: 'requested' };
  }

  /**
   * Which side of the pair the failed foreign key belongs to (WR-02).
   *
   * Three FKs can fire on the `friend_request` insert and they carry opposite
   * meanings, so collapsing them onto one answer told a caller who demonstrably
   * HAS a profile to "complete your visitor profile" (409) when it was in fact
   * the target's profile that had disappeared (404). `me.service.ts`
   * discriminates its two 23505s by `constraint_name` for exactly this reason.
   *
   * If the driver hands over no usable constraint name, the question is asked
   * directly instead of guessed — one indexed lookup, on an error path only.
   */
  private async foreignKeyOutcome(
    callerId: string,
    pair: Pair,
    cause: PostgresError,
  ): Promise<SendRequestResult> {
    const callerIsLower = pair.lowerId === callerId;
    const callerFk = callerIsLower ? FRIEND_REQUEST_LOWER_FK : FRIEND_REQUEST_HIGHER_FK;
    const targetFk = callerIsLower ? FRIEND_REQUEST_HIGHER_FK : FRIEND_REQUEST_LOWER_FK;

    if (cause.constraint_name === targetFk) return { status: 'not-found' };
    if (
      cause.constraint_name === callerFk ||
      cause.constraint_name === FRIEND_REQUEST_REQUESTER_FK
    ) {
      // An unfinished first login — the same answer `FestivalService.save`
      // gives for `my_festival`.
      return { status: 'profile-required' };
    }

    const [callerProfile] = await this.db
      .select({ accountId: visitorProfile.accountId })
      .from(visitorProfile)
      .where(eq(visitorProfile.accountId, callerId))
      .limit(1);
    return callerProfile ? { status: 'not-found' } : { status: 'profile-required' };
  }

  /**
   * Accept the INCOMING request from that visitor.
   *
   * "No request at all" and "the only request is your own outgoing one" get the
   * SAME `not-found`: you cannot accept what you sent (T-07-13), and the answer
   * deliberately does not let a caller tell the two situations apart (T-07-15).
   *
   * WR-01: there is deliberately NO pre-flight read here. Reading the request
   * row outside the transaction and then sealing unconditionally left a window
   * in which the requester could withdraw between the two — the delete removed
   * zero rows, the insert ran anyway, and the withdrawal was silently overruled
   * into a friendship. The condition now travels INTO the delete, so "is there
   * an incoming request" and "consume it" are the same atomic statement.
   */
  async acceptRequest(callerId: string, targetAccountId: string): Promise<AcceptRequestResult> {
    if (callerId === targetAccountId) return { status: 'not-found' };
    return this.sealFriendship(canonicalPair(callerId, targetAccountId), callerId);
  }

  /**
   * Turn an open request into a friendship: delete the request row and insert
   * the friendship in ONE transaction, so no reader can observe the pair with
   * neither of the two — the invariant "no request row for a pair that is
   * already friends" holds at every instant, not just at rest.
   *
   * Shared deliberately by `acceptRequest` and by the auto-accept branch of
   * `openRequest`: D-10 makes the counter-request the very same transition as an
   * explicit accept, and duplicating the write would be the second code path
   * this phase exists to avoid.
   *
   * The delete is the CHECK (WR-01). `ne(requesterId, callerId)` is part of the
   * DELETE condition, never a pre-flight, so:
   * - a request the caller sent themselves is not matched, is not consumed, and
   *   yields `not-found` (T-07-13);
   * - a request that no longer exists — withdrawn or declined a microsecond ago
   *   — yields `not-found` too, and NOT a friendship;
   * - and both are the same answer as "no request at all" (T-07-15).
   *
   * Zero deleted rows therefore means "there was nothing of the other side's to
   * accept", and the friendship insert is skipped.
   */
  private async sealFriendship(pair: Pair, callerId: string): Promise<AcceptRequestResult> {
    try {
      const sealed = await this.db.transaction(async (tx) => {
        const consumed = await tx
          .delete(friendRequest)
          .where(and(friendRequestPair(pair), ne(friendRequest.requesterId, callerId)))
          .returning({ requesterId: friendRequest.requesterId });
        if (consumed.length === 0) return false;
        // An existing friendship makes accepting idempotent instead of an error.
        await tx.insert(friendship).values(pair).onConflictDoNothing();
        return true;
      });
      if (!sealed) return { status: 'not-found' };
    } catch (err) {
      const cause = postgresErrorOf(err);
      // Truly parallel case: the other flow already wrote the friendship. That
      // is the outcome this method wanted, so it is a success, not a 500. The
      // `onConflictDoNothing` above makes the branch hard to reach; naming the
      // constraint means dropping that clause later would degrade to `friends`
      // rather than surface as an unhandled error.
      if (!(cause?.code === '23505' && cause.constraint_name === FRIENDSHIP_PAIR_PK)) throw err;
    }
    return { status: 'friends' };
  }

  /**
   * Decline the incoming request. `requesterId <> callerId` is part of the
   * DELETE condition and not a pre-flight check, so no window exists in which a
   * caller could decline their own outgoing request (T-07-13).
   *
   * Always `removed`, even when nothing was deleted (T-07-15). D-12 leaves no
   * status row and no history, and D-11 means the other side may ask again
   * immediately — declining is a statement about the request, not the person.
   */
  async declineRequest(callerId: string, targetAccountId: string): Promise<RemoveRequestResult> {
    if (callerId === targetAccountId) return { status: 'removed' };
    const pair = canonicalPair(callerId, targetAccountId);

    await this.db
      .delete(friendRequest)
      .where(and(friendRequestPair(pair), ne(friendRequest.requesterId, callerId)));

    return { status: 'removed' };
  }

  /** Mirror image of {@link declineRequest}: only the caller's OWN outgoing request. */
  async withdrawRequest(callerId: string, targetAccountId: string): Promise<RemoveRequestResult> {
    if (callerId === targetAccountId) return { status: 'removed' };
    const pair = canonicalPair(callerId, targetAccountId);

    await this.db
      .delete(friendRequest)
      .where(and(friendRequestPair(pair), eq(friendRequest.requesterId, callerId)));

    return { status: 'removed' };
  }

  /**
   * The friend list (D-04d) — the fourth and last access path onto the foreign
   * view, and the one that makes the symmetry of D-14 visible.
   *
   * There is ONE row per friendship and no mirror row, so the list cannot be a
   * plain `where`: the join condition has to find the caller in whichever of the
   * two pair columns holds them and resolve the OTHER one as the counterpart.
   * That single condition filters and selects at the same time, which is exactly
   * why a second row was never needed — both parties read the same row from
   * their own side, and unfriending therefore takes effect for both with one
   * DELETE.
   *
   * Selected through `foreignProfileColumns` and shaped through
   * `pickForeignProfile`, like every other D-04 path (VIS-02). The extra column
   * is the pair's `createdAt`, converted explicitly by `toIsoString` because the
   * contract transports timestamps as strings and leaving that to
   * `JSON.stringify` would let the type lie about the wire shape.
   *
   * Ascending by `username` — the same order the search uses, so the sequence is
   * reproducible and Phase 8 can assert against it. An empty result is `[]`.
   */
  async listFriends(callerId: string): Promise<Friend[]> {
    const rows = await this.db
      .select({ ...foreignProfileColumns, friendsSince: friendship.createdAt })
      .from(visitorProfile)
      .innerJoin(
        friendship,
        or(
          and(eq(friendship.lowerId, callerId), eq(visitorProfile.accountId, friendship.higherId)),
          and(eq(friendship.higherId, callerId), eq(visitorProfile.accountId, friendship.lowerId)),
        ),
      )
      .orderBy(asc(visitorProfile.username));

    return rows.map((row) => ({
      profile: pickForeignProfile(row),
      friendsSince: toIsoString(row.friendsSince),
    }));
  }

  /**
   * The festival-scoped friend list (FRND-07, D-18) — the intersection of
   * {@link listFriends} and "saved this `festivalId`". Same counterpart-
   * resolving join on `friendship` as `listFriends`, plus exactly ONE more
   * `innerJoin` on `myFestival` that requires the COUNTERPART (not the caller)
   * to have saved the given festival.
   *
   * Both scopes live INSIDE the join condition, not in a filter applied after
   * the fact: `callerId` comes from the session (the join's `friendship` half)
   * and `festivalId` comes from the path (the join's `myFestival` half). There
   * is no third parameter, so there is no value a client could supply to read
   * another visitor's intersection (T-09-04, same "client-supplied scope"
   * pattern `listFriends`/`unfriend` already use).
   *
   * `myFestival` contributes NOTHING to the `select` — it is a pure filter.
   * Selecting its `savedAt` would be a weak arrival signal ADR-014 forbids
   * (T-09-06); selecting `festivalId` or `visitorId` would leak the join key
   * itself. Both are prohibited by `must_haves.prohibitions` in 09-02-PLAN.md.
   *
   * Same `foreignProfileColumns`/`pickForeignProfile` projection as every other
   * D-04 path (VIS-02) and the same `orderBy(username)` as `listFriends`, so
   * the response shape and ordering are identical to the unscoped list.
   */
  async listFriendsInFestival(callerId: string, festivalId: string): Promise<Friend[]> {
    const rows = await this.db
      .select({ ...foreignProfileColumns, friendsSince: friendship.createdAt })
      .from(visitorProfile)
      .innerJoin(
        friendship,
        or(
          and(eq(friendship.lowerId, callerId), eq(visitorProfile.accountId, friendship.higherId)),
          and(eq(friendship.higherId, callerId), eq(visitorProfile.accountId, friendship.lowerId)),
        ),
      )
      .innerJoin(
        myFestival,
        and(eq(myFestival.visitorId, visitorProfile.accountId), eq(myFestival.festivalId, festivalId)),
      )
      .orderBy(asc(visitorProfile.username));

    return rows.map((row) => ({
      profile: pickForeignProfile(row),
      friendsSince: toIsoString(row.friendsSince),
    }));
  }

  /**
   * Both pending directions (D-04c), in one query and one round-trip.
   *
   * Same counterpart-resolving join as {@link listFriends}, plus `requesterId`.
   * The partition is done in JavaScript and it is a single comparison: the row
   * is OUTGOING when the caller sent it, INCOMING otherwise. D-12 gives this
   * table no status column, so there is nothing else that could be consulted
   * here — and nothing that could contradict the direction later.
   *
   * The partition is per-caller, not a property of the row: the very same row is
   * outgoing for one side and incoming for the other. Both lists are always
   * arrays; "no requests" is two empty ones, not a 404.
   */
  async listRequests(callerId: string): Promise<FriendRequestLists> {
    const rows = await this.db
      .select({
        ...foreignProfileColumns,
        requesterId: friendRequest.requesterId,
        requestedAt: friendRequest.createdAt,
      })
      .from(visitorProfile)
      .innerJoin(
        friendRequest,
        or(
          and(
            eq(friendRequest.lowerId, callerId),
            eq(visitorProfile.accountId, friendRequest.higherId),
          ),
          and(
            eq(friendRequest.higherId, callerId),
            eq(visitorProfile.accountId, friendRequest.lowerId),
          ),
        ),
      )
      .orderBy(asc(visitorProfile.username));

    const incoming: FriendRequestItem[] = [];
    const outgoing: FriendRequestItem[] = [];
    for (const row of rows) {
      const item: FriendRequestItem = {
        profile: pickForeignProfile(row),
        requestedAt: toIsoString(row.requestedAt),
      };
      (row.requesterId === callerId ? outgoing : incoming).push(item);
    }
    return { incoming, outgoing };
  }

  /**
   * End the friendship. One deleted row ends it for BOTH sides — there is no
   * mirror row that could be forgotten (D-14), which is the whole payoff of the
   * canonical pair.
   *
   * Always `removed`, even when nothing was deleted: idempotent, and the answer
   * carries no evidence that there was a friendship to end (T-07-21). A pair the
   * caller is not part of is not addressable at all, because the caller always
   * supplies one of the two halves (T-07-20).
   *
   * Unfriending leaves NO request row behind — it ends the relationship, it does
   * not reopen a pending one.
   */
  async unfriend(callerId: string, targetAccountId: string): Promise<RemoveFriendshipResult> {
    // Answered before `canonicalPair`, like every other pair path: two equal ids
    // would form a pair the ordering CHECK rejects.
    if (callerId === targetAccountId) return { status: 'removed' };
    const pair = canonicalPair(callerId, targetAccountId);

    await this.db.delete(friendship).where(friendshipPair(pair));

    return { status: 'removed' };
  }

  private async areFriends(pair: Pair): Promise<boolean> {
    const [row] = await this.db
      .select({ lowerId: friendship.lowerId })
      .from(friendship)
      .where(friendshipPair(pair))
      .limit(1);
    return Boolean(row);
  }
}
