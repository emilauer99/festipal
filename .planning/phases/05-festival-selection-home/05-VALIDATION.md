---
phase: 5
slug: festival-selection-home
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-05
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from 05-RESEARCH.md § Validation Architecture. The planner refines the
> Per-Task Verification Map once tasks exist.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.10 (`apps/api` supertest-based specs; `apps/mobile` node-env `lib/**/__tests__` only) |
| **Config file** | `apps/api/vitest.config.ts` + `apps/mobile/vitest.config.ts` (both present — no install needed) |
| **Quick run command** | `pnpm --filter @festipal/api test` |
| **Full suite command** | `pnpm test` (root Turborepo task, all packages) |
| **Estimated runtime** | ~30 seconds (api supertest suite) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @festipal/api test` (fast; existing supertest suite + new D-08 specs)
- **After every plan wave:** Run `pnpm test` (full Turborepo suite) + manual on-device pass for any wave touching navigation/screens
- **Before `/gsd-verify-work`:** Full suite green + full core-value path re-verified on a real Android device (matches Phase 3/4's established gate)
- **Max feedback latency:** ~30 seconds (automated); manual UAT per navigation/screen wave

---

## Per-Task Verification Map

> Provisional — the planner replaces `{plan}`/`{wave}`/task IDs once tasks are decomposed.
> Automated coverage concentrates on the D-08 master-data server contract; RN screen
> behaviors are manual-on-device (no RN component-test harness exists — Pitfall 5).

| Req | Behavior | Test Type | Automated Command | File Exists | Status |
|-----|----------|-----------|-------------------|-------------|--------|
| FEST-01 | `listFestivals` returns name/dates/place | integration (apps/api) | `pnpm --filter @festipal/api test -- festival-fields` | ❌ W0 | ⬜ pending |
| FEST-02 | Meine/Alle segment default (Meine) | manual-only | — (no RN component harness) | n/a | ⬜ pending |
| FEST-03 | Save persists server-side, survives restart | integration + manual restart | `pnpm --filter @festipal/api test -- save-idempotency` | ✅ (api half) | ⬜ pending |
| FEST-04 | Enter gate-less + non-dead-end back | manual-only | — | n/a | ⬜ pending |
| HOME-01 | Land on festival home after entering | manual-only (cold-start redirect) | — | n/a | ⬜ pending |
| HOME-02 | Home shows identity + key facts | integration (`getFestival` new fields) + manual visual | `pnpm --filter @festipal/api test -- get-festival-fields` | ❌ W0 | ⬜ pending |
| SEC-02 | New D-08 fields respect `festivalId`/`visitorId` scoping (no cross-tenant leak) | integration (extend `festival-isolation.spec.ts`) | `pnpm --filter @festipal/api test -- festival-isolation` | ✅ (extend) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/test/festival-fields.spec.ts` (or extend `festival-isolation.spec.ts`) — covers FEST-01/HOME-02/SEC-02: assert `startDate`/`endDate`/`place` round-trip through `listFestivals`/`listMyFestivals`/`getFestival` AND that the new fields never leak cross-tenant into `GET /me/festivals`
- [ ] `apps/mobile/lib/__tests__/date-range.test.ts` — covers the `formatDateRange` pure function (Pitfall 3 fallback: two `Intl.DateTimeFormat.format()` calls joined by en-dash, NOT `formatRange`), mirroring `lib/__tests__/otp-error.test.ts`
- [ ] No new test framework install needed — `pnpm test` already wired at the Turborepo root

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Meine/Alle segment defaults to Meine; saved festivals visually distinguished in Alle | FEST-01, FEST-02 | No RN component-test harness in `apps/mobile` (Pitfall 5) | On device: open Festivals tab → segment shows Meine active by default; switch to Alle → a saved festival shows the ✓/gespeichert distinction |
| One-tap save persists across app restart | FEST-03 | Restart is a device-level lifecycle flow | Save a festival → force-quit app → relaunch → festival still in Meine |
| Enter festival gate-less and return without a dead-end | FEST-04 | Navigation flow, no assertable unit surface | Enter any festival (saved or browsed) → land on its home → back returns to the list, not a dead-end |
| Cold start opens the active festival's home directly | HOME-01 | Cold-start redirect is a device-level UX flow (active-festival focus, D-06) | Enter a festival → force-quit → relaunch → app opens that festival's home directly |
| Festival home renders identity + key facts + disabled "coming soon" tiles | HOME-02, D-07 | Visual/RN screen, no component harness | Visual check on device: name/dates/place shown; Timetable/Lageplan/Cashless/News tiles present and disabled |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (or are documented manual-only)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (D-08 field round-trip + cross-tenant scoping + formatDateRange)
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (automated)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
