import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuthState } from '../lib/auth-state';
import { useColdStartTarget } from '../lib/cold-start-target';
import { rootRedirectTarget } from '../lib/root-redirect';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

/**
 * first-login-unmatched-route (round 3) — the SINGLE owner of path `/`.
 *
 * Root cause it closes: Expo Router builds its URL→route linking map STATICALLY
 * from the file tree and resolves the root path `/` to ONE leaf via
 * `matchForEmptyPath`, with NO awareness of which `Stack.Protected` guard is
 * active (verified against expo-router 57 source). Previously TWO files resolved
 * `/` — `(auth)/index` (Welcome) and the round-2 `(root)/index` — under
 * mutually-exclusive guards. The static winner was always `(auth)/index`, which
 * is render-filtered out once authenticated, so on the profile-submit guard flip
 * (which reconciles the URL to `/`) Expo Router rendered its Unmatched Route
 * screen for `quiks:///`. Adding `(root)/index` never helped because it never
 * won the empty-path match.
 *
 * This file is declared OUTSIDE every `Stack.Protected` block in
 * `app/_layout.tsx`, so it is mounted in ALL auth states and is the ONLY file
 * resolving `/` (the former `(auth)/index` is now `(auth)/welcome`; the `(root)`
 * group is removed). `getStateFromPath('/')` therefore always resolves to a
 * screen that is actually rendered, in every guard state — the collision is gone
 * at the source. It hands off with a DECLARATIVE <Redirect>, which navigates on
 * mount independent of guard-flip reconciliation timing (unlike the round-1
 * imperative `router.replace`, which lost that race).
 *
 * The authenticated redirect TARGET (Home vs. persisted active festival vs.
 * captured deep link) is decided once in `app/_layout.tsx`'s guard-resolve
 * effect (preserving capture-before-consume ordering + the one-shot /
 * StrictMode-safe consume of the pending deep-link href) and delivered here via
 * {@link useColdStartTarget}. While that target is momentarily null a brand
 * splash frame is shown so there is never a blank or unmatched flash.
 */
export default function RootIndex() {
  const authState = useAuthState();
  const coldStartTarget = useColdStartTarget();
  const target = rootRedirectTarget(authState, coldStartTarget);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (target) {
    return <Redirect href={target} />;
  }

  return <View style={styles.splash} />;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    splash: {
      flex: 1,
      // 05.1 D-01 — resolved per render, so this holding frame is Papier in
      // light mode instead of a frozen Ink value. The role stays `bgAppDeep`
      // (unchanged from before the migration); the splash in `_layout.tsx`
      // uses `bgApp`, a pre-existing one-step difference left untouched here
      // because this plan is a colour-resolution migration, not a re-design.
      backgroundColor: colors.bgAppDeep,
    },
  });
}
