---
phase: 08-friends
plan: "03"
subsystem: ui
tags: [expo-router, tanstack-query, ts-rest, lingui, react-native, friends, intl]

requires:
  - phase: 08-friends
    plan: "01"
    provides: "friendKeys query-key factory (friendKeys.list), useFriendMutations (the one mutation-definition site, including unfriend), PersonRow, RelationAction"
  - phase: 08-friends
    plan: "02"
    provides: "Requests section pattern (RequestsViewState/computeRequestsState, per-row useFriendMutations() call), the screen's four-block layout position for Crew"
  - phase: 07-profile-visibility-friendship-backend
    provides: "listFriends/unfriend contract routes, friendSchema (profile + friendsSince), no foreign-profile detail endpoint (D-04)"
provides:
  - "apps/mobile/lib/friend-sort.ts — sortFriendsByDisplayName with a tested, defined fallback for when Intl.Collator is unavailable or behaves like a code-point sort on Hermes (D-12)"
  - "Real Deine Crew block on (tabs)/friends.tsx: GET /me/friends sorted client-side, tappable PersonRow rows, empty copy naming the three add paths"
  - "apps/mobile/app/friend-detail.tsx — root-level modal, no fetch of its own (reads friendKeys.list cache by accountId param), Freundschaft beenden with Alert.alert confirm, unfriend() wiring, close-on-success only"
affects: [08-04, 08-05]

actuals:
  tokens: 9800
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Capability-probe-with-cache for a non-guaranteed Intl API: resolveCollator() mirrors intl-capability.ts's 'observe before trusting' shape — construct in try/catch, verify on a fixed probe pair (compare('ä','z') < 0), cache the null-or-collator result module-locally"
    - "Diacritic folding via a fixed, explicit character table instead of String.prototype.normalize()/Unicode property escapes — neither is guaranteed on Hermes, matching the same 'no unproven engine assumption' rule intl-polyfill.ts already established for Intl.PluralRules"
    - "Read-the-cache-by-key instead of a second fetch for a detail screen with no backing endpoint: friend-detail.tsx validates the ts-rest response shape ({status,body}) before indexing into it, same idiom (festival)/f/[festivalSlug].tsx's findCachedFestivalBySlug already uses — a stale/malformed cache entry is a miss (screen closes itself), never a crash"
    - "Ref-tracked pending->settled transition to navigate on a mutation's SUCCESS path only, without adding a second onSuccess-style callback shape to useFriendMutations() (which Task 3's own file scope excluded from modification): a boolean ref remembers the prior isPending value across renders, and the effect fires only on the true->false edge, checking failedTargetId to distinguish success from failure after the fact"

key-files:
  created:
    - apps/mobile/lib/friend-sort.ts
    - apps/mobile/lib/__tests__/friend-sort.test.ts
    - apps/mobile/app/friend-detail.tsx
  modified:
    - "apps/mobile/app/(tabs)/friends.tsx"
    - apps/mobile/app/_layout.tsx
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "friend-detail.tsx's modal header carries an empty title (no literal string) — the UI-SPEC's Screens & Navigation Contract specifies 'close X top-right, no back chevron' but names no header text, and the card's own displayName/@username already carry the identity; inventing a title would be a duplicate literal with no contract behind it."
  - "The danger row is styled like ListRow's danger variant but is NOT the ListRow component itself, per the plan's own action text: ListRow always renders a chevron once onPress is set, and this row is a terminal action (Alert confirm), not navigation."
  - "Task 2 and Task 3 both touch friend-detail.tsx but landed in separate commits exactly as the plan staged them (identity card first, unfriend wiring second) — unlike 08-02's Task 1+2 merge, these two are independently meaningful and independently verifiable (the card renders and closes correctly before any unfriend wiring exists)."

patterns-established:
  - "Capability-probe-with-cache for Intl API gaps on Hermes (see tech-stack.patterns) — the template the next non-guaranteed Intl feature this app needs should follow."

requirements-completed: [FRND-06, FRND-08]

coverage:
  - id: D1
    description: "sortFriendsByDisplayName sorts a Friend list alphabetically by displayName (umlaut-correct), always resolves a displayName tie via the unique username, never mutates its input, and has a directly-tested fallback comparator for when Intl.Collator is unavailable or behaves like a code-point sort"
    requirement: FRND-06
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/friend-sort.test.ts — 13 tests, both comparator branches (fallback and Intl.Collator) tested directly, not only through sortFriendsByDisplayName"
        status: pass
    human_judgment: false
    rationale: null
  - id: D2
    description: "Deine Crew renders real friends from GET /me/friends as tappable PersonRow (D-09), sorted via D1's function; loading/error states match the screen's other three blocks; the empty state names the three concrete add paths (search, code, QR) rather than the bare absence, even with real data in the system"
    requirement: FRND-06
    verification: []
    human_judgment: true
    rationale: "No RN component-test harness in this repo (STATE.md Blockers/Concerns) — screen-rendering truth (alphabetical order including umlauts, tap opening the modal, loading/error/empty copy) needs an on-device pass. Automated gates (typecheck/lint/lingui compile --strict/vitest) all pass, including the sort logic's own unit suite, but the rendering claim itself is unverified here."
  - id: D3
    description: "Tapping a crew row opens friend-detail.tsx as a modal with an 88px Sunset-ringed avatar, displayName, @username, buildIdentityLine() (omitted entirely when pronoun and gender are both empty — no dash, no placeholder), and a locale-formatted 'Friends since' date, with no fetch of its own and no new endpoint"
    requirement: FRND-06
    verification: []
    human_judgment: true
    rationale: "Rendering/layout claim (avatar ring, truncation, identity-line omission, date formatting) needs an on-device pass — same structural verification limit as D2. Structural correctness (no apiClient.* read call in this file, cache-shape validation before indexing, effect-based close-if-not-found) is typecheck- and lint-proven."
  - id: D4
    description: "Freundschaft beenden asks via Alert.alert (Cancel passive, End destructive), calls unfriend(accountId) from the one useFriendMutations() definition, invalidates friendKeys.all before closing on success, leaves the card open with inline failure copy on error, and the removed friend disappears from Deine Crew on BOTH accounts without a manual refresh — after which the person is findable again via search with relation none (no cooldown)"
    requirement: FRND-08
    verification: []
    human_judgment: true
    rationale: "The two-account race (A unfriends B, B's own crew list also loses the row, A can re-find B via search afterward) needs on-device UAT this executor has no access to — the same structural limit 08-01/08-02 already logged for their own mutation-lifecycle claims. The onSettled invalidation order, the pending->settled navigation effect, and the failedTargetId-gated inline error are typecheck-proven and covered by the acceptance-criteria greps (apiClient.unfriend appears only in use-friend-mutations.ts)."

duration: 27min
completed: 2026-08-13
status: complete
---

# Phase 8 Plan 3: Real Crew List + Friend Detail + Unfriend Summary

**`Deine Crew` reads `GET /me/friends` sorted client-side with a Hermes-safe, unit-tested `Intl.Collator` fallback; tapping a row opens a no-fetch `friend-detail.tsx` modal with `Freundschaft beenden`, wired through the shared `useFriendMutations().unfriend`.**

## Performance

- **Duration:** ~27 min (continuation from 08-02's completion at 14:36 → final commit at ~15:03)
- **Completed:** 2026-08-13T15:03:00+02:00
- **Tasks:** 3 (friend-sort.ts + tests; Crew block + friend-detail identity card; unfriend confirm + wiring)
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- `lib/friend-sort.ts` closes the D-12 risk named in `08-CONTEXT.md`: `resolveCollator()` probes `Intl.Collator` with a fixed pair (`compare('ä','z') < 0`) exactly like `intl-capability.ts`'s "observe before trusting" pattern, caches the result, and falls back to `foldForSort()` — a fixed diacritic table, deliberately not `String.prototype.normalize()` — when the capability is missing or behaves like a code-point sort. Both comparator branches are exercised directly in the 13-test suite, not only through `sortFriendsByDisplayName`, so the fallback branch is proven even though the node-env runner's own `Intl` is complete.
- A displayName tie (two friends named "Sam") is always resolved via the unique `username`, giving a total order independent of `Array.prototype.sort`'s stability — proven for both input orderings.
- `Deine Crew` on `(tabs)/friends.tsx` is real: `GET /me/friends` (`friendKeys.list`), sorted through `sortFriendsByDisplayName`, rendered as tappable `PersonRow` — only crew rows carry `onPress` (D-09), matching the search-hit/request-row convention already in place. The empty state names the three concrete add paths (search, code, QR) rather than the bare absence, per D-11's still-binding rule.
- `app/friend-detail.tsx` (new): root-level modal, sibling of `(tabs)` like `profil.tsx`, registered inside `_layout.tsx`'s authenticated `Stack.Protected` block. No fetch of its own — reads the friend out of the already-loaded `friendKeys.list` cache by the `accountId` nav param, validating the ts-rest response shape before indexing (same idiom `findCachedFestivalBySlug` established). A missing/vanished entry closes the screen (`back()` or `replace('/friends')`) instead of rendering a broken card.
- The card shows the 88px Sunset-ringed avatar (the one avatar surface this phase applies the ring to), `displayName`, `@username`, `buildIdentityLine()` (dropped entirely, not as a dash, when both `pronoun` and `gender` are empty), and a locale-formatted `Freunde seit …` date via `Intl.DateTimeFormat`.
- `Freundschaft beenden` opens `Alert.alert` (Cancel passive, End destructive) mirroring `mehr.tsx`'s `confirmLogout`. Confirming calls `unfriend(accountId)` from `useFriendMutations()` — the screen still never calls `apiClient.unfriend` directly. A ref-tracked pending→settled transition navigates away only on the success path (the shared hook's `onSettled` invalidation has already fired by then); on failure the card stays open with inline `Couldn't save — try again.` in `dangerText`.

## Task Commits

Each task was committed atomically:

1. **Task 1: `lib/friend-sort.ts` — Collator probe, fallback comparator, tests** - `5bbbf98` (test)
2. **Task 2: Crew block and the `friend-detail` modal screen** - `5736630` (feat)
3. **Task 3: `Freundschaft beenden` with confirmation, closing and invalidation** - `0a61f1a` (feat)

## Files Created/Modified

- `apps/mobile/lib/friend-sort.ts` - `foldForSort`/`resolveCollator`/`createDisplayNameComparator`/`sortFriendsByDisplayName`, no React/Lingui/contract import (node-env-testable)
- `apps/mobile/lib/__tests__/friend-sort.test.ts` - 13 tests: diacritic folding, both comparator branches tested directly, tie-break order-independence, empty/single/non-mutation
- `apps/mobile/app/(tabs)/friends.tsx` - real `Deine Crew` block: `CrewViewState`/`computeCrewState()`, sorted `PersonRow` list with `onPress` to `friend-detail`, new empty/loading/error copy
- `apps/mobile/app/friend-detail.tsx` (new) - modal screen: identity card (avatar/name/handle/identity line/since-date) + `Freundschaft beenden` danger row wired through `useFriendMutations().unfriend`
- `apps/mobile/app/_layout.tsx` - registers `friend-detail` inside the authenticated `Stack.Protected` block, next to `profil`
- `apps/mobile/locales/{de,en}/messages.po` - 9 new msgids (crew empty/loading/error, `Close`, `Friends since {friendsSinceLabel}`, `End friendship`, `End this friendship?`, `End`, the unfriend-confirm body text), German catalog filled per the UI-SPEC Copywriting Contract wording

## Decisions Made

- The modal's header title is an empty string — the UI-SPEC specifies the close-X behavior but no header text, and the card's own name/handle already carry identity; see `key-decisions` in the frontmatter.
- The danger row reuses `ListRow`'s visual danger styling but is hand-built, not the `ListRow` component, because `ListRow` always renders a chevron once `onPress` is set and this action is terminal, not navigational.
- Task 2 and Task 3 stayed as two separate commits (unlike 08-02's merged Task 1+2) because each is independently verifiable: the identity card renders and self-closes correctly before any unfriend wiring exists.

## Deviations from Plan

None - plan executed exactly as written. The `Flagged Assumptions` section of the plan itself (no undo/cooldown/history after unfriend; the Profil meta line's `0 Friends` constant is now visibly wrong) were pre-acknowledged by the plan as intentionally out of scope, not deviations discovered during execution.

## Issues Encountered

**Carried forward from 08-01/08-02, still open at the end of this plan:** the two-account on-device UAT this plan's own `human-check` blocks ask for (Task 2: umlaut-ordered crew list + modal open; Task 3: unfriend removes the row on both sides, then the person is re-findable via search) is **not performed here** — this executor has no device access, consistent with every prior plan in this phase. All automated gates pass: `vitest run lib/__tests__/friend-sort.test.ts` (13/13), `vitest run` (full suite, 206/206), `typecheck`, `lint`, `lingui compile --strict`. See `coverage` D2–D4 above for what remains human-judgment-gated.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `friend-sort.ts` and `friend-detail.tsx` are complete and need no further wiring from 08-04/08-05.
- Phase 8's Friends screen now has all four real blocks (search, quiks-code card, Requests, Crew) — 08-04 (QR add flow) and 08-05 add new screens/surfaces rather than modifying this one further, per the phase's own plan sequencing.
- Outstanding device re-verification, ideally in one combined on-device session per the phase's `prior_wave_context` note: 08-01's full relation mapping, 08-02's both-directions Requests section including the concurrent-answer race, and this plan's Crew ordering + friend-detail card + unfriend lifecycle (including the both-sides-removal race). The orchestrator collects these for phase-level UAT.
- The Profil screen's meta line still shows a hardcoded `0 Friends` (flagged by this plan itself, not fixed here — no requirement covers it and PROF-02 is out of v1.1 scope); recommend a `/gsd-quick` follow-up to wire it to `friendKeys.list` now that real data exists.

---
*Phase: 08-friends*
*Completed: 2026-08-13*

## Self-Check: PASSED

All 7 created/modified files verified present on disk; all three task commits (`5bbbf98`, `5736630`, `0a61f1a`) verified present in git history.
