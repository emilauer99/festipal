---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 1
current_phase_name: Identity Schema & Auth Foundation
status: planning
stopped_at: Phase 1 context gathered
last_updated: "2026-07-30T17:03:50.551Z"
last_activity: 2026-07-30
last_activity_desc: Planning docs reconciled with the binding concept phase (OTP auth, Account/VisitorProfile identity, gate-less save-festival); 20/20 requirements mapped
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-30 — reconciled with concept phase)

**Core value:** A festival visitor can get into the app, connect to their festival, and reach everything about their festival experience from one home screen.
**Current focus:** Phase 1 — Identity Schema & Auth Foundation

## Current Position

Phase: 1 of 6 (Identity Schema & Auth Foundation)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-07-30 — Planning docs reconciled with the binding concept phase (OTP auth, Account/VisitorProfile identity, gate-less save-festival); 20/20 requirements mapped

Progress: [░░░░░░░░░░] 0%

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

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Reconciliation (2026-07-30): planning reconciled to the binding concept — passwordless email-OTP (ADR-009), identity `Account`→`VisitorProfile` (ADR-016), gate-less festival save `MyFestival` (ADR-014); first-login profile completion folded into the auth phase.
- Roadmap: Dependency-ordered horizontal layers — schema → backend API → mobile shell → screens; every UI phase lands only behind a live backend.
- Phase 1: Model visitor↔festival as gate-less `my_festival` saves and `VisitorProfile` as a SEPARATE table keyed by accountId — NOT better-auth's organization plugin, NOT its username plugin (would force a username onto staff accounts).
- Phase 1: Adopt `drizzle-zod` up front so contracts derive from Drizzle schema (prevents drift as table count grows).

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

Last session: 2026-07-30T17:03:50.536Z
Stopped at: Phase 1 context gathered
Resume file: .planning/phases/01-identity-schema-auth-foundation/01-CONTEXT.md
