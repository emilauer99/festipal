---
status: complete
phase: 04-visitor-auth-profile-completion
source: [04-VERIFICATION.md]
started: 2026-08-05T13:40:00Z
updated: 2026-08-05T13:40:00Z
---

## Current Test

All tests complete. 12/12 passed.

## Tests

### 1. Task 1 (AUTH-01 tracer): Welcome → Email → real OTP send → verify → lands in profile-setup (dev build w/ Mailpit)
expected: New email creates a global Account; GET /me returns profile:null; guard routes to (profile-setup). (WINDOWS #3)
result: [pass]

### 2. Task 2 (IDN-01): fresh account username live-check + Done → festivals; confirm request body is {username, displayName} only
expected: Live-check idle/checking/available states render correctly; Done gated; 200 lands in festivals; no avatar field in the network body. (WINDOWS #4)
result: [pass]

### 3. AUTH-02: a returning visitor (email with existing VisitorProfile) lands straight in festivals after OTP, skipping (profile-setup)
expected: Guard reads GET /me profile != null and routes directly to festivals. (WINDOWS #5)
result: [pass]

### 4. AUTH-03: session survives a real OS force-quit (swipe-away, not hot-reload) + relaunch, no OTP re-prompt
expected: Visitor lands logged-in on festivals after relaunch. (WINDOWS #6, #14)
result: [pass]

### 5. AUTH-05 / verify.tsx: correct code auto-submits; wrong code shows unified error box + Send new code; resend 60s→0 becomes tappable, double-tap-safe; Change email returns to Email; DE copy matches mockup
expected: All described interaction states render and behave as specified. (WINDOWS #7)
result: [pass]

### 6. Avatar picker + MMKV persistence: gallery pick + camera capture replace the initials tile; force-quit + relaunch on same account → photo persists; completeProfile body has no avatar field
expected: Photo persists via MMKV across a real restart; no avatar leaves the device. (WINDOWS #8)
result: [pass]

### 7. Username taken-state (both triggers): typed-taken username shows both Copywriting-Contract lines with a verified ≤20-char suggestion; a forced completeProfile 409 shows the same UI and regenerates the suggestion
expected: Both live-check and 409-triggered taken states render identically with a real available suggestion. (WINDOWS #9)
result: [pass]

### 8. AvatarTile visual + encoding backstop: a real picked/captured photo visually replaces the initials tile (circular, r-pill); a long/multi-byte/emoji displayName does not break the tile or layout
expected: Visual smoke check passes; no crash/garbled layout on edge-case displayName input. (WINDOWS #10)
result: [pass]

### 9. AUTH-04 device UAT: tap logout icon → Welcome; airplane-mode logout → still Welcome; fast double-tap → no double-fire/crash; confirm the just-revoked session can no longer authorize a protected call on-device
expected: Logout is robust to offline and rapid re-tap on a real device; the server-side revocation proven headlessly (signout-origin.spec.ts) is also observable on-device (re-using the same session token after logout fails). (WINDOWS #11)
result: [pass]

### 10. Deep-link return-to (D-02/SC-5): cold deep link to festipal://festivals while logged out → auth flow, no content leak; after OTP (+first-login profile-completion) lands on the originally-tapped route, not Home; repeat as returning user and warm-start
expected: The captured destination survives the profile-completion detour and replays correctly in all four launch modes. (WINDOWS #12)
result: [pass]

### 11. Splash (D-04): cold-start on cache-cleared install shows the dark brand wordmark without hanging; simulated hung/offline API falls through to Welcome within the 8s timeout
expected: Splash is visually branded and cannot deadlock. (WINDOWS #13)
result: [pass]

### 12. Font visual UAT (WINDOWS #15 device backstop): on a real device the three brand fonts (Outfit / Plus Jakarta Sans / JetBrains Mono) visibly render on Welcome / Email / Verify / complete-profile / Festivals and the OTP-box / countdown / avatar components — not the system-font fallback
expected: Custom fonts are visibly rendered, not the OS default font, across all eight restyled surfaces. (WINDOWS #15)
result: [pass]

## Summary

total: 12
passed: 12
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
