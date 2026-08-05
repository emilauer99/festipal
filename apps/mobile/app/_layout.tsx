import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Localization from 'expo-localization';
import * as Linking from 'expo-linking';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@lingui/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { tokens } from '@festipal/ui';

import { queryClient } from '../lib/query-client';
import { activateUiLocale, i18n } from '../lib/i18n';
import { authClient } from '../lib/auth-client';
import { apiClient } from '../lib/api-client';
import { capturePendingDestination, consumePendingDestination } from '../lib/pending-destination';
import { FONT_DISPLAY, resolveFontFamily, useAppFonts } from '../lib/fonts';
import { FontsReadyProvider } from '../lib/fonts-context';

const { colors, typeRoles } = tokens;

// D-04: held until BOTH the UI locale (ADR-012 axis 1) AND the four-state
// auth guard below resolve, so no protected route ever flashes on cold start
// (Pitfall 5). The presentation shown while held is restyled to the real
// brand tokens (dark bgAppDeep + Outfit wordmark, see SplashView below).
SplashScreen.preventAutoHideAsync();

// D-04 / Pitfall 5 backstop — the cold-start session/festival resolve must
// not be able to deadlock the splash indefinitely on a hung request (a
// SecureStore read that never settles, or a stalled GET /me). Past this
// timeout the guard falls through to 'unauthenticated' (routes to Welcome)
// rather than holding the splash forever; if the real resolution finishes
// slightly after, its result still wins (no additional gate is added).
const AUTH_RESOLVE_TIMEOUT_MS = 8000;

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

// 03-04 addition — `GET /me`'s `profile` field lives entirely outside
// better-auth's own session atom (it's our own NestJS endpoint, not a
// better-auth plugin route), so completing a profile via
// `(profile-setup)/complete-profile` does NOT change `session`/`sessionPending`
// below and would never re-trigger `resolveAuthState` on its own. This
// module-level hook lets that screen ask the guard to re-check `GET /me`
// without introducing a global state library (plan's key_link:
// "apiClient.completeProfile -> guard re-resolves to authenticated").
let notifyMeMightHaveChanged: (() => void) | null = null;
export function refreshAuthState(): void {
  notifyMeMightHaveChanged?.();
}

// AUTH-04 logout robustness backstop — authClient.signOut()'s local session
// signal only updates on a SUCCESSFUL response (better-auth's client only
// broadcasts the sign-out session signal from its onSuccess path); an
// offline/failed signOut() never touches the SecureStore-cached cookie, so
// without this the guard would stay 'authenticated' and strand the visitor
// logged-in. `forceUnauthenticated()` sets the guard directly, independent
// of the session-derived resolveAuthState effect below, so the Festivals
// header's logout control always reaches Welcome. Same module-singleton
// idiom as `refreshAuthState` above.
let notifyForceLogout: (() => void) | null = null;
export function forceUnauthenticated(): void {
  notifyForceLogout?.();
}

// D-02 (SC-5) — Expo Router's parenthesized route groups ((auth),
// (profile-setup)) never appear in the resolved deep-link PATH (that's the
// whole point of the group syntax), so the "never capture an (auth)/
// (profile-setup) href itself" rule is enforced by the actual route paths
// those screens resolve to, not the folder names.
const AUTH_FLOW_PATHS = new Set(['', 'email', 'verify', 'complete-profile']);

export default function RootLayout() {
  const [localeReady, setLocaleReady] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
  const [meRefreshToken, setMeRefreshToken] = useState(0);
  const splashHiddenRef = useRef(false);
  const router = useRouter();
  // D-04 / Pitfall 5 — non-blocking: `fontsLoaded` gates ONLY which
  // `fontFamily` the SplashView's wordmark style resolves, never the
  // `bootstrapped`/`hideAsync()` decision below.
  const { fontsLoaded } = useAppFonts();

  // D-02 (SC-5) — deep-link capture is the FIRST effect declared in this
  // component, deliberately ungated by the locale/session bootstrap effects
  // below (Pitfall 2): `Linking.useLinkingURL()` always returns the
  // cold-launch URL immediately on every render, so this effect observes it
  // the instant the guard itself resolves to 'unauthenticated', regardless of
  // how long locale/session resolution takes. Never captures an
  // (auth)/(profile-setup) destination itself (content-leak boundary).
  const linkingUrl = Linking.useLinkingURL();
  useEffect(() => {
    if (!linkingUrl || authState.status !== 'unauthenticated') return;
    const { path } = Linking.parse(linkingUrl);
    if (!path) return;
    const normalizedPath = path.replace(/^\/+/, '');
    if (AUTH_FLOW_PATHS.has(normalizedPath)) return;
    capturePendingDestination(`/${normalizedPath}`);
  }, [linkingUrl, authState.status]);

  useEffect(() => {
    notifyMeMightHaveChanged = () => setMeRefreshToken((token) => token + 1);
    notifyForceLogout = () => setAuthState({ status: 'unauthenticated' });
    return () => {
      notifyMeMightHaveChanged = null;
      notifyForceLogout = null;
    };
  }, []);

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
  }, [session, sessionPending, meRefreshToken]);

  // D-04 / Pitfall 5 backstop — cold-start resolve timeout: if the guard is
  // still 'loading' after AUTH_RESOLVE_TIMEOUT_MS, force it to
  // 'unauthenticated' so `bootstrapped` can never be held indefinitely by a
  // hung SecureStore read or a stalled GET /me.
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthState((current) =>
        current.status === 'loading' ? { status: 'unauthenticated' } : current,
      );
    }, AUTH_RESOLVE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  // D-02 (SC-5) — consume+replay the captured deep-link destination ONLY on
  // the transition INTO 'authenticated' (never at 'authenticated-no-profile'
  // — a primitive-string dependency only re-runs this effect when the VALUE
  // changes, i.e. exactly on a state transition), so this survives the
  // profile-completion detour. The captured href is only ever replayed AFTER
  // the guard has independently reached 'authenticated' here — it can never
  // be used to bypass the guard's own check (threat T-4-06-E).
  useEffect(() => {
    if (authState.status !== 'authenticated') return;
    const href = consumePendingDestination();
    if (href) router.replace(href);
  }, [authState.status, router]);

  const bootstrapped = localeReady && authState.status !== 'loading';

  useEffect(() => {
    if (bootstrapped && !splashHiddenRef.current) {
      splashHiddenRef.current = true;
      void SplashScreen.hideAsync();
    }
  }, [bootstrapped]);

  // Splash stays up until locale + auth + profile are all resolved — this is
  // the load-bearing "no auth-flash" guarantee (SC-2). D-04: the presentation
  // is the real brand tokens (dark bgAppDeep + Outfit wordmark); this is
  // strictly a presentation change — `bootstrapped` (locale + auth state)
  // stays the SOLE gate, never a `useFonts()` gate (Pitfall 5).
  if (!bootstrapped) return <SplashView fontsLoaded={fontsLoaded} />;

  return (
    <SafeAreaProvider>
      <FontsReadyProvider ready={fontsLoaded}>
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
      </FontsReadyProvider>
    </SafeAreaProvider>
  );
}

/**
 * D-04 — the splash-hold presentation: dark `bgAppDeep` background + the
 * "festipal." wordmark in Outfit, falling back to the system font until
 * Outfit resolves (`resolveFontFamily`, non-blocking — Pitfall 5). The
 * wordmark brand name is NOT wrapped in Lingui (UI-SPEC Copywriting
 * Contract), matching the Welcome screen's identical pattern.
 */
function SplashView({ fontsLoaded }: { fontsLoaded: boolean }) {
  return (
    <View style={splashStyles.screen}>
      <Text
        style={[splashStyles.wordmark, { fontFamily: resolveFontFamily(FONT_DISPLAY, fontsLoaded) }]}
      >
        festipal
        <Text style={splashStyles.wordmarkDot}>.</Text>
      </Text>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgAppDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: typeRoles.wordmark.size,
    fontWeight: typeRoles.wordmark.weight,
    lineHeight: typeRoles.wordmark.size * typeRoles.wordmark.lineHeight,
    color: colors.textPrimary,
  },
  wordmarkDot: {
    color: colors.primary,
  },
});
