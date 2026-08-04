/**
 * Pure helper that builds the share message and deep-link URL for a user
 * profile.
 *
 * The deep-link URL (`knotify://profile/<user_id>`) is a placeholder for
 * phase 12. The `linking.ts` handler that resolves it is NOT wired this phase
 * — the URL is text-only. Wiring lands when the discover deck resolves
 * candidate profile IDs (phase 13).
 *
 * // TODO(dummy-only): wire linking.ts handler when phase-13 discover deck ships.
 *
 * @module features/profile/buildShareMessage
 */

import type { UserProfile } from '@/types/api/UserProfile';

/**
 * The result of {@link buildShareMessage}.
 */
export interface ShareMessageResult {
  /** The human-readable share text, including the deep-link URL. */
  readonly message: string;
  /** The deep-link URL for the profile. Placeholder until phase-13 wiring. */
  readonly url: string;
}

/**
 * Builds the share message and deep-link URL for a Knotify user profile.
 *
 * The returned `message` uses the format:
 * `"Check out <first_name> on Knotify: knotify://profile/<user_id>"`
 *
 * The returned `url` is identical to the URL embedded in `message`. Both are
 * provided so React Native's `Share.share({ message, url })` receives them
 * as separate fields (iOS uses `url` for the activity metadata).
 *
 * @param profile - A minimal slice of the user profile containing `user_id`
 *   and `first_name`.
 * @returns An object with `message` and `url` fields.
 */
export function buildShareMessage(
  profile: Pick<UserProfile, 'user_id' | 'first_name'>,
): ShareMessageResult {
  const url = `knotify://profile/${profile.user_id}`;
  const name = profile.first_name ?? profile.user_id;
  const message = `Check out ${name} on Knotify: ${url}`;
  return { message, url };
}
