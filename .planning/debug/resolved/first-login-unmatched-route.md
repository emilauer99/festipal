---
status: resolved
trigger: "Nach Erstlogin + Profil-Submit (frisches Konto, kein Festival gewählt) landet man auf Unmatched Route festipal:/// statt Home. Verdacht: Cold-Start-Redirect in app/_layout.tsx fällt im 'kein href + kein slug'-Zweig durch, kein expliziter router.replace('/home')."
created: 2026-08-09T00:00:00Z
updated: 2026-08-10T00:00:00Z
mode: find_and_fix
---

## DEVICE-VERIFIED FIXED 2026-08-10 (round 4, final)

User confirmed on device: after `npx expo run:android` (fresh native build that FINALLY compiled the
react-native-nitro-modules native module — see note below) + the round-4 fix, the exact repro (fresh
install → OTP login → profile-setup → "Done") now lands on Home. No Unmatched Route, no MMKV crash.

Two independent faults were in play, which is why this took four rounds and both prior device fails
were real:
1. PRIMARY (this bug): the Expo Dev Client launch URL `festipal:///expo-development-client/?url=...`
   was captured by app/_layout.tsx's deep-link effect (route `expo-development-client`, not in
   AUTH_FLOW_PATHS) and replayed on the authenticated transition as `<Redirect href="/expo-development-client">`
   → nonexistent route → Unmatched Route. FIX: `isIgnorableDeepLinkRoute()` in lib/deep-link.ts,
   applied at the capture site in app/_layout.tsx. Dev-client-only artifact (production standalone
   launches bare `festipal://` → reconstruct → null → home), but it fired on EVERY dev launch.
   NOTE: R3's single-`/`-owner (app/index.tsx) is CORRECT and retained — the device log proved
   app/index MOUNTED in every auth state, so there was never a route collision (rounds 1–3 chased a
   collision that did not exist; the collision theory is SUPERSEDED).
2. CONFOUND (separate, pre-existing, blocked verification): react-native-mmkv v4 uses NitroModules;
   the installed debug APK predated it, so `createMMKV` threw "native NitroModules could not be
   found". Masked earlier because a stale Metro cache served a pre-mmkv-v4 bundle. `expo start -c`
   surfaced it; `npx expo run:android` (fresh native build, nitro autolinked + CMake-compiled)
   resolved it. This is why a Metro/OTA reload was never enough — the route TREE + native deps both
   needed a real rebuild.

Gates: typecheck PASS · lint PASS · vitest 94/94 PASS (+8 deep-link regression tests). Temporary
[UNMATCHED-DEBUG] logs removed (grep clean). Fix + resolved session are uncommitted pending the
orchestrator's commit-scope decision with the user.

## RESUME 2026-08-10 (c) — ROOT CAUSE CONFIRMED from device signal; fix applied

The diagnostics from RESUME (b) captured the decisive stream on device (`npx expo start -c`,
fresh install → OTP login → profile-setup → "Done"). Decisive fork RESOLVED: `app/index`
MOUNTS in every auth state — R3's single top-level `/` owner is CORRECT and is KEPT. There was
NEVER a route collision at `/` in the running app.

The real bug is a captured Expo **Dev Client launch deep-link**. Device log stream (verbatim key
lines): `app/index MOUNTED authStatus=authenticated coldStartTarget=null computedTarget=null`,
then `setColdStartTarget {"redirect":{"href":"/expo-development-client","kind":"deep-link"}}`,
then `app/index MOUNTED authStatus=authenticated coldStartTarget="/expo-development-client"
computedTarget="/expo-development-client"`. The on-screen Unmatched URL was `festipal:///` /
`/expo-development-client`.

MECHANISM (verified against code): Expo Dev Client launches via
`festipal:///expo-development-client/?url=http://<metro-host>`. The capture effect in
`app/_layout.tsx` runs `reconstructDeepLinkRoute(Linking.parse(url),'festipal')` → scheme matches
appScheme → route `"expo-development-client"`. `AUTH_FLOW_PATHS` does not contain it → captured via
`capturePendingDestination('/expo-development-client')`. On the authenticated transition the
cold-start effect consumes it → `resolveColdStartRedirect` → `{kind:'deep-link',
href:'/expo-development-client'}` → `app/index` does `<Redirect href="/expo-development-client">`
→ no such route → Expo Unmatched Route. Dev-client-only artifact (a production standalone launch
is a bare `festipal://` that `reconstructDeepLinkRoute` already maps to `null` → home), but it
breaks EVERY dev launch = the user's "every time". This supersedes rounds 1–3 as the operative
cause; R3's structural single-`/`-owner is retained and correct (it is what let `app/index` mount
and log the smoking-gun target).

FIX (round 4): add a pure, unit-tested predicate `isIgnorableDeepLinkRoute(route)` in
`lib/deep-link.ts` (first path segment ∈ {`expo-development-client`, `_expo`, `--`}); call it at
the capture site in `app/_layout.tsx` ALONGSIDE the `AUTH_FLOW_PATHS` guard so Expo-internal
launch paths are never captured. Removed all `[UNMATCHED-DEBUG]` diagnostics.

next_action: DEVICE verification of the exact repro the user just ran (fresh install → OTP login →
profile-setup → "Done" under `npx expo start -c`) — it should now land on Home, not Unmatched
Route. Session manager owns the resolve/commit step (prior rounds' R3 changes are still
uncommitted and need an orchestrator commit-scope decision).

## RESUME 2026-08-10 (b) — diagnostics instrumented; awaiting device signal (CHECKPOINT)

Route tree re-confirmed on disk via Glob: EXACTLY ONE `/` owner (app/index.tsx), (auth)/welcome.tsx
(renamed), no (root) group, no stray index — R3 structure coherent. Per round mandate, NO 4th blind
theory produced. Instead TEMPORARY `[UNMATCHED-DEBUG]` console.log diagnostics were added to the
failing path so a single device run captures everything:
  - app/index.tsx render: logs "app/index MOUNTED" + authStatus + coldStartTarget + computedTarget
    (proves whether the single `/` owner mounts at all, and with what values).
  - app/_layout.tsx resolveAuthState: logs the next guard state (authenticated vs -no-profile).
  - app/_layout.tsx cold-start effect: logs each run (authStatus + alreadyFired) and setColdStartTarget
    (redirect + resolvedHref).
  - app/_layout.tsx render: logs "RootLayout render" (authStatus + bootstrapped + coldStartTarget).

next_action: CHECKPOINT issued to user (human-action + human-verify combined). User must, from
apps/mobile/: (1) stop any running Metro/node, (2) `npx expo start -c` (cleared cache — eliminates the
stale-Metro confound flagged in RESUME (a)), (3) re-run the EXACT repro on the post-R3 APK (fresh
install → OTP login → profile-setup → "Done"), (4) report: the EXACT on-screen Unmatched URL (`/` vs
`/complete-profile` vs other), AND the full `[UNMATCHED-DEBUG]` log stream from Metro/logcat.
Decisive fork on return:
  - Unmatched shows AND no "app/index MOUNTED" log → running tree ≠ current tree (stale Metro/native)
    OR app/index isn't resolving `/` → revisit collision theory.
  - "app/index MOUNTED" logged with authStatus=authenticated + non-null computedTarget yet Unmatched
    persists → the declarative <Redirect> itself fails → R3 fix is wrong; pivot.
  - Cache-clear alone fixes it (no Unmatched) → stale Metro was the confound all along; remove
    diagnostics, device-verify clean, resolve.
TEMPORARY diagnostics must be reverted before archiving (grep `[UNMATCHED-DEBUG]`).
---

## RESUME 2026-08-10 — user reports R3 STILL fails; missing discriminating signal must be captured this round

User (2026-08-10) reports the symptom is UNCHANGED after the R3 fix: every transition from the
auth screens / profile-setup onto the (tabs) screen still lands on Unmatched Route. R3 (single
`/` owner app/index.tsx) has NEVER been isolated as device-verified — status was
`awaiting_human_verify`, now downgraded to `investigating` because the user's report is a device
FAIL, not a pass.

Orchestrator pre-spawn findings (2026-08-10, verified this session):
- The R3 fix is fully present and coherent on disk: app/index.tsx is the single `/` owner declared
  OUTSIDE all Stack.Protected blocks (app/_layout.tsx:307 `<Stack.Screen name="index" />` before
  the guards); (auth)/index.tsx is renamed to (auth)/welcome.tsx; no (root) group exists; contexts
  (auth-state.ts, cold-start-target.ts) + pure mapper (root-redirect.ts) all in place. `find app`
  confirms the tree. So the working tree matches the R3 resolution block exactly.
- BUILD FRESHNESS: android/app/build/outputs/apk/debug/app-debug.apk mtime = 2026-08-10 11:59.
  R3 source mtimes = 2026-08-09 21:01–21:03. So the APK native shell was built AFTER R3.
- BUT: this is an Expo DEBUG build — the route TREE is resolved in the JS bundle served by METRO,
  not baked into the APK. A large node process (~542MB RSS) is running = almost certainly Metro,
  possibly with a bundle CACHE from before the (auth)/index → welcome rename. If Metro served a
  stale-cached bundle, the device is STILL running the OLD colliding route tree regardless of the
  post-R3 APK — this is a live, untested confound.
- STILL-MISSING discriminating signal (flagged every prior round, never captured): (1) the exact
  Unmatched Route URL on screen (`/` vs `/complete-profile`), (2) any Metro/device console
  warning/error text at the moment of the guard flip, (3) whether app/index even MOUNTS (proven
  by a log line), (4) whether Metro was restarted with cleared cache for the failing run.

next_action (this round): DO NOT re-theorize a 4th root cause blind. Get hard device signal.
  Step 1 — eliminate the stale-Metro confound: stop the running Metro/node, restart with
  `npx expo start -c` (cleared cache) from apps/mobile, and re-run the exact repro on the
  post-R3 APK. Step 2 — if it STILL fails, add temporary diagnostics that print on the failing
  path: a console.log in app/index.tsx render (authState.status + computed target + "index
  MOUNTED"), and one in the _layout guard-resolve effect (authState transitions + coldStartTarget
  set). The decisive fork: if Unmatched shows and app/index NEVER logged "index MOUNTED" → the
  current route tree is NOT what's running (stale Metro/native) OR app/index is not resolving `/`
  → the R3 collision theory needs revisiting; if app/index DID mount as `authenticated` with a
  non-null target yet Unmatched still shows → the declarative <Redirect> itself is failing and the
  fix is wrong. Capture the exact on-screen URL + console text before concluding anything.

## Current Focus — ROUND 3 (resumed): collision CONFIRMED against expo-router 57 source; fix = single top-level `/` owner

hypothesis: CONFIRMED — STATIC ROUTE COLLISION at path `/`, resolved guard-agnostically. Verified against installed expo-router 57.0.9 source (see Evidence Round 3). Fix: make `app/index.tsx` (top-level, OUTSIDE all Stack.Protected guards) the SINGLE owner of `/`, doing a declarative <Redirect> off authState (via context) + coldStartTarget; rename the colliding `(auth)/index.tsx` → `(auth)/welcome.tsx`; delete the colliding round-2 `(root)` group.
test: applied fix + typecheck + lint + vitest (necessary-not-sufficient — no RN/expo-router runtime surface in node-env); DEVICE verification required before archiving.
expecting: with exactly ONE file resolving `/` (app/index, present under every guard state), `getStateFromPath('/')` can never build a nav state pointing at a guarded-off screen → no Unmatched Route on the guard flip.
next_action: DONE (fix applied; typecheck/lint clean; vitest 86/86). AWAITING on-device human verification: fresh install -> OTP login -> profile setup -> Done should land on Home (no Unmatched Route). On "confirmed fixed": commit the code + resolved session + knowledge-base entry, move to resolved/. If still failing: capture the exact Unmatched URL + any Metro/device console text and reopen investigation. NOTE for the device build: this changes the route TREE (renamed (auth)/index -> welcome, removed (root), added app/index), so it REQUIRES a fresh native rebuild — `npx expo run:android` from apps/mobile/ (an OTA/Metro-only reload of the old native shell may not pick up the new route files); this also regenerates .expo/types/router.d.ts natively.

reasoning_checkpoint_round3:
  hypothesis: "Expo Router 57 builds the URL→route linking map STATICALLY from the whole file tree, independent of Stack.Protected guards (guards only filter which screens RENDER, via useSortedScreens). For the root path `/`, getStateFromPath's fork takes a dedicated branch (fork/getStateFromPath.js:114 `if (remaining === '/')`) that calls matchForEmptyPath (fork/getStateFromPath-forks.js:185), which collapses group segments and returns the FIRST leaf-node index config whose collapsed path is '' in sorted-config order — one deterministic winner, guard-agnostic. With TWO group indexes resolving `/` ((auth)/index and the round-2 (root)/index), the winner is (auth)/index (equal sort keys → stable tree order; `(auth)` precedes `(root)`). When authenticated, (auth) is filtered out of the rendered navigator (useScreens.js:135), so the nav state built from match.routeNames=['(auth)','index'] targets an unmounted screen → Unmatched Route for `/`. Adding (root)/index never helped because it never wins the empty-path match."
  confirming_evidence:
    - "fork/getStateFromPath.js:114-131 — dedicated `/` branch: `const match = matchForEmptyPath(configWithRegexes)` then builds state from `match.routeNames.map(name => ({name}))`. No guard/authState input anywhere."
    - "fork/getStateFromPath-forks.js:185-208 matchForEmptyPath — `leafNodes.find(config => config.path === '' && (!config.regex || config.regex.test('')))` returns the FIRST match in sorted order; group segments are collapsed via stripGroupSegmentsFromPath so both (auth)/index and (root)/index qualify."
    - "getRouteConfigSorter (forks:223-368) yields sort key 0 for (auth)/index vs (root)/index (same staticPartCount=1, same parts=['index'], neither pattern startsWith the other, neither isInitial) → stable order → tree order → `(auth)` before `(root)` wins."
    - "useScreens.js:124-139 useSortedScreens filters `protectedScreens` from the RENDERED children only — confirms Stack.Protected is render-time filtering, NOT linking-map resolution."
    - "getLinkingConfig.js:38-51 + getReactNavigationConfig.js:74-85 build the linking `config` from the full static `routes` tree (getRoutes) with zero guard awareness."
    - "GENERATED ARTIFACT: apps/mobile/.expo/types/router.d.ts:9-11 literally lists BOTH `${'/(auth)'} | /` AND `${'/(root)'} | /` — two routes claiming `/`, the collision made visible in the type output."
    - "Device (round-3 evidence above): Unmatched URL is definitively `/`; the fresh build INCLUDED (root)/index yet `/` was still Unmatched and NO dark bgAppDeep splash frame appeared → (root)/index never mounted, exactly as the collision predicts."
  falsification_test: "If matchForEmptyPath were guard-aware or Protected re-pointed `/`, then adding (root)/index under the authenticated guard would have fixed it — device proves it did not. If instead the URL had reset to /complete-profile (not `/`), the collision theory would be wrong — device confirms `/`."
  fix_rationale: "A SINGLE file (app/index.tsx) owns `/`, declared OUTSIDE every Stack.Protected block, so it is mounted in ALL auth states. getStateFromPath('/') therefore always resolves to a screen that is actually rendered, in every guard state — the collision is eliminated at the source (one `/` leaf, not two mutually-exclusive-guarded ones). It hands off with a declarative <Redirect> (self-healing, no reconciliation race). The colliding (auth)/index is renamed to (auth)/welcome so `/` has exactly one owner; the round-2 (root) group is deleted for the same reason. The cold-start deep-link consume stays in _layout's one-shot effect (capture-before-consume + StrictMode safety) and is delivered to app/index via context — unchanged load-bearing seam."
  blind_spots: "No device/simulator this session — declarative-redirect-from-a-single-unguarded-index is the canonical Expo Router auth pattern and the collision root cause is now source-verified, but the end-to-end guard-flip is device-only observable (node-env vitest has no RN renderer / no expo-router navigation). Regenerated .expo/types/router.d.ts by hand (gitignored artifact); a subsequent `expo start`/build will regenerate it identically. Rounds 1 & 2 both passed the unit gate and failed on device → this round is marked accepted-pending-human and MUST be device-verified before resolving."
  candidate_causes:
    - "code/routing: TWO files resolve `/` ((auth)/index + round-2 (root)/index) under mutually-exclusive guards; the static empty-path matcher picks one, guard-agnostic — PRIMARY, now the SINGLE root cause once deduped"
    - "framework behavior: matchForEmptyPath resolves `/` from the static linking map with no authState input; Stack.Protected is render-time only — the mechanism, not a defect"
    - "environment: guard-flip/cold-launch URL is `/` (festipal:///) — the exact path with the collision"
    - "data: fresh account (no deep-link href, no active-festival slug) surfaces it first, but the same `/` collision breaks authenticated deep-link/active-festival cold starts and in-session re-login/logout too"
  and_gate: "no (after dedup) — the reproduction needs only ONE condition once the design flaw is seen correctly: more than one file resolves `/` across mutually-exclusive guards. Round 2's AND-gate framing (needs authenticated guard AND URL `/`) was a symptom-level description; the structural fix is to guarantee a single always-mounted `/` owner, which closes every guard-state variant at once."

## ROUND 3 device evidence (captured from user on resume, 2026-08-09)

- timestamp: 2026-08-09
  checked: user device re-run of the exact reproduction (fresh install → OTP login → profile-setup → "Done"), against a FRESH `expo run:android` build that INCLUDED the round-2 (root)/index changes
  found: (1) Unmatched Route URL is DEFINITIVELY `/` (festipal:///) — confirmed on screen, no longer inferred. (2) The tested APK was a fresh native build WITH app/(root)/index.tsx + (root)/_layout.tsx present, yet `/` STILL renders Unmatched. (3) Transition timing: the Done button showed "Saving..." for ~1s (the async GET /me guard-flip round-trip) and THEN the Unmatched screen appeared — no dark bgAppDeep splash frame was seen in between.
  implication: FALSIFIES round-2's load-bearing assumption. If (root)/index had mounted at `/` it would render either its declarative <Redirect> (→ /home) OR, while coldStartTarget is null, its dark bgAppDeep splash <View> — the user saw NEITHER, they saw Expo's Unmatched Route. Therefore (root)/index NEVER MOUNTED and `/` is genuinely unresolved under the authenticated guard EVEN WITH the (root) group present. Stale-build and "reconciliation reset to /complete-profile not /" are both eliminated. New prime suspect: static `/` route collision between (auth)/index and (root)/index — adding a second group-index at `/` does not give the authenticated guard its own `/` resolver.


hypothesis: The new EXACT reproduction (fresh install → login → profile-setup → press "Done" → INSTANT Unmatched Route, same running session) CONFIRMS round-2's own trigger diagnosis: the fault fires on the in-session authenticated-no-profile → authenticated guard flip at profile-submit (NOT cold-start/relaunch). Round-2's declarative (root)/index redirect is aimed at exactly this flip and is the correct minimal fix. The orchestrator's suggested alternative — router.replace('/home') inside complete-profile.tsx handleDone — is INFERIOR here: refreshAuthState() drives the flip via an ASYNC GET /me round-trip, so a synchronous router.replace('/home') in handleDone fires while the guard is still authenticated-no-profile and /home is still guard-OFF → navigates to an unavailable route (not-found flash / dropped), it does not deterministically win either.
test: static reconciliation trace + Expo Router 57 source (Protected = Group, URL-driven state) + the device-observed Unmatched URL (`/`, not `/complete-profile`).
expecting: because the device showed the Unmatched screen at URL `/`, and round-2 adds a `/`-resolving route ((root)/index) under the authenticated guard, the reconciliation that reset the URL to `/` now lands on (root)/index → declarative <Redirect> → /home. That is the load-bearing (and only) framework-internal assumption; it is backed by the observed `/` URL.
decision: KEEP round-2 as the PRIMARY fix. Do NOT add the racy handleDone router.replace (it would fire pre-flip against a guard-OFF /home and could add a not-found flash). No redundant round-2 scaffolding to remove — every piece ((root) group, ColdStartTargetContext, pure href mapper, effect rewire) is load-bearing for the declarative approach.
next_action: DEFERRED BY USER (2026-08-09). Round-2 device verification FAILED — fresh install → new email → profile-setup → "Done" STILL lands on Unmatched Route (symptom unchanged; the declarative (root)/index redirect did NOT fix it on device). User chose to stop and resume later ("verschieben wir das problem auf irgendwann"). MISSING DISCRIMINATING SIGNAL not yet captured: the exact Unmatched URL (`/` vs `/complete-profile`) and whether a splash/flash was visible — this decides the next branch. Fix (round-1 + round-2 changes) remains UNCOMMITTED in the working tree; nothing committed or archived. To resume: `/gsd-debug continue first-login-unmatched-route`. When resuming, FIRST capture the exact Unmatched URL + any Metro/device console error text; then: URL still `/` → (root)/index is not mounting/redirecting as expected (harden (root)/index to self-resolve its home target on mount, independent of the effect/context); URL `/complete-profile` → Theory B (reconciliation did not reset to `/`) → pursue a synchronous guard flip. Also worth re-checking: whether the working-tree fix is actually in the built APK (stale native build / Metro cache) — a fresh `npx expo run:android` from apps/mobile/ with cleared cache before concluding the fix is wrong.

reasoning_checkpoint_round1_INVALIDATED: prior fix accepted by guardrail but REJECTED by human device verification — symptom unchanged. The empty-state router.replace('/home') was necessary but NOT sufficient; the real trigger is the Stack.Protected guard-flip reconciliation, not a pure empty-state fall-through.

reasoning_checkpoint_round2:
  hypothesis: "The authenticated guard set has NO route resolving path `/`. On the in-session authenticated-no-profile -> authenticated transition (profile submit -> refreshAuthState), Expo Router's Stack.Protected reconciliation removes the focused (profile-setup) route and resets the URL to `/` (festipal:///). With no `/` route under the authenticated guard (no (tabs)/index, no root anchor), it renders +not-found. The imperative router.replace('/home') in the redirect effect DOES fire but is issued in the same commit as the guard flip and does not reliably win against Protected's own reconciliation -> Unmatched Route persists. Any imperative navigation timed to the guard flip is fundamentally racy here; only a route that structurally MATCHES `/` under the authenticated guard is reliable."
  confirming_evidence:
    - "Human device verification: with router.replace('/home') present, STILL lands on Unmatched Route for festipal:/// (= `/`). The URL on the Unmatched screen is `/`, not `/complete-profile` — reconciliation resets to `/`."
    - "Route tree: no app/index.tsx, no (tabs)/index.tsx; only (auth)/index.tsx resolves `/`, guarded OFF when authenticated. Root Stack has no initialRouteName/anchor. (tabs) has initialRouteName='home' but a group's initialRouteName does NOT create a `/`-resolving route."
    - "Static trace of _layout.tsx:241-261: the redirect effect's dep array [authState.status, router] DOES re-run on the in-session transition and coldStartRedirectRef is still false there, so router.replace('/home') executes — yet the symptom is unchanged. => the navigation is issued but does not stick. Falsifies orchestrator's 'effect never re-fires'."
    - "expo-router 57 TabsClient: `href: null` only nulls the tabBarButton; the screen stays in state.routes, so a (tabs)/index would still render a duplicate button in the custom FloatingNav (which maps state.routes directly)."
  falsification_test: "If a route matching `/` renders under the authenticated guard, Expo Router can never show +not-found for `/` and a declarative <Redirect> from it navigates on mount regardless of guard-flip timing. If the symptom were a pure empty-state fall-through (round-1 theory), the round-1 router.replace('/home') would have fixed it — it did not, so the trigger is the missing `/` resolution under the authenticated guard."
  fix_rationale: "Add an authenticated-guard group (root)/index that resolves `/` and renders a DECLARATIVE <Redirect> to the resolveColdStartRedirect target. Declarative redirect from a matched route is self-healing and does not depend on winning a reconciliation race (unlike imperative router.replace). The consume+decision stays in the existing _layout effect (preserving capture-before-consume ordering, one-shot consume, and StrictMode double-invoke safety via coldStartRedirectRef); the effect now stores the resolved Href in state and passes it to (root)/index via context instead of calling router.replace. This also fixes the LATENT re-login-in-session -> Unmatched bug (the one-shot ref previously blocked the imperative redirect on re-login, leaving `/` unmatched)."
  falsification_test_2: "consumePendingDestination is a side effect; moving it into (root)/index render/useState would double-consume under React StrictMode dev double-invoke and could run BEFORE the _layout capture effect stores the pending href on the authenticated transition -> deep-link missed. Keeping consume in the ref-guarded _layout effect is therefore load-bearing, not incidental."
  blind_spots: "No device/simulator in this session — the declarative-redirect reliability at guard-flip is the standard Expo Router auth-pattern (protected index redirect) and verified against the installed expo-router 57 source (Protected=Group with guard; per-directory route dedup allows two group indexes at `/`), but the end-to-end cold-start is deferred to human UAT. Minor accepted edge: on a deep-link cold start the capture effect re-runs on the authenticated transition and may re-store the pending href after the effect consumed it (benign in-memory leak, only ever replayed on a subsequent `/` visit which normal tab nav never triggers)."
  candidate_causes:
    - "code/routing: no route resolves `/` under the authenticated Stack.Protected guard set (structural) — PRIMARY FIXABLE"
    - "code: redirect via imperative router.replace timed to the guard flip is racy against Protected reconciliation — CONTRIBUTING (why round-1 failed)"
    - "environment: cold-launch/guard-flip URL is `/` (festipal:///), the path with no authenticated match"
    - "data: fresh account -> no pending href + no active-festival slug -> empty state (the reported trigger condition), but the same `/`-unmatched gap also breaks active-festival/deep-link cold starts and in-session re-login"
  and_gate: "yes — reproduction needs BOTH (a) authenticated guard active (routing) AND (b) router path = `/` with no authenticated screen matching it (routing/environment). The round-1 fix targeted neither structurally (it added imperative navigation that loses the reconciliation race). The round-2 fix closes (b) structurally for ALL authenticated cold-start/guard-flip cases."

next_action: implement — add coldStartRedirectHref pure mapper + test; add ColdStartTarget context; add app/(root)/_layout.tsx + app/(root)/index.tsx declarative redirect; rewire _layout effect to setColdStartTarget (drop router.replace), register (root) as first authenticated screen; run vitest + typecheck + lint.

reasoning_checkpoint:
  hypothesis: "The empty-state cold-start branch (no href, no slug) performs no router.replace, leaving the router at root path `/`; under the authenticated Stack.Protected guard set no screen matches `/` (only (auth)/index served it, now guarded off), so Expo Router shows Unmatched Route for festipal:///."
  confirming_evidence:
    - "app/_layout.tsx:246-252 — the empty-state branch is a bare comment fall-through with NO router.replace; the href and slug branches both call router.replace explicitly."
    - "app router tree: no app/index.tsx and no (tabs)/index.tsx exist; only (auth)/index.tsx resolves path `/`. When authenticated, (auth) is guarded off (Stack.Protected guard=unauthenticated), so `/` matches nothing → +not-found."
    - "complete-profile.tsx:207 only calls refreshAuthState() — it performs NO explicit navigation, so after the authenticated transition the router path is still the launch root, never moved to /home."
    - "The two working paths (persisted slug → router.replace('/f/slug'); deep link → router.replace(href)) both navigate to a matching authenticated route, which is why only the empty state (fresh account) hits Unmatched Route."
  falsification_test: "If a persisted slug or pending deep link existed, an explicit router.replace fires and the symptom disappears — matches the report (bug is scoped to fresh account, no festival). If initialRouteName DID redirect root `/` → `/home`, no empty-state user would ever see Unmatched Route, contradicting the report."
  fix_rationale: "Adding an explicit router.replace('/home') for the empty state makes the authenticated router path always resolve to a real screen, exactly as the slug/deep-link branches already do. Addresses the root cause (unmatched root path under the authenticated guard), not a symptom."
  blind_spots: "Expo Router's exact Stack.Protected fallback on guard-flip is reconstructed from route topology + the reported Unmatched Route, not stepped in a debugger; the fix does not depend on that internal — it forces a matching route unconditionally. Also not device-reproduced (no simulator in this session)."
  candidate_causes:
    - "code: redirect effect empty-state branch has no explicit router.replace('/home') (app/_layout.tsx) — PRIMARY FIXABLE"
    - "config/routing: no index route (app/index.tsx or (tabs)/index.tsx) serves path `/` for the authenticated guard set — structural contributor; an alternative fix"
    - "data: fresh account → no persisted slug + no captured deep link → empty state (the trigger condition)"
    - "environment: cold-launch URL is `festipal:///` (root path `/`), the unmatched path under the authenticated guard"
  and_gate: "yes — reproduction needs BOTH (a) empty state (no slug AND no href — data) AND (b) authenticated guard active while router path = `/` with no authenticated screen matching it (routing/environment). Either a persisted slug/deep link (redirect fires) OR an index route serving `/` (path matches) would prevent it. The single PRIMARY fixable cause is the missing explicit /home replace; the missing index route is the same defect from the routing side."

## Evidence (Round 3 — expo-router 57 source verification of the `/` collision)

- timestamp: 2026-08-09
  checked: installed expo-router 57.0.9 URL→route resolution for path `/` — fork/getStateFromPath.js, fork/getStateFromPath-forks.js, useScreens.js, getLinkingConfig.js, getReactNavigationConfig.js
  found: (1) The linking config is built statically from the full route tree (getLinkingConfig.js:38-51 → getReactNavigationConfig.js:74-85), guard-agnostic. (2) getStateFromPath has a DEDICATED root-path branch: `if (remaining === '/')` → `matchForEmptyPath(configWithRegexes)` → builds nav state from `match.routeNames` (getStateFromPath.js:114-131). (3) matchForEmptyPath (getStateFromPath-forks.js:185-208) collapses group segments (stripGroupSegmentsFromPath) and returns the FIRST leaf-node index whose collapsed path is '' — so BOTH (auth)/index and (root)/index qualify, and exactly ONE is chosen. (4) getRouteConfigSorter (forks:223-368) returns 0 for these two (equal staticPartCount=1, parts=['index'], neither pattern a prefix of the other, neither isInitial) → stable order → route-tree order → `(auth)` wins. (5) Stack.Protected filtering is RENDER-ONLY: useSortedScreens (useScreens.js:124-139) removes protectedScreens from the rendered children set, never from the linking map.
  implication: `/` statically resolves to (auth)/index in ALL auth states. When authenticated, (auth) is render-filtered out, so the nav state (routeNames ['(auth)','index']) points at an unmounted screen → Unmatched Route. Round-2's (root)/index can never win the empty-path match, so it never mounts — matching the device evidence (URL `/`, no dark splash frame). Two group indexes at `/` under mutually-exclusive guards is fundamentally broken; the fix must guarantee a SINGLE always-mounted `/` owner.

- timestamp: 2026-08-09
  checked: generated typed-routes artifact apps/mobile/.expo/types/router.d.ts (lines 9-11)
  found: The href union contains BOTH `${'/(auth)'} | /` AND `${'/(root)'} | /` — two route entries claiming path `/`.
  implication: The collision is visible in expo-router's own generated output, independent of runtime — direct corroboration of the source trace above.

## Symptoms

expected: After first login + profile submit on a fresh account with no festival chosen/saved, the app should land on the Home / festival-selection start screen (`/home`).
actual: Lands on Expo Router "Unmatched Route" screen for URL `festipal:///` instead of Home.
errors: "Screen + Konsolenfehler" — Unmatched Route screen is shown AND there is an accompanying warning/exception in the Metro/device console (exact text to be captured during investigation).
reproduction: Fresh account. Complete first login, submit the profile form. No festival is selected/saved. Observe landing screen after submit / on cold-start.
started: Unclear — first observed during current testing (Phase 5, branch docs/phase-05-context-and-designs). Not confirmed whether this path ever worked; possibly related to the 05-11 cold-start-restore change.

## Evidence (Round 2 — reconciliation with exact in-session reproduction)

- timestamp: 2026-08-09
  checked: complete-profile.tsx handleDone (line 179-217) — orchestrator direction #2
  found: On a 200 it calls ONLY `refreshAuthState()` (line 207); NO router.push/replace. Confirmed: no explicit navigation after profile completion. `refreshAuthState()` → setMeRefreshToken → resolveAuthState effect → `await apiClient.getMe()` → setAuthState('authenticated'). The guard flip is therefore ASYNC (a network round-trip after the button press).
  implication: A naive `router.replace('/home')` added right after refreshAuthState() would run SYNCHRONOUSLY, before the async getMe resolves — at that instant the guard is still authenticated-no-profile and /home sits under the guarded-OFF authenticated block. So the orchestrator's suggested handleDone imperative is itself racy/inferior, not a deterministic fix. The deterministic seam is a route that resolves `/` AFTER the guard opens — exactly round-2's (root)/index.

- timestamp: 2026-08-09
  checked: login→profile-setup navigation pattern — orchestrator direction #3 (verify.tsx submitOtp line 62-86)
  found: verify.tsx does NOT navigate explicitly to profile-setup either. On OTP success (line 79 comment) "the root layout's guard re-resolves and routes forward on its own — no manual navigation from here." The ONLY explicit router call in the auth flow is email.tsx → verify.tsx (line 54, `router.push('/verify')`), which is a WITHIN-(auth)-group push, not an auth-state transition.
  implication: CORRECTS the orchestrator's premise. Both auth-STATE transitions (verify→profile-setup AND profile-setup→home) are GUARD-DRIVEN, not explicit. There is no "second missing explicit navigation" and the gap is NOT "handleDone forgot to mirror login." The real asymmetry is ROUTE TOPOLOGY: (profile-setup) is a group with one concrete-path screen (deterministic landing → works), while the authenticated group had NO `/`-resolving anchor (round-2 adds (root)/index to close exactly that asymmetry).

- timestamp: 2026-08-09
  checked: Expo Router 57.0.9 source — views/Protected.js, layouts/stack-utils/mapProtectedScreen.js, useScreens.js (useSortedScreens line 124-139)
  found: `Protected` is literally `Group` with a `guard`; guarded screens are FILTERED OUT of the sorted screen set (useSortedScreens line 135 `!protectedScreens.has(route)`). Expo Router is URL-driven: state is derived from the URL against the CURRENT (post-filter) screen set. On the guard flip the focused route /complete-profile is filtered out; the device evidence shows the URL then reset to `/` (Unmatched screen showed festipal:///). Under the authenticated guard the ONLY `/` route is now (root)/index (round-2); (auth)/index is filtered off.
  implication: The reconciliation resets to `/`, and round-2 makes `/` match (root)/index → declarative <Redirect> from a settled state. This is why round-2's declarative approach can win where round-1's imperative router.replace (issued from RootLayout mid-reconciliation, before the state settled) did not. The one load-bearing assumption (reconciliation resets to `/`) is directly supported by the device-observed `/` URL.

- timestamp: 2026-08-09
  checked: gates re-run on the applied round-2 tree
  found: typecheck (tsc --noEmit) clean; lint (eslint .) clean; vitest 79/79 (10 files) incl. cold-start-redirect.test.ts 10/10. No code change was needed — round-2 already targets the confirmed trigger.
  implication: Static verification green; the only open item is device UAT of the declarative redirect (node-env vitest cannot exercise Expo Router navigation — same guardrail limitation noted in round-2).

## Evidence (Round 2)

- timestamp: 2026-08-09
  checked: app/_layout.tsx:241-261 (current state on disk — the prior fix)
  found: The redirect effect IS present with `case 'home': router.replace('/home')`. Dep array is `[authState.status, router]`. coldStartRedirectRef gates one-shot but is only set true inside the authenticated branch, so on the FIRST authenticated transition (in-session, post profile-submit) the effect DOES execute router.replace('/home'). The orchestrator's "effect never re-fires" hypothesis is FALSE by static trace.
  implication: The fix is being called but does not clear the Unmatched Route → the failure is NOT "no navigation issued"; it is that the navigation does not resolve to a mounted authenticated screen at the guard-flip instant. Points at Stack.Protected reconciliation, not the empty-state branch.

- timestamp: 2026-08-09
  checked: full route tree + all group _layouts
  found: (tabs)/_layout.tsx is a Tabs with initialRouteName="home", screens home + festivals, NO index.tsx. (profile-setup) and (auth) are plain <Stack/>. Root Stack in _layout.tsx has NO initialRouteName/anchor. Authenticated Stack.Protected block's first screen is `(tabs)`. There is no route resolving `/` under the authenticated guard, and the (tabs) group itself has no index route.
  implication: When the guard flips authenticated-no-profile → authenticated, the previously-focused /complete-profile unmounts and Expo Router must fall back to the authenticated block; with no index/anchor resolving that fallback it renders +not-found (Unmatched Route). This is the structural contributor the prior fix did NOT address (it only added imperative navigation).

## Eliminated

- hypothesis: "reconstructDeepLinkRoute captures `festipal:///` as a pending destination and replays it into Unmatched Route"
  evidence: lib/deep-link.ts:40-52 returns `null` for a root link (`festipal:///` — empty hostname + empty path), and app/_layout.tsx:141 `if (!route) return` short-circuits, so NOTHING is captured. The pending-destination path is not involved; the fault is the empty-state fall-through.
  timestamp: 2026-08-09

## Evidence

- timestamp: 2026-08-09
  checked: app/_layout.tsx:232-253 cold-start redirect effect (empty-state branch)
  found: The effect calls router.replace only in two branches — a consumed pending href (line 242) and a persisted active-festival slug (line 248). The "no href, no slug" case (lines 250-252) is a bare comment with NO router.replace; it relies on `(tabs)/_layout.tsx` initialRouteName="home".
  implication: For a fresh account with no saved festival and no deep link, the effect runs, sets coldStartRedirectRef, and navigates nowhere — the router path is left unchanged.

- timestamp: 2026-08-09
  checked: app router file tree (find apps/mobile/app) + Stack.Protected guards in _layout.tsx:276-287
  found: There is NO app/index.tsx and NO (tabs)/index.tsx. The only route resolving path `/` is (auth)/index.tsx (Welcome). Under the `authenticated` guard, (auth) is guarded OFF; the authenticated screens are (tabs)/home (`/home`), (tabs)/festivals (`/festivals`), (festival)/f/[festivalSlug] (`/f/:slug`) — none match `/`.
  implication: When authenticated with the router still at root `/` (the cold-launch `festipal:///`), no screen matches → Expo Router renders Unmatched Route for `festipal:///`. This is the exact reported symptom.

- timestamp: 2026-08-09
  checked: app/(profile-setup)/complete-profile.tsx handleDone (lines 179-217)
  found: On a 200 it calls only refreshAuthState() (line 207) — no router.push/replace. The authenticated transition is driven purely by the guard; nothing moves the router off the launch root path.
  implication: After profile submit the router path is still the launch root, so the empty-state fall-through leaves the app on an unmatched `/` under the authenticated guard. Confirms the fresh-account scoping.

- timestamp: 2026-08-09
  checked: existing `/home` usage — lib/festival-navigation.ts:28 `router.replace('/home')`
  found: `/home` is already used as a valid typed route elsewhere (leaveFestival no-history fallback), resolving to (tabs)/home.tsx.
  implication: An explicit `router.replace('/home')` in the empty-state branch is type-safe and consistent with existing navigation.

## Resolution

root_cause: |
  ROUND 4 — CONFIRMED from on-device signal (supersedes the operative cause of rounds 1–3).
  The decisive device fork from the RESUME (b) diagnostics is RESOLVED: `app/index` MOUNTS in
  EVERY auth state and logged the smoking gun. There was NEVER a live route collision at `/`
  in the running app — R3's single top-level `/` owner (app/index.tsx) is CORRECT and is KEPT.

  The real bug is a captured Expo **Dev Client launch deep-link**. The Expo Dev Client launches
  the app via the URL `festipal:///expo-development-client/?url=http://<metro-host>`. In
  app/_layout.tsx the deep-link capture effect runs
  `reconstructDeepLinkRoute(Linking.parse(url), 'festipal')`: scheme `festipal` === appScheme →
  isCustomScheme=true → joins [hostname, path] → route = `"expo-development-client"`.
  `AUTH_FLOW_PATHS` does NOT contain it, so it was captured via
  `capturePendingDestination('/expo-development-client')`. On the authenticated transition the
  cold-start effect consumes it → `resolveColdStartRedirect` returns
  `{kind:'deep-link', href:'/expo-development-client'}` → `coldStartRedirectHref` →
  `'/expo-development-client'` → app/index renders `<Redirect href="/expo-development-client">`
  → no such route → Expo Unmatched Route (`festipal:///` / `/expo-development-client` on screen).

  Verbatim device log stream (key lines): guard resolves correctly through
  loading → unauthenticated → authenticated-no-profile → authenticated; `app/index MOUNTED
  authStatus=authenticated coldStartTarget=null computedTarget=null`; then `setColdStartTarget
  {"redirect":{"href":"/expo-development-client","kind":"deep-link"},"resolvedHref":
  "/expo-development-client"}`; then `app/index MOUNTED authStatus=authenticated
  coldStartTarget="/expo-development-client" computedTarget="/expo-development-client"`.

  This is a DEV-CLIENT-ONLY artifact: a production standalone launch is a bare `festipal://`
  that `reconstructDeepLinkRoute` already maps to `null` → home. But it fires on EVERY Expo Dev
  Client launch, which is exactly the user's "every time" repro. It supersedes rounds 1–3 as the
  operative cause; R3's structural single-`/`-owner is retained (it is precisely what let
  app/index mount and log the captured `/expo-development-client` target that identified this).
fix: |
  Minimal, dev-device-verifiable: stop the capture effect from ever storing an Expo tooling
  launch link as a pending destination.
  - NEW pure predicate lib/deep-link.ts::isIgnorableDeepLinkRoute(route) — returns true when the
    first path segment is an Expo-internal launch path (`expo-development-client`, `_expo`, or
    the Expo Go `--` separator prefix). Same framework-free, node-env-unit-testable shape as the
    existing reconstructDeepLinkRoute; operates on the already-reconstructed route so it composes
    with AUTH_FLOW_PATHS.
  - app/_layout.tsx — the deep-link capture effect now short-circuits
    `if (isIgnorableDeepLinkRoute(route)) return;` ALONGSIDE the existing
    `if (AUTH_FLOW_PATHS.has(route)) return;`, so no Expo-internal launch path is captured/replayed.
  - Removed ALL temporary [UNMATCHED-DEBUG] diagnostics from app/index.tsx and app/_layout.tsx
    (grep across apps/mobile confirms ZERO remain).
  R3's single-`/`-owner scaffolding is UNCHANGED and retained (app/index.tsx as the sole `/`
  owner outside all guards, (auth)/welcome, no (root) group, lib/auth-state.ts, lib/root-redirect.ts,
  ColdStartTargetContext). resolveColdStartRedirect + coldStartRedirectHref unchanged.
verification: |
  guardrail_verdict: accepted-pending-human (device repro now expected to land on Home)
  - regression test (specified oracle): apps/mobile/lib/__tests__/deep-link.test.ts — +8 new
    isIgnorableDeepLinkRoute tests: ignores expo-development-client (bare + with trailing
    segment), _expo/*, --/* separator, leading-slash tolerance; and the load-bearing NEGATIVE
    guards — a real festival route (f/nova-sound-2026), a route merely containing the word
    downstream (f/expo-development-client), and the empty root route are NOT ignored. Pins that
    the fix cannot swallow real deep links.
  - root-redirect.test.ts (7/7) + cold-start-redirect.test.ts (10/10) unchanged — R3 decision
    logic still green.
  - typecheck: pnpm --filter @festipal/mobile typecheck (tsc --noEmit) — clean. PASS.
  - lint: pnpm --filter @festipal/mobile lint (eslint .) — clean. PASS.
  - full mobile suite: pnpm --filter @festipal/mobile test (vitest run) — 94/94 pass (11 files;
    +8 new isIgnorableDeepLinkRoute tests, was 86). No regressions. PASS.
  - GUARDRAIL LIMITATION (honest): the capture→replay flow has no node-env runtime surface (no
    RN renderer, expo-router navigation + Linking unavailable in vitest), so the unit suite pins
    the predicate decision but cannot exercise the effect end-to-end. HOWEVER, unlike rounds 1–3,
    this fix targets the EXACT captured target the device log proved (`/expo-development-client`),
    so the confirmed mechanism (not a theory) is what the predicate now filters. Device
    confirmation of the user's exact repro under `npx expo start -c` is still required before
    marking resolved.
files_changed:
  - apps/mobile/lib/deep-link.ts (NEW isIgnorableDeepLinkRoute pure predicate — round 4 fix)
  - apps/mobile/app/_layout.tsx (capture effect filters isIgnorableDeepLinkRoute alongside AUTH_FLOW_PATHS; all [UNMATCHED-DEBUG] logs removed)
  - apps/mobile/app/index.tsx ([UNMATCHED-DEBUG] log removed; R3 single-`/`-owner otherwise unchanged and retained)
  - apps/mobile/lib/__tests__/deep-link.test.ts (+8 regression/boundary tests for isIgnorableDeepLinkRoute)
  - "--- retained from R3 (correct, unchanged): ---"
  - apps/mobile/app/index.tsx (R3 — the SINGLE `/` owner, outside all guards, declarative redirect)
  - apps/mobile/app/(auth)/welcome.tsx (R3 — renamed from (auth)/index.tsx)
  - apps/mobile/app/(root)/* (R3 — removed second colliding `/` owner)
  - apps/mobile/lib/auth-state.ts (R3 — AuthState union + AuthStateContext)
  - apps/mobile/lib/root-redirect.ts (R3 — pure rootRedirectTarget mapper)
  - apps/mobile/lib/cold-start-target.ts, lib/cold-start-redirect.ts (R3 — unchanged)
  - apps/mobile/lib/__tests__/root-redirect.test.ts (R3 — 7 decision tests)
oracle_type: specified (the bug report's expected behavior — fresh account, no festival -> land on Home, never Unmatched Route — is the explicit oracle; deep-link.test.ts's isIgnorableDeepLinkRoute cases pin that Expo tooling launch links are never captured while real deep links still are)
