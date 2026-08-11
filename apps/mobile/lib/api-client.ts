import { initClient } from '@ts-rest/core';
import { contract } from '@quiks/contracts';

import { authClient } from './auth-client';

/**
 * Single shared ts-rest client, fully typed from `@quiks/contracts` — no
 * request/response shape is re-declared here (Pitfall 6 / CLAUDE.md
 * "Duplicating Contract Definitions" anti-pattern).
 *
 * Cookie forwarding (RESEARCH.md Pattern 2 — the single highest-risk
 * integration point in this phase): React Native has no native cookie jar the
 * way a browser does. `@better-auth/expo`'s `expoClient` mimics one by storing
 * a JSON-encoded cookie map in SecureStore and exposing a synchronous
 * `authClient.getCookie()` accessor; every request re-reads it so a cookie
 * refreshed by a prior response (e.g. after sign-in) is always forwarded.
 */
export const apiClient = initClient(contract, {
  baseUrl: process.env.EXPO_PUBLIC_API_URL!,
  baseHeaders: {
    Cookie: () => authClient.getCookie(),
  },
  // Pitfall F — RN's fetch has no cookie jar to "include" from; mixing
  // `credentials: 'include'` with the manual Cookie header above silently
  // drops/garbles it. 'omit' is the only correct value here.
  credentials: 'omit',
});
