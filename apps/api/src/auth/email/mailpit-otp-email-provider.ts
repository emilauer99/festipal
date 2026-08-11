import { createTransport } from 'nodemailer';

import type { Env } from '../../config/env';
import type { OtpEmailProvider } from './otp-email-provider';

/**
 * Local dev transport (Phase 3, D-11): sends OTP codes via SMTP to the
 * docker-compose Mailpit container instead of the console/capture-file dev
 * transport, so a real device on the LAN can read the code from Mailpit's web
 * inbox (http://<lan-ip>:8025) during device testing. Mailpit accepts any SMTP
 * traffic unauthenticated — never used against a real mail server.
 */
export function createMailpitOtpEmailProvider(env: Env): OtpEmailProvider {
  const transport = createTransport({
    host: env.MAILPIT_SMTP_HOST,
    port: env.MAILPIT_SMTP_PORT,
    secure: false,
  });

  return {
    async send({ email, otp, type }) {
      try {
        await transport.sendMail({
          from: 'quiks <dev@quiks.local>',
          to: email,
          subject: 'Your quiks sign-in code',
          text: `Your code: ${otp}\n\n(type: ${type})`,
        });
      } catch (err) {
        // Fire-and-forget from the caller (auth.instance.ts) — a delivery
        // failure must never surface to the OTP-request response (D-01).
        console.error('[mailpit-otp-email-provider] send failed:', err);
      }
    },
  };
}
