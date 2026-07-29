# Pitfalls Research

**Domain:** Visitor-shell slice — better-auth (NestJS + Expo) auth, global-user-onto-multi-tenant-festival data, Expo Router gating, ts-rest/Drizzle contract-first, i18n-from-day-1
**Researched:** 2026-07-29
**Confidence:** MEDIUM (better-auth/NestJS/Expo mechanics from Context7-curated official docs; Expo Router, contract-drift, and i18n-lint patterns from general web search — treat as directional, verify against current docs during phase planning)

This file extends `.planning/codebase/CONCERNS.md` (existing audit) — it does not repeat "all endpoints public" / "no tenant guard" / "secrets optional" / "env loaded twice" / "cashless URL unvalidated," it covers what specifically goes wrong *while fixing* those things with this exact stack.

## Critical Pitfalls

### Pitfall 1: Treating better-auth's `organization` plugin as a drop-in for "festival membership"

**What goes wrong:**
ADR-009 says auth is "mandantenfähig (Organizations = Festivals)," suggesting the team may reach for better-auth's built-in `organization` plugin to model festival membership. That plugin is an invite-based membership/RBAC system (roles: owner/admin/member, an "active organization" selected per session, `requireOrgRole` middleware, invitation flows). Festipal's actual model per ADR-014/PROJECT.md is much lighter: a global user *browses a list and joins* a festival — no invites, no owner/admin/member roles for visitors, no org-switching semantics beyond "which festival am I currently in." Half-adopting the plugin (e.g. using `activeOrganization` for "current festival" but skipping roles/invitations) produces a schema and API surface that doesn't match the product, and later features (admin roles in `apps/admin`) may collide with whatever partial adoption happened here.

**Why it happens:**
The ADR wording ("Organizations = Festivals") reads like a recommendation to use the plugin, but it predates the MVP-scope refinement in ADR-014 that simplified this to a plain global-shell "Festivals" list. The plugin also looks like the "official" multi-tenant answer for better-auth, so it's the path of least resistance even where it over-fits.

**How to avoid:**
Decide explicitly, in writing (ADR or PLAN.md decision note), whether this slice uses:
(a) a custom `festival_membership(userId, festivalId, joinedAt)` join table + a plain `TenantGuard`, or
(b) better-auth's `organization` plugin with festivals mapped to organizations.
Given this slice's scope (list + join, no invites, no per-festival visitor roles), (a) is the better fit — reserve the `organization` plugin for later if/when `apps/admin` needs real per-festival staff roles. Record the decision so the eventual admin-side auth work doesn't silently assume the plugin is already wired in.

**Warning signs:**
- Code references `authClient.organization.setActive()` or `activeOrganizationId` for "current festival" without any invitation/role screens ever being built.
- `packages/db` schema has both a hand-rolled `festival_membership` table AND better-auth's generated `organization`/`member` tables.

**Phase to address:** Phase that wires up the `user` table + better-auth server config (before the festival-list/join endpoints are built) — the membership model choice gates the schema.

---

### Pitfall 2: Auth on native (Expo) silently falls back to insecure or non-persistent storage

**What goes wrong:**
better-auth's Expo integration requires the `@better-auth/expo/client` plugin explicitly configured with `expo-secure-store` as the `storage` option, plus a `scheme` matching `app.json`, plus a `trustedOrigins: ["myapp://"]` entry on the server. If any of these are skipped — e.g. the team copies a browser-oriented `createAuthClient` snippet without the Expo plugin, or configures storage as plain AsyncStorage/MMKV instead of SecureStore — session tokens end up either unencrypted on-device or not persisted across app restarts (user has to log in every launch, defeating "session persists so they land logged-in on reopen").

**Why it happens:**
better-auth's core client API is web/cookie-first; the Expo/native path is an add-on plugin that's easy to miss when following generic docs or AI-generated snippets, especially since the code *compiles and appears to work* in Expo Go / simulator even when storage is wrong (SecureStore has no simulator errors that surface loudly).

**How to avoid:**
Pin the Expo client setup to the documented pattern: `expoClient({ scheme, storagePrefix, storage: SecureStore })` on the client, `trustedOrigins` including the app scheme on the server, and the `bearer` plugin server-side so `Authorization: Bearer <token>` requests (native fetch, no cookie jar) are converted to session context. Verify persistence explicitly: force-quit the app after login, relaunch, confirm still authenticated — don't rely on hot-reload behavior during dev, which can mask storage failures.

**Warning signs:**
- Session survives Fast Refresh but not a full app kill/relaunch.
- API calls from the Expo app work in dev (Metro/localhost, same-origin-ish) but fail once pointed at the deployed Railway URL — usually a missing `trustedOrigins` or CORS entry.
- Any use of `AsyncStorage` (not `expo-secure-store`) for the auth token.

**Phase to address:** Phase that scaffolds `apps/mobile` and wires the first authenticated API call — write a manual "kill and relaunch" check into that phase's UAT, not just "login succeeds."

---

### Pitfall 3: NestJS's better-auth integration protects routes globally by default — new endpoints "inherit" auth silently, but existing/new public ones need an explicit opt-out

**What goes wrong:**
The standard NestJS integration (`@thallesp/nestjs-better-auth`'s `AuthModule.forRoot()`) registers a **global** `AuthGuard`, flipping the current "everything public" state to "everything protected unless marked `@AllowAnonymous()`." This is good for closing the CONCERNS.md "all endpoints public" gap, but two failure modes are common: (1) genuinely public routes (health check, sign-up/sign-in themselves) break because nobody added `@AllowAnonymous()`, causing a confusing chicken-and-egg where you can't call sign-in because sign-in requires being signed in; (2) the reverse — a route the team *intends* to protect gets `@AllowAnonymous()` copy-pasted onto it during debugging and never removed, silently reopening it. The integration also requires `bodyParser: false` in `NestFactory.create()`; forgetting this breaks all body-parsing app-wide, not just for auth routes, in a way that's non-obvious to diagnose.

**Why it happens:**
Global guards are easy to add and easy to under-think per-route; the failure surfaces at runtime per-endpoint rather than at compile time, and `bodyParser: false` is a bootstrap-level flag decoupled from the auth module itself.

**How to avoid:**
When wiring the auth module, immediately enumerate every existing and new endpoint and tag it explicitly (`@AllowAnonymous()`, `@OptionalAuth()`, or protected-by-default) as one deliberate pass rather than reactively. Add a lint/test check (or at minimum a PR checklist item) that flags any new `@AllowAnonymous()` usage for review, since it should be rare and intentional post-MVP. Confirm `bodyParser: false` is set and add a smoke test that POSTs a body to a non-auth endpoint to catch regressions.

**Warning signs:**
- Sign-in/sign-up endpoints return 401 in integration tests.
- A previously-protected endpoint (e.g. `GET /festivals/:id`) suddenly returns data without a session during manual testing — check for a stray `@AllowAnonymous()`.
- POST requests to any endpoint return empty/undefined body server-side after auth module was added.

**Phase to address:** Phase that adds the better-auth NestJS module + wires guards onto existing festival endpoints (directly follows the CONCERNS.md "no auth implementation" fix). Verification: an explicit table of every endpoint × its auth annotation, reviewed at end of phase.

---

### Pitfall 4: Festival-list endpoint returns unauthorized/unjoined festival data, or join doesn't actually establish an enforceable tenant boundary

**What goes wrong:**
Two distinct but related mistakes:
1. **List endpoint over-exposes.** The "browse festivals" list is meant to be public-ish (discoverable), but once a user is authenticated, downstream calls (overview, profile, "my festivals") need to distinguish festivals the user has *joined* from all festivals that merely *exist*. A common mistake is building the list endpoint to just `SELECT * FROM festival` and reusing that same query/response shape for "my festivals," so the client ends up trusting client-side filtering to decide what the user has joined — trivially bypassable and confusing once a second client (admin) exists.
2. **Join doesn't gate anything.** The user "joins" a festival (creates a `festival_membership` row or equivalent), but subsequent festival-scoped endpoints (overview, later timetable/map/etc.) don't actually check that membership — they only check that a `festivalId` was passed and the user has *some* valid session, not that the user joined *that* festival. This is exactly the CONCERNS.md "No Per-Request Tenant Validation" gap, but worth restating narrowly for this slice: even after adding a `TenantGuard`, it's easy to implement it as "user is authenticated" rather than "user is authenticated AND has a membership row for this festivalId," because the membership check requires an extra query/join that's easy to skip under time pressure for a "just a placeholder home screen" feature.

**Why it happens:**
The list/browse endpoint and the "enter festival" endpoint feel like separate, low-stakes reads early on ("it's just a list of names"), so the tenant check gets deferred along with "real" content features — but the *pattern* set here (does festival access require membership, or just a valid festivalId?) is what every later phase (timetable, map, marketplace) will copy.

**How to avoid:**
Define two contracts from the start: `GET /festivals` (public or session-only, returns discoverable festivals, no membership-gated fields) and `GET /me/festivals` (session-required, returns only festivals the user joined). Implement `TenantGuard`/middleware so it queries `festival_membership` (or org membership) for `(userId, festivalId)` and 403s on mismatch — apply it to the overview endpoint even though overview is "just a placeholder," so the pattern exists before content-heavy phases build on top of it. Write one test explicitly: "user A joins festival 1; user A requests overview for festival 2 (never joined) → 403."

**Warning signs:**
- Overview/profile screens render successfully for a `festivalId` the current user never joined, when tested manually by editing the URL/param.
- `TenantGuard` implementation has no DB query in it (just checks `req.user` exists).
- Contract for "my festivals" and "browse festivals" is the same Zod schema/endpoint with a client-side `.filter()`.

**Phase to address:** Phase that builds the festival-list + join + home/overview endpoints (the core-value slice itself). This is the single highest-priority multi-tenant check for this milestone — verify with an explicit cross-tenant-denial test, not just happy-path UAT.

---

### Pitfall 5: Expo Router shows a flash of protected content (or bounces to login incorrectly) because auth state isn't resolved before first navigation

**What goes wrong:**
On cold start, the Expo app needs to read the persisted session (async SecureStore read) before it knows whether to route to `(auth)` or `(protected)`. If the root layout renders its default/first route before that resolves, users briefly see the wrong screen (protected content flashes before redirect to login, or login flashes before redirect to home for an already-authenticated user) — jarring and can leak layout/data momentarily. A related but distinct bug: the auth check is done once at app boot instead of being re-evaluated on every navigation, so a deep link into a protected route (e.g. a push notification or share link straight to `/festival/[id]`) skips the auth gate entirely because it doesn't pass through the same guard the initial route did.

**Why it happens:**
Expo Router's file-based routing renders eagerly; the natural instinct is to gate with a simple `if (!user) return <Redirect />` inside a single screen component rather than at the route-group layout level, which doesn't cover deep links or sibling routes, and doesn't account for the async loading state (undefined vs. null vs. resolved user).

**How to avoid:**
Use `SplashScreen.preventAutoHideAsync()` and hide it only after the session bootstrap resolves (loading/unknown vs. authenticated vs. unauthenticated as three explicit states, not two). Structure routes into `(auth)` and `(protected)` (or use Expo Router's `Stack.Protected`) groups with the guard at the **group layout** level so it applies uniformly to every screen and re-evaluates on every navigation event, including deep links.

**Warning signs:**
- Visible flicker between splash/login/home on cold start during manual testing, especially on a throttled/first-run device (SecureStore read is not instant).
- A deep link (or `expo-router` `Linking` test URL) to a protected screen opens directly without ever hitting the login screen while logged out.

**Phase to address:** Phase that scaffolds `apps/mobile` navigation/shell (after auth client exists, before/alongside the festival-list screen) — include a manual deep-link-while-logged-out test in that phase's UAT.

---

### Pitfall 6: `packages/contracts` Zod schemas hand-redeclare shapes that drift from `packages/db` Drizzle schema

**What goes wrong:**
CONCERNS.md already flags that `packages/contracts/src/schemas.ts` manually redeclares types instead of deriving from `packages/db`. This slice is exactly where the problem compounds: it adds a `user` table, a membership/join table, and new auth-related contracts (sign-up, sign-in, `GET /me`, festival list/join) all at once. If each of these gets a hand-written Zod object in contracts independent of the Drizzle table, a column rename or nullable-field change in the DB schema (e.g. adding `locale` to `user`, or renaming `festival_membership.joinedAt`) won't be caught by the type system — it'll surface as a runtime 500 or a silently-wrong field in the mobile app, discovered late.

**Why it happens:**
Contracts and DB schema are edited by the same person/session in early scaffolding, so the drift risk feels theoretical ("I'll keep them in sync manually") — but this is precisely the phase where multiple new tables and endpoints are added together, maximizing the chance of missing one field somewhere.

**How to avoid:**
Introduce `drizzle-zod` (or equivalent) now, before the user/membership tables are hand-declared twice: generate base Zod schemas from Drizzle table definitions in `packages/db`, and have `packages/contracts` import + `.pick()/.omit()/.extend()` those rather than redeclaring shapes from scratch. This is a small effort now (few tables) vs. a larger retrofit once festival-scoped content tables (timetable, news, marketplace) are added later, per the ADR-012 translation-table pattern that will multiply table count further.

**Warning signs:**
- Any Zod schema in `packages/contracts` that duplicates a Drizzle table's field list without importing from `packages/db`.
- A DB migration changes a column and no contracts file needs to change (should be a compile error, not silence).

**Phase to address:** Phase that adds `user`/membership schema to `packages/db` and the corresponding auth/festival-list contracts — adopt `drizzle-zod` in that same phase, not as later cleanup.

---

### Pitfall 7: i18n scaffolding lands but Lingui's own lint doesn't catch hardcoded strings, so they creep in from the first screen

**What goes wrong:**
CONCERNS.md notes `packages/i18n` is empty — this slice is where the first real UI strings (login form, festival list, home nav labels, placeholder Profile/Friends text) get written, under time pressure to "just ship the shell." Lingui's own ESLint plugin catches macro-usage mistakes (e.g. malformed `t()` calls) but does **not** by default flag plain JSX text or string literals that were never wrapped in `t()`/`<Trans>` in the first place — so a developer typing `<Text>Log in</Text>` instead of `<Text>{t\`Log in\`}</Text>` gets no warning. Because this is the *first* UI code in the repo, there's no existing pattern to copy from, making it the highest-risk moment for hardcoded strings to become the norm rather than the exception.

**Why it happens:**
i18n infrastructure (catalogs, extraction, compile step) is often set up "for later" once there's real content to translate, but ADR-012/CLAUDE.md require i18n from day 1 — if the shell's own auth/nav strings aren't wrapped, every screen built after copies the same shortcut.

**How to avoid:**
Set up Lingui extraction + a literal-string-detection ESLint rule (a plugin like `eslint-plugin-i18next`'s `no-literal-string` pattern, or an i18n-specific linter layered on top of Lingui) *before* writing the first screen in this phase, not after. Run `pnpm lingui extract` as part of CI or a pre-commit check so untranslated strings fail visibly rather than silently shipping. Since this phase only ships DE/EN, keep the catalog small but real — don't stub it with a TODO.

**Warning signs:**
- Grep for quoted string literals inside JSX in `apps/mobile` turns up matches outside of `t()`/`<Trans>` after the shell screens are built.
- `pnpm lingui extract` output has near-zero messages despite multiple screens existing.

**Phase to address:** Phase that builds the first Expo screens (login, festival list, home) — set up Lingui + lint rule as a prerequisite task within that phase, before screen implementation starts.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Skip `drizzle-zod`, hand-write contracts for user/membership tables | Faster to ship the first 2-3 tables | Compounds with every future table (timetable, news, marketplace translation tables per ADR-012) | Never for this milestone — table count is about to grow fast |
| Use better-auth `organization` plugin without deciding roles/invites now | Reuses "official" multi-tenant primitive, less custom code | Locks in invite/role semantics the visitor product doesn't need yet; may conflict with later admin-side org modeling | Only if the team commits now to organization-plugin-for-everything, including admin — otherwise use a plain membership table |
| Gate festival-scoped endpoints on "has a session" instead of "has membership for this festivalId" | Simpler `TenantGuard`, ships faster | Multi-tenancy is broken exactly where CONCERNS.md already flagged it — every later phase inherits the hole | Never — this is the one thing this slice must get right |
| Defer Lingui literal-string lint rule to "later cleanup" | Ships screens faster without extra tooling setup | Every hardcoded string becomes a manual find-and-fix later, across a growing app | Acceptable only for the very first throwaway spike screen, never for shipped shell UI |
| Store better-auth session as plain AsyncStorage instead of SecureStore during Expo scaffolding | Works identically in dev, slightly less setup | Ships an insecure-storage bug to "done" screens that's easy to forget once it "works" | Never — SecureStore is a one-line config difference |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| better-auth + Expo | Using the plain `better-auth/react` client without `@better-auth/expo/client`, losing native storage/deep-link handling | Use `expoClient({ scheme, storagePrefix, storage: SecureStore })` and add the app scheme to server `trustedOrigins` |
| better-auth + NestJS | Forgetting `bodyParser: false` on `NestFactory.create()`, breaking all POST bodies app-wide | Set it explicitly when adding `AuthModule.forRoot({ auth })`; smoke-test a non-auth POST endpoint afterward |
| better-auth + native fetch (no cookies) | Assuming cookie-based sessions "just work" from a native app the way they do from a browser | Enable the `bearer` plugin server-side so `Authorization: Bearer <token>` is accepted and converted to session context |
| ts-rest + Drizzle | Hand-declaring Zod schemas in `packages/contracts` that parallel (and drift from) Drizzle table definitions | Generate base schemas with `drizzle-zod` from `packages/db`, compose/refine in contracts |
| Lingui + Expo/RN | Assuming Lingui's ESLint plugin catches hardcoded strings by default | Add a literal-string-detection rule/linter on top; run `lingui extract` in CI |
| CORS + Expo dev client vs. deployed app | Configuring CORS/`trustedOrigins` only for `localhost` during dev, breaking auth once pointed at the Railway-hosted API | Include both the dev scheme/origin and the deployed API's expected client origins from the start; document in `.env.example` |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Auth session token stored in AsyncStorage/MMKV instead of SecureStore on native | Token readable by any code with device/app-sandbox access, no OS-level encryption | Use `expo-secure-store` explicitly via `expoClient({ storage: SecureStore })`; verify in code review |
| `TenantGuard` checks "is authenticated" instead of "is member of festivalId" | Any logged-in user can read another user's/festival's scoped data by guessing/enumerating `festivalId` (already flagged in CONCERNS.md, restated for this slice's join model) | Guard must query the membership table for `(userId, festivalId)`, not just session presence |
| Global `AuthGuard` bypassed via stray `@AllowAnonymous()` left on a sensitive route during debugging | Silent reopening of a protected endpoint | PR review checklist item for any new `@AllowAnonymous()`/`@OptionalAuth()` usage |
| `trustedOrigins` / CORS configured permissively ("allow the app scheme and *") to unblock dev quickly | Opens auth endpoints to origin spoofing | Whitelist exact scheme(s) and exact deployed origins only; no wildcards |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|------------------|
| Flash of login screen for an already-authenticated user (or vice versa) on cold start | Feels broken/janky, undermines "core value = fast entry to festival experience" | Hold splash screen until session bootstrap resolves; three-state loading/authed/unauthed logic |
| Deep link into a protected route while logged out silently 404s or crashes instead of redirecting to login-then-continue | User loses the destination context (e.g. a shared festival link) | Guard at layout level, capture intended destination, redirect back after login |
| Hardcoded English strings on the very first screens users see (login, festival list) | Breaks the "app and admin are multilingual from day 1" promise immediately and visibly | Wrap every user-facing string in `t()`/`<Trans>` from the first commit of these screens |

## "Looks Done But Isn't" Checklist

- [ ] **Login/session persistence:** Often missing a real force-quit-and-relaunch test — verify by killing the app process, not just backgrounding it or hot-reloading.
- [ ] **Festival join → tenant enforcement:** Often missing the actual membership check in `TenantGuard` — verify with a test where an authenticated user requests a festival they never joined and confirm 403, not 200.
- [ ] **Auth-gated navigation:** Often missing deep-link coverage — verify by opening a protected route URL directly while logged out, not just by clicking through the app.
- [ ] **Contracts ↔ DB alignment:** Often missing derivation from Drizzle — verify by renaming a DB column and confirming a contracts-side compile error occurs, not silence.
- [ ] **i18n on shell screens:** Often missing wrapping on "just placeholder" text (Profile/Friends placeholders count) — verify with a grep for unwrapped string literals in JSX before calling the phase done.
- [ ] **CORS/trustedOrigins for real deployment:** Often only configured for localhost dev — verify auth works against the actual Railway-deployed API URL from a real device, not just simulator-to-localhost.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| Organization-plugin/membership-table mismatch discovered late | MEDIUM | Pick one model, write a migration to consolidate membership data into it, update `TenantGuard` and contracts accordingly — contained to auth/festival modules, doesn't touch content tables yet at this stage |
| Missing tenant check on overview endpoint found post-ship | MEDIUM–HIGH (depends on how many later endpoints copied the same guard) | Fix `TenantGuard` once at the shared middleware/guard level (not per-endpoint), add the cross-tenant-denial test, audit every festival-scoped endpoint added since |
| Contract/DB drift causes a runtime field mismatch | LOW–MEDIUM | Backfill `drizzle-zod` for the affected tables, regenerate contracts, add a CI step that fails on divergence going forward |
| Hardcoded strings found across shell screens | LOW (early) / MEDIUM (if many screens already built) | Sweep with the literal-string lint rule once added, run `lingui extract`, replace flagged strings — cheaper the earlier it's caught, hence prevention-first priority |
| Insecure/non-persistent session storage shipped | LOW | One-line client config fix (`storage: SecureStore`), but requires forcing all existing users to re-login once corrected — communicate if already in any test/prod usage |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Organization-plugin vs. custom membership mismatch | Phase: `user` table + better-auth server wiring | Written decision (ADR or plan note) on membership model before schema is created |
| Native session storage/persistence | Phase: `apps/mobile` scaffolding + auth client wiring | Manual force-quit/relaunch test in UAT |
| Global AuthGuard mis-tagging (public routes broken / protected routes opened) | Phase: better-auth NestJS module + guards on existing endpoints | Endpoint × auth-annotation table reviewed at phase end |
| Festival list/join without real tenant enforcement | Phase: festival-list + join + home/overview endpoints (core-value slice) | Cross-tenant-denial test: user requests festival they haven't joined → 403 |
| Expo Router auth-flash / deep-link bypass | Phase: `apps/mobile` navigation/shell scaffolding | Manual deep-link-while-logged-out test |
| Contracts/DB schema drift | Phase: `user`/membership schema + auth contracts | `drizzle-zod` adopted in the same phase; compile-time check on column rename |
| Hardcoded strings on shell screens | Phase: first Expo screens (login, festival list, home) | Lingui extract + literal-string lint rule run before phase sign-off |

## Sources

- [better-auth Expo integration docs](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/integrations/expo.mdx) — Context7-curated, MEDIUM confidence
- [better-auth Expo client plugin README](https://github.com/better-auth/better-auth/blob/main/packages/expo/README.md) — Context7-curated, MEDIUM confidence
- [better-auth bearer plugin source](https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/plugins/bearer/index.ts) — Context7-curated, MEDIUM confidence
- [better-auth NestJS integration docs](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/integrations/nestjs.mdx) — Context7-curated, MEDIUM confidence
- [better-auth organization plugin docs](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/plugins/organization.mdx) — Context7-curated, MEDIUM confidence
- [Expo Router: Authentication](https://docs.expo.dev/router/advanced/authentication/) — web search, LOW confidence per tool classification, but official Expo docs
- [Expo Router: Protected routes](https://docs.expo.dev/router/advanced/protected/) — web search, LOW confidence per tool classification, but official Expo docs
- [Expo blog: Simplifying auth flows with protected routes](https://expo.dev/blog/simplifying-auth-flows-with-protected-routes) — web search, LOW confidence
- Contract-drift / drizzle-zod pattern discussion (general web search on Drizzle+Zod contract-driven development) — web search, LOW confidence, directional only
- [eslint-plugin-i18n-lingui](https://github.com/OkCupid/eslint-plugin-i18n-lingui) — web search, LOW confidence
- [eslint-plugin-i18next no-literal-string rule](https://github.com/edvardchen/eslint-plugin-i18next/blob/HEAD/docs/rules/no-literal-string.md) — web search, LOW confidence
- `.planning/codebase/CONCERNS.md` — existing internal audit, extended (not duplicated) by this file
- `docs/DEVELOPMENT_DECISIONS.md` (ADR-009, ADR-011, ADR-012, ADR-014) — internal, HIGH confidence (project's own decisions)

---
*Pitfalls research for: visitor-shell slice (auth + multi-tenant festival join + Expo shell + contracts + i18n)*
*Researched: 2026-07-29*
