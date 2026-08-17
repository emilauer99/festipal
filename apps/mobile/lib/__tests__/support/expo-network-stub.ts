// Test-only stand-in for `expo-network`, aliased in `vitest.config.ts`.
//
// `@better-auth/expo`'s online manager reaches for `expo-network` through a
// DYNAMIC `import()`, which `vi.mock` cannot intercept — the alias is the only
// way to keep the real better-auth client loadable under the node runner.
// Required by `auth-session-atom-mount.test.ts`
// (debug session: otp-login-stuck-code-screen).
export function addNetworkStateListener(): { remove: () => void } {
  return { remove: () => {} };
}

export async function getNetworkStateAsync(): Promise<{ isInternetReachable: boolean }> {
  return { isInternetReachable: true };
}
