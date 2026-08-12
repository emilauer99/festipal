# Phase 4: Visitor Auth & Profile Completion - Context

**Gathered:** 2026-08-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn Phase 3's rudimentary-but-real OTP flow and placeholder screens into the **real,
designed auth + first-login profile experience**, matching the binding Claude Design mockups
transcribed in `04-UI-SPEC.md`. A visitor logs in passwordlessly via email-OTP, completes their
profile on first login (unique `username` with live availability + `displayName`, optional
avatar), stays logged in across a force-quit-and-relaunch, can log out, and sees clear localized
errors for every OTP/validation edge case. Deep links to protected routes while logged out
redirect through the auth flow without leaking content.

**In scope (Phase 4 scope anchor):**
- Real Welcome / Email / OTP / Profile-completion screens per `04-UI-SPEC.md` (routing restructure:
  `(auth)/index` → Welcome, email-entry → new route, `verify.tsx` stays OTP; `headerShown:false`
  + in-body H1; 6-box auto-submit OTP driven by one hidden `TextInput`; 60s resend countdown).
- First-login profile completion as a **real `VisitorProfile` write** via `POST /me/complete-profile`
  (username live-check via `GET /me/username-availability`, TOCTOU `23505`→409 handling).
- Persistent session (Phase 2 D-02: 90-day sliding, no refresh endpoint) — verified by real
  force-quit + relaunch, not hot-reload; expiry → OTP re-login.
- Logout (icon-only, top-right of Festivals header; immediate `signOut()`, no confirmation).
- Deep-link redirect for logged-out access to protected routes (SC-5) **with return-to** (D-02 below).
- Localized error/edge coverage (wrong/expired code, resend, change-email, rate-limited, username
  taken) — copy locked in `04-UI-SPEC.md` Copywriting Contract.
- Port real brand tokens into `packages/ui/src/tokens.ts` (supersedes placeholder); add new deps
  (lucide-react-native, react-native-svg, expo-image-picker, expo-image, font loading).
- Server-side length caps for `username`/`displayName` (fills UI-SPEC-flagged gap, D-03 below).

**Out of scope (later phases):**
- Real **server-side** avatar upload + storage (endpoint, object store, `avatar` in the contract) —
  this phase is device-local only (D-01). Cross-device avatar sync depends on it.
- Social-links block + profile-visibility control (PROF-02, v2) — excluded per UI-SPEC Scope note #2.
- Manual light/dark toggle (Settings feature) and in-app language switcher.
- Festival home/overview content, date/place master-data (Phase 5); real Profile/Friends (Phase 6).
- Real Resend delivery hardening / festival-scale rate-limit tuning (pre-launch).

</domain>

<decisions>
## Implementation Decisions

> All four gray areas below were selected and answered by the user on 2026-08-04. They are
> **user-locked**, not "confirm at plan review" defaults. UI/visual/interaction details are NOT
> re-decided here — they are locked by `04-UI-SPEC.md`; these are the decisions that contract left
> open plus the flagged server-cap gap.

**Decision index** (parser-readable; full rationale below):

- **D-01 — Avatar scope:** local-only, **device-persisted via MMKV**; no server upload, no contract
  change. `visitor_profile.avatar` stays null; picker works, chosen URI survives restart on the
  same device, not synced cross-device.
- **D-02 — Deep-link (SC-5):** **return-to-destination** — after login (and profile-completion if
  needed) navigate to the originally-tapped protected route, not just Home.
- **D-03 — Name length caps:** `displayName` ≤ 40, `username` 3–20 (charset `a–z 0–9 _ .`), enforced
  server-side (Zod refinements in contracts + db) plus a matching client soft-cap.
- **D-04 — Splash:** **light restyle** to real brand tokens (dark `--bg-app` + festipal wordmark in
  Outfit), non-blocking.

### Avatar (IDN-01 optional part)
- **D-01:** The avatar picker (`expo-image-picker` + `expo-image`) is built, but the chosen photo is
  **stored on-device only via MMKV** (fits the offline-first stack) and displayed in the avatar-tile
  position instead of the initials fallback. It is **NOT uploaded**: `POST /me/complete-profile` body
  stays `username` + `displayName` only (contract unchanged), `visitor_profile.avatar` stays `null`,
  and there is **no upload endpoint / object store** this phase. The photo survives an app restart on
  the **same device** but does **not** sync server-side or across devices, and is lost if app data is
  cleared. Initials tile shows whenever no local photo is set.
  - **Known trade-off (documented, user-accepted):** this is a device-local half of the full feature —
    a future phase adds the real server upload so the avatar becomes an actual account attribute.
  - **Reversibility:** reversible — device-local only; no schema/contract change, so a real server
    upload can be layered in additively later without migrating anything.

### Deep-link redirect (SC-5)
- **D-02:** A logged-out tap on a protected route redirects into the auth flow (no content leak), and
  after successful authentication — **including passing through profile-completion if it's a first
  login** — the app navigates to the **originally-requested route**, not a generic Home. The intended
  destination must survive the intermediate profile-completion step.
  - **Reversibility:** reversible — navigation/redirect logic, no persisted or contract state.

### Server-side name length caps (fills UI-SPEC gap)
- **D-03:** `displayName` capped at **40** chars; `username` **3–20** chars, charset `a–z 0–9 _ .`
  (concept doc 09 §5). Enforced via `.max()`/`.min()`/charset refinements on the drizzle-zod bases in
  `packages/db` + `packages/contracts` (`visitorProfileInsertSchema` / `completeProfileBodySchema`),
  since the server currently enforces nothing (bare `z.string()`). Client gets the matching soft-cap +
  single-line truncation so a long displayName can't break the avatar-initials derivation or layout
  (UI-SPEC `long-text` backstop). The username-taken suggestion generator must likewise cap its
  output ≤ 20 chars.
  - **Reversibility:** reversible in practice — the mobile app is the only (pre-launch, we-own-it)
    consumer of these schemas and no long-name data exists yet; but the change does touch the
    published `packages/contracts` schema + db refinement + client, so treat tightening as a
    coordinated contract edit, not a client-only tweak.

### Splash screen
- **D-04:** Restyle the splash to the real brand tokens landing this phase — dark `--bg-app`
  background + "festipal" wordmark in Outfit — replacing Phase 3's plain placeholder. Kept lightweight
  and **non-blocking**: it must not gate on font load (system-font fallback until Outfit is ready) and
  nothing in Phase 4's success criteria depends on it.
  - **Reversibility:** reversible — presentation only.

### Claude's Discretion (technical, not user-facing)
- **Username-taken suggestion algorithm** — UI-SPEC fixes only the sentence shape; the generator is
  planner's choice, but MUST cap output ≤ 20 chars (D-03) and produce an available candidate.
- **Logout robustness (UI-SPEC backstops):** a failed/offline `signOut()` must still clear the local
  session and reach Welcome (never strand the visitor logged-in); guard the button against re-entrant
  double-tap during the in-flight signOut.
- **Splash timeout/fallback (UI-SPEC backstop):** the cold-start session/festival resolve must have a
  timeout/fallback so the splash can't deadlock on a hung request.
- **MMKV avatar storage** — key/shape for the local avatar URI, and `expo-image-picker` permission
  handling (gallery + camera).
- **Route file layout** for the Welcome/email split under `app/(auth)/`, and the guard extension for
  deep-link return-to (build on Phase 3's three-state guard).
- **Font loading mechanism** (`@expo-google-fonts/*` + `expo-font`) with graceful system-font fallback.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Binding design contract (THIS PHASE — read first)
- `.planning/phases/04-visitor-auth-profile-completion/04-UI-SPEC.md` — **the pixel-precise,
  gsd-ui-checker-VERIFIED design + interaction contract** (typography 11-role set, color tokens,
  spacing, full DE/EN Copywriting Contract, routing restructure, OTP-box/auto-submit pattern, resend
  countdown, focal points, UI-state coverage + backstops). LOCKED per ADR-015 — do not re-derive or
  collapse.
- `docs/concept/designs/auth/` — the 8 imported Claude Design frames (dark+light);
  `docs/concept/designs/auth/preview.html` renders them; `docs/concept/designs/auth/source/festipal-tokens.css`
  is the real token source the UI-SPEC transcribes.
- `docs/concept/03-design-system.md` — brand design system (typography/color/spacing/shape), binding
  (ADR-015); source for `packages/ui/src/tokens.ts` update.
- `docs/concept/09-onboarding-auth.md` — binding OTP + onboarding flow; §5 username availability +
  rules (3–20, charset), §2 resend affordance.
- `docs/concept/04-domain-identity.md` — Account→VisitorProfile split (§3), gate-less `MyFestival`.

### Roadmap / requirements (this phase)
- `.planning/ROADMAP.md` §"Phase 4: Visitor Auth & Profile Completion" — goal + 5 success criteria +
  Notes (verify native session persistence via force-quit; deep-link redirect covers Pitfall 5).
- `.planning/REQUIREMENTS.md` — **AUTH-01..05**, **IDN-01** (this phase); **SEC-01** (login-first),
  **SEC-02** (`festivalId` isolation) still bind any data reads.

### Pitfalls (authoritative risk list)
- `.planning/research/PITFALLS.md` — **Pitfall 2** (Expo SecureStore / `trustedOrigins` /
  force-quit UAT), **Pitfall 5** (auth-flash / deep-link bypass; three-state guard; splash gating),
  **Pitfall 9** (`resendStrategy:"reuse"`, expired-vs-wrong code), **Pitfall 10** (one sliding session
  token, no refresh endpoint), **Pitfall 11** (username TOCTOU → `23505` → 409).

### Prior phase decisions this phase builds on
- `.planning/phases/03-mobile-app-shell-i18n-foundation/03-CONTEXT.md` — auth client + SecureStore,
  three-state guard + splash gate, `(auth)`/`festivals`/`(festival)` groups, i18n D-06/07/08
  (device locale, DE fallback, EN source strings / binding DE catalog).
- `.planning/phases/02-otp-auth-festival-backend-api/02-CONTEXT.md` — session D-02 (90-day sliding,
  expiry→OTP), the `/me`, `/me/complete-profile`, `/me/username-availability` endpoints, dev mail
  (Mailpit) transport, username TOCTOU→409 handling.
- `.planning/phases/01-identity-schema-auth-foundation/01-CONTEXT.md` — `visitor_profile`
  (`avatar text()`, `username_lower` unique) + `my_festival` schema shapes.

### ADRs (authoritative decisions)
- `docs/DEVELOPMENT_DECISIONS.md` — **ADR-015** (Claude Design fidelity is binding — matches Principle
  5), **ADR-022** (no third-party RN UI kit; custom primitives on tokens), **ADR-009** (email-OTP),
  **ADR-012** (two locale axes; device locale = UI axis), **ADR-014** (tenant scoping / gate-less),
  **ADR-016** (identity model), **ADR-005** (Neon pooling / `prepare:false`).

### Existing code this phase extends
- `apps/mobile/app/(auth)/index.tsx` (→ becomes Welcome), `(auth)/verify.tsx` (OTP),
  `(auth)/_layout.tsx`, `(profile-setup)/complete-profile.tsx`, `app/_layout.tsx` (guard + splash).
- `apps/mobile/lib/auth-client.ts` (better-auth Expo client + emailOTP + SecureStore; `signOut`),
  `apps/mobile/lib/api-client.ts` (ts-rest cookie-forwarding client).
- `packages/contracts/src/schemas.ts` + `router.ts` — `completeProfileBodySchema`
  (username+displayName; **avatar NOT included** — keep it that way, D-01), `usernameAvailabilitySchema`.
- `packages/db/src/schema/visitor-profile.ts` — `avatar text()` col + the drizzle-zod refinements to
  add `.max()`/charset to (D-03).
- `packages/ui/src/tokens.ts` — placeholder tokens to replace with the real brand values (UI-SPEC).
- `packages/i18n/src/` — `resolveUiLocale`, Lingui catalogs (DE binding for mockup copy).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/auth-client.ts` — the Phase 3 better-auth Expo client (emailOTP send/verify, SecureStore
  persistence, `signOut`) is reused as-is for Welcome→Email→Verify and Logout; no re-wiring.
- `lib/api-client.ts` — the cookie-forwarding ts-rest client is the path for `/me`,
  `/me/complete-profile`, `/me/username-availability`; types derive from `packages/contracts`.
- Phase 3 **three-state guard** in `app/_layout.tsx` (unauth / auth-without-profile / auth) is the
  hook point for D-02 deep-link return-to — extend it to capture + resume the intended route.
- The existing rudimentary `(auth)/index` + `verify` screens are **re-skinned into** the designed
  screens (same OTP flow, per Phase 3 D-02 / specifics), not thrown away.
- `packages/i18n` `resolveUiLocale` + Lingui catalogs — all new copy goes through `t()`/`<Trans>`.

### Established Patterns
- Zod schemas in `packages/contracts` are the single source of truth — **extend** the drizzle-zod
  refinements for the name caps (D-03); never hand-redeclare shapes (Pitfall 6).
- no-literal-string lint (Phase 3) — every user-facing string must be a Lingui msgid; DE catalog is
  binding and must match the mockup verbatim for these screens (D-08).
- Custom RN primitives styled via shared tokens (ADR-022) — no third-party UI kit; icons via Lucide.
- Service returns `null` for not-found; controller maps to contract error (404/409) — TOCTOU→409.

### Integration Points
- `packages/ui/src/tokens.ts` gets its **first real values** this phase (UI-SPEC supersedes the
  placeholder); Phases 5/6 build on it — do not invent a competing third token set.
- New npm deps: `lucide-react-native`, `react-native-svg`, `expo-image-picker`, `expo-image`, a
  font-loading package — ordinary `pnpm add` (not shadcn registry blocks). Watch the Windows Metro ×
  pnpm install race (stop Expo/Metro before installing).
- **MMKV** holds the local avatar URI (D-01) — introduce/confirm the MMKV dependency from the
  offline-first stack; keyed per account.
- Name-cap change (D-03) spans `packages/db` refinement → `packages/contracts` schema → mobile client
  soft-cap in one coordinated edit.
- `complete-profile` request body is **unchanged** (username+displayName) — avatar is deliberately
  not added to the contract this phase (D-01).

</code_context>

<specifics>
## Specific Ideas

- **Avatar is device-local (MMKV) only** — server `avatar` column stays `null`; the picked photo
  shows in the avatar-tile position, survives restart on the same device, explicitly **not**
  cross-device. Do not build an upload endpoint or add avatar to the contract.
- **Deep-link return-to must resume the exact originally-tapped route** after login (and after
  profile-completion when it's a first login), not dump the visitor on Home.
- **Name caps:** `displayName` ≤ 40; `username` 3–20 with charset `a–z 0–9 _ .` (concept 09 §5).
- **Splash** gets a light brand restyle (dark `--bg-app` + Outfit "festipal" wordmark), non-blocking
  on font load.

</specifics>

<deferred>
## Deferred Ideas

- **Real server-side avatar upload + storage** — upload endpoint, object store (S3/Cloudinary/Neon
  blob TBD), `avatar` added to the `complete-profile`/`me` contract, cross-device sync → a later
  profile/media phase (D-01 keeps this additive).
- **Social-links block + profile-visibility control** (PROF-02, v2) — explicitly excluded from the
  Phase 4 profile screen per UI-SPEC Scope note #2.
- **Manual light/dark toggle** (Settings) — UI-SPEC Scope note #8; deferred, non-blocking.
- **In-app language switcher** — override axis already supported; with real Profile/Settings (Phase 6+).
- **Real Resend delivery hardening + festival-scale OTP rate-limit tuning** — pre-launch (Phase 2
  deferred), Mailpit dev transport covers this phase.

None of the above were folded — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-visitor-auth-profile-completion*
*Context gathered: 2026-08-04*
