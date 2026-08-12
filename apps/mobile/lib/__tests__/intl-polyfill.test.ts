import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@quiks/i18n';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MOBILE_ROOT = join(__dirname, '..', '..');

/**
 * G-06-5 gap closure — a WIRING guard, not a behavior guard.
 *
 * This runner is `environment: 'node'` (full ICU, so `Intl.PluralRules` is
 * genuinely present) and is scoped to `lib/**\/__tests__/**`, so it renders no
 * screens. A test that tried to reproduce the Hermes constructor TypeError
 * here would be theater — it structurally cannot fail the way the device
 * does (see `.planning/debug/profile-screen-undefined-constructor.md`,
 * "phase-4" evidence entry). Instead this asserts the WIRING the device
 * depends on: that the custom entry point exists, is actually loaded, and
 * installs the polyfill before Expo Router evaluates any route — every
 * realistic way the fix gets silently undone is covered by one of the five
 * assertions below.
 *
 * Falsified before being trusted (assertions 1, 4, 5 — see the SUMMARY for
 * this plan for the three mutation + red-run records).
 */

/** Narrow shape — only the two fields this guard actually reads. */
type MobilePackageJson = {
  main?: string;
  dependencies?: Record<string, string>;
};

function readMobileFile(...segments: string[]): string {
  return readFileSync(join(MOBILE_ROOT, ...segments), 'utf8');
}

function readPackageJson(): MobilePackageJson {
  return JSON.parse(readMobileFile('package.json')) as MobilePackageJson;
}

describe('G-06-5 — Intl.PluralRules polyfill wiring guard', () => {
  it('sets package.json "main" to the custom entry file (not the stock expo-router entry)', () => {
    const pkg = readPackageJson();
    // The sneakiest regression path: reverting `main` to the stock Expo
    // Router entry silently unloads the polyfill while every other file
    // (index.js, intl-polyfill.ts, the dependency) still looks correct.
    expect(pkg.main).toBe('index.js');
  });

  it('lists @formatjs/intl-pluralrules as a dependency', () => {
    const pkg = readPackageJson();
    expect(pkg.dependencies).toHaveProperty('@formatjs/intl-pluralrules');
  });

  it('imports the polyfill module BEFORE expo-router/entry in index.js', () => {
    const entry = readMobileFile('index.js');
    // Matched on the QUOTED import specifier, not a bare substring — this
    // file's own header comment mentions both module names in prose, and a
    // bare substring search would pick up those mentions instead of the
    // actual `import` statements below them.
    const polyfillPos = entry.indexOf("'./lib/intl-polyfill'");
    const routerEntryPos = entry.indexOf("'expo-router/entry'");

    // Both must be FOUND — otherwise a missing import would pass as
    // "position -1 is smaller than N", which proves nothing.
    expect(polyfillPos).toBeGreaterThanOrEqual(0);
    expect(routerEntryPos).toBeGreaterThanOrEqual(0);
    expect(polyfillPos).toBeLessThan(routerEntryPos);
  });

  it('imports the FORCED polyfill variant with its required .js suffix', () => {
    const source = readMobileFile('lib', 'intl-polyfill.ts');
    // A swap to the detection variant (`/polyfill.js` or bare `/polyfill`) or
    // a dropped extension both fail this — asserted on the FULL specifier,
    // not a loose substring.
    expect(source).toContain("'@formatjs/intl-pluralrules/polyfill-force.js'");
  });

  it('carries a locale-data import for every member of SUPPORTED_LOCALES', () => {
    const source = readMobileFile('lib', 'intl-polyfill.ts');
    // Coupled to the shared locale set, not hand-duplicated here: adding a
    // third UI locale without its plural data would otherwise ship a silent
    // per-locale crash, and this fails the build the moment the locale is
    // added to @quiks/i18n.
    //
    // Matched on the FULL single-quoted import specifier, not a loose
    // `locale-data/<locale>` substring: this file's own header comment
    // discusses the `locale-data/de` specifier in prose (documenting the
    // required `.js` suffix), so a loose substring search would still find
    // "locale-data/de" in the comment even if the real import below it were
    // deleted — proving nothing.
    for (const locale of SUPPORTED_LOCALES) {
      expect(source).toContain(`'@formatjs/intl-pluralrules/locale-data/${locale}.js'`);
    }
  });
});
