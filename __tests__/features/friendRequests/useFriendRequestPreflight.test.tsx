/**
 * Unit tests for `useFriendRequestPreflight`.
 *
 * Covers:
 *  (a) `canSend: true` when both caches are empty (fail-open).
 *  (b) `canSend: true` when both caches are `undefined` (never fetched).
 *  (c) `canSend: false, reason: 'already_friends'` when target is in
 *      `['friends']` cache.
 *  (d) `canSend: false, reason: 'already_sent'` when a pending outgoing
 *      request to target exists.
 *  (e) `already_friends` takes precedence over `already_sent` when both
 *      conditions are true (shouldn't happen in practice but defines the
 *      contract).
 *  (f) An outgoing request with `status !== 'pending'` is ignored.
 *  (g) Empty `targetUserId` returns `{ canSend: true }`.
 */

import React from 'react';
import { renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useFriendRequestPreflight } from '@/features/friendRequests/useFriendRequestPreflight';
import { FRIENDS_QUERY_KEY } from '@/features/friends/api';
import { OUTGOING_REQUESTS_QUERY_KEY } from '@/features/friendRequests/api';
import type { Friend } from '@/types/api/Friend';
import type { FriendRequest } from '@/types/api/FriendRequest';

// ── Service boundary stubs (needed so the api module imports cleanly) ────────

jest.mock('@/services/api/endpoints', () => ({
  friendRequestsApi: {},
  friendsApi: {},
  profileApi: {},
  matchApi: {},
}));

jest.mock('@/services/graphql/appsyncClient', () => ({
  getAppsyncClient: () => ({ graphql: jest.fn() }),
  _resetAppsyncClientForTests: jest.fn(),
}));

jest.mock('@/state/ownProfile/OwnProfileProvider', () => ({
  useOwnProfile: () => ({
    profile: { user_id: 'u-me-001' },
    status: 'ready',
    error: null,
    refresh: jest.fn(),
  }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeFriend(user_id: string): Friend {
  // Minimal shape — the preflight only reads user_id.
  return { user_id } as Friend;
}

function makeOutgoingRequest(
  request_id: string,
  to_user_id: string,
  status: FriendRequest['status'] = 'pending',
): FriendRequest {
  return {
    request_id,
    from_user_id: 'u-me-001',
    to_user_id,
    status,
    created_at: '2026-11-19T10:00:00.000Z',
  };
}

// ── Helper ───────────────────────────────────────────────────────────────────

function makeWrapperWithClient(seed?: {
  friends?: readonly Friend[];
  outgoing?: readonly FriendRequest[];
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  if (seed?.friends !== undefined) {
    client.setQueryData(FRIENDS_QUERY_KEY, seed.friends);
  }
  if (seed?.outgoing !== undefined) {
    client.setQueryData(OUTGOING_REQUESTS_QUERY_KEY, seed.outgoing);
  }
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
  return Wrapper;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useFriendRequestPreflight — empty / undefined caches (fail-open)', () => {
  it('returns canSend: true when both caches are empty', () => {
    const Wrapper = makeWrapperWithClient({ friends: [], outgoing: [] });
    const { result } = renderHook(() => useFriendRequestPreflight(), { wrapper: Wrapper });
    expect(result.current('u-target-001')).toEqual({ canSend: true });
  });

  it('returns canSend: true when neither cache has been populated', () => {
    const Wrapper = makeWrapperWithClient();
    const { result } = renderHook(() => useFriendRequestPreflight(), { wrapper: Wrapper });
    expect(result.current('u-target-001')).toEqual({ canSend: true });
  });
});

describe('useFriendRequestPreflight — already_friends', () => {
  it('returns canSend: false, reason: already_friends when target is in the friends cache', () => {
    const Wrapper = makeWrapperWithClient({
      friends: [makeFriend('u-aisha'), makeFriend('u-target-001')],
      outgoing: [],
    });
    const { result } = renderHook(() => useFriendRequestPreflight(), { wrapper: Wrapper });
    expect(result.current('u-target-001')).toEqual({
      canSend: false,
      reason: 'already_friends',
    });
  });

  it('returns canSend: true when target is not in the friends cache', () => {
    const Wrapper = makeWrapperWithClient({
      friends: [makeFriend('u-aisha')],
      outgoing: [],
    });
    const { result } = renderHook(() => useFriendRequestPreflight(), { wrapper: Wrapper });
    expect(result.current('u-target-001')).toEqual({ canSend: true });
  });
});

describe('useFriendRequestPreflight — already_sent', () => {
  it('returns canSend: false, reason: already_sent when a pending outgoing to target exists', () => {
    const Wrapper = makeWrapperWithClient({
      friends: [],
      outgoing: [makeOutgoingRequest('req-001', 'u-target-001')],
    });
    const { result } = renderHook(() => useFriendRequestPreflight(), { wrapper: Wrapper });
    expect(result.current('u-target-001')).toEqual({
      canSend: false,
      reason: 'already_sent',
    });
  });

  it('ignores outgoing requests with status !== pending', () => {
    const Wrapper = makeWrapperWithClient({
      friends: [],
      outgoing: [
        makeOutgoingRequest('req-001', 'u-target-001', 'declined'),
        makeOutgoingRequest('req-002', 'u-target-001', 'cancelled'),
      ],
    });
    const { result } = renderHook(() => useFriendRequestPreflight(), { wrapper: Wrapper });
    expect(result.current('u-target-001')).toEqual({ canSend: true });
  });

  it('ignores pending outgoing requests addressed to a different user', () => {
    const Wrapper = makeWrapperWithClient({
      friends: [],
      outgoing: [makeOutgoingRequest('req-001', 'u-other-002')],
    });
    const { result } = renderHook(() => useFriendRequestPreflight(), { wrapper: Wrapper });
    expect(result.current('u-target-001')).toEqual({ canSend: true });
  });
});

describe('useFriendRequestPreflight — precedence', () => {
  it('already_friends takes precedence over already_sent when both are true', () => {
    const Wrapper = makeWrapperWithClient({
      friends: [makeFriend('u-target-001')],
      outgoing: [makeOutgoingRequest('req-001', 'u-target-001')],
    });
    const { result } = renderHook(() => useFriendRequestPreflight(), { wrapper: Wrapper });
    expect(result.current('u-target-001')).toEqual({
      canSend: false,
      reason: 'already_friends',
    });
  });
});

describe('useFriendRequestPreflight — defensive paths', () => {
  it('returns canSend: true when targetUserId is empty', () => {
    const Wrapper = makeWrapperWithClient({
      friends: [makeFriend('')],
      outgoing: [makeOutgoingRequest('req-001', '')],
    });
    const { result } = renderHook(() => useFriendRequestPreflight(), { wrapper: Wrapper });
    expect(result.current('')).toEqual({ canSend: true });
  });
});
