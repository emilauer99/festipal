---
phase: 05-festival-selection-home
plan: 10
subsystem: mobile-navigation
tags: [expo-router, expo-linking, deep-linking, react-native, gap-closure]

# Dependency graph
requires:
  - phase: 05-festival-selection-home
    provides: app/_layout.tsx deep-link capture/redirect effects (04-06/05-02/05-05), pending-destination.ts consume-once singleton, 05-UAT.md gap findings
provides:
  - "lib/deep-link.ts — pure reconstructDeepLinkRoute(parsed, appScheme) unit-tested over all three URL forms"
  - "Custom-scheme deep links (festipal://f/:slug and festipal:///f/:slug) both resolve to the correct f/:slug route instead of losing the 'f/' segment"
  - "Deep-link capture is auth-agnostic — an already-authenticated cold start captures and honors the link, beating the persisted active-festival slug"
affects: [festival-selection-home, home-shell-navigation]

# Actuals (#2632)
actuals:
  tokens: 2745
  tasks: 2
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure route-reconstruction helper (no React/expo-linking import) unit-tested in the node-env Vitest runner, mirroring lib/select-next-festival.ts's pure-fn shape"

key-files:
  created:
    - apps/mobile/lib/deep-link.ts
    - apps/mobile/lib/__tests__/deep-link.test.ts
  modified:
    - apps/mobile/app/_layout.tsx

key-decisions:
  - "G-05-7: hostname is rejoined into the route ONLY when parsed.scheme matches the app's own custom scheme (Constants.expoConfig?.scheme, 'festipal' fallback) — an https (or any other) scheme's hostname is always treated as a real domain and never prepended"
  - "G-05-7b: removed the authState.status === 'unauthenticated' gate from the capture effect entirely (capture now fires for any linkingUrl); the content-leak boundary (T-05-10-E) is preserved unchanged at the redirect effect, which only ever replays after the guard independently reaches 'authenticated'"

requirements-completed: [FEST-04]

coverage:
  - id: D1
    description: "festipal://f/:slug (double-slash), festipal:///f/:slug (triple-slash), and https://<domain>/f/:slug all reconstruct to the identical f/:slug route"
    requirement: "FEST-04"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/deep-link.test.ts — 8/8 cases (double-slash, triple-slash, https, auth-path both forms, root, appScheme parameterization x2)"
        status: pass
    human_judgment: true
    rationale: "The pure reconstructor is fully unit-tested, but the end-to-end OS-delivered deep-link -> app navigation flow (05-UAT.md test 7a) requires a real device to fire an actual festipal:// URL and observe the app open the correct festival. Logged to WINDOWS.md as unrun-verify."
  - id: D2
    description: "A deep link fired while already authenticated is captured and opens the linked festival, beating the persisted active-festival slug; the logged-out precedence still works unmodified"
    requirement: "FEST-04"
    verification: []
    human_judgment: true
    rationale: "Requires a real device cold-start/warm-start cycle (both logged-out and already-authenticated) to observe the redirect effect's replay winning over getActiveFestivalSlug(); not exercisable from the node-env Vitest runner. Logged to WINDOWS.md as unrun-verify (05-UAT.md test 7)."

duration: ~10min
completed: 2026-08-09
status: complete
---

# Phase 05 Plan 10: Deep-Link Gap Closure Summary

**Pure `reconstructDeepLinkRoute` helper fixes the dropped 'f/' segment on `festipal://f/:slug` (G-05-7), and an auth-agnostic capture effect makes an already-authenticated deep link beat the persisted active-festival slug (G-05-7b).**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments

- New `apps/mobile/lib/deep-link.ts` pure, framework-free `reconstructDeepLinkRoute(parsed, appScheme)` — rejoins `hostname`+`path` only for the app's own custom scheme (the root cause of G-05-7: `expo-linking`'s `new URL()`-based parser puts the first path segment of a double-slash custom-scheme URL into `hostname`, not `path`), leaves `https`/other-scheme hostnames untouched (they are real domains), and returns `null` for a bare root link.
- 8/8 unit tests in `apps/mobile/lib/__tests__/deep-link.test.ts` cover all three URL forms plus auth-path normalization, the root case, and appScheme parameterization (proving the scheme check isn't hardcoded to `'festipal'`).
- `app/_layout.tsx`'s deep-link capture effect now calls `reconstructDeepLinkRoute(Linking.parse(linkingUrl), appScheme)` (scheme resolved from `Constants.expoConfig?.scheme` with a `'festipal'` fallback) instead of consuming `Linking.parse`'s `path` alone.
- The capture effect's guard changed from `!linkingUrl || authState.status !== 'unauthenticated'` to just `!linkingUrl` — capture now fires regardless of auth status, so an already-authenticated cold start captures the incoming link too, and the (unchanged) redirect effect replays it before ever reading the persisted active-festival slug (G-05-7b).
- Inline comments updated to document that the content-leak boundary (T-05-10-E) is preserved at replay time (redirect effect only fires after the guard independently reaches `'authenticated'`) and by the unchanged `AUTH_FLOW_PATHS` guard — not by the removed capture-time auth gate.

## Task Commits

Each task was committed atomically:

1. **Task 1 (G-05-7): pure deep-link route reconstructor + unit test**
   - `2167fb0` (test) — failing spec for `reconstructDeepLinkRoute` (RED)
   - `9dfaf5f` (feat) — implementation, 8/8 tests pass (GREEN)
2. **Task 2 (G-05-7 + G-05-7b): wire the reconstructor into an auth-agnostic capture effect** - `bb9b2aa` (fix)

## Files Created/Modified

- `apps/mobile/lib/deep-link.ts` - pure `reconstructDeepLinkRoute` route reconstructor (new)
- `apps/mobile/lib/__tests__/deep-link.test.ts` - unit spec, 8 cases covering all three URL forms + edge cases (new)
- `apps/mobile/app/_layout.tsx` - capture effect uses the reconstructor and fires regardless of auth status; comments updated to document the G-05-7b content-leak boundary rationale

## Decisions Made

- G-05-7: scoped the hostname-rejoin check to `parsed.scheme === appScheme` (a parameter, not a hardcoded literal) — verified by a dedicated test using a non-default custom scheme, matching the plan's explicit requirement.
- G-05-7b: left the redirect effect, `coldStartRedirectRef` one-shot, and persisted-slug fallback completely untouched, per the plan's explicit "do NOT change" instruction — the confirmed-working logged-out precedence carries no risk of regression since only the capture effect's guard changed.
- Used `Constants.expoConfig?.scheme` (normalized `string | string[] | undefined` to a single string, `'festipal'` fallback) to resolve the app's own scheme at runtime instead of hardcoding the literal, keeping `_layout.tsx` in sync with `app.json`'s `expo.scheme` if it ever changes (per app.json's own `_comment` note).

## Deviations from Plan

None — plan executed exactly as written. Both tasks followed the plan's specified root-cause fixes and file scope; no architectural changes, no new dependencies.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Next Phase Readiness

- `typecheck`, `lint`, and the full mobile Vitest suite (`8 files / 64 tests`) are green after both fixes.
- The plan's `<human-check>` verification step (05-UAT.md test 7: logged-out double-slash deep link, and already-authenticated cold-start deep link, both against the seeded second festival `nova-sound-2026`) requires a real device and was NOT run headlessly — logged to `.planning/WINDOWS.md` as unrun-verify entries for the `/gsd-verify-work 5` resume.
- Sibling gap-closure plan `05-09` (gaps G-05-2/5a/5b) completed earlier on this branch with no file overlap with this plan's changes.
- This was the last incomplete plan in phase 05 (10/10 plans now executed) — phase is ready for `/gsd-verify-work 5`, `/gsd-secure-phase 5`, and `/gsd-ship 5` per the outstanding gap-closure sequence.

## Self-Check: PASSED

All 3 created/modified files verified present on disk; all 3 commits (2167fb0, 9dfaf5f, bb9b2aa) verified present in git log.

---
*Phase: 05-festival-selection-home*
*Completed: 2026-08-09*
