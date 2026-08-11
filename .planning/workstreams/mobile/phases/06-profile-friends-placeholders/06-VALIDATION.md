---
phase: 6
slug: profile-friends-placeholders
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-11
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.x (node environment — `apps/mobile/vitest.config.ts`) |
| **Config file** | `apps/mobile/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @quiks/mobile test` |
| **Full suite command** | `pnpm test` (Turbo, all packages) |
| **Estimated runtime** | ~{N} seconds |

*Scope caveat (from `06-RESEARCH.md`): the mobile Vitest runner is node-env and covers `lib/` only — screen/route/native behaviour is NOT unit-testable here and must fall to lint/typecheck gates or on-device UAT.*

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @quiks/mobile test`
- **After every plan wave:** Run `pnpm lint && pnpm typecheck && pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** {N} seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {N}-01-01 | 01 | 1 | REQ-{XX} | T-{N}-01 / — | {expected secure behavior or "N/A"} | unit | `{command}` | ✅ / ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `{tests/test_file.ts}` — stubs for REQ-{XX}
- [ ] `{shared fixtures}`
- [ ] `{framework install}` — if no framework detected

*Existing infrastructure (vitest, node-env, `apps/mobile/lib/__tests__/`) covers all `lib/`-level phase requirements; screen-level behaviour needs the Manual-Only table below.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| {behavior} | REQ-{XX} | {reason} | {steps} |

*Repo lesson: RN routing and native behaviour must be verified on-device (device log + `expo start -c`) — a green node-env Vitest run is not evidence for route registration or navigation.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < {N}s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
