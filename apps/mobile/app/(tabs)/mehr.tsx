import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';
import { Languages, Share2, ShieldAlert, UserRound, Wallet } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { ListRow } from '../../components/ListRow';
import { SettingsSwitch } from '../../components/SettingsSwitch';
import { useSoonToast } from '../../components/SoonToast';
import { fontFamilyForRole } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import { i18n } from '../../lib/i18n';
import type { ThemeColors } from '../../lib/theme';
import { useTheme, useThemeOverride } from '../../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

/**
 * T-06-20 — the SafeNow destination is a FIXED module constant over HTTPS. It
 * never comes from a server response, never from user input and is never
 * assembled at runtime: a target an attacker could influence would be a phishing
 * vector carrying this app's trust. Every outbound call on this screen hands
 * over exactly this constant.
 */
const SAFENOW_URL = 'https://safenow.app';

const CALLOUT_ICON_SIZE = 18;

/**
 * D-01 / D-08 — the fourth tab, "Mehr" (design `04 Mehr`), in its full layout:
 * five eyebrow-headed sections, drawn exactly as the design draws them.
 *
 * The phase's stance is "visibly dead rather than left out". Exactly FOUR things
 * work here: Konto → Profil, the Sprache row as a read-only display with a
 * hint-on-tap, the dark-mode switch, and (added in 06-05 task 2) signing out.
 * Everything else is dampened, badged and — for the switches — genuinely
 * `disabled`, so a dead control can never suggest a state nothing backs
 * (T-06-22).
 *
 * The row primitives come from 06-04 (`ListRow`, `SettingsSwitch`) and the one
 * app-wide "coming soon" mechanism from `useSoonToast()` (D-13) — this screen
 * invents no row or feedback pattern of its own.
 */
export default function MehrScreen() {
  const router = useRouter();
  const { t } = useLingui();
  const { colors, mode } = useTheme();
  const { setThemeOverride } = useThemeOverride();
  const showSoonToast = useSoonToast();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10): the family IS the weight, so no style
  // below sets a numeric `fontWeight` on top of a real weight file.
  const eyebrowFont = fontFamilyForRole('micro', fontsReady);
  const calloutTitleFont = fontFamilyForRole('bodyStrong', fontsReady);
  const calloutBodyFont = fontFamilyForRole('bodySm', fontsReady);
  const calloutLinkFont = fontFamilyForRole('label', fontsReady);

  const soonBadge = t`Soon`;

  /**
   * UI-SPEC #24 — the ONLY variable value on this screen. The active UI locale
   * is known synchronously from the i18n runtime (resolved once at startup from
   * the device language, D-06/D-07), so no loading state can ever render here.
   * The name is written in the language it denotes, which is also the language
   * the UI is currently rendering in — msgid and value agree by construction.
   */
  const languageValue = i18n.locale === 'de' ? t`German` : t`English`;

  /**
   * D-08a — the switch REFLECTS the effective mode (whatever produced it: the
   * stored preference or the device) but always WRITES an explicit preference:
   * on pins night mode, off hands control back to the device. The third stored
   * state — pinning day mode against a night device — has no writer this phase;
   * it exists in the type for a later control.
   */
  const isDarkMode = mode === 'dark';

  function handleDarkModeChange(next: boolean) {
    setThemeOverride(next ? 'dark' : 'system');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {/* UI-SPEC #28 — the scroll container's bottom pad frees the last row from
          the FloatingNav that floats above it. */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.eyebrow, { fontFamily: eyebrowFont }]}>
            <Trans>Account</Trans>
          </Text>

          <View style={styles.rowGroup}>
            <ListRow
              icon={UserRound}
              label={t`Profile`}
              onPress={() => router.push('/profil')}
              // Pitfall 4 — `accessibilityLabel` is excluded from the
              // no-literal-string lint rule, so it is routed through Lingui here
              // by hand; a raw literal would never reach the catalog.
              accessibilityLabel={t`Profile`}
            />
            <ListRow
              icon={Wallet}
              label={t`Payment methods`}
              disabled
              badge={soonBadge}
              onPress={() => showSoonToast(t`Payment methods are coming soon.`)}
              accessibilityLabel={t`Payment methods, coming soon`}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.eyebrow, { fontFamily: eyebrowFont }]}>
            <Trans>Appearance</Trans>
          </Text>

          <View style={styles.rowGroup}>
            <SettingsSwitch
              label={t`Dark mode`}
              description={t`The night shift for your eyes.`}
              value={isDarkMode}
              onValueChange={handleDarkModeChange}
              accessibilityLabel={t`Dark mode`}
            />
            {/* UI-SPEC Placeholder Pattern B — full opacity, REAL value, chevron
                kept; the tap answers with the shared hint instead of opening a
                switcher that does not exist yet. */}
            <ListRow
              icon={Languages}
              label={t`Language`}
              value={languageValue}
              onPress={() => showSoonToast(t`Language switching is coming soon.`)}
              accessibilityLabel={t`Language`}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.eyebrow, { fontFamily: eyebrowFont }]}>
            <Trans>Notifications</Trans>
          </Text>

          {/* T-06-22 — all three are genuinely `disabled`, not merely dampened:
              a control nothing backs must not be flippable into a state it
              cannot store. */}
          <View style={styles.rowGroup}>
            <SettingsSwitch
              label={t`Timetable reminders`}
              description={t`A nudge just before your acts start.`}
              value={false}
              disabled
              badge={soonBadge}
              accessibilityLabel={t`Timetable reminders, coming soon`}
            />
            <SettingsSwitch
              label={t`Festival news`}
              description={t`Updates from the organizer while you're on-site.`}
              value={false}
              disabled
              badge={soonBadge}
              accessibilityLabel={t`Festival news, coming soon`}
            />
            <SettingsSwitch
              label={t`Friend requests`}
              description={t`When someone adds you to their crew.`}
              value={false}
              disabled
              badge={soonBadge}
              accessibilityLabel={t`Friend requests, coming soon`}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.eyebrow, { fontFamily: eyebrowFont }]}>
            <Trans>Location & Safety</Trans>
          </Text>

          <View style={styles.rowGroup}>
            <SettingsSwitch
              label={t`Share location with your crew`}
              description={t`Only on the festival grounds, only with friends.`}
              value={false}
              disabled
              badge={soonBadge}
              accessibilityLabel={t`Share location with your crew, coming soon`}
            />

            {/* The one block on this screen that is fully real: text plus an
                external link. Surface and hairline take the info FILL roles, the
                icon and heading the info TEXT variant — the bare info hue
                measures 2.04:1 on Papier and hell-first makes Papier the default
                surface. */}
            <View style={styles.callout}>
              <ShieldAlert
                size={CALLOUT_ICON_SIZE}
                color={colors.infoText}
                strokeWidth={2}
                style={styles.calloutIcon}
              />
              <View style={styles.calloutBody}>
                <Text style={[styles.calloutTitle, { fontFamily: calloutTitleFont }]}>
                  <Trans>Stay safe</Trans>
                </Text>
                {/* D-14 / UI-SPEC #30 — the sentence denying any connection to
                    SafeNow carries no line cap and must never be shortened,
                    softened or dropped in any language: without it the block
                    could be read as a partnership or endorsement. */}
                <Text style={[styles.calloutText, { fontFamily: calloutBodyFont }]}>
                  <Trans>
                    We have no connection to SafeNow — we just think the app is genuinely good. Use
                    it on-site.
                  </Trans>
                </Text>
                <Pressable
                  onPress={() => void Linking.openURL(SAFENOW_URL)}
                  accessibilityRole="link"
                  accessibilityLabel={t`Open safenow.app`}
                  style={styles.calloutLink}
                >
                  <Text style={[styles.calloutLinkText, { fontFamily: calloutLinkFont }]}>
                    <Trans>Open safenow.app</Trans>
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.eyebrow, { fontFamily: eyebrowFont }]}>
            <Trans>App</Trans>
          </Text>

          <View style={styles.rowGroup}>
            <ListRow
              icon={Share2}
              label={t`Recommend quiks`}
              disabled
              badge={soonBadge}
              onPress={() => showSoonToast(t`Recommending is coming soon.`)}
              accessibilityLabel={t`Recommend quiks, coming soon`}
            />
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
    callout: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacingScale['sp-5'],
      paddingHorizontal: spacingScale['sp-6'],
      paddingVertical: spacingScale['sp-5'],
      backgroundColor: colors.fillInfoQuiet,
      borderRadius: radiiScale['r-md'],
      borderWidth: 1,
      borderColor: colors.borderInfo,
    },
    calloutIcon: { marginTop: spacingScale['sp-2'] },
    // `minWidth: 0` lets the body column actually wrap instead of pushing the
    // row wider than the screen.
    calloutBody: { flexGrow: 1, flexShrink: 1, minWidth: 0, gap: spacingScale['sp-2'] },
    calloutTitle: {
      fontSize: typeRoles.bodyStrong.size,
      lineHeight: typeRoles.bodyStrong.size * typeRoles.bodyStrong.lineHeight,
      color: colors.infoText,
    },
    calloutText: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textSecondary,
    },
    calloutLink: {
      minHeight: layout.hitMin,
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    calloutLinkText: {
      fontSize: typeRoles.label.size,
      lineHeight: typeRoles.label.size * typeRoles.label.lineHeight,
      color: colors.infoText,
    },
  });
}
