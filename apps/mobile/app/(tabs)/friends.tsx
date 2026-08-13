import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { Search } from 'lucide-react-native';
import { tokens } from '@quiks/ui';
import type { VisitorSummary } from '@quiks/contracts';

import { PersonRow } from '../../components/PersonRow';
import { RelationAction } from '../../components/RelationAction';
import { useSoonToast } from '../../components/SoonToast';
import { apiClient } from '../../lib/api-client';
import { fontFamilyForRole } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import { friendKeys, SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '../../lib/friend-queries';
import type { ThemeColors } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const SEARCH_ICON_SIZE = 18;

/** UI-SPEC Placeholder Pattern A — the dampening factor for a "not real yet"
 * control, the same value `ListRow` already uses. On this screen it applies to
 * exactly ONE element: the card's action button. */
const PATTERN_A_OPACITY = 0.45;

const QR_CELL_SIZE = 16;
/** 3 cells + 2 gaps — the mark itself. */
const QR_GRID_SIZE = QR_CELL_SIZE * 3 + spacingScale['sp-2'] * 2;
/**
 * The placeholder's fixed square. The inset is generous on purpose: the wrap
 * container must have visibly more room than one row of cells needs, or a
 * rounding difference could break the 3×3 into a ragged 2-per-row grid.
 */
const QR_PLACEHOLDER_SIZE = QR_GRID_SIZE + spacingScale['sp-6'] * 2;
/**
 * A FIXED, hand-written on/off pattern for the 3×3 placeholder mark. It encodes
 * nothing and is not derived from any value — it exists only so the square reads
 * as a deliberate stand-in for a scannable mark rather than as a loading
 * skeleton or a broken image. Nothing generates a scannable mark this phase and
 * no library capable of generating one is imported.
 */
const QR_PATTERN = [true, false, true, false, true, true, true, true, false] as const;

/** UI-SPEC #54 — the card is one fixed-height surface. Expressed as a FLOOR
 * rather than a hard height so a larger system font scale grows the card instead
 * of clipping the copy inside it. */
const QUIKS_CODE_CARD_MIN_HEIGHT = 200;

/**
 * The card's own view state. It is derived from the SINGLE `/me` query this
 * screen runs, so the screen has exactly one loading surface and one error
 * surface (UI-SPEC #50) — never one per block. The four list blocks below fetch
 * nothing at all and therefore render regardless of what this state is.
 */
type QuiksCodeViewState =
  | { kind: 'loading' }
  | { kind: 'error'; variant: 'transport' | 'response'; retry: () => void }
  | { kind: 'data'; username: string | undefined };

/**
 * The search results' own view state, same three-state schema as
 * `QuiksCodeViewState` (08-01-PATTERNS "the vorgeschriebene Schablone"),
 * plus `idle` for "below the 2-char floor, no request fired at all" — the
 * FRND-03 prohibition boundary, not a fetch state. All five E1 states (hint,
 * loading, error, empty, populated) render from this one union.
 */
type SearchViewState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; variant: 'transport' | 'response'; retry: () => void }
  | { kind: 'data'; hits: VisitorSummary[] };

/**
 * D-10 / D-11 — the third tab, "Friends" (design `03 Friends`), in its full
 * six-block layout: search · quiks-code card · Requests · Chats · Your crew ·
 * People you may know.
 *
 * GLOBAL by decision (D-10): this screen reads NO festival state — it imports
 * nothing from the festival context, holds no active slug and filters nothing by
 * one. The roadmap's "friends who saved this festival" framing for FRND-01 is
 * superseded by that decision and must not be verified against (T-06-25).
 *
 * WHY EVERY BLOCK CARRIES ITS OWN COPY (D-11): six structurally empty sections
 * stacked on top of each other are this phase's main risk — they can read as
 * broken rather than deliberate. The UI-SPEC's answer is explicit and is the one
 * Friends-specific exception to the phase's placeholder pattern: these blocks are
 * NOT visually dampened. They render at full weight, and the honesty is carried
 * entirely by section-specific empty copy that names the PRECONDITION ("once
 * someone adds you", "once you've added each other") instead of a shared, generic
 * "nothing here". Dampening them as well would produce exactly the broken
 * impression the copy exists to prevent.
 *
 * No person is ever rendered here: there is no example name, no example handle
 * and no seeded row array — a fabricated crew would be a lie the empty copy is
 * specifically written to avoid (T-06-26/T-06-27).
 */
export default function FriendsScreen() {
  const { t } = useLingui();
  const { colors } = useTheme();
  const showSoonToast = useSoonToast();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  // Role-resolved families (05.1 D-10): the family IS the weight, so no style
  // below sets a numeric `fontWeight` on top of a real weight file.
  const headingFont = fontFamilyForRole('title2', fontsReady);
  const bodySmFont = fontFamilyForRole('bodySm', fontsReady);
  const microFont = fontFamilyForRole('micro', fontsReady);
  const bodyFont = fontFamilyForRole('body', fontsReady);
  const cardTitleFont = fontFamilyForRole('bodyStrong', fontsReady);
  const handleFont = fontFamilyForRole('countdown', fontsReady);
  const buttonFont = fontFamilyForRole('title3', fontsReady);

  const soonBadge = t`Soon`;

  /**
   * The ONE data source of this screen (D-10 keeps everything else offline) —
   * and deliberately the SAME query key and client function the Profil screen
   * uses, so both screens share one cache entry and opening Friends never fires
   * a second request for the same body.
   *
   * T-06-24: `/me` is session-bound and returns only the signed-in account's own
   * profile; there is no lookup of a foreign profile and no directory anywhere
   * on this screen.
   */
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => apiClient.getMe() });

  /**
   * D-01/D-02 — the search field is now real: one input satisfies both
   * FRND-02 (handle) and FRND-03 (username search) via
   * `GET /visitors?q=`, debounced by `SEARCH_DEBOUNCE_MS` and gated below
   * `SEARCH_MIN_CHARS` (T-08-04 — this floor plus the debounce is the DoS
   * mitigation, and React Query dedupes identical keys on top of it).
   */
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const searchEnabled = debouncedQuery.trim().length >= SEARCH_MIN_CHARS;

  // T-08-02: `targetAccountId` for any mutation this screen triggers comes
  // from `hit.profile.accountId` on a hit THIS query returned — never from
  // the typed text itself.
  const searchQuery = useQuery({
    queryKey: friendKeys.search(debouncedQuery),
    queryFn: () => apiClient.searchVisitors({ query: { q: debouncedQuery } }),
    enabled: searchEnabled,
  });

  function computeSearchState(): SearchViewState {
    if (!searchEnabled) return { kind: 'idle' };
    if (searchQuery.status === 'pending') return { kind: 'loading' };
    if (searchQuery.status === 'error') {
      return { kind: 'error', variant: 'transport', retry: () => void searchQuery.refetch() };
    }
    // A non-200 ts-rest result is a SUCCESSFUL React Query result, never
    // `status === 'error'` — same branch the quiks-code card already relies on.
    if (searchQuery.data.status !== 200) {
      return { kind: 'error', variant: 'response', retry: () => void searchQuery.refetch() };
    }
    return { kind: 'data', hits: searchQuery.data.body };
  }

  const searchState = computeSearchState();

  /**
   * D-03 — the instant the field holds >=1 character (immediate `query`,
   * NOT the debounced value: the mode switch reacts to typing itself, not
   * to the request it eventually fires), the quiks-code card, Requests and
   * Crew blocks are UNMOUNTED from the scroll flow (conditional render, not
   * `display`/`opacity`) and replaced by the results area below. Clearing
   * the field restores all three exactly as they were.
   */
  const isSearching = query.trim().length > 0;

  function computeQuiksCodeState(): QuiksCodeViewState {
    if (meQuery.status === 'pending') return { kind: 'loading' };
    if (meQuery.status === 'error') {
      return { kind: 'error', variant: 'transport', retry: () => void meQuery.refetch() };
    }
    // A non-200 ts-rest result is a SUCCESSFUL React Query result, never
    // `status === 'error'` — branching it explicitly is what stops the card from
    // rendering an empty identity on a real API failure.
    if (meQuery.data.status !== 200) {
      return { kind: 'error', variant: 'response', retry: () => void meQuery.refetch() };
    }
    // `profile` is nullable in the contract (a brand-new OTP account has none),
    // so the handle is optional all the way down to the render.
    return { kind: 'data', username: meQuery.data.body.profile?.username };
  }

  const quiksCodeState = computeQuiksCodeState();

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {/* UI-SPEC #6 — the scroll container's bottom pad frees the last block
          from the FloatingNav that floats above it; the blocks stack vertically
          and nothing runs off to the side. */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* D-01/D-02 — the field is real now: ONE input satisfies both the
            handle lookup (FRND-02, the exact handle is by construction the
            first prefix-search hit) and the username search (FRND-03). The
            old placeholder falsely implied `displayName` was searched too
            (Phase-7-D-09) — the rewritten copy is honest about `@username`
            only. */}
        <View style={styles.searchField}>
          <Search size={SEARCH_ICON_SIZE} color={colors.textMuted} strokeWidth={2} />
          <TextInput
            style={[styles.searchInput, { fontFamily: bodySmFont }]}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t`Search @username`}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t`Search @username`}
          />
        </View>

        {/* D-03 — the results area is the ONLY thing that renders below the
            search field while `isSearching`; all five E1 states share this
            one slot (hint · loading · error · empty · populated). */}
        {isSearching ? (
          <View style={styles.resultsArea}>
            {searchState.kind === 'idle' ? (
              <Text style={[styles.helper, { fontFamily: bodyFont }]}>
                <Trans>Type at least 2 characters.</Trans>
              </Text>
            ) : null}

            {searchState.kind === 'loading' ? (
              <Text style={[styles.helper, { fontFamily: bodyFont }]}>
                <Trans>Searching…</Trans>
              </Text>
            ) : null}

            {searchState.kind === 'error' ? (
              <View style={styles.stateBlock}>
                <Text style={[styles.error, { fontFamily: bodySmFont }]}>
                  {searchState.variant === 'transport' ? (
                    <Trans>
                      Can't reach the server — make sure your device is on the same Wi-Fi as the
                      dev API.
                    </Trans>
                  ) : (
                    <Trans>Can't load results — check your connection and try again.</Trans>
                  )}
                </Text>
                <Pressable style={styles.retryButton} onPress={searchState.retry}>
                  <Text style={[styles.retryButtonText, { fontFamily: buttonFont }]}>
                    <Trans>Retry</Trans>
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {searchState.kind === 'data' && searchState.hits.length === 0 ? (
              <Text style={[styles.helper, { fontFamily: bodyFont }]}>
                <Trans>No one found. Check the @handle spelling.</Trans>
              </Text>
            ) : null}

            {searchState.kind === 'data' && searchState.hits.length > 0 ? (
              <View style={styles.resultsList}>
                {searchState.hits.map((hit) => {
                  const { accountId, displayName, username } = hit.profile;
                  return (
                    <PersonRow
                      key={accountId}
                      profile={hit.profile}
                      trailing={<RelationAction relation={hit.relation} accountId={accountId} />}
                      accessibilityLabel={t`${displayName}, @${username}`}
                    />
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* D-03 — unmounted (not just hidden) while `isSearching`, restored
            exactly as-is once the field is cleared. */}
        {isSearching ? null : (
          <>
            {/* UI-SPEC #50 — the project-wide plain "Loading…" text pattern; ONE
                query means ONE loading surface, never one per block. */}
            {quiksCodeState.kind === 'loading' ? (
              <Text style={[styles.helper, { fontFamily: bodyFont }]}>
                <Trans>Loading your quiks code…</Trans>
              </Text>
            ) : null}

            {/* UI-SPEC #51 — the existing, word-for-word transport-error copy plus
                one Retry, identical to the Profil screen's; no new wording is
                invented for this surface. */}
            {quiksCodeState.kind === 'error' ? (
              <View style={styles.stateBlock}>
                <Text style={[styles.error, { fontFamily: bodySmFont }]}>
                  {quiksCodeState.variant === 'transport' ? (
                    <Trans>
                      Can't reach the server — make sure your device is on the same Wi-Fi as the
                      dev API.
                    </Trans>
                  ) : (
                    <Trans>Can't load your profile — check your connection and try again.</Trans>
                  )}
                </Text>
                <Pressable style={styles.retryButton} onPress={quiksCodeState.retry}>
                  <Text style={[styles.retryButtonText, { fontFamily: buttonFont }]}>
                    <Trans>Retry</Trans>
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* UI-SPEC #52 — the one surface on this screen that shows REAL data. */}
            {quiksCodeState.kind === 'data' ? (
              <View style={styles.codeCard}>
                <View style={styles.codeCardBody}>
                  <View style={styles.codeCardText}>
                    <Text style={[styles.codeCardTitle, { fontFamily: cardTitleFont }]}>
                      <Trans>Your quiks code</Trans>
                    </Text>
                    {/* UI-SPEC #49 — a missing handle omits this LINE entirely. It
                        hangs on the value's own truthiness, never on a fallback
                        string, so no empty slot and no placeholder dash can appear
                        where an identity belongs. UI-SPEC #56 / ADR-012/020: the
                        handle is single-line, tail-truncated and never translated. */}
                    {quiksCodeState.username ? (
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={[styles.handle, { fontFamily: handleFont }]}
                      >
                        @{quiksCodeState.username}
                      </Text>
                    ) : null}
                    <Text style={[styles.codeCardBodyText, { fontFamily: bodySmFont }]}>
                      <Trans>Show it, scan it, done — that's how you add each other.</Trans>
                    </Text>
                  </View>

                  {/* UI-SPEC #53 — a DELIBERATE static stand-in, badged as such, so
                      it can never be read as an image that failed to load. */}
                  <View style={styles.qrColumn}>
                    <View
                      style={styles.qrPlaceholder}
                      accessible
                      accessibilityLabel={t`Placeholder mark, coming soon`}
                    >
                      {QR_PATTERN.map((filled, index) => (
                        <View
                          key={index}
                          style={[styles.qrCell, filled ? styles.qrCellFilled : null]}
                        />
                      ))}
                    </View>
                    <View style={styles.badge}>
                      <Text style={[styles.badgeText, { fontFamily: microFont }]}>
                        {soonBadge}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Placeholder Pattern A — the ONLY dampened element on this screen. */}
                <Pressable
                  style={styles.qrButton}
                  onPress={() => showSoonToast(t`Adding by QR is coming soon.`)}
                  accessibilityRole="button"
                  accessibilityLabel={t`Show QR, coming soon`}
                >
                  <Text style={[styles.qrButtonText, { fontFamily: buttonFont }]}>
                    <Trans>Show QR</Trans>
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={[styles.sectionHead, { fontFamily: headingFont }]}>
                <Trans>Requests</Trans>
              </Text>
              {/* UI-SPEC #8 — empty-state body copy carries no line cap and wraps
                  freely; truncating it would cost exactly the honesty D-11 asks it
                  to carry. The same holds for all four headings and empty texts. */}
              <Text style={[styles.emptyBody, { fontFamily: bodySmFont }]}>
                <Trans>No requests yet. Once someone adds you, it'll show up here.</Trans>
              </Text>
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionHead, { fontFamily: headingFont }]}>
            <Trans>Chats</Trans>
          </Text>
          {/* T-06-27 — this text names the PRECONDITION on purpose. A bare "no
              messages" would read as a working inbox that happens to be empty,
              and would leave someone waiting for messages that no gateway exists
              to deliver: messaging needs the realtime backend, which is far
              outside this phase. Do not shorten this to a negation. */}
          <Text style={[styles.emptyBody, { fontFamily: bodySmFont }]}>
            <Trans>
              Chats unlock once you've added someone and can message them — coming soon.
            </Trans>
          </Text>
        </View>

        {/* D-03 — Crew is the third of the three unmounted-while-searching
            blocks; it sits after Chats in this phase's still-Phase-6 layout
            order (D-08's search·code·requests·crew order lands with the
            real Requests/Crew content in 08-02/08-03). */}
        {isSearching ? null : (
          <View style={styles.section}>
            <Text style={[styles.sectionHead, { fontFamily: headingFont }]}>
              <Trans>Your crew</Trans>
            </Text>
            <Text style={[styles.emptyBody, { fontFamily: bodySmFont }]}>
              <Trans>
                No one in your crew yet. Once you've added each other, you'll show up here.
              </Trans>
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionHead, { fontFamily: headingFont }]}>
            <Trans>People you may know</Trans>
          </Text>
          {/* No suggestion row is rendered — not even a sample one. The block
              states what has to exist first and then stops. */}
          <Text style={[styles.emptyBody, { fontFamily: bodySmFont }]}>
            <Trans>Once you have your first friends, we'll suggest more here.</Trans>
          </Text>
        </View>
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
      // Clears the floating nav so the last block is never trapped under it.
      paddingBottom: layout.scrollBottomPad,
      gap: layout.sectionGap,
    },
    searchField: {
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-4'],
      paddingHorizontal: spacingScale['sp-6'],
      paddingVertical: spacingScale['sp-4'],
      backgroundColor: colors.surfaceCard,
      borderRadius: radiiScale['r-md'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    searchInput: {
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      // Android gives TextInput its own default padding; zeroing it is what
      // keeps the row on the icon's baseline.
      padding: 0,
      fontSize: typeRoles.bodySm.size,
      color: colors.textPrimary,
    },
    // D-03 — the one slot every E1 state (hint/loading/error/empty/populated)
    // renders into while `isSearching`.
    resultsArea: { gap: spacingScale['sp-5'] },
    // 08-01-UI-SPEC § Search & Add-Flow Contract — search hits stack with the
    // same list-row gap the requests/crew lists will use.
    resultsList: { gap: spacingScale['sp-5'] },
    // Mirrors `ComingSoonTile`/`ListRow`'s badge verbatim — still used by the
    // quiks-code card's QR placeholder (D-13 real QR mark lands in 08-04).
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
    stateBlock: { gap: spacingScale['sp-5'], alignItems: 'flex-start' },
    // The status-hue rule: an error rendered as TEXT always resolves through
    // `dangerText`, never the bare `danger` fill (2.98:1 on Papier).
    error: {
      fontSize: typeRoles.bodySm.size,
      color: colors.dangerText,
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
    codeCard: {
      minHeight: QUIKS_CODE_CARD_MIN_HEIGHT,
      gap: spacingScale['sp-5'],
      padding: spacingScale['sp-6'],
      backgroundColor: colors.surfaceCard,
      borderRadius: radiiScale['r-card'],
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    codeCardBody: {
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-6'],
    },
    // `minWidth: 0` lets the text column actually wrap instead of pushing the
    // row wider than the card.
    codeCardText: { flexGrow: 1, flexShrink: 1, minWidth: 0, gap: spacingScale['sp-1'] },
    codeCardTitle: {
      fontSize: typeRoles.bodyStrong.size,
      lineHeight: typeRoles.bodyStrong.size * typeRoles.bodyStrong.lineHeight,
      color: colors.textPrimary,
    },
    // UI-SPEC § Color, accent item 4 — the handle is the brand-text precedent,
    // identical to the Profil header's.
    handle: {
      fontSize: typeRoles.countdown.size,
      lineHeight: typeRoles.countdown.size * typeRoles.countdown.lineHeight,
      color: colors.primary,
    },
    codeCardBodyText: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
    qrColumn: { alignItems: 'center', gap: spacingScale['sp-2'] },
    qrPlaceholder: {
      width: QR_PLACEHOLDER_SIZE,
      height: QR_PLACEHOLDER_SIZE,
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
    qrButton: {
      minHeight: layout.hitMin,
      paddingHorizontal: spacingScale['sp-8'],
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillQuiet,
      borderRadius: radiiScale['r-pill'],
      opacity: PATTERN_A_OPACITY,
    },
    qrButtonText: {
      fontSize: typeRoles.title3.size,
      color: colors.textPrimary,
    },
    section: { gap: spacingScale['sp-5'] },
    sectionHead: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textPrimary,
    },
    emptyBody: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
  });
}
