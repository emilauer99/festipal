import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Localization from 'expo-localization';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@lingui/react';

import { queryClient } from '../lib/query-client';
import { activateUiLocale, i18n } from '../lib/i18n';
import { authClient } from '../lib/auth-client';
import { apiClient } from '../lib/api-client';

// D-04: splash/icon stay a plain "festipal" wordmark placeholder (no branding
// assets this phase) — held until BOTH the UI locale (ADR-012 axis 1) AND the
// four-state auth guard below resolve, so no protected route ever flashes on
// cold start (Pitfall 5).
SplashScreen.preventAutoHideAsync();

/**
 * Pitfall B / PITFALLS.md #5 — a route guard MUST branch on more than
 * `!!session`. A brand-new OTP account's `GET /me` returns `profile: null`
 * (Phase 2), so there are FOUR states, not two: still resolving, no session,
 * session-but-no-profile, and fully authenticated. `Stack.Protected` guards
 * below are driven by this discriminated union, never a boolean flag.
 */
type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated-no-profile' }
  | { status: 'authenticated' };

export default function RootLayout() {
  const [localeReady, setLocaleReady] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
  const splashHiddenRef = useRef(false);

  // better-auth's React hook surface (verified against the installed
  // @better-auth/expo/better-auth version, RESEARCH.md A2) — NOT a
  // `.subscribe()`-based store as first sketched in RESEARCH.md Pattern 1;
  // `useSession()` is a plain hook returning `{ data, isPending }`.
  const { data: session, isPending: sessionPending } = authClient.useSession();

  useEffect(() => {
    async function bootstrapLocale() {
      const deviceLocales = Localization.getLocales().map((locale) => locale.languageTag);
      await activateUiLocale(deviceLocales);
      setLocaleReady(true);
    }
    void bootstrapLocale();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function resolveAuthState() {
      if (sessionPending) return; // still reading SecureStore — stay 'loading'
      if (!session) {
        if (!cancelled) setAuthState({ status: 'unauthenticated' });
        return;
      }
      // Session cookie present — resolve the THIRD dimension (profile
      // presence) via GET /me before deciding where the guard routes.
      const me = await apiClient.getMe();
      if (cancelled) return;
      if (me.status === 200) {
        setAuthState(
          me.body.profile ? { status: 'authenticated' } : { status: 'authenticated-no-profile' },
        );
      } else {
        // D-02 / Pitfall 10 — the cookie exists but the server rejected it
        // (expired/invalid session). No refresh flow: fall back to
        // unauthenticated so the guard routes to (auth) for OTP re-login.
        setAuthState({ status: 'unauthenticated' });
      }
    }

    void resolveAuthState();
    return () => {
      cancelled = true;
    };
  }, [session, sessionPending]);

  const bootstrapped = localeReady && authState.status !== 'loading';

  useEffect(() => {
    if (bootstrapped && !splashHiddenRef.current) {
      splashHiddenRef.current = true;
      void SplashScreen.hideAsync();
    }
  }, [bootstrapped]);

  // Splash stays up (nothing rendered) until locale + auth + profile are all
  // resolved — this is the load-bearing "no auth-flash" guarantee (SC-2).
  if (!bootstrapped) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider i18n={i18n}>
        <Stack>
          <Stack.Protected guard={authState.status === 'unauthenticated'}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={authState.status === 'authenticated-no-profile'}>
            <Stack.Screen name="(profile-setup)" />
          </Stack.Protected>
          <Stack.Protected guard={authState.status === 'authenticated'}>
            <Stack.Screen name="festivals" />
            <Stack.Screen name="(festival)" />
          </Stack.Protected>
        </Stack>
      </I18nProvider>
    </QueryClientProvider>
  );
}
