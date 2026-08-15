import { describe, expect, it } from 'vitest';

import { buildRouteUri } from '../geo-link';

describe('buildRouteUri (11-02, D-14 / ACT-05 / T-11-01)', () => {
  describe('platform branches', () => {
    it('builds an Android geo: URI', () => {
      expect(buildRouteUri({ lat: 47.5, lng: 13.5 }, 'android')).toBe('geo:47.5,13.5');
    });

    it('builds an iOS Apple Maps URL', () => {
      expect(buildRouteUri({ lat: 47.5, lng: 13.5 }, 'ios')).toBe(
        'https://maps.apple.com/?ll=47.5,13.5',
      );
    });
  });

  describe('sign combinations', () => {
    it('positive lat, positive lng', () => {
      expect(buildRouteUri({ lat: 47.5, lng: 13.5 }, 'android')).toBe('geo:47.5,13.5');
    });

    it('positive lat, negative lng', () => {
      expect(buildRouteUri({ lat: 47.5, lng: -13.5 }, 'android')).toBe('geo:47.5,-13.5');
    });

    it('negative lat, positive lng', () => {
      expect(buildRouteUri({ lat: -47.5, lng: 13.5 }, 'android')).toBe('geo:-47.5,13.5');
    });

    it('negative lat, negative lng', () => {
      expect(buildRouteUri({ lat: -47.5, lng: -13.5 }, 'android')).toBe('geo:-47.5,-13.5');
    });
  });

  describe('activityGeoSchema boundary values', () => {
    it('latitude lower bound -90', () => {
      expect(buildRouteUri({ lat: -90, lng: 0 }, 'android')).toBe('geo:-90,0');
    });

    it('latitude upper bound 90', () => {
      expect(buildRouteUri({ lat: 90, lng: 0 }, 'android')).toBe('geo:90,0');
    });

    it('longitude lower bound -180', () => {
      expect(buildRouteUri({ lat: 0, lng: -180 }, 'android')).toBe('geo:0,-180');
    });

    it('longitude upper bound 180', () => {
      expect(buildRouteUri({ lat: 0, lng: 180 }, 'android')).toBe('geo:0,180');
    });
  });

  describe('zero point', () => {
    it('renders (0, 0) as a well-formed URI, never as "unset"', () => {
      // The literal zero must not fall through a truthy/falsy check inside
      // buildRouteUri (D-14 acceptance: "darf nicht als 'nicht gesetzt'
      // durchfallen").
      expect(buildRouteUri({ lat: 0, lng: 0 }, 'android')).toBe('geo:0,0');
      expect(buildRouteUri({ lat: 0, lng: 0 }, 'ios')).toBe('https://maps.apple.com/?ll=0,0');
    });
  });

  describe('decimal formatting', () => {
    it('renders many decimal places without scientific notation or a locale comma', () => {
      const uri = buildRouteUri({ lat: 47.123456789012, lng: 13.987654321098 }, 'android');
      expect(uri).toBe('geo:47.123456789012,13.987654321098');
      expect(uri).not.toMatch(/e[+-]?\d/i);
      expect(uri).not.toContain(',,');
      // Only the single URI-level separator comma is allowed — no
      // locale-style decimal comma inside either number.
      expect(uri.split(',')).toHaveLength(2);
    });

    it('never emits scientific notation for a very small-magnitude coordinate', () => {
      // Number.prototype.toString() alone would render 0.0000001 as "1e-7".
      const uri = buildRouteUri({ lat: 0.0000001, lng: 0 }, 'android');
      expect(uri).not.toMatch(/e[+-]?\d/i);
      expect(uri.startsWith('geo:0.0000001,')).toBe(true);
    });
  });

  describe('determinism / no free-text input (T-11-01 invariant)', () => {
    it('the same coordinate pair and platform always yield the same URI', () => {
      const geo = { lat: 48.2082, lng: 16.3738 };
      const first = buildRouteUri(geo, 'android');
      const second = buildRouteUri(geo, 'android');
      expect(first).toBe(second);
    });

    it('the output depends only on lat/lng/platform — buildRouteUri has no parameter through which a free-text location, deep-link value, or WebView-read value could reach the URI', () => {
      // Structural proof: buildRouteUri's signature is (ActivityGeo, MapHandoffPlatform) — two
      // arguments only. Any third argument (e.g. a free-text place name) would be a TypeScript
      // compile error, not a runtime concern. This test proves the practical corollary: two
      // activities with identical coordinates but (hypothetically) different free-text locations
      // produce byte-identical URIs, because no such parameter exists to differentiate them.
      const geo = { lat: 48.2082, lng: 16.3738 };
      const uriForActivityA = buildRouteUri(geo, 'ios');
      const uriForActivityB = buildRouteUri(geo, 'ios');
      expect(uriForActivityA).toBe(uriForActivityB);
      expect(buildRouteUri.length).toBe(2);
    });
  });
});
