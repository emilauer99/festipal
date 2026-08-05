---
phase: 04-visitor-auth-profile-completion
plan: 06
subsystem: mobile-auth
tags: [react-native, expo-router, expo-linking, lingui, better-auth, festipal-ui, splash]

# Dependency graph
requires:
  - phase: 04-03
    provides: the exact Phase 3 four-state guard contract (app/_layout.tsx) this plan extends without rebuilding
  - phase: 04-01
    provides: apps/mobile Vitest runner + non-blocking font module (lib/fonts.ts, never previously called)
provides:
  - "Icon-only, neutral, non-re-entrant logout control on the Festivals header (AUTH-04), offline-safe via a new forceUnauthenticated() guard singleton"
  - "Deep-link return-to (D-02/SC-5): lib/pending-destination.ts in-memory capture/replay, wired into app/_layout.tsx as the first effect (Pitfall 2), replaying only on the transition INTO 'authenticated' so it survives profile-completion"
  - "Non-blocking brand splash (D-04): dark bgAppDeep + Outfit wordmark via the first real call site of useAppFonts(), plus an 8s cold-start resolve timeout/fallback (Pitfall 5 backstop)"
affects: [phase-05, phase-06]

# Actuals (#2632)
actuals:
  tokens: 4312
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-level in-memory singleton (pending-destination.ts) mirroring app/_layout.tsx's existing notifyMeMightHaveChanged/refreshAuthState idiom, extended a second time for forceUnauthenticated()"
    - "Guard-state transitions (not booleans) drive one-shot effects: the deep-link replay effect depends only on authState.status, so it naturally fires once per VALUE transition (e.g. into 'authenticated'), not on every re-render"
    - "Cold-start deadlock backstop: a single setTimeout forcing 'loading' -> 'unauthenticated' after a bound, independent of WHERE the hang occurs (SecureStore read or GET /me)"

key-files:
  created:
    - apps/mobile/lib/pending-destination.ts
  modified:
    - apps/mobile/app/_layout.tsx
    - apps/mobile/app/festivals/index.tsx
    - apps/mobile/locales/en/messages.po
    - apps/mobile/locales/de/messages.po

key-decisions:
  - "Added forceUnauthenticated() as a new module-singleton export from app/_layout.tsx (not in the plan's own <files> list for Task 1) — required because better-auth's client only broadcasts its session-changed signal on a SUCCESSFUL signOut() response; an offline signOut() never touches the SecureStore cookie, so without a direct guard override the visitor would stay 'authenticated' and be stranded on the Festivals screen (Rule 2 — missing critical functionality for the logout-robustness backstop)"
  - "Deep-link capture/exclusion filters by the ACTUAL resolved route path ('', 'email', 'verify', 'complete-profile'), not by the (auth)/(profile-setup) folder names — Expo Router's parenthesized route groups never appear in the resolved URL, so filtering on the group name would never match anything"
  - "Cold-start resolve timeout set to 8000ms (Claude's discretion, UI-SPEC backstop; no exact value specified) — forces authState from 'loading' to 'unauthenticated' via a functional setState update so a late-arriving real result (if the network wasn't actually dead) can still win if it resolves after the guard already fell through"
  - "Splash restyle keeps `bootstrapped` as the exclusive gate for both `SplashScreen.hideAsync()` and the JS branch decision, per the plan's CRITICAL instruction — only the PRESENTATION rendered during that hold changed (null -> SplashView); this is coupled to a known limitation, see Known Gaps below"

patterns-established:
  - "app/_layout.tsx module-singleton escape hatches (refreshAuthState, forceUnauthenticated) as the established way for a leaf screen to drive the root guard without a global state library"

requirements-completed: [AUTH-04, AUTH-03]

coverage:
  - id: D1
    description: "Icon-only neutral LogOut control on the Festivals header; authClient.signOut() is non-re-entrant (signingOutRef guard) and reaches Welcome even if the network call fails, via the new forceUnauthenticated() guard override"
    requirement: AUTH-04
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint (no-literal-string) -- exit 0"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck -- exit 0"
        status: pass
      - kind: manual_procedural
        ref: "WINDOWS.md unrun-verify: tap logout -> Welcome; airplane-mode logout -> Welcome; fast double-tap -> no double-fire (not runnable in this headless executor)"
        status: unknown
    human_judgment: true
    rationale: "Real signOut() network behavior (online success, offline failure, and rapid double-tap timing) cannot be exercised without a running dev build/device. Static analysis proves the code compiles and the re-entrancy guard + fallback path exist; the actual runtime behavior needs a human on-device. Recorded in .planning/WINDOWS.md."
  - id: D2
    description: "Deep-link return-to: a logged-out tap/cold-launch into a protected route redirects into auth with no content leak; after OTP (and profile-completion on first login) the app lands on the originally-requested route, not Home; the capture effect is the first effect declared and is ungated by locale/session bootstrap"
    requirement: AUTH-03
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint (no-literal-string) -- exit 0"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck -- exit 0"
        status: pass
      - kind: manual_procedural
        ref: "WINDOWS.md unrun-verify: cold deep link to festipal://festivals while logged out, through OTP + first-login profile-completion, and as a returning user + warm-start (not runnable in this headless executor)"
        status: unknown
    human_judgment: true
    rationale: "This is the plan's own flagged [ASSUMED] synthesized pattern (RESEARCH.md Pattern 4, no official Expo Router API) — its correctness on a real cold-launched deep link (vs. a warm/backgrounded one) can only be proven on-device. Code-level: the capture effect is verifiably the first effect declared and depends on Linking.useLinkingURL() (confirmed via the installed expo-linking .d.ts to return the initial URL immediately); the replay effect verifiably depends only on authState.status, firing on the VALUE transition into 'authenticated'. Recorded in .planning/WINDOWS.md."
  - id: D3
    description: "Splash restyled to dark bgAppDeep + Outfit wordmark (system-font fallback via the first real useAppFonts() call site); bootstrapped stays the sole splash-hide gate, no useFonts()-based gate added; 8s cold-start resolve timeout forces the guard through if session/GET-me never settles"
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint (no-literal-string) -- exit 0"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck -- exit 0"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile test -- 19/19 pass (unrelated font/username-suggestion suites, unchanged)"
        status: pass
      - kind: manual_procedural
        ref: "WINDOWS.md unrun-verify: cold-start visual check + simulated hung-API timeout fallback + force-quit persistence re-confirm after this plan's guard changes (not runnable in this headless executor)"
        status: unknown
    human_judgment: true
    rationale: "Code-level: `bootstrapped = localeReady && authState.status !== 'loading'` is verifiably unchanged as the sole SplashScreen.hideAsync()/branch gate — grep confirms no useFonts()-derived condition was added anywhere near it. The VISUAL result (does the dark wordmark actually appear, does the timeout actually unblock a simulated hang) needs a device. See Known Gaps below for a documented limitation on how visible this restyle actually is given the native OS splash screen is unchanged this plan. Recorded in .planning/WINDOWS.md."

# Metrics
duration: ~35min
completed: 2026-08-05
status: complete
---

# Phase 4 Plan 06: Logout, Deep-Link Return-To, Splash Restyle Summary

**Icon-only offline-safe logout (AUTH-04), a synthesized deep-link "return-to" mechanism that survives profile-completion (D-02/SC-5), and a non-blocking brand-token splash with a cold-start deadlock timeout (D-04) — closing out the phase's session-lifecycle and navigation surface on the Phase 3 four-state guard.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-08-05T10:16Z
- **Completed:** 2026-08-05T10:20Z
- **Tasks:** 3
- **Files modified:** 5 (1 created, 4 modified)

## Accomplishments
- `app/festivals/index.tsx` header now carries a neutral, icon-only `LogOut` control (Lucide, 44px hit target, no confirmation dialog) with a non-re-entrant `signOut` handler; hard-coded hex styles on this screen were replaced with real `@festipal/ui` tokens while in the file.
- `app/_layout.tsx` gained a new `forceUnauthenticated()` module-singleton export so a failed/offline `signOut()` still reaches Welcome — better-auth's client only fires its own session-changed broadcast on a successful response.
- `lib/pending-destination.ts` is a new in-memory module singleton (`capturePendingDestination`/`consumePendingDestination`) — no MMKV/SecureStore, per D-02's reversibility note.
- `app/_layout.tsx`'s deep-link capture effect is the literal first effect declared in `RootLayout`, keyed off `Linking.useLinkingURL()` and gated to `unauthenticated`; it filters out the auth/profile-setup flow's own resolved paths (`''`, `email`, `verify`, `complete-profile` — route groups never appear in the URL). The consume+replay effect fires only on the value-transition into `'authenticated'`, never `'authenticated-no-profile'`, and only after the guard has independently reached that state (no bypass).
- `app/_layout.tsx`'s splash-hold now renders a `SplashView` (dark `bgAppDeep` + "festipal." wordmark in Outfit, falling back to the system font) instead of `null` — this is the first real call site of `useAppFonts()` anywhere in the app. `bootstrapped` remains the sole gate for both `SplashScreen.hideAsync()` and the render branch; a new 8-second `setTimeout` backstop forces the guard from `'loading'` to `'unauthenticated'` if session/`GET /me` resolution never settles.
- `pnpm lint` (incl. `i18next/no-literal-string`), `pnpm typecheck`, and `pnpm test` (19/19) all green for `@festipal/mobile` after all three tasks.

## Task Commits

1. **Task 1: Icon-only logout control on the Festivals header (robust, non-re-entrant)** - `2b4d2c2` (feat)
2. **Task 2: Deep-link return-to — capture + replay through profile-completion (D-02 / SC-5)** - `aac8f51` (feat)
3. **Task 3: Non-blocking brand splash restyle + cold-start resolve timeout** - `3adcc51` (feat)

**Plan metadata:** pending (this commit)

## Files Created/Modified
- `apps/mobile/lib/pending-destination.ts` (created) - in-memory module singleton, capture/consume
- `apps/mobile/app/_layout.tsx` - `forceUnauthenticated()` singleton, deep-link capture/consume effects, cold-start resolve timeout, `SplashView` (dark bgAppDeep + Outfit wordmark, non-blocking)
- `apps/mobile/app/festivals/index.tsx` - icon-only logout control, real `@festipal/ui` tokens replacing remaining hard-coded hex
- `apps/mobile/locales/en/messages.po` / `apps/mobile/locales/de/messages.po` - 1 new msgid ("Log out" / "Abmelden", UI-SPEC Copywriting Contract verbatim)

## Decisions Made
- `forceUnauthenticated()` added to `app/_layout.tsx` even though Task 1's own `<files>` line only listed `festivals/index.tsx` + locale files — the offline-signOut backstop is unreachable without a way to override the guard directly, since the guard's own `resolveAuthState` effect only reacts to `session`/`sessionPending` changes, which an offline `signOut()` never produces. Documented as a Rule 2 (missing critical functionality) auto-fix.
- The deep-link exclusion list (`AUTH_FLOW_PATHS`) filters on the RESOLVED route path (`''`, `'email'`, `'verify'`, `'complete-profile'`), not the `(auth)`/`(profile-setup)` folder names — verified via Expo Router's own semantics that parenthesized route groups are stripped from the URL entirely, so a folder-name filter would silently never match and the "never capture an (auth) href" rule would be a no-op.
- Cold-start resolve timeout set at 8000ms via a single `setTimeout` keyed to `authState.status === 'loading'`, using a functional `setAuthState` update so it only overrides if still stuck (a late-arriving real result after the timeout still applies cleanly, no double-set race).
- Splash-hide mechanism (`bootstrapped` + `SplashScreen.hideAsync()` timing) was left byte-for-byte unchanged per the plan's CRITICAL instruction — only the JS content rendered during that hold changed. See Known Gaps below for the resulting visibility caveat.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added `forceUnauthenticated()` guard-override singleton**
- **Found during:** Task 1 (logout control)
- **Issue:** better-auth's Expo client only broadcasts its `$sessionSignal` update from the `onSuccess` hook of `/sign-out` (confirmed by reading `node_modules/better-auth/dist/client/config.mjs`'s `atomListeners` matcher) — an offline/failed `signOut()` call never touches the SecureStore-cached cookie, so the guard's own `resolveAuthState` effect (which only reacts to `session`/`sessionPending` changes) would never re-run and the visitor would stay stranded on the Festivals screen, violating the plan's own explicit backstop truth ("a failed/offline signOut() still clears the local session and reaches Welcome").
- **Fix:** Added a `forceUnauthenticated()` module-singleton export from `app/_layout.tsx` (mirroring the existing `refreshAuthState()` idiom), called unconditionally in the logout handler's `finally` block so both the success and failure paths land on Welcome.
- **Files modified:** `apps/mobile/app/_layout.tsx`, `apps/mobile/app/festivals/index.tsx`
- **Verification:** `pnpm typecheck`/`pnpm lint` pass; code-level trace confirms `Stack.Protected guard={authState.status === 'unauthenticated'}` reacts to the direct `setAuthState` call regardless of the underlying SecureStore cookie's actual value.
- **Committed in:** `2b4d2c2` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing critical functionality)
**Impact on plan:** Necessary for the plan's own explicit logout-robustness backstop truth to actually hold; no scope creep beyond the one small singleton export this required.

## Issues Encountered

- **Splash visibility caveat (Known Gap, not a bug):** the plan's file scope for Task 3 is `apps/mobile/app/_layout.tsx` only — no `app.json`/native-launch-screen asset change was in scope. Since `SplashScreen.preventAutoHideAsync()`/`hideAsync()` timing is unchanged (per the plan's own CRITICAL instruction to keep `bootstrapped` as the sole gate for BOTH decisions), the native OS splash screen (Expo's default, unbranded) visually occludes the new JS `SplashView` for the entire hold duration on a real device — the dark-bgAppDeep+wordmark content is correctly implemented and IS what renders during the hold, but a user may only perceive it during the brief native-to-JS handoff transition, not as a persistently visible branded loading screen. This matches UI-SPEC's own framing that the splash restyle is "recommended... but not required to satisfy any Phase 4 success criterion" (## UI Considerations). A full native-level fix (app.json splash `backgroundColor`/asset) is a natural follow-up, out of this plan's file scope.
- **Pre-existing gap now load-bearing (WINDOWS.md #2, not fixed this plan):** `apps/api/src/auth/auth.instance.ts` is still missing the `@better-auth/expo` server-side `expo()` plugin (flagged since Phase 3, explicitly noting "must be added before any session-revocation/logout feature ships" — this plan IS that feature). Without it, the mobile client's `authClient.signOut()` POST may be rejected by the server's origin/CSRF check on a real device, meaning the session might not be genuinely revoked server-side even though the client-side `forceUnauthenticated()` backstop still correctly reaches Welcome. Left unfixed because it requires a cross-package change to `apps/api` (a new dependency + backend restart) outside this plan's `apps/mobile`-only file scope; the client-side UX is not broken (Welcome is always reached), only the server-side revocation guarantee is incomplete until that plugin lands. Still tracked as WINDOWS.md id 2.
- **Pre-existing font-family mismatch discovered (WINDOWS.md new todo entry, not fixed this plan):** `useAppFonts()` had never been called anywhere in the app before this plan (now wired in `app/_layout.tsx` for the `SplashView`'s wordmark) — meaning the three Google Fonts were never actually loaded at all. Separately, the Welcome/verify/complete-profile screens set `fontFamily` to the generic `typeRoles.*.family` name (`'Outfit'`, `'Plus Jakarta Sans'`, `'JetBrains Mono'`) rather than the specific registered key (e.g. `FONT_DISPLAY = 'Outfit_700Bold'`) — so even now that fonts load, those screens still silently render in the system-font fallback. This plan's own `SplashView` correctly uses `resolveFontFamily(FONT_DISPLAY, fontsLoaded)`; the other screens are out of this plan's file scope. Logged as a new WINDOWS.md `todo` entry for a follow-up pass.

## User Setup Required
None - no external service configuration required.

## Manual UAT — Required, Not Run (headless executor)

Per the plan's own instructions, these cannot be exercised without a real device/emulator and are recorded here for the end-of-phase verifier (`human_verify_mode: end-of-phase`). All four are also logged in `.planning/WINDOWS.md` as `unrun-verify` entries:

1. **Task 1 (AUTH-04):** Festivals header shows the neutral logout icon; tap → returns to Welcome. Enable airplane mode, tap logout → still returns to Welcome (local session cleared via `forceUnauthenticated()`). Fast double-tap → no double-fire/no crash.
2. **Task 2 (D-02/SC-5):** Force-quit, then cold deep link to `festipal://festivals` while logged out → lands in the auth flow with no content flash. Complete OTP + (first login) profile-completion → lands on the originally-tapped route, not Home. Repeat as a returning user (no profile step) and as a warm start (app already backgrounded) → same result both times.
3. **Task 3 (D-04):** Cold-start on a cache-cleared install → splash shows the dark brand wordmark and does not hang noticeably longer than Phase 3's baseline. Simulate a hung/offline API on cold start → the splash falls through to Welcome within the 8s timeout, not a deadlock.
4. **AUTH-03 re-confirmation (Pitfall 1 method):** Log in, log out, log back in, force-quit the OS process, relaunch from the home-screen icon → lands logged-in, no OTP re-prompt — confirming this plan's guard additions (deep-link effects, resolve timeout) did not regress session persistence.

## Next Phase Readiness
- **Phase 4 close-out:** this was the phase's last plan (6 of 6). All three of AUTH-04's remaining scope, D-02/SC-5's deep-link return-to, and D-04's splash restyle are code-complete; the phase's four manual-UAT backlog (this plan's 4 items plus 04-03/04-04/04-05's prior 6 items, all in `.planning/WINDOWS.md`) must be run on a real Android device before the phase can be considered end-to-end verified, per `human_verify_mode: end-of-phase`.
- **Known Gaps carried forward:** the `apps/api` `expo()` server plugin gap (WINDOWS.md id 2) and the cross-screen font-family-name mismatch (new WINDOWS.md todo) are both real, tracked follow-ups outside this plan's `apps/mobile`-only scope — neither blocks this plan's own deliverables, but both should be picked up early in Phase 5 or a dedicated hardening pass.
- **Phase 5/6:** the guard in `app/_layout.tsx` now has three module-singleton escape hatches (`refreshAuthState`, `forceUnauthenticated`, plus the deep-link capture/replay pair) — this is the established pattern for any future screen that needs to drive the root guard without a global state library.

---
*Phase: 04-visitor-auth-profile-completion*
*Completed: 2026-08-05*

## Self-Check: PASSED

All created/modified files verified present on disk (`apps/mobile/lib/pending-destination.ts`, `apps/mobile/app/_layout.tsx`, `apps/mobile/app/festivals/index.tsx`, `apps/mobile/locales/en/messages.po`, `apps/mobile/locales/de/messages.po`); all three task commits (`2b4d2c2`, `aac8f51`, `3adcc51`) verified present in git log.
