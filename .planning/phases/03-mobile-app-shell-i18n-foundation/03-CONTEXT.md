# Phase 3: Mobile App Shell & i18n Foundation - Context

**Gathered:** 2026-08-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold `apps/mobile` (Expo Router, RN New Architecture) so the app builds, launches
on real devices, and proves the full plumbing end-to-end: better-auth Expo client with
`emailOTP` plugin + `expo-secure-store` persistence (`lib/auth-client.ts`), ts-rest
client bound to `packages/contracts` forwarding the session cookie
(`lib/api-client.ts`), `Stack.Protected` route groups (`(auth)` / `festivals` /
`(festival)`) with splash gating, Lingui extraction + no-literal-string lint with real
DE/EN catalogs, and a single TanStack Query provider (no persistence this
online-assumed slice).

**In scope:**
- Navigable **placeholder screens per route group** — including a rudimentary but
  REAL OTP login flow and a real festival list fed by `GET /festivals`.
- Local dev infrastructure: **docker-compose with Postgres + Mailpit** so device
  testing runs fully local (API stays native via `pnpm dev`).
- Dev builds on real Android (Windows PC) and real iPhone (Mac/Xcode, free
  provisioning) against the local API over LAN.

**Out of scope (later phases):**
- Real, designed auth/profile screens (Phase 4 — Claude Design fidelity applies there).
- Festival detail/home content, date/place master data (Phase 5), Profile/Friends
  real screens (Phase 6).
- EAS Build/Submit/Update, Apple Developer account, store metadata.
- Railway deploy of the API (Neon stays for staging; not needed for this phase).
- In-app language switcher (override axis exists in `resolveUiLocale`, UI later).
- Offline persistence for TanStack Query (provider mounts now, persistence later).

</domain>

<decisions>
## Implementation Decisions

> All decisions below were made by the user on 2026-08-03 (areas selected and
> answered interactively). They are **user-locked** unless marked as Claude's
> discretion.

**Decision index:**

- **D-01 — Screen depth:** navigable placeholder screens per route group; real screens come in Phases 4–6.
- **D-02 — Auth access:** rudimentary but REAL OTP flow (no dev bypass, no script-injected session).
- **D-03 — API proof:** festivals placeholder shows the real seeded festival via `GET /festivals`; save → enter works rudimentarily.
- **D-04 — Splash/icon:** plain "festipal" wordmark placeholder; no branding assets yet.
- **D-05 — App identity (WORKING TITLE):** name/slug `festipal`, bundle ID `at.festipal.app`, scheme `festipal://` — all provisional, final before first store submit.
- **D-06 — Locale source:** device/system language only (ADR-012); no in-app switcher this phase.
- **D-07 — UI fallback locale:** **German** when device language is neither DE nor EN.
- **D-08 — Source-string language:** **English** in code; DE catalog is the translation.
- **D-09 — Test devices:** real Android device + real iPhone; local dev builds, no EAS.
- **D-10 — API target:** local NestJS API over LAN Wi-Fi, URL via env.
- **D-11 — Local Docker env:** docker-compose (Postgres + Mailpit) is part of Phase 3.

### Sichtbarer Endzustand (screens at phase end)
- **D-01:** Every route group — `(auth)`, `festivals`, `(festival)` home — gets a
  simple but **navigable placeholder screen** using Lingui strings. You can click
  through the whole shell flow. Phases 4–6 replace placeholders with designed
  screens; do NOT invest in styling/design now (Claude Design fidelity applies to
  the later phases, not these placeholders).
- **D-02:** Access behind `Stack.Protected` is via a **rudimentary but REAL email-OTP
  login** (enter email → enter 6-digit code → in; unstyled). No dev bypass, no
  script-injected sessions. This proves auth client + SecureStore persistence
  end-to-end. UAT must include the **kill & relaunch** check (Pitfall 2): force-quit
  after login, relaunch, still authenticated.
- **D-03:** The `festivals` placeholder calls **`GET /festivals` through the ts-rest
  client** and shows the real seed festival "Frequency 2026" (plain list). **Save →
  `my_festival` works rudimentarily** so the user can actually enter the
  `(festival)` home — the core-value entry path is exercised, not mocked.
- **D-04:** Splash screen + app icon = **plain "festipal" wordmark** on a solid
  background (placeholder). No branding assets exist yet; real branding arrives with
  Claude Design later. Splash is held until session + selected-festival state
  resolve (SC-2).

### App-Identität & Scheme
- **D-05:** App name/slug **`festipal`** (lowercase), bundle ID / Android package
  **`at.festipal.app`**, deep-link scheme **`festipal://`** (must be mirrored in
  better-auth `trustedOrigins` — Pitfall 2).
  **⚠ WORKING TITLE:** the user explicitly flagged that "festipal" is provisional —
  name, bundle ID, and scheme may all still change. Document this in code comments /
  README where identity values appear. Point of no return is the **first store
  submit** (bundle-ID change = new app in stores); until then all values are freely
  changeable (scheme change must stay in sync with `trustedOrigins`).
  — **Reversibility:** reversible now, **one-way at first EAS Submit** — bundle ID is
  frozen by the app stores, not by our code.

### Sprachverhalten (i18n behavior)
- **D-06:** UI language follows **device/system locale only** (ADR-012 axis 1). No
  in-app language switcher this phase — `resolveUiLocale(override, …)` already
  supports the override axis, so a switcher is additive later.
- **D-07:** When the device language is neither DE nor EN, the UI falls back to
  **German** (user choice — first partner festivals are German-speaking).
  **Planner note:** `packages/i18n` currently has `DEFAULT_LOCALE = 'en'` — decide
  whether to change the shared constant or introduce a UI-axis-specific fallback;
  the **content axis** (per-festival `defaultLocale`) is NOT affected by this
  decision.
- **D-08:** Lingui **source strings in code are English**; the German catalog is a
  translation. The binding German concept terms (e.g. "Meine Festivals" — see
  `docs/concept/`) must be maintained **exactly** in the DE catalog.
  — **Reversibility:** costly — flipping source language later touches every `t()` /
  `<Trans>` call site and invalidates catalog msgids.

### Dev- & Test-Setup
- **D-09:** Primary test targets are a **real Android device and a real iPhone**.
  Distribution: local **dev builds**, no EAS this phase — Android via
  `npx expo run:android` on the Windows PC; iOS via `npx expo run:ios` / Xcode on
  the user's Mac with **free Apple-ID provisioning** (7-day signature; reinstall
  from Xcode when it expires; repo must also be checked out on the Mac). Full
  `festipal://` scheme + real cold-start tests are therefore possible (no Expo Go
  limitations).
- **D-10:** Devices talk to the **local NestJS API over LAN Wi-Fi** (phone + PC on
  the same network). API base URL configurable via env (e.g.
  `EXPO_PUBLIC_API_URL`). HTTP cleartext allowed **only in dev builds**
  (Android manifest / iOS ATS exception). No Railway deploy this phase.
- **D-11:** A **docker-compose local environment is part of Phase 3**: Postgres
  (v18, matching Neon) + **Mailpit** (the dev OTP mail transport Phase 2's D-01
  anticipated — OTP codes readable in a web inbox during device testing). The API
  itself stays **native** (`pnpm dev` watch mode on the host), Docker only runs
  infrastructure. Local DB gets migrations + the `frequency-2026` seed. Neon
  remains the staging target; `prepare: false` (ADR-005) is harmless against plain
  Postgres.

### Claude's Discretion (technical, not user-facing)
- Exact route-group file layout under `app/`, guard implementation details
  (three-way branch: unauthenticated / authenticated-without-profile /
  authenticated — Pitfall 5), and the splash gating state machine.
- Monorepo integration of Expo (metro config for pnpm workspaces, transpiling
  workspace packages), Lingui + Expo/Babel wiring, and the choice/config of the
  no-literal-string lint rule (Pitfall 7).
- docker-compose file location and naming, local env-file layout
  (`.env` / `.env.local` conventions), and how `EXPO_PUBLIC_API_URL` is wired
  per developer machine (LAN IP differs per network).
- Whether `DEFAULT_LOCALE` changes globally or a UI-axis fallback is introduced
  (per D-07 planner note) — surface the choice in PLAN.md.
- Placeholder screen content beyond the decided elements (list vs. simple buttons,
  etc.) — keep unstyled and minimal.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap / requirements (this phase)
- `.planning/ROADMAP.md` §"Phase 3: Mobile App Shell & i18n Foundation" — goal, 4
  success criteria, MEDIUM research flags (Lingui in Expo monorepo, Expo Router
  async guards, SecureStore ~2KB limit, single sliding session token).
- `.planning/REQUIREMENTS.md` — **PLAT-02** (Expo app consumes real API via
  contracts), **I18N-01** (all UI chrome localizable; user content never translated).

### Pitfalls (authoritative risk list for this phase)
- `.planning/research/PITFALLS.md` — **Pitfall 2** (Expo auth client: SecureStore
  storage, `scheme`, `trustedOrigins`; kill-&-relaunch UAT), **Pitfall 5**
  (auth-flash / deep-link bypass; three-state guard incl. profile-incomplete;
  splash gating), **Pitfall 7** (Lingui lint doesn't catch literal strings —
  no-literal-string rule BEFORE first screen), **Pitfall 10** (one sliding session
  token, no refresh endpoint — do not build token refresh in the client).

### Prior phase decisions this phase builds on
- `.planning/phases/02-otp-auth-festival-backend-api/02-CONTEXT.md` — D-01 (dev
  mail transport — Mailpit now materializes via docker-compose), D-02 (90-day
  sliding session; expiry → OTP re-login), D-03 (seed festival `frequency-2026`),
  D-04 (`GET /festivals` minimal/unpaginated shape).
- `.planning/phases/01-identity-schema-auth-foundation/01-CONTEXT.md` — identity
  schema decisions (visitor_profile, my_festival) the client flows depend on.

### Identity / auth / i18n model (authoritative)
- `docs/concept/09-onboarding-auth.md` — binding OTP flow the rudimentary login
  must follow (even unstyled).
- `docs/concept/04-domain-identity.md` — Account→VisitorProfile split; gate-less
  `MyFestival` save (§5).
- `docs/DEVELOPMENT_DECISIONS.md` — ADR-012 (two locale axes; device locale = UI
  axis), ADR-009 (email-OTP), ADR-014 (gate-less save / `festivalId` scoping),
  ADR-005 (Neon pooling / `prepare:false` — relevant to local-Postgres compose).

### Existing code this phase consumes/extends
- `packages/contracts/src/router.ts` / `schemas.ts` — the ts-rest contract the
  mobile client derives from (auth routes at `/api/auth/*` are OUTSIDE the
  contract; ts-rest covers `/api/v1/*`).
- `packages/i18n/src/` (`locales.ts`, `resolve.ts`, `i18n.ts`) — SUPPORTED_LOCALES,
  `DEFAULT_LOCALE = 'en'` (see D-07 planner note), `resolveUiLocale`.
- `apps/api/src/auth/` — better-auth instance + email provider abstraction (Mailpit
  transport hooks in here); `apps/api/src/config/env.ts` — env loader to extend if
  needed (e.g. trustedOrigins config).
- `packages/db/scripts/` + `packages/db/drizzle.config.ts` — seed + migrations to
  run against the local compose Postgres.
- `packages/ui/src/tokens.ts` — placeholder tokens package (NOT required to grow
  this phase; placeholders stay unstyled).

### External docs to confirm during research
- better-auth Expo client docs (`@better-auth/expo`, `expoClient({ scheme,
  storagePrefix, storage: SecureStore })`, server `trustedOrigins: ["festipal://"]`).
- Expo Router `Stack.Protected` / route-group guard docs (async guard behavior).
- Lingui docs for Expo/React Native + monorepo setup (babel macro, extraction,
  `no-literal-string`-style lint options).
- Expo docs: local dev builds (`expo run:android` / `run:ios`), cleartext HTTP in
  dev builds (Android `usesCleartextTraffic` / iOS ATS), `EXPO_PUBLIC_*` env vars.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/contracts` (ts-rest router + Zod schemas) — `lib/api-client.ts` derives
  the typed client from this; zero shape re-declaration (Pitfall 6).
- `packages/i18n` `resolveUiLocale(override, systemLocales)` — exactly the ADR-012
  axis-1 resolver the app needs; pass device locales, no override this phase.
- Phase 2 seed script (`frequency-2026`) — reused unchanged against the local
  compose Postgres; the festival list placeholder displays this real data.
- Phase 2 email provider abstraction in `apps/api/src/auth/email/` — Mailpit is
  just an SMTP-ish dev transport target; no auth-code rewiring expected.

### Established Patterns
- Workspace packages consumed via `@festipal/*` (workspace:*) — the Expo app must
  transpile these through Metro (pnpm monorepo config is a known research flag).
- Zod schemas in contracts are the single source of truth — the mobile app derives
  types via the contract, never re-declares.
- Env via Zod-validated loaders (`apps/api/src/config/env.ts`) — mirror the
  discipline for mobile env (`EXPO_PUBLIC_API_URL`).

### Integration Points
- `apps/mobile` is a NEW workspace app — needs `package.json` (`@festipal/mobile`),
  tsconfig extending `@festipal/config`, eslint extending the base flat config +
  the new i18n lint layer, and inclusion in turbo tasks (lint/typecheck).
- better-auth server config gains `trustedOrigins: ["festipal://"]` (dev scheme) —
  touches `apps/api/src/auth/auth.instance.ts`.
- The session cookie/token must flow from the better-auth Expo client into ts-rest
  client requests (cookie forwarding — SC-1); both clients live in `apps/mobile/lib/`.
- docker-compose sits at repo root; `DATABASE_URL` env switches API between local
  Postgres and Neon — no code change.

</code_context>

<specifics>
## Specific Ideas

- **"festipal" is a working title** — the user explicitly asked that docs/comments
  note that name, bundle ID, and scheme will likely change before store submission.
- The festival list must show the **real** seeded "Frequency 2026" — proving the
  live wiring, not a mock (same spirit as Phase 2's "user-owned seed data").
- OTP codes during device testing should be readable in **Mailpit's web inbox**
  (not just server console) — that's the point of adding Mailpit to compose.
- The rudimentary login is throwaway-styled but NOT throwaway-flow: Phase 4 styles
  and extends **this same** OTP flow (email → code → in), per concept doc 09.

</specifics>

<deferred>
## Deferred Ideas

- **In-app language switcher** (+ persistence of the choice) → with the real
  Profile screen (Phase 6 or later); override axis already supported.
- **Real branding** (logo, colors, splash, icon) → when Claude Design assets exist;
  D-04 wordmark is explicitly placeholder.
- **Final app identity** (name, bundle ID `at.festipal.app`, scheme) → decide
  definitively before first EAS Submit; provisional until then (D-05).
- **EAS Build/Submit/Update pipeline + Apple Developer account** → store-release
  phase; local dev builds suffice this cycle.
- **Railway API deploy + HTTPS/CORS/trustedOrigins for a deployed URL** → when a
  staging environment is needed (post-shell or pre-UAT-with-others); compose+LAN
  covers this phase.
- **TanStack Query persistence (offline cache)** → when cacheable content features
  land (timetable/map phases); provider mounts now without persistence (SC-4).

</deferred>

---

*Phase: 3-mobile-app-shell-i18n-foundation*
*Context gathered: 2026-08-03*
