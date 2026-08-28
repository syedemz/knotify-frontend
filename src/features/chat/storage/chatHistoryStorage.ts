/**
 * AsyncStorage helper for persisted per-friend chat history.
 *
 * TODO(mock-only): remove when real messages endpoint ships (phase 17).
 * Replace `useChatHistory` in `ChatProvider` with `useMessagesQuery` +
 * `useOnMessageAddedSubscription` and delete this file along with
 * `assets/dummychat/chatMehvish.json`.
 *
 * Each friend's chat history is stored under a distinct key so histories are
 * completely isolated — reading friend A's key never touches friend B's data.
 *
 * **Fail-open policy.** Every read wraps JSON.parse in a try/catch. On any
 * parse error (corrupt storage) the helper logs `console.warn` and returns an
 * empty array rather than throwing, preventing a bad persist from breaking the
 * chat UI.
 *
 * **Zero React imports.** This module is safe to import from non-React code
 * (tests, migration scripts, CLI tooling).
 *
 * **Seed hydration is NOT the responsibility of this helper.** Seeding the
 * Mehvish fixture into AsyncStorage on first read is the responsibility of
 * `ChatProvider` (story 15.3), keeping storage and hydration concerns separate
 * and independently testable.
 *
 * @module features/chat/storage/chatHistoryStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '@/types/ChatMessage';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Namespace prefix for all per-friend chat history keys.
 *
 * Each friend's history is stored at `CHAT_HISTORY_KEY_PREFIX + friendUserId`.
 * The `dummy.` prefix matches the existing mock-storage convention and makes
 * teardown grep-able:
 *
 *   grep -r 'dummy.chat.' src/
 */
export const CHAT_HISTORY_KEY_PREFIX = 'dummy.chat.';

// ── Key helper ────────────────────────────────────────────────────────────────

/**
 * Returns the AsyncStorage key for a given friend's chat history.
 *
 * @param friendUserId - The `user_id` of the friend whose history is requested.
 * @returns The fully qualified storage key string.
 */
export function chatHistoryKey(friendUserId: string): string {
  return CHAT_HISTORY_KEY_PREFIX + friendUserId;
}

// ── Reads ─────────────────────────────────────────────────────────────────────

/**
 * Reads the persisted message history for a given friend from AsyncStorage.
 *
 * Returns an empty array when the key is absent or when the stored value cannot
 * be parsed (fail-open). Never throws.
 *
 * @param friendUserId - The `user_id` of the friend whose history to retrieve.
 * @returns The current messages array, or `[]` on missing / corrupt data.
 */
export async function getHistory(friendUserId: string): Promise<ChatMessage[]> {
  const raw = await AsyncStorage.getItem(chatHistoryKey(friendUserId));
  if (raw === null) {
    return [];
  }
  try {
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    console.warn(
      `[chatHistoryStorage] getHistory(${friendUserId}): failed to parse stored JSON — returning empty array`,
    );
    return [];
  }
}

// ── Writes ────────────────────────────────────────────────────────────────────

/**
 * Overwrites the persisted message history for a given friend.
 *
 * Called internally by {@link appendMessage}, {@link updateMessage},
 * {@link deleteMessage}, and {@link clearHistory}. Not typically invoked
 * directly by UI code.
 *
 * @param friendUserId - The `user_id` of the friend whose history to overwrite.
 * @param messages - The full messages array to persist.
 */
export async function saveHistory(
  friendUserId: string,
  messages: ChatMessage[],
): Promise<void> {
  await AsyncStorage.setItem(chatHistoryKey(friendUserId), JSON.stringify(messages));
}

/**
 * Appends a message to the persisted history for a given friend.
 *
 * Idempotent by `message.id`: if a message with the same `id` already exists
 * in storage the array is returned unchanged without a write. This prevents
 * duplicate messages when `sendMessage` is retried.
 *
 * @param friendUserId - The `user_id` of the friend to append into.
 * @param message - The {@link ChatMessage} to append.
 */
export async function appendMessage(
  friendUserId: string,
  message: ChatMessage,
): Promise<void> {
  const current = await getHistory(friendUserId);
  if (current.some((m) => m.id === message.id)) {
    return;
  }
  await saveHistory(friendUserId, [...current, message]);
}

/**
 * Applies a partial patch to a message identified by `messageId`.
 *
 * Only the fields supplied in `patch` are updated; all other fields are
 * preserved. If no message with `messageId` exists, the function is a no-op
 * and logs `console.warn` (fail-safe, not fail-open — the caller can detect
 * the miss via the warn but the storage remains consistent).
 *
 * @param friendUserId - The `user_id` of the friend whose history to update.
 * @param messageId - The `id` of the message to patch.
 * @param patch - Partial field values to merge into the existing message.
 *   The `id` field is excluded from the patch type because message ids are
 *   immutable.
 */
export async function updateMessage(
  friendUserId: string,
  messageId: string,
  patch: Partial<Omit<ChatMessage, 'id'>>,
): Promise<void> {
  const current = await getHistory(friendUserId);
  const index = current.findIndex((m) => m.id === messageId);
  if (index === -1) {
    console.warn(
      `[chatHistoryStorage] updateMessage: messageId "${messageId}" not found for friend "${friendUserId}" — no-op`,
    );
    return;
  }
  // Non-null assertion is safe: findIndex guarantees index is within bounds.
  const updated = [...current.slice(0, index), { ...current[index]!, ...patch }, ...current.slice(index + 1)];
  await saveHistory(friendUserId, updated);
}

/**
 * Hard-deletes a message from the persisted history for a given friend.
 *
 * Idempotent: if no message with `messageId` exists the function returns
 * without error or warning (the desired post-condition — message is absent —
 * is already satisfied).
 *
 * Phase 17 note: if the real backend uses soft delete (`deleted: true` marker),
 * this behaviour will be replaced when swapping the mock provider for the real
 * hook. Not a phase-15 concern.
 *
 * @param friendUserId - The `user_id` of the friend whose history to delete from.
 * @param messageId - The `id` of the message to remove.
 */
export async function deleteMessage(
  friendUserId: string,
  messageId: string,
): Promise<void> {
  const current = await getHistory(friendUserId);
  const filtered = current.filter((m) => m.id !== messageId);
  if (filtered.length === current.length) {
    // Message not found — already absent, no write needed.
    return;
  }
  await saveHistory(friendUserId, filtered);
}

/**
 * Removes all messages for a given friend from AsyncStorage.
 *
 * Exposed for tests and the phase-15 teardown checklist. Not called by UI
 * code in normal flow.
 *
 * Teardown: once the real backend ships, this file and the key prefix are
 * deleted. See `context.md → Before shipping → Mock-only friend requests +
 * chat pipeline`.
 *
 * @param friendUserId - The `user_id` of the friend whose history to clear.
 */
export async function clearHistory(friendUserId: string): Promise<void> {
  await AsyncStorage.removeItem(chatHistoryKey(friendUserId));
}
