---
phase: 05-festival-selection-home
plan: 03
subsystem: ui
tags: [expo-router, tanstack-query, lingui, mmkv, intl, typed-routes]

requires:
  - phase: 05-01
    provides: startDate/endDate/place on the Festival contract (DATE-NULLABILITY), seeded frequency-2026 fixture
  - phase: 05-02
    provides: radiiScale + translucent color roles (borderSubtle/fillQuiet), expo-blur, typedRoutes
provides:
  - Slug-keyed festival home at /f/:festivalSlug rendering real getFestival(slug) identity + key facts
  - formatDateRange(start, end, locale) — Hermes-safe, null-safe, date-only local parse
  - active-festival-storage.ts (D-06 persistence, MMKV, lazy-require idiom)
  - festival-queries.ts (festivalKeys factory + unwrapOk) — shared query-key/unwrap surface for 05-06
  - festival-navigation.ts (leaveFestival) — non-dead-end Back for cold-start entry
  - ComingSoonTile owned primitive (2x2 static disabled-tile menu)
affects: [05-04, 05-05, 05-06, 05-07, 05-08]

actuals:
  tokens: 9250
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Query-key factory + unwrapOk (festival-queries.ts) as the single source for TanStack query keys/response-unwrap, reused by later save mutation"
    - "leaveFestival(router) — canGoBack ? back : replace('/festivals') — non-dead-end Back for screens reachable via router.replace"
    - "cachedFestival instant-paint pattern: derive paint data from an existing full-response cache separately from the authoritative query, never via initialData/placeholderData"

key-files:
  created:
    - apps/mobile/lib/date-range.ts
    - apps/mobile/lib/__tests__/date-range.test.ts
    - apps/mobile/lib/active-festival-storage.ts
    - apps/mobile/lib/festival-queries.ts
    - apps/mobile/lib/festival-navigation.ts
    - apps/mobile/components/ComingSoonTile.tsx
    - apps/mobile/app/(festival)/f/[festivalSlug].tsx
  modified:
    - apps/mobile/app/festivals/index.tsx
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "formatDateRange fallback selection is locale-prefix based ('de'/'de-AT'/... -> German, everything else -> English), not a full locale-negotiation — matches the app's own two-locale (de/en) scope."
  - "unwrapOk/ApiResponseError kept framework-free in festival-queries.ts (no React import) so 05-06's save mutation can reuse it without a circular/heavier dependency."
  - "Festival-home Back uses a Stack.Screen headerLeft (native header, matches UI-SPEC Scope note #7 'no glass TopBar, keep the plain native header') with a custom handler calling leaveFestival(router), rather than overriding headerShown:false with an inline Pressable like the (auth) screens."
  - "404 branch renders distinct not-found copy (not the reused transport-error copy) per the plan's explicit acceptance criteria, and clears the persisted active-festival slug only when it matches the 404'd slug."

patterns-established:
  - "Pattern: instant-paint via a separately-derived cache scan (findCachedFestivalBySlug), never initialData/placeholderData of a different response shape."
  - "Pattern: explicit missingSlug / isPending / isError / status===404 / status===200 branch order for any future slug-keyed detail screen."

requirements-completed: [HOME-02, FEST-04]

coverage:
  - id: D1
    description: "formatDateRange is null-safe, date-only local-parsed (never new Date(str)), never calls formatRange, and returns a localized fallback for null/malformed input"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/date-range.test.ts (12 cases: de/en formatting, single-date, null x3, de-AT fallback, empty string, invalid calendar date, timestamp input, no-formatRange check, negative-TZ regression guard)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Festival home screen at /f/:festivalSlug renders identity + key facts + coming-soon menu from getFestival(slug), with explicit pending/transport-error/404/200 branching and a non-dead-end Back"
    requirement: HOME-02
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck (tsc --noEmit) — pass"
      - kind: unit
        ref: "pnpm --filter @festipal/mobile lint (eslint, incl. i18next/no-literal-string) — pass"
    human_judgment: true
    rationale: "Real on-device rendering (formatted dates/place from the seeded frequency-2026 festival, DE/EN toggle, wrong-slug error+Back) requires a physical Android device per this project's established Phase 3/4 UAT convention — not run in this headless execution session. Tracked as WINDOWS.md entry #16 (unrun-verify)."
  - id: D3
    description: "Gate-less Enter from the festivals list persists the active-festival slug (D-06) and navigates to the real slug-keyed route"
    requirement: FEST-04
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck — pass (typed /f/${slug} route resolves against the regenerated .expo/types/router.d.ts)"
    human_judgment: false

duration: ~35min
completed: 2026-08-06
status: complete
---

# Phase 5 Plan 3: Festival Home Tracer Summary

**Slug-keyed festival home (`/f/:festivalSlug`) rendering real `getFestival(slug)` dates/place via a Hermes-safe `formatDateRange`, closing the seed→migration→contract→API→mobile vertical end-to-end.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 3
- **Files modified:** 11 (7 created, 4 modified — incl. 2 `.po` catalogs)

## Accomplishments

- `formatDateRange(start, end, locale)`: null-safe, date-only local parse (never `new Date(str)`, never `formatRange`), two `Intl.DateTimeFormat().format()` calls joined by an en-dash, with a localized "Termin folgt"/"Dates TBA" fallback — 12 Vitest cases including a negative-UTC-offset regression guard for the exact day-shift bug the helper avoids.
- Slug-keyed festival home at `/f/:festivalSlug` replacing the static `(festival)/index.tsx` placeholder: fetches `getFestival(slug)`, instant-paints from a separately-derived `cachedFestival` (never `initialData`/`placeholderData`), branches explicitly on missing-slug / pending / transport-error / 404 / 200, renders the festival name (`display2` H1) + `"{formatDateRange} · {place}"` caption + a 2×2 `ComingSoonTile` grid.
- `active-festival-storage.ts`, `festival-queries.ts` (`festivalKeys` + `unwrapOk`), `festival-navigation.ts` (`leaveFestival`) — three small shared modules the rest of Phase 5 (05-05, 05-06) build on directly.
- Wired the festivals list's Enter affordance to persist the slug and push the real route, replacing the old un-parameterized `/(festival)` navigation.
- Extracted + translated 8 new Lingui strings (0 missing in the German catalog).

## Task Commits

Each task was committed atomically:

1. **Task 1: formatDateRange + active-festival storage + shared festival-queries/navigation helpers** - `cb17b8c` (feat)
2. **Task 2: ComingSoonTile owned primitive** - `809dbba` (feat)
3. **Task 3: Festival home screen + wire gate-less entry from the list** - `fe1e470` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `apps/mobile/lib/date-range.ts` - Pure `formatDateRange` helper
- `apps/mobile/lib/__tests__/date-range.test.ts` - 12 Vitest cases
- `apps/mobile/lib/active-festival-storage.ts` - D-06 MMKV slug persistence (lazy-require idiom)
- `apps/mobile/lib/festival-queries.ts` - `festivalKeys` factory + `unwrapOk`/`ApiResponseError`
- `apps/mobile/lib/festival-navigation.ts` - `leaveFestival(router)`
- `apps/mobile/components/ComingSoonTile.tsx` - Owned disabled-tile primitive
- `apps/mobile/app/(festival)/f/[festivalSlug].tsx` - The festival home screen (new; replaces the deleted `(festival)/index.tsx`)
- `apps/mobile/app/festivals/index.tsx` - `festivalKeys.all` query key; `handleEnter(slug)` persists + pushes `/f/:slug`
- `apps/mobile/locales/de/messages.po` / `locales/en/messages.po` - 8 new extracted+translated strings

## Decisions Made

- `formatDateRange`'s German-fallback selection is locale-prefix based (any `de*` locale), matching the app's de/en-only scope rather than building general locale negotiation.
- `unwrapOk`/`ApiResponseError` in `festival-queries.ts` are deliberately framework-free (no React import) so 05-06's save mutation can import them without pulling in any screen-layer dependency.
- Back affordance implemented as a `Stack.Screen` `headerLeft` (keeps the native header per UI-SPEC Scope note #7) with a custom handler calling `leaveFestival(router)`, rather than the `(auth)` screens' `headerShown:false` + inline Pressable pattern — the festival home keeps its native title/header, only the back handler's target changes.
- The 404 branch renders distinct "Festival not found" copy (not the reused transport-error copy), matching the plan's more specific acceptance criteria over the looser wording in one `must_haves.truths` backstop row; it also conditionally clears the persisted active-festival slug only when it matches the 404'd slug.

## Deviations from Plan

None — plan executed exactly as written. One environment step not explicitly itemized in the plan's action text was required to make `router.push(\`/f/${slug}\`)`/`router.replace('/festivals')` typecheck: `.expo/types/router.d.ts` (gitignored, Expo-generated) was stale from before this plan's new/moved routes existed, so it was regenerated via a throwaway `expo start` (killed once the file updated), mirroring 05-02's own documented fix for the same class of issue. No source file was changed by this step.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None — the screen renders real `getFestival(slug)` data; the four `ComingSoonTile`s are intentionally static per D-07/this phase's scope (Timetable/Lageplan/Cashless/News content lands in later phases).

## Next Phase Readiness

- `festivalKeys`, `unwrapOk`, `leaveFestival`, and `active-festival-storage.ts` are all ready for 05-05 (cold-start active-festival focus) and 05-06 (save mutation) to import directly — no re-implementation needed.
- The on-device manual UAT for this plan's Task 3 (`<manual>` verify step: seeded festival dates/place render, DE/EN toggle, wrong-slug error+Back) was **not run** in this headless execution — tracked as `.planning/WINDOWS.md` entry #16 (`unrun-verify`, phase 05). Must be cleared with a real Android device before Phase 5 ships, per the project's established Phase 3/4 UAT convention.
- No blockers for 05-04 (tab shell) or 05-05 (active-festival focus) — both consume this plan's shared helpers directly.

---
*Phase: 05-festival-selection-home*
*Completed: 2026-08-06*

## Self-Check: PASSED

All 7 created source files + this SUMMARY.md verified present on disk; all 3 task commits (`cb17b8c`, `809dbba`, `fe1e470`) verified in git log.
