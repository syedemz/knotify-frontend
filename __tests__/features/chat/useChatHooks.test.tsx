/**
 * Unit tests for `src/features/chat/api.ts`.
 *
 * Story 16.4 AC coverage:
 *
 * (a) ROOMS_QUERY_KEY / messagesQueryKey exports — key shapes per §7.3.
 * (b) useRoomsQuery — happy-path, empty, error.
 * (c) useMessagesQuery — happy-path pagination shapes, nextToken forwarding.
 * (d) useCreateOrGetRoomMutation — success + rooms cache invalidation.
 * (e) useSendMessageMutation — optimistic append, rollback on error,
 *     replacement with server echo on success, rooms cache invalidation.
 * (f) useOnMessageInRoomSubscription — cache prepend on new message
 *     (server returns newest-first; new items land at pages[0].items[0] so
 *     the inverted FlatList renders them at the visual bottom), dedupe
 *     when messageId already in cache, rooms cache invalidation on new message.
 *
 * Story 16.CH1 AC coverage:
 *
 * (g) readReceiptsQueryKey — key shape per §7.3.
 * (h) useOnReadReceiptSubscription — receipt updates ['readReceipts', roomId]
 *     cache with enriched entry including lastReadMessageCreatedAt,
 *     unsubscribe on unmount.
 * (i) useMarkReadMutation — calls markAsRead with correct args, on success
 *     stores enriched ReadReceiptCacheEntry, error path.
 * (j) useReadReceiptQuery — enabled:false (no network), reads setQueryData writes.
 *
 * Story 16.CH2 AC coverage:
 *
 * (k) useSetTypingMutation — calls setTyping with correct isTyping+roomId args, success path, error path.
 * (l) useOnTypingInRoomSubscription — inbound event calls onEvent callback;
 *     self-event (userId === currentUserId) is filtered; unsubscribe on unmount.
 *
 * Tests stub `getAppsyncClient()` via `jest.mock('@/services/graphql/appsyncClient')`.
 * No fixture files are created under `src/services/api/mocks/`.
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Service boundary stubs ────────────────────────────────────────────────────

const mockGraphql = jest.fn();

jest.mock('@/services/graphql/appsyncClient', () => ({
  getAppsyncClient: () => ({ graphql: mockGraphql }),
  _resetAppsyncClientForTests: jest.fn(),
}));

// ── Imports (after mock declaration) ─────────────────────────────────────────

import {
  ROOMS_QUERY_KEY,
  messagesQueryKey,
  readReceiptsQueryKey,
  useRoomsQuery,
  useMessagesQuery,
  useCreateOrGetRoomMutation,
  useSendMessageMutation,
  useOnMessageInRoomSubscription,
  useOnReadReceiptSubscription,
  useMarkReadMutation,
  useReadReceiptQuery,
  useSetTypingMutation,
  useOnTypingInRoomSubscription,
} from '@/features/chat/api';
import type { ChatRoom, Message, MessageConnection, MessageRead, TypingEvent } from '@/services/graphql/types';
import type { ReadReceiptCacheEntry } from '@/features/chat/api';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CURRENT_USER_ID = 'u-me-001';
const FRIEND_USER_ID = 'u-friend-002';
const ROOM_ID = 'room-aaa-001';

function makeChatRoom(overrides?: Partial<ChatRoom>): ChatRoom {
  return {
    roomId: ROOM_ID,
    userA: CURRENT_USER_ID,
    userB: FRIEND_USER_ID,
    lastMessageAt: null,
    lastMessagePreview: null,
    lastMessageSenderId: null,
    lastMessageId: null,
    createdAt: '2026-11-16T09:00:00.000Z',
    updatedAt: '2026-11-16T09:00:00.000Z',
    ...overrides,
  };
}

function makeServerMessage(overrides?: Partial<Message>): Message {
  return {
    messageId: 'msg-server-001',
    roomId: ROOM_ID,
    senderId: CURRENT_USER_ID,
    content: 'Hello',
    contentType: 'text',
    createdAt: '2026-11-16T10:00:00.000Z',
    deliveredAt: null,
    ...overrides,
  };
}

function makeMessageConnection(overrides?: Partial<MessageConnection>): MessageConnection {
  return {
    items: [makeServerMessage()],
    nextToken: null,
    ...overrides,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 60_000 },
      mutations: { retry: false },
    },
  });
}

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════
// (a) Query key exports
// ═════════════════════════════════════════════════════════════════════════════

describe('ROOMS_QUERY_KEY', () => {
  it('is exported as the tuple ["rooms"] per §7.3 query-key convention', () => {
    expect(ROOMS_QUERY_KEY).toEqual(['rooms']);
  });
});

describe('messagesQueryKey', () => {
  it('returns the tuple ["messages", roomId] per §7.3 query-key convention', () => {
    expect(messagesQueryKey('room-xyz')).toEqual(['messages', 'room-xyz']);
  });

  it('returns different tuples for different roomIds', () => {
    expect(messagesQueryKey('room-aaa')).not.toEqual(messagesQueryKey('room-bbb'));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (b) useRoomsQuery
// ═════════════════════════════════════════════════════════════════════════════

describe('useRoomsQuery — happy-path', () => {
  it('given backend returns a populated list, when hook resolves, then data is the typed ChatRoom array', async () => {
    const r1 = makeChatRoom({ roomId: 'room-001' });
    const r2 = makeChatRoom({ roomId: 'room-002' });
    mockGraphql.mockResolvedValueOnce({ data: { listMyRooms: [r1, r2] } });

    const client = makeClient();
    const { result } = renderHook(() => useRoomsQuery(), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.roomId).toBe('room-001');
    expect(result.current.data?.[1]?.roomId).toBe('room-002');
  });
});

describe('useRoomsQuery — empty response', () => {
  it('given backend returns an empty array, when hook resolves, then data is []', async () => {
    mockGraphql.mockResolvedValueOnce({ data: { listMyRooms: [] } });

    const client = makeClient();
    const { result } = renderHook(() => useRoomsQuery(), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useRoomsQuery — error', () => {
  it('given backend throws, when hook rejects, then isError is true and error propagates', async () => {
    mockGraphql.mockRejectedValueOnce(new Error('Network failure'));

    const client = makeClient();
    const { result } = renderHook(() => useRoomsQuery(), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network failure');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (c) useMessagesQuery
// ═════════════════════════════════════════════════════════════════════════════

describe('useMessagesQuery — happy-path', () => {
  it('given backend returns a first page, when hook resolves, then pages[0].items is the message array', async () => {
    const conn = makeMessageConnection({
      items: [makeServerMessage({ messageId: 'msg-001' })],
      nextToken: null,
    });
    mockGraphql.mockResolvedValueOnce({ data: { messagesByChatRoom: conn } });

    const client = makeClient();
    const { result } = renderHook(() => useMessagesQuery(ROOM_ID), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages).toHaveLength(1);
    expect(result.current.data?.pages[0]?.items).toHaveLength(1);
    expect(result.current.data?.pages[0]?.items[0]?.messageId).toBe('msg-001');
  });

  it('given first page has a nextToken, then hasNextPage is true', async () => {
    const conn = makeMessageConnection({ nextToken: 'cursor-abc' });
    mockGraphql.mockResolvedValueOnce({ data: { messagesByChatRoom: conn } });

    const client = makeClient();
    const { result } = renderHook(() => useMessagesQuery(ROOM_ID), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(true);
  });

  it('given first page has null nextToken, then hasNextPage is false', async () => {
    const conn = makeMessageConnection({ nextToken: null });
    mockGraphql.mockResolvedValueOnce({ data: { messagesByChatRoom: conn } });

    const client = makeClient();
    const { result } = renderHook(() => useMessagesQuery(ROOM_ID), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(false);
  });
});

describe('useMessagesQuery — error', () => {
  it('given backend throws, when hook rejects, then isError is true', async () => {
    mockGraphql.mockRejectedValueOnce(new Error('AppSync error'));

    const client = makeClient();
    const { result } = renderHook(() => useMessagesQuery(ROOM_ID), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (d) useCreateOrGetRoomMutation
// ═════════════════════════════════════════════════════════════════════════════

describe('useCreateOrGetRoomMutation — success', () => {
  it('given backend returns a room, when mutate resolves, then isSuccess is true and data is the room', async () => {
    const room = makeChatRoom({ roomId: 'room-new-001' });
    mockGraphql.mockResolvedValueOnce({ data: { createOrGetRoom: room } });

    const client = makeClient();
    const { result } = renderHook(() => useCreateOrGetRoomMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ otherUserId: FRIEND_USER_ID });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.roomId).toBe('room-new-001');
    // Verify the mutation called graphql with otherUserId (not userId).
    expect(mockGraphql).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({ otherUserId: FRIEND_USER_ID }),
      }),
    );
  });

  it('given success, then ["rooms"] is invalidated', async () => {
    const room = makeChatRoom();
    mockGraphql.mockResolvedValueOnce({ data: { createOrGetRoom: room } });

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useCreateOrGetRoomMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ otherUserId: FRIEND_USER_ID });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ROOMS_QUERY_KEY }),
    );
  });
});

describe('useCreateOrGetRoomMutation — error', () => {
  it('given backend fails, when mutate rejects, then isError is true', async () => {
    mockGraphql.mockRejectedValueOnce(new Error('AppSync error'));

    const client = makeClient();
    const { result } = renderHook(() => useCreateOrGetRoomMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ otherUserId: FRIEND_USER_ID });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (e) useSendMessageMutation — optimistic append + rollback + server echo
// ═════════════════════════════════════════════════════════════════════════════

describe('useSendMessageMutation — optimistic append', () => {
  it('given mutate is called, then before the server responds the cache has an optimistic entry with status "sending"', async () => {
    // Use a never-settling promise so we can inspect the interim state.
    let resolveGraphql!: (v: unknown) => void;
    const pending = new Promise((res) => {
      resolveGraphql = res;
    });
    mockGraphql.mockReturnValueOnce(pending);

    const client = makeClient();
    const { result } = renderHook(() => useSendMessageMutation(CURRENT_USER_ID), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ content: 'Hello', roomId: ROOM_ID });
    });

    // The optimistic entry should appear in the cache synchronously during onMutate.
    await waitFor(() => {
      const cached = client.getQueryData<{ pages: MessageConnection[] }>(
        messagesQueryKey(ROOM_ID),
      );
      const allItems = cached?.pages.flatMap((p) => p.items) ?? [];
      return allItems.length > 0;
    });

    const cached = client.getQueryData<{ pages: MessageConnection[] }>(
      messagesQueryKey(ROOM_ID),
    );
    const items = cached?.pages.flatMap((p) => p.items) ?? [];
    expect(items).toHaveLength(1);
    // The optimistic entry has senderId '__optimistic__' (from chatMessageToFakeMessage).
    // Its deliveredAt is null — the adapter would synthesise 'sent', but since
    // isOptimistic is true in the caller's mind, the entry carries null deliveredAt.
    // We test the cache shape here (not the adapted ChatMessage directly).
    expect(items[0]?.deliveredAt).toBeNull();

    // Resolve the pending promise to avoid open handles.
    resolveGraphql({ data: { sendMessage: makeServerMessage() } });
  });
});

describe('useSendMessageMutation — rollback on error', () => {
  it('given the server call fails, when onError fires, then the cache is restored to its pre-mutation state', async () => {
    // Pre-seed the cache with one existing message.
    const existingMsg = makeServerMessage({ messageId: 'msg-existing-001' });
    const client = makeClient();
    client.setQueryData(messagesQueryKey(ROOM_ID), {
      pages: [{ items: [existingMsg], nextToken: null }],
      pageParams: [{ nextToken: undefined }],
    });

    mockGraphql.mockRejectedValueOnce(new Error('Server error'));

    const { result } = renderHook(() => useSendMessageMutation(CURRENT_USER_ID), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ content: 'Fail message', roomId: ROOM_ID });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // After rollback, the cache should contain only the original message.
    const cached = client.getQueryData<{ pages: MessageConnection[] }>(
      messagesQueryKey(ROOM_ID),
    );
    const items = cached?.pages.flatMap((p) => p.items) ?? [];
    expect(items).toHaveLength(1);
    expect(items[0]?.messageId).toBe('msg-existing-001');
  });
});

describe('useSendMessageMutation — server echo replaces optimistic entry', () => {
  it('given success, then the cache entry with the localId is replaced by the server messageId', async () => {
    const serverMsg = makeServerMessage({ messageId: 'msg-server-real-001' });
    mockGraphql.mockResolvedValueOnce({ data: { sendMessage: serverMsg } });

    const client = makeClient();
    const { result } = renderHook(() => useSendMessageMutation(CURRENT_USER_ID), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ content: 'Hello', roomId: ROOM_ID });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cached = client.getQueryData<{ pages: MessageConnection[] }>(
      messagesQueryKey(ROOM_ID),
    );
    const items = cached?.pages.flatMap((p) => p.items) ?? [];

    // The final cache should contain exactly one entry with the server messageId.
    expect(items).toHaveLength(1);
    expect(items[0]?.messageId).toBe('msg-server-real-001');
  });

  it('given success, then ["rooms"] is invalidated to update lastMessagePreview', async () => {
    const serverMsg = makeServerMessage();
    mockGraphql.mockResolvedValueOnce({ data: { sendMessage: serverMsg } });

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useSendMessageMutation(CURRENT_USER_ID), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ content: 'Hello', roomId: ROOM_ID });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ROOMS_QUERY_KEY }),
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (f) useOnMessageInRoomSubscription — cache prepend + dedupe
// ═════════════════════════════════════════════════════════════════════════════

describe('useOnMessageInRoomSubscription — cache prepend on new message', () => {
  it('given a new message arrives via subscription, then it is prepended to pages[0].items so the inverted list renders it at the bottom of the thread', async () => {
    // Set up the mock subscription: graphql() returns an object with subscribe().
    let capturedNextHandler!: (event: { data: { onMessageInRoom: Message | null } }) => void;
    const unsubscribeMock = jest.fn();
    mockGraphql.mockReturnValueOnce({
      subscribe: (handlers: { next: typeof capturedNextHandler; error: () => void }) => {
        capturedNextHandler = handlers.next;
        return { unsubscribe: unsubscribeMock };
      },
    });

    const client = makeClient();
    // Seed an existing (older) message. Server order is newest-first so an
    // older message lives at index 0 of its page only when it is the single
    // message in the thread; after the subscription fires the new (newer)
    // message must take over index 0.
    const existingMsg = makeServerMessage({ messageId: 'msg-existing-001' });
    client.setQueryData(messagesQueryKey(ROOM_ID), {
      pages: [{ items: [existingMsg], nextToken: null }],
      pageParams: [{ nextToken: undefined }],
    });

    renderHook(() => useOnMessageInRoomSubscription(ROOM_ID, CURRENT_USER_ID), {
      wrapper: makeWrapper(client),
    });

    // Simulate a new message arriving from the subscription.
    const newMsg = makeServerMessage({
      messageId: 'msg-new-002',
      content: 'Hey there',
      senderId: FRIEND_USER_ID,
    });
    act(() => {
      capturedNextHandler({ data: { onMessageInRoom: newMsg } });
    });

    await waitFor(() => {
      const cached = client.getQueryData<{ pages: MessageConnection[] }>(
        messagesQueryKey(ROOM_ID),
      );
      const items = cached?.pages.flatMap((p) => p.items) ?? [];
      return items.length === 2;
    });

    const cached = client.getQueryData<{ pages: MessageConnection[] }>(
      messagesQueryKey(ROOM_ID),
    );
    const items = cached?.pages.flatMap((p) => p.items) ?? [];
    expect(items).toHaveLength(2);
    // New message at index 0 (newest-first), existing older message at index 1.
    // This is the invariant ChatRoomScreen relies on to render with
    // `<FlatList inverted>` — data[0] is drawn at the visual bottom of the
    // screen, which is where the newest message belongs.
    expect(items[0]?.messageId).toBe('msg-new-002');
    expect(items[1]?.messageId).toBe('msg-existing-001');
  });

  it('given a subscription message with an already-known messageId, then it is NOT appended (dedupe)', async () => {
    let capturedNextHandler!: (event: { data: { onMessageInRoom: Message | null } }) => void;
    const unsubscribeMock = jest.fn();
    mockGraphql.mockReturnValueOnce({
      subscribe: (handlers: { next: typeof capturedNextHandler; error: () => void }) => {
        capturedNextHandler = handlers.next;
        return { unsubscribe: unsubscribeMock };
      },
    });

    const client = makeClient();
    const existingMsg = makeServerMessage({ messageId: 'msg-known-001' });
    client.setQueryData(messagesQueryKey(ROOM_ID), {
      pages: [{ items: [existingMsg], nextToken: null }],
      pageParams: [{ nextToken: undefined }],
    });

    renderHook(() => useOnMessageInRoomSubscription(ROOM_ID, CURRENT_USER_ID), {
      wrapper: makeWrapper(client),
    });

    // Simulate the SAME message arriving again (e.g. race between mutation + subscription).
    act(() => {
      capturedNextHandler({ data: { onMessageInRoom: existingMsg } });
    });

    // Allow any potential async updates.
    await new Promise((res) => setTimeout(res, 50));

    const cached = client.getQueryData<{ pages: MessageConnection[] }>(
      messagesQueryKey(ROOM_ID),
    );
    const items = cached?.pages.flatMap((p) => p.items) ?? [];
    // Should still be just 1 item — dedupe worked.
    expect(items).toHaveLength(1);
  });

  it('given a new message arrives, then ["rooms"] is invalidated', async () => {
    let capturedNextHandler!: (event: { data: { onMessageInRoom: Message | null } }) => void;
    mockGraphql.mockReturnValueOnce({
      subscribe: (handlers: { next: typeof capturedNextHandler; error: () => void }) => {
        capturedNextHandler = handlers.next;
        return { unsubscribe: jest.fn() };
      },
    });

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    renderHook(() => useOnMessageInRoomSubscription(ROOM_ID, CURRENT_USER_ID), {
      wrapper: makeWrapper(client),
    });

    const newMsg = makeServerMessage({ messageId: 'msg-new-003' });
    act(() => {
      capturedNextHandler({ data: { onMessageInRoom: newMsg } });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ROOMS_QUERY_KEY }),
      );
    });
  });

  it('given the hook unmounts, then unsubscribe is called (no leaked subscription)', () => {
    const unsubscribeMock = jest.fn();
    mockGraphql.mockReturnValueOnce({
      subscribe: (_handlers: unknown) => ({
        unsubscribe: unsubscribeMock,
      }),
    });

    const client = makeClient();
    const { unmount } = renderHook(
      () => useOnMessageInRoomSubscription(ROOM_ID, CURRENT_USER_ID),
      { wrapper: makeWrapper(client) },
    );

    expect(unsubscribeMock).not.toHaveBeenCalled();
    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (g) readReceiptsQueryKey
// ═════════════════════════════════════════════════════════════════════════════

describe('readReceiptsQueryKey', () => {
  it('is exported and returns the tuple ["readReceipts", roomId] per §7.3', () => {
    expect(readReceiptsQueryKey('room-xyz')).toEqual(['readReceipts', 'room-xyz']);
  });

  it('returns different tuples for different roomIds', () => {
    expect(readReceiptsQueryKey('room-aaa')).not.toEqual(readReceiptsQueryKey('room-bbb'));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (h) useOnReadReceiptSubscription
// ═════════════════════════════════════════════════════════════════════════════

function makeMessageRead(overrides?: Partial<MessageRead>): MessageRead {
  return {
    roomId: ROOM_ID,
    userId: FRIEND_USER_ID,
    lastReadMessageId: 'msg-server-001',
    lastReadAt: '2026-11-16T11:00:00.000Z',
    ...overrides,
  };
}

describe('useOnReadReceiptSubscription — receipt updates readReceipts cache', () => {
  it(
    'given a MessageRead event arrives, then ["readReceipts", roomId] is set with the receipt data',
    async () => {
      let capturedNext!: (event: { data: { onReadReceipt: MessageRead | null } }) => void;
      const unsubscribeMock = jest.fn();
      mockGraphql.mockReturnValueOnce({
        subscribe: (handlers: { next: typeof capturedNext; error: () => void }) => {
          capturedNext = handlers.next;
          return { unsubscribe: unsubscribeMock };
        },
      });

      const client = makeClient();
      renderHook(() => useOnReadReceiptSubscription(ROOM_ID), {
        wrapper: makeWrapper(client),
      });

      const receipt = makeMessageRead({ lastReadMessageId: 'msg-known-001' });
      act(() => {
        capturedNext({ data: { onReadReceipt: receipt } });
      });

      await waitFor(() => {
        const cached = client.getQueryData<ReadReceiptCacheEntry>(
          readReceiptsQueryKey(ROOM_ID),
        );
        return cached !== undefined;
      });

      const cached = client.getQueryData<ReadReceiptCacheEntry>(
        readReceiptsQueryKey(ROOM_ID),
      );
      expect(cached?.roomId).toBe(ROOM_ID);
      expect(cached?.lastReadMessageId).toBe('msg-known-001');
      expect(cached?.userId).toBe(FRIEND_USER_ID);
    },
  );

  it(
    'given messages are in the cache with a matching messageId, then lastReadMessageCreatedAt is set from that message',
    async () => {
      let capturedNext!: (event: { data: { onReadReceipt: MessageRead | null } }) => void;
      mockGraphql.mockReturnValueOnce({
        subscribe: (handlers: { next: typeof capturedNext; error: () => void }) => {
          capturedNext = handlers.next;
          return { unsubscribe: jest.fn() };
        },
      });

      const client = makeClient();
      // Seed messages cache with a known message.
      const knownMsg = makeServerMessage({
        messageId: 'msg-read-001',
        createdAt: '2026-11-16T10:30:00.000Z',
      });
      client.setQueryData(messagesQueryKey(ROOM_ID), {
        pages: [{ items: [knownMsg], nextToken: null }],
        pageParams: [{ nextToken: undefined }],
      });

      renderHook(() => useOnReadReceiptSubscription(ROOM_ID), {
        wrapper: makeWrapper(client),
      });

      const receipt = makeMessageRead({ lastReadMessageId: 'msg-read-001' });
      act(() => {
        capturedNext({ data: { onReadReceipt: receipt } });
      });

      await waitFor(() => {
        const cached = client.getQueryData<ReadReceiptCacheEntry>(
          readReceiptsQueryKey(ROOM_ID),
        );
        return cached?.lastReadMessageCreatedAt !== undefined;
      });

      const cached = client.getQueryData<ReadReceiptCacheEntry>(
        readReceiptsQueryKey(ROOM_ID),
      );
      expect(cached?.lastReadMessageCreatedAt).toBe('2026-11-16T10:30:00.000Z');
    },
  );

  it(
    'given messages are NOT in the cache, then lastReadMessageCreatedAt is null',
    async () => {
      let capturedNext!: (event: { data: { onReadReceipt: MessageRead | null } }) => void;
      mockGraphql.mockReturnValueOnce({
        subscribe: (handlers: { next: typeof capturedNext; error: () => void }) => {
          capturedNext = handlers.next;
          return { unsubscribe: jest.fn() };
        },
      });

      const client = makeClient();
      // No messages seeded — cache is empty.

      renderHook(() => useOnReadReceiptSubscription(ROOM_ID), {
        wrapper: makeWrapper(client),
      });

      const receipt = makeMessageRead({ lastReadMessageId: 'msg-not-in-cache' });
      act(() => {
        capturedNext({ data: { onReadReceipt: receipt } });
      });

      await waitFor(() => {
        const cached = client.getQueryData<ReadReceiptCacheEntry>(
          readReceiptsQueryKey(ROOM_ID),
        );
        return cached !== undefined;
      });

      const cached = client.getQueryData<ReadReceiptCacheEntry>(
        readReceiptsQueryKey(ROOM_ID),
      );
      expect(cached?.lastReadMessageCreatedAt).toBeNull();
    },
  );

  it(
    'given the hook unmounts, then unsubscribe is called (no leaked read-receipt subscription)',
    () => {
      const unsubscribeMock = jest.fn();
      mockGraphql.mockReturnValueOnce({
        subscribe: (_handlers: unknown) => ({
          unsubscribe: unsubscribeMock,
        }),
      });

      const client = makeClient();
      const { unmount } = renderHook(
        () => useOnReadReceiptSubscription(ROOM_ID),
        { wrapper: makeWrapper(client) },
      );

      expect(unsubscribeMock).not.toHaveBeenCalled();
      unmount();
      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    },
  );

  it(
    'given a null event payload, then the cache is NOT updated',
    async () => {
      let capturedNext!: (event: { data: { onReadReceipt: MessageRead | null } }) => void;
      mockGraphql.mockReturnValueOnce({
        subscribe: (handlers: { next: typeof capturedNext; error: () => void }) => {
          capturedNext = handlers.next;
          return { unsubscribe: jest.fn() };
        },
      });

      const client = makeClient();
      renderHook(() => useOnReadReceiptSubscription(ROOM_ID), {
        wrapper: makeWrapper(client),
      });

      act(() => {
        capturedNext({ data: { onReadReceipt: null } });
      });

      // Allow any async update.
      await new Promise((res) => setTimeout(res, 50));

      const cached = client.getQueryData<ReadReceiptCacheEntry>(
        readReceiptsQueryKey(ROOM_ID),
      );
      // Cache should remain unpopulated.
      expect(cached).toBeUndefined();
    },
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// (i) useMarkReadMutation
// ═════════════════════════════════════════════════════════════════════════════

describe('useMarkReadMutation — success', () => {
  it(
    'given backend returns MessageRead, when mutate resolves, then isSuccess is true',
    async () => {
      const receipt = makeMessageRead({ lastReadMessageId: 'msg-server-001' });
      mockGraphql.mockResolvedValueOnce({ data: { markAsRead: receipt } });

      const client = makeClient();
      const { result } = renderHook(() => useMarkReadMutation(), {
        wrapper: makeWrapper(client),
      });

      act(() => {
        result.current.mutate({ roomId: ROOM_ID, lastMessageId: 'msg-server-001' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    },
  );

  it(
    'given success, then graphql is called with lastMessageId and roomId as separate args',
    async () => {
      const receipt = makeMessageRead();
      mockGraphql.mockResolvedValueOnce({ data: { markAsRead: receipt } });

      const client = makeClient();
      const { result } = renderHook(() => useMarkReadMutation(), {
        wrapper: makeWrapper(client),
      });

      act(() => {
        result.current.mutate({ roomId: ROOM_ID, lastMessageId: 'msg-abc-001' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGraphql).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            lastMessageId: 'msg-abc-001',
            roomId: ROOM_ID,
          }),
        }),
      );
    },
  );

  it(
    'given success with matching message in cache, then ["readReceipts", roomId] is set with lastReadMessageCreatedAt',
    async () => {
      const knownCreatedAt = '2026-11-16T10:45:00.000Z';
      const knownMsg = makeServerMessage({
        messageId: 'msg-known-read',
        createdAt: knownCreatedAt,
      });
      const receipt = makeMessageRead({ lastReadMessageId: 'msg-known-read' });
      mockGraphql.mockResolvedValueOnce({ data: { markAsRead: receipt } });

      const client = makeClient();
      // Seed messages cache.
      client.setQueryData(messagesQueryKey(ROOM_ID), {
        pages: [{ items: [knownMsg], nextToken: null }],
        pageParams: [{ nextToken: undefined }],
      });

      const { result } = renderHook(() => useMarkReadMutation(), {
        wrapper: makeWrapper(client),
      });

      act(() => {
        result.current.mutate({ roomId: ROOM_ID, lastMessageId: 'msg-known-read' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const cached = client.getQueryData<ReadReceiptCacheEntry>(
        readReceiptsQueryKey(ROOM_ID),
      );
      expect(cached?.lastReadMessageCreatedAt).toBe(knownCreatedAt);
      expect(cached?.lastReadMessageId).toBe('msg-known-read');
    },
  );

  it(
    'given success with no matching message in cache, then lastReadMessageCreatedAt is null',
    async () => {
      const receipt = makeMessageRead({ lastReadMessageId: 'msg-not-in-cache' });
      mockGraphql.mockResolvedValueOnce({ data: { markAsRead: receipt } });

      const client = makeClient();
      // No messages seeded.

      const { result } = renderHook(() => useMarkReadMutation(), {
        wrapper: makeWrapper(client),
      });

      act(() => {
        result.current.mutate({ roomId: ROOM_ID, lastMessageId: 'msg-not-in-cache' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const cached = client.getQueryData<ReadReceiptCacheEntry>(
        readReceiptsQueryKey(ROOM_ID),
      );
      expect(cached?.lastReadMessageCreatedAt).toBeNull();
    },
  );
});

describe('useMarkReadMutation — error', () => {
  it(
    'given backend fails, when mutate rejects, then isError is true',
    async () => {
      mockGraphql.mockRejectedValueOnce(new Error('AppSync error'));

      const client = makeClient();
      const { result } = renderHook(() => useMarkReadMutation(), {
        wrapper: makeWrapper(client),
      });

      act(() => {
        result.current.mutate({ roomId: ROOM_ID, lastMessageId: 'msg-fail-001' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // On error, the readReceipts cache should remain unpopulated.
      const cached = client.getQueryData<ReadReceiptCacheEntry>(
        readReceiptsQueryKey(ROOM_ID),
      );
      expect(cached).toBeUndefined();
    },
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// (j) useReadReceiptQuery
// ═════════════════════════════════════════════════════════════════════════════

describe('useReadReceiptQuery', () => {
  it(
    'given no setQueryData has been called, then data is undefined',
    () => {
      const client = makeClient();
      const { result } = renderHook(() => useReadReceiptQuery(ROOM_ID), {
        wrapper: makeWrapper(client),
      });
      expect(result.current.data).toBeUndefined();
    },
  );

  it(
    'given setQueryData has been called with a receipt entry, then data reflects the entry',
    async () => {
      const entry: ReadReceiptCacheEntry = {
        roomId: ROOM_ID,
        userId: FRIEND_USER_ID,
        lastReadMessageId: 'msg-read-999',
        lastReadAt: '2026-11-16T12:00:00.000Z',
        lastReadMessageCreatedAt: '2026-11-16T11:55:00.000Z',
      };

      const client = makeClient();

      const { result } = renderHook(() => useReadReceiptQuery(ROOM_ID), {
        wrapper: makeWrapper(client),
      });

      // Seed the cache as if a subscription event fired.
      act(() => {
        client.setQueryData(readReceiptsQueryKey(ROOM_ID), entry);
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data?.lastReadMessageId).toBe('msg-read-999');
      expect(result.current.data?.lastReadMessageCreatedAt).toBe('2026-11-16T11:55:00.000Z');
    },
  );

  it(
    'given enabled:false, then no network call (graphql) is made',
    () => {
      const client = makeClient();
      renderHook(() => useReadReceiptQuery(ROOM_ID), {
        wrapper: makeWrapper(client),
      });
      // No graphql call should have been issued.
      expect(mockGraphql).not.toHaveBeenCalled();
    },
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// (k) useSetTypingMutation
// ═════════════════════════════════════════════════════════════════════════════

function makeTypingEvent(overrides?: Partial<TypingEvent>): TypingEvent {
  return {
    roomId: ROOM_ID,
    userId: CURRENT_USER_ID,
    isTyping: true,
    ...overrides,
  };
}

describe('useSetTypingMutation — success (isTyping: true)', () => {
  it(
    'given backend returns TypingEvent, when mutate resolves with isTyping:true, then isSuccess is true',
    async () => {
      const event = makeTypingEvent({ isTyping: true });
      mockGraphql.mockResolvedValueOnce({ data: { setTyping: event } });

      const client = makeClient();
      const { result } = renderHook(() => useSetTypingMutation(), {
        wrapper: makeWrapper(client),
      });

      act(() => {
        result.current.mutate({ isTyping: true, roomId: ROOM_ID });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGraphql).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ isTyping: true, roomId: ROOM_ID }),
        }),
      );
    },
  );
});

describe('useSetTypingMutation — success (isTyping: false)', () => {
  it(
    'given backend returns TypingEvent, when mutate resolves with isTyping:false, then isSuccess is true',
    async () => {
      const event = makeTypingEvent({ isTyping: false });
      mockGraphql.mockResolvedValueOnce({ data: { setTyping: event } });

      const client = makeClient();
      const { result } = renderHook(() => useSetTypingMutation(), {
        wrapper: makeWrapper(client),
      });

      act(() => {
        result.current.mutate({ isTyping: false, roomId: ROOM_ID });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGraphql).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ isTyping: false, roomId: ROOM_ID }),
        }),
      );
    },
  );
});

describe('useSetTypingMutation — error', () => {
  it(
    'given backend throws, when mutate rejects, then isError is true',
    async () => {
      mockGraphql.mockRejectedValueOnce(new Error('AppSync typing error'));

      const client = makeClient();
      const { result } = renderHook(() => useSetTypingMutation(), {
        wrapper: makeWrapper(client),
      });

      act(() => {
        result.current.mutate({ isTyping: true, roomId: ROOM_ID });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    },
  );
});

// ═════════════════════════════════════════════════════════════════════════════
// (l) useOnTypingInRoomSubscription
// ═════════════════════════════════════════════════════════════════════════════

describe('useOnTypingInRoomSubscription — inbound event calls onEvent callback', () => {
  it(
    'given an isTyping:true event from the counterpart, when it arrives, then onEvent is called with the event',
    async () => {
      let capturedNext!: (event: { data: { onTypingInRoom: TypingEvent | null } }) => void;
      const unsubscribeMock = jest.fn();
      mockGraphql.mockReturnValueOnce({
        subscribe: (handlers: { next: typeof capturedNext; error: () => void }) => {
          capturedNext = handlers.next;
          return { unsubscribe: unsubscribeMock };
        },
      });

      const onEventMock = jest.fn();
      const client = makeClient();

      renderHook(
        () => useOnTypingInRoomSubscription(ROOM_ID, CURRENT_USER_ID, onEventMock),
        { wrapper: makeWrapper(client) },
      );

      const event = makeTypingEvent({ userId: FRIEND_USER_ID, isTyping: true });
      act(() => {
        capturedNext({ data: { onTypingInRoom: event } });
      });

      await waitFor(() => {
        expect(onEventMock).toHaveBeenCalledWith(event);
      });
    },
  );

  it(
    'given an isTyping:false event from the counterpart, when it arrives, then onEvent is called',
    async () => {
      let capturedNext!: (event: { data: { onTypingInRoom: TypingEvent | null } }) => void;
      mockGraphql.mockReturnValueOnce({
        subscribe: (handlers: { next: typeof capturedNext; error: () => void }) => {
          capturedNext = handlers.next;
          return { unsubscribe: jest.fn() };
        },
      });

      const onEventMock = jest.fn();
      const client = makeClient();

      renderHook(
        () => useOnTypingInRoomSubscription(ROOM_ID, CURRENT_USER_ID, onEventMock),
        { wrapper: makeWrapper(client) },
      );

      const event = makeTypingEvent({ userId: FRIEND_USER_ID, isTyping: false });
      act(() => {
        capturedNext({ data: { onTypingInRoom: event } });
      });

      await waitFor(() => {
        expect(onEventMock).toHaveBeenCalledWith(event);
      });
    },
  );
});

describe('useOnTypingInRoomSubscription — self-event filtering', () => {
  it(
    'given an event whose userId === currentUserId, when it arrives, then onEvent is NOT called (self-filter)',
    async () => {
      let capturedNext!: (event: { data: { onTypingInRoom: TypingEvent | null } }) => void;
      mockGraphql.mockReturnValueOnce({
        subscribe: (handlers: { next: typeof capturedNext; error: () => void }) => {
          capturedNext = handlers.next;
          return { unsubscribe: jest.fn() };
        },
      });

      const onEventMock = jest.fn();
      const client = makeClient();

      renderHook(
        () => useOnTypingInRoomSubscription(ROOM_ID, CURRENT_USER_ID, onEventMock),
        { wrapper: makeWrapper(client) },
      );

      // Self-event: the server reflects the mutation back to the sender.
      const selfEvent = makeTypingEvent({ userId: CURRENT_USER_ID, isTyping: true });
      act(() => {
        capturedNext({ data: { onTypingInRoom: selfEvent } });
      });

      // Allow any async update.
      await new Promise((res) => setTimeout(res, 50));

      expect(onEventMock).not.toHaveBeenCalled();
    },
  );
});

describe('useOnTypingInRoomSubscription — null event payload', () => {
  it(
    'given a null event payload, then onEvent is NOT called',
    async () => {
      let capturedNext!: (event: { data: { onTypingInRoom: TypingEvent | null } }) => void;
      mockGraphql.mockReturnValueOnce({
        subscribe: (handlers: { next: typeof capturedNext; error: () => void }) => {
          capturedNext = handlers.next;
          return { unsubscribe: jest.fn() };
        },
      });

      const onEventMock = jest.fn();
      const client = makeClient();

      renderHook(
        () => useOnTypingInRoomSubscription(ROOM_ID, CURRENT_USER_ID, onEventMock),
        { wrapper: makeWrapper(client) },
      );

      act(() => {
        capturedNext({ data: { onTypingInRoom: null } });
      });

      await new Promise((res) => setTimeout(res, 50));

      expect(onEventMock).not.toHaveBeenCalled();
    },
  );
});

describe('useOnTypingInRoomSubscription — unmount teardown', () => {
  it(
    'given the hook unmounts, then unsubscribe is called (no leaked subscription)',
    () => {
      const unsubscribeMock = jest.fn();
      mockGraphql.mockReturnValueOnce({
        subscribe: (_handlers: unknown) => ({
          unsubscribe: unsubscribeMock,
        }),
      });

      const client = makeClient();
      const { unmount } = renderHook(
        () => useOnTypingInRoomSubscription(ROOM_ID, CURRENT_USER_ID, jest.fn()),
        { wrapper: makeWrapper(client) },
      );

      expect(unsubscribeMock).not.toHaveBeenCalled();
      unmount();
      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    },
  );
});
