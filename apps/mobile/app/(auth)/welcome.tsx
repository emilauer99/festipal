import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import type { ThemeColors } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radii, spacingScale } = tokens;

/**
 * D-02 — no dev/test bypass lives on this screen or the (auth) group: the
 * only forward path is `Get started` -> `/email` -> the real
 * `authClient.emailOtp.sendVerificationOtp` round-trip (RESEARCH.md
 * Pattern 3). UI-SPEC Scope note #3 — this is the NEW Welcome screen; the
 * former email-entry logic that used to live here moved verbatim to
 * `(auth)/email.tsx`.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10) — no numeric `fontWeight` sits on top.
  const wordmarkFont = fontFamilyForRole('wordmark', fontsReady);
  const taglineFont = fontFamilyForRole('title2', fontsReady);
  const ctaFont = fontFamilyForRole('title3', fontsReady);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* UI-SPEC Scope note #7 — no native header chrome; title kept only as
          the a11y label for iOS back-swipe / screen readers. */}
      <Stack.Screen options={{ headerShown: false, title: t`Welcome` }} />
      <View style={styles.brandBlock}>
        {/* Brand wordmark is NOT wrapped in Lingui (UI-SPEC Copywriting
            Contract) — the trailing dot renders in the accent color. */}
        <Text style={[styles.wordmark, { fontFamily: wordmarkFont }]}>
          quiks
          <Text style={styles.wordmarkDot}>.</Text>
        </Text>
        <Text style={[styles.tagline, { fontFamily: taglineFont }]}>
          <Trans>Your festivals, your crew, your plan.</Trans>
        </Text>
      </View>
      <Pressable style={styles.cta} onPress={() => router.push('/email')}>
        <Text style={[styles.ctaText, { fontFamily: ctaFont }]}>
          <Trans>Get started</Trans>
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bgApp,
      paddingHorizontal: layout.screenPad,
      paddingTop: layout.screenPad,
      paddingBottom: spacingScale['sp-9'],
      justifyContent: 'space-between',
    },
    brandBlock: {
      flex: 1,
      justifyContent: 'center',
      gap: spacingScale['sp-6'],
    },
    // D-02 — the wordmark itself follows the mode (Ink on Papier in light,
    // light text on Ink in dark)…
    wordmark: {
      fontSize: typeRoles.wordmark.size,
      lineHeight: typeRoles.wordmark.size * typeRoles.wordmark.lineHeight,
      color: colors.textPrimary,
    },
    // …while the trailing dot stays Beere in BOTH modes (CI §7: never colour
    // the dot like the word). Same treatment as the splash in `_layout.tsx`.
    wordmarkDot: {
      color: colors.primary,
    },
    tagline: {
      fontSize: typeRoles.title2.size,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textSecondary,
      maxWidth: 300,
    },
    cta: {
      minHeight: layout.hitMin,
      backgroundColor: colors.primary,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
  });
}
