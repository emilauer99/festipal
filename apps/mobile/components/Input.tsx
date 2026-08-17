import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

export type InputProps = {
  /** Already-localized field label. This component owns no copy of its own. */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Already-localized placeholder — see D-05's live tag-label preview text. */
  placeholder?: string;
  /** Already-localized helper line, shown only while {@link errorText} is unset. */
  helperText?: string;
  /** Already-localized error line — takes precedence over {@link helperText} when set. */
  errorText?: string;
  maxLength?: number;
  /** Grows/scrolls the field within its own block (UI-SPEC E4 overflow) — used for the description field. */
  multiline?: boolean;
  disabled?: boolean;
};

/**
 * A labeled text field, generalized from `complete-profile.tsx`'s existing
 * field pattern (11-03-PLAN Task 2). Label/placeholder/helper/error arrive as
 * FINISHED strings — the Lingui macro must appear textually at each call
 * site, so this component owns no copy of its own and imports no Lingui
 * runtime. Label in role `label`, field value in role `body`, error line in
 * role `bodySm` in the danger colour.
 */
export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  helperText,
  errorText,
  maxLength,
  multiline = false,
  disabled = false,
}: InputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const labelFont = fontFamilyForRole('label', fontsReady);
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);

  const hasError = errorText !== undefined;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { fontFamily: labelFont }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline ? styles.inputMultiline : null,
          hasError ? styles.inputDanger : null,
          { fontFamily: bodyFont },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        editable={!disabled}
      />
      {hasError ? (
        <Text style={[styles.helperDanger, { fontFamily: bodySmFont }]}>{errorText}</Text>
      ) : helperText !== undefined ? (
        <Text style={[styles.helperMuted, { fontFamily: bodySmFont }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    field: {
      gap: spacingScale['sp-3'],
    },
    label: {
      fontSize: typeRoles.label.size,
      lineHeight: typeRoles.label.size * typeRoles.label.lineHeight,
      color: colors.textSecondary,
    },
    input: {
      minHeight: layout.hitMin,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radiiScale['r-md'],
      paddingHorizontal: spacingScale['sp-5'],
      paddingVertical: spacingScale['sp-5'],
      fontSize: typeRoles.body.size,
      lineHeight: typeRoles.body.size * typeRoles.body.lineHeight,
      color: colors.textPrimary,
    },
    // Description field (multiline): grows/scrolls within its own block
    // rather than a fixed single-line height — never pushes the rest of the
    // form off-screen (UI-SPEC E4 overflow).
    inputMultiline: {
      minHeight: layout.hitMin * 2,
      textAlignVertical: 'top',
    },
    inputDanger: {
      borderColor: colors.dangerText,
      backgroundColor: colors.fillDangerSubtle,
    },
    helperMuted: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
    helperDanger: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.dangerText,
    },
  });
}
