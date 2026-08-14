import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { eq, isNull, and } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
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
 * The Phase-10 tracer's proof surface (D-01/D-02/D-04/D-05, SEC-03): the
 * effective tag list for a festival is activated global tags UNION the
 * festival's own tags, with a genuinely nullable `activity_tag.festivalId` —
 * the ONE deliberate exception to "every tenant-scoped table has a NOT NULL
 * festivalId" (SEC-03). This spec gets its own dedicated cross-tenant test for
 * that special case rather than assuming the SEC-02 baseline covers it (it
 * doesn't — the whole point of a nullable FK is that it behaves differently
 * from a NOT NULL one).
 *
 * Mirrors `festival-isolation.spec.ts`'s fixture shape: throwaway festivals,
 * ONE real OTP sign-in (better-auth's rate limiter allows 3 requests/60s per
 * source — the same budget constraint every OTP-based spec in this suite
 * respects), direct DB inserts for everything that doesn't need a live
 * request/response round-trip.
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
  const email = `activity-tags-${label}-${randomUUID()}@quiks.dev`;
  const cookie = await signInWithOtp(app, email);

  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  if (!u) throw new Error(`sign-in did not create a user row for ${label}`);
  const accountId = u.id;

  await db.insert(visitorProfile).values({
    accountId,
    username: `visitor-${label}-${randomUUID().slice(0, 8)}`,
    displayName: `Activity Tags Test ${label}`,
  });

  return { accountId, cookie };
}

describe('activity tags — effective list (D-02/D-04/D-05, SEC-03 nullable festivalId)', () => {
  let app: INestApplication;
  let db: Database;

  let festivalAId: string;
  let festivalBId: string;
  let festivalCId: string;
  let caller: { accountId: string; cookie: string };

  let globalWorkshopTagId: string;
  let globalAfterpartyTagId: string;

  let ownWorkshopTagAId: string;
  const OWN_WORKSHOP_A_DE = 'Mein persönlicher Workshop';
  const OWN_WORKSHOP_A_EN = 'My Personal Workshop';

  let ownDeOnlyTagAId: string;
  const OWN_DE_ONLY_TITLE = 'Nur Deutsch Titel';

  beforeAll(async () => {
    app = await createTestApp();
    db = createTestDatabase();

    const [festA] = await db
      .insert(festival)
      .values({
        slug: `activity-tags-a-${randomUUID()}`,
        name: 'Activity Tags Test Festival A',
        defaultLocale: 'de',
      })
      .returning();
    const [festB] = await db
      .insert(festival)
      .values({
        slug: `activity-tags-b-${randomUUID()}`,
        name: 'Activity Tags Test Festival B',
        defaultLocale: 'en',
      })
      .returning();
    const [festC] = await db
      .insert(festival)
      .values({
        slug: `activity-tags-c-${randomUUID()}`,
        name: 'Activity Tags Test Festival C (no own rows)',
        defaultLocale: 'de',
      })
      .returning();
    if (!festA || !festB || !festC) throw new Error('festival fixture insert returned no row');
    festivalAId = festA.id;
    festivalBId = festB.id;
    festivalCId = festC.id;

    caller = await createVisitor(app, db, 'caller');

    // The seeded global tags this spec anchors on (D-06) — read, never
    // created here, so a change to the seed list breaks this spec loudly
    // instead of silently.
    const [workshop] = await db
      .select({ id: activityTag.id })
      .from(activityTag)
      .where(and(eq(activityTag.slug, 'workshop'), isNull(activityTag.festivalId)))
      .limit(1);
    const [afterparty] = await db
      .select({ id: activityTag.id })
      .from(activityTag)
      .where(and(eq(activityTag.slug, 'afterparty'), isNull(activityTag.festivalId)))
      .limit(1);
    if (!workshop || !afterparty) {
      throw new Error('seeded global tags "workshop"/"afterparty" not found — run db:seed first');
    }
    globalWorkshopTagId = workshop.id;
    globalAfterpartyTagId = afterparty.id;

    // A's own tag, SAME slug as the global "workshop" tag — the adjacency
    // case (case 3): two distinct entries, never a merge/collision, because
    // slug uniqueness is scoped by two separate partial unique indexes.
    const [ownWorkshopA] = await db
      .insert(activityTag)
      .values({ festivalId: festivalAId, slug: 'workshop' })
      .returning();
    if (!ownWorkshopA) throw new Error('own workshop tag insert for festival A returned no row');
    ownWorkshopTagAId = ownWorkshopA.id;
    await db.insert(activityTagTranslation).values([
      { tagId: ownWorkshopTagAId, locale: 'de', title: OWN_WORKSHOP_A_DE },
      { tagId: ownWorkshopTagAId, locale: 'en', title: OWN_WORKSHOP_A_EN },
    ]);

    // A's own tag with ONLY a DE translation — proves the requested-locale ->
    // festival-default fallback (case 2) rather than assuming it from the
    // global-tag path alone.
    const [ownDeOnlyA] = await db
      .insert(activityTag)
      .values({ festivalId: festivalAId, slug: `own-de-only-${randomUUID().slice(0, 8)}` })
      .returning();
    if (!ownDeOnlyA) throw new Error('own de-only tag insert for festival A returned no row');
    ownDeOnlyTagAId = ownDeOnlyA.id;
    await db
      .insert(activityTagTranslation)
      .values({ tagId: ownDeOnlyTagAId, locale: 'de', title: OWN_DE_ONLY_TITLE });
  });

  afterAll(async () => {
    await db
      .delete(festivalActivityTag)
      .where(eq(festivalActivityTag.festivalId, festivalAId));
    await db.delete(activityTagTranslation).where(eq(activityTagTranslation.tagId, ownWorkshopTagAId));
    await db.delete(activityTagTranslation).where(eq(activityTagTranslation.tagId, ownDeOnlyTagAId));
    await db.delete(activityTag).where(eq(activityTag.id, ownWorkshopTagAId));
    await db.delete(activityTag).where(eq(activityTag.id, ownDeOnlyTagAId));
    await db.delete(visitorProfile).where(eq(visitorProfile.accountId, caller.accountId));
    await db.delete(festival).where(eq(festival.id, festivalAId));
    await db.delete(festival).where(eq(festival.id, festivalBId));
    await db.delete(festival).where(eq(festival.id, festivalCId));
    // Global seed tags (workshop/afterparty) and better-auth's `user` row are
    // intentionally left untouched — same convention every OTP-based spec in
    // this suite follows for `caller`/`stranger`.
    await app.close();
  });

  it('1. festival A gets all 10 global tags plus its own — titles resolved to A’s DE default', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activity-tags`)
      .set('cookie', caller.cookie);

    expect(res.status).toBe(200);
    // 10 global + 2 own (workshop-slug adjacency tag + de-only tag).
    expect(res.body).toHaveLength(12);

    type Row = { id: string; slug: string; title: string };
    const rows = res.body as Row[];
    const globalWorkshopRow = rows.find((r) => r.id === globalWorkshopTagId);
    expect(globalWorkshopRow?.title).toBe('Workshop');
    const ownWorkshopRow = rows.find((r) => r.id === ownWorkshopTagAId);
    expect(ownWorkshopRow?.title).toBe(OWN_WORKSHOP_A_DE);
    const deOnlyRow = rows.find((r) => r.id === ownDeOnlyTagAId);
    expect(deOnlyRow?.title).toBe(OWN_DE_ONLY_TITLE);
  });

  it('2. ?locale=en resolves English titles; a DE-only tag falls back to A’s defaultLocale', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activity-tags?locale=en`)
      .set('cookie', caller.cookie);

    expect(res.status).toBe(200);
    type Row = { id: string; slug: string; title: string };
    const rows = res.body as Row[];
    const ownWorkshopRow = rows.find((r) => r.id === ownWorkshopTagAId);
    expect(ownWorkshopRow?.title).toBe(OWN_WORKSHOP_A_EN);
    // No EN translation exists for this tag — falls back to A’s defaultLocale
    // (de), never an empty string.
    const deOnlyRow = rows.find((r) => r.id === ownDeOnlyTagAId);
    expect(deOnlyRow?.title).toBe(OWN_DE_ONLY_TITLE);
  });

  it('3. adjacency: A’s own "workshop" tag and the global "workshop" tag are TWO distinct entries', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activity-tags`)
      .set('cookie', caller.cookie);

    expect(res.status).toBe(200);
    type Row = { id: string; slug: string; title: string };
    const workshopRows = (res.body as Row[]).filter((r) => r.slug === 'workshop');
    expect(workshopRows).toHaveLength(2);
    const ids = workshopRows.map((r) => r.id).sort();
    expect(ids).toEqual([globalWorkshopTagId, ownWorkshopTagAId].sort());
  });

  it('4. SEC-03 nullable-festivalId isolation: B sees every global tag but NEVER A’s own tag', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalBId}/activity-tags`)
      .set('cookie', caller.cookie);

    expect(res.status).toBe(200);
    // 10 global only — none of A's own tags leak into B.
    expect(res.body).toHaveLength(10);

    // Serialized-body check (not just a parsed-array check) — the id AND the
    // unique title string must not survive into B's response at all.
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(ownWorkshopTagAId);
    expect(serialized).not.toContain(OWN_WORKSHOP_A_DE);
    expect(serialized).not.toContain(OWN_WORKSHOP_A_EN);
    expect(serialized).not.toContain(ownDeOnlyTagAId);
    expect(serialized).not.toContain(OWN_DE_ONLY_TITLE);

    // The global tag IS present for B too — the nullable festivalId is
    // effective for every festival, not merely absent from A's isolation.
    expect(serialized).toContain(globalWorkshopTagId);
  });

  it('5. disabling a global tag affects only the disabling festival (D-04/D-05)', async () => {
    // A disables the global "afterparty" tag.
    await db
      .insert(festivalActivityTag)
      .values({ festivalId: festivalAId, tagId: globalAfterpartyTagId, enabled: false });

    const resA = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activity-tags`)
      .set('cookie', caller.cookie);
    expect(resA.status).toBe(200);
    type Row = { id: string };
    expect((resA.body as Row[]).map((r) => r.id)).not.toContain(globalAfterpartyTagId);

    // B is untouched — still sees "afterparty".
    const resB = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalBId}/activity-tags`)
      .set('cookie', caller.cookie);
    expect(resB.status).toBe(200);
    expect((resB.body as Row[]).map((r) => r.id)).toContain(globalAfterpartyTagId);

    // Re-enabling brings it back for A.
    await db
      .update(festivalActivityTag)
      .set({ enabled: true })
      .where(
        and(
          eq(festivalActivityTag.festivalId, festivalAId),
          eq(festivalActivityTag.tagId, globalAfterpartyTagId),
        ),
      );

    const resAAgain = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activity-tags`)
      .set('cookie', caller.cookie);
    expect(resAAgain.status).toBe(200);
    expect((resAAgain.body as Row[]).map((r) => r.id)).toContain(globalAfterpartyTagId);
  });

  it('6. empty cases: a festival with no own rows gets exactly the globals; an unknown festivalId is 200 []', async () => {
    const resC = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalCId}/activity-tags`)
      .set('cookie', caller.cookie);
    expect(resC.status).toBe(200);
    expect(resC.body).toHaveLength(10);

    const resUnknown = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${randomUUID()}/activity-tags`)
      .set('cookie', caller.cookie);
    expect(resUnknown.status).toBe(200);
    expect(resUnknown.body).toEqual([]);
  });

  it('7. ordering: repeated calls return identical id order, ascending by slug', async () => {
    const first = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activity-tags`)
      .set('cookie', caller.cookie);
    const second = await request(app.getHttpServer())
      .get(`/api/v1/festivals/${festivalAId}/activity-tags`)
      .set('cookie', caller.cookie);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    type Row = { id: string; slug: string };
    const firstIds = (first.body as Row[]).map((r) => r.id);
    const secondIds = (second.body as Row[]).map((r) => r.id);
    expect(secondIds).toEqual(firstIds);

    const slugs = (first.body as Row[]).map((r) => r.slug);
    const sortedSlugs = [...slugs].sort((a, b) => a.localeCompare(b));
    expect(slugs).toEqual(sortedSlugs);
  });
});
