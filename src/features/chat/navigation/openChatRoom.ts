/**
 * Chat-room open helper — shared between all UI surfaces that need to
 * navigate the user into a per-friend chat room.
 *
 * Callsites (as of phase 15):
 * - `OtherProfileScreen` (Explore tab) — `FloatingChatButton` onPress.
 * - `MyProfileScreen` (Menu tab) — `RequestAcceptedModal.onSayHi`.
 *
 * Future surfaces (deck card "message" button, notification tap, etc.)
 * MUST use this hook rather than inlining the nested navigate call.
 *
 * @module features/chat/navigation/openChatRoom
 */

import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { AppTabsParamList } from '@/navigation/types';

// ---------------------------------------------------------------------------
// Existence check
// ---------------------------------------------------------------------------

/**
 * Check whether a chatroom exists for the given user.
 *
 * TODO(mock-only): currently a dummy that returns `true` always. Once
 * the real backend ships (phase 17), replace with:
 *   1. Local AsyncStorage lookup at CHAT_HISTORY_KEY_PREFIX + userId
 *      (fast synchronous path for cached rooms).
 *   2. Backend query (e.g. `GET /rooms/{userId}`) if not in cache.
 *   3. If neither exists, either create the room server-side first
 *      (POST /rooms) then return true, or return false and let the
 *      caller decide how to handle "no room yet."
 * See `context.md → Before shipping → Mock-only friend requests +
 * chat pipeline` for the full teardown checklist.
 *
 * @param userId - The user_id of the friend whose chat room to check.
 * @returns A promise resolving to `true` when the room exists (or should
 *   be created), `false` when the room cannot be opened.
 */
export async function chatRoomExistsForUser(userId: string): Promise<boolean> {
  // Suppress unused-parameter lint warning without changing the signature.
  void userId;
  return true;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook returning a stable callback that opens the ChatRoom for a given
 * userId. Handles the existence check and the cross-tab navigation.
 *
 * Uses `AppTabsParamList` typing so the nested navigate call type-checks
 * from any tab (`navigate('Chat', { screen: 'ChatRoomScreen', params: {...} })`).
 *
 * @returns An async callback `(userId: string) => Promise<void>`. When the
 *   existence check returns `false`, navigate is NOT called and a warning is
 *   logged. Once the real backend ships, the check will verify the room
 *   against AsyncStorage and/or the backend before navigating.
 *
 * @example
 * ```tsx
 * const openChatRoom = useOpenChatRoom();
 * // In an event handler:
 * void openChatRoom(profile.user_id);
 * ```
 */
export function useOpenChatRoom(): (userId: string) => Promise<void> {
  const navigation = useNavigation<NativeStackNavigationProp<AppTabsParamList>>();

  return useCallback(
    async (userId: string): Promise<void> => {
      const exists = await chatRoomExistsForUser(userId);
      if (!exists) {
        console.warn(
          '[openChatRoom] chatRoomExistsForUser returned false for userId:',
          userId,
          '— navigation aborted.',
        );
        return;
      }
      navigation.navigate('Chat', {
        screen: 'ChatRoomScreen',
        params: { friendUserId: userId },
      });
    },
    [navigation],
  );
}
