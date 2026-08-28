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
 * The stub also captures the `tabBar` render prop passed to `Navigator` so
 * the `CollapsingTabBar` behaviour can be exercised by calling the captured
 * prop with synthetic `BottomTabBarProps` state in subsequent tests.
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
import { render, act } from "@testing-library/react-native";
import { View } from "react-native";

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

// Captured tabBar render prop: set by the Navigator mock so tests can call it
// directly with synthetic BottomTabBarProps.
let capturedTabBarProp: ((props: any) => React.JSX.Element | null) | undefined;

// Mock createBottomTabNavigator to avoid the native Animated driver call
// that BottomTabBar triggers in Jest (React renderer version mismatch).
// The stub renders the first registered screen component unconditionally —
// this is enough to assert that AppTabs wires the correct placeholder screens.
// It also captures the `tabBar` prop so CollapsingTabBar can be tested directly.
jest.mock("@react-navigation/bottom-tabs", () => {
  const Rct = require("react") as typeof import("react");
  const RN = require("react-native") as typeof import("react-native");
  return {
    createBottomTabNavigator: function() {
      // Track registered screens in registration order.
      const screens: any[] = [];
      const Navigator = function(props: any) {
        // Capture the tabBar render prop if provided.
        if (typeof props.tabBar === 'function') {
          capturedTabBarProp = props.tabBar;
        }
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
    // BottomTabBar stub: renders an identifiable testID so tests can detect
    // whether the tab bar was rendered.
    BottomTabBar: function(props: any) {
      return Rct.createElement(RN.View, { testID: "bottom-tab-bar" }, null);
    },
  };
});

// Mock safe-area-context so useSafeAreaInsets returns zero insets (avoids native module).
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
    SafeAreaView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function() { return INSETS; },
    useSafeAreaFrame: function() { return { x: 0, y: 0, width: 375, height: 812 }; },
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

// Mock getFocusedRouteNameFromRoute so we can control nested-route resolution
// in the CollapsingTabBar tests.
const mockGetFocusedRouteNameFromRoute = jest.fn<string | undefined, [any]>();
jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native") as Record<string, unknown>;
  return {
    ...actual,
    getFocusedRouteNameFromRoute: (route: any) => mockGetFocusedRouteNameFromRoute(route),
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import { AppTabs } from "@/navigation/AppTabs";
import { t } from "@/labels";
import { ThemeProvider } from "@/theme";

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderAppTabs() {
  return render(
    <ThemeProvider>
      <AppTabs />
    </ThemeProvider>,
  );
}

/**
 * Build a minimal synthetic BottomTabBarProps-like object for the
 * CollapsingTabBar render-prop tests. Only the `state` fields used by
 * `CollapsingTabBar` are populated.
 */
function makeTabBarProps(tabName: string, route?: Record<string, unknown>) {
  const routeObj = route ?? { name: tabName, key: `${tabName}-key` };
  return {
    state: {
      index: 0,
      routes: [routeObj],
    },
    descriptors: {},
    navigation: {},
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  } as unknown as Parameters<NonNullable<typeof capturedTabBarProp>>[0];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("AppTabs", () => {
  beforeEach(() => {
    capturedTabBarProp = undefined;
    mockGetFocusedRouteNameFromRoute.mockReset();
  });

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

// ── CollapsingTabBar visibility tests ─────────────────────────────────────────
//
// After rendering AppTabs, `capturedTabBarProp` holds the arrow function
// `(props) => <CollapsingTabBar {...props} />` that AppTabs passes as `tabBar`
// to the navigator. Calling it returns a React element — we must render that
// element to observe whether `BottomTabBar` (testID="bottom-tab-bar") is
// mounted or not.
//
// When `CollapsingTabBar` returns `null` (the ChatRoomScreen hide path), the
// element renders nothing and `bottom-tab-bar` is absent.
// When it returns the Animated.View wrapper, `bottom-tab-bar` IS present.

/**
 * Renders the tab-bar element produced by the captured render prop with the
 * given synthetic props and returns the RNTL query utilities.
 */
function renderTabBar(props: Parameters<NonNullable<typeof capturedTabBarProp>>[0]) {
  const element = capturedTabBarProp!(props);
  return render(
    <ThemeProvider>
      {element}
    </ThemeProvider>,
  );
}

describe("CollapsingTabBar — Chat tab + ChatRoomScreen nested route", () => {
  it("given Chat tab focused + ChatRoomScreen nested, then BottomTabBar is NOT rendered (tab bar hidden)", () => {
    renderAppTabs();
    expect(capturedTabBarProp).toBeDefined();

    // Simulate: Chat tab is focused, nested route is ChatRoomScreen.
    mockGetFocusedRouteNameFromRoute.mockReturnValue("ChatRoomScreen");
    const chatTabRoute = {
      name: "Chat",
      key: "chat-key",
      state: { routes: [{ name: "ChatRoomScreen" }], index: 0 },
    };
    const props = makeTabBarProps("Chat", chatTabRoute);

    const { queryByTestId } = renderTabBar(props);

    // CollapsingTabBar returns null → BottomTabBar stub is NOT rendered.
    expect(queryByTestId("bottom-tab-bar")).toBeNull();
  });

  it("given Chat tab focused + ChatListScreen nested, then BottomTabBar IS rendered", () => {
    renderAppTabs();
    expect(capturedTabBarProp).toBeDefined();

    // Simulate: Chat tab is focused, nested route is ChatListScreen.
    mockGetFocusedRouteNameFromRoute.mockReturnValue("ChatListScreen");
    const chatTabRoute = {
      name: "Chat",
      key: "chat-key",
      state: { routes: [{ name: "ChatListScreen" }], index: 0 },
    };
    const props = makeTabBarProps("Chat", chatTabRoute);

    const { queryByTestId } = renderTabBar(props);

    // CollapsingTabBar returns the Animated wrapper → BottomTabBar stub IS rendered.
    expect(queryByTestId("bottom-tab-bar")).not.toBeNull();
  });

  it("given Chat tab focused + getFocusedRouteNameFromRoute returns undefined (defaults to ChatListScreen), then BottomTabBar IS rendered", () => {
    renderAppTabs();
    expect(capturedTabBarProp).toBeDefined();

    // undefined → defaults to 'ChatListScreen' in the implementation.
    mockGetFocusedRouteNameFromRoute.mockReturnValue(undefined);
    const chatTabRoute = {
      name: "Chat",
      key: "chat-key",
      state: { routes: [] },
    };
    const props = makeTabBarProps("Chat", chatTabRoute);

    const { queryByTestId } = renderTabBar(props);

    expect(queryByTestId("bottom-tab-bar")).not.toBeNull();
  });
});

describe("CollapsingTabBar — non-Chat tabs", () => {
  it("given Marriage tab focused, then BottomTabBar IS rendered (not hidden)", () => {
    renderAppTabs();
    expect(capturedTabBarProp).toBeDefined();

    const props = makeTabBarProps("Marriage", { name: "Marriage", key: "marriage-key" });
    const { queryByTestId } = renderTabBar(props);

    expect(queryByTestId("bottom-tab-bar")).not.toBeNull();
  });

  it("given Explore tab focused, then BottomTabBar IS rendered (not hidden)", () => {
    renderAppTabs();
    expect(capturedTabBarProp).toBeDefined();

    const props = makeTabBarProps("Explore", { name: "Explore", key: "explore-key" });
    const { queryByTestId } = renderTabBar(props);

    expect(queryByTestId("bottom-tab-bar")).not.toBeNull();
  });

  it("given Menu tab focused, then BottomTabBar IS rendered (not hidden)", () => {
    renderAppTabs();
    expect(capturedTabBarProp).toBeDefined();

    const props = makeTabBarProps("Menu", { name: "Menu", key: "menu-key" });
    const { queryByTestId } = renderTabBar(props);

    expect(queryByTestId("bottom-tab-bar")).not.toBeNull();
  });
});
