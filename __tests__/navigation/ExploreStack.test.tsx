/**
 * End-to-end wiring test for `src/navigation/ExploreStack.tsx` (story 13.5).
 *
 * Verifies:
 *   (1) Mounting the Explore stack lands on ExploreHomeScreen.
 *   (2) Tapping a row on ExploreHomeScreen navigates to OtherProfileScreen.
 *   (3) Calling goBack from OtherProfileScreen returns to ExploreHomeScreen.
 *
 * Both screen components are replaced with lightweight stubs that render
 * identifiable text and, in the case of ExploreHomeScreen, a pressable
 * "friend row" button that triggers navigation. This avoids pulling in the full
 * FriendshipProvider, react-native-reanimated, or the profile-sections render tree.
 *
 * Strategy: render `ExploreStack` inside a real `NavigationContainer` so the
 * actual `createNativeStackNavigator` wiring is exercised. Mocked screens
 * confirm that the correct route components are registered.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';

// ── Screen stubs ──────────────────────────────────────────────────────────────

// ExploreHomeScreen stub: renders identifiable text + pressable row that
// navigates to OtherProfileScreen with { userId: 'test-user', source: 'friend' }.
jest.mock('@/features/explore/screens/ExploreHomeScreen', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const Nav = require('@react-navigation/native') as typeof import('@react-navigation/native');
  return {
    ExploreHomeScreen: function StubExploreHomeScreen() {
      const navigation = Nav.useNavigation<any>();
      return Rct.createElement(
        RN.View,
        { testID: 'explore-home-screen' },
        Rct.createElement(RN.Text, null, 'EXPLORE_HOME'),
        Rct.createElement(
          RN.Pressable,
          {
            testID: 'stub-friend-row',
            onPress: () =>
              navigation.navigate('OtherProfileScreen', {
                userId: 'test-user',
                source: 'friend',
              }),
          },
          Rct.createElement(RN.Text, null, 'Friend Row'),
        ),
      );
    },
  };
});

// OtherProfileScreen stub: renders identifiable text + a pressable back button.
jest.mock('@/features/profile/screens/OtherProfileScreen', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const Nav = require('@react-navigation/native') as typeof import('@react-navigation/native');
  return {
    OtherProfileScreen: function StubOtherProfileScreen() {
      const navigation = Nav.useNavigation<any>();
      return Rct.createElement(
        RN.View,
        { testID: 'other-profile-screen' },
        Rct.createElement(RN.Text, null, 'OTHER_PROFILE'),
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
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(
        ctx.Provider,
        { value: INSETS },
        Rct.createElement(RN.View, null, props.children),
      );
    },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () { return INSETS; },
    useSafeAreaFrame: function () {
      return { x: 0, y: 0, width: 375, height: 812 };
    },
    initialWindowMetrics: {
      insets: INSETS,
      frame: { x: 0, y: 0, width: 375, height: 812 },
    },
  };
});

jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    GestureHandlerRootView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    Swipeable: RN.View,
    DrawerLayout: RN.View,
    State: {},
    ScrollView: RN.ScrollView,
    Slider: RN.View,
    Switch: RN.View,
    TextInput: RN.View,
    PanGestureHandler: RN.View,
    TapGestureHandler: RN.View,
    RawButton: RN.View,
    BaseButton: RN.View,
    RectButton: RN.View,
    BorderlessButton: RN.View,
    LongPressGestureHandler: RN.View,
    FlatList: RN.FlatList,
    gestureHandlerRootHOC: function (C: any) { return C; },
    Directions: {},
    Gesture: {
      Tap: jest.fn(),
      Pan: jest.fn(),
      Pinch: jest.fn(),
      Rotation: jest.fn(),
      Fling: jest.fn(),
      LongPress: jest.fn(),
      Exclusive: jest.fn(),
      Simultaneous: jest.fn(),
      Race: jest.fn(),
    },
    GestureDetector: RN.View,
    NativeViewGestureHandler: RN.View,
    FlingGestureHandler: RN.View,
    ForceTouchGestureHandler: RN.View,
    PinchGestureHandler: RN.View,
    RotationGestureHandler: RN.View,
  };
});

jest.mock('@gorhom/bottom-sheet', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    __esModule: true,
    default: Rct.forwardRef(function (props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    BottomSheetScrollView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    BottomSheetFlatList: RN.View,
    BottomSheetSectionList: RN.View,
    BottomSheetTextInput: RN.View,
    BottomSheetBackdrop: RN.View,
    useBottomSheet: jest.fn(),
    useBottomSheetModal: jest.fn(),
    BottomSheetModal: Rct.forwardRef(function (props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetModalProvider: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
  };
});

jest.mock('react-native-reanimated', () => {
  const m = require('react-native-reanimated/mock');
  m.default.call = jest.fn();
  return m;
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Import under test ─────────────────────────────────────────────────────────

import { ExploreStack } from '@/navigation/ExploreStack';
import { ThemeProvider } from '@/theme';

// ── Helper ────────────────────────────────────────────────────────────────────

function renderExploreStack() {
  return render(
    <ThemeProvider>
      <NavigationContainer>
        <ExploreStack />
      </NavigationContainer>
    </ThemeProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ExploreStack navigation wiring', () => {
  it(
    'given ExploreStack renders, then ExploreHomeScreen is the initial route (EXPLORE_HOME text visible)',
    async () => {
      const { findByText } = renderExploreStack();

      await expect(findByText('EXPLORE_HOME')).resolves.toBeTruthy();
    },
  );

  it(
    'given ExploreHomeScreen is mounted, when a friend row is tapped, then OtherProfileScreen is pushed (OTHER_PROFILE text visible)',
    async () => {
      const { findByTestId, findByText } = renderExploreStack();

      // Wait for the initial screen to be visible.
      await findByText('EXPLORE_HOME');

      // Tap the stub friend row — triggers navigate('OtherProfileScreen', ...).
      const rowBtn = await findByTestId('stub-friend-row');
      await act(async () => {
        fireEvent.press(rowBtn);
      });

      // OtherProfileScreen should now be in the tree.
      await expect(findByText('OTHER_PROFILE')).resolves.toBeTruthy();
    },
  );

  it(
    'given OtherProfileScreen is mounted, when goBack is called, then ExploreHomeScreen is restored',
    async () => {
      const { findByTestId, findByText } = renderExploreStack();

      // Navigate to OtherProfileScreen first.
      await findByText('EXPLORE_HOME');
      const rowBtn = await findByTestId('stub-friend-row');
      await act(async () => {
        fireEvent.press(rowBtn);
      });
      await findByText('OTHER_PROFILE');

      // Press the back button on the stub.
      const backBtn = await findByTestId('stub-go-back');
      await act(async () => {
        fireEvent.press(backBtn);
      });

      // ExploreHomeScreen should be restored.
      await expect(findByText('EXPLORE_HOME')).resolves.toBeTruthy();
    },
  );
});
