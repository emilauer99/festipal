import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Trans, useLingui } from '@lingui/react/macro';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Search } from 'lucide-react-native';
import { tokens } from '@quiks/ui';
import type { Friend, FriendRequestItem, VisitorSummary } from '@quiks/contracts';

import { PersonRow } from '../../components/PersonRow';
import { QRMark } from '../../components/QRMark';
import { RelationAction } from '../../components/RelationAction';
import { apiClient } from '../../lib/api-client';
import { fontFamilyForRole } from '../../lib/fonts';
import { useFontsReady } from '../../lib/fonts-context';
import { friendKeys, SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '../../lib/friend-queries';
import { sortFriendsByDisplayName } from '../../lib/friend-sort';
import { encodeQuiksCodePayload } from '../../lib/qr-payload';
import { useFriendMutations } from '../../lib/use-friend-mutations';
import type { ThemeColors } from '../../lib/theme';
import { useTheme } from '../../lib/theme-context';

// 05.1 D-01: colour roles resolve per render through `useTheme()` — only the
// mode-invariant scales stay destructured at module scope.
const { typeRoles, layout, radiiScale, spacingScale } = tokens;

const SEARCH_ICON_SIZE = 18;
const ICON_SIZE = 18;

/**
 * The same dampening factor `RelationAction`'s own `PENDING_OPACITY` already
 * uses for "mutation in flight" — reused here for the Requests-section rows,
 * not reinvented (08-02-PLAN Task 2).
 */
const PENDING_OPACITY = 0.45;

/**
 * 08-04 / D-13 — the card's small preview mark is now real, encoding the
 * same `quiks:u/<username>` payload the QR screen's big "Mein Code" mark
 * does. Sized for a row-height icon, not for scanning — the QR screen is
 * where a stranger actually points a camera at this handle.
 */
const CODE_CARD_MARK_SIZE = 56;

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
 * The Requests section's own view state, same three-state schema as
 * `QuiksCodeViewState`/`SearchViewState` — one `listFriendRequests` query
 * backs BOTH sub-groups (08-CONTEXT D-07: one response, two directions), so
 * there is exactly one loading/error surface for the whole section, never one
 * per sub-group.
 */
type RequestsViewState =
  | { kind: 'loading' }
  | { kind: 'error'; variant: 'transport' | 'response'; retry: () => void }
  | { kind: 'data'; incoming: FriendRequestItem[]; outgoing: FriendRequestItem[] };

/**
 * The Crew section's own view state, same three-state schema as every other
 * query on this screen. The 200 body is run through
 * `sortFriendsByDisplayName` (D-12) before it reaches `data.friends`, so
 * every consumer of this union already sees the sorted list — sorting is not
 * repeated at render time.
 */
type CrewViewState =
  | { kind: 'loading' }
  | { kind: 'error'; variant: 'transport' | 'response'; retry: () => void }
  | { kind: 'data'; friends: Friend[] };

/**
 * D-08/D-09 — the third tab, "Friends" (design `03 Friends`), now four
 * blocks: search · quiks-code card · Requests (both directions) · Your crew.
 * The Chats block (D-05/ADR-020) and the friend-suggestions block (D-06) are
 * removed outright this phase, not dampened — an outlook onto a feature that
 * will never exist is the worst kind of dishonest empty state.
 *
 * GLOBAL by decision (D-10 from Phase 6): this screen reads NO festival state
 * — it imports nothing from the festival context, holds no active slug and
 * filters nothing by one. The roadmap's "friends who saved this festival"
 * framing for FRND-01 is superseded by that decision and must not be
 * verified against (T-06-25).
 *
 * WHY EVERY BLOCK CARRIES ITS OWN COPY (D-11 from Phase 6, still binding):
 * empty sections stacked on top of each other are this phase's main risk —
 * they can read as broken rather than deliberate. These blocks are NOT
 * visually dampened; they render at full weight, and the honesty is carried
 * entirely by section-specific empty copy that names the PRECONDITION
 * ("once someone adds you", "once you've added each other") instead of a
 * shared, generic "nothing here".
 *
 * No person is ever rendered here except real API data: there is no example
 * name, no example handle and no seeded row array (T-06-26/T-06-27).
 */
export default function FriendsScreen() {
  const { t } = useLingui();
  const { colors } = useTheme();
  const router = useRouter();
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

  /**
   * D-16 — the camera-free path's OTHER end: `CameraScanPanel`'s denied
   * callout routes back here with `focusSearch=1`. Landing on this screen is
   * not enough on its own — without this effect the visitor arrives beside
   * the field, not IN it.
   */
  const searchInputRef = useRef<TextInput>(null);
  const { focusSearch } = useLocalSearchParams<{ focusSearch?: string }>();
  useEffect(() => {
    if (focusSearch) {
      searchInputRef.current?.focus();
    }
  }, [focusSearch]);

  // WR-03: trim ONCE and reuse the same value for the gate, the cache key
  // and the request itself — a trailing space (the exact shape Android
  // keyboards produce on a suggestion tap/paste) must not fire a prefix
  // search that matches nothing, and `"feli"`/`"feli "` must not occupy two
  // separate cache entries for the same logical search.
  const trimmedQuery = debouncedQuery.trim();
  const searchEnabled = trimmedQuery.length >= SEARCH_MIN_CHARS;

  // T-08-02: `targetAccountId` for any mutation this screen triggers comes
  // from `hit.profile.accountId` on a hit THIS query returned — never from
  // the typed text itself.
  const searchQuery = useQuery({
    queryKey: friendKeys.search(trimmedQuery),
    queryFn: () => apiClient.searchVisitors({ query: { q: trimmedQuery } }),
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

  /**
   * D-07 — ONE query for BOTH directions (`incoming`/`outgoing` in the same
   * response), so the two sub-groups never desync and a single invalidation
   * (`friendKeys.all` in `use-friend-mutations.ts`'s `onSettled`) refreshes
   * both after any of the three lifecycle mutations.
   */
  const requestsQuery = useQuery({
    queryKey: friendKeys.requests,
    queryFn: () => apiClient.listFriendRequests(),
  });

  function computeRequestsState(): RequestsViewState {
    if (requestsQuery.status === 'pending') return { kind: 'loading' };
    if (requestsQuery.status === 'error') {
      return { kind: 'error', variant: 'transport', retry: () => void requestsQuery.refetch() };
    }
    // A non-200 ts-rest result is a SUCCESSFUL React Query result, never
    // `status === 'error'` — same branch every other query on this screen
    // already relies on.
    if (requestsQuery.data.status !== 200) {
      return { kind: 'error', variant: 'response', retry: () => void requestsQuery.refetch() };
    }
    return {
      kind: 'data',
      incoming: requestsQuery.data.body.incoming,
      outgoing: requestsQuery.data.body.outgoing,
    };
  }

  const requestsState = computeRequestsState();

  /**
   * D-09 — the Crew list itself. `friendKeys.list` is the SAME key
   * `friend-detail.tsx` reads out of the query cache, so opening a crew row
   * never triggers a second fetch for data this screen already has.
   */
  const crewQuery = useQuery({
    queryKey: friendKeys.list,
    queryFn: () => apiClient.listFriends(),
  });

  function computeCrewState(): CrewViewState {
    if (crewQuery.status === 'pending') return { kind: 'loading' };
    if (crewQuery.status === 'error') {
      return { kind: 'error', variant: 'transport', retry: () => void crewQuery.refetch() };
    }
    // A non-200 ts-rest result is a SUCCESSFUL React Query result, never
    // `status === 'error'` — same branch every other query on this screen
    // already relies on.
    if (crewQuery.data.status !== 200) {
      return { kind: 'error', variant: 'response', retry: () => void crewQuery.refetch() };
    }
    return { kind: 'data', friends: sortFriendsByDisplayName(crewQuery.data.body) };
  }

  const crewState = computeCrewState();

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
            ref={searchInputRef}
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

                  {/* UI-SPEC #52/D-13 — a real, small mark once a handle
                      exists; omitted (not a broken/empty graphic) when it
                      doesn't, same omit-if-empty rule the handle line above
                      already follows. */}
                  {quiksCodeState.username ? (
                    <View style={styles.qrColumn}>
                      <View style={styles.qrMarkCard}>
                        <QRMark
                          payload={encodeQuiksCodePayload(quiksCodeState.username)}
                          size={CODE_CARD_MARK_SIZE}
                        />
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* UI-SPEC § Color item 4 — now a full-opacity CTA (Pattern
                    A dampening removed, D-13): the QR flow is real. */}
                <Pressable
                  style={styles.qrButton}
                  onPress={() => router.push('/friends-qr')}
                  accessibilityRole="button"
                  accessibilityLabel={t`Show QR`}
                >
                  <Text style={[styles.qrButtonText, { fontFamily: buttonFont }]}>
                    <Trans>Show QR</Trans>
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* D-07/D-08 — ONE section, TWO labeled sub-groups, always both
                visible: never a SegmentedControl between them, so a
                withdrawn/received request is never hidden behind a toggle
                the visitor forgot to flip. Fixed third position — this
                block never reorders itself to the top on a new request. */}
            <View style={styles.section}>
              <View style={styles.sectionHeadRow}>
                <Text style={[styles.sectionHead, { fontFamily: headingFont }]}>
                  <Trans>Requests</Trans>
                </Text>
                {/* D-08 — the count badge shows the INCOMING count only, and
                    the element itself is absent at 0 (never a `0` badge). A
                    solid `colors.primary` fill, deliberately distinct from
                    the neutral "Bald" badge elsewhere on this screen — a
                    real, actionable count reads differently from a
                    decorative placeholder. */}
                {requestsState.kind === 'data' && requestsState.incoming.length > 0 ? (
                  <View style={styles.countBadge}>
                    <Text style={[styles.countBadgeText, { fontFamily: microFont }]}>
                      {requestsState.incoming.length}
                    </Text>
                  </View>
                ) : null}
              </View>

              {requestsState.kind === 'loading' ? (
                <Text style={[styles.helper, { fontFamily: bodyFont }]}>
                  <Trans>Loading requests…</Trans>
                </Text>
              ) : null}

              {requestsState.kind === 'error' ? (
                <View style={styles.stateBlock}>
                  <Text style={[styles.error, { fontFamily: bodySmFont }]}>
                    {requestsState.variant === 'transport' ? (
                      <Trans>
                        Can't reach the server — make sure your device is on the same Wi-Fi as
                        the dev API.
                      </Trans>
                    ) : (
                      <Trans>Can't load requests — check your connection and try again.</Trans>
                    )}
                  </Text>
                  <Pressable style={styles.retryButton} onPress={requestsState.retry}>
                    <Text style={[styles.retryButtonText, { fontFamily: buttonFont }]}>
                      <Trans>Retry</Trans>
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {requestsState.kind === 'data' ? (
                <View style={styles.requestsGroups}>
                  <View style={styles.subGroup}>
                    <Text style={[styles.subGroupHead, { fontFamily: headingFont }]}>
                      <Trans>To you</Trans>
                    </Text>
                    {requestsState.incoming.length === 0 ? (
                      <Text style={[styles.emptyBody, { fontFamily: bodySmFont }]}>
                        <Trans>Once someone adds you, the request shows up here.</Trans>
                      </Text>
                    ) : (
                      <View style={styles.resultsList}>
                        {requestsState.incoming.map((item) => (
                          <IncomingRequestRow key={item.profile.accountId} item={item} />
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.subGroup}>
                    <Text style={[styles.subGroupHead, { fontFamily: headingFont }]}>
                      <Trans>From you</Trans>
                    </Text>
                    {requestsState.outgoing.length === 0 ? (
                      <Text style={[styles.emptyBody, { fontFamily: bodySmFont }]}>
                        <Trans>Once you request someone, you'll see it here.</Trans>
                      </Text>
                    ) : (
                      <View style={styles.resultsList}>
                        {requestsState.outgoing.map((item) => (
                          <OutgoingRequestRow key={item.profile.accountId} item={item} />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ) : null}
            </View>

            {/* D-09/D-11/D-12 — the fourth and final block. Every row is the
                SAME `PersonRow` search hits and requests already use; only
                crew rows carry `onPress` (search hits and request rows do
                not — D-09). The 200 body is pre-sorted by
                `sortFriendsByDisplayName` inside `computeCrewState`. */}
            <View style={styles.section}>
              <Text style={[styles.sectionHead, { fontFamily: headingFont }]}>
                <Trans>Your crew</Trans>
              </Text>

              {crewState.kind === 'loading' ? (
                <Text style={[styles.helper, { fontFamily: bodyFont }]}>
                  <Trans>Loading your crew…</Trans>
                </Text>
              ) : null}

              {crewState.kind === 'error' ? (
                <View style={styles.stateBlock}>
                  <Text style={[styles.error, { fontFamily: bodySmFont }]}>
                    {crewState.variant === 'transport' ? (
                      <Trans>
                        Can't reach the server — make sure your device is on the same Wi-Fi as
                        the dev API.
                      </Trans>
                    ) : (
                      <Trans>Can't load your crew — check your connection and try again.</Trans>
                    )}
                  </Text>
                  <Pressable style={styles.retryButton} onPress={crewState.retry}>
                    <Text style={[styles.retryButtonText, { fontFamily: buttonFont }]}>
                      <Trans>Retry</Trans>
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {/* D-11 (Phase 6) still binding, even with real data: the empty
                  copy names the PRECONDITION — the three concrete ways to add
                  someone — rather than the bare absence (UI-SPEC Copywriting
                  Contract, success criterion 4). */}
              {crewState.kind === 'data' && crewState.friends.length === 0 ? (
                <Text style={[styles.emptyBody, { fontFamily: bodySmFont }]}>
                  <Trans>No one in your crew yet. Add someone via search, code or QR.</Trans>
                </Text>
              ) : null}

              {crewState.kind === 'data' && crewState.friends.length > 0 ? (
                <View style={styles.resultsList}>
                  {crewState.friends.map((friend) => {
                    const { accountId, displayName, username } = friend.profile;
                    return (
                      <PersonRow
                        key={accountId}
                        profile={friend.profile}
                        onPress={() =>
                          router.push({ pathname: '/friend-detail', params: { accountId } })
                        }
                        accessibilityLabel={t`${displayName}, @${username}`}
                      />
                    );
                  })}
                </View>
              ) : null}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * The incoming sub-group's row: `PersonRow` plus a trailing two-action group
 * (`Annehmen`/`Ablehnen`), plus an inline failure line BELOW the row when
 * this row's own last mutation rejected. One `useFriendMutations()` call per
 * row (same pattern `RelationAction` already establishes) — `pendingTargetId`
 * / `failedTargetId` are therefore scoped to exactly this row's own attempts,
 * never another row's.
 */
function IncomingRequestRow({ item }: { item: FriendRequestItem }) {
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const buttonFont = fontFamilyForRole('title3', fontsReady);
  const linkFont = fontFamilyForRole('bodySm', fontsReady);
  const { acceptRequest, declineRequest, pendingTargetId, failedTargetId } = useFriendMutations();
  const { accountId, displayName, username } = item.profile;
  const isPending = pendingTargetId === accountId;
  const hasFailed = failedTargetId === accountId;

  return (
    <View style={styles.requestRow}>
      <PersonRow
        profile={item.profile}
        accessibilityLabel={t`${displayName}, @${username}`}
        trailing={
          <View style={styles.requestTrailing}>
            <Pressable
              style={[styles.primaryPill, isPending ? styles.pending : null]}
              disabled={isPending}
              onPress={() => acceptRequest(accountId)}
              accessibilityRole="button"
              accessibilityLabel={t`Accept`}
              accessibilityState={{ disabled: isPending }}
            >
              <Check size={ICON_SIZE} color={colors.textOnPrimary} strokeWidth={2} />
              <Text style={[styles.primaryPillText, { fontFamily: buttonFont }]}>
                <Trans>Accept</Trans>
              </Text>
            </Pressable>
            {/* No `Alert.alert` (Phase-7 D-11/D-12: idempotent, no history,
                no cooldown — a confirm dialog would overstate the stakes). */}
            <Pressable
              style={styles.textLinkPressable}
              disabled={isPending}
              onPress={() => declineRequest(accountId)}
              accessibilityRole="button"
              accessibilityLabel={t`Decline`}
              accessibilityState={{ disabled: isPending }}
            >
              <Text
                style={[
                  styles.textLinkDanger,
                  isPending ? styles.pending : null,
                  { fontFamily: linkFont },
                ]}
              >
                <Trans>Decline</Trans>
              </Text>
            </Pressable>
          </View>
        }
      />
      {hasFailed ? (
        <Text style={[styles.error, { fontFamily: linkFont }]}>
          <Trans>Couldn't save — try again.</Trans>
        </Text>
      ) : null}
    </View>
  );
}

/**
 * The outgoing sub-group's row: static `Angefragt` chip (never pressable —
 * D-04's "no tap that is guaranteed to fail") plus `Zurückziehen`. Mirrors
 * `IncomingRequestRow` exactly, one own `useFriendMutations()` call.
 */
function OutgoingRequestRow({ item }: { item: FriendRequestItem }) {
  const { t } = useLingui();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fontsReady = useFontsReady();
  const chipFont = fontFamilyForRole('label', fontsReady);
  const linkFont = fontFamilyForRole('bodySm', fontsReady);
  const { withdrawRequest, pendingTargetId, failedTargetId } = useFriendMutations();
  const { accountId, displayName, username } = item.profile;
  const isPending = pendingTargetId === accountId;
  const hasFailed = failedTargetId === accountId;

  return (
    <View style={styles.requestRow}>
      <PersonRow
        profile={item.profile}
        accessibilityLabel={t`${displayName}, @${username}`}
        trailing={
          <View style={styles.requestTrailing}>
            <View style={styles.staticChip} accessibilityLabel={t`Requested`}>
              <Text style={[styles.staticChipText, { fontFamily: chipFont }]}>
                <Trans>Requested</Trans>
              </Text>
            </View>
            <Pressable
              style={styles.textLinkPressable}
              disabled={isPending}
              onPress={() => withdrawRequest(accountId)}
              accessibilityRole="button"
              accessibilityLabel={t`Withdraw`}
              accessibilityState={{ disabled: isPending }}
            >
              <Text
                style={[
                  styles.textLinkMuted,
                  isPending ? styles.pending : null,
                  { fontFamily: linkFont },
                ]}
              >
                <Trans>Withdraw</Trans>
              </Text>
            </Pressable>
          </View>
        }
      />
      {hasFailed ? (
        <Text style={[styles.error, { fontFamily: linkFont }]}>
          <Trans>Couldn't save — try again.</Trans>
        </Text>
      ) : null}
    </View>
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
    // D-13 — the small card behind the real preview mark: FIXED white
    // (`primaryForeground`, mode-invariant) in both colour modes, same
    // scannability exception `QRMark`/the QR screen's backdrop use.
    qrMarkCard: {
      padding: spacingScale['sp-2'],
      backgroundColor: colors.primaryForeground,
      borderRadius: radiiScale['r-md'],
    },
    qrButton: {
      minHeight: layout.hitMin,
      paddingHorizontal: spacingScale['sp-8'],
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: radiiScale['r-pill'],
    },
    qrButtonText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
    section: { gap: spacingScale['sp-5'] },
    sectionHead: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textPrimary,
    },
    // The "Anfragen" heading + its count badge sit on one line, badge trailing.
    sectionHeadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-4'],
    },
    // UI-SPEC § Color item 5 — a SOLID `primary` fill, deliberately distinct
    // from the neutral `badge`/`badgeText` pair above (the "Bald" placeholder
    // badge): a real, actionable count reads differently from a decorative one.
    countBadge: {
      backgroundColor: colors.primary,
      borderRadius: radiiScale['r-pill'],
      paddingHorizontal: spacingScale['sp-4'],
      paddingVertical: spacingScale['sp-1'],
      alignItems: 'center',
      justifyContent: 'center',
    },
    countBadgeText: {
      fontSize: typeRoles.micro.size,
      color: colors.textOnPrimary,
    },
    emptyBody: {
      fontSize: typeRoles.bodySm.size,
      lineHeight: typeRoles.bodySm.size * typeRoles.bodySm.lineHeight,
      color: colors.textMuted,
    },
    // The vertical gap between the "An dich" and "Von dir" sub-groups —
    // smaller than `layout.sectionGap` (that's reserved for the four
    // top-level blocks), larger than the sp-5 row gap within one sub-group.
    requestsGroups: { gap: spacingScale['sp-6'] },
    subGroup: { gap: spacingScale['sp-5'] },
    // UI-SPEC § Typography — same `title2` role as `sectionHead`, reduced
    // visual weight via `textSecondary` colour only, never a smaller size.
    subGroupHead: {
      fontSize: typeRoles.title2.size,
      letterSpacing: typeRoles.title2.letterSpacing,
      lineHeight: typeRoles.title2.size * typeRoles.title2.lineHeight,
      color: colors.textSecondary,
    },
    // Wraps one request `PersonRow` plus its own optional inline failure line,
    // so the failure text renders BELOW the whole row, not inside its trailing
    // slot.
    requestRow: { gap: spacingScale['sp-2'] },
    // The trailing composition for a request row: a primary pill above a
    // plain-text action link, right-aligned — distinct from the search hit's
    // single-element trailing slot (`RelationAction`).
    requestTrailing: { alignItems: 'flex-end', gap: spacingScale['sp-2'] },
    primaryPill: {
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingScale['sp-2'],
      paddingHorizontal: spacingScale['sp-8'],
      backgroundColor: colors.primary,
      borderRadius: radiiScale['r-pill'],
    },
    primaryPillText: {
      fontSize: typeRoles.title3.size,
      color: colors.textOnPrimary,
    },
    // Same value as `RelationAction`'s own `PENDING_OPACITY` — reused, not
    // reinvented (08-02-PLAN Task 2).
    pending: { opacity: PENDING_OPACITY },
    staticChip: {
      minHeight: layout.hitMin,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacingScale['sp-8'],
      backgroundColor: colors.fillQuiet,
      borderRadius: radiiScale['r-pill'],
    },
    staticChipText: {
      fontSize: typeRoles.label.size,
      color: colors.textMuted,
    },
    // `layout.hitMin` applies even to a plain-text action link (UI-SPEC).
    textLinkPressable: {
      minHeight: layout.hitMin,
      minWidth: layout.hitMin,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacingScale['sp-4'],
    },
    textLinkDanger: {
      fontSize: typeRoles.bodySm.size,
      color: colors.dangerText,
    },
    textLinkMuted: {
      fontSize: typeRoles.bodySm.size,
      color: colors.textSecondary,
    },
  });
}
