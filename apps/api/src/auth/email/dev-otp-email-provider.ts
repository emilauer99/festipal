import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { OtpEmailProvider } from './otp-email-provider';

/**
 * Dev-only capture file (D-01): the active OTP transport for all of Phase 2
 * since there is no mobile client yet (Phase 3+) — `test/smoke/otp-me-smoke.mjs`
 * and manual curl testing read the code from here instead of a real inbox.
 * Lands at `apps/api/.otp-dev-transport.local.json` regardless of whether this
 * module runs from `src/` (ts-node/nest watch) or `dist/` (built) — both sit
 * three directories below `apps/api`. Gitignored; never used when
 * `OTP_EMAIL_TRANSPORT=resend`.
 */
const CAPTURE_FILE = join(__dirname, '..', '..', '..', '.otp-dev-transport.local.json');

export function createDevOtpEmailProvider(): OtpEmailProvider {
  return {
    async send({ email, otp, type }) {
      console.log(`[dev-otp-email-provider] ${type} OTP for ${email}: ${otp}`);
      try {
        await writeFile(
          CAPTURE_FILE,
          JSON.stringify({ email, otp, type, sentAt: new Date().toISOString() }),
          'utf8',
        );
      } catch (err) {
        // Capture-file writes are a dev/test convenience only — never let a
        // filesystem error surface past this fire-and-forget send.
        console.error('[dev-otp-email-provider] failed to write capture file:', err);
      }
    },
  };
}
