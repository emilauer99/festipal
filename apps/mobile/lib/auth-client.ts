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

// D-02 / Pitfall 10: better-auth issues a single 90-day sliding-window
// session (see apps/api/src/auth/auth.instance.ts's `session` config) — there
// is no refresh-token grant. On expiry, the only path is redirecting to OTP
// re-login (the root layout's guard falls back to `unauthenticated`); never
// add a client-side "silent refresh" attempt.
