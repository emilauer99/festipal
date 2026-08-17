import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // otp-login-stuck-code-screen — `@better-auth/expo` reaches for
      // `expo-network` through a DYNAMIC `import()` inside its online manager,
      // which `vi.mock` cannot intercept. Only `auth-session-atom-mount.test.ts`
      // pulls that module graph in; every other spec is unaffected.
      'expo-network': resolve(__dirname, 'lib/__tests__/support/expo-network-stub.ts'),
    },
  },
  test: {
    // otp-login-stuck-code-screen — better-auth and @better-auth/expo ship ESM
    // that Vitest must transform rather than hand to node's loader (which
    // refuses to strip types under node_modules). Scoped to those two packages,
    // so the pure specs below keep their existing resolution.
    server: {
      deps: {
        inline: [/@better-auth\/expo/, /better-auth/],
      },
    },
    // Node environment, no jest-expo: this runner is scoped to PURE `lib/`
    // function tests (e.g. font-family constants, `mapOtpError`,
    // `generateUsernameSuggestion` in later Phase-4 plans). It intentionally
    // does NOT render React Native components — RN-coupled modules are loaded
    // lazily inside their hooks so the pure surface stays node-importable
    // (see lib/fonts.ts). Mirrors apps/api/vitest.config.ts shape.
    // ONE deliberate exception: `auth-session-atom-mount.test.ts` drives the real
    // better-auth client against mocked Expo modules, because the defect it
    // guards lives in that library's own atom lifecycle and has no pure surface.
    environment: 'node',
    globals: true,
    // The runner lands with this plan (Wave-0 gap: apps/mobile had no test
    // framework). Only pure-function specs under lib/ are included here.
    include: ['lib/**/__tests__/**/*.test.ts'],
    // Don't fail the post-wave test gate before the first spec exists.
    passWithNoTests: true,
  },
});
