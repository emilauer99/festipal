import { useId, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { tokens } from '@quiks/ui';

import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { AVATAR_SIZE } from './AvatarTile';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope. Nothing colour-valued
// may live out here, or it freezes at import time and can never follow the mode.
const { radii } = tokens;

/**
 * The design's `border:3px solid var(--bg-app)` between ring and avatar. This
 * gap is the whole point of the component: without it the gradient reads as a
 * background wash behind the photo instead of as a RING around it.
 */
const RING_GAP = 3;
/**
 * The design's `inset:-4px` — how far the gradient extends BEYOND the gapped
 * avatar box, i.e. the visible stroke width of the ring itself.
 *
 * Geometry note: in the design the `-4px` inset is measured against the
 * BORDERED box (CSS content-box sizing puts the 3px border outside the 88px
 * avatar), so the ring's outer diameter is avatar + 2 × gap + 2 × inset, not
 * avatar + 2 × inset. Measuring the inset against the bare avatar instead would
 * leave 4 − 3 = 1px of visible gradient and produce a hairline, not a ring.
 */
const RING_INSET = 4;

/** Outer diameter of the gradient disc. */
const RING_SIZE = AVATAR_SIZE + (RING_GAP + RING_INSET) * 2;
/** The avatar plus its background-coloured gap — what sits on top of the disc. */
const GAP_BOX_SIZE = AVATAR_SIZE + RING_GAP * 2;

export type AvatarSunsetRingProps = {
  /** The avatar element to ring — normally an `<AvatarTile />`, props untouched. */
  children: ReactNode;
};

/**
 * D-07 — the circular Sunset ring behind the profile avatar (design `11 Profil`,
 * UI-SPEC § Avatar Sunset Ring Contract).
 *
 * The gradient construction is taken STRUCTURALLY from `FestivalCard.tsx`'s
 * existing Sunset layer: same `gradientSunset` token, same `Defs`/`LinearGradient`
 * /`Stop` elements, same vector and stops out of the theme. Only the filled
 * rectangle becomes a circle. No colour value is written here — the ring reads
 * the token, so a CI change lands in one place (05.1 D-05/D-06).
 *
 * BRAND RULE: this surface only exists because ADR-023's Sunset usage rule was
 * widened from "mark and hero surfaces" to also cover avatar/identity surfaces
 * (this phase's D-07). The rule was amended app-wide in `docs/DEVELOPMENT_DECISIONS.md`,
 * `docs/brand/quiks-ci-v1.md` and the root `CLAUDE.md` BEFORE this component
 * shipped — it is not a silent per-screen exception, and it covers later friend
 * avatars too.
 *
 * PURELY DECORATIVE: the ring swallows no touches and carries no accessibility
 * role. Everything an assistive technology sees about the avatar keeps coming
 * from the wrapped element.
 *
 * Mode-invariant: Sunset does not change between light and dark (CI §3/§6), so
 * only the gap takes a per-mode colour.
 */
export function AvatarSunsetRing({ children }: AvatarSunsetRingProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // A per-instance gradient id. `react-native-svg` resolves `url(#id)` through a
  // process-wide registry, so two mounted rings sharing one literal id can
  // cross-link their fills — reachable as soon as the widened rule is applied to
  // a list of friend avatars. `useId()` yields colon-bearing values that are not
  // valid in an SVG fragment reference, hence the strip.
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradientId = `avatarSunsetRing${instanceId}`;
  const gradient = colors.gradientSunset;

  return (
    <View style={styles.ring}>
      <Svg
        width={RING_SIZE}
        height={RING_SIZE}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient
            id={gradientId}
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
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_SIZE / 2}
          fill={`url(#${gradientId})`}
        />
      </Svg>
      <View style={styles.gap}>{children}</View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    ring: {
      width: RING_SIZE,
      height: RING_SIZE,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      // Never shrink: the ring is a fixed circle next to a flexible text column,
      // and a squashed circle would read as a broken image.
      flexGrow: 0,
      flexShrink: 0,
    },
    gap: {
      width: GAP_BOX_SIZE,
      height: GAP_BOX_SIZE,
      borderRadius: radii.pill,
      // The design's `border:3px solid var(--bg-app)` — an opaque app-background
      // ring that separates the gradient from the photo/initials edge.
      backgroundColor: colors.bgApp,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
  });
}
