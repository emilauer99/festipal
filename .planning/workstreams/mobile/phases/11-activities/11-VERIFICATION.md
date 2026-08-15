---
phase: 11-activities
verified: 2026-08-15T17:25:00Z
status: human_needed
score: 2/6 must-haves verified
behavior_unverified: 4 # present + wired + logic-layer-tested, but the asserted runtime flow is only provable on-device (no RN component harness — documented structural limitation, STATE.md)
overrides_applied: 0
behavior_unverified_items:
  - truth: "SC1 — A visitor can create an activity with either a tag or a title (auto-title rule), plus location, start time and capacity"
    test: "Open Aktivitäten tab → 'Start an activity' → submit empty (inline errors under title + Wann block, no toast) → select a tag (title becomes optional, placeholder previews tag label, subtitle field appears; deselect reverses it) → pick day+time → submit → activity appears in 'Deine Aktivitäten'. Double-tap submit fast: exactly one activity. Airplane mode + submit: error copy shows, entered values preserved."
    expected: "Create flow works end-to-end per D-05; one activity per submit; failure preserves input"
    why_human: "The tag-or-title rule itself is unit-proven (canSubmitActivity, 11 cases) and the endpoint is API-tested, but the client screen flow (live rule, inline errors, replace-navigation idempotency) has no RN component harness — device-only truth"
  - truth: "SC2 — joining or leaving updates the seat count immediately and survives an app restart"
    test: "Two accounts (WINDOWS.md #53): A creates capacity-2 activity; B joins — seat count rises immediately; kill + relaunch B, reopen detail — count still correct; B leaves — count drops, entry disappears from 'Deine Aktivitäten'"
    expected: "Seat count reflects join/leave without manual refresh and after cold start (fresh fetch via activityKeys.all invalidation)"
    why_human: "State-transition invariant across mutation → invalidation → refetch → cold-start; the invalidation wiring is verified in code (onSettled invalidates activityKeys.all in use-activity-mutations.ts:134) but the runtime cache behavior is only observable on-device"
  - truth: "SC4 — Cloning opens a prefilled create form where only time and place need changing"
    test: "Open a FOREIGN activity's detail → Clone → create form opens prefilled with tag/title/subtitle/description/free-text location/capacity, startTime EMPTY, geo point EMPTY; Back lands on the source detail (WINDOWS.md #54). Explicitly confirm the D-15 reading: free-text location IS kept, only geo + time are cleared."
    expected: "Prefill per buildClonePrefill; time and geo cleared; back returns to source"
    why_human: "buildClonePrefill is unit-proven (6 cases incl. both D-15 omissions) but the cache-read → screen-state flow needs the device; additionally ACT-04's 'only time and place changed' vs. D-15's kept free-text location is a flagged-unresolved interpretation the plans explicitly routed to phase UAT (11-03 flagged_assumptions)"
  - truth: "SC5 — an activity with a geo point offers 'open route' handing off to an external maps app; one without shows its free-text location"
    test: "Detail with pinned geo: 'Open route' next to the free text → tap opens the device's maps app/chooser at the point. Detail without geo: free text only, no route affordance. Neither location nor geo: meeting-point block absent entirely (WINDOWS.md #54)."
    expected: "geo:… (Android) / Apple-Maps URL (iOS) opens externally; conditional rendering per UI-SPEC E3"
    why_human: "buildRouteUri is unit-proven (15 cases) and the three-way branch is verified in code (activity-detail.tsx:392-416), but the actual OS handoff to a foreign maps app is external-service integration — machine-untestable by definition"
human_verification:
  - test: "Activities tab — real data, two sections (11-01 T1/T2 human-checks)"
    expected: "'Deine Aktivitäten' stacked above 'Wer kommt mit?'; own started activity carries 'Gestartet' chip and sits at section end; capacity-null card shows no spots hint; joined entry carries the 'In'/'Dabei' badge; each section resolves loading/error/empty independently"
    why_human: "No RN component harness — screen layout/state truth is on-device only"
  - test: "Push-route regression (11-01 T3 human-check)"
    expected: "Card tap opens /activity-detail as push with static 'Activity' header and back arrow; back lands on the tab; app-kill + relaunch from the detail screen never shows Expo Router's Unmatched Route screen"
    why_human: "The first-login-unmatched-route regression class is only provable by device navigation + kill/relaunch"
  - test: "Create flow end-to-end incl. D-05 live rule and idempotency (SC1 — see behavior_unverified_items)"
    expected: "See SC1 item above"
    why_human: "Screen-level flow, no harness"
  - test: "Location capture permission lifecycle (11-04 T2 human-check)"
    expected: "System permission dialog exactly once per create-screen mount; grant → 'Pin location' tap turns into removable 'Location pinned' chip, remove restores the button; deny → callout with full unshortened non-tracking copy + 'Open Settings', free-text field stays typable and the activity can still be posted; remount after decision → no re-prompt"
    why_human: "OS permission dialogs and native module behavior require the rebuilt device app"
  - test: "Two-account join/leave/full/started/dissolve flow (WINDOWS.md #53 — covers SC2 + SC3 device side)"
    expected: "Third account C sees Join genuinely disabled with 'Full — 2/2 spots'; past-startTime activity shows 'Already started'; creator A sees red Dissolve (never Leave) → native confirm dialog naming the participant count → after confirm A lands on the Activities tab and the activity is gone from both lists; also confirm a capacity-1 activity is full immediately after creation (ACT-03 flagged assumption)"
    why_human: "Multi-device, real-server, real-time truth"
  - test: "Participant list + seat line (WINDOWS.md #52)"
    expected: "Creator first in join order, no creator badge; fresh activity shows 'Nobody else yet.' instead of a one-row list; unlimited vs. numbered seat-line variants; long description wraps fully un-truncated"
    why_human: "Screen rendering truth"
  - test: "Clone + route handoff (WINDOWS.md #54 — covers SC4 + SC5 device side)"
    expected: "See SC4/SC5 items above"
    why_human: "External maps app + cache-fed prefill"
  - test: "Form primitives at volume + EN locale (WINDOWS.md #49/#50 + 11-01/11-04 locale checks + backstop items)"
    expected: "One-day festival = exactly one day chip; long festival wraps the chip row; capacity block starts 'no limit' and minus is dead at 1; long tag labels don't burst the pill; empty tag list leaves the layout intact with the title-required path; device on EN switches all chrome copy while user-entered activity titles/descriptions stay verbatim (ADR-012/020); a location capture failing for a non-permission reason falls back cleanly with the free-text field usable"
    why_human: "Visual/locale/volume truths plus the plans' explicit backstop-verification items"
---

# Phase 11: Activities Verification Report

**Phase Goal:** A visitor can create, discover, join, leave and clone activities inside a festival, and open an activity's location as a route in an external maps app.
**Verified:** 2026-08-15T17:25:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Create activity with tag OR title (auto-title rule), location, start time, capacity | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `activity-create.tsx` composes all fields around `canSubmitActivity` (no re-derived rule); rule unit-proven (11 cases, run green); D-05 live rule implemented (title placeholder swaps to tag preview, subtitle conditional, lines 180-259); submit disabled while pending, replace-navigation on success forwarding `festivalSlug` (CR-01 fix 7878b5d intact, lines 158-161); title preview is placeholder-only, never sent. Screen flow → device UAT. |
| 2 | Activities discoverable; join/leave updates seat count immediately and survives restart | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Tab replaced placeholder with two real `useQuery` sections (`activityKeys.mine`/`list`, independent states, D-04 grouping with single `nowIso` snapshot); `useActivityMutations` invalidates `activityKeys.all(festivalId)` in `onSettled` for every mutation (line 134) — prefix invariant unit-proven; no optimistic write, no persistence dependency (restart = fresh fetch). Runtime seat-count transition → device UAT (#53). |
| 3 | A full activity cannot be joined, and the UI says so rather than failing on submit | ✓ VERIFIED | Blocking is dual-enforced and behaviorally tested: server 409 (Phase-10 contract, apps/api 197/197 green) + `resolveJoinability` 'full' state carrying both numbers (unit test "locked as full ... carrying both numbers" — run green); Join button sets a genuine `disabled` prop (not opacity-only) with label `Full — {n}/{n} spots` derived solely from `resolveJoinability` (activity-detail.tsx:312-325, 474-488); 409 join-race fallback retains its own copy via `failedTargetStatus`. Visual confirmation folded into UAT #53. |
| 4 | Cloning opens a prefilled create form where only time and place need changing | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `buildClonePrefill` unit-proven (6 cases; startTime and geo explicitly nulled as separate assertions); Clone renders unconditionally on every activity, pushes (not replaces) with `cloneFromId` + `festivalSlug` (activity-detail.tsx:352-357); create screen reads `activityKeys.detail` from cache once at mount, cache miss opens empty (activity-create.tsx:114-120). D-15 interpretation ("place" = geo, free text kept) is a flagged-unresolved item the plans routed to UAT. |
| 5 | Geo point offers "open route" to external maps app; without geo, free text only | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `buildRouteUri` unit-proven (15 cases: both platforms, sign/boundary/zero/decimal, determinism); signature takes only `ActivityGeo` + platform — no string input possible (T-11-01 closed by type); detail screen three-way branch verified: geo → route button, location-only → text, neither → block renders nothing (activity-detail.tsx:392-416); `activity.geo` passed directly, no intermediate object; no route affordance in `ActivityCard`. Actual OS handoff → device UAT (#54). |
| 6 | All strings in both catalogs; user-entered titles/descriptions never translated | ✓ VERIFIED | Both catalogs carry 249 non-obsolete entries with **zero** empty `msgstr` (parsed programmatically); all 27 phase-11 msgids spot-checked present + filled in de AND en. User content (`activity.title`, `subtitle`, `description`, `location`, `tag.title`) rendered as raw JSX expressions in ActivityCard/activity-detail/activity-create — never inside a Lingui macro (macro interpolation only passes user values as ICU placeholders, which is pass-through, not translation). |

**Score:** 2/6 truths fully machine-verified (4 present + wired + logic-layer-tested, behavior deferred to on-device UAT — the project's documented verification path for screens)

### Phase-Note Prohibitions

| Prohibition | Tier | Status | Evidence |
| --- | --- | --- | --- |
| NO location watcher / background location anywhere | test (grep gate) | ✓ VERIFIED | Independent re-run: `watchPositionAsync\|startLocationUpdatesAsync\|requestBackgroundPermissionsAsync\|useBackgroundPermissions\|getLastKnownPositionAsync` → **zero matches** across all of `apps/mobile`. Capture is a single `getCurrentPositionAsync` fired exclusively from the Pin-location press handler (LocationCaptureBlock.tsx:109-124); permission requested once per mount via `useRef` guard. `app.json` plugin is foreground-only with explicit `locationAlwaysAndWhenInUsePermission: false` / `locationAlwaysPermission: false` and the no-tracking rationale string. |
| Activity content is user-generated and never translated (ADR-012/020) | judgment | ✓ verified by code inspection (non-authoritative) | See SC6. EN-locale device check ("titles stay verbatim") is included in the UAT items as the human confirmation. |
| No changes to packages/contracts, packages/db, apps/api | test (git) | ✓ VERIFIED | `git diff --stat 3372c71~1..7878b5d -- packages/contracts packages/db apps/api` → empty. |

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `lib/activity-queries.ts` | activityKeys factory + unwrapCreated | ✓ VERIFIED | 5 key variants, `all` as shared prefix; re-exports `unwrapOk`/`ApiResponseError`; `unwrapCreated` 201-only; wired into all screens + mutation hook |
| `lib/activity-form.ts` | canSubmitActivity / resolveJoinability / buildClonePrefill | ✓ VERIFIED | Framework-free, `now` as parameter; 26 unit tests green; consumed by activity-create + activity-detail |
| `lib/geo-link.ts` | buildRouteUri, no free-text input | ✓ VERIFIED | Type-hardened signature; locale-independent, non-exponential formatting; 15 tests green; consumed by activity-detail only |
| `lib/use-activity-mutations.ts` | 4 mutations, one invalidation, no optimistic write | ✓ VERIFIED | create/join/leave/dissolve; single `activityKeys.all` invalidation in shared `onSettled`; no `setQueryData` anywhere; actor/scope never in body |
| `components/ActivityCard.tsx` | shared list row | ✓ VERIFIED | Renders resolved `title` (no tag fallback expression exists); capacity-null omits spots hint entirely; ICU plurals; no route affordance, no photo prop |
| `components/{Input,Chip,CapacityField,DayTimeField}.tsx` | form primitives | ✓ VERIFIED | All exist, exported, composed by activity-create; Chip is the one pill primitive (day chips + location chip reuse it); CapacityField has no minimum stepper; DayTimeField wraps (flexWrap), local Y/M/D parsing |
| `components/LocationCaptureBlock.tsx` | one-shot capture, 3-state permission, graceful denial | ✓ VERIFIED | Three-state model, once-per-mount request via ref guard, capture only in press handler, error path resets loading state, denial locks nothing, chip shows catalog copy never coordinates |
| `app/activity-create.tsx` | create/clone push screen | ✓ VERIFIED | Registered; full form; clone via cache + buildClonePrefill; CR-01 replace forwards slug |
| `app/activity-detail.tsx` | complete detail screen | ✓ VERIFIED | Participant list via unmodified `PersonRow` (`profile` passed through, no second projection, no `.sort()`, no creator badge); seat line 2 variants; Join/Leave/Dissolve; Clone; Route öffnen |
| `app/(festival)/f/[festivalSlug]/activities.tsx` | real tab, CTA in every state | ✓ VERIFIED | `PlaceholderScreen` gone; CTA rendered outside both queries' state branches + second instance in own-section empty state |
| Chrome registrations | activity-detail + activity-create | ✓ VERIFIED | Both in `PUSH_SCREEN_ROUTES` set + `PushScreenRoute` union; both `pushScreenTitle` entries static catalog strings; both `Stack.Screen` lines inside the authenticated `Stack.Protected` block with no `options` (_layout.tsx:599, 609); fail-closed unknown-segment assertion still present in app-chrome.test.ts |
| `expo-location` + app.json plugin | foreground-only native capability | ✓ VERIFIED | `~57.0.10` in dependencies; plugin config foreground-only (checked programmatically); T-11-SC evidence in 11-SECURITY.md; rebuild confirmed by human checkpoint (11-02) |

### Key Link Verification

| From | To | Via | Status |
| --- | --- | --- | --- |
| activities.tsx | festival-context | `useFestivalContext()`, no re-query | ✓ WIRED |
| activities.tsx / activity-create.tsx (post-create) / activity-detail.tsx (clone) | /activity-detail, /activity-create | **all four navigation sites forward `festivalSlug`** (4d9f5e2 + 7878b5d intact) | ✓ WIRED |
| activity-detail.tsx / activity-create.tsx | festival resolution | `contextFestival ?? findCachedFestivalBySlug(queryClient, festivalSlug)` on both root-stack screens | ✓ WIRED |
| activity-detail.tsx | activity-queries | real `useQuery` on `activityKeys.detail` via `getActivity` — no list-cache scavenge | ✓ WIRED |
| activity-detail.tsx | activity-form / use-activity-mutations / geo-link / PersonRow | `resolveJoinability` drives label+disabled; hook drives all 3 actions; `buildRouteUri(activity.geo, platform)` direct; `profile` passed unchanged | ✓ WIRED |
| activity-create.tsx | activity-form / use-activity-mutations | `canSubmitActivity` (no duplicated rule); create via hook, disabled while pending | ✓ WIRED |
| use-activity-mutations | activity-queries | one `invalidateQueries(activityKeys.all(festivalId))` in shared onSettled | ✓ WIRED |
| DayTimeField | Chip / datetimepicker | day chips are Chip instances; installed picker, no new dep | ✓ WIRED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Phase test files (form rules, geo URI, key prefix invariant, chrome push states + fail-closed) | `npx vitest run lib/__tests__/{activity-form,geo-link,activity-queries,app-chrome}.test.ts` | 4 files, 62/62 passed | ✓ PASS |
| Catalog completeness | PO parser over both catalogs | 249 entries each, 0 empty msgstr, 27/27 phase msgids present+filled in de+en | ✓ PASS |
| No-watcher gate | grep across apps/mobile | 0 matches | ✓ PASS |
| app.json foreground-only | node app.json check | plugin present, background keys explicitly false | ✓ PASS |
| Shared-package freeze | git diff on contracts/db/api over phase range | empty | ✓ PASS |
| Full suites (reported by orchestrator, not re-run) | apps/mobile 369/369, apps/api 197/197, tsc + eslint clean | accepted as stated; phase-scoped files re-run above | ✓ |

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
| --- | --- | --- | --- |
| ACT-01 | 11-03, 11-04 | ✓ SATISFIED (device UAT pending) | Create form + canSubmitActivity + create mutation; auto-title rule client (D-05) + server-resolved title |
| ACT-02 | 11-01, 11-05 | ✓ SATISFIED (device UAT pending) | Real two-section tab from listActivities/listMyActivities; detail via getActivity |
| ACT-03 | 11-05 | ✓ SATISFIED (device UAT pending) | Join/Leave wired; creator-attendee is Phase-10 server semantics; creator gets Dissolve, never Leave |
| ACT-04 | 11-03, 11-05 | ✓ SATISFIED (device UAT pending) | Clone on every activity → prefilled form, time+geo cleared (D-15 reading to be user-confirmed) |
| ACT-05 | 11-02, 11-04, 11-05 | ✓ SATISFIED (device UAT pending) | Free text + optional one-off geo capture (no watcher, verified) + route handoff via buildRouteUri |
| ACT-06 | 11-04 | ✓ SATISFIED (device UAT pending) | listActivityTags rendered in server order, id-keyed selection, no sort/dedupe/merge (activity-create.tsx:242-254) |

No orphaned requirements: REQUIREMENTS.md maps exactly ACT-01…ACT-06 to Phase 11; all six appear in plan frontmatter. Note for phase close: the ACT checkboxes/traceability rows in REQUIREMENTS.md are still `Planned` and must be set **by hand** after UAT (`requirements.mark-complete` does not resolve the workstream path — STATE.md blocker, restated in 11-05's own verification note).

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
| --- | --- | --- | --- |
| — | No TBD/FIXME/XXX/HACK/PLACEHOLDER/stub language in any phase-11 file | — | grep exit 1 (clean) |

Code review (11-REVIEW.md) findings: the 1 Critical (CR-01) is **fixed and verified intact** (7878b5d). The 7 warnings / 5 info remain open as advisory; none breaks a success criterion — notably WR-04 (permission prompt on mount) matches the plan's own explicit must-have ("genau einmal pro Mount angefragt"), so it is a product/UX follow-up, not a phase gap. WINDOWS.md #51 (Choose-a-day/Choose-a-time catalog todo) is now satisfied in code — both msgids present and filled in both catalogs; the entry can be closed.

### Human Verification Required

See the `human_verification` frontmatter list (8 consolidated items harvested from all five plans' `<human-check>` blocks, WINDOWS.md #49-#54, the three flagged-unresolved edge assumptions (ACT-02/ACT-03/ACT-04) and the plans' backstop-verification truths). The four behavior-unverified success criteria (SC1/SC2/SC4/SC5) map onto items 3, 5, 7 and are additionally detailed in `behavior_unverified_items`.

### Gaps Summary

No gaps. Every artifact exists, is substantive and is wired; all four navigation sites into the root-stack activity screens forward `festivalSlug` (the two orchestrator fixes 4d9f5e2 and 7878b5d are intact and consistent); the no-watcher prohibition holds with zero matches; both catalogs are complete with zero empty translations; the shared-package collision zone is untouched. Everything machine-provable is proven (62 phase tests re-run green, catalog parse, grep gates, git diff). What remains is the on-device UAT pass this project's structure mandates for screen truths — status `human_needed`, not `gaps_found`.

---

_Verified: 2026-08-15T17:25:00Z_
_Verifier: Claude (gsd-verifier)_
