import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { plural } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';
import type { ActivitySummary } from '@quiks/contracts';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import { i18n } from '../lib/i18n';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const BADGE_ICON_SIZE = 12;

/**
 * ONE `Intl.DateTimeFormat` instance per render, `.format()` only (never
 * `.formatRange`) — the same discipline `lib/date-range.ts` documents at
 * length (Hermes/iOS `formatRange` instability). Weekday + day + month +
 * time in a single call renders the "day · time" meta line the UI-SPEC asks
 * for without a second formatter instance.
 */
function formatStartMeta(startTime: string, locale: string): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return formatter.format(new Date(startTime));
}

export type ActivityCardProps = {
  activity: ActivitySummary;
  onPress: () => void;
  /**
   * True ONLY for a card in the "Deine Aktivitäten" section whose
   * `startTime` already lies before the screen's own single "now" snapshot
   * (D-04). The "Wer kommt mit?" section never passes `true` — the flag is
   * the caller's decision, not something this component derives itself, so
   * the comparison "now" is drawn exactly once per screen render, never once
   * per card (11-01-PLAN Task 2).
   */
  started: boolean;
};

/**
 * The one shared list-row card for both "Deine Aktivitäten" and "Wer kommt
 * mit?" (D-01, UI-SPEC § Component Inventory). Card shell mirrors
 * `PersonRow`/`FestivalCard`: `surfaceCard` background, `borderSubtle`
 * border, `r-card` radius, `sp-6` padding, `hitMin` as a height floor.
 *
 * Every optional element (tag chip, "Gestartet" chip, spots hint) is
 * rendered via `condition ? <Text>…</Text> : null` — the same
 * "absent field renders nothing" idiom `friend-detail.tsx`'s `identityLine`
 * uses. `capacity === null` omits the spots hint ENTIRELY (no "∞", no dash,
 * D-03). This component carries no photo prop at all (D-06 — deferred).
 */
export function ActivityCard({ activity, onPress, started }: ActivityCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const titleFont = fontFamilyForRole('bodyStrong', fontsReady);
  const metaFont = fontFamilyForRole('countdown', fontsReady);
  const chipFont = fontFamilyForRole('micro', fontsReady);
  const participantsFont = fontFamilyForRole('bodySm', fontsReady);

  const metaText = formatStartMeta(activity.startTime, i18n.locale);

  // E2 zero-one-many — a plural-safe ICU pattern, the same shape the
  // existing `{friendCount, plural, …}` msgids already use in this catalog.
  // Named local variables (rather than the member expression directly) so
  // the macro derives a stable, readable ICU placeholder name.
  const participantCount = activity.participantCount;
  const participantsText = plural(participantCount, {
    one: '# is in',
    other: '# are in',
  });

  // D-03 — `capacity === null` means no spots hint at all, not a fallback
  // glyph. When capacity IS set, `remaining` folds the "last spot" edge case
  // into the same ICU plural msgid as the general "N spots left" copy.
  const remaining = activity.capacity === null ? null : activity.capacity - activity.participantCount;
  const spotsHintText =
    remaining === null ? null : plural(remaining, { one: 'Last spot', other: '# spots left' });

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.headerRow}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.title, { fontFamily: titleFont }]}
        >
          {activity.title}
        </Text>
        {activity.joined ? (
          <View style={styles.joinedBadge}>
            <Check size={BADGE_ICON_SIZE} color={colors.primary} strokeWidth={2.4} />
            <Text style={[styles.joinedBadgeText, { fontFamily: chipFont }]}>
              <Trans>In</Trans>
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.meta, { fontFamily: metaFont }]}>{metaText}</Text>

      {activity.tag || started ? (
        <View style={styles.chipsRow}>
          {activity.tag ? (
            <View style={styles.neutralChip}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.neutralChipText, { fontFamily: chipFont }]}
              >
                {activity.tag.title}
              </Text>
            </View>
          ) : null}
          {started ? (
            <View style={styles.neutralChip}>
              <Text style={[styles.neutralChipText, { fontFamily: chipFont }]}>
                <Trans>Started</Trans>
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.participantsRow}>
        <Text style={[styles.participantsText, { fontFamily: participantsFont }]}>
          {participantsText}
        </Text>
        {spotsHintText ? (
          <Text style={[styles.spotsHintText, { fontFamily: participantsFont }]}>
            {spotsHintText}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      minHeight: layout.hitMin,
      gap: spacingScale['sp-2'],
      padding: spacingScale['sp-6'],
      backgroundColor: colors.surfaceCard,
      borderRadius: radiiScale['r-card'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacingScale['sp-4'],
    },
    title: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: typeRoles.bodyStrong.size,
      lineHeight: typeRoles.bodyStrong.size * typeRoles.bodyStrong.lineHeight,
      color: colors.textPrimary,
    },
    meta: {
      fontSize: typeRoles.countdown.size,
      lineHeight: typeRoles.countdown.size * typeRoles.countdown.lineHeight,
      color: colors.textSecondary,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacingScale['sp-3'],
    },
    // Neutral treatment shared by the tag chip and the "Gestartet" fact-chip
    // (UI-SPEC § Color — "never accent"): `fillQuiet` + `textSecondary`, the
    // same pairing `ListRow`'s badge and `PersonRow`'s compact chrome use.
    neutralChip: {
      flexShrink: 1,
      backgroundColor: colors.fillQuiet,
      borderRadius: radiiScale['r-pill'],
      paddingHorizontal: spacingScale['sp-4'],
      paddingVertical: spacingScale['sp-2'],
    },
    neutralChipText: {
      fontSize: typeRoles.micro.size,
      color: colors.textSecondary,
    },
    // UI-SPEC § Color item 2 — the exact "Saved" badge treatment
    // (`FestivalCard.tsx`): `fillBrandQuiet` + `primary` text.
    joinedBadge: {
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-3'],
      backgroundColor: colors.fillBrandQuiet,
      borderRadius: radiiScale['r-pill'],
      paddingHorizontal: spacingScale['sp-4'],
      paddingVertical: spacingScale['sp-2'],
    },
    joinedBadgeText: {
      fontSize: typeRoles.micro.size,
      color: colors.primary,
    },
    participantsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacingScale['sp-4'],
    },
    participantsText: {
      fontSize: typeRoles.bodySm.size,
      color: colors.textSecondary,
    },
    spotsHintText: {
      fontSize: typeRoles.bodySm.size,
      color: colors.textMuted,
    },
  });
}
