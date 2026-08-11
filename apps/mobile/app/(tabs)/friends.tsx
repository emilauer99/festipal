import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trans } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import type { ThemeColors } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, spacingScale } = tokens;

/**
 * D-10 / D-11 — the third tab, "Friends" (design `03 Friends`). GLOBAL by
 * decision: this screen reads NO festival state and makes NO network call, so
 * the roadmap's "friends who saved this festival" framing does not apply here.
 *
 * This is the TRACER slice (06-01): it carries exactly ONE of the design's six
 * blocks — Anfragen with its own empty state — to prove the route renders under
 * the new tab. The remaining five blocks (Suche, quiks-Code card, Chats, Deine
 * Crew, Vielleicht kennst du) are built ADDITIVELY by plan 06-06, each with its
 * OWN section-specific empty copy: per D-11 the honest copy — not visual
 * dimming — is what keeps six empty sections from reading as a broken screen.
 */
export default function FriendsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10): the family IS the weight, so no style
  // below sets a numeric `fontWeight` on top of a real weight file.
  const headingFont = fontFamilyForRole('title2', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionHead, { fontFamily: headingFont }]}>
            <Trans>Requests</Trans>
          </Text>
          {/* UI-SPEC #8 — empty-state body copy wraps freely (no numberOfLines);
              truncating it would cost exactly the honesty D-11 asks it to carry. */}
          <Text style={[styles.emptyBody, { fontFamily: bodySmFont }]}>
            <Trans>No requests yet. Once someone adds you, it'll show up here.</Trans>
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
