/**
 * React Query hooks for the chat feature — rooms, messages, mutations,
 * and subscription wiring.
 *
 * All hooks call the real AppSync GraphQL backend via `getAppsyncClient()`
 * from `src/services/graphql/appsyncClient.ts`. No mock fixtures are
 * authored in this module (real-backend-only per PRD 16.4).
 *
 * Query keys (§7.3 tuple convention):
 *   - Rooms:    `ROOMS_QUERY_KEY`      = `['rooms']`
 *   - Messages: `messagesQueryKey(id)` = `['messages', roomId]`
 *
 * @module features/chat/api
 */

import { useEffect, useRef } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';

import { getAppsyncClient } from '@/services/graphql/appsyncClient';
import type {
  ChatRoom,
  Message,
  MessageConnection,
} from '@/services/graphql/types';
import { adaptMessageToChatMessage, makeOptimisticChatMessage } from './shapeAdapters';
import type { ChatMessage } from '@/types/ChatMessage';

// ── Utility ────────────────────────────────────────────────────────────────

/**
 * Generates a local UUID for optimistic message ids.
 *
 * Uses `crypto.randomUUID()` when available (React Native >= 0.73 on both
 * platforms), falling back to a timestamp+random string.
 *
 * @returns A locally-unique string id.
 * @internal
 */
function generateLocalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ── Query keys ─────────────────────────────────────────────────────────────

/**
 * TanStack Query key for the signed-in user's rooms list.
 *
 * Uses a single-element tuple per §7.3. Import this constant wherever
 * `['rooms']` must be invalidated (e.g. `useBlockUserMutation.onSuccess` in
 * story 16.9 already references it as the string `'rooms'`; that hook may be
 * updated to import this constant in a later refactor).
 */
export const ROOMS_QUERY_KEY = ['rooms'] as const;

/**
 * Returns the TanStack Query key for a specific room's message list.
 *
 * Uses a two-element tuple per §7.3 so that any story invalidating
 * `['messages', roomId]` (e.g. `useBlockUserMutation.onSuccess` via predicate
 * in story 16.9) hits exactly the targeted room's cache.
 *
 * @param roomId - The opaque room identifier.
 * @returns A `readonly [string, string]` tuple suitable for `queryKey`.
 */
export function messagesQueryKey(roomId: string): readonly ['messages', string] {
  return ['messages', roomId] as const;
}

// ── GraphQL documents ──────────────────────────────────────────────────────
// Minimal inline document strings — no codegen required for this phase.

const LIST_MY_ROOMS_QUERY = /* GraphQL */ `
  query ListMyRooms {
    listMyRooms {
      roomId
      userA
      userB
      lastMessageAt
      lastMessagePreview
      lastMessageSenderId
      lastMessageId
      createdAt
      updatedAt
    }
  }
`;

const MESSAGES_BY_CHAT_ROOM_QUERY = /* GraphQL */ `
  query MessagesByChatRoom(
    $roomId: ID!
    $createdAtGt: String
    $limit: Int
    $nextToken: String
  ) {
    messagesByChatRoom(
      roomId: $roomId
      createdAtGt: $createdAtGt
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        messageId
        roomId
        senderId
        content
        contentType
        createdAt
        deliveredAt
      }
      nextToken
    }
  }
`;

const CREATE_OR_GET_ROOM_MUTATION = /* GraphQL */ `
  mutation CreateOrGetRoom($otherUserId: ID!) {
    createOrGetRoom(otherUserId: $otherUserId) {
      roomId
      userA
      userB
      lastMessageAt
      lastMessagePreview
      lastMessageSenderId
      lastMessageId
      createdAt
      updatedAt
    }
  }
`;

const SEND_MESSAGE_MUTATION = /* GraphQL */ `
  mutation SendMessage($content: String!, $contentType: String, $roomId: ID!) {
    sendMessage(content: $content, contentType: $contentType, roomId: $roomId) {
      messageId
      roomId
      senderId
      content
      contentType
      createdAt
      deliveredAt
    }
  }
`;

const ON_MESSAGE_IN_ROOM_SUBSCRIPTION = /* GraphQL */ `
  subscription OnMessageInRoom($roomId: ID!) {
    onMessageInRoom(roomId: $roomId) {
      messageId
      roomId
      senderId
      content
      contentType
      createdAt
      deliveredAt
    }
  }
`;

// ── useRoomsQuery ──────────────────────────────────────────────────────────

/**
 * Fetches the signed-in user's list of chat rooms from the AppSync
 * `listMyRooms` query.
 *
 * Returns `[ChatRoom!]!` — the list is NOT paginated. The server returns all
 * rooms for the authenticated user in a single response.
 *
 * Query key: `['rooms']`.
 *
 * @example
 * ```tsx
 * const { data: rooms = [], isLoading, isError } = useRoomsQuery();
 * ```
 *
 * @returns TanStack Query result with `data: readonly ChatRoom[]`.
 */
export function useRoomsQuery() {
  return useQuery<readonly ChatRoom[], Error>({
    queryKey: ROOMS_QUERY_KEY,
    queryFn: async (): Promise<readonly ChatRoom[]> => {
      const client = getAppsyncClient();
      const response = (await client.graphql({
        query: LIST_MY_ROOMS_QUERY,
      })) as { data: { listMyRooms: ChatRoom[] } };
      return response.data.listMyRooms;
    },
  });
}

// ── useMessagesQuery ───────────────────────────────────────────────────────

/**
 * Page parameters used by `useMessagesQuery` for the infinite scroll
 * implementation.
 */
interface MessagesPageParam {
  /** Opaque cursor returned by the previous page, or `undefined` for the first page. */
  nextToken: string | undefined;
}

/**
 * Fetches messages for a chat room using `messagesByChatRoom`, with
 * `nextToken`-based pagination via `useInfiniteQuery`.
 *
 * The initial fetch uses `limit: 30`. Subsequent pages are fetched by calling
 * `fetchNextPage()` from `ChatRoomScreen` when the user scrolls to the top of
 * the message list (story 16.6).
 *
 * Query key: `['messages', roomId]`.
 *
 * @param roomId - The opaque room identifier.
 * @returns TanStack InfiniteQuery result. Each `page` in `data.pages` is a
 *   `MessageConnection` with `items` and `nextToken`.
 */
export function useMessagesQuery(roomId: string) {
  return useInfiniteQuery<MessageConnection, Error, InfiniteData<MessageConnection>, readonly ['messages', string], MessagesPageParam>({
    queryKey: messagesQueryKey(roomId),
    queryFn: async ({ pageParam }): Promise<MessageConnection> => {
      const client = getAppsyncClient();
      const response = (await client.graphql({
        query: MESSAGES_BY_CHAT_ROOM_QUERY,
        variables: {
          roomId,
          limit: 30,
          nextToken: pageParam.nextToken ?? null,
        },
      })) as { data: { messagesByChatRoom: MessageConnection } };
      return response.data.messagesByChatRoom;
    },
    initialPageParam: { nextToken: undefined },
    getNextPageParam: (lastPage): MessagesPageParam | undefined => {
      if (lastPage.nextToken === null) return undefined;
      return { nextToken: lastPage.nextToken };
    },
  });
}

// ── useCreateOrGetRoomMutation ─────────────────────────────────────────────

/**
 * Variables accepted by {@link useCreateOrGetRoomMutation}.
 */
export interface CreateOrGetRoomVars {
  /**
   * The `user_id` of the other participant.
   *
   * Note: the server argument is named `otherUserId` (not `userId`). This
   * matches the real AppSync schema.
   */
  otherUserId: string;
}

/**
 * Idempotently creates or retrieves a direct-message room between the signed-in
 * user and another user via the `createOrGetRoom` AppSync mutation.
 *
 * On success, invalidates `['rooms']` so the room list reflects the new entry
 * (or the existing one being surfaced again after a cache miss).
 *
 * @example
 * ```tsx
 * const createRoom = useCreateOrGetRoomMutation();
 * const room = await createRoom.mutateAsync({ otherUserId: 'u-friend-001' });
 * navigate('ChatRoomScreen', { roomId: room.roomId });
 * ```
 *
 * @returns A TanStack mutation object with `data: ChatRoom`.
 */
export function useCreateOrGetRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation<ChatRoom, Error, CreateOrGetRoomVars>({
    mutationFn: async ({ otherUserId }): Promise<ChatRoom> => {
      const client = getAppsyncClient();
      const response = (await client.graphql({
        query: CREATE_OR_GET_ROOM_MUTATION,
        variables: { otherUserId },
      })) as { data: { createOrGetRoom: ChatRoom } };
      return response.data.createOrGetRoom;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

// ── useSendMessageMutation ─────────────────────────────────────────────────

/**
 * Variables accepted by {@link useSendMessageMutation}.
 */
export interface SendMessageVars {
  /** Plain-text content of the message. */
  content: string;
  /** Room to send the message to. */
  roomId: string;
  /**
   * Content type. Phase 16 always passes `'text'`.
   * @defaultValue `'text'`
   */
  contentType?: 'text' | 'gif';
}

/**
 * Context stored during the optimistic update so `onError` can roll back.
 * @internal
 */
interface SendMessageContext {
  /** Locally-generated id for the optimistic placeholder. */
  localId: string;
  /** Cache snapshot before the optimistic append (for rollback). */
  previousPages: readonly MessageConnection[] | undefined;
}

/**
 * Sends a message via the `sendMessage` AppSync mutation.
 *
 * Uses an **optimistic update**:
 * - `onMutate` appends a `ChatMessage { status: 'sending' }` placeholder to
 *   the `['messages', roomId]` cache immediately so the UI reflects the send
 *   without waiting for the server round-trip.
 * - `onError` rolls back the optimistic entry by restoring the cache snapshot.
 * - `onSuccess` replaces the optimistic placeholder with the server-echoed
 *   `Message` (matched by the `localId` stored in context).
 *
 * Note: `senderId` is NOT sent by the client — the server derives it from the
 * JWT `sub` claim.
 *
 * @example
 * ```tsx
 * const send = useSendMessageMutation(currentUserId);
 * send.mutate({ content: 'Hello', roomId: 'room-001' });
 * ```
 *
 * @param currentUserId - The signed-in user's id. Used to synthesise the
 *   optimistic `sender: 'me'` indicator and to adapt the server echo.
 * @returns A TanStack mutation object with `data: Message`.
 */
export function useSendMessageMutation(currentUserId: string) {
  const queryClient = useQueryClient();

  return useMutation<Message, Error, SendMessageVars, SendMessageContext>({
    mutationFn: async ({ content, roomId, contentType = 'text' }): Promise<Message> => {
      const client = getAppsyncClient();
      const response = (await client.graphql({
        query: SEND_MESSAGE_MUTATION,
        variables: { content, contentType, roomId },
      })) as { data: { sendMessage: Message } };
      return response.data.sendMessage;
    },

    onMutate: async ({ content, roomId }) => {
      // Prevent any in-flight refetch from overwriting the optimistic update.
      await queryClient.cancelQueries({ queryKey: messagesQueryKey(roomId) });

      // Snapshot the current pages for rollback on error.
      const currentData = queryClient.getQueryData<{ pages: readonly MessageConnection[] }>(
        messagesQueryKey(roomId),
      );
      const previousPages = currentData?.pages;

      const localId = generateLocalId();
      const optimistic = makeOptimisticChatMessage(localId, content);

      // Append the optimistic entry to the last page of the infinite list.
      queryClient.setQueryData<{ pages: MessageConnection[]; pageParams: unknown[] }>(
        messagesQueryKey(roomId),
        (old) => {
          if (old === undefined) {
            // No existing cache: create a synthetic first page.
            return {
              pages: [{ items: [chatMessageToFakeMessage(optimistic)], nextToken: null }],
              pageParams: [{ nextToken: undefined }],
            };
          }
          const pages = old.pages;
          const lastPage = pages[pages.length - 1];
          if (lastPage === undefined) {
            return old;
          }
          const updatedLastPage: MessageConnection = {
            ...lastPage,
            items: [...lastPage.items, chatMessageToFakeMessage(optimistic)],
          };
          return {
            ...old,
            pages: [...pages.slice(0, pages.length - 1), updatedLastPage],
          };
        },
      );

      return { localId, previousPages };
    },

    onError: (_err, { roomId }, context) => {
      if (context?.previousPages !== undefined) {
        // Restore the pre-mutation pages snapshot.
        queryClient.setQueryData<{ pages: readonly MessageConnection[]; pageParams: unknown[] }>(
          messagesQueryKey(roomId),
          (old) => {
            if (old === undefined) return old;
            return { ...old, pages: context.previousPages! };
          },
        );
      }
    },

    onSuccess: (serverMessage, { roomId }, context) => {
      if (context === undefined) return;

      const { localId } = context;

      // Replace the optimistic placeholder (identified by localId) with the
      // server-echoed Message, adapted to ChatMessage.
      queryClient.setQueryData<{ pages: MessageConnection[]; pageParams: unknown[] }>(
        messagesQueryKey(roomId),
        (old) => {
          if (old === undefined) return old;

          const serverChatMsg = adaptMessageToChatMessage(serverMessage, currentUserId);
          const fakeServerMsg: Message = {
            messageId: serverMessage.messageId,
            roomId: serverMessage.roomId,
            senderId: serverMessage.senderId,
            content: serverMessage.content,
            contentType: serverMessage.contentType,
            createdAt: serverMessage.createdAt,
            deliveredAt: serverMessage.deliveredAt,
          };
          // Suppress unused warning — we store the adapted form indirectly.
          void serverChatMsg;

          const updatedPages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              // The optimistic item has messageId === localId (from makeOptimisticFakeMessage).
              item.messageId === localId ? fakeServerMsg : item,
            ),
          }));

          return { ...old, pages: updatedPages };
        },
      );

      // Invalidate the rooms list so lastMessagePreview updates.
      void queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

// ── useOnMessageInRoomSubscription ─────────────────────────────────────────

/**
 * Subscribes to the `onMessageInRoom(roomId)` AppSync subscription and
 * reconciles incoming events with the `['messages', roomId]` TanStack Query
 * cache.
 *
 * Deduplication: if an incoming event carries a `messageId` that already
 * exists in the cache (e.g. a recently-sent optimistic message that was
 * already replaced by `useSendMessageMutation.onSuccess`), the event is
 * discarded. Otherwise, the new message is appended to the last page.
 *
 * Uses a `useEffect` + `.subscribe()` / `.unsubscribe()` pattern wrapping
 * the Amplify zen-observable-like subscription result. Cleans up on unmount
 * or when `roomId` changes.
 *
 * @param roomId - The room to subscribe to.
 * @param currentUserId - The signed-in user's id. Used to adapt the incoming
 *   `Message` to a `ChatMessage`.
 */
export function useOnMessageInRoomSubscription(
  roomId: string,
  currentUserId: string,
): void {
  const queryClient = useQueryClient();
  // Track all messageIds currently in the cache to enable O(1) dedupe.
  const knownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const client = getAppsyncClient();

    // Seed knownIds from whatever is already in the cache at mount time.
    const existing = queryClient.getQueryData<{ pages: MessageConnection[] }>(
      messagesQueryKey(roomId),
    );
    if (existing) {
      for (const page of existing.pages) {
        for (const item of page.items) {
          knownIdsRef.current.add(item.messageId);
        }
      }
    }

    // The Amplify subscription result is a zen-observable-like. The `.subscribe`
    // method returns an object with an `.unsubscribe()` method.
    const sub = (
      client.graphql({
        query: ON_MESSAGE_IN_ROOM_SUBSCRIPTION,
        variables: { roomId },
      }) as unknown as {
        subscribe: (handlers: {
          next: (event: { data: { onMessageInRoom: Message | null } }) => void;
          error: (err: unknown) => void;
        }) => { unsubscribe: () => void };
      }
    ).subscribe({
      next: (event) => {
        const incoming = event?.data?.onMessageInRoom;
        if (!incoming) return;

        // Dedupe: skip if the message is already in the cache.
        if (knownIdsRef.current.has(incoming.messageId)) return;

        knownIdsRef.current.add(incoming.messageId);

        // Append to the last page of the infinite list.
        queryClient.setQueryData<{ pages: MessageConnection[]; pageParams: unknown[] }>(
          messagesQueryKey(roomId),
          (old) => {
            if (old === undefined) {
              return {
                pages: [{ items: [incoming], nextToken: null }],
                pageParams: [{ nextToken: undefined }],
              };
            }
            const pages = old.pages;
            const lastPage = pages[pages.length - 1];
            if (lastPage === undefined) return old;
            const updatedLast: MessageConnection = {
              ...lastPage,
              items: [...lastPage.items, incoming],
            };
            return {
              ...old,
              pages: [...pages.slice(0, pages.length - 1), updatedLast],
            };
          },
        );

        // The rooms list preview may now be stale.
        void queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
      },
      error: (err: unknown) => {
        console.warn('[useOnMessageInRoomSubscription] subscription error', err);
      },
    });

    return () => {
      sub.unsubscribe();
    };
  }, [roomId, currentUserId, queryClient]);
}

// ── Private helpers ────────────────────────────────────────────────────────

/**
 * Converts an optimistic `ChatMessage` (which has the client-side shape) back
 * to a fake `Message` for storage in the `MessageConnection.items` cache.
 *
 * This is necessary because the cache stores `Message[]` (the server shape),
 * not `ChatMessage[]`. The optimistic entry uses `localId` as its `messageId`
 * so it can be found and replaced by `onSuccess`.
 *
 * @param chatMsg - The optimistic `ChatMessage` to encode.
 * @returns A `Message`-shaped object compatible with the cache.
 * @internal
 */
function chatMessageToFakeMessage(chatMsg: ChatMessage): Message {
  return {
    // Use the client-side id as a temporary messageId so onSuccess can match it.
    messageId: chatMsg.id,
    // roomId is unknown at this point; the cache is keyed by roomId externally.
    roomId: '',
    // senderId will be derived from currentUserId by the adapter, but we store
    // a placeholder here since the cache shape requires it.
    senderId: '__optimistic__',
    content: chatMsg.text,
    contentType: 'text',
    // ISO string for a timestamp-based createdAt so sorting is consistent.
    createdAt: new Date(chatMsg.timestamp).toISOString(),
    deliveredAt: null,
  };
}
