/**
 * MenuStack — nested native stack for the Menu bottom tab.
 *
 * Screens:
 *   - `MenuHomeScreen` (initial) — the Menu-tab home showing the own-profile
 *     summary, engagement cards, and membership info.
 *   - `MyProfileScreen` — the full own-profile preview + edit shell.
 *
 * Both screens own their own headers, so `headerShown` is `false` at the
 * navigator level to prevent double-header rendering.
 *
 * @module navigation/MenuStack
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MenuHomeScreen } from '@/features/profile/screens/MenuHomeScreen';
import { MyProfileScreen } from '@/features/profile/screens/MyProfileScreen';
import type { MenuStackParamList } from './types';

const Stack = createNativeStackNavigator<MenuStackParamList>();

/**
 * Nested stack navigator for the Menu tab.
 *
 * `MenuHomeScreen` is the initial route. The avatar tap on
 * `MenuHomeScreen` pushes `MyProfileScreen` with `{ initialTab: 'preview' }`;
 * the Edit pill pushes it with `{ initialTab: 'edit' }`.
 *
 * @see {@link MenuStackParamList} for typed navigation.
 */
export function MenuStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MenuHomeScreen" component={MenuHomeScreen} />
      <Stack.Screen name="MyProfileScreen" component={MyProfileScreen} />
    </Stack.Navigator>
  );
}
