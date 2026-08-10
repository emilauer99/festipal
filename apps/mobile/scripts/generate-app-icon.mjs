/**
 * Rasterises the quiks brand mark into the six committed app-icon PNGs
 * (05.1 D-07, ADR-023).
 *
 * ONE CONSTRUCTION, TWO CONSUMERS: every number below comes from
 * `../lib/wordmark-glyph.ts` and every colour from `@quiks/ui` tokens. Nothing
 * is re-transcribed here — that is the whole point of the shared module, and it
 * is what keeps the launcher icon and the on-screen `WordmarkGlyph` from
 * drifting apart.
 *
 * The `.ts` geometry module is imported directly: Node (>=22.18 / >=23.6, repo
 * requires >=22) strips erasable TypeScript syntax natively, so no build step or
 * loader is needed and there is no second copy of the numbers.
 *
 * DETERMINISM (threat T-05.1-13): the Outfit ExtraBold TTF from the installed
 * `@expo-google-fonts/outfit` package is passed explicitly and system-font
 * loading is DISABLED, so the output does not depend on which fonts the machine
 * running this happens to have. Re-running from a clean checkout reproduces the
 * same six files.
 *
 * FAILURE MODE (UI-SPEC E2/error): the PNGs are committed artefacts, so any
 * failure here fails THIS script (non-zero exit) and can never degrade the app
 * at runtime. `@resvg/resvg-js` is a devDependency for exactly that reason — no
 * build or runtime path depends on it.
 *
 * Run with: pnpm --filter ./apps/mobile run icons
 */
import console from 'node:console';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';
import { tokens } from '@quiks/ui';

import {
  GLYPH_DOT,
  GLYPH_GRADIENT_ID,
  GLYPH_TEXT,
  GLYPH_VIEWBOX,
  GLYPH_VIEWBOX_ATTR,
} from '../lib/wordmark-glyph.ts';

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(scriptDir, '..', 'assets');

// ---------------------------------------------------------------------------
// Colours — tokens only (ADR-015). Papier and Ink are the LIGHT set's surface
// and text roles: the mark lives on the brand's default (hell-first) surface,
// independent of whatever mode the app happens to render in.
// ---------------------------------------------------------------------------
const PAPIER = tokens.lightColors.bgApp;
const INK = tokens.lightColors.textPrimary;
const SUNSET = tokens.colors.gradientSunset;
const DOT_COLOR = tokens.colors.primary;

/**
 * The font's OWN family name, as embedded in the TTF — this is what resvg
 * matches against, and it is a different thing from `FONT_WORDMARK`
 * ('Outfit_800ExtraBold'), which is the key React Native registers the same
 * file under. The weight comes from the shared geometry module.
 */
const FONT_FAMILY = 'Outfit';

/**
 * The six outputs, at their EXISTING dimensions — no `app.json` icon path or
 * platform expectation changes, only the file contents.
 *
 * `coverage` is the share of the square canvas the mark's larger dimension
 * fills; `null` means "no mark on this layer".
 */
const OUTPUTS = [
  // iOS/Expo app icon: full-bleed Papier, mark generously inset so iOS' own
  // corner mask never clips it.
  { file: 'icon.png', size: 1024, background: PAPIER, coverage: 0.62 },
  // Expo splash image: shown small and centred, so it carries more air.
  { file: 'splash-icon.png', size: 1024, background: PAPIER, coverage: 0.55 },
  // Android adaptive FOREGROUND: transparent, and deliberately conservative.
  // RESEARCH Assumptions Log A1 flags the exact safe-zone percentage as
  // unverified; at this coverage the mark's diagonal stays near 55% of the
  // canvas, well inside the ~61% guaranteed-visible circle. Confirm on a real
  // Android launcher in plan 05.1-07.
  { file: 'android-icon-foreground.png', size: 512, background: null, coverage: 0.42 },
  // Android adaptive BACKGROUND: solid Papier, no mark.
  { file: 'android-icon-background.png', size: 512, background: PAPIER, coverage: null },
  // Android MONOCHROME (themed icons): single-colour opaque silhouette on
  // transparent — no gradient. Android applies its own tint to the alpha.
  {
    file: 'android-icon-monochrome.png',
    size: 432,
    background: null,
    coverage: 0.42,
    silhouette: INK,
  },
  { file: 'favicon.png', size: 48, background: PAPIER, coverage: 0.72 },
];

/** Resolves the Outfit ExtraBold TTF inside the installed font package. */
function resolveOutfitExtraBold() {
  const packageJson = require.resolve('@expo-google-fonts/outfit/package.json');
  const ttf = path.join(path.dirname(packageJson), '800ExtraBold', 'Outfit_800ExtraBold.ttf');
  if (!existsSync(ttf)) {
    throw new Error(
      `Outfit ExtraBold TTF not found at ${ttf} — run pnpm install before generating icons.`,
    );
  }
  return ttf;
}

function gradientDefs() {
  const stops = SUNSET.stops
    .map((stop) => `<stop offset="${stop.offset}" stop-color="${stop.color}"/>`)
    .join('');
  const { x1, y1, x2, y2 } = SUNSET.vector;
  return `<defs><linearGradient id="${GLYPH_GRADIENT_ID}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops}</linearGradient></defs>`;
}

/** The mark itself, in the shared 1200x800 coordinate space. */
function markElements(silhouette) {
  const glyphFill = silhouette ?? `url(#${GLYPH_GRADIENT_ID})`;
  const dotFill = silhouette ?? DOT_COLOR;
  return (
    `<text x="${GLYPH_TEXT.x}" y="${GLYPH_TEXT.y}"` +
    ` font-family="${FONT_FAMILY}" font-size="${GLYPH_TEXT.fontSize}"` +
    ` font-weight="${GLYPH_TEXT.fontWeight}" letter-spacing="${GLYPH_TEXT.letterSpacing}"` +
    ` text-anchor="${GLYPH_TEXT.textAnchor}" fill="${glyphFill}">${GLYPH_TEXT.char}</text>` +
    `<circle cx="${GLYPH_DOT.cx}" cy="${GLYPH_DOT.cy}" r="${GLYPH_DOT.r}" fill="${dotFill}"/>`
  );
}

function svgDocument(viewBox, size, body) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"` +
    ` viewBox="${viewBox}">${body}</svg>`
  );
}

/**
 * The mark's real ink bounds inside the shared viewBox, measured by the same
 * rasteriser that will draw it. Measuring instead of hard-coding a crop box is
 * what lets the square layouts centre on the MARK rather than on the CI
 * thumbnail's landscape frame (whose centre the mark does not sit on).
 */
function measureMark(fontOptions) {
  const probe = svgDocument(
    GLYPH_VIEWBOX_ATTR,
    GLYPH_VIEWBOX.width,
    `${gradientDefs()}${markElements(null)}`,
  );
  const bbox = new Resvg(probe, { font: fontOptions }).getBBox();
  if (!bbox || !(bbox.width > 0) || !(bbox.height > 0)) {
    throw new Error(
      'Could not measure the glyph bounds — the Outfit font most likely failed to load, ' +
        'which would rasterise the mark without its "q".',
    );
  }
  return bbox;
}

/**
 * A square box centred on the mark, sized so the mark's larger dimension covers
 * `coverage` of it. Rounded to 3 decimals so the emitted SVG (and therefore the
 * PNG bytes) stay byte-stable across runs.
 */
function squareBoxAround(bbox, coverage) {
  const round = (value) => Number(value.toFixed(3));
  const side = Math.max(bbox.width, bbox.height) / coverage;
  return {
    x: round(bbox.x + bbox.width / 2 - side / 2),
    y: round(bbox.y + bbox.height / 2 - side / 2),
    side: round(side),
  };
}

function filledRect(box, fill) {
  return `<rect x="${box.x}" y="${box.y}" width="${box.side}" height="${box.side}" fill="${fill}"/>`;
}

function buildSvg(output, bbox) {
  if (output.coverage === null) {
    // Mark-free layer (the Android adaptive background): a plain filled square.
    const box = { x: 0, y: 0, side: output.size };
    return svgDocument(
      `0 0 ${output.size} ${output.size}`,
      output.size,
      filledRect(box, output.background),
    );
  }

  const box = squareBoxAround(bbox, output.coverage);
  const viewBox = `${box.x} ${box.y} ${box.side} ${box.side}`;
  const background = output.background ? filledRect(box, output.background) : '';
  const silhouette = output.silhouette ?? null;
  // A silhouette needs no gradient at all — omitting the <defs> keeps the
  // monochrome layer provably single-coloured.
  const defs = silhouette ? '' : gradientDefs();
  return svgDocument(viewBox, output.size, `${defs}${background}${markElements(silhouette)}`);
}

function main() {
  const fontOptions = {
    fontFiles: [resolveOutfitExtraBold()],
    loadSystemFonts: false,
    defaultFontFamily: FONT_FAMILY,
  };

  const bbox = measureMark(fontOptions);
  mkdirSync(assetsDir, { recursive: true });

  for (const output of OUTPUTS) {
    const svg = buildSvg(output, bbox);
    const rendered = new Resvg(svg, {
      font: fontOptions,
      fitTo: { mode: 'width', value: output.size },
    }).render();

    if (rendered.width !== output.size || rendered.height !== output.size) {
      throw new Error(
        `${output.file}: rasterised ${rendered.width}x${rendered.height}, expected ` +
          `${output.size}x${output.size}.`,
      );
    }

    const target = path.join(assetsDir, output.file);
    writeFileSync(target, rendered.asPng());
    console.log(`wrote ${path.relative(process.cwd(), target)} (${output.size}x${output.size})`);
  }
}

try {
  main();
} catch (error) {
  console.error('icon generation failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
