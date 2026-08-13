---
phase: 03-mobile-app-shell-i18n-foundation
plan: 02
subsystem: mobile
tags: [expo, expo-router, metro, pnpm-workspaces, lingui, i18n, eslint-plugin-i18next, vitest]

# Dependency graph
requires:
  - phase: 03-mobile-app-shell-i18n-foundation
    provides: "03-01: local docker-compose Postgres+Mailpit stack, Mailpit OTP transport, trustedOrigins whitelisting festipal:// / exp://"
provides:
  - "apps/mobile — a real, bundling Expo Router app (@festipal/mobile) proven to resolve @festipal/* workspace packages through Metro/pnpm"
  - "Lingui i18n pipeline: babel macro plugin, Metro .po transformer, real DE/EN catalogs, no-literal-string lint rule wired before any product screen"
  - "resolveUiLocale's uiFallback param (D-07) — locked by 6 vitest cases in packages/i18n"
affects: ["03-03 (auth screens will consume lib/i18n.ts, lib/query-client.ts, and extend eslint no-literal-string enforcement)", "03-04+ (festivals/festival-home screens, real catalog loading into the running app)"]

# Tech tracking
tech-stack:
  added: [expo@57.0.9, expo-router@57.0.9, "@better-auth/expo@1.6.25", expo-secure-store, expo-localization, expo-splash-screen, expo-constants, expo-linking, react-native-safe-area-context, react-native-screens, "@tanstack/react-query@5.101.4", "@lingui/core@6.6.0", "@lingui/react@6.6.0", "@lingui/babel-plugin-lingui-macro", "@lingui/cli", "@lingui/metro-transformer", "@lingui/format-po", eslint-plugin-i18next, babel-preset-expo, vitest (packages/i18n)]
  patterns: ["Metro pnpm workspace resolution via unstable_enableSymlinks + explicit watchFolders/nodeModulesPaths", "Lingui Metro transformer wired via transformer.babelTransformerPath (not a config-wrapper function)", "resolveUiLocale's uiFallback param for a UI-axis-specific default without touching the shared content-axis DEFAULT_LOCALE"]

key-files:
  created:
    - apps/mobile/package.json
    - apps/mobile/tsconfig.json
    - apps/mobile/app.json
    - apps/mobile/metro.config.js
    - apps/mobile/babel.config.js
    - apps/mobile/eslint.config.mjs
    - apps/mobile/lingui.config.ts
    - apps/mobile/.env.example
    - apps/mobile/app/_layout.tsx
    - apps/mobile/app/index.tsx
    - apps/mobile/lib/query-client.ts
    - apps/mobile/lib/i18n.ts
    - apps/mobile/locales/en/messages.po
    - apps/mobile/locales/de/messages.po
    - packages/i18n/src/resolve.test.ts
  modified:
    - packages/i18n/src/resolve.ts
    - packages/i18n/package.json
    - pnpm-lock.yaml

key-decisions:
  - "D-07 resolved as Option A: resolveUiLocale gains an optional uiFallback param (defaults to DEFAULT_LOCALE); the mobile app passes 'de' without changing the shared, content-axis DEFAULT_LOCALE='en' (ADR-012)."
  - "Lingui macro babel plugin (@lingui/babel-plugin-lingui-macro) and lingui.config.ts were created in Task 1, not deferred to Task 2 as originally planned — the tracer screen's <Trans> macro cannot bundle without them (blocking dependency discovered during execution)."
  - "@lingui/metro-transformer@6.6.0 wires in via transformer.babelTransformerPath, not the withLingui(config) wrapper RESEARCH.md cited — the installed version only exports a transform function for that config key."

patterns-established:
  - "Lingui catalog config: locales ['en','de'], sourceLocale 'en' (D-08), catalog path locales/{locale}/messages, PO formatter with lineNumbers: false."
  - "eslint-plugin-i18next's no-literal-string wired with framework: 'react', mode: 'jsx-text-only', 'Trans' excluded from jsx-components, RN testID/accessibility attrs added to jsx-attributes excludes, and an explicit words exclude for the 'festipal' brand name (never translated, D-04/UI-SPEC)."

requirements-completed: [PLAT-02, I18N-01]

coverage:
  - id: D1
    description: "apps/mobile Expo Router app scaffolded; Metro resolves @festipal/* workspace packages through pnpm's symlinked store at bundle time"
    requirement: PLAT-02
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/mobile typecheck"
        status: pass
      - kind: other
        ref: "pnpm --filter @festipal/mobile exec expo export --platform android (1412 modules bundled, no 'Unable to resolve module @festipal' line)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Tracer screen renders a real Lingui <Trans> macro and LOCALE_LABELS from @festipal/i18n — the first UI string in the repo is localized and lint-enforced from the first commit"
    requirement: I18N-01
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/mobile lint (no-literal-string active; manually verified it fires on an injected hardcoded string, then reverted)"
        status: pass
    human_judgment: true
    rationale: "Whether the tracer screen visually renders correctly (splash gate, wordmark, locale label) on a real device is a manual/UAT concern per this phase's VALIDATION architecture (no automated RN component test framework exists yet)."
  - id: D3
    description: "Real, non-stubbed DE/EN Lingui catalogs exist; lingui extract is idempotent (catalogs are current and committed)"
    requirement: I18N-01
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/mobile exec lingui extract && git diff --exit-code apps/mobile/locales"
        status: pass
    human_judgment: false
  - id: D4
    description: "resolveUiLocale's override/subtag-matching/order/empty-input/uiFallback (D-07) behavior is test-locked"
    requirement: I18N-01
    verification:
      - kind: unit
        ref: "packages/i18n/src/resolve.test.ts (6/6 passing) via pnpm --filter @festipal/i18n test"
        status: pass
    human_judgment: false

duration: 50min
completed: 2026-08-03
status: complete
---

# Phase 3 Plan 2: Mobile App Shell Scaffold & i18n Tracer Summary

**Scaffolded `apps/mobile` (Expo Router, RN New Arch) with Metro pnpm-workspace resolution proven via a clean `expo export`, plus a full Lingui i18n pipeline (real DE/EN catalogs, Metro `.po` transformer, `no-literal-string` lint) wired before any product screen exists.**

## Performance

- **Duration:** ~50 min
- **Started:** 2026-08-03T17:25:00+02:00 (approx.)
- **Completed:** 2026-08-03T18:14:00+02:00
- **Tasks:** 2
- **Files modified:** 21 (18 created, 3 modified, plus `pnpm-lock.yaml`)

## Accomplishments

- Scaffolded `apps/mobile` (`@festipal/mobile`) via `pnpm create expo-app` (blank-typescript, Expo SDK 57.0.9, RN 0.86.2), stripped of template artifacts (AGENTS.md/CLAUDE.md/LICENSE/App.tsx/index.ts), and rebuilt for Expo Router (`main: "expo-router/entry"`).
- `metro.config.js` resolves `@festipal/*` workspace packages through pnpm's symlinked `node_modules/.pnpm` store (`unstable_enableSymlinks` + explicit `watchFolders`/`nodeModulesPaths`) — proven with a real `expo export --platform android` that bundled 1412 modules with zero `Unable to resolve module @festipal` errors (Pitfall E closed).
- `app/_layout.tsx` holds the splash screen (`SplashScreen.preventAutoHideAsync`) until the device locale resolves via `expo-localization` + `resolveUiLocale`, then wraps the app in `QueryClientProvider` (no persistence, SC-4) and Lingui's `I18nProvider`.
- `app/index.tsx` (tracer screen) renders a real Lingui `<Trans>` macro and imports `LOCALE_LABELS` from `@festipal/i18n`, proving both the i18n pipeline and Metro's workspace-package resolution in one screen.
- `packages/i18n/src/resolve.ts`: `resolveUiLocale` gains an optional `uiFallback?: Locale` parameter (D-07, Option A) — the mobile app passes `uiFallback: 'de'` without touching the shared, content-axis `DEFAULT_LOCALE = 'en'` (ADR-012). Locked by 6 new vitest cases in `resolve.test.ts` (override, subtag matching, systemLocales order, empty-input default, `uiFallback` default, non-DE/EN → German).
- `eslint.config.mjs` wires `eslint-plugin-i18next`'s `no-literal-string` rule (`framework: 'react'`, `mode: 'jsx-text-only'`) — manually verified it actually fires (injected a hardcoded `<Text>` string, confirmed the lint error, reverted). `consistent-type-imports` stays enabled, unlike `apps/api`'s NestJS-specific override.
- Real (not stubbed) `locales/en/messages.po` and `locales/de/messages.po` produced via `lingui extract`, with the German translation ("Willkommen bei festipal") filled in; re-running `extract` produces no diff (catalogs are current).
- `app.json` sets `name`/`slug` `festipal`, `scheme: "festipal"`, iOS `bundleIdentifier` + Android `package` `at.festipal.app`, with a WORKING-TITLE note (D-05) recorded in the `extra` field (JSON has no comment syntax, so `extra._comment` carries the same intent as a code comment).
- Reused the workspace-pinned `typescript@6.0.3` and `better-auth@1.6.25` — no second version of either was introduced.

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold apps/mobile + Metro pnpm resolution + tracer screen** - `bb42053` (feat)
2. **Task 2: Lingui catalog tooling + no-literal-string lint + resolveUiLocale tests** - `785bd51` (feat)

## Files Created/Modified

- `apps/mobile/package.json` - `@festipal/mobile`, Expo/Lingui/TanStack Query deps, `dev`/`lint`/`typecheck`/`build`/`extract`/`compile` scripts (no `test` script — see Issues Encountered)
- `apps/mobile/tsconfig.json` - extends `@festipal/config/tsconfig.base.json`, adds `jsx: "react-native"`, `lib: ["ES2023","DOM"]`, no re-declared TS version
- `apps/mobile/app.json` - name/slug/scheme `festipal`, bundle id/package `at.festipal.app`, WORKING-TITLE note in `extra`
- `apps/mobile/metro.config.js` - pnpm symlink resolution + Lingui `.po` transformer via `transformer.babelTransformerPath`
- `apps/mobile/babel.config.js` - `babel-preset-expo` + `@lingui/babel-plugin-lingui-macro`
- `apps/mobile/eslint.config.mjs` - extends `@festipal/config/eslint`, adds `no-literal-string` (with a `festipal` brand-name exception)
- `apps/mobile/lingui.config.ts` - locales `['en','de']`, source `en`, `po` formatter
- `apps/mobile/.env.example` - `EXPO_PUBLIC_API_URL` LAN-IP placeholder (D-10)
- `apps/mobile/app/_layout.tsx` - splash gate + `QueryClientProvider` + `I18nProvider`
- `apps/mobile/app/index.tsx` - tracer screen (`<Trans>` macro + `LOCALE_LABELS`)
- `apps/mobile/lib/query-client.ts` - single `QueryClient`, no persistence
- `apps/mobile/lib/i18n.ts` - Lingui `i18n` instance + `activateUiLocale(systemLocales)`
- `apps/mobile/locales/{en,de}/messages.po` - real DE/EN catalogs
- `packages/i18n/src/resolve.ts` - `uiFallback` param added
- `packages/i18n/src/resolve.test.ts` - 6 behavior-locking tests
- `packages/i18n/package.json` - added `vitest` + `test` script

## Decisions Made

- **D-07 (RESEARCH Open Question 3):** Chose Option A — an optional `uiFallback?: Locale` parameter on `resolveUiLocale`, defaulting to the shared `DEFAULT_LOCALE`. Keeps the content-axis default (`'en'`, re-exported through `@festipal/contracts`) untouched while letting the mobile app apply a UI-axis-specific German fallback (D-07). An in-app locale switcher can reuse the existing `override` param additively later.
- Deferred **catalog *loading*** into the running `i18n` instance (`i18n.load(...)`) to a later plan: `lib/i18n.ts`'s `activateUiLocale` calls `i18n.activate(locale)` but no catalog is loaded yet, since this plan's own task scope never touches `lib/i18n.ts` after Task 1 and no real screen beyond the tracer exists to justify wiring it in now. The tracer's `<Trans>` macro therefore currently renders its English source text as a fallback regardless of the active locale — this is expected Lingui behavior with no catalog loaded, not a bug. See "Next Phase Readiness" below; this is the one piece of D-07's "must_haves.truths" (visible German fallback) that is NOT yet demonstrable and is tracked in `.planning/WINDOWS.md`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Lingui macro babel plugin + lingui.config.ts created in Task 1, not Task 2**
- **Found during:** Task 1 (`expo export` verification)
- **Issue:** The tracer screen imports `<Trans>` from `@lingui/react/macro`. Without the Lingui babel macro plugin registered, Metro tries to resolve that macro module's own internal `babel-plugin-macros` runtime dependency and fails to bundle (`Unable to resolve module babel-plugin-macros`). Once the babel plugin was added, bundling then failed a second time because the plugin reads `lingui.config.ts` at compile time to resolve the project's locales (`Error: No Lingui config found`).
- **Fix:** Added `@lingui/babel-plugin-lingui-macro` to `babel.config.js`'s plugins and created a minimal `lingui.config.ts` (`locales: ['en','de']`, `sourceLocale: 'en'`) already in Task 1, ahead of Task 2's originally-planned ownership of that file.
- **Files modified:** `apps/mobile/babel.config.js`, `apps/mobile/lingui.config.ts` (new), `apps/mobile/package.json`
- **Verification:** `expo export --platform android` bundles cleanly (1412 modules, no resolution errors).
- **Committed in:** `bb42053` (Task 1 commit)

**2. [Rule 3 - Blocking] `lingui.config.ts`'s `format: 'po'` string is no longer supported by the installed Lingui version**
- **Found during:** Task 1 (`expo export` verification, second bundling failure)
- **Issue:** Lingui 6.x removed the string-shorthand catalog formatter (`format: 'po'`); it must be a `formatter(...)` instance imported from a separate `@lingui/format-po` package.
- **Fix:** Added `@lingui/format-po` as a dependency and changed `lingui.config.ts` to `format: formatter({ lineNumbers: false })`.
- **Files modified:** `apps/mobile/lingui.config.ts`, `apps/mobile/package.json`
- **Verification:** `expo export --platform android` bundles cleanly.
- **Committed in:** `bb42053` (Task 1 commit)

**3. [Rule 1 - Bug] `@lingui/metro-transformer`'s `withLingui` config-wrapper does not exist in the installed version**
- **Found during:** Task 2 (re-verifying `expo export` after wiring the Metro `.po` transformer)
- **Issue:** RESEARCH.md's Pattern 4 cited `const { withLingui } = require('@lingui/metro-transformer/expo'); module.exports = withLingui(config);` — the installed `@lingui/metro-transformer@6.6.0` package only exports a `transform` function meant for `transformer.babelTransformerPath`, not a config-wrapper. This threw `TypeError: withLingui is not a function` at Metro startup.
- **Fix:** Changed `metro.config.js` to `config.transformer.babelTransformerPath = require.resolve('@lingui/metro-transformer/expo')` (this transform internally wraps Expo's own babel transformer and delegates non-`.po` files to it unchanged).
- **Files modified:** `apps/mobile/metro.config.js`
- **Verification:** `expo export --platform android` bundles cleanly (1412 modules) with the `.po` transformer active.
- **Committed in:** `785bd51` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1/3 — bugs or blocking issues discovered while making the plan's own stated `<verify>` commands actually pass). No architectural changes, no scope creep beyond what was necessary to make the tracer/catalog pipeline function as specified.
**Impact on plan:** All three were necessary corrections to library-integration details RESEARCH.md flagged as MEDIUM confidence (no Context7 access that session). The plan's specified acceptance criteria and file scope are otherwise implemented exactly as written.

## Issues Encountered

- No `test` script exists in `apps/mobile/package.json` — intentional, per the plan's own Wave 0 note and RESEARCH.md's Validation Architecture: this phase's mobile verification is `lint` + `typecheck` + manual/real-device UAT (kill-and-relaunch, DE/EN device-locale switch), not an automated RN component/integration suite. Detox/Maestro (named in CLAUDE.md's Tests list) are out of scope for this phase.
- Catalog *loading* into the running `i18n` instance (`i18n.load(...)`) is not yet wired — see "Decisions Made" above. Logged to `.planning/WINDOWS.md` as a `todo` so it's not silently forgotten before the phase's end-of-phase UAT, which needs it to demonstrate D-07's German-fallback truth on a real screen.

## User Setup Required

None - no external service configuration required. Developers running `pnpm --filter @festipal/mobile dev` will need Android Studio/`adb` (Windows) or Xcode (Mac) installed for `expo run:android`/`expo run:ios` per RESEARCH.md's Environment Availability table — not required for this plan's own verification (`typecheck`/`lint`/`expo export` all ran without a device or emulator).

## Next Phase Readiness

- `apps/mobile` bundles, resolves all `@festipal/*` workspace packages, and has a working Lingui + ESLint + catalog pipeline — Plan 03 (auth screens, `lib/auth-client.ts`, `lib/api-client.ts`) can build directly on `lib/i18n.ts`/`lib/query-client.ts`/`app/_layout.tsx` without re-deriving any of this scaffolding.
- Before a real device/UAT pass can demonstrate D-07's "German UI on a non-DE/EN device" truth, a later plan (03-03 or wherever the first real screens land) must wire `i18n.load({ en: enMessages, de: deMessages })` from the compiled catalogs into `lib/i18n.ts` (or an equivalent screen-level loader) — tracked in `.planning/WINDOWS.md`.
- No blockers for Plan 03.

## Self-Check: PASSED

- FOUND: apps/mobile/package.json
- FOUND: apps/mobile/app/_layout.tsx
- FOUND: apps/mobile/app/index.tsx
- FOUND: apps/mobile/metro.config.js
- FOUND: apps/mobile/lingui.config.ts
- FOUND: apps/mobile/locales/en/messages.po
- FOUND: apps/mobile/locales/de/messages.po
- FOUND: packages/i18n/src/resolve.test.ts
- FOUND commit: bb42053
- FOUND commit: 785bd51
- Re-ran acceptance criteria: `typecheck` (pass), `expo export --platform android` (pass, 0 `@festipal` resolution errors), `lint` (pass), `lingui extract && git diff --exit-code` (pass, clean), `pnpm --filter @festipal/i18n test` (6/6 pass)

---
*Phase: 03-mobile-app-shell-i18n-foundation*
*Completed: 2026-08-03*
