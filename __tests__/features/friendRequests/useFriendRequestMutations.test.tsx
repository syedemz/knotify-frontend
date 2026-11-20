/**
 * Unit tests for mutation hooks in `src/features/friendRequests/api.ts`.
 *
 * Story 16.FR2 AC coverage:
 * (a) `useSendFriendRequestMutation` — success + outgoing cache invalidation.
 * (b) `useSendFriendRequestMutation` — 409 Conflict surfaces the ApiError in
 *     `mutation.error` WITHOUT throwing to an error boundary; callsite reads
 *     `error.status === 409` to detect "already sent" per §11.2.8.
 * (b2) `useSendFriendRequestMutation` — optimistic insert into the outgoing
 *     cache so `useFriendRequestPreflight` sees the pending row before the
 *     server echoes back. Fixes the duplicate-send bug observed 2026-11-20
 *     where preflight fail-opened on an undefined cache. Includes rollback
 *     on error and swap-for-server-row on success.
 * (c) `useAcceptFriendRequestMutation` — success + incoming AND friends caches
 *     invalidated.
 * (d) `useAcceptFriendRequestMutation` — optimistic removal: targeted row
 *     disappears from the incoming cache immediately (before server responds).
 * (e) `useAcceptFriendRequestMutation` — rollback: cache restored when server
 *     call fails.
 * (f) `useDeclineFriendRequestMutation` — success + incoming cache invalidated
 *     only (friends cache NOT touched).
 * (g) `useDeclineFriendRequestMutation` — optimistic removal.
 * (h) `useDeclineFriendRequestMutation` — rollback on error.
 * (i) `useCancelOutgoingRequestMutation` — success + outgoing cache
 *     invalidation.
 * (j) `useCancelOutgoingRequestMutation` — error propagates correctly.
 *
 * Tests stub the service boundary at `friendRequestsApi.{send,accept,decline,
 * cancel}` via `jest.mock('@/services/api/endpoints')`. No fixtures under
 * `src/services/api/mocks/` are created (real-backend-only per PRD 16.FR2).
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Service boundary stubs ────────────────────────────────────────────────────

const mockSend = jest.fn();
const mockAccept = jest.fn();
const mockDecline = jest.fn();
const mockCancel = jest.fn();
const mockListIncoming = jest.fn();
const mockListOutgoing = jest.fn();

jest.mock('@/services/api/endpoints', () => ({
  friendRequestsApi: {
    send: (...args: unknown[]) => mockSend(...args),
    accept: (...args: unknown[]) => mockAccept(...args),
    decline: (...args: unknown[]) => mockDecline(...args),
    cancel: (...args: unknown[]) => mockCancel(...args),
    listIncoming: (...args: unknown[]) => mockListIncoming(...args),
    listOutgoing: (...args: unknown[]) => mockListOutgoing(...args),
  },
  friendsApi: {},
  profileApi: {},
  matchApi: {},
}));

// Mock friends/api so FRIENDS_QUERY_KEY import resolves without real deps.
jest.mock('@/features/friends/api', () => ({
  FRIENDS_QUERY_KEY: ['friends'] as const,
}));

// friendRequests/api.ts now imports getAppsyncClient for the subscription hook
// (story 16.8). Stub it here to prevent the aws-amplify ESM chain from loading.
jest.mock('@/services/graphql/appsyncClient', () => ({
  getAppsyncClient: () => ({ graphql: jest.fn() }),
  _resetAppsyncClientForTests: jest.fn(),
}));

// ── Imports (after mock declaration) ─────────────────────────────────────────

import {
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useDeclineFriendRequestMutation,
  useCancelOutgoingRequestMutation,
  INCOMING_REQUESTS_QUERY_KEY,
  OUTGOING_REQUESTS_QUERY_KEY,
} from '@/features/friendRequests/api';
import { FRIENDS_QUERY_KEY } from '@/features/friends/api';
import type { FriendRequest } from '@/types/api/FriendRequest';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeRequest(overrides?: Partial<FriendRequest>): FriendRequest {
  return {
    request_id: 'req-001',
    from_user_id: 'u-aisha-001',
    to_user_id: 'u-me-001',
    status: 'pending',
    created_at: '2026-11-16T10:00:00.000Z',
    ...overrides,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a fresh QueryClient per test with retry disabled so mutations
 * fail fast in error-path tests.
 *
 * Note: `gcTime` is intentionally left at a generous value here (not 0) so
 * that data seeded via `setQueryData` is not immediately garbage-collected
 * between the seed call and the hook's `onMutate` execution, which is
 * important for optimistic-update and rollback tests. The mutation retry is
 * disabled so error-path tests fail fast.
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
// (a) useSendFriendRequestMutation — success + outgoing cache invalidation
// ═════════════════════════════════════════════════════════════════════════════

describe('useSendFriendRequestMutation — success', () => {
  it('given backend accepts the request, when mutate resolves, then isSuccess is true and data is the new FriendRequest row', async () => {
    const created = makeRequest({ to_user_id: 'u-sara-002', from_user_id: 'u-me-001' });
    mockSend.mockResolvedValue(created);

    const client = makeClient();
    const { result } = renderHook(() => useSendFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ toUserId: 'u-sara-002' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(created);
    expect(mockSend).toHaveBeenCalledWith('u-sara-002');
  });

  it('given success, then onSuccess invalidates the outgoing cache key', async () => {
    const created = makeRequest();
    mockSend.mockResolvedValue(created);

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useSendFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ toUserId: 'u-sara-002' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: OUTGOING_REQUESTS_QUERY_KEY }),
    );
  });

  it('given success, then onSuccess does NOT invalidate the incoming cache key', async () => {
    const created = makeRequest();
    mockSend.mockResolvedValue(created);

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useSendFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ toUserId: 'u-sara-002' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const incomingInvalidation = invalidateSpy.mock.calls.some((call) => {
      const opts = call[0] as { queryKey?: unknown } | undefined;
      const key = opts?.queryKey;
      return Array.isArray(key) && key[1] === 'incoming';
    });
    expect(incomingInvalidation).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (b) useSendFriendRequestMutation — 409 Conflict ("already sent")
// ═════════════════════════════════════════════════════════════════════════════

describe('useSendFriendRequestMutation — 409 Conflict', () => {
  it('given backend returns 409, when mutate rejects, then isError is true with the ApiError in mutation.error', async () => {
    const conflict = Object.assign(new Error('Request already exists'), {
      status: 409,
      code: 'DUPLICATE_REQUEST',
    });
    mockSend.mockRejectedValue(conflict);

    const client = makeClient();
    const { result } = renderHook(() => useSendFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ toUserId: 'u-sara-002' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(conflict);
    expect((result.current.error as typeof conflict).status).toBe(409);
    expect((result.current.error as typeof conflict).code).toBe('DUPLICATE_REQUEST');
  });

  it('given backend returns 409, mutation.isSuccess stays false (not a success)', async () => {
    const conflict = Object.assign(new Error('Request already exists'), {
      status: 409,
      code: 'DUPLICATE_REQUEST',
    });
    mockSend.mockRejectedValue(conflict);

    const client = makeClient();
    const { result } = renderHook(() => useSendFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ toUserId: 'u-sara-002' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.isSuccess).toBe(false);
  });

  it('given backend returns 409, outgoing cache is NOT invalidated', async () => {
    const conflict = Object.assign(new Error('Conflict'), {
      status: 409,
      code: 'DUPLICATE_REQUEST',
    });
    mockSend.mockRejectedValue(conflict);

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useSendFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ toUserId: 'u-sara-002' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const outgoingInvalidation = invalidateSpy.mock.calls.some((call) => {
      const opts = call[0] as { queryKey?: unknown } | undefined;
      const key = opts?.queryKey;
      return Array.isArray(key) && key[1] === 'outgoing';
    });
    expect(outgoingInvalidation).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (b2) useSendFriendRequestMutation — optimistic insert into outgoing cache
//
// Preflight (useFriendRequestPreflight) reads the OUTGOING_REQUESTS_QUERY_KEY
// cache to decide whether to block a duplicate send. Prior to 2026-11-20 the
// mutation only invalidated the cache on success — but invalidation is a
// no-op when no observer has mounted useOutgoingRequestsQuery this session
// (the common case for a user who has never opened the Requests tab). That
// let a second tap on the same deck card pass preflight and fire a doomed
// request. The optimistic insert makes the cache non-undefined immediately
// so subsequent preflights see the pending row.
// ═════════════════════════════════════════════════════════════════════════════

describe('useSendFriendRequestMutation — optimistic insert into outgoing cache', () => {
  it('given mutate is called with no prior outgoing cache, then an optimistic pending row is inserted synchronously so preflight can see it', async () => {
    // Never-settling promise so we can inspect the interim cache state before
    // the server would respond.
    let resolveSend!: (v: unknown) => void;
    mockSend.mockReturnValueOnce(new Promise((res) => { resolveSend = res; }));

    const client = makeClient();
    const { result } = renderHook(() => useSendFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    // Preconditions: no cache entry for outgoing requests — this is the
    // bug-trigger state (user never visited Outgoing tab this session).
    expect(client.getQueryData(OUTGOING_REQUESTS_QUERY_KEY)).toBeUndefined();

    act(() => {
      result.current.mutate({ toUserId: 'u-sara-002' });
    });

    // onMutate should have populated the cache with a single optimistic row
    // while the request is still in flight.
    await waitFor(() => {
      const cached = client.getQueryData<readonly FriendRequest[]>(
        OUTGOING_REQUESTS_QUERY_KEY,
      );
      return cached !== undefined && cached.length === 1;
    });

    const cached = client.getQueryData<readonly FriendRequest[]>(
      OUTGOING_REQUESTS_QUERY_KEY,
    );
    expect(cached).toBeDefined();
    expect(cached).toHaveLength(1);
    const [row] = cached!;
    expect(row?.to_user_id).toBe('u-sara-002');
    expect(row?.status).toBe('pending');
    // Marker prefix on the synthetic request_id so a swap is unambiguous.
    expect(row?.request_id.startsWith('local-optimistic-')).toBe(true);

    // Cleanup so Jest doesn't warn about open handles.
    resolveSend(makeRequest({ to_user_id: 'u-sara-002' }));
  });

  it('given existing outgoing rows in cache, then the optimistic row is appended without removing prior rows', async () => {
    let resolveSend!: (v: unknown) => void;
    mockSend.mockReturnValueOnce(new Promise((res) => { resolveSend = res; }));

    const client = makeClient();
    const priorRow = makeRequest({
      request_id: 'req-prior-001',
      to_user_id: 'u-other-010',
      status: 'pending',
    });
    client.setQueryData(OUTGOING_REQUESTS_QUERY_KEY, [priorRow]);

    const { result } = renderHook(() => useSendFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ toUserId: 'u-sara-002' });
    });

    await waitFor(() => {
      const cached = client.getQueryData<readonly FriendRequest[]>(
        OUTGOING_REQUESTS_QUERY_KEY,
      );
      return cached !== undefined && cached.length === 2;
    });

    const cached = client.getQueryData<readonly FriendRequest[]>(
      OUTGOING_REQUESTS_QUERY_KEY,
    );
    expect(cached).toHaveLength(2);
    expect(cached![0]?.request_id).toBe('req-prior-001');
    expect(cached![1]?.to_user_id).toBe('u-sara-002');

    resolveSend(makeRequest({ to_user_id: 'u-sara-002' }));
  });

  it('given server rejects with 409, then onError rolls back the optimistic insert to the pre-mutation snapshot', async () => {
    const conflict = Object.assign(new Error('already_pending'), {
      status: 409,
      code: 'UNKNOWN',
    });
    mockSend.mockRejectedValueOnce(conflict);

    const client = makeClient();
    const priorRow = makeRequest({
      request_id: 'req-prior-001',
      to_user_id: 'u-other-010',
      status: 'pending',
    });
    client.setQueryData(OUTGOING_REQUESTS_QUERY_KEY, [priorRow]);

    const { result } = renderHook(() => useSendFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ toUserId: 'u-sara-002' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // The optimistic row must be gone and the prior row intact.
    const cached = client.getQueryData<readonly FriendRequest[]>(
      OUTGOING_REQUESTS_QUERY_KEY,
    );
    expect(cached).toEqual([priorRow]);
  });

  it('given server succeeds, then onSuccess swaps the optimistic row for the server-returned row (no duplicate)', async () => {
    const serverRow = makeRequest({
      request_id: 'req-real-abc',
      to_user_id: 'u-sara-002',
      status: 'pending',
    });
    mockSend.mockResolvedValueOnce(serverRow);

    const client = makeClient();
    const { result } = renderHook(() => useSendFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ toUserId: 'u-sara-002' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const cached = client.getQueryData<readonly FriendRequest[]>(
      OUTGOING_REQUESTS_QUERY_KEY,
    );
    expect(cached).toHaveLength(1);
    expect(cached![0]?.request_id).toBe('req-real-abc');
    // No local-optimistic marker should remain in the cache.
    expect(cached!.every((r) => !r.request_id.startsWith('local-optimistic-'))).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (c) useAcceptFriendRequestMutation — success + cache invalidations
// ═════════════════════════════════════════════════════════════════════════════

describe('useAcceptFriendRequestMutation — success', () => {
  it('given backend accepts, when mutate resolves, then isSuccess is true', async () => {
    const updated = makeRequest({ status: 'accepted' });
    mockAccept.mockResolvedValue(updated);

    const client = makeClient();
    const { result } = renderHook(() => useAcceptFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-001' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockAccept).toHaveBeenCalledWith('req-001');
    expect(result.current.data).toEqual(updated);
  });

  it('given success, then onSuccess invalidates the friends cache key', async () => {
    const updated = makeRequest({ status: 'accepted' });
    mockAccept.mockResolvedValue(updated);

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useAcceptFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-001' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: FRIENDS_QUERY_KEY }),
    );
  });

  it('given success, then onSettled invalidates the incoming cache key', async () => {
    const updated = makeRequest({ status: 'accepted' });
    mockAccept.mockResolvedValue(updated);

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useAcceptFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-001' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: INCOMING_REQUESTS_QUERY_KEY }),
    );
  });

  it('given success, then outgoing cache is NOT invalidated', async () => {
    const updated = makeRequest({ status: 'accepted' });
    mockAccept.mockResolvedValue(updated);

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useAcceptFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-001' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const outgoingInvalidation = invalidateSpy.mock.calls.some((call) => {
      const opts = call[0] as { queryKey?: unknown } | undefined;
      const key = opts?.queryKey;
      return Array.isArray(key) && key[1] === 'outgoing';
    });
    expect(outgoingInvalidation).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (d) useAcceptFriendRequestMutation — optimistic removal
// ═════════════════════════════════════════════════════════════════════════════

describe('useAcceptFriendRequestMutation — optimistic update', () => {
  it('given two incoming requests in cache, when accept mutates req-001, then req-001 is removed from cache immediately', async () => {
    // Backend resolves after a small delay so we can observe the optimistic state.
    const updated = makeRequest({ status: 'accepted' });
    mockAccept.mockImplementation(
      () => new Promise<FriendRequest>((resolve) => setTimeout(() => resolve(updated), 50)),
    );

    const r1 = makeRequest({ request_id: 'req-001', from_user_id: 'u-aisha-001' });
    const r2 = makeRequest({ request_id: 'req-002', from_user_id: 'u-nadia-002' });

    const client = makeClient();
    // Pre-populate the cache so onMutate can snapshot it.
    client.setQueryData<readonly FriendRequest[]>(INCOMING_REQUESTS_QUERY_KEY, [r1, r2]);

    const { result } = renderHook(() => useAcceptFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-001' });
    });

    // After firing, the cache must be optimistically updated before the server responds.
    await waitFor(() => {
      const cached = client.getQueryData<readonly FriendRequest[]>(INCOMING_REQUESTS_QUERY_KEY);
      return (cached ?? []).every((r) => r.request_id !== 'req-001');
    });

    const cached = client.getQueryData<readonly FriendRequest[]>(INCOMING_REQUESTS_QUERY_KEY);
    expect(cached).toHaveLength(1);
    expect(cached?.[0]?.request_id).toBe('req-002');

    // Let the mutation settle to avoid open handles.
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('given empty incoming cache, when accept mutates, then setQueryData is not called with undefined', async () => {
    // Cache has no entry for the incoming key.
    mockAccept.mockResolvedValue(makeRequest({ status: 'accepted' }));

    const client = makeClient();
    const setDataSpy = jest.spyOn(client, 'setQueryData');

    const { result } = renderHook(() => useAcceptFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-001' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // setQueryData should NOT have been called with undefined as second arg.
    const calledWithUndefined = setDataSpy.mock.calls.some((call) => call[1] === undefined);
    expect(calledWithUndefined).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (e) useAcceptFriendRequestMutation — rollback on error
// ═════════════════════════════════════════════════════════════════════════════

describe('useAcceptFriendRequestMutation — rollback on error', () => {
  it('given two incoming requests in cache and server fails, when mutate rejects, then original list is restored', async () => {
    mockAccept.mockRejectedValue(new Error('Server error'));

    const r1 = makeRequest({ request_id: 'req-001', from_user_id: 'u-aisha-001' });
    const r2 = makeRequest({ request_id: 'req-002', from_user_id: 'u-nadia-002' });

    const client = makeClient();
    client.setQueryData<readonly FriendRequest[]>(INCOMING_REQUESTS_QUERY_KEY, [r1, r2]);

    const { result } = renderHook(() => useAcceptFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-001' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // After rollback the original two-item list must be restored.
    const cached = client.getQueryData<readonly FriendRequest[]>(INCOMING_REQUESTS_QUERY_KEY);
    expect(cached).toHaveLength(2);
    expect(cached?.find((r) => r.request_id === 'req-001')).toBeDefined();
    expect(cached?.find((r) => r.request_id === 'req-002')).toBeDefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (f) useDeclineFriendRequestMutation — success + cache invalidation
// ═════════════════════════════════════════════════════════════════════════════

describe('useDeclineFriendRequestMutation — success', () => {
  it('given backend declines, when mutate resolves, then isSuccess is true', async () => {
    const updated = makeRequest({ status: 'declined' });
    mockDecline.mockResolvedValue(updated);

    const client = makeClient();
    const { result } = renderHook(() => useDeclineFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-001' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDecline).toHaveBeenCalledWith('req-001');
    expect(result.current.data).toEqual(updated);
  });

  it('given success, then onSettled invalidates the incoming cache key', async () => {
    mockDecline.mockResolvedValue(makeRequest({ status: 'declined' }));

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useDeclineFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-001' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: INCOMING_REQUESTS_QUERY_KEY }),
    );
  });

  it('given success, then friends cache is NOT invalidated (decline has no friends side-effect)', async () => {
    mockDecline.mockResolvedValue(makeRequest({ status: 'declined' }));

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useDeclineFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-001' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const friendsInvalidated = invalidateSpy.mock.calls.some((call) => {
      const opts = call[0] as { queryKey?: unknown } | undefined;
      const key = opts?.queryKey;
      return Array.isArray(key) && key[0] === 'friends' && key.length === 1;
    });
    expect(friendsInvalidated).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (g) useDeclineFriendRequestMutation — optimistic removal
// ═════════════════════════════════════════════════════════════════════════════

describe('useDeclineFriendRequestMutation — optimistic update', () => {
  it('given two incoming requests in cache, when decline mutates req-001, then req-001 is removed from cache immediately', async () => {
    const updated = makeRequest({ status: 'declined' });
    mockDecline.mockImplementation(
      () => new Promise<FriendRequest>((resolve) => setTimeout(() => resolve(updated), 50)),
    );

    const r1 = makeRequest({ request_id: 'req-001', from_user_id: 'u-aisha-001' });
    const r2 = makeRequest({ request_id: 'req-002', from_user_id: 'u-nadia-002' });

    const client = makeClient();
    client.setQueryData<readonly FriendRequest[]>(INCOMING_REQUESTS_QUERY_KEY, [r1, r2]);

    const { result } = renderHook(() => useDeclineFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-001' });
    });

    await waitFor(() => {
      const cached = client.getQueryData<readonly FriendRequest[]>(INCOMING_REQUESTS_QUERY_KEY);
      return (cached ?? []).every((r) => r.request_id !== 'req-001');
    });

    const cached = client.getQueryData<readonly FriendRequest[]>(INCOMING_REQUESTS_QUERY_KEY);
    expect(cached).toHaveLength(1);
    expect(cached?.[0]?.request_id).toBe('req-002');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (h) useDeclineFriendRequestMutation — rollback on error
// ═════════════════════════════════════════════════════════════════════════════

describe('useDeclineFriendRequestMutation — rollback on error', () => {
  it('given two incoming requests in cache and server fails, when mutate rejects, then original list is restored', async () => {
    mockDecline.mockRejectedValue(new Error('Server error'));

    const r1 = makeRequest({ request_id: 'req-001', from_user_id: 'u-aisha-001' });
    const r2 = makeRequest({ request_id: 'req-002', from_user_id: 'u-nadia-002' });

    const client = makeClient();
    client.setQueryData<readonly FriendRequest[]>(INCOMING_REQUESTS_QUERY_KEY, [r1, r2]);

    const { result } = renderHook(() => useDeclineFriendRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-001' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = client.getQueryData<readonly FriendRequest[]>(INCOMING_REQUESTS_QUERY_KEY);
    expect(cached).toHaveLength(2);
    expect(cached?.find((r) => r.request_id === 'req-001')).toBeDefined();
    expect(cached?.find((r) => r.request_id === 'req-002')).toBeDefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (i) useCancelOutgoingRequestMutation — success + outgoing cache invalidation
// ═════════════════════════════════════════════════════════════════════════════

describe('useCancelOutgoingRequestMutation — success', () => {
  it('given backend cancels the request, when mutate resolves, then isSuccess is true', async () => {
    const updated = makeRequest({
      request_id: 'req-out-001',
      from_user_id: 'u-me-001',
      to_user_id: 'u-sara-002',
      status: 'cancelled',
    });
    mockCancel.mockResolvedValue(updated);

    const client = makeClient();
    const { result } = renderHook(() => useCancelOutgoingRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-out-001' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCancel).toHaveBeenCalledWith('req-out-001');
    expect(result.current.data).toEqual(updated);
  });

  it('given success, then onSuccess invalidates the outgoing cache key', async () => {
    mockCancel.mockResolvedValue(makeRequest({ status: 'cancelled' }));

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useCancelOutgoingRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-out-001' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: OUTGOING_REQUESTS_QUERY_KEY }),
    );
  });

  it('given success, then incoming cache and friends cache are NOT invalidated', async () => {
    mockCancel.mockResolvedValue(makeRequest({ status: 'cancelled' }));

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useCancelOutgoingRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-out-001' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const incomingOrFriendsInvalidated = invalidateSpy.mock.calls.some((call) => {
      const opts = call[0] as { queryKey?: unknown } | undefined;
      const key = opts?.queryKey;
      if (!Array.isArray(key)) return false;
      return (key[1] === 'incoming') || (key[0] === 'friends' && key.length === 1);
    });
    expect(incomingOrFriendsInvalidated).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (j) useCancelOutgoingRequestMutation — error propagation
// ═════════════════════════════════════════════════════════════════════════════

describe('useCancelOutgoingRequestMutation — error', () => {
  it('given backend fails, when mutate rejects, then isError is true and error propagates', async () => {
    const serverError = new Error('Request not found');
    mockCancel.mockRejectedValue(serverError);

    const client = makeClient();
    const { result } = renderHook(() => useCancelOutgoingRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-out-404' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(serverError);
    expect(result.current.isSuccess).toBe(false);
  });

  it('given backend fails, outgoing cache is NOT invalidated', async () => {
    mockCancel.mockRejectedValue(new Error('Server error'));

    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useCancelOutgoingRequestMutation(), {
      wrapper: makeWrapper(client),
    });

    act(() => {
      result.current.mutate({ requestId: 'req-out-001' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const outgoingInvalidated = invalidateSpy.mock.calls.some((call) => {
      const opts = call[0] as { queryKey?: unknown } | undefined;
      const key = opts?.queryKey;
      return Array.isArray(key) && key[1] === 'outgoing';
    });
    expect(outgoingInvalidated).toBe(false);
  });
});
