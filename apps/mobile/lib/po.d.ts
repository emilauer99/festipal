/**
 * Ambient module declaration for `.po` catalog imports. Metro's Lingui
 * transformer (see metro.config.js's `transformer.babelTransformerPath`)
 * compiles `.po` files into a JS module with a named `messages` export at
 * bundle time (`@lingui/metro-transformer`'s `namespace: 'es'` default) —
 * TypeScript has no built-in knowledge of `.po` files, so `tsc --noEmit`
 * needs this declaration to typecheck `lib/i18n.ts`'s catalog imports.
 */
declare module '*.po' {
  import type { Messages } from '@lingui/core';

  export const messages: Messages;
}
