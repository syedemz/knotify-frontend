/**
 * React Query hooks for the friend-requests feature — GET side.
 *
 * Wraps the `friendRequestsApi` REST helpers from
 * `src/services/api/endpoints.ts` per architecture §8.2 (REST conventions)
 * and §7.3 (query-key tuple convention).
 *
 * Mutation hooks (POST /friend-requests, POST …/{id}/accept, etc.) are added
 * in story 16.FR2.
 *
 * @module features/friendRequests/api
 */

import { useQuery } from '@tanstack/react-query';

import { friendRequestsApi } from '@/services/api/endpoints';
import type { FriendRequest } from '@/types/api/FriendRequest';

// ── Query keys ────────────────────────────────────────────────────────────────

/**
 * TanStack Query key for the signed-in user's incoming friend requests.
 *
 * Uses a two-element tuple per §7.3 so that any story invalidating
 * `['friend-requests', 'incoming']` (e.g.
 * `useAcceptFriendRequestMutation.onSuccess` in story 16.FR2) hits exactly
 * this cache entry without touching the outgoing list.
 */
export const INCOMING_REQUESTS_QUERY_KEY = ['friend-requests', 'incoming'] as const;

/**
 * TanStack Query key for the signed-in user's outgoing friend requests.
 *
 * Uses a two-element tuple per §7.3 so that any story invalidating
 * `['friend-requests', 'outgoing']` (e.g.
 * `useSendFriendRequestMutation.onSuccess` in story 16.FR2) hits exactly
 * this cache entry without touching the incoming list.
 */
export const OUTGOING_REQUESTS_QUERY_KEY = ['friend-requests', 'outgoing'] as const;

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Fetches the signed-in user's pending incoming friend requests from
 * `GET /friend-requests?direction=incoming`.
 *
 * Returns the raw DB row for each request so that the host can call the
 * accept / decline mutations with the correct `request_id` (story 16.FR2).
 *
 * Uses the project-wide default stale / retry / gcTime settings from
 * `QueryProvider` (§7.3: staleTime 5 min, 2 retries, gcTime 10 min).
 *
 * Query key: `['friend-requests', 'incoming']`.
 *
 * @example
 * ```tsx
 * const { data: incoming = [], isLoading, isError } = useIncomingRequestsQuery();
 * ```
 *
 * @returns TanStack Query result with `data: readonly FriendRequest[]`,
 *   `isLoading`, `isError`, `error`, and `refetch` surfaced to the caller.
 */
export function useIncomingRequestsQuery() {
  return useQuery<readonly FriendRequest[], Error>({
    queryKey: INCOMING_REQUESTS_QUERY_KEY,
    queryFn: () => friendRequestsApi.listIncoming(),
  });
}

/**
 * Fetches the signed-in user's pending outgoing friend requests from
 * `GET /friend-requests?direction=outgoing`.
 *
 * Returns the raw DB row for each request so that the host can call
 * `useCancelOutgoingRequestMutation` with the correct `request_id`
 * (story 16.FR2).
 *
 * Uses the project-wide default stale / retry / gcTime settings from
 * `QueryProvider` (§7.3: staleTime 5 min, 2 retries, gcTime 10 min).
 *
 * Query key: `['friend-requests', 'outgoing']`.
 *
 * @example
 * ```tsx
 * const { data: outgoing = [], isLoading, isError } = useOutgoingRequestsQuery();
 * ```
 *
 * @returns TanStack Query result with `data: readonly FriendRequest[]`,
 *   `isLoading`, `isError`, `error`, and `refetch` surfaced to the caller.
 */
export function useOutgoingRequestsQuery() {
  return useQuery<readonly FriendRequest[], Error>({
    queryKey: OUTGOING_REQUESTS_QUERY_KEY,
    queryFn: () => friendRequestsApi.listOutgoing(),
  });
}
