import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { readMobileFile, stripComments } from './support/source-text';

// Same file-relative resolution as source-text.ts's MOBILE_ROOT — this file
// lives at lib/__tests__/, two levels below apps/mobile — so the app/
// directory walk below is independent of the runner's working directory.
const __dirname = dirname(fileURLToPath(import.meta.url));
const MOBILE_ROOT = join(__dirname, '..', '..');

/**
 * G-09-2 gap closure — wiring guard for the fix, not a UI behavior test
 * (this suite is `environment: 'node'`, no RN component harness — the
 * layout math itself stays device-verified per Task 1's `<human-check>`).
 *
 * What this guards: `.planning/debug/header-content-whitespace.md` traced
 * the ~80dp resting-gap defect to root Stack group registrations that never
 * set `headerShown: false`, so React Navigation's native-stack rendered its
 * default VISIBLE (blank) header and laid the nested navigator out below
 * it — a band the AppHeader glass then hid instead of making visible. The
 * fix moves the default to the NAVIGATOR (`screenOptions`) instead of
 * repeating it per registration, so a future sibling route can't forget it
 * the way `profil`/`friends-qr`/`friends-find`/`cashless` individually did
 * before this fix. `friend-detail` is the one deliberate exception — it
 * turns its own header back on because its close button lives there.
 */

function findLayoutFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findLayoutFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('_layout.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const NAVIGATOR_DEFAULT_PATTERN = /screenOptions=\{\{\s*headerShown:\s*false\s*\}\}/;

describe('stripComments (helper self-test — 09-07)', () => {
  it('removes block comments, including the JSX {/* … */} form', () => {
    const source = "const a = 1; /* drop me */ const b = { c: 2 }; /* {/* jsx-ish */} const d = 3;";
    expect(stripComments(source)).not.toContain('drop me');
  });

  it('removes whole-line comments', () => {
    const source = "const a = 1; // trailing note\nconst b = 2;";
    expect(stripComments(source)).not.toContain('trailing note');
  });

  it('preserves a "://" URL scheme embedded in a string literal', () => {
    const source = "const scheme = 'quiks://expo-development-client';";
    expect(stripComments(source)).toContain('quiks://expo-development-client');
  });
});

describe('every Navigator layout hides the native header by default (G-09-2)', () => {
  const appDir = join(MOBILE_ROOT, 'app');
  const layoutFiles = findLayoutFiles(appDir);

  it('found at least one _layout.tsx (non-vacuum: an empty list must fail)', () => {
    expect(layoutFiles.length).toBeGreaterThan(0);
  });

  it('the file list includes the root app/_layout.tsx', () => {
    const relative = layoutFiles.map((file) => file.slice(appDir.length + 1));
    expect(relative).toContain('_layout.tsx');
  });

  for (const file of layoutFiles) {
    const relative = file.slice(appDir.length + 1).replace(/\\/g, '/');
    it(`${relative} renders a navigator with the header default off`, () => {
      const source = stripComments(readMobileFile('app', ...relative.split('/')));
      // Non-vacuum: the file must actually declare a navigator element —
      // otherwise a passing "no headerShown here" match would prove nothing.
      expect(source).toMatch(/<(Stack|Tabs)\b/);
      expect(source).toMatch(NAVIGATOR_DEFAULT_PATTERN);
    });
  }
});

describe('root app/_layout.tsx carries the default at exactly one place (G-09-2)', () => {
  it('no individual Stack.Screen registration still carries its own header option', () => {
    const source = stripComments(readMobileFile('app', '_layout.tsx'));
    expect(source).toMatch(NAVIGATOR_DEFAULT_PATTERN);
    // Remove the ONE navigator-level default and confirm nothing else in the
    // file still mentions headerShown — proving the four former per-screen
    // options (profil/friends-qr/friends-find/cashless) are really gone,
    // not merely reworded.
    const withoutNavigatorDefault = source.replace(NAVIGATOR_DEFAULT_PATTERN, '');
    expect(withoutNavigatorDefault).not.toMatch(/headerShown/);
  });
});

describe('friend-detail explicitly turns its own header back on (T-09-25)', () => {
  it('sets headerShown: true before `presentation` in its own Stack.Screen options', () => {
    const source = stripComments(readMobileFile('app', 'friend-detail.tsx'));
    const headerShownIndex = source.indexOf('headerShown: true');
    const presentationIndex = source.indexOf('presentation:');
    expect(headerShownIndex).toBeGreaterThanOrEqual(0);
    expect(presentationIndex).toBeGreaterThanOrEqual(0);
    expect(headerShownIndex).toBeLessThan(presentationIndex);
  });
});
