---
phase: 09-festival-navigation-shell
plan: 03
subsystem: ui
tags: [expo-router, react-query, react-context, lingui, react-native, navigation]

# Dependency graph
requires:
  - phase: 09-01
    provides: the renamed global `start` tab (route, `FloatingNav`, `leaveFestival` fallback) this plan's festival tab bar sits alongside
provides:
  - "A dedicated `Tabs` navigator at `app/(festival)/f/[festivalSlug]/_layout.tsx` with five real registered routes (Dashboard/Aktivitaeten/Friends/Timetable/Lageplan) and a layout-level D-10 not-found/unreachable gate that replaces the whole area (no tab bar, no tab content) while the festival is unresolved"
  - "`FloatingNav` parametrized with a `variant: 'global' | 'festival'` prop (D-01) instead of a second component — the global call site is unchanged (default variant)"
  - "`lib/festival-gate.ts` — the pure, unit-tested D-10 branching function (`resolveFestivalGateState`), the single source of truth for `showLoading`/`showTransportError`/`showNotFound`/`showTabs`/`festival`"
  - "`lib/festival-context.ts` — `FestivalContextProvider`/`useFestivalContext()`; tab screens read the layout's already-resolved `Festival` instead of re-querying it"
  - "`components/PlaceholderScreen.tsx` — the shared full-screen honest empty state (icon/heading/body, no owned copy, no `SoonToast`) used by Aktivitaeten/Timetable/Lageplan"
  - "`findCachedFestivalBySlug` hoisted into `lib/festival-queries.ts` (shared instant-paint helper for the gate and, from 09-04, `AppHeader`)"
affects: [09-04-app-header, 09-05-festival-friends-tab, 09-06-cashless]

# Actuals (#2632)
actuals:
  tokens: 17100
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Layout-owned React Context for a nested Tabs navigator: a layout that never unmounts across tab switches resolves data ONCE and provides it via Context to its tab screens, instead of each tab screen re-querying the same key with its own useQuery — two independent observers of one query key can transiently disagree on tab re-focus, which is a real device bug (see Deviations)."
    - "Pure branching functions for React Query-derived UI gates (`resolveFestivalGateState`) — the RN screen stays untestable under the node-env Vitest runner, but its DECISION logic is extracted and unit-tested."

key-files:
  created:
    - apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx (D-10 gate + five-tab Tabs navigator)
    - apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx (moved from f/[festivalSlug].tsx, Dashboard tab)
    - apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx
    - apps/mobile/app/(festival)/f/[festivalSlug]/friends.tsx (stub — real content in 09-05)
    - apps/mobile/app/(festival)/f/[festivalSlug]/timetable.tsx
    - apps/mobile/app/(festival)/f/[festivalSlug]/map.tsx
    - apps/mobile/components/PlaceholderScreen.tsx
    - apps/mobile/lib/festival-gate.ts
    - apps/mobile/lib/festival-context.ts
    - apps/mobile/lib/__tests__/festival-gate.test.ts
  modified:
    - apps/mobile/app/(festival)/_layout.tsx (headerShown: false)
    - apps/mobile/components/FloatingNav.tsx (variant prop, festival item table)
    - apps/mobile/lib/festival-queries.ts (hoisted findCachedFestivalBySlug)
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "Tab screens read the layout-resolved Festival via React Context (`useFestivalContext()`), not their own `useQuery` on the same key — added mid-plan after device UAT found the Dashboard tab going blank on tab re-entry (see Deviations). This is stricter than the plan's original 'same query key, React Query dedupes it' design: there is now no second observer at all, so there is nothing left to desync."
  - "The D-10 gate branching (`resolveFestivalGateState`) is a pure function in `lib/festival-gate.ts`, not inlined in the layout component — makes the branching unit-testable and is the single source of truth both the loading/error/not-found rendering AND the Context value depend on."
  - "Task 1's four temporary tab-stub screens (before Task 2's real placeholder copy landed) reused ONE shared Lingui string ('This tab isn't built yet.') across all four call sites to minimize catalog churn between the two tasks of the same plan — three were replaced in Task 2; `friends.tsx` keeps it until 09-05 (recorded as a Known Stub)."

patterns-established:
  - "Layout-owned Context for nested-navigator data sharing (see tech-stack.patterns) — the pattern to follow for any future nested Tabs/Stack that gates on an async resolution before rendering children."

requirements-completed: [NAV-01, NAV-02]

coverage:
  - id: D1
    description: "Entering a festival shows a real five-tab bar (Dashboard/Aktivitaeten/Friends/Timetable/Lageplan), landing on the Dashboard with real festival data; the layout-level D-10 gate replaces the WHOLE area (no tab bar, no tab content) on 404 or transport error, and recovers via Retry"
    requirement: "NAV-01"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/festival-gate.test.ts (all 9 cases: pending/cached, 200, 404-is-not-transport-error, transport error, missing slug, stability regression)"
        status: pass
      - kind: manual_procedural
        ref: "09-03-PLAN.md Task 1 <human-check>, re-verified after the blank-on-reentry fix — user confirmed all 8 points on device (2026-08-14), including the added 'switch tabs -> return to Dashboard, repeatedly' repro case"
        status: pass
    human_judgment: true
    rationale: "RN screen/navigation truth has no node-env Vitest equivalent in this project (STATE.md: no RN component-test harness) — only the pure gate-derivation logic is unit-tested; the actual five-tab rendering, D-10 area replacement and tab navigation were confirmed on a real Android device."
  - id: D2
    description: "FloatingNav is parametrized (variant: 'global' | 'festival') instead of forked into a second component; the global 4-tab call site is unchanged (default variant) and the festival 5-tab bar uses the same glass/pill/active-inactive treatment, no dampening, no badge (D-01/D-14)"
    requirement: "NAV-01"
    verification:
      - kind: manual_procedural
        ref: "09-03-PLAN.md Task 1 <human-check> point 4 (active/inactive identical across all five, both color modes)"
        status: pass
    human_judgment: true
    rationale: "Visual/interaction truth of a shared RN tab bar component — confirmed on device in the same round-2 checkpoint as D1."
  - id: D3
    description: "Aktivitaeten/Timetable/Lageplan render the shared PlaceholderScreen with per-tab icon, heading and body naming their REAL precondition (quiks itself for Aktivitaeten, the festival for Timetable/Lageplan) — no spinner, no badge, no date/phase promise, no SoonToast call"
    requirement: "NAV-02"
    verification:
      - kind: other
        ref: "cd apps/mobile && pnpm typecheck && pnpm lint && pnpm exec vitest run && pnpm exec lingui compile --strict (exit 0; grep confirms no useSoonToast/SoonToast import in PlaceholderScreen.tsx or the three tab screens, no useQuery/apiClient import in the three tab screens)"
        status: pass
      - kind: manual_procedural
        ref: "09-03-PLAN.md Task 2 <human-check> (icon/heading/body per tab, no spinner/badge/date-promise, max system font scale scrolls instead of clipping, EN locale strings)"
        status: unknown
    human_judgment: true
    rationale: "Task 2's device human-check has NOT been run yet — deferred by explicit instruction to complete the plan now rather than pause for a third checkpoint. Recorded as WINDOWS.md entry #40 (unrun-verify). The copy/structure/lint/type/test evidence is solid; only the on-device visual/font-scale/locale confirmation is outstanding."

# Metrics
duration: ~55min active work across two device-verification checkpoints (see Issues Encountered for the gap)
completed: 2026-08-14
status: complete
---

# Phase 9 Plan 3: Five-Tab Festival Navigator (NAV-01, NAV-02) Summary

**Split the single festival screen into a five-tab `Tabs` navigator with a layout-level D-10 gate, a parametrized `FloatingNav`, and a shared honest `PlaceholderScreen` for the three content-less tabs — plus a mid-plan fix for a real device bug (Dashboard tab blanking on tab re-entry) found during UAT.**

## Performance

- **Duration:** ~55 min of active implementation, split across two on-device verification checkpoints (the plan is `autonomous: false` — Task 1 is a `type="tracer"` task that gates on device UAT before any expansion work)
- **Started:** 2026-08-13T23:56 (first task-1 read/implementation pass)
- **Completed:** 2026-08-14T10:49:20+02:00 (Task 2 commit)
- **Tasks:** 2 planned tasks + 1 mid-plan bugfix (found during Task 1's device-verification round 1)
- **Files modified:** 16 (14 code files + both Lingui catalogs; one file deleted as part of the `[festivalSlug].tsx` → `[festivalSlug]/index.tsx` split)

## Accomplishments
- Split `app/(festival)/f/[festivalSlug].tsx` into a folder: `_layout.tsx` (five-tab `Tabs` navigator + the D-10 not-found/unreachable gate, now living one layer above the tabs instead of inside a single screen) and `index.tsx` (the Dashboard tab, minus the gate logic).
- Four new registered festival routes — `activities`, `friends`, `timetable`, `map` — all real Expo Router routes from the first commit (NAV-01: none of the five tabs is decorative).
- `FloatingNav` parametrized with `variant: 'global' | 'festival'` (D-01) instead of a second tab-bar component; the festival item table uses `LayoutDashboard`/`Sparkles`/`Users`/`CalendarClock`/`MapPin`, same glass/pill/active-inactive treatment as the existing 4-tab bar (D-14 — no dampening, no badge, no visual distinction between the two "real" tabs and the three placeholders).
- `PlaceholderScreen` (new, shared) renders the three content-less tabs' honest empty states — Aktivitaeten names quiks as its precondition, Timetable and Lageplan name the festival (D-13); none promises a date or phase number (NAV-02).
- **Mid-plan device bug found and fixed:** the Dashboard tab went blank after switching to another festival tab and back. Root cause was two independent `useQuery` observers (the layout gate's and the Dashboard's own) on the same query key transiently disagreeing on tab re-focus. Fixed by extracting the gate's branching into a pure, unit-tested function (`lib/festival-gate.ts`) and having tab screens read the already-resolved festival from a layout-owned React Context (`lib/festival-context.ts`) instead of re-querying it. Re-verified on device — all 8 checkpoint points pass, including repeated tab-switch-and-return.

## Task Commits

Each task was committed atomically:

1. **Task 1 (Tracer): Five-tab navigator with layout gate** — `edfd5c1` (feat)
2. **Fix: blank Dashboard tab on tab re-entry** (found during Task 1 device-verification round 1, fixed before proceeding) — `c16369f` (fix)
3. **Task 2: PlaceholderScreen and the three honest placeholder tabs** — `a17df60` (feat)

_No plan-metadata commit yet — this SUMMARY's own commit closes the plan._

## Files Created/Modified
- `apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx` — new: the D-10 gate (loading/transport-error/not-found, replacing the WHOLE area with no tab bar) plus the five-tab `Tabs` navigator; provides the resolved `Festival` via `FestivalContextProvider`
- `apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx` — moved from `f/[festivalSlug].tsx`; Dashboard tab content unchanged (identity block, two key-fact rows) minus the gate logic and the four `ComingSoonTile`s (removed ERSATZLOS, D-07); reads the festival via `useFestivalContext()`
- `apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx` — `PlaceholderScreen` with `Sparkles` icon, copy naming quiks as the precondition
- `apps/mobile/app/(festival)/f/[festivalSlug]/timetable.tsx` — `PlaceholderScreen` with `CalendarClock` icon, copy naming the festival as the precondition
- `apps/mobile/app/(festival)/f/[festivalSlug]/map.tsx` — `PlaceholderScreen` with `MapPin` icon, copy naming the festival as the precondition
- `apps/mobile/app/(festival)/f/[festivalSlug]/friends.tsx` — registered route stub ("This tab isn't built yet."); real content lands in 09-05 (Known Stub, WINDOWS #41)
- `apps/mobile/app/(festival)/_layout.tsx` — `headerShown: false` added so the native `Stack` header no longer sits above the nested tab navigator
- `apps/mobile/components/FloatingNav.tsx` — `variant: 'global' | 'festival'` prop; two item tables (`GLOBAL_TAB_ICON`/`FESTIVAL_TAB_ICON`), type guards and fallbacks resolved per variant; global call site (`(tabs)/_layout.tsx`) unchanged (default variant)
- `apps/mobile/components/PlaceholderScreen.tsx` — new shared component (`{ icon, heading, body }`, no owned copy, no `SoonToast`), `ScrollView` with `flexGrow: 1` content container so large system font scales scroll instead of clip
- `apps/mobile/lib/festival-gate.ts` — new: `resolveFestivalGateState()`, the pure D-10 branching function, unit-tested
- `apps/mobile/lib/festival-context.ts` — new: `FestivalContextProvider`/`useFestivalContext()`
- `apps/mobile/lib/festival-queries.ts` — `findCachedFestivalBySlug` hoisted in (unchanged logic) so the gate and (from 09-04) `AppHeader` share one instant-paint helper
- `apps/mobile/lib/__tests__/festival-gate.test.ts` — new: 9 test cases for `resolveFestivalGateState`
- `apps/mobile/locales/{de,en}/messages.po` — five festival tab labels (Dashboard/Aktivitaeten/Friends/Timetable/Lageplan), the three placeholder heading/body pairs, and the shared interim stub string

## Decisions Made
- **Tab screens read the resolved festival from a layout-owned Context, not a second `useQuery`** — see key-decisions in frontmatter and the Deviations entry below. This changed Task 1's originally-planned approach (a second `useQuery` on the same key, relying on React Query dedup) after device UAT surfaced a real defect in that design.
- **`resolveFestivalGateState` is a standalone pure function**, not inlined in `_layout.tsx` — makes the D-10 branching unit-testable under the node-env Vitest runner and gives the fix a regression test, per this project's structural rule that RN screens themselves are not testable that way.
- **Task 1's four temporary tab-stub screens shared ONE Lingui string** ("This tab isn't built yet.") rather than four distinct interim sentences, to minimize catalog churn between Task 1 and Task 2 (three of the four call sites were replaced within the same plan).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dashboard tab went blank after switching to another festival tab and back**
- **Found during:** Task 1's on-device verification (round 1) — user reported point 3 of the checklist failing: "opening a festival lands on the Dashboard correctly, but after switching to another tab and tapping Dashboard again, the Dashboard tab shows a white/blank screen."
- **Issue:** `index.tsx` (the Dashboard tab) ran its own `useQuery` against the SAME `festivalKeys.detail(slug)` key the layout gate (`_layout.tsx`) already subscribed to. Two independent React Query observers of one query key can transiently disagree (e.g. one mid-retry/refetch right after its tab is re-focused) even though they share one cache entry. When that happened, `index.tsx`'s own `festival` derivation came up `undefined` for a render, and its `if (!festival) return null` guard rendered a blank screen.
- **Fix:** Extracted the D-10 gate branching into a pure function (`lib/festival-gate.ts`, `resolveFestivalGateState`) — the single source of truth for `showLoading`/`showTransportError`/`showNotFound`/`showTabs`/`festival`. Added `lib/festival-context.ts` so the layout (which never unmounts across tab switches — only the tab screens under it do) provides its resolved `Festival` ONCE via Context; `index.tsx` now reads it via `useFestivalContext()` and no longer runs any query of its own, so it can never desync from the gate that let the `Tabs` navigator render in the first place.
- **Files modified:** `apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx`, `.../index.tsx`, new `apps/mobile/lib/festival-gate.ts`, new `apps/mobile/lib/festival-context.ts`, new `apps/mobile/lib/__tests__/festival-gate.test.ts`
- **Verification:** 9 new unit tests for `resolveFestivalGateState` (pending/cached instant-paint, 200, 404-is-never-a-transport-error, transport error regardless of cache, missing slug, and a stability regression case). Full automated suite re-run green (249/249 tests, typecheck/lint/lingui compile all exit 0). Re-verified on device by the user (2026-08-14): all 8 checkpoint points pass, explicitly including repeated "enter festival -> switch tabs -> return to Dashboard" cycles across all four other tabs.
- **Committed in:** `c16369f` (separate fix commit, between the Task 1 and Task 2 feature commits)

---

**Total deviations:** 1 auto-fixed (1 bug, found via device UAT and fixed before proceeding to Task 2)
**Impact on plan:** No scope creep — the fix stayed within Task 1's own files plus two small new `lib/` modules that directly serve the same D-10 gate this task was already building. The fix made the gate's contract STRICTER than originally planned (zero duplicate query observers instead of "same key, relies on dedup"), which is a net-positive shift, not a workaround.

## Issues Encountered
- **Device UAT round 1 found the blank-on-reentry bug** documented above — resolved before Task 2 started.
- **Stale dev-client APK (NitroModules) noted by the user as environment-only**, unrelated to this plan's code: resolved by rebuilding via `npx expo run:android` from `apps/mobile`, no code change involved.
- **Task 2's `<human-check>` has not been run on device yet.** Per explicit instruction, the plan was completed (Task 2 committed, SUMMARY written) without pausing for a third device checkpoint. The automated evidence is solid (typecheck/lint/vitest/lingui compile all green; no `SoonToast`/`useQuery`/`apiClient` imports in the three placeholder screens, confirmed by grep) but the on-device visual checks — per-tab icon/heading/body rendering, no spinner/badge/date-promise, max system font scale scrolling instead of clipping, EN locale strings, five-tab bar visual consistency — are outstanding. Recorded as `WINDOWS.md` entry #40 (`unrun-verify`).

## User Setup Required
None — no external service configuration required.

## Known Stubs
- `apps/mobile/app/(festival)/f/[festivalSlug]/friends.tsx` renders a temporary "This tab isn't built yet." sentence — a real, registered route (satisfies NAV-01), but its real content (the friends-in-this-festival list, D-15…D-18, FRND-07) is 09-05's job, not this plan's. Recorded as `WINDOWS.md` entry #41 (`stub`).

## Threat Flags

None — this plan touches only client-side navigation/rendering; the threat register in `09-03-PLAN.md` (T-09-09 through T-09-12) was mitigated as specified (the D-10 gate hides the whole area, not just the Dashboard) and no new network surface was introduced.

## Next Phase Readiness
- The five-tab festival navigator, the D-10 gate, `FloatingNav`'s `variant` prop, and `PlaceholderScreen` are all stable surfaces 09-04 (AppHeader), 09-05 (Festival Friends tab) and 09-06 (Cashless) build directly on top of.
- 09-04 needs to know: the Dashboard tab (`index.tsx`) still renders its own festival-name heading (D-08 says this moves into `AppHeader`, not yet done — `Flagged Assumption 3` in `09-03-PLAN.md`); the back-navigation `Stack.Screen`/`headerLeft` block was removed in this plan with no replacement yet, so system/gesture back is the only exit from a festival until 09-04 lands the `AppHeader` home button.
- 09-05 needs to know: `friends.tsx` is a registered route ready to receive real content; `useFestivalContext()` is available if the Festival Friends tab needs the resolved festival (e.g. for a header context), though FRND-07's own data comes from the 09-02 endpoint, not this context.
- Outstanding before this plan can be considered FULLY device-verified: Task 2's `<human-check>` (WINDOWS #40).

---
*Phase: 09-festival-navigation-shell*
*Completed: 2026-08-14*

## Self-Check: PASSED

- FOUND: `apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx`
- FOUND: `apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx`
- FOUND: `apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx`
- FOUND: `apps/mobile/app/(festival)/f/[festivalSlug]/friends.tsx`
- FOUND: `apps/mobile/app/(festival)/f/[festivalSlug]/timetable.tsx`
- FOUND: `apps/mobile/app/(festival)/f/[festivalSlug]/map.tsx`
- FOUND: `apps/mobile/components/PlaceholderScreen.tsx`
- FOUND: `apps/mobile/lib/festival-gate.ts`
- FOUND: `apps/mobile/lib/festival-context.ts`
- FOUND: `apps/mobile/lib/__tests__/festival-gate.test.ts`
- FOUND: commit `edfd5c1`
- FOUND: commit `c16369f`
- FOUND: commit `a17df60`
