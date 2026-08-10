import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { ArrowLeft, CalendarClock, MapPin, Newspaper, Wallet } from 'lucide-react-native';
import { tokens } from '@festipal/ui';
import type { Festival } from '@festipal/contracts';

import { apiClient } from '../../../lib/api-client';
import { i18n } from '../../../lib/i18n';
import { festivalKeys } from '../../../lib/festival-queries';
import { leaveFestival } from '../../../lib/festival-navigation';
import {
  clearActiveFestivalSlug,
  getActiveFestivalSlug,
} from '../../../lib/active-festival-storage';
import { formatDateRange } from '../../../lib/date-range';
import { FONT_BODY, FONT_DISPLAY, resolveFontFamily } from '../../../lib/fonts';
import { useFontsReady } from '../../../lib/fonts-context';
import { ComingSoonTile } from '../../../components/ComingSoonTile';

const { colors, typeRoles, layout, radiiScale, spacingScale } = tokens;

function normalizeSlug(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? '').trim();
}

/**
 * Instant-paint source (RESEARCH.md Pattern 2, REVIEW 05-03 HIGH): the
 * `['festivals']`/`['me','festivals']` caches hold FULL ts-rest response
 * objects `{ status, body }`, never a bare `Festival[]` — reading `.body`
 * off an un-narrowed cache hit is exactly the wrong-shape bug the review
 * flagged, so `status === 200` and `Array.isArray(body)` are both checked
 * before `.find()`. A stale/malformed cache entry is a miss, never a crash.
 */
function findCachedFestivalBySlug(
  queryClient: ReturnType<typeof useQueryClient>,
  slug: string,
): Festival | undefined {
  for (const key of [festivalKeys.all, festivalKeys.mine]) {
    const cached = queryClient.getQueryData<{ status: number; body: unknown }>(key);
    if (cached?.status === 200 && Array.isArray(cached.body)) {
      const hit = (cached.body as Festival[]).find((item) => item.slug === slug);
      if (hit) return hit;
    }
  }
  return undefined;
}

/**
 * D-08 tracer — the slug-keyed festival home. Fetches `getFestival(slug)`
 * and renders the festival's real identity + key facts (`formatDateRange`,
 * place) + the static coming-soon menu (D-07). This closes the vertical
 * (seed -> migration -> contract -> API -> mobile screen) proven halfway by
 * 05-01. Back is always non-dead-end via `leaveFestival(router)` (FEST-04)
 * — this screen may be entered by a cold-start `router.replace('/f/:slug')`
 * that leaves no in-app history (05-05), so a bare `router.back()` is never
 * used here.
 */
export default function FestivalHomeScreen() {
  const params = useLocalSearchParams<{ festivalSlug?: string | string[] }>();
  const festivalSlug = normalizeSlug(params.festivalSlug);
  const router = useRouter();
  const { t } = useLingui();
  const fontsReady = useFontsReady();
  const bodyFont = resolveFontFamily(FONT_BODY, fontsReady);
  const displayFont = resolveFontFamily(FONT_DISPLAY, fontsReady);
  const queryClient = useQueryClient();

  const cachedFestival = festivalSlug
    ? findCachedFestivalBySlug(queryClient, festivalSlug)
    : undefined;

  // NO initialData/placeholderData here (REVIEW 05-03 HIGH) — the query
  // always fetches and stays the authoritative source; cachedFestival below
  // is only ever a separate paint hint while it resolves.
  const query = useQuery({
    queryKey: festivalKeys.detail(festivalSlug),
    queryFn: () => apiClient.getFestival({ params: { slug: festivalSlug } }),
    enabled: festivalSlug.length > 0,
  });

  // A 404 is a SUCCESSFUL React Query result, never `query.status === 'error'`
  // (REVIEW 05-03 MEDIUM) — the contract models 404 as a real response.
  const notFound = query.status === 'success' && query.data.status === 404;

  // A deleted/invalid slug must not keep re-pointing the D-06 cold-start
  // focus at a festival that no longer resolves — clear ONLY when the
  // persisted slug is the one that actually 404'd.
  useEffect(() => {
    if (!notFound) return;
    if (getActiveFestivalSlug() === festivalSlug) {
      clearActiveFestivalSlug();
    }
  }, [notFound, festivalSlug]);

  const festival: Festival | undefined =
    query.status === 'success' && query.data.status === 200 ? query.data.body : cachedFestival;

  const missingSlug = festivalSlug.length === 0;
  const showLoading = !missingSlug && query.isPending && !cachedFestival;
  const showTransportError = !missingSlug && query.isError;
  const showNotFound = !showTransportError && (missingSlug || notFound);
  const showContent = !showTransportError && !showNotFound && festival !== undefined;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: festival?.name ?? t`Festival`,
          headerLeft: () => (
            <Pressable
              style={styles.headerBack}
              onPress={() => leaveFestival(router)}
              accessibilityLabel={t`Back`}
              hitSlop={12}
            >
              <ArrowLeft size={24} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          ),
        }}
      />

      {showLoading ? (
        <View style={styles.centered}>
          <Text style={[styles.helper, { fontFamily: bodyFont }]}>
            <Trans>Loading festival…</Trans>
          </Text>
        </View>
      ) : null}

      {showTransportError ? (
        <View style={styles.centered}>
          <Text style={[styles.error, { fontFamily: bodyFont }]}>
            <Trans>
              Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.
            </Trans>
          </Text>
          <Pressable style={styles.retryButton} onPress={() => query.refetch()}>
            <Text style={[styles.retryButtonText, { fontFamily: bodyFont }]}>
              <Trans>Retry</Trans>
            </Text>
          </Pressable>
        </View>
      ) : null}

      {showNotFound ? (
        <View style={styles.centered}>
          <Text style={[styles.heading, { fontFamily: displayFont }]}>
            <Trans>Festival not found</Trans>
          </Text>
          <Text style={[styles.helper, { fontFamily: bodyFont }]}>
            <Trans>This festival may have been removed or the link is out of date.</Trans>
          </Text>
        </View>
      ) : null}

      {showContent && festival ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.identityBlock}>
            <Text style={[styles.name, { fontFamily: displayFont }]} numberOfLines={2}>
              {festival.name}
            </Text>
            {/* UI-SPEC §Accent + key-fact contract: the festival-home identity
                block shows two accent-icon key-fact rows (calendar-clock/map-pin
                in colors.primary), NOT the flat FestivalCard's single muted
                "{dates} · {place}" caption. */}
            <View style={styles.keyFacts}>
              <View style={styles.keyFactRow}>
                <CalendarClock size={18} color={colors.primary} strokeWidth={2} />
                <Text style={[styles.keyFactText, { fontFamily: bodyFont }]} numberOfLines={1}>
                  {formatDateRange(festival.startDate, festival.endDate, i18n.locale)}
                </Text>
              </View>
              {festival.place ? (
                <View style={styles.keyFactRow}>
                  <MapPin size={18} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.keyFactText, { fontFamily: bodyFont }]} numberOfLines={1}>
                    {festival.place}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.tileGrid}>
            <ComingSoonTile icon={CalendarClock} label={t`Timetable`} badge={t`Soon`} />
            <ComingSoonTile icon={MapPin} label={t`Map`} badge={t`Soon`} />
            <ComingSoonTile icon={Wallet} label={t`Cashless`} badge={t`Soon`} />
            <ComingSoonTile icon={Newspaper} label={t`News`} badge={t`Soon`} />
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  headerBack: {
    width: layout.hitMin,
    height: layout.hitMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    padding: layout.screenPad,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingScale['sp-5'],
  },
  helper: {
    fontSize: typeRoles.body.size,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  error: {
    fontSize: typeRoles.bodySm.size,
    color: colors.danger,
    textAlign: 'center',
  },
  heading: {
    fontSize: typeRoles.title2.size,
    fontWeight: typeRoles.title2.weight,
    lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: layout.hitMin,
    paddingHorizontal: spacingScale['sp-8'],
    backgroundColor: colors.primary,
    borderRadius: radiiScale['r-pill'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: typeRoles.title3.size,
    fontWeight: typeRoles.title3.weight,
    color: colors.textOnPrimary,
  },
  content: {
    paddingHorizontal: layout.screenPad,
    paddingTop: spacingScale['sp-7'],
    paddingBottom: layout.scrollBottomPad,
  },
  identityBlock: {
    gap: spacingScale['sp-4'],
  },
  name: {
    fontSize: typeRoles.display2.size,
    fontWeight: typeRoles.display2.weight,
    lineHeight: typeRoles.display2.size * typeRoles.display2.lineHeight,
    color: colors.textPrimary,
  },
  keyFacts: {
    gap: spacingScale['sp-3'],
  },
  keyFactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingScale['sp-4'],
  },
  keyFactText: {
    flex: 1,
    fontSize: typeRoles.bodySm.size,
    color: colors.textMuted,
  },
  tileGrid: {
    marginTop: spacingScale['sp-9'],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingScale['sp-5'],
  },
});
