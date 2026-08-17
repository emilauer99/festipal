import { useEffect, useMemo, useRef } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { Copy, Navigation, Trash2 } from 'lucide-react-native';
import { tokens } from '@quiks/ui';
import type { ActivityDetail } from '@quiks/contracts';

import { apiClient } from '../lib/api-client';
import { activityKeys, unwrapOk } from '../lib/activity-queries';
import { resolveJoinability } from '../lib/activity-form';
import { buildRouteUri, type MapHandoffPlatform } from '../lib/geo-link';
import { findCachedFestivalBySlug } from '../lib/festival-queries';
import { useFestivalContext } from '../lib/festival-context';
import { useActivityMutations } from '../lib/use-activity-mutations';
import { i18n } from '../lib/i18n';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { useHeaderClearance } from '../components/AppHeader';
import { PersonRow } from '../components/PersonRow';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

// Same dampening factor `RelationAction`/`activity-create.tsx`'s own
// `PENDING_OPACITY` already use for a pending/disabled control — not a new
// value (11-05-PLAN Task 2's own acceptance criterion: no new opacity
// number is introduced for this state).
const PENDING_OPACITY = 0.45;

// Matches `friend-detail.tsx`'s own `DANGER_ICON_SIZE` verbatim — the
// "Auflösen" row is styled after that exact analog (UI-SPEC § Component
// Inventory).
const DANGER_ICON_SIZE = 22;
// "Klonen"/"Route öffnen" action-icon size — UI-SPEC § Design System names
// 21–22 for section/action icons.
const ACTION_ICON_SIZE = 20;

function normalizeParam(raw: string | string[] | undefined): string {
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
  const router = useRouter();
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
  const buttonFont = fontFamilyForRole('title3', fontsReady);

  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    activityId?: string | string[];
    festivalSlug?: string | string[];
  }>();
  const activityId = normalizeParam(params.activityId);
  const festivalSlug = normalizeParam(params.festivalSlug);
  // Root-Stack sibling position: the (festival) layout's provider does NOT
  // wrap this screen, so the context read alone stays `undefined` here. The
  // pushing card forwards the slug and the gate's cached resolution supplies
  // the festival — warm by construction, since a card can only be tapped
  // after the gate resolved exactly this festival.
  const contextFestival = useFestivalContext();
  const festival =
    contextFestival ??
    (festivalSlug !== '' ? findCachedFestivalBySlug(queryClient, festivalSlug) : undefined);

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

  // D-11 — the Auflösen-vs-Verlassen fork reads the CALLER's own account id
  // from the auth state (same `['me']`/`apiClient.getMe()` idiom
  // `profil.tsx` already uses), never from a route param and never from the
  // participant list. This is display logic only — the server is the real
  // enforcement (409 for any non-creator, T-11-23).
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiClient.getMe() });
  const ownAccountId = meQuery.data?.status === 200 ? meQuery.data.body.accountId : undefined;
  const isCreator =
    detailQuery.status === 'success' &&
    ownAccountId !== undefined &&
    detailQuery.data.creatorId === ownAccountId;

  // The ONE place every activity-mutation is triggered from this screen
  // (`use-activity-mutations.ts`) — join/leave/dissolve all key their
  // pending/failed tracking off `activityId` as `targetId`. Kept at THIS
  // (always-mounted) level, not inside `ActivityDetailContent`, so the
  // pending->settled navigation effect below survives the cache
  // invalidation `onSettled` triggers even if it flips `detailQuery` to an
  // error state (the activity is gone) before the effect has run.
  const { joinActivity, leaveActivity, dissolveActivity, pendingTargetId, failedTargetId, failedTargetStatus } =
    useActivityMutations();

  const isDissolvePending = isCreator && pendingTargetId === activityId;
  const dissolveFailed = isCreator && failedTargetId === activityId;

  // Same pending->settled-without-failure navigation pattern
  // `friend-detail.tsx`'s `confirmUnfriend` success path uses (11-PATTERNS
  // "Destructive-action confirm pattern"): navigate ONLY on the transition
  // from pending to settled with no failure recorded — never on the tap
  // itself, never on a rejection. No confirmation toast either (same
  // restraint as unfriend).
  const wasDissolvePendingRef = useRef(false);
  useEffect(() => {
    if (wasDissolvePendingRef.current && !isDissolvePending && !dissolveFailed) {
      if (router.canGoBack()) {
        router.back();
      } else if (festival) {
        router.replace({
          pathname: '/f/[festivalSlug]/activities',
          params: { festivalSlug: festival.slug },
        });
      }
    }
    wasDissolvePendingRef.current = isDissolvePending;
  }, [isDissolvePending, dissolveFailed, router, festival]);

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
            fonts={{
              headingFont,
              subtitleFont,
              bodyFont,
              bodySmFont,
              countdownFont,
              labelFont,
              monoFont,
              buttonFont,
            }}
            isCreator={isCreator}
            joinActivity={joinActivity}
            leaveActivity={leaveActivity}
            dissolveActivity={dissolveActivity}
            pendingTargetId={pendingTargetId}
            failedTargetId={failedTargetId}
            failedTargetStatus={failedTargetStatus}
            router={router}
            festivalSlug={festival?.slug ?? ''}
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
  bodySmFont: string | undefined;
  countdownFont: string | undefined;
  labelFont: string | undefined;
  monoFont: string | undefined;
  buttonFont: string | undefined;
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
  isCreator,
  joinActivity,
  leaveActivity,
  dissolveActivity,
  pendingTargetId,
  failedTargetId,
  failedTargetStatus,
  router,
  festivalSlug,
}: {
  activity: ActivityDetail;
  startLine: string;
  styles: ReturnType<typeof createStyles>;
  fonts: Fonts;
  isCreator: boolean;
  joinActivity: (festivalId: string, activityId: string) => void;
  leaveActivity: (festivalId: string, activityId: string) => void;
  dissolveActivity: (festivalId: string, activityId: string) => void;
  pendingTargetId: string | undefined;
  failedTargetId: string | undefined;
  failedTargetStatus: number | undefined;
  router: ReturnType<typeof useRouter>;
  festivalSlug: string;
}) {
  const { t } = useLingui();
  const { colors } = useTheme();

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

  // Task 2 — the screen calls `resolveJoinability` with the activity and a
  // comparison "now" drawn exactly ONCE per render (never `new Date()`
  // inside a loop or a callback) — the same D-04 discipline this file's
  // sibling screens already document.
  const now = new Date();
  const joinability = resolveJoinability(activity, now);

  const isJoinPending = !isCreator && joinability.status !== 'alreadyJoined' && pendingTargetId === activity.id;
  const isLeavePending = !isCreator && joinability.status === 'alreadyJoined' && pendingTargetId === activity.id;
  const isDissolvePending = isCreator && pendingTargetId === activity.id;
  const targetFailed = failedTargetId === activity.id;
  // The 409 join-race fallback (D-10) applies ONLY when the currently
  // rendered action IS the Join button — the creator never sees it (they
  // see Dissolve), and an already-joined visitor sees Leave, which cannot
  // 409 for a non-creator (T-11-24's leave 409 branch is creator-only, and
  // the creator is excluded from this branch by construction).
  const isJoinRace =
    targetFailed && failedTargetStatus === 409 && !isCreator && joinability.status !== 'alreadyJoined';

  let joinLabel: string;
  let joinDisabled: boolean;
  if (joinability.status === 'full') {
    const fullJoined = joinability.joined;
    const fullCapacity = joinability.capacity;
    joinLabel = t`Full — ${fullJoined}/${fullCapacity} spots`;
    joinDisabled = true;
  } else if (joinability.status === 'started') {
    joinLabel = t`Already started`;
    joinDisabled = true;
  } else {
    joinLabel = t`Join`;
    joinDisabled = false;
  }

  // D-11 — native destructive confirm, exact `friend-detail.tsx`
  // `confirmUnfriend` shape (11-PATTERNS "Destructive-action confirm
  // pattern"): title + beziffertem Fließtext + Abbrechen (wiederverwendete
  // msgid) + destruktives Bestätigen.
  function confirmDissolve() {
    Alert.alert(
      t`Dissolve this activity?`,
      t`All ${participantCount} participants will be removed too. This can't be undone.`,
      [
        { text: t`Cancel`, style: 'cancel' },
        {
          text: t`Dissolve`,
          style: 'destructive',
          onPress: () => dissolveActivity(activity.festivalId, activity.id),
        },
      ],
    );
  }

  // ACT-04/D-12 — Klonen ist keine Serveroperation: stapelnde Navigation auf
  // die Create-Route, die einzig die Kennung der Quellaktivität übergibt.
  // Stapelnd (push), nicht ersetzend, damit der Zurück-Weg auf diesem
  // Detail-Screen landet. Die eigentliche Vorbefüllung erledigt der
  // Create-Screen über `buildClonePrefill` (11-04) — diese Datei baut kein
  // Vorbefüll-Objekt selbst.
  function handleClone() {
    router.push({
      pathname: '/activity-create',
      params: { cloneFromId: activity.id, festivalSlug },
    });
  }

  // ACT-05/D-14/T-11-01 — die Zieladresse kommt AUSSCHLIESSLICH aus
  // `buildRouteUri`, direkt mit dem Aktivitäts-Geo-Objekt gefüttert; kein
  // Zwischenobjekt aus separat gelesenen Zahlenwerten, kein Freitext, kein
  // Navigationsparameter kann je in diese Adresse gelangen (die Signatur von
  // `buildRouteUri` lässt es konstruktionsbedingt nicht zu).
  function handleOpenRoute() {
    if (!activity.geo) return;
    const platform: MapHandoffPlatform = Platform.OS === 'ios' ? 'ios' : 'android';
    void Linking.openURL(buildRouteUri(activity.geo, platform));
  }

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

      {/* ACT-05 partial states (UI-SPEC E3): geo present -> free text (if
          any) plus Route öffnen; geo absent but location present -> free
          text only, no route affordance; both absent -> the block renders
          nothing rather than claiming a location that isn't there. */}
      {activity.location || activity.geo ? (
        <View style={styles.meetingPointBlock}>
          <Text style={[styles.eyebrow, { fontFamily: fonts.labelFont }]}>
            <Trans>Meeting point</Trans>
          </Text>
          {activity.location ? (
            <Text style={[styles.locationText, { fontFamily: fonts.bodyFont }]}>
              {activity.location}
            </Text>
          ) : null}
          {activity.geo ? (
            <Pressable
              style={styles.routeButton}
              onPress={handleOpenRoute}
              accessibilityRole="button"
              accessibilityLabel={t`Open route`}
            >
              <Navigation size={ACTION_ICON_SIZE} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.routeButtonText, { fontFamily: fonts.buttonFont }]}>
                <Trans>Open route</Trans>
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Text style={[styles.seatLine, { fontFamily: fonts.monoFont }]}>{seatLine}</Text>

      {/* UI-SPEC E3 zero-one-many / Copywriting Contract "No participants
          yet" row — the list contains exactly the creator (creator always
          joins in the SAME transaction the activity is created in, D-07)
          renders "Nobody else yet." IN PLACE OF the list, per the plan's own
          "stands instead of an empty list" wording. Two-or-more renders every
          row in ARRAY order (`joinedAt` ascending per the contract), which
          puts the creator first by construction — no `.sort()` call, no
          second sort key, no creator badge anywhere in this file. */}
      {activity.participants.length <= 1 ? (
        <Text style={[styles.emptyParticipants, { fontFamily: fonts.bodySmFont }]}>
          <Trans>Nobody else yet.</Trans>
        </Text>
      ) : (
        <View style={styles.participantList}>
          {activity.participants.map((participant) => {
            const { displayName, username } = participant.profile;
            return (
              <PersonRow
                key={participant.profile.accountId}
                profile={participant.profile}
                accessibilityLabel={t`${displayName}, @${username}`}
              />
            );
          })}
        </View>
      )}

      <View style={styles.actionsBlock}>
        {isCreator ? (
          <Pressable
            style={[styles.dangerRow, isDissolvePending ? styles.actionButtonDisabled : null]}
            onPress={confirmDissolve}
            disabled={isDissolvePending}
            accessibilityRole="button"
            accessibilityLabel={t`Dissolve`}
            accessibilityState={{ disabled: isDissolvePending }}
          >
            <Trash2 size={DANGER_ICON_SIZE} color={colors.dangerText} strokeWidth={2} />
            <Text style={[styles.dangerLabel, { fontFamily: fonts.buttonFont }]}>
              <Trans>Dissolve</Trans>
            </Text>
          </Pressable>
        ) : joinability.status === 'alreadyJoined' ? (
          <Pressable
            style={[styles.leaveButton, isLeavePending ? styles.actionButtonDisabled : null]}
            onPress={() => leaveActivity(activity.festivalId, activity.id)}
            disabled={isLeavePending}
            accessibilityRole="button"
          >
            <Text style={[styles.leaveButtonText, { fontFamily: fonts.buttonFont }]}>
              <Trans>Leave</Trans>
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[
              styles.joinButton,
              joinDisabled || isJoinPending ? styles.actionButtonDisabled : null,
            ]}
            onPress={() => joinActivity(activity.festivalId, activity.id)}
            disabled={joinDisabled || isJoinPending}
            accessibilityRole="button"
            accessibilityState={{ disabled: joinDisabled }}
          >
            <Text style={[styles.joinButtonText, { fontFamily: fonts.buttonFont }]}>
              {joinLabel}
            </Text>
          </Pressable>
        )}

        {/* ACT-04/D-12 — Klonen ist an JEDER sichtbaren Aktivität vorhanden,
            unbedingt auf die Ersteller- oder Teilnehmer-Eigenschaft (auch
            eine fremde Aktivität ist eine Vorlage). Sekundäre Gestaltung,
            nicht in der Markenfarbe (UI-SPEC § Color "Never accent"). */}
        <Pressable
          style={styles.cloneButton}
          onPress={handleClone}
          accessibilityRole="button"
          accessibilityLabel={t`Clone`}
        >
          <Copy size={ACTION_ICON_SIZE} color={colors.textSecondary} strokeWidth={2} />
          <Text style={[styles.cloneButtonText, { fontFamily: fonts.buttonFont }]}>
            <Trans>Clone</Trans>
          </Text>
        </Pressable>

        {targetFailed ? (
          <Text style={[styles.error, { fontFamily: fonts.bodySmFont }]}>
            {isJoinRace ? (
              <Trans>The last spot just went — the list has been refreshed.</Trans>
            ) : (
              <Trans>Couldn't save — try again.</Trans>
            )}
          </Text>
        ) : null}
      </View>
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
    meetingPointBlock: { gap: spacingScale['sp-4'] },
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
    // UI-SPEC § Color item 4 — secondary-accent (fillBrandQuiet/borderBrand/
    // primary), deliberately NOT a second solid-primary pill next to
    // Beitreten/Verlassen.
    routeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacingScale['sp-3'],
      minHeight: layout.hitMin,
      paddingHorizontal: spacingScale['sp-6'],
      backgroundColor: colors.fillBrandQuiet,
      borderRadius: radiiScale['r-pill'],
      borderWidth: 1,
      borderColor: colors.borderBrand,
    },
    routeButtonText: {
      fontSize: typeRoles.title3.size,
      color: colors.primary,
    },
    seatLine: {
      fontSize: typeRoles.mono.size,
      lineHeight: typeRoles.mono.size * typeRoles.mono.lineHeight,
      color: colors.textPrimary,
    },
    participantList: { gap: spacingScale['sp-4'] },
    emptyParticipants: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
    actionsBlock: { gap: spacingScale['sp-4'] },
    // UI-SPEC § Color item 1 — the ONE solid-primary pill "Beitreten" shares
    // with "Aktivität starten"/"Los, posten".
    joinButton: {
      minHeight: layout.hitMin,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: radiiScale['r-pill'],
    },
    joinButtonText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
    // Shared dampening for all three actions while their own mutation is in
    // flight, and for Join's genuinely-disabled full/started state — reuses
    // `PENDING_OPACITY`, no second opacity value.
    actionButtonDisabled: { opacity: PENDING_OPACITY },
    // "Verlassen" — never accent (UI-SPEC § Color "Never accent"): same
    // title3 size/pill shape as Join, distinguished by fill/text only.
    leaveButton: {
      minHeight: layout.hitMin,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillQuiet,
      borderRadius: radiiScale['r-pill'],
    },
    leaveButtonText: {
      fontSize: typeRoles.title3.size,
      color: colors.textPrimary,
    },
    // Exact `friend-detail.tsx` `dangerRow`/`dangerLabel` shape (11-PATTERNS
    // "Danger-row styling") — no fill, no border, just the centered
    // icon+label row in `dangerText`.
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
    // "Klonen" — never accent (UI-SPEC § Color "Never accent"), same neutral
    // fill "Verlassen" uses.
    cloneButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacingScale['sp-3'],
      minHeight: layout.hitMin,
      backgroundColor: colors.fillQuiet,
      borderRadius: radiiScale['r-pill'],
    },
    cloneButtonText: {
      fontSize: typeRoles.title3.size,
      color: colors.textPrimary,
    },
  });
}
