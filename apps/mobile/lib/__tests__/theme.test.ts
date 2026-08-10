import { describe, expect, it } from 'vitest';

import { resolveTheme, resolveThemeColors, resolveThemeMode } from '../theme';

// Node-environment suite (vitest.config.ts): it imports only the PURE surface
// of lib/theme.ts — never lib/theme-context.tsx, which pulls in react-native's
// useColorScheme. The mode-resolution contract asserted here is what makes
// D-01 (hell-first) a gate instead of a review note.
describe('resolveThemeMode (hell-first default, D-01)', () => {
  it("returns dark ONLY for the exact device scheme 'dark'", () => {
    expect(resolveThemeMode('dark')).toBe('dark');
  });

  it("returns light for the device scheme 'light'", () => {
    expect(resolveThemeMode('light')).toBe('light');
  });

  it('returns light for an UNRESOLVED scheme (null) — useColorScheme() before the native value lands', () => {
    expect(resolveThemeMode(null)).toBe('light');
  });

  it('returns light for undefined — same unresolved case, different shape', () => {
    expect(resolveThemeMode(undefined)).toBe('light');
  });

  it("returns light for RN's 'unspecified' — the appearance value for 'no preference reported'", () => {
    expect(resolveThemeMode('unspecified')).toBe('light');
  });

  it('resolves every device scheme value, and only dark yields dark', () => {
    const inputs = ['light', 'dark', null, undefined, 'unspecified'] as const;
    const darkInputs = inputs.filter((scheme) => resolveThemeMode(scheme) === 'dark');
    expect(darkInputs).toEqual(['dark']);
  });
});

describe('resolveThemeColors', () => {
  it('yields a distinct set per mode', () => {
    expect(resolveThemeColors('light').bgApp).not.toBe(resolveThemeColors('dark').bgApp);
  });
});

describe('resolveTheme (E3/loading — a surface can never paint with undefined colours)', () => {
  it('returns real colours for an unresolved scheme', () => {
    const theme = resolveTheme(null);
    expect(theme.mode).toBe('light');
    expect(theme.colors).toBeDefined();
  });

  it('defines the glass + background roles the FloatingNav paints on the first frame', () => {
    const { colors } = resolveTheme(null);
    expect(colors.bgApp).toBeDefined();
    expect(colors.glassFill).toBeDefined();
    expect(colors.glassBorder).toBeDefined();
  });

  it('gives light and dark different app backgrounds', () => {
    expect(resolveTheme(null).colors.bgApp).not.toBe(resolveTheme('dark').colors.bgApp);
  });

  it('keeps the brand hues mode-invariant (CI §6: "Marke, Verlauf und Beere bleiben identisch")', () => {
    const light = resolveTheme('light').colors;
    const dark = resolveTheme('dark').colors;
    expect(light.primary).toBe(dark.primary);
    expect(light.secondary).toBe(dark.secondary);
  });
});
