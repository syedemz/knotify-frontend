/**
 * Cross-tab navigation integration test for `ChatStack` (story 15.5 — S1).
 *
 * Verifies that a component inside the Menu stack can navigate cross-tab to
 * `ChatRoomScreen` using the nested param form:
 *
 *   `navigation.navigate('Chat', { screen: 'ChatRoomScreen', params: { friendUserId } })`
 *
 * This is the exact call `RequestAcceptedModal.onSayHi` makes in story 15.7.
 * Validating it here ensures the type surface and NavigationContainer wiring
 * are correct end-to-end through the actual navigators — no jest.fn() spy.
 *
 * Strategy (per S1 spec):
 * - Real `NavigationContainer` + real `createBottomTabNavigator` with two tabs:
 *   Chat and Menu.
 * - Real `ChatStack` (with all leaf screens stubbed) so the navigator hierarchy
 *   is exercised.
 * - A custom Menu stack (single screen: `MenuCrossTabScreen`) whose stub renders
 *   a "Say Hi" button. Pressing it fires the exact nested navigate call.
 * - The ChatRoomScreen stub renders the received `friendUserId` param as text.
 * - Test presses the button and asserts the Chat stub renders with the expected
 *   `friendUserId` — NO jest.fn() spy.
 *
 * Following the `MenuStack.test.tsx` / `ExploreStack.test.tsx` boilerplate
 * pattern verbatim where possible.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Screen stubs ──────────────────────────────────────────────────────────────

// ChatListScreen stub: renders identifiable text only.
jest.mock('@/features/chat/screens/ChatListScreen', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    ChatListScreen: function StubChatListScreen() {
      return Rct.createElement(
        RN.View,
        { testID: 'stub-chat-list-screen' },
        Rct.createElement(RN.Text, null, 'CHAT_LIST'),
      );
    },
  };
});

// ChatRoomScreen stub: reads `friendUserId` from route params and renders it.
jest.mock('@/features/chat/screens/ChatRoomScreen', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const Nav = require('@react-navigation/native') as typeof import('@react-navigation/native');
  return {
    ChatRoomScreen: function StubChatRoomScreen() {
      const route = Nav.useRoute<any>();
      const friendUserId: string =
        (route.params as { friendUserId?: string } | undefined)?.friendUserId ?? '';
      return Rct.createElement(
        RN.View,
        { testID: 'stub-chat-room-screen' },
        Rct.createElement(RN.Text, null, 'CHAT_ROOM'),
        Rct.createElement(
          RN.Text,
          { testID: 'stub-chat-room-friend-id' },
          friendUserId,
        ),
      );
    },
  };
});

// ── Native module mocks (verbatim from MenuStack.test.tsx) ────────────────────

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

// ── Imports ───────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from '@/theme';
import { ChatStack } from '@/navigation/ChatStack';

// ── Test constants ────────────────────────────────────────────────────────────

/** The friendUserId the Menu stub passes in the cross-tab navigate call. */
const TEST_FRIEND_ID = 'mehvish-cross-tab-test-id';

// ── Test-local "Menu" stub stack ──────────────────────────────────────────────
//
// A minimal single-screen stack for the Menu tab. The one screen renders a
// "Say Hi" button that fires the exact nested navigate call described in S1.
// This avoids pulling in FriendshipProvider, MyProfileScreen, or any real
// profile state.

type MenuCrossTabParamList = { MenuCrossTabScreen: undefined };
const MenuCrossTabNav = createNativeStackNavigator<MenuCrossTabParamList>();

/**
 * Stub screen inside the Menu tab. Fires the cross-tab navigate on button press.
 */
function MenuCrossTabScreen(): React.ReactElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  return (
    <View testID="stub-menu-crosstab-screen">
      <Text>MENU_CROSS_TAB</Text>
      <Pressable
        testID="stub-say-hi-btn"
        onPress={() =>
          navigation.navigate('Chat', {
            screen: 'ChatRoomScreen',
            params: { friendUserId: TEST_FRIEND_ID },
          })
        }
      >
        <Text>Say Hi</Text>
      </Pressable>
    </View>
  );
}

function MenuCrossTabStack(): React.JSX.Element {
  return (
    <MenuCrossTabNav.Navigator screenOptions={{ headerShown: false }}>
      <MenuCrossTabNav.Screen
        name="MenuCrossTabScreen"
        component={MenuCrossTabScreen}
      />
    </MenuCrossTabNav.Navigator>
  );
}

// ── Test-local tab navigator ──────────────────────────────────────────────────

type TestTabParamList = {
  Chat: undefined;
  Menu: undefined;
};

const Tab = createBottomTabNavigator<TestTabParamList>();

function TestApp(): React.JSX.Element {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
          <Tab.Screen name="Chat" component={ChatStack} />
          <Tab.Screen name="Menu" component={MenuCrossTabStack} />
        </Tab.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatStack cross-tab navigation (S1 — story 15.5)', () => {
  it(
    'given the app is on the Chat tab, then ChatListScreen is the initial route (CHAT_LIST visible)',
    async () => {
      const { findByText } = render(<TestApp />);
      await expect(findByText('CHAT_LIST')).resolves.toBeTruthy();
    },
  );

  it(
    'given a Menu-stack screen fires navigate("Chat", { screen: "ChatRoomScreen", params: { friendUserId } }), then ChatRoomScreen renders with the expected friendUserId param',
    async () => {
      const { findByText, findByTestId, getByTestId } = render(<TestApp />);

      // App starts on Chat tab.
      await findByText('CHAT_LIST');

      // Switch to the Menu tab.
      const menuTab = await findByText('Menu');
      await act(async () => {
        fireEvent.press(menuTab);
      });

      // The Menu stub screen is now visible.
      await findByText('MENU_CROSS_TAB');

      // Press the "Say Hi" button — fires the exact nested cross-tab navigate.
      const sayHiBtn = await findByTestId('stub-say-hi-btn');
      await act(async () => {
        fireEvent.press(sayHiBtn);
      });

      // The ChatRoomScreen stub should now be rendered on the Chat tab.
      await findByText('CHAT_ROOM');

      // Assert the friendUserId param arrived correctly (end-to-end through the
      // real navigator — NO jest.fn() spy used for this assertion).
      const friendIdEl = getByTestId('stub-chat-room-friend-id');
      expect(friendIdEl.props.children).toBe(TEST_FRIEND_ID);
    },
  );
});
