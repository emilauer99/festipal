import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';
import { ChevronRight, UserRound } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import type { ThemeColors } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const ROW_ICON_SIZE = 22;
const ROW_CHEVRON_SIZE = 18;

/**
 * D-01 / D-08 — the fourth tab, "Mehr" (design `04 Mehr`). This is the TRACER
 * slice (06-01): it carries exactly ONE section — Konto with the single Profil
 * row — because that row is the load-bearing proof that a root-level push
 * screen outside `(tabs)` is actually reachable (Pitfall 1).
 *
 * Everything else the design draws here (Zahlungsmittel, Darstellung with the
 * real dark-mode switch, Benachrichtigungen, Standort & Sicherheit incl. the
 * SafeNow callout, App incl. Sprache and the destructive Abmelden row) is built
 * ADDITIVELY by plan 06-05 next to this section, over the shared `ListRow`
 * component plan 06-04 introduces — the inline row below is deliberately the
 * cheapest thing that proves the navigation, not a competing row primitive.
 */
export default function MehrScreen() {
  const router = useRouter();
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10): the family IS the weight, so no style
  // below sets a numeric `fontWeight` on top of a real weight file.
  const eyebrowFont = fontFamilyForRole('micro', fontsReady);
  const rowLabelFont = fontFamilyForRole('bodyStrong', fontsReady);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.eyebrow, { fontFamily: eyebrowFont }]}>
            <Trans>Account</Trans>
          </Text>

          <View style={styles.rowGroup}>
            <Pressable
              style={styles.row}
              onPress={() => router.push('/profil')}
              accessibilityRole="button"
              // Pitfall 4 — `accessibilityLabel` is excluded from the
              // no-literal-string lint rule, so it is routed through Lingui here
              // by hand; a raw literal would never reach the catalog.
              accessibilityLabel={t`Profile`}
            >
              <UserRound size={ROW_ICON_SIZE} color={colors.textMuted} strokeWidth={2} />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.rowLabel, { fontFamily: rowLabelFont }]}
              >
                <Trans>Profile</Trans>
              </Text>
              <ChevronRight size={ROW_CHEVRON_SIZE} color={colors.textMuted} strokeWidth={2} />
            </Pressable>
          </View>
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
      // Clears the floating nav so the last row is never trapped under it.
      paddingBottom: layout.scrollBottomPad,
      gap: layout.sectionGap,
    },
    section: { gap: spacingScale['sp-5'] },
    eyebrow: {
      fontSize: typeRoles.micro.size,
      lineHeight: typeRoles.micro.size * typeRoles.micro.lineHeight,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: typeRoles.micro.size * 0.09,
    },
    rowGroup: { gap: spacingScale['sp-4'] },
    row: {
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-4'],
      paddingHorizontal: spacingScale['sp-6'],
      paddingVertical: spacingScale['sp-5'],
      backgroundColor: colors.surfaceCard,
      borderRadius: radiiScale['r-md'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    rowLabel: {
      flex: 1,
      fontSize: typeRoles.bodyStrong.size,
      color: colors.textPrimary,
    },
  });
}
