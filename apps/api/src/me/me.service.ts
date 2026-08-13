import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray, sql } from 'drizzle-orm';
import { PostgresError } from 'postgres';
import { festival, festivalLocale, myFestival, visitorProfile, type Database } from '@quiks/db';
import type { CompleteProfileBody, Festival, Locale, VisitorProfileOwner } from '@quiks/contracts';

import { DB } from '../db/db.module';

type CompleteProfileResult = { status: 'ok'; profile: VisitorProfileOwner } | { status: 'conflict' };

/**
 * The ONE `23505` that means "this username belongs to someone else" (see
 * `visitor-profile.ts`). Every other unique violation on this insert is an
 * accountId/primary-key collision, i.e. "this account already has a profile" —
 * see the catch in `completeProfile` for why that distinction is load-bearing.
 */
const USERNAME_UNIQUE_CONSTRAINT = 'visitor_profile_username_lower_unq';

@Injectable()
export class MeService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Returns null for "no profile yet" (first login, needs complete-profile). */
  async getProfile(accountId: string): Promise<VisitorProfileOwner | null> {
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
   *
   * WR-03 (06-REVIEW.md) — the two unique violations this insert can raise mean
   * OPPOSITE things and must not share an answer. Mapping both to `conflict`
   * made the controller reply "Username already taken" for the accountId PK too,
   * which the mobile client reads as a username conflict and answers with a
   * fresh suggestion. The trap that produced: `handleDone` runs under
   * `withTimeout`, so a request that times out while the server actually
   * COMMITTED leaves the visitor on complete-profile with a network error — and
   * from then on EVERY retry, including one with a provably free username, hits
   * the PK and is told the username is taken. The screen becomes inescapable
   * until an app restart, on a false message. Answering the "profile already
   * exists" case idempotently with the existing profile puts that retry back on
   * the 200 path; the client then calls `refreshAuthState()` and the guard
   * resolves to `authenticated` on its own, with no client change.
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
        if (cause.constraint_name === USERNAME_UNIQUE_CONSTRAINT) {
          return { status: 'conflict' };
        }
        // accountId PK (`visitor_profile_pkey`): this account already has a
        // profile. Discriminated the safe way round — only the KNOWN username
        // index means "taken", so an unnamed or renamed constraint degrades to
        // the existence check below rather than to a false "taken". If no
        // profile is actually readable, the original conflict answer stands.
        const existing = await this.getProfile(accountId);
        if (existing) {
          return { status: 'ok', profile: existing };
        }
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
