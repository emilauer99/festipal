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
// Mirrors me-endpoints.spec.ts / save-idempotency.spec.ts's CAPTURE_FILE.
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

async function createVisitor(
  app: INestApplication,
  db: Database,
  label: string,
): Promise<{ accountId: string; cookie: string }> {
  const email = `festival-isolation-${label}-${randomUUID()}@quiks.dev`;
  const cookie = await signInWithOtp(app, email);

  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error(`sign-in did not create a user row for ${label}`);
  const accountId = u.id;

  await db.insert(visitorProfile).values({
    accountId,
    username: `visitor-${label}-${randomUUID().slice(0, 8)}`,
    displayName: `Isolation Test ${label}`,
  });

  return { accountId, cookie };
}

/**
 * SEC-02 cross-tenant denial (02-05-PLAN.md Task 2). Provisions its OWN two
 * throwaway festivals (A and B) and two visitors — per D-03, this spec does
 * NOT read/write the frequency-2026 dev seed. Proves `GET /me/festivals` is
 * scoped ONLY by the caller's session-derived visitorId (RESEARCH.md
 * "Cross-tenant denial query shape"), never a request param and never
 * client-side filtered (must_haves prohibition).
 */
describe('festival isolation (SEC-02 cross-tenant denial)', () => {
  let app: INestApplication;
  let db: Database;

  let festivalAId: string;
  let festivalBId: string;
  let festivalASlug: string;
  let visitor1: { accountId: string; cookie: string };
  let visitor2: { accountId: string; cookie: string };

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();

    const [festA] = await db
      .insert(festival)
      .values({
        slug: `isolation-test-a-${randomUUID()}`,
        name: 'Isolation Test Festival A',
        defaultLocale: 'de',
        startDate: '2026-08-13',
        endDate: '2026-08-16',
        place: 'Wiesen, Burgenland',
      })
      .returning();
    const [festB] = await db
      .insert(festival)
      .values({
        slug: `isolation-test-b-${randomUUID()}`,
        name: 'Isolation Test Festival B',
        defaultLocale: 'de',
        startDate: '2026-09-03',
        endDate: '2026-09-06',
        place: 'Tenant B Test Place',
      })
      .returning();
    if (!festA || !festB) throw new Error('festival fixture insert returned no row');
    festivalAId = festA.id;
    festivalBId = festB.id;
    festivalASlug = festA.slug;

    visitor1 = await createVisitor(app, db, 'visitor1');
    visitor2 = await createVisitor(app, db, 'visitor2');

    // Visitor 1 saves ONLY festival A. Visitor 2 saves nothing.
    await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/save`)
      .set('cookie', visitor1.cookie)
      .send({})
      .expect(200);
  });

  afterAll(async () => {
    await db.delete(myFestival).where(eq(myFestival.visitorId, visitor1.accountId));
    await db.delete(myFestival).where(eq(myFestival.visitorId, visitor2.accountId));
    await db.delete(visitorProfile).where(eq(visitorProfile.accountId, visitor1.accountId));
    await db.delete(visitorProfile).where(eq(visitorProfile.accountId, visitor2.accountId));
    await db.delete(festival).where(eq(festival.id, festivalAId));
    await db.delete(festival).where(eq(festival.id, festivalBId));
    // Intentionally NOT deleting the `user`/`session` rows — better-auth owns
    // that table and throwaway randomUUID emails keep this run isolated.
    await app.close();
  });

  it('visitor 1 (saved A only) sees exactly [A], never [A, B]', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me/festivals')
      .set('cookie', visitor1.cookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(festivalAId);
    const ids = (res.body as Array<{ id: string }>).map((f) => f.id);
    expect(ids).not.toContain(festivalBId);

    // D-08 round-trip: festival A's date/place fields survive through the
    // caller-scoped listMyFestivals projection unchanged.
    expect(res.body[0].startDate).toBe('2026-08-13');
    expect(res.body[0].endDate).toBe('2026-08-16');
    expect(res.body[0].place).toBe('Wiesen, Burgenland');

    // SEC-02 for D-08: festival B's distinct date/place values (and its id)
    // never leak into a visitor who saved only A — check the SERIALIZED
    // response body, not just the parsed array, so no shape survives.
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(festivalBId);
    expect(serialized).not.toContain('2026-09-03');
    expect(serialized).not.toContain('2026-09-06');
    expect(serialized).not.toContain('Tenant B Test Place');
  });

  it('visitor 2 (no saves) sees []', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me/festivals')
      .set('cookie', visitor2.cookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /api/v1/festivals (browse) still returns both A and B — unscoped by design', async () => {
    // Confirms the isolation proven above is a property of `GET /me/festivals`
    // scoping, not an artifact of festival B being unreachable/invisible
    // (Pitfall 4 — browse vs my-festivals are distinct contracts).
    const res = await request(app.getHttpServer())
      .get('/api/v1/festivals')
      .set('cookie', visitor1.cookie);
    expect(res.status).toBe(200);
    const ids = (res.body as Array<{ id: string }>).map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining([festivalAId, festivalBId]));

    // D-08 round-trip on the browse endpoint: locate each row by id (never
    // by array position/length) and assert its OWN distinct date/place.
    type BrowseRow = { id: string; startDate: string | null; endDate: string | null; place: string | null };
    const rows = res.body as BrowseRow[];
    const rowA = rows.find((r) => r.id === festivalAId);
    const rowB = rows.find((r) => r.id === festivalBId);
    expect(rowA?.startDate).toBe('2026-08-13');
    expect(rowA?.endDate).toBe('2026-08-16');
    expect(rowA?.place).toBe('Wiesen, Burgenland');
    expect(rowB?.startDate).toBe('2026-09-03');
    expect(rowB?.endDate).toBe('2026-09-06');
    expect(rowB?.place).toBe('Tenant B Test Place');
  });

  it('GET /api/v1/festivals/:slug (single-festival read) round-trips D-08 fields for festival A', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalASlug}`)
      .set('cookie', visitor1.cookie);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(festivalAId);
    expect(res.body.startDate).toBe('2026-08-13');
    expect(res.body.endDate).toBe('2026-08-16');
    expect(res.body.place).toBe('Wiesen, Burgenland');
  });
});
