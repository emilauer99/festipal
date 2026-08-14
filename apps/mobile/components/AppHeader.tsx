import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobalSearchParams, useRouter, useSegments } from 'expo-router';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Home } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useLingui } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';

import { apiClient } from '../lib/api-client';
import { getLocalAvatarUri } from '../lib/avatar-storage';
import { resolveHeaderContext, type PushScreenRoute } from '../lib/app-chrome';
import { closePushScreen, goToStartTab, leaveFestival } from '../lib/festival-navigation';
import { festivalKeys } from '../lib/festival-queries';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { AvatarTile } from './AvatarTile';
import { BLUR_INTENSITY } from './FloatingNav';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const LEFT_BUTTON_CIRCLE_SIZE = 36;
const LEFT_ICON_SIZE = 18;
const AVATAR_SIZE = 32;

function normalizeSlug(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? '').trim();
}

/**
 * 09-04 (D-02, D-03, D-04, D-06, D-08 — App Header Contract) — the app-wide
 * three-state header: global (wordmark + home + avatar), festival (name +
 * home + avatar), push (title + back + avatar). Mounted exactly once, as a
 * sibling of the root `<Stack>` inside `app/_layout.tsx`'s authenticated
 * tree; it decides its OWN visibility via `resolveHeaderContext` and returns
 * `null` before any other rendering when the current route should carry no
 * header at all (T-09-13).
 *
 * Structure mirrors `FloatingNav`: colour roles resolve per render through
 * `useTheme()`, styles are built inside the component via
 * `useMemo(() => createStyles(colors), [colors])`, and the glass overlay
 * reuses `FloatingNav`'s own `BlurView`/`BLUR_INTENSITY` — no second blur
 * constant.
 */
export function AppHeader() {
  const segments = useSegments();
  const headerContext = resolveHeaderContext(segments);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const { t } = useLingui();
  const wordmarkFont = fontFamilyForRole('headerWordmark', fontsReady);
  const titleFont = fontFamilyForRole('headerTitle', fontsReady);

  // D-08 — the festival name comes from the SAME query key + query function
  // the festival navigator's own D-10 gate uses
  // (`app/(festival)/f/[festivalSlug]/_layout.tsx`): React Query dedupes two
  // observers of one key into one cache entry and one request (09-04-PLAN.md
  // Flagged Assumption 2). `useGlobalSearchParams` (not `useLocalSearchParams`)
  // is required here — this component is mounted OUTSIDE the `(festival)`
  // route group, so it has no local param scope of its own.
  const params = useGlobalSearchParams<{ festivalSlug?: string | string[] }>();
  const festivalSlug = normalizeSlug(params.festivalSlug);
  const isFestivalState = headerContext.visible && headerContext.kind === 'festival';
  const festivalQuery = useQuery({
    queryKey: festivalKeys.detail(festivalSlug),
    queryFn: () => apiClient.getFestival({ params: { slug: festivalSlug } }),
    enabled: isFestivalState && festivalSlug.length > 0,
  });

  // D-04 — the SAME `['me']` query key + function `app/profil.tsx` and
  // `app/(tabs)/friends.tsx` already use: one cache entry, no second
  // request just because the header also needs the avatar. `enabled` skips
  // the request entirely on routes where the header renders nothing (e.g.
  // the (auth)/(profile-setup) screens this component still mounts under,
  // since it decides its own visibility rather than being conditionally
  // mounted — T-09-13/T-09-14).
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => apiClient.getMe(),
    enabled: headerContext.visible,
  });

  // D-05 (Phase 6) — the avatar photo stays device-local, keyed by
  // accountId; same lookup `app/profil.tsx` already performs.
  const accountId = meQuery.data?.status === 200 ? meQuery.data.body.accountId : undefined;
  const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!accountId) {
      setAvatarUri(undefined);
      return;
    }
    setAvatarUri(getLocalAvatarUri(accountId));
  }, [accountId]);

  if (!headerContext.visible) return null;

  const profile = meQuery.data?.status === 200 ? meQuery.data.body.profile : null;

  function handleLeftPress() {
    if (!headerContext.visible) return;
    if (headerContext.kind === 'push') {
      closePushScreen(router);
    } else if (headerContext.kind === 'festival') {
      leaveFestival(router);
    } else {
      goToStartTab(router);
    }
  }

  const LeftIcon = headerContext.kind === 'push' ? ArrowLeft : Home;
  const leftLabel =
    headerContext.kind === 'push'
      ? t`Back`
      : headerContext.kind === 'festival'
        ? t`Leave festival`
        : t`Go to Start`;

  // Route -> title map for the push state, built fresh per render (a
  // Babel-macro `t` call must appear textually at each call site — a
  // module-level pre-resolved map would freeze the strings at import time).
  const pushScreenTitle: Record<PushScreenRoute, string> = {
    profil: t`Profile`,
    'friends-qr': t`QR code`,
    // 09-05 (D-16) — the re-exported global Friends screen at its push
    // position. Reuses the EXACT `Friends` msgid the tab bar/`profil.tsx`
    // stat row already use, not a new string.
    'friends-find': t`Friends`,
  };

  const festivalTitle =
    festivalQuery.data?.status === 200 ? festivalQuery.data.body.name : t`Festival`;

  return (
    <View
      style={[styles.wrapper, { height: insets.top + layout.topbar }]}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={BLUR_INTENSITY}
        tint={mode === 'light' ? 'light' : 'dark'}
        style={styles.blur}
      >
        <View style={[styles.contentRow, { marginTop: insets.top }]}>
          <Pressable
            style={styles.leftButtonHitArea}
            onPress={handleLeftPress}
            accessibilityRole="button"
            accessibilityLabel={leftLabel}
          >
            <View style={styles.leftButtonCircle}>
              <LeftIcon size={LEFT_ICON_SIZE} color={colors.textPrimary} strokeWidth={2} />
            </View>
          </Pressable>

          <View style={styles.centerSlot}>
            {headerContext.kind === 'global' ? (
              // The wordmark is a proper noun and is NEVER wrapped in
              // Lingui — same rule `SplashView`/the Welcome screen follow.
              <Text
                style={[styles.wordmark, { fontFamily: wordmarkFont }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                quiks
                <Text style={styles.wordmarkDot}>.</Text>
              </Text>
            ) : null}

            {headerContext.kind === 'festival' ? (
              <Text
                style={[styles.title, { fontFamily: titleFont }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {festivalTitle}
              </Text>
            ) : null}

            {headerContext.kind === 'push' ? (
              <Text
                style={[styles.title, { fontFamily: titleFont }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {pushScreenTitle[headerContext.route]}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => router.push('/profil')}
            accessibilityRole="button"
            accessibilityLabel={t`Profile`}
          >
            <AvatarTile
              displayName={profile?.displayName ?? ''}
              username={profile?.username ?? ''}
              localUri={avatarUri}
              size={AVATAR_SIZE}
            />
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

/** The clearance every screen beneath the header must add to its own top padding. */
export function useHeaderClearance(): number {
  const insets = useSafeAreaInsets();
  return insets.top + layout.topbar;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    blur: {
      flex: 1,
      backgroundColor: colors.glassFill,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      overflow: 'hidden',
    },
    contentRow: {
      height: layout.topbar,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: layout.screenPad,
      gap: spacingScale['sp-5'],
    },
    leftButtonHitArea: {
      minWidth: layout.hitMin,
      minHeight: layout.hitMin,
      alignItems: 'center',
      justifyContent: 'center',
    },
    leftButtonCircle: {
      width: LEFT_BUTTON_CIRCLE_SIZE,
      height: LEFT_BUTTON_CIRCLE_SIZE,
      borderRadius: radiiScale['r-pill'],
      backgroundColor: colors.fillQuiet,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // `flexShrink`/`minWidth: 0` — the long-text guard: a long festival name
    // or push-screen title must truncate, never push the avatar off-screen.
    centerSlot: { flex: 1, flexShrink: 1, minWidth: 0 },
    wordmark: {
      fontSize: typeRoles.headerWordmark.size,
      letterSpacing: typeRoles.headerWordmark.letterSpacing,
      lineHeight: typeRoles.headerWordmark.size * typeRoles.headerWordmark.lineHeight,
      color: colors.textPrimary,
    },
    wordmarkDot: { color: colors.primary },
    title: {
      fontSize: typeRoles.headerTitle.size,
      letterSpacing: typeRoles.headerTitle.letterSpacing,
      lineHeight: typeRoles.headerTitle.size * typeRoles.headerTitle.lineHeight,
      color: colors.textPrimary,
    },
  });
}
