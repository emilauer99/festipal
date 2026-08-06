---
phase: 05-festival-selection-home
verified: 2026-08-06T15:45:00Z
status: human_needed
score: 6/6 must-haves verified (requirement-level); 1 quality regression (CR-01) and 2 robustness warnings (WR-01/WR-02) open; 8 on-device UAT items pending
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "05-UAT.md #1-8 — the full on-device acceptance flow (login→Home, Alle-segment CTA, save exactly-once + persist + rollback, enter/back, cold-start-back-to-shell, cross-account logout hygiene, deep-link precedence, DE/EN date + TalkBack a11y)"
    expected: "All 8 steps pass on a real Android device per 05-08-PLAN.md Task 2"
    why_human: "RN navigation/interaction/TalkBack/force-quit paths have no automated coverage (Vitest excludes RN rendering); explicitly deferred by user decision at the orchestrator checkpoint, not run headlessly"
  - test: "German-locale FloatingNav labels (CR-01, 05-REVIEW.md Critical)"
    expected: "Home/Friends/Profile tab labels and the 'coming soon' a11y suffix render in German ('Start'/'Freunde'/'Profil'/'bald verfügbar') on a DE-locale device"
    why_human: "Confirmed via static catalog inspection (empty msgstr) and the reviewer's lingui compile --strict run; a human/product decision is needed on the exact DE wording (e.g. whether 'Home' is an intentional loanword) before translating, and the visual confirmation is a device-language check"
---

# Phase 5: Festival Selection & Home Verification Report

**Phase Goal:** A visitor can browse all festivals, save ones to "Meine", enter any festival gate-lessly, and land on that festival's home with a basic overview they can open
**Verified:** 2026-08-06T15:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria + requirement-level)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Festivals tab shows Meine/Alle segment (default Meine); Alle lists every festival with name/dates/place, visually distinguishing saved ones (FEST-01, FEST-02) | ✓ VERIFIED | `apps/mobile/app/(tabs)/festivals.tsx` renders `SegmentedControl` defaulting to `'meine'` (line 68, `normalizeSegmentParam` fails closed to `meine`); `computeAlleState()`/`computeMeineState()` source `listFestivals`/`listMyFestivals`; `savedIds` (client-derived, line 115-119) drives `FestivalCard`'s `saved` prop → Badge vs Save affordance split (`components/FestivalCard.tsx:89-109`). API projects `startDate`/`endDate`/`place` on all rows (`festival.service.ts:39-49,112-122`). |
| 2 | Save persists server-side (`my_festival`) and survives app restart (FEST-03) | ✓ VERIFIED | `POST /festivals/:id/save` (`festival.service.ts:save()`, idempotent `onConflictDoNothing`); mutation in `festivals.tsx:134-185` uses `unwrapOk` (throws on non-200 so `onError` fires), optimistic insert with dedupe, `onSettled` invalidates `festivalKeys.mine` so the server is reconciled — a restart re-fetches from the server, not a client-only cache. `apps/api/test/save-idempotency.spec.ts` exists (referenced by 05-06-PLAN, part of the green 45/45 api suite). |
| 3 | A visitor can enter any festival gate-lessly (saved or browsed), landing on that festival's home (FEST-04 entry, HOME-01) | ✓ VERIFIED | `handleEnter` in `festivals.tsx:194-200` and `home.tsx:75-85` call `saveActiveFestivalSlug` + `router.push('/f/:slug')` unconditionally (no saved-state check gates entry); `festival.service.ts` has no membership/ticket check before `getBySlug`. |
| 4 | The home shows a basic festival overview (identity + key facts: name, dates, place) the visitor can open (HOME-02) | ✓ VERIFIED | `apps/mobile/app/(festival)/f/[festivalSlug].tsx:161-178` renders `festival.name` as `display2` H1, `formatDateRange(startDate, endDate, locale)` + conditional place caption, and a 2×2 `ComingSoonTile` grid. `formatDateRange` (`lib/date-range.ts`) is null-safe, date-only local-parsed, Hermes-safe (two `.format()` calls, no `formatRange`). |
| 5 | A visitor can return to the festival list from inside a festival without a dead-end (FEST-04) | ✓ VERIFIED | `leaveFestival(router)` (`lib/festival-navigation.ts`) = `canGoBack ? back : replace('/festivals')`, wired as the `Stack.Screen` `headerLeft` handler in `[festivalSlug].tsx:114-123`; used identically after the 05-05 cold-start `router.replace('/f/:slug')` so a history-less entry still resolves to the shell. |
| 6 | The old static festival placeholder is fully replaced by the slug-keyed route; no route resolves to a dead screen | ✓ VERIFIED | `apps/mobile/app/(festival)/index.tsx` and `apps/mobile/app/festivals/{index,_layout}.tsx` do not exist on disk (confirmed via directory listing); only `(festival)/f/[festivalSlug].tsx` and `(tabs)/festivals.tsx` remain; `(tabs)/_layout.tsx` sets `initialRouteName="home"`. |

**Score:** 6/6 roadmap success-criteria truths verified in code. All FEST-01..04/HOME-01/HOME-02 requirement IDs are accounted for (see Requirements Coverage below). Full requirement satisfaction additionally depends on the pending on-device UAT and one open quality regression — see Human Verification and Anti-Patterns below, which is why the **overall phase status is `human_needed`, not `passed`.**

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/db/src/schema/festival.ts` | `startDate`/`endDate`/`place` nullable columns + drizzle-zod bases | ✓ VERIFIED | Present, matches DATE-NULLABILITY decision; `.extend()` overrides cover date columns too (verified against generated `.d.ts` per plan claim). |
| `packages/contracts/src/schemas.ts` | `festivalSchema` recomposed on `festivalSelectSchema` | ✓ VERIFIED | `festivalSelectSchema.pick({...}).extend({cashlessUrl, supportedLocales})`, no hand-rolled `z.object`. |
| `packages/db/drizzle/0003_omniscient_meteorite.sql` | additive migration, 3 `ADD COLUMN`, no drops | ✓ VERIFIED | Exactly 3 `ADD COLUMN` statements, all nullable, no `DROP`. |
| `apps/api/src/festival/festival.service.ts`, `apps/api/src/me/me.service.ts` | project new fields through all 3 read endpoints | ✓ VERIFIED | `getBySlug`, `listAll`, `listMyFestivals` all include `startDate`/`endDate`/`place`. |
| `apps/api/test/festival-isolation.spec.ts` | round-trip + cross-tenant assertions for D-08 fields | ✓ VERIFIED | Assertions present at lines 163-220; ran green (45/45 api tests, live against Neon). |
| `packages/ui/src/tokens.ts` | `radiiScale` + 6 new color roles | ✓ VERIFIED (not independently re-inspected line-by-line, but consumed correctly by `FestivalCard`/`FloatingNav`/`ComingSoonTile`, which typecheck/lint clean per 05-08's green gate) | `tokens.radiiScale['r-card'/'r-md'/'r-pill']`, `colors.glassFill`/`glassBorder`/`borderSubtle`/`fillQuiet`/`fillBrandQuiet` all referenced and resolve in consuming components. |
| `apps/mobile/app/(festival)/f/[festivalSlug].tsx` | festival home screen | ✓ VERIFIED | Exists, matches plan (4-state branch: loading/transport-error/404/content; `leaveFestival` back; `formatDateRange`; `ComingSoonTile` grid). |
| `apps/mobile/components/FestivalCard.tsx` | flat + hero variants, sibling Pressables, saving guard | ✓ VERIFIED | Outer `View`, sibling enter/Save `Pressable`s (not nested), `saving` prop disables + no-ops Save, hero variant renders `title2` + CTA. |
| `apps/mobile/components/SegmentedControl.tsx` | options/value/onChange pill | ✓ VERIFIED | Exact prop names, no-op on already-selected press, no hardcoded copy. |
| `apps/mobile/components/FloatingNav.tsx` | 2 live + 2 disabled tabs, glass backdrop | ✓ VERIFIED (wiring); ⚠️ see CR-01 below (content/translation) | Live tabs from `state.routes`; disabled items set both `disabled` prop AND `accessibilityState`; `BlurView` + `glassFill`/`glassBorder` used. |
| `apps/mobile/app/(tabs)/home.tsx` | lean hero + rail + empty state | ✓ VERIFIED | `orderFestivalsForHome` drives hero/rail split; rail cards `saved={true}` with no Save affordance; empty state and 3 ts-rest states (pending/error/200) all distinct. |
| `apps/mobile/lib/select-next-festival.ts` + test | deterministic hero selection | ✓ VERIFIED | Pure function, exports `orderFestivalsForHome`, covered by unit tests (part of the green 52/52 mobile test run). |
| `.planning/phases/05-festival-selection-home/05-UAT.md` | 8-step on-device acceptance flow | ⚠️ PRESENT, NOT YET RUN | File exists with 8 pending tests (`status: testing`, 0/8 passed) — this is the honest, explicitly-deferred state per 05-08-SUMMARY.md, not a gap in artifact creation. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `createSelectSchema(festival)` | `festivalSchema` (contracts) | drizzle-zod `.pick()/.extend()` | ✓ WIRED | Verified in `schemas.ts`. |
| Neon migration | live columns → seed → API reads | `db:migrate` + `db:seed` | ✓ WIRED | Confirmed indirectly: `apps/api` integration tests pass live against Neon and assert real seeded values round-trip. |
| `getFestival(slug)` | festival home render | `useQuery` + 4-state branch | ✓ WIRED | `[festivalSlug].tsx:80-107`. |
| festivals list Enter | festival home | `saveActiveFestivalSlug` + `router.push('/f/:slug')` | ✓ WIRED | `festivals.tsx:194-200`, `home.tsx:75-85`. |
| festival home header Back | shell | `leaveFestival(router)` | ✓ WIRED | `[festivalSlug].tsx:114-123`. |
| cold-start MMKV slug | `/f/:slug` redirect | `app/_layout.tsx` effect | ✓ WIRED | Deep-link replay strictly precedes active-slug read with an early `return` (lines 206-227), matching the REVIEW 05-05 HIGH fix. |
| `listMyFestivals` | `savedIds` Set | client-derived membership | ✓ WIRED | `festivals.tsx:115-119`, no server-side saved flag. |
| Save mutation | `festivalKeys.mine` optimistic cache | `unwrapOk` + dedupe + rollback + invalidate | ✓ WIRED (with a known concurrency edge, see WR-01) | `festivals.tsx:134-185`. |
| `/festivals?segment=all` (Home CTA/rail) | Alle segment | typed search param | ✓ WIRED | `festivals.tsx:34-37,65-76`; `home.tsx:87-91,160-164`. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Mobile unit test suite (date-range, select-next-festival, otp-error, etc.) | `pnpm --filter @festipal/mobile test` | 6 files / 52 tests passed | ✓ PASS |
| API integration suite (incl. festival-isolation D-08 round-trip + cross-tenant, save-idempotency) | `pnpm --filter @festipal/api test` | 9 files / 45 tests passed, live against Neon | ✓ PASS |
| Debt-marker scan (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER) across all phase-modified files | `grep -rnE` over 05-01..05-08's `files_modified` | 0 matches | ✓ PASS |
| Old static festival placeholder / `app/festivals/*` removal | directory listing | not found; only `(festival)/f/[festivalSlug].tsx` and `(tabs)/festivals.tsx` remain | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FEST-01 | 05-01, 05-06 | Browse all festivals, each showing name/dates/place | ✓ SATISFIED | `listAll`/`listFestivals` projections + Alle segment render. |
| FEST-02 | 05-04, 05-06 | Meine/Alle segment, default Meine, distinguishing saved | ✓ SATISFIED | `SegmentedControl` default + `savedIds`-driven Badge. |
| FEST-03 | 05-06 | Save to Meine in one tap, server-backed, survives restart | ✓ SATISFIED (backend); ⚠️ WR-01 concurrency edge open | `saveFestival` idempotent write + optimistic client cache; a rare same-time-different-festival rollback bug (WR-01) is a UX flicker, not a data-loss bug — server reconciliation via `onSettled` invalidation still corrects it. |
| FEST-04 | 05-03, 05-05 | Gate-less entry, non-dead-end return | ✓ SATISFIED | No gate before `getBySlug`; `leaveFestival` non-dead-end back, including cold-start. |
| HOME-01 | 05-05, 05-07 | Lands on festival's main menu/home after entering | ✓ SATISFIED | Slug-keyed festival home + cold-start redirect. |
| HOME-02 | 05-01, 05-03 | Basic overview (identity + key facts) the visitor can open | ✓ SATISFIED | Name H1 + formatted dates/place + coming-soon tile grid. |

No orphaned requirements: REQUIREMENTS.md maps exactly FEST-01..04, HOME-01, HOME-02 to Phase 5, and all six appear in at least one plan's `requirements:` frontmatter (05-01: FEST-01, HOME-02; 05-02: FEST-01, FEST-02; 05-03: HOME-02, FEST-04; 05-04: FEST-01, FEST-02; 05-05: FEST-04, HOME-01; 05-06: FEST-01, FEST-02, FEST-03; 05-07: HOME-01; 05-08: all six as a verification gate).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/mobile/locales/de/messages.po` | 89-90, 159-160, 171-172, 236-237 | Empty `msgstr ""` for `coming soon`/`Home`/`Friends`/`Profile` — silently falls back to English source text under default (non-strict) `lingui compile` | 🛑 Blocker-adjacent (see below) | `components/FloatingNav.tsx` is rendered on **every** authenticated screen; a German-locale user sees English labels in an otherwise fully German shell. Confirmed still present in the current catalog (re-verified directly, not just trusting 05-REVIEW.md). Self-acknowledged in `deferred-items.md` as "a real, user-visible I18N-01 gap ... Needs a DE translation pass ... before this phase ships" — i.e. the executor itself flagged this as a pre-ship blocker and it was not subsequently fixed. |
| `apps/mobile/app/(tabs)/festivals.tsx` | 134-185 (`onError`) | `onError` rollback restores the exact snapshot captured at mutation start rather than reconciling against current cache state (05-REVIEW.md WR-01) | ⚠️ Warning | A rare race (Save A then Save B before A settles, then A fails) can transiently un-save B in the UI until `onSettled`'s invalidation re-syncs. No permanent data loss (server remains source of truth), but a visible flicker/inconsistency. |
| `apps/mobile/app/(tabs)/festivals.tsx` (`handleEnter:194-200`, `handleLogout:82-102`), `apps/mobile/app/(festival)/f/[festivalSlug].tsx` (`useEffect:93-98`), `apps/mobile/app/_layout.tsx` (`206-227`) | multiple | Synchronous MMKV calls left unguarded at 4 of the 5 call sites added this phase, while `home.tsx`'s equivalent call IS wrapped in try/catch (05-REVIEW.md WR-02) | ⚠️ Warning | An MMKV write/read throw at these sites is uncaught; in the worst case (`_layout.tsx`'s cold-start redirect) this sits between auth resolving and the first navigation. Inconsistent application of the phase's own stated "entry must never dead-end even if MMKV throws" guarantee. |
| `packages/ui/src/tokens.ts` + 3 consuming files | — | Two parallel radius token systems (`radii.pill` vs `radiiScale['r-pill']`) used inconsistently within this phase's own new files (05-REVIEW.md IN-01) | ℹ️ Info | Functionally identical today; a future desync risk, not a current defect. |
| `apps/mobile/components/FloatingNav.tsx` | 28-30, 75-77 | Unknown route name silently falls back to the Home icon/label rather than failing loudly in dev (05-REVIEW.md IN-02) | ℹ️ Info | Currently unreachable (only 2 registered routes); a latent trap for a future third tab. |

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` debt markers found in any phase-modified file (clean debt-marker gate).

## Human Verification Required

### 1. On-device 8-step acceptance flow (05-UAT.md)

**Test:** Execute all 8 steps in `.planning/phases/05-festival-selection-home/05-UAT.md` on a real Android device (login→Home, Alle-segment CTA, save exactly-once/persist/rollback, enter/back, cold-start-back, cross-account logout hygiene, deep-link precedence, DE/EN date + TalkBack a11y).
**Expected:** All 8 pass per the acceptance criteria in `05-08-PLAN.md` Task 2.
**Why human:** RN navigation/interaction, TalkBack, force-quit/relaunch, and network-toggle paths have no automated coverage; this was explicitly and transparently deferred by user decision, not silently skipped.

### 2. German-locale FloatingNav translation

**Test:** With the device set to German, view the floating tab bar and the disabled Friends/Profil items' accessibility labels.
**Expected:** "Home"/"Friends"/"Profile"/"coming soon" render as German text (e.g. "Start"/"Freunde"/"Profil"/"bald verfügbar"), not the English source strings.
**Why human:** This is currently FAILING per static evidence (empty `msgstr` re-confirmed directly in `apps/mobile/locales/de/messages.po`), but the exact translation choice (e.g. whether "Home" should be a deliberate English loanword) is a product/copy decision, and the fix + `lingui compile --strict` CI gate needs to be applied and then visually re-confirmed on a DE-locale device.

## Gaps Summary

The phase's requirement-level truths (FEST-01..04, HOME-01, HOME-02) are all backed by real, wired, non-stub code — verified directly against the source (not SUMMARY claims), and the automated suites this verifier re-ran independently (52/52 mobile, 45/45 api) pass. The old static `(festival)/index.tsx` and flat `festivals/` route group are genuinely deleted, not just claimed deleted.

However, the phase is not cleanly `passed`:

1. **CR-01 (Critical, still open):** Four FloatingNav strings ship untranslated in German — a real, user-visible regression on the app's own default-German festival-app product (CLAUDE.md's non-negotiable "i18n from day 1"), on a navigation surface visible on every authenticated screen. The phase's own `deferred-items.md` acknowledges this needs fixing "before this phase ships," and it has not been fixed as of this verification. This is not a hypothetical concern — it was independently re-confirmed by reading the current `.po` file.
2. **8 UAT items pending:** the entire on-device acceptance flow (including FEST-03's exactly-once-save/restart-persistence, HOME-01's cold-start focus, and the deep-link-precedence security-relevant edge) is unverified on real hardware, by explicit, documented user decision to defer rather than an oversight.
3. **WR-01/WR-02 (Warnings, still open):** a concurrent-save UI flicker and inconsistent MMKV guard coverage — neither blocks the phase goal, both are real robustness gaps the code review already surfaced and neither has been fixed since.

None of these are classified as `gaps_found` (no artifact is missing/stub, no key link is unwired, no roadmap truth is structurally FAILED) — the CR-01 finding is a content/translation-completeness defect in an otherwise correctly-wired i18n pipeline, and the UAT items are transparently deferred rather than silently skipped. Per the decision tree, human verification items (both the UAT flow and the CR-01 fix-and-reconfirm) take precedence over `passed`, yielding **status: human_needed**.

---

*Verified: 2026-08-06T15:45:00Z*
*Verifier: Claude (gsd-verifier)*
