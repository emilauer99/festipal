import { Stack } from 'expo-router';

/**
 * Plain Stack for the unauthenticated (auth) route group (RESEARCH.md
 * Recommended Project Structure) — no guard logic lives here; the root
 * layout's four-state AuthState union already decides whether this group is
 * even mounted (Pitfall B / PITFALLS.md #5).
 *
 * 09-07 gap closure (G-09-2) — `headerShown: false` added at this Stack's
 * own `screenOptions`, the same one-line form `(festival)/_layout.tsx`
 * already used. A Native Stack screen with no explicit header option
 * defaults to a VISIBLE (blank) native header; it was exactly this default
 * that ghosted the literal group name "(auth)" through the AppHeader glass
 * on the welcome/e-mail/code screens
 * (.planning/debug/header-content-whitespace.md, DEVICE CONFIRMATION 1).
 */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
