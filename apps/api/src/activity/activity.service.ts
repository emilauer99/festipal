import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull, or } from 'drizzle-orm';
import {
  activity,
  activityParticipant,
  activityTag,
  activityTagTranslation,
  festival,
  festivalActivityTag,
  type Database,
} from '@quiks/db';
import {
  resolveLocalized,
  type Activity,
  type ActivityTag,
  type CreateActivityBody,
  type Locale,
  type LocalizedText,
} from '@quiks/contracts';

import { DB } from '../db/db.module';
import { postgresErrorOf } from '../db/postgres-error';

export type CreateActivityResult =
  | { status: 'ok'; activity: Activity }
  | { status: 'festival-not-found' }
  | { status: 'tag-not-found' }
  | { status: 'profile-required' }
  | { status: 'invalid' };

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
}
