import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import { MapPin, MapPinOff } from 'lucide-react-native';
import * as Location from 'expo-location';
import { tokens } from '@quiks/ui';
import type { ActivityGeo } from '@quiks/contracts';

import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { Chip } from './Chip';
import { Input } from './Input';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const CALLOUT_ICON_SIZE = 18;
const CAPTURE_ICON_SIZE = 16;
const CAPTURE_PENDING_OPACITY = 0.6;

/**
 * The three permission sub-states this block owns (ADR-017 §2, modeled 1:1
 * on `CameraScanPanel.tsx`'s `PermissionSubState` — 11-04-PLAN Task 2's
 * `read_first`). `pending` covers both "the hook hasn't read a status yet"
 * and "the one `requestPermission()` call this block fires is still in
 * flight" — the OS dialog itself renders on top of this state.
 */
type PermissionSubState = 'pending' | 'granted' | 'denied';

export type LocationCaptureBlockProps = {
  /** Free-text location value — always usable, regardless of permission state (ACT-05, graceful denial). */
  locationText: string;
  onLocationTextChange: (value: string) => void;
  /** The captured point, or `null` when none has been pinned (or it was removed). */
  geo: ActivityGeo | null;
  onGeoChange: (geo: ActivityGeo | null) => void;
};

/**
 * The "Treffpunkt" (meeting point) block of the create form (D-13,
 * 11-04-PLAN Task 2): a free-text `Input` (always present, never gated by
 * permission) plus EITHER a "Pin location" button OR, once a point is
 * captured, a removable `Chip` — never both. Modeled on
 * `CameraScanPanel.tsx`'s three-substate permission pattern; only the
 * state model and the denied-permission callout are reused, not its
 * arm/disarm scanning mechanics (there is no continuous capture here, only
 * one single position read per tap).
 *
 * The exact banned-call boundary this file must never cross (ADR-017 §2,
 * ADR-014): capturing a visitor's location for a "who is here" presence
 * signal, or on any cadence other than a single explicit tap, is the
 * disabled capability class this component exists to stay clear of — no
 * continuous position stream, no background-capable task, no last-known
 * position read, and no re-request of a background-scoped permission. Only
 * a single one-shot foreground position read, fired exclusively from the
 * "Pin location" press handler below.
 */
export function LocationCaptureBlock({
  locationText,
  onLocationTextChange,
  geo,
  onGeoChange,
}: LocationCaptureBlockProps) {
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const bodyStrongFont = fontFamilyForRole('bodyStrong', fontsReady);
  const buttonFont = fontFamilyForRole('title3', fontsReady);

  // ADR-017 §2 / D-13 — the permission hook, requested exactly once per
  // mount via the `useRef` guard below, never re-prompted on every render.
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const hasRequestedRef = useRef(false);
  const [isRequesting, setIsRequesting] = useState(true);

  useEffect(() => {
    if (hasRequestedRef.current) return;
    if (permission === null) return;
    if (permission.granted) {
      setIsRequesting(false);
      return;
    }
    hasRequestedRef.current = true;
    void requestPermission().finally(() => setIsRequesting(false));
  }, [permission, requestPermission]);

  function computePermissionSubState(): PermissionSubState {
    if (permission === null || isRequesting) return 'pending';
    return permission.granted ? 'granted' : 'denied';
  }

  const permissionSubState = computePermissionSubState();

  // The block's own capture-in-flight flag — separate from the permission
  // hook's `isRequesting`, since a granted visitor can still be mid-capture.
  const [isCapturing, setIsCapturing] = useState(false);

  // The ONE single position read this component ever performs — fired
  // exclusively from a tap on the "Pin location" button below, never from an
  // effect, never on mount, never repeated, and never subscribed to a
  // continuing stream or a device-level background task — this call and
  // nothing else is the whole capture (ADR-017 §2).
  async function handleCapturePress() {
    setIsCapturing(true);
    try {
      const result = await Location.getCurrentPositionAsync();
      onGeoChange({ lat: result.coords.latitude, lng: result.coords.longitude });
    } catch {
      // A failure here is NEVER a permission failure (the button only
      // renders in the `granted` sub-state) — no fix, a timeout, or
      // location services off at the OS level (UI-SPEC E5 error, backstop).
      // The block falls back to the un-captured state (already the case —
      // `onGeoChange` is simply not called) and the free-text field stays
      // fully usable; no dead loading state is left behind.
    } finally {
      setIsCapturing(false);
    }
  }

  function handleRemove() {
    onGeoChange(null);
  }

  return (
    <View style={styles.block}>
      <Input
        label={t`Meeting point`}
        value={locationText}
        onChangeText={onLocationTextChange}
        placeholder={t`More specific, e.g. row 3 · optional`}
      />

      {permissionSubState === 'pending' ? (
        <Text style={[styles.helper, { fontFamily: bodyFont }]}>
          <Trans>Loading…</Trans>
        </Text>
      ) : null}

      {permissionSubState === 'granted' && geo === null ? (
        <Pressable
          style={[styles.captureButton, isCapturing ? styles.captureButtonPending : null]}
          onPress={() => void handleCapturePress()}
          disabled={isCapturing}
          accessibilityRole="button"
          accessibilityLabel={t`Pin location`}
        >
          <MapPin size={CAPTURE_ICON_SIZE} color={colors.textPrimary} strokeWidth={2} />
          <Text style={[styles.captureButtonText, { fontFamily: bodyFont }]}>
            <Trans>Pin location</Trans>
          </Text>
        </Pressable>
      ) : null}

      {permissionSubState === 'granted' && geo !== null ? (
        <View style={styles.chipRow}>
          {/* UI-SPEC § Color item 3 — the SAME accent treatment as a selected
              tag/day chip; the chip's label is Katalogtext, never raw
              coordinates, so its width is bounded by copy, not numbers. */}
          <Chip label={t`Location pinned`} selected onRemove={handleRemove} />
        </View>
      ) : null}

      {/* ADR-017 §2 — fully graceful denial: no field of the form is locked,
          the free-text `Input` above stays usable, and there is no
          navigation escape hatch here (unlike CameraScanPanel's "Enter
          handle instead" link) — the free-text field right above already
          IS the escape hatch. */}
      {permissionSubState === 'denied' ? (
        <View style={styles.callout}>
          <MapPinOff
            size={CALLOUT_ICON_SIZE}
            color={colors.infoText}
            strokeWidth={2}
            style={styles.calloutIcon}
          />
          <View style={styles.calloutBody}>
            <Text style={[styles.calloutTitle, { fontFamily: bodyStrongFont }]}>
              <Trans>Location unavailable</Trans>
            </Text>
            {/* The full non-tracking reassurance, NEVER truncated (UI-SPEC E5
                long-text) — clipping this sentence would defeat its point. */}
            <Text style={[styles.calloutText, { fontFamily: bodySmFont }]}>
              <Trans>
                quiks uses your location once to pin a meeting point — no tracking, no location
                watching. Allow access in Settings, or just type the place instead.
              </Trans>
            </Text>
            <Pressable
              style={styles.calloutPrimaryButton}
              onPress={() => void Linking.openSettings()}
              accessibilityRole="button"
              accessibilityLabel={t`Open Settings`}
            >
              <Text style={[styles.calloutPrimaryButtonText, { fontFamily: buttonFont }]}>
                <Trans>Open Settings</Trans>
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    block: { gap: spacingScale['sp-4'] },
    helper: {
      fontSize: typeRoles.body.size,
      color: colors.textSecondary,
    },
    captureButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacingScale['sp-3'],
      minHeight: layout.hitMin,
      paddingHorizontal: spacingScale['sp-6'],
      backgroundColor: colors.fillQuiet,
      borderRadius: radiiScale['r-pill'],
    },
    captureButtonPending: {
      opacity: CAPTURE_PENDING_OPACITY,
    },
    captureButtonText: {
      fontSize: typeRoles.body.size,
      color: colors.textPrimary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacingScale['sp-4'],
    },
    // D-13 — same `fillInfoQuiet`/`borderInfo`/`infoText` trio + `r-card`
    // radius as `CameraScanPanel`'s own denied-permission callout.
    callout: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacingScale['sp-5'],
      paddingHorizontal: spacingScale['sp-6'],
      paddingVertical: spacingScale['sp-6'],
      backgroundColor: colors.fillInfoQuiet,
      borderRadius: radiiScale['r-card'],
      borderWidth: 1,
      borderColor: colors.borderInfo,
    },
    calloutIcon: { marginTop: spacingScale['sp-2'] },
    calloutBody: { flexGrow: 1, flexShrink: 1, minWidth: 0, gap: spacingScale['sp-4'] },
    calloutTitle: {
      fontSize: typeRoles.bodyStrong.size,
      lineHeight: typeRoles.bodyStrong.size * typeRoles.bodyStrong.lineHeight,
      color: colors.infoText,
    },
    calloutText: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textSecondary,
    },
    calloutPrimaryButton: {
      minHeight: layout.hitMin,
      alignSelf: 'flex-start',
      paddingHorizontal: spacingScale['sp-8'],
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: radiiScale['r-pill'],
    },
    calloutPrimaryButtonText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
  });
}
