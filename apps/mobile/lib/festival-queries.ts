/**
 * Shared TanStack Query key factory + ts-rest response-unwrap helper
 * (REVIEW cross-plan MEDIUM — repeated ts-rest response unwrapping). Kept
 * framework-free (no React import) so it stays unit-testable and reusable by
 * both this plan's festival-home screen and 05-06's save mutation.
 */

/** Query-key factory — the single source for these keys across screens. */
export const festivalKeys = {
  all: ['festivals'] as const,
  mine: ['me', 'festivals'] as const,
  detail: (slug: string) => ['festival', slug] as const,
};

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
