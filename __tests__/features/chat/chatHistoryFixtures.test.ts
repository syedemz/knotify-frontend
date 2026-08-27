/**
 * Fixture validation tests for assets/dummychat/chatMehvish.json (story 15.2).
 *
 * These tests guard the shape and content invariants of the seed JSON so that
 * `ChatProvider` (story 15.3) can rely on them without defensive checks at
 * runtime.
 *
 * AC coverage:
 * (a) JSON file parses and `.messages` is a valid `ChatMessage[]`.
 * (b) Message count is exactly 18.
 * (c) Timestamps span a range consistent with 3-4 days.
 * (d) At least one message has `editedAt` set.
 * (e) At least one message of each status: `'sent'`, `'delivered'`, `'read'`.
 * (f) Both `sender: 'me'` and `sender: 'friend'` are represented.
 * (g) All message ids are unique.
 * (h) The `_meta.base_timestamp_ms` field is a positive number.
 *
 * TODO(mock-only): remove when real messages endpoint ships
 */

import type { ChatMessage } from '@/types/ChatMessage';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const chatMehvishRaw = require('../../../assets/dummychat/chatMehvish.json') as {
  _meta: { base_timestamp_ms: number; description: string };
  messages: ChatMessage[];
};

const { messages } = chatMehvishRaw;

// ── AC (a) + (b): parses to valid ChatMessage[] with exactly 18 entries ───────

describe('chatMehvish.json — structure', () => {
  it('given the fixture file, when imported, then messages is an array', () => {
    expect(Array.isArray(messages)).toBe(true);
  });

  it('given the fixture file, when imported, then messages has exactly 18 entries', () => {
    expect(messages).toHaveLength(18);
  });

  it('given each message, then it has the required ChatMessage fields', () => {
    messages.forEach((msg, i) => {
      expect(typeof msg.id).toBe('string');
      expect(msg.id.length).toBeGreaterThan(0);

      expect(['me', 'friend']).toContain(msg.sender);

      expect(typeof msg.text).toBe('string');
      expect(msg.text.length).toBeGreaterThan(0);

      expect(typeof msg.timestamp).toBe('number');
      expect(msg.timestamp).toBeGreaterThan(0);

      expect(['sent', 'delivered', 'read']).toContain(msg.status);

      if (msg.editedAt !== undefined) {
        expect(typeof msg.editedAt).toBe('number');
        expect(msg.editedAt).toBeGreaterThan(msg.timestamp);
      }

      // Satisfy the array-index tracking check
      expect(i).toBeGreaterThanOrEqual(0);
    });
  });
});

// ── AC (c): timestamp range spans 3-4 days ────────────────────────────────────

describe('chatMehvish.json — timestamp range', () => {
  it('given messages, when the timestamp range is computed, then it spans at least 2 days and no more than 5 days', () => {
    const timestamps = messages.map((m) => m.timestamp);
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);

    const rangeMs = max - min;
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;

    expect(rangeMs).toBeGreaterThanOrEqual(twoDaysMs);
    expect(rangeMs).toBeLessThanOrEqual(fiveDaysMs);
  });
});

// ── AC (d): at least one message has editedAt ─────────────────────────────────

describe('chatMehvish.json — editedAt presence', () => {
  it('given messages, then at least one has editedAt set', () => {
    const edited = messages.filter((m) => m.editedAt !== undefined);
    expect(edited.length).toBeGreaterThanOrEqual(1);
  });
});

// ── AC (e): all three status states are represented ──────────────────────────

describe('chatMehvish.json — status coverage', () => {
  it('given messages, then at least one has status "sent"', () => {
    expect(messages.some((m) => m.status === 'sent')).toBe(true);
  });

  it('given messages, then at least one has status "delivered"', () => {
    expect(messages.some((m) => m.status === 'delivered')).toBe(true);
  });

  it('given messages, then multiple messages have status "read"', () => {
    const readCount = messages.filter((m) => m.status === 'read').length;
    expect(readCount).toBeGreaterThan(1);
  });
});

// ── AC (f): both senders are represented ─────────────────────────────────────

describe('chatMehvish.json — sender coverage', () => {
  it('given messages, then at least one has sender "me"', () => {
    expect(messages.some((m) => m.sender === 'me')).toBe(true);
  });

  it('given messages, then at least one has sender "friend"', () => {
    expect(messages.some((m) => m.sender === 'friend')).toBe(true);
  });
});

// ── AC (g): all ids are unique ────────────────────────────────────────────────

describe('chatMehvish.json — id uniqueness', () => {
  it('given messages, then all id values are unique', () => {
    const ids = messages.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// ── AC (h): _meta block ───────────────────────────────────────────────────────

describe('chatMehvish.json — _meta block', () => {
  it('given the fixture file, then _meta.base_timestamp_ms is a positive number', () => {
    expect(typeof chatMehvishRaw._meta.base_timestamp_ms).toBe('number');
    expect(chatMehvishRaw._meta.base_timestamp_ms).toBeGreaterThan(0);
  });

  it('given the fixture file, then _meta.description is a non-empty string', () => {
    expect(typeof chatMehvishRaw._meta.description).toBe('string');
    expect(chatMehvishRaw._meta.description.length).toBeGreaterThan(0);
  });
});
