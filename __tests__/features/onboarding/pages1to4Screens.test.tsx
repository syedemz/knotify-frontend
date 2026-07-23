/**
 * Wiring tests for Pages 1-4 placeholder screen components (story 2.3).
 *
 * Each screen renders `Screen` + `WizardHeader hideProgress` + a `Text`
 * placeholder. Tests verify:
 * - The screen mounts without throwing.
 * - WizardHeader is present (back button accessible via wizard.header.back label).
 * - The `common.notImplemented` placeholder text is visible.
 *
 * These are wiring tests only — real content ships in stories 2.4-2.7.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from "react";
import { render, screen } from "@testing-library/react-native";

// ── Module mocks ──────────────────────────────────────────────────────────────

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

import { ThemeProvider } from "@/theme";
import { t } from "@/labels";
import { Page01WelcomeScreen } from "@/features/onboarding/screens/Page01WelcomeScreen";
import { Page02EmailScreen } from "@/features/onboarding/screens/Page02EmailScreen";
import { Page03ConfirmCodeScreen } from "@/features/onboarding/screens/Page03ConfirmCodeScreen";
import { Page04GetStartedScreen } from "@/features/onboarding/screens/Page04GetStartedScreen";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal navigation mock — only `goBack` is used by the placeholder screens. */
function mockNavigation() {
  return { goBack: jest.fn() };
}

/** Minimal route mock — no route params on placeholder screens. */
function mockRoute(name: string) {
  return { key: name, name, params: undefined };
}

function renderScreen(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>,
  routeName: string,
) {
  return render(
    <ThemeProvider>
      <Component
        navigation={mockNavigation()}
        route={mockRoute(routeName)}
      />
    </ThemeProvider>,
  );
}

// ── Page01WelcomeScreen ───────────────────────────────────────────────────────

describe("Page01WelcomeScreen (story 2.3 placeholder)", () => {
  it("given Page01WelcomeScreen, then it mounts without throwing", () => {
    expect(() => renderScreen(Page01WelcomeScreen, "Page01WelcomeScreen")).not.toThrow();
  });

  it("given Page01WelcomeScreen, then WizardHeader back button is accessible (hideProgress)", () => {
    renderScreen(Page01WelcomeScreen, "Page01WelcomeScreen");
    expect(screen.getByLabelText(t("wizard.header.back"))).toBeTruthy();
  });

  it("given Page01WelcomeScreen, then common.notImplemented placeholder text is visible", () => {
    renderScreen(Page01WelcomeScreen, "Page01WelcomeScreen");
    expect(screen.getByText(t("common.notImplemented"))).toBeTruthy();
  });
});

// ── Page02EmailScreen ─────────────────────────────────────────────────────────

describe("Page02EmailScreen (story 2.3 placeholder)", () => {
  it("given Page02EmailScreen, then it mounts without throwing", () => {
    expect(() => renderScreen(Page02EmailScreen, "Page02EmailScreen")).not.toThrow();
  });

  it("given Page02EmailScreen, then WizardHeader back button is accessible (hideProgress)", () => {
    renderScreen(Page02EmailScreen, "Page02EmailScreen");
    expect(screen.getByLabelText(t("wizard.header.back"))).toBeTruthy();
  });

  it("given Page02EmailScreen, then common.notImplemented placeholder text is visible", () => {
    renderScreen(Page02EmailScreen, "Page02EmailScreen");
    expect(screen.getByText(t("common.notImplemented"))).toBeTruthy();
  });
});

// ── Page03ConfirmCodeScreen ───────────────────────────────────────────────────

describe("Page03ConfirmCodeScreen (story 2.3 placeholder)", () => {
  it("given Page03ConfirmCodeScreen, then it mounts without throwing", () => {
    expect(() => renderScreen(Page03ConfirmCodeScreen, "Page03ConfirmCodeScreen")).not.toThrow();
  });

  it("given Page03ConfirmCodeScreen, then WizardHeader back button is accessible (hideProgress)", () => {
    renderScreen(Page03ConfirmCodeScreen, "Page03ConfirmCodeScreen");
    expect(screen.getByLabelText(t("wizard.header.back"))).toBeTruthy();
  });

  it("given Page03ConfirmCodeScreen, then common.notImplemented placeholder text is visible", () => {
    renderScreen(Page03ConfirmCodeScreen, "Page03ConfirmCodeScreen");
    expect(screen.getByText(t("common.notImplemented"))).toBeTruthy();
  });
});

// ── Page04GetStartedScreen ────────────────────────────────────────────────────

describe("Page04GetStartedScreen (story 2.3 placeholder)", () => {
  it("given Page04GetStartedScreen, then it mounts without throwing", () => {
    expect(() => renderScreen(Page04GetStartedScreen, "Page04GetStartedScreen")).not.toThrow();
  });

  it("given Page04GetStartedScreen, then WizardHeader back button is accessible (hideProgress)", () => {
    renderScreen(Page04GetStartedScreen, "Page04GetStartedScreen");
    expect(screen.getByLabelText(t("wizard.header.back"))).toBeTruthy();
  });

  it("given Page04GetStartedScreen, then common.notImplemented placeholder text is visible", () => {
    renderScreen(Page04GetStartedScreen, "Page04GetStartedScreen");
    expect(screen.getByText(t("common.notImplemented"))).toBeTruthy();
  });
});
