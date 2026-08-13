/**
 * D-12 (08-CONTEXT) — the crew list is sorted client-side by `displayName`,
 * ascending. Deliberately Lingui-/React-free, same boundary as
 * `profile-meta-line.ts`, so the node-env Vitest runner can import this file
 * directly.
 *
 * THE HERMES RISK, NOT A STYLE NOTE: `Intl.Collator` is NOT guaranteed to
 * exist on Hermes — only `Intl.PluralRules` is polyfilled today
 * (`lib/intl-polyfill.ts`, capability-captured in `lib/intl-capability.ts`).
 * An unchecked `localeCompare`/`Intl.Collator` would silently fall back to a
 * CODE-POINT sort on an affected device, putting `Ärzte` (U+00C4) after
 * `Zoe` (starts with `Z`, U+005A) instead of before `Berta`. This module
 * probes the capability at runtime and defines exactly what happens when it
 * is missing or behaves like a code-point sort.
 */

/** Structurally compatible with `Friend` from `@quiks/contracts`, but with
 * NO import of it — importing the contract would pull a dependency into the
 * node-env test run that this module does not otherwise need. */
export type SortableFriend = {
  profile: {
    displayName: string;
    username: string;
  };
};

/**
 * A fixed, explicit diacritic-folding table. Deliberately NOT
 * `String.prototype.normalize()` and no Unicode property escapes — neither
 * is guaranteed on Hermes, and an unproven assumption of that shape is
 * exactly the class of risk D-12 names. The table only needs to cover the
 * Latin diacritics this app's `displayName`/`username` fields can plausibly
 * carry (German/EU-charset names), not the full Unicode diacritic space.
 */
const FOLD_MAP: Readonly<Record<string, string>> = {
  ä: 'a',
  à: 'a',
  á: 'a',
  â: 'a',
  ã: 'a',
  å: 'a',
  ö: 'o',
  ò: 'o',
  ó: 'o',
  ô: 'o',
  õ: 'o',
  ü: 'u',
  ù: 'u',
  ú: 'u',
  û: 'u',
  é: 'e',
  è: 'e',
  ê: 'e',
  ë: 'e',
  í: 'i',
  ì: 'i',
  î: 'i',
  ï: 'i',
  ñ: 'n',
  ç: 'c',
  ß: 'ss',
};

/**
 * Trims, lowercases, and folds each character through {@link FOLD_MAP}.
 * `foldForSort('Ärzte')` and `foldForSort('AERZTE')` are therefore NOT the
 * same string ('arzte' vs 'aerzte') — this is a fold, not a normalization —
 * but both still start with `'a'`, so `foldForSort('Ärzte')` sorts before
 * `foldForSort('Berta')` under a plain string comparison.
 */
export function foldForSort(value: string): string {
  const lowered = value.trim().toLowerCase();
  let folded = '';
  for (const char of lowered) {
    folded += FOLD_MAP[char] ?? char;
  }
  return folded;
}

function compareFolded(a: string, b: string): number {
  const foldedA = foldForSort(a);
  const foldedB = foldForSort(b);
  if (foldedA < foldedB) return -1;
  if (foldedA > foldedB) return 1;
  return 0;
}

/** Module-local cache — the capability probe below is pure and deterministic
 * for a given engine, so it only needs to run once per process. */
let cachedCollator: Intl.Collator | null | undefined;

/**
 * Capability probe, modeled on `lib/intl-capability.ts`'s
 * "observe before trusting" pattern: constructs an `Intl.Collator` in a
 * `try`/`catch` and verifies it on a fixed probe pair before trusting it.
 *
 * A CODE-POINT sort places `'ä'` (U+00E4) after `'z'` (U+007A) — a working
 * locale-aware collator places it before `'z'` — so `compare('ä', 'z') < 0`
 * is exactly the signal that distinguishes a real collator from a silent
 * code-point fallback wearing the `Intl.Collator` interface.
 *
 * @returns `null` when `Intl.Collator` is absent, constructing it throws, or
 * the probe pair proves it sorts by code point — never a broken collator.
 */
export function resolveCollator(): Intl.Collator | null {
  if (cachedCollator !== undefined) return cachedCollator;

  if (typeof Intl === 'undefined' || typeof Intl.Collator !== 'function') {
    cachedCollator = null;
    return cachedCollator;
  }

  try {
    const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
    cachedCollator = collator.compare('ä', 'z') < 0 ? collator : null;
  } catch {
    cachedCollator = null;
  }

  return cachedCollator;
}

/**
 * Builds a comparator over {@link SortableFriend} that sorts by
 * `displayName` — through `collator.compare` when available, through
 * {@link foldForSort} otherwise — and ALWAYS resolves a tie via `username`.
 *
 * The tiebreak is not cosmetic: `username` is unique (contract-enforced), so
 * it makes the resulting order total and independent of whether the runtime
 * `Array.prototype.sort` happens to be stable. Two friends sharing a
 * `displayName` therefore land in the same relative order regardless of
 * their position in the input array.
 */
export function createDisplayNameComparator(
  collator: Intl.Collator | null,
): (a: SortableFriend, b: SortableFriend) => number {
  return (a, b) => {
    const primary = collator
      ? collator.compare(a.profile.displayName, b.profile.displayName)
      : compareFolded(a.profile.displayName, b.profile.displayName);
    if (primary !== 0) return primary;
    // Usernames are ASCII-restricted by contract (`3–20 characters: a-z 0-9
    // _ .`), so a plain string comparison is already correct and total.
    if (a.profile.username < b.profile.username) return -1;
    if (a.profile.username > b.profile.username) return 1;
    return 0;
  };
}

/**
 * Sorts a copy of `friends` by `displayName` ascending (D-12), resolving the
 * collator capability once and delegating to {@link createDisplayNameComparator}.
 * The input array is never mutated — `[...friends]` is sorted, not `friends`
 * itself — and an empty or single-element input passes through unchanged.
 */
export function sortFriendsByDisplayName<T extends SortableFriend>(friends: readonly T[]): T[] {
  const collator = resolveCollator();
  const comparator = createDisplayNameComparator(collator);
  return [...friends].sort(comparator);
}
