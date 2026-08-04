import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';

import { authClient } from '../../lib/auth-client';

/**
 * D-02 — the real (unstyled) start of the email-OTP flow: no dev bypass
 * exists anywhere in this file, the only way forward is the actual
 * `authClient.emailOtp.sendVerificationOtp` round-trip (RESEARCH.md Pattern 3).
 */
export default function EmailEntryScreen() {
  const router = useRouter();
  const { t } = useLingui();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && !sending;

  async function handleSendCode() {
    const trimmedEmail = email.trim();
    setSending(true);
    setError(null);
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
      email: trimmedEmail,
      type: 'sign-in',
    });
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
      setSending(false);
      return;
    }
    setSending(false);
    router.push({ pathname: '/verify', params: { email: trimmedEmail } });
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: t`Log in` }} />
      <Text style={styles.label}>
        <Trans>Email</Trans>
      </Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder={t`you@example.com`}
        keyboardType="email-address"
        autoComplete="email"
        autoCapitalize="none"
        editable={!sending}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.button, !canSubmit ? styles.buttonDisabled : null]}
        onPress={handleSendCode}
        disabled={!canSubmit}
      >
        <Text style={styles.buttonText}>{sending ? t`Sending…` : t`Send code`}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, justifyContent: 'center', gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 8, padding: 12, fontSize: 16 },
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
});
