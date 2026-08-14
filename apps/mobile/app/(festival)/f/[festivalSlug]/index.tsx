import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useLingui } from '@lingui/react/macro';
import { CalendarClock, MapPin, Users } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { apiClient } from '../../../../lib/api-client';
import { friendKeys } from '../../../../lib/friend-queries';
import { i18n } from '../../../../lib/i18n';
import { useFestivalContext } from '../../../../lib/festival-context';
import { formatDateRange } from '../../../../lib/date-range';
import { fontFamilyForRole } from '../../../../lib/fonts';
import { useFontsReady } from '../../../../lib/fonts-context';
import type { ThemeColors } from '../../../../lib/theme';
import { useTheme } from '../../../../lib/theme-context';
import { useHeaderClearance } from '../../../../components/AppHeader';
import { StatTile } from '../../../../components/StatTile';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, spacingScale } = tokens;

/**
 * The Dashboard tab (09-03 Task 1) — the former `f/[festivalSlug].tsx`
 * content, MINUS the D-10 gate logic that now lives one layer up in
 * `./_layout.tsx`. Reads the resolved festival from
 * `useFestivalContext()` (`lib/festival-context.ts`) rather than running its
 * own `useQuery` — see that module's doc comment for why (09-03 device-bug
 * fix: a second independent observer could transiently disagree with the
 * layout gate's own state on tab re-focus, which blanked this screen).
 *
 * The four `ComingSoonTile`s from the pre-split screen are removed
 * ERSATZLOS (D-07): Timetable and Lageplan are now real tabs, Cashless and
 * News have no place on the Dashboard until later plans (09-06 adds the
 * Cashless `StatTile`; News never lands on the Dashboard, D-07).
 *
 * 09-04 (D-08) — the festival-name heading is REMOVED ERSATZLOS: the name
 * now lives exactly once, in `AppHeader`'s festival state, where it says on
 * all five tabs which festival you're in. The Dashboard now begins with the
 * two key-fact rows. The back-navigation `Stack.Screen`/`headerLeft` block
 * is also gone — its successor is `AppHeader`'s home button (D-02/D-03).
 *
 * 09-05 Task 1 — the Crew `StatTile` is the first tile row on this screen.
 * It reads `friendKeys.inFestival(festival.id)`, the SAME key the Friends
 * tab (Task 2) reads, so the two can never disagree (one cache entry, one
 * invalidation). Unlike the removed `ComingSoonTile`s it is ALWAYS rendered
 * (D-11) — a friend count is real data, not a "coming soon" placeholder.
 */
export default function FestivalDashboardScreen() {
  const { t } = useLingui();
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerClearance = useHeaderClearance();
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10) — the family carries the weight, so the
  // matching styles set no numeric `fontWeight`.
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);

  const festival = useFestivalContext();

  // `enabled` only once the layout gate has resolved a festival — this query
  // is declared unconditionally (Rules of Hooks) even though the `!festival`
  // guard below means it never actually renders before that.
  const friendsInFestivalQuery = useQuery({
    queryKey: friendKeys.inFestival(festival?.id ?? ''),
    queryFn: () => apiClient.friendsInFestival({ params: { festivalId: festival!.id } }),
    enabled: festival !== undefined,
  });

  // The layout gate (./_layout.tsx) has already handled every state where the
  // festival is unresolved (loading/error/404) — by the time this tab can
  // mount and the context is populated at all, `festival` is defined by
  // construction. This guard is a defensive no-op, not a second
  // loading/error branch.
  if (!festival) return null;

  const friendsHereLabel = t`Friends here`;

  // A non-200 ts-rest result is a SUCCESSFUL React Query result, never
  // `query.status === 'error'` — same project-wide rule every other screen
  // follows. `friendsHereCount` is `undefined` for every non-200/non-success
  // result, not only a genuine transport error.
  const friendsHereCount =
    friendsInFestivalQuery.status === 'success' && friendsInFestivalQuery.data.status === 200
      ? friendsInFestivalQuery.data.body.length
      : undefined;
  // Three, not two, outcomes (UI-SPEC consideration 16/17): while the query
  // is still pending (no cache value at all), the tile shows NEITHER a value
  // NOR a note — no skeleton, no flashed `0`. Once it settles, a count above
  // 0 shows the value; a 0 count, a transport error or a non-200 all
  // collapse to the SAME "Nobody yet" note (a 0 is a statement, not a
  // silently-absorbed error, but the tile deliberately carries no second
  // inline error block — the one retry affordance lives on the Friends tab).
  const friendsInFestivalPending = friendsInFestivalQuery.status === 'pending';
  const friendsHereValue =
    friendsHereCount !== undefined && friendsHereCount > 0 ? String(friendsHereCount) : undefined;
  const friendsHereNote =
    friendsInFestivalPending || friendsHereValue !== undefined ? undefined : t`Nobody yet`;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerClearance + spacingScale['sp-7'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identityBlock}>
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

        {/* 09-05 Task 1 — the tile row: exactly one `flex: 1` tile in this
            plan (Crew). `tone="default"`: a friend count is information, not
            a primary action, so it does not compete with `tone="brand"`
            (reserved for 09-06's Cashless entry) for the tab's one accent
            surface. A tap switches the ACTIVE TAB to Friends
            (`router.navigate`, never `push` — this is a tab change, not a
            stack push). The full D-11 empty-state sentence lives one tap
            further, as the second empty state's body copy on the Friends
            tab itself (Task 2) — it would run five to six lines in a
            half-width tile and pull both tiles' height up with it. */}
        <View style={styles.tileRow}>
          <StatTile
            icon={Users}
            label={friendsHereLabel}
            value={friendsHereValue}
            note={friendsHereNote}
            tone="default"
            onPress={() => router.navigate(`/f/${festival.slug}/friends`)}
            accessibilityLabel={friendsHereLabel}
          />
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
    // 09-05 Task 1 — the tile row: `flexDirection: 'row'`, `sp-5` gap, every
    // tile `flex: 1` (`StatTile`'s own style, not set here). One tile fills
    // the row without special-casing.
    tileRow: {
      marginTop: spacingScale['sp-7'],
      flexDirection: 'row',
      gap: spacingScale['sp-5'],
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
