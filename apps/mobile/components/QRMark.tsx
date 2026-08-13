import { useLingui } from '@lingui/react/macro';
import Svg, { Rect } from 'react-native-svg';

import { buildQrMatrix, QR_QUIET_ZONE_MODULES } from '../lib/qr-matrix';
import { useTheme } from '../lib/theme-context';

export type QRMarkProps = {
  /** The already-encoded payload, e.g. `encodeQuiksCodePayload(username)`. */
  payload: string;
  /** Rendered pixel width/height — always square. */
  size: number;
};

/**
 * 08-04 / D-13 — the real, scannable quiks-code mark (UI-SPEC § QR & Camera
 * Contract). Renders `null` when `buildQrMatrix` can't encode the payload
 * (empty/whitespace) — the CALLER decides what edge-case copy takes its
 * place; this component never invents a fallback graphic.
 *
 * SCANNABILITY EXCEPTION (documented, not an oversight): the backdrop and
 * the modules below are painted with FIXED, mode-invariant colours —
 * `colors.primaryForeground` (`#FFFFFF`) and `colors.textOnGradient`
 * (`#0C0E13`) — resolved through `useTheme()` like every other colour in
 * this app (05.1 D-01), but deliberately NOT swapped for dark-mode
 * equivalents. A theme-tinted or inverted QR mark is a real scan-failure
 * risk on a stranger's camera: UI-SPEC § QR & Camera Contract names this
 * exact surface as its one explicit exception to "no raw hex, always
 * mode-aware" — the values still come from `tokens.ts`, so a CI change to
 * either token still lands in one place, but neither ever tracks dark mode.
 *
 * The quiet zone (`QR_QUIET_ZONE_MODULES`) is added HERE, in the SVG
 * viewBox, not inside `buildQrMatrix` — the matrix stays exactly what the
 * encoder computed, and this component owns the presentation-only margin a
 * scanner needs around it.
 */
export function QRMark({ payload, size }: QRMarkProps) {
  const { t } = useLingui();
  const { colors } = useTheme();
  const matrix = buildQrMatrix(payload);

  if (matrix === null) return null;

  const moduleCount = matrix.length;
  const viewBoxSize = moduleCount + QR_QUIET_ZONE_MODULES * 2;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      accessible
      accessibilityLabel={t`Your quiks code as a scannable QR mark`}
    >
      <Rect x={0} y={0} width={viewBoxSize} height={viewBoxSize} fill={colors.primaryForeground} />
      {matrix.map((row, rowIndex) =>
        row.map((isDark, colIndex) =>
          isDark ? (
            <Rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex + QR_QUIET_ZONE_MODULES}
              y={rowIndex + QR_QUIET_ZONE_MODULES}
              width={1}
              height={1}
              fill={colors.textOnGradient}
            />
          ) : null,
        ),
      )}
    </Svg>
  );
}
