---
status: complete
phase: 05-festival-selection-home
source: [05-08-PLAN.md]
started: 2026-08-06T13:05:32.673Z
updated: 2026-08-09T13:51:11.699Z
---

## Current Test

[testing complete]

## Tests

### 1. Login lands on Home (hero + rail or empty state)
expected: After login the app lands on the Home tab (initialRouteName=home) showing the "Dein nächstes Festival" hero + "Meine Festivals" rail (or, with zero saved festivals, the shared empty-state block).
result: pass

### 2. Empty-state/see-all CTA opens Festivals on Alle
expected: From the empty-state CTA (or the rail's "Alle" see-all) the Festivals tab OPENS on the Alle segment (segment=all param), not Meine.
result: issue
reported: "funktioniert beim ersten mal wenn man die app startet. Wenn man aber beim Festivals Tab, auf Meine wechselt, und dann zurück zum Start Tab geht, und von dort aus wieder auf \"Alle Festivals ansehen\" klickt, kommt man auf den Festivals Tab und das Meine Segment."
severity: major

### 3. Save exactly-once, persists, rolls back on forced failure, recovers
expected: In Alle, rapid-double-tap Save on an unsaved festival results in only one request, it flips to 'Gespeichert', and appears exactly once under Meine. Force-quit + relaunch with the API reachable -> it remains under Meine (server persistence, FEST-03). A different unsaved festival, saved while the API is made unreachable for that attempt, has its optimistic insert roll back from Meine with a visible localized error. Restoring the API and retrying/refetching recovers the screen before continuing.
result: pass
source: manual (save-once + persistence) + code-review (rollback + recovery)
note: "User manually confirmed save-exactly-once and persistence after relaunch. Rollback-on-forced-failure and recovery could not be tested on-device; verified by code review of festivals.tsx saveMutation (onMutate dedupe, unwrapOk throw-on-non-200 -> onError fires, WR-01 current-cache reconcile removes only this call's optimistic insert, onSettled invalidate refetches server truth, mine-query error state offers Retry). Logic is correct as specified."

### 4. Enter a festival, Back returns to shell
expected: Entering a festival shows its name (H1) + locale-formatted "{dates} · {place}" + the four disabled coming-soon tiles; Back returns to the Festivals tab (never a dead-end).
result: pass

### 5. Cold-start into a festival, Back lands on Festivals tab
expected: Entering a festival, force-quitting, and relaunching opens the festival home directly; Back from it lands on the Festivals tab (leaveFestival shell fallback), never exits the app.
result: issue
reported: "funktioniert. Ich will aber, dass man bei Back nach einem Start und Launch auf dem Festival Home Screen, nicht auf den Festivals sondern auf den Start Tab kommt. Pass das bitte an. Außerdem ist mir aufgefallen dass man auf dem Festival Home Screen landet, wenn man es vor dem Restart geöffnet hat, auch wenn man es nicht gespeichert hat. Das macht eigentlich keinen Sinn. Man soll also nur wieder auf Festival Home landen, wenn man das Festival auch gespeichert hat."
severity: major
note: "Test passed as originally specified; these are two intentional behavior-change requests, tracked as gaps G-05-5a and G-05-5b."

### 6. Cross-account hygiene after logout
expected: Logging out and logging in as a DIFFERENT account on the same device starts on Home, NOT the prior account's festival (active-festival slug cleared on logout).
result: pass

### 7. Deep-link precedence over persisted active-festival slug
expected: With account B's active slug A persisted (via prior enter, not cleared by normal logout), invalidating/revoking its session externally, then cold-launching a logged-out deep link to a DIFFERENT known /f/:slugB and completing auth, results in slugB opening -- proving the captured deep link is replayed after auth and wins over the persisted slug A. No festival screen is accessible before authentication completes.
result: issue
reported: "nach der eingabe des login codes komme ich auf Unmatched Route, Page could not be found, festipal:/// (deep link festipal://f/nova-sound-2026 opened while logged out, session externally revoked, slug A=frequency-2026 persisted)."
severity: major
note: "Test command used the double-slash custom-scheme form festipal://f/<slug>. Since app.json configures ONLY the custom scheme (no https App Links / Universal Links), this is the standard/only real deep-link form and it is genuinely broken — not merely a bad test command. FOLLOW-UP RETRY with the triple-slash form festipal:///f/nova-sound-2026 (logged-out start, session revoked, slug A=frequency-2026 persisted): CONFIRMED WORKING — auth gate shown first, then nova-sound-2026 opened, winning over the persisted slug A. So the precedence logic itself is correct; only the parser (G-05-7) needs the hostname fix. However, a SECOND launch — app closed, then festipal:///f/nova-sound-2026 fired again while ALREADY authenticated — opened frequency-2026 (the persisted slug), NOT the deep-link target. New distinct bug tracked as G-05-7b."

### 8. DE/EN date re-formatting + null-date fallback + disabled-tab a11y
expected: After relaunching following a device-language change DE<->EN, the normal-date and null-date fixtures re-format their date range via Intl (null shows the localized fallback). With TalkBack enabled, the disabled Friends and Profil items are focusable, cannot navigate, and announce a localized "coming soon"/"bald verfügbar" accessibility label.
result: pass
source: manual (DE<->EN date re-formatting) + code-review (null-date fallback + TalkBack a11y)
note: "User confirmed device language switch DE<->EN re-formats dates. Null-date fallback verified by code review of lib/date-range.ts (formatDateRange returns localized 'Termin folgt'/'Dates TBA' on null/empty/malformed either side, local parse, Hermes-safe). Disabled-tab a11y verified in components/FloatingNav.tsx DisabledNavItem (disabled prop + accessibilityRole=button + accessibilityState.disabled + accessibilityLabel '{label} — {coming soon}'); DE catalog apps/mobile/locales/de/messages.po confirmed non-empty: 'coming soon'->'bald verfügbar', 'Friends'->'Freunde', 'Profile'->'Profil', 'Home'->'Start'. Matches expected."

## Summary

total: 8
passed: 5
issues: 3
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-05-2
  truth: "From the empty-state CTA (or the rail's 'Alle' see-all) the Festivals tab OPENS on the Alle segment (segment=all param), not Meine."
  status: failed
  reason: "User reported: works on first app start, but after switching to the Meine segment in the Festivals tab, returning to the Start/Home tab and tapping 'Alle Festivals ansehen' again lands on the Festivals tab's Meine segment instead of Alle."
  severity: major
  test: 2
  root_cause: "apps/mobile/app/(tabs)/festivals.tsx:74-76 — the re-sync `useEffect(() => setSegment(normalizedParam), [normalizedParam])` only re-fires when the derived param VALUE changes. The Home CTA always navigates to the same `/festivals?segment=all`, so on the second navigation `normalizedParam` is still 'alle' (unchanged), the effect does not run, and setSegment('alle') is never called. Because the Festivals tab stays mounted across bottom-tab switches (expo-router tabs), the manually-set segment='meine' state from step 2 survives. Net: re-navigating with an unchanged param cannot override a manual segment switch."
  artifacts: ["apps/mobile/app/(tabs)/festivals.tsx:65-76"]
  missing: ["A re-sync mechanism that fires on every CTA navigation even when the segment param value is unchanged (e.g. a per-navigation nonce param consumed on change, or a useFocusEffect that applies an explicit segment param once per focus without clobbering manual taps on plain tab-bar focus)."]

- gap_id: G-05-5a
  truth: "Back from a cold-start-launched Festival Home Screen (no in-app history) should land on the Start/Home tab, not the Festivals tab."
  status: failed
  reason: "User change request: after a relaunch that restores the festival home, Back should go to the Start (Home) tab instead of the Festivals tab."
  severity: minor
  test: 5
  root_cause: "apps/mobile/lib/festival-navigation.ts:15-21 — leaveFestival()'s no-history fallback is router.replace('/festivals'). It should target the Home/Start tab route for the cold-start case. The router.canGoBack() -> router.back() branch (normal push-entry from the Festivals tab) is unaffected and stays correct."
  artifacts: ["apps/mobile/lib/festival-navigation.ts:15-21", "apps/mobile/app/(festival)/f/[festivalSlug].tsx:117", "apps/mobile/app/(tabs)/_layout.tsx (home route)"]
  missing: ["Change the leaveFestival fallback target from '/festivals' to the Home tab route ('/home'). Confirm the correct typed route literal for the home tab."]

- gap_id: G-05-5b
  truth: "On cold-start, the app should re-open a festival's home ONLY if that festival is saved (in Meine); an entered-but-unsaved festival must not be restored — the app should land on the Start/Home tab instead."
  status: failed
  reason: "User change request: relaunching after merely entering (not saving) a festival currently re-opens that festival home, which the user finds nonsensical; restore should be gated on saved-state."
  severity: major
  test: 5
  root_cause: "apps/mobile/app/(tabs)/festivals.tsx:209 and app/(tabs)/home.tsx:79 persist the active-festival slug on EVERY gate-less enter regardless of saved-state; app/_layout.tsx:220-223 then reads that slug on cold-start and router.replace('/f/:slug') unconditionally. So an entered-but-unsaved festival is restored on relaunch."
  artifacts: ["apps/mobile/app/_layout.tsx:206-227", "apps/mobile/app/(tabs)/festivals.tsx:198-211", "apps/mobile/app/(tabs)/home.tsx:79", "apps/mobile/lib/active-festival-storage.ts"]
  missing: ["Gate the cold-start restore on saved membership. Two candidate approaches for planner to decide (product intent is fixed: restore only saved festivals): (a) persist the active slug only when the festival is saved (write in the save mutation's success path; enter alone does not persist) — keeps cold-start read synchronous; or (b) keep persist-on-enter but, at cold-start, only replace to /f/:slug when the slug is in the user's saved festivals (requires awaiting listMyFestivals before the redirect). Recommended default: (b) as most faithful to 'restore only if saved', unless the added cold-start async is undesirable, in which case (a). Note: no unsave UI exists in this phase yet."]

- gap_id: G-05-7
  truth: "A logged-out custom-scheme deep link festipal://f/:slug is captured and, after auth completes, replayed to open that festival's home (D-02 SC-5 deep-link return-to)."
  status: failed
  reason: "User reported: after entering the login code following a festipal://f/nova-sound-2026 deep link (opened logged-out), the app lands on 'Unmatched Route / Page could not be found (festipal:///)' instead of opening the festival."
  severity: major
  test: 7
  root_cause: "apps/mobile/app/_layout.tsx:110-118 captures deep links via `const { path } = Linking.parse(linkingUrl)` and IGNORES the parsed `hostname`. expo-linking@57 parse uses `new URL()`, so a custom-scheme link with the standard double-slash authority form `festipal://f/nova-sound-2026` parses to hostname='f', path='nova-sound-2026' (the `f/` segment becomes the URL authority/hostname). The capture keeps only path -> captures '/nova-sound-2026' -> after auth `router.replace('/nova-sound-2026')` -> no such route -> Unmatched Route. app.json configures ONLY the custom scheme (no Android App Links / iOS Universal Links), so festipal://f/:slug is the sole real deep-link form and it is entirely broken. Verified: the triple-slash form festipal:///f/:slug parses to hostname='' path='f/nova-sound-2026' and would resolve correctly, confirming the hostname-drop is the exact cause."
  artifacts: ["apps/mobile/app/_layout.tsx:110-118", "apps/mobile/app.json (scheme only; no intentFilters/associatedDomains)", "node_modules/expo-linking/build/createURL.js:122-166 (parse uses new URL())"]
  missing: ["In the capture effect, reconstruct the full route from BOTH hostname and path for the app's own custom scheme, e.g. rejoin `[parsed.hostname, parsed.path].filter(Boolean).join('/')` — but ONLY for the custom scheme (parsed.scheme === app scheme), NOT for https links where hostname is the domain and must not be prepended. Then apply the existing AUTH_FLOW_PATHS guard to the reconstructed path. Add a unit test over Linking.parse output for festipal://f/:slug, festipal:///f/:slug, and (future) https://<domain>/f/:slug to lock the behavior. Optionally configure real Android App Links / iOS Universal Links in a later phase."]

- gap_id: G-05-7b
  truth: "A deep link festipal:///f/:slug fired while the user is ALREADY authenticated opens that festival, not the persisted active-festival slug."
  status: failed
  reason: "User reported: after a confirmed-working logged-out deep link into nova-sound-2026, closing the app and re-firing festipal:///f/nova-sound-2026 while already logged in opened frequency-2026 (the persisted slug) instead of nova-sound-2026."
  severity: major
  test: 7
  root_cause: "apps/mobile/app/_layout.tsx:111-118 — the deep-link capture effect is gated `authState.status !== 'unauthenticated'` and returns early, so an incoming link is NEVER captured when the user is already authenticated. On that authenticated cold start the redirect effect (app/_layout.tsx:206-227) runs, gets null from consumePendingDestination(), falls through to getActiveFestivalSlug() (still frequency-2026 — deep-linking into nova-sound never re-persisted the active slug), and router.replace('/f/frequency-2026'), clobbering expo-router's native navigation to the deep-link target. Net: an authenticated deep link is ignored and the persisted slug wins."
  artifacts: ["apps/mobile/app/_layout.tsx:110-118", "apps/mobile/app/_layout.tsx:206-227"]
  missing: ["Honor an incoming deep link regardless of auth status. Capture the pending destination even when authenticated (or, in the cold-start redirect, when a festival linkingUrl is present, do NOT override it with the persisted-slug replace — let the deep link/expo-router navigation stand and only apply the persisted-slug fallback when there is no incoming link). Ensure deep-link destination takes precedence over the persisted active-festival slug in the authenticated cold-start path too, mirroring the already-correct unauthenticated precedence. Consider whether opening a festival (enter or deep link) should update the persisted active slug consistently. Coordinate with G-05-5b (persisted-slug restore gating) and G-05-7 (hostname parse fix)."]
