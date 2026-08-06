import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@festipal/ui';
import type { Festival } from '@festipal/contracts';

import { apiClient } from '../../lib/api-client';
import { authClient } from '../../lib/auth-client';
import { clearActiveFestivalSlug, saveActiveFestivalSlug } from '../../lib/active-festival-storage';
import { festivalKeys } from '../../lib/festival-queries';
import { i18n } from '../../lib/i18n';
import { FONT_BODY, FONT_DISPLAY, resolveFontFamily } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import { forceUnauthenticated } from '../_layout';
import { FestivalCard } from '../../components/FestivalCard';
import { SegmentedControl } from '../../components/SegmentedControl';

const { colors, typeRoles, layout, radii, spacingScale } = tokens;

type Segment = 'meine' | 'alle';

/**
 * `/festivals?segment=all` is the shared cross-tab contract the Home CTA and
 * rail "see all" action (05-07) navigate into (REVIEW 05-06/05-07 HIGH).
 * Unknown/empty/missing values fail closed to Meine.
 */
function normalizeSegmentParam(raw: string | string[] | undefined): Segment {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'all' ? 'alle' : 'meine';
}

type SegmentViewState =
  | { kind: 'loading' }
  | { kind: 'error'; variant: 'transport' | 'response'; retry: () => void }
  | { kind: 'empty' }
  | { kind: 'data'; items: Festival[] };

/**
 * D-05 — this screen is a thin client mirror of `listFestivals`/`listMyFestivals`/
 * `saveFestival` (PATTERNS.md): no local business logic, no re-declared festival
 * shape (Pitfall 6). Enter is gate-less (ADR-014) regardless of saved-state.
 * Save is upgraded to a full optimistic, server-backed mutation in 05-06 Task 2.
 *
 * AUTH-04 — the icon-only logout control (UI-SPEC Scope note #9, neutral tint,
 * no confirmation dialog) lives in this screen's header, the only authenticated
 * shell surface that exists until Phase 6's real Profile screen.
 *
 * 05-06 — rewritten from a single `listFestivals` list into the Meine/Alle
 * segmented D-05 experience over `FestivalCard` + `SegmentedControl`.
 */
export default function FestivalsScreen() {
  const router = useRouter();
  const { t } = useLingui();
  const fontsReady = useFontsReady();
  const bodyFont = resolveFontFamily(FONT_BODY, fontsReady);
  const displayFont = resolveFontFamily(FONT_DISPLAY, fontsReady);
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ segment?: string | string[] }>();

  const normalizedParam = normalizeSegmentParam(params.segment);
  const [segment, setSegment] = useState<Segment>(() => normalizedParam);

  // Re-sync ONLY when the URL search param itself changes on re-navigation
  // (the Home CTA/rail's `/festivals?segment=all` target, 05-07) — manual
  // SegmentedControl taps never touch this param, so they are never
  // overridden by this effect (REVIEW 05-06/05-07 HIGH).
  useEffect(() => {
    setSegment(normalizedParam);
  }, [normalizedParam]);

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

  const listFestivalsQuery = useQuery({
    queryKey: festivalKeys.all,
    queryFn: () => apiClient.listFestivals(),
  });
  const listMyFestivalsQuery = useQuery({
    queryKey: festivalKeys.mine,
    queryFn: () => apiClient.listMyFestivals(),
  });

  // Pattern 3 — saved-state is client-derived from `listMyFestivals`, never a
  // server-side saved flag.
  const savedIds = useMemo(() => {
    const data = listMyFestivalsQuery.data;
    if (data?.status !== 200) return new Set<string>();
    return new Set(data.body.map((f) => f.id));
  }, [listMyFestivalsQuery.data]);

  // Placeholder save mutation for Task 1's rendering pass — 05-06 Task 2
  // replaces this with a full optimistic onMutate/onError/onSettled dance
  // (in-flight guard, rollback, localized error surface).
  const saveMutation = useMutation({
    mutationFn: (festival: Festival) =>
      apiClient.saveFestival({ params: { festivalId: festival.id }, body: {} }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: festivalKeys.mine });
    },
  });

  function handleSave(festival: Festival) {
    saveMutation.mutate(festival);
  }

  function handleEnter(slug: string) {
    // D-06 / D-08 — entry is gate-less (ADR-014): no saved-state check gates
    // this navigation. Persists the slug for the D-06 cold-start focus
    // (05-05), then pushes the real slug-keyed festival home (HOME-02).
    saveActiveFestivalSlug(slug);
    router.push(`/f/${slug}`);
  }

  function renderCard({ item }: { item: Festival }) {
    return (
      <FestivalCard
        festival={item}
        saved={savedIds.has(item.id)}
        locale={i18n.locale}
        onEnter={() => handleEnter(item.slug)}
        onSave={() => handleSave(item)}
      />
    );
  }

  function computeMeineState(): SegmentViewState {
    if (listMyFestivalsQuery.status === 'pending') return { kind: 'loading' };
    if (listMyFestivalsQuery.status === 'error') {
      return { kind: 'error', variant: 'transport', retry: () => void listMyFestivalsQuery.refetch() };
    }
    if (listMyFestivalsQuery.data.status !== 200) {
      return { kind: 'error', variant: 'response', retry: () => void listMyFestivalsQuery.refetch() };
    }
    return listMyFestivalsQuery.data.body.length === 0
      ? { kind: 'empty' }
      : { kind: 'data', items: listMyFestivalsQuery.data.body };
  }

  // Alle is ready only after BOTH queries succeed — rendering it before the
  // caller-scoped membership query resolves would briefly mislabel saved rows
  // as unsaved. A mine-query failure surfaces the same error+retry affordance
  // (retrying the failed dependency) rather than exposing incorrect Save
  // buttons.
  function computeAlleState(): SegmentViewState {
    if (listFestivalsQuery.status === 'error') {
      return { kind: 'error', variant: 'transport', retry: () => void listFestivalsQuery.refetch() };
    }
    if (listMyFestivalsQuery.status === 'error') {
      return { kind: 'error', variant: 'transport', retry: () => void listMyFestivalsQuery.refetch() };
    }
    if (listFestivalsQuery.status === 'pending' || listMyFestivalsQuery.status === 'pending') {
      return { kind: 'loading' };
    }
    if (listFestivalsQuery.data.status !== 200) {
      return { kind: 'error', variant: 'response', retry: () => void listFestivalsQuery.refetch() };
    }
    if (listMyFestivalsQuery.data.status !== 200) {
      return { kind: 'error', variant: 'response', retry: () => void listMyFestivalsQuery.refetch() };
    }
    return listFestivalsQuery.data.body.length === 0
      ? { kind: 'empty' }
      : { kind: 'data', items: listFestivalsQuery.data.body };
  }

  const viewState = segment === 'meine' ? computeMeineState() : computeAlleState();

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

      <View style={styles.segmentedControlWrapper}>
        <SegmentedControl
          options={[
            { value: 'meine', label: t`Mine` },
            { value: 'alle', label: t`All` },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </View>

      {viewState.kind === 'loading' ? (
        <Text style={[styles.helper, { fontFamily: bodyFont }]}>
          <Trans>Loading festivals…</Trans>
        </Text>
      ) : null}

      {viewState.kind === 'error' ? (
        <View style={styles.stateBlock}>
          <Text style={[styles.error, { fontFamily: bodyFont }]}>
            {viewState.variant === 'transport' ? (
              <Trans>
                Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.
              </Trans>
            ) : (
              <Trans>Can't load festivals — check your connection and try again.</Trans>
            )}
          </Text>
          <Pressable style={styles.button} onPress={viewState.retry}>
            <Text style={[styles.buttonText, { fontFamily: bodyFont }]}>
              <Trans>Retry</Trans>
            </Text>
          </Pressable>
        </View>
      ) : null}

      {viewState.kind === 'empty' && segment === 'meine' ? (
        <View style={styles.stateBlock}>
          <Text style={[styles.heading, { fontFamily: displayFont }]}>
            <Trans>No saved festivals yet</Trans>
          </Text>
          <Text style={[styles.helper, { fontFamily: bodyFont }]}>
            <Trans>Switch to 'All' and save one with a tap.</Trans>
          </Text>
          <Pressable style={styles.button} onPress={() => setSegment('alle')}>
            <Text style={[styles.buttonText, { fontFamily: bodyFont }]}>
              <Trans>Switch to All</Trans>
            </Text>
          </Pressable>
        </View>
      ) : null}

      {viewState.kind === 'empty' && segment === 'alle' ? (
        <View style={styles.stateBlock}>
          <Text style={[styles.heading, { fontFamily: displayFont }]}>
            <Trans>No festivals yet</Trans>
          </Text>
          <Text style={[styles.helper, { fontFamily: bodyFont }]}>
            <Trans>New festivals will show up here.</Trans>
          </Text>
        </View>
      ) : null}

      {viewState.kind === 'data' ? (
        <FlatList
          data={viewState.items}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: layout.screenPad, backgroundColor: colors.bgApp },
  segmentedControlWrapper: { marginBottom: spacingScale['sp-6'] },
  // 05-05 — this screen sits inside the (tabs) shell, under the floating
  // nav; scrollBottomPad keeps the last row clear of it. sp-5 (12px) row gap
  // per UI-SPEC `festivals-list` populated state.
  listContent: { paddingBottom: layout.scrollBottomPad, gap: spacingScale['sp-5'] },
  stateBlock: { gap: spacingScale['sp-5'], alignItems: 'flex-start' },
  helper: {
    fontSize: typeRoles.body.size,
    color: colors.textSecondary,
  },
  heading: {
    fontSize: typeRoles.title2.size,
    fontWeight: typeRoles.title2.weight,
    lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
    color: colors.textPrimary,
  },
  error: {
    color: colors.danger,
    fontSize: typeRoles.bodySm.size,
  },
  button: {
    minHeight: layout.hitMin,
    paddingHorizontal: spacingScale['sp-8'],
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
