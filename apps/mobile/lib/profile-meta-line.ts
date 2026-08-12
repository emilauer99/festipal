/**
 * D-04 + D-12 — the two joined lines under the profile avatar:
 *
 * ```
 * sie/ihr · 23 · weiblich          ← identity line, OMITTED when all empty
 * 3 Festivals · 0 Friends · seit 2025 dabei   ← meta line
 * ```
 *
 * Deliberately Lingui-FREE. The localized pieces ("3 Festivals" via a plural
 * macro, "seit 2025 dabei") are produced by the screen; this module only
 * decides what gets joined and what gets left out. That split is what keeps
 * the joining rule under `lib/`, where the node-env Vitest runner can prove it
 * — a `@lingui/macro` import here would make the module unimportable there.
 *
 * "Friends" stays the untranslated brand word from the design in both
 * languages; its pluralisation still runs through Lingui in the caller,
 * because 0 is a real plural category.
 */

/** The separator the design uses between every meta/identity fragment. */
const SEPARATOR = ' · ';

/**
 * Joins the non-empty fragments and nothing else — the omit-if-empty rule
 * `FestivalCard.tsx` already applies to its optional `place`, so a line can
 * never carry a dangling separator or a placeholder dash.
 */
function joinFragments(fragments: readonly (string | null | undefined)[]): string {
  return fragments
    .map((fragment) => fragment?.trim() ?? '')
    .filter((fragment) => fragment.length > 0)
    .join(SEPARATOR);
}

/** The three optional identity fields (D-12), all nullable by contract. */
export type IdentityLineInput = {
  pronoun?: string | null;
  /** Already DERIVED via `deriveAge` — never a stored value (D-12a). */
  age?: number | null;
  gender?: string | null;
};

/**
 * Builds `sie/ihr · 23 · weiblich` from whichever of the three optional fields
 * are set, in that fixed order.
 *
 * @returns the joined line, or `null` when all three are empty — `null`, not
 * `''`, so the caller can drop the element entirely instead of rendering an
 * empty line that still reserves height (UI-SPEC row 144).
 */
export function buildIdentityLine({ pronoun, age, gender }: IdentityLineInput): string | null {
  // `age` is compared against null/undefined explicitly: a truthiness check
  // would silently swallow a legitimate age of 0.
  const ageFragment = age === null || age === undefined ? null : String(age);
  const line = joinFragments([pronoun, ageFragment, gender]);
  return line.length > 0 ? line : null;
}

/** The three already-localized pieces of the meta line (D-04). */
export type ProfileMetaLineInput = {
  /** e.g. "3 Festivals" — from the cached `festivalKeys.mine` query. */
  festivalsLabel?: string | null;
  /** e.g. "0 Friends" — constant 0 this phase, FRND-02 not built. */
  friendsLabel?: string | null;
  /** e.g. "seit 2025 dabei" — omitted when {@link createdAtYear} is null. */
  sinceLabel?: string | null;
};

/**
 * Joins `{n} Festivals · {n} Friends · seit {Jahr} dabei` from its localized
 * pieces. A missing piece (e.g. an unparsable `createdAt`) is left out rather
 * than rendered as an empty slot.
 */
export function buildProfileMetaLine({
  festivalsLabel,
  friendsLabel,
  sinceLabel,
}: ProfileMetaLineInput): string {
  return joinFragments([festivalsLabel, friendsLabel, sinceLabel]);
}

/**
 * Reads the year out of `Account.createdAt` (an ISO string since 06-02).
 *
 * A bare year has no locale-variant form, so this needs no `Intl` formatting
 * — and it is the LOCAL year on purpose: "seit 2025 dabei" refers to the year
 * the visitor experienced, not the UTC one.
 *
 * @returns the year, or `null` for a missing/unparsable value so the caller
 * can drop the "seit … dabei" fragment.
 */
export function createdAtYear(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  const parsed = new Date(createdAt);
  const year = parsed.getFullYear();
  return Number.isNaN(year) ? null : year;
}
