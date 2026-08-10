import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';
import { ArrowLeft } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { authClient } from '../../lib/auth-client';
import { NETWORK_TIMEOUT_MS, withTimeout } from '../../lib/with-timeout';
import { fontFamilyForRole } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import type { ThemeColors } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';
import { KeyboardScreen } from '../../components/KeyboardScreen';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radii, spacingScale } = tokens;

/**
 * D-02 — the real (unstyled-no-more) start of the email-OTP flow: `handleSendCode`
 * moved verbatim from the former `(auth)/index.tsx` (now Welcome, UI-SPEC Scope
 * note #3) — no dev/test bypass exists anywhere in this file, the only way
 * forward is the actual `authClient.emailOtp.sendVerificationOtp` round-trip
 * (RESEARCH.md Pattern 3).
 */
export default function EmailEntryScreen() {
  const router = useRouter();
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10) — no numeric `fontWeight` sits on top.
  const headingFont = fontFamilyForRole('display2', fontsReady);
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const labelFont = fontFamilyForRole('label', fontsReady);
  const ctaFont = fontFamilyForRole('title3', fontsReady);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && !sending;

  async function handleSendCode() {
    const trimmedEmail = email.trim();
    setSending(true);
    setError(null);
    try {
      const { error: sendError } = await withTimeout(
        authClient.emailOtp.sendVerificationOtp({ email: trimmedEmail, type: 'sign-in' }),
        NETWORK_TIMEOUT_MS,
      );
      if (sendError) {
        // T-03-10 — surface the localized "try again later" state on a 429
        // rather than silently retrying; anything else on this endpoint is
        // treated as an unreachable-server error (real input validation stays
        // server-side, V5).
        setError(
          sendError.status === 429
            ? t`Too many attempts — try again in a few minutes.`
            : t`Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.`,
        );
        return;
      }
      router.push({ pathname: '/verify', params: { email: trimmedEmail } });
    } catch {
      // Phase-4 UAT fix — a timed-out/thrown request (device can't reach the
      // dev API) must surface the unreachable-server state instead of leaving
      // the CTA stuck on "Sending…" forever.
      setError(
        t`Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.`,
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardScreen>
      {/* UI-SPEC Scope note #7 — no native header chrome; title kept only as
          the a11y label for iOS back-swipe / screen readers. */}
      <Stack.Screen options={{ headerShown: false, title: t`Your email` }} />
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityLabel={t`Back`}
        hitSlop={12}
      >
        <ArrowLeft size={24} color={colors.textPrimary} strokeWidth={2} />
      </Pressable>
      <View style={styles.content}>
        <Text style={[styles.heading, { fontFamily: headingFont }]}>
          <Trans>Your email</Trans>
        </Text>
        <Text style={[styles.subtitle, { fontFamily: bodyFont }]}>
          <Trans>We'll send you a code in a moment.</Trans>
        </Text>
        <View style={styles.field}>
          <Text style={[styles.label, { fontFamily: labelFont }]}>
            <Trans>Email</Trans>
          </Text>
          <TextInput
            style={[styles.input, { fontFamily: bodyFont }]}
            value={email}
            onChangeText={setEmail}
            placeholder={t`you@example.com`}
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            editable={!sending}
          />
        </View>
        {error ? (
          <Text style={[styles.error, { fontFamily: bodySmFont }]}>
            {error}
          </Text>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Pressable
          style={[styles.cta, !canSubmit ? styles.ctaDisabled : null]}
          onPress={handleSendCode}
          disabled={!canSubmit}
        >
          <Text style={[styles.ctaText, { fontFamily: ctaFont }]}>
            {sending ? t`Sending…` : t`Send code`}
          </Text>
        </Pressable>
        <Text style={[styles.ctaHelper, { fontFamily: bodySmFont }]}>
          <Trans>We'll send you a 6-digit code — no password needed.</Trans>
        </Text>
      </View>
    </KeyboardScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backButton: {
      width: layout.hitMin,
      height: layout.hitMin,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -spacingScale['sp-5'],
    },
    content: {
      // flexGrow (not flex:1) so the block grows to fill and stays centered when
      // content is short, but keeps its intrinsic height (RN default flexShrink:0)
      // and overflows into a scroll when the soft keyboard shrinks the viewport —
      // otherwise flex:1's flexShrink:1/flexBasis:0 clamps it to the viewport and
      // the KeyboardScreen ScrollView has nothing to scroll.
      flexGrow: 1,
      justifyContent: 'center',
      gap: spacingScale['sp-6'],
    },
    heading: {
      fontSize: typeRoles.display2.size,
      lineHeight: typeRoles.display2.size * typeRoles.display2.lineHeight,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: typeRoles.body.size,
      lineHeight: typeRoles.body.size * typeRoles.body.lineHeight,
      color: colors.textSecondary,
    },
    field: {
      gap: spacingScale['sp-5'],
    },
    label: {
      fontSize: typeRoles.label.size,
      lineHeight: typeRoles.label.size * typeRoles.label.lineHeight,
      color: colors.textSecondary,
    },
    input: {
      minHeight: layout.hitMin,
      backgroundColor: colors.surfaceInset,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.control,
      paddingHorizontal: spacingScale['sp-6'],
      fontSize: typeRoles.body.size,
      color: colors.textPrimary,
    },
    // Status hue as TEXT resolves through `dangerText` (4.54:1 on Papier),
    // never the bare `danger` fill (2.98:1).
    error: {
      color: colors.dangerText,
      fontSize: typeRoles.bodySm.size,
    },
    footer: {
      gap: spacingScale['sp-5'],
    },
    cta: {
      minHeight: layout.hitMin,
      backgroundColor: colors.primary,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaDisabled: { opacity: 0.45 },
    ctaText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
    ctaHelper: {
      textAlign: 'center',
      fontSize: typeRoles.bodySm.size,
      color: colors.textMuted,
    },
  });
}
