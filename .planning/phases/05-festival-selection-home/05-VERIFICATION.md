---
phase: 05-festival-selection-home
verified: 2026-08-09T14:54:46Z
status: human_needed
score: 5/10 truths verified (5 roadmap-level truths, unchanged since initial verification, backed by re-run code inspection + green suites); 5 gap-closure truths present + wired + newly unit-tested but behaviorally unverified pending on-device UAT re-run
behavior_unverified: 5
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 6/6 must-haves verified (requirement-level); 1 quality regression (CR-01) and 2 robustness warnings (WR-01/WR-02) open; 8 on-device UAT items pending
  gaps_closed:
    - "CR-01 (German FloatingNav translations) — fixed in commit 6023cff, confirmed empty msgstr entries now filled (Home/Friends/Profile/coming soon), lingui compile --strict wired into package.json and passing"
    - "WR-01 (concurrent-save cache rollback clobbering a sibling festival) — fixed in commit 2735700, onError now reconciles against the current cache filtered by festival.id instead of restoring a raw snapshot"
    - "WR-02 (inconsistent MMKV guard coverage) — fixed in commit 69e7a9f, try/catch moved into active-festival-storage.ts's exported functions themselves so every call site gets the guarantee"
    - "G-05-2 (Alle-segment CTA unreliable after a manual segment switch) — root cause fixed via new festivals-segment-request.ts consume-once singleton + useFocusEffect (05-09)"
    - "G-05-5b (cold-start restored unsaved festivals) — persist now gated on saved-state at enter time (05-09)"
    - "G-05-5a (cold-start Back landed on Festivals tab instead of Home) — leaveFestival's no-history fallback now targets /home (05-09)"
    - "G-05-7 (festipal://f/:slug double-slash form dropped the 'f/' segment) — new pure reconstructDeepLinkRoute helper rejoins hostname+path for the app's own custom scheme (05-10)"
    - "G-05-7b (authenticated deep link ignored in favor of the persisted slug) — capture effect's auth gate removed; capture now fires regardless of authState.status (05-10)"
  gaps_remaining: []
  regressions:
    - "New WR-01 (05-REVIEW.md, 2026-08-09 re-review): G-05-5b's saved-gate reads the OPTIMISTIC (pre-settle) savedIds cache at enter time — a same-row Save-then-Enter race where the save subsequently fails can persist the active-festival slug for a festival that was never actually saved, violating the G-05-5b invariant it was built to enforce. Warning-level, not yet fixed as of this verification. See Anti-Patterns Found."
gaps: []
human_verification:
  - test: "Re-run 05-UAT.md test 2: from the empty-state CTA / rail 'Alle' see-all, switch Festivals to Meine, return to Home, tap 'Alle Festivals ansehen' again — Festivals tab must open on Alle (not Meine)."
    expected: "The Alle segment opens on every navigation, including the previously-broken second-navigation-after-manual-switch case (G-05-2)."
    why_human: "The consume-once singleton's request/consume contract is unit-tested (12/12), but the end-to-end cross-tab focus-effect UI behavior (CTA tap -> navigate -> useFocusEffect fires -> setSegment) requires a real device/emulator; no RN-rendering test harness is wired for this repo."
  - test: "Re-run 05-UAT.md test 5, part 1 (WINDOWS.md id 21): enter an UNSAVED festival from Alle, force-quit, relaunch -> must land on Start/Home, not the festival. Then save+enter+relaunch -> must restore that festival."
    expected: "Cold-start restores only a SAVED festival's home; an entered-but-unsaved festival lands on Home."
    why_human: "Requires a real force-quit/relaunch device cycle to observe MMKV persistence and the _layout.tsx cold-start read; not exercisable from the node-env Vitest runner."
  - test: "Additionally probe the new WR-01 race while re-running the above: tap Save and immediately tap Enter on the SAME unsaved row before the save settles, then force the save to fail (e.g. toggle airplane mode mid-tap), force-quit, relaunch."
    expected: "Cold-start must NOT restore that festival (it was never actually saved) — if it does, WR-01 (05-REVIEW.md) is confirmed as a real regression, not just a theoretical one, and needs a follow-up fix (gate the persist on the settled save result, not the optimistic cache)."
    why_human: "This is a timing-dependent race between the optimistic save-mutation cache write and the enter-time saved-state read; only reproducible with a real network toggle and device timing."
  - test: "Re-run 05-UAT.md test 5, part 2 (WINDOWS.md id 22): cold-start into a restored (saved) festival home, tap Back -> must land on Start/Home tab. Enter a festival normally from the Festivals tab, tap Back -> must return to the Festivals tab."
    expected: "Cold-start Back targets Home/Start; normal in-tab Back still returns through history (G-05-5a)."
    why_human: "Requires a real device to distinguish a replace-based cold-start entry from a push-based in-tab entry and observe the Back target."
  - test: "Re-run 05-UAT.md test 7 (WINDOWS.md id 23), both sub-cases against the seeded second festival nova-sound-2026: (a) logged out, session revoked, slug A=frequency-2026 persisted, open festipal://f/nova-sound-2026 (double-slash) -> auth gate, then nova-sound-2026 opens. (b) Already authenticated, close app, fire festipal:///f/nova-sound-2026 -> nova-sound-2026 opens, NOT the persisted frequency-2026."
    expected: "Both the double-slash custom-scheme form and an already-authenticated deep link resolve correctly and take precedence over the persisted slug; the previously-confirmed logged-out triple-slash precedence must not regress."
    why_human: "reconstructDeepLinkRoute's transformation logic is fully unit-tested (8/8 fixture cases mirroring exact expo-linking@57 parse output), but firing a real OS-level festipal:// URL and observing app navigation requires a device. Additionally, 05-REVIEW.md WR-04 flags that this fix is wired only into the ONE-SHOT cold-start capture/replay path — a warm deep-link tap (app already running past its first authenticated transition) goes through Expo Router's own linking resolution instead, which was not verified to share (or not share) the same hostname-drop defect. Confirm cold-start case here; a warm-tap check is a separate follow-up."
---

# Phase 5: Festival Selection & Home Verification Report

**Phase Goal:** A visitor can browse all festivals, save ones to "Meine", enter any festival gate-lessly, and land on that festival's home with a basic overview they can open
**Verified:** 2026-08-09T14:54:46Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (plans 05-09, 05-10 closing UAT gaps G-05-2, G-05-5a, G-05-5b, G-05-7, G-05-7b)

## Goal Achievement

### Observable Truths

**A. Roadmap Success Criteria (re-confirmed unchanged since initial verification)**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Festivals tab shows Meine/Alle segment (default Meine); Alle lists every festival with name/dates/place, visually distinguishing saved ones (FEST-01, FEST-02) | ✓ VERIFIED | `apps/mobile/app/(tabs)/festivals.tsx` `normalizeSegmentParam` fails closed to `meine`; `computeAlleState()`/`computeMeineState()` source `listFestivals`/`listMyFestivals`; `savedIds` (client-derived) drives `FestivalCard`'s `saved` prop. Re-read directly, unchanged from initial verification. |
| 2 | Save persists server-side (`my_festival`) and survives app restart (FEST-03) | ✓ VERIFIED | `saveMutation` in `festivals.tsx:143-205` — `unwrapOk` throws on non-200 so `onError` fires; `onSettled` invalidates `festivalKeys.mine` (server reconciliation, not client-only cache). `apps/api/test/save-idempotency.spec.ts` part of the green 45/45 api suite (re-ran live against Neon this session). |
| 3 | A visitor can enter any festival gate-lessly (saved or browsed), landing on that festival's home (FEST-04 entry, HOME-01) | ✓ VERIFIED | `handleEnter(slug, saved)` in `festivals.tsx:214-225` calls `router.push(`/f/${slug}`)` unconditionally, outside the `if (saved)` persist gate — entry itself is never gated on saved-state, only the cold-start-restore persist is (G-05-5b). `home.tsx:76-91` same pattern. |
| 4 | The home shows a basic festival overview (identity + key facts: name, dates, place) the visitor can open (HOME-02) | ✓ VERIFIED | `apps/mobile/app/(festival)/f/[festivalSlug].tsx` unchanged this cycle; renders name H1 + `formatDateRange` + place + `ComingSoonTile` grid (re-confirmed present). |
| 5 | A visitor can return to the festival list from inside a festival without a dead-end (FEST-04) | ✓ VERIFIED | `leaveFestival(router)` (`lib/festival-navigation.ts`) — `canGoBack() ? back() : replace('/home')`; the `canGoBack()` in-tab branch (normal push-entry -> Festivals tab) is unchanged. The no-history fallback target changed from `/festivals` to `/home` this cycle (G-05-5a, explicit user-requested change captured in 05-UAT.md) — still never a dead-end, just a different (product-intended) landing tab. |

**B. Gap-Closure Truths (new this cycle — 05-09/05-10 must_haves)**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | The Home empty-state CTA / rail "Alle" see-all reliably opens the Festivals tab on the Alle segment on EVERY navigation, including after a manual switch to Meine and back — without clobbering a manual SegmentedControl tap on a plain tab-bar focus (G-05-2) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Root cause fixed: `festivals.tsx`'s param-value re-sync `useEffect` (which could not re-fire on an unchanged `segment=all` param) replaced with a `useFocusEffect` that consumes `consumeFestivalsSegment()`; `home.tsx`'s `goToAllFestivals` now calls `requestFestivalsSegment('alle')` before navigating. New `festivals-segment-request.ts` singleton's request/consume/consume-once/last-write-wins contract is unit-tested (4/4 passing, re-ran this session). The cross-tab focus-effect UI behavior itself (CTA tap -> focus -> segment switch surviving a manual tab switch) has no RN-rendering test harness in this repo and needs the on-device re-run of 05-UAT.md test 2. |
| 7 | On cold-start, only a SAVED festival's home is restored; a merely-entered-but-unsaved festival lands on Home instead (G-05-5b) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `festivals.tsx handleEnter(slug, saved)` persists `saveActiveFestivalSlug(slug)` only `if (saved)`; `home.tsx` keeps its unconditional persist (all Home cards are sourced from `listMyFestivals`, i.e. always saved) — code matches plan exactly, `typecheck`/`lint`/unit suite green. Requires a real force-quit/relaunch cycle to observe (WINDOWS.md id 21). **Caveat surfaced by 05-REVIEW.md WR-01 (2026-08-09, not yet fixed):** the `saved` flag read at enter time is the OPTIMISTIC `savedIds` (written synchronously in `saveMutation.onMutate`, before the network call resolves) — a same-row Save-then-Enter race where the save subsequently fails can persist the slug for a festival that was never actually saved. See Anti-Patterns Found and the added Human Verification probe. |
| 8 | Back from a cold-start-launched Festival Home lands on the Start/Home tab; Back from a normal in-tab push-entry still returns through history (G-05-5a) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `leaveFestival`'s no-history fallback changed to `router.replace('/home')`; `canGoBack()` branch untouched. `typecheck` passes (`/home` typed-route literal resolves). Requires a real device to distinguish a replace-based cold-start entry from a push-based in-tab entry (WINDOWS.md id 22). |
| 9 | `festipal://f/:slug` (double-slash), `festipal:///f/:slug` (triple-slash), and `https://<domain>/f/:slug` all reconstruct to the identical `f/:slug` route; the https hostname is never prepended (G-05-7) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Pure `reconstructDeepLinkRoute(parsed, appScheme)` (`lib/deep-link.ts`) rejoins hostname+path ONLY when `parsed.scheme === appScheme`; unit-tested 8/8 (double-slash, triple-slash, https, both auth-path forms, root, 2x appScheme parameterization) against fixtures documented to mirror exact expo-linking@57 `Linking.parse()` output — re-ran this session, passing. Wired into `_layout.tsx`'s capture effect (`Constants.expoConfig?.scheme` resolution + `'festipal'` fallback, confirmed at lines 131-144). The pure transformation is proven; the OS-delivered-URL -> app-navigation end-to-end path needs a real device (WINDOWS.md id 23). **05-REVIEW.md WR-04 (not yet fixed):** this fix is wired only into the one-shot cold-start capture/replay path (guarded by `coldStartRedirectRef`) — a *warm* deep-link tap (app already running past its first `'authenticated'` transition) goes through Expo Router's own linking resolution instead, which was not verified to share or not share the same defect. |
| 10 | A deep link fired while the user is ALREADY authenticated is honored and opens the linked festival, taking precedence over the persisted active-festival slug; the existing logged-out precedence does not regress (G-05-7b) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Capture effect's guard changed from `!linkingUrl \|\| authState.status !== 'unauthenticated'` to `!linkingUrl` only (confirmed at `_layout.tsx:133`) — capture now fires regardless of auth status. Redirect effect (unchanged, `_layout.tsx:232-253`) still consumes the pending destination and returns immediately, before ever reading the persisted slug — precedence logic is unchanged and was device-confirmed working for the logged-out case in the original UAT. The authenticated-capture path itself needs the same on-device re-run (WINDOWS.md id 23). **05-REVIEW.md WR-02 (not yet fixed, doc-only):** `lib/pending-destination.ts`'s header comment still states capture is auth-gated, contradicting the current code — a documentation-accuracy issue on a security-relevant boundary, not a functional defect. |

**Score:** 5/10 truths ✓ VERIFIED (all 5 roadmap-level truths, unchanged and re-confirmed against source); 5/10 ⚠️ PRESENT_BEHAVIOR_UNVERIFIED (all 5 gap-closure truths — code is present, wired, and unit-tested where automatable, but the on-device behavioral confirmation from 05-UAT.md tests 2, 5, and 7 has not yet been re-run against the fixed code). **0 truths FAILED.**

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/mobile/lib/festivals-segment-request.ts` | consume-once cross-tab segment-request singleton | ✓ VERIFIED | Matches plan exactly: `requestFestivalsSegment`/`consumeFestivalsSegment`, plain in-memory module var (not MMKV). |
| `apps/mobile/lib/__tests__/festivals-segment-request.test.ts` | unit spec covering request/consume round-trip, consume-once, no-request, last-write-wins | ✓ VERIFIED | 4/4 passing (re-ran this session). |
| `apps/mobile/lib/deep-link.ts` | pure `reconstructDeepLinkRoute(parsed, appScheme)` | ✓ VERIFIED | Matches plan exactly: hostname rejoined only for the app's own custom scheme, `normalizeSegment` strips/drops empty segments. |
| `apps/mobile/lib/__tests__/deep-link.test.ts` | unit spec over all URL forms + edge cases | ✓ VERIFIED | 8/8 passing (re-ran this session). |
| `apps/mobile/app/(tabs)/festivals.tsx` | useFocusEffect segment consume, handleEnter(slug, saved) saved-gated persist | ✓ VERIFIED | Both changes present and match plan (lines 68-85, 214-225). |
| `apps/mobile/app/(tabs)/home.tsx` | goToAllFestivals queues segment request | ✓ VERIFIED | `requestFestivalsSegment('alle')` called before `router.push` (lines 93-103). |
| `apps/mobile/lib/festival-navigation.ts` | leaveFestival no-history fallback -> `/home` | ✓ VERIFIED | Confirmed; `canGoBack()` branch untouched. |
| `apps/mobile/app/_layout.tsx` | reconstructDeepLinkRoute wired, auth-agnostic capture guard | ✓ VERIFIED | `reconstructDeepLinkRoute` import + call at lines 140; guard is `if (!linkingUrl) return;` at line 133 (no auth-status check). |
| `apps/mobile/locales/de/messages.po` | CR-01 fix — Home/Friends/Profile/coming-soon translated | ✓ VERIFIED | All 4 msgstr entries filled (`Start`/`Freunde`/`Profil`/`bald verfügbar`); re-confirmed directly, not just trusting the SUMMARY. |
| `apps/mobile/package.json` | `lingui compile --strict` gate | ✓ VERIFIED | Per 05-REVIEW-FIX.md commit `6023cff`; not independently re-diffed this session but consistent with the passing `lingui compile --strict` claim in 05-REVIEW-FIX.md. |
| `apps/mobile/lib/active-festival-storage.ts` | WR-02 fix — try/catch moved into the module's exported functions | ✓ VERIFIED | All three exports (`saveActiveFestivalSlug`, `getActiveFestivalSlug`, `clearActiveFestivalSlug`) wrap their MMKV call in try/catch. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `home.goToAllFestivals` | `requestFestivalsSegment('alle')` | direct call before `router.push` | ✓ WIRED | `home.tsx:101-102`. |
| `festivals.tsx` focus | `consumeFestivalsSegment()` | `useFocusEffect` | ✓ WIRED | `festivals.tsx:80-85`. |
| `festivals.handleEnter` | `saveActiveFestivalSlug` | gated on `saved` param | ✓ WIRED (with WR-01 race caveat, see truth #7) | `festivals.tsx:214-225`; `renderCard` passes `savedIds.has(item.id)` as `saved` (line 235). |
| `leaveFestival` no-history branch | `/home` route | `router.replace('/home')` | ✓ WIRED | `festival-navigation.ts:24-30`; `/home` resolves per `(tabs)/home.tsx` + `initialRouteName="home"`. |
| `_layout.tsx` capture effect | `reconstructDeepLinkRoute` | direct call with `Linking.parse(linkingUrl)` + resolved `appScheme` | ✓ WIRED | `_layout.tsx:138-143`. |
| `_layout.tsx` capture effect | `capturePendingDestination` | auth-agnostic guard (`!linkingUrl` only) | ✓ WIRED | `_layout.tsx:132-144`. |
| `_layout.tsx` redirect effect | `consumePendingDestination()` before `getActiveFestivalSlug()` | early-return precedence, unchanged this cycle | ✓ WIRED | `_layout.tsx:232-253` (confirmed unmodified in this diff range per 05-REVIEW.md). |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| New gap-closure unit tests (segment-request + deep-link) | `pnpm --filter @festipal/mobile exec vitest run lib/__tests__/festivals-segment-request.test.ts lib/__tests__/deep-link.test.ts` | 2 files / 12 tests passed | ✓ PASS |
| Full mobile unit suite | `pnpm --filter @festipal/mobile test` | 8 files / 64 tests passed | ✓ PASS |
| Full mobile typecheck | `pnpm --filter @festipal/mobile typecheck` | clean, no errors | ✓ PASS |
| Full mobile lint | `pnpm --filter @festipal/mobile lint` | clean, no errors | ✓ PASS |
| Full API integration suite | `pnpm --filter @festipal/api test` | 9 files / 45 tests passed, live against Neon | ✓ PASS |
| Debt-marker scan (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER) across all 28 phase-modified files (05-01..05-10) | `grep -nE` per file | 0 matches | ✓ PASS |
| Old static festival placeholder / `app/festivals/*` removal | directory listing | still not found; only `(festival)/f/[festivalSlug].tsx` and `(tabs)/festivals.tsx` remain | ✓ PASS |
| Second seeded festival for deep-link UAT (`nova-sound-2026`) | `grep` `packages/db/scripts/seed.ts` | present alongside `frequency-2026` | ✓ PASS |

### Probe Execution

Not applicable — this phase has no `scripts/*/tests/probe-*.sh` probes; verification relies on the Vitest/typecheck/lint suites above (Step 7b), which were run directly.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| FEST-01 | 05-01, 05-06, 05-09 | Browse all festivals, each showing name/dates/place | ✓ SATISFIED | Unchanged listAll/listFestivals projections + Alle segment render; 05-09 additionally fixed the Alle-segment CTA reliability (G-05-2, behavior pending on-device re-confirm). |
| FEST-02 | 05-04, 05-06 | Meine/Alle segment, default Meine, distinguishing saved | ✓ SATISFIED | Unchanged this cycle. |
| FEST-03 | 05-06, 05-09 | Save to Meine in one tap, server-backed, survives restart | ✓ SATISFIED | Core save mechanism unchanged and verified (WR-01-old fixed); the new G-05-5b saved-gate interacts with FEST-03 only via the WR-01(new) race caveat on the cold-start-restore *target*, not on the save/persist mechanism itself. |
| FEST-04 | 05-03, 05-05, 05-09, 05-10 | Gate-less entry, non-dead-end return | ✓ SATISFIED | Gate-less entry unchanged (unconditional `router.push`); non-dead-end return preserved (G-05-5a changed the fallback *target*, not the dead-end guarantee); deep-link entry (G-05-7/7b) now resolves the correct route and is auth-agnostic, pending on-device confirm. |
| HOME-01 | 05-05, 05-07, 05-09 | Lands on festival's main menu/home after entering | ✓ SATISFIED | Slug-keyed festival home unchanged; G-05-5b refines *which* festival cold-start restores to (only saved ones), pending on-device confirm. |
| HOME-02 | 05-01, 05-03 | Basic overview (identity + key facts) the visitor can open | ✓ SATISFIED | Unchanged this cycle. |

No orphaned requirements: REQUIREMENTS.md maps exactly FEST-01..04, HOME-01, HOME-02 to Phase 5 (confirmed via `.planning/REQUIREMENTS.md` lines 26-34, 107-112), all six marked `[x]`/`Complete`, and all six appear in at least one plan's `requirements:` frontmatter across 05-01..05-10. `HOME-03` correctly remains mapped to Phase 6 (not orphaned to Phase 5).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/mobile/app/(tabs)/festivals.tsx` | 214-225 (`handleEnter`), 158-176 (`onMutate`) | G-05-5b's persist gate reads the OPTIMISTIC `savedIds` cache (written synchronously in `onMutate`, before the network call resolves), not the settled result (05-REVIEW.md new WR-01, 2026-08-09) | ⚠️ Warning | A same-row Save-then-Enter race where the save subsequently fails can persist the active-festival slug for a festival that was never actually saved — directly undermines the G-05-5b invariant. Rare (requires a tap-timing race + a failing save), no data loss, but a real correctness gap in newly-added code. Not yet fixed as of this verification. Added as a specific human-verification probe above. |
| `apps/mobile/lib/pending-destination.ts` | 9-11 | Module header comment still states capture only happens while unauthenticated — now stale after G-05-7b removed that gate (05-REVIEW.md new WR-02) | ⚠️ Warning | Documentation-only defect on a security-relevant invariant (T-4-06-E content-leak boundary); a future contributor reading only this file would wrongly conclude capture is still auth-gated. No functional impact — `_layout.tsx`'s own comments are accurate. |
| `apps/mobile/app/_layout.tsx` | 84, 141-143 | `AUTH_FLOW_PATHS` excludes auth routes by exact literal match, not by route-group/prefix (05-REVIEW.md new WR-03) | ⚠️ Warning | Safe today (no auth routes have sub-segments) but fragile against a future `(auth)/verify/[code].tsx`-shaped route; no test or type error would catch a regression. Latent risk, not a current defect. |
| `apps/mobile/app/_layout.tsx` | 103, 131-144, 232-253 | G-05-7's fix is wired only into the one-shot cold-start capture/replay path; a warm (already-running, already-authenticated) deep-link tap goes through Expo Router's own linking resolution instead, unverified for the same defect (05-REVIEW.md new WR-04) | ⚠️ Warning | Whether a warm deep-link tap on `festipal://f/:slug` is also broken is unconfirmed either way — needs a device test or a source read of Expo Router's linking config for this Expo SDK. Out of scope for a static review. |
| `apps/mobile/app/(tabs)/festivals.tsx` | 25 | Local `type Segment = 'meine' \| 'alle'` redeclared instead of importing from `lib/festivals-segment-request.ts` (05-REVIEW.md IN-01) | ℹ️ Info | Structurally identical today (compiles fine), but a duplicate source of truth that could silently drift if a third segment is ever added. |

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` debt markers found in any of the 28 phase-modified files across 05-01..05-10 (clean debt-marker gate, re-scanned this session).

**0 critical findings** in the fresh 2026-08-09 deep re-review (05-REVIEW.md) — the prior cycle's CR-01/WR-01/WR-02 are confirmed fixed at the source and re-verified directly (not merely trusted from 05-REVIEW-FIX.md's own claims).

## Human Verification Required

See the `human_verification` list in this report's frontmatter for the 5 items (5 on-device UAT re-runs of 05-UAT.md tests 2, 5, and 7, plus one WR-01 race probe). In summary:

1. **G-05-2 Alle-segment CTA reliability** — re-run 05-UAT.md test 2 against the fixed code.
2. **G-05-5b cold-start restore gating** — re-run 05-UAT.md test 5 part 1 (WINDOWS.md id 21), plus a targeted probe for the new WR-01 save-fail race.
3. **G-05-5a cold-start Back target** — re-run 05-UAT.md test 5 part 2 (WINDOWS.md id 22).
4. **G-05-7 / G-05-7b deep-link forms + authenticated precedence** — re-run 05-UAT.md test 7, both sub-cases (WINDOWS.md id 23).

## Gaps Summary

**No structural gaps** — all previously-reported gaps (CR-01, WR-01-old, WR-02-old, and the five UAT-sourced gaps G-05-2/5a/5b/7/7b) are closed at the code level: every artifact the gap-closure plans committed to exists, is substantively implemented (not a stub), is wired into its call sites exactly as planned, and is covered by the new unit tests (12/12 passing) plus the full green suites (64/64 mobile, 45/45 api, clean typecheck/lint). `gaps: []` in this report's frontmatter reflects that no gap remains in the `failed`/`partial` sense the prior VERIFICATION.md's gap-closure loop was tracking.

The phase is still not cleanly `passed`, for two honest reasons:

1. **On-device confirmation is pending for all 5 gap-closure fixes.** The prior verification's original 8-step UAT already ran once (5 pass / 3 issue), and this session's plans (05-09, 05-10) fixed the 3 issues' 5 underlying gaps at the code level, but none of the fixes have been re-confirmed on a real device yet — the code is present, wired, and unit-tested where automatable, but "the CTA now reliably re-opens Alle after a manual switch" and similar claims are runtime/UI assertions that only a device can settle. This is the same honest, explicitly-tracked deferral pattern as the initial verification (WINDOWS.md ids 21, 22, 23), not a new gap.
2. **A fresh code review (05-REVIEW.md, run the same day as this verification) found 0 critical / 4 warning / 1 info issues in the gap-closure diff itself.** Most notable is a new WR-01: the G-05-5b saved-gate reads the *optimistic* save-mutation cache rather than the settled result, so a same-row Save-then-Enter race with a subsequently-failing save can violate the very invariant G-05-5b was built to enforce. This is a real, if narrow, correctness gap in newly-written code — surfaced here (not silently absorbed) and folded into the human-verification plan as a targeted probe, per this workflow's requirement that a well-formed finding is never silently dropped into a clean pass.

Both categories route to **status: human_needed** per the decision tree (no FAILED truth, no MISSING/STUB artifact, no NOT_WIRED key link, no BLOCKER anti-pattern — but 5 human-verification items exist, which by rule take precedence over `passed`).

---

*Verified: 2026-08-09T14:54:46Z*
*Verifier: Claude (gsd-verifier)*
