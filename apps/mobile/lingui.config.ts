import { formatter } from '@lingui/format-po';

/**
 * Lingui catalog config. Locales `en`/`de`, source language English (D-08 —
 * source strings in code are English; the German catalog is the translation).
 *
 * Deviation note (Rule 3 — blocking, Task 1): created already in Task 1
 * rather than deferred to Task 2 as originally planned — Task 1's babel
 * macro plugin (`@lingui/babel-plugin-lingui-macro`) reads this file at
 * compile time to resolve the project's locales, so the tracer screen's
 * `<Trans>` macro cannot bundle without it existing first.
 */
const config = {
  locales: ['en', 'de'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: 'locales/{locale}/messages',
      // 'components' added 04-04 (Rule 2): first plan to add a components/
      // directory (OtpBoxes, ResendCountdown) — without it, `t`/`Trans`
      // usage there would silently never reach the catalog.
      include: ['app', 'lib', 'components'],
    },
  ],
  format: formatter({ lineNumbers: false }),
};

export default config;
