/**
 * AsyncStorage helper for persisted outgoing friend-request IDs.
 *
 * TODO(mock-only): remove when real send-request endpoint ships
 *
 * Stores only the `user_id` strings of profiles the current user has sent
 * a friend request to. Storing IDs rather than full profiles keeps the
 * persist footprint small — the UI resolves display data from the existing
 * `ALL_FULL_PROFILES` registry in `FriendshipProvider` when needed.
 *
 * **Fail-open policy.** Every read is wrapped in a try/catch. On any JSON
 * parse error (corrupt storage), the helper logs `console.warn` and returns
 * an empty array rather than throwing. This prevents a bad persist from
 * bricking the send-request flow.
 *
 * **Zero React imports.** This module is safe to import from non-React code
 * (tests, migration scripts, CLI tooling).
 *
 * @module features/friendRequests/storage/requestsStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * The AsyncStorage key under which the outgoing-requests array is persisted.
 *
 * The `dummy.` prefix matches the existing SecureStore convention
 * (`dummy.profile`, `dummy.onboarding.complete`) and makes teardown grep-able:
 *
 *   grep -r 'dummy.requests.outgoing' src/
 *
 * Remove this key and replace the storage layer when the real backend ships.
 */
export const OUTGOING_REQUESTS_STORAGE_KEY = 'dummy.requests.outgoing';

// ── Reads ─────────────────────────────────────────────────────────────────────

/**
 * Reads the persisted outgoing-request user-id array from AsyncStorage.
 *
 * Returns an empty array when the key is absent or when the stored value
 * cannot be parsed (fail-open). Never throws.
 *
 * @returns The current outgoing-request user-id array, or `[]` on missing/corrupt data.
 */
export async function getOutgoingRequests(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(OUTGOING_REQUESTS_STORAGE_KEY);
  if (raw === null) {
    return [];
  }
  try {
    return JSON.parse(raw) as string[];
  } catch {
    console.warn(
      '[requestsStorage] getOutgoingRequests: failed to parse stored JSON — returning empty array',
    );
    return [];
  }
}

// ── Writes ────────────────────────────────────────────────────────────────────

/**
 * Overwrites the persisted outgoing-request user-id array with the provided value.
 *
 * Called internally by {@link addOutgoingRequest} and {@link removeOutgoingRequest}.
 * Not typically invoked directly by UI code.
 *
 * @param ids - The full user-id array to persist.
 */
export async function saveOutgoingRequests(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(OUTGOING_REQUESTS_STORAGE_KEY, JSON.stringify(ids));
}

/**
 * Adds a `userId` to the persisted outgoing-request array.
 *
 * Idempotent: if the same `userId` is already present, the array is returned
 * unchanged without a write.
 *
 * @param userId - The `user_id` to record as an outgoing request.
 */
export async function addOutgoingRequest(userId: string): Promise<void> {
  const current = await getOutgoingRequests();
  if (current.includes(userId)) {
    return;
  }
  await saveOutgoingRequests([...current, userId]);
}

/**
 * Removes `userId` from the persisted outgoing-request array.
 *
 * Idempotent: if `userId` is not present, the array is returned unchanged
 * without a write.
 *
 * @param userId - The `user_id` to remove.
 */
export async function removeOutgoingRequest(userId: string): Promise<void> {
  const current = await getOutgoingRequests();
  const filtered = current.filter((id) => id !== userId);
  if (filtered.length === current.length) {
    return;
  }
  await saveOutgoingRequests(filtered);
}

/**
 * Convenience wrapper: returns `true` if `userId` is in the outgoing-requests list.
 *
 * Provided for one-shot checks where the caller does not want to call the
 * provider hook. For frequent reads inside React components, prefer the
 * synchronous `hasOutgoingRequest` returned by `useFriendship()`.
 *
 * @param userId - The `user_id` to check.
 * @returns `true` if an outgoing request exists for `userId`, `false` otherwise.
 */
export async function hasOutgoingRequest(userId: string): Promise<boolean> {
  const ids = await getOutgoingRequests();
  return ids.includes(userId);
}

/**
 * Removes the `dummy.requests.outgoing` key from AsyncStorage entirely.
 *
 * Exposed for tests and the phase-15 teardown checklist. Not called by UI code.
 *
 * Teardown: once the real backend ships, this and the key itself are deleted.
 * See `context.md → Before shipping → Mock-only friend requests + chat pipeline`.
 */
export async function clearOutgoingRequests(): Promise<void> {
  await AsyncStorage.removeItem(OUTGOING_REQUESTS_STORAGE_KEY);
}
