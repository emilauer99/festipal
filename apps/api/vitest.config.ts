import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    // Harness lands before the first spec (wave 1 of phase 02) — don't fail the
    // post-wave test gate on an intentionally empty suite.
    passWithNoTests: true,
    // Integration specs share external state across files — a real Neon
    // Postgres connection pool, better-auth's default OTP rate limiter
    // (3 requests/60s per source), and the dev-transport OTP capture file
    // (apps/api/.otp-dev-transport.local.json). Running spec files in
    // parallel (the vitest default) races these: concurrent OTP sign-ins
    // from different files can trip the rate limiter or read a
    // just-overwritten capture-file entry, and many simultaneous Neon
    // connections have been observed to surface as an opaque
    // `UNDEFINED_VALUE` postgres.js driver error. Serializing file execution
    // trades some wall-clock time for a suite that is reliably green (02-05,
    // discovered once the full endpoint-set specs pushed concurrent OTP
    // sign-ins past ~3 in the same 60s window).
    fileParallelism: false,
    // Heavy integration beforeAll hooks (e.g. festival-isolation: two full
    // OTP sign-in round-trips with 300ms capture-file polling against the
    // real DB) measure ~13s — the 10s vitest default is permanently
    // borderline and flakes with DB/network latency variance.
    hookTimeout: 30_000,
    // Same rationale for individual tests: an OTP round-trip (send + poll
    // capture file + verify) against the real DB takes ~1s idle but 5-7s
    // when turbo runs the whole workspace in parallel (CPU contention).
    testTimeout: 30_000,
  },
});
