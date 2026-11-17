/**
 * React Query hooks for the blocks feature — GET + mutation hooks.
 *
 * Wraps the `blocksApi` REST helpers from
 * `src/services/api/endpoints.ts` per architecture §8.2 (REST conventions)
 * and §7.3 (query-key tuple convention).
 *
 * Query hooks: `useBlockedUsersQuery`.
 * Mutation hooks: `useBlockUserMutation`, `useUnblockUserMutation`.
 *
 * Cross-cache purge on block (story 16.9 AC 3):
 *   `useBlockUserMutation.onSuccess` invalidates ALL of:
 *   - `['deck']`           — owned by src/features/landing/api
 *   - `['search']`         — owned by src/features/discover/api
 *   - `['bookmarks']`      — owned by src/features/bookmarks/api
 *   - `['friends']`        — imported from src/features/friends/api
 *   - `['friend-requests','incoming']` — imported from src/features/friendRequests/api
 *   - `['friend-requests','outgoing']` — imported from src/features/friendRequests/api
 *   - `['rooms']`          — owned by src/features/chat/api
 *   - `['messages', *]`    — any message cache for ANY room (predicate match)
 *
 * Narrow purge on unblock (story 16.9 AC 4):
 *   `useUnblockUserMutation.onSuccess` invalidates `['blocked-users']` only.
 *   Unblock does NOT re-populate discovery caches.
 *
 * @module features/blocks/api
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { blocksApi } from '@/services/api/endpoints';
import type { BlockedUser } from '@/services/api/endpoints';
import { FRIENDS_QUERY_KEY } from '@/features/friends/api';
import {
  INCOMING_REQUESTS_QUERY_KEY,
  OUTGOING_REQUESTS_QUERY_KEY,
} from '@/features/friendRequests/api';

// ── Query keys ────────────────────────────────────────────────────────────────

/**
 * TanStack Query key for the signed-in user's blocked-users list.
 *
 * Uses a single-element tuple per §7.3. Export this constant so callsites
 * (e.g. `BlockedUsersScreen` in story 16.10) can reference it without
 * hardcoding the string literal.
 */
export const BLOCKED_USERS_QUERY_KEY = ['blocked-users'] as const;

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Fetches the signed-in user's blocked-users list from `GET /blocks`.
 *
 * Uses the project-wide default stale / retry / gcTime settings from
 * `QueryProvider` (§7.3: staleTime 5 min, 2 retries, gcTime 10 min).
 *
 * Query key: `['blocked-users']`.
 *
 * @example
 * ```tsx
 * const { data: blocked = [], isLoading, isError } = useBlockedUsersQuery();
 * ```
 *
 * @returns TanStack Query result with `data: readonly BlockedUser[]`,
 *   `isLoading`, `isError`, `error`, and `refetch` surfaced to the caller.
 */
export function useBlockedUsersQuery() {
  return useQuery<readonly BlockedUser[], Error>({
    queryKey: BLOCKED_USERS_QUERY_KEY,
    queryFn: () => blocksApi.list(),
  });
}

/**
 * Variables accepted by {@link useBlockUserMutation}.
 */
export interface BlockUserVars {
  /** `user_id` of the user to block. */
  userId: string;
}

/**
 * Blocks a user via `POST /blocks`.
 *
 * On success, performs a **broad cross-cache purge** so the blocked user
 * disappears from every surface that could display them:
 *
 * - `['deck']` — owned by src/features/landing/api
 * - `['search']` — owned by src/features/discover/api
 * - `['bookmarks']` — owned by src/features/bookmarks/api
 * - `['friends']` — imported from src/features/friends/api
 * - `['friend-requests','incoming']` — imported from src/features/friendRequests/api
 * - `['friend-requests','outgoing']` — imported from src/features/friendRequests/api
 * - `['rooms']` — owned by src/features/chat/api
 * - `['messages', *]` — every message cache for every room (predicate match so
 *   we don't need to know which roomIds exist in the cache)
 *
 * @example
 * ```tsx
 * const block = useBlockUserMutation();
 * block.mutate({ userId: 'u-offender-001' });
 * ```
 */
export function useBlockUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<BlockedUser, Error, BlockUserVars>({
    mutationFn: ({ userId }) => blocksApi.block(userId),
    onSuccess: () => {
      // Invalidate the blocked-users list so the new entry appears.
      void queryClient.invalidateQueries({ queryKey: BLOCKED_USERS_QUERY_KEY });

      // Discovery surfaces — the blocked user must not appear in deck, search,
      // or bookmarks after the block.
      void queryClient.invalidateQueries({ queryKey: ['deck'] }); // owned by src/features/landing/api
      void queryClient.invalidateQueries({ queryKey: ['search'] }); // owned by src/features/discover/api
      void queryClient.invalidateQueries({ queryKey: ['bookmarks'] }); // owned by src/features/bookmarks/api

      // Social graph — blocked user is no longer a friend or requestor.
      void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: INCOMING_REQUESTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: OUTGOING_REQUESTS_QUERY_KEY });

      // Chat — the blocked user's rooms and messages must not remain surfaced.
      void queryClient.invalidateQueries({ queryKey: ['rooms'] }); // owned by src/features/chat/api

      // Invalidate ALL ['messages', roomId] tuples without knowing the roomIds.
      // A predicate match covers every ['messages', *] key in the cache.
      void queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key.length >= 2 && key[0] === 'messages';
        },
      });
    },
  });
}

/**
 * Variables accepted by {@link useUnblockUserMutation}.
 */
export interface UnblockUserVars {
  /** `user_id` of the user to unblock. */
  userId: string;
}

/**
 * Unblocks a user via `DELETE /blocks/{userId}`.
 *
 * On success, invalidates `['blocked-users']` only. Unblock does NOT
 * re-populate discovery caches (deck, search, bookmarks, friends) — the user
 * must navigate back to those surfaces naturally for the content to reload.
 * This matches the §11.2.8 unblock spec and story 16.9 AC 4.
 *
 * @example
 * ```tsx
 * const unblock = useUnblockUserMutation();
 * unblock.mutate({ userId: 'u-formerly-blocked-001' });
 * ```
 */
export function useUnblockUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<BlockedUser, Error, UnblockUserVars>({
    mutationFn: ({ userId }) => blocksApi.unblock(userId),
    onSuccess: () => {
      // Narrow purge: only the blocked-users list needs updating.
      // Discovery caches are NOT re-populated on unblock.
      void queryClient.invalidateQueries({ queryKey: BLOCKED_USERS_QUERY_KEY });
    },
  });
}
