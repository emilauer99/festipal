import type { Festival } from '@festipal/contracts';

/**
 * Pure, tested hero-selection helper for the Home tab (HOME-01, D-04).
 *
 * `selectNextFestival` picks a single "next festival" to feature as the Home
 * hero out of the visitor's saved festivals (`listMyFestivals`); the REST of
 * the list — in the SAME deterministic order — becomes the "Meine Festivals"
 * rail (05-07 Task 2). This helper is intentionally framework-free (no React
 * import) so it stays unit-testable in the node-env Vitest runner
 * (`vitest.config.ts`), mirroring `lib/otp-error.ts`'s pure-fn shape.
 *
 * Rules (REVIEW 05-07 MEDIUM — "earliest upcoming" was underspecified):
 * - Date-only, LOCAL parsing of `startDate` (`YYYY-MM-DD`) — same idiom as
 *   `lib/date-range.ts`'s `parseDateOnlyLocal`, never `new Date(str)` (which
 *   Node/Hermes interpret as UTC midnight and can shift the calendar day in
 *   negative-offset timezones).
 * - A festival is "upcoming" iff its startDate parses to a valid calendar
 *   date whose local Y/M/D is on/after `today`'s local Y/M/D (exact-today
 *   counts as upcoming — inclusive adjacency). `null`/empty/malformed/
 *   calendar-impossible (`'2026-02-31'`) startDates are NEVER upcoming.
 * - Total order: all upcoming festivals first (ascending by startDate), then
 *   all non-upcoming festivals — each group's remaining ties resolved by
 *   `name` (explicit locale/options, so the order does not depend on the
 *   runtime's default ICU locale) and finally by immutable `id`. This is the
 *   SAME ordering used for the no-upcoming fallback (name, then id) — never
 *   the caller's/API's unordered `listMyFestivals` row order.
 * - The comparator never reads array index, so the full ordering is
 *   input-order-independent; the input array (and the query-cache array a
 *   caller may pass) is never mutated — a fresh array is always returned.
 */

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a `YYYY-MM-DD` date-only string into a LOCAL start-of-day `Date`.
 * Returns `null` for `null`/empty/malformed input (wrong shape, non-numeric
 * components) or a calendar-impossible date (e.g. `'2026-02-31'`) — `Date`
 * silently normalizes an out-of-range day/month instead of throwing, so the
 * constructed date's own components are re-checked against the input.
 */
function parseDateOnlyLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
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

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Explicit locale + options (never the runtime's default ICU locale) so the fallback/tie order is deterministic across devices. */
function compareNames(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'base', numeric: true });
}

function compareByNameThenId(a: Festival, b: Festival): number {
  const nameCompare = compareNames(a.name, b.name);
  if (nameCompare !== 0) return nameCompare;
  return a.id.localeCompare(b.id);
}

type Decorated = {
  festival: Festival;
  isUpcoming: boolean;
  startTime: number | null;
};

function decorate(festival: Festival, todayStart: number): Decorated {
  const parsed = parseDateOnlyLocal(festival.startDate);
  const startTime = parsed ? startOfDay(parsed) : null;
  return {
    festival,
    isUpcoming: startTime !== null && startTime >= todayStart,
    startTime,
  };
}

/**
 * Returns a NEW array — the input `festivals` array is never mutated — with
 * every saved festival in the deterministic Home order: upcoming festivals
 * first (ascending by `startDate`), then non-upcoming festivals, ties within
 * each group broken by `name` then `id`. `selectNextFestival` is this
 * ordering's first-item projection; Home's rail is `.slice(1)` of it.
 */
export function orderFestivalsForHome(festivals: readonly Festival[], today: Date): Festival[] {
  const todayStart = startOfDay(today);
  const decorated = festivals.map((festival) => decorate(festival, todayStart));

  decorated.sort((a, b) => {
    if (a.isUpcoming !== b.isUpcoming) {
      return a.isUpcoming ? -1 : 1;
    }
    if (a.isUpcoming && b.isUpcoming && a.startTime !== b.startTime) {
      return (a.startTime ?? 0) - (b.startTime ?? 0);
    }
    return compareByNameThenId(a.festival, b.festival);
  });

  return decorated.map((d) => d.festival);
}

/**
 * Selects the single Home hero festival. `undefined` only for empty input —
 * any non-empty input always returns a festival (single-element input
 * returns that element even if its `startDate` is null/past, via the
 * deterministic fallback ordering above).
 */
export function selectNextFestival(festivals: Festival[], today: Date): Festival | undefined {
  return orderFestivalsForHome(festivals, today)[0];
}
