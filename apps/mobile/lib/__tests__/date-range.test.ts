import { describe, expect, it } from 'vitest';

import { formatDateRange } from '../date-range';

/**
 * Mirrors `otp-error.test.ts`'s pure input/output pattern — no RN imports,
 * runs under the node-env Vitest runner (vitest.config.ts).
 *
 * German-locale assertions build the expected string dynamically via the
 * same `Intl.DateTimeFormat` construction `formatDateRange` itself uses,
 * rather than a hardcoded literal — CLDR month-abbreviation punctuation
 * (e.g. a trailing period) can vary across ICU data versions, and the
 * behavior under test is "two format() calls joined by an en-dash", not one
 * specific string.
 */
function expectedPart(dateOnly: string, locale: string): string {
  const parts = dateOnly.split('-').map(Number);
  const [year = 0, month = 1, day = 1] = parts;
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
    date,
  );
}

describe('formatDateRange (D-08 — Hermes-safe, null-safe, date-only local parse)', () => {
  it('formats a valid de date range as two format() calls joined by an en-dash', () => {
    const result = formatDateRange('2026-08-13', '2026-08-16', 'de');
    expect(result).toBe(`${expectedPart('2026-08-13', 'de')} – ${expectedPart('2026-08-16', 'de')}`);
  });

  it('formats the same range in en with English month formatting', () => {
    const result = formatDateRange('2026-08-13', '2026-08-16', 'en');
    expect(result).toBe(`${expectedPart('2026-08-13', 'en')} – ${expectedPart('2026-08-16', 'en')}`);
  });

  it('formats a single date deterministically in en', () => {
    const result = formatDateRange('2026-08-13', '2026-08-13', 'en');
    expect(result).toBe('Aug 13, 2026 – Aug 13, 2026');
  });

  it('returns the German fallback when startDate is null', () => {
    expect(formatDateRange(null, '2026-08-16', 'de')).toBe('Termin folgt');
  });

  it('returns the German fallback when endDate is null', () => {
    expect(formatDateRange('2026-08-13', null, 'de')).toBe('Termin folgt');
  });

  it('returns the English fallback when both dates are null', () => {
    expect(formatDateRange(null, null, 'en')).toBe('Dates TBA');
  });

  it('returns the German fallback for a regional de-AT locale (fallback selection is locale-prefix based)', () => {
    expect(formatDateRange(null, null, 'de-AT')).toBe('Termin folgt');
  });

  it('returns the English fallback for an empty-string date', () => {
    expect(formatDateRange('', '2026-08-16', 'en')).toBe('Dates TBA');
  });

  it('returns the fallback for a malformed/nonexistent calendar date (2026-02-30 would otherwise roll over to March)', () => {
    expect(formatDateRange('2026-02-30', '2026-08-16', 'en')).toBe('Dates TBA');
  });

  it('returns the fallback for a non-date-only timestamp string (never fed to new Date() directly)', () => {
    expect(formatDateRange('2026-08-13T10:00:00.000Z', '2026-08-16', 'en')).toBe('Dates TBA');
  });

  it('never calls formatRange — output is always two format() calls joined by " – "', () => {
    const result = formatDateRange('2026-08-13', '2026-08-16', 'en');
    expect(result.split(' – ')).toHaveLength(2);
  });

  it('keeps the correct local day when TZ is a negative UTC offset (Pitfall 3 regression guard — new Date(str) would shift this to Aug 12)', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'America/New_York';
    try {
      const result = formatDateRange('2026-08-13', '2026-08-13', 'en');
      expect(result).toContain('13');
      expect(result).not.toContain('12');
    } finally {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    }
  });
});
