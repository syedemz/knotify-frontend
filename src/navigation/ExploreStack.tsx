/**
 * ExploreStack — nested native stack for the Explore bottom tab.
 *
 * Screens:
 *   - `ExploreHomeScreen` (initial) — Friends + Requests subtabs showing the
 *     current user's friends list and incoming friend requests.
 *   - `OtherProfileScreen` — full profile view pushed from list rows.
 *
 * Both screens own their own headers, so `headerShown` is `false` at the
 * navigator level to prevent double-header rendering.
 *
 * Mirrors the structure of {@link MenuStack} from phase 12.
 *
 * @module navigation/ExploreStack
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ExploreHomeScreen } from '@/features/explore/screens/ExploreHomeScreen';
import { OtherProfileScreen } from '@/features/profile/screens/OtherProfileScreen';
import type { ExploreStackParamList } from './types';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

/**
 * Nested stack navigator for the Explore tab (story 13.5).
 *
 * `ExploreHomeScreen` is the initial route. Tapping any row (friend or
 * pending-request sender) pushes `OtherProfileScreen` with
 * `{ userId, source: 'friend' | 'request' }`.
 *
 * @see {@link ExploreStackParamList} for typed navigation.
 */
export function ExploreStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreHomeScreen" component={ExploreHomeScreen} />
      <Stack.Screen name="OtherProfileScreen" component={OtherProfileScreen} />
    </Stack.Navigator>
  );
}
