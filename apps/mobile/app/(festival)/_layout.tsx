import { Stack } from 'expo-router';

/**
 * Plain Stack for the "(festival)" route group — the post-entry home
 * placeholder. Same pattern as (auth)/_layout.tsx. Mounted only when the
 * root guard resolves to 'authenticated' (app/_layout.tsx).
 */
export default function FestivalLayout() {
  return <Stack />;
}
