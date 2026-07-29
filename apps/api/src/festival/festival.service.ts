import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  festival,
  festivalLocale,
  tag,
  tagTranslation,
  type Database,
} from '@festipal/db';
import {
  resolveLocalized,
  type Festival,
  type Locale,
  type LocalizedText,
  type Tag,
} from '@festipal/contracts';

import { DB } from '../db/db.module';

@Injectable()
export class FestivalService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async getBySlug(slug: string): Promise<Festival | null> {
    const [row] = await this.db
      .select()
      .from(festival)
      .where(eq(festival.slug, slug))
      .limit(1);
    if (!row) return null;

    const locales = await this.db
      .select({ locale: festivalLocale.locale })
      .from(festivalLocale)
      .where(eq(festivalLocale.festivalId, row.id));

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      defaultLocale: row.defaultLocale,
      supportedLocales: locales.map((l) => l.locale),
      cashlessUrl: row.cashlessUrl,
    };
  }

  /** Tenant-scoped tag list with titles resolved to the requested (or festival default) locale. */
  async listTags(festivalId: string, requested?: Locale): Promise<Tag[]> {
    const [fest] = await this.db
      .select({ defaultLocale: festival.defaultLocale })
      .from(festival)
      .where(eq(festival.id, festivalId))
      .limit(1);
    if (!fest) return [];

    const rows = await this.db
      .select({
        id: tag.id,
        slug: tag.slug,
        locale: tagTranslation.locale,
        title: tagTranslation.title,
      })
      .from(tag)
      .leftJoin(tagTranslation, eq(tagTranslation.tagId, tag.id))
      .where(eq(tag.festivalId, festivalId));

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
