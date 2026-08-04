/**
 * Integration specs assert OTPs via the dev capture file
 * (.otp-dev-transport.local.json). config/env.ts parses process.env at import
 * time (`export const env = loadEnv()`), so this override must run as an
 * import side effect BEFORE AppModule is imported — a plain statement in
 * setup.ts's module body would execute after every hoisted import and come
 * too late. An ambient OTP_EMAIL_TRANSPORT from .env (e.g. `mailpit` during
 * on-device UAT, plan 03-06) must not redirect OTP delivery away from the
 * capture file.
 */
process.env.OTP_EMAIL_TRANSPORT = 'dev';

export {};
