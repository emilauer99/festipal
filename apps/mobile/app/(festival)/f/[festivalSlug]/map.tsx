import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { useLingui } from '@lingui/react/macro';

import type { ThemeColors } from '../../../../lib/theme';
import { useTheme } from '../../../../lib/theme-context';
import { useHeaderClearance } from '../../../../components/AppHeader';
import { PlaceholderScreen } from '../../../../components/PlaceholderScreen';

/**
 * D-12/D-13 — Lageplan waits on the FESTIVAL, which has to enter its own
 * site map through the admin UI; this stays true even after the tab itself
 * is fully built, if the festival never enters data. No date or phase
 * number is named in either language (D-13, NAV-02).
 */
export default function FestivalMapScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerClearance = useHeaderClearance();
  const { t } = useLingui();

  return (
    <SafeAreaView style={[styles.screen, { paddingTop: headerClearance }]} edges={['bottom']}>
      <PlaceholderScreen
        icon={MapPin}
        heading={t`No site map yet`}
        body={t`This festival hasn't added a site map yet. It'll show up here once they do.`}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgApp },
  });
}
