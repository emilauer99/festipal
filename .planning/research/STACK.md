# Stack Research

## Reconciliation note (2026-07-30)

This file is UPDATED to reflect an auth-model change: the binding concept (`docs/concept/09-onboarding-auth.md`,
`docs/concept/04-domain-identity.md`; ADR-009 concretization + ADR-016, both dated 2026-07-29) replaces
**email/password** for visitors with **passwordless email-OTP**. What changed below:

- Visitor sign-in now goes through better-auth's built-in **`emailOTP` plugin** (`better-auth/plugins`,
  bundled in `better-auth@1.6.25` — no extra package), not `emailAndPassword`. See **Integration Notes §6**
  for server config (`otpLength`/`expiresIn`/rate-limit/`resendStrategy`), the matching Expo client plugin,
  and `sendVerificationOTP` wiring to an email provider.
- **Festival-Staff/Platform-Admin keep both** email+password *and* OTP (ADR-009 §3/ADR-018) — the shared
  `better-auth` instance keeps `emailAndPassword: { enabled: true }` alongside `emailOTP()`; only the
  *visitor-facing* Expo client flow is OTP-only.
- New: how `username`/`displayName`/`socials` (ADR-016 `VisitorProfile`) should be modeled relative to
  better-auth's `user` table — **Integration Notes §7** (recommendation: separate Drizzle table, not
  `additionalFields`, and explicitly *not* better-auth's `username` plugin).
- New: a live username-availability-check pattern fitting ts-rest — **Integration Notes §8**.
- New: OTP email delivery for dev vs. prod (Resend/SMTP) — **Integration Notes §6.3**.
- Everything else in this file — ts-rest+TanStack Query wiring, Expo Router `Stack.Protected` gating,
  `expo-secure-store`, the NestJS `bodyParser:false` caveat, all version numbers — is unchanged and carried
  forward as-is; it was not re-derived for this refresh.

**Domain:** Auth + data-fetching + routing integration for a multi-tenant Expo/NestJS festival app (visitor shell slice)
**Researched:** 2026-07-29 (refreshed 2026-07-30 for OTP auth model)
**Confidence:** MEDIUM-HIGH (library versions verified against npm registry = HIGH; integration patterns verified against Context7-indexed official docs = MEDIUM, cross-checked with peer-dependency ranges)

> Scope note: this file does NOT re-litigate the stack — Turborepo/pnpm, Expo+Expo Router, NestJS,
> ts-rest+Zod, Drizzle+Neon, better-auth, Lingui, MapLibre, TypeScript 6.0.x are locked (ADRs
> 001–015, `docs/DEVELOPMENT_DECISIONS.md`). This is the concrete library/version/integration layer
> needed to build the visitor-shell slice on top of that locked stack.

## Recommended Stack

### Core Technologies (net-new for this slice)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `better-auth` | 1.6.25 | Auth core (server) — already the ADR-009 choice, not yet wired | Latest stable; peer-declares `drizzle-orm: ^0.45.2`, matching `packages/db`'s pinned version exactly — no drizzle bump needed. Ships `emailOTP` as a built-in plugin (`better-auth/plugins`) — no extra package for OTP. |
| `@better-auth/expo` | 1.6.25 | Official Expo integration — server plugin (`expo()`) + client plugin (`expoClient()`) | Ships **in lockstep with `better-auth` core** (same version number, peer-pinned `better-auth: ^1.6.25`) — this is the maintained, first-party path for RN/Expo, not a community shim. Handles deep-link OAuth redirects, cookie caching via a pluggable storage adapter, and CSRF/origin checks for native apps (which don't send `Origin` headers like browsers do). Its client automatically re-persists the session cookie/token to `SecureStore` on every response (`onSuccess` hook) — this is what makes the "long-lived session" survive without a separate refresh call; see Integration Notes §6.2. |
| `@thallesp/nestjs-better-auth` | 2.7.0 | NestJS wiring — mounts the auth handler, registers a global `AuthGuard`, provides `@Session()`/`@AllowAnonymous()`/`@OptionalAuth()` decorators | better-auth core has **no official NestJS adapter**; this is the de-facto community package (actively maintained, referenced directly from better-auth's own docs at `docs/content/docs/integrations/nestjs.mdx`). Peer-requires `@nestjs/common@^11.1.6` and `express@^5.1.0` — both already satisfied (`@nestjs/platform-express@11.1.28` bundles `express@5.2.1`). Confidence: MEDIUM (community package, not official) — worth a smoke test in Phase 1 before depending on it long-term. |
| `expo-secure-store` | 57.0.1 | Encrypted on-device storage for the auth session/cookie | First-party Expo module, SDK-versioned to match `expo@57.0.8`. Wraps iOS Keychain (`kSecClassGenericPassword`) and Android Keystore-backed `SharedPreferences` — this is what `@better-auth/expo`'s `expoClient({ storage })` option expects. |
| `@ts-rest/react-query` | 3.52.1 | Generates typed TanStack Query hooks from the existing `packages/contracts` ts-rest router | **Must exactly match** `@ts-rest/core@3.52.1` already pinned in `packages/contracts` (peer: `@ts-rest/core: ~3.52.0`) and the workspace's zod 3.x pin (peer: `zod: ^3.22.3`). Peer-supports `@tanstack/react-query: ^4.0.0 \|\| ^5.0.0`. |
| `@tanstack/react-query` | 5.101.4 | Data-fetching/caching layer in the Expo app — already the ADR-007 choice for offline-first caching, now also the vehicle for online API calls in this slice | Use the **v5** ts-rest entrypoint (`@ts-rest/react-query/v5`, not the legacy `/v4` API) — matches this version. Same library that will later carry the persisted-cache offline story (ADR-007), so no second data-fetching library is introduced for this slice. |

### Email delivery for OTP (net-new, 2026-07-30)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `resend` | 6.18.1 | Prod/staging transactional email sender, called from `sendVerificationOTP` | Simple Node SDK (`new Resend(apiKey).emails.send(...)`), generous free tier for MVP-scale OTP volume, no SMTP relay to operate. `RESEND_API_KEY` in Railway env — never hardcoded, matches CLAUDE.md "no secrets in repo." Requires a verified sending domain for prod (Resend rejects unverified `from` domains); use their sandbox `onboarding@resend.dev` sender only in non-prod. |
| `nodemailer` | 9.0.3 | Dev-only local email preview (Ethereal/Mailhog/console transport) | Lets the OTP flow be tested end-to-end without burning Resend quota or needing real inboxes; keeps `sendVerificationOTP`'s call site provider-agnostic (see §6.3) so swapping dev↔prod transport is a config branch, not a code branch. |

### Supporting Libraries (Expo peer deps pulled in by `@better-auth/expo`)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `expo-constants` | 57.0.7 | Reads app config (scheme, extra) at runtime | Required peer of `@better-auth/expo` (`>=17.0.0`, SDK 57 ships 57.0.7) |
| `expo-linking` | 57.0.4 | Deep-link URL construction/parsing | Required peer (`>=7.0.0`); used for OAuth/email-verification redirect callbacks even though v1 has no social login — better-auth's expo plugin wires this unconditionally |
| `expo-network` | 57.0.1 | Network state used internally by the expo plugin's fetch layer | Required peer (`>=8.0.7`) |
| `expo-web-browser` | 57.0.2 | Opens the system browser for OAuth flows | Required peer (`>=14.0.0`) — installed even though social login (Google/Apple) is deferred to 2027 per ADR-009, since it's a hard peer of `@better-auth/expo`; near-zero cost (no native OAuth screens are actually shown for the OTP-only visitor flow) |
| `expo-router` | 57.0.8 | App/auth navigation split via `<Stack.Protected>` | Already the ADR-001 choice; version pinned to match `expo@57.0.8` (Expo SDK 57) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `npx auth@latest generate --adapter drizzle --dialect postgresql` (better-auth CLI) | Generates the Drizzle `user`/`session`/`account`/`verification` tables from your `betterAuth()` config + plugins | Run from `packages/db` (or point `--output` there) so the generated schema lands next to the existing `festival`/`tag` schema files, then run the **existing** `db:generate`/`db:migrate` Drizzle-kit flow on top — better-auth's CLI only emits schema, Drizzle Kit still owns the actual migration files (keeps ADR-005's migration flow as sole source of truth). Note: the `emailOTP` plugin does **not** add any new tables — OTPs are stored in better-auth's existing `verification` table, keyed by identifier+type. Regenerate after adding `emailOTP()`/`emailAndPassword` to `plugins`/config so `verification`/`account` reflect the final plugin set. |
| `npx expo install <pkg>` | Installs Expo/RN packages pinned to the SDK-compatible version | Use this (not raw `pnpm add`) for every `expo-*`/RN-native package in `apps/mobile` — it resolves against the SDK 57 compatibility table so peer versions above (57.0.x) stay in lockstep automatically. Works fine inside a pnpm workspace. |

## Installation

```bash
# --- apps/api (auth server) ---
pnpm --filter @festipal/api add better-auth @thallesp/nestjs-better-auth resend
pnpm --filter @festipal/api add -D nodemailer   # dev-only email preview transport

# --- packages/db (auth schema — generated once, then owned by Drizzle Kit) ---
cd packages/db
npx auth@latest generate --adapter drizzle --dialect postgresql --output ./src/schema/auth.ts
pnpm --filter @festipal/db db:generate   # existing drizzle-kit flow picks up the new tables
pnpm --filter @festipal/db db:migrate

# --- apps/mobile (scaffold first, per PROJECT.md — not yet created) ---
cd apps/mobile
npx expo install better-auth @better-auth/expo expo-secure-store
npx expo install expo-constants expo-linking expo-network expo-web-browser   # peers, usually already present from `npx create-expo-app`
pnpm add @ts-rest/react-query @tanstack/react-query
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| `@thallesp/nestjs-better-auth` for the NestJS mount | Hand-rolled `all('/api/auth/*', toNodeHandler(auth))` route + manual guard (better-auth's generic Node/Express pattern) | If the community package stalls/breaks on a future NestJS major, or a security review flags concerns about depending on a third-party auth-guard implementation — the hand-rolled version is ~20 lines and documented directly in better-auth's own `integrations/express.mdx`, usable as a fallback with no new dependency. |
| `expo-secure-store` for session storage | `react-native-mmkv` (already a candidate per ADR-007 for offline cache) | MMKV is **not encrypted at rest by default on iOS Keychain-grade guarantees** the way SecureStore is, and isn't what `@better-auth/expo`'s `storage` option is documented/tested against. Keep MMKV for the *offline content cache* (timetable, map tiles) per ADR-007; keep SecureStore for the *auth session* specifically — different data-sensitivity tiers, different tool. |
| `@ts-rest/react-query` (typed hooks) | Plain `@ts-rest/core` client + manual `useQuery(['key'], () => client.foo())` | If a single one-off call doesn't warrant a typed hook; not recommended as the default pattern since it throws away the contract-driven query-key generation `@ts-rest/react-query` gives for free. |
| `<Stack.Protected guard={...}>` (Expo Router built-in, SDK 53+) | Manual `<Redirect>` in each protected layout's `_layout.tsx` | Use the manual `<Redirect>` pattern only for a *single* nested layout that needs custom loading-state UI while the session is being read from SecureStore (e.g. a splash/spinner state) — `Stack.Protected` alone doesn't have a built-in "loading" branch, so the root layout typically combines both: a loading guard clause + `Stack.Protected` for the authenticated/unauthenticated split. |
| `emailOTP` plugin for visitor sign-in (2026-07-30) | better-auth's `username` plugin, used to also carry `username`/`displayUsername` on the shared `user` table | The `username` plugin is tempting because it ships a free `isUsernameAvailable()` client call — but it stores `username`/`displayUsername` directly on better-auth's `user` (= `Account`) table. ADR-016 explicitly wants `username` on a *separate* `VisitorProfile`, because a Staff/PlatformAdmin-only account has no username. Do not add the `username` plugin; build a custom `visitor_profile` table + a small ts-rest endpoint instead (Integration Notes §7–§8). |
| Resend for prod OTP delivery | Self-hosted SMTP (Postfix/AWS SES raw SMTP) | Only if email volume or deliverability requirements outgrow Resend's tier, or a later compliance need (e.g. EU-only mail routing) forces it — not a v1 concern; Resend already runs through Frankfurt-adjacent EU infrastructure options and needs no server to operate, fitting the Railway-hosted, ops-light deployment (ADR-010). |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| `@better-auth/expo` client without an explicit `storage: SecureStore` option | Defaults to `AsyncStorage`/in-memory in some configurations depending on version — session would not survive app restarts, breaking the "land logged-in on reopen" requirement from PROJECT.md | Always pass `storage: SecureStore` explicitly in `expoClient({...})`. |
| Zod v4 anywhere in `apps/mobile` or shared packages that touch auth | `better-auth`'s own `emailOTP`/`emailAndPassword` request schemas and `@ts-rest/react-query` both peer-pin `zod: ^3.x`; project already fixed this workspace-wide (ADR-006). A stray v4 install (e.g. via a fresh `npx expo install` pulling latest) would create dual zod versions and silent `instanceof ZodSchema` failures. | Keep zod pinned to the existing 3.25.76 in the root workspace; do not let any new package hoist a v4 copy — check `pnpm why zod` after adding new deps. |
| Global `credentials: 'include'` fetch default plus manual `Cookie` header on the same request | better-auth's client sets `credentials: 'include'` by default; when manually attaching `Cookie` headers to a *separate* `fetch`/ts-rest call (as required to authenticate ts-rest requests), the docs explicitly warn `credentials: 'include'` can conflict with a manually-set cookie header. | Set `credentials: 'omit'` on the raw `fetch` calls where you manually attach `authClient.getCookie()` as a header (see Integration Notes below). |
| Legacy `@ts-rest/react-query` v4 API (`client.posts.get.useQuery([...])`) | Project is on TanStack Query v5 (`@tanstack/react-query@5.101.4`); the v4-style ts-rest API targets React Query v4's calling convention and is a different import path/shape. | Import from `@ts-rest/react-query/v5` and use `initTsrReactQuery` + `tsr.ReactQueryProvider`. |
| Bare `AsyncStorage` for the session token | Unencrypted, plaintext on-device storage — inappropriate for a session credential even though it's not a payment credential (ADR-011 already bars payment data from the app; session tokens are still a security-sensitive secret). | `expo-secure-store`, as recommended above. |
| better-auth's `username` plugin as the source of `VisitorProfile.username` (2026-07-30) | Adds `username`/`displayUsername` to the shared `user` table, conflating Account (all login types) with Visitor-only data — contradicts ADR-016's explicit Account/VisitorProfile split and its own callout that Staff-only accounts have no username. | A separate `visitor_profile` Drizzle table keyed by `accountId`, with its own case-insensitive-unique `username` column (Integration Notes §7). |
| `await`ing `sendVerificationOTP`'s email-send call inline before responding | better-auth's own docs recommend **not** awaiting the send, to avoid timing attacks (response time reveals whether the account/email exists) and to avoid blocking the request on a third-party API call. | Fire-and-forget the send (or use a serverless `waitUntil`-equivalent / a lightweight queue) inside `sendVerificationOTP`; log/alert failures out-of-band rather than surfacing them to the client. |

## Integration Notes (concrete wiring)

### 1. better-auth server in NestJS

```ts
// apps/api/src/auth/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { emailOTP } from "better-auth/plugins";
import { db } from "@festipal/db"; // existing Drizzle client
import { sendOtpEmail } from "./send-otp-email"; // Resend/nodemailer switch, see §6.3

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  baseURL: process.env.BETTER_AUTH_URL, // already a config placeholder in apps/api/src/config/env.ts
  secret: process.env.BETTER_AUTH_SECRET,
  // Staff/Admin (ADR-009 §3, ADR-018): keep password as an option alongside OTP.
  emailAndPassword: { enabled: true },
  plugins: [
    expo(),
    emailOTP({
      otpLength: 6,          // ADR-009/09-onboarding-auth.md: 6-stelliger Code
      expiresIn: 300,        // 5 min — plugin default; revisit with product if UX needs longer
      // "reuse" resends the SAME code (extends its expiry) instead of invalidating + minting a new
      // one on every "Resend" tap — avoids the classic "I typed the code from the first email" bug.
      resendStrategy: "reuse",
      async sendVerificationOTP({ email, otp, type }) {
        // type: "sign-in" | "email-verification" | "forget-password"
        // Visitor flow only ever triggers "sign-in". Don't await — see "What NOT to Use".
        void sendOtpEmail({ email, otp, type });
      },
    }),
  ],
  trustedOrigins: ["festipal://"], // app.json `scheme` — must match apps/mobile's Expo scheme
});
```

```ts
// apps/api/src/app.module.ts
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./auth/auth";

@Module({ imports: [AuthModule.forRoot({ auth }), /* existing FestivalModule etc */] })
export class AppModule {}
```

```ts
// apps/api/src/main.ts — REQUIRED, or better-auth's raw-body handling breaks
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  // Re-add JSON body parsing for every OTHER (ts-rest) route.
  app.use(json()); // from 'express' — apply globally is fine; better-auth's routes read the raw
                    // stream before this runs because AuthModule registers its middleware first.
  await app.listen(process.env.PORT ?? 8081);
}
```

Pitfall flagged by better-auth's own docs (Express integration page): disabling Nest's default
body parser is mandatory for the auth handler to read the raw body, but this **also disables JSON
parsing for every ts-rest controller** unless `express.json()` is re-added manually after the auth
module is registered. Verify this combination (bodyParser:false + manual express.json() +
`@ts-rest/nest`'s own body handling) with an integration test in Phase 1 — this is the single
highest-risk wiring point in this slice; the community NestJS adapter (MEDIUM confidence) hasn't
been verified against `@ts-rest/nest` specifically. *(Carried forward unchanged — this caveat is
orthogonal to the OTP vs. password decision.)*

Route protection: `AuthModule.forRoot()` registers a **global** `AuthGuard` — every controller is
auth-required by default; use `@AllowAnonymous()` on the festival-list-before-login endpoints (if
any are meant to be public) and `@Session()` to read the current user.

### 2. better-auth client in Expo

```ts
// apps/mobile/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL, // e.g. https://api.festipal.app or localhost:8081 in dev
  plugins: [
    expoClient({
      scheme: "festipal",       // must match app.json `expo.scheme` AND server trustedOrigins
      storagePrefix: "festipal",
      storage: SecureStore,     // <-- the load-bearing option; do not omit
    }),
    emailOTPClient(),            // adds authClient.emailOtp.* and authClient.signIn.emailOtp
  ],
});

export const { signOut, useSession } = authClient;
```

`app.json` needs `"expo": { "scheme": "festipal" }` for the deep-link redirect plumbing to work
(even for the OTP-only visitor flow — the plugin wires it unconditionally).

### 3. ts-rest client wired to TanStack Query, authenticated via the better-auth cookie

```ts
// apps/mobile/lib/api-client.ts
import { initTsrReactQuery } from "@ts-rest/react-query/v5";
import { contract } from "@festipal/contracts"; // existing single source of truth
import { authClient } from "./auth-client";

export const tsr = initTsrReactQuery(contract, {
  baseUrl: process.env.EXPO_PUBLIC_API_URL!,
  baseHeaders: {
    Cookie: () => authClient.getCookie(), // dynamic — re-read on every request, not captured once
  },
  // better-auth's own client sets credentials:'include'; ts-rest's underlying fetch does not by
  // default, so no 'omit' workaround is needed here (only needed for hand-rolled fetch() calls).
});
```

```tsx
// apps/mobile/app/_layout.tsx (root)
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { tsr } from "../lib/api-client";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>{/* <RootNavigator/> below */}</tsr.ReactQueryProvider>
    </QueryClientProvider>
  );
}
```

Usage in a screen — fully typed against `packages/contracts`, no manual response typing:

```ts
const { data, isLoading } = tsr.festivals.list.useQuery({ queryKey: ["festivals"] });
```

### 4. Expo Router auth-gated structure

```
apps/mobile/app/
├─ _layout.tsx          # root: reads session, renders RootNavigator (below)
├─ (auth)/
│  ├─ welcome.tsx       # Welcome → "Los geht's"
│  ├─ email.tsx         # enter email → "Code senden" (authClient.emailOtp.sendVerificationOtp)
│  └─ verify.tsx        # 6-digit code → authClient.signIn.emailOtp; Resend + "E-Mail ändern"
├─ onboarding/
│  └─ profile.tsx       # first-login only: username (live check) + displayName (+ optional avatar/socials)
└─ (app)/                # authenticated group
   ├─ _layout.tsx        # <Tabs> or <Stack> for Festivals / Friends / Profile
   ├─ index.tsx           # festival list + select
   ├─ home.tsx            # post-join home (overview entry point)
   ├─ profile.tsx         # placeholder
   └─ friends.tsx         # placeholder
```

```tsx
// apps/mobile/app/_layout.tsx
function RootNavigator() {
  const { data: session, isPending } = authClient.useSession();
  const needsProfile = !!session && !session.user.hasCompletedProfile; // see §7 — derived from VisitorProfile join

  if (isPending) return <SplashScreen />; // Stack.Protected has no built-in loading branch

  return (
    <Stack>
      <Stack.Protected guard={!!session && !needsProfile}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && needsProfile}>
        <Stack.Screen name="onboarding/profile" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
```

`<Stack.Protected guard={...}>` is the current (Expo SDK 53+, still current in SDK 57) idiomatic
pattern — it declaratively hides/redirects screens based on a boolean guard and is preferred over
manually sprinkling `<Redirect>` in every nested layout. Combine it with a loading-state early
return (as above) since the guard itself has no concept of "session still loading from
SecureStore." *(Carried forward unchanged; the three-way branch for first-login profile completion
is new — ADR-009/`09-onboarding-auth.md` step 4.)*

### 5. Secure storage — device specifics

- `expo-secure-store` wraps iOS Keychain (`kSecClassGenericPassword`) and Android Keystore-backed
  `SharedPreferences` — this is what `@better-auth/expo` expects via its `storage` option.
- **Known limit: 2048-byte value size** on both platforms (historically enforced harder on iOS).
  better-auth session cookies/tokens are normally well under this, but if custom session data or
  JWTs with many claims are added later, watch for silent failures — Expo currently only warns,
  future SDKs may throw.
- Do **not** reach for `react-native-mmkv` for the session — MMKV is the right tool for the
  *offline content cache* (ADR-007) but isn't the documented/tested backing store for
  `@better-auth/expo`'s `storage` option, and doesn't offer the same OS-level encryption guarantee
  as Keychain/Keystore for a security-sensitive session credential.

### 6. Email-OTP end-to-end (2026-07-30)

#### 6.1 Server config (recap of §1, options in detail)

- `otpLength` (default 6) and `expiresIn` (default 300s = 5 min) are set directly on `emailOTP({...})`
  — matches `09-onboarding-auth.md`'s "6-stelliger Code" verbatim with the plugin default, no override
  needed for length; `expiresIn` is a product call (5 min is a reasonable MVP default, revisit if UX
  testing shows codes expiring before users switch back from their mail app).
- `resendStrategy: "reuse"` (vs. the default, which mints an all-new code + invalidates the old one on
  every "Resend" tap) reuses the same code and extends its expiry — recommended so a user who has the
  first email open doesn't get a "wrong code" error after tapping Resend once. Requires the OTP to be
  recoverable (plain/encrypted storage, which is the plugin default) — do not combine with a custom
  hashing override that makes the stored OTP non-recoverable.
- **Rate limiting is on by default**, not something to newly configure: every `email-otp/*` and
  `sign-in/email-otp` endpoint is rate-limited to **3 requests per 60-second window** out of the box
  (`opts.rateLimit.window`/`opts.rateLimit.max` to override). This already satisfies ADR's "Rate-Limit
  auf Code-Anforderung" requirement — no extra throttling middleware needed for MVP. Confirm this
  applies per-IP-and-identifier (better-auth's general rate limiter is IP+path based) so a shared
  festival Wi-Fi doesn't collectively lock visitors out; if that turns out to be too aggressive at a real
  festival, `opts.rateLimit.max` is the first knob, not disabling it.
- Sign-in auto-registers: `POST /sign-in/email-otp` creates the `user`/`Account` row automatically on
  first successful verification — no separate "sign up" call needed. This matches `04-domain-identity.md`
  §2 ("E-Mail ist durch den Code inhärent verifiziert. Kein Passwort gespeichert.") — no `emailVerified`
  flag juggling required, better-auth sets it as part of the OTP verify.

#### 6.2 OTP × `@better-auth/expo` session persistence, long-lived sessions, re-auth on expiry

- There is **no distinct OAuth-style refresh token** in better-auth. The "Refresh-Token" wording in
  `09-onboarding-auth.md` §4 ("Mobil langlebig (Refresh-Token)") should be read as: **one sliding-window
  session token**, configured via `session.expiresIn` (absolute max lifetime) + `session.updateAge`
  (how often that lifetime resets on activity):
  ```ts
  // apps/api/src/auth/auth.ts — add to betterAuth({...})
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days — "bleibt eingeloggt" for a returning festival-goer
    updateAge: 60 * 60 * 24,      // 1 day — any request in the last 24h resets the 30-day window
  },
  ```
  Confirm the exact `expiresIn` value with product (30 days is a reasonable MVP default for a
  "log in once per festival season" visitor app); there is no "short access token + long refresh
  token" pair to size separately.
- Mechanically, the `@better-auth/expo` client's `onSuccess` hook (fires after **every** request)
  reads `set-cookie`/`set-auth-token` on the response and re-writes the session value to
  `expo-secure-store` whenever it changed — this is what makes the session feel "long-lived" without
  the app ever calling an explicit `/refresh` endpoint. No extra code is needed for this; it's
  automatic once `storage: SecureStore` is set (§2). Do not build a custom refresh-token flow —
  it would duplicate what the Expo client already does.
- **Re-auth on expiry = re-run the OTP sign-in flow**, not a token-refresh call. When
  `authClient.useSession()` returns `session: null` after previously being authenticated (expired
  past `expiresIn`, or `updateAge` window lapsed from inactivity), route back to `(auth)/email.tsx`.
  There is no "silent" recovery path — this matches the concept doc's "bei Ablauf Re-Auth via OTP."
- The `bearer` plugin is **not required** here: `@better-auth/expo`'s cookie-jar emulation (via
  SecureStore) already round-trips cookies correctly for native `fetch`, which is why the original
  STACK.md recommendation to enable `bearer` was about the ts-rest client's manual `Cookie` header
  path (§3), not about OTP specifically — no change from the prior research on this point.

#### 6.3 OTP delivery — dev vs. prod, no secrets in repo

```ts
// apps/api/src/auth/send-otp-email.ts
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendOtpEmail({
  email,
  otp,
  type,
}: {
  email: string;
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password";
}) {
  const subject = type === "sign-in" ? "Dein festipal-Code" : "Dein Bestätigungscode";
  const body = `Dein Code: ${otp} (gültig 5 Minuten)`;

  if (!resend) {
    // Dev fallback: log to console (fastest inner loop) — swap for a nodemailer Ethereal
    // transport if you want an actual inbox preview during local development.
    console.info(`[dev otp] ${email}: ${otp}`);
    return;
  }

  await resend.emails.send({
    // Sandbox sender for non-prod (no domain verification needed); swap to a verified
    // festipal.app sender once the sending domain is verified in the Resend dashboard.
    from: process.env.RESEND_FROM ?? "festipal <onboarding@resend.dev>",
    to: email,
    subject,
    text: body,
  });
}
```

- `RESEND_API_KEY` (and optionally `RESEND_FROM`) go in `apps/api`'s env (Railway config), following
  the existing `apps/api/src/config/env.ts` Zod-validated pattern — same as `BETTER_AUTH_SECRET`.
  **Never commit a real key**; `.env.example` gets a placeholder only.
  Confidence: MEDIUM — verify the exact Zod field name/requiredness against `env.ts` once this env
  var is actually added, this file only recommends the variable name.
- Local dev needs **no** Resend account at all if the `console.info` fallback above is used — this
  keeps onboarding for new contributors friction-free (no "beg for an API key before you can even see
  the login screen" problem). If a real-inbox preview is wanted for QA, wire `nodemailer` with an
  Ethereal test account (`nodemailer.createTestAccount()`) behind the same `sendOtpEmail` call site.
- Do **not** await the network call inline before the endpoint responds (see "What NOT to Use") — the
  snippet above is called via `void sendOtpEmail(...)` from `sendVerificationOTP` in §1.

### 7. Modeling `Account → VisitorProfile` in Drizzle (2026-07-30)

**Recommendation: a separate `visitor_profile` table, not `additionalFields` on better-auth's `user`
table, and not the `username` plugin.** This directly implements ADR-016's "Ein reiner Staff-Account
hat **keinen** `username`/`avatar`" — those fields must be *absent*, not just nullable, for a
Staff-only account's conceptual model, and a separate table (with `packages/contracts` deriving Zod
via `drizzle-zod`, per PITFALLS.md's existing contract-drift guidance) keeps that boundary enforced
in the schema rather than by convention.

```ts
// packages/db/src/schema/visitor-profile.ts
import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth"; // generated by `npx auth generate` (better-auth's `user` table)

export const visitorProfile = pgTable("visitor_profile", {
  accountId: uuid("account_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }), // 1:1 optional-at-Account, per ADR-016 §3
  username: text("username").notNull(),          // store normalized (lowercase) form
  displayUsername: text("display_username").notNull(), // original casing, for display
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),                  // nullable — optional per 04-domain-identity.md §3
  socials: jsonb("socials").$type<{ platform: string; handle: string }[]>().default([]),
  socialsVisibility: text("socials_visibility", { enum: ["everyone", "friends"] })
    .notNull()
    .default("everyone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

```sql
-- packages/db migration (drizzle-kit generates this from the table above, but the uniqueness
-- constraint below is the load-bearing piece — add it explicitly if drizzle-kit doesn't infer a
-- case-insensitive unique index from a plain `.unique()` on a `text` column):
CREATE UNIQUE INDEX visitor_profile_username_unique ON visitor_profile (lower(username));
```

- **Why not `additionalFields` on `user`:** better-auth's `additionalFields` mechanism (used correctly
  for genuinely account-wide fields like a `locale` preference) merges new columns directly into the
  shared `user` table that *every* Account type — Visitor, FestivalStaff, PlatformAdmin — shares. That
  is the wrong table for `username`/`avatar`/`socials`, which ADR-016 scopes to visitors only.
- **Why not the `username` plugin:** it also targets the shared `user` table (adds `username` +
  `displayUsername` columns there, see the plugin's own schema section) and additionally wires a
  `username`+password sign-in surface the product doesn't want exposed. Its only genuinely reusable
  piece — the `isUsernameAvailable` client call — is not worth adopting the whole plugin for, since a
  custom ts-rest endpoint over the `visitor_profile` table (§8) gives the same UX with the correct
  table placement.
- `hasCompletedProfile` (used in the Expo Router snippet in §4) is a **derived** value — compute it
  server-side as `visitorProfile row exists for this accountId`, expose it on `GET /me` (ts-rest,
  authenticated), don't try to store it as a boolean flag that can drift from the actual row's
  existence.
- `FestivalStaff`/`PlatformAdmin` (ADR-016 §3–4) are out of scope for this slice but follow the same
  pattern: separate tables keyed by `accountId`, never merged into `user`.

### 8. Live username-availability-check endpoint (ts-rest, 2026-07-30)

**Contract** (`packages/contracts`) — reuse the `visitor_profile` Drizzle table's Zod shape via
`drizzle-zod` rather than hand-declaring the username regex twice:

```ts
// packages/contracts/src/router/visitor-profile.ts
import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

const usernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9_.]+$/i, "Nur a-z, 0-9, _ und . erlaubt"); // case-insensitive per ADR-016 §5

export const visitorProfileContract = c.router({
  checkUsername: {
    method: "GET",
    path: "/me/username-availability",
    query: z.object({ username: usernameSchema }),
    responses: {
      200: z.object({ available: z.boolean() }),
      400: z.object({ message: z.string() }), // invalid format (length/charset)
    },
  },
  completeProfile: {
    method: "POST",
    path: "/me/profile",
    body: z.object({
      username: usernameSchema,
      displayName: z.string().min(1).max(50),
      avatarUrl: z.string().url().optional(),
      socials: z.array(z.object({ platform: z.string(), handle: z.string() })).optional(),
      socialsVisibility: z.enum(["everyone", "friends"]).default("everyone"),
    }),
    responses: {
      201: z.object({ id: z.string() }),
      409: z.object({ message: z.string() }), // username taken — see race-condition note below
    },
  },
});
```

**Server** — the availability check is a read against the case-insensitive index from §7; the actual
insert/update is what's authoritative (classic check-then-act race — see PITFALLS.md's new "username
availability race" entry):

```ts
// apps/api/src/visitor-profile/visitor-profile.controller.ts (sketch)
@TsRestHandler(visitorProfileContract.checkUsername)
async checkUsername() {
  return tsRestHandler(visitorProfileContract.checkUsername, async ({ query }) => {
    const normalized = query.username.toLowerCase();
    const existing = await db.query.visitorProfile.findFirst({
      where: eq(sql`lower(${visitorProfile.username})`, normalized),
    });
    return { status: 200, body: { available: !existing } };
  });
}
```

On `completeProfile`, catch the Postgres unique-violation (error code `23505`) from the
`visitor_profile_username_unique` index and map it to the contract's `409` — this, not the
availability check, is the actual source of truth; the availability check is UX sugar, not a lock.

**Client** (Expo) — debounce the query so every keystroke doesn't hit the API, and treat the result as
advisory (final confirmation happens on submit):

```ts
// apps/mobile/app/onboarding/profile.tsx (sketch)
import { useDeferredValue, useState } from "react";
import { tsr } from "../../lib/api-client";

const [username, setUsername] = useState("");
const debounced = useDeferredValue(username); // simplest debounce; swap for a 300-400ms
                                                // timer-based hook if useDeferredValue's timing
                                                // (tied to React's scheduler, not wall-clock) proves
                                                // too eager/jittery in manual testing
const { data, isFetching } = tsr.visitorProfile.checkUsername.useQuery({
  queryKey: ["username-availability", debounced],
  query: { username: debounced },
  enabled: debounced.length >= 3, // don't fire below the min length
  staleTime: 10_000,
});
```

Confidence: MEDIUM — the ts-rest contract shape and Postgres unique-index pattern are standard and
HIGH confidence; the specific debounce primitive (`useDeferredValue` vs. a timer-based hook) is a
judgment call to validate against real typing-latency UX during Phase implementation, not a verified
library recommendation.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `better-auth@1.6.25` | `drizzle-orm@^0.45.2` | Exact match to `packages/db`'s already-pinned version — no bump needed |
| `@better-auth/expo@1.6.25` | `better-auth@^1.6.25` | Ship in lockstep; always install matching versions |
| `@thallesp/nestjs-better-auth@2.7.0` | `@nestjs/common@^11.1.6`, `express@^5.1.0`, `better-auth@>=1.5.0 <2.0.0` | All satisfied by current `apps/api` deps (`@nestjs/*@11.1.28` bundles `express@5.2.1`) |
| `@ts-rest/react-query@3.52.1` | `@ts-rest/core@~3.52.0`, `zod@^3.22.3`, `@tanstack/react-query@^4.0.0 \|\| ^5.0.0` | Matches the workspace's existing `@ts-rest/core@3.52.1` and zod 3.25.76 pins exactly |
| `expo-router@57.0.8` | `expo@57.0.8` (same SDK line), `react-native-screens@^4.26.0`, `react-native-safe-area-context@>=5.4.0` | All current-latest peers already line up (screens 4.26.2, safe-area-context 5.8.0) |
| `expo-secure-store@57.0.1` | `expo@57.0.8` | SDK-versioned; install via `npx expo install` to avoid drift |
| `resend@6.18.1` | Node ≥18 (satisfied, engines requires ≥22) | No peer conflicts; standalone HTTP client, no drizzle/zod coupling |
| `nodemailer@9.0.3` | Node ≥18 (satisfied) | Dev-dependency only — do not let it leak into the prod `apps/api` bundle if using per-package dep splitting |

## Sources

- `/better-auth/better-auth` (Context7, High source reputation, benchmark 83.78) — Expo client/server integration (`docs/content/docs/integrations/expo.mdx`), NestJS integration (`docs/content/docs/integrations/nestjs.mdx`), Drizzle adapter (`docs/content/docs/adapters/drizzle.mdx`), CLI schema generation. Confidence: MEDIUM (community-adjacent docs page for NestJS specifically; core Expo/Drizzle docs are official).
- `/better-auth/better-auth` (Context7, 2026-07-30 refresh) — `docs/content/docs/plugins/email-otp.mdx` (`emailOTP` server/client config, `otpLength`/`expiresIn`/`resendStrategy`, rate-limit defaults from `packages/better-auth/src/plugins/email-otp/index.ts`), `docs/content/docs/plugins/username.mdx` (schema/fields, confirming why it's NOT used here), `docs/content/docs/concepts/session-management.mdx` (`expiresIn`/`updateAge`/`cookieCache`), `docs/content/docs/concepts/database.mdx` (`additionalFields` semantics), `packages/expo/src/client.ts` (session-cookie auto-persist on every response), `packages/better-auth/src/plugins/bearer/index.ts` (`set-auth-token` mechanics). Confidence: HIGH (official plugin docs + source-level confirmation of defaults).
- `/expo/expo` (Context7, High source reputation, benchmark 78.42) — Expo Router protected-routes pattern (`docs/pages/router/advanced/authentication.mdx`), SecureStore size limits (SDK 51–56 docs snapshots). Confidence: HIGH (official Expo docs).
- `/ts-rest/ts-rest` (Context7, Medium source reputation, benchmark 86.28) — React Query v5 client setup (`docs/content/docs/client/react-query-v5.mdx`). Confidence: MEDIUM.
- npm registry (`npm view <pkg> version/peerDependencies/dependencies`, direct query, 2026-07-29 and re-confirmed 2026-07-30) — all version numbers and peer-dependency ranges cross-checked live against the registry, including `better-auth`, `@better-auth/expo` (still 1.6.25), `resend@6.18.1`, `nodemailer@9.0.3`. Confidence: HIGH (authoritative for versions).
- [resend.com/docs/send-with-nodejs](https://resend.com/docs/send-with-nodejs) (web search, 2026-07-30) — `RESEND_API_KEY` env var convention, sandbox `onboarding@resend.dev` sender, verified-domain requirement for prod. Confidence: MEDIUM (official docs via web search, not Context7-indexed).
- Existing project docs: `.planning/codebase/STACK.md`, `.planning/codebase/INTEGRATIONS.md`, `docs/DEVELOPMENT_DECISIONS.md` (ADR-005, 006, 009, 013, 016), `docs/concept/09-onboarding-auth.md`, `docs/concept/04-domain-identity.md` — for locked baseline versions (drizzle-orm 0.45.2, zod 3.25.76, TypeScript 6.0.3, ts-rest 3.52.1) and the binding OTP/identity model.

---
*Stack research for: multi-tenant festival app — visitor shell (auth + festival-list + home)*
*Researched: 2026-07-29; refreshed 2026-07-30 for the password → email-OTP auth model change*
