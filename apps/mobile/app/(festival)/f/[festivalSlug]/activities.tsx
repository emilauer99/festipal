import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Trans } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';
import type { ActivitySummary } from '@quiks/contracts';

import { apiClient } from '../../../../lib/api-client';
import { activityKeys, sortByStartTimeStable, unwrapOk } from '../../../../lib/activity-queries';
import { useFestivalContext } from '../../../../lib/festival-context';
import { fontFamilyForRole } from '../../../../lib/fonts';
import { useFontsReady } from '../../../../lib/fonts-context';
import type { ThemeColors } from '../../../../lib/theme';
import { useTheme } from '../../../../lib/theme-context';
import { useHeaderClearance } from '../../../../components/AppHeader';
import { ActivityCard } from '../../../../components/ActivityCard';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

/**
 * The "Aktivität starten" CTA (11-04-PLAN Task 3) — accent-primary pill,
 * same treatment `RelationAction`/`calloutPrimaryButton`/`heroCta` already
 * establish (UI-SPEC § Color item 1). Rendered TWICE on this screen (once
 * above both sections, once inside "Deine Aktivitäten"'s own empty state)
 * from this one shared component so both instances stay in lock-step —
 * never a second, drifting copy of the same button.
 */
function StartActivityButton({
  onPress,
  styles,
  fontFamily,
}: {
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  fontFamily: string | undefined;
}) {
  return (
    <Pressable style={styles.startButton} onPress={onPress} accessibilityRole="button">
      <Text style={[styles.startButtonText, { fontFamily }]}>
        <Trans>Start an activity</Trans>
      </Text>
    </Pressable>
  );
}

/**
 * The two-source, two-section state a single query can be in on this screen
 * (11-01-PLAN Task 1/Task 2, UI-SPEC E1 partial) — loading/error/empty/data,
 * resolved per section independently. `unwrapOk` runs INSIDE each `queryFn`
 * (per the plan's explicit instruction), so a non-200 response and a
 * transport failure collapse into the SAME React Query `'error'` status —
 * there is no separate "response error" branch to maintain here.
 */
type SectionState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'data'; items: ActivitySummary[] };

function computeSectionState(
  status: 'pending' | 'error' | 'success',
  data: ActivitySummary[] | undefined,
  sort: (items: ActivitySummary[]) => ActivitySummary[] = sortByStartTimeStable,
): SectionState {
  if (status === 'pending') return { kind: 'loading' };
  if (status === 'error' || data === undefined) return { kind: 'error' };
  return data.length === 0 ? { kind: 'empty' } : { kind: 'data', items: sort(data) };
}

/**
 * D-04 — "Deine Aktivitäten" ordering: upcoming entries first (ascending by
 * `startTime`), started entries after, at the section's end. Each of the two
 * groups stays internally run-stable via the SAME `id` tie-break
 * `sortByStartTimeStable` already provides — sorting once ascending, then
 * partitioning by `nowIso`, preserves that ascending order within each
 * partition without re-sorting.
 *
 * `nowIso` is threaded in from the caller (drawn ONCE per screen render, see
 * `FestivalActivitiesScreen`) rather than read here — grouping and the
 * "Gestartet" chip's own comparison must agree within a single render, or a
 * card could land in the wrong half relative to its own badge.
 */
function groupMineActivities(items: ActivitySummary[], nowIso: string): ActivitySummary[] {
  const sorted = sortByStartTimeStable(items);
  const upcoming = sorted.filter((item) => item.startTime >= nowIso);
  const started = sorted.filter((item) => item.startTime < nowIso);
  return [...upcoming, ...started];
}

/**
 * The real Activities tab (11-01, ACT-02) — replaces the Phase-9 placeholder.
 * Two independently-resolving sections stacked per D-01: "Deine Aktivitäten"
 * (`activityKeys.mine`, `listMyActivities` — no `startTime` cutoff, D-11)
 * above "Wer kommt mit?" (`activityKeys.list`, `listActivities` — excludes
 * already-started activities server-side, D-10). Neither section's
 * loading/error/empty state ever replaces the other's content (UI-SPEC E1
 * partial).
 *
 * The festival comes from `useFestivalContext()` — never a second
 * `useQuery` against `festivalKeys.detail` (the 09-03 device bug this
 * project has already paid for once).
 */
export default function FestivalActivitiesScreen() {
  const router = useRouter();
  const festival = useFestivalContext();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerClearance = useHeaderClearance();
  const fontsReady = useFontsReady();
  const headingFont = fontFamilyForRole('title2', fontsReady);
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const buttonFont = fontFamilyForRole('title3', fontsReady);

  // `enabled` only once the layout gate has resolved a festival — declared
  // unconditionally (Rules of Hooks) even though the `!festival` guard below
  // means it never actually renders before that (same idiom as the
  // Dashboard/Friends tabs' own festival-scoped queries).
  const mineQuery = useQuery({
    queryKey: activityKeys.mine(festival?.id ?? ''),
    queryFn: async () =>
      unwrapOk<ActivitySummary[]>(
        await apiClient.listMyActivities({ params: { festivalId: festival?.id ?? '' } }),
      ),
    enabled: festival !== undefined,
  });
  const listQuery = useQuery({
    queryKey: activityKeys.list(festival?.id ?? ''),
    queryFn: async () =>
      unwrapOk<ActivitySummary[]>(
        await apiClient.listActivities({ params: { festivalId: festival?.id ?? '' } }),
      ),
    enabled: festival !== undefined,
  });

  // The layout gate (`./_layout.tsx`) has already handled every state where
  // the festival is unresolved (loading/error/404) — by the time this tab
  // can mount and the context is populated at all, `festival` is defined by
  // construction (ACT-02's flagged assumption: unreachable without a
  // resolved festival). This guard is a defensive no-op, not a second
  // loading/error branch.
  if (!festival) return null;

  // Drawn EXACTLY ONCE per render (D-04) — both the mine-section grouping
  // above and every card's "Gestartet" flag below compare against this same
  // snapshot, so the grouping and the badge can never disagree within one
  // render. ISO-8601 strings compare correctly with plain `<`/`>=`.
  const nowIso = new Date().toISOString();
  const mineState = computeSectionState(mineQuery.status, mineQuery.data, (items) =>
    groupMineActivities(items, nowIso),
  );
  const listState = computeSectionState(listQuery.status, listQuery.data);

  // The one navigation both sections share (D-01/UI-SPEC E9) — a tap on
  // either section's card opens the SAME registered `/activity-detail` push
  // screen (Task 3), keyed by `activityId`.
  function openActivityDetail(activityId: string) {
    router.push({ pathname: '/activity-detail', params: { activityId } });
  }

  // 11-04 Task 3 — plain PUSH (not replace): the tab stays on the back
  // stack, so leaving the create form without submitting returns here.
  function openActivityCreate() {
    router.push('/activity-create');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerClearance + layout.screenPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 11-04 Task 3 — above BOTH sections, visible in every state
            (including a failed list read on either query, UI-SPEC E1
            error): a broken list read must never block starting an
            activity. */}
        <StartActivityButton onPress={openActivityCreate} styles={styles} fontFamily={buttonFont} />

        <View style={styles.section}>
          <Text style={[styles.heading, { fontFamily: headingFont }]}>
            <Trans>Your activities</Trans>
          </Text>

          {mineState.kind === 'loading' ? (
            <Text style={[styles.helper, { fontFamily: bodyFont }]}>
              <Trans>Loading…</Trans>
            </Text>
          ) : null}

          {mineState.kind === 'error' ? (
            <Text style={[styles.error, { fontFamily: bodySmFont }]}>
              <Trans>
                Can't reach the server — make sure your device is on the same Wi-Fi as the dev
                API.
              </Trans>
            </Text>
          ) : null}

          {mineState.kind === 'empty' ? (
            <View style={styles.emptyBlock}>
              <Text style={[styles.helper, { fontFamily: bodyFont }]}>
                <Trans>
                  Nothing of your own yet — start an activity or join one below.
                </Trans>
              </Text>
              <StartActivityButton
                onPress={openActivityCreate}
                styles={styles}
                fontFamily={buttonFont}
              />
            </View>
          ) : null}

          {mineState.kind === 'data' ? (
            <View style={styles.cardList}>
              {mineState.items.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  started={activity.startTime < nowIso}
                  onPress={() => openActivityDetail(activity.id)}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { fontFamily: headingFont }]}>
            <Trans>Who's coming?</Trans>
          </Text>

          {listState.kind === 'loading' ? (
            <Text style={[styles.helper, { fontFamily: bodyFont }]}>
              <Trans>Loading…</Trans>
            </Text>
          ) : null}

          {listState.kind === 'error' ? (
            <Text style={[styles.error, { fontFamily: bodySmFont }]}>
              <Trans>
                Can't reach the server — make sure your device is on the same Wi-Fi as the dev
                API.
              </Trans>
            </Text>
          ) : null}

          {listState.kind === 'empty' ? (
            <Text style={[styles.helper, { fontFamily: bodyFont }]}>
              <Trans>
                No activities in this festival yet. Be the first to start one.
              </Trans>
            </Text>
          ) : null}

          {listState.kind === 'data' ? (
            <View style={styles.cardList}>
              {listState.items.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  started={false}
                  onPress={() => openActivityDetail(activity.id)}
                />
              ))}
            </View>
          ) : null}
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
      paddingBottom: layout.scrollBottomPad,
      gap: layout.sectionGap,
    },
    section: { gap: spacingScale['sp-5'] },
    heading: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textPrimary,
    },
    helper: {
      fontSize: typeRoles.body.size,
      color: colors.textSecondary,
    },
    // The status-hue rule: an error rendered as TEXT always resolves through
    // `dangerText`, never the bare `danger` fill.
    error: {
      fontSize: typeRoles.bodySm.size,
      color: colors.dangerText,
    },
    cardList: { gap: spacingScale['sp-5'] },
    emptyBlock: { gap: spacingScale['sp-5'], alignItems: 'flex-start' },
    // UI-SPEC § Color item 1 — the same accent-primary CTA treatment every
    // other primary pill in this phase uses (RelationAction/
    // calloutPrimaryButton/heroCta): solid `primary` fill, `textOnPrimary`
    // text, `r-pill` radius, `hitMin` height floor.
    startButton: {
      alignSelf: 'flex-start',
      minHeight: layout.hitMin,
      paddingHorizontal: spacingScale['sp-8'],
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: radiiScale['r-pill'],
    },
    startButtonText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
  });
}
