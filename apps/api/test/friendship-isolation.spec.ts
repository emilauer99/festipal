import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { eq, inArray, or, sql } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  festival,
  friendRequest,
  friendship,
  myFestival,
  user,
  visitorProfile,
  type Database,
} from '@quiks/db';

import { createTestApp, createTestDatabase } from './setup';

/**
 * VIS-01 as an ABSENCE proof across ALL FOUR foreign access paths (07-CONTEXT.md
 * D-04), at HTTP level against the live local Postgres — plus the observation
 * that a friendship is festival-independent.
 *
 * The four path specs from plans 07-01 to 07-04 each check their own path; this
 * one checks the serialized body of every one of them against the SAME concrete
 * owner values, and adds the owner counter-proof (`GET /me` still carries the
 * birth date) so "the split separates" cannot be confused with "the field was
 * stripped everywhere".
 *
 * ## Why this spec satisfies the SEC-02 obligation without a cross-tenant test
 *
 * The duty inherited from v1.0 is: every NEW tenant-scoped table gets a
 * cross-tenant denial test (see `festival-isolation.spec.ts`). This phase adds
 * no tenant-scoped table — D-15 and ADR-014 make friendships explicitly
 * USER-GLOBAL, so there is no `festivalId` to deny across. The obligation is
 * therefore discharged by the INVERSE proof: case 9 shows the live database
 * carries no festival column on either table (and pins the complete column set,
 * so a silently added one shows up), while cases 7 and 8 show the relationship
 * is unaffected by the caller's set of saved festivals. A later audit finding no
 * cross-tenant case here should read this paragraph, not assume one is missing.
 *
 * Exactly TWO OTP sign-ins run here: better-auth's default rate limiter allows
 * three per 60s per source. The third profile is a subject only, never a caller,
 * so it is inserted directly and costs nothing.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
// Mirrors festival-isolation.spec.ts / foreign-projection.spec.ts's CAPTURE_FILE.
const CAPTURE_FILE = join(__dirname, '..', '.otp-dev-transport.local.json');
const ORIGIN = process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? '8081'}`;

/**
 * Visitor 2's owner-only birth date. Every absence assertion below runs against
 * THIS literal, not just against the key name — a renamed key would still carry
 * the value, and the value is what actually matters.
 */
const VISITOR2_BIRTH_DATE = '1991-03-17';

/** The complete, expected column set of both user-global relationship tables. */
const FRIENDSHIP_COLUMNS = ['created_at', 'higher_id', 'lower_id'];
const FRIEND_REQUEST_COLUMNS = ['created_at', 'higher_id', 'lower_id', 'requester_id'];

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

type Visitor = { accountId: string; cookie: string; email: string; username: string };

async function createVisitor(
  app: INestApplication,
  db: Database,
  label: string,
  username: string,
  identity: { pronoun?: string; gender?: string; birthDate?: string } = {},
): Promise<Visitor> {
  const email = `friendship-isolation-${label}-${randomUUID()}@quiks.dev`;
  const cookie = await signInWithOtp(app, email);

  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error(`sign-in did not create a user row for ${label}`);

  await db.insert(visitorProfile).values({
    accountId: u.id,
    username,
    displayName: `Isolation ${label}`,
    ...identity,
  });

  return { accountId: u.id, cookie, email, username };
}

describe('friendship isolation (VIS-01 absence on all four foreign paths, festival independence)', () => {
  let app: INestApplication;
  let db: Database;

  let festivalAId: string;
  let festivalBId: string;
  let visitor1: Visitor;
  let visitor2: Visitor;
  /** Subject-only profile with all three optional foreign fields NULL. */
  let nullProfile: { accountId: string; username: string };
  /** The prefix visitor2 and the null profile share — one search hits both. */
  let sharedPrefix: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();

    const [festA] = await db
      .insert(festival)
      .values({
        slug: `friendship-isolation-a-${randomUUID()}`,
        name: 'Friendship Isolation Festival A',
        defaultLocale: 'de',
        startDate: '2026-08-13',
        endDate: '2026-08-16',
        place: 'Wiesen, Burgenland',
      })
      .returning();
    const [festB] = await db
      .insert(festival)
      .values({
        slug: `friendship-isolation-b-${randomUUID()}`,
        name: 'Friendship Isolation Festival B',
        defaultLocale: 'de',
        startDate: '2026-09-03',
        endDate: '2026-09-06',
        place: 'Tenant B Test Place',
      })
      .returning();
    if (!festA || !festB) throw new Error('festival fixture insert returned no row');
    festivalAId = festA.id;
    festivalBId = festB.id;

    // Charset-valid (`[a-z0-9_.]`, 3-20 chars) and unique per run. Visitor 1
    // deliberately does NOT share the prefix, so the search in case 2 returns
    // the two subjects and nothing else.
    sharedPrefix = `q${randomUUID().replace(/-/g, '').slice(0, 7)}`;

    visitor1 = await createVisitor(app, db, 'v1', `zz${sharedPrefix}`);
    visitor2 = await createVisitor(app, db, 'v2', `${sharedPrefix}b`, {
      pronoun: 'sie/ihr',
      gender: 'weiblich',
      birthDate: VISITOR2_BIRTH_DATE,
    });

    // Third profile: a SUBJECT, never a caller — so no sign-in, no OTP, no
    // rate-limiter budget. Its three optional foreign fields stay NULL, which is
    // what case 3 pins.
    const nullAccountId = randomUUID();
    await db.insert(user).values({
      id: nullAccountId,
      name: 'Isolation Null Profile',
      email: `friendship-isolation-null-${randomUUID()}@quiks.dev`,
    });
    const nullUsername = `${sharedPrefix}c`;
    await db.insert(visitorProfile).values({
      accountId: nullAccountId,
      username: nullUsername,
      displayName: 'Isolation Null Profile',
    });
    nullProfile = { accountId: nullAccountId, username: nullUsername };

    // Visitor 1 saves festival A. Visitor 2 saves NOTHING — cases 7 and 8 need
    // both halves of "the friendship does not depend on a shared festival".
    await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/save`)
      .set('cookie', visitor1.cookie)
      .send({})
      .expect(200);
  });

  afterAll(async () => {
    const accountIds = [visitor1.accountId, visitor2.accountId, nullProfile.accountId];
    await db
      .delete(friendRequest)
      .where(
        or(inArray(friendRequest.lowerId, accountIds), inArray(friendRequest.higherId, accountIds)),
      );
    await db
      .delete(friendship)
      .where(or(inArray(friendship.lowerId, accountIds), inArray(friendship.higherId, accountIds)));
    await db.delete(myFestival).where(inArray(myFestival.visitorId, accountIds));
    await db.delete(visitorProfile).where(inArray(visitorProfile.accountId, accountIds));
    // Only the `user` row this spec created itself. The two sign-in accounts
    // belong to better-auth; throwaway randomUUID e-mails keep the run isolated.
    await db.delete(user).where(eq(user.id, nullProfile.accountId));
    await db.delete(festival).where(inArray(festival.id, [festivalAId, festivalBId]));
    await app.close();
  });

  it('1. handle lookup (path 1) carries the six-field foreign view and none of visitor 2’s owner data', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/visitors/${visitor2.username}`)
      .set('cookie', visitor1.cookie);

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.profile)).toHaveLength(6);

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(VISITOR2_BIRTH_DATE);
    expect(serialized).not.toContain(visitor2.email);
    expect(serialized).not.toContain('birthDate');
    expect(serialized).not.toContain('birth_date');
    expect(serialized).not.toContain('email');
  });

  it('2. username search (path 2) returns both subjects and leaks nothing owner-only', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/visitors')
      .query({ q: sharedPrefix })
      .set('cookie', visitor1.cookie);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(VISITOR2_BIRTH_DATE);
    expect(serialized).not.toContain(visitor2.email);
    expect(serialized).not.toContain('birthDate');
    expect(serialized).not.toContain('birth_date');
    expect(serialized).not.toContain('email');
  });

  it('3. a profile whose optional fields are unset serializes them as null — present, not omitted', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/visitors')
      .query({ q: sharedPrefix })
      .set('cookie', visitor1.cookie);
    expect(res.status).toBe(200);

    type Hit = { profile: Record<string, unknown> };
    const hit = (res.body as Hit[]).find((h) => h.profile.username === nullProfile.username);
    expect(hit).toBeDefined();
    const profile = hit?.profile ?? {};

    // Presence of the KEY and the value `null` are two different claims. A
    // client that renders `profile.avatar` needs the first; a client that
    // distinguishes "unset" from "missing field" needs the second.
    expect(Object.keys(profile).sort()).toEqual([
      'accountId',
      'avatar',
      'displayName',
      'gender',
      'pronoun',
      'username',
    ]);
    expect(profile.avatar).toBeNull();
    expect(profile.pronoun).toBeNull();
    expect(profile.gender).toBeNull();
  });

  it('4. request lists (path 3) show the pair from both sides and leak nothing owner-only', async () => {
    const sent = await request(app.getHttpServer())
      .post('/api/v1/me/friend-requests')
      .set('cookie', visitor1.cookie)
      .send({ targetAccountId: visitor2.accountId });
    // The body goes into the assertion message on purpose: a bare "expected 500
    // to be 200" from a mutating call is undiagnosable after the fact.
    expect(sent.status, JSON.stringify(sent.body)).toBe(200);

    const asV1 = await request(app.getHttpServer())
      .get('/api/v1/me/friend-requests')
      .set('cookie', visitor1.cookie);
    expect(asV1.status).toBe(200);
    expect(asV1.body.outgoing.map((i: { profile: { accountId: string } }) => i.profile.accountId)).toContain(
      visitor2.accountId,
    );
    expect(asV1.body.incoming).toEqual([]);

    const serializedV1 = JSON.stringify(asV1.body);
    expect(serializedV1).not.toContain(VISITOR2_BIRTH_DATE);
    expect(serializedV1).not.toContain(visitor2.email);
    expect(serializedV1).not.toContain('birthDate');
    expect(serializedV1).not.toContain('birth_date');
    expect(serializedV1).not.toContain('email');

    const asV2 = await request(app.getHttpServer())
      .get('/api/v1/me/friend-requests')
      .set('cookie', visitor2.cookie);
    expect(asV2.status).toBe(200);
    expect(asV2.body.incoming.map((i: { profile: { accountId: string } }) => i.profile.accountId)).toContain(
      visitor1.accountId,
    );

    // The same absence assertions on the OTHER side's body: visitor 2 looking at
    // their own incoming list must not receive their own owner fields either —
    // this list serves the foreign view of the counterpart, nothing more.
    const serializedV2 = JSON.stringify(asV2.body);
    expect(serializedV2).not.toContain(VISITOR2_BIRTH_DATE);
    expect(serializedV2).not.toContain(visitor2.email);
    expect(serializedV2).not.toContain(visitor1.email);
    expect(serializedV2).not.toContain('birthDate');
    expect(serializedV2).not.toContain('birth_date');
    expect(serializedV2).not.toContain('email');
  });

  it('5. friend list (path 4) carries the foreign view only, after visitor 2 accepts', async () => {
    const accepted = await request(app.getHttpServer())
      .post(`/api/v1/me/friend-requests/${visitor1.accountId}/accept`)
      .set('cookie', visitor2.cookie)
      .send({});
    expect(accepted.status, JSON.stringify(accepted.body)).toBe(200);

    const res = await request(app.getHttpServer())
      .get('/api/v1/me/friends')
      .set('cookie', visitor1.cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].profile.accountId).toBe(visitor2.accountId);
    expect(Object.keys(res.body[0].profile)).toHaveLength(6);

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(VISITOR2_BIRTH_DATE);
    expect(serialized).not.toContain(visitor2.email);
    expect(serialized).not.toContain('birthDate');
    expect(serialized).not.toContain('birth_date');
    expect(serialized).not.toContain('email');
  });

  it('6. owner counter-proof: GET /me DOES give visitor 2 their own birth date', async () => {
    // Without this case, every assertion above would also pass if the field had
    // simply been removed from the system. The split SEPARATES; it does not strip.
    const res = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('cookie', visitor2.cookie);

    expect(res.status).toBe(200);
    expect(res.body.profile).toHaveProperty('birthDate');
    expect(res.body.profile.birthDate).toBe(VISITOR2_BIRTH_DATE);
    expect(res.body.email).toBe(visitor2.email);
  });

  it('7. the friendship holds although visitor 2 has saved no festival at all', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me/friends')
      .set('cookie', visitor2.cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].profile.accountId).toBe(visitor1.accountId);

    // And no saved festival is what produced that: visitor 2's own list is empty.
    const saved = await request(app.getHttpServer())
      .get('/api/v1/me/festivals')
      .set('cookie', visitor2.cookie);
    expect(saved.status).toBe(200);
    expect(saved.body).toEqual([]);
  });

  it('8. changing the set of saved festivals leaves the friend list byte-identical', async () => {
    const before = await request(app.getHttpServer())
      .get('/api/v1/me/friends')
      .set('cookie', visitor1.cookie);
    expect(before.status).toBe(200);

    const savedB = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalBId}/save`)
      .set('cookie', visitor1.cookie)
      .send({});
    expect(savedB.status, JSON.stringify(savedB.body)).toBe(200);

    const after = await request(app.getHttpServer())
      .get('/api/v1/me/friends')
      .set('cookie', visitor1.cookie);
    expect(after.status).toBe(200);

    // Serialized equality, not just length: a festival-dependent field creeping
    // into the entry would change the body without changing the count.
    expect(JSON.stringify(after.body)).toEqual(JSON.stringify(before.body));

    const savedFestivals = await request(app.getHttpServer())
      .get('/api/v1/me/festivals')
      .set('cookie', visitor1.cookie);
    expect(savedFestivals.body).toHaveLength(2);
  });

  it('9. neither relationship table carries a festival column in the LIVE database', async () => {
    const rows = (await db.execute(
      sql`select table_name, column_name from information_schema.columns
          where table_schema = 'public' and table_name in ('friendship', 'friend_request')`,
    )) as unknown as Array<{ table_name: string; column_name: string }>;

    const columnsOf = (table: string): string[] =>
      rows
        .filter((r) => r.table_name === table)
        .map((r) => r.column_name)
        .sort();

    // Absence of any tenant column (ADR-014, D-15) …
    expect(rows.filter((r) => r.column_name.toLowerCase().includes('festival'))).toEqual([]);
    // … and the COMPLETE expected set, so a silently added column shows up too.
    expect(columnsOf('friendship')).toEqual(FRIENDSHIP_COLUMNS);
    expect(columnsOf('friend_request')).toEqual(FRIEND_REQUEST_COLUMNS);
  });

  it.each([
    ['GET /api/v1/visitors/:username', '/api/v1/visitors/someone'],
    ['GET /api/v1/visitors?q=', '/api/v1/visitors?q=ab'],
    ['GET /api/v1/me/friend-requests', '/api/v1/me/friend-requests'],
    ['GET /api/v1/me/friends', '/api/v1/me/friends'],
  ])('10. %s rejects an anonymous caller with 401', async (_label, path) => {
    // Isolation in this project is data scoping and not an access gate
    // (ADR-014), but the global AuthGuard is the precondition under which the
    // scoping applies at all — there is no caller to scope by without a session.
    const res = await request(app.getHttpServer()).get(path);
    expect(res.status).toBe(401);
  });
});
