import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { Festival } from '@quiks/contracts';

import { festivalKeys, findCachedFestivalBySlug } from '../festival-queries';

let nextId = 0;
function makeFestival(overrides: Partial<Festival> = {}): Festival {
  nextId += 1;
  return {
    id: overrides.id ?? `00000000-0000-0000-0000-${String(nextId).padStart(12, '0')}`,
    slug: overrides.slug ?? `festival-${nextId}`,
    name: overrides.name ?? `Festival ${nextId}`,
    defaultLocale: overrides.defaultLocale ?? 'de',
    supportedLocales: overrides.supportedLocales ?? ['de'],
    cashlessUrl: overrides.cashlessUrl ?? null,
    startDate: overrides.startDate ?? null,
    endDate: overrides.endDate ?? null,
    place: overrides.place ?? null,
  };
}

describe('findCachedFestivalBySlug (root-stack push screens re-resolve the festival from cache)', () => {
  it('resolves from the layout gate detail entry when both list caches are empty (cold start straight into a saved festival)', () => {
    const queryClient = new QueryClient();
    const festival = makeFestival({ slug: 'rock-am-see' });
    queryClient.setQueryData(festivalKeys.detail('rock-am-see'), {
      status: 200,
      body: festival,
    });

    expect(findCachedFestivalBySlug(queryClient, 'rock-am-see')).toEqual(festival);
  });

  it('treats a non-200 detail entry as a miss instead of returning its body', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(festivalKeys.detail('gone-fest'), {
      status: 404,
      body: { message: 'not found' },
    });

    expect(findCachedFestivalBySlug(queryClient, 'gone-fest')).toBeUndefined();
  });

  it('treats a malformed detail body as a miss, never a crash', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(festivalKeys.detail('broken-fest'), {
      status: 200,
      body: null,
    });

    expect(findCachedFestivalBySlug(queryClient, 'broken-fest')).toBeUndefined();
  });

  it('still resolves from the festival list caches when no detail entry exists', () => {
    const queryClient = new QueryClient();
    const festival = makeFestival({ slug: 'list-only-fest' });
    queryClient.setQueryData(festivalKeys.all, {
      status: 200,
      body: [makeFestival(), festival],
    });

    expect(findCachedFestivalBySlug(queryClient, 'list-only-fest')).toEqual(festival);
  });

  it('returns undefined for a slug no cache knows', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(festivalKeys.all, {
      status: 200,
      body: [makeFestival()],
    });

    expect(findCachedFestivalBySlug(queryClient, 'unknown-fest')).toBeUndefined();
  });
});
