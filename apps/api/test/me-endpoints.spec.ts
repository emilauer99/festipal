import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { festival, myFestival, user, visitorProfile, type Database } from '@festipal/db';

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

  const testEmail = `me-endpoints-${randomUUID()}@festipal.dev`;
  const username = `visitor-${randomUUID().slice(0, 8)}`;
  let accountId: string;
  let cookie: string;
  let festivalId: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();

    cookie = await signInWithOtp(app, testEmail);

    const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, testEmail)).limit(1);
    if (!u) throw new Error('sign-in did not create a user row');
    accountId = u.id;

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

  it('a duplicate (case-variant) username on complete-profile returns 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/me/complete-profile')
      .set('cookie', cookie)
      .send({ username: username.toUpperCase(), displayName: 'Should Not Matter' });

    // This account already has a profile (accountId is the PK) — either the
    // PK conflict or the lower(username) conflict maps to 409, never a 500.
    expect(res.status).toBe(409);
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
});
