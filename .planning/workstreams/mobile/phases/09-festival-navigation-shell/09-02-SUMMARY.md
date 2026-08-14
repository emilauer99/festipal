---
phase: 09-festival-navigation-shell
plan: 02
subsystem: api
tags: [ts-rest, zod, nestjs, drizzle, postgres, sec-02]

# Dependency graph
requires:
  - phase: 07-profile-visibility-friendship-backend
    provides: "foreignProfileColumns/pickForeignProfile projection (VIS-02), friendship schema + canonicalPair, the listFriends counterpart-resolving join pattern"
  - phase: 02-otp-auth-festival-backend-api
    provides: "the my_festival gate-less save table (ADR-014) this plan joins against"
provides:
  - "GET /festivals/:festivalId/friends contract entry (friendsInFestival), published per D-18"
  - "FriendshipService.listFriendsInFestival(callerId, festivalId) — friendship x my_festival join, both scopes inside the join condition"
  - "FriendshipController.friendsInFestival handler"
  - "apps/api/test/festival-friends-isolation.spec.ts — the SEC-02 cross-tenant proof for this join"
affects: [09-05-festival-friends-tab]

# Actuals (#2632) — pairs with the plan's estimate to calibrate future estimates.
actuals:
  tokens: 5154
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Both tenant/caller scopes live INSIDE the join condition (never a post-filter) — friendsInFestival's innerJoin on myFestival requires eq(myFestival.visitorId, visitorProfile.accountId) AND eq(myFestival.festivalId, festivalId), so there is no code path where the intersection could be widened by a forgotten filter"
    - "A filter-only join table contributes zero columns to the select — myFestival is never in the select map, only in the innerJoin condition, so its savedAt timestamp (a weak presence signal under ADR-014) cannot leak by construction"

key-files:
  created:
    - apps/api/test/festival-friends-isolation.spec.ts
  modified:
    - packages/contracts/src/router.ts
    - apps/api/src/friendship/friendship.service.ts
    - apps/api/src/friendship/friendship.controller.ts

key-decisions:
  - "Checkpoint (D-18, one-way door) resolved by the user as publish-as-specified: :festivalId as a UUID path param (consistent with saveFestival/listTags, not :slug), z.array(friendSchema) response reusing the existing schema, one endpoint serving both the list and the count. User confirmed the admin workstream is not touching packages/contracts during this plan."
  - "The handler lives in FriendshipController, not FestivalController, even though its path starts with /festivals/ — ts-rest binds by contract key, not controller prefix, and the VIS-02 projection (foreignProfileColumns/pickForeignProfile) lives in the friendship module. A handler on FestivalController would have had to inject FriendshipService or re-list the foreign-view columns."
  - "No 404 branch for an unknown festivalId — an empty intersection is a normal resource state, and a 404 would make the endpoint a festival-existence oracle for no client benefit (T-09-07, accepted risk)."

patterns-established:
  - "Fixture pattern for HTTP-level isolation specs that need >2 people: only the accounts that actually issue a request (here caller, stranger) spend an OTP sign-in; every other subject (friendA, friendB) is inserted directly via testAccountId()/canonicalPair, keeping the spec safely under better-auth's 3-requests/60s rate limit"

requirements-completed: [FRND-07]

coverage:
  - id: D1
    description: "GET /festivals/:festivalId/friends exists end to end (contract -> service join -> handler), typegleich mit listFriends, reading the foreign view through the one allowed projection"
    requirement: "FRND-07"
    verification:
      - kind: integration
        ref: "apps/api/test/festival-friends-isolation.spec.ts — case 1 (schnittmenge) and case 6 (field-absence/six-key profile)"
        status: pass
      - kind: unit
        ref: "apps/api/test/projection-uniqueness.spec.ts (VIS-02 invariant, unaffected by the new route)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The friendship x my_festival join is provably tenant-isolated: same friend set, different festivalId, different result — no client-supplied value can widen the intersection"
    requirement: "FRND-07"
    verification:
      - kind: integration
        ref: "apps/api/test/festival-friends-isolation.spec.ts — cases 2 (cross-tenant), 3 (fremde sicht), 4 (leere schnittmenge), 5 (selbstausschluss), 7 (unbekanntes festival), 8 (401 ohne session)"
        status: pass
    human_judgment: false

# Metrics
duration: ~12min
completed: 2026-08-13
status: complete
---

# Phase 09 Plan 02: Festival-Scoped Friends Endpoint Summary

**`GET /festivals/:festivalId/friends` — a published contract entry, a `friendship x my_festival` join with both scopes inside the join condition, and an 8-case HTTP-level SEC-02 proof, all against the live local Postgres**

## Performance

- **Duration:** ~12 min (excluding the checkpoint pause for the user's D-18 decision)
- **Started:** 2026-08-13T23:40:00+02:00 (task execution resumed after checkpoint approval)
- **Completed:** 2026-08-13T23:52:23+02:00
- **Tasks:** 2/2
- **Files modified:** 3 (+ 1 created)

## Accomplishments

- Published `friendsInFestival` (`GET /festivals/:festivalId/friends`) in `packages/contracts/src/router.ts` — `festivalId` as a UUID path param (consistent with `saveFestival`/`listTags`), `z.array(friendSchema)` response (the exact `listFriends` shape, no new schema).
- `FriendshipService.listFriendsInFestival(callerId, festivalId)` extends the existing `listFriends` counterpart-resolving join with exactly one more `innerJoin` on `myFestival`, requiring the counterpart (not the caller) to have saved that festival. `myFestival` contributes no column to the select — pure filter, per ADR-014.
- `FriendshipController.friendsInFestival` — session-only caller identity, no `@AllowAnonymous`, no 404 branch (an empty intersection is a normal state, not an error).
- `apps/api/test/festival-friends-isolation.spec.ts` — 8 HTTP-level cases proving the join is tenant-isolated, including the load-bearing cross-tenant case (same two friends, different `festivalId`, different result) and a field-absence assertion that no `my_festival` value (timestamp, `festivalId`, `visitorId`, `camp`) ever reaches the wire.
- Full `apps/api` suite stays green: 16 files, 140 tests, including `projection-uniqueness.spec.ts` (VIS-02) unaffected by the new route.

## Task Commits

Each task was committed atomically:

1. **Task 1: Contract entry, service join and ts-rest handler** - `ff9f2d9` (feat)
2. **Task 2: SEC-02 cross-tenant proof on HTTP level** - `412ea4f` (test)

**Plan metadata:** _pending — this SUMMARY's own commit_

## Files Created/Modified

- `packages/contracts/src/router.ts` - Added `friendsInFestival` route entry (D-18 one-way door, now published)
- `apps/api/src/friendship/friendship.service.ts` - Added `listFriendsInFestival`, imported `myFestival` from `@quiks/db`
- `apps/api/src/friendship/friendship.controller.ts` - Added `friendsInFestival` handler
- `apps/api/test/festival-friends-isolation.spec.ts` - New: 8-case HTTP-level SEC-02 proof for the new join

## Decisions Made

- **D-18 checkpoint resolved as `publish-as-specified`** (user, via AskUserQuestion) — the contract entry is now a one-way door: path (`:festivalId` UUID) and response shape (`z.array(friendSchema)`) are locked, changing either is a breaking change plus client release from here on. User confirmed the `admin` workstream is not touching `packages/contracts` during this plan.
- No 404 branch for an unknown `festivalId` (matches the plan's `T-09-07` disposition: `accept`, low severity) — an unknown-but-syntactically-valid UUID returns `200 []`, same as a real festival none of the caller's friends saved. The two are tested as distinct cases (7 vs. 4) so this is a deliberate design choice, not an oversight.
- Test fixture kept to exactly two OTP sign-ins (`caller`, `stranger`) to stay under better-auth's 3-requests/60s rate limiter; the two friend subjects (`friendA`, `friendB`) are inserted directly via `testAccountId()` + `canonicalPair`, following the existing `friendship-isolation.spec.ts`/`friend-lists.spec.ts` pattern for subject-only profiles.

## Deviations from Plan

None — plan executed exactly as written, including the must-have prohibitions (no `packages/db` change, no second projection, no `my_festival` column in the select).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `friendsInFestival` is live end to end and ready for `09-05-PLAN.md` (Festival-Friends-Tab) to consume via the ts-rest client.
- `packages/contracts` is no longer being changed by this plan — the collision zone with the `admin` workstream is free again.
- Full local suite (`apps/api`, 16 files / 140 tests) is green; no regressions introduced.

---
*Phase: 09-festival-navigation-shell*
*Completed: 2026-08-13*

## Self-Check: PASSED

All created/modified files present on disk; both task commits (`ff9f2d9`, `412ea4f`) found in `git log`.
