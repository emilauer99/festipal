---
phase: 08-friends
verified: 2026-08-13T14:20:00Z
status: human_needed
score: 8/13 must-haves verified
behavior_unverified: 5 # present + wired, runtime behavior not exercised — all require a device; see behavior_unverified_items
overrides_applied: 0
behavior_unverified_items:
  - truth: "Scanning another visitor's QR code opens the confirmation card and a tap sends the request (SC1, scan half of FRND-04)"
    test: "Native rebuild first: stop Metro, then `cd apps/mobile && npx expo run:android`. Two devices: A switches the QR screen to 'Scan', grants the permission (dialog must appear ONLY at that moment — D-15), scans B's 'Mein Code'. Exactly ONE confirmation card with B's name/handle appears even while the code stays in frame; tapping 'Add' sends the request and B sees it under 'To you'."
    expected: "One decode → one lookup → one card; the request arrives on B's side; a foreign QR (website URL) shows 'That's not a quiks code.' with no browser, no navigation, no network call."
    why_human: "expo-camera is a new native module — the current installed APK does not contain it; no automated harness can exercise camera frames, the permission dialog, or the arm/disarm timing (IN-02's pre-disarm window is a live-camera claim)."
  - truth: "Requests section: both directions visible, accept/decline/withdraw work, and the list reflects the result without a manual refresh — including the concurrent-answer race (SC2/FRND-05)"
    test: "Two accounts. (a) B requests A → A sees the row under 'To you' with badge '1', taps Accept → row disappears, both are friends. (b) Decline and (c) Withdraw each remove the row with NO confirm dialog. (d) Race: B withdraws while A's screen is open, A then taps Accept → inline failure copy under that row, list reloads, no ghost row."
    expected: "All three lifecycle actions settle the list without leaving the screen; the 404 race shows 'Couldn't save — try again.' and the row vanishes on the settled refetch."
    why_human: "The onSettled friendKeys.all invalidation chain is code-proven, but the state transition (row removal without refresh) and the two-device race are runtime behaviors with no RN component-test harness (STATE.md structural limit)."
  - truth: "Crew list shows real friends sorted correctly on device; unfriend removes the friendship on BOTH sides and the person is re-findable via search with 'Add' (SC3/FRND-06/FRND-08)"
    test: "Account with ≥3 friends incl. umlaut names: list order has 'Ärzte' before 'Berta' (not after 'Zoe'). Tap a row → modal with 88px Sunset-ringed avatar, name, @handle, identity line (absent entirely when pronoun+gender empty), locale-formatted 'Friends since' date. 'End friendship' → Alert with destructive confirm → modal closes, row gone without refresh; B's crew list also loses A; A re-finds B via search with relation 'none'."
    expected: "Both-sides removal without manual refresh; no cooldown; correct locale date formatting."
    why_human: "Sort logic is unit-proven (13/13), but on-device Hermes collator behavior, modal rendering and the two-account unfriend lifecycle are device claims."
  - truth: "One decoded code triggers exactly one handle lookup — the scanner is disarmed after the first successful decode (T-08-21)"
    test: "Hold a valid quiks code steadily in frame after the card appears; watch the API log — exactly one GET /visitors/:username. 'Scan again' re-arms."
    expected: "One lookup per decode cycle despite the native callback firing per frame."
    why_human: "Prop-identity disarm is grep-confirmed (`onBarcodeScanned={scanState.kind === 'idle' ? … : undefined}` is the only assignment), but the frame-timing behavior only exists with a live camera."
  - truth: "The camera runs ONLY while the Scan panel is active, and the denied state is complete and permanently reachable (D-15/D-16, camera prohibition)"
    test: "(a) Switch to 'Mein Code' / leave the screen → the OS camera indicator goes off; return → preview resumes. (b) Hard-deny the permission in Android settings ('Don't ask again') → the callout renders with rationale, 'Open Settings' (jumps to system settings) and 'Enter handle instead' (lands in the Friends search field WITH focus). (c) App permission list shows Camera and NOT Microphone."
    expected: "No camera outside the active scan panel; the denied path is not a dead end; no audio permission in the built manifest."
    why_human: "Mount/unmount teardown, OS permission dialogs and the built manifest's permission list only exist on a device with the rebuilt APK."
---

# Phase 8: Friends Verification Report

**Phase Goal:** The Friends screen stops being a placeholder — a visitor can find people three ways, manage requests, and see a real friends list
**Verified:** 2026-08-13
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

Verification mode: goal-backward against the codebase at HEAD (`75e8e3c`). SUMMARY claims were
cross-checked against source — note that all four review Warnings (WR-01…WR-04) were fixed
**after** the summaries were written; the fixes were verified directly in code and in git
(`bd27b44`, `e9a9f33`, `81c2a15`, `75e8e3c` all present, diffs match the review's prescriptions).

### Observable Truths

Truths 1–7 are the ROADMAP Success Criteria (SC1 split into its three halves); 8–13 are the
load-bearing plan-level must-haves.

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1   | SC1a: Search/handle → hit → send request; row updates without manual refresh (FRND-02/03) | ✓ VERIFIED | Device-verified by the user (08-01 tracer checkpoint). Code: debounced+trimmed `GET /visitors?q=` behind `SEARCH_MIN_CHARS`, `PersonRow`+`RelationAction` per hit, `friendKeys.all` invalidation in `onSettled` (`friends.tsx:180-211`, `use-friend-mutations.ts:82-86`) |
| 2   | SC1b: Own handle renders as a scannable QR — plaintext `quiks:u/<username>`, both color modes | ✓ VERIFIED | Device-verified by the user (foreign camera app read the exact payload, opened nothing, light AND dark). Code: `QRMark` fixed-contrast tokens, quiet zone in viewBox; payload format 20+ unit tests |
| 3   | SC1c: Scanning another visitor's QR sends a request via the D-14 confirmation card | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `CameraScanPanel` complete and wired (`friends-qr.tsx:167`, decode → `parseQuiksCodePayload` → `lookupVisitor` → card → `RelationAction`); native rebuild NOT run — the installed APK lacks expo-camera, so zero device evidence exists for the entire camera path |
| 4   | SC2: Requests both directions, accept/decline/withdraw, list correct without refresh | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Section real (`friendKeys.requests`, both sub-groups, incoming-only badge absent at 0, per-row hook instance, inline failure line); two-account flows and the concurrent-answer race never exercised on device |
| 5   | SC3: Real friends list; ending a friendship removes it from both sides | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Crew block real (`friendKeys.list` → `sortFriendsByDisplayName`), `friend-detail` modal cache-read only, `Alert.alert` confirm, success-only navigation via ref-tracked pending→settled edge; both-sides removal + re-findability unexercised |
| 6   | SC4: Every empty state names its precondition | ✓ VERIFIED | In code: "Once someone adds you…", "Once you request someone…", "No one in your crew yet. Add someone via search, code or QR.", "Set your username first to show your code.", denied-callout rationale — all name the precondition, none a bare absence |
| 7   | SC5: All new strings in both catalogs; `username`/`displayName` never translated | ✓ VERIFIED | `pnpm exec lingui compile --strict` exit 0 (run during this verification); WR-01/WR-02 strings present in `de` AND `en` incl. `msgctxt "relation chip"` → "Freunde"; handles render as raw interpolations, never inside a macro |
| 8   | Exactly ONE definition site for all five friend mutations (D-04) | ✓ VERIFIED | Repo grep: `apiClient.sendFriendRequest/accept/decline/withdraw/unfriend` appear only in `lib/use-friend-mutations.ts` (the `friend-detail.tsx:101` hit is a comment); all five invalidate `friendKeys.all` in `onSettled` |
| 9   | Full relation mapping; no tap that is guaranteed to fail | ✓ VERIFIED | Exhaustive `switch` without `default` in `RelationAction` (compile-proven); `requestOutgoing`/`friends` chips are `View`s, not `Pressable`s; `self` returns `null`; WR-01 fix adds inline 404/generic failure copy |
| 10  | D-12 sort: Hermes-safe fallback, total order, input never mutated | ✓ VERIFIED | `friend-sort.test.ts` 13/13 passed in this verification run — both comparator branches tested directly, umlaut order, ß-folding, username tie-break both input orders, non-mutation |
| 11  | QR payload format strict: prefix at position 0, one segment, contract charset (WR-04) | ✓ VERIFIED | `qr-payload.test.ts` + `qr-matrix.test.ts` 29/29 passed in this run; `USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/i` enforced post-review; finder-pattern structure asserted, non-ASCII encodes |
| 12  | One decode = one lookup (scanner disarm, T-08-21) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Disarm-via-prop-identity grep-confirmed as the sole `onBarcodeScanned` assignment; live-camera timing (incl. IN-02's pre-disarm window) unexercised |
| 13  | Camera only in active scan panel; permission asked on switch; denied state complete (D-15/D-16) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Conditional render (unmount) in `friends-qr.tsx`, once-per-mount `requestPermission` guard, complete denied callout with Settings jump + `focusSearch=1` camera-free path landing (`friends.tsx:172-178`); OS dialog timing, teardown and manifest permission list need the rebuilt APK |

**Score:** 8/13 truths verified (5 present, behavior-unverified — all device-gated, none missing or stubbed)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `apps/mobile/lib/friend-queries.ts` | `friendKeys`, `SEARCH_MIN_CHARS`, `SEARCH_DEBOUNCE_MS`, re-exports `unwrapOk` | ✓ VERIFIED | All exports present; React-free; re-exports from `festival-queries` (no duplicate `unwrapOk`) |
| `apps/mobile/lib/use-friend-mutations.ts` | The ONE definition of all five mutations | ✓ VERIFIED | 5 mutation fns + shared `onMutate/onError/onSettled`; `failedTargetStatus` added by WR-01 fix |
| `apps/mobile/components/PersonRow.tsx` | Shared row for all three lists | ✓ VERIFIED | Consumed by search hits, `IncomingRequestRow`/`OutgoingRequestRow`, Crew rows; no `localUri` ever passed; `numberOfLines={1}` both lines |
| `apps/mobile/components/RelationAction.tsx` | The ONE relation→action mapping | ✓ VERIFIED | Used by search hits AND the scan confirmation card; exhaustive switch; failure copy wired (WR-01) |
| `apps/mobile/components/AvatarTile.tsx` | `size?: 40 \| 88` prop, default 88 | ✓ VERIFIED | `AVATAR_SIZE` still 88 and exported (AvatarSunsetRing geometry unchanged) |
| `apps/mobile/app/(tabs)/friends.tsx` | 4 real blocks, D-03 mode swap, dead blocks removed | ✓ VERIFIED | Search/code-card/Requests/Crew all query-backed; `Chats unlock`/`People you may know`/`Soon` all grep-absent; WR-03 trim fix in place |
| `apps/mobile/lib/friend-sort.ts` + test | Collator probe + fallback + 13 tests | ✓ VERIFIED | 13/13 pass (re-run); no react/lingui/contracts import |
| `apps/mobile/app/friend-detail.tsx` | Modal, no own fetch, unfriend via hook | ✓ VERIFIED | Cache-read via `getQueryData(friendKeys.list)` with shape validation; no `apiClient.*` read call; closes on cache miss |
| `apps/mobile/app/_layout.tsx` | `friend-detail` + `friends-qr` in authed `Stack.Protected` | ✓ VERIFIED | Both registered at lines 501/511 inside `guard={authState.status === 'authenticated'}` |
| `apps/mobile/lib/qr-payload.ts` + `qr-matrix.ts` + tests | Pure QR logic | ✓ VERIFIED | 29/29 tests pass (re-run); WR-04 charset guard present |
| `apps/mobile/components/QRMark.tsx` | Fixed-contrast SVG mark, null on unencodable | ✓ VERIFIED | `primaryForeground`/`textOnGradient` via `useTheme()`, no raw hex; quiet zone in viewBox |
| `apps/mobile/app/friends-qr.tsx` | SegmentedControl, exactly one panel, `Mein Code` real | ✓ VERIFIED | Opens on `mine`; shares the `['me']` query; missing-handle edge copy; `scan` renders `CameraScanPanel` |
| `apps/mobile/components/CameraScanPanel.tsx` | 3 permission states, disarm machine, D-14 card | ✓ VERIFIED (code) | All states + transportError branch present; behavior device-gated (truths 3/12/13) |
| `apps/mobile/app.json` | Own expo-camera plugin entry | ✓ VERIFIED | `cameraPermission` rationale set, `recordAudioAndroid: false`, `microphonePermission: false`; `expo-image-picker` entry untouched |
| `apps/mobile/package.json` | `qrcode-generator`, `expo-camera@~57.x` | ✓ VERIFIED | `qrcode-generator ^2.0.4`, `expo-camera ~57.0.3` on the `expo ~57.0.9` SDK line; both passed the blocking package-legitimacy gates |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `(tabs)/friends.tsx` | `api-client.ts` | `friendKeys.search(q)` → `searchVisitors` | ✓ WIRED | Trimmed query used for gate, key AND request (WR-03) |
| `RelationAction.tsx` | `use-friend-mutations.ts` | `sendRequest`/`acceptRequest` | ✓ WIRED | Plus `pendingTargetId`/`failedTargetId`/`failedTargetStatus` |
| `(tabs)/friends.tsx` | `api-client.ts` | `friendKeys.requests` → `listFriendRequests` | ✓ WIRED | One query backs both sub-groups |
| `(tabs)/friends.tsx` | `friend-sort.ts` | `sortFriendsByDisplayName` on the 200 body | ✓ WIRED | Sorting inside `computeCrewState`, not at render |
| `friend-detail.tsx` | `friend-queries.ts` | `getQueryData(friendKeys.list)` synchronous cache read | ✓ WIRED | Shape-validated before indexing; no second fetch |
| `friend-detail.tsx` | `use-friend-mutations.ts` | `unfriend` after `Alert.alert` confirm | ✓ WIRED | Success-only navigation via pending→settled ref edge |
| `_layout.tsx` | `friend-detail.tsx` / `friends-qr.tsx` | `Stack.Screen` in authed `Stack.Protected` | ✓ WIRED | Both registrations confirmed |
| `friends-qr.tsx` | `qr-payload.ts` | `encodeQuiksCodePayload(username)` → `QRMark` | ✓ WIRED | Same payload on the card's small preview mark |
| `QRMark.tsx` | `qr-matrix.ts` | `buildQrMatrix(payload)` → SVG rects | ✓ WIRED | `null` matrix → `null` render |
| `(tabs)/friends.tsx` | `friends-qr.tsx` | `router.push('/friends-qr')` from the full-opacity CTA | ✓ WIRED | Soon badge and 3×3 placeholder removed |
| `friends-qr.tsx` | `CameraScanPanel.tsx` | Rendered ONLY while segment is `scan` | ✓ WIRED | Conditional render = camera teardown mechanism |
| `CameraScanPanel.tsx` | `qr-payload.ts` | `parseQuiksCodePayload(result.data)` before ANY network call | ✓ WIRED | `null` → `invalid` state with zero apiClient calls |
| `CameraScanPanel.tsx` | `api-client.ts` | `friendKeys.handle(username)` → `lookupVisitor` | ✓ WIRED | `enabled: scanState.kind === 'resolving'` |
| `CameraScanPanel.tsx` | `RelationAction.tsx` | Confirmation card renders the same D-04 action set | ✓ WIRED | Card defines no mutation of its own |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| Search results | `searchState.hits` | `GET /visitors?q=` (live API) | Yes | ✓ FLOWING |
| Requests section | `requestsState.incoming/outgoing` | `GET /me/friend-requests` | Yes | ✓ FLOWING |
| Crew list | `crewState.friends` | `GET /me/friends` → client sort | Yes | ✓ FLOWING |
| quiks-code card / QR screen | `username` | Shared `['me']` query (one cache entry, three consumers) | Yes | ✓ FLOWING |
| Friend detail card | `friend` | `friendKeys.list` cache (deliberately no fetch — Phase-7 D-04) | Yes | ✓ FLOWING |
| Scan confirmation card | `lookupState.summary` | `GET /visitors/:username` | Yes | ✓ FLOWING |

No static returns, hardcoded rows or seeded example people anywhere on the phase surfaces.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Sort fallback + payload + matrix logic | `pnpm exec vitest run lib/__tests__/friend-sort.test.ts lib/__tests__/qr-payload.test.ts lib/__tests__/qr-matrix.test.ts` | 3 files, 42/42 passed | ✓ PASS |
| i18n catalogs complete in both locales | `pnpm exec lingui compile --strict` | exit 0 | ✓ PASS |
| expo-camera plugin shape | `node -e` plugin check (rationale non-empty, `recordAudioAndroid: false`) | ok | ✓ PASS |
| Full typecheck/lint/test suites | Reported green at HEAD by the orchestrator (mobile 235/235, api 132/132) | not re-run (single-run rule; scoped runs above are the fresh evidence) | ✓ PASS (reported) |
| Camera/scan flows | — | requires native rebuild + device | ? SKIP → human |

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes exist or are declared for this phase (mobile UI phase; the
"consideration probe" in the git history is a planning artifact, not a runnable probe). SKIPPED.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| FRND-02 | 08-01 | Request via quiks-code/handle | ✓ SATISFIED | One field serves both (D-02); exact handle is by construction the first prefix hit; send path device-verified |
| FRND-03 | 08-01 | Username search + request | ✓ SATISFIED | Device-verified tracer; WR-03 trim fix protects the exact-handle promise |
| FRND-04 | 08-04, 08-05 | Show own QR + scan someone else's | ? NEEDS HUMAN | Show half device-verified; scan half code-complete but zero device evidence (native rebuild pending). **REQUIREMENTS.md correctly leaves FRND-04 unchecked — confirmed the right call; do not mark until the scan-half UAT passes** |
| FRND-05 | 08-02 | See + accept/decline/withdraw requests | ✓ SATISFIED (structurally) | All wiring verified; the two-account flows incl. the race are on the human list — the `[x]` in REQUIREMENTS.md rests on structural evidence, final confidence comes with UAT |
| FRND-06 | 08-03 | Friends list, user-global | ✓ SATISFIED (structurally) | Real list, unit-proven sort; screen reads no festival state (user-global); device ordering/modal on the human list |
| FRND-08 | 08-03 | End a friendship | ✓ SATISFIED (structurally) | Confirm dialog, single mutation site, success-only close; both-sides removal on the human list |

No orphaned requirements: REQUIREMENTS.md maps exactly FRND-02/03/04/05/06/08 to Phase 8, and every
ID is claimed by exactly the plans above. FRND-07/FRND-09 correctly excluded (Phase 9 / post-v1.1).

### Prohibitions (must-NOT checks)

| Prohibition | Tier | Disposition |
| ----------- | ---- | ----------- |
| No browsable person directory below the 2-char floor (FRND-03) | test | ENFORCED — `enabled: searchEnabled` gate + `idle` state renders only the hint; no visitor row exists outside `searchState.data`. No component-harness test possible (structural limit); enforcement evidence is the code gate |
| No decline/withdraw evidence visible to the counterpart (FRND-05) | test | ENFORCED — no "declined" state, no history row, no counter that reveals the difference; rows simply vanish on invalidation |
| No presence/location/last-online signal (FRND-06, ADR-014) | test | ENFORCED — `PersonRow` has no presence slot; detail card renders only identity + `friendsSince`; repo grep clean |
| QR payload carries ONLY the handle (FRND-04) | test | ENFORCED + unit-tested — `encodeQuiksCodePayload` accepts only `username`; parser rejects everything else incl. the WR-04 charset guard |
| Camera never runs outside the active scan panel; no image is captured/stored (FRND-04) | test | ENFORCED in code (conditional mount is the teardown; no capture API used anywhere) — runtime confirmation is human item 5 |
| Decoded payload never opened as URL/route/WebView (FRND-04) | test | ENFORCED — `Linking` used only for `openSettings()`; decoded string reaches only `parseQuiksCodePayload` → `lookupVisitor` |
| No request without an explicit tap on THAT person (FRND-02) | judgment | LLM-judge: honored (send only in `onPress`; no submit-to-send, no auto-send, no bulk action) — NON-AUTHORITATIVE, flagged for human review (bundled into UAT item 1/2) |
| No pressure/urgency framing on open requests (FRND-05) | judgment | LLM-judge: honored (badge is a bare count, absent at 0; no timestamps, no alarm color) — NON-AUTHORITATIVE, flagged for human review |
| No proximity/engagement ordering of the crew list (FRND-06) | judgment | LLM-judge: honored (`sortFriendsByDisplayName` is the only ordering) — NON-AUTHORITATIVE, flagged for human review |

The three judgment-tier items are flagged, not silently passed — confirm them alongside the UAT.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `apps/mobile/app/friends-qr.tsx` | 52-54 | Stale doc comment claims the Scan panel "is a placeholder … filled in 08-05" while the code below renders `CameraScanPanel` | ℹ️ Info | IN-01 from 08-REVIEW — left open by decision (7 Info findings deferred); misleads readers only, no runtime effect |
| `apps/mobile/app/(tabs)/friends.tsx` | 55 | Stale comment "The four list blocks below fetch nothing at all" (Phase-6 wording; they now each run a query) | ℹ️ Info | Same IN-01 family, open by decision |

No TBD/FIXME/XXX/TODO debt markers in any phase-modified file. No empty implementations, no
hardcoded empty props, no console.log-only handlers. The remaining review Infos (IN-02…IN-07) are
open by explicit decision and none blocks the goal.

### Human Verification Required

All items are genuinely device-gated (no RN component-test harness; camera path additionally needs
the native rebuild). Items 1–5 are the `behavior_unverified_items` above; 6–8 are the plans'
deferred backstop/visual checks harvested from the `<human-check>` blocks.

#### 1. Scan a friend's QR code (FRND-04 scan half — REQUIRES NATIVE REBUILD FIRST)

**Test:** Stop Metro, `cd apps/mobile && npx expo run:android`. Then plan 08-05's checks (a)–(f): permission dialog appears only on switching to Scan; scan B's code → exactly one confirmation card; tap Add → B receives the request; foreign QR → "That's not a quiks code.", no browser/navigation; preview off while on "Mein Code"; hard-denied permission → complete callout, Settings jump, "Enter handle instead" lands with search focus; app permissions list Camera but NOT Microphone.
**Expected:** FRND-04's scan half works end-to-end; only then mark FRND-04 complete in REQUIREMENTS.md.
**Why human:** New native module not in the installed APK; camera frames, OS dialogs and the built manifest cannot be exercised off-device.

#### 2. Requests lifecycle with two accounts (FRND-05)

**Test:** 08-02's checks: both sub-groups render simultaneously (one populated, one with its precondition copy), badge shows the incoming count and is absent at 0, Accept/Decline/Withdraw each remove the row without refresh and without a dialog, and the concurrent-answer race (B withdraws, A accepts) shows the inline failure copy and reloads without a ghost row.
**Expected:** List always settles to server truth without manual refresh.
**Why human:** Two-device runtime state transitions.

#### 3. Crew list, friend detail and unfriend (FRND-06/FRND-08)

**Test:** 08-03's checks: umlaut-correct order ('Ärzte' before 'Berta'), row → modal (ringed 88px avatar, identity line absent when empty, localized "Friends since" date), unfriend confirm → both sides lose the row, person re-findable via search as "Add".
**Expected:** Both-sides removal without refresh, no cooldown.
**Why human:** Two-account lifecycle + device rendering.

#### 4. Full relation mapping on device (08-01 D2, deferred from the tracer checkpoint)

**Test:** With accounts in all five relation states, each search-hit row shows the right trailing element (Add / Accept / static "Requested" / static "Freunde" chip in German / nothing for self); chips ignore taps; pending pill dims at 0.45; a failed Add/Accept shows the inline error (404 → "Diese Person gibt's nicht mehr.").
**Expected:** All five values render correctly incl. the WR-01/WR-02 fixes, which were never device-seen.
**Why human:** Visual/interaction claims post-date the device checkpoint.

#### 5. D-03 mode swap and search states

**Test:** Any character in the field unmounts code card/Requests/Crew and shows only the results area; clearing restores all three; 1 char shows the hint without firing a request; the five result states render in one slot.
**Expected:** Clean mode switch, no request below the 2-char floor.
**Why human:** Mount/unmount and layout behavior.

#### 6. Backstop: confirmation card for all five Relation values (08-05 check (h), UI-consideration 44)

**Test:** Scan codes of accounts in each of the five relation states; the card shows the correct action set each time (nothing for your own code).
**Expected:** Same D-04 mapping as the search row — never an always-"Add" card.
**Why human:** Explicitly a held-out backstop; no component harness.

#### 7. Backstop: denied callout at the longest catalog value, DE and EN (08-05 check (g), UI-considerations 50/54)

**Test:** Device language German then English; the denied callout shows heading, rationale and both stacked actions fully, without clipping.
**Expected:** Content-sized card inside the scroll container; nothing truncates.
**Why human:** Visual overflow claim.

#### 8. Judgment-tier prohibition sign-off

**Test:** While performing items 1–5, confirm: no request is ever sent without an explicit tap on that person; open requests carry no urgency framing (bare count only); the crew list has no ordering other than alphabetical.
**Expected:** All three hold — they are code-honored but formally need human judgment.
**Why human:** Judgment-tier per the plans' prohibition blocks; the LLM verdict is non-authoritative.

### Gaps Summary

**No gaps.** Every artifact the phase promised exists, is substantive and is wired; all four review
Warnings are verifiably fixed at HEAD; the dead Phase-6 blocks are gone; the single-mutation-site,
projection, i18n and token-discipline invariants all hold; 42/42 scoped unit tests and
`lingui compile --strict` pass fresh in this verification.

What separates this phase from `passed` is exclusively device evidence: five behavior-dependent
truths (the entire camera/scan path — which additionally needs the not-yet-run native rebuild —
plus the two-account request/crew/unfriend lifecycles) are present and wired but unexercised at
runtime, and the plans' own backstop checks are deliberately held out for UAT. FRND-04 is correctly
still unchecked in REQUIREMENTS.md and must stay so until human item 1 passes; FRND-05/06/08 are
structurally satisfied and get their final confidence from items 2–4.

---

_Verified: 2026-08-13T14:20:00Z_
_Verifier: Claude (gsd-verifier)_
