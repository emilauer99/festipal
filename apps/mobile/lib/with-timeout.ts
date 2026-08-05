/**
 * Reject a promise if it hasn't settled within `ms`. Phase-4 UAT fix: the
 * mobile better-auth / ts-rest client calls have NO built-in request timeout,
 * so a call to an unreachable dev API (wrong LAN IP, device off the dev
 * machine's Wi-Fi) hangs forever — leaving a submit CTA stuck in its
 * "Sending…"/"Saving…" state with no error ever surfaced. Wrapping the awaited
 * call bounds that wait so the calling screen can show its unreachable-server
 * message and re-enable the button.
 *
 * Pure/node-importable (no RN imports) so it stays inside the lib/ Vitest
 * node-env scope, matching the other lib/ utilities.
 */
export class TimeoutError extends Error {
  constructor() {
    super('Request timed out');
    this.name = 'TimeoutError';
  }
}

// Generic over the ARGUMENT type (not `PromiseLike<T>`) and unwraps with
// `Awaited`, because better-auth / better-fetch return custom thenables whose
// `.then` typing defeats `PromiseLike<T>` inference (T collapses to `unknown`).
// Inferring T from the value directly keeps the wrapped call's concrete type.
export function withTimeout<T>(promise: T, ms: number): Promise<Awaited<T>> {
  return new Promise<Awaited<T>>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/** Default bound for the auth/profile network calls (device UX, not a server SLA). */
export const NETWORK_TIMEOUT_MS = 15000;
