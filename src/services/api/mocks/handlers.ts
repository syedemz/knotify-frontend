/**
 * MSW v2 request handlers for offline / mock development.
 *
 * This file initializes MSW with baseline handlers. Endpoint-specific
 * handlers are added by each phase as features are built.
 *
 * The `worker` export is a `setupServer` instance from `msw/native` (the
 * React Native interceptor). It is started in `App.tsx` when
 * `EXPO_PUBLIC_API_MODE === 'mock'`.
 *
 * Usage (in App.tsx — wired by this story):
 * ```ts
 * import { worker } from '@/services/api/mocks/handlers';
 * if (env.isMock) {
 *   worker.listen({ onUnhandledRequest: 'warn' });
 * }
 * ```
 *
 * Adding a handler in a later phase:
 *
 *   import { http, HttpResponse } from 'msw';
 *   import { worker } from '@/services/api/mocks/handlers';
 *   worker.use(
 *     http.get('/v1/profile/me', () => HttpResponse.json({ username: 'test' })),
 *   );
 *
 * @module services/api/mocks/handlers
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/native';

// ── Fixture toggles ────────────────────────────────────────────────────────────
// TODO(mock-only): remove when real backend + JWT claim decode ship

/**
 * Controls whether the next PATCH `/profile/me` call returns a 409 collision.
 *
 * Set to `true` in tests that exercise the username-collision retry path.
 * Automatically resets to `false` after the first 409 is returned.
 *
 * TODO(mock-only): remove when real backend + JWT claim decode ship
 */
export let mockProfilePatch409Once = false;

/**
 * Enables the 409-collision fixture for exactly one PATCH call.
 *
 * @example
 * ```ts
 * import { enableProfilePatch409Once } from '@/services/api/mocks/handlers';
 * enableProfilePatch409Once();
 * ```
 *
 * TODO(mock-only): remove when real backend + JWT claim decode ship
 */
export function enableProfilePatch409Once(): void {
  mockProfilePatch409Once = true;
}

/**
 * Controls whether the next PATCH `/profile/me` call returns a 500 error.
 *
 * Set to `true` in tests that exercise the generic failure retry path.
 * Automatically resets to `false` after the first 500 is returned.
 *
 * TODO(mock-only): remove when real backend + JWT claim decode ship
 */
export let mockProfilePatch500Once = false;

/**
 * Enables the 500-error fixture for exactly one PATCH call.
 *
 * TODO(mock-only): remove when real backend + JWT claim decode ship
 */
export function enableProfilePatch500Once(): void {
  mockProfilePatch500Once = true;
}

// ── Handlers ───────────────────────────────────────────────────────────────────

/**
 * PATCH `/profile/me` — mock-only handler.
 *
 * Fixtures:
 * - (i)  Success (200): echoes the request body back as the response.
 * - (ii) 409 username collision: triggered by setting `mockProfilePatch409Once = true`
 *        (auto-resets after one call).
 * - (iii) 500 generic failure: triggered by setting `mockProfilePatch500Once = true`
 *         (auto-resets after one call).
 *
 * TODO(mock-only): remove when real backend + JWT claim decode ship
 */
// TODO(mock-only): remove when real backend + JWT claim decode ship
const patchProfileMeHandler = http.patch(
  '*/profile/me',
  async ({ request }) => {
    // 409 fixture — username collision.
    if (mockProfilePatch409Once) {
      mockProfilePatch409Once = false;
      return HttpResponse.json(
        { error: 'USERNAME_TAKEN', message: 'Username is already taken.' },
        { status: 409 },
      );
    }

    // 500 fixture — generic server error.
    if (mockProfilePatch500Once) {
      mockProfilePatch500Once = false;
      return HttpResponse.json(
        { error: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' },
        { status: 500 },
      );
    }

    // Default: 200 success — echo the request body.
    const body = await request.json().catch(() => ({}));
    return HttpResponse.json(body, { status: 200 });
  },
);

/**
 * All MSW handlers registered for mock mode.
 */
export const handlers = [patchProfileMeHandler] as const;

/**
 * MSW server instance for React Native.
 *
 * Started in `App.tsx` only when `EXPO_PUBLIC_API_MODE === 'mock'`.
 * Test files that need MSW can also call `worker.listen()` in `beforeAll`.
 */
export const worker = setupServer(...handlers);
