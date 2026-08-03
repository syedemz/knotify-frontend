/**
 * HTTP client — the sole point of contact between the app and the REST API.
 *
 * Implements the `request<T>` contract from architecture §8.2:
 *  - Base URL from `config/env.ts`.
 *  - JWT injection from `services/auth/secureStorage.ts`.
 *  - Configurable per-call timeout (default 15 s).
 *  - One silent token-refresh on 401, then a single retry.
 *  - Typed {@link ApiError} thrown on every non-2xx response.
 *
 * Nothing outside `src/services/` should call `fetch` directly.
 *
 * @module services/api/httpClient
 */

import { env } from '@/config/env';
import { ApiError, normalizeErrorResponse } from './errors';
import { secureStorage } from '../auth/secureStorage';
import { cognitoClient } from '../auth/cognitoClient';

/** HTTP methods accepted by the API. */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/**
 * Options accepted by {@link request}.
 */
export interface RequestOptions {
  /** HTTP verb. */
  method: HttpMethod;
  /** Path relative to `env.apiBaseUrl`, e.g. `'/profile/me'`. */
  path: string;
  /**
   * Query-string parameters. Values are coerced to strings before encoding.
   * Numbers and strings are both accepted.
   */
  query?: Record<string, string | number>;
  /** Request body. Serialized as JSON. */
  body?: unknown;
  /**
   * Whether to attach the `Authorization` header.
   * Defaults to `true`. Pass `false` for unauthenticated endpoints such as
   * the sign-in flow.
   */
  requiresAuth?: boolean;
  /**
   * Per-call timeout in milliseconds. Defaults to {@link DEFAULT_TIMEOUT_MS}.
   * The call throws {@link ApiError} with code `'REQUEST_TIMEOUT'` when
   * exceeded.
   */
  timeoutMs?: number;
  /** An `AbortSignal` the caller can use to cancel the request. */
  signal?: AbortSignal;
}

/** Default request timeout (15 seconds). */
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Builds the full request URL by appending the path and optional query
 * parameters to the configured base URL.
 *
 * @param path - Relative path, e.g. `'/profile/me'`.
 * @param query - Optional key-value pairs to encode into the query string.
 * @returns Full URL string.
 */
function buildUrl(path: string, query?: Record<string, string | number>): string {
  const base = env.apiBaseUrl.endsWith('/') ? env.apiBaseUrl.slice(0, -1) : env.apiBaseUrl;
  const url = new URL(`${base}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Builds the `Headers` object for a request.
 *
 * @param accessToken - JWT access token to inject, or `null` if not available.
 * @param requiresAuth - Whether to include the Authorization header.
 * @param hasBody - Whether to set `Content-Type: application/json`.
 * @returns Populated `Headers` instance.
 */
function buildHeaders(
  accessToken: string | null,
  requiresAuth: boolean,
  hasBody: boolean,
): Headers {
  const headers = new Headers();
  if (hasBody) {
    headers.set('Content-Type', 'application/json');
  }
  if (requiresAuth && accessToken !== null) {
    headers.set('Authorization', `${env.apiTokenPrefix} ${accessToken}`);
  }
  return headers;
}

/**
 * Executes a single fetch call with a timeout applied via `AbortController`.
 * The caller's own `signal` (if any) is also respected — whichever fires
 * first wins.
 *
 * @param url - Full request URL.
 * @param init - Fetch init options (method, headers, body).
 * @param timeoutMs - Maximum duration in milliseconds before aborting.
 * @param callerSignal - Optional AbortSignal from the caller.
 * @returns The raw `Response`.
 * @throws {@link ApiError} with code `'REQUEST_TIMEOUT'` on timeout.
 * @throws The original `AbortError` when the caller signal fires.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  callerSignal?: AbortSignal,
): Promise<Response> {
  const timeoutController = new AbortController();
  const timerId = setTimeout(() => timeoutController.abort(), timeoutMs);

  // Combine the timeout signal with an optional caller signal.
  const signals: AbortSignal[] = [timeoutController.signal];
  if (callerSignal) {
    signals.push(callerSignal);
  }

  // AbortSignal.any is available in React Native's Hermes / modern environments.
  // Fall back to just the timeout signal if unavailable.
  const combinedSignal =
    typeof AbortSignal.any === 'function' ? AbortSignal.any(signals) : timeoutController.signal;

  try {
    const response = await fetch(url, { ...init, signal: combinedSignal });
    return response;
  } catch (err) {
    if (timeoutController.signal.aborted && !(callerSignal?.aborted)) {
      // The timeout fired, not the caller's cancel.
      throw new ApiError(0, 'REQUEST_TIMEOUT', `Request timed out after ${timeoutMs}ms`, true);
    }
    // Caller cancelled or network error — re-throw as-is.
    throw err;
  } finally {
    clearTimeout(timerId);
  }
}

/**
 * Performs a single HTTP call without silent-refresh logic.
 *
 * @param opts - Request options.
 * @param accessToken - JWT to inject, or `null`.
 * @returns The raw `Response`.
 */
async function executeOnce(opts: RequestOptions, accessToken: string | null): Promise<Response> {
  const url = buildUrl(opts.path, opts.query);
  const requiresAuth = opts.requiresAuth !== false;
  const hasBody = opts.body !== undefined;
  const headers = buildHeaders(accessToken, requiresAuth, hasBody);
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const init: RequestInit = {
    method: opts.method,
    headers,
    body: hasBody ? JSON.stringify(opts.body) : undefined,
  };

  return fetchWithTimeout(url, init, timeoutMs, opts.signal);
}

/**
 * Makes a typed HTTP request against the knotify REST API.
 *
 * Behavior per architecture §8.2:
 * 1. Reads the current access token from secure storage.
 * 2. Executes the request.
 * 3. On 401: performs exactly one silent token refresh via
 *    {@link cognitoClient.refreshSession}, then retries once.
 *    If the retry also returns 401, throws {@link ApiError}.
 *    This guarantees no infinite refresh loops.
 * 4. On any other non-2xx status: normalizes to {@link ApiError} and throws.
 * 5. On 2xx: parses the response body as JSON and returns it typed as `T`.
 *
 * @param opts - Request configuration.
 * @returns Parsed response body typed as `T`.
 * @throws {@link ApiError} On any non-2xx response, including after retry.
 * @throws {@link ApiError} with code `'REQUEST_TIMEOUT'` when the timeout fires.
 */
export async function request<T>(opts: RequestOptions): Promise<T> {
  // TODO(mock-only): remove this branch when the real backend ships.
  // In mock mode, dispatch to the in-process mock instead of hitting the
  // network. See src/services/api/mocks/mockRequest.ts and context.md →
  // "Before shipping" for the teardown checklist.
  if (env.isMock) {
    // Dynamic require so the mock module is not part of the live-mode bundle.
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deferred to keep mock code out of live bundles
    const { mockRequest } = require('./mocks/mockRequest') as typeof import('./mocks/mockRequest');
    return mockRequest<T>(opts);
  }

  const requiresAuth = opts.requiresAuth !== false;

  // Step 1: Fetch the access token (may be null for unauthenticated calls).
  const accessToken = requiresAuth ? await secureStorage.getAccessToken() : null;

  // Step 2: Execute the request.
  const firstResponse = await executeOnce(opts, accessToken);

  // Step 3: Handle 401 with one silent refresh + one retry.
  if (firstResponse.status === 401 && requiresAuth) {
    // Attempt to refresh the session. If this fails, it throws — we let it
    // propagate so the caller (AuthProvider) can sign the user out.
    const refreshed = await cognitoClient.refreshSession();

    if (!refreshed) {
      // Refresh returned null — sign-in required.
      throw new ApiError(
        401,
        'SESSION_EXPIRED',
        'Session expired. Please sign in again.',
        false,
      );
    }

    // Persist the new access token and retry once.
    await secureStorage.setAccessToken(refreshed.accessToken);
    const retryResponse = await executeOnce(opts, refreshed.accessToken);

    if (retryResponse.status === 401) {
      // Even after refresh the server rejects us — do not loop.
      throw new ApiError(
        401,
        'SESSION_EXPIRED',
        'Session expired after token refresh. Please sign in again.',
        false,
      );
    }

    if (!retryResponse.ok) {
      throw await normalizeErrorResponse(retryResponse);
    }

    return (await retryResponse.json()) as T;
  }

  // Step 4: Any other non-2xx — normalize and throw.
  if (!firstResponse.ok) {
    throw await normalizeErrorResponse(firstResponse);
  }

  // Step 5: Success — parse and return.
  return (await firstResponse.json()) as T;
}
