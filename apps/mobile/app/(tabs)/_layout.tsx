import { Tabs } from 'expo-router';

import { FloatingNav } from '../../components/FloatingNav';

/**
 * D-02 — the authenticated app shell: a `Tabs` navigator (stable
 * `expo-router` API, RESEARCH Pattern 1) with the owned `FloatingNav` as its
 * `tabBar` render prop.
 *
 * 06-01 / D-01 — all FOUR tabs are now real, registered routes: `start`,
 * `festivals`, `friends`, `mehr`. The two placeholder items `FloatingNav` used
 * to render itself (Friends/Profil, Phase 5) are gone; Profil is no longer a
 * tab at all but a root-level push screen behind Mehr → Konto → Profil
 * (`app/profil.tsx`, registered in `app/_layout.tsx`).
 *
 * DECLARATION ORDER IS THE TAB ORDER: `state.routes` — which `FloatingNav`
 * maps over — follows the order below, so this is what produces the design's
 * Start · Festivals · Friends · Mehr bar. Reordering these lines reorders the
 * nav.
 *
 * `initialRouteName="start"` is set explicitly (REVIEW 05-05 MEDIUM; 09-01
 * NAV-03 rename) so Start is always the default tab regardless of
 * file/declaration order.
 *
 * 09-04 (D-03) — the per-tab native titles/`headerShown: true` overrides on
 * `festivals`/`friends`/`mehr` are gone ERSATZLOS: `AppHeader` now shows the
 * "quiks." wordmark uniformly across all four global tabs, no per-tab title,
 * since `FloatingNav`'s active pill already communicates which tab is open.
 * All four tabs inherit `headerShown: false` from `screenOptions` below.
 */
export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="start"
      tabBar={(props) => <FloatingNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="start" />
      <Tabs.Screen name="festivals" />
      <Tabs.Screen name="friends" />
      <Tabs.Screen name="mehr" />
    </Tabs>
  );
}
