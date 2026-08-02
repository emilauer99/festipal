---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 02
current_phase_name: otp-auth-festival-backend-api
status: executing
stopped_at: Completed 02-05-PLAN.md
last_updated: "2026-08-02T13:41:53.294Z"
last_activity: 2026-08-02
last_activity_desc: Phase 02 execution resumed (wave continue)
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 9
  completed_plans: 8
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-30 — reconciled with concept phase)

**Core value:** A festival visitor can get into the app, connect to their festival, and reach everything about their festival experience from one home screen.
**Current focus:** Phase 02 — otp-auth-festival-backend-api

## Current Position

Phase: 02 (otp-auth-festival-backend-api) — EXECUTING
Plan: 5 of 5
Status: Ready to execute
Last activity: 2026-08-02 — Phase 02 execution resumed (wave continue)

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 3
- Average duration: - min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3 | - | - |

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

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- Phase 2 (MEDIUM, downgraded 2026-07-30): `@thallesp/nestjs-better-auth` × ts-rest body parsing — current wrapper (`better-auth >= 1.5.0`) auto-re-applies `express.json()` for non-auth routes, so no manual exclusion needed; ts-rest controllers just consume `req.body`. Spike = *confirm* (2-request body proof + resolve `/api/v1` vs `/api/auth` global-prefix collision + version-pin), not *design*. Hand-rolled `@All('auth/*path')` catch-all is Plan-C fallback. See PITFALLS.md Pitfall 3 update.
- Cross-cutting (SEC-02): festival-scoped reads must be `festivalId`-isolated and inherited by all later content reads — verify with a cross-festival data-isolation test. NOTE: entry is gate-less (ADR-014) — do NOT gate festival access on save/membership; isolation is data-scoping, not a 403.
- Concept open item: `birthDate`/`gender`/Flinta + signup safety disclaimer pending Birgit's concept — kept migration-safe open, out of this milestone.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-08-02T12:06:59.179Z
Stopped at: Completed 02-05-PLAN.md
Resume file: None
