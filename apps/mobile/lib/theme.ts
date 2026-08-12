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

/**
 * The three states the persisted appearance preference can hold (D-08a).
 *
 * `'system'` means "follow the device", i.e. defer to {@link resolveThemeMode}
 * unchanged. `'light'` and `'dark'` are EXPLICIT user choices that outrank the
 * device. The Mehr-screen switch writes `'dark'` (on) or `'light'` (off) —
 * WR-01 (06-REVIEW.md): writing `'system'` on off made the switch inert on a
 * system-dark device, because `'system'` resolves right back to `'dark'` there.
 * `'system'` therefore survives only as the DEFAULT (nothing stored yet, or an
 * unreadable/tampered value — see `parseThemeOverride`); no control writes it
 * back until an explicit three-state Light/Dark/System control exists
 * (06-UI-SPEC.md § Theme Override Contract).
 */
export type ThemeOverride = 'system' | 'light' | 'dark';

/**
 * Applies the persisted override ON TOP OF the device resolution (D-08a).
 *
 * This is a LAYER, not a replacement: the `'system'` branch delegates to
 * {@link resolveThemeMode} verbatim, so the hell-first invariant (only the
 * exact device value `'dark'` yields the night shift; `null`/`undefined`/
 * `'unspecified'` all yield light) is preserved byte-for-byte and stays gated
 * by that function's own untouched test block. Do NOT inline the scheme check
 * here — a second copy of the rule is a second thing to drift.
 *
 * @param override the persisted preference — see {@link ThemeOverride}.
 * @param scheme the value from React Native's `useColorScheme()`.
 * @returns the explicit override when there is one, else the device answer.
 */
export function resolveEffectiveThemeMode(
  override: ThemeOverride,
  scheme: DeviceColorScheme,
): ThemeMode {
  if (override === 'dark') return 'dark';
  if (override === 'light') return 'light';
  return resolveThemeMode(scheme);
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
