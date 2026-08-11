import { randomUUID } from 'node:crypto';

import { inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { user, visitorProfile, type Database } from '@quiks/db';
import { completeProfileBodySchema } from '@quiks/contracts';

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
      { id: accountA, name: 'Race Test A', email: `${accountA}@quiks.dev` },
      { id: accountB, name: 'Race Test B', email: `${accountB}@quiks.dev` },
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

/**
 * D-03: server-side username/displayName caps, proven at the Zod parse layer
 * (`completeProfileBodySchema`, composed on `visitorProfileInsertSchema`'s
 * `.extend()` values — packages/db/src/schema/visitor-profile.ts). This is
 * where `apps/api/src/me/me.controller.ts`'s `@TsRestHandler(contract.completeProfile)`
 * actually validates the request body — rejected input never reaches
 * `MeService.completeProfile`/the DB. Testing `safeParse` directly proves the
 * boundary without needing a live HTTP/DB round-trip.
 */
describe('D-03 server-side name caps (username/displayName)', () => {
  const validDisplayName = 'Race Test';

  it('rejects a username shorter than 3 chars', () => {
    const result = completeProfileBodySchema.safeParse({ username: 'ab', displayName: validDisplayName });
    expect(result.success).toBe(false);
  });

  it('rejects a username longer than 20 chars', () => {
    const result = completeProfileBodySchema.safeParse({
      username: 'a'.repeat(21),
      displayName: validDisplayName,
    });
    expect(result.success).toBe(false);
  });

  it.each([
    ['uppercase', 'Ab_1'],
    ['space', 'a b'],
    ['special char', 'a!b'],
  ])('rejects a username with a %s (%s)', (_label, badUsername) => {
    const result = completeProfileBodySchema.safeParse({
      username: badUsername,
      displayName: validDisplayName,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a 3-char lowercase username', () => {
    const result = completeProfileBodySchema.safeParse({ username: 'abc', displayName: validDisplayName });
    expect(result.success).toBe(true);
  });

  it('accepts a 20-char lowercase/digit/underscore/dot username', () => {
    const result = completeProfileBodySchema.safeParse({
      username: 'a1_.'.repeat(5), // 20 chars, charset-valid
      displayName: validDisplayName,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty displayName', () => {
    const result = completeProfileBodySchema.safeParse({ username: 'abc', displayName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a displayName longer than 40 chars', () => {
    const result = completeProfileBodySchema.safeParse({ username: 'abc', displayName: 'x'.repeat(41) });
    expect(result.success).toBe(false);
  });

  it('accepts a 1-char displayName', () => {
    const result = completeProfileBodySchema.safeParse({ username: 'abc', displayName: 'x' });
    expect(result.success).toBe(true);
  });

  it('accepts a 40-char displayName', () => {
    const result = completeProfileBodySchema.safeParse({ username: 'abc', displayName: 'x'.repeat(40) });
    expect(result.success).toBe(true);
  });
});
