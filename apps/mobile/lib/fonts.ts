import type { useFonts as UseFontsHook } from 'expo-font';

/**
 * Non-blocking font-family constants for the Phase-4 UI restyle.
 *
 * Each constant is the `fontFamily` key the matching Google-Font weight is
 * registered under in {@link useAppFonts} — a plain string usable directly in a
 * StyleSheet's `fontFamily`. Design system (04-PATTERNS.md): display = Outfit,
 * body = Plus Jakarta Sans, mono = JetBrains Mono.
 *
 * NON-BLOCKING CONTRACT (Pitfall 5 / D-04): the `fontsLoaded` boolean returned
 * by {@link useAppFonts} is meant to gate ONLY which `fontFamily` a style
 * resolves — fall back to `undefined` (RN system font) until loaded via
 * {@link resolveFontFamily}. It must NEVER be consumed as a splash-hide
 * (`SplashScreen.hideAsync`) or `return null` gate: text renders immediately in
 * the system font and swaps to the custom family once loaded.
 */
export const FONT_DISPLAY = 'Outfit_700Bold';
export const FONT_BODY = 'PlusJakartaSans_400Regular';
export const FONT_MONO = 'JetBrainsMono_400Regular';

/**
 * Fallback-safe resolver for the non-blocking font contract: returns the custom
 * `fontFamily` name once fonts have loaded, otherwise `undefined` so RN falls
 * back to the system font. Pure — no RN dependency, unit-testable off-device.
 *
 * @example
 * const { fontsLoaded } = useAppFonts();
 * const style = { fontFamily: resolveFontFamily(FONT_DISPLAY, fontsLoaded) };
 */
export function resolveFontFamily(
  family: string,
  fontsLoaded: boolean,
): string | undefined {
  return fontsLoaded ? family : undefined;
}

// RN/Metro provides `require` at runtime. Declared here (types: ["react"] only,
// no node types) so the lazy loads inside useAppFonts typecheck. The requires
// run ONLY on-device when the hook is called; the pure exports above stay
// node-importable for the Vitest runner (no react-native / .ttf resolution at
// module load).
declare const require: (moduleId: string) => unknown;

/**
 * Loads the three Phase-4 Google-Font families and reports readiness.
 *
 * The RN-only modules (`expo-font`, `@expo-google-fonts/*`) are required lazily
 * inside the hook body so this module can be imported in a node test
 * environment without pulling react-native or resolving `.ttf` assets.
 *
 * @returns `{ fontsLoaded }` — feed into {@link resolveFontFamily}; do NOT gate
 * splash-hide or a `return null` on it (see NON-BLOCKING CONTRACT above).
 */
export function useAppFonts(): { fontsLoaded: boolean } {
  const { useFonts } = require('expo-font') as { useFonts: typeof UseFontsHook };
  // Explicit shapes (not Record<string, number>) so noUncheckedIndexedAccess
  // doesn't widen these known exports to `number | undefined` — useFonts'
  // FontSource map rejects undefined.
  const outfit = require('@expo-google-fonts/outfit') as {
    Outfit_700Bold: number;
    Outfit_600SemiBold: number;
  };
  const jakarta = require('@expo-google-fonts/plus-jakarta-sans') as {
    PlusJakartaSans_400Regular: number;
    PlusJakartaSans_500Medium: number;
    PlusJakartaSans_600SemiBold: number;
  };
  const mono = require('@expo-google-fonts/jetbrains-mono') as {
    JetBrainsMono_400Regular: number;
  };

  const [loaded] = useFonts({
    [FONT_DISPLAY]: outfit.Outfit_700Bold,
    Outfit_600SemiBold: outfit.Outfit_600SemiBold,
    [FONT_BODY]: jakarta.PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium: jakarta.PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold: jakarta.PlusJakartaSans_600SemiBold,
    [FONT_MONO]: mono.JetBrainsMono_400Regular,
  });

  return { fontsLoaded: loaded };
}
