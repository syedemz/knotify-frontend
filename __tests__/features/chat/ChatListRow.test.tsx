/**
 * Tests for `src/features/chat/components/ChatListRow.tsx` (story 15.4).
 *
 * AC coverage:
 * (a) Renders friend name from `friend.first_name + last_name`.
 * (b) Renders the last-message preview text from seeded messages.
 * (c) Renders a formatted timestamp when messages are present.
 * (d) Empty messages array renders `chat.list.noMessagesYet` label.
 * (e) Press calls the `onPress` prop.
 * (f) accessibilityRole is "button".
 * (g) accessibilityLabel is the interpolated `chat.list.rowAccessibility` label.
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
import type { ChatMessage } from '@/types/ChatMessage';

// ── Mehvish fixture ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mehvish = require('../../../assets/dummymehvish.json') as DummyFullProfile;

// ── Mock useChatHistory ────────────────────────────────────────────────────────
//
// ChatListRow calls `useChatHistory(friend.user_id)` at its top level.
// We mock the module so each test can control the returned messages/loading state
// without spinning up AsyncStorage or a real ChatProvider.

const mockMessages: ChatMessage[] = [];
let mockLoading = false;

jest.mock('@/state/chat/ChatProvider', () => ({
  useChatHistory: jest.fn(() => ({
    messages: mockMessages,
    loading: mockLoading,
    sendMessage: jest.fn(),
    updateMessage: jest.fn(),
    deleteMessage: jest.fn(),
  })),
}));

// ── Helper ────────────────────────────────────────────────────────────────────

function renderRow(friend: DummyFullProfile, onPress = jest.fn()) {
  const { ChatListRow } = require('@/features/chat/components/ChatListRow') as
    typeof import('@/features/chat/components/ChatListRow');

  return render(
    <ThemeProvider>
      <ChatListRow friend={friend} onPress={onPress} />
    </ThemeProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatListRow — AC (a): renders friend name', () => {
  beforeEach(() => {
    mockMessages.length = 0;
    mockLoading = false;
  });

  it(
    'given a friend, when ChatListRow renders, then the full name is visible',
    () => {
      const { getByText } = renderRow(mehvish);
      expect(getByText('Mehvish Hayat')).toBeTruthy();
    },
  );
});

describe('ChatListRow — AC (b): renders last-message preview', () => {
  beforeEach(() => {
    mockMessages.length = 0;
    mockLoading = false;
  });

  it(
    'given non-empty messages, when ChatListRow renders, then the last message text is shown',
    () => {
      // Seed two messages; the last one should be displayed.
      const seed: ChatMessage[] = [
        {
          id: 'msg-1',
          sender: 'friend',
          text: 'Hello there',
          timestamp: Date.now() - 120_000,
          status: 'read',
        },
        {
          id: 'msg-2',
          sender: 'me',
          text: 'Hey! How are you?',
          timestamp: Date.now() - 60_000,
          status: 'sent',
        },
      ];
      seed.forEach((m) => mockMessages.push(m));

      const { getByText } = renderRow(mehvish);
      expect(getByText('Hey! How are you?')).toBeTruthy();
    },
  );
});

describe('ChatListRow — AC (c): renders formatted timestamp', () => {
  beforeEach(() => {
    mockMessages.length = 0;
    mockLoading = false;
  });

  it(
    'given a message sent today, when ChatListRow renders, then a HH:mm timestamp appears',
    () => {
      const now = Date.now();
      const seed: ChatMessage[] = [
        {
          id: 'msg-ts',
          sender: 'friend',
          text: 'Test message',
          // Use a fixed timestamp at e.g. 09:05 today. We cannot know the
          // exact HH:mm that will render (depends on current time), so we just
          // assert a colon-separated pair of two-digit strings is present.
          timestamp: new Date(
            new Date(now).getFullYear(),
            new Date(now).getMonth(),
            new Date(now).getDate(),
            9, 5, 0,
          ).getTime(),
          status: 'read',
        },
      ];
      seed.forEach((m) => mockMessages.push(m));

      const { getByText } = renderRow(mehvish);
      // The formatted result should be "09:05"
      expect(getByText('09:05')).toBeTruthy();
    },
  );
});

describe('ChatListRow — AC (d): empty messages renders noMessagesYet label', () => {
  beforeEach(() => {
    mockMessages.length = 0;
    mockLoading = false;
  });

  it(
    'given empty messages array, when ChatListRow renders, then chat.list.noMessagesYet is shown',
    () => {
      // mockMessages is empty
      const { getByText } = renderRow(mehvish);
      expect(getByText('No messages yet')).toBeTruthy();
    },
  );

  it(
    'given loading=true with empty messages, when ChatListRow renders, then the noMessagesYet fallback is shown',
    () => {
      mockLoading = true;
      const { getByText } = renderRow(mehvish);
      expect(getByText('No messages yet')).toBeTruthy();
    },
  );
});

describe('ChatListRow — AC (e): press calls onPress', () => {
  beforeEach(() => {
    mockMessages.length = 0;
    mockLoading = false;
  });

  it(
    'given ChatListRow is rendered, when the row is pressed, then onPress is called',
    () => {
      const onPress = jest.fn();
      const { getByTestId } = renderRow(mehvish, onPress);
      const row = getByTestId(`chat-list-row-${mehvish.user_id}`);
      fireEvent.press(row);
      expect(onPress).toHaveBeenCalledTimes(1);
    },
  );
});

describe('ChatListRow — AC (f): accessibilityRole', () => {
  beforeEach(() => {
    mockMessages.length = 0;
    mockLoading = false;
  });

  it(
    'given ChatListRow is rendered, then the root element has accessibilityRole "button"',
    () => {
      const { getByTestId } = renderRow(mehvish);
      const row = getByTestId(`chat-list-row-${mehvish.user_id}`);
      expect(row.props.accessibilityRole).toBe('button');
    },
  );
});

describe('ChatListRow — AC (g): interpolated accessibilityLabel', () => {
  beforeEach(() => {
    mockMessages.length = 0;
    mockLoading = false;
  });

  it(
    'given ChatListRow is rendered with Mehvish, then accessibilityLabel contains "Mehvish Hayat"',
    () => {
      const { getByTestId } = renderRow(mehvish);
      const row = getByTestId(`chat-list-row-${mehvish.user_id}`);
      const label: string = row.props.accessibilityLabel as string;
      expect(label).toContain('Mehvish');
      expect(label).toContain('Hayat');
    },
  );
});
