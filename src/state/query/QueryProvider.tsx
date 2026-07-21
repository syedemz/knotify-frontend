/**
 * TanStack Query client provider.
 *
 * Mounts a `QueryClient` with the project-wide default options from §7.3:
 * - `staleTime`: 5 minutes — matches the Cognito access-token TTL window; data
 *   older than 5 min is considered stale and refetched in the background.
 * - `retry`: 2 — two automatic retries on network failure before surfacing an
 *   error state. Mutations default to no retry (`retry: 0`) per TanStack
 *   Query convention.
 * - `gcTime` (formerly `cacheTime`): 10 minutes — cached data is kept in
 *   memory for 10 min after all subscribers unmount before being garbage-
 *   collected.
 *
 * The `QueryClient` instance is stable across re-renders (created once via
 * `useState`). It is exposed via `useQueryClient()` from `@tanstack/react-query`
 * — no additional export is provided here.
 *
 * @module state/query/QueryProvider
 */

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Default options (§7.3) ─────────────────────────────────────────────────

/** Stale time in milliseconds: 5 minutes. */
const STALE_TIME_MS = 5 * 60 * 1000;

/** Number of query retries on failure. */
const RETRY_COUNT = 2;

/** Garbage-collection time in milliseconds: 10 minutes. */
const GC_TIME_MS = 10 * 60 * 1000;

// ── Factory ────────────────────────────────────────────────────────────────

/**
 * Creates a `QueryClient` with the project-wide defaults from §7.3.
 *
 * Exported for unit tests that need an isolated client instance.
 *
 * @returns A configured {@link QueryClient}.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: RETRY_COUNT,
        gcTime: GC_TIME_MS,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

// ── Provider ───────────────────────────────────────────────────────────────

interface QueryProviderProps {
  /** React subtree that can call TanStack Query hooks. */
  readonly children?: React.ReactNode;
  /**
   * Override the `QueryClient` for testing.
   * When provided, the provider uses this client instead of creating its own.
   *
   * @internal
   */
  readonly clientOverride?: QueryClient;
}

/**
 * Mounts a `QueryClient` with the project-wide defaults and exposes it to
 * the component subtree via `QueryClientProvider`.
 *
 * The client is created once via `useState` and is stable across re-renders.
 *
 * @param props - {@link QueryProviderProps}
 */
export function QueryProvider({
  children,
  clientOverride,
}: QueryProviderProps): React.JSX.Element {
  const [client] = useState<QueryClient>(
    () => clientOverride ?? createQueryClient(),
  );

  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
