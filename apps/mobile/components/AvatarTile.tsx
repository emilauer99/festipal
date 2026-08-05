import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { tokens } from '@festipal/ui';

import { FONT_DISPLAY, resolveFontFamily } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';

const { colors, typeRoles, radii } = tokens;

const AVATAR_SIZE = 88;
// UI-SPEC ## Color — accent is reserved for exactly these elements, including
// "Avatar-tile background tint + ring"; status/accent tints are always a 16%
// tint behind colored content, never a solid fill (doc 03 §2).
const AVATAR_TINT = 'rgba(116,204,31,0.16)';

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
 */
export function AvatarTile({ displayName, username, localUri }: AvatarTileProps) {
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
      <Text style={[styles.initialsText, { fontFamily: resolveFontFamily(FONT_DISPLAY, fontsReady) }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
  },
  initialsTile: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
    backgroundColor: AVATAR_TINT,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: typeRoles.title2.size,
    fontWeight: typeRoles.title2.weight,
    color: colors.primary,
  },
});
