/**
 * Tests for `src/features/chat/screens/ChatRoomScreen.tsx` (story 16.5).
 *
 * Story 16.5: route param switched from `friendUserId` to `roomId`. Profile
 * resolution now uses `useRoomsQuery` cache lookup + `useProfileQuery`. Message
 * data comes from `useMessagesQuery` + `useSendMessageMutation`.
 *
 * Strategy: mocks out `useProfileQuery`, `useRoomsQuery`, `useMessagesQuery`,
 * `useSendMessageMutation`, `useOwnProfile`, `useRoute`, `useNavigation`, and
 * `react-native-safe-area-context` so we can render the screen in isolation.
 *
 * AC coverage:
 * (a) Friend name in header with numberOfLines=1 (name text visible).
 * (b) Messages from query rendered as bubbles (at least one sent + one received).
 * (c) Empty input shows Mic icon (chat-room-mic-btn present, chat-room-send-btn absent).
 * (d) Typing a character shows Send icon (chat-room-send-btn present, chat-room-mic-btn absent).
 * (e) Tapping Send calls mutateAsync with correct args and clears the input.
 * (f) Tapping triple-dot does not crash (chat-room-menu-btn testID present).
 * (g) Missing profile (profileQuery error/null) renders EmptyState, no composer or header.
 * (h) Back button calls navigation.goBack().
 * (i) Loading state shown when profileQuery.isLoading or roomsQuery.isLoading.
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

// ── Navigation mock ───────────────────────────────────────────────────────────

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const ROOM_ID = 'room-test-001';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: { roomId: ROOM_ID },
  }),
}));

// ── useOwnProfile mock ────────────────────────────────────────────────────────

const CURRENT_USER_ID = 'user-me-001';
const COUNTERPART_USER_ID = 'user-friend-002';

jest.mock('@/state/ownProfile/OwnProfileProvider', () => ({
  useOwnProfile: () => ({
    profile: { user_id: CURRENT_USER_ID },
    status: 'ready',
    error: null,
    refresh: jest.fn(),
  }),
}));

// ── useRoomsQuery mock ────────────────────────────────────────────────────────

type RoomsQueryResult = { data: any[] | undefined; isLoading: boolean; isError: boolean };
let mockRoomsQueryResult: RoomsQueryResult = {
  data: [{
    roomId: ROOM_ID,
    userA: CURRENT_USER_ID,
    userB: COUNTERPART_USER_ID,
    lastMessagePreview: 'Hi',
    lastMessageAt: null,
    lastMessageSenderId: null,
    lastMessageId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }],
  isLoading: false,
  isError: false,
};

// ── useMessagesQuery mock ─────────────────────────────────────────────────────

type MessagesQueryResult = {
  data: { pages: { items: any[]; nextToken: string | null }[] } | undefined;
  isLoading: boolean;
  isError: boolean;
};

let mockMessagesQueryResult: MessagesQueryResult = {
  data: { pages: [{ items: [], nextToken: null }] },
  isLoading: false,
  isError: false,
};

// ── useSendMessageMutation mock ───────────────────────────────────────────────

const mockMutateAsync = jest.fn().mockResolvedValue({
  messageId: 'msg-server-001',
  roomId: ROOM_ID,
  senderId: CURRENT_USER_ID,
  content: 'Hello',
  contentType: 'text',
  createdAt: new Date().toISOString(),
  deliveredAt: null,
});

jest.mock('@/features/chat/api', () => ({
  useRoomsQuery: () => mockRoomsQueryResult,
  useMessagesQuery: () => mockMessagesQueryResult,
  useSendMessageMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    isError: false,
  }),
}));

// ── useProfileQuery mock ──────────────────────────────────────────────────────

type ProfileQueryResult = {
  data: any;
  isLoading: boolean;
  isError: boolean;
};

let mockProfileQueryResult: ProfileQueryResult = {
  data: undefined,
  isLoading: false,
  isError: false,
};

jest.mock('@/features/profile/api', () => ({
  useProfileQuery: () => mockProfileQueryResult,
  profileQueryKey: (userId: string) => ['profile', userId],
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import type { UserProfile } from '@/types/api/UserProfile';

// ── Fixtures ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mehvish = require('../../../assets/dummymehvish.json') as UserProfile;

// Two test messages (one sent, one received) using real server `Message` shape.
const makeSentMessage = (id: string) => ({
  messageId: id,
  roomId: ROOM_ID,
  senderId: CURRENT_USER_ID,
  content: 'Hello from me',
  contentType: 'text',
  createdAt: new Date(Date.now() - 60_000).toISOString(),
  deliveredAt: null,
});

const makeReceivedMessage = (id: string) => ({
  messageId: id,
  roomId: ROOM_ID,
  senderId: COUNTERPART_USER_ID,
  content: 'Hello from friend',
  contentType: 'text',
  createdAt: new Date(Date.now() - 30_000).toISOString(),
  deliveredAt: new Date().toISOString(),
});

// ── Helper ────────────────────────────────────────────────────────────────────

function renderScreen() {
  const { ChatRoomScreen } = require('@/features/chat/screens/ChatRoomScreen') as
    typeof import('@/features/chat/screens/ChatRoomScreen');

  return render(
    <ThemeProvider>
      <ChatRoomScreen />
    </ThemeProvider>,
  );
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  mockGoBack.mockClear();
  mockNavigate.mockClear();
  mockMutateAsync.mockClear();

  // Default: Mehvish profile resolved, two test messages
  mockProfileQueryResult = { data: mehvish, isLoading: false, isError: false };
  mockRoomsQueryResult = {
    data: [{
      roomId: ROOM_ID,
      userA: CURRENT_USER_ID,
      userB: COUNTERPART_USER_ID,
      lastMessagePreview: 'Hi',
      lastMessageAt: null,
      lastMessageSenderId: null,
      lastMessageId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }],
    isLoading: false,
    isError: false,
  };
  mockMessagesQueryResult = {
    data: {
      pages: [{
        items: [makeSentMessage('msg-sent-001'), makeReceivedMessage('msg-recv-001')],
        nextToken: null,
      }],
    },
    isLoading: false,
    isError: false,
  };
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatRoomScreen — AC (a): friend name in header', () => {
  it(
    'given Mehvish is the counterpart, when ChatRoomScreen renders, then "Mehvish Hayat" is visible in the header',
    () => {
      const { getByText } = renderScreen();
      expect(getByText('Mehvish Hayat')).toBeTruthy();
    },
  );
});

describe('ChatRoomScreen — AC (b): messages rendered as bubbles', () => {
  it(
    'given two messages (one sent, one received), when ChatRoomScreen renders, then at least one bubble of each type is present',
    () => {
      const { getAllByTestId } = renderScreen();
      const sentBubbles = getAllByTestId('bubble-sent');
      const receivedBubbles = getAllByTestId('bubble-received');
      expect(sentBubbles.length).toBeGreaterThan(0);
      expect(receivedBubbles.length).toBeGreaterThan(0);
    },
  );
});

describe('ChatRoomScreen — AC (c): empty input shows Mic, no Send', () => {
  it(
    'given the composer has no text, when ChatRoomScreen renders, then Mic button is shown and Send button is absent',
    () => {
      const { getByTestId, queryByTestId } = renderScreen();
      expect(getByTestId('chat-room-mic-btn')).toBeTruthy();
      expect(queryByTestId('chat-room-send-btn')).toBeNull();
    },
  );
});

describe('ChatRoomScreen — AC (d): typing shows Send, no Mic', () => {
  it(
    'given the composer is empty, when the user types text, then Send button appears and Mic button is hidden',
    () => {
      const { getByTestId, queryByTestId } = renderScreen();

      const input = getByTestId('chat-room-input');
      fireEvent.changeText(input, 'Hello!');

      expect(getByTestId('chat-room-send-btn')).toBeTruthy();
      expect(queryByTestId('chat-room-mic-btn')).toBeNull();
    },
  );
});

describe('ChatRoomScreen — AC (e): Send tap calls mutateAsync and clears input', () => {
  it(
    'given non-empty input, when the Send button is pressed, then mutateAsync is called with correct args and input is cleared',
    async () => {
      const { getByTestId } = renderScreen();

      const input = getByTestId('chat-room-input');
      fireEvent.changeText(input, '  Hey!  ');

      const sendBtn = getByTestId('chat-room-send-btn');

      await act(async () => {
        fireEvent.press(sendBtn);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        content: 'Hey!',
        roomId: ROOM_ID,
        contentType: 'text',
      });
      // Input cleared: Mic button returns
      expect(getByTestId('chat-room-mic-btn')).toBeTruthy();
    },
  );
});

describe('ChatRoomScreen — AC (f): triple-dot no-op does not crash', () => {
  it(
    'given ChatRoomScreen is rendered, then chat-room-menu-btn testID is present and pressing it does not throw',
    () => {
      const { getByTestId } = renderScreen();
      const menuBtn = getByTestId('chat-room-menu-btn');
      expect(menuBtn).toBeTruthy();
      expect(() => fireEvent.press(menuBtn)).not.toThrow();
    },
  );
});

describe('ChatRoomScreen — AC (g): profile error renders EmptyState', () => {
  it(
    'given profileQuery.isError=true, when ChatRoomScreen renders, then EmptyState is shown with no composer or header',
    () => {
      mockProfileQueryResult = { data: undefined, isLoading: false, isError: true };

      const { getByText, queryByTestId } = renderScreen();

      expect(getByText('Conversation unavailable')).toBeTruthy();
      expect(queryByTestId('chat-room-input')).toBeNull();
      expect(queryByTestId('chat-room-menu-btn')).toBeNull();
    },
  );

  it(
    'given profileQuery.data=null, when ChatRoomScreen renders, then EmptyState is shown',
    () => {
      mockProfileQueryResult = { data: null, isLoading: false, isError: false };

      const { getByText } = renderScreen();

      expect(getByText('Conversation unavailable')).toBeTruthy();
    },
  );
});

describe('ChatRoomScreen — AC (h): back button calls navigation.goBack()', () => {
  it(
    'given ChatRoomScreen is rendered, when the back button is pressed, then navigation.goBack() is called',
    () => {
      const { getByTestId } = renderScreen();
      const backBtn = getByTestId('chat-room-back-btn');
      fireEvent.press(backBtn);
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    },
  );
});

describe('ChatRoomScreen — AC (i): loading state when rooms or profile query loading', () => {
  it(
    'given profileQuery.isLoading=true, when ChatRoomScreen renders, then loading indicator is shown and FlatList is absent',
    () => {
      mockProfileQueryResult = { data: undefined, isLoading: true, isError: false };
      const { getByTestId, queryByTestId } = renderScreen();
      expect(getByTestId('chat-room-loading')).toBeTruthy();
      expect(queryByTestId('chat-room-flatlist')).toBeNull();
    },
  );

  it(
    'given roomsQuery.isLoading=true, when ChatRoomScreen renders, then loading indicator is shown',
    () => {
      mockRoomsQueryResult = { data: undefined, isLoading: true, isError: false };
      const { getByTestId } = renderScreen();
      expect(getByTestId('chat-room-loading')).toBeTruthy();
    },
  );
});
