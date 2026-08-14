import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarClock, MapPin } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { i18n } from '../../../../lib/i18n';
import { useFestivalContext } from '../../../../lib/festival-context';
import { formatDateRange } from '../../../../lib/date-range';
import { fontFamilyForRole } from '../../../../lib/fonts';
import { useFontsReady } from '../../../../lib/fonts-context';
import type { ThemeColors } from '../../../../lib/theme';
import { useTheme } from '../../../../lib/theme-context';
import { useHeaderClearance } from '../../../../components/AppHeader';

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
 */
export default function FestivalDashboardScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerClearance = useHeaderClearance();
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10) — the family carries the weight, so the
  // matching styles set no numeric `fontWeight`.
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);

  const festival = useFestivalContext();

  // The layout gate (./_layout.tsx) has already handled every state where the
  // festival is unresolved (loading/error/404) — by the time this tab can
  // mount and the context is populated at all, `festival` is defined by
  // construction. This guard is a defensive no-op, not a second
  // loading/error branch.
  if (!festival) return null;

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
