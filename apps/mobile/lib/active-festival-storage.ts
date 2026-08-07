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

// REVIEW 05-FIX WR-02 — persistence here is a nicety (the D-06 cold-start
// focus), never a gate: gate-less entry into a festival (ADR-014) must never
// dead-end on a synchronous MMKV read/write throwing. Every exported
// function below swallows its own storage errors so ALL call sites get this
// guarantee for free, instead of relying on each one remembering to wrap it
// (previously only one of four call sites did, see 05-REVIEW.md WR-02).

export function saveActiveFestivalSlug(slug: string): void {
  try {
    getStorage().set(ACTIVE_FESTIVAL_SLUG_KEY, slug);
  } catch {
    // Best-effort — see module-level note above.
  }
}

export function getActiveFestivalSlug(): string | undefined {
  try {
    return getStorage().getString(ACTIVE_FESTIVAL_SLUG_KEY);
  } catch {
    // Best-effort — see module-level note above.
    return undefined;
  }
}

export function clearActiveFestivalSlug(): void {
  try {
    getStorage().remove(ACTIVE_FESTIVAL_SLUG_KEY);
  } catch {
    // Best-effort — see module-level note above.
  }
}
