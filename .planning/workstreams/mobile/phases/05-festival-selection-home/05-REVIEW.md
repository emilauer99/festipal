---
phase: 05-festival-selection-home
reviewed: 2026-08-10T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - apps/mobile/app/(auth)/welcome.tsx
  - apps/mobile/app/(tabs)/festivals.tsx
  - apps/mobile/app/(tabs)/home.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/app/index.tsx
  - apps/mobile/lib/active-festival-storage.ts
  - apps/mobile/lib/auth-state.ts
  - apps/mobile/lib/cold-start-redirect.ts
  - apps/mobile/lib/cold-start-target.ts
  - apps/mobile/lib/deep-link.ts
  - apps/mobile/lib/festival-navigation.ts
  - apps/mobile/lib/festivals-segment-request.ts
  - apps/mobile/lib/root-redirect.ts
  - apps/mobile/lib/__tests__/active-festival-entry.test.ts
  - apps/mobile/lib/__tests__/cold-start-redirect.test.ts
  - apps/mobile/lib/__tests__/deep-link.test.ts
  - apps/mobile/lib/__tests__/festivals-segment-request.test.ts
  - apps/mobile/lib/__tests__/root-redirect.test.ts
  - packages/db/scripts/seed.ts
findings:
  critical: 1
  warning: 9
  info: 4
  total: 14
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-08-10T00:00:00Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

This round covers the full "single `/` owner" + cold-start redirect rewrite
(`app/_layout.tsx`, `app/index.tsx`, `lib/auth-state.ts`, `lib/cold-start-redirect.ts`,
`lib/cold-start-target.ts`, `lib/root-redirect.ts`, `lib/deep-link.ts`), the Home/Festivals
screens that feed it, and `packages/db/scripts/seed.ts`.

The `isIgnorableDeepLinkRoute` guard and its use in `app/_layout.tsx` correctly filter the
Expo Dev Client launch link and Expo's internal namespaces (`_expo`, `--`) before capture,
and the `reconstructDeepLinkRoute` hostname/path rejoin logic for the custom scheme is sound
and well covered by `deep-link.test.ts`. The single-`/`-owner pattern in `app/index.tsx` +
`root-redirect.ts` correctly resolves `/welcome`, `/complete-profile`, and the resolved
cold-start target per auth state, and is fully covered by `root-redirect.test.ts`.

However, tracing the cold-start target's *lifecycle* across a full logout→login cycle within
one app session (not a fresh process cold start) surfaces a real bug: the resolved redirect
target is cached in React state that is never invalidated on logout (CR-01). This directly
undermines the cross-account mitigation the team already shipped for the MMKV-persisted
active-festival slug (`clearActiveFestivalSlug()` on logout) via a parallel, un-reset
in-memory channel.

Several warnings carried forward from the 2026-08-09 review round
(`prior` param unused in `nextActiveFestivalSlug`, the `home.tsx`/`festivals.tsx`
try/catch inconsistency, the logout-vs-Enter race on `clearActiveFestivalSlug()`) are
still present in the current code and are re-flagged below as unresolved.

## Critical Issues

### CR-01: Stale in-memory cold-start redirect target survives logout and replays on the next login (cross-account risk on a shared device)

**File:** `apps/mobile/app/_layout.tsx:72-75, 101, 110, 159-166, 183-212, 268-280`
**Issue:** `coldStartRedirectRef` (line 101) and `coldStartTarget` state (line 110) are
computed exactly **once per app process lifetime** — the redirect-decide effect
(lines 268-280) sets `coldStartRedirectRef.current = true` the first time `authState.status`
becomes `'authenticated'` and never resets it. Neither `forceUnauthenticated()`
(lines 72-75, wired at line 161) nor the natural `!session` branch of `resolveAuthState`
(lines 188-190) resets `coldStartRedirectRef.current` or clears `coldStartTarget`.

Trace: user A logs in (session 1) with a pending deep link or a persisted active-festival
slug → `coldStartTarget` resolves to e.g. `/f/festival-a` and `app/index.tsx` redirects
there. User A logs out — `festivals.tsx`'s `handleLogout` correctly calls
`clearActiveFestivalSlug()` (the *persisted* MMKV value), but `coldStartTarget`
(in-memory React state in `RootLayout`, which does not unmount across the auth
transition) is untouched. User B then logs in on the **same device, same app process**
(no cold restart) — `authState.status` transitions `unauthenticated → authenticated` again,
the guard-flip reconciliation remounts `app/index.tsx` at `/` (the same mechanism the
extensive round-1–4 comments describe as applying to *every* guard transition, not only
the profile-setup one), and `rootRedirectTarget` (line 322 of `lib/root-redirect.ts`)
returns the **stale** `coldStartTarget` verbatim, since the redirect-decide effect's
one-shot guard skips recomputation. User B is silently redirected into user A's
`/f/festival-a`, never having chosen it, without any new deep link or active-festival slug
of their own being consulted.

This is exactly the class of bug the team already fixed for the MMKV-persisted slug
(see `active-festival-storage.ts`'s "a different account signing in on the same device
does not inherit this account's active festival" comment, REVIEW 05-05 LOW) — but the
fix was applied to the storage layer only, and the parallel in-memory `coldStartTarget`
channel that `app/index.tsx` actually redirects from was missed. It also affects the
same-account relogin case: any user who logs out and back in mid-session (not just a
fresh app launch) gets forcibly redirected to wherever their *first* login of that session
landed, ignoring any deep link/active-festival state that changed since (e.g. they may
since have entered a different festival, which is not what session 2 will replay).
**Fix:** Reset both `coldStartRedirectRef.current` and `coldStartTarget` whenever the auth
state transitions to `'unauthenticated'`, so a genuinely new login (whether same or
different account) re-resolves the target instead of replaying a stale one:
```ts
useEffect(() => {
  if (authState.status === 'unauthenticated') {
    coldStartRedirectRef.current = false;
    setColdStartTarget(null);
  }
}, [authState.status]);
```
Place this alongside (or fold into) the existing `notifyForceLogout` wiring at lines
159–166, and verify the natural (non-forced) `!session` unauthenticated path
(lines 188-190) triggers it too.

## Warnings

### WR-01: `nextActiveFestivalSlug`'s `prior` parameter is still unused (carried forward, unresolved from 2026-08-09 review WR-01)

**File:** `apps/mobile/lib/active-festival-storage.ts:81-86`
**Issue:** The function signature still accepts `prior: string | undefined` but the body
(`return entered.saved ? entered.slug : undefined;`) never reads it. This was already
flagged in the prior review round and remains unaddressed. It continues to mislead readers
of `lib/__tests__/active-festival-entry.test.ts` — the tests named "overwrites a stale
saved slug…" (lines 26-30) and "is idempotent when re-entering…" (lines 32-36) exercise the
exact same `saved === true` branch as the first test (lines 6-10) and would pass identically
with `prior` deleted.
**Fix:** Drop the unused `prior` parameter from the signature, or add a one-line comment on
the two redundant-looking tests clarifying they document behavior rather than add distinct
coverage.

### WR-02: Deep-link capture-vs-auth-resolve ordering is assumed, not enforced — a real deep link can be silently dropped or, once dropped, is unrecoverable for the rest of the session

**File:** `apps/mobile/app/_layout.tsx:137-157, 183-212, 268-280`
**Issue:** The capture effect (lines 137-157) only captures once `linkingUrl` is non-null.
`Linking.useLinkingURL()` resolves the initial launch URL asynchronously (native bridge
call via `Linking.getInitialURL()`), so on the very first render `linkingUrl` is typically
still `null`/`undefined` and the effect no-ops. The comment block above the effect
(lines 116-136) claims "declaration order guarantees capture-before-consume ordering," but
declaration order only orders effects *within the same commit* — it does not guarantee the
capture effect's dependency (`linkingUrl` resolving) settles before `resolveAuthState`'s
`GET /me` round trip (lines 183-212) settles. If `GET /me` resolves first (fast/local
network, or a cached session skipping the round trip) the redirect-decide effect
(lines 268-280) runs, sets `coldStartRedirectRef.current = true`, and computes
`coldStartTarget` from `consumePendingDestination()` returning `null` — with no href
captured yet. When the deep link's URL later becomes available and the capture effect
re-fires, `capturePendingDestination` stores it, but nothing will ever consume it again
this session (the redirect-decide effect is one-shot). The tapped deep link is silently
lost; the user lands on Home or the active-festival slug instead of the shared link's
target, with no error or indication that anything failed.
**Fix:** Gate the redirect-decide effect on an explicit "linking has resolved at least once"
flag (e.g. track whether `Linking.useLinkingURL()` returned its first non-undefined value,
or use `Linking.getInitialURL()` directly with an awaited value before computing
`coldStartTarget`), rather than relying on incidental effect-ordering.

### WR-03: A deep link tapped after the app is already warm/authenticated is captured but never replayed

**File:** `apps/mobile/app/_layout.tsx:123-136, 268-280`
**Issue:** The capture effect is deliberately "auth-agnostic" (fires regardless of
`authState.status`, per the comment at lines 123-130) so it also captures a link tapped
while the app is already running and authenticated. But the only consumer of
`capturePendingDestination` — the redirect-decide effect — is guarded by
`coldStartRedirectRef` and runs **at most once per app process** (the first
`'authenticated'` transition). Any deep link tapped after that one-shot has already fired
(e.g. a friend shares a festival/camping-swap link mid-session, well after login) is
captured into the pending-destination singleton and then never consumed — it is silently
dropped, and the app does not navigate anywhere in response to the tap.
**Fix:** If in-session deep-link handling is intended for this phase, add a second
consumer that reacts to `linkingUrl` changes while already `'authenticated'` (not gated by
the one-shot ref) and performs an explicit `router.push`. If it's explicitly out of scope
for this MVP slice, document that limitation next to the capture effect so it isn't
mistaken for a bug fixed by the one-shot guard.

### WR-04: Optimistic-save vs. Enter race can clear the active-festival slug for a festival that is, in fact, being saved

**File:** `apps/mobile/app/(tabs)/festivals.tsx:149-176, 207-228`
**Issue:** `handleSave` (lines 207-212) synchronously marks the id "in flight" and calls
`saveMutation.mutate(festival)`, but the optimistic cache write that makes
`savedIds` (line 124-128) reflect the save happens inside TanStack Query's `onMutate`
callback (lines 158-176), which runs on a later microtask, not synchronously with the tap.
`renderCard` (lines 230-242) computes `saved = savedIds.has(item.id)` from the
**current render's** cache snapshot and passes it into `onEnter`. If a user taps Save and
then immediately taps Enter on the same card before that microtask has landed and
triggered a re-render, `handleEnter` (lines 214-228) is invoked with `saved: false`, and
`syncActiveFestivalOnEnter(slug, false)` **clears** any previously-persisted active-festival
slug for a festival whose save is in fact about to succeed. The cold-start restore then
loses track of this festival even though it is genuinely saved and was the last one
entered.
**Fix:** Either disable the Enter affordance while `savingIds.has(item.id)` is true (if
`FestivalCard` doesn't already do this), or have `handleEnter` re-check
`inFlightIdsRef.current.has(slug-derived-id)` / treat an in-flight save as `saved: true`
for the purposes of `syncActiveFestivalOnEnter`.

### WR-05: `AUTH_FLOW_PATHS` is a hand-maintained `Set` disconnected from the actual `(auth)`/`(profile-setup)` route files

**File:** `apps/mobile/app/_layout.tsx:82`
**Issue:** `const AUTH_FLOW_PATHS = new Set(['', 'welcome', 'email', 'verify', 'complete-profile'])`
has no compile-time link to the screens actually present under the `(auth)`/`(profile-setup)`
route groups. Adding, removing, or renaming a screen in either group (e.g. a future
`forgot-password` step) requires remembering to update this literal; forgetting to do so
means the new screen's resolved path is treated as a normal deep-link destination — it
would be captured and potentially replayed post-login, which is exactly the "content-leak
boundary" the surrounding comments (lines 130-136) say this guard exists to prevent.
**Fix:** At minimum, add a lint-visible TODO/comment pointing at every file under `(auth)/`
and `(profile-setup)/` so the two stay in sync by convention; ideally derive this set
programmatically (e.g. from Expo Router's typed route manifest) so an added screen fails a
type check instead of silently falling through.

### WR-06: Inconsistent MMKV try/catch defensive style between `home.tsx` and `festivals.tsx` around `syncActiveFestivalOnEnter` (carried forward, unresolved from 2026-08-09 review IN-01)

**File:** `apps/mobile/app/(tabs)/home.tsx:87-92`, `apps/mobile/app/(tabs)/festivals.tsx:226`
**Issue:** `home.tsx`'s `handleEnter` still wraps the call in
`try { syncActiveFestivalOnEnter(slug, true); } catch { ... }`, even though every function
`syncActiveFestivalOnEnter` calls (`getActiveFestivalSlug`/`saveActiveFestivalSlug`/
`clearActiveFestivalSlug`) already swallows its own storage errors internally — the
wrapping `try/catch` can never actually catch anything. `festivals.tsx:226` calls the same
function with no wrapper at all. The two call sites remain inconsistent for no functional
reason, which was already flagged and not addressed.
**Fix:** Drop the dead `try/catch` in `home.tsx` to match `festivals.tsx`, or leave it with
an explicit comment noting it is non-load-bearing.

### WR-07: Logout's `clearActiveFestivalSlug()` can still race a concurrent Enter tap during the in-flight `signOut()` await (carried forward, unresolved from 2026-08-09 review IN-03)

**File:** `apps/mobile/app/(tabs)/festivals.tsx:91-111`
**Issue:** `handleLogout` awaits `authClient.signOut()` before its `finally` block runs
`forceUnauthenticated()` then `clearActiveFestivalSlug()`. Because `await` yields the
event loop, a synchronous Enter tap on a still-rendered `FestivalCard` during that window
can complete `syncActiveFestivalOnEnter(slug, saved)` (persisting a legitimately
just-entered saved festival) before `signOut()` settles; when the `finally` block then
runs, `clearActiveFestivalSlug()` unconditionally wipes that just-written slug. Still
present, unresolved since the prior round.
**Fix:** Guard the clear with a check against the currently-persisted slug (only clear if
unchanged since logout was initiated), or explicitly accept as a narrow, low-impact edge
case as previously proposed.

### WR-08: Unsafe `hero as Festival` type assertion masks a potential runtime crash

**File:** `apps/mobile/app/(tabs)/home.tsx:70-71`
**Issue:** `const [hero, ...rail] = ordered;` followed by `hero as Festival` bypasses the
project's `noUncheckedIndexedAccess: true` inference, which correctly types `hero` as
`Festival | undefined` for a destructure off an array type. The `as Festival` cast is only
safe today because of the `saved.length === 0` guard a few lines above — but it removes the
compiler's ability to catch a future regression where `orderFestivalsForHome` returns fewer
items than it received (e.g. a filtering bug). If that ever happens, `viewState.hero.slug`
(lines 160, 164) throws at runtime instead of failing a type check.
**Fix:** Replace the assertion with an explicit runtime check, e.g.
`if (!hero) return { kind: 'empty' };` right after the destructure, so the invariant is
enforced at the boundary rather than asserted away.

### WR-09: `AUTH_RESOLVE_TIMEOUT_MS` fallback doesn't cancel the in-flight `resolveAuthState()`, so a stalled resolve can silently flip the user back mid-flow

**File:** `apps/mobile/app/_layout.tsx:183-212, 214-225`
**Issue:** The 8-second timeout (lines 214-225) forces `authState` to `'unauthenticated'`
if it's still `'loading'`, but it does not cancel the `resolveAuthState()` async function
still in flight (only the effect's own cleanup sets `cancelled = true`, and the timeout
firing doesn't trigger that cleanup since it doesn't change the effect's dependencies).
If the original `GET /me`/session resolution finishes shortly after the timeout has already
routed the user to Welcome, `setAuthState` is called again with `'authenticated'` or
`'authenticated-no-profile'`, silently yanking the user away from whatever they started
doing on the Welcome/email/OTP screen in the interim. The code comment (lines 34-39)
acknowledges this ("its result still wins") as an intentional tradeoff, but does not
address the UX disruption of a mid-flow forced navigation.
**Fix:** At minimum, document this as a known/accepted tradeoff explicitly in product terms
(not just implementation terms); consider only applying the late result if the user hasn't
already progressed past the initial Welcome screen, or debounce/ignore a late resolution if
the user has since started an OTP flow.

## Info

### IN-01: Dead `''` entry in `AUTH_FLOW_PATHS`

**File:** `apps/mobile/app/_layout.tsx:82`
**Issue:** `reconstructDeepLinkRoute` (`lib/deep-link.ts:40-52`) can only ever return `null`
(zero segments) or a non-empty joined string (each segment is guaranteed non-empty by
`normalizeSegment`'s `trimmed.length > 0` check) — it can never return `''`. The capture
effect also bails out early via `if (!route) return;` before ever reaching the
`AUTH_FLOW_PATHS.has(route)` check, so the `null` case never reaches the Set either. The
`''` member of `AUTH_FLOW_PATHS` is therefore unreachable.
**Fix:** Remove the `''` entry, or add a short comment explaining what unreachable case it
is meant to defensively cover (if any) so a future reader doesn't wonder whether it's load
bearing.

### IN-02: Inconsistent `tokens.radii` vs `tokens.radiiScale` accessor for the same CTA-button role

**File:** `apps/mobile/app/(tabs)/festivals.tsx:23, 408`, `apps/mobile/app/(tabs)/home.tsx:19, 262`
**Issue:** `festivals.tsx` destructures `radii` and uses `radii.pill` for its primary CTA
button's `borderRadius`, while `home.tsx` destructures `radiiScale` and uses
`radiiScale['r-pill']` for a visually-identical CTA button. Both presumably resolve to the
same pill radius today, but the two files reach it through different token accessor
patterns, which is a latent drift risk if the two ever get set to different values in
`@festipal/ui`.
**Fix:** Standardize on one accessor pattern for pill-radius buttons across the mobile app
screens (prefer whichever `@festipal/ui` intends as canonical).

### IN-03: `handleLogout`'s catch swallows `signOut()` failures without any `console.error`

**File:** `apps/mobile/app/(tabs)/festivals.tsx:94-99`
**Issue:** The empty `catch` block for `authClient.signOut()` is intentionally silent
towards the UI (per the UI-SPEC "no confirmation/no error UI" contract, which is a
reasonable product decision), but it also never logs the failure via `console.error`,
diverging from this project's stated logging convention ("Use `console.error()` for
errors"). An offline/failed signOut during manual testing or triage is currently invisible
in any log output.
**Fix:** Add a `console.error('signOut failed:', error)` inside the catch block; this does
not change any user-facing behavior, only debuggability.

### IN-04: The effectful `syncActiveFestivalOnEnter` wiring has no unit test coverage (carried forward from 2026-08-09 review IN-02, still true)

**File:** `apps/mobile/lib/active-festival-storage.ts:104-112`, `apps/mobile/lib/__tests__/active-festival-entry.test.ts`
**Issue:** Only the pure `nextActiveFestivalSlug` reducer is unit tested; the effectful
`syncActiveFestivalOnEnter` (the actual read-decide-write wiring, and the function every
call site in `festivals.tsx`/`home.tsx` actually calls) is untested, necessarily, since it
touches the lazily-required native MMKV module that cannot run under Vitest's node
environment. This remains a reasonable, documented tradeoff, not a defect — re-noted here
only because the task's carry-forward instructions asked for it to be re-checked.
**Fix (optional, future):** If `react-native-mmkv` gains a mockable/in-memory adapter,
add coverage for `syncActiveFestivalOnEnter` directly.

---

_Reviewed: 2026-08-10T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
