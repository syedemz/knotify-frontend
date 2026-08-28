/**
 * Tests for `src/features/chat/screens/ChatListScreen.tsx` (story 15.4).
 *
 * Strategy: `ChatListRow` is mocked so this test suite only verifies the
 * wiring (correct props passed, navigation, empty state) without pulling in
 * the real `useChatHistory` or AsyncStorage.
 *
 * AC coverage:
 * (a) Mehvish row rendered — `ChatListRow` receives the correct `friend` prop.
 * (b) Row press navigates to `ChatRoomScreen` with the correct `friendUserId`.
 * (c) Empty friends list renders `EmptyState` with `chat.list.emptyTitle`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(ctx.Provider, { value: INSETS }, Rct.createElement(RN.View, null, props.children));
    },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () { return INSETS; },
    useSafeAreaFrame: function () { return { x: 0, y: 0, width: 375, height: 812 }; },
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';

import type { DummyFullProfile } from '@/types/DummyFullProfile';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mehvish = require('../../../assets/dummymehvish.json') as DummyFullProfile;

// ── Mock ChatListRow ──────────────────────────────────────────────────────────
//
// ChatListRow holds useChatHistory at its top level. We stub it to a simple
// pressable element so we can assert prop pass-through and press behaviour
// without needing AsyncStorage or a ChatProvider.

const mockOnPress = jest.fn();

jest.mock('@/features/chat/components/ChatListRow', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    ChatListRow: function StubChatListRow(props: any) {
      return Rct.createElement(
        RN.Pressable,
        {
          testID: `stub-chat-list-row-${String(props.friend?.user_id ?? 'unknown')}`,
          onPress: props.onPress,
          accessibilityLabel: `row-${String(props.friend?.user_id ?? 'unknown')}`,
        },
        Rct.createElement(
          RN.Text,
          { testID: `stub-row-friend-id-${String(props.friend?.user_id ?? 'unknown')}` },
          String(props.friend?.user_id ?? ''),
        ),
      );
    },
  };
});

// ── Mock useFriendship ────────────────────────────────────────────────────────

let mockFriends: DummyFullProfile[] = [mehvish];

jest.mock('@/state/friendship/FriendshipProvider', () => ({
  useFriendship: jest.fn(() => ({
    friends: mockFriends,
    requests: [],
    acceptRequest: jest.fn(),
    declineRequest: jest.fn(),
    isFriend: jest.fn(),
    receivedRequestFrom: jest.fn(),
    getFullProfile: jest.fn(),
    outgoingRequestIds: [],
    sendRequest: jest.fn(),
    hasOutgoingRequest: jest.fn(),
    pendingToast: null,
    setPendingToast: jest.fn(),
    consumePendingToast: jest.fn(),
  })),
}));

// ── Mock navigation ───────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

// ── Helper ────────────────────────────────────────────────────────────────────

function renderScreen() {
  const { ChatListScreen } = require('@/features/chat/screens/ChatListScreen') as
    typeof import('@/features/chat/screens/ChatListScreen');

  return render(
    <ThemeProvider>
      <ChatListScreen />
    </ThemeProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockFriends = [mehvish];
  mockNavigate.mockClear();
  jest.clearAllMocks();
  mockFriends = [mehvish]; // re-set after clearAllMocks resets module mocks
});

describe('ChatListScreen — AC (a): Mehvish row rendered with correct friend prop', () => {
  it(
    'given friends=[Mehvish], when ChatListScreen renders, then a stub row with Mehvish user_id is present',
    () => {
      const { getByTestId } = renderScreen();
      // The stub ChatListRow renders a Pressable with testID stub-chat-list-row-<user_id>
      expect(getByTestId(`stub-chat-list-row-${mehvish.user_id}`)).toBeTruthy();
      // And shows the user_id as text to prove friend prop was passed
      const idText = getByTestId(`stub-row-friend-id-${mehvish.user_id}`);
      expect(idText.props.children).toBe(mehvish.user_id);
    },
  );
});

describe('ChatListScreen — AC (b): row press navigates to ChatRoomScreen', () => {
  it(
    'given Mehvish is in the friends list, when the row is pressed, then navigation.navigate is called with ChatRoomScreen and Mehvish user_id',
    () => {
      const { getByTestId } = renderScreen();
      const row = getByTestId(`stub-chat-list-row-${mehvish.user_id}`);
      fireEvent.press(row);
      expect(mockNavigate).toHaveBeenCalledWith('ChatRoomScreen', {
        friendUserId: mehvish.user_id,
      });
    },
  );
});

describe('ChatListScreen — AC (c): empty friends list renders EmptyState', () => {
  it(
    'given friends=[], when ChatListScreen renders, then EmptyState with chat.list.emptyTitle is shown',
    () => {
      // Override the mock to return an empty friends list
      const { useFriendship } = require('@/state/friendship/FriendshipProvider') as
        typeof import('@/state/friendship/FriendshipProvider');
      (useFriendship as jest.Mock).mockReturnValue({
        friends: [],
        requests: [],
        acceptRequest: jest.fn(),
        declineRequest: jest.fn(),
        isFriend: jest.fn(),
        receivedRequestFrom: jest.fn(),
        getFullProfile: jest.fn(),
        outgoingRequestIds: [],
        sendRequest: jest.fn(),
        hasOutgoingRequest: jest.fn(),
        pendingToast: null,
        setPendingToast: jest.fn(),
        consumePendingToast: jest.fn(),
      });

      const { getByText } = renderScreen();
      expect(getByText('No conversations yet')).toBeTruthy();
    },
  );
});
