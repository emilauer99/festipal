import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';

import { authClient } from '../../lib/auth-client';

const OTP_LENGTH = 6;

/**
 * @better-fetch/fetch spreads the server's JSON error body onto the error
 * object it returns (its non-`throw` branch) — `code` matches better-auth's
 * `EMAIL_OTP_ERROR_CODES` (`OTP_EXPIRED` / `INVALID_OTP` / `TOO_MANY_ATTEMPTS`,
 * from the `email-otp` plugin's own attempt counter). A bare 429 with no
 * `code` is the account-level rate limiter (better-auth core), a distinct
 * mechanism from the plugin's attempt counter but the same user-facing state.
 */
type OtpError = { code?: string; status?: number } | null;

export default function VerifyScreen() {
  const params = useLocalSearchParams();
  const emailParam = params.email;
  const email = Array.isArray(emailParam) ? (emailParam[0] ?? '') : (emailParam ?? '');
  const { t } = useLingui();
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canVerify = otp.length === OTP_LENGTH && !verifying;

  function mapOtpError(otpError: OtpError): string {
    if (otpError?.code === 'OTP_EXPIRED') {
      return t`That code has expired — request a new one.`;
    }
    if (otpError?.code === 'TOO_MANY_ATTEMPTS' || otpError?.status === 429) {
      return t`Too many attempts — try again in a few minutes.`;
    }
    if (otpError?.code === 'INVALID_OTP') {
      return t`That code didn't work — check your email and try again.`;
    }
    return t`Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.`;
  }

  async function handleVerify() {
    setVerifying(true);
    setError(null);
    // D-02 — the ONLY way this screen ever establishes a session: the real
    // OTP round-trip. No code path here sets a session directly.
    const { error: verifyError } = await authClient.signIn.emailOtp({ email, otp });
    setVerifying(false);
    if (verifyError) {
      setError(mapOtpError(verifyError));
      return;
    }
    // Success updates authClient's session atom; the root layout's guard
    // (app/_layout.tsx) re-resolves and routes forward on its own — no
    // manual navigation from here.
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    const { error: resendError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'sign-in',
    });
    setResending(false);
    if (resendError) {
      setError(mapOtpError(resendError));
    }
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: t`Enter your code` }} />
      <Text style={styles.helper}>
        <Trans>Enter the 6-digit code we sent to {email}</Trans>
      </Text>
      <TextInput
        style={styles.input}
        value={otp}
        onChangeText={(value) => setOtp(value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        editable={!verifying}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.button, !canVerify ? styles.buttonDisabled : null]}
        onPress={handleVerify}
        disabled={!canVerify}
      >
        <Text style={styles.buttonText}>{verifying ? t`Verifying…` : t`Verify`}</Text>
      </Pressable>
      <Pressable onPress={handleResend} disabled={resending} style={styles.resendLink}>
        <Text style={styles.linkText}>
          <Trans>Didn't get a code? Resend</Trans>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, justifyContent: 'center', gap: 8 },
  helper: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    letterSpacing: 4,
  },
  error: { color: '#dc2626', fontSize: 14 },
  button: {
    minHeight: 44,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  resendLink: { marginTop: 16, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { color: '#4f46e5', fontSize: 14, fontWeight: '600' },
});
