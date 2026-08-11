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

const AVATAR_SIZE = 88;

export type AvatarTileProps = {
  displayName: string;
  username: string;
  /** Local `file://` URI from `avatar-storage.ts` (D-01), or `undefined`/empty for the initials fallback. */
  localUri?: string;
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
export function AvatarTile({ displayName, username, localUri }: AvatarTileProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();

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
      {/* Role-resolved (05.1 D-10): `title2` maps to a real 700 file, so the
          style sets no numeric fontWeight. */}
      <Text style={[styles.initialsText, { fontFamily: fontFamilyForRole('title2', fontsReady) }]}>
        {initials}
      </Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    photo: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: radii.pill,
    },
    initialsTile: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: radii.pill,
      // UI-SPEC ## Color — accent is reserved for exactly these elements,
      // including "Avatar-tile background tint + ring"; accent tints are
      // always a quiet tint behind coloured content, never a solid fill.
      backgroundColor: colors.fillBrandQuiet,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initialsText: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      color: colors.primary,
    },
  });
}
