import { describe, expect, it } from 'vitest';
import { typeRoles } from '@quiks/ui';

import {
  resolveEffectiveThemeMode,
  resolveTheme,
  resolveThemeColors,
  resolveThemeMode,
  type ThemeColors,
  type ThemeOverride,
} from '../theme';

/** CI v1.0 literals (docs/brand/quiks-ci-v1.md §3/§6) — the values this suite gates. */
const BEERE = '#E8559F';
const AMBER = '#FFC53D';
const PAPIER = '#F7F5F2';
const INK = '#0C0E13';
/** D-11: deleted as brand colours, no replacement, no `ciFallbacks` export. */
const REMOVED_LIMETTE = '#74CC1F';
const REMOVED_VIOLETT = '#5A4DFF';

const light = resolveTheme(null).colors;
const dark = resolveTheme('dark').colors;

/** Flattens a colour set to every string value it contains, including nested ones (gradientSunset). */
function colorStrings(set: ThemeColors): string[] {
  const found: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === 'string') {
      found.push(value.toUpperCase());
      return;
    }
    if (value && typeof value === 'object') {
      for (const nested of Object.values(value)) walk(nested);
    }
  };
  walk(set);
  return found;
}

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
    expect(light.primary).toBe(dark.primary);
    expect(light.secondary).toBe(dark.secondary);
  });
});

describe('CI v1.0 colour values (ADR-023, docs/brand/quiks-ci-v1.md)', () => {
  it('paints the app surface Papier in light and Ink in dark (CI §6)', () => {
    expect(light.bgApp).toBe(PAPIER);
    expect(dark.bgApp).toBe(INK);
  });

  it('carries Beere as primary and Amber as secondary in BOTH sets (CI §3)', () => {
    expect(light.primary).toBe(BEERE);
    expect(dark.primary).toBe(BEERE);
    expect(light.secondary).toBe(AMBER);
    expect(dark.secondary).toBe(AMBER);
  });

  it('puts white on Beere and Ink on Amber (CI §3 "Text darauf")', () => {
    expect(dark.textOnPrimary).toBe('#FFFFFF');
    expect(dark.primaryForeground).toBe('#FFFFFF');
    expect(dark.textOnSecondary).toBe(INK);
  });

  // D-11 gate: automated, not a review note. Reintroducing either hue anywhere
  // in either set — including nested inside gradientSunset — fails here.
  it('contains NEITHER the removed Limette NOR the removed Violett hex in either mode (D-11)', () => {
    for (const set of [light, dark]) {
      const values = colorStrings(set);
      expect(values).not.toContain(REMOVED_LIMETTE);
      expect(values).not.toContain(REMOVED_VIOLETT);
    }
  });

  it('gives the status TEXT variants a light-mode value distinct from the dark one', () => {
    expect(light.dangerText).not.toBe(dark.dangerText);
    // In dark mode the *Text token equals its fill — the divergence is light-only.
    expect(dark.dangerText).toBe(dark.danger);
    expect(dark.infoText).toBe(dark.info);
    expect(dark.successText).toBe(dark.success);
    expect(dark.warningText).toBe(dark.warning);
  });

  it('keeps the status FILLS mode-invariant (only the *Text variants switch)', () => {
    expect(light.danger).toBe(dark.danger);
    expect(light.info).toBe(dark.info);
    expect(light.success).toBe(dark.success);
    expect(light.warning).toBe(dark.warning);
  });

  it('declares its own glass pair in light mode instead of inheriting the dark one (D-03)', () => {
    expect(light.glassFill).not.toBe(dark.glassFill);
    expect(light.glassBorder).not.toBe(dark.glassBorder);
  });

  it('defines Sunset as exactly two stops, ordered Amber then Beere, at 150 degrees (CI §3)', () => {
    const gradient = dark.gradientSunset;
    expect(gradient.angle).toBe(150);
    expect(gradient.stops).toHaveLength(2);
    expect(gradient.stops[0]).toEqual({ offset: 0, color: AMBER });
    expect(gradient.stops[1]).toEqual({ offset: 1, color: BEERE });
    // Mode-invariant: the brand gradient does not invert (CI §6).
    expect(light.gradientSunset).toEqual(gradient);
  });

  it('resolves text on the raw Sunset fill to Ink, never white (UI-SPEC Sunset Gradient Contract)', () => {
    expect(dark.textOnGradient).toBe(INK);
    expect(light.textOnGradient).toBe(INK);
  });
});

describe('CI v1.0 type roles (CI §4 / D-08, D-09)', () => {
  it('sets Display to 44/800 and Titel to 26/700', () => {
    expect(typeRoles.display2.size).toBe(44);
    expect(typeRoles.display2.weight).toBe('800');
    expect(typeRoles.title2.size).toBe(26);
    expect(typeRoles.title2.weight).toBe('700');
  });

  it('sets Label to 13.5/700 and Micro to 10.5/700', () => {
    expect(typeRoles.label.size).toBe(13.5);
    expect(typeRoles.label.weight).toBe('700');
    expect(typeRoles.micro.size).toBe(10.5);
    expect(typeRoles.micro.weight).toBe('700');
  });

  it('adds the CI Mono role at 15/500', () => {
    expect(typeRoles.mono).toBeDefined();
    expect(typeRoles.mono.size).toBe(15);
    expect(typeRoles.mono.weight).toBe('500');
  });

  it('keeps Body at 15/400 with line height 1.45', () => {
    expect(typeRoles.body.size).toBe(15);
    expect(typeRoles.body.weight).toBe('400');
    expect(typeRoles.body.lineHeight).toBe(1.45);
  });
});

// 06-03 / D-08a — the persisted override is a LAYER ABOVE the 05.1 device
// resolution, never a replacement for it. The `resolveThemeMode` describe block
// at the top of this file is deliberately left untouched: it stays the gate on
// the hell-first invariant, and the `'system'` branch below is asserted to
// produce EXACTLY the same answers, so a future "simplification" that inlines
// the scheme check into the override path fails here.
describe('resolveEffectiveThemeMode (persisted override above the device scheme, D-08a)', () => {
  it("forces dark even when the device says light — 'dark' wins over the scheme", () => {
    expect(resolveEffectiveThemeMode('dark', 'light')).toBe('dark');
  });

  it("forces light even when the device says dark — 'light' wins over the scheme", () => {
    expect(resolveEffectiveThemeMode('light', 'dark')).toBe('light');
  });

  it("follows a dark device in 'system'", () => {
    expect(resolveEffectiveThemeMode('system', 'dark')).toBe('dark');
  });

  it("follows a light device in 'system'", () => {
    expect(resolveEffectiveThemeMode('system', 'light')).toBe('light');
  });

  it("resolves an UNRESOLVED scheme (null) to light in 'system' — the 05.1 invariant", () => {
    expect(resolveEffectiveThemeMode('system', null)).toBe('light');
  });

  it("resolves undefined to light in 'system' — same unresolved case, different shape", () => {
    expect(resolveEffectiveThemeMode('system', undefined)).toBe('light');
  });

  it("resolves RN's 'unspecified' to light in 'system'", () => {
    expect(resolveEffectiveThemeMode('system', 'unspecified')).toBe('light');
  });

  it("delegates the whole 'system' branch to resolveThemeMode, value for value", () => {
    const schemes = ['light', 'dark', null, undefined, 'unspecified'] as const;
    for (const scheme of schemes) {
      expect(resolveEffectiveThemeMode('system', scheme)).toBe(resolveThemeMode(scheme));
    }
  });

  it('ignores the device scheme entirely for both explicit overrides', () => {
    const schemes = ['light', 'dark', null, undefined, 'unspecified'] as const;
    const explicit: ThemeOverride[] = ['light', 'dark'];
    for (const override of explicit) {
      for (const scheme of schemes) {
        expect(resolveEffectiveThemeMode(override, scheme)).toBe(override);
      }
    }
  });
});
