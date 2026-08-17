import { describe, expect, it } from 'vitest';
import type { ActivitySummary } from '@quiks/contracts';

import { activityKeys, sortByStartTimeStable } from '../activity-queries';

const FESTIVAL_A = '11111111-1111-1111-1111-111111111111';
const FESTIVAL_B = '22222222-2222-2222-2222-222222222222';
const ACTIVITY_ID = '33333333-3333-3333-3333-333333333333';

/** Every non-`all` variant for a given festivalId, used by both invariant checks below. */
function variantsFor(festivalId: string): ReadonlyArray<readonly unknown[]> {
  return [
    activityKeys.tags(festivalId),
    activityKeys.list(festivalId),
    activityKeys.mine(festivalId),
    activityKeys.detail(festivalId, ACTIVITY_ID),
  ];
}

describe('activityKeys (11-01, UI-SPEC § Query Key & Cache Contract)', () => {
  it('all(festivalId) is a prefix of every other variant for the SAME festivalId', () => {
    const prefix = activityKeys.all(FESTIVAL_A);
    for (const variant of variantsFor(FESTIVAL_A)) {
      expect(variant.slice(0, prefix.length)).toEqual(prefix);
    }
  });

  it('two different festivalId values never produce the same key for any variant', () => {
    expect(activityKeys.all(FESTIVAL_A)).not.toEqual(activityKeys.all(FESTIVAL_B));

    const variantsA = variantsFor(FESTIVAL_A);
    const variantsB = variantsFor(FESTIVAL_B);
    variantsA.forEach((variantA, index) => {
      expect(variantA).not.toEqual(variantsB[index]);
    });
  });
});

function activity(overrides: Partial<Pick<ActivitySummary, 'id' | 'startTime'>>): ActivitySummary {
  return {
    id: overrides.id ?? 'a',
    festivalId: FESTIVAL_A,
    creatorId: 'creator-1',
    subtitle: null,
    description: null,
    location: null,
    tag: null,
    title: 'Beerpong',
    geo: null,
    startTime: overrides.startTime ?? '2026-08-20T10:00:00.000Z',
    capacity: null,
    participantCount: 1,
    joined: false,
  };
}

describe('sortByStartTimeStable (11-01 Task 1 acceptance)', () => {
  it('sorts ascending by startTime', () => {
    const later = activity({ id: 'later', startTime: '2026-08-21T10:00:00.000Z' });
    const earlier = activity({ id: 'earlier', startTime: '2026-08-20T10:00:00.000Z' });
    const sorted = sortByStartTimeStable([later, earlier]);
    expect(sorted.map((entry) => entry.id)).toEqual(['earlier', 'later']);
  });

  it('breaks a tied startTime by activity id, ascending', () => {
    const b = activity({ id: 'b', startTime: '2026-08-20T10:00:00.000Z' });
    const a = activity({ id: 'a', startTime: '2026-08-20T10:00:00.000Z' });
    const sorted = sortByStartTimeStable([b, a]);
    expect(sorted.map((entry) => entry.id)).toEqual(['a', 'b']);
  });

  it('never mutates its input array', () => {
    const input = [
      activity({ id: 'z', startTime: '2026-08-22T10:00:00.000Z' }),
      activity({ id: 'a', startTime: '2026-08-20T10:00:00.000Z' }),
    ];
    const inputCopy = [...input];
    sortByStartTimeStable(input);
    expect(input).toEqual(inputCopy);
  });
});
