---
phase: 03-mobile-app-shell-i18n-foundation
plan: 03
subsystem: mobile
tags: [better-auth, expo, ts-rest, expo-router, cookie-forwarding, auth-guard, zod]

# Dependency graph
requires:
  - phase: 03-mobile-app-shell-i18n-foundation
    provides: "03-02: apps/mobile Expo Router scaffold (lib/i18n.ts, lib/query-client.ts, app/_layout.tsx splash+provider skeleton)"
provides:
  - "lib/auth-client.ts — module-singleton better-auth Expo client (SecureStore session, emailOTP plugin)"
  - "lib/api-client.ts — ts-rest client bound to @festipal/contracts, forwards the SecureStore-backed session cookie into every request"
  - "app/_layout.tsx — splash-held four-state auth guard (loading/unauthenticated/authenticated-no-profile/authenticated) gating (auth)/(profile-setup)/festivals+(festival) route groups"
affects: ["03-04 (auth screens consume authClient.emailOtp/signIn; profile-setup stub consumes apiClient.completeProfile)", "03-05 (festivals/home screens consume apiClient.listFestivals/saveFestival, guarded by the 'authenticated' state)", "03-06 (on-device UAT exercises the real cookie-forwarding + no-auth-flash truths this plan wires but cannot verify without a device)"]

# Tech tracking
tech-stack:
  added: []
  patterns: ["ts-rest baseHeaders.Cookie sync-function pattern for RN cookie forwarding (no native cookie jar)", "better-auth useSession() as a plain React hook (data/isPending), not a .subscribe()-based store", "AuthState discriminated union (4 members) driving Stack.Protected guards instead of boolean flags"]

key-files:
  created:
    - apps/mobile/lib/auth-client.ts
    - apps/mobile/lib/api-client.ts
  modified:
    - apps/mobile/app/_layout.tsx
    - apps/mobile/package.json
    - pnpm-lock.yaml
  deleted:
    - apps/mobile/app/index.tsx

key-decisions:
  - "Pinned zod ^3.25.76 as a direct apps/mobile dependency (ADR-006) — without it, @ts-rest/core's pnpm peer resolution for apps/mobile drifted to the zod v4 instance better-auth's own dependency tree pulls in, making initClient(contract, ...) fail typecheck against @festipal/contracts' zod v3 schemas."
  - "Rejected a workspace-wide zod override (pnpm-workspace.yaml overrides.zod) as the fix: forcing zod to 3.x globally breaks apps/api at RUNTIME, because better-auth's own internal code calls the zod-v4-only z.coerce.boolean().meta() API. better-auth's dependency tree genuinely needs zod v4 internally; only apps/mobile's own zod peer for @ts-rest/core needed pinning to v3."
  - "Cast expoClient({...}) as BetterAuthClientPlugin in auth-client.ts to work around a shipped-type-only incompatibility between @better-auth/expo@1.6.25's expoClient return type and createAuthClient's plugin-array parameter (a deeply-nested conditional-type mismatch in getActions' $fetch parameter). Verified this is types-only: the JS shape matches the official better-auth.com/docs/integrations/expo example exactly, and authClient.getCookie() resolves and type-checks correctly after the cast."
  - "authClient.useSession is a plain React hook returning { data, isPending } (verified against the installed better-auth/react types), not a .subscribe()-based store as RESEARCH.md Pattern 1 first sketched — adapted the guard's bootstrap effect accordingly (RESEARCH.md flagged this exact uncertainty as needing implementation-time verification)."
  - "Removed app/index.tsx (Plan 02's tracer screen) instead of repurposing it as a redirect, per the plan's own 'or remove it if the guard's initial route handles the entry' allowance — an unguarded top-level '/' route would have been an unprotected deep-link leak now that Stack.Protected groups own routing."

patterns-established:
  - "Cookie forwarding: baseHeaders.Cookie = () => authClient.getCookie() + credentials: 'omit' on the ts-rest client (RESEARCH.md Pattern 2, Pitfall F) — every apps/mobile screen consuming apiClient inherits this without re-wiring."
  - "AuthState union { loading | unauthenticated | authenticated-no-profile | authenticated } as the single source of truth for route guards — no per-screen !!user checks anywhere in the app."

requirements-completed: [PLAT-02]

coverage:
  - id: D1
    description: "auth-client.ts wires better-auth's Expo client with SecureStore session storage and the emailOTP plugin; api-client.ts forwards the session cookie into every ts-rest request via authClient.getCookie()"
    requirement: PLAT-02
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck"
        status: pass
      - kind: other
        ref: "grep verification of all four prohibitions (no AsyncStorage/MMKV, no credentials:'include', storage:SecureStore present, baseHeaders.Cookie present) — apps/mobile source tree"
        status: pass
    human_judgment: true
    rationale: "Whether the cookie actually round-trips correctly against a live device/session (an authenticated GET /festivals returning data instead of 401) cannot be proven by typecheck/lint alone — this phase's own <verification> defers that runtime proof to Plan 06's on-device UAT."
  - id: D2
    description: "app/_layout.tsx holds the splash screen until BOTH the UI locale and the four-state auth guard resolve, then gates (auth)/(profile-setup)/festivals+(festival) via Stack.Protected driven by the AuthState union (not !!session)"
    requirement: PLAT-02
    verification:
      - kind: unit
        ref: "pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile lint"
        status: pass
    human_judgment: true
    rationale: "No-auth-flash and deep-link-leak behavior are runtime/timing properties of a real cold start on a real device — this plan's acceptance criteria (verified below) prove the guard's code shape is correct, but the actual flash-free behavior is Plan 06's on-device UAT concern per this phase's own <verification> section."

duration: 25min
completed: 2026-08-03
status: complete
---

# Phase 3 Plan 3: Auth-Client, Cookie-Forwarding API Client & Four-State Guard Summary

**Wired better-auth's Expo client (SecureStore + emailOTP) into a ts-rest client that forwards the session cookie on every request, then extended the root layout into a splash-held four-state (`loading`/`unauthenticated`/`authenticated-no-profile`/`authenticated`) guard driving three `Stack.Protected` route groups.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-08-03T16:16:00Z (approx.)
- **Completed:** 2026-08-03T16:40:19Z
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified, 1 deleted)

## Accomplishments

- `lib/auth-client.ts`: module-singleton `authClient = createAuthClient({...})` with `expoClient({ scheme: 'festipal', storagePrefix: 'festipal', storage: SecureStore })` and `emailOTPClient()`, mirroring `apps/api/src/auth/auth.instance.ts`'s comment-per-decision discipline.
- `lib/api-client.ts`: `apiClient = initClient(contract, { baseHeaders: { Cookie: () => authClient.getCookie() }, credentials: 'omit' })` — the session cookie now flows from better-auth's SecureStore-backed jar into every `@festipal/contracts`-typed request, with no re-declared request/response shape.
- Diagnosed and fixed a real dependency-resolution bug blocking `initClient(contract, ...)` from typechecking: apps/mobile had no direct `zod` dependency, so pnpm's peer resolution for `@ts-rest/core` drifted to the zod v4 instance pulled in by better-auth's own dependency tree, while `@festipal/contracts` is built on zod v3 (ADR-006). Fixed by pinning `zod: "^3.25.76"` directly in `apps/mobile/package.json`.
- Investigated and **rejected** a workspace-wide fix for the same symptom (a `pnpm-workspace.yaml` `overrides.zod: 3.25.76`): applying it broke `apps/api` at runtime (`z.coerce.boolean(...).meta is not a function` inside better-auth's own `session-store.mjs` — `.meta()` is zod-v4-only, and better-auth's dependency tree genuinely needs zod v4 internally). Reverted cleanly; the local `apps/mobile` pin is the correct, minimal fix.
- Worked around a shipped-type-only incompatibility between `@better-auth/expo@1.6.25`'s `expoClient` return type and `createAuthClient`'s plugin-array parameter type (verified as types-only: the JS shape matches the official docs example exactly) via a narrow, commented `as BetterAuthClientPlugin` cast.
- `app/_layout.tsx`: extended Plan 02's splash+provider skeleton with an `AuthState` union (`loading | unauthenticated | authenticated-no-profile | authenticated`) driven by `authClient.useSession()` (a plain hook, not the `.subscribe()`-based store RESEARCH.md's Pattern 1 first sketched — adapted per the plan's own instruction to verify the real API at implementation time) plus `apiClient.getMe()`'s `profile` field. Splash hides only once both the UI locale and this four-state resolution are complete; `Stack.Protected` gates `(auth)` / `(profile-setup)` / `festivals` + `(festival)` accordingly.
- Removed `app/index.tsx` (Plan 02's tracer screen) rather than repurposing it — the plan explicitly allows removal "if the guard's initial route handles the entry," and an unguarded top-level `/` route would have been an unprotected deep-link leak now that `Stack.Protected` groups own all routing.

## Task Commits

Each task was committed atomically:

1. **Task 1: auth-client (Expo/SecureStore/OTP) + api-client (ts-rest cookie forwarding)** - `8a43c67` (feat)
2. **Task 2: Splash-held four-state auth guard in the root layout** - `ae2e785` (feat)

## Files Created/Modified

- `apps/mobile/lib/auth-client.ts` - better-auth Expo client (SecureStore session, emailOTP plugin)
- `apps/mobile/lib/api-client.ts` - ts-rest client, cookie-forwarding via `authClient.getCookie()`
- `apps/mobile/app/_layout.tsx` - four-state `AuthState` union + splash-held guard + `Stack.Protected` groups
- `apps/mobile/app/index.tsx` - **deleted** (tracer screen superseded by the guard)
- `apps/mobile/package.json` - added direct `zod: "^3.25.76"` dependency
- `pnpm-lock.yaml` - lockfile update from the zod pin

## Decisions Made

See `key-decisions` in frontmatter above for the full rationale on each. In short: pin zod locally in `apps/mobile` (not workspace-wide — that broke `apps/api`'s runtime), cast around a types-only `@better-auth/expo` incompatibility, use the real `useSession()` hook shape instead of RESEARCH.md's sketched `.subscribe()` pattern, and delete rather than repurpose the tracer route.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing `zod` dependency broke ts-rest client typecheck**
- **Found during:** Task 1 (`pnpm --filter @festipal/mobile typecheck` verification)
- **Issue:** `apps/mobile` had no direct `zod` dependency. pnpm's peer resolution for `@ts-rest/core` (a peer-optional dependency on `zod`) picked the zod v4 instance available elsewhere in the workspace (pulled in transitively by `better-auth`'s own dependency tree) instead of the zod v3 instance `@festipal/contracts`' schemas are built on. `initClient(contract, {...})` failed to typecheck against the mismatched `AppRouter` type.
- **Fix:** Added `"zod": "^3.25.76"` as a direct `apps/mobile` dependency, matching the workspace's ADR-006 pin (same version already used by `apps/api`, `packages/contracts`, `packages/db`).
- **Files modified:** `apps/mobile/package.json`, `pnpm-lock.yaml`
- **Verification:** `pnpm --filter @festipal/mobile typecheck` exits 0; confirmed via `readlink -f` that `apps/mobile/node_modules/@ts-rest/core` and `apps/mobile/node_modules/zod` both resolve to the zod 3.25.76 pnpm store entry.
- **Committed in:** `8a43c67` (Task 1 commit)

**2. [Rule 1 - Bug, attempted-then-reverted] Workspace-wide zod override broke `apps/api` at runtime**
- **Found during:** Task 1, while investigating fix #1 above
- **Issue:** Before settling on the local `apps/mobile` pin, a `pnpm-workspace.yaml overrides: { zod: 3.25.76 }` was tried to eliminate the zod v3/v4 duplication workspace-wide. `pnpm install` succeeded, but `pnpm --filter @festipal/api test` then failed 8/8 suites with `TypeError: z.coerce.boolean(...).meta is not a function` inside `better-auth`'s own `dist/cookies/session-store.mjs` — `.meta()` is a zod-v4-only API that better-auth's internal (non-peer) dependency on zod genuinely requires.
- **Fix:** Reverted the `pnpm-workspace.yaml` override entirely (back to no override) and re-ran `pnpm install`; the local `apps/mobile/package.json` zod pin (fix #1) was sufficient on its own and does not disturb `apps/api`'s zod v4 resolution.
- **Files modified:** `pnpm-workspace.yaml` (net no diff — reverted to original), `pnpm-lock.yaml`
- **Verification:** `pnpm --filter @festipal/api test` — 31/31 passing on a clean re-run (one transient network-timeout flake on the first run, consistent with prior phase-3 flakiness already documented in `03-01-SUMMARY.md`); `pnpm typecheck` (full workspace via turbo) — 9/9 tasks green.
- **Committed in:** N/A — this was a dead-end explored and fully reverted before any commit; documented here so the workspace-wide-override approach isn't re-attempted by a future plan.

**3. [Rule 1 - Bug] `@better-auth/expo`'s `expoClient` plugin fails `createAuthClient`'s plugin-array type check**
- **Found during:** Task 1 (`pnpm --filter @festipal/mobile typecheck`, after fix #1 resolved the zod-related errors)
- **Issue:** `expoClient({...})` (from `@better-auth/expo/client`) is not assignable to `BetterAuthClientPlugin` per `createAuthClient`'s plugin-array parameter type — a deeply-nested conditional-type mismatch in the `getActions` method's `$fetch` parameter. Isolated via a scratch test file to confirm this is caused by `expoClient` alone (reproducible with zero other plugins), not an interaction with `emailOTPClient` or a residual zod issue.
- **Fix:** Cast `expoClient({...}) as BetterAuthClientPlugin` with an inline comment explaining the cast is types-only — the JS object shape matches better-auth's own official Expo integration doc example exactly, and `authClient.getCookie()` resolves and typechecks correctly on the resulting client.
- **Files modified:** `apps/mobile/lib/auth-client.ts`
- **Verification:** `pnpm --filter @festipal/mobile typecheck` exits 0; scratch-tested that `authClient.getCookie()` is callable and returns `string` post-cast.
- **Committed in:** `8a43c67` (Task 1 commit)

---

**Total deviations:** 3 (2 auto-fixed dependency/type issues, 1 explored-and-reverted dead end documented for future reference). No architectural changes to product behavior; all three are dependency-resolution and shipped-type corrections necessary to make the plan's own stated `<verify>` commands pass.
**Impact on plan:** No scope creep — the plan's file scope (`lib/auth-client.ts`, `lib/api-client.ts`, `app/_layout.tsx`, `app/index.tsx`) is implemented exactly as specified; the zod pin and expoClient cast are the minimum necessary corrections to make that exact code typecheck.

## Issues Encountered

- **Deferred (not fixed, out of scope for this plan/phase):** `apps/api/src/auth/auth.instance.ts` is missing the `@better-auth/expo` server plugin (`plugins: [expo()]`). This plugin translates the `expo-origin` header the mobile client sends into the standard `origin` header better-auth's CSRF/origin-check middleware reads. Without it, any *cookie-bearing, state-changing* better-auth endpoint (e.g. a future sign-out) will 403 with `INVALID_ORIGIN`/`MISSING_OR_NULL_ORIGIN`. Traced through better-auth's actual middleware source (`origin-check.mjs`) to confirm: GET requests and any request without an existing session cookie (i.e. the entire OTP send/verify login flow this phase and Plan 04 build) are exempt from this check, so nothing in Phase 3's planned scope (no logout/sign-out feature exists in Plans 04-06) is currently affected. Logged to `.planning/WINDOWS.md` (todo, `apps/api/src/auth/auth.instance.ts`) so it surfaces before any future session-revocation feature ships.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `lib/auth-client.ts` and `lib/api-client.ts` are ready for Plan 04's `(auth)` email/verify screens and `(profile-setup)` stub to consume directly (`authClient.emailOtp.sendVerificationOtp` / `authClient.signIn.emailOtp` / `apiClient.completeProfile`).
- The root layout's `AuthState` guard already references `festivals`/`(festival)`/`(auth)`/`(profile-setup)` route-group names that Plans 04-05 will populate with real screen files — `Stack.Protected`'s `name` prop is an untyped string in this project (no `experiments.typedRoutes` in `app.json`), so referencing not-yet-created route groups does not fail typecheck; the app will only be runnable end-to-end once those directories exist.
- The zod-version investigation (deviation #2 above) is fully resolved and should not need revisiting — do not re-attempt a workspace-wide zod override in a future plan.
- No blockers for Plan 04.

## Self-Check: PASSED

- FOUND: apps/mobile/lib/auth-client.ts
- FOUND: apps/mobile/lib/api-client.ts
- FOUND: apps/mobile/app/_layout.tsx
- CONFIRMED DELETED (intentional): apps/mobile/app/index.tsx
- FOUND commit: 8a43c67
- FOUND commit: ae2e785
- Re-ran acceptance criteria: `pnpm --filter @festipal/mobile typecheck` (pass), `pnpm --filter @festipal/mobile lint` (pass), grep-verified all four Task 1 prohibitions (no AsyncStorage/MMKV, no `credentials: 'include'`, `storage: SecureStore` present, `baseHeaders.Cookie` present), grep-verified Task 2's `AuthState` union has all four members and the `authenticated-no-profile` branch is derived from `apiClient.getMe()`'s `profile` field
- Re-ran full-workspace sanity: `pnpm typecheck` (9/9 tasks green via turbo), `pnpm --filter @festipal/api test` (31/31 passing on clean re-run)

---
*Phase: 03-mobile-app-shell-i18n-foundation*
*Completed: 2026-08-03*
