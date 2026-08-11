import { describe, expect, it } from 'vitest';

import {
  getThemeOverride,
  parseThemeOverride,
  saveThemeOverride,
} from '../theme-override-storage';

/**
 * 06-03 / D-08a + UI-SPEC #32 — the persisted theme override.
 *
 * WHY NO `vi.mock('react-native-mmkv')` HERE (deviation from 06-03-PLAN.md
 * task 1 step 4, deliberate and verified): the module under test loads MMKV
 * through a lazy CJS `require()` inside its accessor, copying
 * `active-festival-storage.ts`. Vitest's module mocking hooks the ESM graph
 * (`__vite_ssr_import__`); a `require()` created by vite-node bypasses that
 * graph entirely and goes straight to Node's resolver. A probe confirmed it:
 * with `vi.mock('react-native-mmkv', ...)` registered, the `require()` still
 * resolved the REAL package and threw `Cannot find module …/react-native-mmkv/
 * lib/createMMKV/…` (the package's entry is a native/RN build with no Node
 * artifact). A mock there would have been decoration, not interception.
 *
 * So the suite is split the way `active-festival-storage.ts` already splits
 * its own logic — a PURE decision function plus a thin I/O wrapper:
 *
 * - {@link parseThemeOverride} carries every decision (missing value, unknown
 *   value, tampered value → `'system'`) and is asserted exhaustively.
 * - {@link getThemeOverride} / {@link saveThemeOverride} are exercised for
 *   REAL in this node environment: MMKV genuinely cannot load here, so the
 *   accessor genuinely throws and the assertions below prove the swallow +
 *   `'system'` fallback against an actual failure rather than a simulated one.
 *   That is the exact T-06-12 / UI-SPEC #32 guarantee: a storage error can
 *   never become a gate or an error UI.
 */
describe('parseThemeOverride (T-06-11 — a stored value is untrusted input)', () => {
  it("defaults to 'system' when nothing is stored", () => {
    expect(parseThemeOverride(undefined)).toBe('system');
  });

  it("defaults to 'system' for an empty string", () => {
    expect(parseThemeOverride('')).toBe('system');
  });

  it("returns 'system' for a stored value outside the three allowed members (tampered/corrupt)", () => {
    expect(parseThemeOverride('purple')).toBe('system');
    expect(parseThemeOverride('DARK')).toBe('system');
    expect(parseThemeOverride('{"mode":"dark"}')).toBe('system');
  });

  it('round-trips each of the three allowed members unchanged', () => {
    expect(parseThemeOverride('system')).toBe('system');
    expect(parseThemeOverride('light')).toBe('light');
    expect(parseThemeOverride('dark')).toBe('dark');
  });
});

describe('theme override storage I/O (UI-SPEC #31/#32 — synchronous, never a gate)', () => {
  it("returns 'system' when the storage access throws — no throw reaches the caller", () => {
    // MMKV is unavailable under the node runner, so `getStorage()` really does
    // throw inside this call; the assertion measures the swallow, not a mock.
    expect(getThemeOverride()).toBe('system');
  });

  it('is synchronous — the switch never has to render an indeterminate state (#31)', () => {
    const value: string = getThemeOverride();
    expect(['system', 'light', 'dark']).toContain(value);
  });

  it('does not throw when the storage write fails', () => {
    expect(() => saveThemeOverride('dark')).not.toThrow();
    expect(() => saveThemeOverride('light')).not.toThrow();
    expect(() => saveThemeOverride('system')).not.toThrow();
  });
});
