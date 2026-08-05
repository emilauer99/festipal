// D-03 — the username-taken suggestion (UI-SPEC Copywriting Contract "username
// taken helper line 2") must NEVER exceed the server's 20-char username cap,
// regardless of the taken input's length/charset (RESEARCH.md Pattern 5, UI-SPEC
// long-text/username-taken-suggestion backstop). The algorithm itself is
// Claude's/planner's discretion — the contract only fixes the sentence shape.
const MAX_USERNAME_LENGTH = 20;
// "_1234" — leading underscore + 4 digits.
const SUFFIX_LENGTH = 5;
const BASE_MAX_LENGTH = MAX_USERNAME_LENGTH - SUFFIX_LENGTH;
// Used when `taken` sanitizes down to nothing (empty/all-symbols/emoji-only
// input) — still charset-safe and well within BASE_MAX_LENGTH.
const FALLBACK_BASE = 'visitor';
// Bounded retry (RESEARCH.md Assumption A3) — worst case falls back to the
// last-generated (unverified) candidate rather than looping forever.
const MAX_AVAILABILITY_ATTEMPTS = 3;

/**
 * Lowercases, strips to the D-03 charset (`a-z0-9_.`), and slices to leave
 * room for the `_NNNN` suffix. Pure — no RN/runtime dependency.
 */
function sanitizeBase(input: string): string {
  const sanitized = input.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, BASE_MAX_LENGTH);
  return sanitized.length > 0 ? sanitized : FALLBACK_BASE.slice(0, BASE_MAX_LENGTH);
}

function randomSuffix(): string {
  const fourDigits = Math.floor(1000 + Math.random() * 9000);
  return `_${fourDigits}`;
}

/**
 * Pure, deterministic-shape (random suffix) generator — never exceeds
 * `MAX_USERNAME_LENGTH` and only emits the `a-z0-9_.` charset, for ANY input
 * (empty string, emoji, multi-byte, or an already-too-long displayName).
 */
export function generateUsernameSuggestion(taken: string): string {
  const base = sanitizeBase(taken);
  const suffix = randomSuffix();
  return `${base}${suffix}`.slice(0, MAX_USERNAME_LENGTH);
}

/**
 * Verifies a generated candidate is actually available (Pattern 5 / Pitfall —
 * "MUST NOT surface an unavailable username suggestion") before returning it,
 * regenerating on collision with a bounded retry. `checkFn` is injected so
 * this stays a pure/testable function with no direct network dependency — the
 * caller supplies the real `GET /me/username-availability` check.
 */
export async function suggestAvailableUsername(
  taken: string,
  checkFn: (candidate: string) => Promise<boolean>,
): Promise<string> {
  let candidate = generateUsernameSuggestion(taken);
  for (let attempt = 0; attempt < MAX_AVAILABILITY_ATTEMPTS; attempt += 1) {
    const available = await checkFn(candidate);
    if (available) return candidate;
    candidate = generateUsernameSuggestion(taken);
  }
  // Bounded-retry exhausted — fall back to the last candidate rather than
  // looping forever (RESEARCH.md Assumption A3, low-risk: worst case is a
  // very rare unverified suggestion, the 20-char/charset invariants still hold).
  return candidate;
}
