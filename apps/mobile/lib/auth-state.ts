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
