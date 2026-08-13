import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, MapPin } from 'lucide-react-native';
import { tokens } from '@quiks/ui';
import type { Festival } from '@quiks/contracts';

import { apiClient } from '../../../../lib/api-client';
import { i18n } from '../../../../lib/i18n';
import { festivalKeys, findCachedFestivalBySlug } from '../../../../lib/festival-queries';
import { formatDateRange } from '../../../../lib/date-range';
import { fontFamilyForRole } from '../../../../lib/fonts';
import { useFontsReady } from '../../../../lib/fonts-context';
import type { ThemeColors } from '../../../../lib/theme';
import { useTheme } from '../../../../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, spacingScale } = tokens;

function normalizeSlug(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? '').trim();
}

/**
 * The Dashboard tab (09-03 Task 1) — the former `f/[festivalSlug].tsx`
 * content, MINUS the D-10 gate logic that now lives one layer up in
 * `./_layout.tsx`. Reads the resolved festival from the SAME
 * `festivalKeys.detail(slug)` query key the layout gate already subscribes
 * to — React Query dedupes the two subscribers into a single network
 * request, so mounting this second `useQuery` does not fire a second
 * request.
 *
 * The four `ComingSoonTile`s from the pre-split screen are removed
 * ERSATZLOS (D-07): Timetable and Lageplan are now real tabs, Cashless and
 * News have no place on the Dashboard until later plans (09-06 adds the
 * Cashless `StatTile`; News never lands on the Dashboard, D-07).
 *
 * The back-navigation `Stack.Screen`/`headerLeft` block is also gone — its
 * successor is the `AppHeader` home button (09-04, D-02/D-03). Until then
 * the only way out of a festival is the system/gesture back navigation
 * (Flagged Assumption 3, 09-03-PLAN.md).
 */
export default function FestivalDashboardScreen() {
  const params = useLocalSearchParams<{ festivalSlug?: string | string[] }>();
  const festivalSlug = normalizeSlug(params.festivalSlug);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10) — the family carries the weight, so the
  // matching styles set no numeric `fontWeight`.
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const nameFont = fontFamilyForRole('display2', fontsReady);
  const queryClient = useQueryClient();

  const cachedFestival = festivalSlug
    ? findCachedFestivalBySlug(queryClient, festivalSlug)
    : undefined;

  const query = useQuery({
    queryKey: festivalKeys.detail(festivalSlug),
    queryFn: () => apiClient.getFestival({ params: { slug: festivalSlug } }),
    enabled: festivalSlug.length > 0,
  });

  const festival: Festival | undefined =
    query.status === 'success' && query.data.status === 200 ? query.data.body : cachedFestival;

  // The layout gate (./_layout.tsx) has already handled every state where the
  // festival is unresolved (loading/error/404) — by the time this tab can
  // mount at all, `festival` is defined by construction. This guard is a
  // defensive no-op, not a second loading/error branch.
  if (!festival) return null;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identityBlock}>
          <Text style={[styles.name, { fontFamily: nameFont }]} numberOfLines={2}>
            {festival.name}
          </Text>
          {/* UI-SPEC §Accent + key-fact contract: the identity block shows
              two accent-icon key-fact rows (calendar-clock/map-pin in
              colors.primary). */}
          <View style={styles.keyFacts}>
            <View style={styles.keyFactRow}>
              <CalendarClock size={18} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.keyFactText, { fontFamily: bodySmFont }]} numberOfLines={1}>
                {formatDateRange(festival.startDate, festival.endDate, i18n.locale)}
              </Text>
            </View>
            {festival.place ? (
              <View style={styles.keyFactRow}>
                <MapPin size={18} color={colors.primary} strokeWidth={2} />
                <Text style={[styles.keyFactText, { fontFamily: bodySmFont }]} numberOfLines={1}>
                  {festival.place}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgApp },
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
      letterSpacing: typeRoles.display2.letterSpacing,
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
  });
}
