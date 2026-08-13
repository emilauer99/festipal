# Phase 3: Mobile App Shell & i18n Foundation - Research

**Researched:** 2026-08-03
**Domain:** Expo Router (RN New Architecture) app shell, better-auth Expo client, ts-rest client cookie forwarding, Lingui i18n in a pnpm/Metro monorepo, local docker-compose dev infra
**Confidence:** MEDIUM — core library mechanics confirmed via official docs/GitHub sources found through web search (no Context7/Exa/Brave MCP tools were available this session, see Metadata); the single highest-risk integration point (session-cookie forwarding from better-auth's Expo client into the ts-rest client) is now resolved with a concrete, sourced pattern instead of being left as a research flag.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

**Screens at phase end:** every route group (`(auth)`, `festivals`, `(festival)` home) gets a navigable but unstyled placeholder using Lingui strings; the OTP login (email → 6-digit code → in) is real and must survive a kill-and-relaunch (Pitfall 2); the `festivals` placeholder calls the real `GET /festivals` and shows "Frequency 2026"; save → `my_festival` must work so the visitor can actually reach `(festival)` home.

**App identity is a working title.** `festipal` / `at.festipal.app` / `festipal://` are provisional until the first store submit (which freezes the bundle ID). The scheme must be mirrored in better-auth's `trustedOrigins`; if the scheme ever changes, `trustedOrigins` must change with it.

**i18n behavior:** UI language follows device/system locale only (`resolveUiLocale`, axis 1, ADR-012) — no in-app switcher this phase, but the override parameter already exists so a switcher is additive later. Non-DE/EN devices fall back to **German** (D-07), which is a deliberate deviation from `packages/i18n`'s current `DEFAULT_LOCALE = 'en'` — the planner must decide whether to change the shared constant or add a UI-axis-specific fallback (see Open Questions). Source strings in code are **English**; the German catalog is the translation and must match the binding German concept terms exactly (e.g. "Meine Festivals").

**Dev/test setup:** real Android device (Windows PC, `expo run:android`) + real iPhone (Mac/Xcode, free Apple-ID provisioning, 7-day signature). Devices talk to the local NestJS API over LAN Wi-Fi via `EXPO_PUBLIC_API_URL`; cleartext HTTP is allowed only in dev builds. docker-compose (Postgres 18 + Mailpit) is part of this phase; the API itself stays native (`pnpm dev`), Docker only runs infrastructure.

### Claude's Discretion

- Exact route-group file layout under `app/`, guard implementation details (three-way branch: unauthenticated / authenticated-without-profile / authenticated — Pitfall 5), and the splash gating state machine.
- Monorepo integration of Expo (Metro config for pnpm workspaces, transpiling workspace packages), Lingui + Expo/Babel wiring, and the choice/config of the no-literal-string lint rule (Pitfall 7).
- docker-compose file location and naming, local env-file layout (`.env` / `.env.local` conventions), and how `EXPO_PUBLIC_API_URL` is wired per developer machine (LAN IP differs per network).
- Whether `DEFAULT_LOCALE` changes globally or a UI-axis fallback is introduced (per D-07 planner note) — surface the choice in PLAN.md.
- Placeholder screen content beyond the decided elements (list vs. simple buttons, etc.) — keep unstyled and minimal.

### Deferred Ideas (OUT OF SCOPE)

- In-app language switcher (+ persistence of the choice) → with the real Profile screen (Phase 6 or later); override axis already supported.
- Real branding (logo, colors, splash, icon) → when Claude Design assets exist; D-04 wordmark is explicitly placeholder.
- Final app identity (name, bundle ID, scheme) → decide definitively before first EAS Submit; provisional until then.
- EAS Build/Submit/Update pipeline + Apple Developer account → store-release phase; local dev builds suffice this cycle.
- Railway API deploy + HTTPS/CORS/trustedOrigins for a deployed URL → when a staging environment is needed; compose+LAN covers this phase.
- TanStack Query persistence (offline cache) → when cacheable content features land (timetable/map phases); provider mounts now without persistence (SC-4).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAT-02 | The Expo mobile app (`apps/mobile`) exists and consumes the real API via `packages/contracts` | Standard Stack (ts-rest client + `@better-auth/expo`), Architecture Patterns (`lib/api-client.ts` cookie-forwarding pattern), Common Pitfalls (Pitfall 2, 5), Code Examples |
| I18N-01 | All UI-chrome strings are localizable via Lingui (no hardcoded strings); user-generated content is not translated | Standard Stack (Lingui packages + Metro transformer), Common Pitfalls (Pitfall 7), Don't Hand-Roll (no-literal-string lint), Code Examples |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- TypeScript everywhere, `strict` mode on, pinned to **TypeScript 6.0.x** (ADR-013) — `apps/mobile`'s `tsconfig.json` must extend `packages/config/tsconfig.base.json`, not introduce its own TS version.
- **No untyped `any` at API boundaries** — the ts-rest client derived from `@festipal/contracts` already guarantees this; do not hand-write parallel request/response types.
- **Multi-tenancy from day 1** — not directly exercised by this phase's placeholder screens, but the `festivals`/`(festival)` route naming must not imply a global (non-`festivalId`-scoped) data model once Phase 5 content lands.
- **Offline-first from day 1** — explicitly *not* required this phase (SC-4, TanStack Query mounts without persistence); do not over-build a persistence layer prematurely, but do not paint the provider into a corner that makes adding `persistQueryClient` in a later phase a rewrite (use `QueryClientProvider` directly, no custom wrapper that would need replacing).
- **End-to-end type safety** — `lib/api-client.ts` must derive types from `@festipal/contracts`, no re-declared shapes.
- **Security** — no cashless/payment surface touched this phase. Auth: session storage MUST be `expo-secure-store`, never `AsyncStorage`/MMKV (Pitfall 2). No secrets in the repo — `EXPO_PUBLIC_API_URL` is not secret (it's a LAN URL, and `EXPO_PUBLIC_*` vars are bundled into the client anyway) but `BETTER_AUTH_SECRET` must stay server-side only.
- **i18n from day 1** — no hardcoded user-facing strings; this phase's own literal-string lint rule is what future phases are held to (Pitfall 7). RTL-safe layout is a CLAUDE.md-level requirement generally, but out of scope for this phase's unstyled placeholders — do not spend effort on RTL now, just don't hardcode LTR-only layout primitives that would need rework (avoid absolute `left`/`right` positioning where Flexbox's logical start/end would do just as well, if styling exists at all in placeholders).
- **Conventions:** camelCase, PascalCase types, named exports (no default exports) — `apps/mobile`'s route files under `app/` are the one place Expo Router *requires* default exports (file-based routing convention); this is a documented, unavoidable exception, not a violation to "fix."
- **Git:** trunk-based, Conventional Commits, no direct commits to `main` — already the working pattern (current branch `gsd/phase-02-otp-auth-festival-backend-api`, expect a new phase branch for Phase 3 execution).
- **Before finishing a change:** run lint, typecheck, and the relevant tests — `apps/mobile` needs `lint`/`typecheck` scripts wired into the existing `turbo.json` pipeline (no `test` task exists yet for the app; Vitest is unit-only in this repo so far, and this phase's UAT is manual-device-driven, see Validation Architecture).

## Summary

This phase turns three groups of existing, already-live server-side plumbing (Phase 1's schema, Phase 2's OTP auth + `/api/v1` endpoints) into a real, on-device mobile app. The work is almost entirely **wiring**, not new product logic: a new Expo Router app (`apps/mobile`) that (1) authenticates via better-auth's Expo client against the live NestJS API, (2) derives a fully-typed REST client from `packages/contracts` and forwards the session cookie into every request, (3) gates three route groups behind a splash-held, three-state auth guard, and (4) wraps every UI string in Lingui from the very first commit, backed by a lint rule that fails the build on any string that slips through. A docker-compose file (Postgres 18 + Mailpit) rounds out local dev infrastructure so OTP codes are readable during real-device testing without touching the API's Resend-based production path.

The single highest-risk integration point in this phase — and the one place where "it compiles" can silently hide a broken auth-to-API bridge — is **how the session cookie gets from better-auth's Expo client into the ts-rest client's requests**. React Native has no native cookie jar the way a browser does; `@better-auth/expo`'s client mimics cookie behavior by storing a JSON-encoded cookie map in `expo-secure-store` and exposes a synchronous `authClient.getCookie()` accessor. ts-rest's `initClient` accepts a sync function for any `baseHeaders` value, so the fix is a one-line wire-up: `baseHeaders: { Cookie: () => authClient.getCookie() }` on the ts-rest client, with `credentials: 'omit'` on the underlying fetch to avoid the RN fetch polyfill fighting the manually-set header. This pattern is documented below with sources and should be treated as close to load-bearing as anything in this phase — get it wrong and every "authenticated" API call after login silently 401s while login itself appears to work.

Two other things need explicit, deliberate handling that the phase description doesn't spell out: first, Expo's Metro bundler needs non-default configuration to resolve `@festipal/*` workspace packages through pnpm's symlinked, content-addressed `node_modules/.pnpm` store — the out-of-the-box Metro config does not do this for pnpm (it has first-class support for npm/Yarn/Bun workspaces, but pnpm needs `unstable_enableSymlinks` plus explicit `nodeModulesPaths`/`watchFolders`, unless the Expo SDK version in use has closed this gap — verify at implementation time, SDK 52+ claims automatic pnpm detection but the claim should be spot-checked against the actual installed SDK version). Second, a genuinely new visitor's `GET /me` returns `profile: null` after their first real OTP login (per Phase 2's `MeService.getProfile`) — since profile completion (IDN-01) is explicitly Phase 4 scope, Phase 3's own success criteria (D-02's "rudimentary but REAL" login, D-03's "save → enter works") cannot be met for a truly first-time account without *some* minimal accommodation. This is flagged as an Open Question rather than resolved here, because CONTEXT.md's Claude's-Discretion section explicitly reserves guard implementation details (including the "authenticated-without-profile" branch) for the planner.

**Primary recommendation:** Scaffold `apps/mobile` with Expo SDK 57 (RN New Arch, the current SDK as of this research date) and Expo Router; wire `lib/auth-client.ts` with `@better-auth/expo`'s `expoClient({ scheme: 'festipal', storagePrefix: 'festipal', storage: SecureStore })` and mirror `trustedOrigins: ['festipal://']` (plus `exp://` wildcard entries for the Metro dev-client scheme) into `apps/api/src/auth/auth.instance.ts`; wire `lib/api-client.ts` as a `@ts-rest/core` client with `baseHeaders: { Cookie: () => authClient.getCookie() }`; gate `(auth)` / `festivals` / `(festival)` with `Stack.Protected` guards at the root layout, holding `expo-splash-screen` until session-bootstrap AND (for the auth-guard's third branch) profile-presence both resolve; set up Lingui (`@lingui/core` + `@lingui/react` + `@lingui/babel-plugin-lingui-macro` + `@lingui/cli` + `@lingui/metro-transformer`) with `eslint-plugin-i18next`'s `no-literal-string` rule wired into the flat ESLint config *before* the first screen is written; add a root-level `docker-compose.yml` with `postgres:18` + `axllent/mailpit`; mount a single `QueryClientProvider` at the app root with default options only (no persistence).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Session bootstrap (read persisted session on cold start) | Browser / Client (Expo app) | — | better-auth Expo client owns SecureStore reads; no server round-trip needed until session refresh |
| Auth-gated navigation (route group guards) | Browser / Client (Expo app) | — | Expo Router `Stack.Protected` runs entirely client-side; server has no notion of "current route" |
| OTP request/verify | API / Backend (already built, Phase 2) | Browser / Client | Server owns OTP generation/validation (`emailOTP` plugin); client only calls `authClient.emailOtp.*` and stores the resulting session |
| Session cookie storage + forwarding | Browser / Client (Expo app) | — | `expo-secure-store` holds the cookie map; the client is responsible for attaching it to every ts-rest request (no native cookie jar on RN) |
| Festival list / save (`GET /festivals`, `POST /festivals/:id/save`) | API / Backend (already built, Phase 2) | Browser / Client | Server is the source of truth and already enforces the contract; client is a thin typed caller, no local business logic |
| Locale resolution (UI axis) | Browser / Client (Expo app) | — | `resolveUiLocale` runs on-device against `expo-localization`'s device locales; no server round-trip (ADR-012 axis 1 is entirely client-side by design) |
| Lingui catalog compilation | Browser / Client (build-time, via Metro/babel) | — | Catalogs are compiled into the JS bundle at build time, not fetched at runtime; this keeps the app fully offline-capable for UI chrome even though content isn't cached yet |
| Local dev infrastructure (Postgres, Mailpit) | Database / Storage (docker-compose) | — | Purely a dev-environment concern; production targets Neon + Resend, no code path branches on "is this docker" |
| API server itself | API / Backend (native `pnpm dev`, unchanged) | — | Explicitly NOT containerized this phase (D-11) — only its dependencies are |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo` | 57.0.9 [VERIFIED: npm registry] | Expo SDK / managed workflow, RN New Architecture | Current SDK; RN New Arch is default since SDK 53+ |
| `expo-router` | 57.0.9 [VERIFIED: npm registry] | File-based routing, `Stack.Protected` route guards | Already the project's chosen router (CLAUDE.md, ADR list) |
| `react-native` | 0.86.2 [VERIFIED: npm registry] | RN runtime paired with Expo 57 | Peer dependency of `expo` |
| `@better-auth/expo` | 1.6.25 [VERIFIED: npm registry] | Expo/native client plugin for better-auth (SecureStore session, `emailOTP` client methods) | Official better-auth Expo integration; matches server's `better-auth@1.6.25` (Phase 2) |
| `expo-secure-store` | 57.0.1 [VERIFIED: npm registry] | Encrypted on-device session storage | Required by `expoClient({ storage })`; the only acceptable session store per Pitfall 2 |
| `@ts-rest/core` | 3.52.1 (repo-pinned) [VERIFIED: npm registry] | Typed REST client derived from `packages/contracts` | Already the project's chosen API-typing layer (ADR-006); same version already used server-side |
| `@tanstack/react-query` | 5.101.4 [VERIFIED: npm registry] | Single query/cache provider (no persistence this phase) | Explicitly named in the phase's SC-4 |
| `@lingui/core` | 6.6.0 (repo-pinned, matches `packages/i18n`) [VERIFIED: npm registry] | i18n runtime (ICU MessageFormat) | Already adopted (ADR-012), already a `packages/i18n` dependency |
| `@lingui/react` | 6.6.0 [VERIFIED: npm registry] | React bindings (`<Trans>`, `useLingui`) — works in RN since it targets React, not the DOM | No separate `@lingui/react-native` package exists (confirmed: 404 on registry) |
| `@lingui/babel-plugin-lingui-macro` | 6.6.0 [VERIFIED: npm registry] | Compiles `t()`/`<Trans>` macros, extraction source | Lingui's compile-time extraction mechanism |
| `@lingui/cli` | 6.6.0 [VERIFIED: npm registry] | `lingui extract` / `lingui compile` | Catalog tooling |
| `@lingui/metro-transformer` | 6.6.0 [VERIFIED: npm registry] | Lets Metro compile `.po` catalogs on the fly in RN | Official Lingui RN integration piece; without it, catalogs must be pre-compiled to `.js`/`.mjs` before every Metro build |
| `eslint-plugin-i18next` | 6.1.5 [VERIFIED: npm registry] | `no-literal-string` lint rule (Pitfall 7 mitigation) | Framework-agnostic (`framework: 'react'`, `mode: 'jsx-text-only'`), works against RN JSX; the project's own PITFALLS.md names this exact plugin as an option |
| `expo-localization` | 57.0.1 [VERIFIED: npm registry] | Reads device locale list for `resolveUiLocale`'s `systemLocales` input | Already referenced by name in `packages/i18n/src/resolve.ts`'s doc comment and ADR-012 |
| `expo-splash-screen` | 57.0.5 [VERIFIED: npm registry] | `preventAutoHideAsync()` / `hideAsync()` for the splash-gating state machine (SC-2) | Standard Expo splash control API |
| `expo-secure-store` size ceiling | ~2048 bytes/value [CITED: docs.expo.dev/versions/latest/sdk/securestore] | Governs how the session cookie map is stored | See Common Pitfalls — better-auth's cookie map is normally well under this, but worth a build-time sanity check once real cookies exist |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-native-safe-area-context` | latest [VERIFIED: npm registry, OK verdict] | Safe-area insets for splash/placeholder layout | Required peer for Expo Router regardless of styling ambition |
| `react-native-screens` | latest [VERIFIED: npm registry] | Native screen primitives Expo Router builds on | Required peer of `expo-router` |
| `expo-constants` | 57.0.9 [VERIFIED: npm registry] | Read `app.json`/env-injected config at runtime if needed beyond `EXPO_PUBLIC_*` | Only if `EXPO_PUBLIC_API_URL` alone proves insufficient (e.g. per-device overrides) |
| `expo-linking` | 57.0.5 [VERIFIED: npm registry] | Deep-link URL construction/parsing for the `festipal://` scheme | Needed once the guard must handle a deep link into a protected route (Pitfall 5) |
| `@formatjs/intl-locale`, `@formatjs/intl-pluralrules` | latest [CITED: lingui.dev/tutorials/react-native] | Polyfills for `Intl.Locale`/`Intl.PluralRules` on Hermes | Only if Lingui's ICU plural/date formatting misbehaves on-device — verify against the current Expo/Hermes version first, Hermes has been closing Intl gaps release over release |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual `Cookie` header via `authClient.getCookie()` | A custom `fetch` wrapper injected into `initClient`'s `api` option | Both work; the `baseHeaders` function form is less code and matches ts-rest's documented pattern for auth tokens — prefer it unless a future requirement (e.g. request signing) needs full fetch-call interception |
| `eslint-plugin-i18next`'s `no-literal-string` | A hand-rolled ESLint rule via `eslint-plugin-lingui` conventions, or `@lingui/eslint-plugin` (if/when it ships a literal-detection rule) | `eslint-plugin-i18next` is framework-agnostic and doesn't know about Lingui macros specifically — it flags *any* unwrapped string, which is actually what's wanted here (Pitfall 7's problem is strings that were never wrapped in anything); verify its `ignoreCallee`/`ignoreAttribute` options are enough to avoid false positives on non-user-facing strings (route names, testIDs, style tokens) |
| `@lingui/metro-transformer` (on-the-fly `.po` compilation) | Pre-compile catalogs to `.js` via `lingui compile` as a pre-build/pre-commit step, skip the Metro transformer | Simpler dependency graph, but breaks the "edit `.po`, see it live in Metro" dev loop; given this phase ships real DE/EN catalogs (not stubs), the transformer is worth the extra dependency |
| Manual Metro `watchFolders`/`nodeModulesPaths` config | Rely on Expo SDK 57's claimed automatic pnpm monorepo detection | Verify first — if SDK 57's `expo/metro-config` genuinely auto-detects pnpm (as claimed for "SDK 52+"), the manual config becomes redundant; if the app fails to resolve `@festipal/*` packages out of the box, fall back to the manual `unstable_enableSymlinks` + explicit paths pattern documented under Code Examples |

**Installation:**
```bash
# from apps/mobile, after `pnpm create expo-app@latest apps/mobile --template blank-typescript`
pnpm add expo-router @better-auth/expo expo-secure-store expo-localization \
  expo-splash-screen expo-constants expo-linking react-native-safe-area-context \
  react-native-screens @tanstack/react-query \
  @lingui/core @lingui/react
pnpm add -D @lingui/babel-plugin-lingui-macro @lingui/cli @lingui/metro-transformer \
  eslint-plugin-i18next
```
`better-auth` (server-side client peer) and `@festipal/contracts`/`@festipal/i18n`/`@festipal/db` (workspace) resolve via `workspace:*` — do not add a second `better-auth` version, reuse the root-pinned `1.6.25`.

**Version verification:** All versions above were checked live via `npm view <pkg> version` against the npm registry on 2026-08-03 (see Package Legitimacy Audit below for the full per-package registry signals). `expo`/`expo-router` land on the same `57.0.9` release train; `react-native` `0.86.2` is `expo`'s declared peer range (`*`, resolved via `npx expo install` conventions at implementation time — do not hand-pin a mismatched RN version).

## Package Legitimacy Audit

Every package below returned `exists: true` from the npm registry with an official GitHub source repo and substantial (500K–62M) weekly downloads — none show characteristics of a hallucinated or slopsquatted package. The `SUS` verdicts below are **entirely** driven by the legitimacy-check heuristic's `too-new` signal, which measures *latest published version's release date* rather than package age; these are actively-maintained, high-traffic packages (Expo SDK 57, `@lingui` 6.6.0, `@tanstack/react-query` 5.101.4, `@better-auth/expo` 1.6.25) that all had a release in the last ~2 weeks before this research date — consistent with normal maintenance cadence for the ecosystem's most-used mobile/RN tooling, not a risk signal on its own. Cross-referenced against official docs/GitHub during research (Standard Stack table above) rather than accepted on registry presence alone.

| Package | Registry | Latest Publish | Weekly Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----------------|-------------------|--------------|---------|-------------|
| `expo` | npm | 2026-07-29 | 7.5M | github.com/expo/expo | SUS (too-new only) | Approved — established package, see note above |
| `expo-router` | npm | 2026-07-29 | 4.9M | github.com/expo/expo | SUS (too-new only) | Approved |
| `expo-secure-store` | npm | 2026-07-15 | 4.5M | github.com/expo/expo | SUS (too-new only) | Approved |
| `expo-localization` | npm | 2026-07-15 | 2.1M | github.com/expo/expo | SUS (too-new only) | Approved |
| `expo-splash-screen` | npm | 2026-07-22 | 4.7M | github.com/expo/expo | SUS (too-new only) | Approved |
| `expo-constants` | npm | 2026-07-29 | 8.0M | github.com/expo/expo | SUS (too-new only) | Approved |
| `expo-linking` | npm | 2026-07-22 | 5.7M | github.com/expo/expo | SUS (too-new only) | Approved |
| `react-native-safe-area-context` | npm | 2026-05-18 | 7.9M | github.com/AppAndFlow/react-native-safe-area-context | OK | Approved |
| `react-native-screens` | npm | 2026-07-16 | 6.9M | github.com/software-mansion/react-native-screens | SUS (too-new only) | Approved |
| `@better-auth/expo` | npm | 2026-07-23 | 479K | github.com/better-auth/better-auth | SUS (too-new only) | Approved |
| `@lingui/core` | npm | 2026-07-24 | 1.5M | github.com/lingui/js-lingui | SUS (too-new only) | Approved |
| `@lingui/react` | npm | 2026-07-24 | 968K | github.com/lingui/js-lingui | SUS (too-new only) | Approved |
| `@lingui/babel-plugin-lingui-macro` | npm | 2026-07-24 | 892K | github.com/lingui/js-lingui | SUS (too-new only) | Approved |
| `@lingui/cli` | npm | 2026-07-24 | 931K | github.com/lingui/js-lingui | SUS (too-new only) | Approved |
| `@lingui/metro-transformer` | npm | 2026-07-24 | 38K | github.com/lingui/js-lingui | SUS (too-new only) | Approved — lower download count than siblings because it's an RN-only add-on, not the whole ecosystem uses it; still the official Lingui monorepo |
| `eslint-plugin-i18next` | npm | 2026-06-28 | 1.2M | github.com/edvardchen/eslint-plugin-i18next | OK | Approved |
| `@tanstack/react-query` | npm | 2026-07-21 | 62.1M | github.com/TanStack/query | SUS (too-new only) | Approved |

**Packages removed due to `[SLOP]` verdict:** none.
**Packages flagged as suspicious `[SUS]`:** all `too-new`-only flags above are dispositioned "Approved" per the reasoning stated in this section's preamble — no `checkpoint:human-verify` gate is warranted for packages with 8-figure download counts and an official monorepo source, but the planner may still choose to add a lightweight "confirm `npm view <pkg> version` matches this table" step per install if being maximally conservative, since these numbers will drift between research and execution.

*No packages in this list were sourced from WebSearch/training-data guesses without registry confirmation — every name above was verified live via `npm view`.*

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │              Expo App (apps/mobile)          │
                    │                                                │
  Cold start ───────▶  app/_layout.tsx (root)                        │
                    │    ├─ SplashScreen.preventAutoHideAsync()      │
                    │    ├─ authClient session bootstrap (async,     │
                    │    │   reads SecureStore via @better-auth/     │
                    │    │   expo) ─────────────┐                    │
                    │    ├─ GET /me (via ts-rest, only if session    │
                    │    │   exists) — resolves profile: null|obj    │
                    │    ├─ QueryClientProvider (single, no persist) │
                    │    └─ i18n.activate(deviceLocale|'de') ────────┼──▶ Lingui catalog (compiled)
                    │         │  three states resolved:              │
                    │         │  unauthenticated | authed-no-profile │
                    │         │  | authed                            │
                    │         ▼                                       │
                    │    SplashScreen.hideAsync() ───────────────────┘
                    │         │
                    │         ▼
                    │    Stack.Protected route groups
                    │    ┌──────────────┬───────────────┬──────────────┐
                    │    │  (auth)      │  festivals     │ (festival)   │
                    │    │  email→OTP   │  GET /festivals│  home        │
                    │    │  screens     │  save→my_festival│ placeholder│
                    │    └──────┬───────┴────────┬────────┴──────┬───────┘
                    │           │                 │                │
                    │           ▼                 ▼                ▼
                    │    lib/auth-client.ts   lib/api-client.ts (ts-rest,
                    │    (authClient.emailOtp  Cookie header from
                    │     .sendVerificationOtp  authClient.getCookie())
                    │     / .verify)                 │
                    └───────────┼────────────────────┼────────────────┘
                                │  session cookie      │  Cookie header +
                                │  set on verify        │  typed request
                                ▼                       ▼
                    ┌───────────────────────────────────────────────┐
                    │          NestJS API (apps/api, native)          │
                    │  /api/auth/*  (better-auth, emailOTP plugin)     │
                    │  /api/v1/*    (ts-rest handlers: festivals,      │
                    │                me, complete-profile)             │
                    └───────────────────┬───────────────────────────┘
                                          │
                    ┌─────────────────────┴───────────────────────────┐
                    │        docker-compose (dev infra only)            │
                    │  postgres:18 (DATABASE_URL)                        │
                    │  axllent/mailpit (OTP dev email transport,         │
                    │   SMTP :1025, Web UI :8025)                        │
                    └────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
apps/mobile/
├── app/                        # Expo Router file-based routes
│   ├── _layout.tsx             # root layout: splash gate, providers, Stack.Protected groups
│   ├── (auth)/
│   │   ├── _layout.tsx         # unauthenticated-only guard
│   │   ├── index.tsx           # email entry
│   │   └── verify.tsx          # OTP code entry
│   ├── festivals/
│   │   ├── _layout.tsx         # authenticated (any profile state) guard
│   │   └── index.tsx           # GET /festivals list + save
│   └── (festival)/
│       ├── _layout.tsx         # authenticated + profile-complete guard (see Open Questions)
│       └── index.tsx           # festival home placeholder
├── lib/
│   ├── auth-client.ts          # better-auth Expo client (expoClient + emailOTP plugin)
│   ├── api-client.ts           # ts-rest client, Cookie header wiring
│   └── query-client.ts         # single QueryClient instance factory
├── locales/
│   ├── en/messages.po
│   └── de/messages.po
├── lingui.config.ts
├── metro.config.js             # pnpm workspace resolution + Lingui transformer
├── babel.config.js             # lingui macro plugin
├── app.json                    # scheme: "festipal", bundle id: "at.festipal.app"
├── eslint.config.mjs           # extends @festipal/config/eslint + i18next plugin
├── tsconfig.json                # extends @festipal/config/tsconfig.base.json
└── package.json                 # name: "@festipal/mobile"
```

### Pattern 1: Splash-held three-state auth guard

**What:** Hold the splash screen until session bootstrap AND profile-presence both resolve, then branch into one of three states, not two.
**When to use:** Root layout, before any `Stack.Protected` group is evaluated.
**Example:**
```typescript
// app/_layout.tsx — Source: pattern synthesized from Expo Router "Protected
// routes" docs (docs.expo.dev/router/advanced/protected) + better-auth Expo
// client session hook, per Pitfall 5's three-way branch requirement.
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { authClient } from '../lib/auth-client';
import { apiClient } from '../lib/api-client';

SplashScreen.preventAutoHideAsync();

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated-no-profile' }
  | { status: 'authenticated' };

export default function RootLayout() {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const unsub = authClient.useSession.subscribe(async (session) => {
      if (!session.data) {
        setState({ status: 'unauthenticated' });
        await SplashScreen.hideAsync();
        return;
      }
      const me = await apiClient.getMe();
      setState(
        me.status === 200 && me.body.profile
          ? { status: 'authenticated' }
          : { status: 'authenticated-no-profile' },
      );
      await SplashScreen.hideAsync();
    });
    return unsub;
  }, []);

  if (state.status === 'loading') return null; // splash still visible

  return (
    <Stack>
      <Stack.Protected guard={state.status === 'unauthenticated'}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={state.status !== 'unauthenticated'}>
        <Stack.Screen name="festivals" />
      </Stack.Protected>
      <Stack.Protected guard={state.status === 'authenticated'}>
        <Stack.Screen name="(festival)" />
      </Stack.Protected>
    </Stack>
  );
}
```
*Note: the exact `authClient.useSession` subscription shape depends on `@better-auth/expo`'s actual React hook surface — verify the precise API (hook vs. store subscription) against the installed version at implementation time; the state-machine shape (loading → one of three branches, splash held throughout) is the load-bearing part of this pattern, not the exact subscription mechanics.*

### Pattern 2: ts-rest client with cookie forwarding from the Expo auth client

**What:** Wire the session cookie from `@better-auth/expo`'s SecureStore-backed cookie jar into every ts-rest request via a synchronous `baseHeaders` function.
**When to use:** `lib/api-client.ts`, the single shared ts-rest client instance.
**Example:**
```typescript
// lib/api-client.ts — Source: ts-rest docs (ts-rest.com/client/fetch,
// baseHeaders supports sync functions) + better-auth Expo/cookies docs
// (better-auth.com/docs/integrations/expo, better-auth.com/docs/concepts/cookies:
// authClient.getCookie() reads the SecureStore-backed cookie map synchronously).
import { initClient } from '@ts-rest/core';
import { contract } from '@festipal/contracts';
import { authClient } from './auth-client';

export const apiClient = initClient(contract, {
  baseUrl: process.env.EXPO_PUBLIC_API_URL!,
  baseHeaders: {
    Cookie: () => authClient.getCookie(),
  },
  // 'omit' avoids RN's fetch polyfill trying to manage cookies itself and
  // fighting the manually-set header (Pitfall: cookie handling on RN has no
  // native jar; letting fetch also try 'include' can silently drop the header).
  credentials: 'omit',
});
```
Do **not** reach for `credentials: 'include'` on React Native — unlike a browser, RN's fetch has no cookie store to include from, and mixing it with a manual `Cookie` header is the exact anti-pattern flagged during research (see Sources: "React Native lacks native cookie support").

### Pattern 3: better-auth Expo client + `emailOTP` client plugin

**What:** The auth client instance wired for native storage and OTP sign-in.
**When to use:** `lib/auth-client.ts`, imported by both the `(auth)` screens and `api-client.ts`.
**Example:**
```typescript
// lib/auth-client.ts — Source: better-auth.com/docs/integrations/expo
import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { emailOTPClient } from 'better-auth/client/plugins';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [
    expoClient({
      scheme: 'festipal', // D-05 — working title; keep in sync with trustedOrigins
      storagePrefix: 'festipal',
      storage: SecureStore,
    }),
    emailOTPClient(),
  ],
});
```
Server-side (`apps/api/src/auth/auth.instance.ts`), `trustedOrigins` must gain the app scheme — this line does not exist yet in the codebase and must be added this phase:
```typescript
export const auth = betterAuth({
  // ...existing config...
  trustedOrigins: [
    'festipal://', // D-05 working title — keep in sync if scheme changes
    'exp://', 'exp://**', // Expo dev-client (Metro) scheme during `expo run:*`
  ],
});
```

### Pattern 4: Metro config for pnpm workspace resolution

**What:** Let Metro resolve `@festipal/contracts`, `@festipal/i18n`, `@festipal/db` (workspace packages) through pnpm's symlinked store, and enable the Lingui `.po` transformer.
**When to use:** `apps/mobile/metro.config.js`.
**Example:**
```javascript
// metro.config.js — Source: docs.expo.dev/guides/monorepos (pnpm section) +
// Lingui Metro transformer docs. VERIFY at implementation time whether the
// installed Expo SDK's automatic pnpm detection makes the manual
// watchFolders/nodeModulesPaths block redundant — if `expo start` resolves
// @festipal/* without it, prefer the shorter config.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm-specific: packages live behind symlinks in the content-addressed store.
config.resolver.unstable_enableSymlinks = true;
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
// Do NOT set disableHierarchicalLookups: true — breaks pnpm's store lookup.

// Lingui: compile .po catalogs on the fly.
const { withLingui } = require('@lingui/metro-transformer/expo');
module.exports = withLingui(config);
```

### Anti-Patterns to Avoid

- **`AsyncStorage`/MMKV for the auth session:** Compiles fine, "works" in dev, but is unencrypted and defeats Pitfall 2's entire premise. Only `expo-secure-store` via `expoClient({ storage })`.
- **`credentials: 'include'` on the RN ts-rest fetch:** No native cookie jar exists on RN to include from; this either does nothing or interferes with the manually-set `Cookie` header (Pattern 2).
- **Checking only `!!session` in the route guard:** Misses the "authenticated but no `VisitorProfile` yet" branch (Pitfall 5's update, this phase's third guard state) — see Open Questions for how this interacts with Phase 4's scope.
- **Building a custom `/auth/refresh` endpoint or manual token-rotation on the client:** better-auth's session is a single sliding-window token, not an OAuth refresh-token pair (Pitfall 10, already resolved server-side in Phase 2 via `session.expiresIn`/`updateAge`). The client only needs to redirect to OTP re-login on session expiry, never attempt a "silent refresh" first.
- **Deferring the `no-literal-string` lint rule "until there's real content to translate":** This is the exact trap Pitfall 7 describes — set it up before the first screen, not after.
- **Hand-declaring a second `better-auth` version or a parallel Zod schema for `/me`/`/festivals` responses:** Both already exist (Phase 2); the mobile app must derive from `@festipal/contracts`, never re-declare (Pitfall 6, CLAUDE.md).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Session persistence across app restarts | A custom SecureStore read/write wrapper around raw fetch cookies | `@better-auth/expo`'s `expoClient({ storage: SecureStore })` | Handles the SecureStore key-naming edge case (colons aren't valid SecureStore key characters; the plugin already deals with this) and the cookie-map serialization format |
| OTP request/verify UI state machine | Custom polling/retry logic for "did the code arrive" | `authClient.emailOtp.sendVerificationOtp` / `authClient.signIn.emailOtp` (already server-configured in Phase 2 with `resendStrategy: 'reuse'`) | The resend-reuse semantics are a server-side plugin config already made; a client reimplementation would drift from it |
| Typed API client for `/api/v1/*` | Hand-written `fetch` wrappers per endpoint with manually maintained response types | `initClient(contract, {...})` from `@ts-rest/core`, bound to `@festipal/contracts` | Contract drift (Pitfall 6) is exactly what this phase's plumbing exists to prevent |
| Route protection / redirect-on-auth-change | Per-screen `if (!user) return <Redirect />` checks | `Stack.Protected` guards at the route-group layout level | Per-screen checks miss deep links and don't re-evaluate on navigation (Pitfall 5) |
| Literal-string detection | A manual grep-before-commit habit | `eslint-plugin-i18next`'s `no-literal-string` rule wired into CI/lint | Habits don't survive time pressure; a failing lint rule does (Pitfall 7) |
| Cross-locale plural/date formatting | Hand-rolled plural-form `if/else` chains | Lingui's ICU MessageFormat (`t` macro with `{count, plural, ...}`) + `Intl` for raw date/number formatting (ADR-012) | Already the project's committed pattern; German/English plural rules genuinely differ, worth getting from a library |
| Local dev SMTP capture | Reusing Phase 2's file-based dev transport (`apps/api/.otp-dev-transport.local.json`) for device testing | Mailpit via docker-compose (D-11), read via its web UI at `:8025` | The file-transport was built for a same-machine smoke script; a phone on the same Wi-Fi can't read a file on the dev machine's disk, but it CAN hit `http://<lan-ip>:8025` |

**Key insight:** Every piece of "hard" logic in this phase — OTP semantics, session lifetime, contract shapes, tenant scoping — was already decided and built server-side in Phases 1–2. Phase 3's job is almost entirely *faithful wiring*, not new design. Every hand-rolled shortcut here either duplicates a decision already made upstream (and risks drifting from it) or reopens a security/UX problem (Pitfalls 2/5/7/10) that was already solved in principle but needs the client-side half of the fix.

## Common Pitfalls

*(Pitfalls 2, 5, 7, 10 below are the project's own PITFALLS.md entries for this phase, restated with this session's confirming research; the remaining pitfalls are new findings from this session specific to the Metro/pnpm and cookie-forwarding mechanics.)*

### Pitfall A (project PITFALLS.md #2): Auth on native silently falls back to insecure or non-persistent storage
**What goes wrong:** Copying a browser-oriented `createAuthClient` snippet without `@better-auth/expo`'s `expoClient` plugin, or configuring `storage` as `AsyncStorage` instead of `SecureStore`.
**Why it happens:** The app *compiles and appears to work* in dev/simulator even with the wrong storage — SecureStore has no loud simulator error.
**How to avoid:** Pin to Pattern 3 above exactly; verify explicitly with a **kill-and-relaunch** test (force-quit the process, not just background it), per D-02's UAT requirement.
**Warning signs:** Session survives Fast Refresh but not a full app kill.

### Pitfall B (project PITFALLS.md #5): Auth-flash / deep-link bypass / missing third guard state
**What goes wrong:** Gating with a per-screen `if (!user)` check instead of at the route-group layout; or only checking `!!session` and missing the "authenticated but no profile" branch.
**Why it happens:** Expo Router renders eagerly; the natural first instinct doesn't account for async SecureStore reads or the profile-completeness dimension.
**How to avoid:** Pattern 1 above — splash held until BOTH session and profile resolve, three explicit states, guards at the group-layout level.
**Warning signs:** Visible flicker on cold start; a deep link to a protected route opens directly while logged out.

### Pitfall C (project PITFALLS.md #7): Lingui scaffolding lands but literal strings creep in
**What goes wrong:** Lingui's own ESLint plugin doesn't flag plain JSX text/string literals that were never wrapped — only malformed macro usage.
**Why it happens:** This is the *first* UI code in the repo; there's no existing pattern to copy, making it the highest-risk moment for the shortcut to become the norm.
**How to avoid:** `eslint-plugin-i18next`'s `no-literal-string` rule (framework: 'react', mode: 'jsx-text-only') wired in **before** the first screen; run `lingui extract` as part of CI/pre-commit so near-zero catalog output after screens exist is visibly wrong.
**Warning signs:** Grep for quoted JSX string literals outside `t()`/`<Trans>` turns up matches; `lingui extract` output stays near-empty despite multiple screens.

### Pitfall D (project PITFALLS.md #10): "Refresh-Token" wording tempts a custom refresh flow
**What goes wrong:** Building a `/auth/refresh` endpoint or manual token-rotation client-side, misreading the concept doc's "Refresh-Token" vocabulary literally.
**Why it happens:** better-auth has one sliding-window session token (already configured server-side, Phase 2), not an OAuth-style refresh-token pair.
**How to avoid:** On session-expired, just redirect to OTP re-login — no "try refresh first" step. Document this explicitly in the plan (a one-line comment, per PITFALLS.md's own recommendation) so nobody re-derives the misreading during this phase.

### Pitfall E (new, this session): Metro doesn't resolve pnpm workspace packages out of the box
**What goes wrong:** `@festipal/contracts`/`@festipal/i18n`/`@festipal/db` imports fail to resolve (or resolve to a stale/duplicate copy) because Metro's default resolver doesn't traverse pnpm's symlinked `node_modules/.pnpm` store the way it does for npm/Yarn hoisted `node_modules`.
**Why it happens:** Metro's monorepo support historically targeted npm/Yarn workspaces first; pnpm's strict, symlink-based `node_modules` layout needs `unstable_enableSymlinks: true` plus explicit `watchFolders`/`nodeModulesPaths` (Pattern 4). Some recent Expo SDK versions claim automatic pnpm detection — this claim was found via web search only and should be spot-checked against the actually-installed SDK version before assuming the manual config is unnecessary.
**How to avoid:** Start with Pattern 4's explicit config; only strip it down once `expo start` is confirmed to resolve `@festipal/*` imports without it. Do not set `disableHierarchicalLookups: true` — it breaks pnpm's store lookup entirely.
**Warning signs:** "Unable to resolve module @festipal/contracts" at Metro bundle time; or the app runs but changes to `packages/contracts` don't hot-reload (stale resolution, watchFolders missing the monorepo root).

### Pitfall F (new, this session): `credentials: 'include'` on RN fetch silently breaks the manual Cookie header
**What goes wrong:** Setting both a manual `Cookie` header (via `baseHeaders`) AND `credentials: 'include'` on the ts-rest client — RN's fetch polyfill has no cookie jar to "include" from, and the combination is documented to interfere with manually-set cookie headers rather than being a harmless no-op.
**Why it happens:** `credentials: 'include'` is the correct pattern on web (browser-native fetch); copying that pattern to RN without realizing RN's fetch has no analogous cookie store is an easy mistake, especially since it doesn't error — it just silently drops or garbles the header.
**How to avoid:** Pattern 2 above — `credentials: 'omit'`, manual `Cookie` header only, sourced from `authClient.getCookie()`.
**Warning signs:** Login appears to succeed (the OTP verify call itself works, since that's a direct `authClient` call) but every subsequent `apiClient.*` call 401s — this is the exact "auth client works, API client silently isn't authenticated" failure mode this pitfall produces.

### Pitfall G (new, this session): Android cleartext HTTP to the LAN API needs `expo-build-properties`, not just `app.json`
**What goes wrong:** `EXPO_PUBLIC_API_URL` points at `http://<lan-ip>:8081` (D-10 — no HTTPS for the local API), but Android 9+ blocks cleartext traffic by default; `app.json` alone has no field for `usesCleartextTraffic`.
**Why it happens:** The Android manifest flag isn't exposed through Expo's plain JSON config; it requires the `expo-build-properties` config plugin (or, if ejected, direct manifest/`network_security_config.xml` edits) even without leaving the managed workflow.
**How to avoid:** Add `expo-build-properties` as a dev dependency and set `android.usesCleartextTraffic: true` (dev-build-only, per D-10's explicit scoping) in `app.json`'s plugins array. On iOS, use an ATS exception domain in `app.json`'s `infoPlist` for the same LAN-HTTP case — verify the exact `NSExceptionDomains` shape against current Expo docs at implementation time (not independently re-verified this session beyond confirming the general requirement).
**Warning signs:** Android device throws a network security exception / silent fetch failure hitting the LAN API over `http://`; works fine in the iOS Simulator (Simulator is more permissive) masking the Android-specific gap until real-device testing (which D-09 mandates anyway).

## Code Examples

Verified patterns from official sources (see inline `Source:` comments above under Architecture Patterns 1–4 for the primary examples). One additional snippet:

### Reading device locales for `resolveUiLocale`
```typescript
// Source: pattern derived from packages/i18n/src/resolve.ts's own doc comment
// ("systemLocales... from expo-localization's getLocales()") + ADR-012 D-07's
// German-fallback requirement (not EN as packages/i18n currently defaults).
import * as Localization from 'expo-localization';
import { resolveUiLocale } from '@festipal/i18n';

const deviceLocales = Localization.getLocales().map((l) => l.languageTag);
// D-07: this phase's UI fallback is German, not packages/i18n's current
// DEFAULT_LOCALE='en' — see Open Questions for how the planner should resolve
// this (change the shared constant vs. a UI-axis-specific override param).
const uiLocale = resolveUiLocale({ systemLocales: deviceLocales });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-------------------|----------------|--------|
| Expo Router `useAuth()` + manual `<Redirect>` per screen | `Stack.Protected` declarative guards | Expo SDK 53 (2026) | Cleaner, auto-cleans navigation history on guard failure; the project's phase description already names `Stack.Protected` explicitly |
| OAuth-style access-token + refresh-token pair | better-auth's single sliding-window session (`expiresIn`/`updateAge`) | better-auth's session model (current) | No client-side refresh logic needed at all — simpler than the concept doc's "Refresh-Token" wording implies (Pitfall D) |
| Manual per-package Metro config for monorepos | `expo/metro-config`'s claimed built-in pnpm/Bun/Yarn/npm detection (SDK 52+) | Recent Expo SDK releases | Reduces boilerplate IF it holds for this project's actual pnpm layout — verify, don't assume (Pitfall E) |

**Deprecated/outdated:**
- Manual `if (!user) return <Redirect href="/login" />` inside individual screen components — superseded by group-layout-level `Stack.Protected` guards for this project's needs (still valid Expo Router API, just the wrong altitude for this phase's three-state requirement).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|----------------|
| A1 | Expo SDK 57's `expo/metro-config` auto-detects pnpm workspaces without manual `watchFolders`/`nodeModulesPaths` (claim found via web search, not independently confirmed against the actual `expo/metro-config` source for 57.0.9) | Standard Stack (Alternatives Considered), Pitfall E | Low — Pattern 4's explicit manual config is the documented fallback either way; worst case is a few redundant lines, not a broken build |
| A2 | The exact `authClient.useSession` subscription API shape (hook vs. store-subscribe callback) shown in Pattern 1 | Architecture Patterns, Pattern 1 | Medium — if the actual `@better-auth/expo`/`better-auth/react` hook surface differs (e.g. a plain `useSession()` hook rather than a `.subscribe()` method), the splash-gating code needs a different (but structurally equivalent) wiring; verify against the installed `better-auth@1.6.25` client API at implementation time |
| A3 | iOS ATS exception config shape (`NSExceptionDomains` under `app.json`'s `infoPlist`) for allowing cleartext LAN HTTP | Common Pitfalls, Pitfall G | Low-Medium — if the shape is wrong, iOS device testing against the LAN API fails with a clear network error, not a silent one; fixable by consulting current Expo `app.json` docs at implementation time |
| A4 | `@formatjs/intl-locale`/`@formatjs/intl-pluralrules` polyfills are still needed on the current Hermes/Expo 57 runtime (2026 web-search claim dated to a 2024 blog post) | Standard Stack (Supporting) | Low — worst case, an unnecessary dependency is added; Hermes's `Intl` coverage has been closing gaps release over release, so this should be spot-checked (does a German plural render correctly without the polyfill?) rather than added reflexively |
| A5 | A genuinely first-time OTP login needs *some* minimal profile-completion accommodation in Phase 3, since Phase 2's `MeService.getProfile` returns `null` and the seed script creates no visitor profile | Summary, Open Questions | High if unaddressed — without a resolution, D-02's "rudimentary but REAL" OTP flow and D-03's "save → enter works" cannot both be demonstrated end-to-end for a fresh account; see Open Questions for the decision the planner must make |

## Open Questions

1. **How does Phase 3 handle a genuinely new visitor's `profile: null` state, given IDN-01 (real profile completion) is Phase 4 scope?**
   - What we know: `GET /me` returns `{ accountId, email, profile: null }` for any account with no `visitor_profile` row (Phase 2, `MeService.getProfile`); the seed script creates only a festival, no visitor profile; D-02 explicitly forbids a dev bypass or script-injected session, implying real interactive OTP testing that — for a first-time tester — *will* hit this state.
   - What's unclear: whether the plan should (a) build a minimal, unstyled stub "complete profile" screen this phase (auto-filling a placeholder username/displayName, calling the already-built `POST /me/complete-profile` contract endpoint) so the guard's third branch has somewhere to route to, or (b) treat "authenticated-no-profile" as a dead-end state this phase and only demonstrate the full flow with a pre-provisioned test account (pre-seeded via a one-off script call, not a dev bypass in the app itself), deferring any UI for it to Phase 4.
   - Recommendation: prefer (a) — a minimal stub screen costs little (the contract endpoint and DB constraint already exist, Phase 2), keeps the guard's three-state logic genuinely exercised end-to-end rather than untested, and avoids a "looks done but isn't" gap when Phase 4 replaces it with the real, designed profile-completion UI. Route it as a fourth `Stack.Protected` branch (or a screen inside `festivals`'s layout reachable only in the no-profile state) — CONTEXT.md's Claude's-Discretion section already reserves this exact guard-branch decision for the planner.

2. **Does `expo/metro-config`'s pnpm auto-detection (claimed for SDK 52+) actually cover this monorepo's layout, or is the manual `watchFolders`/`nodeModulesPaths` config (Pattern 4) required?**
   - What we know: the claim exists in Expo's own monorepo guide per web search (not independently verified against the exact 57.0.9 `expo/metro-config` source this session, since no MCP doc-fetch tool was available — see Metadata).
   - What's unclear: whether it holds for this specific repo's `pnpm-workspace.yaml` shape (`apps/*` + `packages/*`, `allowBuilds`/`onlyBuiltDependencies` pins) without adjustment.
   - Recommendation: attempt the shorter (auto-detected) config first at implementation time; fall back to Pattern 4's explicit block immediately if `@festipal/*` imports fail to resolve. Either way, the plan should include an explicit "workspace package import resolves" verification step early (e.g., import and render `LOCALE_LABELS` from `@festipal/i18n` on the very first placeholder screen) rather than discovering a Metro resolution gap deep into screen-building.

3. **Should `packages/i18n`'s `DEFAULT_LOCALE` constant change from `'en'` to `'de'`, or should the mobile app apply a UI-axis-specific German fallback on top of the unchanged shared constant?**
   - What we know: D-07 requires German fallback for non-DE/EN devices; `packages/i18n/src/locales.ts` currently exports `DEFAULT_LOCALE = 'en'`, and ADR-012 also names English as the "global App-Default" — a decision that predates D-07's festival-specific reasoning ("first partner festivals are German-speaking"). The content axis (per-festival `defaultLocale`) is explicitly NOT affected by this decision (CONTEXT.md is explicit on this point).
   - What's unclear: whether changing the shared `DEFAULT_LOCALE` constant is the right layering (it's imported by `packages/contracts` too, per `locales.ts`'s own re-export) or whether the mobile app should pass its own override into `resolveUiLocale({ override: undefined, systemLocales })`'s fallback path without touching the shared constant, since `resolveUiLocale`'s current implementation falls through to `DEFAULT_LOCALE` with no separate UI-axis fallback parameter today.
   - Recommendation: this is explicitly named as Claude's Discretion in CONTEXT.md — the research finding to carry into planning is that `resolveUiLocale` would need either (a) a new optional parameter (e.g. `uiFallback: Locale`) defaulting to `DEFAULT_LOCALE` so callers can override it without a global constant change, or (b) the global constant change plus an explicit ADR note that the *global* default is now German while the *content-axis* default per ADR-012 §"Sprachen (Start)" is unaffected (since that paragraph's "globaler App-Default = Englisch" is about the content axis's neutral starting point, not the UI axis specifically — re-read ADR-012 carefully before deciding, the two axes' defaults are conceptually separate even though today's code shares one constant).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|--------------|-----------|---------|----------|
| Node.js | Expo CLI, Metro | ✓ | v24.18.1 | — |
| pnpm | Monorepo package management | ✓ | 11.17.0 | — |
| Docker CLI | docker-compose (D-11) | ✓ | 29.6.1 | — |
| Docker Compose | docker-compose (D-11) | ✓ | v5.3.0 | — |
| Docker daemon | Running the compose stack | ✗ (not running at research time — Docker Desktop must be started) | — | No fallback needed; start Docker Desktop before running `docker compose up`, this is an operator step not a missing capability |
| Android SDK / `adb` | `expo run:android` (D-09) on this Windows PC | ✗ (not found on this machine) | — | **Blocking for D-09 as stated** — Android Studio + SDK must be installed on the Windows PC before `expo run:android` can build/deploy; this was not previously required by Phases 1–2 (backend-only) so it's a genuinely new environment gap this phase surfaces, not a regression |
| Java (JDK) | Android Gradle build toolchain | ✓ (19.0.2) | 19.0.2 | May need a specific JDK version once Android Gradle Plugin version is pinned by the generated `apps/mobile/android` project — verify compatibility at implementation time; not blocking today |
| Xcode + iOS Simulator/device signing | `expo run:ios` (D-09) on the user's Mac | Not checked (this research ran on the Windows PC; D-09 explicitly targets a separate Mac machine) | — | User-owned Mac; verify Xcode + free Apple-ID provisioning are set up there before the iOS device-testing task, per D-09's own note about "repo must also be checked out on the Mac" |
| Git | Repo checkout on both test machines | ✓ | 2.45.1 | — |

**Missing dependencies with no fallback:**
- Android SDK/`adb` on the Windows PC — must be installed (Android Studio, or standalone `cmdline-tools` + `adb`) before the Android dev-build task in the plan can execute. Flag this as an explicit prerequisite/setup task, not an assumption that it's already present.

**Missing dependencies with fallback:**
- Docker daemon not currently running — trivial operator fix (start Docker Desktop), not a plan-blocking gap.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing, `apps/api`) — **no test framework exists yet in `apps/mobile`**, and this phase's own success criteria are manual-device UAT (kill-and-relaunch, real Android + real iPhone), not automated. |
| Config file | none — see Wave 0 |
| Quick run command | n/a this phase (no automated mobile test suite planned) |
| Full suite command | `pnpm --filter @festipal/api test` (unchanged, existing backend suite; unaffected by this phase's client-only changes) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|----------------------|-------------|
| PLAT-02 | Expo app builds/launches and calls the real API via ts-rest | manual (device) | N/A — kill-and-relaunch UAT per D-02, real Android + real iPhone | N/A |
| PLAT-02 | Cookie forwarding: an authenticated `GET /festivals` call actually returns data (not 401) | manual (device), optionally a `typecheck`-level guard that `apiClient` compiles against `@festipal/contracts` | `pnpm --filter @festipal/mobile typecheck` (compile-time contract binding check only — does not exercise the runtime cookie header) | ❌ Wave 0 — add the `typecheck` script to `apps/mobile/package.json` |
| I18N-01 | No hardcoded UI strings ship | automated (lint) | `pnpm --filter @festipal/mobile lint` (must include the `no-literal-string` rule) | ❌ Wave 0 — `eslint-plugin-i18next` wiring is itself a phase deliverable |
| I18N-01 | Real DE/EN catalogs exist and extraction produces non-trivial output | automated (CLI check) | `pnpm --filter @festipal/mobile exec lingui extract && git diff --exit-code locales/` (fails if extraction changes anything not yet committed — i.e. catches "someone forgot to run extract") | ❌ Wave 0 — `lingui.config.ts` + `locales/` scaffolding |

### Sampling Rate
- **Per task commit:** `pnpm --filter @festipal/mobile lint && pnpm --filter @festipal/mobile typecheck`
- **Per wave merge:** the above, plus a manual on-device smoke pass once a real screen exists (this phase has no automated RN component/integration test framework — Detox/Maestro are named in CLAUDE.md's Tests list for future E2E, but standing that up is not in this phase's scope per CONTEXT.md's boundaries)
- **Phase gate:** the four success criteria are all manual/device-verified per CONTEXT.md's "Sichtbarer Endzustand" — `/gsd-verify-work` for this phase is necessarily a conversational UAT walkthrough (kill-and-relaunch, real festival list, save→enter, DE/EN device-locale switch), not a green automated suite.

### Wave 0 Gaps
- [ ] `apps/mobile/package.json` — add `lint`/`typecheck` scripts (no `test` script needed yet; document why, so it isn't read as an oversight)
- [ ] `apps/mobile/eslint.config.mjs` — extends `@festipal/config/eslint` + adds `eslint-plugin-i18next`'s `no-literal-string` rule
- [ ] `apps/mobile/lingui.config.ts` + `locales/{en,de}/messages.po` — real (not stubbed) catalogs
- [ ] `turbo.json` — confirm `apps/mobile`'s `lint`/`typecheck` tasks are picked up by the existing root `lint`/`typecheck` pipeline (should be automatic via Turbo's workspace-glob task matching, but verify once the app's `package.json` scripts exist)
- [ ] Root `docker-compose.yml` (D-11) — not a test file, but a Wave 0-equivalent prerequisite: the manual UAT script (kill-and-relaunch, festival list) cannot run against a live local API without it

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|----------------|---------|---------------------|
| V2 Authentication | Yes | better-auth `emailOTP` (already server-configured, Phase 2) — this phase adds the client half only: `@better-auth/expo`'s `expoClient` for secure session persistence |
| V3 Session Management | Yes | Session token in `expo-secure-store` (encrypted, OS-keychain-backed), not `AsyncStorage`/MMKV; sliding-window expiry already server-configured (Phase 2); client must redirect to re-auth on expiry, never build a custom refresh path (Pitfall D) |
| V4 Access Control | Yes (client-side navigation only — server-side enforcement is Phase 1–2's `TenantGuard`, unchanged) | `Stack.Protected` route guards prevent UI-level access to protected screens without a session; this is a UX/defense-in-depth layer, NOT a substitute for server-side `festivalId` scoping (already correctly separated per Pitfall 4's resolution in Phase 2) |
| V5 Input Validation | Yes (thin — most validation is server-side via existing Zod contracts) | OTP email/code input fields should use appropriate `keyboardType`/`autoComplete` (e.g. `one-time-code` autofill hint on iOS/Android) for UX, but authoritative validation stays server-side via `@festipal/contracts`' existing Zod schemas |
| V6 Cryptography | Yes (delegated, not hand-rolled) | Never implement custom encryption for the session token — `expo-secure-store` uses the OS keychain/keystore; do not attempt to "double-encrypt" or roll a custom storage layer on top of it |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|-----------------------|
| Session token stored in plaintext-accessible storage (AsyncStorage/MMKV) | Information Disclosure | `expo-secure-store` only (Pitfall A/2) |
| Origin spoofing via a permissive/wildcard `trustedOrigins` | Spoofing | Whitelist exact schemes (`festipal://`, `exp://` dev-client patterns) — no bare `*` wildcard on the production scheme, even though a dev-time `exp://**` wildcard is acceptable for local Metro dev-client traffic |
| Deep-link bypass of the auth guard (a crafted `festipal://` URL routed directly into a protected screen while logged out) | Elevation of Privilege (client-UX level; server still enforces auth) | Guard at the route-group layout level so it re-evaluates on every navigation event including deep links (Pattern 1) — and remember this is defense-in-depth, the API's own `AuthGuard` (Phase 2) is the actual security boundary |
| Cleartext HTTP to the LAN dev API intercepted on shared festival Wi-Fi | Information Disclosure (session cookie in transit) | Explicitly scoped to **dev builds only** (D-10) — this is an accepted, documented risk for local development, not a production posture; do not let the cleartext-allowed manifest flag (Pitfall G) leak into a release/EAS build config (out of scope this phase, but worth a code comment flagging it as dev-only when `expo-build-properties` is configured) |
| Enumeration / spam via repeated OTP requests | Denial of Service | Already server-mitigated (Phase 2, better-auth's default rate limiter) — no client-side change needed this phase, but the client should surface a clear "try again later" state if a 429-equivalent response occurs rather than silently retrying |

## Sources

### Primary (HIGH confidence)
- Project-internal: `.planning/research/PITFALLS.md` (Pitfalls 2, 5, 7, 10 — HIGH confidence per the project's own classification, Context7-curated in the prior research session)
- Project-internal: `.planning/phases/03-mobile-app-shell-i18n-foundation/03-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `docs/DEVELOPMENT_DECISIONS.md` (ADR-012, ADR-013, ADR-014, ADR-016)
- Project-internal code: `packages/i18n/src/{locales,resolve,i18n}.ts`, `packages/contracts/src/router.ts`, `apps/api/src/auth/auth.instance.ts`, `apps/api/src/config/env.ts`, `apps/api/src/me/me.service.ts`, `packages/db/scripts/seed.ts` — read directly this session
- npm registry `npm view <pkg> version` — live-checked 2026-08-03 for all packages in the Standard Stack / Package Legitimacy Audit tables
- `gsd-tools query package-legitimacy check` — run against 17 packages this session

### Secondary (MEDIUM confidence)
- [Expo Integration | Better Auth](https://better-auth.com/docs/integrations/expo) — official docs, cross-referenced via web search
- [better-auth/better-auth expo.mdx (GitHub)](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/integrations/expo.mdx)
- [Cookies | Better Auth](https://better-auth.com/docs/concepts/cookies) — source for `authClient.getCookie()` pattern
- [Expo Router: Protected routes](https://docs.expo.dev/router/advanced/protected/) — official Expo docs
- [Expo Router: Authentication](https://docs.expo.dev/router/advanced/authentication/) — official Expo docs
- [SecureStore - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/) — official docs, 2048-byte value-size note
- [Work with monorepos - Expo Documentation](https://docs.expo.dev/guides/monorepos/) — official docs, pnpm section
- [React Native Internationalization (i18n) | Lingui](https://lingui.dev/tutorials/react-native) — official Lingui docs
- [Installation and Setup | Lingui](https://lingui.dev/installation) — official Lingui docs
- [Fetch | ts-rest](https://ts-rest.com/client/fetch) — official ts-rest docs, `baseHeaders` sync-function support
- [Mailpit Docker images](https://mailpit.axllent.org/docs/install/docker/) — official Mailpit docs
- [eslint-plugin-i18next no-literal-string rule docs (GitHub)](https://github.com/edvardchen/eslint-plugin-i18next/blob/main/docs/rules/no-literal-string.md)

### Tertiary (LOW confidence)
- LogRocket, DEV Community, Medium blog posts on better-auth+Expo, TanStack Query+Expo, and Metro+pnpm setup — used only to corroborate the official-docs findings above, not as a sole source for any claim in Standard Stack or Architecture Patterns
- Expo SDK 52+ "automatic pnpm detection" claim — web search only, flagged as Assumption A1, not independently verified against the `expo/metro-config` 57.0.9 source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package version was live-verified against the npm registry this session; no MCP docs tool (Context7/Exa/Brave/Firecrawl) was available, so library *behavior* claims rest on official-docs URLs found via WebSearch rather than a curated docs index, hence the phase-level confidence is MEDIUM overall rather than HIGH.
- Architecture (cookie-forwarding pattern, splash-guard pattern): MEDIUM-HIGH — the cookie-forwarding pattern (Pattern 2) is the one piece of prior research (CONTEXT.md's MEDIUM research flags) resolved to a concrete, sourced solution this session; the exact `authClient` session-hook API surface (Assumption A2) is unverified against the installed version and should be spot-checked at implementation time.
- Pitfalls: HIGH for the four carried over from the project's own PITFALLS.md (already Context7-curated in a prior session); MEDIUM for the three new pitfalls this session (E, F, G) — sourced from official docs but not cross-verified against this project's exact installed versions.

**Research date:** 2026-08-03
**Valid until:** ~2026-09-03 (30 days) for architecture/pattern claims; the exact npm version pins in Standard Stack should be re-verified with `npm view` immediately before `pnpm add`, since the Expo/Lingui/TanStack ecosystem ships frequently (multiple packages had releases within the ~2 weeks before this research date).

**Tool availability note:** This research session had no Context7, Exa, Brave Search, Firecrawl, or Tavily MCP tools available (all `false` in the `research-plan` seam's `config` and confirmed via `init.phase-op`'s `brave_search`/`firecrawl`/`exa_search: false` flags). All external findings were obtained via the built-in `WebSearch` tool and cross-referenced against official-docs URLs surfaced by it, plus direct `npm view` registry checks. This is weaker provenance than a Context7-curated session (see Sources) — the planner should treat any claim not also confirmed in the project's existing `PITFALLS.md` (which WAS Context7-curated in a prior session) as MEDIUM confidence and spot-check against current docs during implementation if a plan step depends critically on exact API shape (e.g. Assumption A2's `authClient` hook surface).
