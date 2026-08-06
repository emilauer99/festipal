import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trans } from '@lingui/react/macro';
import { tokens } from '@festipal/ui';

import { FONT_DISPLAY, resolveFontFamily } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';

const { colors, typeRoles, layout } = tokens;

/**
 * Minimal Home tab placeholder so the `home` route renders — the real
 * hero + "My festivals" rail + coming-soon menu ships in 05-07 (HOME-02).
 * This plan only needs the Home tab to exist and be the default tab
 * (`(tabs)/_layout.tsx` `initialRouteName="home"`).
 */
export default function HomeScreen() {
  const fontsReady = useFontsReady();
  const displayFont = resolveFontFamily(FONT_DISPLAY, fontsReady);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Text style={[styles.heading, { fontFamily: displayFont }]}>
        <Trans>Home</Trans>
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: layout.screenPad,
    backgroundColor: colors.bgApp,
  },
  heading: {
    fontSize: typeRoles.title2.size,
    fontWeight: typeRoles.title2.weight,
    lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
    color: colors.textPrimary,
  },
});
