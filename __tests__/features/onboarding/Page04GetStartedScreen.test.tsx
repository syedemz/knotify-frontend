/**
 * Wiring tests for Page04GetStartedScreen (story 2.7).
 *
 * Covers:
 * - Screen mounts without error.
 * - Banner image is rendered (via expo-image testID).
 * - "Get started" button is visible and always enabled.
 * - Tapping "Get started" navigates to `Page05SexScreen`.
 * - WizardHeader back button is accessible (hideProgress, no progress bar).
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";

// ── Module mocks must appear before any import of the module under test ────────
// Note: jest.mock calls are hoisted to the top of the file by babel-jest.
// @gorhom/bottom-sheet is mocked first because react-native-reanimated/mock
// transitively imports it and must find a mock in place, not the real native module.

jest.mock("react-native-safe-area-context", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
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
    SafeAreaConsumer: function (props: any) {
      return props.children(INSETS);
    },
    SafeAreaView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () {
      return INSETS;
    },
    useSafeAreaFrame: function () {
      return { x: 0, y: 0, width: 375, height: 812 };
    },
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
    gestureHandlerRootHOC: function (C: any) {
      return C;
    },
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

jest.mock("@gorhom/bottom-sheet", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
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

jest.mock("react-native-reanimated", () => {
  const m = require("react-native-reanimated/mock");
  m.default.call = jest.fn();
  return m;
});

jest.mock("expo-image", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    Image: function (props: any) {
      return Rct.createElement(RN.Image, {
        source: props.source,
        accessibilityLabel: props.accessibilityLabel ?? "",
        testID: "expo-image",
      });
    },
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ─────────────────────────────────────────────────────────

import { ThemeProvider } from "@/theme";
import { t } from "@/labels";
import { Page04GetStartedScreen } from "@/features/onboarding/screens/Page04GetStartedScreen";

// ── Test helpers ───────────────────────────────────────────────────────────────

function mockNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

function mockRoute() {
  return {
    key: "Page04GetStartedScreen",
    name: "Page04GetStartedScreen" as const,
    params: undefined,
  };
}

function renderScreen(nav = mockNavigation()) {
  return {
    nav,
    ...render(
      <ThemeProvider>
        <Page04GetStartedScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

// ── Mount ──────────────────────────────────────────────────────────────────────

describe("Page04GetStartedScreen — mount", () => {
  it("given Page04GetStartedScreen, when rendered, then it mounts without throwing", () => {
    expect(() => renderScreen()).not.toThrow();
  });
});

// ── Banner image ───────────────────────────────────────────────────────────────

describe("Page04GetStartedScreen — banner image", () => {
  it("given the screen renders, then the banner image is present", () => {
    renderScreen();
    // expo-image mock renders with testID="expo-image"
    expect(screen.getByTestId("expo-image")).toBeTruthy();
  });

  it("given the screen renders, then the banner image has the correct accessibility label", () => {
    renderScreen();
    expect(screen.getByLabelText("Onboarding banner")).toBeTruthy();
  });
});

// ── WizardHeader (hideProgress) ────────────────────────────────────────────────

describe("Page04GetStartedScreen — WizardHeader", () => {
  it("given the screen renders, then the WizardHeader back button is accessible", () => {
    renderScreen();
    expect(screen.getByLabelText(t("wizard.header.back"))).toBeTruthy();
  });

  it("given WizardHeader back is pressed, then navigation.goBack is called", () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText(t("wizard.header.back")));
    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });
});

// ── Get started button ─────────────────────────────────────────────────────────

describe("Page04GetStartedScreen — Get started button", () => {
  it("given the screen renders, then 'Get started' button is visible", () => {
    renderScreen();
    expect(screen.getByText(t("onboarding.getStarted.button"))).toBeTruthy();
  });

  it("given the screen renders, then 'Get started' button is enabled (never disabled)", () => {
    renderScreen();
    const btn = screen.getByLabelText(t("onboarding.getStarted.button"));
    // The button is enabled when accessibilityState.disabled is false or undefined.
    const disabled = btn.props.accessibilityState?.disabled;
    expect(disabled).toBeFalsy();
  });

  it("given 'Get started' is tapped, then navigates to Page05SexScreen", () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByText(t("onboarding.getStarted.button")));
    expect(nav.navigate).toHaveBeenCalledWith("Page05SexScreen");
    expect(nav.navigate).toHaveBeenCalledTimes(1);
  });

  it("given 'Get started' is tapped, then does NOT advance any checkpoint", () => {
    // No useOnboardingDraft is imported into the screen — there is nothing to
    // assert here beyond navigation firing without side effects. This test
    // documents the intent explicitly: checkpoint advance is out of scope for
    // page 4 (first checkpoint is page 9, delivered in phase 3).
    const { nav } = renderScreen();
    fireEvent.press(screen.getByText(t("onboarding.getStarted.button")));
    expect(nav.navigate).toHaveBeenCalledWith("Page05SexScreen");
  });
});
