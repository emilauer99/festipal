---
phase: 03-mobile-app-shell-i18n-foundation
plan: 06
subsystem: infra
tags: [expo, expo-build-properties, react-native, android, ios, ats, cleartext-http, uat, i18n]

# Dependency graph
requires:
  - phase: 03-01
    provides: Expo app shell + app.json identity config
  - phase: 03-04
    provides: real email-OTP login flow + localized OTP error mapping
  - phase: 03-05
    provides: festivals list (real GET /festivals) + gate-less save→enter + festival home placeholder
provides:
  - Dev-build-only cleartext HTTP to the LAN API (Android usesCleartextTraffic + iOS NSAllowsLocalNetworking ATS exception)
  - On-device UAT sign-off of the full core-value path on real Android hardware
affects: [phase-04, mobile, eas-build, release-config]

# Actuals (#2632)
actuals:
  tokens: 4100
  tasks: 2
  commits: 5

# Tech tracking
tech-stack:
  added: [expo-build-properties]
  patterns:
    - "Dev-only native config guarded by a documented _comment field in app.json (JSON has no comment syntax)"
    - "Narrowly-scoped iOS ATS exception (NSAllowsLocalNetworking) over NSAllowsArbitraryLoads to keep public-internet ATS enforcement intact"

key-files:
  created: []
  modified:
    - apps/mobile/app.json
    - apps/mobile/package.json

key-decisions:
  - "iOS ATS: NSAllowsLocalNetworking (RFC1918/.local/loopback only), not NSAllowsArbitraryLoads — public-internet ATS stays enforced"
  - "Dev-cleartext allowance annotated dev-build-only via app.json _devOnlyCleartextComment; no EAS/release profile configured this phase (T-03-15 mitigation)"
  - "On-device UAT verified on real Android only; iOS deferred (Mac/Xcode toolchain not set up) — user-approved deviation"

patterns-established:
  - "Windows native-dev workarounds live in build config: pnpm hoisted node-linker + long-path config plugin + expo-network dep for @better-auth/expo"

requirements-completed: [PLAT-02, I18N-01]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Dev build permits cleartext HTTP to the LAN API on Android (usesCleartextTraffic) and iOS (NSAllowsLocalNetworking ATS exception), scoped dev-only with a documented comment; no release/EAS profile added."
    requirement: "PLAT-02"
    verification:
      - kind: automated_ui
        ref: "pnpm --filter @festipal/mobile typecheck"
        status: pass
      - kind: manual_procedural
        ref: "app.json plugins[expo-build-properties].android.usesCleartextTraffic=true + ios.infoPlist.NSAppTransportSecurity.NSAllowsLocalNetworking + _devOnlyCleartextComment"
        status: pass
    human_judgment: false
  - id: D2
    description: "Full core-value path on real hardware: cold-start no auth-flash → OTP login (Mailpit code) with localized errors → authenticated GET /festivals shows 'Frequency 2026' → save → gate-less enter → festival home → back; session survives force-quit-and-relaunch; UI localizes DE/EN with German fallback for a third device language."
    requirement: "I18N-01"
    verification:
      - kind: e2e
        ref: "manual on-device UAT — real Android device via `npx expo run:android` against local API over LAN (Mailpit OTP); all 6 checks passed (user sign-off 2026-08-03)"
        status: pass
    human_judgment: true
    rationale: "Success criteria (real OTP + kill-and-relaunch, real festival + save→enter, no auth-flash, DE/EN device-locale) are only confirmable on physical devices over LAN. Verified on Android; iOS device verification deferred (see Deviations)."

# Metrics
duration: ~3h35m (Task 1 build + extended on-device troubleshooting)
completed: 2026-08-03
status: complete
---

# Phase 3 Plan 06: Dev-Cleartext Config + On-Device UAT Summary

**expo-build-properties dev-only cleartext HTTP to the LAN API (Android + narrowly-scoped iOS ATS), then a full on-device UAT of the OTP → festival → save → enter → home path signed off on real Android hardware**

## Performance

- **Duration:** ~3h35m (19:25 → 23:00, dominated by Windows native-dev troubleshooting)
- **Started:** 2026-08-03T19:25:36+02:00
- **Completed:** 2026-08-03 (Android UAT sign-off)
- **Tasks:** 2 (1 auto, 1 blocking human-verify)
- **Files modified:** 2 (app.json, package.json) + lockfile

## Accomplishments
- Registered `expo-build-properties` and enabled `android.usesCleartextTraffic` so a dev build reaches `EXPO_PUBLIC_API_URL=http://<lan-ip>:8081`.
- Added a narrowly-scoped iOS ATS exception (`NSAllowsLocalNetworking`) rather than `NSAllowsArbitraryLoads`, keeping public-internet ATS enforcement intact.
- Guarded the whole allowance as DEV-BUILD-ONLY via a documented `_devOnlyCleartextComment` in app.json; no EAS/release profile configured this phase (T-03-14/T-03-15).
- Signed off the full core-value path on a real Android device: cold-start (no auth-flash) → OTP login (code from Mailpit, localized errors) → authenticated festivals list showing "Frequency 2026" → save → gate-less enter → festival home → back; session survived force-quit-and-relaunch; UI localized DE/EN with German fallback for a third device language.

## Task Commits

1. **Task 1: expo-build-properties — dev-only cleartext HTTP** — `5661f50` (feat)
2. **Task 2: On-device UAT** — no code commit (human-verify gate); supporting Windows-dev fixes below made the on-device build runnable:
   - `24a9e0e` (fix) — pnpm hoisted node-linker for Windows native builds
   - `e1a5ddc` (fix) — harden API integration tests against the UAT environment
   - `47134f1` (fix) — config plugin for Windows long-path native builds
   - `f304219` (fix) — add `expo-network` dep required by `@better-auth/expo`

## Files Created/Modified
- `apps/mobile/app.json` — `expo-build-properties` plugin block (android cleartext + iOS ATS) with dev-only comment
- `apps/mobile/package.json` — `expo-build-properties` (+ `expo-network` for @better-auth/expo)

## Decisions Made
- Chose `NSAllowsLocalNetworking` over `NSAllowsArbitraryLoads` for the iOS ATS exception (RESEARCH A3) — minimal blast radius.
- Documented the dev-only constraint inline in JSON via a `_comment`-style field since JSON has no comments.
- Accepted Android-only on-device verification for this milestone; iOS device verification deferred pending Mac/Xcode toolchain.

## Deviations from Plan

**1. On-device UAT verified on Android only, not iPhone**
- **Plan required:** the six UAT checks on both a real Android device AND a real iPhone (D-09).
- **Actual:** all six checks passed on a real Android device (`npx expo run:android` on the Windows PC, local API over LAN, Mailpit OTP). iOS was not exercised — the Mac + Xcode + free-Apple-ID provisioning toolchain is not set up.
- **Disposition:** user-approved deviation (sign-off during phase execution). iOS device verification carried forward as a deferred item; the dev-cleartext iOS ATS config itself is in place and typecheck-clean, only the physical-device run is outstanding.

**Total deviations:** 1 (scope reduction, user-approved).
**Impact on plan:** Core-value path proven on real hardware (Android). iOS parity deferred, not dropped.

## Issues Encountered
- Extended Windows native-dev troubleshooting was required before the on-device build ran (hoisted node-linker, long-path config plugin, expo-network dep). Resolved across `24a9e0e`/`47134f1`/`f304219`; user confirmed the Android dev build works end-to-end.
- Post-execution: a stray root-level Expo config (`app.json` at repo root + expo/react-native deps hoisted into the root `package.json`) from an accidental root `expo install` was reverted; the subsequent `pnpm install` reconcile was blocked on Windows by a lingering Metro file-watcher racing pnpm's atomic temp-dir import — stopping the Expo/Metro process let the install complete cleanly. No product-code impact.

## User Setup Required
On-device testing depends on the local infra + Android toolchain documented in the plan's `user_setup` (Docker + DB seed + API with `OTP_EMAIL_TRANSPORT=mailpit` + LAN `EXPO_PUBLIC_API_URL` + Android SDK/adb). iOS additionally needs a Mac with Xcode + free Apple-ID provisioning (outstanding).

## Next Phase Readiness
- Phase 3 core-value path is proven on real Android hardware; the mobile shell (i18n, auth, API clients, splash-guard, festivals list, save→enter, festival home) is device-verified.
- **Carry-forward / blockers for later:**
  - iOS on-device verification of the same six checks (deferred — toolchain).
  - Broken-Windows ledger item #2: server-side `@better-auth/expo` `expo()` plugin missing on `apps/api/src/auth/auth.instance.ts` — required before any sign-out/session-revocation feature (not exercised in Phase 3).
  - The dev-cleartext allowance MUST NOT leak into any future EAS/release profile.

---
*Phase: 03-mobile-app-shell-i18n-foundation*
*Completed: 2026-08-03*
