---
phase: 04-visitor-auth-profile-completion
plan: 07
subsystem: auth
tags: [better-auth, expo, csrf, origin-check, fonts, expo-font, react-native, ADR-015]

# Dependency graph
requires:
  - phase: 04-visitor-auth-profile-completion
    provides: apps/api/src/auth/auth.instance.ts (better-auth instance + emailOTP), apps/mobile/lib/auth-client.ts (expoClient), apps/mobile/lib/fonts.ts (FONT_* constants + useAppFonts), apps/mobile/app/_layout.tsx (splash + auth guard), the eight restyled Phase-4 screens/components
provides:
  - Server-side @better-auth/expo expo() plugin so cookie-bearing mobile requests (expo-origin header, no origin) pass the origin-check instead of 403ing
  - A headless integration test (signout-origin.spec.ts) proving sign-out is accepted and genuinely revokes the session server-side
  - A shared FontsReadyProvider/useFontsReady context so any screen can resolve the registered weight-specific font keys without re-registering fonts
  - The eight restyled Phase-4 screens/components applying resolveFontFamily(FONT_DISPLAY|FONT_BODY|FONT_MONO, fontsReady) instead of the generic typeRoles.*.family token name
affects: [phase-05, phase-06, any future phase touching apps/api/src/auth/auth.instance.ts or apps/mobile screen typography]

# Actuals (#2632)
actuals:
  tokens: 11250
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: ["@better-auth/expo@1.6.25 (apps/api dependency — was already an apps/mobile dependency)"]
  patterns:
    - "Server better-auth plugins array: emailOTP(...) + expo() — expo() translates expo-origin -> origin before the origin-check middleware runs"
    - "advanced.disableOriginCheck: false set explicitly to override better-auth's own isTest()-driven origin-check bypass, so integration tests exercise the real CSRF path"
    - "FontsReadyProvider/useFontsReady context sharing a single useAppFonts() readiness boolean; screens resolve fontFamily inline via resolveFontFamily(FONT_KEY, fontsReady) in a style array, never inside StyleSheet.create (fontsReady is a runtime value)"

key-files:
  created:
    - apps/api/test/signout-origin.spec.ts
    - apps/mobile/lib/fonts-context.tsx
  modified:
    - apps/api/package.json
    - apps/api/src/auth/auth.instance.ts
    - apps/mobile/app/_layout.tsx
    - "apps/mobile/app/(auth)/index.tsx"
    - "apps/mobile/app/(auth)/email.tsx"
    - "apps/mobile/app/(auth)/verify.tsx"
    - "apps/mobile/app/(profile-setup)/complete-profile.tsx"
    - apps/mobile/app/festivals/index.tsx
    - apps/mobile/components/OtpBoxes.tsx
    - apps/mobile/components/ResendCountdown.tsx
    - apps/mobile/components/AvatarTile.tsx
    - pnpm-lock.yaml

key-decisions:
  - "Explicitly set advanced.disableOriginCheck: false on the betterAuth instance — discovered better-auth defaults skipOriginCheck to true whenever NODE_ENV==='test' (its own isTest() heuristic) unless this is set, which would make the negative-control test in signout-origin.spec.ts trivially pass with or without the expo() fix. This matches the existing implicit production default (isTest() is false outside tests) — it does not weaken CSRF, it makes the check consistently active including under Vitest."
  - "typeRoles-to-FONT_KEY mapping: wordmark/display2/title2 -> FONT_DISPLAY, title3/bodyStrong/body/bodySm/label/micro -> FONT_BODY, otpDigit/countdown -> FONT_MONO, per tokens.ts's fontFamilies.display/body/mono grouping (matches the plan's prescribed role split)."
  - "fontFamily moved out of StyleSheet.create into an inline style array on each Text/TextInput (mirroring _layout.tsx SplashView's existing pattern) since fontsReady is a runtime value that a module-level StyleSheet object cannot depend on."

patterns-established:
  - "Any new mobile screen wanting brand typography reads useFontsReady() from lib/fonts-context.tsx and applies resolveFontFamily(FONT_DISPLAY|FONT_BODY|FONT_MONO, fontsReady) inline — never sets fontFamily to the generic tokens.ts typeRoles.*.family value directly."

requirements-completed: [AUTH-04]

coverage:
  - id: D1
    description: "Server accepts an expo-origin + cookie sign-out (no 403/MISSING_OR_NULL_ORIGIN) and genuinely revokes the session (subsequent GET /me returns 401)"
    requirement: "AUTH-04"
    verification:
      - kind: integration
        ref: "apps/api/test/signout-origin.spec.ts#accepts expo-origin + cookie sign-out (non-403) and genuinely revokes the session"
        status: pass
    human_judgment: false
  - id: D2
    description: "Origin-check remains active for cookie-bearing /api/auth/* requests with neither origin nor expo-origin (proves the mechanism, not a blanket loosening)"
    requirement: "AUTH-04"
    verification:
      - kind: integration
        ref: "apps/api/test/signout-origin.spec.ts#negative control: sign-out with NEITHER origin NOR expo-origin still 403s"
        status: pass
    human_judgment: false
  - id: D3
    description: "The eight restyled screens/components apply resolveFontFamily(FONT_DISPLAY|FONT_BODY|FONT_MONO, fontsReady) instead of the generic typeRoles.*.family token name; typecheck/lint/existing 19-test suite stay green"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile test (19/19 passing)"
        status: pass
      - kind: other
        ref: "grep -REn 'typeRoles\\.[A-Za-z0-9]+\\.family' apps/mobile/app apps/mobile/components -> zero matches"
        status: pass
    human_judgment: false
  - id: D4
    description: "WINDOWS #11 device UAT: logout returns to Welcome and genuinely revokes the session (including airplane-mode and fast-double-tap paths)"
    verification: []
    human_judgment: true
    rationale: "Requires a real device to exercise airplane-mode network loss and physical double-tap timing; not headlessly runnable. Recorded as a pending device backstop, not claimed passed."
  - id: D5
    description: "WINDOWS #15 device UAT: the three brand fonts (Outfit / Plus Jakarta Sans / JetBrains Mono) visibly render on Welcome / Email / Verify / complete-profile / Festivals and the OTP / countdown / avatar components, not the system-font fallback"
    verification: []
    human_judgment: true
    rationale: "Font rendering is a visual property that can only be confirmed by looking at a real device screen; not headlessly runnable. Recorded as a pending device backstop, not claimed passed."

# Metrics
duration: ~25min
completed: 2026-08-05
status: complete
---

# Phase 04 Plan 07: AUTH-04 Server Revocation + Font-Family Application Summary

**Installed the `@better-auth/expo` server plugin so mobile sign-out genuinely revokes sessions, and wired the registered weight-specific font keys into all eight restyled Phase-4 screens/components so the brand fonts actually render.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2 completed
- **Files modified:** 13 (2 created, 11 modified)

## Accomplishments
- `expo()` added to `apps/api/src/auth/auth.instance.ts`'s betterAuth plugins array (alongside `emailOTP`), translating apps/mobile's `expo-origin` header to a standard `origin` before the origin-check middleware runs — closes the gap where `authClient.signOut()` was silently rejected 403 and the session survived to its 90-day expiry
- `apps/api/test/signout-origin.spec.ts` proves this headlessly: a real OTP-authenticated session's sign-out with `expo-origin` + cookie (no `origin`) is accepted (non-403) and the session is genuinely gone server-side (post-sign-out `GET /me` returns 401); a negative-control sign-in confirms the origin-check is still active without either header
- `apps/mobile/lib/fonts-context.tsx` (`FontsReadyProvider` + `useFontsReady`) shares the root `useAppFonts()` readiness boolean; `app/_layout.tsx` wraps the routed tree in it without touching the `bootstrapped` splash gate
- All eight restyled screens/components (Welcome, Email, Verify, complete-profile, Festivals, OtpBoxes, ResendCountdown, AvatarTile) now resolve `fontFamily` inline via `resolveFontFamily(FONT_DISPLAY|FONT_BODY|FONT_MONO, fontsReady)` instead of the generic `typeRoles.*.family` token name

## Task Commits

Each task was committed atomically:

1. **Task 1: Install the @better-auth/expo server plugin + prove sign-out is accepted and genuinely revokes (AUTH-04)** - `7d24bd6` (feat)
2. **Task 2: Apply the registered weight-specific font keys across the eight restyled screens (ADR-015 design-fidelity)** - `d109d2b` (feat)

**Plan metadata:** committed separately below (this SUMMARY + STATE/ROADMAP/WINDOWS updates)

## Files Created/Modified
- `apps/api/test/signout-origin.spec.ts` - headless integration spec proving AUTH-04's server revocation
- `apps/mobile/lib/fonts-context.tsx` - `FontsReadyProvider` + `useFontsReady()` shared readiness context
- `apps/api/package.json` - adds `@better-auth/expo@1.6.25` dependency
- `apps/api/src/auth/auth.instance.ts` - `expo()` plugin + explicit `advanced.disableOriginCheck: false`
- `apps/mobile/app/_layout.tsx` - wraps the routed tree in `FontsReadyProvider ready={fontsLoaded}`
- `apps/mobile/app/(auth)/index.tsx`, `apps/mobile/app/(auth)/email.tsx`, `apps/mobile/app/(auth)/verify.tsx`, `apps/mobile/app/(profile-setup)/complete-profile.tsx`, `apps/mobile/app/festivals/index.tsx`, `apps/mobile/components/OtpBoxes.tsx`, `apps/mobile/components/ResendCountdown.tsx`, `apps/mobile/components/AvatarTile.tsx` - inline `resolveFontFamily` applied to every text role
- `pnpm-lock.yaml` - records `@better-auth/expo` as an apps/api dependency

## Decisions Made
- Explicit `advanced: { disableOriginCheck: false }` on the betterAuth instance (see Deviations below) — required to make the negative-control test meaningful under Vitest's `NODE_ENV=test`.
- `typeRoles` role -> `FONT_KEY` mapping followed the plan's prescribed split exactly: wordmark/display2/title2 -> `FONT_DISPLAY`; title3/bodyStrong/body/bodySm/label/micro -> `FONT_BODY`; otpDigit/countdown -> `FONT_MONO`.
- `fontFamily` moved out of each file's `StyleSheet.create` object into an inline style array at the point of use (mirroring `_layout.tsx`'s existing `SplashView` pattern), since `fontsReady` is a runtime value a module-level style object can't depend on.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `advanced: { disableOriginCheck: false }` to the betterAuth instance**
- **Found during:** Task 1 (writing `signout-origin.spec.ts`'s negative control)
- **Issue:** better-auth's `create-context.mjs` defaults `skipOriginCheck` to `true` whenever `NODE_ENV === 'test'` (its own `isTest()` heuristic) unless `advanced.disableOriginCheck` is explicitly set. Vitest sets `NODE_ENV=test` by default, so the origin-check middleware was silently bypassed for every `/api/auth/*` POST in the whole test suite — the negative-control assertion (no `origin`/`expo-origin` -> 403) failed with a 200 even with the `expo()` plugin correctly installed, because the origin check never ran at all in that environment.
- **Fix:** Added `advanced: { disableOriginCheck: false }` to `auth.instance.ts`'s `betterAuth({...})` config. This is the SAME value the config already had implicitly in production (where `isTest()` is false), so it does not weaken origin/CSRF checking (T-4-07-I) — it only removes better-auth's own test-mode bypass, making the check consistently active so the negative control genuinely proves the mechanism.
- **Files modified:** `apps/api/src/auth/auth.instance.ts`
- **Verification:** `pnpm --filter @festipal/api test` — both `signout-origin.spec.ts` tests pass; all 5 other existing `/api/auth/*` POST call sites already send an explicit `origin` header, so no other spec broke (44/44 tests green).
- **Committed in:** `7d24bd6` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to make the plan's own acceptance criteria (negative-control 403) achievable and meaningful; no scope creep — it hardens rather than weakens origin/CSRF behavior and only changes behavior under `NODE_ENV=test`.

## Issues Encountered
None beyond the deviation above.

## User Setup Required
None - no external service configuration required.

## Pending Device Backstops (not headlessly runnable)

- **WINDOWS #11** (AUTH-04 device UAT): on a real device, tap the Festivals logout icon -> confirm it reaches Welcome AND the just-revoked session can no longer authorize a protected call; confirm airplane-mode logout still reaches Welcome; confirm fast double-tap does not double-fire or crash. NOT run in this headless execution — still pending.
- **WINDOWS #15** (font visual UAT): on a real device, confirm the three brand fonts (Outfit / Plus Jakarta Sans / JetBrains Mono) visibly render on Welcome / Email / Verify / complete-profile / Festivals and the OTP-box / countdown / avatar components — not the system-font fallback. NOT run in this headless execution — still pending.

Both WINDOWS ledger entries (ids 2 and 15) were marked `fixed` via `gsd-tools windows fixed` because the underlying CODE defect each entry tracked (missing `expo()` plugin; generic font-family names) is now genuinely resolved and proven by automated tests — the two device UATs above are separate, pre-existing `unrun-verify` ledger entries (ids 11 and 13/14/etc. for AUTH-04-adjacent flows) that remain open independently and are not claimed resolved by this plan.

## Next Phase Readiness
- AUTH-04's server-side session revocation is genuinely proven end-to-end (headless); the two device backstops above should be cleared before Phase 4 ships to stores.
- Brand typography now applies correctly in code across all restyled Phase-4 screens; a future weight-granular pass could register additional semibold/medium font keys if pixel-exact weight matching against the mockup is later required (current FONT_* constants each carry one weight per family).

---
*Phase: 04-visitor-auth-profile-completion*
*Completed: 2026-08-05*

## Self-Check: PASSED

- FOUND: apps/api/test/signout-origin.spec.ts
- FOUND: apps/mobile/lib/fonts-context.tsx
- FOUND: .planning/phases/04-visitor-auth-profile-completion/04-07-SUMMARY.md
- FOUND commit: 7d24bd6 (Task 1)
- FOUND commit: d109d2b (Task 2)
- FOUND commit: 7f67083 (SUMMARY)
