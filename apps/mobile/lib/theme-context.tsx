import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { resolveTheme, type Theme } from './theme';

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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const theme = useMemo(() => resolveTheme(scheme), [scheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/**
 * Defaults to the LIGHT theme outside a provider — returns real colours, never
 * `undefined`, and never throws. Same "safe default" idiom as `useFontsReady`;
 * here it is also the D-01 hell-first default and the UI-SPEC E3/loading
 * guarantee that no surface can paint transparent on the first frame.
 */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
