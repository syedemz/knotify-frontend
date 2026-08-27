/**
 * Tests for ChatProvider and useChatHistory (story 15.3).
 *
 * Uses the official `@react-native-async-storage/async-storage` jest mock,
 * already wired in `jest.config.js` via `moduleNameMapper`.
 *
 * AC coverage:
 * (a) First mount for Mehvish seeds 18 messages from fixture.
 * (b) Second mount for Mehvish reads from cache — no re-seed (messages still 18,
 *     not 36).
 * (c) First mount for a non-Mehvish friend returns empty array (no seed).
 * (d) sendMessage('hello') appends a message with sender 'me' and status 'sent'.
 * (e) sendMessage with empty/whitespace-only input is a no-op — does not append.
 * (f) updateMessage(id, { text: 'x', editedAt: 12345 }) patches only those fields.
 * (g) deleteMessage(id) removes exactly one message from the array.
 * (h) Multiple consumers of the same hook see the same array (referential identity
 *     check — both consumers observe the same length after a mutation).
 *
 * TODO(mock-only): remove when real messages endpoint ships (phase 17)
 */

import React from 'react';
import { renderHook, act, render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ChatProvider,
  useChatHistory,
  MEHVISH_USER_ID,
} from '@/state/chat/ChatProvider';
import { CHAT_HISTORY_KEY_PREFIX } from '@/features/chat/storage/chatHistoryStorage';

// ── Wrapper helpers ────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <ChatProvider>{children}</ChatProvider>;
}

function renderChatHook(friendUserId: string) {
  return renderHook(() => useChatHistory(friendUserId), { wrapper });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// ── AC (a): first mount for Mehvish seeds 18 messages ─────────────────────────

describe('useChatHistory — AC (a): Mehvish first mount seeds 18 messages', () => {
  it('given empty storage and Mehvish user_id, when hook mounts, then messages has exactly 18 entries', async () => {
    const { result } = renderChatHook(MEHVISH_USER_ID);

    // loading should start true
    expect(result.current.loading).toBe(true);

    // Wait for hydration + seeding to complete
    await act(async () => {
      // flush promises
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.messages).toHaveLength(18);
  });
});

// ── AC (b): second Mehvish mount reads from cache, no re-seed ─────────────────

describe('useChatHistory — AC (b): second Mehvish mount reads from cache', () => {
  it('given Mehvish already hydrated, when a second consumer mounts, then messages is still 18 (not 36)', async () => {
    // First consumer
    const { result: result1 } = renderHook(
      () => useChatHistory(MEHVISH_USER_ID),
      { wrapper },
    );

    await act(async () => {
      // flush hydration
    });

    expect(result1.current.messages).toHaveLength(18);

    // Second consumer of the same provider — but we need to re-use the same
    // provider instance. We render a second hook INSIDE the same provider tree
    // by using renderHook with the same wrapper.
    //
    // Because renderHook creates independent wrapper instances, we simulate the
    // "second mount, same provider" scenario by checking that after a fresh
    // AsyncStorage clear + re-render, the provider reads from storage (which now
    // has the 18 messages saved by the first mount) and does NOT seed again.
    //
    // The idempotency guarantee: saveHistory was called once; a second getHistory
    // returns 18 messages, and the seed branch is skipped because length > 0.
    await AsyncStorage.clear();
    // Re-seed what the first provider write would have persisted.
    // Use static require (dynamic import is not available without --experimental-vm-modules).
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const seedJson = require('../../../assets/dummychat/chatMehvish.json') as {
      messages: unknown[];
    };
    await AsyncStorage.setItem(
      CHAT_HISTORY_KEY_PREFIX + MEHVISH_USER_ID,
      JSON.stringify(seedJson.messages),
    );

    const { result: result2 } = renderChatHook(MEHVISH_USER_ID);

    await act(async () => {
      // flush hydration
    });

    // Storage already has 18 messages — no re-seed, still 18
    expect(result2.current.messages).toHaveLength(18);
  });
});

// ── AC (c): non-Mehvish friend starts empty ────────────────────────────────────

describe('useChatHistory — AC (c): non-Mehvish friend returns empty', () => {
  it('given empty storage and a non-Mehvish user_id, when hook mounts, then messages is empty', async () => {
    const { result } = renderChatHook('some-other-friend-uuid');

    await act(async () => {
      // flush hydration
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.messages).toHaveLength(0);
  });
});

// ── AC (d): sendMessage appends with sender 'me' and status 'sent' ────────────

describe('useChatHistory — AC (d): sendMessage appends correctly', () => {
  it("given an empty thread, when sendMessage('hello') is called, then messages has one entry with sender 'me' and status 'sent'", async () => {
    const { result } = renderChatHook('friend-uuid-d');

    await act(async () => {
      // flush hydration (empty)
    });

    expect(result.current.messages).toHaveLength(0);

    await act(async () => {
      await result.current.sendMessage('hello');
    });

    expect(result.current.messages).toHaveLength(1);
    const msg = result.current.messages[0];
    expect(msg?.sender).toBe('me');
    expect(msg?.status).toBe('sent');
    expect(msg?.text).toBe('hello');
    expect(typeof msg?.timestamp).toBe('number');
    expect(typeof msg?.id).toBe('string');
    expect(msg?.id.length).toBeGreaterThan(0);
  });
});

// ── AC (e): sendMessage on empty/whitespace-only input is a no-op ─────────────

describe('useChatHistory — AC (e): sendMessage no-op on empty/whitespace input', () => {
  it('given an empty string, when sendMessage is called, then messages remains empty', async () => {
    const { result } = renderChatHook('friend-uuid-e');

    await act(async () => {
      // flush hydration
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await act(async () => {
      await result.current.sendMessage('');
    });

    expect(result.current.messages).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('given a whitespace-only string, when sendMessage is called, then messages remains empty', async () => {
    const { result } = renderChatHook('friend-uuid-e2');

    await act(async () => {
      // flush hydration
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(result.current.messages).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});

// ── AC (f): updateMessage patches only provided fields ────────────────────────

describe('useChatHistory — AC (f): updateMessage patches only provided fields', () => {
  it('given a sent message, when updateMessage patches text and editedAt, then only those fields change', async () => {
    const { result } = renderChatHook('friend-uuid-f');

    await act(async () => {
      // flush hydration
    });

    // Send a message first so we have an id to patch
    await act(async () => {
      await result.current.sendMessage('original text');
    });

    const original = result.current.messages[0];
    expect(original).toBeDefined();
    const originalId = original?.id ?? '';
    const originalSender = original?.sender;
    const originalStatus = original?.status;
    const originalTimestamp = original?.timestamp;

    await act(async () => {
      await result.current.updateMessage(originalId, {
        text: 'edited text',
        editedAt: 12345,
      });
    });

    const updated = result.current.messages[0];
    // Patched fields
    expect(updated?.text).toBe('edited text');
    expect(updated?.editedAt).toBe(12345);
    // Preserved fields
    expect(updated?.id).toBe(originalId);
    expect(updated?.sender).toBe(originalSender);
    expect(updated?.status).toBe(originalStatus);
    expect(updated?.timestamp).toBe(originalTimestamp);
  });
});

// ── AC (g): deleteMessage removes exactly one message ─────────────────────────

describe('useChatHistory — AC (g): deleteMessage removes exactly one message', () => {
  it('given two messages, when deleteMessage is called for the first, then exactly one message remains', async () => {
    const { result } = renderChatHook('friend-uuid-g');

    await act(async () => {
      // flush hydration
    });

    await act(async () => {
      await result.current.sendMessage('first');
    });

    await act(async () => {
      await result.current.sendMessage('second');
    });

    expect(result.current.messages).toHaveLength(2);

    const firstId = result.current.messages[0]?.id ?? '';

    await act(async () => {
      await result.current.deleteMessage(firstId);
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]?.text).toBe('second');
  });

  it('given a message that was already deleted, when deleteMessage is called again, then it is idempotent (no error, same count)', async () => {
    const { result } = renderChatHook('friend-uuid-g2');

    await act(async () => {
      // flush hydration
    });

    await act(async () => {
      await result.current.sendMessage('only');
    });

    const id = result.current.messages[0]?.id ?? '';

    await act(async () => {
      await result.current.deleteMessage(id);
    });

    expect(result.current.messages).toHaveLength(0);

    // Second delete — idempotent
    await act(async () => {
      await result.current.deleteMessage(id);
    });

    expect(result.current.messages).toHaveLength(0);
  });
});

// ── AC (h): multiple consumers see the same array ─────────────────────────────

describe('useChatHistory — AC (h): multiple consumers see the same state', () => {
  it('given two consumers of the same friendUserId in the same provider, when one sends a message, then both see the updated count', async () => {
    const friendId = 'friend-uuid-h';

    // Both consumers MUST share the exact same ChatProvider instance.
    // We achieve this by rendering a single React tree with one <ChatProvider>
    // wrapping two sibling components that each call useChatHistory.
    // Results are stored in refs that the test can read after re-renders.

    type ConsumerRef = {
      messages: readonly import('@/types/ChatMessage').ChatMessage[];
      sendMessage: (text: string) => Promise<void>;
    };

    // MutableRefObject allows null-initial current and direct mutation.
    const ref1: React.MutableRefObject<ConsumerRef | null> = { current: null };
    const ref2: React.MutableRefObject<ConsumerRef | null> = { current: null };

    function Consumer1({
      fwdRef,
    }: {
      readonly fwdRef: React.MutableRefObject<ConsumerRef | null>;
    }): null {
      const { messages, sendMessage } = useChatHistory(friendId);
      // Mutate the ref synchronously so the test can read latest values.
      fwdRef.current = { messages, sendMessage };
      return null;
    }

    function Consumer2({
      fwdRef,
    }: {
      readonly fwdRef: React.MutableRefObject<ConsumerRef | null>;
    }): null {
      const { messages } = useChatHistory(friendId);
      // Keep sendMessage from Consumer1 by preserving it if already set
      fwdRef.current = {
        messages,
        sendMessage: fwdRef.current?.sendMessage ?? (async () => {}),
      };
      return null;
    }

    function TestTree(): React.JSX.Element {
      return (
        <ChatProvider>
          <Consumer1 fwdRef={ref1} />
          <Consumer2 fwdRef={ref2} />
        </ChatProvider>
      );
    }

    render(<TestTree />);

    // Flush hydration for both consumers
    await act(async () => {
      // allow async hydration to complete
    });

    // After hydration — both see empty (non-Mehvish friend)
    expect(ref1.current?.messages).toHaveLength(0);
    expect(ref2.current?.messages).toHaveLength(0);

    // Consumer1 sends a message
    await act(async () => {
      await ref1.current?.sendMessage('shared message');
    });

    // Both consumers should now see the message
    expect(ref1.current?.messages).toHaveLength(1);
    expect(ref2.current?.messages).toHaveLength(1);
  });
});

// ── Guard: useChatHistory outside provider throws ─────────────────────────────

describe('useChatHistory — outside provider', () => {
  it('given no ChatProvider, when useChatHistory is called, then throws', () => {
    expect(() =>
      renderHook(() => useChatHistory('any-id')),
    ).toThrow('useChatHistory must be used within a ChatProvider');
  });
});
