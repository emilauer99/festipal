import { Resend } from 'resend';

import type { OtpEmailProvider } from './otp-email-provider';

/**
 * Env-gated, dormant this phase (D-01) — only constructed by
 * `createOtpEmailProvider` when `OTP_EMAIL_TRANSPORT=resend` AND
 * `RESEND_API_KEY` are both set. No Resend account/domain verification is
 * required to ship Phase 2; this adapter exists so flipping the transport
 * later (Phase 3+, once the mobile client needs real inboxes) is an env
 * change, not a rewrite.
 */
export function createResendOtpEmailProvider(apiKey: string): OtpEmailProvider {
  const resend = new Resend(apiKey);

  return {
    async send({ email, otp, type }) {
      try {
        await resend.emails.send({
          from: 'festipal <onboarding@resend.dev>',
          to: email,
          subject: 'Your festipal sign-in code',
          text: `Your code: ${otp}\n\n(type: ${type})`,
        });
      } catch (err) {
        // Fire-and-forget from the caller (auth.instance.ts) — a delivery
        // failure must never surface to the OTP-request response (D-01).
        console.error('[resend-otp-email-provider] send failed:', err);
      }
    },
  };
}
