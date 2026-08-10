import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';
import { AlertCircle } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { authClient } from '../../lib/auth-client';
import { mapOtpError, type OtpErrorInput, type OtpErrorKind } from '../../lib/otp-error';
import { NETWORK_TIMEOUT_MS, withTimeout } from '../../lib/with-timeout';
import { FONT_BODY, FONT_DISPLAY, resolveFontFamily } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import { KeyboardScreen } from '../../components/KeyboardScreen';
import { OtpBoxes } from '../../components/OtpBoxes';
import { ResendCountdown } from '../../components/ResendCountdown';

const { colors, typeRoles, layout, radii, spacingScale } = tokens;

const OTP_LENGTH = 6;
// UI-SPEC ## Color — status tints are always a 16%-ish tint behind colored
// text/border, never a solid fill; the mockup renders the error box at
// rgba(255,77,94,.12) specifically.
const ERROR_TINT = 'rgba(255,77,94,0.12)';

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
  const fontsReady = useFontsReady();
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
          <Text style={[styles.heading, { fontFamily: resolveFontFamily(FONT_DISPLAY, fontsReady) }]}>
            <Trans>Enter code</Trans>
          </Text>
          <Text style={[styles.subtitle, { fontFamily: resolveFontFamily(FONT_BODY, fontsReady) }]}>
            {subtitlePrefix}
            <Text
              style={[
                styles.subtitleStrong,
                { fontFamily: resolveFontFamily(FONT_BODY, fontsReady) },
              ]}
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
              <AlertCircle size={16} color={colors.danger} strokeWidth={2} />
              <Text
                style={[
                  styles.errorHeadline,
                  { fontFamily: resolveFontFamily(FONT_BODY, fontsReady) },
                ]}
              >
                {errorHeadline(errorKind)}
              </Text>
            </View>
            {errorKind === 'wrong-or-expired' ? (
              <Text style={[styles.errorBody, { fontFamily: resolveFontFamily(FONT_BODY, fontsReady) }]}>
                <Trans>Get a new code.</Trans>
              </Text>
            ) : null}
          </View>
        ) : null}

        {errorKind === 'wrong-or-expired' ? (
          <Pressable style={styles.retryButton} onPress={handleRetrySend}>
            <Text
              style={[
                styles.retryButtonText,
                { fontFamily: resolveFontFamily(FONT_BODY, fontsReady) },
              ]}
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
                style={[
                  styles.changeEmailText,
                  { fontFamily: resolveFontFamily(FONT_BODY, fontsReady) },
                ]}
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

const styles = StyleSheet.create({
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
    fontWeight: typeRoles.display2.weight,
    lineHeight: typeRoles.display2.size * typeRoles.display2.lineHeight,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typeRoles.body.size,
    fontWeight: typeRoles.body.weight,
    lineHeight: typeRoles.body.size * typeRoles.body.lineHeight,
    color: colors.textSecondary,
  },
  subtitleStrong: {
    fontSize: typeRoles.bodyStrong.size,
    fontWeight: typeRoles.bodyStrong.weight,
    color: colors.textPrimary,
  },
  errorBox: {
    backgroundColor: ERROR_TINT,
    borderWidth: 1,
    borderColor: colors.danger,
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
    fontWeight: typeRoles.bodyStrong.weight,
    color: colors.danger,
  },
  errorBody: {
    fontSize: typeRoles.bodySm.size,
    fontWeight: typeRoles.bodySm.weight,
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
    fontWeight: typeRoles.title3.weight,
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
