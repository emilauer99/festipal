import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { useLingui } from '@lingui/react/macro';

import type { ThemeColors } from '../../../../lib/theme';
import { useTheme } from '../../../../lib/theme-context';
import { useHeaderClearance } from '../../../../components/AppHeader';
import { PlaceholderScreen } from '../../../../components/PlaceholderScreen';

/**
 * D-12/D-13 — Activities waits on quiks itself, not on the festival (unlike
 * Timetable/Lageplan below, which wait on the festival's own admin-UI data
 * entry). No date or phase number is named in either language (D-13,
 * NAV-02): a placeholder that promised a date would be exactly the
 * simulated-progress dishonesty NAV-02 exists to prevent.
 */
export default function FestivalActivitiesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerClearance = useHeaderClearance();
  const { t } = useLingui();

  return (
    <SafeAreaView style={[styles.screen, { paddingTop: headerClearance }]} edges={['bottom']}>
      <PlaceholderScreen
        icon={Sparkles}
        heading={t`Activities are on the way`}
        body={t`We're building this at quiks — for every festival, not just this one.`}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgApp },
  });
}
