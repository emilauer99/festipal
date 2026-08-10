---
phase: 05-festival-selection-home
fixed_at: 2026-08-10T18:35:00Z
review_path: .planning/phases/05-festival-selection-home/05-REVIEW.md
iteration: 1
findings_in_scope: 14
fixed: 12
skipped: 2
status: partial
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-08-10T18:35:00Z
**Source review:** `.planning/phases/05-festival-selection-home/05-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 14 (fix_scope: all — Critical + Warning + Info)
- Fixed: 12
- Skipped: 2

**Verification:** Every fix was applied and committed in an isolated git worktree
(`workflow.use_worktrees=true`), one atomic commit per finding, each verified with
Tier 1 (re-read modified section, confirm intact). The worktree has no installed
`node_modules`, so `tsc`/`eslint`/`vitest` could not run there per-fix; after the
transactional cleanup tail fast-forwarded `docs/phase-05-context-and-designs` to
capture all 12 commits and removed the worktree, the full mobile gate suite was run
once in the **main checkout** (reproducible from the branch as it stands now):
`pnpm --filter @festipal/mobile typecheck` (clean), `pnpm --filter @festipal/mobile
lint` (clean), `pnpm --filter @festipal/mobile test` (94/94 passed, 11/11 files).

## Fixed Issues

### CR-01: Stale in-memory cold-start redirect target survives logout and replays on the next login

**Files modified:** `apps/mobile/app/_layout.tsx`
**Commit:** `890f34f`
**Applied fix:** Added an effect that resets `coldStartRedirectRef.current` to
`false` and `coldStartTarget` to `null` whenever `authState.status` transitions to
`'unauthenticated'`. This fires for both logout paths (the natural `!session`
branch in `resolveAuthState` and `forceUnauthenticated()`'s explicit state set),
so a subsequent login — same or different account, same device/process — re-
resolves the cold-start target instead of replaying whatever the first login of
the session resolved to.

### WR-01: `nextActiveFestivalSlug`'s `prior` parameter is unused

**Files modified:** `apps/mobile/lib/active-festival-storage.ts`, `apps/mobile/lib/__tests__/active-festival-entry.test.ts`
**Commit:** `6ad9259`
**Applied fix:** Chose the documentation option over removing the parameter (the
function's existing JSDoc already explains `prior` is intentionally kept for
call-site/test narration, not consumed by the return value — removing it would
contradict that documented design intent). Added an explicit note on the
function signature and on the two tests that look redundant, clarifying they
document the "different prior" / "same prior" cases rather than adding distinct
reducer-branch coverage.

### WR-02: Deep-link capture-vs-auth-resolve ordering is assumed, not enforced

**Files modified:** `apps/mobile/app/_layout.tsx`
**Commit:** `de2a769`
**Applied fix:** Added an explicit `linkingResolved` state flag that flips true
the first time `Linking.useLinkingURL()` returns a non-`undefined` value (string
or `null`). The redirect-decide effect now gates on `linkingResolved` in addition
to `authState.status === 'authenticated'`, and lists `linkingResolved` in its
dependency array — so if `GET /me` resolves before the initial linking URL does,
the effect defers instead of consuming an empty pending-destination, and re-fires
correctly once linking has resolved (the deep-link capture effect, declared
earlier, will already have stored any pending href by then).

### WR-03: A deep link tapped after the app is already warm/authenticated is never replayed

**Files modified:** `apps/mobile/app/_layout.tsx`
**Commit:** `e4448f5`
**Applied fix:** Documented this as an accepted scope limitation for the current
MVP slice, next to the capture effect, rather than building a second in-session
consumer (a real navigation feature addition, out of scope for a review-fix pass
and materially riskier to the just-stabilized cold-start flow). Future in-session
deep-link handling is noted as needing a non-one-shot consumer.

### WR-04: Optimistic-save vs. Enter race can clear the active-festival slug mid-save

**Files modified:** `apps/mobile/app/(tabs)/festivals.tsx`
**Commit:** `912121f`
**Applied fix:** `handleEnter` now also checks `inFlightIdsRef.current` and treats
an in-flight save as `saved: true` for the purposes of `syncActiveFestivalOnEnter`,
so a Save-then-immediately-Enter tap on the same card no longer clears a
persisted slug for a festival that is genuinely being saved. Enter itself stays
gate-less and instant (per ADR-014) — only what gets persisted changes.

### WR-05: `AUTH_FLOW_PATHS` is a hand-maintained `Set` disconnected from the route files

**Files modified:** `apps/mobile/app/_layout.tsx`
**Commit:** `5f57b4e`
**Applied fix:** Added a comment listing the explicit 1:1 mapping between each
`AUTH_FLOW_PATHS` entry and its screen file under `(auth)/` and
`(profile-setup)/`, so a future screen addition/rename is a documented,
lint-visible sync point rather than a silent gap.

### WR-06: Inconsistent MMKV try/catch style between `home.tsx` and `festivals.tsx`

**Files modified:** `apps/mobile/app/(tabs)/home.tsx`
**Commit:** `35e04b4`
**Applied fix:** Removed the dead `try/catch` around `syncActiveFestivalOnEnter`
in `home.tsx`'s `handleEnter` (every storage call it makes already swallows its
own errors internally), aligning it with `festivals.tsx`'s unwrapped call site.

### WR-08: Unsafe `hero as Festival` type assertion

**Files modified:** `apps/mobile/app/(tabs)/home.tsx`
**Commit:** `da742db`
**Applied fix:** Replaced the `as Festival` assertion with an explicit
`if (!hero) return { kind: 'empty' };` runtime check right after the destructure,
enforcing the invariant at the boundary instead of asserting it away.

### WR-09: `AUTH_RESOLVE_TIMEOUT_MS` fallback doesn't cancel the in-flight resolve

**Files modified:** `apps/mobile/app/_layout.tsx`
**Commit:** `1181147`
**Applied fix:** Documented the visitor-facing consequence in product terms
(a slow-but-not-hung resolve can silently yank a visitor mid-flow from
Welcome/OTP into Home) as a deliberate, revisitable tradeoff for this MVP slice,
per the fix's "at minimum" option — did not add cancellation/debounce logic,
which would be a larger behavioral change warranting its own design pass.

### IN-01: Dead `''` entry in `AUTH_FLOW_PATHS`

**Files modified:** `apps/mobile/app/_layout.tsx`
**Commit:** `887f7c3`
**Applied fix:** Removed the unreachable `''` member and documented why
(`reconstructDeepLinkRoute` can never return `''`, and the capture effect bails
on a falsy `route` before this Set is even checked).

### IN-02: Inconsistent `radii` vs `radiiScale` accessor for the same CTA-button role

**Files modified:** `apps/mobile/app/(tabs)/festivals.tsx`
**Commit:** `541c50a`
**Applied fix:** Standardized `festivals.tsx`'s primary CTA on
`radiiScale['r-pill']`, matching `home.tsx`'s identical CTA and the
`@festipal/ui` intent documented on `radiiScale` (Phase 5 primitives should not
use the generic `radii` object).

### IN-03: `handleLogout`'s catch swallows `signOut()` failures silently

**Files modified:** `apps/mobile/app/(tabs)/festivals.tsx`
**Commit:** `684f10b`
**Applied fix:** Added `console.error('signOut failed:', error)` inside the
catch block. No user-facing behavior change (UI-SPEC's no-confirmation/no-error-UI
contract is preserved) — only debuggability.

## Skipped Issues

### WR-07: Logout's `clearActiveFestivalSlug()` can still race a concurrent Enter tap during `signOut()`

**File:** `apps/mobile/app/(tabs)/festivals.tsx:91-111`
**Reason:** This is exactly the class of "pre-existing logout-vs-enter race
needing a design decision" the task's guardrails call out to skip rather than
force. The fix requires deciding a persistence-conflict policy (guard the clear
against the currently-persisted slug, only clearing if unchanged since logout
was initiated) that has product-behavior implications beyond a mechanical code
fix, and was already carried forward unresolved from the prior (2026-08-09)
review round without a decision being made. Left for a deliberate follow-up
rather than an unreviewed behavioral change in an automated fix pass.
**Original issue:** `handleLogout` awaits `authClient.signOut()` before its
`finally` block clears the active-festival slug; a synchronous Enter tap on a
still-rendered card during that await window can persist a slug that the
`finally` block then unconditionally wipes.

### IN-04: `syncActiveFestivalOnEnter` has no unit test coverage

**File:** `apps/mobile/lib/active-festival-storage.ts:104-112`, `apps/mobile/lib/__tests__/active-festival-entry.test.ts`
**Reason:** The review itself classifies this as "a reasonable, documented
tradeoff, not a defect" — the effectful function touches the lazily-required
native MMKV module, which cannot run under Vitest's node environment. The
review's own fix note marks this "optional, future" and contingent on
`react-native-mmkv` gaining a mockable adapter, which is not something to build
as part of a review-fix pass. No code change made.
**Original issue:** Only the pure `nextActiveFestivalSlug` reducer is unit
tested; the effectful read-decide-write wiring every call site actually uses is
untested by necessity.

---

_Fixed: 2026-08-10T18:35:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
