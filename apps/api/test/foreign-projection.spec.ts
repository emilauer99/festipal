import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { user, visitorProfile, type Database } from '@quiks/db';

import { createTestApp, createTestDatabase } from './setup';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Mirrors festival-isolation.spec.ts / me-endpoints.spec.ts's CAPTURE_FILE.
const CAPTURE_FILE = join(__dirname, '..', '.otp-dev-transport.local.json');
const ORIGIN = process.env.BETTER_AUTH_URL ?? `http://localhost:${process.env.PORT ?? '8081'}`;

/** Visitor B's owner-only values — every one of them must be absent from a foreign view. */
const B_BIRTH_DATE = '1993-04-17';
const A_BIRTH_DATE = '1988-11-02';

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

/**
 * EXACTLY TWO visitors are provisioned in this spec, on purpose: better-auth's
 * default OTP rate limiter allows 3 requests per 60s per source and every
 * `createVisitor` spends one.
 */
async function createVisitor(
  app: INestApplication,
  db: Database,
  label: string,
  identity: { pronoun: string; gender: string; birthDate: string },
): Promise<Visitor> {
  const email = `foreign-projection-${label}-${randomUUID()}@quiks.dev`;
  const cookie = await signInWithOtp(app, email);

  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error(`sign-in did not create a user row for ${label}`);

  // Conforms to visitorProfileInsertSchema's username rule (lowercase, digits,
  // `_` and `.`, 3-20 chars) even though a direct insert bypasses Zod — the
  // handle is what the endpoint under test resolves.
  const username = `fp.${label}.${randomUUID().slice(0, 8)}`;
  await db.insert(visitorProfile).values({
    accountId: u.id,
    username,
    displayName: `Foreign Projection ${label}`,
    ...identity,
  });

  return { accountId: u.id, cookie, email, username };
}

/**
 * The phase-07 tracer route, end to end against the live local Postgres:
 * `GET /api/v1/visitors/:username` returns the FOREIGN view (VIS-01) plus the
 * caller's relation, and proves it by field ABSENCE on the serialized body
 * (07-CONTEXT.md D-03) — a test that only checks the allowed fields are present
 * is blind to exactly the leak this phase exists to prevent.
 */
describe('foreign projection (VIS-01 field absence, D-02/D-03)', () => {
  let app: INestApplication;
  let db: Database;
  let visitorA: Visitor;
  let visitorB: Visitor;

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();

    visitorA = await createVisitor(app, db, 'a', {
      pronoun: 'sie/ihr',
      gender: 'weiblich',
      birthDate: A_BIRTH_DATE,
    });
    visitorB = await createVisitor(app, db, 'b', {
      pronoun: 'er/ihm',
      gender: 'maennlich',
      birthDate: B_BIRTH_DATE,
    });
  });

  afterAll(async () => {
    await db.delete(visitorProfile).where(eq(visitorProfile.accountId, visitorA.accountId));
    await db.delete(visitorProfile).where(eq(visitorProfile.accountId, visitorB.accountId));
    // Intentionally NOT deleting the `user`/`session` rows — better-auth owns
    // that table and throwaway randomUUID emails keep this run isolated.
    await app.close();
  });

  it('A resolving B’s handle gets the six-field foreign view with relation "none"', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/visitors/${visitorB.username}`)
      .set('cookie', visitorA.cookie);

    expect(res.status).toBe(200);
    expect(res.body.profile.accountId).toBe(visitorB.accountId);
    expect(res.body.profile.username).toBe(visitorB.username);
    expect(res.body.profile.displayName).toBe('Foreign Projection b');
    expect(res.body.profile.pronoun).toBe('er/ihm');
    // D-02: `gender` is deliberately part of the published foreign view.
    expect(res.body.profile.gender).toBe('maennlich');
    // The nullable half of the `empty` edge: an unset column travels as null,
    // it does not vanish from the shape.
    expect(res.body.profile.avatar).toBeNull();
    expect(Object.keys(res.body.profile).sort()).toEqual([
      'accountId',
      'avatar',
      'displayName',
      'gender',
      'pronoun',
      'username',
    ]);
    expect(res.body.relation).toBe('none');
  });

  it('the SERIALIZED foreign response carries neither B’s birth date nor B’s e-mail (D-03)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/visitors/${visitorB.username}`)
      .set('cookie', visitorA.cookie);
    expect(res.status).toBe(200);

    // Absence on the serialized body, not on the parsed object: no nesting,
    // no renamed key and no stringified sub-shape can smuggle these through.
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('birthDate');
    expect(serialized).not.toContain('birth_date');
    expect(serialized).not.toContain(B_BIRTH_DATE);
    expect(serialized).not.toContain('email');
    expect(serialized).not.toContain(visitorB.email);
  });

  it('A resolving their OWN handle gets relation "self" and the same field set — no owner view', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/visitors/${visitorA.username}`)
      .set('cookie', visitorA.cookie);

    expect(res.status).toBe(200);
    expect(res.body.relation).toBe('self');
    expect(res.body.profile.accountId).toBe(visitorA.accountId);
    expect(Object.keys(res.body.profile).sort()).toEqual([
      'accountId',
      'avatar',
      'displayName',
      'gender',
      'pronoun',
      'username',
    ]);
    // Self-adjacency does NOT promote the response to the owner view — A's own
    // birth date is absent here even though A is looking at A.
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('birthDate');
    expect(serialized).not.toContain(A_BIRTH_DATE);
  });

  it('an unclaimed handle is 404 with the shared error shape, not 200 with null', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/visitors/nobody.${randomUUID().slice(0, 8)}`)
      .set('cookie', visitorA.cookie);

    expect(res.status).toBe(404);
    expect(typeof res.body.message).toBe('string');
  });

  it('GET /me still serves A the OWNER view — the split separates, it does not strip', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('cookie', visitorA.cookie);

    expect(res.status).toBe(200);
    expect(res.body.profile).toHaveProperty('birthDate');
    expect(res.body.profile.birthDate).toBe(A_BIRTH_DATE);
    expect(res.body.profile.gender).toBe('weiblich');
  });
});
