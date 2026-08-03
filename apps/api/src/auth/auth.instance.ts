import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
import { account, createDatabase, session, user, verification } from '@festipal/db';

import { env } from '../config/env';
import { createOtpEmailProvider } from './email/otp-email-provider';

const db = createDatabase(env.DATABASE_URL);
const otpEmailProvider = createOtpEmailProvider(env);

/**
 * The `betterAuth()` runtime instance (RESEARCH.md Pattern 1). Built as a
 * plain module export — `AuthModule.forRoot({ auth })` needs an
 * already-constructed instance at synchronous module-registration time,
 * before NestJS's async DI container exists — mirroring how `config/env.ts`'s
 * `env` singleton is already evaluated synchronously at import time.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  secret: env.BETTER_AUTH_SECRET,
  session: {
    // D-02: 90-day sliding session, no refresh-token grant (Pitfall 10) —
    // "session expired -> re-authenticate via OTP" is the only expiry path.
    expiresIn: 60 * 60 * 24 * 90,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 5,
      // Pitfall 9 — the default `"rotate"` invalidates the first email's code
      // on every resend, which is confusing UX; `"reuse"` extends the same
      // code's expiry instead.
      resendStrategy: 'reuse',
      async sendVerificationOTP({ email, otp, type }) {
        // Fire-and-forget (D-01 / Pitfall 9): never await the provider before
        // responding. The OTP-request endpoint must always report success
        // regardless of delivery outcome, and awaiting here would be a
        // timing-attack surface for account-existence disclosure.
        void otpEmailProvider.send({ email, otp, type });
      },
    }),
  ],
});
