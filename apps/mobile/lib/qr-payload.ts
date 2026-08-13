/**
 * 08-04 / D-13 — the quiks-code payload format (Phase-7 D-17): namespaced
 * PLAINTEXT, deliberately NOT a deep link. `quiks:u/<username>` reads as
 * "this is a quiks code, here is the handle" and nothing more — a foreign
 * app or a malicious code can be shown to the visitor verbatim (it is just
 * text) and this module's parser cleanly rejects anything that is not
 * exactly this shape. Because it is plaintext, not a URL scheme, scanning a
 * stray quiks code with a THIRD-PARTY camera app never opens this app and
 * never touches the deep-link capture path in `app/_layout.tsx` — the same
 * path that produced the first-login-unmatched-route bug in Phase 5.
 *
 * Deliberately Lingui-/React-free, mirroring `lib/profile-meta-line.ts`'s
 * pure-function shape: the node-env Vitest runner proves this format without
 * a device.
 */

/** The one fixed prefix every valid quiks code payload starts with. */
export const QUIKS_CODE_PREFIX = 'quiks:u/';

/** Builds the payload a `QRMark` encodes for a given handle. */
export function encodeQuiksCodePayload(username: string): string {
  return `${QUIKS_CODE_PREFIX}${username}`;
}

/**
 * Parses a scanned/pasted string back into `{ username }`, or `null` if it
 * is not exactly one quiks code.
 *
 * Rules (08-04-PLAN `<behavior>`):
 * - outer whitespace is trimmed before any check;
 * - the prefix must sit at position 0 (never mid-string — `.../quiks:u/x`
 *   is rejected, so a foreign URL cannot smuggle a valid-looking suffix);
 * - the prefix match is case-insensitive, but the extracted username is
 *   returned exactly as scanned, unchanged;
 * - the remainder after the prefix must be non-empty and must not contain a
 *   second `/` — exactly one segment, so `quiks:u/feli/extra` is rejected
 *   rather than silently taking the first segment.
 */
export function parseQuiksCodePayload(raw: string): { username: string } | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  const prefixLength = QUIKS_CODE_PREFIX.length;
  const candidatePrefix = trimmed.slice(0, prefixLength);
  if (candidatePrefix.toLowerCase() !== QUIKS_CODE_PREFIX.toLowerCase()) return null;

  const rest = trimmed.slice(prefixLength);
  if (rest.length === 0) return null;
  if (rest.includes('/')) return null;

  return { username: rest };
}
