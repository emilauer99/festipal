import type { Env } from '../../config/env';

import { createDevOtpEmailProvider } from './dev-otp-email-provider';
import { createMailpitOtpEmailProvider } from './mailpit-otp-email-provider';
import { createResendOtpEmailProvider } from './resend-otp-email-provider';

/** OTP delivery types better-auth's `emailOTP` plugin can request (mirrors its own union). */
export type OtpEmailType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';

export interface OtpSendArgs {
  email: string;
  otp: string;
  type: OtpEmailType;
}

/**
 * Provider abstraction for OTP email delivery (D-01). `send` is always
 * invoked fire-and-forget from `auth.instance.ts` (`void otpEmailProvider.send(...)`)
 * — implementations own their own error handling and must never let a
 * delivery failure surface to the OTP-request response.
 */
export interface OtpEmailProvider {
  send(args: OtpSendArgs): Promise<void>;
}

/**
 * Selects the active transport: the Resend adapter only when explicitly
 * opted in via `OTP_EMAIL_TRANSPORT=resend` AND a key is configured, the
 * Mailpit adapter when opted in via `OTP_EMAIL_TRANSPORT=mailpit` (Phase 3,
 * D-11 — local device testing over LAN), the dev (console + local capture
 * file) transport otherwise as the final fallback.
 */
export function createOtpEmailProvider(env: Env): OtpEmailProvider {
  if (env.OTP_EMAIL_TRANSPORT === 'resend' && env.RESEND_API_KEY) {
    return createResendOtpEmailProvider(env.RESEND_API_KEY);
  }
  if (env.OTP_EMAIL_TRANSPORT === 'mailpit') {
    return createMailpitOtpEmailProvider(env);
  }
  return createDevOtpEmailProvider();
}
