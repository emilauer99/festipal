import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Localization from 'expo-localization';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@lingui/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { tokens } from '@quiks/ui';

import { queryClient } from '../lib/query-client';
import { activateUiLocale, i18n } from '../lib/i18n';
import { authClient } from '../lib/auth-client';
import { apiClient } from '../lib/api-client';
import { capturePendingDestination, consumePendingDestination } from '../lib/pending-destination';
import { getActiveFestivalSlug } from '../lib/active-festival-storage';
import { coldStartRedirectHref, resolveColdStartRedirect } from '../lib/cold-start-redirect';
import { ColdStartTargetContext } from '../lib/cold-start-target';
import { type AuthState, AuthStateContext } from '../lib/auth-state';
import { isIgnorableDeepLinkRoute, reconstructDeepLinkRoute } from '../lib/deep-link';
import { fontFamilyForRole, useAppFonts } from '../lib/fonts';
import { FontsReadyProvider, useFontsReady } from '../lib/fonts-context';
import { ThemeProvider, useTheme } from '../lib/theme-context';
import type { ThemeColors } from '../lib/theme';
import { WordmarkGlyph } from '../components/WordmarkGlyph';

const { typeRoles } = tokens;

// D-04: held until BOTH the UI locale (ADR-012 axis 1) AND the four-state
// auth guard below resolve, so no protected route ever flashes on cold start
// (Pitfall 5). The presentation shown while held is the real brand tokens —
// since 05.1/D-02 mode-dependent (`bgApp` + Outfit wordmark, see SplashView).
SplashScreen.preventAutoHideAsync();

// D-04 / Pitfall 5 backstop — the cold-start session/festival resolve must
// not be able to deadlock the splash indefinitely on a hung request (a
// SecureStore read that never settles, or a stalled GET /me). Past this
// timeout the guard falls through to 'unauthenticated' (routes to Welcome)
// rather than holding the splash forever; if the real resolution finishes
// slightly after, its result still wins (no additional gate is added).
//
// WR-09 (05-REVIEW.md), accepted tradeoff in product terms — the "result
// still wins" behavior means a visitor whose network/server is merely SLOW
// (not actually hung) can see the splash drop them onto Welcome, start
// typing an email/OTP, and then be silently yanked into Home/complete-profile
// a moment later when the original resolve finally lands. This is judged an
// acceptable rare edge case for this MVP slice (an 8s stall on `GET /me` is
// itself already unusual) versus the complexity of cancelling the in-flight
// resolve or debouncing a late result against user progress. Revisit if UAT
// or telemetry surfaces this as a real visitor-facing disruption.
const AUTH_RESOLVE_TIMEOUT_MS = 8000;

// first-login-unmatched-route (round 3) — the four-state `AuthState` union
// (Pitfall B / PITFALLS.md #5: a brand-new OTP account's `GET /me` returns
// `profile: null`, so there are FOUR states, not two) now lives in
// `lib/auth-state.ts` so the single `/` owner (`app/index.tsx`) can read the
// resolved state via `AuthStateContext` and pick its declarative redirect. The
// `Stack.Protected` guards below are still driven by this discriminated union,
// never a boolean flag.

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
//
// WR-05 (05-REVIEW.md) — this Set is hand-maintained and has NO compile-time
// link to the actual screen files below; it MUST be kept in sync by
// convention whenever a screen is added/removed/renamed in either group.
// Current members map 1:1 to (as of this fix):
//   app/(auth)/welcome.tsx           -> 'welcome'
//   app/(auth)/email.tsx             -> 'email'
//   app/(auth)/verify.tsx            -> 'verify'
//   app/(profile-setup)/complete-profile.tsx -> 'complete-profile'
// Adding a new screen to either group (e.g. a future `forgot-password` step)
// WITHOUT adding its resolved path here means it is treated as a normal
// deep-link destination — captured and potentially replayed post-login,
// defeating the content-leak boundary this guard exists to enforce (lines
// above).
//
// IN-01 (05-REVIEW.md) — no `''` member: `reconstructDeepLinkRoute`
// (lib/deep-link.ts) can only ever return `null` (zero segments) or a
// non-empty joined string, never `''`, and the capture effect below bails
// via `if (!route) return;` before this Set is even checked — so a `''`
// member would be dead/unreachable code. If a real group-index empty-path
// case is ever added, add it here explicitly with a comment, don't rely on
// this dead entry.
const AUTH_FLOW_PATHS = new Set(['welcome', 'email', 'verify', 'complete-profile']);

// G-05-7 — fallback app scheme when `Constants.expoConfig?.scheme` is
// unavailable at runtime (e.g. a bare/unexpected config shape); matches
// app.json's `expo.scheme` ("quiks", ADR-024).
const APP_SCHEME_FALLBACK = 'quiks';

/**
 * D-01 (05.1) — the root is now a thin provider shell so that BOTH branches of
 * `RootNavigation` below (the splash hold AND the bootstrapped app tree) render
 * inside `ThemeProvider`. A provider placed below the `bootstrapped` gate would
 * leave the splash — the very first surface a visitor sees — unthemed, which is
 * exactly the frame D-02 makes mode-dependent.
 *
 * `StatusBar style="auto"` lives here for the same reason: hell-first makes
 * Papier the default surface, and without an explicit status-bar style the
 * platform default keeps light icons that are unreadable on it. `"auto"` flips
 * the icons off the resolved colour scheme, so it needs no separate wiring to
 * `useTheme()`.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <RootNavigation />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigation() {
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
  // first-login-unmatched-route (round 3) — the resolved cold-start redirect
  // TARGET (Home / active festival / deep link). The guard-resolve effect below
  // decides it ONCE (consuming the pending deep-link href with the correct
  // ordering + one-shot guard) and stores it here; the single `/` owner
  // (app/index.tsx) reads it via ColdStartTargetContext and replays it with a
  // DECLARATIVE <Redirect>. This replaces the previous imperative
  // router.replace, which lost the race against Stack.Protected's guard-flip
  // reconciliation and left the app on the unmatched root path `/`.
  const [coldStartTarget, setColdStartTarget] = useState<Href | null>(null);
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
  //
  // WR-03 (05-REVIEW.md), accepted scope limitation for this MVP slice — the
  // ONLY consumer of a captured pending destination is the cold-start
  // redirect-decide effect below, which is one-shot per app process
  // (`coldStartRedirectRef`). A deep link tapped AFTER that one-shot has
  // already fired (e.g. a friend shares a link while the visitor is already
  // mid-session and authenticated) IS still captured here but is never
  // replayed — no in-session deep-link handling exists yet. This is a known
  // gap, not a regression of the cold-start fix above; a future phase adding
  // in-session deep links needs a second, non-one-shot consumer that reacts
  // to `linkingUrl` changes while already 'authenticated'.
  const linkingUrl = Linking.useLinkingURL();
  // WR-02 (05-REVIEW.md) — `Linking.useLinkingURL()` resolves the initial
  // launch URL ASYNCHRONOUSLY (a native bridge call under the hood), so on
  // the very first render(s) `linkingUrl` is `undefined`. Declaration order
  // alone only guarantees this capture effect and the redirect-decide effect
  // below run in that order WITHIN THE SAME COMMIT — it does NOT guarantee
  // `linkingUrl` has resolved before `resolveAuthState()`'s `GET /me` round
  // trip settles and flips `authState.status` to 'authenticated' (e.g. a
  // fast/local network, or a cached session skipping the round trip
  // entirely). `linkingResolved` makes "has Linking finished resolving at
  // least once" an explicit, observable flag instead of an incidental race,
  // so the redirect-decide effect below can wait on it rather than assume it.
  const [linkingResolved, setLinkingResolved] = useState(false);
  useEffect(() => {
    if (linkingUrl !== undefined) setLinkingResolved(true);
  }, [linkingUrl]);
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
    // first-login-unmatched-route (round 4) — Expo's Dev Client launches the
    // app via `quiks:///expo-development-client/?url=<metro-host>`; without
    // this guard that route was captured as a pending destination and replayed
    // as `/expo-development-client`, dead-ending on Expo's Unmatched Route on
    // every dev launch. Filtered here ALONGSIDE the AUTH_FLOW_PATHS guard so no
    // Expo-internal launch path is ever captured.
    if (isIgnorableDeepLinkRoute(route)) return;
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
  // (REVIEW 05-05 HIGH) — if one exists, replay it, so the deep link always
  // wins. Otherwise open the persisted `active-festival-slug` (synchronous
  // MMKV read, no new gate before `SplashScreen.hideAsync()` — RESEARCH
  // Pattern 4). This whole block is guarded by `coldStartRedirectRef` so it
  // runs at most once per cold start.
  //
  // first-login-unmatched-route (round 3) — this effect now only DECIDES the
  // cold-start redirect target; the navigation itself is performed
  // declaratively by the single `/` owner (app/index.tsx) via <Redirect>,
  // reading `coldStartTarget` through ColdStartTargetContext.
  //
  // Why the change: the previous imperative `router.replace(...)` here was
  // issued in the same commit as the `Stack.Protected` guard flip and lost the
  // race against Expo Router's own reconciliation, which reset the URL to `/`.
  // Expo Router resolves `/` from a STATIC, guard-agnostic linking map
  // (matchForEmptyPath), so with the only `/` route ((auth)/index) render-
  // filtered off once authenticated, Expo Router rendered its Unmatched Route
  // screen for quiks:/// — the reported bug, which neither the round-1
  // empty-state `router.replace('/home')` nor the round-2 second group-index
  // ((root)/index, which never won the static empty-path match) fixed. app/index
  // is now the SINGLE `/` owner, declared OUTSIDE every guard so it is mounted in
  // all auth states, and hands off with a declarative redirect immune to that
  // reconciliation race.
  //
  // The decision stays HERE (not in the route's render) deliberately:
  // `consumePendingDestination()` is a one-shot side effect and MUST run after
  // the deep-link capture effect above has stored the pending href. WR-02
  // (05-REVIEW.md) — declaration order alone only orders these two effects
  // WITHIN one commit; it does NOT guarantee `linkingUrl` has resolved before
  // `authState.status` reaches 'authenticated' (a fast/local `GET /me`, or a
  // cached session, can win that race). The explicit `linkingResolved` gate
  // below closes that gap: this effect now waits for BOTH conditions before
  // consuming, so a deep link that resolves slightly after auth still gets
  // captured (by the effect above, re-firing on the `linkingUrl` change) and
  // is guaranteed to still be pending when this effect re-fires on
  // `linkingResolved` flipping true. Exactly once still holds (the
  // coldStartRedirectRef one-shot also absorbs React StrictMode's dev
  // double-invoke). The pure, unit-tested resolver + mapper turn that into
  // the concrete href stored in state.
  useEffect(() => {
    if (authState.status !== 'authenticated') return;
    if (!linkingResolved) return;
    if (coldStartRedirectRef.current) return;
    coldStartRedirectRef.current = true;

    const redirect = resolveColdStartRedirect(consumePendingDestination(), getActiveFestivalSlug());
    // coldStartRedirectHref returns a runtime string (a deep-link path is
    // captured via Linking.parse and cannot be a typed-route literal union
    // member statically); typedRoutes (05-02) still validates every literal
    // route elsewhere — this is the one intentionally-dynamic exception.
    const resolvedHref = coldStartRedirectHref(redirect) as Href;
    setColdStartTarget(resolvedHref);
  }, [authState.status, linkingResolved]);

  // CR-01 (05-REVIEW.md) — reset the one-shot cold-start redirect state on
  // EVERY transition to 'unauthenticated', not just at process start. Without
  // this, `coldStartRedirectRef.current` and `coldStartTarget` survive a
  // logout that happens mid-session (no fresh app process): a subsequent
  // login (same or different account, same device) hits the redirect-decide
  // effect's one-shot guard and never recomputes, so `app/index.tsx` replays
  // whatever the FIRST login of the process resolved to — including another
  // account's active festival. This fires for both logout paths (the natural
  // `!session` branch above and `forceUnauthenticated()`'s explicit
  // `setAuthState({ status: 'unauthenticated' })`), since both funnel through
  // the same `authState.status` transition this effect watches.
  useEffect(() => {
    if (authState.status === 'unauthenticated') {
      coldStartRedirectRef.current = false;
      setColdStartTarget(null);
    }
  }, [authState.status]);

  const bootstrapped = localeReady && authState.status !== 'loading';

  useEffect(() => {
    if (bootstrapped && !splashHiddenRef.current) {
      splashHiddenRef.current = true;
      void SplashScreen.hideAsync();
    }
  }, [bootstrapped]);

  // Splash stays up until locale + auth + profile are all resolved — this is
  // the load-bearing "no auth-flash" guarantee (SC-2). D-04 / 05.1 D-02: the
  // presentation is the real brand tokens, resolved per mode (`bgApp` + Outfit
  // wordmark); this is strictly a presentation change — `bootstrapped` (locale
  // + auth state) stays the SOLE gate, never a `useFonts()` gate (Pitfall 5).
  // The splash branch gets its OWN `FontsReadyProvider`: `SplashView` now hosts
  // `WordmarkGlyph`, whose font gate reads `useFontsReady()`. Without a provider
  // above this branch the context default (`false`) would win and the glyph's
  // `q` could never appear on the splash at all. This changes nothing about the
  // gating itself — `bootstrapped` stays the SOLE splash gate.
  if (!bootstrapped) {
    return (
      <FontsReadyProvider ready={fontsLoaded}>
        <SplashView />
      </FontsReadyProvider>
    );
  }

  return (
    <FontsReadyProvider ready={fontsLoaded}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider i18n={i18n}>
          <AuthStateContext.Provider value={authState}>
            <ColdStartTargetContext.Provider value={coldStartTarget}>
              <Stack>
                {/* first-login-unmatched-route (round 3) — `index` (app/index.tsx)
                      is the SINGLE owner of path `/` and is declared OUTSIDE every
                      Stack.Protected block, so it is mounted in ALL auth states.
                      Expo Router resolves `/` from a static, guard-agnostic linking
                      map; keeping exactly one always-mounted `/` route means the
                      cold-start / guard-flip URL `/` can never dead-end on the
                      Unmatched Route screen. It reads AuthStateContext +
                      ColdStartTargetContext and hands off with a declarative
                      <Redirect>. */}
                <Stack.Screen name="index" />
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
            </ColdStartTargetContext.Provider>
          </AuthStateContext.Provider>
        </I18nProvider>
      </QueryClientProvider>
    </FontsReadyProvider>
  );
}

/**
 * D-04 / D-02 / D-07 (05.1) — the splash-hold presentation: the brand mark above
 * the "quiks." wordmark. The brand name is NOT wrapped in Lingui (UI-SPEC
 * Copywriting Contract), matching the Welcome screen's identical pattern.
 *
 * D-02: background and wordmark colour FOLLOW THE MODE — Papier `bgApp` + Ink
 * text in light, Ink `bgApp` + light text in dark. The trailing dot stays
 * `primary` (Beere) in BOTH modes; per CI §7 the dot must never be coloured
 * like the word. Styles are built inside the component off `useTheme()`, not in
 * a module-level `StyleSheet.create` — a module-level object freezes its
 * colours at import time and can never follow the mode.
 *
 * D-10: the wordmark resolves its family through `fontFamilyForRole('wordmark')`
 * (real Outfit 800) and carries NO numeric `fontWeight`. Until 05.1-06 this was
 * the last faux-bold render left in `apps/mobile/app` — handed over by plan
 * 05.1-05, which owned every screen but not this file. It now matches the
 * Welcome wordmark it is shown immediately before.
 *
 * The `WordmarkGlyph` mount is the item plan 05.1-07's device checkpoint asks
 * the developer to confirm or reject (see 05.1-06-PLAN.md's flagged assumption:
 * UI-SPEC E2 describes a runtime glyph, CONTEXT.md D-02 describes only the
 * wordmark text). Rejecting it is a one-line removal — the component and the
 * icon generator stay either way.
 */
function SplashView() {
  const { colors } = useTheme();
  const fontsReady = useFontsReady();
  const styles = useMemo(() => createSplashStyles(colors), [colors]);
  const wordmarkFont = fontFamilyForRole('wordmark', fontsReady);

  return (
    <View style={styles.screen}>
      <WordmarkGlyph width={SPLASH_GLYPH_WIDTH} />
      <Text style={[styles.wordmark, { fontFamily: wordmarkFont }]}>
        quiks
        <Text style={styles.wordmarkDot}>.</Text>
      </Text>
    </View>
  );
}

// derived: four times the wordmark type size. The mark's ink occupies roughly
// the middle 45% of its 1200x800 viewBox, so this renders a mark about twice
// the wordmark's cap height — proportional to the type role rather than a
// free-floating pixel value.
const SPLASH_GLYPH_WIDTH = typeRoles.wordmark.size * 4;

function createSplashStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bgApp,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wordmark: {
      fontSize: typeRoles.wordmark.size,
      letterSpacing: typeRoles.wordmark.letterSpacing,
      lineHeight: typeRoles.wordmark.size * typeRoles.wordmark.lineHeight,
      color: colors.textPrimary,
    },
    wordmarkDot: {
      color: colors.primary,
    },
  });
}
