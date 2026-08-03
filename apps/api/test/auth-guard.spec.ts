import { randomUUID } from 'node:crypto';

import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from './setup';

/**
 * SEC-01 comprehensive login-first proof (02-05-PLAN.md Task 1). Generalizes
 * auth-guard-tracer.spec.ts's 401/200 pattern over the WHOLE `/api/v1`
 * endpoint set, not just the `GET /me` tracer slice. Doesn't exercise the
 * OTP flow itself (needs a live HTTP round-trip — see
 * test/smoke/otp-me-smoke.mjs and bodyparser-smoke.spec.ts); only proves the
 * global AuthGuard rejects anonymous requests on every protected route and
 * lets the two `@AllowAnonymous()`-equivalent baselines through.
 */
describe('auth guard (SEC-01 comprehensive)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('protected endpoints reject an anonymous caller with 401', () => {
    it('GET /api/v1/me', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/me');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/me/complete-profile', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/me/complete-profile')
        .send({ username: 'anon-attempt', displayName: 'Anon Attempt' });
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/me/username-availability', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/me/username-availability')
        .query({ username: 'anon-attempt' });
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/me/festivals', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/me/festivals');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/festivals', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/festivals');
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/festivals/:festivalId/save', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/festivals/${randomUUID()}/save`)
        .send({});
      expect(res.status).toBe(401);
    });

    // Extra coverage beyond the plan's named six — the objective calls for a
    // "comprehensive" guard spec "over the whole endpoint set" and these two
    // FestivalController methods are neither named in the six nor
    // @AllowAnonymous(), so they must be proven too (no untagged endpoint).
    it('GET /api/v1/festivals/:slug', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/festivals/some-slug');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/festivals/:festivalId/tags', async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/v1/festivals/${randomUUID()}/tags`,
      );
      expect(res.status).toBe(401);
    });
  });

  describe('anonymous baseline works without a session', () => {
    it('GET /api/v1/health returns 200', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });

    it('POST /api/auth/email-otp/send-verification-otp succeeds without a session', async () => {
      // The OTP-request endpoint (better-auth's own /api/auth/* group,
      // self-managed — never routed through the app's global AuthGuard).
      // better-auth's CSRF check requires an Origin header on state-changing
      // /api/auth/* POSTs (see test/smoke/otp-me-smoke.mjs) — a bare
      // supertest request doesn't send one by default.
      const origin =
        process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? '8081'}`;
      const res = await request(app.getHttpServer())
        .post('/api/auth/email-otp/send-verification-otp')
        .set('origin', origin)
        .send({ email: `auth-guard-baseline-${randomUUID()}@festipal.dev`, type: 'sign-in' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ success: true });
    });
  });
});
