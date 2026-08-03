import { i18n } from '@lingui/core';
import { resolveUiLocale } from '@festipal/i18n';

/**
 * ADR-012 axis 1 (UI locale): device/system language only this phase (D-06 —
 * no in-app switcher yet, `override` is always omitted here). D-07: non-DE/EN
 * devices fall back to German, via `resolveUiLocale`'s `uiFallback` param
 * rather than changing the shared `DEFAULT_LOCALE` (still `'en'`, the
 * content-axis default, ADR-012).
 */
export async function activateUiLocale(systemLocales: readonly string[]): Promise<void> {
  const locale = resolveUiLocale({ systemLocales, uiFallback: 'de' });
  await i18n.activate(locale);
}

export { i18n };
