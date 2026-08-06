import 'dotenv/config';

import { createDatabase } from '../src/client';
import { festival, festivalLocale } from '../src/schema';

/**
 * Idempotent dev/staging seed (D-03): plants the single user-defined festival
 * `frequency-2026`. Re-runnable as a no-op/refresh — `onConflictDoUpdate`
 * keyed on `festival.slug`'s existing `unique()` constraint, then
 * `onConflictDoNothing` for the locale rows (composite PK). Prefers the
 * DIRECT (unpooled) Neon URL per ADR-005 (mirrors `drizzle.config.ts`'s
 * convention for out-of-request-cycle scripts).
 */
async function seed() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL must be set to run the seed script');
  }
  const db = createDatabase(connectionString);

  try {
    const [fest] = await db
      .insert(festival)
      .values({
        slug: 'frequency-2026',
        name: 'Frequency 2026',
        defaultLocale: 'de',
        startDate: '2026-08-13',
        endDate: '2026-08-16',
        place: 'Wiesen, Burgenland',
      })
      .onConflictDoUpdate({
        target: festival.slug,
        set: {
          name: 'Frequency 2026',
          defaultLocale: 'de',
          startDate: '2026-08-13',
          endDate: '2026-08-16',
          place: 'Wiesen, Burgenland',
        },
      })
      .returning();
    if (!fest) {
      throw new Error('festival upsert returned no row');
    }

    await db
      .insert(festivalLocale)
      .values([
        { festivalId: fest.id, locale: 'de' },
        { festivalId: fest.id, locale: 'en' },
      ])
      .onConflictDoNothing();

    console.log(`Seeded festival: ${fest.slug} (${fest.id})`);
  } finally {
    // postgres.js keeps the connection (and the process's event loop) open
    // indefinitely otherwise — a one-shot script must close it explicitly to
    // terminate instead of hanging after the last query resolves.
    await db.$client.end();
  }
}

void seed();
