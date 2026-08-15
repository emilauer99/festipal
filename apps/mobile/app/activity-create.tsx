import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';
import type { Activity, ActivityDetail, ActivityGeo, ActivityTag } from '@quiks/contracts';

import { apiClient } from '../lib/api-client';
import { activityKeys, unwrapOk } from '../lib/activity-queries';
import { buildClonePrefill, canSubmitActivity } from '../lib/activity-form';
import { findCachedFestivalBySlug } from '../lib/festival-queries';
import { useFestivalContext } from '../lib/festival-context';
import { CREATE_ACTIVITY_TARGET_ID, useActivityMutations } from '../lib/use-activity-mutations';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { useHeaderClearance } from '../components/AppHeader';
import { KeyboardScreen } from '../components/KeyboardScreen';
import { Input } from '../components/Input';
import { Chip } from '../components/Chip';
import { CapacityField } from '../components/CapacityField';
import { DayTimeField } from '../components/DayTimeField';
import { LocationCaptureBlock } from '../components/LocationCaptureBlock';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

// Same dampening factor `RelationAction`/`useFriendMutations` call sites
// already use for a pending control — not a new value.
const PENDING_OPACITY = 0.45;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function normalizeParam(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Combines `DayTimeField`'s own local Y/M/D day value with the picked
 * time-of-day into one ISO-8601 instant for the contract's `startTime`
 * (`createActivityBodySchema`, `z.string().datetime()`). Local component
 * construction only (never string concatenation, never `new Date(dayStr)`)
 * — the same house rule `lib/date-range.ts` documents at length.
 */
function buildStartTimeIso(day: string, time: Date): string {
  const match = DATE_ONLY_PATTERN.exec(day);
  if (!match) {
    // `day` only ever arrives here as a value `DayTimeField`'s own
    // `buildDayOptions` produced (a rendered day chip's own value) — a
    // malformed value reaching this point is a bug elsewhere, not a
    // recoverable input, so this fails loudly rather than silently.
    throw new Error('buildStartTimeIso: malformed day value');
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const dayOfMonth = Number(match[3]);
  const combined = new Date(year, month - 1, dayOfMonth, time.getHours(), time.getMinutes(), 0, 0);
  return combined.toISOString();
}

/**
 * The Create-/Klon-Screen (11-04-PLAN Task 3) — the surface where ACT-01
 * becomes user-observable. Root-level Stack sibling of `(tabs)`, chrome
 * exactly like `cashless.tsx`/`activity-detail.tsx`: `KeyboardScreen` as the
 * house scaffold for input screens, `useHeaderClearance()` folded into its
 * own top padding, no own `Stack.Screen` header override (09-07 — the
 * navigator's `screenOptions` default plus `AppHeader`'s push state already
 * cover it).
 *
 * Composes the four 11-03 primitives (`Input`/`Chip`/`CapacityField`/
 * `DayTimeField`) plus Task 2's `LocationCaptureBlock`, around the three
 * pure rules from `lib/activity-form.ts` and Task 1's shared
 * `useActivityMutations` — this file owns no re-derivation of the
 * tag-or-title rule and no second mutation definition.
 */
export default function ActivityCreateScreen() {
  const router = useRouter();
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerClearance = useHeaderClearance();
  const fontsReady = useFontsReady();
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const buttonFont = fontFamilyForRole('title3', fontsReady);

  // Root-Stack sibling position (same as `activity-detail.tsx`): the
  // (festival) layout's provider does not wrap this screen, so the context
  // read alone stays `undefined` here. The pushing sites forward the slug
  // and the gate's cached resolution supplies the festival — the screen
  // still never runs its own `festivalKeys.detail` query.
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    cloneFromId?: string | string[];
    festivalSlug?: string | string[];
  }>();
  const cloneFromId = normalizeParam(params.cloneFromId);
  const festivalSlug = normalizeParam(params.festivalSlug);
  const contextFestival = useFestivalContext();
  const festival =
    contextFestival ??
    (festivalSlug ? findCachedFestivalBySlug(queryClient, festivalSlug) : undefined);

  // D-12/D-15 — read ONCE, at mount, from the query cache
  // (`activityKeys.detail`, the exact key `activity-detail.tsx`'s own
  // `getActivity` query populates). A cold-process cache miss (the detail
  // screen was never visited this process) silently resolves to `null` and
  // the form opens empty rather than breaking — never a crashing screen.
  const [clonePrefill] = useState(() => {
    if (!festival || !cloneFromId) return null;
    const cached = queryClient.getQueryData<ActivityDetail>(
      activityKeys.detail(festival.id, cloneFromId),
    );
    return cached ? buildClonePrefill(cached) : null;
  });

  const [selectedTag, setSelectedTag] = useState<ActivityTag | null>(clonePrefill?.tag ?? null);
  const [title, setTitle] = useState(clonePrefill?.title ?? '');
  const [subtitle, setSubtitle] = useState(clonePrefill?.subtitle ?? '');
  const [description, setDescription] = useState(clonePrefill?.description ?? '');
  const [locationText, setLocationText] = useState(clonePrefill?.location ?? '');
  const [geo, setGeo] = useState<ActivityGeo | null>(null);
  const [capacity, setCapacity] = useState<number | null>(clonePrefill?.capacity ?? null);
  // D-15 — deliberately NEVER prefilled, even in clone mode: "Zeit geleert"
  // is the intended signal, not carried over from the source.
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  // Validation surfaces at submit-TAP time, never on blur (UI-SPEC E4) — this
  // flips true on the first submit attempt and stays true, so a subsequent
  // edit that fixes a field clears its own error on the very next render.
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const tagsQuery = useQuery({
    queryKey: activityKeys.tags(festival?.id ?? ''),
    queryFn: async () =>
      unwrapOk<ActivityTag[]>(
        await apiClient.listActivityTags({ params: { festivalId: festival?.id ?? '' } }),
      ),
    enabled: festival !== undefined,
  });

  const { createActivity, pendingTargetId, failedTargetId } = useActivityMutations({
    onSuccess: (result, targetId) => {
      if (targetId !== CREATE_ACTIVITY_TARGET_ID) return;
      const created = result as Activity;
      // UI-SPEC § Screens & Navigation Contract — REPLACE, not push: back
      // from the fresh detail screen returns to the tab, never to the
      // now-empty form (also closes the ACT-01 idempotency must_have: a
      // double-tap on the submit button can never re-open this screen).
      // The slug MUST ride along (CR-01): the detail screen is a root-Stack
      // sibling too, and without it its festival resolution — and with it
      // the whole detail query — never enables.
      router.replace({
        pathname: '/activity-detail',
        params: { activityId: created.id, festivalSlug: festival?.slug ?? '' },
      });
    },
  });

  const isSubmitting = pendingTargetId === CREATE_ACTIVITY_TARGET_ID;
  const hasFailed = failedTargetId === CREATE_ACTIVITY_TARGET_ID;

  const submitResult = canSubmitActivity({
    tagId: selectedTag?.id ?? null,
    title,
    selectedDay,
    selectedTime,
  });
  const reasons = submitResult.canSubmit ? null : submitResult.reasons;
  const showErrors = attemptedSubmit && reasons !== null;

  // D-05 — named local variable before the `t` macro call, so Lingui derives
  // a readable named ICU placeholder instead of a positional one (the exact
  // lesson 11-01's Deviations section documents).
  const tagLabel = selectedTag?.title ?? '';
  const titlePlaceholder = selectedTag
    ? t`${tagLabel} (used as the title automatically)`
    : t`e.g. beer pong by the pavilion`;

  function handleSubmit() {
    setAttemptedSubmit(true);
    const result = canSubmitActivity({
      tagId: selectedTag?.id ?? null,
      title,
      selectedDay,
      selectedTime,
    });
    if (!result.canSubmit) return;
    // Defensive — `result.canSubmit` already guarantees `festival`/
    // `selectedDay`/`selectedTime` are non-null by construction (`festival`
    // is required for the mutation call itself, day/time are two of
    // `canSubmitActivity`'s own reasons); this is unreachable, not a second
    // validation path.
    if (!festival || selectedDay === null || selectedTime === null) return;

    const trimmedTitle = title.trim();
    const trimmedSubtitle = subtitle.trim();
    const trimmedDescription = description.trim();
    const trimmedLocation = locationText.trim();

    // Ab dem ersten Tap deaktiviert `isSubmitting` den Absenden-Knopf
    // (ACT-01 idempotency) — kein Doppel-Tap kann eine zweite Mutation
    // auslösen, solange diese eine noch läuft.
    createActivity(festival.id, {
      tagId: selectedTag?.id ?? null,
      title: trimmedTitle.length > 0 ? trimmedTitle : null,
      subtitle: trimmedSubtitle.length > 0 ? trimmedSubtitle : null,
      description: trimmedDescription.length > 0 ? trimmedDescription : null,
      location: trimmedLocation.length > 0 ? trimmedLocation : null,
      geo,
      startTime: buildStartTimeIso(selectedDay, selectedTime),
      capacity,
    });
  }

  return (
    <KeyboardScreen contentContainerStyle={{ paddingTop: headerClearance + layout.screenPad }}>
      <View style={styles.form}>
        <Input
          label={t`What's the plan?`}
          value={title}
          onChangeText={setTitle}
          placeholder={titlePlaceholder}
          errorText={
            showErrors && reasons?.titleOrTag ? t`Enter a title or choose a tag.` : undefined
          }
        />

        {tagsQuery.status === 'pending' ? (
          <Text style={[styles.helper, { fontFamily: bodyFont }]}>
            <Trans>Loading…</Trans>
          </Text>
        ) : null}
        {/* A failed or empty tags fetch never blocks the form (UI-SPEC E8) —
            the row is simply absent and the title-required path applies,
            with no invented "no tags" copy. */}
        {tagsQuery.status === 'success' && tagsQuery.data.length > 0 ? (
          <View style={styles.chipRow}>
            {tagsQuery.data.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.title}
                selected={selectedTag?.id === tag.id}
                onPress={() =>
                  setSelectedTag((current) => (current?.id === tag.id ? null : tag))
                }
              />
            ))}
          </View>
        ) : null}

        {selectedTag ? (
          <Input label={t`Subtitle · optional`} value={subtitle} onChangeText={setSubtitle} />
        ) : null}

        <Input
          label={t`Description · optional`}
          value={description}
          onChangeText={setDescription}
          placeholder={t`Briefly, what to expect`}
          multiline
        />

        <LocationCaptureBlock
          locationText={locationText}
          onLocationTextChange={setLocationText}
          geo={geo}
          onGeoChange={setGeo}
        />

        <DayTimeField
          startDate={festival?.startDate ?? null}
          endDate={festival?.endDate ?? null}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          selectedTime={selectedTime}
          onSelectTime={setSelectedTime}
          dayErrorText={showErrors && reasons?.day ? t`Choose a day.` : undefined}
          timeErrorText={showErrors && reasons?.time ? t`Choose a time.` : undefined}
        />

        <CapacityField value={capacity} onChange={setCapacity} />

        <Pressable
          style={[styles.submitButton, isSubmitting ? styles.submitButtonPending : null]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
        >
          <Text style={[styles.submitButtonText, { fontFamily: buttonFont }]}>
            <Trans>Post it</Trans>
          </Text>
        </Pressable>

        {hasFailed ? (
          <Text style={[styles.error, { fontFamily: bodySmFont }]}>
            <Trans>Couldn't save — try again.</Trans>
          </Text>
        ) : null}
      </View>
    </KeyboardScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // UI-SPEC § Spacing — sp-9 (32px) between form sections.
    form: { gap: spacingScale['sp-9'] },
    helper: {
      fontSize: typeRoles.body.size,
      color: colors.textSecondary,
    },
    error: {
      fontSize: typeRoles.bodySm.size,
      color: colors.dangerText,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacingScale['sp-4'],
      // Pulls the tag row up under the title field it belongs to instead of
      // reading as its own sp-9 form section — negative of an existing
      // token, not a new pixel value (same idiom `complete-profile.tsx`'s
      // `subtitle.marginTop` already uses).
      marginTop: -spacingScale['sp-5'],
    },
    submitButton: {
      minHeight: layout.hitMin,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: radiiScale['r-pill'],
    },
    submitButtonPending: { opacity: PENDING_OPACITY },
    submitButtonText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
  });
}
