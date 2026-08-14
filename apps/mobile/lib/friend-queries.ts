/**
 * Friend query-key factory + re-exported ts-rest unwrap helper. Mirrors
 * `festival-queries.ts`'s pattern exactly and stays framework-free (no React
 * import) so it remains node-env-testable and importable from anywhere
 * (08-01-PLAN Task 1, action (1)).
 *
 * `unwrapOk`/`ApiResponseError` are IMPORTED from `./festival-queries`, not
 * redefined here — they are generic and already exist.
 */
export { ApiResponseError, unwrapOk } from './festival-queries';

/**
 * Query-key factory — the single source for these keys across screens.
 *
 * `all` is deliberately the shared PREFIX of every list this phase touches
 * (search, requests, crew): a single
 * `queryClient.invalidateQueries({ queryKey: friendKeys.all })` after any
 * mutation (see `use-friend-mutations.ts`) refreshes search results, the
 * requests section and the crew list at once. `['me']` — the profile/QR
 * handle query — is untouched by this factory and stays shared with the
 * Profil screen exactly as it already is.
 */
export const friendKeys = {
  all: ['friends'] as const,
  search: (q: string) => ['friends', 'search', q] as const,
  requests: ['friends', 'requests'] as const,
  list: ['friends', 'list'] as const,
  handle: (username: string) => ['friends', 'handle', username] as const,
  /**
   * 09-05 (D-18) — the festival-scoped intersection (`GET
   * /festivals/:festivalId/friends`), shared by the Dashboard's Crew
   * `StatTile` and the Festival-Friends-Tab list: ONE key, ONE cache entry,
   * so the Kachel's number can never disagree with the list below it.
   * Starts with the same `['friends', ...]` prefix as every other entry in
   * this factory, so the existing `friendKeys.all` prefix invalidation after
   * a friendship mutation (unfriend, in particular) refreshes this list too
   * — unfriending someone in a festival must not leave them visible here.
   */
  inFestival: (festivalId: string) => ['friends', 'inFestival', festivalId] as const,
};

/**
 * Below this many typed characters the search field shows a hint and fires
 * no request — a client-side courtesy, not a contract requirement (the
 * 2-char floor is a Phase 7 *service* invariant, `q` itself is an
 * unrestricted `z.string()`). Also the FRND-03 prohibition boundary: no
 * request below this length means no default listing / directory view.
 */
export const SEARCH_MIN_CHARS = 2;

/** Debounce window between a keystroke and the `GET /visitors?q=` it triggers. */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * The render ceiling for search hits (quick-260813-o08 D-A). This is a
 * client-side presentation limit only — the server already caps the body at
 * 20 independently of this value, and no `limit` parameter exists on
 * `searchVisitors` in `packages/contracts`. A real server-side cap would be a
 * contract change shared with the `admin` workstream; this constant exists so
 * the screen never renders more than a handful of rows without needing one.
 */
export const SEARCH_MAX_RESULTS = 10;

/**
 * Trims a hits list down to `SEARCH_MAX_RESULTS`, keeping the first elements
 * in their original order. Side-effect-free — the input array is never
 * mutated, only read from.
 */
export function capSearchHits<T>(hits: readonly T[]): T[] {
  return hits.slice(0, SEARCH_MAX_RESULTS);
}
