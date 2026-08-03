/**
 * In-process mock dispatcher for the REST API.
 *
 * Called from `httpClient.request()` when `env.isMock` is true. Returns fake
 * responses (typed to match what the real backend will return) so the app
 * can be walked end-to-end without any deployed backend.
 *
 * This replaces the previous MSW-based mock — MSW's `msw/native` requires
 * browser globals (`MessageEvent`, `Event`, `CloseEvent`) that Hermes does
 * not ship, and polyfilling them is fragile. A direct branch in the HTTP
 * layer is simpler, faster, and has zero runtime dependencies.
 *
 * TODO(mock-only): delete this file when the real backend ships. See
 * context.md → "Before shipping" for the full teardown checklist.
 *
 * @module services/api/mocks/mockRequest
 */

import { ApiError } from '../errors';
import type { RequestOptions } from '../httpClient';

// ── Fixture toggles ────────────────────────────────────────────────────────────
// TODO(mock-only): remove when real backend + JWT claim decode ship

/**
 * Controls whether the next PATCH `/profile/me` call returns a 409 collision.
 *
 * Set to `true` in tests that exercise the username-collision retry path.
 * Automatically resets to `false` after the first 409 is returned.
 */
let mockProfilePatch409Once = false;

/**
 * Enables the 409-collision fixture for exactly one PATCH call.
 */
export function enableProfilePatch409Once(): void {
  mockProfilePatch409Once = true;
}

/**
 * Controls whether the next PATCH `/profile/me` call returns a 500 error.
 *
 * Set to `true` in tests that exercise the generic failure retry path.
 * Automatically resets to `false` after the first 500 is returned.
 */
let mockProfilePatch500Once = false;

/**
 * Enables the 500-error fixture for exactly one PATCH call.
 */
export function enableProfilePatch500Once(): void {
  mockProfilePatch500Once = true;
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

/**
 * Dispatches a mock response for the given request. Path/method combinations
 * that have no handler throw an `ApiError(404)` — matching what a real
 * backend would return for an unknown route.
 *
 * @param opts - The same `RequestOptions` passed to `httpClient.request()`.
 * @returns A promise resolving to the fake response body typed as `T`.
 * @throws {ApiError} For explicit fixture failures (409, 500) or unknown routes (404).
 */
export async function mockRequest<T>(opts: RequestOptions): Promise<T> {
  const key = `${opts.method} ${opts.path}`;

  // PATCH /profile/me — echoes body on success; 409/500 fixtures on demand.
  if (key === 'PATCH /profile/me') {
    if (mockProfilePatch409Once) {
      mockProfilePatch409Once = false;
      throw new ApiError(
        409,
        'USERNAME_TAKEN',
        'Username is already taken.',
        false,
      );
    }
    if (mockProfilePatch500Once) {
      mockProfilePatch500Once = false;
      throw new ApiError(
        500,
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred.',
        true,
      );
    }
    return (opts.body ?? {}) as T;
  }

  // Unknown route — surface a 404 that looks like the real backend's shape.
  throw new ApiError(
    404,
    'NOT_FOUND',
    `[mock] No handler for ${key}`,
    false,
  );
}
