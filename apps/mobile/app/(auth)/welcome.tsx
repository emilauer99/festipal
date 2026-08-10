import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@quiks/ui';

import { FONT_BODY, FONT_DISPLAY, resolveFontFamily } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';

const { colors, typeRoles, layout, radii, spacingScale } = tokens;

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
  const fontsReady = useFontsReady();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* UI-SPEC Scope note #7 — no native header chrome; title kept only as
          the a11y label for iOS back-swipe / screen readers. */}
      <Stack.Screen options={{ headerShown: false, title: t`Welcome` }} />
      <View style={styles.brandBlock}>
        {/* Brand wordmark is NOT wrapped in Lingui (UI-SPEC Copywriting
            Contract) — the trailing dot renders in the accent color. */}
        <Text style={[styles.wordmark, { fontFamily: resolveFontFamily(FONT_DISPLAY, fontsReady) }]}>
          quiks
          <Text style={styles.wordmarkDot}>.</Text>
        </Text>
        <Text style={[styles.tagline, { fontFamily: resolveFontFamily(FONT_DISPLAY, fontsReady) }]}>
          <Trans>Your festivals, your crew, your plan.</Trans>
        </Text>
      </View>
      <Pressable style={styles.cta} onPress={() => router.push('/email')}>
        <Text style={[styles.ctaText, { fontFamily: resolveFontFamily(FONT_BODY, fontsReady) }]}>
          <Trans>Get started</Trans>
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  wordmark: {
    fontSize: typeRoles.wordmark.size,
    fontWeight: typeRoles.wordmark.weight,
    lineHeight: typeRoles.wordmark.size * typeRoles.wordmark.lineHeight,
    color: colors.textPrimary,
  },
  wordmarkDot: {
    color: colors.primary,
  },
  tagline: {
    fontSize: typeRoles.title2.size,
    fontWeight: typeRoles.title2.weight,
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
    fontWeight: typeRoles.title3.weight,
    color: colors.textOnPrimary,
  },
});
