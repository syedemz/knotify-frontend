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
 * Typed helpers for `GET /friend-requests` per architecture §11.2.8.
 *
 * Both methods hit the same endpoint with a `direction` query parameter.
 * Mutation endpoints (POST, DELETE) are added in story 16.FR2.
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
} as const;
