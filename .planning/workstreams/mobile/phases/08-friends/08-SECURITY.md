---
phase: 08
slug: friends
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-08-13
---

# Phase 08 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register authored at plan time across `08-01-PLAN.md` … `08-05-PLAN.md`
(`register_authored_at_plan_time: true`). No `## Threat Flags` section exists in any SUMMARY;
the auditor confirmed no attack surface outside the register. Verified by `gsd-security-auditor`
against the implementation, not against the plans.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| User input → `GET /visitors?q=` | freely typed text leaves the device as a query parameter | search string (self-authored) |
| API response → result / request / crew row | foreign profile data not controlled by the user is rendered | `visitorProfileForeignSchema` projection |
| Row → `POST /me/friend-requests` | one tap causes a state change for a third person | `targetAccountId` |
| Requests list → `.../{accept,decline,withdraw}` | one tap alters a relation with a third person | counterpart `accountId` |
| Detail card → `DELETE /me/friends/:accountId` | one tap ends a relation for BOTH sides | counterpart `accountId` |
| Navigation param → query-cache lookup | an `accountId` from the route selects which record is shown | route param (local key only) |
| Own handle → QR payload | a value leaves the device optically, readable by any foreign camera | `quiks:u/{username}` |
| Device camera → app | a native device capability is requested for the first time in this project | camera frames (never egress) |
| Scanned foreign code → app logic | fully foreign-controlled text enters the app outside any network channel | decoded string |
| Decoded handle → `GET /visitors/:username` | a scanned value becomes a request path segment | handle |
| npm registry → mobile bundle / native binary | foreign code enters the app bundle | `qrcode-generator`, `expo-camera` |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-08-01 | Information Disclosure | `PersonRow` result row | medium | mitigate | Props are exactly `{ profile, trailing, onPress, accessibilityLabel }`; render emits a subset of the foreign view; no `localUri` to `AvatarTile` — `components/PersonRow.tsx:18-26,48-70` | closed |
| T-08-02 | Spoofing | `sendFriendRequest` target | medium | mitigate | `targetAccountId` only ever from a rendered foreign view / server lookup response; all 6 mutation call sites checked — `app/(tabs)/friends.tsx:371,376`, `components/CameraScanPanel.tsx:334`, `components/RelationAction.tsx:76` | closed |
| T-08-03 | Information Disclosure | typed search text | low | accept | Query is component-local state, reaches the wire only as `q` and as an in-memory React Query key; `lib/query-client.ts:11` mounts no persister; no analytics/telemetry dependency in `apps/mobile/package.json` — rationale verified against code | closed |
| T-08-04 | Denial of Service | search field → API | low | mitigate | `SEARCH_MIN_CHARS = 2`, `SEARCH_DEBOUNCE_MS = 300` (`lib/friend-queries.ts:38,41`), applied via `enabled: searchEnabled` and a per-query key — `friends.tsx:161-164,186,191-195` | closed |
| T-08-05 | Tampering | XSS-like content in `displayName` | low | accept | All foreign strings render through RN `<Text>`; zero `WebView` / `dangerouslySetInnerHTML` in `apps/mobile`; server caps `displayName` at 40 (`packages/db/src/schema/visitor-profile.ts:141,167`) | closed |
| T-08-06 | Information Disclosure | request row | medium | mitigate | Same `PersonRow` (`friends.tsx:662,731`); `friendRequestItemSchema` = `{ profile, requestedAt }` and `requestedAt` is rendered nowhere — `packages/contracts/src/schemas.ts:198-202` | closed |
| T-08-07 | Repudiation | decline / withdraw | low | accept | `packages/db/src/schema/friend-request.ts` carries `lowerId/higherId/requesterId/createdAt` only — no status column, no history row (D-12 by design) | closed |
| T-08-08 | Elevation of Privilege | `:accountId` in the three mutation paths | medium | mitigate | All three calls pass only `params: { accountId }`, no actor param — `lib/use-friend-mutations.ts:13-26`; call sites pass `item.profile.accountId` (`friends.tsx:670,685,744`) | closed |
| T-08-09 | Denial of Service | multi-tap on row actions | low | mitigate | `disabled={isPending}` on Accept, Decline and Withdraw, keyed on `pendingTargetId === accountId` — `friends.tsx:657,669,684,726,743` | closed |
| T-08-10 | Information Disclosure | friend-detail card | medium | mitigate | `findCachedFriend` reads only `queryClient.getQueryData(friendKeys.list)`; the file imports no `apiClient` and runs no `useQuery`; `age: undefined` passed explicitly — `app/friend-detail.tsx:41-48,141-145,171-201` | closed |
| T-08-11 | Tampering | `accountId` from `useLocalSearchParams()` | medium | mitigate | Param used solely as the `.find()` predicate; a cache miss routes back instead of fetching — `friend-detail.tsx:80-84,86-97,126` | closed |
| T-08-12 | Elevation of Privilege | `unfriend` | medium | mitigate | `unfriend(accountId)` reachable only past the `:126` gate, which requires an exact match against a cached `entry.profile.accountId` — `friend-detail.tsx:47,126,134` | closed |
| T-08-13 | Information Disclosure | presence / activity signal | **high** | mitigate | `PersonRow` has no presence prop or slot; repo-wide grep for `presence`/`lastSeen`/`isOnline`/`onlineAt` across contracts, db, api and mobile returns **no field**; `friendsSince` is the only time value rendered — `PersonRow.tsx:18-26,37`, `friend-detail.tsx:198-200` (ADR-014) | closed |
| T-08-14 | Denial of Service | double-tap on "Freundschaft beenden" | low | mitigate | `Alert.alert` confirm serializes the destructive action, plus `disabled={isUnfriendPending}` — `friend-detail.tsx:128-137,213` | closed |
| T-08-15 | Information Disclosure | QR payload | medium | mitigate | Payload is `quiks:u/${username}` and nothing else; both `QRMark` call sites pass `meQuery.data.body.profile?.username` — `lib/qr-payload.ts:34-36`, `friends.tsx:456`, `app/friends-qr.tsx:144` | closed |
| T-08-16 | Tampering | foreign QR payload | medium | mitigate | Prefix enforced at position 0, empty remainder rejected, `includes('/')` rejected (exactly one segment), plus the WR-04 `USERNAME_PATTERN` charset gate; module imports no network/router/Linking API — `lib/qr-payload.ts:31,60-74` | closed |
| T-08-SC (08-04) | Tampering | `pnpm add qrcode-generator` | **high** | mitigate | Blocking human checkpoint completed before install (name, 28 versions since 2014-11-26, 8.3M monthly downloads, MIT, repo, maintainer) — `08-04-SUMMARY.md:131-144`; corroborated by `pnpm-lock.yaml:11826` (`qrcode-generator@2.0.4: {}`, zero runtime deps) and the exact-name pin in `apps/mobile/package.json` | closed |
| T-08-17 | Denial of Service | `buildQrMatrix` on a very long payload | low | accept | `username` bounded `.min(3).max(20)` on insert and select (`packages/db/src/schema/visitor-profile.ts:136-140,162-166`); `buildQrMatrix` is only reachable via `encodeQuiksCodePayload(ownUsername)`, so input is capped at 28 chars — scanned payloads never reach it | closed |
| T-08-18 | Information Disclosure | camera runtime | **high** | mitigate | Ternary conditional render (unmount, not `display`/`opacity`) at the repo's only mount site; `CameraView` carries no `ref`, no `takePictureAsync`/recording call, no `onCameraReady` — sole egress is `result.data` — `app/friends-qr.tsx:103,161-167`, `CameraScanPanel.tsx:219-224` | closed |
| T-08-19 | Tampering | decoded payload | **high** | mitigate | `parseQuiksCodePayload` runs first, `null` ⇒ local invalid state with no request; the only `Linking.openURL` in `apps/mobile` is `mehr.tsx:285` with a module constant; the panel's only navigation is `openSettings()` and a `router.replace` carrying no decoded text; no WebView in the app — `CameraScanPanel.tsx:153-160,194,204` | closed |
| T-08-20 | Elevation of Privilege | superfluous permissions | medium | mitigate | `expo-camera` plugin entry sets `recordAudioAndroid: false` and `microphonePermission: false`; the `expo-image-picker` entry is byte-for-byte pre-phase — `apps/mobile/app.json:39-45,46-53`. Effective permission set confirmed on device in UAT test 1 (Camera listed, Microphone not) after the native rebuild | closed |
| T-08-21 | Denial of Service | repeatedly firing barcode callback | medium | mitigate | Prop-identity disarm: `onBarcodeScanned={scanState.kind === 'idle' ? handleBarcodeScanned : undefined}` — the native side stops calling into JS entirely rather than no-oping inside the handler — `CameraScanPanel.tsx:54,144-146,223` | closed |
| T-08-22 | Spoofing | forged quiks code | low | accept | The `found` branch renders name + `@handle` + avatar before any `RelationAction`; nothing is sent without a tap; withdraw exists with no cooldown — `CameraScanPanel.tsx:304-347,332-335`, `use-friend-mutations.ts:23-26` | closed |
| T-08-SC (08-05) | Tampering | `npx expo install expo-camera` + native rebuild | **high** | mitigate | Blocking human checkpoint completed before install (exact name, ruling out `expo-cameras`/`react-native-expo-camera`; `github.com/expo/expo` `packages/expo-camera`; 20+ Expo maintainers; MIT) — `08-05-SUMMARY.md:133-147`; corroborated by `pnpm-lock.yaml:4163` (`expo-camera@57.0.3`) and `~57.0.3` against `expo ~57.0.9` — SDK-matched, not hand-pinned | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-08-01 | T-08-03 | The search string has no persistence, history or telemetry path in the project — verified: no query persister, no analytics dependency. Accepted because no such path exists and none will be built (plan prohibition). | Emil Auer | 2026-08-13 |
| R-08-02 | T-08-05 | React Native does not render text as markup, so a `displayName` cannot inject executable content; length caps are server-side. | Emil Auer | 2026-08-13 |
| R-08-03 | T-08-07 | No history is created by design — the row is deleted without a status column. The absence of proof is the protection goal here, not the gap. | Emil Auer | 2026-08-13 |
| R-08-04 | T-08-17 | The QR payload is bounded by the server-side `username` cap (max 20), so the encoder cannot be fed an unbounded input. | Emil Auer | 2026-08-13 |
| R-08-05 | T-08-22 | A code can carry any foreign handle — which is exactly why the confirmation card exists. A request to the wrong person is consequence-free and withdrawable without cooldown. | Emil Auer | 2026-08-13 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-13 | 24 | 24 | 0 | gsd-security-auditor (ASVS L1, block_on high) |

---

## Auditor Observations (no status change)

1. **Stale native manifest — resolved by UAT.** At audit time the untracked
   `apps/mobile/android/app/src/main/AndroidManifest.xml` (mtime 2026-08-12, i.e. *before* the
   `expo-camera` install) still carried `RECORD_AUDIO` from the pre-existing `expo-image-picker`
   entry and carried no `CAMERA`. The declared T-08-20 mitigation was correct in `app.json`; the
   *effective* set could not be confirmed from a pre-rebuild manifest. UAT test 1 (run after
   `npx expo run:android`) verified on device that the permission list shows Camera and not
   Microphone — the observation is closed.
2. **T-08-12 form.** `friend-detail.tsx:134` passes the route param rather than
   `friend.profile.accountId`. Provably identical past the `:126` exact-match gate, so the threat
   is closed, but the direct field read would remove the need for that proof. Cosmetic.
3. **Camera teardown invariant.** `CameraScanPanel` unmounts via segment switch or screen pop;
   there is no `useIsFocused` guard. No code path currently pushes a screen on top of
   `/friends-qr` (the denied-state exit uses `router.replace`), so T-08-18 holds as written —
   worth preserving as an invariant if a future phase adds navigation out of the scan panel.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-13
