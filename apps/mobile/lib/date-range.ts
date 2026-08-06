/**
 * Pure, Hermes-safe date-range formatter (D-08, RESEARCH.md Pitfall 3).
 *
 * Deliberately avoids `Intl.DateTimeFormat.prototype.formatRange` — it has a
 * documented history of intermittent failures on Hermes/iOS
 * (facebook/hermes#1172, reactwg/react-native-releases#623). Instead this
 * formats each date with ONE `Intl.DateTimeFormat` instance via two separate
 * `.format()` calls, joined by an en-dash — the well-supported basic
 * `format()` path only.
 *
 * `start`/`end` are `YYYY-MM-DD` date-only strings (DATE-NULLABILITY,
 * locked in 05-01) or `null`. They are parsed by splitting into
 * year/month/day integers and constructing a LOCAL `Date` — never
 * `new Date(str)`, which Node/Hermes interpret as UTC midnight and can shift
 * the rendered calendar day by one in negative-offset timezones (REVIEW
 * 05-03 MEDIUM). A malformed/nonexistent calendar date (e.g. `'2026-02-30'`,
 * which `Date` would otherwise silently roll over to March) is rejected by
 * re-checking the constructed date's own components against the input.
 *
 * A `null`/empty/malformed date on EITHER side returns a localized "dates
 * TBA" fallback rather than throwing or rendering "Invalid Date" — this is a
 * pure lib with no Lingui runtime, so the two possible fallback strings are
 * returned directly by locale (German locales vs. everything else), matching
 * the caller's own localized copy voice without pulling in `@lingui/core`
 * here.
 */

const DATES_TBA_DE = 'Termin folgt';
const DATES_TBA_EN = 'Dates TBA';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isGermanLocale(locale: string): boolean {
  return locale.toLowerCase().startsWith('de');
}

function fallbackFor(locale: string): string {
  return isGermanLocale(locale) ? DATES_TBA_DE : DATES_TBA_EN;
}

/**
 * Parses a `YYYY-MM-DD` date-only string into a LOCAL `Date` (never UTC).
 * Returns `null` for any malformed input (wrong shape, non-numeric
 * components) or a calendar-invalid date (e.g. `'2026-02-30'`) — `Date`
 * silently normalizes an out-of-range day/month instead of throwing, so the
 * constructed date's own components are re-checked against the input to
 * catch that case.
 */
function parseDateOnlyLocal(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function formatDateRange(start: string | null, end: string | null, locale: string): string {
  if (!start || !end) return fallbackFor(locale);

  const startDate = parseDateOnlyLocal(start);
  const endDate = parseDateOnlyLocal(end);
  if (!startDate || !endDate) return fallbackFor(locale);

  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}
