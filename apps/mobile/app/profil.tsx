import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { plural } from '@lingui/core/macro';
import {
  AudioLines,
  Camera,
  Heart,
  Mail,
  Music2,
  QrCode,
  Share2,
  Tent,
  UserRound,
  Users,
} from 'lucide-react-native';
import { tokens } from '@quiks/ui';
import type { Me } from '@quiks/contracts';

import { apiClient } from '../lib/api-client';
import { getLocalAvatarUri } from '../lib/avatar-storage';
import { festivalKeys } from '../lib/festival-queries';
import { fontFamilyForRole } from '../lib/fonts';
import { useFontsReady } from '../lib/fonts-context';
import { deriveAge } from '../lib/profile-age';
import { buildIdentityLine, buildProfileMetaLine, createdAtYear } from '../lib/profile-meta-line';
import type { ThemeColors } from '../lib/theme';
import { useTheme } from '../lib/theme-context';
import { useHeaderClearance } from '../components/AppHeader';
import { AvatarSunsetRing } from '../components/AvatarSunsetRing';
import { AvatarTile } from '../components/AvatarTile';
import { ComingSoonTile } from '../components/ComingSoonTile';
import { ListRow } from '../components/ListRow';
import { useSoonToast } from '../components/SoonToast';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

/** UI-SPEC Placeholder Pattern A — the dampening factor for a "not real yet" block. */
const PATTERN_A_OPACITY = 0.45;

const SOCIAL_ICON_SIZE = 22;
const SHARE_ICON_SIZE = 16;

const QR_CELL_SIZE = 14;
/** 3 cells + 2 gaps — the mark itself. */
const QR_GRID_SIZE = QR_CELL_SIZE * 3 + spacingScale['sp-2'] * 2;
/**
 * The placeholder's fixed square. Deliberately roomier than one row of cells
 * needs, so a rounding difference cannot break the 3×3 into a ragged grid.
 */
const QR_PLACEHOLDER_SIZE = QR_GRID_SIZE + spacingScale['sp-6'] * 2;
/**
 * A FIXED, hand-written on/off pattern for the 3×3 placeholder mark, identical in
 * spirit to the Friends screen's. It encodes nothing and is derived from no
 * value — it exists so the square reads as a deliberate stand-in for a scannable
 * mark rather than as a skeleton or a broken image. Nothing generates a scannable
 * mark this phase and no library capable of generating one is imported.
 */
const QR_PATTERN = [true, false, true, false, true, true, true, true, false] as const;

type ProfileViewState =
  | { kind: 'loading' }
  | { kind: 'error'; variant: 'transport' | 'response'; retry: () => void }
  | { kind: 'data'; me: Me };

/**
 * Blank-to-absent: a value slot is OMITTED when the underlying string is empty
 * or whitespace-only (UI-SPEC #15) — the row then renders label + chevron and
 * never a placeholder dash.
 */
function orUndefined(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * PROF-01 / D-02 — the view-only profile screen (design `11 Profil`).
 *
 * ROUTE SHAPE (D-01, Pitfall 1): this file lives at the ROOT of `app/`, OUTSIDE
 * `(tabs)`, mirroring the `(festival)` precedent for a full-screen destination.
 * Being a sibling of the `(tabs)` group rather than a route inside the `Tabs`
 * navigator is what makes the FloatingNav disappear when it is pushed — no
 * per-screen visibility logic exists or is needed. It is registered explicitly
 * inside `app/_layout.tsx`'s authenticated `Stack.Protected` block (T-06-01);
 * without that line this screen is unreachable, not merely unstyled.
 *
 * VIEW-ONLY (PROF-01, T-06-31): there is no input, no mutation and no writing
 * path from here — editing is PROF-02. The Konto rows keep their chevron and
 * answer a tap with the shared hint (D-03, Pattern B), so nothing on this screen
 * can change a stored value. `GET /me` is the ONLY network source; it carries no
 * account id of its own (T-06-02 — identity comes from the session cookie alone,
 * ADR-014/016) and it returns only the SIGNED-IN account's data (T-06-28: no
 * path in this phase renders a foreign profile).
 *
 * HONEST PLACEHOLDERS (D-02, T-06-30): the four outlook blocks — add-code card,
 * Socials, Vibe and the stat tiles — are rendered at the design's full layout but
 * dampened and badged. None of them shows a fabricated value: no example account,
 * no invented artist, no number that could be mistaken for a measurement.
 */
export default function ProfilScreen() {
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerClearance = useHeaderClearance();
  const fontsReady = useFontsReady();
  const showSoonToast = useSoonToast();
  // Role-resolved families (05.1 D-10): the family IS the weight, so no style
  // below sets a numeric `fontWeight` on top of a real weight file.
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const nameFont = fontFamilyForRole('title2', fontsReady);
  const handleFont = fontFamilyForRole('countdown', fontsReady);
  const eyebrowFont = fontFamilyForRole('micro', fontsReady);
  const microFont = fontFamilyForRole('micro', fontsReady);
  const cardTitleFont = fontFamilyForRole('bodyStrong', fontsReady);
  const buttonFont = fontFamilyForRole('title3', fontsReady);
  const chipFont = fontFamilyForRole('label', fontsReady);

  const soonBadge = t`Soon`;
  const editSoon = t`Editing is coming soon.`;

  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiClient.getMe() });

  /**
   * D-04 — the meta line's festival count comes from the ALREADY-CACHED
   * `festivalKeys.mine` entry that Home/Festivals populate, read straight off the
   * query client. This screen therefore fires exactly one request (`/me`) and
   * never a second fetch of the visitor's own festivals; the same read-the-cache
   * idiom `(festival)/f/[festivalSlug].tsx` already uses.
   *
   * A stale or wrong-shaped cache entry is a MISS, not a crash: both the ts-rest
   * status and the array shape are checked before the length is taken. A cold
   * cache (deep-linked straight into Profil) legitimately counts zero, which the
   * plural macro renders as its own real category.
   */
  const queryClient = useQueryClient();
  const cachedMyFestivals = queryClient.getQueryData<{ status: number; body: unknown }>(
    festivalKeys.mine,
  );
  const festivalCount =
    cachedMyFestivals?.status === 200 && Array.isArray(cachedMyFestivals.body)
      ? cachedMyFestivals.body.length
      : 0;
  // D-04 — FRND-02 is not built, so this is an honest, constant zero rather than
  // a number sourced from anywhere. It is still a local binding because the
  // plural macro names its ICU placeholder after the expression it is given.
  const friendCount = 0;

  // D-05 — the avatar stays DEVICE-LOCAL: the URI comes from the MMKV store
  // keyed by accountId (Phase 4), never from the server, and the screen says
  // nothing about upload or backup. No photo (or a fresh install) simply falls
  // back to AvatarTile's initials.
  const accountId = meQuery.data?.status === 200 ? meQuery.data.body.accountId : undefined;
  const [avatarUri, setAvatarUri] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!accountId) return;
    setAvatarUri(getLocalAvatarUri(accountId));
  }, [accountId]);

  function computeState(): ProfileViewState {
    if (meQuery.status === 'pending') return { kind: 'loading' };
    if (meQuery.status === 'error') {
      return { kind: 'error', variant: 'transport', retry: () => void meQuery.refetch() };
    }
    // A non-200 ts-rest result is a SUCCESSFUL React Query result, never
    // `status === 'error'` — it must be branched explicitly or the screen would
    // render an empty profile on a real API failure.
    if (meQuery.data.status !== 200) {
      return { kind: 'error', variant: 'response', retry: () => void meQuery.refetch() };
    }
    return { kind: 'data', me: meQuery.data.body };
  }

  const viewState = computeState();
  // `profile` is nullable in the contract (a brand-new OTP account has none).
  // This screen sits behind the 'authenticated' guard, which already requires a
  // profile — the identity header is still omitted rather than faked if it is
  // ever absent, matching the omit-if-empty precedent used app-wide.
  const profile = viewState.kind === 'data' ? viewState.me.profile : null;

  // D-12a — the age is DERIVED from the stored birth date on every render and is
  // never written anywhere. One `now` per render (not memoized) so a day-boundary
  // crossing while the screen stays mounted is picked up on the next render.
  const identityLine = buildIdentityLine({
    pronoun: profile?.pronoun,
    age: deriveAge(profile?.birthDate, new Date()),
    gender: profile?.gender,
  });

  // D-04 — every count runs through the Lingui plural macro even where the value
  // is a constant: zero is a real plural category, and a hand-built
  // "number + word" string would be wrong in the first language that disagrees.
  // "Friends" stays the design's untranslated brand word in both catalogs; it is
  // still routed through the macro so the catalog owns it.
  const metaLine = buildProfileMetaLine({
    festivalsLabel: plural(festivalCount, { one: '# Festival', other: '# Festivals' }),
    friendsLabel: plural(friendCount, { one: '# Friend', other: '# Friends' }),
    sinceLabel:
      viewState.kind === 'data'
        ? (() => {
            const year = createdAtYear(viewState.me.createdAt);
            return year === null ? null : t`member since ${year}`;
          })()
        : null,
  });

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerClearance + layout.screenPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* UI-SPEC #10 — the project-wide plain "Loading…" text pattern, and
            UI-SPEC #16: ONE /me query means ONE screen-wide loading surface,
            never a spinner per row. */}
        {viewState.kind === 'loading' ? (
          <Text style={[styles.helper, { fontFamily: bodyFont }]}>
            <Trans>Loading profile…</Trans>
          </Text>
        ) : null}

        {/* UI-SPEC #11/#17 — the existing, word-for-word transport-error copy
            plus one screen-wide Retry; individual rows are not retryable. */}
        {viewState.kind === 'error' ? (
          <View style={styles.stateBlock}>
            <Text style={[styles.error, { fontFamily: bodySmFont }]}>
              {viewState.variant === 'transport' ? (
                <Trans>
                  Can't reach the server — make sure your device is on the same Wi-Fi as the dev
                  API.
                </Trans>
              ) : (
                <Trans>Can't load your profile — check your connection and try again.</Trans>
              )}
            </Text>
            <Pressable style={styles.button} onPress={viewState.retry}>
              <Text style={[styles.buttonText, { fontFamily: buttonFont }]}>
                <Trans>Retry</Trans>
              </Text>
            </Pressable>
          </View>
        ) : null}

        {viewState.kind === 'data' ? (
          <>
            {/* UI-SPEC #13 — a fixed vertical/horizontal stack, no scroll
                container of its own. */}
            {profile ? (
              <View style={styles.header}>
                {/* D-07 — the Sunset ring is decorative only; every assistive
                    affordance of the avatar stays on AvatarTile, whose props are
                    passed through untouched. D-05: local photo or initials, and
                    NO copy or glyph anywhere near it that would suggest the photo
                    is stored with the account or travels to another device. */}
                <AvatarSunsetRing>
                  <AvatarTile
                    displayName={profile.displayName}
                    username={profile.username}
                    localUri={avatarUri}
                  />
                </AvatarSunsetRing>

                <View style={styles.identity}>
                  {/* ADR-012/020 — displayName and @handle are user-generated
                      content and are NEVER translated. UI-SPEC #14 / T-06-32:
                      both are single-line, tail-truncated, app-wide, and are
                      rendered as plain text nodes, never as markup. */}
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.displayName, { fontFamily: nameFont }]}
                  >
                    {profile.displayName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[styles.handle, { fontFamily: handleFont }]}
                  >
                    @{profile.username}
                  </Text>

                  {/* D-12 / UI-SPEC #9 — the identity line hangs on the pure
                      builder's own result. All three fields empty means the
                      builder returns null and NOTHING is rendered: no reserved
                      height, no dangling separator, no placeholder dash. */}
                  {identityLine ? (
                    <Text style={[styles.identityLine, { fontFamily: bodySmFont }]}>
                      {identityLine}
                    </Text>
                  ) : null}

                  <Text style={[styles.metaLine, { fontFamily: bodySmFont }]}>{metaLine}</Text>
                </View>
              </View>
            ) : null}

            {/* Pattern A — the add-code card. Dampened and badged as a whole; its
                one button answers a tap with the shared hint. The mark is a
                deliberate stand-in, not a failed image (UI-SPEC #53/#57). */}
            <View style={styles.dampened} accessibilityState={{ disabled: true }}>
              <View style={styles.codeCard}>
                <View style={styles.codeCardBody}>
                  <View
                    style={styles.qrPlaceholder}
                    accessible
                    accessibilityLabel={t`Placeholder mark, coming soon`}
                  >
                    {QR_PATTERN.map((filled, index) => (
                      <View key={index} style={[styles.qrCell, filled ? styles.qrCellFilled : null]} />
                    ))}
                  </View>

                  <View style={styles.codeCardText}>
                    <View style={styles.codeCardHeading}>
                      <Text style={[styles.codeCardTitle, { fontFamily: cardTitleFont }]}>
                        <Trans>Your code for adding</Trans>
                      </Text>
                      <View style={styles.badge}>
                        <Text style={[styles.badgeText, { fontFamily: microFont }]}>
                          {soonBadge}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.codeCardBodyText, { fontFamily: bodySmFont }]}>
                      <Trans>Scanning is enough — no searching, no typing.</Trans>
                    </Text>
                    <Pressable
                      style={styles.shareButton}
                      onPress={() => showSoonToast(t`Sharing your handle is coming soon.`)}
                      accessibilityRole="button"
                      accessibilityLabel={t`Share handle, coming soon`}
                    >
                      <Share2 size={SHARE_ICON_SIZE} color={colors.textOnPrimary} strokeWidth={2} />
                      <Text style={[styles.shareButtonText, { fontFamily: buttonFont }]}>
                        <Trans>Share handle</Trans>
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            {/* D-03 / Pattern B — full opacity, REAL values, chevron kept. The tap
                opens the shared hint; no editing surface is rendered anywhere.
                UI-SPEC #19: the three rows render independently, so a missing
                e-mail cannot blank the name row. */}
            <View style={styles.section}>
              <Text style={[styles.eyebrow, { fontFamily: eyebrowFont }]}>
                <Trans>Account</Trans>
              </Text>

              <View style={styles.rowGroup}>
                <ListRow
                  icon={UserRound}
                  label={t`Name`}
                  value={orUndefined(profile?.displayName)}
                  onPress={() => showSoonToast(editSoon)}
                  // Pitfall 4 — `accessibilityLabel` is excluded from the
                  // no-literal-string lint rule, so it is routed through Lingui
                  // by hand; a raw literal would never reach the catalog.
                  accessibilityLabel={t`Name`}
                />
                <ListRow
                  icon={QrCode}
                  label={t`Handle`}
                  value={profile ? `@${profile.username}` : undefined}
                  onPress={() => showSoonToast(editSoon)}
                  accessibilityLabel={t`Handle`}
                />
                <ListRow
                  icon={Mail}
                  label={t`Email`}
                  value={orUndefined(viewState.me.email)}
                  onPress={() => showSoonToast(editSoon)}
                  accessibilityLabel={t`Email`}
                />
              </View>
            </View>

            {/* Pattern A — Socials. PROF-02 owns the real thing; until then the
                rows carry NO value at all. Rendering an example handle here would
                be a fabricated account on someone's own profile (T-06-30), so the
                value slot is simply absent and the rows are inert: no press
                handler means no chevron and no button role. */}
            <View style={styles.section}>
              <Text style={[styles.eyebrow, { fontFamily: eyebrowFont }]}>
                <Trans>Socials</Trans>
              </Text>

              <View style={styles.rowGroup}>
                {/* Platform names are proper nouns and stay untranslated in every
                    catalog, the same treatment the quiks wordmark gets. The
                    surrounding screen-reader sentences DO go through Lingui. */}
                <ListRow
                  icon={Camera}
                  label="Instagram"
                  disabled
                  badge={soonBadge}
                  accessibilityLabel={t`Instagram, coming soon`}
                />
                <ListRow
                  icon={Music2}
                  label="TikTok"
                  disabled
                  badge={soonBadge}
                  accessibilityLabel={t`TikTok, coming soon`}
                />
                <ListRow
                  icon={AudioLines}
                  label="Spotify"
                  disabled
                  badge={soonBadge}
                  accessibilityLabel={t`Spotify, coming soon`}
                />
              </View>
            </View>

            {/* D-06 / Pattern A — the Vibe block is dead. There is no Spotify
                integration, so no artist chip is rendered: an invented favourite
                would be exactly the fabricated data T-06-30 forbids. The one chip
                present states the connection status instead, and the note keeps
                the design's tone WITHOUT its promise that "you decide what friends
                see" — no per-field visibility policy exists yet (IDN-02). */}
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Text style={[styles.eyebrow, { fontFamily: eyebrowFont }]}>
                  <Trans>Vibe · synced from Spotify</Trans>
                </Text>
                <View style={styles.badge}>
                  <Text style={[styles.badgeText, { fontFamily: microFont }]}>{soonBadge}</Text>
                </View>
              </View>

              <View style={styles.dampened} accessibilityState={{ disabled: true }}>
                {/* UI-SPEC #62 — the chip row wraps, so a longer catalog value in
                    any language moves to the next line instead of overflowing. */}
                <View style={styles.chipRow}>
                  <View style={styles.chip}>
                    <AudioLines
                      size={SOCIAL_ICON_SIZE / 2}
                      color={colors.primary}
                      strokeWidth={2}
                    />
                    <Text style={[styles.chipText, { fontFamily: chipFont }]}>
                      <Trans>Not connected</Trans>
                    </Text>
                  </View>
                </View>
                <Text style={[styles.sectionNote, { fontFamily: bodySmFont }]}>
                  <Trans>
                    Pronouns, age, gender and vibe are optional — your favourite artists show up
                    here once Spotify is connected.
                  </Trans>
                </Text>
              </View>
            </View>

            {/* Pattern A — the three stat tiles. Deliberately VALUELESS: the
                design shows counts, but "Saved acts" has no feature behind it and
                a rendered number would read as a measurement (T-06-30). The tile
                primitive carries its own badge; the row adds the dampening. */}
            <View
              style={[styles.statGrid, styles.dampened]}
              accessibilityState={{ disabled: true }}
            >
              <ComingSoonTile icon={Tent} label={t`Festivals`} badge={soonBadge} columns={3} />
              <ComingSoonTile icon={Heart} label={t`Saved acts`} badge={soonBadge} columns={3} />
              <ComingSoonTile icon={Users} label={t`Friends`} badge={soonBadge} columns={3} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bgApp },
    content: {
      paddingHorizontal: layout.screenPad,
      paddingTop: layout.screenPad,
      // No scrollBottomPad here: this screen is pushed OUTSIDE `(tabs)`, so the
      // floating nav is not on screen and nothing needs clearing.
      paddingBottom: layout.sectionGap,
      gap: layout.sectionGap,
    },
    stateBlock: { gap: spacingScale['sp-5'], alignItems: 'flex-start' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-6'],
    },
    identity: { flex: 1, minWidth: 0, gap: spacingScale['sp-1'] },
    displayName: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textPrimary,
    },
    // UI-SPEC ## Color, accent item 4 — the handle is the brand-text precedent
    // already shipped in home.tsx's `seeAll`, in the existing mono role.
    handle: {
      fontSize: typeRoles.countdown.size,
      lineHeight: typeRoles.countdown.size * typeRoles.countdown.lineHeight,
      color: colors.primary,
    },
    identityLine: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textSecondary,
    },
    metaLine: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
    // UI-SPEC Placeholder Pattern A — one dampening wrapper, so every outlook
    // block reads at the same weight and none of them can be mistaken for live
    // content.
    dampened: { opacity: PATTERN_A_OPACITY },
    section: { gap: spacingScale['sp-5'] },
    sectionHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-4'],
    },
    eyebrow: {
      fontSize: typeRoles.micro.size,
      lineHeight: typeRoles.micro.size * typeRoles.micro.lineHeight,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: typeRoles.micro.size * 0.09,
    },
    sectionNote: {
      marginTop: spacingScale['sp-4'],
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
    rowGroup: { gap: spacingScale['sp-4'] },
    codeCard: {
      gap: spacingScale['sp-5'],
      padding: spacingScale['sp-6'],
      backgroundColor: colors.surfaceCard,
      borderRadius: radiiScale['r-card'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    codeCardBody: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-6'],
    },
    // `minWidth: 0` lets the text column actually wrap instead of pushing the
    // row wider than the card.
    codeCardText: { flexGrow: 1, flexShrink: 1, minWidth: 0, gap: spacingScale['sp-4'] },
    codeCardHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-4'],
    },
    codeCardTitle: {
      flexShrink: 1,
      fontSize: typeRoles.bodyStrong.size,
      lineHeight: typeRoles.bodyStrong.size * typeRoles.bodyStrong.lineHeight,
      color: colors.textPrimary,
    },
    codeCardBodyText: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
    qrPlaceholder: {
      width: QR_PLACEHOLDER_SIZE,
      height: QR_PLACEHOLDER_SIZE,
      flexGrow: 0,
      flexShrink: 0,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignContent: 'center',
      justifyContent: 'center',
      gap: spacingScale['sp-2'],
      padding: spacingScale['sp-4'],
      backgroundColor: colors.fillQuiet,
      borderRadius: radiiScale['r-md'],
    },
    qrCell: { width: QR_CELL_SIZE, height: QR_CELL_SIZE },
    qrCellFilled: { backgroundColor: colors.textMuted },
    shareButton: {
      alignSelf: 'flex-start',
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacingScale['sp-4'],
      paddingHorizontal: spacingScale['sp-6'],
      backgroundColor: colors.primary,
      borderRadius: radiiScale['r-pill'],
    },
    shareButtonText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacingScale['sp-3'],
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-3'],
      paddingHorizontal: spacingScale['sp-5'],
      paddingVertical: spacingScale['sp-4'],
      backgroundColor: colors.fillBrandQuiet,
      borderRadius: radiiScale['r-pill'],
    },
    chipText: {
      fontSize: typeRoles.label.size,
      lineHeight: typeRoles.label.size * typeRoles.label.lineHeight,
      color: colors.primary,
    },
    statGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: spacingScale['sp-4'],
    },
    // Mirrors `ComingSoonTile`/`ListRow`'s badge verbatim.
    badge: {
      backgroundColor: colors.fillQuiet,
      borderRadius: radiiScale['r-pill'],
      paddingHorizontal: spacingScale['sp-4'],
      paddingVertical: spacingScale['sp-1'],
    },
    badgeText: {
      fontSize: typeRoles.micro.size,
      color: colors.textMuted,
    },
    helper: {
      fontSize: typeRoles.body.size,
      color: colors.textSecondary,
    },
    // The status-hue rule: an error rendered as TEXT always resolves through
    // `dangerText`, never the bare `danger` fill (2.98:1 on Papier).
    error: {
      color: colors.dangerText,
      fontSize: typeRoles.bodySm.size,
    },
    button: {
      minHeight: layout.hitMin,
      paddingHorizontal: spacingScale['sp-8'],
      backgroundColor: colors.primary,
      borderRadius: radiiScale['r-pill'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
  });
}
