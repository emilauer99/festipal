/**
 * Platform-neutral design tokens, consumed by admin (Tailwind v4 `@theme`) and
 * mobile (React Native styles).
 *
 * These are the REAL festipal design system values, ported 1:1 from the approved
 * Claude Design brand system (binding source: `docs/concept/03-design-system.md`
 * §3, ADR-015) and its token file
 * `docs/concept/designs/auth/source/festipal-tokens.css` (ADR-015). Festipal is
 * dark-first: `colors` below are the dark (default) palette; `lightColors`
 * mirrors the same semantic role names for the `[data-theme="light"]` scope so
 * screens can resolve either set via `useColorScheme()`. Do not add a
 * competing/second token set — extend this one.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

/** Full ported `--sp-*` ramp (festipal-tokens.css) — brand system, not rounded to 4/8/16/24/32/48. */
export const spacingScale = {
  'sp-0': 0,
  'sp-1': 2,
  'sp-2': 4,
  'sp-3': 6,
  'sp-4': 8,
  'sp-5': 12,
  'sp-6': 16,
  'sp-7': 20,
  'sp-8': 24,
  'sp-9': 32,
  'sp-10': 40,
  'sp-11': 56,
  'sp-12': 72,
} as const;

/** Named layout constants (not part of the `sp-*` ramp, used as-is). */
export const layout = {
  screenPad: 18,
  stackGap: 12,
  sectionGap: 28,
  topbar: 56,
  navHeight: 64,
  navInset: 14,
  scrollBottomPad: 104,
  hitMin: 44,
  contentMax: 430,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
  // real brand radii ramp (festipal-tokens.css --r-*)
  control: 12,
  pill: 999,
} as const;

/** Full ported `--r-*` radii ramp used by Phase 5 primitives (festipal-tokens.css). Mirrors the
 * `spacingScale` export pattern — do not overload the generic `radii` object above. */
export const radiiScale = {
  'r-card': 22,
  'r-md': 16,
  'r-pill': 999,
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '800',
} as const;

/** Real brand fonts (festipal-tokens.css `--font-*`). Google Fonts OFL, bundled via expo-font. */
export const fontFamilies = {
  display: 'Outfit',
  body: 'Plus Jakarta Sans',
  mono: 'JetBrains Mono',
} as const;

/**
 * Full ported type-role set (UI-SPEC.md ## Typography — 11 roles, 9 sizes, 5
 * weights, LOCKED per ADR-015; do not collapse toward a generic 3-4 size
 * heuristic, do not add sizes/weights not listed here).
 */
export const typeRoles = {
  wordmark: { size: 56, weight: fontWeights.black, lineHeight: 1, family: fontFamilies.display },
  display2: { size: 34, weight: fontWeights.bold, lineHeight: 1.06, family: fontFamilies.display },
  title2: { size: 21, weight: fontWeights.semibold, lineHeight: 1.2, family: fontFamilies.display },
  title3: { size: 17, weight: fontWeights.bold, lineHeight: 1, family: fontFamilies.body },
  bodyStrong: { size: 15, weight: fontWeights.semibold, lineHeight: 1.45, family: fontFamilies.body },
  body: { size: 15, weight: fontWeights.regular, lineHeight: 1.45, family: fontFamilies.body },
  bodySm: { size: 13.5, weight: fontWeights.regular, lineHeight: 1.45, family: fontFamilies.body },
  label: { size: 12, weight: fontWeights.semibold, lineHeight: 1.3, family: fontFamilies.body },
  micro: { size: 10.5, weight: fontWeights.bold, lineHeight: 1.2, family: fontFamilies.body },
  otpDigit: { size: 27, weight: fontWeights.medium, lineHeight: 1, family: fontFamilies.mono },
  countdown: { size: 13.5, weight: fontWeights.medium, lineHeight: 1.3, family: fontFamilies.mono },
} as const;

export const colors = {
  // brand — real values (festipal-tokens.css --brand-*, --green-*, --violet-*)
  primary: '#74CC1F',
  primaryPress: '#63B117',
  primaryForeground: '#07080B',
  secondary: '#5A4DFF',
  secondaryPress: '#4A3CEB',
  // neutrals — dark-first (festipal is dark-first, see file header)
  background: '#0C0E13',
  foreground: '#E9ECF2',
  muted: '#14161D',
  mutedForeground: '#9FA6B6',
  border: 'rgba(233,236,242,.14)',
  // status
  success: '#8FDA3B',
  warning: '#FFC53D',
  danger: '#FF4D5E',
  info: '#5FB4FF',
  // dark-first semantic role aliases the screens need (UI-SPEC ## Color)
  bgApp: '#0C0E13',
  bgAppDeep: '#07080B',
  surfaceCard: '#14161D',
  surfaceInset: '#07080B',
  textPrimary: '#E9ECF2',
  textSecondary: '#9FA6B6',
  textMuted: '#7C8394',
  textOnPrimary: '#07080B',
  // translucent border/fill/glass roles (festipal-tokens.css --border-subtle/--border-brand/
  // --fill-quiet/--fill-brand-quiet/--glass-fill/--glass-border) — Phase 5 UI-SPEC ## Color
  borderSubtle: 'rgba(233,236,242,.08)',
  borderBrand: 'rgba(116,204,31,.45)',
  fillQuiet: 'rgba(233,236,242,.06)',
  fillBrandQuiet: 'rgba(116,204,31,.16)',
  glassFill: 'rgba(20,22,29,.62)',
  glassBorder: 'rgba(255,255,255,.16)',
} as const;

/**
 * Light-mode variant of the semantic role names above (festipal-tokens.css
 * `[data-theme="light"]` scope). Brand hues (primary/secondary/success/danger)
 * stay the same across modes (UI-SPEC Scope note #8) — only the
 * background/surface/text roles change.
 */
export const lightColors = {
  ...colors,
  background: '#FFFFFF',
  foreground: '#07080B',
  muted: '#E9ECF2',
  mutedForeground: '#363B49',
  border: 'rgba(7,8,11,.14)',
  bgApp: '#FFFFFF',
  bgAppDeep: '#F3FCE6',
  surfaceCard: '#FFFFFF',
  surfaceInset: '#E9ECF2',
  textPrimary: '#07080B',
  textSecondary: '#363B49',
  textMuted: '#565C6E',
  // translucent border/fill roles differ in light mode; glassFill/glassBorder/borderBrand/
  // fillBrandQuiet stay the same as dark (inherited via spread — nav stays dark-glass, UI-SPEC)
  borderSubtle: 'rgba(7,8,11,.08)',
  fillQuiet: 'rgba(7,8,11,.05)',
} as const;

export const tokens = {
  spacing,
  spacingScale,
  radiiScale,
  layout,
  radii,
  fontSizes,
  fontWeights,
  fontFamilies,
  typeRoles,
  colors,
  lightColors,
} as const;

export type Tokens = typeof tokens;
