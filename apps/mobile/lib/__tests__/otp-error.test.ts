import { describe, expect, it } from 'vitest';

import { mapOtpError } from '../otp-error';

describe('mapOtpError (AUTH-05 — pure classifier, VALIDATION Wave-0 gap closed)', () => {
  it('maps OTP_EXPIRED to the unified wrong-or-expired kind', () => {
    expect(mapOtpError({ code: 'OTP_EXPIRED' })).toBe('wrong-or-expired');
  });

  it('maps INVALID_OTP to the SAME unified wrong-or-expired kind (convergence)', () => {
    expect(mapOtpError({ code: 'INVALID_OTP' })).toBe('wrong-or-expired');
  });

  it('maps TOO_MANY_ATTEMPTS to rate-limited', () => {
    expect(mapOtpError({ code: 'TOO_MANY_ATTEMPTS' })).toBe('rate-limited');
  });

  it('maps a bare 429 status (no code) to rate-limited', () => {
    expect(mapOtpError({ status: 429 })).toBe('rate-limited');
  });

  it('maps an unknown code to network (fallthrough)', () => {
    expect(mapOtpError({ code: 'SOMETHING_ELSE' })).toBe('network');
  });

  it('maps undefined/null (no code, no status) to network (fallthrough)', () => {
    expect(mapOtpError(undefined)).toBe('network');
    expect(mapOtpError(null)).toBe('network');
  });

  it('does not let a code take precedence over an unrelated status (INVALID_OTP with an incidental 429)', () => {
    // Code-distinguishing branches stay in their original order — a code
    // match always wins before the bare-429 fallback is even checked.
    expect(mapOtpError({ code: 'INVALID_OTP', status: 429 })).toBe('wrong-or-expired');
  });
});
