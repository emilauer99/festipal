/**
 * The ONE construction of the quiks brand mark (05.1 D-07, ADR-023).
 *
 * The mark is a Sunset-filled `q` with a solid Beere dot — not a bitmap. Two
 * consumers read the numbers below and MUST NOT re-transcribe them:
 *
 *   1. `components/WordmarkGlyph.tsx` — the runtime `react-native-svg` render.
 *   2. `scripts/generate-app-icon.mjs` — the build-time PNG rasteriser.
 *
 * Keeping one module means the app icon and the on-screen glyph cannot drift.
 *
 * PROVENANCE: every literal here is transcribed once, verbatim, from
 * `docs/quiks_CI.html` lines 23-33 (`<text>`/`<circle>` of the CI thumbnail).
 * That file is an UNTRUSTED visual source (ADR-023 §1): only these numeric
 * values are taken from it — none of its stylesheet or embedded scripting is
 * ported or executed (threat T-05.1-08).
 *
 * NO COLOURS LIVE HERE (ADR-015). The gradient stops come from
 * `tokens.colors.gradientSunset` and the dot colour from `tokens.colors.primary`;
 * each consumer imports them from `@quiks/ui` itself.
 *
 * PURITY: no `react` / `react-native` import at module scope — same constraint
 * as `lib/theme.ts` and `lib/fonts.ts`, so the node-env Vitest runner (and the
 * plain-node generator script) can import this file.
 */

/** The CI thumbnail's coordinate space — `docs/quiks_CI.html:23`. */
export const GLYPH_VIEWBOX = {
  minX: 0,
  minY: 0,
  width: 1200,
  height: 800,
} as const;

/** The same box as an SVG `viewBox` attribute string, for both consumers. */
export const GLYPH_VIEWBOX_ATTR = `${GLYPH_VIEWBOX.minX} ${GLYPH_VIEWBOX.minY} ${GLYPH_VIEWBOX.width} ${GLYPH_VIEWBOX.height}`;

/** Width ÷ height of {@link GLYPH_VIEWBOX} — the mark scales uniformly. */
export const GLYPH_ASPECT_RATIO = GLYPH_VIEWBOX.width / GLYPH_VIEWBOX.height;

/**
 * The glyph itself — `docs/quiks_CI.html:31`.
 *
 * `letterSpacing` is NEGATIVE and tuned for Outfit alone. Rendering this text
 * at that tracking in a fallback system font makes the `q` overlap the dot,
 * which is exactly why the runtime component gates its text render on font
 * readiness and the generator supplies the Outfit TTF explicitly
 * (05.1-UI-SPEC row E2/loading).
 *
 * `fontWeight` is consumed by the RASTERISER only: resvg matches a font by
 * weight against its font database, so the SVG it renders must declare 800. The
 * RN component deliberately omits it — there the family key already IS the
 * Outfit 800 file, and a numeric weight on top of a weight-specific family is
 * exactly what produces faux-bold (D-10 consumer rule in `lib/fonts.ts`).
 */
export const GLYPH_TEXT = {
  char: 'q',
  x: 400,
  y: 600,
  fontSize: 620,
  fontWeight: '800',
  letterSpacing: -30,
  textAnchor: 'middle',
} as const;

/** The solid dot — `docs/quiks_CI.html:32`. Pure geometry, no font dependency. */
export const GLYPH_DOT = {
  cx: 700,
  cy: 530,
  r: 52,
} as const;

/**
 * The `<Defs>` identifier the glyph fills from. Namespaced rather than the CI
 * bundle's bare `sunset`, so it cannot collide with another gradient id in the
 * same SVG document.
 */
export const GLYPH_GRADIENT_ID = 'quiksSunsetGlyph';

/** Height that keeps {@link GLYPH_ASPECT_RATIO} for a given render width. */
export function glyphHeightForWidth(width: number): number {
  return width / GLYPH_ASPECT_RATIO;
}

/** Width that keeps {@link GLYPH_ASPECT_RATIO} for a given render height. */
export function glyphWidthForHeight(height: number): number {
  return height * GLYPH_ASPECT_RATIO;
}
