---
phase: 08-friends
plan: "04"
subsystem: ui
tags: [expo-router, react-native-svg, qrcode-generator, lingui, react-native, friends, qr]

requires:
  - phase: 08-friends
    plan: "03"
    provides: "the ['me'] query pattern already shared across Profil/Friends (reused unchanged here for the QR screen's handle), the screen family's three-state ViewState/compute...State() schema"
  - phase: 07-profile-visibility-friendship-backend
    provides: "D-17 — the quiks-code content decision (namespaced plaintext quiks:u/<username>, never a deep link) this plan's payload format implements"
provides:
  - "apps/mobile/lib/qr-payload.ts — QUIKS_CODE_PREFIX/encodeQuiksCodePayload/parseQuiksCodePayload, the namespaced-plaintext quiks-code format (Phase-7 D-17), pure and node-env-tested (13 tests)"
  - "apps/mobile/lib/qr-matrix.ts — buildQrMatrix/QR_QUIET_ZONE_MODULES over qrcode-generator, pure and node-env-tested (7 tests, incl. finder-pattern structure and non-ASCII encoding)"
  - "apps/mobile/components/QRMark.tsx — the fixed-contrast, mode-invariant scannable mark component (primaryForeground/textOnGradient), renders null on an unencodable payload"
  - "apps/mobile/app/friends-qr.tsx — the QR screen: SegmentedControl 'Mein Code'/'Scannen', registered as a root-level Stack.Screen sibling of (tabs); 'Mein Code' is real (loading/error/missing-handle/populated), 'Scannen' is an empty placeholder panel for 08-05"
  - "(tabs)/friends.tsx quiks-code card: real full-opacity CTA routing to /friends-qr, real small preview mark with the same payload, no more Soon badge/3x3 placeholder pattern"
affects: [08-05]

actuals:
  tokens: 10954
  tasks: 2
  commits: 2

tech-stack:
  added: [qrcode-generator]
  patterns:
    - "Own UTF-8 byte encoder assigned directly to a third-party singleton's mutable property (qrcode.stringToBytes) instead of depending on a build-specific named hook (stringToBytesFuncs['UTF-8']) — the installed package's resolved ESM build (dist/qrcode.mjs, what both Metro and Vite/Vitest pick via the import/module condition) ships no stringToBytesFuncs object at all, only the CJS build does. 'Prove the behavior, not the hook name' per the plan's own fallback clause (08-04-PLAN action (3))."
    - "Fixed-contrast, mode-invariant colour exception for exactly one real-world-scannability surface (QRMark's backdrop/modules) — still resolved through useTheme()/tokens.ts (primaryForeground/textOnGradient), never a raw hex, and documented inline as the one deliberate carve-out from the app's per-mode colour rule (05.1 D-01)."
    - "Quiet zone kept OUT of the pure matrix (lib/qr-matrix.ts) and added by the rendering component's own SVG viewBox (QRMark) — the matrix stays exactly what the encoder computed, the presentation-only margin is the component's concern."

key-files:
  created:
    - apps/mobile/lib/qr-payload.ts
    - apps/mobile/lib/qr-matrix.ts
    - apps/mobile/lib/__tests__/qr-payload.test.ts
    - apps/mobile/lib/__tests__/qr-matrix.test.ts
    - apps/mobile/components/QRMark.tsx
    - apps/mobile/app/friends-qr.tsx
  modified:
    - apps/mobile/app/_layout.tsx
    - "apps/mobile/app/(tabs)/friends.tsx"
    - apps/mobile/package.json
    - pnpm-lock.yaml
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "qrButton's fill switched from the neutral fillQuiet/textPrimary pair (Pattern A dampening) to a solid colors.primary/textOnPrimary pair — UI-SPEC's own Color contract lists 'QR zeigen (now real, was Pattern-A-dampened in Phase 6)' under the primary-pill accent usage, matching retryButton's already-established role, not a new one invented here."
  - "The card's small preview mark only renders when quiksCodeState.username is truthy, mirroring the handle line's own long-standing omit-if-empty rule — the old 3x3 placeholder rendered unconditionally because it encoded nothing; a REAL mark can't encode an absent handle, so it is omitted rather than shown broken or blank."
  - "The QR screen's 'Mein Code' loading/error copy reuses the existing catalog strings ('Loading your quiks code…', the two transport/response error lines) instead of minting near-duplicate new msgids — both surfaces read the exact same ['me'] query and describe the exact same failure."
  - "qr-matrix.ts carries its own small UTF-8 byte encoder rather than depending on qrcode-generator's stringToBytesFuncs['UTF-8'] hook (see tech-stack.patterns) — pre-authorized by the plan's own text, not a workaround outside its scope."

patterns-established:
  - "Own-UTF-8-encoder-over-build-specific-hook (see tech-stack.patterns) — the template for any future case where a vendored package's ESM/CJS builds expose different surface area."

requirements-completed: []

coverage:
  - id: D1
    description: "encodeQuiksCodePayload/parseQuiksCodePayload implement the quiks:u/<username> namespaced-plaintext format exactly (Phase-7 D-17): case-insensitive prefix strictly at position 0, exactly one non-empty segment after it, outer whitespace trimmed, everything else null. Pure, no React/Lingui import."
    requirement: FRND-04
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/qr-payload.test.ts — 13/13 tests, every <behavior> case from 08-04-PLAN Task 1 asserted individually"
        status: pass
    human_judgment: false
    rationale: null
  - id: D2
    description: "buildQrMatrix produces a square boolean[][] (>=21 modules) with the three canonical finder patterns structurally present, differs between different payloads, keeps the quiet zone out of its own output, and encodes a non-ASCII payload without throwing and differently from its ASCII sibling"
    requirement: FRND-04
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/qr-matrix.test.ts — 7/7 tests incl. a structural finder-pattern-border assertion (not a snapshot) and a dedicated non-ASCII-vs-ASCII comparison"
        status: pass
    human_judgment: false
    rationale: null
  - id: D3
    description: "QRMark renders the matrix as fixed-contrast (colors.primaryForeground backdrop, colors.textOnGradient modules), mode-invariant modules with the quiet zone added in its own SVG viewBox, returns null (no fallback graphic) when buildQrMatrix can't encode the payload, and carries a Lingui-driven accessibilityLabel"
    requirement: FRND-04
    verification: []
    human_judgment: true
    rationale: "Real-world scannability and true colour invariance across light/dark mode are device/rendering claims this repo's node-env-only Vitest runner cannot prove (STATE.md § Blockers/Concerns — no RN component-test harness). Structural correctness (token-only colours, no raw hex, null-on-unencodable, quiet-zone math) is typecheck- and code-review-provable and was checked by hand against QRMark.tsx's source."
  - id: D4
    description: "friends-qr.tsx renders the SegmentedControl (Mein Code default per D-13, Scannen) with exactly one panel visible; 'Mein Code' covers loading/error(transport+response)/missing-handle-edge-case/populated states behind the shared ['me'] query; 'Scannen' is an empty, textless placeholder panel (no camera access, no promise this plan can't keep)"
    requirement: FRND-04
    verification: []
    human_judgment: true
    rationale: "Screen-level rendering/navigation truth (SegmentedControl toggling the right panel, the mark actually appearing on a real device, the edge-case copy showing for a handle-less account) needs an on-device pass — the same structural verification limit every prior plan in this phase (08-01–08-03) has logged. typecheck/lint/lingui compile --strict all pass against the screen's source."
  - id: D5
    description: "The quiks-code card's CTA is a full-opacity primary pill (Pattern A dampening removed) that navigates to /friends-qr, the Soon badge is gone, and the card's own small preview mark is a real QRMark with the identical encodeQuiksCodePayload(username) payload, omitted (not broken/blank) when there is no username"
    requirement: FRND-04
    verification: []
    human_judgment: true
    rationale: "Same on-device rendering/navigation limit as D4 — button opacity, badge absence and the small mark's real appearance are visual/navigation claims. typecheck/lint pass; the removed opacity/badge/QR_PATTERN constants are grep-confirmed absent from the file."
  - id: D6
    description: "The device-only claim from 08-04-PLAN Task 2's <human-check>: a third-party QR/camera app reads the big 'Mein Code' mark as exactly quiks:u/<username> and opens nothing, in BOTH light and dark mode, on a real device"
    requirement: FRND-04
    verification: []
    human_judgment: true
    rationale: "Requires a live camera scan against a running build on a real device — genuinely unautomatable in this environment and explicitly the coordinator's own instruction to surface here rather than self-approve. Not performed in this session; see Issues Encountered."

duration: ~15min
completed: 2026-08-13
status: complete
---

# Phase 8 Plan 4: QR Screen + Real quiks-code CTA (Mein Code) Summary

**Real scannable QR mark over `qrcode-generator`; the QR screen's "Mein Code" panel and the quiks-code card's CTA both go live, wired through a namespaced-plaintext `quiks:u/<username>` payload format proven pure in 20 node-env tests — the "Scannen" direction stays a placeholder for 08-05.**

## Performance

- **Duration:** ~15 min (2026-08-13T13:01Z → 2026-08-13T13:16Z, including the package-legitimacy checkpoint round-trip)
- **Started:** 2026-08-13T13:01:14Z
- **Completed:** 2026-08-13T13:16:07Z
- **Tasks:** 2 (Task 1: pure logic + tests; Task 2: `QRMark` + QR screen + real CTA)
- **Files modified:** 12 (6 created, 6 modified)

## Accomplishments

- `lib/qr-payload.ts` closes the D-13/D-17 format decision as pure, tested logic: `QUIKS_CODE_PREFIX = 'quiks:u/'`, `encodeQuiksCodePayload`/`parseQuiksCodePayload` — strict, case-insensitive prefix-at-position-0 matching, exactly one non-empty segment after it, outer whitespace trimmed. 13 tests cover every case named in the plan's own `<behavior>` block, including the deep-link-shaped rejection (`quiks://home`) and the "prefix not at position 0" rejection (`https://.../quiks:u/feli`) — both are what keep a scanned foreign code from ever reaching the deep-link capture path that produced the Phase-5 first-login-unmatched-route bug.
- `lib/qr-matrix.ts` wraps `qrcode-generator` (type auto, error correction `M`) into a pure `buildQrMatrix(payload): boolean[][] | null`, with `QR_QUIET_ZONE_MODULES = 4` deliberately kept OUT of the matrix. 7 tests prove: null on empty/whitespace, a square >=21-module matrix with equal-length rows, the three finder patterns structurally present at their canonical corners (a real border check, not a snapshot), two different payloads producing different matrices, and a non-ASCII payload encoding without throwing and differently from its ASCII sibling.
  - **Notable finding:** the plan named `qrcode.stringToBytesFuncs['UTF-8']` as the byte-encoder hook to swap in for correct non-ASCII encoding. The installed package's ESM build (`dist/qrcode.mjs` — what both Metro and Vite/Vitest resolve via the `import`/`module` condition) does not define `stringToBytesFuncs` at all; only the CJS build (`dist/qrcode.js`) does. Per the plan's own explicit fallback clause ("gilt das Verhalten, nicht der Name"), `qr-matrix.ts` instead carries its own small UTF-8 encoder and assigns it directly to `qrcode.stringToBytes` — the one mutable property both builds expose and both internally read from at `addData` time. The non-ASCII test (`félix` vs `felix`) proves the behavior the plan actually cares about.
- `components/QRMark.tsx` (new): renders `buildQrMatrix(payload)` as an SVG with a fixed `colors.primaryForeground` backdrop and `colors.textOnGradient` modules — both mode-invariant by design, resolved through `useTheme()` like every other colour in the app, but deliberately never swapped for dark-mode equivalents (UI-SPEC's one documented scannability exception to the per-mode colour rule). The quiet zone is added in the SVG `viewBox`, not the matrix. Returns `null` (no fallback graphic) when the payload can't be encoded, and carries a Lingui-driven `accessibilityLabel`.
- `app/friends-qr.tsx` (new): root-level `Stack.Screen`, sibling of `(tabs)` exactly like `profil.tsx`, registered inside `_layout.tsx`'s authenticated `Stack.Protected` block next to `profil`/`friend-detail`. Renders the reused `SegmentedControl` (`mine`/`scan`, opening on `mine` per D-13) with exactly one panel below it. "Mein Code" reads the SAME `['me']` query the Profil/Friends screens already share (no second `/me` request), through the same loading/error(transport+response)/data three-state schema every screen in this family uses, plus the missing-handle edge case (own username not set yet) rendering the copy instead of an invented placeholder. "Scannen" is an empty, textless placeholder `<View>` — no camera access and no promise this plan can't keep — filled in 08-05.
- `(tabs)/friends.tsx`'s quiks-code card is now fully real: the CTA lost its Pattern-A dampening (full-opacity solid `colors.primary` pill, `colors.textOnPrimary` text — matching `retryButton`'s already-established role, per UI-SPEC's Color contract) and now calls `router.push('/friends-qr')`; the `Soon` badge and the fixed 3x3 hand-written placeholder pattern are gone, replaced by a real small `QRMark` with the identical `encodeQuiksCodePayload(username)` payload, omitted (not broken/blank) when there's no username — same omit-if-empty rule the handle line already followed. The now-dead `PATTERN_A_OPACITY`/`QR_CELL_SIZE`/`QR_GRID_SIZE`/`QR_PLACEHOLDER_SIZE`/`QR_PATTERN`/`badge`/`badgeText`/`qrPlaceholder`/`qrCell`/`qrCellFilled` constants and styles, and the now-unused `useSoonToast` import, are removed.
- 6 new Lingui msgids extracted and translated in both catalogs ("Let the other person scan this code.", "My code", "QR code", "Scan", "Set your username first to show your code.", "Your quiks code as a scannable QR mark"); 2 now-obsolete msgids ("Adding by QR is coming soon.", "Show QR, coming soon") were automatically marked `#~` by `lingui extract`, matching the project's existing obsolete-entry convention.

## Package Legitimacy Audit

**Package:** `qrcode-generator` — verified by the orchestrator directly against the npm registry (this executor has no web tool) before Task 1's install proceeded, per T-08-SC's `blocking-human` checkpoint.

- **Package name:** `qrcode-generator` — exact match, no typo-squat neighbour.
- **Version history:** 28 published versions, earliest `1.0.0` on 2014-11-26, latest `2.0.4` on 2025-08-07 (~11 years).
- **Downloads:** 8,304,883 in the last month (2026-07-11 → 2026-08-09), per `api.npmjs.org/downloads/point/last-month`.
- **Runtime dependencies: none** — the latest version carries no `dependencies` field. This is the criterion that selected it over the similarly named `qrcode` package (which pulls `pngjs`/`fs`-oriented Node deps unsuitable for an RN bundle) — confirmed independently against the installed `node_modules/qrcode-generator/package.json` during Task 1 (no `dependencies` key present).
- **License:** MIT. **Repository:** `git+https://github.com/kazuhikoarase/qrcode-generator.git` (public) — matches the installed package's own `package.json`.
- **Maintainer:** `kazuhikoarase` — author of the original JS QR code library.

**Sources:** `https://registry.npmjs.org/qrcode-generator`, `https://api.npmjs.org/downloads/point/last-month/qrcode-generator`.

**Resolution:** approved by the user via the orchestrator; `pnpm add qrcode-generator` (Task 1) ran only after this approval, with Metro/Expo confirmed not running beforehand (Windows ENOENT precondition).

## Task Commits

Each task was committed atomically:

1. **Task 1: pure QR payload/matrix logic + tests** - `b196601` (test)
2. **Task 2: `QRMark`, the QR screen, and the real quiks-code CTA** - `f966ecf` (feat)

## Files Created/Modified

- `apps/mobile/lib/qr-payload.ts` - `QUIKS_CODE_PREFIX`/`encodeQuiksCodePayload`/`parseQuiksCodePayload`, pure, no React/Lingui import
- `apps/mobile/lib/qr-matrix.ts` - `buildQrMatrix`/`QR_QUIET_ZONE_MODULES` over `qrcode-generator`, own UTF-8 byte encoder assigned to `qrcode.stringToBytes`
- `apps/mobile/lib/__tests__/qr-payload.test.ts` - 13 tests, every `<behavior>` case from the plan
- `apps/mobile/lib/__tests__/qr-matrix.test.ts` - 7 tests incl. finder-pattern structure and non-ASCII encoding
- `apps/mobile/components/QRMark.tsx` (new) - fixed-contrast SVG mark, quiet zone in its own viewBox, `null` on unencodable payload
- `apps/mobile/app/friends-qr.tsx` (new) - QR screen: `SegmentedControl` + "Mein Code" panel (real) + "Scannen" panel (placeholder for 08-05)
- `apps/mobile/app/_layout.tsx` - registers `friends-qr` inside the authenticated `Stack.Protected` block, next to `profil`/`friend-detail`
- `apps/mobile/app/(tabs)/friends.tsx` - quiks-code card: real full-opacity CTA to `/friends-qr`, real small preview mark, dead placeholder constants/styles removed
- `apps/mobile/package.json` / `pnpm-lock.yaml` - adds `qrcode-generator` (no new devDependency types package needed — it ships its own `.d.ts`)
- `apps/mobile/locales/{de,en}/messages.po` - 6 new msgids, German catalog filled per the UI-SPEC Copywriting Contract wording

## Decisions Made

- `qrButton`'s fill switched from the neutral `fillQuiet`/`textPrimary` pair (Pattern A dampening) to a solid `colors.primary`/`colors.textOnPrimary` pair — UI-SPEC's Color contract explicitly lists "QR zeigen (now real, was Pattern-A-dampened in Phase 6)" under the primary-pill accent usage, matching `retryButton`'s already-established role rather than inventing a new one.
- The card's small preview mark only renders when `quiksCodeState.username` is truthy, mirroring the handle line's long-standing omit-if-empty rule — a real mark can't encode an absent handle, so it's omitted rather than shown broken or blank.
- The QR screen's "Mein Code" loading/error copy reuses the existing catalog strings ("Loading your quiks code…" and the two transport/response error lines) instead of minting near-duplicate new msgids, since both surfaces read the exact same `['me']` query and describe the exact same failure.
- `qr-matrix.ts` carries its own UTF-8 byte encoder instead of depending on `qrcode-generator`'s `stringToBytesFuncs['UTF-8']` hook — see the "Notable finding" in Accomplishments; pre-authorized by the plan's own fallback text, not a workaround outside its scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `qrcode.stringToBytesFuncs` is undefined on the resolved ESM build**
- **Found during:** Task 1, writing `lib/qr-matrix.ts`
- **Issue:** the plan's action text names `qrcode.stringToBytesFuncs['UTF-8']` as the hook to swap in for correct non-ASCII byte encoding. Running the test suite against the freshly installed package threw `TypeError: Cannot read properties of undefined (reading 'UTF-8')` — the installed `qrcode-generator@2.0.4`'s ESM build (`dist/qrcode.mjs`, resolved by Vite's `import`/`module` condition, and the same resolution Metro will apply) has no `stringToBytesFuncs` object at all; only the separately-shipped CJS build (`dist/qrcode.js`) defines it.
- **Fix:** wrote a small, self-contained UTF-8 byte encoder in `qr-matrix.ts` and assigned it directly to `qrcode.stringToBytes` — the one mutable property both builds expose and both internally read from when `addData` runs. This is exactly the fallback the plan itself pre-authorizes ("Sollte die installierte Version den Byte-Encoder-Hook anders benennen, gilt das Verhalten, nicht der Name") — the requirement being satisfied is "a non-ASCII handle encodes without throwing and differs from its ASCII sibling," which the fix delivers regardless of which build resolves at runtime.
- **Files modified:** apps/mobile/lib/qr-matrix.ts, apps/mobile/lib/__tests__/qr-matrix.test.ts
- **Verification:** `pnpm exec vitest run lib/__tests__/qr-matrix.test.ts` — 7/7 pass, including the dedicated non-ASCII-vs-ASCII test
- **Committed in:** `b196601` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking, pre-authorized by the plan's own text)
**Impact on plan:** No scope creep — the fix satisfies exactly the behavior the plan's `<behavior>` block specifies, using a build-agnostic mechanism instead of a build-specific hook name.

## Issues Encountered

**The on-device portion of Task 2's `<verify>` `<human-check>` was not performed in this session.** Per the coordinator's explicit instruction, this is surfaced here rather than self-approved: scanning the big "Mein Code" mark with a foreign QR/camera app to confirm it reads exactly `quiks:u/<username>` and opens nothing, repeating that scan in dark mode, and confirming the missing-handle edge-case copy on a fresh account, all require a running build on a real device. This executor has no device access, consistent with every prior plan in this phase (08-01 through 08-03). All automated gates pass: `vitest run` (226/226, full suite), `typecheck`, `lint`, `lingui compile --strict`. See `coverage` D3–D6 above for what remains human-judgment-gated — the orchestrator should collect this alongside the phase's other outstanding on-device items (08-01's relation mapping, 08-02's Requests race, 08-03's Crew/unfriend lifecycle) for one combined on-device UAT session, per 08-03's own "Next Phase Readiness" note.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `lib/qr-payload.ts` and `lib/qr-matrix.ts` are complete, pure, and node-env-tested — 08-05's "Scannen" panel (camera preview, permission states, decode → `parseQuiksCodePayload` → confirmation card) can call directly into them with no further wiring here.
- `QRMark` is complete and reusable as-is for any future "show a scannable quiks code" surface (the plan's own "Flagged Assumptions" #2 notes `app/profil.tsx` still carries the old 3x3 placeholder + `Soon` badge — deliberately unchanged in this phase, out of scope per `08-CONTEXT.md`, and a cheap `/gsd-quick` follow-up once someone wants it).
- `friends-qr.tsx`'s `SegmentedControl`, `mode` state and screen shell are in place — 08-05 only needs to fill the `scan` branch's `<View />` placeholder with `CameraScanPanel`, not restructure the screen.
- FRND-04 is **not yet complete** — this plan satisfies only the "show" half (D-13's "Mein Code"); the "scan" half (D-14, camera → lookup → confirmation card) is 08-05's entire scope. `requirements-completed` is deliberately empty here; `REQUIREMENTS.md`'s FRND-04 checkbox should be marked only after 08-05 lands.
- Outstanding device re-verification for THIS plan (coverage D3–D6): the real-camera scan of the big mark in both colour modes, the missing-handle edge case, and the screen/CTA rendering claims — recommended to combine with the phase's other pending on-device items into one session, per 08-03's own note.

---
*Phase: 08-friends*
*Completed: 2026-08-13*

## Self-Check: PASSED

All 6 created files and 6 modified files verified present on disk; both task commits (`b196601`, `f966ecf`) verified present in git history.
