/**
 * Chat-room open helper — shared between all UI surfaces that need to
 * navigate the user into a per-room chat thread.
 *
 * Story 16.5: `chatRoomExistsForUser` is deleted (the `createOrGetRoom` mutation
 * is idempotent on the server — a client-side existence check is redundant).
 * `useOpenChatRoom` now internally resolves `userId → roomId` via
 * `useCreateOrGetRoomMutation.mutateAsync`, then navigates.
 *
 * Callsites (unchanged call shape — they call `useOpenChatRoom()` to get a
 * callback and invoke it with a `userId`):
 * - `OtherProfileScreen` (Explore tab) — FloatingChatButton onPress.
 * - `MyProfileScreen` (Menu tab) — `RequestAcceptedModal.onSayHi`.
 *
 * Future surfaces (deck card "message" button, notification tap, etc.)
 * MUST use this hook rather than inlining navigation directly.
 *
 * @module features/chat/navigation/openChatRoom
 */

import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCreateOrGetRoomMutation } from '@/features/chat/api';
import type { AppTabsParamList } from '@/navigation/types';

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Hook returning a stable async callback that opens the ChatRoom for a given
 * `userId`.
 *
 * Internally resolves `userId → roomId` via
 * `useCreateOrGetRoomMutation.mutateAsync({ otherUserId: userId })` (the
 * server's `createOrGetRoom` mutation is idempotent — it returns the existing
 * room if one already exists, or creates a new one). Once the `roomId` is
 * resolved, navigates to `ChatRoomScreen` with `{ roomId }`.
 *
 * Uses `AppTabsParamList` typing so the nested navigate call type-checks from
 * any tab (`navigate('Chat', { screen: 'ChatRoomScreen', params: {...} })`).
 *
 * @returns An async callback `(userId: string) => Promise<void>`. Navigation
 *   is not invoked if `mutateAsync` throws — the error propagates to the
 *   caller as a rejected promise.
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
  const createOrGetRoom = useCreateOrGetRoomMutation();

  return useCallback(
    async (userId: string): Promise<void> => {
      const room = await createOrGetRoom.mutateAsync({ otherUserId: userId });
      navigation.navigate('Chat', {
        screen: 'ChatRoomScreen',
        params: { roomId: room.roomId },
      });
    },
    [createOrGetRoom, navigation],
  );
}
