import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm';
import { friendRequest, friendship, visitorProfile, type Database } from '@quiks/db';
import type { Relation, VisitorSummary } from '@quiks/contracts';

import { DB } from '../db/db.module';
import { foreignProfileColumns } from './visitor-projection';

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
}
