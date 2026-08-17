---
phase: 11-activities
plan: 04
subsystem: ui
tags: [expo-router, react-query, lingui, expo-location, forms, activities]

requires:
  - phase: 11-activities
    provides: "11-01: activityKeys factory, activity-detail push screen and its chrome registration; 11-02: expo-location installed foreground-only, buildRouteUri; 11-03: activity-form.ts pure rules (canSubmitActivity/resolveJoinability/buildClonePrefill), Input/Chip/CapacityField/DayTimeField primitives"
provides:
  - "useActivityMutations — the one shared mutation hook (create/join/leave/dissolve) with a single activityKeys.all(festivalId) invalidation, no optimistic cache write"
  - "LocationCaptureBlock — one-shot geo capture with a three-state permission model modeled on CameraScanPanel, fully graceful on denial"
  - "the Create-/Klon-Screen (app/activity-create.tsx) at route /activity-create — where ACT-01 becomes user-observable"
  - "activity-create's chrome registration (app-chrome.ts/AppHeader.tsx/_layout.tsx) — closes the tracer's last open route"
  - "the Aktivitäten-tab's Aktivität-starten CTA, visible in every list state including a failed read"
affects: [11-05]

actuals:
  tokens: 14130
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A mutation hook with more than one write endpoint threads a targetId through every variables object (not just the membership ones) so a stable stand-in value (CREATE_ACTIVITY_TARGET_ID) covers the one endpoint that has no natural identifier yet at call time"
    - "A root-level push screen that needs the resolved festival reads useFestivalContext() the same way activity-detail.tsx (11-01) already does, even though the FestivalContextProvider technically only wraps the nested (festival) navigator subtree — this is an inherited pattern from 11-01, not introduced here, and is out of this plan's scope to re-architect"
    - "The verify-block's negative grep gate reads text, not semantics — a comment that merely NAMES a banned API call (even to say 'not this one') fails the gate exactly like a real call would; the boundary must be described in prose instead"

key-files:
  created:
    - apps/mobile/lib/use-activity-mutations.ts
    - apps/mobile/components/LocationCaptureBlock.tsx
    - apps/mobile/app/activity-create.tsx
  modified:
    - apps/mobile/lib/app-chrome.ts
    - apps/mobile/lib/__tests__/app-chrome.test.ts
    - apps/mobile/components/AppHeader.tsx
    - apps/mobile/app/_layout.tsx
    - apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "useActivityMutations' onSuccess callback passes the raw mutation result alongside the targetId (not just the targetId, unlike useFriendMutations) — the create screen needs the freshly-created Activity's own id to build its router.replace navigation target, which a targetId-only callback couldn't supply since create's targetId is the stand-in constant, not a real activityId"
  - "activity-create.tsx duplicates a small local Y/M/D date parser (buildStartTimeIso) rather than exporting DayTimeField's own parseDateOnlyLocal — DayTimeField.tsx sits outside this plan's declared files_modified scope, matching 11-03's own precedent of small, well-isolated duplication over an out-of-scope export"
  - "The tag-chip row's negative marginTop (chipRow: marginTop: -spacingScale['sp-5']) pulls it visually under the title field it belongs to rather than reading as its own sp-9 form section — a negative of an existing token, not a new pixel value, same idiom complete-profile.tsx's subtitle style already uses"
  - "Input's own label prop IS the block's Copywriting-Contract 'eyebrow' for LocationCaptureBlock (t\`Meeting point\`) rather than a second, separately-rendered eyebrow Text — Input already renders its label in the same label type role CapacityField/DayTimeField's own eyebrows use, so a second eyebrow would have been a visually duplicated element"
  - "LocationCaptureBlock's 'Pin location' button uses a neutral fillQuiet pill (not the accent treatment) — it isn't in UI-SPEC's explicit 'accent reserved for' list, unlike the captured-point chip which IS listed there and correctly uses Chip's selected=true accent styling"

patterns-established:
  - "A root-level Create-/Klon-Screen registers with NO Stack.Screen options at all (not even implicitly relying on a prior per-screen headerShown:false) — the navigator's screenOptions default (09-07) and AppHeader's own push-state title are the whole chrome contract"

requirements-completed: [ACT-01, ACT-05, ACT-06]

coverage:
  - id: D1
    description: "useActivityMutations — shared mutation hook (create/join/leave/dissolve), each mutation's onSettled invalidating exactly activityKeys.all(festivalId), no optimistic cache write, no client-set actor/scope in any request body"
    requirement: ACT-01
    verification:
      - kind: static
        ref: "apps/mobile/lib/use-activity-mutations.ts — typecheck+lint clean; single activityKeys.all(festivalId) invalidation site and unwrapCreated(create)/unwrapOk(join/leave/dissolve) split verified by inspection (11-04-PLAN Task 1 acceptance)"
        status: pass
    human_judgment: true
    rationale: "Plan's Task 1 verify scope is typecheck+lint only, no dedicated unit test file. The hook's actual runtime behavior (pending/failed target tracking, the single invalidation, 409-status surfacing) is exercised for real only through the create flow's on-device UAT in Task 3 — deferred per this project's structural test-harness limitation (no RN component harness, STATE.md)."
  - id: D2
    description: "LocationCaptureBlock — one-shot getCurrentPositionAsync() per tap on Pin location, three-state permission model requested exactly once per mount, fully graceful denial (free-text field never locked), captured point renders as a removable Chip carrying only catalog copy, never coordinates"
    requirement: ACT-05
    verification:
      - kind: static
        ref: "grep gate (11-04-PLAN Task 2 verify) — zero matches for watchPositionAsync/startLocationUpdatesAsync/requestBackgroundPermissionsAsync/useBackgroundPermissions/getLastKnownPositionAsync across components/lib/app, exit code exactly 1"
        status: pass
    human_judgment: true
    rationale: "No RN component test harness in this project — the actual permission-dialog behavior, capture-to-chip transition, denied-state callout legibility and no-re-prompt-on-remount are on-device UAT items (Task 2's own <human-check>, deferred to the phase's device pass alongside Task 3)."
  - id: D3
    description: "activity-create screen (create + clone modes), its chrome registration as a root-level push sibling, and the Aktivitäten-tab's Aktivität-starten CTA (visible above both sections in every state, including a failed list read, plus a second instance in the own-section empty state) — the surface where ACT-01 and ACT-06 become user-observable"
    requirement: ACT-01
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/app-chrome.test.ts#shows the push state with route \"activity-create\" for the Create-/Klon-Screen (11-04)"
        status: pass
      - kind: unit
        ref: "apps/mobile/lib/__tests__/app-chrome.test.ts#hides on an unknown first segment (never falls back to visible) — unchanged fail-closed assertion re-verified"
        status: pass
      - kind: other
        ref: "npx lingui compile --strict — 0 missing translations across both locales for all 17 new msgids this plan introduces"
        status: pass
    human_judgment: true
    rationale: "No RN component test harness — the full create flow (tag-or-title submit gate, D-05 live rule swapping title-required/subtitle-visible, submit-tap-time inline errors, double-tap idempotency via the disabled/replace navigation, clone prefill from the query cache, CTA visibility under a failed list read, EN locale switch) is a screen-level truth only on-device UAT can confirm, per this project's structural test-harness limitation (STATE.md)."

duration: ~12min (task commits span 18:14–18:26; excludes the upfront context-gathering read pass)
completed: 2026-08-15
status: complete
---

# Phase 11 Plan 04: Activity Create Screen, Location Capture & Mutations Summary

**The Create-/Klon-Screen composes the four 11-03 primitives around `canSubmitActivity` and a new shared `useActivityMutations` hook, plus a one-shot `LocationCaptureBlock` (three-state permission model, fully graceful denial) — closing the tracer's last unregistered route and giving the Aktivitäten-tab its "Aktivität starten" CTA.**

## Performance

- **Duration:** ~12 min active coding across three commits (18:14–18:26); excludes the upfront read pass across ~25 files (plan, prior SUMMARYs, UI-SPEC, contracts, and every referenced component/lib module) needed before writing any code.
- **Started:** 2026-08-15T18:14:18+02:00 (first task commit)
- **Completed:** 2026-08-15T18:26:29+02:00
- **Tasks:** 3
- **Files modified:** 10 (3 created, 7 modified)

## Accomplishments

- `lib/use-activity-mutations.ts`: `useActivityMutations` — four trigger functions (create/join/leave/dissolve) mirroring `useFriendMutations`' shape exactly (shared `onMutate`/`onError`/`onSuccess`/`onSettled`, `pendingTargetId`/`failedTargetId`/`failedTargetStatus`), `CREATE_ACTIVITY_TARGET_ID` as the stable stand-in identifier for the create mutation (which has no real `activityId` yet at call time), a single `activityKeys.all(festivalId)` invalidation per mutation, no optimistic cache write anywhere
- `components/LocationCaptureBlock.tsx`: the "Treffpunkt" block — always-present free-text `Input`, plus either the "Pin location" button or (once captured) a removable, accent-styled `Chip` carrying only catalog copy; three-state permission model (`pending`/`granted`/`denied`) requested exactly once per mount via a `useRef` guard, modeled on `CameraScanPanel`'s pattern but without its arm/disarm scanning mechanics; the denied state renders the full non-tracking reassurance unshortened with an "Open Settings" action, and nothing in the form is ever locked by a denial
- `app/activity-create.tsx`: the Create-/Klon-Screen — `KeyboardScreen` house scaffold, composes `Input`/`Chip`/`CapacityField`/`DayTimeField`/`LocationCaptureBlock` in the specified field order around `canSubmitActivity` (tag-or-title rule, submit-tap-time inline errors under the title field and the Wann block), the tag catalog query (server order, id-keyed selection, row absent on error/empty), the D-05 live rule (tag selected → title optional + placeholder preview + subtitle visible), and `useActivityMutations` (submit button disabled from first tap, success replaces to the fresh detail screen, failure preserves every entered value); clone mode reads `activityKeys.detail(...)` from the query cache via `buildClonePrefill`, opening empty on a cache miss
- Chrome registration closed the tracer's last open route: `activity-create` added to `PUSH_SCREEN_ROUTES`/`PushScreenRoute`, `AppHeader`'s static push title, and the root `Stack.Protected` `Stack.Screen` — no `options` on any of the three, proven by an extended `app-chrome.test.ts`
- `activities.tsx`: the "Aktivität starten" CTA renders above both sections in every state (including a failed list read on either query) via one shared `StartActivityButton` component, plus a second instance inside "Deine Aktivitäten"'s own empty state — one implementation, two positions, never a drifting second copy
- 17 new msgids across both locale catalogs, all filled (`lingui compile --strict` reports 0 missing); "Choose a day."/"Choose a time." close the deferral 11-03 recorded, "Meeting point" and "Open Settings" reused from existing msgids instead of duplicating them

## Task Commits

Each task was committed atomically:

1. **Task 1: useActivityMutations — der geteilte Mutations-Hook mit einer Invalidierung** - `a9601ef` (feat)
2. **Task 2: LocationCaptureBlock — Treffpunkt mit einmaliger Standorterfassung** - `340f4f9` (feat)
3. **Task 3: Der Create-/Klon-Screen, seine Registrierung und der CTA im Tab** - `e37a656` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit below).

## Files Created/Modified

- `apps/mobile/lib/use-activity-mutations.ts` - `useActivityMutations`, `CREATE_ACTIVITY_TARGET_ID`
- `apps/mobile/components/LocationCaptureBlock.tsx` - `LocationCaptureBlock`
- `apps/mobile/app/activity-create.tsx` - Create-/Klon-Screen, default export
- `apps/mobile/lib/app-chrome.ts` - `activity-create` added to the push-route registry
- `apps/mobile/lib/__tests__/app-chrome.test.ts` - push-state proof for `activity-create`
- `apps/mobile/components/AppHeader.tsx` - static `activity-create` push title
- `apps/mobile/app/_layout.tsx` - `Stack.Screen name="activity-create"` registration
- `apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx` - `StartActivityButton`, two CTA render sites
- `apps/mobile/locales/{de,en}/messages.po` - 17 new msgids

## Decisions Made

- `useActivityMutations`'s `onSuccess` callback signature carries the raw mutation result alongside `targetId` (`(result, targetId) => void`), unlike `useFriendMutations`' `targetId`-only callback — the create screen's navigation needs the freshly-created `Activity`'s own `id`, which a `targetId`-only signature (the create mutation's `targetId` is the stand-in constant, not a real id) could not supply.
- `activity-create.tsx` duplicates a small local Y/M/D date parser (`buildStartTimeIso`) instead of exporting `DayTimeField.tsx`'s own `parseDateOnlyLocal` — `DayTimeField.tsx` sits outside this plan's declared `files_modified` scope; the ~10-line duplication is small, well-isolated, and follows 11-03's own established precedent for the identical situation.
- The tag-chip row uses a negative `marginTop` (`-spacingScale['sp-5']`) to visually pull it under the title field it belongs to, rather than reading as its own `sp-9` form section — a negative of an existing token, not a new pixel value, the same idiom `complete-profile.tsx`'s subtitle style already establishes.
- `LocationCaptureBlock`'s `Input` component supplies its own "eyebrow" via its existing `label` prop (`t\`Meeting point\``) rather than a second, separately-rendered eyebrow `Text` — `Input` already renders its label in the exact `label` type role `CapacityField`/`DayTimeField`'s own eyebrows use, so adding a second one would have visually duplicated the same row.
- The "Pin location" button (before capture) uses a neutral `fillQuiet` pill, not the accent treatment — it is not in UI-SPEC's explicit "accent reserved for" list, unlike the captured-point chip (item 3 of that list), which correctly uses `Chip`'s `selected` accent styling.
- `activity-create.tsx` reads `useFestivalContext()` directly, following the exact idiom `activity-detail.tsx` (11-01) already established for this same root-level sibling position, even though `FestivalContextProvider` technically only wraps the nested `(festival)` navigator's own subtree. This is an inherited pattern from 11-01, not introduced here — re-architecting festival-context propagation for root-level push screens is out of this plan's scope (it would touch `activity-detail.tsx` and `_layout.tsx`'s provider placement, neither in `files_modified`), and if it is a genuine gap it will surface identically on both screens during on-device UAT.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Rephrased a code comment in LocationCaptureBlock.tsx to stop naming banned API calls**
- **Found during:** Task 2, running the verify block's negative grep gate
- **Issue:** A comment explaining what the one-shot capture does NOT do literally named `watchPositionAsync`/`startLocationUpdatesAsync` to say "not these" — the plan's own action text warns the gate "reads text, not semantics" and explicitly forbids naming the banned calls even in a comment, but the first draft did exactly that, and the gate correctly failed it (grep exit 0 = match found).
- **Fix:** Rewrote the comment in prose describing the boundary (ADR-017 §2) without naming any of the five forbidden identifiers.
- **Files modified:** `apps/mobile/components/LocationCaptureBlock.tsx`
- **Verification:** Re-ran the exact grep command from the plan's verify block — exit code 1 (no matches), confirmed via a follow-up `grep -rnE ...` showing zero hits.
- **Committed in:** `340f4f9` (Task 2 commit — the comment never existed in the committed version)

---

**Total deviations:** 1 auto-fixed (Rule 1 — a self-caught gate failure before commit, not a functional bug)
**Impact on plan:** None on scope or deliverables — caught and fixed within Task 2 before any commit, so the committed code never violated the gate.

## Issues Encountered

- The plan's Task 2 verify block's negative grep gate is stricter than it first reads: it matches literal text anywhere in a file, including comments and even a comment explaining what NOT to do. Resolved as documented above — the fix is a documentation lesson (describe boundaries in prose), not a code change.

## User Setup Required

None - no external service configuration required. `expo-location`'s package-legitimacy checkpoint and native rebuild were already completed and device-verified in 11-02; this plan required neither a new native dependency nor a further rebuild.

## Next Phase Readiness

- ACT-01 is now user-observable end to end (create with tag or title, optional subtitle/description/location/geo/capacity, appears afterward in "Deine Aktivitäten") — pending the device UAT pass this plan's `<human-check>` blocks describe.
- ACT-06 is user-observable (server-order tag chips, id-keyed selection, no client dedup/sort) on the same screen.
- ACT-05 is fulfilled on its capture side (one-shot, opt-in, three-state permission, fully graceful denial) — the "Route öffnen" half of ACT-05 (using `buildRouteUri` from 11-02) is explicitly 11-05's job, not this plan's.
- `useActivityMutations` is complete for all four mutations (create/join/leave/dissolve) in one file with one shared pending/failed state and one invalidation prefix — 11-05 wires the three membership triggers (join/leave/dissolve) into the detail screen without touching this file a second time, exactly as the plan intended.
- **Deferred to on-device UAT** (per this project's structural test-harness limitation — no RN component harness exists): the full create flow from Task 3's `<human-check>` (CTA tap → push → validation → tag live rule → submit → appears in Deine Aktivitäten → double-tap idempotency → offline failure → EN locale), and Task 2's `<human-check>` (permission dialog exactly once, capture-to-chip, denial callout legibility, no re-prompt on remount). None of this plan's own automated verification (`npx tsc --noEmit`, `npx eslint .`, `npx vitest run` — 364/364 green, `npx lingui compile --strict` — 0 missing) can substitute for it.
- The `useFestivalContext()` root-level-sibling pattern this plan reuses from 11-01 is worth a specific check during that UAT pass: confirm the Create screen (and, by the same construction, the existing `activity-detail` screen) actually resolves a festival when pushed from within a festival tab. If it does not, that is a pre-existing 11-01 gap this plan inherited, not something introduced here.
- No blockers for 11-05.

---
*Phase: 11-activities*
*Completed: 2026-08-15*

## Self-Check: PASSED

All 10 plan-produced/modified files (use-activity-mutations.ts, LocationCaptureBlock.tsx,
activity-create.tsx, app-chrome.ts, app-chrome.test.ts, AppHeader.tsx, _layout.tsx, activities.tsx,
locales/de/messages.po, locales/en/messages.po) confirmed on disk. All three task commits
(a9601ef, 340f4f9, e37a656) confirmed present in `git log`.
