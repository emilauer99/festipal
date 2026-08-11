import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trans, useLingui } from '@lingui/react/macro';
import { Search } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { useSoonToast } from '../../components/SoonToast';
import { fontFamilyForRole } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import type { ThemeColors } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const SEARCH_ICON_SIZE = 18;

/**
 * D-10 / D-11 — the third tab, "Friends" (design `03 Friends`), in its full
 * six-block layout: search · quiks-code card · Requests · Chats · Your crew ·
 * People you may know.
 *
 * GLOBAL by decision (D-10): this screen reads NO festival state — it imports
 * nothing from the festival context, holds no active slug and filters nothing by
 * one. The roadmap's "friends who saved this festival" framing for FRND-01 is
 * superseded by that decision and must not be verified against (T-06-25).
 *
 * WHY EVERY BLOCK CARRIES ITS OWN COPY (D-11): six structurally empty sections
 * stacked on top of each other are this phase's main risk — they can read as
 * broken rather than deliberate. The UI-SPEC's answer is explicit and is the one
 * Friends-specific exception to the phase's placeholder pattern: these blocks are
 * NOT visually dampened. They render at full weight, and the honesty is carried
 * entirely by section-specific empty copy that names the PRECONDITION ("once
 * someone adds you", "once you've added each other") instead of a shared, generic
 * "nothing here". Dampening them as well would produce exactly the broken
 * impression the copy exists to prevent.
 *
 * No person is ever rendered here: there is no example name, no example handle
 * and no seeded row array — a fabricated crew would be a lie the empty copy is
 * specifically written to avoid (T-06-26/T-06-27).
 */
export default function FriendsScreen() {
  const { t } = useLingui();
  const { colors } = useTheme();
  const showSoonToast = useSoonToast();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10): the family IS the weight, so no style
  // below sets a numeric `fontWeight` on top of a real weight file.
  const headingFont = fontFamilyForRole('title2', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const microFont = fontFamilyForRole('micro', fontsReady);

  const soonBadge = t`Soon`;

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {/* UI-SPEC #6 — the scroll container's bottom pad frees the last block
          from the FloatingNav that floats above it; the blocks stack vertically
          and nothing runs off to the side. */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* T-06-26 — the search field is deliberately INERT: `editable={false}`
            plus a non-hit-testable input means it can never take a keystroke,
            so nobody can type a third person's name into a field that would
            send it nowhere. The wrapper answers the tap with the shared hint
            instead, and the static badge says so before the tap. */}
        <Pressable
          style={styles.searchField}
          onPress={() => showSoonToast(t`Searching for people is coming soon.`)}
          accessibilityRole="button"
          accessibilityLabel={t`Search for people, coming soon`}
        >
          <Search size={SEARCH_ICON_SIZE} color={colors.textMuted} strokeWidth={2} />
          {/* UI-SPEC #8 — the placeholder is the one string on this screen that
              may be cut off: a real TextInput truncates it natively, which is
              the intended treatment. */}
          <TextInput
            style={[styles.searchInput, { fontFamily: bodySmFont }]}
            value=""
            editable={false}
            placeholder={t`Name or @handle`}
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { fontFamily: microFont }]}>{soonBadge}</Text>
          </View>
        </Pressable>

        <View style={styles.section}>
          <Text style={[styles.sectionHead, { fontFamily: headingFont }]}>
            <Trans>Requests</Trans>
          </Text>
          {/* UI-SPEC #8 — empty-state body copy carries no line cap and wraps
              freely; truncating it would cost exactly the honesty D-11 asks it
              to carry. The same holds for all four headings and empty texts. */}
          <Text style={[styles.emptyBody, { fontFamily: bodySmFont }]}>
            <Trans>No requests yet. Once someone adds you, it'll show up here.</Trans>
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHead, { fontFamily: headingFont }]}>
            <Trans>Chats</Trans>
          </Text>
          {/* T-06-27 — this text names the PRECONDITION on purpose. A bare "no
              messages" would read as a working inbox that happens to be empty,
              and would leave someone waiting for messages that no gateway exists
              to deliver: messaging needs the realtime backend, which is far
              outside this phase. Do not shorten this to a negation. */}
          <Text style={[styles.emptyBody, { fontFamily: bodySmFont }]}>
            <Trans>
              Chats unlock once you've added someone and can message them — coming soon.
            </Trans>
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHead, { fontFamily: headingFont }]}>
            <Trans>Your crew</Trans>
          </Text>
          <Text style={[styles.emptyBody, { fontFamily: bodySmFont }]}>
            <Trans>
              No one in your crew yet. Once you've added each other, you'll show up here.
            </Trans>
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHead, { fontFamily: headingFont }]}>
            <Trans>People you may know</Trans>
          </Text>
          {/* No suggestion row is rendered — not even a sample one. The block
              states what has to exist first and then stops. */}
          <Text style={[styles.emptyBody, { fontFamily: bodySmFont }]}>
            <Trans>Once you have your first friends, we'll suggest more here.</Trans>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgApp },
    content: {
      paddingHorizontal: layout.screenPad,
      paddingTop: layout.screenPad,
      // Clears the floating nav so the last block is never trapped under it.
      paddingBottom: layout.scrollBottomPad,
      gap: layout.sectionGap,
    },
    // Full opacity, like every block on this screen — the badge, not a dimmed
    // surface, is what marks the field as not-yet-real.
    searchField: {
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-4'],
      paddingHorizontal: spacingScale['sp-6'],
      paddingVertical: spacingScale['sp-4'],
      backgroundColor: colors.surfaceCard,
      borderRadius: radiiScale['r-md'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    searchInput: {
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      // Android gives TextInput its own default padding; zeroing it is what
      // keeps the row on the icon's baseline.
      padding: 0,
      fontSize: typeRoles.bodySm.size,
      color: colors.textPrimary,
      // The tap belongs to the Pressable above, never to the field itself.
      pointerEvents: 'none',
    },
    // Mirrors `ComingSoonTile`/`ListRow`'s badge verbatim.
    badge: {
      backgroundColor: colors.fillQuiet,
      borderRadius: radiiScale['r-pill'],
      paddingHorizontal: spacingScale['sp-4'],
      paddingVertical: spacingScale['sp-1'],
    },
    badgeText: {
      fontSize: typeRoles.micro.size,
      color: colors.textMuted,
    },
    section: { gap: spacingScale['sp-5'] },
    sectionHead: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textPrimary,
    },
    emptyBody: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
  });
}
