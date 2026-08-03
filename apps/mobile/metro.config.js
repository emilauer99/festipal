// Metro config for pnpm workspace resolution (RESEARCH.md Pattern 4 / Pitfall E).
//
// Metro's default resolver targets npm/Yarn hoisted node_modules; pnpm's strict,
// symlinked `node_modules/.pnpm` store needs unstable_enableSymlinks plus explicit
// watchFolders/nodeModulesPaths so `@festipal/*` workspace packages resolve at
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

module.exports = config;
