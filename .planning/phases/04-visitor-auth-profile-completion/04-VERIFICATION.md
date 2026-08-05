---
phase: 04-visitor-auth-profile-completion
verified: 2026-08-05T13:40:00Z
status: passed
score: 9/9 must-haves verified (code-level, gap-closure items behaviorally proven)
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 8/9
  gaps_closed:

    - "AUTH-04b: server-side session revocation on logout actually invalidates the session"
  gaps_remaining: []
  regressions: []
behavior_unverified_items: []
human_verification:

  - test: "Task 1 (AUTH-01 tracer): Welcome -> Email -> real OTP send -> verify -> lands in profile-setup, on a dev build with Mailpit."
    expected: "New email creates a global Account; GET /me returns profile:null; guard routes to (profile-setup)."
    why_human: "Real email delivery + device interaction; cannot be exercised headlessly. WINDOWS.md #3."

  - test: "Task 2 (IDN-01): fresh account username live-check + Done -> festivals; confirm request body is {username, displayName} only."
    expected: "Live-check idle/checking/available states render correctly; Done gated; 200 lands in festivals; no avatar field in the network body."
    why_human: "Requires a running dev build + real network inspection. WINDOWS.md #4."

  - test: "AUTH-02: a returning visitor (email with an existing VisitorProfile) lands straight in festivals after OTP, skipping (profile-setup)."
    expected: "Guard reads GET /me profile != null and routes directly to festivals."
    why_human: "Real device, two-account flow. WINDOWS.md #5."

  - test: "AUTH-03: session survives a real OS force-quit (swipe-away, not hot-reload) + relaunch, no OTP re-prompt."
    expected: "Visitor lands logged-in on festivals after relaunch."
    why_human: "Requires killing the OS process on a physical device/emulator. WINDOWS.md #6, #14."

  - test: "AUTH-05 / verify.tsx: correct code auto-submits; wrong code shows unified error box + Send new code; resend 60s->0 becomes tappable, double-tap-safe; Change email returns to Email; DE copy matches mockup."
    expected: "All described interaction states render and behave as specified."
    why_human: "Real OTP round-trip timing/gestures on-device. WINDOWS.md #7."

  - test: "Avatar picker + MMKV persistence: gallery pick + camera capture replace the initials tile; force-quit + relaunch on the same account -> photo persists; completeProfile body has no avatar field."
    expected: "Photo persists via MMKV across a real restart; no avatar leaves the device."
    why_human: "MMKV is a native Nitro TurboModule; requires a native prebuild + real device. WINDOWS.md #8."

  - test: "Username taken-state (both triggers): typed-taken username shows both Copywriting-Contract lines with a verified <=20-char suggestion; a forced completeProfile 409 shows the same UI and regenerates the suggestion."
    expected: "Both live-check and 409-triggered taken states render identically with a real available suggestion."
    why_human: "Requires forcing a live race (two devices/tabs) against the real API. WINDOWS.md #9."

  - test: "AvatarTile visual + encoding backstop: a real picked/captured photo visually replaces the initials tile (circular, r-pill); a long/multi-byte/emoji displayName does not break the tile or layout."
    expected: "Visual smoke check passes; no crash/garbled layout on edge-case displayName input."
    why_human: "Visual verification requires a rendered device screen. WINDOWS.md #10."

  - test: "AUTH-04 device UAT: tap logout icon -> Welcome; airplane-mode logout -> still Welcome; fast double-tap -> no double-fire/crash. Additionally confirm the just-revoked session can no longer authorize a protected call on the device (server-side revocation now proven headlessly, but the on-device experience remains unverified)."
    expected: "Logout is robust to offline and rapid re-tap on a real device; the server-side revocation proven headlessly (signout-origin.spec.ts) should also be observable on-device (re-using the same session token after logout fails)."
    why_human: "Requires toggling airplane mode and precise double-tap timing on-device. WINDOWS.md #11."

  - test: "Deep-link return-to (D-02/SC-5): cold deep link to festipal://festivals while logged out -> auth flow, no content leak; after OTP (+first-login profile-completion) lands on the originally-tapped route, not Home; repeat as returning user and warm-start."
    expected: "The captured destination survives the profile-completion detour and replays correctly in all four launch modes."
    why_human: "Cold vs warm deep-link launch behavior can only be observed on-device. WINDOWS.md #12."

  - test: "Splash (D-04): cold-start on cache-cleared install shows the dark brand wordmark without hanging; simulated hung/offline API falls through to Welcome within the 8s timeout."
    expected: "Splash is visually branded and cannot deadlock."
    why_human: "Requires a real cold-start + simulated network failure on-device. WINDOWS.md #13."

  - test: "Font visual UAT (WINDOWS #15 device backstop): on a real device the three brand fonts (Outfit / Plus Jakarta Sans / JetBrains Mono) visibly render on Welcome / Email / Verify / complete-profile / Festivals and the OTP-box / countdown / avatar components — not the system-font fallback."
    expected: "Custom fonts are visibly rendered, not the OS default font, across all eight restyled surfaces."
    why_human: "Font rendering is a visual property; requires a real device/simulator screen, code-level `resolveFontFamily` wiring cannot prove pixel appearance."
---

# Phase 4: Visitor Auth & Profile Completion Verification Report

**Phase Goal:** A visitor can log in passwordlessly via email-OTP, complete their profile on first
login, stay logged in across restarts, and log out — with clear, localized errors.
**Verified:** 2026-08-05
**Status:** human_needed
**Re-verification:** Yes — after gap closure (04-07-PLAN.md / 04-07-SUMMARY.md)

## Goal Achievement

This is a re-verification following gap-closure plan 04-07, which targeted the two gaps the initial
04-VERIFICATION.md found: GAP 1 (BLOCKER, AUTH-04 server-side revocation missing) and GAP 2 (WARNING,
font-family mismatch). Both are re-verified below directly against the current codebase (not trusted
from 04-07-SUMMARY.md's claims) — source read, tests independently re-run, diffs inspected for scope
creep/regression.

### Observable Truths (ROADMAP Success Criteria + merged PLAN must-haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | AUTH-01: new email -> OTP send -> verify -> creates global Account -> profile:null -> routes to profile-setup | Code: VERIFIED / Runtime: not exercised | Unchanged since prior verification; `git diff` confirms 04-07 touched none of `(auth)/index.tsx`'s or `email.tsx`'s routing/business logic — only inline `fontFamily` styling added. Real device OTP round-trip is a manual UAT (WINDOWS #3). |
| 2 | IDN-01: first login sets a required unique username (live availability) + displayName; avatar optional; returning visitor skips | Code: VERIFIED / Runtime: not exercised | `complete-profile.tsx`'s `completeProfile({body:{username,displayName}})` call unchanged (grep-confirmed, lines 180-184: `body: { username, displayName: displayNameTrimmed }`, comment reaffirms D-01 no-avatar-field). `apps/api/src/me/` untouched since Phase 02 (`git diff --name-only` empty). 44/44 API tests independently re-ran and pass. Real-device flow is a manual UAT (WINDOWS #4). |
| 3 | AUTH-02: returning visitor (existing VisitorProfile) skips profile-setup | Code: VERIFIED / Runtime: not exercised | `app/_layout.tsx`'s `Stack.Protected guard={authState.status === ...}` block is byte-identical pre/post 04-07 (diff shows only re-indentation inside the new `FontsReadyProvider` wrapper, no logic change). Manual UAT open (WINDOWS #5). |
| 4 | AUTH-03: session persists across a real force-quit + relaunch | Code: VERIFIED / Runtime: not exercised | SecureStore-backed `authClient` unchanged; `bootstrapped` gate (`localeReady && authState.status !== 'loading'`) unchanged (`git diff` confirms only the routed-tree wrapping changed, not the gate computation at line 191). Manual UAT open (WINDOWS #6, #14). |
| 5 | AUTH-04a: visitor can log out, client-side, returning to Welcome (incl. offline) | VERIFIED (code) | `festivals/index.tsx`'s logout handler (`signingOutRef`, `try/finally` -> `forceUnauthenticated()`) unchanged in logic; only inline font styling added. Manual on-device UAT still open (WINDOWS #11). |
| 6 | **AUTH-04b: logout genuinely revokes the session server-side (previously FAILED)** | **VERIFIED (closed)** | `apps/api/src/auth/auth.instance.ts` now imports `expo` from `@better-auth/expo` and appends `expo()` to the `plugins` array (line 76), alongside `emailOTP(...)`. `@better-auth/expo@1.6.25` is a declared `apps/api/package.json` dependency (matches `better-auth@1.6.25` and the existing `apps/mobile` pin — grep-confirmed both files). `apps/api/test/signout-origin.spec.ts` exists and was independently re-run in isolation (`vitest run test/signout-origin.spec.ts`): both assertions pass — (a) a session cookie + `expo-origin: festipal://` (no standard `origin`) sign-out returns non-403, and a subsequent `GET /api/v1/me` with the same cookie returns 401 (genuine server-side revocation, not just client-cache clearing); (b) the negative control (cookie, no origin/expo-origin headers) still returns 403, proving origin-check remains active and it is specifically the `expo()` translation that made (a) pass. Full `apps/api` suite independently re-run: 44/44 pass (was 42; +2 new). This is a state-transition truth and now has direct behavioral proof (a real DB-backed integration test), not just symbol presence. |
| 7 | AUTH-05: OTP wrong/expired/rate-limited/network errors show one clear, localized message each; resend + change-email work | VERIFIED (code + unit test) | `otp-error.ts`/`verify.tsx` logic unchanged by 04-07 (only inline font styling added); 19/19 mobile unit tests independently re-ran and pass. Visual/interactive on-device confirmation open (WINDOWS #7). |
| 8 | SC-5: a deep link to a protected route while logged out redirects to auth instead of leaking content, and returns to the original route after auth (surviving profile-completion) | VERIFIED (code) | `pending-destination.ts` untouched by 04-07 (`git diff --name-only` confirms zero changes); `_layout.tsx`'s capture/consume effects unchanged in logic (diff shows only the provider-wrapping change). Real cold/warm-launch UAT open (WINDOWS #12). |
| 9 | **Design-fidelity (ADR-015): all eight restyled screens apply the registered weight-specific font keys, generic-token pattern gone (previously WARNING)** | **VERIFIED (closed)** | Repo-wide `grep -RnE 'typeRoles\.[A-Za-z0-9]+\.family' apps/mobile/app apps/mobile/components` returns **zero matches** (independently re-ran, exit code 1/no output). All eight files (`(auth)/index.tsx`, `email.tsx`, `verify.tsx`, `(profile-setup)/complete-profile.tsx`, `festivals/index.tsx`, `OtpBoxes.tsx`, `ResendCountdown.tsx`, `AvatarTile.tsx`) import `resolveFontFamily`/`FONT_DISPLAY`/`FONT_BODY`/`FONT_MONO` from `lib/fonts` and `useFontsReady` from the new `lib/fonts-context.tsx`, and apply `resolveFontFamily(FONT_*, fontsReady)` inline in a style array at each `<Text>`/`<TextInput>` (grep-confirmed per file, code read for correctness). `fonts-context.tsx` exports `FontsReadyProvider`/`useFontsReady`; `_layout.tsx` wraps the routed tree in `<FontsReadyProvider ready={fontsLoaded}>` strictly AFTER the `if (!bootstrapped) return <SplashView .../>` gate (line 205 unchanged, provider added at line 208) — the splash gate is provably untouched (see D-04 regression check below). Mobile lint/typecheck/test (19/19) independently re-ran and pass. Real-device visual confirmation open (WINDOWS #15). |

**Score:** 9/9 truths verified (0 present-but-behavior-unverified)

### Required Artifacts (spot-checked against source)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/auth/auth.instance.ts` | server-side better-auth instance with `expo()` plugin | VERIFIED | `plugins: [emailOTP(...), expo()]`; import present; `trustedOrigins` block byte-identical to pre-gap-closure version |
| `apps/api/package.json` | `@better-auth/expo@1.6.25` dependency | VERIFIED | grep-confirmed, matches `better-auth`'s own pin and `apps/mobile`'s existing pin |
| `apps/api/test/signout-origin.spec.ts` | headless expo-origin sign-out + server-revocation integration spec | VERIFIED | Exists; both tests independently re-run in isolation and pass; asserts non-403, post-signout 401, and negative-control 403 exactly as must-haves specify |
| `apps/mobile/lib/fonts-context.tsx` | `FontsReadyProvider` + `useFontsReady` context | VERIFIED | Both exported; defaults to `false` outside a provider (no throw); explicit NON-BLOCKING CONTRACT comment matches D-04 |
| `apps/mobile/app/_layout.tsx` | wraps routed tree in `FontsReadyProvider`, splash gate unchanged | VERIFIED | `bootstrapped` gate computation and the `if (!bootstrapped) return <SplashView/>` line are unchanged; `FontsReadyProvider` wraps only the post-gate returned tree |
| Eight restyled screens/components | apply `resolveFontFamily(FONT_*, fontsReady)` inline | VERIFIED | All eight confirmed present, per-file grep + code read |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `apps/mobile/lib/auth-client.ts` `signOut()` | `apps/api` better-auth `/api/auth/sign-out` | HTTP POST w/ session cookie + `expo-origin` header | **WIRED (fixed)** | `expo()` server plugin translates `expo-origin` -> `origin` before origin-check; proven non-403 + genuine 401-on-/me-after by `signout-origin.spec.ts`, independently re-run and passing |
| `app/_layout.tsx` `FontsReadyProvider` | eight restyled screens | React context (`useFontsReady()`) | WIRED | Each of the eight files imports and calls `useFontsReady()`; provider feeds it `fontsLoaded` from the existing root `useAppFonts()` |
| `complete-profile.tsx` | `apiClient.completeProfile` | POST `/me/complete-profile` | WIRED (unchanged) | Body confirmed still `{username, displayName}` only — no regression |
| `festivals/index.tsx` logout | `app/_layout.tsx` guard | `forceUnauthenticated()` | WIRED (unchanged) | Logic identical to prior verification |

### Regression Checks (D-01 / D-02 / D-03 / D-04 / origin-CSRF)

| Concern | Check | Result |
|---------|-------|--------|
| D-01 (`/me/complete-profile` contract unchanged) | `git diff --name-only` on `apps/api/src/me/` between pre-04-07 and HEAD | **Zero changes** — file set untouched since Phase 02. `complete-profile.tsx`'s request body still `{username, displayName}` only (grep + read confirmed) |
| D-02 (in-memory-only deep-link destination) | `git diff --name-only` on `apps/mobile/lib/pending-destination.ts` | **Zero changes** — not in 04-07's `files_modified` list, confirmed by diff |
| D-03 (server-side name caps) | `git diff --name-only` on `packages/db/src/schema/visitor-profile.ts` | **Zero changes** — not in 04-07's `files_modified` list, confirmed by diff |
| D-04 (non-blocking splash, `bootstrapped` sole gate) | Read `_layout.tsx` lines 188-225; diff of the file | `bootstrapped` computation (line 191) and the `if (!bootstrapped) return <SplashView fontsLoaded={fontsLoaded} />` gate (line 205) are byte-identical; `FontsReadyProvider` is added strictly inside the already-gated return branch, one level of wrapping only — no new `useFonts()`-based gate |
| Origin/CSRF not weakened | Diff of `auth.instance.ts`; `trustedOrigins` array content | `trustedOrigins` array (`festipal://`, `exp://`, `exp://**`) is byte-identical. Only additions: `expo()` plugin (translates header, doesn't bypass check) and explicit `advanced: { disableOriginCheck: false }` (matches the existing implicit production default — `isTest()` is false outside tests — and only removes better-auth's own test-mode bypass; negative-control test in `signout-origin.spec.ts` independently proves origin-check is still enforced) |

No regressions found on any of the five guarded concerns.

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|-----------------|-------------|--------|----------|
| AUTH-01 | 04-03 | New email -> OTP -> Account creation -> profile-setup | SATISFIED (code); real-device UAT pending | Unchanged, re-confirmed no regression |
| AUTH-02 | 04-03 | Returning visitor skips profile-setup | SATISFIED (code); real-device UAT pending | Unchanged, re-confirmed no regression |
| AUTH-03 | 04-03, 04-06 | Session persists across force-quit | SATISFIED (code); real-device UAT pending | Unchanged, re-confirmed no regression |
| AUTH-04 | 04-06, 04-07 | Visitor can log out | **SATISFIED (code) — gap closed** | Client UX unchanged + server-side revocation now proven headlessly (`signout-origin.spec.ts`, independently re-run, passes) |
| AUTH-05 | 04-04 | OTP errors shown clearly, localized | SATISFIED (code + unit test) | Unchanged, re-confirmed no regression |
| IDN-01 | 04-01, 04-02, 04-03, 04-05 | First-login profile completion, live username check, optional avatar | SATISFIED (code); real-device UAT pending | Unchanged, re-confirmed no regression |

No orphaned requirements: all six phase requirement IDs (AUTH-01..05, IDN-01) appear in `REQUIREMENTS.md`'s
traceability table, all marked "Phase 4 / Complete" — this re-verification confirms AUTH-04 is now fully
(not partially) satisfied at the code level.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | - | No TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER found in any of the 13 files 04-07 touched | - | - |
| (none) | - | The generic `typeRoles.*.family` font-family anti-pattern (flagged in the prior verification) is now **absent** | - | Confirms GAP 2 closure |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| API typecheck | `pnpm --filter @festipal/api typecheck` | clean | PASS |
| API lint | `pnpm --filter @festipal/api lint` | clean | PASS |
| API full test suite | `pnpm --filter @festipal/api test` | 9 files, 44/44 pass | PASS |
| `signout-origin.spec.ts` in isolation | `vitest run test/signout-origin.spec.ts` | 2/2 pass (non-403 + 401-after + negative-control 403) | PASS |
| Mobile typecheck | `pnpm --filter @festipal/mobile typecheck` | clean | PASS |
| Mobile lint | `pnpm --filter @festipal/mobile lint` | clean | PASS |
| Mobile test suite | `pnpm --filter @festipal/mobile test` | 3 files, 19/19 pass | PASS |
| Generic-font-family regex scan | `grep -RnE 'typeRoles\.[A-Za-z0-9]+\.family' apps/mobile/app apps/mobile/components` | zero matches | PASS |
| WINDOWS ledger ids 2 & 15 | Read `.planning/WINDOWS.md` | both `status: fixed`, `resolved_at` populated; ids 3-14 (device UATs) remain `open` (not falsely claimed resolved) | PASS |

### Human Verification Required

12 items remain — all real-device UATs the headless executor cannot run, tracked in `.planning/WINDOWS.md`
(#3-14 for the auth/profile flows, plus the WINDOWS #15 font visual backstop which was newly re-flagged in
04-07-PLAN's own must-haves as `verification: backstop`, and the WINDOWS #11 logout device backstop). See
the `human_verification` list in this document's frontmatter for the full itemized list with expected
outcomes. Note: the underlying server-side revocation defect that WINDOWS #11 originally exposed a risk
around is now closed at the code level (proven by `signout-origin.spec.ts`) — #11 remains open only for
the on-device airplane-mode/double-tap interaction backstop, not because the revocation mechanism itself
is unproven.

### Gaps Summary

Both gaps from the prior 04-VERIFICATION.md are closed and independently re-verified against the current
codebase (not trusted from SUMMARY prose):

- **GAP 1 (BLOCKER, AUTH-04 server revocation)** — CLOSED. `expo()` plugin installed and wired;
  `@better-auth/expo@1.6.25` a declared `apps/api` dependency; `signout-origin.spec.ts` independently
  re-run and passes all three required assertions (non-403 accept, genuine 401-after, negative-control
  403). Full API suite green (44/44).

- **GAP 2 (WARNING, font-family mismatch)** — CLOSED. Generic-token pattern has zero remaining matches
  across `apps/mobile/app` + `apps/mobile/components`; all eight screens/components apply
  `resolveFontFamily(FONT_*, fontsReady)` inline, fed by a new shared `FontsReadyProvider`/`useFontsReady`
  context that does not disturb the `bootstrapped` splash gate. Full mobile suite green (19/19).

No regressions: D-01 (`/me/complete-profile` contract), D-02 (in-memory deep-link destination), D-03
(server-side name caps), and D-04 (non-blocking splash, `bootstrapped` as sole gate) are all confirmed
byte-identical or file-untouched via targeted `git diff`. Origin/CSRF hardening was not weakened —
`trustedOrigins` is unchanged, and the one additional config line (`advanced.disableOriginCheck: false`)
matches the existing implicit production behavior and is itself proven active by the negative-control
test.

The phase's code-level completeness is now fully verified (9/9 truths). The remaining blocker to a clean
`passed` status is exclusively the pre-existing set of real-device UATs that a headless environment cannot
exercise — legitimately routed to human verification per the escalation-gate pattern, not silently passed.
These are the same category of item WINDOWS.md has tracked since initial Phase-4 verification; none are
new gaps introduced by 04-07.

---

*Verified: 2026-08-05*
*Verifier: Claude (gsd-verifier)*
