import { z } from 'zod';

/**
 * Supported locales — the API-facing source of truth (mirrored by the Postgres
 * enum in @festipal/db and the catalogs in @festipal/i18n; keep them in sync).
 */
export const SUPPORTED_LOCALES = ['de', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Global fallback when neither the user's nor the festival's locale resolves. */
export const DEFAULT_LOCALE: Locale = 'en';

export const localeSchema = z.enum(SUPPORTED_LOCALES);

/**
 * Full translation map used when editing content in the admin (all locales).
 * At the app layer only the festival's default locale is mandatory; other
 * locales are optional and fall back to it (ADR-012).
 */
export type LocalizedText = Partial<Record<Locale, string>>;
export const localizedTextSchema = z.record(localeSchema, z.string());

/** Resolve localized content to one string: requested → festival default → any present. */
export function resolveLocalized(
  text: LocalizedText,
  requested: Locale,
  festivalDefault: Locale,
): string {
  return text[requested] ?? text[festivalDefault] ?? Object.values(text)[0] ?? '';
}
