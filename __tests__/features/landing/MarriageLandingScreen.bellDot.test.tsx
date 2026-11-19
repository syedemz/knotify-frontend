/**
 * MarriageLandingScreen.bellDot.test.tsx (story 13.3 AC7c — bell-dot mirror)
 *
 * Verifies that the HeaderBar's unread-dot is driven by
 * `dummyprofile.__dummy_display_only.has_unread_notifications` (the CURRENT
 * USER's flag), NOT by the currently visible deck card's values.
 *
 * This file mocks `assets/dummyprofile.json` at the TOP level so the module-
 * scope `CURRENT_USER_HAS_UNREAD` constant in `MarriageLandingScreen` picks
 * up the mocked value when the module first loads.
 *
 * The companion test (dot absent when false) lives in
 * `MarriageLandingScreen.deck.test.tsx` which uses the real dummyprofile.json
 * (has_unread_notifications defaults to false in the fixture).
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// Mock useDeckQuery so the test does not try to hit the real backend and
// the amplify import chain is short-circuited.
jest.mock('@/features/landing/hooks/useDeckQuery', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DECK_FIXTURES } = require('@/features/discover/data/deckFixtures') as typeof import('@/features/discover/data/deckFixtures');
  return {
    useDeckQuery: () => ({
      data: DECK_FIXTURES,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    }),
    useInvalidateDeck: () => jest.fn(),
    DECK_QUERY_KEY: ['match', 'deck'],
  };
});

// Mock dummyprofile.json BEFORE any imports so the module-scope constant in
// MarriageLandingScreen picks up has_unread_notifications = true.
jest.mock('../../../assets/dummyprofile.json', () => ({
  user_id: 'dummy-current-user',
  first_name: 'Adnan',
  __dummy_display_only: {
    has_unread_notifications: true,
    is_active_today: false,
    membership_tier: null,
  },
}));

// MarriageLandingScreen now calls useSendFriendRequestMutation() after story 16.FR3.
// Mock so tests do not require a QueryClient in the render tree.
jest.mock('@/features/friendRequests/api', () => ({
  useSendFriendRequestMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useIncomingRequestsQuery: () => ({ data: [], isLoading: false, isError: false }),
  useOutgoingRequestsQuery: () => ({ data: [], isLoading: false, isError: false }),
  useAcceptFriendRequestMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useDeclineFriendRequestMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useCancelOutgoingRequestMutation: () => ({ mutate: jest.fn(), isPending: false }),
  OUTGOING_REQUESTS_QUERY_KEY: ['friend-requests', 'outgoing'] as const,
  INCOMING_REQUESTS_QUERY_KEY: ['friend-requests', 'incoming'] as const,
}));

// Preflight guard + QueryClient stub for focus-driven refetch. Default:
// preflight always allows; invalidations are tracked but ignored.
jest.mock('@/features/friendRequests/useFriendRequestPreflight', () => ({
  useFriendRequestPreflight: () => () => ({ canSend: true }),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
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
jest.mock('@/features/friends/api', () => ({
  FRIENDS_QUERY_KEY: ['friends'] as const,
  useFriendsQuery: jest.fn(),
}));

// MarriageLandingScreen now calls useBookmarks() — mock so tests do not
// require a real BookmarksProvider in the render tree.
jest.mock('@/state/bookmarks/BookmarksProvider', () => ({
  useBookmarks: () => ({
    bookmarks: [],
    loading: false,
    addBookmark: jest.fn().mockResolvedValue(undefined),
    removeBookmark: jest.fn().mockResolvedValue(undefined),
    isBookmarked: jest.fn().mockReturnValue(false),
    getBookmark: () => undefined,
  }),
}));

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { MarriageLandingScreen } from '@/features/landing/screens/MarriageLandingScreen';

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Native-module mocks ───────────────────────────────────────────────────────

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(ctx.Provider, { value: INSETS }, props.children);
    },
    useSafeAreaInsets: function () { return INSETS; },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    SafeAreaInsetsContext: ctx,
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

jest.mock('expo-image', () => {
  const Rct = require('react') as typeof import('react');
  const RN = require('react-native') as typeof import('react-native');
  return {
    Image: function (props: any) {
      return Rct.createElement(RN.View, { testID: props.testID, accessibilityLabel: props.accessibilityLabel });
    },
  };
});

// ── Tests ─────────────────────────────────────────────────────────────────────

function renderScreen() {
  return render(
    <ThemeProvider>
      <MarriageLandingScreen />
    </ThemeProvider>,
  );
}

describe('(c) bell-dot mirror — dummyprofile has_unread_notifications = true', () => {
  it('shows the unread-dot when dummyprofile.has_unread_notifications is true', () => {
    renderScreen();
    // The dot should appear because dummyprofile (mocked above) has
    // has_unread_notifications: true. The deck card values are irrelevant.
    expect(screen.getByTestId('landing-header-unread-dot')).toBeTruthy();
  });

  it('unread-dot is visible regardless of which deck card is displayed', () => {
    renderScreen();
    // Press Dislike to advance to the second card (deck index 1)
    const passButton = screen.getByTestId('action-button-pass');
    // Simulate pressing multiple times to cycle cards
    passButton.props.onPress?.();
    // Dot should still be there — it's tied to the current user, not the card
    expect(screen.getByTestId('landing-header-unread-dot')).toBeTruthy();
  });
});
