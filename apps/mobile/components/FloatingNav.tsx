import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Menu, Tent, Users, type LucideIcon } from 'lucide-react-native';
import { useLingui } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// Colour roles are deliberately NOT destructured here: they resolve per render
// through `useTheme()` (05.1 D-01). Only the mode-invariant scales stay at
// module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const ICON_SIZE = 22;
const ACTIVE_STROKE = 2.4;
const INACTIVE_STROKE = 2;
// Approximates the mockup's --glass-blur: 22px / --glass-saturate: 180% (UI-SPEC
// Tab bar contract) — expo-blur's `intensity` has no 1:1 px mapping to CSS
// `backdrop-filter: blur()`, tuned by eye against the source design. Mode-
// invariant: only the `tint` and the glass fill/border follow the theme.
const BLUR_INTENSITY = 60;

type LiveRouteName = 'home' | 'festivals' | 'friends' | 'mehr';

/**
 * 06-01 (RESEARCH Open Question 2, resolved): `Menu` — not `UserRound` — is the
 * Mehr glyph, so `UserRound` stays reserved for avatar/profile contexts (the
 * Konto row inside Mehr and the Profil push screen behind it). Reusing one
 * glyph for both would make the tab and its own first row read as the same
 * destination.
 */
const LIVE_TAB_ICON: Record<LiveRouteName, LucideIcon> = {
  home: Home,
  festivals: Tent,
  friends: Users,
  mehr: Menu,
};

function isLiveRouteName(name: string): name is LiveRouteName {
  return name === 'home' || name === 'festivals' || name === 'friends' || name === 'mehr';
}

/**
 * D-02 / UI-SPEC "Tab bar (FloatingNav)" — the app's owned floating pill tab
 * bar, rendered via `Tabs`' `tabBar` render prop (RESEARCH Pattern 1, stable
 * `expo-router` `Tabs`, NOT the experimental `expo-router/ui` headless API).
 *
 * 06-01 / D-01: ALL FOUR tabs now come straight from `state.routes` (Home,
 * Festivals, Friends, Mehr — the four `Tabs.Screen`s registered in
 * `(tabs)/_layout.tsx`) and flow through the SAME `Pressable`/pill/icon/label
 * branch. The Phase-5 pair of non-navigating placeholder items is gone, and
 * with it the whole second render branch: every item in this bar is a real
 * route.
 *
 * UI-SPEC #41/#42: the four items share the fixed `layout.navHeight` bar at
 * equal width (`flex: 1`, icons never shrink) and each label is single-line
 * with tail truncation, so no locale's label length can break the bar.
 *
 * 05.1 D-03 + UI-SPEC E3: the glass follows the colour mode on BOTH axes —
 * `glassFill`/`glassBorder` come from the resolved theme AND the native
 * `BlurView` `tint` flips with it. Changing only the fill leaves the native
 * blur reading dark under a light surface, so the two must never diverge.
 * `useTheme()` falls back to the LIGHT set for an unresolved device scheme
 * (lib/theme.ts), so neither role can ever be undefined and the nav can never
 * paint transparent on its first frame (UI-SPEC E3/loading).
 */
export function FloatingNav({ state, navigation, insets }: BottomTabBarProps) {
  const { t } = useLingui();
  const { mode, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved: `micro` maps to a real 700 file, so the style carries no
  // numeric fontWeight (05.1 D-10 — an override on a real weight file is what
  // produces device faux-bold).
  const labelFont = fontFamilyForRole('micro', fontsReady);
  // Pitfall 4 — `accessibilityLabel` is excluded from eslint's
  // `no-literal-string` jsx-attributes check, so every label below is routed
  // through Lingui explicitly rather than relied on as a lint-caught literal.
  //
  // Built as a fresh per-render record, one `t` call per route: `t` is a BABEL
  // MACRO that must appear textually at each call site, so a module-level map
  // of pre-resolved strings would freeze the labels at import time and never
  // follow a UI-locale change.
  //
  // Source strings stay English (`lingui.config.ts` `sourceLocale: 'en'`) —
  // the design's German "Mehr" is the DE catalog value for the `More` msgid.
  const liveTabLabel: Record<LiveRouteName, string> = {
    home: t`Home`,
    festivals: t`Festivals`,
    friends: t`Friends`,
    mehr: t`More`,
  };

  function handlePress(route: { key: string; name: string }, focused: boolean) {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  }

  return (
    <View
      style={[
        styles.wrapper,
        {
          left: layout.screenPad,
          right: layout.screenPad,
          bottom: layout.navInset + insets.bottom,
        },
      ]}
    >
      <BlurView
        intensity={BLUR_INTENSITY}
        tint={mode === 'light' ? 'light' : 'dark'}
        style={styles.blur}
      >
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const focused = index === state.index;
            const routeName = isLiveRouteName(route.name) ? route.name : 'home';
            const Icon = LIVE_TAB_ICON[routeName];
            const label = liveTabLabel[routeName];
            return (
              <Pressable
                key={route.key}
                style={styles.item}
                onPress={() => handlePress(route, focused)}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
              >
                {focused ? <View style={styles.activePill} /> : null}
                <Icon
                  size={ICON_SIZE}
                  color={focused ? colors.primary : colors.textMuted}
                  strokeWidth={focused ? ACTIVE_STROKE : INACTIVE_STROKE}
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[
                    styles.label,
                    { fontFamily: labelFont, color: focused ? colors.primary : colors.textMuted },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      height: layout.navHeight,
    },
    blur: {
      flex: 1,
      borderRadius: radiiScale['r-pill'],
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glassFill,
      overflow: 'hidden',
    },
    row: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: spacingScale['sp-3'],
    },
    // UI-SPEC #41 — the four tabs split the fixed bar width evenly (`flex: 1`);
    // `minWidth` keeps every one of them a real 44px tap target.
    item: {
      flex: 1,
      minWidth: layout.hitMin,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacingScale['sp-2'],
      paddingHorizontal: spacingScale['sp-2'],
    },
    activePill: {
      position: 'absolute',
      top: 4,
      bottom: 4,
      left: spacingScale['sp-3'],
      right: spacingScale['sp-3'],
      borderRadius: radiiScale['r-pill'],
      backgroundColor: colors.fillBrandQuiet,
    },
    // UI-SPEC #42 — single line, tail-truncated (set on the `Text` itself);
    // centring keeps a truncated label optically aligned under its icon.
    label: {
      fontSize: typeRoles.micro.size,
      textAlign: 'center',
    },
  });
}
