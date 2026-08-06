import { Tabs } from 'expo-router';
import { useLingui } from '@lingui/react/macro';

import { FloatingNav } from '../../components/FloatingNav';

/**
 * D-02 — the authenticated app shell: a `Tabs` navigator (stable
 * `expo-router` API, RESEARCH Pattern 1) with the owned `FloatingNav` as its
 * `tabBar` render prop. Only `home` and `festivals` are registered
 * `Tabs.Screen`s — Friends/Profil are decorative items `FloatingNav` renders
 * itself (Phase 6 adds their real screens).
 *
 * `initialRouteName="home"` is set explicitly (REVIEW 05-05 MEDIUM) so Home
 * is always the default tab regardless of file/declaration order.
 */
export default function TabsLayout() {
  const { t } = useLingui();

  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <FloatingNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="festivals" options={{ headerShown: true, title: t`Festivals` }} />
    </Tabs>
  );
}
