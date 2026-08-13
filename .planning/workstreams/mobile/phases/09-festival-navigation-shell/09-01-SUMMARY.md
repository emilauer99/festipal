---
phase: 09-festival-navigation-shell
plan: 01
subsystem: ui
tags: [expo-router, lingui, react-native, navigation]

# Dependency graph
requires:
  - phase: 06-profile-friends-placeholders
    provides: the four-tab global `FloatingNav` (`home`/`festivals`/`friends`/`mehr`) this plan renames the first entry of
requires_also:
  - phase: 05-festival-selection-home
    provides: the cold-start-redirect / `leaveFestival` non-dead-end mechanism this plan retargets
provides:
  - "First global tab route renamed home -> start (route file, `initialRouteName`, `Tabs.Screen`, `FloatingNav`'s `LiveRouteName` union/icon table/type-guard/fallback, `leaveFestival`'s fallback target, `ColdStartRedirect`'s discriminant + href mapping)"
  - "Lingui msgid `Start` in both catalogs (DE unchanged value, EN moved from `Home`)"
  - "Device-verified: no Unmatched-Route regression on cold start, deep link or repeated dev-client launches"
affects: [09-02-festival-tab-navigator, 09-03-app-header, 09-04-dashboard-tab, 09-05-placeholder-tabs, 09-06-festival-friends-tab]

# Actuals (#2632)
actuals:
  tokens: 5400
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hard rename without an alias route (D-19): renaming a route requires touching exactly the route file plus every module that names the route as a literal (nav layout, tab bar, redirect targets, pure lib functions and their tests) in one atomic change, never leaving a second file that also resolves the URL."

key-files:
  created:
    - apps/mobile/app/(tabs)/start.tsx (git-moved from home.tsx, content unchanged)
  modified:
    - apps/mobile/app/(tabs)/_layout.tsx
    - apps/mobile/app/_layout.tsx (one historical comment reworded, see Deviations)
    - apps/mobile/components/FloatingNav.tsx
    - apps/mobile/lib/festival-navigation.ts
    - apps/mobile/lib/cold-start-redirect.ts
    - apps/mobile/lib/__tests__/cold-start-redirect.test.ts
    - apps/mobile/lib/__tests__/root-redirect.test.ts
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "ColdStartRedirect's discriminant was renamed 'home' -> 'start' alongside its href (Flagged Assumption in 09-01-PLAN.md, resolved for the rename): a union member named after the old route would itself be a second name for the same screen, which D-19 forbids."
  - "EN Lingui msgstr for the renamed msgid is 'Start', not 'Home' (D-20): a literal msgid \"Start\" translating to \"Home\" would read as a catalog bug on next read."

patterns-established: []

requirements-completed: [NAV-03]

coverage:
  - id: D1
    description: "First global tab route, its navigator registration, FloatingNav's four internal touch points, leaveFestival's fallback target, and ColdStartRedirect's discriminant/href mapping all renamed home -> start, with no alias route left resolving the old path"
    requirement: "NAV-03"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/cold-start-redirect.test.ts (all cases)"
        status: pass
      - kind: unit
        ref: "apps/mobile/lib/__tests__/root-redirect.test.ts (all cases)"
        status: pass
      - kind: other
        ref: "grep -rn \"'/home'\" apps/mobile/app apps/mobile/lib --include=*.ts --include=*.tsx | grep -v '^\\s*\\*' (zero matches)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Lingui catalog carries msgid \"Start\" in both locales (DE msgstr unchanged \"Start\", EN msgstr moved from \"Home\" to \"Start\"), no obsolete \"Home\" entry remains"
    requirement: "NAV-03"
    verification:
      - kind: other
        ref: "pnpm exec lingui compile --strict (exit 0, no empty translations)"
        status: pass
    human_judgment: false
  - id: D3
    description: "On-device UAT: tab label reads 'Start' in both device languages; cold start with/without a saved festival lands on a real route; a festival deep link resolves; repeated dev-client launches never show the Unmatched-Route screen; leaving a cold-start-opened festival returns to the Start tab without exiting the app"
    verification:
      - kind: manual_procedural
        ref: "09-01-PLAN.md Task 2 <human-check> — user-run on Android device/emulator via `npx expo start -c` from apps/mobile"
        status: pass
    human_judgment: true
    rationale: "Route-resolution correctness at this exact surface (Expo Router's static, guard-agnostic linking map) has no node-env Vitest equivalent — this is the same class of defect (first-login-unmatched-route) that survived a fully-green node-env suite in Phase 5. Only a real device/emulator run proves the fix."

# Metrics
duration: 29min
completed: 2026-08-13
status: complete
---

# Phase 9 Plan 1: Start Tab Rename (NAV-03) Summary

**Hard-renamed the app's first global tab from `home` to `start` across route, navigator, tab bar, redirect targets, tests and both Lingui catalogs — device-verified with no Unmatched-Route regression.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-08-13T21:14:22Z
- **Completed:** 2026-08-13T21:43:26Z
- **Tasks:** 2
- **Files modified:** 10 (9 code + the plan's own metadata excluded)

## Accomplishments
- `apps/mobile/app/(tabs)/home.tsx` git-moved to `start.tsx` (content byte-identical) and every module that names the route as a literal — `(tabs)/_layout.tsx`, `FloatingNav.tsx` (4 touch points), `festival-navigation.ts`'s `leaveFestival` fallback, `cold-start-redirect.ts`'s discriminant and href mapping — moved to `start`/`/start` in one atomic change, with both affected test files updated in the same task.
- No alias route left behind: `grep -rn "'/home'" apps/mobile/app apps/mobile/lib` returns zero matches (excluding comments), verified against the plan's own acceptance criterion.
- Lingui catalog `msgid "Home"` replaced by `msgid "Start"` in both locales (DE `msgstr` unchanged "Start"; EN `msgstr` moved from "Home" to "Start", D-20) — `lingui compile --strict` passes with zero empty translations.
- Six-point on-device UAT (tab label in both device languages, cold start with/without saved festival, festival deep link, repeated dev-client launches, non-dead-end back from a cold-start-opened festival) verified by the user on a real Android device — no Unmatched-Route regression, matching the Phase-5 `first-login-unmatched-route` lesson this plan was designed against.

## Task Commits

Each task was committed atomically:

1. **Task 1: Route, Navigator, FloatingNav und die beiden lib-Module auf `start` umstellen** - `f3f1f6c` (feat)
2. **Task 2: Lingui-Katalog `Home` -> `Start` und die Geraeteabnahme des Renames** - `5e44cda` (feat)

_No plan-metadata commit yet — this SUMMARY's own commit closes the plan._

## Files Created/Modified
- `apps/mobile/app/(tabs)/start.tsx` - renamed from `home.tsx`, content unchanged (same `HomeScreen` function, styles, query logic)
- `apps/mobile/app/(tabs)/_layout.tsx` - `initialRouteName="start"`, first `Tabs.Screen name="start"`
- `apps/mobile/app/_layout.tsx` - one historical comment reworded to drop a stale `'/home'` literal (Rule 3, see Deviations)
- `apps/mobile/components/FloatingNav.tsx` - `LiveRouteName` union, `LIVE_TAB_ICON` key, `isLiveRouteName` guard, fallback route name and `liveTabLabel`'s `t` call all moved to `start` (the `Home` glyph itself is unchanged)
- `apps/mobile/lib/festival-navigation.ts` - `leaveFestival`'s no-history fallback now targets `/start`
- `apps/mobile/lib/cold-start-redirect.ts` - `ColdStartRedirect`'s third discriminant and `coldStartRedirectHref`'s mapping moved from `'home'`/`/home` to `'start'`/`/start`
- `apps/mobile/lib/__tests__/cold-start-redirect.test.ts` - all discriminant/href literal assertions updated
- `apps/mobile/lib/__tests__/root-redirect.test.ts` - the passed-through cold-start href literal updated
- `apps/mobile/locales/de/messages.po` - `msgid "Start"` with `msgstr "Start"`, obsolete `Home` entry removed
- `apps/mobile/locales/en/messages.po` - `msgid "Start"` with `msgstr "Start"` (was "Home"), obsolete `Home` entry removed

## Decisions Made
- **`ColdStartRedirect`'s discriminant renamed alongside its href** (resolves the Flagged Assumption in `09-01-PLAN.md`): D-19 requires a hard rename with no second name for the same screen, and a union member still called `'home'` while producing `/start` would be exactly that.
- **EN catalog value is "Start", not "Home"** (D-20, literal requirement): the tab reads "Start" in both languages per the design; a stale EN value would look like a translation bug on next read.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reworded a historical comment in `app/_layout.tsx` that quoted the pre-rename route literal**
- **Found during:** Task 1, running the plan's own acceptance-criteria grep (`grep -rn "'/home'" apps/mobile/app apps/mobile/lib --include=*.ts --include=*.tsx | grep -v '^\s*\*'`)
- **Issue:** A `//`-style historical comment describing the Phase-5 `first-login-unmatched-route` fix's round-1 attempt contained the literal string `router.replace('/home')`. The comment starts with `//`, not `*`, so the acceptance criterion's comment-exclusion filter (`grep -v '^\s*\*'`) did not exclude it, and it was the only remaining match after the rest of the rename.
- **Fix:** Reworded the comment to describe the same historical fact without embedding the literal quoted path: `router.replace` to the pre-rename first tab (09-01 NAV-03 renamed it to `/start`)`. No behavior change — `app/_layout.tsx` was not otherwise in this plan's `files_modified` list.
- **Files modified:** `apps/mobile/app/_layout.tsx`
- **Verification:** Re-ran the exact acceptance-criteria grep after the edit — zero matches.
- **Committed in:** `f3f1f6c` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No scope creep — a one-line comment reword needed to satisfy the plan's own explicit acceptance criterion. `lib/deep-link.ts` remains untouched, confirmed via `git diff --stat`.

## Issues Encountered
No Android device or emulator was attached in the execution environment (`adb devices` returned an empty list), so Task 2's on-device UAT could not be run by the executor. Per the checkpoint protocol, the automatable portion of Task 2 (Lingui extract/compile, typecheck, lint, vitest) was committed and the plan paused at a `checkpoint:human-verify`. The user ran the six-point on-device check on real hardware and reported "verified" with no issues — recorded above as coverage item D3.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
The renamed `start` surface is now the stable target for every subsequent plan in this phase — 09-02 (festival tab navigator) and 09-03 (`AppHeader`) both reference `/start` as the global "go home" destination (D-02, D-06) and build against this already-renamed route, per D-21. No blockers.

---
*Phase: 09-festival-navigation-shell*
*Completed: 2026-08-13*

## Self-Check: PASSED

- FOUND: `apps/mobile/app/(tabs)/start.tsx`
- FOUND: `apps/mobile/lib/cold-start-redirect.ts`
- FOUND: `.planning/workstreams/mobile/phases/09-festival-navigation-shell/09-01-SUMMARY.md`
- FOUND: commit `f3f1f6c`
- FOUND: commit `5e44cda`
