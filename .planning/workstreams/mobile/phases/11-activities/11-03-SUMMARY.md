---
phase: 11-activities
plan: 03
subsystem: ui
tags: [react-native, form-primitives, lingui, pure-functions, tdd, activities]

requires:
  - phase: 10-activities-backend
    provides: "createActivityBodySchema.refine, activityDetailSchema/activitySummarySchema, activityGeoSchema — the contract shapes canSubmitActivity/resolveJoinability/buildClonePrefill mirror"
  - phase: 11-activities
    provides: "11-01: ActivityCard's neutral-chip/joined-badge colour treatment (the precedent Chip.tsx's selected/neutral states extend); 11-02: expo-location + buildRouteUri (unrelated surface, same phase security register)"
provides:
  - "lib/activity-form.ts — canSubmitActivity (D-05 tag-or-title rule), resolveJoinability (D-10 four-way join state), buildClonePrefill (D-12/D-15 literal carry-over) — the three pure rules 11-04's create/detail screens consume directly"
  - "components/Input.tsx, components/Chip.tsx, components/CapacityField.tsx, components/DayTimeField.tsx — the four owned RN form primitives 11-04's create screen composes"
affects: [11-04, 11-05]

actuals:
  tokens: 10100
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Chip's selected state (fillBrandQuiet + borderBrand + primary text) extends beyond SegmentedControl.itemSelected's literal roles (fill only, no border, textPrimary text) per UI-SPEC § Color item 3's explicit border+text spec — SegmentedControl's items sit inside a bordered track and don't need their own border, but a standalone Chip does; documented as a decision below rather than left as a silent divergence from the plan's 'exact roles' phrasing"
    - "Chip's remove tap area gets an explicit minWidth/minHeight: layout.hitMin (not a hitSlop-only extension) — the UI-SPEC's layout.hitMin table row explicitly names 'chip-remove' alongside chips/stepper-buttons/join-leave-dissolve as needing the literal 44px floor"
    - "DayTimeField's date parsing re-implements lib/date-range.ts's local Y/M/D parseDateOnlyLocal house rule inline rather than exporting/importing it — date-range.ts is outside this plan's files_modified scope, and the ~15-line duplication is small and well-isolated"

key-files:
  created:
    - apps/mobile/lib/activity-form.ts
    - apps/mobile/lib/__tests__/activity-form.test.ts
    - apps/mobile/components/Input.tsx
    - apps/mobile/components/Chip.tsx
    - apps/mobile/components/CapacityField.tsx
    - apps/mobile/components/DayTimeField.tsx
  modified:
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "canSubmitActivity's block reasons are a flat { titleOrTag, day, time } boolean object, not an array — day and time are independent per the plan's own text ('jeweils mit eigener Ursache, damit der Screen zwei verschiedene Inline-Fehler zeigen kann'), while tag-or-title stays ONE combined reason since the Copywriting Contract gives it one shared inline error under the title field"
  - "resolveJoinability checks `joined` FIRST, ahead of started/full — a visitor who already joined an activity that has since started or filled up still gets alreadyJoined, not started, because the caller needs this specifically to render Leave (not a disabled Join button); the two are different controls entirely"
  - "The startTime-equals-now tie-break resolves to 'started' (<=, not <) — 'at this instant' reads as 'already begun', keeping the function total and deterministic at the boundary; documented in a code comment and covered by a dedicated test"
  - "buildClonePrefill copies the source's already-RESOLVED activitySchema.title verbatim (not a reconstructed one) — the contract exposes no separate 'was this title auto-derived from the tag' flag, so the client cannot distinguish an explicit title from an auto-title; copying the resolved string verbatim is the only literal reading of 'Titel wörtlich übernommen' the contract supports"
  - "Chip's selected-state border+text (borderBrand + primary) intentionally extends past SegmentedControl.itemSelected's literal implementation (fill only, textPrimary text) — UI-SPEC § Color item 3 explicitly specifies fillBrandQuiet+borderBrand+primary for the Chip family (tag/day/location chips), checker-approved (Dimension 3: PASS); SegmentedControl is followed for the FILL role specifically, which is the one role both docs agree on"
  - "The two selection-error catalog strings ('Choose a day.'/'Choose a time.') named in the plan's action text are deliberately NOT added to the catalog in this task — DayTimeField explicitly takes dayErrorText/timeErrorText as pre-built strings and renders no validation message of its own, so no t-macro call site for those two exact strings exists yet; lingui extract only captures msgids at an actual call site, and that call site is the 11-04 create screen"
  - "Two Rule-2 catalog additions beyond the plan's literal Copywriting Contract table: 'Decrease/Increase capacity' (stepper a11y labels — a numeric stepper's icon-only buttons have no visible text to serve as their accessible name) and the day-chip-unavailable message (T-11-10's mitigation needs an actual rendered fallback state, not just a safe empty array, or an absent/malformed festival date range would render a silently empty block)"

patterns-established:
  - "Form primitives take label/placeholder/helper/error copy as FINISHED strings, never own a Lingui macro for content that varies by call site — the Babel macro must appear textually at each call, and this keeps catalog ownership unambiguous (component owns only its OWN static structural copy: eyebrows, No-limit/Begrenzen copy, stepper a11y labels)"

requirements-completed: [ACT-01, ACT-04]

coverage:
  - id: D1
    description: "canSubmitActivity mirrors createActivityBodySchema.refine (tag OR non-empty trimmed title) plus independent day/time presence checks, each with its own machine-marker reason so the screen can render up to three distinct inline errors"
    requirement: ACT-01
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/activity-form.test.ts#canSubmitActivity (11 cases: tag-set/title-empty, title-set/tag-null, both-empty, whitespace-only title, both-set, day+time-present-does-not-rescue, day-missing, time-missing, both-missing-two-reasons, machine-marker check)"
        status: pass
    human_judgment: false
  - id: D2
    description: "resolveJoinability derives the D-10 four-way join state (joinable/alreadyJoined/full/started) from an ActivityDetail and a passed-in comparison timestamp — capacity null is always joinable, alreadyJoined takes priority over started/full, the startTime===now tie-break is deterministic"
    requirement: ACT-01
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/activity-form.test.ts#resolveJoinability (9 cases covering all four states, the capacity-null/full/started/tie-break/priority-order boundaries)"
        status: pass
    human_judgment: false
  - id: D3
    description: "buildClonePrefill copies tag/title/subtitle/description/location/capacity verbatim from the source and explicitly nulls startTime and geo (D-12/D-15), including the capacity-null and no-tag/no-optional-fields edge cases"
    requirement: ACT-04
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/activity-form.test.ts#buildClonePrefill (6 cases: verbatim carry-over, startTime nulled, geo nulled even when the source has a captured point, capacity-null preserved not substituted, absent optional fields stay null not invented, absent tag stays null)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Input and Chip — the two shared RN form primitives — resolve colours through useTheme() per render, build styles via createStyles(colors) in useMemo, use only spacingScale/radiiScale/layout/typeRoles values (no raw hex, no new pixel literal), and every tappable element (Chip's own press, Chip's remove tap area) floors at layout.hitMin"
    requirement: ACT-01
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/type-tracking.test.ts (title2/tracked-role coupling gate — no new type role introduced by either component)"
        status: pass
      - kind: static
        ref: "npx tsc --noEmit -p tsconfig.json && npx eslint components/Input.tsx components/Chip.tsx — 0 errors, i18next/no-literal-string clean (both components take copy as finished strings, no owned copy)"
        status: pass
    human_judgment: true
    rationale: "No RN component test harness in this project (STATE.md structural limitation) — the actual visual rendering, colour-role fidelity against SegmentedControl/ActivityCard, and the 44px tap-target feel are on-device UAT items, deferred to 11-04 per this plan's own <verify><human-check> (WINDOWS.md unrun-verify entry recorded)."
  - id: D5
    description: "CapacityField starts unlimited by construction (no first-render branch sets a number), the minus button is disabled at value 1 with no path to reach 0, and there is no minimum-participant stepper at all (D-06 — the 'max set, min unset' state is unreachable, not merely unchecked)"
    requirement: ACT-01
    verification:
      - kind: static
        ref: "apps/mobile/components/CapacityField.tsx — activateLimit always dispatches MIN_CAPACITY (never a caller-supplied number), deactivateLimit always dispatches null (never a number), decrement is a no-op guarded by `value <= MIN_CAPACITY`, and no second stepper/second numeric state exists in the file"
        status: pass
    human_judgment: true
    rationale: "The stepper's actual tap behaviour (disabled-at-1 visual, the 36px circle sizing, the unlimited<->limited transition) is a device-rendering truth this project's node-env Vitest runner cannot observe — deferred to 11-04's on-device pass alongside the create screen (WINDOWS.md unrun-verify entry recorded)."
  - id: D6
    description: "DayTimeField derives day chips from the festival's date range using local Y/M/D construction (never new Date(str)), wraps instead of horizontal-scrolling, and an absent/malformed/reversed range yields zero chips plus the block's own dedicated copy rather than an empty row or an infinite loop (T-11-10)"
    requirement: ACT-01
    verification:
      - kind: unit
        ref: "npx tsc --noEmit -p tsconfig.json && npx eslint components/DayTimeField.tsx — 0 errors; buildDayOptions is exported and structurally guarded (defensive 366-iteration bound, empty-array returns for null/malformed/reversed input) per code inspection"
        status: pass
    human_judgment: true
    rationale: "buildDayOptions has no dedicated unit test file in this plan (the plan's Task 1 test obligation was scoped to activity-form.ts only) — its correctness rests on code inspection plus the 11-04 on-device pass (one-day festival = one chip, long festival wraps cleanly), both recorded as a WINDOWS.md unrun-verify entry."

duration: ~25min
completed: 2026-08-15
status: complete
---

# Phase 11 Plan 03: Activity Form Building Blocks Summary

**Four owned RN form primitives (`Input`, `Chip`, `CapacityField`, `DayTimeField`) on shared tokens, plus `lib/activity-form.ts` — the three pure, TDD-proven rules (tag-or-title submittability, four-way joinability, clone-prefill carry-over) 11-04's create/detail screens will consume directly.**

## Performance

- **Duration:** ~25min
- **Started:** 2026-08-15 (context load + read_first files)
- **Completed:** 2026-08-15T18:05:20+02:00
- **Tasks:** 3
- **Files modified:** 8 (6 created, 2 catalog files modified)

## Accomplishments

- `lib/activity-form.ts`: `canSubmitActivity` mirrors `createActivityBodySchema.refine` (tag OR non-empty trimmed title) plus independent day/time presence checks with per-field machine-marker reasons (T-11-07); `resolveJoinability` derives the D-10 four-way state (`joinable`/`alreadyJoined`/`full`/`started`) from a passed-in comparison timestamp, never the system clock, with `alreadyJoined` taking priority so a joined-but-started activity still routes to Leave, not a disabled Join button (T-11-08); `buildClonePrefill` copies `tag`/`title`/`subtitle`/`description`/`location`/`capacity` verbatim and explicitly nulls `startTime` and `geo` (D-12/D-15)
- RED-then-GREEN: `activity-form.test.ts` (24 cases) written and confirmed failing before `activity-form.ts` existed, all green after
- `Input`: labeled text field generalized from `complete-profile.tsx`'s existing field pattern — label/body/bodySm-danger roles, `r-md` block, `sp-5` padding; multiline description mode grows within its own block (UI-SPEC E4 overflow); takes label/placeholder/helper/error as finished strings, owns no copy
- `Chip`: one generic pill primitive serving three roles (single-select tag, single-select day, removable location chip) — no group/multi-select logic of its own (T-11-11); selected = `fillBrandQuiet` + `borderBrand` + `primary` text (UI-SPEC § Color item 3), neutral = `fillQuiet` + `textSecondary` (matching `ActivityCard`'s existing tag-chip treatment); remove tap area renders only when `onRemove` is set and carries its own `layout.hitMin` floor
- `CapacityField` (D-08): starts unlimited by construction — no first-render branch can set a number; "Begrenzen" activates a Max-only −/+ stepper (36px circles reusing `AppHeader`'s `LEFT_BUTTON_CIRCLE_SIZE` precedent, the one allowed off-ramp size this phase); minus is disabled at value 1 (0 is unreachable); "Limit entfernen" always rolls back to `null`, never a number. No min-participant stepper exists at all (D-06)
- `DayTimeField` (D-07): day chips derived from the festival's date range via local Y/M/D construction (never `new Date(str)`), wrapping instead of horizontal-scrolling (UI-SPEC E7); an absent/malformed/reversed range yields zero chips and the block's own dedicated "dates not set" copy instead of an empty row or an infinite loop (T-11-10, defensively bounded at 366 iterations); time picker follows `complete-profile.tsx`'s exact platform branching (Android imperative `DateTimePickerAndroid.open`, iOS embedded `DateTimePicker`) — no new native package; renders no validation message of its own, takes `dayErrorText`/`timeErrorText` as finished strings from the caller
- 9 new catalog strings extracted and filled in both locales (0 missing per `lingui extract`): the "Wann"/"Kapazität" eyebrows, "Ohne Limit"/"Begrenzen"/"Limit entfernen" copy, plus three Rule-2 additions (two stepper a11y labels, the day-chip-unavailable message)
- Full repo verification green throughout: `pnpm typecheck`/`pnpm lint`/`pnpm exec vitest run` (363/363 tests, 30 files) at every task boundary

## Task Commits

Each task was committed atomically:

1. **Task 1: activity-form.ts — die drei reinen Regeln der Phase, testgetrieben** - `c213807` (feat)
2. **Task 2: Input und Chip — die beiden geteilten Primitive** - `be509e8` (feat)
3. **Task 3: CapacityField und DayTimeField — die beiden zusammengesetzten Formularblöcke** - `e2e9d03` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit below).

## Files Created/Modified

- `apps/mobile/lib/activity-form.ts` - `canSubmitActivity`, `resolveJoinability`, `buildClonePrefill`
- `apps/mobile/lib/__tests__/activity-form.test.ts` - 24 test cases across all three functions
- `apps/mobile/components/Input.tsx` - labeled text field primitive
- `apps/mobile/components/Chip.tsx` - generic pill primitive (select/remove variants)
- `apps/mobile/components/CapacityField.tsx` - D-08 capacity block
- `apps/mobile/components/DayTimeField.tsx` - D-07 day-chip + time-picker block, exports `buildDayOptions`
- `apps/mobile/locales/{de,en}/messages.po` - 9 new msgids

## Decisions Made

- `canSubmitActivity`'s reasons are a flat `{ titleOrTag, day, time }` boolean object, not an array — day and time are independent per the plan's own text (two distinct inline errors), while tag-or-title stays one combined reason matching the Copywriting Contract's single shared error under the title field.
- `resolveJoinability` checks `joined` first, ahead of `started`/`full` — a visitor who already joined an activity that has since started or filled up still gets `alreadyJoined`, because the caller needs this specifically to render Leave, not a disabled Join button; the two are different controls entirely.
- The `startTime === now` tie-break resolves to `started` (`<=`, not `<`) — documented in a code comment and covered by a dedicated test, per the plan's explicit requirement that this boundary be deterministic and recorded.
- `buildClonePrefill` copies the source's already-RESOLVED `activitySchema.title` verbatim, never reconstructing one — the contract exposes no "was this auto-derived from the tag" flag, so copying the resolved string verbatim is the only literal reading of "Titel wörtlich übernommen" the contract actually supports.
- `Chip`'s selected state (`fillBrandQuiet` + `borderBrand` + `primary` text) intentionally extends past `SegmentedControl.itemSelected`'s literal implementation (fill only, `textPrimary` text, no border) — UI-SPEC § Color item 3 explicitly specifies the border+text combination for the Chip family, checker-approved (Dimension 3: PASS). `SegmentedControl` is followed for the FILL role specifically — the one role both the plan's action text and the UI-SPEC agree on; `SegmentedControl`'s items sit inside a bordered track and don't need their own border, but a standalone `Chip` does.
- The two selection-error catalog strings ("Choose a day."/"Choose a time.") named in the plan's action text are deliberately NOT added to the catalog in this task — `DayTimeField` explicitly takes `dayErrorText`/`timeErrorText` as pre-built strings and renders no validation message of its own, so no `t`-macro call site for those two exact strings exists yet. `lingui extract` can only capture a msgid at an actual call site, and that call site is the 11-04 create screen, which will add and fill them when it maps `canSubmitActivity`'s `day`/`time` reason markers to display text.
- `DayTimeField`'s date parsing re-implements `lib/date-range.ts`'s local Y/M/D house rule inline rather than exporting/importing `parseDateOnlyLocal` from it — `date-range.ts` sits outside this plan's declared `files_modified` scope, and the ~15-line duplication is small, well-isolated, and documented in both places as following "the house rule."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Added stepper accessibility labels to CapacityField**
- **Found during:** Task 3
- **Issue:** The Max-stepper's −/+ buttons are icon-only (Lucide `Minus`/`Plus`, no visible text) — without an explicit `accessibilityLabel`, a screen reader has no accessible name for either control.
- **Fix:** Added `t\`Decrease capacity\`` / `t\`Increase capacity\`` as `accessibilityLabel` props, extracted and filled in both catalogs.
- **Files modified:** `apps/mobile/components/CapacityField.tsx`, `apps/mobile/locales/{de,en}/messages.po`
- **Verification:** `lingui extract` picked up both msgids; both filled; `pnpm typecheck`/`pnpm lint` clean.
- **Committed in:** `e2e9d03` (Task 3 commit)

**2. [Rule 2 - Missing critical functionality] Added a dedicated fallback message for DayTimeField's empty day-option state**
- **Found during:** Task 3
- **Issue:** T-11-11's threat register entry (T-11-10, Denial of Service) requires that an absent/malformed festival date range "erzeugt keine Chip-Reihe und keine Endlosschleife, sondern den eigens vorgesehenen Zustand" (produces neither a chip row nor an infinite loop, but its own dedicated state) — a safe empty array alone (no crash, no loop) satisfies the DoS mitigation but leaves the block visually blank with no explanation, which the plan's action text explicitly rules out ("der Block sagt das über seine eigene, dafür vorgesehene Kopie statt eine leere Zeile zu zeigen").
- **Fix:** Added a `<Trans>` fallback message rendered when `buildDayOptions` returns an empty array, extracted and filled in both catalogs.
- **Files modified:** `apps/mobile/components/DayTimeField.tsx`, `apps/mobile/locales/{de,en}/messages.po`
- **Verification:** `lingui extract` picked up the msgid; filled; `pnpm typecheck`/`pnpm lint` clean.
- **Committed in:** `e2e9d03` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 2 — missing critical functionality, both accessibility/correctness additions with no scope creep beyond the two components already in scope)
**Impact on plan:** Both additions are required by the plan's own threat register (T-11-10) and its own action text (the day-unavailable copy), not independently invented scope. Neither touches a file outside this task's declared `files_modified` list.

## Issues Encountered

None — all three tasks' `<automated>` verify blocks passed on the first run; no build, typecheck, or lint failures required investigation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `lib/activity-form.ts`'s three exports are ready for 11-04's create/detail screens to consume directly — `canSubmitActivity` gates the submit button and drives inline field errors, `resolveJoinability` gates the Join button and its disabled-reason copy, `buildClonePrefill` seeds the create form's initial state in clone mode.
- All four form primitives (`Input`, `Chip`, `CapacityField`, `DayTimeField`) are ready for 11-04 to compose into the create screen — none has its own screen surface yet, so their visual/interaction truth is entirely deferred to that plan's on-device UAT pass (recorded below).
- 11-04 still owes two catalog strings this plan deliberately deferred: "Choose a day."/"Choose a time." (the day/time validation-error text, mapped from `canSubmitActivity`'s `day`/`time` reason markers) — tracked as a WINDOWS.md `todo` entry so it isn't silently forgotten.
- **Deferred to 11-04's on-device UAT** (per this project's structural test-harness limitation — no RN component harness exists): `Input`/`Chip`'s visual rendering and colour-role fidelity; `CapacityField`'s stepper interaction (disabled-at-1 feel, unlimited↔limited transition); `DayTimeField`'s one-day-festival-yields-one-chip and long-festival-wraps-cleanly checks. All three recorded as `WINDOWS.md` `unrun-verify` entries, matching the plan's own `<human-check>` deferral language.
- No blockers for 11-04.

---
*Phase: 11-activities*
*Completed: 2026-08-15*

## Self-Check: PASSED

All 6 plan-produced files (activity-form.ts, activity-form.test.ts, Input.tsx, Chip.tsx,
CapacityField.tsx, DayTimeField.tsx) confirmed on disk. Both catalog files (locales/de/messages.po,
locales/en/messages.po) confirmed modified with 0 missing translations per `lingui extract`. All
three task commits (c213807, be509e8, e2e9d03) confirmed present in `git log`.
