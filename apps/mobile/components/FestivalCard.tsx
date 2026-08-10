import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Check, Plus } from 'lucide-react-native';
import { Trans } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';
import type { Festival } from '@quiks/contracts';

import { formatDateRange } from '../lib/date-range';
import { FONT_BODY, FONT_DISPLAY, resolveFontFamily } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';

const { colors, typeRoles, layout, radiiScale, spacingScale } = tokens;

const BADGE_ICON_SIZE = 12;
const SAVE_ICON_SIZE = 14;
const HERO_CTA_ICON_SIZE = 18;

export type FestivalCardProps = {
  /** Shared `@quiks/contracts` shape — never redeclared locally (Pitfall 6). */
  festival: Festival;
  /** Whether THIS festival is already saved (drives the Badge/Save-affordance split). */
  saved: boolean;
  /** In-flight save mutation for THIS festival's id — disables/no-ops the Save affordance. */
  saving?: boolean;
  /** Active locale, forwarded to the null-safe `formatDateRange` caption formatter. */
  locale: string;
  /** `"list"` (default, flat row) or `"hero"` (larger name + full-width CTA below the card). */
  variant?: 'list' | 'hero';
  onEnter: () => void;
  onSave: () => void;
};

/**
 * Owned, flat (non-photo) FestivalCard primitive (UI-SPEC Scope note #1,
 * REVIEW 05-04 MEDIUM/HIGH). The bordered card shell is a plain `View`; a
 * full-card enter `Pressable` (name + caption) and a SIBLING Save
 * `Pressable`/Badge never nest, so a Save tap can only ever fire `onSave`
 * and an enter tap can only ever fire `onEnter` — no `stopPropagation()`
 * plumbing needed. The `saving` prop disables the Save affordance
 * (accessibilityState + a no-op handler) so a rapid double-tap cannot
 * enqueue a second save.
 */
export function FestivalCard({
  festival,
  saved,
  saving = false,
  locale,
  variant = 'list',
  onEnter,
  onSave,
}: FestivalCardProps) {
  const fontsReady = useFontsReady();
  const bodyFont = resolveFontFamily(FONT_BODY, fontsReady);
  const displayFont = resolveFontFamily(FONT_DISPLAY, fontsReady);
  const isHero = variant === 'hero';

  const caption = `${formatDateRange(festival.startDate, festival.endDate, locale)}${
    festival.place ? ` · ${festival.place}` : ''
  }`;

  function handleSavePress() {
    // Duplicate rapid-tap guard (REVIEW 05-04 MEDIUM) — a second Save while
    // the mutation is in flight is a silent no-op, not a second dispatch.
    if (saving) return;
    onSave();
  }

  const card = (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable
          style={styles.enterLayer}
          onPress={onEnter}
          accessibilityRole="button"
        >
          <Text
            style={[
              isHero ? styles.nameHero : styles.name,
              { fontFamily: isHero ? displayFont : bodyFont },
            ]}
            numberOfLines={1}
          >
            {festival.name}
          </Text>
          <Text style={[styles.caption, { fontFamily: bodyFont }]} numberOfLines={1}>
            {caption}
          </Text>
        </Pressable>

        {saved ? (
          <View style={styles.badge}>
            <Check size={BADGE_ICON_SIZE} color={colors.primary} strokeWidth={2.4} />
            <Text style={[styles.badgeText, { fontFamily: bodyFont }]}>
              <Trans>Saved</Trans>
            </Text>
          </View>
        ) : (
          <Pressable
            style={[styles.saveButton, saving ? styles.saveButtonDisabled : null]}
            onPress={handleSavePress}
            disabled={saving}
            accessibilityRole="button"
            accessibilityState={{ disabled: saving }}
          >
            <Plus size={SAVE_ICON_SIZE} color={colors.textPrimary} strokeWidth={2} />
            <Text style={[styles.saveButtonText, { fontFamily: bodyFont }]}>
              <Trans>Save</Trans>
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  if (!isHero) {
    return card;
  }

  return (
    <View>
      {card}
      <Pressable style={styles.heroCta} onPress={onEnter} accessibilityRole="button">
        <Text style={[styles.heroCtaText, { fontFamily: bodyFont }]}>
          <Trans>Open festival</Trans>
        </Text>
        <ArrowRight size={HERO_CTA_ICON_SIZE} color={colors.textOnPrimary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radiiScale['r-card'],
    padding: spacingScale['sp-6'],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacingScale['sp-4'],
  },
  // flex:1 + minWidth:0 (REVIEW 05-04 MEDIUM) — the enter layer owns all
  // remaining row space so it never sits under the sibling Save/Badge.
  enterLayer: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: typeRoles.title3.size,
    fontWeight: typeRoles.title3.weight,
    color: colors.textPrimary,
  },
  nameHero: {
    fontSize: typeRoles.title2.size,
    fontWeight: typeRoles.title2.weight,
    color: colors.textPrimary,
  },
  caption: {
    marginTop: spacingScale['sp-4'],
    fontSize: typeRoles.bodySm.size,
    color: colors.textMuted,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingScale['sp-3'],
    backgroundColor: colors.fillBrandQuiet,
    borderRadius: radiiScale['r-pill'],
    paddingHorizontal: spacingScale['sp-4'],
    paddingVertical: spacingScale['sp-2'],
  },
  badgeText: {
    fontSize: typeRoles.micro.size,
    fontWeight: typeRoles.micro.weight,
    color: colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingScale['sp-3'],
    minHeight: layout.hitMin,
    paddingHorizontal: spacingScale['sp-5'],
    backgroundColor: colors.fillQuiet,
    borderRadius: radiiScale['r-pill'],
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: typeRoles.micro.size,
    fontWeight: typeRoles.micro.weight,
    color: colors.textPrimary,
  },
  heroCta: {
    marginTop: spacingScale['sp-6'],
    minHeight: layout.hitMin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingScale['sp-4'],
    backgroundColor: colors.primary,
    borderRadius: radiiScale['r-pill'],
  },
  heroCtaText: {
    fontSize: typeRoles.title3.size,
    fontWeight: typeRoles.title3.weight,
    color: colors.textOnPrimary,
  },
});
