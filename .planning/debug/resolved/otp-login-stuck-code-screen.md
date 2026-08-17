---
status: resolved
trigger: "es kommt jetzt immer vor, dass wenn ich mich einlogge und den richtigen code eingebe, ncihts passiert. ich bliebe also am Code eingeben screen stecken. Die Authentifizierung dürfte jedoch erfolgreich verlaufen, wenn ich die app nämlich neu starte, bin ich in den Festival bzw Home screen."
created: 2026-08-16
updated: 2026-08-17
resolved: 2026-08-17
mode: find_and_fix
branch: fix/otp-relogin-session-signal
fix_commit: 820eede
rounds: 4
---

## Symptoms

DATA_START
- **Expected:** After entering the correct OTP code on the code-entry screen, the app navigates to the festival/home screen.
- **Actual:** Nothing happens — the app stays stuck on the code-entry screen. Authentication itself appears to succeed: after force-quitting and relaunching the app, the user is logged in and lands on the festival/home screen.
- **Errors:** None visible in the app (no toast/alert, no hanging spinner reported). Metro/dev logs not yet checked.
- **Timeline:** Unclear when it started; user says "jetzt immer" (now always). Login flow worked in earlier phases (phase 5 UAT passed on-device).
- **Reproduction:** 100% — every login attempt gets stuck on the code screen. Environment: Expo dev client on Android device (expo run:android from apps/mobile), local API on port 8081, OTP test codes read from Mailpit (localhost:8025).
DATA_END

## Current Focus

CLOSED — root cause confirmed, fix applied, on-device verification PASSED, session archived.

state: >
  RESOLVED 2026-08-17. Root cause CONFIRMED and mutation-tested (see Evidence 2026-08-17
  "falsification"); fix committed as `820eede` on `fix/otp-relogin-session-signal`;
  on-device verification PASS (user: "passt") after one stale-bundle false alarm.
  All `[OTP-DEBUG]` instrumentation removed — `git diff 820eede` on the two probed files
  is EMPTY, `grep -rn "OTP-DEBUG" apps/mobile` returns zero hits, and
  `lib/otp-debug-atoms.ts` is deleted. Clean-tree gates re-run after probe removal:
  typecheck PASS, lint PASS, vitest 392/392 PASS (33 files) — no regression.

next_action: >
  None. Session archived to `.planning/debug/resolved/`; knowledge-base entry written to
  `.planning/debug/knowledge-base.md`. Shipping the branch is the orchestrator's call
  (no PR opened by this session).

--- ROUND 4 (fix applied; superseded as the ACTIVE focus, kept as the record) ---

state: >
  Root cause CONFIRMED and mutation-tested (see Evidence 2026-08-17 "falsification").
  Fix committed as `820eede` on branch `fix/otp-relogin-session-signal` (fix only —
  no instrumentation, no temp files). `apps/mobile`: typecheck PASS, lint PASS,
  vitest 392/392 PASS (was 384 — +8 new regression tests).

what_was_applied: >
  LAYER 1 (root cause) `lib/auth-client.ts`: `authClient.$store.listen('session', () => {})`
    at module init keeps the session atom's `lc` non-zero, so nanostores' deferred
    unmount never runs and the re-entrancy can never trigger.
  LAYER 2 (independence) `lib/auth-state.ts` `nextAuthResolveStep()` + `app/_layout.tsx`:
    the guard resolves from `authClient.getCookie()` (written synchronously before
    better-auth notifies) with `GET /me` as the authority — no longer from the session
    atom alone. `app/(auth)/verify.tsx` calls `refreshAuthState()` on a successful
    sign-in: the login counterpart to logout's existing `forceUnauthenticated()`.
  NOT applied: the optional `mehr.tsx` sign-out hardening — its motivation was
    superseded (see Evidence "round-2 sign-out inference RETRACTED").

device_probes_left_in_working_tree: >
  UNCOMMITTED, trimmed to the fix's success signals only:
    - `lib/otp-debug-atoms.ts` (untracked) — `logAtomSnapshot`, `logResolveStep`
    - `app/_layout.tsx` — `atoms root-mount` (signalListeners must now be >= 1),
      `resolve {step, cookieLen}`, `getMe {status}`
    - `app/(auth)/verify.tsx` — `verify signIn OK -> refreshAuthState()`
  Removal before archiving: `grep "\[OTP-DEBUG\]" apps/mobile` + delete
  `lib/otp-debug-atoms.ts`. The round-2/3 temp files (`otp-relogin-session-signal.repro.ts`,
  `vitest.repro.config.ts`) are already gone; the harness became a real suite test.

next_action: >
  Await the German on-device verification (reload -> logout -> re-login on
  `npx expo start -c`). On PASS: remove probes, archive to `.planning/debug/resolved/`,
  append the knowledge-base entry, open a PR from `fix/otp-relogin-session-signal`.
  On FAIL: the `[OTP-DEBUG] resolve` + `getMe` lines localize which layer did not fire.

--- ROUND 3 (root cause found; superseded as the ACTIVE focus, kept as the record) ---

gate_correction: >
  The orchestrator's read said "G2 eliminated, G3 confirmed". READING THE PROBE SOURCE FALSIFIES
  THAT. `watchSessionSignal()` (lib/otp-debug-atoms.ts:78) SUBSCRIBES to `$sessionSignal` itself,
  and `_layout.tsx:286-287` runs `logAtomSnapshot('root-mount')` BEFORE `watchSessionSignal()`.
  So: `signalListeners: 0` at root-mount is the count BEFORE our probe attaches, and every later
  `signalListeners: 1` is OUR PROBE AND NOTHING ELSE. better-auth's own
  `$sessionSignal -> fetchSession` subscription (`session-refresh.mjs:69-73`) is ABSENT for the
  entire post-reload JS session. => G2 is the true gate, not G3. The refetch is never SCHEDULED
  (nothing is listening), not swallowed in flight — which is also why `pending`/`refetching` stay
  false and why the +3000ms sample shows nothing.

decisive_datum: >
  root-mount: `sessionListeners: 1` AND `signalListeners: 0`, simultaneously.
  nanostores 1.4.2 `onMount` (lifecycle/index.js) runs the mount callback SYNCHRONOUSLY inside
  `listen()` BEFORE `lc` is incremented, and better-auth's session mount callback calls
  `refreshManager.init()` -> `setupSignalSubscription()` -> `$sessionSignal.listen(...)`.
  So `session.lc === 1` with `signal.lc === 0` is only reachable if React's subscribe took the
  `if (!$store.lc && !$store.active)` branch as FALSE — i.e. `$store.active === true` while NO
  refreshManager is alive. That state is unrecoverable for the process lifetime: `active` is only
  reset by the deferred-unmount timer, which requires `!$store.lc` — and React is permanently
  subscribed.

hypothesis: >
  RE-ENTRANT REMOUNT DURING NANOSTORES' DEFERRED UNMOUNT leaves the session atom permanently
  `active: true` with its refreshManager torn down. Chain:
    1. `expoClient.getActions()` (client.js) runs at `createAuthClient()` MODULE-INIT time and, when
       a valid cached session exists in SecureStore, does `sessionAtom.set({ ...sessionAtom.get(), ...})`.
       `atom.get()` lazy-MOUNTS (`atom/index.js: if (!$atom.lc) $atom.listen(()=>{})()`), so the
       session atom mounts and unmounts again with NO subscriber -> `off()` arms the 1000ms
       STORE_UNMOUNT_DELAY timer. mount#1 also armed `setTimeout(fetchSession, 0)`, which sets
       `abortController` and never clears it on success.
    2. If React's ONE `useSession()` subscription attaches LATER than that 1000ms, the unmount
       callback runs: `$store.active = false`, then `for (destroy of events[UNMOUNT]) destroy()`.
    3. better-auth's destroy calls `settleAbortedFetch(controller)`, whose FIRST statement is
       `const current = session.get()` (session-atom.mjs:39) — a `get()` on an atom that is at that
       instant `lc === 0` and `active === false`. That RE-MOUNTS it mid-unmount: `active = true`,
       mount#2 creates refreshManagerB and subscribes the signal, pushing destroy_B onto the SAME
       array the `for...of` is iterating.
    4. The loop therefore also runs destroy_B -> `refreshManagerB.cleanup()` -> the signal
       subscription is removed again — but `active` stays TRUE (it was set to false before the
       loop, then back to true by the re-entrant mount, and is never re-cleared).
    => session atom permanently `active` with zero signal listeners. Every later `listen()` skips
    the mount callback. `$sessionSignal` toggles are delivered to nobody. Only DIRECT `.set()`
    calls (expo's `clearSessionCache` on sign-out) still reach the UI — exactly the device log's
    "one delivery at logout, none ever after".
  category spread (Ishikawa): code/library-interaction (nanostores re-entrancy) + data (a VALID
    CACHED SESSION must exist at boot, else `getActions` never calls `get()`) + environment
    (boot timing must land the React subscribe after the 1000ms window).
  and_gate: YES — needs cached-session-at-boot AND React subscribing inside the corrupt window.
    That is why it is intermittent and why "different e-mail" was coincidental.

test: >
  NODE LIFECYCLE SWEEP. Drive the REAL client with a warm SecureStore seed and vary ONLY the delay
  between module init and the React-equivalent `sessionAtom.listen(...)`, sampling
  `session.lc` / `session.active` / `$sessionSignal.lc` continuously. Prediction: a delay band
  exists (starting at ~1000ms) where subscribing yields `signalLc === 0` and a subsequent sign-in
  triggers NO `GET /get-session`. Round 2's variant C used bootDelay 1300 and PASSED, so either
  the band is narrower/elsewhere than assumed or the mechanism is wrong — the sweep discriminates.

experiment_result: >
  REPRODUCED IN NODE, exact device fingerprint. `lib/__tests__/otp-mount-lifecycle.repro.ts`,
  warm SecureStore seed, boot=1010ms/latency=0:
    t=1059 poll          sessionLc=0 sessionActive=true  signalLc=1
    t=1060 pre-subscribe sessionLc=0 sessionActive=true  signalLc=0   <- unmount cascade ran
    t=1060 post-subscribe sessionLc=1 sessionActive=true signalLc=0   <- mount callback SKIPPED
    signalLcAfterSubscribe=0  refetchedAfterRelogin=false  finalUser=null
    requests=["POST /sign-in/email-otp"]   (NO GET /get-session)  deliveries=[]
  `sessionActive === true` WITH `signalLc === 0` is the re-entrancy signature: `active` was set
  false before the destroy loop and set back to true by the re-entrant `session.get()`, while the
  loop went on to tear down the freshly created refreshManager.
  WINDOW WIDTH (busy-boot run, 800ms blocked JS thread): the corrupt state persisted from
  t=1231 to t=2007 — ~780ms, i.e. the window is as wide as the gap between the FIRST deferred-
  unmount timer (armed by `getActions`' `get()`) and the SECOND one (armed by `fetchSession`'s own
  `session.get()`, which cannot run until the JS thread frees up). On a real Expo boot that gap is
  the module-eval/first-render busy period — hundreds of ms — which is why the device hits it and
  round 2's idle-thread harness (gap ~1ms) did not.
  ROUND-2 HARNESS EXONERATED: its variants missed the window by milliseconds, they did not
  disprove the mechanism.

production_reachability: >
  REACHABLE IN PRODUCTION — not a dev-only artifact. Every ingredient is a release-build path:
  `expoClient.getActions()`'s cache hydration, nanostores' STORE_UNMOUNT_DELAY, and React's
  `useSession()` subscription landing >1000ms after `lib/auth-client.ts` module-eval. Required
  precondition: the app boots WITH a valid cached session (a returning logged-in visitor) —
  which is also why a first login after a cold logged-out start never fails.
  A Metro reload merely re-rolls the boot timing cheaply and often, which is why the user only
  noticed it there. Sized as a real fix, not a dev workaround.

reasoning_checkpoint:
  hypothesis: >
    `@better-auth/expo`'s `getActions()` calls `sessionAtom.get()` at createAuthClient() module-init
    when a cached session exists; nanostores' `get()` lazy-mounts, so the atom mounts and unmounts
    with no subscriber and arms the 1000ms STORE_UNMOUNT_DELAY timer. If React's ONE `useSession()`
    subscription attaches after that timer fires, the unmount destructor calls
    `settleAbortedFetch()` -> `session.get()`, which RE-MOUNTS the atom mid-unmount; the newly
    pushed destructor is executed by the same still-running `for...of` (arrays grow during
    iteration), tearing the fresh refreshManager down again while `$store.active` is left `true`.
    From then on every `listen()` skips the mount callback, `$sessionSignal -> fetchSession` is
    never subscribed, and NO session refetch happens for the rest of the JS context.
  confirming_evidence:
    - "Device: `sessionListeners: 1` with `signalListeners: 0` at root-mount, measured BEFORE the probe's own listener attached (_layout.tsx:286 runs before :287)."
    - "Node repro produces byte-for-byte the same triple: sessionLc=1, sessionActive=true, signalLc=0, and no GET /get-session after re-login."
    - "Device logout emitted exactly ONE session-atom delivery (expo's direct `clearSessionCache` .set()) and zero fetch-driven ones — the round-2 harness's signature for a dead signal subscription."
    - "Source: session-atom.mjs:39 `settleAbortedFetch` opens with `session.get()`; lifecycle/index.js runs destroys in a `for...of` over the same array the re-entrant mount pushes into, and never re-clears `active` afterwards."
  falsification_test: >
    If the mechanism were wrong, pinning a listener on the session atom at module-init would NOT
    prevent it, and the node repro would still show signalLc=0 after subscribe. It must flip to
    signalLc>=1 with a GET /get-session after re-login.
  fix_rationale: >
    Two layers. (1) ROOT-CAUSE: keep the session atom permanently mounted from module-init
    (`authClient.$store.listen('session', ...)`, better-auth's public store API) so the deferred
    unmount never fires and the re-entrancy can never trigger. (2) INDEPENDENCE: stop making the
    post-OTP transition depend on the session atom at all — resolve auth from
    `authClient.getCookie()` (written to SecureStore synchronously BEFORE better-auth notifies) and
    let `GET /me` be the authority, with `verify.tsx` calling the existing `refreshAuthState()` on
    a successful sign-in. (2) mirrors the `forceUnauthenticated()` precedent and is correct
    whichever library-internal step stalls, so the app survives even if (1) is ever undone.
  blind_spots:
    - "The pin uses `authClient.$store` — public per better-auth docs but not covered by its .d.mts guarantees; a future rename degrades it silently. Layer (2) is what makes that non-fatal."
    - "Not yet observed on device: whether `refreshAuthState()` from verify.tsx fires before the cookie is readable. The round-2 device log's `atoms AFTER-signIn cookieLen:103` says it is already written when the await resolves, but that is one sample."
    - "Whether any OTHER better-auth atom in this app is subject to the same lazy-mount race (only `session` is consumed today)."
  candidate_causes:
    - "code: nanostores/better-auth re-entrancy in the deferred-unmount destructor (CONFIRMED)"
    - "data: a valid cached session must exist in SecureStore at boot, else getActions never calls get() (CONFIRMED as a required precondition)"
    - "environment: boot timing — React's subscribe must land inside the corrupt window (CONFIRMED as a required precondition)"
    - "config: server cookie config (ELIMINATED round 2 — no cookiePrefix override, no cookieCache)"
  and_gate: >
    YES — all three of code + data + environment must hold simultaneously. That is exactly why the
    bug is intermittent, why "different e-mail" was a red herring, and why it appeared only after a
    reload.

next_action: >
  Apply the two-layer fix, keep a TRIMMED probe set for one device round, then request German
  human-verify.

--- ROUND 2 (superseded above) ---

bug_class: Bohrbug (deterministic; ROUND-2 CORRECTION to the round-1 note — the failing surface
  DOES have a node-env runtime representation. The device log localized the failure to the
  better-auth client's own JS state machine (nanostores atoms + fetch hooks), which is pure JS.
  The round-1 "vitest cannot discriminate" claim applied to the RN router/native surface, not
  to this one. A node harness is therefore a legitimate discriminator here.)

trigger_refinement: >
  Round-2 user report: the bug does NOT occur on a plain first login. It occurs ONLY after
  logging out and then logging in again WITHIN THE SAME APP PROCESS (user tested with a
  different e-mail). The "different e-mail" part is NOT yet established as causal — the device
  log cannot separate "different e-mail" from "second login in one process".

fork_resolved: F1 CONFIRMED by device log — after `verify.submitOtp OK` there is ZERO further
  `session atom` output. Since `getSessionAtom.fetchSession` (session-atom.mjs:54) sets
  `isPending: current.data === null` (=> true) SYNCHRONOUSLY before its first await, even a
  failing refetch would have logged `{pending:true}`. `fetchSession()` was therefore never
  invoked: the `$sessionSignal` -> `fetchSession` path is DEAD by that point, not merely failing.

hypothesis: >
  ROUND-2 (to be tested, NOT yet established). The post-sign-in refetch is driven by exactly two
  notify sites, both of which toggle the `$sessionSignal` nanostores atom:
    (A) @better-auth/expo `dist/client.js:330-333` — onSuccess fetch hook, gated on
        `hasSessionCookieChanged(prevCookie, toSetCookie)`, notifies IMMEDIATELY via
        `config.mjs:83` `notify = (s) => atoms[s].set(!atoms[s].get())`
    (B) better-auth `dist/client/proxy.mjs:64-67` — the `atomListeners` path for
        `/sign-in/email-otp` (registered by `plugins/email-otp/client.mjs:9-12`), which captures
        `const val = signal.get()` and then `setTimeout(() => signal.set(!val), 10)`
  Candidate mechanisms, in the RCA categories:
    - code/library-state: the `$sessionSignal` LISTENER is gone by re-login time. Its only
      subscriber is `session-refresh.mjs:70 setupSignalSubscription`, created inside
      `onMount(session, ...)` (session-atom.mjs:126) and torn down by `refreshManager.cleanup()`
      in that onMount's destructor. nanostores unmounts an atom 1000ms after its LAST listener
      leaves (lifecycle/index.js STORE_UNMOUNT_DELAY). If anything drops React's
      `useSyncExternalStore` subscription across the logout, the signal path dies.
    - code/library-state: STALE-`val` DOUBLE TOGGLE. (B) captures `val` at t0 and writes `!val`
      at t0+10ms; (A) writes `!get()` in between. Two writers, one of them using a 10ms-stale
      snapshot, on a boolean atom whose `set` is a strict-inequality no-op
      (atom/index.js:101) — a sequence that lands back on the pre-existing value delivers
      NOTHING to listeners.
    - data: `hasSessionCookieChanged` returns FALSE (=> no notify at all from (A)) when neither
      the prev nor the next cookie JSON contains a `session_token`/`session_data` key — its
      `for (const key of sessionKeys)` loop simply does not execute and it falls through to
      `return false` (client.js:141-158). Established by reading: this is exactly what happens
      on `/sign-out`, where prev is `"{}"` (written by `clearSessionCache` in the `init` hook)
      and next is `"{}"` too.
  and_gate: PLAUSIBLE — this may need BOTH a logout-specific state change AND the re-login
    notify path, i.e. >1 contributing condition. Do not assume a single cause yet.

test: >
  NODE HARNESS EXPERIMENT (this round's discriminator, replacing another blind device round).
  Drive the REAL `lib/auth-client.ts` (better-auth/react + expoClient + emailOTPClient, the
  actual installed 1.6.25 code) under vitest with mocked expo modules and a stubbed `fetch`
  emulating the API, then replay the exact device sequence:
    cold start -> sign-in #1 -> sign-out -> sign-in #2 (different e-mail)
  observing (a) every session-atom delivery, (b) every `GET /get-session`, (c) the
  `$sessionSignal` value and its listener count at each step.
  This is a genuine reproduction attempt, not a theory: if the harness reproduces
  "no session delivery after sign-in #2", the mechanism is in this pure-JS surface and can be
  localized precisely. If it does NOT reproduce, the cause is in the RN/app layer instead and
  the harness has still eliminated the whole library-state branch.

expecting: >
  REPRODUCES -> the library state machine is the cause; bisect the harness (drop the expo
    plugin / drop the emailOtp atomListener / vary the cookie) to isolate which of the
    mechanisms above fires.
  DOES NOT REPRODUCE -> the library path is sound in isolation; pivot to the RN/app layer
    (React subscription lifetime across the logout render, i.e. does RootNavigation's
    `useSession()` subscription survive) and instrument THAT on device.

experiment_result: >
  HARNESS DID NOT REPRODUCE — 5/5 device-realistic variants deliver the new session.
  The library-state branch is ELIMINATED (see Eliminated). Two by-products:
    1. The device's `/sign-out` did NOT reach `onSuccess` (its logout signature matches the
       harness's failing-sign-out variant E exactly, 1 delivery instead of 3).
    2. `authClient.useSession()` has exactly ONE consumer app-wide, so the guard has no
       second source of truth if that subscription is lost.
  Remaining branch: an APP/RN-runtime condition breaks the notify -> fetchSession -> atom
  delivery chain. That is genuinely a runtime question — it cannot be settled from source, and
  this area has device-falsified three static theories already.

hypothesis_round2_open: >
  ONE of exactly three states must hold on device right after a successful
  `/sign-in/email-otp`; the new probes discriminate all three in a single run:
    G1 `$sessionSignal` NEVER TOGGLES  -> neither notify site fired. Then the cause is upstream
       (cookie data / `hasSessionCookieChanged` / the Set-Cookie the device actually receives),
       and `cookieLen` before-vs-after localizes it further.
    G2 SIGNAL TOGGLES but `signalListeners === 0` -> better-auth's own signal->fetchSession
       subscription is detached on device (nanostores lazy-unmount reached differently than in
       node, e.g. via a RootNavigation subscription drop). Fix: stop depending on the atom
       alone.
    G3 SIGNAL TOGGLES, listeners present, but the session atom still never delivers -> the
       refetch itself is being swallowed (aborted/hung `GET /get-session`); `pending`/
       `refetching` in the +3000ms sample distinguish hung-in-flight from never-started.
  In ALL THREE cases the same robust fix shape applies and is already precedented in this
  codebase: `forceUnauthenticated()` exists precisely because "better-auth only broadcasts the
  session signal on success" for LOGOUT — the symmetric gap is that there is NO equivalent
  app-level backstop for LOGIN. `@better-auth/expo` writes the cookie to SecureStore
  SYNCHRONOUSLY BEFORE it notifies, so `authClient.getCookie()` is a strictly earlier and more
  reliable signal than the session atom. Do NOT apply this until the device run says which
  gate fired — the exact placement differs per branch, and a blind fix here has failed 3x.

next_action: >
  CHECKPOINT (human-action) ISSUED — device run required. Round-2 `[OTP-DEBUG]` probes are
  APPLIED to the working tree (mobile typecheck PASS, lint PASS, tests 384/384 PASS):
    - NEW `apps/mobile/lib/otp-debug-atoms.ts` — `logAtomSnapshot()` reads better-auth's
      `session` and `$sessionSignal` atoms via `.value`/`.lc` DIRECTLY (never `.get()`, which
      would itself lazy-MOUNT an unmounted atom and destroy the evidence);
      `watchSessionSignal()` subscribes to `$sessionSignal` — a DIFFERENT atom from `session`,
      so it cannot mount `session` and cannot mask a dropped session subscription.
    - `app/_layout.tsx` — `atoms root-mount` snapshot + `$sessionSignal TOGGLED` watcher.
    - `app/(auth)/verify.tsx` — `atoms BEFORE-signIn` / `verify.signIn RESULT` (does the server
      hand back a token?) / `atoms AFTER-signIn` / `atoms AFTER-signIn+3000ms`.
    - `app/(tabs)/mehr.tsx` — `signOut RESULT` (better-auth RESOLVES on non-2xx, so today a
      rejected sign-out is silently swallowed there).
  JS-only, no native module and no route-tree change -> `npx expo start -c` is sufficient.
  User must reproduce logout -> re-login and paste the full `[OTP-DEBUG]` stream, AND report
  whether re-login with the SAME e-mail also fails (separates "different e-mail" from
  "second login in one process" — the round-1 log cannot).
  MUST be reverted before archiving: `grep "\[OTP-DEBUG\]" apps/mobile`, plus delete
  `lib/otp-debug-atoms.ts`, `lib/__tests__/otp-relogin-session-signal.repro.ts`,
  `lib/__tests__/support/expo-network-stub.ts` and `vitest.repro.config.ts`.
  Repo convention: the fix must NOT be committed on `main` — branch first
  (e.g. `fix/otp-relogin-session-signal`).

hypothesis: >
  STRUCTURAL DEDUCTION (round 1, not yet device-confirmed): the screen the user sees can ONLY
  stay `/verify` if the root layout's `Stack.Protected` guard never flips off
  `authState.status === 'unauthenticated'`. If the guard DID flip, `(auth)` is render-filtered
  out of the root Stack, the router reconciles to `/`, and `app/index.tsx` (the single always-
  mounted `/` owner from the resolved first-login-unmatched-route bug) renders — either a
  `<Redirect>` or, with a null cold-start target, a BLANK `bgAppDeep` splash View. The user
  reports neither a blank screen nor a redirect: they see the code screen. Therefore the guard
  does not flip, i.e. `authState` stays `unauthenticated` through the whole OTP success path.
  Four mutually exclusive forks can produce that, all consistent with "relaunch works":
    F1 `authClient.useSession()` never yields a session in-session (signal/atom never delivers)
    F2 `sessionPending` never settles back to false (effect early-returns forever)
    F3 `apiClient.getMe()` returns non-200 (e.g. 401 on a not-yet-visible cookie) -> the effect
       explicitly sets `unauthenticated` again and NEVER retries (deps never change again)
    F4 `apiClient.getMe()` THROWS -> `void resolveAuthState()` swallows it as an unhandled
       rejection -> `authState` is left untouched at `unauthenticated`, also never retried
  A fifth fork (F5) survives the deduction only if the user's screen description is imprecise:
  the guard flips but `coldStartTarget` stays null (one-shot `coldStartRedirectRef` already
  consumed) -> `app/index` renders the blank splash frame forever.

test: >
  ONE decisive device run with tagged `[OTP-DEBUG]` instrumentation on every fork point
  (verify submit result / session atom state / resolveAuthState branch + getMe status + throw /
  cold-start decide effect / app/index render). Static reasoning cannot discriminate F1-F5 and
  has already been device-falsified three times in this exact area (see resolved
  first-login-unmatched-route) — no further blind theorizing this round.

expecting: >
  F1 -> `session {hasSession:false}` persists after `verify OK`.
  F2 -> `session {pending:true}` persists after `verify OK`.
  F3 -> `getMe status=<non-200>` then `setAuthState unauthenticated`.
  F4 -> `getMe THREW <error>`.
  F5 -> `authState -> authenticated` AND `app/index MOUNTED` logged, but computedTarget stays null.
  None of the above -> the guard flips and app/index redirects, and the visible symptom is
  something else entirely (pivot: screen stack/z-order, not auth state).

next_action: >
  CHECKPOINT (human-action + human-verify) ISSUED. Temporary `[OTP-DEBUG]` instrumentation is
  APPLIED to the working tree (typecheck PASS, lint PASS) at five fork points:
    - app/(auth)/verify.tsx submitOtp     -> START / OK / ERROR / THREW
    - app/_layout.tsx session-atom effect -> {pending, hasSession, userId}   (F1, F2)
    - app/_layout.tsx resolveAuthState    -> ENTER / no-session branch / getMe REQUEST
                                             (incl. cookie length) / RESPONSE / THREW  (F1, F3, F4)
    - app/_layout.tsx coldStart effect    -> RUN {authStatus, linkingResolved, alreadyFired}
                                             + setColdStartTarget {redirect, resolvedHref}  (F5)
    - app/_layout.tsx RootNavigation render + app/index.tsx render -> the guard state actually
                                             driving Stack.Protected, and whether the single `/`
                                             owner mounts at all
  JS-only change: no native module and no route-tree change, so `npx expo start -c` is
  sufficient — no `expo run:android` rebuild needed. User must reproduce login -> correct OTP
  and paste the full `[OTP-DEBUG]` stream.
  MUST be reverted before archiving (grep `[OTP-DEBUG]` across apps/mobile).

## Evidence

- timestamp: 2026-08-16
  checked: knowledge base + prior resolved sessions in this area
  found: `.planning/debug/knowledge-base.md` does NOT exist yet — no known-pattern lookup possible. The only prior resolved session in this area is `first-login-unmatched-route` (dev-client launch URL captured as a pending deep link). Its fix (`isIgnorableDeepLinkRoute` at the capture site in `app/_layout.tsx:257`) is present and unchanged on disk.
  implication: No knowledge-base shortcut. The prior bug's hard lesson (three device-falsified static theories) applies directly and is adopted as this round's method constraint.

- timestamp: 2026-08-16
  checked: full auth/redirect path on disk — `app/_layout.tsx`, `app/index.tsx`, `app/(auth)/{_layout,email,verify}.tsx`, `lib/{auth-state,root-redirect,cold-start-redirect,auth-client,api-client,with-timeout}.ts`
  found: The post-verify hand-off is entirely GUARD-DRIVEN. `verify.tsx submitOtp` (line 70-94) performs NO navigation by design — on success it only lets better-auth's session atom update. `app/_layout.tsx`'s `resolveAuthState` effect (line 286-315) is the ONLY thing that can move the app off `/verify`, via `setAuthState({status:'authenticated'})` flipping the `Stack.Protected` guards (line 502-510).
  implication: The visible symptom is a direct read-out of `authState`. Staying on `/verify` == the guard never flipped. This is what makes F1-F4 the only structurally admissible forks.

- timestamp: 2026-08-16
  checked: `git diff 0beabaa..HEAD -- apps/mobile/app/_layout.tsx` (phase 05.1 merge -> HEAD), plus `git log` on `apps/api/src/me` and `apps/api/src/auth`
  found: The auth-resolution LOGIC in `_layout.tsx` is byte-identical to the version that passed phase-5 device UAT. Everything added since is additive and orthogonal: `ToastProvider`, `AppHeader` as a `<Stack>` sibling, `screenOptions={{headerShown:false}}` (09-07), a `flex:1` wrapper `View`, seven new `<Stack.Screen>` registrations (09-05/09-06/11-01/11-04) and `queryClient.cancelQueries()+clear()` inside the pre-existing unauthenticated-reset effect. Server side: `apps/api/src/me` and `apps/api/src/auth` are untouched since phase 07 — phases 10/11 added activity routes only.
  implication: FALSIFIES the orchestrator's prior "phase 9/10/11 regressed the redirect path" lead as a CODE regression in the auth path. Whatever changed is either environmental, dependency-behavioral, or an interaction with an additive change — not an edit to the redirect logic itself.

- timestamp: 2026-08-16
  checked: installed `@better-auth/expo@1.6.25` client (`node_modules/@better-auth/expo/dist/client.js`) and `better-auth@1.6.25` client internals (`dist/client/query.mjs`, `dist/client/session-refresh.mjs`), plus `expo-secure-store`'s exported API
  found: (1) The cookie write in the `onSuccess` fetch hook is `await storage.setItem(cookieName, ...)` BEFORE `store.notify("$sessionSignal")`, and `SecureStore.setItem`/`getItem` are genuinely SYNCHRONOUS exports (build/SecureStore.js:115,132) — so no torn/async cookie read can happen between sign-in and the session refetch. (2) The cookie-chunking path (`CHUNK_MARKER`, `STORAGE_VALUE_LIMIT=1800`) cannot engage here: `apps/api/src/auth/auth.instance.ts` enables NO `session.cookieCache`, so the stored cookie is just the small session token. (3) `session-refresh.mjs`'s online/focus gating (`shouldRefetch()`) applies ONLY to poll/focus/online-triggered refetches — `setupSignalSubscription` calls `fetchSession()` unconditionally, so an offline-reporting `expo-network` cannot suppress the post-sign-in session refetch. (4) `query.mjs:57-67` sets `isPending: data === null` on every request start, so a transient `sessionPending=true` after sign-in is EXPECTED and self-clears on success.
  implication: Eliminates the three library-level mechanisms that would otherwise be prime suspects (async cookie tear, chunked-cookie corruption, online-manager suppression). F1/F2 are now the LESS likely forks; F3/F4 (the `getMe` round trip) carry more prior weight — but none of the four can be settled without device signal.

- timestamp: 2026-08-16
  checked: `grep -rn "forceUnauthenticated|refreshAuthState"` across `apps/mobile`
  found: `forceUnauthenticated()` has exactly ONE caller — the logout control in `app/(tabs)/mehr.tsx:127`. `refreshAuthState()` has exactly ONE caller — `complete-profile.tsx:314`. No query-error path, interceptor or gate can force the guard back to `unauthenticated`.
  implication: Rules out the "guard flips forward, then something in the authenticated tree flips it straight back and restores the `(auth)` stack" variant — a plausible way to *appear* stuck on the code screen. Not a live hypothesis.

- timestamp: 2026-08-17
  checked: the two notify SITES that can drive a post-sign-in session refetch, read end-to-end
  found: >
    Exactly two exist, and both toggle the same `$sessionSignal` nanostores atom.
    (A) `@better-auth/expo/dist/client.js:326-334` — the onSuccess fetch hook, gated on
    `hasSessionCookieChanged(prevCookie, toSetCookie)`, calling `store.notify("$sessionSignal")`
    -> `better-auth/dist/client/config.mjs:83` `atoms[signal].set(!atoms[signal].get())`
    (immediate). (B) `better-auth/dist/client/proxy.mjs:53-68` — the `atomListeners` path,
    matched for `/sign-in/email-otp` by `plugins/email-otp/client.mjs:9-12`, which captures
    `const val = signal.get()` and then `setTimeout(() => signal.set(!val), 10)`.
    The single subscriber to that signal is `session-refresh.mjs:69-73 setupSignalSubscription`,
    created inside `onMount(session, ...)` (session-atom.mjs:126-146) — and its `fetchSession()`
    call is UNGATED (no `shouldRefetch()`), re-confirming round 1's online-manager elimination.
  implication: >
    The refetch chain is fully mapped and has no third entry point. Combined with the harness
    result, an APP-level runtime condition — not a library defect — must be breaking it.

- timestamp: 2026-08-17
  checked: harness variant E's logout signature vs. the round-1 device log's logout region
  found: >
    Variants B/C/D emit THREE session-atom deliveries at logout
    (`clearSessionCache` from the `init` hook -> `fetchSession` from the +10ms atomListener
    toggle -> the `GET /get-session` result). Variant E — where `/sign-out` never reaches
    `onSuccess` — emits EXACTLY ONE: `pending=false refetching=false user=null`.
    The device logged exactly one: `session atom {"pending":false,"hasSession":false}`.
    Note `app/(tabs)/mehr.tsx:115` does `await authClient.signOut()` and DISCARDS the result;
    better-auth RESOLVES (does not throw) on a non-2xx, so a rejected `/sign-out` is currently
    invisible — no `console.error('signOut failed:')` would appear either.
  implication: >
    The device's `/sign-out` did NOT reach `onSuccess` (network failure or non-2xx). That is a
    real, previously unseen finding — but variant E still recovers at re-login, so a failed
    sign-out is NOT sufficient to cause the reported bug on its own. Feeds the AND-gate: the
    failure plausibly needs a failed/rejected sign-out AND a second condition.

- timestamp: 2026-08-17
  checked: `grep -rn "useSession|authClient\." apps/mobile/{app,lib,components}`
  found: >
    `authClient.useSession()` has EXACTLY ONE consumer in the entire app —
    `app/_layout.tsx:275`, in `RootNavigation`. So better-auth's `session` atom carries exactly
    ONE React subscription for the whole process, and its nanostores mount lifetime is tied
    1:1 to RootNavigation's `useSyncExternalStore` subscription. `authClient.getCookie()` is
    read per-request by `lib/api-client.ts:21`, independently of that atom.
  implication: >
    There is no redundancy: if that one subscription is ever dropped, nothing else keeps the
    session atom mounted, and `app/_layout.tsx`'s guard has NO second source of truth. It also
    makes the fix shape clear if the atom is at fault — the guard can fall back to
    `authClient.getCookie()`, which `@better-auth/expo` writes to SecureStore SYNCHRONOUSLY
    BEFORE it notifies (round-1 evidence), i.e. a strictly earlier and more reliable signal.

- timestamp: 2026-08-17
  checked: `apps/api/src/auth/auth.instance.ts` and `@better-auth/expo/dist/index.js` (server plugin)
  found: >
    No `advanced.cookiePrefix` override (so the client's default `"better-auth"` prefix matches
    and `hasBetterAuthCookies` cannot mis-classify), no `session.cookieCache` (re-confirming
    round 1's chunking elimination), `session.updateAge: 24h` (so a routine `GET /get-session`
    does NOT reissue a token and cannot cause spurious notifies). The SERVER expo plugin only
    translates `expo-origin` -> `origin` and rewrites `location` for `/callback`-style routes —
    it does not touch `/sign-in/email-otp`'s Set-Cookie.
  implication: Server-side cookie configuration is ruled out as a cause of a missing notify.

- timestamp: 2026-08-17
  checked: FALSIFICATION / mutation test — reverted ONLY the module-init pin in `lib/auth-client.ts` (commented out `authClient.$store.listen('session', () => {})`) and re-ran `lib/__tests__/auth-session-atom-mount.test.ts`
  found: >
    Case 2 ("inside the busy-boot-widened unmount window") FAILS without the pin and
    reproduces the device fingerprint EXACTLY:
      t= 800 module-init   sessionLc=0 sessionActive=true signalLc=1
      t=1007 poll          sessionLc=0 sessionActive=true signalLc=0   <- unmount cascade
      t=1402 post-subscribe sessionLc=1 sessionActive=true signalLc=0  <- mount cb SKIPPED
      t=2205 after-relogin  sessionLc=1 sessionActive=true signalLc=0
      requests=["POST /sign-in/email-otp"]  (NO GET /get-session)  deliveries=[]
      => {signalSubscribed:false, refetched:false, finalUser:null}
    With the pin restored, both cases pass. Case 1 (subscribe BEFORE the window) passes in
    BOTH conditions — so the test discriminates the defect, it is not merely always-red.
  implication: >
    This is the strongest evidence in the session: the bug is now reproducible on demand in
    CI, the fix provably removes it, and a control case proves the test is specific. Closes
    the "revert the fix, does the bug return?" guardrail signal without needing the device.
    It also retroactively explains every device observation, including the ones the round-2
    harness got wrong.

- timestamp: 2026-08-17
  checked: round-2's inference "the device's `/sign-out` did NOT reach `onSuccess`" against the round-3 device log
  found: >
    RETRACTED. Round 3 logged `signOut RESULT {"hasError":false,"error":null}` — the sign-out
    genuinely SUCCEEDED — and still produced only ONE session-atom delivery. The single
    delivery is fully explained by the confirmed root cause: with the signal subscription dead,
    only `clearSessionCache`'s DIRECT `.set()` can reach a listener, while the two
    `fetchSession`-driven deliveries need the `$sessionSignal -> fetchSession` path that no
    longer exists. Round 2 read the same signature as a failed sign-out because its harness had
    no corrupt-atom variant to compare against.
  implication: >
    The motivation for the optional `mehr.tsx` sign-out hardening is gone, so it was NOT applied
    (keeps the fix minimal and targeted). The logout path is also already behaviourally correct
    without it: `forceUnauthenticated()` runs in a `finally`, and `console.error('signOut failed:')`
    already covers the throwing case. The only residual gap is log visibility of a
    RESOLVED-but-errored sign-out — noted as a possible future hardening, not a defect today.

- timestamp: 2026-08-17
  checked: REGRESSION RISK of the new cookie-first branch — can it resurrect a just-logged-out visitor? `node_modules/@better-auth/expo/dist/client.js`
  found: >
    No. Line 410 sits in the `init` hook (which runs BEFORE the request is sent), not in
    `onSuccess`: `if (url.includes("/sign-out")) await clearSessionCache();`, and
    `clearSessionCache` (line 270-279) does `storage.setItem(cookieName, "{}")`. So ANY
    sign-out attempt that reaches better-auth's fetch layer — including one that later fails or
    returns non-2xx — empties the SecureStore cookie first. `authClient.getCookie()` therefore
    returns `""` afterwards and `nextAuthResolveStep` yields `unauthenticated`. If `signOut()`
    threw even earlier, no dependency of the resolve effect changes, so the effect does not
    re-run at all and `forceUnauthenticated()`'s direct state write stands.
  implication: >
    The AUTH-04 logout backstop (T-06-19, "a failed sign-out must not leave a session alive on a
    shared device") is preserved by the fix. This was the one plausible way the cookie-first
    resolve could have traded a login bug for a logout bug.

- timestamp: 2026-08-17
  checked: `npx prettier --check` on all eight changed files, and on the HEAD versions of the two that failed
  found: >
    `app/_layout.tsx` and `app/(auth)/verify.tsx` already fail Prettier at HEAD. Diffing the
    Prettier output against the working tree shows every delta lies in JSX regions untouched by
    this fix (the `Stack.Screen`/`Stack.Protected` block's indentation, and `Text`/`Pressable`
    wrapping in verify's render). None of the added lines appear in that diff.
  implication: >
    Pre-existing formatting drift, not introduced here. Deliberately NOT reformatted — doing so
    would bury a 3-file behavioural fix under a few hundred lines of unrelated churn. Worth a
    separate `style:` commit sometime.

- timestamp: 2026-08-17
  checked: ON-DEVICE VERIFICATION of `820eede` — reproduce reload -> logout -> re-login on the Expo dev client
  found: >
    PASS. User's word: "passt" — after entering the correct OTP the app navigates off the code
    screen as expected.
    STALE-BUNDLE DETOUR (recorded because it cost a round-trip, not because it weakens the pass):
    the FIRST verification attempt appeared to fail, and the log the user pasted still contained
    pre-fix markers such as `verify.submitOtp START` — a probe string that exists NOWHERE in the
    tree any more (round 3 replaced the round-1/2 probe set). Metro had not been restarted, so the
    device was running a bundle from before the fix. After a full Metro kill plus
    `npx expo start -c`, the same repro succeeded.
  implication: >
    Log markers that no longer exist anywhere in the source are proof of a STALE BUNDLE and
    nothing more — they cannot be evidence about the current code. Treat "unknown marker in the
    log" as a bundle-freshness check BEFORE reading the run as a failure. Generalized into the
    knowledge base as a verification pitfall, since it applies to every Expo device verification.

- timestamp: 2026-08-17
  checked: RETRACTIONS AND SCOPE NOTES carried out of earlier rounds, consolidated for the record
  found: >
    (1) RETRACTED (round 2): "the device's `/sign-out` did NOT reach `onSuccess`". Round 3 logged
        `signOut RESULT {"hasError":false,"error":null}` — the sign-out genuinely succeeded. The
        single session-atom delivery that round 2 read as a failed sign-out is fully explained by
        the confirmed root cause (with the signal path dead, only `clearSessionCache`'s DIRECT
        `.set()` reaches a listener). Round 2's harness simply had no corrupt-atom variant to
        compare against. Full entry above.
    (2) DELIBERATELY NOT APPLIED: the optional `app/(tabs)/mehr.tsx` sign-out hardening. Its sole
        motivation was retraction (1), so it was dropped to keep the fix minimal and targeted. The
        logout path is already behaviourally correct — `forceUnauthenticated()` runs in a `finally`
        and `console.error('signOut failed:')` covers the throwing case. Residual gap is log
        visibility of a RESOLVED-but-errored sign-out: a possible future hardening, not a defect.
    (3) NOT DEV-ONLY: every ingredient is a release-build path (`getActions()` cache hydration,
        nanostores' STORE_UNMOUNT_DELAY, a `useSession()` subscription landing >1000ms after
        module-eval). The required precondition is a boot WITH a valid cached session — i.e. every
        returning logged-in visitor on a slow cold start. A Metro reload merely re-rolls the boot
        timing cheaply and often, which is why the user only noticed it there.
  implication: >
    (1) and (2) prevent a future session from re-deriving a phantom sign-out defect from the
    one-delivery logout signature. (3) is the reason this was sized and shipped as a real fix
    rather than a dev-only workaround.

- timestamp: 2026-08-17
  checked: CLOSE-OUT — instrumentation removal and clean-tree re-verification
  found: >
    `app/(auth)/verify.tsx` and `app/_layout.tsx` restored to their `820eede` content
    (`git diff 820eede -- <both files>` is EMPTY, so the fix is intact and only probes were
    removed); `lib/otp-debug-atoms.ts` deleted. `grep -rn "OTP-DEBUG" apps/mobile` and
    `grep -rn "otp-debug-atoms" apps/mobile` both return ZERO hits. Gates re-run on the clean
    tree: `typecheck` PASS, `lint` PASS, `vitest run` 392/392 PASS across 33 files.
  implication: >
    No regression from probe removal, and the 392/392 figure recorded pre-removal holds on the
    shipped tree. The two new regression tests are in that count and run without any debug-only
    module present.

## Eliminated

- hypothesis: "The better-auth/@better-auth/expo client state machine itself fails to deliver a session on a SECOND sign-in within one process (nanostores lazy-unmount dropping the $sessionSignal subscription, equality-gated set, stale-`val` double toggle, or a stale in-memory session cache)"
  evidence: >
    NODE HARNESS EXPERIMENT (`apps/mobile/lib/__tests__/otp-relogin-session-signal.repro.ts`,
    run via `vitest.repro.config.ts`). Drives the REAL installed client — `lib/auth-client.ts`
    verbatim, better-auth/react 1.6.25 + @better-auth/expo expoClient + emailOTPClient — with
    mocked expo modules and a stubbed API, replaying cold start -> sign-out -> re-login with a
    DIFFERENT e-mail across five variants: (A) cold start/fast boot, (B) warm start with a
    restored SecureStore cookie + cached session data, (C) warm + boot slower than nanostores'
    STORE_UNMOUNT_DELAY (1000ms), (D) C + a realistic multi-second gap between logout and
    re-login, (E) D + a FAILING `/sign-out`. ALL FIVE deliver `second@example.com` to the
    subscriber. `signalListeners` and `sessionListeners` stay at 1 throughout every variant —
    the atom self-heals across the 1000ms unmount boundary in both directions (mount-before /
    mount-after). The `$sessionSignal` subscription is never dropped, the equality gate never
    swallows the delivery, and the stale-`val` double toggle is harmless in practice.
  timestamp: 2026-08-17

- hypothesis: "A phase 9/10/11 code change regressed the post-verify redirect logic"
  evidence: `git diff 0beabaa..HEAD -- apps/mobile/app/_layout.tsx` shows the auth-resolve effect, the cold-start decide effect, the unauthenticated-reset effect and both `Stack.Protected` guards are unchanged since the phase-5/05.1 version that passed device UAT. `apps/api/src/me` + `apps/api/src/auth` untouched since phase 07.
  timestamp: 2026-08-16

- hypothesis: "The @better-auth/expo cookie is written asynchronously / chunk-torn, so the getMe right after sign-in goes out without a valid Cookie header"
  evidence: `dist/client.js:331` awaits `storage.setItem` BEFORE `store.notify("$sessionSignal")`, and `expo-secure-store` exports genuinely synchronous `setItem`/`getItem` (build/SecureStore.js:115,132). Chunking cannot engage — no `session.cookieCache` is configured in `auth.instance.ts`, so the cookie stays far below the 1800-char split threshold.
  timestamp: 2026-08-16

- hypothesis: "better-auth's new expo online-manager reports the device offline (dev WLAN without internet) and suppresses the post-sign-in session refetch"
  evidence: `dist/client/session-refresh.mjs:20-38` gates ONLY poll/focus/online-triggered refetches behind `shouldRefetch()`. `setupSignalSubscription` (line 68-71) subscribes `$sessionSignal` to a bare, ungated `fetchSession()` — the exact path a successful `signIn.emailOtp` triggers.
  timestamp: 2026-08-16

- hypothesis: "Something in the authenticated tree forces the guard back to unauthenticated, remounting (auth) with /verify restored"
  evidence: `forceUnauthenticated()` has exactly one caller — the explicit logout control in `app/(tabs)/mehr.tsx:127`. No error/interceptor path calls it.
  timestamp: 2026-08-16

## Resolution

root_cause: >
  AND-GATE — three conditions must hold simultaneously (which is why the bug looked
  intermittent, why "different e-mail" was a red herring, and why a dev reload made it common):

  (1) CODE — nanostores/better-auth re-entrancy in the deferred-unmount destructor.
      `@better-auth/expo`'s `expoClient.getActions()` hydrates the session atom from the
      SecureStore cache during `createAuthClient()` via `sessionAtom.set({ ...sessionAtom.get() })`.
      nanostores' `atom.get()` LAZY-MOUNTS (`if (!lc) listen(noop)()`), so the atom mounts and
      unmounts again with NO subscriber, arming the 1000ms STORE_UNMOUNT_DELAY timer. When the
      unmount callback runs it sets `$store.active = false` and iterates
      `for (destroy of events[UNMOUNT]) destroy()`; better-auth's destructor calls
      `settleAbortedFetch()`, whose first statement is another `session.get()` — RE-MOUNTING the
      atom mid-teardown (`active = true` again, a fresh refreshManager subscribing
      `$sessionSignal`). Because a JS array iterator picks up elements pushed during iteration,
      the SAME loop then runs the new mount's destructor and tears that refreshManager straight
      back down — while `active` is left `true`. Every later `listen()` therefore SKIPS the mount
      callback, `$sessionSignal -> fetchSession` is never subscribed again, and no session refetch
      happens for the rest of the JS context.
  (2) DATA — a valid cached session must exist in SecureStore at boot (a returning logged-in
      visitor), otherwise `getActions()` never calls `get()` and the atom is never lazily mounted.
      This is why a first login from a cold logged-out start never fails.
  (3) ENVIRONMENT — boot timing: the app's SINGLE `useSession()` subscription
      (`app/_layout.tsx:275`, the only one app-wide) must attach AFTER the 1000ms timer fires.
      A real Expo boot blocks the JS thread for hundreds of ms between module eval and first
      paint, which both widens the corrupt window and lands the subscription inside it.

  Visible symptom: with the signal path dead, a successful `POST /sign-in/email-otp` produced no
  `GET /get-session` and no session delivery, so `authState` stayed `unauthenticated`, the
  `Stack.Protected` guard never flipped, and the visitor sat on `/verify` with a perfectly valid
  server-side session — which a relaunch (fresh JS context) then picked up normally.

fix: >
  Two independent layers, commit `820eede` on `fix/otp-relogin-session-signal`:
  LAYER 1 (removes the root cause) — `lib/auth-client.ts` pins one listener on the session atom
    at module init (`authClient.$store.listen('session', () => {})`), so `lc` is never 0 after
    hydration, the deferred unmount never runs, and the re-entrancy cannot trigger.
  LAYER 2 (removes the single point of failure) — `lib/auth-state.ts` adds the pure
    `nextAuthResolveStep()` decision function; `app/_layout.tsx` resolves the guard from
    `authClient.getCookie()` (written to SecureStore SYNCHRONOUSLY before better-auth notifies)
    with `GET /me` as the authority, instead of trusting the session atom alone; and
    `app/(auth)/verify.tsx` calls the existing `refreshAuthState()` on a successful sign-in —
    the login counterpart to logout's `forceUnauthenticated()` backstop, which had no equivalent.
  Layer 2 keeps the app correct even if layer 1 is ever undone or a future better-auth renames
  `$store`.

verification: >
  guardrail_verdict: ACCEPTED — all six signals PASS, including the on-device gate.
  signal_1_original_repro: PASS (automated) — `auth-session-atom-mount.test.ts` case 2 reproduces
    the device fingerprint `sessionLc=1 sessionActive=true signalLc=0` with no `GET /get-session`
    when the pin is reverted, and goes green with it applied.
  signal_2_revert_restores_bug: PASS — explicit mutation run, see Evidence "FALSIFICATION".
  signal_3_test_specificity: PASS — control case (subscribe before the window) stays green in
    BOTH conditions, so the test is not merely always-red.
  signal_4_regression_suite: PASS — `apps/mobile` vitest 392/392 across 33 files (up from 384),
    typecheck PASS, lint PASS. Re-run on the FINAL clean tree after all `[OTP-DEBUG]`
    instrumentation was removed: still 392/392, typecheck PASS, lint PASS.
  signal_5_no_new_defect: PASS — the one plausible trade (cookie-first resolve resurrecting a
    logged-out visitor) is ruled out at source: `@better-auth/expo` clears the cookie in its
    PRE-request `init` hook on `/sign-out`. See Evidence "REGRESSION RISK".
  signal_6_device: PASS — 2026-08-17, Expo dev client on the user's Android device. Repro
    reload -> logout -> re-login: entering the correct OTP navigates off the code screen. User's
    confirmation: "passt". A node/vitest pass was explicitly NOT treated as sufficient here (the
    round-2 harness passed while the device failed), so this was the decisive gate.
    CAVEAT ON THE FIRST ATTEMPT: run #1 looked like a FAIL but was a STALE BUNDLE — the pasted log
    still contained `verify.submitOtp START`, a pre-fix probe string that no longer exists
    anywhere in the tree, because Metro had not been restarted. After a Metro kill plus
    `npx expo start -c`, run #2 passed. This does not weaken the pass: markers absent from the
    source prove an old bundle, nothing about the current code.
  oracle_type: derived — the tests assert the contracts "a sign-in always triggers a session
    refetch" and "the cookie is the credential, GET /me is the authority", not library internals.

files_changed:
  # exact list from `git show --stat 820eede` (8 files, +502/-8)
  - "apps/mobile/app/(auth)/verify.tsx: `refreshAuthState()` on successful sign-in (layer 2)"
  - "apps/mobile/app/_layout.tsx: resolve effect decides via `nextAuthResolveStep` on the cookie (layer 2)"
  - "apps/mobile/lib/auth-client.ts: module-init pin keeping the session atom mounted (layer 1)"
  - "apps/mobile/lib/auth-state.ts: new `nextAuthResolveStep()` + `AuthResolveStep` type (layer 2)"
  - "apps/mobile/lib/__tests__/auth-session-atom-mount.test.ts: NEW regression guard (layer 1)"
  - "apps/mobile/lib/__tests__/auth-resolve-step.test.ts: NEW decision-table guard (layer 2)"
  - "apps/mobile/lib/__tests__/support/expo-network-stub.ts: NEW test-only expo-network alias target"
  - "apps/mobile/vitest.config.ts: inline better-auth ESM + alias expo-network for the above"
  # close-out commit (this session): probe removal + archived session doc + knowledge base.
  # Probe removal is a pure revert to `820eede` — `git diff 820eede` on the two probed files is EMPTY.

postmortem: >
  WHY NO EXISTING GATE CAUGHT IT — blameless, and the honest answer is "none of them could have".
  The defect lived in the INTERACTION between `@better-auth/expo`'s cache hydration, nanostores'
  deferred-unmount lifecycle and real Expo boot timing. Typecheck and lint cannot see a lifecycle
  race. Code review could not either: every line involved is correct in isolation, and the app's
  own code contains no defect at all — the trigger is a library `get()` on a module-eval path.
  The unit suite could not see it because NOTHING drove the real better-auth client through a
  realistic boot: the auth path was tested through mocks, so the atom's mount lifecycle — the
  actual failing surface — was never exercised. Device UAT in phase 5 passed legitimately: the
  AND-gate needs a cached session at boot AND a subscription landing past the 1000ms window, and
  phase-5 UAT logged in from a cold logged-out start, which by construction cannot hit it.
  Sharpest lesson, already paid for once in `first-login-unmatched-route`: rounds 1-3 burned three
  device round-trips because a green node harness (round 2, 5/5 variants passing) was read as
  exoneration. It was a TIMING miss of milliseconds, not a refutation — an idle-thread harness has
  a ~1ms gap where a real boot has hundreds. A passing test on the wrong timing proves nothing.

  RECURRENCE GUARD NOW IN PLACE — three layers, all committed in `820eede`:
    1. `lib/__tests__/auth-session-atom-mount.test.ts` — drives the REAL better-auth client
       through the failing boot timing and fails if the module-init pin is removed
       (mutation-proven), with a control case that stays green so it is not always-red. This is
       the gate that did not exist before.
    2. `lib/__tests__/auth-resolve-step.test.ts` — pins the guard's decision table, so layer 2's
       cookie-first resolution cannot silently regress to trusting the session atom alone.
    3. ARCHITECTURAL: layer 2 removes the single-point-of-failure itself. The guard no longer
       depends on the one `useSession()` subscription, so even an unguarded future library
       lifecycle change degrades to "the cookie + `GET /me` decide" instead of a stuck screen.
  Follow-ups deliberately NOT bundled here: the `mehr.tsx` sign-out log-visibility hardening
  (motivation retracted, see Evidence) and the pre-existing Prettier drift in `_layout.tsx` /
  `verify.tsx` (separate `style:` commit — reformatting would bury a 3-file behavioural fix).

production_scope_note: >
  NOT dev-only. Every ingredient is a release-build path — the cache hydration in
  `getActions()`, nanostores' STORE_UNMOUNT_DELAY, and a `useSession()` subscription landing
  >1000ms after `lib/auth-client.ts` module-eval. A Metro reload merely re-rolls the boot timing
  cheaply and often, which is why the user only noticed it there. The required precondition is a
  boot WITH a valid cached session, i.e. every returning logged-in visitor on a slow cold start.
