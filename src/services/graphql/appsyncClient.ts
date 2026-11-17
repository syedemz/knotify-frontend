/**
 * AppSync GraphQL client.
 *
 * Exposes a configured Amplify GraphQL client (`generateClient()` from
 * `aws-amplify/api`). Authorization is handled automatically by Amplify v6
 * using the active Cognito session — no manual header injection is needed
 * when `defaultAuthMode: 'userPool'` is set in the Amplify config.
 *
 * The client is created lazily via `getAppsyncClient()` and cached as a
 * module-level singleton. Consumers should call `getAppsyncClient()` on every
 * use; the internal guard ensures `generateClient()` is only called once.
 *
 * Authentication flow (Amplify v6 + COGNITO_USER_POOLS):
 *   1. `ensureAmplifyConfigured()` configures Amplify with `defaultAuthMode: 'userPool'`.
 *   2. Amplify reads the JWT from the active Cognito session automatically on
 *      each GraphQL operation — no Bearer prefix is added by the client code.
 *
 * Architecture note (§7.5 / §8.1): this file lives at
 * `src/services/graphql/appsyncClient.ts` and must NOT be moved.
 *
 * @module services/graphql/appsyncClient
 */

import { generateClient } from 'aws-amplify/api';

import { ensureAmplifyConfigured } from '@/services/amplify/amplifyConfig';

// ── Types ─────────────────────────────────────────────────────────────────

/**
 * Structural interface for the Amplify GraphQL v6 client.
 *
 * We use a structural interface rather than `ReturnType<typeof generateClient>`
 * or the `Client` import because those types trigger an "excessive stack depth"
 * tsc error caused by the recursive `Prettify<DeepReadOnlyObject<...>>` chain
 * in `@aws-amplify/api-graphql` v6. The `graphql` method is the only surface
 * downstream code uses; additional methods can be added when needed.
 *
 * The runtime object is still the real Amplify client — this interface is
 * used only for type annotations at the boundary.
 */
export interface AppsyncClientInstance {
  graphql(options: Record<string, unknown>): Promise<unknown>;
}

// ── Singleton ─────────────────────────────────────────────────────────────

// Stored as `unknown` internally to avoid the excessive-stack-depth tsc error
// that occurs when the `V6Client` recursive type is used as a variable type.
// Cast to `AppsyncClientInstance` on return.
let _client: unknown = null;

/**
 * Returns the lazily-created, configured Amplify GraphQL client.
 *
 * Calls `ensureAmplifyConfigured()` on every invocation (idempotent) to
 * guarantee Amplify is configured before the client is used, even if the
 * caller somehow obtains the client before the app bootstrap path runs.
 *
 * @returns The Amplify GraphQL client configured for `userPool` auth mode.
 * @throws {Error} If Amplify cannot be configured (e.g., placeholder env
 *   values). The error originates in `ensureAmplifyConfigured()`.
 */
export function getAppsyncClient(): AppsyncClientInstance {
  ensureAmplifyConfigured();
  if (_client === null) {
    // Cast away the deep V6Client recursive type to avoid tsc stack overflow.
    _client = generateClient() as unknown as AppsyncClientInstance;
  }
  return _client as AppsyncClientInstance;
}

/**
 * Resets the cached client singleton.
 *
 * **For use in tests only.** Calling this in production code is an error.
 *
 * @internal
 */
export function _resetAppsyncClientForTests(): void {
  _client = null;
}
