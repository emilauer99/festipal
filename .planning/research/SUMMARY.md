# Project Research Summary

**Project:** festipal — visitor-shell slice (auth + festival-join + home shell)
**Domain:** Multi-tenant festival mobile app (Expo/NestJS) with auth gate + tenant selection
**Researched:** 2026-07-29
**Confidence:** HIGH (architecture/patterns verified against official docs; MEDIUM on community NestJS wrapper integration specifics)

## Reconciliation note (2026-07-30)

This summary was originally written against an **email/password** auth assumption. The binding concept
phase (docs/concept/04, 09; ADR-009/014/016) changed that. Where this document says "email/password,"
read the corrected model — the authoritative details are in the reconciled `STACK.md` and `PITFALLS.md`:

- **Auth = passwordless email-OTP for visitors** (better-auth `emailOTP` plugin; 6-digit, ~5-min expiry, built-in rate-limit). No password stored. Staff/admin (password+OTP) are out of this milestone.
- **Session** is one better-auth **sliding-window session token** auto-persisted to `expo-secure-store` — *not* a separate refresh token; do **not** build a `/auth/refresh` endpoint (Pitfall 10).
- **Identity** = `Account` → `VisitorProfile` (a **separate** `visitor_profile` table keyed by `accountId`; NOT better-auth's `username` plugin). First-login profile completion (unique `username` + `displayName`) is in the shell.
- **Festival join = gate-less `MyFestival` "save"** — any authenticated visitor can enter any festival. The tenant guard is **data isolation by `festivalId`**, NOT a membership/403 access gate. The earlier "cross-tenant-denial (403)" framing is superseded by a **cross-festival data-isolation** test.
- Still valid and carried forward unchanged: ts-rest + TanStack Query v5 wiring, Expo Router `Stack.Protected` gating, `expo-secure-store`, and the NestJS `bodyParser:false` caveat.

## Executive Summary

The visitor-shell slice is a brownfield effort on a locked, well-documented stack: the monorepo is ~⅓ scaffolded (API + contracts + Drizzle baseline exist), and this slice fills the core gap — auth, global-user data, and tenant selection — to unblock the mobile app's first screens. The approach is straightforward: better-auth for auth (already ADR-decided), a plain `user_festival` bridge table to model "visitor joins festival" (avoiding the organization plugin), and Expo Router's built-in `Stack.Protected` for auth gating. **The single highest-priority risk** is enforcing real per-request tenant membership checks on festival-scoped endpoints from the very start — it's easy to ship "authenticated users can see any festival's home" this cycle, then inherit that hole across all later features (timetable, map, marketplace). A secondary risk unique to native auth is session persistence: better-auth's Expo client requires explicit `expo-secure-store` configuration to survive app restarts.

**Recommended build order:** schema (better-auth CLI + bridge table) → contracts (3 endpoints, not modeling better-auth's own routes) → NestJS API (AuthModule + guards + contract endpoints) → mobile shell (Expo screens). Stages 1–3 are backend-only and can ship as a single phase; stage 4 is a separate, large mobile phase. Contract-Drizzle drift and hardcoded i18n strings are secondary architectural debts that compound fast once more screens/tables exist — adopt `drizzle-zod` and Lingui lint enforcement as part of this cycle's initial schema work, not as cleanup later.

## Key Findings

### Recommended Stack

better-auth 1.6.25 (ADR-009 choice, verified lockstep with existing `drizzle-orm@0.45.2` — no bump needed) provides the auth core. On mobile, `@better-auth/expo@1.6.25` (first-party Expo plugin, not community wrapper) handles deep-link OAuth redirects and SecureStore integration; on backend, `@thallesp/nestjs-better-auth@2.7.0` (community package, referenced from better-auth's own docs but unvetted against ts-rest specifically — flagged MEDIUM confidence) wires the global AuthGuard and `@Session()` decorator. ts-rest + TanStack Query v5 (`@ts-rest/react-query@3.52.1`) generates typed hooks from the existing contract surface without duplicating better-auth's own `/api/auth/*` routes. Expo Router's built-in `Stack.Protected` (SDK 53+, current in 57) replaces hand-rolled Redirect logic; `expo-secure-store@57.0.1` is SDK-locked and wraps iOS Keychain + Android Keystore for encrypted session storage.

**Load-bearing detail:** NestJS with better-auth requires `bodyParser: false` on `NestFactory.create()` to read the raw request stream; this also disables JSON parsing for every other route unless `express.json()` is re-added *after* the auth module registers. This combination (disable + re-add) must be smoke-tested against ts-rest POST handlers in Phase 2 — it's the single highest-risk wiring point, not verified against the ts-rest adapter by the community wrapper.

**Core technologies:**
- `better-auth@1.6.25` — Auth core (server) — Drizzle Postgres adapter, already ADR-locked, peer-constrains drizzle-orm (we already satisfy)
- `@better-auth/expo@1.6.25` — Official Expo plugin (client) — ships in lockstep with core, handles native storage/deep-link OAuth
- `@thallesp/nestjs-better-auth@2.7.0` — NestJS wiring (community, MEDIUM confidence) — global AuthGuard, `@Session()`, `@AllowAnonymous()` decorators
- `expo-secure-store@57.0.1` — Encrypted session storage (native) — first-party Expo, Keychain/Keystore-backed
- `@ts-rest/react-query@3.52.1` — Typed TanStack Query v5 hooks from contracts — matches existing `@ts-rest/core@3.52.1` and `zod@3.25.76` pins exactly
- `expo-router@57.0.8` — App/auth navigation via `<Stack.Protected>` — SDK-locked to Expo 57

### Expected Features

**Table stakes (users expect these):**
- Email/password registration + login with inline validation and clear errors — the blocker, `user` table + better-auth wiring don't exist yet
- Session persists so user lands logged-in on app reopen (explicitly required by PROJECT.md; online-assumed this slice)
- Browse festivals with name/date/place per item and distinguish "joined" from "joinable" (requires new user↔festival bridge table)
- One-tap join from the list (no code/QR this cycle)
- Festival home shows basic identity + one or two overview facts (name, dates, place)
- Visible back-to-festival-list affordance from inside a festival (prevents dead-end for multi-festival visitors)
- Profile stub with name/email/avatar-or-initials, logout, no editing
- Friends stub with well-designed empty state (not broken-looking), no real data

**Should have (cheap wins, defer to v1.x if time-constrained):**
- Minimal per-festival color theming on home (4 CSS token overrides) — already fully specified in design system (ADR-015)
- Multiple joined festivals surfaced (season view) — data model already supports it via the join relationship

**Defer (v2+):**
- Social login, code/QR join, push notifications, profile editing, real Friends (core differentiator, own milestone)

**Dependency chain:** `user` table → auth screens → session persistence → festival list (joined vs. joinable) → join action → festival home.

### Architecture Approach

Schema is backend-only; contracts model only app-specific endpoints (`me`, `listFestivals`, `joinFestival`), deliberately **not** re-declaring better-auth's own routes (which live outside `/api/v1` at `/api/auth/*`). The global user and tenant tables live in separate data classes per ADR-014 — a `user_festival` bridge table (global, queried by userId) joins them. NestJS's global `AuthGuard` flips the default from "everything public" to "everything protected unless `@AllowAnonymous()`". Expo Router uses `Stack.Protected` at the layout level to cover deep links uniformly.

**Major components:**
1. `packages/db/schema/auth.ts` (global) — user, session, account, verification; CLI-generated by better-auth, hand-adapted to repo conventions
2. `packages/db/schema/user-festival.ts` (global bridge) — `(userId, festivalId)` composite key; never reverse-FK from festival
3. `apps/api` AuthModule (new) — better-auth instance + catch-all handler + global `AuthGuard`
4. `apps/api` UserModule (new) — `me`, `listFestivals`, `joinFestival` (all user-scoped)
5. `packages/contracts` (extended) — three new endpoints only, using existing Zod pattern
6. `apps/mobile` `lib/auth-client.ts` — createAuthClient + expoClient plugin + SecureStore
7. `apps/mobile` `lib/api-client.ts` — ts-rest contract client with Cookie header injection
8. `apps/mobile` Expo Router — `(auth)` (sign-in/up), `festivals/` (browse/join), `(festival)` (home/profile/friends); all gated by `Stack.Protected`

### Critical Pitfalls

1. **Organization-plugin temptation (CRITICAL)** — better-auth's plugin models staff membership with roles/invitations; festipal's visitor model is simpler (browse, join, no invites). Using it over-fits and conflicts with ADR-014's "enters, doesn't belong" model. **Mitigation:** decide explicitly in writing before schema creation: use plain `user_festival` bridge table for visitors.

2. **Session persistence broken on native (CRITICAL)** — better-auth's Expo client defaults to AsyncStorage or loses persistence if `expo-secure-store` isn't explicitly configured. User has to re-login every app restart. **Mitigation:** pin the pattern `expoClient({ scheme, storagePrefix, storage: SecureStore })` on client, `trustedOrigins: ["festipal://"]` on server; verify with force-quit-and-relaunch test.

3. **NestJS AuthGuard mis-tagging (CRITICAL)** — Global AuthGuard makes everything protected by default. Two failure modes: (a) public routes like sign-in return 401; (b) protected routes get `@AllowAnonymous()` copy-pasted during debugging and stay open. Also, `bodyParser: false` requirement is easy to skip, breaking all POST bodies. **Mitigation:** enumerate every endpoint explicitly in one pass; add lint check that flags new `@AllowAnonymous()`; confirm `bodyParser: false` + smoke-test a non-auth POST.

4. **Festival-list returns unjoined data or join doesn't gate anything (CRITICAL for multi-tenancy)** — List endpoint is `SELECT * FROM festival` or festival-scoped endpoints check "authenticated" not "member of this festivalId." This hole gets inherited across all later phases. **Mitigation:** separate contracts: `GET /festivals` (public browse) and `GET /me/festivals` (session-required, user's joined only). Implement TenantGuard that queries `user_festival` for `(userId, festivalId)` and 403s on mismatch. Write explicit test: user A cannot see festival B's overview.

5. **Expo Router shows flash or deep links bypass auth (HIGH)** — Cold start reads persisted session async; if default route renders before that resolves, users see a flash. Deep links skip the gate if auth is only checked once at boot. **Mitigation:** hold splash screen until session bootstrap resolves; structure routes into `(auth)` and `(protected)` groups with guard at layout level. Manual test: deep link to protected route while logged out → confirm redirect to login.

6. **Contract/DB schema drift compounds (MEDIUM)** — Hand-declared Zod schemas in contracts drift from Drizzle tables; a column rename won't be caught by type system. Risk grows with every new table. **Mitigation:** introduce `drizzle-zod` now (small effort for 2–3 tables) to generate base schemas from Drizzle, compose in contracts. Add compile-time check: column rename should cause error.

7. **i18n hardcoded strings creep in (MEDIUM)** — This slice ships first UI code; Lingui's ESLint plugin doesn't flag unwrapped strings by default. No existing pattern to copy means this is highest-risk moment for hardcoded-only culture. **Mitigation:** set up Lingui extraction + literal-string lint rule *before* first screen written; run `pnpm lingui extract` in CI; every string wrapped in `t()` or `<Trans>`.

## Implications for Roadmap

### Phase 1: Database Schema + better-auth Setup
**Rationale:** Schema gates everything downstream. Better-auth's CLI is the only step that resolves actual column names/types.

**Delivers:** `auth.ts` (CLI-generated, hand-adapted), `user-festival.ts` bridge table, migrations, `drizzle-zod` adoption

**Avoids:** Pitfall 1 (organization plugin — decide explicitly in writing), Pitfall 6 (contract/DB drift — adopt `drizzle-zod` immediately)

---

### Phase 2: Auth + Festival-List Backend (NestJS API)
**Rationale:** Unblocks mobile work. Contracts nearly useless in isolation from schema and guards.

**Delivers:** AuthModule, UserModule, `listFestivals`/`joinFestival` with TenantGuard enforcing `(userId, festivalId)` membership, every endpoint tagged with auth annotation

**Avoids:** Pitfall 3 (AuthGuard tagging — explicit table review), Pitfall 4 (festival-list — TenantGuard tested with cross-tenant-denial case)

**Research flags:** **HIGH PRIORITY:** Middleware ordering (bodyParser:false + express.json() + ts-rest) — write integration test for sign-in POST and non-auth POST both receiving correct bodies.

---

### Phase 3: Mobile Shell (Expo Router + Screens)
**Rationale:** Requires Phase 2's live backend. Large, separately testable; natural seam.

**Delivers:** Expo app structure, auth-client + api-client wiring, SessionProvider + SelectedFestivalProvider, `Stack.Protected` navigation, 4 screens (sign-in/up, festival list, home, profile/friends stubs), Lingui extraction + lint rule

**Avoids:** Pitfall 2 (native session persistence — force-quit test), Pitfall 5 (Expo Router flash/deep-link — manual tests), Pitfall 7 (i18n — lint rule deployed first)

**Research flags:** (a) Lingui in monorepo/Expo setup; (b) Expo Router async guard behavior; (c) SecureStore 2KB limit.

### Phase Ordering Rationale

- **Schema first:** Schema resolves "what columns" — better-auth's CLI is authoritative. Adopting `drizzle-zod` prevents Pitfall 6 that compounds across future tables.
- **Backend (auth + contracts) as one:** Contracts depend on schema columns and guards; reviewing in isolation from both is incomplete.
- **Mobile separate:** Large, distinct vertical slice, depends on Phase 2 being live. Enables parallel work if team is large.

### Research Flags

- **Phase 1:** Standard patterns (LOW flag) — document `auth.ts` as "CLI-owned/vendored" to prevent future hand-edits.
- **Phase 2:** **HIGH flag** — middleware ordering is highest-risk; community wrapper requires explicit smoke test.
- **Phase 3:** MEDIUM flags — Lingui in monorepo, Expo Router async guards, SecureStore size limits.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registry (2026-07-29); lockstep deps confirmed; official docs via Context7. |
| Features | HIGH | Grounded in PROJECT.md Active/Out of Scope and approved design (docs/concept/). |
| Architecture | HIGH | Official docs for Drizzle, ts-rest, Expo Router, NestJS. ADR-014 is repo's own decision. |
| Pitfalls | MEDIUM–HIGH | Pitfalls 1, 3, 4 from community best-practices + CONCERNS.md. Pitfalls 2, 5 from official Expo/better-auth docs (HIGH). Pitfalls 6, 7 inferred from ADR-012, general TS ecosystem (MEDIUM). |

**Overall confidence:** **HIGH** for stack, features, architecture; **MEDIUM** for integration pitfalls (primarily NestJS wrapper × ts-rest middleware ordering).

### Gaps to Address

- **NestJS + @thallesp/nestjs-better-auth + ts-rest integration:** Spike early in Phase 2; hand-rolled catch-all is documented fallback.
- **Expo Router `Stack.Protected` with actual async session bootstrap:** Real-world testing in Phase 3 for flash/bypass.
- **Lingui extraction + lint in monorepo/Expo:** Phase 3 should verify setup; less common than web usage.
- **Per-festival CI theming (differentiator, stretch goal):** Decide during Phase 3 if hardcoding colors per festival is acceptable.

## Sources

### Primary (HIGH — official/authoritative)
- better-auth (Context7): Drizzle adapter, Expo integration, NestJS integration, CLI, bearer plugin
- Expo (Context7): Expo Router patterns, `Stack.Protected`, SecureStore, SDK 57 compat
- ts-rest (Context7): React Query v5 integration
- npm registry (live 2026-07-29): versions, peer-dependencies
- ADRs 001–015 in repo: stack decisions, multi-tenancy model
- docs/concept/ (user-approved): UX design, component inventory

### Secondary (MEDIUM — community consensus)
- @thallesp/nestjs-better-auth: NestJS integration pattern
- Mobile onboarding UX research (userpilot, appcues, adapty): table-stakes confirmation
- Event app home patterns: overview-focused design

### Tertiary (LOW — inference)
- `drizzle-zod` adoption timeline: general TS ecosystem web search
- Lingui in monorepo/RN: limited docs, needs spike
- Expo Router deep-link behavior: limited official examples

---

*Research completed: 2026-07-29*
*Synthesized by: GSD Research Synthesizer*
*Ready for roadmap creation: yes*
