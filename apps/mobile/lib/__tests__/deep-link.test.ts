import { describe, expect, it } from 'vitest';

import { reconstructDeepLinkRoute } from '../deep-link';

const APP_SCHEME = 'festipal';

describe('reconstructDeepLinkRoute (G-05-7 — pure route reconstruction from Linking.parse output)', () => {
  it('rejoins hostname+path for the custom double-slash form (festipal://f/nova-sound-2026)', () => {
    // Mirrors expo-linking@57 Linking.parse('festipal://f/nova-sound-2026'):
    // new URL() treats 'f' as the authority (hostname), so the ':slug'
    // segment lands alone in `path` — dropping hostname loses 'f/' (G-05-7).
    const parsed = { scheme: 'festipal', hostname: 'f', path: 'nova-sound-2026' };
    expect(reconstructDeepLinkRoute(parsed, APP_SCHEME)).toBe('f/nova-sound-2026');
  });

  it('keeps the full path for the custom triple-slash form (festipal:///f/nova-sound-2026)', () => {
    // Mirrors expo-linking@57 Linking.parse('festipal:///f/nova-sound-2026'):
    // the explicit empty-authority slash yields hostname=null and the whole
    // 'f/nova-sound-2026' already lands in `path`.
    const parsed = { scheme: 'festipal', hostname: null, path: 'f/nova-sound-2026' };
    expect(reconstructDeepLinkRoute(parsed, APP_SCHEME)).toBe('f/nova-sound-2026');
  });

  it('never prepends the hostname for an https deep link (https://festipal.app/f/nova-sound-2026)', () => {
    // Mirrors expo-linking@57 Linking.parse('https://festipal.app/f/nova-sound-2026'):
    // hostname is the real domain ('festipal.app') and must NEVER be joined
    // onto the route — only the custom app scheme rejoins hostname.
    const parsed = { scheme: 'https', hostname: 'festipal.app', path: 'f/nova-sound-2026' };
    expect(reconstructDeepLinkRoute(parsed, APP_SCHEME)).toBe('f/nova-sound-2026');
  });

  it('normalizes an auth-flow path identically for both custom-scheme forms (festipal://email)', () => {
    // Mirrors expo-linking@57 Linking.parse('festipal://email'): single
    // segment is 'f'-less, so it lands entirely in hostname.
    const doubleSlash = { scheme: 'festipal', hostname: 'email', path: null };
    expect(reconstructDeepLinkRoute(doubleSlash, APP_SCHEME)).toBe('email');
  });

  it('normalizes an auth-flow path identically for both custom-scheme forms (festipal:///email)', () => {
    // Mirrors expo-linking@57 Linking.parse('festipal:///email'): explicit
    // empty authority, so the single segment lands entirely in path.
    const tripleSlash = { scheme: 'festipal', hostname: null, path: 'email' };
    expect(reconstructDeepLinkRoute(tripleSlash, APP_SCHEME)).toBe('email');
  });

  it('returns null for the bare root custom-scheme link (festipal:///)', () => {
    // Mirrors expo-linking@57 Linking.parse('festipal:///'): no authority,
    // no path — nothing to route to.
    const parsed = { scheme: 'festipal', hostname: null, path: null };
    expect(reconstructDeepLinkRoute(parsed, APP_SCHEME)).toBeNull();
  });

  it('only rejoins hostname when parsed.scheme matches the passed appScheme param exactly', () => {
    // Same shape as the double-slash case, but appScheme does not match —
    // hostname must NOT be rejoined (proves the scheme check uses the param,
    // not a hardcoded 'festipal' literal).
    const parsed = { scheme: 'festipal', hostname: 'f', path: 'nova-sound-2026' };
    expect(reconstructDeepLinkRoute(parsed, 'some-other-scheme')).toBe('nova-sound-2026');
  });

  it('rejoins hostname for a non-default custom scheme when it matches appScheme', () => {
    // Proves the custom-scheme check is fully parameterized on appScheme,
    // not hardcoded to the literal 'festipal' string.
    const parsed = { scheme: 'other-app', hostname: 'f', path: 'nova-sound-2026' };
    expect(reconstructDeepLinkRoute(parsed, 'other-app')).toBe('f/nova-sound-2026');
  });
});
