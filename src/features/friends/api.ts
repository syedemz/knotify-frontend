/**
 * React Query hooks for the friends feature.
 *
 * Wraps the `friendsApi` REST helpers from
 * `src/services/api/endpoints.ts` per architecture §8.2 (REST conventions)
 * and §7.3 (query-key tuple convention).
 *
 * @module features/friends/api
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
 * Fetches the signed-in user's friends list from `GET /friends`.
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

/**
 * Variables accepted by {@link useUnfriendMutation}.
 */
export interface UnfriendVars {
  /** `user_id` of the counterpart to unfriend. */
  userId: string;
}

/**
 * Removes the friendship with the given user via `DELETE /friends/{userId}`.
 *
 * Backend contract (see `knotify-backend/.../friends/handler.py`
 * `_handle_delete_friend`):
 * - Deletes the `friendships` row from Aurora.
 * - Flips `friendship_active=false` on the shared `ChatRooms` DynamoDB row.
 * - Does NOT delete the chat room record or messages — history is preserved
 *   and the room survives in both users' `listMyRooms` with
 *   `friendshipActive: false`. The client then renders the room as
 *   read-only with `UnfriendedBanner` in place of the composer.
 *
 * `onSuccess` cache invalidations:
 * - `['friends']` — ex-friend removed from the friends list.
 * - `['rooms']` — rooms list refetched so `friendshipActive` propagates to
 *   both this room's banner and any future opens.
 * - `['profile', userId]` — the counterpart's profile query may surface the
 *   "friend / not-friend" state at other callsites (OtherProfileScreen).
 * - `['deck']` — the ex-friend may re-enter discovery and should re-populate
 *   on the next deck fetch.
 *
 * Note: `['messages', *]` is NOT invalidated. Message history is preserved
 * server-side and the local cache remains valid — the only change is that
 * `sendMessage` from either side will now return `RoomReadOnly`.
 *
 * @example
 * ```tsx
 * const unfriend = useUnfriendMutation();
 * unfriend.mutate({ userId: 'u-former-friend-001' });
 * ```
 */
export function useUnfriendMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, UnfriendVars>({
    mutationFn: ({ userId }) => friendsApi.unfriend(userId),
    onSuccess: (_data, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['rooms'] });
      void queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      void queryClient.invalidateQueries({ queryKey: ['deck'] });
    },
  });
}
