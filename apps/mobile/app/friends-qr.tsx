import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';

import { useHeaderClearance } from '../components/AppHeader';
import { CameraScanPanel } from '../components/CameraScanPanel';
import { QRMark } from '../components/QRMark';
import { SegmentedControl } from '../components/SegmentedControl';
import { apiClient } from '../lib/api-client';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import { encodeQuiksCodePayload } from '../lib/qr-payload';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

/**
 * The rendered mark's pixel size. Must stay large enough that a module of a
 * 21–33-module mark (a `quiks:u/<username>` payload's realistic range) is
 * still several pixels wide on a phone display — below that, cameras start
 * missing modules and scanning gets unreliable (08-04-PLAN Task 2, action
 * (2)). At 33 modules + the 8-module quiet zone (41 total), 240px still
 * gives ~5.8px per module.
 */
const QR_MARK_SIZE = 240;

type Mode = 'mine' | 'scan';

/**
 * The "Mein Code" panel's own view state — same three-state schema every
 * other query on this screen family uses (08-01-PATTERNS "die
 * vorgeschriebene Schablone"). Backed by the SAME `['me']` query the Profil
 * and Friends screens already share — no second request for this handle.
 */
type MyCodeViewState =
  | { kind: 'loading' }
  | { kind: 'error'; variant: 'transport' | 'response'; retry: () => void }
  | { kind: 'data'; username: string | undefined };

/**
 * 08-04 / D-13 — the QR screen: one `SegmentedControl`, exactly one of two
 * panels below it. Root-level sibling of `(tabs)`, mirroring `app/profil.tsx`
 * (registered in `app/_layout.tsx`'s authenticated `Stack.Protected` block),
 * so pushing it hides `FloatingNav` with no extra visibility logic.
 *
 * Opens on "Mein Code" (D-13). The "Scannen" panel is a placeholder in this
 * plan — no camera, no user-visible text that promises anything — and is
 * filled in 08-05.
 */
export default function FriendsQrScreen() {
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerClearance = useHeaderClearance();
  const fontsReady = useFontsReady();
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const buttonFont = fontFamilyForRole('title3', fontsReady);
  const handleFont = fontFamilyForRole('countdown', fontsReady);

  const [mode, setMode] = useState<Mode>('mine');

  // The SAME query key + function the Profil and Friends screens already
  // use — one cache entry, no second `/me` request just because this screen
  // also needs the handle.
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiClient.getMe() });

  function computeMyCodeState(): MyCodeViewState {
    if (meQuery.status === 'pending') return { kind: 'loading' };
    if (meQuery.status === 'error') {
      return { kind: 'error', variant: 'transport', retry: () => void meQuery.refetch() };
    }
    // A non-200 ts-rest result is a SUCCESSFUL React Query result, never
    // `status === 'error'` — same branch every query on the Friends screen
    // family already relies on.
    if (meQuery.data.status !== 200) {
      return { kind: 'error', variant: 'response', retry: () => void meQuery.refetch() };
    }
    return { kind: 'data', username: meQuery.data.body.profile?.username };
  }

  const myCodeState = computeMyCodeState();

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={[styles.content, { paddingTop: headerClearance + layout.screenPad }]}>
        <SegmentedControl
          options={[
            { value: 'mine', label: t`My code` },
            { value: 'scan', label: t`Scan` },
          ]}
          value={mode}
          onChange={setMode}
        />

        {mode === 'mine' ? (
          <View style={styles.panel}>
            {myCodeState.kind === 'loading' ? (
              <Text style={[styles.helper, { fontFamily: bodyFont }]}>
                <Trans>Loading your quiks code…</Trans>
              </Text>
            ) : null}

            {myCodeState.kind === 'error' ? (
              <View style={styles.stateBlock}>
                <Text style={[styles.error, { fontFamily: bodySmFont }]}>
                  {myCodeState.variant === 'transport' ? (
                    <Trans>
                      Can't reach the server — make sure your device is on the same Wi-Fi as the
                      dev API.
                    </Trans>
                  ) : (
                    <Trans>Can't load your profile — check your connection and try again.</Trans>
                  )}
                </Text>
                <Pressable style={styles.retryButton} onPress={myCodeState.retry}>
                  <Text style={[styles.retryButtonText, { fontFamily: buttonFont }]}>
                    <Trans>Retry</Trans>
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* A brand-new account without a username yet — the edge-case
                copy renders instead of an empty/broken mark; no fallback
                graphic is invented (UI-SPEC § QR & Camera Contract). */}
            {myCodeState.kind === 'data' && !myCodeState.username ? (
              <Text style={[styles.helper, { fontFamily: bodyFont }]}>
                <Trans>Set your username first to show your code.</Trans>
              </Text>
            ) : null}

            {myCodeState.kind === 'data' && myCodeState.username ? (
              <View style={styles.myCodeBlock}>
                <View style={styles.markCard}>
                  <QRMark
                    payload={encodeQuiksCodePayload(myCodeState.username)}
                    size={QR_MARK_SIZE}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.handle, { fontFamily: handleFont }]}
                >
                  @{myCodeState.username}
                </Text>
                <Text style={[styles.myCodeBody, { fontFamily: bodySmFont }]}>
                  <Trans>Let the other person scan this code.</Trans>
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          // 08-05 / D-13 — the camera preview mounts ONLY while this branch
          // is on screen; switching back to "Mein Code" or leaving the
          // screen unmounts `CameraScanPanel` (conditional render, not a
          // visibility toggle), which is what tears the camera down
          // (T-08-18).
          <CameraScanPanel />
        )}
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
      paddingTop: layout.screenPad,
      gap: spacingScale['sp-8'],
    },
    panel: { alignItems: 'center', gap: spacingScale['sp-6'] },
    helper: {
      fontSize: typeRoles.body.size,
      color: colors.textSecondary,
    },
    stateBlock: { gap: spacingScale['sp-5'], alignItems: 'center' },
    // The status-hue rule: an error rendered as TEXT always resolves through
    // `dangerText`, never the bare `danger` fill.
    error: {
      fontSize: typeRoles.bodySm.size,
      color: colors.dangerText,
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
      color: colors.textOnPrimary,
    },
    myCodeBlock: { alignItems: 'center', gap: spacingScale['sp-5'] },
    // The backdrop card: FIXED `primaryForeground` white behind the mark in
    // both colour modes — see QRMark's own scannability-exception comment.
    // The generous `sp-8` padding is what keeps the mark's own quiet zone
    // from ever touching the card edge.
    markCard: {
      padding: spacingScale['sp-8'],
      backgroundColor: colors.primaryForeground,
      borderRadius: radiiScale['r-md'],
    },
    handle: {
      fontSize: typeRoles.countdown.size,
      lineHeight: typeRoles.countdown.size * typeRoles.countdown.lineHeight,
      color: colors.primary,
    },
    myCodeBody: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
}
