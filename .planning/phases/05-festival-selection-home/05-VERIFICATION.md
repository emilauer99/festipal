---
phase: 05-festival-selection-home
verified: 2026-08-09T19:00:00Z
status: human_needed
score: 9/10 truths verified (5 roadmap-level truths unchanged; 4 of 5 prior gap-closure truths now device-confirmed via 05-UAT.md round 2; 1 truth's fix (G-05-5b-r2) is code-complete + unit-tested but not yet device-confirmed)
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/10 truths verified (5 roadmap truths verified; 5 gap-closure truths PRESENT_BEHAVIOR_UNVERIFIED, all pending on-device UAT round 2)
  gaps_closed:
    - "G-05-2 (Alle-segment CTA reliability after manual segment switch) — device-confirmed PASS in 05-UAT.md round 2 test 1"
    - "G-05-5a (cold-start Back lands on Start/Home; in-tab Back returns through history) — device-confirmed PASS in 05-UAT.md round 2 test 4"
    - "G-05-7 / G-05-7b (deep-link forms + authenticated precedence) — device-confirmed PASS in 05-UAT.md round 2 test 5"
    - "WR-01 optimistic-cache save/enter race probe — device-confirmed PASS (does not manifest) in 05-UAT.md round 2 test 3"
  gaps_remaining: []
  regressions:
    - "G-05-5b-r2 (05-UAT.md round 2 test 2, major): the 05-09 fix for G-05-5b ('restore only a SAVED festival') was implemented as 'only PERSIST when saved', which left a stale previously-saved slug stuck in MMKV forever once any later UNSAVED festival was entered — cold-start kept restoring it instead of landing on Home. Root-caused in .planning/debug/cold-start-restores-unsaved-festival.md and closed at the code level by gap-closure plan 05-11 (commits 211ecd2/9cddf4f/9828672): a new nextActiveFestivalSlug pure reducer + syncActiveFestivalOnEnter single persist/clear authority now clears the persisted slug whenever an unsaved festival is entered. Unit-tested (5/5 new tests reproducing the exact regression), typecheck/lint/full-suite green (69/69). NOT yet re-confirmed on a real device — this is the one remaining human-verification item (UAT round 3), explicitly deferred by the 05-11 plan's own <verification> section."
gaps: []
human_verification:
  - test: "Re-run 05-UAT.md-style test for G-05-5b-r2, round 3: enter a SAVED festival (persists), force-quit, relaunch -> that festival's home IS restored. Then enter a DIFFERENT UNSAVED festival from Alle, force-quit, relaunch -> app lands on Start/Home, NOT the previously-saved festival (the exact scenario that failed in round 2: 'Immer wenn ich die app quitte und dann relaunche lande ich am Frequency Festival Home Screen')."
    expected: "Cold-start restores only the LAST-entered festival, and only when it was saved. A stale previously-saved slug must no longer survive an intervening unsaved entry."
    why_human: "Requires a real force-quit/relaunch device cycle to observe MMKV persistence across process kill and the _layout.tsx cold-start read; not exercisable from the node-env Vitest runner. The fix's pure reducer and wiring are unit-tested and code-reviewed as correct, but only a device run settles the actual regression."
---

# Phase 5: Festival Selection & Home Verification Report

**Phase Goal:** A visitor can browse all festivals, save ones to "Meine", enter any festival gate-lessly, and land on that festival's home with a basic overview they can open
**Verified:** 2026-08-09T19:00:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap-closure plan 05-11 (G-05-5b-r2), itself triggered by a regression found during 05-UAT.md round 2 on-device testing of the earlier 05-09/05-10 gap closures

## Goal Achievement

### Observable Truths

**A. Roadmap Success Criteria (re-confirmed unchanged since initial verification; files untouched by 05-11 except where noted)**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Festivals tab shows Meine/Alle segment (default Meine); Alle lists every festival with name/dates/place, visually distinguishing saved ones (FEST-01, FEST-02) | ✓ VERIFIED | `apps/mobile/app/(tabs)/festivals.tsx` unchanged in this area; unaffected by 05-11's diff (which only touched `handleEnter` and its import). |
| 2 | Save persists server-side (`my_festival`) and survives app restart (FEST-03) | ✓ VERIFIED | `saveMutation` unchanged this cycle; `apps/api/test/save-idempotency.spec.ts` unaffected. |
| 3 | A visitor can enter any festival gate-lessly (saved or browsed), landing on that festival's home (FEST-04 entry, HOME-01) | ✓ VERIFIED | `handleEnter(slug, saved)` in `festivals.tsx:214-228` — `router.push(`/f/${slug}`)` still runs unconditionally, outside/after the (now non-gating) `syncActiveFestivalOnEnter` call. `home.tsx:76-94` wraps the persist call in try/catch specifically so a synchronous MMKV failure never blocks `router.push`. Gate-less entry preserved. |
| 4 | The home shows a basic festival overview (identity + key facts: name, dates, place) the visitor can open (HOME-02) | ✓ VERIFIED | `apps/mobile/app/(festival)/f/[festivalSlug].tsx` unchanged this cycle. |
| 5 | A visitor can return to the festival list from inside a festival without a dead-end (FEST-04) | ✓ VERIFIED | `apps/mobile/lib/festival-navigation.ts` unchanged this cycle (last touched 05-09, already device-confirmed via UAT round 2 test 4 below). |

**B. Gap-Closure Truths (05-09/05-10, now cross-checked against 05-UAT.md round 2 device results)**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | The Home empty-state CTA / rail "Alle" see-all reliably opens the Festivals tab on the Alle segment on EVERY navigation, including after a manual switch to Meine and back (G-05-2) | ✓ VERIFIED | Code unchanged since prior verification (`festivals-segment-request.ts` singleton + `useFocusEffect`). **Now device-confirmed**: 05-UAT.md round 2 test 1 = `result: pass`. |
| 7 | On cold-start, only a SAVED festival's home is restored; a merely-entered-but-unsaved festival lands on Home instead (G-05-5b) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | 05-UAT.md round 2 test 2 found this **FAILED on device** (`result: issue`, severity major) — the 05-09 fix only gated the PERSIST on `saved`, never CLEARED a stale prior slug on an unsaved entry, so a previously-saved festival stayed stuck as the cold-start target forever. Root-caused (`.planning/debug/cold-start-restores-unsaved-festival.md`) and fixed at the code level by gap-closure plan 05-11: new `nextActiveFestivalSlug` pure reducer (`active-festival-storage.ts:81-86`) returns `undefined` whenever `entered.saved` is false regardless of `prior`, and the new `syncActiveFestivalOnEnter` (lines 104-112) is the single effectful persist/clear authority now called from both `festivals.tsx:226` and `home.tsx:88`. Verified present, substantive, and wired directly against source (re-read this session, not trusted from SUMMARY). 5 new unit tests reproduce the exact regression scenario (`prior='frequency-2026'` + unsaved entry of `'nova-sound-2026'` → `undefined`) and pass; re-ran `pnpm --filter @festipal/mobile exec vitest run lib/__tests__/active-festival-entry.test.ts` this session — 5/5 pass. Full mobile `typecheck`/`lint`/`test` re-ran this session — all clean (69/69 tests). **The fix itself has NOT yet been re-confirmed on a real device** (round 2's force-quit/relaunch failure is the only evidence of the underlying bug; round 3 is required to confirm the fix actually resolves it in the real MMKV/cold-start environment). This is a behavior-dependent (state-transition/persistence-across-process-kill) truth that unit tests alone cannot fully settle — routed to human verification per the behavior-dependent-truth rule. |
| 8 | Back from a cold-start-launched Festival Home lands on the Start/Home tab; Back from a normal in-tab push-entry still returns through history (G-05-5a) | ✓ VERIFIED | Code unchanged since prior verification. **Now device-confirmed**: 05-UAT.md round 2 test 4 = `result: pass`. |
| 9 | `festipal://f/:slug` (double-slash), `festipal:///f/:slug` (triple-slash), and `https://<domain>/f/:slug` all reconstruct to the identical `f/:slug` route (G-05-7) | ✓ VERIFIED | Code unchanged since prior verification. **Now device-confirmed**: 05-UAT.md round 2 test 5 sub-case (a) = `result: pass`. |
| 10 | A deep link fired while the user is ALREADY authenticated is honored and takes precedence over the persisted active-festival slug; logged-out precedence does not regress (G-05-7b) | ✓ VERIFIED | Code unchanged since prior verification. **Now device-confirmed**: 05-UAT.md round 2 test 5 sub-case (b) = `result: pass`. |

**Additional device-confirmed item not itself a numbered roadmap/gap-closure truth:** the WR-01 optimistic-cache Save-then-Enter race (05-REVIEW.md, flagged as an open warning in the prior verification cycle) was specifically probed in 05-UAT.md round 2 test 3 (force a failing save mid-tap, force-quit, relaunch) and **passed** — the race does not manifest as a real cold-start regression on-device. The underlying code pattern (reading the optimistic `savedIds` cache at enter time) is unchanged and still theoretically present, but is no longer an open, unconfirmed risk; retained below as an informational anti-pattern note rather than a blocker.

**Score:** 9/10 truths ✓ VERIFIED (5 roadmap-level truths + 4 gap-closure truths now device-confirmed via 05-UAT.md round 2); 1/10 ⚠️ PRESENT_BEHAVIOR_UNVERIFIED (truth 7 — G-05-5b-r2's fix is code-complete, unit-tested, and directly re-verified against source this session, but not yet device-confirmed). **0 truths FAILED.**

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/mobile/lib/active-festival-storage.ts` | exports `nextActiveFestivalSlug` (pure) + `syncActiveFestivalOnEnter` (effectful) | ✓ VERIFIED | Both present, matching plan's `<behavior>` spec exactly (lines 81-112); read directly this session. |
| `apps/mobile/lib/__tests__/active-festival-entry.test.ts` | reproduces the stale-saved-slug regression | ✓ VERIFIED | 5 tests covering every row of the plan's behavior table, including the exact regression case; re-ran this session, 5/5 pass. |
| `apps/mobile/app/(tabs)/festivals.tsx` | `handleEnter` calls `syncActiveFestivalOnEnter(slug, saved)` | ✓ VERIFIED | Lines 214-228; import updated line 13; `clearActiveFestivalSlug` still separately used by `handleLogout` (line 108). |
| `apps/mobile/app/(tabs)/home.tsx` | `handleEnter` calls `syncActiveFestivalOnEnter(slug, true)` | ✓ VERIFIED | Lines 76-94; import updated line 12. |
| `apps/mobile/app/_layout.tsx` | cold-start read stays synchronous, unchanged | ✓ VERIFIED | `git log` confirms no commit touching this file since 05-10 (`bb9b2aa`); `getActiveFestivalSlug()` call at line 246 unchanged. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `festivals.tsx handleEnter` | `syncActiveFestivalOnEnter(slug, saved)` | direct call, replaces old inline persist-if-saved logic | ✓ WIRED | `festivals.tsx:226`; `router.push` on line 227 still runs unconditionally after it — entry stays gate-less. |
| `home.tsx handleEnter` | `syncActiveFestivalOnEnter(slug, true)` | direct call inside try/catch, replaces old direct `saveActiveFestivalSlug` call | ✓ WIRED | `home.tsx:88`; try/catch preserved so a throw still can't block `router.push`. |
| production `app/` code | `saveActiveFestivalSlug` (direct call) | grep across `apps/mobile/app` | ✓ CONFIRMED ABSENT | Only reference left is a comment in `home.tsx:86` documenting the invariant; no production call site bypasses the shared helper. |
| `_layout.tsx` cold-start read | `getActiveFestivalSlug()` | unchanged synchronous read | ✓ WIRED (unchanged) | No commits to `_layout.tsx` since 05-10; the read side of the fix was intentionally left untouched per plan scope. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| New G-05-5b-r2 regression-reproduction unit test | `pnpm --filter @festipal/mobile exec vitest run lib/__tests__/active-festival-entry.test.ts` (from `apps/mobile`) | 1 file / 5 tests passed | ✓ PASS |
| Full mobile unit suite | `pnpm --filter @festipal/mobile test` | 9 files / 69 tests passed | ✓ PASS |
| Full mobile typecheck | `pnpm --filter @festipal/mobile typecheck` (`tsc --noEmit`) | clean, no errors | ✓ PASS |
| Full mobile lint | `pnpm --filter @festipal/mobile lint` (`eslint .`) | clean, no errors | ✓ PASS |
| Debt-marker scan on 05-11's 4 modified/created files | `grep -nE "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER"` | 0 matches | ✓ PASS |
| Commit provenance for 05-11's 3 claimed commits | `git show --stat 211ecd2 / 9cddf4f / 9828672` | all 3 exist, match SUMMARY's claimed file/line changes and RED→GREEN ordering | ✓ PASS |

### Probe Execution

Not applicable — this phase has no `scripts/*/tests/probe-*.sh` probes; verification relies on the Vitest/typecheck/lint suites above plus the human-executed 05-UAT.md rounds.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| FEST-01 | 05-01, 05-06, 05-09 | Browse all festivals, each showing name/dates/place | ✓ SATISFIED | Unchanged this cycle; device-confirmed via 05-UAT round 2 test 1 (Alle CTA path). |
| FEST-02 | 05-04, 05-06 | Meine/Alle segment, default Meine, distinguishing saved | ✓ SATISFIED | Unchanged this cycle. |
| FEST-03 | 05-06, 05-09 | Save to Meine in one tap, server-backed, survives restart | ✓ SATISFIED | Unchanged this cycle; the related WR-01 save/enter race probe passed on-device (05-UAT round 2 test 3). |
| FEST-04 | 05-03, 05-05, 05-09, 05-10, 05-11 | Gate-less entry, non-dead-end return | ✓ SATISFIED | Gate-less entry re-confirmed unconditional after 05-11's diff; non-dead-end return device-confirmed (05-UAT round 2 test 4); deep-link entry device-confirmed (test 5). |
| HOME-01 | 05-05, 05-07, 05-09, 05-11 | Lands on festival's main menu/home after entering | ✓ SATISFIED (cold-start restore target still pending device re-confirm) | Slug-keyed festival home unchanged; G-05-5b-r2's fix to *which* festival cold-start restores to is code-complete/unit-tested but device-unconfirmed — see truth 7 and Human Verification. |
| HOME-02 | 05-01, 05-03 | Basic overview (identity + key facts) the visitor can open | ✓ SATISFIED | Unchanged this cycle. |

No orphaned requirements: REQUIREMENTS.md maps exactly FEST-01..04, HOME-01, HOME-02 to Phase 5 (`.planning/REQUIREMENTS.md` lines 26-34, 107-112), all six marked `[x]`/`Complete`, and all six appear in at least one plan's `requirements:` frontmatter across 05-01..05-11 (05-11 itself declares `[HOME-01, FEST-04]`).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/mobile/app/(tabs)/festivals.tsx` | 158-176 (`onMutate`), 214-228 (`handleEnter`) | `syncActiveFestivalOnEnter(slug, saved)` still reads the OPTIMISTIC `savedIds` cache (written synchronously in `onMutate`, before the network call resolves) — the WR-01 pattern from 05-REVIEW.md is structurally unchanged by 05-11 | ℹ️ Info (downgraded from prior cycle's Warning) | A same-row Save-then-Enter race where the save subsequently fails could in theory still persist a slug for a never-actually-saved festival. However, 05-UAT.md round 2 test 3 specifically probed this exact scenario (force a failing save mid-tap, force-quit, relaunch) on a real device and it **passed** — the race did not manifest. Retained as an informational note (the code pattern exists) rather than an open warning (device-tested as not currently exploitable in practice). |
| `apps/mobile/lib/pending-destination.ts` | 9-11 | Module header comment still states capture only happens while unauthenticated (05-REVIEW.md WR-02, stale doc) | ⚠️ Warning (carried forward, unchanged by 05-11) | Documentation-only; no functional impact. Not addressed by this gap-closure plan (out of scope). |
| `apps/mobile/app/_layout.tsx` | 84, 141-143 | `AUTH_FLOW_PATHS` excludes auth routes by exact literal match, not prefix (05-REVIEW.md WR-03, carried forward) | ⚠️ Warning (carried forward, unchanged by 05-11) | Latent risk against a future nested auth route; not addressed by this gap-closure plan (out of scope). |
| `apps/mobile/app/_layout.tsx` | 103, 131-144, 232-253 | G-05-7's fix wired only into the one-shot cold-start capture/replay path; a warm deep-link tap is unverified for the same defect (05-REVIEW.md WR-04, carried forward) | ⚠️ Warning (carried forward, unchanged by 05-11) | Unconfirmed either way; out of scope for this gap-closure plan. |

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` debt markers found in any of 05-11's 4 modified/created files (clean debt-marker gate, re-scanned this session).

**0 new critical or warning findings introduced by 05-11's diff itself** — the three carried-forward warnings (WR-02/WR-03/WR-04 documentation/robustness notes) pre-date this gap-closure plan and are unrelated to G-05-5b-r2's scope.

## Human Verification Required

See the `human_verification` list in this report's frontmatter for the 1 remaining item — an on-device UAT round 3 re-run confirming the G-05-5b-r2 fix actually resolves the cold-start regression that round 2 discovered:

1. **G-05-5b-r2 cold-start restore-target fix** — enter a SAVED festival, force-quit, relaunch (must restore); then enter a DIFFERENT UNSAVED festival, force-quit, relaunch (must land on Start/Home, not the stale festival). This is the exact scenario the user reported broken in round 2 ("Immer wenn ich die app quitte und dann relaunche lande ich am Frequency Festival Home Screen"); the fix is code-complete and unit-tested but has not yet been exercised on a real device.

## Gaps Summary

**No structural gaps** — the sole gap tracked into this cycle (G-05-5b-r2, reported by 05-UAT.md round 2 test 2) is closed at the code level: the fix is present (`nextActiveFestivalSlug` + `syncActiveFestivalOnEnter` in `active-festival-storage.ts`), substantive (not a stub — matches the plan's full `<behavior>` table), wired into both festival-home entry points (`festivals.tsx`, `home.tsx`), and covered by a new unit test that reproduces the EXACT regression scenario and passes. Full mobile `typecheck`/`lint`/`test` suite re-ran this session and is clean (69/69). Commit provenance was independently verified (not trusted from SUMMARY alone) — all 3 claimed commits exist with matching diffs. `gaps: []` in this report's frontmatter reflects that no `failed`/`partial` gap remains at the code level.

The phase is not cleanly `passed`, for one honest, narrowly-scoped reason:

**The G-05-5b-r2 fix itself has not yet been re-confirmed on a real device.** Round 2's on-device test is the only empirical evidence that the underlying bug existed; the fix reverses the exact logic that caused it and is unit-tested against the exact reported scenario, but persistence-across-process-kill is a runtime/OS-level behavior that only a real force-quit/relaunch cycle can settle — the same honest deferral pattern already used consistently throughout this phase (WINDOWS.md ids 21/22/23, 05-UAT.md rounds 1 and 2). This is the ONLY remaining human-verification item; all 4 other gap-closure truths that were previously behavior-unverified are now device-confirmed via 05-UAT.md round 2, and all 5 roadmap-level truths remain verified.

This routes to **status: human_needed** per the decision tree (no FAILED truth, no MISSING/STUB artifact, no NOT_WIRED key link, no BLOCKER anti-pattern — but 1 human-verification item exists, which by rule takes precedence over `passed`).

---

*Verified: 2026-08-09T19:00:00Z*
*Verifier: Claude (gsd-verifier)*
