/**
 * Regression guard for `otp-login-stuck-code-screen` at the library boundary.
 *
 * The defect: `@better-auth/expo`'s `getActions()` hydrates the session atom from
 * the SecureStore cache during `createAuthClient()` via `sessionAtom.get()`, and
 * nanostores' `get()` LAZY-MOUNTS. The atom therefore mounts and unmounts with no
 * subscriber, arming nanostores' 1000ms STORE_UNMOUNT_DELAY. If the app's single
 * `useSession()` subscription attaches after that timer fires, the unmount
 * destructor's `settleAbortedFetch()` calls `session.get()` again and RE-MOUNTS the
 * atom mid-teardown; the same `for...of` then runs the brand-new mount's destructor
 * (JS array iterators pick up elements pushed during iteration) and leaves
 * `$store.active === true` with no refresh manager. `$sessionSignal -> fetchSession`
 * is never subscribed again for the life of the JS context, so a successful OTP
 * sign-in never produces a session and the root guard never moves off `/verify`.
 *
 * Device fingerprint to keep out: `sessionLc=1, sessionActive=true, signalLc=0`.
 * The fix under guard is the module-init pin in `lib/auth-client.ts`.
 *
 * Oracle type: DERIVED — asserts the contract "a sign-in always triggers a session
 * refetch", not better-auth's internals.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const secureStore = new Map<string, string>();

vi.mock('expo-secure-store', () => ({
  getItem: (key: string) => secureStore.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    secureStore.set(key, value);
  },
  getItemAsync: async (key: string) => secureStore.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    secureStore.set(key, value);
  },
  deleteItemAsync: async (key: string) => {
    secureStore.delete(key);
  },
}));

vi.mock('expo-constants', () => ({
  default: { expoConfig: { scheme: 'quiks' }, platform: { scheme: 'quiks' } },
}));

vi.mock('expo-linking', () => ({
  createURL: (path: string) => `quiks:///${String(path).replace(/^\//, '')}`,
  parse: () => ({}),
}));

vi.mock('expo-network', () => ({
  addNetworkStateListener: () => ({ remove: () => {} }),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
  AppState: { addEventListener: () => ({ remove: () => {} }) },
}));

const BASE = 'http://10.0.0.5:8081/api/auth';

type FakeSession = { token: string; userId: string; email: string };
let sessions: FakeSession[] = [];
let tokenCounter = 0;
let requestLog: string[] = [];
/** Emulates a real LAN round trip; node's instant resolve is NOT device-realistic. */
let netLatencyMs = 0;

function cookieHeaderOf(init?: RequestInit): string {
  return new Headers((init?.headers ?? {}) as HeadersInit).get('cookie') ?? '';
}

function sessionForCookie(cookie: string): FakeSession | null {
  const match = /better-auth\.session_token=([^;]+)/.exec(cookie);
  if (!match) return null;
  const raw = decodeURIComponent(match[1] ?? '');
  return sessions.find((s) => s.token === raw) ?? null;
}

function json(body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(body === null ? 'null' : JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fakeFetch = vi.fn(async (input: unknown, init?: RequestInit): Promise<Response> => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : String((input as Request).url ?? input);
  const cookie = cookieHeaderOf(init);
  requestLog.push(`${init?.method ?? 'GET'} ${url.replace(BASE, '')}`);
  if (netLatencyMs > 0) await sleep(netLatencyMs);

  if (url.includes('/sign-in/email-otp')) {
    const body = JSON.parse(String(init?.body ?? '{}')) as { email?: string };
    const token = `tok-${++tokenCounter}`;
    const email = body.email ?? 'unknown@example.com';
    sessions.push({ token, userId: `user-${email}`, email });
    return json(
      { token, user: { id: `user-${email}`, email, emailVerified: true, name: email } },
      {
        'set-cookie': `better-auth.session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=7776000`,
      },
    );
  }
  if (url.includes('/sign-out')) {
    const active = sessionForCookie(cookie);
    if (active) sessions = sessions.filter((s) => s.token !== active.token);
    return json(
      { success: true },
      { 'set-cookie': `better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` },
    );
  }
  if (url.includes('/get-session')) {
    const active = sessionForCookie(cookie);
    if (!active) return json(null);
    return json({
      session: {
        id: `sess-${active.token}`,
        token: active.token,
        userId: active.userId,
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      },
      user: { id: active.userId, email: active.email, emailVerified: true, name: active.email },
    });
  }
  return json({});
});

type SessionAtomValue = {
  data: { user?: { email?: string } } | null;
  isPending: boolean;
  isRefetching: boolean;
};

type ProbeAtom = {
  value: unknown;
  lc: number;
  /** nanostores' onMount flag — the whole question. */
  active?: boolean;
  listen: (fn: (value: never) => void) => () => void;
};

function seedWarmSession(email: string, token: string): void {
  const expires = new Date(Date.now() + 86_400_000).toISOString();
  sessions.push({ token, userId: `user-${email}`, email });
  secureStore.set(
    'quiks_cookie',
    JSON.stringify({ 'better-auth.session_token': { value: token, expires } }),
  );
  secureStore.set(
    'quiks_session_data',
    JSON.stringify({
      session: { id: `sess-${token}`, token, userId: `user-${email}`, expiresAt: expires },
      user: { id: `user-${email}`, email, emailVerified: true, name: email },
    }),
  );
}

async function loadClient() {
  process.env.EXPO_PUBLIC_API_URL = BASE;
  const { authClient } = await import('../auth-client');
  const store = (authClient as unknown as { $store: { atoms: Record<string, ProbeAtom> } }).$store;
  return {
    authClient,
    sessionAtom: store.atoms.session as ProbeAtom,
    signalAtom: store.atoms.$sessionSignal as ProbeAtom,
  };
}

describe('better-auth session atom stays mounted across boot', () => {
  beforeEach(() => {
    secureStore.clear();
    sessions = [];
    tokenCounter = 0;
    requestLog = [];
    netLatencyMs = 0;
    fakeFetch.mockClear();
    (globalThis as Record<string, unknown>).window = globalThis;
    (globalThis as Record<string, unknown>).fetch = fakeFetch;
    vi.resetModules();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).window;
  });

  /** Blocks the JS thread, the way a real Expo boot does between module eval and first paint. */
  function blockJsThread(ms: number): void {
    const until = Date.now() + ms;
    while (Date.now() < until) {
      /* spin */
    }
  }

  /**
   * @param subscribeAtMs when the React-equivalent subscription attaches, measured
   *   from the instant `createAuthClient()` returns — i.e. from the lazy mount that
   *   `expoClient.getActions()` triggers. Anchoring here (not at test start) is what
   *   makes the window deterministic: transform/import time varies by seconds.
   * @param busyBootMs how long the JS thread stays blocked afterwards. This defers
   *   the mount callback's `setTimeout(fetchSession, 0)` and with it the SECOND
   *   deferred-unmount timer — the one that would otherwise heal the corrupt state
   *   ~1ms later. The corrupt window is therefore ~[init+1000, init+1000+busy].
   */
  async function probeBootDelay(subscribeAtMs: number, latencyMs: number, busyBootMs = 0) {
    netLatencyMs = latencyMs;
    seedWarmSession('first@example.com', 'tok-warm');
    const { authClient, sessionAtom, signalAtom } = await loadClient();
    const t0 = Date.now();
    if (busyBootMs > 0) blockJsThread(busyBootMs);
    const bootDelayMs = Math.max(0, subscribeAtMs - (Date.now() - t0));

    const timeline: string[] = [];
    const sample = (label: string) =>
      timeline.push(
        `t=${String(Date.now() - t0).padStart(4)} ${label} sessionLc=${sessionAtom.lc} sessionActive=${String(sessionAtom.active)} signalLc=${signalAtom.lc}`,
      );

    sample('module-init');
    const poll = setInterval(() => sample('poll'), 100);
    await sleep(bootDelayMs);
    clearInterval(poll);
    sample('pre-subscribe');

    // The app's ONE React subscription (RootNavigation's useSession()).
    const deliveries: string[] = [];
    const unsubscribe = sessionAtom.listen((v: SessionAtomValue) =>
      deliveries.push(`user=${v.data?.user?.email ?? 'null'} pending=${v.isPending}`),
    );
    sample('post-subscribe');
    const signalLcAfterSubscribe = signalAtom.lc;

    // logout -> re-login inside the same process
    requestLog.length = 0;
    await authClient.signOut();
    await sleep(150);
    deliveries.length = 0;
    requestLog.length = 0;
    await authClient.signIn.emailOtp({ email: 'second@example.com', otp: '123456' });
    // Sampled the instant sign-in resolves, BEFORE any refetch could have run —
    // this is the premise `app/_layout.tsx`'s cookie-first resolve depends on:
    // @better-auth/expo persists the cookie inside its onSuccess hook regardless
    // of whether it goes on to notify the atom. In the pre-fix (unpinned) state
    // this stays true while the atom assertions below fail, which is precisely
    // why the guard can rely on the cookie when the atom has gone silent.
    const cookieAfterSignIn = authClient.getCookie();
    await sleep(400);
    sample('after-relogin');

    const refetched = requestLog.some((r) => r.includes('/get-session'));
    unsubscribe();

    return {
      signalLcAfterSubscribe,
      cookieAfterSignIn,
      refetched,
      finalUser: (sessionAtom.value as SessionAtomValue).data?.user?.email ?? null,
      // Attached to the assertion so a failure explains WHERE in the mount
      // lifecycle it went wrong, without printing on every green run.
      report:
        `\nsubscribeAt=${subscribeAtMs}ms latency=${latencyMs}ms busyBoot=${busyBootMs}ms\n` +
        `${timeline.join('\n')}\n` +
        `requests=${JSON.stringify(requestLog)} deliveries=${JSON.stringify(deliveries)}\n` +
        `cookieAfterSignIn=${JSON.stringify(cookieAfterSignIn)}`,
    };
  }

  // Case 2 subscribes in the DEAD CENTRE of the window that a busy boot opens.
  // Without the module-init pin in lib/auth-client.ts it leaves the session atom
  // permanently `active: true` with zero `$sessionSignal` listeners and no refetch
  // — the exact device fingerprint (`sessionListeners: 1, signalListeners: 0`).
  const cases: [label: string, subscribeAtMs: number, latencyMs: number, busyBootMs: number][] = [
    ['before the unmount window (control)', 100, 120, 0],
    ['inside the busy-boot-widened unmount window', 1400, 120, 800],
  ];

  for (const [label, subscribeAtMs, latencyMs, busyBootMs] of cases) {
    it(`keeps the signal subscription when subscribing ${label}`, async () => {
      const r = await probeBootDelay(subscribeAtMs, latencyMs, busyBootMs);
      expect(
        {
          signalSubscribed: r.signalLcAfterSubscribe > 0,
          cookieReadableAfterSignIn: r.cookieAfterSignIn.includes('better-auth.session_token='),
          refetched: r.refetched,
          finalUser: r.finalUser,
        },
        r.report,
      ).toEqual({
        signalSubscribed: true,
        cookieReadableAfterSignIn: true,
        refetched: true,
        finalUser: 'second@example.com',
      });
    }, 20_000);
  }
});
