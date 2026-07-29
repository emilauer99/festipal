import { i18n, type I18n, type Messages } from '@lingui/core';

import type { Locale } from './locales';

export { i18n };
export type { I18n };

/**
 * Load compiled Lingui messages for a locale and activate it. Apps extract and
 * compile their own catalogs (`lingui extract` / `compile`) over their source
 * and pass the compiled messages here.
 */
export function activateLocale(locale: Locale, messages: Messages): void {
  i18n.load(locale, messages);
  i18n.activate(locale);
}
