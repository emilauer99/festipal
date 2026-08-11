import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';
import type { Me } from '@quiks/contracts';

import { apiClient } from '../lib/api-client';
import { getLocalAvatarUri } from '../lib/avatar-storage';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { AvatarTile } from '../components/AvatarTile';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

type ProfileViewState =
  | { kind: 'loading' }
  | { kind: 'error'; variant: 'transport' | 'response'; retry: () => void }
  | { kind: 'data'; me: Me };

/**
 * PROF-01 / D-02 — the view-only profile screen (design `11 Profil`).
 *
 * ROUTE SHAPE (D-01, Pitfall 1): this file lives at the ROOT of `app/`, OUTSIDE
 * `(tabs)`, mirroring the `(festival)` precedent for a full-screen destination.
 * Being a sibling of the `(tabs)` group rather than a route inside the `Tabs`
 * navigator is what makes the FloatingNav disappear when it is pushed — no
 * per-screen visibility logic exists or is needed. It is registered explicitly
 * inside `app/_layout.tsx`'s authenticated `Stack.Protected` block (T-06-01);
 * without that line this screen is unreachable, not merely unstyled.
 *
 * VIEW-ONLY (PROF-01): there is no input, no mutation and no writing path from
 * here — editing is PROF-02. `GET /me` is the ONLY data source; it carries no
 * account id of its own (T-06-02 — identity comes from the session cookie
 * alone, ADR-014/016).
 *
 * This is the TRACER slice (06-01): avatar, display name, handle and the Konto
 * email. The Sunset ring, the identity/meta lines and the dampened outlook
 * blocks (quiks-code card, Socials, Vibe, Stat tiles) are ADDITIVE and land in
 * plan 06-07 without changing this screen's architecture.
 */
export default function ProfilScreen() {
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10): the family IS the weight, so no style
  // below sets a numeric `fontWeight` on top of a real weight file.
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const nameFont = fontFamilyForRole('title2', fontsReady);
  const handleFont = fontFamilyForRole('countdown', fontsReady);
  const eyebrowFont = fontFamilyForRole('micro', fontsReady);
  const rowLabelFont = fontFamilyForRole('bodyStrong', fontsReady);
  const buttonFont = fontFamilyForRole('title3', fontsReady);

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiClient.getMe() });

  // D-05 — the avatar stays DEVICE-LOCAL: the URI comes from the MMKV store
  // keyed by accountId (Phase 4), never from the server, and the screen says
  // nothing about upload or backup. No photo (or a fresh install) simply falls
  // back to AvatarTile's initials.
  const accountId = meQuery.data?.status === 200 ? meQuery.data.body.accountId : undefined;
  const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!accountId) return;
    setAvatarUri(getLocalAvatarUri(accountId));
  }, [accountId]);

  function computeState(): ProfileViewState {
    if (meQuery.status === 'pending') return { kind: 'loading' };
    if (meQuery.status === 'error') {
      return { kind: 'error', variant: 'transport', retry: () => void meQuery.refetch() };
    }
    // A non-200 ts-rest result is a SUCCESSFUL React Query result, never
    // `status === 'error'` — it must be branched explicitly or the screen would
    // render an empty profile on a real API failure.
    if (meQuery.data.status !== 200) {
      return { kind: 'error', variant: 'response', retry: () => void meQuery.refetch() };
    }
    return { kind: 'data', me: meQuery.data.body };
  }

  const viewState = computeState();
  // `profile` is nullable in the contract (a brand-new OTP account has none).
  // This screen sits behind the 'authenticated' guard, which already requires a
  // profile — the identity header is still omitted rather than faked if it is
  // ever absent, matching the omit-if-empty precedent used app-wide.
  const profile = viewState.kind === 'data' ? viewState.me.profile : null;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: true, title: t`Profile` }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* UI-SPEC #10 — the project-wide plain "Loading…" text pattern, and
            UI-SPEC #16: ONE /me query means ONE screen-wide loading surface,
            never a spinner per row. */}
        {viewState.kind === 'loading' ? (
          <Text style={[styles.helper, { fontFamily: bodyFont }]}>
            <Trans>Loading profile…</Trans>
          </Text>
        ) : null}

        {/* UI-SPEC #11/#17 — the existing, word-for-word transport-error copy
            plus one screen-wide Retry; individual rows are not retryable. */}
        {viewState.kind === 'error' ? (
          <View style={styles.stateBlock}>
            <Text style={[styles.error, { fontFamily: bodySmFont }]}>
              {viewState.variant === 'transport' ? (
                <Trans>
                  Can't reach the server — make sure your device is on the same Wi-Fi as the dev
                  API.
                </Trans>
              ) : (
                <Trans>Can't load your profile — check your connection and try again.</Trans>
              )}
            </Text>
            <Pressable style={styles.button} onPress={viewState.retry}>
              <Text style={[styles.buttonText, { fontFamily: buttonFont }]}>
                <Trans>Retry</Trans>
              </Text>
            </Pressable>
          </View>
        ) : null}

        {viewState.kind === 'data' ? (
          <>
            {profile ? (
              <View style={styles.header}>
                <AvatarTile
                  displayName={profile.displayName}
                  username={profile.username}
                  localUri={avatarUri}
                />
                <View style={styles.identity}>
                  {/* ADR-012/020 — displayName and @handle are user-generated
                      content and are NEVER translated. UI-SPEC #14: both are
                      single-line, tail-truncated, app-wide. */}
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.displayName, { fontFamily: nameFont }]}
                  >
                    {profile.displayName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.handle, { fontFamily: handleFont }]}
                  >
                    @{profile.username}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={[styles.eyebrow, { fontFamily: eyebrowFont }]}>
                <Trans>Account</Trans>
              </Text>

              <View style={styles.rowGroup}>
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { fontFamily: rowLabelFont }]}>
                    <Trans>Email</Trans>
                  </Text>
                  {/* UI-SPEC #22 — the value flex-shrinks and truncates; the
                      label keeps layout priority. */}
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.rowValue, { fontFamily: bodySmFont }]}
                  >
                    {viewState.me.email}
                  </Text>
                </View>
              </View>
            </View>
          </>
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
      paddingTop: layout.screenPad,
      // No scrollBottomPad here: this screen is pushed OUTSIDE `(tabs)`, so the
      // floating nav is not on screen and nothing needs clearing.
      paddingBottom: layout.sectionGap,
      gap: layout.sectionGap,
    },
    stateBlock: { gap: spacingScale['sp-5'], alignItems: 'flex-start' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-6'],
    },
    identity: { flex: 1, minWidth: 0, gap: spacingScale['sp-1'] },
    displayName: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textPrimary,
    },
    // UI-SPEC ## Color, accent item 4 — the handle is the brand-text precedent
    // already shipped in home.tsx's `seeAll`, in the existing mono role.
    handle: {
      fontSize: typeRoles.countdown.size,
      lineHeight: typeRoles.countdown.size * typeRoles.countdown.lineHeight,
      color: colors.primary,
    },
    section: { gap: spacingScale['sp-5'] },
    eyebrow: {
      fontSize: typeRoles.micro.size,
      lineHeight: typeRoles.micro.size * typeRoles.micro.lineHeight,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: typeRoles.micro.size * 0.09,
    },
    rowGroup: { gap: spacingScale['sp-4'] },
    row: {
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-4'],
      paddingHorizontal: spacingScale['sp-6'],
      paddingVertical: spacingScale['sp-5'],
      backgroundColor: colors.surfaceCard,
      borderRadius: radiiScale['r-md'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    rowLabel: {
      fontSize: typeRoles.bodyStrong.size,
      color: colors.textPrimary,
    },
    rowValue: {
      flex: 1,
      textAlign: 'right',
      fontSize: typeRoles.bodySm.size,
      color: colors.textMuted,
    },
    helper: {
      fontSize: typeRoles.body.size,
      color: colors.textSecondary,
    },
    // The status-hue rule: an error rendered as TEXT always resolves through
    // `dangerText`, never the bare `danger` fill (2.98:1 on Papier).
    error: {
      color: colors.dangerText,
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
      color: colors.textOnPrimary,
    },
  });
}
