/**
 * Typed REST endpoint helpers.
 *
 * Centralises the `method` + `path` pair for each backend route so callers
 * don't hand-type HTTP paths. Each helper is a thin wrapper over
 * {@link request} from `./httpClient`; typing comes from the `UserProfile` /
 * `UserProfileWritable` / `Friend` shapes in `src/types/api/`.
 *
 * Backend config authority: `knotify-backend/backend-config.json` →
 * `restApi.routes`.
 *
 * @module services/api/endpoints
 */

import { request } from './httpClient';
import type {
  UserProfile,
  UserProfileWritable,
} from '@/types/api/UserProfile';
import type { DeckProfile, DeckResponse } from '@/types/api/DeckProfile';
import type { Friend } from '@/types/api/Friend';
import type { FriendRequest } from '@/types/api/FriendRequest';

// ── Profile ──────────────────────────────────────────────────────────────────

/**
 * Typed helpers for `/profile/*` endpoints.
 */
export const profileApi = {
  /** `GET /profile/me` — fetch the signed-in user's own profile. */
  getMe: (): Promise<UserProfile> =>
    request<UserProfile>({ method: 'GET', path: '/profile/me' }),

  /**
   * `PATCH /profile/me` — update the signed-in user's own profile.
   *
   * Partial writes only. The backend enforces the immutable-after-set
   * constraint on `first_name`, `last_name`, `sex`, `birthday`, etc.
   */
  updateMe: (patch: Partial<UserProfileWritable>): Promise<UserProfile> =>
    request<UserProfile>({ method: 'PATCH', path: '/profile/me', body: patch }),

  /**
   * `GET /profiles/:userId` — fetch another user's public profile by their
   * `user_id` (Cognito sub).
   *
   * Per architecture §8.3. Used wherever the client needs to resolve a
   * `user_id → UserProfile` without the full friendship context — e.g. modal
   * listener hosts, ChatListScreen row headers, ChatRoomScreen header.
   *
   * Returns the full {@link UserProfile} row. Throws {@link ApiError} with
   * `status === 404` when no matching user exists.
   *
   * @param userId - The `user_id` (Cognito sub) to look up.
   * @returns The public {@link UserProfile} for that user.
   */
  getProfileById: (userId: string): Promise<UserProfile> =>
    request<UserProfile>({ method: 'GET', path: `/profiles/${userId}` }),
} as const;

// ── Match ────────────────────────────────────────────────────────────────────

/**
 * Typed helpers for `/match/*` endpoints.
 *
 * `/match/deck` requires `profile_complete_verified=true` on the viewer. The
 * backend returns 403 otherwise — `RootNavigator` already gates on
 * `profileComplete`, so this is a defensive edge.
 */
export const matchApi = {
  /**
   * `GET /match/deck` — fetch the current deck of candidate profiles.
   *
   * Returns the full {@link DeckResponse} envelope — callers get both
   * `results` (array of {@link DeckProfile}) and `next_cursor` (for
   * pagination). `useDeckQuery` plucks `results` for the common case.
   */
  getDeck: (): Promise<DeckResponse> =>
    request<DeckResponse>({ method: 'GET', path: '/match/deck' }),
} as const;

// ── Friends ──────────────────────────────────────────────────────────────────

/**
 * Typed helpers for `/friends/*` endpoints.
 *
 * The backend normalises the `user_a`/`user_b` canonicalization server-side;
 * the client always receives the counterpart's profile — never the raw
 * friendship row (see architecture §11.7).
 */
export const friendsApi = {
  /**
   * `GET /friends` — fetch the signed-in user's accepted friends list.
   *
   * Returns an array of {@link Friend} items. Each item is the counterpart
   * user's full profile. The endpoint requires a valid session JWT.
   *
   * @returns An array of {@link Friend} profiles (may be empty).
   */
  list: (): Promise<readonly Friend[]> =>
    request<readonly Friend[]>({ method: 'GET', path: '/friends' }),
} as const;

// ── Friend requests ───────────────────────────────────────────────────────────

/**
 * Typed helpers for `/friend-requests/*` endpoints per architecture §11.2.8.
 *
 * GET methods use a `direction` query parameter.
 * Mutation methods (POST / DELETE) added in story 16.FR2.
 */
export const friendRequestsApi = {
  /**
   * `GET /friend-requests?direction=incoming` — fetch pending friend requests
   * sent to the signed-in user.
   *
   * Returns an array of {@link FriendRequest} rows. The endpoint requires a
   * valid session JWT.
   *
   * @returns An array of incoming {@link FriendRequest} rows (may be empty).
   */
  listIncoming: (): Promise<readonly FriendRequest[]> =>
    request<readonly FriendRequest[]>({
      method: 'GET',
      path: '/friend-requests',
      query: { direction: 'incoming' },
    }),

  /**
   * `GET /friend-requests?direction=outgoing` — fetch pending friend requests
   * sent by the signed-in user.
   *
   * Returns an array of {@link FriendRequest} rows. The endpoint requires a
   * valid session JWT.
   *
   * @returns An array of outgoing {@link FriendRequest} rows (may be empty).
   */
  listOutgoing: (): Promise<readonly FriendRequest[]> =>
    request<readonly FriendRequest[]>({
      method: 'GET',
      path: '/friend-requests',
      query: { direction: 'outgoing' },
    }),

  /**
   * `POST /friend-requests` — send a new friend request to the given user.
   *
   * Returns the newly-created {@link FriendRequest} row. Throws
   * {@link ApiError} with `status === 409` when a request to that user is
   * already pending (the callsite checks `ApiError.code` and renders an
   * "already sent" affordance instead of an error banner per §11.2.8).
   *
   * @param toUserId - `user_id` of the target recipient.
   * @returns The created {@link FriendRequest} row.
   */
  send: (toUserId: string): Promise<FriendRequest> =>
    request<FriendRequest>({
      method: 'POST',
      path: '/friend-requests',
      body: { to_user_id: toUserId },
    }),

  /**
   * `POST /friend-requests/{id}/accept` — accept an incoming friend request.
   *
   * Returns the updated {@link FriendRequest} row (status becomes `'accepted'`).
   *
   * @param requestId - The `request_id` of the request to accept.
   * @returns The updated {@link FriendRequest} row.
   */
  accept: (requestId: string): Promise<FriendRequest> =>
    request<FriendRequest>({
      method: 'POST',
      path: `/friend-requests/${requestId}/accept`,
    }),

  /**
   * `POST /friend-requests/{id}/decline` — decline an incoming friend request.
   *
   * Returns the updated {@link FriendRequest} row (status becomes `'declined'`).
   *
   * @param requestId - The `request_id` of the request to decline.
   * @returns The updated {@link FriendRequest} row.
   */
  decline: (requestId: string): Promise<FriendRequest> =>
    request<FriendRequest>({
      method: 'POST',
      path: `/friend-requests/${requestId}/decline`,
    }),

  /**
   * `DELETE /friend-requests/{id}` — cancel an outgoing friend request that
   * the signed-in user sent.
   *
   * Returns the updated {@link FriendRequest} row (status becomes `'cancelled'`).
   *
   * @param requestId - The `request_id` of the outgoing request to cancel.
   * @returns The updated {@link FriendRequest} row.
   */
  cancel: (requestId: string): Promise<FriendRequest> =>
    request<FriendRequest>({
      method: 'DELETE',
      path: `/friend-requests/${requestId}`,
    }),
} as const;
