import { Stack } from 'expo-router';

/**
 * Plain Stack for the authenticated-but-no-profile route group — same
 * pattern as (auth)/_layout.tsx. The root layout's four-state guard already
 * decides whether this group is mounted (RESEARCH.md Open Question 1,
 * recommendation (a)).
 */
export default function ProfileSetupLayout() {
  return <Stack />;
}
