/**
 * Tests for ExploreHomeScreen (stories 13.5 + 14.3 + 16.FR3).
 *
 * Story 16.FR3 rewire: `FriendshipProvider` removed. The screen now reads from:
 * - `useFriendsQuery()` for the Friends tab.
 * - `useIncomingRequestsQuery()` for the Requests tab.
 * - `useAcceptFriendRequestMutation` / `useDeclineFriendRequestMutation` for actions.
 *
 * AC coverage (story 13.5 — rewired):
 * (a) Friends tab renders when `useFriendsQuery` returns data.
 * (b) Requests tab renders when `useIncomingRequestsQuery` returns data.
 * (c) Tapping friend row → navigates to OtherProfileScreen with { userId, source: 'friend' }.
 * (d) Tapping request row body → navigates with { userId, source: 'request' }.
 * (e) Tapping Accept on a request row: calls `useAcceptFriendRequestMutation.mutate` and snackbar fires.
 * (f) Tapping Decline on a request row: calls `useDeclineFriendRequestMutation.mutate` and snackbar fires.
 * (g) Loading state: Friends tab shows LoadingState when query is loading.
 * (g2) Loading state: Requests tab shows LoadingState when query is loading.
 * (h) Empty friends: EmptyState shown when friends list is empty.
 * (h2) Empty requests: EmptyState shown when requests list is empty.
 *
 * AC coverage (story 14.3 — bookmarks, unchanged):
 * (k) Bookmarks tab renders.
 * (l) BookmarkCard press navigates to BookmarkDeckViewScreen.
 * (m) Empty bookmarks shows EmptyState.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(
        ctx.Provider,
        { value: INSETS },
        Rct.createElement(RN.View, null, props.children),
      );
    },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () { return INSETS; },
    useSafeAreaFrame: function () {
      return { x: 0, y: 0, width: 375, height: 812 };
    },
    initialWindowMetrics: {
      insets: INSETS,
      frame: { x: 0, y: 0, width: 375, height: 812 },
    },
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { ExploreHomeScreen } from '@/features/explore/screens/ExploreHomeScreen';
import type { DummyDeckProfile } from '@/types/DummyDeckProfile';
import type { UserProfile } from '@/types/api/UserProfile';
import type { FriendRequest } from '@/types/api/FriendRequest';

import dummyMehvish from '../../../assets/dummymehvish.json';
import dummyQurat from '../../../assets/dummyqurat.json';
import dummyFemale from '../../../assets/dummyfemale.json';

// ── Friends query mock ─────────────────────────────────────────────────────────

type MockFriendsQueryReturn = {
  data: UserProfile[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

let mockFriendsQueryReturn: MockFriendsQueryReturn = {
  data: [dummyMehvish as unknown as UserProfile],
  isLoading: false,
  isError: false,
  error: null,
};

jest.mock('@/features/friends/api', () => ({
  useFriendsQuery: () => mockFriendsQueryReturn,
  FRIENDS_QUERY_KEY: ['friends'] as const,
}));

// ── Incoming requests query mock ───────────────────────────────────────────────

type MockRequestsQueryReturn = {
  data: FriendRequest[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

const STUB_REQUEST: FriendRequest = {
  request_id: 'req-001',
  from_user_id: dummyQurat.user_id,
  to_user_id: 'current-user-id',
  status: 'pending',
  created_at: '2024-01-01T00:00:00.000Z',
};

let mockRequestsQueryReturn: MockRequestsQueryReturn = {
  data: [STUB_REQUEST],
  isLoading: false,
  isError: false,
  error: null,
};

const mockAcceptMutate = jest.fn();
const mockDeclineMutate = jest.fn();

jest.mock('@/features/friendRequests/api', () => ({
  useIncomingRequestsQuery: () => mockRequestsQueryReturn,
  useOutgoingRequestsQuery: () => ({ data: [], isLoading: false, isError: false }),
  useAcceptFriendRequestMutation: () => ({ mutate: mockAcceptMutate }),
  useDeclineFriendRequestMutation: () => ({ mutate: mockDeclineMutate }),
  useSendFriendRequestMutation: () => ({ mutate: jest.fn() }),
  useCancelOutgoingRequestMutation: () => ({ mutate: jest.fn() }),
  INCOMING_REQUESTS_QUERY_KEY: ['friend-requests', 'incoming'] as const,
  OUTGOING_REQUESTS_QUERY_KEY: ['friend-requests', 'outgoing'] as const,
}));

// Request rows call `useProfileQuery(from_user_id)` per row to resolve the
// sender's display name. Mock it so the hook doesn't try to reach a real
// QueryClient — the test asserts on testIDs tied to `user_id`, not on names.
jest.mock('@/features/profile/api', () => ({
  useProfileQuery: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
  }),
  profileQueryKey: (userId: string) => ['profile', userId] as const,
}));

// ── BookmarksProvider mock ─────────────────────────────────────────────────────

const mockBookmarks: DummyDeckProfile[] = [];

jest.mock('@/state/bookmarks/BookmarksProvider', () => ({
  useBookmarks: () => ({
    bookmarks: mockBookmarks,
    loading: false,
    addBookmark: jest.fn(),
    removeBookmark: jest.fn(),
    isBookmarked: jest.fn(() => false),
    getBookmark: jest.fn(() => undefined),
  }),
}));

// resolveDummyPhoto mock — needed by BookmarkCard rendered inside the grid.
jest.mock('@/assets/dummyPhotoRegistry', () => ({
  resolveDummyPhoto: () => 42,
}));

// ── Navigation mock ────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  // Fire the callback once on mount so the focus-driven invalidation runs.
  useFocusEffect: (cb: () => (() => void) | void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Rct = require('react') as typeof import('react');
    Rct.useEffect(() => {
      const cleanup = cb();
      return cleanup ?? undefined;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  },
}));

// ── QueryClient mock (for the useFocusEffect refetch) ────────────────────────

const mockInvalidateQueries = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// ── Render helper ──────────────────────────────────────────────────────────────

function renderScreen() {
  return render(
    <ThemeProvider>
      <ExploreHomeScreen />
    </ThemeProvider>,
  );
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockBookmarks.splice(0, mockBookmarks.length);
  // Reset to default state
  mockFriendsQueryReturn = {
    data: [dummyMehvish as unknown as UserProfile],
    isLoading: false,
    isError: false,
    error: null,
  };
  mockRequestsQueryReturn = {
    data: [STUB_REQUEST],
    isLoading: false,
    isError: false,
    error: null,
  };
});

// ── AC (a): Friends tab renders when useFriendsQuery returns data ─────────────

describe('ExploreHomeScreen — AC (a): Friends tab renders Mehvish from useFriendsQuery', () => {
  it('renders Mehvish full name in the Friends tab', () => {
    renderScreen();
    expect(
      screen.getByText(`${dummyMehvish.first_name} ${dummyMehvish.last_name}`),
    ).toBeTruthy();
  });

  it('renders explore-friends-list FlatList', () => {
    renderScreen();
    expect(screen.getByTestId('explore-friends-list')).toBeTruthy();
  });
});

// ── AC (b): Requests tab renders when useIncomingRequestsQuery returns data ───

describe('ExploreHomeScreen — AC (b): Requests tab renders from useIncomingRequestsQuery', () => {
  it('shows Requests tab content when selected', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('explore-tab-requests'));
    // The from_user_id is used as the display name for requests rows
    expect(screen.getByTestId(`request-row-body-${dummyQurat.user_id}`)).toBeTruthy();
  });

  it('shows Accept and Decline buttons for the request row', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('explore-tab-requests'));
    expect(screen.getByTestId(`request-accept-${dummyQurat.user_id}`)).toBeTruthy();
    expect(screen.getByTestId(`request-decline-${dummyQurat.user_id}`)).toBeTruthy();
  });
});

// ── AC (c): Friend row navigates to OtherProfileScreen ───────────────────────

describe('ExploreHomeScreen — AC (c): friend row press navigates to OtherProfileScreen', () => {
  it('navigates with userId and source=friend when Mehvish row is pressed', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId(`friend-row-${dummyMehvish.user_id}`));
    expect(mockNavigate).toHaveBeenCalledWith('OtherProfileScreen', {
      userId: dummyMehvish.user_id,
      source: 'friend',
    });
  });
});

// ── AC (d): Request row body navigates to OtherProfileScreen ─────────────────

describe('ExploreHomeScreen — AC (d): request row body press navigates to OtherProfileScreen', () => {
  it('navigates with userId and source=request when request row body is pressed', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('explore-tab-requests'));
    fireEvent.press(screen.getByTestId(`request-row-body-${dummyQurat.user_id}`));
    expect(mockNavigate).toHaveBeenCalledWith('OtherProfileScreen', {
      userId: dummyQurat.user_id,
      source: 'request',
    });
  });
});

// ── AC (e): Accept calls mutation with requestId ──────────────────────────────

describe('ExploreHomeScreen — AC (e): Accept calls useAcceptFriendRequestMutation with requestId', () => {
  it('calls acceptMutation.mutate({ requestId }) when Accept is pressed', async () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('explore-tab-requests'));

    await act(async () => {
      fireEvent.press(screen.getByTestId(`request-accept-${dummyQurat.user_id}`));
    });

    expect(mockAcceptMutate).toHaveBeenCalledWith({ requestId: STUB_REQUEST.request_id });
  });

  it('shows the accepted snackbar after Accept is pressed', async () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('explore-tab-requests'));

    await act(async () => {
      fireEvent.press(screen.getByTestId(`request-accept-${dummyQurat.user_id}`));
    });

    expect(screen.getByTestId('explore-snackbar')).toBeTruthy();
  });
});

// ── AC (f): Decline calls mutation with requestId ────────────────────────────

describe('ExploreHomeScreen — AC (f): Decline calls useDeclineFriendRequestMutation with requestId', () => {
  it('calls declineMutation.mutate({ requestId }) when Decline is pressed', async () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('explore-tab-requests'));

    await act(async () => {
      fireEvent.press(screen.getByTestId(`request-decline-${dummyQurat.user_id}`));
    });

    expect(mockDeclineMutate).toHaveBeenCalledWith({ requestId: STUB_REQUEST.request_id });
  });

  it('shows the declined snackbar after Decline is pressed', async () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('explore-tab-requests'));

    await act(async () => {
      fireEvent.press(screen.getByTestId(`request-decline-${dummyQurat.user_id}`));
    });

    expect(screen.getByTestId('explore-snackbar')).toBeTruthy();
  });
});

// ── AC (g): Loading state ─────────────────────────────────────────────────────

describe('ExploreHomeScreen — AC (g): Loading state shown when queries are loading', () => {
  it('shows LoadingState for Friends tab when isLoading is true', () => {
    mockFriendsQueryReturn = { data: undefined, isLoading: true, isError: false, error: null };
    renderScreen();
    expect(screen.getByTestId('loading-state')).toBeTruthy();
  });

  it('shows LoadingState for Requests tab when isLoading is true', () => {
    mockRequestsQueryReturn = { data: undefined, isLoading: true, isError: false, error: null };
    renderScreen();
    fireEvent.press(screen.getByTestId('explore-tab-requests'));
    expect(screen.getByTestId('loading-state')).toBeTruthy();
  });
});

// ── AC (h): Empty states ──────────────────────────────────────────────────────

describe('ExploreHomeScreen — AC (h): Empty state shown for empty lists', () => {
  it('shows EmptyState when friends list is empty', () => {
    mockFriendsQueryReturn = { data: [], isLoading: false, isError: false, error: null };
    renderScreen();
    expect(screen.getByText('No friends yet')).toBeTruthy();
  });

  it('shows EmptyState when requests list is empty', () => {
    mockRequestsQueryReturn = { data: [], isLoading: false, isError: false, error: null };
    renderScreen();
    fireEvent.press(screen.getByTestId('explore-tab-requests'));
    expect(screen.getByText('No pending requests')).toBeTruthy();
  });
});

// ── pendingToast cross-screen handoff is REMOVED ─────────────────────────────

describe('ExploreHomeScreen — pendingToast handoff is removed in 16.FR3', () => {
  it('does NOT crash without a FriendshipProvider in the tree', () => {
    expect(() => renderScreen()).not.toThrow();
  });
});

// ── Bookmarks tab (story 14.3) ────────────────────────────────────────────────

describe('ExploreHomeScreen — AC (k): Bookmarks tab is present', () => {
  it('renders the Bookmarks tab button', () => {
    renderScreen();
    expect(screen.getByTestId('explore-tab-bookmarks')).toBeTruthy();
  });

  it('shows all three tab buttons', () => {
    renderScreen();
    expect(screen.getByTestId('explore-tab-friends')).toBeTruthy();
    expect(screen.getByTestId('explore-tab-requests')).toBeTruthy();
    expect(screen.getByTestId('explore-tab-bookmarks')).toBeTruthy();
  });
});

describe('ExploreHomeScreen — AC (l): BookmarkCard press navigates to BookmarkDeckViewScreen', () => {
  it('navigates to BookmarkDeckViewScreen with userId when card is pressed', () => {
    mockBookmarks.push(dummyFemale as unknown as DummyDeckProfile);
    renderScreen();
    fireEvent.press(screen.getByTestId('explore-tab-bookmarks'));
    fireEvent.press(screen.getByTestId(`bookmark-card-${dummyFemale.user_id}`));
    expect(mockNavigate).toHaveBeenCalledWith('BookmarkDeckViewScreen', {
      userId: dummyFemale.user_id,
    });
  });
});

describe('ExploreHomeScreen — AC (m): empty bookmarks shows EmptyState', () => {
  it('shows EmptyState when no bookmarks', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('explore-tab-bookmarks'));
    expect(screen.getByText('No bookmarks yet')).toBeTruthy();
  });
});
