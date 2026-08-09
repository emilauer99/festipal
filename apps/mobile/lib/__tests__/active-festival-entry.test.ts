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

  it('overwrites a stale saved slug when a DIFFERENT saved festival is entered', () => {
    expect(
      nextActiveFestivalSlug('frequency-2026', { slug: 'nova-sound-2026', saved: true }),
    ).toBe('nova-sound-2026');
  });

  it('is idempotent when re-entering the SAME saved festival', () => {
    expect(
      nextActiveFestivalSlug('frequency-2026', { slug: 'frequency-2026', saved: true }),
    ).toBe('frequency-2026');
  });
});
