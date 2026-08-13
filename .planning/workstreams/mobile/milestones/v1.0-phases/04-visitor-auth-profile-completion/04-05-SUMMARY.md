---
phase: 04-visitor-auth-profile-completion
plan: 05
subsystem: mobile-auth
tags: [react-native, expo-image-picker, expo-image, mmkv, lingui, tanstack-query, festipal-ui]

# Dependency graph
requires:
  - phase: 04-01
    provides: react-native-mmkv + react-native-nitro-modules peer, expo-image-picker/expo-image, apps/mobile Vitest node-env runner
  - phase: 04-03
    provides: complete-profile.tsx's real username/displayName form (live-availability check, completeProfile/409/refreshAuthState wiring) as the target this plan finishes
provides:
  - "apps/mobile/lib/avatar-storage.ts — MMKV wrapper (save/get/clear) keyed avatar-uri:${accountId}, D-01 device-local avatar persistence"
  - "apps/mobile/components/AvatarTile.tsx — initials tile <-> local expo-image photo, first components/ addition this plan"
  - "apps/mobile/lib/username-suggestion.ts — generateUsernameSuggestion (pure, <=20-char D-03 cap) + suggestAvailableUsername (availability-verified, bounded-retry), unit-tested"
  - "complete-profile.tsx: full avatar picker (gallery+camera) block and the unified username-taken state (live-check + completeProfile 409) with a verified suggestion"
affects: [04-06 logout-deeplink-splash]

# Actuals (#2632)
actuals:
  tokens: 7300
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "MMKV required lazily inside a getStorage() accessor (mirrors lib/fonts.ts's lazy-require idiom) so avatar-storage.ts's exported functions stay importable in a non-native context — only calling save/get/clear touches the native Nitro module"
    - "Unified taken-state: usernameStatus==='taken' (live check) OR a completeProfile 409 (conflict flag) both feed a single isUsernameTaken boolean driving the same Copywriting-Contract copy + danger field styling"
    - "suggestAvailableUsername takes an injected async checkFn — keeps the pure generator+retry logic testable with zero network/RN dependency, while the screen supplies the real GET /me/username-availability call"

key-files:
  created:
    - apps/mobile/lib/username-suggestion.ts
    - apps/mobile/lib/__tests__/username-suggestion.test.ts
    - apps/mobile/lib/avatar-storage.ts
    - apps/mobile/components/AvatarTile.tsx
  modified:
    - apps/mobile/app/(profile-setup)/complete-profile.tsx
    - apps/mobile/locales/en/messages.po
    - apps/mobile/locales/de/messages.po

key-decisions:
  - "accountId is sourced from a cached GET /me useQuery (['me']) inside complete-profile.tsx rather than authClient.useSession().data.user.id — the latter's ClientSession<Option> generic collapsed to `never` under this project's plugin config, a real TS inference dead end (not a workaround-able typo); apiClient.getMe() is already fully typed via @festipal/contracts and this screen only mounts after the root guard's own GET /me already resolved, so the re-fetch is React-Query-cache-warm, not a new cold round-trip"
  - "A completeProfile 409 is treated as a username-taken event (setConflict(true) -> the SAME unified taken-state UI + regenerated suggestion), replacing the prior 04-03 generic 'Couldn't complete your profile — tap Done to try again.' retry copy — completeProfile's only unique constraint is lower(username) (me.service.ts), so a 409 here is definitionally a username conflict, and the plan's own must_haves truth #4 explicitly requires the taken lines + suggestion on 409, not a generic banner. Lingui extract auto-obsoleted the now-unused msgid (matches the project's existing obsoletion pattern from 04-03/04-04)."
  - "Task 2's avatar action/helper msgids (Choose photo/Take photo/helper caption) were authored in Task 3 alongside the JSX that actually renders them, not in Task 2 as the plan's action text literally sequenced — Lingui extract only picks up strings from real call sites, and AvatarTile.tsx itself never renders picker buttons (that's the screen's job); adding unused t\`...\`/<Trans> calls in Task 2 would have been dead code. All msgids are present and DE-verbatim by the end of Task 3."
  - "AvatarTile uses radii.pill (999) for both the photo and initials-tile borderRadius rather than computing AVATAR_SIZE/2 — RN clips borderRadius at half the element's own dimension, so a large pill value forces a true circle regardless of the exact tile size chosen (no pixel-mockup dimension was specified for this element)."
  - "Ran `pnpm compile` once to verify the catalog compiles cleanly, then deleted the generated locales/{en,de}/messages.js — @lingui/metro-transformer compiles .po catalogs at bundle time (STATE.md, 03-04) so the compiled .js is a redundant local artifact, not a file any prior Phase-4 plan committed."

requirements-completed: [IDN-01]

coverage:
  - id: D1
    description: "generateUsernameSuggestion never exceeds 20 chars and only emits a-z0-9_. for any input (long/emoji/multi-byte/empty/adversarial); suggestAvailableUsername verifies a candidate via an injected availability checker before returning, bounded-retry (3 attempts) on collision, never surfaces an unverified suggestion within the retry budget"
    requirement: IDN-01
    verification:
      - kind: unit
        ref: "cd apps/mobile && pnpm test -- username-suggestion.test.ts -- 8/8 assertions pass"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck -- exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "avatar-storage.ts's save/get/clear are keyed avatar-uri:${accountId}, store only the URI string (never image bytes or the session token — SecureStore stays session-only); AvatarTile renders the local expo-image photo when a URI is set, else a 2-letter uppercase initials tile derived defensively (Array.from code-point iteration) from displayName || username"
    requirement: IDN-01
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint -- exit 0 (tokens-only styling, no hard-coded hex)"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck -- exit 0"
        status: pass
      - kind: manual_procedural
        ref: "MMKV native persistence across a real app restart + native cold-start (Nitro TurboModule, requires a native prebuild) cannot be run in this headless executor"
        status: unknown
    human_judgment: true
    rationale: "MMKV v4 is a Nitro TurboModule requiring a native build (04-01 SUMMARY's own carried-forward boundary reminder) — the storage layer's code shape (lazy require, correct key scheme, URI-only payload) is proven by lint+typecheck, but real on-device write/read-after-restart needs a device. Recorded in .planning/WINDOWS.md (#8, #10)."
  - id: D3
    description: "The avatar picker (gallery 'Choose photo' + icon-only 'Take photo' camera button, each permission-gated via expo-image-picker) persists the chosen URI to MMKV and updates AvatarTile immediately; the completeProfile request body stays {username, displayName} only — no avatar field is ever added, visitor_profile.avatar stays null"
    requirement: IDN-01
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck -- exit 0 (apiClient.completeProfile's body type is unchanged — {username, displayName} only, confirmed by @festipal/contracts' unmodified completeProfileBodySchema)"
        status: pass
      - kind: manual_procedural
        ref: "Real-device UAT: pick/capture -> tile updates -> force-quit+relaunch same account -> photo persists; confirm network body has no avatar field"
        status: unknown
    human_judgment: true
    rationale: "The picker's permission flow, native picker UI, and MMKV round-trip all require a real device/emulator to observe end-to-end. Code-level proof: the request body literal in handleDone was not touched by this plan, and packages/contracts/packages/db were not touched at all (grep-verified, 0 diff outside apps/mobile). Recorded in .planning/WINDOWS.md (#8)."
  - id: D4
    description: "The username-taken state shows both Copywriting-Contract lines ('@{username} is already taken.' + 'Try something else, like @{suggestion}.') on EITHER trigger (live-check 'taken' OR a completeProfile 409), with a fresh availability-verified <=20-char suggestion; danger 8%-tint field styling applied on the taken state"
    requirement: IDN-01
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck -- exit 0 (isUsernameTaken/conflict state wiring, suggestAvailableUsername call site)"
        status: pass
      - kind: manual_procedural
        ref: "Real-device UAT: type a taken username -> both lines + suggestion; force a 409 -> same UI, suggestion regenerates"
        status: unknown
    human_judgment: true
    rationale: "The live-check branch is exercised by the existing debounced TanStack useQuery (unchanged mechanism from 04-03, already proven working); the NEW 409-triggers-the-same-UI branch and the real suggestion-regeneration round-trip against a live GET /me/username-availability both need a running dev build + real network calls to observe. Recorded in .planning/WINDOWS.md (#9)."
  - id: D5
    description: "DE catalog matches the UI-SPEC Copywriting Contract verbatim for all 4 new 04-05 msgids (Choose photo/Take photo/Optional helper/suggestion line); no msgid belonging to another in-wave plan was removed; the one msgid this plan's own logic change made unused ('Couldn't complete your profile...', a 04-03 string) was auto-obsoleted by extract, not manually deleted"
    verification:
      - kind: other
        ref: "pnpm --filter @festipal/mobile extract -- 61/61 DE messages present, 0 missing"
        status: pass
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint (i18next/no-literal-string) -- exit 0"
        status: pass
      - kind: other
        ref: "git diff --stat on messages.po shows only additions/one auto-obsoletion scoped to complete-profile.tsx — no 04-04/04-06 msgid touched"
        status: pass
    human_judgment: false

# Metrics
duration: ~40min
completed: 2026-08-05
status: complete
---

# Phase 4 Plan 05: Profile Completion Polish — Avatar + Suggestion Summary

**Finished the IDN-01 profile-completion surface the tracer left thin: a device-local avatar pipeline (expo-image-picker → MMKV → expo-image, D-01, never uploaded) with an initials-fallback tile, and the full username taken-state with a generated, verified-available, ≤20-char suggestion — unified across both the live-check and a completeProfile 409.**

## Performance

- **Duration:** ~40 min
- **Started:** 2026-08-05T11:50:00Z
- **Completed:** 2026-08-05T12:00:00Z
- **Tasks:** 3 (all code tasks)
- **Files modified:** 7 (4 created, 3 modified)

## Accomplishments
- `lib/username-suggestion.ts`: `generateUsernameSuggestion` is a pure function that never exceeds the D-03 20-char cap and only emits `a-z0-9_.`, for any input including empty/emoji/multi-byte/adversarially-long strings; `suggestAvailableUsername` wraps it with an injected availability checker and a bounded (3-attempt) retry so an unverified suggestion is never surfaced. 8 Vitest assertions cover the length/charset invariants and retry behavior.
- `lib/avatar-storage.ts`: MMKV wrapper (`saveLocalAvatarUri`/`getLocalAvatarUri`/`clearLocalAvatarUri`) keyed `avatar-uri:${accountId}` (Open Question 1 resolved: account-scoped, never device-scoped) — stores only the URI string, `react-native-mmkv` is required lazily so the module stays importable off-device.
- `components/AvatarTile.tsx`: renders the local `expo-image` photo (circular, `r-pill` radius) when a URI is set, else a 2-letter uppercase initials tile (accent 16%-tint background + ring) derived via `Array.from()` code-point iteration so multi-byte/emoji/empty content can never crash the derivation.
- `complete-profile.tsx`: avatar block above the username field (`AvatarTile` + "Choose photo" gallery button + icon-only "Take photo" camera button, each permission-gated via `expo-image-picker`, 44px hit targets, optional helper caption) — a successful pick/capture persists to MMKV and updates the tile immediately. `accountId` is sourced from a cached `GET /me` `useQuery` (typed, avoids a `authClient.useSession()` generic-inference dead end). The username-taken state now shows both Copywriting-Contract lines with a fresh, availability-verified suggestion on EITHER trigger — the existing live-check "taken" branch, and (new) a `completeProfile` 409, which now renders the same taken UI instead of the prior generic retry banner (a 409 here is definitionally a username conflict — the only unique constraint on the write is `lower(username)`).
- `pnpm lint`, `pnpm typecheck`, and `pnpm test` (19/19 — the new 8-assertion username-suggestion suite + the existing 11 otp-error/fonts assertions) all green for `@festipal/mobile`. Lingui catalogs: 61/61 DE messages present, 0 missing.
- Contract/schema surface untouched: `packages/contracts` and `packages/db` have zero diff this plan — `completeProfile`'s request body stays `{username, displayName}`, `visitor_profile.avatar` stays null.

## Task Commits

1. **Task 1: username-suggestion generator (pure, ≤20-char, unit-tested)** - `11c6c86` (feat)
2. **Task 2: avatar-storage (MMKV) + AvatarTile component** - `045721f` (feat)
3. **Task 3: Wire avatar picker + full username taken-state into complete-profile.tsx** - `1f4a7fd` (feat)

**Plan metadata:** pending (this commit)

## Files Created/Modified
- `apps/mobile/lib/username-suggestion.ts` (created) — `generateUsernameSuggestion` (pure, D-03-capped) + `suggestAvailableUsername` (verified, bounded-retry)
- `apps/mobile/lib/__tests__/username-suggestion.test.ts` (created) — 8 assertions, length/charset/retry invariants
- `apps/mobile/lib/avatar-storage.ts` (created) — MMKV wrapper, keyed `avatar-uri:${accountId}`, lazy-required native module
- `apps/mobile/components/AvatarTile.tsx` (created) — initials tile ↔ local `expo-image` photo, `deriveInitials` exported for testability
- `apps/mobile/app/(profile-setup)/complete-profile.tsx` — avatar picker block + unified taken-state (live-check + 409) + regenerated suggestion
- `apps/mobile/locales/en/messages.po` / `apps/mobile/locales/de/messages.po` — 4 new msgids (avatar actions/helper, taken-suggestion line), 1 auto-obsoleted (the now-unused generic 409 retry copy)

## Decisions Made
- `accountId` comes from a cached `GET /me` `useQuery(['me'], () => apiClient.getMe())` rather than `authClient.useSession().data.user.id` — the latter hit a real TypeScript inference dead end (`ClientSession<Option>` resolved to `never` under this project's specific `createAuthClient` plugin config, confirmed via `tsc`'s exact error, not assumed). `apiClient.getMe()` is fully typed through `@festipal/contracts` and is cache-warm (the root guard already called it to reach this screen), so this is not a new cold network round-trip.
- A `completeProfile` 409 is now treated as a username-taken event: `setConflict(true)` drives the SAME unified taken-state UI (both Copywriting-Contract lines + a regenerated suggestion) instead of 04-03's generic "Couldn't complete your profile — tap Done to try again." retry banner. `completeProfile`'s only unique constraint is `lower(username)` (`me.service.ts`), so a 409 from this endpoint IS definitionally a username conflict — and the plan's own must_haves truth #4 explicitly requires the taken-state UI on 409, not a generic message. Lingui `extract` auto-obsoleted the now-dead msgid, matching this codebase's established obsoletion pattern (04-03 did the same for "Continue"/"One more step").
- Task 2's avatar msgids (Choose photo/Take photo/helper caption) were authored in Task 3 alongside the JSX that renders them, not literally inside Task 2 as the plan text sequenced — `lingui extract` only picks up strings from real call sites, and `AvatarTile.tsx` never renders the picker buttons itself (that's the screen's responsibility). All msgids are present and DE-verbatim by the end of Task 3; nothing is missing at plan close.
- `AvatarTile` uses `radii.pill` (999) for both the photo's and initials-tile's `borderRadius` rather than computing `AVATAR_SIZE / 2` — React Native clips `borderRadius` at half an element's own dimension, so an oversized pill value forces a true circle regardless of the exact tile size (no pixel dimension was specified for this element in the mockup/UI-SPEC).
- Ran `pnpm compile` once during verification to confirm the catalog compiles cleanly, then deleted the generated `locales/{en,de}/messages.js` — `@lingui/metro-transformer` compiles `.po` catalogs at Metro bundle time (established 03-04), so the compiled `.js` output is a redundant local artifact no prior Phase-4 plan has committed.

## Deviations from Plan

None that changed scope or violated a `must_haves` prohibition — three sequencing/technical notes, documented above under Decisions Made (accountId source, 409-as-taken-state, msgid authoring moved from Task 2's text to Task 3's actual usage site). No Rule 1-3 auto-fixes were needed beyond the routine typecheck/lint iteration already captured there.

## Issues Encountered
- `authClient.useSession()`'s `data` property typechecked to `never` when accessing `.user.id` — root-caused (not worked around) by switching to the already-fully-typed `apiClient.getMe()` query, documented above.
- No other issues — `pnpm lint`, `pnpm typecheck`, `pnpm test` were green on the first attempt for every other file.

## User Setup Required
None — no external service configuration required. (Package installs for `expo-image-picker`/`expo-image`/`react-native-mmkv`/`react-native-nitro-modules` were already completed and human-verified in 04-01.)

## Manual UAT — Required, Not Run (headless executor)

Per `human_verify_mode: end-of-phase` (`.planning/config.json`) and this executor's inability to boot a native Android/iOS runtime, the following cannot be exercised headlessly. Recorded here and in `.planning/WINDOWS.md` (#8, #9, #10):

1. **Avatar picker + MMKV persistence (#8):** On a dev build — tap "Choose photo", grant the gallery permission, pick an image; confirm it replaces the initials tile (circular). Tap the camera icon button, grant the camera permission, take a photo; confirm it also replaces the tile. Force-quit the app (real OS process kill, not hot-reload) and relaunch on the same account — confirm the photo persists (MMKV). Inspect the network request for `POST /me/complete-profile` and confirm the body is exactly `{username, displayName}` with no `avatar` field.
2. **Username taken-state, both triggers (#9):** Type a username that is already taken — confirm both Copywriting-Contract lines render with a `≤20`-char suggestion that is actually available (tap it into the field and confirm no immediate re-taken flash). Separately, force a `completeProfile` 409 (e.g. two near-simultaneous submits of the same fresh username from two devices/tabs) — confirm the same taken UI renders and the suggestion regenerates.
3. **AvatarTile visual + encoding backstop (#10):** Confirm the populated (real-photo) state visually matches the circular `r-pill`-radius mockup expectation (not pictured in the mockup itself, per UI-SPEC's own backstop classification). Separately, type a long/multi-byte/emoji `displayName` and confirm the initials tile and profile layout do not break.

## Next Phase Readiness
- **04-06 (logout/deep-link/splash):** No changes to `app/_layout.tsx`'s guard, `festivals/index.tsx`, or the `completeProfile` request/response contract this plan — 04-06 can build on the unchanged four-state guard and `refreshAuthState()` singleton.
- **Blocking for phase close:** The 3 manual UAT items above (plus the carried-forward items from 04-03/04-04) must be run on a real device before Phase 4 can be considered verified end-to-end — tracked in `.planning/WINDOWS.md` (#8, #9, #10, plus #3–#7).

---
*Phase: 04-visitor-auth-profile-completion*
*Completed: 2026-08-05*

## Self-Check: PASSED

All created/modified files verified present on disk (`apps/mobile/lib/username-suggestion.ts`, `apps/mobile/lib/__tests__/username-suggestion.test.ts`, `apps/mobile/lib/avatar-storage.ts`, `apps/mobile/components/AvatarTile.tsx`, `apps/mobile/app/(profile-setup)/complete-profile.tsx`, `apps/mobile/locales/en/messages.po`, `apps/mobile/locales/de/messages.po`); all three task commits (`11c6c86`, `045721f`, `1f4a7fd`) verified present in git log.
