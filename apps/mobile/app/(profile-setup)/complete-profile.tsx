import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus } from 'lucide-react-native';
import { tokens } from '@quiks/ui';

import { apiClient } from '../../lib/api-client';
import { getLocalAvatarUri, saveLocalAvatarUri } from '../../lib/avatar-storage';
import { suggestAvailableUsername } from '../../lib/username-suggestion';
import { NETWORK_TIMEOUT_MS, withTimeout } from '../../lib/with-timeout';
import { fontFamilyForRole } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import type { ThemeColors } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';
import { AvatarTile } from '../../components/AvatarTile';
import { KeyboardScreen } from '../../components/KeyboardScreen';
import { refreshAuthState } from '../_layout';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radii, spacingScale } = tokens;

// D-03 — client soft-caps mirroring the server's authoritative
// packages/db/src/schema/visitor-profile.ts `.extend()` caps (04-02); the
// server is still the real gate (a valid-looking client input is never
// silently rejected server-side for length, IDN-01 backstop truth).
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const DISPLAY_NAME_MAX = 40;
const USERNAME_DEBOUNCE_MS = 350;

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';

/**
 * D-01/IDN-01 — the real first-login VisitorProfile write. Username has a
 * debounced live-availability check (`GET /me/username-availability`) and a
 * user-typed displayName. The `completeProfile` + `refreshAuthState()` wiring
 * is preserved verbatim from 04-03 — the request body stays
 * `{ username, displayName }` only, avatar is NEVER added (D-01, prohibition).
 *
 * 04-05 additions: a device-local avatar picker (gallery + camera ->
 * avatar-storage.ts MMKV, D-01) and the full username-taken state — both the
 * live-check "taken" branch AND a completeProfile 409 (the DB's
 * lower(username) unique index is the only source of a 409 here, i.e. a 409
 * IS a username-taken event) render the same two Copywriting-Contract lines,
 * with a fresh, availability-verified, <=20-char suggestion (IDN-01).
 */
export default function CompleteProfileScreen() {
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10) — no numeric `fontWeight` sits on top.
  const headingFont = fontFamilyForRole('display2', fontsReady);
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const labelFont = fontFamilyForRole('label', fontsReady);
  const microFont = fontFamilyForRole('micro', fontsReady);
  const ctaFont = fontFamilyForRole('title3', fontsReady);
  // GET /me is the typed source of `accountId` (the avatar-storage MMKV key,
  // D-01/Open Question 1) — this screen only mounts once the root guard's own
  // GET /me call already resolved `authenticated-no-profile`, so this is a
  // cheap, already-warm re-fetch (React Query caches by queryKey), not a new
  // cold round-trip.
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiClient.getMe() });
  const accountId =
    meQuery.status === 'success' && meQuery.data.status === 200
      ? meQuery.data.body.accountId
      : undefined;

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [debouncedUsername, setDebouncedUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  // Set on a completeProfile 409 (TOCTOU race — someone else grabbed this
  // exact username between the live-check and submit); cleared the instant
  // the visitor edits the username field again.
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedUsername(username), USERNAME_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [username]);

  const settled = username.length >= USERNAME_MIN && debouncedUsername === username;

  const availabilityQuery = useQuery({
    queryKey: ['username-availability', debouncedUsername],
    queryFn: () => apiClient.usernameAvailability({ query: { username: debouncedUsername } }),
    enabled: settled,
  });

  let usernameStatus: UsernameStatus;
  if (!settled) {
    usernameStatus = 'idle';
  } else if (availabilityQuery.status === 'pending') {
    usernameStatus = 'checking';
  } else if (availabilityQuery.status === 'error') {
    usernameStatus = 'idle';
  } else if (availabilityQuery.data.status === 200 && availabilityQuery.data.body.available) {
    usernameStatus = 'available';
  } else {
    usernameStatus = 'taken';
  }

  // Unifies BOTH taken triggers (live-check + completeProfile 409) into one
  // visual/copy state (must_haves truth: "on completeProfile 409 the
  // suggestion is regenerated").
  const isUsernameTaken = usernameStatus === 'taken' || conflict;

  useEffect(() => {
    if (!isUsernameTaken) {
      setSuggestion(null);
      return;
    }
    let cancelled = false;
    void suggestAvailableUsername(username, async (candidate) => {
      const result = await apiClient.usernameAvailability({ query: { username: candidate } });
      return result.status === 200 && result.body.available;
    }).then((candidate) => {
      if (!cancelled) setSuggestion(candidate);
    });
    return () => {
      cancelled = true;
    };
  }, [isUsernameTaken, username]);

  // Load a previously-picked avatar (D-01: survives restart on this device,
  // keyed by accountId so a second account never sees the first's photo).
  useEffect(() => {
    if (!accountId) return;
    const storedUri = getLocalAvatarUri(accountId);
    if (storedUri) setAvatarUri(storedUri);
  }, [accountId]);

  const displayNameTrimmed = displayName.trim();
  const canSubmit =
    usernameStatus === 'available' && !conflict && displayNameTrimmed.length > 0 && !submitting;

  async function pickFromLibrary() {
    if (!accountId) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    // D-01: the URI string only, device-local, never uploaded.
    saveLocalAvatarUri(accountId, asset.uri);
    setAvatarUri(asset.uri);
  }

  async function takePhoto() {
    if (!accountId) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    saveLocalAvatarUri(accountId, asset.uri);
    setAvatarUri(asset.uri);
  }

  function handleUsernameChange(value: string) {
    setConflict(false);
    setUsername(
      value
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, '')
        .slice(0, USERNAME_MAX),
    );
  }

  async function handleDone() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await withTimeout(
        apiClient.completeProfile({
          // D-01 prohibition — body SHAPE stays {username, displayName}; no
          // avatar field is ever added, visitor_profile.avatar stays null.
          body: { username, displayName: displayNameTrimmed },
        }),
        NETWORK_TIMEOUT_MS,
      );
      if (result.status === 409) {
        // TOCTOU (Pitfall 11) — the advisory live-check above is never
        // authoritative; the DB lower(username) unique index + this 409 branch
        // is the real, race-proof check. Stay on-screen, surface the same
        // taken-state UI as a live-check "taken" (regenerates the suggestion).
        setConflict(true);
        return;
      }
      if (result.status !== 200) {
        setSubmitError(
          t`Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.`,
        );
        return;
      }
      // Success — ask the root guard to re-check GET /me. This profile isn't
      // part of better-auth's own session, so nothing else would trigger it.
      refreshAuthState();
    } catch {
      // Phase-4 UAT fix — a timed-out/unreachable submit surfaces the network
      // error instead of leaving the CTA stuck on "Saving…".
      setSubmitError(
        t`Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  function renderUsernameHelper() {
    if (isUsernameTaken) {
      return (
        <View style={styles.helperTakenBlock}>
          <Text style={[styles.helperDanger, { fontFamily: bodySmFont }]}>
            <Trans>@{username} is already taken.</Trans>
          </Text>
          {suggestion ? (
            <Text style={[styles.helperDanger, { fontFamily: bodySmFont }]}>
              <Trans>Try something else, like @{suggestion}.</Trans>
            </Text>
          ) : null}
        </View>
      );
    }
    if (usernameStatus === 'checking') {
      return (
        <Text style={[styles.helperMuted, { fontFamily: bodySmFont }]}>
          <Trans>Checking…</Trans>
        </Text>
      );
    }
    if (usernameStatus === 'available') {
      return (
        <Text style={[styles.helperSuccess, { fontFamily: bodySmFont }]}>
          <Trans>@{username} is available</Trans>
        </Text>
      );
    }
    return (
      <Text style={[styles.helperMuted, { fontFamily: bodySmFont }]}>
        <Trans>3–20 characters: a-z 0-9 _ .</Trans>
      </Text>
    );
  }

  return (
    <KeyboardScreen>
      {/* UI-SPEC Scope note #7 — no native header chrome; title kept only as
          the a11y label for iOS back-swipe / screen readers. */}
      <Stack.Screen options={{ headerShown: false, title: t`Almost done` }} />
      <View style={styles.content}>
        <Text style={[styles.heading, { fontFamily: headingFont }]}>
          <Trans>Almost done</Trans>
        </Text>
        <Text style={[styles.subtitle, { fontFamily: bodyFont }]}>
          <Trans>Tell us what to call you in the app.</Trans>
        </Text>

        <View style={styles.avatarBlock}>
          <AvatarTile displayName={displayName} username={username} localUri={avatarUri} />
          <View style={styles.avatarActions}>
            <Pressable
              style={styles.avatarActionButton}
              onPress={() => void pickFromLibrary()}
              disabled={!accountId}
            >
              <ImagePlus size={18} color={colors.textPrimary} strokeWidth={2} />
              <Text style={[styles.avatarActionText, { fontFamily: bodySmFont }]}>
                <Trans>Choose photo</Trans>
              </Text>
            </Pressable>
            <Pressable
              style={styles.avatarCameraButton}
              onPress={() => void takePhoto()}
              disabled={!accountId}
              accessibilityLabel={t`Take photo`}
              hitSlop={8}
            >
              <Camera size={20} color={colors.textPrimary} strokeWidth={2} />
            </Pressable>
          </View>
          <Text style={[styles.avatarHelper, { fontFamily: bodySmFont }]}>
            <Trans>Optional. You can add this later.</Trans>
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { fontFamily: labelFont }]}>
            <Trans>Username</Trans>
          </Text>
          <TextInput
            style={[
              styles.input,
              isUsernameTaken ? styles.inputDanger : null,
              { fontFamily: bodyFont },
            ]}
            value={username}
            onChangeText={handleUsernameChange}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={USERNAME_MAX}
            editable={!submitting}
          />
          {renderUsernameHelper()}
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { fontFamily: labelFont }]}>
              <Trans>Display name</Trans>
            </Text>
            <Text style={[styles.requiredBadge, { fontFamily: microFont }]}>
              <Trans>Required</Trans>
            </Text>
          </View>
          <TextInput
            style={[styles.input, { fontFamily: bodyFont }]}
            value={displayName}
            onChangeText={(value) => setDisplayName(value.slice(0, DISPLAY_NAME_MAX))}
            maxLength={DISPLAY_NAME_MAX}
            editable={!submitting}
          />
        </View>

        {submitError ? (
          <Text style={[styles.error, { fontFamily: bodySmFont }]}>{submitError}</Text>
        ) : null}
      </View>

      <Pressable
        style={[styles.cta, !canSubmit ? styles.ctaDisabled : null]}
        onPress={handleDone}
        disabled={!canSubmit}
      >
        <Text style={[styles.ctaText, { fontFamily: ctaFont }]}>
          {submitting ? t`Saving…` : t`Done`}
        </Text>
      </Pressable>
    </KeyboardScreen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      // flexGrow (not flex:1) so the block grows to fill and stays centered when
      // content is short, but keeps its intrinsic height (RN default flexShrink:0)
      // and overflows into a scroll when the soft keyboard shrinks the viewport —
      // otherwise flex:1's flexShrink:1/flexBasis:0 clamps it to the viewport and
      // the KeyboardScreen ScrollView has nothing to scroll. This screen (avatar +
      // two fields) is the tallest, so it overflows first.
      flexGrow: 1,
      justifyContent: 'center',
      gap: spacingScale['sp-8'],
    },
    heading: {
      fontSize: typeRoles.display2.size,
      lineHeight: typeRoles.display2.size * typeRoles.display2.lineHeight,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: typeRoles.body.size,
      lineHeight: typeRoles.body.size * typeRoles.body.lineHeight,
      color: colors.textSecondary,
      marginTop: -spacingScale['sp-6'],
    },
    avatarBlock: {
      alignItems: 'center',
      gap: spacingScale['sp-5'],
    },
    avatarActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-4'],
    },
    avatarActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-2'],
      minHeight: layout.hitMin,
      paddingHorizontal: spacingScale['sp-6'],
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceInset,
    },
    avatarActionText: {
      fontSize: typeRoles.bodySm.size,
      color: colors.textPrimary,
    },
    avatarCameraButton: {
      width: layout.hitMin,
      height: layout.hitMin,
      borderRadius: radii.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceInset,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarHelper: {
      fontSize: typeRoles.bodySm.size,
      color: colors.textMuted,
      textAlign: 'center',
    },
    field: {
      gap: spacingScale['sp-5'],
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: typeRoles.label.size,
      lineHeight: typeRoles.label.size * typeRoles.label.lineHeight,
      color: colors.textSecondary,
    },
    requiredBadge: {
      fontSize: typeRoles.micro.size,
      lineHeight: typeRoles.micro.size * typeRoles.micro.lineHeight,
      textTransform: 'uppercase',
      letterSpacing: 0.09 * typeRoles.micro.size,
      color: colors.textMuted,
    },
    input: {
      minHeight: layout.hitMin,
      backgroundColor: colors.surfaceInset,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.control,
      paddingHorizontal: spacingScale['sp-6'],
      fontSize: typeRoles.body.size,
      color: colors.textPrimary,
    },
    inputDanger: {
      // 1px border + tint on the taken-username field: both resolve from tokens
      // (ADR-015). `fillDangerSubtle` IS danger at 8% — the exact value the
      // mockup used — and the border takes `dangerText`, since the bare fill hue
      // reaches only 2.98:1 on Papier and would vanish as a hairline.
      borderColor: colors.dangerText,
      backgroundColor: colors.fillDangerSubtle,
    },
    helperMuted: {
      fontSize: typeRoles.bodySm.size,
      color: colors.textMuted,
    },
    helperSuccess: {
      fontSize: typeRoles.bodySm.size,
      // Status hue as TEXT -> the *Text variant: `success` measures 1.57:1 on
      // Papier, `successText` 4.52:1 (tokens.ts, UI-SPEC ## Color amendment).
      color: colors.successText,
    },
    helperDanger: {
      fontSize: typeRoles.bodySm.size,
      color: colors.dangerText,
    },
    helperTakenBlock: {
      gap: spacingScale['sp-2'],
    },
    error: {
      color: colors.dangerText,
      fontSize: typeRoles.bodySm.size,
    },
    cta: {
      minHeight: layout.hitMin,
      backgroundColor: colors.primary,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaDisabled: { opacity: 0.45 },
    ctaText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },

  });
}
