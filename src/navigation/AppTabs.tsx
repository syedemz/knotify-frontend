/**
 * Main application tab navigator.
 *
 * Registers the four bottom tabs: Marriage, Explore, Chat, Menu.
 * - `Marriage` renders `MarriageLandingScreen` (phase 12.4).
 * - `Explore` renders `ExploreStack` (phase 13.5) — a nested native stack
 *   with Friends + Requests subtabs and OtherProfileScreen.
 * - `Chat` remains an `EmptyState` placeholder until its feature phase ships.
 * - `Menu` renders `MenuStack` — a nested native stack that starts at
 *   `MenuHomeScreen` and can push to `MyProfileScreen`.
 *
 * **Tab-bar collapse (Marriage tab only)**
 * A custom `tabBar` prop wraps the default `BottomTabBar` in an
 * `Animated.View`. The wrapper reads `marriageTabBarHidden` (a module-scope
 * Reanimated shared value written by `MarriageLandingScreen`) via
 * `useAnimatedStyle`. When the focused route is `Marriage` and the user
 * scrolls down past 8 px, `marriageTabBarHidden` transitions from 0 → 1,
 * which maps to:
 * - `translateY`: 0 → `TAB_BAR_HEIGHT` (slides the bar off-screen)
 * - `opacity`: 1 → 0 (fades simultaneously)
 * On any other focused route the transform is forced to identity so the
 * bar always stays visible on Explore / Chat / Menu regardless of the
 * shared value's last written state.
 *
 * The custom-`tabBar` approach avoids the RN-Navigation-7 crash where
 * passing a Reanimated animated style directly into `screenOptions.tabBarStyle`
 * triggers "attempted to set the key 'current' with the value undefined on an
 * object that is meant to be immutable and has been frozen" — RN freezes the
 * screen options object, then Reanimated tries to attach a view ref to it.
 *
 * @module navigation/AppTabs
 */

import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createBottomTabNavigator,
  BottomTabBar,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Heart, Compass, MessageCircle, Menu } from 'lucide-react-native';

import { EmptyState } from '@/components';
import { t } from '@/labels';
import { MarriageLandingScreen } from '@/features/landing/screens/MarriageLandingScreen';
import { MenuStack } from './MenuStack';
import { ExploreStack } from './ExploreStack';
import { marriageTabBarHidden } from '@/features/landing/shared/marriageTabBarHidden';
import { resolveDummyPhoto } from '@/assets/dummyPhotoRegistry';
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
  source: number | { uri: string } | undefined;
  color: string;
  size: number;
}

/**
 * Renders the user's avatar cropped to a 24×24 circle.
 * Falls back to the `Menu` lucide icon if the image fails to load or the
 * source could not be resolved.
 */
function MenuTabIcon({ source, color, size }: MenuTabIconProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);

  if (failed || source === undefined) {
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
        source={source}
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

// Resolve the avatar source for the Menu tab icon at module load. The
// dummy profile's first photo path (a bundled asset like
// "assets/male/Male1.png") is looked up in the shared photo registry so
// Metro's asset resolver can serve the real bundled file — passing the
// raw string through `<Image source={{ uri }}>` renders nothing on device.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dummyprofile = require('../../assets/dummyprofile.json') as {
  photos?: string[];
  photo_url?: string;
};
const menuAvatarPath: string | undefined =
  dummyprofile.photos?.[0] ?? dummyprofile.photo_url;
const menuAvatarSource = resolveDummyPhoto(menuAvatarPath);

/**
 * Custom tab bar. Wraps the default `BottomTabBar` in an `Animated.View`
 * whose transform reads `marriageTabBarHidden` only when the currently
 * focused route is `Marriage`. Any other focused route pins the transform
 * to identity so the bar remains visible on Explore / Chat / Menu.
 */
function CollapsingTabBar(props: BottomTabBarProps): React.JSX.Element {
  const focusedRoute = props.state.routes[props.state.index]?.name;
  const insets = useSafeAreaInsets();
  // The tab bar's rendered height includes the bottom safe-area inset
  // (Android gesture-bar padding / iOS home-indicator). Translating by the
  // full amount slides the ENTIRE bar off-screen — otherwise the safe-area
  // padding would remain visible as a white strip after the labels leave.
  const totalHiddenDistance = TAB_BAR_HEIGHT + insets.bottom;

  const animatedStyle = useAnimatedStyle(() => {
    // Marriage tab writes to the shared value from MarriageLandingScreen's
    // scroll handler. Explore tab writes to the SAME shared value from
    // OtherProfileScreen's scroll handler (phase 13). ExploreHomeScreen
    // itself does not write — OtherProfileScreen resets the value to 0 on
    // mount + unmount so ExploreHomeScreen always sees the bar visible.
    const participates =
      focusedRoute === 'Marriage' || focusedRoute === 'Explore';
    const hidden = participates ? marriageTabBarHidden.value : 0;
    return {
      transform: [{ translateY: hidden * totalHiddenDistance }],
      opacity: 1 - hidden,
    };
  }, [focusedRoute, totalHiddenDistance]);

  // Absolute overlay: React Navigation would otherwise shrink each screen
  // container to sit ABOVE the tab bar. That means an absolute-positioned
  // child (like the action bar) with `bottom: 0` is pinned to the tab bar's
  // TOP edge, not the physical screen bottom — so no translation can push it
  // into the tab bar's vacated space. Overlaying the bar lets screens fill
  // the full physical height, and the action bar's collapse geometry works.
  return (
    <Animated.View style={[styles.overlay, animatedStyle]}>
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

const styles = {
  overlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

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
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CollapsingTabBar {...props} />}
    >
      <Tab.Screen
        name="Marriage"
        component={MarriageLandingScreen}
        options={{
          tabBarLabel: t('nav.tabs.marriage'),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Heart color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreStack}
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
            <MenuTabIcon source={menuAvatarSource} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
