---
phase: 5
reviewers: [codex]
reviewed_at: 2026-08-06T08:12:38Z
plans_reviewed: [05-01-PLAN.md, 05-02-PLAN.md, 05-03-PLAN.md, 05-04-PLAN.md, 05-05-PLAN.md, 05-06-PLAN.md, 05-07-PLAN.md]
---

# Cross-AI Plan Review — Phase 5

> Single-reviewer run: `--all` was requested, but only Codex was available on this host
> (the `claude` lane is skipped for independence when running inside Claude Code;
> gemini/opencode/qwen/cursor/antigravity/coderabbit are not installed and no local
> model server was reachable). Consensus below therefore reflects one grounded reviewer.

## Codex Review

# Cross-AI Plan Review — Phase 5

## Overall assessment

The phase is thoughtfully decomposed and generally aligned with the product decisions. The ordering—master data and tokens first, tracer screen second, navigation/primitives third, final screens last—is sensible.

However, several cross-plan integration defects would prevent the phase from compiling or satisfying its navigation behavior as currently written. The most serious are:

- Plan 05-01 does not modify the services that manually construct every festival response.
- Nullable dates conflict with mobile helpers and components that require strings.
- Plan 05-03 proposes invalid TanStack Query `initialData`.
- Cold-start back navigation has no reliable fallback.
- Home cannot select the Festivals screen’s “Alle” segment using only local component state.
- Mutation HTTP failures do not enter React Query’s `onError` path automatically.

Overall risk: **HIGH until these issues are corrected**, then likely MEDIUM due mainly to manual-only navigation coverage.

---

# Plan 05-01 — Festival master-data vertical

## Summary

The schema/contract/migration/test tracer is the right first step, and introducing a drizzle-zod base closes a real drift risk. As written, though, it does not actually complete the API vertical because the existing services manually project festival responses and are absent from `files_modified`.

## Strengths

- Correctly identifies that `festivalSchema` is presently hand-written at `packages/contracts/src/schemas.ts:6`, while the profile contract uses a derived schema at `packages/contracts/src/schemas.ts:31`.
- Correctly mirrors the established text-column workaround documented at `packages/db/src/schema/visitor-profile.ts:45-62`.
- Correctly preserves `supportedLocales` as an aggregate rather than pretending it is a festival column. It is built separately in `FestivalService.listAll()` at `apps/api/src/festival/festival.service.ts:96-115` and `MeService.listMyFestivals()` at `apps/api/src/me/me.service.ts:86-105`.
- The isolation test is an appropriate place to prove caller scoping. The existing query is genuinely session-derived at `apps/api/src/me/me.service.ts:77-82`, and the current test proves visitor 1 sees only festival A at `apps/api/test/festival-isolation.spec.ts:145-153`.
- Migration configuration and commands are real: `packages/db/drizzle.config.ts:7-14` and `packages/db/package.json:26-30`.

## Concerns

- **HIGH — The API services will omit all three fields.** Both festival reads explicitly construct response objects:

  - `FestivalService.getBySlug()` returns only the old fields at `apps/api/src/festival/festival.service.ts:39-46`.
  - `FestivalService.listAll()` does the same at `apps/api/src/festival/festival.service.ts:109-116`.
  - `MeService.listMyFestivals()` does the same at `apps/api/src/me/me.service.ts:99-106`.

  Neither service appears in this plan’s `files_modified`. Once `Festival` requires the new fields, API typechecking should fail; if it does not, runtime contract validation or tests will fail.

- **HIGH — Date nullability is unresolved and conflicts with downstream plans.** The plan adds `startDate` and `endDate` without `.notNull()`, so their inferred types will be `string | null`. Plan 05-03 defines `formatDateRange(start: string, end: string, ...)`, and Plan 05-04 passes festival dates directly into it. This is a compile-time mismatch and a runtime `Invalid Date` risk.
- **MEDIUM — The stated “cross-tenant fields never leak” test is mostly redundant unless it verifies row identity and values carefully.** The existing test already asserts only festival A is returned. Adding “festival B’s place is absent” is useful defense-in-depth, but the primary mechanism remains the `where(eq(myFestival.visitorId, visitorId))` filter at `apps/api/src/me/me.service.ts:82`.
- **MEDIUM — The migration verification command is not Windows-safe.** `ls ... | tail -1` relies on `tail`, which is not a normal PowerShell command in the documented environment.
- **LOW — `festivalInsertSchema` is not used by the seed.** It is reasonable as a shared schema export, but the plan should not imply the seed is validated through it unless it explicitly calls `.parse()`.

## Suggestions

- Add these files to Plan 05-01:

  - `apps/api/src/festival/festival.service.ts`
  - `apps/api/src/me/me.service.ts`

  Update all three manual projections with `startDate`, `endDate`, and `place`.

- Make nullability an explicit product/data decision:

  - Preferred: make dates required, use a safe migration sequence—add nullable columns, backfill all rows, then set `NOT NULL`.
  - Alternatively: retain nullable dates and define a localized “Dates coming soon” UI fallback throughout Plans 05-03/04/07.

- Add API typecheck/build to verification, not only the API test suite.
- Replace the POSIX migration check with a PowerShell-compatible or cross-platform Node check.
- Assert exact response fields for A and B on browse, exact A fields on mine, and exact A fields on slug lookup.

## Risk Assessment

**HIGH.** The current file scope cannot deliver its first must-have because all API response mappings omit the new fields. Date nullability also breaks downstream type assumptions.

---

# Plan 05-02 — Tokens, blur, and typed routes

## Summary

This is a clean foundation plan with limited scope. The proposed tokens match the repository’s existing semantic-token pattern, and `expo-blur` is consistent with the Expo dependency train. A few verification details should be tightened.

## Strengths

- Extends the existing token system instead of replacing it. The repo explicitly describes `packages/ui/src/tokens.ts` as the single shared system at lines 1-12.
- The new radius scale is justified because the current `radii` object only has generic and control/pill values at `packages/ui/src/tokens.ts:54-62`.
- The six color roles fill actual gaps in the current semantic palette at `packages/ui/src/tokens.ts:107-156`.
- `expo-blur` fits the installed Expo SDK 57 family shown at `apps/mobile/package.json:30-42`.
- Typed routes are currently absent from `apps/mobile/app.json:1-52`, so this is a real change rather than duplicated configuration.

## Concerns

- **MEDIUM — `tokens.radiiScale` is not guaranteed by merely exporting `radiiScale`.** The public `tokens` aggregate explicitly enumerates fields at `packages/ui/src/tokens.ts:158-169`. Task instructions mention public exposure but should directly require adding `radiiScale` to that object.
- **MEDIUM — Enabling typed routes does not necessarily generate fresh route declarations during plain `tsc`.** The mobile `tsconfig` consumes `.expo/types/**/*.ts` at `apps/mobile/tsconfig.json:12`. Those generated files may be stale unless Expo has regenerated them after route changes.
- **LOW — Version pinning after `pnpm add expo-blur` may require a second install.** Editing the version range manually without refreshing the lockfile can leave package metadata inconsistent.
- **LOW — The plan’s final verification mentions mobile typecheck but Task 2’s automated command does not run it.**

## Suggestions

- Explicitly require `radiiScale` inside the `tokens` aggregate.
- Install using the Expo-compatible command or an explicit range in one operation, then verify the lockfile.
- Add a route-type regeneration step appropriate for Expo SDK 57 before relying on `tsc`.
- Run `pnpm --filter @festipal/mobile typecheck` in Task 2 verification.

## Risk Assessment

**LOW–MEDIUM.** The changes are isolated and reversible; the main uncertainty is whether typed-route generation is actually refreshed before it is used as a safety check.

---

# Plan 05-03 — Tracer client and festival home

## Summary

The tracer-first idea is strong: it validates real festival data before broad UI work. The route shape and MMKV reuse fit the repository. The proposed query cache seeding and date handling, however, need correction.

## Strengths

- Correctly uses slug routing. The contract is explicitly `GET /festivals/:slug` at `packages/contracts/src/router.ts:30-35`.
- Correctly replaces the static festival placeholder, whose current entry route is not festival-specific at `apps/mobile/app/festivals/index.tsx:81-85`.
- Correctly mirrors the lazy MMKV approach at `apps/mobile/lib/avatar-storage.ts:17-31`.
- A pure `lib` test is appropriate because the Vitest configuration only includes `lib/**/__tests__` and deliberately cannot render RN components at `apps/mobile/vitest.config.ts:3-17`.
- Maintaining a back affordance improves the existing placeholder behavior at `apps/mobile/app/(festival)/index.tsx:26-29`.
- Static, disabled tiles stay within phase scope and avoid exposing `cashlessUrl`.

## Concerns

- **HIGH — The proposed `initialData` type is wrong.** Existing queries cache the full ts-rest response because the query function returns `apiClient.listFestivals()` at `apps/mobile/app/festivals/index.tsx:61-64`. Therefore `['festivals']` contains a response object with `status` and `body`, while `getFestival()` also returns a response object. The proposed helper returns a bare `Festival` as `initialData`, which is incompatible with the query function result.
- **HIGH — Nullable dates cannot be passed into `formatDateRange(string, string, ...)`.** Plan 05-01 makes the date columns nullable unless changed.
- **MEDIUM — `new Date('YYYY-MM-DD')` is parsed as UTC.** Users in negative UTC offsets can see the prior calendar day. Festival dates are date-only civil dates and should be formatted without a UTC shift.
- **MEDIUM — A 404 will normally be a successful React Query result, not `status === 'error'`.** The existing code already distinguishes React Query errors from non-200 ts-rest responses at `apps/mobile/app/festivals/index.tsx:131-155`. The festival screen needs the same explicit `data.status === 404` branch.
- **MEDIUM — `router.back()` alone does not satisfy cold-start behavior.** After Plan 05-05 performs `router.replace('/f/:slug')`, there may be no useful in-app back entry. A header back action must include a deterministic shell fallback.
- **LOW — The plan says “still runs” while using `initialData`; React Query considers initial data fresh or stale according to configuration.** With defaults it should refetch, but this should be explicit through `staleTime`/`initialDataUpdatedAt` or use `placeholderData`.

## Suggestions

- Prefer `placeholderData` containing a correctly shaped ts-rest response, or render a cached `Festival` separately while keeping the authoritative `getFestival` query response independent.
- Implement date-only parsing explicitly, for example by parsing `YYYY-MM-DD` components and constructing a local-noon date.
- Define null fallbacks if dates/place remain nullable.
- Branch explicitly on:

  - query pending,
  - transport error,
  - `data.status === 404`,
  - `data.status === 200`.

- Implement back as: `router.canGoBack() ? router.back() : router.replace('/festivals')`, or always use an explicit shell destination if that is the product contract.

## Risk Assessment

**HIGH.** The cache seeding and nullable-date issues are likely compile blockers. Back behavior also fails an important cold-start edge case.

---

# Plan 05-04 — FestivalCard and SegmentedControl

## Summary

Extracting presentation primitives before composing screens is sound. The card contract captures the required saved distinction and shared rendering. Interaction nesting and type/null behavior require more precise design.

## Strengths

- Correctly builds owned primitives, consistent with existing token-based components and the shared token package.
- Correctly avoids photo, ticket, wallet, and past/upcoming UI that is out of scope.
- Correctly makes saved state an input rather than embedding data fetching in the component.
- The non-bubbling save requirement directly addresses the double-action risk.
- `SegmentedControl` remains generic and caller-localized.

## Concerns

- **HIGH — The date props inherit the nullable mismatch from Plan 05-01.**
- **MEDIUM — The proposed hero can create nested press targets.** The “base card is a Pressable” plus an inner Save `Pressable` and a hero Button below the card is ambiguous. If the CTA is inside the outer Pressable, this creates nested interactive controls and bubbling/accessibility complications.
- **MEDIUM — `stopPropagation()` alone deserves device verification in React Native.** The mechanism exists on responder events, but nested Pressable behavior should be tested on both platforms, especially with the outer card also entering.
- **LOW — Locale formatting inside the presentational card couples it to date semantics.** Passing a preformatted caption may simplify testing and null handling, although the current design is still defensible.
- **LOW — No automated component tests exist.** The plan acknowledges later visual verification, but key interaction behavior remains manual-only.

## Suggestions

- Make the outer container a `View`, with a dedicated full-card Pressable layer or explicit Enter control, avoiding nested Pressables.
- Define the exact prop type around nullable fields or pass `formattedDateRange` from the caller.
- Add `accessibilityRole`, disabled/busy state for save, and duplicate-tap protection while saving.
- Include an explicit on-device check that Save fires only `onSave` and never `onEnter`.

## Risk Assessment

**MEDIUM.** Presentation scope is good, but interaction composition and date typing could cause implementation churn.

---

# Plan 05-05 — Global tab shell and cold-start focus

## Summary

Introducing the global shell here is consistent with the locked product decisions. The custom tab-bar approach is reasonable, but the plan overstates typed-route guarantees and does not fully specify redirect/back precedence.

## Strengths

- The current authenticated guard really registers only `festivals` and `(festival)` at `apps/mobile/app/_layout.tsx:220-223`, so the planned shell swap targets the correct location.
- The auth guard is genuinely four-state and profile-aware at `apps/mobile/app/_layout.tsx:43-47` and `apps/mobile/app/_layout.tsx:138-157`.
- Keeping `(tabs)` under the authenticated `Stack.Protected` preserves login-first behavior.
- The pending deep-link replay exists at `apps/mobile/app/_layout.tsx:179-190`, so it is correct to consider precedence.
- The existing old paths are real and must be updated: `apps/mobile/app/festivals/index.tsx:85` and `apps/mobile/app/(festival)/index.tsx:26`.
- Decorative disabled tabs avoid creating fake Phase 6 routes.

## Concerns

- **HIGH — Deep-link precedence is underspecified.** If the effect does:

  ```ts
  if (href) router.replace(href);
  const active = getActiveFestivalSlug();
  if (active) router.replace(`/f/${active}`);
  ```

  the active festival wins, contradicting the requirement that the deep link wins. The action must require an early `return`.
- **HIGH — Cold-start festival back behavior remains unsafe.** `router.replace('/f/:slug')` removes the shell entry. A later `router.back()` may exit the application or reach an unintended prior route rather than Festivals.
- **MEDIUM — The claim that `/festivals` literals are stale is inaccurate.** Route groups are URL-transparent. Moving the screen to `(tabs)/festivals.tsx` still exposes `/festivals`; the current `/festivals` path can remain a valid public route. The stale path is `/(festival)`, not necessarily `/festivals`.
- **MEDIUM — “No Friends/Profil routes” may create migration work in Phase 6 and weak keyboard/a11y semantics now.** This is acceptable as a product choice, but the decorative controls should be truly disabled, not active buttons with no-op handlers.
- **MEDIUM — Typed routes may be stale unless route declarations are regenerated.** The app includes generated `.expo/types` at `apps/mobile/tsconfig.json:12`; merely enabling the option does not prove fresh types.
- **MEDIUM — The default Home tab should be explicit.** Do not rely solely on declaration/file ordering; set `initialRouteName="home"`.
- **LOW — Logout leaves the active-festival slug intact.** On a shared device, a different account could inherit the previous account’s active festival focus. This is not authorization escalation because festival browse is gate-less, but it is cross-account UX state leakage.

## Suggestions

- Require:

  ```ts
  const href = consumePendingDestination();
  if (href) {
    router.replace(href);
    return;
  }
  ```

- Define a deterministic back/leave action to `/(tabs)/festivals` or `/festivals`, regardless of navigation history.
- Set `initialRouteName="home"` on Tabs.
- Store active festival per account or clear it on logout. The avatar store already demonstrates account-keyed local state at `apps/mobile/lib/avatar-storage.ts:34-47`.
- Use `disabled` on decorative Pressables, not only `accessibilityState`.
- Replace the blanket “no `/festivals` literal remains” criterion with “no route resolves to the deleted static festival placeholder.”
- Add logged-out deep-link UAT after the root registration change.

## Risk Assessment

**HIGH.** Navigation is core value infrastructure, and both redirect precedence and cold-start back behavior are presently incomplete.

---

# Plan 05-06 — Meine/Alle and optimistic save

## Summary

The screen composition correctly uses separate browse and caller-scoped endpoints and derives saved membership on the client. The optimistic mutation needs stronger response/error handling and cache-shape safeguards.

## Strengths

- Correctly uses the existing separate endpoints at `packages/contracts/src/router.ts:65-84`.
- Saved state is appropriately derived from `listMyFestivals`, whose server query is caller-scoped at `apps/api/src/me/me.service.ts:77-82`.
- Replacing the current session-local `savedIds` state at `apps/mobile/app/festivals/index.tsx:38` and `71-77` directly addresses restart persistence.
- `onSettled` invalidation keeps the server authoritative.
- Per-segment empty states and retaining logout cover meaningful UX gaps.

## Concerns

- **HIGH — ts-rest non-200 responses do not automatically trigger React Query `onError`.** The current app treats non-200 API results as successful query data at `apps/mobile/app/festivals/index.tsx:143-155`. Therefore a save mutation returning 404/409 will resolve unless `mutationFn` inspects `result.status` and throws. The promised rollback via `onError` will not occur automatically.
- **MEDIUM — The optimistic insertion does nothing when the mine cache is undefined.** The proposed updater returns `old` when no prior cache exists. This can happen if the mine query is still pending or has failed.
- **MEDIUM — Optimistic inserts need deduplication.** Rapid taps or an already-saved idempotent request can append the same festival twice.
- **MEDIUM — No visible save-error handling is defined.** A profile-required 409 should be unreachable after the profile guard, but session expiry, 404, and network failure remain possible.
- **LOW — The test command may not filter Vitest as intended.** This should be verified against the workspace script rather than assumed.

## Suggestions

- Make the mutation function reject non-200 responses explicitly:

  ```ts
  const response = await apiClient.saveFestival(...);
  if (response.status !== 200) throw new SaveFestivalError(response);
  return response;
  ```

- Initialize an absent mine cache with a correctly shaped successful ts-rest response.
- Deduplicate by festival ID.
- Disable the Save affordance for the currently mutating festival.
- Add localized error feedback and retry behavior.
- Test optimistic rollback as a pure cache-update helper if component testing remains unavailable.

## Risk Assessment

**MEDIUM–HIGH.** The primary flow can work, but failure behavior and optimistic guarantees are currently overstated.

---

# Plan 05-07 — Lean Home

## Summary

The lean Home scope is appropriate and avoids unsupported content. Its hero/rail logic is coherent, but navigation into the “Alle” segment is impossible with the local-only segment state defined in Plan 05-06.

## Strengths

- Reuses the caller-scoped endpoint rather than adding backend surface area.
- Keeps one primary hero and places overflow into a secondary rail.
- Correctly omits Artists, News, recommendations, social content, and ticket framing.
- Reuses the same active-festival entry mechanism.
- The single empty-state block avoids duplicated empty UI.

## Concerns

- **HIGH — The empty-state CTA cannot open the Festivals tab on “Alle.”** Plan 05-06 defines the selected segment as local state defaulting to Meine. Plan 05-07 only says to navigate to the Festivals tab. On mount, the screen will still show Meine, violating the CTA contract.
- **MEDIUM — “Earliest upcoming” is not fully specified.** It needs a stable date-only comparison, a definition of “today,” behavior for invalid/null dates, and tie-breaking.
- **MEDIUM — Saved order from the API is unspecified.** `MeService.listMyFestivals()` has no `orderBy` at `apps/api/src/me/me.service.ts:77-82`; the “first saved” fallback is therefore not deterministic.
- **MEDIUM — The rail card’s Save affordance is conceptually unnecessary.** Every item from `listMyFestivals` is saved. The component must receive `saved={true}` consistently.
- **LOW — No test covers hero selection.** This is a good candidate for a pure helper under `lib/`.

## Suggestions

- Define a shared mechanism for the selected segment:

  - Navigate with a typed search parameter such as `/festivals?segment=all`, and have the Festivals screen initialize/react to it; or
  - Store segment selection in a small shared navigation store.

- Extract and test `selectNextFestival(festivals, today)` with explicit rules:

  - valid start date on/after today,
  - ascending date,
  - deterministic tie-breaker,
  - fallback order such as saved timestamp or name.

- If “first-saved” is meaningful, expose/order by `my_festival.createdAt`; otherwise rename the fallback to something deterministic.
- Include the Home query in the save invalidation strategy—the shared `['me','festivals']` key already helps, but document that link.

## Risk Assessment

**MEDIUM.** The screen itself is straightforward, but the “Alle” CTA cannot work with the state architecture currently planned.

---

# Cross-plan completeness and ordering

## Strengths

- The dependency waves largely avoid file overlap.
- The backend tracer precedes consumers.
- Shared visual primitives precede screen composition.
- The shell precedes final Home and Festivals screens.
- Manual Android UAT is proportionate to the repository’s current test infrastructure, which explicitly excludes RN rendering at `apps/mobile/vitest.config.ts:5-16`.

## Cross-plan concerns

- **HIGH — Plan 05-01 must include API service projections before any client plan can compile.**
- **HIGH — Date nullability must be resolved once and carried consistently through Plans 05-01, 03, 04, and 07.**
- **HIGH — Cold-start navigation and back fallback span Plans 05-03 and 05-05 but neither owns the complete solution.**
- **HIGH — Cross-tab segment selection spans Plans 05-06 and 05-07 without a shared contract.**
- **MEDIUM — Query keys and ts-rest response wrappers are repeated informally.** A small query-key and response-unwrapping module would reduce cache-shape mistakes.
- **MEDIUM — There is no final phase-wide plan running the full suite and the complete acceptance flow after both Wave 4 plans land.**
- **MEDIUM — All seven plans have low confidence and very large token estimates.** This suggests the tasks are too verbose and implementation-sensitive. Several could be tightened by moving repeated UI requirements into shared references instead of restating them.

## Recommended plan revisions before execution

1. Expand 05-01 to update and verify both API services.
2. Lock date nullability and define migration/backfill plus UI fallback behavior.
3. Fix 05-03 cache seeding to use a correctly shaped response or `placeholderData`.
4. Define one explicit `leaveFestival()` behavior with a shell fallback.
5. Make deep-link replay return before active-festival redirect.
6. Define `/festivals?segment=all` or equivalent shared segment state.
7. Make save mutations reject non-200 responses and deduplicate optimistic cache updates.
8. Add a final integration gate after 05-06 and 05-07:

   - full monorepo typecheck/lint/tests,
   - clean install/build/export,
   - login → Home → Alle → save → Meine → enter → back,
   - force quit → active festival,
   - cold-start back → shell,
   - logout/login as another account,
   - DE/EN date and accessibility copy checks.

# Final Risk Assessment

**Overall risk: HIGH.**

The plan set has strong product alignment and useful decomposition, but it currently contains multiple concrete integration defects visible in the source. Most are straightforward to repair during planning; after those revisions, the remaining risk should fall to **MEDIUM**, driven primarily by Expo Router lifecycle behavior and the lack of automated React Native navigation/component tests.

---

## Consensus Summary

Only one prompt-fed, source-grounded reviewer (Codex, repo access, `file:line` evidence) ran, so this is a single-reviewer assessment rather than a multi-model consensus. Codex rates the phase **HIGH risk until revised, MEDIUM after fixes**.

### Agreed Strengths

- Tracer-first decomposition and wave ordering (master data → tracer → primitives/shell → screens) is sound, with largely non-overlapping file scopes.
- Plans are well grounded in the real codebase: correct slug routing per `packages/contracts/src/router.ts:30-35`, correct caller-scoped `listMyFestivals` query at `apps/api/src/me/me.service.ts:77-82`, correct reuse of the MMKV and token patterns.
- Scope discipline: no out-of-phase UI (photos, tickets, Artists/News), owned primitives per ADR-022, manual Android UAT proportionate to the RN-excluded Vitest setup.

### Agreed Concerns

1. **HIGH — 05-01 misses the API service projections.** `FestivalService.getBySlug()/listAll()` and `MeService.listMyFestivals()` manually construct responses (`apps/api/src/festival/festival.service.ts:39-46`, `:109-116`; `apps/api/src/me/me.service.ts:99-106`) and are absent from `files_modified` — the new fields (`startDate`, `endDate`, `place`) would never reach clients and typecheck should fail.
2. **HIGH — Date nullability is unresolved across 05-01/03/04/07.** Nullable columns vs. `formatDateRange(start: string, end: string)` is a compile-time mismatch and `Invalid Date` risk; also UTC parsing of `YYYY-MM-DD` shifts dates in negative offsets.
3. **HIGH — 05-03's `initialData` shape is wrong.** The `['festivals']` cache holds full ts-rest response objects (`apps/mobile/app/festivals/index.tsx:61-64`), not bare `Festival` values; use `placeholderData` or a correctly shaped response.
4. **HIGH — Cold-start back navigation and deep-link precedence are underspecified (05-03/05-05).** `router.replace('/f/:slug')` leaves no shell entry for `router.back()`; deep-link replay must `return` before the active-festival redirect or the wrong destination wins.
5. **HIGH — The Home empty-state CTA cannot select the "Alle" segment (05-06/05-07).** Segment selection is local component state defaulting to Meine; a shared contract (`/festivals?segment=all` param or shared store) is required.
6. **HIGH — Optimistic save rollback will not fire.** ts-rest non-200 responses resolve successfully (`apps/mobile/app/festivals/index.tsx:143-155`); the mutation must throw on `status !== 200` for React Query `onError` to roll back.

### Divergent Views

None — single reviewer.

### Recommended Next Step

Incorporate via `/gsd-plan-phase 5 --reviews`, prioritizing the eight plan revisions Codex lists under "Recommended plan revisions before execution" (expand 05-01's file scope, lock date nullability, fix cache seeding, define `leaveFestival()` fallback, deep-link early return, shared segment state, mutation error handling, final integration gate).
