import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// Colour roles resolve per render via `useTheme()` (05.1 D-01) — only the
// mode-invariant scales stay at module scope.
const { typeRoles, radiiScale, spacingScale } = tokens;

const ICON_SIZE = 22;

/**
 * Column widths for the wrapping grids this tile is dropped into. Slightly under
 * the exact fraction so a rounding difference can never push the last tile of a
 * row onto its own line (UI-SPEC #62: the 3-column stat row must not break).
 */
const COLUMN_BASIS = { 2: '48%', 3: '31%' } as const;

export type ComingSoonTileProps = {
  /** The Lucide icon component to render (e.g. `CalendarClock`) — never a name string. */
  icon: LucideIcon;
  /** Already-localized tile label (caller passes `t\`Timetable\`` etc — this component owns no copy). */
  label: string;
  /** Already-localized "Soon"/"Bald" badge text. */
  badge: string;
  /**
   * How many tiles share a row in the caller's wrapping grid. Defaults to the
   * original 2-column festival grid; the Profil stat row (06-07) asks for 3.
   * Everything else about the tile is identical between the two.
   */
  columns?: keyof typeof COLUMN_BASIS;
};

/**
 * D-07 — owned, non-interactive "coming soon" primitive (ADR-022, UI-SPEC
 * Component Contract). A disabled `View`, NEVER a `Pressable` — no press
 * feedback, no navigation. Fully static: this component takes no data-fetch
 * props (icon/label/badge are all caller-supplied), matching the phase scope
 * that keeps every tile — including Cashless — inert this phase (T-05-03).
 */
export function ComingSoonTile({ icon: Icon, label, badge, columns = 2 }: ComingSoonTileProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved (05.1 D-10): `micro` and `title3` both map to a real 700
  // file, so neither style sets a numeric fontWeight.
  const microFont = fontFamilyForRole('micro', fontsReady);
  const labelFont = fontFamilyForRole('title3', fontsReady);

  return (
    <View
      style={[styles.tile, { flexBasis: COLUMN_BASIS[columns] }]}
      accessibilityState={{ disabled: true }}
    >
      <View style={styles.badge}>
        <Text style={[styles.badgeText, { fontFamily: microFont }]}>{badge}</Text>
      </View>
      <Icon size={ICON_SIZE} color={colors.textMuted} strokeWidth={2} />
      <Text style={[styles.label, { fontFamily: labelFont }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tile: {
      // `flexBasis` is supplied per instance from COLUMN_BASIS — see the render.
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radiiScale['r-md'],
      paddingVertical: spacingScale['sp-6'],
      paddingHorizontal: spacingScale['sp-5'],
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacingScale['sp-4'],
    },
    badge: {
      position: 'absolute',
      top: spacingScale['sp-4'],
      right: spacingScale['sp-4'],
      backgroundColor: colors.fillQuiet,
      borderRadius: radiiScale['r-pill'],
      paddingHorizontal: spacingScale['sp-4'],
      paddingVertical: 2,
    },
    badgeText: {
      fontSize: typeRoles.micro.size,
      color: colors.textMuted,
    },
    label: {
      fontSize: typeRoles.title3.size,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
}
