import { describe, expect, it } from 'vitest';
import type { Festival } from '@quiks/contracts';

import { orderFestivalsForHome, selectNextFestival } from '../select-next-festival';

/** Fixed "today" for every test — 2026-08-06 (matches the memory-bank current date). */
const TODAY = new Date(2026, 7, 6);

let nextId = 0;
function makeFestival(overrides: Partial<Festival> = {}): Festival {
  nextId += 1;
  return {
    id: overrides.id ?? `00000000-0000-0000-0000-${String(nextId).padStart(12, '0')}`,
    slug: overrides.slug ?? `festival-${nextId}`,
    name: overrides.name ?? `Festival ${nextId}`,
    defaultLocale: overrides.defaultLocale ?? 'de',
    supportedLocales: overrides.supportedLocales ?? ['de'],
    cashlessUrl: overrides.cashlessUrl ?? null,
    startDate: overrides.startDate ?? null,
    endDate: overrides.endDate ?? null,
    place: overrides.place ?? null,
  };
}

describe('selectNextFestival (HOME-01 — pure, deterministic hero selection)', () => {
  it('returns undefined for empty input', () => {
    expect(selectNextFestival([], TODAY)).toBeUndefined();
  });

  it('returns the single element even when its startDate is null', () => {
    const only = makeFestival({ name: 'Solo Fest', startDate: null });
    expect(selectNextFestival([only], TODAY)).toBe(only);
  });

  it('returns the single element even when its startDate is in the past', () => {
    const only = makeFestival({ name: 'Past Fest', startDate: '2020-01-01' });
    expect(selectNextFestival([only], TODAY)).toBe(only);
  });

  it('picks the earliest upcoming festival by startDate (date-only, ascending)', () => {
    const later = makeFestival({ name: 'Later Fest', startDate: '2026-09-01' });
    const sooner = makeFestival({ name: 'Sooner Fest', startDate: '2026-08-13' });
    const past = makeFestival({ name: 'Past Fest', startDate: '2020-01-01' });
    const result = selectNextFestival([later, sooner, past], TODAY);
    expect(result).toBe(sooner);
  });

  it('treats an exact-today startDate as upcoming (adjacency inclusive)', () => {
    const todayFest = makeFestival({ name: 'Today Fest', startDate: '2026-08-06' });
    const laterFest = makeFestival({ name: 'Later Fest', startDate: '2026-09-01' });
    expect(selectNextFestival([laterFest, todayFest], TODAY)).toBe(todayFest);
  });

  it('breaks a same-startDate tie by name (localeCompare)', () => {
    const zebra = makeFestival({ name: 'Zebra Fest', startDate: '2026-08-13' });
    const alpha = makeFestival({ name: 'Alpha Fest', startDate: '2026-08-13' });
    expect(selectNextFestival([zebra, alpha], TODAY)).toBe(alpha);
  });

  it('breaks a same-startDate, same-name tie by id', () => {
    const b = makeFestival({ name: 'Same Name', startDate: '2026-08-13', id: 'id-b' });
    const a = makeFestival({ name: 'Same Name', startDate: '2026-08-13', id: 'id-a' });
    expect(selectNextFestival([b, a], TODAY)).toBe(a);
  });

  it('falls back to deterministic name order when NO festival is upcoming (all past)', () => {
    const zebra = makeFestival({ name: 'Zebra Fest', startDate: '2020-01-01' });
    const alpha = makeFestival({ name: 'Alpha Fest', startDate: '2020-06-01' });
    // Alpha started later than Zebra but the fallback ignores date entirely
    // once nothing is upcoming — name order wins, not "most recent past".
    expect(selectNextFestival([zebra, alpha], TODAY)).toBe(alpha);
  });

  it('falls back to deterministic name order when all startDates are null', () => {
    const zebra = makeFestival({ name: 'Zebra Fest', startDate: null });
    const alpha = makeFestival({ name: 'Alpha Fest', startDate: null });
    expect(selectNextFestival([zebra, alpha], TODAY)).toBe(alpha);
  });

  it('treats a malformed calendar date (2026-02-31) as non-upcoming, not a crash', () => {
    const malformed = makeFestival({ name: 'Malformed Fest', startDate: '2026-02-31' });
    const real = makeFestival({ name: 'Real Fest', startDate: '2026-09-01' });
    expect(selectNextFestival([malformed, real], TODAY)).toBe(real);
  });

  it('falls back deterministically when the only festival has a malformed date', () => {
    const malformed = makeFestival({ name: 'Malformed Fest', startDate: '2026-02-31' });
    expect(selectNextFestival([malformed], TODAY)).toBe(malformed);
  });

  it('does not mutate the input array', () => {
    const later = makeFestival({ name: 'Later Fest', startDate: '2026-09-01' });
    const sooner = makeFestival({ name: 'Sooner Fest', startDate: '2026-08-13' });
    const input = [later, sooner];
    const inputCopy = [...input];
    selectNextFestival(input, TODAY);
    expect(input).toEqual(inputCopy);
    expect(input[0]).toBe(later);
    expect(input[1]).toBe(sooner);
  });
});

describe('orderFestivalsForHome (deterministic full ordering — hero + rail)', () => {
  it('returns a fresh array, never the input reference', () => {
    const input = [makeFestival()];
    const result = orderFestivalsForHome(input, TODAY);
    expect(result).not.toBe(input);
  });

  it('does not mutate the input array', () => {
    const later = makeFestival({ name: 'Later Fest', startDate: '2026-09-01' });
    const sooner = makeFestival({ name: 'Sooner Fest', startDate: '2026-08-13' });
    const input = [later, sooner];
    const inputCopy = [...input];
    orderFestivalsForHome(input, TODAY);
    expect(input).toEqual(inputCopy);
  });

  it('orders upcoming festivals ascending, then non-upcoming festivals by name/id', () => {
    const upcomingLater = makeFestival({ name: 'Upcoming Later', startDate: '2026-09-01' });
    const upcomingSooner = makeFestival({ name: 'Upcoming Sooner', startDate: '2026-08-13' });
    const pastZebra = makeFestival({ name: 'Zebra Past', startDate: '2020-01-01' });
    const pastAlpha = makeFestival({ name: 'Alpha Past', startDate: '2020-06-01' });

    const result = orderFestivalsForHome(
      [pastZebra, upcomingLater, pastAlpha, upcomingSooner],
      TODAY,
    );

    expect(result).toEqual([upcomingSooner, upcomingLater, pastAlpha, pastZebra]);
  });

  it('produces the SAME ordering regardless of input array order (reversed-input equivalence)', () => {
    const a = makeFestival({ name: 'A Fest', startDate: '2026-08-13' });
    const b = makeFestival({ name: 'B Fest', startDate: '2026-09-01' });
    const c = makeFestival({ name: 'C Fest', startDate: null });

    const forward = orderFestivalsForHome([a, b, c], TODAY);
    const reversed = orderFestivalsForHome([c, b, a], TODAY);

    expect(forward).toEqual(reversed);
    expect(forward.map((f) => f.id)).toEqual([a.id, b.id, c.id]);
  });

  it("selectNextFestival's result is always orderFestivalsForHome's first item (consistency)", () => {
    const upcoming = makeFestival({ name: 'Upcoming', startDate: '2026-08-13' });
    const past = makeFestival({ name: 'Past', startDate: '2020-01-01' });
    const festivals = [past, upcoming];

    const ordered = orderFestivalsForHome(festivals, TODAY);
    const hero = selectNextFestival(festivals, TODAY);

    expect(hero).toBe(ordered[0]);
  });

  it('returns an empty array for empty input', () => {
    expect(orderFestivalsForHome([], TODAY)).toEqual([]);
  });
});
