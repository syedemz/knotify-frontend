/**
 * ChatStack — nested native stack for the Chat bottom tab.
 *
 * Screens:
 *   - `ChatListScreen` (initial) — WhatsApp-style list of friends with last
 *     message + timestamp.
 *   - `ChatRoomScreen` — per-friend message thread. A placeholder returning
 *     `null` in story 15.4; story 15.5 replaces it with the real screen.
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
 * `ChatListScreen` is the initial route. Tapping a friend row pushes
 * `ChatRoomScreen` with `{ friendUserId }`. The `ChatRoomScreen` is a
 * placeholder in story 15.4 — story 15.5 ships the real implementation.
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
