/**
 * Unit tests for `src/features/blocks/api.ts`.
 *
 * Story 16.9 AC coverage:
 * (a) `useBlockedUsersQuery` — BLOCKED_USERS_QUERY_KEY export, happy-path
 *     populated list, empty list, error propagation.
 * (b) `useBlockUserMutation` — success + broad cross-cache invalidation:
 *     asserts EACH of ['deck'], ['search'], ['bookmarks'], ['friends'],
 *     ['friend-requests','incoming'], ['friend-requests','outgoing'],
 *     ['rooms'], AND every ['messages', *] tuple are invalidated.
 * (c) `useUnblockUserMutation` — success + narrow invalidation: only
 *     ['blocked-users'] is invalidated; discovery caches are NOT touched.
 * (d) Error paths — both mutations surface errors correctly and do NOT
 *     invalidate any caches on failure.
 *
 * Tests stub the service boundary at `blocksApi.{list,block,unblock}` via
 * `jest.mock('@/services/api/endpoints')`. Query-key constants for friends and
 * friend-requests are mocked to match their source-module exports (no string
 * literals hardcoded in assertions). No fixtures under
 * `src/services/api/mocks/` are created (real-backend-only per PRD 16.9).
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Service boundary stubs ────────────────────────────────────────────────────

const mockList = jest.fn();
const mockBlock = jest.fn();
const mockUnblock = jest.fn();

jest.mock('@/services/api/endpoints', () => ({
  blocksApi: {
    list: (...args: unknown[]) => mockList(...args),
    block: (...args: unknown[]) => mockBlock(...args),
    unblock: (...args: unknown[]) => mockUnblock(...args),
  },
  friendsApi: {},
  profileApi: {},
  matchApi: {},
  friendRequestsApi: {},
}));

// Mock dependency query-key modules so imports resolve without real deps.
jest.mock('@/features/friends/api', () => ({
  FRIENDS_QUERY_KEY: ['friends'] as const,
}));

jest.mock('@/features/friendRequests/api', () => ({
  INCOMING_REQUESTS_QUERY_KEY: ['friend-requests', 'incoming'] as const,
  OUTGOING_REQUESTS_QUERY_KEY: ['friend-requests', 'outgoing'] as const,
}));

// ── Imports (after mock declaration) ─────────────────────────────────────────

import {
  useBlockedUsersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  BLOCKED_USERS_QUERY_KEY,
} from '@/features/blocks/api';
import { FRIENDS_QUERY_KEY } from '@/features/friends/api';
import {
  INCOMING_REQUESTS_QUERY_KEY,
  OUTGOING_REQUESTS_QUERY_KEY,
} from '@/features/friendRequests/api';
import type { BlockedUser } from '@/services/api/endpoints';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeBlockedUser(overrides?: Partial<BlockedUser>): BlockedUser {
  return {
    user_id: 'u-blocked-001',
    created_at: '2026-11-16T10:00:00.000Z',
    ...overrides,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a fresh QueryClient per test with retry disabled so mutations fail
 * fast in error-path tests. gcTime is generous so seeded data is not
 * garbage-collected before assertions fire.
 */
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
// BLOCKED_USERS_QUERY_KEY export
// ═════════════════════════════════════════════════════════════════════════════

describe('BLOCKED_USERS_QUERY_KEY', () => {
  it('is exported as the tuple ["blocked-users"] per §7.3 query-key convention', () => {
    expect(BLOCKED_USERS_QUERY_KEY).toEqual(['blocked-users']);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (a) useBlockedUsersQuery
// ═════════════════════════════════════════════════════════════════════════════

describe('useBlockedUsersQuery — happy-path', () => {
  it('given backend returns a populated list, when hook resolves, then data is the typed BlockedUser array', async () => {
    const u1 = makeBlockedUser({ user_id: 'u-blocked-001' });
    const u2 = makeBlockedUser({ user_id: 'u-blocked-002' });
    mockList.mockResolvedValue([u1, u2]);

    const client = makeClient();
    const { result } = renderHook(() => useBlockedUsersQuery(), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.user_id).toBe('u-blocked-001');
    expect(result.current.data?.[1]?.user_id).toBe('u-blocked-002');
  });

  it('given backend returns a populated list, then isLoading transitions to false and isError stays false', async () => {
    mockList.mockResolvedValue([makeBlockedUser()]);

    const client = makeClient();
    const { result } = renderHook(() => useBlockedUsersQuery(), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});

describe('useBlockedUsersQuery — empty response', () => {
  it('given backend returns an empty array, when hook resolves, then data is []', async () => {
    mockList.mockResolvedValue([]);

    const client = makeClient();
    const { result } = renderHook(() => useBlockedUsersQuery(), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useBlockedUsersQuery — error mapping', () => {
  it('given backend throws, when hook rejects, then isError is true and error propagates', async () => {
    mockList.mockRejectedValue(new Error('Network failure'));

    const client = makeClient();
    const { result } = renderHook(() => useBlockedUsersQuery(), {
      wrapper: makeWrapper(client),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network failure');
    expect(result.current.data).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (b) useBlockUserMutation — success + broad cross-cache invalidation
// ═════════════════════════════════════════════════════════════════════════════

describe('useBlockUserMutation — success', () => {
  it('given backend accepts the block, when mutate resolves, then isSuccess is true', async () => {
    const created = makeBlockedUser({ user_id: 'u-target-001' });
    mockBlock.mockResolvedValue(created);

    const client = makeClient();
    const { result } = renderHook(() => useBlockUserMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ userId: 'u-target-001' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(created);
    expect(mockBlock).toHaveBeenCalledWith('u-target-001');
  });
});

describe('useBlockUserMutation — cross-cache purge', () => {
  async function runBlockSuccess() {
    mockBlock.mockResolvedValue(makeBlockedUser());
    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useBlockUserMutation(), {
      wrapper: makeWrapper(client),
    });
    act(() => {
      result.current.mutate({ userId: 'u-target-001' });
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    return { client, invalidateSpy };
  }

  it('given success, then ["blocked-users"] is invalidated', async () => {
    const { invalidateSpy } = await runBlockSuccess();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: BLOCKED_USERS_QUERY_KEY }),
    );
  });

  it('given success, then ["deck"] is invalidated', async () => {
    const { invalidateSpy } = await runBlockSuccess();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['deck'] }),
    );
  });

  it('given success, then ["search"] is invalidated', async () => {
    const { invalidateSpy } = await runBlockSuccess();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['search'] }),
    );
  });

  it('given success, then ["bookmarks"] is invalidated', async () => {
    const { invalidateSpy } = await runBlockSuccess();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['bookmarks'] }),
    );
  });

  it('given success, then ["friends"] is invalidated', async () => {
    const { invalidateSpy } = await runBlockSuccess();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: FRIENDS_QUERY_KEY }),
    );
  });

  it('given success, then ["friend-requests","incoming"] is invalidated', async () => {
    const { invalidateSpy } = await runBlockSuccess();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: INCOMING_REQUESTS_QUERY_KEY }),
    );
  });

  it('given success, then ["friend-requests","outgoing"] is invalidated', async () => {
    const { invalidateSpy } = await runBlockSuccess();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: OUTGOING_REQUESTS_QUERY_KEY }),
    );
  });

  it('given success, then ["rooms"] is invalidated', async () => {
    const { invalidateSpy } = await runBlockSuccess();
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['rooms'] }),
    );
  });

  it('given success, then the predicate-based messages invalidation fires (matches ["messages", *] entries)', async () => {
    mockBlock.mockResolvedValue(makeBlockedUser());
    const client = makeClient();

    // Pre-seed two message caches so there are real entries for the predicate
    // to match against.
    client.setQueryData(['messages', 'room-aaa'], []);
    client.setQueryData(['messages', 'room-bbb'], []);

    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useBlockUserMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ userId: 'u-target-001' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // The predicate-based invalidateQueries call must have been made.
    const predicateCall = invalidateSpy.mock.calls.find((call) => {
      const opts = call[0] as { predicate?: unknown } | undefined;
      return typeof opts?.predicate === 'function';
    });
    expect(predicateCall).toBeDefined();

    // The predicate must match ['messages', *] tuples and NOT match other keys.
    const opts = predicateCall![0] as { predicate: (q: { queryKey: unknown }) => boolean };
    const predicate = opts.predicate;

    expect(predicate({ queryKey: ['messages', 'room-aaa'] })).toBe(true);
    expect(predicate({ queryKey: ['messages', 'room-bbb'] })).toBe(true);
    expect(predicate({ queryKey: ['messages'] })).toBe(false); // length < 2 not matched
    expect(predicate({ queryKey: ['rooms'] })).toBe(false);
    expect(predicate({ queryKey: ['friends'] })).toBe(false);
    expect(predicate({ queryKey: ['deck'] })).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (b) useBlockUserMutation — error path
// ═════════════════════════════════════════════════════════════════════════════

describe('useBlockUserMutation — error', () => {
  it('given backend fails, when mutate rejects, then isError is true and error propagates', async () => {
    const serverError = new Error('User not found');
    mockBlock.mockRejectedValue(serverError);

    const client = makeClient();
    const { result } = renderHook(() => useBlockUserMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ userId: 'u-nonexistent-001' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(serverError);
    expect(result.current.isSuccess).toBe(false);
  });

  it('given backend fails, NO caches are invalidated', async () => {
    mockBlock.mockRejectedValue(new Error('Server error'));

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useBlockUserMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ userId: 'u-target-001' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (c) useUnblockUserMutation — success + narrow invalidation
// ═════════════════════════════════════════════════════════════════════════════

describe('useUnblockUserMutation — success', () => {
  it('given backend accepts the unblock, when mutate resolves, then isSuccess is true', async () => {
    const deleted = makeBlockedUser({ user_id: 'u-formerly-blocked-001' });
    mockUnblock.mockResolvedValue(deleted);

    const client = makeClient();
    const { result } = renderHook(() => useUnblockUserMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ userId: 'u-formerly-blocked-001' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(deleted);
    expect(mockUnblock).toHaveBeenCalledWith('u-formerly-blocked-001');
  });

  it('given success, then ["blocked-users"] is invalidated', async () => {
    mockUnblock.mockResolvedValue(makeBlockedUser());

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useUnblockUserMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ userId: 'u-formerly-blocked-001' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: BLOCKED_USERS_QUERY_KEY }),
    );
  });

  it('given success, then discovery caches (deck, search, bookmarks, friends) are NOT invalidated', async () => {
    mockUnblock.mockResolvedValue(makeBlockedUser());

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useUnblockUserMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ userId: 'u-formerly-blocked-001' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Exactly one invalidateQueries call: the blocked-users key only.
    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['deck'] }),
    );
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['search'] }),
    );
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['bookmarks'] }),
    );
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: FRIENDS_QUERY_KEY }),
    );
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: INCOMING_REQUESTS_QUERY_KEY }),
    );
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: OUTGOING_REQUESTS_QUERY_KEY }),
    );
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['rooms'] }),
    );
  });

  it('given success, then no predicate-based messages invalidation fires', async () => {
    mockUnblock.mockResolvedValue(makeBlockedUser());

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useUnblockUserMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ userId: 'u-formerly-blocked-001' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const predicateCall = invalidateSpy.mock.calls.find((call) => {
      const opts = call[0] as { predicate?: unknown } | undefined;
      return typeof opts?.predicate === 'function';
    });
    expect(predicateCall).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (d) useUnblockUserMutation — error path
// ═════════════════════════════════════════════════════════════════════════════

describe('useUnblockUserMutation — error', () => {
  it('given backend fails, when mutate rejects, then isError is true and error propagates', async () => {
    const serverError = Object.assign(new Error('Block not found'), {
      status: 404,
      code: 'NOT_FOUND',
    });
    mockUnblock.mockRejectedValue(serverError);

    const client = makeClient();
    const { result } = renderHook(() => useUnblockUserMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ userId: 'u-not-blocked-001' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(serverError);
    expect(result.current.isSuccess).toBe(false);
  });

  it('given backend fails, ["blocked-users"] cache is NOT invalidated', async () => {
    mockUnblock.mockRejectedValue(new Error('Server error'));

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useUnblockUserMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ userId: 'u-not-blocked-001' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
