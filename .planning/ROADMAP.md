# Roadmap: festipal — Visitor Shell

> Reconciled 2026-07-30 with the binding concept phase (docs/concept/04–10; ADR-009 auth, ADR-014
> tenant boundary, ADR-016 identity, ADR-020 scope). Auth is passwordless email-OTP; identity is
> `Account` → `VisitorProfile`; festival join is gate-less `MyFestival` (save); tenant isolation is
> data-scoping by `festivalId`, not an access gate.

## Overview

This milestone delivers the visitor-shell slice: a navigable, online, login-first slice of the Expo
mobile app that gets a visitor in (passwordless email-OTP), through first-login profile completion,
connected to a festival they save/enter gate-lessly, and onto a home screen. It builds on the
~⅓-scaffolded monorepo (NestJS API + `packages/{contracts,db,i18n,ui,config}`) in strict
dependency-ordered layers: first the identity + membership schema and auth foundation, then the
authenticated festival backend (OTP + browse/save) with correct `festivalId` data isolation, then
the mobile app shell + i18n plumbing, and finally the three visitor-facing screen sets (auth +
profile completion, festival selection + home, profile + friends placeholders). Every UI phase
lands only after a live backend exists behind it.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Identity Schema & Auth Foundation** - `Account` + `VisitorProfile` + `MyFestival` schema, better-auth (OTP) tables, username uniqueness, drizzle-zod, identity-model decision
- [ ] **Phase 2: OTP Auth & Festival Backend API** - better-auth email-OTP in NestJS, profile-completion + festival browse/save endpoints, login-first guard + `festivalId` data isolation
- [ ] **Phase 3: Mobile App Shell & i18n Foundation** - `apps/mobile` Expo scaffold, auth/api clients, `Stack.Protected` navigation, Lingui + lint
- [ ] **Phase 4: Visitor Auth & Profile Completion** - Email-OTP welcome/code screens, first-login profile (username live-check + displayName), persistent session, logout, clear errors
- [ ] **Phase 5: Festival Selection & Home** - Browse all / save to Meine, gate-less enter, land on festival home with basic overview
- [ ] **Phase 6: Profile & Friends Placeholders** - View-only profile and well-formed friends empty state from the home

## Phase Details

### Phase 1: Identity Schema & Auth Foundation

**Goal**: The database and shared packages model global `Account`/`VisitorProfile` identity, festival save-membership, and better-auth's OTP tables, ready for auth wiring, with no risk of contract/schema drift
**Depends on**: Nothing (first phase; extends the existing `packages/db` scaffold)
**Requirements**: PLAT-01
**Success Criteria** (what must be TRUE):

  1. better-auth's core tables (`user`/Account, `session`, `account`, `verification`) plus a separate `visitor_profile` table (keyed by `accountId`, holding `username`, `displayName`, `avatar?`, and reserved `socials`/`socialsVisibility`) and a `my_festival(visitorId, festivalId, savedAt, camp?)` table exist in `packages/db` and migrate cleanly against Neon.
  2. `username` is enforced case-insensitively unique via a `UNIQUE INDEX ON lower(username)`; the global `Account` carries no `festivalId` FK — `my_festival` (always queried by `visitorId`) is the only link between global and tenant data (ADR-014/016).
  3. `drizzle-zod` derives base Zod schemas from the Drizzle tables so that renaming a DB column surfaces as a compile error rather than silent drift.
  4. The identity/membership model is decided in writing (Account→VisitorProfile as a **separate** profile table; visitors modeled as gate-less `my_festival` saves, NOT better-auth's `organization` plugin and NOT its built-in `username` plugin — which would force a username onto staff-only accounts) and recorded as a plan/ADR note.

**Plans**: 1/3 plans executed
**Wave 1**

- [x] 01-01-PLAN.md — Confirm D-01..D-04, verify better-auth legitimacy, vendor `schema/auth.ts` + drizzle-zod bases, record identity-model ADR note

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 01-02-PLAN.md — Tracer: `visitor_profile` (+ `lower(username)` unique index) through drizzle-zod → contracts drift proof → first Neon migration

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 01-03-PLAN.md — Expand: `my_festival` gate-less save join, final full-schema Neon migration, live uniqueness proof

**Notes**: Treat `schema/auth.ts` as CLI-owned/vendored — keep better-auth's `text` id convention and document it. Addresses Pitfalls 1 (org-plugin/identity-model decision), 6 (contract/DB drift), and the new Pitfall 12 (`username`-plugin breaks the Account/VisitorProfile split).

### Phase 2: OTP Auth & Festival Backend API

**Goal**: The NestJS API authenticates visitors passwordlessly via email-OTP, supports first-login profile completion and festival browse/save, and isolates festival-scoped data by `festivalId`
**Depends on**: Phase 1
**Requirements**: SEC-01, SEC-02
**Success Criteria** (what must be TRUE):

  1. better-auth's `emailOTP` plugin is wired into NestJS (instance + catch-all handler at `/api/auth/*`, 6-digit code, ~5-min expiry, built-in request rate-limit) behind a global `AuthGuard`; OTP send/verify plus `GET /api/v1/me`, `POST /api/v1/me/complete-profile`, `GET /api/v1/me/username-availability`, `GET /api/v1/festivals`, `POST /api/v1/festivals/:festivalId/save`, and `GET /api/v1/me/festivals` are reachable against a live dev API.
  2. **Login-first (SEC-01):** every endpoint is explicitly tagged public vs protected in one deliberate pass (health + OTP send/verify anonymous, everything else protected), captured as an endpoint × auth-annotation table reviewed at phase end.
  3. **Data isolation (SEC-02):** festival-scoped reads are always constrained by `festivalId`; an automated test proves one festival's tags/overview never appear in another festival's context. Saving/entering a festival is **gate-less** — any authenticated visitor may browse and enter any festival (no 403-on-unsaved); `save` only writes `my_festival`.
  4. `bodyParser: false` plus re-added JSON parsing is smoke-tested so both an OTP verify POST and a non-auth ts-rest POST (save) receive correct request bodies.
  5. `username-availability` is advisory (debounced check) while `complete-profile` is the source of truth, catching the unique-index violation as a TOCTOU-safe race guard; email OTP delivery uses an env-configured provider (e.g. Resend via `RESEND_API_KEY`) with a dev console/nodemailer fallback — no secrets committed.
  6. The app endpoints derive their Zod shapes from `packages/contracts` (composed on Phase 1's drizzle-zod base); better-auth's own OTP routes are deliberately excluded from the contract.

**Plans**: TBD
**Notes**: MEDIUM research flag (downgraded 2026-07-30 after verifying current docs) — the community NestJS wrapper (`@thallesp/nestjs-better-auth`, requires `better-auth >= 1.5.0`) **automatically re-applies** body parsing for non-auth routes, so `bodyParser: false` + `AuthModule.forRoot({ auth, bodyParser: {...} })` is the whole wiring; ts-rest handlers (plain NestJS controllers) just consume the re-applied `req.body` — no manual `express.json()` exclusion. The spike now *confirms* rather than *designs*: (1) 2-request body proof (OTP-verify POST to `/api/auth/*` AND ts-rest `save` POST), (2) global-prefix collision — align `/api/v1` (ts-rest) vs `/api/auth` (better-auth) by excluding auth from `setGlobalPrefix` or setting better-auth `basePath`, (3) version-pin `better-auth >= 1.5.0`. Hand-rolled `@All('auth/*path')` catch-all kept as **Plan C** fallback. Addresses Pitfalls 3 (AuthGuard mis-tagging + body-parser), 4 (gate-less entry ≠ dropping `festivalId` isolation), 8 (OTP rate-limit/enumeration), and 11 (username race).

### Phase 3: Mobile App Shell & i18n Foundation

**Goal**: The Expo app exists, talks to the real API through the shared contract, and enforces localization from the first line of UI
**Depends on**: Phase 2
**Requirements**: PLAT-02, I18N-01
**Success Criteria** (what must be TRUE):

  1. `apps/mobile` (Expo Router, RN New Architecture) builds and launches, wiring `lib/auth-client.ts` (better-auth Expo client + `emailOTP` client plugin + `expo-secure-store` session persistence) and `lib/api-client.ts` (ts-rest client bound to `packages/contracts`, forwarding the session cookie) against the live API.
  2. `Stack.Protected` route groups (`(auth)` / `festivals` / `(festival)`) gate navigation at the layout level, and a splash screen is held until session + selected-festival state resolve so no wrong route flashes on cold start.
  3. Lingui extraction plus a no-literal-string lint rule are configured and passing before any product screen ships, with real (not stubbed) DE/EN catalogs; language follows device/system locale (ADR-012).
  4. A single TanStack Query provider is mounted (without persistence this online-assumed slice) so later cacheable content features need no provider-tree rewiring.

**Plans**: TBD
**Notes**: MEDIUM research flags — Lingui in an Expo monorepo, Expo Router async guard behavior, the SecureStore ~2KB size limit, and that better-auth uses one sliding-window session token (no separate refresh endpoint — Pitfall 10). Addresses Pitfalls 5 (auth-flash / deep-link bypass) and 7 (hardcoded strings). Sets up the i18n lint rule Phases 4–6 rely on.
**UI hint**: yes

### Phase 4: Visitor Auth & Profile Completion

**Goal**: A visitor can log in passwordlessly via email-OTP, complete their profile on first login, stay logged in across restarts, and log out — with clear, localized errors
**Depends on**: Phase 3
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, IDN-01
**Success Criteria** (what must be TRUE):

  1. A new visitor enters email → receives a 6-digit code → verifies and is taken to profile completion; a new email creates a global `Account` (AUTH-01).
  2. On first login the visitor sets a required unique `username` (with live availability feedback) + `displayName` (avatar optional) before reaching the app; a returning visitor whose email already has a VisitorProfile skips this step and lands straight in (IDN-01, AUTH-02).
  3. The visitor can log out, returning to the welcome/auth screen (AUTH-04), and the session persists across a full app force-quit-and-relaunch — they land logged-in on reopen — verified by killing the process, not by hot-reload (AUTH-03).
  4. OTP edge cases and validation errors (wrong/expired code, resend, change-email, rate-limited requests, username taken) show clear, localized messages (AUTH-05).
  5. A deep link to a protected route while logged out redirects to the auth flow instead of leaking content.

**Plans**: TBD
**Notes**: Verify native session persistence explicitly (Pitfall 2 — `expo-secure-store`, `trustedOrigins`, force-quit test) and re-auth-via-OTP on expiry. Deep-link redirect check covers Pitfall 5. Profile completion is a real VisitorProfile write, not a placeholder.
**UI hint**: yes

### Phase 5: Festival Selection & Home

**Goal**: A visitor can browse all festivals, save ones to "Meine", enter any festival gate-lessly, and land on that festival's home with a basic overview they can open
**Depends on**: Phase 4
**Requirements**: FEST-01, FEST-02, FEST-03, FEST-04, HOME-01, HOME-02
**Success Criteria** (what must be TRUE):

  1. The Festivals tab shows a Meine/Alle segment (default Meine); "Alle" lists every festival with name, dates, and place, visually distinguishing already-saved ones (FEST-01, FEST-02).
  2. A visitor can save a festival to "Meine Festivals" in one tap; the save persists server-side (`my_festival`) and survives app restart (FEST-03).
  3. A visitor can enter any festival gate-lessly — saved or browsed, no ticket/approval — landing on that festival's home / main menu (FEST-04 entry, HOME-01).
  4. The home shows a basic festival overview (identity + key facts like name, dates, place) the visitor can open (HOME-02).
  5. A visitor can return to the festival list from inside a festival without hitting a dead-end (FEST-04).

**Plans**: TBD
**Notes**: `GET /festivals` (browse all) and the joined-vs-saved distinction rely on Phase 2's endpoints; confirm the home/overview read is correctly `festivalId`-scoped (SEC-02) even though entry is gate-less.
**UI hint**: yes

### Phase 6: Profile & Friends Placeholders

**Goal**: The festival home links out to a view-only Profile and a well-formed Friends placeholder
**Depends on**: Phase 5
**Requirements**: HOME-03, PROF-01, FRND-01
**Success Criteria** (what must be TRUE):

  1. The festival home provides clear navigation to both Profile and Friends (HOME-03).
  2. The Profile screen shows the visitor's username, displayName, avatar/initials, and email in a view-only layout, sourced from `GET /api/v1/me` (PROF-01).
  3. The Friends screen renders a clear, non-broken empty state that reads as intentional — framed as "friends who saved this festival," with no real connections yet (FRND-01).
  4. All Profile/Friends strings are wrapped for i18n (no hardcoded placeholder text), verified by the no-literal-string lint rule from Phase 3.

**Plans**: TBD
**Notes**: Placeholder text still counts as shipped shell UI — do not skip i18n wrapping. `username`/`displayName` are user-generated and are NOT translated (ADR-012/020).
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Identity Schema & Auth Foundation | 1/3 | In Progress|  |
| 2. OTP Auth & Festival Backend API | 0/TBD | Not started | - |
| 3. Mobile App Shell & i18n Foundation | 0/TBD | Not started | - |
| 4. Visitor Auth & Profile Completion | 0/TBD | Not started | - |
| 5. Festival Selection & Home | 0/TBD | Not started | - |
| 6. Profile & Friends Placeholders | 0/TBD | Not started | - |
