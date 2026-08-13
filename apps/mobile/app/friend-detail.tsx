import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { X } from 'lucide-react-native';
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

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, spacingScale } = tokens;

const CLOSE_ICON_SIZE = 24;

function normalizeAccountId(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? '').trim();
}

/**
 * Same read-the-cache idiom `(festival)/f/[festivalSlug].tsx`'s
 * `findCachedFestivalBySlug` already establishes: `friendKeys.list` holds the
 * FULL ts-rest response (`{ status, body }`), not a bare `Friend[]`, so the
 * shape is validated before `.find()` runs. A stale/malformed cache entry is
 * a miss, never a crash.
 */
function findCachedFriend(
  queryClient: ReturnType<typeof useQueryClient>,
  accountId: string,
): Friend | undefined {
  const cached = queryClient.getQueryData<{ status: number; body: unknown }>(friendKeys.list);
  if (cached?.status !== 200 || !Array.isArray(cached.body)) return undefined;
  return (cached.body as Friend[]).find((entry) => entry.profile.accountId === accountId);
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

  if (!friend) return null;

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
  });
}
