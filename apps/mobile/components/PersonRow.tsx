import { useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@quiks/ui';
import type { VisitorProfileForeign } from '@quiks/contracts';

import { AvatarTile } from './AvatarTile';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const AVATAR_ROW_SIZE = 40;
/** quick-260813-o08 D-D/D-E — the `compact` variant's avatar tile. */
const AVATAR_ROW_SIZE_COMPACT = 32;

export type PersonRowProps = {
  profile: VisitorProfileForeign;
  /** Free composition slot — a single chip/button (search hit, crew row) or a two-button group (request row). */
  trailing?: ReactNode;
  /** Only crew rows are tappable this phase (D-09) — search hits and request rows leave this undefined. */
  onPress?: () => void;
  /**
   * quick-260813-o08 D-D/D-E — a smaller padding and avatar for request rows,
   * where many transient rows stack above one another. Off by default:
   * search hits and crew rows are the durable surfaces and keep the
   * standard size (D-E). Everything else about the row (text roles,
   * truncation, trailing slot, card look) stays identical.
   */
  compact?: boolean;
  /** Already-localized screen-reader label, built by the CALLER through Lingui — this component owns no copy. */
  accessibilityLabel: string;
};

/**
 * The ONE shared row block for search hits, request rows and crew rows
 * (D-11, 08-01-UI-SPEC § Component Inventory) — build once, reuse three
 * times, because all three lists embed the exact same `profile` shape
 * (VIS-02).
 *
 * No `localUri` is ever passed to `AvatarTile` here: a foreign `avatar` is a
 * device-local MMKV URI of the OTHER device and never resolves on this one
 * (08-01-PLAN "Flagged Assumptions" #1) — every row therefore shows
 * initials, never a photo. No `presence` dot either (D-11/ADR-014).
 */
export function PersonRow({
  profile,
  trailing,
  onPress,
  compact,
  accessibilityLabel,
}: PersonRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const nameFont = fontFamilyForRole('bodyStrong', fontsReady);
  const handleFont = fontFamilyForRole('bodySm', fontsReady);
  const rowStyle = compact ? [styles.row, styles.rowCompact] : styles.row;

  const content = (
    <>
      <AvatarTile
        displayName={profile.displayName}
        username={profile.username}
        size={compact ? AVATAR_ROW_SIZE_COMPACT : AVATAR_ROW_SIZE}
      />
      <View style={styles.textColumn}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.displayName, { fontFamily: nameFont }]}
        >
          {profile.displayName}
        </Text>
        {/* UI-SPEC § Color item 3 — the one place `bodySm` takes the accent
            colour instead of `textMuted`. `username` is never wrapped in a
            Lingui macro (ADR-012/020). */}
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.handle, { fontFamily: handleFont }]}
        >
          @{profile.username}
        </Text>
      </View>
      {trailing === undefined ? null : <View style={styles.trailing}>{trailing}</View>}
    </>
  );

  if (onPress === undefined) {
    return (
      <View style={rowStyle} accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      style={rowStyle}
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
    row: {
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-4'],
      padding: spacingScale['sp-6'],
      backgroundColor: colors.surfaceCard,
      borderRadius: radiiScale['r-card'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    // quick-260813-o08 D-D — one step down the sp-ramp from `row`'s own
    // `sp-6` padding; every other visual property (radius, border, card
    // background) is inherited unchanged from `row`.
    rowCompact: { padding: spacingScale['sp-5'] },
    // `minWidth: 0` lets the text column actually shrink/truncate instead of
    // pushing the row wider than its container.
    textColumn: { flexGrow: 1, flexShrink: 1, minWidth: 0, gap: spacingScale['sp-1'] },
    displayName: {
      fontSize: typeRoles.bodyStrong.size,
      lineHeight: typeRoles.bodyStrong.size * typeRoles.bodyStrong.lineHeight,
      color: colors.textPrimary,
    },
    handle: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.primary,
    },
    trailing: { flexShrink: 0 },
  });
}
