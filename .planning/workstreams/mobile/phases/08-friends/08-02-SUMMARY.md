---
phase: 08-friends
plan: 02
subsystem: ui
tags: [expo-router, tanstack-query, ts-rest, lingui, react-native, friends]

requires:
  - phase: 08-friends
    plan: "01"
    provides: "friendKeys query-key factory, useFriendMutations (the one mutation-definition site), PersonRow, RelationAction"
  - phase: 07-profile-visibility-friendship-backend
    provides: "listFriendRequests/acceptFriendRequest/declineFriendRequest/withdrawFriendRequest contract routes, friendRequestListsSchema/friendRequestItemSchema"
provides:
  - "Real Requests section on (tabs)/friends.tsx: GET /me/friend-requests backing both 'An dich'/'Von dir' sub-groups in one section, count badge on incoming only"
  - "Accept/Decline/Withdraw wired through the shared useFriendMutations() hook, one hook call per row (IncomingRequestRow/OutgoingRequestRow), so pending/failure state is scoped to exactly the row that triggered it"
  - "Chats block and the friend-suggestions block removed outright from friends.tsx (D-05/D-06) — SoonToast/useSoonToast infrastructure untouched, still called by the QR button placeholder"
affects: [08-03, 08-04, 08-05]

actuals:
  tokens: 8600
  tasks: 2
  commits: 1

tech-stack:
  added: []
  patterns:
    - "Per-row useFriendMutations() call for list items with a below-row failure line: the hook's pendingTargetId/failedTargetId are component-local state, so a wrapper component (IncomingRequestRow/OutgoingRequestRow) that owns both the trailing action AND the inline error text needs exactly ONE hook call — splitting the call between a trailing-only child and a row-level parent would desync the two, since each call to the hook creates an independent state instance"
    - "...ViewState union + compute...State() applied a third time (RequestsViewState) — one query (listFriendRequests) backs both sub-groups, so there is exactly one loading/error surface for the whole section, never one per sub-group"

key-files:
  modified:
    - "apps/mobile/app/(tabs)/friends.tsx"
    - "apps/mobile/locales/de/messages.po"
    - "apps/mobile/locales/en/messages.po"

key-decisions:
  - "Tasks 1 and 2 landed in a single commit. The plan staged them as 'build the section shell with display-only trailing content' then 'wire the three mutations', but the shell's trailing slot and its wiring are the same JSX in the same file — building a throwaway unwired intermediate would have been pure rework with no verification benefit, since Task 1 alone would not have been independently testable (no accept/decline/withdraw to exercise). Both tasks' acceptance criteria (typecheck/lint/lingui compile/the two negative greps) were verified together before the one commit."
  - "The failure line ('Couldn't save — try again.') renders BELOW the whole PersonRow, not inside its trailing slot — PersonRow's trailing prop only inserts content INSIDE the row's flex-row layout. IncomingRequestRow/OutgoingRequestRow wrap PersonRow plus a conditional Text sibling in one View, both fed by the same useFriendMutations() call, so the row and its failure line always agree about which mutation is in flight or failed."
  - "Sub-group heading copy ('To you'/'From you' EN, matching UI-SPEC's 'An dich'/'Von dir' DE) has no explicit EN string in the UI-SPEC Copywriting Contract table — only the German pair is specified there (D-07's own wording). Chose sense-for-sense EN following the project's DE-primary convention, same latitude the UI-SPEC's idle-hint row (#53) already exercises for a Claude-authored default."

patterns-established: []

requirements-completed: [FRND-05]

coverage:
  - id: D1
    description: "The Requests section shows both directions in one section (An dich above Von dir, never a SegmentedControl), each with its own precondition empty copy; a sub-group with rows and one without render correctly at the same time"
    requirement: FRND-05
    verification: []
    human_judgment: true
    rationale: "No RN component-test harness in this repo (STATE.md Blockers/Concerns) — this is a rendering/layout claim that needs an on-device pass. Automated gates (typecheck/lint/lingui compile --strict/vitest) all pass, including the compiler proving requestsState's three-state union is exhaustively handled."
  - id: D2
    description: "Accept/Decline/Withdraw are executable, the affected row disappears without a manual refresh, and a request already answered on another device (404 on accept) shows inline failure copy under exactly that row while the list reloads"
    requirement: FRND-05
    verification: []
    human_judgment: true
    rationale: "The onSettled friendKeys.all invalidation and the 404-to-ApiResponseError-to-onError-to-failedTargetId chain are structurally in place and typecheck-proven (unwrapOk throws on non-200, useFriendMutations' onError sets failedTargetId, the row reads it), but the actual race — two real accounts, one withdrawing while the other taps Accept — needs the two-device on-device UAT this plan's prior-wave-context explicitly deferred here from 08-01's own checkpoint."

duration: 13min
completed: 2026-08-13
status: complete
---

# Phase 8 Plan 2: Requests Section — Both Directions, Three Lifecycle Actions Summary

**The Requests section on `(tabs)/friends.tsx` is real: `GET /me/friend-requests` backs "An dich"/"Von dir" in one section with a count badge, Accept/Decline/Withdraw wired through 08-01's shared mutation hook, and the Chats/suggestions placeholder blocks are gone.**

## Performance

- **Duration:** ~13 min (continuation from 08-01's completion at 14:23 → commit at 14:36)
- **Completed:** 2026-08-13T14:36:28+02:00
- **Tasks:** 2 (dead-block removal + Requests section shell; mutation wiring) — landed in one commit, see Decisions Made
- **Files modified:** 3

## Accomplishments

- The Chats block (D-05/ADR-020 — chat is per-activity from Phase 12, never 1:1) and the friend-suggestions block (D-06 — no endpoint, no requirement) are deleted outright, not dampened. `SoonToast`/`useSoonToast` are untouched and still called by the quiks-code card's `QR zeigen` button (the QR flow itself is 08-04's scope).
- The Requests section reads `GET /me/friend-requests` (one query, `friendKeys.requests`) and renders both `incoming` and `outgoing` in one section, sub-grouped "An dich" (title2/textSecondary, per UI-SPEC) above "Von dir" — never behind a `SegmentedControl` (D-07), so a withdrawn/received request can never be hidden by a toggle.
- The section heading carries a count badge (solid `colors.primary` fill, `colors.textOnPrimary` text) showing the incoming count only; the badge element itself is entirely absent at 0, not a `0` badge (D-08).
- Each sub-group has its own precondition empty copy from the UI-SPEC Copywriting Contract, and a sub-group with rows renders correctly next to one that's empty (both directions were exercised together: a `0`-incoming account with real outgoing rows and vice versa are the same conditional branch).
- Accept/Decline/Withdraw call `acceptRequest`/`declineRequest`/`withdrawRequest` from `useFriendMutations()` — no second definition of any of the three endpoints anywhere in this file. Every mutation invalidates `friendKeys.all` in `onSettled` (08-01's hook, unchanged), which is what resolves "already answered on another device": the error path reloads the lists too.
- Two small row components (`IncomingRequestRow`/`OutgoingRequestRow`) each own exactly one `useFriendMutations()` call, so a row's pending/failure state is scoped to itself — the inline "Couldn't save — try again." line renders below the whole row (outside `PersonRow`'s trailing slot, which only composes content inside the row) fed by the same hook instance that drives the row's buttons.
- Neither Decline nor Withdraw opens a confirmation dialog (Phase-7 D-11/D-12 — idempotent, no history, no cooldown).

## Task Commits

1. **Task 1 + Task 2 combined: Requests section (structure + wiring)** - `d6a5f43` (feat) — see Decisions Made for why both tasks landed in one commit.

## Files Modified

- `apps/mobile/app/(tabs)/friends.tsx` - Chats/suggestions blocks removed; `RequestsViewState` + `computeRequestsState()`; Requests section with both sub-groups, count badge; `IncomingRequestRow`/`OutgoingRequestRow` (new local components, not exported); new styles (`sectionHeadRow`, `countBadge`/`countBadgeText`, `requestsGroups`, `subGroup`/`subGroupHead`, `requestRow`, `requestTrailing`, `primaryPill`/`primaryPillText`, `pending`, `staticChip`/`staticChipText`, `textLinkPressable`, `textLinkDanger`, `textLinkMuted`)
- `apps/mobile/locales/{de,en}/messages.po` - 9 new msgids (`Decline`, `Withdraw`, `To you`, `From you`, `Loading requests…`, two per-sub-group empty texts, response-error copy, mutation-failure copy); German catalog filled with UI-SPEC wording; 4 obsolete msgids (`Chats`'s empty-state text, `People you may know`, its empty text, the old single-block requests-empty text) auto-marked `#~` by `lingui extract`, matching this repo's existing obsolete-entry convention

## Decisions Made

- Tasks 1 and 2 landed in a single commit — see `key-decisions` in the frontmatter for the full reasoning (the section shell and its mutation wiring are the same JSX; a throwaway unwired intermediate would have been pure rework).
- The failure line renders as a sibling below `PersonRow`, not inside its `trailing` slot, and both are driven by one `useFriendMutations()` call per row component — necessary because `pendingTargetId`/`failedTargetId` are hook-local state, not shared across separate hook invocations.
- Sub-group heading English copy ("To you"/"From you") is a Claude default — the UI-SPEC Copywriting Contract only specifies the German wording for this row.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed-block reference in a doc comment broke the plan's own negative-grep acceptance check**
- **Found during:** Task 1 (post-edit verification)
- **Issue:** The screen's top-level JSDoc comment referenced "People you may know" by name to explain why it was removed — a literal string match, which the plan's own automated `<verify>` (`! grep -q 'People you may know' "app/(tabs)/friends.tsx"`) then failed on, since the phrase still existed in a comment even though the actual UI block was gone.
- **Fix:** Reworded the comment to describe the block functionally ("the friend-suggestions block") instead of quoting the removed heading text.
- **Files modified:** `apps/mobile/app/(tabs)/friends.tsx`
- **Verification:** Both negative greps (`Chats unlock`, `People you may know`) confirmed absent; `pnpm typecheck`/`pnpm lint` re-run clean afterward.
- **Committed in:** `d6a5f43`

---

**Total deviations:** 1 auto-fixed (1 bug, caught by the plan's own acceptance check before commit)
**Impact on plan:** None on scope — purely a wording fix caught by the plan's own verification step.

## Issues Encountered

**Carried forward from 08-01's checkpoint, still open:** 08-01's own device check asked to verify "Account B sees Account A's incoming request", deferred to this plan since the Requests section was still the Phase-6 static placeholder at that point. The Requests section is now real (this plan), but this executor has no on-device access — the two-account UAT (B sends A a request, A sees it under "An dich", A taps Annehmen, both end up friends; separately, the race in Task 2's `human-check` (d)) is **still outstanding** and needs a device pass before FRND-05 is trusted end-to-end. Structural correctness (typecheck, the exhaustive `RequestsViewState` union, the 404→`ApiResponseError`→`onError`→`failedTargetId` chain) is proven; the rendering/interaction claims are not.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `IncomingRequestRow`/`OutgoingRequestRow` are local, unexported components (single-use in this file) — 08-03 (Crew list) does not need them and should keep using `PersonRow` directly, same as 08-01 established.
- The Requests section's position (third of four blocks, after the quiks-code card, before Crew) is fixed per D-08 and is the position 08-03's Crew block will land into next — no reordering expected.
- Outstanding device re-verification (see Issues Encountered): both-directions rendering and the three lifecycle actions including the concurrent-answer race, ideally in the same on-device session as 08-03's crew verification since both share the same two-account setup.

---
*Phase: 08-friends*
*Completed: 2026-08-13*

## Self-Check: PASSED
