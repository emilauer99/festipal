import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, Check, Plus } from 'lucide-react-native';
import { Trans } from '@lingui/react/macro';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { tokens } from '@quiks/ui';
import type { Festival } from '@quiks/contracts';

import { formatDateRange } from '../lib/date-range';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// Colour roles resolve per render via `useTheme()` (05.1 D-01) — only the
// mode-invariant scales stay at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const BADGE_ICON_SIZE = 12;
const SAVE_ICON_SIZE = 14;
const HERO_CTA_ICON_SIZE = 18;

/**
 * SVG-local id for the Sunset fill. A module constant rather than a generated
 * one is safe here BY CONSTRUCTION: the CI allows exactly two Sunset surfaces
 * in the whole product (brand glyph + this hero), and `home.tsx` mounts at
 * most one hero — zero saved festivals route to an empty block instead
 * (UI-SPEC E1/zero-one-many, E1/empty).
 */
const SUNSET_GRADIENT_ID = 'festivalCardSunset';

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
 * The hero's Sunset background (05.1 D-05/D-06, UI-SPEC § Sunset Gradient
 * Contract). Absolutely-positioned BEHIND the card content, never replacing
 * the card's own opaque `surfaceCard` fill — a frame rendered before the SVG
 * paints must still read as a card, not as a black rectangle (UI-SPEC
 * E1/loading).
 *
 * Angle, vector and stops all come from `tokens.gradientSunset`, transcribed
 * once in 05.1-03; nothing is re-copied from the untrusted `docs/quiks_CI.html`
 * design bundle here (T-05.1-08). `rx`/`ry` round the fill to `r-card` so the
 * gradient cannot bleed past the card corners even where a platform ignores
 * the parent's `overflow: 'hidden'`.
 */
function SunsetLayer({ gradient }: { gradient: ThemeColors['gradientSunset'] }) {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient
          id={SUNSET_GRADIENT_ID}
          x1={gradient.vector.x1}
          y1={gradient.vector.y1}
          x2={gradient.vector.x2}
          y2={gradient.vector.y2}
        >
          {gradient.stops.map((stop) => (
            <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect
        x={0}
        y={0}
        width="100%"
        height="100%"
        rx={radiiScale['r-card']}
        ry={radiiScale['r-card']}
        fill={`url(#${SUNSET_GRADIENT_ID})`}
      />
    </Svg>
  );
}

/**
 * Owned, flat (non-photo) FestivalCard primitive (UI-SPEC Scope note #1,
 * REVIEW 05-04 MEDIUM/HIGH). The bordered card shell is a plain `View`; a
 * full-card enter `Pressable` (name + caption) and a SIBLING Save
 * `Pressable`/Badge never nest, so a Save tap can only ever fire `onSave`
 * and an enter tap can only ever fire `onEnter` — no `stopPropagation()`
 * plumbing needed. The `saving` prop disables the Save affordance
 * (accessibilityState + a no-op handler) so a rapid double-tap cannot
 * enqueue a second save.
 *
 * The two variants now DIVERGE in text colour and must not share those
 * styles: the hero's name and caption sit directly on the raw Sunset fill and
 * resolve through `textOnGradient` (Ink, >=5.7:1 at every point of the
 * gradient — white fails at ~1.7:1 on the Amber end), in BOTH modes, while
 * the list variant keeps `textPrimary`/`textMuted` on its card surface
 * (UI-SPEC E1/populated vs. E5/populated).
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10) — each role maps to a real weight file,
  // so none of these styles sets a numeric fontWeight.
  const nameFont = fontFamilyForRole(variant === 'hero' ? 'title2' : 'title3', fontsReady);
  const captionFont = fontFamilyForRole('bodySm', fontsReady);
  const microFont = fontFamilyForRole('micro', fontsReady);
  const ctaFont = fontFamilyForRole('title3', fontsReady);
  const isHero = variant === 'hero';

  // UI-SPEC E1/E5 partial: `place` is optional and is appended only when set,
  // so a date-only caption never carries a dangling separator.
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
    <View style={[styles.card, isHero ? styles.cardHero : null]}>
      {isHero ? <SunsetLayer gradient={colors.gradientSunset} /> : null}
      <View style={styles.row}>
        <Pressable style={styles.enterLayer} onPress={onEnter} accessibilityRole="button">
          <Text
            style={[isHero ? styles.nameHero : styles.name, { fontFamily: nameFont }]}
            numberOfLines={1}
          >
            {festival.name}
          </Text>
          <Text
            style={[isHero ? styles.captionHero : styles.caption, { fontFamily: captionFont }]}
            numberOfLines={1}
          >
            {caption}
          </Text>
        </Pressable>

        {saved ? (
          <View style={styles.badge}>
            <Check size={BADGE_ICON_SIZE} color={colors.primary} strokeWidth={2.4} />
            <Text style={[styles.badgeText, { fontFamily: microFont }]}>
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
            <Text style={[styles.saveButtonText, { fontFamily: microFont }]}>
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
      {/* The CTA is NOT on the gradient — it is a solid Beere pill BELOW the
          gradient card area and therefore keeps white `textOnPrimary`, the
          CI's literal "text on Beere is white" rule (UI-SPEC E1/populated). */}
      <Pressable style={styles.heroCta} onPress={onEnter} accessibilityRole="button">
        <Text style={[styles.heroCtaText, { fontFamily: ctaFont }]}>
          <Trans>Open festival</Trans>
        </Text>
        <ArrowRight size={HERO_CTA_ICON_SIZE} color={colors.textOnPrimary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      // Stays the card's own opaque fill even on the hero: the SVG layer sits
      // ON TOP of this background, so no frame can ever render as a bare
      // rectangle before the gradient paints (UI-SPEC E1/loading).
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      // D-04: in light mode this hairline is the ONLY card-boundary mechanism.
      // If it reads as invisible on device the sanctioned fix is raising
      // `borderSubtle`'s opacity — NOT adding a shadow or elevation token.
      borderColor: colors.borderSubtle,
      borderRadius: radiiScale['r-card'],
      padding: spacingScale['sp-6'],
    },
    cardHero: {
      // Clips the absolutely-positioned Sunset layer to the card radius.
      overflow: 'hidden',
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
      color: colors.textPrimary,
    },
    nameHero: {
      fontSize: typeRoles.title2.size,
      // On the raw Sunset fill, in BOTH modes — the gradient does not invert.
      color: colors.textOnGradient,
    },
    caption: {
      marginTop: spacingScale['sp-4'],
      fontSize: typeRoles.bodySm.size,
      color: colors.textMuted,
    },
    captionHero: {
      marginTop: spacingScale['sp-4'],
      fontSize: typeRoles.bodySm.size,
      color: colors.textOnGradient,
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
      color: colors.textOnPrimary,
    },
  });
}
