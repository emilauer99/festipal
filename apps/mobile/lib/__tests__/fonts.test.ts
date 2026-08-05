import { describe, expect, it } from 'vitest';

import {
  FONT_BODY,
  FONT_DISPLAY,
  FONT_MONO,
  resolveFontFamily,
} from '../fonts';

// This suite also proves the Wave-0 runner works at all: apps/mobile had no
// test framework before this plan. It intentionally imports only the PURE
// surface of lib/fonts.ts (constants + resolveFontFamily) — never useAppFonts,
// which lazily requires react-native modules — so it runs green in the
// node-environment Vitest config with no jest-expo.
describe('font-family constants', () => {
  it('are the expected literal Google-Font weight names', () => {
    expect(FONT_DISPLAY).toBe('Outfit_700Bold');
    expect(FONT_BODY).toBe('PlusJakartaSans_400Regular');
    expect(FONT_MONO).toBe('JetBrainsMono_400Regular');
  });

  it('are plain strings usable directly as a StyleSheet fontFamily', () => {
    for (const family of [FONT_DISPLAY, FONT_BODY, FONT_MONO]) {
      expect(typeof family).toBe('string');
      expect(family.length).toBeGreaterThan(0);
    }
  });
});

describe('resolveFontFamily (non-blocking contract, Pitfall 5 / D-04)', () => {
  it('returns the custom family once fonts are loaded', () => {
    expect(resolveFontFamily(FONT_DISPLAY, true)).toBe('Outfit_700Bold');
  });

  it('falls back to undefined (RN system font) until fonts load — never blocks render', () => {
    expect(resolveFontFamily(FONT_DISPLAY, false)).toBeUndefined();
    expect(resolveFontFamily(FONT_BODY, false)).toBeUndefined();
    expect(resolveFontFamily(FONT_MONO, false)).toBeUndefined();
  });
});
