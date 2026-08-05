/**
 * Pure OTP error classifier — extracted from `app/(auth)/verify.tsx` (VALIDATION
 * Wave-0 gap: it existed but was untested, AUTH-05).
 *
 * `@better-fetch/fetch` spreads the server's JSON error body onto the error
 * object it returns (its non-`throw` branch) — `code` matches better-auth's
 * `EMAIL_OTP_ERROR_CODES` (`OTP_EXPIRED` / `INVALID_OTP` / `TOO_MANY_ATTEMPTS`,
 * from the `email-otp` plugin's own attempt counter). A bare 429 with no
 * `code` is the account-level rate limiter (better-auth core), a distinct
 * mechanism from the plugin's attempt counter but the same user-facing state.
 *
 * This function returns a STABLE KIND KEY, not a translated string — it takes
 * no Lingui `t` and pulls in no RN/React runtime, so it is unit-testable in
 * the node-environment Vitest runner (vitest.config.ts). The calling screen
 * (`verify.tsx`) maps each kind to its localized copy via `t\`...\``.
 *
 * Deprecated (04-RESEARCH.md "State of the Art"): Phase 3 showed two DIFFERENT
 * strings for `OTP_EXPIRED` vs `INVALID_OTP` ("expired" vs "didn't work").
 * This function CONVERGES both to the same `'wrong-or-expired'` kind — the
 * mockup's single combined error state (04-UI-SPEC Copywriting Contract) — but
 * still DISTINGUISHES the underlying codes internally (the branch structure
 * below), so a future caller could still tell them apart if ever needed.
 */

export type OtpErrorKind = 'wrong-or-expired' | 'rate-limited' | 'network';

export type OtpErrorInput = { code?: string; status?: number } | null | undefined;

export function mapOtpError(err: OtpErrorInput): OtpErrorKind {
  // OTP_EXPIRED and INVALID_OTP are distinct better-auth codes — kept as
  // separate branches (do NOT collapse the code checks) — but both CONVERGE
  // to the same unified return kind (Copywriting Contract).
  if (err?.code === 'OTP_EXPIRED') {
    return 'wrong-or-expired';
  }
  if (err?.code === 'INVALID_OTP') {
    return 'wrong-or-expired';
  }
  if (err?.code === 'TOO_MANY_ATTEMPTS' || err?.status === 429) {
    return 'rate-limited';
  }
  // Fallthrough: no code, no 429 status — treated as a network/unreachable
  // failure (e.g. the dev API is unreachable over Wi-Fi).
  return 'network';
}
