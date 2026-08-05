# Phase 4: Visitor Auth & Profile Completion - Pattern Map

**Mapped:** 2026-08-04
**Files analyzed:** 14 (create/modify)
**Analogs found:** 13 / 14 (all in-repo except deep-link capture, which is synthesized per RESEARCH Pattern 4)

This phase is a **client-side restyle + two focused server tightenings** on top of already-working
Phase 1–3 backend calls. Almost every new file has a direct in-repo analog (an existing route
screen, the existing drizzle-zod `.extend()` block, the placeholder token file). The planner should
copy structure/idioms from the listed analogs and re-skin to `04-UI-SPEC.md`, not invent new
patterns. **Do not touch endpoint *shapes*** — only add `.max()`/regex to two existing string fields.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/mobile/app/(auth)/index.tsx` (→ Welcome) | route/screen | request-response | `apps/mobile/app/(auth)/index.tsx` (current email-entry) | exact (self, re-skin + split) |
| `apps/mobile/app/(auth)/email.tsx` (NEW) | route/screen | request-response | `apps/mobile/app/(auth)/index.tsx` (current email-entry logic) | exact (logic moves here) |
| `apps/mobile/app/(auth)/verify.tsx` (restyle) | route/screen | request-response | `apps/mobile/app/(auth)/verify.tsx` (self) | exact (self, re-skin) |
| `apps/mobile/app/(profile-setup)/complete-profile.tsx` (rewrite) | route/screen | CRUD (create) | `apps/mobile/app/(profile-setup)/complete-profile.tsx` (self) + `festivals/index.tsx` (query+mutation) | exact (self) + role-match |
| `apps/mobile/app/festivals/index.tsx` (add logout) | route/screen | request-response | `apps/mobile/app/festivals/index.tsx` (self) | exact (self) |
| `apps/mobile/app/_layout.tsx` (deep-link capture) | provider/guard | event-driven | `apps/mobile/app/_layout.tsx` (self, `refreshAuthState` singleton) | exact (self, extend) |
| `apps/mobile/lib/pending-destination.ts` (NEW) | utility | event-driven | `app/_layout.tsx` module-level `notifyMeMightHaveChanged` singleton | role-match (module-level `let` idiom) |
| `apps/mobile/lib/avatar-storage.ts` (NEW) | utility | file-I/O (device-local) | (none — new MMKV surface) | no analog |
| `apps/mobile/lib/fonts.ts` (NEW) | utility | (asset load) | `apps/mobile/lib/i18n.ts` (async bootstrap wrapper) | partial (init-wrapper shape) |
| `apps/mobile/lib/username-suggestion.ts` (NEW) | utility | transform (pure) | (none — pure fn, spec in RESEARCH Pattern 5) | no analog (self-contained) |
| `apps/mobile/components/OtpBoxes.tsx` (NEW) | component | request-response | `verify.tsx` single-`TextInput` sanitize idiom | role-match (extract+re-skin) |
| `apps/mobile/components/AvatarTile.tsx` (NEW) | component | file-I/O (display) | (none — new) | no analog |
| `apps/mobile/components/ResendCountdown.tsx` (NEW) | component | event-driven (timer) | `verify.tsx` `handleResend` | partial (resend call exists) |
| `packages/db/src/schema/visitor-profile.ts` (caps) | model/schema | validation | `visitor-profile.ts` existing `.extend()` block (self) | exact (self, edit in place) |
| `packages/ui/src/tokens.ts` (real values) | config | — | `packages/ui/src/tokens.ts` (self) + `festipal-tokens.css` | exact (self, replace values) |
| `packages/contracts/src/schemas.ts` | schema (compose) | validation | self (`.pick()` composition) | exact — NO edit needed (caps flow up from db) |
| `packages/i18n/src/` + mobile Lingui catalogs | config/i18n | — | existing `t()`/`<Trans>` usage across screens | exact (established) |

## Pattern Assignments

### `apps/mobile/app/(auth)/index.tsx` → Welcome + `(auth)/email.tsx` (route/screen, request-response)

**Analog:** the CURRENT `apps/mobile/app/(auth)/index.tsx` (email-entry). Per RESEARCH structure,
Welcome moves to `index.tsx` and the existing email-send logic moves verbatim to a new `email.tsx`.

**Imports + screen-header + i18n pattern to copy** (current `index.tsx` lines 1–6, 47–49):
```tsx
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Trans, useLingui } from '@lingui/react/macro';
import { authClient } from '../../lib/auth-client';
// ...
<Stack.Screen options={{ title: t`Log in` }} />   // → change to { headerShown: false, title: t`...` } + in-body H1 (UI-SPEC note #7)
```

**Core send-OTP pattern to preserve verbatim** (current `index.tsx` lines 22–45) — moves into `email.tsx`:
```tsx
async function handleSendCode() {
  const trimmedEmail = email.trim();
  setSending(true);
  setError(null);
  const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
    email: trimmedEmail,
    type: 'sign-in',
  });
  if (sendError) {
    setError(
      sendError.status === 429
        ? t`Too many attempts — try again in a few minutes.`
        : t`Can't reach the server — make sure your device is on the same Wi-Fi as the dev API.`,
    );
    setSending(false);
    return;
  }
  setSending(false);
  router.push({ pathname: '/verify', params: { email: trimmedEmail } });
}
```
Reuse `authClient` as-is (no re-wiring). Replace inline hard-coded style colors (`#4f46e5`,
`#e4e4e7`, `#dc2626`) with `packages/ui` tokens.

---

### `apps/mobile/app/(auth)/verify.tsx` (route/screen, request-response) — restyle

**Analog:** self (`verify.tsx`).

**Error-mapping pattern to KEEP (logic), converge copy** (lines 32–43): `mapOtpError()`'s branch
logic on `OTP_EXPIRED` / `TOO_MANY_ATTEMPTS`|429 / `INVALID_OTP` stays; per RESEARCH "Deprecated",
the wrong/expired *return strings* converge to one unified error-box copy (UI-SPEC Copywriting
Contract). Do not change which codes are distinguished.

**Verify round-trip to preserve** (lines 45–59) — move the trigger from button `onPress` to
`OtpBoxes` `onComplete` (auto-submit, UI-SPEC note #5; no Verify button in mockup):
```tsx
const { error: verifyError } = await authClient.signIn.emailOtp({ email, otp });
setVerifying(false);
if (verifyError) { setError(mapOtpError(verifyError)); return; }
// Success updates authClient's session atom; root guard re-resolves & routes forward — NO manual nav.
```

**Resend pattern to reuse** (lines 61–72) — wrap in the new `ResendCountdown` (60s cooldown, UI-SPEC
note #6). The single-`TextInput` sanitize idiom `value.replace(/[^0-9]/g,'').slice(0,OTP_LENGTH)`
(line 83) is the exact pattern the extracted `OtpBoxes` component keeps.

---

### `apps/mobile/app/(profile-setup)/complete-profile.tsx` (route/screen, CRUD create) — functional rewrite

**Analog:** self (current placeholder flow) for the `completeProfile` + 409 + `refreshAuthState()`
wiring; `festivals/index.tsx` for the TanStack `useQuery`/`useMutation` pattern to debounce the live
username check.

**Complete-profile call + TOCTOU 409 + guard refresh to preserve** (current lines 24–43):
```tsx
const result = await apiClient.completeProfile({
  body: { username, displayName },   // body SHAPE unchanged — avatar NOT added (D-01)
});
if (result.status === 409) {
  // regenerate suggestion (username-suggestion.ts), show "taken" helper — DB unique index is the TOCTOU-safe check
  setError(/* UI-SPEC taken copy */);
  setSubmitting(false);
  return;
}
setSubmitting(false);
refreshAuthState();   // re-check GET /me; profile isn't part of better-auth's session atom
```
Replace `generatePlaceholderUsername()` with real user-typed username + live availability.

**Live-availability query pattern** — copy the `apiClient` + TanStack shape from
`festivals/index.tsx` lines 23–31, debounced ~300–400ms (RESEARCH Pattern 3):
```tsx
const festivalsQuery = useQuery({ queryKey: ['festivals'], queryFn: () => apiClient.listFestivals() });
// → useQuery({ queryKey: ['username-availability', debounced], queryFn: () => apiClient.usernameAvailability({ query: { username: debounced } }), enabled: debounced.length >= 3 })
```
Endpoint pair (`usernameAvailability`, `completeProfile`) is unchanged — see `contracts/src/router.ts`.

**Avatar tile:** `AvatarTile` shows initials fallback ↔ local MMKV photo via `avatar-storage.ts`
(D-01). `POST` body stays username+displayName; `visitor_profile.avatar` stays null.

---

### `apps/mobile/app/festivals/index.tsx` (route/screen) — add logout control

**Analog:** self. Add an icon-only logout button top-right of the Festivals header (UI-SPEC).

**Header hook** (current line 79): `<Stack.Screen options={{ title: t\`Festivals\` }} />` → add
`headerRight` rendering a Lucide `LogOut` icon-button. **Logout robustness backstop** (RESEARCH
Pattern 4 / Claude's discretion): `authClient.signOut()` in a guarded (non-re-entrant) handler that
clears the local session and reaches Welcome **even on offline/failure** — never strand logged-in.
Existing `useQuery`/`useMutation` + `apiClient` patterns (lines 23–41) are the template for any
call wiring. Replace hard-coded `#4f46e5`/`#f4f4f5` styles with tokens.

---

### `apps/mobile/app/_layout.tsx` (provider/guard, event-driven) — deep-link capture/return-to (D-02)

**Analog:** self. The existing module-level `notifyMeMightHaveChanged` singleton (lines 40–43) is the
**exact idiom** to mirror for `pending-destination.ts` (module-level `let`, no global state lib).

**Existing four-state guard to extend** (lines 26–30, 120–131) — capture must survive the
profile-completion detour: capture while `status === 'unauthenticated'`, **consume+replay only on the
transition INTO `'authenticated'`** (NOT `'authenticated-no-profile'`), so return-to survives
first-login profile completion.
```tsx
type AuthState =
  | { status: 'loading' } | { status: 'unauthenticated' }
  | { status: 'authenticated-no-profile' } | { status: 'authenticated' };
```
**Splash gate to KEEP untouched** (lines 104–115): `bootstrapped = localeReady && authState !== 'loading'`
stays the SOLE splash gate. D-04 restyle = presentation only; **do NOT** add a `useFonts()` gate here
(Pitfall 5). Capture the initial URL as the FIRST effect, ungated by locale/session bootstrap (Pitfall 2).

---

### `apps/mobile/lib/pending-destination.ts` (utility, event-driven) — NEW

**Analog:** `app/_layout.tsx` `notifyMeMightHaveChanged` module-singleton (lines 40–43). Same
module-level `let` pattern; in-memory only (NO MMKV/SecureStore — D-02 reversibility note).
```ts
let pendingDestination: string | null = null;
export function capturePendingDestination(href: string) { pendingDestination = href; }
export function consumePendingDestination(): string | null {
  const href = pendingDestination; pendingDestination = null; return href;
}
```

### `apps/mobile/lib/avatar-storage.ts` (utility, file-I/O) — NEW, no analog

MMKV wrapper keyed per `accountId` (D-01, RESEARCH Code Examples). Standard MMKV usage:
`createMMKV({ id: 'festipal-avatar' })`; `set`/`getString`/`delete` on key `avatar-uri:${accountId}`.
Requires `react-native-nitro-modules` peer + native rebuild (Pitfall 3) — not Expo Go.

### `apps/mobile/lib/fonts.ts` (utility) — NEW

**Analog (shape):** `lib/i18n.ts` async-bootstrap wrapper. `useFonts()` from `expo-font` +
`@expo-google-fonts/*`; export font-family constants. **Non-blocking** — `fontsLoaded` gates only
`fontFamily` in styles (`fontFamily: fontsLoaded ? 'Outfit-Bold' : undefined`), never splash-hide (D-04).

### `apps/mobile/lib/username-suggestion.ts` (utility, pure transform) — NEW, self-contained

Per RESEARCH Pattern 5: sanitize to `a-z0-9_.`, cap ≤ 20 chars (D-03), append `_NNNN`, verify
available via `usernameAvailability` before display (bounded retry). Unit-testable pure fn.

### `apps/mobile/components/OtpBoxes.tsx` / `AvatarTile.tsx` / `ResendCountdown.tsx` (components) — NEW

ADR-022 custom RN primitives on `packages/ui` tokens; icons via `lucide-react-native`. `OtpBoxes`
extracts `verify.tsx`'s single-hidden-`TextInput` idiom (6 box `View`s reading off one `TextInput`,
RESEARCH Pattern 1). `ResendCountdown` wraps `verify.tsx`'s `handleResend`. `AvatarTile` = initials ↔
`expo-image` of the MMKV URI. **No third-party UI kit.**

---

### `packages/db/src/schema/visitor-profile.ts` (model/schema, validation) — D-03 caps

**Analog:** self — the EXISTING `.extend()` block (lines 64–75). **CRITICAL (Pitfall 4):** add caps
to the existing `z.string()` values inside `.extend()` — do NOT use `createInsertSchema`'s refinement
callback (re-triggers the documented `text()`→`unknown` inference bug the file's own comment warns of).

**Edit target** (current lines 64–69):
```ts
export const visitorProfileInsertSchema = createInsertSchema(visitorProfile).extend({
  accountId: z.string(),
  username: z.string().min(3).max(20).regex(/^[a-z0-9_.]+$/, 'lowercase letters, numbers, _ and . only'), // D-03
  displayName: z.string().min(1).max(40), // D-03
  avatar: z.string().nullable().optional(),
});
```
Apply matching min/max/regex to `visitorProfileSelectSchema` (lines 70–75) too. Insert-side is the
higher-priority half (gates writes). Caps flow up to `@festipal/contracts` automatically via `.pick()`.

### `packages/contracts/src/schemas.ts` (schema compose) — NO EDIT NEEDED

`completeProfileBodySchema` = `visitorProfileInsertSchema.pick({...})` (line 59);
`visitorProfilePublicSchema` = `visitorProfileSelectSchema.pick({...})` (line 31). The db `.extend()`
caps propagate automatically — the drizzle-zod base IS the source of truth (RESEARCH structure note).
Endpoint route defs in `router.ts` (`usernameAvailability`, `completeProfile`) are unchanged.

### `packages/ui/src/tokens.ts` (config) — real brand values

**Analog:** self (placeholder, lines 41–55) + source `docs/concept/designs/auth/source/festipal-tokens.css`.
Replace the placeholder `#4f46e5` etc. with the real festipal palette. **First real token values this
phase** — Phases 5/6 build on it; do not invent a competing third token set. Every screen importing
`tokens` (festivals list) inherits the new palette — verify no visual regression.

**Key source values to port** (from `festipal-tokens.css`):
```
brand-primary  #74CC1F (green-500)   brand-primary-press #63B117 (green-600)
brand-secondary #5A4DFF (violet-500)  bg-app #0C0E13 (ink-900, dark-first) · bg-app-deep #07080B
surface-card #14161D  text-primary #E9ECF2  text-secondary #9FA6B6  text-muted #7C8394
status: success #8FDA3B · warning #FFC53D · danger #FF4D5E · info #5FB4FF
radii r-sm 12 / r-md 16 / r-lg 22 / r-pill 999 · hit-min 44 · screen-pad 18
fonts: display Outfit · body "Plus Jakarta Sans" · mono "JetBrains Mono"
```
Extend the existing `spacing`/`radii`/`fontSizes`/`fontWeights`/`colors`/`tokens` export shape;
consider adding dark-first semantic aliases (surface/text roles) the screens above need.

---

## Shared Patterns

### i18n — every user-facing string through Lingui
**Source:** `verify.tsx` / `index.tsx` (`import { Trans, useLingui } from '@lingui/react/macro'`;
`const { t } = useLingui()`; `t\`...\`` / `<Trans>...`).
**Apply to:** ALL new/restyled screens + components. no-literal-string lint is on (Phase 3). DE catalog
is binding and must match the mockup verbatim (D-08); source strings EN.

### Auth client — reused as-is
**Source:** `apps/mobile/lib/auth-client.ts` (`authClient.emailOtp.sendVerificationOtp`,
`authClient.signIn.emailOtp`, `authClient.signOut`, `authClient.useSession`).
**Apply to:** Welcome/Email/Verify + Logout. No re-wiring. SecureStore session store; single 90-day
sliding session, NO refresh flow (D-02/Pitfall 10) — expiry routes to OTP.

### API client — typed ts-rest, contract-derived
**Source:** `apps/mobile/lib/api-client.ts` (`apiClient.completeProfile`, `.usernameAvailability`,
`.getMe`; cookie-forwarding via `authClient.getCookie()`, `credentials: 'omit'`).
**Apply to:** complete-profile, username live-check, logout. Never re-declare request/response shapes
(Pitfall 6) — types derive from `@festipal/contracts`.

### Error/status handling — check `.status`, map to localized copy
**Source:** `verify.tsx` `mapOtpError` (lines 32–43); `complete-profile.tsx` 409 branch (lines 30–38);
`festivals/index.tsx` status branches (lines 80–121).
**Apply to:** all screens making API/auth calls. 200/409/429/error each → a UI-SPEC copy string.

### Guard re-resolution after profile write
**Source:** `app/_layout.tsx` `refreshAuthState()` (lines 40–43) called from `complete-profile.tsx`
(line 42). **Apply to:** the rewritten complete-profile screen (unchanged mechanism).

### Screen header convention (restyle target)
**Source:** every screen's `<Stack.Screen options={{ title: t\`...\` }} />`.
**Apply to:** all restyled screens → `{ headerShown: false, title: t\`...\` }` (title kept as a11y
label) + manually-rendered in-body H1 (UI-SPEC note #7).

### Tokens over hard-coded colors
**Source:** current screens hard-code `#4f46e5`/`#e4e4e7`/`#dc2626`/`#f4f4f5` in `StyleSheet.create`.
**Apply to:** ALL touched screens — swap to `packages/ui/src/tokens.ts` values (ADR-022).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `apps/mobile/lib/avatar-storage.ts` | utility | file-I/O | First MMKV usage in repo (D-01); no prior device-local media store. Follow RESEARCH Code Examples shape. |
| `apps/mobile/components/AvatarTile.tsx` | component | file-I/O display | First `expo-image` + initials-fallback tile; new visual primitive. |
| `apps/mobile/lib/username-suggestion.ts` | utility | pure transform | New pure fn; fully specified by RESEARCH Pattern 5 + D-03 cap. |

The deep-link return-to mechanism (`pending-destination.ts` + `_layout.tsx` extension) has **no
official Expo Router analog** (RESEARCH Pattern 4, [ASSUMED]) — but its *implementation idiom*
(module-level singleton) is copied from the in-repo `notifyMeMightHaveChanged` pattern, so it is not
listed as "no analog".

## Metadata

**Analog search scope:** `apps/mobile/app/**`, `apps/mobile/lib/**`, `packages/db/src/schema/`,
`packages/contracts/src/`, `packages/ui/src/`, `packages/i18n/src/`, `docs/concept/designs/auth/source/`
**Files scanned:** ~16 (all route screens, both mobile lib clients, root layout, visitor-profile
schema, contracts schemas, tokens, token CSS source)
**Pattern extraction date:** 2026-08-04
