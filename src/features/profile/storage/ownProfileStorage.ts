/**
 * AsyncStorage helper for the signed-in user's own profile.
 *
 * Caches the latest `GET /profile/me` response locally so cold-launches can
 * paint the profile UI instantly before the network round-trip completes
 * (stale-while-revalidate). The cache is invalidated on signOut.
 *
 * **Zero React imports.** Safe to import from non-React code (tests, etc.).
 *
 * **Fail-open policy.** Every read is wrapped in try/catch. On corrupt JSON,
 * returns `null` and logs a warning — the network fetch is the fallback.
 *
 * @module features/profile/storage/ownProfileStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@/types/api/UserProfile';

/**
 * AsyncStorage key under which the own-profile snapshot is persisted.
 *
 * Deliberately NOT prefixed with `dummy.` — this is a real cache for a real
 * backend response, not a mock-only surface. Teardown is at signOut only.
 */
export const OWN_PROFILE_STORAGE_KEY = 'profile.me';

/**
 * Reads the cached own-profile snapshot. Returns `null` when the key is
 * absent or the stored JSON can't be parsed. Never throws.
 */
export async function getCachedOwnProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(OWN_PROFILE_STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    console.warn(
      '[ownProfileStorage] getCachedOwnProfile: failed to parse stored JSON — returning null',
    );
    return null;
  }
}

/** Writes the own-profile snapshot to AsyncStorage. */
export async function saveCachedOwnProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(OWN_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

/** Clears the own-profile snapshot. Called from AuthProvider.signOut. */
export async function clearCachedOwnProfile(): Promise<void> {
  await AsyncStorage.removeItem(OWN_PROFILE_STORAGE_KEY);
}
