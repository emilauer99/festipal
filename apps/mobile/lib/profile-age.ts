/**
 * D-12a — the profile header's age is DERIVED from `visitor_profile.birth_date`
 * and is never persisted as a value of its own. The stored date does not go
 * stale, and a later age gate / youth-protection policy (IDN-02) can be added
 * without a migration; this module is the single place the number exists.
 *
 * Pure and framework-free (no React, no react-native, no Lingui) so it lives
 * under `lib/` where the node-env Vitest runner can actually prove it — the
 * runner covers `lib/**\/__tests__/**` only, so this logic must not drift into
 * screen code.
 *
 * The reference instant is a PARAMETER, never created inside this module: an
 * age function that reads the clock itself cannot be tested at a boundary, and
 * the two interesting cases here ARE boundaries (the day before a birthday and
 * 29 February in a non-leap year).
 *
 * Counting is done on the CALENDAR COMPONENTS (year/month/day), never on a
 * millisecond difference divided by 365.25 — that drifts by a day per leap
 * year and gets exactly the 29 February case wrong.
 */

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type CalendarDate = { year: number; month: number; day: number };

/**
 * Parses a `YYYY-MM-DD` date-only string (the transport form `GET /me` uses
 * for `birthDate`, see 06-02) into calendar components.
 *
 * Returns `null` for a wrong shape AND for a calendar-invalid date: `Date`
 * silently rolls `2026-02-30` over to 2 March instead of throwing, so the
 * constructed date's own components are re-checked against the input — the
 * same guard `lib/date-range.ts` documents. A LOCAL `Date` is constructed for
 * that check (never `new Date(string)`, which is parsed as UTC midnight and
 * shifts the calendar day in negative-offset timezones).
 */
function parseDateOnly(value: string): CalendarDate | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(year, month - 1, day);
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) {
    return null;
  }
  return { year, month, day };
}

/**
 * Derives the age in completed years from a `YYYY-MM-DD` birth date.
 *
 * @param birthDate the stored birth date, or `null`/`undefined` when the
 * optional field was never filled in.
 * @param now the reference instant — passed in, see the module note.
 * @returns the age in whole years, or `null` when the field is empty,
 * unparsable, calendar-invalid or in the future (T-06-13). Never throws and
 * never returns a negative number: the caller simply omits the identity line.
 */
export function deriveAge(birthDate: string | null | undefined, now: Date): number | null {
  if (!birthDate) return null;

  const born = parseDateOnly(birthDate);
  if (!born) return null;

  const nowMonth = now.getMonth() + 1;
  const nowDay = now.getDate();

  let age = now.getFullYear() - born.year;
  // The birthday has not been reached yet this year — one fewer completed
  // year. A 29 February birthday is therefore only counted from 1 March in a
  // non-leap year, because 29 < 29 is false but the 28th is still day 28.
  if (nowMonth < born.month || (nowMonth === born.month && nowDay < born.day)) {
    age -= 1;
  }

  return age < 0 ? null : age;
}
