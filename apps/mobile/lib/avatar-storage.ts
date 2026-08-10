import type { createMMKV as CreateMMKVFn, MMKV } from 'react-native-mmkv';

/**
 * D-01 — device-local avatar URI store. MMKV (Nitro TurboModule) requires a
 * native prebuild and cannot run under Vitest's node environment (04-01
 * SUMMARY, "Boundary reminder for 04-05"). `react-native-mmkv` is required
 * LAZILY inside {@link getStorage} (mirroring `lib/fonts.ts`'s `useAppFonts`
 * pattern) so this module stays importable in a non-native/test context —
 * only calling one of the exported functions touches the native module.
 *
 * Keyed strictly by `accountId` (RESEARCH.md Open Question 1, resolved): a
 * second account logging in on the same shared device can never read the
 * first account's photo, regardless of any future logout-clearing decision.
 * ONLY the URI string is stored here — never image bytes, never the session
 * token (Pitfall 2 boundary; the session stays on expo-secure-store).
 */
const AVATAR_STORAGE_ID = 'quiks-avatar';

// RN/Metro provides `require` at runtime; no node types in this project's
// tsconfig (types: ["react"] only) — declared ambiently so the lazy load
// below typechecks, same idiom as lib/fonts.ts.
declare const require: (moduleId: string) => unknown;

let cachedStorage: MMKV | undefined;

function getStorage(): MMKV {
  if (!cachedStorage) {
    const { createMMKV } = require('react-native-mmkv') as { createMMKV: typeof CreateMMKVFn };
    cachedStorage = createMMKV({ id: AVATAR_STORAGE_ID });
  }
  return cachedStorage;
}

function avatarKey(accountId: string): string {
  return `avatar-uri:${accountId}`;
}

export function saveLocalAvatarUri(accountId: string, uri: string): void {
  getStorage().set(avatarKey(accountId), uri);
}

export function getLocalAvatarUri(accountId: string): string | undefined {
  return getStorage().getString(avatarKey(accountId));
}

export function clearLocalAvatarUri(accountId: string): void {
  getStorage().remove(avatarKey(accountId));
}
