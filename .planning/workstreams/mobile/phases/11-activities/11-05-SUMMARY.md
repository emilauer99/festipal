---
phase: 11-activities
plan: 05
subsystem: ui
tags: [expo-router, react-query, lingui, activities, joinability, geo-link]

requires:
  - phase: 11-activities
    provides: "11-01: activityKeys factory, the registered /activity-detail push screen and its read path (heading/subtitle/description/startLine/seatLine/location-only meeting point); 11-02: expo-location + buildRouteUri; 11-03: resolveJoinability/canSubmitActivity/buildClonePrefill in lib/activity-form.ts; 11-04: useActivityMutations (create/join/leave/dissolve, one activityKeys.all(festivalId) invalidation, CREATE_ACTIVITY_TARGET_ID); the orchestrator's wave-3-gate fix (4d9f5e2) resolving festivalSlug -> cached festival on this same root-Stack screen"
provides:
  - "the complete Activity detail screen: participant list, seat line, Join/Leave/Dissolve, Clone, Route öffnen — all four remaining Phase-11 mutations wired to the one shared use-activity-mutations.ts hook"
  - "resolveJoinability wired to a real Join button: genuinely-disabled full/started states with the exact reason shown before submit, the 409 join-race fallback distinguished from the generic mutation failure"
  - "D-11's Auflösen-instead-of-Verlassen fork for the creator, backed by the ['me']/getMe() auth-state read (never a route param, never the participant list)"
affects: [12-lobby-chat]

actuals:
  tokens: 7455
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "The mutation hook (useActivityMutations) and the ['me'] auth-state query are anchored at the ALWAYS-MOUNTED screen shell, not the query-status-gated content component — so the pending->settled navigation effect (Dissolve success) survives the onSettled cache invalidation even if it flips the detail query to an error state (activity gone) before the effect has run"
    - "resolveJoinability's `now` is drawn exactly once per Content render (a plain `new Date()` call in the render body, never inside a callback/loop) — same D-04 'now drawn once' discipline this file's siblings already document"
    - "The 409 join-race fallback is scoped to 'currently rendering the Join button' (!isCreator && joinability.status !== 'alreadyJoined'), not to a bare failedTargetStatus check — join/leave/dissolve all share activityId as their mutation targetId, and only one of the three actions is ever visible at a time, so the branch condition is what disambiguates which action actually failed"

key-files:
  created: []
  modified:
    - apps/mobile/app/activity-detail.tsx
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "useActivityMutations() and the ['me']/getMe() query live in ActivityDetailScreen (the thin, always-mounted shell), not in ActivityDetailContent (only mounted while detailQuery.status === 'success') — moving them down would risk the dissolve-success navigation effect losing its component instance mid-transition, the exact race friend-detail.tsx's unfriend pattern avoids by never nesting its mutation hook under a conditional"
  - "isCreator compares activity.creatorId (activitySchema's own picked column, already on ActivityDetail) against the caller's own accountId from ['me']/getMe() — no new endpoint, no route param, no participant-list scan; this is the exact T-11-23 mitigation the plan's threat register names (display logic only, server remains the real enforcement)"
  - "join/leave/dissolve share activityId as the mutation targetId (established in 11-04's use-activity-mutations.ts) — since only one of the three actions is ever rendered at a given moment (creator sees only Dissolve, an already-joined non-creator sees only Leave, everyone else sees only Join), pendingTargetId/failedTargetId/failedTargetStatus need no per-action namespacing to stay unambiguous"
  - "Full/Already-started join-block reasons use fullJoined/fullCapacity as local variable names (not joined/capacity) — the outer capacity/participantCount consts are already bound for the seat line in the same function scope, and reusing those names would shadow them for no benefit"
  - "Route öffnen's icon/button size is a new local constant (ACTION_ICON_SIZE = 20, shared with Clone) rather than reusing DANGER_ICON_SIZE (22, matches friend-detail.tsx's dangerRow verbatim) — the two icons serve different roles (destructive vs. neutral/secondary-accent action) and UI-SPEC's 21–22px range for section/action icons is a range, not a single mandated value"
  - "The dangerRow (Auflösen) Pressable DOES apply the shared actionButtonDisabled opacity while pending, diverging from friend-detail.tsx's unfriend dangerRow (which uses only the disabled prop, no opacity change) — this plan's own action text explicitly requires all THREE actions (join/leave/dissolve) to be deactivated AND dampened while their mutation runs, so the current plan's explicit requirement takes precedence over the borrowed analog's exact styling"

patterns-established:
  - "A destructive confirm action inside a query-status-gated content component still needs its pending/failed tracking anchored one level up, at the always-mounted screen shell — otherwise the success-navigation effect races the query invalidation its own mutation triggers"

requirements-completed: [ACT-02, ACT-03, ACT-04, ACT-05]

coverage:
  - id: D1
    description: "Participant list renders every activity.participants entry via the unmodified PersonRow with its profile object passed through unchanged, in array (joinedAt-ascending) order with no .sort() call and no creator badge; the only-creator-seated case (participants.length <= 1) renders 'Nobody else yet.' instead of a one-row list"
    requirement: ACT-03
    verification:
      - kind: static
        ref: "apps/mobile/app/activity-detail.tsx — grep confirms no .sort() call on participants, no creator-badge element, profile={participant.profile} passed unchanged to PersonRow (11-05-PLAN Task 1 acceptance criteria)"
        status: pass
      - kind: automated
        ref: "cd apps/mobile && npx tsc --noEmit -p tsconfig.json && npx eslint . && npx vitest run — 369/369 passed"
        status: pass
    human_judgment: true
    rationale: "No RN component test harness in this project (STATE.md structural limitation) — the actual participant-row rendering, creator-first ordering, and the Nobody-else-yet copy are on-device UAT items (Task 1's own <human-check>, recorded as WINDOWS.md #52)."
  - id: D2
    description: "Join button derives its label and REAL disabled state from resolveJoinability with no separate capacity/startTime condition in the file; full/started show their exact reason before submit; the 409 join-race shows its own fallback copy distinguished from the generic failure; all three actions (Join/Leave/Dissolve) disable and dampen (shared PENDING_OPACITY) while their own mutation is in flight"
    requirement: ACT-03
    verification:
      - kind: static
        ref: "apps/mobile/app/activity-detail.tsx — grep confirms the only capacity/startTime reads outside resolveJoinability are the seat-line display and formatStartLine (unrelated to join-gating); disabled prop set genuinely (not opacity-only) for full/started (11-05-PLAN Task 2 acceptance criteria)"
        status: pass
      - kind: automated
        ref: "cd apps/mobile && npx tsc --noEmit -p tsconfig.json && npx eslint . && npx vitest run — 369/369 passed"
        status: pass
    human_judgment: true
    rationale: "The full two-account join/leave/full/started/dissolve flow (this plan's Task 2 <human-check>) is a real-time, multi-device, real-server truth only on-device UAT can confirm — recorded as WINDOWS.md #53."
  - id: D3
    description: "The creator never sees a Leave action — the isCreator branch (activity.creatorId vs. ['me']/getMe()'s own accountId, never a route param, never the participant list) renders the destructive Auflösen row instead, which opens a native confirm dialog (beziffert, Abbrechen wiederverwendet, destruktives Bestätigen) and, on success, navigates back (or replaces to the festival's Activities tab) with no confirmation toast"
    requirement: ACT-03
    verification:
      - kind: static
        ref: "apps/mobile/app/activity-detail.tsx — grep confirms no Leave-rendering branch reachable when isCreator is true, no toast call anywhere in the file (11-05-PLAN Task 2 acceptance criteria)"
        status: pass
      - kind: automated
        ref: "cd apps/mobile && npx tsc --noEmit -p tsconfig.json && npx eslint . && npx vitest run — 369/369 passed"
        status: pass
    human_judgment: true
    rationale: "The Auflösen confirm-dialog wording, the destructive-styled confirm button, and the post-success navigation landing correctly on the Activities tab are on-device UAT items — recorded as WINDOWS.md #53 alongside the two-account flow."
  - id: D4
    description: "Clone renders unconditionally on every visible activity (own or foreign) and navigates push (not replace) to /activity-create with cloneFromId + festivalSlug, so Back returns to this same detail screen; Route öffnen renders only when activity.geo is non-null and builds its target exclusively via buildRouteUri(activity.geo, platform) with no intermediate object built from separately-read numeric fields; the meeting-point block renders nothing when both location and geo are absent; ActivityCard.tsx is untouched — no route affordance anywhere in the list row"
    requirement: ACT-04
    verification:
      - kind: static
        ref: "apps/mobile/app/activity-detail.tsx — grep confirms buildRouteUri receives activity.geo directly, the Clone Pressable carries no isCreator/joinability condition, and apps/mobile/components/ActivityCard.tsx has zero diff in this plan (11-05-PLAN Task 3 acceptance criteria)"
        status: pass
      - kind: automated
        ref: "cd apps/mobile && npx tsc --noEmit -p tsconfig.json && npx eslint . && npx vitest run — 369/369 passed"
        status: pass
    human_judgment: true
    rationale: "Opening a real map app via Linking.openURL and confirming the clone form's prefilled/cleared fields on a foreign activity are on-device UAT items — recorded as WINDOWS.md #54."
  - id: D5
    description: "ACT-05's output side is fulfilled end to end: Route öffnen hands the activity's own contract-validated geo object to an external maps app; without a geo point the meeting-point block shows only the free-text location; with neither, it renders nothing"
    requirement: ACT-05
    verification:
      - kind: static
        ref: "apps/mobile/app/activity-detail.tsx — the meeting-point block's three-way branch (geo present / location-only / both absent) matches UI-SPEC § Route/Maps Handoff Contract and E3's partial-state row exactly"
        status: pass
    human_judgment: true
    rationale: "Confirming the correct external maps app opens with the right coordinates is a real-device, real-OS-chooser truth — recorded as WINDOWS.md #54."

duration: ~6min active coding across three commits (18:48–18:54); excludes the upfront read pass across ~20 files (plan, prior SUMMARYs, UI-SPEC, PATTERNS, contracts, and every referenced screen/component/lib module) needed before writing any code
completed: 2026-08-15
status: complete
---

# Phase 11 Plan 05: Activity Detail Actions Summary

**The Activity detail screen becomes complete: participant list, Join/Leave with the resolveJoinability-driven pre-submit disabled reason, the creator-only destructive Auflösen fork, Clone (push, cloneFromId+festivalSlug), and Route öffnen (buildRouteUri fed the activity's own geo object directly) — closing three of Phase 11's six ROADMAP success criteria.**

## Performance

- **Duration:** ~6min active coding across three commits (18:48–18:54); excludes the upfront read pass across ~20 files needed before writing any code, and the orchestrator's prior wave-gate fix (4d9f5e2) this plan built directly on top of.
- **Started:** 2026-08-15T18:48:54+02:00 (first task commit)
- **Completed:** 2026-08-15T18:54:46+02:00
- **Tasks:** 3
- **Files modified:** 3 (1 screen file, 2 locale catalogs)

## Accomplishments

- **Participant list + seat-line polish** (Task 1): `activity.participants` renders through the unmodified `PersonRow`, one `profile` object passed straight through with no reconstruction, in array order (creator first by construction, no `.sort()` call, no creator badge). The only-creator-seated case shows "Nobody else yet." instead of a bare one-row list.
- **Join / Leave / Dissolve** (Task 2): `resolveJoinability` (11-03) drives the Join button's label and its REAL disabled state — full/started show their exact reason before the tap, not after a failed request. The 409 join-race gets its own fallback copy, distinguished from the generic "Couldn't save" text via the mutation hook's `failedTargetStatus`. The creator is identified via `['me']`/`getMe()` against `activity.creatorId` (never a route param, never the participant list) and gets the destructive Auflösen row instead of Leave, with a native confirm dialog (beziffert, destructive confirm) and a silent (no-toast) navigation back on success. All three actions genuinely disable and visually dampen (shared `PENDING_OPACITY`) while their own mutation is in flight.
- **Clone + Route öffnen** (Task 3): Clone renders on every visible activity unconditionally and navigates *push* (not replace) to `/activity-create` with `cloneFromId` + `festivalSlug`, so Back returns to this same detail screen. Route öffnen renders only when `activity.geo` is non-null, and its target address comes exclusively from `buildRouteUri(activity.geo, platform)` — no intermediate object, no free text, no navigation parameter can reach it. The meeting-point block's three states (geo present / location-only / both absent → renders nothing) match the UI-SPEC contract exactly. `ActivityCard.tsx` is untouched — no route affordance anywhere in the list row.
- The orchestrator's post-wave-3 festival-resolution fix (`contextFestival ?? findCachedFestivalBySlug(...)`, commit `4d9f5e2`) was preserved unchanged throughout; the Clone push now also forwards `festivalSlug` alongside `cloneFromId`, matching the fix's requirement.
- 12 new catalog msgids across both locales, all filled (`lingui compile --strict` — 0 missing).

## Task Commits

Each task was committed atomically:

1. **Task 1: Teilnehmerliste und Sitzplatzzeile — die Fremd-Sicht ohne zweite Projektion** - `70cb103` (feat)
2. **Task 2: Beitreten, Verlassen und Auflösen — Sperrgrund vor dem Absenden statt Fehlschlag danach** - `8d76047` (feat)
3. **Task 3: Klonen und Route öffnen — die beiden Weiterleitungen aus dem Detail** - `7178f1d` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit below).

## Files Created/Modified

- `apps/mobile/app/activity-detail.tsx` - participant list, seat-line context, Join/Leave/Dissolve actions, Clone action, Route öffnen action, all new styles
- `apps/mobile/locales/{de,en}/messages.po` - 12 new msgids (Nobody else yet / Full — {joined}/{capacity} spots / Already started / Join / Leave / Dissolve / Dissolve this activity? / All {participantCount} participants… / The last spot just went… / Clone / Open route)

## Decisions Made

- `useActivityMutations()` and the `['me']`/`getMe()` query were anchored at the always-mounted `ActivityDetailScreen` shell, not inside the query-status-gated `ActivityDetailContent` — this is what lets the Dissolve success-navigation effect survive the `onSettled` cache invalidation even if it flips the detail query to an error state (the activity is gone) before the effect has had a chance to run. Matches `friend-detail.tsx`'s unfriend pattern, which never nests its mutation hook under a conditional either.
- `isCreator` compares `activity.creatorId` (already on `ActivityDetail` via `activitySchema`'s picked column) against the caller's own `accountId` from `['me']`/`getMe()` — the same idiom `profil.tsx` already establishes for reading the auth-state accountId. No new endpoint, no route param, no participant-list scan (T-11-23's own mitigation text).
- Join/Leave/Dissolve share `activityId` as their mutation `targetId` (an 11-04 decision, not new here) — since only one of the three is ever rendered for a given caller at a given moment, `pendingTargetId`/`failedTargetId`/`failedTargetStatus` stay unambiguous without per-action namespacing.
- The full/started join-block-reason local variables are named `fullJoined`/`fullCapacity`, not `joined`/`capacity` — the outer `capacity`/`participantCount` consts are already bound in the same function scope for the seat line, and reusing those names would shadow them for no benefit (readability, not a lint requirement — this project's ESLint config carries no `no-shadow` rule).
- Route öffnen/Clone's icon size is a new local constant (`ACTION_ICON_SIZE = 20`), not a reuse of `DANGER_ICON_SIZE` (22, matches `friend-detail.tsx`'s `dangerRow` verbatim per the plan's own analog instruction) — the two icons serve structurally different roles (destructive vs. neutral/secondary-accent), and UI-SPEC's 21–22px section/action-icon guidance is a range, not one mandated value.
- The Auflösen `dangerRow` Pressable DOES apply the shared `actionButtonDisabled` opacity while pending — this diverges from `friend-detail.tsx`'s unfriend `dangerRow` (which uses only the `disabled` prop, no opacity change). This plan's own action text explicitly requires all THREE actions to be deactivated AND dampened while their mutation runs ("mit dem etablierten Dämpfungsfaktor dargestellt"), so that explicit current-plan requirement took precedence over the borrowed analog's exact styling.

## Deviations from Plan

None - plan executed exactly as written. The orchestrator's pre-flagged wave-gate fix (`4d9f5e2`, festival resolution on root-Stack activity screens) was read and preserved per the execution brief; the Clone push params were extended to include `festivalSlug` alongside `cloneFromId` as that brief required.

## Issues Encountered

None — all three tasks' automated verification (`npx tsc --noEmit`, `npx eslint .`, `npx vitest run`, `npx lingui compile --strict`) passed on the first run at every task boundary; no build, typecheck, or lint failures required investigation. The `pnpm` wrapper's known `ERR_PNPM_ENOENT` issue on `node_modules/@better-auth/core` (documented in 11-02's SUMMARY) was avoided entirely by using direct `npx` invocations per this session's environment notes.

## User Setup Required

None - no external service configuration required. No new native dependency, no native rebuild needed (this plan only touches JS-level screen logic on top of 11-02's already-installed and already-rebuilt `expo-location`).

## Next Phase Readiness

- ACT-03 is now user-observable end to end (join, leave, capacity/started disabled reasons, 409 race fallback, creator's Auflösen fork) — pending the two-account device UAT pass Task 2's `<human-check>` describes.
- ACT-04 is now user-observable end to end (Clone at every visible activity, including foreign ones, opens the prefilled form with cleared time/geo, Back returns to source detail) — pending Task 3's device UAT pass.
- ACT-05 is now fulfilled on both its capture side (11-04) and its output side (this plan's Route öffnen) — pending Task 3's device UAT pass for the actual external-maps-app handoff.
- ROADMAP success criteria 2 (immediate + restart-surviving seat count), 3 (pre-submit disabled reason), and 5 (route handoff) are implemented and ready for device confirmation.
- Per this plan's own `<verification>` note: at phase close, ACT-01…ACT-06 checkboxes and the REQUIREMENTS.md traceability table must be set BY HAND — `gsd-tools requirements.mark-complete` does not resolve the workstream path in this repository layout (STATE.md Blockers, confirmed again in Phase 7/8/9/10's closes).
- **Deferred to on-device UAT** (per this project's structural test-harness limitation — no RN component test harness exists): all three tasks' `<human-check>` blocks, recorded as `WINDOWS.md` entries #52 (Task 1), #53 (Task 2), #54 (Task 3). None of this plan's own automated verification (typecheck/lint/vitest/lingui-compile, all green) can substitute for the two-account real-time flow, the native confirm dialog, or the real maps-app handoff.
- This closes Phase 11's content: the phase's remaining work is device UAT and the phase-close security sign-off (`/gsd-secure-phase 11`), per the plan's own "nach diesem Plan ist die Phase inhaltlich zu" framing.
- No blockers.

---
*Phase: 11-activities*
*Completed: 2026-08-15*

## Self-Check: PASSED

`apps/mobile/app/activity-detail.tsx`, `apps/mobile/locales/de/messages.po`, and
`apps/mobile/locales/en/messages.po` confirmed on disk with the expected changes. All three task
commits (`70cb103`, `8d76047`, `7178f1d`) confirmed present in `git log`.
