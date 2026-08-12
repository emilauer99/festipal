import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@quiks/ui';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

/** UI-SPEC § Component Inventory — short enough that no manual dismiss control is needed. */
const TOAST_DURATION_MS = 2400;

/** Shows an already-localized "kommt bald" message. A new call replaces a visible one. */
export type ShowSoonToast = (message: string) => void;

/**
 * D-13 — THE single "coming soon" mechanism for the whole app, shared by Profil,
 * Mehr and Friends. Not the design's info sheet, and deliberately not six
 * different solutions.
 *
 * Same "safe default outside a provider" idiom as `useTheme()`
 * (lib/theme-context.tsx): the default value is a documented no-op rather than a
 * throw, so a stray consumer can never crash a screen over a purely decorative
 * hint.
 */
const SoonToastContext = createContext<ShowSoonToast>(() => undefined);

/**
 * Mounts the single toast slot. Belongs INSIDE `ThemeProvider` (see
 * `app/_layout.tsx`) — the pill resolves its colours through `useTheme()`, and
 * inside `SafeAreaProvider`, because it offsets itself by the bottom inset.
 *
 * Single-slot by construction: one piece of state, one timer. A new call
 * replaces the visible message instantly and restarts the timer, so two hints
 * can never stack up and no timer can outlive the message it belongs to
 * (T-06-16).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ShowSoonToast>((next) => {
    // Replace: drop the previous timer before starting a new one, otherwise the
    // older timer would hide the NEWER message early.
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    setMessage(next);
    // WR-04 (06-REVIEW.md) — the pill's own `accessibilityLiveRegion` (see
    // SoonToast below) is an ANDROID-ONLY prop, which left this toast — the
    // single app-wide feedback for every dead row (D-13) — completely silent
    // under iOS VoiceOver: half the device base got no response to the tap at
    // all, the exact dead interaction T-06-18 exists to prevent. Announcing
    // imperatively covers both platforms. On Android it is redundant with the
    // live region rather than harmful, so the live region STAYS — it is the
    // platform-native path there and needs no behaviour change.
    //
    // NOT verifiable off-device: this needs VoiceOver on a real iOS build.
    AccessibilityInfo.announceForAccessibility(next);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setMessage(null);
    }, TOAST_DURATION_MS);
  }, []);

  // Unmount: a pending auto-dismiss must never land a state update on a removed
  // component.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return (
    <SoonToastContext.Provider value={show}>
      {children}
      {message === null ? null : <SoonToast message={message} />}
    </SoonToastContext.Provider>
  );
}

/**
 * The write side of the toast, for every dead row in this phase.
 *
 * Callers build the sentence themselves through Lingui (the "{Feature} kommt
 * bald." pattern from the Copywriting Contract) and hand it over finished — this
 * module owns no copy at all, so the catalog collects those sentences where they
 * belong contextually and the primitive stays free of copy decisions.
 */
export function useSoonToast(): ShowSoonToast {
  return useContext(SoonToastContext);
}

/**
 * The pill itself. Neutral on purpose — the accent is reserved this phase for the
 * nav pill, the avatar, the handle and the dark-mode switch (UI-SPEC § Color).
 *
 * Non-interactive: it renders no dismiss control and lets every touch pass
 * through, so it can never swallow a tap meant for the screen underneath
 * (T-06-15). The message is rendered as a plain text node and is never
 * interpreted as markup (T-06-17).
 */
export function SoonToast({ message }: { message: string }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const textFont = fontFamilyForRole('bodySm', fontsReady);

  return (
    <View
      // T-06-15 — the vertical offset is derived from the nav's own layout
      // tokens plus the bottom safe-area inset, so the pill floats clear of the
      // FloatingNav instead of covering the app's only global navigation. It
      // holds on screens without a nav bar too; there it just sits a little
      // higher.
      style={[
        styles.wrapper,
        { bottom: layout.navHeight + layout.navInset + insets.bottom + spacingScale['sp-4'] },
      ]}
      // T-06-18 — announced by screen readers on its own; a purely visual hint
      // would be invisible to them.
      accessibilityLiveRegion="polite"
    >
      <View style={styles.pill}>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[styles.text, { fontFamily: textFont }]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // UI-SPEC #37 — insetting the wrapper by one screen padding per side caps
    // the pill at screen width minus two screen paddings without reading
    // Dimensions, so it stays correct across rotation and split screen.
    wrapper: {
      position: 'absolute',
      left: layout.screenPad,
      right: layout.screenPad,
      alignItems: 'center',
      zIndex: 10,
      pointerEvents: 'none',
    },
    pill: {
      backgroundColor: colors.surfaceInset,
      borderRadius: radiiScale['r-md'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: spacingScale['sp-6'],
      paddingVertical: spacingScale['sp-5'],
    },
    text: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textPrimary,
      textAlign: 'center',
    },
  });
}
