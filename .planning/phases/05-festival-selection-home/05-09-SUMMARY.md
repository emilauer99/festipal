---
phase: 05-festival-selection-home
plan: 09
subsystem: mobile-navigation
tags: [expo-router, react-native, mmkv, ui-navigation, gap-closure]

# Dependency graph
requires:
  - phase: 05-festival-selection-home
    provides: (tabs)/home.tsx and (tabs)/festivals.tsx (05-06/05-07), active-festival-storage.ts and festival-navigation.ts (05-03/05-05), 05-UAT.md gap findings
provides:
  - "festivals-segment-request.ts — consume-once cross-tab segment-request singleton"
  - "Cross-tab see-all/CTA reliably re-opens the Alle segment even when Festivals is already mounted with a manually-switched segment"
  - "Cold-start restore gated on saved-state at persist time (unsaved festivals never restore)"
  - "Cold-start Back fallback targets the Home/Start tab instead of Festivals"
affects: [festival-selection-home, home-shell-navigation]

# Actuals (#2632)
actuals:
  tokens: 2716
  tasks: 3
  commits: 5

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-level in-memory consume-once singleton for cross-screen navigation intent (mirrors pending-destination.ts) — used for a second cross-tab signal type"
    - "useFocusEffect-driven consume of a queued intent instead of a param-value re-sync effect, when the same navigation target can be re-requested with an unchanged param"

key-files:
  created:
    - apps/mobile/lib/festivals-segment-request.ts
    - apps/mobile/lib/__tests__/festivals-segment-request.test.ts
  modified:
    - apps/mobile/app/(tabs)/festivals.tsx
    - apps/mobile/app/(tabs)/home.tsx
    - apps/mobile/lib/festival-navigation.ts

key-decisions:
  - "G-05-2: replaced the param-value re-sync useEffect with a useFocusEffect that consumes a queued segment-request singleton, since the Home CTA always targets the same segment=all param and the effect could never re-fire on a second navigation"
  - "G-05-5b: gated the PERSIST at enter time on the saved-state already known on-screen (a faithful, offline-safe variant of the UAT's option (a)) instead of adding a new async gate to the cold-start read — keeps _layout.tsx's synchronous read unchanged"
  - "G-05-5a: changed only the no-history fallback branch of leaveFestival to router.replace('/home'); the canGoBack() branch (in-tab history) is untouched"

requirements-completed: [FEST-01, FEST-03, FEST-04, HOME-01]

coverage:
  - id: D1
    description: "Home empty-state CTA and rail 'Alle' see-all reliably open the Festivals tab on the Alle segment on every navigation, including after a manual switch to Meine and returning to Home first"
    requirement: "FEST-01"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/festivals-segment-request.test.ts — request/consume round-trip, consume-once drain, no-request null, last-write-wins"
        status: pass
    human_judgment: true
    rationale: "The singleton's consume-once contract is unit-tested, but the end-to-end cross-tab navigation behavior (CTA tap -> focus -> segment switch, surviving a manual tab switch) requires a real device/emulator to observe (05-UAT.md test 2 re-run)."
  - id: D2
    description: "Cold-start restores only a SAVED festival's home; an entered-but-unsaved festival lands on Home/Start instead"
    requirement: "HOME-01"
    verification: []
    human_judgment: true
    rationale: "Requires a real force-quit/relaunch device cycle to observe MMKV persistence and the _layout.tsx cold-start read; not exercisable from the node-env Vitest runner. Logged as WINDOWS.md unrun-verify id 21."
  - id: D3
    description: "Back from a cold-start-launched festival home lands on the Start/Home tab; Back from a normal in-tab push-entry still returns through history"
    requirement: "FEST-04"
    verification: []
    human_judgment: true
    rationale: "Requires a real device to distinguish a replace-based cold-start entry from a push-based in-tab entry and observe the Back target. Logged as WINDOWS.md unrun-verify id 22."

duration: ~15min
completed: 2026-08-09
status: complete
---

# Phase 05 Plan 09: Festivals/Home Navigation Gap Closure Summary

**Consume-once cross-tab segment-request singleton fixes the unreliable see-all CTA (G-05-2), enter-time saved-state gating fixes cold-start restore semantics (G-05-5b), and a single fallback-branch change routes cold-start Back to the Home tab (G-05-5a).**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- New `apps/mobile/lib/festivals-segment-request.ts` module-level consume-once singleton (mirrors `pending-destination.ts`'s idiom) with a passing unit spec covering request→consume, consume-once drain, no-request null, and last-write-wins.
- `festivals.tsx` no longer re-syncs its segment via a param-value `useEffect` (which cannot re-fire when the Home CTA targets the same `segment=all` param on a second navigation); a `useFocusEffect` now consumes the queued segment on every focus, leaving a manually-tapped segment untouched on a plain bottom-tab switch.
- `home.tsx`'s `goToAllFestivals` (both the empty-state CTA and the rail see-all) now queues `requestFestivalsSegment('alle')` before navigating, covering the already-mounted case that the URL param alone could not.
- `festivals.tsx handleEnter` now takes an explicit `saved` flag and only persists the active-festival slug when the row is saved; entering an unsaved festival still works (gate-less, ADR-014) but no longer clobbers/creates a cold-start restore target.
- `home.tsx handleEnter` keeps its unconditional persist (all Home cards come from `listMyFestivals`, i.e. always saved) with a comment documenting why that's still correct.
- `leaveFestival`'s no-history fallback now `router.replace('/home')` instead of `/festivals`; the `canGoBack()` branch (in-tab history) is unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1 (G-05-2): consume-once segment-request singleton + focus-effect re-sync**
   - `4324b98` (test) — failing spec for the singleton (RED)
   - `1473dd2` (feat) — singleton implementation (GREEN)
   - `69f4e61` (fix) — wire into Home CTA and Festivals focus effect
2. **Task 2 (G-05-5b): persist active slug on enter only when saved** - `8462a41` (fix)
3. **Task 3 (G-05-5a): cold-start Back fallback lands on Home/Start tab** - `68e038d` (fix)

_TDD task: 3 commits (test → feat → fix-wiring) instead of the usual test → feat → refactor, since the wiring step is integration, not a refactor of the tested unit._

## Files Created/Modified

- `apps/mobile/lib/festivals-segment-request.ts` - consume-once cross-tab segment-request singleton (new)
- `apps/mobile/lib/__tests__/festivals-segment-request.test.ts` - unit spec for the singleton (new)
- `apps/mobile/app/(tabs)/festivals.tsx` - useFocusEffect segment consume (replacing param re-sync effect); handleEnter(slug, saved) gates the persist
- `apps/mobile/app/(tabs)/home.tsx` - goToAllFestivals queues the segment request; handleEnter comment documents always-saved invariant
- `apps/mobile/lib/festival-navigation.ts` - leaveFestival no-history fallback now targets `/home`

## Decisions Made

- G-05-2: chose the existing module-level consume-once idiom (mirrors `pending-destination.ts`) over a URL nonce param, avoiding typedRoutes `Href` friction while still fixing the re-fire problem at its root.
- G-05-5b: gated the PERSIST (not a new RESTORE-time check) on the row's already-known saved-state — keeps `_layout.tsx`'s cold-start read fully synchronous, no new async dependency, offline-first per CLAUDE.md.
- G-05-5a: touched only the no-history fallback branch of `leaveFestival`, leaving the `canGoBack()` branch (FEST-04's normal in-tab Back) completely unchanged.

## Deviations from Plan

None — plan executed exactly as written. All three tasks followed the plan's specified root-cause fixes and file scope; no architectural changes, no new dependencies.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Next Phase Readiness

- `typecheck`, `lint`, and the full mobile Vitest suite (`7 files / 56 tests`) are green after all three fixes.
- The plan's three `<human-check>` verification steps (G-05-2 cross-tab CTA reliability, G-05-5b cold-start restore gating, G-05-5a cold-start Back target) require a real device/emulator and were NOT run headlessly — logged to `.planning/WINDOWS.md` as unrun-verify entries (ids 21, 22; G-05-2's device check is covered by 05-UAT.md test 2's existing open item) for the `/gsd-verify-work 5` resume.
- Sibling gap-closure plan `05-10` (gaps G-05-7/G-05-7b) is still incomplete and independent of this plan's changes (no shared files).

## Self-Check: PASSED

All 6 created/modified files verified present on disk; all 6 commits (4324b98, 1473dd2, 69f4e61, 8462a41, 68e038d, 583603b) verified present in git log.

---
*Phase: 05-festival-selection-home*
*Completed: 2026-08-09*
