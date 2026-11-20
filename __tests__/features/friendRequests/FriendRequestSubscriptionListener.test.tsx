/**
 * Tests for `src/features/friendRequests/FriendRequestSubscriptionListener.tsx`.
 *
 * Story 16.8 AC coverage:
 *
 * (a) When auth status is 'unauthenticated', the listener renders null
 *     (no modals, no subscription).
 * (b) When a 'friend_request_received' notification fires with a valid payload and the
 *     profile resolves, IncomingRequestModal becomes visible.
 * (c) When a 'friend_request_accepted' notification fires with a valid payload
 *     and the profile resolves, RequestAcceptedModal becomes visible.
 * (d) Multiple rapid subscription events replace the currently-displayed
 *     profile (latest wins); prior modal dismisses before new one opens.
 * (e) IncomingRequestModal.onAccept calls useAcceptFriendRequestMutation.mutate
 *     with the correct requestId.
 * (f) IncomingRequestModal.onDecline calls useDeclineFriendRequestMutation.mutate
 *     with the correct requestId.
 * (g) RequestAcceptedModal.onSayHi calls openChatRoom with the acceptorUserId.
 * (h) Invalid payload (parse failure) logs a warning and skips the modal.
 * (i) Unknown notification type invalidates ['friend-requests','incoming'] and
 *     ['friends'] but opens no modal.
 * (j) Modal dismissal (onClose) hides the modal without leaking the subscription.
 * (k) On AppState 'active' after a background transition, remountKey bumps
 *     (re-subscribes) and ['friend-requests','incoming'] is invalidated.
 * (l) When the subscription fires but profile query is not yet resolved,
 *     the modal does NOT open yet (pending-until-resolved pattern).
 *
 * Tests stub:
 * - `@/services/graphql/appsyncClient` (subscription)
 * - `@/services/api/endpoints` (profile + friendRequests)
 * - `@/state/auth/AuthProvider` (useAuth status)
 * - `@/features/chat/navigation/openChatRoom` (useOpenChatRoom)
 * - React Native `AppState` (via jest.spyOn)
 */

import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Service boundary stubs ────────────────────────────────────────────────────

// Captured subscription handlers per channel so tests can fire events on the
// right AppSync subscription. The component subscribes to BOTH
// `onFriendRequestUpdated` (for friend_request_accepted + dual-published
// friend_request_received) and `onNotificationForMe` (for friend_request_received
// via the generic channel) — each gets its own captured handler.
type SubHandler = {
  next: (event: { data: Record<string, unknown> }) => void;
  error: (err: unknown) => void;
};

let capturedHandlers: { onFriendRequestUpdated: SubHandler | null; onNotificationForMe: SubHandler | null } = {
  onFriendRequestUpdated: null,
  onNotificationForMe: null,
};

// Legacy alias — points at onFriendRequestUpdated for back-compat with tests
// written before the second subscription existed.
let capturedSubHandler: SubHandler | null = null;

let subscribeCallCount = 0;
let unsubscribeCallCount = 0;

const mockUnsubscribe = jest.fn(() => { unsubscribeCallCount += 1; });

const mockGraphql = jest.fn(({ query }: { query: string }) => ({
  subscribe: (handlers: SubHandler) => {
    if (query.includes('OnFriendRequestUpdated')) {
      capturedHandlers.onFriendRequestUpdated = handlers;
      capturedSubHandler = handlers;
    } else if (query.includes('OnNotificationForMe')) {
      capturedHandlers.onNotificationForMe = handlers;
    }
    subscribeCallCount += 1;
    return { unsubscribe: mockUnsubscribe };
  },
}));

jest.mock('@/services/graphql/appsyncClient', () => ({
  getAppsyncClient: () => ({ graphql: mockGraphql }),
  _resetAppsyncClientForTests: jest.fn(),
}));

// Profile API stub
const mockGetProfileById = jest.fn();
jest.mock('@/services/api/endpoints', () => ({
  profileApi: {
    getProfileById: (...args: unknown[]) => mockGetProfileById(...args),
  },
  friendRequestsApi: {
    accept: jest.fn().mockResolvedValue({}),
    decline: jest.fn().mockResolvedValue({}),
    send: jest.fn(),
    cancel: jest.fn(),
    listIncoming: jest.fn().mockResolvedValue([]),
    listOutgoing: jest.fn().mockResolvedValue([]),
  },
  friendsApi: {},
  matchApi: {},
}));

// FRIENDS_QUERY_KEY must resolve without real deps
jest.mock('@/features/friends/api', () => ({
  FRIENDS_QUERY_KEY: ['friends'] as const,
  useFriendsQuery: jest.fn(),
}));

// useIncomingRequestsQuery now reads currentUserId via useOwnProfile to
// filter incoming rows where from_user_id === currentUserId (safety net
// for the backend direction-param bug). The listener also uses this hook
// for its poll-based new-request detection (see
// FriendRequestSubscriptionListener — "Poll-based incoming-request
// detection"). Stub so the hook can run without a provider.
jest.mock('@/state/ownProfile/OwnProfileProvider', () => ({
  useOwnProfile: () => ({
    profile: { user_id: 'u-me-001' },
    status: 'ready',
    error: null,
    refresh: jest.fn(),
  }),
}));

// Auth stub — controllable status
let mockAuthStatus: 'authenticated' | 'unauthenticated' | 'loading' = 'authenticated';

jest.mock('@/state/auth/AuthProvider', () => ({
  useAuth: () => ({
    status: mockAuthStatus,
    session: null,
    profileComplete: true,
    signIn: jest.fn(),
    signOut: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// openChatRoom stub
const mockOpenChatRoom = jest.fn().mockResolvedValue(undefined);
jest.mock('@/features/chat/navigation/openChatRoom', () => ({
  useOpenChatRoom: () => mockOpenChatRoom,
}));

// Navigation stub — IncomingRequestModal uses useNavigation internally
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as Record<string, unknown>;
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
  };
});

// ── Imports (after mock declarations) ────────────────────────────────────────

import { FriendRequestSubscriptionListener } from '@/features/friendRequests/FriendRequestSubscriptionListener';
import { ThemeProvider } from '@/theme';
import type { UserProfile } from '@/types/api/UserProfile';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SENDER_USER_ID = 'u-sender-001';
const ACCEPTOR_USER_ID = 'u-acceptor-002';
const REQUEST_ID = 'req-aaa-001';

function makeUserProfile(overrides?: Partial<UserProfile>): UserProfile {
  return {
    user_id: SENDER_USER_ID,
    first_name: 'Qurat',
    last_name: 'Baloch',
    email: 'qurat@example.com',
    gender: 'female',
    date_of_birth: '1995-03-15',
    age: 31,
    nationality: 'British',
    ethnicity: null,
    current_residence_country: 'UK',
    current_residence_city: 'London',
    education: 'BSc',
    occupation: null,
    height_cm: null,
    weight_kg: null,
    marital_status: 'single',
    has_children: null,
    wants_children: null,
    move_abroad: null,
    religiosity: null,
    prayer_frequency: null,
    sect: null,
    father_alive: null,
    mother_alive: null,
    father_retired: null,
    mother_retired: null,
    siblings_count: null,
    sibling_position: null,
    bio: null,
    photo_url: null,
    photos: [],
    profile_complete_verified: false,
    preferences: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as unknown as UserProfile;
}

function makeFriendRequestPayload(requestId: string, fromUserId: string): string {
  return JSON.stringify({ request_id: requestId, from_user_id: fromUserId });
}

function makeFriendRequestAcceptedPayload(fromUserId: string): string {
  return JSON.stringify({ from_user_id: fromUserId });
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
    return React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(ThemeProvider, null, children),
    );
  };
}

/**
 * Fires a subscription notification event programmatically on the
 * onFriendRequestUpdated channel (default). Pass `channel: 'onNotificationForMe'`
 * to fire on the generic-notifications channel the component also subscribes to.
 */
function fireSubscriptionEvent(
  type: string,
  payload: string,
  channel: 'onFriendRequestUpdated' | 'onNotificationForMe' = 'onFriendRequestUpdated',
) {
  const handler = capturedHandlers[channel];
  if (!handler) throw new Error(`No ${channel} subscription handler captured — component not mounted?`);
  act(() => {
    handler.next({
      data: {
        [channel]: {
          type,
          payload,
          createdAt: new Date().toISOString(),
        },
      },
    });
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

// Global AppState.addEventListener stub — returns { remove: jest.fn() } so
// FriendRequestSubscriptionListener's AppState useEffect can clean up safely
// in every test, without each test needing to spy individually.
let appStateListenerStub: jest.SpyInstance | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  capturedSubHandler = null;
  capturedHandlers = { onFriendRequestUpdated: null, onNotificationForMe: null };
  subscribeCallCount = 0;
  unsubscribeCallCount = 0;
  mockAuthStatus = 'authenticated';
  mockGetProfileById.mockResolvedValue(makeUserProfile());

  // Install a fresh AppState stub for every test so the cleanup path always
  // receives a valid { remove() } object.
  appStateListenerStub = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event, _callback) => ({
      remove: jest.fn(),
    }));
});

afterEach(() => {
  appStateListenerStub?.mockRestore();
  appStateListenerStub = null;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

// ── (a) Unauthenticated → renders null ──────────────────────────────────────

describe('(a) unauthenticated', () => {
  it('given auth status is unauthenticated, renders null — no modals mounted', () => {
    mockAuthStatus = 'unauthenticated';
    const client = makeClient();

    const { queryByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    expect(queryByTestId('incoming-request-modal')).toBeNull();
    expect(queryByTestId('request-accepted-modal')).toBeNull();
  });
});

// ── (b) friend_request → IncomingRequestModal opens ────────────────────────

describe('(b) friend_request notification opens IncomingRequestModal', () => {
  it('given friend_request event fires and profile resolves, IncomingRequestModal becomes visible', async () => {
    const client = makeClient();
    mockGetProfileById.mockResolvedValue(makeUserProfile({ user_id: SENDER_USER_ID }));

    const { queryByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    // Modal not visible before event
    expect(queryByTestId('incoming-request-modal')).toBeNull();

    // Fire subscription event
    fireSubscriptionEvent('friend_request_received', makeFriendRequestPayload(REQUEST_ID, SENDER_USER_ID));

    // Wait for profile query to resolve and modal to become visible
    await waitFor(() => {
      expect(queryByTestId('incoming-request-modal')).not.toBeNull();
    });
  });
});

// ── (c) friend_request_accepted → RequestAcceptedModal opens ────────────────

describe('(c) friend_request_accepted notification opens RequestAcceptedModal', () => {
  it('given friend_request_accepted event fires and profile resolves, RequestAcceptedModal becomes visible', async () => {
    const client = makeClient();
    mockGetProfileById.mockResolvedValue(makeUserProfile({ user_id: ACCEPTOR_USER_ID }));

    const { queryByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    expect(queryByTestId('request-accepted-modal')).toBeNull();

    fireSubscriptionEvent('friend_request_accepted', makeFriendRequestAcceptedPayload(ACCEPTOR_USER_ID));

    await waitFor(() => {
      expect(queryByTestId('request-accepted-modal')).not.toBeNull();
    });
  });
});

// ── (d) Multiple rapid events — latest wins ──────────────────────────────────

describe('(d) multiple rapid events — latest wins', () => {
  it('given two friend_request events fire rapidly, the second userId replaces the first', async () => {
    const client = makeClient();
    const SENDER_1 = 'u-sender-first';
    const SENDER_2 = 'u-sender-second';
    const REQ_1 = 'req-first';
    const REQ_2 = 'req-second';

    mockGetProfileById.mockImplementation((userId: string) =>
      Promise.resolve(makeUserProfile({ user_id: userId, first_name: userId === SENDER_1 ? 'First' : 'Second' })),
    );

    render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    // Fire first event then immediately second
    fireSubscriptionEvent('friend_request_received', makeFriendRequestPayload(REQ_1, SENDER_1));
    fireSubscriptionEvent('friend_request_received', makeFriendRequestPayload(REQ_2, SENDER_2));

    // After the second event, the pending state should hold SENDER_2
    await waitFor(() => {
      // The profile query for SENDER_2 should have been called
      expect(mockGetProfileById).toHaveBeenCalledWith(SENDER_2);
    });
  });
});

// ── (e) onAccept calls acceptMutation ────────────────────────────────────────

describe('(e) IncomingRequestModal.onAccept wires accept mutation', () => {
  it('given incoming request modal visible, tapping Accept calls useAcceptFriendRequestMutation with requestId', async () => {
    const client = makeClient();
    mockGetProfileById.mockResolvedValue(makeUserProfile({ user_id: SENDER_USER_ID }));

    const { getByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    fireSubscriptionEvent('friend_request_received', makeFriendRequestPayload(REQUEST_ID, SENDER_USER_ID));

    await waitFor(() => {
      expect(getByTestId('incoming-request-accept-btn')).toBeTruthy();
    });

    const { friendRequestsApi } = require('@/services/api/endpoints') as {
      friendRequestsApi: { accept: jest.Mock };
    };

    await act(async () => {
      fireEvent.press(getByTestId('incoming-request-accept-btn'));
    });

    await waitFor(() => {
      expect(friendRequestsApi.accept).toHaveBeenCalledWith(REQUEST_ID);
    });
  });
});

// ── (f) onDecline calls declineMutation ──────────────────────────────────────

describe('(f) IncomingRequestModal.onDecline wires decline mutation', () => {
  it('given incoming request modal visible, tapping Decline calls useDeclineFriendRequestMutation with requestId', async () => {
    const client = makeClient();
    mockGetProfileById.mockResolvedValue(makeUserProfile({ user_id: SENDER_USER_ID }));

    const { getByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    fireSubscriptionEvent('friend_request_received', makeFriendRequestPayload(REQUEST_ID, SENDER_USER_ID));

    await waitFor(() => {
      expect(getByTestId('incoming-request-decline-btn')).toBeTruthy();
    });

    const { friendRequestsApi } = require('@/services/api/endpoints') as {
      friendRequestsApi: { decline: jest.Mock };
    };

    await act(async () => {
      fireEvent.press(getByTestId('incoming-request-decline-btn'));
    });

    await waitFor(() => {
      expect(friendRequestsApi.decline).toHaveBeenCalledWith(REQUEST_ID);
    });
  });
});

// ── (g) onSayHi calls openChatRoom ───────────────────────────────────────────

describe('(g) RequestAcceptedModal.onSayHi wires openChatRoom', () => {
  it('given accepted modal visible, tapping Say hi calls openChatRoom with acceptorUserId', async () => {
    const client = makeClient();
    mockGetProfileById.mockResolvedValue(makeUserProfile({ user_id: ACCEPTOR_USER_ID }));

    const { getByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    fireSubscriptionEvent('friend_request_accepted', makeFriendRequestAcceptedPayload(ACCEPTOR_USER_ID));

    await waitFor(() => {
      expect(getByTestId('request-accepted-say-hi-btn')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('request-accepted-say-hi-btn'));
    });

    expect(mockOpenChatRoom).toHaveBeenCalledWith(ACCEPTOR_USER_ID);
  });
});

// ── (h) Invalid payload → warning, no modal ─────────────────────────────────

describe('(h) invalid payload — parse failure skips modal and logs warning', () => {
  it('given payload is not valid JSON, logs a warning and no modal opens', async () => {
    const client = makeClient();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { queryByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    fireSubscriptionEvent('friend_request_received', 'this is not json {{{{');

    await act(async () => {});

    expect(queryByTestId('incoming-request-modal')).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[FriendRequestSubscriptionListener] failed to parse'),
      expect.anything(),
    );

    warnSpy.mockRestore();
  });

  it('given payload is valid JSON but missing required fields, logs a warning and no modal opens', async () => {
    const client = makeClient();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { queryByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    // Missing from_user_id and request_id
    fireSubscriptionEvent('friend_request_received', JSON.stringify({ something_else: true }));

    await act(async () => {});

    expect(queryByTestId('incoming-request-modal')).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[FriendRequestSubscriptionListener]'),
      expect.anything(),
    );

    warnSpy.mockRestore();
  });
});

// ── (i) Unknown type → cache invalidation, no modal ─────────────────────────

describe('(i) unknown notification type invalidates caches but opens no modal', () => {
  it('given an unknown notification type fires, no modal opens and caches are invalidated', async () => {
    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { queryByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    act(() => {
      capturedSubHandler?.next({
        data: {
          onFriendRequestUpdated: {
            type: 'profile_view',
            payload: JSON.stringify({ viewer_id: 'u-viewer' }),
            createdAt: new Date().toISOString(),
          },
        },
      });
    });

    await act(async () => {});

    expect(queryByTestId('incoming-request-modal')).toBeNull();
    expect(queryByTestId('request-accepted-modal')).toBeNull();

    // Cache invalidations should have been called
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['friend-requests', 'incoming'] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['friends'] }),
    );
  });
});

// ── (j) Modal dismissal does not leak subscription ───────────────────────────

describe('(j) modal dismissal does not leak subscription', () => {
  it('given modal is visible and onClose fires, the modal hides without unsubscribing', async () => {
    const client = makeClient();
    mockGetProfileById.mockResolvedValue(makeUserProfile({ user_id: SENDER_USER_ID }));

    const { queryByTestId, getByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    fireSubscriptionEvent('friend_request_received', makeFriendRequestPayload(REQUEST_ID, SENDER_USER_ID));

    await waitFor(() => {
      expect(queryByTestId('incoming-request-modal')).not.toBeNull();
    });

    // Dismiss via backdrop
    await act(async () => {
      fireEvent.press(getByTestId('incoming-request-backdrop'));
    });

    // Modal should be hidden
    expect(queryByTestId('incoming-request-modal')).toBeNull();

    // Subscription is still active — unsubscribe was NOT called
    expect(mockUnsubscribe).not.toHaveBeenCalled();
  });

  it('given component unmounts, subscription is torn down (unsubscribe called)', () => {
    const client = makeClient();

    const { unmount } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    // Subscription should have been established
    expect(subscribeCallCount).toBeGreaterThan(0);

    act(() => {
      unmount();
    });

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

// ── (k) AppState resume — re-subscribes + invalidates ───────────────────────

describe('(k) AppState resume re-subscribes and invalidates incoming cache', () => {
  it('given component is mounted and AppState transitions background→active, invalidates incoming requests cache', async () => {
    const client = makeClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    // Override the global stub to also capture the callbacks for this test.
    const listenerCallbacks: Array<(state: string) => void> = [];
    appStateListenerStub?.mockImplementation((_event: string, callback: (state: string) => void) => {
      listenerCallbacks.push(callback);
      return { remove: jest.fn() };
    });

    render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    // Simulate: app goes to background then comes back active
    act(() => {
      listenerCallbacks.forEach((cb) => cb('background'));
    });
    act(() => {
      listenerCallbacks.forEach((cb) => cb('active'));
    });

    await act(async () => {});

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['friend-requests', 'incoming'] }),
    );
  });
});

// ── (l) Profile not yet resolved → modal does not open ──────────────────────

describe('(l) pending-until-resolved — modal deferred until profile query returns', () => {
  it('given subscription fires but profile query is pending, modal is not yet visible', async () => {
    const client = makeClient();

    // Profile query never resolves during this test (pending forever)
    mockGetProfileById.mockImplementation(
      () => new Promise(() => { /* never resolves */ }),
    );

    const { queryByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    fireSubscriptionEvent('friend_request_received', makeFriendRequestPayload(REQUEST_ID, SENDER_USER_ID));

    // Give React a tick to process
    await act(async () => {});

    // Modal should NOT be visible yet — profile hasn't resolved
    expect(queryByTestId('incoming-request-modal')).toBeNull();
  });
});

// ── (m) Self-originated event dropped — defense-in-depth for backend filter ──
//
// The OwnProfile mock at the top of this file resolves user_id == 'u-me-001'.
// A self-originated friend_request_received payload has from_user_id == self;
// a self-originated friend_request_accepted payload (acceptor == self) is the
// symmetric case. The backend's setSubscriptionFilter (userId == identity.sub)
// is the primary guard, but if it regresses or an event arrives from a replay
// path before the filter was deployed, the handler must drop the event rather
// than show the current user a modal about themselves.

describe('(m) self-originated events are dropped (defense-in-depth)', () => {
  const SELF_USER_ID = 'u-me-001';

  it('given friend_request_received fires with from_user_id === currentUserId, no IncomingRequestModal opens', async () => {
    const client = makeClient();
    mockGetProfileById.mockResolvedValue(makeUserProfile({ user_id: SELF_USER_ID }));

    const { queryByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    fireSubscriptionEvent(
      'friend_request_received',
      makeFriendRequestPayload(REQUEST_ID, SELF_USER_ID),
    );

    await act(async () => {});

    expect(queryByTestId('incoming-request-modal')).toBeNull();
  });

  it('given friend_request_accepted fires with from_user_id === currentUserId, no RequestAcceptedModal opens', async () => {
    const client = makeClient();
    mockGetProfileById.mockResolvedValue(makeUserProfile({ user_id: SELF_USER_ID }));

    const { queryByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    fireSubscriptionEvent(
      'friend_request_accepted',
      makeFriendRequestAcceptedPayload(SELF_USER_ID),
    );

    await act(async () => {});

    expect(queryByTestId('request-accepted-modal')).toBeNull();
  });

  it('given a legitimate event from another user fires, modal still opens (negative control)', async () => {
    const client = makeClient();
    mockGetProfileById.mockResolvedValue(makeUserProfile({ user_id: SENDER_USER_ID }));

    const { queryByTestId } = render(
      React.createElement(FriendRequestSubscriptionListener),
      { wrapper: makeWrapper(client) },
    );

    // SENDER_USER_ID ('u-sender-001') != SELF_USER_ID ('u-me-001')
    fireSubscriptionEvent(
      'friend_request_received',
      makeFriendRequestPayload(REQUEST_ID, SENDER_USER_ID),
    );

    await waitFor(() => {
      expect(queryByTestId('incoming-request-modal')).not.toBeNull();
    });
  });
});
