import { describe, expect, it } from 'vitest';

import { nextAuthResolveStep } from '../auth-state';

/**
 * Regression guard for `otp-login-stuck-code-screen`.
 *
 * The defect: after a successful OTP sign-in, `app/_layout.tsx` decided purely on
 * better-auth's session atom (`!session -> unauthenticated`). A nanostores
 * lazy-mount re-entrancy (see lib/auth-client.ts) can leave that atom permanently
 * unable to refetch, so `session` stayed null and `isPending` false forever — the
 * guard never flipped and the visitor was stranded on the code screen with a valid
 * server-side session.
 *
 * Oracle type: DERIVED — asserted against the contract "the SecureStore cookie is
 * the credential; `GET /me` is the authority", not against the implementation.
 */
describe('nextAuthResolveStep', () => {
  it('asks GET /me when only the cookie is present (the dead-atom case)', () => {
    // The exact device state: cookie written by @better-auth/expo, atom silent.
    expect(
      nextAuthResolveStep({ hasSession: false, sessionPending: false, hasSessionCookie: true }),
    ).toBe('ask-me');
  });

  it('asks GET /me on a cookie even while the atom still reports pending', () => {
    // A corrupted atom can hold `isPending: true` forever; gating on it would
    // strand a logged-in visitor on the splash until the cold-start timeout.
    expect(
      nextAuthResolveStep({ hasSession: false, sessionPending: true, hasSessionCookie: true }),
    ).toBe('ask-me');
  });

  it('asks GET /me when the atom delivers normally', () => {
    expect(
      nextAuthResolveStep({ hasSession: true, sessionPending: false, hasSessionCookie: true }),
    ).toBe('ask-me');
  });

  it('still trusts a delivered session if the cookie read comes back empty', () => {
    // Boundary: the two signals disagree. Never regress to "no cookie => logged
    // out" while better-auth is actively reporting a session.
    expect(
      nextAuthResolveStep({ hasSession: true, sessionPending: false, hasSessionCookie: false }),
    ).toBe('ask-me');
  });

  it('waits while no credential is readable yet and the atom is still resolving', () => {
    expect(
      nextAuthResolveStep({ hasSession: false, sessionPending: true, hasSessionCookie: false }),
    ).toBe('wait');
  });

  it('routes to unauthenticated once no credential exists and nothing is pending', () => {
    expect(
      nextAuthResolveStep({ hasSession: false, sessionPending: false, hasSessionCookie: false }),
    ).toBe('unauthenticated');
  });
});
