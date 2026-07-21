/**
 * Unit tests for `src/services/api/httpClient.ts`.
 *
 * Covers the acceptance-criteria paths from story 1.7:
 *  - 401 → silent refresh → retry succeeds.
 *  - 401 → silent refresh → retry also 401s → throws ApiError (no loop).
 *  - 401 → refresh itself throws → error propagates.
 *  - 401 → refresh returns null → throws SESSION_EXPIRED.
 *  - 5xx → normalized ApiError, retryable=true.
 *  - 4xx (non-401) → normalized ApiError, retryable=false.
 *  - Request timeout → ApiError with code 'REQUEST_TIMEOUT'.
 *  - 2xx → returns parsed JSON body.
 *  - requiresAuth=false → no Authorization header.
 *  - query parameters encoded into URL.
 *
 * Uses `jest.spyOn(global, 'fetch')` to intercept at the network level,
 * avoiding ESM-only transitive dependencies in the MSW stack that are
 * incompatible with the Babel/CJS Jest runtime used by jest-expo.
 */

import { ApiError } from '@/services/api/errors';

// ── Module mocks must be declared before any import of the module under test ──

// Mock `@/config/env` — removes the requirement for non-placeholder values.
jest.mock('@/config/env', () => ({
  env: {
    name: 'dev',
    isMock: false,
    apiBaseUrl: 'https://api.test',
    apiAuthHeader: 'Authorization',
    apiTokenPrefix: 'Bearer',
    appsyncUrl: 'https://appsync.test/graphql',
    appsyncRealtimeUrl: 'wss://appsync.test/graphql',
    cognitoRegion: 'eu-central-1',
    cognitoUserPoolId: 'eu-central-1_TEST',
    cognitoAppClientId: 'testclientid',
    pushRegisterEndpoint: '/v1/push-tokens',
    photoCloudFrontDomain: 'https://photos.test',
  },
}));

// Mock secureStorage so tests control what accessToken is returned.
const mockGetAccessToken = jest.fn<Promise<string | null>, []>();
const mockSetAccessToken = jest.fn<Promise<void>, [string]>();
jest.mock('@/services/auth/secureStorage', () => ({
  secureStorage: {
    getAccessToken: (...args: unknown[]) => mockGetAccessToken(...(args as [])),
    setAccessToken: (...args: unknown[]) => mockSetAccessToken(...(args as [string])),
  },
}));

// Mock cognitoClient so we can control refresh behavior.
const mockRefreshSession = jest.fn();
jest.mock('@/services/auth/cognitoClient', () => ({
  cognitoClient: {
    refreshSession: (...args: unknown[]) => mockRefreshSession(...args),
  },
}));

// Import the module under test AFTER mocks are in place.
import { request } from '@/services/api/httpClient';

// ── Fetch mock helpers ────────────────────────────────────────────────────

/**
 * Creates a mock `Response` object shaped like a real fetch Response.
 */
function makeResponse(
  status: number,
  body: unknown,
  ok?: boolean,
): Response {
  const isOk = ok !== undefined ? ok : status >= 200 && status < 300;
  const bodyStr = JSON.stringify(body);
  return {
    ok: isOk,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(bodyStr),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as Response;
}

/** Default successful tokens returned by a mock refresh. */
const FRESH_TOKENS = {
  accessToken: 'fresh-access-token',
  refreshToken: 'fresh-refresh-token',
  idToken: 'fresh-id-token',
};

// ── Setup ─────────────────────────────────────────────────────────────────

let fetchSpy: jest.SpyInstance;

beforeEach(() => {
  fetchSpy = jest.spyOn(globalThis, 'fetch');
  mockGetAccessToken.mockResolvedValue('valid-access-token');
  mockSetAccessToken.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

// ── Tests: 2xx happy path ─────────────────────────────────────────────────

describe('given a 200 response, when request<T> is called', () => {
  it('then returns parsed JSON body', async () => {
    const body = { username: 'alice' };
    fetchSpy.mockResolvedValueOnce(makeResponse(200, body));

    const result = await request<{ username: string }>({
      method: 'GET',
      path: '/profile/me',
    });

    expect(result).toEqual(body);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('then injects the Authorization header with Bearer prefix', async () => {
    fetchSpy.mockResolvedValueOnce(makeResponse(200, {}));
    mockGetAccessToken.mockResolvedValue('my-access-token');

    await request<unknown>({ method: 'GET', path: '/profile/me' });

    const calledInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const authHeader = (calledInit.headers as Headers).get('Authorization');
    expect(authHeader).toBe('Bearer my-access-token');
  });

  it('then calls the correct URL with base prefix', async () => {
    fetchSpy.mockResolvedValueOnce(makeResponse(200, {}));

    await request<unknown>({ method: 'GET', path: '/profile/me' });

    expect(fetchSpy.mock.calls[0]?.[0]).toBe('https://api.test/profile/me');
  });
});

// ── Tests: 401 → silent refresh → retry succeeds ─────────────────────────

describe('given a 401 then 200 after refresh, when request<T> is called', () => {
  it('then refreshes once, retries, and returns body', async () => {
    const successBody = { username: 'bob' };
    fetchSpy
      .mockResolvedValueOnce(makeResponse(401, { error: 'Unauthorized' }))
      .mockResolvedValueOnce(makeResponse(200, successBody));

    mockRefreshSession.mockResolvedValue(FRESH_TOKENS);

    const result = await request<{ username: string }>({
      method: 'GET',
      path: '/profile/me',
    });

    expect(result).toEqual(successBody);
    // Refresh called exactly once.
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    // New access token persisted.
    expect(mockSetAccessToken).toHaveBeenCalledWith(FRESH_TOKENS.accessToken);
    // fetch called twice (original + retry).
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('then the retry uses the fresh access token in its Authorization header', async () => {
    fetchSpy
      .mockResolvedValueOnce(makeResponse(401, {}))
      .mockResolvedValueOnce(makeResponse(200, {}));

    mockRefreshSession.mockResolvedValue(FRESH_TOKENS);

    await request<unknown>({ method: 'GET', path: '/profile/me' });

    const retryInit = fetchSpy.mock.calls[1]?.[1] as RequestInit;
    const retryAuth = (retryInit.headers as Headers).get('Authorization');
    expect(retryAuth).toBe(`Bearer ${FRESH_TOKENS.accessToken}`);
  });
});

// ── Tests: 401 → silent refresh → retry also 401s ────────────────────────

describe('given 401 on both attempts, when request<T> is called', () => {
  it('then throws ApiError with status 401', async () => {
    fetchSpy
      .mockResolvedValueOnce(makeResponse(401, { error: 'Unauthorized' }))
      .mockResolvedValueOnce(makeResponse(401, { error: 'Still unauthorized' }));

    mockRefreshSession.mockResolvedValue(FRESH_TOKENS);

    await expect(
      request<unknown>({ method: 'GET', path: '/profile/me' }),
    ).rejects.toThrow(ApiError);
  });

  it('then does NOT call refresh more than once (no infinite loop)', async () => {
    fetchSpy
      .mockResolvedValueOnce(makeResponse(401, {}))
      .mockResolvedValueOnce(makeResponse(401, {}));

    mockRefreshSession.mockResolvedValue(FRESH_TOKENS);

    await expect(request<unknown>({ method: 'GET', path: '/profile/me' })).rejects.toThrow();

    // Only one refresh attempt per request invocation.
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    // Only two fetch calls (original + one retry, then stop).
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('then thrown ApiError has retryable=false', async () => {
    fetchSpy
      .mockResolvedValueOnce(makeResponse(401, {}))
      .mockResolvedValueOnce(makeResponse(401, {}));

    mockRefreshSession.mockResolvedValue(FRESH_TOKENS);

    let caught: ApiError | null = null;
    try {
      await request<unknown>({ method: 'GET', path: '/profile/me' });
    } catch (err) {
      if (err instanceof ApiError) caught = err;
    }

    expect(caught?.retryable).toBe(false);
  });
});

// ── Tests: 401 → refresh itself throws ───────────────────────────────────

describe('given 401 and refresh itself throws, when request<T> is called', () => {
  it('then propagates the refresh error without a second fetch', async () => {
    fetchSpy.mockResolvedValueOnce(makeResponse(401, {}));
    mockRefreshSession.mockRejectedValue(new Error('Refresh token expired'));

    await expect(
      request<unknown>({ method: 'GET', path: '/profile/me' }),
    ).rejects.toThrow('Refresh token expired');

    // Server was hit only once — no retry after a refresh failure.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
  });
});

// ── Tests: 401 → refresh returns null ────────────────────────────────────

describe('given 401 and refresh returns null (no session), when request<T> is called', () => {
  it('then throws ApiError with code SESSION_EXPIRED', async () => {
    fetchSpy.mockResolvedValueOnce(makeResponse(401, {}));
    mockRefreshSession.mockResolvedValue(null);

    let caught: ApiError | null = null;
    try {
      await request<unknown>({ method: 'GET', path: '/profile/me' });
    } catch (err) {
      if (err instanceof ApiError) caught = err;
    }

    expect(caught).not.toBeNull();
    expect(caught?.status).toBe(401);
    expect(caught?.code).toBe('SESSION_EXPIRED');
  });
});

// ── Tests: 5xx propagation ────────────────────────────────────────────────

describe('given a 500 response, when request<T> is called', () => {
  it('then throws ApiError with status 500 and retryable=true', async () => {
    fetchSpy.mockResolvedValueOnce(
      makeResponse(500, { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' }),
    );

    let caught: ApiError | null = null;
    try {
      await request<unknown>({ method: 'GET', path: '/profile/me' });
    } catch (err) {
      if (err instanceof ApiError) caught = err;
    }

    expect(caught).not.toBeNull();
    expect(caught?.status).toBe(500);
    expect(caught?.code).toBe('INTERNAL_SERVER_ERROR');
    expect(caught?.message).toBe('Something went wrong');
    expect(caught?.retryable).toBe(true);
  });
});

describe('given a 503 response, when request<T> is called', () => {
  it('then throws ApiError with retryable=true', async () => {
    fetchSpy.mockResolvedValueOnce(makeResponse(503, {}));

    await expect(
      request<unknown>({ method: 'GET', path: '/health' }),
    ).rejects.toMatchObject({ status: 503, retryable: true });
  });
});

// ── Tests: 4xx (non-401) ──────────────────────────────────────────────────

describe('given a 403 response, when request<T> is called', () => {
  it('then throws ApiError with status 403 and retryable=false', async () => {
    fetchSpy.mockResolvedValueOnce(
      makeResponse(403, { code: 'PROFILE_INCOMPLETE', message: 'Complete your profile first' }),
    );

    await expect(
      request<unknown>({ method: 'GET', path: '/match/deck' }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'PROFILE_INCOMPLETE',
      retryable: false,
    });
  });
});

describe('given a 404 response, when request<T> is called', () => {
  it('then throws ApiError with status 404 and does NOT call refresh', async () => {
    fetchSpy.mockResolvedValueOnce(makeResponse(404, { code: 'NOT_FOUND' }));

    await expect(
      request<unknown>({ method: 'GET', path: '/profiles/unknown' }),
    ).rejects.toMatchObject({ status: 404 });

    // 404 is a client error, not an auth error — no refresh attempt.
    expect(mockRefreshSession).not.toHaveBeenCalled();
  });
});

// ── Tests: timeout path ───────────────────────────────────────────────────

describe('given the request times out, when request<T> is called', () => {
  it('then throws ApiError with code REQUEST_TIMEOUT', async () => {
    // Make fetch resolve only after the abort signal fires, simulating a
    // stalled network call. We use a real short timeout (50ms) to keep the
    // test fast without needing fake timers (which don't compose cleanly
    // with async/await microtasks in the Jest CJS runtime).
    fetchSpy.mockImplementation(
      (_url: unknown, init: RequestInit | undefined) =>
        new Promise<Response>((_resolve, reject) => {
          if (init?.signal) {
            init.signal.addEventListener('abort', () =>
              reject(new DOMException('AbortError', 'AbortError')),
            );
          }
          // Never resolves on its own — the AbortController fires after timeoutMs.
        }),
    );

    // Request with a 50 ms timeout — fast enough for a unit test.
    await expect(
      request<unknown>({ method: 'GET', path: '/slow', timeoutMs: 50 }),
    ).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });
  }, 5_000);
});

// ── Tests: requiresAuth=false ─────────────────────────────────────────────

describe('given requiresAuth=false, when request<T> is called', () => {
  it('then does not inject an Authorization header', async () => {
    fetchSpy.mockResolvedValueOnce(makeResponse(200, { token: 'xyz' }));

    await request<{ token: string }>({
      method: 'POST',
      path: '/auth/login',
      body: { username: 'a', password: 'b' },
      requiresAuth: false,
    });

    const calledInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const authHeader = (calledInit.headers as Headers).get('Authorization');
    expect(authHeader).toBeNull();
    expect(mockGetAccessToken).not.toHaveBeenCalled();
  });
});

// ── Tests: query string ───────────────────────────────────────────────────

describe('given query parameters, when request<T> is called', () => {
  it('then encodes them into the URL', async () => {
    fetchSpy.mockResolvedValueOnce(makeResponse(200, { items: [] }));

    await request<{ items: unknown[] }>({
      method: 'GET',
      path: '/profiles',
      query: { page: 2, limit: 10 },
    });

    const calledUrl = fetchSpy.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('limit=10');
  });
});

// ── Tests: JSON body ──────────────────────────────────────────────────────

describe('given a body in the request options, when request<T> is called', () => {
  it('then sets Content-Type application/json', async () => {
    fetchSpy.mockResolvedValueOnce(makeResponse(201, {}));

    await request<unknown>({
      method: 'POST',
      path: '/profile/me',
      body: { name: 'Alice' },
    });

    const calledInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const contentType = (calledInit.headers as Headers).get('Content-Type');
    expect(contentType).toBe('application/json');
  });

  it('then serializes the body as JSON', async () => {
    fetchSpy.mockResolvedValueOnce(makeResponse(201, {}));
    const payload = { name: 'Alice', age: 30 };

    await request<unknown>({
      method: 'POST',
      path: '/profile/me',
      body: payload,
    });

    const calledInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    expect(calledInit.body).toBe(JSON.stringify(payload));
  });
});
