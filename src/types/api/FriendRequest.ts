/**
 * Type for a single row returned by `GET /friend-requests`.
 *
 * Shape is derived from `db-schema.json → friend_requests` table per
 * architecture §14.1. The status enum values match
 * `db-schema → enums.friendRequestStatus`:
 * `'pending' | 'accepted' | 'declined' | 'cancelled'` (see §14.1).
 *
 * This type is consumed by `useIncomingRequestsQuery` and
 * `useOutgoingRequestsQuery` in `src/features/friendRequests/api.ts`.
 *
 * @module types/api/FriendRequest
 */

/**
 * The lifecycle status of a friend request.
 *
 * Values derived from `db-schema → enums.friendRequestStatus` per
 * architecture §14.1.
 */
export type FriendRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

/**
 * A single friend-request row as returned by `GET /friend-requests`.
 *
 * Both the incoming (`direction=incoming`) and outgoing
 * (`direction=outgoing`) query directions return the same row shape.
 * Callers discriminate direction by which hook they call
 * (`useIncomingRequestsQuery` vs. `useOutgoingRequestsQuery`).
 */
export interface FriendRequest {
  /** Unique identifier for this friend-request row. */
  readonly request_id: string;
  /** `user_id` of the user who sent the request. */
  readonly from_user_id: string;
  /** `user_id` of the user who received the request. */
  readonly to_user_id: string;
  /**
   * Current lifecycle status of the request.
   *
   * Typical value for a live incoming request is `'pending'`.
   * The list endpoint filters by the requested direction, so callers
   * normally see only `'pending'` rows; completed rows are retained on
   * the backend for audit purposes but are not surfaced here.
   */
  readonly status: FriendRequestStatus;
  /**
   * ISO-8601 timestamp (UTC) of when the request was created.
   *
   * Stored as a string on the wire; use `Helper/dateHelper.ts` to parse
   * into a `Date` when display formatting is needed.
   */
  readonly created_at: string;
}
