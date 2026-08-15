import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  activity,
  activityParticipant,
  activityTag,
  festival,
  festivalActivityTag,
  user,
  visitorProfile,
  type Database,
} from '@quiks/db';

import { createTestApp, createTestDatabase } from './setup';

/**
 * The Phase-10 Create-path proof surface (D-04/D-07/D-08, SEC-03): the
 * creator becomes a participant in the SAME transaction as the activity
 * insert (Erfolgskriterium 4), the ADR-017 auto-title rule holds both at the
 * contract layer AND the DB CHECK layer, a foreign or disabled tag is
 * rejected with an INDISTINGUISHABLE 404 (SEC-03: no existence oracle over
 * another tenant's catalog), and `capacity`/`geo` accept their documented
 * null states.
 *
 * Mirrors `activity-tags.spec.ts`'s fixture shape: throwaway festivals A/B,
 * ONE real OTP sign-in per visitor (better-auth's rate limiter allows 3
 * requests/60s per source), direct DB inserts for everything that doesn't
 * need a live request/response round-trip.
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
  const email = `activity-create-${label}-${randomUUID()}@quiks.dev`;
  const cookie = await signInWithOtp(app, email);

  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error(`sign-in did not create a user row for ${label}`);
  const accountId = u.id;

  await db.insert(visitorProfile).values({
    accountId,
    username: `visitor-${label}-${randomUUID().slice(0, 8)}`,
    displayName: `Activity Create Test ${label}`,
  });

  return { accountId, cookie };
}

/** Signs in WITHOUT writing a `visitor_profile` row — the reachable first-login state. */
async function createAccountWithoutProfile(
  app: INestApplication,
  db: Database,
  label: string,
): Promise<{ accountId: string; cookie: string }> {
  const email = `activity-create-${label}-${randomUUID()}@quiks.dev`;
  const cookie = await signInWithOtp(app, email);
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error(`sign-in did not create a user row for ${label}`);
  return { accountId: u.id, cookie };
}

describe('activity create (D-04/D-07/D-08, SEC-03)', () => {
  let app: INestApplication;
  let db: Database;

  let festivalAId: string;
  let festivalBId: string;

  let globalTagId: string;
  let bOwnTagId: string;

  let creator: { accountId: string; cookie: string };
  let noProfile: { accountId: string; cookie: string };

  const createdActivityIds: string[] = [];

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();

    const [festA] = await db
      .insert(festival)
      .values({
        slug: `activity-create-a-${randomUUID()}`,
        name: 'Activity Create Test Festival A',
        defaultLocale: 'de',
      })
      .returning();
    const [festB] = await db
      .insert(festival)
      .values({
        slug: `activity-create-b-${randomUUID()}`,
        name: 'Activity Create Test Festival B',
        defaultLocale: 'de',
      })
      .returning();
    if (!festA || !festB) throw new Error('festival fixture insert returned no row');
    festivalAId = festA.id;
    festivalBId = festB.id;

    creator = await createVisitor(app, db, 'creator');
    noProfile = await createAccountWithoutProfile(app, db, 'noprofile');

    const [seededGlobal] = await db
      .select({ id: activityTag.id })
      .from(activityTag)
      .where(eq(activityTag.slug, 'workshop'))
      .limit(1);
    if (!seededGlobal) throw new Error('seeded global tag "workshop" not found — run db:seed first');
    globalTagId = seededGlobal.id;

    const [ownB] = await db
      .insert(activityTag)
      .values({ festivalId: festivalBId, slug: `b-own-${randomUUID().slice(0, 8)}` })
      .returning();
    if (!ownB) throw new Error('own tag insert for festival B returned no row');
    bOwnTagId = ownB.id;
  });

  afterAll(async () => {
    for (const id of createdActivityIds) {
      await db.delete(activityParticipant).where(eq(activityParticipant.activityId, id));
      await db.delete(activity).where(eq(activity.id, id));
    }
    await db.delete(festivalActivityTag).where(eq(festivalActivityTag.festivalId, festivalAId));
    await db.delete(activityTag).where(eq(activityTag.id, bOwnTagId));
    await db.delete(visitorProfile).where(eq(visitorProfile.accountId, creator.accountId));
    await db.delete(festival).where(eq(festival.id, festivalAId));
    await db.delete(festival).where(eq(festival.id, festivalBId));
    // Global seed tag ("workshop") and better-auth's `user` rows are
    // intentionally left untouched — same convention as activity-tags.spec.ts.
    await app.close();
  });

  it('1. creator is a participant from the moment of creation (D-07, Erfolgskriterium 4)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', creator.cookie)
      .send({ title: 'Lagerfeuer', startTime: new Date(Date.now() + 3_600_000).toISOString() });

    expect(res.status).toBe(201);
    createdActivityIds.push(res.body.id);

    const rows = await db
      .select()
      .from(activityParticipant)
      .where(eq(activityParticipant.activityId, res.body.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.visitorId).toBe(creator.accountId);
    expect(rows[0]?.festivalId).toBe(festivalAId);
  });

  it('2. auto-title with a tag: no explicit title resolves the localized tag title', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', creator.cookie)
      .send({
        tagId: globalTagId,
        startTime: new Date(Date.now() + 3_600_000).toISOString(),
      });

    expect(res.status).toBe(201);
    createdActivityIds.push(res.body.id);
    expect(res.body.title).toBe('Workshop');
    expect(res.body.tag?.id).toBe(globalTagId);

    const resEn = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities?locale=en`)
      .set('cookie', creator.cookie)
      .send({
        tagId: globalTagId,
        startTime: new Date(Date.now() + 3_600_000).toISOString(),
      });
    expect(resEn.status).toBe(201);
    createdActivityIds.push(resEn.body.id);
    expect(resEn.body.title).toBe('Workshop');
  });

  it('3. title is required without a tag — 400 at the contract, 23514 at the DB', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', creator.cookie)
      .send({ startTime: new Date(Date.now() + 3_600_000).toISOString() });
    expect(res.status).toBe(400);

    await expect(
      db.insert(activity).values({
        festivalId: festivalAId,
        creatorId: creator.accountId,
        startTime: new Date(),
      }),
    ).rejects.toMatchObject({
      cause: expect.objectContaining({ constraint_name: 'activity_title_or_tag_chk' }),
    });
  });

  it('4. a foreign tag (SEC-03) is rejected 404, same body as a disabled one', async () => {
    const resForeign = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', creator.cookie)
      .send({ tagId: bOwnTagId, startTime: new Date(Date.now() + 3_600_000).toISOString() });
    expect(resForeign.status).toBe(404);

    // Case 5 disables the SAME global tag for festival A — capture case 4's
    // body first, compare after.
    await db
      .insert(festivalActivityTag)
      .values({ festivalId: festivalAId, tagId: globalTagId, enabled: false });

    const resDisabled = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', creator.cookie)
      .send({ tagId: globalTagId, startTime: new Date(Date.now() + 3_600_000).toISOString() });
    expect(resDisabled.status).toBe(404);

    expect(resDisabled.body.message).toBe(resForeign.body.message);
  });

  it('5. a disabled tag is rejected on create, but an EXISTING activity keeps its tag unchanged (D-04)', async () => {
    // globalTagId is disabled for festival A by the previous test. Confirm the
    // create-time rejection independently, then check the earlier activity
    // created with this tag (test 2) still carries it after re-reading from
    // the DB.
    const resStillDisabled = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', creator.cookie)
      .send({ tagId: globalTagId, startTime: new Date(Date.now() + 3_600_000).toISOString() });
    expect(resStillDisabled.status).toBe(404);

    const earlierActivityId = createdActivityIds[1];
    if (!earlierActivityId) throw new Error('expected activity from test 2 to exist');
    const [row] = await db.select().from(activity).where(eq(activity.id, earlierActivityId)).limit(1);
    expect(row?.tagId).toBe(globalTagId);

    // Re-enable for the remaining tests in this file.
    await db
      .delete(festivalActivityTag)
      .where(
        and(
          eq(festivalActivityTag.festivalId, festivalAId),
          eq(festivalActivityTag.tagId, globalTagId),
        ),
      );
  });

  it('6. a caller without a completed profile gets 409', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', noProfile.cookie)
      .send({ title: 'Kein Profil', startTime: new Date(Date.now() + 3_600_000).toISOString() });
    expect(res.status).toBe(409);
  });

  it('7. capacity: null is unbegrenzt, 1 is valid, 0 is rejected (D-08)', async () => {
    const resNull = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', creator.cookie)
      .send({
        title: 'Unbegrenzt',
        startTime: new Date(Date.now() + 3_600_000).toISOString(),
        capacity: null,
      });
    expect(resNull.status).toBe(201);
    createdActivityIds.push(resNull.body.id);
    expect(resNull.body.capacity).toBeNull();

    const resOne = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', creator.cookie)
      .send({
        title: 'Ein Platz',
        startTime: new Date(Date.now() + 3_600_000).toISOString(),
        capacity: 1,
      });
    expect(resOne.status).toBe(201);
    createdActivityIds.push(resOne.body.id);
    expect(resOne.body.capacity).toBe(1);

    const resZero = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', creator.cookie)
      .send({
        title: 'Null Plätze',
        startTime: new Date(Date.now() + 3_600_000).toISOString(),
        capacity: 0,
      });
    expect(resZero.status).toBe(400);

    await expect(
      db.insert(activity).values({
        festivalId: festivalAId,
        creatorId: creator.accountId,
        title: 'Direct negative',
        startTime: new Date(),
        capacity: -1,
      }),
    ).rejects.toMatchObject({
      cause: expect.objectContaining({ constraint_name: 'activity_capacity_positive_chk' }),
    });
  });

  it('8. geo is all-or-nothing (ADR-017 §2)', async () => {
    const resGeo = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', creator.cookie)
      .send({
        title: 'Mit Geo',
        startTime: new Date(Date.now() + 3_600_000).toISOString(),
        geo: { lat: 47.51, lng: 16.28 },
      });
    expect(resGeo.status).toBe(201);
    createdActivityIds.push(resGeo.body.id);
    expect(resGeo.body.geo).toEqual({ lat: 47.51, lng: 16.28 });

    const resNoGeo = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', creator.cookie)
      .send({ title: 'Ohne Geo', startTime: new Date(Date.now() + 3_600_000).toISOString() });
    expect(resNoGeo.status).toBe(201);
    createdActivityIds.push(resNoGeo.body.id);
    expect(resNoGeo.body.geo).toBeNull();

    await expect(
      db.insert(activity).values({
        festivalId: festivalAId,
        creatorId: creator.accountId,
        title: 'Half geo',
        startTime: new Date(),
        geoLat: 47.51,
      }),
    ).rejects.toMatchObject({
      cause: expect.objectContaining({ constraint_name: 'activity_geo_pair_chk' }),
    });
  });

  it('9. client-supplied creatorId/festivalId/visitorId in the body change nothing', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', creator.cookie)
      .send({
        title: 'Scope-Test',
        startTime: new Date(Date.now() + 3_600_000).toISOString(),
        creatorId: 'someone-else',
        festivalId: festivalBId,
        visitorId: 'someone-else-too',
      });
    expect(res.status).toBe(201);
    createdActivityIds.push(res.body.id);
    expect(res.body.creatorId).toBe(creator.accountId);
    expect(res.body.festivalId).toBe(festivalAId);

    const [row] = await db.select().from(activity).where(eq(activity.id, res.body.id)).limit(1);
    expect(row?.creatorId).toBe(creator.accountId);
    expect(row?.festivalId).toBe(festivalAId);
  });
});
