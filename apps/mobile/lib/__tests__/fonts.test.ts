import { describe, expect, it } from 'vitest';
import { typeRoles } from '@quiks/ui';

import {
  FONT_BODY,
  FONT_BODY_STRONG,
  FONT_DISPLAY,
  FONT_MONO,
  FONT_MONO_MEDIUM,
  FONT_TITLE_STRONG,
  FONT_WORDMARK,
  fontFamilyForRole,
  resolveFontFamily,
  type TypeRole,
} from '../fonts';

/** Every role name the token file defines — the resolver must cover all of them. */
const ALL_ROLES = Object.keys(typeRoles) as TypeRole[];

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
    expect(FONT_WORDMARK).toBe('Outfit_800ExtraBold');
    expect(FONT_TITLE_STRONG).toBe('PlusJakartaSans_700Bold');
    expect(FONT_BODY_STRONG).toBe('PlusJakartaSans_600SemiBold');
    expect(FONT_MONO_MEDIUM).toBe('JetBrainsMono_500Medium');
  });

  it('are plain strings usable directly as a StyleSheet fontFamily', () => {
    const families = [
      FONT_DISPLAY,
      FONT_BODY,
      FONT_MONO,
      FONT_WORDMARK,
      FONT_TITLE_STRONG,
      FONT_BODY_STRONG,
      FONT_MONO_MEDIUM,
    ];
    for (const family of families) {
      expect(typeof family).toBe('string');
      expect(family.length).toBeGreaterThan(0);
    }
  });
});

describe('fontFamilyForRole (D-10 — a real weight file per role, no faux-bold)', () => {
  // The mapping is asserted role by role rather than by re-deriving it, so a
  // silent change to any role's font file fails here instead of at a device
  // walk-through. Source of truth: 05.1-UI-SPEC.md § Font Resolver Contract.
  const EXPECTED: Record<TypeRole, string> = {
    wordmark: FONT_WORDMARK,
    display2: FONT_WORDMARK,
    title2: FONT_DISPLAY,
    title3: FONT_TITLE_STRONG,
    label: FONT_TITLE_STRONG,
    micro: FONT_TITLE_STRONG,
    bodyStrong: FONT_BODY_STRONG,
    body: FONT_BODY,
    bodySm: FONT_BODY,
    mono: FONT_MONO_MEDIUM,
    // Pre-existing gap, out of scope this phase: weight 500 declared, 400 file loaded.
    otpDigit: FONT_MONO,
    countdown: FONT_MONO,
    // 09-04 — both AppHeader-only roles are Outfit/black like wordmark/display2.
    headerTitle: FONT_WORDMARK,
    headerWordmark: FONT_WORDMARK,
  };

  it.each(ALL_ROLES)('maps %s to its weight-specific font file', (role) => {
    expect(fontFamilyForRole(role, true)).toBe(EXPECTED[role]);
  });

  // Driven off the TOKEN key set, not a hand-copied list: a role added to
  // typeRoles without a resolver entry fails here (and at compile time).
  it('covers EVERY role defined in typeRoles', () => {
    expect(ALL_ROLES.length).toBeGreaterThan(0);
    for (const role of ALL_ROLES) {
      expect(fontFamilyForRole(role, true)).toBeDefined();
    }
    expect(Object.keys(EXPECTED).sort()).toEqual([...ALL_ROLES].sort());
  });

  it('falls back to undefined for EVERY role until fonts load (non-blocking contract)', () => {
    for (const role of ALL_ROLES) {
      expect(fontFamilyForRole(role, false)).toBeUndefined();
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
