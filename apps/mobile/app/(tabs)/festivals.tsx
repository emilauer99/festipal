import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@festipal/ui';
import type { Festival } from '@festipal/contracts';

import { apiClient } from '../../lib/api-client';
import { authClient } from '../../lib/auth-client';
import { clearActiveFestivalSlug, saveActiveFestivalSlug } from '../../lib/active-festival-storage';
import { festivalKeys } from '../../lib/festival-queries';
import { FONT_BODY, FONT_DISPLAY, resolveFontFamily } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import { forceUnauthenticated } from '../_layout';

const { colors, typeRoles, layout, radii, spacingScale } = tokens;

/**
 * D-03 — this screen is a thin client mirror of `listFestivals`/`saveFestival`
 * (PATTERNS.md): no local business logic, no re-declared festival shape
 * (Pitfall 6). Save is idempotent server-side and Enter is gate-less
 * (ADR-014) — the Enter CTA always navigates regardless of saved-state;
 * only the Save CTA's own disabled styling reflects whether THIS session has
 * already saved a given row.
 *
 * AUTH-04 — the icon-only logout control (UI-SPEC Scope note #9, neutral
 * tint, no confirmation dialog) lives in this screen's header, the only
 * authenticated shell surface that exists until Phase 6's real Profile
 * screen.
 *
 * 05-05 — moved from `app/festivals/index.tsx` into the `(tabs)` group
 * (same import depth, no path changes needed); rewritten to the Meine/Alle
 * segmented layout in 05-06.
 */
export default function FestivalsScreen() {
  const router = useRouter();
  const { t } = useLingui();
  const fontsReady = useFontsReady();
  const bodyFont = resolveFontFamily(FONT_BODY, fontsReady);
  const displayFont = resolveFontFamily(FONT_DISPLAY, fontsReady);
  const [savedIds, setSavedIds] = useState<ReadonlySet<string>>(new Set());
  // Non-re-entrancy guard (UI-SPEC logout-robustness backstop) — a double-tap
  // during the in-flight signOut() cannot fire a second concurrent call.
  const signingOutRef = useRef(false);

  async function handleLogout() {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    try {
      await authClient.signOut();
    } catch {
      // Offline/network failure — no error UI for this action (UI-SPEC
      // Copywriting Contract "Logout": immediate, no confirmation, reversible
      // action); fall through to forceUnauthenticated() below regardless.
    } finally {
      // Reaches Welcome even if signOut()'s network call failed — see
      // app/_layout.tsx forceUnauthenticated() for why this is required
      // (better-auth only broadcasts its own session signal on success).
      forceUnauthenticated();
      // REVIEW 05-05 LOW — clear the persisted D-06 focus so a different
      // account signing in on the same device does not inherit this
      // account's active festival.
      clearActiveFestivalSlug();
      signingOutRef.current = false;
    }
  }

  const festivalsQuery = useQuery({
    queryKey: festivalKeys.all,
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

  function handleEnter(slug: string) {
    // D-06 / D-08 — entry is gate-less (ADR-014): no saved-state check gates
    // this navigation. Persists the slug for the D-06 cold-start focus
    // (05-05), then pushes the real slug-keyed festival home (HOME-02).
    saveActiveFestivalSlug(slug);
    router.push(`/f/${slug}`);
  }

  function renderRow({ item }: { item: Festival }) {
    const saved = savedIds.has(item.id);
    return (
      <View style={styles.row}>
        {/* UI-SPEC "partial" state — dates/place are Phase-5 master data not
            in the current schema; only the always-present name renders. */}
        <Text style={[styles.name, { fontFamily: bodyFont }]}>{item.name}</Text>
        <View style={styles.actions}>
          <Pressable
            style={[styles.button, saved ? styles.buttonDisabled : null]}
            onPress={() => handleSave(item.id)}
            disabled={saved}
          >
            <Text style={[styles.buttonText, { fontFamily: bodyFont }]}>
              <Trans>Save</Trans>
            </Text>
          </Pressable>
          <Pressable style={styles.button} onPress={() => handleEnter(item.slug)}>
            <Text style={[styles.buttonText, { fontFamily: bodyFont }]}>
              <Trans>Enter festival</Trans>
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t`Festivals`,
          headerRight: () => (
            <Pressable
              onPress={() => void handleLogout()}
              style={styles.logoutButton}
              accessibilityLabel={t`Log out`}
            >
              <LogOut size={20} color={colors.textSecondary} strokeWidth={2} />
            </Pressable>
          ),
        }}
      />
      {festivalsQuery.status === 'pending' ? (
        <Text style={[styles.helper, { fontFamily: bodyFont }]}>
          <Trans>Loading festivals…</Trans>
        </Text>
      ) : null}
      {festivalsQuery.status === 'error' ? (
        <Text style={[styles.error, { fontFamily: bodyFont }]}>
          <Trans>
            Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.
          </Trans>
        </Text>
      ) : null}
      {festivalsQuery.status === 'success' && festivalsQuery.data.status !== 200 ? (
        <View>
          <Text style={[styles.error, { fontFamily: bodyFont }]}>
            <Trans>Can't load festivals — check your connection and try again.</Trans>
          </Text>
          <Pressable style={styles.button} onPress={() => festivalsQuery.refetch()}>
            <Text style={[styles.buttonText, { fontFamily: bodyFont }]}>
              <Trans>Retry</Trans>
            </Text>
          </Pressable>
        </View>
      ) : null}
      {festivalsQuery.status === 'success' && festivalsQuery.data.status === 200 ? (
        festivalsQuery.data.body.length === 0 ? (
          <View>
            <Text style={[styles.heading, { fontFamily: displayFont }]}>
              <Trans>No festivals yet</Trans>
            </Text>
            <Text style={[styles.helper, { fontFamily: bodyFont }]}>
              <Trans>Check back soon — new festivals will appear here.</Trans>
            </Text>
          </View>
        ) : (
          <FlatList
            data={festivalsQuery.data.body}
            keyExtractor={(item) => item.id}
            renderItem={renderRow}
            contentContainerStyle={styles.listContent}
          />
        )
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: layout.screenPad, backgroundColor: colors.bgApp },
  // 05-05 — this screen now sits inside the (tabs) shell, under the
  // floating nav; scrollBottomPad keeps the last row clear of it.
  listContent: { paddingBottom: layout.scrollBottomPad },
  helper: {
    fontSize: typeRoles.body.size,
    color: colors.textSecondary,
  },
  heading: {
    fontSize: typeRoles.title2.size,
    fontWeight: typeRoles.title2.weight,
    lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
    color: colors.textPrimary,
    marginBottom: spacingScale['sp-4'],
  },
  error: {
    color: colors.danger,
    fontSize: typeRoles.bodySm.size,
  },
  row: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radii.control,
    padding: spacingScale['sp-6'],
    marginBottom: spacingScale['sp-4'],
  },
  name: {
    fontSize: typeRoles.bodyStrong.size,
    fontWeight: typeRoles.bodyStrong.weight,
    color: colors.textPrimary,
    marginBottom: spacingScale['sp-4'],
  },
  actions: { flexDirection: 'row', gap: spacingScale['sp-4'] },
  button: {
    minHeight: layout.hitMin,
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontSize: typeRoles.title3.size,
    fontWeight: typeRoles.title3.weight,
    color: colors.textOnPrimary,
  },
  // AUTH-04 — icon-only, neutral tint (NOT danger; logout is reversible, no
  // confirmation dialog, UI-SPEC ## Color "Not used for logout"); 44px hit
  // target per --hit-min even though the glyph itself is 20px.
  logoutButton: {
    width: layout.hitMin,
    height: layout.hitMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
