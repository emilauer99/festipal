import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray, sql } from 'drizzle-orm';
import { PostgresError } from 'postgres';
import { festival, festivalLocale, myFestival, visitorProfile, type Database } from '@quiks/db';
import type { CompleteProfileBody, Festival, Locale, VisitorProfilePublic } from '@quiks/contracts';

import { DB } from '../db/db.module';

type CompleteProfileResult = { status: 'ok'; profile: VisitorProfilePublic } | { status: 'conflict' };

@Injectable()
export class MeService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Returns null for "no profile yet" (first login, needs complete-profile). */
  async getProfile(accountId: string): Promise<VisitorProfilePublic | null> {
    const [row] = await this.db
      .select({
        accountId: visitorProfile.accountId,
        username: visitorProfile.username,
        displayName: visitorProfile.displayName,
        avatar: visitorProfile.avatar,
        // D-12: optional identity fields. `birthDate` is a `YYYY-MM-DD` string
        // (drizzle `date({ mode: 'string' })`), never a Date — no timezone
        // shift can occur on the way out.
        pronoun: visitorProfile.pronoun,
        birthDate: visitorProfile.birthDate,
        gender: visitorProfile.gender,
      })
      .from(visitorProfile)
      .where(eq(visitorProfile.accountId, accountId))
      .limit(1);
    return row ?? null;
  }

  /**
   * First-login profile completion (Pitfall 11). `usernameAvailability` is
   * advisory only — this insert is the TOCTOU-safe source of truth: a
   * duplicate (case-insensitive) username surfaces as Postgres `23505` from
   * `visitor_profile_username_lower_unq`, caught here and mapped to a clean
   * `conflict` result rather than a thrown 500 (RESEARCH.md Pattern 3).
   */
  async completeProfile(accountId: string, input: CompleteProfileBody): Promise<CompleteProfileResult> {
    try {
      const [row] = await this.db
        .insert(visitorProfile)
        .values({ accountId, ...input })
        .returning({
          accountId: visitorProfile.accountId,
          username: visitorProfile.username,
          displayName: visitorProfile.displayName,
          avatar: visitorProfile.avatar,
          pronoun: visitorProfile.pronoun,
          birthDate: visitorProfile.birthDate,
          gender: visitorProfile.gender,
        });
      if (!row) {
        throw new Error('visitor_profile insert returned no row');
      }
      return { status: 'ok', profile: row };
    } catch (err) {
      // drizzle-orm (postgres.js driver) wraps the driver error in `.cause` —
      // check `error.cause instanceof PostgresError`, never `error` itself.
      const cause = (err as { cause?: unknown }).cause;
      if (cause instanceof PostgresError && cause.code === '23505') {
        return { status: 'conflict' };
      }
      throw err;
    }
  }

  /** Advisory only (Pitfall 11) — `completeProfile`'s DB unique index is authoritative. */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    const rows = await this.db
      .select({ accountId: visitorProfile.accountId })
      .from(visitorProfile)
      .where(sql`lower(${visitorProfile.username}) = lower(${username})`)
      .limit(1);
    return rows.length === 0;
  }

  /**
   * SEC-02: scoped ONLY by the caller's session-derived `visitorId` — never a
   * request param (RESEARCH.md "Cross-tenant denial query shape").
   */
  async listMyFestivals(visitorId: string): Promise<Festival[]> {
    const rows = await this.db
      .select({ festival })
      .from(myFestival)
      .innerJoin(festival, eq(festival.id, myFestival.festivalId))
      .where(eq(myFestival.visitorId, visitorId));

    if (rows.length === 0) return [];

    const festivalIds = rows.map((r) => r.festival.id);
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

    return rows.map(({ festival: f }) => ({
      id: f.id,
      slug: f.slug,
      name: f.name,
      defaultLocale: f.defaultLocale,
      supportedLocales: localesByFestival.get(f.id) ?? [],
      cashlessUrl: f.cashlessUrl,
      startDate: f.startDate,
      endDate: f.endDate,
      place: f.place,
    }));
  }
}
