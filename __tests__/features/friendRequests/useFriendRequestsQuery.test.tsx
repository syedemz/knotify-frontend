/**
 * Unit tests for `src/features/friendRequests/api.ts` —
 * `useIncomingRequestsQuery` and `useOutgoingRequestsQuery`.
 *
 * AC coverage (story 16.FR1):
 * (a) Happy-path — backend returns a populated list; `data` holds typed
 *     `FriendRequest[]` arrays.
 * (b) Loading / error state flags transition correctly on success.
 * (c) Empty response — backend returns `[]`; `data` is an empty array.
 * (d) Error mapping — backend throws; `isError` is true and `error`
 *     propagates to the caller.
 * (e) Query key exports — `INCOMING_REQUESTS_QUERY_KEY` and
 *     `OUTGOING_REQUESTS_QUERY_KEY` match the §7.3 tuple convention.
 * (f) Each hook calls the correct endpoint helper (listIncoming vs.
 *     listOutgoing) so the two query keys remain isolated.
 *
 * Tests stub the service boundary at `friendRequestsApi.listIncoming` and
 * `friendRequestsApi.listOutgoing` (via `jest.mock('@/services/api/endpoints')`)
 * — no fixtures under `src/services/api/mocks/` are created
 * (real-backend-only per PRD 16.FR1).
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Service boundary stubs ────────────────────────────────────────────────────

const mockListIncoming = jest.fn();
const mockListOutgoing = jest.fn();

jest.mock('@/services/api/endpoints', () => ({
  friendRequestsApi: {
    listIncoming: (...args: unknown[]) => mockListIncoming(...args),
    listOutgoing: (...args: unknown[]) => mockListOutgoing(...args),
  },
  // Other exports are unused in this test; keep the module shape intact.
  profileApi: {},
  matchApi: {},
  friendsApi: {},
}));

// ── Imports (after mock declaration) ─────────────────────────────────────────

import {
  useIncomingRequestsQuery,
  useOutgoingRequestsQuery,
  INCOMING_REQUESTS_QUERY_KEY,
  OUTGOING_REQUESTS_QUERY_KEY,
} from '@/features/friendRequests/api';
import type { FriendRequest } from '@/types/api/FriendRequest';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/**
 * Minimal `FriendRequest` fixture — only the fields exercised by the hook
 * layer. The hook surfaces the array as-is; field completeness is the
 * backend's responsibility.
 */
function makeIncomingRequest(
  request_id: string,
  from_user_id: string,
  to_user_id: string = 'u-me-001',
): FriendRequest {
  return {
    request_id,
    from_user_id,
    to_user_id,
    status: 'pending',
    created_at: '2026-11-16T10:00:00.000Z',
  };
}

function makeOutgoingRequest(
  request_id: string,
  to_user_id: string,
  from_user_id: string = 'u-me-001',
): FriendRequest {
  return {
    request_id,
    from_user_id,
    to_user_id,
    status: 'pending',
    created_at: '2026-11-16T11:00:00.000Z',
  };
}

// ── Wrapper — fresh QueryClient per test to isolate cache ─────────────────────

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── (e) Query key exports ─────────────────────────────────────────────────────

describe('INCOMING_REQUESTS_QUERY_KEY', () => {
  it('is exported as the tuple ["friend-requests", "incoming"] per §7.3 query-key convention', () => {
    expect(INCOMING_REQUESTS_QUERY_KEY).toEqual(['friend-requests', 'incoming']);
  });
});

describe('OUTGOING_REQUESTS_QUERY_KEY', () => {
  it('is exported as the tuple ["friend-requests", "outgoing"] per §7.3 query-key convention', () => {
    expect(OUTGOING_REQUESTS_QUERY_KEY).toEqual(['friend-requests', 'outgoing']);
  });
});

// ── useIncomingRequestsQuery ──────────────────────────────────────────────────

describe('useIncomingRequestsQuery — happy-path', () => {
  it('given backend returns a populated incoming list, when hook resolves, then data is the typed FriendRequest array', async () => {
    const r1 = makeIncomingRequest('req-001', 'u-aisha-001');
    const r2 = makeIncomingRequest('req-002', 'u-nadia-002');
    mockListIncoming.mockResolvedValue([r1, r2]);

    const { result } = renderHook(() => useIncomingRequestsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.request_id).toBe('req-001');
    expect(result.current.data?.[0]?.from_user_id).toBe('u-aisha-001');
    expect(result.current.data?.[1]?.request_id).toBe('req-002');
    expect(result.current.data?.[1]?.from_user_id).toBe('u-nadia-002');
  });

  it('given backend returns a populated incoming list, then isLoading transitions to false and isError stays false', async () => {
    const r1 = makeIncomingRequest('req-001', 'u-aisha-001');
    mockListIncoming.mockResolvedValue([r1]);

    const { result } = renderHook(() => useIncomingRequestsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useIncomingRequestsQuery — empty response', () => {
  it('given backend returns an empty array, when hook resolves, then data is []', async () => {
    mockListIncoming.mockResolvedValue([]);

    const { result } = renderHook(() => useIncomingRequestsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useIncomingRequestsQuery — error mapping', () => {
  it('given backend throws, when hook rejects, then isError is true and error propagates', async () => {
    mockListIncoming.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useIncomingRequestsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network failure');
    expect(result.current.data).toBeUndefined();
  });

  it('given backend throws a 500 ApiError, when hook rejects, then the original error object is surfaced', async () => {
    const apiError = Object.assign(new Error('Internal Server Error'), {
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });
    mockListIncoming.mockRejectedValue(apiError);

    const { result } = renderHook(() => useIncomingRequestsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(apiError);
  });
});

// ── useOutgoingRequestsQuery ──────────────────────────────────────────────────

describe('useOutgoingRequestsQuery — happy-path', () => {
  it('given backend returns a populated outgoing list, when hook resolves, then data is the typed FriendRequest array', async () => {
    const r1 = makeOutgoingRequest('req-out-001', 'u-sara-001');
    const r2 = makeOutgoingRequest('req-out-002', 'u-hana-002');
    mockListOutgoing.mockResolvedValue([r1, r2]);

    const { result } = renderHook(() => useOutgoingRequestsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.request_id).toBe('req-out-001');
    expect(result.current.data?.[0]?.to_user_id).toBe('u-sara-001');
    expect(result.current.data?.[1]?.request_id).toBe('req-out-002');
    expect(result.current.data?.[1]?.to_user_id).toBe('u-hana-002');
  });

  it('given backend returns a populated outgoing list, then isLoading transitions to false and isError stays false', async () => {
    const r1 = makeOutgoingRequest('req-out-001', 'u-sara-001');
    mockListOutgoing.mockResolvedValue([r1]);

    const { result } = renderHook(() => useOutgoingRequestsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useOutgoingRequestsQuery — empty response', () => {
  it('given backend returns an empty array, when hook resolves, then data is []', async () => {
    mockListOutgoing.mockResolvedValue([]);

    const { result } = renderHook(() => useOutgoingRequestsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useOutgoingRequestsQuery — error mapping', () => {
  it('given backend throws, when hook rejects, then isError is true and error propagates', async () => {
    mockListOutgoing.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useOutgoingRequestsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network failure');
    expect(result.current.data).toBeUndefined();
  });

  it('given backend throws a 500 ApiError, when hook rejects, then the original error object is surfaced', async () => {
    const apiError = Object.assign(new Error('Internal Server Error'), {
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
    });
    mockListOutgoing.mockRejectedValue(apiError);

    const { result } = renderHook(() => useOutgoingRequestsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(apiError);
  });
});

// ── (f) Endpoint isolation — each hook calls only its own endpoint helper ─────

describe('endpoint isolation', () => {
  it('useIncomingRequestsQuery calls listIncoming and not listOutgoing', async () => {
    mockListIncoming.mockResolvedValue([]);

    const { result } = renderHook(() => useIncomingRequestsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockListIncoming).toHaveBeenCalledTimes(1);
    expect(mockListOutgoing).not.toHaveBeenCalled();
  });

  it('useOutgoingRequestsQuery calls listOutgoing and not listIncoming', async () => {
    mockListOutgoing.mockResolvedValue([]);

    const { result } = renderHook(() => useOutgoingRequestsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockListOutgoing).toHaveBeenCalledTimes(1);
    expect(mockListIncoming).not.toHaveBeenCalled();
  });
});
