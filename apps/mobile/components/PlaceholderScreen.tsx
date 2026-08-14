import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// Colour roles resolve per render via `useTheme()` (05.1 D-01) — only the
// mode-invariant scales stay at module scope.
const { typeRoles, layout, spacingScale } = tokens;

const ICON_SIZE = 40;

export type PlaceholderScreenProps = {
  /** The Lucide icon component to render — never a name string. */
  icon: LucideIcon;
  /** Already-localized heading (caller passes `t\`No timetable yet\`` etc — this component owns no copy). */
  heading: string;
  /** Already-localized precondition sentence. */
  body: string;
};

/**
 * D-12 — the geteilte ganzflaechige Leerzustand-Baustein shared by the three
 * content-less festival tabs (Aktivitaeten/Timetable/Lageplan). Owns NO copy
 * of its own — icon/heading/body are all caller-supplied, same rule as
 * `ComingSoonTile` and `SoonToast`. `useSoonToast` is deliberately NOT
 * imported here: there is no interactive control on this screen to tap, the
 * whole screen IS the honest statement (D-12's resolution of ROADMAP-SC-2).
 *
 * A `ScrollView` whose `contentContainerStyle` carries `flexGrow: 1` plus the
 * centering — NOT a bare `flex: 1` `View` (UI-SPEC row 39/E6-overflow): the
 * app sets no `maxFontSizeMultiplier` anywhere, so at a large system font
 * scale a non-scrolling centered block would clip the body paragraph off the
 * bottom edge. At normal font size this renders pixel-identical to a
 * centered `View`; at large scale it scrolls instead of clipping. This
 * deviation is scoped to this component only — converting the app's other
 * centered states is an app-wide concern outside this phase.
 */
export function PlaceholderScreen({ icon: Icon, heading, body }: PlaceholderScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10) — the family carries the weight, so
  // neither text style below sets a numeric `fontWeight`.
  const headingFont = fontFamilyForRole('title2', fontsReady);
  const bodyFont = fontFamilyForRole('body', fontsReady);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Icon size={ICON_SIZE} color={colors.textMuted} strokeWidth={2} />
      {/* `title2` is a tracked Outfit role (CI §4) — its `letterSpacing`
          MUST be set alongside its size, or `type-tracking.test.ts` fails.
          Deliberately no `numberOfLines`: the heading is never truncated. */}
      <Text style={[styles.heading, { fontFamily: headingFont }]}>{heading}</Text>
      <Text style={[styles.body, { fontFamily: bodyFont }]}>{body}</Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: layout.screenPad,
      paddingBottom: layout.scrollBottomPad,
      gap: spacingScale['sp-6'],
    },
    heading: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    body: {
      fontSize: typeRoles.body.size,
      lineHeight: typeRoles.body.size * typeRoles.body.lineHeight,
      color: colors.textMuted,
      textAlign: 'center',
      // Roughly two-thirds of the screen width so the precondition sentence
      // reads as a short paragraph rather than a single stretched line
      // (matches home.tsx's empty-state wrapping intent, UI-SPEC § Placeholder
      // Screen Contract).
      maxWidth: '66%',
    },
  });
}
