import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { CameraOff } from 'lucide-react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { tokens } from '@quiks/ui';
import type { VisitorSummary } from '@quiks/contracts';

import { AvatarTile } from './AvatarTile';
import { RelationAction } from './RelationAction';
import { apiClient } from '../lib/api-client';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import { friendKeys } from '../lib/friend-queries';
import { parseQuiksCodePayload } from '../lib/qr-payload';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const CALLOUT_ICON_SIZE = 18;
const AVATAR_ROW_SIZE = 40;
/**
 * The mounted camera preview's own height — fixed so the panel's layout
 * doesn't jump between the three sub-states (UI-SPEC § QR & Camera Contract:
 * "a full-bleed camera preview"). Large enough to be a comfortable aiming
 * target, small enough to still leave room for the hint line / confirmation
 * card below it inside the screen's own padding.
 */
const CAMERA_PREVIEW_HEIGHT = 320;
const SCAN_TARGET_SIZE = 200;

/**
 * The three permission sub-states this panel owns (D-15/D-16,
 * 08-05-PLAN action (1)). `pending` covers BOTH "the hook hasn't read a
 * status yet" (`permission === null`) and "the one `requestPermission()`
 * call this panel fires is still in flight" — the OS dialog itself renders
 * on top of this state, so from the app's own tree there is nothing to
 * distinguish.
 */
type PermissionSubState = 'pending' | 'granted' | 'denied';

/**
 * The scanner's own arm/disarm state (08-05-PLAN action (2) — the concrete
 * race this plan exists to close). `onBarcodeScanned` is only ever passed a
 * function while `kind === 'idle'`; every other kind sets the prop to
 * `undefined`, which is what actually stops the native callback from firing
 * again while a decoded code is still sitting in frame.
 */
type ScanState = { kind: 'idle' } | { kind: 'invalid' } | { kind: 'resolving'; username: string };

/**
 * The resolved-handle lookup's own view, following the same
 * `...ViewState`/`compute...State()` schema every query on the Friends
 * screen family already uses — except here a 404 is a NAMED outcome
 * (`notFound`), not folded into a generic "response error", because the
 * scan flow has its own dedicated copy for it (UI-SPEC Copywriting
 * Contract, "Scan — handle no longer valid").
 */
type LookupViewState =
  | { kind: 'loading' }
  | { kind: 'transportError' }
  | { kind: 'notFound' }
  | { kind: 'found'; summary: VisitorSummary };

/**
 * 08-05 / D-14/D-15/D-16 — the "Scannen" panel's entire content: the three
 * camera-permission sub-states, the decode/lookup flow and the scan
 * confirmation card. Owns nothing about the QR screen's own
 * `SegmentedControl` — `app/friends-qr.tsx` renders this component ONLY
 * while its `scan` segment is active, and unmounting it (not hiding it) is
 * what tears the camera down (T-08-18).
 */
export function CameraScanPanel() {
  const { t } = useLingui();
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const bodyStrongFont = fontFamilyForRole('bodyStrong', fontsReady);
  const buttonFont = fontFamilyForRole('title3', fontsReady);
  const linkFont = fontFamilyForRole('label', fontsReady);
  const nameFont = fontFamilyForRole('bodyStrong', fontsReady);
  const handleFont = fontFamilyForRole('bodySm', fontsReady);

  // D-15 — the permission hook. `permission` is `null` until the hook has
  // read a status at least once; `requestPermission` is called exactly once
  // per mount below, never on every render.
  const [permission, requestPermission] = useCameraPermissions();
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

  // T-08-21 — the entwaffnete Scanner: only `idle` ever hands
  // `onBarcodeScanned` a function; every other `kind` below sets the prop to
  // `undefined`, which is what stops the native callback from firing again
  // while a decoded code is still sitting in frame.
  const [scanState, setScanState] = useState<ScanState>({ kind: 'idle' });

  const scanUsername = scanState.kind === 'resolving' ? scanState.username : '';
  const scanQuery = useQuery({
    queryKey: friendKeys.handle(scanUsername),
    queryFn: () => apiClient.lookupVisitor({ params: { username: scanUsername } }),
    enabled: scanState.kind === 'resolving',
  });

  function computeLookupState(): LookupViewState {
    if (scanQuery.status === 'pending') return { kind: 'loading' };
    if (scanQuery.status === 'error') return { kind: 'transportError' };
    // A non-200 ts-rest result is a SUCCESSFUL React Query result, never
    // `status === 'error'` — same branch every other query on this screen
    // family already relies on. `lookupVisitor` only ever defines 200/404
    // (`packages/contracts/src/router.ts`), so "not 200" IS the named 404
    // outcome, not a generic "response" error.
    if (scanQuery.data.status !== 200) return { kind: 'notFound' };
    return { kind: 'found', summary: scanQuery.data.body };
  }

  const lookupState = scanState.kind === 'resolving' ? computeLookupState() : null;

  function resetScan() {
    setScanState({ kind: 'idle' });
  }

  // T-08-19/D-14 — the handler that turns a raw decode into either the
  // `invalid` state (no network call at all) or a `resolving` lookup. The
  // decoded string is NEVER handed to `Linking.openURL`, the router or a
  // WebView — `parseQuiksCodePayload` is the only thing that ever looks at
  // it before this function's own local state.
  function handleBarcodeScanned(result: BarcodeScanningResult) {
    const parsed = parseQuiksCodePayload(result.data);
    if (parsed === null) {
      setScanState({ kind: 'invalid' });
      return;
    }
    setScanState({ kind: 'resolving', username: parsed.username });
  }

  return (
    <ScrollView
      style={styles.scrollRoot}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {permissionSubState === 'pending' ? (
        <Text style={[styles.helper, { fontFamily: bodyFont }]}>
          <Trans>Loading…</Trans>
        </Text>
      ) : null}

      {permissionSubState === 'denied' ? (
        <View style={styles.callout}>
          <CameraOff
            size={CALLOUT_ICON_SIZE}
            color={colors.infoText}
            strokeWidth={2}
            style={styles.calloutIcon}
          />
          <View style={styles.calloutBody}>
            <Text style={[styles.calloutTitle, { fontFamily: bodyStrongFont }]}>
              <Trans>Camera unavailable</Trans>
            </Text>
            <Text style={[styles.calloutText, { fontFamily: bodySmFont }]}>
              <Trans>
                quiks uses the camera to scan a person's QR code and send friend requests. Allow
                access in Settings to scan.
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
            <Pressable
              style={styles.calloutLink}
              onPress={() => router.replace({ pathname: '/friends', params: { focusSearch: '1' } })}
              accessibilityRole="button"
              accessibilityLabel={t`Enter handle instead`}
            >
              <Text style={[styles.calloutLinkText, { fontFamily: linkFont }]}>
                <Trans>Enter handle instead</Trans>
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {permissionSubState === 'granted' ? (
        <View style={styles.grantedBlock}>
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanState.kind === 'idle' ? handleBarcodeScanned : undefined}
            />
            <View style={styles.scanTargetOverlay} pointerEvents="none" />
          </View>

          {/* UI-SPEC #53 — the granted sub-state IS the idle state: never a
              wordless camera feed, always exactly one hint/error/card slot
              below the preview. */}
          {scanState.kind === 'idle' ? (
            <Text style={[styles.helper, { fontFamily: bodyFont }]}>
              <Trans>Point the camera at the other person's quiks code.</Trans>
            </Text>
          ) : null}

          {scanState.kind === 'invalid' ? (
            <View style={styles.stateBlock}>
              <Text style={[styles.error, { fontFamily: bodySmFont }]}>
                <Trans>That's not a quiks code.</Trans>
              </Text>
              <Pressable
                style={styles.textLinkPressable}
                onPress={resetScan}
                accessibilityRole="button"
                accessibilityLabel={t`Scan again`}
              >
                <Text style={[styles.textLink, { fontFamily: linkFont }]}>
                  <Trans>Scan again</Trans>
                </Text>
              </Pressable>
            </View>
          ) : null}

          {scanState.kind === 'resolving' && lookupState?.kind === 'loading' ? (
            <Text style={[styles.helper, { fontFamily: bodyFont }]}>
              <Trans>Loading…</Trans>
            </Text>
          ) : null}

          {scanState.kind === 'resolving' && lookupState?.kind === 'transportError' ? (
            <View style={styles.stateBlock}>
              <Text style={[styles.error, { fontFamily: bodySmFont }]}>
                <Trans>
                  Can't reach the server — make sure your device is on the same Wi-Fi as the dev
                  API.
                </Trans>
              </Text>
              <Pressable
                style={styles.textLinkPressable}
                onPress={resetScan}
                accessibilityRole="button"
                accessibilityLabel={t`Scan again`}
              >
                <Text style={[styles.textLink, { fontFamily: linkFont }]}>
                  <Trans>Scan again</Trans>
                </Text>
              </Pressable>
            </View>
          ) : null}

          {scanState.kind === 'resolving' && lookupState?.kind === 'notFound' ? (
            <View style={styles.stateBlock}>
              <Text style={[styles.error, { fontFamily: bodySmFont }]}>
                <Trans>This code is no longer valid.</Trans>
              </Text>
              <Pressable
                style={styles.textLinkPressable}
                onPress={resetScan}
                accessibilityRole="button"
                accessibilityLabel={t`Scan again`}
              >
                <Text style={[styles.textLink, { fontFamily: linkFont }]}>
                  <Trans>Scan again</Trans>
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* D-14 — the confirmation card. Same `PersonRow`-style info block
              plus the SAME D-04 relation-mapped action set `RelationAction`
              already defines — this card sends NOTHING on its own; only a
              tap inside `RelationAction` triggers a mutation. */}
          {scanState.kind === 'resolving' && lookupState?.kind === 'found' ? (
            <View style={styles.confirmCard}>
              <Text style={[styles.confirmHeading, { fontFamily: bodyStrongFont }]}>
                <Trans>Add this person?</Trans>
              </Text>
              <View style={styles.confirmIdentityRow}>
                <AvatarTile
                  displayName={lookupState.summary.profile.displayName}
                  username={lookupState.summary.profile.username}
                  size={AVATAR_ROW_SIZE}
                />
                <View style={styles.confirmTextColumn}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.confirmName, { fontFamily: nameFont }]}
                  >
                    {lookupState.summary.profile.displayName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.confirmHandle, { fontFamily: handleFont }]}
                  >
                    @{lookupState.summary.profile.username}
                  </Text>
                </View>
              </View>
              {/* quick-260813-o08 D-F/D-G — same `router.replace` target and
                  call shape the permission-denied callout above already
                  uses (minus its `focusSearch` param), fired only once
                  `RelationAction`'s own mutation actually succeeds. Covers
                  BOTH success shapes this card can show (a fresh request
                  sent, or an existing counter-request accepted); the screen
                  change unmounts this panel and, by construction, tears the
                  camera down with it (T-08-18 stays intact — no
                  `useIsFocused`, no manual camera handling added). */}
              <RelationAction
                relation={lookupState.summary.relation}
                accountId={lookupState.summary.profile.accountId}
                onDone={() => router.replace('/friends')}
              />
              <Pressable
                style={styles.textLinkPressable}
                onPress={resetScan}
                accessibilityRole="button"
                accessibilityLabel={t`Scan again`}
              >
                <Text style={[styles.textLink, { fontFamily: linkFont }]}>
                  <Trans>Scan again</Trans>
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scrollRoot: { flex: 1 },
    scrollContent: { gap: spacingScale['sp-6'], paddingBottom: spacingScale['sp-8'] },
    helper: {
      fontSize: typeRoles.body.size,
      color: colors.textSecondary,
    },
    stateBlock: { gap: spacingScale['sp-2'], alignItems: 'flex-start' },
    // The status-hue rule: an error rendered as TEXT always resolves through
    // `dangerText`, never the bare `danger` fill.
    error: {
      fontSize: typeRoles.bodySm.size,
      color: colors.dangerText,
    },
    textLinkPressable: {
      minHeight: layout.hitMin,
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    textLink: {
      fontSize: typeRoles.label.size,
      color: colors.primary,
    },
    grantedBlock: { gap: spacingScale['sp-6'] },
    cameraContainer: {
      height: CAMERA_PREVIEW_HEIGHT,
      borderRadius: radiiScale['r-card'],
      overflow: 'hidden',
      backgroundColor: colors.surfaceInset,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Decorative only (UI-SPEC § QR & Camera Contract): this sits on
    // unpredictable live video, so it is the one deliberate exception that
    // stays a fixed, reduced-opacity outline instead of a themed surface.
    scanTargetOverlay: {
      position: 'absolute',
      width: SCAN_TARGET_SIZE,
      height: SCAN_TARGET_SIZE,
      borderWidth: 2,
      borderColor: colors.primaryForeground,
      opacity: 0.6,
      borderRadius: radiiScale['r-md'],
    },
    // D-16 — same `fillInfoQuiet`/`borderInfo`/`infoText` trio the SafeNow
    // callout (`mehr.tsx`) already established, but `r-card` radius here per
    // UI-SPEC (a deliberate, documented deviation from the SafeNow `r-md`
    // precedent). Content-sized inside the panel's own ScrollView, never a
    // fixed height, so the longest catalog string never clips (UI-SPEC #54).
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
    calloutLink: {
      minHeight: layout.hitMin,
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    calloutLinkText: {
      fontSize: typeRoles.label.size,
      lineHeight: typeRoles.label.size * typeRoles.label.lineHeight,
      color: colors.infoText,
    },
    // D-14 — the confirmation card: `r-card` radius, `surfaceCard`
    // background, same border/padding treatment as `PersonRow`'s own card.
    confirmCard: {
      gap: spacingScale['sp-5'],
      padding: spacingScale['sp-6'],
      backgroundColor: colors.surfaceCard,
      borderRadius: radiiScale['r-card'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    confirmHeading: {
      fontSize: typeRoles.bodyStrong.size,
      lineHeight: typeRoles.bodyStrong.size * typeRoles.bodyStrong.lineHeight,
      color: colors.textPrimary,
    },
    confirmIdentityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-4'],
    },
    confirmTextColumn: { flexGrow: 1, flexShrink: 1, minWidth: 0, gap: spacingScale['sp-1'] },
    confirmName: {
      fontSize: typeRoles.bodyStrong.size,
      lineHeight: typeRoles.bodyStrong.size * typeRoles.bodyStrong.lineHeight,
      color: colors.textPrimary,
    },
    // UI-SPEC § Color item 3 — the same brand-text handle treatment every
    // `PersonRow` already uses.
    confirmHandle: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.primary,
    },
  });
}
