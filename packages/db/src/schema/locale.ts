import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Supported content locales. Adding a locale = append here + a migration that
 * extends the Postgres enum. Keep in sync with packages/i18n.
 */
export const SUPPORTED_LOCALES = ['de', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Global fallback when neither the user's nor the festival's locale resolves. */
export const DEFAULT_LOCALE: Locale = 'en';

export const localeEnum = pgEnum('locale', SUPPORTED_LOCALES);
