---
phase: 03-mobile-app-shell-i18n-foundation
plan: 05
subsystem: mobile
tags: [expo-router, tanstack-query, ts-rest, lingui, festivals]

# Dependency graph
requires:
  - phase: 03-mobile-app-shell-i18n-foundation
    provides: "03-03: lib/api-client.ts (apiClient.listFestivals/saveFestival, cookie-forwarding), app/_layout.tsx four-state guard gating 'festivals'/'(festival)'"
  - phase: 03-mobile-app-shell-i18n-foundation
    provides: "03-04: real i18n catalog loading (lib/i18n.ts) so this plan's screens genuinely render German text on non-DE/EN devices"
provides:
  - "festivals/index.tsx — real GET /festivals list (TanStack Query + apiClient.listFestivals), idempotent Save (apiClient.saveFestival), gate-less Enter navigating to (festival)"
  - "(festival)/index.tsx — minimal localized home placeholder with a no-dead-end link back to festivals"
affects: ["03-06 (on-device UAT exercises the real seeded-festival render, Save->my_festival persistence, and gate-less Enter this plan wires but cannot verify without a device/live API)"]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Per-session local Set<festivalId> tracks Save state client-side (no second listMyFestivals query this phase) — Save is idempotent server-side so re-tapping an already-saved row is harmless even without this tracking; the Set only drives the CTA's disabled styling", "Dynamic/user content (festival.name from the API) rendered as a plain JS expression outside any Lingui macro, per the established project principle that user/data content is never translated (only UI chrome is)"]

key-files:
  created:
    - apps/mobile/app/festivals/_layout.tsx
    - apps/mobile/app/festivals/index.tsx
    - apps/mobile/app/(festival)/_layout.tsx
    - apps/mobile/app/(festival)/index.tsx
  modified:
    - apps/mobile/locales/en/messages.po
    - apps/mobile/locales/de/messages.po

key-decisions:
  - "Save-state is tracked client-side per session (a local Set<string> of festivalIds saved this session), not via a second listMyFestivals() query — saveFestival is idempotent server-side (ADR-014), so this is purely a CTA-disabling UX nicety, not a correctness requirement; querying listMyFestivals to restore saved-state across app restarts was out of this plan's declared scope (no truth/acceptance-criterion requires it)."
  - "German translations for 'Save' and 'Enter festival' use the binding concept terms found in docs/concept/04-domain-identity.md §5 verbatim — 'Speichern' (not 'Merken', which the offline-matrix doc uses only as the mutation-queue action's internal name) and 'Festival betreten' (the doc's own quoted term for entry)."
  - "(festival)/index.tsx's placeholder copy (heading/body/back-link text) was Claude's Discretion per CONTEXT.md ('Placeholder screen content beyond the decided elements... keep unstyled and minimal') — UI-SPEC locks no specific copy for this screen, only that it be static-content and Lingui-wrapped."
  - "Enter navigates via router.push('/(festival)') with no festivalId param — the home placeholder isn't tied to a specific festival's master data yet (that's Phase 5 content), so no selected-festival state needs to be threaded through this navigation this phase."

requirements-completed: [PLAT-02, I18N-01]

coverage:
  - id: D1
    description: "festivals/index.tsx calls the real apiClient.listFestivals() via TanStack Query and renders the live seeded festival(s), with distinct localized loading/empty/error(load-failure)/error(network) states and no re-declared festival shape"
    requirement: PLAT-02
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint (no-literal-string active)"
        status: pass
      - kind: other
        ref: "grep-verified: no local interface/z.object mirrors festivalSchema; rows map over apiClient.listFestivals()'s typed body"
        status: pass
    human_judgment: true
    rationale: "Whether the screen actually renders the real seeded 'Frequency 2026' festival against the live local API (not just typechecks) is a runtime/device property this phase's own <verification> defers to Plan 06's on-device UAT."
  - id: D2
    description: "Save CTA calls apiClient.saveFestival (writes my_festival); Enter CTA navigates to (festival) unconditionally — no saved-state precondition anywhere in the client code"
    requirement: PLAT-02
    verification:
      - kind: other
        ref: "grep-verified: apiClient.saveFestival call site; handleEnter has no saved-state/status branch before router.push"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck && lint"
        status: pass
    human_judgment: true
    rationale: "Whether Save genuinely persists my_festival against the live DB and Enter genuinely lands the visitor on a working (festival) screen end-to-end is Plan 06's on-device UAT concern, same as D1."
  - id: D3
    description: "(festival)/index.tsx renders a Lingui-wrapped placeholder home with a working, localized link back to the festivals list (no dead-end); all new strings extracted and DE-translated"
    requirement: I18N-01
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck && lint"
        status: pass
      - kind: other
        ref: "pnpm --filter @festipal/mobile exec lingui extract && git diff --exit-code apps/mobile/locales"
        status: pass
      - kind: other
        ref: "pnpm exec expo export --platform android (1696 modules, both new screens bundle cleanly)"
        status: pass
    human_judgment: true
    rationale: "Whether a real device actually renders the German strings and the back-link is discoverable/usable is a visual/on-device UAT concern (same class as 03-04's D3), not provable by typecheck/lint/bundle alone."

duration: ~20 min
completed: 2026-08-03
status: complete
---

# Phase 3 Plan 5: Festivals List & Festival Home Placeholder Summary

**Real `GET /festivals` list (TanStack Query + the ts-rest client) with idempotent Save and gate-less Enter, landing on a minimal localized `(festival)` home placeholder that never dead-ends — closing the core-value entry path end-to-end.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-08-03T17:10:00Z (approx.)
- **Completed:** 2026-08-03T17:30:00Z (approx.)
- **Tasks:** 2
- **Files modified:** 6 (4 created, 2 modified)

## Accomplishments

- `festivals/index.tsx`: real `apiClient.listFestivals()` call via a TanStack Query `useQuery`, branching on `result.status` (200 → render rows; non-200 → localized "Can't load festivals… Retry"; thrown/network error → localized "Can't reach the server…"). Renders a plain vertical `FlatList` of rows, each showing the festival's real `name` (never re-declaring the `festivalSchema` shape) with a "Save" CTA (`apiClient.saveFestival`, per-session-disabled once saved) and an "Enter festival" CTA that navigates to `(festival)` with **no saved-state precondition** (gate-less, ADR-014).
- Loading ("Loading festivals…"), empty ("No festivals yet" / "Check back soon…"), and both error states are covered per the UI-SPEC's Copywriting Contract, each a distinct Lingui-wrapped string.
- `(festival)/index.tsx`: minimal placeholder home — a Lingui-wrapped heading + body, and a "Back to festivals" link (`router.push('/festivals')`) so the visitor is never at a dead-end. Deliberately does NOT build real festival master-data content (dates/place/overview) — that's Phase 5 (HOME-02), per D-01.
- 11 new message ids (8 for the festivals screen, 3 for the home placeholder) extracted via `lingui extract` and translated into German, reusing the binding concept terms from `docs/concept/04-domain-identity.md` §5 exactly: "Speichern" (Save) and "Festival betreten" (Enter festival).
- `expo export --platform android` bundles cleanly with both new screens (1696 modules, up from 1692 in 03-04's proof).

## Task Commits

Each task was committed atomically:

1. **Task 1: festivals list — real GET /festivals + Save + gate-less Enter** - `890df2e` (feat)
2. **Task 2: (festival) home placeholder — the landing screen after entry** - `2e34ab6` (feat)

## Files Created/Modified

- `apps/mobile/app/festivals/_layout.tsx` - plain Stack for the "festivals" group
- `apps/mobile/app/festivals/index.tsx` - real list/save/enter screen
- `apps/mobile/app/(festival)/_layout.tsx` - plain Stack for the "(festival)" group
- `apps/mobile/app/(festival)/index.tsx` - minimal localized home placeholder + back-link
- `apps/mobile/locales/en/messages.po` / `de/messages.po` - 11 new message ids, all German-translated

## Decisions Made

See `key-decisions` in frontmatter above for full rationale. In short: Save-state tracking is client-side/per-session only (saveFestival's own idempotency makes this a UX nicety, not a correctness need); German "Save"/"Enter festival" copy uses the binding concept-doc terms verbatim; the festival-home placeholder's exact copy was Claude's Discretion (UI-SPEC locks no specific copy for it); Enter carries no festivalId param since the home placeholder has no per-festival content yet.

## Deviations from Plan

None - plan executed exactly as written. Both tasks' declared file scope, acceptance criteria, and `<verify>` commands were implemented and passed without needing any auto-fixes, architectural changes, or scope additions.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The real render of the live seeded festival, Save→`my_festival` persistence, and gate-less Enter against a live device/API remain Plan 06's explicit on-device UAT scope, per this phase's own `<verification>` section.

## Next Phase Readiness

- The core-value entry path (auth → festivals list → Save/Enter → festival home) is now fully wired end-to-end in code; every route group this phase's ROADMAP declared (`(auth)`, `(profile-setup)`, `festivals`, `(festival)`) has a real, navigable, localized screen.
- No blockers for Plan 06. The real on-device proof of the full flow (live seeded "Frequency 2026" render, Save persisting to the DB, kill-and-relaunch, DE/EN device-locale switch across all screens) is Plan 06's explicit scope.

## Self-Check: PASSED

- FOUND: apps/mobile/app/festivals/_layout.tsx
- FOUND: apps/mobile/app/festivals/index.tsx
- FOUND: apps/mobile/app/(festival)/_layout.tsx
- FOUND: apps/mobile/app/(festival)/index.tsx
- FOUND commit: 890df2e
- FOUND commit: 2e34ab6
- Re-ran acceptance criteria: `pnpm --filter @festipal/mobile typecheck` (pass), `pnpm --filter @festipal/mobile lint` (pass, no-literal-string active), `lingui extract && git diff --exit-code apps/mobile/locales` (pass, clean against committed state), `pnpm typecheck` full workspace (9/9 tasks green), `expo export --platform android` (pass, 1696 modules)
- Grep-verified: no local interface/`z.object` mirrors `festivalSchema` in either new screen; `handleEnter` in `festivals/index.tsx` has no saved-state/status branch before `router.push`

---
*Phase: 03-mobile-app-shell-i18n-foundation*
*Completed: 2026-08-03*
