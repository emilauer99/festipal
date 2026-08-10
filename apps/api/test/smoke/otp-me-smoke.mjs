#!/usr/bin/env node
// Live end-to-end smoke proof for Phase 2 Plan 02's OTP -> session -> GET /me
// tracer slice (02-02-PLAN.md Task 1/2). Run against a live dev API:
//
//   pnpm --filter @quiks/api dev     (in one terminal)
//   node apps/api/test/smoke/otp-me-smoke.mjs
//
// Proves: OTP request always succeeds; the dev transport captures a
// readable 6-digit code; verifying it yields a session cookie; GET /api/v1/me
// with that cookie returns 200 with { accountId, email, profile }; GET
// /api/v1/me with no cookie returns 401 (SEC-01); GET /api/v1/health with no
// cookie returns 200 (@AllowAnonymous baseline).
//
// Exits 0 on success, 1 on any assertion failure.

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Mirrors apps/api/src/auth/email/dev-otp-email-provider.ts's CAPTURE_FILE
// (apps/api/.otp-dev-transport.local.json) — this script lives two
// directories below apps/api (test/smoke/).
const CAPTURE_FILE = join(__dirname, '..', '..', '.otp-dev-transport.local.json');

const PORT = process.env.PORT ?? '8081';
const BASE_URL = process.env.SMOKE_BASE_URL ?? `http://localhost:${PORT}`;
const TEST_EMAIL = process.env.SMOKE_OTP_EMAIL ?? 'otp-smoke-test@quiks.dev';

let failures = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${label}`);
  } else {
    failures += 1;
    console.error(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function cookieHeaderFromResponse(res) {
  const setCookies =
    typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  if (setCookies.length > 0) {
    return setCookies.map((c) => c.split(';')[0]).join('; ');
  }
  // Fallback for fetch implementations without getSetCookie().
  const single = res.headers.get('set-cookie');
  return single ? single.split(';')[0] : '';
}

async function readCapturedOtp(email, { retries = 20, delayMs = 300 } = {}) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const raw = await readFile(CAPTURE_FILE, 'utf8');
      const captured = JSON.parse(raw);
      if (captured.email === email) return captured.otp;
    } catch {
      // Capture file not written yet (or a stale unrelated entry) — retry.
    }
    await delay(delayMs);
  }
  throw new Error(`Timed out waiting for dev-otp-email-provider capture file at ${CAPTURE_FILE}`);
}

async function main() {
  console.log(`Smoke test target: ${BASE_URL}`);

  // 1. Request an OTP for sign-in — must always report success (D-01).
  // better-auth's CSRF check requires an Origin header on state-changing
  // requests (a real browser client always sends one; a bare Node fetch
  // does not) — set it explicitly to mimic same-origin browser traffic.
  const requestRes = await fetch(`${BASE_URL}/api/auth/email-otp/send-verification-otp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE_URL },
    body: JSON.stringify({ email: TEST_EMAIL, type: 'sign-in' }),
  });
  const requestBody = await requestRes.json().catch(() => null);
  check(
    'POST /api/auth/email-otp/send-verification-otp returns 200',
    requestRes.status === 200,
    `got ${requestRes.status}`,
  );
  check(
    'OTP request response reports success',
    requestBody?.success === true,
    JSON.stringify(requestBody),
  );

  // 2. Read the code from the dev transport's capture file.
  const otp = await readCapturedOtp(TEST_EMAIL);
  check(
    'Dev transport captured a 6-digit OTP',
    /^\d{6}$/.test(otp ?? ''),
    `got ${JSON.stringify(otp)}`,
  );

  // 3. Verify the OTP -> session.
  const verifyRes = await fetch(`${BASE_URL}/api/auth/sign-in/email-otp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: BASE_URL },
    body: JSON.stringify({ email: TEST_EMAIL, otp }),
  });
  const verifyBody = await verifyRes.json().catch(() => null);
  check(
    'POST /api/auth/sign-in/email-otp returns 200',
    verifyRes.status === 200,
    `got ${verifyRes.status}: ${JSON.stringify(verifyBody)}`,
  );
  const cookie = cookieHeaderFromResponse(verifyRes);
  check('Sign-in response sets a session cookie', cookie.length > 0, 'no Set-Cookie header found');

  // 4. GET /api/v1/me WITH the session cookie.
  const meRes = await fetch(`${BASE_URL}/api/v1/me`, { headers: { cookie } });
  const meBody = await meRes.json().catch(() => null);
  check('GET /api/v1/me (with session) returns 200', meRes.status === 200, `got ${meRes.status}`);
  check(
    'GET /api/v1/me body has accountId + matching email',
    typeof meBody?.accountId === 'string' && meBody?.email === TEST_EMAIL,
    JSON.stringify(meBody),
  );

  // 5. GET /api/v1/me WITHOUT a cookie -> 401 (SEC-01 / empty edge).
  const meAnonRes = await fetch(`${BASE_URL}/api/v1/me`);
  check(
    'GET /api/v1/me (no session) returns 401',
    meAnonRes.status === 401,
    `got ${meAnonRes.status}`,
  );

  // 6. GET /api/v1/health WITHOUT a cookie -> 200 (@AllowAnonymous baseline).
  const healthRes = await fetch(`${BASE_URL}/api/v1/health`);
  check(
    'GET /api/v1/health (no session) returns 200',
    healthRes.status === 200,
    `got ${healthRes.status}`,
  );

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exitCode = 1;
    return;
  }
  console.log('\nAll checks passed.');
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exitCode = 1;
});
