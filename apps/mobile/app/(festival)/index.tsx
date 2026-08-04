import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';

/**
 * D-01 — minimal navigable placeholder for the post-entry festival home.
 * Real festival overview/master-data content (dates, place, map, timetable)
 * is Phase 5 (HOME-02) — do NOT build it here. This screen only proves the
 * core-value entry path ("get in, connect to your festival, reach the home
 * screen") lands somewhere real and never dead-ends (FEST-04 spirit): a
 * localized link always leads back to the festivals list.
 */
export default function FestivalHomeScreen() {
  const router = useRouter();
  const { t } = useLingui();

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: t`Festival home` }} />
      <Text style={styles.heading}>
        <Trans>Festival home</Trans>
      </Text>
      <Text style={styles.body}>
        <Trans>Your festival overview is coming soon.</Trans>
      </Text>
      <Pressable style={styles.button} onPress={() => router.push('/festivals')}>
        <Text style={styles.buttonText}>
          <Trans>Back to festivals</Trans>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, justifyContent: 'center', gap: 8 },
  heading: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16 },
  button: {
    minHeight: 44,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
