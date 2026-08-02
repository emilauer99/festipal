import { randomUUID } from 'node:crypto';

import { inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { user, visitorProfile, type Database } from '@festipal/db';

import { MeService } from '../src/me/me.service';
import { createTestDatabase } from './setup';

/**
 * Proves Pitfall 11 / SC-5: `checkUsernameAvailability` is advisory only —
 * `completeProfile`'s DB unique index (`visitor_profile_username_lower_unq`)
 * is the TOCTOU-safe source of truth. A duplicate (case-variant) username on
 * the second `completeProfile` call must come back as `{ status: 'conflict' }`,
 * never a thrown 500.
 */
describe('username-race (Pitfall 11 / SC-5)', () => {
  let db: Database;
  let me: MeService;

  const accountA = `test-username-race-a-${randomUUID()}`;
  const accountB = `test-username-race-b-${randomUUID()}`;
  const usernameLower = `race-${randomUUID().slice(0, 8)}`;
  const usernameUpper = usernameLower.toUpperCase();

  beforeAll(async () => {
    db = createTestDatabase();
    me = new MeService(db);

    await db.insert(user).values([
      { id: accountA, name: 'Race Test A', email: `${accountA}@festipal.dev` },
      { id: accountB, name: 'Race Test B', email: `${accountB}@festipal.dev` },
    ]);
  });

  afterAll(async () => {
    await db.delete(visitorProfile).where(inArray(visitorProfile.accountId, [accountA, accountB]));
    await db.delete(user).where(inArray(user.id, [accountA, accountB]));
  });

  it('checkUsernameAvailability reports available before any insert (advisory only)', async () => {
    const available = await me.checkUsernameAvailability(usernameLower);
    expect(available).toBe(true);
  });

  it('first completeProfile insert succeeds (source of truth)', async () => {
    const result = await me.completeProfile(accountA, {
      username: usernameLower,
      displayName: 'Race Test A',
    });
    expect(result.status).toBe('ok');
  });

  it('second completeProfile with a case-variant username returns conflict, not a thrown 500', async () => {
    const result = await me.completeProfile(accountB, {
      username: usernameUpper,
      displayName: 'Race Test B',
    });
    expect(result.status).toBe('conflict');
  });

  it('checkUsernameAvailability now reports the username taken (case-insensitive)', async () => {
    const available = await me.checkUsernameAvailability(usernameUpper);
    expect(available).toBe(false);
  });
});
