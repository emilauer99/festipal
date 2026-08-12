import { useMemo } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

/** UI-SPEC Placeholder Pattern A — the dampening factor for a "not real yet" row. */
const DISABLED_OPACITY = 0.45;

export type SettingsSwitchProps = {
  /** Already-localized row label. This component owns no copy. */
  label: string;
  /** Optional already-localized secondary line, capped at two lines (UI-SPEC #34). */
  description?: string;
  /** The switch position. */
  value: boolean;
  /** Change handler. Omitted for the dead placeholder switches. */
  onValueChange?: (next: boolean) => void;
  /** UI-SPEC Pattern A — dampened + static badge AND a genuinely inert control. */
  disabled?: boolean;
  /** Already-localized "Soon"/"Bald" badge text, rendered only while {@link disabled}. */
  badge?: string;
  /**
   * Already-localized screen-reader label, built by the CALLER through Lingui.
   * Pitfall 4: eslint's `no-literal-string` excludes `accessibilityLabel` from
   * its jsx-attributes check, so a hardcoded label here would NOT be caught.
   */
  accessibilityLabel: string;
};

/**
 * The shared switch row for Mehr → Darstellung / Benachrichtigungen / Standort
 * (UI-SPEC § Component Inventory). An owned RN-primitive component on shared
 * tokens (ADR-022) wrapping React Native's own `Switch`.
 *
 * Unlike {@link import('./ListRow').ListRow}, `disabled` here is NOT merely
 * visual: the underlying control really is `disabled`, so a dampened
 * notification switch cannot be flipped into a state nothing backs.
 *
 * The ON track is the one functionally live accent-coloured control this phase
 * (UI-SPEC § Color, reserved-for item 5) — the dark-mode switch. Everything else
 * on these screens resolves through neutral roles.
 */
export function SettingsSwitch({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  badge,
  accessibilityLabel,
}: SettingsSwitchProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10): the family IS the weight, so no style
  // below sets a numeric `fontWeight` on top of a real weight file.
  const labelFont = fontFamilyForRole('bodyStrong', fontsReady);
  const descriptionFont = fontFamilyForRole('bodySm', fontsReady);
  const badgeFont = fontFamilyForRole('micro', fontsReady);

  return (
    <View style={[styles.row, disabled ? styles.rowDisabled : null]}>
      {/* UI-SPEC #33 — the text column is the ONLY part that flex-shrinks. */}
      <View style={styles.textColumn}>
        <View style={styles.labelRow}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.label, { fontFamily: labelFont }]}
          >
            {label}
          </Text>
          {disabled && badge !== undefined ? (
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { fontFamily: badgeFont }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {description === undefined ? null : (
          // UI-SPEC #34 — at most two lines, then tail-truncated.
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[styles.description, { fontFamily: descriptionFont }]}
          >
            {description}
          </Text>
        )}
      </View>
      {/* React Native's `Switch` keeps its intrinsic width (RN's flexShrink
          default is 0), so it can never be squeezed by a long label. */}
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        trackColor={{ false: colors.fillQuiet, true: colors.primary }}
        thumbColor={colors.primaryForeground}
        ios_backgroundColor={colors.fillQuiet}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      // UI-SPEC #34 — the row grows to at least the minimum tap target.
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-5'],
      paddingHorizontal: spacingScale['sp-6'],
      paddingVertical: spacingScale['sp-5'],
      backgroundColor: colors.surfaceCard,
      borderRadius: radiiScale['r-md'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    rowDisabled: { opacity: DISABLED_OPACITY },
    textColumn: { flexGrow: 1, flexShrink: 1, gap: spacingScale['sp-3'] },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacingScale['sp-4'] },
    label: {
      flexShrink: 1,
      fontSize: typeRoles.bodyStrong.size,
      color: colors.textPrimary,
    },
    description: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
    // Mirrors `ComingSoonTile`'s badge verbatim.
    badge: {
      backgroundColor: colors.fillQuiet,
      borderRadius: radiiScale['r-pill'],
      paddingHorizontal: spacingScale['sp-4'],
      paddingVertical: spacingScale['sp-1'],
    },
    badgeText: {
      fontSize: typeRoles.micro.size,
      color: colors.textMuted,
    },
  });
}
