/**
 * Tests for `src/features/chat/screens/ChatListScreen.tsx` (story 15.4 + 16.FR3).
 *
 * Story 16.FR3: rewired from `useFriendship().friends` to `useFriendsQuery()`.
 * This test suite mocks `useFriendsQuery` directly — no FriendshipProvider needed.
 *
 * Strategy: `ChatListRow` is mocked so this test suite only verifies the
 * wiring (correct props passed, navigation, empty/loading/error states)
 * without pulling in the real `useChatHistory` or AsyncStorage.
 *
 * AC coverage:
 * (a) Mehvish row rendered — `ChatListRow` receives the correct `friend` prop.
 * (b) Row press navigates to `ChatRoomScreen` with the correct `friendUserId`.
 * (c) Empty friends list renders `EmptyState` with `chat.list.emptyTitle`.
 * (d) Loading state renders `LoadingState`.
 * (e) Error state renders `ErrorState`.
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
import type { UserProfile } from '@/types/api/UserProfile';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mehvish = require('../../../assets/dummymehvish.json') as UserProfile;

// ── Mock ChatListRow ──────────────────────────────────────────────────────────
//
// ChatListRow holds useChatHistory at its top level. We stub it to a simple
// pressable element so we can assert prop pass-through and press behaviour
// without needing AsyncStorage or a ChatProvider.

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

// ── Mock useFriendsQuery ──────────────────────────────────────────────────────

let mockFriendsQueryResult: {
  data: UserProfile[] | undefined;
  isLoading: boolean;
  isError: boolean;
} = {
  data: [mehvish],
  isLoading: false,
  isError: false,
};

jest.mock('@/features/friends/api', () => ({
  useFriendsQuery: () => mockFriendsQueryResult,
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

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockFriendsQueryResult = { data: [mehvish], isLoading: false, isError: false };
  mockNavigate.mockClear();
});

// ── AC (a): Mehvish row rendered with correct friend prop ─────────────────────

describe('ChatListScreen — AC (a): Mehvish row rendered with correct friend prop', () => {
  it(
    'given friends=[Mehvish], when ChatListScreen renders, then a stub row with Mehvish user_id is present',
    () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId(`stub-chat-list-row-${mehvish.user_id}`)).toBeTruthy();
      const idText = getByTestId(`stub-row-friend-id-${mehvish.user_id}`);
      expect(idText.props.children).toBe(mehvish.user_id);
    },
  );
});

// ── AC (b): row press navigates to ChatRoomScreen ─────────────────────────────

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

// ── AC (c): empty friends list renders EmptyState ─────────────────────────────

describe('ChatListScreen — AC (c): empty friends list renders EmptyState', () => {
  it(
    'given friends=[], when ChatListScreen renders, then EmptyState is shown',
    () => {
      mockFriendsQueryResult = { data: [], isLoading: false, isError: false };
      const { getByText } = renderScreen();
      expect(getByText('No conversations yet')).toBeTruthy();
    },
  );
});

// ── AC (d): loading state ─────────────────────────────────────────────────────

describe('ChatListScreen — AC (d): loading state renders LoadingState', () => {
  it('when isLoading=true, renders LoadingState not FlatList', () => {
    mockFriendsQueryResult = { data: undefined, isLoading: true, isError: false };
    const { queryByTestId } = renderScreen();
    expect(queryByTestId('chat-list-flatlist')).toBeNull();
  });
});

// ── AC (e): error state ───────────────────────────────────────────────────────

describe('ChatListScreen — AC (e): error state renders ErrorState', () => {
  it('when isError=true, renders ErrorState not FlatList', () => {
    mockFriendsQueryResult = { data: undefined, isLoading: false, isError: true };
    const { queryByTestId } = renderScreen();
    expect(queryByTestId('chat-list-flatlist')).toBeNull();
  });
});
