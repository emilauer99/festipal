# Retrospective — Workstream `mobile`

Living document. One section per milestone, newest last; cross-milestone trends at the end.

---

## Milestone: v1.0 — Rollout (Visitor Shell)

**Shipped:** 2026-08-12
**Phases:** 7 (incl. inserted 5.1) | **Plans:** 50 | **Tasks:** 116
**Timeline:** 2026-07-28 → 2026-08-12 (15 days) | **Merged as:** PRs #4–#13

### What Was Built

A visitor can install the app, log in without a password, complete a profile, browse and save
festivals, enter one gate-lessly, and reach profile, friends and settings from a global tab bar —
all on the quiks CI v1.0, verified on real Android hardware.

### What Worked

- **Tracer-first plans.** Every phase opened with a plan that drove one thin slice all the way
  through (schema → contract → API → screen). That is what caught the `drizzle-zod` 0.8.x/Zod-v4
  incompatibility in Phase 1 and the drizzle-zod `text()` type-inference bug in Phase 2 — both while
  they were cheap, not after five screens depended on them.
- **Contracts as the single source of truth.** `packages/contracts` deriving from Drizzle via
  `drizzle-zod` meant a column rename broke the build instead of drifting. Proven deliberately, not
  assumed.
- **The gates that earned their keep:** `code_review`, `verifier`, `plan_check`, on-device UAT. Each
  found real defects. The Phase-6 UAT alone surfaced a hard Hermes crash (`Intl.PluralRules`) that no
  automated gate in this project could have caught.
- **Falsifying our own tests.** Plan 06-10 tried three ways to defeat its own guard test and found a
  false negative (a substring match hitting comment prose). That habit is worth keeping.

### What Was Inefficient

- **Phases 5 and 6 were cut too big** — ~10 plans and ~650 KB of planning artifacts each. Most of the
  cost was context re-read by ~25 agent invocations, not work. The root cause was heterogeneous
  slicing: mixing a DB migration, contract changes, API work and four screens into one phase forces
  the *union* of all quality gates onto every part of it.
- **Standing gates instead of opt-in gates.** `research`, `plan_bounce` and `nyquist_validation` ran
  on phases built entirely from patterns that already existed in `apps/mobile`. They found nothing
  there and cost a lot.
- **The context stack inflated silently.** `.claude/CLAUDE.md` reached 25.3 KB and `STATE.md` 310
  lines — both re-read by every agent on every invocation. Fixed late (quick task 260812-ctx and this
  close), not early.
- **Three rounds of wrong theorising on the first-login unmatched-route bug.** Two device-failed
  fixes and one unverified one were shipped against a theory (`/`-route collision) that was never
  tested on device. The fourth round put `[UNMATCHED-DEBUG]` logs on real hardware and found the
  actual cause in one pass — an Expo dev-client launch URL being captured as a route.
- **Evidence quality slipped twice.** Device acceptance in 05.1-07 and 06-01/06-09 was granted as a
  blanket `approved` over 18–19 checkpoints with no per-item findings. That is weaker evidence than
  the format implies, and it is why `WINDOWS.md` 33/34/35 had to be `waived` rather than `fixed`.

### Patterns Established

- Pure, node-importable `lib/` modules (no RN imports) so logic is testable in the node-env Vitest
  runner — `deriveAge`, `formatDateRange`, `buildProfileMetaLine`, `resolveThemeMode`.
- Lazy `require` for native modules (MMKV) so the module stays importable off-device.
- A layer *over* an invariant rather than a replacement for it: the Phase-6 theme override sits above
  the 05.1 resolver, leaving its guard test byte-identical and still gating.
- One shared mechanism per interaction class — a single `SoonToast` for every placeholder, not one per
  screen.
- Nullable-for-"not found", never `undefined`; service returns a discriminated signal, controller maps
  it to a status code.

### Key Lessons

1. **Cut phases homogeneously.** Split the backend slice from the UI slice — then only the backend
   slice pays for the security and API-coverage gates. Aim for 4–6 plans, not 10.
2. **RN routing and native bugs must be verified on device.** A green node-env Vitest run proves
   nothing about Hermes, Metro or Expo Router. Two of this milestone's worst time sinks were
   theories that survived only because nobody looked at a device log.
3. **Keep the always-loaded context small.** Detail belongs in `.planning/codebase/*.md`, loaded on
   demand — not in `CLAUDE.md` or `STATE.md`.
4. **Squash-merging a predecessor phase orphans its successor branch.** After each squash merge,
   rebase the follow-up branch with `git reset --soft origin/main`; resetting local `main` alone is
   not enough and produces add/add conflicts.
5. **On Windows, stop Metro before `pnpm install`.** A running watcher makes the install fail ENOENT
   on `*_tmp_*/node_modules`.
6. **Record blanket approvals as blanket.** If a device sign-off has no per-item findings, the ledger
   entry is `waived` with a reason — never `fixed`, which would read as itemized evidence.

### Cost Observations

- Model mix: Opus for implementation and planning; review/verify agents pinned to `fable`; Sonnet for
  high-volume mechanical work.
- The dominant cost was **agent boot context**, not generated output — 50 plans meant 50 executors
  each loading the full context stack. This is the single biggest lever for the next milestone.

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Plans/Phase | Days | Notes |
|---|---|---|---|---|---|
| v1.0 Rollout | 7 | 50 | 7.1 | 15 | Phases 5 and 6 at ~10 plans each drove the average up |

**Target for the next milestone:** ≤ 6 plans per phase, homogeneous slices, gates opt-in per phase.
