/**
 * React Query hook for fetching a single user profile by `user_id`.
 *
 * Wraps the `profileApi.getProfileById` REST helper from
 * `src/services/api/endpoints.ts` per architecture §8.3 and §7.3.
 *
 * This replaces `FriendshipProvider.getFullProfile(userId)` as the single
 * source of truth for `user_id → UserProfile` resolution. Consumed by:
 * - `OtherProfileScreen` (viewer = 'other')
 * - `ChatListScreen` (counterpart profile for row display)
 * - `ChatRoomScreen` header
 * - `IncomingRequestModal` listener host (story 16.8)
 * - `RequestAcceptedModal` listener host (story 16.8)
 *
 * @module features/profile/api
 */

import { useQuery } from '@tanstack/react-query';

import { profileApi } from '@/services/api/endpoints';
import type { UserProfile } from '@/types/api/UserProfile';

// ── Query key factory ─────────────────────────────────────────────────────────

/**
 * Returns the TanStack Query key for a single user's profile.
 *
 * Uses a two-element tuple per §7.3: `['profile', userId]`. Downstream
 * invalidations (e.g. after a profile update) can target an individual
 * profile entry without touching the own-profile (`/profile/me`) cache.
 *
 * @param userId - The `user_id` (Cognito sub) of the profile to cache.
 */
export const profileQueryKey = (userId: string) => ['profile', userId] as const;

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Fetches a single user's public profile from `GET /profiles/:userId`.
 *
 * Uses the project-wide default stale / retry / gcTime settings from
 * `QueryProvider` (§7.3: staleTime 5 min, 2 retries, gcTime 10 min).
 *
 * Query key: `['profile', userId]`.
 *
 * Returns `undefined` data while loading. The caller should guard on
 * `isLoading` and `isError` before accessing `data`.
 *
 * When the backend returns 404 (no matching user), the query enters the error
 * state with an `ApiError` whose `status === 404`.
 *
 * @param userId - The `user_id` to look up.
 *
 * @example
 * ```tsx
 * const { data: profile, isLoading, isError } = useProfileQuery(someUserId);
 * if (isLoading) return <LoadingState />;
 * if (isError || !profile) return <ErrorState />;
 * return <ProfileScrollView profile={profile} viewer="other" />;
 * ```
 */
export function useProfileQuery(userId: string) {
  return useQuery<UserProfile, Error>({
    queryKey: profileQueryKey(userId),
    queryFn: () => profileApi.getProfileById(userId),
    // Disable the query when userId is empty — prevents spurious network
    // requests when a component mounts before its userId prop is resolved.
    enabled: userId.length > 0,
  });
}
