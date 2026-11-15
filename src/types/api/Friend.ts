/**
 * Type for a single row returned by `GET /friends`.
 *
 * Per architecture §11.7, the endpoint normalises the `user_a` / `user_b`
 * canonicalization server-side and returns the **other** user's full profile
 * — the client never needs to inspect which column holds the current user's
 * id. The shape is therefore identical to {@link UserProfile}.
 *
 * @module types/api/Friend
 */

import type { UserProfile } from './UserProfile';

/**
 * A friend as returned by the REST `GET /friends` endpoint.
 *
 * The backend strips the canonicalization detail and returns the counterpart's
 * full user profile row — no friendship-row metadata (e.g. `created_at` for
 * the friendship itself) is exposed at this endpoint. When that metadata is
 * needed in a future story, a dedicated `Friendship` type should be introduced.
 */
export type Friend = UserProfile;
