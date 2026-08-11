---
phase: 03-mobile-app-shell-i18n-foundation
plan: 04
subsystem: mobile
tags: [expo-router, better-auth, email-otp, lingui, i18n, metro]

# Dependency graph
requires:
  - phase: 03-mobile-app-shell-i18n-foundation
    provides: "03-03: lib/auth-client.ts (authClient.emailOtp/signIn), lib/api-client.ts (apiClient.completeProfile/getMe), app/_layout.tsx four-state guard"
provides:
  - "(auth)/index.tsx + verify.tsx — the real (unstyled) email→6-digit-code→in flow, no dev bypass"
  - "(profile-setup)/complete-profile.tsx — minimal first-login profile-completion stub exercising the guard's authenticated-no-profile branch end-to-end"
  - "lib/i18n.ts now actually loads the DE/EN catalogs (i18n.load) — the first plan whose screens render real, user-visible Lingui strings"
affects: ["03-05 (festivals/festival-home screens land behind the now-genuinely-localized guard)", "03-06 (on-device UAT exercises the real OTP round-trip + kill-and-relaunch + DE/EN device-locale truths this plan wires but cannot verify without a device)"]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Client-side better-auth error-code mapping (EMAIL_OTP_ERROR_CODES: OTP_EXPIRED/INVALID_OTP/TOO_MANY_ATTEMPTS, plus a bare 429 for the account-level rate limiter) to the Copywriting Contract's three distinct OTP error strings", "Module-level refreshAuthState() hook in app/_layout.tsx for screens whose success state lives outside better-auth's own session atom to trigger a guard re-check"]

key-files:
  created:
    - apps/mobile/app/(auth)/_layout.tsx
    - apps/mobile/app/(auth)/index.tsx
    - apps/mobile/app/(auth)/verify.tsx
    - apps/mobile/app/(profile-setup)/_layout.tsx
    - apps/mobile/app/(profile-setup)/complete-profile.tsx
    - apps/mobile/lib/po.d.ts
  modified:
    - apps/mobile/app/_layout.tsx
    - apps/mobile/lib/i18n.ts
    - apps/mobile/metro.config.js
    - apps/mobile/locales/en/messages.po
    - apps/mobile/locales/de/messages.po

key-decisions:
  - "Single TextInput for the 6-digit OTP code (maxLength=6, keyboardType='number-pad', autoComplete='one-time-code') instead of UI-SPEC's 'six fixed-width single-digit boxes' description — the plan's own Task 1 action text specifies 'a 6-digit numeric input' (singular), which the UI-SPEC row's overflow reasoning ('content length is fixed by construction') holds for equally well; six separate boxes would be pure visual polish out of scope for an explicitly unstyled placeholder (D-01)."
  - "better-auth client error mapping: EMAIL_OTP_ERROR_CODES ('OTP_EXPIRED'/'INVALID_OTP'/'TOO_MANY_ATTEMPTS', read from the plugin's error-codes module) plus a bare HTTP 429 (no code) for the account-level rate limiter both map to the same 'Too many attempts' Copywriting string — verified against better-auth@1.6.25's and better-call@1.3.7's actual dist source (APIError.from bodies, @better-fetch/fetch's non-throw error-spread behavior) rather than assumed from RESEARCH.md, since RESEARCH.md did not resolve the exact error shape."
  - "Placeholder profile-completion values (username: 'visitor_' + random base36 suffix, displayName: 'New Visitor') are DATA payloads sent to the server, not rendered UI copy — not Lingui-wrapped, matching the project's principle that dynamic/user content is never translated (only UI chrome is)."

patterns-established:
  - "OTP-error-to-copy mapping order: OTP_EXPIRED -> TOO_MANY_ATTEMPTS/429 -> INVALID_OTP -> generic network-unreachable fallback (kept local to verify.tsx; not extracted to a shared lib since this plan's file scope was two self-contained screens)."

requirements-completed: [PLAT-02, I18N-01]

coverage:
  - id: D1
    description: "Real (auth) email-entry + 6-digit-verify screens call authClient.emailOtp.sendVerificationOtp / authClient.signIn.emailOtp — no dev bypass, gated CTAs, distinct localized errors for wrong/expired/rate-limited outcomes"
    requirement: PLAT-02
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile lint (no-literal-string active)"
        status: pass
      - kind: other
        ref: "grep-verified: only authClient.emailOtp.*/authClient.signIn.emailOtp calls exist in app/(auth) and app/(profile-setup) — no session set outside the OTP round-trip"
        status: pass
    human_judgment: true
    rationale: "Whether the OTP actually round-trips against the live API (Mailpit-delivered code, real 6-digit verify, session persists across a kill-and-relaunch) is a runtime/device property this phase's own <verification> defers to Plan 06's on-device UAT — typecheck/lint prove the code shape and error-mapping logic, not the live round-trip."
  - id: D2
    description: "(profile-setup)/complete-profile.tsx auto-fills a placeholder username/displayName, calls apiClient.completeProfile, handles the 409 conflict with a regenerate-and-retry path, and triggers the root guard to re-resolve GET /me toward 'authenticated' on success"
    requirement: PLAT-02
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile lint"
        status: pass
      - kind: other
        ref: "grep-verified refreshAuthState() call site + app/_layout.tsx's meRefreshToken dependency wiring"
        status: pass
    human_judgment: true
    rationale: "Whether a genuinely first-time OTP account reaches 'authenticated' end-to-end (completeProfile succeeds against the live DB, the guard's Stack.Protected swap actually happens on a real device) is Plan 06's on-device UAT concern, same as D1."
  - id: D3
    description: "Real DE/EN Lingui catalogs cover all 20 strings across both screens; lingui extract is idempotent; the running i18n instance actually loads the compiled catalogs (not just activates a locale) — closing 03-02's 'catalog loading' open todo"
    requirement: I18N-01
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/mobile exec lingui extract && git diff --exit-code apps/mobile/locales"
        status: pass
      - kind: other
        ref: "pnpm --filter @festipal/mobile exec expo export --platform android (1692 modules, .po catalogs resolve/bundle cleanly via the Metro sourceExts fix)"
        status: pass
    human_judgment: true
    rationale: "Whether German device-locale users actually SEE the German strings at runtime (visual confirmation) is a real-device UAT concern (D-07's device-locale-switch truth) — this plan proves the catalogs are loaded and bundle cleanly, not the on-screen visual result."

duration: ~24 min
completed: 2026-08-03
status: complete
---

# Phase 3 Plan 4: Real Email-OTP Screens & Profile-Setup Stub Summary

**Unstyled but genuinely real email→6-digit-code→in flow (no dev bypass) plus a minimal complete-profile stub for first-time accounts — and a fix that makes the app's Lingui catalogs actually load into the running i18n instance for the first time.**

## Performance

- **Duration:** ~24 min
- **Started:** 2026-08-03T16:42:00Z (approx., following 03-03's completion)
- **Completed:** 2026-08-03T17:05:58Z
- **Tasks:** 2
- **Files modified:** 11 (6 created, 5 modified)

## Accomplishments

- `(auth)/index.tsx`: real email-entry screen calling `authClient.emailOtp.sendVerificationOtp({ email, type: 'sign-in' })`, CTA gated on a non-empty email, "Sending…" disabled loading state, and a localized error for rate-limit/network failures.
- `(auth)/verify.tsx`: real 6-digit-code screen calling `authClient.signIn.emailOtp({ email, otp })`, CTA gated on exactly 6 digits, "Verifying…" disabled loading state, a "Didn't get a code? Resend" action, and three DISTINCT localized error messages mapped from better-auth's actual `EMAIL_OTP_ERROR_CODES` (`OTP_EXPIRED`/`INVALID_OTP`/`TOO_MANY_ATTEMPTS`) plus the account-level 429 rate limiter.
- `(profile-setup)/complete-profile.tsx`: minimal stub for a genuinely first-time OTP account — auto-generates a placeholder `username`/`displayName`, calls `apiClient.completeProfile`, and on a 409 (username taken) regenerates the placeholder and shows a localized retry-with-Continue error. Matches the UI-SPEC profile-stub backstop row exactly (heading "One more step", body "We need a temporary profile to continue.", CTA "Continue").
- `app/_layout.tsx`: added a module-level `refreshAuthState()` hook (deviation, see below) so the guard re-checks `GET /me` after `completeProfile` succeeds — `profile` isn't part of better-auth's own session atom, so nothing else would have re-triggered the guard's third-branch resolution.
- `lib/i18n.ts` + `metro.config.js`: fixed a real gap flagged in 03-02's own SUMMARY — the running `i18n` instance was never actually loading the compiled DE/EN catalogs (`i18n.activate(locale)` alone falls back to English source text with no catalog registered), and Metro's resolver never had `'po'` in `sourceExts` so a `.po` import couldn't even be found. Both are fixed and proven by a real `expo export --platform android` (1692 modules, catalogs bundle cleanly), not just typecheck.
- All 20 new strings across both screens extracted via `lingui extract` and translated into German; `lingui extract` is idempotent (no further diff) against the committed catalogs.

## Task Commits

Each task was committed atomically:

1. **Task 1: (auth) email entry + 6-digit OTP verify screens (real flow)** - `aaa95cb` (feat)
2. **Task 2: (profile-setup) minimal stub — complete-profile for first-time accounts** - `b0c6ed6` (feat)

Deviation fix committed separately (see below):

3. **Catalog-loading + Metro sourceExts fix** - `2ed5f62` (fix)

## Files Created/Modified

- `apps/mobile/app/(auth)/_layout.tsx` - plain Stack for the unauthenticated group
- `apps/mobile/app/(auth)/index.tsx` - email entry, real `sendVerificationOtp` call
- `apps/mobile/app/(auth)/verify.tsx` - 6-digit verify, real `signIn.emailOtp` call, 3-way error mapping, resend
- `apps/mobile/app/(profile-setup)/_layout.tsx` - plain Stack for the no-profile group
- `apps/mobile/app/(profile-setup)/complete-profile.tsx` - placeholder-profile stub, `completeProfile` call, 409 retry
- `apps/mobile/app/_layout.tsx` - added `refreshAuthState()` module hook + `meRefreshToken` guard-recheck dependency
- `apps/mobile/lib/i18n.ts` - now calls `i18n.load({ en, de })` from the compiled `.po` catalogs
- `apps/mobile/lib/po.d.ts` - new ambient `declare module '*.po'` TypeScript declaration
- `apps/mobile/metro.config.js` - added `'po'` to `resolver.sourceExts`
- `apps/mobile/locales/en/messages.po` / `de/messages.po` - 20 new message ids, all German-translated

## Decisions Made

See `key-decisions` in frontmatter above for full rationale. In short: a single 6-digit `TextInput` (not six boxes) matches the plan's own action text and keeps the overflow-impossible reasoning intact; better-auth's OTP/rate-limit error codes were read directly from the installed package's dist source (not assumed) to build a correct three-way error mapping; placeholder profile data (username/displayName) is data, not UI chrome, so it isn't Lingui-wrapped.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `app/_layout.tsx` needed a guard-recheck hook for Task 2's own acceptance criterion**
- **Found during:** Task 2 (`complete-profile.tsx` implementation)
- **Issue:** The plan's Task 2 acceptance criteria require that a successful `completeProfile` call "causes the guard to re-resolve toward `authenticated`." But `profile` is fetched via our own `GET /me` endpoint, entirely separate from better-auth's session atom that `app/_layout.tsx`'s guard effect depends on (`[session, sessionPending]`). Completing a profile does not change `session`/`sessionPending`, so the guard's effect would never re-run and the visitor would stay stuck on `(profile-setup)` forever.
- **Fix:** Added a module-level `refreshAuthState()` export in `app/_layout.tsx` (registered via a `meRefreshToken` state + `useEffect`), called by `complete-profile.tsx` after a successful `completeProfile`. The guard's `resolveAuthState` effect now also depends on `meRefreshToken`.
- **Files modified:** `apps/mobile/app/_layout.tsx` (not in this plan's declared `files_modified`, but required by Task 2's own stated acceptance criterion).
- **Verification:** `pnpm --filter @festipal/mobile typecheck && lint`; grep-verified the call site and dependency wiring.
- **Committed in:** `b0c6ed6` (Task 2 commit)

**2. [Rule 2 - Missing Critical] `lib/i18n.ts` never loaded the compiled DE/EN catalogs into the running `i18n` instance**
- **Found during:** post-Task-2 review of the plan's own `<notes>` flag (carried over from 03-02's SUMMARY "Next Phase Readiness")
- **Issue:** `i18n.activate(locale)` alone does not make Lingui render translated text — without a loaded catalog for the active locale, every `<Trans>`/`t` macro falls back to its English source text regardless of device locale. This plan ships the FIRST real, user-visible UI strings in the app, so the gap — previously harmless (only the deleted tracer screen existed) — now silently defeats D-07/I18N-01 for every screen this plan built.
- **Fix:** `lib/i18n.ts` now imports the compiled `messages` export from both `.po` catalogs and calls `i18n.load({ en: enMessages, de: deMessages })` before any `activate` call. Added `apps/mobile/lib/po.d.ts` (ambient `declare module '*.po'`) so `tsc` can typecheck the import.
- **Files modified:** `apps/mobile/lib/i18n.ts`, `apps/mobile/lib/po.d.ts`
- **Verification:** `pnpm --filter @festipal/mobile typecheck` passes with the new import; confirmed the catalogs are genuinely wired (not just typechecked) via the real bundle proof in deviation #3 below.
- **Committed in:** `2ed5f62`

**3. [Rule 1 - Bug] Metro's resolver never looked for `.po` files at all**
- **Found during:** verifying deviation #2's fix with a real `expo export --platform android` (the same proof technique 03-02 used)
- **Issue:** `metro.config.js` wires the Lingui transformer via `transformer.babelTransformerPath`, but Metro's `resolver.sourceExts` never included `'po'` — so `import ... from '...messages.po'` failed with "Unable to resolve module" before the transformer ever ran. This was latent since 03-02 (no file imported a `.po` catalog directly until this plan's `lib/i18n.ts` fix above).
- **Fix:** Added `config.resolver.sourceExts = [...config.resolver.sourceExts, 'po']` in `metro.config.js`.
- **Files modified:** `apps/mobile/metro.config.js`
- **Verification:** `pnpm exec expo export --platform android` — bundled cleanly (1692 modules, catalogs resolve and compile via the transformer).
- **Committed in:** `2ed5f62`

---

**Total deviations:** 3 auto-fixed (1 blocking guard-wiring gap, 1 missing-critical i18n gap, 1 blocking Metro bug) — all necessary corrections discovered while making this plan's own screens and `<verify>`/acceptance criteria genuinely pass, not scope creep. The i18n catalog-loading gap in particular was explicitly flagged as a risk in this plan's own `<notes>` and in 03-02's SUMMARY, and would have silently defeated D-07/I18N-01 for the phase's first real UI if left unfixed.
**Impact on plan:** No architectural changes; the plan's declared file scope for both tasks is implemented exactly as specified, plus the three necessary corrections above.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required. The real OTP round-trip (Mailpit-delivered code) and kill-and-relaunch persistence are Plan 06's on-device UAT concern, unchanged from 03-02/03-03's scoping.

## Next Phase Readiness

- `(auth)` and `(profile-setup)` route groups are fully wired to the guard from 03-03 and ready for Plan 05's `festivals`/`(festival)` screens to land behind the `authenticated` branch.
- The i18n catalog-loading fix means Plan 05's screens will genuinely render German text on non-DE/EN devices from their first commit — no repeat of this gap.
- No blockers for Plan 05. The real on-device proof of the full OTP flow (Mailpit inbox, kill-and-relaunch, DE/EN device-locale switch) remains Plan 06's explicit scope per this phase's `<verification>` section.

## Self-Check: PASSED

- FOUND: apps/mobile/app/(auth)/_layout.tsx
- FOUND: apps/mobile/app/(auth)/index.tsx
- FOUND: apps/mobile/app/(auth)/verify.tsx
- FOUND: apps/mobile/app/(profile-setup)/_layout.tsx
- FOUND: apps/mobile/app/(profile-setup)/complete-profile.tsx
- FOUND: apps/mobile/lib/po.d.ts
- FOUND commit: aaa95cb
- FOUND commit: b0c6ed6
- FOUND commit: 2ed5f62
- Re-ran acceptance criteria: `typecheck` (pass), `lint` (pass, no-literal-string active), `lingui extract && git diff --exit-code apps/mobile/locales` (pass, clean against committed state), `pnpm typecheck` full workspace (9/9 tasks green), `expo export --platform android` (pass, 1692 modules, `.po` catalogs bundle)
- Grep-verified: only `authClient.emailOtp.*`/`authClient.signIn.emailOtp`/`apiClient.completeProfile`/`apiClient.getMe` calls exist across `app/(auth)` and `app/(profile-setup)` — no dev-bypass or script-injected session path

---
*Phase: 03-mobile-app-shell-i18n-foundation*
*Completed: 2026-08-03*
