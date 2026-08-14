import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const EYEBROW_ICON_SIZE = 15;

export type StatTileProps = {
  icon: LucideIcon;
  /** Already-localized eyebrow label (caller owns all copy, same rule as `ComingSoonTile`/`SoonToast`). */
  label: string;
  /** Already-localized value text (e.g. a formatted count). Renders in `title2`. */
  value?: string;
  /**
   * Already-localized short sentence, shown INSTEAD of `value` when `value`
   * is absent (09-05 Task 1: a 0-count is a sentence, never a bare `0`).
   */
  note?: string;
  /**
   * `'brand'` reserves the one markbrand-coloured surface of a screen for a
   * single primary entry (09-06's Cashless tile); every informational tile —
   * the Crew count included — stays `'default'` so it never competes with
   * that one accent. Defaults to `'default'`.
   */
  tone?: 'brand' | 'default';
  onPress?: () => void;
  /**
   * Rendered at the trailing edge of the value row, past the value and its
   * word. 09-06's Cashless entry needs this space; this plan's Crew tile
   * leaves it unset.
   */
  trailing?: ReactNode;
  accessibilityLabel?: string;
};

/**
 * The Dashboard stat-tile primitive (09-05 Task 1, UI-SPEC § Dashboard
 * Contract) — `flex: 1` in a row of at most two tiles, unlike
 * `ComingSoonTile`'s fixed grid `flexBasis`. Interactivity follows
 * `PersonRow`'s rule: no `onPress` renders a plain `View`, `onPress` renders
 * a `Pressable` with `accessibilityRole="button"` and a `layout.hitMin`
 * floor. This component owns no copy of its own — `label`/`value`/`note`
 * all arrive pre-localized from the caller.
 */
export function StatTile({
  icon: Icon,
  label,
  value,
  note,
  tone = 'default',
  onPress,
  trailing,
  accessibilityLabel,
}: StatTileProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const microFont = fontFamilyForRole('micro', fontsReady);
  const valueFont = fontFamilyForRole('title2', fontsReady);
  const noteFont = fontFamilyForRole('bodySm', fontsReady);
  const iconColor = tone === 'brand' ? colors.primary : colors.textSecondary;

  const content = (
    <>
      <View style={styles.eyebrowRow}>
        <Icon size={EYEBROW_ICON_SIZE} color={iconColor} strokeWidth={2} />
        <Text
          style={[styles.eyebrowLabel, { fontFamily: microFont }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </View>

      {value !== undefined ? (
        <View style={styles.valueRow}>
          <Text
            style={[styles.value, { fontFamily: valueFont }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {value}
          </Text>
          {/* The optional nachgestelltes Wort (UI-SPEC § Dashboard Contract) —
              reuses `label` verbatim rather than a separate prop, so a caller
              cannot desync the eyebrow tag from the word beside the number
              (09-05 Task 1 action (3): "das nachgestellte Wort ist dasselbe
              Etikett"). Distinct from `trailing` below, which stays a free
              caller-supplied slot (unused by this plan's Crew tile, reserved
              for 09-06's Cashless entry). */}
          <Text
            style={[styles.valueWord, { fontFamily: noteFont }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {label}
          </Text>
          {trailing ?? null}
        </View>
      ) : note !== undefined ? (
        <Text style={[styles.note, { fontFamily: noteFont }]} numberOfLines={2}>
          {note}
        </Text>
      ) : null}
    </>
  );

  if (onPress === undefined) {
    return (
      <View style={styles.tile} accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      style={styles.tile}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tile: {
      flex: 1,
      minHeight: layout.hitMin,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radiiScale['r-md'],
      padding: spacingScale['sp-6'],
      gap: spacingScale['sp-3'],
    },
    eyebrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-3'],
    },
    eyebrowLabel: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: typeRoles.micro.size,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacingScale['sp-2'],
    },
    value: {
      flexShrink: 0,
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textPrimary,
    },
    valueWord: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
    note: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
  });
}
