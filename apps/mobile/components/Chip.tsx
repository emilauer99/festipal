import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const REMOVE_ICON_SIZE = 14;

export type ChipProps = {
  /** Already-localized label. This component owns no copy of its own. */
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Renders a trailing remove tap area (its own hit target) only when set. */
  onRemove?: () => void;
  /** Already-localized a11y label for the remove tap area; defaults to {@link label}. */
  removeAccessibilityLabel?: string;
};

/**
 * One generic pill primitive serving three roles (11-03-PLAN Task 2): the
 * single-select tag chip, the single-select day chip, and the removable
 * captured-location chip ("Standort angeheftet"). It owns no group/selection
 * logic — the CALLER decides which chip in a row is `selected`, so
 * single-select stays a property of the call site and can never silently
 * become multi-select (T-11-11).
 *
 * Selected state: `fillBrandQuiet` fill + `borderBrand` border + `primary`
 * text (UI-SPEC § Color item 3, the exact accent treatment `SegmentedControl`
 * establishes for a selected item). Normal state: `fillQuiet` fill +
 * `textSecondary` text — the same neutral pairing `ActivityCard`'s tag/
 * "Gestartet" chips and `ListRow`'s badge already use. No new spacing value
 * or typo role is introduced.
 */
export function Chip({ label, selected = false, onPress, onRemove, removeAccessibilityLabel }: ChipProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const labelFont = fontFamilyForRole('micro', fontsReady);

  const content = (
    <View style={[styles.chip, selected ? styles.chipSelected : styles.chipNeutral]}>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.label,
          { fontFamily: labelFont },
          selected ? styles.labelSelected : styles.labelNeutral,
        ]}
      >
        {label}
      </Text>
      {onRemove ? (
        <Pressable
          onPress={onRemove}
          style={styles.removeButton}
          accessibilityRole="button"
          accessibilityLabel={removeAccessibilityLabel ?? label}
        >
          <X
            size={REMOVE_ICON_SIZE}
            color={selected ? colors.primary : colors.textSecondary}
            strokeWidth={2}
          />
        </Pressable>
      ) : null}
    </View>
  );

  if (onPress === undefined) {
    return content;
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      {content}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: layout.hitMin,
      borderRadius: radiiScale['r-pill'],
      borderWidth: 1,
      paddingHorizontal: spacingScale['sp-5'],
      gap: spacingScale['sp-2'],
    },
    chipNeutral: {
      backgroundColor: colors.fillQuiet,
      borderColor: 'transparent',
    },
    chipSelected: {
      backgroundColor: colors.fillBrandQuiet,
      borderColor: colors.borderBrand,
    },
    label: {
      fontSize: typeRoles.micro.size,
    },
    labelNeutral: {
      color: colors.textSecondary,
    },
    labelSelected: {
      color: colors.primary,
    },
    // Its OWN tap area, per Task 2's action text — floors at the same
    // Mindest-Tapfläche every Pressable in this phase uses (layout.hitMin),
    // not a hitSlop-only extension.
    removeButton: {
      minWidth: layout.hitMin,
      minHeight: layout.hitMin,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
