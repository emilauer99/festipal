import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Trans } from '@lingui/react/macro';
import { tokens } from '@festipal/ui';
import type { Festival } from '@festipal/contracts';

import { apiClient } from '../../lib/api-client';
import { i18n } from '../../lib/i18n';
import { festivalKeys } from '../../lib/festival-queries';
import { syncActiveFestivalOnEnter } from '../../lib/active-festival-storage';
import { requestFestivalsSegment } from '../../lib/festivals-segment-request';
import { orderFestivalsForHome } from '../../lib/select-next-festival';
import { FONT_BODY, FONT_DISPLAY, resolveFontFamily } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import { FestivalCard } from '../../components/FestivalCard';

const { colors, typeRoles, layout, radiiScale, spacingScale } = tokens;

const RAIL_ITEM_WIDTH = 268;

/** Rail/hero cards are always saved (sourced from `listMyFestivals`) and never expose a Save affordance (REVIEW 05-07 MEDIUM) — this no-op satisfies FestivalCard's required prop without a real save path. */
function noopSave(): void {}

type HomeViewState =
  | { kind: 'loading' }
  | { kind: 'error'; variant: 'transport' | 'response'; retry: () => void }
  | { kind: 'empty' }
  | { kind: 'ready'; hero: Festival; rail: Festival[] };

/**
 * D-04 — the lean, post-login Home overview: a single "next festival" hero +
 * "Meine Festivals" rail, both from the ALREADY-FETCHED `listMyFestivals`
 * data (no new endpoint). Hero/rail order comes from the pure, tested
 * `orderFestivalsForHome` (05-07 Task 1) — never the API's unspecified
 * `listMyFestivals` row order. Loading/error copy reuses the existing
 * `festivals.tsx` pattern verbatim (backstop — no new skeleton).
 */
export default function HomeScreen() {
  const router = useRouter();
  const fontsReady = useFontsReady();
  const bodyFont = resolveFontFamily(FONT_BODY, fontsReady);
  const displayFont = resolveFontFamily(FONT_DISPLAY, fontsReady);

  const myFestivalsQuery = useQuery({
    queryKey: festivalKeys.mine,
    queryFn: () => apiClient.listMyFestivals(),
  });

  // One `today` per render (not memoized across renders) — a day-boundary
  // crossing while the screen stays mounted is picked up on the next render
  // rather than frozen at first mount.
  const today = new Date();

  function computeState(): HomeViewState {
    if (myFestivalsQuery.status === 'pending') return { kind: 'loading' };
    if (myFestivalsQuery.status === 'error') {
      return { kind: 'error', variant: 'transport', retry: () => void myFestivalsQuery.refetch() };
    }
    // A non-200 ts-rest result is a SUCCESSFUL React Query result, never
    // `status === 'error'` — never fall through to the empty state here,
    // that would falsely render "no festival saved" on a real API failure.
    if (myFestivalsQuery.data.status !== 200) {
      return { kind: 'error', variant: 'response', retry: () => void myFestivalsQuery.refetch() };
    }
    const saved = myFestivalsQuery.data.body;
    if (saved.length === 0) return { kind: 'empty' };
    const ordered = orderFestivalsForHome(saved, today);
    const [hero, ...rail] = ordered;
    // WR-08 (05-REVIEW.md) — `hero` types as `Festival | undefined` under
    // `noUncheckedIndexedAccess: true` for this array destructure; the
    // `saved.length === 0` guard above makes it safe TODAY only because
    // `orderFestivalsForHome` is assumed to return exactly as many items as
    // it received. An explicit runtime check (rather than an `as Festival`
    // assertion) enforces that invariant at the boundary, so a future
    // regression in `orderFestivalsForHome` (e.g. a filtering bug dropping
    // an item) fails closed into the empty state instead of crashing later
    // at `viewState.hero.slug`.
    if (!hero) return { kind: 'empty' };
    return { kind: 'ready', hero, rail };
  }

  const viewState = computeState();

  function handleEnter(slug: string) {
    // Gate-less entry (ADR-014, HOME-01) must never dead-end: persist first,
    // but a synchronous MMKV write failure still lets the navigation happen.
    // G-05-5b-r2 — Home's hero and rail cards are sourced exclusively from
    // `listMyFestivals`, so every card entered here is ALREADY saved;
    // passing `saved: true` is behavior-preserving (still persists), but
    // routes through syncActiveFestivalOnEnter — the shared single
    // persist/clear authority (lib/active-festival-storage.ts) also used by
    // the Festivals tab's Alle segment (festivals.tsx handleEnter) — so a
    // future entry path can never silently reintroduce the sticky
    // stale-saved-slug bug by calling saveActiveFestivalSlug directly.
    //
    // WR-06 (05-REVIEW.md) — no try/catch here: every storage call
    // `syncActiveFestivalOnEnter` makes (`getActiveFestivalSlug` /
    // `saveActiveFestivalSlug` / `clearActiveFestivalSlug`) already swallows
    // its own errors internally (see active-festival-storage.ts's
    // module-level note), so a wrapping try/catch here could never actually
    // catch anything. Matches festivals.tsx's call site.
    syncActiveFestivalOnEnter(slug, true);
    router.push(`/f/${slug}`);
  }

  function goToAllFestivals() {
    // G-05-2 — both the empty-state "Browse festivals" CTA and the rail
    // "All" see-all go through this one function, so both are fixed
    // together. Queue the segment request BEFORE navigating so it is
    // already pending when the Festivals tab's focus effect runs, covering
    // the already-mounted case (a plain param change does not re-fire an
    // effect keyed on an unchanged value). The `segment=all` param is kept
    // as the initial-mount seed when the tab is not yet mounted.
    requestFestivalsSegment('alle');
    router.push('/festivals?segment=all');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                  Can't reach the server — make sure your device is on the same Wi-Fi as the dev
                  API.
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

        {viewState.kind === 'empty' ? (
          <View style={styles.stateBlock}>
            <Text style={[styles.heading, { fontFamily: displayFont }]}>
              <Trans>No festival saved yet</Trans>
            </Text>
            <Text style={[styles.helper, { fontFamily: bodyFont }]}>
              <Trans>Browse all festivals and save your first one.</Trans>
            </Text>
            <Pressable style={styles.button} onPress={goToAllFestivals}>
              <Text style={[styles.buttonText, { fontFamily: bodyFont }]}>
                <Trans>Browse festivals</Trans>
              </Text>
            </Pressable>
          </View>
        ) : null}

        {viewState.kind === 'ready' ? (
          <>
            <View style={styles.heroSection}>
              <Text style={[styles.eyebrow, { fontFamily: bodyFont }]}>
                <Trans>Your next festival</Trans>
              </Text>
              <FestivalCard
                festival={viewState.hero}
                saved
                locale={i18n.locale}
                variant="hero"
                onEnter={() => handleEnter(viewState.hero.slug)}
                onSave={noopSave}
              />
            </View>

            {viewState.rail.length > 0 ? (
              <View style={styles.railSection}>
                <View style={styles.railHeader}>
                  <Text style={[styles.sectionHead, { fontFamily: displayFont }]}>
                    <Trans>My festivals</Trans>
                  </Text>
                  <Pressable onPress={goToAllFestivals} accessibilityRole="button">
                    <Text style={[styles.seeAll, { fontFamily: bodyFont }]}>
                      <Trans>All</Trans>
                    </Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.railContent}
                >
                  {viewState.rail.map((festival) => (
                    <View key={festival.id} style={styles.railItem}>
                      <FestivalCard
                        festival={festival}
                        saved
                        locale={i18n.locale}
                        onEnter={() => handleEnter(festival.slug)}
                        onSave={noopSave}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: {
    paddingHorizontal: layout.screenPad,
    paddingTop: layout.screenPad,
    paddingBottom: layout.scrollBottomPad,
    gap: layout.sectionGap,
  },
  stateBlock: { gap: spacingScale['sp-5'], alignItems: 'flex-start' },
  heroSection: { gap: spacingScale['sp-4'] },
  eyebrow: {
    fontSize: typeRoles.micro.size,
    fontWeight: typeRoles.micro.weight,
    lineHeight: typeRoles.micro.size * typeRoles.micro.lineHeight,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: typeRoles.micro.size * 0.09,
  },
  railSection: { gap: spacingScale['sp-5'] },
  railHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHead: {
    fontSize: typeRoles.title2.size,
    fontWeight: typeRoles.title2.weight,
    lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: typeRoles.label.size,
    fontWeight: typeRoles.label.weight,
    color: colors.primary,
  },
  railContent: { gap: spacingScale['sp-5'] },
  railItem: { width: RAIL_ITEM_WIDTH },
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
    borderRadius: radiiScale['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: typeRoles.title3.size,
    fontWeight: typeRoles.title3.weight,
    color: colors.textOnPrimary,
  },
});
