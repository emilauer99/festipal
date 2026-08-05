---
phase: 5
reviewers: [codex]
reviewed_at: 2026-08-05T20:21:48Z
plans_reviewed: [05-01-PLAN.md, 05-02-PLAN.md, 05-03-PLAN.md, 05-04-PLAN.md, 05-05-PLAN.md, 05-06-PLAN.md, 05-07-PLAN.md]
---

# Cross-AI Plan Review — Phase 5

> Reviewed by **1 external AI system** (Codex, `codex-cli 0.146.1`, source-grounded with repo access).
> Claude was skipped for reviewer independence (this session is Claude Code). Install a second
> CLI (Gemini/Qwen) and re-run `/gsd-review --phase 5 --all` for genuine multi-model consensus.

## Codex Review

## 1. Summary

The plan set is thoughtfully decomposed and strongly aligned with the product decisions, but it is not yet execution-safe. The wave DAG is broadly sound, the client/server responsibilities are mostly correct, and the plans preserve gate-less entry while keeping saved festivals caller-scoped. However, several load-bearing implementation details are missing or internally inconsistent: the API mapping services are omitted from the D-08 contract change, nullable master data conflicts with downstream UI assumptions, ts-rest non-2xx responses will not trigger TanStack Query error states, cold-start navigation can strand users or leak navigation state across accounts, and the Home empty-state cannot actually select the “Alle” segment. These issues are fixable without redesigning the phase, but Plans 01, 03, 05, and 07 should be amended before execution.

## 2. Strengths

- The overall dependency ordering is sensible:

  - Wave 1 establishes the database/contract and visual foundations.
  - Plan 03 proves a vertical client tracer before the larger route restructure.
  - Plans 04 and 05 can proceed in parallel without direct file overlap.
  - Plans 06 and 07 compose the primitives and shell produced earlier.

- The plans correctly identify that `getFestival` is slug-keyed rather than UUID-keyed. The existing contract defines `GET /festivals/:slug` with a string slug at [packages/contracts/src/router.ts:30](C:/Users/Emil/Documents/Privat/Projekte/festipal/packages/contracts/src/router.ts:30), while save remains UUID-keyed at [packages/contracts/src/router.ts:71](C:/Users/Emil/Documents/Privat/Projekte/festipal/packages/contracts/src/router.ts:71). Avoiding a redundant `getFestivalById` endpoint is a good choice.

- Moving `festivalSchema` to a Drizzle-derived base is justified. It is currently a hand-written `z.object` at [packages/contracts/src/schemas.ts:6](C:/Users/Emil/Documents/Privat/Projekte/festipal/packages/contracts/src/schemas.ts:6), while the database already uses `createSelectSchema` patterns elsewhere. This meaningfully improves schema/contract drift detection.

- Saved-state composition is correctly kept on the client. The existing API intentionally separates global browse from caller-scoped saved festivals at [packages/contracts/src/router.ts:65](C:/Users/Emil/Documents/Privat/Projekte/festipal/packages/contracts/src/router.ts:65) and [packages/contracts/src/router.ts:80](C:/Users/Emil/Documents/Privat/Projekte/festipal/packages/contracts/src/router.ts:80).

- The caller-scoping mechanism for “Meine Festivals” is real and server-side. `MeService.listMyFestivals` joins through `my_festival` and filters by the session-derived visitor ID at [apps/api/src/me/me.service.ts:77](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/api/src/me/me.service.ts:77). The existing integration test also proves one visitor sees only the festival they saved at [apps/api/test/festival-isolation.spec.ts:145](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/api/test/festival-isolation.spec.ts:145).

- The plans correctly preserve the distinction between protected access and tenant membership. Browse is deliberately global for authenticated visitors, as demonstrated by the test expecting both festivals from `GET /festivals` at [apps/api/test/festival-isolation.spec.ts:164](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/api/test/festival-isolation.spec.ts:164).

- The route restructure accounts for known stale paths. The current list pushes the static `/(festival)` route at [apps/mobile/app/festivals/index.tsx:81](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/mobile/app/festivals/index.tsx:81), and the root guard explicitly registers `festivals` and `(festival)` at [apps/mobile/app/_layout.tsx:220](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/mobile/app/_layout.tsx:220).

- The test strategy is realistic about current mobile infrastructure: pure helpers receive Vitest coverage, API behavior receives integration coverage, and navigation/visual behavior is assigned to device UAT.

- Avoiding `Intl.DateTimeFormat.formatRange()` is a reasonable defensive choice for Hermes, and extracting the formatter into a pure helper is good testability hygiene.

- The visual scope is disciplined: no Artists, tickets, rich dashboard, unsave behavior, or in-festival tab bar. The custom navigation and owned primitives remain consistent with ADR-022.

## 3. Concerns

- **HIGH — Plan 01 omits required API service changes.**  
  Extending `Festival` makes the current explicit response mappings incomplete. `FestivalService.getBySlug` returns a manually constructed object at [apps/api/src/festival/festival.service.ts:39](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/api/src/festival/festival.service.ts:39), `listAll` constructs another at [apps/api/src/festival/festival.service.ts:109](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/api/src/festival/festival.service.ts:109), and `MeService.listMyFestivals` constructs a third at [apps/api/src/me/me.service.ts:99](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/api/src/me/me.service.ts:99). None currently includes dates or place. Plan 01’s `files_modified` and tasks omit both service files, even though its must-have says all three endpoints return the fields.

- **HIGH — Nullable master data contradicts downstream types and success criteria.**  
  Plan 01 explicitly makes all three columns nullable, but Plans 03, 04, and 07 call `formatDateRange(startDate, endDate, locale)` as though both dates are guaranteed strings. The current table already has required identity fields marked `.notNull()` at [packages/db/src/schema/festival.ts:13](C:/Users/Emil/Documents/Privat/Projekte/festipal/packages/db/src/schema/festival.ts:13), so the choice is material. Existing or partially configured festivals can return null dates/place, leading to type errors or invalid UI. The plan’s claim that every festival row provides usable dates/place is therefore not satisfied.

- **HIGH — Plan 03’s query error mechanism is wrong for ts-rest responses.**  
  The shared client returns typed `{status, body}` responses; existing code explicitly distinguishes transport errors from successful HTTP responses whose status is not 200 at [apps/mobile/app/festivals/index.tsx:131](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/mobile/app/festivals/index.tsx:131) and [apps/mobile/app/festivals/index.tsx:143](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/mobile/app/festivals/index.tsx:143). A `getFestival` 404 will normally resolve as query success with `status: 404`, not enter TanStack Query’s `error` state. Plan 03 must explicitly branch on `data.status` or use a query function that throws for non-200 responses.

- **HIGH — Plan 03’s proposed `initialData` shape is inconsistent.**  
  `apiClient.getFestival()` returns a ts-rest response envelope, while the proposed cache helper returns a bare `Festival`. Supplying a bare festival as `initialData` and then reading `festivalQuery.data.body` is type-inconsistent. The plan should either unwrap all query functions to `Festival`, or provide `{status: 200, body: cachedFestival, headers: ...}` in the exact client result shape.

- **HIGH — Cold-start festival back navigation is not defined safely.**  
  Plan 05 uses `router.replace('/f/:slug')` on cold start, then Plan 03 relies on `router.back()`. Because replacement may leave no tab-shell entry beneath the festival screen, Back can exit the app or land somewhere unintended. That fails FEST-04’s explicit “return to the list” requirement. The current placeholder uses an explicit list route rather than history-only navigation at [apps/mobile/app/(festival)/index.tsx:26](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/mobile/app/(festival)/index.tsx:26).

- **HIGH — The Home empty-state cannot open the Festivals tab on “Alle” as specified.**  
  Plan 06 keeps the selected segment as local state defaulting to `meine`. Plan 07 merely navigates to the Festivals tab. Without a route parameter or shared state, mounting/focusing that screen will still show Meine. The claimed “CTA opens Festivals on Alle” therefore has no implementation link.

- **MEDIUM — Active-festival state is not account-scoped or cleared on logout.**  
  The proposed MMKV record stores only a global slug. The current logout flow forces the root state unauthenticated regardless of network outcome at [apps/mobile/app/festivals/index.tsx:43](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/mobile/app/festivals/index.tsx:43), but none of the plans clears the active slug. A second user on the same device can be redirected into the previous user’s festival. Public festival identity prevents privilege escalation, but it is incorrect cross-account UX and retained user state.

- **MEDIUM — The “cold-start only” redirect is not actually limited to cold starts.**  
  The proposed effect runs whenever this mounted root changes to authenticated. The current replay effect already runs on that transition at [apps/mobile/app/_layout.tsx:186](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/mobile/app/_layout.tsx:186). After OTP login or profile completion in the same process, an old active slug may override the intended post-login Home landing. A ref prevents repetition, but does not distinguish bootstrap authentication from later authentication.

- **MEDIUM — Dynamic paths may not satisfy Expo typed routes.**  
  Plan 02 enables typed routes, but later plans use template strings such as ``router.push(`/f/${slug}`)``. Expo typed routes generally work more reliably with an object such as `{ pathname: '/f/[festivalSlug]', params: { festivalSlug: slug } }`. The repository currently has typed routes disabled, as `app.json` contains no `experiments` block around [apps/mobile/app.json:29](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/mobile/app.json:29), so this needs to be verified after route generation.

- **MEDIUM — Date-only parsing can shift dates by timezone.**  
  `new Date('2026-08-13')` parses an ISO date as UTC. In negative UTC offsets it can display the previous calendar date. Festival dates are calendar dates, not instants. The formatter should parse year/month/day into a local `Date`, or format with `timeZone: 'UTC'`.

- **MEDIUM — Optimistic save does not treat HTTP errors as mutation failures.**  
  Like queries, `apiClient.saveFestival()` resolves typed 404/409 responses. TanStack’s `onError` rollback only runs for thrown transport failures unless `mutationFn` checks `result.status` and throws for non-200. `onSettled` invalidation eventually repairs the cache, but rejected saves will briefly appear successful and no localized error is planned.

- **MEDIUM — Migration execution is marked autonomous despite an external prerequisite.**  
  Plan 01 Task 2 requires a reachable Neon URL. The config reads `DATABASE_URL_UNPOOLED` or `DATABASE_URL` at [packages/db/drizzle.config.ts:12](C:/Users/Emil/Documents/Privat/Projekte/festipal/packages/db/drizzle.config.ts:12), and the seed explicitly fails if neither exists at [packages/db/scripts/seed.ts:15](C:/Users/Emil/Documents/Privat/Projekte/festipal/packages/db/scripts/seed.ts:15). The plan should distinguish migration generation, which is local, from applying/seed operations requiring configured external state.

- **MEDIUM — “Cross-tenant leakage” terminology is overstated for the new fields.**  
  Dates and place are public festival identity returned by global browse and slug lookup. The true isolation property under test is that `GET /me/festivals` only returns the caller’s saved rows. The repository explicitly documents browse as unscoped at [apps/api/test/festival-isolation.spec.ts:164](C:/Users/Emil/Documents/Privat/Projekte/festipal/apps/api/test/festival-isolation.spec.ts:164). Testing absence of festival B’s values is useful, but it is membership/caller scoping rather than field-level tenant confidentiality.

- **LOW — Home’s “earliest upcoming” algorithm is underspecified.**  
  It should define “upcoming” using a calendar date and explicitly exclude past festivals. “Else first saved” also needs stable ordering, since neither current API list advertises an order.

- **LOW — Verification commands are shell-specific.**  
  Plan 01 uses `ls ... | tail -1`, but the supplied environment is PowerShell. This should use a cross-platform Node check or native PowerShell.

- **LOW — Estimates are disproportionately large and uniformly low-confidence.**  
  Seven plans totaling hundreds of thousands of tokens for a modest vertical slice suggests excessive ceremony. The detailed threat registers for purely visual primitives add little value compared with resolving the concrete response-shape and navigation issues.

## 4. Suggestions

- Amend Plan 01 to include:

  - `apps/api/src/festival/festival.service.ts`
  - `apps/api/src/me/me.service.ts`
  - Explicit mappings for `startDate`, `endDate`, and `place` in all three returned shapes.
  - API and contract typechecks after those edits.

- Resolve master-data nullability explicitly:

  - Prefer required `startDate`, `endDate`, and `place` if every listed festival must meet FEST-01.
  - Use a two-step migration if existing rows exist: add nullable columns, backfill, then apply `NOT NULL`.
  - If nullable is intentional, make the contract and every UI component handle missing facts with localized fallbacks and omit invalid separators.

- Normalize API query functions. For example, introduce a small helper that:

  - Returns `body` for status 200.
  - Throws a typed application error for 404/409/other statuses.
  - Lets queries consistently use `Festival` or `Festival[]` rather than mixed response envelopes.

- Make festival-home cache seeding type-consistent:

  - Either query bare `Festival` values and seed a bare `Festival`.
  - Or seed the complete ts-rest response envelope.
  - Do not mix these approaches.

- Define navigation behavior for both entry modes:

  - Normal card entry can push the detail over the current shell.
  - Cold-start focus should still establish a deterministic shell destination beneath it, or the Back action should explicitly replace/navigate to `/(tabs)/festivals`.
  - Decide whether leaving the active festival clears the persisted focus.

- Scope active-festival storage to the authenticated account, or clear it on logout. Also validate that the persisted slug still exists; on 404, clear it and return to the shell.

- Separate “initial authenticated bootstrap” from later auth transitions. Read the active slug during initial bootstrap only, after pending deep-link precedence is resolved.

- Add a route parameter for segment selection, such as:

  ```ts
  router.navigate({
    pathname: '/festivals',
    params: { segment: 'all' },
  });
  ```

  Then have the Festivals screen consume and apply that parameter on focus. This allows Home’s empty CTA to genuinely open Alle.

- Use typed dynamic route objects:

  ```ts
  router.push({
    pathname: '/f/[festivalSlug]',
    params: { festivalSlug: slug },
  });
  ```

- Parse date-only values without timezone drift and add tests in at least one negative-offset timezone. Also test null/invalid inputs if columns remain nullable.

- Make save mutation status-aware. Throw or return a discriminated outcome for non-200 responses, roll back immediately, and show localized feedback. Offline mutation queuing remains out of scope, but the plan should explicitly state that offline saves do not persist and will fail/reconcile.

- Add a logout/cross-account UAT case and a deleted-active-festival cold-start case.

- Rename the security assertions to accurately describe caller-scoped saved-list isolation. Retain the tests, but avoid implying public `place` or dates are confidential tenant data.

- Move Neon application to an explicit environment-gated step. Generate and inspect the migration autonomously; apply and seed only when the configured target is known.

## 5. Risk Assessment

**Overall risk: HIGH**

The architecture and scope are good, but the current plans contain several issues likely to cause either immediate typecheck failures or user-visible navigation defects: missing API mapping edits, incompatible nullable field assumptions, incorrect ts-rest error handling, inconsistent query cache shapes, and a cold-start Back path that may not return to the festival list. These are concentrated amendments rather than fundamental design problems. Once Plans 01, 03, 05, 06, and 07 incorporate the corrections above, the phase should drop to medium risk, with most remaining uncertainty limited to Expo Router behavior and on-device visual tuning.

---

## Consensus Summary

Only one independent reviewer ran (Codex), so this is a single-reviewer verdict rather than a
cross-model consensus. Codex's review is source-grounded (file:line citations verified against the
actual repo), which weights it well above an impressionistic pass. Overall verdict: **HIGH risk as
written** — good architecture and scope, but ~5 load-bearing amendments needed in Plans 01, 03, 05,
06, 07 before execution is safe.

### Highest-priority concerns (HIGH severity)

1. **Plan 01 omits the API mapping services.** Adding `startDate`/`endDate`/`place` to `Festival` requires editing all three explicit response mappings — `festival.service.ts` (`getBySlug`, `listAll`) and `me.service.ts` (`listMyFestivals`) — but those files are absent from Plan 01's `files_modified`. Endpoints would silently omit the new fields.
2. **Nullable master data contradicts the UI contract.** Plan 01 makes the new columns nullable, but Plans 03/04/07 call `formatDateRange(startDate, endDate, …)` assuming non-null strings. Decide: required columns (+ backfill migration) vs. nullable with localized fallbacks everywhere.
3. **ts-rest error handling is wrong (Plan 03 & save mutation).** The shared client resolves non-2xx as `{status, body}` **success**, not a thrown error. A 404/409 will not trigger TanStack Query `error`/`onError` states unless the query/mutation fn branches on `data.status` and throws. Affects both the festival query and the optimistic save rollback.
4. **Inconsistent query cache shape (Plan 03).** `initialData` is seeded as a bare `Festival` but read as `data.body` (envelope). Pick one shape end-to-end.
5. **Cold-start Back can strand the user (Plan 05 × 03).** `router.replace('/f/:slug')` on cold start + `router.back()` for return may leave no tab-shell beneath the festival screen → Back exits the app, failing FEST-04's "return to the list".
6. **Home empty-state can't open Festivals on "Alle" (Plan 06 × 07).** Segment is local state defaulting to `meine`; Plan 07 just navigates to the tab. Needs a route param / shared state for the CTA to actually land on Alle.

### Notable MEDIUM concerns

- Active-festival slug is global, not account-scoped, and not cleared on logout → second user on the same device can be redirected into the previous user's festival.
- "Cold-start only" redirect actually fires on every unauth→auth transition (incl. post-OTP / post-profile), potentially overriding the intended post-login Home landing.
- Date-only parsing (`new Date('2026-08-13')`) is UTC → off-by-one calendar date in negative UTC offsets. Parse to local or format with `timeZone: 'UTC'`.
- Expo typed routes work more reliably with `{ pathname, params }` objects than template strings; typed routes are currently disabled in `app.json`.
- Migration/seed marked autonomous but require a reachable Neon URL — split local generation from env-gated apply/seed.
- "Cross-tenant leakage" framing is overstated for dates/place (public identity); the real isolation property is caller-scoped `/me/festivals`.

### Divergent Views

N/A — only one reviewer ran. Re-run with a second CLI to surface disagreement.

### Agreed Strengths (single reviewer)

- Sound wave DAG and tracer-first vertical (Plan 03 proves the client vertical before the route restructure).
- Correctly uses slug-keyed `getFestival` (no redundant by-id endpoint) and keeps saved-state composition on the client.
- Caller-scoping for "Meine" is real and server-side (`me.service.ts:77`, isolation test at `festival-isolation.spec.ts:145`).
- Disciplined scope consistent with ADR-022 (owned primitives, no third-party UI kit, no premature features).
