import base from '@festipal/config/eslint';

export default [
  ...base,
  {
    rules: {
      // NestJS DI relies on runtime class references from emitDecoratorMetadata;
      // `import type` would erase them and break injection. Disable for the API.
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
