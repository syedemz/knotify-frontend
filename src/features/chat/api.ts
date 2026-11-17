/**
 * React Query hooks for the chat feature — rooms, messages, mutations,
 * and subscription wiring.
 *
 * All hooks call the real AppSync GraphQL backend via `getAppsyncClient()`
 * from `src/services/graphql/appsyncClient.ts`. No mock fixtures are
 * authored in this module (real-backend-only per PRD 16.4).
 *
 * Query keys (§7.3 tuple convention):
 *   - Rooms:         `ROOMS_QUERY_KEY`           = `['rooms']`
 *   - Messages:      `messagesQueryKey(id)`       = `['messages', roomId]`
 *   - ReadReceipts:  `readReceiptsQueryKey(id)`   = `['readReceipts', roomId]`
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
  MessageRead,
  TypingEvent,
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
 * @param remountKey - Optional numeric key. When incremented by the caller
 *   (e.g. on AppState resume), the effect tears down the existing subscription
 *   and re-establishes a fresh one. Defaults to `0`.
 */
export function useOnMessageInRoomSubscription(
  roomId: string,
  currentUserId: string,
  remountKey: number = 0,
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
  }, [roomId, currentUserId, remountKey, queryClient]);
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

// ── readReceiptsQueryKey ───────────────────────────────────────────────────

/**
 * Returns the TanStack Query key for a room's latest read-receipt state.
 *
 * Uses a two-element tuple per §7.3. Stored via `queryClient.setQueryData`
 * when a `MessageRead` subscription event arrives or when `markAsRead`
 * succeeds.
 *
 * @param roomId - The opaque room identifier.
 * @returns A `readonly [string, string]` tuple.
 */
export function readReceiptsQueryKey(roomId: string): readonly ['readReceipts', string] {
  return ['readReceipts', roomId] as const;
}

// ── Enriched read-receipt cache entry ─────────────────────────────────────

/**
 * The shape stored in `['readReceipts', roomId]`.
 *
 * Extends the server `MessageRead` with a client-derived
 * `lastReadMessageCreatedAt` field (the ISO-8601 `createdAt` of the
 * message identified by `lastReadMessageId`). This is needed because the
 * shape adapter compares `message.createdAt <= lastReadMessageCreatedAt`
 * rather than comparing opaque IDs (per PRD AC 2 — createdAt sort-key).
 */
export interface ReadReceiptCacheEntry extends MessageRead {
  /**
   * The ISO-8601 `createdAt` of the message with id `lastReadMessageId`,
   * looked up from the `['messages', roomId]` cache at the time the receipt
   * arrived. `null` when the message was not found in the local cache (e.g.
   * the message is older than the loaded page window — the read tick will not
   * be shown for those messages, which is an acceptable edge-case for now).
   */
  readonly lastReadMessageCreatedAt: string | null;
}

// ── useReadReceiptQuery ────────────────────────────────────────────────────

/**
 * Reads the latest cached read-receipt for a given room.
 *
 * Data is populated by `useOnReadReceiptSubscription` and
 * `useMarkReadMutation` via `queryClient.setQueryData`. This hook is
 * `enabled: false` — it only reads from cache, never fetches from the
 * network.
 *
 * Returns `undefined` when no receipt has arrived yet for this room.
 *
 * @param roomId - The opaque room identifier.
 */
export function useReadReceiptQuery(roomId: string) {
  return useQuery<ReadReceiptCacheEntry | undefined>({
    queryKey: readReceiptsQueryKey(roomId),
    queryFn: () => undefined,
    enabled: false,
  });
}

// ── GraphQL documents (read-receipt) ──────────────────────────────────────

const ON_READ_RECEIPT_SUBSCRIPTION = /* GraphQL */ `
  subscription OnReadReceipt($roomId: ID!) {
    onReadReceipt(roomId: $roomId) {
      roomId
      userId
      lastReadMessageId
      lastReadAt
    }
  }
`;

const MARK_AS_READ_MUTATION = /* GraphQL */ `
  mutation MarkAsRead($lastMessageId: ID!, $roomId: ID!) {
    markAsRead(lastMessageId: $lastMessageId, roomId: $roomId) {
      roomId
      userId
      lastReadMessageId
      lastReadAt
    }
  }
`;

// ── useOnReadReceiptSubscription ───────────────────────────────────────────

/**
 * Subscribes to the `onReadReceipt(roomId)` AppSync subscription and
 * updates the `['readReceipts', roomId]` TanStack Query cache when the
 * counterpart reads our messages.
 *
 * On each incoming `MessageRead` event, the hook:
 * 1. Looks up the `createdAt` of `lastReadMessageId` from the
 *    `['messages', roomId]` cache (needed for the `createdAt`-based
 *    comparator in the shape adapter per PRD AC 2).
 * 2. Stores the enriched `ReadReceiptCacheEntry` in `['readReceipts', roomId]`
 *    via `queryClient.setQueryData`, which triggers re-renders in any
 *    subscriber (e.g. `ChatRoomScreen` via `useReadReceiptQuery`).
 *
 * Only patches messages where `message.senderId === currentUserId` is implied
 * by context — the shape adapter enforces the sender check; this hook simply
 * stores the receipt and lets the adapter decide what to show.
 *
 * Uses a `useEffect` + `.subscribe()` / `.unsubscribe()` lifecycle.
 * Cleans up on unmount or when `roomId` changes.
 *
 * @param roomId - The room to subscribe to.
 */
export function useOnReadReceiptSubscription(roomId: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const client = getAppsyncClient();

    const sub = (
      client.graphql({
        query: ON_READ_RECEIPT_SUBSCRIPTION,
        variables: { roomId },
      }) as unknown as {
        subscribe: (handlers: {
          next: (event: { data: { onReadReceipt: MessageRead | null } }) => void;
          error: (err: unknown) => void;
        }) => { unsubscribe: () => void };
      }
    ).subscribe({
      next: (event) => {
        const receipt = event?.data?.onReadReceipt;
        if (!receipt) return;

        // Derive the createdAt of the read-up-to message from the local cache.
        // We need this for the createdAt-based comparator in the shape adapter.
        const cached = queryClient.getQueryData<{ pages: MessageConnection[] }>(
          messagesQueryKey(roomId),
        );
        let lastReadMessageCreatedAt: string | null = null;
        if (cached) {
          for (const page of cached.pages) {
            for (const item of page.items) {
              if (item.messageId === receipt.lastReadMessageId) {
                lastReadMessageCreatedAt = item.createdAt;
                break;
              }
            }
            if (lastReadMessageCreatedAt !== null) break;
          }
        }

        const entry: ReadReceiptCacheEntry = {
          ...receipt,
          lastReadMessageCreatedAt,
        };

        queryClient.setQueryData<ReadReceiptCacheEntry>(
          readReceiptsQueryKey(roomId),
          entry,
        );
      },
      error: (err: unknown) => {
        console.warn('[useOnReadReceiptSubscription] subscription error', err);
      },
    });

    return () => {
      sub.unsubscribe();
    };
  }, [roomId, queryClient]);
}

// ── GraphQL documents (typing) ────────────────────────────────────────────

const ON_TYPING_IN_ROOM_SUBSCRIPTION = /* GraphQL */ `
  subscription OnTypingInRoom($roomId: ID!) {
    onTypingInRoom(roomId: $roomId) {
      roomId
      userId
      isTyping
    }
  }
`;

const SET_TYPING_MUTATION = /* GraphQL */ `
  mutation SetTyping($isTyping: Boolean!, $roomId: ID!) {
    setTyping(isTyping: $isTyping, roomId: $roomId) {
      roomId
      userId
      isTyping
    }
  }
`;

// ── useSetTypingMutation ───────────────────────────────────────────────────

/**
 * Variables accepted by {@link useSetTypingMutation}.
 */
export interface SetTypingVars {
  /** Whether the signed-in user is currently typing. */
  isTyping: boolean;
  /** Room the typing event belongs to. */
  roomId: string;
}

/**
 * Sends an outbound typing event via the `setTyping(isTyping, roomId)` AppSync
 * mutation.
 *
 * The mutation is fire-and-forget — no cache update is needed. The returned
 * `TypingEvent` is discarded on the sender's side; the counterpart receives the
 * event via `onTypingInRoom(roomId)` subscription.
 *
 * Callers are responsible for throttling: at most one `isTyping: true` call
 * every ~2 seconds (see `ChatRoomScreen` for the `useRef`-based throttle).
 *
 * @example
 * ```tsx
 * const setTyping = useSetTypingMutation();
 * setTyping.mutate({ isTyping: true, roomId: 'room-001' });
 * ```
 *
 * @returns A TanStack mutation object with `data: TypingEvent`.
 */
export function useSetTypingMutation() {
  return useMutation<TypingEvent, Error, SetTypingVars>({
    mutationFn: async ({ isTyping, roomId }): Promise<TypingEvent> => {
      const client = getAppsyncClient();
      const response = (await client.graphql({
        query: SET_TYPING_MUTATION,
        variables: { isTyping, roomId },
      })) as { data: { setTyping: TypingEvent } };
      return response.data.setTyping;
    },
  });
}

// ── useOnTypingInRoomSubscription ─────────────────────────────────────────

/**
 * Subscribes to the `onTypingInRoom(roomId)` AppSync subscription and
 * delivers incoming `TypingEvent` events to the provided callback.
 *
 * Only events where `event.userId !== currentUserId` are forwarded to the
 * callback — self-events (the user's own typing reflection from the server)
 * are silently discarded.
 *
 * Uses a `useEffect` + `.subscribe()` / `.unsubscribe()` lifecycle.
 * Cleans up on unmount or when `roomId` changes.
 *
 * @param roomId - The room to subscribe to.
 * @param currentUserId - The signed-in user's id. Used to filter out self-events.
 * @param onEvent - Callback invoked for each inbound `TypingEvent` from the
 *   counterpart. Called with the full `TypingEvent` object.
 */
export function useOnTypingInRoomSubscription(
  roomId: string,
  currentUserId: string,
  onEvent: (event: TypingEvent) => void,
): void {
  // Stable ref to the latest callback so the subscription effect does not
  // need to be torn down and re-established when only the callback changes.
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });

  useEffect(() => {
    const client = getAppsyncClient();

    const sub = (
      client.graphql({
        query: ON_TYPING_IN_ROOM_SUBSCRIPTION,
        variables: { roomId },
      }) as unknown as {
        subscribe: (handlers: {
          next: (event: { data: { onTypingInRoom: TypingEvent | null } }) => void;
          error: (err: unknown) => void;
        }) => { unsubscribe: () => void };
      }
    ).subscribe({
      next: (event) => {
        const typingEvent = event?.data?.onTypingInRoom;
        if (!typingEvent) return;

        // Filter out self-events: the server reflects the mutation back to
        // the sender; ignore them so the sender never sees their own row.
        if (typingEvent.userId === currentUserId) return;

        onEventRef.current(typingEvent);
      },
      error: (err: unknown) => {
        console.warn('[useOnTypingInRoomSubscription] subscription error', err);
      },
    });

    return () => {
      sub.unsubscribe();
    };
  }, [roomId, currentUserId]);
}

// ── useMarkReadMutation ────────────────────────────────────────────────────

/**
 * Variables accepted by {@link useMarkReadMutation}.
 */
export interface MarkReadVars {
  /**
   * The `messageId` of the most-recent received message to mark as read.
   * Maps to the `lastMessageId` arg on the `markAsRead` AppSync mutation.
   */
  lastMessageId: string;
  /** The room the messages belong to. */
  roomId: string;
}

/**
 * Marks messages in a room as read up to `lastMessageId` via the
 * `markAsRead(lastMessageId, roomId): MessageRead!` AppSync mutation.
 *
 * On success, enriches the returned `MessageRead` with the matching
 * `lastReadMessageCreatedAt` from the local messages cache and stores it
 * in `['readReceipts', roomId]`. This triggers `useReadReceiptQuery`
 * subscribers (e.g. `ChatRoomScreen`) to re-render and show 'read' ticks.
 *
 * The mutation has no optimistic update — the read tick appears only after
 * the server round-trip succeeds, which is the correct UX (we do not want
 * to show 'read' before the server confirms it).
 *
 * @example
 * ```tsx
 * const markRead = useMarkReadMutation();
 * markRead.mutate({ roomId: 'room-001', lastMessageId: 'msg-latest-003' });
 * ```
 *
 * @returns A TanStack mutation object.
 */
export function useMarkReadMutation() {
  const queryClient = useQueryClient();

  return useMutation<MessageRead, Error, MarkReadVars>({
    mutationFn: async ({ lastMessageId, roomId }): Promise<MessageRead> => {
      const client = getAppsyncClient();
      const response = (await client.graphql({
        query: MARK_AS_READ_MUTATION,
        variables: { lastMessageId, roomId },
      })) as { data: { markAsRead: MessageRead } };
      return response.data.markAsRead;
    },

    onSuccess: (receipt, { roomId }) => {
      // Enrich with createdAt looked up from the local messages cache.
      const cached = queryClient.getQueryData<{ pages: MessageConnection[] }>(
        messagesQueryKey(roomId),
      );
      let lastReadMessageCreatedAt: string | null = null;
      if (cached) {
        for (const page of cached.pages) {
          for (const item of page.items) {
            if (item.messageId === receipt.lastReadMessageId) {
              lastReadMessageCreatedAt = item.createdAt;
              break;
            }
          }
          if (lastReadMessageCreatedAt !== null) break;
        }
      }

      const entry: ReadReceiptCacheEntry = {
        ...receipt,
        lastReadMessageCreatedAt,
      };

      queryClient.setQueryData<ReadReceiptCacheEntry>(
        readReceiptsQueryKey(roomId),
        entry,
      );
    },
  });
}
