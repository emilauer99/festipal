import { describe, expect, it } from 'vitest';

import { isIgnorableDeepLinkRoute, reconstructDeepLinkRoute } from '../deep-link';

const APP_SCHEME = 'quiks';

describe('reconstructDeepLinkRoute (G-05-7 — pure route reconstruction from Linking.parse output)', () => {
  it('rejoins hostname+path for the custom double-slash form (quiks://f/nova-sound-2026)', () => {
    // Mirrors expo-linking@57 Linking.parse('quiks://f/nova-sound-2026'):
    // new URL() treats 'f' as the authority (hostname), so the ':slug'
    // segment lands alone in `path` — dropping hostname loses 'f/' (G-05-7).
    const parsed = { scheme: 'quiks', hostname: 'f', path: 'nova-sound-2026' };
    expect(reconstructDeepLinkRoute(parsed, APP_SCHEME)).toBe('f/nova-sound-2026');
  });

  it('keeps the full path for the custom triple-slash form (quiks:///f/nova-sound-2026)', () => {
    // Mirrors expo-linking@57 Linking.parse('quiks:///f/nova-sound-2026'):
    // the explicit empty-authority slash yields hostname=null and the whole
    // 'f/nova-sound-2026' already lands in `path`.
    const parsed = { scheme: 'quiks', hostname: null, path: 'f/nova-sound-2026' };
    expect(reconstructDeepLinkRoute(parsed, APP_SCHEME)).toBe('f/nova-sound-2026');
  });

  it('never prepends the hostname for an https deep link (https://quiks.app/f/nova-sound-2026)', () => {
    // Mirrors expo-linking@57 Linking.parse('https://quiks.app/f/nova-sound-2026'):
    // hostname is the real domain ('quiks.app') and must NEVER be joined
    // onto the route — only the custom app scheme rejoins hostname.
    const parsed = { scheme: 'https', hostname: 'quiks.app', path: 'f/nova-sound-2026' };
    expect(reconstructDeepLinkRoute(parsed, APP_SCHEME)).toBe('f/nova-sound-2026');
  });

  it('normalizes an auth-flow path identically for both custom-scheme forms (quiks://email)', () => {
    // Mirrors expo-linking@57 Linking.parse('quiks://email'): single
    // segment is 'f'-less, so it lands entirely in hostname.
    const doubleSlash = { scheme: 'quiks', hostname: 'email', path: null };
    expect(reconstructDeepLinkRoute(doubleSlash, APP_SCHEME)).toBe('email');
  });

  it('normalizes an auth-flow path identically for both custom-scheme forms (quiks:///email)', () => {
    // Mirrors expo-linking@57 Linking.parse('quiks:///email'): explicit
    // empty authority, so the single segment lands entirely in path.
    const tripleSlash = { scheme: 'quiks', hostname: null, path: 'email' };
    expect(reconstructDeepLinkRoute(tripleSlash, APP_SCHEME)).toBe('email');
  });

  it('returns null for the bare root custom-scheme link (quiks:///)', () => {
    // Mirrors expo-linking@57 Linking.parse('quiks:///'): no authority,
    // no path — nothing to route to.
    const parsed = { scheme: 'quiks', hostname: null, path: null };
    expect(reconstructDeepLinkRoute(parsed, APP_SCHEME)).toBeNull();
  });

  it('only rejoins hostname when parsed.scheme matches the passed appScheme param exactly', () => {
    // Same shape as the double-slash case, but appScheme does not match —
    // hostname must NOT be rejoined (proves the scheme check uses the param,
    // not a hardcoded 'quiks' literal).
    const parsed = { scheme: 'quiks', hostname: 'f', path: 'nova-sound-2026' };
    expect(reconstructDeepLinkRoute(parsed, 'some-other-scheme')).toBe('nova-sound-2026');
  });

  it('rejoins hostname for a non-default custom scheme when it matches appScheme', () => {
    // Proves the custom-scheme check is fully parameterized on appScheme,
    // not hardcoded to the literal 'quiks' string.
    const parsed = { scheme: 'other-app', hostname: 'f', path: 'nova-sound-2026' };
    expect(reconstructDeepLinkRoute(parsed, 'other-app')).toBe('f/nova-sound-2026');
  });
});

/**
 * first-login-unmatched-route (round 4 — confirmed root cause) — the Expo Dev
 * Client launches the app via `quiks:///expo-development-client/?url=<host>`,
 * which `reconstructDeepLinkRoute` maps to the route `expo-development-client`.
 * Without this predicate the capture effect stored it as a pending destination
 * and replayed it on the authenticated transition, dead-ending on Expo's
 * Unmatched Route screen on EVERY dev launch (the reported "every time" symptom).
 *
 * oracle_type: specified — an Expo-internal launch path must never be captured
 * as an app route; app routes still are.
 */
describe('isIgnorableDeepLinkRoute (round 4 — never capture Expo tooling launch links)', () => {
  it('ignores the Expo Dev Client launch route (expo-development-client)', () => {
    expect(isIgnorableDeepLinkRoute('expo-development-client')).toBe(true);
  });

  it('ignores the Expo Dev Client launch route even with trailing segments', () => {
    // Real link reconstructs to just the first segment, but the predicate must
    // also hold if a trailing segment survives reconstruction.
    expect(isIgnorableDeepLinkRoute('expo-development-client/bundle')).toBe(true);
  });

  it("ignores Expo's internal _expo namespace", () => {
    expect(isIgnorableDeepLinkRoute('_expo/loading')).toBe(true);
  });

  it('ignores the Expo Go -- deep-link separator prefix', () => {
    expect(isIgnorableDeepLinkRoute('--/f/nova-sound-2026')).toBe(true);
  });

  it('tolerates a leading slash on the reconstructed route', () => {
    expect(isIgnorableDeepLinkRoute('/expo-development-client')).toBe(true);
  });

  it('does NOT ignore a real festival deep-link route (regression guard)', () => {
    // The load-bearing negative case: a genuine app route must still be
    // captured/replayed, so the fix cannot swallow real deep links.
    expect(isIgnorableDeepLinkRoute('f/nova-sound-2026')).toBe(false);
  });

  it('does NOT ignore a route that merely contains an ignored word downstream', () => {
    // Only the FIRST segment gates ignoring — a route like
    // `f/expo-development-client` (hypothetical festival slug) is a real route.
    expect(isIgnorableDeepLinkRoute('f/expo-development-client')).toBe(false);
  });

  it('does NOT ignore the empty root route', () => {
    expect(isIgnorableDeepLinkRoute('')).toBe(false);
  });
});
