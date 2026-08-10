import { describe, expect, it } from 'vitest';

import { nextActiveFestivalSlug } from '../active-festival-storage';

describe('nextActiveFestivalSlug (G-05-5b-r2 — persist/clear-on-enter reducer)', () => {
  it('persists the entered slug on a first-ever SAVED entry (no prior slug)', () => {
    expect(nextActiveFestivalSlug(undefined, { slug: 'frequency-2026', saved: true })).toBe(
      'frequency-2026',
    );
  });

  it('stays clear on a first-ever UNSAVED entry (no prior slug)', () => {
    expect(
      nextActiveFestivalSlug(undefined, { slug: 'frequency-2026', saved: false }),
    ).toBeUndefined();
  });

  it('THE regression — a stale saved slug is CLEARED when a DIFFERENT unsaved festival is entered', () => {
    // Cold-start read then finds no slug and falls through to Home instead of
    // restoring the stale 'frequency-2026' (05-UAT.md G-05-5b-r2).
    expect(
      nextActiveFestivalSlug('frequency-2026', { slug: 'nova-sound-2026', saved: false }),
    ).toBeUndefined();
  });

  // WR-01 (05-REVIEW.md) — `prior` is documented (see the function's JSDoc)
  // as intentionally UNUSED by the reducer's return value; it exists so a
  // caller/test can narrate "a stale saved slug is present" even though the
  // outcome only ever depends on `entered.saved`. This test therefore
  // exercises the exact same `saved === true` branch as the very first test
  // above — it documents that a DIFFERENT prior slug doesn't change the
  // outcome, rather than adding distinct branch coverage.
  it('overwrites a stale saved slug when a DIFFERENT saved festival is entered', () => {
    expect(
      nextActiveFestivalSlug('frequency-2026', { slug: 'nova-sound-2026', saved: true }),
    ).toBe('nova-sound-2026');
  });

  // WR-01 (05-REVIEW.md) — same note as above: documents that re-entering the
  // SAME saved festival (prior === entered.slug) is a no-op, not a distinct
  // reducer branch (`saved` alone still decides the outcome).
  it('is idempotent when re-entering the SAME saved festival', () => {
    expect(
      nextActiveFestivalSlug('frequency-2026', { slug: 'frequency-2026', saved: true }),
    ).toBe('frequency-2026');
  });
});
