import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    // Harness lands before the first spec (wave 1 of phase 02) — don't fail the
    // post-wave test gate on an intentionally empty suite.
    passWithNoTests: true,
  },
});
