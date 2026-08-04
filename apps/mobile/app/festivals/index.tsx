import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import type { Festival } from '@festipal/contracts';

import { apiClient } from '../../lib/api-client';

/**
 * D-03 — this screen is a thin client mirror of `listFestivals`/`saveFestival`
 * (PATTERNS.md): no local business logic, no re-declared festival shape
 * (Pitfall 6). Save is idempotent server-side and Enter is gate-less
 * (ADR-014) — the Enter CTA always navigates regardless of saved-state;
 * only the Save CTA's own disabled styling reflects whether THIS session has
 * already saved a given row.
 */
export default function FestivalsScreen() {
  const router = useRouter();
  const { t } = useLingui();
  const [savedIds, setSavedIds] = useState<ReadonlySet<string>>(new Set());

  const festivalsQuery = useQuery({
    queryKey: ['festivals'],
    queryFn: () => apiClient.listFestivals(),
  });

  const saveMutation = useMutation({
    mutationFn: (festivalId: string) =>
      apiClient.saveFestival({ params: { festivalId }, body: {} }),
  });

  function handleSave(festivalId: string) {
    saveMutation.mutate(festivalId, {
      onSuccess: (result) => {
        if (result.status === 200) {
          setSavedIds((prev) => new Set(prev).add(festivalId));
        }
      },
    });
  }

  function handleEnter() {
    // D-01 — the (festival) home placeholder isn't tied to a specific
    // festivalId yet (real festival master-data content is Phase 5); entry
    // is gate-less (ADR-014), so no saved-state check gates this navigation.
    router.push('/(festival)');
  }

  function renderRow({ item }: { item: Festival }) {
    const saved = savedIds.has(item.id);
    return (
      <View style={styles.row}>
        {/* UI-SPEC "partial" state — dates/place are Phase-5 master data not
            in the current schema; only the always-present name renders. */}
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.actions}>
          <Pressable
            style={[styles.button, saved ? styles.buttonDisabled : null]}
            onPress={() => handleSave(item.id)}
            disabled={saved}
          >
            <Text style={styles.buttonText}>
              <Trans>Save</Trans>
            </Text>
          </Pressable>
          <Pressable style={styles.button} onPress={handleEnter}>
            <Text style={styles.buttonText}>
              <Trans>Enter festival</Trans>
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: t`Festivals` }} />
      {festivalsQuery.status === 'pending' ? (
        <Text style={styles.helper}>
          <Trans>Loading festivals…</Trans>
        </Text>
      ) : null}
      {festivalsQuery.status === 'error' ? (
        <Text style={styles.error}>
          <Trans>
            Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.
          </Trans>
        </Text>
      ) : null}
      {festivalsQuery.status === 'success' && festivalsQuery.data.status !== 200 ? (
        <View>
          <Text style={styles.error}>
            <Trans>Can't load festivals — check your connection and try again.</Trans>
          </Text>
          <Pressable style={styles.button} onPress={() => festivalsQuery.refetch()}>
            <Text style={styles.buttonText}>
              <Trans>Retry</Trans>
            </Text>
          </Pressable>
        </View>
      ) : null}
      {festivalsQuery.status === 'success' && festivalsQuery.data.status === 200 ? (
        festivalsQuery.data.body.length === 0 ? (
          <View>
            <Text style={styles.heading}>
              <Trans>No festivals yet</Trans>
            </Text>
            <Text style={styles.helper}>
              <Trans>Check back soon — new festivals will appear here.</Trans>
            </Text>
          </View>
        ) : (
          <FlatList
            data={festivalsQuery.data.body}
            keyExtractor={(item) => item.id}
            renderItem={renderRow}
          />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  helper: { fontSize: 16 },
  heading: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  error: { color: '#dc2626', fontSize: 14 },
  row: {
    backgroundColor: '#f4f4f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  name: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  button: {
    minHeight: 44,
    flex: 1,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
