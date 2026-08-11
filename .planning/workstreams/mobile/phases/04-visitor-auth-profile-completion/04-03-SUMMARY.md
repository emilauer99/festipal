---
phase: 04-visitor-auth-profile-completion
plan: 03
subsystem: mobile-auth
tags: [react-native, expo-router, lingui, tanstack-query, better-auth, ts-rest, festipal-ui]

# Dependency graph
requires:
  - phase: 04-01
    provides: apps/mobile Vitest runner + non-blocking font module
  - phase: 04-02
    provides: real @festipal/ui brand tokens + D-03 server-side username/displayName caps
provides:
  - "(auth) routing restructured into Welcome (index.tsx) + Email (email.tsx, new route) reaching the existing verify.tsx OTP screen unchanged"
  - "Real first-login VisitorProfile write on (profile-setup)/complete-profile.tsx — user-typed username with debounced live-availability + user-typed displayName, generatePlaceholderUsername() removed"
  - "@festipal/ui wired into apps/mobile for the first time (workspace dependency added) — Welcome/Email/Profile all styled from real brand tokens, no hard-coded hex"
  - "Binding DE/EN Lingui msgids for Welcome/Email/Profile matching the UI-SPEC Copywriting Contract verbatim (0 missing DE translations)"
affects: [04-04 otp-visual-restyle, 04-05 avatar-suggestion-pipeline, 04-06 logout-deeplink-splash]

# Actuals (#2632)
actuals:
  tokens: 9200
  tasks: 3
  commits: 2

# Tech tracking
tech-stack:
  added: ["@festipal/ui (workspace:*, first mobile screen import)"]
  patterns:
    - "Debounced (~350ms) live-availability TanStack useQuery gated on a `settled` boolean (debouncedUsername === username && length>=3), mirroring festivals/index.tsx's useQuery shape"
    - "Client-side username sanitization on every keystroke (lowercase + charset strip to a-z0-9_.) instead of a post-hoc regex error state — the field can never contain an invalid character"
    - "headerShown:false + in-body H1, native Stack.Screen title kept only as the a11y label (UI-SPEC Scope note #7)"

key-files:
  created:
    - apps/mobile/app/(auth)/email.tsx
  modified:
    - apps/mobile/app/(auth)/index.tsx
    - apps/mobile/app/(profile-setup)/complete-profile.tsx
    - apps/mobile/locales/en/messages.po
    - apps/mobile/locales/de/messages.po
    - apps/mobile/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Added @festipal/ui as an apps/mobile dependency (workspace:*) — no mobile screen imported it before this plan; Phases 5/6 now have a proven import path to the same token set"
  - "Username input is sanitized (lowercase + charset-stripped) on every onChangeText call rather than validated after the fact — matches the D-03 server regex by construction, so the client can never send a format the server would reject for charset reasons"
  - "Live-availability status is derived from a single `settled` boolean (debounce elapsed AND input unchanged AND length>=3) crossed with the TanStack Query status, avoiding a separate isFetching/isPending double-check — idle covers both 'too short' and 'still typing', matching the Copywriting Contract's 4-state vocabulary exactly"
  - "Username-taken suggestion (Copywriting Contract line 2, '@{username} ist schon vergeben. Nimm etwas anderes...') is intentionally NOT implemented this plan — the task's own <action> scopes the suggestion algorithm to 04-05; only the taken headline (line 1) ships here"
  - "verify.tsx (OTP screen) was deliberately left untouched — Task 1's read_first explicitly marks it 'unchanged this task'; its visual restyle (6-box OTP, resend countdown) is 04-04's scope"

patterns-established:
  - "Real @festipal/ui typeRoles/colors/layout/radii/spacingScale tokens as the only styling source on new/restyled auth screens — no inline hex"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, IDN-01]

coverage:
  - id: D1
    description: "(auth)/index.tsx is Welcome (wordmark + tagline + single Get started CTA, no email input); (auth)/email.tsx is a new route owning the send-OTP logic, routes to /verify; both headerShown:false + in-body H1"
    requirement: AUTH-01
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint (no-literal-string) -- exit 0"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck -- exit 0"
        status: pass
      - kind: manual_procedural
        ref: "Task 1 human-check: dev build + Mailpit, Welcome -> Email -> real OTP send -> existing verify screen (not runnable in this headless executor)"
        status: unknown
    human_judgment: true
    rationale: "The real end-to-end OTP round-trip against a running dev build + Mailpit cannot be exercised by this headless executor; lint/typecheck prove the code compiles and is string-clean, but the runtime flow needs a human on a device/emulator. Recorded in .planning/WINDOWS.md as an unrun-verify item."
  - id: D2
    description: "First-login profile completion is a real VisitorProfile write: user-typed username with debounced live-availability + user-typed displayName; Done gated on valid+available+non-empty; request body is {username, displayName} only (no avatar); 409 keeps the user on-screen"
    requirement: IDN-01
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint (no-literal-string) -- exit 0"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck -- exit 0"
        status: pass
      - kind: manual_procedural
        ref: "Task 2 human-check: fresh account, real username live-check + Done -> festivals, network body confirmed avatar-free (not runnable in this headless executor)"
        status: unknown
    human_judgment: true
    rationale: "generatePlaceholderUsername() removal and the real completeProfile/409/refreshAuthState wiring are proven by static analysis (lint+typecheck) but the actual network round-trip and guard re-resolution require a running dev build. Recorded in .planning/WINDOWS.md."
  - id: D3
    description: "DE catalog matches the UI-SPEC Copywriting Contract verbatim for every new Welcome/Email/Profile msgid; no-literal-string lint passes"
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/mobile extract -- 49/49 DE messages present, 0 missing"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint (i18next/no-literal-string) -- exit 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "AUTH-02 returning-visitor skip: an email that already has a VisitorProfile lands directly in festivals after OTP, skipping (profile-setup); guard branch logic unchanged from Phase 3, only what mounts in it was restyled"
    requirement: AUTH-02
    verification:
      - kind: manual_procedural
        ref: "Task 3 human-check: real device, existing-profile email -> OTP -> festivals with no profile-setup screen (not runnable in this headless executor)"
        status: unknown
    human_judgment: true
    rationale: "This is a real-device-only behavioral proof of app/_layout.tsx's existing four-state guard (unchanged this plan, confirmed by code read: the authenticated-no-profile -> authenticated transition is driven purely by refreshAuthState() re-checking GET /me, no manual navigation added). Recorded in .planning/WINDOWS.md."
  - id: D5
    description: "AUTH-03 session persists across a full OS force-quit + relaunch (Pitfall 1 method) with no OTP re-prompt"
    requirement: AUTH-03
    verification:
      - kind: manual_procedural
        ref: "Task 3 human-check: complete new-user flow, swipe-away force-quit (not hot-reload), relaunch from home-screen icon -> logged-in on festivals (not runnable in this headless executor)"
        status: unknown
    human_judgment: true
    rationale: "Requires a real OS process kill + relaunch on a physical device/emulator; SecureStore session persistence itself is unchanged from Phase 3 (this plan added no session-storage code). Recorded in .planning/WINDOWS.md."

# Metrics
duration: ~55min
completed: 2026-08-05
status: complete
---

# Phase 4 Plan 03: Tracer — Welcome/Email Split + Real Profile Completion Summary

**The core-value tracer: Welcome/Email routing split reaching the existing real OTP flow, plus a functional rewrite of first-login profile completion into a real VisitorProfile write (debounced live-username-check + displayName) — both restyled on real `@festipal/ui` tokens, with binding DE copy.**

## Performance

- **Duration:** ~55 min
- **Started:** 2026-08-05T09:12:16Z
- **Completed:** 2026-08-05T10:07:00Z
- **Tasks:** 3 (2 code tasks + 1 verification-only task)
- **Files modified:** 7 (1 created, 6 modified)

## Accomplishments
- `(auth)/index.tsx` is now the Welcome screen (56px Outfit "festipal." wordmark with an accent-colored trailing dot, tagline, single "Get started" CTA) — no email input on this screen anymore.
- `(auth)/email.tsx` is a brand-new route: the exact `handleSendCode` OTP-send logic moved verbatim from the old index screen, restyled with real tokens, reaching the unmodified `verify.tsx` OTP screen.
- `(profile-setup)/complete-profile.tsx` is a real form: `generatePlaceholderUsername()` is gone, replaced by a sanitized, user-typed username field with a debounced (~350ms) `GET /me/username-availability` check (idle/checking/available/taken states) and a user-typed displayName field; the `completeProfile`/409/`refreshAuthState()` wiring from the placeholder flow is preserved verbatim, request body stays `{username, displayName}` only.
- `@festipal/ui` is now an actual dependency of `apps/mobile` (added this plan) — every touched screen styles from the real brand token set (colors/typeRoles/layout/radii/spacingScale), replacing all hard-coded hex.
- DE/EN Lingui catalogs updated: 49/49 messages present, 0 missing translations; all new strings match the UI-SPEC Copywriting Contract verbatim.
- `pnpm lint` (incl. `i18next/no-literal-string`), `pnpm typecheck`, and `pnpm test` (4/4 Vitest tests, unrelated font suite) all green for `@festipal/mobile`.

## Task Commits

1. **Task 1: Routing split — Welcome (index) + Email (new route)** - `25662de` (feat)
2. **Task 2: Real profile-completion write — live username check + displayName** - `a6f0506` (feat)
3. **Task 3: End-to-end tracer verification** - no commit (verification-only task; no new feature code, confirmed the guard's re-resolution logic by code read + ran `pnpm test`/`pnpm typecheck` — both green; the two device-only manual UATs could not be executed headlessly, see below)

**Plan metadata:** pending (this commit)

## Files Created/Modified
- `apps/mobile/app/(auth)/index.tsx` - rewritten as the Welcome screen (wordmark/tagline/CTA), real tokens
- `apps/mobile/app/(auth)/email.tsx` (created) - email entry + OTP-send, moved verbatim from the old index screen, real tokens, back button
- `apps/mobile/app/(profile-setup)/complete-profile.tsx` - functional rewrite: real username+displayName inputs, debounced live-availability query, Done-gate logic, real tokens
- `apps/mobile/locales/en/messages.po` / `apps/mobile/locales/de/messages.po` - 15 new msgids (Welcome/Email/Profile), 1 DE revision (Sending… -> "Code kommt"), 3 obsoleted (old "Log in"/"Continue"/"One more step" strings)
- `apps/mobile/package.json` / `pnpm-lock.yaml` - added `@festipal/ui: workspace:*`

## Decisions Made
- `@festipal/ui` added as a real apps/mobile dependency this plan (previously ported into the package by 04-02 but never imported by any screen) — installed via `pnpm install`, verified Metro/pnpm workspace resolution already generically supports `@festipal/*` packages (no metro.config.js change needed).
- Username field sanitizes input on every keystroke (lowercase + strip to `a-z0-9_.`) rather than validating after the fact and showing a format-error state — this guarantees the client can never even construct a request the D-03 server regex would reject for charset, simplifying the state machine to the Copywriting Contract's exact 4 states (idle/checking/available/taken).
- Live-availability status derives from one `settled` boolean (`debouncedUsername === username && length >= 3`) crossed with TanStack Query's own `status`, rather than a separate `isFetching` check — avoids flicker on background refetches and keeps the state machine small.
- The username-taken suggestion sentence (Copywriting Contract line 2) is intentionally NOT built this plan — the task's own `<action>` text scopes the suggestion algorithm to 04-05; only the taken headline ships here.
- `verify.tsx` was left completely untouched, per Task 1's own `read_first` note ("unchanged this task") — its OTP visual restyle is 04-04's scope.

## Deviations from Plan

None — plan executed exactly as written. No Rule 1-3 auto-fixes were triggered; the one gap found (`@festipal/ui` not yet an `apps/mobile` dependency) was an expected, plan-anticipated setup step (04-02's own SUMMARY flagged "no mobile screen imports `@festipal/ui` yet"), not a bug or missing critical functionality — adding the workspace dependency link is the mechanical prerequisite the plan's own action text assumes ("Style with the real `packages/ui` tokens").

## Issues Encountered
None beyond the expected `@festipal/ui` dependency wiring described above.

## User Setup Required
None - no external service configuration required.

## Manual UAT — Required, Not Run (headless executor)

Per the task's own instructions, these cannot be exercised without a real device/emulator and are recorded here for the end-of-phase verifier (`human_verify_mode: end-of-phase`, per `.planning/config.json`). All four are also logged in `.planning/WINDOWS.md` as `unrun-verify` entries so they stay visible at ship time:

1. **Task 1 (AUTH-01 tracer):** On a dev build with Mailpit running — launch, Welcome renders wordmark+tagline+CTA, tap "Get started", Email screen, enter email, "Send code", OTP arrives in Mailpit, enter it on verify, advances past `(auth)`. Confirm DE copy matches the mockup.
2. **Task 2 (IDN-01):** Fresh account (new email) — after OTP, land on the real profile form; type a username, see "prüfe…" then available/taken; Done stays disabled until username available + displayName set; tap Done, lands in festivals. Confirm the network request body is `{username, displayName}` with no avatar field.
3. **Task 3 / AUTH-02 (returning-user skip):** Log in with an email that already has a profile — lands in festivals directly, no profile-setup screen.
4. **Task 3 / AUTH-03 (force-quit persistence, Pitfall 1 method):** Complete the new-user flow, force-quit the OS process (swipe-away, NOT hot-reload/Metro reload), relaunch from the home-screen icon — lands logged-in, no OTP re-prompt.

Code-level confirmation for #3/#4: `app/_layout.tsx`'s four-state guard (unchanged this plan) transitions `authenticated-no-profile -> authenticated` purely via `refreshAuthState()` re-checking `GET /me` — no manual navigation was added anywhere in this plan's screens, preserving the Phase 3 contract these two UATs depend on.

## Next Phase Readiness
- **04-04 (OTP visual restyle):** `verify.tsx` is untouched and ready for the 6-box OTP pattern + resend countdown restyle; the Welcome/Email screens it will sit alongside already establish the real-token, headerShown:false + in-body-H1 pattern to match.
- **04-05 (avatar + suggestion):** `complete-profile.tsx`'s username field is ready for the taken-state suggestion sentence to be added (line 2 of the Copywriting Contract, deliberately deferred here); no avatar tile exists yet on this screen (also deferred, D-01/avatar-not-in-body still holds).
- **04-06 (logout/deep-link/splash):** No changes to `app/_layout.tsx`'s guard this plan — it remains the exact Phase 3 four-state contract 04-06 will extend for deep-link capture/return-to.
- **Blocking for phase close:** the four manual UATs above must be run on a real device (Android, per Phase 3's accepted iOS-deferral precedent) before Phase 4 can be considered verified end-to-end — tracked in `.planning/WINDOWS.md`.

---
*Phase: 04-visitor-auth-profile-completion*
*Completed: 2026-08-05*

## Self-Check: PASSED

All created/modified files verified present on disk (`apps/mobile/app/(auth)/index.tsx`, `apps/mobile/app/(auth)/email.tsx`, `apps/mobile/app/(profile-setup)/complete-profile.tsx`, `apps/mobile/locales/en/messages.po`, `apps/mobile/locales/de/messages.po`); both task commits (`25662de`, `a6f0506`) verified present in git log.
