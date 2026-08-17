/**
 * Shared TanStack Query key factory + ts-rest response-unwrap helper
 * (REVIEW cross-plan MEDIUM — repeated ts-rest response unwrapping). Kept
 * framework-free (no React import) so it stays unit-testable and reusable by
 * both this plan's festival-home screen and 05-06's save mutation.
 */

import type { QueryClient } from '@tanstack/react-query';
import type { Festival } from '@quiks/contracts';

/**
 * Minimal structural narrowing for a cached single-festival body — `slug` is
 * the one field every caller of {@link findCachedFestivalBySlug} matches on,
 * so its presence (as a string) is the load-bearing check.
 */
function isFestivalShaped(body: unknown): body is Festival {
  return (
    typeof body === 'object' && body !== null && typeof (body as { slug?: unknown }).slug === 'string'
  );
}

/** Query-key factory — the single source for these keys across screens. */
export const festivalKeys = {
  all: ['festivals'] as const,
  mine: ['me', 'festivals'] as const,
  detail: (slug: string) => ['festival', slug] as const,
};

/**
 * Instant-paint source (RESEARCH.md Pattern 2, REVIEW 05-03 HIGH): the
 * `['festivals']`/`['me','festivals']` caches hold FULL ts-rest response
 * objects `{ status, body }`, never a bare `Festival[]` — reading `.body`
 * off an un-narrowed cache hit is exactly the wrong-shape bug the review
 * flagged, so `status === 200` and `Array.isArray(body)` are both checked
 * before `.find()`. A stale/malformed cache entry is a miss, never a crash.
 *
 * 09-03 — hoisted unchanged from `f/[festivalSlug].tsx` (now
 * `f/[festivalSlug]/index.tsx`) so two call sites can share it: the
 * festival-navigator layout's D-10 gate and (starting 09-04) `AppHeader`.
 */
export function findCachedFestivalBySlug(
  queryClient: QueryClient,
  slug: string,
): Festival | undefined {
  // The layout gate's own `getFestival(slug)` entry is checked first: on a
  // cold start that redirects straight into a saved festival, the two list
  // caches below were never populated — but the gate must have resolved this
  // exact key before any screen inside (or pushed from) the festival area can
  // exist. Same narrowing discipline as the list branch: the entry is a full
  // ts-rest `{ status, body }` response, and a malformed one is a miss.
  const detail = queryClient.getQueryData<{ status: number; body: unknown }>(
    festivalKeys.detail(slug),
  );
  if (detail?.status === 200 && isFestivalShaped(detail.body) && detail.body.slug === slug) {
    return detail.body;
  }
  for (const key of [festivalKeys.all, festivalKeys.mine]) {
    const cached = queryClient.getQueryData<{ status: number; body: unknown }>(key);
    if (cached?.status === 200 && Array.isArray(cached.body)) {
      const hit = (cached.body as Festival[]).find((item) => item.slug === slug);
      if (hit) return hit;
    }
  }
  return undefined;
}

/**
 * Thrown by {@link unwrapOk} when a ts-rest response's `status` is not the
 * expected 200 — carries the actual `status` so callers can branch on it
 * (e.g. mapping a 404/409 to a specific UI state) instead of losing the
 * distinction in a generic thrown error.
 */
export class ApiResponseError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Unexpected API response status: ${status}`);
    this.name = 'ApiResponseError';
    this.status = status;
  }
}

/**
 * Narrows a ts-rest client response `{ status, body }` to its success body
 * when `status === 200`, otherwise throws an {@link ApiResponseError}
 * carrying the actual status — turns a non-200 ts-rest result (itself a
 * SUCCESSFUL React Query result, never `query.status === 'error'`) into a
 * real mutation rejection where that is the desired behavior (e.g. 05-06's
 * save mutation).
 */
export function unwrapOk<T>(response: { status: number; body: unknown }): T {
  if (response.status !== 200) {
    throw new ApiResponseError(response.status);
  }
  return response.body as T;
}
