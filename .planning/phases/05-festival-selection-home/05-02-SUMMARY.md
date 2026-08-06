---
phase: 05-festival-selection-home
plan: 02
subsystem: design-tokens-and-mobile-scaffolding
tags: [tokens, design-system, expo-blur, typed-routes, foundation]
dependency_graph:
  requires: []
  provides:
    - packages/ui radiiScale export (r-card/r-md/r-pill)
    - packages/ui borderSubtle/borderBrand/fillQuiet/fillBrandQuiet/glassFill/glassBorder color roles
    - apps/mobile expo-blur dependency (SDK-57 train)
    - apps/mobile experiments.typedRoutes enabled
  affects:
    - FestivalCard, SegmentedControl, ComingSoonTile, FloatingNav (later 05-* plans)
tech_stack:
  added:
    - expo-blur ~57.0.2 (apps/mobile)
  patterns:
    - radiiScale export mirrors the existing spacingScale export shape, aggregated into the public `tokens` object
    - typed routes cast pattern for runtime-constructed hrefs (`as Href`) established in app/_layout.tsx
key_files:
  created: []
  modified:
    - packages/ui/src/tokens.ts
    - apps/mobile/package.json
    - apps/mobile/app.json
    - pnpm-lock.yaml
    - apps/mobile/app/_layout.tsx
decisions:
  - "radiiScale added as its own export (mirroring spacingScale) and wired into the public tokens aggregate object, not merged into the existing generic radii object (UI-SPEC + REVIEW 05-02 MEDIUM)."
  - "glassFill/glassBorder/borderBrand/fillBrandQuiet kept identical dark/light via object-spread inheritance in lightColors (nav stays dark-glass in both schemes, per UI-SPEC); only borderSubtle/fillQuiet needed explicit light overrides."
  - "expo-blur installed via `expo install` (not manual pnpm add + version edit) so the SDK-57-compatible version and lockfile update happen atomically (REVIEW 05-02 LOW)."
  - "Fixed a typedRoutes-caused typecheck break in app/_layout.tsx: the deep-link replay effect passes a runtime-parsed string to router.replace, which typedRoutes now rejects; cast to Href with an inline comment explaining why this one call is intentionally dynamic (Rule 3 — blocking issue directly caused by this task's own change)."
metrics:
  duration: ~10min
  completed: 2026-08-06
status: complete
actuals:
  tokens: 1150
  tasks: 2
  commits: 2
---

# Phase 5 Plan 02: Design Tokens Extension + expo-blur + Typed Routes Summary

Extended the shared `packages/ui` token file with a real `radiiScale` export and six translucent
border/fill/glass color roles, then installed `expo-blur` (SDK-57 train) into `apps/mobile` and
enabled `experiments.typedRoutes` so the phase's later route restructure fails at compile time
instead of at runtime.

## What Was Built

**Task 1 — `packages/ui/src/tokens.ts`:**
- New `radiiScale` export (`'r-card': 22`, `'r-md': 16`, `'r-pill': 999`), added to the public
  `tokens` aggregate object so `tokens.radiiScale['r-card']` resolves.
- Six new color roles on both `colors` (dark) and `lightColors`: `borderSubtle`, `borderBrand`,
  `fillQuiet`, `fillBrandQuiet`, `glassFill`, `glassBorder` — exact values from UI-SPEC ## Color,
  cross-checked against `docs/concept/designs/festival/festipal-tokens.css`.
- Existing `spacingScale`/`typeRoles`/`layout`/`radii` exports untouched (extend-only).
- Verified: `pnpm --filter @festipal/ui typecheck && pnpm --filter @festipal/ui build` — both pass.

**Task 2 — `apps/mobile` dependency + config:**
- `expo-blur@~57.0.2` installed via `pnpm --filter @festipal/mobile exec expo install expo-blur`
  (one operation updated both `package.json` and the root `pnpm-lock.yaml`).
- `experiments.typedRoutes: true` added to `apps/mobile/app.json`'s `expo` object; existing
  `plugins` array left unchanged.
- Regenerated `.expo/types/router.d.ts` by starting `expo start`, waiting for the file to be
  written, then stopping the dev server cleanly (`taskkill` on the resolved Expo CLI PID) before
  trusting the typecheck as a route safety net.
- Verified: the plan's assertion script (expo-blur pin format, typedRoutes flag,
  `.expo/types/router.d.ts` existence) plus `pnpm --filter @festipal/mobile typecheck` — both pass.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] typedRoutes broke `app/_layout.tsx`'s deep-link replay**
- **Found during:** Task 2's final typecheck verification.
- **Issue:** `router.replace(href)` in the post-login deep-link replay effect passed a plain
  `string` (from `consumePendingDestination()`, itself built from `Linking.parse()` at runtime).
  With `typedRoutes` enabled, `expo-router`'s generated `Href` union rejects bare strings that
  aren't statically-known route literals, so `tsc` failed with `TS2345`.
- **Fix:** Imported `type Href` from `expo-router` and cast the one dynamic call site
  (`router.replace(href as Href)`), with an inline comment explaining this is the intentionally
  dynamic exception — every other route reference in the app stays a plain string literal that
  typedRoutes now validates.
- **Files modified:** `apps/mobile/app/_layout.tsx`
- **Commit:** 56eff99 (bundled into Task 2's commit — the fix was required for Task 2's own
  `<verify>` to pass)

No other deviations — plan executed as written otherwise.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust-boundary surface introduced; `expo-blur` was
already covered by the plan's own threat register (T-05-SC, RESEARCH-verified, no checkpoint
required).

## Self-Check: PASSED

- `packages/ui/src/tokens.ts` — FOUND
- `apps/mobile/package.json` — FOUND
- `apps/mobile/app.json` — FOUND
- `pnpm-lock.yaml` — FOUND
- `apps/mobile/app/_layout.tsx` — FOUND
- Commit `43b9004` — FOUND
- Commit `56eff99` — FOUND
