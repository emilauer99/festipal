import { Stack } from 'expo-router';

/**
 * Plain Stack for the authenticated-but-no-profile route group — same
 * pattern as (auth)/_layout.tsx. The root layout's four-state guard already
 * decides whether this group is mounted (RESEARCH.md Open Question 1,
 * recommendation (a)).
 *
 * 09-07 gap closure (G-09-2) — `headerShown: false` added at this Stack's
 * own `screenOptions`, same fix and same reasoning as `(auth)/_layout.tsx`.
 */
export default function ProfileSetupLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
