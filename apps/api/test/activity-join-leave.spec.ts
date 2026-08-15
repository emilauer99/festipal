import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { activity, activityParticipant, festival, user, visitorProfile, type Database } from '@quiks/db';

import { createTestApp, createTestDatabase } from './setup';

/**
 * The HTTP-level proof for the membership slice (D-08/D-09/D-10,
 * Erfolgskriterium 2/4). `activity-capacity-db.spec.ts` (Task 1) already
 * proves the trigger holds at the database level with no HTTP or service in
 * the way — this spec proves the ENDPOINTS behave correctly on top of it,
 * including the parallel race run over real requests.
 *
 * Mirrors `activity-create.spec.ts`'s fixture shape: throwaway festivals A/B,
 * ONE real OTP sign-in per visitor (better-auth's rate limiter allows 3
 * requests/60s per source — sessions are fetched once in `beforeAll` and
 * reused across every case below), direct DB inserts for everything that
 * doesn't need a live request/response round-trip.
 */

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
  const email = `activity-join-leave-${label}-${randomUUID()}@quiks.dev`;
  const cookie = await signInWithOtp(app, email);

  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error(`sign-in did not create a user row for ${label}`);
  const accountId = u.id;

  await db.insert(visitorProfile).values({
    accountId,
    username: `activity-jl-${label}-${randomUUID().slice(0, 8)}`,
    displayName: `Activity Join/Leave Test ${label}`,
  });

  return { accountId, cookie };
}

/** Signs in WITHOUT writing a `visitor_profile` row — the reachable first-login state. */
async function createAccountWithoutProfile(
  app: INestApplication,
  db: Database,
  label: string,
): Promise<{ accountId: string; cookie: string }> {
  const email = `activity-join-leave-${label}-${randomUUID()}@quiks.dev`;
  const cookie = await signInWithOtp(app, email);
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error(`sign-in did not create a user row for ${label}`);
  return { accountId: u.id, cookie };
}

describe('activity join/leave/delete (D-08/D-09/D-10, Erfolgskriterium 2 & 4)', () => {
  let app: INestApplication;
  let db: Database;

  let festivalAId: string;
  let festivalBId: string;

  let creator: { accountId: string; cookie: string };
  let joiner1: { accountId: string; cookie: string };
  let joiner2: { accountId: string; cookie: string };
  let noProfile: { accountId: string; cookie: string };

  const activityIds: string[] = [];

  /** A fresh activity in festival A with `creator` already seated. */
  async function makeActivity(opts: {
    capacity: number | null;
    startTime?: Date;
    festivalId?: string;
  }): Promise<string> {
    const targetFestivalId = opts.festivalId ?? festivalAId;
    const [row] = await db
      .insert(activity)
      .values({
        festivalId: targetFestivalId,
        creatorId: creator.accountId,
        title: `Join/Leave Test Activity ${randomUUID().slice(0, 8)}`,
        startTime: opts.startTime ?? new Date(Date.now() + 3_600_000),
        capacity: opts.capacity,
      })
      .returning({ id: activity.id });
    if (!row) throw new Error('activity fixture insert returned no row');
    activityIds.push(row.id);
    await db
      .insert(activityParticipant)
      .values({ activityId: row.id, festivalId: targetFestivalId, visitorId: creator.accountId });
    return row.id;
  }

  const participantRows = (activityId: string) =>
    db.select().from(activityParticipant).where(eq(activityParticipant.activityId, activityId));

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();

    const [festA] = await db
      .insert(festival)
      .values({
        slug: `activity-join-leave-a-${randomUUID()}`,
        name: 'Activity Join/Leave Test Festival A',
        defaultLocale: 'de',
      })
      .returning();
    const [festB] = await db
      .insert(festival)
      .values({
        slug: `activity-join-leave-b-${randomUUID()}`,
        name: 'Activity Join/Leave Test Festival B',
        defaultLocale: 'de',
      })
      .returning();
    if (!festA || !festB) throw new Error('festival fixture insert returned no row');
    festivalAId = festA.id;
    festivalBId = festB.id;

    // Sequential sign-ins, once — the OTP send/verify pair is rate-limited
    // (3 requests/60s per source), so every case below reuses these cookies
    // instead of re-authenticating.
    creator = await createVisitor(app, db, 'creator');
    joiner1 = await createVisitor(app, db, 'joiner1');
    joiner2 = await createVisitor(app, db, 'joiner2');
    noProfile = await createAccountWithoutProfile(app, db, 'noprofile');
  });

  afterAll(async () => {
    await db.delete(activityParticipant).where(inArray(activityParticipant.activityId, activityIds));
    await db.delete(activity).where(inArray(activity.id, activityIds));
    await db
      .delete(visitorProfile)
      .where(
        inArray(visitorProfile.accountId, [creator.accountId, joiner1.accountId, joiner2.accountId]),
      );
    await db.delete(festival).where(eq(festival.id, festivalAId));
    await db.delete(festival).where(eq(festival.id, festivalBId));
    // `user`/`session` rows are intentionally left untouched — same
    // convention as activity-create.spec.ts (better-auth owns that table).
    await app.close();
  });

  it('1. joining succeeds and is idempotent', async () => {
    const activityId = await makeActivity({ capacity: 3 });

    const first = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/join`)
      .set('cookie', joiner1.cookie)
      .send({});
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ result: 'joined' });

    const second = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/join`)
      .set('cookie', joiner1.cookie)
      .send({});
    expect(second.status).toBe(200);
    expect(second.body).toEqual({ result: 'joined' });

    // Creator + joiner1 only — the repeat join did not add a second row.
    expect(await participantRows(activityId)).toHaveLength(2);
  });

  it(
    '2. parallel race for the last seat over HTTP (Erfolgskriterium 2): exactly one 200, one 409, ' +
      'over 5 rounds with a fresh activity each round',
    async () => {
      for (let round = 0; round < 5; round += 1) {
        // capacity 2: creator already occupies seat 1, exactly one more open.
        const activityId = await makeActivity({ capacity: 2 });

        const [resX, resY] = await Promise.all([
          request(app.getHttpServer())
            .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/join`)
            .set('cookie', joiner1.cookie)
            .send({}),
          request(app.getHttpServer())
            .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/join`)
            .set('cookie', joiner2.cookie)
            .send({}),
        ]);

        const statuses = [resX.status, resY.status].sort();
        expect(statuses).toEqual([200, 409]);
        expect(await participantRows(activityId)).toHaveLength(2);
      }
    },
  );

  it('3. unbegrenzt (D-08): both joiners come through, no 409, count rises to 3', async () => {
    const activityId = await makeActivity({ capacity: null });

    const res1 = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/join`)
      .set('cookie', joiner1.cookie)
      .send({});
    const res2 = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/join`)
      .set('cookie', joiner2.cookie)
      .send({});

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(await participantRows(activityId)).toHaveLength(3);
  });

  it('4. an already-started activity refuses joining (D-10)', async () => {
    const activityId = await makeActivity({ capacity: null, startTime: new Date(Date.now() - 3_600_000) });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/join`)
      .set('cookie', joiner1.cookie)
      .send({});
    expect(res.status).toBe(409);
  });

  it('5. a caller without a completed profile is refused', async () => {
    const activityId = await makeActivity({ capacity: 3 });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/join`)
      .set('cookie', noProfile.cookie)
      .send({});
    expect(res.status).toBe(409);
  });

  it('6. joining across a festival boundary is refused (SEC-03)', async () => {
    const activityId = await makeActivity({ capacity: 3, festivalId: festivalBId });

    const res = await request(app.getHttpServer())
      // Festival A's PATH, festival B's activityId.
      .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/join`)
      .set('cookie', joiner1.cookie)
      .send({});
    expect(res.status).toBe(404);

    // No participant row was created for joiner1 — the join never happened.
    const rows = await participantRows(activityId);
    expect(rows.map((r) => r.visitorId)).not.toContain(joiner1.accountId);
  });

  it('7. the creator cannot leave their own activity (D-09, Erfolgskriterium 4)', async () => {
    const activityId = await makeActivity({ capacity: 3 });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/leave`)
      .set('cookie', creator.cookie)
      .send({});
    expect(res.status).toBe(409);

    // Belief backed by the database, not the response body: the creator's
    // participant row is untouched.
    const [row] = await db
      .select()
      .from(activityParticipant)
      .where(
        and(
          eq(activityParticipant.activityId, activityId),
          eq(activityParticipant.visitorId, creator.accountId),
        ),
      );
    expect(row).toBeDefined();
  });

  it('8. leaving is evidence-free: identical body for a real leave, a repeat, and a nonexistent activity', async () => {
    const activityId = await makeActivity({ capacity: 3 });
    await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/join`)
      .set('cookie', joiner1.cookie)
      .send({})
      .expect(200);

    const realLeave = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/leave`)
      .set('cookie', joiner1.cookie)
      .send({});
    expect(realLeave.status).toBe(200);
    expect(realLeave.body).toEqual({ result: 'removed' });

    const rows = await activityParticipantRowsFor(activityId, joiner1.accountId);
    expect(rows).toHaveLength(0);

    const repeatLeave = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/leave`)
      .set('cookie', joiner1.cookie)
      .send({});
    expect(repeatLeave.status).toBe(200);
    expect(repeatLeave.body).toEqual(realLeave.body);

    const nonexistentLeave = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities/${randomUUID()}/leave`)
      .set('cookie', joiner1.cookie)
      .send({});
    expect(nonexistentLeave.status).toBe(200);
    expect(nonexistentLeave.body).toEqual(realLeave.body);
  });

  it('9. dissolving ("Auflösen") is creator-only, and cascades every participant row', async () => {
    const activityId = await makeActivity({ capacity: 3 });
    await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities/${activityId}/join`)
      .set('cookie', joiner1.cookie)
      .send({})
      .expect(200);

    const foreignDelete = await request(app.getHttpServer())
      .delete(`/api/v1/festivals/${festivalAId}/activities/${activityId}`)
      .set('cookie', joiner1.cookie);
    expect(foreignDelete.status).toBe(409);
    const [stillThere] = await db.select().from(activity).where(eq(activity.id, activityId));
    expect(stillThere).toBeDefined();

    const creatorDelete = await request(app.getHttpServer())
      .delete(`/api/v1/festivals/${festivalAId}/activities/${activityId}`)
      .set('cookie', creator.cookie);
    expect(creatorDelete.status).toBe(200);
    expect(creatorDelete.body).toEqual({ result: 'removed' });

    const [gone] = await db.select().from(activity).where(eq(activity.id, activityId));
    expect(gone).toBeUndefined();
    const goneParticipants = await participantRows(activityId);
    expect(goneParticipants).toHaveLength(0);

    const repeatDelete = await request(app.getHttpServer())
      .delete(`/api/v1/festivals/${festivalAId}/activities/${activityId}`)
      .set('cookie', creator.cookie);
    expect(repeatDelete.status).toBe(404);
  });

  it('10. dissolving respects the tenant boundary (SEC-03)', async () => {
    const activityId = await makeActivity({ capacity: 3, festivalId: festivalBId });

    const res = await request(app.getHttpServer())
      // Festival A's PATH, festival B's activityId.
      .delete(`/api/v1/festivals/${festivalAId}/activities/${activityId}`)
      .set('cookie', creator.cookie);
    expect(res.status).toBe(404);

    const [stillThere] = await db.select().from(activity).where(eq(activity.id, activityId));
    expect(stillThere).toBeDefined();
  });

  function activityParticipantRowsFor(activityId: string, visitorId: string) {
    return db
      .select()
      .from(activityParticipant)
      .where(
        and(eq(activityParticipant.activityId, activityId), eq(activityParticipant.visitorId, visitorId)),
      );
  }
});
