---
phase: 3
slug: mobile-app-shell-i18n-foundation
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-08-03
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
>
> **Phase-specific note:** this is a greenfield **mobile-client** phase whose four success
> criteria (D-02 real OTP + kill-and-relaunch, D-03 real festival + save→enter, SC-2 no
> auth-flash, SC-3 DE/EN device-locale) are only confirmable on real hardware over LAN
> (CONTEXT "Sichtbarer Endzustand"). There is intentionally **no automated RN test suite**
> in `apps/mobile` this phase — Detox/Maestro E2E is out of scope (RESEARCH Validation
> Architecture). Automated feedback therefore comes from `lint` (incl. `no-literal-string`),
> `typecheck` (compile-time contract binding), `expo export` (Metro resolution), the
> `lingui extract` + `git diff` catalog-currency gate, and the existing backend Vitest suite.
> The phase gate is a conversational on-device UAT (Plan 06 Task 2).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (existing — `apps/api`, `packages/i18n`). No test framework in `apps/mobile` (none planned this phase). |
| **Config file** | `apps/api` Vitest config (existing); `packages/i18n` gains a Vitest `test` script in Plan 02 Task 2. `apps/mobile`: none (lint + typecheck + `expo export` + `lingui` gates instead). |
| **Quick run command** | `pnpm --filter @festipal/mobile lint && pnpm --filter @festipal/mobile typecheck` |
| **Full suite command** | `pnpm --filter @festipal/api test` (backend unit suite, unaffected by client-only changes) + `pnpm --filter @festipal/i18n test` (resolveUiLocale, from Plan 02) |
| **Catalog gate** | `pnpm --filter @festipal/mobile exec lingui extract && git diff --exit-code apps/mobile/locales` |
| **Build/resolution gate** | `pnpm --filter @festipal/mobile exec expo export --platform android` (asserts no `Unable to resolve module @festipal/*`) |
| **Config gates** | `docker compose config -q` (Plan 01); `pnpm --filter @festipal/mobile exec expo config --type public` (Plan 06) |
| **Estimated runtime** | lint+typecheck ~15–30s; backend `test` ~10–20s; `expo export` ~30–60s (cold); `lingui extract`+diff ~5s |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @festipal/mobile lint && pnpm --filter @festipal/mobile typecheck` (backend tasks in Plan 01: `pnpm --filter @festipal/api typecheck && test`).
- **After every plan wave:** the above, plus the wave's catalog gate (`lingui extract` + `git diff`) where the wave touched `locales/`, and a manual on-device smoke pass once a real screen exists.
- **Before `/gsd-verify-work`:** backend `pnpm --filter @festipal/api test` + `pnpm --filter @festipal/i18n test` green; mobile `lint`/`typecheck`/`expo export` green; catalogs current.
- **Phase gate:** the four success criteria are all manual/device-verified (Plan 06 Task 2 UAT) — a green automated suite is NOT the gate this phase.
- **Max feedback latency:** ~60 seconds (worst case = cold `expo export`).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PLAT-02 | T-03-02 / T-03-03 | Dev-only Postgres/Mailpit stack; `.env.example` placeholder secrets only | config | `docker compose config -q` | ✅ (docker CLI; file created by this task — W0-equiv infra) | ⬜ pending |
| 03-01-02 | 01 | 1 | PLAT-02 | T-03-01 / T-03-SC | `trustedOrigins` whitelists exact `festipal://`/`exp://` (no bare `*`); Mailpit transport never throws | unit | `pnpm --filter @festipal/api typecheck && pnpm --filter @festipal/api test` | ✅ (Vitest + apps/api suite exist) | ⬜ pending |
| 03-02-01 | 02 | 1 | PLAT-02, I18N-01 | T-03-04 / T-03-SC | Explicit Metro `nodeModulesPaths`/`watchFolders`; export-log asserts no stale/duplicate `@festipal/*` | build | `pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile exec expo export --platform android …` (grep: no `Unable to resolve module @festipal`) | ❌ W0 (this tracer task bootstraps `apps/mobile` package.json + scripts) | ⬜ pending |
| 03-02-02 | 02 | 1 | I18N-01 | T-03-04 | `no-literal-string` active before first product screen; catalogs real (non-empty `msgstr`) | tdd (unit + lint) | `pnpm --filter @festipal/mobile lint && pnpm --filter @festipal/mobile exec lingui extract && git diff --exit-code apps/mobile/locales && pnpm --filter @festipal/i18n test` | ❌ W0 (eslint-plugin-i18next + lingui.config + i18n `test` script bootstrapped here) | ⬜ pending |
| 03-03-01 | 03 | 2 | PLAT-02 | T-03-06 / T-03-08 | SecureStore-only session; `credentials: 'omit'`; cookie sourced only from `authClient.getCookie()` | compile | `pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile lint` | ✅ (mobile scripts exist after 03-02) | ⬜ pending |
| 03-03-02 | 03 | 2 | PLAT-02 | T-03-07 | Splash-held four-state guard; group-layer `Stack.Protected` (no deep-link leak); no per-screen gate | compile | `pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile lint` | ✅ | ⬜ pending |
| 03-04-01 | 04 | 3 | PLAT-02, I18N-01 | T-03-09 / T-03-10 / T-03-11 | Real OTP round-trip only (no dev bypass); server owns validation/rate-limit; localized error states | compile + lint + catalog | `pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile lint && pnpm --filter @festipal/mobile exec lingui extract && git diff --exit-code apps/mobile/locales` | ✅ | ⬜ pending |
| 03-04-02 | 04 | 3 | PLAT-02, I18N-01 | T-03-09 | Placeholder profile via server-enforced unique index (23505→409); localized retry | compile + lint + catalog | `pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile lint && pnpm --filter @festipal/mobile exec lingui extract && git diff --exit-code apps/mobile/locales` | ✅ | ⬜ pending |
| 03-05-01 | 05 | 4 | PLAT-02, I18N-01 | T-03-12 / T-03-13 | Gate-less entry (ADR-014, no client access gate); renders only typed contract body | compile + lint + catalog | `pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile lint && pnpm --filter @festipal/mobile exec lingui extract && git diff --exit-code apps/mobile/locales` | ✅ | ⬜ pending |
| 03-05-02 | 05 | 4 | I18N-01 | T-03-13 | Static localized placeholder; no master-data over-fetch (deferred to Phase 5) | compile + lint + catalog | `pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile lint && pnpm --filter @festipal/mobile exec lingui extract && git diff --exit-code apps/mobile/locales` | ✅ | ⬜ pending |
| 03-06-01 | 06 | 5 | PLAT-02 | T-03-14 / T-03-15 / T-03-SC | Cleartext/ATS scoped dev-build-only via comment; no release/EAS profile configured | config | `pnpm --filter @festipal/mobile typecheck && pnpm --filter @festipal/mobile exec expo config --type public > /dev/null` | ✅ | ⬜ pending |
| 03-06-02 | 06 | 5 | PLAT-02, I18N-01 | T-03-14 | On-device: no auth-flash, real OTP, cookie forwarding, kill-and-relaunch persistence, DE/EN + German fallback | **manual (device UAT)** | MISSING — manual-only; see Manual-Only Verifications | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No standalone Wave 0 plan exists. The test/verification infrastructure is bootstrapped **inline
by the first tasks executed** (Plan 01 Task 1 and Plan 02 Tasks 1–2, all in Wave 1), because the
tooling *is itself a phase deliverable*. `wave_0_complete: false` reflects that this bootstrapping
happens during execution, not before it. Each item below is created by the task noted:

- [ ] `apps/mobile/package.json` — add `lint`/`typecheck` scripts (no `test` script; documented as intentional) — **Plan 02 Task 1**
- [ ] `apps/mobile/eslint.config.mjs` — extends `@festipal/config/eslint` + `eslint-plugin-i18next` `no-literal-string` rule — **Plan 02 Task 2**
- [ ] `apps/mobile/lingui.config.ts` + `locales/{en,de}/messages.po` — real (not stubbed) catalogs, enabling the `lingui extract` + `git diff` gate — **Plan 02 Task 2**
- [ ] `packages/i18n` `test` script (Vitest) + `resolve.test.ts` — enables `pnpm --filter @festipal/i18n test` — **Plan 02 Task 2**
- [ ] `turbo.json` — confirm `apps/mobile` `lint`/`typecheck` are picked up by the root pipeline (Turbo workspace-glob matching; verify once scripts exist) — **Plan 02 Task 1**
- [ ] Root `docker-compose.yml` (D-11) — Wave 0-equivalent prerequisite: the on-device UAT (kill-and-relaunch, festival list over LAN) cannot run without the live local API + Mailpit — **Plan 01 Task 1**

*Once Plans 01–02 land, set `wave_0_complete: true`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real email→6-digit-OTP login (code read from Mailpit); wrong/expired-code localized errors | PLAT-02 | OTP round-trip + real inbox read; no automated RN harness this phase | Plan 06 Task 2 steps 2 — enter email, tap "Send code", read code at `http://<pc-lan-ip>:8025`, verify, confirm localized error copy on wrong/expired |
| Cookie forwarding — authenticated `GET /festivals` returns data, not 401 | PLAT-02 | Runtime cookie header; `typecheck` only proves compile-time contract binding, not the live header | Plan 06 Task 2 step 3 — confirm festivals list loads real "Frequency 2026" on-device |
| Core-value path: Save → gate-less Enter → festival home (no dead-end) | PLAT-02 | End-to-end navigation on real device | Plan 06 Task 2 step 4 — tap Save, then Enter, confirm home placeholder + back navigation |
| Session survives force-quit-and-relaunch | PLAT-02 | SecureStore persistence across a killed process (not hot-reload) | Plan 06 Task 2 step 5 — force-quit (kill process), relaunch, confirm still authenticated |
| No wrong-route flash on cold start (splash held) | PLAT-02 (SC-2) | Timing/visual behavior only observable on real hardware | Plan 06 Task 2 step 1 — cold start, confirm splash holds until auth resolves |
| Device-language switch DE/EN + German fallback for a third language | I18N-01 (SC-3, D-06/D-07) | Requires changing OS system language on a real device | Plan 06 Task 2 step 6 — set device language German→English→French, confirm UI chrome + German fallback |

*These are consolidated into the single blocking on-device UAT checkpoint (Plan 06 Task 2), run on a
real Android device (`npx expo run:android`) AND a real iPhone (`npx expo run:ios`).*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (only 03-06-02 is manual — a deliberate on-device UAT gate)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every task except the terminal UAT has an automated gate)
- [x] Wave 0 covers all MISSING references (`❌ W0` rows 03-02-01/02 bootstrapped by Plan 02 Tasks 1–2; docker-compose by Plan 01 Task 1)
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
