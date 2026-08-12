/**
 * G-06-5 gap closure — the NATIVE engine's `Intl.PluralRules` capability,
 * captured once at module evaluation time.
 *
 * ZERO IMPORTS, DELIBERATELY. This module must be the first thing
 * `lib/intl-polyfill.ts` imports, and its own body must contain nothing but
 * this capture. The reason is a JS/TS hoisting fact, not a style choice: every
 * `import` statement in a module is hoisted above that module's own body, so
 * a capture written in the SAME file as the polyfill import — even textually
 * above it — would still run after the polyfill installed and would always
 * report the polyfilled value, never the engine's own. Splitting the capture
 * into its own zero-import module is what makes "observe before polyfill"
 * possible at all: `intl-polyfill.ts` imports this file first, so this
 * module's body runs to completion (including this const) BEFORE the
 * polyfill import's side effects run.
 *
 * The export name says NATIVE, not "current" — after `intl-polyfill.ts` has
 * run, `Intl.PluralRules` is always a function again; this constant is the
 * one place that still remembers what the raw Hermes engine actually shipped.
 */
export const nativePluralRulesCapability: string = typeof Intl.PluralRules;
