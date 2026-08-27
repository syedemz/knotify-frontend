/**
 * Tests for `src/features/chat/components/MessageBubble.tsx` (story 15.5).
 *
 * AC coverage:
 * (a) Sent messages queryable by testID='bubble-sent'.
 * (b) Received messages queryable by testID='bubble-received'.
 * (c) Message text rendered inside the bubble.
 * (d) Timestamp in HH:mm format rendered.
 * (e) editedAt suffix renders '· edited' text.
 * (f) Status icon renders for 'sent' (Check), 'delivered' (CheckCheck), 'read' (CheckCheck tinted).
 * (g) Status icons only present for sender==='me'.
 * (h) No status icons for received (sender==='friend') messages.
 *
 * NOTE: Do NOT assert literal style values. RNTL flattens StyleSheet styles
 * unpredictably. Use semantic testIDs as the verification axis.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import type { ChatMessage } from '@/types/ChatMessage';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** A sent message with status='sent'. */
const sentMessage: ChatMessage = {
  id: 'test-sent-001',
  sender: 'me',
  text: 'Hello, how are you?',
  timestamp: new Date(2024, 7, 26, 9, 5, 0).getTime(), // 09:05
  status: 'sent',
};

/** A delivered message. */
const deliveredMessage: ChatMessage = {
  id: 'test-delivered-001',
  sender: 'me',
  text: 'Delivered message',
  timestamp: new Date(2024, 7, 26, 10, 30, 0).getTime(), // 10:30
  status: 'delivered',
};

/** A read message. */
const readMessage: ChatMessage = {
  id: 'test-read-001',
  sender: 'me',
  text: 'Read message',
  timestamp: new Date(2024, 7, 26, 11, 0, 0).getTime(), // 11:00
  status: 'read',
};

/** A received message. */
const receivedMessage: ChatMessage = {
  id: 'test-received-001',
  sender: 'friend',
  text: 'Hey there!',
  timestamp: new Date(2024, 7, 26, 8, 45, 0).getTime(), // 08:45
  status: 'read',
};

/** A sent message with editedAt set. */
const editedMessage: ChatMessage = {
  id: 'test-edited-001',
  sender: 'me',
  text: 'This was edited',
  timestamp: new Date(2024, 7, 26, 14, 0, 0).getTime(), // 14:00
  status: 'delivered',
  editedAt: new Date(2024, 7, 26, 14, 5, 0).getTime(),
};

// ── Helper ────────────────────────────────────────────────────────────────────

function renderBubble(message: ChatMessage) {
  const { MessageBubble } = require('@/features/chat/components/MessageBubble') as
    typeof import('@/features/chat/components/MessageBubble');

  return render(
    <ThemeProvider>
      <MessageBubble message={message} />
    </ThemeProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MessageBubble — AC (a): sent testID', () => {
  it(
    'given a sent message (sender="me"), when MessageBubble renders, then testID="bubble-sent" is present',
    () => {
      const { getByTestId } = renderBubble(sentMessage);
      expect(getByTestId('bubble-sent')).toBeTruthy();
    },
  );
});

describe('MessageBubble — AC (b): received testID', () => {
  it(
    'given a received message (sender="friend"), when MessageBubble renders, then testID="bubble-received" is present',
    () => {
      const { getByTestId } = renderBubble(receivedMessage);
      expect(getByTestId('bubble-received')).toBeTruthy();
    },
  );
});

describe('MessageBubble — AC (c): message text', () => {
  it(
    'given a sent message, when MessageBubble renders, then the message text is visible',
    () => {
      const { getByText } = renderBubble(sentMessage);
      expect(getByText('Hello, how are you?')).toBeTruthy();
    },
  );

  it(
    'given a received message, when MessageBubble renders, then the message text is visible',
    () => {
      const { getByText } = renderBubble(receivedMessage);
      expect(getByText('Hey there!')).toBeTruthy();
    },
  );
});

describe('MessageBubble — AC (d): HH:mm timestamp', () => {
  it(
    'given a sent message at 09:05, when MessageBubble renders, then "09:05" is visible',
    () => {
      const { getByText } = renderBubble(sentMessage);
      // Timestamp "09:05" appears in the footer — assert via text content
      expect(getByText('09:05')).toBeTruthy();
    },
  );

  it(
    'given a received message at 08:45, when MessageBubble renders, then "08:45" is visible',
    () => {
      const { getByText } = renderBubble(receivedMessage);
      expect(getByText('08:45')).toBeTruthy();
    },
  );
});

describe('MessageBubble — AC (e): editedAt suffix', () => {
  it(
    'given a message with editedAt set, when MessageBubble renders, then the edited suffix is visible',
    () => {
      const { getAllByText } = renderBubble(editedMessage);
      // The footer Text element shows "14:00 · edited".
      // getAllByText with regex collects all matches; we assert at least one exists.
      const matches = getAllByText(/edited/);
      expect(matches.length).toBeGreaterThan(0);
    },
  );

  it(
    'given a message without editedAt, when MessageBubble renders, then no edited suffix is shown',
    () => {
      const { queryAllByText } = renderBubble(sentMessage);
      expect(queryAllByText(/edited/).length).toBe(0);
    },
  );
});

describe('MessageBubble — AC (f): status icons for sent messages', () => {
  it(
    'given status="sent", when MessageBubble renders, then the status-icon-sent testID is present',
    () => {
      const { getByTestId } = renderBubble(sentMessage);
      expect(getByTestId('status-icon-sent')).toBeTruthy();
    },
  );

  it(
    'given status="delivered", when MessageBubble renders, then the status-icon-delivered testID is present',
    () => {
      const { getByTestId } = renderBubble(deliveredMessage);
      expect(getByTestId('status-icon-delivered')).toBeTruthy();
    },
  );

  it(
    'given status="read", when MessageBubble renders, then the status-icon-read testID is present',
    () => {
      const { getByTestId } = renderBubble(readMessage);
      expect(getByTestId('status-icon-read')).toBeTruthy();
    },
  );
});

describe('MessageBubble — AC (g/h): status icons only for sent messages', () => {
  it(
    'given a received message (sender="friend"), when MessageBubble renders, then no status icon is present',
    () => {
      const { queryByTestId } = renderBubble(receivedMessage);
      expect(queryByTestId('status-icon-sent')).toBeNull();
      expect(queryByTestId('status-icon-delivered')).toBeNull();
      expect(queryByTestId('status-icon-read')).toBeNull();
    },
  );
});
