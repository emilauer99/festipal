import { describe, expect, it } from 'vitest';
import type { Href } from 'expo-router';

import type { AuthState } from '../auth-state';
import { rootRedirectTarget } from '../root-redirect';

/**
 * first-login-unmatched-route (round 3) — pins the single `/` owner's redirect
 * decision. This is the mutation-killable surface of the fix; the actual
 * route-collision behavior (only one file resolves `/`, mounted under every
 * guard) has NO node-env runtime surface (no RN renderer / no expo-router
 * navigation) and is verified on-device.
 *
 * oracle_type: specified — the expected landing per auth state is the bug
 * report's explicit contract (fresh account → /welcome → complete-profile →
 * home).
 */
describe('rootRedirectTarget', () => {
  it('sends an unauthenticated visitor to the Welcome screen', () => {
    expect(rootRedirectTarget({ status: 'unauthenticated' }, null)).toBe('/welcome');
  });

  it('sends a session-without-profile visitor to complete their profile', () => {
    expect(rootRedirectTarget({ status: 'authenticated-no-profile' }, null)).toBe(
      '/complete-profile',
    );
  });

  it('sends a fully authenticated visitor to the resolved cold-start target (Home)', () => {
    // The end-to-end regression: fresh account, no deep link, no active festival
    // → coldStartRedirectHref resolves to '/home' → app/index redirects there,
    // instead of dead-ending on the Unmatched Route screen for `/`.
    expect(rootRedirectTarget({ status: 'authenticated' }, '/home' as Href)).toBe('/home');
  });

  it('forwards a resolved active-festival / deep-link target verbatim when authenticated', () => {
    expect(rootRedirectTarget({ status: 'authenticated' }, '/f/nova-sound-2026' as Href)).toBe(
      '/f/nova-sound-2026',
    );
  });

  it('returns null while the authenticated cold-start target is still resolving (shows splash frame)', () => {
    // Boundary: the one frame between app/index mounting on the authenticated
    // transition and the _layout effect storing the target. Must NOT redirect
    // to a wrong place — it holds the brand splash frame until the target lands.
    expect(rootRedirectTarget({ status: 'authenticated' }, null)).toBeNull();
  });

  it('returns null for the loading state (never rendered — splash held upstream)', () => {
    expect(rootRedirectTarget({ status: 'loading' }, null)).toBeNull();
  });

  it('ignores a stale cold-start target for non-authenticated states', () => {
    // Boundary: even if a target lingered in context, an unauthenticated /
    // authenticated-no-profile visitor must still be routed by auth state, never
    // leaked into an authenticated destination.
    const stale = '/f/leaked-festival' as Href;
    const authNoProfile: AuthState = { status: 'authenticated-no-profile' };
    expect(rootRedirectTarget({ status: 'unauthenticated' }, stale)).toBe('/welcome');
    expect(rootRedirectTarget(authNoProfile, stale)).toBe('/complete-profile');
  });
});
