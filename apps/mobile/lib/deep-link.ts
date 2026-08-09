/**
 * G-05-7 — pure deep-link route reconstructor. Framework-free (no
 * React/expo-linking import) so it stays unit-testable in the node-env
 * Vitest runner, mirroring `lib/select-next-festival.ts`'s pure-fn shape.
 *
 * Root cause this fixes: `expo-linking`'s `Linking.parse()` is built on the
 * WHATWG `new URL()` parser. For a DOUBLE-slash custom-scheme link like
 * `festipal://f/nova-sound-2026`, `new URL()` treats the first path segment
 * ('f') as the URL AUTHORITY, not a path element — it lands in
 * `hostname`, and only ':slug' remains in `path`. Consuming `path` alone
 * (the pre-fix behavior) silently drops the 'f/' segment and the replayed
 * route hits Unmatched Route.
 *
 * The hostname is rejoined ONLY when `parsed.scheme` matches the app's own
 * custom scheme (`app.json`'s `expo.scheme`, passed in as `appScheme`).
 * app.json configures the custom scheme only this phase — no Android App
 * Links / iOS Universal Links — so an `https://` (or any other) scheme's
 * `hostname` is always a real DOMAIN and must never be prepended onto the
 * route.
 */

type ParsedDeepLink = {
  scheme?: string | null;
  hostname?: string | null;
  path?: string | null;
};

/** Strips leading/trailing slashes and drops empty segments. */
function normalizeSegment(segment: string | null | undefined): string | null {
  if (!segment) return null;
  const trimmed = segment.replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Reconstructs the full route (no leading slash) from `Linking.parse()`'s
 * component parts, or `null` when nothing remains (root link, e.g.
 * `festipal:///`).
 */
export function reconstructDeepLinkRoute(
  parsed: ParsedDeepLink,
  appScheme: string,
): string | null {
  const isCustomScheme = parsed.scheme === appScheme;
  // Only the app's own custom scheme ever has its authority (hostname)
  // rejoined into the route — an https (or other) hostname is a real domain.
  const rawSegments = isCustomScheme ? [parsed.hostname, parsed.path] : [parsed.path];
  const segments = rawSegments
    .map(normalizeSegment)
    .filter((segment): segment is string => segment !== null);
  return segments.length > 0 ? segments.join('/') : null;
}
