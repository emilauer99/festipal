import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { festival, myFestival, user, visitorProfile, type Database } from '@quiks/db';

import { createTestApp, createTestDatabase } from './setup';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Mirrors apps/api/src/auth/email/dev-otp-email-provider.ts's CAPTURE_FILE
// (apps/api/.otp-dev-transport.local.json) — this file lives one directory
// below apps/api (test/).
const CAPTURE_FILE = join(__dirname, '..', '.otp-dev-transport.local.json');
// better-auth's CSRF check requires an Origin header on state-changing
// /api/auth/* POSTs (see test/smoke/otp-me-smoke.mjs) — the value only needs
// to match BETTER_AUTH_URL's trusted-origin, not the actual supertest socket.
const ORIGIN = process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? '8081'}`;

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

/** In-process counterpart to test/smoke/otp-me-smoke.mjs's live OTP round-trip. */
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

describe('me endpoints (complete-profile, GET /me, GET /me/festivals)', () => {
  let app: INestApplication;
  let db: Database;

  const testEmail = `me-endpoints-${randomUUID()}@quiks.dev`;
  // D-03: usernames are lowercase-only (a-z 0-9 _ .) per the server-side Zod
  // cap on visitorProfileInsertSchema — no dash.
  const username = `visitor_${randomUUID().slice(0, 8)}`;
  let accountId: string;
  let cookie: string;
  let festivalId: string;

  // D-12 needs a SECOND account: an account may complete its profile exactly
  // once (a repeat call is the 409 proven below), so the "identity fields
  // supplied" and "identity fields omitted" shapes cannot both be exercised on
  // one account. The account above covers the omitted case, this one the
  // supplied case plus the T-06-07 length-cap rejection.
  const identityEmail = `me-identity-${randomUUID()}@quiks.dev`;
  const identityUsername = `visitor_${randomUUID().slice(0, 8)}`;
  let identityAccountId: string;
  let identityCookie: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();

    cookie = await signInWithOtp(app, testEmail);

    const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, testEmail)).limit(1);
    if (!u) throw new Error('sign-in did not create a user row');
    accountId = u.id;

    identityCookie = await signInWithOtp(app, identityEmail);
    const [iu] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, identityEmail))
      .limit(1);
    if (!iu) throw new Error('identity sign-in did not create a user row');
    identityAccountId = iu.id;

    const [fest] = await db
      .insert(festival)
      .values({
        slug: `me-endpoints-test-${randomUUID()}`,
        name: 'Me Endpoints Test Festival',
        defaultLocale: 'de',
      })
      .returning();
    if (!fest) throw new Error('festival fixture insert returned no row');
    festivalId = fest.id;
  });

  afterAll(async () => {
    await db.delete(myFestival).where(eq(myFestival.visitorId, accountId));
    await db.delete(visitorProfile).where(eq(visitorProfile.accountId, accountId));
    await db.delete(visitorProfile).where(eq(visitorProfile.accountId, identityAccountId));
    await db.delete(festival).where(eq(festival.id, festivalId));
    // Intentionally NOT deleting the `user`/`session` rows created by the OTP
    // sign-in — better-auth owns that table and the throwaway randomUUID
    // email keeps this run isolated from other specs/dev data.
    await app.close();
  });

  it('GET /me before profile completion returns profile: null', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/me').set('cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.accountId).toBe(accountId);
    expect(res.body.profile).toBeNull();
  });

  it('POST /me/complete-profile returns 200 with the public profile', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/me/complete-profile')
      .set('cookie', cookie)
      .send({ username, displayName: 'Me Endpoints Tester' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ accountId, username, displayName: 'Me Endpoints Tester' });
  });

  // WR-03 (06-REVIEW.md) — REPLACES the previous assertion, which expected 409
  // here. That expectation was wrong: it locked in the very ambiguity the review
  // found. `23505` on this insert has two causes with opposite meanings, and the
  // accountId PK ("this account already HAS a profile") is not a username
  // conflict — the client turns every 409 into "@handle is already taken" and
  // offers an alternative, so a retry after a timeout-with-server-success could
  // never leave the screen. The repeat call is now answered idempotently with
  // the profile that already exists, which is what puts that retry back on the
  // 200 path. A genuine username conflict still returns 409 — proven at the DB
  // layer in username-race.spec.ts, where two DIFFERENT accounts race one name.
  //
  // D-03 makes usernames lowercase-only via this endpoint, so a true
  // case-variant duplicate can never reach it (Zod rejects uppercase at 400
  // before the DB is touched).
  it('a second complete-profile call for the same account returns the existing profile', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/me/complete-profile')
      .set('cookie', cookie)
      .send({ username: `${username}x`, displayName: 'Should Not Matter' });

    expect(res.status).toBe(200);
    // Idempotent, NOT an update: the first profile is returned unchanged, so
    // neither the resubmitted username nor the display name leaks in. Editing a
    // profile is PROF-02 and has its own endpoint.
    expect(res.body).toMatchObject({
      accountId,
      username,
      displayName: 'Me Endpoints Tester',
    });
  });

  it('GET /me/username-availability reflects the taken username as unavailable', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me/username-availability')
      .query({ username: username.toUpperCase() })
      .set('cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ available: false });
  });

  it('GET /me/username-availability reports an unused username as available', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me/username-availability')
      .query({ username: `unused-${randomUUID().slice(0, 8)}` })
      .set('cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ available: true });
  });

  it('GET /me after profile completion returns the populated profile', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/me').set('cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.profile).toMatchObject({ accountId, username });
  });

  it('GET /me/festivals returns exactly the caller-saved festival', async () => {
    await db.insert(myFestival).values({ visitorId: accountId, festivalId });

    const res = await request(app.getHttpServer()).get('/api/v1/me/festivals').set('cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: festivalId, slug: expect.any(String) as string });
  });

  // D-04 — `createdAt` is the Account's creation time, read server-side off the
  // better-auth session and serialized with an explicit `.toISOString()`.
  it('GET /me returns createdAt as a parseable ISO string, never a Date', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/me').set('cookie', cookie);
    expect(res.status).toBe(200);
    expect(typeof res.body.createdAt).toBe('string');

    const parsed = new Date(res.body.createdAt as string);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
    // Negative assertion: JSON carries no Date, so the value that arrives here
    // must not be one. Round-tripping it through toISOString() proves it is the
    // full ISO form and would fail the moment the controller stopped converting
    // explicitly and let JSON.stringify decide the shape behind the type's back.
    expect(res.body.createdAt).not.toBeInstanceOf(Date);
    expect(res.body.createdAt).toBe(parsed.toISOString());
  });

  // D-12 — the three identity fields are OPTIONAL. This account's
  // complete-profile call above supplied none of them and still returned 200;
  // that request staying valid is half the proof, this null projection is the
  // other half.
  it('GET /me returns null for all three identity fields when they were omitted', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/me').set('cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.profile).toMatchObject({ pronoun: null, birthDate: null, gender: null });
  });

  // T-06-07 — the server-side cap is the real gate; the mobile screen's cap is
  // UX only. Declared BEFORE the successful round-trip below because it shares
  // that account, and only a rejected request leaves it still profile-less.
  it('rejects a pronoun above the server-side cap with a 4xx and stores nothing', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/me/complete-profile')
      .set('cookie', identityCookie)
      .send({
        username: identityUsername,
        displayName: 'Identity Tester',
        pronoun: 'x'.repeat(21),
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    // Rejected before the DB was touched — the account still has no profile.
    const me = await request(app.getHttpServer()).get('/api/v1/me').set('cookie', identityCookie);
    expect(me.status).toBe(200);
    expect(me.body.profile).toBeNull();
  });

  // WR-02 (06-REVIEW.md) — `birthDate` is constrained at the CONTRACT, not left
  // to Postgres. Both halves of the old gap are asserted here: a value Postgres
  // would REJECT used to surface as a 500 (`completeProfile` only maps `23505`),
  // and a Postgres date dialect it would ACCEPT used to be stored verbatim —
  // `'infinity'` round-trips through GET /me as the literal string "infinity".
  it.each(['2020-02-30', '2026-13-01', 'infinity', 'today', '08/12/2026', ''])(
    'rejects birthDate %j with a 4xx and stores nothing',
    async (birthDate) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/me/complete-profile')
        .set('cookie', identityCookie)
        .send({ username: identityUsername, displayName: 'Identity Tester', birthDate });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);

      const me = await request(app.getHttpServer()).get('/api/v1/me').set('cookie', identityCookie);
      expect(me.status).toBe(200);
      expect(me.body.profile).toBeNull();
    },
  );

  // D-12 / D-12a — full round-trip. This test is the reason the migration
  // cannot be skipped: typecheck and build derive their types from the schema
  // source, only a query against the real database proves the columns exist.
  it('round-trips pronoun, birthDate and gender through complete-profile and GET /me', async () => {
    const identity = { pronoun: 'sie/ihr', birthDate: '2002-03-14', gender: 'weiblich' };

    const created = await request(app.getHttpServer())
      .post('/api/v1/me/complete-profile')
      .set('cookie', identityCookie)
      .send({ username: identityUsername, displayName: 'Identity Tester', ...identity });

    expect(created.status).toBe(200);
    expect(created.body).toMatchObject(identity);

    const me = await request(app.getHttpServer()).get('/api/v1/me').set('cookie', identityCookie);
    expect(me.status).toBe(200);
    expect(me.body.profile).toMatchObject(identity);
    // D-12a: the birth date stays a bare YYYY-MM-DD string. `date({ mode:
    // 'string' })` is what keeps it one — a timestamp column would surface here
    // as 2002-03-13T23:00:00.000Z in a UTC+1 environment, silently shifting the
    // stored day by one.
    expect(me.body.profile.birthDate).toBe('2002-03-14');
    expect(me.body.profile.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
