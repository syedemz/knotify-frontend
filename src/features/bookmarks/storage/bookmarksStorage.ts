/**
 * AsyncStorage helper for persisted bookmark state.
 *
 * TODO(mock-only): swap for real GET/POST/DELETE /bookmarks in phase-14 backend integration
 *
 * All bookmark data is stored under a single key (`dummy.bookmarks`) as a
 * JSON array of {@link DummyDeckProfile} records. Storing full profiles (not
 * just `user_id`s) lets {@link BookmarkDeckViewScreen} render the full deck
 * body without a secondary lookup — and mirrors the shape a real
 * `GET /bookmarks` response will return, so no data-model migration is needed
 * at teardown.
 *
 * **Fail-open policy.** Every read is wrapped in a try/catch. On any JSON
 * parse error (corrupt storage), the helper logs `console.warn` and returns
 * an empty array rather than throwing. This prevents a bad persist from
 * bricking the bookmarks feature.
 *
 * **Zero React imports.** This module is safe to import from non-React code
 * (tests, migration scripts, CLI tooling).
 *
 * @module features/bookmarks/storage/bookmarksStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DummyDeckProfile } from '@/types/DummyDeckProfile';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * The AsyncStorage key under which the bookmarks array is persisted.
 *
 * The `dummy.` prefix matches the existing SecureStore convention
 * (`dummy.profile`, `dummy.onboarding.complete`) and makes teardown grep-able:
 *
 *   grep -r 'dummy.bookmarks' src/
 *
 * Remove this key and replace the storage layer when the real backend ships.
 */
export const BOOKMARKS_STORAGE_KEY = 'dummy.bookmarks';

// ── Reads ─────────────────────────────────────────────────────────────────────

/**
 * Reads the persisted bookmarks array from AsyncStorage.
 *
 * Returns an empty array when the key is absent or when the stored value
 * cannot be parsed (fail-open). Never throws.
 *
 * @returns The current bookmarks array, or `[]` on missing/corrupt data.
 */
export async function getBookmarks(): Promise<DummyDeckProfile[]> {
  const raw = await AsyncStorage.getItem(BOOKMARKS_STORAGE_KEY);
  if (raw === null) {
    return [];
  }
  try {
    return JSON.parse(raw) as DummyDeckProfile[];
  } catch {
    console.warn(
      '[bookmarksStorage] getBookmarks: failed to parse stored JSON — returning empty array',
    );
    return [];
  }
}

// ── Writes ────────────────────────────────────────────────────────────────────

/**
 * Overwrites the persisted bookmarks array with the provided value.
 *
 * Called internally by {@link addBookmark} and {@link removeBookmark}. Not
 * typically invoked directly by UI code.
 *
 * @param bookmarks - The full bookmarks array to persist.
 */
export async function saveBookmarks(bookmarks: DummyDeckProfile[]): Promise<void> {
  await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
}

/**
 * Adds a profile to the persisted bookmarks array.
 *
 * Idempotent: if a profile with the same `user_id` is already bookmarked,
 * the array is returned unchanged without a write.
 *
 * @param profile - The full deck profile to bookmark.
 * @returns The updated bookmarks array (may be the original if already present).
 */
export async function addBookmark(profile: DummyDeckProfile): Promise<DummyDeckProfile[]> {
  const current = await getBookmarks();
  if (current.some((b) => b.user_id === profile.user_id)) {
    return current;
  }
  const updated = [...current, profile];
  await saveBookmarks(updated);
  return updated;
}

/**
 * Removes the profile matching `userId` from the persisted bookmarks array.
 *
 * Idempotent: if `userId` is not bookmarked, the array is returned unchanged
 * without a write.
 *
 * @param userId - The `user_id` of the profile to remove.
 * @returns The updated bookmarks array (may be the original if not present).
 */
export async function removeBookmark(userId: string): Promise<DummyDeckProfile[]> {
  const current = await getBookmarks();
  const filtered = current.filter((b) => b.user_id !== userId);
  if (filtered.length === current.length) {
    return current;
  }
  await saveBookmarks(filtered);
  return filtered;
}

/**
 * Convenience wrapper: returns `true` if a profile with `userId` is currently
 * bookmarked.
 *
 * Provided for one-shot checks where the caller does not want to subscribe via
 * `useBookmarks()`. For frequent reads inside React components, prefer the
 * synchronous `isBookmarked` returned by `useBookmarks()`.
 *
 * @param userId - The `user_id` to check.
 * @returns `true` if bookmarked, `false` otherwise.
 */
export async function isBookmarked(userId: string): Promise<boolean> {
  const bookmarks = await getBookmarks();
  return bookmarks.some((b) => b.user_id === userId);
}

/**
 * Removes the `dummy.bookmarks` key from AsyncStorage entirely.
 *
 * Exposed for tests and the phase-14 teardown checklist. Not called by UI code.
 *
 * Teardown: once the real backend ships, this and the key itself are deleted.
 * See `context.md → Before shipping → Mock-only pipeline`.
 */
export async function clearBookmarks(): Promise<void> {
  await AsyncStorage.removeItem(BOOKMARKS_STORAGE_KEY);
}
