// Two-POST body-parser proof (02-05-PLAN.md Task 2, SC-4). Proves that with
// `NestFactory.create(AppModule, { bodyParser: false })` +
// `AuthModule.forRoot({ auth, bodyParser: {...} })` re-applying Express body
// parsers for non-auth routes (RESEARCH.md "Confirmed Wiring"), BOTH POST
// halves receive a correctly parsed request body:
//   (a) the /api/auth half — better-auth's own emailOTP request+verify POSTs
//   (b) the ts-rest half — POST /api/v1/festivals/:festivalId/save
//
// Per RESEARCH.md's "Sampling Rate": in-process Supertest against a NestJS
// TestingModule may not reproduce Express body-parser stream-consumption
// edge cases identically to a real HTTP round-trip, so the ts-rest half is
// ADDITIONALLY required to be run at least once against a live dev server:
//
//   pnpm --filter @quiks/api dev     (in one terminal)
//   node apps/api/test/smoke/otp-me-smoke.mjs
//
// (otp-me-smoke.mjs already exercises the full OTP request/verify body-parse
// path against the live dev server end-to-end — its "POST returns 200" +
// "session cookie set" checks ARE the live proof for the /api/auth half of
// this same claim. A dedicated live-round-trip check for the ts-rest
// festivals/:id/save half was additionally run manually against
// `pnpm --filter @quiks/api dev` during this plan's execution — see
// 02-05-SUMMARY.md's Deviations/Decisions section for the transcript.)

import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { festival, myFestival, user, visitorProfile, type Database } from '@quiks/db';

import { createTestApp, createTestDatabase } from './setup';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAPTURE_FILE = join(__dirname, '..', '.otp-dev-transport.local.json');
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

describe('body-parser wiring (SC-4, two-POST proof)', () => {
  let app: INestApplication;
  let db: Database;

  const testEmail = `bodyparser-smoke-${randomUUID()}@quiks.dev`;
  let accountId: string;
  let cookie: string;
  let festivalId: string;

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();
  });

  afterAll(async () => {
    if (festivalId) {
      await db.delete(myFestival).where(eq(myFestival.visitorId, accountId));
      await db.delete(visitorProfile).where(eq(visitorProfile.accountId, accountId));
      await db.delete(festival).where(eq(festival.id, festivalId));
    }
    // Intentionally NOT deleting the `user`/`session` rows — better-auth owns
    // that table and the throwaway randomUUID email keeps this run isolated.
    await app.close();
  });

  it('(a) the /api/auth half: both OTP POST bodies parse (request + verify)', async () => {
    // Request half — a JSON body ({ email, type }) must parse for better-auth
    // to know which email to send the code to.
    const requestRes = await request(app.getHttpServer())
      .post('/api/auth/email-otp/send-verification-otp')
      .set('origin', ORIGIN)
      .send({ email: testEmail, type: 'sign-in' });
    expect(requestRes.status).toBe(200);
    expect(requestRes.body).toMatchObject({ success: true });

    const otp = await readCapturedOtp(testEmail);

    // Verify half — a JSON body ({ email, otp }) must parse for better-auth
    // to validate the code and mint a session.
    const verifyRes = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email-otp')
      .set('origin', ORIGIN)
      .send({ email: testEmail, otp });
    expect(verifyRes.status).toBe(200);

    cookie = cookieHeaderFromSetCookie(verifyRes.headers['set-cookie']);
    expect(cookie.length).toBeGreaterThan(0);

    const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, testEmail)).limit(1);
    if (!u) throw new Error('sign-in did not create a user row');
    accountId = u.id;
  });

  it('(b) the ts-rest half: POST /api/v1/festivals/:id/save receives a parsed context and writes the row', async () => {
    // complete-profile is a precondition for saving (my_festival.visitorId
    // FKs to visitor_profile.accountId, not user.id) — this POST is itself a
    // third ts-rest body-parse proof point (username/displayName).
    const profileRes = await request(app.getHttpServer())
      .post('/api/v1/me/complete-profile')
      .set('cookie', cookie)
      .send({ username: `bodyparser_${randomUUID().slice(0, 8)}`, displayName: 'Bodyparser Smoke Tester' });
    expect(profileRes.status).toBe(200);

    const [fest] = await db
      .insert(festival)
      .values({
        slug: `bodyparser-smoke-${randomUUID()}`,
        name: 'Bodyparser Smoke Festival',
        defaultLocale: 'de',
      })
      .returning();
    if (!fest) throw new Error('festival fixture insert returned no row');
    festivalId = fest.id;

    const saveRes = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalId}/save`)
      .set('cookie', cookie)
      .send({});
    expect(saveRes.status).toBe(200);
    expect(saveRes.body).toEqual({ saved: true });

    const rows = await db
      .select()
      .from(myFestival)
      .where(and(eq(myFestival.visitorId, accountId), eq(myFestival.festivalId, festivalId)));
    expect(rows).toHaveLength(1);
  });
});
