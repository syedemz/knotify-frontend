/**
 * `useFriendRequestPreflight` — client-side pre-flight guard for
 * `useSendFriendRequestMutation`.
 *
 * Reads the TanStack caches for `['friends']` and
 * `['friend-requests','outgoing']` and reports whether the caller is allowed
 * to send a friend request to the given target.
 *
 * **Not a replacement for backend validation.** The backend 409 responses
 * (`already_friends`, `reverse_pending`, `already_pending`) remain the
 * source of truth — this hook only improves UX by preventing the
 * `SendRequestModal` from opening in cases where we already know the
 * request would be rejected.
 *
 * Cache freshness is maintained by the focus-driven refetch set up in
 * `fix/unfriend-notify-and-refetch` (PR #162) plus mutation-side
 * invalidations: `['friends']` and `['friend-requests','outgoing']` are
 * both invalidated on the relevant mutations.
 *
 * **Fail-open:** if either cache is `undefined` (first load, user logged in
 * but data not yet fetched), the preflight returns `{ canSend: true }` so
 * the user is not spuriously blocked. The backend will still reject if
 * the data turns out to be stale.
 *
 * @module features/friendRequests/useFriendRequestPreflight
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { FRIENDS_QUERY_KEY } from '@/features/friends/api';
import { OUTGOING_REQUESTS_QUERY_KEY } from '@/features/friendRequests/api';
import type { Friend } from '@/types/api/Friend';
import type { FriendRequest } from '@/types/api/FriendRequest';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Reason a pre-flight check blocks a send attempt.
 *
 * - `'already_friends'`: the target is already in the caller's friends list.
 * - `'already_sent'`: the caller has a pending outgoing request to the target.
 */
export type PreflightBlockReason = 'already_friends' | 'already_sent';

/**
 * Result of a pre-flight check.
 *
 * - `{ canSend: true }`: no reason to block; caller may open the send
 *   confirmation modal.
 * - `{ canSend: false, reason }`: caller should show a user-facing alert
 *   for the given reason instead of opening the modal.
 */
export type PreflightResult =
  | { canSend: true }
  | { canSend: false; reason: PreflightBlockReason };

/**
 * Signature of the function returned by {@link useFriendRequestPreflight}.
 */
export type PreflightCheck = (targetUserId: string) => PreflightResult;

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns a pure function that inspects the TanStack cache for `['friends']`
 * and `['friend-requests','outgoing']` and decides whether a new friend
 * request to `targetUserId` should be allowed.
 *
 * The returned function is stable across renders when the underlying
 * `queryClient` is stable (which it is for the lifetime of the app). Callers
 * may use it directly in `onPress` handlers without depending on cache
 * contents in their useCallback deps.
 *
 * @example
 * ```tsx
 * const preflight = useFriendRequestPreflight();
 *
 * const handleLike = useCallback(() => {
 *   const target = deck[currentIndex];
 *   if (!target) return;
 *   const result = preflight(target.user_id);
 *   if (!result.canSend) {
 *     Alert.alert(
 *       t(`friendRequests.preflight.${result.reason}.title`),
 *       t(`friendRequests.preflight.${result.reason}.message`)
 *         .replace('{name}', `${target.first_name} ${target.last_name}`),
 *     );
 *     return;
 *   }
 *   setRequestModalVisible(true);
 * }, [deck, currentIndex, preflight]);
 * ```
 */
export function useFriendRequestPreflight(): PreflightCheck {
  const queryClient = useQueryClient();

  return useCallback(
    (targetUserId: string): PreflightResult => {
      if (targetUserId === '') return { canSend: true };

      const friends = queryClient.getQueryData<readonly Friend[]>(FRIENDS_QUERY_KEY);
      if (friends !== undefined && friends.some((f) => f.user_id === targetUserId)) {
        return { canSend: false, reason: 'already_friends' };
      }

      const outgoing = queryClient.getQueryData<readonly FriendRequest[]>(
        OUTGOING_REQUESTS_QUERY_KEY,
      );
      if (
        outgoing !== undefined &&
        outgoing.some(
          (r) => r.to_user_id === targetUserId && r.status === 'pending',
        )
      ) {
        return { canSend: false, reason: 'already_sent' };
      }

      return { canSend: true };
    },
    [queryClient],
  );
}
