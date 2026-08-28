/**
 * Tests for BookmarkDeckViewScreen (story 14.4).
 *
 * SendRequestModal testID verification (per Q7 in PRD):
 *   - `send-request-card` — the modal card container (Pressable, line ~188)
 *   - `send-request-no-ask` — the "No" button on the ask step (line ~249)
 * Both testIDs are pre-existing in SendRequestModal.tsx — no passive additions needed.
 *
 * AC coverage:
 * (a) Renders `BackHeaderBar` + `DeckCard` for a bookmarked profile.
 * (b) Tapping the FAB opens `SendRequestModal` (assert via `send-request-card`).
 * (c) Full ask → confirm → sending flow calls `navigation.goBack()` after
 *     `SENDING_HOLD_MS` (jest.useFakeTimers + advanceTimersByTime(1000)).
 * (d) Cancelling on the ask step closes the modal WITHOUT calling `goBack()`.
 * (e) Missing bookmark (`getBookmark` returns `undefined`) → EmptyState renders,
 *     DeckCard does NOT.
 * (f) `removeBookmark` is NEVER called on confirm.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import type { DummyDeckProfile } from '@/types/DummyDeckProfile';

// ── useBookmarks mock ─────────────────────────────────────────────────────────

const mockGetBookmark = jest.fn<DummyDeckProfile | undefined, [string]>();
const mockRemoveBookmark = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);

jest.mock('@/state/bookmarks/BookmarksProvider', () => ({
  useBookmarks: () => ({
    bookmarks: [],
    loading: false,
    addBookmark: jest.fn(),
    removeBookmark: mockRemoveBookmark,
    isBookmarked: jest.fn().mockReturnValue(false),
    getBookmark: mockGetBookmark,
  }),
}));

// ── useFriendship mock ────────────────────────────────────────────────────────

const mockSendRequest = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);

jest.mock('@/state/friendship/FriendshipProvider', () => ({
  useFriendship: () => ({
    friends: [],
    requests: [],
    acceptRequest: jest.fn(),
    declineRequest: jest.fn(),
    isFriend: jest.fn().mockReturnValue(false),
    receivedRequestFrom: jest.fn().mockReturnValue(false),
    getFullProfile: jest.fn().mockReturnValue(undefined),
    pendingToast: null,
    setPendingToast: jest.fn(),
    consumePendingToast: jest.fn(),
    outgoingRequestIds: [],
    sendRequest: mockSendRequest,
    hasOutgoingRequest: jest.fn().mockReturnValue(false),
  }),
}));

// ── Navigation mock ───────────────────────────────────────────────────────────

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      goBack: mockGoBack,
      navigate: mockNavigate,
    }),
    useRoute: () => ({
      key: 'BookmarkDeckViewScreen-1',
      name: 'BookmarkDeckViewScreen',
      params: { userId: 'aisha-test-id' },
    }),
  };
});

// ── safe-area-context stub ────────────────────────────────────────────────────

jest.mock('react-native-safe-area-context', () => {
  const Rct = require('react') as typeof import('react');
  const RN = require('react-native') as typeof import('react-native');
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

// ── expo-image stub (used by CandidateHero inside DeckCard) ──────────────────

jest.mock('expo-image', () => {
  const Rct = require('react') as typeof import('react');
  const RN = require('react-native') as typeof import('react-native');
  return {
    Image: function (props: any) {
      return Rct.createElement(RN.View, {
        testID: props.testID,
        accessibilityLabel: props.accessibilityLabel,
      });
    },
  };
});

// ── lottie-react-native stub (used by SendRequestModal) ───────────────────────

jest.mock('lottie-react-native', () => {
  const Rct = require('react') as typeof import('react');
  const RN = require('react-native') as typeof import('react-native');
  return {
    __esModule: true,
    default: function LottieMock(props: any) {
      return Rct.createElement(RN.View, { testID: props.testID });
    },
  };
});

// ── dummyPhotoRegistry stub ───────────────────────────────────────────────────

jest.mock('@/assets/dummyPhotoRegistry', () => ({
  resolveDummyPhoto: () => undefined,
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { BookmarkDeckViewScreen } from '@/features/bookmarks/screens/BookmarkDeckViewScreen';

// ── Fixture ───────────────────────────────────────────────────────────────────

const AISHA_FIXTURE: DummyDeckProfile = {
  user_id: 'aisha-test-id',
  first_name: 'Aisha',
  last_name: 'Khan',
  sex: 'Female',
  age: 27,
  chosen_profile_avatar: null,
  photo_url: 'assets/female/Female3.png',
  current_residence_city: 'Berlin',
  current_residence_country: 'Germany',
  resident_country_code: 'DE',
  religion: 'Islam',
  job_title: 'Product Designer',
  username: 'aisha_khan',
  profile_complete_verified: true,
  photos: ['assets/female/Female3.png', 'assets/female/Female4.png'],
  faceSelfieUri: null,
  marital_status: 'Never Married',
  has_children: false,
  marriage_time: 'Within 1 year',
  meet_time: 'Within 3 months',
  professional_category: 'Design',
  employer_name: 'Acme Corp',
  employment_type: 'Full-time',
  office_address: null,
  salary_range: null,
  highest_degree: 'MSc Human-Computer Interaction',
  education_level: 'Masters',
  college_name: 'TU Berlin',
  graduation_year: 2021,
  higher_secondary: null,
  higher_secondary_passing_year: null,
  high_school: null,
  high_school_passing_year: null,
  __dummy_display_only: {
    is_active_today: true,
    membership_tier: 'gold',
    has_unread_notifications: false,
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderScreen() {
  return render(
    <ThemeProvider>
      <BookmarkDeckViewScreen />
    </ThemeProvider>,
  );
}

// ── Reset mocks between tests ─────────────────────────────────────────────────

beforeEach(() => {
  mockGoBack.mockClear();
  mockNavigate.mockClear();
  mockRemoveBookmark.mockClear();
  mockSendRequest.mockClear();
  mockGetBookmark.mockReturnValue(AISHA_FIXTURE);
});

// ── AC (a): renders BackHeaderBar + DeckCard for a bookmarked profile ─────────

describe('BookmarkDeckViewScreen — AC (a): renders BackHeaderBar + DeckCard', () => {
  it('given a valid bookmark, then BackHeaderBar is rendered', () => {
    renderScreen();
    expect(screen.getByTestId('back-header-bar')).toBeTruthy();
  });

  it('given a valid bookmark, then DeckCard is rendered', () => {
    renderScreen();
    expect(screen.getByTestId('deck-card')).toBeTruthy();
  });

  it('given a valid bookmark, then the scrollview body is rendered', () => {
    renderScreen();
    expect(screen.getByTestId('bookmark-deck-view-scroll')).toBeTruthy();
  });
});

// ── AC (b): tapping FAB opens SendRequestModal ────────────────────────────────

describe('BookmarkDeckViewScreen — AC (b): FAB tap opens SendRequestModal', () => {
  it('given the screen with a valid profile, when FAB is tapped, then modal card is visible', () => {
    renderScreen();

    // Modal should be closed initially
    expect(screen.queryByTestId('send-request-card')).toBeNull();

    // Tap the FAB
    fireEvent.press(screen.getByTestId('floating-add-request-button'));

    // Modal card is now visible (testID pre-existing in SendRequestModal.tsx line ~188)
    expect(screen.getByTestId('send-request-card')).toBeTruthy();
  });
});

// ── AC (c): full ask → confirm → sending flow calls goBack() ─────────────────

describe('BookmarkDeckViewScreen — AC (c): full modal flow calls goBack()', () => {
  it('given the full ask→confirm→sending flow, then goBack() is called after SENDING_HOLD_MS', () => {
    jest.useFakeTimers();
    try {
      renderScreen();

      // Open modal
      fireEvent.press(screen.getByTestId('floating-add-request-button'));

      // Ask step → press Yes
      fireEvent.press(screen.getByTestId('send-request-yes-ask'));

      // Confirm step → press Yes
      fireEvent.press(screen.getByTestId('send-request-yes-confirm'));

      // goBack() should NOT have fired yet (during SENDING_HOLD_MS animation)
      expect(mockGoBack).not.toHaveBeenCalled();

      // Advance past SENDING_HOLD_MS (1000 ms)
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      // goBack() should now have fired
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

// ── AC (d): cancel on ask step closes modal WITHOUT goBack() ─────────────────

describe('BookmarkDeckViewScreen — AC (d): cancel closes modal without goBack()', () => {
  it('given the FAB is tapped and then "No" is pressed on the ask step, then goBack() is NOT called', () => {
    renderScreen();

    // Open modal
    fireEvent.press(screen.getByTestId('floating-add-request-button'));
    expect(screen.getByTestId('send-request-card')).toBeTruthy();

    // Press No on the ask step (testID pre-existing in SendRequestModal.tsx line ~249)
    fireEvent.press(screen.getByTestId('send-request-no-ask'));

    // Modal should be closed
    expect(screen.queryByTestId('send-request-card')).toBeNull();

    // goBack() should NOT have been called
    expect(mockGoBack).not.toHaveBeenCalled();
  });
});

// ── AC (e): missing bookmark renders EmptyState, not DeckCard ─────────────────

describe('BookmarkDeckViewScreen — AC (e): missing bookmark renders EmptyState', () => {
  it('given getBookmark returns undefined, then EmptyState is rendered', () => {
    mockGetBookmark.mockReturnValue(undefined);
    renderScreen();
    expect(screen.getByTestId('bookmark-missing-state')).toBeTruthy();
  });

  it('given getBookmark returns undefined, then DeckCard is NOT rendered', () => {
    mockGetBookmark.mockReturnValue(undefined);
    renderScreen();
    expect(screen.queryByTestId('deck-card')).toBeNull();
  });

  it('given getBookmark returns undefined, then FAB is NOT rendered', () => {
    mockGetBookmark.mockReturnValue(undefined);
    renderScreen();
    expect(screen.queryByTestId('floating-add-request-button')).toBeNull();
  });
});

// ── AC (f): removeBookmark is NEVER called on confirm ────────────────────────

describe('BookmarkDeckViewScreen — AC (f): bookmark is NOT removed on confirm', () => {
  it('given the full modal flow completes, then removeBookmark is never called', () => {
    jest.useFakeTimers();
    try {
      renderScreen();

      fireEvent.press(screen.getByTestId('floating-add-request-button'));
      fireEvent.press(screen.getByTestId('send-request-yes-ask'));
      fireEvent.press(screen.getByTestId('send-request-yes-confirm'));

      act(() => {
        jest.advanceTimersByTime(1100);
      });

      expect(mockRemoveBookmark).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
