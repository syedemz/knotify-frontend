/**
 * End-to-end wiring test for `src/navigation/MenuStack.tsx` (story 12.6).
 *
 * Verifies:
 *   (1) Mounting the Menu stack lands on MenuHomeScreen.
 *   (2) Tapping the avatar on MenuHomeScreen navigates to MyProfileScreen.
 *   (3) Calling goBack from MyProfileScreen returns to MenuHomeScreen.
 *
 * Both screen components are replaced with lightweight stubs that render
 * identifiable text and, in the case of MenuHomeScreen, a pressable
 * "avatar" button that triggers navigation. This avoids pulling in the full
 * Reanimated worklet chain, react-native-vision-camera, or the
 * profile-sections render tree.
 *
 * Strategy: render `MenuStack` inside a real `NavigationContainer` so the
 * actual `createNativeStackNavigator` wiring is exercised. Mocked screens
 * confirm that the correct route components are registered.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// ── Screen stubs ──────────────────────────────────────────────────────────────

// MenuHomeScreen stub: renders identifiable text + pressable avatar that
// navigates to MyProfileScreen with { initialTab: 'preview' }.
jest.mock('@/features/profile/screens/MenuHomeScreen', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const Nav = require('@react-navigation/native') as typeof import('@react-navigation/native');
  return {
    MenuHomeScreen: function StubMenuHomeScreen() {
      const navigation = Nav.useNavigation<any>();
      return Rct.createElement(
        RN.View,
        { testID: 'menu-home-screen' },
        Rct.createElement(RN.Text, null, 'MENU_HOME'),
        Rct.createElement(
          RN.Pressable,
          {
            testID: 'stub-avatar',
            onPress: () => navigation.navigate('MyProfileScreen', { initialTab: 'preview' }),
          },
          Rct.createElement(RN.Text, null, 'Avatar'),
        ),
      );
    },
  };
});

// MyProfileScreen stub: renders identifiable text + a pressable back button.
jest.mock('@/features/profile/screens/MyProfileScreen', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const Nav = require('@react-navigation/native') as typeof import('@react-navigation/native');
  return {
    MyProfileScreen: function StubMyProfileScreen() {
      const navigation = Nav.useNavigation<any>();
      return Rct.createElement(
        RN.View,
        { testID: 'my-profile-screen' },
        Rct.createElement(RN.Text, null, 'MY_PROFILE'),
        Rct.createElement(
          RN.Pressable,
          {
            testID: 'stub-go-back',
            onPress: () => navigation.goBack(),
          },
          Rct.createElement(RN.Text, null, 'Back'),
        ),
      );
    },
  };
});

// ── Native module mocks ───────────────────────────────────────────────────────

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  Screen: 'Screen',
  ScreenContainer: 'ScreenContainer',
  NativeScreen: 'NativeScreen',
  NativeScreenContainer: 'NativeScreenContainer',
  ScreenStack: 'ScreenStack',
  ScreenStackItem: 'ScreenStackItem',
  ScreenStackHeaderConfig: 'ScreenStackHeaderConfig',
  compatibilityFlags: {},
  ScreenFooter: 'ScreenFooter',
}));

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function(props: any) {
      return Rct.createElement(
        ctx.Provider,
        { value: INSETS },
        Rct.createElement(RN.View, null, props.children),
      );
    },
    SafeAreaConsumer: function(props: any) { return props.children(INSETS); },
    SafeAreaView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function() { return INSETS; },
    useSafeAreaFrame: function() { return { x: 0, y: 0, width: 375, height: 812 }; },
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    GestureHandlerRootView: function(props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    Swipeable: RN.View, DrawerLayout: RN.View, State: {}, ScrollView: RN.ScrollView,
    Slider: RN.View, Switch: RN.View, TextInput: RN.View, PanGestureHandler: RN.View,
    TapGestureHandler: RN.View, RawButton: RN.View, BaseButton: RN.View, RectButton: RN.View,
    BorderlessButton: RN.View, LongPressGestureHandler: RN.View, FlatList: RN.FlatList,
    gestureHandlerRootHOC: function(C: any) { return C; }, Directions: {},
    Gesture: {
      Tap: jest.fn(), Pan: jest.fn(), Pinch: jest.fn(), Rotation: jest.fn(),
      Fling: jest.fn(), LongPress: jest.fn(), Exclusive: jest.fn(), Simultaneous: jest.fn(), Race: jest.fn(),
    },
    GestureDetector: RN.View, NativeViewGestureHandler: RN.View, FlingGestureHandler: RN.View,
    ForceTouchGestureHandler: RN.View, PinchGestureHandler: RN.View, RotationGestureHandler: RN.View,
  };
});

jest.mock('@gorhom/bottom-sheet', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    __esModule: true,
    default: Rct.forwardRef(function(props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetScrollView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetFlatList: RN.View, BottomSheetSectionList: RN.View, BottomSheetTextInput: RN.View,
    BottomSheetBackdrop: RN.View, useBottomSheet: jest.fn(), useBottomSheetModal: jest.fn(),
    BottomSheetModal: Rct.forwardRef(function(props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetModalProvider: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
  };
});

jest.mock('react-native-reanimated', () => {
  const m = require('react-native-reanimated/mock');
  m.default.call = jest.fn();
  return m;
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Import under test ─────────────────────────────────────────────────────────

import { MenuStack } from '@/navigation/MenuStack';
import { ThemeProvider } from '@/theme';

// ── Helper ────────────────────────────────────────────────────────────────────

function renderMenuStack() {
  return render(
    <ThemeProvider>
      <NavigationContainer>
        <MenuStack />
      </NavigationContainer>
    </ThemeProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MenuStack navigation wiring', () => {
  it(
    'given MenuStack renders, then MenuHomeScreen is the initial route (MENU_HOME text visible)',
    async () => {
      const { findByText } = renderMenuStack();

      await expect(findByText('MENU_HOME')).resolves.toBeTruthy();
    },
  );

  it(
    'given MenuHomeScreen is mounted, when the avatar is tapped, then MyProfileScreen is pushed (MY_PROFILE text visible)',
    async () => {
      const { findByTestId, findByText } = renderMenuStack();

      // Wait for the initial screen to be visible.
      await findByText('MENU_HOME');

      // Tap the stub avatar — triggers navigate('MyProfileScreen', ...).
      const avatarBtn = await findByTestId('stub-avatar');
      await act(async () => {
        fireEvent.press(avatarBtn);
      });

      // MyProfileScreen should now be in the tree.
      await expect(findByText('MY_PROFILE')).resolves.toBeTruthy();
    },
  );

  it(
    'given MyProfileScreen is mounted, when goBack is called, then MenuHomeScreen is restored',
    async () => {
      const { findByTestId, findByText } = renderMenuStack();

      // Navigate to MyProfileScreen first.
      await findByText('MENU_HOME');
      const avatarBtn = await findByTestId('stub-avatar');
      await act(async () => {
        fireEvent.press(avatarBtn);
      });
      await findByText('MY_PROFILE');

      // Press the back button on the stub.
      const backBtn = await findByTestId('stub-go-back');
      await act(async () => {
        fireEvent.press(backBtn);
      });

      // MenuHomeScreen should be restored.
      await expect(findByText('MENU_HOME')).resolves.toBeTruthy();
    },
  );
});
