import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { friendRequest, friendship, user, visitorProfile, type Database } from '@quiks/db';

import { FriendshipService } from '../src/friendship/friendship.service';
import { canonicalPair } from '../src/friendship/visitor-projection';
import { collationConflictingAccountIds, testAccountId } from './account-ids';
import { createTestApp, createTestDatabase } from './setup';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAPTURE_FILE = join(__dirname, '..', '.otp-dev-transport.local.json');
const ORIGIN = process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? '8081'}`;

/**
 * One random, charset-valid stem per run (`[a-z0-9]`, 8 chars from a UUID), so
 * repeated runs never collide and no seed row can satisfy a fixture assertion
 * by accident. Every stem below stays well under the 20-char username cap.
 */
const RUN = randomUUID().replace(/-/g, '').slice(0, 8);

/** 22 profiles share this stem — the ordering and 20-cap fixtures. */
const BULK_STEM = `b${RUN}`;
/** The two LIKE-escaping siblings differ only at the position of the `_`. */
const ESCAPE_STEM = `e${RUN}`;
const ESCAPE_UNDERSCORE = `${ESCAPE_STEM}_x`;
const ESCAPE_SIBLING = `${ESCAPE_STEM}yx`;
/** Carries RUN in the MIDDLE of the username, never at the front. */
const MID_SUBSTRING_USERNAME = `zz${RUN}`;
/** Lives in a displayName and in no username at all (D-09). */
const DISPLAY_ONLY_TOKEN = `dn${RUN}`;
/** The five relation fixtures — one result set, five relation values. */
const RELATION_STEM = `r${RUN}`;

/** Owner-only value: must never reach a foreign view, not even as a substring. */
const FIXTURE_BIRTH_DATE = '1991-07-23';

type Fixture = { accountId: string; username: string; displayName: string; birthDate?: string };

const fixtures: Fixture[] = [];

function fixture(
  username: string,
  opts: { displayName?: string; birthDate?: string; accountId?: string } = {},
): Fixture {
  const f: Fixture = {
    // WR-04: mixed-case ids, the shape better-auth actually mints — see
    // `account-ids.ts`.
    accountId: opts.accountId ?? testAccountId('test-username-search'),
    username,
    displayName: opts.displayName ?? `Search Fixture ${username}`,
    birthDate: opts.birthDate,
  };
  fixtures.push(f);
  return f;
}

/**
 * CR-01/WR-04: `caller` and `friendOf` are the ONE pair here whose canonical
 * order differs between JavaScript and a locale collation. Their `friendship`
 * row is written directly through `canonicalPair` in `beforeAll`, so the
 * divergence is exercised by the fixture setup itself; `outgoingTo` and
 * `incomingFrom` keep ordinary ids and pair with `caller` the ordinary way.
 */
const [COLLATION_CONFLICT_FRIEND, COLLATION_CONFLICT_CALLER] = collationConflictingAccountIds(
  'test-username-search-collation',
);

const bulkUsernames = Array.from(
  { length: 22 },
  (_unused, i) => `${BULK_STEM}a${String(i + 1).padStart(2, '0')}`,
);
bulkUsernames.forEach((username) => fixture(username));

fixture(ESCAPE_UNDERSCORE);
fixture(ESCAPE_SIBLING);
fixture(MID_SUBSTRING_USERNAME);
// D-09 fixture: the token is in the displayName, the username does not contain it.
fixture(`p${RUN}`, { displayName: `Only in the name ${DISPLAY_ONLY_TOKEN}` });

const caller = fixture(`${RELATION_STEM}s`, {
  birthDate: FIXTURE_BIRTH_DATE,
  accountId: COLLATION_CONFLICT_CALLER,
});
const friendOf = fixture(`${RELATION_STEM}f`, {
  birthDate: FIXTURE_BIRTH_DATE,
  accountId: COLLATION_CONFLICT_FRIEND,
});
const outgoingTo = fixture(`${RELATION_STEM}o`, { birthDate: FIXTURE_BIRTH_DATE });
const incomingFrom = fixture(`${RELATION_STEM}i`, { birthDate: FIXTURE_BIRTH_DATE });
const unrelated = fixture(`${RELATION_STEM}n`, { birthDate: FIXTURE_BIRTH_DATE });

const fixtureAccountIds = fixtures.map((f) => f.accountId);

async function readCapturedOtp(email: string, { retries = 20, delayMs = 300 } = {}): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const raw = await readFile(CAPTURE_FILE, 'utf8');
      const captured = JSON.parse(raw) as { email: string; otp: string };
      if (captured.email === email) return captured.otp;
    } catch {
      // Capture file not written yet (or a stale unrelated entry) — retry.
    }
    await delay(delayMs);
  }
  throw new Error(`Timed out waiting for OTP capture file at ${CAPTURE_FILE}`);
}

function cookieHeaderFromSetCookie(setCookie: string[] | string | undefined): string {
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

async function signInWithOtp(app: INestApplication, email: string): Promise<string> {
  await request(app.getHttpServer())
    .post('/api/auth/email-otp/send-verification-otp')
    .set('origin', ORIGIN)
    .send({ email, type: 'sign-in' })
    .expect(200);

  const otp = await readCapturedOtp(email);

  const verifyRes = await request(app.getHttpServer())
    .post('/api/auth/sign-in/email-otp')
    .set('origin', ORIGIN)
    .send({ email, otp })
    .expect(200);

  const cookie = cookieHeaderFromSetCookie(verifyRes.headers['set-cookie']);
  if (!cookie) throw new Error('sign-in did not set a session cookie');
  return cookie;
}

/**
 * Called EXACTLY ONCE, for the single HTTP case at the bottom. Everything else
 * in this spec is service-level with directly inserted fixtures — 31 profiles
 * cannot be provisioned through sign-in, because better-auth's default OTP rate
 * limiter allows 3 requests per 60s per source (same constraint
 * `foreign-projection.spec.ts` works around by provisioning exactly two).
 */
async function createVisitor(app: INestApplication, db: Database): Promise<{ accountId: string; cookie: string }> {
  const email = `username-search-http-${randomUUID()}@quiks.dev`;
  const cookie = await signInWithOtp(app, email);

  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error('sign-in did not create a user row');

  await db.insert(visitorProfile).values({
    accountId: u.id,
    username: `h${RUN}`,
    displayName: 'Username Search HTTP',
  });

  return { accountId: u.id, cookie };
}

/**
 * The six edges of the username search, each fixed by 07-CONTEXT.md and none of
 * them left as an assumption: prefix-not-substring and case-insensitivity
 * (D-06), the 2-character floor / stable ascending order / hard cap of 20
 * (D-08), `username`-only (D-09), plus LIKE-metacharacter escaping (T-07-09)
 * and all five relation values of D-07 in a single result set.
 *
 * D-05 is proven by CONSTRUCTION here: every fixture profile comes into
 * existence through a plain `visitor_profile` insert with no opt-in, no
 * activation and no visibility flag — and shows up in the result sets anyway.
 * There is no switch a test could flip, and none of these tests flips one.
 */
describe('username search (D-06/D-08/D-09, VIS-02 second access path)', () => {
  let app: INestApplication;
  let db: Database;
  let friendshipService: FriendshipService;
  let httpVisitor: { accountId: string; cookie: string };

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();
    friendshipService = new FriendshipService(db);

    await db.insert(user).values(
      fixtures.map((f) => ({
        id: f.accountId,
        name: f.displayName,
        email: `${f.accountId}@quiks.dev`,
      })),
    );
    await db.insert(visitorProfile).values(
      fixtures.map((f) => ({
        accountId: f.accountId,
        username: f.username,
        displayName: f.displayName,
        birthDate: f.birthDate,
      })),
    );

    // The lifecycle endpoints only land in plan 07-03, so the relation rows are
    // set directly — through `canonicalPair`, or the `lower_id < higher_id`
    // CHECK rejects them (D-14).
    const friendPair = canonicalPair(caller.accountId, friendOf.accountId);
    await db.insert(friendship).values(friendPair);

    const outgoingPair = canonicalPair(caller.accountId, outgoingTo.accountId);
    const incomingPair = canonicalPair(caller.accountId, incomingFrom.accountId);
    await db.insert(friendRequest).values([
      { ...outgoingPair, requesterId: caller.accountId },
      { ...incomingPair, requesterId: incomingFrom.accountId },
    ]);

    httpVisitor = await createVisitor(app, db);
  });

  afterAll(async () => {
    // Dependency order: relation rows, then the profiles they reference, then
    // the throwaway accounts. Seed data is never touched.
    await db.delete(friendship).where(inArray(friendship.lowerId, fixtureAccountIds));
    await db.delete(friendRequest).where(inArray(friendRequest.lowerId, fixtureAccountIds));
    await db.delete(visitorProfile).where(inArray(visitorProfile.accountId, fixtureAccountIds));
    await db.delete(visitorProfile).where(eq(visitorProfile.accountId, httpVisitor.accountId));
    await db.delete(user).where(inArray(user.id, fixtureAccountIds));
    // The sign-in-created `user`/`session` rows stay: better-auth owns that
    // table and the randomUUID e-mail keeps this run isolated
    // (`foreign-projection.spec.ts` keeps the same boundary).
    await app.close();
  });

  it('1. a one-character term returns [], a two-character term returns hits (D-08 floor)', async () => {
    const tooShort = await friendshipService.searchByUsername(caller.accountId, 'b');
    expect(tooShort).toEqual([]);

    const twoChars = await friendshipService.searchByUsername(caller.accountId, BULK_STEM.slice(0, 2));
    expect(twoChars.length).toBeGreaterThan(0);
  });

  it('2. a whitespace-only term and a term that trims below two chars return []', async () => {
    expect(await friendshipService.searchByUsername(caller.accountId, '   ')).toEqual([]);
    expect(await friendshipService.searchByUsername(caller.accountId, '  b  ')).toEqual([]);
  });

  it('3. 22 matching profiles yield exactly 20 hits (D-08 hard cap)', async () => {
    const hits = await friendshipService.searchByUsername(caller.accountId, BULK_STEM);
    expect(hits.length).toBe(20);
  });

  it('4. hits are ascending by username and stable across repeated identical calls', async () => {
    const first = await friendshipService.searchByUsername(caller.accountId, BULK_STEM);
    const usernames = first.map((hit) => hit.profile.username);
    // Compared against a sorted copy of the SAME list, not a hardcoded order —
    // the assertion is about ordering, not about which 20 of the 22 won.
    expect(usernames).toEqual([...usernames].sort());

    const second = await friendshipService.searchByUsername(caller.accountId, BULK_STEM);
    expect(second.map((hit) => hit.profile.username)).toEqual(usernames);
  });

  it('5. a term occurring mid-username does not match it — prefix, not substring (D-06)', async () => {
    const hits = await friendshipService.searchByUsername(caller.accountId, RUN);
    expect(hits.map((hit) => hit.profile.username)).not.toContain(MID_SUBSTRING_USERNAME);
    expect(hits.length).toBe(0);
  });

  it('6. an uppercase term returns the same hits as the lowercase one (D-06)', async () => {
    const lower = await friendshipService.searchByUsername(caller.accountId, BULK_STEM);
    const upper = await friendshipService.searchByUsername(caller.accountId, BULK_STEM.toUpperCase());
    expect(upper.map((hit) => hit.profile.username)).toEqual(lower.map((hit) => hit.profile.username));
  });

  it('7. an underscore in the term is escaped — the sibling with another char there does not match', async () => {
    const hits = await friendshipService.searchByUsername(caller.accountId, ESCAPE_UNDERSCORE);
    // Unescaped, `_` is LIKE's single-character wildcard and ESCAPE_SIBLING
    // would come back too (T-07-09).
    expect(hits.length).toBe(1);
    expect(hits[0]?.profile.username).toBe(ESCAPE_UNDERSCORE);
  });

  it('8. a term that only occurs in a displayName returns no hits (D-09)', async () => {
    const hits = await friendshipService.searchByUsername(caller.accountId, DISPLAY_ONLY_TOKEN);
    expect(hits.length).toBe(0);
  });

  it('9. one result set carries all five relation values (D-07)', async () => {
    const hits = await friendshipService.searchByUsername(caller.accountId, RELATION_STEM);
    const byUsername = new Map(hits.map((hit) => [hit.profile.username, hit.relation]));

    expect(hits.length).toBe(5);
    expect(byUsername.get(caller.username)).toBe('self');
    expect(byUsername.get(friendOf.username)).toBe('friends');
    expect(byUsername.get(outgoingTo.username)).toBe('requestOutgoing');
    expect(byUsername.get(incomingFrom.username)).toBe('requestIncoming');
    expect(byUsername.get(unrelated.username)).toBe('none');
  });

  it('10. every hit carries exactly the six foreign-view keys, and no birth date (VIS-01/D-03)', async () => {
    const hits = await friendshipService.searchByUsername(caller.accountId, RELATION_STEM);
    expect(hits.length).toBe(5);

    for (const hit of hits) {
      expect(Object.keys(hit.profile).length).toBe(6);
      expect(Object.keys(hit.profile).sort()).toEqual([
        'accountId',
        'avatar',
        'displayName',
        'gender',
        'pronoun',
        'username',
      ]);
    }

    // Absence on the SERIALIZED result set, not on the parsed objects — all five
    // of these profiles were created WITH a birth date, so this proves the
    // projection drops it rather than the fixtures never having had one.
    const serialized = JSON.stringify(hits);
    expect(serialized).not.toContain('birthDate');
    expect(serialized).not.toContain('birth_date');
    expect(serialized).not.toContain(FIXTURE_BIRTH_DATE);
  });

  it('11. GET /api/v1/visitors is 200 with a session and 401 without one', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/visitors')
      .query({ q: BULK_STEM })
      .set('cookie', httpVisitor.cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(20);

    const anonymous = await request(app.getHttpServer()).get('/api/v1/visitors').query({ q: BULK_STEM });
    expect(anonymous.status).toBe(401);
  });
});
