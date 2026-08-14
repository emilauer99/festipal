import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull, or } from 'drizzle-orm';
import {
  activityTag,
  activityTagTranslation,
  festival,
  festivalActivityTag,
  type Database,
} from '@quiks/db';
import {
  resolveLocalized,
  type ActivityTag,
  type Locale,
  type LocalizedText,
} from '@quiks/contracts';

import { DB } from '../db/db.module';

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
      .where(
        and(
          or(isNull(activityTag.festivalId), eq(activityTag.festivalId, festivalId)),
          or(isNull(festivalActivityTag.enabled), eq(festivalActivityTag.enabled, true)),
        ),
      )
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
}
