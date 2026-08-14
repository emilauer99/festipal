import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// This file lives at lib/__tests__/support/ — three levels below apps/mobile.
const MOBILE_ROOT = join(__dirname, '..', '..', '..');

/**
 * Shared test helper (09-07 gap closure) — reads a file relative to the
 * `apps/mobile` workspace root, same `fileURLToPath(import.meta.url)`
 * resolution `lib/__tests__/intl-polyfill.test.ts` already establishes, so
 * every source-text guard in this suite resolves paths the same way
 * regardless of the runner's own working directory.
 */
export function readMobileFile(...segments: string[]): string {
  return readFileSync(join(MOBILE_ROOT, ...segments), 'utf8');
}

/**
 * Strips comments out of a TypeScript/TSX source string before a guard test
 * pattern-matches it. Why this exists at all: the `_layout.tsx` and
 * `FloatingNav.tsx` comment blocks this plan touches EXPLAIN the very
 * options/values a raw text guard would be searching for (e.g. a comment
 * that says "headerShown: false is set here because…"), so a naive
 * substring/regex match against the raw source would find its own
 * explanation instead of the real code — the same pitfall
 * `intl-polyfill.test.ts`'s header describes, and the open LOW finding from
 * 06-10-REVIEW that never got hardened. This is where it finally is.
 *
 * Order: block comments (`/* … *\/`, which also covers the JSX `{/* … *\/}`
 * form — stripping the `/* … *\/` portion leaves harmless empty braces)
 * are removed first, then whole-line comments. A `//` is only treated as
 * the start of a line comment when it is NOT immediately preceded by `:` —
 * that exception is what keeps a URL scheme embedded in a string literal
 * (`https://…`, `quiks://…`) intact instead of being truncated mid-string.
 */
export function stripComments(source: string): string {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
  return stripLineComments(withoutBlockComments);
}

function stripLineComments(source: string): string {
  return source
    .split('\n')
    .map((line) => {
      let commentStart = -1;
      for (let i = 0; i < line.length - 1; i++) {
        if (line[i] === '/' && line[i + 1] === '/' && line[i - 1] !== ':') {
          commentStart = i;
          break;
        }
      }
      return commentStart === -1 ? line : line.slice(0, commentStart);
    })
    .join('\n');
}
