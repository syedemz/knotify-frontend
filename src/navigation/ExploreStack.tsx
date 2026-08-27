/**
 * ExploreStack — nested native stack for the Explore bottom tab.
 *
 * Screens:
 *   - `ExploreHomeScreen` (initial) — Friends + Requests + Bookmarks subtabs.
 *   - `OtherProfileScreen` — full profile view pushed from friend/request rows.
 *   - `BookmarkDeckViewScreen` — full deck view for a bookmarked profile.
 *
 * All screens own their own headers, so `headerShown` is `false` at the
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
import { BookmarkDeckViewScreen } from '@/features/bookmarks/screens/BookmarkDeckViewScreen';
import type { ExploreStackParamList } from './types';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

/**
 * Nested stack navigator for the Explore tab.
 *
 * `ExploreHomeScreen` is the initial route. Tapping a friend/request row
 * pushes `OtherProfileScreen`; tapping a bookmark card pushes
 * `BookmarkDeckViewScreen`.
 *
 * @see {@link ExploreStackParamList} for typed navigation.
 */
export function ExploreStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreHomeScreen" component={ExploreHomeScreen} />
      <Stack.Screen name="OtherProfileScreen" component={OtherProfileScreen} />
      <Stack.Screen
        name="BookmarkDeckViewScreen"
        component={BookmarkDeckViewScreen}
      />
    </Stack.Navigator>
  );
}
