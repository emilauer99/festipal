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

/**
 * G-05-5b-r2 — pure persist/clear decision for an on-enter sync. `prior` is
 * accepted (rather than folded into a closure) purely so callers/tests can
 * narrate "a stale saved slug is present" without this function reading any
 * storage itself; the RETURN depends only on `entered.saved` — an unsaved
 * entry ALWAYS clears, regardless of what `prior` was, closing the 05-09
 * regression where a previously-entered saved festival stayed stuck in MMKV
 * forever because an unsaved entry neither wrote nor cleared it.
 *
 * Framework/storage-free (no react-native-mmkv reference) so this stays
 * importable under the node-env Vitest runner, same purity idiom as
 * `lib/select-next-festival.ts`.
 *
 * WR-01 (05-REVIEW.md) — `prior` is intentionally unused by the return value
 * (see above: the outcome depends only on `entered.saved`); it is kept as a
 * narration-only parameter so call sites/tests can express "a stale slug is
 * present" without this function reading storage itself. Do not remove it
 * to "simplify" the signature — that would drop the documented intent.
 */
export function nextActiveFestivalSlug(
  prior: string | undefined,
  entered: { slug: string; saved: boolean },
): string | undefined {
  return entered.saved ? entered.slug : undefined;
}

/**
 * G-05-5b-r2 — single persist/clear authority for every festival-home entry
 * point. Reads the current slug, computes the next value via
 * {@link nextActiveFestivalSlug}, and persists it: a SAVED entry persists the
 * newly-entered slug, an UNSAVED entry now CLEARS any previously-persisted
 * slug instead of leaving it in place (reversing 05-09's `festivals.tsx:223`
 * "only persist when saved" semantics, which made the persisted slug a
 * sticky "last SAVED festival ever entered" value instead of tracking the
 * LAST entered festival).
 *
 * Routes through the existing error-swallowing `saveActiveFestivalSlug` /
 * `clearActiveFestivalSlug`, so it inherits their offline-safe, gate-less
 * guarantee (WR-02) and stays fully synchronous — `app/_layout.tsx`'s
 * cold-start read is untouched and needs no async re-validation against
 * `listMyFestivals`.
 */
export function syncActiveFestivalOnEnter(slug: string, saved: boolean): void {
  const prior = getActiveFestivalSlug();
  const next = nextActiveFestivalSlug(prior, { slug, saved });
  if (next) {
    saveActiveFestivalSlug(next);
  } else {
    clearActiveFestivalSlug();
  }
}
