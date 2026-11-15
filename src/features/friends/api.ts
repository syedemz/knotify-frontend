/**
 * React Query hooks for the friends feature.
 *
 * Wraps the `friendsApi` REST helpers from
 * `src/services/api/endpoints.ts` per architecture §8.2 (REST conventions)
 * and §7.3 (query-key tuple convention).
 *
 * @module features/friends/api
 */

import { useQuery } from '@tanstack/react-query';

import { friendsApi } from '@/services/api/endpoints';
import type { Friend } from '@/types/api/Friend';

// ── Query keys ────────────────────────────────────────────────────────────────

/**
 * TanStack Query key for the signed-in user's friends list.
 *
 * Uses a single-element tuple per §7.3 so that any story that invalidates
 * `['friends']` (e.g. `useAcceptFriendRequestMutation.onSuccess` in story
 * 16.FR2) hits exactly this cache entry.
 */
export const FRIENDS_QUERY_KEY = ['friends'] as const;

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Fetches the signed-in user's accepted friends list from `GET /friends`.
 *
 * Returns the counterpart's full user profile for each friendship. The
 * backend canonicalises the `user_a`/`user_b` column ordering server-side —
 * callers always see the **other** person's profile, never the raw DB row.
 *
 * Uses the project-wide default stale / retry / gcTime settings from
 * `QueryProvider` (§7.3: staleTime 5 min, 2 retries, gcTime 10 min).
 *
 * Query key: `['friends']`.
 *
 * @example
 * ```tsx
 * const { data: friends = [], isLoading, isError } = useFriendsQuery();
 * ```
 *
 * @returns TanStack Query result with `data: readonly Friend[]`, `isLoading`,
 *   `isError`, `error`, and `refetch` surfaced to the caller.
 */
export function useFriendsQuery() {
  return useQuery<readonly Friend[], Error>({
    queryKey: FRIENDS_QUERY_KEY,
    queryFn: () => friendsApi.list(),
  });
}
