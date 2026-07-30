---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 01
current_phase_name: Identity Schema & Auth Foundation
status: verifying
stopped_at: Completed 01-03-PLAN.md (phase 01 all plans done — ready for verification)
last_updated: "2026-07-30T20:01:01.764Z"
last_activity: 2026-07-30
last_activity_desc: Phase 01 execution started
progress:
  total_phases: 1
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-30 — reconciled with concept phase)

**Core value:** A festival visitor can get into the app, connect to their festival, and reach everything about their festival experience from one home screen.
**Current focus:** Phase 01 — Identity Schema & Auth Foundation

## Current Position

Phase: 01 (Identity Schema & Auth Foundation) — EXECUTING
Plan: 3 of 3
Status: Phase complete — ready for verification
Last activity: 2026-07-30 — Phase 01 execution started

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: - min
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

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

Last session: 2026-07-30T20:01:01.754Z
Stopped at: Completed 01-03-PLAN.md (phase 01 all plans done — ready for verification)
Resume file: None
