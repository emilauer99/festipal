---
phase: 08-friends
plan: "05"
subsystem: ui
tags: [expo-camera, camera-permission, qr-scan, expo-router, lingui, react-native, friends]

requires:
  - phase: 08-friends
    plan: "04"
    provides: "app/friends-qr.tsx's SegmentedControl/mode shell (the 'scan' branch was a placeholder), lib/qr-payload.ts's parseQuiksCodePayload/encodeQuiksCodePayload (Phase-7 D-17 namespaced-plaintext format), lib/friend-queries.ts's friendKeys.handle(username)"
  - phase: 08-friends
    plan: "01"
    provides: "lib/use-friend-mutations.ts (the ONE mutation call site), components/RelationAction.tsx (the D-04 relation-mapped action set this plan's confirmation card reuses verbatim), components/PersonRow.tsx's avatar/name/handle layout as the confirmation card's visual precedent"
provides:
  - "apps/mobile/components/CameraScanPanel.tsx — the three camera-permission sub-states (pending/granted/denied), the arm/disarm barcode-scan state machine, the decode-then-lookup flow and the D-14 scan confirmation card"
  - "expo-camera@~57.0.3 in apps/mobile/package.json + its own app.json plugin entry (cameraPermission rationale, recordAudioAndroid: false, microphonePermission: false)"
  - "app/friends-qr.tsx's 'scan' segment renders CameraScanPanel for real — no more empty placeholder View"
  - "(tabs)/friends.tsx's search TextInput takes a ref and focuses on ?focusSearch=1 — the camera-free path's landing side (D-16)"
affects: []

actuals:
  tokens: 8200
  tasks: 2
  commits: 2

tech-stack:
  added: [expo-camera]
  patterns:
    - "requestPermission() fired exactly once per mount via a useRef guard, gated on the hook's own permission object being non-null — the hook itself both reads the current OS status AND exposes the imperative request function, so 'ask at the moment of switching to Scan' (D-15) needs no separate rationale screen: the effect fires the instant the panel mounts, which IS that moment by construction (the panel only mounts while the SegmentedControl is on 'scan')."
    - "Scanner disarm via prop identity, not a ref/mutable flag: onBarcodeScanned is handed a function ONLY while scanState.kind === 'idle'; every other kind sets the prop to undefined. This is what actually stops CameraView's native per-frame callback from firing again while a decoded code is still sitting in the frame — a boolean guard INSIDE the handler would still let the native side call into JS, just to a no-op, which is a weaker mitigation for the same DoS/race concern (T-08-21)."
    - "A 404-as-named-outcome lookup state (LookupViewState with 'notFound' as its own kind, not folded into a generic 'response error') — lookupVisitor's contract only ever defines 200/404, so 'status !== 200' IS the named 404 branch here, unlike screens where non-200 covers an open set of failure shapes."
    - "A local, project-pattern-consistent 'transport error' branch for the scan lookup that the UI-SPEC's Copywriting Contract doesn't explicitly enumerate — added under deviation Rule 2 (see Deviations below), reusing the exact verbatim transport-error string every other query on this screen family already uses."

key-files:
  created:
    - apps/mobile/components/CameraScanPanel.tsx
  modified:
    - apps/mobile/app.json
    - apps/mobile/package.json
    - pnpm-lock.yaml
    - apps/mobile/app/friends-qr.tsx
    - "apps/mobile/app/(tabs)/friends.tsx"
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "The native rebuild (npx expo run:android) was NOT run by this executor. The coordinator's standing constraint for this session explicitly forbids it on this Windows host — the executor stops and surfaces a human-action checkpoint with the exact command instead, which is exactly what this plan does at its end. All automated verification (typecheck/lint/lingui compile --strict/vitest) passes against the installed package and the new component's source without needing the native module to be built into a running app."
  - "A dedicated 'transport error' branch was added to the scan lookup's view state, reusing the project's existing verbatim transport-error copy + Nochmal scannen — the UI-SPEC's Copywriting Contract only names 'kein quiks-Code' (invalid payload) and 'nicht mehr gueltig' (404) for this surface, but every other query on the Friends screen family distinguishes a genuine network failure from a defined non-200 response, and leaving this scan lookup as the one query on the screen without that distinction would silently swallow a real connectivity failure (Rule 2 — missing critical functionality: error handling)."
  - "The camera preview's container has a FIXED height (320px) rather than flex-filling the panel, per the plan's own action text ('Container mit fester Hoehe'): this keeps the granted state's layout stable regardless of which sub-state (idle hint / invalid+retry / resolving / confirmation card) renders below it, instead of the preview growing/shrinking as the content beneath it changes."
  - "CameraScanPanel renders its own ScrollView (not just a View) as its root — the plan's UI-consideration-probe backstop (row 54) requires the denied-state callout to sit inside a scroll container so the longest catalog string never clips; wrapping the WHOLE panel (not just the denied branch) keeps the component's root element stable across all three permission sub-states."

patterns-established:
  - "Scanner-arm-via-prop-identity (see tech-stack.patterns) — the template for any future native event stream (e.g. a second barcode-driven flow) that needs a hard, verifiable stop rather than a soft in-handler guard."

requirements-completed: []

coverage:
  - id: D1
    description: "expo-camera@~57.0.3 installed via `npx expo install` (SDK-57-matched, not hand-pinned); app.json carries its own expo-camera plugin entry with a scan-specific cameraPermission rationale (distinct from expo-image-picker's avatar-photo rationale), recordAudioAndroid: false and microphonePermission: false so no audio permission enters the native manifest"
    requirement: FRND-04
    verification:
      - kind: unit
        ref: "node -e \"...\" plugin-shape check from the plan's own <automated> verify block — exit 0"
        status: pass
      - kind: other
        ref: "cd apps/mobile && pnpm typecheck && pnpm lint — both exit 0 against the newly installed package"
        status: pass
    human_judgment: true
    rationale: "The manifest-level claims (Camera permission listed, Mikrofon NOT listed) require a built APK on a real device — this executor did not run the native rebuild (npx expo run:android), per the coordinator's standing constraint for this Windows session. Surfaced as the human-action checkpoint at the end of this plan."
  - id: D2
    description: "CameraScanPanel's three permission sub-states: pending (Loading… while the OS dialog is outstanding), granted (CameraView with a centered scan-target overlay + idle hint line, never a wordless camera feed), denied (fillInfoQuiet/borderInfo/infoText callout at r-card radius, content-sized inside its own ScrollView, with Einstellungen oeffnen + Stattdessen Handle eingeben — reachable and non-terminal on Android after a hard denial)"
    requirement: FRND-04
    verification: []
    human_judgment: true
    rationale: "Real permission-dialog timing, actual camera-preview rendering, and the callout's behavior after a real hard Android denial are device/OS claims this repo's node-env-only Vitest runner cannot prove (STATE.md § Blockers/Concerns — no RN component-test harness). typecheck/lint pass against the component's source; the on-device human-check (Task 1 + Task 2's <human-check> blocks a-h in 08-05-PLAN.md, including the two backstop checks g/h) is blocked on the native rebuild this executor did not run."
  - id: D3
    description: "Scanner disarm: onBarcodeScanned is a function ONLY while scanState.kind === 'idle'; the first successful decode moves scanState out of 'idle' BEFORE anything else happens, and every other state sets the prop to undefined — a code sitting in frame must produce exactly one lookup, not one per native callback firing"
    requirement: FRND-04
    verification:
      - kind: other
        ref: "grep-confirmed in apps/mobile/components/CameraScanPanel.tsx: `onBarcodeScanned={scanState.kind === 'idle' ? handleBarcodeScanned : undefined}` is the ONLY assignment of this prop; handleBarcodeScanned's first statement is the parseQuiksCodePayload call whose result branches scanState out of 'idle'"
        status: pass
    human_judgment: true
    rationale: "The behavioral claim ('a code held in frame produces exactly one confirmation card, not several') is a live-camera timing claim that needs a real device holding a real code in frame for multiple frames — 08-05-PLAN.md Task 2 <human-check> (b), blocked on the native rebuild."
  - id: D4
    description: "Decode -> lookup flow: parseQuiksCodePayload runs BEFORE any network call; null payload -> 'kein quiks-Code' inline copy + Nochmal scannen with NO apiClient call; valid payload -> exactly one lookupVisitor via friendKeys.handle(username); 404 -> 'nicht mehr gueltig' copy; the decoded string is never handed to Linking.openURL, the router, or a WebView"
    requirement: FRND-04
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/qr-payload.test.ts (08-04, unchanged, 13/13) proves parseQuiksCodePayload's own contract; grep-confirmed in CameraScanPanel.tsx that parseQuiksCodePayload's null branch returns before the useQuery's enabled condition can ever be true, and that Linking is imported/used ONLY for Linking.openSettings()"
        status: pass
      - kind: other
        ref: "cd apps/mobile && pnpm typecheck && pnpm lint && pnpm exec vitest run — all exit 0"
        status: pass
    human_judgment: true
    rationale: "That a REAL foreign QR code (e.g. a website URL) produces the 'kein quiks-Code' copy with no browser/navigation/network call, and that a real 404 handle produces the correct copy, are end-to-end device claims — 08-05-PLAN.md Task 2 <human-check> (d), blocked on the native rebuild."
  - id: D5
    description: "Scan confirmation card (D-14 = D-04): avatar/name/handle block (AvatarTile size=40, no localUri) plus <RelationAction relation=... accountId=.../> — the card defines no mutation of its own; only a tap inside RelationAction sends anything. Renders correctly for all five Relation values (backstop, UI-consideration row 44)"
    requirement: FRND-04
    verification:
      - kind: other
        ref: "grep-confirmed: CameraScanPanel.tsx imports RelationAction from './RelationAction' and passes it exactly relation/accountId; no apiClient.sendFriendRequest (or any other friend mutation) call exists in this file"
        status: pass
    human_judgment: true
    rationale: "The five-value backstop (UI-consideration row 44: none/requestIncoming/requestOutgoing/friends/self all render correctly, not just the none/friends happy path) is explicitly a held-out device check in the plan (08-05-PLAN.md Task 2 <human-check> (h)) — this repo has no RN component-test harness to prove it off-device."
  - id: D6
    description: "friends.tsx's search field takes a ref and focuses when navigated with ?focusSearch=1 — the landing side of the denied-state's camera-free path (D-16)"
    requirement: FRND-04
    verification:
      - kind: other
        ref: "cd apps/mobile && pnpm typecheck && pnpm lint — 0; grep-confirmed the TextInput carries ref={searchInputRef} and a useEffect keyed on the focusSearch local search param calls .focus()"
        status: pass
    human_judgment: true
    rationale: "Whether the field visually receives focus after the navigation completes is a device/OS-level claim (keyboard raising, focus ring) — folded into 08-05-PLAN.md Task 2 <human-check> (f)."

duration: ~14min (post package-legitimacy-checkpoint approval)
completed: 2026-08-13
status: complete
---

# Phase 8 Plan 5: CameraScanPanel — Scan a Friend's quiks Code Summary

**`expo-camera` installed and permission-configured; `CameraScanPanel` implements the three camera-permission sub-states, an arm/disarm barcode-scan state machine (one decode = one lookup, never more), and the D-14 scan confirmation card reusing `RelationAction` verbatim — the code half of FRND-04 is complete and committed, but its device verification (including the native rebuild) is explicitly NOT done and is surfaced as a human-action checkpoint.**

## Performance

- **Duration:** ~14 min of active work after the package-legitimacy checkpoint was approved by the orchestrator (2026-08-13T15:24Z → 2026-08-13T15:38Z), not counting the checkpoint round-trip itself
- **Started:** 2026-08-13T15:24:36Z (first commit after checkpoint approval)
- **Completed:** 2026-08-13T15:38:39Z
- **Tasks:** 2 (Task 1: install + configure; Task 2: `CameraScanPanel` + wiring)
- **Files modified:** 8 (1 created, 7 modified)

## Package Legitimacy Audit

**Package:** `expo-camera` — the plan's leading `checkpoint:human-verify` (`gate="blocking-human"`) required human approval before this executor could install anything, since this phase has no `RESEARCH.md` pre-clearing a package list. The orchestrator queried the npm registry directly (this executor has no web tool) and the user approved.

- **Package name:** `expo-camera` — exact match; not `expo-cameras`, not `react-native-expo-camera`, not a scoped rebuild.
- **Repository:** `https://github.com/expo/expo.git`, directory `packages/expo-camera` — the official Expo monorepo. Homepage `https://docs.expo.io/versions/latest/sdk/camera/`.
- **Maintainers:** 20+ Expo core maintainers (`expoadmin`, `exponent`, `brentvatne`, `evanbacon`, `tsapeta`, `wolewicki`, `quinlanj`, `dsokal`, …).
- **Versions:** 100+ published, carrying `sdk-50` … `sdk-56` dist-tags; latest `57.0.3`.
- **SDK alignment:** this workspace has `expo ~57.0.9`; `57.0.3` is on the matching SDK line. Installed via `npx expo install expo-camera` (not hand-pinned), which independently resolved to `~57.0.3` — confirming the coordinator's finding.
- **Downloads:** 7,319,096 in the last month (2026-07-11 → 2026-08-09). **License:** MIT.
- **Classification:** first-party Expo SDK module, already covered in spirit by the project's Expo stack decision. The gate fired only because this phase has no `RESEARCH.md` pre-clearing a package list.

**Sources:** `https://registry.npmjs.org/expo-camera`, `https://api.npmjs.org/downloads/point/last-month/expo-camera`.

**Resolution:** approved by the user via the orchestrator; `npx expo install expo-camera` (Task 1) ran only after this approval, with Metro/the Windows install-race precondition independently re-verified by this executor beforehand (port 8081 confirmed to be `apps/api/dist/main`, the NestJS dev server, not Metro).

## Accomplishments

- `apps/mobile/components/CameraScanPanel.tsx` (new): owns all three D-15/D-16 permission sub-states via `useCameraPermissions()` from `expo-camera`. `requestPermission()` fires exactly once per mount, gated by a `useRef` flag and the hook's own `permission !== null` check — since the panel only mounts while the QR screen's `SegmentedControl` is on `scan`, "the moment of mounting" IS the D-15-required moment, with no separate rationale screen needed.
  - **Pending:** the project-wide `Loading…` text (new catalog string) while the hook is still reading a status or the one `requestPermission()` call is in flight.
  - **Granted:** `CameraView` with `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}` in a fixed-height (320px) container, a centered 200px scan-target square overlay (`colors.primaryForeground` at reduced opacity — the plan's own documented exception to token-only colour, since it sits on unpredictable live video), and exactly one hint/error/card slot beneath it depending on `scanState` — never a wordless camera feed (UI-consideration row 53).
  - **Denied:** the `fillInfoQuiet`/`borderInfo`/`infoText` callout pattern from `mehr.tsx`'s SafeNow block, but at `r-card` radius per the UI-SPEC's own documented deviation from that precedent, content-sized inside the panel's own `ScrollView` so the longest catalog string can never clip the two stacked actions (`Einstellungen öffnen` via `Linking.openSettings()`, `Stattdessen Handle eingeben` via `router.replace({ pathname: '/friends', params: { focusSearch: '1' } })`).
- **Scanner disarm (T-08-21, the plan's named concrete race):** `onBarcodeScanned` is handed a function *only* while `scanState.kind === 'idle'`; every other state sets the prop to `undefined`. This stops `CameraView`'s native per-frame callback from calling back into JS at all while a code sits in frame, rather than merely no-oping inside the handler — a stronger mitigation for the same DoS concern.
- **Decode → lookup flow:** the handler's first and only synchronous action is `parseQuiksCodePayload(result.data)` (from `lib/qr-payload.ts`, unchanged since 08-04). `null` → `invalid` state, `kein quiks-Code` copy, **zero** `apiClient` calls. A match → `resolving` state, which enables exactly one `useQuery` keyed on `friendKeys.handle(username)` calling `apiClient.lookupVisitor`. The response is classified with the SAME `...ViewState`/`compute...State()` schema every other query on this screen family uses, except 404 is its own named `notFound` kind (the contract only ever defines 200/404 for this endpoint) rather than a generic "response error."
- **Scan confirmation card (D-14 = D-04):** avatar/name/handle block (`AvatarTile` at `size={40}`, no `localUri` — a foreign device's avatar URI never resolves locally, same rule `PersonRow` already follows) plus `<RelationAction relation={...} accountId={...} />` — the SAME component and mutation call site the search-hit trailing slot already uses. The card defines no mutation of its own; a tap inside `RelationAction` is the only thing that ever sends a request. `Nochmal scannen` resets `scanState` back to `idle`.
- `apps/mobile/app/friends-qr.tsx`'s `scan` segment now renders `<CameraScanPanel />` instead of the 08-04 placeholder `<View />` — conditionally rendered (unmounted, not hidden), which is what tears the camera down when the segment isn't active or the screen is left (T-08-18).
- `apps/mobile/app/(tabs)/friends.tsx`'s search `TextInput` now carries a `useRef` and a `useEffect` on `useLocalSearchParams()`'s `focusSearch` param that calls `.focus()` — the landing side of the denied-state's camera-free path (D-16). Without this, a visitor routed back here from the denied callout would land on the screen but not in the field.
- 10 new Lingui msgids extracted and translated (DE/EN) per the UI-SPEC Copywriting Contract wording: "Add this person?" / "Camera unavailable" / "Enter handle instead" / "Loading…" / "Open Settings" / "Point the camera at the other person's quiks code." / the camera-permission rationale-plus-Settings-hint sentence / "Scan again" / "That's not a quiks code." / "This code is no longer valid."

## Task Commits

Each task was committed atomically:

1. **Task 1: `expo-camera` installed, camera permission configured** - `5fb2aa3` (feat)
2. **Task 2: `CameraScanPanel` — permission states, decode/lookup flow, confirmation card, wiring** - `2c57122` (feat)

_Native rebuild deferred — see "Issues Encountered" and the checkpoint at the end of this summary._

## Files Created/Modified

- `apps/mobile/components/CameraScanPanel.tsx` (new) — the three permission sub-states, the scan/decode/lookup state machine, the confirmation card
- `apps/mobile/app.json` — new `expo-camera` plugin entry, own `cameraPermission` rationale, `recordAudioAndroid: false`, `microphonePermission: false`; the existing `expo-image-picker` entry is unchanged
- `apps/mobile/package.json` / `pnpm-lock.yaml` — adds `expo-camera@~57.0.3`
- `apps/mobile/app/friends-qr.tsx` — `scan` segment renders `CameraScanPanel` instead of the 08-04 placeholder
- `apps/mobile/app/(tabs)/friends.tsx` — search `TextInput` ref + `focusSearch` param effect (D-16's camera-free path)
- `apps/mobile/locales/{de,en}/messages.po` — 10 new msgids, German catalog filled per the UI-SPEC Copywriting Contract wording

## Decisions Made

- The native rebuild (`npx expo run:android`) was **not** run by this executor — the coordinator's standing constraint for this Windows session explicitly forbids it; the executor stops and surfaces a human-action checkpoint with the exact command instead. All automated verification (typecheck/lint/`lingui compile --strict`/vitest) passes against the installed package and the new component's source without the native module needing to be built into a running app.
- Added a dedicated `transportError` branch to the scan lookup's view state (reusing the project's existing verbatim transport-error copy + `Nochmal scannen`) — the UI-SPEC's Copywriting Contract only names two failure copies for this surface (`kein quiks-Code`, `nicht mehr gültig`), but every other query on the Friends screen family distinguishes a genuine network failure from a defined non-200 response. Leaving the scan lookup as the one exception would silently swallow a real connectivity failure with no feedback (Rule 2 — missing critical functionality).
- The camera preview container uses a FIXED height (320px), per the plan's own action text, rather than flex-filling — this keeps the granted state's layout stable across its four possible sub-renders (idle hint / invalid+retry / resolving-loading / confirmation card) instead of the preview resizing as content beneath it changes.
- `CameraScanPanel` renders its own `ScrollView` as the component's ROOT (not just around the denied branch) — the UI-consideration backstop (row 54) requires the denied callout to sit inside a scroll container so the longest catalog string never clips; wrapping the whole panel keeps one stable root element across all three permission sub-states rather than switching container types per state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added a transport-error branch to the scan lookup's view state**
- **Found during:** Task 2, writing `CameraScanPanel.tsx`'s lookup state machine
- **Issue:** the plan's `<behavior>` and the UI-SPEC's Copywriting Contract define copy for exactly two scan-lookup failure cases (invalid payload, 404-not-found) but not for a genuine network/transport failure of the `lookupVisitor` call itself. Every OTHER query on the Friends screen family (search, requests, crew, `/me`) distinguishes `variant: 'transport'` from a defined non-200 response and shows the project's verbatim "Can't reach the server…" copy. Leaving the scan lookup without this branch would mean a real connectivity failure during scan renders nothing at all — a silent dead end, not a defect the plan intended.
- **Fix:** added a `transportError` kind to `LookupViewState`, driven by `scanQuery.status === 'error'` (the genuine React Query error path, as opposed to a defined-but-non-200 ts-rest response), reusing the SAME verbatim transport-error string and a `Nochmal scannen` reset link.
- **Files modified:** apps/mobile/components/CameraScanPanel.tsx
- **Verification:** `pnpm typecheck`/`pnpm lint` pass; the branch follows the identical `...ViewState`/`compute...State()` shape every sibling query on this screen already uses, code-reviewed against that precedent.
- **Committed in:** `2c57122` (Task 2 commit)

**2. [Rule 3 - Blocking] `visitorSummarySchema.status !== 200` narrowing, not `=== 404`**
- **Found during:** Task 2, typechecking `CameraScanPanel.tsx`'s lookup state computation
- **Issue:** the initial implementation branched on `scanQuery.data.status === 404` before returning the `found` case with `scanQuery.data.body`. TypeScript could not narrow the ts-rest response union through that check and reported `body: unknown` at the `found` return, failing `pnpm typecheck`.
- **Fix:** switched to `if (scanQuery.data.status !== 200) return { kind: 'notFound' };` — the exact narrowing idiom every other query in this codebase already uses (`friends.tsx`, `friends-qr.tsx`, `profil.tsx`, `festival-queries.ts`), which correctly narrows the following line to the 200 variant. Since `lookupVisitor` only ever defines 200/404 responses (`packages/contracts/src/router.ts`), "not 200" IS the named 404 outcome here — no behavior change, just the codebase's established narrowing pattern.
- **Files modified:** apps/mobile/components/CameraScanPanel.tsx
- **Verification:** `pnpm typecheck` — exit 0
- **Committed in:** `2c57122` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Both auto-fixes necessary for correctness (error handling completeness) and to satisfy typecheck using an established codebase idiom. No scope creep — neither changes behavior the plan specified, both close a gap the plan's own text left open.

## Issues Encountered

**The native rebuild (`npx expo run:android` from `apps/mobile`) was NOT run in this session, and this is deliberate, not an oversight.** The coordinator's message resuming this plan after the package-legitimacy checkpoint set an explicit standing constraint for this Windows session: *"Do NOT run the native rebuild yourself. When the code is committed and a rebuild is needed to exercise it, stop and surface a `human-action` checkpoint with the exact command … and a note that Metro must be stopped first. The user runs it."* Both tasks' code is now committed (`5fb2aa3`, `2c57122`) and all automated verification passes. What remains is exactly the native rebuild plus the full on-device human-check from both tasks — this is surfaced as the checkpoint immediately following this summary, not self-approved or silently deferred.

Consequently the following are **not yet verified** and must not be read as passed:
- Task 1's device check: the built app's Android permission list shows Camera and not Mikrofon.
- Task 2's device checks (a)–(h) from `08-05-PLAN.md`, including the two backstop checks: (g) the denied-state callout at the longest catalog value in both DE and EN, and (h) the confirmation card rendering correctly for all five `Relation` values.

FRND-04's `requirements-completed` is therefore deliberately left `[]` in this summary's frontmatter, mirroring 08-04's own precedent of not closing the requirement until its device-verification half is actually confirmed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 8 (Friends) has no further plans after this one (08-05 is the phase's fifth and final plan, wave 5). Once the checkpoint below is resolved, the remaining work is the on-device UAT this phase has accumulated across 08-01 through 08-05 — no new code is expected to close it out.
- `CameraScanPanel.tsx` is complete and self-contained; nothing in `apps/mobile/app/friends-qr.tsx` or `apps/mobile/app/(tabs)/friends.tsx` needs further wiring for FRND-04's scan half.
- **FRND-04 is NOT closed.** Both halves are code-complete (show: 08-04, scan: this plan) but the scan half's device verification — including the mandatory native rebuild — has not run. Do not mark the `REQUIREMENTS.md` checkbox or run `requirements mark-complete` for FRND-04 until that verification actually happens.
- Outstanding on-device items accumulated across the whole phase (unchanged from 08-04's own note, now joined by this plan's items): 08-01's relation mapping, 08-02's Requests race, 08-03's Crew/unfriend lifecycle, 08-04's D3–D6 (already resolved per its summary), and this plan's Task 1 + Task 2 human-checks (a)–(h). All are Android-only; iOS remains unverified since Phase 3 (no Mac/Xcode), an existing, user-approved deferred item.

---
*Phase: 08-friends*
*Completed: 2026-08-13*

## Self-Check: PASSED

All 1 created file and 7 modified files verified present on disk with the expected content; both task commits (`5fb2aa3`, `2c57122`) verified present in git history.
