import { createContext, useContext } from 'react';

/**
 * Pitfall B / PITFALLS.md #5 — a route guard MUST branch on more than
 * `!!session`. A brand-new OTP account's `GET /me` returns `profile: null`
 * (Phase 2), so there are FOUR states, not two: still resolving, no session,
 * session-but-no-profile, and fully authenticated. `Stack.Protected` guards in
 * `app/_layout.tsx` are driven by this discriminated union, never a boolean
 * flag.
 */
export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated-no-profile' }
  | { status: 'authenticated' };

/**
 * first-login-unmatched-route (round 3) — exposes the root layout's resolved
 * `AuthState` to the single `/` owner (`app/index.tsx`) so it can pick the
 * correct declarative redirect. Kept as a plain context (no global state
 * library) mirroring the `ColdStartTargetContext` idiom.
 *
 * Default `{ status: 'loading' }` is never actually observed by `app/index`:
 * the root layout holds the splash (never mounts the `<Stack>`) until auth
 * resolves, so `app/index` only ever renders with a settled state.
 */
export const AuthStateContext = createContext<AuthState>({ status: 'loading' });

export function useAuthState(): AuthState {
  return useContext(AuthStateContext);
}

/** What `app/_layout.tsx`'s resolve effect should do next. */
export type AuthResolveStep =
  /** Nothing to go on yet — stay 'loading' (the cold-start timeout is the backstop). */
  | 'wait'
  /** No credential exists — route to (auth). */
  | 'unauthenticated'
  /** A credential exists — ask `GET /me`, the real authority, what it is worth. */
  | 'ask-me';

/**
 * otp-login-stuck-code-screen — the guard must NOT depend on better-auth's
 * session atom alone.
 *
 * That atom is a single point of failure: it has exactly one subscriber app-wide,
 * and a nanostores lazy-mount re-entrancy (documented in `lib/auth-client.ts`) can
 * leave it permanently unable to refetch, so a successful OTP sign-in never
 * produced a session and the guard never moved off `/verify`.
 *
 * `authClient.getCookie()` is the earlier and stronger signal: `@better-auth/expo`
 * writes the session cookie into SecureStore SYNCHRONOUSLY, before it notifies the
 * atom, and reads it back synchronously — the device log confirmed the cookie is
 * already present the moment `signIn.emailOtp()` resolves. Treating it as a valid
 * credential and letting `GET /me` adjudicate mirrors the existing
 * `forceUnauthenticated()` precedent (better-auth only broadcasts on a SUCCESSFUL
 * logout, so logout already needed an app-level backstop — login was simply missing
 * its counterpart).
 *
 * `sessionPending` is only allowed to hold the decision when there is no cookie at
 * all; a corrupted atom can leave `isPending` true forever, and gating on it in the
 * has-cookie case would strand a logged-in visitor on the splash.
 */
export function nextAuthResolveStep(input: {
  hasSession: boolean;
  sessionPending: boolean;
  hasSessionCookie: boolean;
}): AuthResolveStep {
  if (input.hasSessionCookie || input.hasSession) return 'ask-me';
  if (input.sessionPending) return 'wait';
  return 'unauthenticated';
}
