import { createContext, useContext, type ReactNode } from 'react';

/**
 * Shares the single root `useAppFonts()` readiness boolean (see
 * apps/mobile/lib/fonts.ts) with any screen/component, so no screen
 * re-registers the fonts itself.
 *
 * NON-BLOCKING CONTRACT (Pitfall 5 / D-04, same as fonts.ts): this readiness
 * value gates ONLY which `fontFamily` a style resolves via
 * `resolveFontFamily` — it must NEVER be consumed as a splash-hide /
 * `bootstrapped` gate. `app/_layout.tsx`'s `bootstrapped` (locale + auth)
 * stays the sole splash gate; this context is purely a presentation detail
 * downstream of it.
 */
const FontsReadyContext = createContext(false);

export function FontsReadyProvider({
  ready,
  children,
}: {
  ready: boolean;
  children: ReactNode;
}) {
  return <FontsReadyContext.Provider value={ready}>{children}</FontsReadyContext.Provider>;
}

/** Defaults to `false` outside a provider — falls back to the system font, never throws. */
export function useFontsReady(): boolean {
  return useContext(FontsReadyContext);
}
