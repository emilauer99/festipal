---
phase: 05-festival-selection-home
reviewed: 2026-08-09T00:00:00Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - apps/mobile/lib/active-festival-storage.ts
  - apps/mobile/app/(tabs)/festivals.tsx
  - apps/mobile/app/(tabs)/home.tsx
  - apps/mobile/lib/__tests__/active-festival-entry.test.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-08-09T00:00:00Z
**Depth:** deep
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed gap-closure plan 05-11 (G-05-5b-r2): the pure reducer `nextActiveFestivalSlug`
and the effectful authority `syncActiveFestivalOnEnter` in
`active-festival-storage.ts`, and their wiring into `festivals.tsx` and
`home.tsx`'s `handleEnter`.

**Core fix is correct.** I traced the diagnosed root cause
(`.planning/debug/cold-start-restores-unsaved-festival.md`) against the new
code: the previous "only persist when saved" gate made the persisted slug
monotonic (never cleared by an unsaved entry). `nextActiveFestivalSlug`
correctly returns `entered.slug` when `saved` and `undefined` otherwise —
unconditionally, regardless of `prior` — which is exactly what's needed to
make an unsaved entry always clear a stale saved slug. All five
`must_haves.truths` / behavior rows in the plan are satisfied by the
implementation and covered by the new unit tests. `grep saveActiveFestivalSlug`
across `apps/mobile` confirms the helper is now the sole write path (Task 2's
done-criterion holds).

**Race conditions:** I specifically traced the "two tab screens calling the
shared authority" concern requested in scope. `syncActiveFestivalOnEnter` is
fully synchronous (MMKV's `getString`/`set`/`remove` are synchronous native
calls) and JS on RN is single-threaded with no yield point inside the
function body, so there is no TOCTOU window between its read and its write —
two `handleEnter` invocations cannot interleave mid-function. This is a
genuine non-finding, not an oversight.

The defects below are quality/robustness issues, not functional regressions
of the fix's stated goal — no BLOCKER found.

## Warnings

### WR-01: `prior` parameter of `nextActiveFestivalSlug` is unused, and 3 of 5 unit tests exercise the identical code branch under misleading names

**File:** `apps/mobile/lib/active-festival-storage.ts:81-86`
**Issue:** `nextActiveFestivalSlug(prior, entered)` never reads `prior` — the
function body is literally `return entered.saved ? entered.slug : undefined;`.
The module doc (lines 71-75) is honest about this ("the RETURN depends only
on `entered.saved`"), but the parameter's presence in the public signature
invites a reader to assume it affects the result (e.g. "only clear if
different from prior", or an idempotency short-circuit) — neither is
implemented.

This leaks into the test suite
(`apps/mobile/lib/__tests__/active-festival-entry.test.ts`): the test named
`'overwrites a stale saved slug when a DIFFERENT saved festival is entered'`
(lines 26-30) and the test named `'is idempotent when re-entering the SAME
saved festival'` (lines 32-36) both just re-exercise the same `saved ===
true → return entered.slug` branch already covered by the first test (lines
6-10) — they would pass identically if `prior` were deleted from the
function entirely. They give the impression that "overwrite" and
"idempotent" semantics are independently verified when they are not; only
the `saved === false` branch (lines 12-16, 18-24) is where `prior` actually
matters to the regression narrative, and even there the function ignores it.
**Fix:** Either (a) drop the unused `prior` parameter from
`nextActiveFestivalSlug`'s signature (the JSDoc's "callers/tests can
narrate…" rationale can be satisfied by naming the test's local variables
instead, e.g. `const priorFromStaleSession = 'frequency-2026'; // narrative only, not passed to the reducer`),
or (b) if the parameter is being kept intentionally as forward-looking API
shape, add a short comment directly on the two "overwrites"/"idempotent"
tests noting they assert the *same* branch as test 1 and exist only for
narrative documentation, not distinct coverage — so a future reader doesn't
mistake test count for behavioral coverage.

### WR-02: The "single persist/clear authority" invariant only covers entry paths, not future un-save/removal paths

**File:** `apps/mobile/lib/active-festival-storage.ts:88-102`, `apps/mobile/app/(tabs)/home.tsx:82-86`
**Issue:** The docs claim `syncActiveFestivalOnEnter` is now the sole owner
of the persist/clear invariant "across every festival-home entry point," and
home.tsx's comment states this means "a future entry path can never
silently reintroduce the sticky stale-slug bug." That's true only for
*entry* — there is currently no "unsave" / "remove from mine" mutation
anywhere in the mobile app (confirmed via
`grep -rniE "unsave|removeFestival|deleteFestival"` returning no hits), so
this is not yet reachable. But the exact same bug class this plan closes
(a slug that is stale relative to the festival's current saved state,
restored unconditionally by `_layout.tsx:246-249`) can reappear the moment
an "un-save" feature ships, unless that feature also calls
`clearActiveFestivalSlug()` (or re-derives via the authority) for a festival
that happens to be the currently-persisted slug. Nothing in this diff
guards against that, and the doc comments read as though the invariant is
now closed for good.
**Fix:** Add a short forward-pointing note next to `ACTIVE_FESTIVAL_SLUG_KEY`
or in the module doc: "if an un-save/remove-festival mutation is added, it
must call `clearActiveFestivalSlug()` when the removed festival's slug
matches `getActiveFestivalSlug()` (see `[festivalSlug].tsx`'s 404-clear
effect for the existing pattern) — otherwise the sticky-stale-slug bug
(G-05-5b-r2) reappears via a new trigger." This costs one comment now and
prevents the same debugging cycle from recurring later.

## Info

### IN-01: Dead `try/catch` around `syncActiveFestivalOnEnter` in `home.tsx`, inconsistent with `festivals.tsx`

**File:** `apps/mobile/app/(tabs)/home.tsx:87-92`
**Issue:** `home.tsx` still wraps the call in `try { syncActiveFestivalOnEnter(slug, true); } catch { ... }`. Per the module's own WR-02 guarantee (`active-festival-storage.ts:36-41`), every exported function — including `syncActiveFestivalOnEnter`, which only calls `getActiveFestivalSlug`/`saveActiveFestivalSlug`/`clearActiveFestivalSlug`, all of which already swallow their own storage errors — cannot throw. The `catch` branch is therefore unreachable dead code. `festivals.tsx:226` correctly calls the same function with no wrapper. Not a bug (belt-and-braces is harmless here), but the two call sites are now inconsistent for no functional reason, which makes the "single authority, no-throw guarantee" a little less legible at the call sites that are supposed to benefit from it.
**Fix:** Drop the `try/catch` in `home.tsx`'s `handleEnter` to match `festivals.tsx`, or leave it but add a one-line comment ("defensive only — `syncActiveFestivalOnEnter` cannot throw, see WR-02") so a future reader doesn't assume it's load-bearing.

### IN-02: The effectful `syncActiveFestivalOnEnter` (the actual read-decide-write wiring) has no unit test coverage

**File:** `apps/mobile/lib/active-festival-storage.ts:104-112`, `apps/mobile/lib/__tests__/active-festival-entry.test.ts`
**Issue:** The test file exercises only the pure `nextActiveFestivalSlug` reducer. `syncActiveFestivalOnEnter` — which actually calls `getActiveFestivalSlug()`, decides, and calls `saveActiveFestivalSlug`/`clearActiveFestivalSlug` — is untested (necessarily, since it touches the lazily-required native MMKV module that can't run under Vitest's node environment, consistent with the rest of this file's testing constraints). This is a reasonable and documented tradeoff, but it means the actual "read prior → clear if unsaved" wiring bug this plan closes is verified only by the plan's manual UAT round 3, not by CI. Not asking for a fix here — MMKV mocking is out of scope for this plan — just flagging that the regression's real fix-point is only regression-tested end-to-end manually.
**Fix (optional, future):** If `react-native-mmkv` gains a mockable/in-memory adapter later, add a `syncActiveFestivalOnEnter` test using it so this wiring is covered by CI rather than only by manual UAT.

### IN-03: Logout's `clearActiveFestivalSlug()` can race a concurrent `Enter` tap during the in-flight `signOut()` await

**File:** `apps/mobile/app/(tabs)/festivals.tsx:91-111`
**Issue:** `handleLogout` is `async` and awaits `authClient.signOut()` before its `finally` block runs `forceUnauthenticated()` then `clearActiveFestivalSlug()`. Because `await` yields the JS event loop, a synchronous `Enter` tap on a still-visible `FestivalCard` during that window runs `handleEnter → syncActiveFestivalOnEnter(slug, saved) → router.push(...)` to completion before `signOut()` resolves. When `signOut()` then resolves/rejects and the `finally` block runs, `clearActiveFestivalSlug()` unconditionally wipes whatever `syncActiveFestivalOnEnter` just persisted — even a legitimately just-entered SAVED festival. This predates plan 05-11 (the logout-clear call itself is from 05-05) and is not introduced by this diff, but it does touch the same shared persist/clear authority this plan consolidated, and is a plausible (if low-probability) way the "last entered saved festival" invariant can be violated by an unrelated code path.
**Fix (optional, not blocking this plan):** Guard `clearActiveFestivalSlug()` in `handleLogout`'s `finally` the same way `[festivalSlug].tsx`'s 404-effect guards its clear — only clear if the persisted slug hasn't changed since logout was initiated, or simply accept this as a narrow, low-impact edge case (matches this plan's own threat-model disposition of `T-05-11-I` as "accept, non-secret, low severity").

---

_Reviewed: 2026-08-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
