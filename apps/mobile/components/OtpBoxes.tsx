import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { tokens } from '@quiks/ui';

import { FONT_MONO, resolveFontFamily } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';

const { colors, typeRoles, radii, spacingScale } = tokens;

const BOX_SIZE = 46;
const DEFAULT_LENGTH = 6;

export type OtpBoxesProps = {
  /** Current sanitized digit string (already stripped to 0-9, capped to `length`). */
  value: string;
  onChangeText: (value: string) => void;
  /** Fires once, the instant the value reaches `length` digits (auto-submit). */
  onComplete: (value: string) => void;
  /** Muted, non-interactive state while the verify call is in flight. */
  disabled?: boolean;
  /** Danger-tinted border on a wrong/expired-code error. */
  hasError?: boolean;
  length?: number;
};

/**
 * RESEARCH Pattern 1 / UI-SPEC Scope note #4 — six fixed-width box `View`s
 * reading off ONE real, near-invisible `TextInput`. Preserves Phase 3's
 * "overflow-impossible" reasoning (the single real input's `maxLength` makes
 * six-digit overflow structurally impossible by construction) while matching
 * the mockup's six-separate-box visual. `onComplete` is the auto-submit
 * trigger (UI-SPEC Scope note #5) — there is no Verify button anywhere in
 * this tree.
 */
export function OtpBoxes({
  value,
  onChangeText,
  onComplete,
  disabled = false,
  hasError = false,
  length = DEFAULT_LENGTH,
}: OtpBoxesProps) {
  const fontsReady = useFontsReady();
  const inputRef = useRef<TextInput>(null);
  const caretOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(caretOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(caretOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [caretOpacity]);

  function handleChangeText(raw: string) {
    const sanitized = raw.replace(/[^0-9]/g, '').slice(0, length);
    onChangeText(sanitized);
    if (sanitized.length === length) {
      onComplete(sanitized);
    }
  }

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      disabled={disabled}
      style={styles.row}
      accessibilityRole="none"
    >
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] ?? '';
        const isActive = !disabled && index === value.length;
        return (
          <View
            key={index}
            style={[
              styles.box,
              isActive ? styles.boxActive : null,
              hasError ? styles.boxError : null,
              disabled ? styles.boxDisabled : null,
            ]}
          >
            {digit ? (
              <Text style={[styles.digit, { fontFamily: resolveFontFamily(FONT_MONO, fontsReady) }]}>
                {digit}
              </Text>
            ) : isActive ? (
              <Animated.View style={[styles.caret, { opacity: caretOpacity }]} />
            ) : null}
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        maxLength={length}
        editable={!disabled}
        caretHidden
        autoFocus
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacingScale['sp-4'],
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceInset,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: colors.primary,
  },
  boxError: {
    borderColor: colors.danger,
  },
  boxDisabled: {
    opacity: 0.5,
  },
  digit: {
    fontSize: typeRoles.otpDigit.size,
    fontWeight: typeRoles.otpDigit.weight,
    lineHeight: typeRoles.otpDigit.size * typeRoles.otpDigit.lineHeight,
    color: colors.textPrimary,
  },
  caret: {
    width: 2,
    height: typeRoles.otpDigit.size,
    backgroundColor: colors.primary,
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.01,
    color: 'transparent',
  },
});
