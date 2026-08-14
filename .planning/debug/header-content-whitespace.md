---
status: diagnosed
trigger: "G-09-2 (header-content-whitespace): After the Phase 09 AppHeader/clearance work, screens show a large whitespace band between the AppHeader and the start of the page content."
created: 2026-08-14T14:30:00Z
updated: 2026-08-14T15:10:00Z
---

## Current Focus

bug_class: Bohrbug (deterministic layout regression, reproduces on every screen open)

hypothesis: "H1 CONFIRMED ON DEVICE — root Stack renders default native headers for the group registrations; nested content laid out 80dp lower; AppHeader glass hides the bar; screens add full clearance on top => 99dp resting gap vs 18dp design. See Evidence (DEVICE CONFIRMATION 1-3) and Resolution.root_cause."
test: complete — emulator (Pixel 9a AVD, current-branch JS via own Metro on 8083), OTP login as uat07-a@quiks.dev, uiautomator bounds + screenshots
expecting: n/a — investigation closed
next_action: Return ROOT CAUSE FOUND to orchestrator (diagnose-only mode; no fix applied). Fix plan should add headerShown:false for index/(auth)/(profile-setup)/(tabs)/(festival) at the root Stack (or root screenOptions + explicit headerShown:true on friend-detail), then re-verify the 18-20px resting gap on the physical device — including the welcome screen, where the emulator shows a visible '(auth)' bar that today's phone UAT did not record.

reasoning_checkpoint: (pre-fix checkpoint not yet reached — diagnose-only mode)
candidate_causes:
  - "code: root Stack group registrations missing headerShown:false (native header pushes content down)"
  - "code: clearance applied twice (layout wrapper AND screen) — ELIMINATED by reading all layouts/screens"
  - "config/environment: expo-router SDK behavior change — ELIMINATED (same ~57.0.9 since phase 5)"
  - "data/definition: token values oversized (topbar/sp-7) — ELIMINATED (56/20/18: static math gives a 18-20px gap, too small to be the complaint)"
and_gate: "Possibly yes — H1 requires BOTH the missing headerShown:false at the root registrations AND the AppHeader glass visually masking the resulting blank native bar (which is why 8 phases of UAT + today's Test 3 never saw a bar). The second condition explains non-detection, not the gap itself."

## Symptoms

expected: Content starts directly under the AppHeader glass — clearance below the header equals header height plus normal content top padding, no large empty band. (Phase 09 intent: content starts under the glass and scrolls behind it.)
actual: "pass. Aber das screen layout passt jetzt nicht mehr. es ist jetzt sehr viel whitespace zwischen AppHeader und dem start vom page content" — header states/auth boundary behave correctly, but there is now a lot of whitespace between the AppHeader and the first content element (layout regression observed on device).
errors: None reported
reproduction: UAT Test 2 — open a festival screen (e.g. Start/Dashboard) on device and look at the resting gap between the glass header and the first content element. Test 3 PASSED — no double native header, content does scroll behind the glass; defect is only the excessive resting gap.
started: Discovered during Phase 09 UAT on 2026-08-14, on-device, after the 09-04 plans (AppHeader + no-double-header/clearance work) landed on branch feat/mobile-phase-09-nav-shell (HEAD 2f66ff4).

## Eliminated

- hypothesis: "Double top inset at screen level — SafeAreaView with top edge + clearance containing insets.top"
  evidence: "All 11 screens + the festival gate use SafeAreaView edges={['bottom']} (no top inset). start.tsx, festivals.tsx, (festival)/index.tsx, activities.tsx, gate _layout all verified by reading. The inline paddingTop overrides the base style's paddingTop (RN style-array merge), so no stacking there either."
  timestamp: 2026-08-14T14:45:00Z

- hypothesis: "Clearance applied twice — layout wrapper AND screen"
  evidence: "(tabs)/_layout.tsx and (festival)/f/[festivalSlug]/_layout.tsx add NO padding around their navigators; the gate layout applies clearance only to its own non-tabs message branch. PlaceholderScreen adds only normal screenPad, no clearance."
  timestamp: 2026-08-14T14:50:00Z

- hypothesis: "Clearance sized for max font scale regardless of actual scale"
  evidence: "useHeaderClearance() = insets.top + layout.topbar (56, a fixed dp constant, no font-scale term). AppHeader wrapper height is the identical expression, so glass height and clearance are equal by construction."
  timestamp: 2026-08-14T14:50:00Z

- hypothesis: "Token values oversized (topbar / sp-7 / screenPad)"
  evidence: "topbar=56, screenPad=18, sp-7=20 (packages/ui/src/tokens.ts). Static math yields a resting gap of 18-20px below the glass — design-correct, far too small to be 'sehr viel whitespace'. The extra band must come from a runtime layout offset, not the constants."
  timestamp: 2026-08-14T14:55:00Z

- hypothesis: "expo-router/SDK version change altered header defaults between phases"
  evidence: "apps/mobile/package.json pins expo/expo-router ~57.0.9 unchanged since Phase 5 (git show cfefe9f/44e7914)."
  timestamp: 2026-08-14T15:05:00Z

## Evidence

- timestamp: 2026-08-14T14:40:00Z
  checked: "09-04-SUMMARY.md + AppHeader.tsx"
  found: "useHeaderClearance() = insets.top + layout.topbar; AppHeader is an absolute overlay (top:0, height insets.top+topbar) mounted as sibling AFTER the root <Stack> inside a flex:1 View in app/_layout.tsx"
  implication: "Glass band and clearance are equal; correct IF the screens' y-origin is the window top"

- timestamp: 2026-08-14T14:48:00Z
  checked: "app/_layout.tsx root Stack registrations"
  found: "profil/friends-qr/friends-find/cashless have options={{headerShown:false}} with comments 'a Native Stack screen with no explicit header option defaults to a VISIBLE (blank) native header'. But index, (auth), (profile-setup), (tabs), (festival) have NO headerShown option. Root Stack has NO screenOptions."
  implication: "By the implementers' own documented rule, the (tabs) and (festival) group screens should be showing a default native header — the exact hazard they guarded profil/friends-qr against"

- timestamp: 2026-08-14T15:00:00Z
  checked: "expo-router 57 installed source (vendored @react-navigation/native-stack fork)"
  found: "useHeaderConfigProps.js line 252: `hidden: headerShown === false` — header is shown unless explicitly false. No auto-hide for screens containing nested navigators (checked screenOptionsFactory, composition-options, NativeStackView fork). NativeStackView.native.js passes headerShown through untouched."
  implication: "Source-level confirmation that a root Stack screen without headerShown:false renders a native header (title = route name)"

- timestamp: 2026-08-14T15:02:00Z
  checked: "(festival)/_layout.tsx"
  found: "09-03 Task 1 comment: 'headerShown: false added so the native Stack header no longer sits above the nested five-tab festival navigator' — the intermediate (festival) Stack needed exactly this fix one nesting level down"
  implication: "Precedent inside this codebase that a Stack screen hosting a nested navigator DOES grow a native header unless explicitly hidden — same class as H1, fixed at the intermediate level but never at the root level"

- timestamp: 2026-08-14T15:10:00Z
  checked: "Static gap math per screen (no root header assumed)"
  found: "start.tsx: paddingTop = clearance+18; dashboard: clearance+20; activities: clearance (SafeAreaView); festivals: clearance+18. All resting gaps 0-20px below glass — matches design intent"
  implication: "The code as written cannot produce a large gap on its own; a parent-level y-offset (native header) is the only remaining mechanism"

- timestamp: 2026-08-14T15:20:00Z
  checked: "Emulator experiment setup"
  found: "Physical device disconnected; Pixel_9a AVD booted (emulator-5554). Today's app-debug.apk (15:48) is arm64-only -> crashed on x86_64 emulator (SoLoaderDSONotFoundError libreactnative.so). Rebuilt via npx expo run:android --no-bundler; own Metro on 8083 (host 8081 = API, 8082 = user's stale expo CLI); debug_http_host pref set to 10.0.2.2:8083 inside the emulator app."
  implication: "Device-signal verification per project lesson 'RN routing/native bugs always verify on device'"

- timestamp: 2026-08-14T15:55:00Z
  checked: "DEVICE CONFIRMATION 1 — welcome screen on emulator (current branch JS via Metro)"
  found: "Welcome/email screens show a VISIBLE white native header bar with the literal title '(auth)' above the Papier content (screenshot s5_welcome.png/s6_email.png). This is the root Stack's default native header for the (auth) group registration."
  implication: "Root Stack group screens DO render default native headers — H1's mechanism exists in the running app. (Note: today's phone UAT recorded 'NO header on welcome' as passing — recheck on the phone during fix verification.)"

- timestamp: 2026-08-14T16:00:00Z
  checked: "DEVICE CONFIRMATION 2 — Start tab after OTP login (uat07-a@quiks.dev), uiautomator bounds (density 2.625, dp = px/2.625)"
  found: "Native root header: LinearLayout [0,0][1080,210] (80dp) containing TextView text='(tabs)' at [42,101][183,172] — visibly ghosting through the translucent AppHeader glass behind the home button (screenshot s9_after_code.png). Nested Tabs content origin: y=210 (below the native header), NOT y=0. AppHeader glass overlay: [0,0][1080,207]. Start screen ScrollView [0,210][...], first content 'No festival saved yet' at y=467. Resting gap glass-bottom(207) -> content(467) = 260px = 99dp, versus the designed 18dp. Extra = ~80dp = exactly the native header band."
  implication: "ROOT CAUSE CONFIRMED: the (tabs) tree is laid out below a hidden-behind-the-glass native header, and the screens add the full clearance (insets.top+56) on top of that offset — double top chrome"

- timestamp: 2026-08-14T16:05:00Z
  checked: "DEVICE CONFIRMATION 3 — festival entry (Frequency 2026)"
  found: "Same mechanism in the (festival) group: native header TextView text='(festival)' at [189,101][400,172] under the glass (glass shows 'Frequency 2026' at [194,111][917,163]); Dashboard tile row pushed to y=645"
  implication: "Both group registrations ((tabs) AND (festival)) exhibit the identical offset; fix must cover index/(auth)/(profile-setup)/(tabs)/(festival)"

- timestamp: 2026-08-14T16:08:00Z
  checked: "Dependency-drift check + friend-detail constraint"
  found: "pnpm-lock.yaml diff 44e7914..HEAD shows NO version change for expo-router (57.0.9) or react-native-screens (4.26.2) — only peer-graph reshuffling. friend-detail.tsx sets presentation/title/headerLeft/headerRight in its own <Stack.Screen options> but does NOT set headerShown:true explicitly."
  implication: "No environment drift; pre-09 the native group headers were present too, but pre-09 tab screens sat visually below per-tab JS headers and did not add an 81dp clearance, so no dead band was perceived. Fix constraint: a global screenOptions={{headerShown:false}} on the root Stack would ALSO hide friend-detail's modal close-button header unless it gains an explicit headerShown:true."

## Resolution

root_cause: "The root Stack in apps/mobile/app/_layout.tsx registers the `(tabs)` and `(festival)` group screens (and `index`/`(auth)`/`(profile-setup)`) WITHOUT `headerShown: false`. React Navigation native-stack (vendored in expo-router 57; useHeaderConfigProps.js: `hidden: headerShown === false`) therefore renders a default-visible native header (title = route name) for those screens, and react-native-screens lays the nested navigator content out BELOW that ~80dp header band. 09-04's AppHeader is an absolute overlay spanning [0, insets.top+56] that sits exactly on top of the native bar and hides it (which is why UAT Test 3 'no native title bar above the glass' passed — the '(tabs)' title literally ghosts through the blur behind the home button), while every screen additionally pads its content by useHeaderClearance() (insets.top+56) + design padding measured from an origin that is ALREADY 80dp below the window top. Net effect measured on device (Pixel 9a emulator, density 2.625): resting gap glass->first content = 99dp instead of the designed 18dp — the ~80dp excess being precisely the hidden native header band. 09-04 identified this exact hazard and fixed it for the `profil`/`friends-qr` registrations ('a Native Stack screen with no explicit header option defaults to a VISIBLE (blank) native header') but never applied it to the group registrations; 09-03 fixed the same class one level down ((festival)/_layout.tsx's own Stack). Pre-09 the bar existed too (no dep drift since phase 6: expo-router 57.0.9 / react-native-screens 4.26.2 unchanged), but tab screens then had per-tab JS headers below it and no 81dp clearance, so no dead band was perceived; 09-04's absolute glass + clearance turned the offset into a visible whitespace band."
fix: "(not applied — diagnose-only mode)"
verification: "(n/a)"
files_changed: []
