import { createContext, useContext } from 'react';
import type { Href } from 'expo-router';

/**
 * first-login-unmatched-route (round 3) — bridges the cold-start redirect
 * DECISION (computed once in `app/_layout.tsx`'s guard-resolve effect, where
 * the pending deep-link href is consumed with the correct capture-before-
 * consume ordering and StrictMode-safe one-shot guard) to the single `/` owner
 * (`app/index.tsx`), which replays it declaratively via `<Redirect>`.
 *
 * Why a context rather than an imperative `router.replace` at the guard flip:
 * `router.replace` issued in the same commit as the `Stack.Protected` guard
 * flip loses the race against Expo Router's own reconciliation (it reset the
 * URL to `/`, which resolved — guard-agnostically — to a render-filtered screen
 * -> Unmatched Route — the round-1/2 regression). A single always-mounted `/`
 * owner (declared outside every guard) that redirects declaratively is
 * self-healing and does not depend on winning that race.
 *
 * `null` = not yet resolved (the effect has not run for this cold start) —
 * `app/index` shows a brand splash frame until the value arrives.
 */
export const ColdStartTargetContext = createContext<Href | null>(null);

export function useColdStartTarget(): Href | null {
  return useContext(ColdStartTargetContext);
}
