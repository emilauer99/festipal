---
phase: 08-friends
plan: 01
subsystem: ui
tags: [expo-router, tanstack-query, ts-rest, lingui, react-native, friends]

requires:
  - phase: 07-profile-visibility-friendship-backend
    provides: "searchVisitors/sendFriendRequest/acceptFriendRequest/declineFriendRequest/withdrawFriendRequest/unfriend/listFriends/listFriendRequests contract routes, visitorProfileForeignSchema, relationSchema"
provides:
  - "Real search field on (tabs)/friends.tsx: debounced GET /visitors?q= behind a 2-char floor, no default listing"
  - "PersonRow — the one shared row block for search hits, request rows and crew rows (D-11)"
  - "RelationAction — the one relation -> action mapping (D-04), exhaustive switch over all five Relation values"
  - "use-friend-mutations.ts — the one definition site for send/accept/decline/withdraw/unfriend, shared pendingTargetId/failedTargetId"
  - "friend-queries.ts — friendKeys query-key factory (shared invalidation prefix across search/requests/crew)"
  - "AvatarTile size=40|88 prop for row-context avatars"
  - "D-03 search-mode block-swap: quiks-code card/Requests/Crew unmount while searching, all five E1 result states"
affects: [08-02, 08-03, 08-05]

actuals:
  tokens: 12900
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Relation -> action mapping centralized in one component (RelationAction) with an exhaustive switch and no default branch, so a sixth Relation value fails the typecheck instead of silently rendering nothing"
    - "One mutations hook (useFriendMutations) as the sole call site for every friend-request lifecycle mutation; every call invalidates the shared friendKeys.all prefix in onSettled, not onSuccess, so the error path also refreshes stale lists"
    - "...ViewState union + compute...State() per query, same three/four-state schema as the existing quiks-code card pattern, reused for the search results"

key-files:
  created:
    - apps/mobile/lib/friend-queries.ts
    - apps/mobile/lib/use-friend-mutations.ts
    - apps/mobile/components/PersonRow.tsx
    - apps/mobile/components/RelationAction.tsx
  modified:
    - apps/mobile/components/AvatarTile.tsx
    - apps/mobile/app/(tabs)/friends.tsx
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "Task 1 (tracer) wired only the relation === 'none' branch end to end and returned null for the other four; Task 2 completed the exhaustive switch. This is the plan's own staged design (tracer feedback gate before expansion), not a deviation."
  - "D-03 mode-switch applies to exactly the three named blocks (quiks-code card, Requests, Crew) per the UI-SPEC's explicit enumeration and this plan's own must_have wording — Chats and 'People you may know' stay always-visible until 08-02 deletes them outright (D-05/D-06), even though they sit between the three gated blocks in the current (still-Phase-6) layout order."
  - "Search-mode gating (isSearching) reacts to the immediate `query` value, not the debounced one — the mode switch follows typing itself, matching the UI-SPEC's 'the instant the field holds >=1 character.'"

patterns-established:
  - "Pending-mutation feedback: reduce the active pill's opacity while pendingTargetId === accountId (reusing the existing 0.45 dampening constant, same value ListRow/Pattern-A already use) instead of a spinner — the UI-SPEC specifies no loading affordance for this slot, the real feedback is the post-mutation state swap."

requirements-completed: [FRND-02, FRND-03]

coverage:
  - id: D1
    description: "One search field satisfies both handle lookup and username search via GET /visitors?q=; a relation:none hit's Add button sends a real request and the row updates to a new state without leaving the screen or a manual refresh"
    requirement: FRND-03
    verification:
      - kind: manual_procedural
        ref: "On-device UAT during Task 1's checkpoint — two real Android accounts, OTP via Mailpit (localhost:8025); user confirmed the row updated after tapping Add without a manual refresh"
        status: pass
    human_judgment: true
    rationale: "Screen-level truth has no RN component-test harness in this repo (STATE.md Blockers/Concerns) — every claim about this screen depends on on-device UAT, not an automated suite."
  - id: D2
    description: "All five Relation values map to the correct trailing action (Add/Accept active pills, Requested/Friends static chips, self shows nothing), and the quiks-code card/Requests/Crew blocks unmount while searching and restore when the field is cleared"
    requirement: FRND-02
    verification: []
    human_judgment: true
    rationale: "Built after the Task-1 checkpoint closed; not yet re-verified on device. Automated checks (typecheck/lint/lingui compile/vitest) all pass, including the compiler proving the switch's exhaustiveness, but the visual/interaction claims (chip non-pressability, block unmount vs. hide, pending-opacity visibility) need a device pass before being trusted, per this project's structural verification limit."

duration: 51min
completed: 2026-08-13
status: complete
---

# Phase 8 Plan 1: Friends Search Tracer + Full Relation Mapping Summary

**Real `@username` search wired end-to-end to Phase 7's `/visitors` + friend-request endpoints, with a single shared `RelationAction`/`PersonRow`/`useFriendMutations` trio driving search hits, and the D-03 search-mode block-swap covering all five result states.**

## Performance

- **Duration:** 51 min (13:32 plan read → 14:23 Task 2 commit, includes an on-device checkpoint pause)
- **Started:** 2026-08-13T13:32:49+02:00
- **Completed:** 2026-08-13T14:23:11+02:00
- **Tasks:** 2 (Task 1 tracer, Task 2 full relation mapping + D-03)
- **Files modified:** 8

## Accomplishments

- The Phase-6 inert search field (`editable={false}`, dead badge) is real: debounced `GET /visitors?q=`, gated below `SEARCH_MIN_CHARS`, rendering `PersonRow` hits.
- All five `Relation` values are mapped to the correct trailing action in one place (`RelationAction`), with an exhaustive `switch` (no `default`) so a sixth value would fail the typecheck rather than silently render nothing.
- Every friend-mutation (`sendRequest`/`acceptRequest`/`declineRequest`/`withdrawRequest`/`unfriend`) has exactly one definition site (`use-friend-mutations.ts`), each invalidating the shared `friendKeys.all` prefix in `onSettled` — proven at the device: sending a request updates the row without leaving the screen.
- D-03's search-mode block-swap: the quiks-code card, Requests block and Crew block are conditionally rendered out of the tree (not just hidden) while the field holds text, and all five E1 result states (hint, loading, error, empty, populated) render from one `SearchViewState` union in the vacated slot.
- `AvatarTile` gained a `size?: 40 | 88` prop; the 40px row size resolves initials through the `label` type role instead of `title2`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Tracer — Suche -> Treffer -> Anfrage end-to-end** - `addf174` (feat)
2. **Task 2: Vollstaendige relation-Abbildung, D-03-Modusumschaltung und alle E1-Zustaende** - `f20488d` (feat)

_Both tasks were `tdd="true"` in the plan; this repo has no RN component-test harness (STATE.md), so "TDD" here meant the automated gates (typecheck/lint/lingui compile/vitest) plus on-device UAT rather than a RED/GREEN unit-test cycle — consistent with every prior UI phase in this project._

## Files Created/Modified

- `apps/mobile/lib/friend-queries.ts` - `friendKeys` query-key factory + `SEARCH_MIN_CHARS`/`SEARCH_DEBOUNCE_MS`, re-exports `unwrapOk`/`ApiResponseError` from `festival-queries.ts`
- `apps/mobile/lib/use-friend-mutations.ts` - the one definition of all five friend mutations, shared `pendingTargetId`/`failedTargetId`
- `apps/mobile/components/PersonRow.tsx` - shared row (avatar/displayName/@username/trailing slot) for search hits, request rows and crew rows
- `apps/mobile/components/RelationAction.tsx` - exhaustive `relation` -> action mapping; visible pending-opacity treatment added in Task 2
- `apps/mobile/components/AvatarTile.tsx` - optional `size?: 40 | 88` prop, default `88` unchanged
- `apps/mobile/app/(tabs)/friends.tsx` - real search field, D-03 mode switch, all E1 result states
- `apps/mobile/locales/{de,en}/messages.po` - new search/relation-action copy in both catalogs

## Decisions Made

- D-03's block-swap gates exactly the three named blocks (quiks-code card, Requests, Crew); Chats and "People you may know" stay always-visible in this plan since their removal is D-05/D-06, scoped to 08-02.
- `isSearching` is derived from the immediate `query` state, not the debounced value, so the mode switch tracks typing itself rather than the eventual request.
- Reused the existing `0.45` dampening opacity (same value `ListRow`/Pattern-A already use) for the pending-mutation treatment rather than introducing a new constant or a spinner.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Active pill gave no visual feedback while a mutation was pending**
- **Found during:** Task 1's on-device checkpoint (user report: "Wenn ich auf Hinzufügen klicke, ist keine Ladeanimation o.ä. sichtbar und wenn es fertig ist verschwindet der Button einfach.")
- **Issue:** `Pressable`'s `disabled={isPending}` stops the tap but produces no visual change on its own — the button read as dead/broken, not busy.
- **Fix:** Added a `pending` style (`opacity: 0.45`, the same dampening value already used elsewhere on this screen) applied to both active pills (`none`/`requestIncoming`) while `isPending`. No spinner — the UI-SPEC specifies no loading affordance for this slot, and the real feedback is the post-mutation state swap.
- **Files modified:** `apps/mobile/components/RelationAction.tsx`
- **Verification:** `pnpm typecheck`/`pnpm lint`/`pnpm exec lingui compile --strict`/`pnpm exec vitest run` all pass; visual confirmation deferred to the next device pass (D2 above).
- **Committed in:** `f20488d` (Task 2 commit — orchestrator folded this into Task 2's scope per the checkpoint resolution rather than requiring a separate commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary correctness fix for the tracer's own UX claim ("the action is disabled while pending" needs to be perceivable, not just true); no scope creep — everything else in Task 2 was built exactly as planned.

## Issues Encountered

**Task 1's `human-check` block asked for more than 08-01 delivers.** It required "Account B laedt seine Anfragenliste und sieht A" (Account B loads their requests list and sees A) — but `(tabs)/friends.tsx`'s Requests section is still the static Phase-6 empty-copy placeholder in this plan; the data-driven Requests section (listing real incoming/outgoing requests) is 08-02's scope, per the plan's own Multi-Source Coverage Audit table (D-07/D-08 -> Plan 02). The user's device walkthrough correctly reported this as not-yet-visible. Per orchestrator assessment this is not a defect in 08-01 — the tracer's actual assertion (search -> hit -> request -> row updates without a manual refresh) passed. **This must be re-checked as part of 08-02's own verification**, once the Requests section reads `GET /me/friend-requests` for real.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `PersonRow`/`RelationAction`/`useFriendMutations`/`friendKeys` are ready for 08-02 (Requests section) and 08-03 (Crew list) to consume directly — no new mutation or row component should be built in either plan.
- Outstanding device re-verification: full relation mapping (D2 above) and the pending-opacity fix, both built after the Task-1 checkpoint closed.
- Carried into 08-02: verify Account B actually sees Account A's incoming request once the Requests section is real (see Issues Encountered above).

---
*Phase: 08-friends*
*Completed: 2026-08-13*

## Self-Check: PASSED

All 8 created/modified files verified present on disk; both task commits (`addf174`, `f20488d`) verified present in git history.
