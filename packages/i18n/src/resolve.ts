import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from './locales';

/**
 * Resolve the app UI locale — ADR-012, axis 1:
 *   persisted user override → device/system locales → global default (EN).
 *
 * `systemLocales` is an ordered list of BCP-47 tags (e.g. from
 * expo-localization's `getLocales()` or the browser's `navigator.languages`).
 * We match on the primary subtag, so `de-AT` resolves to `de`. On a fresh
 * install with no override, the device language wins — not our default.
 */
export function resolveUiLocale(input: {
  override?: string | null;
  systemLocales?: readonly string[];
}): Locale {
  if (input.override && isSupportedLocale(input.override)) {
    return input.override;
  }

  for (const tag of input.systemLocales ?? []) {
    const primary = tag.split('-')[0]?.toLowerCase();
    if (primary && isSupportedLocale(primary)) {
      return primary;
    }
  }

  return DEFAULT_LOCALE;
}
