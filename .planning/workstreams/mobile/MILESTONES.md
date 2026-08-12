# Milestones

## v1.0 Rollout — Visitor Shell (Shipped: 2026-08-12)

**Workstream:** mobile
**Scope:** 7 phases · 50 plans · 116 tasks
**Timeline:** 2026-07-28 → 2026-08-12 (15 days)
**Closeout:** `verified_closeout` — all 7 phases `phase_complete` with `verification_status: passed`; 20/20 v1 requirements checked off; traceability table fully Complete.
**Merged as:** PRs #4, #6, #7, #8, #9, #10, #11, #12, #13 (squash) — `main` at `44e7914`

### Delivered

A festival visitor can install the app, get in without a password, connect to a festival, and reach
their whole festival context from one home screen — the core value, end to end and on real hardware.

**Key accomplishments:**

- **Identity & tenancy schema that cannot drift** — better-auth's four core tables vendored into
  `packages/db`, `visitor_profile` as a *separate* profile table (not better-auth's org/username
  plugins), and `my_festival` as the single sanctioned bridge between global identity and tenant
  data (composite PK, gate-less save). Every contract type is derived via `drizzle-zod`, so a column
  rename breaks the build instead of drifting silently. Case-insensitive username uniqueness proven
  live against Postgres (23505 on a case-variant duplicate).
- **Passwordless email-OTP auth with a login-first, tenant-isolated API** — better-auth's `emailOTP`
  wired into NestJS behind a global `AuthGuard`; health is the only anonymous endpoint. SEC-01 closed
  by a 401-without-session spec over the whole endpoint set plus a reviewed endpoint × auth table;
  SEC-02 closed by a cross-tenant denial spec proving one festival's data never surfaces in another's
  context. Entry stays gate-less by design (ADR-014) — isolation is data-scoping, not a 403.
- **Expo app shell with i18n enforced from the first line of UI** — Metro/pnpm workspace resolution,
  real DE/EN Lingui catalogs, a `.po` Metro transformer and a `no-literal-string` lint rule, all in
  place *before* any product screen existed. Session state drives a splash-held four-state guard
  (`loading` / `unauthenticated` / `authenticated-no-profile` / `authenticated`) over three
  `Stack.Protected` route groups.
- **The complete visitor path, signed off on a real Android device** — welcome → OTP → first-login
  profile (live username check, device-local avatar via MMKV, never uploaded) → browse all festivals →
  save → gate-less enter → festival home, with deep links that survive profile completion and a
  logout that genuinely revokes the server session.
- **quiks rebrand + CI v1.0 across the whole app (Phase 05.1)** — `@quiks/*` packages, bundle ID
  `at.quiks.app`, scheme `quiks` as a hard cut; Beere/Amber tokens for both modes with Sunset as the
  only gradient; hell-first light mode where only the exact device value `dark` yields the night
  shift. All eight components and all eight screens moved from frozen module-level styles to
  per-render `createStyles(colors)`; zero raw colour literals remain; one shared glyph module feeds
  both the runtime wordmark and a deterministic app-icon generator.
- **Global tab bar with Profile, Friends and Settings (Phase 6)** — four real routes
  (`Start · Festivals · Friends · Mehr`), a view-only profile off `GET /me`, a Friends placeholder
  whose empty states name the precondition rather than the absence, and a settings screen with a
  persisted dark-mode override layered strictly *above* the hell-first resolver.

### Notable engineering finds

- `drizzle-zod` must stay ≤ 0.7.1 while the workspace is on Zod v3 — 0.8.x imports `zod/v4` and breaks
  ADR-006. Carried forward as a hard constraint.
- Expo SDK 54+ forces edge-to-edge on Android, so the window no longer resizes for the IME —
  `KeyboardAvoidingView` and `adjustResize` are both inert. Keyboard-covered content is only scrollable
  via live keyboard-height padding.
- Hermes ships no `Intl.PluralRules`. A single Lingui `plural()` call crashed the Profile screen
  outright; the polyfill now registers at a custom Expo Router entry ahead of every route module.
- The Expo dev-client launch URL (`quiks:///expo-development-client/?url=…`) was being captured as a
  route and replayed at the auth transition, producing an Unmatched Route on every dev launch — a pure
  dev artifact that cost three rounds of wrong theorising before device logs settled it.

### Known gaps carried forward

| Item | Status | Note |
|---|---|---|
| `/gsd-ui-review 06` | Never run | The 6-pillar visual audit of the three Phase-6 screens is the one quality gate this milestone did not pay. |
| T-06-06 — profile visibility policy | Accepted risk | `visitorProfilePublicSchema` carries `birthDate`/`gender` with no visibility policy. **Blocks FRND-02/PROF-02**: the projection must be split into an owner view and a friend view before any endpoint serves a *foreign* profile. |
| iOS on-device verification | Deferred (user-approved) | Android verified throughout; no Mac/Xcode toolchain set up. |
| `.planning/WINDOWS.md` | 26 open entries | Mostly stale `unrun-verify` items from Phase 5, later covered by the Phase-5/6 UATs. Ledger gate is off (`windows_enforce: false`). |
| Tab route name | Decided, not yet done | Route is `home`, design and catalog say „Start" — rename scheduled ahead of the next milestone's route work. |

### Evidence honesty

Device acceptance in Phases 05.1 and 06 was granted as a blanket `approved` without per-item findings;
`WINDOWS.md` entries 33/34/35 are therefore `waived`, not `fixed`. The Phase-6 re-verification is the
exception — five individually formulated UAT tests, each with its own `pass`. That is real human
evidence, itemized, but it is not an automated proof and is not recorded as one.

---
