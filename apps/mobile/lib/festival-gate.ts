import type { Festival } from '@quiks/contracts';

/**
 * The three states a ts-rest `useQuery` observer can be in, expressed
 * WITHOUT the `@tanstack/react-query` types themselves — kept framework-free
 * (no React/react-query import) so this module stays importable under the
 * node-env Vitest runner, same idiom as `lib/festival-queries.ts`.
 */
export type FestivalQueryState =
  | { status: 'pending' }
  | { status: 'error' }
  | { status: 'success'; data: { status: number; body: unknown } };

export type FestivalGateState = {
  showLoading: boolean;
  showTransportError: boolean;
  showNotFound: boolean;
  showTabs: boolean;
  festival: Festival | undefined;
  /**
   * `true` only when the QUERY itself resolved a 404 (never for a missing
   * slug) — the exact condition the D-06 `clearActiveFestivalSlug` effect
   * gates on, kept distinct from `showNotFound` (which also covers the
   * missing-slug case) so that effect's dependency stays precise.
   */
  notFound: boolean;
};

/**
 * D-10 gate derivation — the SINGLE source of truth for whether the festival
 * navigator's `Tabs` render at all. Extracted from
 * `app/(festival)/f/[festivalSlug]/_layout.tsx` into a pure function for two
 * reasons:
 *
 * 1. It is unit-testable under the node-env Vitest runner (the screen itself
 *    is not — RN component truths verify on-device only, STATE.md).
 * 2. 09-03 device bug (Task 1 fix): the Dashboard tab used to re-derive this
 *    SAME state through its OWN separate `useQuery` call, which could
 *    transiently disagree with the layout's own derivation on tab re-focus
 *    (e.g. mid-retry/refetch), rendering blank. Tab screens now read the
 *    `Festival` this function resolves via `lib/festival-context.ts` instead
 *    of re-deriving it — there is exactly ONE place this branching happens.
 *
 * A 404 is a SUCCESSFUL ts-rest/React-Query result, never `status ===
 * 'error'` (REVIEW 05-03 MEDIUM) — the contract models 404 as a real
 * response, so `showTransportError` never fires for it.
 */
export function resolveFestivalGateState(params: {
  missingSlug: boolean;
  query: FestivalQueryState;
  cachedFestival: Festival | undefined;
}): FestivalGateState {
  const { missingSlug, query, cachedFestival } = params;

  const notFound = query.status === 'success' && query.data.status === 404;
  const festival =
    query.status === 'success' && query.data.status === 200
      ? (query.data.body as Festival)
      : cachedFestival;

  // A SUCCESSFUL query result whose status is neither 200 nor 404 (e.g. a
  // 500/502/503 from the API or a proxy) is not modeled by ts-rest as an
  // `error` — `lib/api-client.ts` sets no `throwOnUnknownStatus`, so it
  // resolves as `status: 'success'` with an unexpected `data.status`.
  // Treated as transport-error-class here so the existing error + Retry
  // branch renders instead of every flag coming out false (blank screen).
  const unexpectedStatus =
    query.status === 'success' && query.data.status !== 200 && query.data.status !== 404;

  const showLoading = !missingSlug && query.status === 'pending' && !cachedFestival;
  const showTransportError = !missingSlug && (query.status === 'error' || unexpectedStatus);
  const showNotFound = !showTransportError && (missingSlug || notFound);
  const showTabs = !showTransportError && !showNotFound && festival !== undefined;

  return { showLoading, showTransportError, showNotFound, showTabs, festival, notFound };
}
