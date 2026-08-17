# GSD Debug Knowledge Base

Resolved debug sessions, indexed for fast lookup. `gsd-debugger` reads this at the start of every
investigation (Phase 0) to surface known-pattern hypotheses before forming new ones.

**A match here is a HYPOTHESIS CANDIDATE, not a diagnosis.** Test it first, but do not skip the
other branches.

---

## Symptom index — scan this first

| If you see… | Suspect | Entry |
|---|---|---|
| Auth succeeds server-side but the UI never advances; a relaunch lands you logged in | nanostores/better-auth lazy-mount teardown — session signal path is dead | [otp-login-stuck-code-screen](#otp-login-stuck-code-screen) |
| A signal/atom toggles, listeners "look attached", but no fetch ever runs | Atom is `active: true` with its mount callback permanently skipped | [otp-login-stuck-code-screen](#otp-login-stuck-code-screen) |
| Bug only after a Metro reload / only for returning users / "intermittent" | Boot-timing AND-gate — needs cached state at boot AND a late subscription | [otp-login-stuck-code-screen](#otp-login-stuck-code-screen) |
| A device log contains markers that do not exist in the source | STALE BUNDLE — not a code signal at all | [Verification pitfalls](#verification-pitfalls) |
| One `useSession()` / one subscriber app-wide, guard has no fallback | Single point of failure in the auth guard | [Patterns worth reusing](#patterns-worth-reusing) |
| Expo dev-client launch URL captured as an app route -> Unmatched route | `expo-development-client` / `_expo` / `--` deep-link artifact | `resolved/first-login-unmatched-route.md` |

Not yet indexed (read the file directly): `resolved/activity-detail-header-title.md`,
`resolved/create-title-tag-prefill.md`.

---

## otp-login-stuck-code-screen — correct OTP entered, app stays on the code screen forever

- **Date:** 2026-08-17
- **Error patterns:** stuck on OTP/code-entry screen; nothing happens after correct code; auth
  succeeds but UI does not navigate; relaunch/force-quit lands on home; no `GET /get-session`
  after `POST /sign-in/email-otp`; session atom delivers nothing; `signalListeners: 0` while
  `sessionListeners: 1`; `Stack.Protected` guard never flips; no error, no toast, no spinner
- **Root cause(s):** AND-gate, all three required —
  (1) CODE: `@better-auth/expo` `getActions()` hydrates the session atom at `createAuthClient()`
  module-init via `sessionAtom.set({ ...sessionAtom.get() })`; nanostores' `get()` LAZY-MOUNTS
  (`if (!lc) listen(noop)()`), so the atom mounts and unmounts with NO subscriber, arming the
  1000 ms `STORE_UNMOUNT_DELAY`. The unmount callback sets `active = false` then iterates
  `for (destroy of events[UNMOUNT]) destroy()`; better-auth's destructor calls
  `settleAbortedFetch()`, which opens with another `session.get()` — RE-MOUNTING mid-teardown
  (`active = true`, fresh refreshManager subscribing `$sessionSignal`). A JS array iterator picks
  up elements pushed during iteration, so the SAME loop runs the new destructor and kills the
  fresh manager, leaving `active === true`. Every later `listen()` then SKIPS the mount callback →
  `$sessionSignal → fetchSession` is never resubscribed for the life of the JS context;
  (2) DATA: a valid cached session must exist at boot (returning visitor) or `get()` is never
  called — which is why a first login from a cold logged-out start never fails;
  (3) ENVIRONMENT: the app's single `useSession()` subscription must attach AFTER the 1000 ms
  timer. A real Expo boot blocks the JS thread for hundreds of ms, which both widens the corrupt
  window and lands the subscription inside it.
- **Fix:** Two independent layers (commit `820eede`). LAYER 1 (root cause):
  `authClient.$store.listen('session', () => {})` at module init in `lib/auth-client.ts` keeps
  `lc` non-zero so the deferred unmount never runs. LAYER 2 (independence): resolve the auth guard
  from `authClient.getCookie()` (written to SecureStore synchronously BEFORE better-auth notifies)
  with `GET /me` as the authority via a pure `nextAuthResolveStep()`, and call `refreshAuthState()`
  on a successful sign-in — the login counterpart to logout's `forceUnauthenticated()`.
- **Files changed:** `apps/mobile/lib/auth-client.ts`, `apps/mobile/lib/auth-state.ts`,
  `apps/mobile/app/_layout.tsx`, `apps/mobile/app/(auth)/verify.tsx`,
  `apps/mobile/lib/__tests__/auth-session-atom-mount.test.ts`,
  `apps/mobile/lib/__tests__/auth-resolve-step.test.ts`,
  `apps/mobile/lib/__tests__/support/expo-network-stub.ts`, `apps/mobile/vitest.config.ts`
- **Why not caught:** No gate existed for this class. The defect is an INTERACTION between a
  library's cache hydration, nanostores' lifecycle and real boot timing — invisible to typecheck
  and lint, and invisible to review because every line is correct in isolation (the app's own code
  contained no defect). The unit suite mocked the auth client, so the atom's mount lifecycle — the
  actual failing surface — was never exercised. Phase-5 device UAT passed legitimately: it logged
  in from a cold logged-out start, which by construction cannot satisfy precondition (2).
- **Recurrence guard:** `apps/mobile/lib/__tests__/auth-session-atom-mount.test.ts` (drives the
  REAL better-auth client through the failing boot timing; mutation-proven — reverting the pin
  turns it red, and a control case stays green so it is not always-red) +
  `auth-resolve-step.test.ts` (pins the guard's decision table) + the architectural guard: layer 2
  removes the single-point-of-failure, so a future library lifecycle change degrades to
  "cookie + `GET /me` decide" instead of a stuck screen.
- **Full session:** `.planning/debug/resolved/otp-login-stuck-code-screen.md`

---

## Patterns worth reusing

### Nanostores lazy-mount teardown (any nanostores-backed library: better-auth, others)

Signature to watch for, generalized beyond better-auth:

- `atom.get()` **mounts lazily**. A `get()` on an unmounted atom mounts it, and if nothing
  subscribes, the immediate `off()` arms the deferred-unmount timer (nanostores: 1000 ms).
- A destructor that **re-reads the atom** (`get()` inside an UNMOUNT handler) re-mounts it
  mid-teardown.
- Destructors run in a `for…of` over an array the re-entrant mount **pushes into** — so the same
  loop tears down the freshly created manager, while `active` stays `true` (it was cleared before
  the loop, then set back by the re-mount, and is never re-cleared).
- Result: a permanently `active` atom whose mount callback is skipped by every future `listen()`.

**Symptom signature:** the signal toggles, listeners look attached, but **no fetch ever runs**.
Only DIRECT `.set()` calls still reach the UI — fetch-driven updates are all missing.

**Probe correctly:** read `.value` / `.lc` DIRECTLY, never `.get()` — a `get()` from your probe
lazy-mounts the atom and destroys the evidence. And subscribe your watcher to a DIFFERENT atom than
the one under suspicion, or your own listener masks the dropped subscription. Also: `onMount` runs
the mount callback synchronously *before* `lc` is incremented, so `lc === 1` with a dependent
atom's `lc === 0` is the re-entrancy fingerprint.

**Fix shape:** pin one listener at module init so `lc` is never 0, AND stop depending on the atom
as the only source of truth.

### One subscriber = one point of failure

If `useSession()` (or any external-store hook) has exactly ONE consumer app-wide, the atom's mount
lifetime is tied 1:1 to that one subscription and the guard has no second source of truth.
`grep` for the consumer count early — it is a cheap, high-signal check.

**Symmetry rule:** if a logout path has an app-level backstop (`forceUnauthenticated()`), the login
path needs its counterpart (`refreshAuthState()` / `forceAuthenticated()`). An asymmetric backstop
is a latent stuck-screen bug. In this codebase the logout backstop existed since phase 6 and the
login one did not — that asymmetry *was* the bug's blast radius.

**Prefer the earlier, synchronous signal:** `@better-auth/expo` writes the cookie to SecureStore
synchronously BEFORE it notifies, so `authClient.getCookie()` is strictly earlier and more reliable
than the session atom. Let the server (`GET /me`) be the authority.

---

## Verification pitfalls

### Stale bundle (Expo / Metro) — the #1 false FAIL

**Rule:** log markers that no longer exist in the source are proof of an OLD BUNDLE, nothing more.
Before reading a device run as a failure, grep one marker from the log against the tree. If it is
absent, the run tells you nothing about the current code.

**Always** kill Metro fully and start with `npx expo start -c` before trusting a device
verification. Cost when skipped in this session: one full verification round-trip on a fix that was
already correct.

### A green node/vitest harness is not exoneration

Round 2 of the OTP session ran 5/5 device-realistic variants green and the library-state branch was
declared eliminated — but the harness's idle JS thread had a ~1 ms gap where a real Expo boot has
hundreds of ms. It missed the corrupt window by milliseconds; it did not disprove the mechanism.

**Rule:** when a harness passes and the device fails, suspect the harness's TIMING before
concluding the mechanism is wrong. Sweep the timing parameter instead of asserting one value.
Corollary (paid for twice now, see also `first-login-unmatched-route`): RN routing, native and
lifecycle bugs must be verified ON DEVICE — a node-env vitest pass does not transfer.
