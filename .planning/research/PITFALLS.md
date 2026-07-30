# Pitfalls Research

## Reconciliation note (2026-07-30)

This file is UPDATED to reflect an auth-model change: the binding concept
(`docs/concept/09-onboarding-auth.md`, `docs/concept/04-domain-identity.md`; ADR-009 concretization +
ADR-016, both dated 2026-07-29) replaces **email/password** for visitors with **passwordless
email-OTP**. What changed below:

- **New Pitfalls 8–12** cover OTP-specific risk: rate-limiting/enumeration, code-expiry/resend UX,
  the "Refresh-Token" wording being a misnomer for better-auth's sliding-window session (not a
  distinct refresh-token grant), the username-availability-check race condition, and the
  Account-vs-VisitorProfile split being broken by reaching for better-auth's `username` plugin.
- **Pitfall 4 gets a clarifying update** (inline, not rewritten): "gate-less entry" (no ticket/join
  gate, per ADR-014 §5) must **not** be misread as "no tenant isolation needed" — every festival-scoped
  row is still `festivalId`-scoped and still needs a guard; gate-less only removes the *membership
  approval step*, not the *data boundary*.
- **Pitfall 1 gets a status update**: the membership-model decision it flagged as open is now resolved
  by ADR-014/016 — a plain `MyFestival(visitorId, festivalId, savedAt, camp?)` table (option "a" in the
  original pitfall), not better-auth's `organization` plugin. The pitfall's reasoning stays valid as
  a warning against *drifting* toward the plugin later; only the "still open" framing is updated.
- Pitfalls 2, 3, 5, 6, 7 and everything else (Expo Router flash/deep-link, contracts/DB drift, i18n
  literal strings, the NestJS `bodyParser:false` caveat) are **unchanged** — none of them assumed
  password-based auth, so they were not re-derived for this refresh.

**Domain:** Visitor-shell slice — better-auth (NestJS + Expo) auth, global-user-onto-multi-tenant-festival data, Expo Router gating, ts-rest/Drizzle contract-first, i18n-from-day-1
**Researched:** 2026-07-29 (refreshed 2026-07-30 for OTP auth model + ADR-016 identity model)
**Confidence:** MEDIUM (better-auth/NestJS/Expo mechanics from Context7-curated official docs; Expo Router, contract-drift, and i18n-lint patterns from general web search — treat as directional, verify against current docs during phase planning)

This file extends `.planning/codebase/CONCERNS.md` (existing audit) — it does not repeat "all endpoints public" / "no tenant guard" / "secrets optional" / "env loaded twice" / "cashless URL unvalidated," it covers what specifically goes wrong *while fixing* those things with this exact stack.

## Critical Pitfalls

### Pitfall 1: Treating better-auth's `organization` plugin as a drop-in for "festival membership"

> **Update (2026-07-30):** this decision is no longer open — ADR-014/ADR-016 finalized option (a) below:
> a plain **`MyFestival(visitorId, festivalId, savedAt, camp?)`** table, gate-less (ADR-014 §5, see
> Pitfall 4's update). The reasoning is kept as a standing warning: don't let a later feature (e.g.
> `apps/admin` Festival-Staff roles, which genuinely *does* want `organization`-plugin-shaped
> membership/roles per ADR-018) bleed the plugin back into the visitor-side `MyFestival` model.

**What goes wrong:**
ADR-009 says auth is "mandantenfähig (Organizations = Festivals)," suggesting the team may reach for better-auth's built-in `organization` plugin to model festival membership. That plugin is an invite-based membership/RBAC system (roles: owner/admin/member, an "active organization" selected per session, `requireOrgRole` middleware, invitation flows). Festipal's actual model per ADR-014/PROJECT.md is much lighter: a global user *browses a list and joins* a festival — no invites, no owner/admin/member roles for visitors, no org-switching semantics beyond "which festival am I currently in." Half-adopting the plugin (e.g. using `activeOrganization` for "current festival" but skipping roles/invitations) produces a schema and API surface that doesn't match the product, and later features (admin roles in `apps/admin`) may collide with whatever partial adoption happened here.

**Why it happens:**
The ADR wording ("Organizations = Festivals") reads like a recommendation to use the plugin, but it predates the MVP-scope refinement in ADR-014 that simplified this to a plain global-shell "Festivals" list. The plugin also looks like the "official" multi-tenant answer for better-auth, so it's the path of least resistance even where it over-fits.

**How to avoid:**
Decide explicitly, in writing (ADR or PLAN.md decision note), whether this slice uses:
(a) a custom `MyFestival(visitorId, festivalId, savedAt, camp?)` join table + a plain `TenantGuard`, or
(b) better-auth's `organization` plugin with festivals mapped to organizations.
Given this slice's scope (save/browse, no invites, no per-festival visitor roles), (a) is the better fit — reserve the `organization` plugin for `apps/admin`'s `FestivalStaff`/`PlatformAdmin` roles (ADR-016 §4, ADR-018), where real invite/role semantics exist. Record the decision so the eventual admin-side auth work doesn't silently assume the plugin is already wired in for visitors too.

**Warning signs:**
- Code references `authClient.organization.setActive()` or `activeOrganizationId` for "current festival" without any invitation/role screens ever being built.
- `packages/db` schema has both a hand-rolled `MyFestival` table AND better-auth's generated `organization`/`member` tables both trying to represent the same visitor↔festival relationship.

**Phase to address:** Phase that wires up the `user` table + better-auth server config (before the festival-list/join endpoints are built) — the membership model choice gates the schema.

---

### Pitfall 2: Auth on native (Expo) silently falls back to insecure or non-persistent storage

**What goes wrong:**
better-auth's Expo integration requires the `@better-auth/expo/client` plugin explicitly configured with `expo-secure-store` as the `storage` option, plus a `scheme` matching `app.json`, plus a `trustedOrigins: ["myapp://"]` entry on the server. If any of these are skipped — e.g. the team copies a browser-oriented `createAuthClient` snippet without the Expo plugin, or configures storage as plain AsyncStorage/MMKV instead of SecureStore — session tokens end up either unencrypted on-device or not persisted across app restarts (user has to log in every launch, defeating "session persists so they land logged-in on reopen").

**Why it happens:**
better-auth's core client API is web/cookie-first; the Expo/native path is an add-on plugin that's easy to miss when following generic docs or AI-generated snippets, especially since the code *compiles and appears to work* in Expo Go / simulator even when storage is wrong (SecureStore has no simulator errors that surface loudly).

**How to avoid:**
Pin the Expo client setup to the documented pattern: `expoClient({ scheme, storagePrefix, storage: SecureStore })` on the client, `trustedOrigins` including the app scheme on the server. Verify persistence explicitly: force-quit the app after login, relaunch, confirm still authenticated — don't rely on hot-reload behavior during dev, which can mask storage failures.

**Warning signs:**
- Session survives Fast Refresh but not a full app kill/relaunch.
- API calls from the Expo app work in dev (Metro/localhost, same-origin-ish) but fail once pointed at the deployed Railway URL — usually a missing `trustedOrigins` or CORS entry.
- Any use of `AsyncStorage` (not `expo-secure-store`) for the auth token.

**Phase to address:** Phase that scaffolds `apps/mobile` and wires the first authenticated API call — write a manual "kill and relaunch" check into that phase's UAT, not just "login succeeds."

---

### Pitfall 3: NestJS's better-auth integration protects routes globally by default — new endpoints "inherit" auth silently, but existing/new public ones need an explicit opt-out

> **Update (2026-07-30) — body-parser conflict de-risked to MEDIUM after verifying current docs:**
> The `bodyParser: false` × ts-rest ordering worry below is largely handled by the current wrapper.
> `@thallesp/nestjs-better-auth` (requires `better-auth >= 1.5.0`) **automatically re-applies**
> `express.json()`/`urlencoded` for all non-auth routes once the global parser is disabled — no manual
> `app.use(express.json())` with path exclusion is needed. ts-rest is the *easy* case here: unlike
> oRPC/`@orpc/nest` (which parse bodies themselves per procedure, like better-auth wants raw),
> `@ts-rest/nest` handlers are plain NestJS controllers that just consume the re-applied `req.body`.
> Recommended wiring: `NestFactory.create(AppModule, { bodyParser: false })` +
> `AuthModule.forRoot({ auth, bodyParser: { json: { limit: '2mb' }, urlencoded: { limit: '2mb', extended: true } } })`.
> The spike now **confirms** rather than **designs** — verify three things: (1) the 2-request proof
> (OTP-verify POST to `/api/auth/*` AND a ts-rest `save` POST both receive their body); (2) **global-prefix
> collision** — ts-rest is on `/api/v1` but better-auth mounts at `/api/auth`; either exclude auth from
> `setGlobalPrefix('api/v1')` or set better-auth `basePath` to `/api/v1/auth` and align the Expo client;
> (3) pin `better-auth >= 1.5.0` when the CLI-generated auth tables land in `packages/db` (Phase 1).
> The hand-rolled `@All('auth/*path')` catch-all drops from Plan B to **Plan C** — only if the wrapper
> clashes with this specific NestJS × ts-rest × global-prefix combo. Sources: better-auth NestJS docs,
> ThallesP/nestjs-better-auth README (verified 2026-07-30).

**What goes wrong:**
The standard NestJS integration (`@thallesp/nestjs-better-auth`'s `AuthModule.forRoot()`) registers a **global** `AuthGuard`, flipping the current "everything public" state to "everything protected unless marked `@AllowAnonymous()`." This is good for closing the CONCERNS.md "all endpoints public" gap, but two failure modes are common: (1) genuinely public routes (health check, the OTP request/verify endpoints themselves) break because nobody added `@AllowAnonymous()`, causing a confusing chicken-and-egg where you can't request a sign-in code because requesting a code requires being signed in; (2) the reverse — a route the team *intends* to protect gets `@AllowAnonymous()` copy-pasted onto it during debugging and never removed, silently reopening it. The integration also requires `bodyParser: false` in `NestFactory.create()`; forgetting this breaks all body-parsing app-wide, not just for auth routes, in a way that's non-obvious to diagnose.

**Why it happens:**
Global guards are easy to add and easy to under-think per-route; the failure surfaces at runtime per-endpoint rather than at compile time, and `bodyParser: false` is a bootstrap-level flag decoupled from the auth module itself.

**How to avoid:**
When wiring the auth module, immediately enumerate every existing and new endpoint and tag it explicitly (`@AllowAnonymous()`, `@OptionalAuth()`, or protected-by-default) as one deliberate pass rather than reactively. Add a lint/test check (or at minimum a PR checklist item) that flags any new `@AllowAnonymous()` usage for review, since it should be rare and intentional post-MVP. Confirm `bodyParser: false` is set and add a smoke test that POSTs a body to a non-auth endpoint to catch regressions.

**Warning signs:**
- The email-OTP send/verify endpoints return 401 in integration tests.
- A previously-protected endpoint (e.g. `GET /festivals/:id`) suddenly returns data without a session during manual testing — check for a stray `@AllowAnonymous()`.
- POST requests to any endpoint return empty/undefined body server-side after auth module was added.

**Phase to address:** Phase that adds the better-auth NestJS module + wires guards onto existing festival endpoints (directly follows the CONCERNS.md "no auth implementation" fix). Verification: an explicit table of every endpoint × its auth annotation, reviewed at end of phase.

---

### Pitfall 4: Festival-list endpoint returns unauthorized/unjoined festival data, or "saving" a festival doesn't actually establish an enforceable tenant boundary

> **Update (2026-07-30) — read this alongside ADR-014 §5's "gate-less" language:** "gate-los" means the
> **join/access step has no ticket/approval gate** — any logged-in visitor can save or open any
> festival, no invite or ticket check required. It does **not** mean festival-scoped data is
> unscoped. Every festival-scoped row still carries `festivalId` and still needs a guard; "gate-less"
> removed a *product-level friction step* (no ticket check to enter), it did not remove the
> *engineering-level tenant boundary* (ADR-014 §1–2: "Jeder festival-scoped Request/Query trägt eine
> geprüfte `festivalId`"). Concretely for this slice: `MyFestival` still needs a guard that checks
> `(visitorId, festivalId)` exists before serving anything gated behind "my festivals" — the *absence*
> of a ticket check does not imply the *absence* of a membership/scope check. The distinction below
> (list vs. join, "has a session" vs. "has membership for this festivalId") is unchanged and still the
> single highest-priority check in this slice.

**What goes wrong:**
Two distinct but related mistakes:
1. **List endpoint over-exposes.** The "browse festivals" list is meant to be public-ish (discoverable), but once a user is authenticated, downstream calls (overview, profile, "my festivals") need to distinguish festivals the user has *saved* from all festivals that merely *exist*. A common mistake is building the list endpoint to just `SELECT * FROM festival` and reusing that same query/response shape for "my festivals," so the client ends up trusting client-side filtering to decide what the user has saved — trivially bypassable and confusing once a second client (admin) exists.
2. **Saving doesn't gate anything.** The user "saves" a festival (creates a `MyFestival` row), but subsequent festival-scoped endpoints (overview, later timetable/map/etc.) don't actually check that relation — they only check that a `festivalId` was passed and the user has *some* valid session, not that the user saved/opened *that* festival. This is exactly the CONCERNS.md "No Per-Request Tenant Validation" gap, but worth restating narrowly for this slice: even after adding a `TenantGuard`, it's easy to implement it as "user is authenticated" rather than "user is authenticated AND has a `MyFestival` row for this festivalId" — because "gate-less" (no ticket) is easy to misread as "no check at all" (see the update note above), and because the membership check requires an extra query/join that's easy to skip under time pressure for a "just a placeholder home screen" feature.

**Why it happens:**
The list/browse endpoint and the "enter festival" endpoint feel like separate, low-stakes reads early on ("it's just a list of names"), so the tenant check gets deferred along with "real" content features — but the *pattern* set here (does festival access require a `MyFestival` row, or just a valid festivalId?) is what every later phase (timetable, map, marketplace) will copy. Note that per ADR-014 §5, "Festival betreten" explicitly allows opening a **browsed-but-not-saved** festival too — so the guard question isn't strictly "has `MyFestival`" for *every* endpoint, but every endpoint must make an explicit, deliberate choice (public read vs. session-scoped vs. `MyFestival`-scoped), not default to "any session passes."

**How to avoid:**
Define two contracts from the start: `GET /festivals` (public or session-only, returns discoverable festivals, no save-gated fields) and `GET /me/festivals` (session-required, returns only festivals the user saved via `MyFestival`). Implement `TenantGuard`/middleware so it queries `MyFestival` (or the relevant relation) for `(visitorId, festivalId)` where the endpoint semantics require it, and 403s on mismatch — apply it to the overview endpoint even though overview is "just a placeholder," so the pattern exists before content-heavy phases build on top of it. Write one test explicitly: "user A saves festival 1; user A requests a `MyFestival`-scoped endpoint for festival 2 (never saved) → 403."

**Warning signs:**
- Overview/profile screens render successfully for a `festivalId` the current user never saved, when tested manually by editing the URL/param, *for an endpoint that was supposed to be `MyFestival`-scoped*.
- `TenantGuard` implementation has no DB query in it (just checks `req.user` exists).
- Contract for "my festivals" and "browse festivals" is the same Zod schema/endpoint with a client-side `.filter()`.
- Someone argues "gate-less means we don't need a guard here" — that conflates the product decision (no ticket approval) with the engineering requirement (still `festivalId`-scoped data).

**Phase to address:** Phase that builds the festival-list + save + home/overview endpoints (the core-value slice itself). This is the single highest-priority multi-tenant check for this milestone — verify with an explicit cross-tenant-denial test, not just happy-path UAT.

---

### Pitfall 5: Expo Router shows a flash of protected content (or bounces to login incorrectly) because auth state isn't resolved before first navigation

**What goes wrong:**
On cold start, the Expo app needs to read the persisted session (async SecureStore read) before it knows whether to route to `(auth)` or `(protected)`. If the root layout renders its default/first route before that resolves, users briefly see the wrong screen (protected content flashes before redirect to login, or login flashes before redirect to home for an already-authenticated user) — jarring and can leak layout/data momentarily. A related but distinct bug: the auth check is done once at app boot instead of being re-evaluated on every navigation, so a deep link into a protected route (e.g. a push notification or share link straight to `/festival/[id]`) skips the auth gate entirely because it doesn't pass through the same guard the initial route did.

**Why it happens:**
Expo Router's file-based routing renders eagerly; the natural instinct is to gate with a simple `if (!user) return <Redirect />` inside a single screen component rather than at the route-group layout level, which doesn't cover deep links or sibling routes, and doesn't account for the async loading state (undefined vs. null vs. resolved user).

**How to avoid:**
Use `SplashScreen.preventAutoHideAsync()` and hide it only after the session bootstrap resolves (loading/unknown vs. authenticated vs. unauthenticated as three explicit states, not two). Structure routes into `(auth)` and `(protected)` (or use Expo Router's `Stack.Protected`) groups with the guard at the **group layout** level so it applies uniformly to every screen and re-evaluates on every navigation event, including deep links. Note per STACK.md §4 (2026-07-30): the first-login profile-completion screen is a **third** state alongside authenticated/unauthenticated — a session can exist but still need to route to `onboarding/profile` rather than `(app)`, so the guard logic is a three-way branch, not two.

**Warning signs:**
- Visible flicker between splash/login/home on cold start during manual testing, especially on a throttled/first-run device (SecureStore read is not instant).
- A deep link (or `expo-router` `Linking` test URL) to a protected screen opens directly without ever hitting the login screen while logged out.
- A brand-new user (session exists, no `VisitorProfile` row yet) lands on `(app)` instead of the profile-completion screen because the guard only checked `!!session`, not profile completeness.

**Phase to address:** Phase that scaffolds `apps/mobile` navigation/shell (after auth client exists, before/alongside the festival-list screen) — include a manual deep-link-while-logged-out test in that phase's UAT.

---

### Pitfall 6: `packages/contracts` Zod schemas hand-redeclare shapes that drift from `packages/db` Drizzle schema

**What goes wrong:**
CONCERNS.md already flags that `packages/contracts/src/schemas.ts` manually redeclares types instead of deriving from `packages/db`. This slice is exactly where the problem compounds: it adds a `user` table (better-auth), a `visitor_profile` table (ADR-016), a `MyFestival` join table, and new auth-related contracts (OTP send/verify, `GET /me`, festival list/save, username availability) all at once. If each of these gets a hand-written Zod object in contracts independent of the Drizzle table, a column rename or nullable-field change in the DB schema (e.g. adding `locale` to `user`, or renaming `MyFestival.savedAt`) won't be caught by the type system — it'll surface as a runtime 500 or a silently-wrong field in the mobile app, discovered late.

**Why it happens:**
Contracts and DB schema are edited by the same person/session in early scaffolding, so the drift risk feels theoretical ("I'll keep them in sync manually") — but this is precisely the phase where multiple new tables and endpoints are added together, maximizing the chance of missing one field somewhere.

**How to avoid:**
Introduce `drizzle-zod` (or equivalent) now, before the user/visitor-profile/membership tables are hand-declared twice: generate base Zod schemas from Drizzle table definitions in `packages/db`, and have `packages/contracts` import + `.pick()/.omit()/.extend()` those rather than redeclaring shapes from scratch. This is a small effort now (few tables) vs. a larger retrofit once festival-scoped content tables (timetable, news, marketplace) are added later, per the ADR-012 translation-table pattern that will multiply table count further.

**Warning signs:**
- Any Zod schema in `packages/contracts` that duplicates a Drizzle table's field list without importing from `packages/db`.
- A DB migration changes a column and no contracts file needs to change (should be a compile error, not silence).

**Phase to address:** Phase that adds `user`/`visitor_profile`/membership schema to `packages/db` and the corresponding auth/festival-list contracts — adopt `drizzle-zod` in that same phase, not as later cleanup.

---

### Pitfall 7: i18n scaffolding lands but Lingui's own lint doesn't catch hardcoded strings, so they creep in from the first screen

**What goes wrong:**
CONCERNS.md notes `packages/i18n` is empty — this slice is where the first real UI strings (OTP email-entry/code-entry screens, profile-completion form, festival list, home nav labels, placeholder Profile/Friends text) get written, under time pressure to "just ship the shell." Lingui's own ESLint plugin catches macro-usage mistakes (e.g. malformed `t()` calls) but does **not** by default flag plain JSX text or string literals that were never wrapped in `t()`/`<Trans>` in the first place — so a developer typing `<Text>Code senden</Text>` instead of `<Text>{t\`Code senden\`}</Text>` gets no warning. Because this is the *first* UI code in the repo, there's no existing pattern to copy from, making it the highest-risk moment for hardcoded strings to become the norm rather than the exception.

**Why it happens:**
i18n infrastructure (catalogs, extraction, compile step) is often set up "for later" once there's real content to translate, but ADR-012/CLAUDE.md require i18n from day 1 — if the shell's own auth/nav strings aren't wrapped, every screen built after copies the same shortcut.

**How to avoid:**
Set up Lingui extraction + a literal-string-detection ESLint rule (a plugin like `eslint-plugin-i18next`'s `no-literal-string` pattern, or an i18n-specific linter layered on top of Lingui) *before* writing the first screen in this phase, not after. Run `pnpm lingui extract` as part of CI or a pre-commit check so untranslated strings fail visibly rather than silently shipping. Since this phase only ships DE/EN, keep the catalog small but real — don't stub it with a TODO.

**Warning signs:**
- Grep for quoted string literals inside JSX in `apps/mobile` turns up matches outside of `t()`/`<Trans>` after the shell screens are built.
- `pnpm lingui extract` output has near-zero messages despite multiple screens existing.

**Phase to address:** Phase that builds the first Expo screens (login/OTP, festival list, home) — set up Lingui + lint rule as a prerequisite task within that phase, before screen implementation starts.

---

### Pitfall 8 (new, 2026-07-30): OTP rate-limiting is generous enough to allow enumeration, and shared festival Wi-Fi can trip it for everyone

**What goes wrong:**
better-auth's `emailOTP` plugin rate-limits `send-verification-otp`/`sign-in/email-otp` etc. to **3 requests per 60-second window by default**, keyed by better-auth's general rate limiter (IP + path). Two opposite failure modes follow from this: (1) **enumeration risk** — an attacker can still send 3 OTP requests per minute per IP against arbitrary emails; since `sign-in/email-otp` auto-registers unknown emails, the endpoint's behavior (200 either way, per better-auth's design) doesn't leak whether an email is already registered *by response shape* — but repeated requests still let someone spam a real user's inbox with codes (nuisance/DoS, not enumeration in the classic sense, since sign-in doesn't distinguish new vs. existing users). (2) **False-positive lockout at a real festival** — many visitors sharing one venue Wi-Fi/NAT egress IP can collectively exhaust a 3-per-minute-per-IP budget, blocking legitimate sign-ins during exactly the high-traffic "everyone logs in at the gate" moment this app is built for.

**Why it happens:**
The defaults are tuned for a generic web app, not a "thousands of people on one Wi-Fi AP at a festival" traffic shape; nobody revisits rate-limit config until it's already misbehaving in either direction (either "we got spammed" or "the gate is down and everyone's rate-limited").

**How to avoid:**
Treat `emailOTP`'s `rateLimit.window`/`rateLimit.max` as a config decision to make deliberately, not leave at the untouched default: confirm with product whether the default (3/60s per IP) is acceptable for festival-scale concurrent sign-in, and consider keying supplementary limits by *email* (in addition to IP) if the default per-IP behavior proves too permissive per-target or too strict for shared-IP venues — this may require a custom rate-limit rule on top of the plugin's default, not just a config number change. Load-test the sign-in flow with a simulated shared-IP burst before the first real festival launch, not after.

**Warning signs:**
- Support reports of "I can't log in, it says try again later" clustering at festival gate-opening times.
- No test exists for "N users behind the same IP sign in within 60 seconds."

**Phase to address:** Phase that wires the `emailOTP` plugin server-side (STACK.md §6.1) — record the rate-limit decision as a config comment/ADR note, revisit before the first live festival event (not required to solve for MVP dev/staging).

---

### Pitfall 9 (new, 2026-07-30): Code-expiry and resend UX mismatches — a "wrong code" error that's actually just an expired one, or a resend that silently invalidates the code still sitting in the user's inbox

**What goes wrong:**
`emailOTP`'s default `expiresIn` is 300 seconds (5 minutes) and the default resend behavior mints a **brand-new** code, invalidating the old one, unless `resendStrategy: "reuse"` is explicitly set. Two UX bugs follow: (1) a user who takes >5 minutes to switch to their mail app and back gets a generic "invalid code" error that's actually "expired code" — if the client doesn't distinguish these (better-auth's error surface for a wrong vs. expired OTP may not be differentiated without checking the actual error code), the user doesn't know to request a new one vs. retry typing; (2) without `resendStrategy: "reuse"`, tapping "Resend" (an explicit onboarding-flow affordance per `09-onboarding-auth.md` §2) invalidates the code in the *first* email — if the user still has that first email open and types its code, they get a confusing failure even though they "did what the screen told them."

**Why it happens:**
The plugin's defaults are reasonable in isolation but weren't chosen with this specific two-email-race scenario in mind; `resendStrategy` is an easy option to miss since the "just make sign-in work" happy path doesn't exercise Resend at all.

**How to avoid:**
Set `resendStrategy: "reuse"` explicitly (STACK.md §6.1) so Resend extends the existing code's life rather than minting a new one. Surface a distinguishable client-side error state for "expired" vs. "wrong" if better-auth's response differentiates them (verify the actual error code shape during implementation — this is a MEDIUM-confidence claim, not yet verified against the live error response), and default to "expired, request a new code" copy with a one-tap resend rather than a generic "wrong code, try again" that invites the user to keep retyping a code that can never succeed.

**Warning signs:**
- QA reports "the code didn't work" that turn out to be timing (>5 min) rather than a typo.
- Resend button is wired without `resendStrategy: "reuse"` set server-side, and a manual test (get code, resend, try the first code) fails.

**Phase to address:** Phase that builds the OTP code-entry screen — include the ">5 min wait" and "resend then use old code" cases explicitly in that phase's UAT script.

---

### Pitfall 10 (new, 2026-07-30): "Refresh-Token" in the concept doc is a misnomer for better-auth's session model — building a separate refresh flow duplicates what the Expo client already does

**What goes wrong:**
`09-onboarding-auth.md` §4 says "Mobil langlebig (Refresh-Token) — bleibt eingeloggt; bei Ablauf Re-Auth via OTP," using OAuth-style "refresh token" vocabulary. better-auth does not have a distinct short-lived-access-token + long-lived-refresh-token pair; it has **one session token** with a sliding expiration (`session.expiresIn` + `session.updateAge`), auto-persisted to SecureStore by `@better-auth/expo`'s client on every response (STACK.md §6.2). A team member who takes the concept doc's wording literally may try to build a custom `/auth/refresh` endpoint, a manual token-rotation scheme, or reach for the `jwt`/`bearer` plugins expecting OAuth-style refresh semantics — none of which is how better-auth's default session model works, and all of which duplicate (and can conflict with) the automatic cookie-refresh the Expo client already performs.

**Why it happens:**
"Refresh-Token" is the closest everyday vocabulary for "stays logged in for a long time," and the concept doc is written by product/design, not against better-auth's actual session primitives — the wording is directionally correct about the *desired behavior* (long-lived, auto-renewing) but wrong about the *mechanism*.

**How to avoid:**
Implement via `session.expiresIn`/`session.updateAge` only (STACK.md §6.2); do not build a custom refresh endpoint or token-rotation logic. When "re-auth via OTP" is needed (session actually expired, e.g. `updateAge` window lapsed from inactivity beyond `expiresIn`), the correct behavior is simply routing back to the OTP sign-in screen — there is no "silent refresh" fallback to attempt first.

**Warning signs:**
- A PR adds a `/auth/refresh` NestJS endpoint or manual token-swap logic that isn't part of better-auth's plugin surface.
- Session-expiry handling in the Expo app tries to call something before falling back to OTP re-auth, rather than just checking `useSession()` and redirecting.

**Phase to address:** Phase that configures `session.expiresIn`/`updateAge` server-side and wires the "session expired → back to login" redirect client-side — a short written note ("we use sliding sessions, not refresh tokens") in that phase's plan avoids the misreading.

---

### Pitfall 11 (new, 2026-07-30): Username-availability check is advisory, not a lock — a race between the live check and the actual profile-completion insert can still 409

**What goes wrong:**
The live username-availability check (STACK.md §8) is a plain `SELECT` against a case-insensitive index — between that read and the user tapping "Fertig" (profile-completion `POST`), another visitor can claim the same username. If the `completeProfile` endpoint doesn't independently enforce uniqueness at the database level (a `UNIQUE` index on `lower(username)`) and instead trusts the earlier "available" response, two visitors can end up with the same username, or a duplicate-insert crashes with an unhandled DB error instead of a clean `409`.

**Why it happens:**
"We already checked availability" feels like enough, especially since the check-then-insert window is usually milliseconds — but it's not zero, and a profile-completion form left open across a slow network/backgrounded app extends that window meaningfully (a user can type a username, get "available," background the app for a minute while a duplicate is claimed, then foreground and submit).

**How to avoid:**
Make the case-insensitive `UNIQUE` index (STACK.md §7, `lower(username)`) the actual source of truth: the availability check is UX sugar for instant feedback, but `completeProfile` must catch the Postgres unique-violation (`23505`) and map it to the contract's `409`, prompting the user back to the username field rather than surfacing a generic 500. Do not skip server-side re-validation just because the client already showed "available."

**Warning signs:**
- `completeProfile`'s implementation has no `try/catch` around the insert, or doesn't check for Postgres error code `23505` specifically.
- No `UNIQUE` index exists on `visitor_profile` (only application-level `SELECT`-then-`INSERT` checks, which is exactly the TOCTOU bug this pitfall describes).
- No test exercises "two concurrent `completeProfile` calls with the same username" (or a sequential simulation: check available → insert A → insert B with same username → expect B's `409`).

**Phase to address:** Phase that builds `packages/db`'s `visitor_profile` table and the `completeProfile` contract handler — the unique index is a migration-time requirement, not a follow-up.

---

### Pitfall 12 (new, 2026-07-30): Reaching for better-auth's `username` plugin breaks the Account/VisitorProfile split ADR-016 requires

**What goes wrong:**
better-auth ships a first-party `username` plugin with a convenient `isUsernameAvailable()` client call — an obvious-looking shortcut for the live-check requirement in `09-onboarding-auth.md` §5. But the plugin adds `username`/`displayUsername` columns directly to the shared `user` table (better-auth's `Account`), the same table `FestivalStaff`-only and `PlatformAdmin`-only accounts use. ADR-016 is explicit: "Ein reiner Staff-Account hat **keinen** `username`/`avatar`." Adopting the plugin either (a) leaves those columns permanently `NULL` for every non-visitor account — schema noise that misrepresents the domain model and invites a future dev to wonder if it's a bug — or (b) tempts someone to *also* enable the plugin's username+password sign-in surface for convenience, which the product does not want (visitors are OTP-only; the plugin's sign-in method is a separate, unwanted credential path).

**Why it happens:**
The plugin is the first search result for "better-auth username" and looks like the "official" answer; the cost of the schema misplacement isn't visible until someone builds the `FestivalStaff` admin flow and asks "wait, why does staff have a null username column."

**How to avoid:**
Do not add the `username` plugin. Model `username`/`displayName`/`avatar`/`socials` on a separate `visitor_profile` Drizzle table keyed by `accountId` (STACK.md §7), with its own case-insensitive unique index and its own ts-rest endpoint for availability (STACK.md §8). This is a few dozen extra lines against the small number of MVP tables, and keeps the Account/VisitorProfile/FestivalStaff/PlatformAdmin boundary ADR-016 specifies intact at the schema level, not just by convention.

**Warning signs:**
- `packages/db`'s generated better-auth schema (`npx auth generate` output) contains `username`/`displayUsername` columns on the `user` table.
- Any code path calls `authClient.username.isUsernameAvailable` or `authClient.signIn.username`.
- A `FestivalStaff`-only account (created via the admin invite flow, ADR-018) has a `username` field at all, even `NULL` — the correct model has no such field to be null.

**Phase to address:** Phase that adds `user`/`visitor_profile` schema to `packages/db` and wires the `emailOTP` plugin (STACK.md §6–§7) — decide and document "no `username` plugin" in the same phase, before anyone reaches for it under time pressure.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Skip `drizzle-zod`, hand-write contracts for user/visitor-profile/membership tables | Faster to ship the first 2-3 tables | Compounds with every future table (timetable, news, marketplace translation tables per ADR-012) | Never for this milestone — table count is about to grow fast |
| Use better-auth `organization` plugin without deciding roles/invites now | Reuses "official" multi-tenant primitive, less custom code | Locks in invite/role semantics the visitor product doesn't need yet; may conflict with later admin-side org modeling | Only if the team commits now to organization-plugin-for-everything, including admin — otherwise use `MyFestival` (visitor side) and reserve the plugin for Staff/Admin (ADR-018) |
| Gate festival-scoped endpoints on "has a session" instead of "has a `MyFestival`/relevant relation for this festivalId" | Simpler `TenantGuard`, ships faster | Multi-tenancy is broken exactly where CONCERNS.md already flagged it — every later phase inherits the hole; "gate-less join" is not "gate-less data" (Pitfall 4) | Never — this is the one thing this slice must get right |
| Defer Lingui literal-string lint rule to "later cleanup" | Ships screens faster without extra tooling setup | Every hardcoded string becomes a manual find-and-fix later, across a growing app | Acceptable only for the very first throwaway spike screen, never for shipped shell UI |
| Store better-auth session as plain AsyncStorage instead of SecureStore during Expo scaffolding | Works identically in dev, slightly less setup | Ships an insecure-storage bug to "done" screens that's easy to forget once it "works" | Never — SecureStore is a one-line config difference |
| Adopt better-auth's `username` plugin instead of a `visitor_profile` table (2026-07-30) | Free `isUsernameAvailable()` call, less custom code | Puts visitor-only fields on the shared Account table, breaks ADR-016's Account/VisitorProfile split, invites an unwanted username+password sign-in surface | Never |
| Skip `resendStrategy: "reuse"` (2026-07-30) | Zero extra config | "Resend" invalidates the code still open in the user's first email → confusing failures (Pitfall 9) | Never — one-line config |
| Trust the username-availability check as authoritative, skip the DB unique index (2026-07-30) | Simpler `completeProfile` handler | TOCTOU race lets two visitors claim the same username, or produces an unhandled 500 instead of a clean 409 (Pitfall 11) | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| better-auth + Expo | Using the plain `better-auth/react` client without `@better-auth/expo/client`, losing native storage/deep-link handling | Use `expoClient({ scheme, storagePrefix, storage: SecureStore })` and add the app scheme to server `trustedOrigins` |
| better-auth + NestJS | Forgetting `bodyParser: false` on `NestFactory.create()`, breaking all POST bodies app-wide | Set it explicitly when adding `AuthModule.forRoot({ auth })`; smoke-test a non-auth POST endpoint afterward |
| better-auth `emailOTP` + Resend (2026-07-30) | Awaiting the `resend.emails.send()` call inline inside `sendVerificationOTP` before responding to the client | Fire-and-forget (`void sendOtpEmail(...)`), per better-auth's own docs (avoids timing-attack surface + blocking on a third-party API) |
| ts-rest + Drizzle | Hand-declaring Zod schemas in `packages/contracts` that parallel (and drift from) Drizzle table definitions | Generate base schemas with `drizzle-zod` from `packages/db`, compose/refine in contracts |
| Lingui + Expo/RN | Assuming Lingui's ESLint plugin catches hardcoded strings by default | Add a literal-string-detection rule/linter on top; run `lingui extract` in CI |
| CORS + Expo dev client vs. deployed app | Configuring CORS/`trustedOrigins` only for `localhost` during dev, breaking auth once pointed at the Railway-hosted API | Include both the dev scheme/origin and the deployed API's expected client origins from the start; document in `.env.example` |
| better-auth `emailOTP` rate limiting (2026-07-30) | Leaving the 3-per-60s-per-IP default untouched and untested against festival-scale shared-IP traffic | Load-test / explicitly decide the rate-limit config before the first live event (Pitfall 8) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Auth session token stored in AsyncStorage/MMKV instead of SecureStore on native | Token readable by any code with device/app-sandbox access, no OS-level encryption | Use `expo-secure-store` explicitly via `expoClient({ storage: SecureStore })`; verify in code review |
| `TenantGuard` checks "is authenticated" instead of "has the relevant relation for festivalId" | Any logged-in user can read another user's/festival's scoped data by guessing/enumerating `festivalId` (already flagged in CONCERNS.md, restated for this slice's `MyFestival` model — "gate-less join" ≠ "no scope check," Pitfall 4) | Guard must query the relevant relation for `(userId, festivalId)` where the endpoint's semantics require it, not just session presence |
| Global `AuthGuard` bypassed via stray `@AllowAnonymous()` left on a sensitive route during debugging | Silent reopening of a protected endpoint | PR review checklist item for any new `@AllowAnonymous()`/`@OptionalAuth()` usage |
| `trustedOrigins` / CORS configured permissively ("allow the app scheme and *") to unblock dev quickly | Opens auth endpoints to origin spoofing | Whitelist exact scheme(s) and exact deployed origins only; no wildcards |
| `sendVerificationOTP` errors (email provider down) surfaced directly to the client, or awaited before responding (2026-07-30) | Timing-attack surface (response latency reveals server-side behavior); a Resend outage becomes a user-facing sign-in outage | Fire-and-forget the send, log/alert failures out-of-band, always return success from the OTP-request endpoint regardless of delivery outcome (matches better-auth's own guidance) |
| `visitor_profile.username` uniqueness enforced only at the application layer, no DB unique index (2026-07-30) | Race condition allows duplicate usernames; breaks "vergisst man nicht" search/add-friend use case (`04-domain-identity.md` §3) | `CREATE UNIQUE INDEX ... ON visitor_profile (lower(username))`, catch `23505` server-side (Pitfall 11) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|------------------|
| Flash of login screen for an already-authenticated user (or vice versa) on cold start | Feels broken/janky, undermines "core value = fast entry to festival experience" | Hold splash screen until session bootstrap resolves; three-state loading/authed/unauthed logic (now four-state including "authed but profile incomplete," see Pitfall 5 update) |
| Deep link into a protected route while logged out silently 404s or crashes instead of redirecting to login-then-continue | User loses the destination context (e.g. a shared festival link) | Guard at layout level, capture intended destination, redirect back after login |
| Hardcoded English strings on the very first screens users see (OTP entry, festival list) | Breaks the "app and admin are multilingual from day 1" promise immediately and visibly | Wrap every user-facing string in `t()`/`<Trans>` from the first commit of these screens |
| Generic "wrong code" error shown for an expired (not mistyped) OTP (2026-07-30) | User keeps retrying a code that can never succeed instead of requesting a new one | Distinguish expired vs. wrong where the API response allows it; default copy nudges toward "request a new code" (Pitfall 9) |
| "Resend" invalidates the code sitting in the user's already-open first email (2026-07-30) | User taps the code from the first email right after hitting Resend and gets a confusing failure | `resendStrategy: "reuse"` server-side (Pitfall 9) |

## "Looks Done But Isn't" Checklist

- [ ] **Login/session persistence:** Often missing a real force-quit-and-relaunch test — verify by killing the app process, not just backgrounding it or hot-reloading.
- [ ] **Festival save → tenant enforcement:** Often missing the actual `MyFestival` check in `TenantGuard` — verify with a test where an authenticated user requests a `MyFestival`-scoped endpoint for a festival they never saved and confirm 403, not 200. Don't accept "it's gate-less" as a reason to skip this (Pitfall 4).
- [ ] **Auth-gated navigation:** Often missing deep-link coverage — verify by opening a protected route URL directly while logged out, not just by clicking through the app.
- [ ] **Contracts ↔ DB alignment:** Often missing derivation from Drizzle — verify by renaming a DB column and confirming a contracts-side compile error occurs, not silence.
- [ ] **i18n on shell screens:** Often missing wrapping on "just placeholder" text (Profile/Friends placeholders count) — verify with a grep for unwrapped string literals in JSX before calling the phase done.
- [ ] **CORS/trustedOrigins for real deployment:** Often only configured for localhost dev — verify auth works against the actual Railway-deployed API URL from a real device, not just simulator-to-localhost.
- [ ] **OTP resend + expiry (2026-07-30):** Often only tested happy-path (request code, type it immediately) — verify the >5-minute-wait case and the "resend then use the first email's code" case explicitly (Pitfall 9).
- [ ] **Username uniqueness (2026-07-30):** Often only tested via the live-check endpoint — verify the DB-level unique index actually rejects a concurrent duplicate insert with a clean 409, not a 500 (Pitfall 11).
- [ ] **Account/VisitorProfile boundary (2026-07-30):** Often assumed correct because "it works for a visitor" — verify by creating a Staff-only account (ADR-018 invite flow, even a stub) and confirming it has no `username`/`avatar` fields at all (Pitfall 12).

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| Organization-plugin/`MyFestival` mismatch discovered late | MEDIUM | Pick one model, write a migration to consolidate membership/save data into it, update `TenantGuard` and contracts accordingly — contained to auth/festival modules, doesn't touch content tables yet at this stage |
| Missing tenant check on overview endpoint found post-ship | MEDIUM–HIGH (depends on how many later endpoints copied the same guard) | Fix `TenantGuard` once at the shared middleware/guard level (not per-endpoint), add the cross-tenant-denial test, audit every festival-scoped endpoint added since |
| Contract/DB drift causes a runtime field mismatch | LOW–MEDIUM | Backfill `drizzle-zod` for the affected tables, regenerate contracts, add a CI step that fails on divergence going forward |
| Hardcoded strings found across shell screens | LOW (early) / MEDIUM (if many screens already built) | Sweep with the literal-string lint rule once added, run `lingui extract`, replace flagged strings — cheaper the earlier it's caught, hence prevention-first priority |
| Insecure/non-persistent session storage shipped | LOW | One-line client config fix (`storage: SecureStore`), but requires forcing all existing users to re-login once corrected — communicate if already in any test/prod usage |
| `username` plugin already adopted, fields on shared `user` table discovered late (2026-07-30) | MEDIUM | Migrate `username`/`displayUsername` data into a new `visitor_profile` table keyed by `accountId`, drop the plugin, drop the columns from `user`, update contracts/client calls from `authClient.username.*` to the custom endpoints |
| Duplicate usernames already exist due to missing unique index (2026-07-30) | MEDIUM | Add the `lower(username)` unique index, resolve conflicts manually (append a suffix or prompt affected users), then enforce going forward |
| Rate-limit defaults too strict/loose for real festival traffic, discovered live (2026-07-30) | LOW–MEDIUM (config-only, but needs a fast deploy path during an event) | Adjust `emailOTP`'s `rateLimit.window`/`max` config, redeploy — keep this a same-day-fixable knob, not buried behind a longer release process |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Organization-plugin vs. `MyFestival` mismatch | Phase: `user` table + better-auth server wiring | Written decision (ADR or plan note) on membership model before schema is created |
| Native session storage/persistence | Phase: `apps/mobile` scaffolding + auth client wiring | Manual force-quit/relaunch test in UAT |
| Global AuthGuard mis-tagging (public routes broken / protected routes opened) | Phase: better-auth NestJS module + guards on existing endpoints | Endpoint × auth-annotation table reviewed at phase end |
| Festival list/save without real tenant enforcement (gate-less ≠ scope-less) | Phase: festival-list + save + home/overview endpoints (core-value slice) | Cross-tenant-denial test: user requests a `MyFestival`-scoped festival they haven't saved → 403 |
| Expo Router auth-flash / deep-link bypass / missing profile-completion branch | Phase: `apps/mobile` navigation/shell scaffolding | Manual deep-link-while-logged-out test + "new user with no VisitorProfile" test |
| Contracts/DB schema drift | Phase: `user`/`visitor_profile`/membership schema + auth contracts | `drizzle-zod` adopted in the same phase; compile-time check on column rename |
| Hardcoded strings on shell screens | Phase: first Expo screens (OTP login, festival list, home) | Lingui extract + literal-string lint rule run before phase sign-off |
| OTP rate-limit tuning for festival-scale shared IPs (new) | Phase: `emailOTP` plugin server wiring | Config decision documented; load test before first live event |
| OTP expiry/resend UX (new) | Phase: OTP code-entry screen | UAT covers >5min wait + resend-then-use-old-code cases |
| "Refresh-Token" misreading → custom refresh flow built (new) | Phase: session config (`expiresIn`/`updateAge`) + expiry→re-auth redirect | Written note confirming sliding-session model, no custom refresh endpoint exists |
| Username-availability race / missing unique index (new) | Phase: `visitor_profile` table + `completeProfile` contract handler | DB unique index exists; concurrent-duplicate test returns 409 not 500 |
| `username` plugin adopted, breaking Account/VisitorProfile split (new) | Phase: `user`/`visitor_profile` schema + `emailOTP` wiring | Decision documented; Staff-only test account has no username field |

## Sources

- [better-auth Expo integration docs](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/integrations/expo.mdx) — Context7-curated, MEDIUM confidence
- [better-auth Expo client plugin README](https://github.com/better-auth/better-auth/blob/main/packages/expo/README.md) — Context7-curated, MEDIUM confidence
- [better-auth bearer plugin source](https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/plugins/bearer/index.ts) — Context7-curated, MEDIUM confidence
- [better-auth NestJS integration docs](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/integrations/nestjs.mdx) — Context7-curated, MEDIUM confidence
- [better-auth organization plugin docs](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/plugins/organization.mdx) — Context7-curated, MEDIUM confidence
- [better-auth email-OTP plugin docs](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/plugins/email-otp.mdx) — Context7-curated, 2026-07-30, HIGH confidence (official plugin docs; `otpLength`/`expiresIn`/`resendStrategy` defaults, rate-limit defaults confirmed against `packages/better-auth/src/plugins/email-otp/index.ts` source)
- [better-auth username plugin docs](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/plugins/username.mdx) — Context7-curated, 2026-07-30, HIGH confidence (used here to confirm why the plugin is NOT adopted — schema fields land on the shared `user` table)
- [better-auth session-management docs](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/concepts/session-management.mdx) — Context7-curated, 2026-07-30, HIGH confidence (`expiresIn`/`updateAge`/`cookieCache` — basis for the "no distinct refresh token" correction, Pitfall 10)
- [Expo Router: Authentication](https://docs.expo.dev/router/advanced/authentication/) — web search, LOW confidence per tool classification, but official Expo docs
- [Expo Router: Protected routes](https://docs.expo.dev/router/advanced/protected/) — web search, LOW confidence per tool classification, but official Expo docs
- [Expo blog: Simplifying auth flows with protected routes](https://expo.dev/blog/simplifying-auth-flows-with-protected-routes) — web search, LOW confidence
- Contract-drift / drizzle-zod pattern discussion (general web search on Drizzle+Zod contract-driven development) — web search, LOW confidence, directional only
- [eslint-plugin-i18n-lingui](https://github.com/OkCupid/eslint-plugin-i18n-lingui) — web search, LOW confidence
- [eslint-plugin-i18next no-literal-string rule](https://github.com/edvardchen/eslint-plugin-i18next/blob/HEAD/docs/rules/no-literal-string.md) — web search, LOW confidence
- [Resend Node.js SDK docs](https://resend.com/docs/send-with-nodejs) — web search, 2026-07-30, MEDIUM confidence (official docs, not Context7-indexed)
- `.planning/codebase/CONCERNS.md` — existing internal audit, extended (not duplicated) by this file
- `docs/DEVELOPMENT_DECISIONS.md` (ADR-009, ADR-011, ADR-012, ADR-014, ADR-016, ADR-018) — internal, HIGH confidence (project's own decisions)
- `docs/concept/09-onboarding-auth.md`, `docs/concept/04-domain-identity.md` — internal, HIGH confidence (binding OTP flow + identity model, source of the "gate-less" and "Refresh-Token" wording addressed above)

---
*Pitfalls research for: visitor-shell slice (auth + multi-tenant festival join + Expo shell + contracts + i18n)*
*Researched: 2026-07-29; refreshed 2026-07-30 for the password → email-OTP auth model change and ADR-016 identity model*
