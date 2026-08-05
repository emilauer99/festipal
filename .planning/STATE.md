---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 5
current_phase_name: Festival Selection & Home
status: "Phase 04 shipped — PR #9"
stopped_at: Phase 5 context gathered
last_updated: "2026-08-05T16:16:17.041Z"
last_activity: 2026-08-05
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 22
  completed_plans: 22
last_activity_desc: Phase 04 complete, transitioned to Phase 5
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-30 — reconciled with concept phase)

**Core value:** A festival visitor can get into the app, connect to their festival, and reach everything about their festival experience from one home screen.
**Current focus:** Phase 04 — visitor-auth-profile-completion

## Current Position

Phase: 5 — Festival Selection & Home
Plan: Not started
Status: Phase 04 shipped — PR #9
Last activity: 2026-08-05

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 22
- Average duration: - min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3 | - | - |
| 02 | 6 | - | - |
| 03 | 6 | - | - |
| 04 | 7 | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 12min | 3 tasks | 7 files |
| Phase 01 P02 | ~18min | 2 tasks | 9 files |
| Phase 01 P03 | ~15min | 2 tasks | 5 files |
| Phase 02 P01 | 25min | 3 tasks | 8 files |
| Phase 02 P02 | 16min | 2 tasks | 15 files |
| Phase 02 P03 | 40min | 2 tasks | 7 files |
| Phase 02 P04 | 24min | 2 tasks | 5 files |
| Phase 02 P05 | 30min | 2 tasks | 5 files |
| Phase 02 P06 | 15min | 2 tasks | 4 files |
| Phase 03 P01 | 15min | 2 tasks | 7 files |
| Phase 03 P02 | 50min | 2 tasks | 21 files |
| Phase 03 P03 | 25min | 2 tasks | 5 files |
| Phase 03 P04 | ~24 min | 2 tasks | 11 files |
| Phase 03 P05 | 20min | 2 tasks | 6 files |
| Phase 03 P06 | ~3h35m | 2 tasks | 2 files |
| Phase 04 P01 | 8 | 3 tasks | 6 files |
| Phase 04 P02 | 45min | 2 tasks | 5 files |
| Phase 04 P03 | ~55min | 3 tasks | 7 files |
| Phase 04 P04 | ~35min | 3 tasks | 9 files |
| Phase 04 P05 | ~40min | 3 tasks | 7 files |
| Phase 04 P06 | ~35min | 3 tasks | 5 files |
| Phase 04 P07 | ~25min | 2 tasks | 13 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Reconciliation (2026-07-30): planning reconciled to the binding concept — passwordless email-OTP (ADR-009), identity `Account`→`VisitorProfile` (ADR-016), gate-less festival save `MyFestival` (ADR-014); first-login profile completion folded into the auth phase.
- Roadmap: Dependency-ordered horizontal layers — schema → backend API → mobile shell → screens; every UI phase lands only behind a live backend.
- Phase 1: Model visitor↔festival as gate-less `my_festival` saves and `VisitorProfile` as a SEPARATE table keyed by accountId — NOT better-auth's organization plugin, NOT its username plugin (would force a username onto staff accounts).
- Phase 1: Adopt `drizzle-zod` up front so contracts derive from Drizzle schema (prevents drift as table count grows).
- [Phase ?]: 01-01: Vendored better-auth core schema via the auth CLI (text ids, provenance header); drizzle-zod bases colocated in auth-schemas.ts; identity model recorded as ADR-021 (org/username plugins rejected).
- [Phase ?]: drizzle-zod pinned to 0.7.1 (last classic-zod release); 0.8.x imports zod/v4 and breaks the workspace Zod v3 pin (ADR-006) in packages/contracts
- [Phase ?]: visitor_profile username uniqueness enforced by a Postgres lower(username) functional UNIQUE INDEX, not an app-layer check (race-proof, D-04)
- [Phase ?]: 01-03: my_festival is the single global<->tenant bridge — composite PK (visitorId, festivalId), text visitorId FK -> visitor_profile.accountId (encodes profile-before-save), uuid festivalId FK -> festival.id; gate-less save, no role/invite columns (ADR-014/016, D-04)
- [Phase ?]: 01-03: lower(username) unique index proven LIVE in Neon — case-variant duplicate visitor_profile insert rejected with Postgres 23505 from visitor_profile_username_lower_unq; full schema (auth+visitor_profile+my_festival) migrated cleanly (migration 0002)
- [Phase ?]: GET /me response locked to { accountId, email, profile: VisitorProfilePublic | null } (RESEARCH.md A4, Open Question 1 resolved)
- [Phase ?]: listFestivals/listMyFestivals both return z.array(festivalSchema), not myFestivalSelectSchema-derived shapes
- [Phase ?]: 02-02: main.ts imports the memoized env singleton instead of calling loadEnv() again — closes the 3rd-call-site gap from RESEARCH.md rather than adding a 4th
- [Phase ?]: 02-02: dev OTP transport writes a gitignored local capture file (apps/api/.otp-dev-transport.local.json) alongside console.log, read by test/smoke/otp-me-smoke.mjs to complete the OTP round-trip without a real inbox
- [Phase ?]: 02-02: better-auth requires an Origin header on state-changing /api/auth/* POSTs (CSRF check) — smoke script sends one explicitly; no production code change needed since real clients send it naturally
- [Phase 02]: 02-03: Fixed a drizzle-orm/drizzle-zod text()-column TS-inference bug at its source (visitor-profile.ts .extend()) — VisitorProfilePublic/CompleteProfileBody/Me are now genuinely concrete types instead of all-unknown
- [Phase 02]: 02-03: postgres added as a direct apps/api dependency (PostgresError import for 23505->409 mapping); drizzle-zod added as a direct packages/contracts dependency (needed for its own dts build)
- [Phase ?]: 02-04: save() returns a discriminated {status:'ok'}|{status:'not-found'} result instead of throwing, matching the codebase's service-returns-signal/controller-maps-to-status pattern
- [Phase ?]: 02-04: packages/db one-shot scripts must explicitly close the postgres.js connection (db.$client.end()) and load env via dotenv/config — otherwise the script hangs forever after its last query with no env source when run standalone via tsx
- [Phase 02]: 02-05: Disabled vitest fileParallelism in apps/api after the larger OTP-heavy spec suite proved flaky under parallel-file execution (rate limiter + shared capture-file races) — 3/3 consecutive full-suite runs green afterward — Root-caused via isolation testing (every new spec passed alone, only the full parallel run failed) before applying the fix, avoiding a speculative change
- [Phase 02]: 02-05: auth-guard.spec.ts covers all eight protected /api/v1 endpoints (plan's six plus getFestival/listTags) to match the objective's whole-endpoint-set language — Closes the annotation table's no-endpoint-untagged prohibition with a passing test, not just manual review
- [Phase ?]: 02-06: Fixed CR-01 at the service/contract/controller level only (my_festival FK unchanged) — save() catches Postgres 23503 and returns a 409, mirroring me.service.completeProfile's 23505 idiom
- [Phase 03]: 03-01: Fixed Postgres 18 docker volume mount path (/var/lib/postgresql, not /var/lib/postgresql/data) after a startup crash-loop -- 18+ images use a pg_ctlcluster-compatible data layout.
- [Phase ?]: D-07 resolved: resolveUiLocale gains an optional uiFallback param (Option A) - mobile passes 'de' without changing the shared DEFAULT_LOCALE='en' (content-axis default, ADR-012)
- [Phase ?]: 03-02: Lingui macro babel plugin + lingui.config.ts had to be created already in Task 1 (blocking) - the tracer screen's Trans macro cannot bundle without them
- [Phase ?]: 03-03: Pinned zod ^3.25.76 directly in apps/mobile (ADR-006) after diagnosing that ts-rest/core's pnpm peer resolution drifted to zod v4 (pulled in by better-auth's own dependency tree) instead of the workspace's zod v3; a workspace-wide override was tried and reverted because it breaks apps/api at runtime (better-auth's own zod-v4-only .meta() call).
- [Phase ?]: 03-03: Cast expoClient(...) as BetterAuthClientPlugin in auth-client.ts to work around a shipped-type-only incompatibility in @better-auth/expo@1.6.25's createAuthClient plugin-array typing; verified JS shape matches official docs, authClient.getCookie() works correctly.
- [Phase ?]: 03-04: single 6-digit TextInput for OTP (not six boxes) per the plan's own action text, matching UI-SPEC's overflow-impossible reasoning
- [Phase ?]: 03-04: better-auth OTP/rate-limit error mapping (OTP_EXPIRED/INVALID_OTP/TOO_MANY_ATTEMPTS + bare 429) read directly from the installed package's dist source, not assumed from RESEARCH.md
- [Phase ?]: 03-04: fixed a latent i18n gap from 03-02 -- lib/i18n.ts now calls i18n.load(...) to actually load DE/EN catalogs (activate() alone never rendered translations); also added 'po' to Metro's resolver.sourceExts, without which the catalog import couldn't resolve at all
- [Phase ?]: 03-05: Save-state tracked client-side per session (local Set<festivalId>), not via a second listMyFestivals query -- saveFestival's own idempotency makes this a UX nicety, not a correctness need.
- [Phase ?]: 03-05: German 'Save'/'Enter festival' copy uses the binding concept-doc terms verbatim (Speichern / Festival betreten), not 'Merken' from the offline-matrix doc's internal queue-action name.
- [Phase 03]: 03-06: dev-cleartext to LAN API via expo-build-properties — Android usesCleartextTraffic + iOS NSAllowsLocalNetworking (narrow, not NSAllowsArbitraryLoads); guarded DEV-ONLY by an app.json _devOnlyCleartextComment, no EAS/release profile this phase (T-03-14/15).
- [Phase 03]: 03-06: full core-value path (OTP → festivals → save → gate-less enter → home, kill-and-relaunch persists, DE/EN + German fallback) signed off on REAL ANDROID; iOS device-verification deferred (Mac/Xcode toolchain not set up) — user-approved deviation.
- [Phase 03]: 03-06 (env): reverted stray root-level expo pollution (root app.json + expo/react-native deps in root package.json) from an accidental root `expo install`; the pnpm reconcile then hung on Windows due to a lingering Metro file-watcher racing pnpm's atomic temp-dir import — stopping Expo/Metro processes let `pnpm install` complete. Root cause of the ENOENT-on-*_tmp_*/node_modules install failures on this machine.
- [Phase ?]: 04-01: MMKV v4 + react-native-nitro-modules peer installed together (Pitfall 3); MMKV wired only to avatar URI later, session stays on SecureStore
- [Phase ?]: 04-01: apps/mobile Vitest runner is node-env + pure lib/ scope; RN modules lazily required in useAppFonts to keep fonts.ts node-importable
- [Phase ?]: 04-01: non-blocking font contract (D-04/Pitfall 5) — resolveFontFamily falls back to system font, never gates splash-hide
- [Phase ?]: 04-02: Real festipal brand tokens ported into packages/ui/src/tokens.ts (extended, not replaced) — dark-first palette + light variant map, single source of truth for Phases 4-6
- [Phase ?]: 04-02: D-03 username/displayName caps added to the EXISTING visitor-profile.ts .extend() z.string() values (Pitfall 4) — not createInsertSchema's refinement callback; no db:push needed (validation-only)
- [Phase ?]: 04-02: fixed 3 pre-existing HTTP-integration test fixtures (dash/uppercase usernames) broken by the new D-03 caps — direct in-scope Rule 1 fix, full 42-test apps/api suite green
- [Phase ?]: [Phase 04]: 04-03: Added @festipal/ui as a real apps/mobile dependency (workspace:*) — first mobile screen import; Metro/pnpm workspace resolution already generically supports @festipal/* packages, no config change needed
- [Phase ?]: [Phase 04]: 04-03: Username input sanitized on every keystroke (lowercase + charset-strip to a-z0-9_.) instead of post-hoc format validation — client can never construct a request the D-03 server regex would reject for charset
- [Phase ?]: [Phase 04]: 04-03: Username-taken suggestion sentence deliberately deferred to 04-05 per the task's own scope; only the taken headline ships in the tracer
- [Phase ?]: 04-04: mapOtpError returns a stable OtpErrorKind (not a translated string) so the pure classifier stays importable in the node-env Vitest runner with zero RN/Lingui setup
- [Phase ?]: 04-04: extended eslint no-literal-string glob + Lingui extract include to cover components/ — this plan's first components/ directory was invisible to both i18n guards before the fix
- [Phase ?]: 04-04: ResendCountdown remounts via a resendGeneration key on every successful resend (either affordance) so the two resend triggers never show an inconsistent countdown
- [Phase ?]: [Phase 04]: 04-05: accountId sourced from a cached GET /me useQuery instead of authClient.useSession() -- session's ClientSession<Option> generic resolved to never under this project's plugin config
- [Phase ?]: [Phase 04]: 04-05: a completeProfile 409 is treated as a username-taken event (unified taken-state UI + regenerated suggestion) since lower(username) is the endpoint's only unique constraint -- replaces 04-03's generic 409 retry copy
- [Phase ?]: [Phase 04]: 04-05: MMKV avatar-storage.ts keyed strictly avatar-uri:${accountId} (Open Question 1 resolved) -- react-native-mmkv required lazily so the module stays importable off-device
- [Phase ?]: 04-06: forceUnauthenticated() guard singleton added to app/_layout.tsx so an offline/failed signOut() still reaches Welcome (better-auth only broadcasts its session signal on success)
- [Phase ?]: 04-06: deep-link exclusion filters by the resolved route path ('', email, verify, complete-profile), not the (auth)/(profile-setup) folder names, since Expo Router route groups never appear in the URL
- [Phase ?]: 04-06: cold-start resolve timeout set to 8000ms (Claude's discretion) forcing authState from loading to unauthenticated via a functional setState update
- [Phase ?]: 04-07: Added advanced.disableOriginCheck: false to auth.instance.ts — better-auth defaults origin-check off under NODE_ENV=test unless set, which would make signout-origin.spec.ts's negative control pass regardless of the expo() fix; explicit false matches the existing implicit production default (no CSRF weakening)
- [Phase ?]: 04-07: expo() server plugin installed in apps/api's betterAuth plugins array (AUTH-04, WINDOWS id 2) — translates apps/mobile's expo-origin header to origin so cookie-bearing sign-out requests pass the origin-check instead of 403ing; proven headlessly via signout-origin.spec.ts
- [Phase ?]: 04-07: FontsReadyProvider/useFontsReady context (apps/mobile/lib/fonts-context.tsx) shares the root useAppFonts() readiness boolean; all eight restyled Phase-4 screens/components now resolve fontFamily inline via resolveFontFamily(FONT_DISPLAY|FONT_BODY|FONT_MONO, fontsReady) instead of the generic typeRoles.*.family name (WINDOWS id 15)

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- Phase 2 (MEDIUM, downgraded 2026-07-30): `@thallesp/nestjs-better-auth` × ts-rest body parsing — current wrapper (`better-auth >= 1.5.0`) auto-re-applies `express.json()` for non-auth routes, so no manual exclusion needed; ts-rest controllers just consume `req.body`. Spike = *confirm* (2-request body proof + resolve `/api/v1` vs `/api/auth` global-prefix collision + version-pin), not *design*. Hand-rolled `@All('auth/*path')` catch-all is Plan-C fallback. See PITFALLS.md Pitfall 3 update.
- Cross-cutting (SEC-02): festival-scoped reads must be `festivalId`-isolated and inherited by all later content reads — verify with a cross-festival data-isolation test. NOTE: entry is gate-less (ADR-014) — do NOT gate festival access on save/membership; isolation is data-scoping, not a 403.
- Concept open item: `birthDate`/`gender`/Flinta + signup safety disclaimer pending Birgit's concept — kept migration-safe open, out of this milestone.
- Phase 3 (LOW, deferred): apps/api/src/auth/auth.instance.ts is missing the @better-auth/expo server plugin (plugins: [expo()]) needed to translate the mobile client's expo-origin header into origin for better-auth's CSRF check. Not exercised by any Phase 3 plan (no logout feature planned), but required before any future sign-out/session-revocation feature. Tracked in .planning/WINDOWS.md.
- Phase 4 (04-03): four manual UATs (Task1 full OTP flow, Task2 network-body check, AUTH-02 returning-user skip, AUTH-03 force-quit persistence) require a real Android device/emulator and were NOT run in this headless execution — tracked in .planning/WINDOWS.md as unrun-verify entries, must be cleared before Phase 4 ships

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260803-mz6 | Anchor UI component strategy in docs: ADR-022 (custom RN components for mobile, shadcn/ui for admin, minimize custom CSS) + CLAUDE.md tech stack update | 2026-08-03 | 56456a5 | [260803-mz6-anchor-ui-component-strategy-in-docs-adr](./quick/260803-mz6-anchor-ui-component-strategy-in-docs-adr/) |
| 260805-lkr | Fix keyboard-scroll on Phase-4 auth/profile input screens (flex:1 → flexGrow:1 so keyboard-covered content becomes scrollable) | 2026-08-05 | 8935d34 | [260805-lkr-fix-keyboard-scroll-on-phase-4-auth-prof](./quick/260805-lkr-fix-keyboard-scroll-on-phase-4-auth-prof/) |

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Phase 03 UAT | iOS on-device verification of the six core-value checks (real iPhone via `npx expo run:ios` on a Mac w/ free Apple-ID provisioning) — Android verified, iOS toolchain not set up | Deferred (user-approved) | 2026-08-04 |

## Session Continuity

Last session: 2026-08-05T16:16:17.012Z
Stopped at: Phase 5 context gathered
Resume file: .planning/phases/05-festival-selection-home/05-CONTEXT.md
