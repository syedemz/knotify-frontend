/**
 * Tests for `src/features/chat/navigation/openChatRoom.ts` (story 16.5).
 *
 * Story 16.5: `chatRoomExistsForUser` is DELETED. `useOpenChatRoom` now
 * resolves `userId → roomId` via `useCreateOrGetRoomMutation.mutateAsync`
 * and navigates with `{ roomId }`.
 *
 * AC coverage:
 * (a) `useOpenChatRoom` calls `mutateAsync` with `{ otherUserId: userId }`.
 * (b) After `mutateAsync` resolves, `navigate` is called with
 *     `'Chat', { screen: 'ChatRoomScreen', params: { roomId } }`.
 * (c) If `mutateAsync` rejects, `navigate` is NOT called (error propagates).
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { renderHook, act } from '@testing-library/react-native';

// ── Navigation mock ────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as Record<string, unknown>;
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
  };
});

// ── useCreateOrGetRoomMutation mock ────────────────────────────────────────────

const mockMutateAsync = jest.fn();

jest.mock('@/features/chat/api', () => ({
  useCreateOrGetRoomMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    isError: false,
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { useOpenChatRoom } from '@/features/chat/navigation/openChatRoom';

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockNavigate.mockClear();
  mockMutateAsync.mockClear();
  mockMutateAsync.mockResolvedValue({
    roomId: 'room-resolved-001',
    userA: 'user-a',
    userB: 'user-b',
    lastMessagePreview: null,
    lastMessageAt: null,
    lastMessageSenderId: null,
    lastMessageId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
});

// ── AC (a): mutateAsync is called with { otherUserId } ─────────────────────────

describe('useOpenChatRoom — AC (a): calls mutateAsync with otherUserId', () => {
  it('given a userId, when openChatRoom is called, then mutateAsync is called with { otherUserId: userId }', async () => {
    const { result } = renderHook(() => useOpenChatRoom());
    const openChatRoom = result.current;

    await act(async () => {
      await openChatRoom('user-friend-001');
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    expect(mockMutateAsync).toHaveBeenCalledWith({ otherUserId: 'user-friend-001' });
  });

  it('passes the exact userId as otherUserId', async () => {
    const { result } = renderHook(() => useOpenChatRoom());
    const specificUserId = 'mehvish-user-id-42';

    await act(async () => {
      await result.current(specificUserId);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ otherUserId: specificUserId });
  });
});

// ── AC (b): navigate is called with the resolved roomId ───────────────────────

describe('useOpenChatRoom — AC (b): navigate called with resolved roomId', () => {
  it(
    'given mutateAsync resolves with roomId, when openChatRoom is called, then navigate is called with Chat/ChatRoomScreen/roomId',
    async () => {
      const { result } = renderHook(() => useOpenChatRoom());

      await act(async () => {
        await result.current('user-friend-001');
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('Chat', {
        screen: 'ChatRoomScreen',
        params: { roomId: 'room-resolved-001' },
      });
    },
  );

  it('passes the exact roomId returned by mutateAsync', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      roomId: 'room-specific-xyz',
      userA: 'a',
      userB: 'b',
      lastMessagePreview: null,
      lastMessageAt: null,
      lastMessageSenderId: null,
      lastMessageId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => useOpenChatRoom());

    await act(async () => {
      await result.current('user-friend-002');
    });

    expect(mockNavigate).toHaveBeenCalledWith('Chat', {
      screen: 'ChatRoomScreen',
      params: { roomId: 'room-specific-xyz' },
    });
  });
});

// ── AC (c): navigate NOT called if mutateAsync rejects ────────────────────────

describe('useOpenChatRoom — AC (c): navigate not called on mutation error', () => {
  it(
    'given mutateAsync rejects, when openChatRoom is called, then navigate is NOT called and the promise rejects',
    async () => {
      mockMutateAsync.mockRejectedValueOnce(new Error('Network failure'));

      const { result } = renderHook(() => useOpenChatRoom());

      await act(async () => {
        await expect(result.current('user-friend-001')).rejects.toThrow('Network failure');
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    },
  );
});
