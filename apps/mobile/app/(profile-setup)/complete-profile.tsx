import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';

import { apiClient } from '../../lib/api-client';
import { refreshAuthState } from '../_layout';

function generatePlaceholderUsername(): string {
  // Dev-safe, unique-enough placeholder (RESEARCH.md Open Question 1,
  // recommendation (a)) — Phase 4 replaces this with the real, designed
  // username-choice UI (IDN-01, live-availability check). This stub only
  // needs to satisfy the DB's case-insensitive unique index well enough to
  // demonstrate the guard's "authenticated-no-profile" branch end-to-end.
  return `visitor_${Math.random().toString(36).slice(2, 10)}`;
}

export default function CompleteProfileScreen() {
  const { t } = useLingui();
  const [username, setUsername] = useState(generatePlaceholderUsername);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setSubmitting(true);
    setError(null);
    const result = await apiClient.completeProfile({
      body: { username, displayName: 'New Visitor' },
    });
    if (result.status === 409) {
      // Retry path (UI-SPEC profile-stub backstop row): regenerate the
      // placeholder username so the next "Continue" tap doesn't collide
      // again — completeProfile's DB unique index is the TOCTOU-safe check.
      setUsername(generatePlaceholderUsername());
      setError(t`Couldn't set up your profile — tap Continue to try again.`);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    // Success — ask the root guard to re-check GET /me. This profile isn't
    // part of better-auth's own session, so nothing else would trigger it.
    refreshAuthState();
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: t`One more step` }} />
      <Text style={styles.heading}>
        <Trans>One more step</Trans>
      </Text>
      <Text style={styles.body}>
        <Trans>We need a temporary profile to continue.</Trans>
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.button, submitting ? styles.buttonDisabled : null]}
        onPress={handleContinue}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? t`Saving…` : t`Continue`}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, justifyContent: 'center', gap: 8 },
  heading: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16 },
  error: { color: '#dc2626', fontSize: 14 },
  button: {
    minHeight: 44,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
