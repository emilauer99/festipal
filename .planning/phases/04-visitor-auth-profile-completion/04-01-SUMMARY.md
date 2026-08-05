---
phase: 04-visitor-auth-profile-completion
plan: 01
subsystem: infra
tags: [expo, react-native, mmkv, nitro-modules, expo-image-picker, expo-font, google-fonts, lucide, react-native-svg, vitest, testing]

# Dependency graph
requires:
  - phase: 03-visitor-shell
    provides: Expo mobile app shell (expo ~57.0.9, expo-router, expo-secure-store session store, lib/i18n bootstrap wrapper)
provides:
  - Ten new UI/native mobile deps installed together (expo-image-picker, expo-image, react-native-mmkv + react-native-nitro-modules peer, lucide-react-native, react-native-svg, expo-font, three @expo-google-fonts families)
  - expo-image-picker config plugin in app.json with photos/camera permission strings
  - Vitest runner for apps/mobile (node environment, pure lib/ scope) — the Wave-0 test-framework gap is closed
  - lib/fonts.ts non-blocking font module (useAppFonts hook + FONT_DISPLAY/FONT_BODY/FONT_MONO + resolveFontFamily)
affects: [04-02 otp-restyle, 04-03 profile-completion, 04-04 username-suggestion, 04-05 avatar-mmkv-pipeline, mapOtpError test, generateUsernameSuggestion test]

# Actuals (#2632)
actuals:
  tokens: 2300
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: [expo-image-picker, expo-image, react-native-mmkv, react-native-nitro-modules, lucide-react-native, react-native-svg, expo-font, "@expo-google-fonts/outfit", "@expo-google-fonts/plus-jakarta-sans", "@expo-google-fonts/jetbrains-mono", vitest]
  patterns: ["Lazy RN require inside a hook so the pure module surface stays node-importable for Vitest", "Non-blocking font contract: fontsLoaded gates only fontFamily resolution, never splash-hide"]

key-files:
  created: [apps/mobile/vitest.config.ts, apps/mobile/lib/fonts.ts, apps/mobile/lib/__tests__/fonts.test.ts]
  modified: [apps/mobile/package.json, apps/mobile/app.json, pnpm-lock.yaml]

key-decisions:
  - "MMKV v4 + its mandatory react-native-nitro-modules peer installed in one pnpm add command (Pitfall 3)"
  - "Font-family constants map to concrete Google-Font weight keys (Outfit_700Bold / PlusJakartaSans_400Regular / JetBrainsMono_400Regular), registered under the same keys in useAppFonts"
  - "RN-only modules (expo-font, @expo-google-fonts/*) are lazily required inside useAppFonts so lib/fonts.ts imports cleanly under node-environment Vitest"
  - "expo-image-picker permission strings authored in English (Info.plist/AndroidManifest strings, not Lingui UI copy) — store localization handled later"

patterns-established:
  - "Non-blocking font loading (Pitfall 5 / D-04): resolveFontFamily(name, loaded) returns the family once loaded, else undefined (RN system-font fallback); never a return-null / splash-hide gate"
  - "apps/mobile Vitest scope: lib/**/__tests__/**/*.test.ts pure functions only, node environment, no jest-expo / no RN component rendering"

requirements-completed: [AUTH-05, IDN-01]

coverage:
  - id: D1
    description: "apps/mobile Vitest runner runs and exits 0 against node-environment pure-function tests"
    requirement: AUTH-05
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/fonts.test.ts (4 tests via `pnpm --filter @festipal/mobile test`)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Non-blocking font module: FONT_DISPLAY/FONT_BODY/FONT_MONO constants + resolveFontFamily fallback contract"
    requirement: IDN-01
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/fonts.test.ts#resolveFontFamily (non-blocking contract, Pitfall 5 / D-04)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Five new native-module deps autolink after a fresh native prebuild without a TurboModule/Nitro not-found crash; dev build cold-starts to the Festivals list"
    verification:
      - kind: manual_procedural
        ref: "Real Android dev build cold-start smoke (requires physical device / emulator — not runnable in this headless executor)"
        status: unknown
    human_judgment: true
    rationale: "Native autolinking correctness can only be observed on a real dev build; the headless executor cannot boot an Android runtime. typecheck confirms the JS/TS surface resolves, but the module-not-found class of failure surfaces only at native runtime."

# Metrics
duration: 8min
completed: 2026-08-05
status: complete
---

# Phase 4 Plan 01: Wave-0 Foundation (deps + Vitest runner + font module) Summary

**Installed ten Phase-4 UI/native deps (image picker/display, MMKV+Nitro, Lucide+SVG, Google Fonts) in one command, stood up the missing apps/mobile Vitest runner, and shipped a non-blocking font module — pure enabling infrastructure for the OTP/profile restyle and avatar pipeline.**

## Performance

- **Duration:** ~8 min active (excluding the blocking-human legitimacy checkpoint wait)
- **Started:** 2026-08-05T08:48:00Z
- **Completed:** 2026-08-05T08:55:48Z
- **Tasks:** 3 (Task 1 = blocking-human checkpoint, approved by human; Tasks 2–3 = code)
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments
- Installed all ten new deps + the mandatory NitroModules peer in a single `pnpm add` command (MMKV v4 requires the peer, Pitfall 3), with SDK-57-locked Expo packages resolving to their matching minors
- Added the `expo-image-picker` config plugin to `app.json` with photos/camera permission strings
- Stood up the first-ever Vitest runner in `apps/mobile` (node environment, scoped to pure `lib/` tests) — closing the RESEARCH/VALIDATION Wave-0 gap
- Shipped `lib/fonts.ts` implementing the non-blocking font contract (D-04 / Pitfall 5): `resolveFontFamily` falls back to the RN system font until fonts load, and nothing gates splash-hide or a `return null` on font readiness
- 4/4 font unit tests green; `typecheck` and `lint` clean for `@festipal/mobile`

## Task Commits

1. **Task 1: Package legitimacy sign-off** — no commit (blocking-human `checkpoint:decision`; human approved all five `[SUS] too-new` packages against npmjs.com — confirmed false positive of the freshness heuristic)
2. **Task 2: Install five dep groups + image-picker config plugin** — `1954ac3` (feat)
3. **Task 3: Vitest runner + non-blocking font module** — `8b032f8` (feat)

**Plan metadata:** committed with this SUMMARY (docs)

## Files Created/Modified
- `apps/mobile/vitest.config.ts` (created) — node-environment Vitest config, scoped to `lib/**/__tests__/**/*.test.ts`, mirrors the apps/api shape
- `apps/mobile/lib/fonts.ts` (created) — `useAppFonts()` hook (lazy RN require), `FONT_DISPLAY`/`FONT_BODY`/`FONT_MONO` constants, pure `resolveFontFamily` fallback helper
- `apps/mobile/lib/__tests__/fonts.test.ts` (created) — 4 tests: font-family literals + non-blocking fallback contract
- `apps/mobile/package.json` (modified) — ten new deps + NitroModules peer, `vitest` devDep, `"test": "vitest run"` script
- `apps/mobile/app.json` (modified) — `expo-image-picker` config plugin with permission strings
- `pnpm-lock.yaml` (modified) — dependency graph updates

## Decisions Made
- **Font constants → concrete weight keys.** `FONT_DISPLAY='Outfit_700Bold'`, `FONT_BODY='PlusJakartaSans_400Regular'`, `FONT_MONO='JetBrainsMono_400Regular'` — each is registered under the same key in `useAppFonts`, so the constant is directly usable as a `fontFamily`. Later plans can add more weights (SemiBold/Medium already loaded) as needed.
- **Lazy RN require.** `expo-font` and the `@expo-google-fonts/*` packages `require('*.ttf')`, which node/Vitest cannot resolve. Requiring them inside `useAppFonts` (with an ambient `require` declaration and typed casts — no `any` at any boundary) keeps `lib/fonts.ts` node-importable so the pure surface is unit-testable off-device.
- **English permission strings.** The image-picker `photosPermission`/`cameraPermission` strings are Info.plist/AndroidManifest values, not Lingui UI copy — store localization is handled later (per the plan's Task 2 note).

## Deviations from Plan

None — plan executed exactly as written. No auto-fix rules were triggered. (The one typecheck error hit during Task 3 — `noUncheckedIndexedAccess` widening the Google-Font `require` results to `number | undefined` — was resolved within the same task before its commit by typing the requires with explicit non-optional shapes; this was in-task iteration, not an unplanned deviation.)

## Issues Encountered
- **Typecheck failure on first pass of Task 3:** casting the lazy `require` results to `Record<string, number>` produced `number | undefined` under `noUncheckedIndexedAccess`, which `useFonts`' `FontSource` map rejects. Resolved by casting each require to an explicit interface listing the exact exported weight keys as non-optional `number`. Fixed before the Task 3 commit; `typecheck` and `lint` both exit 0.

## User Setup Required
None — no external service configuration required. (The plan's `user_setup` item — stopping every Expo/Metro process before install to avoid the Windows Metro × pnpm ENOENT race — was pre-satisfied: the coordinator confirmed Metro/Expo was stopped, and the install completed cleanly.)

## Next Phase Readiness
- **Ready:** icons (Lucide + SVG), image picker/display, MMKV storage layer, Google Fonts, and a green mobile Vitest runner are all in place — unblocking 04-02 (OTP restyle), 04-04 (`generateUsernameSuggestion` test), and 04-05 (MMKV avatar pipeline).
- **Deferred manual verification (D3):** the real-Android dev-build cold-start smoke that proves the new native modules autolinked (no Nitro/TurboModule not-found crash) could NOT be run in this headless executor. `typecheck` confirms the JS/TS surface resolves, but native autolinking must be confirmed on a device/emulator before the avatar pipeline (04-05) is exercised. A native prebuild + cold-start is required.
- **Boundary reminder for 04-05:** MMKV is introduced here but must be wired ONLY to the avatar URI — the session token stays on SecureStore (Pitfall 2 boundary; threat T-4-01-I).

## Self-Check: PASSED

All created files present (vitest.config.ts, lib/fonts.ts, lib/__tests__/fonts.test.ts, 04-01-SUMMARY.md); both task commits (1954ac3, 8b032f8) exist in git history.

---
*Phase: 04-visitor-auth-profile-completion*
*Completed: 2026-08-05*
