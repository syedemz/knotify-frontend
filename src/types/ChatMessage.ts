/**
 * Core message type for the chat feature.
 *
 * Used by {@link chatHistoryStorage}, {@link ChatProvider}, {@link ChatRoomScreen},
 * and all related test fixtures.
 *
 * **Id generation (mock-only).** In a real implementation message ids come from
 * the backend. During the mock phase, ids are generated client-side:
 * `crypto.randomUUID()` when available (React Native >= 0.73 on both platforms),
 * falling back to `${Date.now()}-${Math.random().toString(36).slice(2)}`.
 *
 * **Timestamps.** All timestamp values are unix milliseconds (same unit as
 * `Date.now()`). Phase 17 will adopt whatever format the AppSync API uses and
 * replace this mock accordingly.
 *
 * @module types/ChatMessage
 */

/**
 * A single chat message between the current user and a friend.
 *
 * All fields are `readonly` — mutations produce a new object via a
 * `Partial<Omit<ChatMessage, 'id'>>` patch applied by the storage layer.
 */
export interface ChatMessage {
  /** Locally-generated unique identifier. */
  readonly id: string;

  /**
   * Who sent this message.
   *
   * - `'me'` — sent by the current user.
   * - `'friend'` — sent by the other participant.
   */
  readonly sender: 'me' | 'friend';

  /** The plain-text body of the message. */
  readonly text: string;

  /** Unix milliseconds at which the message was originally sent. */
  readonly timestamp: number;

  /**
   * Delivery / read status of the message.
   *
   * - `'sent'`      — delivered to the server but not yet confirmed received.
   * - `'delivered'` — confirmed received on the friend's device.
   * - `'read'`      — seen by the friend.
   *
   * Phase 15 statuses are static (seed data). Phase 17 wires real delivery /
   * read-receipt subscriptions.
   */
  readonly status: 'sent' | 'delivered' | 'read';

  /**
   * Unix milliseconds at which the message was last edited.
   *
   * Present only when the user has edited the message after sending.
   * Absence means the message has never been edited.
   */
  readonly editedAt?: number;
}
