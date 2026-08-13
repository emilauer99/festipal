import type { useRouter } from 'expo-router';

/**
 * Deterministic, non-dead-end Back for any screen entered from a context
 * that might have left no in-app history — most notably a cold-start
 * `router.replace('/f/:slug')` (05-05's active-festival focus), which
 * REPLACES the navigation stack rather than pushing onto it, so a bare
 * `router.back()` would have nothing to go back to and either no-op or exit
 * the app (REVIEW 05-03/05-05 HIGH, FEST-04).
 *
 * G-05-5a — the no-history fallback targets the Start tab (`/start`),
 * not the Festivals tab: a cold-start-launched festival home's Back should
 * land where a fresh app open lands, matching `(tabs)/_layout.tsx`'s own
 * `initialRouteName="start"`. `/start` resolves because Expo Router route
 * groups (the `(tabs)` segment) never appear in the URL — this literal
 * matches `(tabs)/start.tsx` (09-01, NAV-03 rename, D-19). The `canGoBack()`
 * branch is UNCHANGED: a normal in-tab push-entry from the Festivals tab
 * still returns through history (FEST-04).
 *
 * `router` is typed from `useRouter`'s own return type (type-only import —
 * this module has no React runtime behavior of its own, importable
 * anywhere a router instance is already in scope).
 */
export function leaveFestival(router: ReturnType<typeof useRouter>): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/start');
  }
}
