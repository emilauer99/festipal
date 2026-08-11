import base from '@quiks/config/eslint';

export default [
  ...base,
  {
    rules: {
      // NestJS DI relies on runtime class references from emitDecoratorMetadata;
      // `import type` would erase them and break injection. Disable for the API.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    // Plain-Node scripts (not part of the TS project) — test/smoke/*.mjs runs
    // via `node` directly against a live dev server (02-02-PLAN.md Task 2),
    // so it needs Node/fetch globals that the TS-parsed source files get
    // implicitly from typescript-eslint's type-aware linting.
    files: ['**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
      },
    },
  },
];
