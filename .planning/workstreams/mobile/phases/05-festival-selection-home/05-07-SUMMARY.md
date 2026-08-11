---
phase: 05-festival-selection-home
plan: 07
subsystem: ui
tags: [react-native, expo-router, tanstack-query, lingui, festival-card, home-screen]

# Dependency graph
requires:
  - phase: 05-festival-selection-home
    provides: "05-03 (date-range helper, active-festival-storage, festivalKeys/unwrapOk, /f/:festivalSlug screen); 05-04 (FestivalCard flat+hero variant); 05-05 (FloatingNav + (tabs) shell, home.tsx placeholder); 05-06 (Meine/Alle segmented festivals.tsx, /festivals?segment=all shared contract)"
provides:
  - "apps/mobile/lib/select-next-festival.ts -- pure, tested selectNextFestival/orderFestivalsForHome hero-selection helper"
  - "apps/mobile/app/(tabs)/home.tsx -- the real Home tab: next-festival hero + Meine-Festivals rail + empty state (HOME-01)"
affects: [phase-06-friends-profile, future-home-content-phases]

# Actuals (#2632)
actuals:
  tokens: 6900
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure hero-selection helper (no React import) unit-tested in the node-env Vitest runner, mirroring lib/otp-error.ts/lib/date-range.ts"
    - "Four-state ts-rest query view model (loading/transport-error/response-error/ready) reused verbatim from (tabs)/festivals.tsx"

key-files:
  created:
    - apps/mobile/lib/select-next-festival.ts
    - apps/mobile/lib/__tests__/select-next-festival.test.ts
  modified:
    - apps/mobile/app/(tabs)/home.tsx
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "selectNextFestival is a first-item projection of orderFestivalsForHome (the SAME total ordering) so hero and rail always agree on order -- no duplicate sorting logic"
  - "Deterministic fallback (no upcoming festival) ignores dates entirely and sorts by name then id -- ties never fall back to input/API row order"
  - "Rail/hero always pass saved={true} via a shared noopSave() no-op (FestivalCard's onSave is a required prop but never fires since these are always-saved rows)"

patterns-established:
  - "Pattern: pure ordering helpers separate selection (first item) from full ordering (rest -> rail) so both consumers share one source of truth"

requirements-completed: [HOME-01]

coverage:
  - id: D1
    description: "selectNextFestival/orderFestivalsForHome: deterministic hero selection (date-only local parse, upcoming-first, name/id tie-break and fallback)"
    requirement: "HOME-01"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/select-next-festival.test.ts (21 tests: empty/single/upcoming/tie/exact-today/all-past/null/malformed-date/immutability/input-order-independence)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Home tab renders next-festival hero (FestivalCard hero variant, saved=true, 'Festival öffnen' CTA) + Meine-Festivals rail (flat FestivalCards, saved=true, no Save affordance), sourced from listMyFestivals"
    requirement: "HOME-01"
    verification:
      - kind: manual_procedural
        ref: "On-device: login with >=1 saved festival, confirm hero+rail render and tapping either enters the festival (per plan's <verify> manual step)"
        status: unknown
    human_judgment: true
    rationale: "Requires a real device/emulator session (network + MMKV + native navigation); not exercised in this headless execution, same class of gap as prior Phase 5 plans' on-device UATs"
  - id: D3
    description: "Zero saved festivals renders a single shared empty-state block whose CTA and the rail 'Alle' see-all both push /festivals?segment=all (opens the Festivals tab on Alle, not Meine)"
    requirement: "HOME-01"
    verification:
      - kind: unit
        ref: "typecheck + lint (apps/mobile) confirm the typed route literal compiles; behavioral confirmation is the same on-device UAT as D2"
        status: pass
    human_judgment: true
    rationale: "The navigation contract typechecks and reuses 05-06's proven param-read effect, but the actual tab-opens-on-Alle behavior needs an on-device check"

duration: ~20min
completed: 2026-08-06
status: complete
---

# Phase 5 Plan 7: Home Tab (Hero + Rail) Summary

**Lean Home tab (HOME-01) — a pure, tested `selectNextFestival` helper picks the next-festival hero from `listMyFestivals`; the rest render in a "Meine Festivals" rail, or a shared empty state when nothing is saved.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- `select-next-festival.ts`: pure `orderFestivalsForHome`/`selectNextFestival` — date-only local parsing (never `new Date(str)`), upcoming-first ascending order, deterministic name-then-id tie-break and no-upcoming fallback (never the API's unspecified row order), 21 passing unit tests covering every edge probe the plan called out (empty/single/upcoming/tie/exact-today/all-past/null/malformed-date/immutability/input-order-independence).
- `(tabs)/home.tsx` rewritten from the 05-05 placeholder into the real Home overview: "Dein nächstes Festival" eyebrow + hero `FestivalCard` (hero variant, `saved`, "Festival öffnen" CTA), a "Meine Festivals" horizontal rail (flat `FestivalCard`s, `saved`, no Save affordance, omitted when 0 or 1 saved festival), and a single shared empty-state block at zero saved festivals.
- Gate-less entry (`saveActiveFestivalSlug` + `router.push('/f/:slug')`) survives a synchronous MMKV persistence failure — the try/catch never blocks navigation.
- Empty-state CTA and the rail "Alle" see-all both push `/festivals?segment=all`, the shared cross-tab contract 05-06 already consumes.
- Reused the existing `festivals.tsx` loading-text and network-error+retry copy verbatim (no new skeleton); pending, transport-error, resolved-non-200, and resolved-200 are four distinct states so a real API failure never falls through to the empty-state UI.

## Task Commits

Each task was committed atomically:

1. **Task 1: selectNextFestival pure hero-selection helper (deterministic, tested)** - `f4d3d8e` (test)
2. **Task 2: Lean Home overview — hero + Meine-Festivals rail + empty state** - `63a1bcc` (feat)

**Plan metadata:** _(this commit, following this summary)_

## Files Created/Modified
- `apps/mobile/lib/select-next-festival.ts` - pure `selectNextFestival`/`orderFestivalsForHome` hero-selection + deterministic full-ordering helper
- `apps/mobile/lib/__tests__/select-next-festival.test.ts` - 21 unit tests covering every behavior/edge case in the plan's `<behavior>` block
- `apps/mobile/app/(tabs)/home.tsx` - the real Home tab: hero + rail + empty state, replacing the 05-05 placeholder
- `apps/mobile/locales/de/messages.po` / `locales/en/messages.po` - extracted + translated 5 new msgids (eyebrow, rail title, empty-state title/body/CTA); "All" reuses the existing 05-06 msgid

## Decisions Made
- `selectNextFestival` is implemented as `orderFestivalsForHome(...)[0]` (a first-item projection of the SAME ordering used for the rail) rather than a separately-derived selection, so hero and rail can never disagree on order.
- The no-upcoming fallback and every remaining tie use an explicit `localeCompare(name, 'en', { sensitivity: 'base', numeric: true })` then `id` — never the runtime's default ICU locale (which is non-deterministic across devices) and never input array order.
- `noopSave()` is a shared no-op passed as `FestivalCard`'s required `onSave` prop for every hero/rail card — these are always `saved={true}` rows with no Save affordance to wire, but the component's prop contract still requires a handler.
- Rail item width (268px) matches the design mockup's `OverviewScreen` rail card width (`docs/concept/designs/festival/festipal-screens.jsx` line 175) for visual fidelity; the "Alle" see-all link color uses `colors.primary` matching the mockup's `--text-link: var(--green-400)` token.

## Deviations from Plan

None — plan executed exactly as written for both tasks. Lingui extraction + DE translation (not explicitly listed in the plan's `<verify>` block) followed the same pattern established by 05-04/05-06 as a necessary part of shipping new user-facing copy.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The `(tabs)` shell (Home + Festivals) is now functionally complete for the visitor's core loop: land on Home, see the next festival, enter it or any saved festival, or browse all festivals from an empty state.
- On-device UAT (D2/D3 above) is still required before Phase 5 ships — same class of gap already tracked for prior Phase 5 plans; the plan's own manual `<verify>` step names the exact check (hero+rail render, tap enters, empty state opens Alle).
- `orderFestivalsForHome` is reusable by any future screen that needs the same "next festival" ordering (e.g. a future Timetable/notifications surface) without re-deriving the rules.

## Self-Check: PASSED

- FOUND: apps/mobile/lib/select-next-festival.ts
- FOUND: apps/mobile/lib/__tests__/select-next-festival.test.ts
- FOUND: apps/mobile/app/(tabs)/home.tsx
- FOUND commit: f4d3d8e
- FOUND commit: 63a1bcc

---
*Phase: 05-festival-selection-home*
*Completed: 2026-08-06*
