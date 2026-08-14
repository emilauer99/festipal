/**
 * 09-06 (D-09, ADR-011) — pure Cashless-address validation and origin
 * derivation. Framework-free (no React, no expo-router, no
 * react-native-webview import) so it stays unit-testable in the node-env
 * Vitest runner, mirroring `lib/deep-link.ts`'s pure-fn shape.
 *
 * WHY THE CHECK LIVES HERE, NOT IN THE SCREEN: ADR-011 hides the Cashless
 * entry entirely when the festival has no configured address — the entry
 * point must not exist and then fail, it must never exist in the first
 * place. `apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx` calls this
 * BEFORE deciding whether to render the tile at all; `apps/mobile/app/
 * cashless.tsx` calls it AGAIN on the value it actually receives (T-09-23) —
 * a route param is a mutable value, so "trust no passed-through value" holds
 * even though the tile only ever passes an already-validated result.
 *
 * Only `https:` is accepted (T-09-23) and only when a non-empty host is
 * present — `javascript:`, `file:`, `data:` and the app's own custom scheme
 * are all rejected by construction (wrong protocol), not by an explicit
 * denylist.
 */

export type CashlessTarget = {
  /** The unmodified, validated address — passed to the WebView's `source.uri`. */
  uri: string;
  /** `${protocol}//${host}` — used to build the WebView's `originWhitelist`. */
  origin: string;
  /** Host (including port, if present) — used for the same-origin navigation guard. */
  host: string;
};

/**
 * Resolves a raw, possibly-`null`/`undefined` Cashless address into a
 * validated `{ uri, origin, host }` triple, or `null` when the address is
 * absent, malformed or not HTTPS. Never throws — the built-in `URL` parser
 * runs inside a `try`/`catch` so an unparsable string resolves to `null`
 * exactly like a missing one, instead of propagating a parse exception into
 * a caller that only expects a value or `null`.
 */
export function resolveCashlessTarget(raw: string | null | undefined): CashlessTarget | null {
  if (raw === null || raw === undefined) return null;

  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  // Only HTTPS is accepted — rejects http:, javascript:, file:, data: and the
  // app's own custom scheme (quiks:) all in one check, without a denylist.
  if (parsed.protocol !== 'https:') return null;

  // `URL.host` already includes a non-default port ('pay.example.com:8443'),
  // so the origin/host pair below carries the port through unchanged — two
  // addresses that differ only by path resolve to the SAME origin.
  if (parsed.host.length === 0) return null;

  return {
    uri: trimmed,
    origin: `${parsed.protocol}//${parsed.host}`,
    host: parsed.host,
  };
}
