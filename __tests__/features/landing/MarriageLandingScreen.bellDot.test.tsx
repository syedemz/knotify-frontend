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
import { FriendshipProvider } from '@/state/friendship/FriendshipProvider';
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
      <FriendshipProvider>
        <MarriageLandingScreen />
      </FriendshipProvider>
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
