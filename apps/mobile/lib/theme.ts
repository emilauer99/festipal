import { colors, lightColors } from '@quiks/ui';

/**
 * Pure colour-mode resolution for the quiks CI v1.0 rollout (ADR-023 / D-01).
 *
 * HELL-FIRST CONTRACT: quiks CI v1.0 is light-first (`docs/brand/quiks-ci-v1.md`
 * §6 — "Die App startet hell"). Only the exact device scheme `'dark'` resolves
 * to the dark ("night shift") token set; `'light'`, `null` and `undefined` all
 * resolve to LIGHT. `useColorScheme()` legitimately returns `null` before the
 * native appearance value has resolved, so treating "unresolved" as dark would
 * both break the CI default and — worse — leave a surface with no colours on
 * the first frame (05.1-UI-SPEC.md § UI Considerations row E3/loading: the
 * FloatingNav glass must never paint transparent over page content).
 *
 * NODE-IMPORTABLE CONTRACT (same constraint as lib/fonts.ts): this module must
 * NOT import `react` or `react-native` at module scope, so the node-environment
 * Vitest runner (`vitest.config.ts`, include `lib/**\/__tests__/**`) can import
 * and assert the resolution contract off-device. The React binding lives in the
 * sibling `lib/theme-context.tsx`, mirroring the `fonts.ts` + `fonts-context.tsx`
 * split.
 */

/** The two colour modes CI v1.0 defines (§6). Light is the default, dark is the "night shift". */
export type ThemeMode = 'light' | 'dark';

/**
 * Everything React Native's `useColorScheme()` can hand back, restated here so
 * this module stays node-importable (importing RN's own `ColorSchemeName` would
 * pull react-native into the Vitest node runner).
 *
 * `'unspecified'` is part of RN 0.86's `ColorSchemeName` union, not a
 * theoretical extra: it is the appearance value for "no preference reported",
 * i.e. the same unresolved case as `null` — and therefore resolves to LIGHT.
 */
export type DeviceColorScheme = 'light' | 'dark' | 'unspecified' | null | undefined;

/**
 * The semantic colour role set, widened off the `as const` token literals.
 *
 * `typeof colors` alone cannot type BOTH sets: the token objects are `as const`,
 * so `colors.bgApp` is the literal `'#0C0E13'` and `lightColors.bgApp` is
 * `'#F7F5F2'` — the light set would not be assignable to the dark set's type.
 * Widening every string-valued role to `string` keeps the KEY SET load-bearing
 * (a role missing from `colors` is still a type error downstream) while letting
 * both sets satisfy it. Non-string roles (the Sunset gradient object) keep their
 * precise shape so consumers still see the stops.
 */
export type ThemeColors = {
  readonly [K in keyof typeof colors]: (typeof colors)[K] extends string
    ? string
    : (typeof colors)[K];
};

/** What `useTheme()` hands to a consumer: the active mode plus its resolved colour set. */
export type Theme = {
  mode: ThemeMode;
  colors: ThemeColors;
};

/**
 * Maps a device colour scheme onto a theme mode — hell-first (D-01).
 *
 * @param scheme the value from React Native's `useColorScheme()` — see
 * {@link DeviceColorScheme}.
 * @returns `'dark'` ONLY for the exact value `'dark'`; every other input
 * (including an unresolved `null`/`undefined`/`'unspecified'`) returns `'light'`.
 */
export function resolveThemeMode(scheme: DeviceColorScheme): ThemeMode {
  return scheme === 'dark' ? 'dark' : 'light';
}

/** Picks the token set for a mode. Dark yields `colors`, light yields `lightColors`. */
export function resolveThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? colors : lightColors;
}

/**
 * Composes {@link resolveThemeMode} and {@link resolveThemeColors} into the
 * value consumed through `useTheme()`. Never returns undefined colours — that
 * is the whole point of the light fallback (UI-SPEC E3/loading).
 */
export function resolveTheme(scheme: DeviceColorScheme): Theme {
  const mode = resolveThemeMode(scheme);
  return { mode, colors: resolveThemeColors(mode) };
}
