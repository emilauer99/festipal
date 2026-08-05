# Phase 4: Visitor Auth & Profile Completion - Research

**Researched:** 2026-08-05
**Domain:** Expo/React Native auth UX (better-auth Expo client), first-login profile completion, device-local media (MMKV + expo-image-picker), deep-link redirect-through-onboarding, drizzle-zod server-side validation, font loading
**Confidence:** MEDIUM-HIGH — backend/session mechanics verified against this repo's own Phase 2/3 code + official docs; the deep-link "return-to" pattern has no official Expo Router doc and is a synthesized recommendation (flagged LOW/ASSUMED accordingly)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01 — Avatar scope:** local-only, **device-persisted via MMKV**; no server upload, no contract
  change. `visitor_profile.avatar` stays null; picker works, chosen URI survives restart on the
  same device, not synced cross-device.
- **D-02 — Deep-link (SC-5):** **return-to-destination** — after login (and profile-completion if
  needed) navigate to the originally-tapped protected route, not just Home.
- **D-03 — Name length caps:** `displayName` ≤ 40, `username` 3–20 (charset `a–z 0–9 _ .`), enforced
  server-side (Zod refinements in contracts + db) plus a matching client soft-cap.
- **D-04 — Splash:** **light restyle** to real brand tokens (dark `--bg-app` + festipal wordmark in
  Outfit), non-blocking.

**Avatar (IDN-01 optional part):** The avatar picker (`expo-image-picker` + `expo-image`) is built,
but the chosen photo is stored on-device only via MMKV and displayed in the avatar-tile position
instead of the initials fallback. It is NOT uploaded: `POST /me/complete-profile` body stays
`username` + `displayName` only (contract unchanged), `visitor_profile.avatar` stays `null`, and
there is no upload endpoint / object store this phase. Survives an app restart on the same device,
does not sync server-side or across devices, lost if app data is cleared. Initials tile shows
whenever no local photo is set. Known trade-off (user-accepted): device-local half of the full
feature; reversible (no schema/contract change).

**Deep-link redirect (SC-5):** A logged-out tap on a protected route redirects into the auth flow
(no content leak), and after successful authentication — including passing through
profile-completion if it's a first login — the app navigates to the originally-requested route, not
a generic Home. The intended destination must survive the intermediate profile-completion step.
Reversible (navigation/redirect logic, no persisted or contract state).

**Server-side name length caps:** `displayName` capped at 40 chars; `username` 3–20 chars, charset
`a–z 0–9 _ .` (concept doc 09 §5). Enforced via `.max()`/`.min()`/charset refinements on the
drizzle-zod bases in `packages/db` + `packages/contracts` (`visitorProfileInsertSchema` /
`completeProfileBodySchema`), since the server currently enforces nothing (bare `z.string()`).
Client gets the matching soft-cap + single-line truncation. Username-taken suggestion generator
must cap its output ≤ 20 chars. Reversible in practice (mobile app is the only pre-launch
consumer) but touches the published `packages/contracts` schema — treat as a coordinated contract
edit.

**Splash screen:** Restyle to the real brand tokens — dark `--bg-app` background + "festipal"
wordmark in Outfit — replacing Phase 3's plain placeholder. Non-blocking: must not gate on font
load (system-font fallback until Outfit is ready); nothing in Phase 4's success criteria depends
on it.

### Claude's Discretion

- **Username-taken suggestion algorithm** — UI-SPEC fixes only the sentence shape; the generator is
  planner's choice, but MUST cap output ≤ 20 chars (D-03) and produce an available candidate.
- **Logout robustness (UI-SPEC backstops):** a failed/offline `signOut()` must still clear the local
  session and reach Welcome (never strand the visitor logged-in); guard the button against
  re-entrant double-tap during the in-flight signOut.
- **Splash timeout/fallback (UI-SPEC backstop):** the cold-start session/festival resolve must have
  a timeout/fallback so the splash can't deadlock on a hung request.
- **MMKV avatar storage** — key/shape for the local avatar URI, and `expo-image-picker` permission
  handling (gallery + camera).
- **Route file layout** for the Welcome/email split under `app/(auth)/`, and the guard extension for
  deep-link return-to (build on Phase 3's three-state guard).
- **Font loading mechanism** (`@expo-google-fonts/*` + `expo-font`) with graceful system-font
  fallback.

### Deferred Ideas (OUT OF SCOPE)

- Real **server-side** avatar upload + storage (endpoint, object store, `avatar` in the contract) —
  device-local only this phase (D-01). Cross-device avatar sync depends on it.
- Social-links block + profile-visibility control (PROF-02, v2) — excluded per UI-SPEC Scope note #2.
- Manual light/dark toggle (Settings feature) and in-app language switcher.
- Festival home/overview content, date/place master-data (Phase 5); real Profile/Friends (Phase 6).
- Real Resend delivery hardening / festival-scale rate-limit tuning (pre-launch).

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Visitor enters email, receives 6-digit OTP, logs in by entering it; new email creates a global `Account` | Existing Phase 2/3 OTP round-trip (`authClient.emailOtp.sendVerificationOtp` / `authClient.signIn.emailOtp`) is reused unchanged — restyle only. See "Existing Code Insights" and Pattern 1. |
| AUTH-02 | Returning visitor (email already has a VisitorProfile) skips profile setup | Already implemented by the four-state `AuthState` guard in `app/_layout.tsx` (`GET /me`'s `profile: null` discriminator) — no change needed to the branch logic, only to what mounts in each branch. |
| AUTH-03 | Session long-lived, auto-renews, survives app restarts; expiry → OTP re-auth | better-auth Expo session mechanics verified (Pattern 2) — SecureStore-cached session, 90-day sliding window (D-02 from Phase 2), no refresh endpoint. See "Common Pitfalls" Pitfall 1 for the force-quit UAT method. |
| AUTH-04 | Visitor can log out | New icon-only logout control on Festivals header; `authClient.signOut()` — see Pattern 4 for the robustness backstop (offline signOut must still clear local session). |
| AUTH-05 | OTP errors/edge cases (wrong/expired code, resend, change email, rate-limited) shown clearly and localized | `verify.tsx`'s existing `mapOtpError()` already distinguishes `OTP_EXPIRED`/`INVALID_OTP`/`TOO_MANY_ATTEMPTS`/429 (PITFALLS.md Pitfall 9) — UI-SPEC unifies the copy into one error-box state; `resendStrategy: 'reuse'` is already server-configured (Phase 2). |
| IDN-01 | First login: required unique `username` (live availability) + `displayName`; `avatar` optional | `GET /me/username-availability` + `POST /me/complete-profile` (TOCTOU→409, Phase 2) reused as-is; new client-side D-03 caps + D-01 MMKV avatar. See Pattern 3, Pattern 5. |

</phase_requirements>

## Summary

This phase is almost entirely a **client-side restyle + two focused server additions** — the hard
backend problems (OTP plugin config, session sliding-window, TOCTOU-safe username uniqueness,
`festivalId` isolation) were already solved and verified in Phases 1–3. Nothing in Phase 4 changes
`packages/contracts`' endpoint *shapes* except adding `.max()`/charset refinements to two existing
string fields (`username`, `displayName`) — both additive, non-breaking Zod tightenings.

The three genuinely new technical surfaces are: (1) a **local-only avatar pipeline**
(`expo-image-picker` → `expo-image` → `react-native-mmkv`, no network involved), (2) a **deep-link
"return-to" extension** to Phase 3's existing four-state guard (no official Expo Router pattern
exists for this — it must be hand-built as a captured-pathname-plus-replay mechanism), and (3)
**five new npm dependencies** (icons, SVG, image picker/display, MMKV + its NitroModules peer,
Google Fonts) that must be installed via `pnpm add` (not `npx expo install`, since the Windows
Metro×pnpm race means Expo/Metro must be stopped first regardless of which install command is used).

Everything else — the OTP screens, the profile-completion form, the logout button — is UI work on
top of already-live endpoints: no new backend business logic beyond the two `.max()`/regex
refinements and reading the existing endpoints from newly-styled screens.

**Primary recommendation:** Treat this phase as "wire five new dependencies + extend one guard +
restyle four screens on top of already-working backend calls" — resist the urge to touch
`packages/contracts`' endpoint *shapes*; the only contract change is tightening two existing string
fields with `.max()`/regex, which is additive and safe.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| OTP send/verify UI (auto-submit, countdown) | Browser/Client (Expo) | API/Backend (rate limit, OTP validity) | Client owns interaction/animation; server remains sole source of truth for OTP validity + rate limits (Pitfall 9, unchanged from Phase 2). |
| Session persistence across restart | Browser/Client (SecureStore via `@better-auth/expo`) | API/Backend (session `expiresIn`/`updateAge`) | Client caches/reads the session token; server owns the sliding-window expiry policy (D-02, Phase 2) — no refresh-token tier exists. |
| Deep-link capture + return-to replay | Browser/Client (Expo Router root layout) | — | Purely a client-side navigation-state concern; no server involvement, no persisted state (reversible per D-02). |
| Username live-availability check | API/Backend (`GET /me/username-availability`) | Browser/Client (debounce, idle/checking/available/taken UI) | Server is advisory-check source; client owns UX responsiveness. Existing endpoint, unchanged. |
| Username uniqueness enforcement (TOCTOU-safe) | Database/Storage (`lower(username)` unique index) | API/Backend (23505→409 mapping) | DB is the actual source of truth (Pitfall 11); API translates the constraint violation to a clean HTTP status. Existing, unchanged. |
| Name length/charset caps | API/Backend (Zod refinement, rejects at parse time) | Browser/Client (soft-cap UX, prevents most round-trips) | Server is authoritative (new this phase, D-03); client cap is UX sugar only — must not be trusted alone. |
| Avatar capture + storage | Browser/Client (`expo-image-picker` → MMKV) | — | Entirely device-local this phase (D-01) — no API/DB tier involved at all; this is the one capability with zero backend touch. |
| Logout | Browser/Client (`authClient.signOut()`) | API/Backend (better-auth session invalidation) | Client-initiated; server invalidates the session row, client clears SecureStore regardless of network result (backstop requirement). |
| Font loading (non-blocking) | Browser/Client (`expo-font` + `useFonts`) | — | Pure client asset loading; explicitly must not block the splash gate (D-04). |

## Standard Stack

### Core

| Library | Version (verified via `npm view`, 2026-08-05) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo-image-picker` | 57.0.7 | Avatar photo/camera capture (gallery + camera) | Official Expo SDK module, matches installed Expo `~57.0.9` |
| `expo-image` | 57.0.2 | Performant `<Image>` replacement, displays the local avatar URI | Official Expo SDK module, same SDK-57 lockstep versioning |
| `react-native-mmkv` | 4.3.2 | Device-local avatar-URI persistence (D-01) | Fastest key-value store for RN; requires New Architecture (already the project's default, ADR-001) |
| `react-native-nitro-modules` | required peer of `react-native-mmkv` v4 | JSI/C++ bridging for MMKV v4's Nitro Modules architecture | `react-native-mmkv` v4 migrated off the old JSI-direct bridge onto NitroModules — this peer is mandatory, not optional, per the package's own `peerDependencies` (`"react-native-nitro-modules": "*"`, confirmed via `npm view`) |
| `lucide-react-native` | 1.28.0 | Icon set (back arrow, mail, timer, check, x, image, camera, log-out, etc.) | UI-SPEC-mandated icon library; peer-compatible with the resolved `react-native-svg` (`^12‖13‖14‖15.0.0`, confirmed via `npm view lucide-react-native peerDependencies`) |
| `react-native-svg` | 15.15.5 | SVG rendering peer dep for `lucide-react-native` | Standard RN SVG renderer, Fabric/New-Arch-compatible since v13+ |
| `expo-font` | 57.0.1 | Async, non-blocking custom font loading | Official Expo SDK module for the `@expo-google-fonts/*` packages' `useFonts` hook |
| `@expo-google-fonts/outfit` | latest (0.4.3 family, confirmed OK via legitimacy check) | Wordmark/H1 display font | OFL-licensed, matches `docs/concept/03-design-system.md` §8 font choice |
| `@expo-google-fonts/plus-jakarta-sans` | same family | Body/UI/button font | Same source, verified OK |
| `@expo-google-fonts/jetbrains-mono` | same family | OTP digits + countdown timer font | Same source, verified OK |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | All backend/contract/session/i18n tooling already installed in Phases 1–3 | This phase adds zero new backend packages — `drizzle-zod`, `zod`, `@ts-rest/*`, `@lingui/*` are all already present |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-native-mmkv` | `expo-secure-store` (already installed, used for the session token) | SecureStore has a documented ~2KB-per-value practical ceiling (noted in ROADMAP MEDIUM-research flags) and is designed for secrets, not media URIs; MMKV is purpose-built for fast key-value UI state. Avatar URI is not a secret — SecureStore's OS-keychain encryption overhead buys nothing here. |
| `react-native-mmkv` | `@react-native-async-storage/async-storage` | AsyncStorage is bridge-based (slower, no New-Arch-native perf story) and PITFALLS.md explicitly flags it as the wrong choice for *session* storage (Pitfall 2) — while avatar-URI storage isn't a security concern the way session tokens are, MMKV is still the faster, already-New-Arch-aligned choice for a stack that has zero AsyncStorage usage today. |
| `lucide-react-native` | `@expo/vector-icons` (bundled with Expo, zero extra install) | UI-SPEC explicitly mandates Lucide (24px grid, stroke-width 2, doc 03 §6) — not a free choice this phase. |
| `expo-font` + `@expo-google-fonts/*` | Bundling `.ttf` files manually via `assets/fonts/` + `Font.loadAsync` | `@expo-google-fonts/*` packages are pre-packaged, versioned, and match the exact OFL-licensed families named in the design system doc — manual bundling adds maintenance burden for zero benefit here. |

**Installation:**
```bash
# Stop Expo/Metro FIRST (Windows Metro × pnpm install race — see Pitfall 6)
pnpm --filter @festipal/mobile add \
  expo-image-picker@~57.0.7 \
  expo-image@~57.0.2 \
  react-native-mmkv@^4.3.2 \
  react-native-nitro-modules \
  lucide-react-native@^1.28.0 \
  react-native-svg@~15.15.5 \
  expo-font@~57.0.1 \
  @expo-google-fonts/outfit \
  @expo-google-fonts/plus-jakarta-sans \
  @expo-google-fonts/jetbrains-mono
```
Prefer `npx expo install <pkg>` per-package where available (it resolves the SDK-57-correct version
automatically) over hand-pinning versions; the versions above are the confirmed-current values as of
this research and should be treated as a floor, not a hard pin, unless the executor's `expo install`
resolves something different (SDK-version-locked packages like `expo-image-picker`/`expo-image`/
`expo-font` always resolve to the SDK's matching minor — do not fight that resolution).

**Version verification:** All versions above were confirmed live via `npm view <pkg> version` and
`npm view <pkg> peerDependencies` on 2026-08-05 — not from training-data memory. `react-native-mmkv`'s
NitroModules peer requirement and New-Architecture-only status (RN ≥0.76, this project runs 0.86.2)
were confirmed via the package's own README.

## Package Legitimacy Audit

| Package | Registry | Weekly Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-------------------|-------------|---------|-------------|
| `react-native-svg` | npm | 5.9M | github.com/software-mansion/react-native-svg | OK | Approved |
| `react-native-mmkv` | npm | 1.47M | github.com/mrousavy/react-native-mmkv | OK | Approved |
| `@expo-google-fonts/outfit` | npm | 68K | github.com/expo/google-fonts | OK | Approved |
| `@expo-google-fonts/plus-jakarta-sans` | npm | 114K | github.com/expo/google-fonts | OK | Approved |
| `@expo-google-fonts/jetbrains-mono` | npm | 166K | github.com/expo/google-fonts | OK | Approved |
| `lucide-react-native` | npm | 1.69M | github.com/lucide-icons/lucide | SUS (`too-new`) | Approved — see note below |
| `expo-image-picker` | npm | 3.55M | github.com/expo/expo | SUS (`too-new`) | Approved — see note below |
| `expo-image` | npm | 3.94M | github.com/expo/expo | SUS (`too-new`) | Approved — see note below |
| `expo-font` | npm | 7.64M | github.com/expo/expo | SUS (`too-new`) | Approved — see note below |
| `react-native-nitro-modules` | npm | 1.69M | github.com/mrousavy/nitro | SUS (`too-new`) | Approved — see note below |

**Packages removed due to `[SLOP]` verdict:** none.

**Packages flagged as suspicious `[SUS]`:** `lucide-react-native`, `expo-image-picker`, `expo-image`,
`expo-font`, `react-native-nitro-modules` — all five flagged **solely** on the `too-new` signal
(their most-recent-version *publish* timestamp is within the tool's freshness window), **not** on
low downloads, missing repo, or a postinstall script. All five are official-monorepo packages
(`expo/expo`, `mrousavy/*`) with weekly downloads in the 1.4M–7.6M range — this is the expected
republish cadence for SDK-lockstep packages (a new `expo-font`/`expo-image-picker`/`expo-image`
version ships with every Expo SDK point release) and a Nitro-Modules-ecosystem package
(`react-native-nitro-modules`) that ships frequently alongside `react-native-mmkv`. This reads as a
false positive of the `too-new` heuristic against actively-maintained monorepo packages, not a
slopsquat/hallucination signal — but per the Package Legitimacy Protocol, the verdict is honored as
written: **the planner must add a `checkpoint:human-verify` task before the install step**,
presenting this reasoning for a human to confirm rather than silently downgrading the verdict.

## Architecture Patterns

### System Architecture Diagram

```
                     ┌─────────────────────────────────────────────┐
                     │         app/_layout.tsx (root guard)         │
                     │  1. capture initial deep-link URL (NEW)      │
                     │  2. resolve locale + session + GET /me       │
                     │  3. branch on 4-state AuthState               │
                     └───────────────┬───────────────────────────────┘
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
 unauthenticated          authenticated-no-profile            authenticated
       │                             │                             │
       ▼                             ▼                             ▼
 (auth)/index (Welcome)     (profile-setup)/               festivals /
   → (auth)/email             complete-profile               (festival)
   → (auth)/verify (OTP)      • MMKV avatar (local)         → replay captured
   • authClient.emailOtp.*    • GET /me/username-            deep-link href
   • authClient.signIn.        availability (debounced)      (NEW, once only)
     emailOtp                  • POST /me/complete-profile
   ↓ success                   ↓ 200 → refreshAuthState()
   session cookie in            (re-triggers GET /me,
   SecureStore                  guard re-resolves)
                                     │
                                     ▼
                          captured deep-link href (if any)
                          replayed via router.replace() ONCE
                          the guard reaches 'authenticated'
```

Data flow for the primary new path (avatar): `expo-image-picker` (permission → pick/capture) →
local `file://` URI → `expo-image` renders it in the avatar tile → on confirm, the URI string
(not the image bytes) is written to MMKV keyed by `accountId` → next cold start, the guard's
profile-setup/(app) screens read the same MMKV key to redisplay it. No network request is ever
made for the avatar.

### Recommended Project Structure

```
apps/mobile/
├── app/
│   ├── _layout.tsx                      # extend: capture pendingDestination (deep-link)
│   ├── (auth)/
│   │   ├── _layout.tsx                  # unchanged (plain Stack)
│   │   ├── index.tsx                    # NEW CONTENT: becomes Welcome screen
│   │   ├── email.tsx                    # NEW FILE: email-entry logic moved here
│   │   └── verify.tsx                   # restyled: 6-box display, auto-submit, countdown
│   ├── (profile-setup)/
│   │   └── complete-profile.tsx         # restyled: username live-check, avatar picker, caps
│   └── festivals/
│       └── index.tsx                    # add: logout icon-button, top-right of header
├── lib/
│   ├── auth-client.ts                   # unchanged
│   ├── api-client.ts                    # unchanged
│   ├── avatar-storage.ts                # NEW: MMKV wrapper, keyed per accountId
│   ├── fonts.ts                         # NEW: useFonts() wrapper + font-family constants
│   └── pending-destination.ts           # NEW: deep-link capture/consume helpers
├── components/                          # NEW (ADR-022 custom primitives on packages/ui tokens)
│   ├── OtpBoxes.tsx                     # 6-box display driven by 1 hidden TextInput
│   ├── AvatarTile.tsx                   # initials fallback ↔ local photo
│   └── ResendCountdown.tsx              # 60s countdown → tappable link
└── ...
packages/
├── ui/src/tokens.ts                     # REPLACE placeholder values with UI-SPEC brand tokens
├── db/src/schema/visitor-profile.ts     # ADD .max()/regex to username/displayName overrides
└── contracts/src/schemas.ts             # composed caps flow through automatically (no change needed here — the drizzle-zod base IS the source)
```

### Pattern 1: OTP 6-box display driven by one hidden TextInput

**What:** Render six fixed-width `View` boxes reading off a single real `TextInput`'s current
value; the `TextInput` itself is captured with `maxLength=6`, zero/near-zero opacity, and
positioned to overlay the boxes (or simply kept off-screen with a manual focus trigger on box tap).
**When to use:** Any OTP entry UI that must visually match a 6-box mockup while keeping exactly one
real text-input element (this codebase's `verify.tsx` already uses a single real `TextInput` for
the overflow-impossible reasoning from Phase 3 — this pattern is additive, not a replacement of that
reasoning).
**Example (community-established pattern, not from an official doc — [ASSUMED], standard technique)**:
```tsx
// components/OtpBoxes.tsx
import { Pressable, TextInput, View, Text } from 'react-native';
import { useRef, useState } from 'react';

const OTP_LENGTH = 6;

export function OtpBoxes({ value, onChangeText, onComplete, disabled }: {
  value: string;
  onChangeText: (v: string) => void;
  onComplete: (code: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<TextInput>(null);

  function handleChange(text: string) {
    const digits = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    onChangeText(digits);
    if (digits.length === OTP_LENGTH) onComplete(digits);
  }

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <View style={{ flexDirection: 'row', gap: 9 }}>
        {Array.from({ length: OTP_LENGTH }).map((_, i) => (
          <View key={i} style={boxStyle(value.length === i)}>
            <Text>{value[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        editable={!disabled}
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
        autoFocus
      />
    </Pressable>
  );
}
```
Auto-submit on completion: call the verify mutation from `onComplete`, not from a button `onPress`
(UI-SPEC Scope note #5 — no submit button exists in the mockup).

### Pattern 2: better-auth Expo session persistence — verified mechanics

**What:** `@better-auth/expo`'s `expoClient({ storage: SecureStore })` caches session data in
SecureStore. `[CITED: better-auth.com/docs/integrations/expo]` — "On native, the session data will
be cached in SecureStore, which allows you to remove the need for a loading spinner when the app is
reloaded." This is already correctly wired in `apps/mobile/lib/auth-client.ts` (Phase 3) — nothing
to change for AUTH-03 beyond verifying it.
**When to use:** Already in place; Phase 4's only job is the **verification method** (see Pitfall 1
below), not new wiring.
**Trusted origins:** `[CITED: better-auth.com/docs/integrations/expo]` — "you need to add your
app's scheme to the `trustedOrigins` list"; already done in
`apps/api/src/auth/auth.instance.ts` (`'festipal://'`, `'exp://'`, `'exp://**'`) per Phase 2/3.

### Pattern 3: Username live-availability + TOCTOU-safe completion (already implemented, unchanged)

**What:** `GET /me/username-availability?username=X` is a debounced advisory `SELECT`; `POST
/me/complete-profile` is the actual source of truth, catching Postgres `23505` and returning `409`.
**Verified in this session:** `apps/api/src/me/me.controller.ts:39-46` and
`apps/api/src/me/me.service.ts:63-71` (read this session — quoted above in "Existing Code
Insights"). `[VERIFIED: apps/api/src/me/me.service.ts:63-71]` —
```ts
async checkUsernameAvailability(username: string): Promise<boolean> {
  const rows = await this.db
    .select({ accountId: visitorProfile.accountId })
    .from(visitorProfile)
    .where(sql`lower(${visitorProfile.username}) = lower(${username})`)
    .limit(1);
  return rows.length === 0;
}
```
**When to use:** No change needed to this endpoint pair — the mobile client debounces its own calls
to `usernameAvailability` (e.g. 300–400ms after the user stops typing) and shows
idle/checking/available/taken states per the Copywriting Contract; on `completeProfile`'s `409`,
regenerate the suggestion (Pattern 5) and show the "taken" helper text.

### Pattern 4: Deep-link capture + return-to replay (no official Expo Router pattern — synthesized)

**What:** Expo Router's `Stack.Protected` guard mechanism has **no built-in return-to support**.
`[CITED: docs.expo.dev/router/advanced/protected/]` confirms only that an unauthenticated
navigation to a protected route "redirects to the anchor route" with no path-preservation
mechanism documented. `[CITED: docs.expo.dev/router/advanced/authentication/]` and
`[CITED: docs.expo.dev/router/advanced/authentication-rewrites/]` were also checked and contain no
capture/replay pattern — the closest they get is `router.replace('/')` (home, not the original
destination) after login.
**Recommended pattern (synthesized, [ASSUMED] — no authoritative source):** Use
`Linking.useLinkingURL()` `[CITED: docs.expo.dev/versions/latest/sdk/linking/`, confirmed as the
current, non-deprecated hook (the older `useURL()` is deprecated in its favor)] to read the
URL that launched/is currently targeting the app, parse its pathname via `expo-router`'s
`Linking.parse()`, and store it as short-lived in-memory state (module-level, mirroring the
existing `refreshAuthState()` singleton-callback pattern in `app/_layout.tsx` — no MMKV/SecureStore
persistence needed, this is a single-session navigation intent, not durable state). Only consume
(and clear) the captured destination once `AuthState.status === 'authenticated'` is reached — NOT
at `'authenticated-no-profile'`, so it survives the profile-completion detour (D-02's explicit
requirement).
```tsx
// lib/pending-destination.ts (sketch — [ASSUMED] pattern, verify hook name against
// the installed expo-linking version at implementation time)
let pendingDestination: string | null = null;

export function capturePendingDestination(href: string) {
  // Only capture protected-route hrefs, never (auth)/(profile-setup) hrefs themselves.
  pendingDestination = href;
}

export function consumePendingDestination(): string | null {
  const href = pendingDestination;
  pendingDestination = null;
  return href;
}
```
Call `capturePendingDestination` from a `useEffect` in the root layout keyed off
`Linking.useLinkingURL()`'s value, gated to fire only while `authState.status === 'unauthenticated'`
(i.e., record the attempted destination exactly once, at the moment the guard would otherwise have
silently dropped it). Call `consumePendingDestination` + `router.replace(href)` in a `useEffect`
that fires only on the transition INTO `'authenticated'`.

### Pattern 5: Username-taken suggestion generator (Claude's discretion, D-03-capped)

**What:** Deterministic-enough, low-collision suggestion that respects the 3–20-char / `a-z 0-9 _ .`
charset and is verified available before display (matching the Copywriting Contract's implicit
promise: "Try something else, like @{suggestion}" reads as an actionable, not merely plausible,
offer).
**Recommended approach:**
```ts
// lib/username-suggestion.ts
const MAX_USERNAME_LENGTH = 20; // D-03

function sanitizeBase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, MAX_USERNAME_LENGTH - 5); // reserve room for a "_1234" suffix
}

export function generateUsernameSuggestion(taken: string): string {
  const suffix = `_${Math.floor(1000 + Math.random() * 9000)}`; // "_1234", 5 chars
  const base = sanitizeBase(taken);
  return `${base}${suffix}`.slice(0, MAX_USERNAME_LENGTH);
}
```
Call `GET /me/username-availability` on the generated suggestion before rendering it; on the rare
collision, regenerate (bounded retry, e.g. 3 attempts) rather than surfacing an unavailable
suggestion. Unit-test that `generateUsernameSuggestion` never exceeds 20 chars regardless of input
length (UI-SPEC backstop, `long-text` row) — this is a pure function, easy to test without any RN
runtime.

### Anti-Patterns to Avoid

- **Building a custom `/auth/refresh` endpoint or client-side "silent refresh" attempt:** better-auth
  uses one sliding-window session token, not an OAuth-style refresh grant (PITFALLS.md Pitfall 10,
  D-02 from Phase 2). Session expiry → route back to OTP sign-in, full stop.
- **Trusting `GET /me/username-availability` as authoritative:** it is advisory only; `409` from
  `completeProfile` is the real signal (Pitfall 11, already correctly implemented — do not "fix" it
  by skipping the 409 handling client-side).
- **Uploading the avatar anywhere:** D-01 is explicit — no upload endpoint, no contract field. Do not
  add `avatar` to `completeProfileBodySchema`'s request usage even though the DB column already
  exists (nullable, stays null).
- **Gating splash-hide on font load:** D-04 requires non-blocking font loading. Do not call
  `SplashScreen.hideAsync()` conditionally on `useFonts()`'s loaded flag — the two conditions
  (locale+auth bootstrap vs. font readiness) must remain independent; text should render in a
  system-font fallback until Outfit/Plus Jakarta Sans/JetBrains Mono resolve, then re-render once
  loaded (React re-renders automatically when the `useFonts()` boolean flips, no manual remount
  needed).
- **Persisting the deep-link destination to MMKV/SecureStore:** D-02's own reversibility note says
  "no persisted or contract state" — keep it in-memory (module-level `let`, cleared on consumption or
  app restart); a stale deep-link intent surviving a cold restart into an unrelated session is a
  worse bug than losing it on kill.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OTP code validity / expiry / rate-limit | A custom expiry timer or client-side rate-limit counter | better-auth's `emailOTP` plugin (`otpLength`, `expiresIn`, built-in rate limiter) — already configured in `apps/api/src/auth/auth.instance.ts` | Server is the only trustworthy clock; a client-side countdown for the *resend cooldown* (UI-SPEC's 60s) is a separate, purely cosmetic timer — do not confuse it with OTP expiry itself |
| Session refresh / token rotation | A `/auth/refresh` endpoint or manual token-swap | better-auth's sliding session (`expiresIn`/`updateAge`) | PITFALLS.md Pitfall 10 — this is a standing, explicit prohibition for this codebase |
| Username uniqueness | An app-layer `SELECT`-then-`INSERT` check as the only guard | The existing `lower(username)` Postgres unique index + `23505`→409 mapping | TOCTOU-proof at the DB layer; already correctly implemented (Pitfall 11) |
| Cross-tab/cross-device avatar sync | A DIY sync protocol over the local MMKV value | Nothing this phase — D-01 explicitly defers this to a future server-upload phase | Building partial sync now creates dead code and a false sense of completeness for a feature explicitly scoped out |
| Font-loading gate logic | A second splash-blocking mechanism keyed off `useFonts()` | The existing single splash-gate (locale + auth state) in `app/_layout.tsx`, left untouched; fonts load independently in the background | D-04 explicitly forbids blocking on fonts — two independent gates would be strictly more code for a worse UX |

**Key insight:** Every "hard" problem in this phase (OTP mechanics, session persistence, username
race conditions) was already solved correctly in Phases 1–3 by reusing better-auth/Postgres
primitives instead of hand-rolling. The only genuinely new hand-written logic this phase introduces
is UI-tier (deep-link capture, suggestion generator, MMKV wrapper) — keep it that way; resist adding
new backend logic beyond the two `.max()`/regex refinements.

## Common Pitfalls

### Pitfall 1: "Session persists" claims that were never tested past hot-reload

**What goes wrong:** A developer verifies OTP login works, sees the festivals screen, and calls
AUTH-03 done — without ever fully killing the app process. Expo's Fast Refresh/hot-reload preserves
JS state that a real cold start does not; SecureStore reads are async and any race in the guard's
resolution (e.g. `sessionPending` never settling, or `GET /me` timing out silently) is invisible
under hot-reload but fatal on a genuine process kill.
**Why it happens:** Hot-reload is the default dev loop; force-quitting an app repeatedly during
development is friction developers naturally avoid.
**How to avoid:** The UAT for AUTH-03 MUST be: (1) log in via real OTP, (2) **force-quit the app
process** (swipe-away on Android/iOS task switcher, not just backgrounding), (3) relaunch from the
home-screen icon (not from the dev menu / Metro reload), (4) confirm the app lands directly on the
festivals screen with no OTP re-prompt. Repeat once after `expo run:android`/`expo run:ios` a fresh
build, since a stale Metro bundle can mask storage regressions. This exact method is already
documented as the required UAT method for this app in `PITFALLS.md` Pitfall 2 and was already
correctly performed in Phase 3 (STATE.md: "full core-value path... kill-and-relaunch persists...
signed off on REAL ANDROID").
**Warning signs:** "Works after Fast Refresh" reports in place of "works after force-quit" reports;
any UAT note that doesn't mention killing the app process explicitly.

### Pitfall 2: Deep-link "return-to" silently regresses to Home because the capture happens too late

**What goes wrong:** If the pending-destination capture (Pattern 4) is wired inside a `useEffect`
that only fires after `authState.status === 'unauthenticated'` has already been set (rather than
capturing the raw incoming URL before/alongside that state transition), a deep link opened while the
app is cold (not yet running) can race the guard's first render and be lost before capture ever
runs. `Linking.useLinkingURL()`'s own behavior — "always returns the initial URL immediately on
reload" `[CITED: docs.expo.dev/versions/latest/sdk/linking/]` — is what makes this safe if wired at
the very top of the root layout's effect chain, but it is easy to place the capture effect after
other effects (locale bootstrap, session resolution) and introduce exactly this race.
**Why it happens:** No official Expo Router pattern exists for this (confirmed via direct doc
fetch — see Pattern 4); the implementation is genuinely novel for this codebase, so ordering bugs
are the most likely failure mode, not a copy-paste mistake.
**How to avoid:** Capture the initial URL as the very first effect in `RootLayout`, independent of
and not gated behind the locale/session bootstrap effects. Write an explicit manual test: force-quit
the app, open a deep link to a protected-group route (e.g. `festipal://festivals`) from a cold
start while logged out, complete OTP + profile-completion, and confirm landing on `festivals`
rather than a fallback Home-equivalent.
**Warning signs:** The return-to only works when the app was already backgrounded (warm start), not
from a fully cold, deep-linked launch.

### Pitfall 3: `react-native-mmkv` v4 silently fails to initialize without its NitroModules peer, or under Expo Go

**What goes wrong:** `react-native-mmkv` v4 requires `react-native-nitro-modules` as a mandatory
peer dependency (`[CITED: raw README, github.com/mrousavy/react-native-mmkv]` — confirmed via
`npm view react-native-mmkv peerDependencies` returning
`{ 'react-native-nitro-modules': '*' }`) and requires the New Architecture + a native rebuild
(`npx expo prebuild`) — it cannot run inside Expo Go. Installing only `react-native-mmkv` without
its peer, or attempting to test the avatar feature in Expo Go instead of the project's existing dev
builds (`expo run:android`/`expo run:ios`, per Phase 3 D-09), will throw a native-module-not-found
error at runtime, not at install time.
**Why it happens:** `pnpm add react-native-mmkv` alone does not error on a missing peer by default;
the failure only surfaces when `createMMKV()` is first called at runtime.
**How to avoid:** Install both packages together in the same command (see Installation block
above); this project's dev workflow already uses `expo run:android`/`run:ios` (Phase 3, not Expo
Go), so no dev-client change is needed — just confirm a fresh native prebuild picks up MMKV's
autolinking after `pnpm add`.
**Warning signs:** `TurboModuleRegistry.getEnforcing(...): 'MMKV' could not be found` or a Nitro
Modules-specific native error at first `createMMKV()` call.

### Pitfall 4: The username/displayName server-side cap is added to the wrong layer, or breaks the existing `.extend()` type-inference workaround

**What goes wrong:** `packages/db/src/schema/visitor-profile.ts` already has a documented,
non-obvious `.extend()` override on `visitorProfileInsertSchema`/`visitorProfileSelectSchema` to
work around a drizzle-zod `text()`-column type-inference bug (verbatim comment, read this session,
`[VERIFIED: packages/db/src/schema/visitor-profile.ts:45-63]`: *"Without these, drizzle-zod's TS-level
type inference collapses every `text()` column to `unknown`... Keep this list in sync with any new
`text()` column added to this table."*). Adding `.max()`/regex constraints via `createInsertSchema`'s
second-argument refinement callback (the pattern shown in the general drizzle-zod web search result)
would re-trigger the exact same broken inference the file's own comment warns about, since that
refinement path uses the same `GetZodType` internals. The constraints must be added to the
**existing** `.extend({...})` call's `z.string()` values, not via a second, separate refinement
mechanism.
**Why it happens:** Generic drizzle-zod tutorials (and the web search performed for this research)
show `createInsertSchema(table, { col: (s) => s.max(100) })` as the idiomatic pattern — but this
codebase already diverged from that idiom for a documented, verified reason specific to this table.
**How to avoid:** Edit the existing `.extend()` block:
```ts
// packages/db/src/schema/visitor-profile.ts — extend existing z.string() values, don't add a new refinement path
export const visitorProfileInsertSchema = createInsertSchema(visitorProfile).extend({
  accountId: z.string(),
  username: z.string().min(3).max(20).regex(/^[a-z0-9_.]+$/, 'lowercase letters, numbers, _ and . only'),
  displayName: z.string().min(1).max(40),
  avatar: z.string().nullable().optional(),
});
```
Apply the matching `.min()`/`.max()`/regex to `visitorProfileSelectSchema` too if the select schema
is ever used to validate outbound data (currently it composes `visitorProfilePublicSchema` via
`.pick()` in `packages/contracts/src/schemas.ts` — the insert-side cap is the one that actually
gates writes and is the higher-priority half of D-03).
**Warning signs:** `CompleteProfileBody`/`VisitorProfilePublic` types in `@festipal/contracts`
regress back to accepting `unknown` for these fields (the exact symptom the original comment warns
about) — a fast typecheck-level signal that the wrong mechanism was used.

### Pitfall 5: Splash restyle (D-04) accidentally reintroduces a font-load block via a naive `useFonts()` gate

**What goes wrong:** The natural-looking implementation — `if (!fontsLoaded) return null` alongside
the existing `if (!bootstrapped) return null` in `app/_layout.tsx` — silently violates D-04's
non-blocking requirement (nothing in D-04's own text permits this) and re-couples two independent
concerns the phase explicitly wants decoupled (locale/auth bootstrap vs. font readiness).
**Why it happens:** It's the same `if (!ready) return null` idiom already used for the existing
splash gate, so it's an easy copy-paste extension that looks consistent with the surrounding code.
**How to avoid:** `useFonts()`'s loaded boolean must gate **which font family a `StyleSheet` uses**
(e.g. `fontFamily: fontsLoaded ? 'Outfit-Bold' : undefined` falling back to the RN default system
font), never the splash `hideAsync()`/`return null` decision. Keep `bootstrapped` (locale + auth
state) as the sole splash gate, unchanged from Phase 3.
**Warning signs:** The splash hangs noticeably longer than Phase 3's baseline on a cold, cache-cleared
install (font download/compile time now blocking first paint).

### Pitfall 6: Windows Metro × pnpm install race recurs when adding this phase's 5 new dependencies

**What goes wrong:** Per the project's own prior incident (STATE.md, Phase 3: *"the pnpm reconcile
then hung on Windows due to a lingering Metro file-watcher racing pnpm's atomic temp-dir import —
stopping Expo/Metro processes let `pnpm install` complete"*), running `pnpm add`/`pnpm install`
while `expo start`/`expo run:*` (and its Metro bundler) is still running on Windows produces
`ENOENT` errors on `*_tmp_*/node_modules` paths.
**Why it happens:** Metro's file watcher holds locks/handles on `node_modules` that conflict with
pnpm's atomic-rename install strategy — a Windows-filesystem-specific issue, already diagnosed and
documented by this project.
**How to avoid:** Stop every running Expo/Metro process (and any lingering `expo run:android`/
`expo run:ios` watcher) before running the Installation block above. This is a recurrence risk
specifically because this phase adds five new native-module dependencies (several requiring a
prebuild) in one phase — more surface area than any single-package Phase 3 install.
**Warning signs:** `ENOENT` on a `*_tmp_*` path during `pnpm add`/`pnpm install` on the Windows dev
machine.

## Code Examples

### `GET /me/username-availability` + `POST /me/complete-profile` client wiring (existing endpoints, contract shape unchanged)

```ts
// Source: packages/contracts/src/router.ts (read this session, lines 45-56) — verbatim shape,
// no change needed to these two route definitions this phase.
usernameAvailability: {
  method: 'GET',
  path: '/me/username-availability',
  query: z.object({ username: z.string() }),
  responses: { 200: usernameAvailabilitySchema },
},
completeProfile: {
  method: 'POST',
  path: '/me/complete-profile',
  body: completeProfileBodySchema, // gains .max()/regex via Pitfall 4's fix — body SHAPE (fields) unchanged
  responses: { 200: visitorProfilePublicSchema, 409: errorSchema },
},
```

### MMKV avatar storage, keyed per account (D-01, Claude's discretion on shape)

```ts
// lib/avatar-storage.ts — [ASSUMED] shape, standard MMKV usage per Pattern/README above
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'festipal-avatar' });

function avatarKey(accountId: string): string {
  return `avatar-uri:${accountId}`;
}

export function saveLocalAvatarUri(accountId: string, uri: string): void {
  storage.set(avatarKey(accountId), uri);
}

export function getLocalAvatarUri(accountId: string): string | undefined {
  return storage.getString(avatarKey(accountId));
}

export function clearLocalAvatarUri(accountId: string): void {
  storage.delete(avatarKey(accountId));
}
```
Call `clearLocalAvatarUri` from the logout flow if the product intent is "avatar is tied to the
account, not the device slot" — otherwise leave it (next login on the same device, same account,
restores the same photo, which matches D-01's "survives restart on the same device" framing).
Not explicitly specified by CONTEXT.md — flag as an open question for plan review (see below).

## State of the Art

| Old Approach (Phase 3) | Current Approach (Phase 4) | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single OTP `TextInput`, visibly styled as a normal input | Same single `TextInput`, now visually hidden and driving 6 separate box `View`s | This phase (UI-SPEC Scope note #4) | Visual only — Phase 3's "overflow impossible" reasoning is fully preserved, not replaced |
| Verify button + "Verifying…" label | No button — auto-submits on the 6th digit | This phase (UI-SPEC Scope note #5) | Removes 2 Lingui strings (`Verify`/`Verifying…`), adds a muted-boxes loading state instead |
| `Stack.Screen options={{ title: t\`...\` }}` as visible native header | `headerShown: false` + in-body `<Text>` H1, native title kept only as a11y label | This phase (UI-SPEC Scope note #7) | Every restyled screen needs a `Stack.Screen options={{ headerShown: false, title: t\`...\` }}` plus a manually-rendered H1 |
| Placeholder username auto-generated (`visitor_${random}`), no user input | Real form: user-typed username with live-check, real displayName input | This phase (IDN-01) | `(profile-setup)/complete-profile.tsx` is functionally rewritten, not just restyled |
| `packages/ui/src/tokens.ts` placeholder values (`#4f46e5` etc.) | Real brand tokens from `docs/concept/designs/auth/source/festipal-tokens.css` | This phase (UI-SPEC binding) | Every existing screen that imports `tokens` (festivals list, etc.) inherits the new palette even though those screens aren't in this phase's explicit scope — verify no visual regression on Festivals list |

**Deprecated/outdated:**
- The Phase 3 two-message OTP error split ("didn't work" vs. "expired" as separate strings) is
  superseded by UI-SPEC's single unified error-box copy ("That code is wrong or has expired.") —
  `mapOtpError()`'s *logic* (distinguishing error codes) stays, but its *return strings* for the
  wrong/expired branches should converge to the same unified copy per the Copywriting Contract.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The deep-link capture/replay pattern (Pattern 4) — no official Expo Router API exists for this; the recommended implementation is synthesized from `Linking.useLinkingURL()` + a module-level in-memory store | Pattern 4, Pitfall 2 | If `Linking.useLinkingURL()`'s actual behavior differs from the cited doc summary (e.g. it doesn't fire reliably on iOS cold start from a killed state), the return-to feature could silently degrade to "always lands on Home" — verify with the exact cold-start-deep-link manual test in Pitfall 2 before considering D-02 done |
| A2 | MMKV avatar key scheme (`avatar-uri:${accountId}`) and whether to clear it on logout | Code Examples | Low risk (fully reversible, presentation-only) but affects whether "logout then log back in as someone else on the same device" briefly shows the wrong person's photo before the profile screen re-renders — worth a planner decision, not a blocking risk |
| A3 | Username suggestion generator's exact collision-retry bound (proposed: 3 attempts) | Pattern 5 | Low risk — worst case is a very rare fallback to a longer random suffix; does not affect correctness of the 20-char cap, which is the actual UI-SPEC backstop requirement |
| A4 | `react-native-mmkv`'s New-Architecture-only requirement is compatible with this project (RN 0.86.2, New Arch per ADR-001) | Standard Stack | Very low risk — explicitly confirmed compatible (v4 requires RN ≥0.76, project is on 0.86.2 with New Arch as the documented default), flagged only because the specific compatibility claim came from a web search of the README rather than a direct `npm view` engines-field check |
| A5 | `lucide-react-native`/`expo-image-picker`/`expo-image`/`expo-font`/`react-native-nitro-modules`'s `SUS`/`too-new` legitimacy verdicts are false positives (see Package Legitimacy Audit) | Package Legitimacy Audit | If wrong (i.e. one of these really is a supply-chain risk despite the reasoning), the impact is a compromised npm dependency in a mobile app shipping to real festival visitors — this is exactly why the protocol's `checkpoint:human-verify` requirement is honored literally rather than downgraded, despite the reasoning above |

## Open Questions

1. **Should the local avatar (MMKV) be cleared on logout, or persist per-device across different
   accounts logging in on the same phone?**
   - What we know: D-01 says "survives restart on the same device," CONTEXT.md doesn't address the
     logout-then-different-account case explicitly.
   - What's unclear: Whether a second visitor logging into the same physical device (e.g. a shared
     family phone) would briefly see the first visitor's avatar before their own profile loads.
   - Recommendation: Key MMKV strictly by `accountId` (Code Examples above) so this is a non-issue
     regardless of the logout decision — the wrong account's photo is never shown because the key
     itself is account-scoped, not device-scoped. Surface this reasoning at plan review so the
     planner can confirm rather than re-derive it.

2. **Exact resend-cooldown starting value confirmation.**
   - What we know: UI-SPEC Scope note #6 already resolved this to 60 seconds as "Claude's technical
     default," explicitly noting the mockup only shows a mid-countdown snapshot.
   - What's unclear: Nothing further — this is resolved, listed here only so the planner doesn't
     re-open it as if it were still open.
   - Recommendation: Treat as locked at 60s per UI-SPEC; no further research needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Expo SDK 57 toolchain (`expo-image-picker`/`expo-image`/`expo-font`) | Avatar picker, splash/font restyle | ✓ | `expo ~57.0.9` (installed, confirmed via `apps/mobile/package.json`) | — |
| React Native New Architecture | `react-native-mmkv` v4 requirement | ✓ | RN `0.86.2` (ADR-001 default) | — |
| Windows dev machine + Metro/pnpm | Installing 5 new native-module deps | ✓ (with the documented stop-Metro-first workaround) | — | Stop Expo/Metro before `pnpm add` (Pitfall 6) |
| Real Android device (dev build, not Expo Go) | Force-quit session-persistence UAT, MMKV native module | ✓ | Confirmed working per Phase 3 STATE.md sign-off | — |
| Real iPhone (dev build) | Same as above, iOS parity | ✗ (deferred, Phase 3 STATE.md: "iOS toolchain not set up") | — | Android-only UAT this phase too, per the same user-approved Phase 3 deviation — flag as a carried-forward gap, not a new one |
| Mailpit (docker-compose, local dev) | OTP code delivery during manual testing | ✓ | Established in Phase 3 | — |

**Missing dependencies with no fallback:** none blocking.

**Missing dependencies with fallback:** iOS on-device verification — already an accepted, carried-forward Phase 3 deferral (STATE.md); Phase 4's force-quit UAT and deep-link UAT should be performed on the real Android device, with iOS deferred alongside the existing item.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (backend: `apps/api`, already configured, `vitest run`); **no test framework configured yet in `apps/mobile`** |
| Config file | `apps/api/vitest.config.ts` (existing); `apps/mobile` — none, Wave 0 gap |
| Quick run command | `pnpm --filter @festipal/api test` (existing suite: `apps/api/test/*.spec.ts`) |
| Full suite command | `pnpm test` (turbo, workspace-wide) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | OTP send/verify round-trip creates a session | integration (existing, already covers this) | `pnpm --filter @festipal/api test -- me-endpoints` | ✅ (`apps/api/test/me-endpoints.spec.ts`) |
| AUTH-02 | Returning visitor with existing profile skips completion | integration + manual | existing backend coverage via `getMe`; UI branch is manual-only (no RN test runner yet) | ✅ backend / ❌ mobile, Wave 0 |
| AUTH-03 | Session survives force-quit + relaunch | manual-only (justified — no automated tool exercises real process kill on-device) | N/A — see Pitfall 1's exact UAT steps | manual only, by design |
| AUTH-04 | Logout clears session, reaches Welcome, incl. offline-failure backstop | manual + unit (suggestion: extract signOut-wrapper as a testable pure function returning a discriminated result) | manual UAT; optional unit test if the signOut wrapper is factored out | ❌ Wave 0 (new wrapper + test), manual UAT primary |
| AUTH-05 | Wrong/expired/rate-limited/resend OTP errors map to correct copy | unit (pure `mapOtpError()` function, already exists) | New: `apps/mobile` needs a test runner to unit-test `mapOtpError()` in isolation | ❌ Wave 0 |
| IDN-01 | Username caps (3-20, charset) + displayName cap (≤40) rejected server-side | integration (extend existing `username-race.spec.ts` pattern) | `pnpm --filter @festipal/api test -- username-race` (extend) | ✅ file exists, extend it — new cases needed |
| IDN-01 | Username suggestion generator caps output ≤20 chars | unit (pure function, Pattern 5) | New: `apps/mobile` needs a test runner | ❌ Wave 0 |
| SC-5 (deep-link) | Deep link to protected route while logged out redirects, then resumes after login+profile-completion | manual-only (navigation-state, cold-start-dependent — see Pitfall 2's exact steps) | N/A | manual only, by design |

### Sampling Rate

- **Per task commit:** `pnpm --filter @festipal/api test` (fast, existing suite) for any backend
  (`packages/db`/`apps/api`) change; manual smoke for any screen restyle.
- **Per wave merge:** `pnpm test` (full turbo suite) + the four manual UAT scripts (force-quit
  session, deep-link cold-start, OTP edge cases, logout-offline).
- **Phase gate:** Full suite green + all four manual UATs signed off before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] `apps/mobile` has **no test runner configured at all** (confirmed — no `vitest.config.*`/
      `jest.config.*` found in `apps/mobile`, unlike `apps/api`). Two pure-function units this phase
      need automated coverage: `mapOtpError()` (already exists, currently untested) and
      `generateUsernameSuggestion()` (new, Pattern 5). Recommend adding a minimal Vitest config to
      `apps/mobile` scoped to pure-`lib/` function tests only (no RN component rendering / no
      `jest-expo` needed for this phase's scope) — install: `pnpm --filter @festipal/mobile add -D
      vitest`, config mirroring `apps/api/vitest.config.ts`'s `environment: 'node'` shape.
- [ ] `apps/api/test/username-race.spec.ts` — extend with new cases: username too short (<3),
      too long (>20), invalid charset (uppercase/space/special char), displayName >40 chars — all
      should reject with a 400-level Zod validation error, not reach the DB layer.
- [ ] No automated coverage exists (and none is proposed) for AUTH-03 (force-quit) or SC-5
      (cold-start deep link) — both require real OS-level process kill/deep-link-launch behavior
      that Vitest/RN Testing Library cannot exercise; these remain **manual-only by design**,
      consistent with how Phase 3 already signed off AUTH-03-equivalent behavior manually
      (STATE.md).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | better-auth `emailOTP` plugin (passwordless, 6-digit, 5-min expiry, built-in rate limit) — unchanged this phase |
| V3 Session Management | yes | better-auth sliding session in `expo-secure-store` (OS keychain, encrypted); no refresh-token surface to attack (Pitfall 10) |
| V4 Access Control | yes | Four-state Expo Router guard (`app/_layout.tsx`) — extended for deep-link capture, but the actual authorization decision logic (which group mounts) is unchanged |
| V5 Input Validation | yes | Zod (`packages/contracts`/`packages/db` drizzle-zod bases) — this phase's `.max()`/regex additions to `username`/`displayName` are themselves a V5 hardening (closing the previously-bare-`z.string()` gap the UI-SPEC flagged) |
| V6 Cryptography | n/a this phase | No new crypto surface — session token handling unchanged, MMKV avatar storage is explicitly non-sensitive local media, not a secret |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Deep-link content leak while unauthenticated (SC-5) | Information Disclosure | Guard at the route-group layout level (already true, Phase 3); this phase's addition (return-to capture) must not weaken this — the captured destination is only *replayed*, never used to bypass the guard's own authenticated check |
| OTP brute-force / enumeration | Spoofing / DoS | Already mitigated server-side (better-auth's built-in rate limiter, PITFALLS.md Pitfall 8) — no new surface this phase |
| Session token exposure via insecure storage | Information Disclosure | Already correctly using `expo-secure-store`, not AsyncStorage/MMKV (Pitfall 2) — MMKV is scoped ONLY to the non-sensitive avatar URI this phase, never to the session token; do not let this boundary blur |
| Malformed/oversized username or displayName causing downstream layout/derivation bugs (e.g. avatar-initials logic) | Tampering | This phase's own D-03 server-side `.max()`/regex enforcement + client soft-cap — directly closes this gap |
| Supply-chain risk from 5 newly-added npm packages | Tampering (of the build pipeline) | Package Legitimacy Audit above; `checkpoint:human-verify` gate required per protocol despite the false-positive assessment |

## Sources

### Primary (HIGH confidence — read this session, verified against the live repo)
- `apps/mobile/app/_layout.tsx`, `(auth)/index.tsx`, `(auth)/verify.tsx`, `lib/auth-client.ts`,
  `lib/api-client.ts` — existing Phase 3 implementation, read in full this session
- `apps/mobile/app/(profile-setup)/complete-profile.tsx`, `apps/mobile/app/festivals/index.tsx` —
  existing screens this phase restyles/extends, read in full this session
- `apps/api/src/me/me.controller.ts`, `apps/api/src/me/me.service.ts`,
  `apps/api/src/auth/auth.instance.ts` — existing backend endpoints/config this phase reuses
  unchanged, read in full this session
- `packages/contracts/src/schemas.ts`, `packages/contracts/src/router.ts`,
  `packages/db/src/schema/visitor-profile.ts` — the exact contract/DB shapes this phase's D-03
  refinement targets, read in full this session (verbatim quotes included above)
- `packages/ui/src/tokens.ts`, `apps/mobile/app.json`, `apps/mobile/eslint.config.mjs`,
  `apps/mobile/package.json` — current placeholder tokens, app identity/scheme config, i18n lint
  rule, and installed dependency list, all read this session
- `npm view <pkg> version` / `npm view <pkg> peerDependencies` for `expo-image-picker`,
  `expo-image`, `react-native-mmkv`, `lucide-react-native`, `react-native-svg`, `expo-font` — run
  this session, 2026-08-05
- `gsd-tools query package-legitimacy check` — run this session against all 10 new packages,
  2026-08-05

### Secondary (MEDIUM confidence — official docs, WebSearch/WebFetch verified this session)
- [Expo Integration | Better Auth](https://better-auth.com/docs/integrations/expo) — SecureStore
  caching, trustedOrigins/scheme requirements
- [ImagePicker - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/) —
  fetched directly this session; permission functions, `mediaTypes` array API (current, not the
  deprecated `MediaTypeOptions` enum), config-plugin Info.plist keys
- [Protected routes - Expo Documentation](https://docs.expo.dev/router/advanced/protected/) —
  fetched directly this session; confirms NO built-in return-to mechanism exists
- [Authentication - Expo Documentation](https://docs.expo.dev/router/advanced/authentication/) —
  fetched directly this session; confirms no capture/replay guidance, notes the alternative
  modal-based-auth pattern (not used here, would be a larger architecture change)
- [Authentication (redirects) - Expo Documentation](https://docs.expo.dev/router/advanced/authentication-rewrites/) —
  fetched directly this session; confirms `router.replace('/')` (Home) is the only pattern shown,
  no return-to example
- [Linking - Expo Documentation](https://docs.expo.dev/versions/latest/sdk/linking/) — `useLinkingURL()`
  as the current (non-deprecated) hook for reading the initial/current deep-link URL
- README (`raw.githubusercontent.com/mrousavy/react-native-mmkv/main/README.md`) — fetched
  directly this session; NitroModules peer requirement, RN ≥0.76 requirement, `expo prebuild` need

### Tertiary (LOW confidence — WebSearch only, general community patterns, marked [ASSUMED] inline)
- Deep-link capture/replay implementation pattern (Pattern 4) — no authoritative source exists;
  synthesized from general Expo Router community discussion + this codebase's existing
  `refreshAuthState()` module-singleton idiom
- OTP hidden-`TextInput`-driving-boxes UI pattern (Pattern 1) — standard, widely-used RN technique,
  not from an official doc
- `drizzle-zod` general `.extend()`/refinement syntax — general web search confirmed the mechanism
  exists, but the actual applied pattern in Pitfall 4 is derived from this repo's own existing code
  comment, which takes precedence over the generic web pattern

## Metadata

**Confidence breakdown:**
- Standard stack (new npm packages): MEDIUM-HIGH — versions/peer-deps verified live via `npm view`,
  but 5 of 10 packages carry a `SUS`/`too-new` legitimacy flag requiring human sign-off (assessed as
  a false positive, reasoning documented)
- Architecture (guard extension, MMKV, avatar pipeline): MEDIUM — backend reuse is HIGH confidence
  (verified against live repo code), the deep-link return-to mechanism is LOW confidence in isolation
  (no official pattern exists) but the surrounding guard architecture it extends is well-understood
- Pitfalls: HIGH for the four repo-specific pitfalls (drizzle-zod `.extend()` trap, Windows Metro
  race, force-quit UAT method — all sourced from this project's own prior incidents/decisions in
  STATE.md/PITFALLS.md); MEDIUM for the two novel-pattern pitfalls (deep-link capture race, MMKV
  peer-dep)

**Research date:** 2026-08-05
**Valid until:** ~14 days (Expo SDK/native-module ecosystem moves fast; re-verify exact package
versions at plan-execution time via `npm view`/`npx expo install` rather than trusting this file's
pinned numbers if execution is delayed)
