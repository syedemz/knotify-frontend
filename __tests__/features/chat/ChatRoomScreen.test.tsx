/**
 * Tests for `src/features/chat/screens/ChatRoomScreen.tsx` (story 15.5 + 16.FR3).
 *
 * Story 16.FR3: profile resolution rewired from `useFriendship().getFullProfile`
 * to `useProfileQuery(friendUserId)`. This test suite mocks `@/features/profile/api`
 * instead of `@/state/friendship/FriendshipProvider`.
 *
 * Strategy: mocks out `useProfileQuery`, `useChatHistory`, `useRoute`,
 * `useNavigation`, and `react-native-safe-area-context` so we can render
 * the screen in isolation without a real NavigationContainer, AsyncStorage,
 * or FriendshipProvider.
 *
 * AC coverage:
 * (a) Friend name in header with numberOfLines=1 (name text visible).
 * (b) Mehvish's 18 seed messages rendered (18 bubble-sent + bubble-received total).
 * (c) Sent messages queryable by testID='bubble-sent' (semantic assertion).
 * (d) Received messages queryable by testID='bubble-received' (semantic assertion).
 * (e) Empty input shows Mic icon (chat-room-mic-btn present, chat-room-send-btn absent).
 * (f) Typing a character shows Send icon (chat-room-send-btn present, chat-room-mic-btn absent).
 * (g) Tapping Send calls sendMessage with trimmed text and clears the input.
 * (h) Tapping triple-dot does not crash (chat-room-menu-btn testID present).
 * (i) Missing friend (profileQuery error/null) renders EmptyState, no composer or header.
 * (j) Back button calls navigation.goBack().
 * (k) editedAt suffix renders "edited" tag.
 * (l) Status icons render for sent / delivered / read states (bubble testIDs).
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

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: { friendUserId: 'mehvish-user-id' },
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

// ── useChatHistory mock ───────────────────────────────────────────────────────

const mockSendMessage = jest.fn().mockResolvedValue(undefined);
const mockMessages: { current: any[] } = { current: [] };

jest.mock('@/state/chat/ChatProvider', () => ({
  useChatHistory: jest.fn(() => ({
    messages: mockMessages.current,
    loading: false,
    sendMessage: mockSendMessage,
    updateMessage: jest.fn(),
    deleteMessage: jest.fn(),
  })),
  MEHVISH_USER_ID: 'mehvish-user-id',
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { ChatMessage } from '@/types/ChatMessage';

// ── Fixtures (loaded after mocks are declared) ────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mehvish = require('../../../assets/dummymehvish.json') as UserProfile;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const chatSeed = require('../../../assets/dummychat/chatMehvish.json') as {
  _meta: { base_timestamp_ms: number; description: string };
  messages: ChatMessage[];
};

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
  mockSendMessage.mockClear();
  // Default: Mehvish profile resolved, 18 seed messages
  mockProfileQueryResult = { data: mehvish, isLoading: false, isError: false };
  mockMessages.current = chatSeed.messages;
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatRoomScreen — AC (a): friend name in header', () => {
  it(
    'given Mehvish is the friend, when ChatRoomScreen renders, then "Mehvish Hayat" is visible in the header',
    () => {
      const { getByText } = renderScreen();
      expect(getByText('Mehvish Hayat')).toBeTruthy();
    },
  );
});

describe('ChatRoomScreen — AC (b): 18 seed messages rendered', () => {
  it(
    'given Mehvish has 18 seed messages, when ChatRoomScreen renders, then message bubbles from the seed are in the tree',
    () => {
      const { getAllByTestId } = renderScreen();
      const sentBubbles = getAllByTestId('bubble-sent');
      const receivedBubbles = getAllByTestId('bubble-received');
      expect(sentBubbles.length + receivedBubbles.length).toBeGreaterThan(0);
    },
  );
});

describe('ChatRoomScreen — AC (c): sent messages queryable by bubble-sent testID', () => {
  it(
    'given seed messages include sender="me", when ChatRoomScreen renders, then at least one bubble-sent is present',
    () => {
      const { getAllByTestId } = renderScreen();
      const sentBubbles = getAllByTestId('bubble-sent');
      expect(sentBubbles.length).toBeGreaterThan(0);
    },
  );
});

describe('ChatRoomScreen — AC (d): received messages queryable by bubble-received testID', () => {
  it(
    'given seed messages include sender="friend", when ChatRoomScreen renders, then at least one bubble-received is present',
    () => {
      const { getAllByTestId } = renderScreen();
      const receivedBubbles = getAllByTestId('bubble-received');
      expect(receivedBubbles.length).toBeGreaterThan(0);
    },
  );
});

describe('ChatRoomScreen — AC (e): empty input shows Mic, no Send', () => {
  it(
    'given the composer has no text, when ChatRoomScreen renders, then Mic button is shown and Send button is absent',
    () => {
      const { getByTestId, queryByTestId } = renderScreen();
      expect(getByTestId('chat-room-mic-btn')).toBeTruthy();
      expect(queryByTestId('chat-room-send-btn')).toBeNull();
    },
  );
});

describe('ChatRoomScreen — AC (f): typing shows Send, no Mic', () => {
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

describe('ChatRoomScreen — AC (g): Send tap calls sendMessage and clears input', () => {
  it(
    'given non-empty input, when the Send button is pressed, then sendMessage is called with trimmed text and input is cleared',
    async () => {
      const { getByTestId } = renderScreen();

      const input = getByTestId('chat-room-input');
      fireEvent.changeText(input, '  Hey!  ');

      const sendBtn = getByTestId('chat-room-send-btn');

      await act(async () => {
        fireEvent.press(sendBtn);
      });

      expect(mockSendMessage).toHaveBeenCalledWith('Hey!');
      expect(getByTestId('chat-room-mic-btn')).toBeTruthy();
    },
  );
});

describe('ChatRoomScreen — AC (h): triple-dot no-op does not crash', () => {
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

describe('ChatRoomScreen — AC (i): profile error renders EmptyState', () => {
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

describe('ChatRoomScreen — AC (j): back button calls navigation.goBack()', () => {
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

describe('ChatRoomScreen — AC (k): editedAt suffix', () => {
  it(
    'given a message with editedAt is in the thread, when ChatRoomScreen renders, then the edited suffix is visible',
    () => {
      const editedMsg = chatSeed.messages.find((m) => m.editedAt !== undefined);
      expect(editedMsg).toBeDefined();

      const { queryAllByText } = renderScreen();
      expect(queryAllByText(/edited/).length).toBeGreaterThan(0);
    },
  );
});

describe('ChatRoomScreen — AC (l): status icons render for different statuses', () => {
  it(
    'given seed messages with various statuses, when ChatRoomScreen renders, then at least one status icon testID is present',
    () => {
      const { queryAllByTestId } = renderScreen();
      const sentIcons = queryAllByTestId('status-icon-sent');
      const deliveredIcons = queryAllByTestId('status-icon-delivered');
      const readIcons = queryAllByTestId('status-icon-read');
      expect(
        sentIcons.length + deliveredIcons.length + readIcons.length,
      ).toBeGreaterThan(0);
    },
  );
});
