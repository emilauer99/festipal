import { describe, expect, it } from 'vitest';

import { buildQrMatrix, QR_QUIET_ZONE_MODULES } from '../qr-matrix';

/** QR spec minimum: a version-1 mark is 21x21 modules. */
const MIN_MODULE_COUNT = 21;

/**
 * A finder pattern's outer 7x7 ring — top/bottom rows and left/right
 * columns of the block — is always fully dark by the QR spec. This is a
 * real structural assertion (08-04-PLAN `<behavior>`), not a snapshot: any
 * encoder producing a spec-compliant mark satisfies it.
 */
function finderBorderIsDark(matrix: boolean[][], rowOffset: number, colOffset: number): boolean {
  for (let i = 0; i < 7; i += 1) {
    const onTopOrBottomEdge = i === 0 || i === 6;
    for (let j = 0; j < 7; j += 1) {
      const onLeftOrRightEdge = j === 0 || j === 6;
      if (!onTopOrBottomEdge && !onLeftOrRightEdge) continue;
      if (!matrix[rowOffset + i]?.[colOffset + j]) return false;
    }
  }
  return true;
}

describe('QR_QUIET_ZONE_MODULES', () => {
  it('is the 4-module quiet zone the spec requires, kept out of the matrix itself', () => {
    expect(QR_QUIET_ZONE_MODULES).toBe(4);
  });
});

describe('buildQrMatrix', () => {
  it('returns null for an empty payload', () => {
    expect(buildQrMatrix('')).toBeNull();
  });

  it('returns null for a whitespace-only payload', () => {
    expect(buildQrMatrix('   ')).toBeNull();
  });

  it('returns a square matrix with equal-length rows, at least 21 modules wide', () => {
    const matrix = buildQrMatrix('quiks:u/feli');
    expect(matrix).not.toBeNull();
    const moduleCount = matrix!.length;
    expect(moduleCount).toBeGreaterThanOrEqual(MIN_MODULE_COUNT);
    for (const row of matrix!) {
      expect(row.length).toBe(moduleCount);
    }
  });

  it('places the three finder patterns at their canonical corners', () => {
    const matrix = buildQrMatrix('quiks:u/feli')!;
    const moduleCount = matrix.length;

    // Top-left
    expect(finderBorderIsDark(matrix, 0, 0)).toBe(true);
    // Top-right
    expect(finderBorderIsDark(matrix, 0, moduleCount - 7)).toBe(true);
    // Bottom-left
    expect(finderBorderIsDark(matrix, moduleCount - 7, 0)).toBe(true);
  });

  it('produces different matrices for different payloads', () => {
    const a = buildQrMatrix('quiks:u/feli');
    const b = buildQrMatrix('quiks:u/bob');
    expect(a).not.toEqual(b);
  });

  it('encodes a non-ASCII payload without throwing, differently from its ASCII sibling', () => {
    const ascii = buildQrMatrix('quiks:u/felix');
    let nonAscii: boolean[][] | null = null;
    expect(() => {
      nonAscii = buildQrMatrix('quiks:u/félix');
    }).not.toThrow();
    expect(nonAscii).not.toBeNull();
    expect(nonAscii).not.toEqual(ascii);
  });
});
