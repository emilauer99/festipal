import { randomUUID } from 'node:crypto';

import { eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { activity, activityParticipant, festival, user, visitorProfile, type Database } from '@quiks/db';

import { postgresErrorOf } from '../src/db/postgres-error';
import { testAccountId } from './account-ids';
import { createTestDatabase } from './setup';

/**
 * DB-level proof (D-07/D-08, Erfolgskriterium 2) that activity capacity is
 * enforced by `activity_capacity_guard()` /
 * `activity_participant_capacity_trg` — NOT by a check-then-insert in
 * application code. Every insert below goes straight through Drizzle with no
 * HTTP layer and no `ActivityService` in between, so a passing suite proves
 * the DATABASE decides, not a service-level guard that happens to agree with
 * it. The HTTP-level proof (including the parallel race over real requests)
 * is `activity-join-leave.spec.ts` (Task 3).
 */
describe('activity capacity trigger (D-07/D-08, Erfolgskriterium 2)', () => {
  let db: Database;
  let festivalId: string;

  const visitorIds: string[] = [];
  const activityIds: string[] = [];

  async function makeVisitor(label: string): Promise<string> {
    const accountId = testAccountId(`test-activity-capacity-${label}`);
    await db.insert(user).values({
      id: accountId,
      name: `Capacity Test ${label}`,
      email: `${accountId}@quiks.dev`,
    });
    await db.insert(visitorProfile).values({
      accountId,
      username: `cap-${label}-${randomUUID().slice(0, 8)}`,
      displayName: `Capacity Test ${label}`,
    });
    visitorIds.push(accountId);
    return accountId;
  }

  /** A fresh activity with `creatorId` already seated as its first participant. */
  async function makeActivity(capacity: number | null, creatorId: string): Promise<string> {
    const [row] = await db
      .insert(activity)
      .values({
        festivalId,
        creatorId,
        title: `Capacity Test Activity ${randomUUID().slice(0, 8)}`,
        startTime: new Date(Date.now() + 3_600_000),
        capacity,
      })
      .returning({ id: activity.id });
    if (!row) throw new Error('activity fixture insert returned no row');
    activityIds.push(row.id);
    await db
      .insert(activityParticipant)
      .values({ activityId: row.id, festivalId, visitorId: creatorId });
    return row.id;
  }

  beforeAll(async () => {
    db = createTestDatabase();

    const [fest] = await db
      .insert(festival)
      .values({
        slug: `activity-capacity-${randomUUID()}`,
        name: 'Activity Capacity Test Festival',
        defaultLocale: 'de',
      })
      .returning();
    if (!fest) throw new Error('festival fixture insert returned no row');
    festivalId = fest.id;
  });

  afterAll(async () => {
    // Dependency order: participant rows, then activities (which cascade-
    // delete any participant row this pass missed anyway), then the profiles
    // and throwaway accounts they reference, then the festival.
    await db.delete(activityParticipant).where(inArray(activityParticipant.activityId, activityIds));
    await db.delete(activity).where(inArray(activity.id, activityIds));
    await db.delete(visitorProfile).where(inArray(visitorProfile.accountId, visitorIds));
    await db.delete(user).where(inArray(user.id, visitorIds));
    await db.delete(festival).where(eq(festival.id, festivalId));
  });

  it('1. capacity 2 (creator seated): a second join succeeds, a third fails with 23514/activity_capacity_full_chk', async () => {
    const creator = await makeVisitor('c1-creator');
    const joinerA = await makeVisitor('c1-joiner-a');
    const joinerB = await makeVisitor('c1-joiner-b');
    const activityId = await makeActivity(2, creator);

    // Creator already occupies seat 1 (taken=1 < cap=2) — this join fills the
    // last seat.
    await db.insert(activityParticipant).values({ activityId, festivalId, visitorId: joinerA });

    await expect(
      db.insert(activityParticipant).values({ activityId, festivalId, visitorId: joinerB }),
    ).rejects.toSatisfy((err: unknown) => {
      const cause = postgresErrorOf(err);
      return cause?.code === '23514' && cause.constraint_name === 'activity_capacity_full_chk';
    });

    const rows = await db
      .select()
      .from(activityParticipant)
      .where(eq(activityParticipant.activityId, activityId));
    expect(rows).toHaveLength(2);
  });

  it('2. capacity: null is unbegrenzt — ten joins in a row all succeed (D-08)', async () => {
    const creator = await makeVisitor('c2-creator');
    const activityId = await makeActivity(null, creator);

    const joiners = await Promise.all(
      Array.from({ length: 10 }, (_, i) => makeVisitor(`c2-joiner-${i}`)),
    );
    for (const visitorId of joiners) {
      await db.insert(activityParticipant).values({ activityId, festivalId, visitorId });
    }

    const rows = await db
      .select()
      .from(activityParticipant)
      .where(eq(activityParticipant.activityId, activityId));
    // 10 joiners + the creator seated by makeActivity.
    expect(rows).toHaveLength(11);
  });

  it(
    '3. concurrent race for the last seat: exactly one of two simultaneous joins succeeds, ' +
      'over 10 independent rounds with a fresh activity each round',
    async () => {
      // Two independent connections — the whole point of the trigger's
      // `FOR UPDATE` row lock is to serialize transactions on SEPARATE
      // connections, which a single shared connection could never exercise.
      const dbA = createTestDatabase();
      const dbB = createTestDatabase();
      try {
        const creator = await makeVisitor('c3-creator');
        const racerX = await makeVisitor('c3-racer-x');
        const racerY = await makeVisitor('c3-racer-y');

        for (let round = 0; round < 10; round += 1) {
          // capacity 2: the creator already occupies seat 1, so exactly ONE
          // more seat is open — the last-seat race this case is named for.
          const activityId = await makeActivity(2, creator);

          const results = await Promise.allSettled([
            dbA.transaction(async (tx) => {
              await tx
                .insert(activityParticipant)
                .values({ activityId, festivalId, visitorId: racerX });
            }),
            dbB.transaction(async (tx) => {
              await tx
                .insert(activityParticipant)
                .values({ activityId, festivalId, visitorId: racerY });
            }),
          ]);

          const fulfilled = results.filter((r) => r.status === 'fulfilled');
          const rejected = results.filter((r) => r.status === 'rejected');
          expect(fulfilled).toHaveLength(1);
          expect(rejected).toHaveLength(1);

          const rejection = rejected[0] as PromiseRejectedResult;
          const cause = postgresErrorOf(rejection.reason);
          expect(cause?.code).toBe('23514');
          expect(cause?.constraint_name).toBe('activity_capacity_full_chk');

          const rows = await db
            .select()
            .from(activityParticipant)
            .where(eq(activityParticipant.activityId, activityId));
          expect(rows).toHaveLength(2);
        }
      } finally {
        await dbA.$client.end();
        await dbB.$client.end();
      }
    },
  );

  it('4. a repeated join by an already-seated visitor at a FULL activity is a silent no-op, not a rejection', async () => {
    const creator = await makeVisitor('c4-creator');
    const joiner = await makeVisitor('c4-joiner');
    const activityId = await makeActivity(2, creator);
    await db.insert(activityParticipant).values({ activityId, festivalId, visitorId: joiner });

    // The activity is now full (2/2). `joiner` repeats their own join via
    // `onConflictDoNothing()` — the trigger's "already a participant" branch
    // must let this through even though the naive capacity check below would
    // refuse it, or a client that calls join twice on a full activity would
    // be refused the SECOND time despite already being in (idempotency would
    // be eaten by the capacity guard).
    await db
      .insert(activityParticipant)
      .values({ activityId, festivalId, visitorId: joiner })
      .onConflictDoNothing();

    const rows = await db
      .select()
      .from(activityParticipant)
      .where(eq(activityParticipant.activityId, activityId));
    expect(rows).toHaveLength(2);
  });
});
