import { betterAuth } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';

/**
 * Minimal better-auth instance — EXISTS SOLELY to shape the CLI schema output
 * (`auth generate`). No HTTP handler, no guards, no email delivery, no runtime
 * wiring — all of that is Phase 2 (ADR-009).
 *
 * Plugins declared here decide which tables the CLI emits into
 * `src/schema/auth.ts`. Deliberately declares ONLY `emailOTP` (OTP state lives
 * in the core `verification` table, no extra table). It must NOT declare the
 * `organization` plugin (festival membership is a gate-less `my_festival` save,
 * not org/role/invite semantics — ADR-014) nor the `username` plugin (username/
 * displayName live on the separate `visitor_profile` table, never on the shared
 * `user`/Account table — ADR-016). See docs/DEVELOPMENT_DECISIONS.md ADR-021.
 */
export const auth = betterAuth({
  // No `database` adapter: `auth generate --adapter drizzle --dialect postgresql`
  // shapes the schema from the flags + declared plugins, without a live DB.
  plugins: [
    emailOTP({
      // No-op: real OTP delivery is Phase 2. Declaring the plugin is enough to
      // shape the schema (it reuses the core `verification` table).
      async sendVerificationOTP() {
        /* Phase 2 */
      },
    }),
  ],
});
