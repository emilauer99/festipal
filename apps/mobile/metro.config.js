// Metro config for pnpm workspace resolution (RESEARCH.md Pattern 4 / Pitfall E).
//
// Metro's default resolver targets npm/Yarn hoisted node_modules; pnpm's strict,
// symlinked `node_modules/.pnpm` store needs unstable_enableSymlinks plus explicit
// watchFolders/nodeModulesPaths so `@quiks/*` workspace packages resolve at
// bundle time (and so edits to those packages hot-reload instead of resolving stale).
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm-specific: packages live behind symlinks in the content-addressed store.
config.resolver.unstable_enableSymlinks = true;
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
// Do NOT set disableHierarchicalLookups: true — breaks pnpm's store lookup.

// Lingui: compile `.po` catalogs on the fly so `import`/`require` of a
// locales/*/messages.po file resolves to compiled runtime message data.
// Deviation (Rule 1 — bug fix): RESEARCH.md's Pattern 4 cited a `withLingui`
// config-wrapper export that the installed @lingui/metro-transformer@6.6.0
// does not have — the package instead exports a `transform` function meant
// to be wired in as `transformer.babelTransformerPath` (it wraps Expo's own
// babel transformer internally, delegating non-`.po` files to it unchanged).
config.transformer.babelTransformerPath = require.resolve('@lingui/metro-transformer/expo');
// 03-04 addition (Rule 1 — bug): Metro's resolver never even LOOKS for a
// `.po` file unless its extension is in `resolver.sourceExts` — without this,
// `import ... from '...messages.po'` fails with "Unable to resolve module"
// regardless of the transformer above being wired correctly. No screen
// imported a `.po` file directly until this plan wired real catalog loading
// (`lib/i18n.ts`'s `i18n.load(...)`), so this gap was latent since 03-02.
config.resolver.sourceExts = [...config.resolver.sourceExts, 'po'];

module.exports = config;
