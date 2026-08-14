import { useEffect, useMemo, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { UserMinus, X } from 'lucide-react-native';
import { tokens } from '@quiks/ui';
import type { Friend } from '@quiks/contracts';

import { AvatarSunsetRing } from '../components/AvatarSunsetRing';
import { AvatarTile } from '../components/AvatarTile';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import { friendKeys } from '../lib/friend-queries';
import { i18n } from '../lib/i18n';
import { buildIdentityLine } from '../lib/profile-meta-line';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { useFriendMutations } from '../lib/use-friend-mutations';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, spacingScale } = tokens;

const CLOSE_ICON_SIZE = 24;
const DANGER_ICON_SIZE = 22;

function normalizeAccountId(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? '').trim();
}

/**
 * Same read-the-cache idiom `(festival)/f/[festivalSlug].tsx`'s
 * `findCachedFestivalBySlug` already establishes: every candidate cache
 * entry holds the FULL ts-rest response (`{ status, body }`), not a bare
 * `Friend[]`, so the shape is validated before `.find()` runs. A stale or
 * malformed entry is a miss, never a crash.
 *
 * 09-05 Task 2 (4) — extended beyond `friendKeys.list` to ALSO search any
 * `friendKeys.inFestival(festivalId)` entry already in the cache: opening
 * this card from the Festival-Friends-Tab populates that key, not
 * `friendKeys.list`, and there is still no foreign-profile detail endpoint
 * (Phase-7 D-04) to fetch from instead. `getQueriesData` with the SHARED
 * `friendKeys.all` prefix finds every friend-shaped list under it without
 * needing to know which `festivalId` (if any) is live; the `scope` guard
 * below excludes sibling keys under the same prefix — `friendKeys.requests`
 * (a `{incoming,outgoing}` object, not an array) and `friendKeys.search(q)`
 * (an array of `VisitorSummary`, which carries no `friendsSince` field) —
 * neither is a valid substitute for a `Friend` entry.
 */
function findCachedFriend(
  queryClient: ReturnType<typeof useQueryClient>,
  accountId: string,
): Friend | undefined {
  const entries = queryClient.getQueriesData<{ status: number; body: unknown }>({
    queryKey: friendKeys.all,
  });
  for (const [key, cached] of entries) {
    const scope = key[1];
    if (scope !== 'list' && scope !== 'inFestival') continue;
    if (cached?.status !== 200 || !Array.isArray(cached.body)) continue;
    const hit = (cached.body as Friend[]).find((entry) => entry.profile.accountId === accountId);
    if (hit) return hit;
  }
  return undefined;
}

/**
 * D-09 — the friend detail modal, opened from tapping a `Deine Crew` row.
 *
 * ROOT-LEVEL, like `app/profil.tsx`: a sibling of `(tabs)`, so pushing it
 * hides `FloatingNav` automatically with no per-screen visibility logic.
 * Registered explicitly inside `app/_layout.tsx`'s authenticated
 * `Stack.Protected` block — that Stack lists its children exhaustively, so
 * an unregistered sibling dead-ends on Expo Router's Unmatched Route screen
 * (the same failure class as the resolved `first-login-unmatched-route`
 * bug).
 *
 * NO FETCH, NO NEW ENDPOINT (Phase-7 D-04, UI-SPEC § Screens & Navigation
 * Contract): the card reads the already-loaded `friendKeys.list` cache
 * entry the Friends screen's own Crew query populated, keyed by the
 * `accountId` navigation param. E5's empty/loading/error states are
 * therefore unreachable by design (UI-SPEC rows 30–32) — a missing/vanished
 * entry (cold cache after a process restart, or the friend was just
 * removed) closes the screen instead of rendering a broken card.
 */
export default function FriendDetailScreen() {
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const nameFont = fontFamilyForRole('title2', fontsReady);
  const handleFont = fontFamilyForRole('countdown', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const dangerFont = fontFamilyForRole('title3', fontsReady);

  const router = useRouter();
  const params = useLocalSearchParams<{ accountId?: string | string[] }>();
  const accountId = normalizeAccountId(params.accountId);
  const queryClient = useQueryClient();

  const friend = accountId ? findCachedFriend(queryClient, accountId) : undefined;

  useEffect(() => {
    if (friend) return;
    // Cache empty after a process restart, or the entry just vanished (e.g.
    // unfriended from another device) — there is nothing to show and this
    // screen makes no fetch of its own, so it closes rather than render a
    // broken card.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/friends');
    }
  }, [friend, router]);

  // FRND-08 / D-10 — `unfriend` from the ONE place every friend-mutation is
  // defined (`use-friend-mutations.ts`); this screen never calls
  // `apiClient.unfriend` itself.
  const { unfriend, pendingTargetId, failedTargetId } = useFriendMutations();
  const isUnfriendPending = accountId !== '' && pendingTargetId === accountId;
  const unfriendFailed = accountId !== '' && failedTargetId === accountId;

  // The invalidation this mutation triggers (`friendKeys.all`, in
  // `use-friend-mutations.ts`'s shared `onSettled`) must run BEFORE the
  // screen closes, so the Crew list has already started refetching when the
  // visitor lands back on it. A ref-tracked pending->settled transition is
  // what lets this screen navigate only on the SUCCESS path — `onSettled`
  // fires on both, and `failedTargetId` is the only way to tell them apart
  // after the fact. On failure the card stays open with the inline error
  // below instead of navigating on a false premise.
  const wasUnfriendPendingRef = useRef(false);
  useEffect(() => {
    if (wasUnfriendPendingRef.current && !isUnfriendPending && !unfriendFailed) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/friends');
      }
    }
    wasUnfriendPendingRef.current = isUnfriendPending;
  }, [isUnfriendPending, unfriendFailed, router]);

  if (!friend) return null;

  function confirmUnfriend() {
    Alert.alert(
      t`End this friendship?`,
      t`You'll need to send a new request to become friends again.`,
      [
        { text: t`Cancel`, style: 'cancel' },
        { text: t`End`, style: 'destructive', onPress: () => unfriend(accountId) },
      ],
    );
  }

  // age is always undefined — the foreign profile view carries no
  // `birthDate` (Phase 7 D-02), so this card can never show one.
  const identityLine = buildIdentityLine({
    pronoun: friend.profile.pronoun,
    age: undefined,
    gender: friend.profile.gender,
  });

  const friendsSinceLabel = new Intl.DateTimeFormat(i18n.locale, { dateStyle: 'long' }).format(
    new Date(friend.friendsSince),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen
        options={{
          // 09-07 gap closure (T-09-25) — the root Stack's navigator-level
          // header default (app/_layout.tsx) now hides the native header
          // everywhere; this screen turns it back on for itself because its
          // close button lives IN that native header (09-04 Flagged
          // Assumption 1) — without this override the card would render
          // with no way out.
          headerShown: true,
          presentation: 'modal',
          title: '',
          headerLeft: () => null,
          headerRight: () => (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/friends'))}
              accessibilityRole="button"
              accessibilityLabel={t`Close`}
              hitSlop={12}
            >
              <X size={CLOSE_ICON_SIZE} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.content}>
        <View style={styles.identityBlock}>
          <AvatarSunsetRing>
            <AvatarTile displayName={friend.profile.displayName} username={friend.profile.username} />
          </AvatarSunsetRing>

          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.displayName, { fontFamily: nameFont }]}
          >
            {friend.profile.displayName}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.handle, { fontFamily: handleFont }]}
          >
            @{friend.profile.username}
          </Text>

          {/* Two empty fields -> buildIdentityLine returns null -> the
              element is dropped entirely: no dash, no placeholder. */}
          {identityLine ? (
            <Text style={[styles.identityLine, { fontFamily: bodySmFont }]}>{identityLine}</Text>
          ) : null}

          <Text style={[styles.sinceLine, { fontFamily: bodySmFont }]}>
            <Trans>Friends since {friendsSinceLabel}</Trans>
          </Text>
        </View>

        {/* D-10 — ListRow-danger-style row, but NOT the `ListRow` component
            itself: `ListRow` always renders a chevron once `onPress` is set,
            and this row must not (it is a terminal action, not navigation).
            No `Alert.alert` confirm exists for decline/withdraw elsewhere in
            this phase (Phase-7 D-11/D-12) — unfriend is the one action in
            this phase that IS destructive enough to ask first. */}
        <View style={styles.dangerBlock}>
          <Pressable
            style={styles.dangerRow}
            onPress={confirmUnfriend}
            disabled={isUnfriendPending}
            accessibilityRole="button"
            accessibilityLabel={t`End friendship`}
            accessibilityState={{ disabled: isUnfriendPending }}
          >
            <UserMinus size={DANGER_ICON_SIZE} color={colors.dangerText} strokeWidth={2} />
            <Text style={[styles.dangerLabel, { fontFamily: dangerFont }]}>
              <Trans>End friendship</Trans>
            </Text>
          </Pressable>
          {unfriendFailed ? (
            <Text style={[styles.dangerError, { fontFamily: bodySmFont }]}>
              <Trans>Couldn't save — try again.</Trans>
            </Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgApp },
    content: {
      flex: 1,
      paddingHorizontal: layout.screenPad,
      paddingTop: layout.sectionGap,
      paddingBottom: layout.screenPad,
      justifyContent: 'space-between',
    },
    identityBlock: { alignItems: 'center', gap: spacingScale['sp-4'] },
    displayName: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    // UI-SPEC § Color, accent item 3 — the same brand-text handle treatment
    // every `PersonRow` and the Profil header already use.
    handle: {
      fontSize: typeRoles.countdown.size,
      lineHeight: typeRoles.countdown.size * typeRoles.countdown.lineHeight,
      color: colors.primary,
      textAlign: 'center',
    },
    identityLine: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
      textAlign: 'center',
    },
    sinceLine: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
      textAlign: 'center',
    },
    dangerBlock: { gap: spacingScale['sp-2'] },
    dangerRow: {
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacingScale['sp-4'],
    },
    dangerLabel: {
      fontSize: typeRoles.title3.size,
      color: colors.dangerText,
    },
    // The status-hue rule: an error rendered as TEXT always resolves through
    // `dangerText`, never the bare `danger` fill.
    dangerError: {
      fontSize: typeRoles.bodySm.size,
      color: colors.dangerText,
      textAlign: 'center',
    },
  });
}
