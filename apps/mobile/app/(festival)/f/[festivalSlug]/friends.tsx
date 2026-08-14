import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';
import type { Friend } from '@quiks/contracts';

import { apiClient } from '../../../../lib/api-client';
import { useFestivalContext } from '../../../../lib/festival-context';
import { friendKeys } from '../../../../lib/friend-queries';
import { sortFriendsByDisplayName } from '../../../../lib/friend-sort';
import { fontFamilyForRole } from '../../../../lib/fonts';
import { useFontsReady } from '../../../../lib/fonts-context';
import type { ThemeColors } from '../../../../lib/theme';
import { useTheme } from '../../../../lib/theme-context';
import { useHeaderClearance } from '../../../../components/AppHeader';
import { PersonRow } from '../../../../components/PersonRow';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

/**
 * The three-state-plus-populated view state (09-05 Task 2, D-17). Not a
 * union over the intersection query alone — `emptyNoFriends`/`emptyNotSaved`
 * are decided by the GLOBAL friends list (`friendKeys.list`), never by the
 * length of the intersection itself (that is the whole point of D-17: "you
 * have no friends" and "your friends haven't saved this festival" must read
 * as two genuinely different situations).
 */
type ViewState =
  | { kind: 'loading' }
  | { kind: 'error'; retry: () => void }
  | { kind: 'emptyNoFriends' }
  | { kind: 'emptyNotSaved' }
  | { kind: 'data'; friends: Friend[] };

/**
 * The Festival Friends tab (09-05 Task 2, FRND-07) — the intersection of
 * "my friends" and "friends who saved THIS festival", rendered as a
 * `PersonRow` list with three independently-worded empty states (D-17) and
 * the project-wide transport-error-plus-retry pattern. No presence, location
 * or distance signal is ever attached to a row (ADR-014, T-09-17) — the
 * `PersonRow` calls below pass only `profile`/`onPress`/`accessibilityLabel`.
 *
 * TWO queries, ZERO new keys: `friendKeys.inFestival(festival.id)` — the
 * SAME cache entry the Dashboard's Crew `StatTile` (Task 1) already reads,
 * so the Kachel's number and this list's length can never disagree — and
 * the pre-existing `friendKeys.list` the global Friends screen (`(tabs)/
 * friends.tsx`) already owns. Both are read-only observers here; neither
 * screen's mutation surface is touched.
 *
 * The "Find friends" pill (D-16) lands in Task 3, in the space left below
 * every branch of this render.
 */
export default function FestivalFriendsScreen() {
  const { t } = useLingui();
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerClearance = useHeaderClearance();
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10) — the family carries the weight, so the
  // matching styles set no numeric `fontWeight`.
  const headingFont = fontFamilyForRole('title2', fontsReady);
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const buttonFont = fontFamilyForRole('title3', fontsReady);

  const festival = useFestivalContext();

  // Same key the Dashboard's Crew `StatTile` reads (Task 1) — one cache
  // entry, one invalidation, so the two can never show a different count.
  const intersectionQuery = useQuery({
    queryKey: friendKeys.inFestival(festival?.id ?? ''),
    queryFn: () => apiClient.friendsInFestival({ params: { festivalId: festival!.id } }),
    enabled: festival !== undefined,
  });

  // The bare `friendKeys.list` key `(tabs)/friends.tsx`'s own Crew query
  // already owns — no second definition, just a second read of the same
  // cache entry. Its ONLY job on this screen is deciding which of the two
  // empty states applies; it is never itself rendered as a list here.
  const globalListQuery = useQuery({
    queryKey: friendKeys.list,
    queryFn: () => apiClient.listFriends(),
  });

  function retry() {
    void intersectionQuery.refetch();
    void globalListQuery.refetch();
  }

  function computeViewState(): ViewState {
    if (intersectionQuery.status === 'pending') return { kind: 'loading' };
    // A non-200 ts-rest result is a SUCCESSFUL React Query result, never
    // `status === 'error'` — same project-wide rule every other screen
    // follows. Both failure shapes collapse into the SAME literal error copy
    // (Task 2 action (3): the project-wide transport-error-plus-retry
    // pattern, unchanged, not a second wording for a non-200).
    if (intersectionQuery.status === 'error' || intersectionQuery.data.status !== 200) {
      return { kind: 'error', retry };
    }

    if (globalListQuery.status === 'pending') return { kind: 'loading' };
    if (globalListQuery.status === 'error' || globalListQuery.data.status !== 200) {
      return { kind: 'error', retry };
    }

    // D-17 — the GLOBAL list's length decides which empty state applies,
    // never the intersection's own length.
    if (globalListQuery.data.body.length === 0) return { kind: 'emptyNoFriends' };
    if (intersectionQuery.data.body.length === 0) return { kind: 'emptyNotSaved' };

    return { kind: 'data', friends: sortFriendsByDisplayName(intersectionQuery.data.body) };
  }

  const viewState = computeViewState();

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerClearance + layout.screenPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {viewState.kind === 'loading' ? (
          <Text style={[styles.helper, { fontFamily: bodyFont }]}>
            <Trans>Loading…</Trans>
          </Text>
        ) : null}

        {viewState.kind === 'error' ? (
          <View style={styles.stateBlock}>
            <Text style={[styles.error, { fontFamily: bodySmFont }]}>
              <Trans>
                Can't reach the server — make sure your device is on the same Wi-Fi as the dev
                API.
              </Trans>
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={viewState.retry}
              accessibilityRole="button"
              accessibilityLabel={t`Retry`}
            >
              <Text style={[styles.retryButtonText, { fontFamily: buttonFont }]}>
                <Trans>Retry</Trans>
              </Text>
            </Pressable>
          </View>
        ) : null}

        {viewState.kind === 'emptyNoFriends' ? (
          <View style={styles.emptyBlock}>
            <Text style={[styles.heading, { fontFamily: headingFont }]}>
              <Trans>You don't have any friends yet</Trans>
            </Text>
            <Text style={[styles.helper, { fontFamily: bodyFont }]}>
              <Trans>
                Add someone via search, code or QR — then you'll see who's saved this festival.
              </Trans>
            </Text>
          </View>
        ) : null}

        {viewState.kind === 'emptyNotSaved' ? (
          <View style={styles.emptyBlock}>
            <Text style={[styles.heading, { fontFamily: headingFont }]}>
              <Trans>Your friends haven't saved this festival yet</Trans>
            </Text>
            <Text style={[styles.helper, { fontFamily: bodyFont }]}>
              <Trans>Once one of them does, they'll show up here.</Trans>
            </Text>
          </View>
        ) : null}

        {viewState.kind === 'data' ? (
          <View style={styles.resultsList}>
            {viewState.friends.map((friend) => {
              const { accountId, displayName, username } = friend.profile;
              return (
                <PersonRow
                  key={accountId}
                  profile={friend.profile}
                  onPress={() =>
                    router.push({ pathname: '/friend-detail', params: { accountId } })
                  }
                  accessibilityLabel={t`${displayName}, @${username}`}
                />
              );
            })}
          </View>
        ) : null}
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
      gap: spacingScale['sp-6'],
    },
    helper: {
      fontSize: typeRoles.body.size,
      color: colors.textSecondary,
    },
    stateBlock: { gap: spacingScale['sp-5'], alignItems: 'flex-start' },
    // The status-hue rule: an error rendered as TEXT always resolves through
    // `dangerText`, never the bare `danger` fill.
    error: {
      fontSize: typeRoles.bodySm.size,
      color: colors.dangerText,
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
      color: colors.textOnPrimary,
    },
    emptyBlock: { gap: spacingScale['sp-3'] },
    heading: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textPrimary,
    },
    resultsList: { gap: spacingScale['sp-5'] },
  });
}
