import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { emailOTPClient } from 'better-auth/client/plugins';
import type { BetterAuthClientPlugin } from 'better-auth/client';
import * as SecureStore from 'expo-secure-store';

/**
 * Module-singleton Expo auth client (RESEARCH.md Pattern 3), evaluated
 * synchronously at import time — mirroring apps/api/src/auth/auth.instance.ts's
 * own module-singleton + comment-per-decision discipline.
 */
export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [
    // The `as BetterAuthClientPlugin` cast works around a shipped-type-only
    // incompatibility in @better-auth/expo@1.6.25's `expoClient` return type
    // vs. `createAuthClient`'s plugin-array parameter (a deeply-nested
    // conditional-type mismatch in `getActions`'s `$fetch` parameter that
    // does not reflect a real runtime issue — the JS shape matches the
    // official better-auth.com/docs/integrations/expo example exactly).
    // Verified: `authClient.getCookie()` resolves and type-checks after this
    // cast; remove it if a future @better-auth/expo release fixes its .d.ts.
    expoClient({
      // ADR-024 — this value is what the client sends as the `expo-origin`
      // header, so it MUST stay in sync with apps/mobile/app.json's
      // `expo.scheme` and apps/api's auth.instance.ts trustedOrigins entry.
      scheme: 'quiks',
      storagePrefix: 'quiks',
      // Pitfall 2 — expo-secure-store (encrypted OS keychain) is the ONLY
      // acceptable session store; never AsyncStorage/MMKV.
      storage: SecureStore,
    }) as BetterAuthClientPlugin,
    emailOTPClient(),
  ],
});

/**
 * otp-login-stuck-code-screen — keep better-auth's `session` atom permanently
 * mounted, from module-init onwards.
 *
 * WHY (root cause, reproduced in `lib/__tests__/`): `@better-auth/expo`'s
 * `expoClient.getActions()` hydrates the session atom from the SecureStore cache
 * during `createAuthClient()` above, via `sessionAtom.set({ ...sessionAtom.get() })`.
 * nanostores' `atom.get()` LAZY-MOUNTS an unmounted atom (`if (!lc) listen(noop)()`),
 * so on every boot of an already-logged-in visitor the atom mounts and unmounts
 * again with no subscriber — arming nanostores' 1000ms STORE_UNMOUNT_DELAY timer.
 *
 * If `RootNavigation`'s single `useSession()` subscription attaches after that
 * timer fires, the unmount destructor calls better-auth's `settleAbortedFetch()`,
 * whose first statement is another `session.get()`. That RE-MOUNTS the atom in the
 * middle of nanostores' `for (destroy of events[UNMOUNT]) destroy()` loop; because
 * a JS array iterator picks up elements pushed during iteration, the same loop then
 * runs the brand-new mount's destructor and tears the fresh session-refresh manager
 * straight back down — while `$store.active` is left `true`. Every later `listen()`
 * therefore SKIPS the mount callback, `$sessionSignal -> fetchSession` is never
 * subscribed, and no session refetch happens again for the life of the JS context.
 * The visible symptom was a login that verified server-side but never moved the
 * root guard off `/verify`.
 *
 * Holding one listener here makes `lc` non-zero before that timer can fire, so the
 * deferred unmount never runs and the re-entrancy can never trigger. The atom has
 * exactly one app-lifetime consumer anyway (`app/_layout.tsx`), so nothing is kept
 * alive that would not have been. `$store.listen` is better-auth's documented store
 * API; `app/_layout.tsx` additionally resolves auth from `getCookie()` so the app
 * stays correct even if this pin ever stops working.
 */
authClient.$store.listen('session', () => {});

// D-02 / Pitfall 10: better-auth issues a single 90-day sliding-window
// session (see apps/api/src/auth/auth.instance.ts's `session` config) — there
// is no refresh-token grant. On expiry, the only path is redirecting to OTP
// re-login (the root layout's guard falls back to `unauthenticated`); never
// add a client-side "silent refresh" attempt.
