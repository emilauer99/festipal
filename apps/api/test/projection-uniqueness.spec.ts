import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { contract, visitorProfileForeignSchema } from '@quiks/contracts';

/**
 * VIS-02 as an UNIQUENESS statement, not a correctness statement.
 *
 * The four path specs (`foreign-projection`, `username-search`, `friend-lists`)
 * each prove that THEIR path projects correctly. None of them can prove there is
 * no FIFTH path — and "there is no second code path" is literally what VIS-02
 * asks for. This spec is the missing half. It needs neither a database nor HTTP:
 * it walks the whole published contract and reads the module directory as source
 * text, so it runs in milliseconds and goes red the moment a LATER phase adds a
 * route or a second column list that could carry owner fields outside.
 *
 * ## Why this spec asserts invariants and not grep counts
 *
 * Plans 07-02, 07-03 and 07-04 each shipped an acceptance criterion that counted
 * raw call sites (`inArray(friendship.`, `db.transaction`,
 * `count(from(visitorProfile)) === count(foreignProfileColumns)`), and all three
 * contradicted their own action text or the code's deliberate design — the
 * existence check in `sendRequest` selects ONLY `accountId` precisely because
 * that endpoint must not read profile data (T-07-15), so it is legitimately not
 * a foreign-view select and must not be counted as one. A test that goes red
 * when somebody adds a legitimate non-projection select is a test that gets
 * deleted, not a test that protects VIS-02.
 *
 * What is asserted here instead is the property those counts were reaching for:
 *
 * 1. There is exactly ONE exported foreign select map and exactly ONE exported
 *    shaping function (`foreignProfileColumns` / `pickForeignProfile`).
 * 2. The four IDENTITY columns of the foreign view — `displayName`, `avatar`,
 *    `pronoun`, `gender` — are named together in exactly one file of the module.
 *    Any real second projection has to carry that payload, whether it spells out
 *    a select map or re-lists the fields off a result row; a legitimate
 *    non-projection select (existence check by `accountId`, a `where`/`orderBy`
 *    on `username`) names none of them. The trip threshold is TWO distinct
 *    identity columns in one file, so a single incidental reference — a sort key,
 *    say — stays legal while a payload cannot.
 * 3. The birth date is not readable from this module at all.
 * 4. The contract exposes the birth-date key only on the two owner responses and
 *    the e-mail key only on `getMe` — checked by iterating ALL route keys against
 *    an exception list, never a positive list of "the foreign routes", because a
 *    positive list would silently ignore a NEW route (T-07-23).
 * 5. No route path describes a 1:1 message channel (ADR-020, permanent
 *    exclusion). Phase 12's success criterion 1 asks for exactly this endpoint
 *    inventory assertion rather than a visual check; it starts here.
 *
 * Each mechanical check carries a positive counter-assertion next to it (the
 * walker DOES find `birthDate` on `getMe`; the identity columns ARE named in
 * `visitor-projection.ts`), so a walker that silently stopped finding anything
 * would fail rather than turn the whole file vacuously green.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECTION_MODULE_DIR = join(__dirname, '..', 'src', 'friendship');
const PROJECTION_FILE = 'visitor-projection.ts';

/** D-02: the published foreign view, sorted. The one list this spec pins. */
const FOREIGN_VIEW_KEYS = [
  'accountId',
  'avatar',
  'displayName',
  'gender',
  'pronoun',
  'username',
].sort();

/**
 * The payload half of the foreign view. `accountId` and `username` are excluded
 * on purpose: both are legitimately referenced by code that is NOT a projection
 * (existence checks, `where` clauses, `orderBy`), so counting them would punish
 * correct code. These four have no such second use.
 */
const IDENTITY_COLUMNS = ['displayName', 'avatar', 'pronoun', 'gender'];

const BIRTH_DATE_KEY = 'birthDate';
const EMAIL_KEY = 'email';
/** The only two responses that may carry the owner's birth date. */
const BIRTH_DATE_ROUTES = ['getMe', 'completeProfile'];
/** The only response that may carry the account's e-mail. */
const EMAIL_ROUTES = ['getMe'];

/**
 * The direct-message vocabulary, matched against whole path SEGMENTS (a
 * substring match would flag `/admin` for containing "dm"). ADR-020 excludes a
 * 1:1 channel permanently — a friendship does not imply one.
 */
const DIRECT_MESSAGE_SEGMENTS = [
  'message',
  'messages',
  'chat',
  'chats',
  'dm',
  'dms',
  'conversation',
  'conversations',
  'inbox',
  'thread',
  'threads',
  'mailbox',
  'pm',
];

// ---------------------------------------------------------------------------
// Zod 3.25 introspection
// ---------------------------------------------------------------------------

type ZodDef = {
  typeName?: string;
  type?: unknown;
  innerType?: unknown;
  options?: unknown;
};

function defOf(schema: unknown): ZodDef | null {
  if (!schema || typeof schema !== 'object') return null;
  const def = (schema as { _def?: unknown })._def;
  return def && typeof def === 'object' ? (def as ZodDef) : null;
}

function shapeOf(schema: unknown): Record<string, unknown> | null {
  if (defOf(schema)?.typeName !== 'ZodObject') return null;
  const shape = (schema as { shape?: unknown }).shape;
  return shape && typeof shape === 'object' ? (shape as Record<string, unknown>) : null;
}

/** Strips the container types off a schema until an addressable one is left. */
function unwrap(schema: unknown): unknown {
  let current: unknown = schema;
  for (let depth = 0; depth < 10; depth += 1) {
    const def = defOf(current);
    if (def?.typeName === 'ZodArray') current = def.type;
    else if (def?.typeName === 'ZodNullable' || def?.typeName === 'ZodOptional')
      current = def.innerType;
    else return current;
  }
  return current;
}

/**
 * Every object key name reachable from a schema, at any nesting depth. Handles
 * ZodObject/ZodArray/ZodNullable/ZodOptional/ZodUnion and yields nothing for
 * anything else; the visited set keeps a self-referential contract from hanging
 * the run.
 */
function collectKeys(schema: unknown, seen: Set<unknown> = new Set()): Set<string> {
  const keys = new Set<string>();
  if (!schema || typeof schema !== 'object' || seen.has(schema)) return keys;
  seen.add(schema);

  const def = defOf(schema);
  if (!def) return keys;

  const descend = (child: unknown): void => {
    for (const nested of collectKeys(child, seen)) keys.add(nested);
  };

  switch (def.typeName) {
    case 'ZodObject': {
      const shape = shapeOf(schema);
      if (shape) {
        for (const [key, child] of Object.entries(shape)) {
          keys.add(key);
          descend(child);
        }
      }
      break;
    }
    case 'ZodArray':
      descend(def.type);
      break;
    case 'ZodNullable':
    case 'ZodOptional':
      descend(def.innerType);
      break;
    case 'ZodUnion':
      if (Array.isArray(def.options)) for (const option of def.options) descend(option);
      break;
    default:
      break;
  }

  return keys;
}

// ---------------------------------------------------------------------------
// Contract walk — ALL routes, exception list, never a positive list
// ---------------------------------------------------------------------------

type RouteLike = { method?: unknown; path?: unknown; responses?: Record<string, unknown> };

function isRoute(entry: [string, RouteLike]): entry is [string, RouteLike & { path: string }] {
  return typeof entry[1]?.path === 'string' && typeof entry[1]?.responses === 'object';
}

// ALL route keys, with an exception list applied further down — never a
// positive list of "the foreign routes", which would ignore a new one.
const routes = (Object.entries(contract) as unknown as Array<[string, RouteLike]>).filter(isRoute);

/** Route key -> every key name any of its responses can put on the wire. */
const keysByRoute = new Map<string, Set<string>>(
  routes.map(([key, route]) => {
    const keys = new Set<string>();
    for (const response of Object.values(route.responses ?? {})) {
      for (const name of collectKeys(response)) keys.add(name);
    }
    return [key, keys];
  }),
);

function responseOf(routeKey: string): unknown {
  const route = routes.find(([key]) => key === routeKey);
  if (!route) throw new Error(`contract has no route \`${routeKey}\``);
  return (route[1].responses ?? {})[200];
}

/** The embedded `profile` object's key names, sorted. */
function embeddedProfileKeys(schema: unknown): string[] {
  const shape = shapeOf(unwrap(schema));
  if (!shape) throw new Error('expected an object schema (or an array/nullable wrapping one)');
  const profileShape = shapeOf(unwrap(shape.profile));
  if (!profileShape) throw new Error('expected an embedded `profile` object schema');
  return Object.keys(profileShape).sort();
}

function requestListField(field: 'incoming' | 'outgoing'): unknown {
  const shape = shapeOf(unwrap(responseOf('listFriendRequests')));
  if (!shape) throw new Error('listFriendRequests 200 is not an object schema');
  return shape[field];
}

// ---------------------------------------------------------------------------
// Source reading
// ---------------------------------------------------------------------------

/**
 * Drops comment lines before any counting. Without this, an explanatory comment
 * that merely NAMES a token flips a source check — a false red when a comment
 * mentions `birthDate`, and (worse) a false green when a commented-out hit is
 * counted as a real one. 07-01, 07-02 and 07-03 each hit one of the two.
 */
function stripComments(source: string): string {
  return source
    .split('\n')
    .filter((line) => {
      const trimmed = line.trimStart();
      return !(trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*'));
    })
    .join('\n');
}

async function readModuleSources(): Promise<Map<string, string>> {
  const entries = await readdir(PROJECTION_MODULE_DIR, { withFileTypes: true });
  const sources = new Map<string, string>();
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
    sources.set(entry.name, stripComments(await readFile(join(PROJECTION_MODULE_DIR, entry.name), 'utf8')));
  }
  return sources;
}

function occurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe('VIS-02: the foreign projection exists exactly once (contract + source)', () => {
  describe('contract walk over ALL routes', () => {
    it('finds routes at all, and the walker really reaches nested keys', () => {
      // Non-vacuum guard for everything below: if `contract` stopped being
      // walkable, or `collectKeys` stopped descending, the absence assertions
      // would all pass for the wrong reason.
      expect(routes.length).toBeGreaterThanOrEqual(18);
      expect(keysByRoute.get('getMe')).toContain(BIRTH_DATE_KEY);
      expect(keysByRoute.get('getMe')).toContain(EMAIL_KEY);
      expect(keysByRoute.get('completeProfile')).toContain(BIRTH_DATE_KEY);
      // `birthDate` sits one level DOWN (`meSchema.profile` is nullable), so
      // finding it also proves the ZodNullable/ZodObject descent works.
      expect(keysByRoute.get('lookupVisitor')?.size).toBeGreaterThan(0);
    });

    it('exposes the birth-date key ONLY on getMe and completeProfile', () => {
      const offenders = [...keysByRoute.entries()]
        .filter(([key, names]) => !BIRTH_DATE_ROUTES.includes(key) && names.has(BIRTH_DATE_KEY))
        .map(([key]) => key);
      expect(offenders).toEqual([]);
    });

    it('exposes the e-mail key ONLY on getMe', () => {
      const offenders = [...keysByRoute.entries()]
        .filter(([key, names]) => !EMAIL_ROUTES.includes(key) && names.has(EMAIL_KEY))
        .map(([key]) => key);
      expect(offenders).toEqual([]);
    });

    it('declares no route path that describes a 1:1 message channel (ADR-020)', () => {
      const offenders = routes
        .filter(([, route]) =>
          String(route.path)
            .split('/')
            .flatMap((segment) => segment.split(/[-_.]/))
            .some((token) => DIRECT_MESSAGE_SEGMENTS.includes(token.toLowerCase())),
        )
        .map(([key, route]) => `${key} ${String(route.path)}`);
      expect(offenders).toEqual([]);
    });
  });

  describe('the foreign view is pinned to exactly six fields', () => {
    it('visitorProfileForeignSchema carries exactly the six D-02 keys', () => {
      // Equality, never a subset: a column added to `visitor_profile` can only
      // become public by changing THIS line, in a diff somebody has to read.
      expect(Object.keys(visitorProfileForeignSchema.shape).sort()).toEqual([
        ...FOREIGN_VIEW_KEYS,
      ]);
    });

    it.each([
      ['lookupVisitor', () => responseOf('lookupVisitor')],
      ['searchVisitors', () => responseOf('searchVisitors')],
      ['listFriends', () => responseOf('listFriends')],
      ['listFriendRequests.incoming', () => requestListField('incoming')],
      ['listFriendRequests.outgoing', () => requestListField('outgoing')],
    ])('%s embeds a profile with exactly the same six keys', (_label, resolve) => {
      expect(embeddedProfileKeys(resolve())).toEqual([...FOREIGN_VIEW_KEYS]);
    });
  });

  describe('source singularity under apps/api/src/friendship/', () => {
    it('declares the select map and the shaping function exactly once each', async () => {
      const sources = await readModuleSources();
      expect(sources.size).toBeGreaterThanOrEqual(4);

      const joined = [...sources.values()].join('\n');
      expect(occurrences(joined, 'export const foreignProfileColumns')).toBe(1);
      expect(occurrences(joined, 'export function pickForeignProfile')).toBe(1);
    });

    it('names the four identity columns in visitor-projection.ts and nowhere else', async () => {
      const sources = await readModuleSources();

      // Non-vacuum guard: the projection file must name all four, otherwise the
      // "nowhere else" assertion below is measuring nothing.
      const projection = sources.get(PROJECTION_FILE) ?? '';
      for (const column of IDENTITY_COLUMNS) expect(projection).toContain(column);

      // Anywhere else, two or more of them together IS a second projection —
      // whether it is a hand-written select map or a result row re-listed into a
      // `profile` object. One incidental reference (a sort key, a filter) stays
      // legal; the payload cannot be assembled twice.
      const offenders = [...sources.entries()]
        .filter(([name]) => name !== PROJECTION_FILE)
        .map(([name, source]) => ({
          name,
          columns: IDENTITY_COLUMNS.filter((column) => source.includes(column)),
        }))
        .filter((file) => file.columns.length >= 2)
        .map((file) => `${file.name}: ${file.columns.join(', ')}`);
      expect(offenders).toEqual([]);
    });

    it('never reads the birth date — in any file of the module', async () => {
      const sources = await readModuleSources();
      const offenders = [...sources.entries()]
        .filter(([, source]) => source.includes('birthDate') || source.includes('birth_date'))
        .map(([name]) => name);
      expect(offenders).toEqual([]);
    });
  });
});
