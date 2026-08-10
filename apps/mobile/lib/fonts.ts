import type { useFonts as UseFontsHook } from 'expo-font';
import type { Tokens } from '@quiks/ui';

/**
 * Non-blocking font-family constants for the Phase-4 UI restyle.
 *
 * Each constant is the `fontFamily` key the matching Google-Font weight is
 * registered under in {@link useAppFonts} — a plain string usable directly in a
 * StyleSheet's `fontFamily`. Design system (CI v1.0 §4): display = Outfit,
 * body = Plus Jakarta Sans, mono = JetBrains Mono.
 *
 * NON-BLOCKING CONTRACT (Pitfall 5 / D-04): the `fontsLoaded` boolean returned
 * by {@link useAppFonts} is meant to gate ONLY which `fontFamily` a style
 * resolves — fall back to `undefined` (RN system font) until loaded via
 * {@link resolveFontFamily}. It must NEVER be consumed as a splash-hide
 * (`SplashScreen.hideAsync`) or `return null` gate: text renders immediately in
 * the system font and swaps to the custom family once loaded. The weights added
 * in 05.1-03 are bound by the same rule — a new weight file must never become a
 * render gate.
 *
 * CONSUMER RULE (05.1 D-10, load-bearing for plans 04/05): a style that resolves
 * its family through {@link fontFamilyForRole} must NOT also set a numeric
 * `fontWeight`. Each role now maps to a REAL weight-specific font file; a
 * numeric override on top of one is exactly what makes the device synthesise
 * faux-bold (Phase-5 UI-REVIEW Finding 2). Pass the role, drop the weight.
 */
export const FONT_DISPLAY = 'Outfit_700Bold';
export const FONT_BODY = 'PlusJakartaSans_400Regular';
export const FONT_MONO = 'JetBrainsMono_400Regular';
/** Outfit 800 — the CI's brand/Display weight (`wordmark`, `display2`). */
export const FONT_WORDMARK = 'Outfit_800ExtraBold';
/** Plus Jakarta Sans 700 — the CI's Label weight, shared by `title3`/`label`/`micro`. */
export const FONT_TITLE_STRONG = 'PlusJakartaSans_700Bold';
/** Plus Jakarta Sans 600 — already loaded, but had no exported constant before 05.1-03. */
export const FONT_BODY_STRONG = 'PlusJakartaSans_600SemiBold';
/** JetBrains Mono 500 — the CI's Mono weight for the new `mono` role. */
export const FONT_MONO_MEDIUM = 'JetBrainsMono_500Medium';

/**
 * Fallback-safe resolver for the non-blocking font contract: returns the custom
 * `fontFamily` name once fonts have loaded, otherwise `undefined` so RN falls
 * back to the system font. Pure — no RN dependency, unit-testable off-device.
 *
 * @example
 * const { fontsLoaded } = useAppFonts();
 * const style = { fontFamily: resolveFontFamily(FONT_DISPLAY, fontsLoaded) };
 */
export function resolveFontFamily(family: string, fontsLoaded: boolean): string | undefined {
  return fontsLoaded ? family : undefined;
}

/** The type-role names defined in `packages/ui/src/tokens.ts` — the single source of the union. */
export type TypeRole = keyof Tokens['typeRoles'];

/**
 * Role → real weight-specific font file (05.1 D-10, mapping per
 * 05.1-UI-SPEC.md § Font Resolver Contract, which supersedes D-10's prose for
 * `title2` and `label` where D-08 changed the weights).
 *
 * Typed as a total `Record` over the token key set on purpose: adding a role to
 * `typeRoles` without deciding its font file is a COMPILE error here, not a
 * silent fallback to the system font at runtime.
 *
 * KNOWN FOLLOW-UP, deliberately not fixed here: `otpDigit` and `countdown`
 * declare weight 500 but keep the 400 file. That mismatch pre-dates this phase
 * and is explicitly out of scope (D-10 enumerates only title2/label/bodyStrong/
 * title3/micro); loading `JetBrainsMono_500Medium` for them would change the OTP
 * boxes' rendering, which no plan in this phase has accepted. Fix it with its
 * own device acceptance.
 */
const ROLE_FONT_FAMILY: Record<TypeRole, string> = {
  wordmark: FONT_WORDMARK,
  display2: FONT_WORDMARK,
  title2: FONT_DISPLAY,
  title3: FONT_TITLE_STRONG,
  label: FONT_TITLE_STRONG,
  micro: FONT_TITLE_STRONG,
  bodyStrong: FONT_BODY_STRONG,
  body: FONT_BODY,
  bodySm: FONT_BODY,
  mono: FONT_MONO_MEDIUM,
  otpDigit: FONT_MONO,
  countdown: FONT_MONO,
};

/**
 * Resolves a type role to its weight-specific `fontFamily`, honouring the
 * non-blocking contract: `undefined` (RN system font) until fonts have loaded.
 *
 * @example
 * const { fontsLoaded } = useAppFonts();
 * // no `fontWeight` here — the family IS the weight (see CONSUMER RULE above)
 * const style = { fontSize: typeRoles.title2.size, fontFamily: fontFamilyForRole('title2', fontsLoaded) };
 */
export function fontFamilyForRole(role: TypeRole, fontsLoaded: boolean): string | undefined {
  return resolveFontFamily(ROLE_FONT_FAMILY[role], fontsLoaded);
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
    Outfit_800ExtraBold: number;
  };
  const jakarta = require('@expo-google-fonts/plus-jakarta-sans') as {
    PlusJakartaSans_400Regular: number;
    PlusJakartaSans_500Medium: number;
    PlusJakartaSans_600SemiBold: number;
    PlusJakartaSans_700Bold: number;
  };
  const mono = require('@expo-google-fonts/jetbrains-mono') as {
    JetBrainsMono_400Regular: number;
    JetBrainsMono_500Medium: number;
  };

  const [loaded] = useFonts({
    [FONT_DISPLAY]: outfit.Outfit_700Bold,
    Outfit_600SemiBold: outfit.Outfit_600SemiBold,
    [FONT_WORDMARK]: outfit.Outfit_800ExtraBold,
    [FONT_BODY]: jakarta.PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium: jakarta.PlusJakartaSans_500Medium,
    [FONT_BODY_STRONG]: jakarta.PlusJakartaSans_600SemiBold,
    [FONT_TITLE_STRONG]: jakarta.PlusJakartaSans_700Bold,
    [FONT_MONO]: mono.JetBrainsMono_400Regular,
    [FONT_MONO_MEDIUM]: mono.JetBrainsMono_500Medium,
  });

  return { fontsLoaded: loaded };
}
