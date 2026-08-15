import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

// UI-SPEC § Spacing "Exceptions" — the stepper's increment/decrement circle
// reuses AppHeader's LEFT_BUTTON_CIRCLE_SIZE precedent (36px), the ONE value
// in this phase allowed off the sp-*/layout ramp. Do not introduce a second
// circle size anywhere in this phase.
const STEPPER_CIRCLE_SIZE = 36;
const STEPPER_ICON_SIZE = 16;
const STEPPER_DISABLED_OPACITY = 0.4;
const MIN_CAPACITY = 1;

export type CapacityFieldProps = {
  /** `null` = unlimited — the default state (D-08). */
  value: number | null;
  onChange: (value: number | null) => void;
};

/**
 * The "Kapazität" block (D-08, 11-03-PLAN Task 3). Starts UNLIMITED — the
 * block is never empty and never opens in the stepper state; a tap on
 * "Begrenzen" activates the Max-only stepper (floor 1, no value 0 is
 * reachable, so no error state exists in this component). There is
 * deliberately NO minimum-participants stepper (D-06) — the "max set, min
 * unset" state is unreachable BY CONSTRUCTION, not by a runtime check.
 */
export function CapacityField({ value, onChange }: CapacityFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const { t } = useLingui();
  const labelFont = fontFamilyForRole('label', fontsReady);
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const monoFont = fontFamilyForRole('mono', fontsReady);

  const isLimited = value !== null;
  const atFloor = value !== null && value <= MIN_CAPACITY;

  function activateLimit() {
    onChange(MIN_CAPACITY);
  }
  function deactivateLimit() {
    // The rollback always returns to UNLIMITED, never to a number (D-08).
    onChange(null);
  }
  function decrement() {
    if (value === null || value <= MIN_CAPACITY) return;
    onChange(value - 1);
  }
  function increment() {
    onChange((value ?? MIN_CAPACITY) + 1);
  }

  return (
    <View style={styles.block}>
      <Text style={[styles.eyebrow, { fontFamily: labelFont }]}>
        <Trans>Capacity</Trans>
      </Text>

      {isLimited ? (
        <View style={styles.stepperRow}>
          <Pressable
            style={[styles.stepperCircle, atFloor ? styles.stepperCircleDisabled : null]}
            onPress={decrement}
            disabled={atFloor}
            accessibilityRole="button"
            accessibilityLabel={t`Decrease capacity`}
            accessibilityState={{ disabled: atFloor }}
          >
            <Minus size={STEPPER_ICON_SIZE} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={[styles.stepperValue, { fontFamily: monoFont }]}>{value}</Text>
          <Pressable
            style={styles.stepperCircle}
            onPress={increment}
            accessibilityRole="button"
            accessibilityLabel={t`Increase capacity`}
          >
            <Plus size={STEPPER_ICON_SIZE} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Pressable style={styles.textLink} onPress={deactivateLimit} accessibilityRole="button">
            <Text style={[styles.textLinkText, { fontFamily: bodyFont }]}>
              <Trans>Remove limit</Trans>
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.unlimitedRow}>
          <Text style={[styles.unlimitedText, { fontFamily: bodyFont }]}>
            <Trans>No limit</Trans>
          </Text>
          <Pressable style={styles.textLink} onPress={activateLimit} accessibilityRole="button">
            <Text style={[styles.textLinkText, { fontFamily: bodyFont }]}>
              <Trans>Limit it</Trans>
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    block: {
      gap: spacingScale['sp-4'],
      padding: spacingScale['sp-5'],
      borderRadius: radiiScale['r-md'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceCard,
    },
    eyebrow: {
      fontSize: typeRoles.label.size,
      lineHeight: typeRoles.label.size * typeRoles.label.lineHeight,
      color: colors.textSecondary,
    },
    unlimitedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: layout.hitMin,
    },
    unlimitedText: {
      fontSize: typeRoles.body.size,
      color: colors.textPrimary,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-5'],
    },
    stepperCircle: {
      width: STEPPER_CIRCLE_SIZE,
      height: STEPPER_CIRCLE_SIZE,
      borderRadius: radiiScale['r-pill'],
      backgroundColor: colors.fillQuiet,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperCircleDisabled: {
      opacity: STEPPER_DISABLED_OPACITY,
    },
    stepperValue: {
      minWidth: layout.hitMin,
      textAlign: 'center',
      fontSize: typeRoles.mono.size,
      color: colors.textPrimary,
    },
    textLink: {
      minHeight: layout.hitMin,
      justifyContent: 'center',
    },
    textLinkText: {
      fontSize: typeRoles.body.size,
      color: colors.primary,
    },
  });
}
