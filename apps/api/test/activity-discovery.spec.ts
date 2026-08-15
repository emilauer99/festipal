import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
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
 * The Phase-10 Discovery/detail proof surface (D-04/D-10/D-11/D-12, VIS-02,
 * SEC-03): the public list hides a started activity, `my-activities` does
 * NOT, the list carries a count instead of names while the detail carries
 * names through the ONE allowed foreign view, a disabled tag leaves an
 * existing activity unchanged, ties on `startTime` resolve to a total order,
 * and both reads respect the festival boundary.
 *
 * Mirrors `activity-join-leave.spec.ts`'s fixture shape: throwaway festivals
 * A/B/C, ONE real OTP sign-in per visitor (better-auth's rate limiter allows
 * 3 requests/60s per source — this spec provisions exactly three: Creator,
 * Teilnehmer, Unbeteiligter), direct DB inserts for everything that doesn't
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

type Visitor = { accountId: string; cookie: string; email: string };

async function createVisitor(app: INestApplication, db: Database, label: string): Promise<Visitor> {
  const email = `activity-discovery-${label}-${randomUUID()}@quiks.dev`;
  const cookie = await signInWithOtp(app, email);

  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error(`sign-in did not create a user row for ${label}`);
  const accountId = u.id;

  await db.insert(visitorProfile).values({
    accountId,
    username: `activity-disc-${label}-${randomUUID().slice(0, 8)}`,
    displayName: `Activity Discovery Test ${label}`,
  });

  return { accountId, cookie, email };
}

describe('activity discovery & detail (D-04/D-10/D-11/D-12, VIS-02, SEC-03)', () => {
  let app: INestApplication;
  let db: Database;

  let festivalAId: string;
  let festivalBId: string;
  let festivalCId: string;

  let creator: Visitor;
  let joiner: Visitor;
  let stranger: Visitor;

  let preDrinkTagId: string;

  const activityIds: string[] = [];

  const FUTURE_TITLE = `Discovery Future ${randomUUID().slice(0, 8)}`;
  const PAST_TITLE = `Discovery Past ${randomUUID().slice(0, 8)}`;
  const TIE_TITLE_1 = `Discovery Tie One ${randomUUID().slice(0, 8)}`;
  const TIE_TITLE_2 = `Discovery Tie Two ${randomUUID().slice(0, 8)}`;
  const B_TITLE = `Discovery Festival B ${randomUUID().slice(0, 8)}`;

  let futureActivityId: string;
  let pastActivityId: string;
  let tieActivityId1: string;
  let tieActivityId2: string;
  let taggedActivityId: string;
  let bActivityId: string;

  async function makeActivity(opts: {
    festivalId: string;
    title?: string | null;
    tagId?: string | null;
    startTime: Date;
    participantIds?: string[];
  }): Promise<string> {
    const [row] = await db
      .insert(activity)
      .values({
        festivalId: opts.festivalId,
        creatorId: creator.accountId,
        tagId: opts.tagId ?? null,
        title: opts.title ?? null,
        startTime: opts.startTime,
      })
      .returning({ id: activity.id });
    if (!row) throw new Error('activity fixture insert returned no row');
    activityIds.push(row.id);

    await db
      .insert(activityParticipant)
      .values({ activityId: row.id, festivalId: opts.festivalId, visitorId: creator.accountId });
    for (const visitorId of opts.participantIds ?? []) {
      await db
        .insert(activityParticipant)
        .values({ activityId: row.id, festivalId: opts.festivalId, visitorId });
    }
    return row.id;
  }

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();

    const [festA] = await db
      .insert(festival)
      .values({
        slug: `activity-discovery-a-${randomUUID()}`,
        name: 'Activity Discovery Test Festival A',
        defaultLocale: 'de',
      })
      .returning();
    const [festB] = await db
      .insert(festival)
      .values({
        slug: `activity-discovery-b-${randomUUID()}`,
        name: 'Activity Discovery Test Festival B',
        defaultLocale: 'de',
      })
      .returning();
    const [festC] = await db
      .insert(festival)
      .values({
        slug: `activity-discovery-c-${randomUUID()}`,
        name: 'Activity Discovery Test Festival C (no activities)',
        defaultLocale: 'de',
      })
      .returning();
    if (!festA || !festB || !festC) throw new Error('festival fixture insert returned no row');
    festivalAId = festA.id;
    festivalBId = festB.id;
    festivalCId = festC.id;

    // Sequential sign-ins, once — the OTP send/verify pair is rate-limited
    // (3 requests/60s per source), so every case below reuses these cookies
    // instead of re-authenticating. Exactly three visitors: Creator,
    // Teilnehmer, Unbeteiligter.
    creator = await createVisitor(app, db, 'creator');
    joiner = await createVisitor(app, db, 'joiner');
    stranger = await createVisitor(app, db, 'stranger');

    const [preDrink] = await db
      .select({ id: activityTag.id })
      .from(activityTag)
      .where(eq(activityTag.slug, 'pre-drink'))
      .limit(1);
    if (!preDrink) throw new Error('seeded global tag "pre-drink" not found — run db:seed first');
    preDrinkTagId = preDrink.id;

    // Case 1/3/4: a future activity in A, joiner already seated alongside the
    // creator (participantCount 2, joiner.joined true, stranger.joined false).
    futureActivityId = await makeActivity({
      festivalId: festivalAId,
      title: FUTURE_TITLE,
      startTime: new Date(Date.now() + 3_600_000),
      participantIds: [joiner.accountId],
    });

    // Case 1/2: an already-started activity, joiner also seated — proves the
    // public cutoff (D-10) without losing the participant's own access (D-11).
    pastActivityId = await makeActivity({
      festivalId: festivalAId,
      title: PAST_TITLE,
      startTime: new Date(Date.now() - 3_600_000),
      participantIds: [joiner.accountId],
    });

    // Case 7: two activities sharing the exact same startTime.
    const tieStartTime = new Date(Date.now() + 7_200_000);
    tieActivityId1 = await makeActivity({ festivalId: festivalAId, title: TIE_TITLE_1, startTime: tieStartTime });
    tieActivityId2 = await makeActivity({ festivalId: festivalAId, title: TIE_TITLE_2, startTime: tieStartTime });

    // Case 5/9: an activity with a global tag, auto-titled — created BEFORE
    // the tag is disabled for A later in case 5.
    taggedActivityId = await makeActivity({
      festivalId: festivalAId,
      title: null,
      tagId: preDrinkTagId,
      startTime: new Date(Date.now() + 10_800_000),
    });

    // Case 8: an activity that belongs to festival B only.
    bActivityId = await makeActivity({
      festivalId: festivalBId,
      title: B_TITLE,
      startTime: new Date(Date.now() + 3_600_000),
    });
  });

  afterAll(async () => {
    await db.delete(activityParticipant).where(inArray(activityParticipant.activityId, activityIds));
    await db.delete(activity).where(inArray(activity.id, activityIds));
    await db.delete(festivalActivityTag).where(eq(festivalActivityTag.festivalId, festivalAId));
    await db
      .delete(visitorProfile)
      .where(inArray(visitorProfile.accountId, [creator.accountId, joiner.accountId, stranger.accountId]));
    await db.delete(festival).where(eq(festival.id, festivalAId));
    await db.delete(festival).where(eq(festival.id, festivalBId));
    await db.delete(festival).where(eq(festival.id, festivalCId));
    // `user`/`session` rows and the seeded global tag are intentionally left
    // untouched — same convention as the sibling activity specs.
    await app.close();
  });

  it('1. startTime cutoff (D-10): the public list includes the future activity, not the past one', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', stranger.cookie);
    expect(res.status).toBe(200);

    type Row = { id: string };
    const ids = (res.body as Row[]).map((r) => r.id);
    expect(ids).toContain(futureActivityId);
    expect(ids).not.toContain(pastActivityId);

    const serialized = JSON.stringify(res.body);
    expect(serialized).toContain(FUTURE_TITLE);
    expect(serialized).not.toContain(PAST_TITLE);
  });

  it('2. participants keep access after startTime (D-11): my-activities has both, non-participants get neither', async () => {
    const resJoiner = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/my-activities`)
      .set('cookie', joiner.cookie);
    expect(resJoiner.status).toBe(200);
    type Row = { id: string };
    const joinerIds = (resJoiner.body as Row[]).map((r) => r.id);
    expect(joinerIds).toContain(futureActivityId);
    expect(joinerIds).toContain(pastActivityId);

    const resStranger = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/my-activities`)
      .set('cookie', stranger.cookie);
    expect(resStranger.status).toBe(200);
    const strangerIds = (resStranger.body as Row[]).map((r) => r.id);
    expect(strangerIds).not.toContain(futureActivityId);
    expect(strangerIds).not.toContain(pastActivityId);
  });

  it('3. count instead of names (D-12): participantCount/joined are correct, no participant names on the list', async () => {
    const resJoiner = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', joiner.cookie);
    expect(resJoiner.status).toBe(200);
    type Row = { id: string; participantCount: number; joined: boolean };
    const future = (resJoiner.body as Row[]).find((r) => r.id === futureActivityId);
    expect(future?.participantCount).toBe(2);
    expect(future?.joined).toBe(true);

    const resStranger = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', stranger.cookie);
    expect(resStranger.status).toBe(200);
    const futureForStranger = (resStranger.body as Row[]).find((r) => r.id === futureActivityId);
    expect(futureForStranger?.joined).toBe(false);
    expect(futureForStranger?.participantCount).toBe(2);

    // Field ABSENCE on the serialized body — not just "no participants key" on
    // the parsed object — mirrors foreign-projection.spec.ts's doctrine.
    const serialized = JSON.stringify(resStranger.body);
    expect(serialized).not.toContain(joiner.email);
    expect(serialized).not.toContain('participants');
    const parsedFuture = (resStranger.body as Array<Record<string, unknown>>).find(
      (r) => r.id === futureActivityId,
    );
    expect(parsedFuture).toBeDefined();
    expect(Object.keys(parsedFuture ?? {})).not.toContain('participants');
  });

  it('4. names in the detail (D-12/VIS-02): exactly the expected people, exactly the six-field foreign view', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities/${futureActivityId}`)
      .set('cookie', stranger.cookie);
    expect(res.status).toBe(200);

    type ParticipantRow = { profile: Record<string, unknown>; joinedAt: string };
    const participants = res.body.participants as ParticipantRow[];
    expect(participants).toHaveLength(2);
    const accountIds = participants.map((p) => p.profile.accountId).sort();
    expect(accountIds).toEqual([creator.accountId, joiner.accountId].sort());

    for (const entry of participants) {
      expect(Object.keys(entry).sort()).toEqual(['joinedAt', 'profile']);
      expect(Object.keys(entry.profile).sort()).toEqual([
        'accountId',
        'avatar',
        'displayName',
        'gender',
        'pronoun',
        'username',
      ]);
    }

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('birthDate');
    expect(serialized).not.toContain(creator.email);
    expect(serialized).not.toContain(joiner.email);
  });

  it('5. a disabled tag leaves an existing activity unchanged (D-04)', async () => {
    const beforeRes = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities/${taggedActivityId}`)
      .set('cookie', stranger.cookie);
    expect(beforeRes.status).toBe(200);
    expect(beforeRes.body.tag?.id).toBe(preDrinkTagId);
    const titleBefore = beforeRes.body.title as string;

    await db
      .insert(festivalActivityTag)
      .values({ festivalId: festivalAId, tagId: preDrinkTagId, enabled: false });

    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', stranger.cookie);
    expect(listRes.status).toBe(200);
    type Row = { id: string; tag: { id: string; slug: string; title: string } | null };
    const listed = (listRes.body as Row[]).find((r) => r.id === taggedActivityId);
    expect(listed?.tag?.id).toBe(preDrinkTagId);
    expect(listed?.tag?.slug).toBe('pre-drink');
    expect(listed?.tag?.title).toBe(titleBefore);

    const detailRes = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities/${taggedActivityId}`)
      .set('cookie', stranger.cookie);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.tag?.id).toBe(preDrinkTagId);
    expect(detailRes.body.tag?.slug).toBe('pre-drink');
    expect(detailRes.body.title).toBe(titleBefore);
  });

  it('6. empty cases: no activities, unknown festivalId, unknown activityId', async () => {
    const resListC = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalCId}/activities`)
      .set('cookie', stranger.cookie);
    expect(resListC.status).toBe(200);
    expect(resListC.body).toEqual([]);

    const resMineC = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalCId}/my-activities`)
      .set('cookie', stranger.cookie);
    expect(resMineC.status).toBe(200);
    expect(resMineC.body).toEqual([]);

    const resUnknownFestival = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${randomUUID()}/activities`)
      .set('cookie', stranger.cookie);
    expect(resUnknownFestival.status).toBe(200);
    expect(resUnknownFestival.body).toEqual([]);

    const resUnknownActivity = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities/${randomUUID()}`)
      .set('cookie', stranger.cookie);
    expect(resUnknownActivity.status).toBe(404);
  });

  it('7. a startTime tie resolves to a total, run-stable order (id ascending)', async () => {
    const expectedOrder = [tieActivityId1, tieActivityId2].sort();

    const first = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', stranger.cookie);
    expect(first.status).toBe(200);
    type Row = { id: string };
    const firstTieIds = (first.body as Row[])
      .map((r) => r.id)
      .filter((id) => id === tieActivityId1 || id === tieActivityId2);
    expect(firstTieIds).toEqual(expectedOrder);

    const second = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', stranger.cookie);
    expect(second.status).toBe(200);
    const secondTieIds = (second.body as Row[])
      .map((r) => r.id)
      .filter((id) => id === tieActivityId1 || id === tieActivityId2);
    expect(secondTieIds).toEqual(firstTieIds);
  });

  it('8. cross-tenant (SEC-03): A never lists B’s activity, and B’s detail 404s under A’s path', async () => {
    const listRes = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities`)
      .set('cookie', stranger.cookie);
    expect(listRes.status).toBe(200);
    type Row = { id: string };
    expect((listRes.body as Row[]).map((r) => r.id)).not.toContain(bActivityId);
    expect(JSON.stringify(listRes.body)).not.toContain(B_TITLE);

    const detailRes = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities/${bActivityId}`)
      .set('cookie', stranger.cookie);
    expect(detailRes.status).toBe(404);
  });

  it('9. localization: ?locale=en resolves the English tag title, no locale resolves A’s defaultLocale', async () => {
    const resDe = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities/${taggedActivityId}`)
      .set('cookie', stranger.cookie);
    expect(resDe.status).toBe(200);
    expect(resDe.body.tag?.title).toBe('Vorglühen');
    expect(resDe.body.title).toBe('Vorglühen');

    const resEn = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activities/${taggedActivityId}?locale=en`)
      .set('cookie', stranger.cookie);
    expect(resEn.status).toBe(200);
    expect(resEn.body.tag?.title).toBe('Pre-Drinks');
    expect(resEn.body.title).toBe('Pre-Drinks');
  });
});
