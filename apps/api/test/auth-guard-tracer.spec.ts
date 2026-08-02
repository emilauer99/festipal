import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp } from './setup';

/**
 * In-process fast-feedback counterpart to test/smoke/otp-me-smoke.mjs's
 * guard assertions (02-02-PLAN.md Task 2). Doesn't exercise the OTP flow
 * itself (that needs a live HTTP round-trip — see the smoke script and
 * RESEARCH.md's "Sampling Rate" note); only proves the global AuthGuard
 * (SEC-01) is wired: protected-by-default routes reject anonymous requests,
 * @AllowAnonymous() routes don't.
 */
describe('auth guard tracer (SEC-01)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/me without a session returns 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/health without a session returns 200 (@AllowAnonymous baseline)', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
