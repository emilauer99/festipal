---
phase: 09-festival-navigation-shell
plan: 04
subsystem: ui
tags: [expo-router, react-native, react-context, tanstack-query, lingui, expo-blur]

# Dependency graph
requires:
  - phase: 09-03
    provides: "The five-tab festival navigator, its layout-level D-10 gate, findCachedFestivalBySlug hoisted into lib/festival-queries.ts, and lib/festival-context.ts's useFestivalContext() — this plan's AppHeader reads the festival name off the SAME festivalKeys.detail(slug) query key the 09-03 gate already owns."
provides:
  - "AppHeader — the app-wide three-state header (global/festival/push) mounted exactly once at the authenticated-tree root, replacing the native React Navigation header everywhere in the app"
  - "useHeaderClearance() — the top-clearance hook every screen beneath the header uses, exported from components/AppHeader.tsx"
  - "lib/app-chrome.ts — resolveHeaderContext(segments), the pure route-segment -> header-visibility/state derivation (T-09-13's whole mitigation)"
  - "lib/festival-navigation.ts's goToStartTab and closePushScreen — the global and push branches of the header's left button, alongside the existing leaveFestival"
  - "packages/ui/src/tokens.ts's headerTitle (17px) and headerWordmark (21px) type roles"
affects: [09-05-festival-friends-tab, 09-06-cashless]

# Actuals (#2632)
actuals:
  tokens: 12856
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A component mounted ONCE at the provider-tree root that decides its own visibility per route via a pure segment-derivation function (resolveHeaderContext), instead of being conditionally mounted at each call site — the mitigation for 'never render account data over an unauthenticated screen' lives in the pure function's fallback-to-invisible default, not in a mount-site condition that could be forgotten at a future call site."
    - "Reusing an already-fetched React Query key/queryFn across a second independent observer (AppHeader's festival-name query vs. the 09-03 layout gate's own) is safe when NEITHER observer is a lazily-mounted Tabs child — the 09-03 blank-Dashboard bug was specific to a tab SCREEN re-subscribing on tab re-focus; a root-level singleton component (like the layout gate itself) does not exhibit that failure mode."

key-files:
  created:
    - apps/mobile/lib/app-chrome.ts (resolveHeaderContext, PUSH_SCREEN_ROUTES, HEADER_HIDDEN_ROUTES)
    - apps/mobile/lib/__tests__/app-chrome.test.ts
    - apps/mobile/components/AppHeader.tsx (AppHeader, useHeaderClearance)
  modified:
    - packages/ui/src/tokens.ts (headerTitle, headerWordmark type roles)
    - apps/mobile/lib/__tests__/type-tracking.test.ts (tracked-role list extended)
    - apps/mobile/lib/festival-navigation.ts (goToStartTab, closePushScreen)
    - apps/mobile/lib/fonts.ts + lib/__tests__/fonts.test.ts (ROLE_FONT_FAMILY exhaustiveness)
    - apps/mobile/components/FloatingNav.tsx (BLUR_INTENSITY exported)
    - apps/mobile/app/_layout.tsx (mounts AppHeader; headerShown:false on profil/friends-qr root registrations)
    - apps/mobile/app/(tabs)/_layout.tsx (drops per-tab headerShown/title)
    - apps/mobile/app/(tabs)/start.tsx, festivals.tsx, friends.tsx, mehr.tsx
    - apps/mobile/app/profil.tsx, friends-qr.tsx
    - apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx, index.tsx, activities.tsx, timetable.tsx, map.tsx, friends.tsx
    - apps/mobile/locales/de/messages.po, en/messages.po

key-decisions:
  - "Task 1 and Task 2 are coupled by a test guard that Task 1 alone cannot satisfy: type-tracking.test.ts's consumer-tracking assertion requires sizeUses > 0 for every tracked role, but Task 1 only adds headerTitle/headerWordmark to the tracked-role list — the first real consumer (AppHeader.tsx) is Task 2. Both tasks were implemented in the working tree before either was committed, verified together, then split into their planned per-task commits — Task 1's commit is therefore NOT independently green if checked out alone (the specific failure: 'sets headerTitle tracking in every file that sets headerTitle size' asserts sizeUses > 0 and finds zero consumers). This is a structural artifact of splitting a token+consumer pair across two tasks, not a code defect."
  - "Added apps/mobile/lib/__tests__/fonts.test.ts's exhaustiveness fixture entries for headerTitle/headerWordmark (Rule 3) — fonts.ts's ROLE_FONT_FAMILY is a total Record<TypeRole, string>, so the new tokens.ts roles are a compile error there until mapped; both resolve to FONT_WORDMARK (Outfit 800), matching wordmark/display2's treatment."
  - "Set headerShown: false explicitly on the profil/friends-qr Stack.Screen REGISTRATIONS in app/_layout.tsx (Rule 2, not explicit in the plan's action text) — a Native Stack screen with no header option defaults to a VISIBLE blank native header; without this, removing profil.tsx's/friends-qr.tsx's own <Stack.Screen options> block in Task 3 would leave a blank bar sitting above AppHeader. friend-detail is deliberately excluded from this change — it keeps its own customized header (close button) via its own per-screen options, unchanged (Flagged Assumption 1)."
  - "Exported FloatingNav's BLUR_INTENSITY constant instead of duplicating the literal 60 in AppHeader.tsx — satisfies the App Header Contract's 'reuse the pattern, do not reinvent a second blur constant' as an actual import, not just a matching number that could silently drift."
  - "AvatarTile already supported size 32 (added by an earlier quick task, quick-260813-o08 D-D, after 09-UI-SPEC.md was authored) — no widening of its size union was needed, contrary to the UI-SPEC's Component Inventory entry describing it as still needing that change."
  - "The festival name in AppHeader comes from a SECOND useQuery call on the SAME festivalKeys.detail(slug) key the 09-03 layout gate already owns (09-UI-SPEC.md Flagged Assumption 2), not a new Context — React Query dedupes into one request. This is a deliberately different risk profile than the 09-03 blank-Dashboard bug: that bug was a lazily-mounted TAB SCREEN re-subscribing on tab focus; AppHeader, like the layout gate itself, is a root-level component that never unmounts across tab switches."

patterns-established:
  - "Root-mounted, self-gating chrome component (AppHeader) — the pattern for any future app-wide UI element (e.g. a future toast/banner host) that must never appear over specific route groups: derive visibility from useSegments() through a pure, unit-tested function with a fail-closed default, mount the component once, let it decide."

requirements-completed: [NAV-01]

coverage:
  - id: D1
    description: "AppHeader has exactly three states (global/festival/push), replaces the native header on all four global tabs, five festival tabs and the profil/friends-qr push screens, and never renders over an unauthenticated screen"
    requirement: "NAV-01"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/app-chrome.test.ts — 14 cases covering every <behavior> case from 09-04-PLAN.md Task 1 (all four global tabs, two festival-tab segments, both push routes, both auth-flow guard groups, the '/' owner, the empty array, friend-detail, and an unknown first segment)"
        status: pass
      - kind: manual_procedural
        ref: "09-04-PLAN.md Task 2 <human-check> (10 points) and Task 3 <human-check> (6 points) — NOT run on device this session; recorded as WINDOWS.md unrun-verify entries"
        status: unknown
    human_judgment: true
    rationale: "RN screen/navigation visual truth has no node-env Vitest equivalent in this project (no RN component-test harness) — only the pure resolveHeaderContext derivation is unit-tested. The device checkpoints were deferred to complete the plan in this session, matching 09-03's precedent (its own Task 2 human-check was deferred the same way)."
  - id: D2
    description: "The left button's icon/action/label are state-dependent (ArrowLeft+closePushScreen+'Back' on push, Home+leaveFestival+'Leave festival' on festival, Home+goToStartTab+'Go to Start' on global) and on the Start tab itself it is visible and functional but a deliberate no-op, with no SoonToast"
    requirement: "NAV-01"
    verification:
      - kind: other
        ref: "cd apps/mobile && pnpm exec vitest run && pnpm typecheck && pnpm lint (269/269 tests, exit 0/0) — grep confirms no useSoonToast import in AppHeader.tsx or lib/festival-navigation.ts"
        status: pass
      - kind: manual_procedural
        ref: "09-04-PLAN.md Task 2 <human-check> points 3-4 (leave-festival non-dead-end on cold start, Start-tab home button visible/no-op)"
        status: unknown
    human_judgment: true
    rationale: "The three navigation branches are unit-testable as pure logic (goToStartTab/closePushScreen/leaveFestival), but the on-screen tap-through and the cold-start non-dead-end case need a real device."
  - id: D3
    description: "Every screen beneath the header clears its own top padding by useHeaderClearance() (insets.top + layout.topbar); the festival name is removed from the Dashboard screen (D-08) and lives exactly once, in AppHeader"
    requirement: "NAV-01"
    verification:
      - kind: other
        ref: "grep -rl \"useHeaderClearance()\" apps/mobile/app — all 11 screens plus the festival gate; grep -n \"festival.name\" apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx returns no standalone heading usage (only inside AppHeader's title derivation)"
        status: pass
      - kind: manual_procedural
        ref: "09-04-PLAN.md Task 3 <human-check> (content never starts under the glass, notch/no-notch, max font scale)"
        status: unknown
    human_judgment: true
    rationale: "The clearance VALUE and its application are grep-verifiable; whether the visual result is actually clear of the glass on a real device (notch geometry, max font scale) is not."

# Metrics
duration: ~50min
completed: 2026-08-14
status: complete
---

# Phase 9 Plan 4: App Header Summary

**The app-wide three-state `AppHeader` (global/festival/push) replaces the native React Navigation header on every screen — festival exit, Profil entry, and the two new AppHeader-only type roles all land in one plan, per D-03's "now, app-wide" decision.**

## Performance

- **Duration:** ~50 min of active implementation across 3 tasks, no device checkpoint reached this session
- **Tasks:** 3 planned tasks, all `type="auto"` (Task 1 `tdd="true"`)
- **Files touched:** 24 unique files across 3 commits (locale catalogs touched in both Task 2 and Task 3)

## Accomplishments

- Two new Outfit/black type roles, `headerTitle` (17px) and `headerWordmark` (21px), both derived and letter-spacing-tracked per the CI corridor, both registered in `type-tracking.test.ts`'s coupling gate.
- `lib/app-chrome.ts`'s `resolveHeaderContext(segments)` — a pure, fully-unit-tested derivation of the header's visibility/state from Expo Router's segment array, with a fail-closed (invisible) default for every unrecognized route. This is the entire mitigation for T-09-13 (header never renders over an unauthenticated screen).
- `lib/festival-navigation.ts` gained `goToStartTab` and `closePushScreen`, sitting alongside the unchanged `leaveFestival` — the three navigation branches of the header's left button, each independently readable and testable.
- `components/AppHeader.tsx` — the header itself: absolute glass overlay (reusing `FloatingNav`'s `BlurView`/`BLUR_INTENSITY`, now exported for this purpose), three visually distinct states, 32px `AvatarTile` from the shared `['me']` query with the device-local avatar photo, no `AvatarSunsetRing`. Mounted exactly once in `app/_layout.tsx`, as a sibling of the root `<Stack>`.
- Native headers removed from all four global tabs, all five festival tabs (the gate included) and the `profil`/`friends-qr` push screens; every one of those 11 screens plus the gate now calls `useHeaderClearance()` and adds it to its own top padding. `friend-detail.tsx` is untouched — it keeps its own modal header and close button.
- The Dashboard's own festival-name heading is removed (D-08) — the name now lives exactly once, in `AppHeader`'s festival state, visible on all five festival tabs.
- New Lingui strings "Leave festival" / "Go to Start" (DE: "Festival verlassen" / "Zu Start"); the generic "Festival" fallback title reused an identical, already-translated msgid.

## Task Commits

1. **Task 1: Type roles, resolveHeaderContext, header nav branches** — `27eb19b` (feat)
2. **Task 2: Build AppHeader and mount it once app-wide** — `9b19774` (feat)
3. **Task 3: Replace native headers app-wide with AppHeader clearance** — `36135eb` (feat)

## Files Created/Modified

- `packages/ui/src/tokens.ts` — `headerTitle`/`headerWordmark` type roles added
- `apps/mobile/lib/app-chrome.ts` (new) — `resolveHeaderContext`, `PUSH_SCREEN_ROUTES`, `HEADER_HIDDEN_ROUTES`
- `apps/mobile/lib/__tests__/app-chrome.test.ts` (new) — 14 cases covering every `<behavior>` case
- `apps/mobile/lib/festival-navigation.ts` — `goToStartTab`, `closePushScreen` added
- `apps/mobile/lib/fonts.ts` + `lib/__tests__/fonts.test.ts` — `ROLE_FONT_FAMILY` exhaustiveness extended (both new roles -> `FONT_WORDMARK`)
- `apps/mobile/lib/__tests__/type-tracking.test.ts` — tracked-role list extended
- `apps/mobile/components/AppHeader.tsx` (new) — the header component and `useHeaderClearance`
- `apps/mobile/components/FloatingNav.tsx` — `BLUR_INTENSITY` exported for reuse
- `apps/mobile/app/_layout.tsx` — mounts `AppHeader`; `headerShown: false` on the `profil`/`friends-qr` root registrations
- `apps/mobile/app/(tabs)/_layout.tsx` — drops per-tab `headerShown`/`title` overrides
- `apps/mobile/app/(tabs)/start.tsx`, `festivals.tsx`, `friends.tsx`, `mehr.tsx` — header clearance added; `festivals.tsx` also loses its own `<Stack.Screen>` header block
- `apps/mobile/app/profil.tsx`, `friends-qr.tsx` — own header blocks removed, header clearance added
- `apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx` — the D-10 gate's centered message block gets header clearance
- `apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx` — festival-name heading removed (D-08), header clearance added
- `apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx`, `timetable.tsx`, `map.tsx`, `friends.tsx` — header clearance added to the wrapping `SafeAreaView`
- `apps/mobile/locales/{de,en}/messages.po` — "Leave festival", "Go to Start" added; source-location comments updated across the board by `lingui extract`

## Decisions Made

See `key-decisions` in the frontmatter for full reasoning. In short: Task 1/Task 2 were implemented together in the working tree before being split into their planned per-task commits (a test-guard coupling artifact, documented below under Deviations); `fonts.ts`'s exhaustive `ROLE_FONT_FAMILY` map was extended to keep the build compiling; `headerShown: false` was added at the two affected root `Stack.Screen` registrations to prevent a blank native header from reappearing once Task 3 removed each screen's own header block; `FloatingNav`'s blur constant was exported rather than duplicated; `AvatarTile` already supported `size={32}` from an earlier quick task, so no widening was needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `packages/ui` build output was stale after the `tokens.ts` edit**
- **Found during:** Task 1 typecheck
- **Issue:** `apps/mobile` resolves `@quiks/ui` through its built `dist/` output, not the TypeScript source; adding `headerTitle`/`headerWordmark` to `tokens.ts` without rebuilding left the consuming package's types unchanged, producing `TS2339: Property 'headerWordmark' does not exist` across every new consumer.
- **Fix:** `pnpm --filter @quiks/ui build`.
- **Files modified:** none (build artifact only)
- **Commit:** N/A (no source change)

**2. [Rule 3 - Blocking] `lib/fonts.ts`'s `ROLE_FONT_FAMILY` and its test fixture are total maps over `TypeRole`**
- **Found during:** Task 1 typecheck
- **Issue:** `ROLE_FONT_FAMILY: Record<TypeRole, string>` and `lib/__tests__/fonts.test.ts`'s `EXPECTED` fixture both enumerate every token role; adding two new roles to `typeRoles` without extending both is a compile error (the map) and a coverage-assertion failure (the fixture's `covers EVERY role` test).
- **Fix:** Mapped both new roles to `FONT_WORDMARK` (Outfit 800, matching `wordmark`/`display2`'s treatment) in both places.
- **Files modified:** `apps/mobile/lib/fonts.ts`, `apps/mobile/lib/__tests__/fonts.test.ts`
- **Commit:** `27eb19b`

**3. [Rule 2 - Missing critical functionality] Native Stack screens default to a VISIBLE header with no explicit option**
- **Found during:** Task 2 implementation, reasoning ahead to Task 3's planned removal of `profil.tsx`'s/`friends-qr.tsx`'s own `<Stack.Screen options={{headerShown:true,...}}>` blocks
- **Issue:** The plan's Task 3 action removes each screen's own header-options block but never sets `headerShown: false` anywhere else for those two routes. Since a Native Stack `Stack.Screen` with no explicit `headerShown` defaults to `true` (a blank native header, no title), removing the per-screen override alone would have left a blank bar sitting above `AppHeader` on both screens — a double-header regression the plan's own acceptance criteria ("kein doppelter Header") explicitly forbid.
- **Fix:** Added `options={{ headerShown: false }}` to the `profil` and `friends-qr` `<Stack.Screen>` registrations in `app/_layout.tsx` (Task 2, ahead of Task 3's removal). `friend-detail`'s registration is deliberately left untouched — it keeps its own customized header via its own per-screen options (Flagged Assumption 1).
- **Files modified:** `apps/mobile/app/_layout.tsx`
- **Commit:** `9b19774`

**4. [Rule 3 - Blocking] Task 1's `type-tracking.test.ts` consumer-tracking guard cannot pass without Task 2's consumer**
- **Found during:** Attempting to run Task 1's own `<verify>` block in isolation
- **Issue:** `type-tracking.test.ts`'s "sets X tracking in every file that sets X size" assertion requires `sizeUses > 0` for every tracked role (a guard against a silently-renamed access pattern). Task 1 adds `headerTitle`/`headerWordmark` to the tracked-role list per its own action item, but the first real consumer of either role's `.size` is `AppHeader.tsx`, built in Task 2 — so Task 1 alone has zero consumers and fails this specific assertion.
- **Fix:** Implemented Task 1 and Task 2's code together in the working tree, ran the full verify chain once (all green), then split the already-verified state into the two commits the plan specifies by file scope. Task 1's commit is therefore not independently green if checked out alone — a structural artifact of the plan splitting a token addition and its first consumer across two tasks, not a code defect. No workaround (e.g. a throwaway Task-1-only consumer) was introduced, since that would have meant writing and then deleting UI code for no product reason.
- **Files modified:** none beyond what Task 1/Task 2 already touch
- **Commit:** split across `27eb19b` (Task 1) and `9b19774` (Task 2)

---

**Total deviations:** 4 auto-fixed (2 blocking/build, 1 missing-functionality, 1 blocking/test-ordering)
**Impact on plan:** No scope creep. All four deviations were necessary for the plan's own stated acceptance criteria (a compiling build, a passing test suite, "kein doppelter Header") to hold; none introduced new product surface.

## Issues Encountered

- Neither Task 2's 10-point nor Task 3's 6-point `<human-check>` device verification ran this session. Per this project's precedent (09-03-SUMMARY.md: "the plan was completed... without pausing for a third device checkpoint"), the plan was completed to its automated-verification gate and the device checks were recorded as open `unrun-verify` entries in `.planning/WINDOWS.md` rather than blocking completion. Both tasks are `type="auto"`, not `type="checkpoint:human-verify"`, and this project's config has `workflow._auto_chain_active: false` with no `auto_advance` override — the plan text itself, not an auto-mode setting, drove this call.

## User Setup Required

None — no external service configuration required.

## Known Stubs

None new. The pre-existing Known Stub from 09-03 (`(festival)/f/[festivalSlug]/friends.tsx`'s placeholder text, WINDOWS.md #41) is unchanged by this plan beyond gaining header clearance.

## Threat Flags

None — this plan's new network surface is limited to a second observer of an already-published, already-reviewed query (`festivalKeys.detail(slug)` via `apiClient.getFestival`); no new endpoint, no new trust boundary. The threat register in `09-04-PLAN.md` (T-09-13 through T-09-16) was mitigated as specified:
- T-09-13 (header over an unauthenticated screen) — `resolveHeaderContext`'s fail-closed default, unit-tested for every named case.
- T-09-14 (stale avatar after account switch) — the header reads only the already-shared `['me']` cache entry; the existing `cancelQueries`/`clear` reset on the `unauthenticated` transition (`app/_layout.tsx`) covers this consumer too, unchanged.
- T-09-15 (spoofed push title) — the push-title map is a compiled, finite table over two literal route names; an unregistered route resolves to no header at all (via `resolveHeaderContext`), never a wrong title.
- T-09-16 (festival exit without history) — `leaveFestival` is unchanged; `closePushScreen` carries the same `canGoBack()` non-dead-end branch, unit-testable by construction (the branch itself is the same shape `leaveFestival` already had, not independently re-tested here).

## Next Phase Readiness

- `AppHeader`, `useHeaderClearance`, and the three-state route derivation are stable surfaces for 09-05 (Festival Friends tab) and 09-06 (Cashless push screen) to build directly on top of: any new push screen registers itself in `PUSH_SCREEN_ROUTES`/the push-title map and gets a header for free; any new festival tab inherits the festival-state header automatically (segment-driven, no per-screen wiring).
- 09-05 needs to know: the festival Friends tab (currently a stub) will need `headerShown:false` is already the norm for festival-tab screens (inherited from the `(festival)` `Tabs` navigator's `screenOptions`), so no new header wiring is needed there — only `useHeaderClearance()` on its own content once real content lands. The "Find friends" push-over entry (D-16) pushes the EXISTING global `(tabs)/friends.tsx` screen as a root-level `Stack.Screen` — that screen is not yet registered at the root alongside `profil`/`friend-detail`/`friends-qr`, so 09-05 will need to add that registration (with `headerShown: false`, matching this plan's pattern) and extend `PUSH_SCREEN_ROUTES`/`AppHeader`'s push-title map for it.
- 09-06 needs to know: `app/cashless.tsx` will be a new root-level push screen exactly like `profil`/`friends-qr` — register it in `app/_layout.tsx` with `headerShown:false`, add its route to `PUSH_SCREEN_ROUTES` in `lib/app-chrome.ts`, and add its title ("Cashless") to `AppHeader.tsx`'s push-title map.
- Outstanding before this plan can be considered fully device-verified: Task 2's and Task 3's `<human-check>` blocks (WINDOWS.md, two new `unrun-verify` entries recorded this session).

---
*Phase: 09-festival-navigation-shell*
*Completed: 2026-08-14*

## Self-Check: PASSED

- FOUND: `apps/mobile/lib/app-chrome.ts`
- FOUND: `apps/mobile/lib/__tests__/app-chrome.test.ts`
- FOUND: `apps/mobile/components/AppHeader.tsx`
- FOUND: `.planning/workstreams/mobile/phases/09-festival-navigation-shell/09-04-SUMMARY.md`
- FOUND: commit `27eb19b`
- FOUND: commit `9b19774`
- FOUND: commit `36135eb`
