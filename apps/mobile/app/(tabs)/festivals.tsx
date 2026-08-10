import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@festipal/ui';
import type { Festival } from '@festipal/contracts';

import { apiClient } from '../../lib/api-client';
import { authClient } from '../../lib/auth-client';
import { clearActiveFestivalSlug, syncActiveFestivalOnEnter } from '../../lib/active-festival-storage';
import { festivalKeys, unwrapOk } from '../../lib/festival-queries';
import { consumeFestivalsSegment } from '../../lib/festivals-segment-request';
import { i18n } from '../../lib/i18n';
import { FONT_BODY, FONT_DISPLAY, resolveFontFamily } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import { forceUnauthenticated } from '../_layout';
import { FestivalCard } from '../../components/FestivalCard';
import { SegmentedControl } from '../../components/SegmentedControl';

const { colors, typeRoles, layout, radii, spacingScale } = tokens;

type Segment = 'meine' | 'alle';

/** A raw ts-rest response shape, narrowed defensively (REVIEW 05-03 HIGH idiom, reused here). */
type CachedResponse = { status: number; body: unknown };

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
 * shape (Pitfall 6). Save is idempotent + optimistic + server-backed (FEST-03);
 * Enter is gate-less (ADR-014) regardless of saved-state.
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

  // G-05-2 fix — a param-value re-sync effect cannot re-fire when the Home
  // CTA/rail always target the SAME `segment=all` param on a second
  // navigation (the tab stays mounted across bottom-tab switches, so the
  // value is unchanged and the effect never re-runs, letting a manually-set
  // 'meine' survive). Replaced with a focus-time consume of the cross-tab
  // festivals-segment-request singleton: on every focus, only apply a
  // QUEUED segment request. A plain bottom-tab focus queues nothing, so
  // `consumeFestivalsSegment()` returns null and a manual SegmentedControl
  // tap is never clobbered (05-UAT.md G-05-2).
  useFocusEffect(
    useCallback(() => {
      const requested = consumeFestivalsSegment();
      if (requested) setSegment(requested);
    }, []),
  );

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

  // Synchronous per-id in-flight guard (REVIEW 05-06 MEDIUM) — a `useRef` so
  // two native press events arriving before React re-renders cannot enqueue a
  // second save of the SAME festival, while different festivals still save
  // concurrently. Mirrored into `savingIds` render state for FestivalCard.
  const inFlightIdsRef = useRef<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<ReadonlySet<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  // Stale save-error banner never survives a segment switch.
  useEffect(() => {
    setSaveError(null);
  }, [segment]);

  const saveMutation = useMutation<
    { saved: true },
    Error,
    Festival,
    { previous: CachedResponse | undefined }
  >({
    mutationFn: async (festival) => {
      const response = await apiClient.saveFestival({
        params: { festivalId: festival.id },
        body: {},
      });
      // REVIEW 05-06 HIGH — unwrapOk THROWS on a non-200 ts-rest result so a
      // failure becomes a real mutation rejection and onError actually fires.
      return unwrapOk<{ saved: true }>(response);
    },
    onMutate: async (festival) => {
      setSaveError(null);
      await queryClient.cancelQueries({ queryKey: festivalKeys.mine });
      const previous = queryClient.getQueryData<CachedResponse>(festivalKeys.mine);
      const currentBody =
        previous?.status === 200 && Array.isArray(previous.body)
          ? (previous.body as Festival[])
          : [];
      // REVIEW 05-06 MEDIUM — dedupe by id; never insert twice on a
      // rapid-tap/already-saved race.
      const alreadySaved = currentBody.some((f) => f.id === festival.id);
      if (!alreadySaved) {
        queryClient.setQueryData<CachedResponse>(festivalKeys.mine, {
          status: 200,
          body: [...currentBody, festival],
        });
      }
      return { previous };
    },
    onError: (_error, festival, context) => {
      // REVIEW 05-FIX WR-01 — reconcile against the CURRENT cache instead of
      // restoring a raw snapshot: two concurrent saves (A then B) each
      // capture their own `previous` at onMutate time, so a naive
      // `setQueryData(context.previous)` on A's failure would wipe out B's
      // still-in-flight (or already-succeeded) optimistic entry. Undo only
      // the optimistic insert THIS call made — never an entry that was
      // already saved before this call (`wasAlreadySaved`), and never a
      // different festival's entry.
      const previousBody =
        context?.previous?.status === 200 && Array.isArray(context.previous.body)
          ? context.previous.body
          : [];
      const wasAlreadySaved = previousBody.some((f) => f.id === festival.id);
      if (!wasAlreadySaved) {
        queryClient.setQueryData<CachedResponse>(festivalKeys.mine, (current) => {
          if (current?.status !== 200 || !Array.isArray(current.body)) return current;
          return { status: 200, body: current.body.filter((f) => f.id !== festival.id) };
        });
      }
      setSaveError(t`Couldn't save festival — try again.`);
    },
    onSettled: (_data, _error, festival) => {
      inFlightIdsRef.current.delete(festival.id);
      setSavingIds(new Set(inFlightIdsRef.current));
      // Server (idempotent saveFestival) is the source of truth — reconcile.
      void queryClient.invalidateQueries({ queryKey: festivalKeys.mine });
    },
  });

  function handleSave(festival: Festival) {
    if (inFlightIdsRef.current.has(festival.id)) return;
    inFlightIdsRef.current.add(festival.id);
    setSavingIds(new Set(inFlightIdsRef.current));
    saveMutation.mutate(festival);
  }

  function handleEnter(festival: Festival, saved: boolean) {
    // D-06 / D-08 — entry is gate-less (ADR-014): no saved-state check gates
    // this navigation; entering an unsaved festival always still works.
    // G-05-5b-r2 — the cold-start RESTORE must only ever bring back the
    // LAST-entered festival, and only when it was saved.
    //
    // WR-04 (05-REVIEW.md) — `saved` is computed from the CURRENT render's
    // `savedIds` snapshot, but a just-tapped Save's optimistic cache write
    // lands in a later microtask (TanStack Query's `onMutate`), not
    // synchronously with the tap. Tapping Save then immediately Enter on the
    // same card can therefore reach here with `saved: false` for a festival
    // that IS, in fact, about to be saved — treat an in-flight save
    // (`inFlightIdsRef`) as saved for persistence purposes so the cold-start
    // focus isn't wrongly cleared. Enter itself stays gate-less/instant
    // either way — this only affects what gets persisted.
    const effectivelySaved = saved || inFlightIdsRef.current.has(festival.id);
    // syncActiveFestivalOnEnter is the single persist/clear authority
    // (lib/active-festival-storage.ts): a SAVED entry persists this slug; an
    // UNSAVED entry now CLEARS any previously-persisted slug instead of
    // leaving it in place, so a stale saved festival can never stay stuck as
    // the cold-start restore target (the 05-09 regression). This keeps
    // _layout's cold-start read fully synchronous — no new gate, no async
    // dependency (offline-first).
    syncActiveFestivalOnEnter(festival.slug, effectivelySaved);
    router.push(`/f/${festival.slug}`);
  }

  function renderCard({ item }: { item: Festival }) {
    const saved = savedIds.has(item.id);
    return (
      <FestivalCard
        festival={item}
        saved={saved}
        saving={savingIds.has(item.id)}
        locale={i18n.locale}
        onEnter={() => handleEnter(item, saved)}
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

      {segment === 'alle' && saveError ? (
        <Text style={[styles.error, styles.saveError, { fontFamily: bodyFont }]}>{saveError}</Text>
      ) : null}

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
  saveError: { marginBottom: spacingScale['sp-4'] },
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
