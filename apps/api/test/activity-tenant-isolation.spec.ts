import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  activity,
  activityParticipant,
  activityTag,
  activityTagTranslation,
  festival,
  festivalActivityTag,
  user,
  visitorProfile,
  type Database,
} from '@quiks/db';

import { createTestApp, createTestDatabase } from './setup';

/**
 * The SEC-03 BEHAVIORAL proof for every table Phase 10 added
 * (10-05-PLAN.md Task 1) — one `describe` block per table, each proving that
 * a value belonging to festival B's activities never appears in a response
 * served under festival A's path, checked against the SERIALIZED response
 * body rather than the parsed array: a shallow array check would miss a leak
 * sitting inside a nested field (a tag title, a participant's profile), which
 * is exactly the kind of leak this phase's new endpoints could produce.
 *
 * Every fixture value below (activity titles, tag slugs, tag titles) is built
 * with a random per-run suffix and is deliberately UNIQUE — a generic value
 * like "Workshop" could legitimately appear in both festivals (the seeded
 * global tag catalog IS shared) and would silently vacuum every absence
 * assertion that used it. `activity_tag` gets its own describe block with
 * three sub-cases because its nullable `festivalId` (ADR-017 §3) is the one
 * deliberate exception to "every tenant table filters on festivalId" — this
 * is where that exception is separately, explicitly proven rather than
 * assumed from the other four tables' behavior.
 *
 * Mirrors `festival-isolation.spec.ts` (SEC-02 baseline) and
 * `festival-friends-isolation.spec.ts` (SEC-02 for a join). Two real OTP
 * sign-ins only (`visitorA`, `visitorB`) — better-auth's rate limiter allows
 * 3 requests/60s per source, and both visitors' own sessions suffice to query
 * BOTH festivals' paths (Discovery/detail carry no membership gate, ADR-014),
 * so no third caller is needed.
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

type Visitor = { accountId: string; cookie: string; username: string };

async function createVisitor(app: INestApplication, db: Database, label: string): Promise<Visitor> {
  const email = `activity-tenant-isolation-${label}-${randomUUID()}@quiks.dev`;
  const cookie = await signInWithOtp(app, email);

  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error(`sign-in did not create a user row for ${label}`);
  const accountId = u.id;
  const username = `tenant-iso-${label}-${randomUUID().slice(0, 8)}`;

  await db.insert(visitorProfile).values({
    accountId,
    username,
    displayName: `Tenant Isolation Test ${label}`,
  });

  return { accountId, cookie, username };
}

describe('activity tenant isolation (SEC-03 behavioral proof)', () => {
  let app: INestApplication;
  let db: Database;

  let festivalAId: string;
  let festivalBId: string;

  let visitorA: Visitor;
  let visitorB: Visitor;

  let aActivityId: string;
  let bActivityId: string;

  let campHangoutTagId: string; // global, never disabled — the "effective in both" case
  let preDrinkTagId: string; // global, disabled for A only — the festival_activity_tag case
  let ownTagAId: string;
  let ownTagBId: string;

  const RUN = randomUUID().slice(0, 8);
  const ACTIVITY_A_TITLE = `Tenant Isolation Activity A ${RUN}`;
  const ACTIVITY_B_TITLE = `Tenant Isolation Activity B ${RUN}`;
  const OWN_TAG_A_SLUG = `tenant-a-own-${RUN}`;
  const OWN_TAG_A_TITLE = `Tenant A Only Tag ${RUN}`;
  const OWN_TAG_B_SLUG = `tenant-b-own-${RUN}`;
  const OWN_TAG_B_TITLE = `Tenant B Only Tag ${RUN}`;

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();

    const [festA] = await db
      .insert(festival)
      .values({
        slug: `tenant-isolation-a-${randomUUID()}`,
        name: `Tenant Isolation Festival A ${RUN}`,
        defaultLocale: 'de',
      })
      .returning();
    const [festB] = await db
      .insert(festival)
      .values({
        slug: `tenant-isolation-b-${randomUUID()}`,
        name: `Tenant Isolation Festival B ${RUN}`,
        defaultLocale: 'en',
      })
      .returning();
    if (!festA || !festB) throw new Error('festival fixture insert returned no row');
    festivalAId = festA.id;
    festivalBId = festB.id;

    // Exactly two real OTP sign-ins for the whole spec.
    visitorA = await createVisitor(app, db, 'visitora');
    visitorB = await createVisitor(app, db, 'visitorb');

    const [campHangout] = await db
      .select({ id: activityTag.id })
      .from(activityTag)
      .where(eq(activityTag.slug, 'camp-hangout'))
      .limit(1);
    if (!campHangout) throw new Error('seeded global tag "camp-hangout" not found — run db:seed first');
    campHangoutTagId = campHangout.id;

    const [preDrink] = await db
      .select({ id: activityTag.id })
      .from(activityTag)
      .where(eq(activityTag.slug, 'pre-drink'))
      .limit(1);
    if (!preDrink) throw new Error('seeded global tag "pre-drink" not found — run db:seed first');
    preDrinkTagId = preDrink.id;

    const [ownTagA] = await db
      .insert(activityTag)
      .values({ festivalId: festivalAId, slug: OWN_TAG_A_SLUG })
      .returning({ id: activityTag.id });
    if (!ownTagA) throw new Error('activityTag fixture insert (A) returned no row');
    ownTagAId = ownTagA.id;
    await db.insert(activityTagTranslation).values({ tagId: ownTagAId, locale: 'de', title: OWN_TAG_A_TITLE });

    const [ownTagB] = await db
      .insert(activityTag)
      .values({ festivalId: festivalBId, slug: OWN_TAG_B_SLUG })
      .returning({ id: activityTag.id });
    if (!ownTagB) throw new Error('activityTag fixture insert (B) returned no row');
    ownTagBId = ownTagB.id;
    await db.insert(activityTagTranslation).values({ tagId: ownTagBId, locale: 'en', title: OWN_TAG_B_TITLE });

    // festival_activity_tag: A disables the global "pre-drink" tag. B never
    // touches it, so B's list must still carry it (the cross-tenant proof).
    await db
      .insert(festivalActivityTag)
      .values({ festivalId: festivalAId, tagId: preDrinkTagId, enabled: false });

    // One activity per festival, created via direct insert (the create
    // endpoint's own mechanics are 10-02's job) — creator is also the sole
    // participant, satisfying "one participation of the associated visitor"
    // without a second write.
    const [actA] = await db
      .insert(activity)
      .values({
        festivalId: festivalAId,
        creatorId: visitorA.accountId,
        title: ACTIVITY_A_TITLE,
        startTime: new Date(Date.now() + 3_600_000),
      })
      .returning({ id: activity.id });
    if (!actA) throw new Error('activity fixture insert (A) returned no row');
    aActivityId = actA.id;
    await db
      .insert(activityParticipant)
      .values({ activityId: aActivityId, festivalId: festivalAId, visitorId: visitorA.accountId });

    const [actB] = await db
      .insert(activity)
      .values({
        festivalId: festivalBId,
        creatorId: visitorB.accountId,
        title: ACTIVITY_B_TITLE,
        startTime: new Date(Date.now() + 3_600_000),
      })
      .returning({ id: activity.id });
    if (!actB) throw new Error('activity fixture insert (B) returned no row');
    bActivityId = actB.id;
    await db
      .insert(activityParticipant)
      .values({ activityId: bActivityId, festivalId: festivalBId, visitorId: visitorB.accountId });
  });

  afterAll(async () => {
    await db.delete(activityParticipant).where(inArray(activityParticipant.activityId, [aActivityId, bActivityId]));
    await db.delete(activity).where(inArray(activity.id, [aActivityId, bActivityId]));
    await db.delete(activityTagTranslation).where(inArray(activityTagTranslation.tagId, [ownTagAId, ownTagBId]));
    await db.delete(activityTag).where(inArray(activityTag.id, [ownTagAId, ownTagBId]));
    await db.delete(festivalActivityTag).where(eq(festivalActivityTag.festivalId, festivalAId));
    await db.delete(visitorProfile).where(inArray(visitorProfile.accountId, [visitorA.accountId, visitorB.accountId]));
    await db.delete(festival).where(inArray(festival.id, [festivalAId, festivalBId]));
    // `user`/`session` rows and the seeded global tag catalog are
    // intentionally left untouched — same convention as every sibling
    // activity spec (better-auth owns the former; the seed is shared state).
    await app.close();
  });

  describe('activity', () => {
    it('discovery list (GET .../activities) never carries the foreign activity, in either direction', async () => {
      const resA = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalAId}/activities`)
        .set('cookie', visitorA.cookie);
      expect(resA.status).toBe(200);
      const serializedA = JSON.stringify(resA.body);
      expect(serializedA).not.toContain(bActivityId);
      expect(serializedA).not.toContain(ACTIVITY_B_TITLE);
      // Non-vacuum gegenprobe: A's OWN activity really is in A's list.
      expect(serializedA).toContain(aActivityId);
      expect(serializedA).toContain(ACTIVITY_A_TITLE);

      const resB = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalBId}/activities`)
        .set('cookie', visitorB.cookie);
      expect(resB.status).toBe(200);
      const serializedB = JSON.stringify(resB.body);
      expect(serializedB).not.toContain(aActivityId);
      expect(serializedB).not.toContain(ACTIVITY_A_TITLE);
      expect(serializedB).toContain(bActivityId);
      expect(serializedB).toContain(ACTIVITY_B_TITLE);
    });

    it('the caller\'s own activities (GET .../my-activities) never carry the foreign activity, in either direction', async () => {
      const resA = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalAId}/my-activities`)
        .set('cookie', visitorA.cookie);
      expect(resA.status).toBe(200);
      const serializedA = JSON.stringify(resA.body);
      expect(serializedA).not.toContain(bActivityId);
      expect(serializedA).not.toContain(ACTIVITY_B_TITLE);
      expect(serializedA).toContain(aActivityId);
      expect(serializedA).toContain(ACTIVITY_A_TITLE);

      const resB = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalBId}/my-activities`)
        .set('cookie', visitorB.cookie);
      expect(resB.status).toBe(200);
      const serializedB = JSON.stringify(resB.body);
      expect(serializedB).not.toContain(aActivityId);
      expect(serializedB).not.toContain(ACTIVITY_A_TITLE);
      expect(serializedB).toContain(bActivityId);
      expect(serializedB).toContain(ACTIVITY_B_TITLE);
    });

    it('the foreign activity\'s detail 404s under the wrong path, and 200s with its own title under its own path', async () => {
      const crossA = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalAId}/activities/${bActivityId}`)
        .set('cookie', visitorA.cookie);
      expect(crossA.status).toBe(404);

      const crossB = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalBId}/activities/${aActivityId}`)
        .set('cookie', visitorB.cookie);
      expect(crossB.status).toBe(404);

      // Non-vacuum gegenprobe: each activity's OWN path really does resolve.
      const ownA = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalAId}/activities/${aActivityId}`)
        .set('cookie', visitorA.cookie);
      expect(ownA.status).toBe(200);
      expect(JSON.stringify(ownA.body)).toContain(ACTIVITY_A_TITLE);

      const ownB = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalBId}/activities/${bActivityId}`)
        .set('cookie', visitorB.cookie);
      expect(ownB.status).toBe(200);
      expect(JSON.stringify(ownB.body)).toContain(ACTIVITY_B_TITLE);
    });
  });

  describe('activity_participant', () => {
    it('a participant of A never appears in B\'s my-activities or B\'s detail participant list, and vice versa', async () => {
      const myActivitiesAforB = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalAId}/my-activities`)
        .set('cookie', visitorB.cookie);
      expect(myActivitiesAforB.status).toBe(200);
      expect(myActivitiesAforB.body).toEqual([]);

      const myActivitiesBforA = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalBId}/my-activities`)
        .set('cookie', visitorA.cookie);
      expect(myActivitiesBforA.status).toBe(200);
      expect(myActivitiesBforA.body).toEqual([]);

      const detailA = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalAId}/activities/${aActivityId}`)
        .set('cookie', visitorB.cookie);
      expect(detailA.status).toBe(200);
      type ParticipantRow = { profile: { accountId: string; username: string } };
      const participantsA = detailA.body.participants as ParticipantRow[];
      expect(participantsA.map((p) => p.profile.accountId)).toEqual([visitorA.accountId]);
      const serializedDetailA = JSON.stringify(detailA.body);
      expect(serializedDetailA).not.toContain(visitorB.accountId);
      expect(serializedDetailA).not.toContain(visitorB.username);

      const detailB = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalBId}/activities/${bActivityId}`)
        .set('cookie', visitorA.cookie);
      expect(detailB.status).toBe(200);
      const participantsB = detailB.body.participants as ParticipantRow[];
      expect(participantsB.map((p) => p.profile.accountId)).toEqual([visitorB.accountId]);
      const serializedDetailB = JSON.stringify(detailB.body);
      expect(serializedDetailB).not.toContain(visitorA.accountId);
      expect(serializedDetailB).not.toContain(visitorA.username);
    });
  });

  describe('activity_tag (the nullable-festivalId exception, ADR-017 §3)', () => {
    it('a) a global tag is effective for BOTH festivals', async () => {
      const resA = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalAId}/activity-tags`)
        .set('cookie', visitorA.cookie);
      expect(resA.status).toBe(200);
      type Row = { id: string };
      expect((resA.body as Row[]).map((t) => t.id)).toContain(campHangoutTagId);

      const resB = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalBId}/activity-tags`)
        .set('cookie', visitorB.cookie);
      expect(resB.status).toBe(200);
      expect((resB.body as Row[]).map((t) => t.id)).toContain(campHangoutTagId);
    });

    it('b) a festival-own tag appears ONLY in its own festival\'s list — by id and title, in both directions', async () => {
      const resA = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalAId}/activity-tags`)
        .set('cookie', visitorA.cookie);
      const resB = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalBId}/activity-tags`)
        .set('cookie', visitorB.cookie);
      const serializedA = JSON.stringify(resA.body);
      const serializedB = JSON.stringify(resB.body);

      expect(serializedA).toContain(ownTagAId);
      expect(serializedA).toContain(OWN_TAG_A_TITLE);
      expect(serializedA).not.toContain(ownTagBId);
      expect(serializedA).not.toContain(OWN_TAG_B_TITLE);

      expect(serializedB).toContain(ownTagBId);
      expect(serializedB).toContain(OWN_TAG_B_TITLE);
      expect(serializedB).not.toContain(ownTagAId);
      expect(serializedB).not.toContain(OWN_TAG_A_TITLE);
    });

    it('c) creating an activity in A with B\'s own tag id is refused 404 — no existence oracle over a foreign tag catalog', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/festivals/${festivalAId}/activities`)
        .set('cookie', visitorA.cookie)
        .send({ tagId: ownTagBId, startTime: new Date(Date.now() + 3_600_000).toISOString() });
      expect(res.status).toBe(404);
    });
  });

  describe('festival_activity_tag', () => {
    it('disabling a global tag for A does not affect B, and the tag genuinely disappears from A', async () => {
      const resA = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalAId}/activity-tags`)
        .set('cookie', visitorA.cookie);
      expect(resA.status).toBe(200);
      type Row = { id: string };
      expect((resA.body as Row[]).map((t) => t.id)).not.toContain(preDrinkTagId);

      // Cross-tenant gegenprobe: B never disabled it, so B still has it.
      const resB = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalBId}/activity-tags`)
        .set('cookie', visitorB.cookie);
      expect(resB.status).toBe(200);
      expect((resB.body as Row[]).map((t) => t.id)).toContain(preDrinkTagId);
    });
  });

  describe('activity_tag_translation', () => {
    it('B\'s tag TITLE (the translation value, not just the id) never appears in A\'s tag list body', async () => {
      const resA = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalAId}/activity-tags`)
        .set('cookie', visitorA.cookie);
      expect(JSON.stringify(resA.body)).not.toContain(OWN_TAG_B_TITLE);

      // Non-vacuum gegenprobe: B's own list DOES carry its translation value.
      const resB = await request(app.getHttpServer())
        .get(`/api/v1/festivals/${festivalBId}/activity-tags`)
        .set('cookie', visitorB.cookie);
      expect(JSON.stringify(resB.body)).toContain(OWN_TAG_B_TITLE);
    });
  });

  describe('write paths never cross the festival boundary (join/leave/delete)', () => {
    it('join under A\'s path with B\'s activityId is refused and writes no row in B', async () => {
      const before = await db
        .select()
        .from(activityParticipant)
        .where(eq(activityParticipant.activityId, bActivityId));

      const res = await request(app.getHttpServer())
        .post(`/api/v1/festivals/${festivalAId}/activities/${bActivityId}/join`)
        .set('cookie', visitorA.cookie)
        .send({});
      expect(res.status).toBe(404);

      const after = await db
        .select()
        .from(activityParticipant)
        .where(eq(activityParticipant.activityId, bActivityId));
      expect(after).toHaveLength(before.length);
      expect(after.map((r) => r.visitorId)).not.toContain(visitorA.accountId);
    });

    it('leave under A\'s path with B\'s activityId is evidence-free 200 but touches no row in B', async () => {
      const before = await db
        .select()
        .from(activityParticipant)
        .where(eq(activityParticipant.activityId, bActivityId));

      const res = await request(app.getHttpServer())
        .post(`/api/v1/festivals/${festivalAId}/activities/${bActivityId}/leave`)
        .set('cookie', visitorA.cookie)
        .send({});
      expect(res.status).toBe(200);

      const after = await db
        .select()
        .from(activityParticipant)
        .where(eq(activityParticipant.activityId, bActivityId));
      expect(after).toEqual(before);
    });

    it('delete under A\'s path with B\'s activityId is refused and the activity still exists', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/festivals/${festivalAId}/activities/${bActivityId}`)
        .set('cookie', visitorA.cookie);
      expect(res.status).toBe(404);

      const [stillThere] = await db.select().from(activity).where(and(eq(activity.id, bActivityId), eq(activity.festivalId, festivalBId)));
      expect(stillThere).toBeDefined();
    });
  });
});
