import { randomUUID } from 'node:crypto';

import { and, eq, inArray, or } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { friendRequest, friendship, user, visitorProfile, type Database } from '@quiks/db';

import { FriendshipService } from '../src/friendship/friendship.service';
import { canonicalPair } from '../src/friendship/visitor-projection';
import { createTestDatabase } from './setup';

/** One random, charset-valid stem per run so repeated runs never collide. */
const RUN = randomUUID().replace(/-/g, '').slice(0, 8);

type Actor = { accountId: string; username: string; displayName: string };

/**
 * `letter` is the LAST character of the username and therefore decides the
 * alphabetical position. It is deliberately NOT the insertion order (see below):
 * a sort test against fixtures that are already inserted in the right order
 * proves nothing.
 */
function actor(label: string, letter: string): Actor {
  return {
    accountId: `test-friend-lists-${label}-${randomUUID()}`,
    username: `q${RUN}${letter}`,
    displayName: `Lists ${label.toUpperCase()}`,
  };
}

/**
 * A is the visitor whose lists are under test. Insertion order is A, B, C, D, E;
 * the alphabetical order of the usernames is E(b) < C(d) < A(m) < B(t) < D(w).
 * A's two friends are therefore inserted as B, C but must come back as C, B.
 */
const A = actor('a', 'm');
const B = actor('b', 't');
const C = actor('c', 'd');
const D = actor('d', 'w');
const E = actor('e', 'b');

const allAccounts = [A, B, C, D, E];
const allAccountIds = allAccounts.map((a) => a.accountId);

/**
 * The two list endpoints and unfriending, against the live local Postgres.
 *
 * The load-bearing claim is SYMMETRY: `friendship` holds ONE row per pair with
 * no mirror row (D-14), so the list has to resolve that single row from either
 * party's side. Case 2 is the proof — it reads the very same row case 1 read,
 * from the other perspective, and it is deliberately NOT prepared by a second
 * insert. Case 8 is its consequence: one DELETE ends the friendship for both.
 *
 * Every fixture is built through the 07-03 lifecycle methods rather than by
 * hand-setting rows, so the specs assert against relationships that came into
 * being the way production ones do.
 *
 * Service-level throughout — no HTTP and no OTP sign-in, so better-auth's rate
 * limiter (3 requests/60s per source) is never touched. The HTTP layer of these
 * lists is covered in plan 07-05 together with the VIS-01 absence proof.
 */
describe('friend list, request lists & unfriending (D-04c/D-04d, D-12, D-14)', () => {
  let db: Database;
  let service: FriendshipService;

  const friendshipRows = (a: string, b: string) => {
    const pair = canonicalPair(a, b);
    return db
      .select({ lowerId: friendship.lowerId, higherId: friendship.higherId })
      .from(friendship)
      .where(and(eq(friendship.lowerId, pair.lowerId), eq(friendship.higherId, pair.higherId)));
  };

  const requestRows = (a: string, b: string) => {
    const pair = canonicalPair(a, b);
    return db
      .select({ requesterId: friendRequest.requesterId })
      .from(friendRequest)
      .where(and(eq(friendRequest.lowerId, pair.lowerId), eq(friendRequest.higherId, pair.higherId)));
  };

  beforeAll(async () => {
    db = createTestDatabase();
    service = new FriendshipService(db);

    await db.insert(user).values(
      allAccounts.map((a) => ({
        id: a.accountId,
        name: a.displayName,
        email: `${a.accountId}@quiks.dev`,
      })),
    );
    await db.insert(visitorProfile).values(
      allAccounts.map((a) => ({
        accountId: a.accountId,
        username: a.username,
        displayName: a.displayName,
      })),
    );

    // Fixtures via the real transitions (07-03), never a hand-written row: the
    // ONE friendship row per pair is produced by `sealFriendship`, which is what
    // makes the symmetry claim in case 2 a claim about production behaviour.
    await service.sendRequest(A.accountId, B.accountId);
    await service.acceptRequest(B.accountId, A.accountId);
    await service.sendRequest(A.accountId, C.accountId);
    await service.acceptRequest(C.accountId, A.accountId);
    // Left pending on purpose — one in each direction as seen from A.
    await service.sendRequest(A.accountId, D.accountId);
    await service.sendRequest(E.accountId, A.accountId);
  });

  afterAll(async () => {
    // Dependency order: relation rows, then the profiles they reference, then
    // the throwaway accounts. Seed data is never touched.
    await db
      .delete(friendship)
      .where(
        or(inArray(friendship.lowerId, allAccountIds), inArray(friendship.higherId, allAccountIds)),
      );
    await db
      .delete(friendRequest)
      .where(
        or(
          inArray(friendRequest.lowerId, allAccountIds),
          inArray(friendRequest.higherId, allAccountIds),
        ),
      );
    await db.delete(visitorProfile).where(inArray(visitorProfile.accountId, allAccountIds));
    await db.delete(user).where(inArray(user.id, allAccountIds));
  });

  it('1. A’s friend list holds exactly B and C — and never A themself', async () => {
    const friends = await service.listFriends(A.accountId);
    expect(friends).toHaveLength(2);

    const ids = friends.map((f) => f.profile.accountId);
    expect(ids).toEqual(expect.arrayContaining([B.accountId, C.accountId]));
    // The join resolves the COUNTERPART; the caller appearing in their own list
    // would mean the condition selected the wrong half of the pair.
    expect(ids).not.toContain(A.accountId);
  });

  it('2. B’s friend list holds A — the same single row, read from the other side', async () => {
    // No second insert prepared this. `friendship` has one row for the A/B pair
    // and no mirror row (D-14), so this is the symmetry proof: the join found
    // B in the OTHER pair column and resolved A as the counterpart.
    const friends = await service.listFriends(B.accountId);
    expect(friends).toHaveLength(1);
    expect(friends[0]?.profile.accountId).toBe(A.accountId);

    expect(await friendshipRows(A.accountId, B.accountId)).toHaveLength(1);
  });

  it('3. every entry carries exactly the six foreign-view fields and a string friendsSince', async () => {
    const friends = await service.listFriends(A.accountId);
    expect(friends).toHaveLength(2);

    for (const entry of friends) {
      // Six and not seven: `birthDate` is owner-only (D-02/D-03), and a list is
      // exactly where an extra field slips in unnoticed.
      expect(Object.keys(entry.profile)).toHaveLength(6);
      expect(typeof entry.friendsSince).toBe('string');
      expect(Number.isNaN(Date.parse(entry.friendsSince))).toBe(false);
    }
  });

  it('4. the friend list is ascending by username', async () => {
    const friends = await service.listFriends(A.accountId);
    const usernames = friends.map((f) => f.profile.username);

    // Against a sorted copy, not a hardcoded sequence — the fixtures were
    // inserted as B(t), C(d), so an unordered query would return them that way.
    expect(usernames).toEqual([...usernames].sort());
    expect(usernames).toEqual([C.username, B.username]);
  });

  it('5. A’s requests split by direction: D outgoing, E incoming, neither in both', async () => {
    const lists = await service.listRequests(A.accountId);

    expect(lists.outgoing.map((r) => r.profile.accountId)).toEqual([D.accountId]);
    expect(lists.incoming.map((r) => r.profile.accountId)).toEqual([E.accountId]);

    const outgoingIds = new Set(lists.outgoing.map((r) => r.profile.accountId));
    for (const entry of lists.incoming) {
      expect(outgoingIds.has(entry.profile.accountId)).toBe(false);
    }
    for (const entry of [...lists.incoming, ...lists.outgoing]) {
      expect(Object.keys(entry.profile)).toHaveLength(6);
      expect(typeof entry.requestedAt).toBe('string');
    }
  });

  it('6. the same request row is INCOMING for D — the partition is per-caller (D-12)', async () => {
    const lists = await service.listRequests(D.accountId);

    expect(lists.incoming.map((r) => r.profile.accountId)).toEqual([A.accountId]);
    expect(lists.outgoing).toEqual([]);
  });

  it('7. no friends is [], no requests is two empty arrays — never null, never an error', async () => {
    // D was asked but never accepted, so D has no friends; B and C are friends
    // with A and have nothing pending.
    expect(await service.listFriends(D.accountId)).toEqual([]);
    expect(await service.listRequests(B.accountId)).toEqual({ incoming: [], outgoing: [] });
  });

  it('8. unfriending A/B takes effect on BOTH sides with one deleted row', async () => {
    const result = await service.unfriend(A.accountId, B.accountId);
    expect(result.status).toBe('removed');

    // A keeps C, loses B...
    const aFriends = await service.listFriends(A.accountId);
    expect(aFriends.map((f) => f.profile.accountId)).toEqual([C.accountId]);
    // ...and B, who never called anything, is left with an empty list. There was
    // no second row to delete, which is exactly the point of D-14.
    expect(await service.listFriends(B.accountId)).toEqual([]);
  });

  it('9. unfriending again answers the same and does not throw (idempotent)', async () => {
    const result = await service.unfriend(A.accountId, B.accountId);
    expect(result.status).toBe('removed');
    expect(await friendshipRows(A.accountId, B.accountId)).toHaveLength(0);
  });

  it('10. unfriending someone who was never a friend changes nothing', async () => {
    // A and D have an OPEN request between them and no friendship. The answer is
    // the same `removed` either way (T-07-21) and nothing may be touched —
    // least of all the pending request, which belongs to the other table.
    const result = await service.unfriend(A.accountId, D.accountId);
    expect(result.status).toBe('removed');

    expect((await service.listFriends(A.accountId)).map((f) => f.profile.accountId)).toEqual([
      C.accountId,
    ]);
    expect(await requestRows(A.accountId, D.accountId)).toHaveLength(1);
  });

  it('11. unfriending leaves no friendship row and creates no pending request', async () => {
    expect(await friendshipRows(A.accountId, B.accountId)).toHaveLength(0);
    // Ending a friendship is not a demotion back to "requested" — the pair holds
    // nothing at all afterwards.
    expect(await requestRows(A.accountId, B.accountId)).toHaveLength(0);
  });
});
