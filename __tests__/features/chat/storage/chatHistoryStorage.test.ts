/**
 * Unit tests for chatHistoryStorage (story 15.2).
 *
 * Uses the official `@react-native-async-storage/async-storage` jest mock,
 * already wired in `jest.config.js` via `moduleNameMapper`.
 *
 * AC coverage:
 * (a) Roundtrip — `saveHistory` then `getHistory` returns the same messages.
 * (b) Key uniqueness — writing to friend A's key does not affect friend B's key.
 * (c) `appendMessage` is idempotent by `message.id`.
 * (d) `updateMessage` patches only the provided fields and preserves others.
 * (e) `updateMessage` is a no-op (with console.warn) when the id is not found.
 * (f) `deleteMessage` removes exactly one message.
 * (g) `deleteMessage` is idempotent on a missing id (no error).
 * (h) `clearHistory` wipes the key; subsequent `getHistory` returns `[]`.
 * (i) Fail-open — corrupt JSON returns `[]` and logs `console.warn`.
 *
 * TODO(mock-only): remove when real messages endpoint ships
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  CHAT_HISTORY_KEY_PREFIX,
  appendMessage,
  chatHistoryKey,
  clearHistory,
  deleteMessage,
  getHistory,
  saveHistory,
  updateMessage,
} from '@/features/chat/storage/chatHistoryStorage';
import type { ChatMessage } from '@/types/ChatMessage';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FRIEND_A = 'friend-uuid-aaaa';
const FRIEND_B = 'friend-uuid-bbbb';

const msgRead: ChatMessage = {
  id: 'test-msg-0001',
  sender: 'friend',
  text: 'Hello there!',
  timestamp: 1724630400000,
  status: 'read',
};

const msgDelivered: ChatMessage = {
  id: 'test-msg-0002',
  sender: 'me',
  text: 'Hi, how are you?',
  timestamp: 1724631000000,
  status: 'delivered',
};

const msgSent: ChatMessage = {
  id: 'test-msg-0003',
  sender: 'me',
  text: 'Still waiting for a reply…',
  timestamp: 1724632000000,
  status: 'sent',
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// ── chatHistoryKey helper ─────────────────────────────────────────────────────

describe('chatHistoryKey', () => {
  it('returns CHAT_HISTORY_KEY_PREFIX concatenated with the friendUserId', () => {
    expect(chatHistoryKey(FRIEND_A)).toBe(`${CHAT_HISTORY_KEY_PREFIX}${FRIEND_A}`);
  });

  it('given two different friendUserIds, returns two different keys', () => {
    expect(chatHistoryKey(FRIEND_A)).not.toBe(chatHistoryKey(FRIEND_B));
  });
});

// ── CHAT_HISTORY_KEY_PREFIX export ────────────────────────────────────────────

describe('CHAT_HISTORY_KEY_PREFIX', () => {
  it('is exported and equals "dummy.chat."', () => {
    expect(CHAT_HISTORY_KEY_PREFIX).toBe('dummy.chat.');
  });
});

// ── AC (a): roundtrip ────────────────────────────────────────────────────────

describe('saveHistory + getHistory', () => {
  it('given messages saved via saveHistory, when getHistory is called, then returns the same messages', async () => {
    await saveHistory(FRIEND_A, [msgRead, msgDelivered]);

    const result = await getHistory(FRIEND_A);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(msgRead);
    expect(result[1]).toEqual(msgDelivered);
  });

  it('given storage is empty for a friend, when getHistory is called, then returns []', async () => {
    const result = await getHistory(FRIEND_A);
    expect(result).toEqual([]);
  });
});

// ── AC (b): key uniqueness ───────────────────────────────────────────────────

describe('key uniqueness', () => {
  it('given messages written for friend A, when getHistory is called for friend B, then returns []', async () => {
    await saveHistory(FRIEND_A, [msgRead, msgDelivered]);

    const resultB = await getHistory(FRIEND_B);

    expect(resultB).toEqual([]);
  });

  it('given messages written for friend A and friend B, when each is read, then the arrays are independent', async () => {
    const msgA: ChatMessage = { ...msgRead, id: 'msg-a-only' };
    const msgB: ChatMessage = { ...msgDelivered, id: 'msg-b-only' };

    await saveHistory(FRIEND_A, [msgA]);
    await saveHistory(FRIEND_B, [msgB]);

    const resultA = await getHistory(FRIEND_A);
    const resultB = await getHistory(FRIEND_B);

    expect(resultA).toHaveLength(1);
    expect(resultA[0]?.id).toBe('msg-a-only');
    expect(resultB).toHaveLength(1);
    expect(resultB[0]?.id).toBe('msg-b-only');
  });
});

// ── AC (c): appendMessage idempotent by id ───────────────────────────────────

describe('appendMessage', () => {
  it('given empty history, when appendMessage is called, then the message is persisted', async () => {
    await appendMessage(FRIEND_A, msgRead);

    const result = await getHistory(FRIEND_A);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(msgRead.id);
  });

  it('given message already present, when appendMessage is called with the same id, then array length stays 1 (idempotent)', async () => {
    await appendMessage(FRIEND_A, msgRead);
    await appendMessage(FRIEND_A, msgRead);

    const result = await getHistory(FRIEND_A);
    expect(result).toHaveLength(1);
  });

  it('given two messages with different ids, when both are appended, then array length is 2', async () => {
    await appendMessage(FRIEND_A, msgRead);
    await appendMessage(FRIEND_A, msgDelivered);

    const result = await getHistory(FRIEND_A);
    expect(result).toHaveLength(2);
  });
});

// ── AC (d): updateMessage patches only provided fields ───────────────────────

describe('updateMessage — successful patch', () => {
  it('given a message with status "delivered", when updateMessage patches status to "read", then status is updated and text is preserved', async () => {
    await saveHistory(FRIEND_A, [msgDelivered]);

    await updateMessage(FRIEND_A, msgDelivered.id, { status: 'read' });

    const result = await getHistory(FRIEND_A);
    expect(result[0]?.status).toBe('read');
    expect(result[0]?.text).toBe(msgDelivered.text);
    expect(result[0]?.sender).toBe(msgDelivered.sender);
    expect(result[0]?.timestamp).toBe(msgDelivered.timestamp);
  });

  it('given a message without editedAt, when updateMessage patches text and editedAt, then both fields are set', async () => {
    await saveHistory(FRIEND_A, [msgRead]);

    const editedAt = 1724700000000;
    await updateMessage(FRIEND_A, msgRead.id, { text: 'Edited text', editedAt });

    const result = await getHistory(FRIEND_A);
    expect(result[0]?.text).toBe('Edited text');
    expect(result[0]?.editedAt).toBe(editedAt);
    // Other fields untouched
    expect(result[0]?.id).toBe(msgRead.id);
    expect(result[0]?.status).toBe(msgRead.status);
  });

  it('given two messages, when one is patched, then only that message is changed', async () => {
    await saveHistory(FRIEND_A, [msgRead, msgDelivered]);

    await updateMessage(FRIEND_A, msgDelivered.id, { status: 'read' });

    const result = await getHistory(FRIEND_A);
    expect(result[0]?.id).toBe(msgRead.id);
    expect(result[0]?.status).toBe('read'); // msgRead was already read — unchanged
    expect(result[1]?.id).toBe(msgDelivered.id);
    expect(result[1]?.status).toBe('read'); // patched
  });
});

// ── AC (e): updateMessage no-op on missing id ─────────────────────────────────

describe('updateMessage — missing id', () => {
  it('given messageId not found, when updateMessage is called, then storage is unchanged and console.warn is called', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await saveHistory(FRIEND_A, [msgRead]);

    await updateMessage(FRIEND_A, 'non-existent-msg-id', { status: 'read' });

    const result = await getHistory(FRIEND_A);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(msgRead.id);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('non-existent-msg-id'));

    warnSpy.mockRestore();
  });
});

// ── AC (f): deleteMessage removes exactly one message ────────────────────────

describe('deleteMessage — removes message', () => {
  it('given a single message, when deleteMessage is called, then history is empty', async () => {
    await saveHistory(FRIEND_A, [msgRead]);

    await deleteMessage(FRIEND_A, msgRead.id);

    const result = await getHistory(FRIEND_A);
    expect(result).toHaveLength(0);
  });

  it('given two messages, when deleteMessage is called for one, then only the other remains', async () => {
    await saveHistory(FRIEND_A, [msgRead, msgDelivered]);

    await deleteMessage(FRIEND_A, msgRead.id);

    const result = await getHistory(FRIEND_A);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(msgDelivered.id);
  });
});

// ── AC (g): deleteMessage idempotent on missing id ───────────────────────────

describe('deleteMessage — idempotent on missing id', () => {
  it('given a message not in storage, when deleteMessage is called, then resolves without error', async () => {
    await saveHistory(FRIEND_A, [msgRead]);

    await expect(deleteMessage(FRIEND_A, 'non-existent-id')).resolves.toBeUndefined();

    const result = await getHistory(FRIEND_A);
    expect(result).toHaveLength(1);
  });

  it('given empty storage, when deleteMessage is called, then resolves without error', async () => {
    await expect(deleteMessage(FRIEND_A, 'any-id')).resolves.toBeUndefined();
    const result = await getHistory(FRIEND_A);
    expect(result).toEqual([]);
  });
});

// ── AC (h): clearHistory ─────────────────────────────────────────────────────

describe('clearHistory', () => {
  it('given messages in storage, when clearHistory is called, then subsequent getHistory returns []', async () => {
    await saveHistory(FRIEND_A, [msgRead, msgDelivered, msgSent]);

    await clearHistory(FRIEND_A);

    const result = await getHistory(FRIEND_A);
    expect(result).toEqual([]);
  });

  it('given empty storage, when clearHistory is called, then getHistory still returns []', async () => {
    await clearHistory(FRIEND_A);
    const result = await getHistory(FRIEND_A);
    expect(result).toEqual([]);
  });

  it('given friend A and friend B each have messages, when clearHistory is called for friend A, then friend B is unaffected', async () => {
    await saveHistory(FRIEND_A, [msgRead]);
    await saveHistory(FRIEND_B, [msgDelivered]);

    await clearHistory(FRIEND_A);

    const resultA = await getHistory(FRIEND_A);
    const resultB = await getHistory(FRIEND_B);
    expect(resultA).toEqual([]);
    expect(resultB).toHaveLength(1);
  });
});

// ── AC (i): fail-open on corrupt JSON ────────────────────────────────────────

describe('getHistory — fail-open on corrupt JSON', () => {
  it('given storage contains corrupt JSON, when getHistory is called, then returns [] and logs console.warn', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await AsyncStorage.setItem(chatHistoryKey(FRIEND_A), '{ bad json {{{{');

    const result = await getHistory(FRIEND_A);

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('failed to parse stored JSON'));

    warnSpy.mockRestore();
  });
});
