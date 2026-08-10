import 'dotenv/config';

import { createDatabase } from '../src/client';
import { festival, festivalLocale } from '../src/schema';

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
  } finally {
    // postgres.js keeps the connection (and the process's event loop) open
    // indefinitely otherwise — a one-shot script must close it explicitly to
    // terminate instead of hanging after the last query resolves.
    await db.$client.end();
  }
}

void seed();
