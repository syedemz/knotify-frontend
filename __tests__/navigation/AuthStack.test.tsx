/**
 * Tests for src/navigation/AuthStack.tsx
 *
 * Verifies that placeholder screens render without error and that their
 * `EmptyState` title strings match the expected label keys.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from "react";
import { render } from "@testing-library/react-native";

// ── Module mocks ─────────────────────────────────────────────────────────────

jest.mock("react-native-screens", () => ({
  enableScreens: jest.fn(),
  Screen: "Screen",
  ScreenContainer: "ScreenContainer",
  NativeScreen: "NativeScreen",
  NativeScreenContainer: "NativeScreenContainer",
  ScreenStack: "ScreenStack",
  ScreenStackItem: "ScreenStackItem",
  ScreenStackHeaderConfig: "ScreenStackHeaderConfig",
  compatibilityFlags: {},
  ScreenFooter: "ScreenFooter",
}));

jest.mock("react-native-safe-area-context", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const mockInsetsCtx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function(props: any) {
      return Rct.createElement(
        mockInsetsCtx.Provider,
        { value: INSETS },
        Rct.createElement(RN.View, null, props.children),
      );
    },
    SafeAreaConsumer: function(props: any) { return props.children(INSETS); },
    SafeAreaInsetsContext: mockInsetsCtx,
    useSafeAreaInsets: function() { return INSETS; },
    useSafeAreaFrame: function() { return { x: 0, y: 0, width: 375, height: 812 }; },
    initialWindowMetrics: {
      insets: INSETS,
      frame: { x: 0, y: 0, width: 375, height: 812 },
    },
  };
});

jest.mock("react-native-gesture-handler", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    GestureHandlerRootView: function(props: any) {
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
    gestureHandlerRootHOC: function(C: any) { return C; },
    Directions: {},
    Gesture: {
      Tap: jest.fn(), Pan: jest.fn(), Pinch: jest.fn(), Rotation: jest.fn(),
      Fling: jest.fn(), LongPress: jest.fn(), Exclusive: jest.fn(),
      Simultaneous: jest.fn(), Race: jest.fn(),
    },
    GestureDetector: RN.View,
    NativeViewGestureHandler: RN.View,
    FlingGestureHandler: RN.View,
    ForceTouchGestureHandler: RN.View,
    PinchGestureHandler: RN.View,
    RotationGestureHandler: RN.View,
  };
});

jest.mock("@gorhom/bottom-sheet", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    __esModule: true,
    default: Rct.forwardRef(function(props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetScrollView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetFlatList: RN.View,
    BottomSheetSectionList: RN.View,
    BottomSheetTextInput: RN.View,
    BottomSheetBackdrop: RN.View,
    useBottomSheet: jest.fn(),
    useBottomSheetModal: jest.fn(),
    BottomSheetModal: Rct.forwardRef(function(props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetModalProvider: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
  };
});

jest.mock("react-native-reanimated", () => {
  const m = require("react-native-reanimated/mock");
  m.default.call = jest.fn();
  return m;
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import { NavigationContainer } from "@react-navigation/native";
import { AuthStack } from "@/navigation/AuthStack";
import { t } from "@/labels";
import { ThemeProvider } from "@/theme";

// ── Helper ────────────────────────────────────────────────────────────────────

function renderAuthStack() {
  return render(
    <ThemeProvider>
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    </ThemeProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AuthStack", () => {
  it("given AuthStack renders, then it mounts without throwing", () => {
    expect(() => renderAuthStack()).not.toThrow();
  });

  it("given AuthStack renders, then the Login placeholder shows auth.login.title", async () => {
    const { findByText } = renderAuthStack();

    // Login is the initial route; its EmptyState title is t('auth.login.title').
    await expect(findByText(t("auth.login.title"))).resolves.toBeTruthy();
  });

  it("given AuthStack renders, then the common.notImplemented description is visible", async () => {
    const { findByText } = renderAuthStack();

    await expect(findByText(t("common.notImplemented"))).resolves.toBeTruthy();
  });
});
