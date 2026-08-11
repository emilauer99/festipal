import type { ThemeOverride } from './theme';

/**
 * D-08a — device-local appearance override, persisted so the Mehr-screen
 * switch survives a relaunch. Structural copy of `active-festival-storage.ts`
 * (which itself copies `avatar-storage.ts`): MMKV needs a native prebuild and
 * cannot load under Vitest's node environment, so `require('react-native-mmkv')`
 * stays INSIDE {@link getStorage} — never a top-level import, not even a
 * type-only one — and this module stays importable off-device.
 *
 * Own storage id (`quiks-theme-override`, distinct from `quiks-avatar` and
 * `quiks-active-festival`) and own key, so the three stores cannot collide.
 *
 * Like its sibling, EVERY exported I/O function swallows its own storage
 * errors: an appearance preference is a nicety, never a gate (UI-SPEC #32,
 * T-06-12). A read that throws yields `'system'`; a write that throws is
 * silently dropped. There is no error UI and no call site has to remember to
 * wrap anything.
 *
 * Reads are SYNCHRONOUS (MMKV is), which is what lets the provider seed its
 * state during the first render — the switch never renders indeterminate and
 * the first frame is never unthemed (UI-SPEC #31).
 */
const THEME_OVERRIDE_STORAGE_ID = 'quiks-theme-override';
const THEME_OVERRIDE_KEY = 'theme-override';

/** The default whenever nothing usable is stored: follow the device. */
const DEFAULT_THEME_OVERRIDE: ThemeOverride = 'system';

const ALLOWED_OVERRIDES: readonly ThemeOverride[] = ['system', 'light', 'dark'];

/**
 * The slice of MMKV this module uses, declared locally rather than imported
 * from `react-native-mmkv` — even a type-only import would put the package on
 * this module's import list, and the whole point of the lazy `require` below
 * is that it is not there.
 */
type ThemeOverrideStore = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
};

type MMKVModule = { createMMKV: (config: { id: string }) => ThemeOverrideStore };

// RN/Metro provides `require` at runtime; no node types in this project's
// tsconfig (types: ["react"] only) — declared ambiently so the lazy load
// below typechecks, same idiom as lib/active-festival-storage.ts.
declare const require: (moduleId: string) => unknown;

let cachedStorage: ThemeOverrideStore | undefined;

function getStorage(): ThemeOverrideStore {
  if (!cachedStorage) {
    const { createMMKV } = require('react-native-mmkv') as MMKVModule;
    cachedStorage = createMMKV({ id: THEME_OVERRIDE_STORAGE_ID });
  }
  return cachedStorage;
}

/**
 * T-06-11 — the pure decision half of the read: a value coming back out of
 * device-local storage is UNTRUSTED input (it can be absent, corrupt, or
 * tampered with). Only one of the three allowed members is accepted; anything
 * else degrades to `'system'` rather than producing an undefined colour state.
 *
 * Kept exported and storage-free so the decision is provable under the
 * node-env Vitest runner, mirroring `nextActiveFestivalSlug`'s split in
 * `active-festival-storage.ts`.
 */
export function parseThemeOverride(raw: string | undefined): ThemeOverride {
  return ALLOWED_OVERRIDES.find((allowed) => allowed === raw) ?? DEFAULT_THEME_OVERRIDE;
}

/** Reads the persisted override. Never throws; falls back to `'system'`. */
export function getThemeOverride(): ThemeOverride {
  try {
    return parseThemeOverride(getStorage().getString(THEME_OVERRIDE_KEY));
  } catch {
    // Best-effort — see module-level note above.
    return DEFAULT_THEME_OVERRIDE;
  }
}

/** Persists the override. Never throws; a failed write is silently dropped. */
export function saveThemeOverride(value: ThemeOverride): void {
  try {
    getStorage().set(THEME_OVERRIDE_KEY, value);
  } catch {
    // Best-effort — see module-level note above.
  }
}
