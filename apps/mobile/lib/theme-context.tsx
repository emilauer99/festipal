import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { getThemeOverride, saveThemeOverride } from './theme-override-storage';
import {
  resolveEffectiveThemeMode,
  resolveTheme,
  resolveThemeColors,
  type Theme,
  type ThemeOverride,
} from './theme';

/**
 * Shares the single root colour-mode resolution (see apps/mobile/lib/theme.ts)
 * with every screen and component, so no consumer calls `useColorScheme()`
 * itself and no two surfaces can disagree about the active mode.
 *
 * Consumer rule (05.1-UI-SPEC.md § Theme Mode Contract, D-01): a themed
 * component builds its styles INSIDE the component —
 * `const styles = useMemo(() => createStyles(colors), [colors])` — instead of a
 * module-level `StyleSheet.create`, which freezes its colours at import time
 * and can therefore never follow the mode. Raw hex values in components stay
 * forbidden (ADR-015): only semantic roles from `packages/ui/src/tokens.ts`.
 */
const ThemeContext = createContext<Theme>(resolveTheme(null));

/** What `useThemeOverride()` hands to the Mehr-screen switch (D-08a). */
export type ThemeOverrideControl = {
  /** The RAW persisted preference — `'system'` when following the device. */
  override: ThemeOverride;
  /** Persists the preference AND re-renders the tree immediately. */
  setThemeOverride: (next: ThemeOverride) => void;
};

/**
 * Same "safe default outside a provider" idiom as {@link ThemeContext}: the
 * setter is a documented no-op rather than a throw, so a stray consumer can
 * never crash a screen. It deliberately does NOT write to storage — a write
 * with no provider to re-render would leave the UI disagreeing with the store.
 */
const ThemeOverrideContext = createContext<ThemeOverrideControl>({
  override: 'system',
  setThemeOverride: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  // UI-SPEC #31 — MMKV is synchronous, so the persisted preference is already
  // known on the FIRST render: no effect, no loading state, no unthemed first
  // frame and no indeterminate switch. A read failure yields 'system' (#32).
  const [override, setOverride] = useState<ThemeOverride>(getThemeOverride);

  // D-08a — the override is a layer ABOVE the device resolution; the 'system'
  // branch of resolveEffectiveThemeMode is the untouched 05.1 rule.
  const theme = useMemo<Theme>(() => {
    const mode = resolveEffectiveThemeMode(override, scheme);
    return { mode, colors: resolveThemeColors(mode) };
  }, [override, scheme]);

  // Persist AND update local state: without the second half the switch would
  // only follow on the next launch, which reads as a broken control.
  const setThemeOverride = useCallback((next: ThemeOverride) => {
    saveThemeOverride(next);
    setOverride(next);
  }, []);

  const overrideControl = useMemo<ThemeOverrideControl>(
    () => ({ override, setThemeOverride }),
    [override, setThemeOverride],
  );

  return (
    <ThemeOverrideContext.Provider value={overrideControl}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </ThemeOverrideContext.Provider>
  );
}

/**
 * Defaults to the LIGHT theme outside a provider — returns real colours, never
 * `undefined`, and never throws. Same "safe default" idiom as `useFontsReady`;
 * here it is also the D-01 hell-first default and the UI-SPEC E3/loading
 * guarantee that no surface can paint transparent on the first frame.
 *
 * Signature unchanged by D-08a: every existing caller keeps working, and a
 * consumer that only paints does not need to know an override exists.
 */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * The write side of the theme, for the one control that owns it (Mehr →
 * Darstellung). Separate from {@link useTheme} on purpose: a consumer that
 * only needs colours must not re-render when the raw preference changes shape,
 * and the setter should be reachable from exactly one place.
 */
export function useThemeOverride(): ThemeOverrideControl {
  return useContext(ThemeOverrideContext);
}
