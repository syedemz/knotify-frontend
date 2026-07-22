/**
 * Tests for src/navigation/AppTabs.tsx
 *
 * Verifies that the four-tab placeholder navigator renders identifiable
 * screen content for its initial tab (Discover).
 *
 * The `@react-navigation/bottom-tabs` `BottomTabBar` triggers a native
 * Animated driver call in Jest which causes a React version mismatch.
 * To work around this, we mock `createBottomTabNavigator` with a lightweight
 * stub that renders only the initial screen — sufficient to assert that
 * `AppTabs` passes the correct screen components to the navigator.
 */

// Mock factory bodies cannot use TypeScript type annotations that reference
// out-of-scope names. All parameters in factory bodies use explicit `unknown`
// or are cast via require() references.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from "react";
import { render } from "@testing-library/react-native";

// ── Module mocks ──────────────────────────────────────────────────────────────

// Mock @gorhom/bottom-sheet to prevent the gesture-handler native chain.
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
    BottomSheetFlatList: RN.View, BottomSheetSectionList: RN.View, BottomSheetTextInput: RN.View,
    BottomSheetBackdrop: RN.View, useBottomSheet: jest.fn(), useBottomSheetModal: jest.fn(),
    BottomSheetModal: Rct.forwardRef(function(props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetModalProvider: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
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

jest.mock("react-native-reanimated", () => {
  const m = require("react-native-reanimated/mock");
  m.default.call = jest.fn();
  return m;
});

// Mock createBottomTabNavigator to avoid the native Animated driver call
// that BottomTabBar triggers in Jest (React renderer version mismatch).
// The stub renders the first registered screen component unconditionally —
// this is enough to assert that AppTabs wires the correct placeholder screens.
jest.mock("@react-navigation/bottom-tabs", () => {
  const Rct = require("react") as typeof import("react");
  const RN = require("react-native") as typeof import("react-native");
  return {
    createBottomTabNavigator: function() {
      // Track registered screens in registration order.
      const screens: any[] = [];
      const Navigator = function(props: any) {
        Rct.Children.forEach(props.children, function(child: any) {
          if (child && child.props && child.props.component) {
            screens.push(child.props.component);
          }
        });
        if (screens.length === 0) return null;
        const FirstScreen = screens[0] as React.ComponentType;
        return Rct.createElement(RN.View, { testID: "tab-navigator" }, Rct.createElement(FirstScreen, null));
      };
      const Screen = function() { return null; };
      Navigator.displayName = "MockTabNavigator";
      Screen.displayName = "MockTabScreen";
      return { Navigator: Navigator, Screen: Screen };
    },
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import { AppTabs } from "@/navigation/AppTabs";
import { t } from "@/labels";
import { ThemeProvider } from "@/theme";

// ── Helper ────────────────────────────────────────────────────────────────────

function renderAppTabs() {
  return render(
    <ThemeProvider>
      <AppTabs />
    </ThemeProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AppTabs", () => {
  it("given AppTabs renders, then it mounts without throwing", () => {
    expect(() => renderAppTabs()).not.toThrow();
  });

  it("given AppTabs renders, then the Discover tab placeholder is visible (initial tab)", () => {
    const { queryByText } = renderAppTabs();

    // The mock navigator renders the first registered screen (Discover).
    // DiscoverScreen's EmptyState title is t('nav.tabs.discover').
    expect(queryByText(t("nav.tabs.discover"))).not.toBeNull();
  });

  it("given AppTabs renders, then the common.notImplemented description is visible", () => {
    const { queryByText } = renderAppTabs();

    expect(queryByText(t("common.notImplemented"))).not.toBeNull();
  });
});
