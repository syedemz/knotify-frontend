/**
 * MarriageLandingScreen.deck.test.tsx (story 13.3 AC7b, AC7c, AC7d; story 14.2 AC;
 * story 16.FR3: FriendshipProvider removed — useSendFriendRequestMutation mocked).
 *
 * Tests:
 * (b) Index behaviour: starts at 0; Dislike advances; Like advances + snackbar;
 *     Undo decrements (bounded at 0); Star toggle bookmark (added / removed);
 *     empty state after last card; CollapsingActionBar NOT in tree when exhausted.
 * (c) Bell-dot mirror — see MarriageLandingScreen.bellDot.test.tsx for the
 *     has_unread_notifications=true variant (requires module-scope jest.mock).
 *     This file covers the default case (has_unread_notifications=false from
 *     the real dummyprofile.json, dot absent).
 * (d) Like calls sendRequestMutation.mutate (story 16.FR3; replaces old "does NOT
 *     call FriendshipProvider mutators" assertion which is no longer meaningful).
 * (e) Star bookmark toggle — added / removed snackbar; deck index does NOT advance.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { MarriageLandingScreen } from '@/features/landing/screens/MarriageLandingScreen';
import { DECK_FIXTURES } from '@/features/discover/data/deckFixtures';

// ── useDeckQuery mock — returns DECK_FIXTURES so existing assertions pass ─────

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

// ── useSendFriendRequestMutation mock (story 16.FR3) ─────────────────────────

const mockSendMutate = jest.fn();

jest.mock('@/features/friendRequests/api', () => ({
  useSendFriendRequestMutation: () => ({
    mutate: mockSendMutate,
    isPending: false,
  }),
  useIncomingRequestsQuery: () => ({ data: [], isLoading: false, isError: false }),
  useOutgoingRequestsQuery: () => ({ data: [], isLoading: false, isError: false }),
  useAcceptFriendRequestMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useDeclineFriendRequestMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useCancelOutgoingRequestMutation: () => ({ mutate: jest.fn(), isPending: false }),
  OUTGOING_REQUESTS_QUERY_KEY: ['friend-requests', 'outgoing'] as const,
  INCOMING_REQUESTS_QUERY_KEY: ['friend-requests', 'incoming'] as const,
}));

// Preflight guard — returns `canSend: true` by default. Deck tests that
// want to exercise the guard override this via the exported mock ref.
const mockPreflightDeck = jest.fn(() => ({ canSend: true }));
jest.mock('@/features/friendRequests/useFriendRequestPreflight', () => ({
  useFriendRequestPreflight: () => mockPreflightDeck,
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

// ── useBookmarks mock ─────────────────────────────────────────────────────────
// Default: nothing bookmarked. Per-test overrides via mockReturnValue / mockImplementation.

const mockAddBookmark = jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined);
const mockRemoveBookmark = jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined);
const mockIsBookmarked = jest.fn<boolean, [string]>().mockReturnValue(false);

jest.mock('@/state/bookmarks/BookmarksProvider', () => ({
  useBookmarks: () => ({
    bookmarks: [],
    loading: false,
    addBookmark: mockAddBookmark,
    removeBookmark: mockRemoveBookmark,
    isBookmarked: mockIsBookmarked,
    getBookmark: () => undefined,
  }),
}));

// Reset mock call counts between tests so assertions in later tests
// are not contaminated by earlier test runs.
beforeEach(() => {
  mockAddBookmark.mockClear();
  mockRemoveBookmark.mockClear();
  mockIsBookmarked.mockClear();
  mockIsBookmarked.mockReturnValue(false);
  mockSendMutate.mockClear();
});

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

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Helper ────────────────────────────────────────────────────────────────────

function renderScreen() {
  return render(
    <ThemeProvider>
      <MarriageLandingScreen />
    </ThemeProvider>,
  );
}

// ── (b) Index behaviour ───────────────────────────────────────────────────────

describe('(b) deck index behaviour', () => {
  it('starts at index 0 — candidate-hero is rendered', () => {
    renderScreen();
    expect(screen.getByTestId('candidate-hero')).toBeTruthy();
  });

  it('Dislike (X) advances to next card without showing like snackbar', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('action-button-pass'));

    // Like snackbar NOT shown for Dislike
    expect(screen.queryByText(t('landing.likeSent'))).toBeNull();
    // Not yet exhausted (index 1 of 5)
    expect(screen.getByTestId('candidate-hero')).toBeTruthy();
    expect(screen.getByTestId('collapsing-action-bar')).toBeTruthy();
  });

  it('Like (✓) opens the confirmation modal — snackbar + advance only fire after the full flow', () => {
    jest.useFakeTimers();
    try {
      renderScreen();
      fireEvent.press(screen.getByTestId('action-button-like'));

      // Modal is open; snackbar has NOT fired yet.
      expect(screen.getByTestId('send-request-card')).toBeTruthy();
      expect(screen.queryByText(t('landing.likeSent'))).toBeNull();

      // Walk the ask → confirm → sending flow.
      fireEvent.press(screen.getByTestId('send-request-yes-ask'));
      fireEvent.press(screen.getByTestId('send-request-yes-confirm'));
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // Now the snackbar fires and the deck has advanced (still on a valid card).
      expect(screen.getByText(t('landing.likeSent'))).toBeTruthy();
      expect(screen.getByTestId('candidate-hero')).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it('Undo (↺) at index 0 stays bounded at 0 — card still visible', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('action-button-undo'));
    // Bounded at 0, still on a valid card
    expect(screen.getByTestId('candidate-hero')).toBeTruthy();
    expect(screen.getByTestId('collapsing-action-bar')).toBeTruthy();
  });

  it('Undo after Dislike decrements back to previous card', () => {
    renderScreen();
    // Advance to index 1
    fireEvent.press(screen.getByTestId('action-button-pass'));
    // Undo back to index 0
    fireEvent.press(screen.getByTestId('action-button-undo'));
    // Still on a valid card
    expect(screen.getByTestId('candidate-hero')).toBeTruthy();
    expect(screen.getByTestId('collapsing-action-bar')).toBeTruthy();
  });

  it('renders EmptyState after advancing past all cards', () => {
    renderScreen();

    const total = DECK_FIXTURES.length;
    for (let i = 0; i < total; i++) {
      fireEvent.press(screen.getByTestId('action-button-pass'));
    }

    expect(screen.getByText(t('landing.deckExhausted.title'))).toBeTruthy();
    expect(screen.getByText(t('landing.deckExhausted.description'))).toBeTruthy();
  });

  it('CollapsingActionBar is NOT in the tree when deck is exhausted', () => {
    renderScreen();

    const total = DECK_FIXTURES.length;
    for (let i = 0; i < total; i++) {
      fireEvent.press(screen.getByTestId('action-button-pass'));
    }

    // CollapsingActionBar must be absent — screen returns null for the bar
    expect(screen.queryByTestId('collapsing-action-bar')).toBeNull();
  });
});

// ── (e) Star bookmark toggle (story 14.2) ────────────────────────────────────

describe('(e) Star bookmark toggle', () => {
  it('Star tap on unbookmarked card calls addBookmark with DECK_FIXTURES[0] and shows bookmark.added snackbar; deck index stays at 0', async () => {
    // Default: isBookmarked returns false (set in beforeEach).
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('action-button-super-like'));
    });

    // addBookmark was called with the first fixture
    expect(mockAddBookmark).toHaveBeenCalledTimes(1);
    expect(mockAddBookmark).toHaveBeenCalledWith(DECK_FIXTURES[0]);

    // bookmark.added snackbar is visible
    expect(screen.getByText(t('landing.bookmark.added'))).toBeTruthy();

    // removeBookmark was NOT called
    expect(mockRemoveBookmark).not.toHaveBeenCalled();

    // Deck index has NOT advanced — CandidateHero is still the first card
    expect(screen.getByTestId('candidate-hero')).toBeTruthy();
    expect(screen.getByTestId('collapsing-action-bar')).toBeTruthy();
  });

  it('Star tap on already-bookmarked card calls removeBookmark with current user_id and shows bookmark.removed snackbar; deck index stays at 0', async () => {
    // Override: isBookmarked returns true for this test.
    mockIsBookmarked.mockReturnValue(true);

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('action-button-super-like'));
    });

    // removeBookmark was called with the first fixture's user_id
    expect(mockRemoveBookmark).toHaveBeenCalledTimes(1);
    expect(mockRemoveBookmark).toHaveBeenCalledWith(DECK_FIXTURES[0]!.user_id);

    // bookmark.removed snackbar is visible
    expect(screen.getByText(t('landing.bookmark.removed'))).toBeTruthy();

    // addBookmark was NOT called
    expect(mockAddBookmark).not.toHaveBeenCalled();

    // Deck index has NOT advanced
    expect(screen.getByTestId('candidate-hero')).toBeTruthy();
    expect(screen.getByTestId('collapsing-action-bar')).toBeTruthy();
  });
});

// ── (c) Bell-dot default state (dummyprofile has_unread_notifications = false) ──

describe('(c) bell-dot mirror — default state (no unread dot)', () => {
  it('does NOT show the unread-dot when dummyprofile.has_unread_notifications is false', () => {
    renderScreen();
    // Real dummyprofile.json has has_unread_notifications: false
    expect(screen.queryByTestId('landing-header-unread-dot')).toBeNull();
  });
});

// ── (d) Like calls sendRequestMutation.mutate (story 16.FR3) ─────────────────
//
// Before 16.FR3: Like did mock-theatre only (no mutation). After 16.FR3:
// completing the send-request modal flow calls sendRequestMutation.mutate
// with the current deck card's user_id.

describe('(d) Like calls useSendFriendRequestMutation.mutate after the confirmation flow', () => {
  it('completing the send-request modal flow calls sendMutate with the deck card user_id', () => {
    jest.useFakeTimers();
    try {
      renderScreen();
      fireEvent.press(screen.getByTestId('action-button-like'));
      fireEvent.press(screen.getByTestId('send-request-yes-ask'));
      fireEvent.press(screen.getByTestId('send-request-yes-confirm'));
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // sendRequestMutation.mutate was called with the first deck card's user_id
      expect(mockSendMutate).toHaveBeenCalledTimes(1);
      expect(mockSendMutate).toHaveBeenCalledWith({
        toUserId: DECK_FIXTURES[0]!.user_id,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('cancelling the send-request modal (No at first step) does NOT call sendMutate', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('action-button-like'));
    fireEvent.press(screen.getByTestId('send-request-no-ask'));

    expect(mockSendMutate).not.toHaveBeenCalled();
  });
});
