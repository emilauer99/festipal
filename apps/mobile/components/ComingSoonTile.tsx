import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { FONT_BODY, resolveFontFamily } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';

const { colors, typeRoles, radiiScale, spacingScale } = tokens;

const ICON_SIZE = 22;

export type ComingSoonTileProps = {
  /** The Lucide icon component to render (e.g. `CalendarClock`) — never a name string. */
  icon: LucideIcon;
  /** Already-localized tile label (caller passes `t\`Timetable\`` etc — this component owns no copy). */
  label: string;
  /** Already-localized "Soon"/"Bald" badge text. */
  badge: string;
};

/**
 * D-07 — owned, non-interactive "coming soon" primitive (ADR-022, UI-SPEC
 * Component Contract). A disabled `View`, NEVER a `Pressable` — no press
 * feedback, no navigation. Fully static: this component takes no data-fetch
 * props (icon/label/badge are all caller-supplied), matching the phase scope
 * that keeps every tile — including Cashless — inert this phase (T-05-03).
 */
export function ComingSoonTile({ icon: Icon, label, badge }: ComingSoonTileProps) {
  const fontsReady = useFontsReady();
  const bodyFont = resolveFontFamily(FONT_BODY, fontsReady);

  return (
    <View style={styles.tile} accessibilityState={{ disabled: true }}>
      <View style={styles.badge}>
        <Text style={[styles.badgeText, { fontFamily: bodyFont }]}>{badge}</Text>
      </View>
      <Icon size={ICON_SIZE} color={colors.textMuted} strokeWidth={2} />
      <Text style={[styles.label, { fontFamily: bodyFont }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '48%',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radiiScale['r-md'],
    paddingVertical: spacingScale['sp-6'],
    paddingHorizontal: spacingScale['sp-5'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingScale['sp-4'],
  },
  badge: {
    position: 'absolute',
    top: spacingScale['sp-4'],
    right: spacingScale['sp-4'],
    backgroundColor: colors.fillQuiet,
    borderRadius: radiiScale['r-pill'],
    paddingHorizontal: spacingScale['sp-4'],
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: typeRoles.micro.size,
    fontWeight: typeRoles.micro.weight,
    color: colors.textMuted,
  },
  label: {
    fontSize: typeRoles.title3.size,
    fontWeight: typeRoles.title3.weight,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
