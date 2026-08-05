import { useEffect, useState, type ReactNode } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@festipal/ui';

const { colors, layout, spacingScale } = tokens;

const BASE_BOTTOM_PAD = spacingScale['sp-8'];

/**
 * Shared auth/profile screen scaffold — owns the three cross-cutting mobile
 * layout concerns the Phase-4 device UAT surfaced:
 *   1. Safe-area insets (edges top+bottom) so headerless screens' CTAs clear
 *      the notch and the Android gesture bar.
 *   2. Keyboard avoidance so a focused input can always be scrolled clear of
 *      the soft keyboard.
 *   3. Vertical scrollability so content stays reachable when the keyboard
 *      covers the lower half of the screen.
 *
 * Why not `KeyboardAvoidingView` / `adjustResize`: from Expo SDK 54 Android is
 * always edge-to-edge (non-disableable), so the window no longer resizes when
 * the IME opens — the keyboard is drawn *over* the content and adjustResize /
 * KeyboardAvoidingView never shrink the ScrollView, leaving nothing to scroll
 * (quick-task 260805-lkr device UAT). Instead we read the live keyboard height
 * from the `Keyboard` API and add it as bottom padding on the scroll content,
 * so the covered region becomes scrollable on both platforms. iOS uses the
 * `Will` events for a frame-synced feel; Android only emits the `Did` events.
 *
 * Screens control their own vertical distribution via `contentContainerStyle`
 * (e.g. `justifyContent`); the wrapper supplies the screen padding.
 */
export function KeyboardScreen({
  children,
  contentContainerStyle,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          contentContainerStyle,
          // Extra bottom room equal to the keyboard height so the content the
          // IME covers can be scrolled up above it (edge-to-edge Android never
          // resizes the window, so this padding is the only scroll headroom).
          { paddingBottom: BASE_BOTTOM_PAD + keyboardHeight },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPad,
    paddingTop: layout.screenPad,
    paddingBottom: BASE_BOTTOM_PAD,
  },
});
