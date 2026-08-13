import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// Colour roles resolve per render via `useTheme()` (05.1 D-01) — only the
// mode-invariant scales stay at module scope.
const { typeRoles, radii } = tokens;

/**
 * Exported so `AvatarSunsetRing` can DERIVE its ring geometry from the one
 * avatar size instead of restating `88` in a second file — a copy there would
 * keep its old value the day this one changes and leave the ring off-centre.
 */
export const AVATAR_SIZE = 88;

export type AvatarTileProps = {
  displayName: string;
  username: string;
  /** Local `file://` URI from `avatar-storage.ts` (D-01), or `undefined`/empty for the initials fallback. */
  localUri?: string;
  /**
   * Tile diameter. Default `88` — unchanged Profil-header / friend-detail
   * size. `40` is the `PersonRow` row size (08-01-UI-SPEC § Avatar Size
   * Contract); at that size the initials resolve through the `label` role
   * instead of `title2`, which does not fit inside a 40px circle.
   */
  size?: 40 | 88;
};

/**
 * IDN-01 encoding edge / UI-SPEC long-text/displayName backstop — initials
 * are derived via `Array.from()` (Unicode CODE-POINT iteration, not raw
 * string-indexing) so multi-byte/emoji/combining `displayName` content can
 * never throw or split a surrogate pair in half; an empty/whitespace-only
 * name+username pair renders an empty (but never crashing) tile.
 */
export function deriveInitials(displayName: string, username: string): string {
  const source = displayName.trim() || username.trim();
  if (!source) return '';
  return Array.from(source).slice(0, 2).join('').toUpperCase();
}

/**
 * Profile — avatar-tile fallback (Copywriting Contract): 2-letter uppercase
 * initials (displayName, or username if displayName is empty) whenever no
 * local photo is set; the local `expo-image` photo otherwise. Circular,
 * `--r-pill`/avatar radius (UI-SPEC populated/avatar backstop).
 *
 * 05.1 / ADR-015: the tile tint and ring resolve through `fillBrandQuiet` and
 * `primary`. They used to come from a module-level raw rgba mixed from the
 * Limette that D-11 deletes — left in place it would have kept a green tile
 * and a green ring around every avatar after the brand swap, which is exactly
 * the leftover the no-raw-values rule exists to prevent.
 */
export function AvatarTile({ displayName, username, localUri, size = AVATAR_SIZE }: AvatarTileProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);
  const fontsReady = useFontsReady();
  // 08-01-UI-SPEC § Avatar Size Contract: `label` is not an Outfit-tracked
  // role, so it carries no letterSpacing; `title2` is, and keeps its tracking
  // at the default 88px size.
  const initialsRole = size === 40 ? 'label' : 'title2';

  if (localUri) {
    return (
      <Image
        source={{ uri: localUri }}
        style={styles.photo}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }

  const initials = deriveInitials(displayName, username);

  return (
    <View style={styles.initialsTile}>
      {/* Role-resolved (05.1 D-10): both `title2` and `label` map to real
          weight-specific files, so the style sets no numeric fontWeight. */}
      <Text
        style={[styles.initialsText, { fontFamily: fontFamilyForRole(initialsRole, fontsReady) }]}
      >
        {initials}
      </Text>
    </View>
  );
}

function createStyles(colors: ThemeColors, size: 40 | 88) {
  const initialsFontSize = size === 40 ? typeRoles.label.size : typeRoles.title2.size;
  const initialsLetterSpacing = size === 40 ? undefined : typeRoles.title2.letterSpacing;

  return StyleSheet.create({
    photo: {
      width: size,
      height: size,
      borderRadius: radii.pill,
    },
    initialsTile: {
      width: size,
      height: size,
      borderRadius: radii.pill,
      // UI-SPEC ## Color — accent is reserved for exactly these elements,
      // including "Avatar-tile background tint + ring"; accent tints are
      // always a quiet tint behind coloured content, never a solid fill.
      // Unchanged at both sizes (08-01-UI-SPEC § Avatar Size Contract).
      backgroundColor: colors.fillBrandQuiet,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initialsText: {
      fontSize: initialsFontSize,
      letterSpacing: initialsLetterSpacing,
      color: colors.primary,
    },
  });
}
