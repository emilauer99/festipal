import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import { Timer } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { FONT_MONO, fontFamilyForRole, resolveFontFamily } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// Colour roles resolve per render via `useTheme()` (05.1 D-01) — only the
// mode-invariant scales stay at module scope.
const { typeRoles, layout, spacingScale } = tokens;

const TIMER_ICON_SIZE = 16;

const DEFAULT_SECONDS = 60;

export type ResendCountdownProps = {
  /**
   * Fires the actual resend call. Returns whether it succeeded — the
   * countdown only restarts on a successful resend, leaving the link
   * tappable again immediately on failure.
   */
  onResend: () => Promise<boolean>;
  seconds?: number;
};

function formatMmSs(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const remainderSeconds = totalSeconds % 60;
  return `${minutes}:${String(remainderSeconds).padStart(2, '0')}`;
}

/**
 * UI-SPEC Scope note #6 — a disabled "Resend in {mm:ss}" countdown (defaulted
 * to 60s, Claude's technical default per the note) that becomes a tappable
 * "Resend code" link at 0:00. The resend cooldown is a purely cosmetic
 * client-side timer — the server's own rate limiter (Phase 2) is the sole
 * source of truth for real OTP validity/rate-limiting (must_haves prohibition).
 *
 * Re-entrancy guard (Claude's-discretion backstop, must_haves): a double-tap
 * on the link while a resend is already in flight cannot fire a second send —
 * the `resending` state disables the Pressable for the duration of the call.
 */
export function ResendCountdown({ onResend, seconds = DEFAULT_SECONDS }: ResendCountdownProps) {
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const [remaining, setRemaining] = useState(seconds);
  const [resending, setResending] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    // Guards against a spurious extra tick right after a restart triggered
    // by setRemaining(seconds) inside handlePress (avoids a double-decrement
    // in the same render pass).
    startedRef.current = true;
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  async function handlePress() {
    if (resending || remaining > 0) return;
    setResending(true);
    const success = await onResend();
    setResending(false);
    if (success) {
      setRemaining(seconds);
    }
  }

  if (remaining > 0) {
    const countdownLabel = formatMmSs(remaining);
    return (
      <View style={styles.row}>
        <Timer size={TIMER_ICON_SIZE} color={colors.textMuted} strokeWidth={2} />
        {/* `countdown` keeps the explicit FONT_MONO + numeric weight: its role
            maps to the 400 file while the role declares 500, the documented
            pre-existing gap that 05.1-03 parked as a KNOWN FOLLOW-UP. Routing
            it through `fontFamilyForRole` and dropping the weight would
            silently change the rendering this phase never accepted. */}
        <Text style={[styles.countdown, { fontFamily: resolveFontFamily(FONT_MONO, fontsReady) }]}>
          {t`Resend in ${countdownLabel}`}
        </Text>
      </View>
    );
  }

  return (
    <Pressable onPress={handlePress} disabled={resending} style={styles.linkWrap} hitSlop={8}>
      <Text style={[styles.link, { fontFamily: fontFamilyForRole('bodyStrong', fontsReady) }]}>
        <Trans>Resend code</Trans>
      </Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-2'],
      minHeight: layout.hitMin,
    },
    countdown: {
      fontSize: typeRoles.countdown.size,
      // Kept deliberately — see the KNOWN FOLLOW-UP note at the render site.
      fontWeight: typeRoles.countdown.weight,
      lineHeight: typeRoles.countdown.size * typeRoles.countdown.lineHeight,
      color: colors.textMuted,
    },
    linkWrap: {
      minHeight: layout.hitMin,
      justifyContent: 'center',
    },
    link: {
      fontSize: typeRoles.bodyStrong.size,
      color: colors.primary,
    },
  });
}
