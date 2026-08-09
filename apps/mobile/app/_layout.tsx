import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Localization from 'expo-localization';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@lingui/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { tokens } from '@festipal/ui';

import { queryClient } from '../lib/query-client';
import { activateUiLocale, i18n } from '../lib/i18n';
import { authClient } from '../lib/auth-client';
import { apiClient } from '../lib/api-client';
import { capturePendingDestination, consumePendingDestination } from '../lib/pending-destination';
import { getActiveFestivalSlug } from '../lib/active-festival-storage';
import { reconstructDeepLinkRoute } from '../lib/deep-link';
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

// G-05-7 — fallback app scheme when `Constants.expoConfig?.scheme` is
// unavailable at runtime (e.g. a bare/unexpected config shape); matches
// app.json's `expo.scheme` ("festipal").
const APP_SCHEME_FALLBACK = 'festipal';

export default function RootLayout() {
  const [localeReady, setLocaleReady] = useState(false);
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
  const [meRefreshToken, setMeRefreshToken] = useState(0);
  const splashHiddenRef = useRef(false);
  // D-06 / HOME-01 (05-05) — guards the cold-start redirect (deep-link
  // replay OR active-festival focus) so it fires exactly once per cold
  // start, same one-shot idiom as `splashHiddenRef` — without it, a
  // logout-then-login cycle within the same app session (authState.status
  // cycling authenticated -> unauthenticated -> authenticated) would
  // re-trigger the redirect and hijack normal tab navigation later in the
  // session (REVIEW 05-05 HIGH acceptance note).
  const coldStartRedirectRef = useRef(false);
  const router = useRouter();
  // D-04 / Pitfall 5 — non-blocking: `fontsLoaded` gates ONLY which
  // `fontFamily` the SplashView's wordmark style resolves, never the
  // `bootstrapped`/`hideAsync()` decision below.
  const { fontsLoaded } = useAppFonts();

  // D-02 (SC-5) — deep-link capture is the FIRST effect declared in this
  // component, deliberately ungated by the locale/session bootstrap effects
  // below (Pitfall 2): `Linking.useLinkingURL()` always returns the
  // cold-launch URL immediately on every render, so this effect observes it
  // as soon as it fires, regardless of how long locale/session resolution
  // takes.
  //
  // G-05-7b (05-UAT.md) — capture is auth-agnostic: it fires REGARDLESS of
  // `authState.status` (an already-authenticated cold start captures a
  // fired deep link too, not only an unauthenticated one), so the deep link
  // wins over the persisted active-festival slug in BOTH auth paths.
  // `authState.status` stays in the dependency array so this effect
  // re-evaluates across state transitions — it is declared BEFORE the
  // redirect effect below, so on the 'authenticated' transition capture
  // runs first and the redirect effect consumes what it just stored.
  // This does NOT weaken the content-leak boundary (T-05-10-E / T-4-06-E
  // lineage): capture NEVER stores an (auth)/(profile-setup) path (the
  // AUTH_FLOW_PATHS guard below), and the captured href is only ever
  // REPLAYED by the redirect effect AFTER the guard has independently
  // reached 'authenticated' — the boundary is enforced at replay, not
  // capture.
  const linkingUrl = Linking.useLinkingURL();
  useEffect(() => {
    if (!linkingUrl) return;
    // G-05-7 — reconstruct the FULL route, not just `Linking.parse`'s
    // `path`: for the app's own custom scheme, the `new URL()`-based parser
    // puts the first path segment into `hostname` (URL authority), not
    // `path` (see lib/deep-link.ts for the full root-cause explanation).
    const rawScheme = Constants.expoConfig?.scheme;
    const appScheme = (Array.isArray(rawScheme) ? rawScheme[0] : rawScheme) ?? APP_SCHEME_FALLBACK;
    const route = reconstructDeepLinkRoute(Linking.parse(linkingUrl), appScheme);
    if (!route) return;
    if (AUTH_FLOW_PATHS.has(route)) return;
    capturePendingDestination(`/${route}`);
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
  //
  // 05-05 / D-06 (HOME-01) — extended with the active-festival cold-start
  // focus: the pending deep-link destination takes STRICT precedence
  // (REVIEW 05-05 HIGH) — if one exists, replay it and `return` IMMEDIATELY,
  // before the active-festival slug is ever read, so the deep link always
  // wins. Only when there is no pending href does the effect read the
  // persisted `active-festival-slug` (synchronous MMKV read, no new gate
  // before `SplashScreen.hideAsync()` — RESEARCH Pattern 4) and, if present,
  // open that festival's home directly. Both branches are guarded by
  // `coldStartRedirectRef` so this whole block runs at most once per cold
  // start.
  useEffect(() => {
    if (authState.status !== 'authenticated') return;
    if (coldStartRedirectRef.current) return;
    coldStartRedirectRef.current = true;

    const href = consumePendingDestination();
    if (href) {
      // Deep-link path captured at runtime (Linking.parse) — cannot be a typed-route literal
      // union member statically; typedRoutes (05-02) still validates every literal route
      // elsewhere in the app, this is the one intentionally-dynamic exception.
      router.replace(href as Href);
      return;
    }

    const activeFestivalSlug = getActiveFestivalSlug();
    if (activeFestivalSlug) {
      router.replace(`/f/${activeFestivalSlug}`);
    }
    // No pending href and no persisted slug: fall through to the guard's
    // default authenticated route — the Home tab (`(tabs)/_layout.tsx`
    // `initialRouteName="home"`).
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
                <Stack.Screen name="(tabs)" />
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
