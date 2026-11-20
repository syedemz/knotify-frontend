/**
 * React Query hooks for the friend-requests feature — GET + mutation hooks +
 * AppSync subscription hook.
 *
 * Wraps the `friendRequestsApi` REST helpers from
 * `src/services/api/endpoints.ts` per architecture §8.2 (REST conventions)
 * and §7.3 (query-key tuple convention).
 *
 * Query hooks: `useIncomingRequestsQuery`, `useOutgoingRequestsQuery`.
 * Mutation hooks (story 16.FR2): `useSendFriendRequestMutation`,
 * `useAcceptFriendRequestMutation`, `useDeclineFriendRequestMutation`,
 * `useCancelOutgoingRequestMutation`.
 * Subscription hook (story 16.8): `useOnFriendRequestUpdatedSubscription`.
 *
 * @module features/friendRequests/api
 */

import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAppsyncClient } from '@/services/graphql/appsyncClient';
import type { Notification } from '@/services/graphql/types';

import { friendRequestsApi } from '@/services/api/endpoints';
import { ApiError } from '@/services/api/errors';
import { FRIENDS_QUERY_KEY } from '@/features/friends/api';
import { useOwnProfile } from '@/state/ownProfile/OwnProfileProvider';
import { t } from '@/labels';
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

// TEMP DEBUG — remove after diagnosing empty requests tab
function tempLogIncoming(data: readonly FriendRequest[] | undefined, err: unknown) {
  if (err) {
    const e = err as { name?: string; message?: string; status?: number; code?: string };
    // eslint-disable-next-line no-console
    console.warn('[TEMP] listIncoming ERROR:', JSON.stringify({ name: e?.name, message: e?.message, status: e?.status, code: e?.code }));
  } else if (data !== undefined) {
    // eslint-disable-next-line no-console
    console.warn('[TEMP] listIncoming SUCCESS, count=', data.length, 'rows=', JSON.stringify(data));
  }
}

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
  // Backend `_handle_get_friend_requests` currently ignores the
  // `direction=incoming` query param and returns BOTH incoming + outgoing
  // pending requests (knotify-backend TODO friend-request-correctness FR-1).
  // Until the backend honours the contract, drop any row where
  // `from_user_id === currentUserId` so the user never sees their own
  // outgoing requests rendered as incoming. Safe to leave in place after
  // the backend fix — becomes a no-op.
  const { profile: ownProfile } = useOwnProfile();
  const currentUserId = ownProfile?.user_id ?? '';
  const result = useQuery<readonly FriendRequest[], Error, readonly FriendRequest[]>({
    queryKey: INCOMING_REQUESTS_QUERY_KEY,
    queryFn: () => friendRequestsApi.listIncoming(),
    select: (data) => {
      if (currentUserId === '') return data;
      return data.filter((r) => r.from_user_id !== currentUserId);
    },
  });
  // TEMP DEBUG — remove after diagnosing empty requests tab
  useEffect(() => {
    tempLogIncoming(result.data, result.error);
  }, [result.data, result.error]);
  return result;
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

// ── Mutation hooks ────────────────────────────────────────────────────────────

/**
 * Variables accepted by {@link useSendFriendRequestMutation}.
 */
export interface SendFriendRequestVars {
  /** `user_id` of the target recipient. */
  toUserId: string;
}

/**
 * Context stored during the optimistic update so onError can roll back and
 * onSuccess can swap the optimistic row for the server-returned row.
 */
interface SendFriendRequestOptimisticContext {
  /** Snapshot of the outgoing list before the optimistic insert. */
  readonly previous: readonly FriendRequest[] | undefined;
  /** Synthetic request_id for the optimistic row; used to match on swap/rollback. */
  readonly optimisticRequestId: string;
}

/**
 * Sends a friend request to another user via `POST /friend-requests`.
 *
 * Uses an optimistic cache update so a subsequent preflight check — which
 * reads the `['friend-requests', 'outgoing']` cache — immediately sees a
 * pending outbound row for `toUserId` and blocks a second send attempt.
 * Without this, the preflight fail-opens whenever the outgoing query has
 * never been fetched (no observer, invalidation is a no-op), which
 * previously let the user re-send to the same target and only discover
 * the backend's 409 as a silent snackbar.
 *
 * - `onMutate`: cancels in-flight refetches, snapshots the outgoing cache,
 *   and inserts a synthetic `FriendRequest` with status `'pending'` and
 *   `to_user_id === toUserId` so preflight can see it.
 * - `onSuccess`: swaps the optimistic row for the server-returned row
 *   (matched by `optimisticRequestId`), then invalidates
 *   `['friend-requests', 'outgoing']` so any active observer reconciles
 *   with the server.
 * - `onError`: restores the snapshot. On an `ApiError` with status 409
 *   (`already_pending` / `reverse_pending`), surfaces a user-visible
 *   `Alert` using the same copy the preflight hook uses, so a race (two
 *   taps before the optimistic insert lands, or a replay from another
 *   device) still produces a clean user-facing message instead of a
 *   silent failure.
 */
export function useSendFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation<FriendRequest, Error, SendFriendRequestVars, SendFriendRequestOptimisticContext>({
    mutationFn: ({ toUserId }) => {
      // eslint-disable-next-line no-console
      console.warn('[TEMP] sendFriendRequest FIRING, toUserId=', toUserId);
      return friendRequestsApi.send(toUserId);
    },
    onMutate: async ({ toUserId }) => {
      await queryClient.cancelQueries({ queryKey: OUTGOING_REQUESTS_QUERY_KEY });

      const previous = queryClient.getQueryData<readonly FriendRequest[]>(
        OUTGOING_REQUESTS_QUERY_KEY,
      );

      // Synthetic request_id — prefixed so it cannot collide with a real
      // backend UUID/ULID and so the swap in onSuccess is unambiguous.
      const optimisticRequestId = `local-optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const optimisticRow: FriendRequest = {
        request_id: optimisticRequestId,
        // from_user_id is only used by the incoming-list filter; for an
        // outgoing row the preflight reads to_user_id + status. Leave blank
        // to make the local-only nature obvious if it ever shows up in a UI.
        from_user_id: '',
        to_user_id: toUserId,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      // If no cache entry exists yet (no observer has mounted
      // useOutgoingRequestsQuery this session), seed it with just the
      // optimistic row so preflight can read it on the next tap. This is
      // the cache-undefined case that previously caused the duplicate-send
      // bug — preflight fail-opens on undefined and a repeat tap went
      // through to the backend.
      queryClient.setQueryData<readonly FriendRequest[]>(
        OUTGOING_REQUESTS_QUERY_KEY,
        previous === undefined ? [optimisticRow] : [...previous, optimisticRow],
      );

      return { previous, optimisticRequestId };
    },
    onSuccess: (serverRow, _vars, context) => {
      // eslint-disable-next-line no-console
      console.warn('[TEMP] sendFriendRequest SUCCESS', JSON.stringify(serverRow));

      if (context !== undefined) {
        queryClient.setQueryData<readonly FriendRequest[]>(
          OUTGOING_REQUESTS_QUERY_KEY,
          (current) => {
            if (current === undefined) return [serverRow];
            // Swap by the synthetic optimistic id; if (for some reason) the
            // optimistic row is no longer present, append the server row
            // rather than silently dropping it.
            const withoutOptimistic = current.filter(
              (r) => r.request_id !== context.optimisticRequestId,
            );
            return [...withoutOptimistic, serverRow];
          },
        );
      }

      void queryClient.invalidateQueries({ queryKey: OUTGOING_REQUESTS_QUERY_KEY });
    },
    onError: (err, _vars, context) => {
      const e = err as unknown as { name?: string; message?: string; status?: number; code?: string; body?: unknown };
      // eslint-disable-next-line no-console
      console.warn('[TEMP] sendFriendRequest ERROR:', JSON.stringify({
        name: e?.name,
        message: e?.message,
        status: e?.status,
        code: e?.code,
        body: e?.body,
      }, null, 2));

      // Roll back the optimistic insert so preflight does not permanently
      // see a pending row that never made it to the server.
      if (context !== undefined) {
        queryClient.setQueryData<readonly FriendRequest[] | undefined>(
          OUTGOING_REQUESTS_QUERY_KEY,
          context.previous,
        );
      }

      // Surface a friendly alert for the known dedupe conflicts so the user
      // learns why the send failed instead of just seeing the generic
      // "likeSent" snackbar from the caller. The backend returns a plain
      // body `{"error": "already_pending"}` or `{"error": "reverse_pending"}`;
      // `normalizeErrorResponse` lifts that into `ApiError.message`.
      if (err instanceof ApiError && err.status === 409) {
        const body = err.message;
        if (body === 'already_pending') {
          Alert.alert(
            t('friendRequests.preflight.already_sent.title'),
            // No target name is known at this layer; the hook's job is only
            // to signal "already sent". The caller can override onError
            // with a name-enriched alert if it wants a more specific copy.
            t('friendRequests.preflight.already_sent.message').replace('{name}', 'this user'),
          );
        } else if (body === 'reverse_pending') {
          Alert.alert(
            t('friendRequests.preflight.already_received.title'),
            t('friendRequests.preflight.already_received.message').replace('{name}', 'this user'),
          );
        }
      }
    },
  });
}

/**
 * Variables accepted by {@link useAcceptFriendRequestMutation} and
 * {@link useDeclineFriendRequestMutation}.
 */
export interface IncomingRequestActionVars {
  /** The `request_id` of the incoming request to act on. */
  requestId: string;
}

/**
 * Context stored during the optimistic update so `onError` can roll back.
 */
interface IncomingOptimisticContext {
  /** Snapshot of the incoming list before the optimistic removal. */
  previous: readonly FriendRequest[] | undefined;
}

/**
 * Accepts an incoming friend request via `POST /friend-requests/{id}/accept`.
 *
 * Uses an **optimistic update** so the modal dismisses instantly:
 * - `onMutate` snapshots `['friend-requests', 'incoming']`, removes the
 *   targeted row from the cache immediately, and returns the snapshot as
 *   context.
 * - `onError` restores the snapshot if the server call fails (rollback).
 * - `onSettled` invalidates `['friend-requests', 'incoming']` to reconcile
 *   the final server state.
 *
 * On success, also invalidates `['friends']` so the friend appears in the
 * friends list immediately.
 */
export function useAcceptFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation<FriendRequest, Error, IncomingRequestActionVars, IncomingOptimisticContext>({
    mutationFn: ({ requestId }) => friendRequestsApi.accept(requestId),
    onMutate: async ({ requestId }) => {
      // Cancel any in-flight refetches that could overwrite the optimistic update.
      await queryClient.cancelQueries({ queryKey: INCOMING_REQUESTS_QUERY_KEY });

      const previous = queryClient.getQueryData<readonly FriendRequest[]>(
        INCOMING_REQUESTS_QUERY_KEY,
      );

      // Optimistically remove the accepted request from the incoming list.
      if (previous !== undefined) {
        queryClient.setQueryData<readonly FriendRequest[]>(
          INCOMING_REQUESTS_QUERY_KEY,
          previous.filter((r) => r.request_id !== requestId),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Restore the pre-mutation cache snapshot on failure.
      if (context?.previous !== undefined) {
        queryClient.setQueryData<readonly FriendRequest[]>(
          INCOMING_REQUESTS_QUERY_KEY,
          context.previous,
        );
      }
    },
    onSuccess: () => {
      // Incoming count has dropped; a new friend row now exists.
      void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
    },
    onSettled: () => {
      // Reconcile with the server regardless of success or failure.
      void queryClient.invalidateQueries({ queryKey: INCOMING_REQUESTS_QUERY_KEY });
    },
  });
}

/**
 * Declines an incoming friend request via `POST /friend-requests/{id}/decline`.
 *
 * Uses an **optimistic update** identical to {@link useAcceptFriendRequestMutation}
 * so the modal dismisses instantly. Only invalidates
 * `['friend-requests', 'incoming']` on success (no friends-list side-effect).
 */
export function useDeclineFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation<FriendRequest, Error, IncomingRequestActionVars, IncomingOptimisticContext>({
    mutationFn: ({ requestId }) => friendRequestsApi.decline(requestId),
    onMutate: async ({ requestId }) => {
      await queryClient.cancelQueries({ queryKey: INCOMING_REQUESTS_QUERY_KEY });

      const previous = queryClient.getQueryData<readonly FriendRequest[]>(
        INCOMING_REQUESTS_QUERY_KEY,
      );

      if (previous !== undefined) {
        queryClient.setQueryData<readonly FriendRequest[]>(
          INCOMING_REQUESTS_QUERY_KEY,
          previous.filter((r) => r.request_id !== requestId),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData<readonly FriendRequest[]>(
          INCOMING_REQUESTS_QUERY_KEY,
          context.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: INCOMING_REQUESTS_QUERY_KEY });
    },
  });
}

/**
 * Variables accepted by {@link useCancelOutgoingRequestMutation}.
 */
export interface CancelOutgoingRequestVars {
  /** The `request_id` of the outgoing request to cancel. */
  requestId: string;
}

/**
 * Cancels an outgoing friend request via `DELETE /friend-requests/{id}`.
 *
 * On success, invalidates `['friend-requests', 'outgoing']` so the outgoing
 * list no longer shows the cancelled row.
 *
 * There is no UI callsite for this mutation in phase 16 — the hook is shipped
 * green with tests so a future phase can add the cancel affordance without
 * touching this layer.
 */
export function useCancelOutgoingRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation<FriendRequest, Error, CancelOutgoingRequestVars>({
    mutationFn: ({ requestId }) => friendRequestsApi.cancel(requestId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: OUTGOING_REQUESTS_QUERY_KEY });
    },
  });
}

// ── Subscription hook ─────────────────────────────────────────────────────────

const ON_FRIEND_REQUEST_UPDATED_SUBSCRIPTION = /* GraphQL */ `
  subscription OnFriendRequestUpdated {
    onFriendRequestUpdated {
      type
      payload
      createdAt
    }
  }
`;

const ON_NOTIFICATION_FOR_ME_SUBSCRIPTION = /* GraphQL */ `
  subscription OnNotificationForMe {
    onNotificationForMe {
      type
      payload
      createdAt
    }
  }
`;

/**
 * Subscribes to the identity-scoped `onFriendRequestUpdated: Notification`
 * AppSync subscription and delivers incoming events to the provided callback.
 *
 * Uses the same `useEffect` + `.subscribe()` / `.unsubscribe()` callback-ref
 * pattern as the chat subscription hooks (story 16.4 / 16.CH2). The callback
 * ref avoids subscription teardown when only the callback identity changes.
 *
 * The subscription is established only while the hook is mounted. The caller
 * (`FriendRequestSubscriptionListener`) is responsible for conditionally
 * mounting the hook (i.e. only when `useAuth().status === 'authenticated'`).
 *
 * An optional `remountKey` parameter (default `0`) lets the caller force a
 * re-subscribe — e.g. on `AppState` resume after the ~10-minute AppSync idle
 * window.
 *
 * @param onEvent - Callback invoked for each inbound `Notification`.
 * @param remountKey - Bump to force subscription teardown + re-establish.
 */
export function useOnFriendRequestUpdatedSubscription(
  onEvent: (notification: Notification) => void,
  remountKey: number = 0,
): void {
  // Stable ref to the latest callback so we avoid subscription teardown when
  // only the callback identity changes (matches the onEventRef pattern used by
  // useOnTypingInRoomSubscription in story 16.CH2).
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const client = getAppsyncClient();

    const sub = (
      client.graphql({
        query: ON_FRIEND_REQUEST_UPDATED_SUBSCRIPTION,
      }) as unknown as {
        subscribe: (handlers: {
          next: (event: { data: { onFriendRequestUpdated: Notification | null } }) => void;
          error: (err: unknown) => void;
        }) => { unsubscribe: () => void };
      }
    ).subscribe({
      next: (event) => {
        const notification = event?.data?.onFriendRequestUpdated;
        if (!notification) return;
        onEventRef.current(notification);
      },
      error: (err: unknown) => {
        console.warn('[useOnFriendRequestUpdatedSubscription] subscription error', err);
      },
    });

    return () => {
      sub.unsubscribe();
    };
  }, [remountKey]);
}

/**
 * Subscribes to the identity-scoped `onNotificationForMe: Notification` AppSync
 * subscription — the generic notification channel used by non-accepted event
 * types (`friend_request_received`, `bookmark`, `match`, etc.).
 *
 * Mirrors {@link useOnFriendRequestUpdatedSubscription} in structure. The two
 * subscriptions are independent AppSync channels — a client that cares about
 * `friend_request_received` subscribes to both for defense in depth, because
 * the backend dual-publishes that type to both channels (publisher story:
 * `fix/notifications-publisher-layer-and-dual-publish`). Latest-wins modal
 * semantics in the host ensure a double delivery is a visual no-op.
 *
 * @param onEvent - Callback invoked for each inbound `Notification`.
 * @param remountKey - Bump to force subscription teardown + re-establish.
 */
export function useOnNotificationForMeSubscription(
  onEvent: (notification: Notification) => void,
  remountKey: number = 0,
): void {
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const client = getAppsyncClient();

    const sub = (
      client.graphql({
        query: ON_NOTIFICATION_FOR_ME_SUBSCRIPTION,
      }) as unknown as {
        subscribe: (handlers: {
          next: (event: { data: { onNotificationForMe: Notification | null } }) => void;
          error: (err: unknown) => void;
        }) => { unsubscribe: () => void };
      }
    ).subscribe({
      next: (event) => {
        const notification = event?.data?.onNotificationForMe;
        if (!notification) return;
        onEventRef.current(notification);
      },
      error: (err: unknown) => {
        console.warn('[useOnNotificationForMeSubscription] subscription error', err);
      },
    });

    return () => {
      sub.unsubscribe();
    };
  }, [remountKey]);
}
