---
phase: 08-friends
reviewed: 2026-08-13T14:05:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - apps/mobile/app.json
  - apps/mobile/app/(tabs)/friends.tsx
  - apps/mobile/app/_layout.tsx
  - apps/mobile/app/friend-detail.tsx
  - apps/mobile/app/friends-qr.tsx
  - apps/mobile/components/AvatarTile.tsx
  - apps/mobile/components/CameraScanPanel.tsx
  - apps/mobile/components/PersonRow.tsx
  - apps/mobile/components/QRMark.tsx
  - apps/mobile/components/RelationAction.tsx
  - apps/mobile/lib/__tests__/friend-sort.test.ts
  - apps/mobile/lib/__tests__/qr-matrix.test.ts
  - apps/mobile/lib/__tests__/qr-payload.test.ts
  - apps/mobile/lib/friend-queries.ts
  - apps/mobile/lib/friend-sort.ts
  - apps/mobile/lib/qr-matrix.ts
  - apps/mobile/lib/qr-payload.ts
  - apps/mobile/lib/use-friend-mutations.ts
  - apps/mobile/locales/de/messages.po
  - apps/mobile/locales/en/messages.po
  - apps/mobile/package.json
findings:
  critical: 0
  warning: 4
  info: 7
  total: 11
status: issues_found
---

# Phase 8: Code Review Report

**Reviewed:** 2026-08-13
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

Reviewed the Phase-8 Friends implementation (screen rewrite, QR screen, camera scan panel, shared
row/action components, pure `lib/` logic, both Lingui catalogs, native config). Verification runs:
`vitest run` 226/226 passing, `tsc --noEmit` clean.

**Areas the prompt asked me to probe, with verdicts:**

- **Single mutation definition (D-04):** HOLDS. A repo-wide grep finds
  `apiClient.sendFriendRequest` / `acceptFriendRequest` / `declineFriendRequest` /
  `withdrawFriendRequest` / `unfriend` called only in `apps/mobile/lib/use-friend-mutations.ts`
  (the `friend-detail.tsx:101` hit is a comment). All UI surfaces go through the hook.
- **Search-as-you-type races:** the per-key React Query design (`friendKeys.search(debouncedQuery)`)
  structurally prevents stale-response-overwrites-newer — each debounced term is its own cache
  entry, so no last-write-wins hazard exists. One real inconsistency remains (WR-03).
- **Mutation invalidation:** every mutation invalidates `friendKeys.all` in `onSettled` (success
  AND failure), which covers search hits, both request directions, the crew list and the scan
  lookup at once. No ghost-row path found; a concurrently-answered request that 404s shows the
  inline failure line and is then removed by the settled invalidation. Correct.
- **`qr-matrix.ts` singleton mutation:** SAFE as implemented, and its documented claims are
  accurate — I verified against the installed `qrcode-generator@2.0.4`: `dist/qrcode.mjs` (the
  build Metro/Vitest resolve) contains **zero** occurrences of `stringToBytesFuncs`, while the CJS
  build has four, so the hand-rolled encoder is genuinely necessary. Both builds read
  `qrcode.stringToBytes(data)` dynamically at `addData` time (`qr8BitByte`, mjs line 1725), the
  assignment runs at module load before any use, and `qrcode-generator` has exactly one importer
  in the repo. The UTF-8 encoder is correct for all BMP characters and paired surrogates
  (1/2/3/4-byte branches verified by hand); only unpaired surrogates produce non-standard bytes
  (IN-07, unreachable for contract-constrained usernames).
- **Lingui catalogs:** the msgid sets of `de` and `en` are byte-identical (213 msgids, diff-verified)
  and no msgstr is empty besides the PO header. Every string rendered by the new code exists in
  both catalogs. Two catalog-level defects exist anyway: a msgid collision that yields a wrong
  German label (WR-02) and a spec-mandated string that was never implemented at all (WR-01).
- **`CameraScanPanel` permissions:** the pending/granted/denied state machine is correct, requests
  exactly once per mount, and the denied state is a complete D-16 surface (rationale, Settings
  jump, camera-free path). The disarm-via-`undefined`-prop pattern is the right one; the residual
  pre-disarm multi-fire window is benign here (IN-02).
- **Privacy (ADR-014):** no presence, location or online signal anywhere in the reviewed surfaces;
  rows and the detail card render only profile identity plus `friendsSince`.
- **Token discipline:** all colors resolve through `useTheme()`/`@quiks/ui` tokens;
  `QRMark`/backdrop mode-invariance is the pre-authorized exception and even those values come
  from tokens, not raw hex.

No BLOCKER-severity finding. Four warnings — two binding-copy/i18n defects, one input-handling
inconsistency in the core add-flow, one missing input validation on attacker-controlled scan data.

## Warnings

### WR-01: Send-request failure is completely silent — spec-mandated 404 copy never implemented

**File:** `apps/mobile/components/RelationAction.tsx:57-99`
**Issue:** `useFriendMutations()` exposes `failedTargetId`, and `IncomingRequestRow` /
`OutgoingRequestRow` / `friend-detail.tsx` all render an inline "Couldn't save — try again." from
it — but `RelationAction` destructures only `{ sendRequest, acceptRequest, pendingTargetId }` and
renders **no failure feedback at all**. A failed `Hinzufügen`/`Annehmen` from a search hit or the
scan confirmation card just dims the pill and un-dims it; the visitor gets zero signal that
nothing happened. The UI-SPEC Copywriting Contract explicitly requires "Send-request failure —
target gone (404): DE 'Diese Person gibt's nicht mehr.' / EN 'This person no longer exists.' —
inline, same treatment as other mutation failures." That msgid exists in **neither** catalog
(grep-verified), which confirms the state was never built, not merely miswired. For the 404 case
the settled invalidation eventually removes the hit, partially masking the failure — but a plain
transport failure leaves the row looking untouched and tappable with no explanation.
**Fix:** consume `failedTargetId` in `RelationAction` and render the inline error under the action
(distinguish `ApiResponseError` with `status === 404` → "This person no longer exists." from other
failures → the existing "Couldn't save — try again." msgid), then add the new string to both
catalogs:
```tsx
const { sendRequest, acceptRequest, pendingTargetId, failedTargetId } = useFriendMutations();
const hasFailed = failedTargetId === accountId;
// below the pill:
{hasFailed ? <Text style={styles.error}><Trans>Couldn't save — try again.</Trans></Text> : null}
```
(Threading the 404-specific copy requires exposing the failure's `status` from the hook, e.g.
`failedTarget: { accountId, status } | undefined` — `ApiResponseError` already carries it.)

### WR-02: msgid collision — German relation chip reads "Friends" instead of the contracted "Freunde"

**File:** `apps/mobile/components/RelationAction.tsx:112-119` (and `apps/mobile/locales/de/messages.po:310-315`)
**Issue:** the `friends` relation chip renders `<Trans>Friends</Trans>`, which resolves to the
**same msgid** the tab bar title, `FloatingNav` and `profil.tsx` already use — and that msgid is
deliberately translated as "Friends" in the `de` catalog (the tab keeps its English name by
design). The UI-SPEC Copywriting Contract binds the row chip to DE **"Freunde"** / EN "Friends".
Result: in the primary (German) locale, every search hit and the scan confirmation card for an
existing friend shows an English chip, and the two intended translations of one msgid cannot
coexist. This is the exact failure mode Lingui contexts exist for.
**Fix:** disambiguate the chip's message, e.g.
```tsx
<Trans context="relation chip">Friends</Trans>
```
then `lingui extract` and translate the new `msgctxt "relation chip"` entry as "Freunde" in `de`
(and "Friends" in `en`). Verify the `Requested` chip too — its msgid "Requested" is currently
uncontested ("Angefragt" in both call sites), so only "Friends" collides today.

### WR-03: Search gate trims the query but the request and cache key use the raw string

**File:** `apps/mobile/app/(tabs)/friends.tsx:180-189`
**Issue:** `searchEnabled` is computed from `debouncedQuery.trim().length >= SEARCH_MIN_CHARS`,
but both the query key (`friendKeys.search(debouncedQuery)`) and the request
(`q: debouncedQuery`) use the **untrimmed** string. Consequences: (a) `"feli "` — the exact shape
Android keyboards produce when a suggestion tap or paste appends a trailing space — fires a prefix
search for `"feli "` which matches nothing, so the visitor sees "No one found. Check the @handle
spelling." for a handle that exists. That breaks FRND-02's core promise (exact handle is by
construction the first hit) for a very common input pattern, unless the server happens to trim
(nothing client-side guarantees it does). (b) `"feli"` and `" feli"` occupy two separate cache
entries for the same logical search.
**Fix:** trim once and use that value everywhere:
```tsx
const trimmedQuery = debouncedQuery.trim();
const searchEnabled = trimmedQuery.length >= SEARCH_MIN_CHARS;
const searchQuery = useQuery({
  queryKey: friendKeys.search(trimmedQuery),
  queryFn: () => apiClient.searchVisitors({ query: { q: trimmedQuery } }),
  enabled: searchEnabled,
});
```

### WR-04: Scanned handle enters the request URL unvalidated — ts-rest does not encode path params

**File:** `apps/mobile/lib/qr-payload.ts:39-52` (consumed at `apps/mobile/components/CameraScanPanel.tsx:124-127`)
**Issue:** `parseQuiksCodePayload` rejects only an empty remainder and a literal `/` — every other
character passes through into `lookupVisitor({ params: { username } })`. I verified the installed
`@ts-rest/core` (`index.esm.mjs:161-166`): `insertParamsIntoPath` does a plain string replace with
**no `encodeURIComponent`**. A QR code is attacker-controlled input (anyone can print one), so a
crafted payload like `quiks:u/feli?x=1` produces the request URL `/visitors/feli?x=1` — injected
query params on an authenticated request; `quiks:u/feli#…` truncates via the fragment;
`%2F`/`%00` sequences and raw spaces pass through unencoded. Downstream mitigations hold (the
mutation target comes from the server response's `accountId`, the string never reaches
`Linking`/router, DB access is parameterized), so this is not currently exploitable into anything
worse than request-shape manipulation and confusing lookups — but the trust boundary belongs in
the parser, which already exists for exactly this purpose. The contract constrains usernames to
`3–20 chars: a-z 0-9 _ .`; the parser should enforce that instead of accepting arbitrary bytes.
**Fix:** in `parseQuiksCodePayload`, after extracting `rest`:
```ts
if (!/^[a-z0-9_.]{3,20}$/i.test(rest)) return null;
```
This also removes the `?`/`#`/`%`/whitespace classes wholesale and turns them into the existing
"That's not a quiks code." state. (Case-insensitive to preserve the current "return as scanned"
behavior; tighten to lowercase if the server lookup is case-sensitive anyway.)

## Info

### IN-01: Stale doc comments contradict the shipped code

**File:** `apps/mobile/app/(tabs)/friends.tsx:51-56` and `apps/mobile/app/friends-qr.tsx:52-54`
**Issue:** `QuiksCodeViewState`'s comment still claims "The four list blocks below fetch nothing
at all and therefore render regardless of what this state is" — Phase-6 wording; the Requests and
Crew blocks now each run their own query. `friends-qr.tsx`'s screen comment still says "The
'Scannen' panel is a placeholder in this plan — no camera … and is filled in 08-05" while the code
below renders `CameraScanPanel`. Both comments will actively mislead the next reader.
**Fix:** update both comments to describe the current data flow.

### IN-02: Barcode handler can fire multiple times before the disarm prop propagates

**File:** `apps/mobile/components/CameraScanPanel.tsx:216-224`
**Issue:** disarming via `onBarcodeScanned={scanState.kind === 'idle' ? handler : undefined}`
requires a React re-render plus a bridge round-trip; expo-camera fires per detection frame, so a
handful of extra callbacks land before the disarm takes effect. With one physical code this is
harmless (idempotent state writes, identical query key). With two codes in frame (e.g. a printed
sheet), last-write-wins can make the confirmation card show a different person than the visitor
believes they aimed at — the D-14 confirmation card is the designed mitigation, but a ref guard
would close the window entirely. Also note "Scan again" re-arms while the old code may still be in
frame, immediately re-decoding it.
**Fix:** add a synchronous ref latch:
```tsx
const scanLatchRef = useRef(false);
function handleBarcodeScanned(result: BarcodeScanningResult) {
  if (scanLatchRef.current) return;
  scanLatchRef.current = true;
  /* …existing body… */
}
function resetScan() { scanLatchRef.current = false; setScanState({ kind: 'idle' }); }
```

### IN-03: friend-detail's non-reactive cache read leaves a stale card after a failed unfriend

**File:** `apps/mobile/app/friend-detail.tsx:41-48,84`
**Issue:** `findCachedFriend` uses `queryClient.getQueryData` (no subscription). When an unfriend
fails because the friendship is already gone (removed from another device → 404), `onSettled`'s
invalidation refetches the crew list and the entry disappears from the cache — but this screen
never re-renders on cache changes, so it keeps showing the stale friendship card with "Couldn't
save — try again.", and every retry fails identically. The visitor can always close manually, and
the close-on-missing effect does catch the case on the next incidental re-render, so this is a
degraded-UX corner, not a trap.
**Fix:** read the cache reactively (e.g. `useQuery({ queryKey: friendKeys.list, queryFn, select:
(d) => …find(accountId), enabled: false })` with `notifyOnChangeProps`, or subscribe via
`useQueryClient().getQueryCache().subscribe`) so the existing `if (!friend) → close` effect fires
when the refetched list drops the entry.

### IN-04: `focusSearch` deep param is one-shot per param value

**File:** `apps/mobile/app/(tabs)/friends.tsx:172-178`
**Issue:** `CameraScanPanel` routes back with `params: { focusSearch: '1' }`; the focus effect
depends on `[focusSearch]`. The param persists on the route, so a second pass through the
denied-camera path ("Enter handle instead" again in the same session) navigates with the identical
value — the dependency doesn't change and the field is not focused the second time.
**Fix:** send a nonce (`focusSearch: String(Date.now())`) or clear the param after focusing via
`router.setParams({ focusSearch: undefined })`.

### IN-05: Collator branch and fold fallback disagree on numeric ordering

**File:** `apps/mobile/lib/friend-sort.ts:114,80-86`
**Issue:** the probed collator is constructed with `numeric: true` (so `DJ2 < DJ10`), but the
fold-based fallback compares plain strings (`DJ10 < DJ2`). Devices with and without a working
`Intl.Collator` therefore order numbered display names differently. D-12 accepted a defined
fallback, and both orders are internally consistent — flagged so the divergence is a known choice,
not a surprise.
**Fix (optional):** either drop `numeric: true` for cross-device consistency, or add a cheap
numeric-chunk comparison to `compareFolded`.

### IN-06: Dead `onDone` prop and a restated constant

**File:** `apps/mobile/components/RelationAction.tsx:34,68,88` and `apps/mobile/app/(tabs)/friends.tsx:36`
**Issue:** `RelationAction.onDone` is invoked on both pressable branches but no call site in the
repo ever passes it — dead API surface. Separately, `PENDING_OPACITY = 0.45` is restated in
`friends.tsx` with a comment claiming it is "reused, not reinvented"; it is a second literal that
can drift from `RelationAction`'s.
**Fix:** remove `onDone` until a caller needs it; export `PENDING_OPACITY` from one module and
import it in the other.

### IN-07: Hand-written UTF-8 encoder emits invalid bytes for unpaired surrogates

**File:** `apps/mobile/lib/qr-matrix.ts:39-73`
**Issue:** a lone high/low surrogate (malformed JS string) falls into the 3-byte branch and is
encoded as the surrogate code point itself (`ED A0 80`-style), which is invalid UTF-8 — a standard
`TextEncoder` would substitute U+FFFD. Unreachable for contract-constrained usernames
(ASCII-only), so purely a hardening note on an otherwise correct encoder (all BMP and paired
astral cases verified). Also note `dist/qrcode.mjs:2237` exports a `stringToBytes` const binding
captured **before** the module-load reassignment — irrelevant today (nothing imports it), but a
future consumer importing the named export would get the truncating default encoder.
**Fix (optional):** map unpaired surrogates to `0xEF 0xBF 0xBD` (U+FFFD) to match `TextEncoder`
semantics.

---

_Reviewed: 2026-08-13T14:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
