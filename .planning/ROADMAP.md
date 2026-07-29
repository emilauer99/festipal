# Roadmap: festipal — Visitor Shell

## Overview

This milestone delivers the visitor-shell slice: a navigable, online vertical slice of the Expo
mobile app that gets a visitor in, connected to a festival, and onto a home screen. It builds on
the ~⅓-scaffolded monorepo (NestJS API + `packages/{contracts,db,i18n,ui,config}`) in strict
dependency-ordered layers: first the identity schema and auth foundation, then the authenticated
festival backend with real per-request tenant enforcement, then the mobile app shell + i18n
plumbing, and finally the three visitor-facing screen sets (auth, festival selection + home,
profile + friends placeholders). Every UI phase lands only after a live backend exists behind it.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Identity Schema & Auth Foundation** - Global user + `user_festival` bridge schema, drizzle-zod, membership-model decision
- [ ] **Phase 2: Auth & Festival Backend API** - better-auth in NestJS, festival browse/join endpoints, per-request membership enforcement
- [ ] **Phase 3: Mobile App Shell & i18n Foundation** - `apps/mobile` Expo scaffold, auth/api clients, `Stack.Protected` navigation, Lingui + lint
- [ ] **Phase 4: Visitor Authentication Screens** - Register, login, persistent session, logout, clear errors
- [ ] **Phase 5: Festival Selection & Home** - Browse/join festivals, land on festival home with basic overview
- [ ] **Phase 6: Profile & Friends Placeholders** - View-only profile and well-formed friends empty state from the home

## Phase Details

### Phase 1: Identity Schema & Auth Foundation
**Goal**: The database and shared packages model global user identity and festival membership, ready for auth wiring, with no risk of contract/schema drift
**Depends on**: Nothing (first phase; extends the existing `packages/db` scaffold)
**Requirements**: PLAT-01
**Success Criteria** (what must be TRUE):
  1. better-auth's `user`/`session`/`account`/`verification` tables plus a `user_festival(userId, festivalId, status, joinedAt)` bridge table exist in `packages/db` and migrate cleanly against Neon.
  2. Global user identity carries no `festivalId` FK — the `user_festival` bridge (always queried by `userId`) is the only link between global and tenant data, honoring ADR-014's "enters, doesn't belong" model.
  3. `drizzle-zod` derives base Zod schemas from the Drizzle tables so that renaming a DB column surfaces as a compile error rather than silent drift.
  4. The membership model is decided in writing (plain `user_festival` bridge, not better-auth's organization plugin) and recorded as a plan/ADR note.
**Plans**: TBD
**Notes**: Treat `schema/auth.ts` as CLI-owned/vendored — keep better-auth's `text` id convention and document it so contributors don't "fix" it to `uuid()`. Addresses Pitfalls 1 (org-plugin decision) and 6 (contract/DB drift).

### Phase 2: Auth & Festival Backend API
**Goal**: The NestJS API authenticates visitors and serves festival browse/join endpoints, enforcing real per-request festival membership
**Depends on**: Phase 1
**Requirements**: SEC-01
**Success Criteria** (what must be TRUE):
  1. better-auth is wired into NestJS (instance + catch-all handler at `/api/auth/*`) behind a global `AuthGuard`; sign-up/sign-in/sign-out plus `GET /api/v1/me`, `GET /api/v1/festivals`, and `POST /api/v1/festivals/:festivalId/join` are reachable against a live dev API.
  2. Every endpoint is explicitly tagged public vs protected in one deliberate pass (health + sign-in anonymous, everything else protected), captured as an endpoint × auth-annotation table reviewed at phase end.
  3. Festival-scoped access requires membership: a request by user A for a festival they never joined returns 403 — proven by an automated cross-tenant-denial test, not just happy-path UAT.
  4. `bodyParser: false` plus re-added JSON parsing is smoke-tested so both an auth POST (sign-in) and a non-auth ts-rest POST (join) receive correct request bodies.
  5. The three app endpoints derive their Zod shapes from `packages/contracts` (composed on Phase 1's drizzle-zod base), not hand-redeclared; better-auth's own routes are deliberately excluded from the contract.
**Plans**: TBD
**Notes**: HIGH-priority research flag — the community NestJS wrapper (`@thallesp/nestjs-better-auth`) × ts-rest middleware ordering is the single riskiest wiring point; spike early and keep a hand-rolled `@All('auth/*path')` catch-all documented as the fallback. Addresses Pitfalls 3 (AuthGuard mis-tagging) and 4 (festival-list / tenant enforcement).

### Phase 3: Mobile App Shell & i18n Foundation
**Goal**: The Expo app exists, talks to the real API through the shared contract, and enforces localization from the first line of UI
**Depends on**: Phase 2
**Requirements**: PLAT-02, I18N-01
**Success Criteria** (what must be TRUE):
  1. `apps/mobile` (Expo Router, RN New Architecture) builds and launches, wiring `lib/auth-client.ts` (better-auth Expo client + `expo-secure-store`) and `lib/api-client.ts` (ts-rest client bound to `packages/contracts`, forwarding the session cookie) against the live API.
  2. `Stack.Protected` route groups (`(auth)` / `festivals` / `(festival)`) gate navigation at the layout level, and a splash screen is held until session + selected-festival state resolve so no wrong route flashes on cold start.
  3. Lingui extraction plus a no-literal-string lint rule are configured and passing before any product screen ships, with real (not stubbed) DE/EN catalogs.
  4. A single TanStack Query provider is mounted (without persistence this online-assumed slice) so later cacheable content features need no provider-tree rewiring.
**Plans**: TBD
**Notes**: MEDIUM research flags — Lingui in an Expo monorepo, Expo Router async guard behavior, and the SecureStore ~2KB size limit. Addresses Pitfalls 5 (auth-flash / deep-link bypass) and 7 (hardcoded strings). This phase sets up the i18n lint rule that Phases 4–6 rely on.
**UI hint**: yes

### Phase 4: Visitor Authentication Screens
**Goal**: A visitor can register, log in, stay logged in across restarts, and log out — with clear, localized errors
**Depends on**: Phase 3
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):
  1. A visitor can register a global account with email + password and is taken into the app on success (AUTH-01).
  2. A visitor can log in with email + password (AUTH-02) and log out from within the app, returning to the auth screen (AUTH-04).
  3. Session persists across a full app force-quit-and-relaunch — the visitor lands logged-in on reopen — verified by killing the process, not by hot-reload (AUTH-03).
  4. Auth failures and form-validation errors (bad credentials, already-taken email, malformed input) show clear, localized messages (AUTH-05).
  5. A deep link to a protected route while logged out redirects to login instead of leaking content.
**Plans**: TBD
**Notes**: Verify native session persistence explicitly (Pitfall 2 — `expo-secure-store`, `trustedOrigins`, force-quit test). Deep-link redirect check covers Pitfall 5 end-to-end now that real auth screens exist.
**UI hint**: yes

### Phase 5: Festival Selection & Home
**Goal**: A visitor can browse festivals, join one in a tap, and land on that festival's home with a basic overview they can open
**Depends on**: Phase 4
**Requirements**: FEST-01, FEST-02, FEST-03, FEST-04, HOME-01, HOME-02
**Success Criteria** (what must be TRUE):
  1. A visitor sees a festival list showing name, dates, and place per item (FEST-01), visually distinguishing festivals they have joined from joinable ones (FEST-02).
  2. A visitor can join a festival in one tap; the join persists both server-side (`user_festival`) and client-side (selected festival), surviving app restart (FEST-03).
  3. After selecting or joining, the visitor lands on that festival's home / main menu (HOME-01).
  4. The home shows a basic festival overview (identity + key facts like name, dates, place) the visitor can open (HOME-02).
  5. A visitor can return to the festival list from inside a festival without hitting a dead-end (FEST-04).
**Plans**: TBD
**Notes**: `GET /festivals` (browse) and the joined-vs-joinable distinction rely on Phase 2's membership-aware endpoints; confirm the home/overview read still enforces the tenant check from Phase 2.
**UI hint**: yes

### Phase 6: Profile & Friends Placeholders
**Goal**: The festival home links out to a view-only Profile and a well-formed Friends placeholder
**Depends on**: Phase 5
**Requirements**: HOME-03, PROF-01, FRND-01
**Success Criteria** (what must be TRUE):
  1. The festival home provides clear navigation to both Profile and Friends (HOME-03).
  2. The Profile screen shows the visitor's name, email, and avatar/initials in a view-only layout, sourced from `GET /api/v1/me` (PROF-01).
  3. The Friends screen renders a clear, non-broken empty state that reads as intentional, with no real connections yet (FRND-01).
  4. All Profile/Friends strings are wrapped for i18n (no hardcoded placeholder text), verified by the no-literal-string lint rule from Phase 3.
**Plans**: TBD
**Notes**: Placeholder text still counts as shipped shell UI — do not skip i18n wrapping on "just a placeholder" screens.
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Identity Schema & Auth Foundation | 0/TBD | Not started | - |
| 2. Auth & Festival Backend API | 0/TBD | Not started | - |
| 3. Mobile App Shell & i18n Foundation | 0/TBD | Not started | - |
| 4. Visitor Authentication Screens | 0/TBD | Not started | - |
| 5. Festival Selection & Home | 0/TBD | Not started | - |
| 6. Profile & Friends Placeholders | 0/TBD | Not started | - |
