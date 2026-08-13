import { describe, expect, it } from 'vitest';

import { coldStartRedirectHref, resolveColdStartRedirect } from '../cold-start-redirect';

describe('resolveColdStartRedirect (first-login-unmatched-route)', () => {
  it('THE regression — empty state (no href, no slug) resolves to Start, not a silent fall-through', () => {
    // Fresh account, no saved festival, no deep link: the cold-start effect
    // MUST navigate explicitly to /start. Previously this branch did nothing,
    // leaving the router on the unmatched root path `/` → Unmatched Route.
    expect(resolveColdStartRedirect(null, undefined)).toEqual({ kind: 'start' });
  });

  it('a persisted active-festival slug opens that festival home', () => {
    expect(resolveColdStartRedirect(null, 'frequency-2026')).toEqual({
      kind: 'active-festival',
      slug: 'frequency-2026',
    });
  });

  it('a captured deep-link href is replayed', () => {
    expect(resolveColdStartRedirect('/f/nova-sound-2026', undefined)).toEqual({
      kind: 'deep-link',
      href: '/f/nova-sound-2026',
    });
  });

  it('the deep-link href takes STRICT precedence over a persisted slug (REVIEW 05-05 HIGH)', () => {
    expect(resolveColdStartRedirect('/f/nova-sound-2026', 'frequency-2026')).toEqual({
      kind: 'deep-link',
      href: '/f/nova-sound-2026',
    });
  });

  // Boundary neighbors around the empty-state equivalence class — the fault
  // was the "both empty" corner; guard the adjacent single-empty cases and the
  // empty-string edge so a future refactor can't silently reintroduce a
  // no-navigation fall-through.
  it('an empty-string href is not treated as a deep link (falls through to slug/start)', () => {
    expect(resolveColdStartRedirect('', undefined)).toEqual({ kind: 'start' });
    expect(resolveColdStartRedirect('', 'frequency-2026')).toEqual({
      kind: 'active-festival',
      slug: 'frequency-2026',
    });
  });

  it('an empty-string slug is not treated as an active festival (falls through to start)', () => {
    expect(resolveColdStartRedirect(null, '')).toEqual({ kind: 'start' });
  });
});

describe('coldStartRedirectHref (first-login-unmatched-route round 2)', () => {
  // The single `/` owner (app/index, round 3) redirects to this href. A wrong
  // literal here silently reintroduces an Unmatched Route, so each branch is
  // pinned explicitly.
  it('maps the empty-state start target to /start', () => {
    expect(coldStartRedirectHref({ kind: 'start' })).toBe('/start');
  });

  it('maps an active-festival slug to its festival-home path', () => {
    expect(coldStartRedirectHref({ kind: 'active-festival', slug: 'frequency-2026' })).toBe(
      '/f/frequency-2026',
    );
  });

  it('replays a deep-link href verbatim', () => {
    expect(coldStartRedirectHref({ kind: 'deep-link', href: '/f/nova-sound-2026' })).toBe(
      '/f/nova-sound-2026',
    );
  });

  // End-to-end: the resolver + mapper together produce the exact href the
  // authenticated `/` redirect uses, for the reported fresh-account trigger.
  it('THE regression, end to end — fresh account (no href, no slug) redirects `/` to /start', () => {
    expect(coldStartRedirectHref(resolveColdStartRedirect(null, undefined))).toBe('/start');
  });
});
