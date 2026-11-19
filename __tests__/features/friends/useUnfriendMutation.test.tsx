/**
 * Unit tests for `src/features/friends/api.ts` — `useUnfriendMutation`.
 *
 * Covers:
 *  (a) Happy-path: `friendsApi.unfriend(userId)` is called with the exact
 *      userId passed in the mutation vars.
 *  (b) Cache invalidations on success — the required keys are invalidated:
 *       - `['friends']`
 *       - `['rooms']`
 *       - `['profile', userId]`
 *       - `['deck']`
 *      And `['messages', *]` is NOT invalidated (history is preserved).
 *  (c) Error propagation: when the API rejects, `isError` becomes true and
 *      NO cache invalidations are triggered.
 *
 * Tests stub the service boundary at `friendsApi.unfriend` and the
 * `useQueryClient().invalidateQueries` method.
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Service boundary stub ─────────────────────────────────────────────────────

const mockUnfriend = jest.fn();
const mockList = jest.fn();

jest.mock('@/services/api/endpoints', () => ({
  friendsApi: {
    unfriend: (...args: unknown[]) => mockUnfriend(...args),
    list: (...args: unknown[]) => mockList(...args),
  },
  // Keep other exports shape-compatible so the module imports cleanly.
  profileApi: {},
  matchApi: {},
  friendRequestsApi: {},
  blocksApi: {},
}));

// ── Imports (after mock declaration) ─────────────────────────────────────────

import { useUnfriendMutation } from '@/features/friends/api';

// ── Wrapper — fresh QueryClient per test to isolate cache ─────────────────────

function makeWrapperWithClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const spy = jest.spyOn(client, 'invalidateQueries');
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
  return { client, spy, Wrapper };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── (a) Happy-path — service called with correct userId ──────────────────────

describe('useUnfriendMutation — service call', () => {
  it('given mutation.mutate is called with userId, then friendsApi.unfriend is invoked with that exact userId', async () => {
    mockUnfriend.mockResolvedValue(undefined);
    const { Wrapper } = makeWrapperWithClient();

    const { result } = renderHook(() => useUnfriendMutation(), { wrapper: Wrapper });

    result.current.mutate({ userId: 'u-ex-friend-001' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUnfriend).toHaveBeenCalledTimes(1);
    expect(mockUnfriend).toHaveBeenCalledWith('u-ex-friend-001');
  });
});

// ── (b) Cache invalidations on success ────────────────────────────────────────

describe('useUnfriendMutation — cache invalidations on success', () => {
  it('invalidates ["friends"] on success', async () => {
    mockUnfriend.mockResolvedValue(undefined);
    const { spy, Wrapper } = makeWrapperWithClient();
    const { result } = renderHook(() => useUnfriendMutation(), { wrapper: Wrapper });

    result.current.mutate({ userId: 'u-ex-friend-001' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(spy).toHaveBeenCalledWith({ queryKey: ['friends'] });
  });

  it('invalidates ["rooms"] on success', async () => {
    mockUnfriend.mockResolvedValue(undefined);
    const { spy, Wrapper } = makeWrapperWithClient();
    const { result } = renderHook(() => useUnfriendMutation(), { wrapper: Wrapper });

    result.current.mutate({ userId: 'u-ex-friend-001' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(spy).toHaveBeenCalledWith({ queryKey: ['rooms'] });
  });

  it('invalidates the specific counterpart profile key on success', async () => {
    mockUnfriend.mockResolvedValue(undefined);
    const { spy, Wrapper } = makeWrapperWithClient();
    const { result } = renderHook(() => useUnfriendMutation(), { wrapper: Wrapper });

    result.current.mutate({ userId: 'u-ex-friend-001' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(spy).toHaveBeenCalledWith({ queryKey: ['profile', 'u-ex-friend-001'] });
  });

  it('invalidates ["deck"] on success (ex-friend may re-enter discovery)', async () => {
    mockUnfriend.mockResolvedValue(undefined);
    const { spy, Wrapper } = makeWrapperWithClient();
    const { result } = renderHook(() => useUnfriendMutation(), { wrapper: Wrapper });

    result.current.mutate({ userId: 'u-ex-friend-001' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(spy).toHaveBeenCalledWith({ queryKey: ['deck'] });
  });

  it('does NOT invalidate ["messages", *] (history is preserved server-side)', async () => {
    mockUnfriend.mockResolvedValue(undefined);
    const { spy, Wrapper } = makeWrapperWithClient();
    const { result } = renderHook(() => useUnfriendMutation(), { wrapper: Wrapper });

    result.current.mutate({ userId: 'u-ex-friend-001' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const messagesInvalidations = spy.mock.calls.filter((call) => {
      const arg = call[0] as { queryKey?: readonly unknown[]; predicate?: unknown } | undefined;
      return Array.isArray(arg?.queryKey) && arg.queryKey[0] === 'messages';
    });
    expect(messagesInvalidations).toHaveLength(0);

    // Also assert no predicate-based invalidations were used.
    const predicateCalls = spy.mock.calls.filter((call) => {
      const arg = call[0] as { predicate?: unknown } | undefined;
      return typeof arg?.predicate === 'function';
    });
    expect(predicateCalls).toHaveLength(0);
  });
});

// ── (c) Error propagation ─────────────────────────────────────────────────────

describe('useUnfriendMutation — error handling', () => {
  it('when the API rejects, isError becomes true and no cache invalidations fire', async () => {
    mockUnfriend.mockRejectedValue(new Error('Network failure'));
    const { spy, Wrapper } = makeWrapperWithClient();
    const { result } = renderHook(() => useUnfriendMutation(), { wrapper: Wrapper });

    result.current.mutate({ userId: 'u-ex-friend-001' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network failure');
    expect(spy).not.toHaveBeenCalled();
  });
});
