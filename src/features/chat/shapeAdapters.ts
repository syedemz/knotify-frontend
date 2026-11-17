/**
 * Shape adapters — server `Message` → client `ChatMessage`.
 *
 * The AppSync `Message` type carries NO `status` field. The client synthesises
 * the delivery status from a combination of:
 *
 *   1. Whether the entry exists only as an optimistic local placeholder
 *      (created by `useSendMessageMutation.onMutate`) → `'sending'`.
 *   2. Whether the entry has been echoed back by the server (exists in the
 *      `['messages', roomId]` cache with a real `messageId`) → `'sent'`.
 *   3. Whether `Message.deliveredAt` is non-null → `'delivered'`.
 *   4. Whether the counterpart's `MessageRead.lastReadMessageId` covers this
 *      message's `createdAt` → `'read'` (story 16.CH1 owns this overlay).
 *
 * This module exposes a pure adapter function that is safe to call outside
 * React (no hooks, no side effects). It is fully unit-tested.
 *
 * @module features/chat/shapeAdapters
 */

import type { Message } from '@/services/graphql/types';
import type { ChatMessage } from '@/types/ChatMessage';

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * The minimum information needed to synthesise a `ChatMessage.status` for a
 * server-cached message. Passed alongside the `Message` to the adapter so the
 * adapter remains pure (no store reads).
 */
export interface StatusSynthesisHints {
  /**
   * When `true`, the entry exists only as an optimistic local placeholder —
   * the server has not yet echoed back a real message id. Forces
   * `status: 'sending'`.
   */
  readonly isOptimistic?: boolean;

  /**
   * The `createdAt` of the most-recently-read message in this room by the
   * counterpart, as reported by the latest `MessageRead` receipt. When
   * `lastReadMessageCreatedAt` is supplied and
   * `message.createdAt <= lastReadMessageCreatedAt`, the status is promoted to
   * `'read'`.
   *
   * Absent (or `undefined`) when no read receipt has arrived yet — in which
   * case the adapter does NOT set `'read'`.
   *
   * Note: story 16.CH1 owns the reconciliation layer that feeds this value.
   * Story 16.4 wires the adapter but leaves `lastReadMessageCreatedAt`
   * undefined until 16.CH1 activates it.
   */
  readonly lastReadMessageCreatedAt?: string;
}

// ── Adapter ────────────────────────────────────────────────────────────────

/**
 * Adapts a server `Message` to the client-facing `ChatMessage` shape.
 *
 * The adapter is **pure** — it has no side effects and reads no external
 * state. All inputs are passed explicitly.
 *
 * Status synthesis rules (in priority order):
 *
 * 1. `hints.isOptimistic === true` → `'sending'`
 * 2. `message.deliveredAt != null` AND `hints.lastReadMessageCreatedAt` covers
 *    this message → `'read'` (but only for the sender's own messages)
 * 3. `message.deliveredAt != null` → `'delivered'`
 * 4. otherwise → `'sent'` (server-echoed but not yet confirmed delivered)
 *
 * @param message - The raw server `Message` (or optimistic placeholder).
 * @param currentUserId - The signed-in user's id (from the JWT `sub` claim).
 *   Used to compute `sender: 'me' | 'friend'`.
 * @param hints - Optional status hints that cannot be derived from the
 *   `Message` shape alone.
 * @returns A fully-typed `ChatMessage` ready for the UI layer.
 */
export function adaptMessageToChatMessage(
  message: Message,
  currentUserId: string,
  hints: StatusSynthesisHints = {},
): ChatMessage {
  const sender: 'me' | 'friend' = message.senderId === currentUserId ? 'me' : 'friend';

  const status = synthesiseStatus(message, sender, hints);

  return {
    id: message.messageId,
    sender,
    text: message.content,
    timestamp: new Date(message.createdAt).getTime(),
    status,
  };
}

// ── Optimistic placeholder builder ─────────────────────────────────────────

/**
 * Creates an optimistic `ChatMessage` before the server round-trip completes.
 *
 * The `id` parameter should be a locally-generated UUID so that
 * `useSendMessageMutation.onSuccess` can locate and replace this entry once
 * the server echoes back the real `messageId`.
 *
 * @param localId - Locally-generated identifier (e.g. `crypto.randomUUID()`).
 * @param content - Text content the user typed.
 * @returns An optimistic `ChatMessage` with `status: 'sending'`.
 */
export function makeOptimisticChatMessage(localId: string, content: string): ChatMessage {
  return {
    id: localId,
    sender: 'me',
    text: content,
    timestamp: Date.now(),
    status: 'sending',
  };
}

// ── Private helpers ────────────────────────────────────────────────────────

/**
 * Synthesises a `ChatMessage.status` from the available server + hint data.
 *
 * The `sender` parameter is forwarded so that `'read'` is only set on
 * messages the current user sent — the UI only shows read ticks on outbound
 * bubbles. Received messages do not carry a status indicator.
 *
 * @param message - Server message.
 * @param sender - `'me'` or `'friend'` (pre-computed by the caller).
 * @param hints - Optional synthesis hints.
 * @returns The synthesised `ChatMessage.status`.
 */
function synthesiseStatus(
  message: Message,
  sender: 'me' | 'friend',
  hints: StatusSynthesisHints,
): ChatMessage['status'] {
  // Optimistic local — not yet echoed by the server.
  if (hints.isOptimistic === true) {
    return 'sending';
  }

  // 'read' is only surfaced on the sender's own messages.
  if (
    sender === 'me' &&
    hints.lastReadMessageCreatedAt !== undefined &&
    message.createdAt <= hints.lastReadMessageCreatedAt
  ) {
    return 'read';
  }

  // Server has confirmed delivery to the counterpart's device.
  if (message.deliveredAt !== null) {
    return 'delivered';
  }

  // Server-echoed but not yet confirmed delivered (single-tick state).
  return 'sent';
}
