import 'dotenv/config';

import { sql } from 'drizzle-orm';

import { createDatabase } from '../src/client';
import {
  activityTag,
  activityTagTranslation,
  festival,
  festivalLocale,
} from '../src/schema';

/**
 * Idempotent dev/staging seed (D-03): plants the user-defined festivals below.
 * Re-runnable as a no-op/refresh — `onConflictDoUpdate` keyed on
 * `festival.slug`'s existing `unique()` constraint, then `onConflictDoNothing`
 * for the locale rows (composite PK). Prefers the DIRECT (unpooled) Neon URL
 * per ADR-005 (mirrors `drizzle.config.ts`'s convention for out-of-request-cycle
 * scripts).
 *
 * A second festival (`nova-sound-2026`) exists so device UAT can exercise
 * multi-festival flows (e.g. deep-link precedence over a persisted
 * active-festival slug, 05-UAT test 7) that need two distinct slugs.
 */
const SEED_FESTIVALS = [
  {
    slug: 'frequency-2026',
    name: 'Frequency 2026',
    defaultLocale: 'de' as const,
    startDate: '2026-08-13',
    endDate: '2026-08-16',
    place: 'Wiesen, Burgenland',
  },
  {
    slug: 'nova-sound-2026',
    name: 'Nova Sound 2026',
    defaultLocale: 'de' as const,
    startDate: '2026-07-03',
    endDate: '2026-07-05',
    place: 'Graz, Steiermark',
  },
];

/**
 * The ~10 global start tags (D-06), `festivalId: null` — every festival sees
 * them by default (D-05, no `festival_activity_tag` row needed = enabled).
 * DE is every festival's most common `defaultLocale` today, EN backs the
 * fallback chain for an English-default festival. Content, not fixture — the
 * user reviews this exact list in the plan and can amend it here.
 */
const SEED_ACTIVITY_TAGS = [
  { slug: 'pre-drink', de: 'Vorglühen', en: 'Pre-Drinks' },
  { slug: 'camp-hangout', de: 'Camp-Hängen', en: 'Camp Hangout' },
  { slug: 'stage-meetup', de: 'Bühnen-Treffpunkt', en: 'Stage Meetup' },
  { slug: 'food-run', de: 'Essen holen', en: 'Food Run' },
  { slug: 'morning-coffee', de: 'Morgenkaffee', en: 'Morning Coffee' },
  { slug: 'shower-run', de: 'Duschen gehen', en: 'Shower Run' },
  { slug: 'workshop', de: 'Workshop', en: 'Workshop' },
  { slug: 'sports-games', de: 'Sport & Spiele', en: 'Sports & Games' },
  { slug: 'chill-recharge', de: 'Chillen & Aufladen', en: 'Chill & Recharge' },
  { slug: 'afterparty', de: 'Afterparty', en: 'Afterparty' },
] as const;

async function seed() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be set to run the seed script');
  }
  const db = createDatabase(connectionString);

  try {
    for (const values of SEED_FESTIVALS) {
      const [fest] = await db
        .insert(festival)
        .values(values)
        .onConflictDoUpdate({
          target: festival.slug,
          set: {
            name: values.name,
            defaultLocale: values.defaultLocale,
            startDate: values.startDate,
            endDate: values.endDate,
            place: values.place,
          },
        })
        .returning();
      if (!fest) {
        throw new Error(`festival upsert returned no row for ${values.slug}`);
      }

      await db
        .insert(festivalLocale)
        .values([
          { festivalId: fest.id, locale: 'de' },
          { festivalId: fest.id, locale: 'en' },
        ])
        .onConflictDoNothing();

      console.log(`Seeded festival: ${fest.slug} (${fest.id})`);
    }

    for (const values of SEED_ACTIVITY_TAGS) {
      // Upsert against the partial unique index `activity_tag_global_slug_unq`
      // (slug WHERE festival_id IS NULL) — `targetWhere` pins the conflict
      // target to that partial index, not a plain slug-only constraint (which
      // doesn't exist). The `set` is a harmless no-op touch so re-running the
      // seed refreshes `updatedAt` instead of erroring on an empty SET.
      const [row] = await db
        .insert(activityTag)
        .values({ festivalId: null, slug: values.slug })
        .onConflictDoUpdate({
          target: activityTag.slug,
          targetWhere: sql`${activityTag.festivalId} is null`,
          set: { updatedAt: sql`now()` },
        })
        .returning();
      if (!row) {
        throw new Error(`activity_tag upsert returned no row for ${values.slug}`);
      }

      await db
        .insert(activityTagTranslation)
        .values([
          { tagId: row.id, locale: 'de', title: values.de },
          { tagId: row.id, locale: 'en', title: values.en },
        ])
        .onConflictDoNothing();

      console.log(`Seeded activity tag: ${values.slug} (${row.id})`);
    }
  } finally {
    // postgres.js keeps the connection (and the process's event loop) open
    // indefinitely otherwise — a one-shot script must close it explicitly to
    // terminate instead of hanging after the last query resolves.
    await db.$client.end();
  }
}

void seed();
