---
phase: 1
slug: identity-schema-auth-foundation
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-30
validated: 2026-08-01
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **Phase shape:** schema-only / database foundation. No application runtime code, no
> user-facing surface. The single requirement is **PLAT-01**. Verification is compile-time
> (`typecheck`/`build`) + DB integration (`db:migrate`/`db:generate`) + one documented
> runtime behavioral proof (SC-2, manual-only — see below). No test framework was introduced
> this phase; a project-wide Vitest harness is deferred to the first phase with runtime code
> (Phase 2, auth runtime).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — no Vitest/Jest in the workspace; `turbo run test` is a no-op (no package defines a `test` script) |
| **Config file** | none |
| **Quick run command** | `pnpm --filter @festipal/db typecheck` |
| **Full suite command** | `pnpm build && pnpm typecheck` (turbo: builds packages, then typechecks db + contracts) |
| **Estimated runtime** | ~10–20 seconds (compile-time gates); DB-integration commands add ~5s each against Neon |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @festipal/db typecheck`
- **After every plan wave:** Run `pnpm build && pnpm typecheck` (db + contracts)
- **Before `/gsd-verify-work`:** Full turbo `build` + `typecheck` must be green; `db:migrate` applied to Neon
- **Max feedback latency:** ~20 seconds (compile-time)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-D1 | 01 | 1 | PLAT-01 | supply-chain (SUS) | better-auth/auth pinned EXACT (no caret); `@better-auth/cli` absent | manual_procedural | `pnpm --filter @festipal/db build` | ✅ | ✅ green |
| 1-01-D2 | 01 | 1 | PLAT-01 | T-01-XT | vendored `user` table carries NO `festivalId`, NO `username` cols | unit | `pnpm --filter @festipal/db typecheck` | ✅ | ✅ green |
| 1-01-D3 | 01 | 1 | PLAT-01 | — | 8 drizzle-zod auth bases exported from barrel | unit | `pnpm --filter @festipal/db build` | ✅ | ✅ green |
| 1-01-D4 | 01 | 1 | PLAT-01 | — | identity model recorded as ADR-021 | manual_procedural | (doc inspection) `docs/DEVELOPMENT_DECISIONS.md` §ADR-021 | ✅ | ✅ green |
| 1-02-D1 | 02 | 1 | PLAT-01 | T-01-INV | `visitor_profile` PK = text `accountId` FK→`user.id` cascade | unit | `pnpm --filter @festipal/db typecheck` | ✅ | ✅ green |
| 1-02-D2 | 02 | 1 | PLAT-01 | T-01-UN | `lower(username)` functional UNIQUE INDEX emitted in migration SQL | manual_procedural | (SQL inspection) `drizzle/0001_groovy_skin.sql` | ✅ | ✅ green |
| 1-02-D3 | 02 | 1 | PLAT-01 | — | `visitor_profile` drizzle-zod bases exported | unit | `pnpm --filter @festipal/db build` | ✅ | ✅ green |
| 1-02-D4 | 02 | 1 | PLAT-01 | T-01-DR | contracts composes on drizzle-zod base; column rename → compile error | unit | `pnpm --filter @festipal/contracts typecheck` | ✅ | ✅ green |
| 1-02-D5 | 02 | 1 | PLAT-01 | — | auth + `visitor_profile` schema migrates cleanly to Neon | integration | `pnpm --filter @festipal/db db:migrate` | ✅ | ✅ green |
| 1-03-D1 | 03 | 1 | PLAT-01 | T-01-XT / T-01-INV | `my_festival` composite PK; `visitorId`→`visitor_profile.accountId`, NOT `user.id` | unit | `pnpm --filter @festipal/db typecheck` | ✅ | ✅ green |
| 1-03-D2 | 03 | 1 | PLAT-01 | — | `my_festival` drizzle-zod bases exported | unit | `pnpm --filter @festipal/db build` | ✅ | ✅ green |
| 1-03-D3 | 03 | 1 | PLAT-01 | — | full schema (auth + visitor_profile + my_festival) migrates to Neon | integration | `pnpm --filter @festipal/db db:migrate` | ✅ | ✅ green |
| 1-03-D4 | 03 | 1 | PLAT-01 | T-01-UN | **`lower(username)` uniqueness ENFORCED live (case-variant insert → 23505)** | integration (runtime) | — (no committed test — **manual-only**, see below) | ✅ | ⚠️ manual-only |
| 1-03-D5 | 03 | 1 | PLAT-01 | — | `db:generate` idempotent on unchanged schema (no phantom migration) | integration | `pnpm --filter @festipal/db db:generate` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky/manual-only*

---

## Wave 0 Requirements

*No test framework was installed this phase (schema-only foundation).* Automated coverage is
provided by the existing compile-time gates (`typecheck`/`build`) and DB-integration commands
(`db:migrate`/`db:generate`) already wired into each package. The single runtime behavior
(SC-2 `lower(username)` uniqueness) is captured as a repeatable manual procedure below.

A project-wide Vitest harness is deferred to the first phase with application/runtime code
(Phase 2 — auth runtime), where request-layer behavior (OTP flows, AuthGuard, TenantGuard,
the `23505` catch) needs it. Bootstrapping Vitest here — solely to cover one Neon-dependent
integration behavior that cannot run in DB-less CI — was assessed as premature and declined
at the validation gate.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Case-insensitive `username` uniqueness enforced at runtime (`lower(username)` → Postgres `23505`) | PLAT-01 (SC-2) | DB-integration runtime behavior; no test framework this phase (schema-only); requires a live Neon branch (`DATABASE_URL_UNPOOLED`), so it cannot run in DB-less CI. Already proven live **twice** (Plan 03 execution + `01-VERIFICATION.md` SC-2). | Against the Neon dev branch (`packages/db/.env` `DATABASE_URL_UNPOOLED`): (1) insert a `user` + `visitor_profile` with a mixed-case username e.g. `GsdProof<ts>`; (2) insert a second `visitor_profile` (with its own throwaway `user`) using the lowercase variant `gsdproof<ts>`; (3) **expect Postgres error `23505`, constraint `visitor_profile_username_lower_unq`** — read it off `error.cause` (drizzle wraps the pg error), not the top-level error; (4) delete both throwaway `user` rows in a `finally` block (cascade removes the profiles) and `SELECT` to confirm 0 residue; (5) do not commit the throwaway script. Reference reproduction: `01-03-SUMMARY.md` "Live Uniqueness Proof (SC-2)". |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify (compile-time/integration) or a documented manual-only procedure
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (12/13 map rows are green via automated commands)
- [x] Wave 0 covers all MISSING references (N/A — no framework this phase; single runtime gap documented manual-only)
- [x] No watch-mode flags
- [x] Feedback latency < 20s (compile-time gates)
- [ ] `nyquist_compliant: true` set in frontmatter — **NO: PARTIAL.** One runtime behavior (SC-2) is manual-only, not automated.

**Approval:** approved 2026-08-01 (PARTIAL — 12/13 behaviors automated; SC-2 uniqueness manual-only by decision at the validation gate)

---

## Validation Audit 2026-08-01

| Metric | Count |
|--------|-------|
| Gaps found | 1 |
| Resolved | 0 |
| Escalated | 0 |
| Marked manual-only | 1 (SC-2 `lower(username)` runtime uniqueness) |

**Notes:** State A audit of a draft-template VALIDATION.md. Reconstructed the Test Infrastructure,
Per-Task Map, and Sign-Off from the three plan SUMMARY coverage blocks and `01-VERIFICATION.md`.
Test infrastructure detected: **none** (no Vitest/Jest; `turbo run test` is a no-op). Twelve of
thirteen PLAT-01 behaviors are covered by existing automated commands (`typecheck`/`build`/
`db:migrate`/`db:generate`). The single runtime behavior — SC-2 case-insensitive username
uniqueness — has no committed repeatable test (the original proof was a deleted throwaway script);
per the validation-gate decision it is recorded as a documented manual-only procedure rather than
bootstrapping the project's first test framework in a schema-only phase. Phase 1 is therefore
**validated (PARTIAL)**.
