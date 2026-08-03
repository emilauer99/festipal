// Deviation (Rule 3 — blocking): the Lingui macro babel plugin is registered
// here in Task 1 already, not deferred to Task 2 as originally planned — the
// tracer screen's `<Trans>` (imported from '@lingui/react/macro') fails to
// bundle without it (Metro tries to resolve the macro module's own
// `babel-plugin-macros` runtime import instead of compiling the macro away).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['@lingui/babel-plugin-lingui-macro'],
  };
};
