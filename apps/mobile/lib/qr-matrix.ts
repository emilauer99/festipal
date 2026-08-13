import qrcode from 'qrcode-generator';

/**
 * 08-04 / D-13 — turns a quiks-code payload into the boolean module matrix a
 * `QRMark` renders. Deliberately Lingui-/React-free (mirrors `qr-payload.ts`
 * and `lib/profile-meta-line.ts`'s pure shape) so it stays node-env-testable
 * without a device.
 *
 * `qrcode-generator` is reused as-is (no fork, no vendored copy) — see the
 * package-legitimacy checkpoint in 08-04-PLAN / 08-04-SUMMARY.md.
 */

/**
 * The quiet zone the QR spec requires around the mark, in MODULES. Kept OUT
 * of the returned matrix on purpose (08-04-PLAN action (3)): `QRMark` adds it
 * in its own SVG viewBox, so this module's output stays exactly what the
 * encoder computed — nothing here silently pads or crops it.
 */
export const QR_QUIET_ZONE_MODULES = 4;

/**
 * `qrcode-generator`'s own default byte encoder truncates every char code to
 * one byte (`c & 0xff`) — it does not throw on a non-ASCII handle, it just
 * silently mis-encodes it. The CJS build ships an alternate UTF-8 encoder
 * under `stringToBytesFuncs['UTF-8']` (08-04-PLAN action (3) names this hook
 * explicitly) — but the package's ESM build (`dist/qrcode.mjs`, the file
 * both Metro and Vite/Vitest resolve via the `import`/`module` condition,
 * verified against the installed 2.0.4) does not include that extension at
 * all: `stringToBytesFuncs` is `undefined` there. Per the plan's own
 * fallback rule ("gilt das Verhalten, nicht der Name"), this module carries
 * its own small UTF-8 encoder instead of depending on a build-specific hook,
 * and assigns it to `qrcode.stringToBytes` — the one property BOTH builds
 * expose and BOTH internally read from (`qr8BitByte`'s constructor calls
 * `qrcode.stringToBytes(data)` at `addData` time). This is a one-time,
 * module-load side effect on the package's own singleton — deliberate, not
 * an accidental global mutation: the whole app only ever needs one QR
 * byte-encoding policy.
 */
function encodeUtf8Bytes(input: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i += 1) {
    let codePoint = input.charCodeAt(i);
    // Combine a UTF-16 surrogate pair into its real code point before
    // encoding, so a character outside the Basic Multilingual Plane (e.g. an
    // emoji) encodes correctly instead of as two broken half-characters.
    if (codePoint >= 0xd800 && codePoint <= 0xdbff && i + 1 < input.length) {
      const low = input.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (low - 0xdc00);
        i += 1;
      }
    }
    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return bytes;
}

qrcode.stringToBytes = encodeUtf8Bytes;

/**
 * Builds the module matrix for `payload`, or `null` for an empty/
 * whitespace-only payload (there is nothing to scan).
 *
 * Type number is automatic (`0`) and error correction is level `M` — a
 * reasonable default for a mark that will usually sit behind a bit of glare
 * or a slightly off-angle phone camera, without inflating a short handle
 * payload into an unnecessarily dense mark.
 */
export function buildQrMatrix(payload: string): boolean[][] | null {
  if (payload.trim().length === 0) return null;

  const code = qrcode(0, 'M');
  code.addData(payload);
  code.make();

  const moduleCount = code.getModuleCount();
  const matrix: boolean[][] = [];
  for (let row = 0; row < moduleCount; row += 1) {
    const line: boolean[] = [];
    for (let col = 0; col < moduleCount; col += 1) {
      line.push(code.isDark(row, col));
    }
    matrix.push(line);
  }
  return matrix;
}
