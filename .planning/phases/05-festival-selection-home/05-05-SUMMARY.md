---
phase: 05-festival-selection-home
plan: 05
subsystem: ui
tags: [expo-router, react-navigation, expo-blur, tabs, navigation, lingui, mmkv]

requires:
  - phase: 05-festival-selection-home
    provides: "05-02 (radiiScale + glass color tokens, expo-blur dep, typed routes on), 05-03 (leaveFestival helper, active-festival-storage, festivalKeys/festival home screen), 05-04 (FestivalCard/SegmentedControl styling conventions used as reference)"
provides:
  - "FloatingNav: owned custom floating pill tab bar (2 live + 2 disabled items, glass backdrop)"
  - "(tabs) route group + layout replacing the flat festivals group as the authenticated root shell"
  - "Active-festival cold-start focus redirect (D-06/HOME-01), deep-link-precedence-safe"
affects: [05-06, 05-07, 05-08]

actuals:
  tokens: 4300
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Tabs + custom tabBar render prop (stable expo-router API, not the experimental expo-router/ui headless Tabs)"
    - "Decorative non-route tab items (Friends/Profil) rendered by the custom tab bar itself, absent from state.routes, so they cannot navigate by construction"
    - "One-shot cold-start redirect ref (coldStartRedirectRef) mirroring the existing splashHiddenRef idiom"

key-files:
  created:
    - apps/mobile/components/FloatingNav.tsx
    - apps/mobile/app/(tabs)/_layout.tsx
    - apps/mobile/app/(tabs)/home.tsx
  modified:
    - apps/mobile/app/(tabs)/festivals.tsx (moved from apps/mobile/app/festivals/index.tsx)
    - apps/mobile/app/_layout.tsx

key-decisions:
  - "Used expo-router's deep bottom-tabs type path (expo-router/build/react-navigation/bottom-tabs) for BottomTabBarProps since the top-level expo-router package does not re-export it — verified the type exists at that path before relying on it (Assumption A4)"
  - "state.routes already contains exactly the two live tabs (home, festivals) since Friends/Profil have no backing Tabs.Screen — no filtering needed, only a runtime type-guard for the icon lookup"
  - "clearActiveFestivalSlug() added to handleLogout alongside forceUnauthenticated() (REVIEW 05-05 LOW)"

patterns-established:
  - "Cold-start redirect precedence: pending deep-link href always wins over the persisted active-festival slug, enforced via early return before the slug is ever read"

requirements-completed: [FEST-04, HOME-01]

coverage:
  - id: D1
    description: "FloatingNav renders a glass floating pill with 2 live navigable tabs (Home, Festivals) and 2 disabled decorative items (Friends, Profil) whose Pressable disabled prop + accessibilityState + Lingui-composed 'coming soon' a11y label are all set"
    requirement: "HOME-01"
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile lint"
        status: pass
    human_judgment: true
    rationale: "apps/mobile has no RN component/navigation test harness (05-RESEARCH.md Pitfall 5) — visual glass backdrop, active-tint-pill styling, and disabled-tap-does-nothing behavior can only be confirmed on-device"
  - id: D2
    description: "The authenticated shell is a (tabs) group with FloatingNav as tabBar; Festivals screen moved and still functional (save/enter, logout clears active-festival slug); old festivals group deleted; root guard registers (tabs) + (festival)"
    requirement: "FEST-04"
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile lint"
        status: pass
    human_judgment: true
    rationale: "Navigation flow (tab taps, entering a festival, back returning to the Festivals tab) requires on-device verification — no RN navigation test harness exists (Pitfall 5)"
  - id: D3
    description: "Cold start opens the persisted active festival's home directly once; a pending deep-link href still takes precedence; no-slug falls through to the Home tab; the redirect fires only once per cold start"
    requirement: "HOME-01"
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile lint"
        status: pass
    human_judgment: true
    rationale: "Force-quit-and-relaunch behavior is a device-level cold-start flow with no automated harness in this repo (Pitfall 5) — requires a real Android device per the phase's established UAT convention"

duration: ~30min
completed: 2026-08-06
status: complete
---

# Phase 05 Plan 05: Global Floating Nav Shell + Active-Festival Cold-Start Focus Summary

**Custom FloatingNav tab bar (Home/Festivals live, Friends/Profil disabled) as the new `(tabs)` authenticated root shell, replacing the flat `festivals` route group, plus a cold-start redirect that reopens the visitor's last-entered festival while still deferring to any pending deep link.**

## Performance

- **Duration:** ~30 min
- **Tasks:** 3
- **Files modified:** 6 (3 created, 1 moved/rewritten, 2 modified)

## Accomplishments

- `FloatingNav` — owned floating pill tab bar (`expo-blur` `BlurView` glass backdrop, `glassFill`/`glassBorder`), rendering the 2 live tabs straight from `state.routes` and 2 decorative Friends/Profil items that carry no navigation target at all this phase.
- `app/(tabs)/_layout.tsx` + `app/(tabs)/home.tsx` + moved `app/(tabs)/festivals.tsx` — the new authenticated root shell; the old `app/festivals/` group is gone and the root guard (`app/_layout.tsx`) now registers `(tabs)` + `(festival)`.
- Active-festival cold-start focus redirect in `app/_layout.tsx`: a pending deep-link destination always wins (checked and replayed first, with an immediate `return`); only with no pending href does the effect read the persisted active-festival slug and `router.replace('/f/:slug')`. Guarded to fire once per cold start.

## Task Commits

Each task was committed atomically:

1. **Task 1: FloatingNav custom tab bar (2 live + 2 disabled, glass backdrop)** - `568139f` (feat)
2. **Task 2: (tabs) group + layout, move Festivals screen, swap the root-guard registration** - `da3d705` (feat)
3. **Task 3: Active-festival cold-start focus redirect (D-06 / HOME-01)** - `dca3dca` (feat)

_Note: this plan has no TDD tasks — single commit per task._

## Files Created/Modified

- `apps/mobile/components/FloatingNav.tsx` - owned custom tab bar; live tabs from `state.routes`, decorative Friends/Profil items, `BlurView` glass pill
- `apps/mobile/app/(tabs)/_layout.tsx` - `Tabs` navigator with `initialRouteName="home"` and `FloatingNav` as the `tabBar` render prop
- `apps/mobile/app/(tabs)/home.tsx` - minimal placeholder Home screen (real hero+rail ships in 05-07)
- `apps/mobile/app/(tabs)/festivals.tsx` - moved from `apps/mobile/app/festivals/index.tsx`; `handleLogout` now also calls `clearActiveFestivalSlug()`; `FlatList` gained `scrollBottomPad` clearance
- `apps/mobile/app/_layout.tsx` - root guard now registers `(tabs)` instead of `festivals`; the pending-destination effect extended with the precedence-safe active-festival redirect, guarded by a new `coldStartRedirectRef`

## Decisions Made

- Imported `BottomTabBarProps` from `expo-router/build/react-navigation/bottom-tabs` (the actual location of the type, verified in `node_modules` before use) since the top-level `expo-router` package only re-exports the `Tabs` component binding, not this type — Assumption A4 from RESEARCH.md flagged this as needing direct verification rather than trusting an assumed shape.
- `state.routes` for the `(tabs)` navigator already contains exactly `home` and `festivals` (Friends/Profil have no `Tabs.Screen` at all), so `FloatingNav` renders live tabs by mapping `state.routes` directly rather than filtering a larger set.
- `getActiveFestivalSlug()`/`clearActiveFestivalSlug()` wired into the cold-start effect and `handleLogout` respectively, matching the existing `lib/active-festival-storage.ts` module built in 05-03.

## Deviations from Plan

None - plan executed exactly as written, including all REVIEW 05-05 incorporations (deep-link precedence with early return, `leaveFestival` reliance for cold-start back, `disabled` prop + `accessibilityState` on decorative tabs, explicit `initialRouteName="home"`, the corrected "no route resolves to the deleted placeholder" acceptance wording, and `clearActiveFestivalSlug()` on logout).

Grepping the `app/` + `lib/` tree for `'/(festival)'` and any reference to a deleted static `(festival)/index.tsx` placeholder found none — that file was already replaced by `(festival)/f/[festivalSlug].tsx` in 05-03, so this plan's Task 2 prohibition was already satisfied going in; no cleanup was needed beyond deleting the old `festivals/` group itself.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The `(tabs)` shell and `FloatingNav` are ready for 05-06 (Meine/Alle Festivals rewrite) and 05-07 (real Home hero + rail) to mount into.
- **Manual on-device verification is still required** before this plan's UATs can be marked done (no RN navigation/component test harness exists in this repo — Pitfall 5, consistent with Phase 3/4's established convention). Specifically:
  - Task 2 manual check: tab bar renders with Home + Festivals active, Friends/Profil dimmed and non-interactive, Festivals list still works, back from a festival returns to the Festivals tab.
  - Task 3 manual check: force-quit-and-relaunch after entering a festival opens that festival's home directly; a logged-out deep link still wins after auth; normal tab taps are never re-hijacked into a festival later in the session.
  - Logged as unrun-verify entries in `.planning/WINDOWS.md` (established Android-device convention from Phase 3/4).

---
*Phase: 05-festival-selection-home*
*Completed: 2026-08-06*
