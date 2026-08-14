/**
 * Platform-neutral design tokens, consumed by admin (Tailwind v4 `@theme`) and
 * mobile (React Native styles).
 *
 * BINDING BRAND SOURCE: quiks CI v1.0 — `docs/brand/quiks-ci-v1.md` (ADR-023),
 * which supersedes the earlier ADR-015 brand system. The colour and typography
 * VALUES below are CI v1.0 as of plan 05.1-03; the spacing/radii ramps are the
 * unchanged ADR-015 ones (UI-SPEC § Spacing & Layout: "unchanged this phase" —
 * do not "fix" them toward a generic 4/8/16 heuristic, they are the real ported
 * brand ramp).
 *
 * MARKING CONVENTION (continues §8's own "abgeleitet — im Token-Phase zu
 * bestätigen"): every value that is NOT literal in `docs/brand/quiks-ci-v1.md`
 * carries an inline `derived` marker. A later review must be able to tell a
 * binding CI value from an interpolation without re-reading the brand doc
 * (05.1-RESEARCH.md Pitfall 4).
 *
 * MODE MODEL: CI v1.0 is HELL-FIRST (§6, "Die App startet hell"). `colors` below
 * is the DARK ("night shift") set and `lightColors` is the light DEFAULT set —
 * the object order is legacy, the default is not: `apps/mobile/lib/theme.ts`
 * resolves an unknown/unresolved device scheme to `lightColors`. Brand hues
 * (Beere, Amber, Sunset) and the status FILLS are mode-invariant; only surface,
 * text, glass and the status *TEXT* variants switch. Do not add a competing or
 * second token set — extend this one (ADR-015, still binding: components carry
 * no raw hex values, only semantic role names from here).
 *
 * REMOVED, NO REPLACEMENT (05.1 D-11, binding — do not reintroduce): Limette
 * `#74CC1F` and Violett `#5A4DFF`. They are no longer brand colours and no
 * `ciFallbacks` export is created; the two hex values live on only as historical
 * reference in ADR-023 §5 / the brand doc. `apps/mobile/lib/__tests__/theme.test.ts`
 * asserts their absence, so a re-introduction fails the test suite, not a review.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

/** Full ported `--sp-*` ramp (the legacy ADR-015 token CSS) — brand system, not rounded to 4/8/16/24/32/48. */
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
  // real brand radii ramp (the legacy ADR-015 token CSS --r-*)
  control: 12,
  pill: 999,
} as const;

/** Full ported `--r-*` radii ramp used by Phase 5 primitives (the legacy ADR-015 token CSS). Mirrors the
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

/** Brand fonts (CI §4). Google Fonts OFL, bundled via expo-font. */
export const fontFamilies = {
  display: 'Outfit',
  body: 'Plus Jakarta Sans',
  mono: 'JetBrains Mono',
} as const;

/**
 * Type-role set — quiks CI v1.0 §4 (05.1 D-08/D-09, UI-SPEC ## Typography).
 *
 * The roles the CI names literally (Display, Titel, Body, Label, Mono, Micro)
 * carry the CI's exact size/weight. The five roles it does NOT name (`title3`,
 * `bodyStrong`, `bodySm`, `otpDigit`, `countdown`) are proportionally
 * interpolated and marked `derived`.
 *
 * `letterSpacing` is in POINTS, precomputed from CI §4's "Tracking −4 % bis
 * −2 %" and set on the OUTFIT roles only (the CI states tracking for Outfit,
 * not for Plus Jakarta Sans or JetBrains Mono).
 *
 * FONT-FILE RULE (D-10): a style that resolves its family through
 * `fontFamilyForRole` (apps/mobile/lib/fonts.ts) must NOT also set a numeric
 * `fontWeight` — the `weight` values here describe the role, and the resolver
 * maps each role to a real weight-specific font file. A numeric override on top
 * of a real weight file is what produces device faux-bold.
 */
export const typeRoles = {
  wordmark: {
    size: 56,
    weight: fontWeights.black,
    lineHeight: 1,
    family: fontFamilies.display,
    letterSpacing: -2.24, // derived: 56 x -4% (CI names the wordmark tracking, not a numeric size)
  },
  display2: {
    size: 44,
    weight: fontWeights.black,
    lineHeight: 1.06,
    family: fontFamilies.display,
    letterSpacing: -1.76, // derived: 44 x -4%
  },
  title2: {
    size: 26,
    weight: fontWeights.bold,
    lineHeight: 1.2,
    family: fontFamilies.display,
    letterSpacing: -0.52, // derived: 26 x -2%
  },
  // derived: interpolated between Titel 26 and Body 15 (D-09)
  title3: { size: 19, weight: fontWeights.bold, lineHeight: 1, family: fontFamilies.body },
  // derived: Body size, weight variant only (D-09)
  bodyStrong: {
    size: 15,
    weight: fontWeights.semibold,
    lineHeight: 1.45,
    family: fontFamilies.body,
  },
  body: { size: 15, weight: fontWeights.regular, lineHeight: 1.45, family: fontFamilies.body },
  // derived: one step below Body (D-09) — coincidentally the Label size; the weight (400 vs 700) distinguishes them
  bodySm: { size: 13.5, weight: fontWeights.regular, lineHeight: 1.45, family: fontFamilies.body },
  label: { size: 13.5, weight: fontWeights.bold, lineHeight: 1.3, family: fontFamilies.body },
  // CI "10,5 caps" — the all-caps rendering is the consumer's job (textTransform)
  micro: { size: 10.5, weight: fontWeights.bold, lineHeight: 1.2, family: fontFamilies.body },
  // CI Mono role: inline times, amounts, distances, IDs — never whole sentences
  mono: { size: 15, weight: fontWeights.medium, lineHeight: 1.3, family: fontFamilies.mono },
  // derived: the CI Mono weight at an OTP-legibility size — a documented UI
  // exception, not a CI violation (UI-SPEC ## Typography)
  otpDigit: { size: 27, weight: fontWeights.medium, lineHeight: 1, family: fontFamilies.mono },
  // derived: CI Mono weight at bodySm size (D-09)
  countdown: { size: 13.5, weight: fontWeights.medium, lineHeight: 1.3, family: fontFamilies.mono },
  // 09-04 (D-08/D-09, App Header Contract) — the two AppHeader-only roles.
  // Both Outfit/black like `wordmark`/`display2`, both derived (not literal in
  // the CI doc) and both require their letterSpacing to be set at every
  // consumer (type-tracking.test.ts's tracked-role coupling gate).
  headerTitle: {
    size: 17,
    weight: fontWeights.black,
    lineHeight: 1.15,
    family: fontFamilies.display,
    letterSpacing: -0.34, // derived: 17 x -2% (CI §4 Outfit-tracking corridor)
  },
  headerWordmark: {
    size: 21,
    weight: fontWeights.black,
    lineHeight: 1,
    family: fontFamilies.display,
    letterSpacing: -0.84, // derived: 21 x -4% — distinct from the 56px `wordmark` role
  },
} as const;

/**
 * DARK ("night shift") token set — CI §6 right-hand column.
 *
 * Everything not overridden in `lightColors` below is mode-invariant and lives
 * here: the brand hues, the Sunset gradient, the status FILLS and the
 * on-brand text colours.
 */
export const colors = {
  // ---- brand (mode-invariant, CI §3) ----
  primary: '#E8559F', // Beere
  primaryPress: '#B02D74', // derived: Dusk ramp (--dusk-700), CI §8 "abgeleitet"
  primaryForeground: '#FFFFFF', // CI §3: "Text darauf weiß"
  secondary: '#FFC53D', // Amber
  secondaryPress: '#A97400', // derived: Amber ramp (--amber-700), CI §8 "abgeleitet"
  textOnPrimary: '#FFFFFF', // CI §3: "Text darauf weiß"
  textOnSecondary: '#0C0E13', // CI §3: "Text darauf Ink"

  /**
   * The ONLY gradient in the system (CI §3/§7: "Sunset ist der einzige erlaubte
   * Verlauf", allowed on the brand mark and hero surfaces — nowhere else).
   *
   * Literal numbers transcribed from `docs/quiks_CI.html` lines 23-33. That file
   * is an untrusted visual reference (ADR-023 §1): only these numeric values are
   * taken from it — none of its stylesheet or scripting is ported or executed.
   * Modelled as data (angle + objectBoundingBox vector + ordered stops) so the
   * react-native-svg consumer and the Node icon generator read the SAME values.
   */
  gradientSunset: {
    angle: 150, // CI §3: "150°, Amber oben links"
    vector: { x1: 0, y1: 0, x2: 0.7, y2: 1 }, // objectBoundingBox, docs/quiks_CI.html:25
    stops: [
      { offset: 0, color: '#FFC53D' }, // Amber
      { offset: 1, color: '#E8559F' }, // Beere
    ],
  },
  /**
   * derived (05.1-UI-SPEC § Sunset Gradient Contract, resolving RESEARCH Open
   * Question 1): the single text/icon colour for anything painted DIRECTLY on
   * the raw Sunset fill, in both modes. White fails WCAG at every point of the
   * gradient (~1.7:1 on the Amber end, ~3.37:1 on the Beere end); Ink measures
   * ~11.3:1 and ~5.7:1. The CI's literal "Text auf Beere = weiß" governs the
   * PURE Beere fill (e.g. a solid CTA pill), not the gradient's interior.
   */
  textOnGradient: '#0C0E13',

  // ---- status FILLS (mode-invariant) ----
  // Rule: these bare hues are for FILLED surfaces only (badge background, filled
  // pill), paired with textOnPrimary/textOnSecondary. Any status hue used as
  // TEXT, ICON TINT or a 1px BORDER resolves through the *Text tokens below —
  // all four fail AA on Papier, which hell-first makes the default surface.
  danger: '#FF4D5E', // CI §3 "Live / Gefahr"
  info: '#5FB4FF', // CI §3 "Info"
  warning: '#FFC53D', // = secondary (Amber): CI frames Amber as "Hinweise", the double duty is intentional
  /**
   * derived — the CI defines no status green at all. Kept unchanged from
   * ADR-015 deliberately: D-11 removes Limette as a BRAND colour, and although
   * this hue originates in the Limette ramp it is never used as a brand or
   * surface colour, and the measured light variant `successText #527C22`
   * (4.52:1 on Papier) is computed against exactly this hue. Flagged for the
   * device walk-through in plan 05.1-07 — if it reads as leftover branding next
   * to Beere/Amber it is a one-line follow-up.
   */
  success: '#8FDA3B',

  // ---- status TEXT/border variants (mode-dependent; dark set = the fills) ----
  dangerText: '#FF4D5E',
  infoText: '#5FB4FF',
  successText: '#8FDA3B',
  warningText: '#FFC53D',

  // ---- generic aliases (kept on the same Ink/Papier axis as the roles below) ----
  background: '#0C0E13', // Ink
  foreground: '#E9ECF2', // CI §3 "Text hell"
  muted: 'rgba(255,255,255,.06)', // derived: CI §6 "Karten sind 6 % Weiß"
  mutedForeground: '#9FA6B6', // derived: carried over secondary-text value
  border: 'rgba(233,236,242,.14)', // derived: text-hell triple at 14%

  // ---- surface / text roles ----
  bgApp: '#0C0E13', // Ink — CI §6 "Fläche dunkel"
  bgAppDeep: '#07080B', // derived: one step below Ink
  surfaceCard: 'rgba(255,255,255,.06)', // derived: CI §6 "Karten sind 6 % Weiß"
  surfaceInset: '#07080B', // derived: same deep value as bgAppDeep
  textPrimary: '#E9ECF2', // CI §6 "Text dunkelmodus"
  textSecondary: '#9FA6B6', // derived
  textMuted: '#7C8394', // derived

  // ---- translucent border/fill/glass roles ----
  borderSubtle: 'rgba(233,236,242,.08)', // derived
  borderBrand: 'rgba(232,85,159,.45)', // derived: Beere at 45%
  fillQuiet: 'rgba(233,236,242,.06)', // derived
  fillBrandQuiet: 'rgba(232,85,159,.16)', // derived: Beere at 16%
  fillDangerQuiet: 'rgba(255,77,94,.12)', // derived: danger at 12%
  fillDangerSubtle: 'rgba(255,77,94,.08)', // derived: danger at 8%
  // 06-UI-SPEC ## Color: the SafeNow callout's surface + hairline. Mode-invariant
  // like every other status fill above, so light inherits both by spread. These
  // are FILL/BORDER roles only — the SafeNow text and icon still resolve through
  // `infoText`, because the bare `info` hue reaches just 2.04:1 on Papier and
  // hell-first makes Papier the default surface.
  fillInfoQuiet: 'rgba(95,180,255,.12)', // derived: info at 12%
  borderInfo: 'rgba(95,180,255,.35)', // derived: info at 35%
  glassFill: 'rgba(12,14,19,.62)', // derived: CI §6 "Glas dunkel = Ink 62 %"
  glassBorder: 'rgba(255,255,255,.16)', // derived
} as const;

/**
 * LIGHT (DEFAULT) token set — CI §6 left-hand column, "hell ist Standard".
 *
 * Spreads `colors` and overrides ONLY the surface/text/glass roles plus the four
 * status *TEXT* variants. Brand hues, the Sunset gradient and the status fills
 * are inherited unchanged — CI §6: "Marke, Verlauf und Beere bleiben in beiden
 * Modi identisch; nur Flächen, Text und Glas tauschen."
 *
 * The status *Text overrides are the one addition beyond CI §6: measured against
 * Papier, `danger` reaches only 2.98:1, `info` 2.04:1, `success` 1.57:1 and
 * `warning` 1.45:1 as text. Each light value is the same hue scaled toward black
 * until it clears 4.5:1 on Papier (05.1-UI-SPEC ## Color, post-approval
 * amendment) — all four are therefore `derived`.
 */
export const lightColors = {
  ...colors,

  // ---- generic aliases ----
  background: '#F7F5F2', // Papier
  foreground: '#0C0E13', // Ink
  muted: '#EFEBE5', // derived: Papier one step deeper (warm neutral)
  mutedForeground: '#363B49', // derived
  border: 'rgba(7,8,11,.14)', // derived

  // ---- surface / text roles ----
  bgApp: '#F7F5F2', // Papier — CI §6 "Fläche hell"
  bgAppDeep: '#EFEBE5', // derived: Papier one step deeper (warm neutral)
  surfaceCard: '#FFFFFF', // CI §6 "Karte hell"
  surfaceInset: '#EFEBE5', // derived: same warm inset
  textPrimary: '#0C0E13', // CI §6 "Text hellmodus" (Ink)
  textSecondary: '#363B49', // derived
  textMuted: '#565C6E', // derived

  // ---- status TEXT/border variants (AA on Papier; see the block comment above) ----
  dangerText: '#C93D4A', // derived: 4.54:1 on Papier
  infoText: '#3D73A3', // derived: 4.62:1 on Papier
  successText: '#527C22', // derived: 4.52:1 on Papier
  warningText: '#8C6C22', // derived: 4.51:1 on Papier

  // ---- translucent border/fill/glass roles ----
  // D-04: in light mode `borderSubtle` is the ONLY card-boundary mechanism — no
  // shadow/elevation token is added this phase, a deliberate deviation from the
  // CI's "Schatten sehr weich" wording.
  borderSubtle: 'rgba(7,8,11,.08)', // derived
  fillQuiet: 'rgba(7,8,11,.05)', // derived
  // D-03: light mode declares its OWN glass pair instead of inheriting the dark
  // one by spread — inheriting is exactly the legacy this phase replaces.
  glassFill: 'rgba(247,245,242,.78)', // derived: CI §6 "Glas hell = Papier 78 %"
  glassBorder: 'rgba(12,14,19,.12)', // derived: Ink at 12%
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
