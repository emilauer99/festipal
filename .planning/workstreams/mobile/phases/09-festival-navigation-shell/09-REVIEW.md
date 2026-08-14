---
phase: 09-festival-navigation-shell
reviewed: 2026-08-14T00:00:00Z
depth: standard
files_reviewed: 46
files_reviewed_list:
  - apps/api/src/friendship/friendship.controller.ts
  - apps/api/src/friendship/friendship.service.ts
  - apps/api/test/festival-friends-isolation.spec.ts
  - apps/mobile/app/(festival)/_layout.tsx
  - apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx
  - apps/mobile/app/(festival)/f/[festivalSlug]/activities.tsx
  - apps/mobile/app/(festival)/f/[festivalSlug]/friends.tsx
  - apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx
  - apps/mobile/app/(festival)/f/[festivalSlug]/map.tsx
  - apps/mobile/app/(festival)/f/[festivalSlug]/timetable.tsx
  - apps/mobile/app/(tabs)/_layout.tsx
  - apps/mobile/app/(tabs)/festivals.tsx
  - apps/mobile/app/(tabs)/friends.tsx
  - apps/mobile/app/(tabs)/mehr.tsx
  - apps/mobile/app/(tabs)/start.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/app/cashless.tsx
  - apps/mobile/app/friend-detail.tsx
  - apps/mobile/app/friends-find.tsx
  - apps/mobile/app/friends-qr.tsx
  - apps/mobile/app/profil.tsx
  - apps/mobile/components/AppHeader.tsx
  - apps/mobile/components/FloatingNav.tsx
  - apps/mobile/components/PlaceholderScreen.tsx
  - apps/mobile/components/StatTile.tsx
  - apps/mobile/lib/__tests__/app-chrome.test.ts
  - apps/mobile/lib/__tests__/cashless-url.test.ts
  - apps/mobile/lib/__tests__/cold-start-redirect.test.ts
  - apps/mobile/lib/__tests__/festival-gate.test.ts
  - apps/mobile/lib/__tests__/fonts.test.ts
  - apps/mobile/lib/__tests__/root-redirect.test.ts
  - apps/mobile/lib/__tests__/type-tracking.test.ts
  - apps/mobile/lib/app-chrome.ts
  - apps/mobile/lib/cashless-url.ts
  - apps/mobile/lib/cold-start-redirect.ts
  - apps/mobile/lib/festival-context.ts
  - apps/mobile/lib/festival-gate.ts
  - apps/mobile/lib/festival-navigation.ts
  - apps/mobile/lib/festival-queries.ts
  - apps/mobile/lib/fonts.ts
  - apps/mobile/lib/friend-queries.ts
  - apps/mobile/locales/de/messages.po
  - apps/mobile/locales/en/messages.po
  - apps/mobile/package.json
  - packages/contracts/src/router.ts
  - packages/ui/src/tokens.ts
findings:
  critical: 1
  warning: 3
  info: 5
  total: 9
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-08-14
**Depth:** standard
**Files Reviewed:** 46
**Status:** issues_found

## Summary

Reviewed the full Phase 9 (festival-navigation-shell) surface: the new `GET /festivals/:festivalId/friends` backend path with its SEC-02 isolation spec, the five-tab festival navigator and its layout-level gate (`lib/festival-gate.ts` + `lib/festival-context.ts`), the app-wide `AppHeader` with `resolveHeaderContext`/`useHeaderClearance`, the festival friends tab + `StatTile`, the start-tab rename plumbing, and the Cashless WebView (ADR-011).

The backend work is clean: `listFriendsInFestival` carries both scopes (`callerId` from the session, `festivalId` from the path) inside the join conditions, selects zero `my_festival` columns, and the eight-case isolation spec proves cross-tenant separation, projection discipline, and the no-oracle 404 posture. The header-context derivation is fail-closed (no default-visible branch) and well tested. The gate extraction into a pure function with a single context consumer is a sound fix for the dual-observer blank-screen bug.

Two findings matter. First, the Cashless WebView's documented sandbox invariant ("rejected, never opened externally", T-09-22) is not what the code does: I verified against the installed `react-native-webview@13.16.1` that a navigation failing `originWhitelist` is handed to `Linking.openURL` — opened in the external browser or any app registered for the scheme — and the custom `onShouldStartLoadWithRequest` never runs for it. Second, the festival gate has an unhandled response class (success with a status that is neither 200 nor 404, e.g. a 500) that renders a permanently blank screen with no message and no retry when the cache is cold — exactly the failure mode this phase's gate rewrite exists to prevent.

## Critical Issues

### CR-01: Cashless origin lock does not block cross-origin navigations — it opens them in the external browser

**File:** `apps/mobile/app/cashless.tsx:114-128`
**Issue:** The screen's comment states the sandbox contract: "any in-page navigation attempt whose origin differs from the configured one is rejected, never opened externally" (T-09-22). That is not the library's behavior. Verified in the installed `react-native-webview@13.16.1` (`lib/WebViewShared.js`, `createOnShouldStartLoadWithRequest`): the whitelist check runs FIRST, and a URL that fails `originWhitelist` triggers `Linking.canOpenURL(url).then(... Linking.openURL(url))` — the URL is opened externally — and the user-supplied `onShouldStartLoadWithRequest` is only ever invoked for URLs that PASS the whitelist (the `else if` branch):

```js
if (!passesWhitelist(compileWhitelist(originWhitelist), url)) {
  Linking.canOpenURL(url).then((supported) => { if (supported) return Linking.openURL(url); ... });
  shouldStart = false;
} else if (onShouldStartLoadWithRequest) {
  shouldStart = onShouldStartLoadWithRequest(nativeEvent);
}
```

With `originWhitelist={[target.origin]}`, every cross-origin navigation the cashless page performs (link tap, JS redirect, `location` assignment) is therefore forwarded to the OS. Page content — a compromised or malicious cashless provider page — thereby controls external URL launches from inside the app: arbitrary `https:` URLs in the system browser (phishing outside the WebView frame), and any custom scheme some installed app answers `canOpenURL` for, **including the app's own `quiks:` scheme** (a page-driven re-entry into the app's deep-link handling — a channel `app/_layout.tsx`'s capture path never anticipated as page-triggerable). The carefully written strict-origin callback — which WOULD silently block — is dead code for exactly the URLs it exists to reject. (Note the callback is still load-bearing for one case: the library's whitelist regex is un-anchored at the end — `^https://pay\.example\.com` — so `https://pay.example.com.evil.com` PASSES the whitelist and only the callback's strict `URL.origin` equality stops it. Both mechanisms are needed, but they currently compose to "block prefix-spoofs, externally open everything else".)
**Fix:** Make the callback the sole gate by passing a whitelist that everything passes, so a `false` return blocks without any external open:
```tsx
originWhitelist={['*']}
onShouldStartLoadWithRequest={(request: ShouldStartLoadRequest) => {
  try {
    return new URL(request.url).origin === new URL(target.origin).origin;
  } catch {
    return false;
  }
}}
```
`compileWhitelist(['*'])` compiles to `^.*`, so the library's external-open branch becomes unreachable and the existing strict-origin check (which already handles `about:blank` and unparsable URLs by returning `false`) does all rejection silently. Update the T-09-22 comments to name `originWhitelist={['*']}` as deliberate — a future reader will otherwise "fix" it back. Residual caveat worth a comment: on Android, `shouldOverrideUrlLoading` is not invoked for POST navigations, a documented platform limitation shared by both mechanisms.

## Warnings

### WR-01: Festival gate renders a permanently blank screen for a non-200/non-404 response with a cold cache

**File:** `apps/mobile/lib/festival-gate.ts:55-64` (rendered by `apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx:104-153`)
**Issue:** The derivation handles exactly three query outcomes: pending, transport error, and success with 200/404. A success whose status is anything else — a 500/502/503 from the API or a proxy — is a SUCCESSFUL React Query result (`apps/mobile/lib/api-client.ts` sets no `throwOnUnknownStatus`, so ts-rest resolves unknown statuses), and for it every flag comes out false when no `cachedFestival` exists: `showLoading` false (not pending), `showTransportError` false (not `'error'`), `notFound`/`showNotFound` false (status ≠ 404), `showTabs` false (`festival` undefined). The layout's `!showTabs` branch then renders a `SafeAreaView` whose three conditional blocks are all `null` — a blank screen with no copy, no retry, and no way out except the header's home button. Every other screen in this phase branches `data.status !== 200` into an error state (`(festival)/friends.tsx:110`, `(tabs)/friends.tsx:227`, `start.tsx:79`); the gate — the single choke point for the whole festival area — is the one place that doesn't. `festival-gate.test.ts` has no case for it either.
**Fix:** Treat an unexpected success status as a transport-class failure so the existing error + Retry branch renders:
```ts
const unexpectedStatus =
  query.status === 'success' && query.data.status !== 200 && query.data.status !== 404;
const showTransportError = !missingSlug && (query.status === 'error' || unexpectedStatus);
```
(`showNotFound`/`showTabs` already compose correctly on top of `showTransportError`.) Add a `success(500)` case to `festival-gate.test.ts` pinning `showTransportError: true`.

### WR-02: AppHeader avatar stacks duplicate `/profil` screens on repeated taps

**File:** `apps/mobile/components/AppHeader.tsx:202-206`
**Issue:** The trailing avatar is always `router.push('/profil')`. The header is mounted over every visible state including the push state — so on the `/profil` screen itself, tapping the avatar pushes a SECOND `/profil` onto the root stack (and a third, and so on); the visitor then has to press Back once per accidental tap to unwind. The same applies from `friends-qr`/`friends-find`/`cashless`, where stacking `profil` on top is at least intended once, but repeated taps still accumulate copies — the exact duplicate-stacking problem `goToStartTab`'s comment (`lib/festival-navigation.ts:34-37`) documents `navigate`-over-`push` as the cure for.
**Fix:** Use `router.navigate('/profil')` instead of `push` (idempotent for the already-on-profil case), or short-circuit: `if (headerContext.kind === 'push' && headerContext.route === 'profil') return;`.

### WR-03: Transport error discards a warm cached festival — the festival area dead-ends offline despite having the data

**File:** `apps/mobile/lib/festival-gate.ts:62-64`
**Issue:** `showTransportError` fires on `query.status === 'error'` regardless of `cachedFestival`, and `showTabs` is suppressed by it. Entering a festival with no connectivity — the flagship festival-grounds scenario — therefore shows "Can't reach the server" and no tabs even when `findCachedFestivalBySlug` just produced the full `Festival` from the list caches. The same cached value IS trusted while the query is merely pending (`showTabs: true`, `_layout.tsx:69-91`), so the cache is deemed good enough to open the navigator during a refetch but not during a failure — the inconsistent direction. This conflicts with the workstream's non-negotiable offline-first principle ("map, timetable, ticket/wallet must work with no connectivity"; the CLAUDE.md architecture list). I note it is pinned deliberately by `festival-gate.test.ts:103-114` ("a transport error hides the Tabs, regardless of any cached hint"), so this is a decision to re-make consciously, not an accidental slip.
**Fix:** Prefer the cache on transport error: `const showTransportError = !missingSlug && query.status === 'error' && !cachedFestival;` (tabs render from cache; the refetch keeps retrying in the background). If the current behavior is confirmed as intended for this phase, record the offline-first exception in the phase docs and the test's name so it reads as a decision rather than a gap.

## Info

### IN-01: Crew StatTile's accessibility label omits the count

**File:** `apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx:188-196`
**Issue:** `accessibilityLabel={friendsHereLabel}` announces only "Friends here" — the value (`friendsHereValue`) and the "Nobody yet" note are visual-only, so a screen-reader user hears the tile's name but never the number that is its entire content.
**Fix:** Compose the label: `accessibilityLabel={friendsHereValue ? t\`${friendsHereLabel}: ${friendsHereValue}\` : friendsHereNote ? t\`${friendsHereLabel}: ${friendsHereNote}\` : friendsHereLabel}` (or accept `value`/`note` into `StatTile`'s own label composition).

### IN-02: Crew tile reports "Nobody yet" for a transport error

**File:** `apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx:112-127`
**Issue:** A failed or non-200 `friendsInFestival` collapses into the same "Nobody yet" note as a genuine 0-count — an error presented as a fact. The code comment documents this as a deliberate UI-SPEC decision (retry affordance lives on the Friends tab), so this is recorded for visibility, not as a defect: if the tile's number is meant to be trustworthy, an errored query should render neither value nor note (the same "show nothing while unsettled" treatment pending already gets).
**Fix:** Consider extending the pending branch: `const friendsInFestivalUnsettled = friendsInFestivalQuery.status === 'pending' || friendsHereCount === undefined;` and gate the note on that.

### IN-03: Strict same-origin lock will block legitimate PSP/3DS redirects inside the cashless page

**File:** `apps/mobile/app/cashless.tsx:114-128`, `apps/mobile/lib/cashless-url.ts`
**Issue:** Real cashless/payment top-up flows routinely redirect to a bank or PSP domain (3-D Secure) and back. Under the ADR-011 single-origin lock those hops are rejected (silently, once CR-01 is fixed), which can make the embedded page's own top-up flow un-completable. This is a deliberate consequence of ADR-011, not a bug — but it should be documented as a provider-onboarding constraint (the configured cashless URL's flow must stay same-origin), or ADR-011 amended to allow a per-festival origin allowlist rather than a single origin.
**Fix:** Document the constraint next to `cashlessUrl` in the admin-facing schema/docs; revisit if a partner provider's flow requires cross-origin hops.

### IN-04: `CashlessTarget.host` is dead — no consumer reads it

**File:** `apps/mobile/lib/cashless-url.ts:22-29,61-65`
**Issue:** The `host` field is documented as "used for the same-origin navigation guard", but both consumers (`cashless.tsx`, the Dashboard tile) use only `uri` and `origin`; the guard compares origins. The field and its doc comment describe a consumer that does not exist.
**Fix:** Drop `host` from `CashlessTarget` (and its test expectations), or correct the doc comment if a future consumer is genuinely planned.

### IN-05: `friendsInFestival` contract summary implies the caller must have saved the festival — the implementation does not require it

**File:** `packages/contracts/src/router.ts:186-193`; `apps/api/src/friendship/friendship.service.ts:582-603`
**Issue:** The summary reads "List the caller's own friends who ALSO saved this festival — the intersection of `listFriends` and `listMyFestivals(festivalId)`", which suggests the caller's own saved set is part of the intersection. The join requires only the COUNTERPART to have saved the festival — and isolation-spec case 2 explicitly pins that a caller who never saved festival B still sees friendB there. The behavior is deliberate (the service comment says "the COUNTERPART (not the caller)"); only the contract prose is ambiguous, and the contract is the single source of truth other clients read.
**Fix:** Reword the summary: "List the caller's friends who saved this festival (the caller need not have saved it themselves)".

---

_Reviewed: 2026-08-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
