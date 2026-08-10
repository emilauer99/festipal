import type { Href } from 'expo-router';

import type { AuthState } from './auth-state';

/**
 * first-login-unmatched-route (round 3) — pure mapping from the resolved auth
 * state to the concrete {@link Href} that the single `/` owner
 * (`app/index.tsx`) redirects to. Extracted as a pure function so the
 * load-bearing route literals (`/welcome`, `/complete-profile`) are unit-tested
 * and mutation-killable.
 *
 * Why a single `/` owner: Expo Router builds its URL→route linking map
 * STATICALLY from the whole file tree; for the root path it picks ONE leaf via
 * `matchForEmptyPath`, guard-agnostically (verified against expo-router 57
 * source — see the debug session). Having two files resolve `/` under
 * mutually-exclusive `Stack.Protected` guards means the static winner can be a
 * screen that is render-filtered out under the active guard → Expo Router's
 * Unmatched Route screen. `app/index.tsx` is declared OUTSIDE every guard, so it
 * is mounted in ALL states and always resolves `/`; this function tells it
 * where to hand off.
 *
 * Returns `null` only for the authenticated case while the cold-start target is
 * still being resolved (the one-shot effect in `app/_layout.tsx` has not stored
 * it yet) and for `loading` (never rendered — the splash is held upstream). The
 * `/` route shows a brand splash frame during that brief window rather than
 * flashing an unmatched screen.
 */
export function rootRedirectTarget(
  authState: AuthState,
  coldStartTarget: Href | null,
): Href | null {
  switch (authState.status) {
    case 'unauthenticated':
      return '/welcome';
    case 'authenticated-no-profile':
      return '/complete-profile';
    case 'authenticated':
      return coldStartTarget;
    case 'loading':
      return null;
  }
}
