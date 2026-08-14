import { Stack } from 'expo-router';

/**
 * Plain Stack for the "(festival)" route group. Same pattern as
 * (auth)/_layout.tsx. Mounted only when the root guard resolves to
 * 'authenticated' (app/_layout.tsx).
 *
 * 09-03 Task 1 — `headerShown: false` added so the native Stack header no
 * longer sits above the nested five-tab festival navigator
 * (`f/[festivalSlug]/_layout.tsx`). The festival name moves into the
 * `AppHeader` in 09-04 (D-08); until then the Dashboard tab still carries its
 * own heading.
 */
export default function FestivalLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
