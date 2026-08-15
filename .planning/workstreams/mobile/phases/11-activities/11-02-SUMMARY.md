---
phase: 11-activities
plan: 02
subsystem: mobile-native
tags: [expo-location, native-module, package-legitimacy-gate, geo-link, D-14]

requires:
  - phase: 10-activities-backend
    provides: "activityGeoSchema (activityDetailSchema.geo) — the two range-validated numeric fields buildRouteUri consumes"
provides:
  - "expo-location native dependency, installed and configured foreground-only, rebuilt on device"
  - "buildRouteUri(geo, platform) — pure map-handoff URI builder, no free-text input possible by signature"
  - "T-11-SC package-legitimacy precedent for expo-location, plus T-11-01..T-11-05 threat dispositions recorded in the phase's 11-SECURITY.md"
affects: [11-03, 11-04, 11-05]

actuals:
  tokens: 4400
  tasks: 3
  commits: 3

tech-stack:
  added:
    - "expo-location@~57.0.10"
  patterns:
    - "Native-module plugin config must be checked against the plugin's own source, not assumed from the option name — expo-location's withLocation.ts fills 'Always' iOS usage descriptions with generic default text unless explicitly suppressed with `false`, even when only `locationWhenInUsePermission` is intended"
    - "Locale-independent, non-scientific-notation number-to-string formatting for any coordinate/URI-building pure fn: try `toString()`, fall back to `toFixed(20)` + trailing-zero trim only when the plain form would be exponential"

key-files:
  created:
    - apps/mobile/lib/geo-link.ts
    - apps/mobile/lib/__tests__/geo-link.test.ts
    - .planning/workstreams/mobile/phases/11-activities/11-SECURITY.md
  modified:
    - apps/mobile/package.json
    - pnpm-lock.yaml
    - pnpm-workspace.yaml
    - apps/mobile/app.json

key-decisions:
  - "app.json's expo-location plugin sets locationWhenInUsePermission (our no-tracking rationale) AND explicitly sets locationAlwaysAndWhenInUsePermission: false / locationAlwaysPermission: false — found via node_modules/expo-location/plugin/src/withLocation.ts that the plugin's own createPermissionsPlugin call fills all three iOS usage-description keys with generic default text unless a key is explicitly given a string or `false`; leaving the two 'Always' keys unset would have silently added iOS background-capable usage descriptions we never asked for and never use, violating the plan's no-background-permission-key requirement"
  - "T-11-SC evidence (package name, publisher/maintainer set, repository, resolved SDK-57 version, direct dependency tree) was gathered via `npm view` against the live npm registry and committed to 11-SECURITY.md BEFORE the checkpoint was presented and BEFORE any install command ran, per the plan's required commit ordering"
  - "11-SECURITY.md was created with status: draft (not verified) — this file accumulates entries across all of Phase 11's plans; final sign-off is deferred to /gsd-secure-phase at phase close, matching how 09-SECURITY.md/10-SECURITY.md were only marked verified once their whole phase closed"
  - "formatCoordinate() falls back from toString() to toFixed(20)+trim only when the plain form is exponential, rather than always using toFixed — preserves the natural, unpadded decimal representation for the overwhelming majority of real coordinates while still guaranteeing no scientific notation for the many-decimal-places edge case"

patterns-established:
  - "Package-legitimacy evidence for a new native module is gathered via `npm view <pkg> versions/repository.url/maintainers/dependencies/dist-tags --json` against the live registry, written to the phase's *-SECURITY.md, and committed BEFORE the checkpoint is presented to the human and BEFORE any install runs — same shape as T-08-SC/T-09-SC, now proven a third time for T-11-SC"

requirements-completed: [ACT-05]

coverage:
  - id: D1
    description: "expo-location is installed in apps/mobile and app.json's plugin block carries a permission rationale naming the one-off nature of the capture (D-13)"
    requirement: ACT-05
    verification:
      - kind: automated
        ref: "node -e app.json plugin-presence + no-background-substring check (Task 2 acceptance)"
        status: pass
      - kind: automated
        ref: "node -e package.json dependency-presence check (Task 2 acceptance)"
        status: pass
    human_judgment: false
  - id: D2
    description: "expo-location's package legitimacy was hand-verified (publisher, repo, exact name, dependency tree) before install and recorded as T-11-SC in 11-SECURITY.md — same gate expo-camera/react-native-webview passed"
    requirement: ACT-05
    verification:
      - kind: manual
        ref: "checkpoint:human-verify Task 1 — user response 'approved', 2026-08-15"
        status: pass
    human_judgment: true
    rationale: "Package-legitimacy is a blocking-human gate by design (never auto-approved, even in auto mode) — the plan requires an explicit human confirmation, not an automated proxy."
  - id: D3
    description: "A native rebuild landed on the test device before any plan checks the location capability on-device"
    requirement: ACT-05
    verification:
      - kind: manual
        ref: "checkpoint:human-action (Task 2 human-check) — user response 'done', 2026-08-15: rebuild landed, app runs, Activities tab still loads"
        status: pass
    human_judgment: true
    rationale: "The native rebuild is explicitly a human step on Windows (never an executor step, per this project's established Phase 8/9 precedent) — only on-device confirmation proves it."
  - id: D4
    description: "buildRouteUri produces a geo: URI on Android and an Apple Maps HTTPS URL on iOS, built only from the two numeric ActivityGeo fields (D-14)"
    requirement: ACT-05
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/geo-link.test.ts (platform branches, sign combinations, boundary values, zero point, decimal formatting)"
        status: pass
    human_judgment: false
  - id: D5
    description: "buildRouteUri's signature has no string parameter that could carry free text, a deep-link value, or a WebView-read value into the URI (T-11-01)"
    requirement: ACT-05
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/geo-link.test.ts#determinism / no free-text input (T-11-01 invariant)"
        status: pass
      - kind: static
        ref: "apps/mobile/lib/geo-link.ts — signature is (geo: ActivityGeo, platform: MapHandoffPlatform); TypeScript compilation is the structural proof no third parameter can exist"
        status: pass
    human_judgment: false

duration: ~25min active work (task commits span 14:44-14:54; excludes wait time for the two human checkpoints)
completed: 2026-08-15
status: complete
---

# Phase 11 Plan 02: Native Location Delivery + Map-Handoff URI Summary

**`expo-location` cleared its package-legitimacy gate, installed and configured foreground-only, rebuilt on device — plus `buildRouteUri`, the phase's most security-relevant construction, hardened by signature rather than caller discipline (D-14, T-11-01).**

## Performance

- **Duration:** ~25min active work across three commits (14:44-14:54); the plan itself spanned two human checkpoints (package-legitimacy approval, native-rebuild confirmation), which are not counted as executor work time.
- **Started:** 2026-08-15 (checkpoint evidence-gathering)
- **Completed:** 2026-08-15T14:54:14+02:00
- **Tasks:** 3 (1 checkpoint, 2 auto)
- **Files modified:** 7

## Accomplishments

- **T-11-SC package-legitimacy gate cleared**: evidence for `expo-location` (exact name, Expo-org publisher/maintainer set, official `expo/expo` repository, MIT license, SDK-57-compatible `57.0.10` resolved version, single direct dependency `@expo/image-utils@^0.11.4`) gathered via live `npm view` queries and committed to `11-SECURITY.md` *before* the checkpoint was presented and *before* any install command ran. User approved with "approved".
- **`expo-location@~57.0.10` installed** via `npx expo install expo-location` from `apps/mobile` (never the repo root), after stopping two stale Expo/Metro processes from a prior session that would otherwise have raced the install (documented Windows pitfall).
- **`app.json` plugin entry configured foreground-only**: `locationWhenInUsePermission` carries the no-tracking, one-off rationale; `locationAlwaysAndWhenInUsePermission` and `locationAlwaysPermission` are explicitly set to `false` — discovered via the plugin's own source that its defaults otherwise silently add generic "Always" iOS usage-description text regardless of configuration. No Android background/foreground-service permission key exists in the config at all.
- **`buildRouteUri(geo, platform)`** (`apps/mobile/lib/geo-link.ts`): pure, framework-free URI builder — `geo:{lat},{lng}` on Android, `https://maps.apple.com/?ll={lat},{lng}` on iOS — built only from `ActivityGeo`'s two contract-validated numeric fields. The signature itself is the hardening: no `string` parameter exists through which free text, a deep-link value, or a WebView-read value could ever reach the URI. 15 unit tests cover both platforms, all four sign combinations, all four contract boundary values (±90 lat, ±180 lng), the zero point (proven not to fall through a truthy check), many-decimal-place formatting (no scientific notation, no locale comma), and determinism.
- **Native rebuild landed on device**: `npx expo run:android` from `apps/mobile`, confirmed by the user — app runs, Activities tab still loads (11-01 unaffected).
- **`11-SECURITY.md` created** for the phase (first plan to touch it): full Trust Boundaries + Threat Register for this plan's five threats (T-11-SC, T-11-01..T-11-05), the T-11-SC evidence block, and an Accepted Risks entry for T-11-04 (OS/system-chooser decides which map app opens the URI). Left `status: draft` — later Phase 11 plans append their own entries; final sign-off happens at phase close via `/gsd-secure-phase`.

## Task Commits

Each task was committed atomically:

1. **T-11-SC evidence (prerequisite for Task 2, committed before install per required ordering)** - `2b4df27` (docs)
2. **Task 2: `expo-location` installieren, Berechtigungs-Begründung setzen** - `76d02f7` (feat)
3. **Task 3: `buildRouteUri` als reiner Karten-Handoff-Builder samt Spec** - `cc752b5` (feat)

Task 1 (the package-legitimacy checkpoint) produced no commit of its own — it is the human-verify gate that authorized Task 2's install.

**Plan metadata:** committed alongside this SUMMARY (see final commit below).

## Files Created/Modified

- `apps/mobile/lib/geo-link.ts` - `buildRouteUri`, `MapHandoffPlatform`, `formatCoordinate` (internal)
- `apps/mobile/lib/__tests__/geo-link.test.ts` - 15 unit tests
- `.planning/workstreams/mobile/phases/11-activities/11-SECURITY.md` - phase security register, first plan's entries + T-11-SC evidence
- `apps/mobile/app.json` - `expo-location` plugin entry
- `apps/mobile/package.json` - `expo-location` dependency
- `pnpm-lock.yaml` - resolved `expo-location@57.0.10` and its dependency tree
- `pnpm-workspace.yaml` - `minimumReleaseAgeExclude: [expo-location@57.0.10]` (pnpm's own supply-chain policy, added automatically by the installer)

## Decisions Made

- `locationAlwaysAndWhenInUsePermission: false` and `locationAlwaysPermission: false` were added deliberately, beyond what a naive reading of the plan's action text implied — the plugin's source (`node_modules/expo-location/plugin/src/withLocation.ts`) showed that `createPermissionsPlugin` fills every one of its four managed Info.plist keys with generic default text unless the caller explicitly supplies a string or `false`. Only setting `locationWhenInUsePermission` would have left the two "Always" keys defaulted to boilerplate "Allow $(PRODUCT_NAME) to use your location" text neither reviewed nor intended — a background-capability-adjacent permission key the plan's `must_haves.truths` explicitly prohibits.
- `11-SECURITY.md` was written as a phase-level file (not plan-scoped) carrying `status: draft`, mirroring how `09-SECURITY.md`/`10-SECURITY.md` only reached `status: verified` once their entire phase closed. Later Phase 11 plans (11-03..11-05) will append their own threat entries to this same file rather than creating separate per-plan security files.
- `formatCoordinate()` uses `toString()` as the default path and only falls back to `toFixed(20)` + trailing-zero trim when the plain form would render in scientific notation — this keeps ordinary coordinates (the overwhelming majority) in their natural, unpadded decimal form while still guaranteeing the many-decimal-place edge case never emits exponential notation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Stopped two stale Expo/Metro processes before install**
- **Found during:** Task 2, precondition check
- **Issue:** A `start --port 8083` process (from 14.08) and a `run:android` process (from 15.08 00:37) were both still running for this repo from an earlier session — the plan's own precondition names this exact known Windows ENOENT race (`pnpm install` fails scanning a `*_tmp_*/node_modules` path while a watcher holds a handle).
- **Fix:** Terminated both process trees (`taskkill /F /T`) before running `npx expo install expo-location`.
- **Files modified:** None (process-level, not code)
- **Verification:** Install completed cleanly afterward with no ENOENT.
- **Committed in:** N/A (no code change)

**2. [Rule 3 - Blocking issue] Bypassed `pnpm <script>` wrapper for verification, invoked tools directly**
- **Found during:** Task 2/3 verification
- **Issue:** Every `pnpm typecheck`/`pnpm lint`/`pnpm install` invocation in this repo triggered pnpm's automatic deps-status-check, which failed with `ERR_PNPM_ENOENT` on `node_modules/@better-auth/core` — confirmed via a manual `mv` test to be a live external lock (`Permission denied` renaming the directory), consistent with this project's documented `windows-directory-rename-eperm` pitfall (a JetBrains VFS watcher — `jetbrainsd.exe` was running — holds a handle on an unrelated package's directory). This is unrelated to `expo-location` or any code from this plan; the directory in question (`@better-auth/core`) was never touched by this plan.
- **Fix:** Ran `npx tsc --noEmit -p tsconfig.json`, `npx eslint .`, and `npx vitest run` directly, bypassing the wrapper's pre-check. All passed cleanly (0 type errors, 0 lint errors, 339/339 tests), confirming the dependency tree installed by `npx expo install` was already correct and complete — the blocker is specific to pnpm's own auto-repair heuristic, not to the actual installed state.
- **Files modified:** None (verification method only)
- **Verification:** `tsc` exit 0, `eslint` exit 0, `vitest run` 339/339 passed, run twice across Task 2 and Task 3 checkpoints.
- **Committed in:** N/A (no code change)

---

**Total deviations:** 2 auto-fixed (both Rule 3 — environmental/tooling blockers, no code changes)
**Impact on plan:** None on scope or deliverables; both are documented for the user's awareness since they may recur on this machine.

## Issues Encountered

- An initial `NoRouteToHostException` on-device fetch error during the human's rebuild/verification step turned out to be a phone-to-dev-machine LAN reachability issue (the API is healthy at `http://192.168.68.115:8081/api/v1/health`), resolved by the user on the device-network side. Not implicated by anything in this plan's code — recorded here per the user's request for the record.
- For anyone resuming work in this repo on this machine: the API dev watcher (`nest start --watch`) now runs on 8081 and Metro from `run:android` sits on 8082 (per the user's confirmation) — the `start --port 8083` instance from the earlier session was the one this plan stopped and did not restart.

## User Setup Required

None beyond the two checkpoints already resolved (package-legitimacy approval, native rebuild) — both are complete.

## Next Phase Readiness

- `expo-location` is installed, configured foreground-only, and proven on-device — 11-04 (which the plan's `must_haves.truths` names explicitly) can build the "Standort anheften" capture flow on top of this without repeating the install/rebuild cycle.
- `buildRouteUri` is ready for 11-05's "Route öffnen" affordance on the activity detail screen — it takes `activity.geo` (already contract-bounded) and the platform, nothing else.
- `.planning/workstreams/mobile/phases/11-activities/11-SECURITY.md` now exists as the phase's shared security register; 11-03/11-04/11-05 append their own threat entries to it rather than creating new files.
- **Two environmental Windows notes carried forward** (not blockers for 11-03, but relevant if they recur): stale Expo/Metro processes from a prior session can linger and race `pnpm install`; a JetBrains VFS lock on `node_modules/@better-auth/core` currently blocks every `pnpm <script>` wrapper invocation in this repo (direct `npx tsc`/`npx eslint`/`npx vitest` remain a reliable bypass).
- No blockers for 11-03.

---
*Phase: 11-activities*
*Completed: 2026-08-15*

## Self-Check: PASSED

All 4 plan-produced/modified files central to this plan (geo-link.ts, geo-link.test.ts, 11-SECURITY.md,
app.json) confirmed on disk. All three commits (2b4df27, 76d02f7, cc752b5) confirmed present in `git log`.
