import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { eq, inArray, or } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { festival, friendship, myFestival, user, visitorProfile, type Database } from '@quiks/db';

import { canonicalPair } from '../src/friendship/visitor-projection';
import { testAccountId } from './account-ids';
import { createTestApp, createTestDatabase } from './setup';

/**
 * SEC-02 for the NEW `friendship x my_festival` join behind
 * `GET /festivals/:festivalId/friends` (09-02-PLAN.md Task 2, FRND-07).
 *
 * ## Why this spec is needed despite no new table
 *
 * SEC-02 is an inherited duty: every NEW festival-scoped read gets a
 * cross-tenant proof (`.planning/workstreams/mobile/STATE.md` § Blockers/
 * Concerns, baseline `festival-isolation.spec.ts`). This endpoint adds no
 * table, but its query joins TWO existing tables across the tenant boundary —
 * `friendship` (user-global, no `festivalId`) and `my_festival` (the tenant
 * membership edge) — and that join is exactly the place where a forgotten
 * condition would silently widen "my friends who saved THIS festival" into
 * "my friends who saved ANY festival" or worse. Case 2 (cross-tenant) is the
 * actual proof: the SAME two friends, a DIFFERENT `festivalId`, a DIFFERENT
 * result.
 *
 * ONLY TWO OTP sign-ins run here (`caller`, `stranger`) — better-auth's
 * default rate limiter allows three requests per 60s per source (same
 * constraint documented in `foreign-projection.spec.ts` and
 * `friendship-isolation.spec.ts`). `friendA` and `friendB` are subjects only,
 * never callers, so their profiles go in directly — the same pattern
 * `friendship-isolation.spec.ts`'s `nullProfile` and `friend-lists.spec.ts`'s
 * B/C/D/E use — and their friendship rows with `caller` are written directly
 * through `canonicalPair`, exactly what the `lower_id < higher_id` CHECK on
 * `friendship` requires (D-14).
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
// Mirrors festival-isolation.spec.ts / friendship-isolation.spec.ts's CAPTURE_FILE.
const CAPTURE_FILE = join(__dirname, '..', '.otp-dev-transport.local.json');
const ORIGIN = process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? '8081'}`;

/** friendA's owner-only birth date — every field-absence assertion below runs against THIS literal. */
const FRIEND_A_BIRTH_DATE = '1990-05-12';

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

type Caller = { accountId: string; cookie: string; username: string };

/** A real caller: OTP sign-in + profile. Spends one of the three rate-limited requests. */
async function createCaller(app: INestApplication, db: Database, label: string, username: string): Promise<Caller> {
  const email = `festival-friends-isolation-${label}-${randomUUID()}@quiks.dev`;
  const cookie = await signInWithOtp(app, email);

  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error(`sign-in did not create a user row for ${label}`);

  await db.insert(visitorProfile).values({ accountId: u.id, username, displayName: `Isolation ${label}` });

  return { accountId: u.id, cookie, username };
}

type Subject = { accountId: string; username: string };

/** A subject-only profile: never signs in, never calls anything — costs no rate-limit budget. */
async function createSubject(
  db: Database,
  label: string,
  username: string,
  identity: { pronoun?: string; gender?: string; birthDate?: string } = {},
): Promise<Subject> {
  const accountId = testAccountId(`test-festival-friends-${label}`);
  await db
    .insert(user)
    .values({ id: accountId, name: `Isolation ${label}`, email: `${accountId}@quiks.dev` });
  await db
    .insert(visitorProfile)
    .values({ accountId, username, displayName: `Isolation ${label}`, ...identity });
  return { accountId, username };
}

describe('festival friends isolation (SEC-02 for the friendship x my_festival join, FRND-07)', () => {
  let app: INestApplication;
  let db: Database;

  let festivalAId: string;
  let festivalBId: string;
  let festivalCId: string;

  let caller: Caller;
  let stranger: Caller;
  let friendA: Subject;
  let friendB: Subject;

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();

    const RUN = randomUUID().replace(/-/g, '').slice(0, 8);

    const [festA] = await db
      .insert(festival)
      .values({
        slug: `festival-friends-isolation-a-${randomUUID()}`,
        name: 'Festival Friends Isolation A',
        defaultLocale: 'de',
        startDate: '2026-08-13',
        endDate: '2026-08-16',
        place: 'Wiesen, Burgenland',
      })
      .returning();
    const [festB] = await db
      .insert(festival)
      .values({
        slug: `festival-friends-isolation-b-${randomUUID()}`,
        name: 'Festival Friends Isolation B',
        defaultLocale: 'de',
        startDate: '2026-09-03',
        endDate: '2026-09-06',
        place: 'Tenant B Test Place',
      })
      .returning();
    // A third, real festival that NONE of caller's friends save — the "empty
    // intersection on a real resource" case, distinct from a wholly unknown id.
    const [festC] = await db
      .insert(festival)
      .values({
        slug: `festival-friends-isolation-c-${randomUUID()}`,
        name: 'Festival Friends Isolation C',
        defaultLocale: 'de',
        startDate: '2026-10-01',
        endDate: '2026-10-04',
        place: 'Tenant C Test Place',
      })
      .returning();
    if (!festA || !festB || !festC) throw new Error('festival fixture insert returned no row');
    festivalAId = festA.id;
    festivalBId = festB.id;
    festivalCId = festC.id;

    caller = await createCaller(app, db, 'caller', `q${RUN}caller`);
    stranger = await createCaller(app, db, 'stranger', `q${RUN}stranger`);

    friendA = await createSubject(db, 'frienda', `q${RUN}frienda`, {
      pronoun: 'sie/ihr',
      gender: 'weiblich',
      birthDate: FRIEND_A_BIRTH_DATE,
    });
    friendB = await createSubject(db, 'friendb', `q${RUN}friendb`);

    // Friendship rows written directly through canonicalPair (D-14) — the
    // schema-level ordering CHECK is what accepts them, not the request
    // lifecycle, which is irrelevant to what this spec proves.
    await db.insert(friendship).values(canonicalPair(caller.accountId, friendA.accountId));
    await db.insert(friendship).values(canonicalPair(caller.accountId, friendB.accountId));

    // Saves: festival A by caller, friendA AND stranger (stranger is not a
    // friend, so their save must not matter); festival B by friendB only;
    // festival C by nobody.
    await db.insert(myFestival).values([
      { visitorId: caller.accountId, festivalId: festivalAId },
      { visitorId: friendA.accountId, festivalId: festivalAId },
      { visitorId: stranger.accountId, festivalId: festivalAId },
      { visitorId: friendB.accountId, festivalId: festivalBId },
    ]);
  });

  afterAll(async () => {
    const accountIds = [caller.accountId, stranger.accountId, friendA.accountId, friendB.accountId];
    await db.delete(myFestival).where(inArray(myFestival.visitorId, accountIds));
    await db
      .delete(friendship)
      .where(or(inArray(friendship.lowerId, accountIds), inArray(friendship.higherId, accountIds)));
    await db.delete(visitorProfile).where(inArray(visitorProfile.accountId, accountIds));
    // Only the two subject-only `user` rows this spec inserted directly —
    // `caller`/`stranger` belong to better-auth via OTP sign-in and are left
    // alone, the same convention every OTP-based spec in this suite follows.
    await db.delete(user).where(inArray(user.id, [friendA.accountId, friendB.accountId]));
    await db.delete(festival).where(inArray(festival.id, [festivalAId, festivalBId, festivalCId]));
    await app.close();
  });

  it('1. schnittmenge: caller in festival A sees exactly friendA — not stranger, not friendB', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/friends`)
      .set('cookie', caller.cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].profile.accountId).toBe(friendA.accountId);
  });

  it('2. cross-tenant (SEC-02 proof): same caller, festival B -> exactly friendB, not friendA', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalBId}/friends`)
      .set('cookie', caller.cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].profile.accountId).toBe(friendB.accountId);
  });

  it('3. fremde sicht: stranger asking about festival A gets [] although they saved it themselves', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/friends`)
      .set('cookie', stranger.cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('4. leere schnittmenge: a real festival none of caller’s friends saved is 200 [], not 404', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalCId}/friends`)
      .set('cookie', caller.cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('5. selbstausschluss: caller never appears in their own list, even in a festival they themselves saved', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/friends`)
      .set('cookie', caller.cookie);

    expect(res.status).toBe(200);
    const ids = (res.body as Array<{ profile: { accountId: string } }>).map((f) => f.profile.accountId);
    expect(ids).not.toContain(caller.accountId);
  });

  it('6. field absence: the body carries only profile+friendsSince, no my_festival value anywhere', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/friends`)
      .set('cookie', caller.cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(Object.keys(res.body[0]).sort()).toEqual(['friendsSince', 'profile']);
    expect(Object.keys(res.body[0].profile).sort()).toEqual(
      ['accountId', 'avatar', 'displayName', 'gender', 'pronoun', 'username'].sort(),
    );

    // Owner-only field absence (VIS-02 posture, applied to this new path too).
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(FRIEND_A_BIRTH_DATE);
    expect(serialized).not.toContain('birthDate');
    expect(serialized).not.toContain('birth_date');
    expect(serialized).not.toContain('email');

    // ADR-014: no value that ever lived in `my_festival` — the table is a
    // pure filter in the join, contributing zero columns to the select.
    expect(serialized).not.toContain(festivalAId);
    expect(serialized).not.toContain('festivalId');
    expect(serialized).not.toContain('visitorId');
    expect(serialized).not.toContain('savedAt');
    expect(serialized).not.toContain('camp');
  });

  it('7. unbekanntes festival: a syntactically valid but non-existent UUID gives 200 [], not 404', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${randomUUID()}/friends`)
      .set('cookie', caller.cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('8. ohne session: 401 (global AuthGuard, SEC-01)', async () => {
    const res = await request(app.getHttpServer()).get(`/api/v1/festivals/${festivalAId}/friends`);
    expect(res.status).toBe(401);
  });
});
