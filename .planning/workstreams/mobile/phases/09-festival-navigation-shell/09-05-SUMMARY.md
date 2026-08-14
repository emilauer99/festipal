---
phase: 09-festival-navigation-shell
plan: 05
subsystem: ui
tags: [expo-router, react-native, tanstack-query, lingui, react-query]

# Dependency graph
requires:
  - phase: 09-02
    provides: "GET /festivals/:festivalId/friends (friendsInFestival contract op, z.array(friendSchema) response) — the endpoint this plan's two consumers call"
  - phase: 09-03
    provides: "The five-tab festival navigator, lib/festival-context.ts's useFestivalContext() — this plan's Dashboard/Friends tabs read the resolved Festival from it instead of re-querying"
  - phase: 09-04
    provides: "AppHeader / useHeaderClearance(), lib/app-chrome.ts's PUSH_SCREEN_ROUTES/resolveHeaderContext, the profil/friends-qr root-registration pattern this plan's friends-find follows"
provides:
  - "friendKeys.inFestival(festivalId) — the one query key shared by the Dashboard Crew StatTile and the Festival-Friends-Tab list, so their numbers can never disagree"
  - "StatTile — the reusable Dashboard tile primitive (icon+label eyebrow, value/note value row, tone, onPress, reserved trailing slot for 09-06)"
  - "The real Festival-Friends-Tab: sorted PersonRow list, three independently-worded empty states (D-17), literal transport-error-plus-retry"
  - "app/friends-find.tsx — the re-exported global Friends screen at a second, push-over navigation position (D-16)"
  - "friend-detail.tsx's cache read extended to friendKeys.inFestival(*) entries, not only friendKeys.list"
affects: [09-06-cashless]

# Actuals (#2632) — pairs with the plan's estimate to calibrate future estimates.
actuals:
  tokens: 7100
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A Dashboard stat tile reuses ONE query key for both its own tile and a sibling list screen (friendKeys.inFestival), instead of each consumer defining its own — the shared cache entry is what makes 'the tile's number and the list's length can never disagree' true by construction, not by convention."
    - "Two independently-worded empty states decided by TWO different queries' lengths (the global friendKeys.list decides which of two empty states shows, not the scoped friendKeys.inFestival intersection being rendered) — the same 'read the OTHER list's length to disambiguate' shape as any set-intersection UI."
    - "A push-over navigation position for an existing screen is a bare `export { default } from '...'` re-export file, registered as its own root-level Stack.Screen — zero duplicated logic, one screen works at two positions because Expo Router treats each registered route name as its own mount regardless of which file supplies the component."

key-files:
  created:
    - apps/mobile/components/StatTile.tsx
    - apps/mobile/app/friends-find.tsx
  modified:
    - apps/mobile/lib/friend-queries.ts
    - apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx
    - apps/mobile/app/(festival)/f/[festivalSlug]/friends.tsx
    - apps/mobile/app/friend-detail.tsx
    - apps/mobile/app/_layout.tsx
    - apps/mobile/lib/app-chrome.ts
    - apps/mobile/lib/__tests__/app-chrome.test.ts
    - apps/mobile/components/AppHeader.tsx
    - apps/mobile/locales/de/messages.po
    - apps/mobile/locales/en/messages.po

key-decisions:
  - "StatTile's 'optional trailing word' (UI-SPEC: value plus a nachgestelltes Wort in bodySm/textMuted) is implemented as an ALWAYS-shown reuse of the same `label` prop next to a numeric `value`, not exposed as a second caller-controlled prop — the plan's exact prop list has no such prop, and the Crew tile's own spec ('das nachgestellte Wort ist dasselbe Etikett') is satisfied without ever letting the word desync from the eyebrow tag. The separate `trailing: ReactNode` prop stays unset by this plan's Crew tile and is reserved for 09-06's Cashless entry, matching the plan's own 'hier bleibt es ungenutzt' note."
  - "The Crew StatTile's zero-count/error/pending states collapse into exactly three outcomes, not two: pending shows neither a value nor a note (no skeleton, no flashed 0); count===0, a transport error, and a non-200 response all collapse into the SAME 'Nobody yet' note (one retry affordance lives on the Friends tab, not a second inline error block on the Dashboard) — this needed a `friendsInFestivalPending` flag distinct from 'no numeric value', since 'no value' alone conflated pending with the error/zero case."
  - "The Festival-Friends-Tab's error state uses ONE literal copy (the project-wide transport-error-plus-retry text) for BOTH a genuine transport error and a non-200 response, rather than the two-variant transport/response split every other screen in this app uses — this is what the plan's action text specifies ('woertlich das projektweite Fehlerpaar... die Copy wird unveraendert... uebernommen'), a deliberate simplification for this one screen."
  - "friend-detail.tsx's cache read now searches every friendKeys.all-prefixed cache entry via getQueriesData, filtered to key[1] === 'list' | 'inFestival' — NOT a blind search of every friends-prefixed entry, since friendKeys.requests ({incoming,outgoing}, not an array) and friendKeys.search(q) (VisitorSummary[], no friendsSince field) would otherwise be false structural matches for a Friend shape."
  - "Typed routes for the new friends-find route required `npx expo customize tsconfig.json` (regenerates .expo/types/router.d.ts without starting the dev server) before `pnpm typecheck` passed — a build-tool step, not a code change, and .expo/ stays gitignored."

patterns-established:
  - "A Dashboard tile row: `flexDirection: 'row'`, `sp-5` gap, every tile `flex: 1` — distinct from ComingSoonTile's fixed grid `flexBasis`, established so a future 09-06 Cashless tile drops into the same row without new layout code."

requirements-completed: [FRND-07]

coverage:
  - id: D1
    description: "friendKeys.inFestival(festivalId) is one query-key factory entry, prefixed under the shared 'friends' scope so the existing friendKeys.all invalidation covers it; two different festivalIds produce different keys, the same festivalId is stable across calls"
    requirement: "FRND-07"
    verification:
      - kind: other
        ref: "cd apps/mobile && pnpm exec vitest run (270/270 incl. type-tracking.test.ts) && pnpm typecheck && pnpm lint — exit 0/0/0; grep -rn \"inFestival\" apps/mobile/app apps/mobile/lib shows the one factory entry plus the two consumer call sites"
        status: pass
    human_judgment: false
  - id: D2
    description: "The Dashboard's Crew StatTile always renders (D-11), reads friendKeys.inFestival(festival.id) — the SAME key the Friends tab reads — shows a count above 0 or a 'Nobody yet' sentence otherwise, and taps into the Friends tab via router.navigate"
    requirement: "FRND-07"
    verification:
      - kind: other
        ref: "cd apps/mobile && pnpm exec vitest run && pnpm typecheck && pnpm lint — exit 0/0/0; StatTile.tsx exports StatTile/StatTileProps, no fixed flexBasis"
        status: pass
      - kind: manual_procedural
        ref: "09-05-PLAN.md Task 2 human-check point 8 (Dashboard tile count matches list length, 0-state shows a sentence not a null) — NOT run on device this session"
        status: unknown
    human_judgment: true
    rationale: "No RN component-test harness exists in this project — screen-level visual truth (does the tile actually match the list on a real device) needs on-device UAT, recorded as a WINDOWS.md unrun-verify entry rather than blocking completion, matching 09-03/09-04 precedent."
  - id: D3
    description: "The Festival-Friends-Tab shows the intersection as a sorted PersonRow list, three independently-worded empty states (D-17) decided by the GLOBAL friend list's length not the intersection's own length, and the literal transport-error-plus-retry pattern — no presence/location/chat surface anywhere on the tab (ADR-014, T-09-17, T-09-20)"
    requirement: "FRND-07"
    verification:
      - kind: other
        ref: "cd apps/mobile && pnpm exec vitest run && pnpm typecheck && pnpm lint — exit 0/0/0; grep confirms PersonRow calls pass only profile/onPress/accessibilityLabel; computeViewState's emptyNoFriends/emptyNotSaved branches read globalListQuery.data.body.length, not intersectionQuery's own length before the final data branch"
        status: pass
      - kind: manual_procedural
        ref: "09-05-PLAN.md Task 2 human-check points 1-7, 9 (three distinct empty states on real accounts, no presence/chat surface, tap-through to friend-detail with content, error+retry against the dev API, dark mode) — NOT run on device this session"
        status: unknown
    human_judgment: true
    rationale: "Same structural limitation as D2 — the three-empty-state disambiguation and the absence of any presence signal are screen-level visual/behavioral truths this project only verifies on a real device (WINDOWS.md unrun-verify entry recorded)."
  - id: D4
    description: "app/friends-find.tsx re-exports the SAME global Friends screen at a second, push-over navigation position (D-16), registered as its own root-level Stack.Screen with headerShown:false, added to PUSH_SCREEN_ROUTES/AppHeader's push-title map, and the Festival-Friends-Tab's full-width 'Find friends' pill (in every state) pushes it"
    requirement: "FRND-07"
    verification:
      - kind: unit
        ref: "apps/mobile/lib/__tests__/app-chrome.test.ts — new case: resolveHeaderContext(['friends-find']) resolves the push state with route 'friends-find'"
        status: pass
      - kind: other
        ref: "cd apps/mobile && pnpm exec vitest run && pnpm typecheck && pnpm lint && pnpm exec lingui compile --strict — exit 0/0/0/0; git diff apps/mobile/app/_layout.tsx shows only the new Stack.Screen registration, deep-link capture block and AUTH_FLOW_PATHS unchanged; friends-find.tsx contains no JSX, only a re-export"
        status: pass
      - kind: manual_procedural
        ref: "09-05-PLAN.md Task 3 human-check (pill visible in every state, push-over opens with back arrow + Friends title + no FloatingNav, identical search/requests/QR behavior at both positions, Back returns to the festival tab, max font scale) — NOT run on device this session"
        status: unknown
    human_judgment: true
    rationale: "Navigation stack behavior (back-target, tab-bar visibility, header state across two mount positions) is exactly the class of truth this project's own precedent (09-03/09-04) defers to on-device UAT rather than blocks completion on."

# Metrics
duration: ~45min
completed: 2026-08-14
status: complete
---

# Phase 9 Plan 5: Festival Friends Tab Summary

**The Festival-Friends-Tab goes from a stub to real content: the friends-∩-saved-festival intersection as a sorted list with three independently-worded empty states, a Dashboard Crew tile reading the same query key, and a "Find friends" push-over entry that re-exports the existing global Friends screen instead of duplicating it.**

## Performance

- **Duration:** ~45 min across 3 tasks
- **Started:** 2026-08-14T09:20:00Z (approx.)
- **Completed:** 2026-08-14T09:37:00Z (approx.)
- **Tasks:** 3/3
- **Files modified:** 12 unique files across 3 commits (`friends.tsx` touched in both Task 2 and Task 3)

## Accomplishments

- `friendKeys.inFestival(festivalId)` — one new query-key factory entry, prefixed under the shared `'friends'` scope, read by BOTH the Dashboard's new Crew `StatTile` and the Festival-Friends-Tab's list — one cache entry, one invalidation, the two numbers can never disagree.
- `StatTile` — the reusable Dashboard tile primitive: icon+label eyebrow row, a value/note value row (a numeric value with its label reused as a trailing word, or a short sentence, or nothing while pending), `tone="brand"|"default"`, `flex: 1` in a row of at most two tiles, `View`/`Pressable` per `PersonRow`'s interactivity rule. The Dashboard's Crew tile is `tone="default"` and always renders (D-11) — a friend count is real data, never a "coming soon" placeholder.
- The Festival-Friends-Tab is real: two queries (the new intersection key plus the existing `friendKeys.list`), a sorted `PersonRow` list (`sortFriendsByDisplayName`, unchanged), and THREE independently-worded empty states — no friends at all, friends-but-none-saved-this-festival, and the literal transport-error-plus-retry pattern — decided by the GLOBAL friend list's length, never the intersection's own length (D-17). No row ever carries a presence, location or distance prop (ADR-014, T-09-17); no chat/DM entry exists on the tab (T-09-20).
- `friend-detail.tsx`'s cache read is extended from `friendKeys.list` alone to every `friendKeys.all`-prefixed entry whose scope is `list` or `inFestival` — opening a row from the Festival-Friends-Tab finds its entry with no second network call (Phase-7 D-04: no foreign-profile detail endpoint), filtered so `friendKeys.requests`/`friendKeys.search` entries can never be mistaken for a `Friend`.
- `app/friends-find.tsx` re-exports `(tabs)/friends.tsx`'s default export unchanged — a second navigation position for the SAME screen (D-16), registered as its own root-level `Stack.Screen` (`headerShown: false`, matching `profil`/`friends-qr`), added to `PUSH_SCREEN_ROUTES`/`AppHeader`'s push-title map (reusing the existing `Friends` msgid). The tab's full-width "Find friends" pill renders in every state — list, both empty states, error — and pushes this route.
- New DE/EN Lingui entries for the three empty-state heading/body pairs, the pill label, and the Crew tile's label/zero-state sentence; `lingui compile --strict` passes.

## Task Commits

Each task was committed atomically:

1. **Task 1: Query-key, StatTile, Dashboard Crew tile** - `3695a64` (feat)
2. **Task 2: Festival Friends tab — list, three empty states, error state** - `268898a` (feat)
3. **Task 3: "Find friends" push entry, i18n catalogs** - `864d382` (feat)

**Plan metadata:** _pending — this SUMMARY's own commit_

## Files Created/Modified

- `apps/mobile/lib/friend-queries.ts` - Added `friendKeys.inFestival(festivalId)`
- `apps/mobile/components/StatTile.tsx` (new) - The Dashboard tile primitive
- `apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx` - Crew `StatTile` row added below the key-fact block
- `apps/mobile/app/(festival)/f/[festivalSlug]/friends.tsx` - Real content: list, three empty states, error state, "Find friends" pill
- `apps/mobile/app/friend-detail.tsx` - `findCachedFriend` extended to search `friendKeys.inFestival(*)` entries too
- `apps/mobile/app/friends-find.tsx` (new) - Re-export of the global Friends screen at a push position
- `apps/mobile/app/_layout.tsx` - `friends-find` Stack.Screen registration (`headerShown: false`)
- `apps/mobile/lib/app-chrome.ts` - `friends-find` added to `PUSH_SCREEN_ROUTES`/`PushScreenRoute`
- `apps/mobile/lib/__tests__/app-chrome.test.ts` - New case for the `friends-find` push route
- `apps/mobile/components/AppHeader.tsx` - `friends-find` added to the push-title map (`Friends`)
- `apps/mobile/locales/{de,en}/messages.po` - Six new msgid/msgstr pairs (empty states, pill label, Crew tile copy)

## Decisions Made

See `key-decisions` in the frontmatter for full reasoning. In short: `StatTile`'s "trailing word" is a built-in reuse of `label` next to `value`, not a second caller-controlled prop, keeping the exact prop list the plan specified; the Crew tile distinguishes pending from error/zero with an explicit `friendsInFestivalPending` flag so the tile shows neither value nor note while genuinely loading; the Friends tab's error state uses one literal copy for both transport and non-200 failures per the plan's own wording; `friend-detail.tsx`'s cache search is scope-filtered (`key[1] === 'list' | 'inFestival'`) to avoid false structural matches from `friendKeys.requests`/`friendKeys.search`; typed routes needed a `npx expo customize tsconfig.json` regeneration (build-tool step, `.expo/` stays gitignored) before `friends-find` typechecked.

## Deviations from Plan

None beyond the decisions recorded above, which were all judgment calls needed to fill in details the plan intentionally left to the executor (the exact `StatTile` trailing-word mechanism, the three-vs-two Crew-tile outcome split, and the typed-routes regeneration step) — no architectural change, no scope creep.

## Issues Encountered

- `pnpm typecheck` initially failed on `router.push('/friends-find')`/`router.push`/`Stack.Screen name="friends-find"` because Expo Router's typed-routes declaration file (`.expo/types/router.d.ts`) had not regenerated for the newly created route. Resolved with `npx expo customize tsconfig.json` (documented by Expo as the no-dev-server way to regenerate typed routes for CI/typecheck). Not a code defect — `.expo/` is gitignored and regenerates automatically once a dev server or this command runs.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None new. The pre-existing Known Stub from 09-03 (`(festival)/f/[festivalSlug]/friends.tsx`'s "This tab isn't built yet." placeholder, WINDOWS.md #41) is RESOLVED by this plan — marked `fixed` in `.planning/WINDOWS.md`.

## Threat Flags

None beyond the plan's own pre-declared threat register (T-09-17 through T-09-21), all mitigated as specified:
- T-09-17 (presence signal via the tab) — `PersonRow` calls carry only `profile`/`onPress`/`accessibilityLabel`; no location/distance/presence prop exists to pass.
- T-09-18 (tenant scope of the query) — `festivalId` comes exclusively from `useFestivalContext()`'s resolved `Festival`, never a client-editable value; both queries are `enabled` only once that context is populated.
- T-09-19 (second navigation position elevating privilege) — `friends-find` is a bare re-export inside the same authenticated `Stack.Protected` block as every other push screen; no second implementation, no new deep-link surface.
- T-09-20 (chat/DM surface) — no chat or messaging entry exists anywhere on the tab.
- T-09-21 (cache after account switch, accepted) — `friendKeys.inFestival`'s prefix is covered by the existing cross-account cache reset unchanged.

## Next Phase Readiness

- FRND-07 is complete: the tab shows exactly the friends-∩-saved-festival intersection, never a presence/location signal, with the Dashboard tile and the list reading one shared cache entry.
- 09-06 (Cashless) needs to know: `StatTile`'s `trailing: ReactNode` prop is unused by this plan and free for the Cashless entry; the Dashboard's tile row style (`flexDirection: 'row'`, `sp-5` gap, `flex: 1` tiles) already exists in `index.tsx` and a second tile drops straight into it.
- Outstanding before this plan is fully device-verified: Task 2's 9-point and Task 3's 6-point `<human-check>` blocks — both recorded as new `WINDOWS.md` unrun-verify entries (#44, #45) this session, not run on device.

---
*Phase: 09-festival-navigation-shell*
*Completed: 2026-08-14*

## Self-Check: PASSED

- FOUND: `apps/mobile/components/StatTile.tsx`
- FOUND: `apps/mobile/app/friends-find.tsx`
- FOUND: `apps/mobile/lib/friend-queries.ts`
- FOUND: `apps/mobile/app/(festival)/f/[festivalSlug]/index.tsx`
- FOUND: `apps/mobile/app/(festival)/f/[festivalSlug]/friends.tsx`
- FOUND: `apps/mobile/app/friend-detail.tsx`
- FOUND: `apps/mobile/app/_layout.tsx`
- FOUND: `apps/mobile/lib/app-chrome.ts`
- FOUND: `apps/mobile/lib/__tests__/app-chrome.test.ts`
- FOUND: `apps/mobile/components/AppHeader.tsx`
- FOUND: commit `3695a64`
- FOUND: commit `268898a`
- FOUND: commit `864d382`
