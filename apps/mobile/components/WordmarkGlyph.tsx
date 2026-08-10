import Svg, { Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

import { FONT_WORDMARK } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import { useTheme } from '../lib/theme-context';
import {
  GLYPH_DOT,
  GLYPH_GRADIENT_ID,
  GLYPH_TEXT,
  GLYPH_VIEWBOX_ATTR,
  glyphHeightForWidth,
} from '../lib/wordmark-glyph';

/**
 * The quiks brand mark as a runtime SVG (05.1 D-06/D-07, UI-SPEC row E2).
 *
 * A Sunset-filled `q` plus a solid Beere dot, built from the ONE construction in
 * `lib/wordmark-glyph.ts` — the same module the app-icon rasteriser reads, so
 * the on-screen mark and the shipped PNGs cannot drift apart.
 *
 * FONT GATE (UI-SPEC E2/loading): the `q` is an SVG `<Text>` at the CI's tight
 * negative tracking, a tuning correct for Outfit ONLY. Until `useFontsReady()`
 * reports true, the text is not rendered at all — in a fallback system font the
 * glyph would overlap the dot. The surrounding `<Svg>` keeps its full size
 * either way, so nothing in the layout jumps when Outfit lands. The dot is pure
 * geometry and renders regardless.
 *
 * NON-BLOCKING CONTRACT (lib/fonts.ts): this gate is presentational only. It
 * never returns null from the tree, never gates `SplashScreen.hideAsync`, and
 * never participates in `app/_layout.tsx`'s `bootstrapped` gate.
 *
 * Sunset appears on exactly two surfaces in the whole product (CI §3/§7): this
 * mark and the Home hero card. Do not reach for `gradientSunset` elsewhere.
 */
export function WordmarkGlyph({ width }: { width: number }) {
  const { colors } = useTheme();
  const fontsReady = useFontsReady();
  const { vector, stops } = colors.gradientSunset;

  return (
    <Svg
      width={width}
      height={glyphHeightForWidth(width)}
      viewBox={GLYPH_VIEWBOX_ATTR}
      // Decorative: the wordmark text next to it already carries the brand name.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <LinearGradient
          id={GLYPH_GRADIENT_ID}
          x1={vector.x1}
          y1={vector.y1}
          x2={vector.x2}
          y2={vector.y2}
        >
          {stops.map((stop) => (
            <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </LinearGradient>
      </Defs>
      {fontsReady ? (
        <SvgText
          x={GLYPH_TEXT.x}
          y={GLYPH_TEXT.y}
          // D-10 CONSUMER RULE: `FONT_WORDMARK` IS the Outfit 800 file, so no
          // numeric `fontWeight` sits on top of it — that pairing is what makes
          // the device synthesise faux-bold. `GLYPH_TEXT.fontWeight` exists for
          // the rasteriser, which matches fonts by weight instead of by family
          // key (see lib/wordmark-glyph.ts).
          fontFamily={FONT_WORDMARK}
          fontSize={GLYPH_TEXT.fontSize}
          letterSpacing={GLYPH_TEXT.letterSpacing}
          textAnchor={GLYPH_TEXT.textAnchor}
          fill={`url(#${GLYPH_GRADIENT_ID})`}
        >
          {GLYPH_TEXT.char}
        </SvgText>
      ) : null}
      <Circle cx={GLYPH_DOT.cx} cy={GLYPH_DOT.cy} r={GLYPH_DOT.r} fill={colors.primary} />
    </Svg>
  );
}
