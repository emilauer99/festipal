import type { createMMKV as CreateMMKVFn, MMKV } from 'react-native-mmkv';

/**
 * D-06 — device-local active-festival slug store, persisted on Enter so a
 * later plan's cold-start focus can `router.replace('/f/{slug}')` straight
 * into the last-entered festival. Verbatim structural copy of
 * `avatar-storage.ts`'s lazy-`require('react-native-mmkv')` accessor idiom
 * (05-03 read_first) — MMKV requires a native prebuild and cannot run under
 * Vitest's node environment, so `require('react-native-mmkv')` stays INSIDE
 * {@link getStorage}, never a top-level import, so this module stays
 * importable in a non-native/test context.
 *
 * Own storage id (`festipal-active-festival`, distinct from
 * `avatar-storage.ts`'s `festipal-avatar`) and own key namespace — a slug is
 * not a secret and grants no privilege the visitor lacked via the gate-less
 * `getFestival(slug)` browse endpoint it only ever feeds (T-05-02, accepted).
 */
const ACTIVE_FESTIVAL_STORAGE_ID = 'festipal-active-festival';
const ACTIVE_FESTIVAL_SLUG_KEY = 'active-festival-slug';

// RN/Metro provides `require` at runtime; no node types in this project's
// tsconfig (types: ["react"] only) — declared ambiently so the lazy load
// below typechecks, same idiom as lib/avatar-storage.ts.
declare const require: (moduleId: string) => unknown;

let cachedStorage: MMKV | undefined;

function getStorage(): MMKV {
  if (!cachedStorage) {
    const { createMMKV } = require('react-native-mmkv') as { createMMKV: typeof CreateMMKVFn };
    cachedStorage = createMMKV({ id: ACTIVE_FESTIVAL_STORAGE_ID });
  }
  return cachedStorage;
}

export function saveActiveFestivalSlug(slug: string): void {
  getStorage().set(ACTIVE_FESTIVAL_SLUG_KEY, slug);
}

export function getActiveFestivalSlug(): string | undefined {
  return getStorage().getString(ACTIVE_FESTIVAL_SLUG_KEY);
}

export function clearActiveFestivalSlug(): void {
  getStorage().remove(ACTIVE_FESTIVAL_SLUG_KEY);
}
