import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tabs, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trans } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';

import { apiClient } from '../../../../lib/api-client';
import { festivalKeys, findCachedFestivalBySlug } from '../../../../lib/festival-queries';
import { resolveFestivalGateState } from '../../../../lib/festival-gate';
import { FestivalContextProvider } from '../../../../lib/festival-context';
import {
  clearActiveFestivalSlug,
  getActiveFestivalSlug,
} from '../../../../lib/active-festival-storage';
import { fontFamilyForRole } from '../../../../lib/fonts';
import { useFontsReady } from '../../../../lib/fonts-context';
import type { ThemeColors } from '../../../../lib/theme';
import { useTheme } from '../../../../lib/theme-context';
import { FloatingNav } from '../../../../components/FloatingNav';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

function normalizeSlug(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? '').trim();
}

/**
 * D-10 tracer gate — the five-tab festival navigator's own layout. ONE
 * `getFestival(slug)` query gates the ENTIRE festival area: while it is
 * loading, erroring or 404ing, this layout renders a plain centered message
 * block instead of a `Tabs` navigator at all — no tab bar, no tab content.
 * Hoisted unchanged (state derivation, the 404-only `clearActiveFestivalSlug`
 * effect, copy and styles) from the former single-screen
 * `f/[festivalSlug].tsx` (now split into this gate plus the Dashboard tab at
 * `./index.tsx`).
 *
 * `findCachedFestivalBySlug` (moved to `lib/festival-queries.ts` in this same
 * plan) supplies the instant-paint hint the branching in
 * `resolveFestivalGateState` (`lib/festival-gate.ts`) uses.
 *
 * 09-03 device-bug fix — the resolved `Festival` is provided to every tab
 * screen via `FestivalContextProvider` (`lib/festival-context.ts`) instead
 * of each tab re-running its OWN `useQuery` against the same key: this
 * layout never unmounts across tab switches, so the context value can never
 * desync from what gated the `Tabs` navigator open in the first place (see
 * that module's doc comment for the full defect writeup).
 */
export default function FestivalTabsLayout() {
  const params = useLocalSearchParams<{ festivalSlug?: string | string[] }>();
  const festivalSlug = normalizeSlug(params.festivalSlug);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10) — the family carries the weight, so the
  // matching styles set no numeric `fontWeight`.
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const headingFont = fontFamilyForRole('title2', fontsReady);
  const buttonFont = fontFamilyForRole('title3', fontsReady);
  const queryClient = useQueryClient();

  const cachedFestival = festivalSlug
    ? findCachedFestivalBySlug(queryClient, festivalSlug)
    : undefined;

  // NO initialData/placeholderData here (REVIEW 05-03 HIGH) — the query
  // always fetches and stays the authoritative source; cachedFestival above
  // is only ever a separate paint hint while it resolves.
  const query = useQuery({
    queryKey: festivalKeys.detail(festivalSlug),
    queryFn: () => apiClient.getFestival({ params: { slug: festivalSlug } }),
    enabled: festivalSlug.length > 0,
  });

  const gateQueryState =
    query.status === 'pending'
      ? ({ status: 'pending' } as const)
      : query.status === 'error'
        ? ({ status: 'error' } as const)
        : ({ status: 'success', data: query.data } as const);

  const missingSlug = festivalSlug.length === 0;
  const { showLoading, showTransportError, showNotFound, showTabs, festival, notFound } =
    resolveFestivalGateState({ missingSlug, query: gateQueryState, cachedFestival });

  // A deleted/invalid slug must not keep re-pointing the D-06 cold-start
  // focus at a festival that no longer resolves — clear ONLY when the
  // persisted slug is the one that actually 404'd (never for a missing
  // slug, REVIEW 05-03 MEDIUM semantics, unchanged by the gate extraction).
  useEffect(() => {
    if (!notFound) return;
    if (getActiveFestivalSlug() === festivalSlug) {
      clearActiveFestivalSlug();
    }
  }, [notFound, festivalSlug]);

  if (!showTabs) {
    // D-10 / T-09-09 — this branch intentionally renders a plain block
    // instead of a `Tabs` navigator (or a `Slot`). Expo Router layouts
    // usually always render SOME navigator; here the whole festival area
    // must disappear while the festival is unresolved, not just its content,
    // so there is deliberately no tab bar and no tab screen underneath this
    // block. See 09-03-PLAN.md Flagged Assumption 1 if this ever needs
    // revisiting.
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        {showLoading ? (
          <View style={styles.centered}>
            <Text style={[styles.helper, { fontFamily: bodyFont }]}>
              <Trans>Loading festival…</Trans>
            </Text>
          </View>
        ) : null}

        {showTransportError ? (
          <View style={styles.centered}>
            <Text style={[styles.error, { fontFamily: bodySmFont }]}>
              <Trans>
                Can't reach the server — make sure your device is on the same Wi-Fi as the dev
                API.
              </Trans>
            </Text>
            <Pressable style={styles.retryButton} onPress={() => query.refetch()}>
              <Text style={[styles.retryButtonText, { fontFamily: buttonFont }]}>
                <Trans>Retry</Trans>
              </Text>
            </Pressable>
          </View>
        ) : null}

        {showNotFound ? (
          <View style={styles.centered}>
            <Text style={[styles.heading, { fontFamily: headingFont }]}>
              <Trans>Festival not found</Trans>
            </Text>
            <Text style={[styles.helper, { fontFamily: bodyFont }]}>
              <Trans>This festival may have been removed or the link is out of date.</Trans>
            </Text>
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  // DECLARATION ORDER IS THE TAB ORDER (same rule as (tabs)/_layout.tsx):
  // Dashboard · Aktivitäten · Friends · Timetable · Lageplan, per ADR-014.
  return (
    <FestivalContextProvider value={festival}>
      <Tabs
        initialRouteName="index"
        tabBar={(props) => <FloatingNav {...props} variant="festival" />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="activities" />
        <Tabs.Screen name="friends" />
        <Tabs.Screen name="timetable" />
        <Tabs.Screen name="map" />
      </Tabs>
    </FestivalContextProvider>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgApp },
    centered: {
      flex: 1,
      padding: layout.screenPad,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacingScale['sp-5'],
    },
    helper: {
      fontSize: typeRoles.body.size,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    // Same E5/error rule as the list screens: a status hue used as TEXT
    // resolves through `dangerText`, never the bare `danger` fill.
    error: {
      fontSize: typeRoles.bodySm.size,
      color: colors.dangerText,
      textAlign: 'center',
    },
    heading: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textPrimary,
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
  });
}
