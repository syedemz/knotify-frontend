/**
 * API error types and normalization helpers.
 *
 * All non-2xx HTTP responses from the REST API are normalized into an
 * {@link ApiError} before being thrown. No raw `fetch` errors or unknown
 * shapes ever escape this module.
 *
 * @module services/api/errors
 */

/**
 * Thrown by {@link request} for every non-2xx HTTP response.
 *
 * @example
 * ```ts
 * try {
 *   await request({ method: 'GET', path: '/profile/me' });
 * } catch (err) {
 *   if (err instanceof ApiError) {
 *     console.error(err.status, err.code, err.message);
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  /**
   * HTTP status code from the server response (e.g. 401, 403, 500).
   */
  readonly status: number;

  /**
   * Application-level error code returned by the backend, or a synthesized
   * value when the response body does not include one (e.g. `'UNKNOWN'`).
   */
  readonly code: string;

  /**
   * Whether the request is safe to retry without user intervention. The
   * caller must still decide *when* to retry; this flag only signals safety.
   */
  readonly retryable: boolean;

  /**
   * @param status - HTTP status code.
   * @param code - Application error code.
   * @param message - Human-readable description.
   * @param retryable - Whether the error is transient and safe to retry.
   */
  constructor(status: number, code: string, message: string, retryable: boolean) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * Shape expected from the backend for error responses.
 * The backend may omit `code` for some status codes; we fall back to
 * synthesized codes in that case.
 */
interface ErrorResponseBody {
  code?: string;
  message?: string;
  error?: string;
}

/**
 * Determines whether a given HTTP status is retryable by default.
 *
 * Only 429 (rate limit) and 5xx server errors are considered retryable.
 * 4xx client errors are not — they require user or caller action.
 *
 * @param status - HTTP status code.
 * @returns `true` if the error is safe to retry.
 */
export function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Normalizes a fetch `Response` object that has a non-2xx status into an
 * {@link ApiError}.
 *
 * The function attempts to parse the response body as JSON to extract a
 * backend `code` and `message`. If parsing fails (e.g., plain-text error
 * page), it falls back to synthesized values.
 *
 * @param response - A `Response` with a non-2xx status code.
 * @returns A resolved `Promise<ApiError>` — never rejects.
 */
export async function normalizeErrorResponse(response: Response): Promise<ApiError> {
  const status = response.status;
  let code = 'UNKNOWN';
  let message = `Request failed with status ${status}`;

  try {
    const body = (await response.json()) as ErrorResponseBody;
    if (typeof body.code === 'string' && body.code.length > 0) {
      code = body.code;
    }
    const rawMessage = body.message ?? body.error;
    if (typeof rawMessage === 'string' && rawMessage.length > 0) {
      message = rawMessage;
    }
  } catch {
    // Body is not JSON — keep the synthesized fallback values.
  }

  return new ApiError(status, code, message, isRetryable(status));
}

/**
 * Wraps an unknown value caught from a `catch` clause into a consistent
 * `Error`. Used by callers that need to re-throw non-`ApiError` failures
 * with added context.
 *
 * @param err - Value caught from a try/catch block.
 * @param context - Short description of where the error occurred.
 * @returns The original error if it is already an `Error`, otherwise a new
 *   `Error` wrapping the stringified value.
 */
export function toError(err: unknown, context: string): Error {
  if (err instanceof Error) {
    return err;
  }
  return new Error(`${context}: ${String(err)}`);
}
