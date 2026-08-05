import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node environment, no jest-expo: this runner is scoped to PURE `lib/`
    // function tests (e.g. font-family constants, `mapOtpError`,
    // `generateUsernameSuggestion` in later Phase-4 plans). It intentionally
    // does NOT render React Native components — RN-coupled modules are loaded
    // lazily inside their hooks so the pure surface stays node-importable
    // (see lib/fonts.ts). Mirrors apps/api/vitest.config.ts shape.
    environment: 'node',
    globals: true,
    // The runner lands with this plan (Wave-0 gap: apps/mobile had no test
    // framework). Only pure-function specs under lib/ are included here.
    include: ['lib/**/__tests__/**/*.test.ts'],
    // Don't fail the post-wave test gate before the first spec exists.
    passWithNoTests: true,
  },
});
