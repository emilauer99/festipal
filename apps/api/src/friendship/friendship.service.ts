import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { friendRequest, friendship, visitorProfile, type Database } from '@quiks/db';
import type { Relation, VisitorSummary } from '@quiks/contracts';

import { DB } from '../db/db.module';
import { canonicalPair, foreignProfileColumns } from './visitor-projection';

@Injectable()
export class FriendshipService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /**
   * The caller's relation to a target account (D-07). Reads the canonical pair
   * once from each table — no mirror rows exist, so there is no second
   * direction to check (D-14). Direction of a pending request comes solely from
   * `friend_request.requesterId`, since D-12 gives that table no status column.
   */
  async resolveRelation(callerId: string, targetAccountId: string): Promise<Relation> {
    // Self-adjacency is a relation, not an error — and it must be answered
    // BEFORE canonicalPair, whose output would violate the `lower < higher`
    // CHECK for two equal ids.
    if (callerId === targetAccountId) return 'self';

    const { lowerId, higherId } = canonicalPair(callerId, targetAccountId);

    const [friend] = await this.db
      .select({ lowerId: friendship.lowerId })
      .from(friendship)
      .where(and(eq(friendship.lowerId, lowerId), eq(friendship.higherId, higherId)))
      .limit(1);
    if (friend) return 'friends';

    const [pending] = await this.db
      .select({ requesterId: friendRequest.requesterId })
      .from(friendRequest)
      .where(and(eq(friendRequest.lowerId, lowerId), eq(friendRequest.higherId, higherId)))
      .limit(1);
    if (!pending) return 'none';

    return pending.requesterId === callerId ? 'requestOutgoing' : 'requestIncoming';
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
}
