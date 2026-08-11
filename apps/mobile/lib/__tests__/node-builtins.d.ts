/**
 * Minimal ambient declarations for the node builtins used by the
 * node-environment vitest specs in this directory (`type-tracking.test.ts`
 * reads the consumer sources off disk).
 *
 * WHY NOT `@types/node`: apps/mobile is a React Native app. Adding node to
 * `compilerOptions.types` puts node's globals into the scope of every screen —
 * most damagingly a `setTimeout` that returns `NodeJS.Timeout` instead of the
 * number RN actually hands back. Adding the dependency itself is worse still:
 * it re-resolves peer-dependency hashes across the workspace lockfile (measured:
 * 190 packages relinked, `better-call`'s zod peer flipping between importers)
 * for a type-only need in one test file.
 *
 * The specs use four functions, so four functions are declared here and nothing
 * leaks into app code. If this package ever gains @types/node properly, delete
 * this file.
 */

declare module 'node:fs' {
  interface Dirent {
    readonly name: string;
    isDirectory(): boolean;
    isFile(): boolean;
  }
  export function readdirSync(path: string, options: { withFileTypes: true }): Dirent[];
  export function readFileSync(path: string, encoding: 'utf8'): string;
}

declare module 'node:path' {
  export function dirname(path: string): string;
  export function join(...paths: string[]): string;
  export function relative(from: string, to: string): string;
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
}
