/**
 * Platform-neutral design tokens, consumed by admin (Tailwind v4 `@theme`) and
 * mobile (React Native styles).
 *
 * NOTE: these are PLACEHOLDER values. Replace them with the real festipal design
 * system once the designs from Claude Design (claude.ai/design) are available.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
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
} as const;

export const colors = {
  // brand — placeholder until Claude Design tokens land
  primary: '#4f46e5',
  primaryForeground: '#ffffff',
  // neutrals
  background: '#ffffff',
  foreground: '#0a0a0a',
  muted: '#f4f4f5',
  mutedForeground: '#71717a',
  border: '#e4e4e7',
  // status
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
} as const;

export const tokens = {
  spacing,
  radii,
  fontSizes,
  fontWeights,
  colors,
} as const;

export type Tokens = typeof tokens;
