/**
 * Tests for src/navigation/AppTabs.tsx
 *
 * Verifies that the four-tab navigator renders identifiable screen content
 * for its initial tab (Marriage) and that the navigator itself mounts cleanly.
 *
 * The `@react-navigation/bottom-tabs` `BottomTabBar` triggers a native
 * Animated driver call in Jest which causes a React version mismatch.
 * To work around this, we mock `createBottomTabNavigator` with a lightweight
 * stub that renders only the initial screen — sufficient to assert that
 * `AppTabs` passes the correct screen components to the navigator.
 *
 * `MarriageLandingScreen` and `MenuStack` are mocked with lightweight stubs
 * so the test does not pull in the Reanimated worklet chain or the full
 * profile-sections tree.
 */

// Mock factory bodies cannot use TypeScript type annotations that reference
// out-of-scope names. All parameters in factory bodies use explicit `unknown`
// or are cast via require() references.
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from "react";
import { render } from "@testing-library/react-native";

// ── Module mocks ──────────────────────────────────────────────────────────────

// Stub MarriageLandingScreen so the first-tab render is lightweight.
jest.mock("@/features/landing/screens/MarriageLandingScreen", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    MarriageLandingScreen: function MockMarriageLandingScreen() {
      return Rct.createElement(
        RN.Text,
        { testID: "marriage-landing-screen" },
        "MARRIAGE_SCREEN",
      );
    },
  };
});

// Stub MenuStack to avoid pulling in the nested stack navigator chain.
jest.mock("@/navigation/MenuStack", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    MenuStack: function MockMenuStack() {
      return Rct.createElement(RN.Text, { testID: "menu-stack" }, "MENU_STACK");
    },
  };
});

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

// react-native-reanimated is handled by moduleNameMapper in jest.config.js
// (redirects to __mocks__/react-native-reanimated.js). No jest.mock() needed.

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

  it("given AppTabs renders, then the Marriage tab screen is visible (initial tab)", () => {
    const { queryByTestId } = renderAppTabs();

    // The mock navigator renders the first registered screen (MarriageLandingScreen
    // stub). We assert the stub's testID is present to confirm that the
    // Marriage tab is registered first and its component is mounted.
    expect(queryByTestId("marriage-landing-screen")).not.toBeNull();
  });

  it("given AppTabs renders, then nav.tabs.marriage label is declared in labels", () => {
    // Confirm the new label key resolves to a non-empty string.
    expect(t("nav.tabs.marriage")).toBeTruthy();
  });
});
