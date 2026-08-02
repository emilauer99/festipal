---
phase: 02-otp-auth-festival-backend-api
verified: 2026-08-02T16:05:00Z
status: passed
score: 16/16 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 15/16
  gaps_closed:
    - "POST /api/v1/festivals/:festivalId/save is gate-less: any authenticated visitor can save any festival; it writes a my_festival row and returns 200 (CR-01 unhandled-500-on-missing-profile defect)"
  gaps_remaining: []
  regressions: []
deferred: []
human_verification: []
---

# Phase 2: OTP Auth & Festival Backend API Verification Report

**Phase Goal:** The NestJS API authenticates visitors passwordlessly via email-OTP, supports first-login profile completion and festival browse/save, and isolates festival-scoped data by festivalId
**Verified:** 2026-08-02T16:05:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (plan 02-06)

## Goal Achievement

### Gap Closure Verification (CR-01 / focus of this re-verification)

The prior verification (2026-08-02T12:22:16Z) found one BLOCKER: `POST /api/v1/festivals/:festivalId/save` threw an unhandled `500` for an authenticated visitor with no completed profile (`GET /me` -> `profile: null`), instead of a clean 200/4xx. Gap-closure plan `02-06` claims this is fixed. Verified directly against the codebase, not the SUMMARY narrative:

| Check | Evidence | Result |
|-------|----------|--------|
| Contract declares 409 | `packages/contracts/src/router.ts:76` — `responses: { 200: z.object({ saved: z.literal(true) }), 404: errorSchema, 409: errorSchema }`, reusing the shared `errorSchema` (no bespoke shape) | VERIFIED |
| Service catches 23503 FK violation | `apps/api/src/festival/festival.service.ts:125-151` — `save()` return type widened to `{status:'ok'}\|{status:'not-found'}\|{status:'profile-required'}`; `try { insert... } catch (err) { const cause = (err as {cause?:unknown}).cause; if (cause instanceof PostgresError && cause.code === '23503') return {status:'profile-required'}; throw err; }` — mirrors `me.service.completeProfile`'s 23505 idiom exactly, as prescribed | VERIFIED |
| Controller maps signal to 409 | `apps/api/src/festival/festival.controller.ts:51-53` — `if (result.status === 'profile-required') return { status: 409, body: { message: 'Complete your profile before saving a festival' } };` | VERIFIED |
| Happy-path / 404 path unchanged | Same controller/service — `ok`->200 `{saved:true}` and `not-found`->404 branches untouched, confirmed by reading the full file | VERIFIED |
| Schema untouched (plan prohibition) | `git show 0151654 --stat` / `7f311bf --stat` — no `packages/db/*` files in either gap-closure commit's diff | VERIFIED |
| Regression test exists and is substantive | `apps/api/test/save-profile-required.spec.ts` — signs in via OTP, deliberately omits the `visitor_profile` insert, POSTs save, asserts `res.status` is `409` and explicitly `not.toBe(500)`, asserts `myFestival` rows for the caller `toHaveLength(0)` | VERIFIED |
| Test actually passes (not just claimed) | Ran directly: `pnpm --filter @festipal/api exec vitest run test/save-profile-required.spec.ts` -> `Test Files 1 passed (1)`, `Tests 1 passed (1)` — output confirms the assertion path executed for real (dev-OTP capture, sign-in, 409 response) | VERIFIED (behavioral) |
| Full suite green, no regression | Ran directly: `pnpm --filter @festipal/api exec vitest run` -> `Test Files 8 passed (8)`, `Tests 31 passed (31)` — matches SUMMARY's claimed 8 files / 31 tests exactly | VERIFIED |
| Typecheck / contract build clean | Ran directly: `pnpm --filter @festipal/contracts build` (exit 0) then `pnpm --filter @festipal/api exec tsc --noEmit -p tsconfig.json` (exit 0, no output) | VERIFIED |
| Lint clean | Ran directly: `pnpm --filter @festipal/api lint` -> exit 0, no output | VERIFIED |
| No debt markers | `grep -n "TBD\|FIXME\|XXX"` across all 4 gap-closure files -> no matches | VERIFIED |

**Gap closed.** The fix is present in source (not stubbed), wired end-to-end (contract -> service -> controller), and behaviorally proven by a real regression test that was executed in this verification session, not merely cited from the SUMMARY.

### Observable Truths (full re-check)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | better-auth's emailOTP plugin wired into NestJS (6-digit code, ~5-min expiry) behind a global AuthGuard, mounted at `/api/auth/*` | VERIFIED | Unchanged since prior verification; `auth-guard.spec.ts` (10/10) still in the green 8-file run |
| 2 | OTP send/verify + GET /me, POST /me/complete-profile, GET /me/username-availability, GET /festivals, POST /festivals/:festivalId/save, GET /me/festivals reachable | VERIFIED | `save-profile-required.spec.ts` proves the previously-uncertain save path now returns a clean, documented response in-process; all other endpoints unchanged from prior live verification |
| 3 | Every endpoint tagged public vs protected, captured in an endpoint x auth-annotation table | VERIFIED | `02-AUTH-ANNOTATIONS.md` unchanged; not touched by 02-06 |
| 4 | Festival-scoped reads always constrained by festivalId; automated test proves cross-festival isolation | VERIFIED | `festival-isolation.spec.ts` still passes as part of the 8-file/31-test green run |
| 5 | Save/enter is gate-less (no 403-on-unsaved); save only writes my_festival — or returns a clean documented error, never crashes | VERIFIED | Gate-less-ness unchanged (no membership check); the missing-profile edge case now returns a contract-documented 409 and writes zero rows, per `save-profile-required.spec.ts` (passing) — the "never crashes" clause now holds |
| 6 | bodyParser: false plus re-added JSON parsing smoke-tested | VERIFIED | `bodyparser-smoke.spec.ts` unchanged, still in the green run |
| 7 | username-availability advisory, complete-profile source of truth (TOCTOU-safe) | VERIFIED | `username-race.spec.ts` / `me-endpoints.spec.ts` unchanged, still green |
| 8 | Email OTP via env-configured provider (Resend) with dev fallback — no secrets committed | VERIFIED | Unchanged; `.env.example` still placeholder-only |
| 9 | App endpoints derive Zod shapes from packages/contracts; better-auth's OTP routes excluded from the contract | VERIFIED | `router.ts` still has no `/auth` path; new `409: errorSchema` reuses the existing shared schema, no re-declaration |
| 10 | Full ts-rest contract surface exists under one `c.router({...})` call | VERIFIED | Confirmed unchanged structurally, `saveFestival` still inside the single router call |
| 11 | `env` is a single memoized module-level export | VERIFIED | Unchanged |
| 12 | vitest + supertest + @nestjs/testing harness runs | VERIFIED | Ran directly this session: 8 files, 31 tests, all pass |
| 13 | GET /api/v1/me/festivals scoped by session.user.id, never a request parameter | VERIFIED | Unchanged |
| 14 | Idempotent seed script | VERIFIED | Unchanged, not touched by 02-06 |
| 15 | Concurrent-race backstop truths (documented `verification: backstop` tier) | UNCERTAIN (backstop, no automated coverage) — same as prior verification, non-blocking per plans' own stated tier | Unchanged |
| 16 | POST /festivals/:festivalId/save returns a clean 409 (not 500) and writes zero rows for a profile-null caller (CR-01 closure, this re-verification's focus) | VERIFIED | See Gap Closure Verification table above — source read + test executed live in this session |

**Score:** 16/16 truths at a verifiable status (15 VERIFIED/unchanged + 1 newly VERIFIED for the closed gap); truth #15 remains an explicitly-accepted backstop item, consistent with the prior verification's treatment (not counted as a gap or human-verification item, per the plans' own `verification: backstop` tier and the prior verification's precedent).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/contracts/src/router.ts` | `saveFestival` gains `409: errorSchema` | VERIFIED | Confirmed via grep, reuses shared schema |
| `apps/api/src/festival/festival.service.ts` | `save()` catches 23503, returns `profile-required` | VERIFIED | Confirmed via source read |
| `apps/api/src/festival/festival.controller.ts` | Maps `profile-required` -> 409 | VERIFIED | Confirmed via source read |
| `apps/api/test/save-profile-required.spec.ts` | New regression spec | VERIFIED | Exists, substantive (121 lines), passes standalone and in full suite |
| All artifacts from the original 5 plans (02-01 through 02-05) | Unchanged | VERIFIED | `git status` shows a clean tree apart from an unrelated `.planning/config.json` change; no regressions found |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `festival.service.ts#save` catch branch | `postgres` package's `PostgresError` | `cause instanceof PostgresError && cause.code === '23503'` | WIRED | Confirmed; import present at top of file |
| `festival.controller.ts#saveFestival` | `festival.service.ts#save`'s `profile-required` branch | `result.status === 'profile-required'` conditional | WIRED | Confirmed |
| `save-profile-required.spec.ts` | live app instance via `createTestApp()` | supertest POST against `/api/v1/festivals/:id/save` | WIRED | Confirmed by running the test — it exercised a real in-process NestJS app + real Postgres insert/FK-violation path |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Contract build | `pnpm --filter @festipal/contracts build` | exit 0, dist emitted | PASS |
| API typecheck | `pnpm --filter @festipal/api exec tsc --noEmit -p tsconfig.json` | exit 0, no output | PASS |
| New regression spec, standalone | `pnpm --filter @festipal/api exec vitest run test/save-profile-required.spec.ts` | 1 file, 1 test, passed — log shows real OTP capture + 409 response | PASS |
| Full apps/api suite | `pnpm --filter @festipal/api exec vitest run` | 8 files, 31 tests, 0 failures | PASS |
| Lint | `pnpm --filter @festipal/api lint` | exit 0, no output | PASS |
| Debt-marker scan on gap-closure files | `grep -n "TBD\|FIXME\|XXX"` on the 4 changed files | no matches | PASS |
| DB schema untouched (plan prohibition) | `git show 0151654 --stat` / `git show 7f311bf --stat` | neither commit touches `packages/db/*` | PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|-----------------|--------------|--------|----------|
| SEC-01 | 02-01 through 02-06 | Login-first — all app functionality requires authentication | SATISFIED | Unchanged from prior verification; global `AuthGuard`, `auth-guard.spec.ts` 10/10 |
| SEC-02 | 02-01, 02-03, 02-04, 02-05, 02-06 | Festival-scoped data isolated by festivalId; save/enter gate-less, robust (never crashes) | SATISFIED | Isolation proven (`festival-isolation.spec.ts`); gate-less-ness correct; the "never crashes" robustness clause that was previously violated (CR-01) is now closed by `02-06` — verified by direct test execution in this session, not by SUMMARY claim alone |

Note: `.planning/REQUIREMENTS.md`'s traceability table (lines 97-98) still lists `SEC-01`/`SEC-02` as `Gaps Found` — this is a stale documentation artifact from before the 02-06 gap closure and should be updated to `Complete` to match the checkbox state at line 45-46 (already `[x]`). This is an informational note, not a code-level gap; it does not affect the verified status of the codebase itself.

No orphaned requirement IDs found — only SEC-01/SEC-02 map to Phase 2, both present in every plan's `requirements` frontmatter field (including `02-06-PLAN.md`).

### Anti-Patterns Found

None in the gap-closure files (`festival.service.ts`, `festival.controller.ts`, `router.ts`, `save-profile-required.spec.ts`) — no debt markers, no stubs, no hardcoded empty returns, no orphaned exports.

Carried forward from the prior verification (unresolved, but explicitly non-blocking Warning-tier items not in scope for 02-06's fix — same as before):

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `packages/contracts/src/schemas.ts` / `packages/db/src/schema/visitor-profile.ts` | No length/format validation on username/displayName/avatar | Warning | WR-01, unresolved, out of scope for this phase's must-haves |
| `apps/api/src/me/me.service.ts` | `completeProfile`'s catch treats every 23505 as "username taken" even for a duplicate accountId | Warning | WR-02, unresolved |
| `apps/api/src/auth/auth.instance.ts` / `db.module.ts` | Two independent Postgres pools | Warning | WR-03, unresolved |
| `apps/api/src/auth/email/dev-otp-email-provider.ts` | Shared OTP capture file, no per-request isolation | Warning | WR-04, dev-only, unresolved |
| `apps/api/test/setup.ts` | No test-DB guard on `DATABASE_URL` | Warning | WR-05, unresolved |
| 5 spec files | OTP helper trio duplicated verbatim (now including `save-profile-required.spec.ts`) | Warning | WR-06, unresolved, plan explicitly deferred this dedup |

No `TBD`/`FIXME`/`XXX` debt markers anywhere in the phase's modified files.

### Human Verification Required

None. All 16 truths resolve to VERIFIED or the same pre-accepted backstop-tier UNCERTAIN (non-blocking, unchanged from the prior verification's precedent, not newly introduced by this re-verification).

### Gaps Summary

No gaps remain. The single BLOCKER from the prior verification (CR-01: unhandled 500 on `POST /api/v1/festivals/:festivalId/save` for a profile-null caller) is closed:

- `packages/contracts/src/router.ts` declares a `409: errorSchema` response for `saveFestival`.
- `apps/api/src/festival/festival.service.ts#save()` catches the Postgres `23503` FK violation and returns `{ status: 'profile-required' }` instead of letting it propagate.
- `apps/api/src/festival/festival.controller.ts` maps that signal to a `409 { message }` response.
- `apps/api/test/save-profile-required.spec.ts` is a real, substantive regression test (not a stub) that signs in via OTP, deliberately skips profile completion, and asserts both the 409 status and zero written rows — executed directly in this verification session and confirmed passing, along with the full 8-file/31-test suite, typecheck, contract build, and lint.

Phase 2's goal — passwordless email-OTP auth, first-login profile completion, festival browse/save, and festivalId-scoped data isolation — is achieved and its previously-identified robustness defect is closed.

**Minor follow-up (non-blocking):** `.planning/REQUIREMENTS.md`'s traceability table still shows `SEC-01`/`SEC-02` as `Gaps Found` (stale); recommend updating to `Complete` to match the phase's actual state.

---

_Verified: 2026-08-02T16:05:00Z_
_Verifier: Claude (gsd-verifier)_
