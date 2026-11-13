/**
 * Typed REST endpoint helpers.
 *
 * Centralises the `method` + `path` pair for each backend route so callers
 * don't hand-type HTTP paths. Each helper is a thin wrapper over
 * {@link request} from `./httpClient`; typing comes from the `UserProfile` /
 * `UserProfileWritable` shapes in `src/types/api/`.
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
import type { DeckProfile } from '@/types/api/DeckProfile';

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
   * Returns an array of {@link DeckProfile} (16-column backend `deck_view`
   * rows). The array may be empty when no more candidates are available.
   */
  getDeck: (): Promise<DeckProfile[]> =>
    request<DeckProfile[]>({ method: 'GET', path: '/match/deck' }),
} as const;
