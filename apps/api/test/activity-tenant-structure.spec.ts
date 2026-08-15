import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { contract } from '@quiks/contracts';
import type { Database } from '@quiks/db';

import { createTestDatabase } from './setup';

/**
 * The SEC-03 STRUCTURAL half (10-05-PLAN.md Task 2) — no HTTP, no fixtures.
 * Built on the same doctrine as `projection-uniqueness.spec.ts`: EXCEPTION
 * lists instead of POSITIVE lists (so a table or route added by a LATER
 * phase cannot silently slip past it), and a non-vacuum guard next to every
 * mechanical check.
 *
 * **Part 1** proves the tenant column and the composite FK exist on the
 * LIVE database, not merely in the schema source — a migration that was
 * never applied, or a constraint renamed by hand, would pass a source-only
 * check and fail this one.
 *
 * **Part 2** walks the published contract for every activity-shaped route
 * and asserts none of them accepts the caller/tenant identity from `body` or
 * `query` (ARCHITECTURE.md §Anti-Patterns "Client-Supplied Scope") — the
 * exact same posture `projection-uniqueness.spec.ts` enforces for the
 * friendship module, extended here to Phase 10's surface.
 */

const TENANT_TABLES = [
  'activity',
  'activity_participant',
  'activity_tag',
  'activity_tag_translation',
  'festival_activity_tag',
] as const;

/**
 * Tables that carry `festival_id` but with a NAMED, JUSTIFIED deviation from
 * "NOT NULL" — never a silent gap. `activity_tag_translation` carries no
 * `festival_id` at all (it is a translation companion keyed by `tag_id`, the
 * same pattern `festival_locale` uses) and is asserted separately below.
 */
const NULLABLE_FESTIVAL_ID_TABLES = ['activity_tag'] as const;

describe('activity tenant structure (SEC-03 structural proof)', () => {
  let db: Database;

  beforeAll(() => {
    db = createTestDatabase();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  describe('Part 1: tenant column per table + composite FK (information_schema)', () => {
    it('all five Phase-10 tables exist on the live database (non-vacuum guard)', async () => {
      const rows = (await db.execute(
        sql`select table_name from information_schema.tables
            where table_schema = 'public'
              and table_name in (${sql.join(
                TENANT_TABLES.map((name) => sql`${name}`),
                sql`, `,
              )})`,
      )) as unknown as Array<{ table_name: string }>;

      // If a table were renamed or dropped, this would come back short of 5
      // and the equality below fails LOUD instead of the rest of this file
      // silently checking nothing for it.
      expect(rows.map((r) => r.table_name).sort()).toEqual([...TENANT_TABLES].sort());
    });

    it('every table but the one named exception carries a NOT NULL festival_id; activity_tag is explicitly nullable', async () => {
      const rows = (await db.execute(
        sql`select table_name, is_nullable from information_schema.columns
            where table_schema = 'public'
              and column_name = 'festival_id'
              and table_name in (${sql.join(
                TENANT_TABLES.map((name) => sql`${name}`),
                sql`, `,
              )})`,
      )) as unknown as Array<{ table_name: string; is_nullable: 'YES' | 'NO' }>;

      const nullableByTable = new Map(rows.map((r) => [r.table_name, r.is_nullable]));

      // Non-vacuum guard: a `festival_id` column really was found for every
      // table that is supposed to carry one — all four except
      // `activity_tag_translation`, which is asserted column-less below.
      const tablesWithFestivalId = TENANT_TABLES.filter((t) => t !== 'activity_tag_translation');
      expect(nullableByTable.size).toBe(tablesWithFestivalId.length);

      for (const table of TENANT_TABLES) {
        if (table === 'activity_tag_translation') continue; // asserted separately below
        const expected = NULLABLE_FESTIVAL_ID_TABLES.includes(
          table as (typeof NULLABLE_FESTIVAL_ID_TABLES)[number],
        )
          ? 'YES'
          : 'NO';
        expect(nullableByTable.get(table)).toBe(expected);
      }
    });

    it('activity_tag_translation carries NO festival_id column and hangs off activity_tag via a foreign key instead', async () => {
      const columnRows = (await db.execute(
        sql`select column_name from information_schema.columns
            where table_schema = 'public' and table_name = 'activity_tag_translation'`,
      )) as unknown as Array<{ column_name: string }>;
      // Non-vacuum guard: the table really was found and has columns at all.
      expect(columnRows.length).toBeGreaterThan(0);
      expect(columnRows.map((r) => r.column_name)).not.toContain('festival_id');

      const fkRows = (await db.execute(
        sql`select kcu.column_name, ccu.table_name as foreign_table, ccu.column_name as foreign_column
            from information_schema.table_constraints tc
            join information_schema.key_column_usage kcu
              on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
            join information_schema.constraint_column_usage ccu
              on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
            where tc.constraint_type = 'FOREIGN KEY' and tc.table_name = 'activity_tag_translation'`,
      )) as unknown as Array<{ column_name: string; foreign_table: string; foreign_column: string }>;

      const tagIdFk = fkRows.find((r) => r.column_name === 'tag_id');
      expect(tagIdFk?.foreign_table).toBe('activity_tag');
      expect(tagIdFk?.foreign_column).toBe('id');
    });

    it('activity_participant_activity_fk is a REAL foreign key on the live database, bound to exactly (activity_id, festival_id)', async () => {
      const rows = (await db.execute(
        sql`select kcu.column_name
            from information_schema.table_constraints tc
            join information_schema.key_column_usage kcu
              on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
            where tc.constraint_type = 'FOREIGN KEY'
              and tc.table_name = 'activity_participant'
              and tc.constraint_name = 'activity_participant_activity_fk'`,
      )) as unknown as Array<{ column_name: string }>;

      // Equality, not a subset check: exactly two columns, no more, no fewer
      // — a constraint that lost or gained a column shows up here.
      expect(rows.map((r) => r.column_name).sort()).toEqual(['activity_id', 'festival_id']);
    });
  });

  describe('Part 2: no route reads its caller/tenant identity from body or query (contract walk)', () => {
    // The three path segments that mark a route as "activity-shaped". Matched
    // as whole SEGMENTS (path.split('/')), never a substring — a substring
    // match would also flag an unrelated route that merely contains
    // "activities" inside a longer segment.
    const ACTIVITY_PATH_SEGMENTS = ['activities', 'my-activities', 'activity-tags'];

    // Never a positive list of caller-identity keys already known to be
    // absent — this is the FORBIDDEN set; a route naming ANY of these in its
    // body/query is the violation, regardless of which key it happens to be.
    const FORBIDDEN_SCOPE_KEYS = [
      'visitorId',
      'creatorId',
      'callerId',
      'accountId',
      'userId',
      'participantId',
      'festivalId',
      'activityId',
      'sessionId',
    ];

    type ZodDef = { typeName?: string; schema?: unknown; innerType?: unknown };

    /**
     * Minimal local `_def`-introspection pair, adapted from
     * `projection-uniqueness.spec.ts` (`defOf`/`shapeOf`) — not copy-pasted in
     * full, since this walk only needs top-level object keys, not recursive
     * descent. `ZodEffects` (the `.refine()` wrapper on
     * `createActivityBodySchema`) is unwrapped here in addition to
     * `ZodOptional`/`ZodNullable`, which the original does not need.
     */
    function defOf(schema: unknown): ZodDef | null {
      if (!schema || typeof schema !== 'object') return null;
      const def = (schema as { _def?: unknown })._def;
      return def && typeof def === 'object' ? (def as ZodDef) : null;
    }

    function topLevelKeysOf(schema: unknown): string[] {
      let current = schema;
      for (let depth = 0; depth < 10; depth += 1) {
        const def = defOf(current);
        if (!def) return [];
        if (def.typeName === 'ZodObject') {
          const shape = (current as { shape?: unknown }).shape;
          return shape && typeof shape === 'object' ? Object.keys(shape) : [];
        }
        if (def.typeName === 'ZodEffects') {
          current = def.schema;
          continue;
        }
        if (def.typeName === 'ZodOptional' || def.typeName === 'ZodNullable') {
          current = def.innerType;
          continue;
        }
        return [];
      }
      return [];
    }

    type RouteLike = { method?: unknown; path?: unknown; body?: unknown; query?: unknown };

    function isRoute(entry: [string, RouteLike]): entry is [string, RouteLike & { path: string }] {
      return typeof entry[1]?.path === 'string';
    }

    const allRoutes = (Object.entries(contract) as unknown as Array<[string, RouteLike]>).filter(isRoute);

    const activityRoutes = allRoutes.filter(([, route]) =>
      String(route.path)
        .split('/')
        .some((segment) => ACTIVITY_PATH_SEGMENTS.includes(segment)),
    );

    it('finds at least 7 activity-shaped routes in the contract (non-vacuum guard)', () => {
      expect(activityRoutes.length).toBeGreaterThanOrEqual(7);
    });

    it('none of them declares a caller/tenant identity key in body or query', () => {
      const offenders = activityRoutes.flatMap(([key, route]) => {
        const keys = [...topLevelKeysOf(route.body), ...topLevelKeysOf(route.query)];
        const hits = keys.filter((k) => FORBIDDEN_SCOPE_KEYS.includes(k));
        return hits.map((hit) => `${key}: ${hit}`);
      });
      expect(offenders).toEqual([]);
    });
  });
});
