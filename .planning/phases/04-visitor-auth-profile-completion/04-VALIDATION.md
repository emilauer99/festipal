---
phase: 4
slug: visitor-auth-profile-completion
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-05
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (per stack; `apps/mobile` has no runner yet — Wave 0 installs) |
| **Config file** | none in `apps/mobile` — Wave 0 adds `apps/mobile/vitest.config.ts` |
| **Quick run command** | `pnpm --filter mobile test` |
| **Full suite command** | `pnpm test` (workspace) |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter mobile test` (or the touched package's quick test)
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 4-XX-XX | TBD | TBD | AUTH-01..05 / IDN-01 | T-4-XX / — | filled by planner from PLAN must_haves | unit / e2e / manual | filled by planner | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky — planner fills concrete rows from RESEARCH.md ## Validation Architecture.*

---

## Wave 0 Requirements

- [ ] `apps/mobile/vitest.config.ts` — test runner config (none exists today; RESEARCH Wave 0 gap)
- [ ] Unit test stubs for the two pure functions: `mapOtpError()` (existing, untested) and the new username-suggestion generator
- [ ] `pnpm --filter mobile add -D vitest` — install runner if not present

*Force-quit session persistence and deep-link redirect are manual-only (see below).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session persists across full force-quit + relaunch | AUTH-03 | Requires killing the OS process; hot-reload does not exercise SecureStore rehydration (Pitfall 2/10) | Log in, fully kill the app (swipe from recents / stop process — NOT hot-reload), reopen → lands logged-in |
| Deep-link to protected route while logged out redirects without content leak, then returns-to after auth | AUTH-05 / SC-5 (D-02) | Native deep-link + navigation state through profile-completion; not unit-testable end-to-end | Open a protected deep link while logged out → auth flow → after login (+ profile-completion on first login) lands on the originally-tapped route (Pitfall 5) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
