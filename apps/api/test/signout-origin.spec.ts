import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from './setup';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Mirrors me-endpoints.spec.ts's CAPTURE_FILE — apps/api/.otp-dev-transport.local.json.
const CAPTURE_FILE = join(__dirname, '..', '.otp-dev-transport.local.json');
// better-auth's CSRF check requires an Origin header on state-changing
// /api/auth/* POSTs from a standard HTTP client (see me-endpoints.spec.ts).
const ORIGIN = process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? '8081'}`;
// ADR-024 — the trusted scheme apps/mobile's expoClient sends as `expo-origin`
// (see apps/mobile/lib/auth-client.ts's `scheme: 'quiks'`); already
// whitelisted in apps/api/src/auth/auth.instance.ts's trustedOrigins.
const EXPO_ORIGIN = 'quiks://';

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

/** Mirrors me-endpoints.spec.ts's in-process OTP round-trip helper. */
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
 * AUTH-04 (WINDOWS id 2) — proves the `@better-auth/expo` server `expo()`
 * plugin (apps/api/src/auth/auth.instance.ts) genuinely fixes the defect
 * 04-VERIFICATION.md found: a real device request from apps/mobile's
 * expoClient carries `expo-origin` and NO standard `origin` header, which
 * before this plugin was rejected 403 (MISSING_OR_NULL_ORIGIN) before the
 * session was ever revoked.
 */
describe('sign-out with expo-origin header (AUTH-04 server revocation)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it(
    'accepts expo-origin + cookie sign-out (non-403) and genuinely revokes the session',
    async () => {
      const email = `signout-origin-${randomUUID()}@festipal.dev`;
      const cookie = await signInWithOtp(app, email);

      // (2) The exact device request shape: session cookie + `expo-origin`,
      // NO standard `origin` header. Direct proof the expo() plugin
      // translated the header before the origin-check middleware ran.
      const signOutRes = await request(app.getHttpServer())
        .post('/api/auth/sign-out')
        .set('cookie', cookie)
        .set('expo-origin', EXPO_ORIGIN)
        .send({});
      expect(signOutRes.status).not.toBe(403);
      expect(signOutRes.body).not.toMatchObject({ code: 'MISSING_OR_NULL_ORIGIN' });

      // (3) GENUINE server-side revocation — the session row itself is gone,
      // not just the client-side cache. Same cookie, protected endpoint.
      const meRes = await request(app.getHttpServer()).get('/api/v1/me').set('cookie', cookie);
      expect(meRes.status).toBe(401);
    },
    30_000,
  );

  it(
    'negative control: sign-out with NEITHER origin NOR expo-origin still 403s',
    async () => {
      // Separate fresh sign-in so this does not perturb the revocation
      // assertion above — proves the origin-check is still active on
      // cookie-bearing requests and that `expo-origin` is exactly what made
      // the previous request pass, not some blanket loosening (T-4-07-I).
      const email = `signout-origin-negctrl-${randomUUID()}@festipal.dev`;
      const cookie = await signInWithOtp(app, email);

      const res = await request(app.getHttpServer())
        .post('/api/auth/sign-out')
        .set('cookie', cookie)
        .send({});
      expect(res.status).toBe(403);
    },
    30_000,
  );
});
