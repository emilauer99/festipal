import { createContext, useContext } from 'react';
import type { Festival } from '@quiks/contracts';

/**
 * 09-03 device-bug fix — the festival navigator's layout gate
 * (`app/(festival)/f/[festivalSlug]/_layout.tsx`) is the ONE place that
 * resolves `getFestival(slug)` (via `resolveFestivalGateState`,
 * `lib/festival-gate.ts`) and decides whether the `Tabs` navigator renders
 * at all (D-10). Tab screens that need the resolved festival read it from
 * THIS context instead of running their own `useQuery` against the same
 * key.
 *
 * Why this fixes the reported bug: two independent `useQuery` observers for
 * the same key can transiently disagree (e.g. one mid-retry after the tab
 * that mounted it was re-focused) even though they share a cache entry —
 * that transient disagreement was exactly what blanked the Dashboard tab on
 * tab re-entry. The layout NEVER unmounts across tab switches (only the
 * five tab screens underneath it do, per Expo Router's lazy-tab mounting),
 * so its own `festival` value stays stable for as long as the `Tabs`
 * navigator is showing at all — a context read can never desync from it.
 *
 * Same "safe default outside a provider" idiom as `useTheme()`/
 * `useSoonToast()`: the default value is `undefined` rather than a throw, so
 * a stray consumer outside the provider degrades gracefully instead of
 * crashing a screen.
 */
const FestivalContext = createContext<Festival | undefined>(undefined);

export const FestivalContextProvider = FestivalContext.Provider;

/** The current festival, as resolved by the layout gate. */
export function useFestivalContext(): Festival | undefined {
  return useContext(FestivalContext);
}
