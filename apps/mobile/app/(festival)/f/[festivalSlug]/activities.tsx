import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trans } from '@lingui/react/macro';

import { fontFamilyForRole } from '../../../../lib/fonts';
import { useFontsReady } from '../../../../lib/fonts-context';
import type { ThemeColors } from '../../../../lib/theme';
import { useTheme } from '../../../../lib/theme-context';

/**
 * Registered route stub (09-03 Task 1) — a real, navigable tab so NAV-01's
 * "no decorative tab" acceptance criterion holds from the first commit.
 * Task 2 (same plan) replaces this body with the shared `PlaceholderScreen`
 * component and this tab's final honest copy (D-13).
 */
export default function FestivalActivitiesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const bodyFont = fontFamilyForRole('body', fontsReady);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Text style={[styles.text, { fontFamily: bodyFont }]}>
        <Trans>This tab isn't built yet.</Trans>
      </Text>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bgApp,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: 15,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
}
