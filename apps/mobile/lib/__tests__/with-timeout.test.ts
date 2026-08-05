import { describe, expect, it, vi } from 'vitest';

import { NETWORK_TIMEOUT_MS, TimeoutError, withTimeout } from '../with-timeout';

describe('withTimeout', () => {
  it('resolves with the wrapped value when it settles in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 1000)).resolves.toBe(42);
  });

  it('propagates a rejection from the wrapped promise', async () => {
    const boom = new Error('boom');
    await expect(withTimeout(Promise.reject(boom), 1000)).rejects.toBe(boom);
  });

  it('rejects with TimeoutError when the promise never settles before the deadline', async () => {
    vi.useFakeTimers();
    try {
      const neverSettles = new Promise<number>(() => {});
      const timed = withTimeout(neverSettles, NETWORK_TIMEOUT_MS);
      const assertion = expect(timed).rejects.toBeInstanceOf(TimeoutError);
      await vi.advanceTimersByTimeAsync(NETWORK_TIMEOUT_MS);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
