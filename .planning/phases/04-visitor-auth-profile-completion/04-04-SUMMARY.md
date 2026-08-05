---
phase: 04-visitor-auth-profile-completion
plan: 04
subsystem: mobile-auth
tags: [react-native, expo-router, lingui, better-auth, otp, festipal-ui]

# Dependency graph
requires:
  - phase: 04-01
    provides: apps/mobile Vitest node-env runner (pure lib/ scope)
  - phase: 04-03
    provides: tracer's plain OTP verify.tsx (single TextInput, unstyled) as the re-skin target
provides:
  - "apps/mobile/lib/otp-error.ts — pure, unit-tested mapOtpError classifier (kind key, no RN/Lingui runtime), replacing the untested inline function from Phase 3/04-03"
  - "apps/mobile/components/OtpBoxes.tsx + ResendCountdown.tsx — first apps/mobile components/ directory, ADR-022 custom RN primitives on @festipal/ui tokens"
  - "apps/mobile/app/(auth)/verify.tsx restyled to the mockup: 6-box auto-submit OTP entry, unified wrong/expired error box, 60s resend countdown, change-email link"
  - "components/ now covered by both the i18next/no-literal-string ESLint glob and the Lingui extract include list (previously scoped to app/lib only)"
affects: [04-05 avatar-suggestion-pipeline, 04-06 logout-deeplink-splash]

# Actuals (#2632)
actuals:
  tokens: 8700
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure error classifier returns a stable kind key (OtpErrorKind), not a translated string — keeps mapOtpError unit-testable with zero RN/Lingui runtime; the screen owns the kind->copy mapping via t()"
    - "OTP box display is one real near-invisible TextInput (maxLength/keyboardType/autoComplete) behind six display-only box Views reading off its value — overflow-impossible by construction, matches the mockup visually"
    - "ResendCountdown remount-via-key (resendGeneration) keeps two independent resend affordances (countdown link + error-box retry CTA) showing a consistent timer after either one succeeds"

key-files:
  created:
    - apps/mobile/lib/otp-error.ts
    - apps/mobile/lib/__tests__/otp-error.test.ts
    - apps/mobile/components/OtpBoxes.tsx
    - apps/mobile/components/ResendCountdown.tsx
  modified:
    - apps/mobile/app/(auth)/verify.tsx
    - apps/mobile/eslint.config.mjs
    - apps/mobile/lingui.config.ts
    - apps/mobile/locales/en/messages.po
    - apps/mobile/locales/de/messages.po

key-decisions:
  - "mapOtpError returns a stable OtpErrorKind ('wrong-or-expired' | 'rate-limited' | 'network') instead of a translated string or msgid — the plan explicitly offered this as an alternative to threading Lingui's t through a pure lib file; it keeps the classifier importable in the node-environment Vitest runner with zero RN/Lingui setup"
  - "OTP_EXPIRED and INVALID_OTP stay two distinct if-branches in mapOtpError (not merged into one condition) even though both return the same kind — preserves the ability to tell them apart internally later, per the plan's explicit prohibition"
  - "The subtitle 'Six digits sent to {email}.' is built via t\`...\` for an exact-match msgid, then string-split around the email substring to bold only that portion — chosen over Lingui's nested-<Trans>-component pattern so the extracted msgid stays a flat, exact match to the UI-SPEC Copywriting Contract row rather than a tag-annotated variant"
  - "resendGeneration (a bumped counter used as ResendCountdown's key) reconciles the two resend affordances (the countdown's own link and the error box's 'Send new code' CTA) — remounting the component on every successful resend guarantees the visible countdown is never stale regardless of which affordance triggered it; this wasn't specified in the plan, added as a Claude's-discretion consistency backstop"
  - "components/ was invisible to both the ESLint no-literal-string glob and the Lingui extract include list (both scoped to app/lib since Phase 3, before any components/ directory existed) — extended both configs (Rule 2) so this phase's first shared components get the same i18n/hardcoded-string guard every screen already has"

requirements-completed: [AUTH-05]

coverage:
  - id: D1
    description: "mapOtpError lives in lib/otp-error.ts as a pure, unit-tested classifier; OTP_EXPIRED and INVALID_OTP converge to the same 'wrong-or-expired' kind while TOO_MANY_ATTEMPTS/429 map to 'rate-limited' and everything else falls through to 'network'"
    requirement: AUTH-05
    verification:
      - kind: unit
        ref: "cd apps/mobile && pnpm test -- otp-error -- exit 0, 7/7 otp-error.test.ts assertions pass"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck -- exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "OtpBoxes renders 6 boxes off one hidden TextInput, auto-submits via onComplete at 6 digits, mutes (disabled) during verification, and shows a danger border on hasError; ResendCountdown counts 60->0 then exposes a re-entrancy-guarded tappable resend"
    requirement: AUTH-05
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint (i18next/no-literal-string, now covering components/) -- exit 0"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck -- exit 0"
        status: pass
      - kind: manual_procedural
        ref: "Real-device auto-submit + mute + double-tap-safe-resend verification (not runnable in this headless executor)"
        status: unknown
    human_judgment: true
    rationale: "The interaction contracts (auto-submit timing, muted loading state, double-tap re-entrancy) are proven by code read (onComplete fires only at length===6; disabled/editable gating; resending state guards the Pressable) and static analysis (lint+typecheck), but the actual on-device timing/gesture behavior needs a human on a real build. Logged in .planning/WINDOWS.md."
  - id: D3
    description: "verify.tsx uses OtpBoxes with true auto-submit (no Verify button anywhere in the tree), the unified danger-tinted error box + 'Send new code' CTA via mapOtpError, ResendCountdown (60s->link), and a Change-email link back to /email"
    requirement: AUTH-05
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint -- exit 0"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck -- exit 0"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile test -- exit 0, 11/11 tests (otp-error + fonts suites)"
        status: pass
      - kind: manual_procedural
        ref: "Real-device: correct code auto-submits+advances; wrong code -> unified error box + Send new code; resend countdown 60s->0 -> tappable, double-tap-safe; Change email -> /email; DE copy matches mockup (not runnable in this headless executor)"
        status: unknown
    human_judgment: true
    rationale: "The full OTP round-trip against a running dev build (real codes, real timing, real device back-navigation) cannot be exercised by this headless executor. Static verification (lint/typecheck/test) proves the code compiles, is i18n-clean, and the pure classifier is correct; the end-to-end interaction needs a human. Logged in .planning/WINDOWS.md as unrun-verify entry #7."
  - id: D4
    description: "DE catalog additions for this plan (4 new + 2 from Task 1's unified copy, 6 total new msgids) match the UI-SPEC Copywriting Contract verbatim; no msgids belonging to other in-wave plans (04-05, 04-06) were removed"
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/mobile extract -- 57/57 DE messages present, 0 missing, after every task"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint (i18next/no-literal-string) -- exit 0"
        status: pass
      - kind: other
        ref: "git diff --stat on messages.po shows only additions/obsoletions scoped to (auth)/verify.tsx and components/ — no other plan's msgids touched"
        status: pass
    human_judgment: false

# Metrics
duration: ~35min
completed: 2026-08-05
status: complete
---

# Phase 4 Plan 04: Designed OTP Screen Summary

**Expanded the tracer's plain single-TextInput OTP screen into the mockup's 6-box auto-submitting code entry — unified wrong/expired error box, 60s resend countdown, change-email link — and extracted+unit-tested `mapOtpError` (AUTH-05, the phase's error-handling requirement).**

## Performance

- **Duration:** ~35 min
- **Tasks:** 3 (all code tasks)
- **Files modified:** 9 (4 created, 5 modified)

## Accomplishments
- `lib/otp-error.ts` is a pure, zero-RN-dependency classifier (`mapOtpError`) returning a stable `OtpErrorKind` ('wrong-or-expired' | 'rate-limited' | 'network') — unit-tested with 7 assertions covering every branch including the OTP_EXPIRED/INVALID_OTP convergence and a code-vs-status precedence check. Closes the VALIDATION Wave-0 "mapOtpError untested" gap.
- `components/OtpBoxes.tsx` (first file in a new `apps/mobile/components/` directory): six fixed-width boxes reading off one real, near-invisible `TextInput` (maxLength=6, number-pad, one-time-code), auto-submitting via `onComplete` at the 6th digit; muted/non-interactive while `disabled`, danger-bordered on `hasError`, active box carries an accent border + blinking caret (RN `Animated` API, no extra dependency).
- `components/ResendCountdown.tsx`: 60s disabled "Resend in {mm:ss}" (JetBrains Mono, Timer icon) becoming a tappable "Resend code" link at 0:00; re-entrancy-guarded (a double-tap while a resend is in flight cannot fire twice); restarts its own countdown on a successful resend.
- `verify.tsx` fully restyled: `OtpBoxes` drives auto-submit (no Verify button, no "Verify"/"Verifying…" copy anywhere), a unified danger-tinted error box (headline + body) with a primary-styled "Send new code" retry CTA for the wrong/expired case, `ResendCountdown` replacing the old always-tappable link, and a "Change email" link back to `/email`. `headerShown:false` + in-body H1, bold-emphasized email in the subtitle.
- Both new ESLint's `i18next/no-literal-string` scope and Lingui's `extract` include list were extended to cover `components/**` — this phase's first component directory was invisible to both guards before this fix.
- `pnpm lint`, `pnpm typecheck`, and `pnpm test` (11/11 — the new 7-assertion otp-error suite + the existing 4-assertion fonts suite) all green for `@festipal/mobile`. Lingui catalogs: 57/57 DE messages present, 0 missing, after every task.

## Task Commits

1. **Task 1: Extract mapOtpError to a pure lib + unit test** - `8000287` (feat)
2. **Task 2: OtpBoxes + ResendCountdown components** - `b54bc4e` (feat)
3. **Task 3: Restyle verify.tsx** - `0c3b211` (feat)

**Plan metadata:** pending (this commit)

## Files Created/Modified
- `apps/mobile/lib/otp-error.ts` (created) — pure `mapOtpError(err): OtpErrorKind` classifier
- `apps/mobile/lib/__tests__/otp-error.test.ts` (created) — 7 assertions, every branch
- `apps/mobile/components/OtpBoxes.tsx` (created) — 6-box display + auto-submit + disabled/error states
- `apps/mobile/components/ResendCountdown.tsx` (created) — 60s countdown -> tappable resend, re-entrancy-guarded
- `apps/mobile/app/(auth)/verify.tsx` — full restyle: OtpBoxes + unified error box + ResendCountdown + change-email
- `apps/mobile/eslint.config.mjs` — added `components/**/*.{ts,tsx}` to the no-literal-string glob
- `apps/mobile/lingui.config.ts` — added `components` to the extract `include` list
- `apps/mobile/locales/en/messages.po` / `apps/mobile/locales/de/messages.po` — 6 new msgids (unified error headline/body, resend countdown/link, change-email, code H1, subtitle), 5 obsoleted (old Verify/Verifying/single-message/always-tappable-resend strings)

## Decisions Made
- `mapOtpError` returns a stable `OtpErrorKind` rather than a translated string — matches the plan's own offered alternative ("or returns a stable msgid key the screen maps") and keeps the pure lib importable with zero RN/Lingui setup in the node-environment Vitest runner.
- OTP_EXPIRED and INVALID_OTP remain two separate `if` branches inside `mapOtpError` (not collapsed into one `||` condition) even though both return the same kind — satisfies the plan's explicit prohibition against changing which codes are distinguished, while converging only the return values.
- The OTP subtitle is built via `t\`Six digits sent to ${email}.\`` (matching the exact Copywriting Contract msgid) then string-split around the email substring for bold emphasis, rather than Lingui's nested-`<Trans>`-component rich-text pattern — keeps the extracted msgid a flat, contract-exact string.
- Added a `resendGeneration` remount-key on `ResendCountdown` so a successful resend from EITHER affordance (the countdown's own link, or the error box's "Send new code" CTA) always leaves the visible countdown freshly reset to 60s — an unspecified edge case resolved via Claude's discretion (UI-SPEC's own loading/re-entrancy reasoning applied consistently across both resend triggers).
- Extended both `eslint.config.mjs`'s `i18next/no-literal-string` file glob and `lingui.config.ts`'s extract `include` list to cover `components/**` (Rule 2 — missing critical functionality) — this plan is the first to add a `components/` directory to `apps/mobile`, and without the fix, hardcoded strings there would have silently bypassed the same i18n guard every screen is held to.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Extended the no-literal-string ESLint glob and Lingui extract scope to cover `components/**`**
- **Found during:** Task 2, before writing `OtpBoxes.tsx`/`ResendCountdown.tsx`
- **Issue:** `apps/mobile/eslint.config.mjs`'s `i18next/no-literal-string` rule and `apps/mobile/lingui.config.ts`'s extract `include` list were both scoped to `['app', 'lib']` (Phase 3 setup, before any `components/` directory existed). Adding the first components this plan without fixing this would have let hardcoded strings inside them silently bypass the project's i18n guard and never reach the DE catalog.
- **Fix:** Added `'components/**/*.{ts,tsx}'` to the ESLint `files` glob and `'components'` to the Lingui `include` array.
- **Files modified:** `apps/mobile/eslint.config.mjs`, `apps/mobile/lingui.config.ts`
- **Commit:** `b54bc4e`

No other deviations — the rest of the plan executed as written.

## Issues Encountered
None beyond the ESLint/Lingui scope gap described above.

## User Setup Required
None — no external service configuration required.

## Manual UAT — Required, Not Run (headless executor)

Per the task's own `<human-check>` instruction and `human_verify_mode: end-of-phase` (`.planning/config.json`), the real-device OTP round-trip cannot be exercised headlessly. Recorded here and in `.planning/WINDOWS.md` (entry #7, `unrun-verify`, phase 04):

1. **Correct code:** On a dev build with Mailpit — enter the 6-digit code, confirm it auto-submits at the 6th digit (no button anywhere), the boxes go muted while the call is in flight, and the screen advances forward on success (no manual navigation).
2. **Wrong/expired code:** Enter an incorrect or stale code — confirm the single unified danger-tinted error box appears (headline + "Get a new code." body) with a "Send new code" CTA below it, and the six boxes turn danger-bordered.
3. **Resend countdown:** Let the 60s countdown run to 0:00 — confirm it becomes a tappable "Resend code" link; double-tap it rapidly and confirm only ONE send fires (re-entrancy guard) and the countdown restarts fresh at 60s.
4. **Send new code (error-box CTA):** From the wrong-code error state, tap "Send new code" — confirm the field clears, a new code is requested, and the resend countdown (if later shown) also reflects the fresh 60s state (resendGeneration consistency).
5. **Change email:** Tap "Change email" — confirm it returns to the Email screen.
6. **Pitfall 9 cases:** Wait >5 minutes before entering a code (expired case) and separately test "resend then use the first email's code" (server `resendStrategy:"reuse"`, Phase 2) — confirm the first code still works after a resend.
7. **DE copy:** Confirm every string on this screen matches the UI-SPEC Copywriting Contract verbatim in German.

## Next Phase Readiness
- **04-05 (avatar-suggestion-pipeline):** No changes to `complete-profile.tsx` this plan; unaffected.
- **04-06 (logout-deeplink-splash):** No changes to `app/_layout.tsx`'s guard or `festivals/index.tsx` this plan; `verify.tsx`'s success path still relies purely on the guard's re-resolution (no manual navigation added), preserving the contract 04-06 will extend.
- **Blocking for phase close:** The 7 manual UAT items above must be run on a real device before Phase 4 can be considered verified end-to-end for AUTH-05 — tracked in `.planning/WINDOWS.md` (entry #7, plus the 3 carried-forward entries from 04-03).

---
*Phase: 04-visitor-auth-profile-completion*
*Completed: 2026-08-05*

## Self-Check: PASSED

All created/modified files verified present on disk (`apps/mobile/lib/otp-error.ts`, `apps/mobile/lib/__tests__/otp-error.test.ts`, `apps/mobile/components/OtpBoxes.tsx`, `apps/mobile/components/ResendCountdown.tsx`, `apps/mobile/app/(auth)/verify.tsx`, `apps/mobile/eslint.config.mjs`, `apps/mobile/lingui.config.ts`, `apps/mobile/locales/en/messages.po`, `apps/mobile/locales/de/messages.po`); all three task commits (`8000287`, `b54bc4e`, `0c3b211`) verified present in git log.
