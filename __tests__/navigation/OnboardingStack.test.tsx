/**
 * Tests for src/navigation/OnboardingStack.tsx
 *
 * Verifies that the 31-page placeholder stack renders the initial page
 * without throwing.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from "react";
import { render } from "@testing-library/react-native";

// ── Module mocks (same pattern as AuthStack.test.tsx) ────────────────────────

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
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function(props: any) {
      return Rct.createElement(ctx.Provider, { value: INSETS }, Rct.createElement(RN.View, null, props.children));
    },
    SafeAreaConsumer: function(props: any) { return props.children(INSETS); },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function() { return INSETS; },
    useSafeAreaFrame: function() { return { x: 0, y: 0, width: 375, height: 812 }; },
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

jest.mock("react-native-gesture-handler", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    GestureHandlerRootView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
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

jest.mock("@gorhom/bottom-sheet", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    __esModule: true,
    default: Rct.forwardRef(function(props: any, _ref: any) { return Rct.createElement(RN.View, null, props.children); }),
    BottomSheetView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetScrollView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetFlatList: RN.View, BottomSheetSectionList: RN.View, BottomSheetTextInput: RN.View,
    BottomSheetBackdrop: RN.View, useBottomSheet: jest.fn(), useBottomSheetModal: jest.fn(),
    BottomSheetModal: Rct.forwardRef(function(props: any, _ref: any) { return Rct.createElement(RN.View, null, props.children); }),
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
import { OnboardingStack } from "@/navigation/OnboardingStack";
import { t } from "@/labels";
import { ThemeProvider } from "@/theme";

// ── Helper ────────────────────────────────────────────────────────────────────

function renderOnboardingStack() {
  return render(
    <ThemeProvider>
      <NavigationContainer>
        <OnboardingStack />
      </NavigationContainer>
    </ThemeProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("OnboardingStack", () => {
  it("given OnboardingStack renders, then it mounts without throwing", () => {
    expect(() => renderOnboardingStack()).not.toThrow();
  });

  it("given OnboardingStack renders, then Page01 placeholder title is visible", async () => {
    const { findByText } = renderOnboardingStack();

    // Page01 is the initial route; the placeholder renders its route name.
    await expect(findByText("Page01")).resolves.toBeTruthy();
  });

  it("given OnboardingStack renders, then the common.notImplemented description is visible", async () => {
    const { findByText } = renderOnboardingStack();

    await expect(findByText(t("common.notImplemented"))).resolves.toBeTruthy();
  });
});
