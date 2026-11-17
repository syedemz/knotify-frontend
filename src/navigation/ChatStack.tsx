/**
 * ChatStack — nested native stack for the Chat bottom tab.
 *
 * Screens:
 *   - `ChatListScreen` (initial) — WhatsApp-style list of chat rooms with last
 *     message + timestamp.
 *   - `ChatRoomScreen` — per-room message thread (story 15.5); switched to
 *     `roomId` route param in story 16.5.
 *
 * Both screens own their own headers, so `headerShown` is `false` at the
 * navigator level to prevent double-header rendering.
 *
 * Mirrors the structure of {@link ExploreStack} and {@link MenuStack}.
 *
 * @module navigation/ChatStack
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ChatListScreen } from '@/features/chat/screens/ChatListScreen';
import { ChatRoomScreen } from '@/features/chat/screens/ChatRoomScreen';
import type { ChatStackParamList } from './types';

const Stack = createNativeStackNavigator<ChatStackParamList>();

/**
 * Nested stack navigator for the Chat tab.
 *
 * `ChatListScreen` is the initial route. Tapping a room row pushes
 * `ChatRoomScreen` with `{ roomId }` (story 16.5 switched from friendUserId).
 * The `ChatRoomScreen` initial shell shipped in story 15.5.
 *
 * @see {@link ChatStackParamList} for typed navigation.
 */
export function ChatStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatListScreen" component={ChatListScreen} />
      <Stack.Screen name="ChatRoomScreen" component={ChatRoomScreen} />
    </Stack.Navigator>
  );
}
