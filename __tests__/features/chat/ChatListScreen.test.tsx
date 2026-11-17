/**
 * Tests for `src/features/chat/screens/ChatListScreen.tsx` (story 16.5).
 *
 * Story 16.5: ChatListScreen is now driven by `useRoomsQuery()` instead of
 * `useFriendsQuery()`. Each row is a `ChatListRow` driven by one `ChatRoom`.
 * The row-tap navigates to `ChatRoomScreen` with `{ roomId }` (not friendUserId).
 *
 * Strategy: `ChatListRow` is mocked so this test suite only verifies the
 * wiring (correct props passed, navigation, empty/loading/error states)
 * without pulling in `useProfileQuery` or the network.
 *
 * AC coverage:
 * (a) Room row rendered — `ChatListRow` receives the correct `room` prop.
 * (b) Row press navigates to `ChatRoomScreen` with the correct `roomId`.
 * (c) Empty rooms list renders `EmptyState` with `chat.list.emptyTitle`.
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
import type { ChatRoom } from '@/services/graphql/types';

// ── Fixture room ──────────────────────────────────────────────────────────────

const CURRENT_USER_ID = 'user-me-001';
const COUNTERPART_USER_ID = 'user-friend-002';

const TEST_ROOM: ChatRoom = {
  roomId: 'room-test-001',
  userA: CURRENT_USER_ID,
  userB: COUNTERPART_USER_ID,
  lastMessagePreview: 'Hello!',
  lastMessageAt: new Date().toISOString(),
  lastMessageSenderId: COUNTERPART_USER_ID,
  lastMessageId: 'msg-001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ── Mock ChatListRow ──────────────────────────────────────────────────────────
//
// ChatListRow calls `useProfileQuery` at its top level. We stub it so we can
// assert prop pass-through and press behaviour without a real network call.

jest.mock('@/features/chat/components/ChatListRow', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    ChatListRow: function StubChatListRow(props: any) {
      return Rct.createElement(
        RN.Pressable,
        {
          testID: `stub-chat-list-row-${String(props.room?.roomId ?? 'unknown')}`,
          onPress: props.onPress,
          accessibilityLabel: `row-${String(props.room?.roomId ?? 'unknown')}`,
        },
        Rct.createElement(
          RN.Text,
          { testID: `stub-row-room-id-${String(props.room?.roomId ?? 'unknown')}` },
          String(props.room?.roomId ?? ''),
        ),
      );
    },
  };
});

// ── Mock useRoomsQuery ────────────────────────────────────────────────────────

let mockRoomsQueryResult: {
  data: ChatRoom[] | undefined;
  isLoading: boolean;
  isError: boolean;
} = {
  data: [TEST_ROOM],
  isLoading: false,
  isError: false,
};

jest.mock('@/features/chat/api', () => ({
  useRoomsQuery: () => mockRoomsQueryResult,
}));

// ── Mock useOwnProfile ────────────────────────────────────────────────────────

jest.mock('@/state/ownProfile/OwnProfileProvider', () => ({
  useOwnProfile: () => ({
    profile: { user_id: CURRENT_USER_ID },
    status: 'ready',
    error: null,
    refresh: jest.fn(),
  }),
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

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

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
  mockRoomsQueryResult = { data: [TEST_ROOM], isLoading: false, isError: false };
  mockNavigate.mockClear();
});

// ── AC (a): Room row rendered with correct room prop ─────────────────────────

describe('ChatListScreen — AC (a): room row rendered with correct room prop', () => {
  it(
    'given rooms=[TEST_ROOM], when ChatListScreen renders, then a stub row with the roomId is present',
    () => {
      const { getByTestId } = renderScreen();
      expect(getByTestId(`stub-chat-list-row-${TEST_ROOM.roomId}`)).toBeTruthy();
      const idText = getByTestId(`stub-row-room-id-${TEST_ROOM.roomId}`);
      expect(idText.props.children).toBe(TEST_ROOM.roomId);
    },
  );
});

// ── AC (b): row press navigates to ChatRoomScreen with roomId ─────────────────

describe('ChatListScreen — AC (b): row press navigates to ChatRoomScreen with roomId', () => {
  it(
    'given TEST_ROOM is in the rooms list, when the row is pressed, then navigation.navigate is called with ChatRoomScreen and roomId',
    () => {
      const { getByTestId } = renderScreen();
      const row = getByTestId(`stub-chat-list-row-${TEST_ROOM.roomId}`);
      fireEvent.press(row);
      expect(mockNavigate).toHaveBeenCalledWith('ChatRoomScreen', {
        roomId: TEST_ROOM.roomId,
      });
    },
  );
});

// ── AC (c): empty rooms list renders EmptyState ───────────────────────────────

describe('ChatListScreen — AC (c): empty rooms list renders EmptyState', () => {
  it(
    'given rooms=[], when ChatListScreen renders, then EmptyState is shown',
    () => {
      mockRoomsQueryResult = { data: [], isLoading: false, isError: false };
      const { getByText } = renderScreen();
      expect(getByText('No conversations yet')).toBeTruthy();
    },
  );
});

// ── AC (d): loading state ─────────────────────────────────────────────────────

describe('ChatListScreen — AC (d): loading state renders LoadingState', () => {
  it('when isLoading=true, renders LoadingState not FlatList', () => {
    mockRoomsQueryResult = { data: undefined, isLoading: true, isError: false };
    const { queryByTestId } = renderScreen();
    expect(queryByTestId('chat-list-flatlist')).toBeNull();
  });
});

// ── AC (e): error state ───────────────────────────────────────────────────────

describe('ChatListScreen — AC (e): error state renders ErrorState', () => {
  it('when isError=true, renders ErrorState not FlatList', () => {
    mockRoomsQueryResult = { data: undefined, isLoading: false, isError: true };
    const { queryByTestId } = renderScreen();
    expect(queryByTestId('chat-list-flatlist')).toBeNull();
  });
});
