---
phase: 09-festival-navigation-shell
plan: 06
subsystem: ui
tags: [expo-router, react-native, react-native-webview, security-sandbox, lingui]

# Dependency graph
requires:
  - phase: 09-04
    provides: "AppHeader / useHeaderClearance(), lib/app-chrome.ts's PUSH_SCREEN_ROUTES/resolveHeaderContext — this plan registers cashless as a fourth root-level push screen following the profil/friends-qr/friends-find pattern"
  - phase: 09-05
    provides: "StatTile (icon+label eyebrow, value/note row, tone, trailing slot), the Dashboard tile-row style (flexDirection:row, sp-5 gap, flex:1 tiles) — this plan's Cashless tile is the row's SECOND tile and is the first consumer of StatTile's previously-unused trailing prop"
provides:
  - "lib/cashless-url.ts's resolveCashlessTarget — a pure, framework-free HTTPS-only address validator (ADR-011/T-09-23), origin/host derivation for WebView sandboxing"
  - "app/cashless.tsx — the full-bleed, origin-locked Cashless WebView push screen (ADR-011): no native balance element, no booking list, no pay QR, no browser chrome"
  - "The Cashless Dashboard StatTile — tone=\"brand\", hard-omitted when the festival has no cashless address, no value (real balance lives behind the embedded page)"
affects: []

# Actuals (#2632) — pairs with the plan's estimate to calibrate future estimates.
actuals:
  tokens: 6900
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: ["react-native-webview@13.16.1"]
  patterns:
    - "A route param is never trusted as pre-validated, even when the only caller in the codebase always passes a validated value — app/cashless.tsx re-runs resolveCashlessTarget on its own received param exactly as the Dashboard tile does before rendering the tile at all, because a route param is a mutable value a caller controls, not an internal value the callee can assume clean (T-09-23)."
    - "WebView sandboxing to a single configured origin is TWO independent locks, not one: originWhitelist (covers reload/redirect) plus onShouldStartLoadWithRequest doing its own origin comparison (covers in-page navigation) — neither alone is the whole ADR-011 boundary."
    - "A conditional Dashboard tile resolves from an ALREADY-fetched value (festival.cashlessUrl, read via useFestivalContext()) rather than a second query — the same 'read from the already-resolved context, never re-fetch' rule 09-03's device-bug fix established for the festival gate."

key-files:
  created:
    - apps/mobile/lib/cashless-url.ts
    - apps/mobile/lib/__tests__/cashless-url.test.ts
    - apps/mobile/app/cashless.tsx
  modified:
    - apps/mobile/app/_layout.tsx
    - apps/mobile/lib/app-chrome.ts
    - apps/mobile/lib/__tests__/app-chrome.test.ts
    - apps/mobile/components/AppHeader.tsx
    - apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po
    - apps/mobile/package.json

key-decisions:
  - "Package-legitimacy checkpoint (T-09-SC) resolved 'approved' by the user via AskUserQuestion, backed by orchestrator-verified registry.npmjs.org evidence: exact name react-native-webview, latest 14.0.1 (SDK-57-compatible 13.16.1 selected by `expo install`), repo react-native-webview/react-native-webview, maintainers react-native-community-bot/salakar/titozzz/jamonholmgren, runtime deps limited to exactly invariant@2.2.4 + escape-string-regexp@^4.0.0 (no network/telemetry package), MIT license, 4,190,092 downloads/week (Aug 3-9 2026). Installed via `npx expo install react-native-webview` (not `pnpm add`) from `apps/mobile`, with no Metro/Expo watcher running (port 8081 was occupied by the NestJS API server, not Metro — verified before install)."
  - "react-native-webview's TypeScript event types (ShouldStartLoadRequest) are NOT re-exported from the package's top-level index — only the `WebView` component itself is. Imported the type from the documented subpath `react-native-webview/lib/WebViewTypes` instead (no `exports` restriction in the package's own package.json, confirmed by reading it directly)."
  - "This RN/TypeScript version's StyleSheet type defs expose `StyleSheet.absoluteFill` (a registered style id) but not `StyleSheet.absoluteFillObject` — the loading/error overlay uses explicit `position:'absolute', top/left/right/bottom:0` instead of the object-spread shorthand the plan's own action text sketched."
  - "Typed routes for the new `/cashless` route needed the same `npx expo customize tsconfig.json` regeneration step 09-05 already used for `/friends-find` (regenerates `.expo/types/router.d.ts` without starting the dev server) — a build-tool step, not a code change; `.expo/` stays gitignored."
  - "Cashless tile placed LEFT of the Crew tile (Flagged Assumption 3 in the plan: the primary action first) — a Planner-level default, easy to reorder in UAT if it reads wrong."
  - "The validated `uri` is passed to `app/cashless.tsx` as a route param rather than re-deriving the festival from a slug at that screen — the plan's own Flagged Assumption 1, taken as written since the screen is a root-level sibling of the festival group with no local param scope of its own, and the screen still re-validates the value regardless (T-09-23)."

patterns-established:
  - "Sandboxed single-origin WebView: originWhitelist=[origin] + onShouldStartLoadWithRequest doing its own URL().origin comparison, ref-based reload() for retry, no injectedJavaScript/onMessage — the template for any future embedded-page integration in this app (ADR-011's own wording: 'kein natives Guthaben-Element' generalizes to 'the app supplies the frame, never composes the destination page')."

requirements-completed: [NAV-01]

coverage:
  - id: D1
    description: "resolveCashlessTarget accepts only HTTPS addresses with a non-empty host, rejects null/undefined/empty/whitespace/http/javascript:/file:/data:/the app's own custom scheme/hostless-https/unparsable strings (never throwing), and normalizes two addresses with the same host but different paths to the same origin — the whole T-09-23 mitigation"
    requirement: "NAV-01"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/cashless-url.test.ts — 14 cases, one per <behavior> line in 09-06-PLAN.md Task 1"
        status: pass
    human_judgment: false
  - id: D2
    description: "app/cashless.tsx renders a full-bleed WebView sandboxed to the configured origin via originWhitelist + onShouldStartLoadWithRequest (T-09-22), sets neither injectedJavaScript nor onMessage (T-09-24), shows the project-wide loading/error+retry pattern (retry reloads via ref, never leaves the screen), and re-validates its own route param before rendering anything (T-09-23) — with no native balance element, booking list, pay QR or browser chrome anywhere on the screen (ADR-011)"
    requirement: "NAV-01"
    verification:
      - kind: other
        ref: "cd apps/mobile && pnpm exec vitest run && pnpm typecheck && pnpm lint && pnpm exec lingui compile --strict — 285/285 tests, exit 0/0/0/0; grep confirms no injectedJavaScript/onMessage in app/cashless.tsx"
        status: pass
      - kind: manual_procedural
        ref: "09-06-PLAN.md Task 2 <human-check> (8 device points: two tiles vs. one, WebView opens full-bleed under header, foreign-origin navigation blocked in-page and externally, offline error+in-place retry, absence of all four ADR-011-excluded elements, blank-but-successful load leaves a reachable-Back empty frame) — NOT run on device this session, recorded as WINDOWS.md #46"
        status: unknown
    human_judgment: true
    rationale: "No RN component-test harness exists in this project (STATE.md, structural limitation) — WebView sandbox behavior (blocked cross-origin navigation, native-vs-web load failures) and visual truths (no double header, header clearance) need a real device and, critically, a native rebuild this session did not run (no device attached)."
  - id: D3
    description: "The Dashboard's Cashless StatTile (tone=\"brand\", Wallet icon, trailing ArrowRight, no value) renders ONLY when resolveCashlessTarget(festival.cashlessUrl) resolves — hard omission otherwise, no dampened/inert substitute; resolves from the already-fetched festival context, independent of the Crew tile's own friends query"
    requirement: "NAV-01"
    verification:
      - kind: other
        ref: "cd apps/mobile && pnpm exec vitest run && pnpm typecheck && pnpm lint — exit 0/0/0; grep confirms the tile is the sole consumer inside `{cashlessTarget ? ... : null}` with no else branch, and that StatTile receives no `value`/`note` prop for it"
        status: pass
      - kind: manual_procedural
        ref: "09-06-PLAN.md Task 2 <human-check> points 1-2 (two tiles with an address, exactly one without — no attrappe) — NOT run on device this session, recorded as WINDOWS.md #46"
        status: unknown
    human_judgment: true
    rationale: "Whether the row visually renders as two flex:1 tiles vs. one cleanly-filling tile, in both light and dark mode, is a screen-level visual truth this project only verifies on a real device (same structural limitation as D2)."

# Metrics
duration: ~55min
completed: 2026-08-14
status: complete
---

# Phase 9 Plan 6: Cashless Summary

**Cashless ships exactly as ADR-011 allows: a hard-omitted-unless-configured Dashboard entry pushing a full-bleed WebView locked to its own configured origin, with `react-native-webview` cleared through a manual package-legitimacy gate before install.**

## Performance

- **Duration:** ~55 min across 2 tasks (incl. the blocking package-legitimacy checkpoint)
- **Tasks:** 2/2 (Task 1 `tdd="true"`)
- **Files touched:** 12 unique files across 2 commits (`lingui compile` also regenerates gitignored `.js` catalogs, not committed)

## Accomplishments

- `lib/cashless-url.ts`'s `resolveCashlessTarget` — a pure, framework-free HTTPS-only address validator: `null`/`undefined`/empty/whitespace → `null`; only `https:` with a non-empty host is accepted (rejects `http:`, `javascript:`, `file:`, `data:`, the app's own `quiks:` scheme, and hostless `https://`, all via the built-in `URL` parser inside a `try`/`catch` so no input can throw); two addresses differing only by path resolve to the same `origin`. 14/14 test cases, one per `<behavior>` line.
- `app/cashless.tsx` — the Cashless push screen: full-bleed `react-native-webview` `WebView` below `AppHeader`'s push state, sandboxed to the configured origin via `originWhitelist=[origin]` **and** `onShouldStartLoadWithRequest` doing its own origin comparison (T-09-22, two independent locks). Re-validates its own route param before rendering anything (T-09-23) — a tampered param falls back to the same error copy as a load failure, minus the retry. No `injectedJavaScript`, no `onMessage` (T-09-24). Loading/error+retry states reuse the project's existing centered copy pattern; retry reloads the WebView via ref, never leaves the screen.
- Registered as a fourth root-level push screen (`app/_layout.tsx`, `headerShown:false`), added to `lib/app-chrome.ts`'s `PUSH_SCREEN_ROUTES`/`PushScreenRoute` and `AppHeader`'s push-title map (reuses the `Cashless` msgid, not a new string).
- The Dashboard's second `StatTile`, LEFT of Crew: `tone="brand"` (the tab's one accent surface), `Wallet` icon, no value — a trailing 14px `ArrowRight` in `colors.textMuted` signals "tap to open" without implying a balance. Renders exclusively inside `{cashlessTarget ? ... : null}`, no else branch — a missing address means the tile does not exist, not that it exists inert. The two tiles resolve from independent sources (the already-resolved festival context vs. the friends query) and can never affect each other.
- Package legitimacy: `react-native-webview@13.16.1` cleared through the mandatory manual gate (T-09-SC, no `RESEARCH.md` this phase) — the user approved after seeing registry evidence the orchestrator verified directly against `registry.npmjs.org` (see Decisions). Installed via `npx expo install`, not `pnpm add`, with no Metro/Expo watcher running.

## Task Commits

1. **Task 1: Package, pure address validation, the Cashless screen** — `265b11d` (feat)
2. **Task 2: Dashboard Cashless tile + i18n** — `d7565ef` (feat)

**Plan metadata:** _pending — this SUMMARY's own commit_

## Files Created/Modified

- `apps/mobile/lib/cashless-url.ts` (new) — `resolveCashlessTarget`
- `apps/mobile/lib/__tests__/cashless-url.test.ts` (new) — 14 cases
- `apps/mobile/app/cashless.tsx` (new) — the WebView push screen
- `apps/mobile/app/_layout.tsx` — `cashless` `Stack.Screen` registration (`headerShown:false`)
- `apps/mobile/lib/app-chrome.ts` — `cashless` added to `PUSH_SCREEN_ROUTES`/`PushScreenRoute`
- `apps/mobile/lib/__tests__/app-chrome.test.ts` — new case for the `cashless` push route
- `apps/mobile/components/AppHeader.tsx` — `cashless` added to the push-title map (`Cashless`)
- `apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx` — Cashless `StatTile` added to the tile row
- `apps/mobile/locales/{de,en}/messages.po` — two new msgid/msgstr pairs (WebView loading/error copy); `Cashless` msgid reused unchanged
- `apps/mobile/package.json` + `pnpm-lock.yaml` — `react-native-webview@13.16.1` added

## Decisions Made

See `key-decisions` in the frontmatter for full reasoning. In short: the package-legitimacy checkpoint was approved with orchestrator-verified npm registry evidence (exact package, MIT, ~4.19M weekly downloads, a two-package dependency tree, maintained by the `react-native-webview` org); `react-native-webview`'s TypeScript types live at a subpath (`react-native-webview/lib/WebViewTypes`), not the package root; this RN version's `StyleSheet` types expose `absoluteFill` but not `absoluteFillObject`, so the overlay uses explicit positioning; typed routes needed the same `npx expo customize tsconfig.json` regeneration step 09-05 already established; the Cashless tile sits left of Crew (primary action first, easy to reorder); the validated `uri` travels as a route param, re-validated on arrival regardless of who's calling.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `react-native-webview`'s event types are not re-exported from its package root**
- **Found during:** Task 1 typecheck
- **Issue:** `import { WebView, type ShouldStartLoadRequest } from 'react-native-webview'` failed — the package's `lib/index.d.ts` only re-exports `WebView` itself (default + named), not its `WebViewTypes` module.
- **Fix:** Imported `ShouldStartLoadRequest` from the documented subpath `react-native-webview/lib/WebViewTypes` (confirmed unrestricted by the package's own `package.json`, which has no `exports` field).
- **Files modified:** `apps/mobile/app/cashless.tsx`
- **Commit:** `265b11d`

**2. [Rule 3 - Blocking] `StyleSheet.absoluteFillObject` does not exist in this project's installed React Native type defs**
- **Found during:** Task 1 typecheck
- **Issue:** The plan's own action text sketched an `...StyleSheet.absoluteFillObject` overlay style; this RN version's `StyleSheet.d.ts` only exports `absoluteFill` (a registered style ID, not a spreadable object).
- **Fix:** Replaced with explicit `position:'absolute', top:0, left:0, right:0, bottom:0` in the overlay style.
- **Files modified:** `apps/mobile/app/cashless.tsx`
- **Commit:** `265b11d`

**3. [Rule 3 - Blocking] Typed routes needed regeneration for the new `/cashless` route**
- **Found during:** Task 2 typecheck (`router.push({ pathname: '/cashless', ... })` type error)
- **Issue:** Expo Router's typed-routes declaration file (`.expo/types/router.d.ts`) had not regenerated for the newly created route — the same gap 09-05 hit for `/friends-find`.
- **Fix:** `npx expo customize tsconfig.json` (Expo's documented no-dev-server regeneration path). Not a code defect — `.expo/` is gitignored.
- **Files modified:** none (build artifact only)
- **Commit:** N/A

---

**Total deviations:** 3 auto-fixed (all Rule 3 — blocking type/build issues, none behavioral). No scope creep; all three were necessary for the plan's own stated acceptance criteria (`pnpm typecheck` exit 0) to hold.

## Issues Encountered

- The Task 2 8-point `<human-check>` device verification did not run this session — no device was attached, and `react-native-webview` requires a native rebuild (`npx expo run:android` from `apps/mobile`, never the repo root) before the module exists in the installed APK. Per this project's established precedent (09-03/09-04/09-05 SUMMARYs), the plan was completed to its automated-verification gate and the device checkpoint recorded as an open `unrun-verify` entry (WINDOWS.md #46) rather than blocking completion. This is the one plan in the phase carrying `T-09-26` (DoS via a missing rebuild) as an accepted-and-tracked risk until that rebuild happens.

## User Setup Required

**A native rebuild is required before any device testing of this plan's work.** `react-native-webview` ships native (Android/iOS) code that is not present in the currently-installed development APK.

1. Stop any running Metro/Expo watcher.
2. From `apps/mobile` (never the repo root — a root-level run creates a stale `android/` directory with the old package name): `npx expo run:android`.
3. Only then run the Task 2 `<human-check>` block (8 points, `09-06-PLAN.md`) against a real device, in both light and dark mode.

This mirrors the exact precedent Phase 8 set for `expo-camera` (`08-SECURITY.md` `T-08-SC` entries) and Phase 6 set for `@react-native-community/datetimepicker`.

## Known Stubs

None — this plan replaces the last remaining Dashboard gap (Cashless) with real, functioning code; nothing here is a placeholder pending a future plan.

## Threat Flags

None beyond the plan's own pre-declared threat register (`09-06-PLAN.md` T-09-SC, T-09-22 through T-09-27), all mitigated as specified:
- T-09-SC (unaudited native package) — the blocking human checkpoint, approved with orchestrator-verified registry evidence (see Decisions).
- T-09-22 (cross-origin WebView navigation) — `originWhitelist` + `onShouldStartLoadWithRequest`'s own origin comparison, two independent locks.
- T-09-23 (non-HTTPS/manipulated address) — `resolveCashlessTarget` is HTTPS-only with a non-empty-host requirement, applied BEFORE the tile exists and AGAIN inside the screen against its own route param.
- T-09-24 (data exchange with the foreign page) — no `injectedJavaScript`, no `onMessage`; the app reads nothing out of the page and writes nothing in.
- T-09-25 (payment/card data) — no native balance element, booking list or pay QR exists anywhere in this plan's code (ADR-011).
- T-09-26 (missing native rebuild) — recorded as `user_setup` above and as WINDOWS.md #46; this session's DoS-by-omission risk is tracked, not silently accepted.
- T-09-27 (inert Cashless placeholder) — the tile is a hard omission (`{cashlessTarget ? ... : null}`, no else branch) when the address is absent.

## Next Phase Readiness

- NAV-01 is now fully delivered end to end: the five-tab festival navigator (09-03), the app-wide header (09-04), the Friends tab (09-05) and Cashless (this plan) are all real, registered, working surfaces — no remaining Dashboard gap.
- Phase 9 (Festival Navigation Shell) has no further plans; this is Wave 5 of 5, the last plan of the phase.
- Outstanding before Phase 9 is fully device-verified: this plan's own Task 2 8-point `<human-check>` (WINDOWS.md #46) plus the phase's other still-open device checkpoints (#40, #42, #43, #44, #45) — all require, at minimum, the native rebuild this plan's `user_setup` calls for. A single `npx expo run:android` from `apps/mobile` covers the rebuild need for every one of them, since `expo-camera` (Phase 8) and now `react-native-webview` are both already in `package.json`.
- Phase 10 (Activities Backend) can proceed independently — it does not depend on this plan's WebView work.

---
*Phase: 09-festival-navigation-shell*
*Completed: 2026-08-14*

## Self-Check: PASSED

- FOUND: `apps/mobile/lib/cashless-url.ts`
- FOUND: `apps/mobile/lib/__tests__/cashless-url.test.ts`
- FOUND: `apps/mobile/app/cashless.tsx`
- FOUND: `apps/mobile/app/_layout.tsx`
- FOUND: `apps/mobile/lib/app-chrome.ts`
- FOUND: `apps/mobile/components/AppHeader.tsx`
- FOUND: `apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx`
- FOUND: commit `265b11d`
- FOUND: commit `d7565ef`
