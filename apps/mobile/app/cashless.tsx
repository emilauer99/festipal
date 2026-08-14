import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
// The library's top-level export only re-exports `WebView` itself; its event
// types live in the `lib/WebViewTypes` subpath (no `exports` restriction in
// the package's `package.json`, so this deep import resolves cleanly).
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { Trans } from '@lingui/react/macro';
import { tokens } from '@quiks/ui';

import { resolveCashlessTarget } from '../lib/cashless-url';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { useHeaderClearance } from '../components/AppHeader';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

/**
 * 09-06 (D-09, ADR-011) — the Cashless push screen. Full-bleed WebView below
 * `AppHeader`'s push state (registered as `cashless` in `PUSH_SCREEN_ROUTES`,
 * push title "Cashless"). This is the SECOND ADR-011 boundary of this phase:
 * the Dashboard tile (Task 2) already gates the tile's own EXISTENCE on
 * `resolveCashlessTarget(festival.cashlessUrl)`, but a route param is a
 * mutable value passed by the CALLER, not a trusted internal value — this
 * screen re-validates it from scratch (T-09-23) and renders the error state
 * instead of a WebView if the re-check fails, rather than trusting the
 * param.
 *
 * EXPLICITLY NOT BUILT HERE (ADR-011, D-09) — write this comment before
 * anyone is tempted to "just quickly" add one of these:
 *   - no native balance element
 *   - no booking list
 *   - no pay QR
 *   - no rebuilt browser chrome (address bar, page title)
 * The app supplies the WebView frame. Everything past that boundary is the
 * cashless provider's own page — its internal states are the provider's
 * concern (ADR-011), never this app's.
 */
export default function CashlessScreen() {
  const params = useLocalSearchParams<{ uri?: string | string[] }>();
  const rawUri = Array.isArray(params.uri) ? params.uri[0] : params.uri;
  // T-09-23 — re-validated here, not trusted from the route param. The tile
  // (Task 2) only ever pushes an already-validated uri, but a route param is
  // a mutable value a caller controls — "trust no passed-through value"
  // holds regardless of what actually pushed this screen.
  const target = resolveCashlessTarget(rawUri);

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerClearance = useHeaderClearance();
  const fontsReady = useFontsReady();
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const buttonFont = fontFamilyForRole('title3', fontsReady);

  const webviewRef = useRef<WebView>(null);
  // Starts `true`: `source` is set on the very first render, so `onLoadStart`
  // fires before this component's first paint can observe a false->true
  // flicker either way — starting loading avoids a one-frame flash of blank
  // content before the native load event arrives.
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!target) {
    // A malformed/foreign uri reaching this screen (a tampered route param —
    // the tile itself never pushes an invalid one) renders the same error
    // copy as a load failure, minus the retry: there is nothing to reload,
    // the address itself never validated.
    return (
      <SafeAreaView style={styles.screen} edges={['bottom']}>
        <View style={[styles.centered, { paddingTop: headerClearance }]}>
          <Text style={[styles.error, { fontFamily: bodySmFont }]}>
            <Trans>Can't load Cashless right now.</Trans>
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  function handleLoadStart() {
    setIsLoading(true);
    setHasError(false);
  }

  function handleLoadEnd() {
    setIsLoading(false);
  }

  function handleError() {
    setIsLoading(false);
    setHasError(true);
  }

  function handleRetry() {
    // Reloads the WebView in place via ref — does NOT leave the screen and
    // does NOT re-fetch any app-level query (there is none for this screen).
    setHasError(false);
    webviewRef.current?.reload();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={[styles.webviewContainer, { paddingTop: headerClearance }]}>
        <WebView
          ref={webviewRef}
          source={{ uri: target.uri }}
          style={styles.webview}
          // T-09-22 — sandbox lock, single gate. `originWhitelist={['*']}` is
          // DELIBERATE, not a leftover default: the library's own whitelist
          // check runs BEFORE `onShouldStartLoadWithRequest` and, for any URL
          // that fails it, hands the URL to `Linking.openURL` instead of
          // calling our callback — a same-origin whitelist here would mean
          // every cross-origin navigation gets opened in the external
          // browser (or any app registered for its scheme) rather than
          // silently blocked. Passing `['*']` makes the whitelist check
          // always pass, so the library's external-open branch is
          // unreachable and the strict-origin callback below becomes the
          // SOLE gate — a `false` return blocks the navigation with no
          // external launch. Do not narrow this back to `[target.origin]`.
          originWhitelist={['*']}
          // T-09-22 — sandbox lock: any in-page navigation attempt whose
          // origin differs from the configured one is rejected, silently,
          // never opened externally (also rejects `about:blank` and any
          // unparsable URL via the `catch` below). This is now the WHOLE
          // ADR-011 sandbox — see the `originWhitelist` comment above for
          // why the whitelist itself must stay permissive.
          //
          // Residual platform caveat: on Android, `shouldOverrideUrlLoading`
          // (which this callback wraps) is not invoked for POST navigations
          // — a documented react-native-webview/WebView limitation shared by
          // both mechanisms, not something either can close.
          onShouldStartLoadWithRequest={(request: ShouldStartLoadRequest) => {
            try {
              return new URL(request.url).origin === new URL(target.origin).origin;
            } catch {
              return false;
            }
          }}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          onHttpError={handleError}
          // T-09-24 — no injectedJavaScript, no onMessage: the app reads
          // nothing out of the page and writes nothing into it.
        />

        {isLoading ? (
          <View style={styles.overlay} pointerEvents="none">
            <Text style={[styles.helper, { fontFamily: bodyFont }]}>
              <Trans>Loading Cashless…</Trans>
            </Text>
          </View>
        ) : null}

        {hasError ? (
          <View style={styles.overlay}>
            <Text style={[styles.error, { fontFamily: bodySmFont }]}>
              <Trans>Can't load Cashless right now.</Trans>
            </Text>
            <Pressable style={styles.retryButton} onPress={handleRetry}>
              <Text style={[styles.retryButtonText, { fontFamily: buttonFont }]}>
                <Trans>Retry</Trans>
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgApp },
    webviewContainer: { flex: 1 },
    webview: { flex: 1, backgroundColor: colors.bgApp },
    centered: {
      flex: 1,
      padding: layout.screenPad,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacingScale['sp-5'],
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.bgApp,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacingScale['sp-5'],
      padding: layout.screenPad,
    },
    helper: {
      fontSize: typeRoles.body.size,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    error: {
      fontSize: typeRoles.bodySm.size,
      color: colors.dangerText,
      textAlign: 'center',
    },
    retryButton: {
      minHeight: layout.hitMin,
      paddingHorizontal: spacingScale['sp-8'],
      backgroundColor: colors.primary,
      borderRadius: radiiScale['r-pill'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    retryButtonText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
  });
}
