import type { ActivityGeo } from '@quiks/contracts';

/**
 * 11-02 (D-14, ACT-05) — pure map-handoff URI builder. Framework-free (no
 * React, no `react-native`, no `expo-*` import) so it stays unit-testable in
 * the node-env Vitest runner, mirroring `lib/cashless-url.ts`'s pure-fn shape
 * (09-06).
 *
 * WHY THE SIGNATURE IS THE HARDENING (T-11-01): the only two parameters are
 * the contract-typed, already-range-validated `ActivityGeo` object and a
 * platform discriminator. There is no `string` parameter anywhere in this
 * signature that a free-text place name, a deep-link value, or a value read
 * back out of a WebView could ever be threaded through — the construction is
 * safe by TYPE, not by caller discipline. `apps/mobile/app/activity-detail.tsx`
 * (11-05) must pass `activity.geo` (from `activityDetailSchema.geo`,
 * `activityGeoSchema`-bounded: `lat` in [-90, 90], `lng` in [-180, 180]) and
 * nothing else can compile in its place.
 */

/** The two platforms this app builds a native map-handoff URI for (D-14). */
export type MapHandoffPlatform = 'ios' | 'android';

/**
 * Renders a finite coordinate as a plain decimal string — never scientific
 * notation (`Number.prototype.toString()` switches to exponential form for
 * magnitudes below ~1e-6, which a coordinate with many decimal places can
 * reach) and never a locale-dependent decimal separator (this never calls
 * `toLocaleString`, so the host device's locale can never substitute a comma
 * for the point). Either form would produce a URI the receiving maps app
 * cannot parse.
 */
function formatCoordinate(value: number): string {
  if (!Number.isFinite(value)) {
    // activityGeoSchema only ever admits finite numbers over the wire, so
    // this only fires if a caller bypasses the type — fail loudly rather
    // than emit a malformed URI.
    throw new RangeError('buildRouteUri: coordinate must be a finite number');
  }

  const plain = value.toString();
  if (!/e/i.test(plain)) return plain;

  // Exponential fallback: 20 fractional digits comfortably covers full
  // double precision, then trailing zeros (and a now-bare trailing point)
  // are trimmed for a clean, still-locale-independent decimal string.
  const fixed = value.toFixed(20);
  return fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed;
}

/**
 * Builds the platform-native map-handoff URI for an activity's meeting
 * point (D-14): a `geo:` URI on Android, an Apple Maps HTTPS URL on iOS.
 * Only `geo.lat`/`geo.lng` are ever interpolated — nothing else reaches the
 * string. Deterministic and side-effect-free: the same `(geo, platform)`
 * pair always yields the same URI.
 */
export function buildRouteUri(geo: ActivityGeo, platform: MapHandoffPlatform): string {
  const lat = formatCoordinate(geo.lat);
  const lng = formatCoordinate(geo.lng);

  return platform === 'ios' ? `https://maps.apple.com/?ll=${lat},${lng}` : `geo:${lat},${lng}`;
}
