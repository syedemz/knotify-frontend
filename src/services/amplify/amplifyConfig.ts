/**
 * Shared Amplify configuration module.
 *
 * This module owns the single `Amplify.configure(...)` call for the entire
 * application. Both the Cognito Auth block and the AppSync GraphQL block are
 * configured here in one shot so that Amplify's internal state is consistent —
 * configuring Auth and API separately risks the second call overwriting the
 * first.
 *
 * Usage: call `ensureAmplifyConfigured()` at the top of any function that
 * needs Amplify (Auth or GraphQL). The call is idempotent — subsequent
 * invocations are no-ops.
 *
 * @module services/amplify/amplifyConfig
 */

import { Amplify } from 'aws-amplify';

import { env } from '@/config/env';

// ── Singleton guard ───────────────────────────────────────────────────────

let _configured = false;

/**
 * Configures Amplify with both Auth (Cognito) and API (AppSync GraphQL) blocks
 * on the first call. Subsequent calls are no-ops (idempotent singleton).
 *
 * Skipped in mock-auth mode — when `env.isMockAuth` is `true` the Cognito
 * user pool id is a dummy sentinel and no real network calls are made, so
 * configuring Amplify would point it at a non-existent pool.
 *
 * @throws {Error} If `env.appsyncUrl` or `env.appsyncRealtimeUrl` is a
 *   `<FILL_...>` placeholder. `env.ts` already guards most placeholders at
 *   import time; this guard is a belt-and-suspenders check for the two
 *   AppSync fields in case the caller somehow bypasses `env.ts` validation.
 */
export function ensureAmplifyConfigured(): void {
  if (env.isMockAuth) return;
  if (_configured) return;

  // Belt-and-suspenders: env.ts already throws at import time if these are
  // placeholders, but guard here too for safety in test environments where
  // env may be partially mocked.
  if (env.appsyncUrl.startsWith('<FILL_')) {
    throw new Error(
      '[amplifyConfig] appsync.graphqlUrl is not configured. ' +
        'Fill "appsync.graphqlUrl" in backendConfig.<env>.json.',
    );
  }
  if (env.appsyncRealtimeUrl.startsWith('<FILL_')) {
    throw new Error(
      '[amplifyConfig] appsync.realtimeUrl is not configured. ' +
        'Fill "appsync.realtimeUrl" in backendConfig.<env>.json.',
    );
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: env.cognitoUserPoolId,
        userPoolClientId: env.cognitoAppClientId,
      },
    },
    API: {
      GraphQL: {
        endpoint: env.appsyncUrl,
        region: env.cognitoRegion,
        defaultAuthMode: 'userPool',
      },
    },
  });

  _configured = true;
}

/**
 * Resets the configuration singleton.
 *
 * **For use in tests only.** Calling this in production code is an error.
 * Tests that need to verify configure-time behaviour should call this in
 * `beforeEach` / `afterEach` to prevent cross-test contamination.
 *
 * @internal
 */
export function _resetAmplifyConfiguredForTests(): void {
  _configured = false;
}
