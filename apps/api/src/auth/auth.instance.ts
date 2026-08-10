import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
import { expo } from '@better-auth/expo';
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
  // D-05 — the Expo client's requests originate from the app scheme, not an
  // HTTP(S) Origin; better-auth's Origin/CSRF check needs these whitelisted.
  trustedOrigins: [
    // ADR-024 — MUST stay in sync with apps/mobile/app.json's `expo.scheme`
    // and apps/mobile/lib/auth-client.ts's expoClient `scheme`. Exactly ONE
    // app-scheme entry: a transitional both-schemes state would be a
    // permanently widened origin allowlist (T-05.1-02).
    'quiks://',
    'exp://', // Expo dev-client (Metro) scheme during `expo run:*`
    'exp://**', // Metro dev-client wildcard — dev-only, never used in prod builds
  ],
  session: {
    // D-02: 90-day sliding session, no refresh-token grant (Pitfall 10) —
    // "session expired -> re-authenticate via OTP" is the only expiry path.
    expiresIn: 60 * 60 * 24 * 90,
    updateAge: 60 * 60 * 24,
  },
  // Discovered while writing test/signout-origin.spec.ts (gap-closure Task 1):
  // better-auth defaults `skipOriginCheck` to `true` whenever
  // `NODE_ENV === 'test'` (its own isTest() heuristic), UNLESS
  // `advanced.disableOriginCheck` is explicitly set — silently bypassing the
  // origin-check middleware for every /api/auth/* POST in this project's
  // Vitest suite regardless of trustedOrigins/expo(). Explicit `false` here
  // matches the existing (implicit) production default — it does NOT weaken
  // origin/CSRF checking (T-4-07-I) — but makes it consistently ACTIVE in
  // tests too, which is what actually lets signout-origin.spec.ts's negative
  // control prove the mechanism instead of trivially passing either way.
  advanced: {
    disableOriginCheck: false,
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
    // AUTH-04 (WINDOWS id 2) — apps/mobile's expoClient sends `expo-origin`
    // instead of a standard `origin` header (the Expo app scheme has no HTTP
    // Origin). Without this plugin every cookie-bearing better-auth call from
    // the mobile client — including authClient.signOut() — is rejected 403
    // (MISSING_OR_NULL_ORIGIN) before the origin-check below ever runs. The
    // plugin's onRequest hook ONLY translates `expo-origin` -> `origin`; the
    // existing `trustedOrigins` allowlist above still validates the
    // translated value (T-4-07-S — no new trust introduced).
    expo(),
  ],
});
