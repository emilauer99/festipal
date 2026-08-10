import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Tent, UserRound, Users, type LucideIcon } from 'lucide-react-native';
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

type LiveRouteName = 'home' | 'festivals';

const LIVE_TAB_ICON: Record<LiveRouteName, LucideIcon> = {
  home: Home,
  festivals: Tent,
};

function isLiveRouteName(name: string): name is LiveRouteName {
  return name === 'home' || name === 'festivals';
}

/**
 * D-02 / UI-SPEC "Tab bar (FloatingNav)" — the app's owned floating pill tab
 * bar, rendered via `Tabs`' `tabBar` render prop (RESEARCH Pattern 1, stable
 * `expo-router` `Tabs`, NOT the experimental `expo-router/ui` headless API).
 *
 * Renders the 2 LIVE tabs straight from `state.routes` (Home, Festivals —
 * the only two `Tabs.Screen`s registered in `(tabs)/_layout.tsx`) plus 2
 * DECORATIVE Friends/Profil items that have no backing route at all (Phase
 * 6) — they cannot navigate by construction, on top of the explicit
 * `disabled` prop + `accessibilityState` belt-and-suspenders (REVIEW 05-05
 * MEDIUM: disabled must not rely on the a11y flag alone).
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
  // Pitfall 4 — accessibilityLabel is excluded from eslint's
  // `no-literal-string` jsx-attributes check, so this suffix is routed
  // through Lingui explicitly rather than relied on as a lint-caught literal.
  const comingSoonSuffix = t`coming soon`;

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
            const label = routeName === 'home' ? t`Home` : t`Festivals`;
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

          <DisabledNavItem
            icon={Users}
            label={t`Friends`}
            comingSoonSuffix={comingSoonSuffix}
            labelFont={labelFont}
            styles={styles}
            mutedColor={colors.textMuted}
          />
          <DisabledNavItem
            icon={UserRound}
            label={t`Profile`}
            comingSoonSuffix={comingSoonSuffix}
            labelFont={labelFont}
            styles={styles}
            mutedColor={colors.textMuted}
          />
        </View>
      </BlurView>
    </View>
  );
}

/**
 * Friends/Profil — decorative, not in `state.routes`, no navigation target
 * this phase (Phase 6). `disabled` is set on the `Pressable` itself (not
 * only `accessibilityState`, REVIEW 05-05 MEDIUM) and the `onPress` is an
 * explicit no-op for clarity even though `disabled` already prevents it
 * firing.
 *
 * Takes the parent's resolved `styles` and muted colour as props rather than
 * calling `useTheme()` itself, so the whole nav builds exactly ONE stylesheet
 * per mode change instead of three.
 */
function DisabledNavItem({
  icon: Icon,
  label,
  comingSoonSuffix,
  labelFont,
  styles,
  mutedColor,
}: {
  icon: LucideIcon;
  label: string;
  comingSoonSuffix: string;
  labelFont: string | undefined;
  styles: NavStyles;
  mutedColor: string;
}) {
  return (
    <Pressable
      style={[styles.item, styles.itemDisabled]}
      disabled
      onPress={() => {}}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      accessibilityLabel={`${label} — ${comingSoonSuffix}`}
    >
      <Icon size={ICON_SIZE} color={mutedColor} strokeWidth={INACTIVE_STROKE} />
      <Text style={[styles.label, { fontFamily: labelFont, color: mutedColor }]}>{label}</Text>
    </Pressable>
  );
}

type NavStyles = ReturnType<typeof createStyles>;

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
    item: {
      flex: 1,
      minWidth: layout.hitMin,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacingScale['sp-2'],
    },
    itemDisabled: {
      opacity: 0.4,
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
    label: {
      fontSize: typeRoles.micro.size,
    },
  });
}
