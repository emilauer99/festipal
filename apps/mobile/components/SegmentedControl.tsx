import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// Colour roles resolve per render via `useTheme()` (05.1 D-01) — only the
// mode-invariant scales stay at module scope.
const { typeRoles, radiiScale, spacingScale, layout } = tokens;

// Track inset padding — mirrors the legacy ADR-015 design-system source (docs/concept/designs/festival/)'s SegmentedControl (3px),
// not part of the ported `spacingScale` ramp (closest step is 4px), kept
// exact for design fidelity (ADR-015).
const TRACK_PADDING = 3;

export type SegmentedControlOption<TValue extends string> = {
  value: TValue;
  label: string;
};

export type SegmentedControlProps<TValue extends string> = {
  options: readonly SegmentedControlOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
};

/**
 * Owned pill primitive (UI-SPEC Component Contract references, FEST-02).
 * Prop names mirror the legacy ADR-015 design-system source (docs/concept/designs/festival/)'s `SegmentedControl` exactly
 * (`options`/`value`/`onChange` — do not invent divergent names). Labels
 * arrive already-localized from the caller; this component hardcodes no
 * copy of its own. A press on the already-active value is a no-op, an empty
 * `options` array renders an empty track without throwing, and a `value`
 * absent from `options` renders with no item marked selected (never invents
 * a selection).
 */
export function SegmentedControl<TValue extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<TValue>) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved: `label` maps to a real 700 file, so `itemText` carries no
  // numeric fontWeight (05.1 D-10 — no device faux-bold).
  const labelFont = fontFamilyForRole('label', fontsReady);

  return (
    <View style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;

        function handlePress() {
          if (selected) return;
          onChange(option.value);
        }

        return (
          <Pressable
            key={option.value}
            style={[styles.item, selected ? styles.itemSelected : null]}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text
              style={[
                styles.itemText,
                { fontFamily: labelFont },
                selected ? styles.itemTextSelected : styles.itemTextUnselected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    track: {
      flexDirection: 'row',
      padding: TRACK_PADDING,
      backgroundColor: colors.surfaceInset,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radiiScale['r-pill'],
      gap: spacingScale['sp-2'],
    },
    item: {
      flex: 1,
      minHeight: layout.hitMin,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radiiScale['r-pill'],
    },
    itemSelected: {
      backgroundColor: colors.fillBrandQuiet,
    },
    itemText: {
      fontSize: typeRoles.label.size,
    },
    itemTextSelected: {
      color: colors.textPrimary,
    },
    itemTextUnselected: {
      color: colors.textSecondary,
    },
  });
}
