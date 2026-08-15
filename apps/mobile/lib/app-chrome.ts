/**
 * 09-04 (D-03, App Header Contract) — pure derivation of `AppHeader`'s
 * visibility and state from Expo Router's own segment array. Framework-free
 * (no React / expo-router import) so it stays unit-testable in the node-env
 * Vitest runner, mirroring `lib/deep-link.ts` and `lib/festival-gate.ts`'s
 * shape.
 *
 * T-09-13 (Information Disclosure, high, mitigate) — this function is the
 * WHOLE mitigation: it falls back to `{ visible: false }` for every unknown
 * first segment and for both auth-flow guard groups, the splash surface and
 * the root route. There is no default-visible branch, so a header can never
 * render above an unauthenticated screen by construction, not by a
 * caller-supplied condition at the mount site.
 */

/**
 * Root-level Stack.Screen segments (`app/_layout.tsx`'s authenticated
 * `Stack.Protected` block) over which the header shows its PUSH state. Kept
 * in sync BY HAND with those registrations — same convention as
 * `app/_layout.tsx`'s own `AUTH_FLOW_PATHS` comment: adding a new root-level
 * push screen without adding its resolved first segment here means the
 * header falls back to invisible for it instead of erroring loudly.
 *
 * `friend-detail` is deliberately NOT a member — it keeps its own modal
 * header (`app/friend-detail.tsx`'s `Stack.Screen` options), so
 * `resolveHeaderContext` must return an invisible state for it, not a push
 * state (09-04-PLAN.md Flagged Assumption 1).
 *
 * 09-05 (D-16) — `friends-find` joins this set: the root-level push
 * registration of `app/friends-find.tsx`, which re-exports the SAME
 * `(tabs)/friends.tsx` screen the global Friends tab already mounts. Adding
 * it here is what gives that second mount position its push header/back
 * state instead of falling back to invisible.
 *
 * 09-06 (D-09) — `cashless` joins this set: the root-level push registration
 * of `app/cashless.tsx`, the Cashless WebView screen.
 *
 * 11-01 (Task 3) — `activity-detail` joins this set: the root-level push
 * registration of `app/activity-detail.tsx`, the Activity detail read
 * screen.
 *
 * 11-04 (Task 3) — `activity-create` joins this set: the root-level push
 * registration of `app/activity-create.tsx`, the Create-/Klon-Screen. This
 * closes the tracer's last open route — the Aktivität-starten CTA
 * (`activities.tsx`) finally has a registered destination to push to.
 */
export const PUSH_SCREEN_ROUTES = new Set([
  'profil',
  'friends-qr',
  'friends-find',
  'cashless',
  'activity-detail',
  'activity-create',
] as const);

export type PushScreenRoute =
  | 'profil'
  | 'friends-qr'
  | 'friends-find'
  | 'cashless'
  | 'activity-detail'
  | 'activity-create';

/**
 * First segments over which the header NEVER appears, regardless of what
 * else is on screen: the two auth-flow guard groups, the single `/` owner
 * and the friend-detail modal. Not consulted by `resolveHeaderContext` below
 * (its fallback already covers every one of these) — kept as an explicit,
 * named export purely so this set of "known hidden" routes is documented
 * and can be asserted against directly in tests, the same role
 * `AUTH_FLOW_PATHS` plays in `app/_layout.tsx`.
 */
export const HEADER_HIDDEN_ROUTES = new Set(['(auth)', '(profile-setup)', 'index', 'friend-detail']);

export type HeaderContext =
  | { visible: false }
  | { visible: true; kind: 'global' }
  | { visible: true; kind: 'festival' }
  | { visible: true; kind: 'push'; route: PushScreenRoute };

/**
 * Derives `AppHeader`'s visibility/state from the segment array
 * `useSegments()` returns. An empty array (splash) and an unknown first
 * segment both fall to `{ visible: false }` — the function never falls back
 * to a VISIBLE state, since a header over an unrecognized screen is worse
 * than no header at all (T-09-13).
 */
export function resolveHeaderContext(segments: readonly string[]): HeaderContext {
  const first = segments[0];

  if (first === undefined) return { visible: false };
  if (first === '(tabs)') return { visible: true, kind: 'global' };
  if (first === '(festival)') return { visible: true, kind: 'festival' };
  if (segments.length === 1 && PUSH_SCREEN_ROUTES.has(first as PushScreenRoute)) {
    return { visible: true, kind: 'push', route: first as PushScreenRoute };
  }

  return { visible: false };
}
