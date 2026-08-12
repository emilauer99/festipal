import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope. Nothing colour-valued
// may live out here, or it freezes at import time and can never follow the mode
// (light is the default case, so it is also the first one to break).
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const ICON_SIZE = 22;
const CHEVRON_SIZE = 18;
/** UI-SPEC Placeholder Pattern A — the dampening factor for a "not real yet" row. */
const DISABLED_OPACITY = 0.45;

export type ListRowProps = {
  /** The Lucide icon component to render (e.g. `UserRound`) — never a name string. */
  icon: LucideIcon;
  /** Already-localized row label. This component owns no copy. */
  label: string;
  /** Optional already-localized right-aligned value (e.g. an e-mail address). */
  value?: string;
  /** Destructive row (e.g. "Abmelden"): icon + label take the danger TEXT variant. */
  danger?: boolean;
  /** UI-SPEC Pattern A — dampened + static "Soon" badge. Requires {@link badge}. */
  disabled?: boolean;
  /** Already-localized "Soon"/"Bald" badge text, rendered only while {@link disabled}. */
  badge?: string;
  /** Press handler. Its presence is what makes the row a button AND shows the chevron. */
  onPress?: () => void;
  /**
   * Already-localized screen-reader label, built by the CALLER through Lingui.
   * Pitfall 4: eslint's `no-literal-string` excludes `accessibilityLabel` from its
   * jsx-attributes check, so a hardcoded label here would NOT be caught — routing
   * it through the caller keeps it in the catalog by construction.
   */
  accessibilityLabel: string;
};

/**
 * The shared settings/account row for Mehr and Profil (UI-SPEC § Component
 * Inventory). An owned RN-primitive component on shared tokens — no third-party
 * UI kit (ADR-022).
 *
 * It carries BOTH placeholder treatments the phase uses, and the two are
 * deliberately independent props:
 *
 * - **Pattern A** (`disabled`) — dampened to {@link DISABLED_OPACITY} plus the
 *   static badge, exactly as `ComingSoonTile` already renders it.
 * - **Pattern B** (`onPress` without `disabled`) — full opacity, real value,
 *   chevron kept; the tap opens the shared "kommt bald" toast instead of a real
 *   edit flow.
 *
 * `disabled` is a VISUAL + assistive-tech state, not a press gate: a dampened
 * row still fires `onPress` so it can answer a tap with the toast. A row that
 * must not react at all simply gets no `onPress` — then it renders as a plain
 * `View` with no button role and no chevron.
 */
export function ListRow({
  icon: Icon,
  label,
  value,
  danger = false,
  disabled = false,
  badge,
  onPress,
  accessibilityLabel,
}: ListRowProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10): the family IS the weight, so no style
  // below sets a numeric `fontWeight` on top of a real weight file. None of the
  // three roles used here is an Outfit role, so none carries CI tracking.
  const labelFont = fontFamilyForRole('bodyStrong', fontsReady);
  const valueFont = fontFamilyForRole('bodySm', fontsReady);
  const badgeFont = fontFamilyForRole('micro', fontsReady);

  // Status-hue rule (tokens.ts): a status colour used as TEXT or ICON TINT
  // always takes its `*Text` variant — the bare `danger` fill measures 2.98:1
  // on Papier, and hell-first makes Papier the default surface.
  const accentColor = danger ? colors.dangerText : colors.textMuted;
  const labelColor = danger ? colors.dangerText : colors.textPrimary;

  const content = (
    <>
      <Icon size={ICON_SIZE} color={accentColor} strokeWidth={2} />
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.label, { fontFamily: labelFont, color: labelColor }]}
      >
        {label}
      </Text>
      {value === undefined ? null : (
        // UI-SPEC #22 — the value is single-line and gives up space FIRST (a
        // higher `flexShrink` factor than the label), so a long e-mail truncates
        // before the label it belongs to does.
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.value, { fontFamily: valueFont }]}
        >
          {value}
        </Text>
      )}
      {disabled && badge !== undefined ? (
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { fontFamily: badgeFont }]}>{badge}</Text>
        </View>
      ) : null}
      {onPress === undefined ? null : (
        <ChevronRight size={CHEVRON_SIZE} color={colors.textMuted} strokeWidth={2} />
      )}
    </>
  );

  const rowStyle = [styles.row, disabled ? styles.rowDisabled : null];

  if (onPress === undefined) {
    return (
      <View style={rowStyle} accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled }}>
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
      accessibilityState={{ disabled }}
    >
      {content}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      // UI-SPEC § Spacing — every row is a real 44px tap target even when its
      // content is shorter.
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-4'],
      paddingHorizontal: spacingScale['sp-6'],
      paddingVertical: spacingScale['sp-5'],
      backgroundColor: colors.surfaceCard,
      borderRadius: radiiScale['r-md'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    rowDisabled: { opacity: DISABLED_OPACITY },
    // `flexGrow` right-aligns the value by consuming the free space; the low
    // `flexShrink` is what gives the label its layout priority once the row
    // actually overflows.
    label: {
      flexGrow: 1,
      flexShrink: 1,
      fontSize: typeRoles.bodyStrong.size,
    },
    value: {
      flexShrink: 3,
      textAlign: 'right',
      fontSize: typeRoles.bodySm.size,
      color: colors.textMuted,
    },
    // Mirrors `ComingSoonTile`'s badge verbatim, laid out inline instead of
    // absolutely positioned — a horizontal row has no free corner.
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
