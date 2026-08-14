import { describe, expect, it } from 'vitest';

import { readMobileFile, stripComments } from './support/source-text';

/**
 * G-09-7 gap closure — the festival tab bar follows the user's own screen
 * designs (docs/concept/designs/quiks-v2/quiks-screens.template.html:2035)
 * instead of the Phase-09 divergence 09-UI-SPEC.md documented, per the UAT
 * decision recorded 2026-08-14
 * (.planning/debug/tab-labels-icons-redesign.md). Catalog values and the
 * icon swap in `FloatingNav.tsx` are pinned here as test values, not left
 * as intent — including the three places the change must NOT reach: the
 * shared "Friends" msgid, the Dashboard Crew-tile eyebrow, and the
 * `navLiveDot` (deliberately not built, NAV-02).
 */

/**
 * Minimal `.po` parser: msgid -> msgstr. Skips obsolete entries (`#~`,
 * lingui's marker for a msgid no longer referenced by any source file) and
 * context-qualified entries (`msgctxt`, e.g. the "relation chip" Friends ->
 * Freunde entry) — a context-scoped translation must never collide with
 * the catalog-wide msgid of the same name.
 */
function parsePoCatalog(source: string): Record<string, string> {
  const catalog: Record<string, string> = {};
  const lines = source.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (line.startsWith('#~')) {
      i++;
      continue;
    }
    if (line.startsWith('msgctxt')) {
      // Skip the msgctxt line, then the msgid/msgstr pair it scopes.
      i++;
      while (i < lines.length && !(lines[i] ?? '').startsWith('msgstr')) i++;
      i++;
      continue;
    }
    const msgidMatch = line.match(/^msgid "(.*)"$/);
    if (msgidMatch) {
      const msgid = unescapePo(msgidMatch[1] ?? '');
      const msgstrMatch = (lines[i + 1] ?? '').match(/^msgstr "(.*)"$/);
      if (msgstrMatch && msgid !== '') {
        catalog[msgid] = unescapePo(msgstrMatch[1] ?? '');
      }
      i += 2;
      continue;
    }
    i++;
  }
  return catalog;
}

function unescapePo(value: string): string {
  return value.replace(/\\"/g, '"').replace(/\\n/g, '\n');
}

const deCatalog = parsePoCatalog(readMobileFile('locales', 'de', 'messages.po'));
const enCatalog = parsePoCatalog(readMobileFile('locales', 'en', 'messages.po'));

describe('parsePoCatalog (helper self-test — 09-07)', () => {
  it('resolves a known, unchanged msgid to its expected msgstr (non-vacuum)', () => {
    expect(deCatalog['Timetable']).toBe('Timetable');
  });

  it('does not let a msgctxt-scoped entry override the catalog-wide msgid', () => {
    // "relation chip" Friends -> Freunde must not shadow the plain Friends entry.
    expect(deCatalog['Friends']).toBe('Friends');
  });
});

describe('festival tab labels (G-09-7, DE catalog)', () => {
  it('Live', () => {
    expect(deCatalog['Live']).toBe('Live');
  });

  it('Crew (new msgid, not a rewrite of the shared Friends entry)', () => {
    expect(deCatalog['Crew']).toBe('Crew');
  });

  it('Timetable stays Timetable', () => {
    expect(deCatalog['Timetable']).toBe('Timetable');
  });

  it('Map becomes Karte', () => {
    expect(deCatalog['Map']).toBe('Karte');
  });
});

describe('festival tab labels (G-09-7, EN catalog — identical to DE for Live/Crew)', () => {
  it('Live', () => {
    expect(enCatalog['Live']).toBe('Live');
  });

  it('Crew', () => {
    expect(enCatalog['Crew']).toBe('Crew');
  });
});

describe('map placeholder copy follows the Karte rename (UAT-Entscheid 3, DE only)', () => {
  it('heading: "No site map yet" -> "Noch keine Karte"', () => {
    expect(deCatalog['No site map yet']).toBe('Noch keine Karte');
  });

  it('body names the Karte, not the Lageplan', () => {
    const body =
      deCatalog["This festival hasn't added a site map yet. It'll show up here once they do."];
    expect(body).toContain('Karte');
    expect(body).not.toContain('Lageplan');
  });
});

describe('activities placeholder copy follows the quiks rename (UAT-Entscheid 3, DE only)', () => {
  it('heading: "Activities are on the way" -> "quiks kommen noch"', () => {
    expect(deCatalog['Activities are on the way']).toBe('quiks kommen noch');
  });

  it('body drops the brand mention — the heading already carries it (Flagged Assumption 3)', () => {
    const body = deCatalog["We're building this at quiks — for every festival, not just this one."];
    expect(body).not.toContain('quiks');
  });
});

describe('untouched surfaces stay untouched (D-11/D-14, both languages)', () => {
  it('the shared Friends msgid is unchanged', () => {
    expect(deCatalog['Friends']).toBe('Friends');
    expect(enCatalog['Friends']).toBe('Friends');
  });

  it('"Friends here" (Dashboard Crew-tile eyebrow) is unchanged', () => {
    expect(deCatalog['Friends here']).toBe('Freunde hier');
    expect(enCatalog['Friends here']).toBe('Friends here');
  });
});

describe('the old labels are gone from the active catalog (G-09-7)', () => {
  it('DE catalog has no active "Dashboard" or "Activities" msgid', () => {
    expect(deCatalog['Dashboard']).toBeUndefined();
    expect(deCatalog['Activities']).toBeUndefined();
  });

  it('EN catalog has no active "Dashboard" or "Activities" msgid', () => {
    expect(enCatalog['Dashboard']).toBeUndefined();
    expect(enCatalog['Activities']).toBeUndefined();
  });
});

describe('FloatingNav.tsx wiring (G-09-7)', () => {
  const source = stripComments(readMobileFile('components', 'FloatingNav.tsx'));

  it('still declares the festival icon table (non-vacuum)', () => {
    expect(source).toContain('FESTIVAL_TAB_ICON');
  });

  it('uses the AudioLines glyph for the first festival tab', () => {
    expect(source).toContain('AudioLines');
  });

  it('no longer imports/uses LayoutDashboard', () => {
    expect(source).not.toContain('LayoutDashboard');
  });

  it('carries the lowercase quiks brand literal for the second festival tab label', () => {
    expect(source).toContain("'quiks'");
  });
});
