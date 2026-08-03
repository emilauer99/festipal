import { Stack } from 'expo-router';

/**
 * Plain Stack for the unauthenticated (auth) route group (RESEARCH.md
 * Recommended Project Structure) — no guard logic lives here; the root
 * layout's four-state AuthState union already decides whether this group is
 * even mounted (Pitfall B / PITFALLS.md #5).
 */
export default function AuthLayout() {
  return <Stack />;
}
