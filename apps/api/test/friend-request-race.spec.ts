import { randomUUID } from 'node:crypto';

import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { friendRequest, friendship, user, visitorProfile, type Database } from '@quiks/db';

import { FriendshipService } from '../src/friendship/friendship.service';
import { canonicalPair } from '../src/friendship/visitor-projection';
import { collationConflictingAccountIds, testAccountId } from './account-ids';
import { createTestDatabase } from './setup';

/**
 * One random, charset-valid stem per run so repeated runs never collide and no
 * seed row can satisfy a fixture assertion by accident.
 */
const RUN = randomUUID().replace(/-/g, '').slice(0, 8);

/** Owner-only value — set on one fixture so later plans have a profile that carries one. */
const FIXTURE_BIRTH_DATE = '1991-07-23';

type Actor = { accountId: string; username: string; displayName: string; birthDate?: string };

/**
 * WR-04: the id is MIXED CASE, like a real better-auth id — not the lowercase
 * hex `randomUUID()` produced. See `account-ids.ts` for why that is the
 * difference between exercising `canonicalPair` and only pretending to.
 */
function actor(label: string, birthDate?: string): Actor {
  return {
    accountId: testAccountId(`test-friend-request-race-${label}`),
    username: `q${RUN}${label}`,
    displayName: `Race ${label.toUpperCase()}`,
    birthDate,
  };
}

/** A/B walk the whole happy path; C..H each own one transition so no case can leak into another. */
const A = actor('a', FIXTURE_BIRTH_DATE);
const B = actor('b');
const C = actor('c');
const D = actor('d');
const E = actor('e');
const F = actor('f');
const G = actor('g');
const H = actor('h');
/** The ninth account: a `user` row with NO `visitor_profile` — first login, not finished. */
const NO_PROFILE = actor('np');

/**
 * CR-01's regression pair: two ids that `canonicalPair` orders one way and a
 * locale collation (`en_US.utf8`, the local dev database) orders the other. The
 * lifecycle in case 13 is the ONLY place in this suite where JavaScript's
 * ordering and the CHECK's ordering are made to disagree — every other fixture
 * pair differs at a lowercase character, where the two agree by accident.
 */
const [MIXED_JS_LOWER, MIXED_JS_HIGHER] = collationConflictingAccountIds(
  'test-friend-request-race-collation',
);
const I: Actor = {
  accountId: MIXED_JS_LOWER,
  username: `q${RUN}i`,
  displayName: 'Race I',
};
const J: Actor = {
  accountId: MIXED_JS_HIGHER,
  username: `q${RUN}j`,
  displayName: 'Race J',
};

/** WR-01: K/L own the withdraw-then-accept sequence, M/N the same two racing. */
const K = actor('k');
const L = actor('l');
const M = actor('m');
const N = actor('n');
/** WR-02: O's profile is deleted mid-flight so the TARGET column's FK is the one that fires. */
const O = actor('o');

const withProfile = [A, B, C, D, E, F, G, H, I, J, K, L, M, N, O];
const allAccounts = [...withProfile, NO_PROFILE];
const allAccountIds = allAccounts.map((a) => a.accountId);

/**
 * The full friend-request lifecycle against the live local Postgres, and with it
 * the race the ROADMAP marks for this phase: A→B and B→A at the same time must
 * not produce two rows and must not produce two friendships.
 *
 * The resolution is not in application logic — it is in the schema. The
 * composite PK on the canonically ordered pair (D-14) makes a second row
 * physically impossible, so the `23505` it raises is not a failure but the
 * TRIGGER of D-10's auto-accept. Both racers therefore end in the same correct
 * effect, which is why neither can lose. Case 5 runs that genuinely in parallel;
 * case 3 runs the same collision sequentially.
 *
 * Every case asserts the actual ROW STATE, not just the return value: the return
 * value of the losing racer is legitimately non-deterministic, the database
 * state is not.
 *
 * Service-level throughout — no HTTP and no OTP sign-in, so better-auth's rate
 * limiter (3 requests/60s per source) is never touched.
 */
describe('friend-request lifecycle & reverse-direction race (D-10/D-11/D-12/D-13)', () => {
  let db: Database;
  let service: FriendshipService;

  const requestRows = (a: string, b: string) => {
    const pair = canonicalPair(a, b);
    return db
      .select({
        lowerId: friendRequest.lowerId,
        higherId: friendRequest.higherId,
        requesterId: friendRequest.requesterId,
      })
      .from(friendRequest)
      .where(and(eq(friendRequest.lowerId, pair.lowerId), eq(friendRequest.higherId, pair.higherId)));
  };

  const friendshipRows = (a: string, b: string) => {
    const pair = canonicalPair(a, b);
    return db
      .select({ lowerId: friendship.lowerId, higherId: friendship.higherId })
      .from(friendship)
      .where(and(eq(friendship.lowerId, pair.lowerId), eq(friendship.higherId, pair.higherId)));
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
    // NO_PROFILE deliberately gets no row here — both pair columns and
    // `requesterId` FK onto `visitor_profile.accountId`, which is what makes
    // case 11 a schema-level answer rather than a hand-written pre-check.
    await db.insert(visitorProfile).values(
      withProfile.map((a) => ({
        accountId: a.accountId,
        username: a.username,
        displayName: a.displayName,
        birthDate: a.birthDate ?? null,
      })),
    );
  });

  afterAll(async () => {
    // Dependency order: the relation rows first, then the profiles they
    // reference, then the throwaway accounts. Seed data is never touched.
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

  it('1. A→B opens exactly one request row, owned by A, and no friendship', async () => {
    const result = await service.sendRequest(A.accountId, B.accountId);
    expect(result.status).toBe('requested');

    const requests = await requestRows(A.accountId, B.accountId);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.requesterId).toBe(A.accountId);
    expect(await friendshipRows(A.accountId, B.accountId)).toHaveLength(0);
  });

  it('2. A→B again is idempotent — no throw, same answer, still one row (D-11/D-13)', async () => {
    const result = await service.sendRequest(A.accountId, B.accountId);
    expect(result.status).toBe('requested');

    const requests = await requestRows(A.accountId, B.accountId);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.requesterId).toBe(A.accountId);
  });

  it('3. the counter-request B→A becomes the friendship at once and DISSOLVES the request (D-10)', async () => {
    const result = await service.sendRequest(B.accountId, A.accountId);
    expect(result.status).toBe('friends');

    expect(await friendshipRows(A.accountId, B.accountId)).toHaveLength(1);
    // Not just "a friendship exists" — the request row has to be GONE, or the
    // two tables would contradict each other (D-12: no status, no history).
    expect(await requestRows(A.accountId, B.accountId)).toHaveLength(0);
  });

  it('4. asking an existing friend answers friends without a new request or a second friendship', async () => {
    const result = await service.sendRequest(A.accountId, B.accountId);
    expect(result.status).toBe('friends');

    expect(await requestRows(A.accountId, B.accountId)).toHaveLength(0);
    expect(await friendshipRows(A.accountId, B.accountId)).toHaveLength(1);
  });

  it('5. C→D and D→C truly in parallel: one friendship, no request, neither call rejects', async () => {
    // Two genuinely concurrent flows on separate pooled connections. The return
    // values are deliberately NOT pinned to a combination — which flow inserts
    // first is not deterministic, so the invariant is asserted on the database.
    const results = await Promise.all([
      service.sendRequest(C.accountId, D.accountId),
      service.sendRequest(D.accountId, C.accountId),
    ]);
    for (const result of results) {
      expect(['requested', 'friends']).toContain(result.status);
    }

    expect(await friendshipRows(C.accountId, D.accountId)).toHaveLength(1);
    expect(await requestRows(C.accountId, D.accountId)).toHaveLength(0);
  });

  it('6. E cannot accept their OWN outgoing request; F can, and that clears it', async () => {
    expect((await service.sendRequest(E.accountId, F.accountId)).status).toBe('requested');

    const ownAccept = await service.acceptRequest(E.accountId, F.accountId);
    expect(ownAccept.status).toBe('not-found');
    // The refusal must not consume the request either.
    expect(await requestRows(E.accountId, F.accountId)).toHaveLength(1);
    expect(await friendshipRows(E.accountId, F.accountId)).toHaveLength(0);

    const accept = await service.acceptRequest(F.accountId, E.accountId);
    expect(accept.status).toBe('friends');
    expect(await friendshipRows(E.accountId, F.accountId)).toHaveLength(1);
    expect(await requestRows(E.accountId, F.accountId)).toHaveLength(0);
  });

  it('7. H declines G’s request; a second decline answers the same, not a 404 (D-12)', async () => {
    expect((await service.sendRequest(G.accountId, H.accountId)).status).toBe('requested');

    const declined = await service.declineRequest(H.accountId, G.accountId);
    expect(declined.status).toBe('removed');
    expect(await requestRows(G.accountId, H.accountId)).toHaveLength(0);
    expect(await friendshipRows(G.accountId, H.accountId)).toHaveLength(0);

    // Same payload with nothing left to delete — the answer carries no evidence
    // that there ever was something (T-07-15).
    const again = await service.declineRequest(H.accountId, G.accountId);
    expect(again.status).toBe('removed');
  });

  it('8. asking again right after a decline works (D-11); only the requester can withdraw', async () => {
    // No cooldown, no lock: declining is a statement about the request, not the person.
    expect((await service.sendRequest(G.accountId, H.accountId)).status).toBe('requested');
    expect(await requestRows(G.accountId, H.accountId)).toHaveLength(1);

    // H did not send it, so H's withdraw is a no-op — and says so with the same
    // payload as a successful one (T-07-13/T-07-15).
    const foreignWithdraw = await service.withdrawRequest(H.accountId, G.accountId);
    expect(foreignWithdraw.status).toBe('removed');
    expect(await requestRows(G.accountId, H.accountId)).toHaveLength(1);

    const ownWithdraw = await service.withdrawRequest(G.accountId, H.accountId);
    expect(ownWithdraw.status).toBe('removed');
    expect(await requestRows(G.accountId, H.accountId)).toHaveLength(0);
  });

  it('9. asking yourself answers self and writes nothing', async () => {
    const result = await service.sendRequest(A.accountId, A.accountId);
    expect(result.status).toBe('self');
    expect(await requestRows(A.accountId, A.accountId)).toHaveLength(0);
  });

  it('10. asking an account that does not exist answers not-found', async () => {
    const result = await service.sendRequest(A.accountId, `test-friend-request-race-ghost-${randomUUID()}`);
    expect(result.status).toBe('not-found');
  });

  it('11. a caller without a completed profile answers profile-required, it does not throw', async () => {
    const result = await service.sendRequest(NO_PROFILE.accountId, B.accountId);
    expect(result.status).toBe('profile-required');
    expect(await requestRows(NO_PROFILE.accountId, B.accountId)).toHaveLength(0);
  });

  it('12. after every transition, no pair holds a request row AND a friendship row', async () => {
    const contradictions = await db
      .select({ lowerId: friendRequest.lowerId, higherId: friendRequest.higherId })
      .from(friendRequest)
      .innerJoin(
        friendship,
        and(
          eq(friendship.lowerId, friendRequest.lowerId),
          eq(friendship.higherId, friendRequest.higherId),
        ),
      )
      .where(inArray(friendRequest.lowerId, allAccountIds));

    expect(contradictions).toEqual([]);
  });

  it('13. a pair whose JS order contradicts the DB collation runs the whole lifecycle (CR-01)', async () => {
    // Non-vacuum guards. This case only tests anything as long as the fixture
    // really is the divergent one, so both halves of the divergence are stated
    // as assertions rather than assumed from the id literals.
    //
    // (a) JavaScript — `canonicalPair` uses exactly this comparison.
    expect(I.accountId < J.accountId).toBe(true);
    // (b) The database, under the collation the CHECK is now pinned to. Byte
    // order and JS code-unit order agree for ASCII ids, which is WHY `COLLATE
    // "C"` is the correct pin. The database's DEFAULT collation is deliberately
    // NOT asserted: on the local dev Postgres (`en_US.utf8`) it disagrees —
    // that disagreement IS the bug — while on a `C`/`C.UTF-8` database (Neon)
    // it agrees, and this case must pass in both.
    const [order] = (await db.execute(
      sql`select (${I.accountId} collate "C" < ${J.accountId} collate "C") as byte_order`,
    )) as unknown as Array<{ byte_order: boolean }>;
    expect(order?.byte_order).toBe(true);

    const sent = await service.sendRequest(I.accountId, J.accountId);
    expect(sent.status).toBe('requested');
    expect(await requestRows(I.accountId, J.accountId)).toHaveLength(1);

    // `sealFriendship` writes the same pair into the OTHER table, so accepting
    // exercises `friendship_pair_order_chk` as well as the request one.
    const accepted = await service.acceptRequest(J.accountId, I.accountId);
    expect(accepted.status).toBe('friends');
    expect(await friendshipRows(I.accountId, J.accountId)).toHaveLength(1);
    expect(await requestRows(I.accountId, J.accountId)).toHaveLength(0);

    const removed = await service.unfriend(J.accountId, I.accountId);
    expect(removed.status).toBe('removed');
    expect(await friendshipRows(I.accountId, J.accountId)).toHaveLength(0);
  });

  it('14. a withdrawn request cannot be accepted — no friendship is invented (WR-01)', async () => {
    expect((await service.sendRequest(K.accountId, L.accountId)).status).toBe('requested');
    expect((await service.withdrawRequest(K.accountId, L.accountId)).status).toBe('removed');

    // `acceptRequest` no longer reads the row outside the write: the
    // `requesterId <> callerId` condition sits IN the delete, so "is there an
    // incoming request" and "consume it" are one atomic statement. A seal that
    // deletes unconditionally would answer `friends` here and leave a
    // friendship behind that nobody has an open request for.
    const accepted = await service.acceptRequest(L.accountId, K.accountId);
    expect(accepted.status).toBe('not-found');
    expect(await friendshipRows(K.accountId, L.accountId)).toHaveLength(0);
    expect(await requestRows(K.accountId, L.accountId)).toHaveLength(0);
  });

  it('15. withdraw and accept racing leave a consistent state, whichever wins (WR-01)', async () => {
    expect((await service.sendRequest(M.accountId, N.accountId)).status).toBe('requested');

    // Genuinely concurrent on separate pooled connections. WHICH one wins is not
    // deterministic and is deliberately not pinned; what is pinned is that the
    // two outcomes cannot contradict each other — a friendship exists if and
    // only if the accept was the flow that consumed the request row.
    const [, accepted] = await Promise.all([
      service.withdrawRequest(M.accountId, N.accountId),
      service.acceptRequest(N.accountId, M.accountId),
    ]);

    expect(['friends', 'not-found']).toContain(accepted.status);
    expect(await requestRows(M.accountId, N.accountId)).toHaveLength(0);
    expect(await friendshipRows(M.accountId, N.accountId)).toHaveLength(
      accepted.status === 'friends' ? 1 : 0,
    );
  });

  it('16. a TARGET profile that vanished mid-flight answers not-found, not profile-required (WR-02)', async () => {
    // `sendRequest` checks the target's existence BEFORE the insert, so the
    // target column's FK can only fire in the window between the two. Reaching
    // that branch deterministically means entering below the check — hence the
    // documented cast onto the private `openRequest`, which is the unit that
    // owns the 23503 mapping. Everything else is real: a real caller with a real
    // profile, a real deleted target, a real FK violation from Postgres.
    await db.delete(visitorProfile).where(eq(visitorProfile.accountId, O.accountId));

    const pair = canonicalPair(A.accountId, O.accountId);
    const openRequest = (
      service as unknown as {
        openRequest(
          callerId: string,
          pair: { lowerId: string; higherId: string },
          attemptsLeft: number,
        ): Promise<{ status: string }>;
      }
    ).openRequest.bind(service);

    const result = await openRequest(A.accountId, pair, 2);

    // A HAS a completed profile. Mapping every 23503 onto `profile-required`
    // told this caller to "complete your visitor profile" (409) for a target
    // that had simply been deleted — two violations with opposite meanings
    // sharing one answer, the very defect me.service.ts already carries a
    // comment about.
    expect(result.status).toBe('not-found');
    expect(await requestRows(A.accountId, O.accountId)).toHaveLength(0);
  });
});
