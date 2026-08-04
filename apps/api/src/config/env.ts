import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(8081),
  DATABASE_URL: z.string().url(),
  // ADR-009: passwordless email-OTP is entirely server-side (better-auth); the
  // signing secret is required at runtime, never optional.
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url().optional(),
  // Direct (unpooled) Neon connection — drizzle-kit migrations + integration
  // tests (see apps/api/test/setup.ts) prefer this over the pooled DATABASE_URL.
  DATABASE_URL_UNPOOLED: z.string().url().optional(),
  // Optional: unset in dev, where OTP_EMAIL_TRANSPORT falls back to console output.
  RESEND_API_KEY: z.string().optional(),
  // 'mailpit' (Phase 3, D-11): routes OTP codes to the local docker-compose
  // Mailpit inbox so a device on the LAN can read them during dev testing.
  OTP_EMAIL_TRANSPORT: z.enum(['dev', 'resend', 'mailpit']).default('dev'),
  MAILPIT_SMTP_HOST: z.string().default('127.0.0.1'),
  MAILPIT_SMTP_PORT: z.coerce.number().default(1025),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}

// Memoized module-level singleton (#2 of this phase's "single loadEnv() call
// site" convention — see 02-RESEARCH.md "New: loadEnv() gains a third call
// site this phase"). Later modules (e.g. auth.instance.ts) import `env`
// directly instead of adding another raw `loadEnv()` call.
export const env = loadEnv();
