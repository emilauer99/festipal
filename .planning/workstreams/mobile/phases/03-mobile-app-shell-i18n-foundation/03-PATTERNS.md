# Phase 3: Mobile App Shell & i18n Foundation - Pattern Map

**Mapped:** 2026-08-03
**Files analyzed:** 21 (new `apps/mobile` scaffold + 1 modified backend file)
**Analogs found:** 21 / 21 (all via cross-workspace conventions — `apps/mobile` is a
brand-new workspace; **no existing RN/Expo app exists in this repo**, so every analog
is a role/convention match from `apps/api` or `packages/*`, not a same-stack twin)

## Context note for the planner

This is a genuinely greenfield app (`apps/mobile` doesn't exist; there is no
`apps/admin` either — `apps/api` is the only existing app workspace). There are **no
RN/Expo-specific analogs in this codebase.** Every pattern below is either:
1. A **workspace-convention analog** (package.json shape, tsconfig extension, eslint
   extension) copied from `apps/api`, the only sibling app.
2. A **library-idiom pattern** taken directly from RESEARCH.md's Architecture Patterns
   section (already sourced against official docs), since no in-repo RN code exists to
   copy from.
3. A **cross-cutting convention** (Zod env loading, locale resolution, ts-rest
   controller shape) from `apps/api`/`packages/i18n`, mirrored client-side.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/mobile/package.json` | config | — | `apps/api/package.json` | role-match (only sibling app) |
| `apps/mobile/tsconfig.json` | config | — | `apps/api/tsconfig.json` | role-match |
| `apps/mobile/eslint.config.mjs` | config | — | `apps/api/eslint.config.mjs` | role-match |
| `apps/mobile/lib/auth-client.ts` | service (auth client) | request-response | `apps/api/src/auth/auth.instance.ts` | role-match (server-side auth instance; mirrors config shape/comment discipline, not API) |
| `apps/mobile/lib/api-client.ts` | service (typed REST client) | request-response | `apps/api/src/festival/festival.controller.ts` (contract consumption side) | role-match — RESEARCH.md Pattern 2 is the primary source |
| `apps/mobile/lib/query-client.ts` | provider/utility | — | none in-repo | no analog — RESEARCH.md only |
| `apps/mobile/app/_layout.tsx` | provider (root layout / guard) | event-driven | none in-repo | no analog — RESEARCH.md Pattern 1 is the primary source |
| `apps/mobile/app/(auth)/_layout.tsx` | route guard | event-driven | none in-repo | no analog — RESEARCH.md Pattern 1 |
| `apps/mobile/app/(auth)/index.tsx` | component (screen) | request-response | `apps/api/src/festival/festival.controller.ts` (contract call shape, client-side mirror) | partial — controller pattern for calling `contract.*` |
| `apps/mobile/app/(auth)/verify.tsx` | component (screen) | request-response | same as above | partial |
| `apps/mobile/app/festivals/_layout.tsx` | route guard | event-driven | none in-repo | no analog |
| `apps/mobile/app/festivals/index.tsx` | component (screen, list+save) | CRUD (read + save) | `apps/api/src/festival/festival.controller.ts` lines 34-56 (`listFestivals`/`saveFestival`) | role-match — server contract this screen calls |
| `apps/mobile/app/(festival)/_layout.tsx` | route guard | event-driven | none in-repo | no analog |
| `apps/mobile/app/(festival)/index.tsx` | component (screen, placeholder) | request-response | none in-repo | no analog |
| `apps/mobile/metro.config.js` | config | — | none in-repo | no analog — RESEARCH.md Pattern 4 |
| `apps/mobile/babel.config.js` | config | — | none in-repo | no analog — RESEARCH.md (Lingui macro plugin) |
| `apps/mobile/lingui.config.ts` | config | — | none in-repo (server never used Lingui directly; `packages/i18n` config uses tsup, not lingui.config) | no analog |
| `apps/mobile/locales/en/messages.po`, `locales/de/messages.po` | i18n catalog | — | none in-repo | no analog |
| `apps/mobile/app.json` | config (app identity) | — | none in-repo | no analog |
| `docker-compose.yml` (root) | config (dev infra) | — | none in-repo | no analog — D-11, RESEARCH.md Don't-Hand-Roll table |
| `apps/api/src/auth/auth.instance.ts` (MODIFIED — add `trustedOrigins`) | service (auth instance) | request-response | itself (existing file, additive change) | exact — same file |
| `packages/i18n/src/resolve.ts` / `locales.ts` (POSSIBLY MODIFIED — D-07 UI-fallback decision) | utility | — | itself (existing file, additive/overload change) | exact — same file |

## Pattern Assignments

### `apps/mobile/package.json` (config)

**Analog:** `apps/api/package.json`

**Workspace naming + script convention** (full file above):
```json
{
  "name": "@festipal/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "lint": "eslint ."
  },
  "devDependencies": {
    "@festipal/config": "workspace:*"
  }
}
```
Apply directly: `apps/mobile/package.json` must be `"name": "@festipal/mobile"`,
`"private": true`, and expose `dev`/`lint`/`typecheck`/`build` scripts (per
RESEARCH.md Wave 0 gap list — no `test` script needed yet, document why in a comment
or PLAN task note). Workspace deps (`@festipal/contracts`, `@festipal/i18n`) resolve
via `"workspace:*"`, exactly like `apps/api`'s `@festipal/contracts`/`@festipal/db`
lines. Root `turbo.json` already glob-matches `lint`/`typecheck`/`build`/`dev` tasks
across all workspaces — no turbo.json edit needed once the scripts exist (confirm per
Wave 0 gap, don't assume).

---

### `apps/mobile/tsconfig.json` (config)

**Analog:** `apps/api/tsconfig.json` (lines 1-17)

```json
{
  "extends": "@festipal/config/tsconfig.base.json",
  "compilerOptions": {
    "types": ["node"],
    "esModuleInterop": true
  },
  "include": ["src"],
  "exclude": ["dist", "node_modules"]
}
```
For `apps/mobile`, extend the same `@festipal/config/tsconfig.base.json` (pins TS
6.0.x, `strict: true`, `noUncheckedIndexedAccess: true` per ADR-013/CLAUDE.md) but
override `include`/`exclude`/`jsx` for Expo's file layout (`app/`, `lib/`) instead of
`src`; do not introduce a second TypeScript version — reuse the base file exactly as
`apps/api` does (`"extends"` only, no re-declared compiler options beyond what the
framework strictly requires, e.g. `"jsx": "react-native"` and `moduleResolution:
"Bundler"` for Metro).

---

### `apps/mobile/eslint.config.mjs` (config)

**Analog:** `apps/api/eslint.config.mjs` (full file, lines 1-22)

```javascript
import base from '@festipal/config/eslint';

export default [
  ...base,
  {
    rules: {
      // app-specific rule overrides go here, with a comment explaining why
    },
  },
];
```
Apply the same spread-and-extend shape. Add `eslint-plugin-i18next`'s
`no-literal-string` rule (RESEARCH.md Pitfall C / Pattern requirement) as an
**additional** config block, following the same "array of config objects, each with
an explanatory comment" convention `apps/api`'s file uses for its `.mjs` override
block (lines 14-22). Do NOT disable `@typescript-eslint/consistent-type-imports` —
that override is API-specific (NestJS DI metadata reasons), not applicable to RN/Expo
code.

---

### `apps/mobile/lib/auth-client.ts` (service — Expo auth client)

**Primary source:** RESEARCH.md Pattern 3 (`lib/auth-client.ts` code block, sourced
from better-auth.com/docs/integrations/expo) — this is the load-bearing pattern since
no in-repo RN auth client exists.

**Convention to copy from `apps/api/src/auth/auth.instance.ts`** (lines 1-19):
- Module-level singleton export pattern (`export const auth = betterAuth({...})` →
  mirror as `export const authClient = createAuthClient({...})`), evaluated
  synchronously at import time, not lazily constructed.
- Inline comment discipline citing the ADR/decision driving each config value (e.g.
  `// D-05 — working title; keep in sync with trustedOrigins` on the `scheme` field,
  matching the file's own `// D-02: 90-day sliding session...` comment style at line 26).

```typescript
// apps/api/src/auth/auth.instance.ts lines 19-30 — comment-per-decision convention
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema: { user, session, account, verification } }),
  secret: env.BETTER_AUTH_SECRET,
  session: {
    // D-02: 90-day sliding session, no refresh-token grant (Pitfall 10) —
    // "session expired -> re-authenticate via OTP" is the only expiry path.
    expiresIn: 60 * 60 * 24 * 90,
    updateAge: 60 * 60 * 24,
  },
  ...
```

---

### `apps/mobile/lib/api-client.ts` (service — ts-rest client, cookie forwarding)

**Primary source:** RESEARCH.md Pattern 2 (full code block) — load-bearing, no
in-repo analog exists for a ts-rest *client*; the repo only has ts-rest *server*
handlers (`apps/api/src/festival/festival.controller.ts`).

**Contract-import convention to copy** (from `festival.controller.ts` line 2 and
`packages/i18n/src/locales.ts` line 1):
```typescript
import { contract } from '@festipal/contracts';
```
Same import path/style the mobile client must use — never re-declare the contract
shape client-side (Pitfall 6 / CLAUDE.md "Duplicating Contract Definitions"
anti-pattern).

**Error/not-found handling convention** (from `festival.controller.ts` lines 12-20):
```typescript
return tsRestHandler(contract.getFestival, async ({ params }) => {
  const found = await this.festivals.getBySlug(params.slug);
  if (!found) {
    return { status: 404, body: { message: 'Festival not found' } };
  }
  return { status: 200, body: found };
});
```
The mobile screens consuming `apiClient.getFestival(...)` should branch on
`result.status` the same discriminated-union way the server produces it (ts-rest's
client responses mirror the server's status/body union) — e.g. `festivals/index.tsx`
checks `result.status === 200` before rendering, and surfaces `result.body.message`
on non-200, matching the shape the server already defines.

---

### `apps/mobile/app/_layout.tsx`, `(auth)/_layout.tsx`, `festivals/_layout.tsx`, `(festival)/_layout.tsx` (route guards)

**Primary source:** RESEARCH.md Pattern 1 (`app/_layout.tsx` full code block) — no
in-repo analog; this is genuinely new client-side navigation logic.

**Convention to copy from `apps/api`'s guard-adjacent code (`festival.controller.ts`
lines 42-56, `saveFestival`)** — the "explicit named states as return values, not
booleans" discipline:
```typescript
if (result.status === 'not-found') {
  return { status: 404, body: { message: 'Festival not found' } };
}
if (result.status === 'profile-required') {
  return { status: 409, body: { message: 'Complete your profile before saving a festival' } };
}
```
Mirror this discriminated-status-string discipline in the client's `AuthState` union
(RESEARCH.md Pattern 1's `'loading' | 'unauthenticated' | 'authenticated-no-profile' |
'authenticated'`) rather than nested booleans — same "three/four explicit named
states, not flags" idiom already established server-side for the identical
profile-completeness concern (Open Question #1 in RESEARCH.md).

---

### `apps/mobile/app/festivals/index.tsx` (screen — list + save)

**Analog (server-side contract it calls):** `apps/api/src/festival/festival.controller.ts`
lines 34-56 (`listFestivals`, `saveFestival`)

This screen is a thin client mirror of these two contract endpoints — no local
business logic (per RESEARCH.md's Architectural Responsibility Map: "Festival list /
save ... Server is the source of truth ... client is a thin typed caller"). Reuse the
`result.status` branching shape shown above; render `contract.listFestivals`'s body
array directly (it already comes back locale-appropriate/typed, no client-side
reshaping).

---

## Shared Patterns

### Zod-validated env loading (client-side mirror)
**Source:** `apps/api/src/config/env.ts` (full file, lines 1-27)
**Apply to:** any mobile config reading `EXPO_PUBLIC_API_URL` — while Expo's
`EXPO_PUBLIC_*` vars are inlined at build time (no runtime `process.env` parse
needed the way NestJS needs one), keep the **discipline** demonstrated here: fail
loudly and early if a required value is missing/malformed, not silently `undefined`.
```typescript
// apps/api/src/config/env.ts lines 20-27 — fail-fast module-singleton pattern
export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}
export const env = loadEnv();
```
If the mobile app needs more than a bare `process.env.EXPO_PUBLIC_API_URL!`
non-null-assertion, apply the same "parse once at module scope, throw on invalid"
shape rather than scattering `process.env.EXPO_PUBLIC_API_URL` reads with silent
fallbacks across files.

### Locale resolution (ADR-012 axis 1)
**Source:** `packages/i18n/src/resolve.ts` (full file, lines 1-28) +
`packages/i18n/src/locales.ts` (full file, lines 1-14)
**Apply to:** `apps/mobile/app/_layout.tsx` (or a dedicated `lib/locale.ts`) — call
`resolveUiLocale({ systemLocales: Localization.getLocales().map(l => l.languageTag) })`
exactly as shown in RESEARCH.md's "Reading device locales" code example (lines
497-510). **D-07 caveat (planner decision required):** the function today falls
through to `DEFAULT_LOCALE = 'en'` (`resolve.ts` line 27); D-07 needs German as the
non-DE/EN fallback. Per RESEARCH.md Open Question 3, choose one:
```typescript
// Option A — add a uiFallback param, no shared-constant change:
export function resolveUiLocale(input: {
  override?: string | null;
  systemLocales?: readonly string[];
  uiFallback?: Locale; // defaults to DEFAULT_LOCALE if omitted
}): Locale { /* ... use input.uiFallback ?? DEFAULT_LOCALE as the final fallthrough */ }
```
```typescript
// Option B — change the shared constant in packages/i18n/src/locales.ts line 7-10 area
// (re-exported from @festipal/contracts — verify contracts' own locale.ts isn't
// also asserting 'en' as a content-axis default before changing this globally).
```
Surface the choice explicitly in PLAN.md per CONTEXT.md's Claude's-Discretion note —
do not silently pick one without a one-line rationale in the plan.

### better-auth server config (`trustedOrigins`) — additive change
**Source:** `apps/api/src/auth/auth.instance.ts` (full file, lines 1-48, comment
discipline at lines 26-28, 35-38)
**Apply to:** same file — add a `trustedOrigins` array (RESEARCH.md Pattern 3, lines
382-390) following the file's existing convention of a one-line `// D-0X —` comment
next to every decision-driven config value:
```typescript
export const auth = betterAuth({
  // ...existing config (database, secret, session, plugins)...
  trustedOrigins: [
    'festipal://', // D-05 working title — keep in sync if scheme changes
    'exp://', 'exp://**', // Expo dev-client (Metro) scheme during `expo run:*`
  ],
});
```

### ts-rest contract-first typing (no re-declared shapes)
**Source:** `packages/i18n/src/locales.ts` line 1, `apps/api/src/festival/festival.controller.ts` line 2
**Apply to:** every mobile file touching API types (`lib/api-client.ts`, all screens)
```typescript
import { contract } from '@festipal/contracts';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@festipal/contracts';
```
Same workspace-package import convention (bare `@festipal/*` specifier, `type`-only
imports for pure types per the base ESLint's `consistent-type-imports: 'error'` rule
— note `apps/api` disables this rule for NestJS DI reasons only; `apps/mobile` should
**keep it enabled**, matching `packages/i18n`'s unmodified base config).

## No Analog Found

Files with no close match in the codebase — planner must rely on RESEARCH.md's
Architecture Patterns / Code Examples sections as the primary source, since this is
the first RN/Expo code and first Lingui-in-RN setup in the repo:

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `apps/mobile/app/_layout.tsx` | provider/guard | event-driven | No client-side route-guard/splash-gating code exists anywhere in the repo (backend-only until now) — use RESEARCH.md Pattern 1 verbatim as the starting point |
| `apps/mobile/lib/query-client.ts` | provider | — | No TanStack Query usage anywhere yet — plain `new QueryClient()` per RESEARCH.md, no wrapper needed (SC-4 note: don't pre-build a persistence wrapper) |
| `apps/mobile/metro.config.js` | config | — | No Metro config exists (first Expo app) — RESEARCH.md Pattern 4 + Pitfall E are the only sources; verify against installed SDK before assuming manual config is needed |
| `apps/mobile/babel.config.js`, `lingui.config.ts`, `locales/*/messages.po` | config / i18n catalog | — | No Lingui setup exists anywhere in the repo yet (only `packages/i18n`'s locale *utility* code, not Lingui catalog tooling) — RESEARCH.md Standard Stack + lingui.dev docs are the source |
| `apps/mobile/app.json` | config | — | First app identity file (name/scheme/bundle ID) in the repo — D-05 values are the source, no analog |
| `docker-compose.yml` (root) | config | — | No docker-compose file exists in the repo today — D-11 + RESEARCH.md's Don't-Hand-Roll table (Mailpit) are the source |

## Metadata

**Analog search scope:** `apps/api/src/**`, `packages/i18n/src/**`,
`packages/contracts/src/**`, `packages/config/**`, root `package.json`/`turbo.json`
(entire repo — no `apps/mobile` or `apps/admin` exist yet to search)
**Files scanned:** ~20 (all existing source files touched by Phase 1-2; confirmed via
`find`/`Read` this session)
**Pattern extraction date:** 2026-08-03
