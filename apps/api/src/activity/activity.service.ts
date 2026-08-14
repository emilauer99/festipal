import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm';
import {
  activity,
  activityParticipant,
  activityTag,
  activityTagTranslation,
  festival,
  festivalActivityTag,
  visitorProfile,
  type Database,
} from '@quiks/db';
import {
  resolveLocalized,
  type Activity,
  type ActivityDetail,
  type ActivityParticipant,
  type ActivitySummary,
  type ActivityTag,
  type CreateActivityBody,
  type Locale,
  type LocalizedText,
} from '@quiks/contracts';

import { DB } from '../db/db.module';
import { postgresErrorOf } from '../db/postgres-error';
import { foreignProfileColumns, pickForeignProfile, toIsoString } from '../friendship/visitor-projection';

/**
 * The row shape shared by `listForFestival`/`listMine`/`getDetail`'s first
 * query (D-12, plan 10-04) — `tagId`/`tagSlug` are nullable because
 * `activityTag` is LEFT-joined (an activity may have no tag), and
 * `participantCount`/`joined` are correlated subqueries evaluated per row,
 * never a post-hoc JS count (SEC-03: scope conditions belong in SQL).
 */
type ActivitySummaryRow = {
  id: string;
  festivalId: string;
  creatorId: string;
  subtitle: string | null;
  description: string | null;
  location: string | null;
  title: string | null;
  geoLat: number | null;
  geoLng: number | null;
  startTime: Date;
  capacity: number | null;
  tagId: string | null;
  tagSlug: string | null;
  participantCount: number;
  joined: boolean;
};

export type CreateActivityResult =
  | { status: 'ok'; activity: Activity }
  | { status: 'festival-not-found' }
  | { status: 'tag-not-found' }
  | { status: 'profile-required' }
  | { status: 'invalid' };

export type JoinActivityResult =
  | { status: 'joined' }
  | { status: 'not-found' }
  | { status: 'full' }
  | { status: 'started' }
  | { status: 'profile-required' };

export type LeaveActivityResult = { status: 'removed' } | { status: 'creator' };

export type RemoveActivityResult =
  | { status: 'removed' }
  | { status: 'not-found' }
  | { status: 'not-creator' };

@Injectable()
export class ActivityService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /**
   * The effective tag list (D-02/D-05, SEC-03): activated global tags
   * (`activity_tag.festivalId IS NULL`, minus any `festival_activity_tag` row
   * for THIS festival with `enabled=false`) union this festival's own tags.
   * Both scope conditions live in the WHERE clause — never a post-hoc JS
   * `.filter()` (ARCHITECTURE.md §Anti-Patterns "Client-Supplied Scope" applies
   * server-side too). Titles resolved to the requested (or festival default)
   * locale, same LEFT JOIN + accumulate + `resolveLocalized` shape the removed
   * `FestivalService.listTags` used.
   *
   * An unknown `festivalId` returns `[]`, not a thrown error — the caller (the
   * ts-rest handler) never differentiates "festival not found" from "festival
   * has no effective tags", matching the route's no-404 contract.
   */
  async listEffectiveTags(festivalId: string, requested?: Locale): Promise<ActivityTag[]> {
    const [fest] = await this.db
      .select({ defaultLocale: festival.defaultLocale })
      .from(festival)
      .where(eq(festival.id, festivalId))
      .limit(1);
    if (!fest) return [];

    const rows = await this.db
      .select({
        id: activityTag.id,
        slug: activityTag.slug,
        locale: activityTagTranslation.locale,
        title: activityTagTranslation.title,
      })
      .from(activityTag)
      .leftJoin(
        festivalActivityTag,
        and(
          eq(festivalActivityTag.tagId, activityTag.id),
          eq(festivalActivityTag.festivalId, festivalId),
        ),
      )
      .leftJoin(activityTagTranslation, eq(activityTagTranslation.tagId, activityTag.id))
      .where(this.effectiveTagWhere(festivalId))
      // Total, run-stable order: slug ascending, tag id as the tie-break — two
      // tags resolving to the same title still come back in the same order on
      // every call.
      .orderBy(asc(activityTag.slug), asc(activityTag.id));

    // `Map` preserves insertion order, so accumulating in row order (already
    // slug/id-sorted by the query above) keeps the final list's order stable
    // even though each tag can produce multiple rows (one per translation).
    const byTag = new Map<string, { slug: string; titles: LocalizedText }>();
    for (const r of rows) {
      const entry = byTag.get(r.id) ?? { slug: r.slug, titles: {} };
      if (r.locale && r.title) {
        entry.titles[r.locale] = r.title;
      }
      byTag.set(r.id, entry);
    }

    const locale = requested ?? fest.defaultLocale;
    return [...byTag.entries()].map(([id, entry]) => ({
      id,
      slug: entry.slug,
      title: resolveLocalized(entry.titles, locale, fest.defaultLocale),
    }));
  }

  /**
   * The effective-tag predicate (D-02/D-05, SEC-03) as a WHERE fragment,
   * pulled out so {@link listEffectiveTags} (the list) and `create`'s
   * tag-validation gate (below) can never drift on what "effective" means: a
   * tag is effective for `festivalId` when it is global
   * (`activityTag.festivalId IS NULL`) or owned by this festival, AND no
   * `festival_activity_tag` row for THIS festival disables it. Both call
   * sites still need their own `leftJoin` on `festivalActivityTag` (Drizzle
   * requires the join condition inline), but this is the one place the
   * predicate itself is written.
   */
  private effectiveTagWhere(festivalId: string) {
    return and(
      or(isNull(activityTag.festivalId), eq(activityTag.festivalId, festivalId)),
      or(isNull(festivalActivityTag.enabled), eq(festivalActivityTag.enabled, true)),
    );
  }

  /**
   * Is `tagId` selectable for `festivalId` right now? Reuses
   * {@link effectiveTagWhere} — the exact same predicate `listEffectiveTags`
   * exposes as a list, so a tag that cannot be picked from the picker cannot
   * be smuggled in by id either. A foreign tag and a disabled tag both come
   * back `false` — the caller (below) maps both to the identical `tag-not-found`
   * outcome, never distinguishing them (SEC-03: no existence oracle over
   * another tenant's catalog).
   */
  private async isTagEffective(tagId: string, festivalId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: activityTag.id })
      .from(activityTag)
      .leftJoin(
        festivalActivityTag,
        and(
          eq(festivalActivityTag.tagId, activityTag.id),
          eq(festivalActivityTag.festivalId, festivalId),
        ),
      )
      .where(and(eq(activityTag.id, tagId), this.effectiveTagWhere(festivalId)))
      .limit(1);
    return Boolean(row);
  }

  /**
   * Loads one activity by id and shapes it into the wire `Activity` (D-04/D-12
   * ADR-017 auto-title). The tag is joined DIRECTLY by its id, never through
   * {@link effectiveTagWhere} — an activity keeps its tag and resolved title
   * unchanged even after that tag is later disabled for the festival (D-04);
   * only the SELECTION list hides it, not existing activities.
   */
  private async loadActivityView(
    activityId: string,
    locale: Locale,
    festivalDefaultLocale: Locale,
  ): Promise<Activity | null> {
    const [row] = await this.db
      .select()
      .from(activity)
      .where(eq(activity.id, activityId))
      .limit(1);
    if (!row) return null;

    let tag: ActivityTag | null = null;
    if (row.tagId) {
      const [tagRow] = await this.db
        .select({ id: activityTag.id, slug: activityTag.slug })
        .from(activityTag)
        .where(eq(activityTag.id, row.tagId))
        .limit(1);
      if (tagRow) {
        const translations = await this.db
          .select({ locale: activityTagTranslation.locale, title: activityTagTranslation.title })
          .from(activityTagTranslation)
          .where(eq(activityTagTranslation.tagId, row.tagId));
        const titles: LocalizedText = {};
        for (const t of translations) titles[t.locale] = t.title;
        tag = {
          id: tagRow.id,
          slug: tagRow.slug,
          title: resolveLocalized(titles, locale, festivalDefaultLocale),
        };
      }
    }

    // ADR-017 auto-title: the explicit title wins when present, otherwise the
    // resolved tag title — `activity_title_or_tag_chk` guarantees one of the
    // two is always non-null.
    const title = row.title ?? tag?.title ?? '';
    const geo =
      row.geoLat !== null && row.geoLng !== null ? { lat: row.geoLat, lng: row.geoLng } : null;

    return {
      id: row.id,
      festivalId: row.festivalId,
      creatorId: row.creatorId,
      subtitle: row.subtitle,
      description: row.description,
      location: row.location,
      tag,
      title,
      geo,
      startTime: row.startTime.toISOString(),
      capacity: row.capacity,
    };
  }

  /**
   * Create an activity (D-07/D-08/D-09, ADR-017 auto-title, SEC-03). The
   * creator becomes a participant in the SAME transaction as the activity
   * insert — there is no instant at which the row exists without its creator
   * on the attendee list (Erfolgskriterium 4).
   *
   * `creatorId` and `festivalId` are caller-supplied by the CONTROLLER from
   * session + path, never read from `body` here or there
   * (ARCHITECTURE.md §Anti-Patterns "Client-Supplied Scope").
   */
  async create(
    creatorId: string,
    festivalId: string,
    body: CreateActivityBody,
    requested?: Locale,
  ): Promise<CreateActivityResult> {
    const [fest] = await this.db
      .select({ id: festival.id, defaultLocale: festival.defaultLocale })
      .from(festival)
      .where(eq(festival.id, festivalId))
      .limit(1);
    if (!fest) return { status: 'festival-not-found' };

    if (body.tagId) {
      const effective = await this.isTagEffective(body.tagId, festivalId);
      if (!effective) return { status: 'tag-not-found' };
    }

    let insertedId: string;
    try {
      const inserted = await this.db.transaction(async (tx) => {
        const [row] = await tx
          .insert(activity)
          .values({
            festivalId,
            creatorId,
            tagId: body.tagId ?? null,
            title: body.title ?? null,
            subtitle: body.subtitle ?? null,
            description: body.description ?? null,
            location: body.location ?? null,
            geoLat: body.geo?.lat ?? null,
            geoLng: body.geo?.lng ?? null,
            startTime: new Date(body.startTime),
            capacity: body.capacity ?? null,
          })
          .returning({ id: activity.id });
        if (!row) throw new Error('activity insert returned no row');

        // D-07: the creator is a participant from the moment the activity
        // exists — both writes commit together or neither does.
        await tx.insert(activityParticipant).values({
          activityId: row.id,
          festivalId,
          visitorId: creatorId,
        });

        return row;
      });
      insertedId = inserted.id;
    } catch (err) {
      const cause = postgresErrorOf(err);
      // 23503: `activity.creator_id` FK to `visitor_profile.account_id` — an
      // unfinished first login, the same answer `FestivalService.save` gives
      // for `my_festival`.
      if (cause?.code === '23503') return { status: 'profile-required' };
      // 23514: one of the four field CHECKs on `activity` — the contract-level
      // `.refine` pre-empts the title-or-tag case, but capacity/geo values
      // that bypass the contract (or a future direct caller) still land here
      // instead of surfacing as a 500.
      if (cause?.code === '23514') return { status: 'invalid' };
      throw err;
    }

    const locale = requested ?? fest.defaultLocale;
    const view = await this.loadActivityView(insertedId, locale, fest.defaultLocale);
    if (!view) throw new Error('activity vanished immediately after its own insert');
    return { status: 'ok', activity: view };
  }

  /**
   * Join an activity (D-08/D-09/D-10, plan 10-03). Both scope conditions
   * (`id` AND `festivalId`) sit in the same WHERE clause the other three
   * methods use — an `activityId` guessed from a foreign festival never
   * resolves under this festival's path (SEC-03).
   *
   * `started` is computed by the DATABASE (`now() >= start_time`), never by
   * comparing against a client-supplied timestamp (D-10) — the same
   * server-time posture the migration 0010 trigger itself takes for the
   * capacity race.
   *
   * The actual write is a bare `onConflictDoNothing()` insert — capacity is
   * NOT re-checked here (that would reintroduce the check-then-insert race
   * migration 0010 exists to remove). `postgresErrorOf` discriminates the
   * trigger's `23514`/`activity_capacity_full_chk` from the FK's `23503`
   * (an unfinished first login), the same idiom `create` above already uses.
   */
  async join(visitorId: string, festivalId: string, activityId: string): Promise<JoinActivityResult> {
    const [row] = await this.db
      .select({
        id: activity.id,
        started: sql<boolean>`now() >= ${activity.startTime}`,
      })
      .from(activity)
      .where(and(eq(activity.id, activityId), eq(activity.festivalId, festivalId)))
      .limit(1);
    if (!row) return { status: 'not-found' };
    if (row.started) return { status: 'started' };

    try {
      await this.db
        .insert(activityParticipant)
        .values({ activityId, festivalId, visitorId })
        .onConflictDoNothing();
    } catch (err) {
      const cause = postgresErrorOf(err);
      // 23514/activity_capacity_full_chk: migration 0010's trigger refused
      // the last seat.
      if (cause?.code === '23514' && cause.constraint_name === 'activity_capacity_full_chk') {
        return { status: 'full' };
      }
      // 23503: `activity_participant.visitor_id` FK to
      // `visitor_profile.account_id` — an unfinished first login, same
      // answer `create` gives above.
      if (cause?.code === '23503') return { status: 'profile-required' };
      throw err;
    }

    // `joined` regardless of whether `onConflictDoNothing` wrote a new row —
    // a repeated join by an already-seated visitor is the same success, not
    // a different outcome (idempotency).
    return { status: 'joined' };
  }

  /**
   * Leave an activity (D-09, plan 10-03). Deliberately evidence-free like
   * `decline`/`withdraw`/`unfriend`: an unknown `activityId` (in this
   * festival) and a caller who never joined both answer `removed`, exactly
   * like a caller who did. The ONE branch that is NOT evidence-free is the
   * creator — leaving must never be a hidden way to detach the creator from
   * their own activity (the explicit `remove` below is the only door out).
   */
  async leave(visitorId: string, festivalId: string, activityId: string): Promise<LeaveActivityResult> {
    const [row] = await this.db
      .select({ creatorId: activity.creatorId })
      .from(activity)
      .where(and(eq(activity.id, activityId), eq(activity.festivalId, festivalId)))
      .limit(1);
    if (!row) return { status: 'removed' };
    if (row.creatorId === visitorId) return { status: 'creator' };

    await this.db
      .delete(activityParticipant)
      .where(
        and(eq(activityParticipant.activityId, activityId), eq(activityParticipant.visitorId, visitorId)),
      );
    return { status: 'removed' };
  }

  /**
   * "Auflösen" — creator-only deletion of the activity (D-09, plan 10-03).
   * Deliberately NOT evidence-free (unlike `leave`): existence within a
   * festival is already public (Discovery), so there is no secret a 404
   * would expose, and a non-creator getting a silent 200 would incorrectly
   * remove a still-live activity from their own client. Participant rows
   * disappear via `activity_participant_activity_fk`'s `ON DELETE CASCADE`
   * (10-02) — no second delete statement needed.
   */
  async remove(callerId: string, festivalId: string, activityId: string): Promise<RemoveActivityResult> {
    const [row] = await this.db
      .select({ creatorId: activity.creatorId })
      .from(activity)
      .where(and(eq(activity.id, activityId), eq(activity.festivalId, festivalId)))
      .limit(1);
    if (!row) return { status: 'not-found' };
    if (row.creatorId !== callerId) return { status: 'not-creator' };

    await this.db.delete(activity).where(and(eq(activity.id, activityId), eq(activity.festivalId, festivalId)));
    return { status: 'removed' };
  }

  /**
   * The select map shared by `listForFestival`, `listMine` and `getDetail`'s
   * first query (D-12, plan 10-04). `participantCount`/`joined` are
   * CORRELATED SUBQUERIES against `activity_participant`, evaluated per row —
   * never a post-hoc JS count/filter (SEC-03: the scope conditions belong in
   * SQL). `callerId` is interpolated as a Drizzle `sql` template value, i.e. a
   * bound parameter, never string-concatenated into the query.
   */
  private summarySelect(callerId: string) {
    return {
      id: activity.id,
      festivalId: activity.festivalId,
      creatorId: activity.creatorId,
      subtitle: activity.subtitle,
      description: activity.description,
      location: activity.location,
      title: activity.title,
      geoLat: activity.geoLat,
      geoLng: activity.geoLng,
      startTime: activity.startTime,
      capacity: activity.capacity,
      tagId: activityTag.id,
      tagSlug: activityTag.slug,
      participantCount: sql<number>`(select count(*)::int from ${activityParticipant} where ${activityParticipant.activityId} = ${activity.id})`,
      joined: sql<boolean>`exists (select 1 from ${activityParticipant} where ${activityParticipant.activityId} = ${activity.id} and ${activityParticipant.visitorId} = ${callerId})`,
    };
  }

  /**
   * Turns a batch of {@link ActivitySummaryRow}s into `ActivitySummary[]`
   * (D-12, plan 10-04) — tag-title resolution, ADR-017 auto-title, and the
   * geo-pair collapse, shared by ALL THREE read methods so this shaping never
   * stands three times side by side. `activity_tag_translation` is fetched in
   * ONE second `inArray` query over the batch's distinct tag ids, the same
   * two-query shape `FestivalService.listAll` and `listEffectiveTags` already
   * use — not N+1 per row.
   */
  private async shapeSummaries(
    rows: ActivitySummaryRow[],
    requested: Locale | undefined,
    festivalDefaultLocale: Locale,
  ): Promise<ActivitySummary[]> {
    const tagIds = [
      ...new Set(rows.map((r) => r.tagId).filter((id): id is string => id !== null)),
    ];

    const titlesByTag = new Map<string, LocalizedText>();
    if (tagIds.length > 0) {
      const translations = await this.db
        .select({
          tagId: activityTagTranslation.tagId,
          locale: activityTagTranslation.locale,
          title: activityTagTranslation.title,
        })
        .from(activityTagTranslation)
        .where(inArray(activityTagTranslation.tagId, tagIds));
      for (const t of translations) {
        const entry = titlesByTag.get(t.tagId) ?? {};
        entry[t.locale] = t.title;
        titlesByTag.set(t.tagId, entry);
      }
    }

    const locale = requested ?? festivalDefaultLocale;
    return rows.map((row) => {
      const tag: ActivityTag | null =
        row.tagId && row.tagSlug
          ? {
              id: row.tagId,
              slug: row.tagSlug,
              title: resolveLocalized(titlesByTag.get(row.tagId) ?? {}, locale, festivalDefaultLocale),
            }
          : null;
      // ADR-017 auto-title: the explicit title wins when present, otherwise
      // the resolved tag title — `activity_title_or_tag_chk` guarantees one
      // of the two is always non-null.
      const title = row.title ?? tag?.title ?? '';
      const geo =
        row.geoLat !== null && row.geoLng !== null ? { lat: row.geoLat, lng: row.geoLng } : null;
      return {
        id: row.id,
        festivalId: row.festivalId,
        creatorId: row.creatorId,
        subtitle: row.subtitle,
        description: row.description,
        location: row.location,
        tag,
        title,
        geo,
        startTime: row.startTime.toISOString(),
        capacity: row.capacity,
        participantCount: row.participantCount,
        joined: row.joined,
      };
    });
  }

  /**
   * Public discovery (D-10, plan 10-04): activities whose `startTime` is
   * still in the future, festival-scoped. A started activity disappears from
   * this list for EVERY caller, participant or not — `listMine` is the one
   * exception to that cutoff (D-11). Total, run-stable order: `startTime`
   * ascending, `id` as the tie-break, so two activities sharing a start time
   * still come back in the same sequence on every call.
   *
   * An unknown `festivalId` returns `[]`, not a thrown error — same
   * "not an existence oracle" stance as `listEffectiveTags`/`friendsInFestival`.
   */
  async listForFestival(
    callerId: string,
    festivalId: string,
    requested?: Locale,
  ): Promise<ActivitySummary[]> {
    const [fest] = await this.db
      .select({ defaultLocale: festival.defaultLocale })
      .from(festival)
      .where(eq(festival.id, festivalId))
      .limit(1);
    if (!fest) return [];

    const rows = await this.db
      .select(this.summarySelect(callerId))
      .from(activity)
      .leftJoin(activityTag, eq(activityTag.id, activity.tagId))
      .where(and(eq(activity.festivalId, festivalId), gt(activity.startTime, sql`now()`)))
      .orderBy(asc(activity.startTime), asc(activity.id));

    return this.shapeSummaries(rows, requested, fest.defaultLocale);
  }

  /**
   * The caller's own activities in this festival (D-11) — deliberately NO
   * time cutoff, so a participant (creator included) keeps reading their
   * meeting point after `startTime`. Both scope conditions — the caller and
   * the festival — sit in the JOIN/WHERE, never a post-hoc `.filter()`: the
   * `innerJoin` on `activityParticipant` restricts to rows where THIS caller
   * has a participant row, and there is no parameter through which a client
   * could ask for a third party's participation (same guard `friendsInFestival`
   * uses). Same total order as {@link listForFestival}.
   */
  async listMine(callerId: string, festivalId: string, requested?: Locale): Promise<ActivitySummary[]> {
    const [fest] = await this.db
      .select({ defaultLocale: festival.defaultLocale })
      .from(festival)
      .where(eq(festival.id, festivalId))
      .limit(1);
    if (!fest) return [];

    const rows = await this.db
      .select(this.summarySelect(callerId))
      .from(activity)
      .leftJoin(activityTag, eq(activityTag.id, activity.tagId))
      .innerJoin(
        activityParticipant,
        and(eq(activityParticipant.activityId, activity.id), eq(activityParticipant.visitorId, callerId)),
      )
      .where(eq(activity.festivalId, festivalId))
      .orderBy(asc(activity.startTime), asc(activity.id));

    return this.shapeSummaries(rows, requested, fest.defaultLocale);
  }

  /**
   * Activity detail (D-04/D-12/VIS-02, plan 10-04) — readable by ANY
   * signed-in visitor within the festival, including after `startTime` and
   * regardless of participation: D-10 cuts the public LIST and JOINING, not
   * readability (ADR-014 — isolation is data-scoping, not an access gate).
   * The tag is joined DIRECTLY by id via {@link shapeSummaries}'s second
   * query, never through the effective-tag predicate — a tag disabled after
   * this activity was created keeps its resolved title unchanged (D-04).
   *
   * The participant list is the ONE place a foreign profile is embedded here,
   * and it goes ONLY through `foreignProfileColumns`/`pickForeignProfile` —
   * importing them from `../friendship/visitor-projection` instead of
   * re-declaring a select map is what keeps `projection-uniqueness.spec.ts`
   * green (VIS-02: exactly one foreign-view select map and shaping function
   * in the whole `apps/api/src` tree). Ordered by `username` ascending, which
   * is unique via the functional index `visitor_profile_username_lower_unq`
   * — a total, run-stable order.
   */
  async getDetail(
    callerId: string,
    festivalId: string,
    activityId: string,
    requested?: Locale,
  ): Promise<ActivityDetail | null> {
    const [fest] = await this.db
      .select({ defaultLocale: festival.defaultLocale })
      .from(festival)
      .where(eq(festival.id, festivalId))
      .limit(1);
    if (!fest) return null;

    const [row] = await this.db
      .select(this.summarySelect(callerId))
      .from(activity)
      .leftJoin(activityTag, eq(activityTag.id, activity.tagId))
      .where(and(eq(activity.id, activityId), eq(activity.festivalId, festivalId)))
      .limit(1);
    if (!row) return null;

    const [summary] = await this.shapeSummaries([row], requested, fest.defaultLocale);
    if (!summary) throw new Error('shapeSummaries returned no row for a row it was given');

    const participantRows = await this.db
      .select({ ...foreignProfileColumns, joinedAt: activityParticipant.joinedAt })
      .from(activityParticipant)
      .innerJoin(visitorProfile, eq(visitorProfile.accountId, activityParticipant.visitorId))
      .where(
        and(eq(activityParticipant.activityId, activityId), eq(activityParticipant.festivalId, festivalId)),
      )
      .orderBy(asc(visitorProfile.username));

    const participants: ActivityParticipant[] = participantRows.map((r) => ({
      profile: pickForeignProfile(r),
      joinedAt: toIsoString(r.joinedAt),
    }));

    return { ...summary, participants };
  }
}
