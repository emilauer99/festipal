import { describe, expect, it } from 'vitest';

import { buildIdentityLine, buildProfileMetaLine, createdAtYear } from '../profile-meta-line';

/**
 * 06-03 / D-04 + D-12 — the two joined lines of the profile header. Both are
 * pure and Lingui-free: the localized PIECES ("0 Festivals", "seit 2025
 * dabei") are produced by the screen through the plural macros, this module
 * only joins them. That is what keeps the joining rule provable under the
 * node-env runner instead of living in screen code.
 */
describe('buildIdentityLine (D-12 — omit-if-empty, fixed order)', () => {
  it('joins pronoun, age and gender in exactly that order', () => {
    expect(buildIdentityLine({ pronoun: 'sie/ihr', age: 23, gender: 'weiblich' })).toBe(
      'sie/ihr · 23 · weiblich',
    );
  });

  it('keeps the fixed order regardless of the object literal order', () => {
    expect(buildIdentityLine({ gender: 'weiblich', age: 23, pronoun: 'sie/ihr' })).toBe(
      'sie/ihr · 23 · weiblich',
    );
  });

  it('returns a single value with NO separator when only one field is set', () => {
    expect(buildIdentityLine({ pronoun: 'er/ihm', age: null, gender: null })).toBe('er/ihm');
    expect(buildIdentityLine({ pronoun: null, age: 23, gender: null })).toBe('23');
    expect(buildIdentityLine({ pronoun: null, age: null, gender: 'divers' })).toBe('divers');
  });

  it('joins exactly the two present values when one of three is missing', () => {
    expect(buildIdentityLine({ pronoun: 'sie/ihr', age: null, gender: 'weiblich' })).toBe(
      'sie/ihr · weiblich',
    );
    expect(buildIdentityLine({ pronoun: null, age: 23, gender: 'weiblich' })).toBe('23 · weiblich');
  });

  // The caller must be able to OMIT the line entirely (no reserved height, no
  // placeholder dash) — an empty string would still render as a laid-out line.
  it('returns NULL, not an empty string, when all three fields are empty', () => {
    const line = buildIdentityLine({ pronoun: null, age: null, gender: null });
    expect(line).toBeNull();
    expect(line).not.toBe('');
  });

  it('treats undefined and whitespace-only strings as empty', () => {
    expect(buildIdentityLine({})).toBeNull();
    expect(buildIdentityLine({ pronoun: '   ', gender: '' })).toBeNull();
    expect(buildIdentityLine({ pronoun: '  sie/ihr  ', age: null, gender: null })).toBe('sie/ihr');
  });

  it('renders age 0 rather than dropping it as falsy', () => {
    expect(buildIdentityLine({ pronoun: null, age: 0, gender: null })).toBe('0');
  });

  it('never produces a dangling separator', () => {
    const lines = [
      buildIdentityLine({ pronoun: 'sie/ihr', age: 23, gender: 'weiblich' }),
      buildIdentityLine({ pronoun: 'sie/ihr', age: null, gender: null }),
      buildIdentityLine({ pronoun: null, age: 23, gender: 'weiblich' }),
    ];
    for (const line of lines) {
      expect(line).not.toBeNull();
      expect(line?.startsWith('·')).toBe(false);
      expect(line?.endsWith('·')).toBe(false);
      expect(line).not.toContain('··');
    }
  });
});

describe('buildProfileMetaLine (D-04 — "{n} Festivals · {n} Friends · seit {year} dabei")', () => {
  it('joins the three already-localized pieces with the same separator', () => {
    expect(
      buildProfileMetaLine({
        festivalsLabel: '0 Festivals',
        friendsLabel: '0 Friends',
        sinceLabel: 'seit 2025 dabei',
      }),
    ).toBe('0 Festivals · 0 Friends · seit 2025 dabei');
  });

  it('carries all three parts and no dangling separator for the zero case', () => {
    const line = buildProfileMetaLine({
      festivalsLabel: '0 Festivals',
      friendsLabel: '0 Friends',
      sinceLabel: 'seit 2025 dabei',
    });
    expect(line).toContain('0 Festivals');
    expect(line).toContain('0 Friends');
    expect(line).toContain('2025');
    expect(line.startsWith('·')).toBe(false);
    expect(line.endsWith('·')).toBe(false);
    expect(line).not.toContain('··');
  });

  it('omits a missing "since" piece instead of leaving a trailing separator', () => {
    // The year is null when `createdAt` is unparsable — the caller passes no
    // sinceLabel then, and the line must still read cleanly.
    expect(
      buildProfileMetaLine({ festivalsLabel: '3 Festivals', friendsLabel: '0 Friends' }),
    ).toBe('3 Festivals · 0 Friends');
  });

  it('handles a plural count above one unchanged (the label is the caller’s)', () => {
    expect(
      buildProfileMetaLine({
        festivalsLabel: '12 Festivals',
        friendsLabel: '1 Friend',
        sinceLabel: 'seit 2024 dabei',
      }),
    ).toBe('12 Festivals · 1 Friend · seit 2024 dabei');
  });
});

describe('createdAtYear (D-04 — a bare year needs no Intl formatting)', () => {
  it('reads the year out of the ISO string GET /me returns', () => {
    expect(createdAtYear('2025-03-14T09:12:33.000Z')).toBe(2025);
  });

  it('returns null for an unparsable or missing value', () => {
    expect(createdAtYear('not-a-timestamp')).toBeNull();
    expect(createdAtYear('')).toBeNull();
    expect(createdAtYear(null)).toBeNull();
    expect(createdAtYear(undefined)).toBeNull();
  });
});
