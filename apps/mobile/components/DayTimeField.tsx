import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Trans, useLingui } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import { i18n } from '../lib/i18n';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { Chip } from './Chip';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
/** Defensive loop bound (T-11-10) — a real festival never spans more than a year. */
const MAX_DAY_OPTIONS = 366;

export type DayOption = { value: string; label: string };

/**
 * Parses a `YYYY-MM-DD` date-only string into a LOCAL `Date` (never UTC) —
 * the same house rule `lib/date-range.ts` documents: `new Date(str)` would
 * shift the calendar day in negative-UTC-offset timezones. Returns `null`
 * for malformed input or a calendar-invalid date (e.g. `'2026-02-30'`, which
 * `Date` would otherwise silently roll over).
 */
function parseDateOnlyLocal(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

function toDateOnlyKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Derives one day-chip option per calendar day in `[startDate, endDate]`
 * (D-07). Absent, malformed, or reversed (`start > end`) bounds resolve to
 * an EMPTY array — never a thrown error and never an infinite loop
 * (T-11-10) — so the caller renders its own "no days available" state
 * instead of a chip row. The loop is defensively bounded at
 * {@link MAX_DAY_OPTIONS} even though a valid range always terminates on its
 * own once `cursor` passes `end`.
 */
export function buildDayOptions(
  startDate: string | null,
  endDate: string | null,
  locale: string,
): DayOption[] {
  if (!startDate || !endDate) return [];
  const start = parseDateOnlyLocal(startDate);
  const end = parseDateOnlyLocal(endDate);
  if (!start || !end) return [];
  if (start.getTime() > end.getTime()) return [];

  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const options: DayOption[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor.getTime() <= end.getTime() && guard < MAX_DAY_OPTIONS) {
    options.push({ value: toDateOnlyKey(cursor), label: formatter.format(cursor) });
    // Component-wise construction (never ms addition) — safe across DST,
    // matching the house rule this function's own parsing already follows.
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    guard += 1;
  }
  return options;
}

export type DayTimeFieldProps = {
  /** The festival's date-only range (`festivalSchema.startDate`/`endDate`), both nullable. */
  startDate: string | null;
  endDate: string | null;
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
  selectedTime: Date | null;
  onSelectTime: (time: Date) => void;
  /** Already-localized inline error, shown below the day-chip row. Owned by the caller (D-10/D-05 screen logic), never derived here. */
  dayErrorText?: string;
  /** Already-localized inline error, shown below the time field. Owned by the caller. */
  timeErrorText?: string;
};

/**
 * The "Wann" block (D-07, 11-03-PLAN Task 3): a day-chip row derived from
 * the festival's own date range, plus a time field using the already-
 * installed `@react-native-community/datetimepicker` — no new native
 * package for time. Neither day nor time is preselected. The block renders
 * NO validation message of its own — `dayErrorText`/`timeErrorText` arrive
 * as finished strings from the screen, which derives them from
 * `canSubmitActivity`'s reason markers.
 */
export function DayTimeField({
  startDate,
  endDate,
  selectedDay,
  onSelectDay,
  selectedTime,
  onSelectTime,
  dayErrorText,
  timeErrorText,
}: DayTimeFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const { t } = useLingui();
  const labelFont = fontFamilyForRole('label', fontsReady);
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  // iOS-only: the picker is a declaratively embedded component there
  // (complete-profile.tsx precedent) — Android drives the same picker
  // imperatively via `DateTimePickerAndroid.open()` and never reads this.
  const [iosPickerOpen, setIosPickerOpen] = useState(false);

  const dayOptions = useMemo(
    () => buildDayOptions(startDate, endDate, i18n.locale),
    [startDate, endDate],
  );
  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.locale, { hour: '2-digit', minute: '2-digit' }),
    [],
  );

  function handleTimePress() {
    const anchor = selectedTime ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: anchor,
        mode: 'time',
        onValueChange: (_event, value) => onSelectTime(value),
      });
      return;
    }
    setIosPickerOpen((open) => !open);
  }

  return (
    <View style={styles.block}>
      <Text style={[styles.eyebrow, { fontFamily: labelFont }]}>
        <Trans>When</Trans>
      </Text>

      {dayOptions.length > 0 ? (
        <View style={styles.dayRow}>
          {dayOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={option.value === selectedDay}
              onPress={() => onSelectDay(option.value)}
            />
          ))}
        </View>
      ) : (
        <Text style={[styles.unavailableText, { fontFamily: bodySmFont }]}>
          <Trans>Festival dates aren&apos;t set yet, so no day can be chosen here.</Trans>
        </Text>
      )}
      {dayErrorText !== undefined ? (
        <Text style={[styles.errorText, { fontFamily: bodySmFont }]}>{dayErrorText}</Text>
      ) : null}

      <Pressable
        style={styles.timeField}
        onPress={handleTimePress}
        accessibilityRole="button"
        accessibilityLabel={t`Choose a time`}
      >
        <Text
          style={[
            styles.timeValue,
            { fontFamily: bodyFont },
            selectedTime === null ? styles.timePlaceholder : null,
          ]}
        >
          {selectedTime === null ? t`Choose a time` : timeFormatter.format(selectedTime)}
        </Text>
      </Pressable>
      {/* iOS renders the picker declaratively, inline under the field;
          Android already opened its own dialog imperatively above
          (complete-profile.tsx precedent). */}
      {iosPickerOpen ? (
        <DateTimePicker
          value={selectedTime ?? new Date()}
          mode="time"
          display="spinner"
          onValueChange={(_event, value) => onSelectTime(value)}
          onDismiss={() => setIosPickerOpen(false)}
        />
      ) : null}
      {timeErrorText !== undefined ? (
        <Text style={[styles.errorText, { fontFamily: bodySmFont }]}>{timeErrorText}</Text>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    block: {
      gap: spacingScale['sp-4'],
      padding: spacingScale['sp-5'],
      borderRadius: radiiScale['r-md'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceCard,
    },
    eyebrow: {
      fontSize: typeRoles.label.size,
      lineHeight: typeRoles.label.size * typeRoles.label.lineHeight,
      color: colors.textSecondary,
    },
    // Wraps onto further lines instead of scrolling horizontally (UI-SPEC
    // E7 overflow) — no long-festival chip ever hides off-screen.
    dayRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacingScale['sp-4'],
    },
    unavailableText: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
    timeField: {
      minHeight: layout.hitMin,
      justifyContent: 'center',
      backgroundColor: colors.surfaceInset,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: radiiScale['r-md'],
      paddingHorizontal: spacingScale['sp-5'],
    },
    timeValue: {
      fontSize: typeRoles.body.size,
      color: colors.textPrimary,
    },
    timePlaceholder: {
      color: colors.textMuted,
    },
    errorText: {
      fontSize: typeRoles.bodySm.size,
      color: colors.dangerText,
    },
  });
}
