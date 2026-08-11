import base from '@quiks/config/eslint';
import i18next from 'eslint-plugin-i18next';

export default [
  ...base,
  {
    // Expo config plugins (plugins/**) are loaded by Expo via require() and are
    // CommonJS by convention — they are NOT `*.config.*` (which the base config
    // ignores), so lint them as CommonJS: enable Node/CJS globals (require,
    // module) and allow require-style imports here only.
    files: ['plugins/**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // I18N-01 / Pitfall 7 — wire the no-literal-string rule in BEFORE any
    // product screen exists (only the tracer screen does so far), so a
    // hardcoded UI string can never slip past the very first commit that
    // introduces it. `consistent-type-imports` (from the base config) stays
    // ENABLED here — unlike apps/api, there is no NestJS DI reason to
    // disable it for RN/Expo code.
    // `components/**` added 04-04 (Rule 2): this is the first plan to add a
    // components/ directory (OtpBoxes, ResendCountdown) — without this glob
    // entry, hardcoded strings in shared components would silently bypass
    // the same guard every screen is held to.
    files: ['app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          framework: 'react',
          mode: 'jsx-text-only',
          // 'Trans' stays excluded (plugin default) — its children ARE the
          // translatable content; this rule only flags text OUTSIDE a macro.
          'jsx-components': { exclude: ['Trans'] },
          'jsx-attributes': {
            // Plugin defaults (style/DOM attrs) plus RN's non-user-facing
            // testID/accessibility props.
            exclude: [
              'className',
              'styleName',
              'style',
              'type',
              'key',
              'id',
              'width',
              'height',
              'testID',
              'accessibilityLabel',
              'accessibilityHint',
            ],
          },
          words: {
            exclude: [
              '[0-9!-/:-@[-`{-~]+', // punctuation/symbols only (plugin default)
              '[A-Z_-]+', // SCREAMING_SNAKE_CASE / all-caps constants (plugin default)
              'quiks', // UI-SPEC: brand/proper noun, never translated (D-04)
            ],
          },
        },
      ],
    },
  },
];
