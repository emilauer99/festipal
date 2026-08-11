import { describe, expect, it } from 'vitest';

import { deriveAge } from '../profile-age';

/**
 * 06-03 / D-12a — the age shown in the profile header is DERIVED from
 * `birth_date` and never persisted, so this function is the only place the
 * value exists. Its two hard cases are the ones a naive
 * "milliseconds / 365.25" implementation gets wrong: a birthday not yet
 * reached in the current year, and a 29 February birthday in a non-leap year.
 *
 * REFERENCE DATES ARE BUILT LOCALLY (`new Date(2026, 7, 11)`), not parsed from
 * `'2026-08-11'`: the string form is UTC midnight, which is the PREVIOUS
 * calendar day in every negative-offset timezone — the exact drift
 * `lib/date-range.ts` documents (REVIEW 05-03 MEDIUM). The asserted ages are
 * the ones 06-03-PLAN.md lists; only the construction is made timezone-proof
 * so this suite cannot pass in Vienna and fail in CI.
 */
const AUG_11_2026 = new Date(2026, 7, 11);
const FEB_28_2026 = new Date(2026, 1, 28);
const MAR_01_2026 = new Date(2026, 2, 1);

describe('deriveAge (D-12a — derived, never stored)', () => {
  it('counts a birthday already passed this year', () => {
    expect(deriveAge('2000-06-15', AUG_11_2026)).toBe(26);
  });

  it('does NOT count a birthday still ahead this year', () => {
    expect(deriveAge('2000-12-31', AUG_11_2026)).toBe(25);
  });

  it('counts the birthday on the day itself', () => {
    expect(deriveAge('2000-08-11', AUG_11_2026)).toBe(26);
  });

  it('does not count the birthday one day early', () => {
    expect(deriveAge('2000-08-12', AUG_11_2026)).toBe(25);
  });

  it('holds a 29 February birthday back until 1 March in a non-leap year', () => {
    expect(deriveAge('2004-02-29', FEB_28_2026)).toBe(21);
    expect(deriveAge('2004-02-29', MAR_01_2026)).toBe(22);
  });

  it('returns null for a missing birth date (the field is optional)', () => {
    expect(deriveAge(null, AUG_11_2026)).toBeNull();
    expect(deriveAge(undefined, AUG_11_2026)).toBeNull();
    expect(deriveAge('', AUG_11_2026)).toBeNull();
  });

  it('returns null for an unparsable value instead of throwing', () => {
    expect(deriveAge('nicht-ein-datum', AUG_11_2026)).toBeNull();
    expect(deriveAge('11.08.2000', AUG_11_2026)).toBeNull();
    expect(deriveAge('2000-08-11T00:00:00Z', AUG_11_2026)).toBeNull();
  });

  it('returns null for a calendar-invalid date rather than rolling it over', () => {
    // `new Date(2026, 1, 30)` silently becomes 2 March — rejected, not counted.
    expect(deriveAge('2000-02-30', AUG_11_2026)).toBeNull();
    expect(deriveAge('2005-02-29', AUG_11_2026)).toBeNull();
    expect(deriveAge('2000-13-01', AUG_11_2026)).toBeNull();
  });

  it('returns null for a future birth date instead of a negative age (T-06-13)', () => {
    expect(deriveAge('2030-01-01', AUG_11_2026)).toBeNull();
    // Later this same year — the decrement would otherwise produce -1.
    expect(deriveAge('2026-12-24', AUG_11_2026)).toBeNull();
  });

  it('returns 0 on the day a newborn is born', () => {
    expect(deriveAge('2026-08-11', AUG_11_2026)).toBe(0);
  });
});
