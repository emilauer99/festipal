import type { ActivitySummary } from '@quiks/contracts';

import { ApiResponseError } from './festival-queries';

/**
 * Query-key factory + ts-rest unwrap helpers for Activities (11-01, UI-SPEC §
 * Query Key & Cache Contract). Mirrors `friend-queries.ts`'s pattern exactly
 * and stays framework-free (no React import) so it remains node-env-testable
 * and importable from anywhere. `unwrapOk`/`ApiResponseError` are IMPORTED
 * from `./festival-queries`, not redefined here — they are generic and
 * already exist.
 */
export { ApiResponseError, unwrapOk } from './festival-queries';

/**
 * `all(festivalId)` is deliberately the shared PREFIX of every other variant
 * below: a single `queryClient.invalidateQueries({ queryKey:
 * activityKeys.all(festivalId) })` in every mutation's `onSettled` (create,
 * join, leave, dissolve — 11-02..11-05) refreshes tags/list/mine/every open
 * detail at once, the same one-call invalidation shape `friendKeys.all`
 * already establishes.
 */
export const activityKeys = {
  all: (festivalId: string) => ['activities', festivalId] as const,
  tags: (festivalId: string) => ['activities', festivalId, 'tags'] as const,
  list: (festivalId: string) => ['activities', festivalId, 'list'] as const,
  mine: (festivalId: string) => ['activities', festivalId, 'mine'] as const,
  detail: (festivalId: string, activityId: string) =>
    ['activities', festivalId, 'detail', activityId] as const,
};

/**
 * `createActivity` answers 201, not 200 — `unwrapOk` stays 200-only (its
 * contract is load-bearing at existing call sites), so this is a SEPARATE
 * helper for the one 201 response in this domain rather than a widening of
 * `unwrapOk` itself.
 */
export function unwrapCreated<T>(response: { status: number; body: unknown }): T {
  if (response.status !== 201) {
    throw new ApiResponseError(response.status);
  }
  return response.body as T;
}

/**
 * Ascending by `startTime`, with the activity `id` as a tie-break so the
 * order stays run-stable when two activities share the same `startTime`
 * (11-01-PLAN Task 1 acceptance criteria). ISO-8601 strings compare
 * correctly with plain string comparison, so no `Date` parsing is needed
 * here. Never mutates its input.
 */
export function sortByStartTimeStable(
  activities: readonly ActivitySummary[],
): ActivitySummary[] {
  return [...activities].sort((a, b) => {
    const byStartTime = a.startTime.localeCompare(b.startTime);
    if (byStartTime !== 0) return byStartTime;
    return a.id.localeCompare(b.id);
  });
}
