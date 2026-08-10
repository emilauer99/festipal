import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { festival, myFestival, user, type Database } from '@quiks/db';

import { createTestApp, createTestDatabase } from './setup';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Mirrors save-idempotency.spec.ts / dev-otp-email-provider.ts's CAPTURE_FILE.
const CAPTURE_FILE = join(__dirname, '..', '.otp-dev-transport.local.json');
// better-auth's CSRF check requires an Origin header on state-changing
// /api/auth/* POSTs — see test/smoke/otp-me-smoke.mjs.
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

describe('POST /festivals/:festivalId/save (profile-required 409, CR-01)', () => {
  let app: INestApplication;
  let db: Database;

  const testEmail = `save-profile-required-${randomUUID()}@quiks.dev`;
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

    // Intentionally NOT inserting a visitor_profile row — the caller stays in
    // the reachable GET /me profile: null state this spec exercises.

    const [fest] = await db
      .insert(festival)
      .values({
        slug: `save-profile-required-test-${randomUUID()}`,
        name: 'Save Profile Required Test Festival',
        defaultLocale: 'de',
      })
      .returning();
    if (!fest) throw new Error('festival fixture insert returned no row');
    festivalId = fest.id;
  });

  afterAll(async () => {
    // Defensive: no row should have been written, but clean up if one was.
    await db.delete(myFestival).where(eq(myFestival.visitorId, accountId));
    await db.delete(festival).where(eq(festival.id, festivalId));
    // Intentionally NOT deleting the `user`/`session` rows — better-auth owns
    // that table and the throwaway randomUUID email keeps this run isolated.
    await app.close();
  });

  it('returns a clean 409 (never 500) and writes no my_festival row when the caller has no completed profile', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalId}/save`)
      .set('cookie', cookie)
      .send({});

    expect(res.status).not.toBe(500);
    expect(res.status).toBe(409);
    expect(res.body).toEqual({ message: expect.any(String) });

    const rows = await db
      .select()
      .from(myFestival)
      .where(and(eq(myFestival.visitorId, accountId), eq(myFestival.festivalId, festivalId)));
    expect(rows).toHaveLength(0);
  });
});
