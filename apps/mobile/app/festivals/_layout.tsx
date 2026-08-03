import { Stack } from 'expo-router';

/**
 * Plain Stack for the "festivals" route group — same pattern as
 * (auth)/_layout.tsx. Mounted only when the root guard resolves to
 * 'authenticated' (app/_layout.tsx).
 */
export default function FestivalsLayout() {
  return <Stack />;
}
