/**
 * MSW v2 request handlers for offline / mock development.
 *
 * This file initializes MSW with an **empty** handler array. Endpoint-specific
 * handlers are added by later phases as each feature is built.
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

import { setupServer } from 'msw/native';

/**
 * Empty baseline handler array.
 *
 * Phases that add mock endpoints append to this array via `worker.use(...)`.
 * Keeping it empty here enforces that endpoint handlers belong to their
 * respective feature phases, not to the foundation layer.
 */
export const handlers: [] = [];

/**
 * MSW server instance for React Native.
 *
 * Started in `App.tsx` only when `EXPO_PUBLIC_API_MODE === 'mock'`.
 * Test files that need MSW can also call `worker.listen()` in `beforeAll`.
 */
export const worker = setupServer(...handlers);
