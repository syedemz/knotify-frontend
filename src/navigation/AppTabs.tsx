/**
 * Main application tab navigator.
 *
 * Registers the four bottom tabs: Marriage, Explore, Chat, Menu.
 * - `Marriage` renders `MarriageLandingScreen` (phase 12.4).
 * - `Explore` and `Chat` remain `EmptyState` placeholders until their
 *   feature phases ship.
 * - `Menu` renders `MenuStack` — a nested native stack that starts at
 *   `MenuHomeScreen` and can push to `MyProfileScreen`.
 *
 * **Tab-bar collapse (Marriage tab only)**
 * The Marriage tab imports `marriageTabBarHidden` (a module-scope Reanimated
 * shared value written by `MarriageLandingScreen`) and binds it to the
 * Marriage screen's `tabBarStyle` via `useAnimatedStyle`. On downward
 * scroll past 8 px, `tabBarHidden` transitions from 0 → 1, which maps to:
 * - `translateY`: 0 → `TAB_BAR_HEIGHT` (slides the bar off-screen)
 * - `opacity`: 1 → 0 (fades simultaneously)
 *
 * @module navigation/AppTabs
 */

import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Heart, Compass, MessageCircle, Menu } from 'lucide-react-native';

import { EmptyState } from '@/components';
import { t } from '@/labels';
import { MarriageLandingScreen } from '@/features/landing/screens/MarriageLandingScreen';
import { MenuStack } from './MenuStack';
import { marriageTabBarHidden } from '@/features/landing/shared/marriageTabBarHidden';
import type { AppTabsParamList } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Height of the native React Navigation tab bar used for the translateY
 * animation. Matches the default height on both iOS and Android.
 */
const TAB_BAR_HEIGHT = 49;

// ---------------------------------------------------------------------------
// Placeholder screens
// ---------------------------------------------------------------------------

/**
 * Placeholder for the Explore tab screen.
 */
function ExploreScreen(): React.JSX.Element {
  return (
    <EmptyState
      title={t('nav.tabs.explore')}
      description={t('common.notImplemented')}
    />
  );
}

/**
 * Placeholder for the Chat tab screen.
 */
function ChatScreen(): React.JSX.Element {
  return (
    <EmptyState
      title={t('nav.tabs.chat')}
      description={t('common.notImplemented')}
    />
  );
}

// ---------------------------------------------------------------------------
// Menu tab icon
// ---------------------------------------------------------------------------

/**
 * Props for the menu tab avatar icon.
 */
interface MenuTabIconProps {
  uri: string;
  color: string;
  size: number;
}

/**
 * Renders the user's avatar cropped to a 24×24 circle.
 * Falls back to the `Menu` lucide icon if the image fails to load.
 */
function MenuTabIcon({ uri, color, size }: MenuTabIconProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <Menu color={color} size={size} />;
  }

  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <Image
        source={{ uri }}
        style={{ width: 24, height: 24 }}
        onError={() => setFailed(true)}
        accessibilityLabel={t('nav.tabs.menu')}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

const Tab = createBottomTabNavigator<AppTabsParamList>();

// Resolve the avatar URI for the Menu tab icon at module load. The dummy
// profile's first photo is used as the tab icon; if unavailable we fall
// through to the Menu lucide fallback inside MenuTabIcon.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dummyprofile = require('../../assets/dummyprofile.json') as {
  photos?: string[];
  photo_url?: string;
};
const menuAvatarUri: string =
  (dummyprofile.photos?.[0] ?? dummyprofile.photo_url) ?? '';

/**
 * Bottom-tab navigator for the authenticated main application.
 *
 * Tabs: `Marriage` / `Explore` / `Chat` / `Menu`.
 * Mounted when `status === 'authenticated' && profileComplete === true`
 * (or when the mock-only onboarding completion flag is set in phase 12).
 *
 * @see {@link AppTabsParamList} for typed navigation.
 */
export function AppTabs(): React.JSX.Element {
  // Animated style applied to the Marriage tab's `tabBarStyle`.
  // Maps `marriageTabBarHidden` (0–1) → translateY (0 → TAB_BAR_HEIGHT)
  // and opacity (1 → 0) so the native tab bar collapses on downward scroll.
  const marriageTabBarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: marriageTabBarHidden.value * TAB_BAR_HEIGHT },
    ],
    opacity: 1 - marriageTabBarHidden.value,
  }));

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Marriage"
        component={MarriageLandingScreen}
        options={{
          tabBarLabel: t('nav.tabs.marriage'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Heart color={color} size={size} />
          ),
          // Bind the tab bar's style to the Reanimated shared value so it
          // collapses on downward scroll within MarriageLandingScreen.
          tabBarStyle: marriageTabBarStyle as object,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarLabel: t('nav.tabs.explore'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Compass color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: t('nav.tabs.chat'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MessageCircle color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuStack}
        options={{
          tabBarLabel: t('nav.tabs.menu'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MenuTabIcon uri={menuAvatarUri} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
