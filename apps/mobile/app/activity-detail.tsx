import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';
import type { ActivityDetail } from '@quiks/contracts';

import { apiClient } from '../lib/api-client';
import { activityKeys, unwrapOk } from '../lib/activity-queries';
import { useFestivalContext } from '../lib/festival-context';
import { i18n } from '../lib/i18n';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { useHeaderClearance } from '../components/AppHeader';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, spacingScale } = tokens;

function normalizeActivityId(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? '').trim();
}

/**
 * ONE `Intl.DateTimeFormat` instance, `.format()` only (never
 * `.formatRange`) — the same discipline `ActivityCard.tsx`'s
 * `formatStartMeta` and `lib/date-range.ts` both document.
 */
function formatStartLine(startTime: string, locale: string): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  return formatter.format(new Date(startTime));
}

/**
 * The Activity detail read screen (11-01 Task 3, UI-SPEC § Screens &
 * Navigation Contract) — the tracer's final link: list card tap ->
 * REGISTERED push screen -> real detail fetch -> rendered content -> back to
 * the tab. Root-level Stack sibling of `(tabs)`, chrome exactly like
 * `cashless.tsx` (`SafeAreaView edges={['bottom']}` + `useHeaderClearance()`,
 * no own `Stack.Screen` header override) — NOT `friend-detail.tsx`'s modal
 * shape, which this phase deliberately does not reuse for either new screen.
 *
 * Unlike `friend-detail.tsx` (no foreign-profile detail endpoint exists,
 * Phase-7 D-04), Activities DOES have a real `getActivity` endpoint — this
 * screen runs a genuine `useQuery` against `activityKeys.detail(...)`, never
 * a list-cache scavenge.
 *
 * Read path ONLY this task: no participant list, no join/leave/dissolve/
 * clone/route action (all 11-05). The meeting-point block stays plain
 * free-text location — the `geo`/"Route öffnen" affordance is also 11-05.
 */
export default function ActivityDetailScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerClearance = useHeaderClearance();
  const fontsReady = useFontsReady();
  const headingFont = fontFamilyForRole('title2', fontsReady);
  const subtitleFont = fontFamilyForRole('bodyStrong', fontsReady);
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const countdownFont = fontFamilyForRole('countdown', fontsReady);
  const labelFont = fontFamilyForRole('label', fontsReady);
  const monoFont = fontFamilyForRole('mono', fontsReady);

  const festival = useFestivalContext();
  const params = useLocalSearchParams<{ activityId?: string | string[] }>();
  const activityId = normalizeActivityId(params.activityId);

  const detailQuery = useQuery({
    queryKey: activityKeys.detail(festival?.id ?? '', activityId),
    queryFn: async () =>
      unwrapOk<ActivityDetail>(
        await apiClient.getActivity({
          params: { festivalId: festival?.id ?? '', activityId },
        }),
      ),
    enabled: festival !== undefined && activityId !== '',
  });

  const startLine =
    detailQuery.status === 'success' ? formatStartLine(detailQuery.data.startTime, i18n.locale) : '';

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerClearance + layout.screenPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {detailQuery.status === 'pending' ? (
          <Text style={[styles.helper, { fontFamily: bodyFont }]}>
            <Trans>Loading…</Trans>
          </Text>
        ) : null}

        {detailQuery.status === 'error' ? (
          <Text style={[styles.error, { fontFamily: bodySmFont }]}>
            <Trans>
              Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.
            </Trans>
          </Text>
        ) : null}

        {detailQuery.status === 'success' ? (
          <ActivityDetailContent
            activity={detailQuery.data}
            startLine={startLine}
            styles={styles}
            fonts={{ headingFont, subtitleFont, bodyFont, countdownFont, labelFont, monoFont }}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type Fonts = {
  headingFont: string | undefined;
  subtitleFont: string | undefined;
  bodyFont: string | undefined;
  countdownFont: string | undefined;
  labelFont: string | undefined;
  monoFont: string | undefined;
};

/**
 * The populated content block, split out only so `ActivityDetailScreen`
 * stays a thin fetch/state shell — not a second screen, not exported. Every
 * optional field (`subtitle`, `description`, `location`) is rendered via
 * `condition ? <Text>…</Text> : null`, the same "absent field renders
 * nothing" idiom `friend-detail.tsx`'s `identityLine` uses — no dash, no
 * placeholder text.
 */
function ActivityDetailContent({
  activity,
  startLine,
  styles,
  fonts,
}: {
  activity: ActivityDetail;
  startLine: string;
  styles: ReturnType<typeof createStyles>;
  fonts: Fonts;
}) {
  const { t } = useLingui();

  // D-03/Copywriting Contract — the seat line is the ONE prominent `mono`
  // figure on this screen; the two variants (limited/unlimited) are exact
  // catalog strings, not an ICU plural (the count itself is not the pivot,
  // the PRESENCE of a capacity is). Named local variables (rather than the
  // member expressions directly) so the macro derives named, not positional,
  // ICU placeholders.
  const participantCount = activity.participantCount;
  const capacity = activity.capacity;
  const seatLine =
    capacity === null
      ? t`${participantCount} are in · no limit`
      : t`${participantCount}/${capacity} spots filled`;

  return (
    <View style={styles.contentBlock}>
      <Text style={[styles.heading, { fontFamily: fonts.headingFont }]}>{activity.title}</Text>

      {activity.subtitle ? (
        <Text style={[styles.subtitle, { fontFamily: fonts.subtitleFont }]}>
          {activity.subtitle}
        </Text>
      ) : null}

      {activity.description ? (
        <Text style={[styles.description, { fontFamily: fonts.bodyFont }]}>
          {activity.description}
        </Text>
      ) : null}

      <Text style={[styles.startLine, { fontFamily: fonts.countdownFont }]}>{startLine}</Text>

      {activity.location ? (
        <View style={styles.meetingPointBlock}>
          <Text style={[styles.eyebrow, { fontFamily: fonts.labelFont }]}>
            <Trans>Meeting point</Trans>
          </Text>
          <Text style={[styles.locationText, { fontFamily: fonts.bodyFont }]}>
            {activity.location}
          </Text>
        </View>
      ) : null}

      <Text style={[styles.seatLine, { fontFamily: fonts.monoFont }]}>{seatLine}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgApp },
    content: {
      paddingHorizontal: layout.screenPad,
      paddingBottom: layout.scrollBottomPad,
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
    contentBlock: { gap: spacingScale['sp-5'] },
    // Free-wrapping content heading (UGC title) — NOT truncated, unlike its
    // `numberOfLines={1}` treatment on `ActivityCard`.
    heading: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: typeRoles.bodyStrong.size,
      lineHeight: typeRoles.bodyStrong.size * typeRoles.bodyStrong.lineHeight,
      color: colors.textSecondary,
    },
    description: {
      fontSize: typeRoles.body.size,
      lineHeight: typeRoles.body.size * typeRoles.body.lineHeight,
      color: colors.textPrimary,
    },
    startLine: {
      fontSize: typeRoles.countdown.size,
      lineHeight: typeRoles.countdown.size * typeRoles.countdown.lineHeight,
      color: colors.textSecondary,
    },
    meetingPointBlock: { gap: spacingScale['sp-2'] },
    eyebrow: {
      fontSize: typeRoles.label.size,
      lineHeight: typeRoles.label.size * typeRoles.label.lineHeight,
      color: colors.textMuted,
    },
    locationText: {
      fontSize: typeRoles.body.size,
      lineHeight: typeRoles.body.size * typeRoles.body.lineHeight,
      color: colors.textPrimary,
    },
    seatLine: {
      fontSize: typeRoles.mono.size,
      lineHeight: typeRoles.mono.size * typeRoles.mono.lineHeight,
      color: colors.textPrimary,
    },
  });
}
