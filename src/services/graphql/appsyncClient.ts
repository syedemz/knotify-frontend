/**
 * AppSync GraphQL client skeleton.
 *
 * This file is a placeholder that compiles and exports `getAppsyncClient()`
 * so that the chat phase (phase 17) has an import target to configure.
 *
 * The actual Amplify AppSync configuration, subscription lifecycle, and
 * operation definitions live in the chat phase. Until then this module
 * returns `null` and documents the expected shape.
 *
 * Architecture note (§17): The AppSync authorization header carries the raw
 * JWT with no "Bearer" prefix, per `backend-config → appsync.auth.notes`.
 * That header injection belongs in the chat phase's Amplify configure call,
 * not here.
 *
 * @module services/graphql/appsyncClient
 */

/**
 * Minimal type alias for the lazily-created AppSync client stub.
 *
 * TODO(phase-17): Replace `null` with the real Amplify GraphQL client type
 * once `aws-amplify` is configured for AppSync in the chat phase.
 */
export type AppsyncClientInstance = null;

/**
 * Returns a lazily-created AppSync client instance.
 *
 * TODO(phase-17): Implement real Amplify AppSync configuration here:
 *  - Call `Amplify.configure({ API: { GraphQL: { endpoint, region, ... } } })`
 *    using `env.appsyncUrl`.
 *  - Set Authorization header to raw JWT (no Bearer prefix) per §3.2.
 *  - Return the configured Amplify GraphQL client.
 *
 * @returns `null` — placeholder until the chat phase configures AppSync.
 */
export function getAppsyncClient(): AppsyncClientInstance {
  return null;
}
