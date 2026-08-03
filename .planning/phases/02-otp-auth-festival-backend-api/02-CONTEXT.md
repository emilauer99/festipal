# Phase 2: OTP Auth & Festival Backend API - Context

**Gathered:** 2026-08-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire better-auth's passwordless **email-OTP** into the NestJS API and expose the
authenticated festival backend the visitor shell needs: OTP send/verify, first-login
profile completion, username availability, festival browse/save, and "my festivals" —
all behind a global login-first `AuthGuard` with correct `festivalId` data isolation.

**In scope:**
- better-auth instance + `emailOTP` plugin wired via `@thallesp/nestjs-better-auth`
  (`better-auth >= 1.5.0`): catch-all handler at `/api/auth/*`, 6-digit code, ~5-min
  expiry, built-in request rate-limit, `resendStrategy: "reuse"`.
- Global `AuthGuard` + one deliberate public-vs-protected tagging pass (SEC-01);
  endpoint × auth-annotation table reviewed at phase end.
- ts-rest endpoints (composed on Phase 1's drizzle-zod bases): `GET /api/v1/me`,
  `POST /api/v1/me/complete-profile`, `GET /api/v1/me/username-availability`,
  `GET /api/v1/festivals`, `POST /api/v1/festivals/:festivalId/save`,
  `GET /api/v1/me/festivals`. better-auth's own OTP routes are **excluded** from the
  contract.
- `festivalId` data isolation (SEC-02) with an automated cross-tenant denial test;
  gate-less save/enter (no 403-on-unsaved).
- `bodyParser: false` + re-applied JSON parsing, smoke-tested with two POSTs (OTP-verify
  to `/api/auth/*` and a ts-rest `save`).
- Sliding-session config (`expiresIn`/`updateAge`), env-configured email provider with a
  dev fallback, and a reusable DB seed for one festival.

**Out of scope (later phases):**
- Any `apps/mobile` / `apps/admin` UI, auth client, or navigation (Phase 3+).
- Festival master-data fields **date / place** on the `festival` table (Phase 5 / FEST-01).
- Real Resend delivery hardening + festival-scale rate-limit tuning (pre-launch; see
  Deferred).
- `FestivalStaff` / `PlatformAdmin` / better-auth organization plugin, friend-graph
  tables, `FestivalTicket`, `MyFestival.camp` UI (post-shell milestones).
- `birthDate` / `gender` / Flinta / safety fields (pending Birgit's concept).

</domain>

<decisions>
## Implementation Decisions

> All four gray areas below were selected by the user and answered directly on
> 2026-08-01. They are **user-locked**, not "confirm at plan review" defaults.

**Decision index** (parser-readable summary; full rationale in the sections below):

- **D-01 — Email/OTP delivery:** dev transport (console/Mailpit) active now; Resend adapter implemented but env-optional/dormant. No Resend account this phase.
- **D-02 — Session lifetime:** 90-day sliding session (`expiresIn ≈ 90d`, `updateAge ≈ 1d`); no refresh-token grant — expiry routes back to OTP sign-in.
- **D-03 — Festival test/seed data:** idempotent seed with ONE user-defined festival (`frequency-2026`); SEC-02 isolation test provisions its own two throwaway fixtures.
- **D-04 — `GET /festivals` shape:** minimal, unpaginated, current `festival` fields only; date/place deferred to Phase 5; contract kept additive.

### D-01: Email/OTP delivery for this phase — Dev transport now, Resend wired-but-deferred
The OTP email send goes through a **provider abstraction** with a **dev transport**
(console log and/or Mailpit) as the active path this phase. The `RESEND_API_KEY` /
Resend adapter code path is **implemented but env-optional** — it stays dormant until a
key is configured. **No Resend account or domain verification is required for Phase 2.**
- **Rationale (user):** Phase 2 delivers a *live dev API* and there is no mobile client
  yet (Phase 3) — OTP is exercised via curl/tests, so a console/Mailpit transport is
  sufficient; the real-send path is prepared so it flips on by env later with no rewiring.
- **Follow better-auth guidance:** fire-and-forget the send inside `sendVerificationOTP`
  (do not `await` the provider before responding), always return success from the
  OTP-request endpoint regardless of delivery outcome (Pitfall 9 / security table).
- **No secrets committed** — provider key is env-only; add a placeholder to `.env.example`.
- **Reversibility:** reversible — swapping the active transport is an env/adapter change,
  no schema or contract impact.

### D-02: Session lifetime — 90 days, sliding
Configure better-auth's session as a **sliding** session: `expiresIn ≈ 90 days`,
`updateAge ≈ 1 day`. On regular use the visitor stays effectively logged in; after ~90
days of inactivity the session lapses and they **re-authenticate via OTP** (there is no
refresh-token grant — this is one sliding session token, Pitfall 10).
- **Rationale (user):** best comfort/security compromise for an app used a few times a
  year; the concept's "mobil langlebig" wording is satisfied without an OAuth-style
  refresh flow.
- **Do NOT build:** a custom `/auth/refresh` endpoint or token-rotation logic (Pitfall 10).
  "Session expired → route back to OTP sign-in" is the only expiry behavior.
- **Reversibility:** reversible — `expiresIn`/`updateAge` are config values; changing them
  affects only newly-issued/renewed sessions.

### D-03: Festival test/seed data — reusable seed with ONE user-defined festival
Provide an **idempotent seed script** (e.g. `pnpm --filter db db:seed`) that inserts a
**single** real festival whose data the user specifies (see "Seed festival" below). The
SEC-02 cross-tenant isolation **test creates its own two throwaway festivals as test
fixtures** (test DB / transaction-scoped) — it does **not** rely on, or pollute, the dev
seed. This keeps the dev seed clean/single while still satisfying SC-3's two-festival
denial proof.
- **Rationale (user):** "Wiederverwendbares Seed-Skript, aber fürs erste mit nur einem
  Festival. Ich möchte alle Daten für dieses Festival selbst festlegen." The two-festival
  need is a *test* concern, resolved with self-managed fixtures (Claude's technical call).
- **Reversibility:** reversible — adding more seed festivals later is additive.

### D-04: `GET /festivals` shape — minimal now, no pagination, date/place deferred
`GET /api/v1/festivals` returns **all** currently-seeded festivals (no pagination — the
user expects few festivals early on) using only fields that exist on `festival` today
(`id`/`slug`/`name`/`defaultLocale`/`supportedLocales`; `cashlessUrl` optional). The
FEST-01 **date/place** fields are **not** modeled this phase — they are festival
master-data belonging to Phase 5 (which owns FEST-01). Keep the contract shape additive so
those fields can be added later without a breaking change.
- **Rationale (user):** "minimal fürs erste, einfach alle Festivals anzeigen die aktuell
  eingepflegt sind. Am Anfang wird es hier noch nicht viele Festivals geben."
- **Two distinct contracts (Pitfall 4):** `GET /festivals` (browse, session-only, no
  save-gated fields) vs `GET /me/festivals` (returns only the caller's saved
  `my_festival` rows) — never one endpoint + client-side `.filter()`.
- **Reversibility:** costly — the response Zod schema is published to future clients;
  adding fields is safe, but renaming/removing fields later breaks derived clients.

### Seed festival (user-provided, D-03)
| Field | Value |
|---|---|
| `slug` | `frequency-2026` |
| `name` | `Frequency 2026` |
| `defaultLocale` | `de` |
| `supportedLocales` | `de`, `en` |
| `cashlessUrl` | *(none — leave null for now)* |
| tags | *(none this seed)* |

### Claude's Discretion (technical, not user-facing)
- **Login-first tagging (SEC-01):** health + OTP send/verify are anonymous; every other
  endpoint protected-by-default. Produce the endpoint × auth-annotation table.
- **Body-parser wiring (SC-4):** `NestFactory.create(AppModule, { bodyParser: false })` +
  `AuthModule.forRoot({ auth, bodyParser: {...} })`; ts-rest controllers consume the
  re-applied `req.body`. Hand-rolled `@All('auth/*path')` catch-all is **Plan C** only.
- **Global-prefix collision:** align `/api/v1` (ts-rest) vs `/api/auth` (better-auth) —
  exclude auth from `setGlobalPrefix` or set better-auth `basePath`. Confirm during spike.
- **username-availability vs complete-profile (Pitfall 11):** availability is advisory
  (debounced `SELECT`); `complete-profile` is source of truth — catch Postgres `23505`
  from `visitor_profile_username_lower_unq` and map to `409`, don't trust the prior check.
- **SEC-02 isolation-test fixtures:** the test provisions its own 2 festivals (per D-03).
- Module/file layout under `apps/api/src/` (e.g. `auth/`, `me/`, `festival/` extensions),
  the seed script's home in `packages/db`, and the OTP provider-abstraction shape.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap / requirements (this phase)
- `.planning/ROADMAP.md` §"Phase 2: OTP Auth & Festival Backend API" — goal, 6 success
  criteria, and the MEDIUM-research Notes (thallesp wrapper wiring, spike = *confirm*).
- `.planning/REQUIREMENTS.md` — **SEC-01** (login-first), **SEC-02** (`festivalId`
  isolation, gate-less), and downstream AUTH/IDN/FEST/HOME reqs these endpoints must serve.

### Pitfalls (authoritative risk list for this slice)
- `.planning/research/PITFALLS.md` — especially **Pitfall 3** (global AuthGuard mis-tagging
  + `bodyParser:false`), **Pitfall 4** (gate-less ≠ scope-less; two-contract browse vs
  my-festivals; cross-tenant denial test), **Pitfall 8** (OTP rate-limit / shared-IP —
  deferred, see below), **Pitfall 9** (`resendStrategy:"reuse"`, expired-vs-wrong code),
  **Pitfall 10** (sliding session, no refresh token — D-02), **Pitfall 11** (username
  TOCTOU / `23505` → 409), **Pitfall 12** (no better-auth `username` plugin). Also the
  "Looks Done But Isn't" checklist and the Integration/Security tables.

### Identity / auth model (authoritative)
- `docs/concept/09-onboarding-auth.md` — binding OTP flow; §4 "Refresh-Token" wording is a
  misnomer (see Pitfall 10 / D-02); §5 username availability; §2 resend affordance.
- `docs/concept/04-domain-identity.md` — Account→VisitorProfile split (§3), `MyFestival`
  gate-less join (§5), global-vs-festival scoping (§8).
- `docs/DEVELOPMENT_DECISIONS.md` — ADR-009 (passwordless email-OTP; visitors not
  org-members), ADR-014 (tenant boundary / `festivalId` scoping / join = save), ADR-016
  (identity model), ADR-012 (locale/translation pattern), ADR-005 (Neon pooling /
  `prepare:false`).

### Phase 1 output this phase builds on
- `.planning/phases/01-identity-schema-auth-foundation/01-CONTEXT.md` — the D-01..D-04
  schema decisions (vendored `schema/auth.ts`, drizzle-zod bases, `visitor_profile` /
  `my_festival` shapes, `lower(username)` unique index).
- `packages/db/src/schema/` — `auth.ts` (vendored better-auth tables), `visitor-profile`
  (PK `accountId`, `visitor_profile_username_lower_unq`), `my-festival`
  (composite PK `(visitorId, festivalId)`), `festival.ts`, `_shared.ts`, barrel `index.ts`.

### Existing code this phase extends
- `apps/api/src/main.ts` — bootstrap (`NestFactory.create(AppModule)`; currently NO
  `bodyParser:false`, NO `setGlobalPrefix`); `apps/api/src/app.module.ts` — module wiring.
- `apps/api/src/festival/festival.controller.ts` / `festival.service.ts` — the
  `@TsRestHandler` + `festivalId`-scoped service pattern to mirror for new endpoints.
- `apps/api/src/db/db.module.ts` — DI'd `DB` client (`@Inject(DB)`); `config/env.ts` —
  Zod env loader (extend for `RESEND_API_KEY`, session config, provider selection).
- `packages/contracts/src/router.ts` / `schemas.ts` / `locale.ts` — the ts-rest router
  (`pathPrefix: '/api/v1'`) + where new endpoints/schemas compose on drizzle-zod bases.

### External docs to confirm during research/spike
- better-auth NestJS integration + `@thallesp/nestjs-better-auth` README (pin
  `better-auth >= 1.5.0`; `AuthModule.forRoot({ auth, bodyParser })` behavior).
- better-auth `emailOTP` plugin docs (`otpLength`/`expiresIn`/`resendStrategy`, rate-limit
  defaults) and session-management docs (`expiresIn`/`updateAge`).
- Resend Node SDK (fire-and-forget send) — for the wired-but-deferred adapter.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `festival.service.ts` `where(eq(tag.festivalId, festivalId))` pattern — the template for
  every new `festivalId`-scoped read/write (SEC-02).
- `@TsRestHandler` controller pattern in `festival.controller.ts` — copy for `me`,
  `festivals`, `my-festivals` handlers; contract stays the single source of truth.
- `config/env.ts` Zod loader — extend rather than add a second env path (CONCERNS.md flags
  env loaded twice historically; keep one loader).
- Phase 1's drizzle-zod bases in `packages/db` — `.pick()/.omit()/.extend()` in
  `packages/contracts`, never hand-redeclare shapes (Pitfall 6).

### Established Patterns
- ts-rest router `pathPrefix: '/api/v1'`; better-auth mounts at `/api/auth` — the
  global-prefix collision must be resolved deliberately (Claude's Discretion).
- Named exports + per-file modules; `snake_case` DB casing via `drizzle.config.ts`.
- Service returns `null` for not-found → controller maps to contract error (404/409).

### Integration Points
- New `AuthModule` (global guard) changes every existing endpoint from public → protected
  by default — the health + festival endpoints need explicit re-tagging in the same pass.
- `packages/contracts` newly gains auth/me/festival endpoints; `apps/api` implements them;
  no client consumes them yet (Phase 3 is the first consumer).
- Seed lives in `packages/db`; migrations use `DATABASE_URL_UNPOOLED`, runtime the pooled
  `DATABASE_URL` (`prepare:false`, ADR-005).

</code_context>

<specifics>
## Specific Ideas

- **Seed festival is `frequency-2026` / "Frequency 2026"**, `de` default, `de`+`en`
  supported, no cashless URL, no tags — user-owned data, do not substitute placeholders.
- **Dev-first email:** the phase's OTP is verified via curl/automated test against the live
  dev API, not a UI — the dev transport must make the code readable (console/Mailpit).
- **`GET /festivals` returns everything, unpaginated** — intentional for the low-count
  early state; revisit pagination only when festival count grows (not this phase).

</specifics>

<deferred>
## Deferred Ideas

- **Real Resend delivery** (account, domain verification, DNS) — flip on by env when the
  mobile client needs real inboxes (Phase 3+). Adapter is built this phase; delivery is not.
- **OTP rate-limit tuning for festival-scale shared-IP traffic** (Pitfall 8) — keep
  better-auth defaults (3/60s per IP) for dev/staging; record the decision, load-test and
  possibly add an email-keyed limit **before the first live festival**, not now.
- **Festival `date` / `place` master-data fields** → Phase 5 (FEST-01); GET /festivals
  contract kept additive so they slot in without a breaking change.
- **Pagination on `GET /festivals`** → whenever festival count justifies it (post-shell).
- **`FestivalStaff` / `PlatformAdmin` / better-auth organization plugin** → admin milestone
  (Pitfall 1 — don't let admin-side roles bleed the plugin into the visitor `MyFestival`).
- **Expo auth client, SecureStore persistence, `trustedOrigins`, deep-link guard, splash
  gating** (Pitfalls 2 & 5) → Phase 3/4 (mobile). CORS/`trustedOrigins` for the deployed
  Railway URL is a mobile-phase concern, not dev-only localhost this phase.

</deferred>

---

*Phase: 2-otp-auth-festival-backend-api*
*Context gathered: 2026-08-01*
