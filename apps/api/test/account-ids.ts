import { randomBytes } from 'node:crypto';

/**
 * Account-id fixtures that model the PRODUCTION form of a better-auth id.
 *
 * WR-04 (07-REVIEW.md): every service-level fixture in this suite used to build
 * its account ids from `randomUUID()` — lowercase hex, always. Real better-auth
 * ids are 32 characters of MIXED-CASE alphanumerics
 * (`ku267hYT7NJiQa2VsfzIyXpsntAKUuik`, `fadX0Ft26ROwyScnQhGPYJDINoU30aCK`), and
 * that difference is not cosmetic: `canonicalPair` orders a pair in JavaScript
 * (UTF-16 code units, so `'B' < 'a'`), while the `lower_id < higher_id` CHECK
 * on `friendship`/`friend_request` compares under the DATABASE collation (the
 * local dev Postgres runs `en_US.utf8`, where `'B' < 'a'` is false). The two
 * orders can only disagree once an id carries an uppercase letter — so a suite
 * built entirely from lowercase ids could never reach the divergence, and
 * CR-01 stayed green through a whole phase because of it.
 *
 * Everything here is therefore load-bearing, not decoration.
 */

/** better-auth's id alphabet: A-Z, a-z, 0-9. */
const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * A random mixed-case alphanumeric stem. Positions 0 and 1 are forced to one
 * uppercase and one lowercase character so the "mixed case" property is
 * guaranteed rather than probable — a fixture that silently degenerates into an
 * all-lowercase id would be exactly the blind spot WR-04 describes.
 */
export function mixedCaseStem(length = 24): string {
  const bytes = randomBytes(length);
  const chars = Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length] as string);
  chars[0] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[bytes[0]! % 26] as string;
  chars[1] = 'abcdefghijklmnopqrstuvwxyz'[bytes[1]! % 26] as string;
  return chars.join('');
}

/**
 * A throwaway account id in the production SHAPE (mixed case) with a readable
 * prefix kept in front, so leftover rows stay identifiable by `like 'test-%'`
 * the way every existing fixture is.
 */
export function testAccountId(prefix: string): string {
  return `${prefix}-${mixedCaseStem()}`;
}

/**
 * The regression fixture for CR-01: two account ids whose canonical order is
 * DIFFERENT in JavaScript than under a locale collation such as `en_US.utf8`.
 *
 * The two ids are identical except for their first character — `B` versus `a`:
 *
 * - JavaScript compares UTF-16 code units, so `'B'` (0x42) sorts BEFORE `'a'`
 *   (0x61) and `canonicalPair` puts the `B…` id into `lowerId`.
 * - `en_US.utf8` compares alphabetically and case-insensitively at the primary
 *   level, so `'B…'` sorts AFTER `'a…'` and a `lower_id < higher_id` CHECK
 *   evaluated under that collation REJECTS the very pair JavaScript produced
 *   (SQLSTATE 23514).
 *
 * Returned in JavaScript order: `[jsLower, jsHigher]`. On a database whose
 * default collation IS byte order (`C` / `C.UTF-8`, e.g. Neon) the two orders
 * agree and this pair is simply a harmless fixture — which is the point of
 * pinning the CHECK to `COLLATE "C"` instead of hoping the environment matches.
 */
export function collationConflictingAccountIds(prefix: string): [string, string] {
  const stem = `-${prefix}-${mixedCaseStem(20)}`;
  return [`B${stem}`, `a${stem}`];
}
