---
phase: 09-festival-navigation-shell
verified: 2026-08-14T10:35:00Z
status: human_needed
score: 12/14 must-haves verified
behavior_unverified: 2 # present + wired, runtime behavior not exercisable without device/native rebuild
overrides_applied: 0
behavior_unverified_items:
  - truth: "SC3 (client half): the Festival-Friends-Tab renders exactly the intersection with three independently-worded empty states decided by the GLOBAL list length (D-17)"
    test: "With three real accounts (OTP via Mailpit :8025): (1) no friends -> empty state 1, (2) friends but none saved -> empty state 2, (3) friend saves festival -> exactly one row, stranger never appears; tap row -> friend-detail shows content; stop API -> error + retry recovers"
    expected: "Three distinct texts for three distinct situations; no presence/location/distance/chat surface anywhere on the tab; Crew tile count equals list length"
    why_human: "No RN component-test harness in this project (STATE.md structural limitation) — computeViewState lives inline in the screen and cannot run under the node-env Vitest runner; the server half IS behaviorally proven (festival-friends-isolation.spec.ts re-run live, 8/8). WINDOWS.md #44/#45."
  - truth: "Cashless WebView sandbox at runtime: a cross-origin navigation is rejected silently and never opened externally (T-09-22, CR-01 sole-gate fix)"
    test: "After `npx expo run:android` from apps/mobile (native rebuild REQUIRED — react-native-webview is not in the installed APK): open the Cashless tile, tap a link to a foreign domain inside the page"
    expected: "Navigation does not happen in-page AND no external browser/app opens; offline shows error copy + in-place retry; blank-but-successful load leaves a reachable Back, never an endless spinner"
    why_human: "The origin-comparison callback is pure code (14 URL tests pass), but the library interplay (react-native-webview's whitelist/Linking.openURL branch that CR-01 neutralizes with originWhitelist=['*']) only exists at native runtime. WINDOWS.md #46."
human_verification:
  - test: "Placeholder tabs on device (WINDOWS #40 — 09-03 Task 2): open Aktivitaeten/Timetable/Lageplan in both color modes and EN locale; set max system font scale"
    expected: "Per-tab icon + heading + one sentence, three DIFFERENT precondition sentences (Timetable/Lageplan name the festival, Aktivitaeten names quiks); no spinner/badge/date promise; body scrolls instead of clipping at max font scale; EN strings render (no raw msgids)"
    why_human: "RN visual rendering + font-scale + locale behavior has no node-env equivalent; copy/structure/lint/lingui evidence is complete"
  - test: "AppHeader three states + auth boundary (WINDOWS #42 — 09-04 Task 2): all four global tabs, a festival, profil/friends-qr; log out, log back in with another account"
    expected: "Wordmark (dot in Beere) / festival name / push title + back arrow; home button leaves a cold-start-opened festival without exiting the app; Start-tab home tap is a visible no-op (no toast); avatar tap opens Profil (repeated taps do NOT stack copies — WR-02); NO header on welcome/email/code screens; after re-login the new account's avatar shows"
    why_human: "Header visibility derivation is unit-tested fail-closed (14 cases), but the visual states, logout hygiene and the cold-start non-dead-end need a device"
  - test: "No double header / clearance (WINDOWS #43 — 09-04 Task 3): every screen, notch + non-notch, max font scale, both color modes"
    expected: "No native title bar above the glass anywhere; content starts under the glass and scrolls behind it; festival name appears ONCE (header only, not on the Dashboard); header stays single-line with ellipsis"
    why_human: "headerShown:false coverage and useHeaderClearance() on all 11 screens + gate are grep-verified; the pixel result (notch geometry, font scale) is not"
  - test: "Festival-Friends-Tab with real accounts (WINDOWS #44 — 09-05 Task 2) — see behavior_unverified item 1"
    expected: "Three distinct empty states, intersection-only list, no presence/chat surface, tap-through to friend-detail with content, error + retry, Crew tile parity with list length, dark mode"
    why_human: "See behavior_unverified item 1"
  - test: "friends-find push-over (WINDOWS #45 — 09-05 Task 3): tap the 'Find friends' pill in each tab state; use search/requests/QR at the push position; go back"
    expected: "Pill present in every state; global Friends screen opens OVER the festival (no FloatingNav, back arrow + 'Friends' title); identical behavior at both positions; Back lands in the festival Friends tab; pill grows in height at max font scale, label never ellipsized"
    why_human: "Navigation-stack behavior across two mount positions of one screen is device-only truth"
  - test: "Cashless on device (WINDOWS #46 — 09-06 Task 2) — NATIVE REBUILD FIRST (`npx expo run:android` from apps/mobile, never repo root) — see behavior_unverified item 2"
    expected: "Festival WITH address: two tiles (Cashless brand-toned, arrow, NO number); WITHOUT address: exactly one tile, no inert substitute; full-bleed WebView under push header; cross-origin nav blocked in-page AND not opened externally; offline error + in-place retry; none of the four ADR-011-excluded elements"
    why_human: "See behavior_unverified item 2"
  - test: "Backstop truths (plan-declared `verification: backstop`): (a) five DE tab labels on the narrowest supported device width, (b) gate copy at max font scale not clipped, (c) blank-but-successful cashless page distinguishable from a hung load, (d) no page-title chrome anywhere"
    expected: "(a) five flex-1 columns hold with numberOfLines={1} ellipsize; (b) centered gate message fully readable; (c) empty frame with reachable Back, loading hint ends; (d) the embedded page's own title never appears in native chrome"
    why_human: "Explicitly declared non-inferable by the plans — device-only claims"
  - test: "Judgment-tier prohibitions (verification: manual) — human confirmation folded into the device checks above: NAV-02 honesty (no simulated surface), NAV-01 header privacy (no account data outside auth), FRND-07 privacy/safety (no presence signal, no chat entry), NAV-01 cashless safety (no payment element, no inert placeholder)"
    expected: "Each upheld on device as it is upheld in code (structural evidence strong: no fake data/spinner in placeholders; fail-closed header; PersonRow limited to profile/onPress/accessibilityLabel; no balance/booking/QR/browser chrome; hard tile omission)"
    why_human: "Manual-tier prohibitions get a NON-AUTHORITATIVE code-level verdict only; final resolution belongs to the end-of-phase human checkpoint"
---

# Phase 9: Festival Navigation Shell — Verification Report

**Phase Goal:** Inside a festival there is a real five-tab bar, its two content tabs are honest placeholders, the Friends tab shows friends who saved this festival, and the global first tab is finally named `start` everywhere.
**Verified:** 2026-08-14
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | **SC1**: Entering a festival lands on a five-tab bar, every tab a real registered route | ✓ VERIFIED | `app/(festival)/f/[festivalSlug]/` contains exactly `_layout.tsx` + 5 route files; 5 `Tabs.Screen` declared in order `index/activities/friends/timetable/map`, `initialRouteName="index"`, `tabBar` = `<FloatingNav variant="festival" />` (`_layout.tsx:160-168`); user-run device UAT 09-03 round 2 passed all 8 points incl. all five tabs navigating |
| 2 | **SC2**: Timetable/Lageplan/Aktivitaeten are honest placeholders naming their real precondition; `SoonToast` stays the only coming-soon mechanism | ✓ VERIFIED | `PlaceholderScreen.tsx` owns no copy (`{icon, heading, body}` props); three tabs pass distinct copy (activities names quiks, timetable/map name the festival, no date/phase promise); grep: zero `useSoonToast`/`useQuery`/`apiClient` imports in the three tabs; `SoonToast` consumers unchanged (`mehr.tsx`, `profil.tsx`); `lingui compile --strict` green. On-device visual = human item #40 |
| 3 | **SC3**: Festival Friends tab shows exactly the intersection, never a presence signal | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED (client) / ✓ server proven | Server: `festival-friends-isolation.spec.ts` **re-run live by the verifier — 8/8 passed** (cross-tenant, stranger-view, field-absence, self-exclusion, no-oracle 404, 401). Client: `friends.tsx` wired (D-17 branching on `globalListQuery` length, `PersonRow` with only `profile/onPress/accessibilityLabel`, `sortFriendsByDisplayName`), but no RN harness exercises the screen — WINDOWS #44/#45 |
| 4 | **SC4**: First global tab is `start` in route, msgid and UI; existing deep links resolve | ✓ VERIFIED | `(tabs)/start.tsx` exists, `home.tsx` gone; `initialRouteName="start"` + `Tabs.Screen name="start"`; FloatingNav union/icon/guard/fallback/label all `start`; grep `'/home'` → zero matches; `msgid "Start"`/`msgstr "Start"` both catalogs, zero `msgid "Home"`; cold-start/root-redirect tests re-run pass; **user-verified 6-point device UAT (09-01)** incl. deep link + dev-client launches, no Unmatched-Route |
| 5 | SEC-02: the `friendship × my_festival` join is tenant-isolated, caller from session only | ✓ VERIFIED | Both scopes inside join conditions (`friendship.service.ts:582-597`); handler passes `session.user.id` + `params.festivalId` only; isolation spec re-run 8/8 |
| 6 | ADR-014: no `my_festival` value (timestamp/festivalId/visitorId) reaches the wire | ✓ VERIFIED | `select` = `...foreignProfileColumns` + `friendsSince` only; field-absence assertion in the spec ran and passed; `projection-uniqueness` invariant untouched |
| 7 | D-10 gate replaces the WHOLE area on 404/transport error — incl. unexpected success statuses (WR-01 fix) | ✓ VERIFIED | `festival-gate.ts:67-73` routes non-200/non-404 success into `showTransportError`; `_layout.tsx` renders NO `Tabs` in the `!showTabs` branch; `festival-gate.test.ts` incl. `success(500)`/`success(503)` cases **re-run, pass**; 404/transport paths device-verified in 09-03 round 2 |
| 8 | D-01: FloatingNav is ONE component with `variant: 'global' | 'festival'`, global call site unchanged | ✓ VERIFIED | `FloatingNav.tsx:130` `variant = 'global'` default; two item tables; no second tab-bar component in `components/` |
| 9 | One AppHeader, three states, fail-closed visibility — never over an unauthenticated screen | ✓ VERIFIED | `resolveHeaderContext` fail-closed (`app-chrome.ts`, `HEADER_HIDDEN_ROUTES` incl. `(auth)`/`(profile-setup)`/`index`/`friend-detail`); `app-chrome.test.ts` (incl. friends-find + cashless cases) **re-run, pass**; mounted once as `Stack` sibling (`_layout.tsx:570`); avatar tap uses `router.navigate` (WR-02 fix, `AppHeader.tsx:210`); shared `['me']` key + `BLUR_INTENSITY` import. Visual states = human items #42 |
| 10 | Native headers replaced app-wide; every screen holds header clearance; festival name lives once | ✓ VERIFIED | `headerShown: false` via `screenOptions` on `(tabs)`, `(festival)` stack, festival `Tabs`, and per-registration on `profil`/`friends-qr`/`friends-find`/`cashless`; `useHeaderClearance()` in all 11 screens + gate + cashless (grep, 13 files); Dashboard heading removed. Pixel truth = human item #43 |
| 11 | Cashless sandbox: HTTPS-only validation before the tile AND in the screen; sole-gate origin callback (CR-01 fix); no JS bridge | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED (runtime) | `resolveCashlessTarget` HTTPS-only, 14 behavior tests **re-run, pass**; `cashless.tsx:126` `originWhitelist={['*']}` with strict-origin `onShouldStartLoadWithRequest` as sole gate (CR-01, commit bd983a7), re-validates its own route param, no `injectedJavaScript`/`onMessage`. Runtime block behavior needs native rebuild + device — WINDOWS #46 |
| 12 | Cashless tile: hard omission without address, no value, the tab's one brand-toned surface | ✓ VERIFIED | `index.tsx:170` `{cashlessTarget ? <StatTile tone="brand" .../> : null}` — no else branch, no `value`/`note`; Crew tile stays `tone="default"` and always renders (D-11) |
| 13 | D-18: Crew tile and Friends list read ONE query key — the numbers cannot disagree | ✓ VERIFIED | `friendKeys.inFestival` defined once (`friend-queries.ts`), exactly two consumers (`index.tsx:88`, `friends.tsx:84`), same prefix as the friend-key family (invalidation coverage) |
| 14 | D-16: one Friends-screen implementation at two navigation positions | ✓ VERIFIED | `friends-find.tsx` is a pure `export { default } from './(tabs)/friends'` (no JSX); registered in the authenticated `Stack.Protected` block with `headerShown:false`; in `PUSH_SCREEN_ROUTES` + push-title map; pill rendered outside the `viewState` branching (`friends.tsx:207-220`, every state) |

**Score:** 12/14 truths verified (2 present, behavior-unverified — both device-only, tracked as WINDOWS #44–#46)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `apps/mobile/app/(tabs)/start.tsx` | renamed first global tab | ✓ VERIFIED | exists; `home.tsx` absent; wired via `_layout` + FloatingNav |
| `apps/mobile/app/(festival)/f/[festivalSlug]/_layout.tsx` | 5-tab navigator + D-10 gate | ✓ VERIFIED | gate branch renders no `Tabs`; `FestivalContextProvider`; single `festivalKeys.detail` query |
| `apps/mobile/app/(festival)/f/[festivalSlug]/{index,activities,friends,timetable,map}.tsx` | five real routes | ✓ VERIFIED | all present, substantive, registered |
| `apps/mobile/components/PlaceholderScreen.tsx` | shared honest empty state | ✓ VERIFIED | exports `PlaceholderScreen`/`PlaceholderScreenProps`; no owned copy; ScrollView `flexGrow:1` |
| `apps/mobile/components/FloatingNav.tsx` | parametrized bar | ✓ VERIFIED | `variant` prop, two item tables, `BLUR_INTENSITY` exported |
| `apps/mobile/components/AppHeader.tsx` | 3-state header + `useHeaderClearance` | ✓ VERIFIED | both exported; shared `['me']` + `festivalKeys.detail` keys; no `AvatarSunsetRing` import |
| `apps/mobile/lib/app-chrome.ts` | pure header derivation | ✓ VERIFIED | no react/expo-router import; `PUSH_SCREEN_ROUTES` = profil/friends-qr/friends-find/cashless |
| `apps/mobile/lib/festival-gate.ts` + `festival-context.ts` | pure gate + layout-owned context (blank-on-reentry fix) | ✓ VERIFIED | 11 gate tests pass incl. WR-01 cases; Dashboard reads context, zero own query |
| `apps/mobile/lib/cashless-url.ts` | pure HTTPS-only validator | ✓ VERIFIED | framework-free; 14 tests pass |
| `apps/mobile/app/cashless.tsx` | origin-locked WebView push screen | ✓ VERIFIED (code) | sole-gate callback (CR-01); re-validates route param; no bridge |
| `apps/mobile/components/StatTile.tsx` | Dashboard tile primitive | ✓ VERIFIED | `StatTile`/`StatTileProps` exported; no fixed `flexBasis`; View/Pressable per interactivity |
| `apps/mobile/app/friends-find.tsx` | re-export route | ✓ VERIFIED | pure re-export, registered |
| `packages/contracts/src/router.ts` | `friendsInFestival` entry | ✓ VERIFIED | UUID pathParam, `z.array(friendSchema)`, SEC-02 summary |
| `apps/api/src/friendship/friendship.{service,controller}.ts` | join + handler | ✓ VERIFIED | scopes inside join; session-only caller; no 404 oracle |
| `apps/api/test/festival-friends-isolation.spec.ts` | SEC-02 proof | ✓ VERIFIED | 10 `it` blocks; **re-run live: 8/8 pass** (2 grouped) |
| `packages/ui/src/tokens.ts` | `headerTitle`/`headerWordmark` roles | ✓ VERIFIED | tracked in `type-tracking.test.ts`; `fonts.ts` exhaustiveness extended |
| `apps/mobile/package.json` | `react-native-webview` | ✓ VERIFIED | 13.16.1, expo-install selected; legitimacy gate user-approved (09-06 checkpoint) |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `(tabs)/_layout.tsx` | `(tabs)/start.tsx` | `Tabs.Screen name` + `initialRouteName` | ✓ WIRED | both literal `"start"` |
| `lib/cold-start-redirect.ts` / `lib/festival-navigation.ts` | `/start` | href literals | ✓ WIRED | tests pin literals, re-run pass |
| festival `_layout.tsx` | `FloatingNav` | `tabBar` render prop, `variant="festival"` | ✓ WIRED | line 161 |
| festival `_layout.tsx` | `lib/festival-queries.ts` | `festivalKeys.detail(slug)` single gate query | ✓ WIRED | context replaces second observer (stricter than planned, blank-on-reentry fix c16369f) |
| placeholder tabs | `PlaceholderScreen` | caller-supplied icon/heading/body | ✓ WIRED | three distinct copy sets |
| `friendship.controller` | `friendship.service` | `session.user.id` + `params.festivalId` | ✓ WIRED | no client-supplied caller |
| contracts `friendsInFestival` | controller handler | `@TsRestHandler(contract.friendsInFestival)` | ✓ WIRED | line 132 |
| `service` | `visitor-projection.ts` | `foreignProfileColumns` + `pickForeignProfile` | ✓ WIRED | one projection, uniqueness invariant intact |
| Dashboard + Friends tab | `friendKeys.inFestival` | shared key | ✓ WIRED | exactly one definition, two consumers |
| Friends tab | `friends-find.tsx` | `router.push('/friends-find')`, pill in every state | ✓ WIRED | pill outside state branch |
| `friend-detail.tsx` | `friendKeys.inFestival(*)` cache | `getQueriesData` scope-filtered `list | inFestival` | ✓ WIRED | no second network call |
| Dashboard | `cashless.tsx` | `router.push({pathname:'/cashless', params:{uri}})` behind `resolveCashlessTarget` | ✓ WIRED | screen re-validates param |
| `_layout.tsx` | `AppHeader` | single mount, Stack sibling in authenticated tree | ✓ WIRED | line 570 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| Festival gate/tabs | `festival` | `apiClient.getFestival` → context | Yes | ✓ FLOWING |
| Friends tab list | `intersectionQuery` | `apiClient.friendsInFestival` (real DB join, live-proven) | Yes | ✓ FLOWING |
| Crew tile count | same cache entry | shared `friendKeys.inFestival` | Yes | ✓ FLOWING |
| AppHeader festival title | `festivalKeys.detail(slug)` | shared gate query | Yes | ✓ FLOWING |
| Placeholder tabs | none (by design) | no data source | N/A — NAV-02 mandates no fetch | ✓ (intentional) |
| Cashless WebView | `uri` route param | `festival.cashlessUrl` (server value), validated twice | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Gate branching incl. WR-01 500/503, cold-start/root redirect literals, header derivation, cashless URL validation | `pnpm exec vitest run` (5 named files, apps/mobile) | 58/58 pass, 268 ms | ✓ PASS |
| SEC-02 tenant isolation live vs. local Docker Postgres | `pnpm exec vitest run test/festival-friends-isolation.spec.ts` (apps/api) | 8/8 pass, 2.3 s | ✓ PASS |
| Device: five-tab bar, D-10 area replacement, blank-on-reentry regression | 09-03 Task 1 round-2 device UAT | user-verified 8/8 (2026-08-14) | ✓ PASS (human, prior) |
| Device: start rename, deep links, dev-client launches | 09-01 Task 2 device UAT | user-verified 6/6 | ✓ PASS (human, prior) |
| Remaining device checks | WINDOWS #40, #42–#46 | not run (native rebuild required for #46) | ? SKIP → human |

### Probe Execution

No probes declared or present (`scripts/*/tests/probe-*.sh` — none in this repo; plans/summaries reference none). SKIPPED.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| NAV-01 | 09-03, 09-04, 09-06 | five-tab bar inside a festival | ✓ SATISFIED | truths 1, 7–12; device visual polish pending (#42/#43/#46) |
| NAV-02 | 09-03 | honest placeholders naming preconditions | ✓ SATISFIED | truth 2; #40 pending |
| NAV-03 | 09-01 | first global tab is `start` everywhere | ✓ SATISFIED | truth 4, device-verified |
| FRND-07 | 09-02, 09-05 | intersection only, never presence | ✓ SATISFIED (server proven live) | truths 3, 5, 6, 13; client rendering pending #44/#45 |

No orphaned requirements: REQUIREMENTS.md maps exactly these four IDs to Phase 9.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | none | — | Zero TBD/FIXME/XXX/TODO/HACK markers in phase-modified files; the 09-03 interim stub (`friends.tsx` "This tab isn't built yet.") was replaced by 09-05 (WINDOWS #41 marked fixed, confirmed in code) |

**Code-review fixes verified in code (not taken from SUMMARY):** CR-01 `originWhitelist={['*']}` + sole-gate callback (`cashless.tsx:126-144`, bd983a7); WR-01 unexpected-status→transport-error (`festival-gate.ts:67-71` + 500/503 tests, c37a716); WR-02 `router.navigate('/profil')` (`AppHeader.tsx:210`, fec9fc8). All three commits present on the branch.

**Deliberately open (not a gap):** WR-03 — a transport error hides the tabs even with a warm cached festival, pinned by `festival-gate.test.ts` ("regardless of any cached hint") and matching 09-03's own must_have ("bei 404 oder Transportfehler gibt es keine Tableiste"). Conflicts with the offline-first principle long-term; recorded as a conscious product decision to re-make, not a phase-9 defect. Info findings IN-01…IN-05 were not applied (review policy: info not auto-applied); IN-05 (ambiguous contract summary prose) remains as worded.

### Human Verification Required

See frontmatter `human_verification` — 8 items. In short:

1. **#40** Placeholder-Tabs visuell (Copy je Tab, max. Schriftskalierung scrollt, EN-Locale)
2. **#42** AppHeader-Zustände, Logout-Hygiene, Cold-Start-Ausstieg, Avatar-Navigate (WR-02)
3. **#43** Kein Doppel-Header, Clearance auf allen Screens, Notch, Festivalname genau einmal
4. **#44** Friends-Tab mit drei echten Konten (drei Leerzustände, kein Präsenzsignal, Tap-Through, Fehler+Retry)
5. **#45** friends-find Push-over (Pille in jedem Zustand, Back landet im Festival-Tab)
6. **#46** Cashless am Gerät — **erst nach `npx expo run:android` aus `apps/mobile`** (react-native-webview fehlt im installierten APK)
7. Backstop-Truths (schmalste Breite × 5 Spalten, Gate-Copy bei max. Schrift, leere-aber-erfolgreiche Cashless-Seite, keine Titel-Chrome)
8. Judgment-Tier-Prohibitions (NAV-02-Ehrlichkeit, Header-Privacy, Präsenz/Chat-Verbot, Bezahl-Verbot) — Code-Evidenz stark, finale Bestätigung im Device-Durchlauf

### Gaps Summary

Keine Gaps. Alle vier Roadmap-Erfolgskriterien sind im Code nachweisbar erfüllt; die Backend-Hälfte von FRND-07 wurde vom Verifier live gegen die lokale Datenbank bewiesen (8/8), die drei Code-Review-Fixes sind im Code verifiziert, und es existieren weder Stubs noch Debt-Marker noch verwaiste Requirements. Was aussteht, ist ausschliesslich Geräte-Verifikation: sechs offene WINDOWS-Einträge (#40, #42–#46), die per Plan-Design (kein RN-Component-Harness) nur am Gerät prüfbar sind, plus die vier plan-deklarierten Backstop-Truths. Für #46 ist zuvor ein nativer Rebuild Pflicht. Zwei Truths bleiben deshalb PRESENT_BEHAVIOR_UNVERIFIED (Friends-Tab-Client-Rendering, Cashless-Sandbox-Laufzeitverhalten) — Code vorhanden und verdrahtet, Laufzeitverhalten ungeprüft.

---

_Verified: 2026-08-14T10:35:00Z_
_Verifier: Claude (gsd-verifier)_
