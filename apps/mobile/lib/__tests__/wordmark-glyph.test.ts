import { describe, expect, it } from 'vitest';
import { tokens } from '@quiks/ui';

import {
  GLYPH_ASPECT_RATIO,
  GLYPH_DOT,
  GLYPH_GRADIENT_ID,
  GLYPH_TEXT,
  GLYPH_VIEWBOX,
  GLYPH_VIEWBOX_ATTR,
  glyphHeightForWidth,
  glyphWidthForHeight,
} from '../wordmark-glyph';

/**
 * The construction contract of the brand mark, asserted WITHOUT a renderer —
 * the node-env Vitest runner does not render React Native (project lesson from
 * Phase 5). What is proven here is that the numbers the runtime component and
 * the icon rasteriser both read stay the transcribed CI values, and that the
 * glyph fills from a two-stop Amber → Beere Sunset.
 *
 * What is NOT proven here: anything about how the mark actually LOOKS on a
 * device or in a launcher. That is plan 05.1-07's acceptance.
 */
describe('wordmark glyph geometry', () => {
  it('keeps the CI thumbnail viewBox verbatim (docs/quiks_CI.html:23)', () => {
    expect(GLYPH_VIEWBOX).toEqual({ minX: 0, minY: 0, width: 1200, height: 800 });
    expect(GLYPH_VIEWBOX_ATTR).toBe('0 0 1200 800');
    expect(GLYPH_ASPECT_RATIO).toBe(1.5);
  });

  it('derives a size that preserves the aspect ratio in both directions', () => {
    expect(glyphHeightForWidth(1200)).toBe(800);
    expect(glyphWidthForHeight(800)).toBe(1200);
    expect(glyphWidthForHeight(glyphHeightForWidth(240))).toBeCloseTo(240, 10);
  });

  it('places the dot fully inside the viewBox', () => {
    expect(GLYPH_DOT.r).toBeGreaterThan(0);
    expect(GLYPH_DOT.cx - GLYPH_DOT.r).toBeGreaterThanOrEqual(GLYPH_VIEWBOX.minX);
    expect(GLYPH_DOT.cx + GLYPH_DOT.r).toBeLessThanOrEqual(
      GLYPH_VIEWBOX.minX + GLYPH_VIEWBOX.width,
    );
    expect(GLYPH_DOT.cy - GLYPH_DOT.r).toBeGreaterThanOrEqual(GLYPH_VIEWBOX.minY);
    expect(GLYPH_DOT.cy + GLYPH_DOT.r).toBeLessThanOrEqual(
      GLYPH_VIEWBOX.minY + GLYPH_VIEWBOX.height,
    );
  });

  it('anchors a single lowercase "q" inside the viewBox', () => {
    expect(GLYPH_TEXT.char).toBe('q');
    expect(GLYPH_TEXT.char).toHaveLength(1);
    expect(GLYPH_TEXT.textAnchor).toBe('middle');
    expect(GLYPH_TEXT.x).toBeGreaterThan(GLYPH_VIEWBOX.minX);
    expect(GLYPH_TEXT.x).toBeLessThan(GLYPH_VIEWBOX.minX + GLYPH_VIEWBOX.width);
    expect(GLYPH_TEXT.y).toBeGreaterThan(GLYPH_VIEWBOX.minY);
    expect(GLYPH_TEXT.y).toBeLessThan(GLYPH_VIEWBOX.minY + GLYPH_VIEWBOX.height);
    expect(GLYPH_TEXT.fontSize).toBeGreaterThan(0);
  });

  // The whole reason the runtime component gates its text render on font
  // readiness: this tracking is tuned for Outfit alone (UI-SPEC E2/loading).
  it('keeps the tracking negative and the weight at the CI display weight', () => {
    expect(GLYPH_TEXT.letterSpacing).toBeLessThan(0);
    expect(GLYPH_TEXT.fontWeight).toBe('800');
  });

  it('names its gradient without colliding with the CI bundle`s bare id', () => {
    expect(GLYPH_GRADIENT_ID).toMatch(/^[A-Za-z][\w-]*$/);
    expect(GLYPH_GRADIENT_ID).not.toBe('sunset');
  });
});

describe('the fill the glyph reads', () => {
  // Asserted against the tokens rather than against hex literals: a future stop
  // reorder or a recoloured brand hue has to fail HERE, not on a device.
  it('is a two-stop Sunset in the order Amber then Beere', () => {
    const { gradientSunset, secondary, primary } = tokens.colors;

    expect(gradientSunset.stops).toHaveLength(2);
    expect(gradientSunset.stops[0]?.color).toBe(secondary);
    expect(gradientSunset.stops[1]?.color).toBe(primary);
    expect(gradientSunset.stops[0]?.offset).toBe(0);
    expect(gradientSunset.stops[1]?.offset).toBe(1);
  });

  it('is mode-invariant, so the mark is one construction in both modes', () => {
    expect(tokens.lightColors.gradientSunset).toEqual(tokens.colors.gradientSunset);
    expect(tokens.lightColors.primary).toBe(tokens.colors.primary);
  });
});
