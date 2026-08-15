---
phase: 11-activities
reviewed: 2026-08-15T00:00:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - apps/mobile/app.json
  - apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/app/activity-create.tsx
  - apps/mobile/app/activity-detail.tsx
  - apps/mobile/components/ActivityCard.tsx
  - apps/mobile/components/AppHeader.tsx
  - apps/mobile/components/CapacityField.tsx
  - apps/mobile/components/Chip.tsx
  - apps/mobile/components/DayTimeField.tsx
  - apps/mobile/components/Input.tsx
  - apps/mobile/components/LocationCaptureBlock.tsx
  - apps/mobile/lib/__tests__/activity-form.test.ts
  - apps/mobile/lib/__tests__/activity-queries.test.ts
  - apps/mobile/lib/__tests__/app-chrome.test.ts
  - apps/mobile/lib/__tests__/festival-queries.test.ts
  - apps/mobile/lib/__tests__/festival-tab-naming.test.ts
  - apps/mobile/lib/__tests__/geo-link.test.ts
  - apps/mobile/lib/activity-form.ts
  - apps/mobile/lib/activity-queries.ts
  - apps/mobile/lib/app-chrome.ts
  - apps/mobile/lib/festival-queries.ts
  - apps/mobile/lib/geo-link.ts
  - apps/mobile/lib/use-activity-mutations.ts
  - apps/mobile/locales/de/messages.po
  - apps/mobile/locales/en/messages.po
  - apps/mobile/package.json
  - pnpm-workspace.yaml
findings:
  critical: 1
  warning: 7
  info: 5
  total: 13
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-08-15
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Reviewed the Activities UI slice (tab, detail, create/clone screens, four form
primitives, pure form/query/geo libs, tests, catalogs, config). The pure-lib layer
(`activity-form.ts`, `activity-queries.ts`, `geo-link.ts`) is solid and well-tested:
`buildRouteUri`'s type-only signature genuinely closes the T-11-01 injection surface,
the joinability priority order matches the contract, and both `.po` catalogs carry every
phase-11 msgid with real German translations (single empty `msgstr` per file is the PO
header). The `@react-native-community/datetimepicker` `onValueChange`/`onDismiss` usage
was verified against the installed 9.1.0 typings — `onValueChange` only fires on `set`
with a defined `Date`, so the dismissal path is safe. No secrets, debug artifacts,
`any`-casts or dangerous calls in the diff. app.json's expo-location plugin correctly
strips both background-permission strings (foreground-only requirement met).

One Critical defect breaks the phase's own core flow: the post-create navigation to the
detail screen drops the `festivalSlug` parameter, and the detail screen cannot resolve
its festival without it — a freshly created activity lands on a permanent "Loading…"
screen. Several Warnings cluster around error-state fidelity (404 rendered as a Wi-Fi
error, over-length input surfacing as a generic failure) and the location-capture
block's permission lifecycle.

## Critical Issues

### CR-01: Post-create navigation drops `festivalSlug` — detail screen can never load

**File:** `apps/mobile/app/activity-create.tsx:155`
**Issue:** The create mutation's success handler navigates with
`router.replace({ pathname: '/activity-detail', params: { activityId: created.id } })` —
no `festivalSlug`. `activity-detail.tsx` is a root-Stack sibling outside the
`(festival)` provider, so `useFestivalContext()` returns `undefined` there by
construction (its own comment says so), and its only other festival source is
`findCachedFestivalBySlug(queryClient, festivalSlug)`, which is skipped when the param
is empty (`activity-detail.tsx:113`). With `festival === undefined` the detail query is
permanently `enabled: false` (`activity-detail.tsx:123`), `detailQuery.status` stays
`'pending'`, and the user who just created an activity is stranded on an eternal
"Loading…" screen. The tab pushes (`activities.tsx:168`) and the clone push
(`activity-detail.tsx:355`) both forward the slug — only this replace forgets it. It
also poisons the chain: cloning from that broken detail screen forwards
`festivalSlug: ''` into an equally dead create form.
**Fix:**
```tsx
// activity-create.tsx onSuccess — festivalSlug (line 103) / festival.slug are in scope:
router.replace({
  pathname: '/activity-detail',
  params: { activityId: created.id, festivalSlug: festival?.slug ?? festivalSlug ?? '' },
});
```

## Warnings

### WR-01: Detail-screen 404 renders the network-error copy

**File:** `apps/mobile/app/activity-detail.tsx:190-196`
**Issue:** `unwrapOk` throws `ApiResponseError` carrying the real status, but the error
branch renders one string for everything: "Can't reach the server — make sure your
device is on the same Wi-Fi as the dev API." A 404 is a first-class, reachable state
here — the creator dissolves an activity while another participant has its detail open;
the mutation's `onSettled` invalidation refetches that participant's detail query and
gets 404 (`deleteActivity`/`getActivity` contract). Telling that user to check their
Wi-Fi is wrong and undermines the "visible state change" rationale the contract's
delete summary documents. `ApiResponseError.status` exists precisely so callers can
branch (its own doc comment says so).
**Fix:** Branch on `detailQuery.error instanceof ApiResponseError &&
detailQuery.error.status === 404` and render a dedicated "This activity no longer
exists" state (with a back affordance); keep the Wi-Fi copy for transport failures only.

### WR-02: Create form enforces none of the contract's length caps — over-length input dies as a generic "Couldn't save"

**File:** `apps/mobile/app/activity-create.tsx:218, 252, 255-261` (and `263-268` via `LocationCaptureBlock.tsx:132`)
**Issue:** `createActivityBodySchema` caps `title` at 80, `subtitle` at 120,
`description` at 2000 and `location` at 200 (`packages/contracts/src/schemas.ts:114-117`).
The `Input` component supports `maxLength` (`Input.tsx:73`), but no call site in the
create form passes it. ts-rest does not validate the body client-side, so an 81-char
title round-trips to the server, is rejected, and surfaces only as the generic
"Couldn't save — try again." with no indication which field is at fault or why. The
repo's own precedent (`complete-profile.tsx` `USERNAME_MAX`/`DISPLAY_NAME_MAX` etc.)
passes the server caps as `maxLength`.
**Fix:** Mirror the contract caps: `maxLength={80}` (title), `120` (subtitle), `2000`
(description), `200` (meeting-point free text — add a `maxLength` prop pass-through to
`LocationCaptureBlock`). Prefer named constants referencing the schema values.

### WR-03: Seat line reads "1 are in · no limit" in the most common state

**File:** `apps/mobile/app/activity-detail.tsx:288-291`
**Issue:** `t\`${participantCount} are in · no limit\`` is not plural-safe. Every fresh
activity has `participantCount === 1` (creator auto-joins in the create transaction,
D-07) and unlimited capacity is the default (D-08), so the single most common detail
view renders ungrammatical English ("1 are in · no limit") and German ("1 sind dabei ·
ohne Limit"). `ActivityCard.tsx:81` already solves the identical fact with an ICU
plural (`{participantCount, plural, one {# is in} other {# are in}}`). The code comment
pins this to D-03 ("exact catalog strings, not an ICU plural") — but the D-03 pivot
argument covers the limited/unlimited split, not the count's own grammar; the
no-limit variant can be an ICU plural without touching that split.
**Fix:** `plural(participantCount, { one: '# is in · no limit', other: '# are in · no limit' })`
(and regenerate catalogs); if D-03 is read as forbidding this, escalate the copy
decision rather than shipping "1 are in".

### WR-04: Location permission dialog fires on form mount, not on the "Pin location" tap

**File:** `apps/mobile/components/LocationCaptureBlock.tsx:82-91`
**Issue:** The effect calls `requestPermission()` as soon as the hook reports a
non-granted status — i.e. the OS location dialog appears the moment the create form
opens, before the user has shown any interest in pinning a point. Location is optional
on this form (the free-text field is the primary input). Consequences: (a) every
visitor pays the interruption on their first create, mid-typing; (b) a reflexive "Deny"
at that uncontextual moment permanently buries the capture affordance behind the
Settings round-trip; (c) prompting without a user gesture at the point of need is the
pattern Apple's review guidelines and HIG explicitly discourage. The CameraScanPanel
precedent this copies prompts on mount too, but that panel's sole purpose is scanning —
the analogy doesn't carry to an optional sub-field.
**Fix:** Keep the hook read on mount, but move the `requestPermission()` call into
`handleCapturePress` (request → if granted, capture in the same flow). The `pending`
sub-state machinery already covers the in-flight dialog.

### WR-05: Denied-permission callout never recovers after a grant in Settings

**File:** `apps/mobile/components/LocationCaptureBlock.tsx:78-98, 194-203`
**Issue:** `Location.useForegroundPermissions()` reads the status on mount and after
the component's own `requestPermission()` call — it does not re-read when the app
returns to the foreground. On iOS, granting location in Settings does not restart the
app, so a visitor who taps "Open Settings", grants access and returns still sees the
"Location unavailable" callout; the pin button never appears until the screen is
remounted. (Android masks this by killing the process on a permission change.)
**Fix:** On the callout path, re-check on foreground: subscribe to
`AppState` `'active'` and call the hook's `getPermission` (third tuple element of
`useForegroundPermissions`) — or at minimum re-check inside the "Open Settings" press
handler's return path.

### WR-06: `void Linking.openURL(...)` — unhandled rejection when no maps handler exists

**File:** `apps/mobile/app/activity-detail.tsx:367` (also `LocationCaptureBlock.tsx:196`)
**Issue:** `Linking.openURL` rejects when no installed app handles the URI. `geo:` has
no guaranteed handler on Android (devices without any maps app, some emulators/custom
ROMs), and the rejection is discarded with `void`, producing an unhandled promise
rejection and — worse — a button that silently does nothing with no feedback. The
`openSettings()` call at `LocationCaptureBlock.tsx:196` has the same shape but a
platform-guaranteed handler, so it is only the pattern, not a live path.
**Fix:**
```tsx
void Linking.openURL(buildRouteUri(activity.geo, platform)).catch(() => {
  // surface the existing "Couldn't save"-class inline error, or a dedicated
  // "No maps app available" line — not silence
});
```

### WR-07: Create form with an unresolved festival is a silent dead end

**File:** `apps/mobile/app/activity-create.tsx:107, 179-193, 270-279`
**Issue:** When `festival` resolves to `undefined` (cache miss on the slug, empty slug —
reachable today via CR-01's broken clone chain, and via any future process-restore onto
this route), the screen still renders the full form: title, description, location and
capacity are all editable, the day block shows "Festival dates aren't set yet", and
"Post it" can never succeed — `canSubmitActivity` blocks on the unselectable day, and
even if it passed, `handleSubmit`'s `if (!festival ...) return` swallows the tap with
no feedback of any kind. The user fills in a form that was never submittable and gets
"Choose a day." as the only, misleading explanation.
**Fix:** Treat `festival === undefined` as a screen-level state: render a short
unavailable/error message with a back affordance instead of the form (mirroring the
detail screen's own error branch), rather than a fully interactive dead end.

## Info

### IN-01: Creator briefly sees Join/Leave until `['me']` resolves

**File:** `apps/mobile/app/activity-detail.tsx:131-136, 448-488`
**Issue:** `isCreator` is `false` while `meQuery` is pending, so a creator with a cold
`['me']` cache momentarily sees "Leave" (they are a participant) instead of "Dissolve";
tapping it in that window yields the creator-only leave 409 and the generic error copy.
The cache is warm in practice (AppHeader queries the same key), so this is a narrow
window.
**Fix:** Gate the actions block on `meQuery.isSuccess` (render nothing or a dampened
placeholder until the fork is decidable).

### IN-02: Remove-chip a11y label announces "Location pinned", not a removal action

**File:** `apps/mobile/components/LocationCaptureBlock.tsx:165`
**Issue:** `Chip`'s remove tap area falls back to the chip label when
`removeAccessibilityLabel` is unset (`Chip.tsx:67`), so a screen reader announces the
remove button as "Location pinned — button", indistinguishable from the chip itself.
**Fix:** Pass `removeAccessibilityLabel={t\`Remove pinned location\`}`.

### IN-03: `failedTargetId` doc contract vs. implementation

**File:** `apps/mobile/lib/use-activity-mutations.ts:77, 117-121`
**Issue:** The doc comment says the failure is "cleared on the next attempt for that
target", but `onMutate` clears `failedTargetId`/`failedTargetStatus` unconditionally
for any target. Harmless today (each screen drives one target at a time), but a future
screen hosting two targets would silently lose an unrelated failure indicator.
**Fix:** Either clear only when `variables.targetId === failedTargetId` matches the
stated contract, or reword the doc to "cleared when any next mutation starts".

### IN-04: Supply-chain age-gate bypass pinned for expo-location

**File:** `pnpm-workspace.yaml:18-19`
**Issue:** `minimumReleaseAgeExclude: expo-location@57.0.10` bypasses the release-age
guard for that exact version. Acceptable (exact pin, needed this phase), but it should
be removed once the version ages past the window so the exclusion list doesn't accrete.
**Fix:** Add a dated removal note or drop the entry after the release-age window passes.

### IN-05: Test fixture violates the D-07 domain invariant

**File:** `apps/mobile/lib/__tests__/activity-form.test.ts:149-151`
**Issue:** The `activityDetail` fixture defaults to `participantCount: 1` with
`participants: []` — a state D-07 makes impossible (the creator is always a
participant). `resolveJoinability` never reads `participants`, so nothing breaks, but
invariant-violating fixtures can mask assumptions in future tests built on them.
**Fix:** Default `participants` to one creator entry, or add a comment stating the
field is irrelevant to these tests.

---

_Reviewed: 2026-08-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
