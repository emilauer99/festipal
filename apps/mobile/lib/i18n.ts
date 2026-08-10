import { i18n } from '@lingui/core';
import { resolveUiLocale } from '@quiks/i18n';

import { messages as deMessages } from '../locales/de/messages.po';
import { messages as enMessages } from '../locales/en/messages.po';

// I18N-01 / D-07 — catalogs must be LOADED, not just have their locale
// activated: `i18n.activate(locale)` alone renders every `<Trans>`/`t\`\``
// macro's English SOURCE text regardless of the active locale (Lingui's
// documented fallback when no catalog is registered) — a gap 03-02's SUMMARY
// flagged ("Next Phase Readiness") and closed here now that this plan ships
// the first real, user-visible UI strings (WINDOWS.md todo, closed 03-04).
i18n.load({ en: enMessages, de: deMessages });

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
