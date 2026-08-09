---
phase: 05-festival-selection-home
reviewed: 2026-08-09T16:50:00Z
depth: deep
files_reviewed: 32
files_reviewed_list:
  - apps/api/src/festival/festival.service.ts
  - apps/api/src/me/me.service.ts
  - apps/api/test/festival-isolation.spec.ts
  - apps/mobile/app.json
  - apps/mobile/app/(festival)/f/[festivalSlug].tsx
  - apps/mobile/app/(tabs)/_layout.tsx
  - apps/mobile/app/(tabs)/festivals.tsx
  - apps/mobile/app/(tabs)/home.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/components/ComingSoonTile.tsx
  - apps/mobile/components/FestivalCard.tsx
  - apps/mobile/components/FloatingNav.tsx
  - apps/mobile/components/SegmentedControl.tsx
  - apps/mobile/lib/__tests__/date-range.test.ts
  - apps/mobile/lib/__tests__/deep-link.test.ts
  - apps/mobile/lib/__tests__/festivals-segment-request.test.ts
  - apps/mobile/lib/__tests__/select-next-festival.test.ts
  - apps/mobile/lib/active-festival-storage.ts
  - apps/mobile/lib/date-range.ts
  - apps/mobile/lib/deep-link.ts
  - apps/mobile/lib/festival-navigation.ts
  - apps/mobile/lib/festival-queries.ts
  - apps/mobile/lib/festivals-segment-request.ts
  - apps/mobile/lib/select-next-festival.ts
  - apps/mobile/locales/de/messages.po
  - apps/mobile/locales/en/messages.po
  - apps/mobile/package.json
  - packages/contracts/src/schemas.ts
  - packages/db/drizzle/0003_omniscient_meteorite.sql
  - packages/db/scripts/seed.ts
  - packages/db/src/schema/festival.ts
  - packages/ui/src/tokens.ts
findings:
  critical: 0
  warning: 4
  info: 1
  total: 5
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-08-09T16:50:00Z
**Depth:** deep
**Files Reviewed:** 32
**Status:** issues_found

## Summary

This is a re-review of the festival-selection-home phase after a prior review + fix cycle (CR-01
i18n gap, WR-01 optimistic-cache rollback, WR-02 unguarded MMKV calls — all confirmed fixed: the
German catalog has no empty `msgstr`s, `lingui compile --strict` is wired into `package.json`,
`festivals.tsx`'s `onError` now reconciles by filtering the current cache instead of restoring a
raw snapshot, and `active-festival-storage.ts` wraps every exported function in `try/catch` at
the source). `pnpm --filter @festipal/mobile typecheck`, `lint`, and `test` (64 tests, 8 files)
all pass clean on the reviewed tree, and `apps/api`/`packages/*` are unchanged in this diff range
(only `packages/db/scripts/seed.ts` gained a second seeded festival, which is sound and
unrelated).

Deep cross-file tracing focused on the two newest gap-closure areas per the review brief:
`lib/festivals-segment-request.ts` (G-05-2) wired into `home.tsx`/`festivals.tsx`, and
`lib/deep-link.ts` (G-05-7/G-05-7b) wired into `app/_layout.tsx`, plus the two smaller G-05-5a/5b
fixes in `festival-navigation.ts` and `festivals.tsx`. No BLOCKER-level defect was found — the
pure helpers (`reconstructDeepLinkRoute`, `consumeFestivalsSegment`) are correct and well-tested
in isolation, and the segment-request wiring correctly avoids the previous
cannot-re-fire-on-unchanged-param bug. However, tracing the G-05-5b fix against the pre-existing
optimistic save-mutation flow in `festivals.tsx` surfaces a genuine data-consistency race that
the previous review's WR-01 fix did not anticipate (because at WR-01 time, entry always persisted
unconditionally), and the new auth-agnostic deep-link capture in `_layout.tsx` has both a stale
cross-file doc comment and a not-fully-hardened security-boundary check worth tightening.

## Warnings

### WR-01: `handleEnter`'s G-05-5b save-gate can persist the active-festival slug for a festival whose save never actually succeeded

**File:** `apps/mobile/app/(tabs)/festivals.tsx:158-205,214-225,227-239`
**Issue:**
G-05-5b (this gap-closure cycle) changed `handleEnter` to persist the D-06 active-festival slug
only `if (saved)` (line 223), where `saved` is computed per-row as `savedIds.has(item.id)`
(line 228) and threaded into the `onEnter` closure (line 235). `savedIds` is derived from
`listMyFestivalsQuery.data` (lines 124-128), which the pre-existing (05-06) `saveMutation`
`onMutate` (lines 158-176) writes to **optimistically and synchronously**, before the network
request resolves.

Trace: on the "Alle" segment, a user taps Save on festival A → `onMutate` immediately marks A as
saved in the `festivalKeys.mine` cache → `savedIds` recomputes → the row re-renders with
`saved: true` for A. If, in the window before the save request settles (any transient
network failure, e.g. this is an explicitly offline-first app), the user also taps the same row's
enter area, `handleEnter(slug, true)` fires and persists A's slug via
`saveActiveFestivalSlug(slug)` (line 223). If the save subsequently fails, `onError`
(lines 177-198) correctly rolls back the *cache* entry for A — but nothing rolls back the
already-written MMKV slug. This leaves the D-06 cold-start focus pointing at a festival that was
never actually saved, directly violating the invariant the G-05-5b fix itself documents:
"the cold-start RESTORE must only ever bring back a SAVED festival" (line 218-219 comment). This
is a regression introduced specifically by this gap-closure change: before G-05-5b, `handleEnter`
persisted unconditionally regardless of saved state, so an unresolved/failed save never mattered
for this invariant.

**Fix:** Gate the persist on the *settled* save result, not the optimistic one — e.g. only persist
in `onSuccess`/`onSettled` for the just-entered festival, or re-check `savedIds.has(item.id)`
against the reconciled (post-`invalidateQueries`) cache before writing MMKV, rather than capturing
`saved` in the `onEnter` closure at render time:

```ts
onSettled: (_data, _error, festival) => {
  inFlightIdsRef.current.delete(festival.id);
  setSavingIds(new Set(inFlightIdsRef.current));
  void queryClient.invalidateQueries({ queryKey: festivalKeys.mine });
},
```
plus, in `handleEnter`, only write the slug when the row is confirmed-saved (e.g. gate on
`!inFlightIdsRef.current.has(item.id) && saved`, or simply accept a one-render lag by reading
`savedIds` fresh rather than through the row's captured closure).

### WR-02: `lib/pending-destination.ts`'s header comment now contradicts `_layout.tsx`'s auth-agnostic capture, misdocumenting a security-relevant invariant

**File:** `apps/mobile/lib/pending-destination.ts:9-11`, `apps/mobile/app/_layout.tsx:131-144`
**Issue:**
`pending-destination.ts`'s module doc still states: *"Capture (app/_layout.tsx) only happens
while the guard is 'unauthenticated'..."*. This was true before this gap-closure cycle, but
commit `bb9b2aa` (G-05-7b, this phase) deliberately removed that gate — the capture effect in
`_layout.tsx` now fires "REGARDLESS of `authState.status`" (per its own updated comment at
`_layout.tsx:117-118`), specifically so an already-authenticated cold start also captures a fired
deep link. `pending-destination.ts` was not touched in this range and its header comment was
never updated to match, so the one file whose entire purpose is documenting this security-relevant
capture/replay/content-leak boundary (T-4-06-E) now states a guarantee the code no longer
provides. A future contributor reading only `pending-destination.ts` (the natural place to look
for this invariant) would reasonably conclude capture is authentication-gated when it is not.
**Fix:** Update `pending-destination.ts`'s header comment to match `_layout.tsx`'s current
behavior — capture is now auth-agnostic; only *replay* is gated (on the transition into
`'authenticated'`) — and point at the `AUTH_FLOW_PATHS` guard as the mechanism that still prevents
capturing an (auth)/(profile-setup) href.

### WR-03: `AUTH_FLOW_PATHS` excludes auth routes by exact string match, not by group/prefix — fragile against future sub-routes under `(auth)`/`(profile-setup)`

**File:** `apps/mobile/app/_layout.tsx:84,141-143`
**Issue:**
The content-leak boundary that keeps a captured deep link from ever targeting an auth-flow screen
is `AUTH_FLOW_PATHS.has(route)` against the literal set `['', 'email', 'verify',
'complete-profile']` — a reconstructed route must match one of these **exactly**. The code
comment above it explicitly frames this as load-bearing: "this MUST NOT weaken the content-leak
boundary." Today this is safe only because none of `(auth)/email.tsx`, `(auth)/verify.tsx`, or
`(profile-setup)/complete-profile.tsx` have any dynamic sub-segment. But the check does not
express *why* it's safe (no route under those groups nests further) — it is safe by the current
route tree's shape, not by construction. If a future phase adds e.g. `(auth)/verify/[code].tsx`
(a very plausible shape for an OTP deep-link-with-code flow), a link reconstructing to
`verify/ABC123` would silently fail the `AUTH_FLOW_PATHS.has()` check, get captured, and later
get replayed via `router.replace('/verify/ABC123' as Href)` after the guard reaches
`'authenticated'` — landing on an Unmatched Route today, but a real, unintended entry point into
whatever `(auth)` renders in the future the moment such a route exists, with no test or type error
to catch the regression (the `Href` cast on line 242 already opts this path out of typed-route
checking).
**Fix:** Make the exclusion structural instead of enumerated — e.g. derive the check from route
*group* membership (a route reconstructed from a link that resolves under `(auth)` or
`(profile-setup)`) rather than a hand-maintained literal set, or at minimum add a code comment
+ a guarding test that fails loudly if a new file is added under either group without updating
`AUTH_FLOW_PATHS`.

### WR-04: The G-05-7 `reconstructDeepLinkRoute` fix is wired only into the one-shot cold-start capture/replay path — not verified against a deep link received while the app is already running and authenticated

**File:** `apps/mobile/app/_layout.tsx:103,131-144,232-253`
**Issue:**
`reconstructDeepLinkRoute` correctly fixes the authority-vs-path split for the custom
double-slash scheme (`festipal://f/:slug`), and its unit tests are solid. It is wired into the
`_layout.tsx` capture effect (lines 131-144), which stores into the `pending-destination.ts`
singleton. That singleton is only ever *consumed* by the redirect effect at lines 232-253, which
is itself guarded by `coldStartRedirectRef` (line 103) to run **at most once per app session**
(deliberately, to avoid hijacking normal tab navigation on a later logout/login cycle — see the
comment at lines 96-102). This means: a deep link tapped while the app is already running and
already past its first `'authenticated'` transition (e.g. the user backgrounds the app, then taps
a second `festipal://f/:slug` link, or taps one after already being logged in for a while) is
captured into `pendingDestination` but never replayed by this mechanism — `consumePendingDestination()`
is not called again for the remainder of the session. Whether this is actually a user-visible
regression depends on whether Expo Router's own built-in (React Navigation) linking resolution —
which fires independently of this app-level effect for any URL event, including warm ones — is
*also* subject to the same `new URL()` authority/path-splitting defect that motivated this fix in
the first place. That was not verified in this review (it would require an on-device/integration
check, out of reach for a static review), but the root-cause note in `lib/deep-link.ts` describes
the defect as a property of `Linking.parse()`/`new URL()` itself, which Expo Router's default
linking config also ultimately consumes.
**Fix:** Confirm (device test or reading Expo Router's linking-config source for this Expo SDK)
whether a warm, already-authenticated tap on `festipal://f/:slug` correctly lands on the festival
screen. If Expo Router's own resolution shares the same defect, either register a custom
`linking.getStateFromPath`/`subscribe` override using `reconstructDeepLinkRoute`, or explicitly
document in `deep-link.ts`/`_layout.tsx` that the fix is cold-start-only and why that is
sufficient.

## Info

### IN-01: `Segment` type is redeclared locally in `festivals.tsx` instead of imported from `lib/festivals-segment-request.ts`

**File:** `apps/mobile/app/(tabs)/festivals.tsx:25`, `apps/mobile/lib/festivals-segment-request.ts:14`
**Issue:** `festivals-segment-request.ts` already exports `export type Segment = 'meine' |
'alle';` for exactly this concept, and `festivals.tsx` imports `consumeFestivalsSegment` from
that same module — but instead of importing its `Segment` type too, `festivals.tsx:25` redeclares
an identical local `type Segment = 'meine' | 'alle';`. TypeScript's structural typing means this
compiles fine today (the two literal unions are identical), but it is a duplicate source of truth
for the same domain concept the codebase's own conventions (single source of truth, no
re-declared shapes — see `festival-queries.ts`'s doc comments elsewhere in this phase) explicitly
guard against. A future change to one (e.g. adding a third segment) will not raise a compile error
in the other file until their usages actually diverge, which is exactly the kind of silent drift
the project's Zod/contract conventions are designed to prevent.
**Fix:**
```ts
import { consumeFestivalsSegment, type Segment } from '../../lib/festivals-segment-request';
```
and delete the local `type Segment = 'meine' | 'alle';` declaration.

---

_Reviewed: 2026-08-09T16:50:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
