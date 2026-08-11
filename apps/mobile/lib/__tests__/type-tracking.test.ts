import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { typeRoles } from '@quiks/ui';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOBILE_ROOT = join(__dirname, '..', '..');
/** The two consumer trees that render type roles (lib/ holds no styles). */
const SCAN_ROOTS = [join(MOBILE_ROOT, 'app'), join(MOBILE_ROOT, 'components')];

/**
 * The Outfit roles the CI gives a tracking value (CI §4 "Tracking −4 % bis
 * −2 %", 05.1 D-08). Giving a fourth role a `letterSpacing` token without
 * listing it here fails the coupling assertion below.
 */
const TRACKED_ROLES = ['wordmark', 'display2', 'title2'] as const;
type TrackedRole = (typeof TRACKED_ROLES)[number];

/** CI tracking corridor, expressed as a fraction of the role's size. */
const MIN_RATIO = 0.02;
const MAX_RATIO = 0.04;
/** Rounding slack at the corridor edges — the token values are pre-rounded points. */
const RATIO_TOLERANCE = 0.01;

type RoleShape = { size: number; letterSpacing?: number };
// `as const` makes the untracked roles structurally unable to name
// `letterSpacing`; widening once here keeps the assertions free of `any`.
const roleTable: Record<string, RoleShape | undefined> = typeRoles;

function collectSourceFiles(root: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectSourceFiles(full));
      continue;
    }
    if (entry.isFile() && /\.tsx?$/.test(entry.name)) found.push(full);
  }
  return found;
}

/** `fontSize: typeRoles.<role>.size` — the size use of a tracked role. */
function sizePattern(role: TrackedRole): RegExp {
  return new RegExp(`fontSize:\\s*typeRoles\\.${role}\\.size`, 'g');
}

/** `letterSpacing: typeRoles.<role>.letterSpacing` — the tracking use of the same role. */
function trackingPattern(role: TrackedRole): RegExp {
  return new RegExp(`letterSpacing:\\s*typeRoles\\.${role}\\.letterSpacing`, 'g');
}

function countMatches(content: string, pattern: RegExp): number {
  return content.match(pattern)?.length ?? 0;
}

const sourceFiles = SCAN_ROOTS.flatMap(collectSourceFiles);

describe('tracked type-role tokens (CI §4 / D-08)', () => {
  for (const role of TRACKED_ROLES) {
    it(`gives ${role} a negative tracking value inside the CI corridor`, () => {
      const entry = roleTable[role];
      expect(entry).toBeDefined();
      const tracking = entry?.letterSpacing;
      expect(typeof tracking).toBe('number');
      expect(tracking as number).toBeLessThan(0);

      const ratio = Math.abs(tracking as number) / (entry as RoleShape).size;
      expect(ratio).toBeGreaterThanOrEqual(MIN_RATIO - RATIO_TOLERANCE);
      expect(ratio).toBeLessThanOrEqual(MAX_RATIO + RATIO_TOLERANCE);
    });
  }

  // Coupling gate: the watched list and the token set cannot drift apart.
  it('carries a letterSpacing token on exactly the watched roles', () => {
    const withTracking = Object.keys(roleTable)
      .filter((role) => typeof roleTable[role]?.letterSpacing === 'number')
      .sort();
    expect(withTracking).toEqual([...TRACKED_ROLES].sort());
  });
});

// The actual regression guard for the 05.1 gap: the tracking values existed as
// tokens while no consumer read them. A style that takes its size from a
// tracked role must take that role's tracking too — the scan is textual, so a
// comment must never restate the style expression verbatim.
describe('tracking application in apps/mobile consumers', () => {
  it('finds source files to scan', () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  for (const role of TRACKED_ROLES) {
    it(`sets ${role} tracking in every file that sets ${role} size`, () => {
      const offenders: string[] = [];
      let sizeUses = 0;

      for (const file of sourceFiles) {
        const content = readFileSync(file, 'utf8');
        const sizes = countMatches(content, sizePattern(role));
        const trackings = countMatches(content, trackingPattern(role));
        sizeUses += sizes;
        if (sizes !== trackings) {
          offenders.push(
            `${relative(MOBILE_ROOT, file)}: ${sizes} ${role} size use(s) vs ${trackings} tracking use(s)`,
          );
        }
      }

      expect(offenders).toEqual([]);
      // Guards against a silent pass if the token access pattern is ever renamed.
      expect(sizeUses).toBeGreaterThan(0);
    });
  }
});
