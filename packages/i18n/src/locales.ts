import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@quiks/contracts';

export { DEFAULT_LOCALE, SUPPORTED_LOCALES };
export type { Locale };

/** Human-readable, self-referential language names for locale switchers. */
export const LOCALE_LABELS: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
};

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
