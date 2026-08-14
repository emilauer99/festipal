import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { PostgresError } from 'postgres';
import { festival, festivalLocale, myFestival, type Database } from '@quiks/db';
import { type Festival, type Locale } from '@quiks/contracts';

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
      startDate: row.startDate,
      endDate: row.endDate,
      place: row.place,
    };
  }

  /**
   * Browse: ALL currently-seeded festivals, no pagination, D-04 minimal
   * shape (id/slug/name/defaultLocale/supportedLocales/cashlessUrl). Distinct
   * from `MeService.listMyFestivals` (caller-scoped) — never one endpoint +
   * client-side `.filter()` (Pitfall 4).
   */
  async listAll(): Promise<Festival[]> {
    const rows = await this.db.select().from(festival);
    if (rows.length === 0) return [];

    const festivalIds = rows.map((r) => r.id);
    const locales = await this.db
      .select({ festivalId: festivalLocale.festivalId, locale: festivalLocale.locale })
      .from(festivalLocale)
      .where(inArray(festivalLocale.festivalId, festivalIds));

    const localesByFestival = new Map<string, Locale[]>();
    for (const l of locales) {
      const arr = localesByFestival.get(l.festivalId) ?? [];
      arr.push(l.locale);
      localesByFestival.set(l.festivalId, arr);
    }

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      defaultLocale: row.defaultLocale,
      supportedLocales: localesByFestival.get(row.id) ?? [],
      cashlessUrl: row.cashlessUrl,
      startDate: row.startDate,
      endDate: row.endDate,
      place: row.place,
    }));
  }

  /**
   * Gate-less save (ADR-014): the only gate is the global AuthGuard (must be
   * logged in) — no membership/ticket check before writing `my_festival`.
   * Idempotent via `onConflictDoNothing()` on the (visitorId, festivalId)
   * composite PK; a repeat save is a no-op, never an error.
   */
  async save(
    visitorId: string,
    festivalId: string,
  ): Promise<{ status: 'ok' } | { status: 'not-found' } | { status: 'profile-required' }> {
    const [fest] = await this.db
      .select({ id: festival.id })
      .from(festival)
      .where(eq(festival.id, festivalId))
      .limit(1);
    if (!fest) return { status: 'not-found' };

    try {
      await this.db.insert(myFestival).values({ visitorId, festivalId }).onConflictDoNothing();
      return { status: 'ok' };
    } catch (err) {
      // my_festival.visitorId FKs to visitor_profile.accountId — a caller who
      // has not completed their profile yet (GET /me profile: null, a
      // reachable first-login state) trips a Postgres 23503 FK violation on
      // insert. Mirror me.service.completeProfile's 23505 idiom: check
      // `error.cause instanceof PostgresError`, never `error` itself.
      const cause = (err as { cause?: unknown }).cause;
      if (cause instanceof PostgresError && cause.code === '23503') {
        return { status: 'profile-required' };
      }
      throw err;
    }
  }
}
