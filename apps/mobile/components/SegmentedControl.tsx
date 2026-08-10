import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '@festipal/ui';

import { FONT_BODY, resolveFontFamily } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';

const { colors, typeRoles, radiiScale, spacingScale, layout } = tokens;

// Track inset padding — mirrors `festipal-ds.js`'s SegmentedControl (3px),
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
 * Prop names mirror `festipal-ds.js`'s `SegmentedControl` exactly
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
  const fontsReady = useFontsReady();
  const bodyFont = resolveFontFamily(FONT_BODY, fontsReady);

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
                { fontFamily: bodyFont },
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

const styles = StyleSheet.create({
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
    fontWeight: typeRoles.label.weight,
  },
  itemTextSelected: {
    color: colors.textPrimary,
  },
  itemTextUnselected: {
    color: colors.textSecondary,
  },
});
