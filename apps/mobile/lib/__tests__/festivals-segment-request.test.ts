import { beforeEach, describe, expect, it } from 'vitest';

import { consumeFestivalsSegment, requestFestivalsSegment } from '../festivals-segment-request';

describe('festivals-segment-request (G-05-2 — consume-once cross-tab segment intent)', () => {
  beforeEach(() => {
    // Drain any pending value left by a previous test — the singleton is
    // module-level state shared across the whole test file.
    consumeFestivalsSegment();
  });

  it('returns the requested segment on the next consume', () => {
    requestFestivalsSegment('alle');
    expect(consumeFestivalsSegment()).toBe('alle');
  });

  it('drains the pending value — a second consume with no intervening request returns null', () => {
    requestFestivalsSegment('alle');
    consumeFestivalsSegment();
    expect(consumeFestivalsSegment()).toBeNull();
  });

  it('returns null when nothing was ever requested', () => {
    expect(consumeFestivalsSegment()).toBeNull();
  });

  it('last-write-wins — a later request overrides an earlier unconsumed one', () => {
    requestFestivalsSegment('alle');
    requestFestivalsSegment('meine');
    expect(consumeFestivalsSegment()).toBe('meine');
  });
});
