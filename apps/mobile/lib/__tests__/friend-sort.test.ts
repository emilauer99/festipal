import { describe, expect, it } from 'vitest';

import {
  createDisplayNameComparator,
  foldForSort,
  resolveCollator,
  sortFriendsByDisplayName,
  type SortableFriend,
} from '../friend-sort';

function friend(displayName: string, username: string): SortableFriend {
  return { profile: { displayName, username } };
}

describe('foldForSort (D-12 — diacritic folding, no normalize/Unicode-property assumption)', () => {
  it('folds Ä to a but keeps AERZTE distinct from Ärzte (a fold, not a normalization)', () => {
    expect(foldForSort('Ärzte')).not.toBe(foldForSort('AERZTE'));
    // Both still sort before 'berta' because both start with 'a'.
    expect(foldForSort('Ärzte').startsWith('a')).toBe(true);
    expect(foldForSort('Ärzte') < foldForSort('Berta')).toBe(true);
  });

  it('folds ß to ss so Straße and Strasse compare equal', () => {
    expect(foldForSort('Straße')).toBe(foldForSort('Strasse'));
  });

  it('lowercases so Anna and anna compare equal', () => {
    expect(foldForSort('Anna')).toBe(foldForSort('anna'));
  });

  it('trims surrounding whitespace', () => {
    expect(foldForSort('  Anna  ')).toBe(foldForSort('Anna'));
  });
});

describe('resolveCollator (capability probe, node-env has a full Intl.Collator)', () => {
  it('returns a working Intl.Collator in this runner (compare("ä","z") < 0)', () => {
    const collator = resolveCollator();
    expect(collator).not.toBeNull();
    expect(typeof collator?.compare).toBe('function');
    expect(collator?.compare('ä', 'z')).toBeLessThan(0);
  });
});

describe('createDisplayNameComparator — fallback branch (collator === null), tested DIRECTLY', () => {
  // The node-env runner has a complete Intl, so `sortFriendsByDisplayName`
  // alone would never reach this branch — it is exercised directly here so
  // the fallback path is not a vacuous test (08-03-PLAN Task 1 acceptance).
  const comparator = createDisplayNameComparator(null);

  it('orders [Zoe, Ärzte, berta] to [Ärzte, berta, Zoe]', () => {
    const input = [friend('Zoe', 'zoe'), friend('Ärzte', 'aerzte'), friend('berta', 'berta')];
    const sorted = [...input].sort(comparator);
    expect(sorted.map((f) => f.profile.displayName)).toEqual(['Ärzte', 'berta', 'Zoe']);
  });

  it('resolves a displayName tie via username ascending, identically for both input orders', () => {
    const a = friend('Sam', 'zzz-sam');
    const b = friend('Sam', 'aaa-sam');
    expect([a, b].sort(comparator).map((f) => f.profile.username)).toEqual(['aaa-sam', 'zzz-sam']);
    expect([b, a].sort(comparator).map((f) => f.profile.username)).toEqual(['aaa-sam', 'zzz-sam']);
  });
});

describe('createDisplayNameComparator — collator branch (a real Intl.Collator), tested DIRECTLY', () => {
  const comparator = createDisplayNameComparator(
    new Intl.Collator(undefined, { sensitivity: 'base', numeric: true }),
  );

  it('orders [Zoe, Ärzte, berta] to [Ärzte, berta, Zoe]', () => {
    const input = [friend('Zoe', 'zoe'), friend('Ärzte', 'aerzte'), friend('berta', 'berta')];
    const sorted = [...input].sort(comparator);
    expect(sorted.map((f) => f.profile.displayName)).toEqual(['Ärzte', 'berta', 'Zoe']);
  });

  it('resolves a displayName tie via username ascending, identically for both input orders', () => {
    const a = friend('Sam', 'zzz-sam');
    const b = friend('Sam', 'aaa-sam');
    expect([a, b].sort(comparator).map((f) => f.profile.username)).toEqual(['aaa-sam', 'zzz-sam']);
    expect([b, a].sort(comparator).map((f) => f.profile.username)).toEqual(['aaa-sam', 'zzz-sam']);
  });
});

describe('sortFriendsByDisplayName (D-12 — empty/single input, non-mutation)', () => {
  it('returns [] for an empty list and does not throw', () => {
    expect(sortFriendsByDisplayName([])).toEqual([]);
  });

  it('returns a content-identical array for a single element', () => {
    const only = [friend('Zoe', 'zoe')];
    expect(sortFriendsByDisplayName(only)).toEqual(only);
  });

  it('never mutates the input array', () => {
    const input = [friend('Zoe', 'zoe'), friend('Ärzte', 'aerzte'), friend('berta', 'berta')];
    const snapshot = input.map((f) => f.profile.displayName);
    sortFriendsByDisplayName(input);
    expect(input.map((f) => f.profile.displayName)).toEqual(snapshot);
  });

  it('sorts a real list ascending by displayName, umlauts placed correctly', () => {
    const input = [friend('Zoe', 'zoe'), friend('Ärzte', 'aerzte'), friend('Berta', 'berta')];
    const sorted = sortFriendsByDisplayName(input);
    expect(sorted.map((f) => f.profile.displayName)).toEqual(['Ärzte', 'Berta', 'Zoe']);
  });
});
