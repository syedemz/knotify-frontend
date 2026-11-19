/**
 * Hand-written TypeScript types for the Knotify AppSync GraphQL schema.
 *
 * These types are derived from the real AppSync introspection schema obtained
 * on 2026-11-15 via `aws appsync get-introspection-schema`. They must be kept
 * in sync with the backend schema definition.
 *
 * "Real-schema anchors" (from phase-16 PRD context_summary) are the
 * authoritative reference for every shape here.
 *
 * @module services/graphql/types
 */

// ── ChatRoom ──────────────────────────────────────────────────────────────

/**
 * A direct-message room between two users.
 *
 * User IDs are stored lexicographically as `userA` (lower) and `userB`
 * (higher). The client derives the counterpart by comparing against the
 * current user's ID.
 */
export interface ChatRoom {
  /** Opaque room identifier. */
  readonly roomId: string;
  /** Lower of the two participant user IDs (lexicographic). */
  readonly userA: string;
  /** Higher of the two participant user IDs (lexicographic). */
  readonly userB: string;
  /** ISO-8601 timestamp of the last message sent in this room. Null when no messages yet. */
  readonly lastMessageAt: string | null;
  /** Truncated text preview of the most recent message. Null when no messages yet. */
  readonly lastMessagePreview: string | null;
  /** User ID of the sender of the most recent message. Null when no messages yet. */
  readonly lastMessageSenderId: string | null;
  /** Message ID of the most recent message. Null when no messages yet. */
  readonly lastMessageId: string | null;
  /**
   * `true` when a live `friendships` row exists for the pair; `false` after
   * unfriend or block (either side). When `false`, `sendMessage` from either
   * participant returns `RoomReadOnly`. The frontend reads this flag to
   * swap the composer for an `UnfriendedBanner` on `ChatRoomScreen`.
   *
   * Server contract: field is non-nullable (`Boolean!`) on the AppSync
   * `ChatRoom` type. Kept optional here only so legacy fixtures that predate
   * the flag type-check — all real server responses populate it.
   */
  readonly friendshipActive?: boolean;
  /** ISO-8601 creation timestamp. Not returned by `listMyRooms` / `createOrGetRoom` — optional for fixture flexibility only. */
  readonly createdAt?: string;
  /** ISO-8601 last-updated timestamp. Not present on the real schema (confirmed 2026-11-17 via `listMyRooms` validation error); kept optional to permit fixtures. */
  readonly updatedAt?: string;
}

// ── ChatRoomMembership ────────────────────────────────────────────────────

/**
 * Denormalised membership record joining a user to a chat room.
 *
 * Optionally carries cached profile fields for fast list rendering without
 * a secondary profile query.
 */
export interface ChatRoomMembership {
  /** Room this membership record belongs to. */
  readonly roomId: string;
  /** User this membership record belongs to. */
  readonly userId: string;
  /** Cached display name of the counterpart (may be stale). */
  readonly cachedOtherName: string | null;
  /** Cached avatar URL of the counterpart (may be stale). */
  readonly cachedOtherAvatar: string | null;
}

// ── Message ───────────────────────────────────────────────────────────────

/**
 * A single chat message stored in AppSync / DynamoDB.
 *
 * The `status` field is NOT present on the server — it is synthesised by the
 * client from optimistic-local state + `deliveredAt` + `MessageRead` receipts.
 * See `shapeAdapters.ts` and `ChatMessage.status` in the chat feature for
 * the synthesis logic.
 */
export interface Message {
  /** Opaque message identifier (ULID/UUID). */
  readonly messageId: string;
  /** Room this message belongs to. */
  readonly roomId: string;
  /** User ID of the sender (derived from the JWT `sub` claim server-side). */
  readonly senderId: string;
  /** Text content (or GIF URL when `contentType === 'gif'`). */
  readonly content: string;
  /** Content MIME type. Only 'text' and 'gif' are used in phase 16. */
  readonly contentType: 'text' | 'gif';
  /** ISO-8601 timestamp when the message was stored by the server. */
  readonly createdAt: string;
  /**
   * ISO-8601 timestamp when the message was delivered to the counterpart's
   * device. `null` until the counterpart's client acknowledges receipt.
   * When non-null, the client renders a 'delivered' (double-tick) indicator.
   */
  readonly deliveredAt: string | null;
}

// ── MessageConnection ─────────────────────────────────────────────────────

/**
 * Paginated container for a list of messages from `messagesByChatRoom`.
 */
export interface MessageConnection {
  /** Page of messages (sorted ascending by `createdAt`). */
  readonly items: readonly Message[];
  /**
   * Opaque cursor for the next page. `null` when this is the last page.
   * Pass as `nextToken` to `messagesByChatRoom` to fetch the next batch.
   */
  readonly nextToken: string | null;
}

// ── MessageRead ───────────────────────────────────────────────────────────

/**
 * Read-receipt record returned by `markAsRead` and pushed via
 * `onReadReceipt(roomId)` subscription.
 *
 * The `lastReadMessageId` indicates all messages up to and including this ID
 * have been read by `userId`.
 */
export interface MessageRead {
  /** Room the receipt applies to. */
  readonly roomId: string;
  /** User who has read up to `lastReadMessageId`. */
  readonly userId: string;
  /** The most recent message ID that `userId` has read. */
  readonly lastReadMessageId: string;
  /** ISO-8601 timestamp when the read event occurred. */
  readonly lastReadAt: string;
}

// ── Notification ─────────────────────────────────────────────────────────

/**
 * Notification type discriminant.
 *
 * Carried in `Notification.type`. Consumers must branch on this value before
 * parsing `Notification.payload`.
 */
export type NotificationType =
  | 'friend_request'
  | 'friend_request_accepted'
  | 'profile_view'
  | 'room_deactivated'
  | 'bookmark_received';

/**
 * A generic notification pushed from AppSync via `onFriendRequestUpdated` or
 * `onNotificationForMe` subscriptions.
 *
 * The `payload` field is `AWSJSON` — a stringified JSON string. Callers must
 * `JSON.parse(notification.payload)` and handle parse failures defensively.
 */
export interface Notification {
  /** Discriminant — determines how `payload` is interpreted. */
  readonly type: NotificationType;
  /**
   * Stringified JSON payload. Schema varies by `type`:
   *
   * - `'friend_request'`: `{ request_id: string; from_user_id: string }`
   * - `'friend_request_accepted'`: `{ from_user_id: string }` (from_user_id is the acceptor)
   * - Others: opaque — do not parse unless the schema is known.
   */
  readonly payload: string;
  /** ISO-8601 timestamp when the notification was created server-side. */
  readonly createdAt: string;
}

// ── TypingEvent ───────────────────────────────────────────────────────────

/**
 * Realtime typing-status event pushed from AppSync via
 * `onTypingInRoom(roomId)` subscription, and sent outbound via
 * `setTyping(isTyping, roomId)` mutation.
 */
export interface TypingEvent {
  /** Room the event applies to. */
  readonly roomId: string;
  /** User who is (or stopped) typing. */
  readonly userId: string;
  /** `true` while the user is typing; `false` when they have stopped. */
  readonly isTyping: boolean;
}
