import { describe, expect, it } from 'vitest';
import type { Festival } from '@quiks/contracts';

import { resolveFestivalGateState, type FestivalQueryState } from '../festival-gate';

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

const PENDING: FestivalQueryState = { status: 'pending' };
const ERROR: FestivalQueryState = { status: 'error' };
function success(status: number, body?: Festival): FestivalQueryState {
  return { status: 'success', data: { status, body } };
}

describe('resolveFestivalGateState (D-10 — single source of truth for the festival gate)', () => {
  it('shows loading while pending with no cached instant-paint hint', () => {
    const state = resolveFestivalGateState({
      missingSlug: false,
      query: PENDING,
      cachedFestival: undefined,
    });
    expect(state).toMatchObject({
      showLoading: true,
      showTransportError: false,
      showNotFound: false,
      showTabs: false,
      festival: undefined,
      notFound: false,
    });
  });

  it('skips loading and shows the Tabs immediately when a cached festival paints instantly while pending', () => {
    const cached = makeFestival({ name: 'Cached Fest' });
    const state = resolveFestivalGateState({
      missingSlug: false,
      query: PENDING,
      cachedFestival: cached,
    });
    expect(state.showLoading).toBe(false);
    expect(state.showTabs).toBe(true);
    expect(state.festival).toBe(cached);
  });

  it('shows the Tabs with the fetched festival on a 200 response', () => {
    const fetched = makeFestival({ name: 'Fetched Fest' });
    const state = resolveFestivalGateState({
      missingSlug: false,
      query: success(200, fetched),
      cachedFestival: undefined,
    });
    expect(state.showTabs).toBe(true);
    expect(state.festival).toBe(fetched);
    expect(state.showNotFound).toBe(false);
  });

  it('prefers the freshly fetched 200 body over a stale cached hint', () => {
    const cached = makeFestival({ name: 'Stale Cached Fest' });
    const fetched = makeFestival({ name: 'Fresh Fetched Fest' });
    const state = resolveFestivalGateState({
      missingSlug: false,
      query: success(200, fetched),
      cachedFestival: cached,
    });
    expect(state.festival).toBe(fetched);
  });

  it('a 404 is a SUCCESSFUL result (never showTransportError) and hides the Tabs', () => {
    const state = resolveFestivalGateState({
      missingSlug: false,
      query: success(404),
      cachedFestival: undefined,
    });
    expect(state.showTransportError).toBe(false);
    expect(state.showNotFound).toBe(true);
    expect(state.showTabs).toBe(false);
    expect(state.notFound).toBe(true);
  });

  it('a 404 still hides the Tabs even with a cached instant-paint hint present', () => {
    const cached = makeFestival();
    const state = resolveFestivalGateState({
      missingSlug: false,
      query: success(404),
      cachedFestival: cached,
    });
    expect(state.showTabs).toBe(false);
    expect(state.showNotFound).toBe(true);
  });

  it('a transport error hides the Tabs, regardless of any cached hint', () => {
    const cached = makeFestival();
    const state = resolveFestivalGateState({
      missingSlug: false,
      query: ERROR,
      cachedFestival: cached,
    });
    expect(state.showTransportError).toBe(true);
    expect(state.showTabs).toBe(false);
    expect(state.showNotFound).toBe(false);
    expect(state.notFound).toBe(false);
  });

  it('a missing slug shows not-found without ever touching the query or marking notFound', () => {
    const state = resolveFestivalGateState({
      missingSlug: true,
      query: PENDING,
      cachedFestival: undefined,
    });
    expect(state.showNotFound).toBe(true);
    expect(state.showTabs).toBe(false);
    expect(state.notFound).toBe(false);
  });

  it('regression (09-03 device bug): a stable success state always yields the SAME defined festival across repeated calls, so a re-focused tab reading this same derivation can never see a transient blank', () => {
    const fetched = makeFestival({ name: 'Repeat Visit Fest' });
    const query = success(200, fetched);
    const first = resolveFestivalGateState({ missingSlug: false, query, cachedFestival: undefined });
    const second = resolveFestivalGateState({ missingSlug: false, query, cachedFestival: undefined });
    expect(first.showTabs).toBe(true);
    expect(second.showTabs).toBe(true);
    expect(first.festival).toBe(fetched);
    expect(second.festival).toBe(fetched);
  });
});
