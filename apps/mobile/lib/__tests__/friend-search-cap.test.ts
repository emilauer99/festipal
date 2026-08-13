import { describe, expect, it } from 'vitest';

import { capSearchHits, SEARCH_MAX_RESULTS } from '../friend-queries';

describe('SEARCH_MAX_RESULTS (quick-260813-o08 D-A — a render ceiling, no contract param)', () => {
  it('is 10', () => {
    expect(SEARCH_MAX_RESULTS).toBe(10);
  });
});

describe('capSearchHits', () => {
  it('returns a shorter list unchanged and in the same order', () => {
    const hits = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(capSearchHits(hits)).toEqual(hits);
  });

  it('caps a list of 20 (the actual server ceiling) down to exactly SEARCH_MAX_RESULTS, keeping the FIRST elements in order', () => {
    const hits = Array.from({ length: 20 }, (_, i) => ({ id: `hit-${i}` }));
    const capped = capSearchHits(hits);
    expect(capped).toHaveLength(SEARCH_MAX_RESULTS);
    expect(capped).toEqual(hits.slice(0, SEARCH_MAX_RESULTS));
    // Identity check, not just value equality — a copy or resort would still
    // pass a `toEqual` comparison on plain objects.
    for (let i = 0; i < SEARCH_MAX_RESULTS; i++) {
      expect(capped[i]).toBe(hits[i]);
    }
  });

  it('does not mutate the input list', () => {
    const hits = Array.from({ length: 20 }, (_, i) => ({ id: `hit-${i}` }));
    const lengthBefore = hits.length;
    capSearchHits(hits);
    expect(hits).toHaveLength(lengthBefore);
  });

  it('returns an empty list for an empty input', () => {
    expect(capSearchHits([])).toEqual([]);
  });
});
