import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';
import { AlertCircle } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { authClient } from '../../lib/auth-client';
import { mapOtpError, type OtpErrorInput, type OtpErrorKind } from '../../lib/otp-error';
import { NETWORK_TIMEOUT_MS, withTimeout } from '../../lib/with-timeout';
import { fontFamilyForRole } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import type { ThemeColors } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';
import { KeyboardScreen } from '../../components/KeyboardScreen';
import { OtpBoxes } from '../../components/OtpBoxes';
import { ResendCountdown } from '../../components/ResendCountdown';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radii, spacingScale } = tokens;

const OTP_LENGTH = 6;

/**
 * UI-SPEC Scope note #5 — OTP auto-submits the instant the 6th digit lands
 * (`OtpBoxes` `onComplete`); there is NO Verify button and NO
 * "Verify"/"Verifying…" copy anywhere in this tree (superseded, Copywriting
 * Contract). A wrong/expired code renders ONE unified danger-tinted error box
 * (headline + body + "Send new code" retry CTA) — `mapOtpError` still
 * distinguishes OTP_EXPIRED/INVALID_OTP/TOO_MANY_ATTEMPTS/429 internally
 * (lib/otp-error.ts), only the RETURN COPY converges.
 */
export default function VerifyScreen() {
  const params = useLocalSearchParams();
  const emailParam = params.email;
  const email = Array.isArray(emailParam) ? (emailParam[0] ?? '') : (emailParam ?? '');
  const router = useRouter();
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10) — no numeric `fontWeight` sits on top.
  const headingFont = fontFamilyForRole('display2', fontsReady);
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const bodyStrongFont = fontFamilyForRole('bodyStrong', fontsReady);
  const ctaFont = fontFamilyForRole('title3', fontsReady);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorKind, setErrorKind] = useState<OtpErrorKind | null>(null);
  // Bumping this key remounts ResendCountdown, resetting its internal 60s
  // timer to fresh — used whether the resend came from the countdown's own
  // link OR the error box's "Send new code" CTA, so the two affordances
  // never show an inconsistent countdown (Claude's-discretion consistency
  // backstop, not pictured in the mockup).
  const [resendGeneration, setResendGeneration] = useState(0);

  function errorHeadline(kind: OtpErrorKind): string {
    switch (kind) {
      case 'wrong-or-expired':
        return t`That code is wrong or has expired.`;
      case 'rate-limited':
        return t`Too many attempts — try again in a few minutes.`;
      case 'network':
        return t`Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.`;
    }
  }

  async function submitOtp(code: string) {
    setVerifying(true);
    setErrorKind(null);
    try {
      // D-02 — the ONLY way this screen ever establishes a session: the real
      // OTP round-trip. No code path here sets a session directly.
      const { error: verifyError } = await withTimeout(
        authClient.signIn.emailOtp({ email, otp: code }),
        NETWORK_TIMEOUT_MS,
      );
      if (verifyError) {
        setErrorKind(mapOtpError(verifyError as OtpErrorInput));
        return;
      }
      // Success updates authClient's session atom; the root layout's guard
      // (app/_layout.tsx) re-resolves and routes forward on its own — no
      // manual navigation from here.
    } catch {
      // Phase-4 UAT fix — a timed-out/unreachable request surfaces the same
      // localized network error instead of leaving the boxes stuck disabled.
      setErrorKind('network');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend(): Promise<boolean> {
    setErrorKind(null);
    try {
      // Pitfall 9 — server-side resendStrategy:"reuse" (Phase 2) means this
      // resend never invalidates the code still open in the user's first
      // email; it's the same code, just re-sent.
      const { error: resendError } = await withTimeout(
        authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' }),
        NETWORK_TIMEOUT_MS,
      );
      if (resendError) {
        setErrorKind(mapOtpError(resendError as OtpErrorInput));
        return false;
      }
      setResendGeneration((generation) => generation + 1);
      return true;
    } catch {
      // Phase-4 UAT fix — unreachable/timed-out resend surfaces the network error.
      setErrorKind('network');
      return false;
    }
  }

  function handleRetrySend() {
    setOtp('');
    setErrorKind(null);
    void handleResend();
  }

  const subtitleText = t`Six digits sent to ${email}.`;
  const emailIndex = subtitleText.indexOf(email);
  const subtitlePrefix = emailIndex >= 0 ? subtitleText.slice(0, emailIndex) : subtitleText;
  const subtitleSuffix = emailIndex >= 0 ? subtitleText.slice(emailIndex + email.length) : '';

  return (
    <KeyboardScreen>
      {/* UI-SPEC Scope note #7 — no native header chrome; title kept only as
          the a11y label for iOS back-swipe / screen readers. */}
      <Stack.Screen options={{ headerShown: false, title: t`Enter code` }} />
      <View style={styles.content}>
        <View style={styles.headingBlock}>
          <Text style={[styles.heading, { fontFamily: headingFont }]}>
            <Trans>Enter code</Trans>
          </Text>
          <Text style={[styles.subtitle, { fontFamily: bodyFont }]}>
            {subtitlePrefix}
            <Text
              style={[styles.subtitleStrong, { fontFamily: bodyStrongFont }]}
            >
              {email}
            </Text>
            {subtitleSuffix}
          </Text>
        </View>

        <OtpBoxes
          value={otp}
          onChangeText={setOtp}
          onComplete={(code) => void submitOtp(code)}
          disabled={verifying}
          hasError={errorKind !== null}
          length={OTP_LENGTH}
        />

        {errorKind ? (
          <View style={styles.errorBox}>
            <View style={styles.errorHeadlineRow}>
              <AlertCircle size={16} color={colors.dangerText} strokeWidth={2} />
              <Text
                style={[styles.errorHeadline, { fontFamily: bodyStrongFont }]}
              >
                {errorHeadline(errorKind)}
              </Text>
            </View>
            {errorKind === 'wrong-or-expired' ? (
              <Text style={[styles.errorBody, { fontFamily: bodySmFont }]}>
                <Trans>Get a new code.</Trans>
              </Text>
            ) : null}
          </View>
        ) : null}

        {errorKind === 'wrong-or-expired' ? (
          <Pressable style={styles.retryButton} onPress={handleRetrySend}>
            <Text
              style={[styles.retryButtonText, { fontFamily: ctaFont }]}
            >
              <Trans>Send new code</Trans>
            </Text>
          </Pressable>
        ) : (
          <View style={styles.footer}>
            <ResendCountdown key={resendGeneration} onResend={handleResend} />
            <Pressable
              onPress={() => router.back()}
              style={styles.changeEmailWrap}
              hitSlop={8}
            >
              <Text
                style={[styles.changeEmailText, { fontFamily: bodySmFont }]}
              >
                <Trans>Change email</Trans>
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      // flexGrow (not flex:1) so the block grows to fill and stays centered when
      // content is short, but keeps its intrinsic height (RN default flexShrink:0)
      // and overflows into a scroll when the soft keyboard shrinks the viewport —
      // otherwise flex:1's flexShrink:1/flexBasis:0 clamps it to the viewport and
      // the KeyboardScreen ScrollView has nothing to scroll.
      flexGrow: 1,
      justifyContent: 'center',
      gap: spacingScale['sp-8'],
    },
    headingBlock: {
      gap: spacingScale['sp-6'],
    },
    heading: {
      fontSize: typeRoles.display2.size,
      letterSpacing: typeRoles.display2.letterSpacing,
      lineHeight: typeRoles.display2.size * typeRoles.display2.lineHeight,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: typeRoles.body.size,
      lineHeight: typeRoles.body.size * typeRoles.body.lineHeight,
      color: colors.textSecondary,
    },
    subtitleStrong: {
      fontSize: typeRoles.bodyStrong.size,
      color: colors.textPrimary,
    },
    // UI-SPEC ## Color — the status tint is a token, not a hand-mixed literal:
    // `fillDangerQuiet` IS danger at 12%, the exact value the mockup used. The
    // 1px border is a non-text UI component at the 3:1 threshold, so it takes
    // `dangerText`, not the fill hue (2.98:1 on Papier).
    errorBox: {
      backgroundColor: colors.fillDangerQuiet,
      borderWidth: 1,
      borderColor: colors.dangerText,
      borderRadius: radii.md,
      padding: spacingScale['sp-6'],
      gap: spacingScale['sp-4'],
    },
    errorHeadlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-2'],
    },
    errorHeadline: {
      flexShrink: 1,
      fontSize: typeRoles.bodyStrong.size,
      color: colors.dangerText,
    },
    errorBody: {
      fontSize: typeRoles.bodySm.size,
      color: colors.textSecondary,
    },
    retryButton: {
      minHeight: layout.hitMin,
      backgroundColor: colors.primary,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    retryButtonText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
    footer: {
      gap: spacingScale['sp-5'],
    },
    changeEmailWrap: {
      minHeight: layout.hitMin,
      justifyContent: 'center',
    },
    changeEmailText: {
      fontSize: typeRoles.bodySm.size,
      color: colors.textMuted,
    },
  });
}
