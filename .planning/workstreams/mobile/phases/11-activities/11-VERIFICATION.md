---
phase: 11-activities
verified: 2026-08-16T17:55:00Z
status: human_needed
score: 5/6 must-haves verified
behavior_unverified: 1 # SC1's NEW tag→title coupling (11-06/G-11-3): rules unit-proven + wired, but the changed on-screen interaction postdates the UAT pass and has no RN harness — device-only truth (WINDOWS.md #55)
overrides_applied: 0
re_verification:
  previous_status: human_needed # 2026-08-15 initial verification (2/6 machine-verified); gaps G-11-2/G-11-3 were raised by the subsequent UAT round (11-UAT.md, 6 passed / 2 issues), closed by plan 11-06 (d6a47f6, f011382, 7d52ba3)
  previous_score: 2/6
  gaps_closed:
    - "G-11-3 — tag selection now writes its label as real, editable text into the title field (resolveTitleOnTagChange), the parenthetical placeholder annotation is gone from screen and both catalogs, and an unchanged prefilled label submits as null to preserve the server's per-locale auto-title (resolveSubmittedTitle) — 17 new unit cases, 39/39 green, wiring verified in activity-create.tsx"
    - "G-11-2 — closed as diagnosis-confirmed-by-elimination, no code defect: header chain AppHeader.tsx:145 (Lingui t`Activity`) → de/messages.po:85-86 (msgstr \"Aktivität\") verified intact; UAT/UI-SPEC expectation wording corrected from the English msgid to the localized title; the DE cold-Metro-cache device falsification test remains as a human item (WINDOWS.md #56)"
  gaps_remaining: []
  regressions: []
behavior_unverified_items:
  - truth: "SC1 (changed by 11-06) — selecting a tag writes its label as real, editable text into the title field; typed text survives every tag interaction; an unchanged label submits as null"
    test: "Open create form: placeholder shows the example text with NO parenthetical note. Tap a tag → its label appears as real editable text in the title field. Tap a second tag → title follows. Edit the title, then switch tags → typed text stays. Deselect while title still equals the label → field empties. Deselect after editing → text stays. Submit with unchanged label + time → activity appears in 'Deine Aktivitäten' with the expected (locale-resolved) title."
    expected: "Six-case prefill behavior per 11-06 Task 2 human-check (WINDOWS.md #55)"
    why_human: "The two pure rules are unit-proven (17 cases incl. clone-mount) and the wiring is verified in code (nextTag computed once, functional setTitle updater, submit via resolveSubmittedTitle only), but the UAT pass for Test 3 predates this behavior change and there is no RN component harness (STATE.md structural limitation) — the on-screen interaction is device-only truth"
human_verification:
  - test: "Six-case tag/title prefill behavior (11-06 Task 2 human-check — WINDOWS.md #55; covers the changed SC1 interaction)"
    expected: "See behavior_unverified_items — placeholder unconditional, tag-select writes editable label, typed text survives switch, deselect clears unchanged label / keeps edited text, submit posts with the expected title"
    why_human: "No RN component harness; the changed interaction postdates the UAT round"
  - test: "G-11-2 DE cold-Metro-cache header falsification (11-06 Task 3 human-check — WINDOWS.md #56): device on German, `cd apps/mobile && npx expo start -c`, reload, open an activity card"
    expected: "Detail-screen header shows 'Aktivität' (not 'Activity'); EN cross-check on an English device shows 'Activity'. If 'Activity' persists on DE, the stale compiled dev-client catalog is confirmed as cause and the cache-clear run itself is the fix — either outcome closes G-11-2 without a code change"
    why_human: "Diagnosis found the localization chain already correct by elimination; only a physical DE-locale device with a cold Metro cache can falsify the stale-compiled-catalog hypothesis"
---

# Phase 11: Activities Verification Report (Re-verification after gap closure 11-06)

**Phase Goal:** A visitor can create, discover, join, leave and clone activities inside a festival, and open an activity's location as a route in an external maps app.
**Verified:** 2026-08-16T17:55:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap-closure plan 11-06 (G-11-2, G-11-3), commits d6a47f6 / f011382 / 7d52ba3 (all confirmed to exist on `feat/mobile-phase-11-activities`)

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Create activity with tag OR title (auto-title rule), location, start time, capacity | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | UAT Test 3 device-passed the full flow (validation, idempotency, offline error, CR-01 navigation) BUT 11-06 changed the tag→title coupling afterwards: tag select now writes an editable title value via `resolveTitleOnTagChange` (activity-create.tsx:255-263, nextTag computed once, functional updater), placeholder unconditional (:186), submit exclusively via `resolveSubmittedTitle` (:213). Rules unit-proven 39/39 (re-run this verification, exit 0) incl. clone-mount and strict-raw-equality near-miss cases. The changed on-screen interaction → device check #55. |
| 2 | Activities discoverable; join/leave updates seat count immediately and survives restart | ✓ VERIFIED | UAT Test 1 (two-section tab) and Test 5 (two-account join/leave/full/started/dissolve incl. kill+relaunch seat-count) device-passed. Invalidation wiring (`activityKeys.all` in shared onSettled) unchanged by 11-06 — no phase-11 runtime file besides activity-create.tsx/activity-form.ts touched (git diff 1939c2a..HEAD name-only confirms). G-11-2 (header title text) affected only chrome wording expectations, not this behavior. |
| 3 | A full activity cannot be joined, and the UI says so rather than failing on submit | ✓ VERIFIED | Machine-verified initially (server 409 + `resolveJoinability` + genuine `disabled` prop) and device-confirmed by UAT Test 5 (account C sees Join disabled with "Full — 2/2 spots"; capacity-1 full immediately after creation). Untouched by 11-06. |
| 4 | Cloning opens a prefilled create form where only time and place need changing | ✓ VERIFIED | Device-confirmed by UAT Test 7 incl. explicit D-15 reading (free-text kept, geo+time cleared, back lands on source). `buildClonePrefill` unchanged by 11-06; the new rules tolerate the clone-mount (title === tag label) by explicit test. Note: IN-01 (11-REVIEW) — an explicit title that happens to equal the tag label now clones tag-carried (title null on unchanged submit); documented deliberate trade-off, covered by device check #55's submit case. |
| 5 | Geo point offers "open route" to external maps app; without geo, free text only | ✓ VERIFIED | Device-confirmed by UAT Test 7 (route opens the maps app/chooser at the point; no-geo shows free text only; neither → block absent). `geo-link.ts` untouched by 11-06. |
| 6 | All strings in both catalogs; user-entered titles/descriptions never translated | ✓ VERIFIED | Re-parsed both catalogs this verification: 248 active entries each, **0 empty msgstr**, both in sync (39 obsolete entries each). The removed annotation msgid exists only as `#~` obsolete lines in BOTH catalogs (active-count grep = 0 for both) — lingui-extract house convention, no hand deletion, no new msgid. Header chain intact: AppHeader.tsx:145 Lingui `t\`Activity\`` → de msgstr "Aktivität". User content still rendered as raw JSX; EN-locale verbatim check device-passed in UAT Test 8. |

**Score:** 5/6 truths verified (1 present + wired + unit-proven, behavior deferred to device check #55)

### Gap-Closure Must-Haves (11-06 PLAN frontmatter)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Tag select writes its label as real, editable text (not placeholder-only) | ✓ code-verified | Handler writes title state via `resolveTitleOnTagChange` return value; no other tag-derived title condition exists in the file. Screen behavior → #55 |
| 2 | A user-typed title is NEVER overwritten by tag selection | ✓ VERIFIED | Strict raw-equality match only (activity-form.ts:195, no trim/case-fold/substring); unit cases "leaves a user-typed title unchanged…" green |
| 3 | Tag switch follows / deselect clears — only on exact match | ✓ VERIFIED | Unit cases for switch-on-match, clear-on-deselect, and the near-miss (` sport ` / case difference) all green |
| 4 | Placeholder identical regardless of tag; parenthetical annotation gone from screen AND both catalogs | ✓ VERIFIED | `titlePlaceholder` unconditional (:186); the derived-placeholder branch and label helper variable no longer exist; active-msgid grep = 0 in de and en |
| 5 | Unchanged prefilled label travels as null → server per-locale auto-title preserved (ADR-012, 10-04) | ✓ VERIFIED | `resolveSubmittedTitle` null-on-trimmed-exact-match with the documented rationale comment; submit body uses it exclusively (:213); unit cases green |
| 6 | Edited title travels as explicit title | ✓ VERIFIED | "label plus something extra" and "no tag selected" cases return trimmed text — unit-proven |
| 7 | Clone mount (title === tag label per buildClonePrefill) does not break the rule | ✓ VERIFIED | Explicit clone-mount test (deselect clears, switch replaces) + clone-with-explicit-title test — both green |
| 8 | Both rules pure, framework-free, proven under node-env Vitest | ✓ VERIFIED | Only import is `type` from `@quiks/contracts`; `pnpm exec vitest run lib/__tests__/activity-form.test.ts` → 39/39, 220ms (re-run this verification) |
| 9 | DE header shows "Aktivität" (G-11-2); UAT/UI-SPEC name the localized title, not the English msgid | ⚠️ wording ✓ / device check open | Task 3 automated checks re-run, all pass: exactly 1 unconditional "Title field placeholder" row in UI-SPEC; UAT Test 2 expected names "Aktivität"; Test 3 expected names "editierbarer Text"; exactly 1 dated Änderungsnotiz in 11-CONTEXT.md; UI-SPEC names both new rules. Device falsification → #56 |

### Prohibitions (11-06 PLAN)

| Prohibition | Status | Evidence |
| --- | --- | --- |
| No change to packages/contracts, packages/db, apps/api | ✓ VERIFIED | `git diff --stat 1939c2a..7d52ba3 -- packages/contracts packages/db apps/api` → empty; changed code files in range are exactly the 5 declared mobile files |
| No change to canSubmitActivity / D-05 presence rule | ✓ VERIFIED | Function body unchanged; both call sites (:173, :190) intact; subtitle visibility still hangs on `selectedTag` (:270); all 10 pre-existing canSubmitActivity tests still green |
| No speculative code fix for G-11-2 (AppHeader.tsx / DE catalog header entry untouched) | ✓ VERIFIED | Neither file in the change range; header chain verified byte-identical in intent (t`Activity` → "Aktivität") |
| No fuzzy title match (no trim/case-insensitive/substring) | ✓ VERIFIED | Strict `===` on raw value in resolveTitleOnTagChange; near-miss unit test proves non-match |
| No hand-deleted catalog lines; removal via lingui extract, obsolete entries kept | ✓ VERIFIED | Annotation msgid present as `#~` lines at de:47-48 / en:47-48; obsolete counts symmetric (39/39) |
| No new user-visible string | ✓ VERIFIED | Active entry count went 249 → 248 in both catalogs (one removed, zero added) |
| 11-UAT.md: only Tests 2+3 `expected:` lines touched; results/reports/gaps verbatim | ✓ VERIFIED | Task 3 automated checks pass; UAT `result:`/`reported:`/`severity:`/`note:` lines and the full `## Gaps` block present unchanged (read this verification) |
| No third-party UI kit, no new dependency | ✓ VERIFIED | No package.json in change range; imports unchanged |

### Required Artifacts (gap-closure focus + regression spot-checks)

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `lib/activity-form.ts` | +`resolveTitleOnTagChange`, +`resolveSubmittedTitle` (named exports, explicit return types) | ✓ VERIFIED | Both exported with explicit return types (`string`, `string \| null`); the three pre-existing rules untouched; framework-free |
| `lib/__tests__/activity-form.test.ts` | Proofs for both rules incl. clone-mount | ✓ VERIFIED | Two new describe blocks, 17 new cases; clone-mount is its own named test; 39/39 green |
| `app/activity-create.tsx` | Handler/placeholder/submit rewiring | ✓ VERIFIED + WIRED | nextTag computed exactly once, fed into both state writes; functional `setTitle` updater; unconditional placeholder; submit title exclusively from `resolveSubmittedTitle`; CR-01 replace-with-slug intact (:163-166) |
| `locales/{de,en}/messages.po` | Annotation obsoleted via extract, catalogs in sync | ✓ VERIFIED | 248 active / 0 empty / 39 obsolete in both |
| Doc reconciliation (11-UI-SPEC / 11-CONTEXT / 11-UAT) | Describe built behavior; D-05 original preserved + dated note | ✓ VERIFIED | All four Task-3 automated checks re-run green |

**Regression quick-checks on previously passed items:** no-watcher grep gate → 0 matches across app/lib/components; chrome registrations (`activity-detail`/`activity-create` in PUSH_SCREEN_ROUTES + Stack.Screen lines) intact; header localization chain intact; `pnpm typecheck` and `pnpm lint` (apps/mobile) both exit 0 — re-run this verification.

### Key Link Verification

| From | To | Via | Status |
| --- | --- | --- | --- |
| activity-create.tsx tag-chip handler | activity-form.ts | previous tag + next tag + current title → `resolveTitleOnTagChange`, return value written to title state | ✓ WIRED (activity-create.tsx:256-262) |
| activity-create.tsx submit path | activity-form.ts | request-body title exclusively via `resolveSubmittedTitle` — no second trimmed-length branch on title in the file | ✓ WIRED (activity-create.tsx:213; only subtitle/description/location trims remain) |
| All prior phase key links (navigation slug forwarding, invalidation, festival resolution) | — | untouched by 11-06 (change range contains no other runtime file) | ✓ intact (spot-checked, no regression) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Both new rules + all pre-existing form rules | `pnpm exec vitest run lib/__tests__/activity-form.test.ts` | 39/39 passed, 220ms | ✓ PASS |
| Catalog completeness + sync | Node PO parser over both catalogs | 248 active each, 0 empty msgstr, 39 obsolete each | ✓ PASS |
| Annotation msgid inactive | `grep -v '^#~' … \| grep -c` on both catalogs | 0 and 0 | ✓ PASS |
| Task 3 doc checks (UI-SPEC row, UAT expected lines, CONTEXT note) | plan's own grep/awk verify | all four = 1 | ✓ PASS |
| Shared-package freeze | `git diff --stat 1939c2a..7d52ba3 -- packages/contracts packages/db apps/api` | empty | ✓ PASS |
| Typecheck + lint gates | `pnpm typecheck && pnpm lint` (apps/mobile) | both exit 0 | ✓ PASS |
| No-watcher gate | grep 5 location-watcher symbols across apps/mobile | 0 matches | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
| --- | --- | --- | --- |
| ACT-01 | 11-03, 11-04, 11-06 | ✓ SATISFIED (device check #55 pending for the changed coupling) | Create flow device-passed (UAT 3); G-11-3 redesign implemented + unit-proven; auto-title semantics preserved via resolveSubmittedTitle |
| ACT-02 | 11-01, 11-05, 11-06 | ✓ SATISFIED (device check #56 pending for header falsification) | Discovery tab + detail device-passed (UAT 1, 2-routing, 5); G-11-2 closed as wording fix, chain verified correct |
| ACT-03 | 11-05 | ✓ SATISFIED | Device-passed (UAT 5) incl. full/started/dissolve/creator-attendee |
| ACT-04 | 11-03, 11-05 | ✓ SATISFIED | Device-passed (UAT 7) incl. explicit D-15 reading confirmation |
| ACT-05 | 11-02, 11-04, 11-05 | ✓ SATISFIED | Device-passed (UAT 4 permission lifecycle, UAT 7 route handoff, UAT 8 non-permission fallback); no-watcher gate re-verified 0 matches |
| ACT-06 | 11-04 | ✓ SATISFIED | Device-passed (UAT 8: long labels, empty tag list); server-order rendering unchanged by 11-06 |

No orphaned requirements — REQUIREMENTS.md maps exactly ACT-01…ACT-06 to Phase 11 and all six appear in plan frontmatter. **Known workstream quirk (STATE.md blocker, accounted for, NOT a gap):** the ACT checkboxes/traceability rows remain `[ ]`/"Planned" and must be set by hand at phase transition (`requirements.mark-complete` cannot resolve the workstream path).

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
| --- | --- | --- | --- |
| — | No TBD/FIXME/XXX/HACK/PLACEHOLDER in the three gap-closure code files | — | grep exit 1 (clean) |
| apps/mobile/app/_layout.tsx, app/(auth)/verify.tsx, app/index.tsx (UNCOMMITTED working tree) | `TEMPORARY [OTP-DEBUG]` console.log instrumentation | ℹ️ Info | NOT phase-11 changes — active debug session `otp-login-stuck-code-screen` (.planning/debug/). Marked "REMOVE before archiving", references its debug session, does not touch activity code or chrome registrations. Must not ride into the phase-11 ship commit. |

Fresh gap-closure code review (11-REVIEW.md, 0 critical / 2 warnings / 3 info): WR-01 (Prettier drift on `resolveSubmittedTitle` signature, line >100 chars) — the enforced `pnpm lint` gate passes (verified exit 0), so this is an advisory prettier-check follow-up, not a gate breach. WR-02 (hidden subtitle submitted after tag deselect) — pre-existing wiring, adjacent to but not introduced by the deselect path; no must-have or SC covers it; advisory follow-up. IN-01 noted under SC4; IN-02/IN-03 pre-existing advisory.

### Human Verification Required

Two items, both recorded as open `unrun-verify` entries in `.planning/WINDOWS.md` (#55, #56) — the structural on-device gap this project always carries (no RN component harness):

1. **Six-case tag/title prefill behavior** (11-06 Task 2 human-check) — covers the changed SC1 interaction and the IN-01 submit semantics.
2. **G-11-2 DE cold-Metro-cache header falsification** (`expo start -c`, expect "Aktivität"; EN cross-check) — either outcome closes G-11-2 without code change.

The six previously device-passed UAT flows (Tests 1, 4, 5, 6, 7, 8 plus the routing substance of 2 and the flow substance of 3) are NOT re-listed — they were human-confirmed on 2026-08-15/16 and 11-06 changed nothing in their code paths except the two items above.

### Gaps Summary

No gaps. Both UAT gaps are closed at every machine-provable level: G-11-3's two pure rules exist, are exported, framework-free, unit-proven (39/39 re-run green) and correctly wired into the create screen (nextTag once, functional updater, submit exclusively through `resolveSubmittedTitle`); the annotation msgid is obsoleted in both catalogs via lingui extract with zero active remnants and zero new msgids; G-11-2's localization chain was verified correct (Lingui macro → DE catalog entry) and the UAT/UI-SPEC wording that had prescribed the English msgid is fixed. All eight 11-06 prohibitions hold, the shared-package collision zone is untouched over the whole gap-closure range, and all regression quick-checks on the previously passed phase surface (watcher gate, chrome registrations, catalogs, typecheck, lint) pass. What remains is exactly the two on-device human checks the executor could not run — status `human_needed`, not `gaps_found`.

---

_Verified: 2026-08-16T17:55:00Z_
_Verifier: Claude (gsd-verifier)_
